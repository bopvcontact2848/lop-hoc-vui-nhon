/**
 * ==============================================================================
 * MODULE TÔ TRANH, CHỤP ẢNH GIẤY & XEM LẠI CÂU SAI MOBILE (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmMobileArtwork.js
 * Trách nhiệm: Thẻ kết quả/xem lại câu sai, đồng hồ tô màu trên điện thoại,
 * tô tranh SVG và chụp/xoay/nén ảnh giấy A1 gửi lên máy chiếu.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmMobileArtwork = {
    create: function (ctx) {
      const {
        gameState,
        mobileState,
        formatMinutesSeconds,
        generateSvgPuzzle,
        compressImageClient,
        renderTransformedCanvas,
        renderCurrentMobileQuestion
      } = ctx;

      let mobileCapturedPhotoData = null;
      let mobileOriginalPhotoData = null;
      let mobileEnhancedPhotoData = null;
      let mobilePhotoRotation = 0;
      let mobilePhotoTilt = 0;
      let isMobileAiEnhanced = true;

      function resetMobilePhotoState() {
        mobileCapturedPhotoData = null;
        mobileOriginalPhotoData = null;
        mobileEnhancedPhotoData = null;
        mobilePhotoRotation = 0;
        mobilePhotoTilt = 0;
        isMobileAiEnhanced = true;
      }


  function updateMobileDecryptTimerUI() {
    const totalSec = Math.max(0, mobileState.decryptRemainingSeconds || 0);
    const totalDuration = Math.max(1, mobileState.decryptTotalSeconds || 180);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const percent = Math.min(100, Math.max(0, Math.round((totalSec / totalDuration) * 100)));

    const digitsEl = document.getElementById('gmmMobDecTimerDigits');
    const fillEl = document.getElementById('gmmMobDecProgressFill');
    const badgeEl = document.getElementById('gmmMobDecTimerBadge');
    const statusEl = document.getElementById('gmmMobDecTimerStatus');
    const tipEl = document.getElementById('gmmMobDecTimerTip');
    const percentEl = document.getElementById('gmmMobDecTimerPercent');

    if (digitsEl) digitsEl.textContent = timeStr;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;

    let colorClass = 'normal-green';
    let badgeClass = 'normal';

    if (totalSec === 0) {
      colorClass = 'time-up';
      badgeClass = 'done';
      if (statusEl) statusEl.textContent = '🎉 HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = '📸 Hết giờ! Hãy chụp ảnh tranh gửi lên máy chiếu!';
    } else if (!mobileState.isDecryptTimerRunning) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏸️ TẠM DỪNG ĐỒNG HỒ';
      if (tipEl) tipEl.textContent = 'Thầy/Cô đang tạm dừng đếm ngược trên máy chiếu.';
    } else if (totalSec <= 10) {
      colorClass = 'urgent-red';
      badgeClass = 'urgent';
      if (statusEl) statusEl.textContent = '🔥 10 GIÂY CUỐI CÙNG!';
      if (tipEl) tipEl.textContent = 'Khẩn trương hoàn tất những nét tô màu cuối!';

      // Rung phản hồi xúc giác (Haptic) khi còn đúng 5, 3, 1 giây
      if ((totalSec === 5 || totalSec === 3 || totalSec === 1) && navigator.vibrate) {
        try { navigator.vibrate([120, 60, 120]); } catch (_) {}
      }
    } else if (totalSec <= 30) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏳ SẮP HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = 'Thời gian sắp hết, hai đội tập trung tăng tốc!';
    } else {
      colorClass = 'normal-green';
      badgeClass = 'normal';
      if (statusEl) statusEl.textContent = '⏱️ ĐANG ĐẾM NGƯỢC TÔ TRANH';
      if (tipEl) tipEl.textContent = '⚡ Hai đội đối chiếu tọa độ và tô màu lên tranh!';
    }

    if (digitsEl) digitsEl.className = `gmm-mob-dec-timer-digits ${colorClass}`;
    if (fillEl) fillEl.className = `gmm-mob-dec-progress-fill ${colorClass}`;
    if (badgeEl) badgeEl.className = `gmm-mob-dec-timer-badge ${badgeClass}`;
  }

  function updateMobileFinishArtworkUI(teamState) {
    const finishBtn = document.getElementById('gmmMobBtnFinishArtwork');
    const finishBadge = document.getElementById('gmmMobFinishSuccessBadge');
    const finishSub = document.getElementById('gmmMobFinishBadgeSub');
    if (teamState && teamState.isArtworkFinished) {
      if (finishBtn) finishBtn.style.display = 'none';
      if (finishBadge) finishBadge.style.display = 'block';
      if (finishSub) {
        const fTime = teamState.artworkFinishTime || '02:00';
        const sBonus = teamState.speedBonus || 2;
        finishSub.textContent = `⏱️ Thời gian: ${fTime} • Nhận +${sBonus} điểm thưởng tốc độ!`;
      }
    } else {
      if (finishBtn) finishBtn.style.display = 'flex';
      if (finishBadge) finishBadge.style.display = 'none';
    }
  }

  // Học sinh bấm nút "Báo Cáo Đã Tô Xong Sớm" từ điện thoại để nhận điểm thưởng tốc độ
  function reportArtworkFinishedFromMobile() {
    const teamData = gameState[ctx.getStudentTeamKey()];
    if (teamData && teamData.isArtworkFinished) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ Đội em đã báo cáo hoàn thành tranh trước đó rồi!', 'info');
      }
      return;
    }

    const ok = confirm(
      '🎉 XÁC NHẬN BÁO CÁO ĐÃ TÔ XONG TRANH GIẤY A1!\n\n' +
      'Đội em đã hoàn thiện toàn bộ các mảng màu trên tờ tranh giấy A1 của đội mình chưa?\n\n' +
      '(Hệ thống sẽ ghi nhận mốc thời gian hoàn thành sớm để tính điểm thưởng tốc độ +2 điểm!)'
    );
    if (!ok) return;

    const totalSec = Math.max(1, mobileState.decryptTotalSeconds || 180);
    const remSec = Math.max(0, mobileState.decryptRemainingSeconds || 0);
    const elapsed = Math.max(0, totalSec - remSec);
    const finishTimeStr = formatMinutesSeconds(elapsed);
    const speedBonus = remSec > 0 ? 2 : 0;

    if (teamData) {
      teamData.completed = true;
      teamData.isArtworkFinished = true;
      teamData.artworkFinishTime = finishTimeStr;
      teamData.artworkFinishSeconds = elapsed;
      teamData.speedBonus = speedBonus;
      teamData.bonusScore = (teamData.bonusScore || 0) + speedBonus;
    }

    // Cập nhật giao diện trên điện thoại ngay lập tức
    const btn = document.getElementById('gmmMobBtnFinishArtwork');
    const badge = document.getElementById('gmmMobFinishSuccessBadge');
    const sub = document.getElementById('gmmMobFinishBadgeSub');
    if (btn) btn.style.display = 'none';
    if (badge) badge.style.display = 'block';
    if (sub) {
      sub.textContent = speedBonus > 0
        ? `⏱️ Thời gian: ${finishTimeStr} • Nhận +${speedBonus} điểm thưởng tốc độ!`
        : `⏱️ Thời gian: ${finishTimeStr} • Đã hoàn thành tranh!`;
    }

    // Bắn pháo hoa Confetti ăn mừng trên điện thoại
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, zIndex: 99999 });
      } catch (_) {}
    }
    if (navigator.vibrate) {
      try { navigator.vibrate([120, 60, 120, 60, 240]); } catch (_) {}
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 XUẤT SẮC! Đã báo cáo hoàn thành tranh sớm (⏱️ ${finishTimeStr}, +${speedBonus}đ tốc độ)!`, 'success');
    }

    // Gửi báo cáo lên máy chủ
    fetch('/api/gmm/finish-artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: ctx.getStudentTeamKey(),
        finishTime: finishTimeStr,
        finishSeconds: elapsed,
        remainingSeconds: remSec,
        speedBonus: speedBonus
      })
    }).catch(() => {});
  }


  // Bật / tắt chế độ xem lại 10 câu hỏi sau khi đã nộp bài
  function toggleReviewQuestions() {
    mobileState.isReviewMode = !mobileState.isReviewMode;
    const stage = document.getElementById('gmmMobQuestionStage');
    const btnText = document.getElementById('gmmMobBtnReviewText');
    if (stage) {
      stage.style.display = mobileState.isReviewMode ? 'block' : 'none';
    }
    if (btnText) {
      btnText.textContent = mobileState.isReviewMode ? '🔼 Thu gọn danh sách câu hỏi' : '👁️ Lướt xem chi tiết từng câu hỏi';
    }
    if (mobileState.isReviewMode) {
      renderCurrentMobileQuestion();
    }
  }

  // ==================== XEM LẠI CÂU SAI & ĐÁP ÁN CHUẨN TRÊN ĐIỆN THOẠI ====================

  function openMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'flex';
    mobileState.mistakesFilterType = 'all';
    renderMistakesReviewList();
  }

  function closeMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function filterMistakesView(type) {
    mobileState.mistakesFilterType = type || 'all';
    renderMistakesReviewList();
  }

  function renderMistakesReviewList() {
    const listEl = document.getElementById('gmmMobMistakesList');
    const subtitleEl = document.getElementById('gmmMobMistakesSubtitle');
    const tabAll = document.getElementById('gmmFilterAll');
    const tabWrong = document.getElementById('gmmFilterWrong');
    const tabCorrect = document.getElementById('gmmFilterCorrect');
    if (!listEl) return;

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    const letters = ['A', 'B', 'C', 'D'];

    let correctCount = 0;
    let wrongCount = 0;

    list.forEach((q) => {
      const myAns = mobileState.teamAnswers[q.id];
      if (myAns === q.correct) correctCount++;
      else wrongCount++;
    });

    if (subtitleEl) {
      subtitleEl.textContent = `Đội em làm đúng ${correctCount}/${list.length} câu (${Math.round((correctCount / list.length) * 100)}%) • Sai ${wrongCount} câu`;
    }

    if (tabAll) {
      tabAll.textContent = `Tất cả (${list.length})`;
      tabAll.classList.toggle('active', mobileState.mistakesFilterType === 'all');
    }
    if (tabWrong) {
      tabWrong.textContent = `❌ Câu sai (${wrongCount})`;
      tabWrong.classList.toggle('active', mobileState.mistakesFilterType === 'wrong');
    }
    if (tabCorrect) {
      tabCorrect.textContent = `✅ Câu đúng (${correctCount})`;
      tabCorrect.classList.toggle('active', mobileState.mistakesFilterType === 'correct');
    }

    const filtered = list.filter((q) => {
      const myAns = mobileState.teamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      if (mobileState.mistakesFilterType === 'wrong') return !isCorrect;
      if (mobileState.mistakesFilterType === 'correct') return isCorrect;
      return true;
    });

    if (filtered.length === 0) {
      if (mobileState.mistakesFilterType === 'wrong') {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #34d399;">
            <div style="font-size: 2.4rem; margin-bottom: 8px;">🎉</div>
            <div style="font-size: 1.05rem; font-weight: 800;">Tuyệt vời! Đội em không làm sai câu nào!</div>
            <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 6px;">Toàn bộ ${list.length} câu trắc nghiệm của đội em đều chính xác hoàn hảo.</div>
          </div>
        `;
      } else {
        listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #94a3b8;">Không có câu hỏi nào trong danh mục này.</div>`;
      }
      return;
    }

    listEl.innerHTML = filtered.map((q) => {
      const origIdx = list.findIndex(item => item.id === q.id);
      const qNumber = origIdx !== -1 ? origIdx + 1 : q.id;
      const myAns = mobileState.teamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      const hasAns = (myAns !== undefined && myAns !== null);

      const myAnsLetter = hasAns ? letters[myAns] : '';
      const myAnsText = hasAns && q.options[myAns] ? q.options[myAns] : 'Chưa chọn đáp án';
      const correctLetter = letters[q.correct];
      const correctText = q.options[q.correct];
      const coordName = q.coordinate || `Ô số ${qNumber}`;

      return `
        <div class="gmm-mob-mistake-card ${isCorrect ? 'correct' : 'wrong'}">
          <div class="gmm-mob-mistake-qnum">
            <span style="color: ${isCorrect ? '#34d399' : '#f87171'};">CÂU HỎI ${qNumber}/${list.length}</span>
            <span style="font-size: 0.76rem; font-weight: 800; color: ${isCorrect ? '#34d399' : '#f87171'};">
              ${isCorrect ? '✅ ĐÃ LÀM ĐÚNG' : '❌ CHƯA ĐÚNG'}
            </span>
          </div>
          <div class="gmm-mob-mistake-qtext">${q.question}</div>

          <!-- Phương án đội em đã chọn -->
          <div class="gmm-mob-mistake-answer-row my-ans ${isCorrect ? 'correct' : 'wrong'}">
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 2px;">
              👉 Lựa chọn của Đội em:
            </div>
            <div>
              <strong>[${myAnsLetter || '?'}]</strong> ${myAnsText}
              ${isCorrect ? ' <span style="color: #34d399; font-weight: 800;">(+1 Điểm)</span>' : ' <span style="color: #ef4444; font-weight: 800;">(Sai)</span>'}
            </div>
          </div>

          <!-- Đáp án chuẩn của Thầy/Cô -->
          ${!isCorrect ? `
            <div class="gmm-mob-mistake-answer-row correct-ans">
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #34d399; margin-bottom: 2px;">
                ✨ Đáp án chuẩn của Thầy/Cô:
              </div>
              <div>
                <strong>[${correctLetter}]</strong> ${correctText}
              </div>
            </div>
          ` : ''}

          <div class="gmm-mob-mistake-coord">
            <span>🎯 Tọa độ mở khóa bảng giấy A1: <strong>${coordName}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render thẻ chúc mừng và danh sách các toạ độ mở khóa
  function renderLockedSuccessCard() {
    const card = document.getElementById('gmmMobLockedSuccessCard');
    const chipsWrap = document.getElementById('gmmMobUnlockedCoordsList');
    if (!card) return;

    if (!mobileState.isLocked) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';

    // Cập nhật nhãn thời gian hoàn thành trên điện thoại
    const timeBadge = document.getElementById('gmmMobFinishTimeBadge');
    const timeVal = document.getElementById('gmmMobFinishTimeVal');
    if (timeBadge && timeVal) {
      if (mobileState.finishTimeFormatted) {
        timeVal.textContent = mobileState.finishTimeFormatted;
        timeBadge.style.display = 'inline-flex';
      } else {
        timeBadge.style.display = 'none';
      }
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    const correctItems = [];

    list.forEach((q, idx) => {
      const myAns = mobileState.teamAnswers[q.id];
      if (myAns !== undefined && myAns !== null && myAns === q.correct) {
        correctItems.push({
          num: idx + 1,
          coord: q.coordinate || `Ô số ${idx + 1}`
        });
      }
    });

    if (chipsWrap) {
      if (correctItems.length === 0) {
        chipsWrap.innerHTML = '<div style="color: #cbd5e1; font-size: 0.88rem; font-style: italic;">Chưa mở khóa được ô nào. Đội em hãy cùng quan sát diễn biến trên máy chiếu nhé!</div>';
      } else {
        chipsWrap.innerHTML = correctItems.map(item => `
          <div class="gmm-mob-coord-chip">
            <span>🎯 ${item.coord}</span>
          </div>
        `).join('');
      }
    }

    // Cập nhật nhãn nút Xem lại câu sai & đáp án chuẩn
    const btnMistakes = document.getElementById('gmmMobBtnReviewMistakes');
    if (btnMistakes) {
      let wrong = 0;
      list.forEach((q) => {
        const myAns = mobileState.teamAnswers[q.id];
        if (myAns !== q.correct) wrong++;
      });
      if (wrong > 0) {
        btnMistakes.innerHTML = `<span>📝 Xem Lại ${wrong} Câu Sai & Đáp Án Chuẩn</span>`;
        btnMistakes.className = 'gmm-mob-btn-review mistakes';
      } else {
        btnMistakes.innerHTML = `<span>🎉 Đội Em Đúng 10/10 - Xem Bảng Vinh Danh</span>`;
        btnMistakes.className = 'gmm-mob-btn-review';
        btnMistakes.style.borderColor = '#34d399';
        btnMistakes.style.color = '#34d399';
      }
    }
  }

  // Tự động chuyển sang câu tiếp theo sau khi chọn đáp án

  function setMobileColor(c, el) {
    mobileState.currentColor = c;
    document.querySelectorAll('#gmmMobPaletteBar .gmm-color-swatch').forEach(sw => sw.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // Học sinh tô màu tranh từ điện thoại gửi lên Server
  async function submitPaintFromMobile(regionId) {
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (_e) {}
    }
    try {
      await fetch('/api/gmm/paint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          regionId: regionId,
          color: mobileState.currentColor
        })
      });
    } catch (_err) {}
  }

  // Render tranh SVG trên điện thoại học sinh khi bước vào giai đoạn giải mã
  function renderMobilePaintView() {
    updateMobileDecryptTimerUI();
    const wrap = document.getElementById('gmmMobSvgWrap');
    const palette = document.getElementById('gmmMobPaletteBar');
    if (!wrap || !palette) return;

    wrap.innerHTML = generateSvgPuzzle(ctx.getStudentTeamKey());

    const colors = ctx.getStudentTeamKey() === 'teamA' 
      ? ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    palette.innerHTML = `
      <span style="font-size: 0.8rem; color: #cbd5e1; font-weight: 700;">Màu tô:</span>
      ${colors.map((c, i) => `
        <div class="gmm-color-swatch ${i === 0 ? 'active' : ''}" style="background: ${c};" onclick="window.GiaiMaBiMat.setMobileColor('${c}', this)"></div>
      `).join('')}
    `;
  }


  function triggerMobileCamera() {
    const input = document.getElementById('gmmMobCameraInput');
    if (input) input.click();
  }

  function triggerMobileGallery() {
    const input = document.getElementById('gmmMobGalleryInput');
    if (input) input.click();
  }

  async function handleMobilePhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Đặt lại giá trị input ngay lập tức để chọn lại cùng 1 ảnh trong Bộ sưu tập vẫn kích hoạt onchange
    e.target.value = '';

    const currentTeam = ctx.getStudentTeamKey() || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');

    // Mở ngay Studio Quét Tài Liệu 4 Góc Hình Thang (Perspective Warp) + AI Làm Sáng Toàn Màn Hình
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openScannerWithFile === 'function') {
      if (typeof window.showToast === 'function') {
        window.showToast('📐 Đang nhận diện 4 góc giấy A1 & làm sáng màu...', 'info');
      }
      window.GiaiMaArtworkScanner.openScannerWithFile(file, 'mobile', currentTeam);
      return;
    }

    // Dự phòng nếu module Scanner chưa kịp tải
    try {
      const enhancedData = await compressImageClient(file, 1300, 0.85, true);
      mobileEnhancedPhotoData = enhancedData;
      mobileOriginalPhotoData = enhancedData;
      mobileCapturedPhotoData = enhancedData;
      await submitCapturedArtworkPhoto();
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể nạp ảnh, vui lòng thử lại!', 'error');
      }
    }
  }

  function toggleMobileAiEnhance() {
    isMobileAiEnhanced = !isMobileAiEnhanced;
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    const aiBtn = document.getElementById('gmmMobBtnToggleAi');
    const aiBadge = document.getElementById('gmmMobAiBadge');

    if (isMobileAiEnhanced) {
      mobileCapturedPhotoData = mobileEnhancedPhotoData;
      if (previewImg && mobileEnhancedPhotoData) {
        previewImg.src = mobileEnhancedPhotoData;
        previewImg.classList.add('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.add('active');
      if (aiBadge) {
        aiBadge.style.display = 'block';
        aiBadge.textContent = '✨ AI Đã Căn Sáng & Tươi Màu';
      }
      if (typeof window.showToast === 'function') {
        window.showToast('✨ Đã bật Bộ lọc AI làm sáng tranh!', 'info');
      }
    } else {
      mobileCapturedPhotoData = mobileOriginalPhotoData;
      if (previewImg && mobileOriginalPhotoData) {
        previewImg.src = mobileOriginalPhotoData;
        previewImg.classList.remove('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.remove('active');
      if (aiBadge) aiBadge.style.display = 'none';
      if (typeof window.showToast === 'function') {
        window.showToast('📸 Đã chuyển về ảnh gốc chưa lọc!', 'info');
      }
    }
  }

  function rotateMobilePreview(deltaAngle = 90) {
    mobilePhotoRotation = (mobilePhotoRotation + deltaAngle) % 360;
    updateMobilePreviewTransform();
  }

  function stepMobileTilt(delta = 1) {
    mobilePhotoTilt = Math.max(-15, Math.min(15, mobilePhotoTilt + delta));
    updateMobilePreviewTransform();
  }

  function updateMobilePreviewTransform() {
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    if (previewImg) {
      previewImg.style.transform = `rotate(${mobilePhotoRotation + mobilePhotoTilt}deg)`;
    }
  }

  async function submitCapturedArtworkPhoto() {
    if (!mobileCapturedPhotoData) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Vui lòng chụp ảnh tranh giấy trước khi tải lên!', 'warning');
      }
      return;
    }

    const currentTeam = ctx.getStudentTeamKey() || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');
    const teamName = currentTeam === 'teamA' ? 'Đội 1' : 'Đội 2';
    const btnSend = document.getElementById('gmmMobBtnSendPhoto');
    const origHtml = btnSend ? btnSend.innerHTML : '';

    if (btnSend) {
      btnSend.disabled = true;
      btnSend.innerHTML = '<span>⏳ Đang gửi lên máy chiếu...</span>';
    }

    try {
      let finalPhotoData = mobileCapturedPhotoData;

      // Nếu học sinh có chỉnh góc xoay hoặc nghiêng trên điện thoại, render lại canvas ở góc đó
      if (mobilePhotoRotation !== 0 || mobilePhotoTilt !== 0) {
        finalPhotoData = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const c = renderTransformedCanvas(img, 1300, mobilePhotoRotation, mobilePhotoTilt);
            resolve(c.toDataURL('image/jpeg', 0.85));
          };
          img.src = mobileCapturedPhotoData;
        });
      }

      const resp = await fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: currentTeam,
          photoData: finalPhotoData,
          timestamp: Date.now()
        })
      });

      const res = await resp.json();
      if (res && res.success) {
        const previewWrap = document.getElementById('gmmMobPhotoPreviewWrap');
        const successBox = document.getElementById('gmmMobPhotoUploadSuccess');
        if (previewWrap) previewWrap.style.display = 'none';
        if (successBox) successBox.style.display = 'block';

        if (window.audioManager && typeof window.audioManager.playChime === 'function') {
          window.audioManager.playChime();
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Tranh thật của ${teamName} đã được gắn lên màn hình máy chiếu!`, 'success');
        }
      } else {
        throw new Error(res?.error || 'Lỗi tải ảnh');
      }
    } catch (err) {
      if (typeof window.showToast === 'function') {
        window.showToast(`❌ Không thể gửi ảnh lên máy chiếu: ${err.message}`, 'error');
      }
    } finally {
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.innerHTML = origHtml;
      }
    }
  }

      return {
        resetMobilePhotoState,
        updateMobileDecryptTimerUI,
        updateMobileFinishArtworkUI,
        reportArtworkFinishedFromMobile,
        toggleReviewQuestions,
        openMistakesReviewModal,
        closeMistakesReviewModal,
        filterMistakesView,
        renderMistakesReviewList,
        renderLockedSuccessCard,
        setMobileColor,
        submitPaintFromMobile,
        renderMobilePaintView,
        triggerMobileCamera,
        triggerMobileGallery,
        handleMobilePhotoSelected,
        toggleMobileAiEnhance,
        rotateMobilePreview,
        stepMobileTilt,
        updateMobilePreviewTransform,
        submitCapturedArtworkPhoto
      };
    }
  };
})();
