'use strict';

const fs = require('fs');
const { sendJson, readJsonBody } = require('../utils/httpHelpers');
const { broadcastSSE } = require('../state/sseHub');

/**
 * Khởi tạo router quản lý bảng điểm Trò chơi lớn Giải Mã Mật Thư 20/11 (/api/matthu/*).
 */
function createMatThuRouter(matThuFile) {
  let matThuScores = [];
  try {
    if (fs.existsSync(matThuFile)) {
      matThuScores = JSON.parse(fs.readFileSync(matThuFile, 'utf-8') || '[]');
    }
  } catch (_err) {
    matThuScores = [];
  }

  return async function handleMatThuRoutes(req, res) {
    if (req.url.startsWith('/api/matthu/scores') && req.method === 'GET') {
      const sorted = [...matThuScores].sort((a, b) => (b.score - a.score) || (a.elapsed - b.elapsed));
      sendJson(res, 200, {
        success: true,
        total: sorted.length,
        scores: sorted
      });
      return true;
    }

    if (req.url === '/api/matthu/submit' && req.method === 'POST') {
      try {
        const item = await readJsonBody(req);
        if (!item.team || !item.className) {
          sendJson(res, 400, { success: false, error: 'Thiếu tên đội hoặc lớp' });
          return true;
        }

        const gradeMatch = String(item.className).match(/\d+/);
        const record = {
          id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          team: item.team,
          className: item.className,
          grade: item.grade || (gradeMatch ? parseInt(gradeMatch[0], 10) : 6),
          leader: item.leader || 'Đại diện',
          campus: item.campus || 'Trường chính',
          score: typeof item.score === 'number' ? item.score : 0,
          elapsed: typeof item.elapsed === 'number' ? item.elapsed : 0,
          when: item.when || new Date().toLocaleString('vi-VN'),
          reason: item.reason || 'Hoàn thành'
        };

        // Mỗi lớp lưu thành tích tốt nhất
        const existIdx = matThuScores.findIndex((s) => s.className === record.className);
        if (existIdx >= 0) {
          const prev = matThuScores[existIdx];
          if (record.score > prev.score || (record.score === prev.score && record.elapsed < prev.elapsed)) {
            matThuScores[existIdx] = record;
          }
        } else {
          matThuScores.push(record);
        }

        try {
          fs.writeFileSync(matThuFile, JSON.stringify(matThuScores, null, 2), 'utf-8');
        } catch (_saveErr) {}

        broadcastSSE({
          type: 'matthu_new_submission',
          record,
          totalSubmissions: matThuScores.length
        });

        sendJson(res, 200, { success: true, record });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    if (req.url === '/api/matthu/reset' && req.method === 'POST') {
      matThuScores = [];
      try {
        if (fs.existsSync(matThuFile)) fs.unlinkSync(matThuFile);
      } catch (_err) {}

      broadcastSSE({ type: 'matthu_scores_reset' });
      sendJson(res, 200, { success: true });
      return true;
    }

    return false;
  };
}

module.exports = { createMatThuRouter };
