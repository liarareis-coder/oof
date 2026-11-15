import type { RankId } from '../shared/ranks.ts';

export type Language = 'pt-BR' | 'pt-PT' | 'en-US' | 'es';

export interface LanguageOption {
  id: Language;
  shortLabel: string;
  label: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'pt-BR', shortLabel: 'PT-BR', label: 'Português (BR)', flag: '🇧🇷' },
  { id: 'pt-PT', shortLabel: 'PT-PT', label: 'Português (PT)', flag: '🇵🇹' },
  { id: 'en-US', shortLabel: 'EN-US', label: 'English (USA)', flag: '🇺🇸' },
  { id: 'es', shortLabel: 'ES', label: 'Español', flag: '🇪🇸' },
];

export const RANK_NAMES_BY_LANG: Record<Language, Record<RankId, string>> = {
  'pt-BR': {
    bronze: 'Bronze',
    prata: 'Prata',
    ouro: 'Ouro',
    diamante: 'Diamante',
    platina: 'Platina',
    titanio: 'Titânio',
    legend: 'Legend',
    'supersonic-legend': 'Supersonic Legend',
    champion: 'Champion',
    'supersonic-champion': 'Supersonic Champion',
  },
  'pt-PT': {
    bronze: 'Bronze',
    prata: 'Prata',
    ouro: 'Ouro',
    diamante: 'Diamante',
    platina: 'Platina',
    titanio: 'Titânio',
    legend: 'Legend',
    'supersonic-legend': 'Supersonic Legend',
    champion: 'Champion',
    'supersonic-champion': 'Supersonic Champion',
  },
  'en-US': {
    bronze: 'Bronze',
    prata: 'Silver',
    ouro: 'Gold',
    diamante: 'Diamond',
    platina: 'Platinum',
    titanio: 'Titanium',
    legend: 'Legend',
    'supersonic-legend': 'Supersonic Legend',
    champion: 'Champion',
    'supersonic-champion': 'Supersonic Champion',
  },
  es: {
    bronze: 'Bronce',
    prata: 'Plata',
    ouro: 'Oro',
    diamante: 'Diamante',
    platina: 'Platino',
    titanio: 'Titanio',
    legend: 'Legend',
    'supersonic-legend': 'Supersonic Legend',
    champion: 'Champion',
    'supersonic-champion': 'Supersonic Champion',
  },
};

export function getLocalizedRankName(rankId: RankId, lang: Language): string {
  return RANK_NAMES_BY_LANG[lang]?.[rankId] ?? RANK_NAMES_BY_LANG['pt-BR'][rankId];
}

export interface TranslationDict {
  appName: string;
  headerDuration: string;
  soundOn: string;
  soundOff: string;
  downloadHtml: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  rule1Title: string;
  rule1Desc: string;
  rule2Title: string;
  rule2Desc: string;
  chooseModeTitle: string;
  chooseModeSubtitle: string;
  mode1pTitle: string;
  mode1pDesc: string;
  mode2pTitle: string;
  mode2pDesc: string;
  modeTrainingTitle: string;
  modeTrainingDesc: string;
  modeOnlineTitle: string;
  modeOnlineDesc: string;
  teamFormat: string;
  localP1Label: string;
  localP2Label: string;
  localP1Placeholder: string;
  localP2Placeholder: string;
  openOnlineLobby: string;
  startTraining: string;
  startMatch: string;
  footerControls1p: string;
  footerControls2p: string;
  // Save & Profile
  saveAndRankBtn: string;
  saveModalTitle: string;
  saveModalSubtitle: string;
  close: string;
  playerNameLabel: string;
  currentRankLabel: string;
  expToNext: string;
  maxRankReached: string;
  careerStatsTitle: string;
  rankedRecordLabel: string;
  totalMatchesLabel: string;
  totalGoalsLabel: string;
  localSaveTitle: string;
  cloudSaveTitle: string;
  lastSavedAt: string;
  notSavedYet: string;
  saveNow: string;
  loadSave: string;
  resetSave: string;
  confirmReset: string;
  saveFeedbackSaved: string;
  saveFeedbackLoaded: string;
  saveFeedbackReset: string;
  saveFeedbackSynced: string;
  signInGoogle: string;
  signOutGoogle: string;
  syncCloudNow: string;
  cloudSignedInAs: string;
  cloudNotSignedIn: string;
  matchHistoryTitle: string;
  noMatchesYet: string;
  leaderboardTitle: string;
  leaderboardEmpty: string;
  refreshLeaderboard: string;
  rankProgressionTitle: string;
  // Online Lobby
  backToMenu: string;
  serverConnected: string;
  connecting: string;
  onlineTitle: string;
  onlineSubtitle: string;
  queueTypeLabel: string;
  casualQueue: string;
  rankedQueue: string;
  rankedQueueDesc: string;
  casualQueueDesc: string;
  yourFieldName: string;
  namePlaceholder: string;
  quickOrNewRoomTitle: string;
  quickOrNewRoomDesc: string;
  findQuickMatch: string;
  searchingOpponent: string;
  createCodeRoom: string;
  joinRoomTitle: string;
  joinRoomDesc: string;
  joinBtn: string;
  roomCodeLabel: string;
  humansCount: string;
  switchTeam: string;
  copyCode: string;
  copied: string;
  blueTeam: string;
  redTeam: string;
  youTag: string;
  aiLabel: string;
  humanLabel: string;
  leaveRoom: string;
  startOnlineMatch: string;
  waitingPlayers: string;
  waitingHost: string;
  // Match HUD & Controls
  goalPausedClock: string;
  overtimeLabel: string;
  trainingModeLabel: string;
  regulationLabel: string;
  pausedTitle: string;
  resumeMatch: string;
  restartMatch: string;
  exitToMenu: string;
  drawTitle: string;
  youWonTitle: string;
  wonSuffix: string;
  blueTeamWon: string;
  redTeamWon: string;
  aiWon: string;
  drawReason: string;
  overtimeDecided: string;
  playAgain: string;
  mainMenu: string;
  staminaLabel: string;
  powerLabel: string;
  shootPowerLabel: string;
  walkAimLabel: string;
  walkAimHint: string;
  emotesHint: string;
  emotes2pHint: string;
  actionShoot: string;
  actionPass: string;
  actionDribble: string;
  actionSprint: string;
  // Ranked Match Result
  rankedSummaryTitle: string;
  rankedPromoted: string;
  rankedWin: string;
  rankedLoss: string;
  rankedDraw: string;
  // Canvas
  canvasGoalTitle: string;
  canvasPrepareTitle: string;
  canvasPrepareSub: string;
  canvasOvertimeTitle: string;
  canvasOvertimeSub: string;
  canvasPausedClock: string;
  canvasScoredFor: string;
  // Errors
  serverConnectError: string;
  connectingWaitError: string;
}

