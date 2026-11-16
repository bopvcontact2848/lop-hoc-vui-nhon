/**
 * ==============================================================================
 * MODULE LƯU TRỮ BỘ SƯU TẬP TRANH & CẤU HÌNH IN ẤN (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzlePresetStore.js
 * Trách nhiệm: Quản lý LocalStorage + đồng bộ server cho bộ sưu tập tranh,
 * tiêu đề đầu trang in, ghi chú đội và khóa màu bút dạ theo câu hỏi.
 * ==============================================================================
 */
(function () {
  'use strict';

  const STORAGE_KEY_PRESETS = 'gmm_saved_puzzle_presets_v2';
  const LEGACY_STORAGE_KEY_PRESETS = 'gmm_saved_puzzle_presets_v1';
  const STORAGE_KEY_PRINT_HEADER = 'gmm_custom_print_header_v1';
  const DEFAULT_PRINT_HEADER = 'TRƯỜNG THCS TÂN HẢI - HOẠT ĐỘNG DẠY HỌC TÍCH CỰC';
  const STORAGE_KEY_PRINT_RIGHT_NOTE = 'gmm_custom_print_right_note_v1';
  const DEFAULT_PRINT_RIGHT_NOTE = 'ĐỘI THI: .............................';
  const STORAGE_KEY_LOCKED_COLORS = 'gmm_locked_color_rules_v1';

  let inMemorySyncedCustomPresets = null;
  let onPresetsChangedCallback = null;

  function getDefaultPresets() {
    const R = window.GiaiMaPuzzleRasterizer;
    return (R && Array.isArray(R.DEFAULT_PRESETS)) ? R.DEFAULT_PRESETS : [];
  }

  function setOnPresetsChanged(cb) {
    onPresetsChangedCallback = typeof cb === 'function' ? cb : null;
  }

  function getSavedPresets() {
    const defaultPresets = getDefaultPresets();
    let customList = [];
    if (Array.isArray(inMemorySyncedCustomPresets)) {
      customList = inMemorySyncedCustomPresets.filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id));
      return [...defaultPresets, ...customList];
    }
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (Array.isArray(parsed)) {
          customList = parsed.filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id));
        }
      } else {
        const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY_PRESETS);
        if (rawV1) {
          const parsedV1 = JSON.parse(rawV1);
          if (Array.isArray(parsedV1)) {
            customList = parsedV1
              .filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id))
              .map(p => {
                const freshCopy = Object.assign({}, p);
                delete freshCopy.matrixData;
                return freshCopy;
              });
          }
        }
      }
    } catch {
      // Bỏ qua lỗi đọc LocalStorage
    }
    return [...defaultPresets, ...customList];
  }

  function exportCustomPresetsSnapshot() {
    const defaultPresets = getDefaultPresets();
    return getSavedPresets()
      .filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id))
      .map(p => Object.assign({}, p, { updatedAt: Number(p.updatedAt) || Date.now() }));
  }

  function applyServerCustomPresets(serverPuzzles) {
    if (!Array.isArray(serverPuzzles)) return;
    const defaultPresets = getDefaultPresets();
    const cleanCustoms = serverPuzzles.filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id));
    inMemorySyncedCustomPresets = cleanCustoms;
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify([...defaultPresets, ...cleanCustoms]));
      inMemorySyncedCustomPresets = null;
    } catch {
      // Giữ cache bộ nhớ khi vượt giới hạn 5MB của LocalStorage
    }
    if (document.getElementById('gmmPresetListContainer') && onPresetsChangedCallback) {
      onPresetsChangedCallback(true);
    }
  }

  function notifyPuzzleServerSync(action, payload) {
    const syncApi = window.GmmServerPuzzlesSync;
    if (syncApi && typeof syncApi.pushMutation === 'function') {
      syncApi.pushMutation(action, payload);
    }
  }

  function saveCustomPreset(presetObj) {
    if (!presetObj || !presetObj.title) return false;
    const defaultPresets = getDefaultPresets();
    presetObj.updatedAt = Date.now();
    const list = getSavedPresets();
    const existingIdx = list.findIndex(p => p.id === presetObj.id);
    if (existingIdx >= 0) {
      list[existingIdx] = presetObj;
    } else {
      list.unshift(presetObj);
    }
    const nextCustoms = list.filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id));
    if (Array.isArray(inMemorySyncedCustomPresets)) {
      inMemorySyncedCustomPresets = nextCustoms;
    }
    let ok = false;
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
      ok = true;
    } catch {
      inMemorySyncedCustomPresets = nextCustoms;
      ok = true;
    }
    if (ok && !defaultPresets.some(dp => dp.id === presetObj.id)) {
      notifyPuzzleServerSync('sync');
    }
    return ok;
  }

  function deleteCustomPreset(id) {
    const defaultPresets = getDefaultPresets();
    let list = getSavedPresets();
    list = list.filter(p => p.id !== id);
    const nextCustoms = list.filter(p => p && p.id && !defaultPresets.some(dp => dp.id === p.id));
    if (Array.isArray(inMemorySyncedCustomPresets)) {
      inMemorySyncedCustomPresets = nextCustoms;
    }
    let ok = false;
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
      ok = true;
    } catch {
      inMemorySyncedCustomPresets = nextCustoms;
      ok = true;
    }
    if (ok && id && !defaultPresets.some(dp => dp.id === id)) {
      notifyPuzzleServerSync('delete', { id });
    }
    return ok;
  }

  function getSavedPrintHeader() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRINT_HEADER);
      if (saved !== null) return saved;
    } catch {}
    return DEFAULT_PRINT_HEADER;
  }

  function savePrintHeader(value) {
    try {
      localStorage.setItem(STORAGE_KEY_PRINT_HEADER, value);
    } catch {}
  }

  function getSavedPrintRightNote() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRINT_RIGHT_NOTE);
      if (saved !== null) return saved;
    } catch {}
    return DEFAULT_PRINT_RIGHT_NOTE;
  }

  function savePrintRightNote(value) {
    try {
      localStorage.setItem(STORAGE_KEY_PRINT_RIGHT_NOTE, value);
    } catch {}
  }

  function getSavedLockedColors() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCKED_COLORS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  }

  function saveLockedColors(map) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCKED_COLORS, JSON.stringify(map || {}));
    } catch {}
  }

  let lockedRulesByQNum = getSavedLockedColors();

  function applyLockedRulesToPuzzle(puzzle) {
    if (!puzzle || !puzzle.colorRules) return;
    Object.keys(puzzle.colorRules).forEach((codeKey, idx) => {
      const rule = puzzle.colorRules[codeKey];
      if (!rule) return;
      const qKey = String(rule.qNum || (idx + 1));
      const lockedEntry = lockedRulesByQNum[qKey];
      if (lockedEntry && lockedEntry.locked) {
        rule.locked = true;
        if (lockedEntry.color) rule.color = lockedEntry.color;
        if (lockedEntry.name) rule.name = lockedEntry.name;
        if (Array.isArray(puzzle.cells)) {
          puzzle.cells.forEach(c => {
            if (c.isTarget && c.code === codeKey) {
              c.targetColor = rule.color;
            }
          });
        }
      } else {
        rule.locked = Boolean(rule.locked);
      }
    });
  }

  function syncLockedRuleForQNum(rule) {
    if (!rule || !rule.qNum) return;
    const qKey = String(rule.qNum);
    if (rule.locked) {
      lockedRulesByQNum[qKey] = {
        locked: true,
        color: rule.color,
        name: rule.name
      };
    } else {
      delete lockedRulesByQNum[qKey];
    }
    saveLockedColors(lockedRulesByQNum);
  }

  function clearAllLockedRules() {
    lockedRulesByQNum = {};
    saveLockedColors(lockedRulesByQNum);
  }

  function measureAverageTargetPieceSvgSize(cells) {
    if (!Array.isArray(cells) || cells.length === 0) {
      return { avgW: 26, avgH: 22 };
    }
    const targets = cells.filter(c => c && c.isTarget && typeof c.d === 'string');
    const sample = targets.length > 0 ? targets : cells;
    let sumW = 0;
    let sumH = 0;
    let count = 0;
    for (let i = 0; i < sample.length; i++) {
      const tokens = String(sample[i].d || '').match(/[MLHVZmlhvz]|-?\d+(?:\.\d+)?/g);
      if (!tokens || tokens.length < 3) continue;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let cx = 0, cy = 0;
      let cmd = 'M';
      let k = 0;
      while (k < tokens.length) {
        const tk = tokens[k];
        if (/^[MLHVZmlhvz]$/.test(tk)) {
          cmd = tk.toUpperCase();
          k++;
          if (cmd === 'Z') continue;
        }
        if (cmd === 'M' || cmd === 'L') {
          if (k + 1 >= tokens.length) break;
          cx = parseFloat(tokens[k]);
          cy = parseFloat(tokens[k + 1]);
          k += 2;
        } else if (cmd === 'H') {
          cx = parseFloat(tokens[k]);
          k += 1;
        } else if (cmd === 'V') {
          cy = parseFloat(tokens[k]);
          k += 1;
        } else {
          k++;
          continue;
        }
        if (!Number.isNaN(cx) && !Number.isNaN(cy)) {
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
        }
      }
      const w = maxX - minX;
      const h = maxY - minY;
      if (w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h)) {
        sumW += w;
        sumH += h;
        count++;
      }
    }
    if (count === 0) return { avgW: 26, avgH: 22 };
    return { avgW: sumW / count, avgH: sumH / count };
  }

  window.GiaiMaPuzzlePresetStore = {
    DEFAULT_PRINT_HEADER,
    DEFAULT_PRINT_RIGHT_NOTE,
    setOnPresetsChanged,
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
    syncLockedRuleForQNum,
    clearAllLockedRules,
    measureAverageTargetPieceSvgSize
  };
})();
