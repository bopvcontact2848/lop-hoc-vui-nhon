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

  // Vẽ hình ngôi sao 5 cánh dày dặn để không bị đứt cánh khi quy đổi sang lưới đa giác
  function drawStar(ctx, cx, cy, outerR, innerR, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = (i % 2 === 0) ? outerR : innerR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeart(ctx, cx, cy, size, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    const r = size * 0.29;
    ctx.beginPath();
    ctx.arc(cx - r * 0.88, cy - r * 0.35, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.88, cy - r * 0.35, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - size * 0.54, cy - r * 0.08);
    ctx.lineTo(cx + size * 0.54, cy - r * 0.08);
    ctx.lineTo(cx, cy + size * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSparkleDiamond(ctx, cx, cy, rx, ry, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.quadraticCurveTo(cx + rx * 0.28, cy - ry * 0.28, cx + rx, cy);
    ctx.quadraticCurveTo(cx + rx * 0.28, cy + ry * 0.28, cx, cy + ry);
    ctx.quadraticCurveTo(cx - rx * 0.28, cy + ry * 0.28, cx - rx, cy);
    ctx.quadraticCurveTo(cx - rx * 0.28, cy - ry * 0.28, cx, cy - ry);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLaurelBranch(ctx, cx, cy, dir, fillStyle) {
    // dir = 1 (góc trái hướng vào giữa) hoặc -1 (góc phải hướng vào giữa)
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = fillStyle;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - dir * 32, cy - 22);
    ctx.quadraticCurveTo(cx - dir * 8, cy + 16, cx + dir * 48, cy + 20);
    ctx.stroke();

    const leaves = [
      { ox: -dir * 26, oy: -22, rot: dir * 0.5 },
      { ox: -dir * 6, oy: -4, rot: dir * 0.2 },
      { ox: dir * 18, oy: 10, rot: -dir * 0.15 },
      { ox: dir * 42, oy: 18, rot: -dir * 0.35 }
    ];
    leaves.forEach(lf => {
      ctx.save();
      ctx.translate(cx + lf.ox, cy + lf.oy);
      ctx.rotate(lf.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawBambooShoot(ctx, cx, baseY, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    // Thân măng non 3 tầng vươn cao vững chãi
    const tiers = [
      { topY: baseY - 76, botY: baseY - 40, topW: 4, botW: 34 },
      { topY: baseY - 46, botY: baseY - 16, topW: 22, botW: 46 },
      { topY: baseY - 22, botY: baseY + 6, topW: 32, botW: 56 }
    ];
    tiers.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(cx - t.topW / 2, t.topY);
      ctx.lineTo(cx + t.topW / 2, t.topY);
      ctx.lineTo(cx + t.botW / 2, t.botY);
      ctx.lineTo(cx - t.botW / 2, t.botY);
      ctx.closePath();
      ctx.fill();
    });

    // Hai phiến lá tre non ôm 2 bên gốc măng
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(cx + side * 30, baseY - 12);
      ctx.rotate(side * 0.65);
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawLotusFlower(ctx, cx, cy, petalColor, leafColor) {
    // Đài lá sen xanh nâng phía dưới
    ctx.save();
    ctx.fillStyle = leafColor;
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(cx + side * 26, cy + 20);
      ctx.rotate(side * 0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // 5 cánh hoa sen bung nở cân xứng
    ctx.save();
    ctx.fillStyle = petalColor;
    const petals = [
      { dx: -28, dy: 4, rot: -0.78, rx: 12, ry: 24 },
      { dx: 28, dy: 4, rot: 0.78, rx: 12, ry: 24 },
      { dx: -15, dy: -6, rot: -0.38, rx: 13, ry: 28 },
      { dx: 15, dy: -6, rot: 0.38, rx: 13, ry: 28 },
      { dx: 0, dy: -11, rot: 0, rx: 14.5, ry: 32 }
    ];
    petals.forEach(p => {
      ctx.save();
      ctx.translate(cx + p.dx, cy + p.dy);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // Đóng dấu họa tiết lên lưới (rows x cols) với vành đai cách ly 2 ô bảo vệ dấu Tiếng Việt
  function applyMotifToMask(inkMask, peakScore, rows, cols, rawText, requestedMotif) {
    const motifKey = resolveMotifByTheme(rawText, requestedMotif);
    if (!motifKey || motifKey === 'none' || !MOTIF_META[motifKey]) {
      return null;
    }

    const SCALE = 10;
    const hiW = cols * SCALE;
    const hiH = rows * SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = hiW;
    canvas.height = hiH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, hiW, hiH);

    // Kênh Đỏ (#ff0000) = Nhóm họa tiết chính (1); Kênh Xanh lá (#00ff00) = Nhóm họa tiết phụ (2)
    const PRI = '#ff0000';
    const SEC = '#00ff00';

    if (motifKey === 'stars') {
      drawStar(ctx, 56, 54, 40, 18.5, PRI);
      drawStar(ctx, hiW - 56, 54, 40, 18.5, PRI);
      drawLaurelBranch(ctx, 58, hiH - 46, 1, SEC);
      drawLaurelBranch(ctx, hiW - 58, hiH - 46, -1, SEC);
    } else if (motifKey === 'lotus') {
      drawLotusFlower(ctx, 64, hiH - 52, PRI, SEC);
      drawLotusFlower(ctx, hiW - 64, hiH - 52, PRI, SEC);
      drawSparkleDiamond(ctx, 52, 48, 30, 30, PRI);
      drawSparkleDiamond(ctx, hiW - 52, 48, 30, 30, PRI);
    } else if (motifKey === 'hearts') {
      drawHeart(ctx, 58, 54, 68, PRI);
      drawHeart(ctx, hiW - 58, 54, 68, PRI);
      drawSparkleDiamond(ctx, 56, hiH - 48, 32, 32, SEC);
      drawSparkleDiamond(ctx, hiW - 56, hiH - 48, 32, 32, SEC);
    } else if (motifKey === 'bamboo') {
      drawBambooShoot(ctx, 56, hiH - 22, PRI);
      drawBambooShoot(ctx, hiW - 56, hiH - 22, PRI);
      drawStar(ctx, 54, 52, 36, 17, SEC);
      drawStar(ctx, hiW - 54, 52, 36, 17, SEC);
    }

    // Tạo vùng đệm an toàn 2 ô (Safety Halo) bao quanh toàn bộ chữ Tiếng Việt đã có
    const textHalo = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!inkMask[r][c]) continue;
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

    const raw = ctx.getImageData(0, 0, hiW, hiH).data;
    const motifRoleGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let countPrimary = 0;
    let countSecondary = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (textHalo[r][c]) continue;
        let sumR = 0, sumG = 0;
        for (let dy = 0; dy < SCALE; dy++) {
          const py = r * SCALE + dy;
          for (let dx = 0; dx < SCALE; dx++) {
            const px = c * SCALE + dx;
            const idx = (py * hiW + px) * 4;
            sumR += raw[idx];
            sumG += raw[idx + 1];
          }
        }
        const meanR = sumR / (SCALE * SCALE);
        const meanG = sumG / (SCALE * SCALE);
        if (meanR >= 82 || meanG >= 82) {
          inkMask[r][c] = true;
          peakScore[r][c] = Math.max(meanR, meanG);
          if (meanR >= meanG) {
            motifRoleGrid[r][c] = 1;
            countPrimary++;
          } else {
            motifRoleGrid[r][c] = 2;
            countSecondary++;
          }
        }
      }
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

  function renderInlineColorEditor(containerId, puzzleObj, onRuleChanged) {
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
      return `
        <div class="gmm-marker-chip" title="Bấm ô vuông để đổi sắc độ màu • Bấm vào tên màu để gõ tên bút dạ thực tế của lớp">
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
  }

  window.GiaiMaPuzzleDecorators = {
    DECOR_MOTIF_OPTIONS,
    COMMON_MARKER_NAMES,
    resolveMotifByTheme,
    applyMotifToMask,
    renderInlineColorEditor
  };
})();
