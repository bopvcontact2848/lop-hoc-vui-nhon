const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const parsedPortEnv = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3000;
const DEFAULT_PORT = Number.isFinite(parsedPortEnv) && parsedPortEnv >= 0 ? parsedPortEnv : 3000;
const MAX_PORT_ATTEMPTS = 50; // Giới hạn thử tối đa 50 cổng liên tiếp nếu bị trùng
let currentPort = DEFAULT_PORT;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8'
};

// Danh sách các Client đang kết nối Server-Sent Events (SSE) để đồng bộ thời gian thực
let sseClients = [];

// Bộ nhớ lưu trữ kết quả thi đấu Trò Chơi Lớn - Giải Mã Mật Thư 20/11
const MAT_THU_FILE = process.env.MAT_THU_FILE
  ? path.resolve(process.env.MAT_THU_FILE)
  : path.join(ROOT_DIR, 'matthu_scores.json');
let matThuScores = [];
try {
  if (fs.existsSync(MAT_THU_FILE)) {
    matThuScores = JSON.parse(fs.readFileSync(MAT_THU_FILE, 'utf-8') || '[]');
  }
} catch (_e) {
  matThuScores = [];
}

// Bộ nhớ trạng thái Trò chơi Đối kháng Giải Mã Bí Mật 20/11 (Đồng bộ thời gian thực SSE)
let gmmLiveState = {
  sessionId: Date.now(),
  roomCode: '2011-THCS',
  status: 'lobby', // 'lobby', 'countdown', 'quiz_waiting', 'quiz', 'decrypt', 'result'
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
  teamA: { score: 0, bonusScore: 0, answers: {}, isLocked: false, finishTime: null, finishSeconds: null, unlockedRegions: [], coloredRegions: {}, hasArtworkPhoto: false, photoTimestamp: 0 },
  teamB: { score: 0, bonusScore: 0, answers: {}, isLocked: false, finishTime: null, finishSeconds: null, unlockedRegions: [], coloredRegions: {}, hasArtworkPhoto: false, photoTimestamp: 0 },
  updatedAt: Date.now()
};

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

// Kho lưu trữ độc lập ảnh chụp tranh giấy A1 của 2 đội (bảo toàn 100% không bị POST /api/gmm/state ghi đè)
let gmmArtworkStore = {
  teamA: { photoData: null, timestamp: 0 },
  teamB: { photoData: null, timestamp: 0 }
};

function createEmptyTeamTelemetry() {
  return {
    lastPingAt: 0,
    screenState: 'unknown', // 'visible' | 'hidden' | 'unknown'
    currentPage: 'lobby',   // 'lobby' | 'quiz' | 'locked' | 'decrypt'
    currentQ: 1,
    answeredCount: 0,
    isLocked: false,
    wakeLockActive: false,
    exitGuardActive: false
  };
}

// Kho lưu trữ độc lập nhịp tim kết nối trực tiếp (Live Ping Telemetry) của điện thoại 2 đội
let gmmTeamTelemetry = {
  teamA: createEmptyTeamTelemetry(),
  teamB: createEmptyTeamTelemetry()
};

// Theo dõi các kết nối SSE thực tế từ điện thoại học sinh của từng đội (Map<clientId, res>)
const gmmTeamSockets = {
  teamA: new Map(),
  teamB: new Map()
};

const gmmDisconnectTimers = {
  teamA: null,
  teamB: null
};

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

// Bộ quét tự động phát hiện điện thoại đã thoát trò chơi / rớt mạng Wi-Fi (Heartbeat Watchdog)
setInterval(() => {
  const now = Date.now();
  ['teamA', 'teamB'].forEach(team => {
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

let gmmTimerInterval = null;

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

// Quản lý đồng hồ đếm ngược Giai đoạn 2: Tô Màu & Giải Mã Bức Tranh (Tab 4)
let gmmDecryptTimerInterval = null;

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

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(msg);
    } catch (_) {}
  });
}

