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

  // 3. RENDER TRANH SVG TƯƠNG TÁC CHO ĐỘI A & B
  function generateSvgPuzzle(teamKey, isSolvedKey = false) {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      const newly = (gameState.newlyUnlocked && gameState.newlyUnlocked[teamKey]) || [];
      return window.GiaiMaPuzzle.renderSvgMatrix(teamKey, gameState[teamKey], {
        isDecryptPhase: gameState.isDecryptPhase,
        isSolvedAnswerKey: isSolvedKey,
        isStealthMode: Boolean(gameState.isStealthMode),
        canvasTheme: gameState.canvasTheme || 'paper',
        isPaperTheme: (gameState.canvasTheme || 'paper') === 'paper',
        newlyUnlocked: newly
      });
    }
    return '<div style="color: #94a3b8; padding: 20px; text-align: center;">Đang khởi tạo ma trận bức tranh...</div>';
  }

  // Tùy chọn chuyển đổi giao diện Bảng Tranh: Nền Giấy Trắng A1 (Chuẩn TV/Máy chiếu) hoặc Nền Tối Sân Khấu
  function toggleCanvasTheme() {
    gameState.canvasTheme = (gameState.canvasTheme === 'paper') ? 'dark' : 'paper';
    try {
      localStorage.setItem(STORAGE_KEY_CANVAS_THEME, gameState.canvasTheme);
    } catch (_e) {}

    updateCanvasThemeButtonUI();
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (typeof renderZoomModalContent === 'function') renderZoomModalContent();

    if (typeof window.showToast === 'function') {
      if (gameState.canvasTheme === 'paper') {
        window.showToast('📄 Đã chuyển sang Nền Giấy Trắng A1 (Tương phản cao - Cực kỳ rõ nét trên Tivi & Máy chiếu)!', 'success');
      } else {
        window.showToast('🌑 Đã chuyển sang Nền Tối Sân Khấu.', 'info');
      }
    }
  }

  function getCanvasTheme() {
    return gameState.canvasTheme || 'paper';
  }

  function updateCanvasThemeButtonUI() {
    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    const btnTab4 = document.getElementById('gmmBtnCanvasThemeTab4');
    const textTab4 = document.getElementById('gmmBtnCanvasThemeText');
    if (btnTab4) {
      if (isPaper) {
        btnTab4.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        btnTab4.style.borderColor = '#fde68a';
        btnTab4.style.color = '#ffffff';
        btnTab4.title = 'Đang bật: Nền Giấy Trắng A1 (Rõ nét trên Tivi/Máy chiếu). Bấm để chuyển sang Nền Tối.';
        if (textTab4) textTab4.textContent = '📄 Nền Giấy A1 (Chiếu TV)';
      } else {
        btnTab4.style.background = 'rgba(30, 41, 59, 0.85)';
        btnTab4.style.borderColor = '#64748b';
        btnTab4.style.color = '#cbd5e1';
        btnTab4.title = 'Đang bật: Nền Tối Sân Khấu. Bấm để chuyển sang Nền Giấy Trắng A1 (Khuyên dùng cho Tivi).';
        if (textTab4) textTab4.textContent = '🌑 Nền Tối Sân Khấu';
      }
    }
    const btnSettings = document.getElementById('gmmBtnCanvasThemeSettings');
    if (btnSettings) {
      btnSettings.innerHTML = isPaper
        ? '<span>📄 Nền Tranh: Giấy Trắng A1 (Đổi sang Nền Tối)</span>'
        : '<span>🌑 Nền Tranh: Nền Tối (Đổi sang Giấy Trắng A1)</span>';
    }
    const zoomBtn = document.getElementById('gmmBtnZoomTheme');
    if (zoomBtn) {
      zoomBtn.textContent = isPaper ? '📄 Nền Giấy A1' : '🌑 Nền Tối';
    }
  }

  // Tùy chọn ẩn bớt mã tọa độ chưa mở khóa (Stealth Matrix Mode)
  function toggleStealthMode() {
    gameState.isStealthMode = !gameState.isStealthMode;
    try {
      localStorage.setItem(STORAGE_KEY_STEALTH_MODE, String(gameState.isStealthMode));
    } catch (_e) {}

    updateStealthButtonUI();
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (typeof renderZoomModalContent === 'function') renderZoomModalContent();

    if (typeof window.showToast === 'function') {
      if (gameState.isStealthMode) {
        window.showToast('🕵️ Đã BẬT Chế độ Ẩn Mã Ô Chưa Mở (Stealth Mode) - Kích thích hồi hộp & tò mò cho cả lớp!', 'info');
      } else {
        window.showToast('👁️ Đã TẮT Chế độ Ẩn Mã Ô: Hiện đầy đủ toàn bộ mã chữ số trên ma trận.', 'info');
      }
    }
  }

  function updateStealthButtonUI() {
    const btns = [
      document.getElementById('gmmBtnStealthMode'),
      document.getElementById('gmmBtnStealthModeTab4')
    ];
    btns.forEach(btn => {
      if (!btn) return;
      if (gameState.isStealthMode) {
        btn.innerHTML = '<span>🕵️ Mã Ô: Đang Ẩn (Bí Mật)</span>';
        btn.classList.add('active');
        btn.title = 'Đang BẬT Chế độ Ẩn Mã Ô: Chỉ hiện mã khi giải đúng. Nhấp để hiện toàn bộ mã chữ số.';
      } else {
        btn.innerHTML = '<span>👁️ Mã Ô: Hiện Hết</span>';
        btn.classList.remove('active');
        btn.title = 'Đang hiện toàn bộ mã chữ số. Nhấp để ẩn bớt các mã ô chưa mở giúp tăng kịch tính!';
      }
    });
  }

  // Hiệu ứng sáng đèn lấp lánh (Pulse Glow Effect) tại ô tranh vừa được giải mã thành công
  function triggerPulseGlow(teamKey, regionId) {
    if (!regionId) return;
    if (!gameState.newlyUnlocked) gameState.newlyUnlocked = { teamA: [], teamB: [] };
    if (!gameState.newlyUnlocked[teamKey]) gameState.newlyUnlocked[teamKey] = [];
    if (!gameState.newlyUnlocked[teamKey].includes(regionId)) {
      gameState.newlyUnlocked[teamKey].push(regionId);
    }

    // Tiếng chuông vàng ngân vang lấp lánh (Magic Chimes) rộn rã trên máy chiếu
    if (window.audioManager) {
      if (typeof window.audioManager.playChime === 'function') {
        window.audioManager.playChime();
      }
    }

    // Vẽ lại ma trận ngay lập tức để ô tranh chớp sáng vàng kim
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (activeZoomTeam === teamKey && typeof renderZoomModalContent === 'function') {
      renderZoomModalContent();
    }

    // Sau 6 giây tự động tắt hiệu ứng lấp lánh, đưa ô về trạng thái mở khóa ổn định
    setTimeout(() => {
      if (gameState.newlyUnlocked && gameState.newlyUnlocked[teamKey]) {
        gameState.newlyUnlocked[teamKey] = gameState.newlyUnlocked[teamKey].filter(id => id !== regionId);
        if (typeof renderDualArena === 'function') renderDualArena();
        if (typeof renderDecryptUI === 'function') renderDecryptUI();
        if (activeZoomTeam === teamKey && typeof renderZoomModalContent === 'function') {
          renderZoomModalContent();
        }
      }
    }, 6000);
  }

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
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
  function setDecryptDuration(seconds) {
    gameState.decryptTimeTotal = seconds;
    gameState.decryptTimeLeft = seconds;

    // Cập nhật các nút preset 3p (180s), 5p (300s), 7p (420s) trên cả thanh điều khiển & sân khấu Fullscreen
    [180, 300, 420].forEach(s => {
      const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
      if (btn) btn.classList.toggle('primary', s === seconds);
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === seconds);
    });

    const mins = Math.round(seconds / 60);
    const btnStart = document.getElementById('gmmBtnStartDecrypt');
    if (btnStart && !gameState.isDecryptTimerRunning) {
      btnStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }
    const btnFsStart = document.getElementById('gmmBtnFsStartDecrypt');
    if (btnFsStart && !gameState.isDecryptTimerRunning) {
      btnFsStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', seconds })
    }).catch(() => {});

    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã đặt thời lượng tô tranh: ${mins} phút!`, 'info');
    }
  }

  function updateDecryptTimerUI() {
    const totalSec = Math.max(0, gameState.decryptTimeLeft || 0);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // 1. Cập nhật đồng hồ đếm ngược trên thanh công cụ Tab 4
    const timerEl = document.getElementById('gmmDecryptTimer');
    if (timerEl) {
      timerEl.textContent = timeStr;

      // Đổi màu cảnh báo & hiệu ứng phát sáng (Neon Glow)
      if (totalSec <= 10) {
        timerEl.style.borderColor = '#ef4444';
        timerEl.style.color = '#ef4444';
        timerEl.classList.add('urgent-pulse');
      } else if (totalSec <= 30) {
        timerEl.style.borderColor = '#f59e0b';
        timerEl.style.color = '#f59e0b';
        timerEl.classList.remove('urgent-pulse');
      } else {
        timerEl.style.borderColor = '#10b981';
        timerEl.style.color = '#34d399';
        timerEl.classList.remove('urgent-pulse');
      }
    }

    // 2. Cập nhật đồng hồ Toàn Màn Hình Khổng Lồ (Fullscreen Countdown Modal)
    const fsTimerDigits = document.getElementById('gmmFsTimerDigits');
    if (fsTimerDigits) {
      fsTimerDigits.textContent = timeStr;
      if (totalSec <= 10) {
        fsTimerDigits.className = 'gmm-timer-fs-digits urgent-red';
      } else if (totalSec <= 30) {
        fsTimerDigits.className = 'gmm-timer-fs-digits warning-amber';
      } else {
        fsTimerDigits.className = 'gmm-timer-fs-digits normal-green';
      }
    }

    // Thanh tiến trình Fullscreen
    const fillEl = document.getElementById('gmmFsTimerProgressFill');
    const totalDuration = Math.max(1, gameState.decryptTimeTotal || 300);
    const percent = Math.min(100, Math.max(0, (totalSec / totalDuration) * 100));
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
      if (totalSec <= 10) {
        fillEl.className = 'gmm-timer-fs-progress-fill urgent-red';
      } else if (totalSec <= 30) {
        fillEl.className = 'gmm-timer-fs-progress-fill warning-amber';
      } else {
        fillEl.className = 'gmm-timer-fs-progress-fill normal-green';
      }
    }

    const percentEl = document.getElementById('gmmFsTimerProgressPercent');
    if (percentEl) {
      percentEl.textContent = `Thời gian còn lại: ${Math.round(percent)}%`;
    }

    const ratioEl = document.getElementById('gmmFsTimerProgressRatio');
    if (ratioEl) {
      const totM = Math.floor(totalDuration / 60);
      const totS = totalDuration % 60;
      const totStr = `${totM.toString().padStart(2, '0')}:${totS.toString().padStart(2, '0')}`;
      ratioEl.textContent = `${timeStr} / ${totStr}`;
    }

    // Hướng dẫn / Thông điệp trạng thái ở trung tâm sân khấu Fullscreen
    const statusTip = document.getElementById('gmmFsTimerStatusTip');
    if (statusTip) {
      if (totalSec === 0) {
        statusTip.textContent = '🎉 HẾT GIỜ TÔ TRANH! Hãy cùng đối chiếu tác phẩm với Tranh Giáo Viên!';
        statusTip.style.color = '#fde047';
      } else if (!gameState.isDecryptTimerRunning) {
        statusTip.textContent = '⏸️ Đang tạm dừng đồng hồ. Bấm "Tiếp Tục" để đếm ngược tiếp tục!';
        statusTip.style.color = '#38bdf8';
      } else if (totalSec <= 10) {
        statusTip.textContent = '🔥 10 GIÂY CUỐI CÙNG! Các đội khẩn trương hoàn thiện những nét tô cuối!';
        statusTip.style.color = '#fca5a5';
      } else {
        statusTip.textContent = '⚡ Hai đội khẩn trương đối chiếu tọa độ ô màu và hoàn thành tranh giấy A1!';
        statusTip.style.color = '#cbd5e1';
      }
    }

    // Cập nhật điểm & số ô mở của 2 đội trên Fullscreen
    const scoreAEl = document.getElementById('gmmFsTeamAScore');
    if (scoreAEl && gameState.teamA) {
      const scoreA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      scoreAEl.textContent = `${scoreA} đ`;
    }
    const progAEl = document.getElementById('gmmFsTeamAProgress');
    if (progAEl && gameState.teamA) {
      const countA = (gameState.teamA.unlockedRegions || []).length;
      progAEl.textContent = `(${countA}/10 ô)`;
    }

    const scoreBEl = document.getElementById('gmmFsTeamBScore');
    if (scoreBEl && gameState.teamB) {
      const scoreB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      scoreBEl.textContent = `${scoreB} đ`;
    }
    const progBEl = document.getElementById('gmmFsTeamBProgress');
    if (progBEl && gameState.teamB) {
      const countB = (gameState.teamB.unlockedRegions || []).length;
      progBEl.textContent = `(${countB}/10 ô)`;
    }
  }

  function toggleDecryptTimer() {
    if (gameState.isDecryptTimerRunning) {
      pauseDecryptTimer();
    } else {
      resumeDecryptTimer();
    }
  }

  function pauseDecryptTimer() {
    gameState.isDecryptTimerRunning = false;
    clearInterval(gameState.decryptTimerInterval);
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '▶️ Tiếp Tục';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '▶️ Tiếp Tục';
    if (typeof window.showToast === 'function') {
      window.showToast('⏸️ Đã tạm dừng đồng hồ tô tranh!', 'info');
    }
    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});
  }

  function resumeDecryptTimer() {
    gameState.isDecryptPhase = true;
    gameState.isDecryptTimerRunning = true;
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '⏸️ Tạm Dừng';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '⏸️ Tạm Dừng';

    if (gameState.autoFsOnTimerStart && !gameState.isDecryptTimerFullscreenOpen) {
      openDecryptTimerFullscreen();
    }

    clearInterval(gameState.decryptTimerInterval);
    gameState.decryptTimerInterval = setInterval(() => {
      if (gameState.decryptTimeLeft > 0) {
        gameState.decryptTimeLeft--;
        updateDecryptTimerUI();

        if (gameState.decryptTimeLeft <= 5 && gameState.decryptTimeLeft > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(gameState.decryptTimeLeft);
          }
        }

        if (gameState.decryptTimeLeft === 0) {
          clearInterval(gameState.decryptTimerInterval);
          gameState.isDecryptTimerRunning = false;
          if (btn) btn.textContent = '🚀 Bắt Đầu Lại';
          if (fsBtn) fsBtn.textContent = '🚀 Bắt Đầu Lại';
          if (window.audioManager && typeof window.audioManager.playTimerBuzzer === 'function') {
            window.audioManager.playTimerBuzzer();
          }
          if (typeof window.showToast === 'function') {
            window.showToast('⏰ Hết giờ tô tranh! Hãy cùng chiêm ngưỡng tác phẩm của 2 đội!', 'info');
          }
        }
      }
    }, 1000);

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        seconds: gameState.decryptTimeLeft,
        totalSeconds: gameState.decryptTimeTotal || 300
      })
    }).catch(() => {});
  }

  function startDecryptPhase(seconds = 300) {
    gameState.isDecryptPhase = true;
    setDecryptDuration(seconds);
    resumeDecryptTimer();
    renderDecryptUI();
  }

  function extendDecryptTime(seconds = 30) {
    gameState.decryptTimeLeft = (gameState.decryptTimeLeft || 0) + seconds;
    gameState.decryptTimeTotal = (gameState.decryptTimeTotal || 300) + seconds;
    updateDecryptTimerUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã gia hạn thêm +${seconds} giây cho hai đội!`, 'success');
    }
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', seconds })
    }).catch(() => {});
  }

  function openDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (!modal) return;
    gameState.isDecryptTimerFullscreenOpen = true;
    modal.style.display = 'flex';

    // Vẽ lại tranh & tiến độ 2 đội hiển thị trọn vẹn tức thì trên Fullscreen
    renderDecryptUI();
    updateProgressBar('teamA');
    updateProgressBar('teamB');

    // Cập nhật giao diện đồng bộ
    updateDecryptTimerUI();

    // Đồng bộ nút preset đang chọn
    const totalDuration = gameState.decryptTimeTotal || 300;
    [180, 300, 420].forEach(s => {
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === totalDuration);
    });

    // Đồng bộ nút Bắt đầu / Tạm dừng
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) {
      if (gameState.isDecryptTimerRunning) {
        fsBtn.textContent = '⏸️ Tạm Dừng';
      } else if (gameState.decryptTimeLeft === 0) {
        fsBtn.textContent = '🚀 Bắt Đầu Lại';
      } else if (gameState.decryptTimeLeft < totalDuration) {
        fsBtn.textContent = '▶️ Tiếp Tục';
      } else {
        const mins = Math.round(totalDuration / 60);
        fsBtn.textContent = `🚀 Bắt Đầu (${mins}p)`;
      }
    }

    // Đưa trình duyệt vào chế độ toàn màn hình F11 nếu được phép
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function closeDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (modal) modal.style.display = 'none';
    gameState.isDecryptTimerFullscreenOpen = false;

    // Thoát Fullscreen trình duyệt nếu đang bật
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleAutoFsOnTimerStart(enabled) {
    gameState.autoFsOnTimerStart = Boolean(enabled);
    if (typeof window.showToast === 'function') {
      window.showToast(
        gameState.autoFsOnTimerStart
          ? '🖥️ Đã BẬT tự động phóng to Full màn hình khi bấm Bắt đầu!'
          : '🔲 Đã TẮT tự động phóng to Full màn hình khi bấm Bắt đầu.',
        'info'
      );
    }
  }

  function handleCellClick(teamKey, cellId, specificColor = null, isRemote = false) {
    const teamData = gameState[teamKey];
    if (!teamData) return;
    if (!teamData.coloredRegions) teamData.coloredRegions = {};

    // Lấy màu đang chọn của đội đó hoặc màu chỉ định
    const activeColor = specificColor || (teamKey === 'teamA' ? gameState.selectedColorA : gameState.selectedColorB) || '#dc2626';

    // Toggle màu hoặc xóa màu nếu ô đó đã tô màu này
    if (teamData.coloredRegions[cellId] === activeColor) {
      delete teamData.coloredRegions[cellId];
    } else {
      teamData.coloredRegions[cellId] = activeColor;
    }

    // Âm thanh tương tác
    if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
      window.audioManager.playPointerSpringSnap();
    }

    // Cập nhật giao diện giải mã
    renderDecryptUI();
    checkTeamCompletion(teamKey);
    updateProgressBar(teamKey);

    // Nếu học sinh tô từ điện thoại: gửi lên server
    if (isStudentMobileClient && !isRemote) {
      submitPaintFromMobile(cellId);
    } else if (!isRemote) {
      broadcastHostStateToServer();
    }
  }

  function handleRegionClick(teamKey, regionId, specificColor = null, isRemote = false) {
    handleCellClick(teamKey, regionId, specificColor, isRemote);
  }

  // Tô mẫu thử / giải mã nhanh toàn bộ các mảng chữ & biểu tượng "TRI ÂN THẦY CÔ 20/11"
  function autoColorDemo() {
    ['teamA', 'teamB'].forEach(tKey => {
      if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
        window.GiaiMaPuzzle.autoColorTargetCells(gameState[tKey]);
      }
      checkTeamCompletion(tKey);
      updateProgressBar(tKey);
    });

    renderDecryptUI();
    broadcastHostStateToServer();
    if (typeof window.showToast === 'function') {
      window.showToast('⚡ Đã tô giải mã mẫu hoàn thiện bức tranh “TRI ÂN THẦY CÔ 20/11” cho cả 2 đội!', 'success');
    }
  }

  function checkTeamCompletion(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let isAllColored = false;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      isAllColored = prog.isComplete;
    }

    // Hiệu ứng khích lệ khi đạt 50%
    if (percent >= 50 && !teamData.halfwayNotified) {
      teamData.halfwayNotified = true;
      if (typeof window.showToast === 'function') {
        window.showToast(`🔥 ${teamData.name} đã hoàn thành ${percent}% bức tranh! Sắp lộ diện thông điệp 20/11!`, 'info');
      }
    }

    // Hoàn thành 100%
    if (isAllColored && !teamData.completed) {
      teamData.completed = true;
      teamData.bonusScore = 10; // Thưởng 10 điểm
      teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

      // Pháo hoa ăn mừng
      if (typeof confetti === 'function') {
        confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
      }

      if (window.audioManager && typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }

      const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
        ? window.GiaiMaPuzzle.getActivePuzzle().title
        : 'TRI ÂN THẦY CÔ 20/11';
      const symbolText = `“${activeTitle}”`;

      if (typeof window.showToast === 'function') {
        window.showToast(`🎉 CHÚC MỪNG ${teamData.name} ĐÃ GIẢI MÃ THÀNH CÔNG BỨC TRANH BÍ ẨN ${symbolText} (+10 ĐIỂM)!`, 'success');
      }

      updateHeaderScores();
      broadcastHostStateToServer();
    }
  }

  // Thay đổi điểm thưởng BGK chấm cho từng đội (1 - 10 điểm)
  function onJudgeScoreChange(teamKey, value) {
    const score = Math.min(10, Math.max(1, parseInt(value, 10) || 10));
    if (!gameState[teamKey]) return;
    gameState[teamKey].selectedBonusScore = score;

    // Cập nhật text nút duyệt nếu đội chưa hoàn tất
    if (!gameState[teamKey].completed) {
      const btnText = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
      if (btnText) {
        btnText.textContent = `✅ Duyệt Tranh (+${score}đ)`;
      }
    }
  }

  // Hiệu ứng viền phát sáng màu vàng kim (Gold Glow Aura) 3 giây khi BGK bấm Duyệt Tranh
  function triggerGoldGlowAura(teamKey, displayName, score = 10) {
    const container = document.getElementById(`${teamKey}_canvasContainer`);
    const panel = container ? container.closest('.gmm-canvas-panel') : null;

    if (container) {
      container.classList.remove('gmm-approved-permanent');
      container.classList.add('gmm-gold-glow-active');
    }
    if (panel) {
      panel.classList.remove('gmm-approved-permanent');
      panel.classList.add('gmm-gold-glow-active');
    }

    // Đảm bảo không có bất kỳ con dấu hay phần tử nào che khuất khung tranh của học sinh
    const existingStamp = document.getElementById(`${teamKey}_goldStamp`);
    if (existingStamp) existingStamp.remove();

    // Cập nhật trạng thái nút duyệt tranh thành đã hoàn tất
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    if (btn) {
      btn.classList.add('approved');
      btn.disabled = true;
    }
    if (txt) {
      txt.textContent = `🌟 ĐÃ DUYỆT TRANH (+${score}đ)`;
    }

    // Pháo hoa vàng kim tung bay ăn mừng
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 180,
        spread: 95,
        origin: { x: teamKey === 'teamA' ? 0.3 : 0.7, y: 0.55 },
        colors: ['#facc15', '#fde047', '#eab308', '#ffffff', '#22c55e', '#38bdf8'],
        zIndex: 2147483647
      });
    }

    // Sau đúng 3 giây: Tắt hào quang cực mạnh, chuyển sang viền vàng kim bền vững
    setTimeout(() => {
      if (container) {
        container.classList.remove('gmm-gold-glow-active');
        container.classList.add('gmm-approved-permanent');
      }
      if (panel) {
        panel.classList.remove('gmm-gold-glow-active');
        panel.classList.add('gmm-approved-permanent');
      }
    }, 3000);
  }

  // Ban Giám Khảo xác nhận hoàn thành tô màu tranh trên bảng giấy (Điểm tùy chọn tối đa 10 điểm)
  function approvePaperArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (teamData.completed) {
      const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;
      if (typeof window.showToast === 'function') {
        window.showToast(`ℹ️ ${displayName} đã được xác nhận hoàn thành trước đó!`, 'info');
      }
      return;
    }

    // Đọc số điểm do BGK tùy chọn từ dropdown select (Tối đa 10đ)
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    const rawVal = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    const scoreToAdd = Math.min(10, Math.max(1, parseInt(rawVal, 10) || 10));

    teamData.completed = true;
    teamData.bonusScore = scoreToAdd;
    teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

    // Khóa dropdown điểm sau khi đã duyệt
    if (selectEl) selectEl.disabled = true;

    // Hiển thị nút Chấm lại (Undo) để BGK sửa điểm nếu cần
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) undoBtn.style.display = 'inline-flex';

    // Tên đội hiển thị tùy chỉnh (ĐOÀN KẾT, LA BÀN TUỔI TRẺ...)
    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Tô đầy đủ các mảng trên màn hình để đồng bộ với tranh giấy
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
      window.GiaiMaPuzzle.autoColorTargetCells(teamData);
    }

    // Kích hoạt hiệu ứng hào quang vàng kim 3 giây rực rỡ + pháo hoa vàng gold
    triggerGoldGlowAura(teamKey, displayName, scoreToAdd);

    if (window.audioManager) {
      if (typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }
      // Nếu được 10 điểm tuyệt đối: Tự động phát tràng pháo tay vỗ tay rào rào của khán giả!
      if (scoreToAdd === 10 && typeof window.audioManager.playApplause === 'function') {
        setTimeout(() => {
          window.audioManager.playApplause();
        }, 350);
      }
    }

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';
    const symbolText = `“${activeTitle}”`;

    const applaudNotice = scoreToAdd === 10 ? ' 🌟 10 ĐIỂM TUYỆT ĐỐI! 👏 (Cả lớp vỗ tay rào rào)' : '';
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 BGK ĐÃ XÁC NHẬN ${displayName} HOÀN THÀNH TRANH GIẤY VÀ GIẢI MÃ THÀNH CÔNG BỨC TRANH ${symbolText} (+${scoreToAdd} ĐIỂM)!${applaudNotice}`, 'success');
    }

    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();
  }

  // Ban Giám Khảo hủy kết quả duyệt tranh để chấm lại điểm (Undo)
  function undoApproveArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Hoàn tác trạng thái hoàn thành & điểm thưởng
    teamData.completed = false;
    teamData.bonusScore = 0;
    teamData.finishTime = null;

    // Mở khóa lại dropdown chọn điểm
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    if (selectEl) {
      selectEl.disabled = false;
    }

    // Khôi phục nút duyệt tranh về ban đầu
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    const currentScore = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    if (btn) {
      btn.classList.remove('approved');
      btn.disabled = false;
    }
    if (txt) {
      txt.textContent = `✅ Duyệt Tranh (+${currentScore}đ)`;
    }

    // Ẩn nút Chấm lại
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) {
      undoBtn.style.display = 'none';
    }

    // Đảm bảo dọn sạch con dấu nếu có
    const stamp = document.getElementById(`${teamKey}_goldStamp`);
    if (stamp) stamp.remove();

    const container = document.getElementById(`${teamKey}_canvasContainer`);
    if (container) {
      container.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }
    const panel = container ? container.closest('.gmm-canvas-panel') : null;
    if (panel) {
      panel.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }

    // Cập nhật lại giao diện và điểm số
    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast(`↩️ Đã hủy duyệt tranh ${displayName}! Thầy/Cô có thể chọn lại số điểm và bấm Duyệt Tranh.`, 'info');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  function updateProgressBar(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let current = 0;
    let total = 35;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      current = prog.colored;
      total = prog.total;
    } else {
      current = Math.min(Object.keys(teamData.coloredRegions || {}).length, 10);
      percent = Math.round((current / 10) * 100);
      total = 10;
    }

    const fillEl = document.getElementById(`${teamKey}_progressFill`);
    const textEl = document.getElementById(`${teamKey}_progressText`);
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `${percent}% (${current}/${total} mảng)`;

    // Cập nhật đồng bộ trên Đấu Trường Fullscreen
    const fsFillEl = document.getElementById(`${teamKey}_fsProgressFill`);
    const fsTextEl = document.getElementById(`${teamKey}_fsProgressText`);
    if (fsFillEl) fsFillEl.style.width = `${percent}%`;
    if (fsTextEl) fsTextEl.textContent = `${percent}% (${current}/${total} mảng)`;
  }




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

    if (tabId === 'lobby') renderQrCodes();
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

    if (!skipBroadcast) {
      broadcastHostStateToServer();
    }
  }

  // ==============================================================================
  // CHẾ ĐỘ 1 CHẠM: SÂN KHẤU MÁY CHIẾU (PROJECTOR STAGE VIEW)
  // Ẩn toàn bộ nút bấm kỹ thuật của giáo viên, phóng to tối đa ma trận & câu hỏi
  // ==============================================================================
  function toggleProjectorStageMode() {
    if (gameState.isStageMode) {
      exitProjectorStageMode();
    } else {
      enterProjectorStageMode();
    }
  }

  function enterProjectorStageMode() {
    gameState.isStageMode = true;
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.add('gmm-stage-mode-active');
    }
    document.body.classList.add('gmm-stage-active');

    const btnStage = document.getElementById('gmmBtnStageMode');
    if (btnStage) {
      btnStage.classList.add('active');
      btnStage.innerHTML = '<span>🖥️ Thoát Sân Khấu</span>';
    }

    const floatBar = document.getElementById('gmmStageFloatingBar');
    if (floatBar) {
      floatBar.style.display = 'flex';
    }
    const floatStartBtn = document.getElementById('gmmStageFloatStartBtn');
    const floatPauseBtn = document.getElementById('gmmStageFloatPauseBtn');
    if (floatStartBtn && floatPauseBtn) {
      if (!gameState.isMatchStarted) {
        floatStartBtn.style.display = 'inline-flex';
        floatPauseBtn.style.display = 'none';
      } else {
        floatStartBtn.style.display = 'none';
        floatPauseBtn.style.display = 'inline-flex';
      }
    }
    updateStageFloatPauseBtn();

    // Tự động kích hoạt toàn màn hình nếu trình duyệt chưa ở chế độ Fullscreen
    if (!document.fullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }
    }

    if (typeof window.showToast === 'function') {
      window.showToast('📽️ Đã kích hoạt Chế Độ Sân Khấu Máy Chiếu! Toàn bộ nút kỹ thuật đã được ẩn gọn gàng (Phím P hoặc ESC để thoát).', 'info');
    }
  }

  function exitProjectorStageMode() {
    gameState.isStageMode = false;
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.remove('gmm-stage-mode-active');
    }
    document.body.classList.remove('gmm-stage-active');

    const btnStage = document.getElementById('gmmBtnStageMode');
    if (btnStage) {
      btnStage.classList.remove('active');
      btnStage.innerHTML = '<span>📽️ Sân Khấu Máy Chiếu</span>';
    }

    const floatBar = document.getElementById('gmmStageFloatingBar');
    if (floatBar) {
      floatBar.style.display = 'none';
    }

    if (typeof window.showToast === 'function') {
      window.showToast('🖥️ Đã quay lại Bảng Điều Khiển Giáo Viên đầy đủ.', 'info');
    }
  }

  function updateStageFloatPauseBtn() {
    const pauseTxt = document.getElementById('gmmStageFloatPauseTxt');
    if (pauseTxt) {
      pauseTxt.textContent = gameState.isTimerRunning ? '⏸️ Tạm Dừng' : '▶️ Tiếp Tục';
    }
  }

  // Quản lý Ô Cài Đặt & Điều Hướng Nhanh (Settings Popover)
  function toggleSettingsMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const box = document.getElementById('gmmSettingsBox');
    if (!box) return;
    if (box.style.display !== 'none') {
      closeSettingsMenu();
    } else {
      openSettingsMenu();
    }
  }

  function openSettingsMenu() {
    const box = document.getElementById('gmmSettingsBox');
    const btn = document.getElementById('gmmBtnSettings');
    if (box) {
      box.style.display = 'block';
    }
    if (btn) {
      btn.classList.add('active');
    }
  }

  function closeSettingsMenu() {
    const box = document.getElementById('gmmSettingsBox');
    const btn = document.getElementById('gmmBtnSettings');
    if (box) {
      box.style.display = 'none';
    }
    if (btn) {
      btn.classList.remove('active');
    }
  }

  // Tự động đóng Ô Cài Đặt khi click chuột ra ngoài
  document.addEventListener('click', (e) => {
    const box = document.getElementById('gmmSettingsBox');
    const wrapper = document.getElementById('gmmSettingsWrapper');
    if (box && box.style.display !== 'none') {
      if (wrapper && !wrapper.contains(e.target)) {
        closeSettingsMenu();
      }
    }
  });

  // ==============================================================================
  // QUẢN LÝ Ô CÀI ĐẶT TAB 4 (TÔ MÀU & GIẢI MÃ BỨC TRANH BÍ MẬT)
  // ==============================================================================
  function toggleSettingsMenuTab4(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const box = document.getElementById('gmmSettingsBoxTab4');
    if (!box) return;
    if (box.style.display !== 'none') {
      closeSettingsMenuTab4();
    } else {
      openSettingsMenuTab4();
    }
  }

  function openSettingsMenuTab4() {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const btn = document.getElementById('gmmBtnSettingsTab4');
    if (box) box.style.display = 'block';
    if (btn) btn.classList.add('active');
  }

  function closeSettingsMenuTab4() {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const btn = document.getElementById('gmmBtnSettingsTab4');
    if (box) box.style.display = 'none';
    if (btn) btn.classList.remove('active');
  }

  // Tự động đóng Ô Cài Đặt Tab 4 khi click chuột ra ngoài
  document.addEventListener('click', (e) => {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const wrapper = document.getElementById('gmmSettingsWrapperTab4');
    if (box && box.style.display !== 'none') {
      if (wrapper && !wrapper.contains(e.target)) {
        closeSettingsMenuTab4();
      }
    }
  });


  // Chuyển góc nhìn / tiêu điểm Đội (Toàn cảnh / Đội A / Đội B)
  function setRoleFocus(role) {
    gameState.roleFocus = role;

    ['all', 'teamA', 'teamB'].forEach(r => {
      const btn = document.getElementById(`gmmRoleBtn_${r}`);
      if (btn) btn.classList.toggle('active', r === role);
    });

    if (typeof window.showToast === 'function') {
      const roleNames = {
        all: '👨‍🏫 Góc nhìn Ban Giám Khảo (Cả 2 đội)',
        teamA: '🔴 Tiêu điểm Đội 1 (Đội A)',
        teamB: '🔵 Tiêu điểm Đội 2 (Đội B)'
      };
      window.showToast(`Đã chuyển sang: ${roleNames[role]}`, 'info');
    }
  }

  // ============================================================================
  // QUẢN LÝ ĐỔI TÊN ĐẠI DIỆN 2 ĐỘI THI ĐẤU (VÍ DỤ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
  // ============================================================================
  function getTeamName(teamKey, format = 'short') {
    const defaultName = teamKey === 'teamA' ? 'ĐOÀN KẾT' : 'LA BÀN TUỔI TRẺ';
    const numPrefix = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';
    const custom = (gameState[teamKey]?.name && String(gameState[teamKey].name).trim()) || defaultName;
    if (format === 'full') {
      return `${custom} (${numPrefix})`;
    }
    if (format === 'withNum') {
      return `${numPrefix} - ${custom}`;
    }
    return custom;
  }

  function updateAllTeamNamesUI() {
    const nameA = getTeamName('teamA');
    const nameB = getTeamName('teamB');

    // 1. Header điểm số
    const hA = document.getElementById('gmmHeaderTeamNameA');
    if (hA) hA.textContent = `🔴 ${nameA}:`;
    const hB = document.getElementById('gmmHeaderTeamNameB');
    if (hB) hB.textContent = `🔵 ${nameB}:`;

    // 2. Tab 1: Cổng tham gia
    const entA = document.getElementById('gmmEntryTitleA');
    if (entA) entA.textContent = `ĐỘI 1 (${nameA}) THAM GIA`;
    const entBtnA = document.getElementById('gmmEntryBtnA');
    if (entBtnA) entBtnA.textContent = `Vào Phòng ${nameA}`;

    const entB = document.getElementById('gmmEntryTitleB');
    if (entB) entB.textContent = `ĐỘI 2 (${nameB}) THAM GIA`;
    const entBtnB = document.getElementById('gmmEntryBtnB');
    if (entBtnB) entBtnB.textContent = `Vào Phòng ${nameB}`;

    // 3. Tab 2: Phòng chờ & Mã QR
    const qrA = document.getElementById('gmmQrTitleA');
    if (qrA) qrA.textContent = `🔴 MÃ QR ĐỘI 1: ${nameA}`;
    const copyBtnA = document.getElementById('gmmBtnCopyTeamA');
    if (copyBtnA) copyBtnA.textContent = `📋 Sao chép link ${nameA}`;
    const statusTextA = document.getElementById('gmmTeamStatusTextA');
    if (statusTextA && (!gameState.connectedTeams || !gameState.connectedTeams.teamA)) {
      statusTextA.textContent = `Đang chờ ${nameA} quét mã...`;
    }

    const qrB = document.getElementById('gmmQrTitleB');
    if (qrB) qrB.textContent = `🔵 MÃ QR ĐỘI 2: ${nameB}`;
    const copyBtnB = document.getElementById('gmmBtnCopyTeamB');
    if (copyBtnB) copyBtnB.textContent = `📋 Sao chép link ${nameB}`;
    const statusTextB = document.getElementById('gmmTeamStatusTextB');
    if (statusTextB && (!gameState.connectedTeams || !gameState.connectedTeams.teamB)) {
      statusTextB.textContent = `Đang chờ ${nameB} quét mã...`;
    }

    // 4. Tab 3: Cột đấu trường đối kháng
    const arenaColA = document.getElementById('gmmArenaColTitleA');
    if (arenaColA) arenaColA.textContent = `ĐỘI 1 (${nameA})`;
    const arenaColB = document.getElementById('gmmArenaColTitleB');
    if (arenaColB) arenaColB.textContent = `ĐỘI 2 (${nameB})`;

    const pingTextA = document.getElementById('gmmLivePingTextA');
    if (pingTextA && (!gameState.connectedTeams || !gameState.connectedTeams.teamA)) {
      pingTextA.textContent = `${nameA}: Chưa kết nối điện thoại (Chờ quét QR)`;
    }
    const pingTextB = document.getElementById('gmmLivePingTextB');
    if (pingTextB && (!gameState.connectedTeams || !gameState.connectedTeams.teamB)) {
      pingTextB.textContent = `${nameB}: Chưa kết nối điện thoại (Chờ quét QR)`;
    }

    // 5. Tab 4: Tô màu giải mã tranh
    const canvasA = document.getElementById('gmmCanvasTitleA');
    if (canvasA) canvasA.textContent = `🔴 BẢNG TRANH: ${nameA}`;
    const canvasB = document.getElementById('gmmCanvasTitleB');
    if (canvasB) canvasB.textContent = `🔵 BẢNG TRANH: ${nameB}`;

    const selA = document.getElementById('teamA_customScoreSelect');
    const scoreA = gameState.teamA.completed ? gameState.teamA.bonusScore : (selA ? selA.value : (gameState.teamA.selectedBonusScore || 10));
    const judgeA = document.getElementById('gmmJudgeBtnTextA');
    if (judgeA) {
      judgeA.textContent = gameState.teamA.completed
        ? `🌟 ĐÃ DUYỆT TRANH (+${scoreA}đ)`
        : `✅ Duyệt Tranh (+${scoreA}đ)`;
    }

    const selB = document.getElementById('teamB_customScoreSelect');
    const scoreB = gameState.teamB.completed ? gameState.teamB.bonusScore : (selB ? selB.value : (gameState.teamB.selectedBonusScore || 10));
    const judgeB = document.getElementById('gmmJudgeBtnTextB');
    if (judgeB) {
      judgeB.textContent = gameState.teamB.completed
        ? `🌟 ĐÃ DUYỆT TRANH (+${scoreB}đ)`
        : `✅ Duyệt Tranh (+${scoreB}đ)`;
    }

    const undoA = document.getElementById('teamA_undoJudgeBtn');
    if (undoA) undoA.style.display = gameState.teamA.completed ? 'inline-flex' : 'none';
    const undoB = document.getElementById('teamB_undoJudgeBtn');
    if (undoB) undoB.style.display = gameState.teamB.completed ? 'inline-flex' : 'none';

    const emptyPhotoA = document.getElementById('teamA_photoEmptyTitle');
    if (emptyPhotoA) emptyPhotoA.textContent = `CHƯA CÓ ẢNH TRANH GIẤY TỪ ${nameA}`;
    const emptyPhotoB = document.getElementById('teamB_photoEmptyTitle');
    if (emptyPhotoB) emptyPhotoB.textContent = `CHƯA CÓ ẢNH TRANH GIẤY TỪ ${nameB}`;

    // 6. Tab 5: Đối chiếu tranh giáo viên
    const compareThA = document.getElementById('gmmCompareThA');
    if (compareThA) compareThA.textContent = `${nameA} (Đội 1)`;
    const compareThB = document.getElementById('gmmCompareThB');
    if (compareThB) compareThB.textContent = `${nameB} (Đội 2)`;

    // 7. Tab 6: Bảng điểm & Tổng kết
    const resThA = document.getElementById('gmmResultThA');
    if (resThA) resThA.textContent = `${nameA} (Đội 1)`;
    const resThB = document.getElementById('gmmResultThB');
    if (resThB) resThB.textContent = `${nameB} (Đội 2)`;

    // 8. Màn hình Fullscreen & Máy chiếu
    const fsNameA = document.getElementById('gmmFsTeamAName');
    if (fsNameA) fsNameA.textContent = nameA;
    const fsNameB = document.getElementById('gmmFsTeamBName');
    if (fsNameB) fsNameB.textContent = nameB;

    const fsTabA = document.getElementById('gmmFsTabTeamA');
    if (fsTabA) fsTabA.textContent = `🔴 Full ${nameA}`;
    const fsTabB = document.getElementById('gmmFsTabTeamB');
    if (fsTabB) fsTabB.textContent = `🔵 Full ${nameB}`;

    // 9. Điện thoại học sinh (Mobile client)
    if (isStudentMobileClient) {
      const myTeamName = studentTeamKey === 'teamA' ? nameA : nameB;
      const myNumPrefix = studentTeamKey === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';
      const mobName = document.getElementById('gmmMobTeamName');
      if (mobName) mobName.textContent = `${myNumPrefix} - ${myTeamName}`.toUpperCase();
      const mobTitle = document.getElementById('gmmMobLobbyTeamTitle');
      if (mobTitle) mobTitle.textContent = (studentTeamKey === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
      const mobBadge = document.getElementById('gmmMobCountdownTeamBadge');
      if (mobBadge) mobBadge.textContent = (studentTeamKey === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
    }

    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
      window.GiaiMaLiveMonitor.renderHostPingIndicators();
    }
  }

  function openTeamNameModal() {
    const modal = document.getElementById('gmmTeamNameModal');
    if (!modal) return;
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    if (inpA) inpA.value = gameState.teamA?.name || 'ĐOÀN KẾT';
    if (inpB) inpB.value = gameState.teamB?.name || 'LA BÀN TUỔI TRẺ';
    modal.style.display = 'flex';
    if (inpA) setTimeout(() => inpA.focus(), 100);
  }

  function closeTeamNameModal() {
    const modal = document.getElementById('gmmTeamNameModal');
    if (modal) modal.style.display = 'none';
  }

  function setQuickTeamName(teamKey, name) {
    const inp = document.getElementById(teamKey === 'teamA' ? 'gmmInputTeamNameA' : 'gmmInputTeamNameB');
    if (inp) {
      inp.value = name;
      inp.focus();
    }
  }

  function resetDefaultTeamNames() {
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    if (inpA) inpA.value = 'ĐOÀN KẾT';
    if (inpB) inpB.value = 'LA BÀN TUỔI TRẺ';
    if (typeof window.showToast === 'function') {
      window.showToast('↺ Đã điền tên mẫu mặc định: ĐOÀN KẾT & LA BÀN TUỔI TRẺ!', 'info');
    }
  }

  function saveTeamNames() {
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    const valA = (inpA && inpA.value.trim()) || 'ĐOÀN KẾT';
    const valB = (inpB && inpB.value.trim()) || 'LA BÀN TUỔI TRẺ';

    gameState.teamA.name = valA;
    gameState.teamB.name = valB;

    try {
      localStorage.setItem(STORAGE_KEY_TEAM_NAMES, JSON.stringify({ teamA: valA, teamB: valB }));
    } catch (_e) {}

    updateAllTeamNamesUI();
    closeTeamNameModal();

    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast(`✅ Đã lưu tên 2 đội: ${valA} & ${valB}!`, 'success');
    }
  }

  // Vào cổng vai trò từ màn hình Trang chủ
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

      if (gmmMobileSyncMod) gmmMobileSyncMod.resetMobilePhotoState();
      document.querySelectorAll('.gmm-mob-upload-success').forEach(el => { el.style.display = 'none'; });
      if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeTeamFullscreen === 'function') {
        window.GiaiMaArtworkScanner.closeTeamFullscreen();
      }

      if (gmmHostArenaMod) gmmHostArenaMod.clearCountdownTimer();
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

  // Khởi tạo ban đầu

  // ============================================================================
  // LIÊN KẾT CÁC MÔ-ĐUN CHUYÊN BIỆT (gmmExport, gmmHostArena, gmmMobileSync)
  // ============================================================================
  let gmmExportMod = null;
  let gmmHostArenaMod = null;
  let gmmMobileSyncMod = null;

  function initSubModules() {
    if (gmmExportMod && gmmHostArenaMod && gmmMobileSyncMod && gmmLobbyQrMod && gmmQuestionBankMod && gmmArtworkHostMod) return;
    const sharedCtx = {
      gameState,
      DEFAULT_QUESTIONS,
      getQuestionsList: () => questionsList,
      setQuestionsList: (nextList) => { if (Array.isArray(nextList)) questionsList = nextList; },
      isStudentMobile: () => isStudentMobileClient,
      getStudentTeamKey: () => studentTeamKey,
      setStudentMobile: (flag, tKey) => {
        isStudentMobileClient = Boolean(flag);
        if (tKey) studentTeamKey = tKey;
      },
      generateSvgPuzzle,
      triggerPulseGlow,
      updateStealthButtonUI,
      updateStageFloatPauseBtn,
      setArtworkViewMode,
      resetTiltAngle,
      chooseAnswer,
      updateProgressBar,
      updateCanvasThemeButtonUI,
      getTeamName,
      renderQuestionUI,
      broadcastHostStateToServer,
      switchTab,
      closeDecryptTimerFullscreen,
      updateDecryptTimerUI,
      handleRegionClick,
      attachTeamArtworkPhoto,
      updateAllTeamNamesUI,
      renderTransformedCanvas,
      compressImageClient,
      requestScreenWakeLock: (...args) => gmmHostArenaMod.requestScreenWakeLock(...args),
      formatMinutesSeconds: (...args) => gmmHostArenaMod.formatMinutesSeconds(...args),
      runCountdownAnimation: (...args) => gmmHostArenaMod.runCountdownAnimation(...args)
    };
    gmmExportMod = window.GmmExport.create(sharedCtx);
    gmmHostArenaMod = window.GmmHostArena.create(sharedCtx);
    gmmMobileSyncMod = window.GmmMobileSync.create(sharedCtx);
    initPhase3SubModules(sharedCtx);
  }

  // Export module delegators
  function switchExportPreviewPage(...args) { initSubModules(); return gmmExportMod.switchExportPreviewPage(...args); }
  function handleLogoUpload(...args) { initSubModules(); return gmmExportMod.handleLogoUpload(...args); }
  function removeLogo(...args) { initSubModules(); return gmmExportMod.removeLogo(...args); }
  function appendExtraInfoTemplate(...args) { initSubModules(); return gmmExportMod.appendExtraInfoTemplate(...args); }
  function updateExportPreview(...args) { initSubModules(); return gmmExportMod.updateExportPreview(...args); }
  function openExportWorksheetModal(...args) { initSubModules(); return gmmExportMod.openExportWorksheetModal(...args); }
  function closeExportModal(...args) { initSubModules(); return gmmExportMod.closeExportModal(...args); }
  function exportWorksheetPdf(...args) { initSubModules(); return gmmExportMod.exportWorksheetPdf(...args); }
  function exportWorksheetWord(...args) { initSubModules(); return gmmExportMod.exportWorksheetWord(...args); }
  function printWorksheetDirect(...args) { initSubModules(); return gmmExportMod.printWorksheetDirect(...args); }
  function downloadHighResPng(...args) { initSubModules(); return gmmExportMod.downloadHighResPng(...args); }
  function downloadVectorSvg(...args) { initSubModules(); return gmmExportMod.downloadVectorSvg(...args); }
  function printWorksheet(...args) { initSubModules(); return gmmExportMod.printWorksheet(...args); }
  function exportClassMemorySnapshot(...args) { initSubModules(); return gmmExportMod.exportClassMemorySnapshot(...args); }

  // Host Arena module delegators
  function renderDualArena(...args) { initSubModules(); return gmmHostArenaMod.renderDualArena(...args); }
  function getConnectedTeams(...args) { initSubModules(); return gmmHostArenaMod.getConnectedTeams(...args); }
  function getArenaLiveSnapshot(...args) { initSubModules(); return gmmHostArenaMod.getArenaLiveSnapshot(...args); }
  function getTeamAnsweredCount(...args) { initSubModules(); return gmmHostArenaMod.getTeamAnsweredCount(...args); }
  function applyTeamUnlockOnHost(...args) { initSubModules(); return gmmHostArenaMod.applyTeamUnlockOnHost(...args); }
  function toggleMatchPause(...args) { initSubModules(); return gmmHostArenaMod.toggleMatchPause(...args); }
  function addMatchSeconds(...args) { initSubModules(); return gmmHostArenaMod.addMatchSeconds(...args); }
  function addMatchMinute(...args) { initSubModules(); return gmmHostArenaMod.addMatchMinute(...args); }
  function setMatchDuration(...args) { initSubModules(); return gmmHostArenaMod.setMatchDuration(...args); }
  function forceLockBothTeams(...args) { initSubModules(); return gmmHostArenaMod.forceLockBothTeams(...args); }
  function toggleBattleMusic(...args) { initSubModules(); return gmmHostArenaMod.toggleBattleMusic(...args); }
  function toggleBattleMusicGenre(...args) { initSubModules(); return gmmHostArenaMod.toggleBattleMusicGenre(...args); }
  function stopBattleMusicUI(...args) { initSubModules(); return gmmHostArenaMod.stopBattleMusicUI(...args); }
  function prepareFreshMatchSession(...args) { initSubModules(); return gmmHostArenaMod.prepareFreshMatchSession(...args); }
  function startDualMatch(...args) { initSubModules(); return gmmHostArenaMod.startDualMatch(...args); }
  function startMatchFromArena(...args) { initSubModules(); return gmmHostArenaMod.startMatchFromArena(...args); }
  function updateTimerDisplay(...args) { initSubModules(); return gmmHostArenaMod.updateTimerDisplay(...args); }
  function updateHeaderScores(...args) { initSubModules(); return gmmHostArenaMod.updateHeaderScores(...args); }
  function renderQuestionUI(...args) { initSubModules(); return gmmHostArenaMod.renderQuestionUI(...args); }
  function renderDecryptUI(...args) { initSubModules(); return gmmHostArenaMod.renderDecryptUI(...args); }
  function renderResultUI(...args) { initSubModules(); return gmmHostArenaMod.renderResultUI(...args); }
  function broadcastHostStateToServer(...args) { initSubModules(); return gmmHostArenaMod.broadcastHostStateToServer(...args); }
  function syncHostInitialConnectionState(...args) { initSubModules(); return gmmHostArenaMod.syncHostInitialConnectionState(...args); }
  function initHostSseListener(...args) { initSubModules(); return gmmHostArenaMod.initHostSseListener(...args); }
  function runCountdownAnimation(...args) { initSubModules(); return gmmHostArenaMod.runCountdownAnimation(...args); }
  function broadcastCountdownState(...args) { initSubModules(); return gmmHostArenaMod.broadcastCountdownState(...args); }

  // Mobile Sync module delegators
  function syncMobileNow(...args) { initSubModules(); return gmmMobileSyncMod.syncMobileNow(...args); }
  function initStudentMobileArena(...args) { initSubModules(); return gmmMobileSyncMod.initStudentMobileArena(...args); }
  function getMobileTelemetrySnapshot(...args) { initSubModules(); return gmmMobileSyncMod.getMobileTelemetrySnapshot(...args); }
  function reportArtworkFinishedFromMobile(...args) { initSubModules(); return gmmMobileSyncMod.reportArtworkFinishedFromMobile(...args); }
  function resetMobileClientState(...args) { initSubModules(); return gmmMobileSyncMod.resetMobileClientState(...args); }
  function toggleReviewQuestions(...args) { initSubModules(); return gmmMobileSyncMod.toggleReviewQuestions(...args); }
  function openMistakesReviewModal(...args) { initSubModules(); return gmmMobileSyncMod.openMistakesReviewModal(...args); }
  function closeMistakesReviewModal(...args) { initSubModules(); return gmmMobileSyncMod.closeMistakesReviewModal(...args); }
  function filterMistakesView(...args) { initSubModules(); return gmmMobileSyncMod.filterMistakesView(...args); }
  function goToMobileQuestion(...args) { initSubModules(); return gmmMobileSyncMod.goToMobileQuestion(...args); }
  function prevMobileQuestion(...args) { initSubModules(); return gmmMobileSyncMod.prevMobileQuestion(...args); }
  function nextMobileQuestion(...args) { initSubModules(); return gmmMobileSyncMod.nextMobileQuestion(...args); }
  function confirmLockMobileTeam(...args) { initSubModules(); return gmmMobileSyncMod.confirmLockMobileTeam(...args); }
  function lockMobileTeam(...args) { initSubModules(); return gmmMobileSyncMod.lockMobileTeam(...args); }
  function closeStudentSseOnExit(...args) { initSubModules(); return gmmMobileSyncMod.closeStudentSseOnExit(...args); }
  function setMobileColor(...args) { initSubModules(); return gmmMobileSyncMod.setMobileColor(...args); }
  function submitPaintFromMobile(...args) { initSubModules(); return gmmMobileSyncMod.submitPaintFromMobile(...args); }
  function triggerMobileCamera(...args) { initSubModules(); return gmmMobileSyncMod.triggerMobileCamera(...args); }
  function triggerMobileGallery(...args) { initSubModules(); return gmmMobileSyncMod.triggerMobileGallery(...args); }
  function handleMobilePhotoSelected(...args) { initSubModules(); return gmmMobileSyncMod.handleMobilePhotoSelected(...args); }
  function toggleMobileAiEnhance(...args) { initSubModules(); return gmmMobileSyncMod.toggleMobileAiEnhance(...args); }
  function rotateMobilePreview(...args) { initSubModules(); return gmmMobileSyncMod.rotateMobilePreview(...args); }
  function stepMobileTilt(...args) { initSubModules(); return gmmMobileSyncMod.stepMobileTilt(...args); }
  function submitCapturedArtworkPhoto(...args) { initSubModules(); return gmmMobileSyncMod.submitCapturedArtworkPhoto(...args); }

  // Liên kết thêm 3 mô-đun Đợt 3: gmmLobbyQr, gmmQuestionBank, gmmArtworkHost
  let gmmLobbyQrMod = null;
  let gmmQuestionBankMod = null;
  let gmmArtworkHostMod = null;

  function initPhase3SubModules(sharedCtx) {
    if (!gmmLobbyQrMod) gmmLobbyQrMod = window.GmmLobbyQr.create(sharedCtx);
    if (!gmmQuestionBankMod) gmmQuestionBankMod = window.GmmQuestionBank.create(sharedCtx);
    if (!gmmArtworkHostMod) gmmArtworkHostMod = window.GmmArtworkHost.create(sharedCtx);
  }

  // Lobby QR delegators
  function getGmmBaseUrl(...args) { initSubModules(); return gmmLobbyQrMod.getGmmBaseUrl(...args); }
  function renderQrCodes(...args) { initSubModules(); return gmmLobbyQrMod.renderQrCodes(...args); }
  function copyBaseUrl(...args) { initSubModules(); return gmmLobbyQrMod.copyBaseUrl(...args); }
  function copyTeamUrl(...args) { initSubModules(); return gmmLobbyQrMod.copyTeamUrl(...args); }
  function promptCustomUrl(...args) { initSubModules(); return gmmLobbyQrMod.promptCustomUrl(...args); }
  function refreshGmmNetworkIp(...args) { initSubModules(); return gmmLobbyQrMod.refreshGmmNetworkIp(...args); }

  // Question Bank & Excel delegators
  function loadQuestionsFromStorage(...args) { initSubModules(); return gmmQuestionBankMod.loadQuestionsFromStorage(...args); }
  function openQuestionEditor(...args) { initSubModules(); return gmmQuestionBankMod.openQuestionEditor(...args); }
  function closeQuestionEditor(...args) { initSubModules(); return gmmQuestionBankMod.closeQuestionEditor(...args); }
  function saveQuestionEdit(...args) { initSubModules(); return gmmQuestionBankMod.saveQuestionEdit(...args); }
  function restoreDefaultQuestions(...args) { initSubModules(); return gmmQuestionBankMod.restoreDefaultQuestions(...args); }
  function downloadQuestionTemplate(...args) { initSubModules(); return gmmQuestionBankMod.downloadQuestionTemplate(...args); }
  function exportQuestionsToExcel(...args) { initSubModules(); return gmmQuestionBankMod.exportQuestionsToExcel(...args); }
  function handleExcelFileUpload(...args) { initSubModules(); return gmmQuestionBankMod.handleExcelFileUpload(...args); }

  // Artwork Host & Zoom delegators
  function applyCanvasAiEnhance(...args) { initSubModules(); return gmmArtworkHostMod.applyCanvasAiEnhance(...args); }
  function renderTransformedCanvas(...args) { initSubModules(); return gmmArtworkHostMod.renderTransformedCanvas(...args); }
  function compressImageClient(...args) { initSubModules(); return gmmArtworkHostMod.compressImageClient(...args); }
  function setArtworkViewMode(...args) { initSubModules(); return gmmArtworkHostMod.setArtworkViewMode(...args); }
  function getTeamArtworkPhoto(...args) { initSubModules(); return gmmArtworkHostMod.getTeamArtworkPhoto(...args); }
  function getTeamPhotoMeta(...args) { initSubModules(); return gmmArtworkHostMod.getTeamPhotoMeta(...args); }
  function toggleAutoFullscreenOnUpload(...args) { initSubModules(); return gmmArtworkHostMod.toggleAutoFullscreenOnUpload(...args); }
  function playSmartKeystoningFx(...args) { initSubModules(); return gmmArtworkHostMod.playSmartKeystoningFx(...args); }
  function attachTeamArtworkPhoto(...args) { initSubModules(); return gmmArtworkHostMod.attachTeamArtworkPhoto(...args); }
  function toggleAiArtworkFilter(...args) { initSubModules(); return gmmArtworkHostMod.toggleAiArtworkFilter(...args); }
  function toggleTiltControl(...args) { initSubModules(); return gmmArtworkHostMod.toggleTiltControl(...args); }
  function adjustTiltAngle(...args) { initSubModules(); return gmmArtworkHostMod.adjustTiltAngle(...args); }
  function onTiltSliderChange(...args) { initSubModules(); return gmmArtworkHostMod.onTiltSliderChange(...args); }
  function resetTiltAngle(...args) { initSubModules(); return gmmArtworkHostMod.resetTiltAngle(...args); }
  function rotateArtworkPhoto(...args) { initSubModules(); return gmmArtworkHostMod.rotateArtworkPhoto(...args); }
  function zoomArtworkPhoto(...args) { initSubModules(); return gmmArtworkHostMod.zoomArtworkPhoto(...args); }
  function handleHostPhotoUpload(...args) { initSubModules(); return gmmArtworkHostMod.handleHostPhotoUpload(...args); }
  function pollServerArtworksOnce(...args) { initSubModules(); return gmmArtworkHostMod.pollServerArtworksOnce(...args); }
  function startHostArtworkPolling(...args) { initSubModules(); return gmmArtworkHostMod.startHostArtworkPolling(...args); }
  function stopHostArtworkPolling(...args) { initSubModules(); return gmmArtworkHostMod.stopHostArtworkPolling(...args); }
  function openZoomModal(...args) { initSubModules(); return gmmArtworkHostMod.openZoomModal(...args); }
  function closeZoomModal(...args) { initSubModules(); return gmmArtworkHostMod.closeZoomModal(...args); }
  function switchZoomTeam(...args) { initSubModules(); return gmmArtworkHostMod.switchZoomTeam(...args); }
  function toggleZoomSplitView(...args) { initSubModules(); return gmmArtworkHostMod.toggleZoomSplitView(...args); }
  function toggleZoomAnswerKey(...args) { initSubModules(); return gmmArtworkHostMod.toggleZoomAnswerKey(...args); }


  initSubModules();
  loadQuestionsFromStorage();

  // Kiểm tra tham số URL khi trang tải (nếu học sinh quét mã QR truy cập thẳng)
  function checkUrlQueryParams() {
    try {
      const params = new URLSearchParams(window.location.search);
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

  // EXPORT RA GLOBAL SCOPE
  window.GiaiMaBiMat = {
    openCoordinatorModal,
    closeCoordinatorModal,
    toggleFullscreen,
    switchTab,
    startGameFromLobby,
    recallToLobby,
    renderQrCodes,
    getGmmBaseUrl,
    copyBaseUrl,
    copyTeamUrl,
    promptCustomUrl,
    refreshGmmNetworkIp,
    startQuestion,
    pauseTimer,
    lockAnswer,
    showCorrectAnswer,
    nextQuestion,
    chooseAnswer,
    startDecryptPhase,
    extendDecryptTime,
    handleRegionClick,
    handleCellClick,
    printWorksheet,
    openExportWorksheetModal,
    closeExportModal,
    updateExportPreview,
    switchExportPreviewPage,
    handleLogoUpload,
    removeLogo,
    appendExtraInfoTemplate,
    exportWorksheetPdf,
    exportWorksheetWord,
    printWorksheetDirect,
    downloadHighResPng,
    downloadVectorSvg,
    autoColorDemo,
    approvePaperArtwork,
    undoApproveArtwork,
    onJudgeScoreChange,
    triggerGoldGlowAura,
    openAsRole,
    setRoleFocus,
    openQuestionEditor,
    closeQuestionEditor,
    saveQuestionEdit,
    restoreDefaultQuestions,
    downloadQuestionTemplate,
    exportQuestionsToExcel,
    handleExcelFileUpload,
    setMobileColor,
    resetGame,
    // Các hàm nâng cấp Đấu trường Đối kháng song song & Mobile 10 câu
    setMatchDuration,
    toggleMatchPause,
    toggleBattleMusic,
    toggleBattleMusicGenre,
    addMatchMinute,
    addMatchSeconds,
    forceLockBothTeams,
    startDualMatch,
    startMatchFromArena,
    renderDualArena,
    goToMobileQuestion,
    prevMobileQuestion,
    nextMobileQuestion,
    confirmLockMobileTeam,
    lockMobileTeam,
    resetMobileClientState,
    syncMobileNow,
    getConnectedTeams,
    getArenaLiveSnapshot,
    closeStudentSseOnExit,
    getTeamAnsweredCount,
    applyTeamUnlockOnHost,
    getMobileTelemetrySnapshot,
    toggleReviewQuestions,
    openMistakesReviewModal,
    closeMistakesReviewModal,
    filterMistakesView,
    setColorA: (c) => { gameState.selectedColorA = c; },
    setColorB: (c) => { gameState.selectedColorB = c; },
    // Thu phóng toàn màn hình tranh & Hiệu ứng lấp lánh Pulse Glow
    openZoomModal,
    closeZoomModal,
    switchZoomTeam,
    toggleZoomSplitView,
    toggleZoomAnswerKey,
    triggerPulseGlow,
    exportClassMemorySnapshot,
    // Tùy chọn ẩn bớt mã tọa độ chưa mở khóa (Stealth Matrix Mode)
    toggleStealthMode,
    updateStealthButtonUI,
    // Chế độ 1 chạm: Sân Khấu Máy Chiếu (Projector Stage View)
    toggleProjectorStageMode,
    enterProjectorStageMode,
    exitProjectorStageMode,
    // Ô Cài Đặt & Điều Hướng Nhanh (Settings Popover)
    toggleSettingsMenu,
    openSettingsMenu,
    closeSettingsMenu,
    // Cài đặt và Thời lượng Tab 4 (Tô Màu Giải Mã Tranh)
    toggleSettingsMenuTab4,
    openSettingsMenuTab4,
    closeSettingsMenuTab4,
    setDecryptDuration,
    toggleDecryptTimer,
    pauseDecryptTimer,
    resumeDecryptTimer,
    openDecryptTimerFullscreen,
    closeDecryptTimerFullscreen,
    toggleAutoFsOnTimerStart,
    // Góc nhìn & Tác phẩm tranh chụp của Đội
    setArtworkViewMode,
    playSmartKeystoningFx,
    attachTeamArtworkPhoto,
    getTeamArtworkPhoto,
    getTeamPhotoMeta,
    toggleAutoFullscreenOnUpload,
    pollServerArtworksOnce,
    rotateArtworkPhoto,
    zoomArtworkPhoto,
    handleHostPhotoUpload,
    // Chụp & Tải ảnh từ Mobile học sinh (Camera + Bộ sưu tập)
    triggerMobileCamera,
    triggerMobileGallery,
    handleMobilePhotoSelected,
    submitCapturedArtworkPhoto,
    // Bộ Lọc Canvas AI Filter & Cân Chỉnh Góc Nghiêng
    applyCanvasAiEnhance,
    toggleAiArtworkFilter,
    toggleTiltControl,
    adjustTiltAngle,
    onTiltSliderChange,
    resetTiltAngle,
    toggleMobileAiEnhance,
    rotateMobilePreview,
    stepMobileTilt,
    // Báo cáo hoàn thành tô tranh sớm từ điện thoại học sinh
    reportArtworkFinishedFromMobile,
    // Chế độ Giao diện Bảng Tranh: Nền Giấy Trắng A1 (Tivi/Máy chiếu) / Nền Tối
    toggleCanvasTheme,
    getCanvasTheme,
    updateCanvasThemeButtonUI,
    // Cài đặt tên đại diện 2 đội (ví dụ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
    getTeamName,
    updateAllTeamNamesUI,
    openTeamNameModal,
    closeTeamNameModal,
    setQuickTeamName,
    resetDefaultTeamNames,
    saveTeamNames
  };

})();