const PT_BR: TranslationDict = {
  appName: 'Arena Futebol',
  headerDuration: '90s + até 3×30s Prorrogação',
  soundOn: 'Som Ativo',
  soundOff: 'Sem Som',
  downloadHtml: 'Baixar HTML',
  heroEyebrow: 'Futebol Arcade em Tempo Real',
  heroTitle: 'Leve a bola até o gol adversário.',
  heroSubtitle:
    'Encoste na bola para prendê-la nos pés, toque com precisão pelo botão Passar, controle automaticamente o atleta com a bola e decida no chute ou no drible.',
  rule1Title: '90s + até 3 Prorrogações',
  rule1Desc:
    'O tempo pausa na comemoração do gol. Após 3 prorrogações empatadas, dá empate.',
  rule2Title: 'Passe e Troca Automática',
  rule2Desc:
    'Joystick anda e mira, e você sempre controla o jogador do seu time que está com a bola.',
  chooseModeTitle: 'Escolha o Modo de Jogo',
  chooseModeSubtitle:
    'Partida normal, duelo local com nomes, treino contra IA leve ou online rankeado.',
  mode1pTitle: '1 Jogador',
  mode1pDesc: 'Modo normal vs IA',
  mode2pTitle: '2 Jogadores',
  mode2pDesc: 'Multiplayer local',
  modeTrainingTitle: 'Modo Treino',
  modeTrainingDesc: 'IA leve para treinar',
  modeOnlineTitle: 'Online',
  modeOnlineDesc: 'Casual ou Rankeada',
  teamFormat: 'Formato dos Times',
  localP1Label: 'Nome Jogador 1 (Azul)',
  localP2Label: 'Nome Jogador 2 (Vermelho)',
  localP1Placeholder: 'Jogador 1',
  localP2Placeholder: 'Jogador 2',
  openOnlineLobby: 'Abrir Lobby Online',
  startTraining: 'Iniciar Treino',
  startMatch: 'Iniciar Partida',
  footerControls1p:
    '1P/Treino: WASD/Setas · Shift Correr · E Passar · G Driblar · Segurar Espaço/F Chutar · 1–5 Emotes',
  footerControls2p:
    '2P Local: P1 WASD + Shift/E/G/F (1–5) · P2 Setas + Shift Dir./J/L/K (6–0)',
  saveAndRankBtn: 'Save & Rankeada',
  saveModalTitle: 'Perfil, Patente e Sistema de Save',
  saveModalSubtitle: 'Salve seu progresso local, sincronize na nuvem e acompanhe o ranking.',
  close: 'Fechar',
  playerNameLabel: 'Nome do Jogador',
  currentRankLabel: 'Patente Atual',
  expToNext: 'Faltam {exp} EXP para {rank}',
  maxRankReached: 'Patente Máxima Alcançada!',
  careerStatsTitle: 'Estatísticas da Carreira',
  rankedRecordLabel: 'Rankeada (V / E / D)',
  totalMatchesLabel: 'Partidas',
  totalGoalsLabel: 'Gols',
  localSaveTitle: 'Save Local (Navegador)',
  cloudSaveTitle: 'Save na Nuvem (Google)',
  lastSavedAt: 'Último save: {date}',
  notSavedYet: 'Ainda não salvo manualmente',
  saveNow: 'Salvar Agora',
  loadSave: 'Carregar Save',
  resetSave: 'Resetar Save',
  confirmReset: 'Confirmar Reset?',
  saveFeedbackSaved: 'Save gravado com sucesso!',
  saveFeedbackLoaded: 'Save carregado!',
  saveFeedbackReset: 'Save reiniciado para Bronze (0 EXP).',
  saveFeedbackSynced: 'Progresso sincronizado com a nuvem!',
  signInGoogle: 'Entrar com Google',
  signOutGoogle: 'Sair da Conta',
  syncCloudNow: 'Sincronizar Nuvem',
  cloudSignedInAs: 'Conectado como {name}',
  cloudNotSignedIn: 'Entre com Google para salvar sua patente na nuvem e aparecer no Ranking Global.',
  matchHistoryTitle: 'Últimas Partidas',
  noMatchesYet: 'Nenhuma partida registrada ainda.',
  leaderboardTitle: 'Ranking Global (Top EXP)',
  leaderboardEmpty: 'Nenhum jogador ranqueado na nuvem ainda.',
  refreshLeaderboard: 'Atualizar',
  rankProgressionTitle: 'Patentes Rankeadas (10 Níveis)',
  backToMenu: 'Voltar ao Menu',
  serverConnected: 'Servidor Conectado',
  connecting: 'Conectando...',
  onlineTitle: 'Multiplayer Online',
  onlineSubtitle:
    'Jogue em tempo real pela internet em salas {size} vs {size} (vagas vazias usam IA).',
  queueTypeLabel: 'Tipo de Partida',
  casualQueue: 'Casual',
  rankedQueue: 'Rankeada (EXP)',
  rankedQueueDesc: 'Ganha ou perde EXP e sobe de patente até Supersonic Champion.',
  casualQueueDesc: 'Partida amistosa sem alterar sua patente ou EXP.',
  yourFieldName: 'Seu Nome em Campo',
  namePlaceholder: 'Digite seu apelido',
  quickOrNewRoomTitle: 'Partida Rápida ou Nova Sala',
  quickOrNewRoomDesc:
    'Encontre qualquer jogador online ou crie uma sala privada com código.',
  findQuickMatch: 'Buscar Partida Rápida',
  searchingOpponent: 'Procurando adversário... (Cancelar)',
  createCodeRoom: 'Criar Sala com Código',
  joinRoomTitle: 'Entrar em uma Sala',
  joinRoomDesc: 'Peça o código de 5 letras ao seu amigo e entre na sala.',
  joinBtn: 'Entrar',
  roomCodeLabel: 'Código da Sala',
  humansCount: 'humanos',
  switchTeam: 'Trocar de Time',
  copyCode: 'Copiar Código',
  copied: 'Copiado',
  blueTeam: 'Time Azul',
  redTeam: 'Time Vermelho',
  youTag: '(Você)',
  aiLabel: 'IA',
  humanLabel: 'Humano',
  leaveRoom: 'Sair da Sala',
  startOnlineMatch: 'Iniciar Partida Online',
  waitingPlayers: 'Aguardando pelo menos 2 jogadores...',
  waitingHost: 'Aguardando o anfitrião iniciar a partida...',
  goalPausedClock: 'Gol · Relógio Pausado',
  overtimeLabel: 'Prorrogação',
  trainingModeLabel: 'Modo Treino',
  regulationLabel: 'Tempo Regulamentar',
  pausedTitle: 'Jogo Pausado',
  resumeMatch: 'Continuar Partida',
  restartMatch: 'Reiniciar (90s)',
  exitToMenu: 'Voltar ao Menu Inicial',
  drawTitle: 'Empate!',
  youWonTitle: 'Você Venceu!',
  wonSuffix: 'Venceu!',
  blueTeamWon: 'Time Azul Venceu!',
  redTeamWon: 'Time Vermelho Venceu!',
  aiWon: 'A IA Venceu!',
  drawReason: 'Empate oficial após {max} prorrogações sem vencedor',
  overtimeDecided: 'Decidido na Prorrogação (+{sec}s)',
  playAgain: 'Jogar Novamente',
  mainMenu: 'Menu Inicial',
  staminaLabel: 'Stamina',
  powerLabel: 'Força',
  shootPowerLabel: 'Força do Chute',
  walkAimLabel: 'Andar / Mirar',
  walkAimHint: 'WASD ou Setas',
  emotesHint: 'Emotes (1–5):',
  emotes2pHint: 'Emotes: P1 (1–5) · P2 (6–0)',
  actionShoot: 'Chutar',
  actionPass: 'Passar',
  actionDribble: 'Driblar',
  actionSprint: 'Correr',
  rankedSummaryTitle: 'Resultado da Rankeada',
  rankedPromoted: 'PROMOÇÃO! Nova patente: {rank}',
  rankedWin: 'Vitória Rankeada',
  rankedLoss: 'Derrota Rankeada',
  rankedDraw: 'Empate Rankeado',
  canvasGoalTitle: 'GOOOL!',
  canvasPrepareTitle: 'PREPARE-SE',
  canvasPrepareSub: 'Leve a bola ao gol adversário!',
  canvasOvertimeTitle: 'EMPATE! +30s',
  canvasOvertimeSub: 'Prorrogação {cur}/{max} — Quem fizer mais pontos vence',
  canvasPausedClock: 'Relógio pausado durante a comemoração',
  canvasScoredFor: '{scorer} marcou para o {team}',
  serverConnectError: 'Não foi possível conectar ao servidor multiplayer.',
  connectingWaitError: 'Conectando ao servidor... Tente novamente em 1 segundo.',
};

