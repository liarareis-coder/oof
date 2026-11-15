import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { getRankInfo, type RankId } from './shared/ranks.ts';
import type { SaveMatchRecord, SaveProfile } from './utils/saveSystem.ts';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationTypeValue = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationTypeValue;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationTypeValue,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Verify Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  exp: number;
  rankId: RankId;
  rankedWins: number;
  rankedMatches: number;
  totalGoals: number;
}

function sanitizeDisplayName(name: string): string {
  const trimmed = name.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : 'Jogador';
}

export async function loadCloudSave(uid: string): Promise<SaveProfile | null> {
  const path = `saves/${uid}`;
  try {
    const ref = doc(db, 'saves', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();

    const matchesPath = `saves/${uid}/matches`;
    let recentMatches: SaveMatchRecord[] = [];
    try {
      const mSnap = await getDocs(
        query(collection(db, 'saves', uid, 'matches'), orderBy('createdAt', 'desc'), limit(12))
      );
      recentMatches = mSnap.docs.map((d) => {
        const md = d.data();
        const ts = md.createdAt instanceof Timestamp ? md.createdAt.toMillis() : Date.now();
        return {
          id: d.id,
          mode: md.mode,
          isRanked: Boolean(md.isRanked),
          teamSize:
            md.teamSize === 8 ? 8 : md.teamSize === 4 ? 4 : md.teamSize === 2 ? 2 : 1,
          blueScore: Number(md.blueScore || 0),
          redScore: Number(md.redScore || 0),
          result: md.result === 'win' || md.result === 'loss' ? md.result : 'draw',
          expDelta: Number(md.expDelta || 0),
          rankAfter: md.rankAfter as RankId,
          createdAt: ts,
        };
      });
    } catch (matchErr) {
      handleFirestoreError(matchErr, OperationType.LIST, matchesPath);
    }

    const updatedMs =
      data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now();
    const exp = Math.max(0, Math.floor(Number(data.exp || 0)));

    return {
      displayName: sanitizeDisplayName(String(data.displayName || 'Jogador')),
      language:
        data.language === 'pt-PT' || data.language === 'en-US' || data.language === 'es'
          ? data.language
          : 'pt-BR',
      exp,
      rankId: getRankInfo(exp).tier.id,
      rankedWins: Math.max(0, Math.floor(Number(data.rankedWins || 0))),
      rankedLosses: Math.max(0, Math.floor(Number(data.rankedLosses || 0))),
      rankedDraws: Math.max(0, Math.floor(Number(data.rankedDraws || 0))),
      totalMatches: Math.max(0, Math.floor(Number(data.totalMatches || 0))),
      totalGoals: Math.max(0, Math.floor(Number(data.totalGoals || 0))),
      preferredMode:
        data.preferredMode === '2p' ||
        data.preferredMode === 'training' ||
        data.preferredMode === 'online'
          ? data.preferredMode
          : '1p',
      preferredTeamSize:
        data.preferredTeamSize === 8
          ? 8
          : data.preferredTeamSize === 4
          ? 4
          : data.preferredTeamSize === 2
          ? 2
          : 1,
      muted: Boolean(data.muted),
      lastSavedAt: updatedMs,
      recentMatches,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function writeCloudSave(uid: string, profile: SaveProfile): Promise<void> {
  const savePath = `saves/${uid}`;
  const safeName = sanitizeDisplayName(profile.displayName);
  const exp = Math.max(0, Math.floor(profile.exp));
  const rankId = getRankInfo(exp).tier.id;

  try {
    const saveRef = doc(db, 'saves', uid);
    const existingSnap = await getDoc(saveRef);
    const createdAtVal = existingSnap.exists()
      ? existingSnap.data().createdAt
      : serverTimestamp();

    await setDoc(saveRef, {
      uid,
      displayName: safeName,
      language: profile.language,
      exp,
      rankId,
      rankedWins: Math.max(0, Math.floor(profile.rankedWins)),
      rankedLosses: Math.max(0, Math.floor(profile.rankedLosses)),
      rankedDraws: Math.max(0, Math.floor(profile.rankedDraws)),
      totalMatches: Math.max(0, Math.floor(profile.totalMatches)),
      totalGoals: Math.max(0, Math.floor(profile.totalGoals)),
      preferredMode: profile.preferredMode,
      preferredTeamSize: profile.preferredTeamSize,
      muted: Boolean(profile.muted),
      createdAt: createdAtVal,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, savePath);
  }

  // Also sync PII-free public leaderboard entry
  const lbPath = `leaderboard/${uid}`;
  try {
    const lbRef = doc(db, 'leaderboard', uid);
    await setDoc(lbRef, {
      uid,
      displayName: safeName,
      exp,
      rankId,
      rankedWins: Math.max(0, Math.floor(profile.rankedWins)),
      rankedMatches: Math.max(
        0,
        Math.floor(profile.rankedWins + profile.rankedLosses + profile.rankedDraws)
      ),
      totalGoals: Math.max(0, Math.floor(profile.totalGoals)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, lbPath);
  }
}

export async function recordCloudMatch(
  uid: string,
  record: SaveMatchRecord
): Promise<void> {
  const matchPath = `saves/${uid}/matches/${record.id}`;
  try {
    const ref = doc(db, 'saves', uid, 'matches', record.id);
    await setDoc(ref, {
      uid,
      mode: record.mode,
      isRanked: Boolean(record.isRanked),
      teamSize: record.teamSize,
      blueScore: Math.min(99, Math.max(0, Math.floor(record.blueScore))),
      redScore: Math.min(99, Math.max(0, Math.floor(record.redScore))),
      result: record.result,
      expDelta: Math.min(500, Math.max(-200, Math.floor(record.expDelta))),
      rankAfter: record.rankAfter,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, matchPath);
  }
}

export async function fetchRankedLeaderboard(maxCount = 20): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('exp', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const exp = Math.max(0, Math.floor(Number(data.exp || 0)));
      return {
        uid: String(data.uid || d.id),
        displayName: sanitizeDisplayName(String(data.displayName || 'Jogador')),
        exp,
        rankId: getRankInfo(exp).tier.id,
        rankedWins: Math.max(0, Math.floor(Number(data.rankedWins || 0))),
        rankedMatches: Math.max(0, Math.floor(Number(data.rankedMatches || 0))),
        totalGoals: Math.max(0, Math.floor(Number(data.totalGoals || 0))),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
