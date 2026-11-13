/**
 * ==============================================================================
 * MODULE QUÉT TÀI LIỆU 4 GÓC (PERSPECTIVE WARP / 4-CORNER KEYSTONING)
 * & SÂN KHẤU PHÓNG TO TOÀN MÀN HÌNH TRANH GIẤY 2 ĐỘI
 * File: scripts/giaiMaArtworkScanner.js
 * ==============================================================================
 */

(function () {
  'use strict';

  const studioState = {
    isOpen: false,
    mode: 'mobile', // 'mobile' | 'host'
    targetTeam: 'teamA',
    sourceImg: null,
    sourceDataUrl: null,
    resultDataUrl: null,
    // 4 góc chuẩn hóa [0..1] theo thứ tự: TL (0), TR (1), BR (2), BL (3)
    corners: [
      { x: 0.02, y: 0.02 },
      { x: 0.98, y: 0.02 },
      { x: 0.98, y: 0.98 },
      { x: 0.02, y: 0.98 }
    ],
    autoDetected: false,
    isEditingCorners: false,
    usePerspectiveWarp: true,
    forceLandscapeA1: false,
    aiEnhance: true,
    rotationDeg: 0,
    draggingCornerIdx: -1
  };

  const fullscreenState = {
    isOpen: false,
    activeTeam: 'teamA', // 'teamA' | 'teamB' | 'split'
    zoomScale: 1,
    fitMode: 'contain', // 'contain' | 'fill-width'
    panX: 0,
    panY: 0,
    isPanning: false,
    startPanX: 0,
    startPanY: 0
  };

  // ============================================================================
  // 1. THUẬT TOÁN TỰ ĐỘNG NHẬN DIỆN 4 GÓC TỜ GIẤY A1 BỊ MÉO HÌNH THANG
  // ============================================================================
  function detectDocumentCorners(img) {
    const defaultQuad = {
      detected: false,
      corners: [
        { x: 0.015, y: 0.015 },
        { x: 0.985, y: 0.015 },
        { x: 0.985, y: 0.985 },
        { x: 0.015, y: 0.985 }
      ]
    };

    try {
      const maxSide = 180;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) return defaultQuad;

      if (w > h) {
        h = Math.max(40, Math.round((h * maxSide) / w));
        w = maxSide;
      } else {
        w = Math.max(40, Math.round((w * maxSide) / h));
        h = maxSide;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h).data;

      // Đo đặc trưng màu của dải rìa ngoài cùng (mặt bàn học / nền xung quanh)
      let borderR = 0, borderG = 0, borderB = 0, borderLum = 0, borderCount = 0;
      const borderBand = Math.max(2, Math.floor(Math.min(w, h) * 0.04));

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (x < borderBand || x >= w - borderBand || y < borderBand || y >= h - borderBand) {
            const idx = (y * w + x) * 4;
            const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
            borderR += r;
            borderG += g;
            borderB += b;
            borderLum += 0.299 * r + 0.587 * g + 0.114 * b;
            borderCount++;
          }
        }
      }

      if (borderCount === 0) return defaultQuad;
      borderR /= borderCount;
      borderG /= borderCount;
      borderB /= borderCount;
      borderLum /= borderCount;

      // Đo đặc trưng vùng trung tâm ảnh (vùng tờ giấy A1)
      let centerLum = 0, centerCount = 0;
      let centerMaxLum = 0;
      const cx0 = Math.floor(w * 0.28), cx1 = Math.ceil(w * 0.72);
      const cy0 = Math.floor(h * 0.28), cy1 = Math.ceil(h * 0.72);

      for (let y = cy0; y < cy1; y++) {
        for (let x = cx0; x < cx1; x++) {
          const idx = (y * w + x) * 4;
          const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
          centerLum += lum;
          if (lum > centerMaxLum) centerMaxLum = lum;
          centerCount++;
        }
      }
      centerLum = centerCount > 0 ? centerLum / centerCount : 160;

      // Tạo mặt nạ nhị phân: 1 = thuộc tờ giấy A1, 0 = thuộc mặt bàn nền
      const mask = new Uint8Array(w * h);
      const lumThreshold = (borderLum + Math.max(centerLum, centerMaxLum * 0.85)) * 0.5;
      const isPaperBrighterThanDesk = (centerMaxLum - borderLum) > 22;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          const idx = p * 4;
          const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);

          const dr = r - borderR, dg = g - borderG, db = b - borderB;
          const distFromBorder = Math.sqrt(dr * dr + dg * dg + db * db);

          // Điểm thuộc tờ giấy: sáng hơn mặt bàn rõ rệt HOẶC có màu bút dạ khác biệt mạnh so với mặt bàn
          if ((isPaperBrighterThanDesk && lum >= lumThreshold) || distFromBorder > 44 || (chroma > 52 && distFromBorder > 30)) {
            mask[p] = 1;
          }
        }
      }

      // Lọc vùng liên thông từ tâm ảnh (Flood-fill BFS) để chỉ giữ đúng tờ giấy A1 ở giữa
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let qHead = 0, qTail = 0;

      // Gieo hạt từ lưới tâm ảnh
      for (let y = Math.floor(h * 0.35); y <= Math.floor(h * 0.65); y += 2) {
        for (let x = Math.floor(w * 0.35); x <= Math.floor(w * 0.65); x += 2) {
          const p = y * w + x;
          if (mask[p] === 1 && !visited[p]) {
            visited[p] = 1;
            queue[qTail++] = p;
          }
        }
      }

      while (qHead < qTail) {
        const curr = queue[qHead++];
        const cy = Math.floor(curr / w);
        const cx = curr - cy * w;

        // 4 hướng lân cận
        if (cx > 0 && mask[curr - 1] && !visited[curr - 1]) { visited[curr - 1] = 1; queue[qTail++] = curr - 1; }
        if (cx < w - 1 && mask[curr + 1] && !visited[curr + 1]) { visited[curr + 1] = 1; queue[qTail++] = curr + 1; }
        if (cy > 0 && mask[curr - w] && !visited[curr - w]) { visited[curr - w] = 1; queue[qTail++] = curr - w; }
        if (cy < h - 1 && mask[curr + w] && !visited[curr + w]) { visited[curr + w] = 1; queue[qTail++] = curr + w; }
      }

      const paperPixelCount = qTail;
      const areaRatio = paperPixelCount / (w * h);

      // Nếu vùng giấy chiếm quá ít (<15%) hoặc đã tràn kín ảnh (>93%), giữ toàn khung an toàn
      if (areaRatio < 0.15 || areaRatio > 0.93) {
        return defaultQuad;
      }

      // Tìm 4 đỉnh cực trị tứ giác [TL, TR, BR, BL] từ đám mây điểm tờ giấy
      let minSum = Infinity, maxSum = -Infinity;
      let minDiff = Infinity, maxDiff = -Infinity;
      let tl = { x: 0.05, y: 0.05 };
      let tr = { x: 0.95, y: 0.05 };
      let br = { x: 0.95, y: 0.95 };
      let bl = { x: 0.05, y: 0.95 };

      for (let i = 0; i < qTail; i++) {
        const p = queue[i];
        const py = Math.floor(p / w);
        const px = p - py * w;
        const nx = px / (w - 1);
        const ny = py / (h - 1);

        const sum = nx + ny;
        const diff = nx - ny;

        if (sum < minSum) { minSum = sum; tl = { x: nx, y: ny }; }
        if (diff > maxDiff) { maxDiff = diff; tr = { x: nx, y: ny }; }
        if (sum > maxSum) { maxSum = sum; br = { x: nx, y: ny }; }
        if (diff < minDiff) { minDiff = diff; bl = { x: nx, y: ny }; }
      }

      // Nới nhẹ 1.2% ra phía ngoài tâm để không cắt phạm vào mép viền khung tranh A1
      const pad = 0.012;
      const center = {
        x: (tl.x + tr.x + br.x + bl.x) / 4,
        y: (tl.y + tr.y + br.y + bl.y) / 4
      };
      const expand = (pt) => ({
        x: Math.max(0.005, Math.min(0.995, pt.x + Math.sign(pt.x - center.x) * pad)),
        y: Math.max(0.005, Math.min(0.995, pt.y + Math.sign(pt.y - center.y) * pad))
      });

      const corners = [expand(tl), expand(tr), expand(br), expand(bl)];

      if (!isValidConvexQuad(corners)) {
        return defaultQuad;
      }

      return {
        detected: true,
        corners
      };
    } catch (_err) {
      return defaultQuad;
    }
  }

  function isValidConvexQuad(pts) {
    if (!pts || pts.length !== 4) return false;
    // Diện tích Shoelace
    let area2 = 0;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      area2 += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    const area = Math.abs(area2) * 0.5;
    if (area < 0.14 || area > 0.98) return false;

    // Kiểm tra tích có hướng 4 cạnh cùng dấu (tứ giác lồi chuẩn) & chiều dài cạnh >= 0.2
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      const c = pts[(i + 2) % 4];
      const abx = b.x - a.x, aby = b.y - a.y;
      const bcx = c.x - b.x, bcy = c.y - b.y;
      const edgeLen = Math.hypot(abx, aby);
      if (edgeLen < 0.18) return false;
      const cross = abx * bcy - aby * bcx;
      if (Math.abs(cross) < 0.005) return false;
      const currSign = cross > 0 ? 1 : -1;
      if (sign === 0) sign = currSign;
      else if (sign !== currSign) return false;
    }
    return true;
  }

  // ============================================================================
  // 2. PHÉP BIẾN ĐỔI PHỐI CẢNH MA TRẬN HOMOGRAPHY 3x3 (PERSPECTIVE WARP)
  // ============================================================================
  function solveLinearSystem8x8(A, b) {
    const n = 8;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
      let pivot = col;
      let maxVal = Math.abs(M[col][col]);
      for (let row = col + 1; row < n; row++) {
        const val = Math.abs(M[row][col]);
        if (val > maxVal) {
          maxVal = val;
          pivot = row;
        }
      }
      if (maxVal < 1e-11) return null;
      if (pivot !== col) {
        const tmp = M[col];
        M[col] = M[pivot];
        M[pivot] = tmp;
      }

      const pivotVal = M[col][col];
      for (let j = col; j <= n; j++) {
        M[col][j] /= pivotVal;
      }

      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = M[row][col];
          if (Math.abs(factor) > 1e-12) {
            for (let j = col; j <= n; j++) {
              M[row][j] -= factor * M[col][j];
            }
          }
        }
      }
    }

    return M.map(row => row[n]);
  }

  /**
   * Tính ma trận Homography H biến đổi từ hình chữ nhật đích (0,0)->(dstW,dstH)
   * sang tứ giác nguồn srcPts = [TL, TR, BR, BL] trên ảnh chụp
   */
  function computeInverseHomography(dstW, dstH, srcPts) {
    const dstPts = [
      { u: 0, v: 0 },
      { u: dstW - 1, v: 0 },
      { u: dstW - 1, v: dstH - 1 },
      { u: 0, v: dstH - 1 }
    ];

    const A = [];
    const b = [];

    for (let i = 0; i < 4; i++) {
      const u = dstPts[i].u;
      const v = dstPts[i].v;
      const x = srcPts[i].x;
      const y = srcPts[i].y;

      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
      b.push(x);
      A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
      b.push(y);
    }

    return solveLinearSystem8x8(A, b);
  }

  /**
   * Nắn phẳng ảnh hình thang 4 góc thành hình chữ nhật phẳng chuẩn Scan
   */
  function warpPerspective(sourceImg, normCorners, options = {}) {
    const maxDim = options.maxDimension || 1400;
    const forceLandscapeA1 = Boolean(options.forceLandscapeA1);
    const rotationDeg = ((options.rotationDeg || 0) % 360 + 360) % 360;

    // Đưa ảnh nguồn lên canvas trung gian giới hạn để tối ưu RAM trên điện thoại
    const rawImgW = sourceImg.naturalWidth || sourceImg.width;
    const rawImgH = sourceImg.naturalHeight || sourceImg.height;
    const srcScale = Math.min(1, 1800 / Math.max(rawImgW, rawImgH));
    const srcW = Math.max(2, Math.round(rawImgW * srcScale));
    const srcH = Math.max(2, Math.round(rawImgH * srcScale));

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = srcW;
    srcCanvas.height = srcH;
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(sourceImg, 0, 0, srcW, srcH);

    let workCanvas;

    if (options.usePerspectiveWarp === false) {
      workCanvas = srcCanvas;
    } else {
      const pts = normCorners.map(c => ({
        x: c.x * (srcW - 1),
        y: c.y * (srcH - 1)
      }));

      const topW = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const botW = Math.hypot(pts[2].x - pts[3].x, pts[2].y - pts[3].y);
      const leftH = Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y);
      const rightH = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);

      let outW = Math.max(topW, botW);
      // Bù co ngắn chiều sâu khi chụp nghiêng hình thang (foreshortening compensation)
      const trapezoidRatio = Math.abs(botW - topW) / Math.max(1, Math.max(topW, botW));
      let outH = Math.max(leftH, rightH) * (1 + trapezoidRatio * 0.22);

      if (forceLandscapeA1) {
        // Chuẩn tỷ lệ ma trận tranh A1 nằm ngang (1.414 : 1)
        outW = Math.max(outW, outH * 1.414);
        outH = outW / 1.414;
      }

      const scaleOut = Math.min(1, maxDim / Math.max(outW, outH, 1));
      outW = Math.max(60, Math.round(outW * scaleOut));
      outH = Math.max(60, Math.round(outH * scaleOut));

      const H = computeInverseHomography(outW, outH, pts);
      if (!H) {
        workCanvas = srcCanvas;
      } else {
        const srcData = srcCtx.getImageData(0, 0, srcW, srcH).data;
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = outW;
        dstCanvas.height = outH;
        const dstCtx = dstCanvas.getContext('2d');
        const dstImgData = dstCtx.createImageData(outW, outH);
        const dstData = dstImgData.data;

        const h0 = H[0], h1 = H[1], h2 = H[2];
        const h3 = H[3], h4 = H[4], h5 = H[5];
        const h6 = H[6], h7 = H[7];
        const maxSrcX = srcW - 1.001;
        const maxSrcY = srcH - 1.001;

        let dstOffset = 0;
        for (let v = 0; v < outH; v++) {
          const rowX = h1 * v + h2;
          const rowY = h4 * v + h5;
          const rowW = h7 * v + 1;

          for (let u = 0; u < outW; u++) {
            const denom = h6 * u + rowW;
            let sx = (h0 * u + rowX) / denom;
            let sy = (h3 * u + rowY) / denom;

            if (sx < 0) sx = 0; else if (sx > maxSrcX) sx = maxSrcX;
            if (sy < 0) sy = 0; else if (sy > maxSrcY) sy = maxSrcY;

            // Nội suy song tuyến tính (Bilinear Interpolation) giữ nét chữ mã ô cực mịn
            const x0 = sx | 0;
            const y0 = sy | 0;
            const dx = sx - x0;
            const dy = sy - y0;
            const idx00 = (y0 * srcW + x0) * 4;
            const idx10 = idx00 + 4;
            const idx01 = idx00 + srcW * 4;
            const idx11 = idx01 + 4;

            const w00 = (1 - dx) * (1 - dy);
            const w10 = dx * (1 - dy);
            const w01 = (1 - dx) * dy;
            const w11 = dx * dy;

            dstData[dstOffset] = srcData[idx00] * w00 + srcData[idx10] * w10 + srcData[idx01] * w01 + srcData[idx11] * w11;
            dstData[dstOffset + 1] = srcData[idx00 + 1] * w00 + srcData[idx10 + 1] * w10 + srcData[idx01 + 1] * w01 + srcData[idx11 + 1] * w11;
            dstData[dstOffset + 2] = srcData[idx00 + 2] * w00 + srcData[idx10 + 2] * w10 + srcData[idx01 + 2] * w01 + srcData[idx11 + 2] * w11;
            dstData[dstOffset + 3] = 255;
            dstOffset += 4;
          }
        }

        dstCtx.putImageData(dstImgData, 0, 0);
        workCanvas = dstCanvas;
      }
    }

    // Xoay góc 90/180/270 nếu có
    if (rotationDeg !== 0) {
      const rotCanvas = document.createElement('canvas');
      const swap = (rotationDeg === 90 || rotationDeg === 270);
      rotCanvas.width = swap ? workCanvas.height : workCanvas.width;
      rotCanvas.height = swap ? workCanvas.width : workCanvas.height;
      const rCtx = rotCanvas.getContext('2d');
      rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rCtx.rotate((rotationDeg * Math.PI) / 180);
      rCtx.drawImage(workCanvas, -workCanvas.width / 2, -workCanvas.height / 2);
      workCanvas = rotCanvas;
    }

    // Áp dụng Canvas AI Filter làm sáng & rực rỡ màu bút dạ
    if (options.aiEnhance !== false && window.GiaiMaBiMat && typeof window.GiaiMaBiMat.applyCanvasAiEnhance === 'function') {
      window.GiaiMaBiMat.applyCanvasAiEnhance(workCanvas);
    }

    return workCanvas;
  }

  // ============================================================================
  // 3. STUDIO QUÉT 4 GÓC & GỬI TRANH TOÀN MÀN HÌNH (DÙNG CHO CẢ MOBILE & HOST)
  // ============================================================================
  function openScannerWithFile(file, mode = 'mobile', targetTeam = 'teamA') {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      openScannerWithDataUrl(ev.target.result, mode, targetTeam);
    };
    reader.readAsDataURL(file);
  }

  function openScannerWithDataUrl(dataUrl, mode = 'mobile', targetTeam = 'teamA') {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      studioState.isOpen = true;
      studioState.mode = mode;
      studioState.targetTeam = targetTeam;
      studioState.sourceImg = img;
      studioState.sourceDataUrl = dataUrl;
      studioState.rotationDeg = 0;
      studioState.aiEnhance = true;
      studioState.usePerspectiveWarp = true;
      studioState.forceLandscapeA1 = false;
      studioState.isEditingCorners = false;

      // Tự động dò 4 góc hình thang
      const detection = detectDocumentCorners(img);
      studioState.corners = detection.corners;
      studioState.autoDetected = detection.detected;

      const modal = document.getElementById('gmmScannerStudioModal');
      if (modal) modal.style.display = 'flex';

      updateStudioModalTexts();
      rebuildWarpedPreview();
    };
    img.onerror = () => {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể đọc tệp hình ảnh, vui lòng chọn ảnh khác!', 'error');
      }
    };
    img.src = dataUrl;
  }

  function closeScannerModal() {
    studioState.isOpen = false;
    const modal = document.getElementById('gmmScannerStudioModal');
    if (modal) modal.style.display = 'none';
  }

  function updateStudioModalTexts() {
    const teamLabel = studioState.targetTeam === 'teamB' ? 'ĐỘI 2 (ĐỘI B)' : 'ĐỘI 1 (ĐỘI A)';
    const titleEl = document.getElementById('gmmScannerTitle');
    const submitTxt = document.getElementById('gmmScannerSubmitText');
    const statusBanner = document.getElementById('gmmScannerAiStatus');

    if (titleEl) {
      titleEl.textContent = `📐 QUÉT & NẮN PHẲNG TRANH A1 - ${teamLabel}`;
    }
    if (submitTxt) {
      submitTxt.textContent = studioState.mode === 'host'
        ? `✅ GẮN VÀO BẢNG TRANH ${teamLabel} & PHÓNG TO`
        : `🚀 GỬI TRANH LÊN MÁY CHIẾU (${teamLabel})`;
    }
    if (statusBanner) {
      statusBanner.textContent = studioState.autoDetected
        ? '✨ AI đã tự động nhận diện 4 góc giấy A1, nắn phẳng hình thang & làm sáng màu!'
        : '✨ AI đã tự động làm sáng tranh! Bấm [📐 Chỉnh 4 Góc] nếu muốn cắt viền mặt bàn.';
    }
  }

  function rebuildWarpedPreview() {
    if (!studioState.sourceImg) return;

    const resultImg = document.getElementById('gmmScannerResultImg');
    const resultView = document.getElementById('gmmScannerResultStage');
    const cropView = document.getElementById('gmmScannerCropStage');
    const btnEditCorners = document.getElementById('gmmBtnToggleCornerEdit');
    const btnAi = document.getElementById('gmmScannerBtnAi');
    const btnA1 = document.getElementById('gmmScannerBtnA1Ratio');

    if (btnAi) btnAi.classList.toggle('active', studioState.aiEnhance);
    if (btnA1) btnA1.classList.toggle('active', studioState.forceLandscapeA1);
    if (btnEditCorners) {
      btnEditCorners.classList.toggle('active', studioState.isEditingCorners);
      btnEditCorners.innerHTML = studioState.isEditingCorners
        ? '<span>✅ Xong! Áp Dụng Nắn 4 Góc</span>'
        : '<span>📐 Chỉnh 4 Góc Giấy</span>';
    }

    if (studioState.isEditingCorners) {
      if (resultView) resultView.style.display = 'none';
      if (cropView) cropView.style.display = 'flex';
      renderInteractiveCornerCanvas();
      return;
    }

    if (cropView) cropView.style.display = 'none';
    if (resultView) resultView.style.display = 'flex';

    const outCanvas = warpPerspective(studioState.sourceImg, studioState.corners, {
      maxDimension: 1400,
      usePerspectiveWarp: studioState.usePerspectiveWarp,
      forceLandscapeA1: studioState.forceLandscapeA1,
      aiEnhance: studioState.aiEnhance,
      rotationDeg: studioState.rotationDeg
    });

    studioState.resultDataUrl = outCanvas.toDataURL('image/jpeg', 0.86);
    if (resultImg) {
      resultImg.src = studioState.resultDataUrl;
    }
  }

  function toggleCornerEditor() {
    studioState.isEditingCorners = !studioState.isEditingCorners;
    if (!studioState.isEditingCorners) {
      studioState.usePerspectiveWarp = true;
    }
    rebuildWarpedPreview();
  }

  function autoDetectAgain() {
    if (!studioState.sourceImg) return;
    const det = detectDocumentCorners(studioState.sourceImg);
    studioState.corners = det.corners;
    studioState.autoDetected = det.detected;
    studioState.usePerspectiveWarp = true;
    if (studioState.isEditingCorners) {
      renderInteractiveCornerCanvas();
    } else {
      rebuildWarpedPreview();
    }
    if (typeof window.showToast === 'function') {
      window.showToast(det.detected ? '🤖 Đã tự động bắt lại 4 góc mép giấy A1!' : '📐 Đã đặt khung 4 góc sát lề ảnh!', 'info');
    }
  }

  function selectFullOriginalFrame() {
    studioState.corners = [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 }
    ];
    studioState.usePerspectiveWarp = false;
    studioState.isEditingCorners = false;
    rebuildWarpedPreview();
    if (typeof window.showToast === 'function') {
      window.showToast('⬜ Đã chọn giữ nguyên toàn bộ khung ảnh gốc!', 'info');
    }
  }

  function toggleStudioAi() {
    studioState.aiEnhance = !studioState.aiEnhance;
    rebuildWarpedPreview();
  }

  function toggleStudioA1Landscape() {
    studioState.forceLandscapeA1 = !studioState.forceLandscapeA1;
    studioState.usePerspectiveWarp = true;
    rebuildWarpedPreview();
  }

  function rotateStudio90() {
    studioState.rotationDeg = (studioState.rotationDeg + 90) % 360;
    rebuildWarpedPreview();
  }

  // Vẽ khung dây 4 góc kéo thả trực tiếp bằng ngón tay hoặc chuột
  function renderInteractiveCornerCanvas() {
    const canvas = document.getElementById('gmmScannerCornerCanvas');
    const container = document.getElementById('gmmScannerCropStage');
    if (!canvas || !container || !studioState.sourceImg) return;

    const rect = container.getBoundingClientRect();
    const availW = Math.max(260, (rect.width || window.innerWidth) - 24);
    const availH = Math.max(240, (rect.height || window.innerHeight * 0.58) - 56);

    const imgW = studioState.sourceImg.naturalWidth || studioState.sourceImg.width;
    const imgH = studioState.sourceImg.naturalHeight || studioState.sourceImg.height;
    const scale = Math.min(availW / imgW, availH / imgH);

    const drawW = Math.round(imgW * scale);
    const drawH = Math.round(imgH * scale);
    canvas.width = drawW;
    canvas.height = drawH;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, drawW, drawH);
    ctx.drawImage(studioState.sourceImg, 0, 0, drawW, drawH);

    const pts = studioState.corners.map(c => ({ x: c.x * drawW, y: c.y * drawH }));

    // Lớp tối mờ bên ngoài tứ giác
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, drawW, drawH);
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.fill('evenodd');
    ctx.restore();

    // Đường viền tứ giác xanh ngọc phát sáng
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 4 nút kéo tròn lớn ở 4 góc
    const labels = ['1', '2', '3', '4'];
    pts.forEach((pt, idx) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = idx === studioState.draggingCornerIdx ? '#facc15' : '#0284c7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = idx === studioState.draggingCornerIdx ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[idx], pt.x, pt.y);
      ctx.restore();
    });
  }

  function bindCornerCanvasDragEvents() {
    const canvas = document.getElementById('gmmScannerCornerCanvas');
    if (!canvas || canvas.dataset.bound === '1') return;
    canvas.dataset.bound = '1';

    const getNormPos = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const nx = Math.max(0.0, Math.min(1.0, (clientX - r.left) / Math.max(1, r.width)));
      const ny = Math.max(0.0, Math.min(1.0, (clientY - r.top) / Math.max(1, r.height)));
      return { x: nx, y: ny, px: clientX - r.left, py: clientY - r.top, rw: r.width, rh: r.height };
    };

    const onDown = (clientX, clientY, ev) => {
      const pos = getNormPos(clientX, clientY);
      let bestIdx = -1;
      let bestDist = 48; // Bán kính bắt chạm 48px cực nhạy trên cảm ứng điện thoại
      studioState.corners.forEach((c, idx) => {
        const cx = c.x * pos.rw;
        const cy = c.y * pos.rh;
        const d = Math.hypot(pos.px - cx, pos.py - cy);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      if (bestIdx !== -1) {
        studioState.draggingCornerIdx = bestIdx;
        if (ev && ev.cancelable) ev.preventDefault();
        renderInteractiveCornerCanvas();
      }
    };

    const onMove = (clientX, clientY, ev) => {
      if (studioState.draggingCornerIdx === -1) return;
      if (ev && ev.cancelable) ev.preventDefault();
      const pos = getNormPos(clientX, clientY);
      studioState.corners[studioState.draggingCornerIdx] = { x: pos.x, y: pos.y };
      renderInteractiveCornerCanvas();
    };

    const onUp = () => {
      if (studioState.draggingCornerIdx !== -1) {
        studioState.draggingCornerIdx = -1;
        studioState.usePerspectiveWarp = true;
        renderInteractiveCornerCanvas();
      }
    };

    canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY, e));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY, e));
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY, e);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY, e);
    }, { passive: false });
    canvas.addEventListener('touchend', onUp);
  }

  async function confirmAndSubmitStudio() {
    // Nếu người dùng đang đứng ở màn hình kéo 4 góc mà bấm Gửi luôn -> Tự động áp dụng nắn 4 góc trước khi gửi!
    if (studioState.isEditingCorners) {
      studioState.isEditingCorners = false;
      studioState.usePerspectiveWarp = true;
      rebuildWarpedPreview();
    }

    if (!studioState.resultDataUrl) {
      rebuildWarpedPreview();
    }

    const finalPhoto = studioState.resultDataUrl;
    if (!finalPhoto) return;

    const btn = document.getElementById('gmmScannerBtnSubmit');
    const txt = document.getElementById('gmmScannerSubmitText');
    const origLabel = txt ? txt.textContent : '';

    if (btn) btn.disabled = true;
    if (txt) txt.textContent = '⏳ ĐANG TRUYỀN ẢNH LÊN MÁY CHIẾU...';

    try {
      const team = studioState.targetTeam || 'teamA';
      const ts = Date.now();

      // Nếu là máy chiếu của Thầy thao tác trực tiếp -> lưu lên server lấy timestamp chuẩn rồi gắn vào UI máy chiếu
      if (studioState.mode === 'host' && window.GiaiMaBiMat && typeof window.GiaiMaBiMat.attachTeamArtworkPhoto === 'function') {
        let serverTs = ts;
        try {
          const hostResp = await fetch('/api/gmm/upload-artwork', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, photoData: finalPhoto, timestamp: ts })
          });
          if (hostResp.ok) {
            const hostRes = await hostResp.json();
            if (hostRes && hostRes.timestamp) serverTs = hostRes.timestamp;
          }
        } catch (_e) {}
        window.GiaiMaBiMat.attachTeamArtworkPhoto(team, finalPhoto, serverTs);
        closeScannerModal();
        return;
      }

      // Gửi từ điện thoại học sinh lên Server Máy Chiếu
      const resp = await fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team,
          photoData: finalPhoto,
          timestamp: ts
        })
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const res = await resp.json();
      if (!res || !res.success) {
        throw new Error(res?.error || 'Máy chủ từ chối ảnh');
      }

      // Hiển thị trạng thái đã gửi thành công trên cả 2 màn hình Mobile (Quiz & Paint)
      document.querySelectorAll('.gmm-mob-sent-thumb').forEach(imgEl => {
        imgEl.src = finalPhoto;
      });
      document.querySelectorAll('.gmm-mob-upload-success').forEach(box => {
        box.style.display = 'block';
      });

      if (window.audioManager && typeof window.audioManager.playChime === 'function') {
        window.audioManager.playChime();
      }
      if (typeof window.showToast === 'function') {
        const teamVi = team === 'teamB' ? 'Đội 2' : 'Đội 1';
        window.showToast(`🎉 Đã gửi tranh của ${teamVi} lên màn hình máy chiếu của Thầy/Cô thành công!`, 'success');
      }

      closeScannerModal();
    } catch (err) {
      if (typeof window.showToast === 'function') {
        window.showToast(`❌ Gửi chưa thành công (${err.message}). Vui lòng kiểm tra Wi-Fi và bấm Gửi lại!`, 'error');
      }
    } finally {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = origLabel;
    }
  }

  // ============================================================================
  // 4. SÂN KHẤU PHÓNG TO FULL MÀN HÌNH TÁC PHẨM TRANH CỦA TỪNG ĐỘI (HOST)
  // ============================================================================
  function openTeamFullscreen(teamOrMode = 'teamA') {
    fullscreenState.isOpen = true;
    fullscreenState.activeTeam = teamOrMode;
    fullscreenState.zoomScale = 1;
    fullscreenState.panX = 0;
    fullscreenState.panY = 0;

    const modal = document.getElementById('gmmArtworkFullscreenModal');
    if (modal) {
      modal.style.display = 'flex';
    }
    renderTeamFullscreenView();
  }

  function closeTeamFullscreen() {
    fullscreenState.isOpen = false;
    const modal = document.getElementById('gmmArtworkFullscreenModal');
    if (modal) modal.style.display = 'none';
  }

  function switchFullscreenTarget(target) {
    fullscreenState.activeTeam = target;
    fullscreenState.zoomScale = 1;
    fullscreenState.panX = 0;
    fullscreenState.panY = 0;
    renderTeamFullscreenView();
  }

  function changeFullscreenZoom(delta) {
    fullscreenState.zoomScale = Math.max(0.5, Math.min(3.5, Math.round((fullscreenState.zoomScale + delta) * 100) / 100));
    if (fullscreenState.zoomScale <= 1) {
      fullscreenState.panX = 0;
      fullscreenState.panY = 0;
    }
    applyFullscreenZoomTransform();
  }

  function resetFullscreenZoom() {
    fullscreenState.zoomScale = 1;
    fullscreenState.panX = 0;
    fullscreenState.panY = 0;
    applyFullscreenZoomTransform();
  }

  function toggleFullscreenFitMode() {
    fullscreenState.fitMode = fullscreenState.fitMode === 'contain' ? 'fill-width' : 'contain';
    fullscreenState.zoomScale = 1;
    fullscreenState.panX = 0;
    fullscreenState.panY = 0;
    renderTeamFullscreenView();
  }

  function applyFullscreenZoomTransform() {
    const lbl = document.getElementById('gmmFsZoomPercent');
    if (lbl) lbl.textContent = `${Math.round(fullscreenState.zoomScale * 100)}%`;

    document.querySelectorAll('.gmm-fs-zoomable-img').forEach(img => {
      const baseRot = Number(img.dataset.rot || 0);
      img.style.transform = `translate(${fullscreenState.panX}px, ${fullscreenState.panY}px) scale(${fullscreenState.zoomScale}) rotate(${baseRot}deg)`;
    });
  }

  function editCurrentFullscreenCorners(teamKey) {
    const tKey = teamKey || (fullscreenState.activeTeam === 'teamB' ? 'teamB' : 'teamA');
    const photo = window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamArtworkPhoto === 'function'
      ? window.GiaiMaBiMat.getTeamArtworkPhoto(tKey)
      : null;
    if (!photo) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Đội này chưa có ảnh tranh để căn chỉnh 4 góc!', 'warning');
      }
      return;
    }
    openScannerWithDataUrl(photo, 'host', tKey);
    // Chuyển sẵn sang màn hình kéo 4 góc để Thầy chỉnh trực tiếp
    studioState.isEditingCorners = true;
    setTimeout(() => rebuildWarpedPreview(), 60);
  }

  function renderSingleTeamCardHtml(teamKey, isSplit) {
    const info = window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamPhotoMeta === 'function'
      ? window.GiaiMaBiMat.getTeamPhotoMeta(teamKey)
      : { photo: null, rotation: 0, tilt: 0, isAi: true };

    const teamTitle = teamKey === 'teamA' ? '🔴 TRANH GIẤY ĐỘI 1 (ĐỘI A)' : '🔵 TRANH GIẤY ĐỘI 2 (ĐỘI B)';
    const borderColor = teamKey === 'teamA' ? 'rgba(239, 68, 68, 0.55)' : 'rgba(59, 130, 246, 0.55)';

    if (!info.photo) {
      return `
        <div class="gmm-fs-empty-box" style="border-color: ${borderColor};">
          <div style="font-size: 3rem; margin-bottom: 10px;">📷</div>
          <h3 style="margin: 0 0 8px; color: #f8fafc;">${teamTitle} - CHƯA GỬI ẢNH</h3>
          <p style="color: #94a3b8; font-size: 0.92rem; margin: 0 0 16px;">Đang chờ học sinh gửi từ điện thoại hoặc Thầy/Cô chọn ảnh từ máy tính:</p>
          <label class="gmm-host-upload-label" style="font-size: 0.95rem; padding: 10px 20px;">
            <span>📁 Tải Ảnh Từ Máy Tính Cho ${teamKey === 'teamA' ? 'Đội 1' : 'Đội 2'}</span>
            <input type="file" accept="image/*" style="display: none;" onchange="GiaiMaBiMat.handleHostPhotoUpload('${teamKey}', event)">
          </label>
        </div>
      `;
    }

    const totalRot = (info.rotation || 0) + (info.tilt || 0);
    const fitStyle = fullscreenState.fitMode === 'fill-width'
      ? 'width: 96%; height: auto; max-height: none;'
      : 'max-width: 98%; max-height: 100%; width: auto; height: auto; object-fit: contain;';

    return `
      <div class="gmm-fs-stage-pane ${fullscreenState.fitMode === 'fill-width' ? 'scrollable' : ''}" style="${isSplit ? `border: 2px solid ${borderColor}; border-radius: 14px;` : ''}">
        ${isSplit ? `<div class="gmm-fs-split-badge ${teamKey === 'teamA' ? 'team-a' : 'team-b'}">${teamTitle}</div>` : ''}
        <img src="${info.photo}"
             alt="${teamTitle}"
             data-rot="${totalRot}"
             class="gmm-fs-zoomable-img ${info.isAi ? 'gmm-ai-enhanced-img' : ''}"
             style="${fitStyle} border-radius: 10px; box-shadow: 0 16px 50px rgba(0,0,0,0.85); transform: translate(${fullscreenState.panX}px, ${fullscreenState.panY}px) scale(${fullscreenState.zoomScale}) rotate(${totalRot}deg);">
      </div>
    `;
  }

  function renderTeamFullscreenView() {
    const stage = document.getElementById('gmmFsStageBody');
    const btnA = document.getElementById('gmmFsTabTeamA');
    const btnB = document.getElementById('gmmFsTabTeamB');
    const btnSplit = document.getElementById('gmmFsTabSplit');
    const btnFit = document.getElementById('gmmFsBtnFitMode');
    const singleTools = document.getElementById('gmmFsSingleTeamActions');

    if (!stage) return;

    const metaA = window.GiaiMaBiMat?.getTeamPhotoMeta ? window.GiaiMaBiMat.getTeamPhotoMeta('teamA') : {};
    const metaB = window.GiaiMaBiMat?.getTeamPhotoMeta ? window.GiaiMaBiMat.getTeamPhotoMeta('teamB') : {};

    if (btnA) {
      btnA.classList.toggle('active', fullscreenState.activeTeam === 'teamA');
      btnA.innerHTML = `🔴 Full Đội 1 ${metaA.photo ? '<span style="color:#4ade80;">●</span>' : ''}`;
    }
    if (btnB) {
      btnB.classList.toggle('active', fullscreenState.activeTeam === 'teamB');
      btnB.innerHTML = `🔵 Full Đội 2 ${metaB.photo ? '<span style="color:#4ade80;">●</span>' : ''}`;
    }
    if (btnSplit) {
      btnSplit.classList.toggle('active', fullscreenState.activeTeam === 'split');
    }
    if (btnFit) {
      btnFit.textContent = fullscreenState.fitMode === 'fill-width' ? '🔲 Thu Vừa Màn Hình' : '↔️ Phóng Đầy Chiều Ngang';
    }

    if (fullscreenState.activeTeam === 'split') {
      if (singleTools) singleTools.style.display = 'none';
      stage.innerHTML = `
        <div class="gmm-fs-split-grid">
          ${renderSingleTeamCardHtml('teamA', true)}
          ${renderSingleTeamCardHtml('teamB', true)}
        </div>
      `;
    } else {
      const tKey = fullscreenState.activeTeam === 'teamB' ? 'teamB' : 'teamA';
      const tMeta = tKey === 'teamB' ? metaB : metaA;
      const tLabel = tKey === 'teamB' ? 'Đội 2' : 'Đội 1';

      if (singleTools) {
        singleTools.style.display = 'inline-flex';
        singleTools.innerHTML = `
          <button type="button" class="gmm-fs-tool-btn" onclick="GiaiMaArtworkScanner.editCurrentFullscreenCorners('${tKey}')" title="Nắn phẳng 4 góc hình thang">📐 Nắn 4 Góc</button>
          <button type="button" class="gmm-fs-tool-btn" onclick="GiaiMaBiMat.rotateArtworkPhoto('${tKey}'); GiaiMaArtworkScanner.renderTeamFullscreenView();" title="Xoay 90 độ">🔄 Xoay 90°</button>
          <button type="button" class="gmm-fs-tool-btn ${tMeta.isAi ? 'active-ai' : ''}" onclick="GiaiMaBiMat.toggleAiArtworkFilter('${tKey}'); GiaiMaArtworkScanner.renderTeamFullscreenView();">✨ AI Sáng</button>
          <button type="button" class="gmm-fs-tool-btn approve" onclick="GiaiMaBiMat.approvePaperArtwork('${tKey}')">✅ Duyệt ${tLabel} (+10đ)</button>
        `;
      }
      stage.innerHTML = renderSingleTeamCardHtml(tKey, false);
    }

    const lbl = document.getElementById('gmmFsZoomPercent');
    if (lbl) lbl.textContent = `${Math.round(fullscreenState.zoomScale * 100)}%`;
  }

  function bindFullscreenWheelAndPan() {
    const stage = document.getElementById('gmmFsStageBody');
    if (!stage || stage.dataset.bound === '1') return;
    stage.dataset.bound = '1';

    stage.addEventListener('wheel', (e) => {
      if (!fullscreenState.isOpen) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      changeFullscreenZoom(delta);
    }, { passive: false });

    stage.addEventListener('mousedown', (e) => {
      if (!fullscreenState.isOpen || fullscreenState.zoomScale <= 1) return;
      fullscreenState.isPanning = true;
      fullscreenState.startPanX = e.clientX - fullscreenState.panX;
      fullscreenState.startPanY = e.clientY - fullscreenState.panY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!fullscreenState.isPanning) return;
      fullscreenState.panX = e.clientX - fullscreenState.startPanX;
      fullscreenState.panY = e.clientY - fullscreenState.startPanY;
      applyFullscreenZoomTransform();
    });
    window.addEventListener('mouseup', () => {
      fullscreenState.isPanning = false;
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (studioState.isOpen) {
        closeScannerModal();
      } else if (fullscreenState.isOpen) {
        closeTeamFullscreen();
      }
    }
  });

  function initScannerBindings() {
    bindCornerCanvasDragEvents();
    bindFullscreenWheelAndPan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScannerBindings);
  } else {
    setTimeout(initScannerBindings, 50);
  }

  window.GiaiMaArtworkScanner = {
    detectDocumentCorners,
    warpPerspective,
    openScannerWithFile,
    openScannerWithDataUrl,
    closeScannerModal,
    toggleCornerEditor,
    autoDetectAgain,
    selectFullOriginalFrame,
    toggleStudioAi,
    toggleStudioA1Landscape,
    rotateStudio90,
    confirmAndSubmitStudio,
    openTeamFullscreen,
    closeTeamFullscreen,
    switchFullscreenTarget,
    changeFullscreenZoom,
    resetFullscreenZoom,
    toggleFullscreenFitMode,
    editCurrentFullscreenCorners,
    renderTeamFullscreenView,
    isFullscreenOpen: () => fullscreenState.isOpen,
    initScannerBindings
  };
})();
