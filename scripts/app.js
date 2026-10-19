/**
 * ==============================================================================
 * MODULE ĐIỀU PHỐI ỨNG DỤNG CHÍNH (scripts/app.js)
 * Chịu trách nhiệm khởi tạo DOM, bắt sự kiện (Event Listeners), điều phối
 * các chế độ quay (Slot / Wheel), hiển thị thông báo Toast và khởi chạy App.
 * ==============================================================================
 */

// --- HÀM THÔNG BÁO TOAST ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Khởi tạo và lưu cache DOM Elements
function initDOM() {
  window.DOM = {
    // Nút Header & Cài đặt Âm thanh
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIconOn: document.getElementById('soundIconOn'),
    soundIconOff: document.getElementById('soundIconOff'),
    fullscreenToggleBtn: document.getElementById('fullscreenToggleBtn'),
    btnAudioSettings: document.getElementById('btnAudioSettings'),
    audioSettingsModal: document.getElementById('audioSettingsModal'),
    closeAudioSettingsModal: document.getElementById('closeAudioSettingsModal'),
    audioThemeSelect: document.getElementById('audioThemeSelect'),
    celebrationThemeSelect: document.getElementById('celebrationThemeSelect'),
    btnTestAudioSpin: document.getElementById('btnTestAudioSpin'),
    btnTestAudioVictory: document.getElementById('btnTestAudioVictory'),

    // Nút Sidebar & Dữ liệu
    btnSampleData: document.getElementById('btnSampleData'),
    btnManualInput: document.getElementById('btnManualInput'),
    btnDownloadTemplate: document.getElementById('btnDownloadTemplate'),
    btnResetCalled: document.getElementById('btnResetCalled'),
    btnSpin: document.getElementById('btnSpin'),
    btnReSpin: document.getElementById('btnReSpin'),
    btnAbsentReturn: document.getElementById('btnAbsentReturn'),
    btnOpenBonusWheel: document.getElementById('btnOpenBonusWheel'),
    postSpinActions: document.getElementById('postSpinActions'),
    openSidebarBtn: document.getElementById('openSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    btnDivideAllGroups: document.getElementById('btnDivideAllGroups'),

    // Nút Sao lưu & Khôi phục JSON
    btnExportBackup: document.getElementById('btnExportBackup'),
    btnImportBackup: document.getElementById('btnImportBackup'),
    backupFileInput: document.getElementById('backupFileInput'),
    backupRestoreModal: document.getElementById('backupRestoreModal'),
    closeBackupRestoreModal: document.getElementById('closeBackupRestoreModal'),
    cancelBackupRestoreModal: document.getElementById('cancelBackupRestoreModal'),
    btnRestoreMerge: document.getElementById('btnRestoreMerge'),
    btnRestoreOverwrite: document.getElementById('btnRestoreOverwrite'),

    // Quản lý nhiều lớp
    classSelector: document.getElementById('classSelector'),
    btnNewClass: document.getElementById('btnNewClass'),
    btnRenameClass: document.getElementById('btnRenameClass'),
    btnDeleteClass: document.getElementById('btnDeleteClass'),

    // Chuyển đổi giao diện Slot vs Wheel
    viewSlotBtn: document.getElementById('viewSlotBtn'),
    viewWheelBtn: document.getElementById('viewWheelBtn'),
    wheelStage: document.getElementById('wheelStage'),
    luckyWheelCanvas: document.getElementById('luckyWheelCanvas'),
    wheelPointer: document.getElementById('wheelPointer'),
    wheelCenterCap: document.getElementById('wheelCenterCap'),
    wheelWinnerCard: document.getElementById('wheelWinnerCard'),

    // Sidebar & List & Tabs
    sidebar: document.getElementById('sidebar'),
    dropzone: document.getElementById('dropzone'),
    excelFileInput: document.getElementById('excelFileInput'),
    searchInput: document.getElementById('searchInput'),
    studentsListView: document.getElementById('studentsListView'),
    noRepeatToggle: document.getElementById('noRepeatToggle'),
    tabRemainingBtn: document.getElementById('tabRemainingBtn'),
    tabCalledBtn: document.getElementById('tabCalledBtn'),
    tabHistoryBtn: document.getElementById('tabHistoryBtn'),
    btnResetCounts: document.getElementById('btnResetCounts'),

    // Stats Thống kê
    statTotal: document.getElementById('statTotal'),
    statRemaining: document.getElementById('statRemaining'),
    statCalled: document.getElementById('statCalled'),
    tabCountRemaining: document.getElementById('tabCountRemaining'),
    tabCountCalled: document.getElementById('tabCountCalled'),
    tabCountHistory: document.getElementById('tabCountHistory'),
    stageStudentCount: document.getElementById('stageStudentCount'),

    // Arena Sân khấu
    displayScreen: document.getElementById('displayScreen'),
    modePills: document.querySelectorAll('.mode-pill'),

    // Modal Manual
    manualModal: document.getElementById('manualModal'),
    manualTextarea: document.getElementById('manualTextarea'),
    closeManualModal: document.getElementById('closeManualModal'),
    cancelManualModal: document.getElementById('cancelManualModal'),
    saveManualModal: document.getElementById('saveManualModal'),

    // Modal All Groups
    allGroupsModal: document.getElementById('allGroupsModal'),
    closeAllGroupsModal: document.getElementById('closeAllGroupsModal'),
    closeAllGroupsModalBtn: document.getElementById('closeAllGroupsModalBtn'),
    groupSizeSelect: document.getElementById('groupSizeSelect'),
    btnRegenerateAllGroups: document.getElementById('btnRegenerateAllGroups'),
    allGroupsContainer: document.getElementById('allGroupsContainer'),
    btnCopyGroups: document.getElementById('btnCopyGroups'),

    // Modal Excel Preview
    excelPreviewModal: document.getElementById('excelPreviewModal'),
    closeExcelPreviewModal: document.getElementById('closeExcelPreviewModal'),
    cancelExcelPreviewModal: document.getElementById('cancelExcelPreviewModal'),
    applyExcelPreviewModal: document.getElementById('applyExcelPreviewModal'),
    excelFileName: document.getElementById('excelFileName'),
    excelDetectedStatus: document.getElementById('excelDetectedStatus'),
    excelSheetSelect: document.getElementById('excelSheetSelect'),
    excelSheetField: document.getElementById('excelSheetField'),
    excelHoColSelect: document.getElementById('excelHoColSelect'),
    excelTenColSelect: document.getElementById('excelTenColSelect'),
    excelPreviewCountBadge: document.getElementById('excelPreviewCountBadge'),
    excelPreviewTableBody: document.getElementById('excelPreviewTableBody'),
    excelTargetCurrentName: document.getElementById('excelTargetCurrentName'),
    excelTargetNewName: document.getElementById('excelTargetNewName'),

    // Modal Quản Lý Lớp Học
    classModal: document.getElementById('classModal'),
    closeClassModal: document.getElementById('closeClassModal'),
    cancelClassModal: document.getElementById('cancelClassModal'),
    saveClassModal: document.getElementById('saveClassModal'),
    classModalTitle: document.getElementById('classModalTitle'),
    classNameInput: document.getElementById('classNameInput'),

    // Modal Vòng Quay Điểm Thưởng (Bonus Points Wheel)
    bonusWheelModal: document.getElementById('bonusWheelModal'),
    closeBonusWheelModal: document.getElementById('closeBonusWheelModal'),
    btnSpinBonus: document.getElementById('btnSpinBonus'),
    bonusWheelCanvas: document.getElementById('bonusWheelCanvas'),
    bonusStudentTitle: document.getElementById('bonusStudentTitle'),
    bonusWinnerCard: document.getElementById('bonusWinnerCard'),
    btnEditRewards: document.getElementById('btnEditRewards'),

    // Modal Chỉnh Sửa Phần Thưởng Tùy Biến (Custom Rewards Editor)
    rewardsEditorModal: document.getElementById('rewardsEditorModal'),
    closeRewardsEditorModal: document.getElementById('closeRewardsEditorModal'),
    cancelRewardsEditorModal: document.getElementById('cancelRewardsEditorModal'),
    btnAddRewardRow: document.getElementById('btnAddRewardRow'),
    btnSaveRewardsEditor: document.getElementById('btnSaveRewardsEditor'),
    btnResetDefaultRewards: document.getElementById('btnResetDefaultRewards'),

    // Bộ Đồng Hồ Đếm Ngược (Countdown Question Timer)
    countdownTimerWidget: document.getElementById('countdownTimerWidget'),
    timerDigits: document.getElementById('timerDigits'),
    btnTimerToggle: document.getElementById('btnTimerToggle'),
    btnTimerReset: document.getElementById('btnTimerReset'),
    btnTimer15: document.getElementById('btnTimer15'),
    btnTimer30: document.getElementById('btnTimer30'),
    btnTimer60: document.getElementById('btnTimer60'),
    timerSvgProgress: document.getElementById('timerSvgProgress'),

    // Bổ sung Game Activity Hub & Dual Mode Elements
    btnModeClassicSpin: document.getElementById('btnModeClassicSpin'),
    btnModeQuizArena: document.getElementById('btnModeQuizArena'),
    btnModeSeatingChart: document.getElementById('btnModeSeatingChart'),
    btnModeMinigames: document.getElementById('btnModeMinigames'),
    arenaContainer: document.getElementById('arenaContainer'),
    subbarClassic: document.getElementById('subbarClassic'),
    subbarQuiz: document.getElementById('subbarQuiz'),
    subbarSeating: document.getElementById('subbarSeating'),
    subbarMinigames: document.getElementById('subbarMinigames'),
    btnToggleQuestionVisibility: document.getElementById('btnToggleQuestionVisibility'),

    // Chế Độ Đấu Trường Trắc Nghiệm / Rung Chuông Vàng (Quiz Arena)
    btnToggleQuizMode: document.getElementById('btnToggleQuizMode'),
    quizArenaSection: document.getElementById('quizArenaSection'),
    quizManagerModal: document.getElementById('quizManagerModal'),
    closeQuizManagerModal: document.getElementById('closeQuizManagerModal'),
    btnAddNewSingleQuiz: document.getElementById('btnAddNewSingleQuiz'),
    btnApplyBulkQuiz: document.getElementById('btnApplyBulkQuiz'),
    btnResetDefaultQuiz: document.getElementById('btnResetDefaultQuiz'),
    btnImportQuizFile: document.getElementById('btnImportQuizFile'),
    btnExportQuizExcel: document.getElementById('btnExportQuizExcel'),
    btnExportQuizJson: document.getElementById('btnExportQuizJson'),
    btnDownloadQuizTemplate: document.getElementById('btnDownloadQuizTemplate'),
    quizFileInput: document.getElementById('quizFileInput'),
    quizEditQuestionModal: document.getElementById('quizEditQuestionModal'),
    quizImageLightboxModal: document.getElementById('quizImageLightboxModal')
  };
}

// --- CẬP NHẬT GIAO DIỆN & DANH SÁCH (RENDER) ---
function updateUI() {
  const DOM = window.DOM;
  const state = window.state;
  if (!DOM) return;

  const cls = getCurrentClass();
  const all = getAllStudents();
  const remainingStudents = getAvailableStudents();
  const calledCount = cls ? cls.called.length : 0;
  const totalCount = all.length;
  const historyCount = (cls && cls.history) ? cls.history.length : 0;

  if (DOM.statTotal) DOM.statTotal.textContent = totalCount;
  if (DOM.statRemaining) DOM.statRemaining.textContent = remainingStudents.length;
  if (DOM.statCalled) DOM.statCalled.textContent = calledCount;
  if (DOM.tabCountRemaining) DOM.tabCountRemaining.textContent = remainingStudents.length;
  if (DOM.tabCountCalled) DOM.tabCountCalled.textContent = calledCount;
  if (DOM.tabCountHistory) DOM.tabCountHistory.textContent = historyCount;
  if (DOM.stageStudentCount) DOM.stageStudentCount.textContent = `${remainingStudents.length}/${totalCount}`;

  const navClassNameEl = document.getElementById('navCurrentClassName');
  if (navClassNameEl) {
    navClassNameEl.textContent = cls ? cls.name : 'Chưa có lớp';
  }

  renderClassSelector();
  renderStudentsList();

  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') {
    drawLuckyWheel();
  }

  if (state.gameMode === 'seating' && window.SeatingChartModule && typeof window.SeatingChartModule.render === 'function') {
    window.SeatingChartModule.render();
  }

  // Tự động đồng bộ trạng thái mới nhất sang Remote trên điện thoại
  if (window.RemoteSync && typeof window.RemoteSync.broadcastFullState === 'function') {
    window.RemoteSync.broadcastFullState();
  }

  // Đồng bộ nhãn lớp và số lượng học sinh lên Navbar Trang chủ
  if (typeof window.updateLiveMetrics === 'function') {
    window.updateLiveMetrics();
  }
}

