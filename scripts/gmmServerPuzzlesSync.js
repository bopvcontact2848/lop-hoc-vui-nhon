/**
 * GMM Server Custom Puzzles Sync Client
 * Đồng bộ Bộ Sưu Tập Tranh Tự Tạo lên tệp JSON trên Server Node (/api/gmm/custom-puzzles*),
 * giúp Chrome, Edge hay nhiều trình duyệt trên máy chủ trường học thấy chung các bức tranh bí ẩn đã tạo.
 */
(function initGmmServerPuzzlesSync() {
  'use strict';

  const STORAGE_KEY_PUZZLE_SYNC_ENABLED = 'gmm_server_puzzles_sync_enabled_v1';

  const syncState = {
    serverAvailable: null,
    syncing: false,
    lastSyncedAt: 0,
    serverPuzzleCount: 0,
    fileName: 'gmm_custom_puzzles.json',
    lastError: ''
  };

  let syncInFlight = null;

  function getHelper() {
    return window.GmmServerSyncHelper || null;
  }

  function isSyncEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY_PUZZLE_SYNC_ENABLED) !== '0';
    } catch (_err) {
      return true;
    }
  }

  function updateStatusBadge() {
    const h = getHelper();
    const badgeEl = document.getElementById('gmmPuzzleSyncBadge');
    const toggleBtn = document.getElementById('gmmBtnTogglePuzzleSync');
    const manualBtn = document.getElementById('gmmBtnManualPuzzleSync');
    const enabled = isSyncEnabled();
    const canHttp = h ? h.canUseHttpApi() : false;

    if (badgeEl) {
      badgeEl.classList.remove('is-synced', 'is-paused', 'is-offline');
      if (!canHttp || syncState.serverAvailable === false) {
        badgeEl.classList.add('is-offline');
        badgeEl.textContent = '🌐 Tranh tự lưu: Chế độ trình duyệt (Offline)';
      } else if (!enabled) {
        badgeEl.classList.add('is-paused');
        badgeEl.textContent = '💾 Tạm tắt đồng bộ tranh lên Server';
      } else if (syncState.syncing) {
        badgeEl.classList.add('is-synced');
        badgeEl.textContent = '🔄 Đang đồng bộ Bộ sưu tập tranh với Server...';
      } else if (syncState.lastSyncedAt > 0) {
        badgeEl.classList.add('is-synced');
        const ts = h ? h.formatTimeShort(syncState.lastSyncedAt) : '';
        badgeEl.textContent = `🖥️ Đồng bộ Tranh Server: BẬT • ${syncState.serverPuzzleCount} tranh tự tạo (${syncState.fileName} • ${ts})`;
      } else {
        badgeEl.classList.add('is-synced');
        badgeEl.textContent = '🖥️ Đồng bộ Tranh Server: Đang kết nối...';
      }
    }

    if (toggleBtn) {
      toggleBtn.textContent = enabled ? '🟢 Bật Đồng Bộ' : '⚪ Tạm Tắt';
      toggleBtn.classList.toggle('is-active', enabled);
    }
    if (manualBtn) {
      manualBtn.disabled = !canHttp || syncState.serverAvailable === false || syncState.syncing;
    }
  }

  async function pullAndMerge(opts) {
    const cfg = opts || {};
    const h = getHelper();
    if (!h) return null;
    if (cfg.clientOriginId && cfg.clientOriginId === h.CLIENT_SYNC_ID) return null;
    if (!h.canUseHttpApi()) {
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
        const genApi = window.GiaiMaPuzzleGenerator;
        if (!genApi || typeof genApi.exportCustomPresetsSnapshot !== 'function') return null;

        const serverRes = await h.requestJson('/api/gmm/custom-puzzles');
        syncState.serverAvailable = true;
        syncState.fileName = serverRes.fileName || 'gmm_custom_puzzles.json';

        const localPuzzles = genApi.exportCustomPresetsSnapshot();
        const { mergedList, needsPushToServer } = h.mergeSetsAndDetectUploadNeed(
          localPuzzles,
          serverRes.puzzles,
          serverRes.deletedIds
        );

        let finalPuzzles = mergedList;
        if (needsPushToServer || cfg.forcePush) {
          const pushRes = await h.requestJson('/api/gmm/custom-puzzles/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'merge',
              clientOriginId: h.CLIENT_SYNC_ID,
              puzzles: mergedList
            })
          });
          if (Array.isArray(pushRes.puzzles)) finalPuzzles = pushRes.puzzles;
        }

        genApi.applyServerCustomPresets(finalPuzzles, { silent: Boolean(cfg.silent) });
        syncState.serverPuzzleCount = finalPuzzles.length;
        syncState.lastSyncedAt = Date.now();
        syncState.lastError = '';

        if (!cfg.silent && typeof window.showToast === 'function') {
          window.showToast(`🖼️ Đã đồng bộ ${finalPuzzles.length} tranh tự tạo với Máy Chủ Nội Bộ!`, 'success');
        }
        return { ok: true, totalPuzzles: finalPuzzles.length };
      } catch (err) {
        if (err && err.isNoApi) {
          syncState.serverAvailable = false;
        } else {
          syncState.lastError = err ? err.message : 'Lỗi kết nối';
          if (!cfg.silent && typeof window.showToast === 'function') {
            window.showToast(`⚠️ Chưa thể đồng bộ Tranh: ${syncState.lastError}`, 'warning');
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
    const h = getHelper();
    if (!h || !h.canUseHttpApi() || !isSyncEnabled()) return;
    if (syncState.serverAvailable === false) return;
    const genApi = window.GiaiMaPuzzleGenerator;
    if (!genApi) return;

    try {
      syncState.syncing = true;
      updateStatusBadge();

      let res;
      if (action === 'delete' && payload && payload.id) {
        res = await h.requestJson('/api/gmm/custom-puzzles/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id, clientOriginId: h.CLIENT_SYNC_ID })
        });
      } else {
        const localPuzzles = genApi.exportCustomPresetsSnapshot();
        res = await h.requestJson('/api/gmm/custom-puzzles/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'merge',
            clientOriginId: h.CLIENT_SYNC_ID,
            puzzles: localPuzzles
          })
        });
      }

      syncState.serverAvailable = true;
      if (res && typeof res.totalPuzzles === 'number') {
        syncState.serverPuzzleCount = res.totalPuzzles;
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
      localStorage.setItem(STORAGE_KEY_PUZZLE_SYNC_ENABLED, nextEnabled ? '1' : '0');
    } catch (_err) {}
    updateStatusBadge();
    if (nextEnabled) {
      pullAndMerge({ silent: false, forcePush: true });
    } else if (typeof window.showToast === 'function') {
      window.showToast('💾 Đã chuyển Bộ sưu tập tranh về lưu cục bộ trên trình duyệt này.', 'info');
    }
  }

  function syncNow() {
    if (!isSyncEnabled()) {
      try {
        localStorage.setItem(STORAGE_KEY_PUZZLE_SYNC_ENABLED, '1');
      } catch (_err) {}
    }
    return pullAndMerge({ silent: false, forcePush: true, forceManual: true });
  }

  if (typeof document !== 'undefined') {
    const bootSync = () => {
      updateStatusBadge();
      const h = getHelper();
      if (h && h.canUseHttpApi() && isSyncEnabled()) {
        pullAndMerge({ silent: true });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootSync);
    } else {
      setTimeout(bootSync, 0);
    }
  }

  window.GmmServerPuzzlesSync = {
    isSyncEnabled,
    getStatus: () => Object.assign({}, syncState, { enabled: isSyncEnabled() }),
    updateStatusBadge,
    pullAndMerge,
    pushMutation,
    toggleSyncMode,
    syncNow
  };
})();
