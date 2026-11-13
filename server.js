'use strict';

const http = require('http');
const path = require('path');

const { getLocalIp, serveStaticFile } = require('./server/utils/httpHelpers');
const { closeAllSseClients } = require('./server/state/sseHub');
const gmmState = require('./server/state/gmmState');
const { handleRemoteRoutes } = require('./server/routes/remoteRoutes');
const { createMatThuRouter } = require('./server/routes/matThuRoutes');
const { handleGmmRoutes } = require('./server/routes/gmmRoutes');

const parsedPortEnv = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3000;
const DEFAULT_PORT = Number.isFinite(parsedPortEnv) && parsedPortEnv >= 0 ? parsedPortEnv : 3000;
const MAX_PORT_ATTEMPTS = 50;
let currentPort = DEFAULT_PORT;

const ROOT_DIR = __dirname;
const MAT_THU_FILE = process.env.MAT_THU_FILE
  ? path.resolve(process.env.MAT_THU_FILE)
  : path.join(ROOT_DIR, 'matthu_scores.json');

const handleMatThuRoutes = createMatThuRouter(MAT_THU_FILE);
gmmState.startTeamWatchdog();

const server = http.createServer(async (req, res) => {
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

  if (await handleRemoteRoutes(req, res, () => currentPort)) return;
  if (await handleMatThuRoutes(req, res)) return;
  if (await handleGmmRoutes(req, res)) return;

  serveStaticFile(req, res, ROOT_DIR);
});

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
  console.log('================================================================');
  console.log(`🚀 Server localhost đang chạy tại: http://localhost:${currentPort}`);
  console.log(`📱 Link điều khiển từ xa (Wi-Fi):  http://${localIp}:${currentPort}/remote.html`);
  console.log(`📽️ Link màn hình máy chiếu:        http://${localIp}:${currentPort}/index.html?projector=1`);
  console.log(`📁 Thư mục gốc: ${ROOT_DIR}`);
  console.log('================================================================');
});

function handleShutdown(signal) {
  console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang đóng máy chủ và giải phóng cổng kết nối...`);
  gmmState.stopAllTimersAndWatchdogs();
  closeAllSseClients();
  server.close(() => {
    console.log('✅ Đã giải phóng cổng mạng thành công. Tạm biệt thầy/cô!');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
