/**
 * ==============================================================================
 * MODULE ĐIỆN THOẠI HỌC SINH & ĐỒNG BỘ SSE CHỐNG RỚT MẠNG (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmMobileSync.js
 * Trách nhiệm: Giao diện Mobile Arena (trả lời 10 câu, vuốt chạm, tô màu SVG,
 * chụp ảnh tác phẩm giấy) + hàng đợi chống mất mạng & tái đồng bộ SSE timer.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmMobileSync = {
    create: function (ctx) {
      const {
        gameState,
        requestScreenWakeLock,
        formatMinutesSeconds,
        updateAllTeamNamesUI,
        runCountdownAnimation,
        generateSvgPuzzle,
        compressImageClient,
        renderTransformedCanvas
      } = ctx;

      let wasMobileInLobby = true;
      let mobileCapturedPhotoData = null;
      let mobileOriginalPhotoData = null;
      let mobileEnhancedPhotoData = null;
      let mobilePhotoRotation = 0;
      let mobilePhotoTilt = 0;
      let isMobileAiEnhanced = true;

      function resetMobilePhotoState() {
        mobileCapturedPhotoData = null;
        mobileOriginalPhotoData = null;
        mobileEnhancedPhotoData = null;
        mobilePhotoRotation = 0;
        mobilePhotoTilt = 0;
        isMobileAiEnhanced = true;
      }

  // Cập nhật tình trạng kết nối 2 đội hiển thị trên màn hình phòng chờ điện thoại
  function updateMobileLobbyTeamsStatus(connectedTeams) {
    if (!connectedTeams) return;
    const itemA = document.getElementById('gmmMobLobbyStatusTeamA');
    const itemB = document.getElementById('gmmMobLobbyStatusTeamB');
    if (itemA) {
      if (connectedTeams.teamA) {
        itemA.className = 'gmm-mob-team-item ready';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemA.className = 'gmm-mob-team-item waiting';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
    if (itemB) {
      if (connectedTeams.teamB) {
        itemB.className = 'gmm-mob-team-item ready';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemB.className = 'gmm-mob-team-item waiting';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
  }

  let mobileSessionId = null;
  let mobileSyncPollInterval = null;
  let studentSseSource = null;
  let isMobileLifecycleBound = false;
  let lastMobileStateFingerprint = '';
  let lastMobileJoinAnnounceAt = 0;

  function announceMobileJoinToServer(teamKey, force = false) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    const tKey = teamKey || ctx.getStudentTeamKey();
    if (tKey !== 'teamA' && tKey !== 'teamB') return;
    const now = Date.now();
    if (!force && now - lastMobileJoinAnnounceAt < 3000) return;
    lastMobileJoinAnnounceAt = now;

    try {
      fetch('/api/gmm/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: tKey })
      }).catch(() => {});
    } catch (_e) {}
  }

  function startMobileStatePolling() {
    if (mobileSyncPollInterval) {
      clearInterval(mobileSyncPollInterval);
    }
    // Kênh đồng bộ kép (Polling 2.5s dự phòng cho Zalo WebView khi SSE bị đóng băng chạy ngầm)
    mobileSyncPollInterval = setInterval(() => {
      if (ctx.isStudentMobile()) {
        fetchCurrentServerState(true);
      }
    }, 2500);
  }

  function bindMobileLifecycleSync() {
    if (isMobileLifecycleBound || typeof window === 'undefined') return;
    isMobileLifecycleBound = true;

    const handleWakeOrFocus = () => {
      if (!ctx.isStudentMobile()) return;
      if (!studentSseSource || studentSseSource.readyState === 2) {
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
    if (!studentSseSource || studentSseSource.readyState === 2) {
      connectStudentSSE();
    }
    await fetchCurrentServerState(false);
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã đồng bộ trạng thái mới nhất từ máy chiếu!', 'success');
    }
  }

  // Khởi tạo Giao diện Thi đấu dành cho Học sinh trên Điện thoại (Student Mobile Arena)
  async function initStudentMobileArena(teamKey) {
    ctx.setStudentMobile(true, teamKey);

    // Kích hoạt chế độ cô lập điện thoại học sinh
    document.documentElement.classList.add('gmm-student-mode');
    document.body.classList.add('gmm-student-mode');

    const arena = document.getElementById('gmmStudentArena');
    if (!arena) return;

    arena.classList.add('active');

    // Cập nhật thông tin nhận diện Đội
    const tag = document.getElementById('gmmMobTeamTag');
    const icon = document.getElementById('gmmMobTeamIcon');
    const name = document.getElementById('gmmMobTeamName');
    const lobbyTitle = document.getElementById('gmmMobLobbyTeamTitle');
    const lobbySymbol = document.getElementById('gmmMobLobbySymbolTitle');
    const lobbyRoom = document.getElementById('gmmMobLobbyRoomCode');

    if (lobbyRoom) lobbyRoom.textContent = gameState.roomCode || '2011-THCS';

    const currentTeamName = (teamKey === 'teamA') ? (gameState.teamA?.name || 'ĐOÀN KẾT') : (gameState.teamB?.name || 'LA BÀN TUỔI TRẺ');
    const teamNumStr = teamKey === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';

    if (teamKey === 'teamA') {
      if (tag) tag.className = 'gmm-mob-team-tag team-a';
      if (icon) icon.textContent = '🔴';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔴 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Ngôi trường hạnh phúc không bạo lực"';
    } else {
      if (tag) tag.className = 'gmm-mob-team-tag team-b';
      if (icon) icon.textContent = '🔵';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔵 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Trái tim thấu cảm – Tự tin tỏa sáng"';
    }

    // Khôi phục dữ liệu tạm từ LocalStorage trước, sau đó kiểm tra đối chiếu sessionId với máy chủ
    loadMobileAnswersFromLocal();

    // Báo cho Server biết đội đã vào phòng thi
    announceMobileJoinToServer(teamKey, true);

    // Kết nối SSE + Kênh Polling dự phòng 2.5s + Tự đồng bộ khi mở lại màn hình Zalo WebView
    connectStudentSSE();
    bindMobileLifecycleSync();
    startMobileStatePolling();

    // Tự động kích hoạt Wake Lock giữ sáng màn hình + Khóa chống thoát trang + Phát nhịp tim Live Ping
    requestScreenWakeLock();
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.initStudentMonitor === 'function') {
      window.GiaiMaLiveMonitor.initStudentMonitor(teamKey);
    }

    // Lấy trạng thái chuẩn xác từ máy chủ TRƯỚC (để tự xóa kết quả cũ nếu Thầy/Cô đã tạo ván mới)
    await fetchCurrentServerState(false);

    // Chỉ gửi bù hàng đợi offline nếu vẫn thuộc cùng phiên thi đấu đang chạy
    if (mobilePendingSyncQueue.length > 0 && !mobileIsLocked) {
      flushPendingSyncQueue();
    }
  }

  function getMobileTelemetrySnapshot() {
    const paintView = document.getElementById('gmmMobPaintView');
    const lobbyView = document.getElementById('gmmMobLobbyView');
    let currentPage = 'quiz';
    if (paintView && paintView.style.display !== 'none') {
      currentPage = 'decrypt';
    } else if (wasMobileInLobby || (lobbyView && lobbyView.style.display !== 'none')) {
      currentPage = 'lobby';
    } else if (mobileIsLocked) {
      currentPage = 'locked';
    }
    return {
      currentPage,
      currentQ: (typeof mobileActiveQIndex === 'number' ? mobileActiveQIndex : 0) + 1,
      answeredCount: Object.keys(mobileTeamAnswers || {}).length,
      isLocked: Boolean(mobileIsLocked)
    };
  }

  function jumpMobileToFirstUnanswered() {
    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      const qId = list[i].id;
      if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
        mobileActiveQIndex = i;
        return;
      }
    }
  }

  async function fetchCurrentServerState(isBackgroundPoll = false) {
    try {
      const res = await fetch('/api/gmm/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state) {
          const statusPill = document.getElementById('gmmMobStatusPill');
          const statusText = document.getElementById('gmmMobStatusText');
          if (statusPill && statusPill.classList.contains('offline') && mobilePendingSyncQueue.length === 0) {
            statusPill.className = 'gmm-mob-status-pill';
            if (statusText) statusText.textContent = 'Đã kết nối máy chiếu';
          }
          applyServerStateToMobile(json.state, isBackgroundPoll);
        }
      }
    } catch (_e) {}
  }

  let mobileQuestionsList = [];
  let mobileActiveQIndex = 0;
  let mobileTeamAnswers = {};
  let mobileIsLocked = false;
  let mobileFinishTimeFormatted = '';
  let mobileFinishTimeSeconds = 0;
  let mobileTotalSeconds = 300;
  let mobileRemainingSeconds = 300;
  let mobileTimerInterval = null;

  function startMobileTimer(sec, totalSec) {
    if (typeof sec === 'number') mobileRemainingSeconds = sec;
    if (typeof totalSec === 'number') mobileTotalSeconds = totalSec;

    clearInterval(mobileTimerInterval);
    updateMobileTimerUI();

    mobileTimerInterval = setInterval(() => {
      if (mobileRemainingSeconds > 0) {
        mobileRemainingSeconds--;
        updateMobileTimerUI();

        if (mobileRemainingSeconds <= 10 && mobileRemainingSeconds > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(mobileRemainingSeconds);
          }
        }

        if (mobileRemainingSeconds === 0) {
          clearInterval(mobileTimerInterval);
          autoLockMobileTeam();
        }
      }
    }, 1000);
  }

  function updateMobileTimerUI() {
    const timerNum = document.getElementById('gmmMobTimerNum');
    const progressBar = document.getElementById('gmmMobTimerProgressBar');
    if (timerNum) {
      timerNum.textContent = formatMinutesSeconds(mobileRemainingSeconds);
      if (mobileRemainingSeconds <= 30) {
        timerNum.style.color = '#ef4444';
      } else {
        timerNum.style.color = '#10b981';
      }
    }
    if (progressBar) {
      const total = mobileTotalSeconds || 300;
      const pct = Math.max(0, Math.min(100, (mobileRemainingSeconds / total) * 100));
      progressBar.style.width = pct + '%';
      if (mobileRemainingSeconds <= 30) {
        progressBar.classList.add('danger');
      } else {
        progressBar.classList.remove('danger');
      }
    }
  }

  // Quản lý đồng hồ đếm ngược Tô Màu & Giải Mã Tranh trên điện thoại học sinh (Tab 4)
  let mobileDecryptRemainingSeconds = 180;
  let mobileDecryptTotalSeconds = 180;
  let mobileIsDecryptTimerRunning = false;
  let mobileDecryptTimerInterval = null;

  function stopMobileDecryptTicker() {
    if (mobileDecryptTimerInterval) {
      clearInterval(mobileDecryptTimerInterval);
      mobileDecryptTimerInterval = null;
    }
  }

  function syncMobileDecryptTimer(remainingSec, totalSec, isRunning) {
    if (typeof remainingSec === 'number' && !Number.isNaN(remainingSec)) {
      mobileDecryptRemainingSeconds = Math.max(0, remainingSec);
    }
    if (typeof totalSec === 'number' && totalSec > 0) {
      mobileDecryptTotalSeconds = totalSec;
    }
    if (typeof isRunning === 'boolean') {
      mobileIsDecryptTimerRunning = isRunning;
    }

    updateMobileDecryptTimerUI();

    if (mobileIsDecryptTimerRunning && mobileDecryptRemainingSeconds > 0) {
      if (!mobileDecryptTimerInterval) {
        mobileDecryptTimerInterval = setInterval(() => {
          if (!mobileIsDecryptTimerRunning) {
            stopMobileDecryptTicker();
            return;
          }
          if (mobileDecryptRemainingSeconds > 0) {
            mobileDecryptRemainingSeconds--;
            updateMobileDecryptTimerUI();
          }
          if (mobileDecryptRemainingSeconds <= 0) {
            mobileIsDecryptTimerRunning = false;
            stopMobileDecryptTicker();
            updateMobileDecryptTimerUI();
          }
        }, 1000);
      }
    } else {
      stopMobileDecryptTicker();
    }
  }

  function updateMobileDecryptTimerUI() {
    const totalSec = Math.max(0, mobileDecryptRemainingSeconds || 0);
    const totalDuration = Math.max(1, mobileDecryptTotalSeconds || 180);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const percent = Math.min(100, Math.max(0, Math.round((totalSec / totalDuration) * 100)));

    const digitsEl = document.getElementById('gmmMobDecTimerDigits');
    const fillEl = document.getElementById('gmmMobDecProgressFill');
    const badgeEl = document.getElementById('gmmMobDecTimerBadge');
    const statusEl = document.getElementById('gmmMobDecTimerStatus');
    const tipEl = document.getElementById('gmmMobDecTimerTip');
    const percentEl = document.getElementById('gmmMobDecTimerPercent');

    if (digitsEl) digitsEl.textContent = timeStr;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;

    let colorClass = 'normal-green';
    let badgeClass = 'normal';

    if (totalSec === 0) {
      colorClass = 'time-up';
      badgeClass = 'done';
      if (statusEl) statusEl.textContent = '🎉 HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = '📸 Hết giờ! Hãy chụp ảnh tranh gửi lên máy chiếu!';
    } else if (!mobileIsDecryptTimerRunning) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏸️ TẠM DỪNG ĐỒNG HỒ';
      if (tipEl) tipEl.textContent = 'Thầy/Cô đang tạm dừng đếm ngược trên máy chiếu.';
    } else if (totalSec <= 10) {
      colorClass = 'urgent-red';
      badgeClass = 'urgent';
      if (statusEl) statusEl.textContent = '🔥 10 GIÂY CUỐI CÙNG!';
      if (tipEl) tipEl.textContent = 'Khẩn trương hoàn tất những nét tô màu cuối!';

      // Rung phản hồi xúc giác (Haptic) khi còn đúng 5, 3, 1 giây
      if ((totalSec === 5 || totalSec === 3 || totalSec === 1) && navigator.vibrate) {
        try { navigator.vibrate([120, 60, 120]); } catch (_) {}
      }
    } else if (totalSec <= 30) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏳ SẮP HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = 'Thời gian sắp hết, hai đội tập trung tăng tốc!';
    } else {
      colorClass = 'normal-green';
      badgeClass = 'normal';
      if (statusEl) statusEl.textContent = '⏱️ ĐANG ĐẾM NGƯỢC TÔ TRANH';
      if (tipEl) tipEl.textContent = '⚡ Hai đội đối chiếu tọa độ và tô màu lên tranh!';
    }

    if (digitsEl) digitsEl.className = `gmm-mob-dec-timer-digits ${colorClass}`;
    if (fillEl) fillEl.className = `gmm-mob-dec-progress-fill ${colorClass}`;
    if (badgeEl) badgeEl.className = `gmm-mob-dec-timer-badge ${badgeClass}`;
  }

  function updateMobileFinishArtworkUI(teamState) {
    const finishBtn = document.getElementById('gmmMobBtnFinishArtwork');
    const finishBadge = document.getElementById('gmmMobFinishSuccessBadge');
    const finishSub = document.getElementById('gmmMobFinishBadgeSub');
    if (teamState && teamState.isArtworkFinished) {
      if (finishBtn) finishBtn.style.display = 'none';
      if (finishBadge) finishBadge.style.display = 'block';
      if (finishSub) {
        const fTime = teamState.artworkFinishTime || '02:00';
        const sBonus = teamState.speedBonus || 2;
        finishSub.textContent = `⏱️ Thời gian: ${fTime} • Nhận +${sBonus} điểm thưởng tốc độ!`;
      }
    } else {
      if (finishBtn) finishBtn.style.display = 'flex';
      if (finishBadge) finishBadge.style.display = 'none';
    }
  }

  // Học sinh bấm nút "Báo Cáo Đã Tô Xong Sớm" từ điện thoại để nhận điểm thưởng tốc độ
  function reportArtworkFinishedFromMobile() {
    const teamData = gameState[ctx.getStudentTeamKey()];
    if (teamData && teamData.isArtworkFinished) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ Đội em đã báo cáo hoàn thành tranh trước đó rồi!', 'info');
      }
      return;
    }

    const ok = confirm(
      '🎉 XÁC NHẬN BÁO CÁO ĐÃ TÔ XONG TRANH GIẤY A1!\n\n' +
      'Đội em đã hoàn thiện toàn bộ các mảng màu trên tờ tranh giấy A1 của đội mình chưa?\n\n' +
      '(Hệ thống sẽ ghi nhận mốc thời gian hoàn thành sớm để tính điểm thưởng tốc độ +2 điểm!)'
    );
    if (!ok) return;

    const totalSec = Math.max(1, mobileDecryptTotalSeconds || 180);
    const remSec = Math.max(0, mobileDecryptRemainingSeconds || 0);
    const elapsed = Math.max(0, totalSec - remSec);
    const finishTimeStr = formatMinutesSeconds(elapsed);
    const speedBonus = remSec > 0 ? 2 : 0;

    if (teamData) {
      teamData.completed = true;
      teamData.isArtworkFinished = true;
      teamData.artworkFinishTime = finishTimeStr;
      teamData.artworkFinishSeconds = elapsed;
      teamData.speedBonus = speedBonus;
      teamData.bonusScore = (teamData.bonusScore || 0) + speedBonus;
    }

    // Cập nhật giao diện trên điện thoại ngay lập tức
    const btn = document.getElementById('gmmMobBtnFinishArtwork');
    const badge = document.getElementById('gmmMobFinishSuccessBadge');
    const sub = document.getElementById('gmmMobFinishBadgeSub');
    if (btn) btn.style.display = 'none';
    if (badge) badge.style.display = 'block';
    if (sub) {
      sub.textContent = speedBonus > 0
        ? `⏱️ Thời gian: ${finishTimeStr} • Nhận +${speedBonus} điểm thưởng tốc độ!`
        : `⏱️ Thời gian: ${finishTimeStr} • Đã hoàn thành tranh!`;
    }

    // Bắn pháo hoa Confetti ăn mừng trên điện thoại
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, zIndex: 99999 });
      } catch (_) {}
    }
    if (navigator.vibrate) {
      try { navigator.vibrate([120, 60, 120, 60, 240]); } catch (_) {}
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 XUẤT SẮC! Đã báo cáo hoàn thành tranh sớm (⏱️ ${finishTimeStr}, +${speedBonus}đ tốc độ)!`, 'success');
    }

    // Gửi báo cáo lên máy chủ
    fetch('/api/gmm/finish-artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: ctx.getStudentTeamKey(),
        finishTime: finishTimeStr,
        finishSeconds: elapsed,
        remainingSeconds: remSec,
        speedBonus: speedBonus
      })
    }).catch(() => {});
  }

  let mobileAutoAdvanceTimer = null;
  let isMobileSwipeBound = false;
  let isMobileReviewMode = false;
  let mobileAudioCtx = null;
  let mobilePendingSyncQueue = [];

  // Âm thanh "Ting" vui nhộn ngay trên loa điện thoại (Web Audio API Synthesizer)
  function playMobileTingSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!mobileAudioCtx) {
        mobileAudioCtx = new AudioCtx();
      }
      if (mobileAudioCtx.state === 'suspended') {
        mobileAudioCtx.resume().catch(() => {});
      }
      const now = mobileAudioCtx.currentTime;

      // Nốt 1: E6 (1318.5 Hz)
      const osc1 = mobileAudioCtx.createOscillator();
      const gain1 = mobileAudioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(mobileAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nốt 2 lấp lánh vui nhộn: B6 (1975.5 Hz) sau 0.05s
      const osc2 = mobileAudioCtx.createOscillator();
      const gain2 = mobileAudioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.5, now + 0.05);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(mobileAudioCtx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.45);
    } catch (_e) {}
  }

  // Quản lý lưu trữ Offline-first & Hàng đợi đồng bộ bù khi mất Wi-Fi
  function getMobileStorageKey(subKey) {
    return `gmm_mob_${ctx.getStudentTeamKey() || 'team'}_${subKey}`;
  }

  function saveMobileAnswersToLocal() {
    try {
      localStorage.setItem(getMobileStorageKey('answers'), JSON.stringify(mobileTeamAnswers));
      if (mobileIsLocked) {
        localStorage.setItem(getMobileStorageKey('locked'), '1');
      } else {
        localStorage.removeItem(getMobileStorageKey('locked'));
      }
      if (mobileFinishTimeFormatted) {
        localStorage.setItem(getMobileStorageKey('finishTime'), mobileFinishTimeFormatted);
      } else {
        localStorage.removeItem(getMobileStorageKey('finishTime'));
      }
      if (mobileSessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), String(mobileSessionId));
      }
    } catch (_e) {}
  }

  function loadMobileAnswersFromLocal() {
    try {
      const savedSession = localStorage.getItem(getMobileStorageKey('sessionId'));
      if (savedSession) {
        mobileSessionId = String(savedSession);
      }
      const saved = localStorage.getItem(getMobileStorageKey('answers'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          mobileTeamAnswers = Object.assign({}, parsed, mobileTeamAnswers);
        }
      }
      if (localStorage.getItem(getMobileStorageKey('locked')) === '1') {
        mobileIsLocked = true;
      }
      const savedFinishTime = localStorage.getItem(getMobileStorageKey('finishTime'));
      if (savedFinishTime) {
        mobileFinishTimeFormatted = savedFinishTime;
      }
      const queueSaved = localStorage.getItem(getMobileStorageKey('syncQueue'));
      if (queueSaved) {
        const queueParsed = JSON.parse(queueSaved);
        if (Array.isArray(queueParsed)) {
          mobilePendingSyncQueue = queueParsed;
        }
      }
    } catch (_e) {}
  }

  // Xóa sạch toàn bộ dữ liệu ván cũ (RAM + LocalStorage + Giao diện Khóa bài) trên điện thoại học sinh
  function resetMobileClientState(newSessionId) {
    clearInterval(mobileTimerInterval);
    mobileTimerInterval = null;
    stopMobileDecryptTicker();
    mobileIsDecryptTimerRunning = false;
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    mobileActiveQIndex = 0;
    mobileTeamAnswers = {};
    mobileIsLocked = false;
    mobileFinishTimeFormatted = '';
    mobileFinishTimeSeconds = 0;
    isMobileReviewMode = false;
    mobilePendingSyncQueue = [];
    lastMobileStateFingerprint = '';

    mobileCapturedPhotoData = null;
    mobileOriginalPhotoData = null;
    mobileEnhancedPhotoData = null;
    mobilePhotoRotation = 0;
    mobilePhotoTilt = 0;
    isMobileAiEnhanced = true;

    if (newSessionId) {
      mobileSessionId = String(newSessionId);
    }

    try {
      localStorage.removeItem(getMobileStorageKey('answers'));
      localStorage.removeItem(getMobileStorageKey('locked'));
      localStorage.removeItem(getMobileStorageKey('finishTime'));
      localStorage.removeItem(getMobileStorageKey('finishSeconds'));
      localStorage.removeItem(getMobileStorageKey('syncQueue'));
      if (mobileSessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), mobileSessionId);
      } else {
        localStorage.removeItem(getMobileStorageKey('sessionId'));
      }
    } catch (_e) {}

    // Đóng tất cả thẻ kết quả cũ, modal câu sai và thông báo tải ảnh của ván trước
    closeMistakesReviewModal();
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeScanner === 'function') {
      try { window.GiaiMaArtworkScanner.closeScanner(); } catch (_e) {}
    }

    const lockedCard = document.getElementById('gmmMobLockedSuccessCard');
    if (lockedCard) lockedCard.style.display = 'none';

    const stage = document.getElementById('gmmMobQuestionStage');
    if (stage) stage.style.display = 'block';

    const btnReviewText = document.getElementById('gmmMobBtnReviewText');
    if (btnReviewText) btnReviewText.textContent = '👁️ Lướt xem chi tiết từng câu hỏi';

    const finishBadge = document.getElementById('gmmMobFinishTimeBadge');
    if (finishBadge) finishBadge.style.display = 'none';

    const previewWrap = document.getElementById('gmmMobPhotoPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';

    document.querySelectorAll('.gmm-mob-upload-success').forEach(el => {
      el.style.display = 'none';
    });

    updateSyncStatusBadge();
    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');
  }

  function addToPendingSyncQueue(questionId, optionIdx) {
    const existing = mobilePendingSyncQueue.find(item => item.questionId === questionId);
    if (existing) {
      existing.optionIdx = optionIdx;
      existing.sessionId = mobileSessionId;
      existing.timestamp = Date.now();
    } else {
      mobilePendingSyncQueue.push({
        questionId,
        optionIdx,
        sessionId: mobileSessionId,
        timestamp: Date.now()
      });
    }
    try {
      localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobilePendingSyncQueue));
    } catch (_e) {}
    updateSyncStatusBadge();
  }

  async function flushPendingSyncQueue() {
    if (mobilePendingSyncQueue.length === 0) return;
    const items = [...mobilePendingSyncQueue];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.sessionId && mobileSessionId && String(item.sessionId) !== String(mobileSessionId)) {
        mobilePendingSyncQueue = mobilePendingSyncQueue.filter(q => q !== item);
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
            sessionId: mobileSessionId
          })
        });
        if (res.ok) {
          mobilePendingSyncQueue = mobilePendingSyncQueue.filter(q => q.questionId !== item.questionId);
          try {
            localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobilePendingSyncQueue));
          } catch (_e) {}
        } else if (res.status === 409) {
          const errJson = await res.json().catch(() => ({}));
          if (errJson && errJson.staleSession) {
            resetMobileClientState(errJson.currentSessionId);
            if (errJson.state) applyServerStateToMobile(errJson.state, false);
            return;
          }
          mobilePendingSyncQueue = [];
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

    if (mobilePendingSyncQueue.length > 0) {
      statusPill.className = 'gmm-mob-status-pill offline';
      statusText.textContent = `Lưu tạm (${mobilePendingSyncQueue.length} câu chờ Wi-Fi)`;
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

  // Bật / tắt chế độ xem lại 10 câu hỏi sau khi đã nộp bài
  function toggleReviewQuestions() {
    isMobileReviewMode = !isMobileReviewMode;
    const stage = document.getElementById('gmmMobQuestionStage');
    const btnText = document.getElementById('gmmMobBtnReviewText');
    if (stage) {
      stage.style.display = isMobileReviewMode ? 'block' : 'none';
    }
    if (btnText) {
      btnText.textContent = isMobileReviewMode ? '🔼 Thu gọn danh sách câu hỏi' : '👁️ Lướt xem chi tiết từng câu hỏi';
    }
    if (isMobileReviewMode) {
      renderCurrentMobileQuestion();
    }
  }

  // ==================== XEM LẠI CÂU SAI & ĐÁP ÁN CHUẨN TRÊN ĐIỆN THOẠI ====================
  let mistakesFilterType = 'all'; // 'all' | 'wrong' | 'correct'

  function openMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'flex';
    mistakesFilterType = 'all';
    renderMistakesReviewList();
  }

  function closeMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function filterMistakesView(type) {
    mistakesFilterType = type || 'all';
    renderMistakesReviewList();
  }

  function renderMistakesReviewList() {
    const listEl = document.getElementById('gmmMobMistakesList');
    const subtitleEl = document.getElementById('gmmMobMistakesSubtitle');
    const tabAll = document.getElementById('gmmFilterAll');
    const tabWrong = document.getElementById('gmmFilterWrong');
    const tabCorrect = document.getElementById('gmmFilterCorrect');
    if (!listEl) return;

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    const letters = ['A', 'B', 'C', 'D'];

    let correctCount = 0;
    let wrongCount = 0;

    list.forEach((q) => {
      const myAns = mobileTeamAnswers[q.id];
      if (myAns === q.correct) correctCount++;
      else wrongCount++;
    });

    if (subtitleEl) {
      subtitleEl.textContent = `Đội em làm đúng ${correctCount}/${list.length} câu (${Math.round((correctCount / list.length) * 100)}%) • Sai ${wrongCount} câu`;
    }

    if (tabAll) {
      tabAll.textContent = `Tất cả (${list.length})`;
      tabAll.classList.toggle('active', mistakesFilterType === 'all');
    }
    if (tabWrong) {
      tabWrong.textContent = `❌ Câu sai (${wrongCount})`;
      tabWrong.classList.toggle('active', mistakesFilterType === 'wrong');
    }
    if (tabCorrect) {
      tabCorrect.textContent = `✅ Câu đúng (${correctCount})`;
      tabCorrect.classList.toggle('active', mistakesFilterType === 'correct');
    }

    const filtered = list.filter((q) => {
      const myAns = mobileTeamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      if (mistakesFilterType === 'wrong') return !isCorrect;
      if (mistakesFilterType === 'correct') return isCorrect;
      return true;
    });

    if (filtered.length === 0) {
      if (mistakesFilterType === 'wrong') {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #34d399;">
            <div style="font-size: 2.4rem; margin-bottom: 8px;">🎉</div>
            <div style="font-size: 1.05rem; font-weight: 800;">Tuyệt vời! Đội em không làm sai câu nào!</div>
            <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 6px;">Toàn bộ ${list.length} câu trắc nghiệm của đội em đều chính xác hoàn hảo.</div>
          </div>
        `;
      } else {
        listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #94a3b8;">Không có câu hỏi nào trong danh mục này.</div>`;
      }
      return;
    }

    listEl.innerHTML = filtered.map((q) => {
      const origIdx = list.findIndex(item => item.id === q.id);
      const qNumber = origIdx !== -1 ? origIdx + 1 : q.id;
      const myAns = mobileTeamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      const hasAns = (myAns !== undefined && myAns !== null);

      const myAnsLetter = hasAns ? letters[myAns] : '';
      const myAnsText = hasAns && q.options[myAns] ? q.options[myAns] : 'Chưa chọn đáp án';
      const correctLetter = letters[q.correct];
      const correctText = q.options[q.correct];
      const coordName = q.coordinate || `Ô số ${qNumber}`;

      return `
        <div class="gmm-mob-mistake-card ${isCorrect ? 'correct' : 'wrong'}">
          <div class="gmm-mob-mistake-qnum">
            <span style="color: ${isCorrect ? '#34d399' : '#f87171'};">CÂU HỎI ${qNumber}/${list.length}</span>
            <span style="font-size: 0.76rem; font-weight: 800; color: ${isCorrect ? '#34d399' : '#f87171'};">
              ${isCorrect ? '✅ ĐÃ LÀM ĐÚNG' : '❌ CHƯA ĐÚNG'}
            </span>
          </div>
          <div class="gmm-mob-mistake-qtext">${q.question}</div>

          <!-- Phương án đội em đã chọn -->
          <div class="gmm-mob-mistake-answer-row my-ans ${isCorrect ? 'correct' : 'wrong'}">
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 2px;">
              👉 Lựa chọn của Đội em:
            </div>
            <div>
              <strong>[${myAnsLetter || '?'}]</strong> ${myAnsText}
              ${isCorrect ? ' <span style="color: #34d399; font-weight: 800;">(+1 Điểm)</span>' : ' <span style="color: #ef4444; font-weight: 800;">(Sai)</span>'}
            </div>
          </div>

          <!-- Đáp án chuẩn của Thầy/Cô -->
          ${!isCorrect ? `
            <div class="gmm-mob-mistake-answer-row correct-ans">
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #34d399; margin-bottom: 2px;">
                ✨ Đáp án chuẩn của Thầy/Cô:
              </div>
              <div>
                <strong>[${correctLetter}]</strong> ${correctText}
              </div>
            </div>
          ` : ''}

          <div class="gmm-mob-mistake-coord">
            <span>🎯 Tọa độ mở khóa bảng giấy A1: <strong>${coordName}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render thẻ chúc mừng và danh sách các toạ độ mở khóa
  function renderLockedSuccessCard() {
    const card = document.getElementById('gmmMobLockedSuccessCard');
    const chipsWrap = document.getElementById('gmmMobUnlockedCoordsList');
    if (!card) return;

    if (!mobileIsLocked) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';

    // Cập nhật nhãn thời gian hoàn thành trên điện thoại
    const timeBadge = document.getElementById('gmmMobFinishTimeBadge');
    const timeVal = document.getElementById('gmmMobFinishTimeVal');
    if (timeBadge && timeVal) {
      if (mobileFinishTimeFormatted) {
        timeVal.textContent = mobileFinishTimeFormatted;
        timeBadge.style.display = 'inline-flex';
      } else {
        timeBadge.style.display = 'none';
      }
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    const correctItems = [];

    list.forEach((q, idx) => {
      const myAns = mobileTeamAnswers[q.id];
      if (myAns !== undefined && myAns !== null && myAns === q.correct) {
        correctItems.push({
          num: idx + 1,
          coord: q.coordinate || `Ô số ${idx + 1}`
        });
      }
    });

    if (chipsWrap) {
      if (correctItems.length === 0) {
        chipsWrap.innerHTML = '<div style="color: #cbd5e1; font-size: 0.88rem; font-style: italic;">Chưa mở khóa được ô nào. Đội em hãy cùng quan sát diễn biến trên máy chiếu nhé!</div>';
      } else {
        chipsWrap.innerHTML = correctItems.map(item => `
          <div class="gmm-mob-coord-chip">
            <span>🎯 ${item.coord}</span>
          </div>
        `).join('');
      }
    }

    // Cập nhật nhãn nút Xem lại câu sai & đáp án chuẩn
    const btnMistakes = document.getElementById('gmmMobBtnReviewMistakes');
    if (btnMistakes) {
      let wrong = 0;
      list.forEach((q) => {
        const myAns = mobileTeamAnswers[q.id];
        if (myAns !== q.correct) wrong++;
      });
      if (wrong > 0) {
        btnMistakes.innerHTML = `<span>📝 Xem Lại ${wrong} Câu Sai & Đáp Án Chuẩn</span>`;
        btnMistakes.className = 'gmm-mob-btn-review mistakes';
      } else {
        btnMistakes.innerHTML = `<span>🎉 Đội Em Đúng 10/10 - Xem Bảng Vinh Danh</span>`;
        btnMistakes.className = 'gmm-mob-btn-review';
        btnMistakes.style.borderColor = '#34d399';
        btnMistakes.style.color = '#34d399';
      }
    }
  }

  // Tự động chuyển sang câu tiếp theo sau khi chọn đáp án
  function triggerMobileAutoAdvance(currentIdx) {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    const answeredCount = Object.keys(mobileTeamAnswers).length;

    // Rung nhẹ haptic feedback nếu thiết bị hỗ trợ
    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (_e) {}
    }

    // Hiển thị thông báo trạng thái ngắn
    const banner = document.getElementById('gmmMobStatusBanner');
    if (banner) {
      banner.innerHTML = `⚡ <strong>Đã ghi nhận đáp án!</strong> Đang tự động chuyển câu tiếp theo...`;
    }

    mobileAutoAdvanceTimer = setTimeout(() => {
      if (currentIdx < list.length - 1) {
        goToMobileQuestion(currentIdx + 1, 'next');
      } else {
        let firstUnanswered = -1;
        for (let i = 0; i < list.length; i++) {
          const qId = list[i].id;
          if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
            firstUnanswered = i;
            break;
          }
        }

        if (firstUnanswered !== -1 && firstUnanswered !== currentIdx) {
          goToMobileQuestion(firstUnanswered, 'next');
          if (typeof window.showToast === 'function') {
            window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
          }
        } else if (answeredCount >= list.length) {
          renderCurrentMobileQuestion();
          if (typeof window.showToast === 'function') {
            window.showToast('🎉 Đội em đã hoàn thành 10/10 câu! Hãy kiểm tra lại hoặc bấm Chốt nộp bài.', 'success');
          }
        }
      }
    }, 450);
  }

  // Khởi tạo cử chỉ vuốt ngón tay (Swipe Gesture) sang trái/phải trên màn hình điện thoại
  function bindMobileSwipeGestures() {
    if (isMobileSwipeBound) return;
    const quizView = document.getElementById('gmmMobQuizView');
    if (!quizView) return;
    isMobileSwipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    quizView.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    quizView.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const timeElapsed = Date.now() - touchStartTime;

        // Vuốt dứt khoát trong 500ms, độ dịch chuyển ngang > 50px và góc nghiêng chuẩn
        if (timeElapsed < 500 && Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
          if (diffX < 0) {
            nextMobileQuestion();
          } else {
            prevMobileQuestion();
          }
        }
      }
    }, { passive: true });
  }

  function renderMobileQuestionPalette() {
    const pal = document.getElementById('gmmMobQPalette');
    if (!pal) return;
    pal.innerHTML = '';

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();

    list.forEach((q, idx) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.setAttribute('data-index', idx);
      const myAns = mobileTeamAnswers[q.id];
      const hasAns = (myAns !== undefined && myAns !== null);
      const isActive = (idx === mobileActiveQIndex);

      let cls = 'gmm-mob-q-tag';
      if (mobileIsLocked) {
        if (myAns === q.correct) cls += ' correct';
        else if (hasAns) cls += ' wrong';
      } else if (hasAns) {
        cls += ' answered';
      }
      if (isActive) cls += ' active';

      tag.className = cls;
      tag.textContent = idx + 1;
      tag.onclick = (e) => {
        if (e) e.preventDefault();
        const dir = (idx >= mobileActiveQIndex) ? 'next' : 'prev';
        goToMobileQuestion(idx, dir);
      };
      pal.appendChild(tag);
    });

    const countEl = document.getElementById('gmmMobAnsweredCount');
    if (countEl) {
      countEl.textContent = Object.keys(mobileTeamAnswers).length;
    }

    const lockBtn = document.getElementById('gmmMobBtnLockSubmit');
    if (lockBtn) {
      if (mobileIsLocked) {
        lockBtn.classList.add('locked');
        lockBtn.innerHTML = '<span>✅ Đội Em Đã Nộp Bài Thành Công</span>';
      } else {
        lockBtn.classList.remove('locked');
        const count = Object.keys(mobileTeamAnswers).length;
        lockBtn.innerHTML = `<span>🔒 Chốt Kết Quả & Mở Khóa Ma Trận (${count}/${list.length})</span>`;
      }
    }
  }

  function renderCurrentMobileQuestion(direction = 'none') {
    bindMobileSwipeGestures();
    renderLockedSuccessCard();

    const stage = document.getElementById('gmmMobQuestionStage');
    if (stage) {
      if (mobileIsLocked && !isMobileReviewMode) {
        stage.style.display = 'none';
      } else {
        stage.style.display = 'block';
        // Chỉ chạy hiệu ứng lướt chuyển cảnh khi học sinh chuyển câu (tránh giật khung khi đồng bộ nền)
        if (direction === 'prev' || direction === 'next') {
          stage.classList.remove('gmm-slide-in-right', 'gmm-slide-in-left');
          void stage.offsetWidth;
          stage.classList.add(direction === 'prev' ? 'gmm-slide-in-left' : 'gmm-slide-in-right');
        }
      }
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    if (!list || list.length === 0) return;

    if (mobileActiveQIndex >= list.length) mobileActiveQIndex = 0;
    const q = list[mobileActiveQIndex];
    if (!q) return;

    const qNum = document.getElementById('gmmMobQNum');
    const coordBadge = document.getElementById('gmmMobCoordBadge');
    const qText = document.getElementById('gmmMobQText');
    const grid = document.getElementById('gmmMobOptionsGrid');
    const banner = document.getElementById('gmmMobStatusBanner');
    const prevBtn = document.getElementById('gmmMobBtnPrev');
    const nextBtn = document.getElementById('gmmMobBtnNext');

    if (qNum) qNum.textContent = `CÂU HỎI ${mobileActiveQIndex + 1}/${list.length}`;
    if (coordBadge) coordBadge.textContent = `🎯 ${q.coordinate || 'Ô SỐ ' + (mobileActiveQIndex + 1)}`;
    if (qText) qText.textContent = q.question;

    if (prevBtn) {
      prevBtn.disabled = (mobileActiveQIndex === 0);
    }
    
    const answeredCount = Object.keys(mobileTeamAnswers).length;
    if (nextBtn) {
      if (mobileIsLocked) {
        nextBtn.innerHTML = '<span>Đã Nộp Bài ✅</span>';
        nextBtn.className = 'gmm-mob-nav-btn lock-ready';
      } else if (mobileActiveQIndex === list.length - 1) {
        if (answeredCount >= list.length) {
          nextBtn.innerHTML = '<span>Nộp Bài 🔒</span>';
          nextBtn.className = 'gmm-mob-nav-btn lock-ready';
        } else {
          nextBtn.innerHTML = '<span>Về Đầu ↩</span>';
          nextBtn.className = 'gmm-mob-nav-btn primary';
        }
      } else {
        nextBtn.innerHTML = '<span>Câu Tiếp ▶</span>';
        nextBtn.className = 'gmm-mob-nav-btn primary';
      }
    }

    const myAnswer = mobileTeamAnswers[q.id];
    const letters = ['A', 'B', 'C', 'D'];

    if (grid) {
      grid.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gmm-mob-opt-btn';

        const isChosen = (myAnswer === idx);
        if (isChosen) btn.classList.add('selected');

        if (mobileIsLocked) {
          if (idx === q.correct) btn.classList.add('correct');
          else if (isChosen) btn.classList.add('wrong');
        }

        btn.innerHTML = `
          <div class="gmm-mob-opt-letter">${letters[idx]}</div>
          <div style="flex: 1;">${opt}</div>
        `;

        btn.onclick = () => {
          if (mobileIsLocked) {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 Đội em đã chốt kết quả, không thể đổi đáp án!', 'warning');
            } else {
              alert('Đội em đã chốt kết quả bài thi!');
            }
            return;
          }

          // Phát âm thanh "Ting" vui nhộn ngay trên loa điện thoại
          playMobileTingSound();

          mobileTeamAnswers[q.id] = idx;
          submitAnswerFromMobile(q.id, idx);
          renderMobileQuestionPalette();
          renderCurrentMobileQuestion('next');

          // Tự động chuyển sang câu tiếp theo sau 450ms
          triggerMobileAutoAdvance(mobileActiveQIndex);
        };

        grid.appendChild(btn);
      });
    }

    if (banner) {
      const coordName = q.coordinate || `Ô số ${mobileActiveQIndex + 1}`;
      if (mobileIsLocked) {
        if (myAnswer === q.correct) {
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert success">
              <div style="font-size: 1.15rem; font-weight: 900; color: #34d399;">🎉 CHÍNH XÁC (+1 ĐIỂM)!</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #fde047; margin: 6px 0;">👉 BÁO BẠN TÔ BÚT DẠ VÀO:</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #ffffff; background: #059669; padding: 6px 16px; border-radius: 8px; display: inline-block;">TỌA ĐỘ ${coordName.toUpperCase()}</div>
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 6px;">trên bảng giấy A1 tại bàn thi!</div>
            </div>
          `;
        } else {
          const chosenLetter = (myAnswer !== undefined && myAnswer !== null) ? letters[myAnswer] : 'Chưa chọn';
          const chosenText = (myAnswer !== undefined && myAnswer !== null && q.options[myAnswer]) ? q.options[myAnswer] : 'Chưa chọn đáp án';
          const correctLetter = letters[q.correct];
          const correctText = q.options[q.correct];
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert wrong">
              <div style="font-size: 1.05rem; font-weight: 900; color: #f87171; margin-bottom: 6px;">❌ CHƯA CHÍNH XÁC (Chưa mở khóa ${coordName})</div>
              <div style="font-size: 0.84rem; color: #fca5a5; margin-bottom: 4px;">• Đội em đã chọn: <strong>[${chosenLetter}] ${chosenText}</strong></div>
              <div style="font-size: 0.88rem; color: #34d399; font-weight: 800; background: rgba(5, 150, 105, 0.2); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.35);">👉 Đáp án chuẩn của Thầy/Cô: <strong>[${correctLetter}] ${correctText}</strong></div>
            </div>
          `;
        }
      } else if (myAnswer !== undefined && myAnswer !== null) {
        banner.innerHTML = `✅ Đội em đã chọn [${letters[myAnswer]}]. Có thể chạm chọn lại bất kỳ lúc nào hoặc đổi câu ở thanh bên dưới!`;
      } else {
        banner.innerHTML = `👉 Chạm vào 1 trong 4 phương án trên để trả lời câu này!`;
      }
    }
  }

  function goToMobileQuestion(index, direction) {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    if (index < 0 || index >= list.length) return;

    if (!direction) {
      direction = (index >= mobileActiveQIndex) ? 'next' : 'prev';
    }

    mobileActiveQIndex = index;
    renderMobileQuestionPalette();
    renderCurrentMobileQuestion(direction);

    // Đồng bộ tức thì câu hỏi hiện tại của điện thoại lên màn hình Giáo viên
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
      window.GiaiMaLiveMonitor.sendMobilePing(false);
    }

    // Cuộn màn hình lên đầu card câu hỏi
    const arena = document.getElementById('gmmStudentArena');
    if (arena) {
      arena.scrollTop = 0;
    }

    // Tự động cuộn thanh số Palette để thẻ số đang làm luôn nằm giữa khung nhìn
    setTimeout(() => {
      const activeTag = document.querySelector(`.gmm-mob-q-tag[data-index="${index}"]`);
      if (activeTag && typeof activeTag.scrollIntoView === 'function') {
        activeTag.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 40);
  }

  function prevMobileQuestion() {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }
    if (mobileActiveQIndex > 0) {
      goToMobileQuestion(mobileActiveQIndex - 1, 'prev');
    }
  }

  function nextMobileQuestion() {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    if (mobileIsLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã chốt nộp bài thành công!', 'info');
      }
      return;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    if (mobileActiveQIndex < list.length - 1) {
      goToMobileQuestion(mobileActiveQIndex + 1, 'next');
    } else {
      const answeredCount = Object.keys(mobileTeamAnswers).length;
      if (answeredCount >= list.length) {
        confirmLockMobileTeam();
        return;
      }

      let firstUnanswered = -1;
      for (let i = 0; i < list.length; i++) {
        const qId = list[i].id;
        if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
          firstUnanswered = i;
          break;
        }
      }
      if (firstUnanswered !== -1 && firstUnanswered !== mobileActiveQIndex) {
        goToMobileQuestion(firstUnanswered, 'next');
        if (typeof window.showToast === 'function') {
          window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
        }
      } else {
        goToMobileQuestion(0, 'prev');
      }
    }
  }

  function confirmLockMobileTeam() {
    if (mobileIsLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã nộp bài thành công!', 'info');
      } else {
        alert('Đội em đã nộp bài thành công!');
      }
      return;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : ctx.getQuestionsList();
    const answeredCount = Object.keys(mobileTeamAnswers).length;
    const msg = `Đội em đã hoàn thành ${answeredCount}/${list.length} câu hỏi.\n\nSau khi chốt kết quả, các đáp án sẽ được khóa lại và mở khóa các ô ma trận tranh bí mật để các bạn tô lên bảng A1.\n\nĐội em có chắc chắn muốn chốt nộp bài ngay bây giờ không?`;
    if (confirm(msg)) {
      lockMobileTeam();
    }
  }

  async function lockMobileTeam() {
    mobileIsLocked = true;
    clearInterval(mobileTimerInterval);

    const elapsed = Math.max(0, (mobileTotalSeconds || 90) - (mobileRemainingSeconds || 0));
    mobileFinishTimeSeconds = elapsed;
    mobileFinishTimeFormatted = formatMinutesSeconds(elapsed);

    saveMobileAnswersToLocal();

    try {
      const res = await fetch('/api/gmm/lock-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          sessionId: mobileSessionId,
          answers: mobileTeamAnswers,
          finishTime: mobileFinishTimeFormatted,
          finishSeconds: mobileFinishTimeSeconds
        })
      });
      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Thầy/Cô đã bắt đầu ván mới! Hệ thống đã làm mới bài thi cho đội em.', 'info');
          }
          return;
        }
      }
    } catch (_e) {}

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');

    if (navigator.vibrate) {
      try { navigator.vibrate([150, 80, 250]); } catch (_) {}
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    // Bắn pháo hoa Confetti bung lụa rực rỡ ngay trên màn hình điện thoại
    triggerMobileConfetti();

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 Đội em đã chốt nộp bài thành công (⏱️ ${mobileFinishTimeFormatted})! Hãy xem các ô mở khóa để tô tranh A1.`, 'success');
    }
  }

  // Hiệu ứng pháo hoa Confetti bung lụa rực rỡ trên màn hình điện thoại
  function triggerMobileConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.55 },
          zIndex: 2147483647,
          colors: ['#38bdf8', '#34d399', '#fde047', '#f43f5e', '#a855f7']
        });
        setTimeout(() => {
          window.confetti({
            particleCount: 55,
            angle: 60,
            spread: 65,
            origin: { x: 0.05, y: 0.75 },
            zIndex: 2147483647
          });
          window.confetti({
            particleCount: 55,
            angle: 120,
            spread: 65,
            origin: { x: 0.95, y: 0.75 },
            zIndex: 2147483647
          });
        }, 220);
      } catch (_e) {}
    }
  }

  function autoLockMobileTeam() {
    if (mobileIsLocked) return;
    mobileIsLocked = true;
    clearInterval(mobileTimerInterval);
    lockMobileTeam();
    if (typeof window.showToast === 'function') {
      window.showToast('⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài của đội em.', 'warning');
    }
  }

  function closeStudentSseOnExit() {
    if (studentSseSource) {
      try { studentSseSource.close(); } catch (_e) {}
      studentSseSource = null;
    }
  }

  function connectStudentSSE() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    try {
      if (studentSseSource) {
        try { studentSseSource.close(); } catch (_e) {}
        studentSseSource = null;
      }
      const cid = (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.getMobileClientId === 'function')
        ? window.GiaiMaLiveMonitor.getMobileClientId()
        : ('mob_' + Date.now());
      const sseUrl = `/api/sync/events?role=student&team=${encodeURIComponent(ctx.getStudentTeamKey() || '')}&cid=${encodeURIComponent(cid)}`;
      const es = new EventSource(sseUrl);
      studentSseSource = es;
      const statusPill = document.getElementById('gmmMobStatusPill');
      const statusText = document.getElementById('gmmMobStatusText');

      es.onopen = function () {
        if (statusPill) statusPill.className = 'gmm-mob-status-pill';
        if (statusText) statusText.textContent = 'Đã kết nối máy chiếu';
        announceMobileJoinToServer(ctx.getStudentTeamKey(), false);
        // Đồng bộ lại ngay state & remainingSeconds từ máy chủ mỗi lần SSE kết nối hoặc tự nối lại sau rớt Wi-Fi
        fetchCurrentServerState(false);
      };

      es.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            if (typeof rem === 'number') {
              syncMobileDecryptTimer(rem, data.decryptTimeTotal, Boolean(data.isDecryptTimerRunning));
            }
            if (data.state) {
              applyServerStateToMobile(data.state, false);
            }
          } else if ((data.type === 'gmm_team_joined' || data.type === 'gmm_team_left') && data.connectedTeams) {
            updateMobileLobbyTeamsStatus(data.connectedTeams);
          } else if (data.type === 'gmm_timer_start') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              resetMobileClientState(data.sessionId);
              fetchCurrentServerState(false);
            }
            startMobileTimer(data.timerSeconds, data.totalMatchSeconds);
          } else if (data.type === 'gmm_timer_tick') {
            mobileRemainingSeconds = data.timerSeconds;
            if (typeof data.totalMatchSeconds === 'number') {
              mobileTotalSeconds = data.totalMatchSeconds;
            }
            updateMobileTimerUI();
          } else if (data.type === 'gmm_timer_pause') {
            if (!data.isTimerRunning) {
              clearInterval(mobileTimerInterval);
              mobileTimerInterval = null;
            } else if (!mobileTimerInterval) {
              startMobileTimer(data.timerSeconds, mobileTotalSeconds);
            }
          } else if (data.type === 'gmm_time_up') {
            if (!data.sessionId || !mobileSessionId || String(data.sessionId) === String(mobileSessionId)) {
              autoLockMobileTeam();
            }
          } else if (data.type === 'gmm_decrypt_timer_start' || data.type === 'gmm_decrypt_timer_tick') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            const running = typeof data.isDecryptTimerRunning === 'boolean'
              ? data.isDecryptTimerRunning
              : (data.type === 'gmm_decrypt_timer_start');
            syncMobileDecryptTimer(rem, data.decryptTimeTotal, running);
            updateMobileFinishArtworkUI(gameState[ctx.getStudentTeamKey()]);
          } else if (data.type === 'gmm_decrypt_timer_pause') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            syncMobileDecryptTimer(rem, data.decryptTimeTotal, Boolean(data.isDecryptTimerRunning));
            updateMobileFinishArtworkUI(gameState[ctx.getStudentTeamKey()]);
          } else if (data.type === 'gmm_decrypt_time_up') {
            syncMobileDecryptTimer(0, data.decryptTimeTotal, false);
            updateMobileFinishArtworkUI(gameState[ctx.getStudentTeamKey()]);
            if (navigator.vibrate) {
              try { navigator.vibrate([150, 80, 150, 80, 250]); } catch (_) {}
            }
            if (typeof window.showToast === 'function') {
              window.showToast('⏰ ĐÃ HẾT GIỜ TÔ TRANH! Hãy chụp ảnh tranh gửi lên máy chiếu.', 'info');
            }
          } else if (data.type === 'gmm_team_locked') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              return;
            }
            if (data.team === ctx.getStudentTeamKey()) {
              mobileIsLocked = true;
              if (data.finishTime) {
                mobileFinishTimeFormatted = data.finishTime;
              }
              if (typeof data.finishSeconds === 'number') {
                mobileFinishTimeSeconds = data.finishSeconds;
              }
              saveMobileAnswersToLocal();
              renderMobileQuestionPalette();
              renderCurrentMobileQuestion('none');
              if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
                window.GiaiMaLiveMonitor.sendMobilePing(false);
              }
            }
          } else if (data.type === 'gmm_team_unlocked') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              return;
            }
            if (data.team === ctx.getStudentTeamKey()) {
              mobileIsLocked = false;
              isMobileReviewMode = false;
              mobileFinishTimeFormatted = '';
              mobileFinishTimeSeconds = 0;
              if (data.answers && typeof data.answers === 'object') {
                mobileTeamAnswers = Object.assign({}, data.answers);
              }
              const mistakesModal = document.getElementById('gmmMobMistakesModal');
              if (mistakesModal) mistakesModal.style.display = 'none';
              jumpMobileToFirstUnanswered();
              saveMobileAnswersToLocal();

              if (data.isTimerRunning && !mobileTimerInterval) {
                startMobileTimer(data.timerSeconds || mobileRemainingSeconds || 90, data.totalMatchSeconds || mobileTotalSeconds || 90);
              }

              renderMobileQuestionPalette();
              renderCurrentMobileQuestion('none');

              if (navigator.vibrate) {
                try { navigator.vibrate([90, 50, 90]); } catch (_v) {}
              }
              if (typeof window.showToast === 'function') {
                window.showToast('🔓 Thầy/Cô đã mở khóa bài thi cho đội em! Hãy tiếp tục hoàn thành các câu còn lại.', 'success');
              }
              if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
                window.GiaiMaLiveMonitor.sendMobilePing(false);
              }
            }
          } else if (data.type === 'gmm_artwork_finished') {
            if (data.team === ctx.getStudentTeamKey()) {
              const localTeam = gameState[ctx.getStudentTeamKey()];
              if (localTeam) {
                localTeam.isArtworkFinished = true;
                localTeam.artworkFinishTime = data.finishTime || '02:00';
                localTeam.speedBonus = data.speedBonus || 2;
              }
              updateMobileFinishArtworkUI({
                isArtworkFinished: true,
                artworkFinishTime: data.finishTime,
                speedBonus: data.speedBonus
              });
            }
          } else if (data.type === 'gmm_state_update' && data.state) {
            applyServerStateToMobile(data.state, false);
          } else if (data.type === 'gmm_reset') {
            const nextSession = data.sessionId || (data.state && data.state.sessionId) || null;
            const hadOldProgress = Boolean(mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0);
            resetMobileClientState(nextSession);
            announceMobileJoinToServer(ctx.getStudentTeamKey(), true);
            if ((!data.silentToast || hadOldProgress) && typeof window.showToast === 'function') {
              window.showToast('🔄 Thầy/Cô đã đặt lại ván thi mới! Sẵn sàng làm bài từ Câu 1.', 'info');
            }
            if (data.state) {
              applyServerStateToMobile(data.state, false);
            } else {
              fetchCurrentServerState(false);
            }
          }
        } catch (_err) {}
      };

      es.onerror = function () {
        if (statusPill) statusPill.className = 'gmm-mob-status-pill offline';
        if (statusText) statusText.textContent = 'Đang đồng bộ lại Wi-Fi...';
      };
    } catch (_err) {}
  }

  // Cập nhật giao diện điện thoại theo trạng thái máy chiếu (Authoritative Server Sync)
  function applyServerStateToMobile(serverState, isBackgroundPoll = false) {
    if (!serverState) return;

    if (serverState.teamNames) {
      if (serverState.teamNames.teamA && gameState.teamA) gameState.teamA.name = serverState.teamNames.teamA;
      if (serverState.teamNames.teamB && gameState.teamB) gameState.teamB.name = serverState.teamNames.teamB;
      updateAllTeamNamesUI();
    }

    const lobbyView = document.getElementById('gmmMobLobbyView');
    const quizView = document.getElementById('gmmMobQuizView');
    const paintView = document.getElementById('gmmMobPaintView');

    const teamData = serverState[ctx.getStudentTeamKey()] || null;
    const serverAnswers = (teamData && teamData.answers && typeof teamData.answers === 'object') ? teamData.answers : {};
    const serverAnswerCount = Object.keys(serverAnswers).length;
    const serverIsLocked = Boolean(teamData && teamData.isLocked);

    // A. PHÁT HIỆN VÁN THI MỚI QUA SESSION ID HOẶC TRẠNG THÁI MỞ KHÓA TRỐNG TỪ MÁY CHỦ
    if (serverState.sessionId) {
      if (mobileSessionId && String(mobileSessionId) !== String(serverState.sessionId)) {
        resetMobileClientState(serverState.sessionId);
      } else if (!mobileSessionId) {
        if (!serverIsLocked && serverAnswerCount === 0 && (mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0)) {
          resetMobileClientState(serverState.sessionId);
        } else {
          mobileSessionId = String(serverState.sessionId);
          saveMobileAnswersToLocal();
        }
      }
    }

    // Bảo vệ kép: Nếu máy chủ xác nhận đội CHƯA khóa bài và có 0 câu trả lời, trong khi điện thoại vẫn kẹt trạng thái đã nộp bài cũ -> Xóa sạch ngay!
    if (!serverIsLocked && serverAnswerCount === 0 && mobileIsLocked) {
      resetMobileClientState(serverState.sessionId || mobileSessionId);
    }

    // Tự động đăng ký lại sự hiện diện của đội nếu máy chủ vừa khởi động lại hoặc reset phòng chờ
    if (ctx.getStudentTeamKey() && (!serverState.connectedTeams || !serverState.connectedTeams[ctx.getStudentTeamKey()])) {
      announceMobileJoinToServer(ctx.getStudentTeamKey(), false);
    }

    // Cập nhật trạng thái 2 đội trong phòng chờ
    if (serverState.connectedTeams) {
      updateMobileLobbyTeamsStatus(serverState.connectedTeams);
    }

    // 0. Nếu đang ở giai đoạn đếm ngược hiệu lệnh khai cuộc 1.. 2.. 3.. Bắt đầu!
    if (serverState.status === 'countdown') {
      lastMobileStateFingerprint = `countdown|${serverState.sessionId || ''}`;
      const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
      if (mobOverlay && mobOverlay.style.display !== 'flex') {
        runCountdownAnimation(serverState.countdownSeconds || 3);
      }
      return;
    } else {
      const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
      if (mobOverlay && mobOverlay.style.display === 'flex') {
        mobOverlay.style.display = 'none';
      }
    }

    // 1. Nếu trạng thái là phòng chờ hoặc trang chủ hoặc đấu trường chưa bắt đầu
    const isLobby = (
      serverState.status === 'lobby' ||
      serverState.status === 'home' ||
      serverState.status === 'quiz_waiting' ||
      (serverState.status === 'quiz' && !serverState.isMatchStarted) ||
      (serverState.status === 'answer_key' && !serverState.isMatchStarted && !serverState.isDecryptPhase)
    );
    if (isLobby) {
      stopMobileDecryptTicker();
      if (!serverIsLocked && serverAnswerCount === 0 && (mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0)) {
        resetMobileClientState(serverState.sessionId || mobileSessionId);
      }
      wasMobileInLobby = true;
      clearInterval(mobileTimerInterval);
      mobileTimerInterval = null;
      if (lobbyView) lobbyView.style.display = 'flex';
      if (quizView) quizView.style.display = 'none';
      if (paintView) paintView.style.display = 'none';

      const descEl = document.querySelector('.gmm-mob-lobby-desc');
      if (descEl) {
        if (serverState.status === 'quiz_waiting' || serverState.status === 'quiz') {
          descEl.innerHTML = `Đấu trường 10 câu hỏi đã sẵn sàng! Xin vui lòng quan sát máy chiếu, đợi Thầy/Cô bấm <strong>[🚀 BẮT ĐẦU TRÒ CHƠI]</strong> để đếm 3, 2, 1 và làm bài.`;
        } else {
          descEl.innerHTML = `Xin vui lòng đợi Ban Giám Khảo phát hiệu lệnh <strong>[🚀 BẮT ĐẦU TRÒ CHƠI]</strong> trên máy chiếu để đếm 3, 2, 1 và mở 10 câu hỏi thi đấu.`;
        }
      }
      lastMobileStateFingerprint = `lobby|${serverState.sessionId || ''}|${serverState.status}`;
      return;
    }

    // 2. Nếu ở giai đoạn Giải mã tô màu tranh (Tab 4 / Decrypt) hoặc Đối chiếu kết quả tranh Giáo viên (Tab 5 / answer_key)
    if (serverState.isDecryptPhase || serverState.status === 'decrypt' || serverState.status === 'answer_key') {
      wasMobileInLobby = false;
      clearInterval(mobileTimerInterval);
      mobileTimerInterval = null;
      if (lobbyView) lobbyView.style.display = 'none';
      if (quizView) quizView.style.display = 'none';
      if (paintView) paintView.style.display = 'flex';

      // Đồng bộ thời gian đếm ngược tô màu tranh từ máy chủ (kể cả khi vừa kết nối lại sau rớt mạng)
      const remDecrypt = typeof serverState.remainingSeconds === 'number'
        ? serverState.remainingSeconds
        : serverState.decryptTimeLeft;
      syncMobileDecryptTimer(
        remDecrypt,
        serverState.decryptTimeTotal,
        typeof serverState.isDecryptTimerRunning === 'boolean' ? serverState.isDecryptTimerRunning : undefined
      );

      if (teamData && gameState[ctx.getStudentTeamKey()]) {
        gameState[ctx.getStudentTeamKey()].isArtworkFinished = Boolean(teamData.isArtworkFinished);
        gameState[ctx.getStudentTeamKey()].artworkFinishTime = teamData.artworkFinishTime || null;
        gameState[ctx.getStudentTeamKey()].speedBonus = teamData.speedBonus || 0;
      }
      updateMobileFinishArtworkUI(teamData);

      const paintFingerprint = `decrypt|${serverState.sessionId || ''}|${JSON.stringify(teamData?.coloredRegions || {})}|${JSON.stringify(teamData?.unlockedRegions || [])}`;
      if (!isBackgroundPoll || paintFingerprint !== lastMobileStateFingerprint) {
        lastMobileStateFingerprint = paintFingerprint;
        renderMobilePaintView(serverState);
      }
      return;
    }

    // 3. Nếu đang ở giai đoạn làm bài thi đấu (Tab 3 / Quiz)
    stopMobileDecryptTicker();
    if (lobbyView) lobbyView.style.display = 'none';
    if (quizView) quizView.style.display = 'flex';
    if (paintView) paintView.style.display = 'none';

    if (wasMobileInLobby) {
      wasMobileInLobby = false;
      if (navigator.vibrate) {
        try { navigator.vibrate([100, 60, 100]); } catch (_) {}
      }
    }

    if (serverState.questions && serverState.questions.length > 0) {
      mobileQuestionsList = serverState.questions;
    } else if (mobileQuestionsList.length === 0) {
      mobileQuestionsList = [...ctx.DEFAULT_QUESTIONS];
    }

    if (teamData) {
      const wasLockedBefore = mobileIsLocked;
      const syncedAnswers = Object.assign({}, serverAnswers);
      // Chỉ giữ các câu đang chờ gửi bù offline thuộc CÙNG phiên chơi hiện tại
      if (mobilePendingSyncQueue.length > 0) {
        mobilePendingSyncQueue.forEach(item => {
          if (!mobileSessionId || !item.sessionId || String(item.sessionId) === String(mobileSessionId)) {
            syncedAnswers[item.questionId] = item.optionIdx;
          }
        });
      }
      mobileTeamAnswers = syncedAnswers;
      mobileIsLocked = serverIsLocked;

      if (!mobileIsLocked) {
        isMobileReviewMode = false;
        mobileFinishTimeFormatted = '';
        mobileFinishTimeSeconds = 0;
        if (wasLockedBefore) {
          const mistakesModal = document.getElementById('gmmMobMistakesModal');
          if (mistakesModal) mistakesModal.style.display = 'none';
          jumpMobileToFirstUnanswered();
          if (typeof window.showToast === 'function') {
            window.showToast('🔓 Thầy/Cô đã mở khóa bài thi cho đội em! Hãy tiếp tục làm bài.', 'success');
          }
        }
      } else {
        if (teamData.finishTime) {
          mobileFinishTimeFormatted = teamData.finishTime;
        }
        if (typeof teamData.finishSeconds === 'number') {
          mobileFinishTimeSeconds = teamData.finishSeconds;
        }
      }
      saveMobileAnswersToLocal();
    }

    // Đồng bộ đồng hồ mượt mà
    if (serverState.isTimerRunning) {
      if (!mobileTimerInterval) {
        startMobileTimer(serverState.timerSeconds || 120, serverState.totalMatchSeconds || 120);
      } else if (typeof serverState.timerSeconds === 'number' && Math.abs(mobileRemainingSeconds - serverState.timerSeconds) >= 2) {
        mobileRemainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileTotalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    } else {
      if (mobileTimerInterval) {
        clearInterval(mobileTimerInterval);
        mobileTimerInterval = null;
      }
      if (typeof serverState.timerSeconds === 'number') {
        mobileRemainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileTotalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    }

    const quizFingerprint = [
      'quiz',
      serverState.sessionId || '',
      mobileIsLocked ? '1' : '0',
      JSON.stringify(mobileTeamAnswers),
      mobileQuestionsList.length,
      mobileActiveQIndex
    ].join('|');

    if (isBackgroundPoll && quizFingerprint === lastMobileStateFingerprint) {
      return;
    }
    lastMobileStateFingerprint = quizFingerprint;

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');
  }

  // Học sinh bấm gửi câu trả lời lên Server (hỗ trợ lưu LocalStorage & hàng đợi Offline)
  async function submitAnswerFromMobile(questionId, optionIdx) {
    saveMobileAnswersToLocal();

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (_e) {}
    }

    try {
      const res = await fetch('/api/gmm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          sessionId: mobileSessionId,
          questionId: questionId,
          optionIndex: optionIdx,
          currentQ: (typeof mobileActiveQIndex === 'number' ? mobileActiveQIndex : 0) + 1
        })
      });

      if (res && res.ok) {
        if (mobilePendingSyncQueue.length > 0) {
          flushPendingSyncQueue();
        } else {
          updateSyncStatusBadge();
        }
        return;
      }

      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Ván chơi vừa được Thầy/Cô đặt lại! Mời đội em làm lại từ Câu 1.', 'info');
          }
          return;
        }
        if (errJson && errJson.teamLocked) {
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          return;
        }
      }

      throw new Error('Mã phản hồi từ máy chủ không hợp lệ');
    } catch (_err) {
      console.warn('Lỗi kết nối Wi-Fi khi nộp câu trả lời, lưu vào hàng đợi offline:', _err);
      addToPendingSyncQueue(questionId, optionIdx);
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Mạng Wi-Fi chập chờn - Đáp án đã được lưu an toàn trên máy!', 'warning');
      }
    }
  }

  let mobileCurrentColor = '#ef4444';
  function setMobileColor(c, el) {
    mobileCurrentColor = c;
    document.querySelectorAll('#gmmMobPaletteBar .gmm-color-swatch').forEach(sw => sw.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // Học sinh tô màu tranh từ điện thoại gửi lên Server
  async function submitPaintFromMobile(regionId) {
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (_e) {}
    }
    try {
      await fetch('/api/gmm/paint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          regionId: regionId,
          color: mobileCurrentColor
        })
      });
    } catch (_err) {}
  }

  // Render tranh SVG trên điện thoại học sinh khi bước vào giai đoạn giải mã
  function renderMobilePaintView() {
    updateMobileDecryptTimerUI();
    const wrap = document.getElementById('gmmMobSvgWrap');
    const palette = document.getElementById('gmmMobPaletteBar');
    if (!wrap || !palette) return;

    wrap.innerHTML = generateSvgPuzzle(ctx.getStudentTeamKey());

    const colors = ctx.getStudentTeamKey() === 'teamA' 
      ? ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    palette.innerHTML = `
      <span style="font-size: 0.8rem; color: #cbd5e1; font-weight: 700;">Màu tô:</span>
      ${colors.map((c, i) => `
        <div class="gmm-color-swatch ${i === 0 ? 'active' : ''}" style="background: ${c};" onclick="window.GiaiMaBiMat.setMobileColor('${c}', this)"></div>
      `).join('')}
    `;
  }


  function triggerMobileCamera() {
    const input = document.getElementById('gmmMobCameraInput');
    if (input) input.click();
  }

  function triggerMobileGallery() {
    const input = document.getElementById('gmmMobGalleryInput');
    if (input) input.click();
  }

  async function handleMobilePhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Đặt lại giá trị input ngay lập tức để chọn lại cùng 1 ảnh trong Bộ sưu tập vẫn kích hoạt onchange
    e.target.value = '';

    const currentTeam = ctx.getStudentTeamKey() || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');

    // Mở ngay Studio Quét Tài Liệu 4 Góc Hình Thang (Perspective Warp) + AI Làm Sáng Toàn Màn Hình
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openScannerWithFile === 'function') {
      if (typeof window.showToast === 'function') {
        window.showToast('📐 Đang nhận diện 4 góc giấy A1 & làm sáng màu...', 'info');
      }
      window.GiaiMaArtworkScanner.openScannerWithFile(file, 'mobile', currentTeam);
      return;
    }

    // Dự phòng nếu module Scanner chưa kịp tải
    try {
      const enhancedData = await compressImageClient(file, 1300, 0.85, true);
      mobileEnhancedPhotoData = enhancedData;
      mobileOriginalPhotoData = enhancedData;
      mobileCapturedPhotoData = enhancedData;
      await submitCapturedArtworkPhoto();
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể nạp ảnh, vui lòng thử lại!', 'error');
      }
    }
  }

  function toggleMobileAiEnhance() {
    isMobileAiEnhanced = !isMobileAiEnhanced;
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    const aiBtn = document.getElementById('gmmMobBtnToggleAi');
    const aiBadge = document.getElementById('gmmMobAiBadge');

    if (isMobileAiEnhanced) {
      mobileCapturedPhotoData = mobileEnhancedPhotoData;
      if (previewImg && mobileEnhancedPhotoData) {
        previewImg.src = mobileEnhancedPhotoData;
        previewImg.classList.add('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.add('active');
      if (aiBadge) {
        aiBadge.style.display = 'block';
        aiBadge.textContent = '✨ AI Đã Căn Sáng & Tươi Màu';
      }
      if (typeof window.showToast === 'function') {
        window.showToast('✨ Đã bật Bộ lọc AI làm sáng tranh!', 'info');
      }
    } else {
      mobileCapturedPhotoData = mobileOriginalPhotoData;
      if (previewImg && mobileOriginalPhotoData) {
        previewImg.src = mobileOriginalPhotoData;
        previewImg.classList.remove('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.remove('active');
      if (aiBadge) aiBadge.style.display = 'none';
      if (typeof window.showToast === 'function') {
        window.showToast('📸 Đã chuyển về ảnh gốc chưa lọc!', 'info');
      }
    }
  }

  function rotateMobilePreview(deltaAngle = 90) {
    mobilePhotoRotation = (mobilePhotoRotation + deltaAngle) % 360;
    updateMobilePreviewTransform();
  }

  function stepMobileTilt(delta = 1) {
    mobilePhotoTilt = Math.max(-15, Math.min(15, mobilePhotoTilt + delta));
    updateMobilePreviewTransform();
  }

  function updateMobilePreviewTransform() {
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    if (previewImg) {
      previewImg.style.transform = `rotate(${mobilePhotoRotation + mobilePhotoTilt}deg)`;
    }
  }

  async function submitCapturedArtworkPhoto() {
    if (!mobileCapturedPhotoData) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Vui lòng chụp ảnh tranh giấy trước khi tải lên!', 'warning');
      }
      return;
    }

    const currentTeam = ctx.getStudentTeamKey() || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');
    const teamName = currentTeam === 'teamA' ? 'Đội 1' : 'Đội 2';
    const btnSend = document.getElementById('gmmMobBtnSendPhoto');
    const origHtml = btnSend ? btnSend.innerHTML : '';

    if (btnSend) {
      btnSend.disabled = true;
      btnSend.innerHTML = '<span>⏳ Đang gửi lên máy chiếu...</span>';
    }

    try {
      let finalPhotoData = mobileCapturedPhotoData;

      // Nếu học sinh có chỉnh góc xoay hoặc nghiêng trên điện thoại, render lại canvas ở góc đó
      if (mobilePhotoRotation !== 0 || mobilePhotoTilt !== 0) {
        finalPhotoData = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const c = renderTransformedCanvas(img, 1300, mobilePhotoRotation, mobilePhotoTilt);
            resolve(c.toDataURL('image/jpeg', 0.85));
          };
          img.src = mobileCapturedPhotoData;
        });
      }

      const resp = await fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: currentTeam,
          photoData: finalPhotoData,
          timestamp: Date.now()
        })
      });

      const res = await resp.json();
      if (res && res.success) {
        const previewWrap = document.getElementById('gmmMobPhotoPreviewWrap');
        const successBox = document.getElementById('gmmMobPhotoUploadSuccess');
        if (previewWrap) previewWrap.style.display = 'none';
        if (successBox) successBox.style.display = 'block';

        if (window.audioManager && typeof window.audioManager.playChime === 'function') {
          window.audioManager.playChime();
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Tranh thật của ${teamName} đã được gắn lên màn hình máy chiếu!`, 'success');
        }
      } else {
        throw new Error(res?.error || 'Lỗi tải ảnh');
      }
    } catch (err) {
      if (typeof window.showToast === 'function') {
        window.showToast(`❌ Không thể gửi ảnh lên máy chiếu: ${err.message}`, 'error');
      }
    } finally {
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.innerHTML = origHtml;
      }
    }
  }


      return {
        updateMobileLobbyTeamsStatus,
        announceMobileJoinToServer,
        startMobileStatePolling,
        bindMobileLifecycleSync,
        syncMobileNow,
        initStudentMobileArena,
        getMobileTelemetrySnapshot,
        jumpMobileToFirstUnanswered,
        fetchCurrentServerState,
        startMobileTimer,
        updateMobileTimerUI,
        stopMobileDecryptTicker,
        syncMobileDecryptTimer,
        updateMobileDecryptTimerUI,
        updateMobileFinishArtworkUI,
        reportArtworkFinishedFromMobile,
        resetMobileClientState,
        resetMobilePhotoState,
        closeStudentSseOnExit,
        connectStudentSSE,
        applyServerStateToMobile,
        submitAnswerFromMobile,
        setMobileColor,
        submitPaintFromMobile,
        renderMobilePaintView,
        goToMobileQuestion,
        prevMobileQuestion,
        nextMobileQuestion,
        confirmLockMobileTeam,
        lockMobileTeam,
        toggleReviewQuestions,
        openMistakesReviewModal,
        closeMistakesReviewModal,
        filterMistakesView,
        triggerMobileCamera,
        triggerMobileGallery,
        handleMobilePhotoSelected,
        toggleMobileAiEnhance,
        rotateMobilePreview,
        stepMobileTilt,
        updateMobilePreviewTransform,
        submitCapturedArtworkPhoto
      };
    }
  };
})();
