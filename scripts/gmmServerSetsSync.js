/**
 * GMM Server Question Sets Sync Client
 * Đồng bộ Kho Bộ Đề Giáo Viên qua tệp JSON trên Server Node (/api/gmm/question-sets*),
 * giúp Chrome, Edge hay nhiều trình duyệt trên máy chủ trường học dùng chung một kho đề.
 */
(function initGmmServerSetsSync() {
  'use strict';

  const STORAGE_KEY_SYNC_ENABLED = 'gmm_server_sets_sync_enabled_v1';
  const CLIENT_SYNC_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const syncState = {
    serverAvailable: null,
    syncing: false,
    lastSyncedAt: 0,
    serverSetCount: 0,
    fileName: 'gmm_question_sets.json',
    lastError: ''
  };

  let syncInFlight = null;

  function canUseHttpApi() {
    if (typeof window === 'undefined' || !window.location) return false;
    const proto = String(window.location.protocol || '');
    return (proto === 'http:' || proto === 'https:') && typeof window.fetch === 'function';
  }

  function isSyncEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY_SYNC_ENABLED) !== '0';
    } catch (_err) {
      return true;
    }
  }

  function formatTimeShort(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_err) {
      return '';
    }
  }

  function updateStatusBadge() {
    const badgeEl = document.getElementById('gmmServerSyncBadge');
    const toggleBtn = document.getElementById('gmmBtnToggleServerSync');
    const manualBtn = document.getElementById('gmmBtnManualServerSync');
    const enabled = isSyncEnabled();

    if (badgeEl) {
      badgeEl.classList.remove('is-synced', 'is-paused', 'is-offline');
      if (!canUseHttpApi() || syncState.serverAvailable === false) {
        badgeEl.classList.add('is-offline');
        badgeEl.textContent = '🌐 Chế độ Offline (Lưu trên trình duyệt hiện tại)';
      } else if (!enabled) {
        badgeEl.classList.add('is-paused');
        badgeEl.textContent = '💾 Tạm tắt đồng bộ Server • Chỉ lưu trình duyệt này';
      } else if (syncState.syncing) {
        badgeEl.classList.add('is-synced');
        badgeEl.textContent = '🔄 Đang đồng bộ Kho Đề với Máy Chủ Nội Bộ...';
      } else if (syncState.lastSyncedAt > 0) {
        badgeEl.classList.add('is-synced');
        const timeStr = formatTimeShort(syncState.lastSyncedAt);
        badgeEl.textContent = `🖥️ Đồng bộ Server Node: BẬT • ${syncState.serverSetCount} bộ đề (server/data/${syncState.fileName} • ${timeStr})`;
      } else {
        badgeEl.classList.add('is-synced');
        badgeEl.textContent = '🖥️ Đồng bộ Server Node: Đang kiểm tra kết nối...';
      }
    }

    if (toggleBtn) {
      toggleBtn.textContent = enabled ? '🟢 Đang Bật Đồng Bộ Server' : '⚪ Đang Tắt Đồng Bộ Server';
      toggleBtn.classList.toggle('is-active', enabled);
    }
    if (manualBtn) {
      manualBtn.disabled = !canUseHttpApi() || syncState.serverAvailable === false || syncState.syncing;
    }
  }

  async function requestJson(url, options) {
    const res = await fetch(url, Object.assign({ cache: 'no-store' }, options || {}));
    const ctype = String(res.headers.get('content-type') || '');
    if (!ctype.includes('application/json')) {
      const err = new Error('Máy chủ không hỗ trợ API JSON Kho Đề');
      err.isNoApi = true;
      throw err;
    }
    const data = await res.json();
    if (!res.ok || !data || data.success === false) {
      throw new Error((data && data.error) || `HTTP ${res.status}`);
    }
    return data;
  }

  function mergeSetsAndDetectUploadNeed(localSets, serverSets, deletedIds) {
    const mergedById = new Map();
    const serverById = new Map();
    const delMap = deletedIds && typeof deletedIds === 'object' ? deletedIds : {};

    (serverSets || []).forEach((s) => {
      if (!s || !s.id) return;
      const copy = Object.assign({}, s, { isBuiltin: false });
      serverById.set(copy.id, copy);
      mergedById.set(copy.id, copy);
    });

    let needsPushToServer = false;
    (localSets || []).forEach((loc) => {
      if (!loc || !loc.id) return;
      const locTs = Number(loc.updatedAt) || 0;
      const delTs = Number(delMap[loc.id]) || 0;
      if (delTs > 0 && delTs >= locTs) {
        return;
      }
      const srv = serverById.get(loc.id);
      if (!srv) {
        mergedById.set(loc.id, Object.assign({}, loc, { isBuiltin: false }));
        needsPushToServer = true;
      } else if (locTs > (Number(srv.updatedAt) || 0)) {
        mergedById.set(loc.id, Object.assign({}, loc, { isBuiltin: false }));
        needsPushToServer = true;
      }
    });

    const mergedList = Array.from(mergedById.values())
      .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));

    return { mergedList, needsPushToServer };
  }

  function mergePoolHistoryMaps(localHist, serverHist, validIds, serverSetIds) {
    const out = {};
    const validSet = new Set(validIds || []);
    const srvIds = new Set(serverSetIds || []);
    const sHist = serverHist && typeof serverHist === 'object' ? serverHist : {};
    const lHist = localHist && typeof localHist === 'object' ? localHist : {};

    for (const sid of validSet) {
      const targetArr = srvIds.has(sid) ? sHist[sid] : (lHist[sid] || sHist[sid]);
      if (Array.isArray(targetArr) && targetArr.length > 0) {
        out[sid] = Array.from(new Set(targetArr));
      }
    }
    for (const [sid, arr] of Object.entries(sHist)) {
      if (sid.startsWith('builtin_') && Array.isArray(arr) && arr.length > 0) {
        out[sid] = Array.from(new Set(arr));
      }
    }
    return out;
  }

  async function pullAndMerge(opts) {
    const cfg = opts || {};
    if (cfg.clientOriginId && cfg.clientOriginId === CLIENT_SYNC_ID) return null;
    if (!canUseHttpApi()) {
      syncState.serverAvailable = false;
      updateStatusBadge();
      return null;
    }
    if (!isSyncEnabled() && !cfg.forceManual) {
      updateStatusBadge();
      return null;
    }
    if (syncInFlight) return syncInFlight;

    syncState.syncing = true;
    updateStatusBadge();

    syncInFlight = (async () => {
      try {
        const setsApi = window.GmmQuestionSets;
        if (!setsApi || typeof setsApi.exportLocalSnapshot !== 'function') return null;

        const serverRes = await requestJson('/api/gmm/question-sets');
        syncState.serverAvailable = true;
        syncState.fileName = serverRes.fileName || 'gmm_question_sets.json';

        const localSnap = setsApi.exportLocalSnapshot();
        const { mergedList, needsPushToServer } = mergeSetsAndDetectUploadNeed(
          localSnap.sets,
          serverRes.sets,
          serverRes.deletedIds
        );
        const mergedHist = mergePoolHistoryMaps(
          localSnap.poolHistory,
          serverRes.poolHistory,
          mergedList.map((s) => s.id),
          (serverRes.sets || []).map((s) => s.id)
        );

        let finalSets = mergedList;
        let finalHist = mergedHist;
        if (needsPushToServer || cfg.forcePush) {
          const pushRes = await requestJson('/api/gmm/question-sets/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'merge',
              clientOriginId: CLIENT_SYNC_ID,
              sets: mergedList,
              poolHistory: mergedHist
            })
          });
          if (Array.isArray(pushRes.sets)) finalSets = pushRes.sets;
          if (pushRes.poolHistory) finalHist = pushRes.poolHistory;
        }

        setsApi.applyServerSnapshot(finalSets, finalHist, { silent: Boolean(cfg.silent) });
        syncState.serverSetCount = finalSets.length;
        syncState.lastSyncedAt = Date.now();
        syncState.lastError = '';

        if (!cfg.silent && typeof window.showToast === 'function') {
          window.showToast(
            `🖥️ Đã đồng bộ ${finalSets.length} bộ đề tự lưu với Máy Chủ Nội Bộ!`,
            'success'
          );
        }
        return { ok: true, totalSets: finalSets.length };
      } catch (err) {
        if (err && err.isNoApi) {
          syncState.serverAvailable = false;
        } else {
          syncState.lastError = err ? err.message : 'Lỗi kết nối';
          if (!cfg.silent && typeof window.showToast === 'function') {
            window.showToast(`⚠️ Chưa thể đồng bộ Server: ${syncState.lastError}`, 'warning');
          }
        }
        return { ok: false, error: syncState.lastError };
      } finally {
        syncState.syncing = false;
        syncInFlight = null;
        updateStatusBadge();
      }
    })();

    return syncInFlight;
  }

  async function pushMutation(action, payload) {
    if (!canUseHttpApi() || !isSyncEnabled()) return;
    if (syncState.serverAvailable === false) return;
    const setsApi = window.GmmQuestionSets;
    if (!setsApi) return;

    try {
      syncState.syncing = true;
      updateStatusBadge();

      let res;
      if (action === 'delete' && payload && payload.id) {
        res = await requestJson('/api/gmm/question-sets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id, clientOriginId: CLIENT_SYNC_ID })
        });
      } else if (action === 'history' && payload && payload.setId) {
        res = await requestJson('/api/gmm/question-sets/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setId: payload.setId,
            seenIndices: payload.seenIndices || [],
            action: payload.reset ? 'reset' : 'update',
            clientOriginId: CLIENT_SYNC_ID
          })
        });
      } else {
        const snap = setsApi.exportLocalSnapshot();
        res = await requestJson('/api/gmm/question-sets/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'merge',
            clientOriginId: CLIENT_SYNC_ID,
            sets: snap.sets,
            poolHistory: snap.poolHistory
          })
        });
      }

      syncState.serverAvailable = true;
      if (res && typeof res.totalSets === 'number') {
        syncState.serverSetCount = res.totalSets;
      }
      syncState.lastSyncedAt = Date.now();
      syncState.lastError = '';
    } catch (err) {
      if (err && err.isNoApi) syncState.serverAvailable = false;
    } finally {
      syncState.syncing = false;
      updateStatusBadge();
    }
  }

  function toggleSyncMode() {
    const nextEnabled = !isSyncEnabled();
    try {
      localStorage.setItem(STORAGE_KEY_SYNC_ENABLED, nextEnabled ? '1' : '0');
    } catch (_err) {}
    updateStatusBadge();
    if (nextEnabled) {
      pullAndMerge({ silent: false, forcePush: true });
    } else if (typeof window.showToast === 'function') {
      window.showToast('💾 Đã chuyển sang chỉ lưu Kho Đề trên trình duyệt hiện tại.', 'info');
    }
  }

  function syncNow() {
    if (!isSyncEnabled()) {
      try {
        localStorage.setItem(STORAGE_KEY_SYNC_ENABLED, '1');
      } catch (_err) {}
    }
    return pullAndMerge({ silent: false, forcePush: true, forceManual: true });
  }

  if (typeof document !== 'undefined') {
    const bootSync = () => {
      updateStatusBadge();
      if (canUseHttpApi() && isSyncEnabled()) {
        pullAndMerge({ silent: true });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootSync);
    } else {
      setTimeout(bootSync, 0);
    }
  }

  window.GmmServerSyncHelper = {
    CLIENT_SYNC_ID,
    canUseHttpApi,
    formatTimeShort,
    requestJson,
    mergeSetsAndDetectUploadNeed
  };

  window.GmmServerSetsSync = {
    CLIENT_SYNC_ID,
    isSyncEnabled,
    getStatus: () => Object.assign({}, syncState, { enabled: isSyncEnabled() }),
    updateStatusBadge,
    pullAndMerge,
    pushMutation,
    toggleSyncMode,
    syncNow
  };
})();
