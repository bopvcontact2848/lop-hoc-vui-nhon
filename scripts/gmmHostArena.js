/**
 * ==============================================================================
 * MODULE ĐẤU TRƯỜNG MÁY CHIẾU SONG SONG (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmHostArena.js
 * Trách nhiệm: Vẽ giao diện đấu trường 2 đội trên máy chiếu, đồng bộ điểm số,
 * bộ đếm giờ thi đấu, mở khóa đội làm bài và màn hình tổng kết chung cuộc.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmHostArena = {
    create: function (ctx) {
      const {
        gameState,
        triggerPulseGlow,
        updateStealthButtonUI,
        generateSvgPuzzle,
        updateStageFloatPauseBtn,
        chooseAnswer,
        updateProgressBar,
        broadcastHostStateToServer,
        runCountdownAnimation,
        stopBattleMusicUI,
        setArtworkViewMode,
        resetTiltAngle,
        broadcastCountdownState,
        updateCanvasThemeButtonUI
      } = ctx;

  function formatMinutesSeconds(totalSec) {
    const s = Math.max(0, Math.floor(totalSec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  let lastHeartbeatSec = -1;

  function updateMatchTimerUI() {
    const digits = document.getElementById('gmmMatchTimerDigits');
    if (digits) {
      digits.textContent = formatMinutesSeconds(gameState.timerSeconds);

      // Phân tầng hiệu ứng đổi màu đồng hồ theo từng chặng thời gian:
      // - > 30s: Xanh ngọc Emerald bình thường
      // - 11s -> 30s: Vàng hổ phách Amber cảnh báo
      // - <= 10s: Đỏ rực lửa + Nhấp nháy nhịp tim dồn dập
      digits.classList.remove('warning-amber', 'urgent', 'heartbeat-pulse');

      if (gameState.timerSeconds <= 10 && gameState.timerSeconds > 0) {
        digits.classList.add('urgent', 'heartbeat-pulse');
        if (gameState.isTimerRunning && lastHeartbeatSec !== gameState.timerSeconds) {
          lastHeartbeatSec = gameState.timerSeconds;
          if (window.audioManager && typeof window.audioManager.playHeartbeat === 'function') {
            window.audioManager.playHeartbeat(gameState.timerSeconds);
          }
        }
      } else if (gameState.timerSeconds <= 30 && gameState.timerSeconds > 10) {
        digits.classList.add('warning-amber');
        lastHeartbeatSec = -1;
      } else {
        if (gameState.timerSeconds === 0) {
          digits.classList.add('urgent');
        }
        lastHeartbeatSec = -1;
      }
    }
  }

  function recalculateTeamScore(teamKey) {
    const team = gameState[teamKey];
    if (!team) return;
    const oldUnlocked = Array.isArray(team.unlockedRegions) ? [...team.unlockedRegions] : [];
    team.score = 0;
    team.unlockedRegions = [];
    const newItems = [];
    ctx.getQuestionsList().forEach((q, idx) => {
      const ans = team.answers ? team.answers[q.id] : undefined;
      if (ans === q.correct) {
        team.score += 1;
        const regId = q.regionId || `reg_${idx + 1}`;
        if (!team.unlockedRegions.includes(regId)) {
          team.unlockedRegions.push(regId);
          if (!oldUnlocked.includes(regId)) {
            newItems.push(regId);
          }
        }
      }
    });
    updateHeaderScores();
    newItems.forEach(regId => triggerPulseGlow(teamKey, regId));
  }

  function renderDualArena() {
    updateMatchTimerUI();
    updateStealthButtonUI();

    // Cập nhật trạng thái nút Bắt đầu / Tạm dừng / Ván Mới trong Đấu trường
    const startArenaBtn = document.getElementById('gmmBtnStartArena');
    const pauseBtn = document.getElementById('gmmBtnMatchPause');
    const restartArenaBtn = document.getElementById('gmmBtnRestartArena');
    const durationGroup = document.getElementById('gmmDurationPresetGroup');

    if (startArenaBtn) {
      if (!gameState.isMatchStarted) {
        startArenaBtn.style.display = 'inline-flex';
        startArenaBtn.innerHTML = '<span>🚀 BẮT ĐẦU TRÒ CHƠI</span>';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (durationGroup) durationGroup.style.display = 'flex';
      } else {
        startArenaBtn.style.display = 'none';
        if (pauseBtn) {
          pauseBtn.style.display = 'inline-flex';
          pauseBtn.innerHTML = gameState.isTimerRunning
            ? '<span>⏸️ Tạm Dừng</span>'
            : '<span>▶️ Tiếp Tục</span>';
        }
      }
    }

    if (restartArenaBtn) {
      const hasAnyProgress = Boolean(
        gameState.isMatchStarted ||
        gameState.teamA?.isLocked ||
        gameState.teamB?.isLocked ||
        Object.keys(gameState.teamA?.answers || {}).length > 0 ||
        Object.keys(gameState.teamB?.answers || {}).length > 0
      );
      restartArenaBtn.style.display = hasAnyProgress ? 'inline-flex' : 'none';
    }

    // Đồng bộ nút trên thanh nổi Sân Khấu Máy Chiếu
    const floatStartBtn = document.getElementById('gmmStageFloatStartBtn');
    const floatPauseBtn = document.getElementById('gmmStageFloatPauseBtn');
    if (floatStartBtn && floatPauseBtn) {
      if (!gameState.isMatchStarted) {
        floatStartBtn.style.display = 'inline-flex';
        floatPauseBtn.style.display = 'none';
      } else {
        floatStartBtn.style.display = 'none';
        floatPauseBtn.style.display = 'inline-flex';
      }
    }

    // Hiển thị nút mở sang Tab 4 Tô Màu khi cả 2 đội đã hoàn thành/chốt bài
    const bothTeamsLocked = Boolean(gameState.teamA?.isLocked && gameState.teamB?.isLocked);
    const nextToDecryptBtn = document.getElementById('gmmBtnNextToDecrypt');
    if (nextToDecryptBtn) {
      nextToDecryptBtn.style.display = bothTeamsLocked ? 'inline-flex' : 'none';
    }
    const floatNextBtn = document.getElementById('gmmStageFloatNextBtn');
    if (floatNextBtn) {
      floatNextBtn.style.display = bothTeamsLocked ? 'inline-flex' : 'none';
    }
    if (bothTeamsLocked) {
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (floatPauseBtn) floatPauseBtn.style.display = 'none';
    }

    ['teamA', 'teamB'].forEach(tKey => {
      const isTeamA = tKey === 'teamA';
      const letter = isTeamA ? 'A' : 'B';
      const team = gameState[tKey];
      if (!team) return;

      if (team.isLocked) {
        recalculateTeamScore(tKey);
      }

      const scoreEl = document.getElementById(`gmmScoreTeam${letter}`);
      if (scoreEl) scoreEl.textContent = team.score + (team.bonusScore || 0);

      const answeredCount = Object.keys(team.answers || {}).length;
      const progEl = document.getElementById(`gmmProgressTeam${letter}`);
      if (progEl) progEl.textContent = `${answeredCount}/${ctx.getQuestionsList().length}`;

      const fillEl = document.getElementById(`gmmProgressFillTeam${letter}`);
      if (fillEl) fillEl.style.width = `${(answeredCount / ctx.getQuestionsList().length) * 100}%`;

      const statusBadge = document.getElementById(`gmmStatusBadgeTeam${letter}`);
      if (statusBadge) {
        if (team.isLocked) {
          const timeBadgeStr = team.finishTimeFormatted ? ` (⏱️ ${team.finishTimeFormatted})` : '';
          statusBadge.innerHTML = `✅ <span style="color: #34d399;">ĐÃ CHỐT NỘP BÀI${timeBadgeStr}</span>`;
        } else if (!gameState.isMatchStarted) {
          if (gameState.isCountdownRunning) {
            statusBadge.innerHTML = '🚀 <span style="color: #38bdf8;">Chuẩn bị bắt đầu...</span>';
          } else if (gameState.connectedTeams && gameState.connectedTeams[tKey]) {
            statusBadge.innerHTML = '🕒 <span style="color: #7dd3fc;">Đang chờ...</span>';
          } else {
            statusBadge.innerHTML = '🕒 <span style="color: #94a3b8;">Đang chờ...</span>';
          }
        } else if (answeredCount === ctx.getQuestionsList().length) {
          statusBadge.innerHTML = '🎯 <span style="color: #38bdf8;">ĐÃ LÀM XONG 10 CÂU</span>';
        } else {
          statusBadge.innerHTML = '⏳ <span style="color: #fde047;">Đang làm bài...</span>';
        }
      }

      const unlockBtn = document.getElementById(`gmmBtnUnlockTeam${letter}`);
      if (unlockBtn) {
        unlockBtn.style.display = team.isLocked ? 'inline-flex' : 'none';
      }

      // Render 10 mini badges in #gmmQGridTeamA / #gmmQGridTeamB
      const gridEl = document.getElementById(`gmmQGridTeam${letter}`);
      if (gridEl) {
        gridEl.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        ctx.getQuestionsList().forEach((q, idx) => {
          const badge = document.createElement('div');
          const myAns = team.answers ? team.answers[q.id] : undefined;
          const hasAns = (myAns !== undefined && myAns !== null);

          let badgeClass = 'gmm-team-q-badge';
          let badgeContent = `<span class="q-num">${idx + 1}</span>`;

          if (team.isLocked) {
            if (myAns === q.correct) {
              badgeClass += ' correct';
              badgeContent += `<span class="q-ans">✔</span>`;
            } else {
              badgeClass += ' wrong';
              badgeContent += `<span class="q-ans">✘</span>`;
            }
          } else if (hasAns) {
            badgeClass += ' answered';
            badgeContent += `<span class="q-ans">${letters[myAns]}</span>`;
          }

          badge.className = badgeClass;
          badge.innerHTML = badgeContent;
          badge.title = `Câu ${idx + 1}: ${hasAns ? 'Đã chọn [' + letters[myAns] + ']' : 'Chưa trả lời'}`;
          gridEl.appendChild(badge);
        });
      }

      // Render SVG Puzzle
      const puzzleWrap = document.getElementById(`gmmPuzzleTeam${letter}`);
      if (puzzleWrap) {
        puzzleWrap.innerHTML = generateSvgPuzzle(tKey);
      }

      const unlockedEl = document.getElementById(`gmmUnlockedCount${letter}`);
      if (unlockedEl) {
        unlockedEl.textContent = team.unlockedRegions ? team.unlockedRegions.length : 0;
      }
    });

    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
      window.GiaiMaLiveMonitor.renderHostPingIndicators();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
      window.GiaiMaTeacherKey.renderLiveQuizCards();
    }
  }

  function getConnectedTeams() {
    return gameState.connectedTeams || { teamA: false, teamB: false };
  }

  function getArenaLiveSnapshot() {
    return {
      isMatchStarted: Boolean(gameState.isMatchStarted),
      isStealthMode: Boolean(gameState.isStealthMode),
      connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
      questions: ctx.getQuestionsList(),
      teamA: gameState.teamA,
      teamB: gameState.teamB
    };
  }

  function getTeamAnsweredCount(teamKey) {
    if (!gameState[teamKey] || !gameState[teamKey].answers) return 0;
    return Object.keys(gameState[teamKey].answers).length;
  }

  function applyTeamUnlockOnHost(teamKey, preservedAnswers = null) {
    const team = gameState[teamKey];
    if (!team) return;
    team.isLocked = false;
    team.finishTime = null;
    team.finishTimeSeconds = null;
    team.finishTimeFormatted = null;
    team.score = 0;
    team.unlockedRegions = [];
    if (preservedAnswers && typeof preservedAnswers === 'object') {
      team.answers = Object.assign({}, preservedAnswers);
    }
    updateHeaderScores();
    renderDualArena();
  }

  function toggleMatchPause() {
    gameState.isTimerRunning = !gameState.isTimerRunning;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});

    const btn = document.getElementById('gmmBtnMatchPause');
    if (btn) {
      btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
    }
    updateStageFloatPauseBtn();
  }

  function addMatchSeconds(sec = 30) {
    gameState.timerSeconds = (gameState.timerSeconds || 0) + sec;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', seconds: sec })
    }).catch(() => {});

    updateMatchTimerUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã cộng thêm ${sec} giây cho cả 2 đội!`, 'success');
    }
  }

  function addMatchMinute(sec = 60) {
    addMatchSeconds(sec);
  }

  function setMatchDuration(sec) {
    gameState.totalMatchSeconds = sec;
    gameState.timerSeconds = sec;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', seconds: sec, totalMatchSeconds: sec })
    }).catch(() => {});

    [60, 90, 120, 180].forEach(s => {
      const btn = document.getElementById(`gmmTimeBtn_${s}`);
      if (btn) btn.classList.toggle('primary', s === sec);
    });
    updateMatchTimerUI();
  }

  // Chốt kết quả trận đấu 10 câu trắc nghiệm, tính điểm, phát âm thanh chiến thắng, pháo hoa
  // LƯU Ý: Giữ nguyên ở Tab 3 để Giáo viên chủ động tổng kết, nhận xét, chỉ khi Giáo viên click mở Tab 4 thì mới chuyển
  function handleMatchConclusion(isManualTrigger = false) {
    gameState.isTimerRunning = false;
    gameState.teamA.isLocked = true;
    gameState.teamB.isLocked = true;

    // Dừng nhạc nền thi đấu
    stopBattleMusicUI(0.6);

    // Tính điểm và cập nhật giao diện Đấu trường
    recalculateTeamScore('teamA');
    recalculateTeamScore('teamB');
    renderDualArena();

    // Phát âm thanh ăn mừng chiến thắng
    if (window.audioManager) {
      if (typeof window.audioManager.playVictory === 'function') {
        window.audioManager.playVictory();
      } else if (typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }
    }

    // Bắn hiệu ứng pháo hoa rực rỡ
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (_e) {}
    }

    // Thông báo Toast hoàn thành phần thi 10 câu trắc nghiệm
    if (typeof window.showToast === 'function') {
      const msg = isManualTrigger
        ? '🔒 ĐÃ CHỐT KẾT QUẢ BÀI THI! 10 câu trắc nghiệm đã hoàn thành. Thầy/Cô mở Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.'
        : '⏰ HẾT GIỜ THI ĐẤU! Đã hoàn thành phần thi trắc nghiệm của 2 đội. Thầy/Cô mở Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.';
      window.showToast(msg, 'success');
    }

    // Đồng bộ trạng thái khóa bài của 2 đội xuống máy chủ và điện thoại học sinh
    broadcastHostStateToServer();
  }

  function forceLockBothTeams() {
    if (!confirm('Thầy/Cô có chắc chắn muốn chốt kết quả và khóa bài làm của cả 2 đội ngay bây giờ không?\n\n(Hệ thống sẽ tổng kết điểm 10 câu trắc nghiệm. Thầy/Cô sẽ tự mở sang Tab tiếp theo khi sẵn sàng)')) {
      return;
    }
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' })
    }).catch(() => {});

    handleMatchConclusion(true);
  }


  function prepareFreshMatchSession() {
    gameState.sessionId = Math.max(Date.now(), (Number(gameState.sessionId) || 0) + 1);
    gameState.currentQIndex = 0;
    gameState.isMatchStarted = false;
    gameState.isTimerRunning = false;
    gameState.isQuestionLocked = false;
    gameState.isAnswerRevealed = false;
    gameState.isDecryptPhase = false;
    gameState.isDecryptTimerRunning = false;
    clearInterval(gameState.decryptTimerInterval);
    gameState.newlyUnlocked = { teamA: [], teamB: [] };
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.resetLiveQuizTracking === 'function') {
      window.GiaiMaTeacherKey.resetLiveQuizTracking();
    }

    const savedDuration = gameState.totalMatchSeconds || 120;
    gameState.totalMatchSeconds = savedDuration;
    gameState.timerSeconds = savedDuration;

    ['teamA', 'teamB'].forEach(tKey => {
      const team = gameState[tKey];
      if (!team) return;
      team.score = 0;
      team.bonusScore = 0;
      team.answers = {};
      team.isLocked = false;
      team.unlockedRegions = [];
      team.coloredRegions = {};
      team.completed = false;
      team.finishTime = null;
      team.finishTimeSeconds = null;
      team.finishTimeFormatted = null;
      team.artworkPhoto = null;
      team.photoTimestamp = null;
      team.hasArtworkPhoto = false;
      team.photoRotation = 0;
      team.photoTilt = 0;
      team.isAiEnhanced = true;
      team.photoViewMode = 'svg';

      setArtworkViewMode(tKey, 'svg');
      resetTiltAngle(tKey);

      const img = document.getElementById(`${tKey}_photoImg`);
      const empty = document.getElementById(`${tKey}_photoEmpty`);
      const content = document.getElementById(`${tKey}_photoContent`);
      const dot = document.getElementById(`${tKey}_photoDot`);
      if (img) {
        img.src = '';
        img.style.transform = 'rotate(0deg)';
      }
      if (empty) empty.style.display = 'block';
      if (content) content.style.display = 'none';
      if (dot) dot.style.display = 'none';
    });

    updateHeaderScores();
    renderDualArena();
  }

  function startDualMatch(broadcastOptions = {}) {
    gameState.isMatchStarted = true;
    gameState.isTimerRunning = true;
    gameState.totalMatchSeconds = gameState.totalMatchSeconds || 120;
    gameState.timerSeconds = gameState.timerSeconds || gameState.totalMatchSeconds;

    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        seconds: gameState.timerSeconds,
        totalMatchSeconds: gameState.totalMatchSeconds
      })
    }).catch(() => {});

    renderDualArena();
    broadcastHostStateToServer(broadcastOptions);
  }

  // Giáo viên bấm Bắt đầu trò chơi ngay trong Tab Đấu trường
  function startMatchFromArena() {
    if (gameState.isCountdownRunning) return;
    prepareFreshMatchSession();
    gameState.isCountdownRunning = true;
    renderDualArena();

    // Phát sóng trạng thái đếm ngược 3..2..1 kèm sessionId mới để cả 2 điện thoại xóa sạch kết quả ván cũ
    broadcastCountdownState(3, { resetForNewMatch: true });

    // Kích hoạt hiệu ứng đếm ngược trực quan 3..2..1.. CHIẾN! trên máy chiếu
    runCountdownAnimation(3, () => {
      gameState.isCountdownRunning = false;
      gameState.isMatchStarted = true;
      startDualMatch({ forceTeamOverwrite: true });
      if (typeof window.showToast === 'function') {
        window.showToast('🚀 ĐÃ BẮT ĐẦU TRẬN ĐẤU MỚI! Điện thoại 2 đội đã đồng bộ về Câu 1/10.', 'success');
      }
    });
  }

  // 6. RENDER GIAO DIỆN CÂU HỎI & ĐIỀU KHIỂN
  function updateTimerDisplay() {
    const circle = document.getElementById('gmmTimerNum');
    if (!circle) return;
    circle.textContent = gameState.timerSeconds;

    circle.classList.remove('warning', 'danger');
    if (gameState.timerSeconds <= 5) circle.classList.add('danger');
    else if (gameState.timerSeconds <= 10) circle.classList.add('warning');
  }

  function updateHeaderScores() {
    const scoreA = document.getElementById('gmmScoreA');
    const scoreB = document.getElementById('gmmScoreB');
    if (scoreA) scoreA.textContent = gameState.teamA.score + gameState.teamA.bonusScore;
    if (scoreB) scoreB.textContent = gameState.teamB.score + gameState.teamB.bonusScore;
  }

  function renderQuestionUI() {
    const q = ctx.getQuestionsList()[gameState.currentQIndex];
    if (!q) return;

    const qNumEl = document.getElementById('gmmQNumber');
    const qTextEl = document.getElementById('gmmQText');
    const coordBadge = document.getElementById('gmmQCoordinateBadge');
    const optionsGrid = document.getElementById('gmmOptionsGrid');
    const choiceTextA = document.getElementById('gmmChoiceTextA');
    const choiceTextB = document.getElementById('gmmChoiceTextB');

    const letters = ['A', 'B', 'C', 'D'];
    const coordName = q.coordinate || `Ô số ${gameState.currentQIndex + 1}`;

    if (qNumEl) qNumEl.textContent = `CÂU HỎI ${gameState.currentQIndex + 1}/10`;
    if (qTextEl) qTextEl.textContent = q.question;
    if (coordBadge) {
      coordBadge.innerHTML = `🎯 TỌA ĐỘ MỞ KHÓA BẢNG GIẤY A1: <strong>${coordName.toUpperCase()}</strong>`;
    }

    // Cập nhật thanh hiển thị trạng thái đã chọn của 2 Đội
    const ansA = gameState.teamA.answers[q.id];
    const ansB = gameState.teamB.answers[q.id];

    if (choiceTextA) {
      if (gameState.isAnswerRevealed) {
        choiceTextA.innerHTML = ansA === q.correct
          ? `<span style="color: #34d399; font-weight: 800;">✅ Đúng [${letters[ansA]}] ➔ Mở khóa ${coordName} (Tô bảng A1)</span>`
          : `<span style="color: #fca5a5;">❌ Sai [${ansA !== undefined && ansA !== null ? letters[ansA] : 'Chưa chọn'}]</span>`;
      } else {
        choiceTextA.textContent = (ansA !== undefined && ansA !== null) ? `Đã chọn [${letters[ansA]}]` : 'Chưa chọn';
      }
    }
    if (choiceTextB) {
      if (gameState.isAnswerRevealed) {
        choiceTextB.innerHTML = ansB === q.correct
          ? `<span style="color: #34d399; font-weight: 800;">✅ Đúng [${letters[ansB]}] ➔ Mở khóa ${coordName} (Tô bảng A1)</span>`
          : `<span style="color: #fca5a5;">❌ Sai [${ansB !== undefined && ansB !== null ? letters[ansB] : 'Chưa chọn'}]</span>`;
      } else {
        choiceTextB.textContent = (ansB !== undefined && ansB !== null) ? `Đã chọn [${letters[ansB]}]` : 'Chưa chọn';
      }
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';

      q.options.forEach((opt, idx) => {
        const btn = document.createElement('div');
        btn.className = 'gmm-option-btn';

        const isASelected = ansA === idx;
        const isBSelected = ansB === idx;

        if (isASelected) btn.classList.add('selected-a');
        if (isBSelected) btn.classList.add('selected-b');

        if (gameState.isAnswerRevealed) {
          if (idx === q.correct) btn.classList.add('correct');
          else if (isASelected || isBSelected) btn.classList.add('wrong');
        }

        btn.innerHTML = `
          <div class="gmm-opt-letter">${letters[idx]}</div>
          <div style="flex: 1; padding: 0 8px;">
            <div>${opt}</div>
            ${gameState.isAnswerRevealed && idx === q.correct ? '<div style="font-size: 0.78rem; color: #34d399; font-weight: 800; margin-top: 3px;">✨ ĐÁP ÁN ĐÚNG ✨</div>' : ''}
          </div>
          <div style="display: flex; gap: 6px; align-items: center;" onclick="event.stopPropagation()">
            <button type="button" class="gmm-pick-team-btn btn-a ${isASelected ? 'selected' : ''}"
                    onclick="window.GiaiMaBiMat.chooseAnswer('teamA', ${idx})" title="Đội 1 chọn phương án ${letters[idx]}">
              🔴 Đội 1
            </button>
            <button type="button" class="gmm-pick-team-btn btn-b ${isBSelected ? 'selected' : ''}"
                    onclick="window.GiaiMaBiMat.chooseAnswer('teamB', ${idx})" title="Đội 2 chọn phương án ${letters[idx]}">
              🔵 Đội 2
            </button>
          </div>
        `;

        // Bấm vào thân thẻ đáp án: Gán cho đội nào chưa chọn, hoặc Đội 1 trước
        btn.onclick = () => {
          if (gameState.isQuestionLocked) return;
          if (ansA === undefined || ansA === null) {
            chooseAnswer('teamA', idx);
          } else {
            chooseAnswer('teamB', idx);
          }
        };

        optionsGrid.appendChild(btn);
      });
    }
  }

  function renderDecryptUI() {
    const wrapA = document.getElementById('teamA_svgWrap');
    const wrapB = document.getElementById('teamB_svgWrap');

    const svgA = generateSvgPuzzle('teamA');
    const svgB = generateSvgPuzzle('teamB');

    if (wrapA) wrapA.innerHTML = svgA;
    if (wrapB) wrapB.innerHTML = svgB;

    // Render đồng bộ lên Sân Khấu Đấu Trường Fullscreen Máy Chiếu
    const fsWrapA = document.getElementById('teamA_fsSvgWrap');
    const fsWrapB = document.getElementById('teamB_fsSvgWrap');
    if (fsWrapA) fsWrapA.innerHTML = svgA;
    if (fsWrapB) fsWrapB.innerHTML = svgB;

    const containerA = document.getElementById('teamA_canvasContainer');
    const containerB = document.getElementById('teamB_canvasContainer');
    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    if (containerA) containerA.classList.toggle('paper-theme', isPaper);
    if (containerB) containerB.classList.toggle('paper-theme', isPaper);

    const fsContainerA = document.getElementById('teamA_fsCanvasContainer');
    const fsContainerB = document.getElementById('teamB_fsCanvasContainer');
    if (fsContainerA) fsContainerA.classList.toggle('paper-theme', isPaper);
    if (fsContainerB) fsContainerB.classList.toggle('paper-theme', isPaper);

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';

    const nameA = (gameState.teamA && gameState.teamA.name) || 'ĐOÀN KẾT';
    const nameB = (gameState.teamB && gameState.teamB.name) || 'LA BÀN TUỔI TRẺ';

    const titleA = document.getElementById('gmmCanvasTitleA') || document.querySelector('.gmm-canvas-panel.team-a .gmm-canvas-title');
    const titleB = document.getElementById('gmmCanvasTitleB') || document.querySelector('.gmm-canvas-panel.team-b .gmm-canvas-title');
    if (titleA) {
      titleA.textContent = gameState.teamA.completed
        ? `🔴 BẢNG TRANH ${nameA}: “${activeTitle}” 🎉`
        : `🔴 BẢNG TRANH: ${nameA}`;
    }
    if (titleB) {
      titleB.textContent = gameState.teamB.completed
        ? `🔵 BẢNG TRANH ${nameB}: “${activeTitle}” 🎉`
        : `🔵 BẢNG TRANH: ${nameB}`;
    }

    // Cập nhật tên và điểm số trên Đấu trường Fullscreen
    const fsNameA = document.getElementById('gmmFsTeamAName');
    const fsNameB = document.getElementById('gmmFsTeamBName');
    if (fsNameA) fsNameA.textContent = nameA;
    if (fsNameB) fsNameB.textContent = nameB;

    const fsScoreA = document.getElementById('gmmFsTeamAScore');
    const fsScoreB = document.getElementById('gmmFsTeamBScore');
    if (fsScoreA && gameState.teamA) {
      const scoreA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      fsScoreA.textContent = `${scoreA} đ`;
    }
    if (fsScoreB && gameState.teamB) {
      const scoreB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      fsScoreB.textContent = `${scoreB} đ`;
    }

    updateProgressBar('teamA');
    updateProgressBar('teamB');
    updateStealthButtonUI();
    updateCanvasThemeButtonUI();
  }

  function renderResultUI() {
    const tbody = document.getElementById('gmmResultTbody');
    const announceEl = document.getElementById('gmmWinnerAnnounce');
    if (!tbody) return;

    const totalA = gameState.teamA.score + gameState.teamA.bonusScore;
    const totalB = gameState.teamB.score + gameState.teamB.bonusScore;

    tbody.innerHTML = `
      <tr>
        <td style="text-align: left; font-weight: 700;">Điểm trắc nghiệm trực tuyến (Tối đa 10đ)</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.score} đ</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.score} đ</td>
      </tr>
      <tr>
        <td style="text-align: left; font-weight: 700;">Số tọa độ ô màu đã mở khóa trên giấy A1</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.unlockedRegions.length}/10 ô</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.unlockedRegions.length}/10 ô</td>
      </tr>
      ${(gameState.teamA.speedBonus || gameState.teamB.speedBonus) ? `
      <tr>
        <td style="text-align: left; font-weight: 700;">⚡ Điểm thưởng tốc độ hoàn thành tranh sớm</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.speedBonus ? `+${gameState.teamA.speedBonus} đ (⏱️ ${gameState.teamA.artworkFinishTime || ''})` : '0 đ'}</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.speedBonus ? `+${gameState.teamB.speedBonus} đ (⏱️ ${gameState.teamB.artworkFinishTime || ''})` : '0 đ'}</td>
      </tr>` : ''}
      <tr>
        <td style="text-align: left; font-weight: 700;">Điểm tô màu & giải mã tranh A1 (Tối đa 10đ)</td>
        <td style="color: #fca5a5; font-weight: 700;">+${gameState.teamA.bonusScore} đ</td>
        <td style="color: #93c5fd; font-weight: 700;">+${gameState.teamB.bonusScore} đ</td>
      </tr>
      <tr class="total-row">
        <td style="text-align: left;">TỔNG ĐIỂM CHUNG CUỘC (TỐI ĐA 20 ĐIỂM)</td>
        <td style="color: #ef4444; font-size: 1.25rem;">${totalA} ĐIỂM</td>
        <td style="color: #3b82f6; font-size: 1.25rem;">${totalB} ĐIỂM</td>
      </tr>
    `;

    if (announceEl) {
      if (totalA > totalB) {
        announceEl.innerHTML = `
          <h3 style="color: #ef4444; margin: 0; font-size: 1.5rem;">🏆 QUÁN QUÂN: ${gameState.teamA.name.toUpperCase()} CHIẾN THẮNG!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Xuất sắc giải mã bức tranh biểu tượng: <strong>"Ngôi trường hạnh phúc không bạo lực"</strong> (${totalA}/20 điểm)</p>
        `;
      } else if (totalB > totalA) {
        announceEl.innerHTML = `
          <h3 style="color: #3b82f6; margin: 0; font-size: 1.5rem;">🏆 QUÁN QUÂN: ${gameState.teamB.name.toUpperCase()} CHIẾN THẮNG!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Xuất sắc giải mã bức tranh biểu tượng: <strong>"Trái tim thấu cảm – Tự tin tỏa sáng"</strong> (${totalB}/20 điểm)</p>
        `;
      } else {
        announceEl.innerHTML = `
          <h3 style="color: #f59e0b; margin: 0; font-size: 1.5rem;">🤝 KẾT QUẢ HÒA: HAI ĐỘI CÙNG XUẤT SẮC ĐẠT ĐIỂM SỐ ${totalA}/20 ĐIỂM!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Cả hai đội đã hoàn thành xuất sắc các thông điệp: <em>"Ngôi trường hạnh phúc không bạo lực"</em> & <em>"Trái tim thấu cảm – Tự tin tỏa sáng"</em>!</p>
        `;
      }
    }

    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    }
  }

      return {
        formatMinutesSeconds,
        updateMatchTimerUI,
        recalculateTeamScore,
        renderDualArena,
        getConnectedTeams,
        getArenaLiveSnapshot,
        getTeamAnsweredCount,
        applyTeamUnlockOnHost,
        toggleMatchPause,
        addMatchSeconds,
        addMatchMinute,
        setMatchDuration,
        handleMatchConclusion,
        forceLockBothTeams,
        prepareFreshMatchSession,
        startDualMatch,
        startMatchFromArena,
        updateTimerDisplay,
        updateHeaderScores,
        renderQuestionUI,
        renderDecryptUI,
        renderResultUI
      };
    }
  };
})();
