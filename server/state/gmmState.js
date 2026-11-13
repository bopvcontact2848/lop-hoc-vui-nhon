'use strict';

const { broadcastSSE } = require('./sseHub');

function createEmptyGmmTeamState() {
  return {
    score: 0,
    bonusScore: 0,
    answers: {},
    isLocked: false,
    finishTime: null,
    finishSeconds: null,
    unlockedRegions: [],
    coloredRegions: {},
    hasArtworkPhoto: false,
    photoTimestamp: 0,
    completed: false,
    isArtworkFinished: false,
    artworkFinishTime: null,
    artworkFinishSeconds: null,
    speedBonus: 0
  };
}

function createEmptyTeamTelemetry() {
  return {
    lastPingAt: 0,
    screenState: 'unknown',
    currentPage: 'lobby',
    currentQ: 1,
    answeredCount: 0,
    isLocked: false,
    wakeLockActive: false,
    exitGuardActive: false
  };
}

let gmmLiveState = {
  sessionId: Date.now(),
  roomCode: '2011-THCS',
  status: 'lobby',
  isMatchStarted: false,
  currentQIndex: 0,
  totalQuestions: 10,
  questions: [],
  currentQuestion: null,
  totalMatchSeconds: 120,
  timerSeconds: 120,
  isTimerRunning: false,
  isQuestionLocked: false,
  isAnswerRevealed: false,
  isDecryptPhase: false,
  decryptTimeLeft: 300,
  decryptTimeTotal: 300,
  isDecryptTimerRunning: false,
  decryptEndsAt: null,
  connectedTeams: { teamA: false, teamB: false },
  teamNames: { teamA: 'ĐOÀN KẾT', teamB: 'LA BÀN TUỔI TRẺ' },
  teamA: createEmptyGmmTeamState(),
  teamB: createEmptyGmmTeamState(),
  updatedAt: Date.now()
};

let gmmArtworkStore = {
  teamA: { photoData: null, timestamp: 0 },
  teamB: { photoData: null, timestamp: 0 }
};

let gmmTeamTelemetry = {
  teamA: createEmptyTeamTelemetry(),
  teamB: createEmptyTeamTelemetry()
};

const gmmTeamSockets = {
  teamA: new Map(),
  teamB: new Map()
};

const gmmDisconnectTimers = {
  teamA: null,
  teamB: null
};

let gmmTimerInterval = null;
let gmmDecryptTimerInterval = null;
let teamWatchdogInterval = null;

function getGmmLiveState() {
  return gmmLiveState;
}

function getGmmArtworkStore() {
  return gmmArtworkStore;
}

function getGmmTeamTelemetry() {
  return gmmTeamTelemetry;
}

function cancelTeamDisconnectTimer(team) {
  if (gmmDisconnectTimers[team]) {
    clearTimeout(gmmDisconnectTimers[team]);
    gmmDisconnectTimers[team] = null;
  }
}

function markTeamDisconnected(team, reason = 'disconnect') {
  if (team !== 'teamA' && team !== 'teamB') return;
  cancelTeamDisconnectTimer(team);
  if (gmmTeamSockets[team]) {
    gmmTeamSockets[team].clear();
  }
  const wasConnected = Boolean(gmmLiveState.connectedTeams && gmmLiveState.connectedTeams[team]);
  if (!gmmLiveState.connectedTeams) {
    gmmLiveState.connectedTeams = { teamA: false, teamB: false };
  }
  gmmLiveState.connectedTeams[team] = false;
  gmmTeamTelemetry[team] = createEmptyTeamTelemetry();
  gmmLiveState.updatedAt = Date.now();

  if (wasConnected || reason === 'teacher_kick') {
    broadcastSSE({
      type: 'gmm_team_left',
      team,
      reason,
      connectedTeams: gmmLiveState.connectedTeams,
      telemetry: gmmTeamTelemetry[team],
      serverTime: Date.now()
    });
  }
}

function scheduleTeamDisconnectIfNoActiveClient(team, delayMs = 1600, reason = 'socket_close') {
  if (team !== 'teamA' && team !== 'teamB') return;
  cancelTeamDisconnectTimer(team);
  const scheduledAt = Date.now();
  gmmDisconnectTimers[team] = setTimeout(() => {
    gmmDisconnectTimers[team] = null;
    const activeSockets = gmmTeamSockets[team] ? gmmTeamSockets[team].size : 0;
    const lastPing = (gmmTeamTelemetry[team] && gmmTeamTelemetry[team].lastPingAt) || 0;
    if (activeSockets === 0 && lastPing < scheduledAt) {
      markTeamDisconnected(team, reason);
    }
  }, delayMs);
}

