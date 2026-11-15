import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  Dumbbell,
  Globe,
  Languages,
  Pause,
  Play,
  RotateCcw,
  Save,
  Shield,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import stadiumBackdrop from './assets/images/stadium_turf_backdrop_1794695697038.jpg';
import { ActionButton } from './components/ActionButton.tsx';
import { DevModeModal } from './components/DevModeModal.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton.tsx';
import { SaveRankModal } from './components/SaveRankModal.tsx';
import { VirtualJoystick } from './components/VirtualJoystick.tsx';
import {
  fetchRankedLeaderboard,
  loadCloudSave,
  recordCloudMatch,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  writeCloudSave,
  type LeaderboardEntry,
} from './firebase.ts';
import {
  formatT,
  getLocalizedRankName,
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
  type Language,
} from './i18n/translations.ts';
import {
  createInitialGameState,
  DEFAULT_DEV_HACKS,
  DRIBBLE_COOLDOWN,
  EMOTE_OPTIONS,
  EMPTY_INPUT,
  MAX_OVERTIMES,
  stepGameState,
  type ActiveEmote,
  type DevHacksConfig,
  type GameMode,
  type GameState,
  type MatchPhase,
  type MatchWinner,
  type PlayerInput,
  type Team,
  type TeamSize,
} from './shared/gameEngine.ts';
import { getRankInfo, RANK_TIERS, type RankId } from './shared/ranks.ts';
import {
  loadLocalSave,
  mergeCloudAndLocalSave,
  resetLocalSave,
  saveLocalProfile,
  type SaveMatchRecord,
  type SaveProfile,
} from './utils/saveSystem.ts';
import { soundFX } from './utils/sound.ts';

type AppScreen = 'MENU' | 'ONLINE_LOBBY' | 'PLAYING';

interface HudSnapshot {
  blueScore: number;
  redScore: number;
  timeRemaining: number;
  overtimeCount: number;
  phase: MatchPhase;
  winner: MatchWinner;
  blueDribbleCdRatio: number;
  redDribbleCdRatio: number;
  myDribbleCdRatio: number;
  blueStamina: number;
  blueStaminaExhausted: boolean;
  blueShootCharge: number;
  redStamina: number;
  redStaminaExhausted: boolean;
  redShootCharge: number;
  myStamina: number;
  myStaminaExhausted: boolean;
  myShootCharge: number;
  blueName: string;
  redName: string;
  p1Label: string;
  p2Label: string;
}

interface LobbySlotInfo {
  slot: string;
  name: string;
  isAI: boolean;
  exp?: number;
  rankId?: RankId;
}

interface LobbyState {
  roomCode: string;
  teamSize: TeamSize;
  isRanked: boolean;
  hostName: string;
  isHost: boolean;
  isReady: boolean;
  yourSlot: string;
  yourTeam: Team;
  bluePlayers: LobbySlotInfo[];
  redPlayers: LobbySlotInfo[];
  humanCount: number;
  maxHumans: number;
}

interface RankedMatchSummary {
  result: 'win' | 'loss' | 'draw';
  expDelta: number;
  nextExp: number;
  prevRankId: RankId;
  nextRankId: RankId;
  promoted: boolean;
}

