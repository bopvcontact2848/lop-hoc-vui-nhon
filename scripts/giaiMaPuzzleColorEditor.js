/**
 * ==============================================================================
 * MODULE CHỈNH SỬA & KHÓA MÀU BÚT DẠ TRỰC TIẾP TRÊN TRANH (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleColorEditor.js
 * Trách nhiệm: Sửa tên màu, đổi bảng 10 màu tương phản cao, khóa màu theo câu hỏi,
 * chọn trực tiếp vùng chữ trên khung preview và thanh chọn màu nhanh.
 * ==============================================================================
 */
(function () {
  'use strict';

  window.GiaiMaPuzzleColorEditor = {
    create: function (ctx) {
      const {
        THEME_PALETTES,
        HIGH_CONTRAST_PALETTES,
        PresetStore,
        getCurrentPuzzleOrBuild,
        getActivePresetId,
        setCurrentPuzzle,
        buildDefaultTriAnBundle,
        renderPreview,
        getSelectedRuleCode,
        setSelectedRuleCode
      } = ctx;

      const {
        getSavedPresets,
        saveCustomPreset,
        syncLockedRuleForQNum,
        clearAllLockedRules
      } = PresetStore;

      function syncActiveColorEditsToStores() {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!puzzle) return;
        if (puzzle.id === 'preset_trian_2011') return;

        const activePresetId = getActivePresetId();
        if (activePresetId) {
          const savedList = getSavedPresets();
          const found = savedList.find(p => p.id === activePresetId);
          if (found) {
            found.matrixData = puzzle;
            saveCustomPreset(found);
          }
        }
        if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function') {
          const active = window.GiaiMaPuzzle.getActivePuzzle();
          if (active && active.title === puzzle.title && !active.isDefaultTriAn) {
            window.GiaiMaPuzzle.setActivePuzzle(puzzle);
          }
        }
      }

      function toggleMarkerRuleLock(codeKey) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!puzzle || !puzzle.colorRules || !puzzle.colorRules[codeKey]) return;
        const rule = puzzle.colorRules[codeKey];
        rule.locked = !rule.locked;
        syncLockedRuleForQNum(rule);
        renderPreview();
        if (typeof window.showToast === 'function') {
          const qLabel = 'C' + (rule.qNum || '');
          window.showToast(
            rule.locked
              ? `🔒 Đã KHÓA màu ${qLabel} (${rule.name}) — Sẽ giữ cố định màu này khi bấm Đổi 10 màu hoặc Tạo lại tranh!`
              : `🔓 Đã mở khóa màu ${qLabel} (${rule.name})!`,
            rule.locked ? 'success' : 'info'
          );
        }
      }

      function handleUnlockAllMarkerColors() {
        clearAllLockedRules();
        const puzzle = getCurrentPuzzleOrBuild();
        if (puzzle && puzzle.colorRules) {
          Object.keys(puzzle.colorRules).forEach(code => {
            if (puzzle.colorRules[code]) {
              puzzle.colorRules[code].locked = false;
            }
          });
        }
        renderPreview();
        if (typeof window.showToast === 'function') {
          window.showToast('🔓 Đã mở khóa tất cả các ô màu bút dạ (C1..C10)!', 'info');
        }
      }

      function handleQuickRuleChange(codeKey, newName, newColor) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!puzzle || !puzzle.colorRules || !puzzle.colorRules[codeKey]) return;
        const rule = puzzle.colorRules[codeKey];
        if (newName) rule.name = newName;
        if (newColor) {
          rule.color = newColor;
          if (Array.isArray(puzzle.cells)) {
            puzzle.cells.forEach(c => {
              if (c.isTarget && c.code === codeKey) {
                c.targetColor = newColor;
              }
            });
          }
        }
        if (rule.locked) {
          syncLockedRuleForQNum(rule);
        }

        if (puzzle.id === 'preset_trian_2011' && window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.updateActiveColorRule === 'function') {
          window.GiaiMaPuzzle.updateActiveColorRule(codeKey, newName, newColor);
        } else {
          syncActiveColorEditsToStores();
        }

        renderPreview();
        if (typeof window.showToast === 'function') {
          window.showToast(`🖍️ Đã cập nhật màu Câu ${rule.qNum} (${codeKey}): "${rule.name}"!`, 'info');
        }
      }

      function handleApplyHighContrastPalette() {
        const puzzle = getCurrentPuzzleOrBuild();
        const rulesObj = puzzle.colorRules || {};
        const codes = Object.keys(rulesObj);
        const lockedCount = codes.filter(code => rulesObj[code] && rulesObj[code].locked).length;

        const usedLockedHexes = new Set(
          codes
            .filter(code => rulesObj[code] && rulesObj[code].locked && rulesObj[code].color)
            .map(code => String(rulesObj[code].color).toLowerCase())
        );
        const availablePalettes = HIGH_CONTRAST_PALETTES.filter(p => !usedLockedHexes.has(p.color.toLowerCase()));
        const pool = availablePalettes.length > 0 ? availablePalettes : HIGH_CONTRAST_PALETTES;

        let poolIdx = 0;
        codes.forEach((code, idx) => {
          const rule = rulesObj[code];
          if (!rule || rule.locked) return;
          const pal = lockedCount > 0
            ? pool[poolIdx++ % pool.length]
            : HIGH_CONTRAST_PALETTES[idx % HIGH_CONTRAST_PALETTES.length];
          rule.name = pal.name;
          rule.color = pal.color;
          (puzzle.cells || []).forEach(c => {
            if (c.isTarget && c.code === code) {
              c.targetColor = pal.color;
            }
          });
          if (puzzle.id === 'preset_trian_2011') {
            if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.updateActiveColorRule === 'function') {
              window.GiaiMaPuzzle.updateActiveColorRule(code, pal.name, pal.color);
            }
          }
        });

        syncActiveColorEditsToStores();
        renderPreview();
        if (typeof window.showToast === 'function') {
          const lockNote = lockedCount > 0 ? ` (Đã giữ cố định ${lockedCount} màu đang khóa 🔒)` : '';
          window.showToast(`🎨 Đã áp dụng Bảng 10 Màu Tương Phản Cao${lockNote}!`, 'success');
        }
      }

      function handleResetMarkerNames() {
        let puzzle = getCurrentPuzzleOrBuild();
        let lockedCount = 0;
        if (puzzle && puzzle.colorRules) {
          lockedCount = Object.values(puzzle.colorRules).filter(r => r && r.locked).length;
        }
        if (puzzle && puzzle.id === 'preset_trian_2011') {
          if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.resetDefaultColorOverrides === 'function') {
            window.GiaiMaPuzzle.resetDefaultColorOverrides();
          }
          puzzle = buildDefaultTriAnBundle();
          setCurrentPuzzle(puzzle);
        } else if (puzzle) {
          const codes = Object.keys(puzzle.colorRules || {});
          codes.forEach((code, idx) => {
            const rule = puzzle.colorRules[code];
            if (!rule || rule.locked) return;
            const pal = THEME_PALETTES[idx % THEME_PALETTES.length];
            rule.name = pal.name;
            rule.color = pal.color;
            (puzzle.cells || []).forEach(c => {
              if (c.isTarget && c.code === code) c.targetColor = pal.color;
            });
          });
        }
        renderPreview();
        if (typeof window.showToast === 'function') {
          const lockNote = lockedCount > 0 ? ` (Giữ nguyên ${lockedCount} màu đang khóa 🔒)` : '';
          window.showToast(`↺ Đã khôi phục bảng tên màu bút dạ mặc định${lockNote}!`, 'info');
        }
      }

      function resolveRuleCodeKeyFromCell(cellObj) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!cellObj || !puzzle || !puzzle.colorRules) return null;
        const rules = puzzle.colorRules;
        if (cellObj.code && rules[cellObj.code]) {
          return cellObj.code;
        }
        const qNum = Number(cellObj.q) || parseInt(String(cellObj.code || ''), 10) || 1;
        if (rules['C' + qNum]) return 'C' + qNum;
        const foundKey = Object.keys(rules).find(k => rules[k] && Number(rules[k].qNum) === qNum);
        return foundKey || Object.keys(rules)[0] || null;
      }

      function renderActiveRuleQuickBar(cellObj) {
        const bar = document.getElementById('gmmActiveRuleQuickBar');
        if (!bar) return;
        const selectedRuleCode = getSelectedRuleCode();
        const puzzle = getCurrentPuzzleOrBuild();
        if (!selectedRuleCode || !puzzle || !puzzle.colorRules) {
          bar.style.display = 'none';
          return;
        }
        const rule = puzzle.colorRules[selectedRuleCode];
        if (!rule) {
          bar.style.display = 'none';
          return;
        }

        const qTag = 'C' + (rule.qNum || '');
        const isLocked = Boolean(rule.locked);
        const regionDesc = rule.part
          ? rule.part
          : (cellObj ? (cellObj.isTarget ? 'Chữ cái / Biểu tượng chính' : 'Ô nền ma trận') : 'Nhóm màu đang chọn');

        const swatchesHtml = HIGH_CONTRAST_PALETTES.map(sw => {
          const isCurrent = String(rule.color || '').toLowerCase() === sw.color.toLowerCase();
          return `
            <button type="button"
              onclick="GiaiMaPuzzleGenerator.applyInstantColorToActiveRule('${selectedRuleCode}', '${sw.color}', '${sw.name}')"
              title="Đổi ${qTag} (${selectedRuleCode}) sang màu ${sw.name} (${sw.color})"
              style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; background: ${isCurrent ? 'rgba(255,255,255,0.22)' : 'rgba(15, 23, 42, 0.78)'}; border: ${isCurrent ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)'}; color: #f8fafc; font-size: 0.71rem; font-weight: 800; cursor: pointer; transition: all 0.15s;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background: ${sw.color}; border: 1px solid rgba(255,255,255,0.65); display: inline-block;"></span>
              <span>${sw.name}</span>
            </button>
          `;
        }).join('');

        bar.style.display = 'flex';
        bar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1;">
            <span style="background: ${rule.color}; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); font-weight: 900; font-size: 0.76rem; padding: 3px 9px; border-radius: 6px; border: 1.5px solid #fff;">
              🎯 Đang chọn ${qTag} (${selectedRuleCode}: ${rule.name})
            </span>
            <span style="font-size: 0.74rem; color: #cbd5e1; font-weight: 700;">• ${regionDesc} — Bấm chọn màu bút dạ mới:</span>
            <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
              ${swatchesHtml}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <button type="button" onclick="GiaiMaPuzzleGenerator.toggleMarkerRuleLock('${selectedRuleCode}')" style="background: ${isLocked ? 'rgba(250, 204, 21, 0.28)' : 'rgba(30, 41, 59, 0.85)'}; border: 1px solid ${isLocked ? '#facc15' : 'rgba(255,255,255,0.25)'}; color: ${isLocked ? '#fde047' : '#e2e8f0'}; border-radius: 6px; padding: 3px 8px; font-size: 0.72rem; font-weight: 800; cursor: pointer;" title="Khóa hoặc mở khóa màu ${qTag} khi bấm đổi bảng màu tự động">
              ${isLocked ? '🔒 Đang khóa' : '🔓 Khóa màu này'}
            </button>
            <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #bae6fd; font-weight: 800; cursor: pointer; background: rgba(2, 132, 199, 0.25); border: 1px solid #38bdf8; padding: 3px 8px; border-radius: 6px;" title="Mở bảng chọn màu tùy ý">
              🎨 Màu khác
              <input type="color" value="${rule.color}" onchange="GiaiMaPuzzleGenerator.applyInstantColorToActiveRule('${selectedRuleCode}', this.value, '')" style="width: 18px; height: 18px; border: none; padding: 0; background: transparent; cursor: pointer;">
            </label>
            <button type="button" onclick="GiaiMaPuzzleGenerator.closeActiveRuleQuickBar()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 6px; padding: 3px 7px; font-size: 0.72rem; font-weight: 800; cursor: pointer;" title="Đóng thanh chọn màu nhanh">✕</button>
          </div>
        `;
      }

      function selectAndHighlightMarkerRule(codeKey, cellObj) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!codeKey || !puzzle || !puzzle.colorRules) return;
        const rule = puzzle.colorRules[codeKey];
        if (!rule) return;

        setSelectedRuleCode(codeKey);

        const wrap = document.getElementById('gmmGenPreviewWrap');
        if (wrap && Array.isArray(puzzle.cells)) {
          const qTarget = Number(rule.qNum) || parseInt(String(codeKey).replace(/\D+/g, ''), 10) || 1;
          wrap.querySelectorAll('.gmm-svg-region, .gmm-cell-group').forEach(g => {
            g.classList.remove('gmm-preview-cell-flash');
          });
          puzzle.cells.forEach(c => {
            const cQ = Number(c.q) || parseInt(String(c.code || ''), 10) || 0;
            const isMatch = c.code === codeKey || (c.isTarget && cQ === qTarget);
            if (isMatch) {
              const gEl = wrap.querySelector(`.gmm-cell-group[data-cell="${c.id}"]`);
              if (gEl) {
                void gEl.offsetWidth;
                gEl.classList.add('gmm-preview-cell-flash');
              }
            }
          });
        }

        renderActiveRuleQuickBar(cellObj);

        const editorGrid = document.getElementById('gmmQuickMarkerEditorGrid');
        if (editorGrid) {
          editorGrid.querySelectorAll('.gmm-marker-chip').forEach(chip => {
            chip.classList.remove('gmm-marker-chip-active-flash');
          });
          const targetChip = editorGrid.querySelector(`.gmm-marker-chip[data-code="${codeKey}"]`);
          if (targetChip) {
            void targetChip.offsetWidth;
            targetChip.classList.add('gmm-marker-chip-active-flash');
            const modalCard = document.getElementById('gmmGeneratorModal');
            const isPreviewZoomed = modalCard && modalCard.classList.contains('preview-only-fullscreen');
            if (!isPreviewZoomed && typeof targetChip.scrollIntoView === 'function') {
              targetChip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }

      function handlePreviewCanvasClick(event) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!event || !event.target || !puzzle) return;

        const legendItem = event.target.closest ? event.target.closest('.gmm-footer-legend-item') : null;
        if (legendItem) {
          const codeKey = legendItem.getAttribute('data-code');
          if (codeKey) {
            selectAndHighlightMarkerRule(codeKey, null);
          }
          return;
        }

        const cellGroup = event.target.closest ? event.target.closest('.gmm-cell-group') : null;
        if (!cellGroup) return;

        const cellId = cellGroup.getAttribute('data-cell');
        if (!cellId || !Array.isArray(puzzle.cells)) return;

        const cellObj = puzzle.cells.find(c => c.id === cellId);
        if (!cellObj) return;

        const codeKey = resolveRuleCodeKeyFromCell(cellObj);
        if (codeKey) {
          selectAndHighlightMarkerRule(codeKey, cellObj);
        }
      }

      function applyInstantColorToActiveRule(codeKey, colorHex, colorName) {
        const puzzle = getCurrentPuzzleOrBuild();
        if (!puzzle || !puzzle.colorRules || !puzzle.colorRules[codeKey]) return;
        const rule = puzzle.colorRules[codeKey];
        rule.color = colorHex;
        if (colorName) {
          rule.name = colorName;
        } else if (window.GiaiMaPuzzleDecorators && typeof window.GiaiMaPuzzleDecorators.suggestVietnameseColorName === 'function') {
          rule.name = window.GiaiMaPuzzleDecorators.suggestVietnameseColorName(colorHex);
        }
        if (Array.isArray(puzzle.cells)) {
          puzzle.cells.forEach(c => {
            if (c.isTarget && c.code === codeKey) {
              c.targetColor = colorHex;
            }
          });
        }
        if (rule.locked) {
          syncLockedRuleForQNum(rule);
        }
        if (puzzle.id === 'preset_trian_2011' && window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.updateActiveColorRule === 'function') {
          window.GiaiMaPuzzle.updateActiveColorRule(codeKey, rule.name, rule.color);
        } else {
          syncActiveColorEditsToStores();
        }
        setSelectedRuleCode(codeKey);
        renderPreview();
        if (typeof window.showToast === 'function') {
          window.showToast(`🎨 Đã đổi C${rule.qNum || ''} (${codeKey}) sang màu "${rule.name}"!`, 'success');
        }
      }

      function closeActiveRuleQuickBar() {
        setSelectedRuleCode(null);
        const bar = document.getElementById('gmmActiveRuleQuickBar');
        if (bar) bar.style.display = 'none';
        const editorGrid = document.getElementById('gmmQuickMarkerEditorGrid');
        if (editorGrid) {
          editorGrid.querySelectorAll('.gmm-marker-chip').forEach(chip => {
            chip.classList.remove('gmm-marker-chip-active-flash');
          });
        }
      }

      return {
        toggleMarkerRuleLock,
        handleUnlockAllMarkerColors,
        handleQuickRuleChange,
        handleApplyHighContrastPalette,
        handleResetMarkerNames,
        handlePreviewCanvasClick,
        renderActiveRuleQuickBar,
        applyInstantColorToActiveRule,
        closeActiveRuleQuickBar
      };
    }
  };
})();