// Vẽ danh sách học sinh trong Sidebar (hỗ trợ tab Chờ gọi, Đã gọi và Lịch sử gọi)
function renderStudentsList() {
  const DOM = window.DOM;
  const state = window.state;
  if (!DOM || !DOM.studentsListView) return;

  DOM.studentsListView.innerHTML = '';
  const cls = getCurrentClass();
  if (!cls) return;

  // Xử lý riêng khi lớp chưa có học sinh nào (Lớp mới tạo độc lập)
  if (!cls.students || cls.students.length === 0) {
    DOM.studentsListView.innerHTML = `
      <div style="text-align: center; color: #64748b; padding: 26px 12px; font-size: 0.85rem;">
        <div style="font-size: 2rem; margin-bottom: 6px;">📂</div>
        <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 4px;">Lớp này chưa có học sinh</div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 14px; line-height: 1.4;">
          Lớp đang ở trạng thái độc lập (0 học sinh).<br>Thầy hãy nạp file Excel hoặc nhập danh sách:
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px;" onclick="document.getElementById('excelFileInput').click()">📁 Nạp Excel</button>
          <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px;" onclick="document.getElementById('btnManualInput').click()">📝 Nhập tay</button>
        </div>
      </div>
    `;
    return;
  }

  // Xử lý riêng cho Tab Lịch Sử Gọi Tên
  if (state.activeTab === 'history') {
    const historyList = (cls && Array.isArray(cls.history)) ? cls.history : [];
    if (historyList.length === 0) {
      DOM.studentsListView.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 24px 10px; font-size: 0.85rem;">
          Chưa có lượt gọi nào trong buổi học này.
        </div>
      `;
      return;
    }

    const topBar = document.createElement('div');
    topBar.className = 'history-top-bar';
    topBar.innerHTML = `
      <span style="font-size: 0.8rem; color: #94a3b8;">Đã gọi: <b>${historyList.length}</b> lượt</span>
      <button id="btnResetHistoryCounts" class="btn-text-danger" title="Đặt lại bộ đếm số lần gọi về 0">🔄 Đặt lại đếm</button>
    `;
    topBar.querySelector('#btnResetHistoryCounts').addEventListener('click', () => {
      if (confirm(`Thầy có chắc chắn muốn đặt lại toàn bộ số lần gọi của lớp "${cls.name}" về 0 không?`)) {
        resetCallCounts(true);
      }
    });
    DOM.studentsListView.appendChild(topBar);

    historyList.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <div class="history-item-left">
          <span class="history-index">${idx + 1}</span>
          <span class="history-time">${item.time}</span>
          <span class="history-name" title="${item.name}">${item.name}</span>
        </div>
        ${item.bonusReward ? `<span class="history-reward-badge">${item.bonusReward}</span>` : ''}
      `;
      DOM.studentsListView.appendChild(el);
    });
    return;
  }

  const calledSet = getCalledStudentsSet();
  const isRemainingTab = state.activeTab === 'remaining';

  let list = isRemainingTab
    ? cls.students.filter(name => !calledSet.has(name))
    : cls.students.filter(name => calledSet.has(name));

  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase().trim();
    list = list.filter(name => name.toLowerCase().includes(query));
  }

  if (list.length === 0) {
    DOM.studentsListView.innerHTML = `
      <div style="text-align: center; color: #64748b; padding: 24px 10px; font-size: 0.85rem;">
        ${isRemainingTab ? 'Không còn học sinh nào chờ gọi' : 'Chưa có học sinh nào được gọi'}
      </div>
    `;
    return;
  }

  list.forEach((name, idx) => {
    const callCount = typeof getStudentCallCount === 'function' ? getStudentCallCount(name) : 0;
    const badgeClass = callCount > 1 ? 'badge-high' : (callCount === 1 ? 'badge-one' : 'badge-zero');

    const isJustCalled = !isRemainingTab && (window.lastCalledWinnerName === name);
    const item = document.createElement('div');
    item.className = `student-item ${!isRemainingTab ? 'called-tag' : ''} ${isJustCalled ? 'just-called' : ''}`;
    item.innerHTML = `
      <span class="st-index">${idx + 1}</span>
      <span class="st-name" title="${name}">${name}</span>
      <span class="call-badge ${badgeClass}" title="Đã được gọi ${callCount} lần trong buổi học">${callCount} lần</span>
      <button class="st-action" title="Xóa học sinh này" data-name="${name}">✕</button>
    `;

    item.querySelector('.st-action').addEventListener('click', (e) => {
      e.stopPropagation();
      removeStudent(name);
    });

    DOM.studentsListView.appendChild(item);
  });
}

// Khởi tạo sân khấu theo chế độ quay (Single, Pair, Group4, Group6)
function renderDefaultStage() {
  const DOM = window.DOM;
  const state = window.state;
  if (!DOM || !DOM.displayScreen) return;

  if (DOM.postSpinActions) DOM.postSpinActions.classList.remove('visible');
  const mode = state.currentMode;

  if (mode === 'single') {
    DOM.displayScreen.innerHTML = `
      <div class="single-mode-box" id="singleCard">
        <div class="single-avatar">🎯</div>
        <div class="single-name-display" id="singleName">Sẵn sàng quay</div>
        <div class="single-subtitle">Bấm nút "QUAY TÊN NGAY" hoặc phím Space để bắt đầu</div>
      </div>
    `;
  } else if (mode === 'pair') {
    DOM.displayScreen.innerHTML = `
      <div class="pair-container">
        <div class="pair-card" id="pairCard1">
          <span class="pair-badge team-1">Học sinh 1</span>
          <div class="pair-name" id="pairName1">Bạn thứ nhất</div>
        </div>
        <div class="vs-circle">VS</div>
        <div class="pair-card" id="pairCard2">
          <span class="pair-badge team-2">Học sinh 2</span>
          <div class="pair-name" id="pairName2">Bạn thứ hai</div>
        </div>
      </div>
    `;
  } else if (mode === 'group4') {
    DOM.displayScreen.innerHTML = `
      <div class="group-grid grid-4" id="groupGrid">
        ${[1, 2, 3, 4].map(num => `
          <div class="group-card" id="groupCard${num}">
            <div class="group-card-num">${num}</div>
            <div class="group-card-name" id="groupName${num}">Thành viên ${num}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (mode === 'group6') {
    DOM.displayScreen.innerHTML = `
      <div class="group-grid grid-6" id="groupGrid">
        ${[1, 2, 3, 4, 5, 6].map(num => `
          <div class="group-card" id="groupCard${num}">
            <div class="group-card-num">${num}</div>
            <div class="group-card-name" id="groupName${num}">Thành viên ${num}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Chuyển đổi giao diện Slot Machine vs Lucky Wheel (Hiển thị đúng trò chơi đã chọn)
function switchViewMode(mode) {
  const state = window.state;
  const DOM = window.DOM;
  state.viewMode = mode;

  if (DOM.viewSlotBtn) DOM.viewSlotBtn.classList.toggle('active', mode === 'slot');
  if (DOM.viewWheelBtn) DOM.viewWheelBtn.classList.toggle('active', mode === 'wheel');

  const stageTag = document.getElementById('classicGameStageTag');
  const stageIcon = document.getElementById('classicGameStageIcon');
  const stageTitle = document.getElementById('classicGameStageTitle');
  const slotModeBar = document.getElementById('slotModeBar');
  const btnWheelSettings = document.getElementById('btnWheelStageSettings');

  if (mode === 'slot') {
    if (DOM.displayScreen) DOM.displayScreen.classList.add('active');
    if (DOM.wheelStage) DOM.wheelStage.classList.remove('active');
    if (stageIcon) stageIcon.textContent = '🎰';
    if (stageTitle) stageTitle.textContent = 'Thẻ Lướt Hồi Hộp';
    if (stageTag) stageTag.className = 'current-game-stage-tag theme-slot';
    if (slotModeBar) slotModeBar.style.display = 'flex';
    if (btnWheelSettings) btnWheelSettings.style.display = 'none';
    renderDefaultStage();
  } else {
    if (DOM.displayScreen) DOM.displayScreen.classList.remove('active');
    if (DOM.wheelStage) DOM.wheelStage.classList.add('active');
    if (DOM.wheelWinnerCard) DOM.wheelWinnerCard.style.display = 'none';
    if (stageIcon) stageIcon.textContent = '🎡';
    if (stageTitle) stageTitle.textContent = 'Vòng Quay May Mắn';
    if (stageTag) stageTag.className = 'current-game-stage-tag';
    if (slotModeBar) slotModeBar.style.display = 'none';
    if (btnWheelSettings) btnWheelSettings.style.display = 'inline-flex';
    if (typeof drawLuckyWheel === 'function') drawLuckyWheel();
  }
  saveStateToStorage();

  if (typeof syncGameNavSidebar === 'function') {
    syncGameNavSidebar(state.gameMode || 'classic', mode);
  }
}

// Điều phối hàm quay (Spin Dispatcher)
function spin() {
  if (window.state.viewMode === 'wheel') {
    spinLuckyWheel();
  } else {
    spinSlot();
  }
}

// Quay theo kiểu thẻ lướt (Slot Rolling)
function spinSlot() {
  const state = window.state;
  const DOM = window.DOM;
  if (state.isSpinning) return;

  const available = getAvailableStudents();
  const all = getAllStudents();
  const countNeeded = getModeStudentCount(state.currentMode);

  if (all.length === 0) {
    showToast('Vui lòng thêm học sinh hoặc dùng dữ liệu mẫu trước!', 'warning');
    return;
  }

  if (available.length < countNeeded) {
    if (state.noRepeat && getCalledStudentsSet().size > 0) {
      showToast(`Chỉ còn ${available.length} bạn chưa được gọi. Đã tự động làm mới danh sách!`, 'info');
      resetCalledList(false);
      return spinSlot();
    } else {
      showToast(`Cần ít nhất ${countNeeded} học sinh để quay chế độ này!`, 'warning');
      return;
    }
  }

  state.isSpinning = true;
  if (DOM.btnSpin) DOM.btnSpin.disabled = true;
  if (DOM.postSpinActions) DOM.postSpinActions.classList.remove('visible');
  if (window.sound) window.sound.init();

  const winners = pickRandomWinners(available, countNeeded);
  state.lastResult = winners;

  const duration = 2500;
  const startTime = performance.now();
  let lastTickTime = 0;
  let tickInterval = 60;

  applySpinningEffect(true);

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    tickInterval = 60 + Math.pow(progress, 2.5) * 260;

    if (currentTime - lastTickTime >= tickInterval) {
      lastTickTime = currentTime;
      displayRollingNames(all);
      const pitch = 500 + progress * 350;
      if (window.sound) window.sound.playTick(pitch);
    }

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      finalizeSpin(winners);
    }
  }

  requestAnimationFrame(animateSpin);
}

function getModeStudentCount(mode) {
  switch (mode) {
    case 'single': return 1;
    case 'pair': return 2;
    case 'group4': return 4;
    case 'group6': return 6;
    default: return 1;
  }
}

function pickRandomWinners(arr, k) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < k; i++) {
    const randIdx = Math.floor(Math.random() * copy.length);
    result.push(copy[randIdx]);
    copy.splice(randIdx, 1);
  }
  return result;
}

