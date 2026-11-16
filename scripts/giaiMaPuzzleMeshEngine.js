/**
 * ==============================================================================
 * MODULE SINH MẢNH MA TRẬN TRANH (ĐA GIÁC / PIXEL / TỔ ONG) (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleMeshEngine.js
 * Trách nhiệm: Chuyển mặt nạ chữ Tiếng Việt thành các mảng ghép polygon, pixel
 * hoặc hexagon kèm mã đáp án đúng và mã gây nhiễu.
 * ==============================================================================
 */
(function () {
  'use strict';

  function buildHexagonMesh(ctx) {
    const { width, height, rows, cols, inkMask, qGrid, difficulty, correctAnswers, questionPaletteMeta, nearestQuestionIndex, distractorsByQ } = ctx;
    const puzzleCells = [];
    const R = 10.2;
    const hexW = Math.sqrt(3) * R;
    const vertStep = 1.5 * R;
    const hexCols = Math.ceil(width / hexW) + 1;
    const hexRows = Math.ceil(height / vertStep) + 1;

    const hexGrid = Array.from({ length: hexRows }, () => Array(hexCols).fill(null));
    for (let r = 0; r < hexRows; r++) {
      for (let c = 0; c < hexCols; c++) {
        const cx = Number(((c + 0.5 + (r % 2 === 1 ? 0.5 : 0)) * hexW).toFixed(1));
        const cy = Number((r * vertStep + R + 2).toFixed(1));
        if (cx < -R || cx > width + R || cy < -R || cy > height + R) continue;

        const sc = Math.min(cols - 1, Math.max(0, Math.floor((cx / width) * cols)));
        const sr = Math.min(rows - 1, Math.max(0, Math.floor((cy / height) * rows)));
        const isTgt = inkMask[sr][sc] && qGrid[sr][sc] >= 0;
        const grp = isTgt ? qGrid[sr][sc] : -1;

        const pts = [];
        for (let i = 0; i < 6; i++) {
          const angle = (60 * i + 30) * Math.PI / 180;
          pts.push(`${Number((cx + R * Math.cos(angle)).toFixed(1))} ${Number((cy + R * Math.sin(angle)).toFixed(1))}`);
        }
        hexGrid[r][c] = {
          r, c, cx, cy, sr, sc, isTgt, grp,
          d: `M ${pts.join(' L ')} Z`
        };
      }
    }

    const hexVisited = Array.from({ length: hexRows }, () => Array(hexCols).fill(false));
    const getHexNeighbors = (r, c) => {
      const odd = (r % 2 === 1);
      const deltas = odd
        ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
        : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
      return deltas
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nr < hexRows && nc >= 0 && nc < hexCols && hexGrid[nr][nc]);
    };

    let clusterIdx = 0;
    for (let r = 0; r < hexRows; r++) {
      for (let c = 0; c < hexCols; c++) {
        const seed = hexGrid[r][c];
        if (!seed || hexVisited[r][c]) continue;
        const maxCluster = difficulty === 'easy'
          ? (seed.isTgt ? 6 : 9)
          : (difficulty === 'hard' ? (seed.isTgt ? 2 : 3) : (seed.isTgt ? 4 : 6));
        const cluster = [seed];
        hexVisited[r][c] = true;

        while (cluster.length < maxCluster) {
          let nextHex = null;
          for (const item of cluster) {
            for (const [nr, nc] of getHexNeighbors(item.r, item.c)) {
              if (!hexVisited[nr][nc] && hexGrid[nr][nc].grp === seed.grp) {
                nextHex = hexGrid[nr][nc];
                break;
              }
            }
            if (nextHex) break;
          }
          if (!nextHex) break;
          hexVisited[nextHex.r][nextHex.c] = true;
          cluster.push(nextHex);
        }

        const avgX = cluster.reduce((s, h) => s + h.cx, 0) / cluster.length;
        const avgY = cluster.reduce((s, h) => s + h.cy, 0) / cluster.length;
        let centerHex = cluster[0];
        let bestDist = 1e9;
        cluster.forEach(h => {
          const dist = (h.cx - avgX) * (h.cx - avgX) + (h.cy - avgY) * (h.cy - avgY);
          if (dist < bestDist) {
            bestDist = dist;
            centerHex = h;
          }
        });

        const combinedD = cluster.map(h => h.d).join(' ');
        if (seed.isTgt) {
          const qIdx = Math.max(0, seed.grp);
          puzzleCells.push({
            id: `c_hex_${clusterIdx++}`,
            code: correctAnswers[qIdx],
            isTarget: true,
            targetColor: questionPaletteMeta[qIdx].color,
            d: combinedD,
            labelPos: [centerHex.cx, centerHex.cy],
            fontSize: 7.4
          });
        } else {
          const nearQ = nearestQuestionIndex(centerHex.sr, centerHex.sc);
          const traps = distractorsByQ[nearQ];
          puzzleCells.push({
            id: `c_hex_${clusterIdx++}`,
            code: traps[clusterIdx % traps.length],
            isTarget: false,
            d: combinedD,
            labelPos: [centerHex.cx, centerHex.cy],
            fontSize: 7.4
          });
        }
      }
    }
    return puzzleCells;
  }

  function buildPixelMesh(ctx) {
    const { rows, cols, cellW, cellH, inkMask, qGrid, difficulty, correctAnswers, questionPaletteMeta, nearestQuestionIndex, distractorsByQ } = ctx;
    const puzzleCells = [];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let pxCounter = 0;

    const canFitRect = (r0, c0, h, w, isTgt, grp) => {
      if (r0 + h > rows || c0 + w > cols) return false;
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          const rr = r0 + dr, cc = c0 + dc;
          if (visited[rr][cc]) return false;
          const cellTgt = inkMask[rr][cc] && qGrid[rr][cc] >= 0;
          if (cellTgt !== isTgt) return false;
          if (isTgt && qGrid[rr][cc] !== grp) return false;
        }
      }
      return true;
    };

    const tgtRectCandidates = difficulty === 'easy'
      ? [[3, 5], [5, 3], [3, 4], [4, 3], [2, 5], [2, 4], [4, 2], [3, 3], [2, 3], [3, 2], [2, 2]]
      : (difficulty === 'hard'
        ? [[2, 2], [1, 3], [3, 1], [1, 2], [2, 1]]
        : [[2, 4], [4, 2], [2, 3], [3, 2], [2, 2], [1, 3], [3, 1], [1, 2], [2, 1]]);
    const bgRectCandidates = difficulty === 'easy'
      ? [[4, 6], [3, 6], [4, 5], [3, 5], [3, 4], [4, 3], [2, 5], [3, 3], [2, 4], [2, 3]]
      : (difficulty === 'hard'
        ? [[2, 4], [3, 3], [2, 3], [3, 2], [2, 2], [1, 3], [1, 2]]
        : [[3, 5], [2, 5], [3, 4], [3, 3], [2, 4], [2, 3], [3, 2], [2, 2], [1, 3], [1, 2]]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visited[r][c]) continue;
        const isTgt = inkMask[r][c] && qGrid[r][c] >= 0;
        const grp = isTgt ? qGrid[r][c] : -1;
        let spanR = 1, spanC = 1;

        const cands = isTgt ? tgtRectCandidates : bgRectCandidates;
        for (const [h, w] of cands) {
          if (canFitRect(r, c, h, w, isTgt, grp)) {
            spanR = h;
            spanC = w;
            break;
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
          const qIdx = Math.max(0, grp);
          puzzleCells.push({
            id: `c_px_${pxCounter++}`,
            code: correctAnswers[qIdx],
            isTarget: true,
            targetColor: questionPaletteMeta[qIdx].color,
            d,
            labelPos: [lx, ly],
            fontSize: (spanC >= 2 && spanR >= 2) ? 8.2 : 7.2
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
            fontSize: (spanC >= 2 && spanR >= 2) ? 8.2 : 7.2
          });
        }
      }
    }
    return puzzleCells;
  }

  function buildPolygonMesh(ctx) {
    const {
      rows, cols, cellW, cellH, DIRS, inkMask, qGrid, difficulty,
      correctAnswers, questionPaletteMeta, nearestQuestionIndex, distractorsByQ,
      traceOrthogonalLoop, findInscribedLabelCenter
    } = ctx;
    const puzzleCells = [];
    const compVisited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const components = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (compVisited[r][c]) continue;
        const grp = (inkMask[r][c] && qGrid[r][c] >= 0) ? qGrid[r][c] : -1;
        const queue = [[r, c]];
        compVisited[r][c] = true;
        const cells = [];
        while (queue.length > 0) {
          const [cr, cc] = queue.shift();
          cells.push([cr, cc]);
          for (const [dr, dc] of DIRS) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !compVisited[nr][nc]) {
              const nGrp = (inkMask[nr][nc] && qGrid[nr][nc] >= 0) ? qGrid[nr][nc] : -1;
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
      const minSz = difficulty === 'easy'
        ? (isTgt ? 8 : 15)
        : (difficulty === 'hard' ? (isTgt ? 3 : 6) : (isTgt ? 5 : 10));
      const maxSz = difficulty === 'easy'
        ? (isTgt ? 22 : 34)
        : (difficulty === 'hard' ? (isTgt ? 7 : 12) : (isTgt ? 14 : 22));
      const maxSpanC = difficulty === 'easy' ? (isTgt ? 11 : 13) : (difficulty === 'hard' ? (isTgt ? 6 : 7) : (isTgt ? 8 : 10));
      const maxSpanR = difficulty === 'easy' ? (isTgt ? 8 : 8) : (difficulty === 'hard' ? (isTgt ? 5 : 5) : (isTgt ? 7 : 6));

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
            if (c1 - c0 + 1 > maxSpanC || r1 - r0 + 1 > maxSpanR) continue;
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
            if (combined.length <= maxSz + 6 && traceOrthogonalLoop(combined, cellW, cellH)) {
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
    return puzzleCells;
  }

  function generateMatrixFromText(rawText, questionCount = 10, customOptions = {}) {
    const R = window.GiaiMaPuzzleRasterizer;
    const {
      THEME_PALETTES,
      normalizeInlineSymbols,
      formatDisplaySymbols,
      splitBalancedVietnameseLines,
      rasterizeVietnameseLinesToGrid,
      traceOrthogonalLoop,
      findInscribedLabelCenter
    } = R;

    const cleanInput = (rawText || 'TRI ÂN THẦY CÔ 20/11').trim().toUpperCase();
    const normalizedText = normalizeInlineSymbols(cleanInput);
    const displayTitle = formatDisplaySymbols(normalizedText);
    const qCount = Math.max(5, Math.min(12, questionCount));
    const meshStyle = (customOptions && customOptions.meshStyle) ? customOptions.meshStyle : 'polygon';
    const decorMotif = (customOptions && customOptions.decorMotif) ? customOptions.decorMotif : 'auto';
    const difficulty = (customOptions && customOptions.difficulty) ? customOptions.difficulty : 'normal';

    if (meshStyle === 'polygon' && qCount === 10 && decorMotif === 'auto' && difficulty === 'normal' && window.GiaiMaPuzzle &&
        (cleanInput === 'TRI ÂN THẦY CÔ 20/11' || cleanInput === 'TRI ÂN THẦY CÔ 20-11')) {
      const useDash = (cleanInput === 'TRI ÂN THẦY CÔ 20-11') ||
        (cleanInput === 'TRI ÂN THẦY CÔ 20/11' && typeof window.GiaiMaPuzzle.getDateSeparatorStyle === 'function' && window.GiaiMaPuzzle.getDateSeparatorStyle() === 'dash' && !rawText);
      const chosenCells = useDash && window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        ? window.GiaiMaPuzzle.PUZZLE_CELLS_DASH
        : (window.GiaiMaPuzzle.PUZZLE_CELLS_SLASH || window.GiaiMaPuzzle.PUZZLE_CELLS);
      return {
        id: 'preset_trian_2011',
        title: useDash ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11',
        questionCount: 10,
        meshStyle: 'polygon',
        decorMotif: 'auto',
        difficulty: 'normal',
        cells: chosenCells,
        colorRules: window.GiaiMaPuzzle.COLOR_RULES,
        targetCellIds: chosenCells.filter(c => c.isTarget).map(c => c.id)
      };
    }

    const width = 800;
    const height = 520;
    const effectiveRasterText = (cleanInput === 'TRI ÂN THẦY CÔ 20/11' || cleanInput === 'TRI ÂN THẦY CÔ 20-11')
      ? cleanInput.replace('THẦY CÔ', 'THẦY ♥ CÔ')
      : normalizedText;
    const lines = splitBalancedVietnameseLines(effectiveRasterText);
    const hasDecor = (decorMotif !== 'none');

    const raster = rasterizeVietnameseLinesToGrid(lines, hasDecor, customOptions.cols, customOptions.rows);
    const { cols, rows, inkMask, peakScore, charBlocks } = raster;
    const cellW = width / cols;
    const cellH = height / rows;
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    const motifResult = (hasDecor && window.GiaiMaPuzzleDecorators && typeof window.GiaiMaPuzzleDecorators.applyMotifToMask === 'function')
      ? window.GiaiMaPuzzleDecorators.applyMotifToMask(inkMask, peakScore, rows, cols, displayTitle, decorMotif)
      : null;

    const letters = ['A', 'B', 'C', 'D'];
    const correctAnswers = [];
    const distractorsByQ = [];
    for (let i = 1; i <= qCount; i++) {
      const rightChar = letters[(i * 2 + 1) % 4];
      const rightCode = `${i}${rightChar}`;
      correctAnswers.push(rightCode);
      distractorsByQ.push(letters.filter(l => l !== rightChar).map(l => `${i}${l}`));
    }

    const hasTwoMotifGroups = Boolean(motifResult && motifResult.countPrimary > 0 && motifResult.countSecondary > 0 && qCount >= 8);
    const hasOneMotifGroup = Boolean(!hasTwoMotifGroups && motifResult && (motifResult.countPrimary + motifResult.countSecondary > 0) && qCount >= 5);
    const textQCount = hasTwoMotifGroups ? (qCount - 2) : (hasOneMotifGroup ? (qCount - 1) : qCount);

    const qGrid = Array.from({ length: rows }, () => Array(cols).fill(-1));
    const charsByQuestion = Array.from({ length: textQCount }, () => []);

    if (charBlocks.length > 0) {
      charBlocks.forEach((cb, idx) => {
        const qIdx = Math.min(textQCount - 1, Math.floor((idx * textQCount) / Math.max(1, charBlocks.length)));
        charsByQuestion[qIdx].push(cb.ch);
        cb.cells.forEach(([r, c]) => {
          qGrid[r][c] = qIdx;
        });
      });
    }

    const questionPaletteMeta = [];
    for (let i = 0; i < textQCount; i++) {
      const pal = THEME_PALETTES[i % THEME_PALETTES.length];
      const joinedChars = formatDisplaySymbols(charsByQuestion[i].join(''));
      questionPaletteMeta.push({
        color: pal.color,
        name: pal.name,
        part: joinedChars ? `Chữ "${joinedChars}"` : `Cụm chữ phần ${i + 1}/${textQCount}`
      });
    }
    if (hasTwoMotifGroups) {
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.primary));
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.secondary));
    } else if (hasOneMotifGroup) {
      questionPaletteMeta.push(Object.assign({}, motifResult.meta.primary));
    }

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

    const allTargetCoords = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (inkMask[r][c] && qGrid[r][c] >= 0) {
          allTargetCoords.push({ r, c });
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

    const meshCtx = {
      width, height, rows, cols, cellW, cellH, DIRS,
      inkMask, qGrid, difficulty, correctAnswers, questionPaletteMeta,
      nearestQuestionIndex, distractorsByQ, traceOrthogonalLoop, findInscribedLabelCenter
    };

    let puzzleCells;
    if (meshStyle === 'hexagon') {
      puzzleCells = buildHexagonMesh(meshCtx);
    } else if (meshStyle === 'pixel') {
      puzzleCells = buildPixelMesh(meshCtx);
    } else {
      puzzleCells = buildPolygonMesh(meshCtx);
    }

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
      title: displayTitle,
      questionCount: qCount,
      meshStyle: meshStyle,
      decorMotif: motifResult ? motifResult.motifKey : 'none',
      difficulty: difficulty,
      correctAnswers: correctAnswers,
      cells: puzzleCells,
      colorRules: colorRules,
      targetCellIds: puzzleCells.filter(c => c.isTarget).map(c => c.id)
    };
  }

  window.GiaiMaPuzzleMeshEngine = {
    generateMatrixFromText
  };
})();