const PT_PT: TranslationDict = {
  ...PT_BR,
  headerDuration: '90s + até 3×30s Prolongamento',
  soundOn: 'Som Ativo',
  soundOff: 'Sem Som',
  downloadHtml: 'Transferir HTML',
  heroEyebrow: 'Futebol Arcade em Tempo Real',
  heroTitle: 'Leva a bola até à baliza adversária.',
  heroSubtitle:
    'Toca na bola para a prender nos pés, passa com precisão no botão Passar, controla automaticamente o jogador com bola e decide no remate ou no drible.',
  rule1Title: '90s + até 3 Prolongamentos',
  rule1Desc:
    'O relógio pára durante a celebração do golo. Após 3 prolongamentos empatados, termina empatado.',
  rule2Title: 'Passe e Troca Automática',
  rule2Desc:
    'O joystick move e aponta, e controlas sempre o jogador da tua equipa com a bola.',
  chooseModeTitle: 'Escolhe o Modo de Jogo',
  chooseModeSubtitle:
    'Partida normal, duelo local com nomes, treino contra IA ligeira ou online rankeado.',
  mode1pTitle: '1 Jogador',
  mode1pDesc: 'Modo normal vs IA',
  mode2pTitle: '2 Jogadores',
  mode2pDesc: 'Multijogador local',
  modeTrainingTitle: 'Modo Treino',
  modeTrainingDesc: 'IA ligeira para treinar',
  modeOnlineTitle: 'Online',
  modeOnlineDesc: 'Casual ou Rankeada',
  teamFormat: 'Formato das Equipas',
  localP1Label: 'Nome Jogador 1 (Azul)',
  localP2Label: 'Nome Jogador 2 (Vermelho)',
  openOnlineLobby: 'Abrir Lobby Online',
  startTraining: 'Iniciar Treino',
  startMatch: 'Iniciar Partida',
  footerControls1p:
    '1P/Treino: WASD/Setas · Shift Correr · E Passar · G Driblar · Segurar Espaço/F Rematar · 1–5 Emotes',
  footerControls2p:
    '2P Local: P1 WASD + Shift/E/G/F (1–5) · P2 Setas + Shift Dir./J/L/K (6–0)',
  saveAndRankBtn: 'Save & Rankeada',
  saveModalTitle: 'Perfil, Patente e Sistema de Save',
  saveModalSubtitle: 'Guarda o teu progresso local, sincroniza na nuvem e consulta o ranking.',
  close: 'Fechar',
  expToNext: 'Faltam {exp} EXP para {rank}',
  maxRankReached: 'Patente Máxima Alcançada!',
  careerStatsTitle: 'Estatísticas de Carreira',
  totalMatchesLabel: 'Jogos',
  totalGoalsLabel: 'Golos',
  localSaveTitle: 'Save Local (Navegador)',
  cloudSaveTitle: 'Save na Nuvem (Google)',
  lastSavedAt: 'Último save: {date}',
  notSavedYet: 'Ainda não guardado manualmente',
  saveNow: 'Guardar Agora',
  loadSave: 'Carregar Save',
  resetSave: 'Repor Save',
  confirmReset: 'Confirmar Reposição?',
  saveFeedbackSaved: 'Progresso guardado com sucesso!',
  saveFeedbackLoaded: 'Save carregado!',
  saveFeedbackReset: 'Save reposto para Bronze (0 EXP).',
  saveFeedbackSynced: 'Progresso sincronizado com a nuvem!',
  signInGoogle: 'Entrar com Google',
  signOutGoogle: 'Terminar Sessão',
  syncCloudNow: 'Sincronizar Nuvem',
  cloudSignedInAs: 'Ligado como {name}',
  cloudNotSignedIn: 'Entra com Google para guardar a tua patente na nuvem e entrar no Ranking Global.',
  matchHistoryTitle: 'Últimos Jogos',
  noMatchesYet: 'Ainda sem jogos registados.',
  leaderboardEmpty: 'Ainda não há jogadores ranqueados na nuvem.',
  refreshLeaderboard: 'Atualizar',
  backToMenu: 'Voltar ao Menu',
  serverConnected: 'Servidor Ligado',
  connecting: 'A ligar...',
  onlineTitle: 'Multijogador Online',
  onlineSubtitle:
    'Joga em tempo real pela internet em salas {size} vs {size} (lugares vazios usam IA).',
  queueTypeLabel: 'Tipo de Jogo',
  yourFieldName: 'O Teu Nome em Campo',
  namePlaceholder: 'Escreve a tua alcunha',
  quickOrNewRoomTitle: 'Jogo Rápido ou Nova Sala',
  quickOrNewRoomDesc:
    'Encontra qualquer jogador online ou cria uma sala privada com código.',
  findQuickMatch: 'Procurar Jogo Rápido',
  searchingOpponent: 'A procurar adversário... (Cancelar)',
  createCodeRoom: 'Criar Sala com Código',
  joinRoomTitle: 'Entrar numa Sala',
  joinRoomDesc: 'Pede o código de 5 letras ao teu amigo e entra na sala.',
  joinBtn: 'Entrar',
  roomCodeLabel: 'Código da Sala',
  switchTeam: 'Trocar de Equipa',
  copyCode: 'Copiar Código',
  copied: 'Copiado',
  blueTeam: 'Equipa Azul',
  redTeam: 'Equipa Vermelha',
  youTag: '(Tu)',
  leaveRoom: 'Sair da Sala',
  startOnlineMatch: 'Iniciar Jogo Online',
  waitingPlayers: 'A aguardar pelo menos 2 jogadores...',
  waitingHost: 'A aguardar que o anfitrião inicie o jogo...',
  goalPausedClock: 'Golo · Relógio Pausado',
  overtimeLabel: 'Prolongamento',
  regulationLabel: 'Tempo Regulamentar',
  pausedTitle: 'Jogo em Pausa',
  resumeMatch: 'Continuar Jogo',
  exitToMenu: 'Voltar ao Menu Inicial',
  youWonTitle: 'Venceste!',
  blueTeamWon: 'Equipa Azul Venceu!',
  redTeamWon: 'Equipa Vermelha Venceu!',
  drawReason: 'Empate oficial após {max} prolongamentos sem vencedor',
  overtimeDecided: 'Decidido no Prolongamento (+{sec}s)',
  playAgain: 'Jogar Novamente',
  actionShoot: 'Rematar',
  actionSprint: 'Correr',
  shootPowerLabel: 'Força do Remate',
  walkAimLabel: 'Andar / Apontar',
  walkAimHint: 'WASD ou Setas',
  canvasGoalTitle: 'GOLOOO!',
  canvasPrepareTitle: 'PREPARA-TE',
  canvasPrepareSub: 'Leva a bola até à baliza adversária!',
  canvasOvertimeTitle: 'EMPATE! +30s',
  canvasOvertimeSub: 'Prolongamento {cur}/{max} — Quem marcar mais vence',
  canvasPausedClock: 'Relógio pausado durante a celebração',
  canvasScoredFor: '{scorer} marcou pela {team}',
  serverConnectError: 'Não foi possível ligar ao servidor multijogador.',
  connectingWaitError: 'A ligar ao servidor... Tenta novamente dentro de 1 segundo.',
};

