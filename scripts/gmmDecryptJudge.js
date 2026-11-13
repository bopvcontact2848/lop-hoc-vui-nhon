/**
 * ==============================================================================
 * MODULE TÔ MÀU GIẢI MÃ TRANH & CHẤM ĐIỂM BGK (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmDecryptJudge.js
 * Trách nhiệm: Bộ đếm giờ tô màu (kèm toàn màn hình), click tô mảng/ô trên SVG,
 * duyệt tranh giấy A1, chấm điểm BGK và hiệu ứng hào quang vàng vinh danh.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmDecryptJudge = {
    create: function (ctx) {
      const {
        gameState,
        updateHeaderScores,
        broadcastHostStateToServer,
        renderDecryptUI,
        submitPaintFromMobile
      } = ctx;

  function setDecryptDuration(seconds) {
    gameState.decryptTimeTotal = seconds;
    gameState.decryptTimeLeft = seconds;

    // Cập nhật các nút preset 3p (180s), 5p (300s), 7p (420s) trên cả thanh điều khiển & sân khấu Fullscreen
    [180, 300, 420].forEach(s => {
      const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
      if (btn) btn.classList.toggle('primary', s === seconds);
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === seconds);
    });

    const mins = Math.round(seconds / 60);
    const btnStart = document.getElementById('gmmBtnStartDecrypt');
    if (btnStart && !gameState.isDecryptTimerRunning) {
      btnStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }
    const btnFsStart = document.getElementById('gmmBtnFsStartDecrypt');
    if (btnFsStart && !gameState.isDecryptTimerRunning) {
      btnFsStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', seconds })
    }).catch(() => {});

    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã đặt thời lượng tô tranh: ${mins} phút!`, 'info');
    }
  }

  function updateDecryptTimerUI() {
    const totalSec = Math.max(0, gameState.decryptTimeLeft || 0);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // 1. Cập nhật đồng hồ đếm ngược trên thanh công cụ Tab 4
    const timerEl = document.getElementById('gmmDecryptTimer');
    if (timerEl) {
      timerEl.textContent = timeStr;

      // Đổi màu cảnh báo & hiệu ứng phát sáng (Neon Glow)
      if (totalSec <= 10) {
        timerEl.style.borderColor = '#ef4444';
        timerEl.style.color = '#ef4444';
        timerEl.classList.add('urgent-pulse');
      } else if (totalSec <= 30) {
        timerEl.style.borderColor = '#f59e0b';
        timerEl.style.color = '#f59e0b';
        timerEl.classList.remove('urgent-pulse');
      } else {
        timerEl.style.borderColor = '#10b981';
        timerEl.style.color = '#34d399';
        timerEl.classList.remove('urgent-pulse');
      }
    }

    // 2. Cập nhật đồng hồ Toàn Màn Hình Khổng Lồ (Fullscreen Countdown Modal)
    const fsTimerDigits = document.getElementById('gmmFsTimerDigits');
    if (fsTimerDigits) {
      fsTimerDigits.textContent = timeStr;
      if (totalSec <= 10) {
        fsTimerDigits.className = 'gmm-timer-fs-digits urgent-red';
      } else if (totalSec <= 30) {
        fsTimerDigits.className = 'gmm-timer-fs-digits warning-amber';
      } else {
        fsTimerDigits.className = 'gmm-timer-fs-digits normal-green';
      }
    }

    // Thanh tiến trình Fullscreen
    const fillEl = document.getElementById('gmmFsTimerProgressFill');
    const totalDuration = Math.max(1, gameState.decryptTimeTotal || 300);
    const percent = Math.min(100, Math.max(0, (totalSec / totalDuration) * 100));
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
      if (totalSec <= 10) {
        fillEl.className = 'gmm-timer-fs-progress-fill urgent-red';
      } else if (totalSec <= 30) {
        fillEl.className = 'gmm-timer-fs-progress-fill warning-amber';
      } else {
        fillEl.className = 'gmm-timer-fs-progress-fill normal-green';
      }
    }

    const percentEl = document.getElementById('gmmFsTimerProgressPercent');
    if (percentEl) {
      percentEl.textContent = `Thời gian còn lại: ${Math.round(percent)}%`;
    }

    const ratioEl = document.getElementById('gmmFsTimerProgressRatio');
    if (ratioEl) {
      const totM = Math.floor(totalDuration / 60);
      const totS = totalDuration % 60;
      const totStr = `${totM.toString().padStart(2, '0')}:${totS.toString().padStart(2, '0')}`;
      ratioEl.textContent = `${timeStr} / ${totStr}`;
    }

    // Hướng dẫn / Thông điệp trạng thái ở trung tâm sân khấu Fullscreen
    const statusTip = document.getElementById('gmmFsTimerStatusTip');
    if (statusTip) {
      if (totalSec === 0) {
        statusTip.textContent = '🎉 HẾT GIỜ TÔ TRANH! Hãy cùng đối chiếu tác phẩm với Tranh Giáo Viên!';
        statusTip.style.color = '#fde047';
      } else if (!gameState.isDecryptTimerRunning) {
        statusTip.textContent = '⏸️ Đang tạm dừng đồng hồ. Bấm "Tiếp Tục" để đếm ngược tiếp tục!';
        statusTip.style.color = '#38bdf8';
      } else if (totalSec <= 10) {
        statusTip.textContent = '🔥 10 GIÂY CUỐI CÙNG! Các đội khẩn trương hoàn thiện những nét tô cuối!';
        statusTip.style.color = '#fca5a5';
      } else {
        statusTip.textContent = '⚡ Hai đội khẩn trương đối chiếu tọa độ ô màu và hoàn thành tranh giấy A1!';
        statusTip.style.color = '#cbd5e1';
      }
    }

    // Cập nhật điểm & số ô mở của 2 đội trên Fullscreen
    const scoreAEl = document.getElementById('gmmFsTeamAScore');
    if (scoreAEl && gameState.teamA) {
      const scoreA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      scoreAEl.textContent = `${scoreA} đ`;
    }
    const progAEl = document.getElementById('gmmFsTeamAProgress');
    if (progAEl && gameState.teamA) {
      const countA = (gameState.teamA.unlockedRegions || []).length;
      progAEl.textContent = `(${countA}/10 ô)`;
    }

    const scoreBEl = document.getElementById('gmmFsTeamBScore');
    if (scoreBEl && gameState.teamB) {
      const scoreB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      scoreBEl.textContent = `${scoreB} đ`;
    }
    const progBEl = document.getElementById('gmmFsTeamBProgress');
    if (progBEl && gameState.teamB) {
      const countB = (gameState.teamB.unlockedRegions || []).length;
      progBEl.textContent = `(${countB}/10 ô)`;
    }
  }

  function toggleDecryptTimer() {
    if (gameState.isDecryptTimerRunning) {
      pauseDecryptTimer();
    } else {
      resumeDecryptTimer();
    }
  }

  function pauseDecryptTimer() {
    gameState.isDecryptTimerRunning = false;
    clearInterval(gameState.decryptTimerInterval);
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '▶️ Tiếp Tục';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '▶️ Tiếp Tục';
    if (typeof window.showToast === 'function') {
      window.showToast('⏸️ Đã tạm dừng đồng hồ tô tranh!', 'info');
    }
    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});
  }

  function resumeDecryptTimer() {
    gameState.isDecryptPhase = true;
    gameState.isDecryptTimerRunning = true;
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '⏸️ Tạm Dừng';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '⏸️ Tạm Dừng';

    if (gameState.autoFsOnTimerStart && !gameState.isDecryptTimerFullscreenOpen) {
      openDecryptTimerFullscreen();
    }

    clearInterval(gameState.decryptTimerInterval);
    gameState.decryptTimerInterval = setInterval(() => {
      if (gameState.decryptTimeLeft > 0) {
        gameState.decryptTimeLeft--;
        updateDecryptTimerUI();

        if (gameState.decryptTimeLeft <= 5 && gameState.decryptTimeLeft > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(gameState.decryptTimeLeft);
          }
        }

        if (gameState.decryptTimeLeft === 0) {
          clearInterval(gameState.decryptTimerInterval);
          gameState.isDecryptTimerRunning = false;
          if (btn) btn.textContent = '🚀 Bắt Đầu Lại';
          if (fsBtn) fsBtn.textContent = '🚀 Bắt Đầu Lại';
          if (window.audioManager && typeof window.audioManager.playTimerBuzzer === 'function') {
            window.audioManager.playTimerBuzzer();
          }
          if (typeof window.showToast === 'function') {
            window.showToast('⏰ Hết giờ tô tranh! Hãy cùng chiêm ngưỡng tác phẩm của 2 đội!', 'info');
          }
        }
      }
    }, 1000);

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        seconds: gameState.decryptTimeLeft,
        totalSeconds: gameState.decryptTimeTotal || 300
      })
    }).catch(() => {});
  }

  function startDecryptPhase(seconds = 300) {
    gameState.isDecryptPhase = true;
    setDecryptDuration(seconds);
    resumeDecryptTimer();
    renderDecryptUI();
  }

  function extendDecryptTime(seconds = 30) {
    gameState.decryptTimeLeft = (gameState.decryptTimeLeft || 0) + seconds;
    gameState.decryptTimeTotal = (gameState.decryptTimeTotal || 300) + seconds;
    updateDecryptTimerUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã gia hạn thêm +${seconds} giây cho hai đội!`, 'success');
    }
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', seconds })
    }).catch(() => {});
  }

  function openDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (!modal) return;
    gameState.isDecryptTimerFullscreenOpen = true;
    modal.style.display = 'flex';

    // Vẽ lại tranh & tiến độ 2 đội hiển thị trọn vẹn tức thì trên Fullscreen
    renderDecryptUI();
    updateProgressBar('teamA');
    updateProgressBar('teamB');

    // Cập nhật giao diện đồng bộ
    updateDecryptTimerUI();

    // Đồng bộ nút preset đang chọn
    const totalDuration = gameState.decryptTimeTotal || 300;
    [180, 300, 420].forEach(s => {
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === totalDuration);
    });

    // Đồng bộ nút Bắt đầu / Tạm dừng
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) {
      if (gameState.isDecryptTimerRunning) {
        fsBtn.textContent = '⏸️ Tạm Dừng';
      } else if (gameState.decryptTimeLeft === 0) {
        fsBtn.textContent = '🚀 Bắt Đầu Lại';
      } else if (gameState.decryptTimeLeft < totalDuration) {
        fsBtn.textContent = '▶️ Tiếp Tục';
      } else {
        const mins = Math.round(totalDuration / 60);
        fsBtn.textContent = `🚀 Bắt Đầu (${mins}p)`;
      }
    }

    // Đưa trình duyệt vào chế độ toàn màn hình F11 nếu được phép
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function closeDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (modal) modal.style.display = 'none';
    gameState.isDecryptTimerFullscreenOpen = false;

    // Thoát Fullscreen trình duyệt nếu đang bật
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleAutoFsOnTimerStart(enabled) {
    gameState.autoFsOnTimerStart = Boolean(enabled);
    if (typeof window.showToast === 'function') {
      window.showToast(
        gameState.autoFsOnTimerStart
          ? '🖥️ Đã BẬT tự động phóng to Full màn hình khi bấm Bắt đầu!'
          : '🔲 Đã TẮT tự động phóng to Full màn hình khi bấm Bắt đầu.',
        'info'
      );
    }
  }

  function handleCellClick(teamKey, cellId, specificColor = null, isRemote = false) {
    const teamData = gameState[teamKey];
    if (!teamData) return;
    if (!teamData.coloredRegions) teamData.coloredRegions = {};

    // Lấy màu đang chọn của đội đó hoặc màu chỉ định
    const activeColor = specificColor || (teamKey === 'teamA' ? gameState.selectedColorA : gameState.selectedColorB) || '#dc2626';

    // Toggle màu hoặc xóa màu nếu ô đó đã tô màu này
    if (teamData.coloredRegions[cellId] === activeColor) {
      delete teamData.coloredRegions[cellId];
    } else {
      teamData.coloredRegions[cellId] = activeColor;
    }

    // Âm thanh tương tác
    if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
      window.audioManager.playPointerSpringSnap();
    }

    // Cập nhật giao diện giải mã
    renderDecryptUI();
    checkTeamCompletion(teamKey);
    updateProgressBar(teamKey);

    // Nếu học sinh tô từ điện thoại: gửi lên server
    if (ctx.isStudentMobile() && !isRemote) {
      submitPaintFromMobile(cellId);
    } else if (!isRemote) {
      broadcastHostStateToServer();
    }
  }

  function handleRegionClick(teamKey, regionId, specificColor = null, isRemote = false) {
    handleCellClick(teamKey, regionId, specificColor, isRemote);
  }

  // Tô mẫu thử / giải mã nhanh toàn bộ các mảng chữ & biểu tượng "TRI ÂN THẦY CÔ 20/11"
  function autoColorDemo() {
    ['teamA', 'teamB'].forEach(tKey => {
      if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
        window.GiaiMaPuzzle.autoColorTargetCells(gameState[tKey]);
      }
      checkTeamCompletion(tKey);
      updateProgressBar(tKey);
    });

    renderDecryptUI();
    broadcastHostStateToServer();
    if (typeof window.showToast === 'function') {
      window.showToast('⚡ Đã tô giải mã mẫu hoàn thiện bức tranh “TRI ÂN THẦY CÔ 20/11” cho cả 2 đội!', 'success');
    }
  }

  function checkTeamCompletion(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let isAllColored = false;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      isAllColored = prog.isComplete;
    }

    // Hiệu ứng khích lệ khi đạt 50%
    if (percent >= 50 && !teamData.halfwayNotified) {
      teamData.halfwayNotified = true;
      if (typeof window.showToast === 'function') {
        window.showToast(`🔥 ${teamData.name} đã hoàn thành ${percent}% bức tranh! Sắp lộ diện thông điệp 20/11!`, 'info');
      }
    }

    // Hoàn thành 100%
    if (isAllColored && !teamData.completed) {
      teamData.completed = true;
      teamData.bonusScore = 10; // Thưởng 10 điểm
      teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

      // Pháo hoa ăn mừng
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
      }

      if (window.audioManager && typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }

      const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
        ? window.GiaiMaPuzzle.getActivePuzzle().title
        : 'TRI ÂN THẦY CÔ 20/11';
      const symbolText = `“${activeTitle}”`;

      if (typeof window.showToast === 'function') {
        window.showToast(`🎉 CHÚC MỪNG ${teamData.name} ĐÃ GIẢI MÃ THÀNH CÔNG BỨC TRANH BÍ ẨN ${symbolText} (+10 ĐIỂM)!`, 'success');
      }

      updateHeaderScores();
      broadcastHostStateToServer();
    }
  }

  // Thay đổi điểm thưởng BGK chấm cho từng đội (1 - 10 điểm)
  function onJudgeScoreChange(teamKey, value) {
    const score = Math.min(10, Math.max(1, parseInt(value, 10) || 10));
    if (!gameState[teamKey]) return;
    gameState[teamKey].selectedBonusScore = score;

    // Cập nhật text nút duyệt nếu đội chưa hoàn tất
    if (!gameState[teamKey].completed) {
      const btnText = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
      if (btnText) {
        btnText.textContent = `✅ Duyệt Tranh (+${score}đ)`;
      }
    }
  }

  // Hiệu ứng viền phát sáng màu vàng kim (Gold Glow Aura) 3 giây khi BGK bấm Duyệt Tranh
  function triggerGoldGlowAura(teamKey, displayName, score = 10) {
    const container = document.getElementById(`${teamKey}_canvasContainer`);
    const panel = container ? container.closest('.gmm-canvas-panel') : null;

    if (container) {
      container.classList.remove('gmm-approved-permanent');
      container.classList.add('gmm-gold-glow-active');
    }
    if (panel) {
      panel.classList.remove('gmm-approved-permanent');
      panel.classList.add('gmm-gold-glow-active');
    }

    // Đảm bảo không có bất kỳ con dấu hay phần tử nào che khuất khung tranh của học sinh
    const existingStamp = document.getElementById(`${teamKey}_goldStamp`);
    if (existingStamp) existingStamp.remove();

    // Cập nhật trạng thái nút duyệt tranh thành đã hoàn tất
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    if (btn) {
      btn.classList.add('approved');
      btn.disabled = true;
    }
    if (txt) {
      txt.textContent = `🌟 ĐÃ DUYỆT TRANH (+${score}đ)`;
    }

    // Pháo hoa vàng kim tung bay ăn mừng
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 180,
        spread: 95,
        origin: { x: teamKey === 'teamA' ? 0.3 : 0.7, y: 0.55 },
        colors: ['#facc15', '#fde047', '#eab308', '#ffffff', '#22c55e', '#38bdf8'],
        zIndex: 2147483647
      });
    }

    // Sau đúng 3 giây: Tắt hào quang cực mạnh, chuyển sang viền vàng kim bền vững
    setTimeout(() => {
      if (container) {
        container.classList.remove('gmm-gold-glow-active');
        container.classList.add('gmm-approved-permanent');
      }
      if (panel) {
        panel.classList.remove('gmm-gold-glow-active');
        panel.classList.add('gmm-approved-permanent');
      }
    }, 3000);
  }

  // Ban Giám Khảo xác nhận hoàn thành tô màu tranh trên bảng giấy (Điểm tùy chọn tối đa 10 điểm)
  function approvePaperArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (teamData.completed) {
      const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;
      if (typeof window.showToast === 'function') {
        window.showToast(`ℹ️ ${displayName} đã được xác nhận hoàn thành trước đó!`, 'info');
      }
      return;
    }

    // Đọc số điểm do BGK tùy chọn từ dropdown select (Tối đa 10đ)
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    const rawVal = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    const scoreToAdd = Math.min(10, Math.max(1, parseInt(rawVal, 10) || 10));

    teamData.completed = true;
    teamData.bonusScore = scoreToAdd;
    teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

    // Khóa dropdown điểm sau khi đã duyệt
    if (selectEl) selectEl.disabled = true;

    // Hiển thị nút Chấm lại (Undo) để BGK sửa điểm nếu cần
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) undoBtn.style.display = 'inline-flex';

    // Tên đội hiển thị tùy chỉnh (ĐOÀN KẾT, LA BÀN TUỔI TRẺ...)
    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Tô đầy đủ các mảng trên màn hình để đồng bộ với tranh giấy
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
      window.GiaiMaPuzzle.autoColorTargetCells(teamData);
    }

    // Kích hoạt hiệu ứng hào quang vàng kim 3 giây rực rỡ + pháo hoa vàng gold
    triggerGoldGlowAura(teamKey, displayName, scoreToAdd);

    if (window.audioManager) {
      if (typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }
      // Nếu được 10 điểm tuyệt đối: Tự động phát tràng pháo tay vỗ tay rào rào của khán giả!
      if (scoreToAdd === 10 && typeof window.audioManager.playApplause === 'function') {
        setTimeout(() => {
          window.audioManager.playApplause();
        }, 350);
      }
    }

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';
    const symbolText = `“${activeTitle}”`;

    const applaudNotice = scoreToAdd === 10 ? ' 🌟 10 ĐIỂM TUYỆT ĐỐI! 👏 (Cả lớp vỗ tay rào rào)' : '';
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 BGK ĐÃ XÁC NHẬN ${displayName} HOÀN THÀNH TRANH GIẤY VÀ GIẢI MÃ THÀNH CÔNG BỨC TRANH ${symbolText} (+${scoreToAdd} ĐIỂM)!${applaudNotice}`, 'success');
    }

    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();
  }

  // Ban Giám Khảo hủy kết quả duyệt tranh để chấm lại điểm (Undo)
  function undoApproveArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Hoàn tác trạng thái hoàn thành & điểm thưởng
    teamData.completed = false;
    teamData.bonusScore = 0;
    teamData.finishTime = null;

    // Mở khóa lại dropdown chọn điểm
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    if (selectEl) {
      selectEl.disabled = false;
    }

    // Khôi phục nút duyệt tranh về ban đầu
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    const currentScore = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    if (btn) {
      btn.classList.remove('approved');
      btn.disabled = false;
    }
    if (txt) {
      txt.textContent = `✅ Duyệt Tranh (+${currentScore}đ)`;
    }

    // Ẩn nút Chấm lại
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) {
      undoBtn.style.display = 'none';
    }

    // Đảm bảo dọn sạch con dấu nếu có
    const stamp = document.getElementById(`${teamKey}_goldStamp`);
    if (stamp) stamp.remove();

    const container = document.getElementById(`${teamKey}_canvasContainer`);
    if (container) {
      container.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }
    const panel = container ? container.closest('.gmm-canvas-panel') : null;
    if (panel) {
      panel.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }

    // Cập nhật lại giao diện và điểm số
    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast(`↩️ Đã hủy duyệt tranh ${displayName}! Thầy/Cô có thể chọn lại số điểm và bấm Duyệt Tranh.`, 'info');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  function updateProgressBar(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let current = 0;
    let total = 35;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      current = prog.colored;
      total = prog.total;
    } else {
      current = Math.min(Object.keys(teamData.coloredRegions || {}).length, 10);
      percent = Math.round((current / 10) * 100);
      total = 10;
    }

    const fillEl = document.getElementById(`${teamKey}_progressFill`);
    const textEl = document.getElementById(`${teamKey}_progressText`);
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `${percent}% (${current}/${total} mảng)`;

    // Cập nhật đồng bộ trên Đấu Trường Fullscreen
    const fsFillEl = document.getElementById(`${teamKey}_fsProgressFill`);
    const fsTextEl = document.getElementById(`${teamKey}_fsProgressText`);
    if (fsFillEl) fsFillEl.style.width = `${percent}%`;
    if (fsTextEl) fsTextEl.textContent = `${percent}% (${current}/${total} mảng)`;
  }

      return {
        setDecryptDuration,
        updateDecryptTimerUI,
        toggleDecryptTimer,
        pauseDecryptTimer,
        resumeDecryptTimer,
        startDecryptPhase,
        extendDecryptTime,
        openDecryptTimerFullscreen,
        closeDecryptTimerFullscreen,
        toggleAutoFsOnTimerStart,
        handleCellClick,
        handleRegionClick,
        autoColorDemo,
        checkTeamCompletion,
        onJudgeScoreChange,
        triggerGoldGlowAura,
        approvePaperArtwork,
        undoApproveArtwork,
        updateProgressBar
      };
    }
  };
})();