// Hàm lấy danh sách tất cả IP LAN IPv4 của máy tính và sắp xếp theo độ ưu tiên
function getAllLocalIps() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();

    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      const ip = addr.address;
      if (!ip || ip === '127.0.0.1' || ip.startsWith('169.254.')) continue;

      let score = 50;

      // 1. Ưu tiên card Wi-Fi / Ethernet vật lý thật
      if (/wi[-]?fi|wlan|wireless|lan|ethernet|eth|en\d/i.test(lowerName)) {
        score += 35;
      }

      // 2. Trừ điểm các card mạng ảo (VirtualBox, VMware, Hyper-V, WSL, Docker, Tailscale...)
      if (/virtual|vbox|vmware|hyper-v|vethernet|wsl|pseudo|bluetooth|tap|tun|docker|tailscale|zerotier/i.test(lowerName)) {
        score -= 60;
      }

      // 3. Trừ điểm card Wi-Fi Direct ảo của Windows (Local Area Connection* ...)
      if (/local area connection\s*\*/i.test(lowerName)) {
        score -= 50;
      }

      // 4. Ưu tiên dải IP LAN thông dụng của router (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (ip.startsWith('192.168.137.')) {
        score -= 40; // Card Hotspot mặc định của Windows (chỉ dùng khi không còn card nào khác)
      } else if (ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) {
        score += 25;
      }

      candidates.push({ name, ip, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

// Hàm lấy địa chỉ IP LAN cục bộ (IPv4) của máy tính trong mạng Wi-Fi trường học / gia đình
function getLocalIp() {
  const candidates = getAllLocalIps();
  return candidates.length > 0 ? candidates[0].ip : 'localhost';
}

const server = http.createServer((req, res) => {
  // CORS & No-Cache headers (hỗ trợ gọi API từ nhiều thiết bị trong mạng LAN)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API 1: LẤY THÔNG TIN IP VÀ ĐƯỜNG DẪN ĐIỀU KHIỂN TỪ XA ---
  if (req.url.startsWith('/api/ip') && req.method === 'GET') {
    const candidates = getAllLocalIps();
    const localIp = candidates.length > 0 ? candidates[0].ip : 'localhost';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      ip: localIp,
      allIps: candidates.map(c => ({ name: c.name, ip: c.ip })),
      port: currentPort,
      remoteUrl: `http://${localIp}:${currentPort}/remote.html`,
      projectorUrl: `http://${localIp}:${currentPort}/index.html?projector=1`,
      matThuUrl: `http://${localIp}:${currentPort}/?game=mat_thu`,
      clientCount: sseClients.length
    }));
    return;
  }

  // --- API 2: KÊNH STREAM ĐỒNG BỘ THỜI GIAN THỰC (SERVER-SENT EVENTS - SSE) ---
  if (req.url.startsWith('/api/sync/events') && req.method === 'GET') {
    let sseRole = '';
    let sseTeam = '';
    let sseCid = '';
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      sseRole = parsedUrl.searchParams.get('role') || '';
      sseTeam = parsedUrl.searchParams.get('team') || '';
      sseCid = parsedUrl.searchParams.get('cid') || ('sse_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    } catch (_uErr) {}

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const syncedDecryptLeft = getSyncedDecryptSeconds();
    gmmLiveState.decryptTimeLeft = syncedDecryptLeft;

    res.write(`data: ${JSON.stringify({
      type: 'connected',
      clients: sseClients.length + 1,
      serverTime: Date.now(),
      sessionId: gmmLiveState.sessionId,
      isDecryptPhase: Boolean(gmmLiveState.isDecryptPhase),
      isDecryptTimerRunning: Boolean(gmmLiveState.isDecryptTimerRunning),
      decryptTimeLeft: syncedDecryptLeft,
      remainingSeconds: syncedDecryptLeft,
      decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300,
      timerSeconds: gmmLiveState.timerSeconds,
      isTimerRunning: Boolean(gmmLiveState.isTimerRunning),
      state: gmmLiveState
    })}\n\n`);
    sseClients.push(res);

    const isTrackedStudent = (sseRole === 'student' && (sseTeam === 'teamA' || sseTeam === 'teamB'));
    if (isTrackedStudent) {
      cancelTeamDisconnectTimer(sseTeam);
      gmmTeamSockets[sseTeam].set(sseCid, res);
      if (!gmmLiveState.connectedTeams) {
        gmmLiveState.connectedTeams = { teamA: false, teamB: false };
      }
      const wasConnected = Boolean(gmmLiveState.connectedTeams[sseTeam]);
      gmmLiveState.connectedTeams[sseTeam] = true;
      if (!gmmTeamTelemetry[sseTeam] || !gmmTeamTelemetry[sseTeam].lastPingAt) {
        gmmTeamTelemetry[sseTeam] = Object.assign(createEmptyTeamTelemetry(), {
          lastPingAt: Date.now(),
          screenState: 'visible'
        });
      }
      if (!wasConnected) {
        broadcastSSE({
          type: 'gmm_team_joined',
          team: sseTeam,
          connectedTeams: gmmLiveState.connectedTeams,
          telemetry: gmmTeamTelemetry[sseTeam],
          serverTime: Date.now()
        });
      }
    }

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
      if (isTrackedStudent) {
        if (gmmTeamSockets[sseTeam].get(sseCid) === res) {
          gmmTeamSockets[sseTeam].delete(sseCid);
        }
        if (gmmTeamSockets[sseTeam].size === 0) {
          scheduleTeamDisconnectIfNoActiveClient(sseTeam, 1600, 'sse_closed');
        }
      }
    });
    return;
  }

  // --- API 3: TIẾP NHẬN LỆNH ĐIỀU KHIỂN TỪ XA (POST ACTION) ---
  if (req.url === '/api/sync/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        // Phát sóng tức thì tới toàn bộ máy chiếu / màn hình đang kết nối SSE
        sseClients.forEach(client => {
          client.write(`data: ${JSON.stringify(payload)}\n\n`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, clientCount: sseClients.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 4: TRÒ CHƠI LỚN - LẤY BẢNG ĐIỂM GIẢI MÃ MẬT THƯ ---
  if (req.url.startsWith('/api/matthu/scores') && req.method === 'GET') {
    const sorted = [...matThuScores].sort((a, b) => (b.score - a.score) || (a.elapsed - b.elapsed));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      total: sorted.length,
      scores: sorted
    }));
    return;
  }

  // --- API 5: TRÒ CHƠI LỚN - NỘP KẾT QUẢ GIẢI MÃ MẬT THƯ (TỪ ĐIỆN THOẠI CỦA CÁC ĐỘI) ---
  if (req.url === '/api/matthu/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body || '{}');
        if (!item.team || !item.className) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Thiếu tên đội hoặc lớp' }));
          return;
        }

        const record = {
          id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          team: item.team,
          className: item.className,
          grade: item.grade || (item.className.match(/\d+/) ? parseInt(item.className.match(/\d+/)[0], 10) : 6),
          leader: item.leader || 'Đại diện',
          campus: item.campus || 'Trường chính',
          score: typeof item.score === 'number' ? item.score : 0,
          elapsed: typeof item.elapsed === 'number' ? item.elapsed : 0,
          when: item.when || new Date().toLocaleString('vi-VN'),
          reason: item.reason || 'Hoàn thành'
        };

        // Cập nhật hoặc thêm mới kết quả (mỗi lớp lưu kết quả cao nhất)
        const existIdx = matThuScores.findIndex(s => s.className === record.className);
        if (existIdx >= 0) {
          if (record.score > matThuScores[existIdx].score || (record.score === matThuScores[existIdx].score && record.elapsed < matThuScores[existIdx].elapsed)) {
            matThuScores[existIdx] = record;
          }
        } else {
          matThuScores.push(record);
        }

        // Lưu ra file JSON
        try {
          fs.writeFileSync(MAT_THU_FILE, JSON.stringify(matThuScores, null, 2), 'utf-8');
        } catch (_saveErr) {}

        // Phát sóng SSE tức thì tới màn hình máy chiếu bảng xếp hạng
        sseClients.forEach(client => {
          client.write(`data: ${JSON.stringify({
            type: 'matthu_new_submission',
            record: record,
            totalSubmissions: matThuScores.length
          })}\n\n`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, record }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 6: TRÒ CHƠI LỚN - ĐẶT LẠI / XÓA BẢNG ĐIỂM (CHO BAN TỔ CHỨC) ---
  if (req.url === '/api/matthu/reset' && req.method === 'POST') {
    matThuScores = [];
    try {
      if (fs.existsSync(MAT_THU_FILE)) fs.unlinkSync(MAT_THU_FILE);
    } catch (_e) {}

    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ type: 'matthu_scores_reset' })}\n\n`);
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // --- API 7: GIẢI MÃ BÍ MẬT 20/11 - LẤY TRẠNG THÁI HIỆN TẠI (GET STATE) ---
  if (req.url === '/api/gmm/state' && req.method === 'GET') {
    const syncedDecryptLeft = getSyncedDecryptSeconds();
    gmmLiveState.decryptTimeLeft = syncedDecryptLeft;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      serverTime: Date.now(),
      remainingSeconds: syncedDecryptLeft,
      telemetry: gmmTeamTelemetry,
      state: gmmLiveState
    }));
    return;
  }

  // --- API 8: GIẢI MÃ BÍ MẬT 20/11 - CẬP NHẬT TRẠNG THÁI TỪ MÁY CHIẾU (POST STATE) ---
  if (req.url === '/api/gmm/state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const prevSessionId = gmmLiveState.sessionId;
        const prevConnectedTeams = Object.assign({ teamA: false, teamB: false }, gmmLiveState.connectedTeams || {});
        const prevTeamA = Object.assign(createEmptyGmmTeamState(), gmmLiveState.teamA || {});
        const prevTeamB = Object.assign(createEmptyGmmTeamState(), gmmLiveState.teamB || {});

        const isResetForNewMatch = Boolean(payload.resetForNewMatch);
        const isForceTeamOverwrite = Boolean(payload.forceTeamOverwrite || isResetForNewMatch);
        delete payload.resetForNewMatch;
        delete payload.forceTeamOverwrite;

        if (isResetForNewMatch) {
          gmmArtworkStore = {
            teamA: { photoData: null, timestamp: 0 },
            teamB: { photoData: null, timestamp: 0 }
          };
          ['teamA', 'teamB'].forEach(tKey => {
            if (prevConnectedTeams[tKey]) {
              gmmTeamTelemetry[tKey] = Object.assign(createEmptyTeamTelemetry(), {
                lastPingAt: gmmTeamTelemetry[tKey]?.lastPingAt || Date.now(),
                screenState: gmmTeamTelemetry[tKey]?.screenState || 'visible',
                wakeLockActive: Boolean(gmmTeamTelemetry[tKey]?.wakeLockActive),
                exitGuardActive: Boolean(gmmTeamTelemetry[tKey]?.exitGuardActive),
                currentPage: 'quiz',
                currentQ: 1,
                answeredCount: 0,
                isLocked: false
              });
            } else {
              gmmTeamTelemetry[tKey] = createEmptyTeamTelemetry();
            }
          });
          gmmLiveState.sessionId = Math.max(Number(payload.sessionId) || Date.now(), (Number(prevSessionId) || 0) + 1);
          payload.sessionId = gmmLiveState.sessionId;
          gmmLiveState.teamA = createEmptyGmmTeamState();
          gmmLiveState.teamB = createEmptyGmmTeamState();
        } else if (payload.sessionId) {
          gmmLiveState.sessionId = payload.sessionId;
        } else if (!gmmLiveState.sessionId) {
          gmmLiveState.sessionId = Date.now();
        }

        const isSessionChanged = String(gmmLiveState.sessionId) !== String(prevSessionId);
        const isSameActiveMatch = !isSessionChanged && !isForceTeamOverwrite && Boolean(gmmLiveState.isMatchStarted) && Boolean(payload.isMatchStarted);

        // Trạng thái connectedTeams 100% do Máy chủ quyết định dựa trên kết nối thực tế của điện thoại 2 đội
        // Không để payload từ máy Giáo viên ghi đè làm "hồi sinh" trạng thái kết nối cũ khi điện thoại đã thoát!
        delete payload.connectedTeams;
        gmmLiveState.connectedTeams = prevConnectedTeams;

        const incomingTeamA = payload.teamA;
        const incomingTeamB = payload.teamB;
        delete payload.teamA;
        delete payload.teamB;

        if (!isResetForNewMatch && gmmLiveState.isDecryptTimerRunning) {
          delete payload.decryptTimeLeft;
          delete payload.decryptTimeTotal;
          delete payload.isDecryptTimerRunning;
          delete payload.decryptEndsAt;
        }

        Object.assign(gmmLiveState, payload);

        if (incomingTeamA) {
          if (isSameActiveMatch) {
            gmmLiveState.teamA = Object.assign({}, prevTeamA, incomingTeamA, {
              answers: Object.assign({}, prevTeamA.answers || {}, incomingTeamA.answers || {}),
              isLocked: Boolean(prevTeamA.isLocked || incomingTeamA.isLocked),
              finishTime: prevTeamA.finishTime || incomingTeamA.finishTime || null,
              finishSeconds: (typeof prevTeamA.finishSeconds === 'number') ? prevTeamA.finishSeconds : (incomingTeamA.finishSeconds ?? null)
            });
          } else {
            gmmLiveState.teamA = Object.assign(createEmptyGmmTeamState(), incomingTeamA, {
              answers: Object.assign({}, incomingTeamA.answers || {}),
              isLocked: Boolean(incomingTeamA.isLocked),
              finishTime: incomingTeamA.isLocked ? (incomingTeamA.finishTime || null) : null,
              finishSeconds: incomingTeamA.isLocked && typeof incomingTeamA.finishSeconds === 'number' ? incomingTeamA.finishSeconds : null
            });
          }
        }

        if (incomingTeamB) {
          if (isSameActiveMatch) {
            gmmLiveState.teamB = Object.assign({}, prevTeamB, incomingTeamB, {
              answers: Object.assign({}, prevTeamB.answers || {}, incomingTeamB.answers || {}),
              isLocked: Boolean(prevTeamB.isLocked || incomingTeamB.isLocked),
              finishTime: prevTeamB.finishTime || incomingTeamB.finishTime || null,
              finishSeconds: (typeof prevTeamB.finishSeconds === 'number') ? prevTeamB.finishSeconds : (incomingTeamB.finishSeconds ?? null)
            });
          } else {
            gmmLiveState.teamB = Object.assign(createEmptyGmmTeamState(), incomingTeamB, {
              answers: Object.assign({}, incomingTeamB.answers || {}),
              isLocked: Boolean(incomingTeamB.isLocked),
              finishTime: incomingTeamB.isLocked ? (incomingTeamB.finishTime || null) : null,
              finishSeconds: incomingTeamB.isLocked && typeof incomingTeamB.finishSeconds === 'number' ? incomingTeamB.finishSeconds : null
            });
          }
        }

        // Bảo toàn tuyệt đối thông tin ảnh tranh giấy & trạng thái báo cáo hoàn thành tranh của 2 đội
        if (gmmLiveState.teamA) {
          gmmLiveState.teamA.hasArtworkPhoto = Boolean(gmmArtworkStore.teamA.photoData);
          gmmLiveState.teamA.photoTimestamp = gmmArtworkStore.teamA.timestamp || 0;
          if (prevTeamA.isArtworkFinished) {
            gmmLiveState.teamA.isArtworkFinished = true;
            gmmLiveState.teamA.artworkFinishTime = prevTeamA.artworkFinishTime;
            gmmLiveState.teamA.artworkFinishSeconds = prevTeamA.artworkFinishSeconds;
            gmmLiveState.teamA.speedBonus = prevTeamA.speedBonus || 0;
            gmmLiveState.teamA.completed = true;
          }
        }
        if (gmmLiveState.teamB) {
          gmmLiveState.teamB.hasArtworkPhoto = Boolean(gmmArtworkStore.teamB.photoData);
          gmmLiveState.teamB.photoTimestamp = gmmArtworkStore.teamB.timestamp || 0;
          if (prevTeamB.isArtworkFinished) {
            gmmLiveState.teamB.isArtworkFinished = true;
            gmmLiveState.teamB.artworkFinishTime = prevTeamB.artworkFinishTime;
            gmmLiveState.teamB.artworkFinishSeconds = prevTeamB.artworkFinishSeconds;
            gmmLiveState.teamB.speedBonus = prevTeamB.speedBonus || 0;
            gmmLiveState.teamB.completed = true;
          }
        }
        gmmLiveState.updatedAt = Date.now();

        if (isResetForNewMatch || isSessionChanged) {
          broadcastSSE({
            type: 'gmm_reset',
            sessionId: gmmLiveState.sessionId,
            silentToast: true,
            state: gmmLiveState
          });
        }

        broadcastSSE({
          type: 'gmm_state_update',
          sessionId: gmmLiveState.sessionId,
          state: gmmLiveState
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, sessionId: gmmLiveState.sessionId, state: gmmLiveState }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 9: GIẢI MÃ BÍ MẬT 20/11 - HỌC SINH NỘP ĐÁP ÁN TỪ ĐIỆN THOẠI (POST SUBMIT) ---
  if (req.url === '/api/gmm/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team, questionId, optionIndex, sessionId, currentQ } = JSON.parse(body || '{}');
        if (!team || (team !== 'teamA' && team !== 'teamB')) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Thiếu hoặc sai tên đội (teamA / teamB)' }));
          return;
        }

        // Chặn đáp án cũ từ phiên chơi trước (Offline Sync Queue cũ) làm nhiễu ván chơi mới
        const isWaitingPhase = (
          gmmLiveState.status === 'lobby' ||
          gmmLiveState.status === 'home' ||
          gmmLiveState.status === 'quiz_waiting' ||
          (gmmLiveState.status === 'quiz' && !gmmLiveState.isMatchStarted)
        );
        if (isWaitingPhase || (sessionId && gmmLiveState.sessionId && String(sessionId) !== String(gmmLiveState.sessionId))) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            staleSession: true,
            currentSessionId: gmmLiveState.sessionId,
            state: gmmLiveState,
            error: 'Phiên thi đấu đã được đặt lại sang ván mới'
          }));
          return;
        }

        if (gmmLiveState[team] && gmmLiveState[team].isLocked) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            teamLocked: true,
            currentSessionId: gmmLiveState.sessionId,
            state: gmmLiveState,
            error: 'Đội đã chốt nộp bài'
          }));
          return;
        }

        if (gmmLiveState[team]) {
          gmmLiveState[team].answers[questionId] = optionIndex;
          gmmLiveState.updatedAt = Date.now();
        }

        cancelTeamDisconnectTimer(team);
        if (!gmmTeamTelemetry[team]) {
          gmmTeamTelemetry[team] = createEmptyTeamTelemetry();
        }
        gmmTeamTelemetry[team].lastPingAt = Date.now();
        gmmTeamTelemetry[team].screenState = 'visible';
        gmmTeamTelemetry[team].currentPage = 'quiz';
        if (currentQ !== undefined && currentQ !== null) {
          gmmTeamTelemetry[team].currentQ = Math.max(1, Math.min(20, Number(currentQ) || 1));
        }
        gmmTeamTelemetry[team].answeredCount = Object.keys(gmmLiveState[team]?.answers || {}).length;

        // Phát sóng tức thì tới màn hình máy chiếu và các thiết bị khác
        broadcastSSE({
          type: 'gmm_team_answered',
          sessionId: gmmLiveState.sessionId,
          team,
          questionId,
          optionIndex,
          currentQ: gmmTeamTelemetry[team].currentQ
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, sessionId: gmmLiveState.sessionId, team, questionId, optionIndex }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 10: GIẢI MÃ BÍ MẬT 20/11 - HỌC SINH TÔ MẢNG TRANH TỪ ĐIỆN THOẠI (POST PAINT) ---
  if (req.url === '/api/gmm/paint' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team, regionId, color } = JSON.parse(body || '{}');
        if (gmmLiveState[team]) {
          gmmLiveState[team].coloredRegions[regionId] = color;
        }

        broadcastSSE({
          type: 'gmm_region_colored',
          team,
          regionId,
          color
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, team, regionId, color }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 11: GIẢI MÃ BÍ MẬT 20/11 - HỌC SINH VÀO PHÒNG TỪ ĐIỆN THOẠI (POST JOIN) ---
  if (req.url === '/api/gmm/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team } = JSON.parse(body || '{}');
        if (team === 'teamA' || team === 'teamB') {
          cancelTeamDisconnectTimer(team);
          if (!gmmLiveState.connectedTeams) {
            gmmLiveState.connectedTeams = { teamA: false, teamB: false };
          }
          gmmLiveState.connectedTeams[team] = true;
          gmmTeamTelemetry[team] = Object.assign(createEmptyTeamTelemetry(), gmmTeamTelemetry[team] || {}, {
            lastPingAt: Date.now(),
            screenState: 'visible'
          });
          gmmLiveState.updatedAt = Date.now();

          broadcastSSE({
            type: 'gmm_team_joined',
            team,
            connectedTeams: gmmLiveState.connectedTeams,
            telemetry: gmmTeamTelemetry[team],
            serverTime: Date.now()
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, team, connectedTeams: gmmLiveState.connectedTeams }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Sai thông tin đội tham gia' }));
    });
    return;
  }

  // --- API 11-LEAVE: GIẢI MÃ BÍ MẬT 20/11 - ĐIỆN THOẠI THOÁT TRÒ CHƠI HOẶC GIÁO VIÊN NGẮT KẾT NỐI ---
  if (req.url === '/api/gmm/leave' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team, cid, reason } = JSON.parse(body || '{}');
        if (team === 'teamA' || team === 'teamB') {
          if (cid && gmmTeamSockets[team]) {
            gmmTeamSockets[team].delete(cid);
          }
          const isImmediate = (reason === 'explicit_exit' || reason === 'teacher_kick');
          if (isImmediate) {
            markTeamDisconnected(team, reason);
          } else if (!gmmTeamSockets[team] || gmmTeamSockets[team].size === 0) {
            scheduleTeamDisconnectIfNoActiveClient(team, 1300, reason || 'page_unload');
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            team,
            connectedTeams: gmmLiveState.connectedTeams
          }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Sai thông tin đội ngắt kết nối' }));
    });
    return;
  }

  // --- API 11A: GIẢI MÃ BÍ MẬT 20/11 - NHỊP TIM KẾT NỐI TRỰC TIẾP TỪ ĐIỆN THOẠI (POST LIVE PING) ---
  if (req.url === '/api/gmm/ping' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const team = parsed.team;
        if (team === 'teamA' || team === 'teamB') {
          cancelTeamDisconnectTimer(team);
          const now = Date.now();
          if (!gmmLiveState.connectedTeams) {
            gmmLiveState.connectedTeams = { teamA: false, teamB: false };
          }
          gmmLiveState.connectedTeams[team] = true;

          const validScreen = (parsed.screenState === 'visible' || parsed.screenState === 'hidden')
            ? parsed.screenState
            : 'visible';
          const validPage = ['lobby', 'quiz', 'locked', 'decrypt'].includes(parsed.currentPage)
            ? parsed.currentPage
            : 'lobby';

          gmmTeamTelemetry[team] = {
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
            telemetry: gmmTeamTelemetry[team],
            connectedTeams: gmmLiveState.connectedTeams,
            serverTime: now
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            serverTime: now,
            sessionId: gmmLiveState.sessionId
          }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Dữ liệu nhịp tim không hợp lệ' }));
    });
    return;
  }

  // --- API 11B: GIẢI MÃ BÍ MẬT 20/11 - ĐIỀU KHIỂN ĐỒNG HỒ TỔNG THỜI GIAN (POST TIMER) ---
  if (req.url === '/api/gmm/timer' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { action, seconds, totalMatchSeconds } = JSON.parse(body || '{}');
        if (typeof totalMatchSeconds === 'number') {
          gmmLiveState.totalMatchSeconds = totalMatchSeconds;
        }

        if (action === 'start') {
          startGmmTimer(seconds || gmmLiveState.timerSeconds || 300);
        } else if (action === 'pause') {
          pauseGmmTimer();
        } else if (action === 'add') {
          addGmmTime(seconds || 60);
        } else if (action === 'set') {
          gmmLiveState.timerSeconds = seconds || 300;
          broadcastSSE({
            type: 'gmm_timer_tick',
            timerSeconds: gmmLiveState.timerSeconds,
            totalMatchSeconds: gmmLiveState.totalMatchSeconds || 300
          });
        } else if (action === 'stop') {
          clearInterval(gmmTimerInterval);
          gmmLiveState.isTimerRunning = false;
          broadcastSSE({
            type: 'gmm_timer_pause',
            isTimerRunning: false,
            timerSeconds: gmmLiveState.timerSeconds
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          timerSeconds: gmmLiveState.timerSeconds,
          isTimerRunning: gmmLiveState.isTimerRunning,
          totalMatchSeconds: gmmLiveState.totalMatchSeconds
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 11B: GIẢI MÃ BÍ MẬT 20/11 - ĐIỀU KHIỂN ĐỒNG HỒ ĐẾM NGƯỢC TÔ TRANH GIẢI MÃ (POST DECRYPT TIMER) ---
  if (req.url === '/api/gmm/decrypt-timer' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { action, seconds, totalSeconds } = JSON.parse(body || '{}');

        if (action === 'start' || action === 'resume') {
          startGmmDecryptTimer(seconds, totalSeconds);
        } else if (action === 'pause') {
          pauseGmmDecryptTimer();
        } else if (action === 'set') {
          setGmmDecryptDuration(seconds || 300);
        } else if (action === 'add') {
          addGmmDecryptTime(seconds || 30);
        } else if (action === 'stop') {
          stopGmmDecryptTimer();
        }

        const syncedDecryptLeft = getSyncedDecryptSeconds();
        gmmLiveState.decryptTimeLeft = syncedDecryptLeft;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          serverTime: Date.now(),
          decryptTimeLeft: syncedDecryptLeft,
          remainingSeconds: syncedDecryptLeft,
          decryptTimeTotal: gmmLiveState.decryptTimeTotal || 300,
          isDecryptTimerRunning: gmmLiveState.isDecryptTimerRunning
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 11C: GIẢI MÃ BÍ MẬT 20/11 - ĐỘI CHỐT KẾT QUẢ / KHÓA BÀI (POST LOCK TEAM) ---
  if (req.url === '/api/gmm/lock-team' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team, answers, finishTime, finishSeconds, sessionId } = JSON.parse(body || '{}');
        if (team === 'teamA' || team === 'teamB') {
          const isWaitingPhase = (
            gmmLiveState.status === 'lobby' ||
            gmmLiveState.status === 'home' ||
            gmmLiveState.status === 'quiz_waiting' ||
            (gmmLiveState.status === 'quiz' && !gmmLiveState.isMatchStarted)
          );
          if (isWaitingPhase || (sessionId && gmmLiveState.sessionId && String(sessionId) !== String(gmmLiveState.sessionId))) {
            res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              staleSession: true,
              currentSessionId: gmmLiveState.sessionId,
              state: gmmLiveState,
              error: 'Phiên thi đấu đã chuyển sang ván mới'
            }));
            return;
          }

          if (!gmmLiveState[team]) gmmLiveState[team] = createEmptyGmmTeamState();
          gmmLiveState[team].isLocked = true;
          if (answers) {
            gmmLiveState[team].answers = Object.assign(gmmLiveState[team].answers || {}, answers);
          }
          if (finishTime) {
            gmmLiveState[team].finishTime = finishTime;
          }
          if (typeof finishSeconds === 'number') {
            gmmLiveState[team].finishSeconds = finishSeconds;
          }
          gmmLiveState.updatedAt = Date.now();

          broadcastSSE({
            type: 'gmm_team_locked',
            sessionId: gmmLiveState.sessionId,
            team,
            answers: gmmLiveState[team].answers,
            finishTime: gmmLiveState[team].finishTime,
            finishSeconds: gmmLiveState[team].finishSeconds,
            state: gmmLiveState
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, sessionId: gmmLiveState.sessionId, team, state: gmmLiveState }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Thiếu hoặc sai tên đội' }));
    });
    return;
  }

  // --- API 11C-2: GIẢI MÃ BÍ MẬT 20/11 - GIÁO VIÊN MỞ KHÓA RIÊNG CHO 1 ĐỘI LÀM TIẾP (POST UNLOCK TEAM) ---
  if (req.url === '/api/gmm/unlock-team' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team } = JSON.parse(body || '{}');
        if (team === 'teamA' || team === 'teamB') {
          if (!gmmLiveState[team]) {
            gmmLiveState[team] = createEmptyGmmTeamState();
          }
          // Mở khóa riêng cho đội được chọn, bảo toàn 100% các đáp án đội đã làm trước đó
          gmmLiveState[team].isLocked = false;
          gmmLiveState[team].finishTime = null;
          gmmLiveState[team].finishSeconds = null;
          gmmLiveState[team].score = 0;
          gmmLiveState[team].unlockedRegions = [];
          gmmLiveState.updatedAt = Date.now();

          if (gmmTeamTelemetry[team]) {
            gmmTeamTelemetry[team].isLocked = false;
            gmmTeamTelemetry[team].currentPage = 'quiz';
          }

          broadcastSSE({
            type: 'gmm_team_unlocked',
            sessionId: gmmLiveState.sessionId,
            team,
            answers: gmmLiveState[team].answers || {},
            timerSeconds: gmmLiveState.timerSeconds,
            totalMatchSeconds: gmmLiveState.totalMatchSeconds,
            isTimerRunning: gmmLiveState.isTimerRunning,
            state: gmmLiveState
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            sessionId: gmmLiveState.sessionId,
            team,
            answers: gmmLiveState[team].answers || {},
            state: gmmLiveState
          }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Thiếu hoặc sai tên đội cần mở khóa (teamA / teamB)' }));
    });
    return;
  }

  // --- API 11C-3: GIẢI MÃ BÍ MẬT 20/11 - HỌC SINH BÁO CÁO ĐÃ TÔ XONG SỚM TRANH GIẤY A1 (POST FINISH ARTWORK) ---
  if (req.url === '/api/gmm/finish-artwork' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { team, finishTime, finishSeconds, remainingSeconds, speedBonus } = JSON.parse(body || '{}');
        if (team === 'teamA' || team === 'teamB') {
          if (!gmmLiveState[team]) gmmLiveState[team] = createEmptyGmmTeamState();

          const earnedBonus = typeof speedBonus === 'number' ? speedBonus : 2;
          gmmLiveState[team].completed = true;
          gmmLiveState[team].isArtworkFinished = true;
          gmmLiveState[team].artworkFinishTime = finishTime || new Date().toLocaleTimeString('vi-VN');
          gmmLiveState[team].artworkFinishSeconds = finishSeconds || 0;
          gmmLiveState[team].artworkRemainingSeconds = remainingSeconds || 0;
          gmmLiveState[team].speedBonus = earnedBonus;
          gmmLiveState[team].bonusScore = (gmmLiveState[team].bonusScore || 0) + earnedBonus;
          gmmLiveState.updatedAt = Date.now();

          broadcastSSE({
            type: 'gmm_artwork_finished',
            sessionId: gmmLiveState.sessionId,
            team,
            finishTime: gmmLiveState[team].artworkFinishTime,
            finishSeconds: gmmLiveState[team].artworkFinishSeconds,
            remainingSeconds: gmmLiveState[team].artworkRemainingSeconds,
            speedBonus: earnedBonus,
            bonusScore: gmmLiveState[team].bonusScore,
            state: gmmLiveState
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            sessionId: gmmLiveState.sessionId,
            team,
            finishTime: gmmLiveState[team].artworkFinishTime,
            speedBonus: earnedBonus,
            bonusScore: gmmLiveState[team].bonusScore,
            state: gmmLiveState
          }));
          return;
        }
      } catch (_err) {}
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Sai thông tin đội báo cáo' }));
    });
    return;
  }

  // --- API 11D: GIẢI MÃ BÍ MẬT 20/11 - HỌC SINH TẢI ẢNH CHỤP TRANH GIẤY A1 LÊN MÁY CHIẾU ---
  if (req.url.startsWith('/api/gmm/upload-artwork') && req.method === 'POST') {
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        aborted = true;
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Kích thước ảnh vượt quá 20MB' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const parsed = JSON.parse(body || '{}');
        let team = parsed.team;
        if (team === 'A') team = 'teamA';
        if (team === 'B') team = 'teamB';
        const photoData = parsed.photoData;

        if ((team === 'teamA' || team === 'teamB') && photoData && typeof photoData === 'string') {
          const ts = Date.now();
          gmmArtworkStore[team] = {
            photoData,
            timestamp: ts
          };

          if (!gmmLiveState[team]) gmmLiveState[team] = {};
          gmmLiveState[team].hasArtworkPhoto = true;
          gmmLiveState[team].photoTimestamp = ts;
          gmmLiveState.updatedAt = ts;

          console.log(`📸 [Giải Mã Bí Mật] Đã nhận ảnh tranh từ ${team} (${Math.round(photoData.length / 1024)} KB)`);

          // Phát sóng SSE ngay lập tức lên màn hình Host / Máy Chiếu
          broadcastSSE({
            type: 'gmm_artwork_photo',
            team,
            photoData,
            timestamp: ts
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, team, timestamp: ts }));
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Thiếu dữ liệu ảnh hoặc sai tên đội' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API 11E: GIẢI MÃ BÍ MẬT 20/11 - ĐỒNG BỘ ẢNH TRANH CHO MÁY CHIẾU (GET ARTWORKS) ---
  if (req.url.startsWith('/api/gmm/artworks') && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const sinceA = Number(urlObj.searchParams.get('tsA') || 0);
      const sinceB = Number(urlObj.searchParams.get('tsB') || 0);

      const responsePayload = {
        success: true,
        hasUpdate: false
      };

      if (gmmArtworkStore.teamA.photoData && gmmArtworkStore.teamA.timestamp > sinceA) {
        responsePayload.hasUpdate = true;
        responsePayload.teamA = {
          photoData: gmmArtworkStore.teamA.photoData,
          timestamp: gmmArtworkStore.teamA.timestamp
        };
      }
      if (gmmArtworkStore.teamB.photoData && gmmArtworkStore.teamB.timestamp > sinceB) {
        responsePayload.hasUpdate = true;
        responsePayload.teamB = {
          photoData: gmmArtworkStore.teamB.photoData,
          timestamp: gmmArtworkStore.teamB.timestamp
        };
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(responsePayload));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- API 12: GIẢI MÃ BÍ MẬT 20/11 - ĐẶT LẠI TRẠNG THÁI VÁN CHƠI (POST RESET) ---
  if (req.url === '/api/gmm/reset' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try {
        if (body) parsed = JSON.parse(body);
      } catch (_e) {}

      clearInterval(gmmTimerInterval);
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
        ['teamA', 'teamB'].forEach(tKey => {
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

      clearInterval(gmmTimerInterval);
      clearInterval(gmmDecryptTimerInterval);
      gmmDecryptTimerInterval = null;

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

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, sessionId: newSessionId, state: gmmLiveState }));
    });
    return;
  }

  // Chuyển hướng tương thích ngược cho URL bài thi Giải Mã Mật Thư cũ
  if (req.url.startsWith('/Giai_ma_mat_thu_20_11_THCS_Tan_Hai.html')) {
    const query = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
    res.writeHead(302, { 'Location': `/?game=mat_thu${query}` });
    res.end();
    return;
  }

  // --- PHỤC VỤ FILE TĨNH (STATIC FILE SERVER) ---
  let safePath = '/index.html';
  try {
    const rawPath = req.url.split('?')[0];
    safePath = decodeURI(rawPath);
  } catch (_uriErr) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request (Đường dẫn không hợp lệ)');
    return;
  }

  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.resolve(ROOT_DIR, '.' + path.normalize(safePath));
  const relative = path.relative(ROOT_DIR, filePath);

  // Chặn Directory Traversal (tấn công duyệt thư mục trái phép ra ngoài ROOT_DIR)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden (Bị từ chối truy cập)');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback về index.html nếu không tìm thấy file hoặc truy cập thư mục
      const fallbackIndex = path.join(ROOT_DIR, 'index.html');
      fs.readFile(fallbackIndex, (fbErr, fbContent) => {
        if (fbErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found (Không tìm thấy trang)');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fbContent);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error (Lỗi máy chủ cục bộ)');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Xử lý bắt lỗi khi cổng mạng bị chiếm dụng (Port Collision / EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const busyPort = currentPort;
    if (currentPort - DEFAULT_PORT >= MAX_PORT_ATTEMPTS) {
      console.error(`❌ Đã thử ${MAX_PORT_ATTEMPTS} cổng từ ${DEFAULT_PORT} đến ${currentPort} nhưng tất cả đều bị ứng dụng khác chiếm dụng!`);
      process.exit(1);
    }
    currentPort++;
    console.warn(`⚠️ Cổng (Port) ${busyPort} đang bị ứng dụng khác chiếm dụng (EADDRINUSE). Tự động chuyển sang cổng: ${currentPort}...`);
    setTimeout(() => {
      server.listen(currentPort);
    }, 150);
  } else {
    console.error('❌ Lỗi máy chủ cục bộ:', err);
    process.exit(1);
  }
});

server.listen(currentPort, () => {
  const addr = server.address();
  if (addr && typeof addr === 'object' && typeof addr.port === 'number') {
    currentPort = addr.port;
  }
  const localIp = getLocalIp();
  console.log(`================================================================`);
  console.log(`🚀 Server localhost đang chạy tại: http://localhost:${currentPort}`);
  console.log(`📱 Link điều khiển từ xa (Wi-Fi):  http://${localIp}:${currentPort}/remote.html`);
  console.log(`📽️ Link màn hình máy chiếu:        http://${localIp}:${currentPort}/index.html?projector=1`);
  console.log(`📁 Thư mục gốc: ${ROOT_DIR}`);
  console.log(`================================================================`);
});

// Cơ chế đóng server an toàn (Graceful Shutdown) khi tắt tiến trình (Ctrl+C hoặc SIGTERM)
function handleShutdown(signal) {
  console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang đóng máy chủ và giải phóng cổng kết nối...`);
  clearInterval(gmmTimerInterval);
  clearInterval(gmmDecryptTimerInterval);
  sseClients.forEach(client => {
    try {
      client.end();
    } catch (_) {}
  });
  server.close(() => {
    console.log('✅ Đã giải phóng cổng mạng thành công. Tạm biệt thầy/cô!');
    process.exit(0);
  });
  // Ép buộc dừng sau 2 giây nếu có kết nối bị treo
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
