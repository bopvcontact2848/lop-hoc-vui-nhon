/**
 * ==============================================================================
 * MODULE GIAO DIỆN ĐẤU TRƯỜNG TRẮC NGHIỆM ĐIỆN THOẠI (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmMobileQuizUi.js
 * Trách nhiệm: Khởi tạo giao diện học sinh, hiển thị câu hỏi 1..10, vuốt chạm,
 * tự chuyển câu, hiệu ứng âm thanh/confetti và chốt nộp bài trên điện thoại.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmMobileQuizUi = {
    create: function (ctx) {
      const {
        gameState,
        mobileState,
        formatMinutesSeconds,
        requestScreenWakeLock,
        announceMobileJoinToServer,
        startMobileStatePolling,
        bindMobileLifecycleSync,
        fetchCurrentServerState,
        loadMobileAnswersFromLocal,
        saveMobileAnswersToLocal,
        flushPendingSyncQueue,
        addToPendingSyncQueue,
        connectStudentSSE,
        applyServerStateToMobile,
        resetMobileClientState,
        renderLockedSuccessCard,
        updateSyncStatusBadge
      } = ctx;

  function updateMobileLobbyTeamsStatus(connectedTeams) {
    if (!connectedTeams) return;
    const itemA = document.getElementById('gmmMobLobbyStatusTeamA');
    const itemB = document.getElementById('gmmMobLobbyStatusTeamB');
    if (itemA) {
      if (connectedTeams.teamA) {
        itemA.className = 'gmm-mob-team-item ready';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemA.className = 'gmm-mob-team-item waiting';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
    if (itemB) {
      if (connectedTeams.teamB) {
        itemB.className = 'gmm-mob-team-item ready';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemB.className = 'gmm-mob-team-item waiting';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
  }



  async function initStudentMobileArena(teamKey) {
    ctx.setStudentMobile(true, teamKey);

    // Kích hoạt chế độ cô lập điện thoại học sinh
    document.documentElement.classList.add('gmm-student-mode');
    document.body.classList.add('gmm-student-mode');

    const arena = document.getElementById('gmmStudentArena');
    if (!arena) return;

    arena.classList.add('active');

    // Cập nhật thông tin nhận diện Đội
    const tag = document.getElementById('gmmMobTeamTag');
    const icon = document.getElementById('gmmMobTeamIcon');
    const name = document.getElementById('gmmMobTeamName');
    const lobbyTitle = document.getElementById('gmmMobLobbyTeamTitle');
    const lobbySymbol = document.getElementById('gmmMobLobbySymbolTitle');
    const lobbyRoom = document.getElementById('gmmMobLobbyRoomCode');

    if (lobbyRoom) lobbyRoom.textContent = gameState.roomCode || '2011-THCS';

    const currentTeamName = (teamKey === 'teamA') ? (gameState.teamA?.name || 'ĐOÀN KẾT') : (gameState.teamB?.name || 'LA BÀN TUỔI TRẺ');
    const teamNumStr = teamKey === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';

    if (teamKey === 'teamA') {
      if (tag) tag.className = 'gmm-mob-team-tag team-a';
      if (icon) icon.textContent = '🔴';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔴 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Ngôi trường hạnh phúc không bạo lực"';
    } else {
      if (tag) tag.className = 'gmm-mob-team-tag team-b';
      if (icon) icon.textContent = '🔵';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔵 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Trái tim thấu cảm – Tự tin tỏa sáng"';
    }

    // Khôi phục dữ liệu tạm từ LocalStorage trước, sau đó kiểm tra đối chiếu sessionId với máy chủ
    loadMobileAnswersFromLocal();

    // Báo cho Server biết đội đã vào phòng thi
    announceMobileJoinToServer(teamKey, true);

    // Kết nối SSE + Kênh Polling dự phòng 2.5s + Tự đồng bộ khi mở lại màn hình Zalo WebView
    connectStudentSSE();
    bindMobileLifecycleSync();
    startMobileStatePolling();

    // Tự động kích hoạt Wake Lock giữ sáng màn hình + Khóa chống thoát trang + Phát nhịp tim Live Ping
    requestScreenWakeLock();
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.initStudentMonitor === 'function') {
      window.GiaiMaLiveMonitor.initStudentMonitor(teamKey);
    }

    // Lấy trạng thái chuẩn xác từ máy chủ TRƯỚC (để tự xóa kết quả cũ nếu Thầy/Cô đã tạo ván mới)
    await fetchCurrentServerState(false);

    // Chỉ gửi bù hàng đợi offline nếu vẫn thuộc cùng phiên thi đấu đang chạy
    if (mobileState.pendingSyncQueue.length > 0 && !mobileState.isLocked) {
      flushPendingSyncQueue();
    }
  }


  function jumpMobileToFirstUnanswered() {
    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      const qId = list[i].id;
      if (mobileState.teamAnswers[qId] === undefined || mobileState.teamAnswers[qId] === null) {
        mobileState.activeQIndex = i;
        return;
      }
    }
  }


  function updateMobileTimerUI() {
    const timerNum = document.getElementById('gmmMobTimerNum');
    const progressBar = document.getElementById('gmmMobTimerProgressBar');
    if (timerNum) {
      timerNum.textContent = formatMinutesSeconds(mobileState.remainingSeconds);
      if (mobileState.remainingSeconds <= 30) {
        timerNum.style.color = '#ef4444';
      } else {
        timerNum.style.color = '#10b981';
      }
    }
    if (progressBar) {
      const total = mobileState.totalSeconds || 300;
      const pct = Math.max(0, Math.min(100, (mobileState.remainingSeconds / total) * 100));
      progressBar.style.width = pct + '%';
      if (mobileState.remainingSeconds <= 30) {
        progressBar.classList.add('danger');
      } else {
        progressBar.classList.remove('danger');
      }
    }
  }

  // Quản lý đồng hồ đếm ngược Tô Màu & Giải Mã Tranh trên điện thoại học sinh (Tab 4)


  function playMobileTingSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!mobileState.audioCtx) {
        mobileState.audioCtx = new AudioCtx();
      }
      if (mobileState.audioCtx.state === 'suspended') {
        mobileState.audioCtx.resume().catch(() => {});
      }
      const now = mobileState.audioCtx.currentTime;

      // Nốt 1: E6 (1318.5 Hz)
      const osc1 = mobileState.audioCtx.createOscillator();
      const gain1 = mobileState.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(mobileState.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nốt 2 lấp lánh vui nhộn: B6 (1975.5 Hz) sau 0.05s
      const osc2 = mobileState.audioCtx.createOscillator();
      const gain2 = mobileState.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.5, now + 0.05);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(mobileState.audioCtx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.45);
    } catch (_e) {}
  }

  // Quản lý lưu trữ Offline-first & Hàng đợi đồng bộ bù khi mất Wi-Fi

  function triggerMobileAutoAdvance(currentIdx) {
    if (mobileState.autoAdvanceTimer) {
      clearTimeout(mobileState.autoAdvanceTimer);
      mobileState.autoAdvanceTimer = null;
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    const answeredCount = Object.keys(mobileState.teamAnswers).length;

    // Rung nhẹ haptic feedback nếu thiết bị hỗ trợ
    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (_e) {}
    }

    // Hiển thị thông báo trạng thái ngắn
    const banner = document.getElementById('gmmMobStatusBanner');
    if (banner) {
      banner.innerHTML = `⚡ <strong>Đã ghi nhận đáp án!</strong> Đang tự động chuyển câu tiếp theo...`;
    }

    mobileState.autoAdvanceTimer = setTimeout(() => {
      if (currentIdx < list.length - 1) {
        goToMobileQuestion(currentIdx + 1, 'next');
      } else {
        let firstUnanswered = -1;
        for (let i = 0; i < list.length; i++) {
          const qId = list[i].id;
          if (mobileState.teamAnswers[qId] === undefined || mobileState.teamAnswers[qId] === null) {
            firstUnanswered = i;
            break;
          }
        }

        if (firstUnanswered !== -1 && firstUnanswered !== currentIdx) {
          goToMobileQuestion(firstUnanswered, 'next');
          if (typeof window.showToast === 'function') {
            window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
          }
        } else if (answeredCount >= list.length) {
          renderCurrentMobileQuestion();
          if (typeof window.showToast === 'function') {
            window.showToast('🎉 Đội em đã hoàn thành 10/10 câu! Hãy kiểm tra lại hoặc bấm Chốt nộp bài.', 'success');
          }
        }
      }
    }, 450);
  }

  // Khởi tạo cử chỉ vuốt ngón tay (Swipe Gesture) sang trái/phải trên màn hình điện thoại
  function bindMobileSwipeGestures() {
    if (mobileState.isSwipeBound) return;
    const quizView = document.getElementById('gmmMobQuizView');
    if (!quizView) return;
    mobileState.isSwipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    quizView.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    quizView.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const timeElapsed = Date.now() - touchStartTime;

        // Vuốt dứt khoát trong 500ms, độ dịch chuyển ngang > 50px và góc nghiêng chuẩn
        if (timeElapsed < 500 && Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
          if (diffX < 0) {
            nextMobileQuestion();
          } else {
            prevMobileQuestion();
          }
        }
      }
    }, { passive: true });
  }

  function renderMobileQuestionPalette() {
    const pal = document.getElementById('gmmMobQPalette');
    if (!pal) return;
    pal.innerHTML = '';

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();

    list.forEach((q, idx) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.setAttribute('data-index', idx);
      const myAns = mobileState.teamAnswers[q.id];
      const hasAns = (myAns !== undefined && myAns !== null);
      const isActive = (idx === mobileState.activeQIndex);

      let cls = 'gmm-mob-q-tag';
      if (mobileState.isLocked) {
        if (myAns === q.correct) cls += ' correct';
        else if (hasAns) cls += ' wrong';
      } else if (hasAns) {
        cls += ' answered';
      }
      if (isActive) cls += ' active';

      tag.className = cls;
      tag.textContent = idx + 1;
      tag.onclick = (e) => {
        if (e) e.preventDefault();
        const dir = (idx >= mobileState.activeQIndex) ? 'next' : 'prev';
        goToMobileQuestion(idx, dir);
      };
      pal.appendChild(tag);
    });

    const countEl = document.getElementById('gmmMobAnsweredCount');
    if (countEl) {
      countEl.textContent = Object.keys(mobileState.teamAnswers).length;
    }

    const lockBtn = document.getElementById('gmmMobBtnLockSubmit');
    if (lockBtn) {
      if (mobileState.isLocked) {
        lockBtn.classList.add('locked');
        lockBtn.innerHTML = '<span>✅ Đội Em Đã Nộp Bài Thành Công</span>';
      } else {
        lockBtn.classList.remove('locked');
        const count = Object.keys(mobileState.teamAnswers).length;
        lockBtn.innerHTML = `<span>🔒 Chốt Kết Quả & Mở Khóa Ma Trận (${count}/${list.length})</span>`;
      }
    }
  }

  function renderCurrentMobileQuestion(direction = 'none') {
    bindMobileSwipeGestures();
    renderLockedSuccessCard();

    const stage = document.getElementById('gmmMobQuestionStage');
    if (stage) {
      if (mobileState.isLocked && !mobileState.isReviewMode) {
        stage.style.display = 'none';
      } else {
        stage.style.display = 'block';
        // Chỉ chạy hiệu ứng lướt chuyển cảnh khi học sinh chuyển câu (tránh giật khung khi đồng bộ nền)
        if (direction === 'prev' || direction === 'next') {
          stage.classList.remove('gmm-slide-in-right', 'gmm-slide-in-left');
          void stage.offsetWidth;
          stage.classList.add(direction === 'prev' ? 'gmm-slide-in-left' : 'gmm-slide-in-right');
        }
      }
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    if (!list || list.length === 0) return;

    if (mobileState.activeQIndex >= list.length) mobileState.activeQIndex = 0;
    const q = list[mobileState.activeQIndex];
    if (!q) return;

    const qNum = document.getElementById('gmmMobQNum');
    const coordBadge = document.getElementById('gmmMobCoordBadge');
    const qText = document.getElementById('gmmMobQText');
    const grid = document.getElementById('gmmMobOptionsGrid');
    const banner = document.getElementById('gmmMobStatusBanner');
    const prevBtn = document.getElementById('gmmMobBtnPrev');
    const nextBtn = document.getElementById('gmmMobBtnNext');

    if (qNum) qNum.textContent = `CÂU HỎI ${mobileState.activeQIndex + 1}/${list.length}`;
    if (coordBadge) coordBadge.textContent = `🎯 ${q.coordinate || 'Ô SỐ ' + (mobileState.activeQIndex + 1)}`;
    if (qText) qText.textContent = q.question;

    if (prevBtn) {
      prevBtn.disabled = (mobileState.activeQIndex === 0);
    }
    
    const answeredCount = Object.keys(mobileState.teamAnswers).length;
    if (nextBtn) {
      if (mobileState.isLocked) {
        nextBtn.innerHTML = '<span>Đã Nộp Bài ✅</span>';
        nextBtn.className = 'gmm-mob-nav-btn lock-ready';
      } else if (mobileState.activeQIndex === list.length - 1) {
        if (answeredCount >= list.length) {
          nextBtn.innerHTML = '<span>Nộp Bài 🔒</span>';
          nextBtn.className = 'gmm-mob-nav-btn lock-ready';
        } else {
          nextBtn.innerHTML = '<span>Về Đầu ↩</span>';
          nextBtn.className = 'gmm-mob-nav-btn primary';
        }
      } else {
        nextBtn.innerHTML = '<span>Câu Tiếp ▶</span>';
        nextBtn.className = 'gmm-mob-nav-btn primary';
      }
    }

    const myAnswer = mobileState.teamAnswers[q.id];
    const letters = ['A', 'B', 'C', 'D'];

    if (grid) {
      grid.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gmm-mob-opt-btn';

        const isChosen = (myAnswer === idx);
        if (isChosen) btn.classList.add('selected');

        if (mobileState.isLocked) {
          if (idx === q.correct) btn.classList.add('correct');
          else if (isChosen) btn.classList.add('wrong');
        }

        const safeOptHtml = String(opt)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        btn.innerHTML = `
          <div class="gmm-mob-opt-letter">${letters[idx]}</div>
          <div style="flex: 1;">${safeOptHtml}</div>
        `;

        btn.onclick = () => {
          if (mobileState.isLocked) {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 Đội em đã chốt kết quả, không thể đổi đáp án!', 'warning');
            } else {
              alert('Đội em đã chốt kết quả bài thi!');
            }
            return;
          }

          // Phát âm thanh "Ting" vui nhộn ngay trên loa điện thoại
          playMobileTingSound();

          mobileState.teamAnswers[q.id] = idx;
          submitAnswerFromMobile(q.id, idx);
          renderMobileQuestionPalette();
          renderCurrentMobileQuestion('next');

          // Tự động chuyển sang câu tiếp theo sau 450ms
          triggerMobileAutoAdvance(mobileState.activeQIndex);
        };

        grid.appendChild(btn);
      });
    }
    if (window.GmmMathFormat && typeof window.GmmMathFormat.renderMathInContainer === 'function') {
      if (qText) window.GmmMathFormat.renderMathInContainer(qText);
      if (grid) window.GmmMathFormat.renderMathInContainer(grid);
    }

    if (banner) {
      const coordName = q.coordinate || `Ô số ${mobileState.activeQIndex + 1}`;
      if (mobileState.isLocked) {
        if (myAnswer === q.correct) {
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert success">
              <div style="font-size: 1.15rem; font-weight: 900; color: #34d399;">🎉 CHÍNH XÁC (+1 ĐIỂM)!</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #fde047; margin: 6px 0;">👉 BÁO BẠN TÔ BÚT DẠ VÀO:</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #ffffff; background: #059669; padding: 6px 16px; border-radius: 8px; display: inline-block;">TỌA ĐỘ ${coordName.toUpperCase()}</div>
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 6px;">trên bảng giấy A1 tại bàn thi!</div>
            </div>
          `;
        } else {
          const chosenLetter = (myAnswer !== undefined && myAnswer !== null) ? letters[myAnswer] : 'Chưa chọn';
          const chosenText = (myAnswer !== undefined && myAnswer !== null && q.options[myAnswer]) ? q.options[myAnswer] : 'Chưa chọn đáp án';
          const correctLetter = letters[q.correct];
          const correctText = q.options[q.correct];
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert wrong">
              <div style="font-size: 1.05rem; font-weight: 900; color: #f87171; margin-bottom: 6px;">❌ CHƯA CHÍNH XÁC (Chưa mở khóa ${coordName})</div>
              <div style="font-size: 0.84rem; color: #fca5a5; margin-bottom: 4px;">• Đội em đã chọn: <strong>[${chosenLetter}] ${chosenText}</strong></div>
              <div style="font-size: 0.88rem; color: #34d399; font-weight: 800; background: rgba(5, 150, 105, 0.2); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.35);">👉 Đáp án chuẩn của Thầy/Cô: <strong>[${correctLetter}] ${correctText}</strong></div>
            </div>
          `;
        }
      } else if (myAnswer !== undefined && myAnswer !== null) {
        banner.innerHTML = `✅ Đội em đã chọn [${letters[myAnswer]}]. Có thể chạm chọn lại bất kỳ lúc nào hoặc đổi câu ở thanh bên dưới!`;
      } else {
        banner.innerHTML = `👉 Chạm vào 1 trong 4 phương án trên để trả lời câu này!`;
      }
    }
  }

  function goToMobileQuestion(index, direction) {
    if (mobileState.autoAdvanceTimer) {
      clearTimeout(mobileState.autoAdvanceTimer);
      mobileState.autoAdvanceTimer = null;
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    if (index < 0 || index >= list.length) return;

    if (!direction) {
      direction = (index >= mobileState.activeQIndex) ? 'next' : 'prev';
    }

    mobileState.activeQIndex = index;
    renderMobileQuestionPalette();
    renderCurrentMobileQuestion(direction);

    // Đồng bộ tức thì câu hỏi hiện tại của điện thoại lên màn hình Giáo viên
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
      window.GiaiMaLiveMonitor.sendMobilePing(false);
    }

    // Cuộn màn hình lên đầu card câu hỏi
    const arena = document.getElementById('gmmStudentArena');
    if (arena) {
      arena.scrollTop = 0;
    }

    // Tự động cuộn thanh số Palette để thẻ số đang làm luôn nằm giữa khung nhìn
    setTimeout(() => {
      const activeTag = document.querySelector(`.gmm-mob-q-tag[data-index="${index}"]`);
      if (activeTag && typeof activeTag.scrollIntoView === 'function') {
        activeTag.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 40);
  }

  function prevMobileQuestion() {
    if (mobileState.autoAdvanceTimer) {
      clearTimeout(mobileState.autoAdvanceTimer);
      mobileState.autoAdvanceTimer = null;
    }
    if (mobileState.activeQIndex > 0) {
      goToMobileQuestion(mobileState.activeQIndex - 1, 'prev');
    }
  }

  function nextMobileQuestion() {
    if (mobileState.autoAdvanceTimer) {
      clearTimeout(mobileState.autoAdvanceTimer);
      mobileState.autoAdvanceTimer = null;
    }

    if (mobileState.isLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã chốt nộp bài thành công!', 'info');
      }
      return;
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    if (mobileState.activeQIndex < list.length - 1) {
      goToMobileQuestion(mobileState.activeQIndex + 1, 'next');
    } else {
      const answeredCount = Object.keys(mobileState.teamAnswers).length;
      if (answeredCount >= list.length) {
        confirmLockMobileTeam();
        return;
      }

      let firstUnanswered = -1;
      for (let i = 0; i < list.length; i++) {
        const qId = list[i].id;
        if (mobileState.teamAnswers[qId] === undefined || mobileState.teamAnswers[qId] === null) {
          firstUnanswered = i;
          break;
        }
      }
      if (firstUnanswered !== -1 && firstUnanswered !== mobileState.activeQIndex) {
        goToMobileQuestion(firstUnanswered, 'next');
        if (typeof window.showToast === 'function') {
          window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
        }
      } else {
        goToMobileQuestion(0, 'prev');
      }
    }
  }

  function confirmLockMobileTeam() {
    if (mobileState.isLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã nộp bài thành công!', 'info');
      } else {
        alert('Đội em đã nộp bài thành công!');
      }
      return;
    }

    const list = (mobileState.questionsList && mobileState.questionsList.length > 0) ? mobileState.questionsList : ctx.getQuestionsList();
    const answeredCount = Object.keys(mobileState.teamAnswers).length;
    const msg = `Đội em đã hoàn thành ${answeredCount}/${list.length} câu hỏi.\n\nSau khi chốt kết quả, các đáp án sẽ được khóa lại và mở khóa các ô ma trận tranh bí mật để các bạn tô lên bảng A1.\n\nĐội em có chắc chắn muốn chốt nộp bài ngay bây giờ không?`;
    if (confirm(msg)) {
      lockMobileTeam();
    }
  }

  async function lockMobileTeam() {
    mobileState.isLocked = true;
    clearInterval(mobileState.timerInterval);

    const elapsed = Math.max(0, (mobileState.totalSeconds || 90) - (mobileState.remainingSeconds || 0));
    mobileState.finishTimeSeconds = elapsed;
    mobileState.finishTimeFormatted = formatMinutesSeconds(elapsed);

    saveMobileAnswersToLocal();

    try {
      const res = await fetch('/api/gmm/lock-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          sessionId: mobileState.sessionId,
          answers: mobileState.teamAnswers,
          finishTime: mobileState.finishTimeFormatted,
          finishSeconds: mobileState.finishTimeSeconds
        })
      });
      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Thầy/Cô đã bắt đầu ván mới! Hệ thống đã làm mới bài thi cho đội em.', 'info');
          }
          return;
        }
      }
    } catch (_e) {}

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');

    if (navigator.vibrate) {
      try { navigator.vibrate([150, 80, 250]); } catch (_) {}
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    // Bắn pháo hoa Confetti bung lụa rực rỡ ngay trên màn hình điện thoại
    triggerMobileConfetti();

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 Đội em đã chốt nộp bài thành công (⏱️ ${mobileState.finishTimeFormatted})! Hãy xem các ô mở khóa để tô tranh A1.`, 'success');
    }
  }

  // Hiệu ứng pháo hoa Confetti bung lụa rực rỡ trên màn hình điện thoại
  function triggerMobileConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.55 },
          zIndex: 2147483647,
          colors: ['#38bdf8', '#34d399', '#fde047', '#f43f5e', '#a855f7']
        });
        setTimeout(() => {
          window.confetti({
            particleCount: 55,
            angle: 60,
            spread: 65,
            origin: { x: 0.05, y: 0.75 },
            zIndex: 2147483647
          });
          window.confetti({
            particleCount: 55,
            angle: 120,
            spread: 65,
            origin: { x: 0.95, y: 0.75 },
            zIndex: 2147483647
          });
        }, 220);
      } catch (_e) {}
    }
  }

  function autoLockMobileTeam() {
    if (mobileState.isLocked) return;
    mobileState.isLocked = true;
    clearInterval(mobileState.timerInterval);
    lockMobileTeam();
    if (typeof window.showToast === 'function') {
      window.showToast('⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài của đội em.', 'warning');
    }
  }

  // Học sinh bấm gửi câu trả lời lên Server (hỗ trợ lưu LocalStorage & hàng đợi Offline)
  async function submitAnswerFromMobile(questionId, optionIdx) {
    saveMobileAnswersToLocal();

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (_e) {}
    }

    try {
      const res = await fetch('/api/gmm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: ctx.getStudentTeamKey(),
          sessionId: mobileState.sessionId,
          questionId: questionId,
          optionIndex: optionIdx,
          currentQ: (typeof mobileState.activeQIndex === 'number' ? mobileState.activeQIndex : 0) + 1
        })
      });

      if (res && res.ok) {
        if (mobileState.pendingSyncQueue.length > 0) {
          flushPendingSyncQueue();
        } else {
          updateSyncStatusBadge();
        }
        return;
      }

      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Ván chơi vừa được Thầy/Cô đặt lại! Mời đội em làm lại từ Câu 1.', 'info');
          }
          return;
        }
        if (errJson && errJson.teamLocked) {
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          return;
        }
      }

      throw new Error('Mã phản hồi từ máy chủ không hợp lệ');
    } catch (_err) {
      console.warn('Lỗi kết nối Wi-Fi khi nộp câu trả lời, lưu vào hàng đợi offline:', _err);
      addToPendingSyncQueue(questionId, optionIdx);
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Mạng Wi-Fi chập chờn - Đáp án đã được lưu an toàn trên máy!', 'warning');
      }
    }
  }


      return {
        updateMobileLobbyTeamsStatus,
        initStudentMobileArena,
        jumpMobileToFirstUnanswered,
        updateMobileTimerUI,
        playMobileTingSound,
        triggerMobileAutoAdvance,
        bindMobileSwipeGestures,
        renderMobileQuestionPalette,
        renderCurrentMobileQuestion,
        goToMobileQuestion,
        prevMobileQuestion,
        nextMobileQuestion,
        confirmLockMobileTeam,
        lockMobileTeam,
        triggerMobileConfetti,
        autoLockMobileTeam,
        submitAnswerFromMobile
      };
    }
  };
})();
