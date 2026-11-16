/**
 * ==============================================================================
 * MODULE RASTERIZER FONT TIẾNG VIỆT & BẢNG MÀU MA TRẬN (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleRasterizer.js
 * Trách nhiệm: Font Pixel-Block Tiếng Việt 7 hàng, chuẩn hóa ký hiệu, chia dòng,
 * rasterize lưới và các thuật toán hình học trực giao (traceOrthogonalLoop, findInscribedLabelCenter).
 * ==============================================================================
 */
(function () {
  'use strict';

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
      meshStyle: 'polygon',
      decorMotif: 'hearts',
      description: 'Chủ đề Môi trường học đường hạnh phúc • Đa giác nghệ thuật & Trái tim'
    },
    {
      id: 'preset_noi_khong_bao_luc',
      title: 'NÓI KHÔNG VỚI BẠO LỰC',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'hearts',
      description: 'Chủ đề Phòng chống bạo lực học đường • Đa giác nghệ thuật & Trái tim'
    },
    {
      id: 'preset_mung_dang',
      title: 'MỪNG ĐẢNG QUANG VINH',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'stars',
      description: 'Chủ đề Mừng Đảng Mừng Xuân • Đa giác nghệ thuật & Sao vàng'
    },
    {
      id: 'preset_chuc_mung_8_3',
      title: 'CHÚC MỪNG NGÀY 8/3',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'lotus',
      description: 'Chủ đề Ngày Quốc tế Phụ nữ 8/3 • Đa giác nghệ thuật & Hoa sen'
    },
    {
      id: 'preset_tien_buoc_26_3',
      title: 'TIẾN BƯỚC LÊN ĐOÀN',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'stars',
      description: 'Chủ đề Ngày thành lập Đoàn TNCS Hồ Chí Minh 26/3 • Đa giác nghệ thuật'
    },
    {
      id: 'preset_trai_nghiem',
      title: 'HOẠT ĐỘNG TRẢI NGHIỆM',
      questionCount: 10,
      meshStyle: 'polygon',
      decorMotif: 'bamboo',
      description: 'Chủ đề Sinh hoạt Đội & Ngoại khóa • Đa giác nghệ thuật & Búp măng non'
    }
  ];

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

  const HIGH_CONTRAST_PALETTES = [
    { color: '#ef4444', name: 'Đỏ tươi' },
    { color: '#f97316', name: 'Cam đậm' },
    { color: '#eab308', name: 'Vàng nghệ' },
    { color: '#16a34a', name: 'Xanh lá' },
    { color: '#2563eb', name: 'Xanh biển' },
    { color: '#9333ea', name: 'Tím huế' },
    { color: '#ec4899', name: 'Hồng sen' },
    { color: '#854d0e', name: 'Nâu đất' },
    { color: '#0d9488', name: 'Xanh ngọc' },
    { color: '#881337', name: 'Đỏ đô' },
    { color: '#4f46e5', name: 'Xanh chàm' },
    { color: '#65a30d', name: 'Xanh cốm' }
  ];

  const PAPER_SPECS = {
    A0: { code: 'A0', label: 'Bạt Sân Khấu A0', wMm: 1189, hMm: 841, advice: 'Rất rộng rãi cho cọ màu / bút dạ bảng lớn tập thể' },
    A1: { code: 'A1', label: 'Giấy / Bạt A1', wMm: 841, hMm: 594, advice: 'Rất vừa đầu bút dạ lông / bút sáp màu tập thể' },
    A3: { code: 'A3', label: 'Giấy Nhóm A3', wMm: 420, hMm: 297, advice: 'Phù hợp bút dạ nét vừa cho nhóm 4–6 học sinh' },
    A4: { code: 'A4', label: 'Phiếu Cá Nhân A4', wMm: 297, hMm: 210, advice: 'Phù hợp bút chì màu / bút dạ kim cá nhân' }
  };

  const GLYPHS_6 = {
    'A': ['.1111.', '11..11', '11..11', '111111', '11..11', '11..11', '11..11'],
    'B': ['11111.', '11..11', '11..11', '11111.', '11..11', '11..11', '11111.'],
    'C': ['.1111.', '11..11', '11....', '11....', '11....', '11..11', '.1111.'],
    'D': ['11111.', '11..11', '11..11', '11..11', '11..11', '11..11', '11111.'],
    'Đ': ['.11111', '.11.11', '111111', '.11.11', '.11.11', '.11.11', '.11111'],
    'E': ['111111', '11....', '11....', '11111.', '11....', '11....', '111111'],
    'F': ['111111', '11....', '11....', '11111.', '11....', '11....', '11....'],
    'G': ['.1111.', '11..11', '11....', '11.111', '11..11', '11..11', '.1111.'],
    'H': ['11..11', '11..11', '11..11', '111111', '11..11', '11..11', '11..11'],
    'I': ['1111', '.11.', '.11.', '.11.', '.11.', '.11.', '1111'],
    'J': ['..1111', '....11', '....11', '....11', '11..11', '11..11', '.1111.'],
    'K': ['11..11', '11.111', '11111.', '1111..', '11111.', '11.111', '11..11'],
    'L': ['11....', '11....', '11....', '11....', '11....', '11....', '111111'],
    'M': ['11...11', '111.111', '1111111', '11.1.11', '11...11', '11...11', '11...11'],
    'N': ['11...11', '111..11', '1111.11', '11.1111', '11..111', '11...11', '11...11'],
    'O': ['.1111.', '11..11', '11..11', '11..11', '11..11', '11..11', '.1111.'],
    'P': ['11111.', '11..11', '11..11', '11111.', '11....', '11....', '11....'],
    'Q': ['.1111.', '11..11', '11..11', '11..11', '11.111', '11..11', '.11111'],
    'R': ['11111.', '11..11', '11..11', '11111.', '11111.', '11..11', '11..11'],
    'S': ['.11111', '11....', '1111..', '.1111.', '..1111', '....11', '11111.'],
    'T': ['111111', '111111', '..11..', '..11..', '..11..', '..11..', '..11..'],
    'U': ['11..11', '11..11', '11..11', '11..11', '11..11', '11..11', '.1111.'],
    'V': ['11..11', '11..11', '11..11', '11..11', '111111', '.1111.', '..11..'],
    'W': ['11...11', '11...11', '11...11', '11.1.11', '1111111', '111.111', '11...11'],
    'X': ['11..11', '111111', '.1111.', '..11..', '.1111.', '111111', '11..11'],
    'Y': ['11..11', '11..11', '111111', '.1111.', '..11..', '..11..', '..11..'],
    'Z': ['111111', '...111', '..111.', '.111..', '111...', '11....', '111111'],
    '0': ['.1111.', '11..11', '11..11', '11..11', '11..11', '11..11', '.1111.'],
    '1': ['.111.', '1111.', '..11.', '..11.', '..11.', '..11.', '11111'],
    '2': ['.1111.', '11..11', '...111', '..111.', '.111..', '111...', '111111'],
    '3': ['11111.', '....11', '..1111', '..111.', '..1111', '....11', '11111.'],
    '4': ['11..11', '11..11', '11..11', '111111', '....11', '....11', '....11'],
    '5': ['111111', '11....', '11111.', '....11', '....11', '11..11', '.1111.'],
    '6': ['.1111.', '11....', '11111.', '11..11', '11..11', '11..11', '.1111.'],
    '7': ['111111', '...111', '..111.', '..11..', '..11..', '..11..', '..11..'],
    '8': ['.1111.', '11..11', '11..11', '.1111.', '11..11', '11..11', '.1111.'],
    '9': ['.1111.', '11..11', '11..11', '.11111', '....11', '11..11', '.1111.'],
    '/': ['...111', '...11.', '..111.', '..11..', '.111..', '.11...', '111...'],
    '-': ['.....', '.....', '11111', '11111', '.....', '.....', '.....'],
    '.': ['..', '..', '..', '..', '..', '11', '11'],
    '!': ['11', '11', '11', '11', '..', '11', '11'],
    '?': ['.1111.', '11..11', '...111', '..111.', '..11..', '......', '..11..'],
    '&': ['.111..', '11.11.', '.111..', '111111', '11..11', '11..11', '.111.1'],
    '+': ['......', '..11..', '..11..', '111111', '..11..', '..11..', '......'],
    ':': ['..', '11', '11', '..', '11', '11', '..'],
    '♥': ['.11.11.', '1111111', '1111111', '1111111', '.11111.', '..111..', '...1...'],
    '★': ['...1...', '..111..', '1111111', '.11111.', '.11111.', '.11.11.', '11...11'],
    '✿': ['...1...', '1.111.1', '1111111', '1111111', '.11111.', '..111..', '.11111.']
  };

  function normalizeInlineSymbols(rawStr) {
    return String(rawStr || '')
      .replace(/<3/g, ' ♥ ')
      .replace(/❤️|♥️|❤|♥|💖|💗|💓|💕|💘/g, ' ♥ ')
      .replace(/★|☆|⭐|🌟|\*/g, ' ★ ')
      .replace(/🪷|🌸|🌺|🌼|🌻|✿/g, ' ✿ ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatDisplaySymbols(str) {
    return String(str || '')
      .replace(/♥/g, '❤️')
      .replace(/✿/g, '🪷');
  }

  function decomposeVietnameseChar(ch) {
    if (ch === 'Đ' || ch === 'đ') {
      return { base: 'Đ', mod: null, tone: null };
    }
    if (ch === '♥' || ch === '★' || ch === '✿') {
      return { base: ch, mod: null, tone: null };
    }
    const nfd = String(ch || '').toUpperCase().normalize('NFD');
    const base = nfd[0] || 'O';
    let mod = null;
    let tone = null;
    if (nfd.includes('\u0302')) mod = 'circumflex';
    else if (nfd.includes('\u0306')) mod = 'breve';
    else if (nfd.includes('\u031B')) mod = 'horn';

    if (nfd.includes('\u0301')) tone = 'sac';
    else if (nfd.includes('\u0300')) tone = 'huyen';
    else if (nfd.includes('\u0309')) tone = 'hoi';
    else if (nfd.includes('\u0303')) tone = 'nga';
    else if (nfd.includes('\u0323')) tone = 'nang';

    return { base, mod, tone };
  }

  function measurePixelLineCols(line, letterGap = 2, wordSpace = 4) {
    const words = String(line || '').trim().split(/\s+/).filter(Boolean);
    let totalW = 0;
    words.forEach((word, wi) => {
      if (wi > 0) totalW += wordSpace;
      const chars = [...word];
      chars.forEach((ch, ci) => {
        if (ci > 0) totalW += letterGap;
        const { base, mod } = decomposeVietnameseChar(ch);
        const glyph = GLYPHS_6[base] || GLYPHS_6['O'];
        totalW += glyph[0].length + (mod === 'horn' ? 1 : 0);
      });
    });
    return totalW;
  }

  function splitBalancedVietnameseLines(text) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1 || text.length <= 9) return [words.join(' ')];

    if (words.length <= 5 && text.length <= 24) {
      let bestK = 1;
      let bestMaxCols = 999;
      for (let k = 1; k < words.length; k++) {
        const l1 = words.slice(0, k).join(' ');
        const l2 = words.slice(k).join(' ');
        const w1 = measurePixelLineCols(l1, 2, 4);
        const w2 = measurePixelLineCols(l2, 2, 4);
        const maxW = Math.max(w1, w2) + Math.abs(w1 - w2) * 0.25;
        if (maxW < bestMaxCols) {
          bestMaxCols = maxW;
          bestK = k;
        }
      }
      return [words.slice(0, bestK).join(' '), words.slice(bestK).join(' ')];
    }

    let bestPair = [Math.ceil(words.length / 3), Math.ceil((words.length * 2) / 3)];
    let bestSpread = 999;
    for (let i = 1; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const len1 = measurePixelLineCols(words.slice(0, i).join(' '), 2, 4);
        const len2 = measurePixelLineCols(words.slice(i, j).join(' '), 2, 4);
        const len3 = measurePixelLineCols(words.slice(j).join(' '), 2, 4);
        const spread = Math.max(len1, len2, len3) + (Math.max(len1, len2, len3) - Math.min(len1, len2, len3)) * 0.35;
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

  function stampVietnameseCharToGrid(inkMask, peakScore, r0, c0, ch) {
    const rows = inkMask.length;
    const cols = inkMask[0].length;
    const { base, mod, tone } = decomposeVietnameseChar(ch);
    const glyph = GLYPHS_6[base] || GLYPHS_6['O'];
    const w = glyph[0].length;
    const stampedCells = [];

    const setP = (r, c) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (!inkMask[r][c]) {
          inkMask[r][c] = true;
          peakScore[r][c] = 255;
          stampedCells.push([r, c]);
        }
      }
    };

    for (let dr = 0; dr < glyph.length; dr++) {
      const rowStr = glyph[dr];
      for (let dc = 0; dc < w; dc++) {
        if (rowStr[dc] === '1') {
          setP(r0 + dr, c0 + dc);
        }
      }
    }

    if (mod === 'horn') {
      setP(r0 - 1, c0 + w - 1);
      setP(r0 - 1, c0 + w);
      setP(r0, c0 + w - 1);
      setP(r0, c0 + w);
      setP(r0 + 1, c0 + w);
    }

    const mid = Math.floor(w / 2);
    if (mod === 'circumflex') {
      setP(r0 - 3, c0 + mid - 1);
      setP(r0 - 3, c0 + mid);
      setP(r0 - 2, c0 + mid - 2);
      setP(r0 - 2, c0 + mid - 1);
      setP(r0 - 2, c0 + mid);
      setP(r0 - 2, c0 + mid + 1);
      if (tone === 'sac') {
        setP(r0 - 4, c0 + mid + 1);
        setP(r0 - 4, c0 + mid + 2);
        setP(r0 - 3, c0 + mid + 1);
      } else if (tone === 'huyen') {
        setP(r0 - 4, c0 + mid - 3);
        setP(r0 - 4, c0 + mid - 2);
        setP(r0 - 3, c0 + mid - 2);
      } else if (tone === 'hoi') {
        setP(r0 - 4, c0 + mid);
        setP(r0 - 4, c0 + mid + 1);
        setP(r0 - 3, c0 + mid + 1);
      } else if (tone === 'nga') {
        setP(r0 - 4, c0 + mid - 1);
        setP(r0 - 4, c0 + mid);
        setP(r0 - 4, c0 + mid + 1);
      }
    } else if (mod === 'breve') {
      setP(r0 - 3, c0 + mid - 2);
      setP(r0 - 3, c0 + mid + 1);
      setP(r0 - 2, c0 + mid - 2);
      setP(r0 - 2, c0 + mid - 1);
      setP(r0 - 2, c0 + mid);
      setP(r0 - 2, c0 + mid + 1);
      if (tone === 'sac') {
        setP(r0 - 4, c0 + mid + 1);
        setP(r0 - 4, c0 + mid + 2);
      } else if (tone === 'huyen') {
        setP(r0 - 4, c0 + mid - 3);
        setP(r0 - 4, c0 + mid - 2);
      } else if (tone === 'hoi' || tone === 'nga') {
        setP(r0 - 4, c0 + mid - 1);
        setP(r0 - 4, c0 + mid);
        setP(r0 - 3, c0 + mid - 1);
      }
    } else {
      if (tone === 'sac') {
        setP(r0 - 3, c0 + mid);
        setP(r0 - 3, c0 + mid + 1);
        setP(r0 - 3, c0 + mid + 2);
        setP(r0 - 2, c0 + mid - 1);
        setP(r0 - 2, c0 + mid);
        setP(r0 - 2, c0 + mid + 1);
      } else if (tone === 'huyen') {
        setP(r0 - 3, c0 + mid - 2);
        setP(r0 - 3, c0 + mid - 1);
        setP(r0 - 3, c0 + mid);
        setP(r0 - 2, c0 + mid - 1);
        setP(r0 - 2, c0 + mid);
        setP(r0 - 2, c0 + mid + 1);
      } else if (tone === 'hoi') {
        setP(r0 - 4, c0 + mid - 1);
        setP(r0 - 4, c0 + mid);
        setP(r0 - 4, c0 + mid + 1);
        setP(r0 - 3, c0 + mid);
        setP(r0 - 3, c0 + mid + 1);
        setP(r0 - 2, c0 + mid - 1);
        setP(r0 - 2, c0 + mid);
      } else if (tone === 'nga') {
        setP(r0 - 3, c0 + mid - 1);
        setP(r0 - 3, c0 + mid);
        setP(r0 - 3, c0 + mid + 1);
        setP(r0 - 3, c0 + mid + 2);
        setP(r0 - 2, c0 + mid - 2);
        setP(r0 - 2, c0 + mid - 1);
        setP(r0 - 2, c0 + mid);
      }
    }

    if (tone === 'nang') {
      setP(r0 + 8, c0 + mid - 1);
      setP(r0 + 8, c0 + mid);
      setP(r0 + 9, c0 + mid - 1);
      setP(r0 + 9, c0 + mid);
    }

    return {
      widthCols: w + (mod === 'horn' ? 1 : 0),
      cells: stampedCells
    };
  }

  function rasterizeVietnameseLinesToGrid(lines, hasDecor, customCols, customRows) {
    let letterGap = 2;
    let wordSpace = 4;
    let maxLineW = Math.max(...lines.map(l => measurePixelLineCols(l, letterGap, wordSpace)));

    if (maxLineW > 78) {
      letterGap = 1;
      wordSpace = 3;
      maxLineW = Math.max(...lines.map(l => measurePixelLineCols(l, letterGap, wordSpace)));
    }

    const cols = customCols || Math.max(66, Math.min(86, maxLineW + 6));
    const rows = customRows || (lines.length >= 3 ? 44 : 42);

    const inkMask = Array.from({ length: rows }, () => Array(cols).fill(false));
    const peakScore = Array.from({ length: rows }, () => Array(cols).fill(0));
    const charBlocks = [];

    let rowStarts;
    if (lines.length === 1) {
      rowStarts = [hasDecor ? 12 : 16];
    } else if (lines.length === 2) {
      rowStarts = hasDecor ? [5, 20] : [8, 25];
    } else {
      rowStarts = [5, 18, 31];
    }

    lines.forEach((line, lineIdx) => {
      const r0 = rowStarts[Math.min(lineIdx, rowStarts.length - 1)];
      const lineW = measurePixelLineCols(line, letterGap, wordSpace);
      let cursorC = Math.max(2, Math.floor((cols - lineW) / 2));
      const words = String(line || '').trim().split(/\s+/).filter(Boolean);

      words.forEach((word, wordIdx) => {
        if (wordIdx > 0) cursorC += wordSpace;
        const chars = [...word];
        chars.forEach((ch, charIdx) => {
          if (charIdx > 0) cursorC += letterGap;
          const stamped = stampVietnameseCharToGrid(inkMask, peakScore, r0, cursorC, ch);
          if (stamped.cells.length > 0) {
            charBlocks.push({
              ch,
              word,
              lineIdx,
              cells: stamped.cells
            });
          }
          cursorC += stamped.widthCols;
        });
      });
    });

    return { cols, rows, inkMask, peakScore, charBlocks };
  }

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

  window.GiaiMaPuzzleRasterizer = {
    DEFAULT_PRESETS,
    THEME_PALETTES,
    HIGH_CONTRAST_PALETTES,
    PAPER_SPECS,
    normalizeInlineSymbols,
    formatDisplaySymbols,
    decomposeVietnameseChar,
    measurePixelLineCols,
    splitBalancedVietnameseLines,
    stampVietnameseCharToGrid,
    rasterizeVietnameseLinesToGrid,
    traceOrthogonalLoop,
    findInscribedLabelCenter
  };
})();
