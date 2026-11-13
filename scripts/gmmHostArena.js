/**
 * ==============================================================================
 * MODULE ĐẤU TRƯỜNG MÁY CHIẾU SONG SONG & SSE HOST (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmHostArena.js
 * Trách nhiệm: Điều phối trận đấu 2 đội trên máy chiếu (Timer, Điểm, Nhạc nền,
 * Đếm ngược 3..2..1) và kênh phát sóng/nhận SSE phía Host (Ban Giám Khảo).
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
        setArtworkViewMode,
        resetTiltAngle,
        chooseAnswer,
        updateProgressBar,
        updateCanvasThemeButtonUI,
        getTeamName,
        updateDecryptTimerUI,
        handleRegionClick,
        attachTeamArtworkPhoto,
        updateAllTeamNamesUI
      } = ctx;

      let sseEventSource = null;

      function clearCountdownTimer() {
        clearInterval(countdownTimerId);
      }

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

  function toggleBattleMusic() {
    if (!window.audioManager) return;
    const btn = document.getElementById('gmmBtnBattleMusic');
    const isPlaying = typeof window.audioManager.isBattleMusicPlaying === 'function' && window.audioManager.isBattleMusicPlaying();
    if (isPlaying) {
      window.audioManager.stopBattleMusic();
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
      }
      if (typeof window.showToast === 'function') window.showToast('🔇 Đã tắt nhạc nền thi đấu', 'info');
    } else {
      const ok = window.audioManager.startBattleMusic();
      if (ok) {
        if (btn) {
          btn.classList.add('active');
          btn.innerHTML = '<span>🔊 Nhạc Thi Đấu: BẬT</span>';
        }
        updateBattleMusicUI();
        const genre = (typeof window.audioManager.getBattleMusicGenre === 'function') ? window.audioManager.getBattleMusicGenre() : 'epic';
        const genreName = genre === 'chill' ? 'Nhẹ Nhàng Tập Trung' : 'Sôi Động Kịch Tính';
        if (typeof window.showToast === 'function') window.showToast(`🎵 Đã bật nhạc nền thi đấu [${genreName}]!`, 'success');
      }
    }
  }

  function toggleBattleMusicGenre() {
    if (!window.audioManager) return;
    const current = (typeof window.audioManager.getBattleMusicGenre === 'function')
      ? window.audioManager.getBattleMusicGenre()
      : 'epic';
    const nextGenre = (current === 'epic') ? 'chill' : 'epic';
    if (typeof window.audioManager.setBattleMusicGenre === 'function') {
      window.audioManager.setBattleMusicGenre(nextGenre);
    }
    updateBattleMusicUI();
    if (typeof window.showToast === 'function') {
      if (nextGenre === 'chill') {
        window.showToast('☕ Đã đổi nhạc nền: [Nhẹ Nhàng Tập Trung] (84 BPM Lofi Chill)', 'info');
      } else {
        window.showToast('🔥 Đã đổi nhạc nền: [Sôi Động Kịch Tính] (124 BPM Epic Battle)', 'info');
      }
    }
  }

  function updateBattleMusicUI() {
    const modeBtn = document.getElementById('gmmBtnBattleMusicMode');
    if (!modeBtn) return;
    const isChill = window.audioManager && typeof window.audioManager.getBattleMusicGenre === 'function' && window.audioManager.getBattleMusicGenre() === 'chill';
    modeBtn.className = `gmm-btn-match-ctrl music-mode ${isChill ? 'chill' : 'epic'}`;
    modeBtn.innerHTML = isChill
      ? '<span>☕ Giai Điệu: Nhẹ Nhàng</span>'
      : '<span>🔥 Giai Điệu: Kịch Tính</span>';
  }

  function stopBattleMusicUI(fadeTime = 1.5) {
    if (window.audioManager && typeof window.audioManager.stopBattleMusic === 'function') {
      window.audioManager.stopBattleMusic(fadeTime);
    }
    const btn = document.getElementById('gmmBtnBattleMusic');
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
    }
  }

  // Khởi tạo sạch sẽ dữ liệu phiên thi đấu mới (dùng chung khi bắt đầu ván mới hoặc chơi lại)
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


  // ============================================================================
  // 9. ĐỒNG BỘ THỜI GIAN THỰC SERVER-SENT EVENTS (SSE) & HỌC SINH THI ĐẤU ĐIỆN THOẠI
  // ============================================================================

  // Gửi trạng thái hiện tại từ Máy chiếu lên Server để phát sóng thoại
  async function broadcastHostStateToServer(options = {}) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (ctx.isStudentMobile()) return;

    try {
      if (!gameState.sessionId) {
        gameState.sessionId = Date.now();
      }
      const isLobby = (gameState.activeTab === 'home' || gameState.activeTab === 'lobby');
      const isQuizWaiting = (gameState.activeTab === 'quiz' && !gameState.isMatchStarted);
      const curQ = ctx.getQuestionsList()[gameState.currentQIndex];
      const payload = {
        sessionId: gameState.sessionId,
        resetForNewMatch: Boolean(options.resetForNewMatch),
        forceTeamOverwrite: Boolean(options.forceTeamOverwrite || options.resetForNewMatch),
        roomCode: gameState.roomCode,
        status: isLobby ? 'lobby' : (isQuizWaiting ? 'quiz_waiting' : gameState.activeTab),
        isMatchStarted: Boolean(gameState.isMatchStarted),
        currentQIndex: gameState.currentQIndex,
        totalQuestions: ctx.getQuestionsList().length,
        // Khi ở Quiz và đã bấm bắt đầu: gửi toàn bộ danh sách 10 câu hỏi để học sinh làm bài độc lập
        questions: (isLobby || isQuizWaiting) ? [] : ctx.getQuestionsList().map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          coordinate: q.coordinate || `Ô số ${q.id}`,
          regionId: q.regionId,
          time: q.time
        })),
        currentQuestion: (isLobby || isQuizWaiting) ? null : (curQ ? {
          id: curQ.id,
          question: curQ.question,
          options: curQ.options,
          correct: curQ.correct,
          coordinate: curQ.coordinate || `Ô số ${gameState.currentQIndex + 1}`,
          time: curQ.time
        } : null),
        totalMatchSeconds: gameState.totalMatchSeconds || 120,
        timerSeconds: gameState.timerSeconds,
        isTimerRunning: (isLobby || isQuizWaiting) ? false : gameState.isTimerRunning,
        isQuestionLocked: (isLobby || isQuizWaiting) ? false : gameState.isQuestionLocked,
        isAnswerRevealed: (isLobby || isQuizWaiting) ? false : gameState.isAnswerRevealed,
        isDecryptPhase: gameState.isDecryptPhase,
        decryptTimeLeft: gameState.decryptTimeLeft,
        decryptTimeTotal: gameState.decryptTimeTotal || 300,
        isDecryptTimerRunning: Boolean(gameState.isDecryptTimerRunning),
        connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
        teamNames: {
          teamA: gameState.teamA.name || 'ĐOÀN KẾT',
          teamB: gameState.teamB.name || 'LA BÀN TUỔI TRẺ'
        },
        teamA: {
          name: gameState.teamA.name,
          score: gameState.teamA.score,
          bonusScore: gameState.teamA.bonusScore,
          answers: gameState.teamA.answers || {},
          isLocked: Boolean(gameState.teamA.isLocked),
          finishTime: gameState.teamA.isLocked ? (gameState.teamA.finishTimeFormatted || gameState.teamA.finishTime || null) : null,
          finishSeconds: gameState.teamA.isLocked && typeof gameState.teamA.finishTimeSeconds === 'number' ? gameState.teamA.finishTimeSeconds : null,
          unlockedRegions: gameState.teamA.unlockedRegions || [],
          coloredRegions: gameState.teamA.coloredRegions || {}
        },
        teamB: {
          name: gameState.teamB.name,
          score: gameState.teamB.score,
          bonusScore: gameState.teamB.bonusScore,
          answers: gameState.teamB.answers || {},
          isLocked: Boolean(gameState.teamB.isLocked),
          finishTime: gameState.teamB.isLocked ? (gameState.teamB.finishTimeFormatted || gameState.teamB.finishTime || null) : null,
          finishSeconds: gameState.teamB.isLocked && typeof gameState.teamB.finishTimeSeconds === 'number' ? gameState.teamB.finishTimeSeconds : null,
          unlockedRegions: gameState.teamB.unlockedRegions || [],
          coloredRegions: gameState.teamB.coloredRegions || {}
        }
      };

      const res = await fetch('/api/gmm/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.sessionId) {
          gameState.sessionId = json.sessionId;
        }
        if (json && json.state && json.state.connectedTeams) {
          updateTeamConnectionStatusUI(json.state.connectedTeams);
        }
      }
    } catch (_e) {}
  }

  async function syncHostInitialConnectionState() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (ctx.isStudentMobile()) return;
    try {
      const res = await fetch('/api/gmm/state', { cache: 'no-store' });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.success) {
          if (json.state && json.state.connectedTeams) {
            updateTeamConnectionStatusUI(json.state.connectedTeams);
          }
          if (json.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestBulkTelemetry === 'function') {
            window.GiaiMaLiveMonitor.ingestBulkTelemetry(json.telemetry, json.serverTime);
          }
        }
      }
    } catch (_e) {}
  }

  function updateTeamConnectionStatusUI(connectedTeams) {
    if (!connectedTeams) return;
    if (!gameState.connectedTeams) gameState.connectedTeams = { teamA: false, teamB: false };
    if ('teamA' in connectedTeams) {
      gameState.connectedTeams.teamA = Boolean(connectedTeams.teamA);
    }
    if ('teamB' in connectedTeams) {
      gameState.connectedTeams.teamB = Boolean(connectedTeams.teamB);
    }

    const nameA = (typeof getTeamName === 'function') ? getTeamName('teamA') : 'ĐOÀN KẾT';
    const nameB = (typeof getTeamName === 'function') ? getTeamName('teamB') : 'LA BÀN TUỔI TRẺ';

    const elA = document.getElementById('gmmTeamStatusA');
    if (elA) {
      if (gameState.connectedTeams.teamA) {
        elA.className = 'gmm-team-status-indicator ready';
        elA.innerHTML = `<span>●</span><span>${nameA} (Đội 1) đã kết nối điện thoại</span><button type="button" class="gmm-btn-kick-conn" onclick="event.stopPropagation(); GiaiMaLiveMonitor.kickTeamConnection('teamA')" title="Ngắt / Làm mới kết nối ${nameA}">✕</button>`;
      } else {
        elA.className = 'gmm-team-status-indicator waiting';
        elA.innerHTML = `<span>⏳</span><span>Đang chờ ${nameA} quét mã...</span>`;
      }
    }

    const elB = document.getElementById('gmmTeamStatusB');
    if (elB) {
      if (gameState.connectedTeams.teamB) {
        elB.className = 'gmm-team-status-indicator ready';
        elB.innerHTML = `<span>●</span><span>${nameB} (Đội 2) đã kết nối điện thoại</span><button type="button" class="gmm-btn-kick-conn" onclick="event.stopPropagation(); GiaiMaLiveMonitor.kickTeamConnection('teamB')" title="Ngắt / Làm mới kết nối ${nameB}">✕</button>`;
      } else {
        elB.className = 'gmm-team-status-indicator waiting';
        elB.innerHTML = `<span>⏳</span><span>Đang chờ ${nameB} quét mã...</span>`;
      }
    }

    if (!ctx.isStudentMobile() && !gameState.isMatchStarted) {
      ['teamA', 'teamB'].forEach(tKey => {
        const letter = tKey === 'teamA' ? 'A' : 'B';
        const badge = document.getElementById(`gmmStatusBadgeTeam${letter}`);
        const team = gameState[tKey];
        if (badge && team && !team.isLocked && !gameState.isCountdownRunning) {
          badge.innerHTML = gameState.connectedTeams[tKey]
            ? '🕒 <span style="color: #7dd3fc;">Đang chờ...</span>'
            : '🕒 <span style="color: #94a3b8;">Đang chờ...</span>';
        }
      });
    }

    if (!ctx.isStudentMobile()) {
      if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
        window.GiaiMaLiveMonitor.renderHostPingIndicators();
      }
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
        window.GiaiMaTeacherKey.renderLiveQuizCards();
      }
    }
  }

  // Khởi động kênh lắng nghe SSE trên Máy chiếu (Host)
  let hostConnSyncInterval = null;
  function initHostSseListener() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (sseEventSource) return;

    if (!hostConnSyncInterval && !ctx.isStudentMobile()) {
      hostConnSyncInterval = setInterval(() => {
        if (gameState.activeTab === 'lobby' || gameState.activeTab === 'quiz') {
          syncHostInitialConnectionState();
        }
      }, 4500);
    }

    try {
      sseEventSource = new EventSource('/api/sync/events?role=host');
      sseEventSource.onopen = function () {
        syncHostInitialConnectionState();
      };
      sseEventSource.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);

          // Học sinh quét mã và vào phòng thi từ điện thoại
          if (data.type === 'gmm_team_joined') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            } else if (data.team) {
              const patch = {};
              patch[data.team] = true;
              updateTeamConnectionStatusUI(patch);
            }
            if (data.team && data.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, data.telemetry, data.serverTime);
            }
            const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            if (typeof window.showToast === 'function') {
              window.showToast(`📱 ${teamName} vừa kết nối điện thoại vào phòng thi!`, 'success');
            }
            if (window.audioManager && typeof window.audioManager.playChime === 'function') {
              window.audioManager.playChime();
            }
          }

          // Điện thoại học sinh đã thoát khỏi trò chơi hoặc mất kết nối
          if (data.type === 'gmm_team_left') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            } else if (data.team) {
              const patch = {};
              patch[data.team] = false;
              updateTeamConnectionStatusUI(patch);
            }
            if (data.team && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.handleTeamDisconnected === 'function') {
              window.GiaiMaLiveMonitor.handleTeamDisconnected(data.team, data.serverTime);
            }
            if (data.reason !== 'teacher_kick') {
              const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
              if (typeof window.showToast === 'function') {
                window.showToast(`📴 Điện thoại ${teamName} đã thoát khỏi phòng thi!`, 'warning');
              }
            }
          }

          // Nhịp tim kết nối trực tiếp (Live Ping) từ điện thoại 2 đội
          if (data.type === 'gmm_team_ping') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            }
            if (data.team && data.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, data.telemetry, data.serverTime);
            }
          }

          // Giáo viên mở khóa riêng cho 1 đội làm tiếp
          if (data.type === 'gmm_team_unlocked') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            applyTeamUnlockOnHost(data.team, data.answers || null);
          }

          // Học sinh nộp đáp án từ điện thoại
          if (data.type === 'gmm_team_answered') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            if (gameState[data.team] && !gameState[data.team].isLocked) {
              gameState[data.team].answers[data.questionId] = data.optionIndex;
            }
            if (data.team && typeof data.currentQ === 'number' && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, {
                currentQ: data.currentQ,
                currentPage: 'quiz',
                screenState: 'visible',
                lastPingAt: Date.now()
              });
            }
            renderDualArena();
            const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            const letters = ['A', 'B', 'C', 'D'];
            if (typeof window.showToast === 'function') {
              window.showToast(`📱 ${teamName} vừa chọn đáp án Câu ${data.questionId}: [${letters[data.optionIndex]}]`, 'success');
            }
            if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
              window.audioManager.playPointerSpringSnap();
            }
          }

          // Học sinh chốt nộp bài từ điện thoại
          if (data.type === 'gmm_team_locked') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            const teamKey = data.team;
            const elapsed = (typeof data.finishSeconds === 'number')
              ? data.finishSeconds
              : Math.max(0, (gameState.totalMatchSeconds || 120) - (gameState.timerSeconds || 0));
            const finishTimeStr = data.finishTime || formatMinutesSeconds(elapsed);

            if (gameState[teamKey]) {
              gameState[teamKey].isLocked = true;
              gameState[teamKey].finishTimeSeconds = elapsed;
              gameState[teamKey].finishTimeFormatted = finishTimeStr;
              if (data.answers) gameState[teamKey].answers = Object.assign(gameState[teamKey].answers, data.answers);
            }
            recalculateTeamScore(teamKey);
            renderDualArena();
            const teamName = getTeamName(teamKey, 'full');

            const ansCount = Object.keys(gameState[teamKey]?.answers || {}).length;
            const totalQ = ctx.getQuestionsList().length || 10;
            const isCompletedAllBeforeTime = (ansCount >= totalQ) && (gameState.timerSeconds > 0);

            // Chuông reo "Ting-Ting" đặc biệt vang dội khi đội hoàn thành trọn vẹn 10/10 câu trước thời hạn!
            if (isCompletedAllBeforeTime && window.audioManager && typeof window.audioManager.playVictoryChime === 'function') {
              window.audioManager.playVictoryChime();
            } else if (window.audioManager && typeof window.audioManager.playChime === 'function') {
              window.audioManager.playChime();
            }

            if (typeof window.showToast === 'function') {
              if (isCompletedAllBeforeTime) {
                window.showToast(`🏆 ${teamName} ĐÃ XUẤT SẮC HOÀN THÀNH 10/10 CÂU TRƯỚC THỜI HẠN (⏱️ ${finishTimeStr})!`, 'success');
              } else {
                window.showToast(`🎉 ${teamName} ĐÃ CHỐT KẾT QUẢ VÀ NỘP BÀI (⏱️ ${finishTimeStr})!`, 'success');
              }
            }

            // Nếu cả 2 đội đều đã chốt nộp bài, nhẹ nhàng hạ âm lượng tắt nhạc nền thi đấu
            if (gameState.teamA?.isLocked && gameState.teamB?.isLocked) {
              stopBattleMusicUI(2.0);
            }

            // Hiệu ứng pháo hoa Confetti trên máy chiếu chúc mừng đội vừa nộp bài
            if (typeof window.confetti === 'function') {
              try {
                window.confetti({
                  particleCount: 110,
                  spread: 90,
                  origin: { y: 0.45 },
                  zIndex: 99999
                });
              } catch (_e) {}
            }
          }

          // Đồng hồ máy chủ đếm lùi từng giây qua SSE
          if (data.type === 'gmm_timer_tick') {
            gameState.timerSeconds = data.timerSeconds;
            if (typeof data.totalMatchSeconds === 'number') {
              gameState.totalMatchSeconds = data.totalMatchSeconds;
            }
            updateMatchTimerUI();
          }

          if (data.type === 'gmm_timer_pause') {
            gameState.isTimerRunning = data.isTimerRunning;
            gameState.timerSeconds = data.timerSeconds;
            updateMatchTimerUI();
            const btn = document.getElementById('gmmBtnMatchPause');
            if (btn) {
              btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
            }
            updateStageFloatPauseBtn();
          }

          if (data.type === 'gmm_time_up') {
            handleMatchConclusion(false);
          }

          // Đồng hồ máy chủ đếm lùi từng giây cho Giai đoạn 2: Tô Màu Bức Tranh (Tab 4)
          if (data.type === 'gmm_decrypt_timer_tick' || data.type === 'gmm_decrypt_timer_start') {
            if (typeof data.decryptTimeLeft === 'number') {
              gameState.decryptTimeLeft = data.decryptTimeLeft;
            }
            if (typeof data.decryptTimeTotal === 'number') {
              gameState.decryptTimeTotal = data.decryptTimeTotal;
            }
            if (typeof data.isDecryptTimerRunning === 'boolean') {
              gameState.isDecryptTimerRunning = data.isDecryptTimerRunning;
            }
            updateDecryptTimerUI();
          }

          if (data.type === 'gmm_decrypt_timer_pause') {
            gameState.isDecryptTimerRunning = Boolean(data.isDecryptTimerRunning);
            if (typeof data.decryptTimeLeft === 'number') {
              gameState.decryptTimeLeft = data.decryptTimeLeft;
            }
            updateDecryptTimerUI();
          }

          if (data.type === 'gmm_decrypt_time_up') {
            gameState.decryptTimeLeft = 0;
            gameState.isDecryptTimerRunning = false;
            updateDecryptTimerUI();
          }

          // Học sinh tô màu tranh từ điện thoại
          if (data.type === 'gmm_region_colored') {
            handleRegionClick(data.team, data.regionId, data.color, true);
          }

          // Học sinh chụp ảnh và tải tác phẩm tranh giấy A1 lên máy chiếu
          if (data.type === 'gmm_artwork_photo') {
            attachTeamArtworkPhoto(data.team, data.photoData, data.timestamp);
          }

          // Học sinh báo cáo đã tô xong sớm bức tranh giấy A1 từ điện thoại (+2 điểm thưởng tốc độ)
          if (data.type === 'gmm_artwork_finished') {
            const teamKey = data.team;
            const teamName = teamKey === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            const finishTimeStr = data.finishTime || '02:00';
            const speedBonus = typeof data.speedBonus === 'number' ? data.speedBonus : 2;

            if (gameState[teamKey]) {
              gameState[teamKey].completed = true;
              gameState[teamKey].isArtworkFinished = true;
              gameState[teamKey].artworkFinishTime = finishTimeStr;
              gameState[teamKey].speedBonus = speedBonus;
              gameState[teamKey].bonusScore = (gameState[teamKey].bonusScore || 0) + speedBonus;
            }

            // Tô toàn bộ tranh vector để đồng bộ
            if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
              window.GiaiMaPuzzle.autoColorTargetCells(gameState[teamKey]);
            }

            // Hiển thị huy hiệu xong sớm trên máy chiếu Tab 4
            const earlyBadge = document.getElementById(`${teamKey}_earlyBadge`);
            if (earlyBadge) {
              earlyBadge.style.display = 'inline-block';
              earlyBadge.textContent = `⚡ XONG SỚM (${finishTimeStr}, +${speedBonus}đ)`;
            }

            // Phát âm thanh chiến thắng
            if (window.audioManager) {
              if (typeof window.audioManager.playVictoryChime === 'function') {
                window.audioManager.playVictoryChime();
              } else if (typeof window.audioManager.playFanfare === 'function') {
                window.audioManager.playFanfare();
              }
            }

            // Pháo hoa Confetti rực rỡ chúc mừng trên máy chiếu
            if (typeof window.confetti === 'function') {
              try {
                window.confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 }, zIndex: 99999 });
              } catch (_) {}
            }

            if (typeof window.showToast === 'function') {
              window.showToast(`🏆 ${teamName} ĐÃ BÁO CÁO TÔ XONG TRANH SỚM (⏱️ ${finishTimeStr})! CỘNG +${speedBonus} ĐIỂM THƯỞNG TỐC ĐỘ! 🎉`, 'success');
            }

            updateHeaderScores();
            renderDecryptUI();
            updateProgressBar(teamKey);
          }

          if (data.type === 'gmm_reset' && data.sessionId) {
            gameState.sessionId = data.sessionId;
          }

          // Đồng bộ trạng thái cập nhật chung
          if (data.type === 'gmm_state_update' && data.state) {
            if (data.state.sessionId) {
              gameState.sessionId = data.state.sessionId;
            }
            if (data.state.teamNames) {
              if (data.state.teamNames.teamA && gameState.teamA) gameState.teamA.name = data.state.teamNames.teamA;
              if (data.state.teamNames.teamB && gameState.teamB) gameState.teamB.name = data.state.teamNames.teamB;
              updateAllTeamNamesUI();
            }
            if (data.state.connectedTeams) {
              updateTeamConnectionStatusUI(data.state.connectedTeams);
            }
            if (data.state.teamA) {
              gameState.teamA = Object.assign(gameState.teamA, data.state.teamA);
              gameState.teamA.finishTimeFormatted = data.state.teamA.finishTime || null;
            }
            if (data.state.teamB) {
              gameState.teamB = Object.assign(gameState.teamB, data.state.teamB);
              gameState.teamB.finishTimeFormatted = data.state.teamB.finishTime || null;
            }
            renderDualArena();
          }
        } catch (_err) {}
      };

      sseEventSource.onerror = function () {
        // SSE tự động kết nối lại khi có gián đoạn mạng
      };
    } catch (_err) {}
  }

  let screenWakeLock = null;
  let countdownTimerId = null;

  // Tự động giữ màn hình điện thoại học sinh luôn sáng (Wake Lock API)
  async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        screenWakeLock = await navigator.wakeLock.request('screen');
        screenWakeLock.addEventListener('release', () => {
          screenWakeLock = null;
        });
        const statusText = document.getElementById('gmmMobStatusText');
        if (statusText && ctx.isStudentMobile()) {
          statusText.innerHTML = 'Đã kết nối ⚡ Sáng liên tục';
        }
      } catch (err) {
        console.warn('Wake Lock warning:', err);
      }
    }
  }

  // Tự kích hoạt lại Wake Lock khi học sinh mở lại tab trình duyệt
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (ctx.isStudentMobile() || (gameState && gameState.activeTab !== 'home'))) {
      requestScreenWakeLock();
    }
  });

  document.addEventListener('touchstart', () => {
    if (ctx.isStudentMobile() && !screenWakeLock) {
      requestScreenWakeLock();
    }
  }, { passive: true });

  // Bộ phát âm thanh Web Audio tổng hợp cho Đếm ngược 3..2..1.. Chiến (Không cần file mp3)
  function playCountdownSound(step) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._gmmSoundCtx) window._gmmSoundCtx = new AudioCtx();
      const ctx = window._gmmSoundCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (step > 0) {
        // Tiếng Beep đếm ngược 3, 2, 1 với tần số nâng dần
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = 520 + (3 - step) * 140; // 3: 520Hz, 2: 660Hz, 1: 800Hz
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else {
        // Hợp âm kịch tính khi "CHIẾN!" (C Major chord fanfare vang dội)
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);
          gain.gain.setValueAtTime(0.2, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + 0.65);
        });
      }
    } catch (_e) {}
  }

  // Hiệu ứng đếm ngược trực quan 3..2..1.. Chiến trên máy tính và điện thoại
  // Hiệu ứng đếm 1, 2, 3.. Bắt đầu làm bài trên máy tính và điện thoại
  function runCountdownAnimation(_startSec = 3, onFinish = null) {
    const hostOverlay = document.getElementById('gmmHostCountdownOverlay');
    const hostNum = document.getElementById('gmmHostCountdownNum');
    const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
    const mobNum = document.getElementById('gmmMobCountdownNum');

    if (hostOverlay) hostOverlay.style.display = 'flex';
    if (mobOverlay) mobOverlay.style.display = 'flex';

    let step = 1;

    function renderStep(num) {
      playCountdownSound(num <= 3 ? (4 - num) : 0);

      if (num <= 3) {
        if (hostNum) {
          hostNum.textContent = num;
          hostNum.className = 'gmm-cd-number gmm-zoom-pulse';
        }
        if (mobNum) {
          mobNum.textContent = num;
          mobNum.className = 'gmm-cd-number gmm-zoom-pulse';
        }
        if (navigator.vibrate) {
          try { navigator.vibrate(60); } catch (_) {}
        }
      } else {
        if (hostNum) {
          hostNum.textContent = '🚀 BẮT ĐẦU!';
          hostNum.className = 'gmm-cd-number gmm-cd-fire';
        }
        if (mobNum) {
          mobNum.textContent = '🚀 BẮT ĐẦU!';
          mobNum.className = 'gmm-cd-number gmm-cd-fire';
        }
        if (navigator.vibrate) {
          try { navigator.vibrate([120, 60, 250]); } catch (_) {}
        }
      }
    }

    renderStep(step);

    clearInterval(countdownTimerId);
    countdownTimerId = setInterval(() => {
      step++;
      if (step <= 4) {
        renderStep(step);
      } else {
        clearInterval(countdownTimerId);
        setTimeout(() => {
          if (hostOverlay) hostOverlay.style.display = 'none';
          if (mobOverlay) mobOverlay.style.display = 'none';
          if (typeof onFinish === 'function') onFinish();
        }, 500);
      }
    }, 1000);
  }

  async function broadcastCountdownState(seconds = 3, options = {}) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    try {
      const isReset = Boolean(options.resetForNewMatch);
      const res = await fetch('/api/gmm/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          resetForNewMatch: isReset,
          forceTeamOverwrite: isReset,
          roomCode: gameState.roomCode,
          status: 'countdown',
          isMatchStarted: false,
          countdownSeconds: seconds,
          currentQuestion: null,
          isTimerRunning: false,
          currentQIndex: gameState.currentQIndex,
          totalMatchSeconds: gameState.totalMatchSeconds || 120,
          timerSeconds: gameState.timerSeconds || gameState.totalMatchSeconds || 120,
          connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
          teamNames: {
            teamA: gameState.teamA.name || 'ĐOÀN KẾT',
            teamB: gameState.teamB.name || 'LA BÀN TUỔI TRẺ'
          },
          teamA: {
            score: gameState.teamA.score,
            bonusScore: gameState.teamA.bonusScore,
            answers: gameState.teamA.answers || {},
            isLocked: Boolean(gameState.teamA.isLocked),
            unlockedRegions: gameState.teamA.unlockedRegions || [],
            coloredRegions: gameState.teamA.coloredRegions || {}
          },
          teamB: {
            score: gameState.teamB.score,
            bonusScore: gameState.teamB.bonusScore,
            answers: gameState.teamB.answers || {},
            isLocked: Boolean(gameState.teamB.isLocked),
            unlockedRegions: gameState.teamB.unlockedRegions || [],
            coloredRegions: gameState.teamB.coloredRegions || {}
          }
        })
      });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.sessionId) {
          gameState.sessionId = json.sessionId;
        }
      }
    } catch (_e) {}
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
        toggleBattleMusic,
        toggleBattleMusicGenre,
        updateBattleMusicUI,
        stopBattleMusicUI,
        prepareFreshMatchSession,
        startDualMatch,
        startMatchFromArena,
        updateTimerDisplay,
        updateHeaderScores,
        renderQuestionUI,
        renderDecryptUI,
        renderResultUI,
        broadcastHostStateToServer,
        syncHostInitialConnectionState,
        updateTeamConnectionStatusUI,
        initHostSseListener,
        requestScreenWakeLock,
        playCountdownSound,
        runCountdownAnimation,
        broadcastCountdownState,
        clearCountdownTimer
      };
    }
  };
})();
