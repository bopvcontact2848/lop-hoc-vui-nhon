const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
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

// Hàm lấy địa chỉ IP LAN cục bộ (IPv4) của máy tính trong mạng Wi-Fi trường học / gia đình
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
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
  if (req.url === '/api/ip' && req.method === 'GET') {
    const localIp = getLocalIp();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      ip: localIp,
      port: currentPort,
      remoteUrl: `http://${localIp}:${currentPort}/remote.html`,
      projectorUrl: `http://${localIp}:${currentPort}/index.html?projector=1`,
      clientCount: sseClients.length
    }));
    return;
  }

  // --- API 2: KÊNH STREAM ĐỒNG BỘ THỜI GIAN THỰC (SERVER-SENT EVENTS - SSE) ---
  if (req.url === '/api/sync/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', clients: sseClients.length + 1 })}\n\n`);
    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
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

  // --- PHỤC VỤ FILE TĨNH (STATIC FILE SERVER) ---
  let safePath = '/index.html';
  try {
    const rawPath = req.url.split('?')[0];
    safePath = decodeURI(rawPath);
  } catch (uriErr) {
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
