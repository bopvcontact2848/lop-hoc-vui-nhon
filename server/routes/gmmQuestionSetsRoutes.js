'use strict';

const { sendJson, readJsonBody } = require('../utils/httpHelpers');
const { createJsonSyncStore } = require('../utils/jsonSyncStore');
const { broadcastSSE } = require('../state/sseHub');

const MAX_JSON_BYTES = 5 * 1024 * 1024;
const MAX_SETS_COUNT = 200;
const MAX_QUESTIONS_PER_SET = 500;

function sanitizeQuestionItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const question = String(raw.question || '').trim().slice(0, 4000);
  if (!question) return null;
  const srcOpts = Array.isArray(raw.options) ? raw.options.slice(0, 4) : ['', '', '', ''];
  while (srcOpts.length < 4) srcOpts.push('');
  const options = srcOpts.map((o) => String(o || '').trim().slice(0, 1500));
  const correctNum = parseInt(raw.correct, 10);
  const timeNum = parseInt(raw.time, 10);
  return {
    question,
    options,
    correct: Number.isFinite(correctNum) ? Math.max(0, Math.min(3, correctNum)) : 0,
    time: Number.isFinite(timeNum) ? Math.max(5, Math.min(180, timeNum)) : 30
  };
}

function sanitizeSetItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 120);
  const title = String(raw.title || '').trim().slice(0, 200);
  if (!id || !title) return null;
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions.slice(0, MAX_QUESTIONS_PER_SET) : [];
  const questions = rawQuestions.map(sanitizeQuestionItem).filter(Boolean);
  if (questions.length === 0) return null;
  const updatedNum = Number(raw.updatedAt);
  return {
    id,
    title,
    topic: String(raw.topic || 'Chủ đề tự chọn').trim().slice(0, 120) || 'Chủ đề tự chọn',
    updatedAt: Number.isFinite(updatedNum) && updatedNum > 0 ? updatedNum : Date.now(),
    isBuiltin: false,
    questions
  };
}

function sanitizeHistoryMap(rawMap, validIdsSet) {
  const out = {};
  if (!rawMap || typeof rawMap !== 'object') return out;
  for (const [setId, indices] of Object.entries(rawMap)) {
    const cleanId = String(setId || '').trim().slice(0, 120);
    if (!cleanId || !Array.isArray(indices)) continue;
    if (validIdsSet && !validIdsSet.has(cleanId) && !cleanId.startsWith('builtin_')) continue;
    const uniq = Array.from(new Set(
      indices.map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n) && n >= 0)
    ));
    if (uniq.length > 0) {
      out[cleanId] = uniq.slice(0, MAX_QUESTIONS_PER_SET);
    }
  }
  return out;
}

/**
 * Khởi tạo router đồng bộ Kho Bộ Đề Giáo Viên qua tệp JSON trên Server Node (/api/gmm/question-sets*).
 */
function createGmmQuestionSetsRouter(setsFilePath) {
  const manager = createJsonSyncStore({
    filePath: setsFilePath,
    itemsField: 'sets',
    maxItems: MAX_SETS_COUNT,
    sanitizeItem: sanitizeSetItem,
    initExtra: (parsed, validIds) => ({ poolHistory: sanitizeHistoryMap(parsed.poolHistory, validIds) })
  });
  const { store } = manager;

  return async function handleGmmQuestionSetsRoutes(req, res) {
    if (!req.url.startsWith('/api/gmm/question-sets')) {
      return false;
    }

    if (req.url === '/api/gmm/question-sets' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        serverSyncAvailable: true,
        fileName: manager.fileName,
        updatedAt: store.updatedAt,
        totalSets: store.sets.length,
        sets: store.sets,
        poolHistory: store.poolHistory,
        deletedIds: store.deletedIds
      });
      return true;
    }

    if (req.url === '/api/gmm/question-sets/sync' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req, MAX_JSON_BYTES);
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          sendJson(res, 400, { success: false, error: 'Dữ liệu đồng bộ không hợp lệ.' });
          return true;
        }
        if (body.sets !== undefined && !Array.isArray(body.sets)) {
          sendJson(res, 400, { success: false, error: 'Trường sets phải là mảng.' });
          return true;
        }

        const mode = body.mode === 'replace' ? 'replace' : 'merge';
        const validIds = manager.applySync(body.sets || [], mode);

        if (mode === 'replace') {
          store.poolHistory = sanitizeHistoryMap(body.poolHistory || store.poolHistory, validIds);
        } else {
          const mergedHist = sanitizeHistoryMap(store.poolHistory, validIds);
          if (body.poolHistory && typeof body.poolHistory === 'object') {
            const incomingHist = sanitizeHistoryMap(body.poolHistory, validIds);
            for (const [sid, arr] of Object.entries(incomingHist)) {
              const prevArr = mergedHist[sid] || [];
              mergedHist[sid] = Array.from(new Set([...prevArr, ...arr]));
            }
          }
          store.poolHistory = mergedHist;
        }

        manager.saveToDisk();

        broadcastSSE({
          type: 'gmm_question_sets_updated',
          clientOriginId: String(body.clientOriginId || ''),
          updatedAt: store.updatedAt,
          totalSets: store.sets.length
        });

        sendJson(res, 200, {
          success: true,
          fileName: manager.fileName,
          updatedAt: store.updatedAt,
          totalSets: store.sets.length,
          sets: store.sets,
          poolHistory: store.poolHistory,
          deletedIds: store.deletedIds
        });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    if (req.url === '/api/gmm/question-sets/delete' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const targetId = String((body && body.id) || '').trim();
        if (!targetId) {
          sendJson(res, 400, { success: false, error: 'Thiếu mã bộ đề (id) cần xóa.' });
          return true;
        }

        delete store.poolHistory[targetId];
        manager.deleteById(targetId);
        manager.saveToDisk();

        broadcastSSE({
          type: 'gmm_question_sets_updated',
          clientOriginId: String((body && body.clientOriginId) || ''),
          updatedAt: store.updatedAt,
          totalSets: store.sets.length
        });

        sendJson(res, 200, {
          success: true,
          updatedAt: store.updatedAt,
          totalSets: store.sets.length,
          sets: store.sets,
          deletedIds: store.deletedIds
        });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    if (req.url === '/api/gmm/question-sets/history' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const setId = String((body && body.setId) || '').trim().slice(0, 120);
        if (!setId) {
          sendJson(res, 400, { success: false, error: 'Thiếu setId lịch sử bốc câu hỏi.' });
          return true;
        }

        if (body.action === 'reset') {
          delete store.poolHistory[setId];
        } else if (Array.isArray(body.seenIndices)) {
          const valid = body.seenIndices
            .map((n) => parseInt(n, 10))
            .filter((n) => Number.isFinite(n) && n >= 0);
          store.poolHistory[setId] = Array.from(new Set(valid)).slice(0, MAX_QUESTIONS_PER_SET);
        }

        store.updatedAt = Date.now();
        manager.saveToDisk();

        broadcastSSE({
          type: 'gmm_question_sets_updated',
          clientOriginId: String((body && body.clientOriginId) || ''),
          updatedAt: store.updatedAt,
          totalSets: store.sets.length
        });

        sendJson(res, 200, {
          success: true,
          updatedAt: store.updatedAt,
          poolHistory: store.poolHistory
        });
      } catch (err) {
        sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
      return true;
    }

    sendJson(res, 404, { success: false, error: 'Không tìm thấy API Kho Đề phù hợp.' });
    return true;
  };
}

module.exports = { createGmmQuestionSetsRouter };
