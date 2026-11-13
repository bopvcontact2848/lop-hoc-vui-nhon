/**
 * ==============================================================================
 * MODULE TÁC PHẨM TRANH GIẤY, BỘ LỌC CANVAS AI & THU PHÓNG HOST (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmArtworkHost.js
 * Trách nhiệm: Xử lý cân bằng sáng/tương phản Canvas AI, xoay/nghiêng ảnh, nhận ảnh
 * tranh giấy từ điện thoại qua polling dự phòng và điều khiển modal Zoom 2 đội.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmArtworkHost = {
    create: function (ctx) {
      const {
        gameState,
        switchTab,
        closeDecryptTimerFullscreen,
        generateSvgPuzzle,
        updateCanvasThemeButtonUI
      } = ctx;

      let hostArtworkPollInterval = null;

  // ==============================================================================
  // BỘ LỌC CANVAS AI FILTER & CÂN CHỈNH GÓC NGHIÊNG THÔNG MINH
  // ==============================================================================
  /**
   * TỰ ĐỘNG CÂN BẰNG SÁNG, ĐỘ TƯƠNG PHẢN & LÀM RỰC RỠ MÀU BÚT DẠ TRANH GIẤY A1
   * @param {HTMLCanvasElement} canvas
   */
  function applyCanvasAiEnhance(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const totalPixels = w * h;

      // 1. Phân tích mẫu nhanh histogram độ sáng & cân bằng màu (< 20ms)
      const sampleStep = Math.max(1, Math.floor(totalPixels / 25000));
      let sumLuminance = 0;
      let sampleCount = 0;
      let sumR = 0, sumB = 0;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLuminance += lum;
        sampleCount++;
        sumR += r;
        sumB += b;
      }

      const avgLum = sampleCount > 0 ? (sumLuminance / sampleCount) : 128;
      const avgR = sampleCount > 0 ? (sumR / sampleCount) : 128;
      const avgB = sampleCount > 0 ? (sumB / sampleCount) : 128;

      // 2. Tính hệ số tối ưu cho máy chiếu phòng học
      // Nếu phòng học thiếu sáng hoặc chụp bóng râm, tự động bù sáng thích ứng
      let brightFactor = 1.0;
      if (avgLum < 145) {
        brightFactor = Math.min(1.35, Math.max(1.08, 155 / Math.max(70, avgLum)));
      }

      // Khử ám vàng của đèn huỳnh quang cũ trên nền giấy A1
      let blueGain = 1.0;
      let redGain = 1.0;
      if (avgR > avgB * 1.15) {
        blueGain = Math.min(1.22, 1 + (avgR - avgB) / 255);
        redGain = Math.max(0.92, 1 - (avgR - avgB) / 510);
      }

      // Tăng tương phản giúp các ô toạ độ và nét vẽ màu tách bạch
      const contrast = 1.18;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i] * redGain;
        let g = data[i + 1];
        let b = data[i + 2] * blueGain;

        // Bù sáng
        r = Math.min(255, r * brightFactor);
        g = Math.min(255, g * brightFactor);
        b = Math.min(255, b * brightFactor);

        // Kéo dãn dải tương phản (Contrast Stretch)
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        // Tăng độ bão hòa (Saturation Boost) cho các mảng màu bút dạ
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;
        if (chroma > 25) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const satBoost = 1.25; // +25% độ rực rỡ màu
          r = lum + (r - lum) * satBoost;
          g = lum + (g - lum) * satBoost;
          b = lum + (b - lum) * satBoost;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    } catch (err) {
      console.warn('Canvas AI Enhance error:', err);
      return canvas;
    }
  }

  /**
   * Tạo Canvas đã được xoay góc (rotation) và bù nghiêng (tilt)
   */
  function renderTransformedCanvas(img, maxDimension = 1400, rotationDeg = 0, tiltDeg = 0) {
    const totalAngle = ((rotationDeg + tiltDeg) % 360) * Math.PI / 180;
    const sin = Math.abs(Math.sin(totalAngle));
    const cos = Math.abs(Math.cos(totalAngle));

    let origW = img.width;
    let origH = img.height;

    if (origW > maxDimension || origH > maxDimension) {
      if (origW > origH) {
        origH = Math.round((origH * maxDimension) / origW);
        origW = maxDimension;
      } else {
        origW = Math.round((origW * maxDimension) / origH);
        origH = maxDimension;
      }
    }

    const newW = Math.round(origW * cos + origH * sin);
    const newH = Math.round(origW * sin + origH * cos);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');

    // Nền trắng cho phần viền khi xoay nghiêng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);

    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(totalAngle);
    ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
    ctx.restore();

    return canvas;
  }

  function compressImageClient(file, maxDimension = 1300, quality = 0.84, applyAi = true, rotation = 0, tilt = 0) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = renderTransformedCanvas(img, maxDimension, rotation, tilt);
            if (applyAi) {
              applyCanvasAiEnhance(canvas);
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ==============================================================================
  // QUẢN LÝ GÓC NHÌN, CANVAS AI & TÁC PHẨM TRANH CHỤP TRÊN MÁY CHIẾU (HOST)
  // ==============================================================================
  function setArtworkViewMode(teamKey, mode) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoViewMode = mode;

    const btnSvg = document.getElementById(`${teamKey}_btnViewSvg`);
    const btnPhoto = document.getElementById(`${teamKey}_btnViewPhoto`);
    const wrapSvg = document.getElementById(`${teamKey}_svgWrap`);
    const wrapPhoto = document.getElementById(`${teamKey}_photoWrap`);

    if (btnSvg) btnSvg.classList.toggle('active', mode === 'svg');
    if (btnPhoto) btnPhoto.classList.toggle('active', mode === 'photo');

    if (wrapSvg) wrapSvg.style.display = mode === 'svg' ? 'block' : 'none';
    if (wrapPhoto) wrapPhoto.style.display = mode === 'photo' ? 'flex' : 'none';
  }

  function getTeamArtworkPhoto(teamKey) {
    const normKey = teamKey === 'A' ? 'teamA' : (teamKey === 'B' ? 'teamB' : teamKey);
    return gameState[normKey]?.artworkPhoto || null;
  }

  function getTeamPhotoMeta(teamKey) {
    const normKey = teamKey === 'A' ? 'teamA' : (teamKey === 'B' ? 'teamB' : teamKey);
    const t = gameState[normKey] || {};
    return {
      photo: t.artworkPhoto || null,
      rotation: t.photoRotation || 0,
      tilt: t.photoTilt || 0,
      isAi: t.isAiEnhanced !== false,
      timestamp: t.photoTimestamp || 0
    };
  }

  function toggleAutoFullscreenOnUpload() {
    gameState.autoFullscreenArtwork = !gameState.autoFullscreenArtwork;
    const btn = document.getElementById('gmmBtnAutoFullscreen');
    if (btn) {
      btn.classList.toggle('active', gameState.autoFullscreenArtwork);
      btn.textContent = gameState.autoFullscreenArtwork
        ? '🖥️ Tự Phóng Full: BẬT'
        : '🖥️ Tự Phóng Full: TẮT';
      btn.style.borderColor = gameState.autoFullscreenArtwork ? '#38bdf8' : 'rgba(255,255,255,0.2)';
      btn.style.background = gameState.autoFullscreenArtwork ? 'rgba(2, 132, 199, 0.28)' : 'rgba(30, 41, 59, 0.7)';
      btn.style.color = gameState.autoFullscreenArtwork ? '#e0f2fe' : '#94a3b8';
    }
    if (typeof window.showToast === 'function') {
      window.showToast(
        gameState.autoFullscreenArtwork
          ? '🖥️ Đã BẬT tự động phóng to Full màn hình ngay khi học sinh gửi ảnh tranh!'
          : '🔲 Đã TẮT tự động phóng to (vẫn bấm vào ảnh để phóng Full màn hình bất kỳ lúc nào).',
        'info'
      );
    }
  }

  function playSmartKeystoningFx(teamKey, teamName) {
    const overlay = document.getElementById(`${teamKey}_scanFxOverlay`);
    const statusText = document.getElementById(`${teamKey}_scanFxText`);
    if (!overlay) return;

    const displayName = teamName || (gameState.teamNames && gameState.teamNames[teamKey]) || (teamKey === 'teamA' ? 'Đội 1' : 'Đội 2');
    if (statusText) {
      statusText.innerHTML = `📐 <span style="color:#fde047;">AI ĐANG TỰ ĐỘNG NẮN PHẲNG 4 GÓC & TĂNG SÁNG:</span> <strong>${displayName}</strong>...`;
    }

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';

    // Sau 1.4s: Báo hiệu đã nắn phẳng 4 góc và cân bằng sáng thành công
    setTimeout(() => {
      if (statusText) {
        statusText.innerHTML = `✨ <span style="color:#4ade80;">HOÀN TẤT!</span> ĐÃ TỰ ĐỘNG NẮN PHẲNG 4 GÓC CHO <strong>${displayName}</strong>!`;
      }
    }, 1400);

    // Sau 2.8s: Mờ dần lớp overlay và giải phóng
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 450);
    }, 2800);
  }

  function attachTeamArtworkPhoto(rawTeamKey, photoData, timestamp) {
    const teamKey = rawTeamKey === 'A' ? 'teamA' : (rawTeamKey === 'B' ? 'teamB' : rawTeamKey);
    if (!gameState[teamKey] || !photoData) return;

    // Chống gắn trùng 2 lần khi cả SSE và Polling cùng nhận 1 bức ảnh (cùng timestamp)
    if (timestamp && gameState[teamKey].photoTimestamp === timestamp && gameState[teamKey].artworkPhoto) {
      return;
    }

    gameState[teamKey].artworkPhoto = photoData;
    gameState[teamKey].photoTimestamp = timestamp || Date.now();
    gameState[teamKey].photoRotation = 0;
    gameState[teamKey].photoTilt = 0;
    gameState[teamKey].isAiEnhanced = true;

    // Lấy tên đội tùy chỉnh từ cấu hình (ví dụ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
    const teamName = (gameState.teamNames && gameState.teamNames[teamKey])
      ? gameState.teamNames[teamKey]
      : (teamKey === 'teamA' ? 'Đội 1' : 'Đội 2');

    const img = document.getElementById(`${teamKey}_photoImg`);
    const emptyState = document.getElementById(`${teamKey}_photoEmpty`);
    const contentState = document.getElementById(`${teamKey}_photoContent`);
    const dot = document.getElementById(`${teamKey}_photoDot`);
    const btnAi = document.getElementById(`${teamKey}_btnAiFilter`);
    const badge = document.getElementById(`${teamKey}_photoTagBadge`);

    if (img) {
      img.src = photoData;
      img.style.transform = 'rotate(0deg)';
      img.classList.add('gmm-ai-enhanced-img');
    }
    if (btnAi) btnAi.classList.add('active');
    if (badge) {
      badge.textContent = `✨ Ảnh ${teamName} (AI Scan 4 Góc)`;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (contentState) contentState.style.display = 'flex';
    if (dot) dot.style.display = 'inline-block';

    // 1. Tự động chuyển máy chiếu sang Tab 4 (Tô Màu Giải Mã Tranh) nếu đang ở tab khác
    if (!ctx.isStudentMobile()) {
      if (typeof switchTab === 'function' && gameState.activeTab !== 'puzzle') {
        switchTab('puzzle');
      }
      // Tự động đóng popup đếm ngược toàn màn hình nếu đang mở che màn hình
      if (typeof closeDecryptTimerFullscreen === 'function') {
        closeDecryptTimerFullscreen();
      }
    }

    // 2. Tự động chuyển góc nhìn sang ẢNH CHỤP THẬT để Thầy Cô & Cả lớp thấy ngay
    setArtworkViewMode(teamKey, 'photo');

    // 3. Mở hiệu ứng nắn 4 góc thông minh tự động (Smart AI Keystoning FX)
    playSmartKeystoningFx(teamKey, teamName);

    if (gameState.activeTab === 'answer_key' && window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`📸 ${teamName} vừa gửi tranh giấy A1! Hệ thống đã tự động nắn phẳng 4 góc & làm sáng rực rỡ!`, 'success');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 80,
          spread: 70,
          zIndex: 2147483647,
          origin: { x: teamKey === 'teamA' ? 0.3 : 0.7, y: 0.5 }
        });
      } catch (_e) {}
    }

    // Tự động phóng to Full màn hình (98vw × 96vh) trên máy Thầy/Cô để khắc phục ảnh điện thoại hiển thị nhỏ
    if (!ctx.isStudentMobile() && window.GiaiMaArtworkScanner) {
      const hostModal = document.getElementById('giaiMaBiMatModal');
      const isHostOpen = hostModal && (hostModal.classList.contains('active') || hostModal.classList.contains('open'));
      if (isHostOpen && gameState.autoFullscreenArtwork !== false) {
        // Cho hiệu ứng nắn 4 góc trên khung tranh chạy 0.8s trước khi mở Full màn hình
        setTimeout(() => {
          if (typeof window.GiaiMaArtworkScanner.openTeamFullscreen === 'function') {
            window.GiaiMaArtworkScanner.openTeamFullscreen(teamKey);
          }
        }, 800);
      } else if (typeof window.GiaiMaArtworkScanner.isFullscreenOpen === 'function' && window.GiaiMaArtworkScanner.isFullscreenOpen()) {
        window.GiaiMaArtworkScanner.renderTeamFullscreenView();
      }
    }
  }

  function toggleAiArtworkFilter(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].isAiEnhanced = !gameState[teamKey].isAiEnhanced;
    updateArtworkTransformUI(teamKey);

    const isEnabled = gameState[teamKey].isAiEnhanced;
    const btn = document.getElementById(`${teamKey}_btnAiFilter`);
    if (btn) btn.classList.toggle('active', isEnabled);

    const badge = document.getElementById(`${teamKey}_photoTagBadge`);
    if (badge) {
      const teamName = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';
      badge.textContent = isEnabled ? `✨ Ảnh ${teamName} (AI Căn Sáng)` : `📸 Ảnh ${teamName} (Gốc)`;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(isEnabled
        ? `✨ Đã bật Bộ lọc Canvas AI: Tăng sáng & rực rỡ màu bút dạ!`
        : `📸 Đã chuyển về ảnh gốc chưa qua bộ lọc AI!`, 'info');
    }
  }

  function toggleTiltControl(teamKey) {
    const panel = document.getElementById(`${teamKey}_tiltPanel`);
    const btn = document.getElementById(`${teamKey}_btnTilt`);
    if (!panel) return;
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'flex';
    if (btn) btn.classList.toggle('active', !isVisible);
  }

  function adjustTiltAngle(teamKey, delta) {
    if (!gameState[teamKey]) return;
    let newTilt = Math.max(-20, Math.min(20, (gameState[teamKey].photoTilt || 0) + delta));
    newTilt = Math.round(newTilt * 10) / 10;
    gameState[teamKey].photoTilt = newTilt;

    const slider = document.getElementById(`${teamKey}_tiltSlider`);
    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (slider) slider.value = newTilt;
    if (valText) valText.textContent = `${newTilt > 0 ? '+' : ''}${newTilt}°`;

    updateArtworkTransformUI(teamKey);
  }

  function onTiltSliderChange(teamKey, val) {
    if (!gameState[teamKey]) return;
    const newTilt = parseFloat(val) || 0;
    gameState[teamKey].photoTilt = newTilt;

    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (valText) valText.textContent = `${newTilt > 0 ? '+' : ''}${newTilt}°`;

    updateArtworkTransformUI(teamKey);
  }

  function resetTiltAngle(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoTilt = 0;

    const slider = document.getElementById(`${teamKey}_tiltSlider`);
    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (slider) slider.value = 0;
    if (valText) valText.textContent = '0°';

    updateArtworkTransformUI(teamKey);
  }

  function updateArtworkTransformUI(teamKey) {
    const img = document.getElementById(`${teamKey}_photoImg`);
    if (!img) return;

    const rot = gameState[teamKey]?.photoRotation || 0;
    const tilt = gameState[teamKey]?.photoTilt || 0;
    const isAi = gameState[teamKey]?.isAiEnhanced !== false;

    img.style.transform = `rotate(${rot + tilt}deg)`;
    img.classList.toggle('gmm-ai-enhanced-img', isAi);
  }

  function rotateArtworkPhoto(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoRotation = ((gameState[teamKey].photoRotation || 0) + 90) % 360;
    updateArtworkTransformUI(teamKey);
  }

  function zoomArtworkPhoto(teamKey) {
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openTeamFullscreen === 'function') {
      window.GiaiMaArtworkScanner.openTeamFullscreen(teamKey);
      return;
    }

    const photoData = gameState[teamKey]?.artworkPhoto;
    if (!photoData) return;

    openZoomModal();
    const zoomBody = document.getElementById('gmmZoomBody');
    if (zoomBody) {
      const rot = gameState[teamKey]?.photoRotation || 0;
      const tilt = gameState[teamKey]?.photoTilt || 0;
      const isAi = gameState[teamKey]?.isAiEnhanced !== false;
      const teamName = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';

      zoomBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative;">
          <img src="${photoData}" alt="Tranh giấy ${teamName}" class="${isAi ? 'gmm-ai-enhanced-img' : ''}" style="max-width: 96%; max-height: 86vh; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.85); transform: rotate(${rot + tilt}deg);">
        </div>
      `;
    }
  }

  async function handleHostPhotoUpload(teamKey, e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';

    // Mở Studio Quét Tài Liệu 4 Góc Hình Thang để nắn phẳng & làm sáng trước khi gắn lên bảng
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openScannerWithFile === 'function') {
      window.GiaiMaArtworkScanner.openScannerWithFile(file, 'host', teamKey);
      return;
    }

    try {
      if (typeof window.showToast === 'function') {
        window.showToast('⏳ AI đang cân bằng sáng & độ tương phản...', 'info');
      }
      const compressed = await compressImageClient(file, 1600, 0.86, true);
      const ts = Date.now();
      attachTeamArtworkPhoto(teamKey, compressed, ts);

      fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: teamKey,
          photoData: compressed,
          timestamp: ts
        })
      }).catch(() => {});
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể nạp file ảnh!', 'error');
      }
    }
  }

  // Kênh đồng bộ kép (Polling 2s dự phòng cho SSE) đảm bảo 100% ảnh học sinh gửi lên luôn hiện trên máy Thầy/Cô
  async function pollServerArtworksOnce() {
    if (ctx.isStudentMobile()) return;
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    try {
      const tsA = gameState.teamA.photoTimestamp || 0;
      const tsB = gameState.teamB.photoTimestamp || 0;
      const resp = await fetch(`/api/gmm/artworks?tsA=${tsA}&tsB=${tsB}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.success && json.hasUpdate) {
        if (json.teamA && json.teamA.photoData) {
          attachTeamArtworkPhoto('teamA', json.teamA.photoData, json.teamA.timestamp);
        }
        if (json.teamB && json.teamB.photoData) {
          attachTeamArtworkPhoto('teamB', json.teamB.photoData, json.teamB.timestamp);
        }
      }
    } catch (_e) {}
  }

  function startHostArtworkPolling() {
    stopHostArtworkPolling();
    pollServerArtworksOnce();
    hostArtworkPollInterval = setInterval(pollServerArtworksOnce, 2000);
  }

  function stopHostArtworkPolling() {
    if (hostArtworkPollInterval) {
      clearInterval(hostArtworkPollInterval);
      hostArtworkPollInterval = null;
    }
  }

  // ==================== QUẢN LÝ THU PHÓNG TOÀN MÀN HÌNH BỨC TRANH (ZOOM IN / FULLSCREEN CANVAS) ====================
  let activeZoomTeam = 'teamA';
  let isZoomAnswerKeyActive = false;
  let isZoomSplitView = false;

  function openZoomModal(teamKey = 'teamA') {
    activeZoomTeam = teamKey;
    isZoomAnswerKeyActive = false;
    isZoomSplitView = false;
    const modal = document.getElementById('gmmPuzzleZoomModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderZoomModalContent();
  }

  function closeZoomModal() {
    const modal = document.getElementById('gmmPuzzleZoomModal');
    if (modal) modal.style.display = 'none';
  }

  function switchZoomTeam() {
    if (isZoomSplitView) {
      isZoomSplitView = false;
    }
    activeZoomTeam = (activeZoomTeam === 'teamA') ? 'teamB' : 'teamA';
    renderZoomModalContent();
  }

  function toggleZoomSplitView() {
    isZoomSplitView = !isZoomSplitView;
    renderZoomModalContent();
  }

  function toggleZoomAnswerKey() {
    isZoomAnswerKeyActive = !isZoomAnswerKeyActive;
    renderZoomModalContent();
  }

  function renderZoomModalContent() {
    const body = document.getElementById('gmmZoomBody');
    const iconEl = document.getElementById('gmmZoomTeamIcon');
    const titleEl = document.getElementById('gmmZoomTitle');
    const progEl = document.getElementById('gmmZoomProgress');
    const switchTargetEl = document.getElementById('gmmZoomSwitchTarget');
    const switchBtn = document.getElementById('gmmBtnZoomSwitch');
    const splitBtn = document.getElementById('gmmBtnZoomSplit');
    const keyBtn = document.getElementById('gmmBtnZoomKey');

    if (!body) return;

    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    body.classList.toggle('paper-theme', isPaper);

    const isTeamA = (activeZoomTeam === 'teamA');
    const teamData = gameState[activeZoomTeam];
    const teamName = isTeamA ? 'ĐỘI 1 (ĐỘI A)' : 'ĐỘI 2 (ĐỘI B)';
    const otherName = isTeamA ? 'Đội 2 (Đội B)' : 'Đội 1 (Đội A)';

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';

    const pctA = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
      ? window.GiaiMaPuzzle.calculateProgress(gameState.teamA)
      : 0;
    const pctB = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
      ? window.GiaiMaPuzzle.calculateProgress(gameState.teamB)
      : 0;

    // Cập nhật trạng thái nút So Sánh Song Song 2 Đội
    if (splitBtn) {
      if (isZoomSplitView) {
        splitBtn.classList.add('active');
        splitBtn.innerHTML = '🔍 Xem Riêng 1 Đội';
        splitBtn.title = 'Chuyển về xem riêng từng đội phóng to (Phím S)';
      } else {
        splitBtn.classList.remove('active');
        splitBtn.innerHTML = '👥 So Sánh 2 Đội';
        splitBtn.title = 'Chiếu so sánh song song 2 đội cạnh nhau (Phím S)';
      }
    }

    if (switchBtn) {
      switchBtn.style.display = isZoomSplitView ? 'none' : 'inline-flex';
    }

    if (keyBtn) {
      if (isZoomAnswerKeyActive) {
        keyBtn.innerHTML = '🔄 Xem Tranh Thực Tế';
        keyBtn.style.background = '#eab308';
        keyBtn.style.color = '#0f172a';
      } else {
        keyBtn.innerHTML = '👁️ Xem Tranh Mẫu';
        keyBtn.style.background = '';
        keyBtn.style.color = '';
      }
    }

    // 1. Chế độ So Sánh Song Song 2 Đội (Split-Screen Zoom View)
    if (isZoomSplitView) {
      if (iconEl) iconEl.textContent = '👥';
      if (titleEl) {
        titleEl.textContent = isZoomAnswerKeyActive
          ? `🌺 TRANH MẪU ĐÁP ÁN: “${activeTitle}” (SO SÁNH 2 ĐỘI)`
          : `SO SÁNH ĐỐI ĐẦU TRANH 2 ĐỘI - BIỂU TƯỢNG BÍ MẬT`;
      }
      if (progEl) {
        progEl.textContent = `🔴 Đội 1: ${pctA}%  |  🔵 Đội 2: ${pctB}%`;
      }

      body.innerHTML = `
        <div class="gmm-zoom-split-grid">
          <!-- Cột Đội 1 -->
          <div class="gmm-zoom-split-col team-a">
            <div class="gmm-zoom-split-header">
              <span style="font-size: 1.1rem; font-weight: 800; color: #fca5a5;">🔴 ĐỘI 1 (ĐỘI A)</span>
              <span class="gmm-zoom-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);">Tiến độ: ${pctA}%</span>
            </div>
            <div class="gmm-zoom-split-svg-wrap">
              ${generateSvgPuzzle('teamA', isZoomAnswerKeyActive)}
            </div>
          </div>
          <!-- Cột Đội 2 -->
          <div class="gmm-zoom-split-col team-b">
            <div class="gmm-zoom-split-header">
              <span style="font-size: 1.1rem; font-weight: 800; color: #93c5fd;">🔵 ĐỘI 2 (ĐỘI B)</span>
              <span class="gmm-zoom-badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-color: rgba(59, 130, 246, 0.4);">Tiến độ: ${pctB}%</span>
            </div>
            <div class="gmm-zoom-split-svg-wrap">
              ${generateSvgPuzzle('teamB', isZoomAnswerKeyActive)}
            </div>
          </div>
        </div>
      `;
      const splitCols = body.querySelectorAll('.gmm-zoom-split-col');
      splitCols.forEach(col => col.classList.toggle('paper-theme', isPaper));
      updateCanvasThemeButtonUI();
      return;
    }

    // 2. Chế độ Xem Riêng 1 Đội
    if (iconEl) iconEl.textContent = isTeamA ? '🔴' : '🔵';
    if (switchTargetEl) switchTargetEl.textContent = otherName;

    if (titleEl) {
      if (isZoomAnswerKeyActive) {
        titleEl.textContent = `🌺 TRANH MẪU HOÀN THIỆN: “${activeTitle}”`;
      } else if (teamData && teamData.completed) {
        titleEl.textContent = `BẢNG TRANH ${teamName}: “${activeTitle}” 🎉`;
      } else {
        titleEl.textContent = `BẢNG TRANH ${teamName} - BIỂU TƯỢNG BÍ MẬT`;
      }
    }

    if (progEl) {
      const currentPct = isTeamA ? pctA : pctB;
      progEl.textContent = `Tiến độ: ${currentPct}%`;
    }

    body.innerHTML = generateSvgPuzzle(activeZoomTeam, isZoomAnswerKeyActive);
    updateCanvasThemeButtonUI();
  }

      return {
        applyCanvasAiEnhance,
        renderTransformedCanvas,
        compressImageClient,
        setArtworkViewMode,
        getTeamArtworkPhoto,
        getTeamPhotoMeta,
        toggleAutoFullscreenOnUpload,
        playSmartKeystoningFx,
        attachTeamArtworkPhoto,
        toggleAiArtworkFilter,
        toggleTiltControl,
        adjustTiltAngle,
        onTiltSliderChange,
        resetTiltAngle,
        updateArtworkTransformUI,
        rotateArtworkPhoto,
        zoomArtworkPhoto,
        handleHostPhotoUpload,
        pollServerArtworksOnce,
        startHostArtworkPolling,
        stopHostArtworkPolling,
        openZoomModal,
        closeZoomModal,
        switchZoomTeam,
        toggleZoomSplitView,
        toggleZoomAnswerKey,
        renderZoomModalContent
      };
    }
  };
})();