function displayRollingNames(studentList) {
  const mode = window.state.currentMode;
  const getRandom = () => studentList[Math.floor(Math.random() * studentList.length)] || "...";

  if (mode === 'single') {
    const nameEl = document.getElementById('singleName');
    if (nameEl) nameEl.textContent = getRandom();
  } else if (mode === 'pair') {
    const p1 = document.getElementById('pairName1');
    const p2 = document.getElementById('pairName2');
    if (p1) p1.textContent = getRandom();
    if (p2) p2.textContent = getRandom();
  } else if (mode === 'group4') {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`groupName${i}`);
      if (el) el.textContent = getRandom();
    }
  } else if (mode === 'group6') {
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById(`groupName${i}`);
      if (el) el.textContent = getRandom();
    }
  }
}

function applySpinningEffect(isSpinning) {
  const mode = window.state.currentMode;
  if (mode === 'single') {
    const card = document.getElementById('singleCard');
    if (card) {
      card.classList.toggle('spinning', isSpinning);
      card.classList.remove('winner');
    }
  } else if (mode === 'pair') {
    const c1 = document.getElementById('pairCard1');
    const c2 = document.getElementById('pairCard2');
    if (c1) { c1.classList.toggle('spinning', isSpinning); c1.classList.remove('winner'); }
    if (c2) { c2.classList.toggle('spinning', isSpinning); c2.classList.remove('winner'); }
  } else if (mode === 'group4' || mode === 'group6') {
    const count = mode === 'group4' ? 4 : 6;
    for (let i = 1; i <= count; i++) {
      const card = document.getElementById(`groupCard${i}`);
      if (card) {
        card.classList.toggle('spinning', isSpinning);
        card.classList.remove('winner');
      }
    }
  }
}

function finalizeSpin(winners) {
  const state = window.state;
  const DOM = window.DOM;

  state.isSpinning = false;
  if (DOM.btnSpin) DOM.btnSpin.disabled = false;
  applySpinningEffect(false);

  const mode = state.currentMode;

  if (mode === 'single') {
    const card = document.getElementById('singleCard');
    const nameEl = document.getElementById('singleName');
    if (nameEl) {
      nameEl.textContent = winners[0];
      nameEl.classList.add('winner-text');
    }
    if (card) card.classList.add('winner');
  } else if (mode === 'pair') {
    const c1 = document.getElementById('pairCard1');
    const c2 = document.getElementById('pairCard2');
    const p1 = document.getElementById('pairName1');
    const p2 = document.getElementById('pairName2');
    if (p1) p1.textContent = winners[0];
    if (p2) p2.textContent = winners[1];
    if (c1) c1.classList.add('winner');
    if (c2) c2.classList.add('winner');
  } else if (mode === 'group4' || mode === 'group6') {
    const count = mode === 'group4' ? 4 : 6;
    for (let i = 1; i <= count; i++) {
      const card = document.getElementById(`groupCard${i}`);
      const nameEl = document.getElementById(`groupName${i}`);
      if (nameEl) nameEl.textContent = winners[i - 1];
      if (card) card.classList.add('winner');
    }
  }

  if (state.noRepeat) {
    const cls = getCurrentClass();
    if (cls) {
      winners.forEach(w => {
        if (!cls.called.includes(w)) cls.called.push(w);
      });
    }
  }

  // Ghi nhận số lần gọi học sinh và lưu lịch sử
  if (typeof recordStudentCall === 'function') {
    winners.forEach(w => recordStudentCall(w));
  }

  if (window.sound) window.sound.playVictory();
  if (typeof triggerCelebrationConfetti === 'function') triggerCelebrationConfetti();

  // Kích hoạt giọng đọc bình luận viên AI gọi tên học sinh
  if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speakWinner === 'function' && Array.isArray(winners) && winners.length === 1) {
    const rawWinner = winners[0];
    const spokenName = (window.SeatingChartModule && typeof window.SeatingChartModule.getSpokenName === 'function')
      ? window.SeatingChartModule.getSpokenName(rawWinner)
      : rawWinner;
    window.voiceAnnouncer.speakWinner({ name: spokenName });
  }

  updateUI();
  saveStateToStorage();
  if (DOM.postSpinActions) DOM.postSpinActions.classList.add('visible');
}

// --- BỘ ĐỒNG HỒ ĐẾM NGƯỢC TRẢ LỜI CÂU HỎI (COUNTDOWN TIMER) ---
const timerState = {
  totalSeconds: 30,
  remainingSeconds: 30,
  intervalId: null,
  isRunning: false
};

function broadcastTimerIfAvailable() {
  if (window.RemoteSync && typeof window.RemoteSync.broadcastTimerState === 'function') {
    window.RemoteSync.broadcastTimerState();
  }
}

function getTimerState() {
  return {
    totalSeconds: timerState.totalSeconds,
    remainingSeconds: timerState.remainingSeconds,
    isRunning: timerState.isRunning
  };
}

function setTimerDuration(seconds) {
  stopTimer();
  timerState.totalSeconds = seconds;
  timerState.remainingSeconds = seconds;
  updateTimerUI();
  broadcastTimerIfAvailable();
  if (typeof showToast === 'function') {
    showToast(`⏱️ Đã đặt thời gian đếm ngược: ${seconds} giây`, 'info');
  }
}