function startTeamWatchdog() {
  if (teamWatchdogInterval) return;
  teamWatchdogInterval = setInterval(() => {
    const now = Date.now();
    ['teamA', 'teamB'].forEach((team) => {
      if (!gmmLiveState.connectedTeams || !gmmLiveState.connectedTeams[team]) return;
      const tel = gmmTeamTelemetry[team] || createEmptyTeamTelemetry();
      const lastPing = tel.lastPingAt || 0;
      const socketCount = gmmTeamSockets[team] ? gmmTeamSockets[team].size : 0;
      if (lastPing <= 0) return;

      const ageMs = now - lastPing;
      if (socketCount === 0 && ageMs > 6500) {
        markTeamDisconnected(team, 'no_socket_timeout');
        return;
      }
      if (tel.screenState !== 'hidden' && ageMs > 11500) {
        markTeamDisconnected(team, 'ping_timeout');
        return;
      }
      if (tel.screenState === 'hidden' && socketCount === 0 && ageMs > 30000) {
        markTeamDisconnected(team, 'hidden_timeout');
      }
    });
  }, 3000);
}

function startGmmTimer(seconds) {
  clearInterval(gmmTimerInterval);
  if (typeof seconds === 'number') {
    gmmLiveState.timerSeconds = seconds;
  }
  gmmLiveState.isTimerRunning = true;
  gmmLiveState.updatedAt = Date.now();

  broadcastSSE({
    type: 'gmm_timer_start',
    sessionId: gmmLiveState.sessionId,
    timerSeconds: gmmLiveState.timerSeconds,
    totalMatchSeconds: gmmLiveState.totalMatchSeconds || 120
  });

  gmmTimerInterval = setInterval(() => {
    if (!gmmLiveState.isTimerRunning) return;
    if (gmmLiveState.timerSeconds > 0) {
      gmmLiveState.timerSeconds--;
      broadcastSSE({
        type: 'gmm_timer_tick',
        sessionId: gmmLiveState.sessionId,
        timerSeconds: gmmLiveState.timerSeconds,
        totalMatchSeconds: gmmLiveState.totalMatchSeconds || 120
      });

      if (gmmLiveState.timerSeconds === 0) {
        clearInterval(gmmTimerInterval);
        gmmLiveState.isTimerRunning = false;
        if (gmmLiveState.teamA) gmmLiveState.teamA.isLocked = true;
        if (gmmLiveState.teamB) gmmLiveState.teamB.isLocked = true;
        broadcastSSE({
          type: 'gmm_time_up',
          sessionId: gmmLiveState.sessionId,
          state: gmmLiveState
        });
      }
    }
  }, 1000);
}

function pauseGmmTimer() {
  gmmLiveState.isTimerRunning = !gmmLiveState.isTimerRunning;
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_timer_pause',
    isTimerRunning: gmmLiveState.isTimerRunning,
    timerSeconds: gmmLiveState.timerSeconds
  });
}

function addGmmTime(seconds = 60) {
  gmmLiveState.timerSeconds = (gmmLiveState.timerSeconds || 0) + seconds;
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_timer_tick',
    timerSeconds: gmmLiveState.timerSeconds,
    totalMatchSeconds: gmmLiveState.totalMatchSeconds || 120
  });
}

function stopMainTimer() {
  clearInterval(gmmTimerInterval);
  gmmLiveState.isTimerRunning = false;
  broadcastSSE({
    type: 'gmm_timer_pause',
    isTimerRunning: false,
    timerSeconds: gmmLiveState.timerSeconds
  });
}