const EN_US: TranslationDict = {
  appName: 'Arena Soccer',
  headerDuration: '90s + up to 3×30s Overtime',
  soundOn: 'Sound On',
  soundOff: 'Muted',
  downloadHtml: 'Download HTML',
  heroEyebrow: 'Real-Time Arcade Soccer',
  heroTitle: 'Drive the ball into the opponent goal.',
  heroSubtitle:
    'Touch the ball to trap it at your feet, pass crisply with Pass, auto-control the teammate with the ball, and score with charged shots or dribbles.',
  rule1Title: '90s + up to 3 Overtimes',
  rule1Desc:
    'The clock pauses during goal celebrations. After 3 tied overtimes, the match ends in a draw.',
  rule2Title: 'Pass & Auto-Switch Control',
  rule2Desc:
    'Joystick moves and aims, and you always control the player on your team who has the ball.',
  chooseModeTitle: 'Choose Game Mode',
  chooseModeSubtitle:
    'Standard match, local duel with custom names, light AI training, or ranked online.',
  mode1pTitle: '1 Player',
  mode1pDesc: 'Normal mode vs AI',
  mode2pTitle: '2 Players',
  mode2pDesc: 'Local multiplayer',
  modeTrainingTitle: 'Training Mode',
  modeTrainingDesc: 'Light AI practice',
  modeOnlineTitle: 'Online',
  modeOnlineDesc: 'Casual or Ranked',
  teamFormat: 'Team Format',
  localP1Label: 'Player 1 Name (Blue)',
  localP2Label: 'Player 2 Name (Red)',
  localP1Placeholder: 'Player 1',
  localP2Placeholder: 'Player 2',
  openOnlineLobby: 'Open Online Lobby',
  startTraining: 'Start Training',
  startMatch: 'Start Match',
  footerControls1p:
    '1P/Training: WASD/Arrows · Shift Sprint · E Pass · G Dribble · Hold Space/F Shoot · 1–5 Emotes',
  footerControls2p:
    '2P Local: P1 WASD + Shift/E/G/F (1–5) · P2 Arrows + R-Shift/J/L/K (6–0)',
  saveAndRankBtn: 'Save & Ranked',
  saveModalTitle: 'Profile, Rank & Save System',
  saveModalSubtitle: 'Save local progress, sync to the cloud, and view global rankings.',
  close: 'Close',
  playerNameLabel: 'Player Name',
  currentRankLabel: 'Current Rank',
  expToNext: '{exp} EXP needed for {rank}',
  maxRankReached: 'Highest Rank Reached!',
  careerStatsTitle: 'Career Stats',
  rankedRecordLabel: 'Ranked (W / D / L)',
  totalMatchesLabel: 'Matches',
  totalGoalsLabel: 'Goals',
  localSaveTitle: 'Local Save (Browser)',
  cloudSaveTitle: 'Cloud Save (Google)',
  lastSavedAt: 'Last saved: {date}',
  notSavedYet: 'Not manually saved yet',
  saveNow: 'Save Now',
  loadSave: 'Load Save',
  resetSave: 'Reset Save',
  confirmReset: 'Confirm Reset?',
  saveFeedbackSaved: 'Progress saved locally!',
  saveFeedbackLoaded: 'Save loaded!',
  saveFeedbackReset: 'Save reset to Bronze (0 EXP).',
  saveFeedbackSynced: 'Cloud progress synced!',
  signInGoogle: 'Sign in with Google',
  signOutGoogle: 'Sign Out',
  syncCloudNow: 'Sync Cloud',
  cloudSignedInAs: 'Signed in as {name}',
  cloudNotSignedIn: 'Sign in with Google to save your rank to the cloud and join the Global Leaderboard.',
  matchHistoryTitle: 'Recent Matches',
  noMatchesYet: 'No matches recorded yet.',
  leaderboardTitle: 'Global Leaderboard (Top EXP)',
  leaderboardEmpty: 'No ranked players on the cloud leaderboard yet.',
  refreshLeaderboard: 'Refresh',
  rankProgressionTitle: 'Ranked Tiers (10 Ranks)',
  backToMenu: 'Back to Menu',
  serverConnected: 'Server Connected',
  connecting: 'Connecting...',
  onlineTitle: 'Online Multiplayer',
  onlineSubtitle:
    'Play live online in {size} vs {size} rooms (empty slots are filled by AI).',
  queueTypeLabel: 'Match Type',
  casualQueue: 'Casual',
  rankedQueue: 'Ranked (EXP)',
  rankedQueueDesc: 'Win or lose EXP and climb tiers up to Supersonic Champion.',
  casualQueueDesc: 'Friendly match without affecting your rank or EXP.',
  yourFieldName: 'Your Field Name',
  namePlaceholder: 'Enter your nickname',
  quickOrNewRoomTitle: 'Quick Match or New Room',
  quickOrNewRoomDesc: 'Match with any online player or create a private room code.',
  findQuickMatch: 'Find Quick Match',
  searchingOpponent: 'Searching opponent... (Cancel)',
  createCodeRoom: 'Create Room with Code',
  joinRoomTitle: 'Join a Room',
  joinRoomDesc: 'Ask your friend for the 5-letter room code to join.',
  joinBtn: 'Join',
  roomCodeLabel: 'Room Code',
  humansCount: 'humans',
  switchTeam: 'Switch Team',
  copyCode: 'Copy Code',
  copied: 'Copied',
  blueTeam: 'Blue Team',
  redTeam: 'Red Team',
  youTag: '(You)',
  aiLabel: 'AI',
  humanLabel: 'Human',
  leaveRoom: 'Leave Room',
  startOnlineMatch: 'Start Online Match',
  waitingPlayers: 'Waiting for at least 2 players...',
  waitingHost: 'Waiting for the host to start the match...',
  goalPausedClock: 'Goal · Clock Paused',
  overtimeLabel: 'Overtime',
  trainingModeLabel: 'Training Mode',
  regulationLabel: 'Regulation Time',
  pausedTitle: 'Game Paused',
  resumeMatch: 'Resume Match',
  restartMatch: 'Restart (90s)',
  exitToMenu: 'Exit to Main Menu',
  drawTitle: 'Draw!',
  youWonTitle: 'You Won!',
  wonSuffix: 'Won!',
  blueTeamWon: 'Blue Team Won!',
  redTeamWon: 'Red Team Won!',
  aiWon: 'AI Won!',
  drawReason: 'Official draw after {max} overtimes without a winner',
  overtimeDecided: 'Decided in Overtime (+{sec}s)',
  playAgain: 'Play Again',
  mainMenu: 'Main Menu',
  staminaLabel: 'Stamina',
  powerLabel: 'Power',
  shootPowerLabel: 'Shot Power',
  walkAimLabel: 'Move / Aim',
  walkAimHint: 'WASD or Arrows',
  emotesHint: 'Emotes (1–5):',
  emotes2pHint: 'Emotes: P1 (1–5) · P2 (6–0)',
  actionShoot: 'Shoot',
  actionPass: 'Pass',
  actionDribble: 'Dribble',
  actionSprint: 'Sprint',
  rankedSummaryTitle: 'Ranked Match Result',
  rankedPromoted: 'PROMOTED! New rank: {rank}',
  rankedWin: 'Ranked Victory',
  rankedLoss: 'Ranked Defeat',
  rankedDraw: 'Ranked Draw',
  canvasGoalTitle: 'GOOOAL!',
  canvasPrepareTitle: 'GET READY',
  canvasPrepareSub: 'Take the ball to the opponent goal!',
  canvasOvertimeTitle: 'TIE! +30s',
  canvasOvertimeSub: 'Overtime {cur}/{max} — Highest score wins',
  canvasPausedClock: 'Clock paused during goal celebration',
  canvasScoredFor: '{scorer} scored for {team}',
  serverConnectError: 'Could not connect to the multiplayer server.',
  connectingWaitError: 'Connecting to server... Try again in 1 second.',
};