function startTimer() {
  if (timerState.isRunning) return;
  if (window.sound) window.sound.init();

  timerState.isRunning = true;
  updateTimerButtons();
  broadcastTimerIfAvailable();

  if (window.sound) window.sound.playTimerTick(timerState.remainingSeconds);

  timerState.intervalId = setInterval(() => {
    timerState.remainingSeconds--;
    updateTimerUI();
    broadcastTimerIfAvailable();

    if (timerState.remainingSeconds > 0) {
      if (window.sound) {
        window.sound.playTimerTick(timerState.remainingSeconds);
      }
    } else {
      stopTimer();
      timerState.remainingSeconds = 0;
      updateTimerUI();
      broadcastTimerIfAvailable();

      if (window.sound) {
        window.sound.playTimerBuzzer();
      }

      const widget = document.getElementById('countdownTimerWidget');
      if (widget) {
        widget.classList.add('time-up-pulse');
        setTimeout(() => widget.classList.remove('time-up-pulse'), 3500);
      }

      if (typeof showToast === 'function') {
        showToast('⏰ HẾT GIỜ! Đã kết thúc thời gian suy nghĩ trả lời!', 'warning');
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  timerState.isRunning = false;
  updateTimerButtons();
  broadcastTimerIfAvailable();
}

function toggleTimer() {
  if (timerState.isRunning) {
    stopTimer();
  } else {
    if (timerState.remainingSeconds <= 0) {
      timerState.remainingSeconds = timerState.totalSeconds;
    }
    startTimer();
  }
}

function resetTimer() {
  stopTimer();
  timerState.remainingSeconds = timerState.totalSeconds;
  updateTimerUI();
  broadcastTimerIfAvailable();
}

function updateTimerUI() {
  const digits = document.getElementById('timerDigits');
  const ring = document.getElementById('timerSvgProgress');

  if (digits) {
    const mins = Math.floor(timerState.remainingSeconds / 60);
    const secs = timerState.remainingSeconds % 60;
    digits.textContent = `${mins > 0 ? mins + ':' : ''}${secs < 10 ? '0' : ''}${secs}s`;

    if (timerState.remainingSeconds <= 5 && timerState.remainingSeconds > 0) {
      digits.classList.add('urgent');
    } else {
      digits.classList.remove('urgent');
    }
  }

  if (ring) {
    const circumference = 251.32;
    const percent = timerState.totalSeconds > 0 ? (timerState.remainingSeconds / timerState.totalSeconds) : 0;
    const offset = circumference * (1 - percent);
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = timerState.remainingSeconds <= 5 ? '#ef4444' : '#38bdf8';
  }
}

function updateTimerButtons() {
  const toggleBtn = document.getElementById('btnTimerToggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = timerState.isRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu';
    toggleBtn.classList.toggle('running', timerState.isRunning);
  }
}

// --- TÍNH NĂNG CHIA CẢ LỚP THÀNH CÁC NHÓM ---
function openAllGroupsModal() {
  const all = getAllStudents();
  if (all.length === 0) {
    showToast('Vui lòng thêm học sinh trước khi chia nhóm!', 'warning');
    return;
  }
  generateAllGroupsView();
  if (window.DOM.allGroupsModal) window.DOM.allGroupsModal.classList.add('open');
}

function generateAllGroupsView() {
  const DOM = window.DOM;
  const groupSize = parseInt(DOM.groupSizeSelect.value, 10) || 4;
  const all = getAllStudents();
  if (all.length === 0) return;

  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const groups = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }

  DOM.allGroupsContainer.innerHTML = '';
  groups.forEach((grp, idx) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'group-result-box';
    groupEl.innerHTML = `
      <div class="group-result-header">
        <span>Nhóm ${idx + 1}</span>
        <span style="font-size: 0.8rem; opacity: 0.8;">(${grp.length} bạn)</span>
      </div>
      <ol class="group-result-members">
        ${grp.map(member => `<li>${member}</li>`).join('')}
      </ol>
    `;
    DOM.allGroupsContainer.appendChild(groupEl);
  });
}

function copyGroupsToClipboard() {
  const boxes = window.DOM.allGroupsContainer.querySelectorAll('.group-result-box');
  if (boxes.length === 0) return;

  let textOutput = `=== DANH SÁCH CHIA NHÓM LỚP HỌC ===\n\n`;
  boxes.forEach((box) => {
    const title = box.querySelector('.group-result-header span').textContent;
    const members = Array.from(box.querySelectorAll('li')).map((li, idx) => `  ${idx + 1}. ${li.textContent}`).join('\n');
    textOutput += `${title}:\n${members}\n\n`;
  });

  navigator.clipboard.writeText(textOutput).then(() => {
    showToast('Đã sao chép danh sách nhóm vào bộ nhớ tạm!', 'success');
  }).catch(() => {
    showToast('Không thể sao chép tự động. Vui lòng thử lại!', 'warning');
  });
}

// --- CÀI ĐẶT SỰ KIỆN TƯƠNG TÁC (EVENT LISTENERS) ---
function setupEventListeners() {
  const DOM = window.DOM;
  const state = window.state;

  // 1. Phím tắt Bàn phím: Space để quay, M để bật/tắt âm thanh
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (state.gameMode === 'seating' && window.SeatingChartModule) {
        window.SeatingChartModule.spin();
      } else {
        spin();
      }
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    } else if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // 2. Nút Quay Chính & Nút Phụ
  if (DOM.btnSpin) DOM.btnSpin.addEventListener('click', spin);
  if (DOM.btnReSpin) DOM.btnReSpin.addEventListener('click', spin);
  if (DOM.btnAbsentReturn) DOM.btnAbsentReturn.addEventListener('click', returnAbsentStudents);

  // 3. Chuyển đổi chế độ gọi tên (Mode Pills)
  DOM.modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (state.isSpinning) return;
      DOM.modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentMode = pill.getAttribute('data-mode');

      if (state.currentMode !== 'single' && state.viewMode === 'wheel') {
        switchViewMode('slot');
        showToast('Chế độ Cặp đôi và Nhóm sử dụng màn hình Thẻ lướt!', 'info');
      } else {
        renderDefaultStage();
      }
      saveStateToStorage();
    });
  });

  // 4. Bật / Tắt Âm thanh
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    if (DOM.soundToggleBtn) DOM.soundToggleBtn.classList.toggle('active', state.soundEnabled);
    if (DOM.soundIconOn) DOM.soundIconOn.style.display = state.soundEnabled ? 'block' : 'none';
    if (DOM.soundIconOff) DOM.soundIconOff.style.display = state.soundEnabled ? 'none' : 'block';
    saveStateToStorage();
    showToast(`Âm thanh: ${state.soundEnabled ? 'BẬT' : 'TẮT'}`, 'info');
  }
  if (DOM.soundToggleBtn) DOM.soundToggleBtn.addEventListener('click', toggleSound);

  // 5. Bật / Tắt Toàn màn hình & Tự động ẩn Header khi Toàn Màn Hình
  function toggleFullscreen() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (!isFull) {
      const docEl = document.documentElement;
      const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (rfs) {
        rfs.call(docEl).catch(() => {
          showToast('Trình duyệt chặn mở toàn màn hình!', 'warning');
        });
      }
    } else {
      const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (efs) {
        efs.call(document).catch(() => {});
      }
    }
  }

  function handleFullscreenStateChange() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    document.body.classList.toggle('is-fullscreen', isFull);

    if (DOM.fullscreenToggleBtn) {
      DOM.fullscreenToggleBtn.classList.toggle('active', isFull);
      const span = DOM.fullscreenToggleBtn.querySelector('span');
      if (span) span.textContent = isFull ? 'Thu nhỏ' : 'Toàn màn hình';
    }

    const landingBtn = document.getElementById('landingFullscreenBtn');
    if (landingBtn) landingBtn.classList.toggle('active', isFull);

    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('peek-visible');

    if (isFull) {
      showToast('🖥️ Đã bật Toàn Màn Hình! Rê chuột lên mép trên để mở Menu.', 'info');
    }
  }

  if (DOM.fullscreenToggleBtn) {
    DOM.fullscreenToggleBtn.addEventListener('click', toggleFullscreen);
  }
  document.addEventListener('fullscreenchange', handleFullscreenStateChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenStateChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenStateChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenStateChange);

  // Lắng nghe di chuột lên mép trên màn hình khi Toàn Màn Hình để trượt hiện Header
  let headerHideTimer = null;
  window.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('is-fullscreen')) return;
    const header = document.querySelector('.app-header');
    if (!header) return;

    if (e.clientY <= 22) {
      if (headerHideTimer) clearTimeout(headerHideTimer);
      header.classList.add('peek-visible');
    } else {
      const headerRect = header.getBoundingClientRect();
      const isOverHeader = e.clientY <= headerRect.bottom + 10 && e.clientX >= headerRect.left && e.clientX <= headerRect.right;
      const isDropdownOpen = header.querySelector('.header-settings-wrapper.open');

      if (!isOverHeader && !isDropdownOpen && header.classList.contains('peek-visible')) {
        if (!headerHideTimer) {
          headerHideTimer = setTimeout(() => {
            header.classList.remove('peek-visible');
            headerHideTimer = null;
          }, 350);
        }
      }
    }
  });

  const appHeaderEl = document.querySelector('.app-header');
  if (appHeaderEl) {
    appHeaderEl.addEventListener('mouseleave', () => {
      if (!document.body.classList.contains('is-fullscreen')) return;
      const isDropdownOpen = appHeaderEl.querySelector('.header-settings-wrapper.open');
      if (!isDropdownOpen) {
        if (headerHideTimer) clearTimeout(headerHideTimer);
        headerHideTimer = setTimeout(() => {
          appHeaderEl.classList.remove('peek-visible');
          headerHideTimer = null;
        }, 350);
      }
    });
  }

  window.toggleFullscreen = toggleFullscreen;
  window.toggleFullscreenHeaderPeek = function() {
    const header = document.querySelector('.app-header');
    if (header) header.classList.toggle('peek-visible');
  };

  // 6. Nút Dữ liệu mẫu (45 học sinh chuẩn lớp 9A4)
  if (DOM.btnSampleData) {
    DOM.btnSampleData.addEventListener('click', () => {
      setNewStudentList(SAMPLE_STUDENTS, 'current');
      const cls = getCurrentClass();
      showToast(`Đã nạp 45 học sinh mẫu vào "${cls ? cls.name : 'lớp'}"!`, 'success');
    });
  }

  // Nút Tải File Excel Mẫu Chuẩn Hóa
  if (DOM.btnDownloadTemplate) {
    DOM.btnDownloadTemplate.addEventListener('click', downloadExcelTemplate);
  }

  // 7. Nhập dữ liệu qua file Excel
  if (DOM.dropzone && DOM.excelFileInput) {
    DOM.dropzone.addEventListener('click', () => DOM.excelFileInput.click());
    DOM.excelFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleExcelFile(e.target.files[0]);
        e.target.value = '';
      }
    });

    DOM.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.dropzone.classList.add('dragover');
    });
    DOM.dropzone.addEventListener('dragleave', () => {
      DOM.dropzone.classList.remove('dragover');
    });
    DOM.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  // 8. Nhập dữ liệu thủ công
  if (DOM.btnManualInput) {
    DOM.btnManualInput.addEventListener('click', () => {
      DOM.manualTextarea.value = getAllStudents().join('\n');
      DOM.manualModal.classList.add('open');
      DOM.manualTextarea.focus();
    });
  }

  const closeManual = () => DOM.manualModal.classList.remove('open');
  if (DOM.closeManualModal) DOM.closeManualModal.addEventListener('click', closeManual);
  if (DOM.cancelManualModal) DOM.cancelManualModal.addEventListener('click', closeManual);

  if (DOM.saveManualModal) {
    DOM.saveManualModal.addEventListener('click', () => {
      const text = DOM.manualTextarea.value;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      if (lines.length === 0) {
        showToast('Vui lòng nhập ít nhất một tên học sinh!', 'warning');
        return;
      }

      setNewStudentList(lines, 'current');
      closeManual();
      showToast(`Đã lưu danh sách gồm ${lines.length} học sinh!`, 'success');
    });
  }

  // 9. Cài đặt không lặp lại & Làm mới danh sách
  if (DOM.noRepeatToggle) {
    DOM.noRepeatToggle.addEventListener('change', (e) => {
      state.noRepeat = e.target.checked;
      updateUI();
      saveStateToStorage();
      showToast(`Chế độ không gọi lại: ${state.noRepeat ? 'BẬT' : 'TẮT'}`, 'info');
    });
  }

  if (DOM.btnResetCalled) DOM.btnResetCalled.addEventListener('click', () => resetCalledList(true));

  // 10. Chuyển Tab Danh sách (Chờ gọi, Đã gọi, Lịch sử gọi)
  if (DOM.tabRemainingBtn) {
    DOM.tabRemainingBtn.addEventListener('click', () => {
      state.activeTab = 'remaining';
      DOM.tabRemainingBtn.classList.add('active');
      DOM.tabCalledBtn.classList.remove('active');
      if (DOM.tabHistoryBtn) DOM.tabHistoryBtn.classList.remove('active');
      renderStudentsList();
    });
  }

  if (DOM.tabCalledBtn) {
    DOM.tabCalledBtn.addEventListener('click', () => {
      state.activeTab = 'called';
      DOM.tabCalledBtn.classList.add('active');
      DOM.tabRemainingBtn.classList.remove('active');
      if (DOM.tabHistoryBtn) DOM.tabHistoryBtn.classList.remove('active');
      renderStudentsList();
    });
  }

  if (DOM.tabHistoryBtn) {
    DOM.tabHistoryBtn.addEventListener('click', () => {
      state.activeTab = 'history';
      DOM.tabHistoryBtn.classList.add('active');
      DOM.tabRemainingBtn.classList.remove('active');
      DOM.tabCalledBtn.classList.remove('active');
      renderStudentsList();
    });
  }

  // 11. Tìm kiếm học sinh
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderStudentsList();
    });
  }

  // 12. Toggle Sidebar Drawer (Mở/Thu gọn mượt mà, đồng bộ Backdrop)
  const openSidebarDrawer = () => {
    if (DOM.sidebar) {
      DOM.sidebar.classList.remove('collapsed');
      DOM.sidebar.classList.add('open');
    }
    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.classList.add('open');
    }
  };

  const closeSidebarDrawer = () => {
    if (DOM.sidebar) {
      DOM.sidebar.classList.add('collapsed');
      DOM.sidebar.classList.remove('open');
    }
    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.classList.remove('open');
    }
  };

  if (DOM.openSidebarBtn) {
    DOM.openSidebarBtn.addEventListener('click', openSidebarDrawer);
  }
  if (DOM.closeSidebarBtn) {
    DOM.closeSidebarBtn.addEventListener('click', closeSidebarDrawer);
  }
  if (DOM.sidebarBackdrop) {
    DOM.sidebarBackdrop.addEventListener('click', closeSidebarDrawer);
  }

  // 13. Modal Chia Toàn Bộ Lớp Thành Nhóm
  if (DOM.btnDivideAllGroups) DOM.btnDivideAllGroups.addEventListener('click', openAllGroupsModal);
  const closeAllGroups = () => DOM.allGroupsModal.classList.remove('open');
  if (DOM.closeAllGroupsModal) DOM.closeAllGroupsModal.addEventListener('click', closeAllGroups);
  if (DOM.closeAllGroupsModalBtn) DOM.closeAllGroupsModalBtn.addEventListener('click', closeAllGroups);
  if (DOM.groupSizeSelect) DOM.groupSizeSelect.addEventListener('change', generateAllGroupsView);
  if (DOM.btnRegenerateAllGroups) DOM.btnRegenerateAllGroups.addEventListener('click', generateAllGroupsView);
  if (DOM.btnCopyGroups) DOM.btnCopyGroups.addEventListener('click', copyGroupsToClipboard);

  // 14. Modal Xem trước & Nhận diện Excel
  if (DOM.excelSheetSelect) {
    DOM.excelSheetSelect.addEventListener('change', () => loadSheetData(DOM.excelSheetSelect.value));
  }
  if (DOM.excelHoColSelect) DOM.excelHoColSelect.addEventListener('change', renderExcelPreviewTable);
  if (DOM.excelTenColSelect) DOM.excelTenColSelect.addEventListener('change', renderExcelPreviewTable);

  const closeExcelModal = () => DOM.excelPreviewModal.classList.remove('open');
  if (DOM.closeExcelPreviewModal) DOM.closeExcelPreviewModal.addEventListener('click', closeExcelModal);
  if (DOM.cancelExcelPreviewModal) DOM.cancelExcelPreviewModal.addEventListener('click', closeExcelModal);

  if (DOM.applyExcelPreviewModal) {
    DOM.applyExcelPreviewModal.addEventListener('click', () => {
      if (!excelSession.parsedStudents || excelSession.parsedStudents.length === 0) {
        showToast('Chưa có học sinh nào hợp lệ để nạp!', 'warning');
        return;
      }

      const targetRadio = document.querySelector('input[name="excelTargetMode"]:checked');
      const targetMode = targetRadio ? targetRadio.value : 'current';
      const targetName = targetMode === 'new' ? (excelSession.suggestedClassName || 'Lớp mới') : '';

      setNewStudentList(excelSession.parsedStudents, targetMode, targetName);
      closeExcelModal();
      const displayLabel = targetMode === 'new' ? `lớp mới "${targetName}"` : 'lớp hiện tại';
      showToast(`🎉 Đã nạp thành công ${excelSession.parsedStudents.length} học sinh vào ${displayLabel}!`, 'success');
    });
  }

  // 15. Quản lý Nhiều Lớp Học
  if (DOM.classSelector) {
    DOM.classSelector.addEventListener('change', (e) => switchClass(e.target.value));
  }
  if (DOM.btnNewClass) DOM.btnNewClass.addEventListener('click', openCreateClassModal);
  if (DOM.btnRenameClass) DOM.btnRenameClass.addEventListener('click', openRenameClassModal);
  if (DOM.btnDeleteClass) DOM.btnDeleteClass.addEventListener('click', deleteCurrentClass);

  // 16. Chuyển đổi Chế độ Giao diện (Thẻ lướt vs Vòng quay)
  if (DOM.viewSlotBtn) DOM.viewSlotBtn.addEventListener('click', () => switchViewMode('slot'));
  if (DOM.viewWheelBtn) DOM.viewWheelBtn.addEventListener('click', () => switchViewMode('wheel'));
  if (DOM.wheelCenterCap) DOM.wheelCenterCap.addEventListener('click', spinLuckyWheel);

  // 17. Modal Lớp Học
  if (DOM.closeClassModal) DOM.closeClassModal.addEventListener('click', () => DOM.classModal.classList.remove('open'));
  if (DOM.cancelClassModal) DOM.cancelClassModal.addEventListener('click', () => DOM.classModal.classList.remove('open'));
  if (DOM.saveClassModal) DOM.saveClassModal.addEventListener('click', saveClassModalSubmit);
  if (DOM.classNameInput) {
    DOM.classNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveClassModalSubmit();
      }
    });
  }

  // 18. Nút Sao Lưu & Khôi Phục JSON (Backup & Restore)
  if (DOM.btnExportBackup) {
    DOM.btnExportBackup.addEventListener('click', exportBackupData);
  }
  if (DOM.btnImportBackup && DOM.backupFileInput) {
    DOM.btnImportBackup.addEventListener('click', () => DOM.backupFileInput.click());
    DOM.backupFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleBackupFileInput(e.target.files[0]);
      }
    });
  }
  if (DOM.btnRestoreMerge) {
    DOM.btnRestoreMerge.addEventListener('click', () => executeRestore('merge'));
  }
  if (DOM.btnRestoreOverwrite) {
    DOM.btnRestoreOverwrite.addEventListener('click', () => executeRestore('overwrite'));
  }
  if (DOM.closeBackupRestoreModal) {
    DOM.closeBackupRestoreModal.addEventListener('click', closeBackupRestoreModal);
  }
  if (DOM.cancelBackupRestoreModal) {
    DOM.cancelBackupRestoreModal.addEventListener('click', closeBackupRestoreModal);
  }

  // 20. Vòng Quay Điểm Thưởng (Bonus Points Wheel)
  if (DOM.btnOpenBonusWheel) {
    DOM.btnOpenBonusWheel.addEventListener('click', openBonusWheelModal);
  }
  if (DOM.btnSpinBonus) {
    DOM.btnSpinBonus.addEventListener('click', spinBonusWheel);
  }
  if (DOM.closeBonusWheelModal) {
    DOM.closeBonusWheelModal.addEventListener('click', closeBonusWheelModal);
  }

  // 21. Cài đặt Chủ Đề Âm Thanh (Audio Themes)
  // 21. Modal Tùy Biến Âm Thanh & Giọng Đọc Bình Luận Viên AI
  window.openAudioSettingsModal = function(focusSection) {
    if (DOM.audioSettingsModal) {
      if (DOM.audioThemeSelect) DOM.audioThemeSelect.value = state.audioTheme || 'classic';
      if (DOM.celebrationThemeSelect) DOM.celebrationThemeSelect.value = state.celebrationTheme || 'fanfare';
      if (window.voiceAnnouncer) {
        window.voiceAnnouncer.syncModalUI();
      }
      DOM.audioSettingsModal.classList.add('open');
      if (focusSection === 'voice') {
        const el = document.getElementById('voiceSettingsSectionWrapper');
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
        }
      }
    }
  };

  if (DOM.btnAudioSettings) {
    DOM.btnAudioSettings.addEventListener('click', () => {
      window.openAudioSettingsModal();
    });
  }
  if (DOM.closeAudioSettingsModal) {
    DOM.closeAudioSettingsModal.addEventListener('click', () => {
      if (DOM.audioSettingsModal) DOM.audioSettingsModal.classList.remove('open');
    });
  }
  if (DOM.audioThemeSelect) {
    DOM.audioThemeSelect.addEventListener('change', (e) => {
      state.audioTheme = e.target.value;
      saveStateToStorage();
      if (window.sound) {
        window.sound.init();
        window.sound.playTick(650, 0.5);
      }
      showToast(`Đã đổi chủ đề âm thanh quay: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
  }
  if (DOM.celebrationThemeSelect) {
    DOM.celebrationThemeSelect.addEventListener('change', (e) => {
      state.celebrationTheme = e.target.value;
      saveStateToStorage();
      if (window.sound) {
        window.sound.init();
        window.sound.playVictory();
      }
      showToast(`Đã đổi âm thanh trúng thưởng: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
  }
  if (DOM.btnTestAudioSpin) {
    DOM.btnTestAudioSpin.addEventListener('click', () => {
      if (window.sound) {
        window.sound.init();
        window.sound.playTick(600, 0.5);
      }
    });
  }
  if (DOM.btnTestAudioVictory) {
    DOM.btnTestAudioVictory.addEventListener('click', () => {
      if (window.sound) {
        window.sound.init();
        window.sound.playVictory();
      }
      if (typeof triggerCelebrationConfetti === 'function') {
        triggerCelebrationConfetti();
      }
    });
  }

  // Sự kiện cho Bộ điều khiển Tốc độ & Cao độ giọng đọc AI
  const voiceRateSlider = document.getElementById('voiceRateSlider');
  if (voiceRateSlider) {
    voiceRateSlider.addEventListener('input', (e) => {
      if (window.voiceAnnouncer) {
        window.voiceAnnouncer.setRate(e.target.value);
      }
    });
  }

  const voicePitchSlider = document.getElementById('voicePitchSlider');
  if (voicePitchSlider) {
    voicePitchSlider.addEventListener('input', (e) => {
      if (window.voiceAnnouncer) {
        window.voiceAnnouncer.setPitch(e.target.value);
      }
    });
  }

  const voiceAnnouncerModalToggle = document.getElementById('voiceAnnouncerModalToggle');
  if (voiceAnnouncerModalToggle) {
    voiceAnnouncerModalToggle.addEventListener('change', (e) => {
      if (window.voiceAnnouncer) {
        window.voiceAnnouncer.enabled = e.target.checked;
        localStorage.setItem('vong_quay_voice_announcer_enabled', String(e.target.checked));
        if (window.SeatingChartModule && typeof window.SeatingChartModule.updateVoiceButtonUI === 'function') {
          window.SeatingChartModule.updateVoiceButtonUI(e.target.checked);
        }
        showToast(e.target.checked ? 'Đã bật giọng đọc bình luận viên AI' : 'Đã tắt giọng đọc bình luận viên AI', 'info');
      }
    });
  }

  const voiceDeviceSelect = document.getElementById('voiceDeviceSelect');
  if (voiceDeviceSelect) {
    voiceDeviceSelect.addEventListener('change', (e) => {
      if (window.voiceAnnouncer && e.target.value) {
        window.voiceAnnouncer.setVoiceByURI(e.target.value);
        showToast('Đã chuyển giọng đọc thành công', 'info');
      }
    });
  }

  // 22. Bộ Tùy Chỉnh Phần Thưởng (Custom Rewards Editor)
  if (DOM.btnEditRewards) {
    DOM.btnEditRewards.addEventListener('click', openRewardsEditorModal);
  }
  if (DOM.closeRewardsEditorModal) {
    DOM.closeRewardsEditorModal.addEventListener('click', closeRewardsEditorModal);
  }
  if (DOM.cancelRewardsEditorModal) {
    DOM.cancelRewardsEditorModal.addEventListener('click', closeRewardsEditorModal);
  }
  if (DOM.btnAddRewardRow) {
    DOM.btnAddRewardRow.addEventListener('click', () => addNewRewardRow());
  }
  if (DOM.btnSaveRewardsEditor) {
    DOM.btnSaveRewardsEditor.addEventListener('click', saveRewardsEditorSubmit);
  }
  if (DOM.btnResetDefaultRewards) {
    DOM.btnResetDefaultRewards.addEventListener('click', resetDefaultRewards);
  }

  // 23. Bộ Đồng Hồ Đếm Ngược (Countdown Question Timer)
  if (DOM.btnTimer15) {
    DOM.btnTimer15.addEventListener('click', () => setTimerDuration(15));
  }
  if (DOM.btnTimer30) {
    DOM.btnTimer30.addEventListener('click', () => setTimerDuration(30));
  }
  if (DOM.btnTimer60) {
    DOM.btnTimer60.addEventListener('click', () => setTimerDuration(60));
  }
  if (DOM.btnTimerToggle) {
    DOM.btnTimerToggle.addEventListener('click', toggleTimer);
  }
  if (DOM.btnTimerReset) {
    DOM.btnTimerReset.addEventListener('click', resetTimer);
  }

  // 24. Chế Độ Đấu Trường Trắc Nghiệm & Game Hub
  if (DOM.btnModeClassicSpin) {
    DOM.btnModeClassicSpin.addEventListener('click', () => {
      if (typeof switchGameMode === 'function') switchGameMode('classic');
    });
  }
  if (DOM.btnModeQuizArena) {
    DOM.btnModeQuizArena.addEventListener('click', () => {
      if (typeof switchGameMode === 'function') switchGameMode('quiz');
    });
  }
  if (DOM.btnModeSeatingChart) {
    DOM.btnModeSeatingChart.addEventListener('click', () => {
      if (typeof switchGameMode === 'function') switchGameMode('seating');
    });
  }
  if (DOM.btnModeMinigames) {
    DOM.btnModeMinigames.addEventListener('click', () => {
      if (typeof switchGameMode === 'function') switchGameMode('minigames');
    });
  }
  if (DOM.btnToggleQuestionVisibility) {
    DOM.btnToggleQuestionVisibility.addEventListener('click', () => {
      if (typeof toggleQuestionVisibility === 'function') toggleQuestionVisibility();
    });
  }
  if (DOM.btnToggleQuizMode) {
    DOM.btnToggleQuizMode.addEventListener('click', toggleQuizMode);
  }
  if (DOM.closeQuizManagerModal) {
    DOM.closeQuizManagerModal.addEventListener('click', closeQuizManagerModal);
  }
  if (DOM.btnAddNewSingleQuiz) {
    DOM.btnAddNewSingleQuiz.addEventListener('click', addNewSingleQuestion);
  }
  if (DOM.btnApplyBulkQuiz) {
    DOM.btnApplyBulkQuiz.addEventListener('click', applyBulkQuizImport);
  }
  if (DOM.btnResetDefaultQuiz) {
    DOM.btnResetDefaultQuiz.addEventListener('click', resetDefaultQuizQuestions);
  }
  if (DOM.btnImportQuizFile && DOM.quizFileInput) {
    DOM.btnImportQuizFile.addEventListener('click', () => DOM.quizFileInput.click());
    DOM.quizFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        if (typeof handleQuizFileInput === 'function') {
          handleQuizFileInput(e.target.files[0]);
        }
        e.target.value = '';
      }
    });
  }
  if (DOM.btnExportQuizExcel) {
    DOM.btnExportQuizExcel.addEventListener('click', () => {
      if (typeof exportQuizToExcel === 'function') exportQuizToExcel();
    });
  }
  if (DOM.btnExportQuizJson) {
    DOM.btnExportQuizJson.addEventListener('click', () => {
      if (typeof exportQuizToJson === 'function') exportQuizToJson();
    });
  }
  if (DOM.btnDownloadQuizTemplate) {
    DOM.btnDownloadQuizTemplate.addEventListener('click', () => {
      if (typeof downloadQuizTemplateExcel === 'function') downloadQuizTemplateExcel();
    });
  }

  // 25. Đóng modal khi bấm ra ngoài nền tối
  [
    DOM.manualModal,
    DOM.allGroupsModal,
    DOM.excelPreviewModal,
    DOM.classModal,
    DOM.backupRestoreModal,
    DOM.bonusWheelModal,
    DOM.audioSettingsModal,
    DOM.rewardsEditorModal,
    DOM.quizManagerModal,
    DOM.quizEditQuestionModal,
    DOM.quizImageLightboxModal
  ].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  });
}

