/**
 * ==============================================================================
 * MODULE BIỂU TƯỢNG TRANG TRÍ TỰ ĐỘNG & BỘ SỬA NHANH TÊN MÀU BÚT DẠ (1 CHẠM)
 * File: scripts/giaiMaPuzzleDecorators.js
 *
 * Tính năng:
 *   1. Vẽ biểu tượng trang trí góc tranh trên lưới siêu lấy mẫu 10x (Ngôi sao,
 *      Trái tim, Búp măng non, Hoa sen) kèm vùng đệm an toàn 2 ô quanh chữ.
 *   2. Sửa nhanh tên màu & mã màu bút dạ trực tiếp bằng 1 cú nhấp chuột ngay
 *      trên giao diện Bộ Sưu Tập, đồng bộ tức thì sang toàn bộ phiếu in.
 * ==============================================================================
 */

(function () {
  'use strict';

  const DECOR_MOTIF_OPTIONS = [
    { value: 'auto', label: '✨ Tự động theo chủ đề (Khuyên dùng)' },
    { value: 'stars', label: '⭐ Ngôi sao & Nhành nguyệt quế (26/3, Mừng Đảng)' },
    { value: 'lotus', label: '🪷 Hoa sen & Nhành lá tri ân (20/11, 8/3, 20/10)' },
    { value: 'hearts', label: '💖 Trái tim & Tia nắng ấm áp (Trường học hạnh phúc)' },
    { value: 'bamboo', label: '🎋 Búp măng non & Sao vàng (Đội TNTP, Thiếu nhi)' },
    { value: 'none', label: '🚫 Không chèn (Chỉ phóng to chữ thông điệp)' }
  ];

  // Gợi ý tên màu bút dạ thực tế phổ biến trong hộp màu học sinh Việt Nam (Tuyệt đối không dùng màu tím)
  const COMMON_MARKER_NAMES = [
    'Đỏ tươi', 'Đỏ cờ', 'Đỏ son', 'Đỏ hồng',
    'Cam đậm', 'Vàng cam', 'Vàng chanh', 'Vàng kim',
    'Xanh lá đậm', 'Xanh lá nhạt', 'Xanh lục', 'Xanh ngọc',
    'Xanh da trời', 'Xanh biển', 'Xanh dương', 'Xanh dương đậm',
    'Hồng phấn', 'Hồng sen', 'Nâu đất', 'Đen'
  ];

  const MOTIF_META = {
    stars: {
      primary: { color: '#ca8a04', name: 'Vàng kim', part: 'Ngôi Sao Vinh Quang' },
      secondary: { color: '#16a34a', name: 'Xanh lục', part: 'Nhành Nguyệt Quế' }
    },
    lotus: {
      primary: { color: '#db2777', name: 'Hồng sen', part: 'Hoa Sen Thanh Khiết' },
      secondary: { color: '#16a34a', name: 'Xanh lục', part: 'Đài Lá Sen Xanh' }
    },
    hearts: {
      primary: { color: '#e11d48', name: 'Đỏ hồng', part: 'Trái Tim Yêu Thương' },
      secondary: { color: '#d97706', name: 'Vàng cam', part: 'Tia Nắng Hạnh Phúc' }
    },
    bamboo: {
      primary: { color: '#16a34a', name: 'Xanh lục', part: 'Búp Măng Non Đội Viên' },
      secondary: { color: '#ca8a04', name: 'Vàng kim', part: 'Ngôi Sao Khăn Quàng' }
    }
  };

  function resolveMotifByTheme(rawText, requestedMotif) {
    if (requestedMotif && requestedMotif !== 'auto') {
      return requestedMotif;
    }
    const upper = String(rawText || '').toUpperCase();
    if (/8\/3|8-3|20\/10|20-10|PHỤ NỮ|THẦY CÔ|TRI ÂN|MẸ|CÔ GIÁO|SEN/.test(upper)) {
      return 'lotus';
    }
    if (/HẠNH PHÚC|YÊU THƯƠNG|THẤU CẢM|BẠO LỰC|TÌNH BẠN|CHIA SẺ|AN TOÀN/.test(upper)) {
      return 'hearts';
    }
    if (/MĂNG NON|ĐỘI VIÊN|THIẾU NHI|1\/6|TRẢI NGHIỆM|TRẠI HÈ|KHĂN QUÀNG|CHÁU NGOAN/.test(upper)) {
      return 'bamboo';
    }
    return 'stars';
  }

  // Bản mẫu Pixel-Art sắc nét 100% 4-connected cho dải biểu tượng chân trang & hai bên cánh (chuẩn như tranh 20/11)
  const PIXEL_MOTIF_CENTER = {
    hearts: [
      '.1111..1111.',
      '111111111111',
      '111111111111',
      '.1111111111.',
      '..11111111..',
      '...111111...',
      '....1111....'
    ],
    stars: [
      '.....11.....',
      '....1111....',
      '111111111111',
      '.1111111111.',
      '..11111111..',
      '..11111111..',
      '.111....111.'
    ],
    lotus: [
      '.....11.....',
      '..11111111..',
      '.1111111111.',
      '111111111111',
      '.1111111111.',
      '..22222222..',
      '.2222222222.'
    ],
    bamboo: [
      '.....11.....',
      '....1111....',
      '...111111...',
      '....1111....',
      '..11111111..',
      '...111111...',
      '.1111111111.'
    ]
  };

  const PIXEL_MOTIF_SIDE = {
    hearts: [
      '.11..11.',
      '11111111',
      '11111111',
      '.111111.',
      '..1111..',
      '...11...'
    ],
    stars: [
      '...11...',
      '..1111..',
      '11111111',
      '.111111.',
      '..1111..',
      '.11..11.'
    ],
    lotus: [
      '...11...',
      '.111111.',
      '11111111',
      '.111111.',
      '..2222..'
    ],
    bamboo: [
      '...22...',
      '..2222..',
      '22222222',
      '.222222.',
      '..2222..',
      '.22..22.'
    ]
  };

  // Đóng dấu họa tiết Pixel-Art trực tiếp lên lưới (rows x cols) với vành đai cách ly bảo vệ chữ Tiếng Việt
  function applyMotifToMask(inkMask, peakScore, rows, cols, rawText, requestedMotif) {
    const motifKey = resolveMotifByTheme(rawText, requestedMotif);
    if (!motifKey || motifKey === 'none' || !MOTIF_META[motifKey]) {
      return null;
    }

    // Tạo vùng đệm an toàn 2 ô (Safety Halo) bao quanh toàn bộ chữ Tiếng Việt đã có
    const textHalo = Array.from({ length: rows }, () => Array(cols).fill(false));
    let maxTextRow = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!inkMask[r][c]) continue;
        if (r > maxTextRow) maxTextRow = r;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              textHalo[nr][nc] = true;
            }
          }
        }
      }
    }

    const motifRoleGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let countPrimary = 0;
    let countSecondary = 0;

    const stampCell = (r, c, role) => {
      if (r < 1 || r >= rows - 1 || c < 1 || c >= cols - 1) return;
      if (textHalo[r][c] || inkMask[r][c]) return;
      inkMask[r][c] = true;
      peakScore[r][c] = 255;
      motifRoleGrid[r][c] = role;
      if (role === 1) countPrimary++;
      else if (role === 2) countSecondary++;
    };

    const stampPattern = (r0, c0, pat, defaultRole) => {
      if (!pat || !pat.length) return;
      const h = pat.length;
      const w = pat[0].length;
      // Kiểm tra toàn bộ vùng đóng dấu không vi phạm textHalo để không bao giờ cắt cụt biểu tượng
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (pat[dr][dc] === '.') continue;
          const r = r0 + dr, c = c0 + dc;
          if (r < 1 || r >= rows - 1 || c < 1 || c >= cols - 1 || textHalo[r][c]) {
            return;
          }
        }
      }
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          const ch = pat[dr][dc];
          if (ch === '.') continue;
          const role = ch === '2' ? 2 : (ch === '1' ? 1 : defaultRole);
          stampCell(r0 + dr, c0 + dc, role);
        }
      }
    };

    const midC = Math.floor(cols / 2);
    const centerPat = PIXEL_MOTIF_CENTER[motifKey] || PIXEL_MOTIF_CENTER.stars;
    const sidePat = PIXEL_MOTIF_SIDE[motifKey] || PIXEL_MOTIF_SIDE.stars;

    // Nếu phía dưới bức tranh còn dải trống >= 9 hàng (bố cục 1 hoặc 2 dòng chữ chuẩn):
    // Vẽ dải biểu tượng trung tâm + đôi cánh nguyệt quế/tia nắng cân xứng y hệt tranh mẫu 20/11
    if (rows - 1 - maxTextRow >= 9) {
      const bandTop = rows - 9;
      const centerW = centerPat[0].length;
      const centerLeft = midC - Math.floor(centerW / 2);
      stampPattern(bandTop, centerLeft, centerPat, 1);

      // Vẽ hai nhành nguyệt quế / tia nắng (role = 2) trải rộng hai bên biểu tượng trung tâm
      const wingInnerOffset = Math.floor(centerW / 2) + 3;
      const wingOuterMargin = 8;
      const wingRowRibbon = bandTop + 5;
      for (let c = wingOuterMargin; c <= midC - wingInnerOffset; c++) {
        stampCell(wingRowRibbon, c, 2);
        stampCell(wingRowRibbon + 1, c, 2);
      }
      for (let c = midC + wingInnerOffset; c < cols - wingOuterMargin; c++) {
        stampCell(wingRowRibbon, c, 2);
        stampCell(wingRowRibbon + 1, c, 2);
      }

      // Các phiến lá nguyệt quế / tia sáng gắn liền khối (4-connected) phía trên dải ruy-băng
      for (let step = 0; step < 3; step++) {
        const lc = wingOuterMargin + 2 + step * 6;
        if (lc + 3 <= midC - wingInnerOffset) {
          stampCell(wingRowRibbon - 2, lc + 1, 2);
          stampCell(wingRowRibbon - 2, lc + 2, 2);
          stampCell(wingRowRibbon - 1, lc, 2);
          stampCell(wingRowRibbon - 1, lc + 1, 2);
          stampCell(wingRowRibbon - 1, lc + 2, 2);
          stampCell(wingRowRibbon - 1, lc + 3, 2);
        }
        const rc = cols - 1 - wingOuterMargin - 2 - step * 6;
        if (rc - 3 >= midC + wingInnerOffset) {
          stampCell(wingRowRibbon - 2, rc - 1, 2);
          stampCell(wingRowRibbon - 2, rc - 2, 2);
          stampCell(wingRowRibbon - 1, rc, 2);
          stampCell(wingRowRibbon - 1, rc - 1, 2);
          stampCell(wingRowRibbon - 1, rc - 2, 2);
          stampCell(wingRowRibbon - 1, rc - 3, 2);
        }
      }
    } else {
      // Nếu thông điệp dài 3 dòng: đóng dấu biểu tượng nhỏ gọn vào hai bên sườn dòng ngắn hơn
      const sideW = sidePat[0].length;
      const topR = 3;
      const botR = Math.max(3, rows - sidePat.length - 3);
      stampPattern(topR, 2, sidePat, 1);
      stampPattern(topR, cols - sideW - 2, sidePat, 1);
      stampPattern(botR, 2, sidePat, 2);
      stampPattern(botR, cols - sideW - 2, sidePat, 2);
    }

    return {
      motifKey,
      motifRoleGrid,
      countPrimary,
      countSecondary,
      meta: MOTIF_META[motifKey]
    };
  }

  // ============================================================================
  // BỘ SỬA NHANH TÊN MÀU & MÃ MÀU BÚT DẠ (1 CÚ NHẤP CHUỘT TRONG BỘ SƯU TẬP)
  // ============================================================================
  function escapeAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function ensureMarkerDatalist() {
    if (document.getElementById('gmmMarkerSuggestionsList')) return;
    const dl = document.createElement('datalist');
    dl.id = 'gmmMarkerSuggestionsList';
    dl.innerHTML = COMMON_MARKER_NAMES.map(n => `<option value="${escapeAttr(n)}"></option>`).join('');
    document.body.appendChild(dl);
  }

  function renderInlineColorEditor(containerId, puzzleObj, onRuleChanged, onToggleLock) {
    const container = document.getElementById(containerId);
    if (!container || !puzzleObj || !puzzleObj.colorRules) return;
    ensureMarkerDatalist();

    const rules = puzzleObj.colorRules;
    const entries = Object.keys(rules)
      .map(codeKey => ({ codeKey, rule: rules[codeKey] }))
      .sort((a, b) => ((a.rule && a.rule.qNum) || 0) - ((b.rule && b.rule.qNum) || 0));

    container.innerHTML = entries.map(({ codeKey, rule }) => {
      const qNum = rule.qNum || '';
      const colorHex = rule.color || '#dc2626';
      const colorName = rule.name || 'Màu bút dạ';
      const partLabel = rule.part ? ` (${rule.part})` : '';
      const isLocked = Boolean(rule.locked);
      return `
        <div class="gmm-marker-chip ${isLocked ? 'is-locked-chip' : ''}" data-code="${escapeAttr(codeKey)}" data-qnum="${escapeAttr(qNum)}" style="${isLocked ? 'border-color: rgba(250, 204, 21, 0.72) !important; background: rgba(234, 179, 8, 0.14) !important;' : ''}" title="Câu ${qNum}${escapeAttr(partLabel)} • Bấm ô vuông để đổi sắc độ màu • Bấm vào tên màu để gõ tên bút dạ • Bấm ổ khóa 🔒 để giữ cố định màu này khi đổi bảng màu tự động">
          <input type="color"
                 class="gmm-marker-color-input"
                 value="${escapeAttr(colorHex)}"
                 data-code="${escapeAttr(codeKey)}"
                 aria-label="Chọn màu cho Câu ${qNum}" />
          <span class="gmm-marker-q-tag">C${qNum}</span>
          <input type="text"
                 class="gmm-marker-name-input"
                 list="gmmMarkerSuggestionsList"
                 value="${escapeAttr(colorName)}"
                 data-code="${escapeAttr(codeKey)}"
                 placeholder="Tên màu bút..."
                 aria-label="Tên màu bút dạ Câu ${qNum}" />
          <button type="button"
                  class="gmm-marker-lock-btn ${isLocked ? 'locked' : ''}"
                  data-code="${escapeAttr(codeKey)}"
                  style="background: ${isLocked ? 'rgba(250, 204, 21, 0.25)' : 'rgba(255, 255, 255, 0.06)'}; border: 1px solid ${isLocked ? '#facc15' : 'rgba(255, 255, 255, 0.15)'}; border-radius: 5px; padding: 1px 5px; font-size: 0.72rem; cursor: pointer; line-height: 1.2; flex-shrink: 0; color: ${isLocked ? '#fde047' : '#94a3b8'};"
                  title="${isLocked ? '🔒 Đang KHÓA màu C' + qNum + ' (Không bị thay đổi khi bấm Đổi 10 màu hoặc Tạo lại tranh) — Bấm để mở khóa' : '🔓 Bấm để KHÓA cố định màu C' + qNum + ' khi đổi bảng màu tự động'}">
            ${isLocked ? '🔒' : '🔓'}
          </button>
        </div>
      `;
    }).join('');

    // Gắn sự kiện đổi sắc độ màu và đổi tên màu tức thì
    container.querySelectorAll('.gmm-marker-color-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const code = e.target.getAttribute('data-code');
        const newHex = e.target.value;
        if (code && newHex && typeof onRuleChanged === 'function') {
          onRuleChanged(code, null, newHex);
        }
      });
    });

    container.querySelectorAll('.gmm-marker-name-input').forEach(inp => {
      inp.addEventListener('focus', (e) => e.target.select());
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
      inp.addEventListener('change', (e) => {
        const code = e.target.getAttribute('data-code');
        const newName = String(e.target.value || '').trim();
        if (code && newName && typeof onRuleChanged === 'function') {
          onRuleChanged(code, newName, null);
        }
      });
    });

    container.querySelectorAll('.gmm-marker-lock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = e.currentTarget.getAttribute('data-code');
        if (code && typeof onToggleLock === 'function') {
          onToggleLock(code);
        }
      });
    });
  }

  window.GiaiMaPuzzleDecorators = {
    DECOR_MOTIF_OPTIONS,
    COMMON_MARKER_NAMES,
    resolveMotifByTheme,
    applyMotifToMask,
    renderInlineColorEditor
  };
})();
