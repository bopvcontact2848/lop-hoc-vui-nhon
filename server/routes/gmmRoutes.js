'use strict';

const { sendJson, readJsonBody } = require('../utils/httpHelpers');
const { broadcastSSE } = require('../state/sseHub');
const gmmState = require('../state/gmmState');

function isWaitingMatchPhase(live) {
  return (
    live.status === 'lobby' ||
    live.status === 'home' ||
    live.status === 'quiz_waiting' ||
    (live.status === 'quiz' && !live.isMatchStarted)
  );
}

function isStaleSessionRequest(live, sessionId) {
  return isWaitingMatchPhase(live) || (sessionId && live.sessionId && String(sessionId) !== String(live.sessionId));
}

function mergeIncomingTeamState(live, teamKey, prevTeam, incomingTeam, isSameActiveMatch, artworkStore) {
  if (incomingTeam) {
    if (isSameActiveMatch) {
      live[teamKey] = Object.assign({}, prevTeam, incomingTeam, {
        answers: Object.assign({}, prevTeam.answers || {}, incomingTeam.answers || {}),
        isLocked: Boolean(prevTeam.isLocked || incomingTeam.isLocked),
        finishTime: prevTeam.finishTime || incomingTeam.finishTime || null,
        finishSeconds: typeof prevTeam.finishSeconds === 'number' ? prevTeam.finishSeconds : (incomingTeam.finishSeconds ?? null)
      });
    } else {
      live[teamKey] = Object.assign(gmmState.createEmptyGmmTeamState(), incomingTeam, {
        answers: Object.assign({}, incomingTeam.answers || {}),
        isLocked: Boolean(incomingTeam.isLocked),
        finishTime: incomingTeam.isLocked ? (incomingTeam.finishTime || null) : null,
        finishSeconds: incomingTeam.isLocked && typeof incomingTeam.finishSeconds === 'number' ? incomingTeam.finishSeconds : null
      });
    }
  }

  if (live[teamKey]) {
    live[teamKey].hasArtworkPhoto = Boolean(artworkStore[teamKey].photoData);
    live[teamKey].photoTimestamp = artworkStore[teamKey].timestamp || 0;
    if (prevTeam.isArtworkFinished) {
      live[teamKey].isArtworkFinished = true;
      live[teamKey].artworkFinishTime = prevTeam.artworkFinishTime;
      live[teamKey].artworkFinishSeconds = prevTeam.artworkFinishSeconds;
      live[teamKey].speedBonus = prevTeam.speedBonus || 0;
      live[teamKey].completed = true;
    }
  }
}

/**
 * Xử lý toàn bộ API trò chơi Giải Mã Bí Mật (/api/gmm/*).
 */
