'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

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
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8'
};

/**
 * Gửi phản hồi JSON thống nhất với mã trạng thái HTTP.
 */
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

/**
 * Đọc và phân tích thân request JSON, tự động từ chối nếu vượt giới hạn byte.
 */
function readJsonBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      body += chunk;
      if (body.length > maxBytes) {
        aborted = true;
        const limitErr = new Error('Kích thước dữ liệu vượt quá giới hạn cho phép');
        limitErr.statusCode = 413;
        try {
          req.destroy();
        } catch (_err) {}
        reject(limitErr);
      }
    });

    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (parseErr) {
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });

    req.on('error', (err) => {
      if (!aborted) reject(err);
    });
  });
}

/**
 * Lấy danh sách IP LAN IPv4 của máy tính và sắp xếp theo độ ưu tiên.
 */
function getAllLocalIps() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();
    const isVirtual = lowerName.includes('virtual') || lowerName.includes('vmware') ||
      lowerName.includes('vbox') || lowerName.includes('wsl') ||
      lowerName.includes('hyper-v') || lowerName.includes('docker') ||
      lowerName.includes('loopback') || lowerName.includes('tailscale') ||
      lowerName.includes('radmin') || lowerName.includes('zerotier');

    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        let priority = 3;
        if (!isVirtual) {
          if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan')) {
            priority = 0;
          } else if (lowerName.includes('ethernet') || lowerName.includes('eth')) {
            priority = 1;
          } else {
            priority = 2;
          }
        }
        candidates.push({ name, ip: iface.address, priority });
      }
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates;
}

function getLocalIp() {
  const candidates = getAllLocalIps();
  return candidates.length > 0 ? candidates[0].ip : 'localhost';
}

/**
 * Ghép các thẻ <!-- @include partials/... --> phía máy chủ khi trả về HTML.
 */
function renderHtmlWithPartials(htmlContent, rootDir) {
  return htmlContent.replace(/<!--\s*@include\s+([^\s]+)\s*-->/g, (fullMatch, relPath) => {
    const resolved = path.resolve(rootDir, relPath);
    const relative = path.relative(rootDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return '';
    }
    try {
      return fs.readFileSync(resolved, 'utf8');
    } catch (_err) {
      return fullMatch;
    }
  });
}

function sendHtmlFile(res, filePath, rootDir, statusCode = 200) {
  fs.readFile(filePath, 'utf8', (readErr, html) => {
    if (readErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found (Không tìm thấy trang)');
      return;
    }
    const stitched = renderHtmlWithPartials(html, rootDir);
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(stitched);
  });
}

/**
 * Kiểm tra đường dẫn có trỏ vào thư mục hoặc tệp nội bộ cần chặn truy cập HTTP hay không.
 */
function isBlockedInternalPath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return false;
  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) return true;
  const first = segments[0].toLowerCase();
  if (first === 'server' || first === 'node_modules') return true;
  if (normalized.toLowerCase() === 'matthu_scores.json') return true;
  return false;
}

/**
 * Phục vụ tệp tĩnh và trang chủ index.html có ghép HTML partial.
 */
function serveStaticFile(req, res, rootDir) {
  if (req.url.startsWith('/Giai_ma_mat_thu_20_11_THCS_Tan_Hai.html')) {
    const query = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
    res.writeHead(302, { Location: `/?game=mat_thu${query}` });
    res.end();
    return;
  }

  let decodedUrl = '/';
  try {
    decodedUrl = decodeURIComponent(req.url.split('?')[0]);
  } catch (_err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  let reqPath = decodedUrl;
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(rootDir, reqPath);
  const relative = path.relative(rootDir, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative) || isBlockedInternalPath(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden (Bị từ chối truy cập)');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (path.extname(reqPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found (Không tìm thấy tệp)');
        return;
      }
      sendHtmlFile(res, path.join(rootDir, 'index.html'), rootDir);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') {
      sendHtmlFile(res, filePath, rootDir);
      return;
    }

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
}

module.exports = {
  MIME_TYPES,
  sendJson,
  readJsonBody,
  getAllLocalIps,
  getLocalIp,
  renderHtmlWithPartials,
  serveStaticFile
};
