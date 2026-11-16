/**
 * ==============================================================================
 * MODULE ĐIỀU PHỐI CÔNG CỤ TẠO MA TRẬN TRANH TỰ ĐỘNG & BỘ SƯU TẬP (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleGenerator.js
 * Trách nhiệm: Điều phối giao diện xem trước, chỉnh sửa màu bút dạ, bộ sưu tập
 * và liên kết các mô-đun Rasterizer, MeshEngine, PresetStore, VectorExport, ModalDom.
 * ==============================================================================
 */
(function () {
  'use strict';

  const Rasterizer = window.GiaiMaPuzzleRasterizer;
  const MeshEngine = window.GiaiMaPuzzleMeshEngine;
  const PresetStore = window.GiaiMaPuzzlePresetStore;
  const VectorExport = window.GiaiMaPuzzleVectorExport;
  const ModalDom = window.GiaiMaPuzzleGeneratorModalDom;

  const DEFAULT_PRESETS = Rasterizer.DEFAULT_PRESETS;
  const THEME_PALETTES = Rasterizer.THEME_PALETTES;
  const HIGH_CONTRAST_PALETTES = Rasterizer.HIGH_CONTRAST_PALETTES;
  const PAPER_SPECS = Rasterizer.PAPER_SPECS;

  const {
    getSavedPresets,
    exportCustomPresetsSnapshot,
    applyServerCustomPresets,
    saveCustomPreset,
    deleteCustomPreset,
    getSavedPrintHeader,
    savePrintHeader,
    getSavedPrintRightNote,
    savePrintRightNote,
    applyLockedRulesToPuzzle,
    measureAverageTargetPieceSvgSize
  } = PresetStore;

  const { generateMatrixFromText } = MeshEngine;
  const { exportSvgVector, exportPdfVector } = VectorExport;

  let currentGeneratedPuzzle = null;
  let activePresetIdInModal = 'preset_trian_2011';
  let isPreviewColored = true;
  let isPreviewSeamless = false;
  let isPreviewFullscreen = false;
  let isFooterLegendEnabled = true;
  let currentPrintHeader = getSavedPrintHeader();
  let currentPrintRightNote = getSavedPrintRightNote();
  let selectedRuleCodeInPreview = null;
  let presetSearchKeyword = '';
  let presetFilterTag = 'all';

  PresetStore.setOnPresetsChanged((skipPreview) => {
    renderPresetListUI(skipPreview);
  });

  function openGeneratorModal() {
    let modal = document.getElementById('gmmGeneratorModal');
    if (!modal && ModalDom && typeof ModalDom.createGeneratorModalDOM === 'function') {
      ModalDom.createGeneratorModalDOM(closeGeneratorModal);
      modal = document.getElementById('gmmGeneratorModal');
    }
    if (modal) {
      const parentModal = document.getElementById('giaiMaBiMatModal');
      if (parentModal && modal.parentElement !== parentModal) {
        parentModal.appendChild(modal);
      }
      isPreviewFullscreen = false;
      modal.classList.remove('preview-only-fullscreen');
      const headerInput = document.getElementById('gmmGenPrintHeaderInput');
      if (headerInput) {
        headerInput.value = currentPrintHeader;
      }
      const rightNoteInput = document.getElementById('gmmGenPrintRightNoteInput');
      if (rightNoteInput) {
        rightNoteInput.value = currentPrintRightNote;
      }
      modal.style.display = 'flex';
      modal.classList.add('active', 'open');
      renderPresetListUI();
      if (window.GmmServerPuzzlesSync && typeof window.GmmServerPuzzlesSync.pullAndMerge === 'function') {
        window.GmmServerPuzzlesSync.updateStatusBadge();
        window.GmmServerPuzzlesSync.pullAndMerge({ silent: true });
      }
    }
  }

  function closeGeneratorModal() {
    const modal = document.getElementById('gmmGeneratorModal');
    if (modal) {
      if (isPreviewFullscreen) {
        togglePreviewFullscreen(false);
        return;
      }
      modal.classList.remove('active', 'open', 'preview-only-fullscreen');
      modal.style.display = 'none';
    }
  }

  function getCurrentPuzzle() {
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    return currentGeneratedPuzzle;
  }

  function handlePrintHeaderChange(val, showToastFeedback) {
    currentPrintHeader = String(val == null ? '' : val);
    const input = document.getElementById('gmmGenPrintHeaderInput');
    if (input && input.value !== currentPrintHeader) {
      input.value = currentPrintHeader;
    }
    const exportSchoolEl = document.getElementById('gmmExportSchoolName');
    if (exportSchoolEl && currentPrintHeader.trim()) {
      exportSchoolEl.value = currentPrintHeader.trim();
    }
    savePrintHeader(currentPrintHeader);
    if (currentGeneratedPuzzle) {
      currentGeneratedPuzzle.printHeader = currentPrintHeader;
    }
    renderPreview();
    if (showToastFeedback && typeof window.showToast === 'function') {
      window.showToast('🏫 Đã khôi phục tiêu đề Trường/Lớp mặc định trên đầu bạt A1!', 'info');
    }
  }

  function handlePrintRightNoteChange(val, showToastFeedback) {
    currentPrintRightNote = String(val == null ? '' : val);
    const input = document.getElementById('gmmGenPrintRightNoteInput');
    if (input && input.value !== currentPrintRightNote) {
      input.value = currentPrintRightNote;
    }
    savePrintRightNote(currentPrintRightNote);
    if (currentGeneratedPuzzle) {
      currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    }
    renderPreview();
    if (showToastFeedback && typeof window.showToast === 'function') {
      window.showToast(`📌 Đã cập nhật góc phải dải tiêu đề bạt A1: "${currentPrintRightNote}"!`, 'info');
    }
  }

  function setQuickRightNoteTeam(teamIndex) {
    const snap = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getArenaLiveSnapshot === 'function')
      ? window.GiaiMaBiMat.getArenaLiveSnapshot()
      : null;
    const t1Name = (snap && snap.teamA && snap.teamA.name) ? snap.teamA.name : 'ĐOÀN KẾT';
    const t2Name = (snap && snap.teamB && snap.teamB.name) ? snap.teamB.name : 'LA BÀN TUỔI TRẺ';
    const label = teamIndex === 2
      ? `ĐỘI 2: ${t2Name.toUpperCase()}`
      : `ĐỘI 1: ${t1Name.toUpperCase()}`;
    handlePrintRightNoteChange(label, false);
    if (typeof window.showToast === 'function') {
      window.showToast(`📌 Đã điền tên "${label}" lên góc phải đầu bạt A1 — Sẵn sàng in tờ của Đội ${teamIndex}!`, 'success');
    }
  }

  function insertSymbolToInput(symbolStr) {
    const input = document.getElementById('gmmGenInputText');
    if (!input) return;
    const start = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
    const end = typeof input.selectionEnd === 'number' ? input.selectionEnd : input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = `${before}${symbolStr}${after}`.replace(/\s+/g, ' ');
    input.focus();
    const newCursor = Math.min(input.value.length, start + symbolStr.length);
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(newCursor, newCursor);
    }
    handleGenerateClick();
  }

  function handleGenerateClick() {
    const textInput = document.getElementById('gmmGenInputText');
    const qCountSelect = document.getElementById('gmmGenQCount');
    const meshStyleSelect = document.getElementById('gmmGenMeshStyle');
    const motifSelect = document.getElementById('gmmGenDecorMotif');
    const diffSelect = document.getElementById('gmmGenDifficulty');
    const strokeSelect = document.getElementById('gmmGenStrokeWidth');
    const text = textInput ? textInput.value : 'TRI ÂN THẦY CÔ 20/11';
    const count = qCountSelect ? parseInt(qCountSelect.value, 10) : 10;
    const meshStyle = meshStyleSelect ? meshStyleSelect.value : 'polygon';
    const decorMotif = motifSelect ? motifSelect.value : 'auto';
    const difficulty = diffSelect ? diffSelect.value : 'normal';
    const strokeWidth = strokeSelect ? (parseFloat(strokeSelect.value) || 1.8) : 1.8;

    activePresetIdInModal = null;
    selectedRuleCodeInPreview = null;
    currentGeneratedPuzzle = generateMatrixFromText(text, count, { meshStyle, decorMotif, difficulty });
    currentGeneratedPuzzle.strokeWidth = strokeWidth;
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    applyLockedRulesToPuzzle(currentGeneratedPuzzle);
    renderPreview();
    if (typeof window.showToast === 'function') {
      const styleName = meshStyle === 'hexagon' ? 'Lưới tổ ong' : (meshStyle === 'pixel' ? 'Pixel Art' : 'Đa giác nghệ thuật');
      const diffName = difficulty === 'easy' ? 'Dễ (~180 mảnh lớn)' : (difficulty === 'hard' ? 'Khó (~350 mảnh nhỏ)' : 'Chuẩn (~240 mảnh)');
      const lockedCount = Object.values(currentGeneratedPuzzle.colorRules || {}).filter(r => r && r.locked).length;
      const lockSuffix = lockedCount > 0 ? ` (Giữ nguyên ${lockedCount} màu đã khóa 🔒)` : '';
      window.showToast(`✨ Đã sinh ma trận ${styleName} • Độ khó ${diffName} cho "${currentGeneratedPuzzle.title}"${lockSuffix}!`, 'success');
    }
  }

  function handleStrokeWidthChange() {
    const strokeSelect = document.getElementById('gmmGenStrokeWidth');
    const strokeWidth = strokeSelect ? (parseFloat(strokeSelect.value) || 1.8) : 1.8;
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.strokeWidth = strokeWidth;
    renderPreview();
    if (typeof window.showToast === 'function') {
      const label = strokeWidth <= 1.3 ? 'Mảnh (1.2px)' : (strokeWidth >= 2.2 ? 'Đậm chống lem (2.5px)' : 'Chuẩn (1.8px)');
      window.showToast(`✒️ Đã áp dụng độ dày nét viền in ấn: ${label}!`, 'info');
    }
  }

  function toggleFooterLegend(forceState) {
    isFooterLegendEnabled = typeof forceState === 'boolean' ? forceState : !isFooterLegendEnabled;
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    syncPreviewModeButtons();
    renderPreview();
    if (typeof window.showToast === 'function') {
      window.showToast(
        isFooterLegendEnabled
          ? '🖨️ Đã BẬT in kèm Bảng Chú Giải 10 Màu Bút Dạ ngay dưới chân tranh A4/A1!'
          : '📄 Đã TẮT bảng chú giải màu dưới chân tranh (Chỉ in thuần khung ma trận)!',
        'info'
      );
    }
  }

  function togglePreviewFullscreen(forceState) {
    const modal = document.getElementById('gmmGeneratorModal');
    if (!modal) return;
    isPreviewFullscreen = typeof forceState === 'boolean' ? forceState : !isPreviewFullscreen;
    modal.classList.toggle('preview-only-fullscreen', isPreviewFullscreen);
    syncPreviewModeButtons();
    if (typeof window.showToast === 'function') {
      window.showToast(
        isPreviewFullscreen
          ? '🔍 Đã phóng to riêng bức tranh xem trước tràn 100% màn hình (Bấm lại nút hoặc ESC để thu nhỏ)!'
          : '↙ Đã thu nhỏ về giao diện Thiết kế 2 cột!',
        'info'
      );
    }
  }

  function buildDefaultTriAnBundle() {
    let bundle = null;
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function') {
      const active = window.GiaiMaPuzzle.getActivePuzzle();
      if (active && active.isDefaultTriAn) {
        bundle = {
          id: 'preset_trian_2011',
          title: active.title,
          questionCount: 10,
          meshStyle: 'polygon',
          difficulty: 'normal',
          strokeWidth: active.strokeWidth || 1.8,
          showFooterLegend: isFooterLegendEnabled,
          printHeader: currentPrintHeader,
          printRightNote: currentPrintRightNote,
          cells: active.cells,
          colorRules: active.colorRules,
          targetCellIds: active.targetCellIds
        };
      }
    }
    if (!bundle && window.GiaiMaPuzzle && window.GiaiMaPuzzle.PUZZLE_CELLS) {
      const sep = (window.GiaiMaPuzzle.getDateSeparatorStyle && window.GiaiMaPuzzle.getDateSeparatorStyle() === 'dash') ? 'dash' : 'slash';
      const cells = sep === 'dash' && window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        ? window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        : window.GiaiMaPuzzle.PUZZLE_CELLS;
      bundle = {
        id: 'preset_trian_2011',
        title: sep === 'dash' ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11',
        questionCount: 10,
        meshStyle: 'polygon',
        difficulty: 'normal',
        strokeWidth: 1.8,
        showFooterLegend: isFooterLegendEnabled,
        printHeader: currentPrintHeader,
        printRightNote: currentPrintRightNote,
        cells: cells,
        colorRules: window.GiaiMaPuzzle.COLOR_RULES,
        targetCellIds: cells.filter(c => c.isTarget).map(c => c.id)
      };
    }
    if (!bundle) {
      bundle = generateMatrixFromText('TRI ÂN THẦY CÔ 20/11', 10);
    }
    applyLockedRulesToPuzzle(bundle);
    return bundle;
  }

  function syncPreviewModeButtons() {
    const btnUncolored = document.getElementById('gmmPreviewModeUncolored');
    const btnColored = document.getElementById('gmmPreviewModeColored');
    const btnSeamless = document.getElementById('gmmPreviewSeamlessBtn');
    const btnFullZoom = document.getElementById('gmmPreviewFullZoomBtn');
    const btnFooterMain = document.getElementById('gmmBtnFooterLegendMain');
    const btnFooterPreview = document.getElementById('gmmPreviewFooterLegendBtn');
    if (btnUncolored) {
      btnUncolored.classList.toggle('primary', !isPreviewColored);
      btnUncolored.classList.toggle('secondary', isPreviewColored);
    }
    if (btnColored) {
      btnColored.classList.toggle('primary', isPreviewColored);
      btnColored.classList.toggle('secondary', !isPreviewColored);
    }
    if (btnSeamless) {
      btnSeamless.textContent = isPreviewSeamless ? '✨ Chữ Liền Khối: Bật' : '✨ Chữ Liền Khối: Tắt';
      btnSeamless.style.background = isPreviewSeamless ? 'rgba(234, 179, 8, 0.28)' : '';
      btnSeamless.style.borderColor = isPreviewSeamless ? '#facc15' : 'rgba(250, 204, 21, 0.45)';
      btnSeamless.style.color = isPreviewSeamless ? '#fef08a' : '#fde047';
    }
    if (btnFooterMain) {
      btnFooterMain.textContent = isFooterLegendEnabled
        ? '🖨️ In Kèm Bảng Chú Giải 10 Màu Bút Dạ Dưới Chân Tranh A1: BẬT ✔'
        : '🖨️ In Kèm Bảng Chú Giải 10 Màu Bút Dạ Dưới Chân Tranh A1: TẮT';
      btnFooterMain.style.background = isFooterLegendEnabled ? 'rgba(16, 185, 129, 0.22)' : 'rgba(30, 41, 59, 0.7)';
      btnFooterMain.style.borderColor = isFooterLegendEnabled ? '#34d399' : 'rgba(148, 163, 184, 0.35)';
      btnFooterMain.style.color = isFooterLegendEnabled ? '#a7f3d0' : '#cbd5e1';
    }
    if (btnFooterPreview) {
      btnFooterPreview.textContent = isFooterLegendEnabled
        ? '🖨️ Chú Giải 10 Màu Dưới Chân: Bật'
        : '🖨️ Chú Giải 10 Màu Dưới Chân: Tắt';
      btnFooterPreview.style.background = isFooterLegendEnabled ? 'rgba(16, 185, 129, 0.22)' : '';
      btnFooterPreview.style.borderColor = isFooterLegendEnabled ? '#34d399' : 'rgba(148, 163, 184, 0.35)';
      btnFooterPreview.style.color = isFooterLegendEnabled ? '#a7f3d0' : '#cbd5e1';
    }
    if (btnFullZoom) {
      btnFullZoom.textContent = isPreviewFullscreen ? '↙ Thu Nhỏ Về Công Cụ (ESC)' : '🔍 Phóng To Tranh 100%';
      btnFullZoom.style.background = isPreviewFullscreen ? 'rgba(2, 132, 199, 0.35)' : '';
      btnFullZoom.style.borderColor = isPreviewFullscreen ? '#38bdf8' : 'rgba(56, 189, 248, 0.55)';
      btnFullZoom.style.color = isPreviewFullscreen ? '#ffffff' : '#7dd3fc';
    }
  }

  function setPreviewMode(isColored) {
    isPreviewColored = Boolean(isColored);
    if (!isPreviewColored) {
      isPreviewSeamless = false;
    }
    syncPreviewModeButtons();
    renderPreview();
  }

  function togglePreviewSeamless() {
    isPreviewSeamless = !isPreviewSeamless;
    if (isPreviewSeamless && !isPreviewColored) {
      isPreviewColored = true;
    }
    syncPreviewModeButtons();
    renderPreview();
    if (typeof window.showToast === 'function') {
      window.showToast(
        isPreviewSeamless
          ? '✨ Đã BẬT chế độ Chữ Liền Khối (ẩn đường gân mảnh ghép bên trong chữ màu)!'
          : '🔲 Đã TẮT chế độ Chữ Liền Khối (hiển thị đầy đủ ranh giới từng mảnh ghép)!',
        'info'
      );
    }
  }

  function updatePaperSpecBar() {
    const bar = document.getElementById('gmmGenPaperSpecBar');
    if (!bar) return;
    const paperSelect = document.getElementById('gmmGenPaperSize');
    const paperCode = (paperSelect && PAPER_SPECS[paperSelect.value]) ? paperSelect.value : 'A1';
    const spec = PAPER_SPECS[paperCode];
    const cells = (currentGeneratedPuzzle && Array.isArray(currentGeneratedPuzzle.cells)) ? currentGeneratedPuzzle.cells : [];
    const totalCount = cells.length;
    const targetCount = cells.filter(c => c && c.isTarget).length;
    const { avgW, avgH } = measureAverageTargetPieceSvgSize(cells);
    const pieceWMm = Math.max(4, Math.round((avgW / 800) * spec.wMm));
    const pieceHMm = Math.max(4, Math.round((avgH / 520) * spec.hMm));

    bar.innerHTML = `
      <div>
        📏 <strong>Trên ${spec.label} (${spec.wMm}×${spec.hMm}mm):</strong> mỗi mảnh chữ rộng trung bình <strong style="color: #6ee7b7;">~${pieceWMm}mm × ${pieceHMm}mm</strong> — <span style="color: #bae6fd;">${spec.advice}</span>.
      </div>
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.4); color: #7dd3fc; font-weight: 800; font-size: 0.73rem;">
        🧩 Tổng: ${totalCount} mảnh (${targetCount} mảnh chữ)
      </div>
    `;
  }

  function handlePaperSizeChange() {
    updatePaperSpecBar();
    const paperSelect = document.getElementById('gmmGenPaperSize');
    const paperCode = (paperSelect && PAPER_SPECS[paperSelect.value]) ? paperSelect.value : 'A1';
    const spec = PAPER_SPECS[paperCode];
    if (typeof window.showToast === 'function') {
      window.showToast(`📐 Đã chuyển thước đo xem trước sang ${spec.label} (${spec.wMm}×${spec.hMm}mm)!`, 'info');
    }
  }

  const colorEditor = window.GiaiMaPuzzleColorEditor.create({
    THEME_PALETTES,
    HIGH_CONTRAST_PALETTES,
    PresetStore,
    getCurrentPuzzleOrBuild: () => {
      if (!currentGeneratedPuzzle) currentGeneratedPuzzle = buildDefaultTriAnBundle();
      return currentGeneratedPuzzle;
    },
    getActivePresetId: () => activePresetIdInModal,
    setCurrentPuzzle: (nextPuzzle) => {
      currentGeneratedPuzzle = nextPuzzle;
    },
    buildDefaultTriAnBundle,
    renderPreview,
    getSelectedRuleCode: () => selectedRuleCodeInPreview,
    setSelectedRuleCode: (code) => {
      selectedRuleCodeInPreview = code;
    }
  });

  const {
    toggleMarkerRuleLock,
    handleUnlockAllMarkerColors,
    handleQuickRuleChange,
    handleApplyHighContrastPalette,
    handleResetMarkerNames,
    handlePreviewCanvasClick,
    renderActiveRuleQuickBar,
    applyInstantColorToActiveRule,
    closeActiveRuleQuickBar
  } = colorEditor;

  function renderPreview() {
    const wrap = document.getElementById('gmmGenPreviewWrap');
    if (!wrap) return;

    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;

    const headerInput = document.getElementById('gmmGenPrintHeaderInput');
    if (headerInput && document.activeElement !== headerInput && headerInput.value !== currentPrintHeader) {
      headerInput.value = currentPrintHeader;
    }
    const rightNoteInput = document.getElementById('gmmGenPrintRightNoteInput');
    if (rightNoteInput && document.activeElement !== rightNoteInput && rightNoteInput.value !== currentPrintRightNote) {
      rightNoteInput.value = currentPrintRightNote;
    }

    syncPreviewModeButtons();

    const activeStrokeW = parseFloat(currentGeneratedPuzzle.strokeWidth) || 1.8;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      if (isPreviewColored) {
        wrap.innerHTML = window.GiaiMaPuzzle.renderSvgMatrix('gen_preview', {}, {
          isPrint: true,
          isSolvedAnswerKey: true,
          seamlessStrokes: isPreviewSeamless,
          strokeWidth: activeStrokeW,
          showFooterLegend: false,
          showTopHeaderSvg: false,
          interactivePreview: true,
          puzzle: currentGeneratedPuzzle
        });
      } else {
        wrap.innerHTML = window.GiaiMaPuzzle.renderSvgMatrix('gen_preview', {}, {
          isPrint: true,
          strokeWidth: activeStrokeW,
          showFooterLegend: false,
          showTopHeaderSvg: false,
          interactivePreview: true,
          puzzle: currentGeneratedPuzzle
        });
      }
    }

    updatePaperSpecBar();

    if (window.GiaiMaPuzzleDecorators && typeof window.GiaiMaPuzzleDecorators.renderInlineColorEditor === 'function') {
      window.GiaiMaPuzzleDecorators.renderInlineColorEditor(
        'gmmQuickMarkerEditorGrid',
        currentGeneratedPuzzle,
        handleQuickRuleChange,
        toggleMarkerRuleLock
      );
    }

    const unlockAllBtn = document.getElementById('gmmBtnUnlockAllColors');
    if (unlockAllBtn && currentGeneratedPuzzle && currentGeneratedPuzzle.colorRules) {
      const lockedCount = Object.values(currentGeneratedPuzzle.colorRules).filter(r => r && r.locked).length;
      unlockAllBtn.style.display = lockedCount > 0 ? 'inline-flex' : 'none';
      unlockAllBtn.textContent = `🔓 Mở khóa tất cả (${lockedCount})`;
    }

    if (selectedRuleCodeInPreview) {
      renderActiveRuleQuickBar();
      const editorGrid = document.getElementById('gmmQuickMarkerEditorGrid');
      if (editorGrid) {
        const targetChip = editorGrid.querySelector(`.gmm-marker-chip[data-code="${selectedRuleCodeInPreview}"]`);
        if (targetChip) {
          targetChip.classList.add('gmm-marker-chip-active-flash');
        }
      }
    }
  }

  function normalizeTextForSearch(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();
  }

  function handlePresetSearchChange(val) {
    presetSearchKeyword = String(val || '');
    const input = document.getElementById('gmmPresetSearchInput');
    if (input && input.value !== presetSearchKeyword) {
      input.value = presetSearchKeyword;
    }
    const clearBtn = document.getElementById('gmmPresetSearchClearBtn');
    if (clearBtn) {
      clearBtn.style.display = presetSearchKeyword.trim() ? 'inline-block' : 'none';
    }
    renderPresetListUI(true);
  }

  function setPresetFilterTag(tag) {
    presetFilterTag = tag || 'all';
    const bar = document.getElementById('gmmPresetFilterBar');
    if (bar) {
      bar.querySelectorAll('.gmm-preset-filter-chip').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === presetFilterTag;
        btn.classList.toggle('active', isActive);
        btn.style.borderColor = isActive ? '#38bdf8' : 'rgba(255,255,255,0.15)';
        btn.style.background = isActive ? 'rgba(2, 132, 199, 0.35)' : 'rgba(30, 41, 59, 0.75)';
        btn.style.color = isActive ? '#ffffff' : '#cbd5e1';
      });
    }
    renderPresetListUI(true);
  }

  function renderPresetListUI(skipPreviewRender) {
    const container = document.getElementById('gmmPresetListContainer');
    if (!container) return;
    const allPresets = getSavedPresets();
    const qNorm = normalizeTextForSearch(presetSearchKeyword);

    const filtered = allPresets
      .map((p, idx) => ({ p, idx, isBuiltin: idx < DEFAULT_PRESETS.length }))
      .filter(({ p, isBuiltin }) => {
        if (presetFilterTag === 'builtin' && !isBuiltin) return false;
        if (presetFilterTag === 'custom' && isBuiltin) return false;
        if (presetFilterTag === 'polygon' && (p.meshStyle || 'polygon') !== 'polygon') return false;
        if (presetFilterTag === 'pixel' && p.meshStyle !== 'pixel') return false;
        if (presetFilterTag === 'hexagon' && p.meshStyle !== 'hexagon') return false;
        if (!qNorm) return true;
        const haystack = normalizeTextForSearch(`${p.title || ''} ${p.description || ''} ${p.meshStyle || ''}`);
        return haystack.includes(qNorm);
      });

    const countBadge = document.getElementById('gmmPresetCountBadge');
    if (countBadge) {
      countBadge.textContent = filtered.length === allPresets.length
        ? String(allPresets.length)
        : `${filtered.length}/${allPresets.length}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 18px 12px; color: #94a3b8; font-size: 0.82rem; border: 1px dashed rgba(148, 163, 184, 0.25); border-radius: 8px;">
          🔍 Không tìm thấy bức tranh nào khớp với bộ lọc hiện tại.<br>
          <button type="button" onclick="GiaiMaPuzzleGenerator.handlePresetSearchChange(''); GiaiMaPuzzleGenerator.setPresetFilterTag('all');" style="margin-top: 6px; padding: 4px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #7dd3fc; font-weight: 700; cursor: pointer; font-size: 0.75rem;">↺ Xem tất cả (${allPresets.length} tranh)</button>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(({ p, idx, isBuiltin }) => {
        const isSelected = (p.id === activePresetIdInModal) ||
          (currentGeneratedPuzzle && currentGeneratedPuzzle.title === p.title && !activePresetIdInModal);
        const rowBorder = isSelected ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)';
        const rowBg = isSelected ? 'rgba(6, 78, 59, 0.42)' : 'rgba(30, 41, 59, 0.7)';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: ${rowBg}; padding: 8px 12px; border-radius: 8px; border: ${rowBorder}; transition: all 0.2s;">
            <div style="min-width: 0; flex: 1;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-weight: 800; color: ${isSelected ? '#6ee7b7' : '#f8fafc'}; font-size: 0.88rem;">${idx + 1}. ${p.title}</span>
                ${isSelected ? '<span style="font-size: 0.68rem; padding: 1px 7px; border-radius: 999px; background: rgba(16, 185, 129, 0.25); border: 1px solid #34d399; color: #a7f3d0; font-weight: 800;">✔ Đang chọn</span>' : ''}
              </div>
              <div style="font-size: 0.74rem; color: #94a3b8;">${p.description || p.questionCount + ' câu hỏi'}</div>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0; align-items: center;">
              <button type="button" class="gmm-btn-ctrl ${isSelected ? 'secondary' : 'primary'}" style="padding: 4px 9px; font-size: 0.74rem;" onclick="GiaiMaPuzzleGenerator.applyPreset('${p.id}')">${isSelected ? '👁️ Đang xem' : 'Chọn Dùng'}</button>
              <button type="button" class="gmm-btn-ctrl" style="padding: 4px 8px; font-size: 0.73rem; background: rgba(2, 132, 199, 0.28); border-color: #38bdf8; color: #bae6fd;" onclick="GiaiMaPuzzleGenerator.quickApplyPresetAndViewTab3('${p.id}')" title="Áp dụng ngay bức tranh này và chuyển sang Tab 3 kiểm tra trên 2 bảng">🎨 Xem Tab 3</button>
              ${!isBuiltin ? `
                <button type="button" class="gmm-btn-ctrl danger" style="padding: 4px 8px; font-size: 0.74rem;" onclick="GiaiMaPuzzleGenerator.removePreset('${p.id}')">Xóa</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    if (!skipPreviewRender) {
      renderPreview();
    }
  }

  function handleSaveCurrentPreset() {
    if (!currentGeneratedPuzzle) return;
    const styleLabel = currentGeneratedPuzzle.meshStyle === 'hexagon' ? 'Tổ ong' : (currentGeneratedPuzzle.meshStyle === 'pixel' ? 'Pixel' : 'Đa giác');
    const diffCode = currentGeneratedPuzzle.difficulty || 'normal';
    const diffLabel = diffCode === 'easy' ? 'Dễ (~180 mảnh)' : (diffCode === 'hard' ? 'Khó (~350 mảnh)' : 'Chuẩn (~240 mảnh)');
    const strokeW = parseFloat(currentGeneratedPuzzle.strokeWidth) || 1.8;
    const newId = 'custom_' + Date.now();
    const savedCopy = Object.assign({}, currentGeneratedPuzzle, {
      id: newId,
      strokeWidth: strokeW,
      showFooterLegend: isFooterLegendEnabled,
      printHeader: currentPrintHeader,
      printRightNote: currentPrintRightNote
    });
    const newPreset = {
      id: newId,
      title: currentGeneratedPuzzle.title,
      questionCount: currentGeneratedPuzzle.questionCount,
      meshStyle: currentGeneratedPuzzle.meshStyle || 'polygon',
      decorMotif: currentGeneratedPuzzle.decorMotif || 'auto',
      difficulty: diffCode,
      strokeWidth: strokeW,
      showFooterLegend: isFooterLegendEnabled,
      printHeader: currentPrintHeader,
      printRightNote: currentPrintRightNote,
      description: `Kiểu ${styleLabel} • ${diffLabel} • Viền ${strokeW}px • Tạo lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      matrixData: savedCopy
    };
    activePresetIdInModal = newId;
    currentGeneratedPuzzle = savedCopy;
    saveCustomPreset(newPreset);
    renderPresetListUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`💾 Đã lưu "${newPreset.title}" (kèm tên màu bút dạ) vào Bộ sưu tập!`, 'success');
    }
  }

  function applyPreset(presetId) {
    const list = getSavedPresets();
    const p = list.find(item => item.id === presetId);
    if (!p) return;

    activePresetIdInModal = presetId;
    const input = document.getElementById('gmmGenInputText');
    const select = document.getElementById('gmmGenQCount');
    const meshSelect = document.getElementById('gmmGenMeshStyle');
    const motifSelect = document.getElementById('gmmGenDecorMotif');
    const diffSelect = document.getElementById('gmmGenDifficulty');
    const strokeSelect = document.getElementById('gmmGenStrokeWidth');
    if (input) input.value = p.title;
    if (select) select.value = p.questionCount || 10;
    if (meshSelect && p.meshStyle) meshSelect.value = p.meshStyle;
    if (motifSelect) motifSelect.value = p.decorMotif || 'auto';
    if (diffSelect) diffSelect.value = p.difficulty || 'normal';
    const currentStrokeVal = strokeSelect ? (parseFloat(strokeSelect.value) || 1.8) : 1.8;
    const presetStrokeVal = parseFloat(p.strokeWidth || (p.matrixData && p.matrixData.strokeWidth)) || currentStrokeVal;
    if (strokeSelect) strokeSelect.value = String(presetStrokeVal);
    if (typeof p.showFooterLegend === 'boolean') {
      isFooterLegendEnabled = p.showFooterLegend;
    }
    if (typeof p.printHeader === 'string' && p.printHeader.trim()) {
      currentPrintHeader = p.printHeader.trim();
    }
    if (typeof p.printRightNote === 'string' && p.printRightNote.trim()) {
      currentPrintRightNote = p.printRightNote.trim();
    }

    if (p.id === 'preset_trian_2011') {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
      currentGeneratedPuzzle.strokeWidth = presetStrokeVal;
      currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
      currentGeneratedPuzzle.printHeader = currentPrintHeader;
      currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
      if (input) input.value = currentGeneratedPuzzle.title;
    } else if (p.matrixData) {
      currentGeneratedPuzzle = p.matrixData;
      currentGeneratedPuzzle.strokeWidth = presetStrokeVal;
      currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
      currentGeneratedPuzzle.printHeader = currentPrintHeader;
      currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    } else {
      currentGeneratedPuzzle = generateMatrixFromText(p.title, p.questionCount || 10, {
        meshStyle: p.meshStyle || 'polygon',
        decorMotif: p.decorMotif || 'auto',
        difficulty: p.difficulty || 'normal',
        strokeWidth: presetStrokeVal
      });
      currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
      currentGeneratedPuzzle.printHeader = currentPrintHeader;
      currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    }
    applyLockedRulesToPuzzle(currentGeneratedPuzzle);
    renderPresetListUI(true);
    renderPreview();
  }

  function quickApplyPresetAndViewTab3(presetId) {
    applyPreset(presetId);
    handleApplyToGame(true);
  }

  function syncActivePuzzleFromExternal(puzzleData) {
    if (!puzzleData || !puzzleData.cells) return;
    currentGeneratedPuzzle = puzzleData;
    activePresetIdInModal = puzzleData.id || (puzzleData.isDefaultTriAn ? 'preset_trian_2011' : null);
    const input = document.getElementById('gmmGenInputText');
    if (input && puzzleData.title) input.value = puzzleData.title;
    const strokeSelect = document.getElementById('gmmGenStrokeWidth');
    if (strokeSelect && puzzleData.strokeWidth) strokeSelect.value = String(puzzleData.strokeWidth);
    if (typeof puzzleData.showFooterLegend === 'boolean') {
      isFooterLegendEnabled = puzzleData.showFooterLegend;
    }
    if (typeof puzzleData.printHeader === 'string' && puzzleData.printHeader.trim()) {
      currentPrintHeader = puzzleData.printHeader.trim();
    }
    if (typeof puzzleData.printRightNote === 'string' && puzzleData.printRightNote.trim()) {
      currentPrintRightNote = puzzleData.printRightNote.trim();
    }
    applyLockedRulesToPuzzle(currentGeneratedPuzzle);
  }

  function removePreset(presetId) {
    if (confirm('Thầy có chắc chắn muốn xóa bức tranh này khỏi Bộ sưu tập không?')) {
      deleteCustomPreset(presetId);
      renderPresetListUI();
    }
  }

  function handleExportSvg(mode) {
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    exportSvgVector(currentGeneratedPuzzle, mode);
  }

  function handleExportPdf(mode) {
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    exportPdfVector(currentGeneratedPuzzle, mode);
  }

  function handleApplyToGame(switchToTab3) {
    if (!currentGeneratedPuzzle) {
      handleGenerateClick();
    }
    currentGeneratedPuzzle.showFooterLegend = isFooterLegendEnabled;
    currentGeneratedPuzzle.printHeader = currentPrintHeader;
    currentGeneratedPuzzle.printRightNote = currentPrintRightNote;
    if (activePresetIdInModal && !currentGeneratedPuzzle.id) {
      currentGeneratedPuzzle.id = activePresetIdInModal;
    }
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.setActivePuzzle === 'function') {
      window.GiaiMaPuzzle.setActivePuzzle(currentGeneratedPuzzle);
    }
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.updateSettingsSummaryBar === 'function') {
      window.GiaiMaBiMat.updateSettingsSummaryBar();
    }
    const quickViewBtn = document.getElementById('gmmBtnQuickViewAppliedPuzzle');
    if (quickViewBtn) {
      quickViewBtn.style.display = 'inline-flex';
    }
    closeGeneratorModal();
    if (switchToTab3 && window.GiaiMaBiMat && typeof window.GiaiMaBiMat.switchTab === 'function') {
      window.GiaiMaBiMat.switchTab('decrypt');
    }
    if (typeof window.showToast === 'function') {
      window.showToast(
        switchToTab3
          ? `🎨 Đã áp dụng bức tranh "${currentGeneratedPuzzle.title}" và chuyển sang Tab 3 Xem Tranh!`
          : `🎉 Đã áp dụng bức tranh "${currentGeneratedPuzzle.title}" vào trò chơi! (Bấm "Lưu Cấu Hình Mặc Định" nếu muốn giữ cho lớp sau)`,
        'success'
      );
    }
  }

  window.GiaiMaPuzzleGenerator = {
    generateMatrixFromText,
    getSavedPresets,
    saveCustomPreset,
    deleteCustomPreset,
    exportCustomPresetsSnapshot,
    applyServerCustomPresets,
    exportSvgVector,
    exportPdfVector,
    openGeneratorModal,
    closeGeneratorModal,
    getCurrentPuzzle,
    insertSymbolToInput,
    handleGenerateClick,
    handleApplyHighContrastPalette,
    handleResetMarkerNames,
    toggleMarkerRuleLock,
    handleUnlockAllMarkerColors,
    handlePrintHeaderChange,
    handlePrintRightNoteChange,
    setQuickRightNoteTeam,
    handlePreviewCanvasClick,
    applyInstantColorToActiveRule,
    closeActiveRuleQuickBar,
    setPreviewMode,
    togglePreviewSeamless,
    toggleFooterLegend,
    togglePreviewFullscreen,
    handlePaperSizeChange,
    handleStrokeWidthChange,
    updatePaperSpecBar,
    handlePresetSearchChange,
    setPresetFilterTag,
    handleSaveCurrentPreset,
    applyPreset,
    quickApplyPresetAndViewTab3,
    syncActivePuzzleFromExternal,
    removePreset,
    handleExportSvg,
    handleExportPdf,
    handleApplyToGame
  };
})();