// --- KHỞI CHẠY ỨNG DỤNG LẦN ĐẦU (INITIALIZATION) ---
function init() {
  initDOM();

  const state = window.state;
  const DOM = window.DOM;
  const hasData = loadStateFromStorage();

  if (!hasData || state.classes.length === 0) {
    if (typeof seedSampleClassesAction === 'function') {
      seedSampleClassesAction(false);
    } else {
      const defaultId = 'cls_sample_9a4';
      state.classes = [
        {
          id: defaultId,
          name: 'Lớp 9A4',
          students: (typeof SAMPLE_STUDENTS !== 'undefined') ? [...SAMPLE_STUDENTS] : [],
          called: [],
          callCounts: {},
          history: []
        }
      ];
      state.currentClassId = defaultId;
      if (typeof generateSeatingLayoutForClass === 'function') {
        generateSeatingLayoutForClass(defaultId, state.classes[0].students, { aisles: 4, rows: 6, deskType: 'double' });
      }
    }
    state.viewMode = 'slot';
    state.currentMode = 'single';
    state.gameMode = 'classic';
    state.noRepeat = true;
    state.soundEnabled = true;
    state.audioTheme = 'classic';
    state.celebrationTheme = 'fanfare';
    saveStateToStorage();
  }

  setupEventListeners();

  // Đồng bộ trạng thái vào các điều khiển trên giao diện
  if (DOM.noRepeatToggle) {
    DOM.noRepeatToggle.checked = state.noRepeat;
  }
  if (DOM.soundToggleBtn) {
    DOM.soundToggleBtn.classList.toggle('active', state.soundEnabled);
    DOM.soundIconOn.style.display = state.soundEnabled ? 'block' : 'none';
    DOM.soundIconOff.style.display = state.soundEnabled ? 'none' : 'block';
  }
  if (DOM.audioThemeSelect) {
    DOM.audioThemeSelect.value = state.audioTheme || 'classic';
  }
  if (DOM.celebrationThemeSelect) {
    DOM.celebrationThemeSelect.value = state.celebrationTheme || 'fanfare';
  }

  // Kích hoạt mode pill đã lưu
  DOM.modePills.forEach(pill => {
    if (pill.getAttribute('data-mode') === state.currentMode) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  switchViewMode(state.viewMode || 'slot');
  if (typeof switchGameMode === 'function') {
    switchGameMode(state.gameMode || 'classic');
  }
  updateUI();
  renderDefaultStage();
  console.log("Ứng dụng Vòng Quay Lớp Học (Mô-đun hóa) đã sẵn sàng!");
}

// Tự động khởi chạy khi DOM tải xong
document.addEventListener('DOMContentLoaded', init);

// --- ĐIỀU HƯỚNG TỔNG QUAN DANH SÁCH TRÒ CHƠI & MENU CÀI ĐẶT ---
function selectGame(gameId) {
  // Cập nhật trạng thái active trên các nút ở cột trái
  document.querySelectorAll('.game-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-game') === gameId);
  });

  if (window.state) {
    window.state.currentGameId = gameId;
  }

  if (gameId === 'wheel') {
    if (typeof switchGameMode === 'function') switchGameMode('classic');
    if (typeof switchViewMode === 'function') switchViewMode('wheel');
  } else if (gameId === 'slot') {
    if (typeof switchGameMode === 'function') switchGameMode('classic');
    if (typeof switchViewMode === 'function') switchViewMode('slot');
  } else if (gameId === 'seating') {
    if (typeof switchGameMode === 'function') switchGameMode('seating');
  } else if (gameId === 'quiz') {
    if (typeof switchGameMode === 'function') switchGameMode('quiz');
  } else if (gameId === 'bonus') {
    if (typeof openBonusWheelModal === 'function') openBonusWheelModal();
  } else if (gameId === 'groups') {
    if (typeof openAllGroupsModal === 'function') openAllGroupsModal();
  } else if (gameId === 'golden_bell') {
    if (typeof showToast === 'function') showToast('🔔 Trò chơi Rung Chuông Vàng đang được hoàn thiện, sẽ sớm ra mắt!', 'info');
  }
}