function getSyncedDecryptSeconds() {
  if (gmmLiveState.isDecryptTimerRunning && typeof gmmLiveState.decryptEndsAt === 'number') {
    const remainingMs = gmmLiveState.decryptEndsAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
  return Math.max(0, Number(gmmLiveState.decryptTimeLeft) || 0);
}

function startGmmDecryptTimer(seconds, totalSec) {
  clearInterval(gmmDecryptTimerInterval);
  if (typeof seconds === 'number') {
    gmmLiveState.decryptTimeLeft = Math.max(0, seconds);
  }
  if (typeof totalSec === 'number') {
    gmmLiveState.decryptTimeTotal = Math.max(1, totalSec);
  } else if (!gmmLiveState.decryptTimeTotal) {
    gmmLiveState.decryptTimeTotal = gmmLiveState.decryptTimeLeft || 300;
  }
  gmmLiveState.isDecryptPhase = true;
  gmmLiveState.isDecryptTimerRunning = true;
  gmmLiveState.decryptEndsAt = Date.now() + (Math.max(0, gmmLiveState.decryptTimeLeft) * 1000);
  gmmLiveState.updatedAt = Date.now();

  broadcastSSE({
    type: 'gmm_decrypt_timer_start',
    sessionId: gmmLiveState.sessionId,
    serverTime: Date.now(),
    decryptTimeLeft: gmmLiveState.decryptTimeLeft,
    remainingSeconds: gmmLiveState.decryptTimeLeft,
    decryptTimeTotal: gmmLiveState.decryptTimeTotal,
    isDecryptTimerRunning: true
  });

  gmmDecryptTimerInterval = setInterval(() => {
    if (!gmmLiveState.isDecryptTimerRunning) return;
    const synced = getSyncedDecryptSeconds();
    gmmLiveState.decryptTimeLeft = synced;

    if (synced > 0) {
      broadcastSSE({
        type: 'gmm_decrypt_timer_tick',
        sessionId: gmmLiveState.sessionId,
        serverTime: Date.now(),
        decryptTimeLeft: synced,
        remainingSeconds: synced,
        decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300,
        isDecryptTimerRunning: true
      });
    } else {
      clearInterval(gmmDecryptTimerInterval);
      gmmLiveState.isDecryptTimerRunning = false;
      gmmLiveState.decryptEndsAt = null;
      broadcastSSE({
        type: 'gmm_decrypt_time_up',
        sessionId: gmmLiveState.sessionId,
        serverTime: Date.now(),
        decryptTimeLeft: 0,
        remainingSeconds: 0,
        decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300
      });
    }
  }, 1000);
}

function pauseGmmDecryptTimer() {
  if (gmmLiveState.isDecryptTimerRunning) {
    gmmLiveState.decryptTimeLeft = getSyncedDecryptSeconds();
    gmmLiveState.isDecryptTimerRunning = false;
    gmmLiveState.decryptEndsAt = null;
  } else {
    gmmLiveState.isDecryptTimerRunning = true;
    gmmLiveState.decryptEndsAt = Date.now() + (Math.max(0, gmmLiveState.decryptTimeLeft || 0) * 1000);
  }
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_decrypt_timer_pause',
    sessionId: gmmLiveState.sessionId,
    serverTime: Date.now(),
    isDecryptTimerRunning: gmmLiveState.isDecryptTimerRunning,
    decryptTimeLeft: gmmLiveState.decryptTimeLeft,
    remainingSeconds: gmmLiveState.decryptTimeLeft,
    decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300
  });
}

function setGmmDecryptDuration(seconds = 300) {
  const safeSeconds = Math.max(0, seconds);
  gmmLiveState.decryptTimeLeft = safeSeconds;
  gmmLiveState.decryptTimeTotal = Math.max(1, safeSeconds);
  if (gmmLiveState.isDecryptTimerRunning) {
    gmmLiveState.decryptEndsAt = Date.now() + (safeSeconds * 1000);
  }
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_decrypt_timer_tick',
    sessionId: gmmLiveState.sessionId,
    serverTime: Date.now(),
    decryptTimeLeft: gmmLiveState.decryptTimeLeft,
    remainingSeconds: gmmLiveState.decryptTimeLeft,
    decryptTimeTotal: gmmLiveState.decryptTimeTotal,
    isDecryptTimerRunning: gmmLiveState.isDecryptTimerRunning
  });
}

function addGmmDecryptTime(seconds = 30) {
  const baseLeft = getSyncedDecryptSeconds();
  gmmLiveState.decryptTimeLeft = Math.max(0, baseLeft + seconds);
  gmmLiveState.decryptTimeTotal = Math.max(1, (gmmLiveState.decryptTimeTotal || 300) + seconds);
  if (gmmLiveState.isDecryptTimerRunning) {
    gmmLiveState.decryptEndsAt = Date.now() + (gmmLiveState.decryptTimeLeft * 1000);
  }
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_decrypt_timer_tick',
    sessionId: gmmLiveState.sessionId,
    serverTime: Date.now(),
    decryptTimeLeft: gmmLiveState.decryptTimeLeft,
    remainingSeconds: gmmLiveState.decryptTimeLeft,
    decryptTimeTotal: gmmLiveState.decryptTimeTotal,
    isDecryptTimerRunning: gmmLiveState.isDecryptTimerRunning
  });
}

