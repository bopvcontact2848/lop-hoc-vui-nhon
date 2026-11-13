'use strict';

const { sendJson, readJsonBody, getAllLocalIps } = require('../utils/httpHelpers');
const { addSseClient, removeSseClient, getClientCount, broadcastSSE } = require('../state/sseHub');
const gmmState = require('../state/gmmState');

/**
 * Xử lý các tuyến API điều khiển từ xa & luồng Server-Sent Events (/api/ip, /api/sync/*).
 */
async function handleRemoteRoutes(req, res, portGetter) {
  if (req.url.startsWith('/api/ip') && req.method === 'GET') {
    const candidates = getAllLocalIps();
    const localIp = candidates.length > 0 ? candidates[0].ip : 'localhost';
    const currentPort = portGetter();
    sendJson(res, 200, {
      success: true,
      ip: localIp,
      allIps: candidates.map((c) => ({ name: c.name, ip: c.ip })),
      port: currentPort,
      remoteUrl: `http://${localIp}:${currentPort}/remote.html`,
      projectorUrl: `http://${localIp}:${currentPort}/index.html?projector=1`,
      matThuUrl: `http://${localIp}:${currentPort}/?game=mat_thu`,
      clientCount: getClientCount()
    });
    return true;
  }

  if (req.url.startsWith('/api/sync/events') && req.method === 'GET') {
    let sseRole = '';
    let sseTeam = '';
    let sseCid = '';
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      sseRole = parsedUrl.searchParams.get('role') || '';
      sseTeam = parsedUrl.searchParams.get('team') || '';
      sseCid = parsedUrl.searchParams.get('cid') || ('sse_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    } catch (_err) {}

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const live = gmmState.getGmmLiveState();
    const telemetry = gmmState.getGmmTeamTelemetry();
    const syncedDecryptLeft = gmmState.getSyncedDecryptSeconds();
    live.decryptTimeLeft = syncedDecryptLeft;

    const totalClients = addSseClient(res);
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      clients: totalClients,
      serverTime: Date.now(),
      sessionId: live.sessionId,
      isDecryptPhase: Boolean(live.isDecryptPhase),
      isDecryptTimerRunning: Boolean(live.isDecryptTimerRunning),
      decryptTimeLeft: syncedDecryptLeft,
      remainingSeconds: syncedDecryptLeft,
      decryptTimeTotal: live.decryptTimeTotal || 300,
      timerSeconds: live.timerSeconds,
      isTimerRunning: Boolean(live.isTimerRunning),
      state: live
    })}\n\n`);

    const isTrackedStudent = (sseRole === 'student' && (sseTeam === 'teamA' || sseTeam === 'teamB'));
    if (isTrackedStudent) {
      gmmState.cancelTeamDisconnectTimer(sseTeam);
      gmmState.gmmTeamSockets[sseTeam].set(sseCid, res);
      if (!live.connectedTeams) {
        live.connectedTeams = { teamA: false, teamB: false };
      }
      const wasConnected = Boolean(live.connectedTeams[sseTeam]);
      live.connectedTeams[sseTeam] = true;
      if (!telemetry[sseTeam] || !telemetry[sseTeam].lastPingAt) {
        telemetry[sseTeam] = Object.assign(gmmState.createEmptyTeamTelemetry(), {
          lastPingAt: Date.now(),
          screenState: 'visible'
        });
      }
      if (!wasConnected) {
        broadcastSSE({
          type: 'gmm_team_joined',
          team: sseTeam,
          connectedTeams: live.connectedTeams,
          telemetry: telemetry[sseTeam],
          serverTime: Date.now()
        });
      }
    }

    req.on('close', () => {
      removeSseClient(res);
      if (isTrackedStudent) {
        if (gmmState.gmmTeamSockets[sseTeam].get(sseCid) === res) {
          gmmState.gmmTeamSockets[sseTeam].delete(sseCid);
        }
        if (gmmState.gmmTeamSockets[sseTeam].size === 0) {
          gmmState.scheduleTeamDisconnectIfNoActiveClient(sseTeam, 1600, 'sse_closed');
        }
      }
    });
    return true;
  }

  if (req.url === '/api/sync/action' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      broadcastSSE(payload);
      sendJson(res, 200, { success: true, clientCount: getClientCount() });
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
    }
    return true;
  }

  return false;
}

module.exports = { handleRemoteRoutes };
