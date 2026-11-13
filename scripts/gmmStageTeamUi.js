/**
 * ==============================================================================
 * MODULE GIAO DIỆN SÂN KHẤU, ĐỔI TÊN ĐỘI & NHẠC NỀN (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmStageTeamUi.js
 * Trách nhiệm: Render tranh SVG theo chủ đề (giấy A1 / tối), chế độ sân khấu,
 * menu cài đặt nhanh, tiêu điểm đội, đổi tên đại diện 2 đội và nhạc nền thi đấu.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmStageTeamUi = {
    create: function (ctx) {
      const {
        gameState,
        STORAGE_KEY_STEALTH_MODE,
        STORAGE_KEY_TEAM_NAMES,
        STORAGE_KEY_CANVAS_THEME,
        renderDualArena,
        renderDecryptUI,
        renderZoomModalContent,
        getActiveZoomTeam,
        broadcastHostStateToServer
      } = ctx;

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
    if (getActiveZoomTeam() === teamKey && typeof renderZoomModalContent === 'function') {
      renderZoomModalContent();
    }

    // Sau 6 giây tự động tắt hiệu ứng lấp lánh, đưa ô về trạng thái mở khóa ổn định
    setTimeout(() => {
      if (gameState.newlyUnlocked && gameState.newlyUnlocked[teamKey]) {
        gameState.newlyUnlocked[teamKey] = gameState.newlyUnlocked[teamKey].filter(id => id !== regionId);
        if (typeof renderDualArena === 'function') renderDualArena();
        if (typeof renderDecryptUI === 'function') renderDecryptUI();
        if (getActiveZoomTeam() === teamKey && typeof renderZoomModalContent === 'function') {
          renderZoomModalContent();
        }
      }
    }, 6000);
  }


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
    if (ctx.isStudentMobile()) {
      const myTeamName = ctx.getStudentTeamKey() === 'teamA' ? nameA : nameB;
      const myNumPrefix = ctx.getStudentTeamKey() === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';
      const mobName = document.getElementById('gmmMobTeamName');
      if (mobName) mobName.textContent = `${myNumPrefix} - ${myTeamName}`.toUpperCase();
      const mobTitle = document.getElementById('gmmMobLobbyTeamTitle');
      if (mobTitle) mobTitle.textContent = (ctx.getStudentTeamKey() === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
      const mobBadge = document.getElementById('gmmMobCountdownTeamBadge');
      if (mobBadge) mobBadge.textContent = (ctx.getStudentTeamKey() === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
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

  function toggleBattleMusic() {
    if (!window.audioManager) return;
    const btn = document.getElementById('gmmBtnBattleMusic');
    const isPlaying = typeof window.audioManager.isBattleMusicPlaying === 'function' && window.audioManager.isBattleMusicPlaying();
    if (isPlaying) {
      window.audioManager.stopBattleMusic();
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
      }
      if (typeof window.showToast === 'function') window.showToast('🔇 Đã tắt nhạc nền thi đấu', 'info');
    } else {
      const ok = window.audioManager.startBattleMusic();
      if (ok) {
        if (btn) {
          btn.classList.add('active');
          btn.innerHTML = '<span>🔊 Nhạc Thi Đấu: BẬT</span>';
        }
        updateBattleMusicUI();
        const genre = (typeof window.audioManager.getBattleMusicGenre === 'function') ? window.audioManager.getBattleMusicGenre() : 'epic';
        const genreName = genre === 'chill' ? 'Nhẹ Nhàng Tập Trung' : 'Sôi Động Kịch Tính';
        if (typeof window.showToast === 'function') window.showToast(`🎵 Đã bật nhạc nền thi đấu [${genreName}]!`, 'success');
      }
    }
  }

  function toggleBattleMusicGenre() {
    if (!window.audioManager) return;
    const current = (typeof window.audioManager.getBattleMusicGenre === 'function')
      ? window.audioManager.getBattleMusicGenre()
      : 'epic';
    const nextGenre = (current === 'epic') ? 'chill' : 'epic';
    if (typeof window.audioManager.setBattleMusicGenre === 'function') {
      window.audioManager.setBattleMusicGenre(nextGenre);
    }
    updateBattleMusicUI();
    if (typeof window.showToast === 'function') {
      if (nextGenre === 'chill') {
        window.showToast('☕ Đã đổi nhạc nền: [Nhẹ Nhàng Tập Trung] (84 BPM Lofi Chill)', 'info');
      } else {
        window.showToast('🔥 Đã đổi nhạc nền: [Sôi Động Kịch Tính] (124 BPM Epic Battle)', 'info');
      }
    }
  }

  function updateBattleMusicUI() {
    const modeBtn = document.getElementById('gmmBtnBattleMusicMode');
    if (!modeBtn) return;
    const isChill = window.audioManager && typeof window.audioManager.getBattleMusicGenre === 'function' && window.audioManager.getBattleMusicGenre() === 'chill';
    modeBtn.className = `gmm-btn-match-ctrl music-mode ${isChill ? 'chill' : 'epic'}`;
    modeBtn.innerHTML = isChill
      ? '<span>☕ Giai Điệu: Nhẹ Nhàng</span>'
      : '<span>🔥 Giai Điệu: Kịch Tính</span>';
  }

  function stopBattleMusicUI(fadeTime = 1.5) {
    if (window.audioManager && typeof window.audioManager.stopBattleMusic === 'function') {
      window.audioManager.stopBattleMusic(fadeTime);
    }
    const btn = document.getElementById('gmmBtnBattleMusic');
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
    }
  }

  // Khởi tạo sạch sẽ dữ liệu phiên thi đấu mới (dùng chung khi bắt đầu ván mới hoặc chơi lại)

      return {
        generateSvgPuzzle,
        toggleCanvasTheme,
        getCanvasTheme,
        updateCanvasThemeButtonUI,
        toggleStealthMode,
        updateStealthButtonUI,
        triggerPulseGlow,
        toggleProjectorStageMode,
        enterProjectorStageMode,
        exitProjectorStageMode,
        updateStageFloatPauseBtn,
        toggleSettingsMenu,
        openSettingsMenu,
        closeSettingsMenu,
        toggleSettingsMenuTab4,
        openSettingsMenuTab4,
        closeSettingsMenuTab4,
        setRoleFocus,
        getTeamName,
        updateAllTeamNamesUI,
        openTeamNameModal,
        closeTeamNameModal,
        setQuickTeamName,
        resetDefaultTeamNames,
        saveTeamNames,
        toggleBattleMusic,
        toggleBattleMusicGenre,
        updateBattleMusicUI,
        stopBattleMusicUI
      };
    }
  };
})();
