/**
 * ==============================================================================
 * MODULE TRÒ CHƠI TƯƠNG TÁC: GIẢI MÃ BÍ MẬT – NGÔI TRƯỜNG HẠNH PHÚC
 * File: scripts/giaiMaBiMat.js
 * Quản lý: Đấu trí 2 Đội A & B, 10 Câu hỏi trắc nghiệm kỹ năng sống,
 * Hiển thị Tọa độ ô màu bí mật mở khóa bảng giấy A1,
 * Cơ chế tranh SVG tô màu & Giải mã biểu tượng bí mật:
 *   - Đội 1 (Đội A): "Ngôi trường hạnh phúc không bạo lực"
 *   - Đội 2 (Đội B): "Trái tim thấu cảm – Tự tin tỏa sáng"
 * Thang điểm: Tối đa 20 điểm (10đ trắc nghiệm + 10đ tô màu giải mã giấy A1).
 * Tính năng nâng cao:
 *   1. Đồng bộ thời gian thực SSE (Server-Sent Events) cho học sinh dùng điện thoại trả lời riêng
 *   2. Xuất / Nhập / Tải file mẫu 10 câu hỏi qua Excel (.xlsx) & CSV với SheetJS
 * ==============================================================================
 */

(function () {
  'use strict';

  const DEFAULT_QUESTIONS = (window.GmmQuestionBank && window.GmmQuestionBank.DEFAULT_QUESTIONS) || [];
  // 2. KHỞI TẠO STATE TRÒ CHƠI
  const STORAGE_KEY_STEALTH_MODE = 'gmm_stealth_mode';
  const STORAGE_KEY_TEAM_NAMES = 'gmm_custom_team_names_v1';
  const STORAGE_KEY_CANVAS_THEME = 'gmm_canvas_theme_v1';

  function getInitialCanvasTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CANVAS_THEME);
      if (saved === 'dark' || saved === 'paper') return saved;
      return 'paper'; // Mặc định Nền Giấy Trắng A1 Tương Phản Cao để học sinh nhìn rõ từ xa khi chiếu lên TV/máy chiếu
    } catch (_e) {
      return 'paper';
    }
  }

  function getInitialStealthMode() {
    // Mặc định luôn hiện đầy đủ mã chữ số trên tranh để học sinh định vị tọa độ tô màu
    return false;
  }

  function loadSavedTeamNames() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEAM_NAMES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            teamA: (parsed.teamA && String(parsed.teamA).trim()) || 'ĐOÀN KẾT',
            teamB: (parsed.teamB && String(parsed.teamB).trim()) || 'LA BÀN TUỔI TRẺ'
          };
        }
      }
    } catch (_e) {}
    return { teamA: 'ĐOÀN KẾT', teamB: 'LA BÀN TUỔI TRẺ' };
  }

  const initialTeamNames = loadSavedTeamNames();

  let gameState = {
    sessionId: Date.now(),
    roomCode: '2011-THCS',
    activeTab: 'home',
    roleFocus: 'all', // 'all' (BGK song song), 'teamA', 'teamB'
    canvasTheme: getInitialCanvasTheme(), // 'paper' (Nền Giấy Trắng A1 Tương Phản Cao Chiếu TV) | 'dark'
    isStealthMode: getInitialStealthMode(),
    isStageMode: false, // Chế độ Sân Khấu Máy Chiếu (ẩn nút kỹ thuật, phóng to đồ họa)
    currentQIndex: 0,
    totalMatchSeconds: 120, // Mặc định 2 phút phần thi trắc nghiệm (120 giây)
    timerSeconds: 120,
    timerMax: 120,
    isMatchStarted: false,
    isCountdownRunning: false,
    isTimerRunning: false,
    timerInterval: null,
    isQuestionLocked: false,
    isAnswerRevealed: false,
    isDecryptPhase: false,
    decryptTimeTotal: 300, // Mặc định 5 phút cho phần thi tô màu tranh (300 giây)
    decryptTimeLeft: 300,
    isDecryptTimerRunning: false,
    decryptTimerInterval: null,
    autoFullscreenArtwork: true,
    isDecryptTimerFullscreenOpen: false,
    autoFsOnTimerStart: false,
    selectedColorA: '#ef4444',
    selectedColorB: '#3b82f6',
    teamA: {
      name: initialTeamNames.teamA,
      symbolTitle: 'Ngôi trường hạnh phúc không bạo lực',
      score: 0,
      bonusScore: 0,
      answers: {},
      isLocked: false,
      unlockedRegions: [],
      coloredRegions: {},
      completed: false,
      finishTime: null,
      artworkPhoto: null,
      photoTimestamp: null,
      photoRotation: 0,
      photoTilt: 0,
      isAiEnhanced: true,
      photoViewMode: 'svg'
    },
    teamB: {
      name: initialTeamNames.teamB,
      symbolTitle: 'Trái tim thấu cảm – Tự tin tỏa sáng',
      score: 0,
      bonusScore: 0,
      answers: {},
      isLocked: false,
      unlockedRegions: [],
      coloredRegions: {},
      completed: false,
      finishTime: null,
      artworkPhoto: null,
      photoTimestamp: null,
      photoRotation: 0,
      photoTilt: 0,
      isAiEnhanced: true,
      photoViewMode: 'svg'
    },
    editingQIndex: 0
  };

  let questionsList = [...DEFAULT_QUESTIONS];
  let isStudentMobileClient = false;
  let studentTeamKey = 'teamA'; // 'teamA' hoặc 'teamB'


  // 4. ĐIỀU KHIỂN ĐỒNG HỒ & CÂU HỎI
  function startQuestion(index) {
    if (index < 0 || index >= questionsList.length) return;
    gameState.currentQIndex = index;
    const q = questionsList[index];

    gameState.timerSeconds = q.time || 30;
    gameState.timerMax = gameState.timerSeconds;
    gameState.isTimerRunning = true;
    gameState.isQuestionLocked = false;
    gameState.isAnswerRevealed = false;

    const btnPause = document.getElementById('gmmBtnPause');
    if (btnPause) btnPause.innerHTML = '<span>⏸️ Tạm Dừng</span>';

    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
      if (!gameState.isTimerRunning) return;
      if (gameState.timerSeconds > 0) {
        gameState.timerSeconds--;
        updateTimerDisplay();

        // Âm thanh đếm ngược trong 5 giây cuối
        if (gameState.timerSeconds <= 5 && gameState.timerSeconds > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(gameState.timerSeconds);
          }
        }

        if (gameState.timerSeconds === 0) {
          clearInterval(gameState.timerInterval);
          gameState.isTimerRunning = false;
          lockAnswer();
          if (window.audioManager && typeof window.audioManager.playTimerBuzzer === 'function') {
            window.audioManager.playTimerBuzzer();
          }
          if (typeof window.showToast === 'function') {
            window.showToast('⏰ Hết thời gian trả lời câu hỏi!', 'warning');
          }
        }
      }
    }, 1000);

    renderQuestionUI();
    updateTimerDisplay();
    broadcastHostStateToServer();
  }

  function pauseTimer() {
    gameState.isTimerRunning = !gameState.isTimerRunning;
    const btn = document.getElementById('gmmBtnPause');
    if (btn) {
      btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
    }
    broadcastHostStateToServer();
  }

  function lockAnswer() {
    if (gameState.isQuestionLocked) return; // Chống cộng điểm lặp
    gameState.isQuestionLocked = true;
    clearInterval(gameState.timerInterval);
    gameState.isTimerRunning = false;

    // Chấm điểm cho từng đội
    const currentQ = questionsList[gameState.currentQIndex];
    const correctIdx = currentQ.correct;

    const toastMsgs = [];
    const coordLabel = currentQ.coordinate || `Ô số ${gameState.currentQIndex + 1}`;
    ['teamA', 'teamB'].forEach(tKey => {
      const teamAns = gameState[tKey].answers[currentQ.id];
      if (teamAns === correctIdx) {
        // Đúng: +1 điểm và mở khóa mảng tranh
        gameState[tKey].score += 1;
        if (!gameState[tKey].unlockedRegions.includes(currentQ.regionId)) {
          gameState[tKey].unlockedRegions.push(currentQ.regionId);
          triggerPulseGlow(tKey, currentQ.regionId);
        }
        toastMsgs.push(`✨ ${gameState[tKey].name}: Đúng (+1đ, mở khóa ${coordLabel} ➔ Tô giấy A1)`);
      } else {
        toastMsgs.push(`❌ ${gameState[tKey].name}: Chưa chính xác`);
      }
    });

    updateHeaderScores();
    renderQuestionUI();
    renderDecryptUI();
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function' && toastMsgs.length > 0) {
      window.showToast(toastMsgs.join(' | '), 'info');
    }
  }

  function showCorrectAnswer() {
    gameState.isAnswerRevealed = true;
    renderQuestionUI();
    broadcastHostStateToServer();

    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  function nextQuestion() {
    if (gameState.currentQIndex < questionsList.length - 1) {
      startQuestion(gameState.currentQIndex + 1);
    } else {
      // Đã xong 10 câu -> Giữ nguyên ở Tab 3, thông báo hoàn thành để Giáo viên tự mở sang Tab 4 khi sẵn sàng
      if (typeof window.showToast === 'function') {
        window.showToast('🎉 ĐÃ HOÀN THÀNH 10 CÂU HỎI! Thầy/Cô vui lòng mở sang Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.', 'success');
      }
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }

  // Chọn đáp án riêng cho từng đội (teamA / teamB)
  function chooseAnswer(teamKey, optionIdx, isRemote = false) {
    if (gameState.isQuestionLocked) {
      if (!isRemote && typeof window.showToast === 'function') {
        window.showToast('🔒 Câu hỏi đã chốt đáp án, không thể thay đổi!', 'warning');
      }
      return;
    }
    const currentQ = questionsList[gameState.currentQIndex];
    if (!currentQ) return;

    gameState[teamKey].answers[currentQ.id] = optionIdx;

    if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
      window.audioManager.playPointerSpringSnap();
    }

    renderQuestionUI();

    // Nếu chọn từ máy chiếu, cập nhật đồng bộ lên Server
    if (!isRemote) {
      broadcastHostStateToServer();
    }
  }

  // 5. GIAI ĐOẠN TÔ MÀU & GIẢI MÃ BÍ MẬT

  // Ban Giám Khảo phát hiệu lệnh bắt đầu thi đấu từ Phòng Chờ Tab 2
  function startGameFromLobby() {
    if (gameState.isCountdownRunning) return;

    const isResumePausedMatch = Boolean(
      gameState.isMatchStarted &&
      !(gameState.teamA?.isLocked && gameState.teamB?.isLocked)
    );
    if (!isResumePausedMatch) {
      prepareFreshMatchSession();
    }

    gameState.isCountdownRunning = true;

    // Phát sóng trạng thái đếm ngược để cả 2 điện thoại cùng kích hoạt 3..2..1.. Chiến!
    broadcastCountdownState(3, { resetForNewMatch: !isResumePausedMatch });

    // Kích hoạt hiệu ứng đếm ngược trực quan 3..2..1.. CHIẾN! trên máy chiếu
    runCountdownAnimation(3, () => {
      gameState.isCountdownRunning = false;
      if (typeof window.showToast === 'function') {
        window.showToast('🚀 ĐÃ PHÁT HIỆU LỆNH! Trò chơi chính thức bắt đầu!', 'success');
      }
      // Chuyển sang Tab 3 (Đấu trường 10 câu hỏi), khởi chạy đồng hồ và phát sóng SSE
      switchTab('quiz', true, true);
      startDualMatch({ forceTeamOverwrite: !isResumePausedMatch });
    });
  }

  // Ban Giám Khảo tạm thu hồi 2 đội về lại Phòng Chờ để xử lý sự cố thiết bị/mạng
  function recallToLobby() {
    if (!confirm('Thầy/Cô có muốn tạm thu hồi 2 đội về Phòng Chờ không?\n\n(Dữ liệu điểm số, câu trả lời đã làm và kết nối của 2 đội vẫn được giữ nguyên an toàn)')) {
      return;
    }

    // Dừng toàn bộ đồng hồ câu hỏi
    clearInterval(gameState.timerInterval);
    gameState.isTimerRunning = false;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});

    // Chuyển màn hình máy tính về Tab 2 (Phòng chờ)
    switchTab('lobby');

    // Cập nhật nhãn nút bắt đầu thành "TIẾP TỤC TRÒ CHƠI"
    const btnStart = document.getElementById('gmmBtnStartGame');
    if (btnStart) {
      btnStart.innerHTML = `<span>🚀 TIẾP TỤC TRÒ CHƠI (CÂU ${gameState.currentQIndex + 1})</span>`;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`↩️ Đã thu hồi về phòng chờ thành công! Dữ liệu câu ${gameState.currentQIndex + 1} được bảo lưu an toàn.`, 'info');
    }

    // Phát sóng trạng thái 'lobby' xuống điện thoại của 2 đội
    broadcastHostStateToServer();
  }

  // 10. CHUYỂN TAB VÀ MODAL BAN GIÁM KHẢO
  function switchTab(tabId, force = false, skipBroadcast = false) {
    if (tabId === 'lobby') {
      tabId = 'home';
    }
    // Cảnh báo an toàn khi click chuyển tab trong lúc trận đấu 10 câu hỏi đang đếm ngược
    if (!force && gameState.activeTab === 'quiz' && tabId !== 'quiz') {
      const isMatchRunning = gameState.isMatchStarted && gameState.isTimerRunning && (gameState.timerSeconds || 0) > 0;
      if (isMatchRunning) {
        const confirmLeave = confirm(
          '⚠️ CẢNH BÁO AN TOÀN TRẬN ĐẤU!\n\n' +
          'Trận đấu 10 câu hỏi đang diễn ra và đồng hồ vẫn đang đếm ngược trên máy chiếu.\n' +
          'Nếu chuyển sang Tab khác, màn hình máy chiếu sẽ đổi giao diện trong khi học sinh vẫn đang làm bài trên điện thoại.\n\n' +
          'Thầy/Cô có chắc chắn muốn rời khỏi Đấu Trường không?'
        );
        if (!confirmLeave) return;
      }
    }

    // Nếu đang ở Chế độ Sân Khấu Máy Chiếu mà rời tab quiz, tự động hoàn trả giao diện chuẩn
    if (gameState.isStageMode && tabId !== 'quiz') {
      exitProjectorStageMode();
    }

    gameState.activeTab = tabId;

    document.querySelectorAll('.gmm-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.gmm-tab-panel').forEach(p => {
      p.classList.remove('active');
    });

    const activePanel = document.getElementById(`gmmPanel_${tabId}`);
    if (activePanel) activePanel.classList.add('active');

    if (tabId === 'home') renderQrCodes();
    if (tabId === 'quiz') renderDualArena();
    if (tabId === 'decrypt') {
      renderDecryptUI();
      updateDecryptTimerUI();
      pollServerArtworksOnce();
    }
    if (tabId === 'answer_key') {
      pollServerArtworksOnce();
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
        window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
      }
    } else {
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.pauseThemeSong === 'function') {
        window.GiaiMaTeacherKey.pauseThemeSong(true);
      }
    }
    if (tabId === 'result') renderResultUI();
    if (tabId === 'settings' && gmmStageTeamUiMod) {
      gmmStageTeamUiMod.updateStealthButtonUI();
      gmmStageTeamUiMod.updateCanvasThemeButtonUI();
      gmmStageTeamUiMod.updateBattleMusicUI();
      gmmStageTeamUiMod.updateSettingsSummaryBar();
    }

    if (!skipBroadcast) {
      broadcastHostStateToServer();
    }
  }

  // ==============================================================================
  // CHẾ ĐỘ 1 CHẠM: SÂN KHẤU MÁY CHIẾU (PROJECTOR STAGE VIEW)
  // Ẩn toàn bộ nút bấm kỹ thuật của giáo viên, phóng to tối đa ma trận & câu hỏi
  // ==============================================================================


  // ============================================================================
  // KHỞI TẠO & LIÊN KẾT TOÀN BỘ MÔ-ĐUN CON (< 800 DÒNG/TỆP)
  // ============================================================================
  const mobileState = {
    wasInLobby: true,
    sessionId: null,
    syncPollInterval: null,
    sseSource: null,
    isLifecycleBound: false,
    lastStateFingerprint: '',
    lastJoinAnnounceAt: 0,
    questionsList: [],
    activeQIndex: 0,
    teamAnswers: {},
    isLocked: false,
    finishTimeFormatted: '',
    finishTimeSeconds: 0,
    totalSeconds: 300,
    remainingSeconds: 300,
    timerInterval: null,
    decryptRemainingSeconds: 180,
    decryptTotalSeconds: 180,
    isDecryptTimerRunning: false,
    decryptTimerInterval: null,
    autoAdvanceTimer: null,
    isSwipeBound: false,
    isReviewMode: false,
    audioCtx: null,
    pendingSyncQueue: [],
    mistakesFilterType: 'all',
    currentColor: '#ef4444'
  };

  let gmmExportMod = null;
  let gmmHostArenaMod = null;
  let gmmHostSseMod = null;
  let gmmMobileOfflineMod = null;
  let gmmMobileSyncMod = null;
  let gmmMobileQuizUiMod = null;
  let gmmMobileArtworkMod = null;
  let gmmLobbyQrMod = null;
  let gmmQuestionBankMod = null;
  let gmmArtworkHostMod = null;
  let gmmDecryptJudgeMod = null;
  let gmmStageTeamUiMod = null;
  let gmmCoordinatorMod = null;

  function initSubModules() {
    if (gmmExportMod) return;
    const sharedCtx = {
      gameState,
      mobileState,
      DEFAULT_QUESTIONS,
      STORAGE_KEY_STEALTH_MODE,
      STORAGE_KEY_TEAM_NAMES,
      STORAGE_KEY_CANVAS_THEME,
      getQuestionsList: () => questionsList,
      setQuestionsList: (nextList) => { if (Array.isArray(nextList)) questionsList = nextList; },
      isStudentMobile: () => isStudentMobileClient,
      getStudentTeamKey: () => studentTeamKey,
      setStudentMobile: (flag, tKey) => {
        isStudentMobileClient = Boolean(flag);
        if (tKey) studentTeamKey = tKey;
      },
      // Cross-module bridges
      generateSvgPuzzle: (...a) => gmmStageTeamUiMod.generateSvgPuzzle(...a),
      triggerPulseGlow: (...a) => gmmStageTeamUiMod.triggerPulseGlow(...a),
      updateStealthButtonUI: (...a) => gmmStageTeamUiMod.updateStealthButtonUI(...a),
      updateStageFloatPauseBtn: (...a) => gmmStageTeamUiMod.updateStageFloatPauseBtn(...a),
      updateCanvasThemeButtonUI: (...a) => gmmStageTeamUiMod.updateCanvasThemeButtonUI(...a),
      updateSettingsSummaryBar: (...a) => gmmStageTeamUiMod.updateSettingsSummaryBar(...a),
      getTeamName: (...a) => gmmStageTeamUiMod.getTeamName(...a),
      updateAllTeamNamesUI: (...a) => gmmStageTeamUiMod.updateAllTeamNamesUI(...a),
      stopBattleMusicUI: (...a) => gmmStageTeamUiMod.stopBattleMusicUI(...a),
      exitProjectorStageMode: (...a) => gmmStageTeamUiMod.exitProjectorStageMode(...a),
      closeSettingsMenu: (...a) => gmmStageTeamUiMod.closeSettingsMenu(...a),
      closeSettingsMenuTab4: (...a) => gmmStageTeamUiMod.closeSettingsMenuTab4(...a),
      setRoleFocus: (...a) => gmmStageTeamUiMod.setRoleFocus(...a),
      setArtworkViewMode: (...a) => gmmArtworkHostMod.setArtworkViewMode(...a),
      resetTiltAngle: (...a) => gmmArtworkHostMod.resetTiltAngle(...a),
      attachTeamArtworkPhoto: (...a) => gmmArtworkHostMod.attachTeamArtworkPhoto(...a),
      renderTransformedCanvas: (...a) => gmmArtworkHostMod.renderTransformedCanvas(...a),
      compressImageClient: (...a) => gmmArtworkHostMod.compressImageClient(...a),
      renderZoomModalContent: (...a) => gmmArtworkHostMod.renderZoomModalContent(...a),
      getActiveZoomTeam: () => (gmmArtworkHostMod && gmmArtworkHostMod.getActiveZoomTeam ? gmmArtworkHostMod.getActiveZoomTeam() : 'teamA'),
      startHostArtworkPolling: (...a) => gmmArtworkHostMod.startHostArtworkPolling(...a),
      stopHostArtworkPolling: (...a) => gmmArtworkHostMod.stopHostArtworkPolling(...a),
      updateDecryptTimerUI: (...a) => gmmDecryptJudgeMod.updateDecryptTimerUI(...a),
      closeDecryptTimerFullscreen: (...a) => gmmDecryptJudgeMod.closeDecryptTimerFullscreen(...a),
      handleRegionClick: (...a) => gmmDecryptJudgeMod.handleRegionClick(...a),
      updateProgressBar: (...a) => gmmDecryptJudgeMod.updateProgressBar(...a),
      renderDualArena: (...a) => gmmHostArenaMod.renderDualArena(...a),
      renderQuestionUI: (...a) => gmmHostArenaMod.renderQuestionUI(...a),
      renderDecryptUI: (...a) => gmmHostArenaMod.renderDecryptUI(...a),
      updateHeaderScores: (...a) => gmmHostArenaMod.updateHeaderScores(...a),
      formatMinutesSeconds: (...a) => gmmHostArenaMod.formatMinutesSeconds(...a),
      applyTeamUnlockOnHost: (...a) => gmmHostArenaMod.applyTeamUnlockOnHost(...a),
      recalculateTeamScore: (...a) => gmmHostArenaMod.recalculateTeamScore(...a),
      updateMatchTimerUI: (...a) => gmmHostArenaMod.updateMatchTimerUI(...a),
      handleMatchConclusion: (...a) => gmmHostArenaMod.handleMatchConclusion(...a),
      broadcastHostStateToServer: (...a) => gmmHostSseMod.broadcastHostStateToServer(...a),
      broadcastCountdownState: (...a) => gmmHostSseMod.broadcastCountdownState(...a),
      initHostSseListener: (...a) => gmmHostSseMod.initHostSseListener(...a),
      syncHostInitialConnectionState: (...a) => gmmHostSseMod.syncHostInitialConnectionState(...a),
      requestScreenWakeLock: (...a) => gmmHostSseMod.requestScreenWakeLock(...a),
      runCountdownAnimation: (...a) => gmmHostSseMod.runCountdownAnimation(...a),
      clearCountdownTimer: (...a) => gmmHostSseMod.clearCountdownTimer(...a),
      announceMobileJoinToServer: (...a) => gmmMobileOfflineMod.announceMobileJoinToServer(...a),
      startMobileStatePolling: (...a) => gmmMobileOfflineMod.startMobileStatePolling(...a),
      bindMobileLifecycleSync: (...a) => gmmMobileOfflineMod.bindMobileLifecycleSync(...a),
      getMobileStorageKey: (...a) => gmmMobileOfflineMod.getMobileStorageKey(...a),
      loadMobileAnswersFromLocal: (...a) => gmmMobileOfflineMod.loadMobileAnswersFromLocal(...a),
      saveMobileAnswersToLocal: (...a) => gmmMobileOfflineMod.saveMobileAnswersToLocal(...a),
      flushPendingSyncQueue: (...a) => gmmMobileOfflineMod.flushPendingSyncQueue(...a),
      addToPendingSyncQueue: (...a) => gmmMobileOfflineMod.addToPendingSyncQueue(...a),
      updateSyncStatusBadge: (...a) => gmmMobileOfflineMod.updateSyncStatusBadge(...a),
      fetchCurrentServerState: (...a) => gmmMobileSyncMod.fetchCurrentServerState(...a),
      connectStudentSSE: (...a) => gmmMobileSyncMod.connectStudentSSE(...a),
      applyServerStateToMobile: (...a) => gmmMobileSyncMod.applyServerStateToMobile(...a),
      resetMobileClientState: (...a) => gmmMobileSyncMod.resetMobileClientState(...a),
      stopMobileDecryptTicker: (...a) => gmmMobileSyncMod.stopMobileDecryptTicker(...a),
      updateMobileLobbyTeamsStatus: (...a) => gmmMobileQuizUiMod.updateMobileLobbyTeamsStatus(...a),
      updateMobileTimerUI: (...a) => gmmMobileQuizUiMod.updateMobileTimerUI(...a),
      renderMobileQuestionPalette: (...a) => gmmMobileQuizUiMod.renderMobileQuestionPalette(...a),
      renderCurrentMobileQuestion: (...a) => gmmMobileQuizUiMod.renderCurrentMobileQuestion(...a),
      autoLockMobileTeam: (...a) => gmmMobileQuizUiMod.autoLockMobileTeam(...a),
      jumpMobileToFirstUnanswered: (...a) => gmmMobileQuizUiMod.jumpMobileToFirstUnanswered(...a),
      updateMobileDecryptTimerUI: (...a) => gmmMobileArtworkMod.updateMobileDecryptTimerUI(...a),
      updateMobileFinishArtworkUI: (...a) => gmmMobileArtworkMod.updateMobileFinishArtworkUI(...a),
      renderMobilePaintView: (...a) => gmmMobileArtworkMod.renderMobilePaintView(...a),
      renderLockedSuccessCard: (...a) => gmmMobileArtworkMod.renderLockedSuccessCard(...a),
      submitPaintFromMobile: (...a) => gmmMobileArtworkMod.submitPaintFromMobile(...a),
      resetMobilePhotoState: (...a) => gmmMobileArtworkMod.resetMobilePhotoState(...a),
      closeMistakesReviewModal: (...a) => gmmMobileArtworkMod.closeMistakesReviewModal(...a),
      chooseAnswer,
      switchTab
    };

    gmmStageTeamUiMod = window.GmmStageTeamUi.create(sharedCtx);
    gmmDecryptJudgeMod = window.GmmDecryptJudge.create(sharedCtx);
    gmmLobbyQrMod = window.GmmLobbyQr.create(sharedCtx);
    gmmQuestionBankMod = window.GmmQuestionBank.create(sharedCtx);
    gmmArtworkHostMod = window.GmmArtworkHost.create(sharedCtx);
    gmmExportMod = window.GmmExport.create(sharedCtx);
    gmmHostSseMod = window.GmmHostSse.create(sharedCtx);
    gmmHostArenaMod = window.GmmHostArena.create(sharedCtx);
    gmmMobileArtworkMod = window.GmmMobileArtwork.create(sharedCtx);
    gmmMobileQuizUiMod = window.GmmMobileQuizUi.create(sharedCtx);
    gmmMobileSyncMod = window.GmmMobileSync.create(sharedCtx);
    gmmMobileOfflineMod = window.GmmMobileOffline.create(sharedCtx);
    gmmCoordinatorMod = window.GmmCoordinator.create(sharedCtx);
  }

  // Các hàm được lõi giaiMaBiMat.js & phím tắt ESC gọi trực tiếp
  function renderDualArena(...a) { return gmmHostArenaMod.renderDualArena(...a); }
  function prepareFreshMatchSession(...a) { return gmmHostArenaMod.prepareFreshMatchSession(...a); }
  function startDualMatch(...a) { return gmmHostArenaMod.startDualMatch(...a); }
  function updateTimerDisplay(...a) { return gmmHostArenaMod.updateTimerDisplay(...a); }
  function updateHeaderScores(...a) { return gmmHostArenaMod.updateHeaderScores(...a); }
  function renderQuestionUI(...a) { return gmmHostArenaMod.renderQuestionUI(...a); }
  function renderDecryptUI(...a) { return gmmHostArenaMod.renderDecryptUI(...a); }
  function renderResultUI(...a) { return gmmHostArenaMod.renderResultUI(...a); }
  function broadcastHostStateToServer(...a) { return gmmHostSseMod.broadcastHostStateToServer(...a); }
  function runCountdownAnimation(...a) { return gmmHostSseMod.runCountdownAnimation(...a); }
  function broadcastCountdownState(...a) { return gmmHostSseMod.broadcastCountdownState(...a); }
  function renderQrCodes(...a) { return gmmLobbyQrMod.renderQrCodes(...a); }
  function pollServerArtworksOnce(...a) { return gmmArtworkHostMod.pollServerArtworksOnce(...a); }
  function closeZoomModal(...a) { return gmmArtworkHostMod.closeZoomModal(...a); }
  function switchZoomTeam(...a) { return gmmArtworkHostMod.switchZoomTeam(...a); }
  function toggleZoomSplitView(...a) { return gmmArtworkHostMod.toggleZoomSplitView(...a); }
  function closeExportModal(...a) { return gmmExportMod.closeExportModal(...a); }
  function closeQuestionEditor(...a) { return gmmQuestionBankMod.closeQuestionEditor(...a); }
  function closeMistakesReviewModal(...a) { return gmmMobileArtworkMod.closeMistakesReviewModal(...a); }
  function triggerPulseGlow(...a) { return gmmStageTeamUiMod.triggerPulseGlow(...a); }
  function toggleProjectorStageMode(...a) { return gmmStageTeamUiMod.toggleProjectorStageMode(...a); }
  function exitProjectorStageMode(...a) { return gmmStageTeamUiMod.exitProjectorStageMode(...a); }
  function closeSettingsMenu(...a) { return gmmStageTeamUiMod.closeSettingsMenu(...a); }
  function closeSettingsMenuTab4(...a) { return gmmStageTeamUiMod.closeSettingsMenuTab4(...a); }
  function closeDecryptTimerFullscreen(...a) { return gmmDecryptJudgeMod.closeDecryptTimerFullscreen(...a); }
  function updateDecryptTimerUI(...a) { return gmmDecryptJudgeMod.updateDecryptTimerUI(...a); }
  function initStudentMobileArena(...a) { return gmmMobileQuizUiMod.initStudentMobileArena(...a); }
  function openCoordinatorModal(...a) { return gmmCoordinatorMod.openCoordinatorModal(...a); }
  function closeCoordinatorModal(...a) { return gmmCoordinatorMod.closeCoordinatorModal(...a); }

  initSubModules();
  gmmQuestionBankMod.loadQuestionsFromStorage();
  if (gmmStageTeamUiMod && typeof gmmStageTeamUiMod.loadSavedDefaultSettings === 'function') {
    gmmStageTeamUiMod.loadSavedDefaultSettings();
  }


  // Kiểm tra tham số URL khi trang tải (nếu học sinh quét mã QR truy cập thẳng)
  function checkUrlQueryParams() {
    try {
      const params = new window.URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      const teamParam = params.get('team'); // 'A' hoặc 'B'

      if (gameParam === 'giai_ma_bi_mat') {
        if (teamParam === 'A' || teamParam === 'B') {
          // Khóa giao diện chỉ hiển thị Mobile Arena cho học sinh ngay lập tức
          document.documentElement.classList.add('gmm-student-mode');
          document.body.classList.add('gmm-student-mode');
          setTimeout(() => {
            initStudentMobileArena(teamParam === 'A' ? 'teamA' : 'teamB');
          }, 50);
        } else {
          // Mở modal trên máy tính
          setTimeout(() => {
            openCoordinatorModal('home');
          }, 500);
        }
      }
    } catch (_e) {}
  }

  // Lắng nghe phím bấm Escape và phím tắt điều khiển
  document.addEventListener('keydown', (e) => {
    // Phím tắt P bật/tắt Chế độ Sân Khấu Máy Chiếu trong Tab Đấu trường
    if ((e.key === 'p' || e.key === 'P') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      const modal = document.getElementById('giaiMaBiMatModal');
      if (modal && (modal.classList.contains('active') || modal.classList.contains('open')) && gameState.activeTab === 'quiz') {
        e.preventDefault();
        toggleProjectorStageMode();
        return;
      }
    }

    if (e.key === 'Escape') {
      // Ưu tiên 0: Đóng Sân khấu Đồng Hồ Đếm Ngược Full Màn Hình nếu đang mở
      const timerFsModal = document.getElementById('gmmDecryptTimerFullscreenModal');
      if (timerFsModal && timerFsModal.style.display !== 'none') {
        closeDecryptTimerFullscreen();
        return;
      }
      // Ưu tiên 0b: Đóng Ô Cài Đặt Tab 4 nếu đang mở
      const settingsBoxTab4 = document.getElementById('gmmSettingsBoxTab4');
      if (settingsBoxTab4 && settingsBoxTab4.style.display !== 'none') {
        closeSettingsMenuTab4();
        return;
      }
      // Ưu tiên 0c: Đóng Ô Cài Đặt nếu đang mở
      const settingsBox = document.getElementById('gmmSettingsBox');
      if (settingsBox && settingsBox.style.display !== 'none') {
        closeSettingsMenu();
        return;
      }
      // Ưu tiên 1: Nếu đang ở Chế độ Sân Khấu Máy Chiếu thì thoát Sân Khấu trước
      if (gameState.isStageMode) {
        exitProjectorStageMode();
        return;
      }
      const exportModal = document.getElementById('gmmExportWorksheetModal');
      if (exportModal && exportModal.style.display !== 'none') {
        closeExportModal();
        return;
      }
      const qModal = document.getElementById('gmmQuestionEditModal');
      if (qModal && qModal.style.display !== 'none') {
        closeQuestionEditor();
        return;
      }
      const mistakesModal = document.getElementById('gmmMobMistakesModal');
      if (mistakesModal && mistakesModal.style.display !== 'none') {
        closeMistakesReviewModal();
        return;
      }
      const zoomModal = document.getElementById('gmmPuzzleZoomModal');
      if (zoomModal && zoomModal.style.display !== 'none') {
        if (e.key === 'Escape') {
          closeZoomModal();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          switchZoomTeam();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          toggleZoomSplitView();
          return;
        }
      }
      const modal = document.getElementById('giaiMaBiMatModal');
      if (modal && (modal.classList.contains('active') || modal.classList.contains('open'))) {
        closeCoordinatorModal();
      }
    }
  });



  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUrlQueryParams);
  } else {
    checkUrlQueryParams();
  }

  // EXPORT RA GLOBAL SCOPE (Hợp nhất đầy đủ API công khai của mọi mô-đun con)
  window.GiaiMaBiMat = Object.assign(
    {},
    gmmExportMod,
    gmmHostArenaMod,
    gmmHostSseMod,
    gmmMobileOfflineMod,
    gmmMobileSyncMod,
    gmmMobileQuizUiMod,
    gmmMobileArtworkMod,
    gmmLobbyQrMod,
    gmmQuestionBankMod,
    gmmArtworkHostMod,
    gmmDecryptJudgeMod,
    gmmStageTeamUiMod,
    gmmCoordinatorMod,
    {
      switchTab,
      startGameFromLobby,
      recallToLobby,
      startQuestion,
      pauseTimer,
      lockAnswer,
      showCorrectAnswer,
      nextQuestion,
      chooseAnswer,
      setColorA: (c) => { gameState.selectedColorA = c; },
      setColorB: (c) => { gameState.selectedColorB = c; }
    }
  );
})();