const ES: TranslationDict = {
  appName: 'Arena Fútbol',
  headerDuration: '90s + hasta 3×30s Prórroga',
  soundOn: 'Sonido Activo',
  soundOff: 'Silenciado',
  downloadHtml: 'Descargar HTML',
  heroEyebrow: 'Fútbol Arcade en Tiempo Real',
  heroTitle: 'Lleva el balón hasta la portería rival.',
  heroSubtitle:
    'Toca el balón para pegarlo a tus pies, pasa con precisión con Pasar, controla automáticamente al jugador con balón y define con tiro cargado o regate.',
  rule1Title: '90s + hasta 3 Prórrogas',
  rule1Desc:
    'El reloj se detiene en la celebración del gol. Tras 3 prórrogas empatadas, termina en empate.',
  rule2Title: 'Pase y Cambio Automático',
  rule2Desc:
    'El joystick mueve y apunta, y siempre controlas al jugador de tu equipo que tiene el balón.',
  chooseModeTitle: 'Elige el Modo de Juego',
  chooseModeSubtitle:
    'Partido normal, duelo local con nombres, entrenamiento contra IA suave u online clasificatorio.',
  mode1pTitle: '1 Jugador',
  mode1pDesc: 'Modo normal vs IA',
  mode2pTitle: '2 Jugadores',
  mode2pDesc: 'Multijugador local',
  modeTrainingTitle: 'Modo Entreno',
  modeTrainingDesc: 'IA suave para entrenar',
  modeOnlineTitle: 'Online',
  modeOnlineDesc: 'Casual o Rankeada',
  teamFormat: 'Formato de Equipos',
  localP1Label: 'Nombre Jugador 1 (Azul)',
  localP2Label: 'Nombre Jugador 2 (Rojo)',
  localP1Placeholder: 'Jugador 1',
  localP2Placeholder: 'Jugador 2',
  openOnlineLobby: 'Abrir Lobby Online',
  startTraining: 'Iniciar Entreno',
  startMatch: 'Iniciar Partido',
  footerControls1p:
    '1P/Entreno: WASD/Flechas · Shift Correr · E Pasar · G Regatear · Mantener Espacio/F Chutar · 1–5 Emotes',
  footerControls2p:
    '2P Local: P1 WASD + Shift/E/G/F (1–5) · P2 Flechas + Shift Der./J/L/K (6–0)',
  saveAndRankBtn: 'Save y Rango',
  saveModalTitle: 'Perfil, Rango y Sistema de Guardado',
  saveModalSubtitle: 'Guarda tu progreso local, sincroniza en la nube y mira el ranking.',
  close: 'Cerrar',
  playerNameLabel: 'Nombre del Jugador',
  currentRankLabel: 'Rango Actual',
  expToNext: 'Faltan {exp} EXP para {rank}',
  maxRankReached: '¡Rango Máximo Alcanzado!',
  careerStatsTitle: 'Estadísticas de Carrera',
  rankedRecordLabel: 'Rankeada (V / E / D)',
  totalMatchesLabel: 'Partidos',
  totalGoalsLabel: 'Goles',
  localSaveTitle: 'Guardado Local (Navegador)',
  cloudSaveTitle: 'Guardado en la Nube (Google)',
  lastSavedAt: 'Último guardado: {date}',
  notSavedYet: 'Aún no guardado manualmente',
  saveNow: 'Guardar Ahora',
  loadSave: 'Cargar Save',
  resetSave: 'Reiniciar Save',
  confirmReset: '¿Confirmar Reinicio?',
  saveFeedbackSaved: '¡Progreso guardado con éxito!',
  saveFeedbackLoaded: '¡Partida guardada cargada!',
  saveFeedbackReset: 'Guardado reiniciado a Bronce (0 EXP).',
  saveFeedbackSynced: '¡Progreso sincronizado con la nube!',
  signInGoogle: 'Entrar con Google',
  signOutGoogle: 'Cerrar Sesión',
  syncCloudNow: 'Sincronizar Nube',
  cloudSignedInAs: 'Conectado como {name}',
  cloudNotSignedIn: 'Inicia sesión con Google para guardar tu rango en la nube y entrar en el Ranking Global.',
  matchHistoryTitle: 'Últimos Partidos',
  noMatchesYet: 'Aún no hay partidos registrados.',
  leaderboardTitle: 'Ranking Global (Top EXP)',
  leaderboardEmpty: 'Aún no hay jugadores rankeados en la nube.',
  refreshLeaderboard: 'Actualizar',
  rankProgressionTitle: 'Rangos Clasificatorios (10 Niveles)',
  backToMenu: 'Volver al Menú',
  serverConnected: 'Servidor Conectado',
  connecting: 'Conectando...',
  onlineTitle: 'Multijugador Online',
  onlineSubtitle:
    'Juega en tiempo real por internet en salas {size} vs {size} (los huecos libres usan IA).',
  queueTypeLabel: 'Tipo de Partido',
  casualQueue: 'Casual',
  rankedQueue: 'Rankeada (EXP)',
  rankedQueueDesc: 'Gana o pierde EXP y sube de rango hasta Supersonic Champion.',
  casualQueueDesc: 'Partido amistoso sin afectar tu rango ni tu EXP.',
  yourFieldName: 'Tu Nombre en Campo',
  namePlaceholder: 'Escribe tu apodo',
  quickOrNewRoomTitle: 'Partida Rápida o Nueva Sala',
  quickOrNewRoomDesc:
    'Encuentra a cualquier jugador online o crea una sala privada con código.',
  findQuickMatch: 'Buscar Partida Rápida',
  searchingOpponent: 'Buscando rival... (Cancelar)',
  createCodeRoom: 'Crear Sala con Código',
  joinRoomTitle: 'Unirse a una Sala',
  joinRoomDesc: 'Pide el código de 5 letras a tu amigo y únete a la sala.',
  joinBtn: 'Entrar',
  roomCodeLabel: 'Código de Sala',
  humansCount: 'humanos',
  switchTeam: 'Cambiar de Equipo',
  copyCode: 'Copiar Código',
  copied: 'Copiado',
  blueTeam: 'Equipo Azul',
  redTeam: 'Equipo Rojo',
  youTag: '(Tú)',
  aiLabel: 'IA',
  humanLabel: 'Humano',
  leaveRoom: 'Salir de la Sala',
  startOnlineMatch: 'Iniciar Partido Online',
  waitingPlayers: 'Esperando al menos 2 jugadores...',
  waitingHost: 'Esperando a que el anfitrión inicie el partido...',
  goalPausedClock: 'Gol · Reloj Pausado',
  overtimeLabel: 'Prórroga',
  trainingModeLabel: 'Modo Entreno',
  regulationLabel: 'Tiempo Reglamentario',
  pausedTitle: 'Juego en Pausa',
  resumeMatch: 'Continuar Partido',
  restartMatch: 'Reiniciar (90s)',
  exitToMenu: 'Volver al Menú Principal',
  drawTitle: '¡Empate!',
  youWonTitle: '¡Ganaste!',
  wonSuffix: '¡Ganó!',
  blueTeamWon: '¡Equipo Azul Ganó!',
  redTeamWon: '¡Equipo Rojo Ganó!',
  aiWon: '¡La IA Ganó!',
  drawReason: 'Empate oficial tras {max} prórrogas sin ganador',
  overtimeDecided: 'Decidido en la Prórroga (+{sec}s)',
  playAgain: 'Jugar de Nuevo',
  mainMenu: 'Menú Principal',
  staminaLabel: 'Energía',
  powerLabel: 'Fuerza',
  shootPowerLabel: 'Fuerza del Tiro',
  walkAimLabel: 'Mover / Apuntar',
  walkAimHint: 'WASD o Flechas',
  emotesHint: 'Emotes (1–5):',
  emotes2pHint: 'Emotes: J1 (1–5) · J2 (6–0)',
  actionShoot: 'Chutar',
  actionPass: 'Pasar',
  actionDribble: 'Regatear',
  actionSprint: 'Correr',
  rankedSummaryTitle: 'Resultado de Rankeada',
  rankedPromoted: '¡ASCENSO! Nuevo rango: {rank}',
  rankedWin: 'Victoria Rankeada',
  rankedLoss: 'Derrota Rankeada',
  rankedDraw: 'Empate Rankeado',
  canvasGoalTitle: '¡GOOOL!',
  canvasPrepareTitle: 'PREPÁRATE',
  canvasPrepareSub: '¡Lleva el balón a la portería rival!',
  canvasOvertimeTitle: '¡EMPATE! +30s',
  canvasOvertimeSub: 'Prórroga {cur}/{max} — Quien haga más goles gana',
  canvasPausedClock: 'Reloj pausado durante la celebración',
  canvasScoredFor: '{scorer} marcó para el {team}',
  serverConnectError: 'No se pudo conectar al servidor multijugador.',
  connectingWaitError: 'Conectando al servidor... Inténtalo de nuevo en 1 segundo.',
};

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  'pt-BR': PT_BR,
  'pt-PT': PT_PT,
  'en-US': EN_US,
  es: ES,
};

export function formatT(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}
