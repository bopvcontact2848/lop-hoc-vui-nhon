/**
 * ==============================================================================
 * MODULE ĐIỀU PHỐI MODAL CHÍNH & ĐẶT LẠI VÁN MỚI (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmCoordinator.js
 * Trách nhiệm: Mở/đóng modal toàn màn hình, chuyển nhanh vai trò BGK/Đội A/B,
 * bật tắt toàn màn hình và đặt lại toàn bộ phiên thi đấu mới (Reset Game).
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmCoordinator = {
    create: function (ctx) {
      const {
        gameState,
        switchTab,
        setRoleFocus,
        updateHeaderScores,
        updateAllTeamNamesUI,
        initHostSseListener,
        startHostArtworkPolling,
        stopHostArtworkPolling,
        syncHostInitialConnectionState,
        broadcastHostStateToServer,
        exitProjectorStageMode,
        setArtworkViewMode,
        resetTiltAngle,
        resetMobilePhotoState,
        clearCountdownTimer,
        closeDecryptTimerFullscreen,
        updateDecryptTimerUI,
        stopBattleMusicUI,
        closeSettingsMenu,
        closeSettingsMenuTab4
      } = ctx;

  function openAsRole(role) {
    if (role === 'admin') {
      setRoleFocus('all');
      switchTab('lobby');
    } else if (role === 'teamA') {
      setRoleFocus('teamA');
      switchTab(gameState.isDecryptPhase ? 'decrypt' : 'quiz');
    } else if (role === 'teamB') {
      setRoleFocus('teamB');
      switchTab(gameState.isDecryptPhase ? 'decrypt' : 'quiz');
    }
  }

  async function openCoordinatorModal(initialTab = 'home') {
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('open');
      modal.classList.add('has-maximized');
      document.body.classList.add('modal-open', 'gmm-modal-open');
      const card = modal.querySelector('.gmm-modal-card');
      if (card) {
        card.classList.add('is-maximized');
      }
      updateHeaderScores();
      updateAllTeamNamesUI();
      switchTab(initialTab, true, true);
    }
    initHostSseListener();
    startHostArtworkPolling();
    await syncHostInitialConnectionState();
    broadcastHostStateToServer();
  }

  function closeCoordinatorModal() {
    if (gameState.isStageMode) {
      exitProjectorStageMode();
    }
    stopHostArtworkPolling();
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeTeamFullscreen === 'function') {
      window.GiaiMaArtworkScanner.closeTeamFullscreen();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.closeMasterFullscreen === 'function') {
      window.GiaiMaTeacherKey.closeMasterFullscreen();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.pauseThemeSong === 'function') {
      window.GiaiMaTeacherKey.pauseThemeSong(true);
    }
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('open');
      modal.classList.remove('has-maximized');
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.decryptTimerInterval);
    }
    document.body.classList.remove('modal-open', 'gmm-modal-open');
  }

  function toggleFullscreen() {
    if (typeof window.toggleFullscreen === 'function') {
      window.toggleFullscreen();
    } else {
      const docEl = document.documentElement;
      if (!document.fullscreenElement) {
        docEl.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  async function resetGame(targetTab = null) {
    if (confirm('Thầy/Cô có chắc chắn muốn đặt lại toàn bộ điểm số, mở khóa lại bài thi trên điện thoại học sinh và bắt đầu ván mới không?')) {
      const savedMatchDuration = gameState.totalMatchSeconds || 120;
      const newSessionId = Math.max(Date.now(), (Number(gameState.sessionId) || 0) + 1);
      gameState.sessionId = newSessionId;
      gameState.newlyUnlocked = { teamA: [], teamB: [] };
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.resetLiveQuizTracking === 'function') {
        window.GiaiMaTeacherKey.resetLiveQuizTracking();
      }

      gameState.teamA.score = 0;
      gameState.teamA.bonusScore = 0;
      gameState.teamA.answers = {};
      gameState.teamA.isLocked = false;
      gameState.teamA.unlockedRegions = [];
      gameState.teamA.coloredRegions = {};
      gameState.teamA.completed = false;
      gameState.teamA.finishTime = null;
      gameState.teamA.finishTimeSeconds = null;
      gameState.teamA.finishTimeFormatted = null;
      gameState.teamA.artworkPhoto = null;
      gameState.teamA.photoTimestamp = null;
      gameState.teamA.hasArtworkPhoto = false;
      gameState.teamA.photoRotation = 0;
      gameState.teamA.photoTilt = 0;
      gameState.teamA.isAiEnhanced = true;
      gameState.teamA.photoViewMode = 'svg';

      gameState.teamB.score = 0;
      gameState.teamB.bonusScore = 0;
      gameState.teamB.answers = {};
      gameState.teamB.isLocked = false;
      gameState.teamB.unlockedRegions = [];
      gameState.teamB.coloredRegions = {};
      gameState.teamB.completed = false;
      gameState.teamB.finishTime = null;
      gameState.teamB.finishTimeSeconds = null;
      gameState.teamB.finishTimeFormatted = null;
      gameState.teamB.artworkPhoto = null;
      gameState.teamB.photoTimestamp = null;
      gameState.teamB.hasArtworkPhoto = false;
      gameState.teamB.photoRotation = 0;
      gameState.teamB.photoTilt = 0;
      gameState.teamB.isAiEnhanced = true;
      gameState.teamB.photoViewMode = 'svg';

      setArtworkViewMode('teamA', 'svg');
      setArtworkViewMode('teamB', 'svg');
      resetTiltAngle('teamA');
      resetTiltAngle('teamB');

      const imgA = document.getElementById('teamA_photoImg');
      const emptyA = document.getElementById('teamA_photoEmpty');
      const contentA = document.getElementById('teamA_photoContent');
      const dotA = document.getElementById('teamA_photoDot');
      if (imgA) {
        imgA.src = '';
        imgA.style.transform = 'rotate(0deg)';
      }
      if (emptyA) emptyA.style.display = 'block';
      if (contentA) contentA.style.display = 'none';
      if (dotA) dotA.style.display = 'none';

      const imgB = document.getElementById('teamB_photoImg');
      const emptyB = document.getElementById('teamB_photoEmpty');
      const contentB = document.getElementById('teamB_photoContent');
      const dotB = document.getElementById('teamB_photoDot');
      if (imgB) {
        imgB.src = '';
        imgB.style.transform = 'rotate(0deg)';
      }
      if (emptyB) emptyB.style.display = 'block';
      if (contentB) contentB.style.display = 'none';
      if (dotB) dotB.style.display = 'none';

      // Đặt lại hiệu ứng viền vàng kim và con dấu duyệt tranh 2 đội
      ['teamA', 'teamB'].forEach(tKey => {
        const c = document.getElementById(`${tKey}_canvasContainer`);
        if (c) c.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
        const panel = c ? c.closest('.gmm-canvas-panel') : null;
        if (panel) panel.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
        const stamp = document.getElementById(`${tKey}_goldStamp`);
        if (stamp) stamp.remove();
        const btn = document.getElementById(tKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
        if (btn) {
          btn.classList.remove('approved');
          btn.disabled = false;
        }
        const undo = document.getElementById(`${tKey}_undoJudgeBtn`);
        if (undo) undo.style.display = 'none';
        const sel = document.getElementById(`${tKey}_customScoreSelect`);
        if (sel) {
          sel.disabled = false;
          sel.value = '10';
        }
        gameState[tKey].selectedBonusScore = 10;
      });

      if (typeof resetMobilePhotoState === 'function') resetMobilePhotoState();
      document.querySelectorAll('.gmm-mob-upload-success').forEach(el => { el.style.display = 'none'; });
      if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeTeamFullscreen === 'function') {
        window.GiaiMaArtworkScanner.closeTeamFullscreen();
      }

      if (typeof clearCountdownTimer === 'function') clearCountdownTimer();
      gameState.isCountdownRunning = false;
      const hostCd = document.getElementById('gmmHostCountdownOverlay');
      if (hostCd) hostCd.style.display = 'none';

      gameState.currentQIndex = 0;
      gameState.isMatchStarted = false;
      gameState.isTimerRunning = false;
      gameState.totalMatchSeconds = savedMatchDuration;
      gameState.timerSeconds = savedMatchDuration;
      gameState.isQuestionLocked = false;
      gameState.isAnswerRevealed = false;
      gameState.isDecryptPhase = false;
      gameState.decryptTimeTotal = 300;
      gameState.decryptTimeLeft = 300;
      gameState.isDecryptTimerRunning = false;
      closeDecryptTimerFullscreen();
      updateDecryptTimerUI();
      const btnStartDec = document.getElementById('gmmBtnStartDecrypt');
      if (btnStartDec) btnStartDec.textContent = '🚀 Bắt Đầu (5p)';
      [180, 300, 420].forEach(s => {
        const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
        if (btn) btn.classList.toggle('primary', s === 300);
        const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
        if (fsBtn) fsBtn.classList.toggle('active', s === 300);
      });
      stopBattleMusicUI(0.8);
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.decryptTimerInterval);

      closeSettingsMenu();
      closeSettingsMenuTab4();
      updateHeaderScores();
      updateAllTeamNamesUI();

      // Nếu đang ở Tab Đấu trường hoặc 2 điện thoại đã kết nối sẵn -> chuyển thẳng tới Tab 3 để Thầy/Cô bấm Bắt Đầu Ván Mới ngay!
      const hasConnectedPhones = Boolean(gameState.connectedTeams && (gameState.connectedTeams.teamA || gameState.connectedTeams.teamB));
      const nextTab = targetTab || ((gameState.activeTab === 'quiz' || hasConnectedPhones) ? 'quiz' : 'home');
      switchTab(nextTab, true, true);

      // Bước 1: Gửi lệnh Reset đồng bộ kèm sessionId mới lên máy chủ TRƯỚC (phát SSE gmm_reset xóa kết quả cũ trên điện thoại)
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        try {
          const resetRes = await fetch('/api/gmm/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: newSessionId,
              roomCode: gameState.roomCode,
              totalMatchSeconds: savedMatchDuration,
              keepConnectedTeams: true,
              status: nextTab === 'quiz' ? 'quiz_waiting' : 'lobby'
            })
          });
          if (resetRes && resetRes.ok) {
            const resetJson = await resetRes.json();
            if (resetJson && resetJson.sessionId) {
              gameState.sessionId = resetJson.sessionId;
            }
          }
        } catch (_e) {}

        // Bước 2: Phát trạng thái mới sạch sẽ xuống toàn bộ thiết bị
        await broadcastHostStateToServer({ forceTeamOverwrite: true });
      }

      if (typeof window.showToast === 'function') {
        window.showToast('🔄 Đã đặt lại ván mới thành công! Điện thoại 2 đội đã xóa kết quả cũ và sẵn sàng thi đấu.', 'success');
      }
    }
  }

      return {
        openAsRole,
        openCoordinatorModal,
        closeCoordinatorModal,
        toggleFullscreen,
        resetGame
      };
    }
  };
})();
