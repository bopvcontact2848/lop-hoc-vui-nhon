/**
 * ==============================================================================
 * MODULE QUẢN LÝ CẤU HÌNH MẶC ĐỊNH & THANH TÓM TẮT (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmTeacherPresets.js
 * Trách nhiệm: Cập nhật thanh tóm tắt cấu hình, lưu/nạp/khôi phục preset mặc định
 * của giáo viên cho tiết học tiếp theo (Tab 6).
 * ==============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY_TEACHER_PRESET = 'gmm_teacher_default_preset_v1';

  function formatDurationLabel(sec) {
    const s = Number(sec) || 120;
    if (s % 60 === 0) return `${Math.round(s / 60)} phút`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}p ${rem}s`;
  }

  window.GmmTeacherPresets = {
    create: function (ctx) {
      const {
        gameState,
        STORAGE_KEY_CANVAS_THEME,
        STORAGE_KEY_STEALTH_MODE,
        getQuestionsList,
        renderDualArena,
        renderDecryptUI,
        updateCanvasThemeButtonUI,
        updateStealthButtonUI,
        updateBattleMusicUI
      } = ctx;

      function updateSettingsSummaryBar() {
        const summaryEl = document.getElementById('gmmSettingsSummaryText');
        if (!summaryEl) return;

        const qCount = (typeof getQuestionsList === 'function' && Array.isArray(getQuestionsList()))
          ? getQuestionsList().length
          : 10;
        const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
          ? window.GiaiMaPuzzle.getActivePuzzle()
          : null;
        const puzzleTitle = (activePuzzle && activePuzzle.title) ? activePuzzle.title : 'TRI ÂN THẦY CÔ 20/11';
        const quizDur = formatDurationLabel(gameState.totalMatchSeconds || 120);
        const decryptDur = formatDurationLabel(gameState.decryptTimeTotal || 300);
        const themeLabel = (gameState.canvasTheme || 'paper') === 'paper' ? 'Giấy trắng A1' : 'Nền tối sân khấu';
        const isChill = window.audioManager && typeof window.audioManager.getBattleMusicGenre === 'function' && window.audioManager.getBattleMusicGenre() === 'chill';
        const genreLabel = isChill ? 'Nhẹ nhàng' : 'Kịch tính';
        const vol = (window.audioManager && typeof window.audioManager.getBattleMusicVolume === 'function')
          ? window.audioManager.getBattleMusicVolume()
          : 70;

        summaryEl.textContent = `Bộ ${qCount} câu hỏi Kỹ năng sống • Tranh: "${puzzleTitle}" • Trắc nghiệm: ${quizDur} • Tô tranh: ${decryptDur} • Nền: ${themeLabel} • Nhạc nền: ${genreLabel} (${vol}%)`;
      }

      function applyDurationButtonsUI(matchSec, decryptSec) {
        [60, 90, 120, 180].forEach(s => {
          const btn = document.getElementById(`gmmTimeBtn_${s}`);
          if (btn) btn.classList.toggle('primary', s === matchSec);
        });
        [180, 300, 420].forEach(s => {
          const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
          if (btn) btn.classList.toggle('primary', s === decryptSec);
          const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
          if (fsBtn) fsBtn.classList.toggle('active', s === decryptSec);
        });
        const mins = Math.round(decryptSec / 60);
        const btnStartDec = document.getElementById('gmmBtnStartDecrypt');
        if (btnStartDec && !gameState.isDecryptTimerRunning) {
          btnStartDec.textContent = `🚀 Bắt Đầu (${mins}p)`;
        }
        const checkAutoFs = document.getElementById('gmmCheckAutoFsOnTimerStart');
        if (checkAutoFs) checkAutoFs.checked = Boolean(gameState.autoFsOnTimerStart);
      }

      function saveDefaultSettingsForNextClass() {
        const genre = (window.audioManager && typeof window.audioManager.getBattleMusicGenre === 'function')
          ? window.audioManager.getBattleMusicGenre()
          : 'epic';
        const vol = (window.audioManager && typeof window.audioManager.getBattleMusicVolume === 'function')
          ? window.audioManager.getBattleMusicVolume()
          : 70;
        const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
          ? window.GiaiMaPuzzle.getActivePuzzle()
          : null;

        const preset = {
          totalMatchSeconds: gameState.totalMatchSeconds || 120,
          decryptTimeTotal: gameState.decryptTimeTotal || 300,
          canvasTheme: gameState.canvasTheme || 'paper',
          isStealthMode: Boolean(gameState.isStealthMode),
          autoFsOnTimerStart: Boolean(gameState.autoFsOnTimerStart),
          battleMusicGenre: genre,
          battleMusicVolume: vol,
          activePuzzle: activePuzzle
            ? {
                id: activePuzzle.id || (activePuzzle.isDefaultTriAn ? 'preset_trian_2011' : null),
                title: activePuzzle.title || 'TRI ÂN THẦY CÔ 20/11',
                isDefaultTriAn: Boolean(activePuzzle.isDefaultTriAn),
                dateSeparatorStyle: activePuzzle.dateSeparatorStyle || 'slash',
                cells: activePuzzle.isDefaultTriAn ? null : activePuzzle.cells,
                colorRules: activePuzzle.colorRules || null,
                targetCellIds: activePuzzle.isDefaultTriAn ? null : activePuzzle.targetCellIds
              }
            : null,
          savedAt: Date.now()
        };

        try {
          localStorage.setItem(STORAGE_KEY_TEACHER_PRESET, JSON.stringify(preset));
          localStorage.setItem(STORAGE_KEY_CANVAS_THEME, preset.canvasTheme);
          localStorage.setItem(STORAGE_KEY_STEALTH_MODE, String(preset.isStealthMode));
        } catch (_e) {}

        updateSettingsSummaryBar();
        const badge = document.getElementById('gmmSettingsSavedBadge');
        if (badge) {
          badge.textContent = '💾 Đã lưu mặc định cho lớp sau!';
        }

        const savedTitle = (activePuzzle && activePuzzle.title) ? activePuzzle.title : 'TRI ÂN THẦY CÔ 20/11';
        if (typeof window.showToast === 'function') {
          window.showToast(
            `💾 Đã lưu mặc định: Tranh "${savedTitle}" • Trắc nghiệm ${formatDurationLabel(preset.totalMatchSeconds)} • Tô tranh ${formatDurationLabel(preset.decryptTimeTotal)} • Nhạc ${vol}%!`,
            'success'
          );
        }
      }

      function loadSavedDefaultSettings() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY_TEACHER_PRESET);
          if (!raw) {
            updateBattleMusicUI();
            updateSettingsSummaryBar();
            return;
          }
          const preset = JSON.parse(raw);
          if (!preset || typeof preset !== 'object') return;

          if (typeof preset.totalMatchSeconds === 'number' && preset.totalMatchSeconds >= 30) {
            gameState.totalMatchSeconds = preset.totalMatchSeconds;
            if (!gameState.isMatchStarted) {
              gameState.timerSeconds = preset.totalMatchSeconds;
            }
          }
          if (typeof preset.decryptTimeTotal === 'number' && preset.decryptTimeTotal >= 60) {
            gameState.decryptTimeTotal = preset.decryptTimeTotal;
            if (!gameState.isDecryptTimerRunning) {
              gameState.decryptTimeLeft = preset.decryptTimeTotal;
            }
          }
          if (preset.canvasTheme === 'paper' || preset.canvasTheme === 'dark') {
            gameState.canvasTheme = preset.canvasTheme;
          }
          if (typeof preset.isStealthMode === 'boolean') {
            gameState.isStealthMode = preset.isStealthMode;
          }
          if (typeof preset.autoFsOnTimerStart === 'boolean') {
            gameState.autoFsOnTimerStart = preset.autoFsOnTimerStart;
          }
          if (window.audioManager) {
            if (preset.battleMusicGenre === 'epic' || preset.battleMusicGenre === 'chill') {
              if (typeof window.audioManager.setBattleMusicGenre === 'function') {
                window.audioManager.setBattleMusicGenre(preset.battleMusicGenre);
              }
            }
            if (typeof preset.battleMusicVolume === 'number') {
              if (typeof window.audioManager.setBattleMusicVolume === 'function') {
                window.audioManager.setBattleMusicVolume(preset.battleMusicVolume);
              }
            }
          }

          if (preset.activePuzzle && window.GiaiMaPuzzle) {
            if (
              (preset.activePuzzle.dateSeparatorStyle === 'dash' || preset.activePuzzle.dateSeparatorStyle === 'slash') &&
              typeof window.GiaiMaPuzzle.setDateSeparatorStyle === 'function'
            ) {
              window.GiaiMaPuzzle.setDateSeparatorStyle(preset.activePuzzle.dateSeparatorStyle);
            }
            if (
              !preset.activePuzzle.isDefaultTriAn &&
              Array.isArray(preset.activePuzzle.cells) &&
              preset.activePuzzle.cells.length > 0 &&
              typeof window.GiaiMaPuzzle.setActivePuzzle === 'function'
            ) {
              window.GiaiMaPuzzle.setActivePuzzle(preset.activePuzzle);
              if (
                window.GiaiMaPuzzleGenerator &&
                typeof window.GiaiMaPuzzleGenerator.syncActivePuzzleFromExternal === 'function'
              ) {
                window.GiaiMaPuzzleGenerator.syncActivePuzzleFromExternal(preset.activePuzzle);
              }
            }
          }

          applyDurationButtonsUI(gameState.totalMatchSeconds || 120, gameState.decryptTimeTotal || 300);
          updateCanvasThemeButtonUI();
          updateStealthButtonUI();
          updateBattleMusicUI();
          updateSettingsSummaryBar();

          const badge = document.getElementById('gmmSettingsSavedBadge');
          if (badge) {
            badge.textContent = '✅ Đã nạp cấu hình mặc định đã lưu';
          }
        } catch (_e) {}
      }

      function resetDefaultTeacherSettings() {
        try {
          localStorage.removeItem(STORAGE_KEY_TEACHER_PRESET);
        } catch (_e) {}

        gameState.totalMatchSeconds = 120;
        if (!gameState.isMatchStarted) gameState.timerSeconds = 120;
        gameState.decryptTimeTotal = 300;
        if (!gameState.isDecryptTimerRunning) gameState.decryptTimeLeft = 300;
        gameState.canvasTheme = 'paper';
        gameState.isStealthMode = false;
        gameState.autoFsOnTimerStart = false;

        if (window.audioManager) {
          if (typeof window.audioManager.setBattleMusicGenre === 'function') {
            window.audioManager.setBattleMusicGenre('epic');
          }
          if (typeof window.audioManager.setBattleMusicVolume === 'function') {
            window.audioManager.setBattleMusicVolume(70);
          }
        }

        if (window.GiaiMaPuzzleGenerator && typeof window.GiaiMaPuzzleGenerator.applyPreset === 'function') {
          window.GiaiMaPuzzleGenerator.applyPreset('preset_trian_2011');
        }
        if (window.GiaiMaPuzzle) {
          if (typeof window.GiaiMaPuzzle.setDateSeparatorStyle === 'function') {
            window.GiaiMaPuzzle.setDateSeparatorStyle('slash');
          }
          if (typeof window.GiaiMaPuzzle.setActivePuzzle === 'function' && window.GiaiMaPuzzle.PUZZLE_CELLS_SLASH) {
            window.GiaiMaPuzzle.setActivePuzzle({
              id: 'preset_trian_2011',
              title: 'TRI ÂN THẦY CÔ 20/11',
              cells: window.GiaiMaPuzzle.PUZZLE_CELLS_SLASH,
              colorRules: window.GiaiMaPuzzle.COLOR_RULES
            });
          }
        }

        applyDurationButtonsUI(120, 300);
        updateCanvasThemeButtonUI();
        updateStealthButtonUI();
        updateBattleMusicUI();
        updateSettingsSummaryBar();
        if (typeof renderDualArena === 'function') renderDualArena();
        if (typeof renderDecryptUI === 'function') renderDecryptUI();

        const quickViewBtn = document.getElementById('gmmBtnQuickViewAppliedPuzzle');
        if (quickViewBtn) {
          quickViewBtn.style.display = 'none';
        }
        const badge = document.getElementById('gmmSettingsSavedBadge');
        if (badge) {
          badge.textContent = '↺ Đã khôi phục mặc định gốc';
        }
        if (typeof window.showToast === 'function') {
          window.showToast('↺ Đã khôi phục cấu hình gốc (Tranh 20/11, Trắc nghiệm 2p, Tô tranh 5p, Giấy trắng A1, Nhạc 70%)!', 'info');
        }
      }

      return {
        updateSettingsSummaryBar,
        saveDefaultSettingsForNextClass,
        loadSavedDefaultSettings,
        resetDefaultTeacherSettings
      };
    }
  };
})();
