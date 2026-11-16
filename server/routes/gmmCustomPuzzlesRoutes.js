'use strict';

const { sendJson, readJsonBody } = require('../utils/httpHelpers');
const { createJsonSyncStore } = require('../utils/jsonSyncStore');
const { broadcastSSE } = require('../state/sseHub');

const MAX_JSON_BYTES = 10 * 1024 * 1024;
const MAX_PUZZLES_COUNT = 150;

function sanitizePresetItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 120);
  const title = String(raw.title || '').trim().slice(0, 200);
  if (!id || !title || id === 'preset_trian_2011') return null;
  const qCountNum = parseInt(raw.questionCount, 10);
  const strokeNum = parseFloat(raw.strokeWidth);
  const updatedNum = Number(raw.updatedAt);

  const sanitized = {
    id,
    title,
    questionCount: Number.isFinite(qCountNum) ? Math.max(4, Math.min(20, qCountNum)) : 10,
    meshStyle: ['polygon', 'pixel', 'hexagon'].includes(raw.meshStyle) ? raw.meshStyle : 'polygon',
    decorMotif: String(raw.decorMotif || 'auto').slice(0, 60),
    difficulty: ['easy', 'normal', 'hard'].includes(raw.difficulty) ? raw.difficulty : 'normal',
    strokeWidth: Number.isFinite(strokeNum) ? Math.max(0.5, Math.min(6, strokeNum)) : 1.8,
    showFooterLegend: raw.showFooterLegend !== false,
    printHeader: String(raw.printHeader || '').slice(0, 300),
    printRightNote: String(raw.printRightNote || '').slice(0, 200),
    description: String(raw.description || '').slice(0, 300),
    updatedAt: Number.isFinite(updatedNum) && updatedNum > 0 ? updatedNum : Date.now()
  };

  if (raw.matrixData && typeof raw.matrixData === 'object' && !Array.isArray(raw.matrixData)) {
    sanitized.matrixData = raw.matrixData;
  }
  return sanitized;
}

/**
 * Khởi tạo router đồng bộ Bộ Sưu Tập Tranh Tự Tạo qua tệp JSON trên Server Node (/api/gmm/custom-puzzles*).
 */
function createGmmCustomPuzzlesRouter(puzzlesFilePath) {
  const manager = createJsonSyncStore({
    filePath: puzzlesFilePath,
    itemsField: 'puzzles',
    maxItems: MAX_PUZZLES_COUNT,
    sanitizeItem: sanitizePresetItem
  });
  const { store } = manager;

  return async function handleGmmCustomPuzzlesRoutes(req, res) {
    if (!req.url.startsWith('/api/gmm/custom-puzzles')) {
      return false;
    }

    if (req.url === '/api/gmm/custom-puzzles' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        serverSyncAvailable: true,
        fileName: manager.fileName,
        updatedAt: store.updatedAt,
        totalPuzzles: store.puzzles.length,
        puzzles: store.puzzles,
        deletedIds: store.deletedIds
      });
      return true;
    }

    if (req.url === '/api/gmm/custom-puzzles/sync' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req, MAX_JSON_BYTES);
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          sendJson(res, 400, { success: false, error: 'Dữ liệu đồng bộ tranh không hợp lệ.' });
          return true;
        }
        if (body.puzzles !== undefined && !Array.isArray(body.puzzles)) {
          sendJson(res, 400, { success: false, error: 'Trường puzzles phải là mảng.' });
          return true;
        }

        manager.applySync(body.puzzles || [], body.mode === 'replace' ? 'replace' : 'merge');
        manager.saveToDisk();

        broadcastSSE({
          type: 'gmm_custom_puzzles_updated',
          clientOriginId: String(body.clientOriginId || ''),
          updatedAt: store.updatedAt,
          totalPuzzles: store.puzzles.length
        });

        sendJson(res, 200, {
          success: true,
          fileName: manager.fileName,
          updatedAt: store.updatedAt,
          totalPuzzles: store.puzzles.length,
          puzzles: store.puzzles,
          deletedIds: store.deletedIds
        });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    if (req.url === '/api/gmm/custom-puzzles/delete' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const targetId = String((body && body.id) || '').trim();
        if (!targetId) {
          sendJson(res, 400, { success: false, error: 'Thiếu mã tranh (id) cần xóa.' });
          return true;
        }

        manager.deleteById(targetId);
        manager.saveToDisk();

        broadcastSSE({
          type: 'gmm_custom_puzzles_updated',
          clientOriginId: String((body && body.clientOriginId) || ''),
          updatedAt: store.updatedAt,
          totalPuzzles: store.puzzles.length
        });

        sendJson(res, 200, {
          success: true,
          updatedAt: store.updatedAt,
          totalPuzzles: store.puzzles.length,
          puzzles: store.puzzles,
          deletedIds: store.deletedIds
        });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    sendJson(res, 404, { success: false, error: 'Không tìm thấy API Bộ Sưu Tập Tranh.' });
    return true;
  };
}

module.exports = { createGmmCustomPuzzlesRouter };