function toggleGameNavSidebar() {
  const sidebar = document.getElementById('gameNavSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

function toggleSettingsDropdown(e) {
  if (e) e.stopPropagation();
  const wrapper = document.querySelector('.header-settings-wrapper');
  if (wrapper) wrapper.classList.toggle('open');
}

function closeSettingsDropdown() {
  const wrapper = document.querySelector('.header-settings-wrapper');
  if (wrapper) wrapper.classList.remove('open');
}

// Đóng dropdown khi nhấp chuột ra ngoài
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header-settings-wrapper')) {
    closeSettingsDropdown();
  }
});

// Các hành động từ Menu Cài Đặt trên Header
function openClassManagementAction() {
  closeSettingsDropdown();
  if (typeof openClassManagerModal === 'function') {
    openClassManagerModal();
  } else if (typeof openCreateClassModal === 'function') {
    openCreateClassModal();
  }
}

function openStudentListAction() {
  closeSettingsDropdown();
  if (window.LandingRouter && window.LandingRouter.currentScreen === 'home') {
    window.LandingRouter.navigateTo('game');
  }
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) {
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('open');
  }
  if (backdrop) backdrop.classList.add('open');
}

function openQuizBankAction() {
  closeSettingsDropdown();
  if (typeof openQuizManagerModal === 'function') openQuizManagerModal();
}

function openAudioSettingsAction() {
  closeSettingsDropdown();
  if (typeof openAudioSettingsModal === 'function') openAudioSettingsModal();
}

