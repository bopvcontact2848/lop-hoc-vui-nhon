/**
 * ==============================================================================
 * MODULE LƯU TRỮ NGOẠI TUYẾN & HÀNG ĐỢI ĐỒNG BỘ MOBILE (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmMobileOffline.js
 * Trách nhiệm: Sao lưu LocalStorage, hàng đợi gửi bù đáp án khi mất Wi-Fi,
 * tự gửi bù khi có mạng trở lại, polling dự phòng và nhịp tim telemetry.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmMobileOffline = {
    create: function (ctx) {
      const {
        mobileState,
        fetchCurrentServerState,
        connectStudentSSE,
        resetMobileClientState,
        applyServerStateToMobile
      } = ctx;

  function announceMobileJoinToServer(teamKey, force = false) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    const tKey = teamKey || ctx.getStudentTeamKey();
    if (tKey !== 'teamA' && tKey !== 'teamB') return;
    const now = Date.now();
    if (!force && now - mobileState.lastJoinAnnounceAt < 3000) return;
    mobileState.lastJoinAnnounceAt = now;

    try {
      fetch('/api/gmm/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: tKey })
      }).catch(() => {});
    } catch (_e) {}
  }

  function startMobileStatePolling() {
    if (mobileState.syncPollInterval) {
      clearInterval(mobileState.syncPollInterval);
    }
    // Kênh đồng bộ kép (Polling 2.5s dự phòng cho Zalo WebView khi SSE bị đóng băng chạy ngầm)
    mobileState.syncPollInterval = setInterval(() => {
      if (ctx.isStudentMobile()) {
        fetchCurrentServerState(true);
      }
    }, 2500);
  }

  function bindMobileLifecycleSync() {
    if (mobileState.isLifecycleBound || typeof window === 'undefined') return;
    mobileState.isLifecycleBound = true;

    const handleWakeOrFocus = () => {
      if (!ctx.isStudentMobile()) return;
      if (!mobileState.sseSource || mobileState.sseSource.readyState === 2) {
        connectStudentSSE();
      }
      announceMobileJoinToServer(ctx.getStudentTeamKey(), false);
      fetchCurrentServerState(false);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleWakeOrFocus();
      }
    });
    window.addEventListener('focus', handleWakeOrFocus);
    window.addEventListener('pageshow', handleWakeOrFocus);
    window.addEventListener('online', handleWakeOrFocus);
  }

  async function syncMobileNow() {
    if (!ctx.isStudentMobile()) return;
    announceMobileJoinToServer(ctx.getStudentTeamKey(), true);
    if (!mobileState.sseSource || mobileState.sseSource.readyState === 2) {
      connectStudentSSE();
    }
    await fetchCurrentServerState(false);
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã đồng bộ trạng thái mới nhất từ máy chiếu!', 'success');
    }
  }

  // Khởi tạo Giao diện Thi đấu dành cho Học sinh trên Điện thoại (Student Mobile Arena)

  function getMobileTelemetrySnapshot() {
    const paintView = document.getElementById('gmmMobPaintView');
    const lobbyView = document.getElementById('gmmMobLobbyView');
    let currentPage = 'quiz';
    if (paintView && paintView.style.display !== 'none') {
      currentPage = 'decrypt';
    } else if (mobileState.wasInLobby || (lobbyView && lobbyView.style.display !== 'none')) {
      currentPage = 'lobby';
    } else if (mobileState.isLocked) {
      currentPage = 'locked';
    }
    return {
      currentPage,
      currentQ: (typeof mobileState.activeQIndex === 'number' ? mobileState.activeQIndex : 0) + 1,
      answeredCount: Object.keys(mobileState.teamAnswers || {}).length,
      isLocked: Boolean(mobileState.isLocked)
    };
  }


  function getMobileStorageKey(subKey) {
    return `gmm_mob_${ctx.getStudentTeamKey() || 'team'}_${subKey}`;
  }

  function saveMobileAnswersToLocal() {
    try {
      localStorage.setItem(getMobileStorageKey('answers'), JSON.stringify(mobileState.teamAnswers));
      if (mobileState.isLocked) {
        localStorage.setItem(getMobileStorageKey('locked'), '1');
      } else {
        localStorage.removeItem(getMobileStorageKey('locked'));
      }
      if (mobileState.finishTimeFormatted) {
        localStorage.setItem(getMobileStorageKey('finishTime'), mobileState.finishTimeFormatted);
      } else {
        localStorage.removeItem(getMobileStorageKey('finishTime'));
      }
      if (mobileState.sessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), String(mobileState.sessionId));
      }
    } catch (_e) {}
  }

  function loadMobileAnswersFromLocal() {
    try {
      const savedSession = localStorage.getItem(getMobileStorageKey('sessionId'));
      if (savedSession) {
        mobileState.sessionId = String(savedSession);
      }
      const saved = localStorage.getItem(getMobileStorageKey('answers'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          mobileState.teamAnswers = Object.assign({}, parsed, mobileState.teamAnswers);
        }
      }
      if (localStorage.getItem(getMobileStorageKey('locked')) === '1') {
        mobileState.isLocked = true;
      }
      const savedFinishTime = localStorage.getItem(getMobileStorageKey('finishTime'));
      if (savedFinishTime) {
        mobileState.finishTimeFormatted = savedFinishTime;
      }
      const queueSaved = localStorage.getItem(getMobileStorageKey('syncQueue'));
      if (queueSaved) {
        const queueParsed = JSON.parse(queueSaved);
        if (Array.isArray(queueParsed)) {
          mobileState.pendingSyncQueue = queueParsed;
        }
      }
    } catch (_e) {}
  }

  // Xóa sạch toàn bộ dữ liệu ván cũ (RAM + LocalStorage + Giao diện Khóa bài) trên điện thoại học sinh

  function addToPendingSyncQueue(questionId, optionIdx) {
    const existing = mobileState.pendingSyncQueue.find(item => item.questionId === questionId);
    if (existing) {
      existing.optionIdx = optionIdx;
      existing.sessionId = mobileState.sessionId;
      existing.timestamp = Date.now();
    } else {
      mobileState.pendingSyncQueue.push({
        questionId,
        optionIdx,
        sessionId: mobileState.sessionId,
        timestamp: Date.now()
      });
    }
    try {
      localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobileState.pendingSyncQueue));
    } catch (_e) {}
    updateSyncStatusBadge();
  }

  async function flushPendingSyncQueue() {
    if (mobileState.pendingSyncQueue.length === 0) return;
    const items = [...mobileState.pendingSyncQueue];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.sessionId && mobileState.sessionId && String(item.sessionId) !== String(mobileState.sessionId)) {
        mobileState.pendingSyncQueue = mobileState.pendingSyncQueue.filter(q => q !== item);
        continue;
      }
      try {
        const res = await fetch('/api/gmm/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team: ctx.getStudentTeamKey(),
            questionId: item.questionId,
            optionIndex: item.optionIdx,
            sessionId: mobileState.sessionId
          })
        });
        if (res.ok) {
          mobileState.pendingSyncQueue = mobileState.pendingSyncQueue.filter(q => q.questionId !== item.questionId);
          try {
            localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobileState.pendingSyncQueue));
          } catch (_e) {}
        } else if (res.status === 409) {
          const errJson = await res.json().catch(() => ({}));
          if (errJson && errJson.staleSession) {
            resetMobileClientState(errJson.currentSessionId);
            if (errJson.state) applyServerStateToMobile(errJson.state, false);
            return;
          }
          mobileState.pendingSyncQueue = [];
          try { localStorage.removeItem(getMobileStorageKey('syncQueue')); } catch (_e) {}
          break;
        }
      } catch (_e) {
        break; // Mạng vẫn chưa ổn định
      }
    }
    updateSyncStatusBadge();
  }

  function updateSyncStatusBadge() {
    const statusText = document.getElementById('gmmMobStatusText');
    const statusPill = document.getElementById('gmmMobStatusPill');
    if (!statusText || !statusPill) return;

    if (mobileState.pendingSyncQueue.length > 0) {
      statusPill.className = 'gmm-mob-status-pill offline';
      statusText.textContent = `Lưu tạm (${mobileState.pendingSyncQueue.length} câu chờ Wi-Fi)`;
    } else {
      statusPill.className = 'gmm-mob-status-pill';
      statusText.textContent = 'Đã kết nối máy chiếu';
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      flushPendingSyncQueue();
      if (typeof window.showToast === 'function') {
        window.showToast('📶 Đã có kết nối Wi-Fi! Đang tự động gửi bù đáp án...', 'success');
      }
    });
  }


      return {
        announceMobileJoinToServer,
        startMobileStatePolling,
        bindMobileLifecycleSync,
        syncMobileNow,
        getMobileTelemetrySnapshot,
        getMobileStorageKey,
        saveMobileAnswersToLocal,
        loadMobileAnswersFromLocal,
        addToPendingSyncQueue,
        flushPendingSyncQueue,
        updateSyncStatusBadge
      };
    }
  };
})();
