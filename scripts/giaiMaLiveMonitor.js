/**
 * ==============================================================================
 * MODULE GIÁM SÁT NHỊP TIM TRỰC TIẾP (LIVE PING), MỞ KHÓA RIÊNG TỪNG ĐỘI
 * & KHÓA CHỐNG THOÁT TRANG + GIỮ SÁNG MÀN HÌNH (HYBRID WAKE LOCK CHO ZALO LAN)
 * File: scripts/giaiMaLiveMonitor.js
 * ==============================================================================
 */

(function () {
  'use strict';

  const PING_INTERVAL_MS = 3000;
  const STALE_THRESHOLD_MS = 9500;

  let isStudentClient = false;
  let activeTeamKey = null;
  let mobilePingTimer = null;
  let hostWatchdogTimer = null;
  let serverTimeOffsetMs = 0;
  const mobileClientId = 'mob_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

  function getMobileClientId() {
    return mobileClientId;
  }

  // Trạng thái Wake Lock kép (Native API + Canvas Video Stream cho mạng LAN HTTP / Zalo WebView)
  let nativeWakeLock = null;
  let fallbackVideoEl = null;
  let fallbackCanvasTimer = null;
  let isFallbackVideoPlaying = false;

  // Trạng thái Khóa chống thoát trang (History Popstate Shield + beforeunload)
  let exitGuardEnabled = true;
  let isHistoryGuardPushed = false;
  let allowIntentionalExit = false;

  const hostTelemetry = {
    teamA: createDefaultTelemetry(),
    teamB: createDefaultTelemetry()
  };

  function createDefaultTelemetry() {
    return {
      lastPingAt: 0,
      screenState: 'unknown',
      currentPage: 'lobby',
      currentQ: 1,
      answeredCount: 0,
      isLocked: false,
      wakeLockActive: false,
      exitGuardActive: false
    };
  }

  function isKeepAwakeActive() {
    return Boolean(nativeWakeLock || isFallbackVideoPlaying);
  }

  // ============================================================================
  // 1. CHẾ ĐỘ GIỮ MÀN HÌNH LUÔN SÁNG KÉP (NATIVE WAKELOCK + VIDEO STREAM LAN HTTP)
  // ============================================================================
  async function acquireNativeWakeLock() {
    if (!('wakeLock' in navigator) || !navigator.wakeLock) return false;
    try {
      if (nativeWakeLock) return true;
      nativeWakeLock = await navigator.wakeLock.request('screen');
      nativeWakeLock.addEventListener('release', () => {
        nativeWakeLock = null;
        updateMobileShieldUI();
      });
      updateMobileShieldUI();
      return true;
    } catch (_err) {
      return false;
    }
  }

  function ensureFallbackKeepAwakeVideo() {
    if (fallbackVideoEl) return fallbackVideoEl;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      let tick = 0;

      const drawFrame = () => {
        if (!ctx) return;
        tick = (tick + 1) % 2;
        ctx.fillStyle = tick === 0 ? '#0f172a' : '#111c33';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = tick === 0 ? '#10b981' : '#38bdf8';
        ctx.fillRect(4, 4, 4, 4);
      };
      drawFrame();

      if (fallbackCanvasTimer) clearInterval(fallbackCanvasTimer);
      fallbackCanvasTimer = setInterval(drawFrame, 1000);

      const streamFn = canvas.captureStream || canvas.mozCaptureStream || canvas.webkitCaptureStream;
      if (!streamFn) return null;

      const stream = streamFn.call(canvas, 2);
      const vid = document.createElement('video');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.setAttribute('muted', '');
      vid.muted = true;
      vid.autoplay = true;
      vid.width = 2;
      vid.height = 2;
      // Giữ kích thước 2x2 trong viewport với opacity > 0 để trình giải mã video của Android/Zalo giữ cờ FLAG_KEEP_SCREEN_ON
      vid.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:1;';
      vid.srcObject = stream;
      document.body.appendChild(vid);

      vid.addEventListener('play', () => {
        isFallbackVideoPlaying = true;
        updateMobileShieldUI();
      });
      vid.addEventListener('pause', () => {
        isFallbackVideoPlaying = false;
        updateMobileShieldUI();
      });

      fallbackVideoEl = vid;
      return vid;
    } catch (_e) {
      return null;
    }
  }

  async function activateHybridWakeLock() {
    if (!isStudentClient) return;
    await acquireNativeWakeLock();

    const vid = ensureFallbackKeepAwakeVideo();
    if (vid && vid.paused) {
      try {
        await vid.play();
        isFallbackVideoPlaying = true;
      } catch (_playErr) {
        // Sẽ tự động kích hoạt ngay ở cú chạm màn hình đầu tiên của học sinh
      }
    }
    updateMobileShieldUI();
  }

  function releaseHybridWakeLock() {
    if (nativeWakeLock) {
      try { nativeWakeLock.release(); } catch (_e) {}
      nativeWakeLock = null;
    }
    if (fallbackVideoEl) {
      try { fallbackVideoEl.pause(); } catch (_e) {}
    }
    isFallbackVideoPlaying = false;
    updateMobileShieldUI();
  }

  // ============================================================================
  // 2. KHÓA CHỐNG THOÁT TRANG NHẦM TRÊN ĐIỆN THOẠI & ZALO WEBVIEW
  // ============================================================================
  function armHistoryBackShield() {
    if (!isStudentClient || !exitGuardEnabled || allowIntentionalExit) return;
    try {
      if (!isHistoryGuardPushed) {
        window.history.pushState({ gmmExitShield: true }, '', window.location.href);
        isHistoryGuardPushed = true;
      }
    } catch (_e) {}
  }

  function bindAntiExitListeners() {
    window.addEventListener('popstate', () => {
      if (!isStudentClient || !exitGuardEnabled || allowIntentionalExit) return;
      try {
        window.history.pushState({ gmmExitShield: true }, '', window.location.href);
        isHistoryGuardPushed = true;
      } catch (_e) {}

      if (navigator.vibrate) {
        try { navigator.vibrate([70, 40, 70]); } catch (_v) {}
      }
      openExitGuardModal();
    });

    window.addEventListener('beforeunload', (e) => {
      if (!isStudentClient) return;
      if (!exitGuardEnabled || allowIntentionalExit) {
        notifyMobileLeave('page_unload');
        return;
      }
      e.preventDefault();
      e.returnValue = 'Đội em đang trong phòng thi đấu Giải Mã Bí Mật. Em có chắc muốn rời khỏi trang không?';
      return e.returnValue;
    });
  }

  function notifyMobileLeave(reason = 'page_unload') {
    if (!isStudentClient || (activeTeamKey !== 'teamA' && activeTeamKey !== 'teamB')) return;
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    if (reason === 'explicit_exit') {
      if (mobilePingTimer) {
        clearInterval(mobilePingTimer);
        mobilePingTimer = null;
      }
      if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.closeStudentSseOnExit === 'function') {
        window.GiaiMaBiMat.closeStudentSseOnExit();
      }
    }

    const bodyStr = JSON.stringify({
      team: activeTeamKey,
      cid: mobileClientId,
      reason
    });

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([bodyStr], { type: 'application/json' });
        if (navigator.sendBeacon('/api/gmm/leave', blob)) return;
      } catch (_e) {}
    }

    try {
      fetch('/api/gmm/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      }).catch(() => {});
    } catch (_err) {}
  }

  function openExitGuardModal() {
    const modal = document.getElementById('gmmMobExitGuardModal');
    if (modal) modal.style.display = 'flex';
  }

  function stayInArena() {
    const modal = document.getElementById('gmmMobExitGuardModal');
    if (modal) modal.style.display = 'none';
    armHistoryBackShield();
    activateHybridWakeLock();
    sendMobilePing(false);
  }

  function confirmIntentionalExit() {
    allowIntentionalExit = true;
    exitGuardEnabled = false;
    releaseHybridWakeLock();
    notifyMobileLeave('explicit_exit');
    const modal = document.getElementById('gmmMobExitGuardModal');
    if (modal) modal.style.display = 'none';
    updateMobileShieldUI();

    if (typeof window.showToast === 'function') {
      window.showToast('🚪 Đã ngắt kết nối phòng thi. Em có thể rời khỏi trang.', 'info');
    }
    try {
      if (window.history.length > 1) {
        window.history.back();
      }
    } catch (_e) {}
  }

  function toggleMobileShield() {
    if (!isStudentClient) return;
    exitGuardEnabled = !exitGuardEnabled;
    if (exitGuardEnabled) {
      allowIntentionalExit = false;
      armHistoryBackShield();
      activateHybridWakeLock();
      if (typeof window.showToast === 'function') {
        window.showToast('🛡️ Đã BẬT Khóa chống thoát nhầm & Giữ màn hình luôn sáng!', 'success');
      }
    } else {
      releaseHybridWakeLock();
      if (typeof window.showToast === 'function') {
        window.showToast('🔓 Đã TẮT Khóa chống thoát & Giữ sáng màn hình.', 'info');
      }
    }
    updateMobileShieldUI();
    sendMobilePing(false);
  }

  function updateMobileShieldUI() {
    if (!isStudentClient) return;
    const pill = document.getElementById('gmmMobShieldPill');
    const wakeBadge = document.getElementById('gmmMobWakeBadge');
    const awake = isKeepAwakeActive();

    if (pill) {
      if (exitGuardEnabled) {
        pill.className = 'gmm-mob-shield-pill active';
        pill.innerHTML = '<span>🛡️ Khóa chống thoát: BẬT</span>';
      } else {
        pill.className = 'gmm-mob-shield-pill off';
        pill.innerHTML = '<span>🔓 Khóa thoát: TẮT</span>';
      }
    }

    if (wakeBadge) {
      if (awake) {
        wakeBadge.className = 'gmm-mob-wake-badge active';
        wakeBadge.innerHTML = '<span>☀️ Màn hình luôn sáng</span>';
      } else if (exitGuardEnabled) {
        wakeBadge.className = 'gmm-mob-wake-badge standby';
        wakeBadge.innerHTML = '<span>👆 Chạm để giữ sáng</span>';
      } else {
        wakeBadge.className = 'gmm-mob-wake-badge off';
        wakeBadge.innerHTML = '<span>🌙 Tự tắt theo máy</span>';
      }
    }
  }

  // ============================================================================
  // 3. PHÁT TÍN HIỆU NHỊP TIM (LIVE PING) TỪ ĐIỆN THOẠI HỌC SINH LÊN MÁY CHỦ
  // ============================================================================
  function buildMobilePingPayload(overrideScreenState) {
    let snap = {
      currentPage: 'lobby',
      currentQ: 1,
      answeredCount: 0,
      isLocked: false
    };
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getMobileTelemetrySnapshot === 'function') {
      snap = Object.assign(snap, window.GiaiMaBiMat.getMobileTelemetrySnapshot());
    }

    const screenState = overrideScreenState || (document.visibilityState === 'hidden' ? 'hidden' : 'visible');
    return {
      team: activeTeamKey,
      screenState,
      currentPage: snap.currentPage,
      currentQ: snap.currentQ,
      answeredCount: snap.answeredCount,
      isLocked: snap.isLocked,
      wakeLockActive: isKeepAwakeActive(),
      exitGuardActive: exitGuardEnabled
    };
  }

  function sendMobilePing(useBeacon = false, overrideScreenState = null) {
    if (!isStudentClient || (activeTeamKey !== 'teamA' && activeTeamKey !== 'teamB')) return;
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    const payloadObj = buildMobilePingPayload(overrideScreenState);
    const jsonBody = JSON.stringify(payloadObj);

    if (useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([jsonBody], { type: 'application/json' });
        const queued = navigator.sendBeacon('/api/gmm/ping', blob);
        if (queued) return;
      } catch (_e) {}
    }

    try {
      fetch('/api/gmm/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody,
        keepalive: Boolean(useBeacon)
      }).catch(() => {});
    } catch (_err) {}
  }

  function initStudentMonitor(teamKey) {
    isStudentClient = true;
    activeTeamKey = teamKey;
    exitGuardEnabled = true;
    allowIntentionalExit = false;

    const shieldBar = document.getElementById('gmmMobShieldBar');
    if (shieldBar) shieldBar.style.display = 'flex';

    updateMobileShieldUI();
    armHistoryBackShield();
    bindAntiExitListeners();
    activateHybridWakeLock();

    // Tự động kích hoạt giữ sáng & khóa chống thoát ngay cú chạm đầu tiên của học sinh
    const onFirstGesture = () => {
      if (!isStudentClient) return;
      if (exitGuardEnabled) {
        armHistoryBackShield();
        if (!isKeepAwakeActive()) {
          activateHybridWakeLock();
        }
      }
    };
    document.addEventListener('touchstart', onFirstGesture, { passive: true });
    document.addEventListener('click', onFirstGesture, { passive: true });

    // Báo ngay lập tức khi học sinh tắt màn hình / ẩn Zalo hoặc mở sáng màn hình lại
    document.addEventListener('visibilitychange', () => {
      if (!isStudentClient) return;
      if (document.visibilityState === 'hidden') {
        sendMobilePing(true, 'hidden');
      } else {
        if (exitGuardEnabled) activateHybridWakeLock();
        sendMobilePing(false, 'visible');
      }
    });

    window.addEventListener('pagehide', () => {
      if (isStudentClient) {
        notifyMobileLeave('page_unload');
      }
    });

    if (mobilePingTimer) clearInterval(mobilePingTimer);
    sendMobilePing(false, 'visible');
    mobilePingTimer = setInterval(() => {
      sendMobilePing(false);
    }, PING_INTERVAL_MS);
  }

  // ============================================================================
  // 4. ĐÈN BÁO NHỊP TIM (LIVE PING INDICATOR) & MỞ KHÓA RIÊNG 1 ĐỘI TRÊN MÁY GIÁO VIÊN
  // ============================================================================
  function getHostTeamTelemetry(teamKey) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return null;
    return hostTelemetry[teamKey] || null;
  }

  function handleTeamDisconnected(teamKey, serverTime) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    if (typeof serverTime === 'number' && serverTime > 0) {
      serverTimeOffsetMs = serverTime - Date.now();
    }
    hostTelemetry[teamKey] = createDefaultTelemetry();
    renderHostPingIndicators();
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
      window.GiaiMaTeacherKey.renderLiveQuizCards();
    }
  }

  async function kickTeamConnection(teamKey) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    const teamLabel = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamName === 'function')
      ? window.GiaiMaBiMat.getTeamName(teamKey, 'full')
      : (teamKey === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)');
    try {
      await fetch('/api/gmm/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamKey, reason: 'teacher_kick' })
      });
      handleTeamDisconnected(teamKey, Date.now());
      if (typeof window.showToast === 'function') {
        window.showToast(`🔄 Đã làm mới trạng thái kết nối của ${teamLabel}.`, 'info');
      }
    } catch (_e) {}
  }

  function ingestServerTelemetry(teamKey, telemetryData, serverTime) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    if (typeof serverTime === 'number' && serverTime > 0) {
      serverTimeOffsetMs = serverTime - Date.now();
    }
    if (telemetryData && typeof telemetryData === 'object') {
      hostTelemetry[teamKey] = Object.assign(createDefaultTelemetry(), hostTelemetry[teamKey], telemetryData);
    }
    renderHostPingIndicators();
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
      window.GiaiMaTeacherKey.renderLiveQuizCards();
    }
  }

  function ingestBulkTelemetry(telemetryMap, serverTime) {
    if (typeof serverTime === 'number' && serverTime > 0) {
      serverTimeOffsetMs = serverTime - Date.now();
    }
    if (telemetryMap) {
      if (telemetryMap.teamA) {
        hostTelemetry.teamA = Object.assign(createDefaultTelemetry(), telemetryMap.teamA);
      }
      if (telemetryMap.teamB) {
        hostTelemetry.teamB = Object.assign(createDefaultTelemetry(), telemetryMap.teamB);
      }
    }
    renderHostPingIndicators();
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
      window.GiaiMaTeacherKey.renderLiveQuizCards();
    }
  }

  function renderHostPingIndicators() {
    if (isStudentClient) return;
    const nowServerEst = Date.now() + serverTimeOffsetMs;
    const connectedMap = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getConnectedTeams === 'function')
      ? window.GiaiMaBiMat.getConnectedTeams()
      : { teamA: false, teamB: false };

    ['teamA', 'teamB'].forEach(tKey => {
      const letter = tKey === 'teamA' ? 'A' : 'B';
      const teamLabel = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamName === 'function')
        ? window.GiaiMaBiMat.getTeamName(tKey)
        : (tKey === 'teamA' ? 'Đội 1' : 'Đội 2');
      const el = document.getElementById(`gmmLivePingTeam${letter}`);
      if (!el) return;

      const t = hostTelemetry[tKey] || createDefaultTelemetry();
      const isConnected = Boolean(connectedMap && connectedMap[tKey]);
      const hasLivePing = t.lastPingAt > 0;
      const ageMs = hasLivePing ? Math.max(0, nowServerEst - t.lastPingAt) : 0;

      if (!isConnected) {
        el.className = 'gmm-live-ping-bar waiting';
        el.innerHTML = `
          <span class="gmm-live-ping-dot"></span>
          <span class="gmm-live-ping-text">${teamLabel}: Chưa kết nối điện thoại (Chờ quét QR)</span>
        `;
        return;
      }

      if (!hasLivePing) {
        el.className = 'gmm-live-ping-bar online';
        el.innerHTML = `
          <span class="gmm-live-ping-dot"></span>
          <span class="gmm-live-ping-text">${teamLabel}: <strong>Đã vào phòng chờ</strong> • Đang chờ bắt đầu</span>
        `;
        return;
      }

      if (t.screenState === 'hidden') {
        el.className = 'gmm-live-ping-bar screen-off';
        el.innerHTML = `
          <span class="gmm-live-ping-dot"></span>
          <span class="gmm-live-ping-text">🌙 ${teamLabel}: Đang tắt màn hình / Ẩn Zalo</span>
        `;
        return;
      }

      if (ageMs > STALE_THRESHOLD_MS) {
        const secAgo = Math.min(99, Math.round(ageMs / 1000));
        el.className = 'gmm-live-ping-bar stale';
        el.innerHTML = `
          <span class="gmm-live-ping-dot"></span>
          <span class="gmm-live-ping-text">⚠️ ${teamLabel}: Chờ nhịp phản hồi (${secAgo}s) • Có thể tắt màn hình</span>
        `;
        return;
      }

      // Trạng thái kết nối trực tiếp, màn hình đang sáng
      let detail = 'Đang ở phòng chờ • Sẵn sàng';
      if (t.currentPage === 'lobby') {
        detail = 'Đang ở phòng chờ • Sẵn sàng';
      } else if (t.currentPage === 'locked' || t.isLocked) {
        detail = `Đã nộp bài (${t.answeredCount}/10 câu)`;
      } else if (t.currentPage === 'decrypt') {
        detail = 'Đang mở khung Tô & Chụp tranh';
      } else if (t.currentPage === 'quiz') {
        detail = `Đang làm Câu ${t.currentQ}/10`;
      }

      const wakeIcon = t.wakeLockActive
        ? '<span class="gmm-live-wake-tag" title="Điện thoại đang bật Giữ sáng màn hình & Khóa chống thoát">☀️ Giữ sáng</span>'
        : '';

      el.className = 'gmm-live-ping-bar online';
      el.innerHTML = `
        <span class="gmm-live-ping-dot"></span>
        <span class="gmm-live-ping-text">${teamLabel}: <strong>Đang mở màn hình</strong> • ${detail}</span>
        ${wakeIcon}
      `;
    });
  }

  function startHostWatchdog() {
    if (hostWatchdogTimer) clearInterval(hostWatchdogTimer);
    renderHostPingIndicators();
    hostWatchdogTimer = setInterval(() => {
      if (!isStudentClient) {
        renderHostPingIndicators();
      }
    }, 2000);
  }

  async function unlockSingleTeam(teamKey) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    const otherKey = teamKey === 'teamA' ? 'teamB' : 'teamA';
    const teamName = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamName === 'function')
      ? window.GiaiMaBiMat.getTeamName(teamKey, 'full')
      : (teamKey === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)');
    const otherName = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamName === 'function')
      ? window.GiaiMaBiMat.getTeamName(otherKey, 'full')
      : (teamKey === 'teamA' ? 'Đội 2 (Đội B)' : 'Đội 1 (Đội A)');

    const answeredCount = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamAnsweredCount === 'function')
      ? window.GiaiMaBiMat.getTeamAnsweredCount(teamKey)
      : 0;

    const ok = confirm(
      `🔓 MỞ KHÓA RIÊNG CHO ${teamName.toUpperCase()}?\n\n` +
      `• ${teamName} hiện đã chọn ${answeredCount}/10 câu và sẽ được mở khóa để tiếp tục làm bài trên điện thoại.\n` +
      `• Các đáp án ${teamName} đã chọn được GIỮ NGUYÊN 100%.\n` +
      `• ${otherName} hoàn toàn KHÔNG bị ảnh hưởng.`
    );
    if (!ok) return;

    try {
      const res = await fetch('/api/gmm/unlock-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamKey })
      });
      const json = res ? await res.json().catch(() => ({})) : {};

      if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.applyTeamUnlockOnHost === 'function') {
        window.GiaiMaBiMat.applyTeamUnlockOnHost(teamKey, json.answers || null);
      }

      if (hostTelemetry[teamKey]) {
        hostTelemetry[teamKey].isLocked = false;
        hostTelemetry[teamKey].currentPage = 'quiz';
        renderHostPingIndicators();
      }

      if (typeof window.showToast === 'function') {
        window.showToast(`🔓 Đã mở khóa riêng cho ${teamName}! Điện thoại của đội đã mở lại câu hỏi để làm tiếp.`, 'success');
      }
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast(`⚠️ Không thể gửi lệnh mở khóa ${teamName}. Vui lòng kiểm tra kết nối máy chủ!`, 'error');
      }
    }
  }

  // Tự động khởi chạy bộ giám sát nhịp tim trên màn hình Giáo viên
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!document.body.classList.contains('gmm-student-mode')) {
        startHostWatchdog();
      }
    });
  } else if (!document.body.classList.contains('gmm-student-mode')) {
    startHostWatchdog();
  }

  window.GiaiMaLiveMonitor = {
    getMobileClientId,
    initStudentMonitor,
    sendMobilePing,
    notifyMobileLeave,
    activateHybridWakeLock,
    toggleMobileShield,
    stayInArena,
    confirmIntentionalExit,
    getHostTeamTelemetry,
    handleTeamDisconnected,
    kickTeamConnection,
    ingestServerTelemetry,
    ingestBulkTelemetry,
    renderHostPingIndicators,
    unlockSingleTeam
  };
})();