// Đồng bộ nút active trên cột trái khi chế độ thay đổi từ nơi khác
function syncGameNavSidebar(mode, viewMode) {
  let targetGame = 'wheel';
  if (mode === 'seating') targetGame = 'seating';
  else if (mode === 'quiz') targetGame = 'quiz';
  else if (mode === 'minigames') targetGame = 'bonus';
  else if (mode === 'classic') {
    targetGame = viewMode === 'slot' ? 'slot' : 'wheel';
  }

  if (window.state) {
    window.state.currentGameId = targetGame;
  }

  document.querySelectorAll('.game-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-game') === targetGame);
  });
}

// ==============================================================================
// HỆ THỐNG CÀI ĐẶT RIÊNG CHO TỪNG TRÒ CHƠI (GAME-AWARE SETTINGS SYSTEM)
// ==============================================================================

function getCurrentGameId() {
  if (window.state && window.state.currentGameId) return window.state.currentGameId;
  const quizSection = document.getElementById('quizArenaSection');
  if (quizSection && quizSection.style.display !== 'none') return 'quiz';
  const seatingSection = document.getElementById('seatingArenaSection');
  if (seatingSection && seatingSection.style.display !== 'none') return 'seating';
  if (window.state && window.state.viewMode === 'wheel') return 'wheel';
  return 'slot';
}

function openGameSettingsModal(targetGameId) {
  const gameId = targetGameId || getCurrentGameId();
  if (window.state) {
    window.state.currentGameId = gameId;
  }

  const modal = document.getElementById('gameSettingsModal');
  if (!modal) return;

  const titleEl = document.getElementById('gameSettingsTitle');
  const subtitleEl = document.getElementById('gameSettingsSubtitle');
  const iconEl = document.getElementById('gameSettingsIcon');
  const sectionTitleEl = document.getElementById('gameSpecificSectionTitle');
  const container = document.getElementById('gameSpecificSettingsContainer');

  if (!container) return;

  // Cấu hình tiêu đề theo game
  switch (gameId) {
    case 'seating':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT SƠ ĐỒ LỚP HỌC';
      if (subtitleEl) subtitleEl.textContent = 'Tùy chỉnh kích thước dãy bàn, phương án xếp chỗ và 4 tổ thi đua';
      if (iconEl) iconEl.textContent = '🪑';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: SƠ ĐỒ LỚP & 4 TỔ THI ĐUA';
      container.innerHTML = renderSeatingSpecificSettings();
      break;

    case 'quiz':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT ĐẤU TRƯỜNG TRẮC NGHIỆM';
      if (subtitleEl) subtitleEl.textContent = 'Quản lý ngân hàng đề thi, thời gian trả lời & quyền trợ giúp';
      if (iconEl) iconEl.textContent = '🏆';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: ĐỀ THI & LUẬT ĐẤU TRƯỜNG';
      container.innerHTML = renderQuizSpecificSettings();
      break;

    case 'wheel':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT VÒNG QUAY MAY MẮN';
      if (subtitleEl) subtitleEl.textContent = 'Tùy chỉnh thời gian quay, tốc độ bánh xe và chống gọi trùng';
      if (iconEl) iconEl.textContent = '🎡';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: BÁNH XE MAY MẮN';
      container.innerHTML = renderWheelSpecificSettings();
      break;

    case 'slot':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT THẺ LƯỚT HỒI HỘP';
      if (subtitleEl) subtitleEl.textContent = 'Chế độ bốc thăm cá nhân, cặp đôi, nhóm 4, nhóm 6 & chống lặp';
      if (iconEl) iconEl.textContent = '🎰';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: THẺ LƯỚT SLOT';
      container.innerHTML = renderSlotSpecificSettings();
      break;

    case 'bonus':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT VÒNG QUAY ĐIỂM THƯỞNG';
      if (subtitleEl) subtitleEl.textContent = 'Chỉnh sửa các ô điểm thưởng (+1, +2, quà tặng) & âm thanh';
      if (iconEl) iconEl.textContent = '🎁';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: DANH SÁCH PHẦN THƯỞNG';
      container.innerHTML = renderBonusSpecificSettings();
      break;

    case 'groups':
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT CHIA NHÓM CẢ LỚP';
      if (subtitleEl) subtitleEl.textContent = 'Quy tắc chia nhóm ngẫu nhiên theo số lượng nhóm hoặc số người';
      if (iconEl) iconEl.textContent = '🧩';
      if (sectionTitleEl) sectionTitleEl.textContent = 'TÍNH NĂNG RIÊNG: QUY TẮC PHÂN CHIA NHÓM';
      container.innerHTML = renderGroupsSpecificSettings();
      break;

    default:
      if (titleEl) titleEl.textContent = 'CÀI ĐẶT TRÒ CHƠI';
      if (subtitleEl) subtitleEl.textContent = 'Tùy chỉnh các tính năng phù hợp';
      if (iconEl) iconEl.textContent = '⚙️';
      if (sectionTitleEl) sectionTitleEl.textContent = 'CÀI ĐẶT TRÒ CHƠI';
      container.innerHTML = renderWheelSpecificSettings();
      break;
  }

  modal.classList.add('open');
}

function closeGameSettingsModal() {
  const modal = document.getElementById('gameSettingsModal');
  if (modal) modal.classList.remove('open');
}

// 1. Giao diện cài đặt riêng cho Sơ Đồ Lớp
function renderSeatingSpecificSettings() {
  return `
    <!-- Mục 1: Kích thước Bàn Ghế & Sơ đồ -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">📐</div>
        <div>
          <span class="game-setting-item-title">Kích Thước Bàn Ghế & Sơ Đồ</span>
          <span class="game-setting-item-desc">Chọn số dãy bàn (2, 3, 4, 5 dãy), số hàng ghế, kiểu bàn đơn/đôi, phương án xếp chỗ & cỡ chữ tên học sinh.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger btn-teal" onclick="closeGameSettingsModal(); if (window.SeatingChartModule) SeatingChartModule.openSettingsModal();">
        ⚙️ Mở Bảng Cấu Hình Sơ Đồ ➔
      </button>
    </div>

    <!-- Mục 2: 4 Tổ & Linh vật -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🦅</div>
        <div>
          <span class="game-setting-item-title">Đổi Tên 4 Tổ & Linh Vật Thi Đua</span>
          <span class="game-setting-item-desc">Đặt tên riêng cho 4 tổ (Đại Bàng, Sư Tử, Cá Mập, Rồng Vàng), chọn biểu tượng linh vật Emoji và màu sắc tổ.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger btn-teal" onclick="closeGameSettingsModal(); if (window.SeatingChartModule) SeatingChartModule.openGroupSettings(1);">
        🦁 Đổi Tên 4 Tổ & Linh Vật ➔
      </button>
    </div>

    <!-- Mục 3: Làm mới vòng bốc thăm -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🔄</div>
        <div>
          <span class="game-setting-item-title">Làm Mới Vòng Bốc Thăm (Reset Lượt Gọi)</span>
          <span class="game-setting-item-desc">Đưa toàn bộ học sinh đã gọi trên sơ đồ lớp trở lại danh sách chờ gọi để bắt đầu vòng bốc thăm mới từ đầu.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="if (window.SeatingChartModule) SeatingChartModule.resetCalledRound(); showToast('Đã làm mới vòng bốc thăm sơ đồ lớp!', 'success');">
        🔄 Làm Mới Lượt Gọi
      </button>
    </div>

    <!-- Mục 4: Bàn Giáo Viên & Khay Chưa Xếp Chỗ -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🧑‍🏫</div>
        <div>
          <span class="game-setting-item-title">Vị Trí Bàn Giáo Viên & Khay Chưa Xếp</span>
          <span class="game-setting-item-desc">Đổi vị trí bàn giáo viên sang bên Trái hoặc bên Phải bục giảng; mở khay học sinh chưa xếp vào bàn.</span>
        </div>
      </div>
      <div class="game-setting-btn-row">
        <button type="button" class="btn-pill-choice" onclick="if (window.SeatingChartModule) SeatingChartModule.toggleTeacherDeskPosition();">
          📍 Đổi Bàn GV (Trái/Phải)
        </button>
        <button type="button" class="btn-pill-choice" onclick="closeGameSettingsModal(); if (window.SeatingChartModule) SeatingChartModule.toggleUnassignedColumn();">
          🎒 Mở Khay Chưa Xếp
        </button>
      </div>
    </div>
  `;
}

// 2. Giao diện cài đặt riêng cho Đấu Trường Trắc Nghiệm
function renderQuizSpecificSettings() {
  const curSeconds = (window.getTimerState ? window.getTimerState().totalSeconds : 30);
  return `
    <!-- Mục 1: Ngân hàng câu hỏi -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">📚</div>
        <div>
          <span class="game-setting-item-title">Ngân Hàng Đề Thi & Quản Lý Câu Hỏi</span>
          <span class="game-setting-item-desc">Nạp đề thi trắc nghiệm từ file Excel (.xlsx), dán đề văn bản Word/Text, soạn câu hỏi mới, lọc mức độ khó.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="closeGameSettingsModal(); if (typeof openQuizManagerModal === 'function') openQuizManagerModal();">
        📚 Mở Ngân Hàng Đề Thi ➔
      </button>
    </div>

    <!-- Mục 2: Thời gian đếm ngược suy nghĩ -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">⏱️</div>
        <div>
          <span class="game-setting-item-title">Thời Gian Đếm Ngược Cho Mỗi Câu Hỏi</span>
          <span class="game-setting-item-desc">Chọn thời gian suy nghĩ mặc định cho học sinh khi đồng hồ bấm giờ đếm ngược chạy.</span>
        </div>
      </div>
      <div class="game-setting-btn-row">
        <button type="button" class="btn-pill-choice ${curSeconds === 15 ? 'active' : ''}" onclick="setQuizCountdownTime(15, this)">
          15 Giây
        </button>
        <button type="button" class="btn-pill-choice ${curSeconds === 30 ? 'active' : ''}" onclick="setQuizCountdownTime(30, this)">
          30 Giây (Chuẩn)
        </button>
        <button type="button" class="btn-pill-choice ${curSeconds === 60 ? 'active' : ''}" onclick="setQuizCountdownTime(60, this)">
          60 Giây
        </button>
      </div>
    </div>

    <!-- Mục 3: Hiển thị câu hỏi & Vòng thưởng -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🙈</div>
        <div>
          <span class="game-setting-item-title">Chế Độ Hiển Thị Đề Bài & Thưởng Điểm</span>
          <span class="game-setting-item-desc">Tạm thời ẩn câu hỏi trước khi học sinh chuẩn bị sẵn sàng; mở vòng quay điểm thưởng để khích lệ.</span>
        </div>
      </div>
      <div class="game-setting-btn-row">
        <button type="button" class="btn-pill-choice" onclick="if (typeof toggleQuestionVisibility === 'function') toggleQuestionVisibility();">
          🙈 Tạm Ẩn / Hiện Câu Hỏi
        </button>
        <button type="button" class="btn-pill-choice" onclick="closeGameSettingsModal(); if (typeof openBonusWheelModal === 'function') openBonusWheelModal();">
          🎁 Thưởng Điểm
        </button>
      </div>
    </div>
  `;
}

