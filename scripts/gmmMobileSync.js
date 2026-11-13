/**
 * ==============================================================================
 * MODULE KẾT NỐI SSE & ĐỒNG BỘ TRẠNG THÁI ĐIỆN THOẠI (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmMobileSync.js
 * Trách nhiệm: Mở luồng SSE học sinh, tự động đồng bộ lại giây đếm ngược khi
 * rớt mạng, khôi phục trạng thái phiên mới và áp trạng thái từ máy chiếu.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmMobileSync = {
    create: function (ctx) {
      const {
        gameState,
        mobileState,
        updateAllTeamNamesUI,
        runCountdownAnimation,
        announceMobileJoinToServer,
        saveMobileAnswersToLocal,
        getMobileStorageKey,
        updateMobileLobbyTeamsStatus,
        updateMobileTimerUI,
        updateMobileDecryptTimerUI,
        updateMobileFinishArtworkUI,
        renderMobileQuestionPalette,
        renderCurrentMobileQuestion,
        renderMobilePaintView,
        autoLockMobileTeam,
        resetMobilePhotoState,
        closeMistakesReviewModal,
        updateSyncStatusBadge,
        jumpMobileToFirstUnanswered
      } = ctx;

  async function fetchCurrentServerState(isBackgroundPoll = false) {
    try {
      const res = await fetch('/api/gmm/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state) {
          const statusPill = document.getElementById('gmmMobStatusPill');
          const statusText = document.getElementById('gmmMobStatusText');
          if (statusPill && statusPill.classList.contains('offline') && mobileState.pendingSyncQueue.length === 0) {
            statusPill.className = 'gmm-mob-status-pill';
            if (statusText) statusText.textContent = 'Đã kết nối máy chiếu';
          }
          applyServerStateToMobile(json.state, isBackgroundPoll);
        }
      }
    } catch (_e) {}
  }


  function startMobileTimer(sec, totalSec) {
    if (typeof sec === 'number') mobileState.remainingSeconds = sec;
    if (typeof totalSec === 'number') mobileState.totalSeconds = totalSec;

    clearInterval(mobileState.timerInterval);
    updateMobileTimerUI();

    mobileState.timerInterval = setInterval(() => {
      if (mobileState.remainingSeconds > 0) {
        mobileState.remainingSeconds--;
        updateMobileTimerUI();

        if (mobileState.remainingSeconds <= 10 && mobileState.remainingSeconds > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(mobileState.remainingSeconds);
          }
        }

        if (mobileState.remainingSeconds === 0) {
          clearInterval(mobileState.timerInterval);
          autoLockMobileTeam();
        }
      }
    }, 1000);
  }


  function stopMobileDecryptTicker() {
    if (mobileState.decryptTimerInterval) {
      clearInterval(mobileState.decryptTimerInterval);
      mobileState.decryptTimerInterval = null;
    }
  }

  function syncMobileDecryptTimer(remainingSec, totalSec, isRunning) {
    if (typeof remainingSec === 'number' && !Number.isNaN(remainingSec)) {
      mobileState.decryptRemainingSeconds = Math.max(0, remainingSec);
    }
    if (typeof totalSec === 'number' && totalSec > 0) {
      mobileState.decryptTotalSeconds = totalSec;
    }
    if (typeof isRunning === 'boolean') {
      mobileState.isDecryptTimerRunning = isRunning;
    }

    updateMobileDecryptTimerUI();

    if (mobileState.isDecryptTimerRunning && mobileState.decryptRemainingSeconds > 0) {
      if (!mobileState.decryptTimerInterval) {
        mobileState.decryptTimerInterval = setInterval(() => {
          if (!mobileState.isDecryptTimerRunning) {
            stopMobileDecryptTicker();
            return;
          }
          if (mobileState.decryptRemainingSeconds > 0) {
            mobileState.decryptRemainingSeconds--;
            updateMobileDecryptTimerUI();
          }
          if (mobileState.decryptRemainingSeconds <= 0) {
            mobileState.isDecryptTimerRunning = false;
            stopMobileDecryptTicker();
            updateMobileDecryptTimerUI();
          }
        }, 1000);
      }
    } else {
      stopMobileDecryptTicker();
    }
  }


  function resetMobileClientState(newSessionId) {
    clearInterval(mobileState.timerInterval);
    mobileState.timerInterval = null;
    stopMobileDecryptTicker();
    mobileState.isDecryptTimerRunning = false;
    if (mobileState.autoAdvanceTimer) {
      clearTimeout(mobileState.autoAdvanceTimer);
      mobileState.autoAdvanceTimer = null;
    }

    mobileState.activeQIndex = 0;
    mobileState.teamAnswers = {};
    mobileState.isLocked = false;
    mobileState.finishTimeFormatted = '';
    mobileState.finishTimeSeconds = 0;
    mobileState.isReviewMode = false;
    mobileState.pendingSyncQueue = [];
    mobileState.lastStateFingerprint = '';

    resetMobilePhotoState();

    if (newSessionId) {
      mobileState.sessionId = String(newSessionId);
    }

    try {
      localStorage.removeItem(getMobileStorageKey('answers'));
      localStorage.removeItem(getMobileStorageKey('locked'));
      localStorage.removeItem(getMobileStorageKey('finishTime'));
      localStorage.removeItem(getMobileStorageKey('finishSeconds'));
      localStorage.removeItem(getMobileStorageKey('syncQueue'));
      if (mobileState.sessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), mobileState.sessionId);
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


  function closeStudentSseOnExit() {
    if (mobileState.sseSource) {
      try { mobileState.sseSource.close(); } catch (_e) {}
      mobileState.sseSource = null;
    }
  }

  function connectStudentSSE() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    try {
      if (mobileState.sseSource) {
        try { mobileState.sseSource.close(); } catch (_e) {}
        mobileState.sseSource = null;
      }
      const cid = (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.getMobileClientId === 'function')
        ? window.GiaiMaLiveMonitor.getMobileClientId()
        : ('mob_' + Date.now());
      const sseUrl = `/api/sync/events?role=student&team=${encodeURIComponent(ctx.getStudentTeamKey() || '')}&cid=${encodeURIComponent(cid)}`;
      const es = new EventSource(sseUrl);
      mobileState.sseSource = es;
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
            if (data.sessionId && mobileState.sessionId && String(data.sessionId) !== String(mobileState.sessionId)) {
              resetMobileClientState(data.sessionId);
              fetchCurrentServerState(false);
            }
            startMobileTimer(data.timerSeconds, data.totalMatchSeconds);
          } else if (data.type === 'gmm_timer_tick') {
            mobileState.remainingSeconds = data.timerSeconds;
            if (typeof data.totalMatchSeconds === 'number') {
              mobileState.totalSeconds = data.totalMatchSeconds;
            }
            updateMobileTimerUI();
          } else if (data.type === 'gmm_timer_pause') {
            if (!data.isTimerRunning) {
              clearInterval(mobileState.timerInterval);
              mobileState.timerInterval = null;
            } else if (!mobileState.timerInterval) {
              startMobileTimer(data.timerSeconds, mobileState.totalSeconds);
            }
          } else if (data.type === 'gmm_time_up') {
            if (!data.sessionId || !mobileState.sessionId || String(data.sessionId) === String(mobileState.sessionId)) {
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
            if (data.sessionId && mobileState.sessionId && String(data.sessionId) !== String(mobileState.sessionId)) {
              return;
            }
            if (data.team === ctx.getStudentTeamKey()) {
              mobileState.isLocked = true;
              if (data.finishTime) {
                mobileState.finishTimeFormatted = data.finishTime;
              }
              if (typeof data.finishSeconds === 'number') {
                mobileState.finishTimeSeconds = data.finishSeconds;
              }
              saveMobileAnswersToLocal();
              renderMobileQuestionPalette();
              renderCurrentMobileQuestion('none');
              if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
                window.GiaiMaLiveMonitor.sendMobilePing(false);
              }
            }
          } else if (data.type === 'gmm_team_unlocked') {
            if (data.sessionId && mobileState.sessionId && String(data.sessionId) !== String(mobileState.sessionId)) {
              return;
            }
            if (data.team === ctx.getStudentTeamKey()) {
              mobileState.isLocked = false;
              mobileState.isReviewMode = false;
              mobileState.finishTimeFormatted = '';
              mobileState.finishTimeSeconds = 0;
              if (data.answers && typeof data.answers === 'object') {
                mobileState.teamAnswers = Object.assign({}, data.answers);
              }
              const mistakesModal = document.getElementById('gmmMobMistakesModal');
              if (mistakesModal) mistakesModal.style.display = 'none';
              jumpMobileToFirstUnanswered();
              saveMobileAnswersToLocal();

              if (data.isTimerRunning && !mobileState.timerInterval) {
                startMobileTimer(data.timerSeconds || mobileState.remainingSeconds || 90, data.totalMatchSeconds || mobileState.totalSeconds || 90);
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
            const hadOldProgress = Boolean(mobileState.isLocked || Object.keys(mobileState.teamAnswers).length > 0);
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
      if (mobileState.sessionId && String(mobileState.sessionId) !== String(serverState.sessionId)) {
        resetMobileClientState(serverState.sessionId);
      } else if (!mobileState.sessionId) {
        if (!serverIsLocked && serverAnswerCount === 0 && (mobileState.isLocked || Object.keys(mobileState.teamAnswers).length > 0)) {
          resetMobileClientState(serverState.sessionId);
        } else {
          mobileState.sessionId = String(serverState.sessionId);
          saveMobileAnswersToLocal();
        }
      }
    }

    // Bảo vệ kép: Nếu máy chủ xác nhận đội CHƯA khóa bài và có 0 câu trả lời, trong khi điện thoại vẫn kẹt trạng thái đã nộp bài cũ -> Xóa sạch ngay!
    if (!serverIsLocked && serverAnswerCount === 0 && mobileState.isLocked) {
      resetMobileClientState(serverState.sessionId || mobileState.sessionId);
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
      mobileState.lastStateFingerprint = `countdown|${serverState.sessionId || ''}`;
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
      if (!serverIsLocked && serverAnswerCount === 0 && (mobileState.isLocked || Object.keys(mobileState.teamAnswers).length > 0)) {
        resetMobileClientState(serverState.sessionId || mobileState.sessionId);
      }
      mobileState.wasInLobby = true;
      clearInterval(mobileState.timerInterval);
      mobileState.timerInterval = null;
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
      mobileState.lastStateFingerprint = `lobby|${serverState.sessionId || ''}|${serverState.status}`;
      return;
    }

    // 2. Nếu ở giai đoạn Giải mã tô màu tranh (Tab 4 / Decrypt) hoặc Đối chiếu kết quả tranh Giáo viên (Tab 5 / answer_key)
    if (serverState.isDecryptPhase || serverState.status === 'decrypt' || serverState.status === 'answer_key') {
      mobileState.wasInLobby = false;
      clearInterval(mobileState.timerInterval);
      mobileState.timerInterval = null;
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
      if (!isBackgroundPoll || paintFingerprint !== mobileState.lastStateFingerprint) {
        mobileState.lastStateFingerprint = paintFingerprint;
        renderMobilePaintView(serverState);
      }
      return;
    }

    // 3. Nếu đang ở giai đoạn làm bài thi đấu (Tab 3 / Quiz)
    stopMobileDecryptTicker();
    if (lobbyView) lobbyView.style.display = 'none';
    if (quizView) quizView.style.display = 'flex';
    if (paintView) paintView.style.display = 'none';

    if (mobileState.wasInLobby) {
      mobileState.wasInLobby = false;
      if (navigator.vibrate) {
        try { navigator.vibrate([100, 60, 100]); } catch (_) {}
      }
    }

    if (serverState.questions && serverState.questions.length > 0) {
      mobileState.questionsList = serverState.questions;
    } else if (mobileState.questionsList.length === 0) {
      mobileState.questionsList = [...ctx.DEFAULT_QUESTIONS];
    }

    if (teamData) {
      const wasLockedBefore = mobileState.isLocked;
      const syncedAnswers = Object.assign({}, serverAnswers);
      // Chỉ giữ các câu đang chờ gửi bù offline thuộc CÙNG phiên chơi hiện tại
      if (mobileState.pendingSyncQueue.length > 0) {
        mobileState.pendingSyncQueue.forEach(item => {
          if (!mobileState.sessionId || !item.sessionId || String(item.sessionId) === String(mobileState.sessionId)) {
            syncedAnswers[item.questionId] = item.optionIdx;
          }
        });
      }
      mobileState.teamAnswers = syncedAnswers;
      mobileState.isLocked = serverIsLocked;

      if (!mobileState.isLocked) {
        mobileState.isReviewMode = false;
        mobileState.finishTimeFormatted = '';
        mobileState.finishTimeSeconds = 0;
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
          mobileState.finishTimeFormatted = teamData.finishTime;
        }
        if (typeof teamData.finishSeconds === 'number') {
          mobileState.finishTimeSeconds = teamData.finishSeconds;
        }
      }
      saveMobileAnswersToLocal();
    }

    // Đồng bộ đồng hồ mượt mà
    if (serverState.isTimerRunning) {
      if (!mobileState.timerInterval) {
        startMobileTimer(serverState.timerSeconds || 120, serverState.totalMatchSeconds || 120);
      } else if (typeof serverState.timerSeconds === 'number' && Math.abs(mobileState.remainingSeconds - serverState.timerSeconds) >= 2) {
        mobileState.remainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileState.totalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    } else {
      if (mobileState.timerInterval) {
        clearInterval(mobileState.timerInterval);
        mobileState.timerInterval = null;
      }
      if (typeof serverState.timerSeconds === 'number') {
        mobileState.remainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileState.totalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    }

    const quizFingerprint = [
      'quiz',
      serverState.sessionId || '',
      mobileState.isLocked ? '1' : '0',
      JSON.stringify(mobileState.teamAnswers),
      mobileState.questionsList.length,
      mobileState.activeQIndex
    ].join('|');

    if (isBackgroundPoll && quizFingerprint === mobileState.lastStateFingerprint) {
      return;
    }
    mobileState.lastStateFingerprint = quizFingerprint;

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');
  }


      return {
        fetchCurrentServerState,
        startMobileTimer,
        stopMobileDecryptTicker,
        syncMobileDecryptTimer,
        resetMobileClientState,
        closeStudentSseOnExit,
        connectStudentSSE,
        applyServerStateToMobile
      };
    }
  };
})();