function stopGmmDecryptTimer() {
  clearInterval(gmmDecryptTimerInterval);
  gmmLiveState.decryptTimeLeft = getSyncedDecryptSeconds();
  gmmLiveState.isDecryptTimerRunning = false;
  gmmLiveState.decryptEndsAt = null;
  gmmLiveState.updatedAt = Date.now();
  broadcastSSE({
    type: 'gmm_decrypt_timer_pause',
    sessionId: gmmLiveState.sessionId,
    serverTime: Date.now(),
    isDecryptTimerRunning: false,
    decryptTimeLeft: gmmLiveState.decryptTimeLeft,
    remainingSeconds: gmmLiveState.decryptTimeLeft,
    decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300
  });
}

function resetGmmSession(parsed = {}) {
  clearInterval(gmmTimerInterval);
  clearInterval(gmmDecryptTimerInterval);
  gmmDecryptTimerInterval = null;

  const prevSessionId = gmmLiveState.sessionId || 0;
  const prevConnected = Object.assign({ teamA: false, teamB: false }, gmmLiveState.connectedTeams || {});
  const newSessionId = Math.max(Number(parsed.sessionId) || Date.now(), Number(prevSessionId) + 1);
  const nextDuration = Number(parsed.totalMatchSeconds) || gmmLiveState.totalMatchSeconds || 120;
  const prevTeamNames = Object.assign({ teamA: 'ĐOÀN KẾT', teamB: 'LA BÀN TUỔI TRẺ' }, gmmLiveState.teamNames || {});

  gmmArtworkStore = {
    teamA: { photoData: null, timestamp: 0 },
    teamB: { photoData: null, timestamp: 0 }
  };

  if (parsed.keepConnectedTeams !== false) {
    ['teamA', 'teamB'].forEach((tKey) => {
      gmmTeamTelemetry[tKey] = Object.assign(createEmptyTeamTelemetry(), {
        lastPingAt: gmmTeamTelemetry[tKey]?.lastPingAt || 0,
        screenState: gmmTeamTelemetry[tKey]?.screenState || 'unknown',
        wakeLockActive: Boolean(gmmTeamTelemetry[tKey]?.wakeLockActive),
        exitGuardActive: Boolean(gmmTeamTelemetry[tKey]?.exitGuardActive),
        currentPage: 'lobby',
        currentQ: 1,
        answeredCount: 0,
        isLocked: false
      });
    });
  } else {
    gmmTeamTelemetry = {
      teamA: createEmptyTeamTelemetry(),
      teamB: createEmptyTeamTelemetry()
    };
  }

  gmmLiveState = {
    sessionId: newSessionId,
    roomCode: parsed.roomCode || '2011-THCS',
    status: parsed.status || 'lobby',
    isMatchStarted: false,
    currentQIndex: 0,
    totalQuestions: 10,
    questions: [],
    currentQuestion: null,
    totalMatchSeconds: nextDuration,
    timerSeconds: nextDuration,
    isTimerRunning: false,
    isQuestionLocked: false,
    isAnswerRevealed: false,
    isDecryptPhase: false,
    decryptTimeLeft: 300,
    decryptTimeTotal: 300,
    isDecryptTimerRunning: false,
    decryptEndsAt: null,
    connectedTeams: parsed.keepConnectedTeams !== false ? prevConnected : { teamA: false, teamB: false },
    teamNames: parsed.teamNames || prevTeamNames,
    teamA: createEmptyGmmTeamState(),
    teamB: createEmptyGmmTeamState(),
    updatedAt: Date.now()
  };

  broadcastSSE({
    type: 'gmm_reset',
    sessionId: newSessionId,
    state: gmmLiveState
  });

  return gmmLiveState;
}

function stopAllTimersAndWatchdogs() {
  clearInterval(gmmTimerInterval);
  clearInterval(gmmDecryptTimerInterval);
  clearInterval(teamWatchdogInterval);
  gmmTimerInterval = null;
  gmmDecryptTimerInterval = null;
  teamWatchdogInterval = null;
  cancelTeamDisconnectTimer('teamA');
  cancelTeamDisconnectTimer('teamB');
}

module.exports = {
  createEmptyGmmTeamState,
  createEmptyTeamTelemetry,
  getGmmLiveState,
  getGmmArtworkStore,
  getGmmTeamTelemetry,
  gmmTeamSockets,
  cancelTeamDisconnectTimer,
  markTeamDisconnected,
  scheduleTeamDisconnectIfNoActiveClient,
  startTeamWatchdog,
  startGmmTimer,
  pauseGmmTimer,
  addGmmTime,
  stopMainTimer,
  getSyncedDecryptSeconds,
  startGmmDecryptTimer,
  pauseGmmDecryptTimer,
  setGmmDecryptDuration,
  addGmmDecryptTime,
  stopGmmDecryptTimer,
  resetGmmSession,
  stopAllTimersAndWatchdogs
};