// 3. Giao diện cài đặt riêng cho Vòng Quay May Mắn
function renderWheelSpecificSettings() {
  const curDuration = (window.state && window.state.wheelDuration) ? window.state.wheelDuration : 4500;
  const isNoRepeat = window.state ? !!window.state.noRepeat : true;

  return `
    <!-- Mục 1: Thời gian quay bánh xe -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🎡</div>
        <div>
          <span class="game-setting-item-title">Thời Gian Quay Mỗi Lượt (Tốc Độ Bánh Xe)</span>
          <span class="game-setting-item-desc">Tùy chỉnh thời gian bánh xe quay trước khi dừng lại ở học sinh may mắn.</span>
        </div>
      </div>
      <div class="game-setting-btn-row">
        <button type="button" class="btn-pill-choice ${curDuration === 3000 ? 'active' : ''}" onclick="setWheelDuration(3000, this)">
          ⚡ 3 Giây (Nhanh)
        </button>
        <button type="button" class="btn-pill-choice ${curDuration === 4500 ? 'active' : ''}" onclick="setWheelDuration(4500, this)">
          🎯 4.5s (Chuẩn)
        </button>
        <button type="button" class="btn-pill-choice ${curDuration === 7000 ? 'active' : ''}" onclick="setWheelDuration(7000, this)">
          🔥 7 Giây (Hồi hộp)
        </button>
      </div>
    </div>

    <!-- Mục 2: Chống gọi trùng lặp -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🛡️</div>
        <div>
          <span class="game-setting-item-title">Chế Độ Chống Trùng Lặp (Không Gọi Lại)</span>
          <span class="game-setting-item-desc">Học sinh đã quay trúng sẽ được đánh dấu đã gọi và không bị gọi lại trong các lượt tiếp theo.</span>
        </div>
      </div>
      <label class="switch" style="flex-shrink: 0;">
        <input type="checkbox" id="wheelSettingNoRepeatToggle" ${isNoRepeat ? 'checked' : ''} onchange="setGameSettingNoRepeat(this.checked)">
        <span class="slider"></span>
      </label>
    </div>

    <!-- Mục 3: Làm mới danh sách đã quay -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🔄</div>
        <div>
          <span class="game-setting-item-title">Làm Mới Danh Sách Gọi Lại</span>
          <span class="game-setting-item-desc">Đưa toàn bộ học sinh đã gọi trở lại vòng quay để tất cả các bạn có cơ hội quay lại từ đầu.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="if (typeof resetCalledList === 'function') resetCalledList(true);">
        🔄 Đặt Lại Danh Sách
      </button>
    </div>
  `;
}

// 4. Giao diện cài đặt riêng cho Thẻ Lướt Hồi Hộp
function renderSlotSpecificSettings() {
  const currentMode = (window.state && window.state.currentMode) ? window.state.currentMode : 'single';
  const isNoRepeat = window.state ? !!window.state.noRepeat : true;

  return `
    <!-- Mục 1: Chế độ bốc thăm Slot -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🎰</div>
        <div>
          <span class="game-setting-item-title">Số Lượng Học Sinh Bốc Thăm Mỗi Lượt</span>
          <span class="game-setting-item-desc">Chọn gọi ngẫu nhiên cá nhân (1), ghép đôi đối kháng (2) hoặc chọn nhóm 4, nhóm 6.</span>
        </div>
      </div>
      <div class="game-setting-btn-row">
        <button type="button" class="btn-pill-choice ${currentMode === 'single' ? 'active' : ''}" onclick="setSlotModeFromSettings('single', this)">
          Cá nhân (1)
        </button>
        <button type="button" class="btn-pill-choice ${currentMode === 'pair' ? 'active' : ''}" onclick="setSlotModeFromSettings('pair', this)">
          Cặp đôi (2)
        </button>
        <button type="button" class="btn-pill-choice ${currentMode === 'group4' ? 'active' : ''}" onclick="setSlotModeFromSettings('group4', this)">
          Nhóm 4
        </button>
        <button type="button" class="btn-pill-choice ${currentMode === 'group6' ? 'active' : ''}" onclick="setSlotModeFromSettings('group6', this)">
          Nhóm 6
        </button>
      </div>
    </div>

    <!-- Mục 2: Chống gọi trùng lặp -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🛡️</div>
        <div>
          <span class="game-setting-item-title">Chế Độ Chống Trùng Lặp (Không Gọi Lại)</span>
          <span class="game-setting-item-desc">Không gọi lại học sinh đã được bốc trúng trong các lượt trước.</span>
        </div>
      </div>
      <label class="switch" style="flex-shrink: 0;">
        <input type="checkbox" id="slotSettingNoRepeatToggle" ${isNoRepeat ? 'checked' : ''} onchange="setGameSettingNoRepeat(this.checked)">
        <span class="slider"></span>
      </label>
    </div>

    <!-- Mục 3: Chia nhóm cả lớp -->
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🧩</div>
        <div>
          <span class="game-setting-item-title">Chia Nhanh Toàn Bộ Lớp Thành Nhóm</span>
          <span class="game-setting-item-desc">Tự động xáo trộn và phân chia tất cả học sinh trong lớp thành các nhóm 2, 4, 6 người.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="closeGameSettingsModal(); if (typeof openAllGroupsModal === 'function') openAllGroupsModal();">
        🧩 Chia Cả Lớp ➔
      </button>
    </div>
  `;
}

// 5. Giao diện cài đặt riêng cho Vòng Quay Điểm Thưởng
function renderBonusSpecificSettings() {
  return `
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">✏️</div>
        <div>
          <span class="game-setting-item-title">Chỉnh Sửa Các Ô Phần Thưởng & Điểm Số</span>
          <span class="game-setting-item-desc">Thêm/bớt, đổi tên, biểu tượng Emoji và màu sắc cho từng nan quạt của Vòng Quay Điểm Thưởng (+1, +2, +5 điểm, tràng pháo tay...).</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="closeGameSettingsModal(); if (typeof openRewardsEditorModal === 'function') openRewardsEditorModal();">
        ✏️ Tùy Chỉnh Ô Quà ➔
      </button>
    </div>

    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🔄</div>
        <div>
          <span class="game-setting-item-title">Khôi Phục Danh Sách Phần Thưởng Mặc Định</span>
          <span class="game-setting-item-desc">Khôi phục lại bộ phần thưởng chuẩn gồm 8 ô mẫu ban đầu.</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="if (typeof resetDefaultRewards === 'function') resetDefaultRewards(); showToast('Đã khôi phục bộ phần thưởng gốc!', 'success');">
        🔄 Khôi Phục Mặc Định
      </button>
    </div>
  `;
}

// 6. Giao diện cài đặt riêng cho Chia Nhóm Cả Lớp
function renderGroupsSpecificSettings() {
  return `
    <div class="game-setting-item-card">
      <div class="game-setting-item-left">
        <div class="game-setting-item-icon">🧩</div>
        <div>
          <span class="game-setting-item-title">Cấu Hình Số Lượng Thành Viên Mỗi Nhóm</span>
          <span class="game-setting-item-desc">Mở bảng phân chia ngẫu nhiên và chọn số thành viên mỗi nhóm (2, 3, 4, 5, 6 bạn).</span>
        </div>
      </div>
      <button type="button" class="btn-action-trigger" onclick="closeGameSettingsModal(); if (typeof openAllGroupsModal === 'function') openAllGroupsModal();">
        🧩 Mở Bảng Chia Nhóm ➔
      </button>
    </div>
  `;
}

// Các hàm bổ trợ xử lý cài đặt tức thì:
function setWheelDuration(durationMs, btnEl) {
  if (window.state) {
    window.state.wheelDuration = durationMs;
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  }
  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.btn-pill-choice').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  const sec = durationMs / 1000;
  showToast(`Đã đặt thời gian quay bánh xe: ${sec} giây!`, 'success');
}

function setQuizCountdownTime(seconds, btnEl) {
  if (typeof setTimerDuration === 'function') {
    setTimerDuration(seconds);
  }
  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.btn-pill-choice').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  showToast(`Đã đặt thời gian đếm ngược: ${seconds} giây!`, 'success');
}

function setGameSettingNoRepeat(enabled) {
  if (window.state) {
    window.state.noRepeat = !!enabled;
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  }
  const sidebarToggle = document.getElementById('noRepeatToggle');
  if (sidebarToggle) sidebarToggle.checked = !!enabled;
  if (typeof updateUI === 'function') updateUI();
  showToast(`Chế độ không gọi lại: ${enabled ? 'BẬT' : 'TẮT'}`, 'info');
}

function setSlotModeFromSettings(mode, btnEl) {
  if (window.state) {
    window.state.currentMode = mode;
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  }
  document.querySelectorAll('.mode-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-mode') === mode);
  });
  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.btn-pill-choice').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  showToast(`Đã chuyển sang chế độ: ${mode === 'single' ? 'Cá nhân (1)' : mode === 'pair' ? 'Cặp đôi (2)' : mode === 'group4' ? 'Nhóm 4' : 'Nhóm 6'}`, 'success');
}

// Đóng modal cài đặt trò chơi khi click ra ngoài nền hoặc nhấn phím Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeGameSettingsModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const gameSettingsModalEl = document.getElementById('gameSettingsModal');
  if (gameSettingsModalEl) {
    gameSettingsModalEl.addEventListener('click', (e) => {
      if (e.target === gameSettingsModalEl) {
        closeGameSettingsModal();
      }
    });
  }
});

// Gắn toàn cục các hàm cần truy xuất
window.showToast = showToast;
window.updateUI = updateUI;
window.renderDefaultStage = renderDefaultStage;
window.switchViewMode = switchViewMode;
window.spin = spin;
window.spinSlot = spinSlot;
window.setTimerDuration = setTimerDuration;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.getTimerState = getTimerState;
window.init = init;
window.selectGame = selectGame;
window.toggleGameNavSidebar = toggleGameNavSidebar;
window.toggleSettingsDropdown = toggleSettingsDropdown;
window.closeSettingsDropdown = closeSettingsDropdown;
window.openClassManagementAction = openClassManagementAction;
window.openStudentListAction = openStudentListAction;
window.openQuizBankAction = openQuizBankAction;
window.openAudioSettingsAction = openAudioSettingsAction;
window.syncGameNavSidebar = syncGameNavSidebar;
window.getCurrentGameId = getCurrentGameId;
window.openGameSettingsModal = openGameSettingsModal;
window.closeGameSettingsModal = closeGameSettingsModal;
window.setWheelDuration = setWheelDuration;
window.setQuizCountdownTime = setQuizCountdownTime;
window.setGameSettingNoRepeat = setGameSettingNoRepeat;
window.setSlotModeFromSettings = setSlotModeFromSettings;