async function handleGmmRoutes(req, res) {
  if (!req.url.startsWith('/api/gmm/')) {
    return false;
  }

  const live = gmmState.getGmmLiveState();
  const artworkStore = gmmState.getGmmArtworkStore();
  const telemetry = gmmState.getGmmTeamTelemetry();

  if (req.url === '/api/gmm/state' && req.method === 'GET') {
    const syncedDecryptLeft = gmmState.getSyncedDecryptSeconds();
    live.decryptTimeLeft = syncedDecryptLeft;
    sendJson(res, 200, {
      success: true,
      serverTime: Date.now(),
      remainingSeconds: syncedDecryptLeft,
      telemetry,
      state: live
    });
    return true;
  }

  if (req.url === '/api/gmm/state' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const prevSessionId = live.sessionId;
      const prevConnectedTeams = Object.assign({ teamA: false, teamB: false }, live.connectedTeams || {});
      const prevTeams = {
        teamA: Object.assign(gmmState.createEmptyGmmTeamState(), live.teamA || {}),
        teamB: Object.assign(gmmState.createEmptyGmmTeamState(), live.teamB || {})
      };

      const isResetForNewMatch = Boolean(payload.resetForNewMatch);
      const isForceTeamOverwrite = Boolean(payload.forceTeamOverwrite || isResetForNewMatch);
      delete payload.resetForNewMatch;
      delete payload.forceTeamOverwrite;

      if (isResetForNewMatch) {
        artworkStore.teamA = { photoData: null, timestamp: 0 };
        artworkStore.teamB = { photoData: null, timestamp: 0 };
        ['teamA', 'teamB'].forEach((tKey) => {
          telemetry[tKey] = prevConnectedTeams[tKey]
            ? Object.assign(gmmState.createEmptyTeamTelemetry(), {
              lastPingAt: telemetry[tKey]?.lastPingAt || Date.now(),
              screenState: telemetry[tKey]?.screenState || 'visible',
              wakeLockActive: Boolean(telemetry[tKey]?.wakeLockActive),
              exitGuardActive: Boolean(telemetry[tKey]?.exitGuardActive),
              currentPage: 'quiz',
              currentQ: 1,
              answeredCount: 0,
              isLocked: false
            })
            : gmmState.createEmptyTeamTelemetry();
        });
        live.sessionId = Math.max(Number(payload.sessionId) || Date.now(), (Number(prevSessionId) || 0) + 1);
        payload.sessionId = live.sessionId;
        live.teamA = gmmState.createEmptyGmmTeamState();
        live.teamB = gmmState.createEmptyGmmTeamState();
      } else if (payload.sessionId) {
        live.sessionId = payload.sessionId;
      } else if (!live.sessionId) {
        live.sessionId = Date.now();
      }

      const isSessionChanged = String(live.sessionId) !== String(prevSessionId);
      const isSameActiveMatch = !isSessionChanged && !isForceTeamOverwrite && Boolean(live.isMatchStarted) && Boolean(payload.isMatchStarted);

      delete payload.connectedTeams;
      live.connectedTeams = prevConnectedTeams;

      const incomingTeams = { teamA: payload.teamA, teamB: payload.teamB };
      delete payload.teamA;
      delete payload.teamB;

      if (!isResetForNewMatch && live.isDecryptTimerRunning) {
        delete payload.decryptTimeLeft;
        delete payload.decryptTimeTotal;
        delete payload.isDecryptTimerRunning;
        delete payload.decryptEndsAt;
      }

      Object.assign(live, payload);

      for (const teamKey of ['teamA', 'teamB']) {
        mergeIncomingTeamState(live, teamKey, prevTeams[teamKey], incomingTeams[teamKey], isSameActiveMatch, artworkStore);
      }
      live.updatedAt = Date.now();

      if (isResetForNewMatch || isSessionChanged) {
        broadcastSSE({ type: 'gmm_reset', sessionId: live.sessionId, silentToast: true, state: live });
      }
      broadcastSSE({ type: 'gmm_state_update', sessionId: live.sessionId, state: live });

      sendJson(res, 200, { success: true, sessionId: live.sessionId, state: live });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/submit' && req.method === 'POST') {
    try {
      const { team, questionId, optionIndex, sessionId, currentQ } = await readJsonBody(req);
      if (team !== 'teamA' && team !== 'teamB') {
        sendJson(res, 400, { success: false, error: 'Thiếu hoặc sai tên đội (teamA / teamB)' });
        return true;
      }

      if (isStaleSessionRequest(live, sessionId)) {
        sendJson(res, 409, {
          success: false,
          staleSession: true,
          currentSessionId: live.sessionId,
          state: live,
          error: 'Phiên thi đấu đã được đặt lại sang ván mới'
        });
        return true;
      }

      if (live[team] && live[team].isLocked) {
        sendJson(res, 409, {
          success: false,
          teamLocked: true,
          currentSessionId: live.sessionId,
          state: live,
          error: 'Đội đã chốt nộp bài'
        });
        return true;
      }

      if (live[team]) {
        live[team].answers[questionId] = optionIndex;
        live.updatedAt = Date.now();
      }

      gmmState.cancelTeamDisconnectTimer(team);
      if (!telemetry[team]) telemetry[team] = gmmState.createEmptyTeamTelemetry();
      telemetry[team].lastPingAt = Date.now();
      telemetry[team].screenState = 'visible';
      telemetry[team].currentPage = 'quiz';
      if (currentQ !== undefined && currentQ !== null) {
        telemetry[team].currentQ = Math.max(1, Math.min(20, Number(currentQ) || 1));
      }
      telemetry[team].answeredCount = Object.keys(live[team]?.answers || {}).length;

      broadcastSSE({
        type: 'gmm_team_answered',
        sessionId: live.sessionId,
        team,
        questionId,
        optionIndex,
        currentQ: telemetry[team].currentQ
      });

      sendJson(res, 200, { success: true, sessionId: live.sessionId, team, questionId, optionIndex });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/paint' && req.method === 'POST') {
    try {
      const { team, regionId, color } = await readJsonBody(req);
      if (live[team]) {
        live[team].coloredRegions[regionId] = color;
      }
      broadcastSSE({ type: 'gmm_region_colored', team, regionId, color });
      sendJson(res, 200, { success: true, team, regionId, color });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/join' && req.method === 'POST') {
    try {
      const { team } = await readJsonBody(req);
      if (team === 'teamA' || team === 'teamB') {
        gmmState.cancelTeamDisconnectTimer(team);
        if (!live.connectedTeams) live.connectedTeams = { teamA: false, teamB: false };
        live.connectedTeams[team] = true;
        telemetry[team] = Object.assign(gmmState.createEmptyTeamTelemetry(), telemetry[team] || {}, {
          lastPingAt: Date.now(),
          screenState: 'visible'
        });
        live.updatedAt = Date.now();
        broadcastSSE({ type: 'gmm_team_joined', team, connectedTeams: live.connectedTeams });
        sendJson(res, 200, { success: true, team, connectedTeams: live.connectedTeams });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Sai thông tin đội tham gia' });
    return true;
  }

  if (req.url === '/api/gmm/leave' && req.method === 'POST') {
    try {
      const { team, cid, reason } = await readJsonBody(req);
      if (team === 'teamA' || team === 'teamB') {
        if (cid && gmmState.gmmTeamSockets[team]) {
          gmmState.gmmTeamSockets[team].delete(cid);
        }
        const isImmediate = (reason === 'explicit_exit' || reason === 'teacher_kick');
        if (isImmediate) {
          gmmState.markTeamDisconnected(team, reason);
        } else if (!gmmState.gmmTeamSockets[team] || gmmState.gmmTeamSockets[team].size === 0) {
          gmmState.scheduleTeamDisconnectIfNoActiveClient(team, 1300, reason || 'page_unload');
        }
        sendJson(res, 200, { success: true, team, connectedTeams: live.connectedTeams });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Sai thông tin đội ngắt kết nối' });
    return true;
  }

  if (req.url === '/api/gmm/ping' && req.method === 'POST') {
    try {
      const parsed = await readJsonBody(req);
      const team = parsed.team;
      if (team === 'teamA' || team === 'teamB') {
        gmmState.cancelTeamDisconnectTimer(team);
        const now = Date.now();
        if (!live.connectedTeams) live.connectedTeams = { teamA: false, teamB: false };
        live.connectedTeams[team] = true;

        const validScreen = (parsed.screenState === 'visible' || parsed.screenState === 'hidden') ? parsed.screenState : 'visible';
        const validPage = ['lobby', 'quiz', 'locked', 'decrypt'].includes(parsed.currentPage) ? parsed.currentPage : 'lobby';

        telemetry[team] = {
          lastPingAt: now,
          screenState: validScreen,
          currentPage: validPage,
          currentQ: Math.max(1, Math.min(20, Number(parsed.currentQ) || 1)),
          answeredCount: Math.max(0, Math.min(20, Number(parsed.answeredCount) || 0)),
          isLocked: Boolean(parsed.isLocked),
          wakeLockActive: Boolean(parsed.wakeLockActive),
          exitGuardActive: Boolean(parsed.exitGuardActive)
        };

        broadcastSSE({
          type: 'gmm_team_ping',
          team,
          telemetry: telemetry[team],
          connectedTeams: live.connectedTeams,
          serverTime: now
        });

        sendJson(res, 200, { success: true, serverTime: now, sessionId: live.sessionId });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Dữ liệu nhịp tim không hợp lệ' });
    return true;
  }

  if (req.url === '/api/gmm/timer' && req.method === 'POST') {
    try {
      const { action, seconds, totalMatchSeconds } = await readJsonBody(req);
      if (typeof totalMatchSeconds === 'number') {
        live.totalMatchSeconds = totalMatchSeconds;
      }
      if (action === 'start') {
        gmmState.startGmmTimer(seconds || live.timerSeconds || 300);
      } else if (action === 'pause') {
        gmmState.pauseGmmTimer();
      } else if (action === 'add') {
        gmmState.addGmmTime(seconds || 60);
      } else if (action === 'set') {
        live.timerSeconds = seconds || 300;
        broadcastSSE({ type: 'gmm_timer_tick', timerSeconds: live.timerSeconds, totalMatchSeconds: live.totalMatchSeconds || 300 });
      } else if (action === 'stop') {
        gmmState.stopMainTimer();
      }
      sendJson(res, 200, {
        success: true,
        timerSeconds: live.timerSeconds,
        isTimerRunning: live.isTimerRunning,
        totalMatchSeconds: live.totalMatchSeconds
      });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/decrypt-timer' && req.method === 'POST') {
    try {
      const { action, seconds, totalSeconds } = await readJsonBody(req);
      if (action === 'start' || action === 'resume') {
        gmmState.startGmmDecryptTimer(seconds, totalSeconds);
      } else if (action === 'pause') {
        gmmState.pauseGmmDecryptTimer();
      } else if (action === 'set') {
        gmmState.setGmmDecryptDuration(seconds || 300);
      } else if (action === 'add') {
        gmmState.addGmmDecryptTime(seconds || 30);
      } else if (action === 'stop') {
        gmmState.stopGmmDecryptTimer();
      }

      const syncedDecryptLeft = gmmState.getSyncedDecryptSeconds();
      live.decryptTimeLeft = syncedDecryptLeft;

      sendJson(res, 200, {
        success: true,
        serverTime: Date.now(),
        decryptTimeLeft: syncedDecryptLeft,
        remainingSeconds: syncedDecryptLeft,
        decryptTimeTotal: live.decryptTimeTotal || 300,
        isDecryptTimerRunning: live.isDecryptTimerRunning
      });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/lock-team' && req.method === 'POST') {
    try {
      const { team, answers, finishTime, finishSeconds, sessionId } = await readJsonBody(req);
      if (team === 'teamA' || team === 'teamB') {
        if (isStaleSessionRequest(live, sessionId)) {
          sendJson(res, 409, {
            success: false,
            staleSession: true,
            currentSessionId: live.sessionId,
            state: live,
            error: 'Phiên thi đấu đã chuyển sang ván mới'
          });
          return true;
        }
        if (!live[team]) live[team] = gmmState.createEmptyGmmTeamState();
        live[team].isLocked = true;
        if (answers) live[team].answers = Object.assign(live[team].answers || {}, answers);
        if (finishTime) live[team].finishTime = finishTime;
        if (typeof finishSeconds === 'number') live[team].finishSeconds = finishSeconds;
        live.updatedAt = Date.now();

        broadcastSSE({
          type: 'gmm_team_locked',
          sessionId: live.sessionId,
          team,
          answers: live[team].answers,
          finishTime: live[team].finishTime,
          finishSeconds: live[team].finishSeconds,
          state: live
        });

        sendJson(res, 200, { success: true, sessionId: live.sessionId, team, state: live });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Thiếu hoặc sai tên đội' });
    return true;
  }

  if (req.url === '/api/gmm/unlock-team' && req.method === 'POST') {
    try {
      const { team } = await readJsonBody(req);
      if (team === 'teamA' || team === 'teamB') {
        if (!live[team]) live[team] = gmmState.createEmptyGmmTeamState();
        live[team].isLocked = false;
        live[team].finishTime = null;
        live[team].finishSeconds = null;
        live[team].score = 0;
        live[team].unlockedRegions = [];
        live.updatedAt = Date.now();

        if (telemetry[team]) {
          telemetry[team].isLocked = false;
          telemetry[team].currentPage = 'quiz';
        }

        broadcastSSE({
          type: 'gmm_team_unlocked',
          sessionId: live.sessionId,
          team,
          answers: live[team].answers || {},
          timerSeconds: live.timerSeconds,
          totalMatchSeconds: live.totalMatchSeconds,
          isTimerRunning: live.isTimerRunning,
          state: live
        });

        sendJson(res, 200, {
          success: true,
          sessionId: live.sessionId,
          team,
          answers: live[team].answers || {},
          state: live
        });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Thiếu hoặc sai tên đội cần mở khóa (teamA / teamB)' });
    return true;
  }

  if (req.url === '/api/gmm/finish-artwork' && req.method === 'POST') {
    try {
      const { team, finishTime, finishSeconds, remainingSeconds, speedBonus } = await readJsonBody(req);
      if (team === 'teamA' || team === 'teamB') {
        if (!live[team]) live[team] = gmmState.createEmptyGmmTeamState();
        const earnedBonus = typeof speedBonus === 'number' ? speedBonus : 2;
        live[team].completed = true;
        live[team].isArtworkFinished = true;
        live[team].artworkFinishTime = finishTime || new Date().toLocaleTimeString('vi-VN');
        live[team].artworkFinishSeconds = finishSeconds || 0;
        live[team].artworkRemainingSeconds = remainingSeconds || 0;
        live[team].speedBonus = earnedBonus;
        live[team].bonusScore = (live[team].bonusScore || 0) + earnedBonus;
        live.updatedAt = Date.now();

        broadcastSSE({
          type: 'gmm_artwork_finished',
          sessionId: live.sessionId,
          team,
          finishTime: live[team].artworkFinishTime,
          finishSeconds: live[team].artworkFinishSeconds,
          remainingSeconds: live[team].artworkRemainingSeconds,
          speedBonus: earnedBonus,
          bonusScore: live[team].bonusScore,
          state: live
        });

        sendJson(res, 200, {
          success: true,
          sessionId: live.sessionId,
          team,
          finishTime: live[team].artworkFinishTime,
          speedBonus: earnedBonus,
          bonusScore: live[team].bonusScore,
          state: live
        });
        return true;
      }
    } catch (_err) {}
    sendJson(res, 400, { success: false, error: 'Sai thông tin đội báo cáo' });
    return true;
  }

  if (req.url.startsWith('/api/gmm/upload-artwork') && req.method === 'POST') {
    try {
      const parsed = await readJsonBody(req, 20 * 1024 * 1024);
      let team = parsed.team;
      if (team === 'A') team = 'teamA';
      if (team === 'B') team = 'teamB';
      const photoData = parsed.photoData;

      if ((team === 'teamA' || team === 'teamB') && photoData && typeof photoData === 'string') {
        const ts = Date.now();
        artworkStore[team] = { photoData, timestamp: ts };
        if (!live[team]) live[team] = gmmState.createEmptyGmmTeamState();
        live[team].hasArtworkPhoto = true;
        live[team].photoTimestamp = ts;
        live.updatedAt = ts;

        console.log(`📸 [Giải Mã Bí Mật] Đã nhận ảnh tranh từ ${team} (${Math.round(photoData.length / 1024)} KB)`);
        broadcastSSE({ type: 'gmm_artwork_photo', team, photoData, timestamp: ts });
        sendJson(res, 200, { success: true, team, timestamp: ts });
        return true;
      }
      sendJson(res, 400, { success: false, error: 'Thiếu dữ liệu ảnh hoặc sai tên đội' });
    } catch (err) {
      if (err.statusCode === 413) {
        sendJson(res, 413, { success: false, error: 'Kích thước ảnh vượt quá 20MB' });
      } else {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
    }
    return true;
  }

  if (req.url.startsWith('/api/gmm/artworks') && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const sinceA = Number(urlObj.searchParams.get('tsA') || 0);
      const sinceB = Number(urlObj.searchParams.get('tsB') || 0);
      const responsePayload = { success: true, hasUpdate: false };

      for (const [teamKey, sinceTs] of [['teamA', sinceA], ['teamB', sinceB]]) {
        if (artworkStore[teamKey].photoData && artworkStore[teamKey].timestamp > sinceTs) {
          responsePayload.hasUpdate = true;
          responsePayload[teamKey] = {
            photoData: artworkStore[teamKey].photoData,
            timestamp: artworkStore[teamKey].timestamp
          };
        }
      }
      sendJson(res, 200, responsePayload);
    } catch (err) {
      sendJson(res, 400, { success: false, error: err.message });
    }
    return true;
  }

  if (req.url === '/api/gmm/reset' && req.method === 'POST') {
    let parsed = {};
    try {
      parsed = await readJsonBody(req);
    } catch (_err) {}
    const nextState = gmmState.resetGmmSession(parsed);
    sendJson(res, 200, { success: true, sessionId: nextState.sessionId, state: nextState });
    return true;
  }

  return false;
}

module.exports = { handleGmmRoutes };
