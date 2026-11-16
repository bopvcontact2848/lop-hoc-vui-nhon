/**
 * ==============================================================================
 * MODULE KÊNH SSE PHÍA HOST & ĐẾM NGƯỢC ĐỒNG BỘ (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmHostSse.js
 * Trách nhiệm: Phát sóng trạng thái phòng thi từ Máy chiếu lên Server, lắng nghe
 * SSE bài làm từ điện thoại 2 đội, WakeLock và đếm ngược đồng bộ 3..2..1.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmHostSse = {
    create: function (ctx) {
      const {
        gameState,
        renderDualArena,
        attachTeamArtworkPhoto,
        getTeamName,
        updateAllTeamNamesUI,
        updateDecryptTimerUI,
        handleRegionClick,
        applyTeamUnlockOnHost,
        formatMinutesSeconds,
        recalculateTeamScore,
        stopBattleMusicUI,
        updateMatchTimerUI,
        updateStageFloatPauseBtn,
        handleMatchConclusion,
        updateHeaderScores,
        renderDecryptUI,
        updateProgressBar
      } = ctx;

      let sseEventSource = null;

      function clearCountdownTimer() {
        clearInterval(countdownTimerId);
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
      const isLobby = (
        gameState.activeTab === 'home' ||
        gameState.activeTab === 'lobby' ||
        (gameState.activeTab === 'settings' && !gameState.isMatchStarted && !gameState.isDecryptPhase)
      );
      const isQuizWaiting = (gameState.activeTab === 'quiz' && !gameState.isMatchStarted);
      const effectiveStatus = isLobby
        ? 'lobby'
        : (isQuizWaiting
          ? 'quiz_waiting'
          : (gameState.activeTab === 'settings'
            ? (gameState.isDecryptPhase ? 'decrypt' : 'quiz')
            : gameState.activeTab));
      const curQ = ctx.getQuestionsList()[gameState.currentQIndex];
      const payload = {
        sessionId: gameState.sessionId,
        resetForNewMatch: Boolean(options.resetForNewMatch),
        forceTeamOverwrite: Boolean(options.forceTeamOverwrite || options.resetForNewMatch),
        roomCode: gameState.roomCode,
        status: effectiveStatus,
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
        if (gameState.activeTab === 'home' || gameState.activeTab === 'lobby' || gameState.activeTab === 'quiz') {
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

          if (data.type === 'gmm_question_sets_updated' && window.GmmServerSetsSync && typeof window.GmmServerSetsSync.pullAndMerge === 'function') {
            window.GmmServerSetsSync.pullAndMerge({ silent: true, clientOriginId: data.clientOriginId });
          }

          if (data.type === 'gmm_custom_puzzles_updated' && window.GmmServerPuzzlesSync && typeof window.GmmServerPuzzlesSync.pullAndMerge === 'function') {
            window.GmmServerPuzzlesSync.pullAndMerge({ silent: true, clientOriginId: data.clientOriginId });
          }

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