function formatClock(seconds: number): string {
  const ceilSec = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(ceilSec / 60);
  const secs = ceilSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [saveProfile, setSaveProfile] = useState<SaveProfile>(() => loadLocalSave());
  const [language, setLanguage] = useState<Language>(() => loadLocalSave().language);
  const t = TRANSLATIONS[language];

  const [screen, setScreen] = useState<AppScreen>('MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    () => loadLocalSave().preferredMode
  );
  const [teamSize, setTeamSize] = useState<TeamSize>(
    () => loadLocalSave().preferredTeamSize
  );
  const [localBlueName, setLocalBlueName] = useState('Jogador 1');
  const [localRedName, setLocalRedName] = useState('Jogador 2');
  const [muted, setMuted] = useState(() => loadLocalSave().muted);
  const [paused, setPaused] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Save & Cloud Sync & Leaderboard Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Developer Mode / Hacks State
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devHacks, setDevHacks] = useState<DevHacksConfig>(() => ({
    ...DEFAULT_DEV_HACKS,
  }));
  const devHacksRef = useRef<DevHacksConfig>(devHacks);
  devHacksRef.current = devHacks;

  // Emote Chat State
  const [emoteFeed, setEmoteFeed] = useState<ActiveEmote[]>([]);
  const activeEmotesRef = useRef<ActiveEmote[]>([]);

  // Online Multiplayer & Ranked State
  const [playerName, setPlayerName] = useState(() => loadLocalSave().displayName);
  const [isRankedQueue, setIsRankedQueue] = useState(true);
  const [onlineMatchIsRanked, setOnlineMatchIsRanked] = useState(false);
  const [rankedSummary, setRankedSummary] = useState<RankedMatchSummary | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [searchingQuickMatch, setSearchingQuickMatch] = useState(false);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [onlineSlot, setOnlineSlot] = useState<string>('blue-1');

  const wsRef = useRef<WebSocket | null>(null);
  const onlineSlotRef = useRef<string>('blue-1');
  const saveProfileRef = useRef<SaveProfile>(saveProfile);
  saveProfileRef.current = saveProfile;
  const firebaseUserRef = useRef<FirebaseUser | null>(firebaseUser);
  firebaseUserRef.current = firebaseUser;
  const localMatchRecordedRef = useRef<boolean>(false);

  // Simulation state ref (read at 60fps by Canvas)
  const gameStateRef = useRef<GameState>(
    createInitialGameState({ mode: '1p', teamSize: 1 })
  );

  const [hud, setHud] = useState<HudSnapshot>({
    blueScore: 0,
    redScore: 0,
    timeRemaining: 90,
    overtimeCount: 0,
    phase: 'KICKOFF',
    winner: null,
    blueDribbleCdRatio: 0,
    redDribbleCdRatio: 0,
    myDribbleCdRatio: 0,
    blueStamina: 100,
    blueStaminaExhausted: false,
    blueShootCharge: 0,
    redStamina: 100,
    redStaminaExhausted: false,
    redShootCharge: 0,
    myStamina: 100,
    myStaminaExhausted: false,
    myShootCharge: 0,
    blueName: 'Você',
    redName: 'IA Rival',
    p1Label: 'Jogador 1',
    p2Label: 'Jogador 2',
  });

  // Input sources: touch/virtual joysticks + keyboard
  const touchP1Ref = useRef<PlayerInput>({ ...EMPTY_INPUT });
  const touchP2Ref = useRef<PlayerInput>({ ...EMPTY_INPUT });
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Mirror keyboard state for joystick & button visual indicators
  const [p1KeyVec, setP1KeyVec] = useState({ x: 0, y: 0 });
  const [p2KeyVec, setP2KeyVec] = useState({ x: 0, y: 0 });
  const [p1KeyButtons, setP1KeyButtons] = useState({
    shoot: false,
    dribble: false,
    pass: false,
    sprint: false,
  });
  const [p2KeyButtons, setP2KeyButtons] = useState({
    shoot: false,
    dribble: false,
    pass: false,
    sprint: false,
  });

  const pushEmote = useCallback((emote: ActiveEmote) => {
    const cutoff = Date.now() - 3600;
    const pruned = activeEmotesRef.current.filter((e) => e.createdAt > cutoff);
    const next = [...pruned, emote].slice(-10);
    activeEmotesRef.current = next;
    setEmoteFeed(next.slice(-3));
    soundFX.playEmote();
  }, []);

  // Expire visible corner emote feed automatically
  useEffect(() => {
    if (emoteFeed.length === 0) return;
    const timer = setInterval(() => {
      const cutoff = Date.now() - 3500;
      const pruned = activeEmotesRef.current.filter((e) => e.createdAt > cutoff);
      activeEmotesRef.current = pruned;
      setEmoteFeed(pruned.slice(-3));
    }, 350);
    return () => clearInterval(timer);
  }, [emoteFeed.length]);

  const syncHudFromState = useCallback((st: GameState) => {
    const b1 = st.players.find((p) => p.id === 'blue-1');
    const r1 = st.players.find((p) => p.id === 'red-1');
    const blueCtrlId = st.controlMap?.['blue-1'] ?? 'blue-1';
    const redCtrlId = st.controlMap?.['red-1'] ?? 'red-1';
    const myCtrlId =
      st.mode === 'online'
        ? st.controlMap?.[onlineSlotRef.current] ?? onlineSlotRef.current
        : blueCtrlId;

    const blueCtrl = st.players.find((p) => p.id === blueCtrlId) ?? b1;
    const redCtrl = st.players.find((p) => p.id === redCtrlId) ?? r1;
    const mine = st.players.find((p) => p.id === myCtrlId) ?? b1;

    const p1Label = st.humanNames?.['blue-1'] ?? b1?.name ?? 'Jogador 1';
    const p2Label = st.humanNames?.['red-1'] ?? r1?.name ?? 'Jogador 2';

    const blueName =
      st.teamSize > 1
        ? st.mode === '2p'
          ? `${p1Label} (${st.teamSize}v${st.teamSize})`
          : `Time Azul (${st.teamSize}v${st.teamSize})`
        : p1Label;
    const redName =
      st.teamSize > 1
        ? st.mode === '2p'
          ? `${p2Label} (${st.teamSize}v${st.teamSize})`
          : `Time Vermelho (${st.teamSize}v${st.teamSize})`
        : p2Label;

    setHud({
      blueScore: st.score.blue,
      redScore: st.score.red,
      timeRemaining: st.timeRemaining,
      overtimeCount: st.overtimeCount,
      phase: st.phase,
      winner: st.winner,
      blueDribbleCdRatio: blueCtrl ? blueCtrl.dribbleCooldown / DRIBBLE_COOLDOWN : 0,
      redDribbleCdRatio: redCtrl ? redCtrl.dribbleCooldown / DRIBBLE_COOLDOWN : 0,
      myDribbleCdRatio: mine ? mine.dribbleCooldown / DRIBBLE_COOLDOWN : 0,
      blueStamina: blueCtrl ? blueCtrl.stamina : 100,
      blueStaminaExhausted: blueCtrl ? blueCtrl.staminaExhausted : false,
      blueShootCharge: blueCtrl && blueCtrl.isChargingShoot ? blueCtrl.shootCharge : 0,
      redStamina: redCtrl ? redCtrl.stamina : 100,
      redStaminaExhausted: redCtrl ? redCtrl.staminaExhausted : false,
      redShootCharge: redCtrl && redCtrl.isChargingShoot ? redCtrl.shootCharge : 0,
      myStamina: mine ? mine.stamina : 100,
      myStaminaExhausted: mine ? mine.staminaExhausted : false,
      myShootCharge: mine && mine.isChargingShoot ? mine.shootCharge : 0,
      blueName,
      redName,
      p1Label,
      p2Label,
    });
  }, []);

  useEffect(() => {
    soundFX.setMuted(muted);
  }, [muted]);

  const showSaveToast = useCallback((msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => {
      setSaveFeedback((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const persistProfile = useCallback(
    (updater: (prev: SaveProfile) => SaveProfile, syncCloud = false) => {
      const nextRaw = updater(saveProfileRef.current);
      const saved = saveLocalProfile(nextRaw);
      saveProfileRef.current = saved;
      setSaveProfile(saved);
      if (syncCloud && firebaseUserRef.current) {
        void writeCloudSave(firebaseUserRef.current.uid, saved).catch((err) => {
          console.error(err);
        });
      }
      return saved;
    },
    []
  );

  // Subscribe to Firebase Auth and auto-merge cloud save on sign-in
  useEffect(() => {
    const unsub = subscribeAuth(async (user) => {
      setFirebaseUser(user);
      firebaseUserRef.current = user;
      if (user) {
        setCloudBusy(true);
        try {
          const cloud = await loadCloudSave(user.uid);
          if (cloud) {
            const merged = mergeCloudAndLocalSave(saveProfileRef.current, cloud);
            const saved = saveLocalProfile(merged);
            saveProfileRef.current = saved;
            setSaveProfile(saved);
            setPlayerName(saved.displayName);
            await writeCloudSave(user.uid, saved);
          } else {
            const nameFromAuth =
              user.displayName?.trim().slice(0, 16) || saveProfileRef.current.displayName;
            const prepared = saveLocalProfile({
              ...saveProfileRef.current,
              displayName: nameFromAuth,
            });
            saveProfileRef.current = prepared;
            setSaveProfile(prepared);
            setPlayerName(prepared.displayName);
            await writeCloudSave(user.uid, prepared);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCloudBusy(false);
        }
      }
    });
    return () => unsub();
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const list = await fetchRankedLeaderboard(25);
      setLeaderboard(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const cycleLanguage = () => {
    const idx = LANGUAGE_OPTIONS.findIndex((l) => l.id === language);
    const nextLang = LANGUAGE_OPTIONS[(idx + 1) % LANGUAGE_OPTIONS.length].id;
    setLanguage(nextLang);
    persistProfile((prev) => ({ ...prev, language: nextLang }), true);
  };

  const handleSelectLanguage = (nextLang: Language) => {
    setLanguage(nextLang);
    persistProfile((prev) => ({ ...prev, language: nextLang }), true);
  };

  const handleUpdateDisplayName = (nextName: string) => {
    setPlayerName(nextName);
    setSaveProfile((prev) => ({ ...prev, displayName: nextName }));
  };

  const handleManualSaveNow = async () => {
    const saved = persistProfile(
      (prev) => ({
        ...prev,
        displayName: playerName.trim().slice(0, 16) || 'Jogador',
        language,
        preferredMode: selectedMode,
        preferredTeamSize: teamSize,
        muted,
      }),
      false
    );
    if (firebaseUser) {
      setCloudBusy(true);
      try {
        await writeCloudSave(firebaseUser.uid, saved);
        showSaveToast(t.saveFeedbackSynced);
      } catch (err) {
        console.error(err);
        showSaveToast(t.saveFeedbackSaved);
      } finally {
        setCloudBusy(false);
      }
    } else {
      showSaveToast(t.saveFeedbackSaved);
    }
  };

  const handleManualLoadSave = async () => {
    if (firebaseUser) {
      setCloudBusy(true);
      try {
        const cloud = await loadCloudSave(firebaseUser.uid);
        const local = loadLocalSave();
        const loaded = cloud ? mergeCloudAndLocalSave(local, cloud) : local;
        const saved = saveLocalProfile(loaded);
        setSaveProfile(saved);
        setPlayerName(saved.displayName);
        setLanguage(saved.language);
        setSelectedMode(saved.preferredMode);
        setTeamSize(saved.preferredTeamSize);
        setMuted(saved.muted);
        showSaveToast(t.saveFeedbackLoaded);
        return;
      } catch (err) {
        console.error(err);
      } finally {
        setCloudBusy(false);
      }
    }
    const local = loadLocalSave();
    setSaveProfile(local);
    setPlayerName(local.displayName);
    setLanguage(local.language);
    setSelectedMode(local.preferredMode);
    setTeamSize(local.preferredTeamSize);
    setMuted(local.muted);
    showSaveToast(t.saveFeedbackLoaded);
  };

  const handleResetSave = async () => {
    const fresh = resetLocalSave(language);
    setSaveProfile(fresh);
    setPlayerName(fresh.displayName);
    if (firebaseUser) {
      setCloudBusy(true);
      try {
        await writeCloudSave(firebaseUser.uid, fresh);
      } catch (err) {
        console.error(err);
      } finally {
        setCloudBusy(false);
      }
    }
    showSaveToast(t.saveFeedbackReset);
  };

  const handleSignInGoogle = async () => {
    setCloudBusy(true);
    try {
      await signInWithGoogle();
      showSaveToast(t.saveFeedbackSynced);
    } catch (err) {
      console.error(err);
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSignOutGoogle = async () => {
    setCloudBusy(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSyncCloudNow = async () => {
    if (!firebaseUser) return;
    setCloudBusy(true);
    try {
      const saved = saveLocalProfile({
        ...saveProfile,
        displayName: playerName.trim().slice(0, 16) || 'Jogador',
        language,
        preferredMode: selectedMode,
        preferredTeamSize: teamSize,
        muted,
      });
      setSaveProfile(saved);
      await writeCloudSave(firebaseUser.uid, saved);
      showSaveToast(t.saveFeedbackSynced);
      void refreshLeaderboard();
    } catch (err) {
      console.error(err);
    } finally {
      setCloudBusy(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundFX.setMuted(next);
    persistProfile((prev) => ({ ...prev, muted: next }), false);
  };

  const handleSendEmote = useCallback(
    (emoteId: string, senderSlot?: 'blue-1' | 'red-1') => {
      const option = EMOTE_OPTIONS.find((e) => e.id === emoteId);
      if (!option) return;

      const st = gameStateRef.current;
      if (st.mode === 'online') {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'send_emote', emoteId }));
        }
        return;
      }

      const baseSlot = st.mode === '2p' && senderSlot === 'red-1' ? 'red-1' : 'blue-1';
      const senderTeam: Team = baseSlot === 'red-1' ? 'red' : 'blue';
      const activeId = st.controlMap?.[baseSlot] ?? baseSlot;
      const senderPlayer =
        st.players.find((p) => p.id === activeId) ??
        st.players.find((p) => p.id === baseSlot);

      pushEmote({
        uid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        playerId: activeId,
        senderName:
          st.humanNames?.[baseSlot] ??
          senderPlayer?.name ??
          (senderTeam === 'blue' ? 'Jogador 1' : 'Jogador 2'),
        team: senderTeam,
        emoji: option.emoji,
        label: option.label,
        createdAt: Date.now(),
      });
    },
    [pushEmote]
  );

  // Compute merged keyboard + virtual joystick inputs
  const computeCombinedInputs = useCallback(
    (mode: GameMode, slot: string): Record<string, PlayerInput> => {
      const keys = keysPressedRef.current;

      // Player 1 keyboard (WASD + F/G/E; in non-2P modes also Arrows + Space/Shift/C)
      let k1x = 0;
      let k1y = 0;
      if (keys.has('KeyA')) k1x -= 1;
      if (keys.has('KeyD')) k1x += 1;
      if (keys.has('KeyW')) k1y -= 1;
      if (keys.has('KeyS')) k1y += 1;

      if (mode !== '2p') {
        if (keys.has('ArrowLeft')) k1x -= 1;
        if (keys.has('ArrowRight')) k1x += 1;
        if (keys.has('ArrowUp')) k1y -= 1;
        if (keys.has('ArrowDown')) k1y += 1;
      }

      const k1Mag = Math.hypot(k1x, k1y);
      if (k1Mag > 1) {
        k1x /= k1Mag;
        k1y /= k1Mag;
      }

      const k1Shoot =
        keys.has('KeyF') ||
        (mode !== '2p' && (keys.has('Space') || keys.has('KeyJ')));
      const k1Dribble =
        keys.has('KeyG') ||
        (mode !== '2p' && (keys.has('KeyQ') || keys.has('KeyK')));
      const k1Pass =
        keys.has('KeyE') ||
        keys.has('KeyR') ||
        (mode !== '2p' && keys.has('KeyC'));
      const k1Sprint =
        keys.has('ShiftLeft') ||
        keys.has('KeyB') ||
        (mode !== '2p' && keys.has('ShiftRight'));

      // Player 2 keyboard (2P Local: Arrow keys + K Chutar / L Driblar / J Passar / RightShift Correr)
      let k2x = 0;
      let k2y = 0;
      if (keys.has('ArrowLeft')) k2x -= 1;
      if (keys.has('ArrowRight')) k2x += 1;
      if (keys.has('ArrowUp')) k2y -= 1;
      if (keys.has('ArrowDown')) k2y += 1;
      const k2Mag = Math.hypot(k2x, k2y);
      if (k2Mag > 1) {
        k2x /= k2Mag;
        k2y /= k2Mag;
      }
      const k2Shoot = keys.has('KeyK') || keys.has('Enter') || keys.has('Numpad1');
      const k2Dribble = keys.has('KeyL') || keys.has('Numpad2');
      const k2Pass = keys.has('KeyJ') || keys.has('Numpad3');
      const k2Sprint = keys.has('ShiftRight') || keys.has('Numpad0');

      const t1 = touchP1Ref.current;
      const t2 = touchP2Ref.current;

      const p1Input: PlayerInput = {
        moveX: Math.abs(t1.moveX) > 0.05 ? t1.moveX : k1x,
        moveY: Math.abs(t1.moveY) > 0.05 ? t1.moveY : k1y,
        shoot: t1.shoot || k1Shoot,
        dribble: t1.dribble || k1Dribble,
        pass: t1.pass || k1Pass,
        sprint: t1.sprint || k1Sprint,
      };

      const p2Input: PlayerInput = {
        moveX: Math.abs(t2.moveX) > 0.05 ? t2.moveX : k2x,
        moveY: Math.abs(t2.moveY) > 0.05 ? t2.moveY : k2y,
        shoot: t2.shoot || k2Shoot,
        dribble: t2.dribble || k2Dribble,
        pass: t2.pass || k2Pass,
        sprint: t2.sprint || k2Sprint,
      };

      if (mode === 'online') {
        return { [slot]: p1Input };
      }
      if (mode === '2p') {
        return { 'blue-1': p1Input, 'red-1': p2Input };
      }
      return { 'blue-1': p1Input };
    },
    []
  );

  // Keyboard listener for crisp desktop control + quick emote hotkeys (P1: 1-5, P2: 6-0)
  useEffect(() => {
    const updateVisualKeyMirror = () => {
      const keys = keysPressedRef.current;
      const mode = gameStateRef.current.mode;

      let k1x = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      let k1y = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
      if (mode !== '2p') {
        k1x += (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
        k1y += (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
      }
      const m1 = Math.hypot(k1x, k1y);
      if (m1 > 1) {
        k1x /= m1;
        k1y /= m1;
      }
      setP1KeyVec({ x: k1x, y: k1y });
      setP1KeyButtons({
        shoot: keys.has('KeyF') || (mode !== '2p' && (keys.has('Space') || keys.has('KeyJ'))),
        dribble: keys.has('KeyG') || (mode !== '2p' && (keys.has('KeyQ') || keys.has('KeyK'))),
        pass:
          keys.has('KeyE') ||
          keys.has('KeyR') ||
          (mode !== '2p' && keys.has('KeyC')),
        sprint:
          keys.has('ShiftLeft') ||
          keys.has('KeyB') ||
          (mode !== '2p' && keys.has('ShiftRight')),
      });

      let k2x = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      let k2y = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
      const m2 = Math.hypot(k2x, k2y);
      if (m2 > 1) {
        k2x /= m2;
        k2y /= m2;
      }
      setP2KeyVec({ x: k2x, y: k2y });
      setP2KeyButtons({
        shoot: keys.has('KeyK') || keys.has('Enter') || keys.has('Numpad1'),
        dribble: keys.has('KeyL') || keys.has('Numpad2'),
        pass: keys.has('KeyJ') || keys.has('Numpad3'),
        sprint: keys.has('ShiftRight') || keys.has('Numpad0'),
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (devModalOpen) return;
      if (screen !== 'PLAYING') return;
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }
      if (e.code === 'Escape' && gameStateRef.current.mode !== 'online') {
        setPaused((p) => !p);
        return;
      }

      // Keyboard number emotes: Player 1 -> 12345, Player 2 -> 67890
      if (!e.repeat && e.code.startsWith('Digit')) {
        const digit = Number(e.code.replace('Digit', ''));
        if (digit >= 1 && digit <= 5) {
          const opt = EMOTE_OPTIONS[digit - 1];
          if (opt) handleSendEmote(opt.id, 'blue-1');
          return;
        }
        if (digit === 6 || digit === 7 || digit === 8 || digit === 9 || digit === 0) {
          if (gameStateRef.current.mode === '2p') {
            const idx = digit === 0 ? 4 : digit - 6;
            const opt = EMOTE_OPTIONS[idx];
            if (opt) handleSendEmote(opt.id, 'red-1');
          }
          return;
        }
      }

      keysPressedRef.current.add(e.code);
      updateVisualKeyMirror();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
      updateVisualKeyMirror();
    };

    const onBlur = () => {
      keysPressedRef.current.clear();
      updateVisualKeyMirror();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [screen, devModalOpen, handleSendEmote]);

  // Global Developer Mode shortcut (Ctrl+Shift+D) + Escape close
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        keysPressedRef.current.clear();
        setDevModalOpen((prev) => !prev);
        return;
      }
      if (e.code === 'Escape' && devModalOpen) {
        e.preventDefault();
        setDevModalOpen(false);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [devModalOpen]);

  // Local 60Hz game loop for 1P, Training & 2P modes
  useEffect(() => {
    if (screen !== 'PLAYING' || gameStateRef.current.mode === 'online') return;

    let animId = 0;
    let lastTime = performance.now();
    let hudTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!paused) {
        const st = gameStateRef.current;
        const prevPhase = st.phase;
        const prevBlue = st.score.blue;
        const prevRed = st.score.red;

        const inputs = computeCombinedInputs(st.mode, 'blue-1');
        stepGameState(st, inputs, dt, devHacksRef.current);

        for (const ev of st.events) {
          soundFX.play(ev.type);
        }

        // Save career stats when a local match finishes
        if (st.phase === 'FINISHED' && !localMatchRecordedRef.current) {
          localMatchRecordedRef.current = true;
          const result: 'win' | 'loss' | 'draw' =
            st.winner === 'draw' || st.winner === null
              ? 'draw'
              : st.winner === 'blue'
              ? 'win'
              : 'loss';
          const matchRec: SaveMatchRecord = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            mode: st.mode,
            isRanked: false,
            teamSize: st.teamSize,
            blueScore: st.score.blue,
            redScore: st.score.red,
            result,
            expDelta: 0,
            rankAfter: getRankInfo(saveProfileRef.current.exp).tier.id,
            createdAt: Date.now(),
          };
          const updated = persistProfile(
            (prev) => ({
              ...prev,
              totalMatches: prev.totalMatches + 1,
              totalGoals: prev.totalGoals + st.score.blue,
              recentMatches: [matchRec, ...prev.recentMatches].slice(0, 12),
            }),
            true
          );
          if (firebaseUserRef.current) {
            void recordCloudMatch(firebaseUserRef.current.uid, matchRec).catch(() => {});
            void writeCloudSave(firebaseUserRef.current.uid, updated).catch(() => {});
          }
        }

        hudTimer += dt;
        if (
          hudTimer >= 0.033 ||
          st.phase !== prevPhase ||
          st.score.blue !== prevBlue ||
          st.score.red !== prevRed
        ) {
          hudTimer = 0;
          syncHudFromState(st);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [screen, paused, computeCombinedInputs, syncHudFromState, persistProfile]);

  // WebSocket lifecycle for Online Multiplayer
  const connectWebSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setOnlineError(null);
    };

    ws.onclose = () => {
      setWsConnected(false);
      setSearchingQuickMatch(false);
    };

    ws.onerror = () => {
      setOnlineError(t.serverConnectError);
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');
      if (type === 'error') {
        setOnlineError(String(msg.message || 'Erro no servidor.'));
        setSearchingQuickMatch(false);
        return;
      }

      if (type === 'matchmaking_waiting') {
        setSearchingQuickMatch(true);
        setOnlineError(null);
        return;
      }

      if (type === 'lobby_update') {
        setSearchingQuickMatch(false);
        setOnlineError(null);
        const slot = String(msg.yourSlot || 'blue-1');
        onlineSlotRef.current = slot;
        setOnlineSlot(slot);
        const parsedSize: TeamSize =
          msg.teamSize === 8 ? 8 : msg.teamSize === 4 ? 4 : msg.teamSize === 2 ? 2 : 1;
        setLobby({
          roomCode: String(msg.roomCode),
          teamSize: parsedSize,
          isRanked: Boolean(msg.isRanked),
          hostName: String(msg.hostName),
          isHost: Boolean(msg.isHost),
          isReady: Boolean(msg.isReady),
          yourSlot: slot,
          yourTeam: msg.yourTeam === 'red' ? 'red' : 'blue',
          bluePlayers: (msg.bluePlayers as LobbySlotInfo[]) || [],
          redPlayers: (msg.redPlayers as LobbySlotInfo[]) || [],
          humanCount: Number(msg.humanCount || 1),
          maxHumans: Number(msg.maxHumans || parsedSize * 2),
        });
        return;
      }

      if (type === 'match_started') {
        setSearchingQuickMatch(false);
        setOnlineError(null);
        setRankedSummary(null);
        setOnlineMatchIsRanked(Boolean(msg.isRanked));
        activeEmotesRef.current = [];
        setEmoteFeed([]);
        const slot = String(msg.yourSlot || 'blue-1');
        onlineSlotRef.current = slot;
        setOnlineSlot(slot);
        const incomingState = msg.state as GameState;
        gameStateRef.current = incomingState;
        syncHudFromState(incomingState);
        setPaused(false);
        setScreen('PLAYING');
        soundFX.play('whistle');
        return;
      }

      if (type === 'game_state') {
        const incomingState = msg.state as GameState;
        gameStateRef.current = incomingState;
        for (const ev of incomingState.events) {
          soundFX.play(ev.type);
        }
        syncHudFromState(incomingState);
        return;
      }

      if (type === 'ranked_result') {
        const result =
          msg.result === 'win' || msg.result === 'loss' ? msg.result : 'draw';
        const expDelta = Number(msg.expDelta || 0);
        const nextExp = Math.max(0, Math.floor(Number(msg.nextExp || 0)));
        const prevRankId = (msg.prevRankId as RankId) || 'bronze';
        const nextRankId = (msg.nextRankId as RankId) || getRankInfo(nextExp).tier.id;
        const promoted = Boolean(msg.promoted);
        const blueScore = Number(msg.blueScore || 0);
        const redScore = Number(msg.redScore || 0);
        const matchTeamSize: TeamSize =
          msg.teamSize === 8 ? 8 : msg.teamSize === 4 ? 4 : msg.teamSize === 2 ? 2 : 1;
        const slot = String(msg.yourSlot || onlineSlotRef.current);
        const goalsFor = slot.startsWith('red') ? redScore : blueScore;

        setRankedSummary({
          result,
          expDelta,
          nextExp,
          prevRankId,
          nextRankId,
          promoted,
        });

        const rec: SaveMatchRecord = {
          id: `ranked-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          mode: 'online',
          isRanked: true,
          teamSize: matchTeamSize,
          blueScore,
          redScore,
          result,
          expDelta,
          rankAfter: nextRankId,
          createdAt: Date.now(),
        };

        const updated = persistProfile(
          (prev) => ({
            ...prev,
            exp: nextExp,
            rankId: nextRankId,
            rankedWins: prev.rankedWins + (result === 'win' ? 1 : 0),
            rankedLosses: prev.rankedLosses + (result === 'loss' ? 1 : 0),
            rankedDraws: prev.rankedDraws + (result === 'draw' ? 1 : 0),
            totalMatches: prev.totalMatches + 1,
            totalGoals: prev.totalGoals + goalsFor,
            recentMatches: [rec, ...prev.recentMatches].slice(0, 12),
          }),
          true
        );

        if (firebaseUserRef.current) {
          void recordCloudMatch(firebaseUserRef.current.uid, rec).catch(() => {});
          void writeCloudSave(firebaseUserRef.current.uid, updated).catch(() => {});
        }
        return;
      }

      if (type === 'emote') {
        pushEmote({
          uid: String(msg.uid || `em-${Date.now()}`),
          playerId: String(msg.playerId || 'blue-1'),
          senderName: String(msg.senderName || 'Jogador'),
          team: msg.team === 'red' ? 'red' : 'blue',
          emoji: String(msg.emoji || '⚽'),
          label: String(msg.label || ''),
          createdAt: Date.now(),
        });
        return;
      }

      if (type === 'opponent_left') {
        setOnlineError(String(msg.message || 'O adversário saiu da sala.'));
        setScreen('ONLINE_LOBBY');
        setPaused(false);
        return;
      }
    };
  }, [syncHudFromState, pushEmote, persistProfile, t.serverConnectError]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Online input sender loop (30Hz + immediate on button changes)
  useEffect(() => {
    if (screen !== 'PLAYING' || gameStateRef.current.mode !== 'online') return;

    let lastSent = '';
    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const slot = onlineSlotRef.current;
      const inputs = computeCombinedInputs('online', slot);
      const mine = inputs[slot] ?? EMPTY_INPUT;

      const signature = `${mine.moveX.toFixed(2)},${mine.moveY.toFixed(2)},${
        mine.shoot ? 1 : 0
      },${mine.dribble ? 1 : 0},${mine.pass ? 1 : 0},${mine.sprint ? 1 : 0}`;
      if (signature !== lastSent || mine.shoot || mine.dribble || mine.pass || mine.sprint) {
        lastSent = signature;
        ws.send(
          JSON.stringify({
            type: 'player_input',
            moveX: mine.moveX,
            moveY: mine.moveY,
            shoot: mine.shoot,
            dribble: mine.dribble,
            pass: mine.pass,
            sprint: mine.sprint,
          })
        );
      }
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [screen, computeCombinedInputs]);

  const startLocalMatch = (mode: '1p' | '2p' | 'training') => {
    localMatchRecordedRef.current = false;
    setRankedSummary(null);
    setOnlineMatchIsRanked(false);
    const p1Custom = localBlueName.trim() || t.localP1Placeholder;
    const p2Custom = localRedName.trim() || t.localP2Placeholder;
    const initial = createInitialGameState({
      mode,
      teamSize,
      blueName: mode === '2p' ? p1Custom : t.youTag.replace(/[()]/g, ''),
      redName:
        mode === '2p' ? p2Custom : mode === 'training' ? 'IA Treino' : 'IA Rival',
    });
    gameStateRef.current = initial;
    activeEmotesRef.current = [];
    setEmoteFeed([]);
    syncHudFromState(initial);
    setPaused(false);
    setScreen('PLAYING');
    soundFX.play('whistle');
  };

  const handleMainStart = () => {
    persistProfile(
      (prev) => ({
        ...prev,
        preferredMode: selectedMode,
        preferredTeamSize: teamSize,
      }),
      false
    );
    if (selectedMode === 'online') {
      setOnlineError(null);
      setLobby(null);
      connectWebSocket();
      setScreen('ONLINE_LOBBY');
    } else {
      startLocalMatch(selectedMode);
    }
  };

  const handleRestartMatch = () => {
    const mode = gameStateRef.current.mode;
    if (mode === 'online') {
      setRankedSummary(null);
      wsRef.current?.send(JSON.stringify({ type: 'rematch' }));
      return;
    }
    startLocalMatch(mode);
  };

  const handleExitToMenu = () => {
    if (gameStateRef.current.mode === 'online' || screen === 'ONLINE_LOBBY') {
      wsRef.current?.send(JSON.stringify({ type: 'leave_room' }));
      setLobby(null);
      setSearchingQuickMatch(false);
    }
    setRankedSummary(null);
    activeEmotesRef.current = [];
    setEmoteFeed([]);
    setPaused(false);
    setScreen('MENU');
  };

  const sendLobbyMsg = (payload: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      setOnlineError(t.connectingWaitError);
      return;
    }
    const cleanName = playerName.trim().slice(0, 16) || 'Jogador';
    if (cleanName !== saveProfileRef.current.displayName) {
      persistProfile((prev) => ({ ...prev, displayName: cleanName }), false);
    }
    wsRef.current.send(
      JSON.stringify({
        ...payload,
        name: cleanName,
        exp: saveProfileRef.current.exp,
      })
    );
  };

  const copyRoomCode = () => {
    if (!lobby) return;
    navigator.clipboard?.writeText(lobby.roomCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const isOnline = gameStateRef.current.mode === 'online';
  const isTwoPlayerLocal = gameStateRef.current.mode === '2p';
  const myTeam: Team = isOnline && onlineSlot.startsWith('red') ? 'red' : 'blue';

  const myRankInfo = getRankInfo(saveProfile.exp);
  const myRankLabel = getLocalizedRankName(myRankInfo.tier.id, language);
  const currentLangObj =
    LANGUAGE_OPTIONS.find((l) => l.id === language) ?? LANGUAGE_OPTIONS[0];

  const handleDevAddGoal = useCallback(
    (team: Team, delta: number) => {
      const st = gameStateRef.current;
      if (st.mode === 'online') return;
      st.score[team] = Math.max(0, st.score[team] + delta);
      syncHudFromState(st);
    },
    [syncHudFromState]
  );

  const handleDevResetScore = useCallback(() => {
    const st = gameStateRef.current;
    if (st.mode === 'online') return;
    st.score.blue = 0;
    st.score.red = 0;
    syncHudFromState(st);
  }, [syncHudFromState]);

  const handleDevAdjustTime = useCallback(
    (mode: 'add30' | 'set5' | 'set999' | 'finish') => {
      const st = gameStateRef.current;
      if (st.mode === 'online') return;
      if (mode === 'add30') {
        st.timeRemaining += 30;
      } else if (mode === 'set5') {
        st.timeRemaining = 5;
        if (st.phase === 'KICKOFF' || st.phase === 'OVERTIME') {
          st.phase = 'PLAYING';
          st.phaseTimer = 0;
        }
      } else if (mode === 'set999') {
        st.timeRemaining = 999;
        if (st.phase === 'KICKOFF' || st.phase === 'OVERTIME') {
          st.phase = 'PLAYING';
          st.phaseTimer = 0;
        }
      } else if (mode === 'finish') {
        st.timeRemaining = 0;
        st.phase = 'FINISHED';
        st.winner =
          st.score.blue > st.score.red
            ? 'blue'
            : st.score.red > st.score.blue
            ? 'red'
            : 'draw';
        st.events.push({ type: 'whistle' });
      }
      syncHudFromState(st);
    },
    [syncHudFromState]
  );

  const handleDevBringBallToMe = useCallback(() => {
    const st = gameStateRef.current;
    if (st.mode === 'online') return;
    const targetId = st.controlMap?.['blue-1'] ?? 'blue-1';
    const target = st.players.find((p) => p.id === targetId) ?? st.players[0];
    if (!target) return;
    target.pickupLockout = 0;
    target.stealImmunity = 0.5;
    st.ball.possessorId = target.id;
    st.ball.lastTouchTeam = target.team;
    st.ball.vx = 0;
    st.ball.vy = 0;
    st.ball.x = target.x + Math.cos(target.facingAngle) * 34;
    st.ball.y = target.y + Math.sin(target.facingAngle) * 34;
    syncHudFromState(st);
  }, [syncHudFromState]);

  const handleDevSetExp = useCallback(
    (nextExp: number) => {
      const clamped = Math.max(0, Math.floor(nextExp || 0));
      const rankId = getRankInfo(clamped).tier.id;
      persistProfile(
        (prev) => ({
          ...prev,
          exp: clamped,
          rankId,
        }),
        true
      );
    },
    [persistProfile]
  );

  const handleDevSelectRank = useCallback(
    (rankId: RankId) => {
      const tier = RANK_TIERS.find((r) => r.id === rankId) ?? RANK_TIERS[0];
      persistProfile(
        (prev) => ({
          ...prev,
          exp: tier.minExp,
          rankId: tier.id,
        }),
        true
      );
    },
    [persistProfile]
  );

  const devActive = devUnlocked && devHacks.enabled;

  const saveModalElement = (
    <SaveRankModal
      open={saveModalOpen}
      onClose={() => setSaveModalOpen(false)}
      t={t}
      lang={language}
      profile={saveProfile}
      onChangeName={handleUpdateDisplayName}
      onSaveNow={handleManualSaveNow}
      onLoadSave={handleManualLoadSave}
      onResetSave={handleResetSave}
      user={firebaseUser}
      cloudBusy={cloudBusy}
      onSignInGoogle={handleSignInGoogle}
      onSignOutGoogle={handleSignOutGoogle}
      onSyncCloud={handleSyncCloudNow}
      leaderboard={leaderboard}
      leaderboardLoading={leaderboardLoading}
      onRefreshLeaderboard={refreshLeaderboard}
      feedbackMsg={saveFeedback}
    />
  );

  const devModalElement = (
    <DevModeModal
      open={devModalOpen}
      onClose={() => setDevModalOpen(false)}
      unlocked={devUnlocked}
      onUnlock={() => setDevUnlocked(true)}
      onLock={() => {
        setDevUnlocked(false);
        setDevHacks({ ...DEFAULT_DEV_HACKS, enabled: false });
      }}
      hacks={devHacks}
      onChangeHacks={(next) => setDevHacks(next)}
      isPlaying={screen === 'PLAYING'}
      gameMode={gameStateRef.current.mode}
      currentScore={{ blue: hud.blueScore, red: hud.redScore }}
      currentTimeRemaining={hud.timeRemaining}
      onAddGoal={handleDevAddGoal}
      onResetScore={handleDevResetScore}
      onAdjustTime={handleDevAdjustTime}
      onBringBallToMe={handleDevBringBallToMe}
      currentExp={saveProfile.exp}
      onSetExp={handleDevSetExp}
      onSelectRank={handleDevSelectRank}
    />
  );

  // ---------------- RENDER: MENU INICIAL ----------------
  if (screen === 'MENU') {
    return (
      <div className="relative min-h-dvh w-full bg-[#0B1215] text-slate-50 flex flex-col justify-between overflow-x-hidden">
        {saveModalElement}
        {devModalElement}

        {/* Atmospheric stadium backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {!imgFailed ? (
            <img
              src={stadiumBackdrop}
              alt="Estádio iluminado à noite"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover opacity-30 scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_rgba(20,83,45,0.45),_#0B1215_70%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1215]/80 via-[#0B1215]/70 to-[#0B1215]" />
        </div>

        {/* Clean Top Navigation */}
        <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
              {t.appName}
            </span>
            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${myRankInfo.tier.bgClass} ${myRankInfo.tier.borderClass} ${myRankInfo.tier.textClass}`}
            >
              <span>{myRankInfo.tier.icon}</span>
              <span>{myRankLabel}</span>
              <span className="font-mono-num text-[11px] opacity-85">
                ({saveProfile.exp} EXP)
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-sm text-slate-300">
            <span className="hidden lg:inline whitespace-nowrap text-xs text-slate-400">
              {t.headerDuration}
            </span>

            {/* 4-Language Switcher Button */}
            <div className="flex items-center bg-[#111C21] border border-white/15 rounded-lg p-0.5">
              <button
                type="button"
                onClick={cycleLanguage}
                title={currentLangObj.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Languages className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentLangObj.flag} {currentLangObj.shortLabel}
                </span>
              </button>
              <div className="hidden sm:flex items-center border-l border-white/10 pl-0.5">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectLanguage(opt.id)}
                    className={`px-1.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      language === opt.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.saveAndRankBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setDevModalOpen(true)}
              title="Modo Desenvolvedor (Ctrl+Shift+D)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                devActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/35 text-amber-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Dev</span>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t.soundOn : t.soundOff}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{muted ? t.soundOff : t.soundOn}</span>
            </button>

            <PWAInstallButton />
            <a
              href="/arena-futebol.html"
              download="arena-futebol.html"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadHtml}</span>
            </a>
          </div>
          <OfflineIndicator />
        </header>

        {/* Main Hero & Mode Configuration */}
        <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title & Rules */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                {t.heroEyebrow}
              </p>
              <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[0.98] text-balance">
                {t.heroTitle}
              </h1>
              <p className="text-base text-slate-300 max-w-xl leading-relaxed">
                {t.heroSubtitle}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white">{t.rule1Title}</p>
                <p className="text-slate-400 mt-0.5">{t.rule1Desc}</p>
              </div>
              <div>
                <p className="font-semibold text-white">{t.rule2Title}</p>
                <p className="text-slate-400 mt-0.5">{t.rule2Desc}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Mode Setup Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#111C21]/95 border border-white/12 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {t.chooseModeTitle}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">{t.chooseModeSubtitle}</p>
              </div>

              {/* 4 Mode Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMode('1p')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMode === '1p'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {t.mode1pTitle}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.mode1pDesc}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('2p')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMode === '2p'
                      ? 'bg-blue-500/15 border-blue-400 text-white'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-400 mb-2" />
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {t.mode2pTitle}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.mode2pDesc}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('training')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMode === 'training'
                      ? 'bg-teal-500/15 border-teal-400 text-white'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Dumbbell className="w-5 h-5 text-teal-400 mb-2" />
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {t.modeTrainingTitle}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.modeTrainingDesc}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('online')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMode === 'online'
                      ? 'bg-amber-500/15 border-amber-400 text-white'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Globe className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {t.modeOnlineTitle}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.modeOnlineDesc}</div>
                </button>
              </div>

              {/* Format & Local Names */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-300">{t.teamFormat}</span>
                  <div className="flex items-center gap-1 p-1 bg-[#0B1215] rounded-lg border border-white/10">
                    {(
                      [
                        { id: 1, label: '1 vs 1' },
                        { id: 2, label: '2 vs 2' },
                        { id: 4, label: '4 vs 4' },
                        { id: 8, label: '8 vs 8' },
                      ] as const
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTeamSize(fmt.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          teamSize === fmt.id
                            ? 'bg-slate-200 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMode === '2p' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label
                        htmlFor="local-p1-name"
                        className="block text-xs font-semibold text-blue-300 mb-1"
                      >
                        {t.localP1Label}
                      </label>
                      <input
                        id="local-p1-name"
                        type="text"
                        maxLength={16}
                        value={localBlueName}
                        onChange={(e) => setLocalBlueName(e.target.value)}
                        placeholder={t.localP1Placeholder}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B1215] border border-blue-500/40 text-sm text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="local-p2-name"
                        className="block text-xs font-semibold text-red-300 mb-1"
                      >
                        {t.localP2Label}
                      </label>
                      <input
                        id="local-p2-name"
                        type="text"
                        maxLength={16}
                        value={localRedName}
                        onChange={(e) => setLocalRedName(e.target.value)}
                        placeholder={t.localP2Placeholder}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B1215] border border-red-500/40 text-sm text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={handleMainStart}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-[0_8px_24px_rgba(16,185,129,0.28)] cursor-pointer whitespace-nowrap"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {selectedMode === 'online'
                    ? t.openOnlineLobby
                    : selectedMode === 'training'
                    ? t.startTraining
                    : t.startMatch}
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* Quiet Footer */}
        <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>{t.footerControls1p}</span>
          <span>{t.footerControls2p}</span>
        </footer>
      </div>
    );
  }

  // ---------------- RENDER: ONLINE LOBBY ----------------
  if (screen === 'ONLINE_LOBBY') {
    return (
      <div className="min-h-dvh w-full bg-[#0B1215] text-slate-50 flex flex-col">
        {saveModalElement}
        {devModalElement}
        <header className="max-w-4xl w-full mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <button
            type="button"
            onClick={handleExitToMenu}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToMenu}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cycleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111C21] border border-white/15 text-xs font-bold text-white cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentLangObj.flag} {currentLangObj.shortLabel}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${myRankInfo.tier.bgClass} ${myRankInfo.tier.borderClass} ${myRankInfo.tier.textClass}`}
            >
              <span>{myRankInfo.tier.icon}</span>
              <span>{myRankLabel}</span>
              <span className="font-mono-num">({saveProfile.exp} EXP)</span>
            </button>

            <button
              type="button"
              onClick={() => setDevModalOpen(true)}
              title="Modo Desenvolvedor (Ctrl+Shift+D)"
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                devActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/35 text-amber-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Dev</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              {wsConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 hidden sm:inline">
                    {t.serverConnected}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 hidden sm:inline">{t.connecting}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-center">
          <div className="bg-[#111C21] border border-white/12 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-extrabold text-white">
                  {t.onlineTitle}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {formatT(t.onlineSubtitle, { size: teamSize })}
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#0B1215] rounded-lg border border-white/10">
                {(
                  [
                    { id: 1, label: '1 vs 1' },
                    { id: 2, label: '2 vs 2' },
                    { id: 4, label: '4 vs 4' },
                    { id: 8, label: '8 vs 8' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={Boolean(lobby)}
                    onClick={() => setTeamSize(fmt.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                      teamSize === fmt.id
                        ? 'bg-slate-200 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {onlineError && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-sm text-red-200">
                {onlineError}
              </div>
            )}

            {!lobby ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <label
                      htmlFor="player-name"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      {t.yourFieldName}
                    </label>
                    <input
                      id="player-name"
                      type="text"
                      maxLength={16}
                      value={playerName}
                      onChange={(e) => handleUpdateDisplayName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B1215] border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Queue Mode: Casual vs Ranked */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {t.queueTypeLabel}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRankedQueue(true)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isRankedQueue
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-[#0B1215] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>{t.rankedQueue}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRankedQueue(false)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          !isRankedQueue
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-[#0B1215] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        <span>{t.casualQueue}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {isRankedQueue ? t.rankedQueueDesc : t.casualQueueDesc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-[#0B1215]/70 border border-white/10 space-y-4">
                    <div>
                      <h2 className="font-semibold text-white">{t.quickOrNewRoomTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1">{t.quickOrNewRoomDesc}</p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {!searchingQuickMatch ? (
                        <button
                          type="button"
                          onClick={() =>
                            sendLobbyMsg({
                              type: 'quick_match',
                              teamSize,
                              isRanked: isRankedQueue,
                            })
                          }
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                            isRankedQueue
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {t.findQuickMatch} ({isRankedQueue ? t.rankedQueue : t.casualQueue})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchingQuickMatch(false);
                            sendLobbyMsg({ type: 'cancel_quick_match' });
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 font-semibold text-sm transition-colors cursor-pointer"
                        >
                          {t.searchingOpponent}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          sendLobbyMsg({
                            type: 'create_room',
                            teamSize,
                            isRanked: isRankedQueue,
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors cursor-pointer"
                      >
                        {t.createCodeRoom} ({isRankedQueue ? t.rankedQueue : t.casualQueue})
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0B1215]/70 border border-white/10 space-y-4">
                    <div>
                      <h2 className="font-semibold text-white">{t.joinRoomTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1">{t.joinRoomDesc}</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="Ex: GOL42"
                        className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#111C21] border border-white/15 font-mono-num text-sm uppercase tracking-wider text-white focus:outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          sendLobbyMsg({
                            type: 'join_room',
                            roomCode: joinCodeInput,
                          })
                        }
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {t.joinBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#0B1215] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>
                        {t.roomCodeLabel} · {lobby.teamSize} vs {lobby.teamSize} (
                        {lobby.humanCount}/{lobby.maxHumans} {t.humansCount})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          lobby.isRanked
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                        }`}
                      >
                        {lobby.isRanked ? t.rankedQueue : t.casualQueue}
                      </span>
                    </div>
                    <div className="font-mono-num text-3xl font-bold tracking-widest text-white mt-0.5">
                      {lobby.roomCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendLobbyMsg({ type: 'switch_team' })}
                      className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      {t.switchTeam}
                    </button>
                    <button
                      type="button"
                      onClick={copyRoomCode}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t.copyCode}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/10 space-y-2">
                    <div className="text-xs font-semibold text-blue-300">{t.blueTeam}</div>
                    <div className="space-y-1.5">
                      {lobby.bluePlayers.map((p) => {
                        const slotTier = getRankInfo(p.exp ?? 0).tier;
                        return (
                          <div
                            key={p.slot}
                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center justify-between gap-2 ${
                              p.isAI
                                ? 'bg-black/20 text-slate-400'
                                : 'bg-blue-500/20 text-white font-semibold'
                            }`}
                          >
                            <span className="truncate">
                              {p.name} {p.slot === lobby.yourSlot ? t.youTag : ''}
                            </span>
                            <span className="text-xs text-blue-200/90 shrink-0 flex items-center gap-1.5">
                              {p.isAI ? (
                                t.aiLabel
                              ) : (
                                <>
                                  <span>{slotTier.icon}</span>
                                  <span className={slotTier.textClass}>
                                    {getLocalizedRankName(slotTier.id, language)}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 space-y-2">
                    <div className="text-xs font-semibold text-red-300">{t.redTeam}</div>
                    <div className="space-y-1.5">
                      {lobby.redPlayers.map((p) => {
                        const slotTier = getRankInfo(p.exp ?? 0).tier;
                        return (
                          <div
                            key={p.slot}
                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center justify-between gap-2 ${
                              p.isAI
                                ? 'bg-black/20 text-slate-400'
                                : 'bg-red-500/20 text-white font-semibold'
                            }`}
                          >
                            <span className="truncate">
                              {p.name} {p.slot === lobby.yourSlot ? t.youTag : ''}
                            </span>
                            <span className="text-xs text-red-200/90 shrink-0 flex items-center gap-1.5">
                              {p.isAI ? (
                                t.aiLabel
                              ) : (
                                <>
                                  <span>{slotTier.icon}</span>
                                  <span className={slotTier.textClass}>
                                    {getLocalizedRankName(slotTier.id, language)}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      wsRef.current?.send(JSON.stringify({ type: 'leave_room' }));
                      setLobby(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
                  >
                    {t.leaveRoom}
                  </button>

                  {lobby.isHost ? (
                    <button
                      type="button"
                      disabled={!lobby.isReady}
                      onClick={() => sendLobbyMsg({ type: 'start_match' })}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {lobby.isReady ? t.startOnlineMatch : t.waitingPlayers}
                    </button>
                  ) : (
                    <span className="text-sm text-slate-300">{t.waitingHost}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------- RENDER: ACTIVE MATCH ----------------
  const isOvertime = hud.overtimeCount > 0;
  const isTraining = gameStateRef.current.mode === 'training';
  const winnerTitle =
    hud.winner === 'draw'
      ? t.drawTitle
      : hud.winner === 'blue'
      ? isOnline && myTeam === 'blue'
        ? t.youWonTitle
        : isTwoPlayerLocal
        ? `${hud.p1Label} ${t.wonSuffix}`
        : t.blueTeamWon
      : isOnline && myTeam === 'red'
      ? t.youWonTitle
      : gameStateRef.current.mode === '1p' || isTraining
      ? t.aiWon
      : isTwoPlayerLocal
      ? `${hud.p2Label} ${t.wonSuffix}`
      : t.redTeamWon;

  const canvasLabels = {
    goalTitle: t.canvasGoalTitle,
    prepareTitle: t.canvasPrepareTitle,
    prepareSub: t.canvasPrepareSub,
    overtimeTitle: t.canvasOvertimeTitle,
    overtimeSub: t.canvasOvertimeSub,
    pausedClock: t.canvasPausedClock,
    scoredFor: t.canvasScoredFor,
    blueTeam: t.blueTeam,
    redTeam: t.redTeam,
  };

  return (
    <div className="h-dvh w-full bg-[#0B1215] text-slate-50 flex flex-col overflow-hidden select-none touch-none">
      {devModalElement}
      {/* Top Broadcast Scoreboard HUD */}
      <header className="shrink-0 h-14 px-3 sm:px-6 border-b border-white/10 bg-[#111C21] flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Blue Team Score */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-3 h-7 rounded-sm bg-blue-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-blue-200 truncate">
            {hud.blueName}
          </span>
          <span className="font-display font-extrabold text-3xl text-white font-mono-num leading-none">
            {hud.blueScore}
          </span>
        </div>

        {/* Center: Match Clock + Phase Indicator */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div
            className={`font-mono-num text-xl sm:text-2xl font-bold leading-none ${
              hud.phase === 'GOAL'
                ? 'text-emerald-400'
                : hud.timeRemaining <= 10
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {formatClock(hud.timeRemaining)}
          </div>
          <div className="text-[10px] font-semibold tracking-wide text-slate-400 mt-0.5 whitespace-nowrap">
            {hud.phase === 'GOAL'
              ? t.goalPausedClock
              : isOvertime
              ? `${t.overtimeLabel} ${hud.overtimeCount}/${MAX_OVERTIMES} (+30s)`
              : isTraining
              ? t.trainingModeLabel
              : isOnline && onlineMatchIsRanked
              ? `${t.rankedQueue} · ${myRankInfo.tier.icon} ${myRankLabel}`
              : t.regulationLabel}
          </div>
        </div>

        {/* Right: Red Team Score + Utility Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-display font-extrabold text-3xl text-white font-mono-num leading-none">
            {hud.redScore}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-red-200 truncate">
            {hud.redName}
          </span>
          <div className="w-3 h-7 rounded-sm bg-red-500 shrink-0" />

          <div className="flex items-center gap-1 ml-1 sm:ml-2 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => setDevModalOpen(true)}
              title="Modo Desenvolvedor (Ctrl+Shift+D)"
              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                devActive
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dev</span>
            </button>
            <button
              type="button"
              onClick={cycleLanguage}
              title={currentLangObj.label}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {currentLangObj.flag}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t.soundOn : t.soundOff}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isOnline) {
                  handleExitToMenu();
                } else {
                  setPaused((p) => !p);
                }
              }}
              aria-label={isOnline ? t.exitToMenu : t.pausedTitle}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isOnline ? <ArrowLeft className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Center Pitch Canvas */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-center relative">
        <div className="w-full h-full max-h-full aspect-[1000/560] flex items-center justify-center">
          <GameCanvas
            stateRef={gameStateRef}
            localPlayerId={isOnline ? onlineSlot : isTwoPlayerLocal ? null : 'blue-1'}
            emotesRef={activeEmotesRef}
            labels={canvasLabels}
          />
        </div>

        {/* Transient Corner Emote Chat Feed */}
        {emoteFeed.length > 0 && (
          <div className="pointer-events-none absolute top-4 left-4 sm:left-6 z-10 flex flex-col gap-1.5 max-w-[230px]">
            {emoteFeed.map((em) => (
              <div
                key={em.uid}
                className="px-3 py-1.5 rounded-lg bg-[#0B1215]/85 border border-white/15 text-xs flex items-center gap-2 shadow-lg backdrop-blur-xs"
              >
                <span className="text-base leading-none">{em.emoji}</span>
                <span
                  className={`font-semibold truncate ${
                    em.team === 'blue' ? 'text-blue-300' : 'text-red-300'
                  }`}
                >
                  {em.senderName}:
                </span>
                <span className="text-slate-100 whitespace-nowrap">{em.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pause Modal (Local Modes) */}
        {paused && hud.phase !== 'FINISHED' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="w-full max-w-sm bg-[#111C21] border border-white/15 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
              <h2 className="font-display text-3xl font-extrabold text-white">
                {t.pausedTitle}
              </h2>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaused(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  {t.resumeMatch}
                </button>
                <button
                  type="button"
                  onClick={() => setDevModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/45 text-amber-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Modo Desenvolvedor / Hacks</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestartMatch}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm cursor-pointer"
                >
                  {t.restartMatch}
                </button>
                <button
                  type="button"
                  onClick={handleExitToMenu}
                  className="w-full py-3 rounded-xl bg-transparent hover:bg-white/10 text-slate-300 font-medium text-sm cursor-pointer"
                >
                  {t.exitToMenu}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Match Finished / Victory / Draw Modal */}
        {hud.phase === 'FINISHED' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-30">
            <div className="w-full max-w-md bg-[#111C21] border border-white/15 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
              <div
                className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto ${
                  hud.winner === 'draw'
                    ? 'bg-slate-500/20 border-slate-400/40 text-slate-200'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                }`}
              >
                <Trophy className="w-6 h-6" />
              </div>

              <div>
                <h2 className="font-display text-4xl font-extrabold text-white">
                  {winnerTitle}
                </h2>
                {hud.winner === 'draw' ? (
                  <p className="text-xs font-semibold text-slate-300 mt-1">
                    {formatT(t.drawReason, { max: MAX_OVERTIMES })}
                  </p>
                ) : (
                  isOvertime && (
                    <p className="text-xs font-semibold text-amber-400 mt-1">
                      {formatT(t.overtimeDecided, { sec: hud.overtimeCount * 30 })}
                    </p>
                  )
                )}
              </div>

              <div className="py-4 px-6 rounded-xl bg-[#0B1215] border border-white/10 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-blue-300 font-semibold">{hud.blueName}</div>
                  <div className="font-display text-5xl font-extrabold text-white font-mono-num">
                    {hud.blueScore}
                  </div>
                </div>
                <span className="text-slate-500 font-bold text-xl">×</span>
                <div className="text-center">
                  <div className="text-xs text-red-300 font-semibold">{hud.redName}</div>
                  <div className="font-display text-5xl font-extrabold text-white font-mono-num">
                    {hud.redScore}
                  </div>
                </div>
              </div>

              {/* Ranked EXP Summary */}
              {isOnline && onlineMatchIsRanked && rankedSummary && (
                <div className="p-4 rounded-xl bg-[#0B1215] border border-amber-400/35 space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      {t.rankedSummaryTitle} ·{' '}
                      {rankedSummary.result === 'win'
                        ? t.rankedWin
                        : rankedSummary.result === 'loss'
                        ? t.rankedLoss
                        : t.rankedDraw}
                    </span>
                    <span
                      className={`font-mono-num text-sm font-extrabold ${
                        rankedSummary.expDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {rankedSummary.expDelta >= 0
                        ? `+${rankedSummary.expDelta}`
                        : rankedSummary.expDelta}{' '}
                      EXP
                    </span>
                  </div>

                  {(() => {
                    const postInfo = getRankInfo(rankedSummary.nextExp);
                    const postName = getLocalizedRankName(postInfo.tier.id, language);
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold ${postInfo.tier.textClass}`}>
                            {postInfo.tier.icon} {postName}
                          </span>
                          <span className="font-mono-num text-slate-300">
                            {rankedSummary.nextExp} EXP
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#111C21] overflow-hidden border border-white/10">
                          <div
                            style={{ width: `${postInfo.progressPercent}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
                          />
                        </div>
                        {rankedSummary.promoted && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs font-extrabold text-center">
                            🎉 {formatT(t.rankedPromoted, { rank: postName })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRestartMatch}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.playAgain}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExitToMenu}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm cursor-pointer whitespace-nowrap"
                >
                  {t.mainMenu}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Control Deck */}
      <footer className="shrink-0 w-full max-w-6xl mx-auto px-2 sm:px-6 pb-3 pt-1">
        {isTwoPlayerLocal ? (
          /* 2-Player Local Mode: BOTH players get Joystick + Stamina/Power + Correr / Passar / Driblar / Chutar */
          <div className="flex flex-col gap-1.5 bg-[#111C21]/90 border border-white/10 rounded-2xl px-2.5 sm:px-4 py-2">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Player 1 (Blue) Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <VirtualJoystick
                  team="blue"
                  label={hud.p1Label}
                  keyHint="WASD"
                  externalVector={p1KeyVec}
                  size={78}
                  onChange={(vec) => {
                    touchP1Ref.current.moveX = vec.x;
                    touchP1Ref.current.moveY = vec.y;
                  }}
                />
                <div className="flex flex-col gap-1.5">
                  {/* P1 Stamina & Shoot Power Gauges */}
                  <div className="grid grid-cols-2 gap-2 px-0.5">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{t.staminaLabel}</span>
                        <span className="font-mono-num">{Math.round(hud.blueStamina)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                        <div
                          style={{ width: `${Math.max(0, Math.min(100, hud.blueStamina))}%` }}
                          className={`h-full transition-[width] duration-75 ${
                            hud.blueStaminaExhausted ? 'bg-amber-500' : 'bg-sky-400'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{t.powerLabel}</span>
                        <span className="font-mono-num">
                          {Math.round(hud.blueShootCharge * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, hud.blueShootCharge * 100))}%`,
                          }}
                          className={`h-full transition-[width] duration-75 ${
                            hud.blueShootCharge > 0.78
                              ? 'bg-red-500'
                              : hud.blueShootCharge > 0.45
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <ActionButton
                      variant="sprint"
                      team="blue"
                      label={t.actionSprint}
                      keyHint="Shift"
                      size={48}
                      exhausted={hud.blueStaminaExhausted}
                      active={p1KeyButtons.sprint}
                      onPressChange={(pressed) => {
                        touchP1Ref.current.sprint = pressed;
                      }}
                    />
                    <ActionButton
                      variant="pass"
                      team="blue"
                      label={t.actionPass}
                      keyHint="E"
                      size={48}
                      active={p1KeyButtons.pass}
                      onPressChange={(pressed) => {
                        touchP1Ref.current.pass = pressed;
                      }}
                    />
                    <ActionButton
                      variant="dribble"
                      team="blue"
                      label={t.actionDribble}
                      keyHint="G"
                      size={48}
                      cooldownRatio={hud.blueDribbleCdRatio}
                      active={p1KeyButtons.dribble}
                      onPressChange={(pressed) => {
                        touchP1Ref.current.dribble = pressed;
                      }}
                    />
                    <ActionButton
                      variant="shoot"
                      team="blue"
                      label={t.actionShoot}
                      keyHint="F"
                      size={52}
                      chargeRatio={hud.blueShootCharge}
                      active={p1KeyButtons.shoot}
                      onPressChange={(pressed) => {
                        touchP1Ref.current.shoot = pressed;
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden xl:flex flex-col items-center text-center text-[11px] text-slate-400 px-2 gap-0.5">
                <span className="font-semibold text-slate-200">{t.emotes2pHint}</span>
                <span className="tracking-wide">1⚽ 2🔥 3👏 4😂 5🏆</span>
              </div>

              {/* Player 2 (Red) Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-col gap-1.5">
                  {/* P2 Stamina & Shoot Power Gauges */}
                  <div className="grid grid-cols-2 gap-2 px-0.5">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{t.powerLabel}</span>
                        <span className="font-mono-num">
                          {Math.round(hud.redShootCharge * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, hud.redShootCharge * 100))}%`,
                          }}
                          className={`h-full transition-[width] duration-75 ${
                            hud.redShootCharge > 0.78
                              ? 'bg-red-500'
                              : hud.redShootCharge > 0.45
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{t.staminaLabel}</span>
                        <span className="font-mono-num">{Math.round(hud.redStamina)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                        <div
                          style={{ width: `${Math.max(0, Math.min(100, hud.redStamina))}%` }}
                          className={`h-full transition-[width] duration-75 ${
                            hud.redStaminaExhausted ? 'bg-amber-500' : 'bg-sky-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <ActionButton
                      variant="shoot"
                      team="red"
                      label={t.actionShoot}
                      keyHint="K"
                      size={52}
                      chargeRatio={hud.redShootCharge}
                      active={p2KeyButtons.shoot}
                      onPressChange={(pressed) => {
                        touchP2Ref.current.shoot = pressed;
                      }}
                    />
                    <ActionButton
                      variant="dribble"
                      team="red"
                      label={t.actionDribble}
                      keyHint="L"
                      size={48}
                      cooldownRatio={hud.redDribbleCdRatio}
                      active={p2KeyButtons.dribble}
                      onPressChange={(pressed) => {
                        touchP2Ref.current.dribble = pressed;
                      }}
                    />
                    <ActionButton
                      variant="pass"
                      team="red"
                      label={t.actionPass}
                      keyHint="J"
                      size={48}
                      active={p2KeyButtons.pass}
                      onPressChange={(pressed) => {
                        touchP2Ref.current.pass = pressed;
                      }}
                    />
                    <ActionButton
                      variant="sprint"
                      team="red"
                      label={t.actionSprint}
                      keyHint="Shift Dir."
                      size={48}
                      exhausted={hud.redStaminaExhausted}
                      active={p2KeyButtons.sprint}
                      onPressChange={(pressed) => {
                        touchP2Ref.current.sprint = pressed;
                      }}
                    />
                  </div>
                </div>
                <VirtualJoystick
                  team="red"
                  label={hud.p2Label}
                  keyHint="Setas"
                  externalVector={p2KeyVec}
                  size={78}
                  onChange={(vec) => {
                    touchP2Ref.current.moveX = vec.x;
                    touchP2Ref.current.moveY = vec.y;
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 1-Player, Training & Online Mode: Left Joystick + Stamina/Power Bars + Right Correr / Passar / Driblar / Chutar */
          <div className="flex items-center justify-between gap-3 sm:gap-4 bg-[#111C21]/90 border border-white/10 rounded-2xl px-3 sm:px-6 py-2.5">
            <VirtualJoystick
              team={myTeam}
              label={t.walkAimLabel}
              keyHint={t.walkAimHint}
              externalVector={p1KeyVec}
              size={92}
              onChange={(vec) => {
                touchP1Ref.current.moveX = vec.x;
                touchP1Ref.current.moveY = vec.y;
              }}
            />

            <div className="hidden md:flex flex-col items-center gap-2 min-w-[210px] max-w-xs flex-1">
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>{t.staminaLabel}</span>
                    <span className="font-mono-num">{Math.round(hud.myStamina)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${Math.max(0, Math.min(100, hud.myStamina))}%` }}
                      className={`h-full transition-[width] duration-75 ${
                        hud.myStaminaExhausted ? 'bg-amber-500' : 'bg-sky-400'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>{t.shootPowerLabel}</span>
                    <span className="font-mono-num">
                      {Math.round(hud.myShootCharge * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0B1215] overflow-hidden border border-white/10">
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, hud.myShootCharge * 100))}%`,
                      }}
                      className={`h-full transition-[width] duration-75 ${
                        hud.myShootCharge > 0.78
                          ? 'bg-red-500'
                          : hud.myShootCharge > 0.45
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 text-center">
                <span>{t.emotesHint} </span>
                <span className="text-slate-300 font-medium">
                  {EMOTE_OPTIONS.map((em, idx) => `${idx + 1}${em.emoji}`).join(' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <ActionButton
                variant="sprint"
                team={myTeam}
                label={t.actionSprint}
                keyHint="Shift / B"
                size={60}
                exhausted={hud.myStaminaExhausted}
                active={p1KeyButtons.sprint}
                onPressChange={(pressed) => {
                  touchP1Ref.current.sprint = pressed;
                }}
              />
              <ActionButton
                variant="pass"
                team={myTeam}
                label={t.actionPass}
                keyHint="E / C"
                size={60}
                active={p1KeyButtons.pass}
                onPressChange={(pressed) => {
                  touchP1Ref.current.pass = pressed;
                }}
              />
              <ActionButton
                variant="dribble"
                team={myTeam}
                label={t.actionDribble}
                keyHint="G / Q"
                size={60}
                cooldownRatio={hud.myDribbleCdRatio}
                active={p1KeyButtons.dribble}
                onPressChange={(pressed) => {
                  touchP1Ref.current.dribble = pressed;
                }}
              />
              <ActionButton
                variant="shoot"
                team={myTeam}
                label={t.actionShoot}
                keyHint="Space / F"
                size={68}
                chargeRatio={hud.myShootCharge}
                active={p1KeyButtons.shoot}
                onPressChange={(pressed) => {
                  touchP1Ref.current.shoot = pressed;
                }}
              />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
