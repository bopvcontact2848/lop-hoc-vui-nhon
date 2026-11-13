/**
 * ==============================================================================
 * MODULE TẠO MA TRẬN TỰ ĐỘNG & QUẢN LÝ BỘ SƯU TẬP TRANH BÍ ẨN
 * File: scripts/giaiMaPuzzleGenerator.js
 * 
 * Tính năng:
 *   1. Custom Matrix Generator: Phân tích thông điệp tiếng Việt bất kỳ thành ma trận đa giác
 *   2. Tự động chia các mảng mục tiêu cho 5 - 12 câu hỏi và rải mã gây nhiễu
 *   3. Bộ sưu tập Preset (20/11, 8/3, 26/3, Mừng Đảng...) & Lưu trữ LocalStorage
 *   4. Xuất file vector chất lượng cao:
 *      - SVG Vector gốc (độ nét vô cực cho tiệm in phóng bạt A1, A0)
 *      - PDF Vector chuẩn in ấn (bản học sinh A3/A4 hoặc bản bạt sân khấu A1/A0)
 * ==============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY_PRESETS = 'gmm_saved_puzzle_presets_v1';

  // 1. DANH SÁCH BỘ TRANH MẪU CÓ SẴN (DEFAULT PRESETS)
  const DEFAULT_PRESETS = [
    {
      id: 'preset_trian_2011',
      title: 'TRI ÂN THẦY CÔ 20/11',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'auto',
      description: 'Chủ đề Ngày Nhà giáo Việt Nam 20/11 • Đa giác nghệ thuật'
    },
    {
      id: 'preset_truong_hoc_hanh_phuc',
      title: 'TRƯỜNG HỌC HẠNH PHÚC',
      questionCount: 10,
      meshStyle: 'pixel',
      decorMotif: 'hearts',
      description: 'Chủ đề Môi trường học đường hạnh phúc • Trái tim & Tia nắng'
    },
    {
      id: 'preset_noi_khong_bao_luc',
      title: 'NÓI KHÔNG VỚI BẠO LỰC',
      questionCount: 10,
      meshStyle: 'hexagon',
      decorMotif: 'hearts',
      description: 'Chủ đề Phòng chống bạo lực học đường • Lưới tổ ong Lục giác'
    },
    {
      id: 'preset_mung_dang',
      title: 'MỪNG ĐẢNG QUANG VINH',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'stars',
      description: 'Chủ đề Mừng Đảng Mừng Xuân • Ngôi sao & Nhành nguyệt quế'
    },
    {
      id: 'preset_chuc_mung_8_3',
      title: 'CHÚC MỪNG NGÀY 8/3',
      questionCount: 10,
      meshStyle: 'hexagon',
      decorMotif: 'lotus',
      description: 'Chủ đề Ngày Quốc tế Phụ nữ 8/3 • Hoa sen & Nhành lá tri ân'
    },
    {
      id: 'preset_tien_buoc_26_3',
      title: 'TIẾN BƯỚC LÊN ĐOÀN',
      questionCount: 10,
      meshStyle: 'pixel',
      decorMotif: 'stars',
      description: 'Chủ đề Ngày thành lập Đoàn TNCS Hồ Chí Minh 26/3 • Ngôi sao vinh quang'
    },
    {
      id: 'preset_trai_nghiem',
      title: 'HOẠT ĐỘNG TRẢI NGHIỆM',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'bamboo',
      description: 'Chủ đề Sinh hoạt Đội & Ngoại khóa • Búp măng non & Sao vàng'
    }
  ];

  // Bảng phối màu chuẩn cho các câu hỏi (Tương phản cao, rực rỡ khi in ấn & chiếu máy chiếu)
  const THEME_PALETTES = [
    { color: '#dc2626', name: 'Đỏ son' },
    { color: '#ea580c', name: 'Cam đậm' },
    { color: '#d97706', name: 'Vàng cam' },
    { color: '#ca8a04', name: 'Vàng kim' },
    { color: '#16a34a', name: 'Xanh lục' },
    { color: '#059669', name: 'Xanh ngọc' },
    { color: '#0d9488', name: 'Xanh cổ vịt' },
    { color: '#0284c7', name: 'Xanh biển' },
    { color: '#2563eb', name: 'Xanh dương' },
    { color: '#db2777', name: 'Hồng sen' },
    { color: '#e11d48', name: 'Đỏ hồng' },
    { color: '#be123c', name: 'Đỏ nhung' }
  ];

  // Chia dòng thông minh cân bằng độ dài cho thông điệp Tiếng Việt có dấu
  function splitBalancedVietnameseLines(text) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1 || text.length <= 10) return [words.join(' ')];

    if (words.length <= 4 && text.length <= 24) {
      let bestK = 1;
      let bestDiff = 999;
      for (let k = 1; k < words.length; k++) {
        const l1 = words.slice(0, k).join(' ');
        const l2 = words.slice(k).join(' ');
        const diff = Math.abs(l1.length - l2.length);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestK = k;
        }
      }
      return [words.slice(0, bestK).join(' '), words.slice(bestK).join(' ')];
    }

    let bestPair = [Math.ceil(words.length / 3), Math.ceil((words.length * 2) / 3)];
    let bestSpread = 999;
    for (let i = 1; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const len1 = words.slice(0, i).join(' ').length;
        const len2 = words.slice(i, j).join(' ').length;
        const len3 = words.slice(j).join(' ').length;
        const spread = Math.max(len1, len2, len3) - Math.min(len1, len2, len3);
        if (spread < bestSpread) {
          bestSpread = spread;
          bestPair = [i, j];
        }
      }
    }
    return [
      words.slice(0, bestPair[0]).join(' '),
      words.slice(bestPair[0], bestPair[1]).join(' '),
      words.slice(bestPair[1]).join(' ')
    ];
  }

  // Vẽ thông điệp Tiếng Việt lên Canvas độ phân giải siêu cao (10x Supersampling) để giữ trọn 100% dấu mũ, dấu móc, dấu thanh
  function renderSupersampledVietnameseCanvas(lines, hiW, hiH, hasDecor = false) {
    const padH = 90;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = hiW;
    tmpCanvas.height = hiH + padH * 2;
    const tCtx = tmpCanvas.getContext('2d');
    if (!tCtx) return null;

    tCtx.fillStyle = '#000000';
    tCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

    const fontFamily = '"Segoe UI", "Arial Black", Roboto, Helvetica, Arial, sans-serif';
    let fontSize = lines.length === 1 ? 132 : (lines.length === 2 ? 92 : 64);
    tCtx.font = `900 ${fontSize}px ${fontFamily}`;

    const maxAllowedW = hiW * (hasDecor ? 0.74 : 0.89);
    let widest = 0;
    lines.forEach(line => {
      const m = tCtx.measureText(line).width;
      if (m > widest) widest = m;
    });
    if (widest > maxAllowedW && widest > 0) {
      fontSize = Math.max(28, Math.floor(fontSize * (maxAllowedW / widest)));
      tCtx.font = `900 ${fontSize}px ${fontFamily}`;
    }

    // Khoảng cách dòng rộng rãi cho chữ Tiếng Việt có dấu chồng (Ầ, Ể, Ộ, Ữ, Ặ...)
    const linePitch = Math.round(fontSize * 1.42);
    const totalBlockH = linePitch * (lines.length - 1);
    const startY = Math.round(tmpCanvas.height / 2 - totalBlockH / 2 + fontSize * 0.34);

    tCtx.fillStyle = '#ffffff';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'alphabetic';
    lines.forEach((line, idx) => {
      tCtx.fillText(line, hiW / 2, startY + idx * linePitch);
    });

    // Đo hộp bao mực thực tế (Ink Bounding Box) để căn giữa dọc tuyệt đối và không bao giờ cắt mất dấu Tiếng Việt
    const raw = tCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
    let minY = tmpCanvas.height, maxY = 0;
    for (let y = 0; y < tmpCanvas.height; y++) {
      for (let x = 0; x < hiW; x++) {
        if (raw[(y * hiW + x) * 4] > 45) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = hiW;
    outCanvas.height = hiH;
    const oCtx = outCanvas.getContext('2d');
    if (!oCtx) return null;
    oCtx.fillStyle = '#000000';
    oCtx.fillRect(0, 0, hiW, hiH);

    if (maxY > minY) {
      const inkH = maxY - minY + 1;
      const targetMaxH = Math.round(hiH * (hasDecor ? 0.78 : 0.85));
      const scaleY = inkH > targetMaxH ? (targetMaxH / inkH) : 1;
      const destH = Math.round(inkH * scaleY);
      const destW = Math.round(hiW * scaleY);
      const destX = Math.round((hiW - destW) / 2);
      const destY = Math.round((hiH - destH) / 2);
      oCtx.drawImage(tmpCanvas, 0, minY, hiW, inkH, destX, destY, destW, destH);
    }
    return oCtx.getImageData(0, 0, hiW, hiH).data;
  }

  // Lần đường biên đa giác trực giao khép kín không lỗ thủng (Simple Jordan Orthogonal Loop)
  function traceOrthogonalLoop(cells, cellW, cellH) {
    const keyOf = (r, c) => `${r},${c}`;
    const cellSet = new Set(cells.map(([r, c]) => keyOf(r, c)));
    const edgeMap = new Map();
    const addEdge = (x1, y1, x2, y2) => {
      const k = `${x1},${y1}`;
      if (!edgeMap.has(k)) edgeMap.set(k, []);
      edgeMap.get(k).push([x2, y2]);
    };

    for (const [r, c] of cells) {
      if (!cellSet.has(keyOf(r - 1, c))) addEdge(c, r, c + 1, r);
      if (!cellSet.has(keyOf(r, c + 1))) addEdge(c + 1, r, c + 1, r + 1);
      if (!cellSet.has(keyOf(r + 1, c))) addEdge(c + 1, r + 1, c, r + 1);
      if (!cellSet.has(keyOf(r, c - 1))) addEdge(c, r + 1, c, r);
    }

    let totalEdges = 0;
    for (const outs of edgeMap.values()) {
      if (outs.length !== 1) return null;
      totalEdges += outs.length;
    }
    if (totalEdges === 0) return null;

    const firstKey = edgeMap.keys().next().value;
    const [sx, sy] = firstKey.split(',').map(Number);
    const loop = [[sx, sy]];
    let cx = sx, cy = sy, steps = 0;
    while (steps <= totalEdges) {
      const outs = edgeMap.get(`${cx},${cy}`);
      if (!outs || outs.length !== 1) return null;
      const [nx, ny] = outs[0];
      steps++;
      if (nx === sx && ny === sy) break;
      loop.push([nx, ny]);
      cx = nx;
      cy = ny;
    }
    if (steps !== totalEdges) return null;

    const simplified = [];
    const L = loop.length;
    for (let i = 0; i < L; i++) {
      const prev = loop[(i - 1 + L) % L], curr = loop[i], next = loop[(i + 1) % L];
      if (!(prev[0] === curr[0] && curr[0] === next[0]) && !(prev[1] === curr[1] && curr[1] === next[1])) {
        simplified.push(curr);
      }
    }

    let twiceArea = 0;
    for (let i = 0; i < simplified.length; i++) {
      const [x1, y1] = simplified[i], [x2, y2] = simplified[(i + 1) % simplified.length];
      twiceArea += (x1 * y2 - x2 * y1);
    }
    if (Math.abs(Math.abs(twiceArea) / 2 - cells.length) > 1e-5) return null;

    const fmt = v => Number(v.toFixed(1));
    const parts = simplified.map(([gx, gy], idx) => `${idx === 0 ? 'M' : 'L'} ${fmt(gx * cellW)} ${fmt(gy * cellH)}`);
    parts.push('Z');
    return parts.join(' ');
  }

  // Tìm tâm hình chữ nhật nội tiếp lớn nhất để đặt mã câu hỏi luôn gọn bên trong mảnh ghép
  function findInscribedLabelCenter(cells, cellW, cellH, code) {
    const keyOf = (r, c) => `${r},${c}`;
    const cellSet = new Set(cells.map(([r, c]) => keyOf(r, c)));
    let sumR = 0, sumC = 0, minR = 999, maxR = -1, minC = 999, maxC = -1;
    for (const [r, c] of cells) {
      sumR += r + 0.5;
      sumC += c + 0.5;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    const centR = sumR / cells.length, centC = sumC / cells.length;
    let best = { rw: cellW, rh: cellH, rcR: cells[0][0] + 0.5, rcC: cells[0][1] + 0.5 };
    let bestScore = -1e9;

    for (let r1 = minR; r1 <= maxR; r1++) {
      for (let c1 = minC; c1 <= maxC; c1++) {
        if (!cellSet.has(keyOf(r1, c1))) continue;
        for (let r2 = r1; r2 <= maxR; r2++) {
          for (let c2 = c1; c2 <= maxC; c2++) {
            let ok = true;
            for (let rr = r1; rr <= r2 && ok; rr++) {
              for (let cc = c1; cc <= c2; cc++) {
                if (!cellSet.has(keyOf(rr, cc))) { ok = false; break; }
              }
            }
            if (!ok) continue;
            const rw = (c2 - c1 + 1) * cellW;
            const rh = (r2 - r1 + 1) * cellH;
            const rcR = (r1 + r2 + 1) / 2;
            const rcC = (c1 + c2 + 1) / 2;
            const score = (rw >= 24 ? 100 : 0) + Math.min(rw, 40) * 2.8 + Math.min(rh, 26) * 1.8 - Math.hypot(rcR - centR, rcC - centC) * 2.4;
            if (score > bestScore) {
              bestScore = score;
              best = { rw, rh, rcR, rcC };
            }
          }
        }
      }
    }

    const isThree = code.length >= 3;
    const fontSize = best.rw < 22 ? (isThree ? 6.5 : 7.0) : (best.rw < 34 ? (isThree ? 7.5 : 8.0) : (isThree ? 8.0 : 8.5));
    return {
      labelPos: [Number((best.rcC * cellW).toFixed(1)), Number((best.rcR * cellH).toFixed(1))],
      fontSize
    };
  }

  // 2. THUẬT TOÁN PHÂN TÍCH CHỮ TIẾNG VIỆT ĐỘ PHÂN GIẢI CAO (56x36 SUPERSAMPLED VECTOR MESH)
  function generateMatrixFromText(rawText, questionCount = 10, customOptions = {}) {
    const text = (rawText || 'TRI ÂN THẦY CÔ 20/11').trim().toUpperCase();
    const qCount = Math.max(5, Math.min(12, questionCount));
    const meshStyle = (customOptions && customOptions.meshStyle) ? customOptions.meshStyle : 'polygon';
    const decorMotif = (customOptions && customOptions.decorMotif) ? customOptions.decorMotif : 'auto';

    // Nếu là chủ đề mặc định 20/11 (hoặc 20-11) dạng đa giác 10 câu hỏi và để họa tiết Auto -> ưu tiên ma trận thiết kế thủ công siêu nét
    if (meshStyle === 'polygon' && qCount === 10 && decorMotif === 'auto' && window.GiaiMaPuzzle &&
        (text === 'TRI ÂN THẦY CÔ 20/11' || text === 'TRI ÂN THẦY CÔ 20-11')) {
      const useDash = (text === 'TRI ÂN THẦY CÔ 20-11') ||
        (text === 'TRI ÂN THẦY CÔ 20/11' && typeof window.GiaiMaPuzzle.getDateSeparatorStyle === 'function' && window.GiaiMaPuzzle.getDateSeparatorStyle() === 'dash' && !rawText);
      const chosenCells = useDash && window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        ? window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        : (window.GiaiMaPuzzle.PUZZLE_CELLS_SLASH || window.GiaiMaPuzzle.PUZZLE_CELLS);
      return {
        id: 'preset_trian_2011',
        title: useDash ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11',
        questionCount: 10,
        meshStyle: 'polygon',
        decorMotif: 'auto',
        cells: chosenCells,
        colorRules: window.GiaiMaPuzzle.COLOR_RULES,
        targetCellIds: chosenCells.filter(c => c.isTarget).map(c => c.id)
      };
    }

    const width = 800;
    const height = 520;
    const cols = customOptions.cols || (meshStyle === 'pixel' ? 48 : 56);
    const rows = customOptions.rows || (meshStyle === 'pixel' ? 30 : 36);
    const cellW = width / cols;
    const cellH = height / rows;

    const SCALE = 10;
    const hiW = cols * SCALE;
    const hiH = rows * SCALE;
    const lines = splitBalancedVietnameseLines(text);
    const hasDecor = (decorMotif !== 'none');
    const hiPixels = renderSupersampledVietnameseCanvas(lines, hiW, hiH, hasDecor);
    if (!hiPixels) return null;

    // Lấy mẫu thông minh từ khối 10x10 xuống lưới (rows x cols), giữ nguyên cả các nét dấu thanh mảnh
    const inkMask = Array.from({ length: rows }, () => Array(cols).fill(false));
    const peakScore = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        const vals = [];
        for (let dy = 0; dy < SCALE; dy++) {
          const py = r * SCALE + dy;
          for (let dx = 0; dx < SCALE; dx++) {
            const px = c * SCALE + dx;
            const v = hiPixels[(py * hiW + px) * 4];
            sum += v;
            vals.push(v);
          }
        }
        vals.sort((a, b) => b - a);
        const mean = sum / (SCALE * SCALE);
        let top25 = 0;
        const kCount = Math.max(1, Math.floor(vals.length * 0.25));
        for (let k = 0; k < kCount; k++) top25 += vals[k];
        top25 /= kCount;
        peakScore[r][c] = top25;
        if (mean >= 86 || top25 >= 178) {
          inkMask[r][c] = true;
        }
      }
    }

    // Chống mồ côi 1 ô đơn lẻ cho dấu chấm nặng / dấu hỏi nhỏ: mở rộng ngang 1 ô để đặt vừa mã chữ
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!inkMask[r][c]) continue;
        const hasNeighbor = DIRS.some(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          return nr >= 0 && nr < rows && nc >= 0 && nc < cols && inkMask[nr][nc];
        });
        if (!hasNeighbor) {
          const leftScore = c > 0 ? peakScore[r][c - 1] : -1;
          const rightScore = c + 1 < cols ? peakScore[r][c + 1] : -1;
          if (rightScore >= leftScore && c + 1 < cols) {
            inkMask[r][c + 1] = true;
          } else if (c > 0) {
            inkMask[r][c - 1] = true;
          }
        }
      }
    }

    // Bổ sung biểu tượng trang trí góc tranh (Ngôi sao, Hoa sen, Trái tim, Búp măng non) với vành đai cách ly 2 ô
    const motifResult = (hasDecor && window.GiaiMaPuzzleDecorators && typeof window.GiaiMaPuzzleDecorators.applyMotifToMask === 'function')
      ? window.GiaiMaPuzzleDecorators.applyMotifToMask(inkMask, peakScore, rows, cols, text, decorMotif)
      : null;

    // Tạo danh sách đáp án đúng & kho mã gây nhiễu theo từng câu
    const letters = ['A', 'B', 'C', 'D'];
    const correctAnswers = [];
    const distractorsByQ = [];
    for (let i = 1; i <= qCount; i++) {
      const rightChar = letters[(i * 2 + 1) % 4];
      const rightCode = `${i}${rightChar}`;
      correctAnswers.push(rightCode);
      distractorsByQ.push(letters.filter(l => l !== rightChar).map(l => `${i}${l}`));
    }

    // Phân bổ câu hỏi: dành 1-2 câu cuối cho biểu tượng trang trí góc tranh, phần còn lại rải đều theo chữ thông điệp
    const hasTwoMotifGroups = Boolean(motifResult && motifResult.countPrimary > 0 && motifResult.countSecondary > 0 && qCount >= 8);
    const hasOneMotifGroup = Boolean(!hasTwoMotifGroups && motifResult && (motifResult.countPrimary + motifResult.countSecondary > 0) && qCount >= 5);
    const textQCount = hasTwoMotifGroups ? (qCount - 2) : (hasOneMotifGroup ? (qCount - 1) : qCount);

    const questionPaletteMeta = [];
    for (let i = 0; i < textQCount; i++) {
      const pal = THEME_PALETTES[i % THEME_PALETTES.length];
      questionPaletteMeta.push({
        color: pal.color,
        name: pal.name,
        part: `Cụm chữ phần ${i + 1}/${textQCount}`
      });
    }
    if (hasTwoMotifGroups) {
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.primary));
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.secondary));
    } else if (hasOneMotifGroup) {
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.primary));
    }

    const textCoords = [];
    const allTargetCoords = [];
    const bandHeight = rows / Math.max(1, lines.length);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!inkMask[r][c]) continue;
        const mRole = motifResult ? motifResult.motifRoleGrid[r][c] : 0;
        if (mRole === 0) {
          const band = Math.min(lines.length - 1, Math.floor(r / bandHeight));
          textCoords.push({ r, c, order: band * 1000 + c + r * 0.05 });
        }
        allTargetCoords.push({ r, c });
      }
    }
    textCoords.sort((a, b) => a.order - b.order);

    const qGrid = Array.from({ length: rows }, () => Array(cols).fill(-1));
    textCoords.forEach((pt, idx) => {
      const qIdx = Math.min(textQCount - 1, Math.floor((idx * textQCount) / Math.max(1, textCoords.length)));
      qGrid[pt.r][pt.c] = qIdx;
    });

    if (motifResult && (hasTwoMotifGroups || hasOneMotifGroup)) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const mRole = motifResult.motifRoleGrid[r][c];
          if (mRole === 1) {
            qGrid[r][c] = hasTwoMotifGroups ? (qCount - 2) : (qCount - 1);
          } else if (mRole === 2) {
            qGrid[r][c] = qCount - 1;
          }
        }
      }
    }

    const nearestQuestionIndex = (r, c) => {
      let bestD = 1e9, bestQ = 0;
      for (let i = 0; i < allTargetCoords.length; i += 2) {
        const pt = allTargetCoords[i];
        const d = (pt.r - r) * (pt.r - r) + (pt.c - c) * (pt.c - c);
        if (d < bestD) {
          bestD = d;
          bestQ = qGrid[pt.r][pt.c];
        }
      }
      return Math.max(0, bestQ);
    };

    const puzzleCells = [];

    if (meshStyle === 'hexagon') {
      // KIỂU 1: LƯỚI TỔ ONG LỤC GIÁC MẬT ĐỘ CAO (R = 13.5 -> GIỮ NÉT DẤU TIẾNG VIỆT)
      const R = 13.5;
      const hexW = Math.sqrt(3) * R;
      const vertStep = 1.5 * R;
      const hexCols = Math.ceil(width / hexW) + 1;
      const hexRows = Math.ceil(height / vertStep) + 1;

      let hexIdx = 0;
      for (let r = 0; r < hexRows; r++) {
        for (let c = 0; c < hexCols; c++) {
          const cx = Number(((c + 0.5 + (r % 2 === 1 ? 0.5 : 0)) * hexW).toFixed(1));
          const cy = Number((r * vertStep + R + 2).toFixed(1));
          if (cx < -R || cx > width + R || cy < -R || cy > height + R) continue;

          const sc = Math.min(cols - 1, Math.max(0, Math.floor((cx / width) * cols)));
          const sr = Math.min(rows - 1, Math.max(0, Math.floor((cy / height) * rows)));
          const isTgt = inkMask[sr][sc];

          const pts = [];
          for (let i = 0; i < 6; i++) {
            const angle = (60 * i + 30) * Math.PI / 180;
            pts.push(`${Number((cx + R * Math.cos(angle)).toFixed(1))} ${Number((cy + R * Math.sin(angle)).toFixed(1))}`);
          }
          const d = `M ${pts.join(' L ')} Z`;

          if (isTgt) {
            const qIdx = Math.max(0, qGrid[sr][sc]);
            puzzleCells.push({
              id: `c_hex_${r}_${c}`,
              code: correctAnswers[qIdx],
              isTarget: true,
              targetColor: questionPaletteMeta[qIdx].color,
              d,
              labelPos: [cx, cy],
              fontSize: 6.8
            });
          } else {
            const nearQ = nearestQuestionIndex(sr, sc);
            const traps = distractorsByQ[nearQ];
            puzzleCells.push({
              id: `c_hex_${r}_${c}`,
              code: traps[hexIdx % traps.length],
              isTarget: false,
              d,
              labelPos: [cx, cy],
              fontSize: 6.8
            });
          }
          hexIdx++;
        }
      }
    } else if (meshStyle === 'pixel') {
      // KIỂU 2: Ô VUÔNG PIXEL ART ĐỘ NÉT CAO (48x30 RETRO LEGO BRICKS - GỘP GẠCH NỀN 2x2 ĐỂ DỄ TÔ)
      const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
      let pxCounter = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (visited[r][c]) continue;
          const isTgt = inkMask[r][c];
          let spanC = 1, spanR = 1;

          if (isTgt) {
            const qIdx = qGrid[r][c];
            if (c + 1 < cols && !visited[r][c + 1] && inkMask[r][c + 1] && qGrid[r][c + 1] === qIdx) {
              spanC = 2;
            }
          } else {
            // Gộp gạch Lego nền 2x2 hoặc 2x1 để phiếu học sinh thoáng, dễ đọc mã
            const can2x2 = (r + 1 < rows && c + 1 < cols &&
              !visited[r][c + 1] && !visited[r + 1][c] && !visited[r + 1][c + 1] &&
              !inkMask[r][c + 1] && !inkMask[r + 1][c] && !inkMask[r + 1][c + 1]);
            if (can2x2) {
              spanC = 2;
              spanR = 2;
            } else if (c + 1 < cols && !visited[r][c + 1] && !inkMask[r][c + 1]) {
              spanC = 2;
            }
          }

          for (let dr = 0; dr < spanR; dr++) {
            for (let dc = 0; dc < spanC; dc++) visited[r + dr][c + dc] = true;
          }

          const x1 = Number((c * cellW).toFixed(1));
          const y1 = Number((r * cellH).toFixed(1));
          const x2 = Number(((c + spanC) * cellW).toFixed(1));
          const y2 = Number(((r + spanR) * cellH).toFixed(1));
          const d = `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`;
          const lx = Number(((x1 + x2) / 2).toFixed(1));
          const ly = Number(((y1 + y2) / 2).toFixed(1));

          if (isTgt) {
            const qIdx = Math.max(0, qGrid[r][c]);
            puzzleCells.push({
              id: `c_px_${pxCounter++}`,
              code: correctAnswers[qIdx],
              isTarget: true,
              targetColor: questionPaletteMeta[qIdx].color,
              d,
              labelPos: [lx, ly],
              fontSize: spanC >= 2 ? 7.8 : 6.6
            });
          } else {
            const nearQ = nearestQuestionIndex(r, c);
            const traps = distractorsByQ[nearQ];
            puzzleCells.push({
              id: `c_px_${pxCounter++}`,
              code: traps[pxCounter % traps.length],
              isTarget: false,
              d,
              labelPos: [lx, ly],
              fontSize: spanC >= 2 ? 8.0 : 6.8
            });
          }
        }
      }
    } else {
      // KIỂU 3: ĐA GIÁC NGHỆ THUẬT NGỤY TRANG CAO CẤP (56x36 ORTHOGONAL POLYOMINO JIGSAW)
      const compVisited = Array.from({ length: rows }, () => Array(cols).fill(false));
      const components = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (compVisited[r][c]) continue;
          const grp = inkMask[r][c] ? qGrid[r][c] : -1;
          const queue = [[r, c]];
          compVisited[r][c] = true;
          const cells = [];
          while (queue.length > 0) {
            const [cr, cc] = queue.shift();
            cells.push([cr, cc]);
            for (const [dr, dc] of DIRS) {
              const nr = cr + dr, nc = cc + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !compVisited[nr][nc]) {
                const nGrp = inkMask[nr][nc] ? qGrid[nr][nc] : -1;
                if (nGrp === grp) {
                  compVisited[nr][nc] = true;
                  queue.push([nr, nc]);
                }
              }
            }
          }
          components.push({ grp, cells });
        }
      }

      let rng = 20261120;
      const nextRand = () => {
        rng = (rng * 1664525 + 1013904223) >>> 0;
        return rng / 4294967296;
      };
      const keyOf = (r, c) => `${r},${c}`;

      const polyList = [];
      components.forEach(({ grp, cells: compCells }) => {
        const isTgt = grp >= 0;
        const minSz = isTgt ? 3 : 6;
        const maxSz = isTgt ? 9 : 13;

        if (compCells.length <= maxSz && traceOrthogonalLoop(compCells, cellW, cellH)) {
          polyList.push({ grp, cells: compCells });
          return;
        }

        const unassigned = new Set(compCells.map(([r, c]) => keyOf(r, c)));
        const pieces = [];

        while (unassigned.size > 0) {
          let seed = null, minDeg = 99;
          for (const k of unassigned) {
            const [r, c] = k.split(',').map(Number);
            let deg = 0;
            for (const [dr, dc] of DIRS) if (unassigned.has(keyOf(r + dr, c + dc))) deg++;
            if (deg < minDeg) { minDeg = deg; seed = [r, c]; }
          }
          const piece = [seed];
          unassigned.delete(keyOf(seed[0], seed[1]));
          const goal = minSz + Math.floor(nextRand() * (maxSz - minSz + 1));

          while (piece.length < goal) {
            const cands = [], seen = new Set();
            for (const [pr, pc] of piece) {
              for (const [dr, dc] of DIRS) {
                const nr = pr + dr, nc = pc + dc, nk = keyOf(nr, nc);
                if (unassigned.has(nk) && !seen.has(nk)) { seen.add(nk); cands.push([nr, nc, nk]); }
              }
            }
            if (!cands.length) break;

            let best = null, bestSc = -1e9;
            for (const [nr, nc, nk] of cands) {
              const test = [...piece, [nr, nc]];
              let r0 = 999, r1 = -1, c0 = 999, c1 = -1;
              for (const [tr, tc] of test) {
                if (tr < r0) r0 = tr; if (tr > r1) r1 = tr;
                if (tc < c0) c0 = tc; if (tc > c1) c1 = tc;
              }
              if (c1 - c0 + 1 > 7 || r1 - r0 + 1 > 5) continue;
              if (!traceOrthogonalLoop(test, cellW, cellH)) continue;

              let horiz = 0, shared = 0;
              for (const [pr, pc] of piece) {
                if (Math.abs(pr - nr) + Math.abs(pc - nc) === 1) {
                  shared++;
                  if (pr === nr) horiz++;
                }
              }
              const sc = horiz * 3.5 + shared * 1.5 - (c1 - c0 + r1 - r0) * 0.7 + nextRand() * 3;
              if (sc > bestSc) { bestSc = sc; best = [nr, nc, nk]; }
            }
            if (!best) break;
            piece.push([best[0], best[1]]);
            unassigned.delete(best[2]);
          }
          pieces.push(piece);
        }

        // Hậu xử lý gộp các mảnh vụn nhỏ vào mảnh kế bên
        let mergedAny = true;
        while (mergedAny) {
          mergedAny = false;
          pieces.sort((a, b) => a.length - b.length);
          for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].length >= minSz) continue;
            const setI = new Set(pieces[i].map(([r, c]) => keyOf(r, c)));
            let bestJ = -1;
            for (let j = 0; j < pieces.length; j++) {
              if (i === j) continue;
              const adj = pieces[j].some(([r, c]) => DIRS.some(([dr, dc]) => setI.has(keyOf(r + dr, c + dc))));
              if (!adj) continue;
              const combined = [...pieces[i], ...pieces[j]];
              if (combined.length <= maxSz + 5 && traceOrthogonalLoop(combined, cellW, cellH)) {
                bestJ = j;
                break;
              }
            }
            if (bestJ !== -1) {
              pieces[bestJ] = [...pieces[bestJ], ...pieces[i]];
              pieces.splice(i, 1);
              mergedAny = true;
              break;
            }
          }
        }

        pieces.forEach(sp => polyList.push({ grp, cells: sp }));
      });

      polyList.forEach((p, idx) => {
        const d = traceOrthogonalLoop(p.cells, cellW, cellH);
        if (!d) return;
        const isTgt = p.grp >= 0;
        let code;
        if (isTgt) {
          code = correctAnswers[p.grp];
        } else {
          const avgR = p.cells.reduce((s, x) => s + x[0], 0) / p.cells.length;
          const avgC = p.cells.reduce((s, x) => s + x[1], 0) / p.cells.length;
          const nearQ = nearestQuestionIndex(avgR, avgC);
          const traps = distractorsByQ[nearQ];
          code = traps[idx % traps.length];
        }
        const { labelPos, fontSize } = findInscribedLabelCenter(p.cells, cellW, cellH, code);
        const cellObj = {
          id: `c_poly_${idx}`,
          code,
          isTarget: isTgt,
          d,
          labelPos,
          fontSize
        };
        if (isTgt) {
          cellObj.targetColor = questionPaletteMeta[p.grp % questionPaletteMeta.length].color;
        }
        puzzleCells.push(cellObj);
      });
    }

    // Bảng quy ước màu rõ ràng tên màu Tiếng Việt thực tế cho phiếu in học sinh & bảng đối chiếu
    const colorRules = {};
    correctAnswers.forEach((code, idx) => {
      const pal = questionPaletteMeta[idx % questionPaletteMeta.length];
      colorRules[code] = {
        qNum: idx + 1,
        color: pal.color,
        name: pal.name,
        part: pal.part
      };
    });

    return {
      title: text,
      questionCount: qCount,
      meshStyle: meshStyle,
      decorMotif: motifResult ? motifResult.motifKey : 'none',
      correctAnswers: correctAnswers,
      cells: puzzleCells,
      colorRules: colorRules,
      targetCellIds: puzzleCells.filter(c => c.isTarget).map(c => c.id)
    };
  }

  // 3. QUẢN LÝ BỘ SƯU TẬP PRESET TRONG LOCALSTORAGE
  function getSavedPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Bỏ qua lỗi đọc LocalStorage
    }
    return [...DEFAULT_PRESETS];
  }

  function saveCustomPreset(presetObj) {
    if (!presetObj || !presetObj.title) return false;
    const list = getSavedPresets();
    const existingIdx = list.findIndex(p => p.id === presetObj.id);
    if (existingIdx >= 0) {
      list[existingIdx] = presetObj;
    } else {
      list.unshift(presetObj);
    }
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }

  function deleteCustomPreset(id) {
    let list = getSavedPresets();
    list = list.filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }

  // 4. XUẤT FILE VECTOR SVG & PDF CHUẨN IN KHỔ LỚN (A1 / A0 / A4)
  function exportSvgVector(puzzleData, mode = 'stage') {
    const isStageOnly = (mode === 'stage'); // Bản bạt A1/A0 khổng lồ hay phiếu học sinh
    const width = 800;
    const height = 520;
    const cells = (puzzleData && puzzleData.cells) ? puzzleData.cells : [];

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${isStageOnly ? '841mm' : '297mm'}" height="${isStageOnly ? '594mm' : '210mm'}">
  <style>
    .cell { fill: #ffffff; stroke: #000000; stroke-width: 1.8; stroke-linejoin: round; }
    .label { font-family: 'Arial', sans-serif; font-size: 10px; font-weight: bold; fill: #000000; text-anchor: middle; dominant-baseline: central; }
  </style>
  <rect width="${width}" height="${height}" fill="#ffffff"/>
`;

    cells.forEach(cell => {
      const fsize = cell.fontSize || 10;
      svg += `  <path class="cell" d="${cell.d}" />\n`;
      svg += `  <text class="label" x="${cell.labelPos[0]}" y="${cell.labelPos[1]}" font-size="${fsize}">${cell.code}</text>\n`;
    });

    svg += `</svg>`;

    // Kích hoạt tải về file .svg
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (puzzleData.title || 'Ma_Tran_Giai_Ma').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `${safeTitle}_${mode.toUpperCase()}_VECTOR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Xuất file PDF Vector trực tiếp
  function exportPdfVector(puzzleData, mode = 'stage') {
    const isStage = (mode === 'stage');
    const safeTitle = (puzzleData && puzzleData.title) ? puzzleData.title : 'BỨC TRANH BÍ ẨN';
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép mở cửa sổ popup để in / tải PDF Vector!', 'warning');
      }
      return;
    }

    const svgContent = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function')
      ? window.GiaiMaPuzzle.renderSvgMatrix('export_pdf', {}, { isPrint: true, puzzle: puzzleData })
      : '<p>Không thể tạo SVG</p>';

    // Tạo Bảng quy ước mã màu cho phiếu học sinh (chỉ hiển thị Câu hỏi & Màu, KHÔNG lộ mã đáp án A/B/C/D)
    let legendHtml = '';
    const colorRules = (puzzleData && puzzleData.colorRules) 
      ? puzzleData.colorRules 
      : (window.GiaiMaPuzzle ? window.GiaiMaPuzzle.COLOR_RULES : null);

    if (colorRules) {
      const colorGroups = {};
      Object.keys(colorRules).forEach(code => {
        const item = colorRules[code];
        if (!item) return;
        const col = item.color || '#dc2626';
        if (!colorGroups[col]) {
          colorGroups[col] = {
            color: col,
            name: item.name || 'Màu',
            questions: []
          };
        }
        if (item.qNum && !colorGroups[col].questions.includes(item.qNum)) {
          colorGroups[col].questions.push(item.qNum);
        }
      });

      const itemsHtml = Object.values(colorGroups).map(grp => {
        grp.questions.sort((a, b) => a - b);
        const qText = grp.questions.length > 1 
          ? `Câu ${grp.questions.join(', Câu ')}` 
          : `Câu ${grp.questions[0] || 1}`;
        return `
          <span style="display: inline-flex; align-items: center; gap: 5px; font-weight: bold; margin: 2px 6px;">
            <span style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid #000; background: ${grp.color};"></span>
            ${qText}: ${grp.name}
          </span>
        `;
      }).join('');

      legendHtml = `
        <div class="legend-bar" style="display: flex; flex-wrap: wrap; gap: 8px; background: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 10pt; margin-bottom: 8px; border: 1.5px solid #000; justify-content: center; align-items: center;">
          <strong style="color: #000;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</strong>
          ${itemsHtml}
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH MA TRẬN</title>
        <style>
          @page {
            size: ${isStage ? 'A1 landscape' : 'A4 landscape'};
            margin: ${isStage ? '12mm' : '8mm'};
          }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #000;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .title-text h1 {
            font-size: ${isStage ? '26pt' : '16pt'};
            margin: 0;
            text-transform: uppercase;
            text-align: center;
          }
          .canvas-box {
            width: 100%;
            height: ${isStage ? '80vh' : '68vh'};
            border: 2px solid #000;
            border-radius: 8px;
            overflow: hidden;
          }
          .notice-box {
            background: #e0f2fe;
            border: 1px solid #0284c7;
            padding: 10px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print notice-box">
          <div>
            <strong>📐 Bản in Vector Khổ ${isStage ? 'A1 / A0 (In Bạt Sân Khấu)' : 'A4 / A3 (Phiếu Học Sinh)'}:</strong>
            <span> Độ phân giải chuẩn Vector cực nét, không bị răng cưa khi phóng to.</span>
          </div>
          <button onclick="window.print()" style="background: #0284c7; color: #fff; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            🖨️ In / Lưu Dạng PDF (Ctrl+P)
          </button>
        </div>

        <div class="header-bar">
          <div style="font-size: 11pt; font-weight: bold; line-height: 1.3;">
            TRƯỜNG THCS TÂN HẢI<br>
            HOẠT ĐỘNG DẠY HỌC TÍCH CỰC
          </div>
          <div class="title-text">
            <h1>GIẢI MÃ BỨC TRANH BÍ ẨN</h1>
            ${isStage ? `<div style="font-size: 11pt; color: #475569; font-weight: bold; margin-top: 4px;">(Bản bạt sân khấu - Đối soát Ban Giám Khảo: ${safeTitle})</div>` : ''}
          </div>
          <div style="font-size: 11pt; font-weight: bold; text-align: right;">
            ĐỘI THI: .........................<br>
            KHỔ: <strong>${isStage ? 'A1 / A0' : 'A4 / A3'}</strong>
          </div>
        </div>

        ${legendHtml}

        <div class="canvas-box">
          ${svgContent}
        </div>

        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 9.5pt; font-style: italic; border-top: 1px solid #000; padding-top: 6px;">
          <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
          <span>Ban Giám Khảo chấm điểm độ chính xác và tính thẩm mỹ</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // 5. GIAO DIỆN MODAL QUẢN LÝ BỘ TRANH & SINH MA TRẬN TỰ ĐỘNG
  function openGeneratorModal() {
    let modal = document.getElementById('gmmGeneratorModal');
    if (!modal) {
      createGeneratorModalDOM();
      modal = document.getElementById('gmmGeneratorModal');
    }
    if (modal) {
      modal.classList.add('active');
      renderPresetListUI();
    }
  }

  function closeGeneratorModal() {
    const modal = document.getElementById('gmmGeneratorModal');
    if (modal) modal.classList.remove('active');
  }

  function createGeneratorModalDOM() {
    const div = document.createElement('div');
    div.id = 'gmmGeneratorModal';
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="gmm-modal-card" style="max-width: 1050px; height: 88vh;">
        <div class="gmm-header">
          <div class="gmm-header-title">
            <div class="gmm-title-icon" style="background: linear-gradient(135deg, #0284c7, #0369a1);">✨</div>
            <div class="gmm-title-text">
              <h3>BỘ CÔNG CỤ TẠO MA TRẬN TRANH TỰ ĐỘNG & BỘ SƯU TẬP</h3>
              <p>Tự động sinh bức tranh bí ẩn từ bất kỳ thông điệp nào + Xuất file vector bạt lớn A1/A0</p>
            </div>
          </div>
          <button type="button" class="gmm-btn-ctrl secondary" onclick="GiaiMaPuzzleGenerator.closeGeneratorModal()" style="border-radius: 50%; width: 36px; height: 36px; padding: 0;">✕</button>
        </div>

        <div style="display: flex; flex: 1; overflow: hidden; padding: 16px; gap: 16px;">
          <!-- Cột trái: Cấu hình và sinh ma trận mới -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 14px; background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1); overflow-y: auto;">
            <h4 style="margin: 0; color: #38bdf8; font-size: 1.05rem;">📝 1. Nhập thông điệp bức tranh muốn giải mã:</h4>
            
            <div>
              <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700;">Từ khóa / Thông điệp bí mật:</label>
              <input type="text" id="gmmGenInputText" value="TRI ÂN THẦY CÔ 20/11" 
                     placeholder="Ví dụ: MỪNG ĐẢNG QUANG VINH, CHÚC MỪNG 8/3..."
                     style="width: 100%; margin-top: 6px; padding: 10px 14px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; color: #fff; font-weight: 800; font-size: 1rem;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700;">Số lượng câu hỏi:</label>
                <select id="gmmGenQCount" style="width: 100%; margin-top: 6px; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fde047; font-weight: 700;">
                  <option value="5">5 Câu hỏi (Mầm non / Tiểu học)</option>
                  <option value="8">8 Câu hỏi</option>
                  <option value="10" selected>10 Câu hỏi (Chuẩn THCS & THPT)</option>
                  <option value="12">12 Câu hỏi (Đại hội / Trại hè)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700;">Kiểu dáng ma trận:</label>
                <select id="gmmGenMeshStyle" style="width: 100%; margin-top: 6px; padding: 8px 12px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; color: #38bdf8; font-weight: 700;">
                  <option value="polygon" selected>🔷 Đa giác nghệ thuật (Polygonal Mesh)</option>
                  <option value="pixel">🟩 Ô vuông Pixel Art (Retro Lego)</option>
                  <option value="hexagon">🐝 Lưới tổ ong lục giác (Hexagon Grid)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px;">
              <div>
                <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700;">Biểu tượng trang trí góc tranh:</label>
                <select id="gmmGenDecorMotif" style="width: 100%; margin-top: 6px; padding: 8px 10px; background: #0f172a; border: 1px solid #f59e0b; border-radius: 8px; color: #fde047; font-weight: 700;">
                  <option value="auto" selected>✨ Tự động theo chủ đề</option>
                  <option value="stars">⭐ Ngôi sao &amp; Nguyệt quế (26/3)</option>
                  <option value="lotus">🪷 Hoa sen &amp; Nhành lá (8/3, 20/11)</option>
                  <option value="hearts">💖 Trái tim &amp; Tia nắng (Hạnh phúc)</option>
                  <option value="bamboo">🎋 Búp măng non &amp; Sao (Đội viên)</option>
                  <option value="none">🚫 Không chèn (Chỉ chữ lớn)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 700;">Khổ in dự kiến:</label>
                <select id="gmmGenPaperSize" style="width: 100%; margin-top: 6px; padding: 8px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #34d399; font-weight: 700;">
                  <option value="A1" selected>Khổ A1 (Bạt lớn)</option>
                  <option value="A0">Khổ A0 (Hội trường)</option>
                  <option value="A3">Khổ A3 (Bàn nhóm)</option>
                  <option value="A4">Khổ A4 (Cá nhân)</option>
                </select>
              </div>
            </div>

            <button type="button" class="gmm-btn-ctrl primary" onclick="GiaiMaPuzzleGenerator.handleGenerateClick()" style="padding: 10px; font-weight: 800; font-size: 0.95rem; justify-content: center; background: linear-gradient(135deg, #0284c7, #2563eb);">
              🚀 Sinh Ma Trận Mới Tự Động
            </button>

            <!-- Nút xuất vector chuyên nghiệp & Gói học liệu 1 chạm -->
            <div style="margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
              <h5 style="margin: 0; color: #fde047; font-size: 0.9rem;">🖨️ Xuất in bạt lớn &amp; Gói học liệu đồng bộ:</h5>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="gmm-btn-ctrl info" onclick="GiaiMaPuzzleGenerator.handleExportSvg('stage')" title="Tải file SVG vector vô cực gửi tiệm in bạt quảng cáo A1, A0" style="flex: 1; font-size: 0.82rem; padding: 7px 8px;">
                  📥 Tải SVG (Bạt A1/A0)
                </button>
                <button type="button" class="gmm-btn-ctrl secondary" onclick="GiaiMaPuzzleGenerator.handleExportPdf('stage')" title="Tải hoặc in trực tiếp PDF Vector A1" style="flex: 1; font-size: 0.82rem; padding: 7px 8px;">
                  📄 In PDF (Khổ A1)
                </button>
              </div>
              <button type="button" class="gmm-btn-ctrl" onclick="if(window.GiaiMaPrintBundle)GiaiMaPrintBundle.openOneClickPrintBundle(GiaiMaPuzzleGenerator.getCurrentPuzzle())" style="width: 100%; justify-content: center; padding: 8px 10px; font-weight: 800; font-size: 0.86rem; background: linear-gradient(135deg, #059669, #047857); border: 1px solid #34d399; color: #ffffff;">
                📦 Xuất Gói Học Liệu In Ấn 1 Chạm (Phiếu HS + Đáp Án + 10 Câu)
              </button>
            </div>

            <!-- Áp dụng vào trò chơi ngay -->
            <button type="button" class="gmm-btn-ctrl warning" onclick="GiaiMaPuzzleGenerator.handleApplyToGame()" style="padding: 10px; font-weight: 800; font-size: 0.95rem; justify-content: center; margin-top: auto;">
              🎯 Áp Dụng Ngay Vào Ván Thi Đấu
            </button>
          </div>

          <!-- Cột phải: Xem trước ma trận, Sửa nhanh tên màu bút dạ & Bộ sưu tập Preset -->
          <div style="flex: 1.25; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
              <span style="font-weight: 800; color: #fde047; font-size: 0.95rem;">👁️ Xem trước ma trận trực quan:</span>
              <div style="display: flex; gap: 6px;">
                <button type="button" id="gmmPreviewModeUncolored" class="gmm-btn-ctrl secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="GiaiMaPuzzleGenerator.setPreviewMode(false)">Bản Đen Trắng (Học Sinh)</button>
                <button type="button" id="gmmPreviewModeColored" class="gmm-btn-ctrl primary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="GiaiMaPuzzleGenerator.setPreviewMode(true)">Bản Đã Tô Màu (Đáp Án)</button>
              </div>
            </div>

            <!-- Khung SVG Preview -->
            <div id="gmmGenPreviewWrap" style="width: 100%; aspect-ratio: 800/520; max-height: 36vh; flex-shrink: 0; background: #0b1120; border: 2px solid rgba(255,255,255,0.15); border-radius: 12px; overflow: hidden;">
              <!-- Render SVG tại đây -->
            </div>

            <!-- Khung sửa nhanh tên màu bút dạ 1 chạm -->
            <div style="background: rgba(15, 23, 42, 0.78); padding: 9px 11px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.28); flex-shrink: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 6px; flex-wrap: wrap;">
                <span style="font-weight: 800; color: #38bdf8; font-size: 0.8rem;">🖍️ SỬA NHANH TÊN MÀU BÚT DẠ (Bấm vào tên màu để đổi theo hộp bút của lớp):</span>
                <button type="button" class="gmm-btn-ctrl secondary" style="padding: 2px 8px; font-size: 0.72rem;" onclick="GiaiMaPuzzleGenerator.handleResetMarkerNames()" title="Khôi phục tên màu bút dạ mặc định ban đầu">↺ Khôi phục màu gốc</button>
              </div>
              <div id="gmmQuickMarkerEditorGrid" class="gmm-marker-editor-grid"></div>
            </div>

            <!-- Danh sách các bộ tranh trong Bộ sưu tập -->
            <div style="flex: 1; min-height: 150px; background: rgba(15, 23, 42, 0.6); padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 800; color: #94a3b8; font-size: 0.85rem;">📚 BỘ SƯU TẬP TRANH ĐÃ LƯU:</span>
                <button type="button" class="gmm-btn-ctrl secondary" style="padding: 3px 8px; font-size: 0.75rem;" onclick="GiaiMaPuzzleGenerator.handleSaveCurrentPreset()">💾 Lưu Tranh Này</button>
              </div>
              <div id="gmmPresetListContainer" style="display: flex; flex-direction: column; gap: 6px;">
                <!-- Danh sách preset đổ tại đây -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  let currentGeneratedPuzzle = null;
  let activePresetIdInModal = 'preset_trian_2011';
  let isPreviewColored = true;

  function getCurrentPuzzle() {
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    return currentGeneratedPuzzle;
  }

  function handleGenerateClick() {
    const textInput = document.getElementById('gmmGenInputText');
    const qCountSelect = document.getElementById('gmmGenQCount');
    const meshStyleSelect = document.getElementById('gmmGenMeshStyle');
    const motifSelect = document.getElementById('gmmGenDecorMotif');
    const text = textInput ? textInput.value : 'TRI ÂN THẦY CÔ 20/11';
    const count = qCountSelect ? parseInt(qCountSelect.value, 10) : 10;
    const meshStyle = meshStyleSelect ? meshStyleSelect.value : 'polygon';
    const decorMotif = motifSelect ? motifSelect.value : 'auto';

    activePresetIdInModal = null;
    currentGeneratedPuzzle = generateMatrixFromText(text, count, { meshStyle, decorMotif });
    renderPreview();
    if (typeof window.showToast === 'function') {
      const styleName = meshStyle === 'hexagon' ? 'Lưới tổ ong' : (meshStyle === 'pixel' ? 'Pixel Art' : 'Đa giác nghệ thuật');
      window.showToast(`✨ Đã sinh ma trận ${styleName} kèm họa tiết cho "${text}"!`, 'success');
    }
  }

  function buildDefaultTriAnBundle() {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function') {
      const active = window.GiaiMaPuzzle.getActivePuzzle();
      if (active && active.isDefaultTriAn) {
        return {
          id: 'preset_trian_2011',
          title: active.title,
          questionCount: 10,
          meshStyle: 'polygon',
          cells: active.cells,
          colorRules: active.colorRules,
          targetCellIds: active.targetCellIds
        };
      }
    }
    if (window.GiaiMaPuzzle && window.GiaiMaPuzzle.PUZZLE_CELLS) {
      const sep = (window.GiaiMaPuzzle.getDateSeparatorStyle && window.GiaiMaPuzzle.getDateSeparatorStyle() === 'dash') ? 'dash' : 'slash';
      const cells = sep === 'dash' && window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        ? window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        : window.GiaiMaPuzzle.PUZZLE_CELLS;
      return {
        id: 'preset_trian_2011',
        title: sep === 'dash' ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11',
        questionCount: 10,
        meshStyle: 'polygon',
        cells: cells,
        colorRules: window.GiaiMaPuzzle.COLOR_RULES,
        targetCellIds: cells.filter(c => c.isTarget).map(c => c.id)
      };
    }
    return generateMatrixFromText('TRI ÂN THẦY CÔ 20/11', 10);
  }

  function setPreviewMode(isColored) {
    isPreviewColored = Boolean(isColored);
    const btnUncolored = document.getElementById('gmmPreviewModeUncolored');
    const btnColored = document.getElementById('gmmPreviewModeColored');
    if (btnUncolored) {
      btnUncolored.classList.toggle('primary', !isPreviewColored);
      btnUncolored.classList.toggle('secondary', isPreviewColored);
    }
    if (btnColored) {
      btnColored.classList.toggle('primary', isPreviewColored);
      btnColored.classList.toggle('secondary', !isPreviewColored);
    }
    renderPreview();
  }

  function handleQuickRuleChange(codeKey, newName, newColor) {
    if (!currentGeneratedPuzzle || !currentGeneratedPuzzle.colorRules || !currentGeneratedPuzzle.colorRules[codeKey]) return;
    const rule = currentGeneratedPuzzle.colorRules[codeKey];
    if (newName) rule.name = newName;
    if (newColor) {
      rule.color = newColor;
      if (Array.isArray(currentGeneratedPuzzle.cells)) {
        currentGeneratedPuzzle.cells.forEach(c => {
          if (c.isTarget && c.code === codeKey) {
            c.targetColor = newColor;
          }
        });
      }
    }

    // Nếu đang sửa màu trên bộ tranh mặc định 20/11 -> đồng bộ thẳng vào GiaiMaPuzzle & LocalStorage
    const isDefaultTriAn = (currentGeneratedPuzzle.id === 'preset_trian_2011');
    if (isDefaultTriAn && window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.updateActiveColorRule === 'function') {
      window.GiaiMaPuzzle.updateActiveColorRule(codeKey, newName, newColor);
    } else {
      // Nếu là preset đã lưu trong Bộ sưu tập -> tự lưu cập nhật tên màu vào preset đó
      if (activePresetIdInModal) {
        const savedList = getSavedPresets();
        const found = savedList.find(p => p.id === activePresetIdInModal);
        if (found) {
          found.matrixData = currentGeneratedPuzzle;
          saveCustomPreset(found);
        }
      }
      // Nếu tranh này đang là tranh thi đấu hiện tại -> đồng bộ ngay ra ngoài
      if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function') {
        const active = window.GiaiMaPuzzle.getActivePuzzle();
        if (active && active.title === currentGeneratedPuzzle.title && !active.isDefaultTriAn) {
          window.GiaiMaPuzzle.setActivePuzzle(currentGeneratedPuzzle);
        }
      }
    }

    renderPreview();
    if (typeof window.showToast === 'function') {
      window.showToast(`🖍️ Đã cập nhật màu Câu ${rule.qNum} (${codeKey}): "${rule.name}"!`, 'info');
    }
  }

  function handleResetMarkerNames() {
    if (currentGeneratedPuzzle && currentGeneratedPuzzle.id === 'preset_trian_2011') {
      if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.resetDefaultColorOverrides === 'function') {
        window.GiaiMaPuzzle.resetDefaultColorOverrides();
      }
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    } else if (currentGeneratedPuzzle) {
      const codes = Object.keys(currentGeneratedPuzzle.colorRules || {});
      codes.forEach((code, idx) => {
        const pal = THEME_PALETTES[idx % THEME_PALETTES.length];
        currentGeneratedPuzzle.colorRules[code].name = pal.name;
        currentGeneratedPuzzle.colorRules[code].color = pal.color;
        (currentGeneratedPuzzle.cells || []).forEach(c => {
          if (c.isTarget && c.code === code) c.targetColor = pal.color;
        });
      });
    }
    renderPreview();
    if (typeof window.showToast === 'function') {
      window.showToast('↺ Đã khôi phục bảng tên màu bút dạ mặc định!', 'info');
    }
  }

  function renderPreview() {
    const wrap = document.getElementById('gmmGenPreviewWrap');
    if (!wrap) return;

    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      if (isPreviewColored) {
        wrap.innerHTML = window.GiaiMaPuzzle.renderSvgMatrix('gen_preview', {}, {
          isPrint: true,
          isSolvedAnswerKey: true,
          puzzle: currentGeneratedPuzzle
        });
      } else {
        wrap.innerHTML = window.GiaiMaPuzzle.renderSvgMatrix('gen_preview', {}, {
          isPrint: true,
          puzzle: currentGeneratedPuzzle
        });
      }
    }

    if (window.GiaiMaPuzzleDecorators && typeof window.GiaiMaPuzzleDecorators.renderInlineColorEditor === 'function') {
      window.GiaiMaPuzzleDecorators.renderInlineColorEditor('gmmQuickMarkerEditorGrid', currentGeneratedPuzzle, handleQuickRuleChange);
    }
  }

  function renderPresetListUI() {
    const container = document.getElementById('gmmPresetListContainer');
    if (!container) return;
    const presets = getSavedPresets();

    container.innerHTML = presets.map((p, idx) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.7); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div>
          <div style="font-weight: 800; color: #f8fafc; font-size: 0.9rem;">${idx + 1}. ${p.title}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">${p.description || p.questionCount + ' câu hỏi'}</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="gmm-btn-ctrl primary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="GiaiMaPuzzleGenerator.applyPreset('${p.id}')">Chọn Dùng</button>
          ${idx >= DEFAULT_PRESETS.length ? `
            <button type="button" class="gmm-btn-ctrl danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="GiaiMaPuzzleGenerator.removePreset('${p.id}')">Xóa</button>
          ` : ''}
        </div>
      </div>
    `).join('');

    renderPreview();
  }

  function handleSaveCurrentPreset() {
    if (!currentGeneratedPuzzle) return;
    const styleLabel = currentGeneratedPuzzle.meshStyle === 'hexagon' ? 'Tổ ong' : (currentGeneratedPuzzle.meshStyle === 'pixel' ? 'Pixel' : 'Đa giác');
    const newId = 'custom_' + Date.now();
    const savedCopy = Object.assign({}, currentGeneratedPuzzle, { id: newId });
    const newPreset = {
      id: newId,
      title: currentGeneratedPuzzle.title,
      questionCount: currentGeneratedPuzzle.questionCount,
      meshStyle: currentGeneratedPuzzle.meshStyle || 'polygon',
      decorMotif: currentGeneratedPuzzle.decorMotif || 'auto',
      description: `Kiểu ${styleLabel} • Tạo lúc ${new Date().toLocaleTimeString('vi-VN')}`,
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
    if (input) input.value = p.title;
    if (select) select.value = p.questionCount || 10;
    if (meshSelect && p.meshStyle) meshSelect.value = p.meshStyle;
    if (motifSelect) motifSelect.value = p.decorMotif || 'auto';

    if (p.id === 'preset_trian_2011') {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
      if (input) input.value = currentGeneratedPuzzle.title;
    } else if (p.matrixData) {
      currentGeneratedPuzzle = p.matrixData;
    } else {
      currentGeneratedPuzzle = generateMatrixFromText(p.title, p.questionCount || 10, {
        meshStyle: p.meshStyle || 'polygon',
        decorMotif: p.decorMotif || 'auto'
      });
    }
    renderPreview();
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
    exportSvgVector(currentGeneratedPuzzle, mode);
  }

  function handleExportPdf(mode) {
    if (!currentGeneratedPuzzle) {
      currentGeneratedPuzzle = buildDefaultTriAnBundle();
    }
    exportPdfVector(currentGeneratedPuzzle, mode);
  }

  function handleApplyToGame() {
    if (!currentGeneratedPuzzle) {
      handleGenerateClick();
    }
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.setActivePuzzle === 'function') {
      window.GiaiMaPuzzle.setActivePuzzle(currentGeneratedPuzzle);
    }
    closeGeneratorModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 Đã áp dụng bức tranh "${currentGeneratedPuzzle.title}" vào trò chơi!`, 'success');
    }
  }

  // EXPORT GLOBAL
  window.GiaiMaPuzzleGenerator = {
    generateMatrixFromText,
    getSavedPresets,
    saveCustomPreset,
    deleteCustomPreset,
    exportSvgVector,
    exportPdfVector,
    openGeneratorModal,
    closeGeneratorModal,
    getCurrentPuzzle,
    handleGenerateClick,
    handleResetMarkerNames,
    setPreviewMode,
    handleSaveCurrentPreset,
    applyPreset,
    removePreset,
    handleExportSvg,
    handleExportPdf,
    handleApplyToGame
  };

})();
