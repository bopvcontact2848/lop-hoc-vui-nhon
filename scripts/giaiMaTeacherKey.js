/**
 * ==============================================================================
 * MODULE HIỂN THỊ CÂU HỎI TRẮC NGHIỆM THỜI GIAN THỰC (TAB 3)
 * & BẢNG KẾT QUẢ TRANH CHUẨN GIÁO VIÊN ĐỐI CHIẾU 2 ĐỘI (TAB 5)
 * File: scripts/giaiMaTeacherKey.js
 * ==============================================================================
 */

(function () {
  'use strict';

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  // Trạng thái theo dõi câu hỏi trực tiếp ở Tab 3 (null = tự động bám theo điện thoại học sinh)
  const pinnedQuestionIndex = {
    teamA: null,
    teamB: null
  };
  let forceRevealArenaAnswers = false;

  // Trạng thái hiển thị ở Tab 5 (Kết Quả Tranh Giáo Viên)
  let tkViewMode = 'master'; // 'master' | 'compare'
  let tkWhitePaperBg = true; // Mặc định nền giấy trắng A1 giống hệt phiếu in để học sinh dễ đối chiếu
  let tkShowCellCodes = true;
  let tkSeamlessStrokes = false; // Chế độ Ẩn/Hiện đường gân đen nội bộ giữa các mảnh cùng màu
  let tkFullscreenOpen = false;
  const tkTeamCompareSource = {
    teamA: 'auto', // 'auto' | 'photo' | 'svg'
    teamB: 'auto'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getHostSnapshot() {
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getArenaLiveSnapshot === 'function') {
      return window.GiaiMaBiMat.getArenaLiveSnapshot();
    }
    return null;
  }

  function getTeamTelemetry(teamKey) {
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.getHostTeamTelemetry === 'function') {
      return window.GiaiMaLiveMonitor.getHostTeamTelemetry(teamKey);
    }
    return null;
  }

  // ============================================================================
  // 1. TAB 3: HIỂN THỊ CÂU HỎI TRẮC NGHIỆM 2 ĐỘI ĐANG LÀM THEO THỜI GIAN THỰC
  // ============================================================================
  function inspectTeamQuestion(teamKey, qIdx) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    if (pinnedQuestionIndex[teamKey] === qIdx) {
      pinnedQuestionIndex[teamKey] = null;
    } else {
      pinnedQuestionIndex[teamKey] = qIdx;
    }
    renderLiveQuizCards();
  }

  function followLivePhone(teamKey) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    pinnedQuestionIndex[teamKey] = null;
    renderLiveQuizCards();
  }

  function resetLiveQuizTracking() {
    pinnedQuestionIndex.teamA = null;
    pinnedQuestionIndex.teamB = null;
    forceRevealArenaAnswers = false;
  }

  function toggleArenaAnswerReveal() {
    forceRevealArenaAnswers = !forceRevealArenaAnswers;
    renderLiveQuizCards();
  }

  function resolveActiveQuestionIndex(teamKey, questions, teamState, telemetry, isConnected) {
    const total = questions.length || 10;
    if (typeof pinnedQuestionIndex[teamKey] === 'number' &&
        pinnedQuestionIndex[teamKey] >= 0 &&
        pinnedQuestionIndex[teamKey] < total) {
      return pinnedQuestionIndex[teamKey];
    }

    if (isConnected && telemetry && typeof telemetry.currentQ === 'number' && telemetry.currentQ >= 1) {
      return Math.min(total - 1, Math.max(0, telemetry.currentQ - 1));
    }

    const answers = (teamState && teamState.answers) ? teamState.answers : {};
    for (let i = 0; i < total; i++) {
      const q = questions[i];
      if (q && (answers[q.id] === undefined || answers[q.id] === null)) {
        return i;
      }
    }
    return Math.max(0, total - 1);
  }

  function syncQuestionGridBadges(teamKey, activeIdx, isPinned, isMatchStarted) {
    const letter = teamKey === 'teamA' ? 'A' : 'B';
    const gridEl = document.getElementById(`gmmQGridTeam${letter}`);
    if (!gridEl) return;

    const badges = gridEl.querySelectorAll('.gmm-team-q-badge');
    badges.forEach((badge, idx) => {
      badge.classList.toggle('live-current', Boolean(isMatchStarted && idx === activeIdx && !isPinned));
      badge.classList.toggle('teacher-pinned', Boolean(isMatchStarted && idx === activeIdx && isPinned));
      badge.style.cursor = isMatchStarted ? 'pointer' : 'default';
      badge.onclick = isMatchStarted
        ? () => inspectTeamQuestion(teamKey, idx)
        : null;
    });
  }

  function renderSingleTeamLiveQuizCard(teamKey, snap) {
    const letter = teamKey === 'teamA' ? 'A' : 'B';
    const stageEl = document.getElementById(`gmmLiveQuizStageTeam${letter}`);
    if (!stageEl || !snap) return;

    const teamShort = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';
    const teamFull = teamKey === 'teamA' ? 'ĐỘI 1 (ĐỘI A)' : 'ĐỘI 2 (ĐỘI B)';
    const questions = Array.isArray(snap.questions) ? snap.questions : [];
    const teamState = snap[teamKey] || { answers: {}, isLocked: false };
    const isConnected = Boolean(snap.connectedTeams && snap.connectedTeams[teamKey]);
    const telemetry = getTeamTelemetry(teamKey);

    if (!snap.isMatchStarted || questions.length === 0) {
      syncQuestionGridBadges(teamKey, 0, false, false);
      const connPill = isConnected
        ? `<div class="gmm-live-q-ready-pill online">🟢 Điện thoại ${teamShort} đang ở Phòng chờ • Sẵn sàng nhận Câu 1</div>`
        : `<div class="gmm-live-q-ready-pill waiting">⏳ Đang chờ ${teamShort} quét mã QR tại Tab 2 để kết nối...</div>`;

      stageEl.innerHTML = `
        <div class="gmm-live-q-sealed">
          <div class="gmm-live-q-sealed-icon">🔒</div>
          <div class="gmm-live-q-sealed-title">ĐỀ THI 10 CÂU TRẮC NGHIỆM ĐANG NIÊM PHONG</div>
          ${connPill}
          <p class="gmm-live-q-sealed-desc">
            Khi Thầy/Cô bấm <strong>[🚀 BẮT ĐẦU TRÒ CHƠI]</strong>, câu hỏi trắc nghiệm và phương án ${teamFull} đang chọn trên điện thoại sẽ đồng bộ trực tiếp theo thời gian thực tại đây.
          </p>
        </div>
      `;
      return;
    }

    const isPinned = (typeof pinnedQuestionIndex[teamKey] === 'number');
    const activeIdx = resolveActiveQuestionIndex(teamKey, questions, teamState, telemetry, isConnected);
    const q = questions[activeIdx] || questions[0];
    syncQuestionGridBadges(teamKey, activeIdx, isPinned, true);

    const answers = teamState.answers || {};
    const chosenIdx = (q && answers[q.id] !== undefined && answers[q.id] !== null) ? Number(answers[q.id]) : null;
    const hasChosen = (chosenIdx !== null && !Number.isNaN(chosenIdx));
    const answeredCount = Object.keys(answers).length;

    const bothLocked = Boolean(snap.teamA && snap.teamA.isLocked && snap.teamB && snap.teamB.isLocked);
    const anyLocked = Boolean((snap.teamA && snap.teamA.isLocked) || (snap.teamB && snap.teamB.isLocked));
    const canRevealCorrect = Boolean(bothLocked || forceRevealArenaAnswers);

    let modeBadgeHtml = '';
    if (isPinned) {
      modeBadgeHtml = `
        <span class="gmm-live-q-mode-pill pinned">📌 Đang xem Câu ${activeIdx + 1}</span>
        <button type="button" class="gmm-live-q-follow-btn" onclick="GiaiMaTeacherKey.followLivePhone('${teamKey}')" title="Quay lại tự động bám theo câu hỏi trên điện thoại ${teamShort}">
          📡 Theo ĐT trực tiếp
        </button>
      `;
    } else if (teamState.isLocked) {
      modeBadgeHtml = `<span class="gmm-live-q-mode-pill locked">✅ ${teamShort} đã nộp bài • Bấm số 1–${questions.length} để xem</span>`;
    } else if (isConnected) {
      modeBadgeHtml = `<span class="gmm-live-q-mode-pill live"><span class="gmm-live-q-pulse-dot"></span> TRỰC TIẾP ĐT ${teamShort.toUpperCase()}</span>`;
    } else {
      modeBadgeHtml = `<span class="gmm-live-q-mode-pill offline">📴 ĐT ${teamShort} chưa kết nối</span>`;
    }

    const coordText = (!snap.isStealthMode || canRevealCorrect)
      ? `🎯 Ô thưởng: ${escapeHtml(q.coordinate || ('Câu ' + (activeIdx + 1)))}`
      : '🕵️ Mã ô: Đang ẩn';

    const earlyRevealBtnHtml = (anyLocked && !bothLocked)
      ? `<button type="button" class="gmm-live-q-reveal-btn" onclick="GiaiMaTeacherKey.toggleArenaAnswerReveal()" title="Mở hoặc ẩn đáp án đúng/sai trên màn hình máy chiếu">${forceRevealArenaAnswers ? '🙈 Ẩn Đáp Án' : '👁️ Mở Đáp Án'}</button>`
      : '';

    const optionsHtml = (q.options || []).map((optText, optIdx) => {
      const optLetter = OPTION_LETTERS[optIdx] || String(optIdx + 1);
      const isMyChoice = (hasChosen && chosenIdx === optIdx);
      const isRightAns = (optIdx === Number(q.correct));

      let optClass = 'gmm-live-q-opt';
      let tagHtml = '';

      if (canRevealCorrect) {
        if (isRightAns && isMyChoice) {
          optClass += ' is-correct is-chosen';
          tagHtml = `<span class="gmm-live-q-opt-tag correct">✔ Đúng (${teamShort})</span>`;
        } else if (isRightAns) {
          optClass += ' is-correct';
          tagHtml = `<span class="gmm-live-q-opt-tag correct">✔ Đáp án đúng</span>`;
        } else if (isMyChoice) {
          optClass += ' is-wrong is-chosen';
          tagHtml = `<span class="gmm-live-q-opt-tag wrong">✘ ${teamShort} chọn</span>`;
        }
      } else if (isMyChoice) {
        optClass += ` is-chosen-live ${teamKey === 'teamA' ? 'team-a' : 'team-b'}`;
        tagHtml = `<span class="gmm-live-q-opt-tag chosen">⚡ ${teamShort} chọn</span>`;
      }

      return `
        <div class="${optClass}">
          <span class="gmm-live-q-opt-letter">${optLetter}</span>
          <span class="gmm-live-q-opt-text">${escapeHtml(optText)}</span>
          ${tagHtml}
        </div>
      `;
    }).join('');

    let footerHtml = '';
    if (canRevealCorrect) {
      let correctTotal = 0;
      questions.forEach(item => {
        if (answers[item.id] !== undefined && Number(answers[item.id]) === Number(item.correct)) {
          correctTotal++;
        }
      });
      footerHtml = `🏆 Kết quả <strong>${teamShort}</strong>: Trả lời đúng <strong>${correctTotal}/${questions.length}</strong> câu • Bấm số <strong>1–${questions.length}</strong> phía trên để đối chiếu từng câu.`;
    } else if (teamState.isLocked) {
      footerHtml = `🔒 <strong>${teamShort}</strong> đã chốt nộp bài (${answeredCount}/${questions.length} câu). Đáp án đúng/sai sẽ tự động mở khi cả 2 đội hoàn thành!`;
    } else if (hasChosen) {
      footerHtml = `⚡ <strong>${teamShort}</strong> vừa chọn phương án <strong>[${OPTION_LETTERS[chosenIdx]}]</strong> cho Câu ${activeIdx + 1} • Đã làm ${answeredCount}/${questions.length} câu.`;
    } else {
      footerHtml = `⏳ <strong>${teamShort}</strong> đang đọc & thảo luận <strong>Câu ${activeIdx + 1}/${questions.length}</strong> trên điện thoại...`;
    }

    stageEl.innerHTML = `
      <div class="gmm-live-q-card ${teamKey === 'teamA' ? 'team-a' : 'team-b'}">
        <div class="gmm-live-q-topbar">
          <div class="gmm-live-q-topbar-left">
            <span class="gmm-live-q-index-badge">CÂU ${activeIdx + 1}/${questions.length}</span>
            ${modeBadgeHtml}
          </div>
          <div class="gmm-live-q-topbar-right">
            <span class="gmm-live-q-coord-badge">${coordText}</span>
            ${earlyRevealBtnHtml}
          </div>
        </div>
        <div class="gmm-live-q-prompt">${escapeHtml(q.question)}</div>
        <div class="gmm-live-q-options-grid">
          ${optionsHtml}
        </div>
        <div class="gmm-live-q-footer">${footerHtml}</div>
      </div>
    `;
  }

  function renderLiveQuizCards() {
    const snap = getHostSnapshot();
    if (!snap) return;
    renderSingleTeamLiveQuizCard('teamA', snap);
    renderSingleTeamLiveQuizCard('teamB', snap);
  }

  // ============================================================================
  // 2. TAB 5: KẾT QUẢ TRANH CHUẨN GIÁO VIÊN & ĐỐI CHIẾU SONG SONG 2 ĐỘI
  // ============================================================================
  function setTeacherKeyViewMode(mode) {
    tkViewMode = (mode === 'compare') ? 'compare' : 'master';
    renderTeacherAnswerKeyTab();
  }

  function toggleTeacherKeyBackground() {
    tkWhitePaperBg = !tkWhitePaperBg;
    renderTeacherAnswerKeyTab();
    if (tkFullscreenOpen) renderFullscreenMasterBody();
  }

  function toggleTeacherKeyCodes() {
    tkShowCellCodes = !tkShowCellCodes;
    renderTeacherAnswerKeyTab();
    if (tkFullscreenOpen) renderFullscreenMasterBody();
  }

  function toggleTeacherKeySeamless() {
    tkSeamlessStrokes = !tkSeamlessStrokes;
    renderTeacherAnswerKeyTab();
    if (tkFullscreenOpen) renderFullscreenMasterBody();
    if (typeof window.showToast === 'function') {
      window.showToast(
        tkSeamlessStrokes
          ? '🎨 Đã bật Liền Khối Nghệ Thuật: ẩn đường gân đen nội bộ giữa các mảnh cùng màu!'
          : '🧩 Đã hiện Đường Gân Chi Tiết: dễ dàng đối soát từng mảnh ghép với giấy A1!',
        'info'
      );
    }
  }

  function toggleTeacherKeyDateSeparator() {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.toggleDateSeparatorStyle === 'function') {
      window.GiaiMaPuzzle.toggleDateSeparatorStyle();
      if (tkFullscreenOpen) renderFullscreenMasterBody();
    }
  }

  function setCompareTeamSource(teamKey, source) {
    if (teamKey !== 'teamA' && teamKey !== 'teamB') return;
    tkTeamCompareSource[teamKey] = source;
    renderTeacherAnswerKeyTab();
  }

  function buildSolvedMasterSvg(instanceId, overrideOptions) {
    if (!window.GiaiMaPuzzle || typeof window.GiaiMaPuzzle.renderSvgMatrix !== 'function') {
      return '<div style="padding:24px;color:#94a3b8;text-align:center;">Đang tải dữ liệu bức tranh chuẩn...</div>';
    }
    const opts = Object.assign({
      isPrint: tkWhitePaperBg,
      isSolvedAnswerKey: true,
      seamlessStrokes: tkSeamlessStrokes
    }, overrideOptions || {});
    return window.GiaiMaPuzzle.renderSvgMatrix(instanceId || 'teacher_master', {}, opts);
  }

  function resolveAnswerRuleRows(snap, activePuzzle) {
    const colorRules = (activePuzzle && activePuzzle.colorRules) ? activePuzzle.colorRules : {};
    const cells = (activePuzzle && Array.isArray(activePuzzle.cells)) ? activePuzzle.cells : [];
    const questions = (snap && Array.isArray(snap.questions)) ? snap.questions : [];

    // Đếm số mảnh mục tiêu ứng với từng mã tọa độ (1B -> 10B)
    const pieceCountsByCode = {};
    cells.forEach(c => {
      if (c && c.isTarget && c.code) {
        pieceCountsByCode[c.code] = (pieceCountsByCode[c.code] || 0) + 1;
      }
    });

    const ruleEntries = Object.keys(colorRules).map(codeKey => ({
      codeKey,
      rule: colorRules[codeKey]
    })).sort((a, b) => ((a.rule && a.rule.qNum) || 0) - ((b.rule && b.rule.qNum) || 0));

    // Nếu đang dùng tranh tự sinh có số câu khác bộ câu hỏi hiện tại hoặc chưa tải câu hỏi -> ưu tiên bảng colorRules của tranh
    const useRuleEntriesDirectly = questions.length === 0 || (ruleEntries.length > 0 && ruleEntries.length !== questions.length);

    if (useRuleEntriesDirectly && ruleEntries.length > 0) {
      return ruleEntries.map((entry, idx) => {
        const qNum = (entry.rule && entry.rule.qNum) ? entry.rule.qNum : (idx + 1);
        return {
          qNum,
          qId: null,
          correctIdx: null,
          codeKey: entry.codeKey,
          swatchColor: (entry.rule && entry.rule.color) ? entry.rule.color : '#10b981',
          colorName: (entry.rule && entry.rule.name) ? entry.rule.name : 'Màu chuẩn',
          partName: (entry.rule && entry.rule.part) ? entry.rule.part : '',
          pieceCount: pieceCountsByCode[entry.codeKey] || 0
        };
      });
    }

    return questions.map((q, idx) => {
      const qNum = idx + 1;
      const correctLetter = OPTION_LETTERS[q.correct] || 'A';
      const fallbackEntry = ruleEntries.find(e => e.rule && e.rule.qNum === qNum);
      const codeKey = colorRules[`${qNum}${correctLetter}`]
        ? `${qNum}${correctLetter}`
        : (fallbackEntry ? fallbackEntry.codeKey : `${qNum}${correctLetter}`);
      const rule = colorRules[codeKey] || null;
      return {
        qNum,
        qId: q.id,
        correctIdx: Number(q.correct),
        codeKey,
        swatchColor: rule ? rule.color : '#10b981',
        colorName: rule ? rule.name : 'Màu chuẩn',
        partName: (rule && rule.part) ? rule.part : '',
        pieceCount: pieceCountsByCode[codeKey] || 0
      };
    });
  }

  function buildLegendRowsHtml(snap) {
    const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : null;
    const ansA = (snap && snap.teamA && snap.teamA.answers) ? snap.teamA.answers : {};
    const ansB = (snap && snap.teamB && snap.teamB.answers) ? snap.teamB.answers : {};
    const rows = resolveAnswerRuleRows(snap, activePuzzle);

    return rows.map(row => {
      const partText = row.partName ? ` • ${row.partName}` : '';
      const countText = row.pieceCount > 0 ? ` (${row.pieceCount} ô)` : '';

      const teamACorrect = (row.qId !== null && ansA[row.qId] !== undefined && Number(ansA[row.qId]) === row.correctIdx);
      const teamBCorrect = (row.qId !== null && ansB[row.qId] !== undefined && Number(ansB[row.qId]) === row.correctIdx);

      const hasAnyProgress = row.qId !== null && (Object.keys(ansA).length > 0 || Object.keys(ansB).length > 0);
      const teamPills = hasAnyProgress
        ? `
          <div class="gmm-tk-legend-teams">
            <span class="gmm-tk-team-tag ${teamACorrect ? 'ok-a' : 'miss'}" title="Đội 1 ${teamACorrect ? 'mở khóa đúng' : 'chưa mở được ô này'}">Đ1 ${teamACorrect ? '✔' : '—'}</span>
            <span class="gmm-tk-team-tag ${teamBCorrect ? 'ok-b' : 'miss'}" title="Đội 2 ${teamBCorrect ? 'mở khóa đúng' : 'chưa mở được ô này'}">Đ2 ${teamBCorrect ? '✔' : '—'}</span>
          </div>
        `
        : '';

      return `
        <div class="gmm-tk-legend-row">
          <div class="gmm-tk-legend-left">
            <span class="gmm-tk-q-num">Câu ${row.qNum}</span>
            <span class="gmm-tk-code-pill" style="background:${row.swatchColor};">Mã ${escapeHtml(row.codeKey)}</span>
            <span class="gmm-tk-color-desc"><strong>${escapeHtml(row.colorName)}</strong>${escapeHtml(partText)}${escapeHtml(countText)}</span>
          </div>
          ${teamPills}
        </div>
      `;
    }).join('');
  }

  function buildTeamCompareColumnHtml(teamKey, snap) {
    const isTeamA = (teamKey === 'teamA');
    const teamTitle = isTeamA ? '🔴 TRANH ĐỘI 1 (ĐỘI A)' : '🔵 TRANH ĐỘI 2 (ĐỘI B)';
    const photoSrc = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getTeamArtworkPhoto === 'function')
      ? window.GiaiMaBiMat.getTeamArtworkPhoto(teamKey)
      : null;
    const hasPhoto = Boolean(photoSrc);
    const pref = tkTeamCompareSource[teamKey];
    const showPhoto = (pref === 'photo') || (pref === 'auto' && hasPhoto);

    let artworkBody = '';
    if (showPhoto && hasPhoto) {
      artworkBody = `
        <div class="gmm-tk-team-photo-box" onclick="GiaiMaBiMat.zoomArtworkPhoto('${teamKey}')" title="Bấm để phóng to ảnh chụp tranh giấy thật">
          <img src="${photoSrc}" alt="${teamTitle}" class="gmm-tk-team-photo-img gmm-ai-enhanced-img">
          <span class="gmm-tk-zoom-hint">🔍 Bấm để phóng to ảnh chụp</span>
        </div>
      `;
    } else if (pref === 'photo' && !hasPhoto) {
      artworkBody = `
        <div class="gmm-tk-team-empty-photo">
          <div style="font-size:2rem;margin-bottom:6px;">📷</div>
          <div style="font-weight:800;color:#e2e8f0;">Chưa có ảnh chụp giấy A1</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">Học sinh có thể chụp từ điện thoại hoặc chuyển sang xem Tranh Số</div>
        </div>
      `;
    } else {
      const teamData = (snap && snap[teamKey]) ? snap[teamKey] : {};
      const teamSvg = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function')
        ? window.GiaiMaPuzzle.renderSvgMatrix(`${teamKey}_cmp`, teamData, { isDecryptPhase: true })
        : '';
      artworkBody = `<div class="gmm-tk-team-svg-box ${tkShowCellCodes ? '' : 'gmm-hide-cell-codes'}">${teamSvg}</div>`;
    }

    const teamObj = (snap && snap[teamKey]) ? snap[teamKey] : { score: 0, bonusScore: 0 };
    const totalPts = (teamObj.score || 0) + (teamObj.bonusScore || 0);
    const approvedTag = (teamObj.bonusScore >= 10)
      ? '<span class="gmm-tk-approved-badge">🌟 Đã cộng +10đ Tranh Giấy</span>'
      : `<button type="button" class="gmm-judge-paper-btn ${isTeamA ? 'team-a' : 'team-b'}" onclick="GiaiMaBiMat.approvePaperArtwork('${teamKey}'); setTimeout(GiaiMaTeacherKey.renderTeacherAnswerKeyTab, 80);">✅ BGK Duyệt Tranh (+10đ)</button>`;

    return `
      <div class="gmm-tk-compare-col ${isTeamA ? 'team-a' : 'team-b'}">
        <div class="gmm-tk-compare-header">
          <span class="gmm-tk-compare-title">${teamTitle}</span>
          <div class="gmm-view-toggle-pills">
            <button type="button" class="gmm-view-pill ${showPhoto ? 'active' : ''}" onclick="GiaiMaTeacherKey.setCompareTeamSource('${teamKey}', 'photo')">
              📸 Ảnh Chụp ${hasPhoto ? '●' : ''}
            </button>
            <button type="button" class="gmm-view-pill ${!showPhoto ? 'active' : ''}" onclick="GiaiMaTeacherKey.setCompareTeamSource('${teamKey}', 'svg')">
              🗺️ Tranh Số
            </button>
          </div>
        </div>
        <div class="gmm-tk-compare-canvas">
          ${artworkBody}
        </div>
        <div class="gmm-tk-compare-footer">
          <span class="gmm-tk-score-summary">Tổng điểm hiện tại: <strong>${totalPts} điểm</strong></span>
          ${approvedTag}
        </div>
      </div>
    `;
  }

  function renderTeacherAnswerKeyTab() {
    const snap = getHostSnapshot();
    const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : { title: 'TRI ÂN THẦY CÔ 20/11', targetCellIds: [], isDefaultTriAn: true, dateSeparatorStyle: 'slash' };

    const btnMaster = document.getElementById('gmmTkBtnModeMaster');
    const btnCompare = document.getElementById('gmmTkBtnModeCompare');
    const btnPaperBg = document.getElementById('gmmTkBtnPaperBg');
    const btnSeamless = document.getElementById('gmmTkBtnSeamless');
    const btnCodes = document.getElementById('gmmTkBtnToggleCodes');
    const btnDateSep = document.getElementById('gmmTkBtnDateSep');

    if (btnMaster) btnMaster.classList.toggle('active', tkViewMode === 'master');
    if (btnCompare) btnCompare.classList.toggle('active', tkViewMode === 'compare');
    if (btnPaperBg) {
      btnPaperBg.classList.toggle('active', tkWhitePaperBg);
      btnPaperBg.innerHTML = tkWhitePaperBg
        ? '<span>📄 Nền Giấy Trắng A1</span>'
        : '<span>🌑 Nền Tối Máy Chiếu</span>';
    }
    if (btnSeamless) {
      btnSeamless.classList.toggle('active', tkSeamlessStrokes);
      btnSeamless.innerHTML = tkSeamlessStrokes
        ? '<span>🎨 Liền Khối: Đang Bật</span>'
        : '<span>🧩 Đường Gân: Đang Hiện</span>';
    }
    if (btnCodes) {
      btnCodes.classList.toggle('active', !tkShowCellCodes);
      btnCodes.innerHTML = tkShowCellCodes
        ? '<span>🔤 Mã Ô: Đang Hiện</span>'
        : '<span>✨ Mã Ô: Đã Ẩn (Tranh Sạch)</span>';
    }
    if (btnDateSep) {
      const isDefaultTriAn = (activePuzzle.isDefaultTriAn !== false);
      const isDash = (activePuzzle.dateSeparatorStyle === 'dash');
      btnDateSep.style.display = isDefaultTriAn ? 'inline-flex' : 'none';
      btnDateSep.classList.toggle('active', isDash);
      btnDateSep.innerHTML = isDash
        ? '<span>📅 Kiểu ngày: 20-11</span>'
        : '<span>📅 Kiểu ngày: 20/11</span>';
    }

    const titleBadge = document.getElementById('gmmTkPuzzleTitleBadge');
    if (titleBadge) {
      const targetCount = Array.isArray(activePuzzle.targetCellIds) ? activePuzzle.targetCellIds.length : 91;
      titleBadge.textContent = `🌺 CHỦ ĐỀ: ${activePuzzle.title || 'TRI ÂN THẦY CÔ 20/11'} (${targetCount} MẢNG MÀU CHUẨN)`;
    }

    const masterView = document.getElementById('gmmTeacherKeyMasterView');
    const compareView = document.getElementById('gmmTeacherKeyCompareView');

    if (tkViewMode === 'master') {
      if (masterView) masterView.style.display = 'grid';
      if (compareView) compareView.style.display = 'none';

      const svgWrap = document.getElementById('gmmTeacherMasterSvgWrap');
      if (svgWrap) {
        svgWrap.className = `gmm-tk-master-svg-stage ${tkWhitePaperBg ? 'paper-bg' : 'dark-bg'} ${tkShowCellCodes ? '' : 'gmm-hide-cell-codes'}`;
        svgWrap.innerHTML = buildSolvedMasterSvg('teacher_master_main');
      }

      const legendWrap = document.getElementById('gmmTeacherKeyLegendList');
      if (legendWrap) {
        legendWrap.innerHTML = buildLegendRowsHtml(snap);
      }
    } else {
      if (masterView) masterView.style.display = 'none';
      if (compareView) {
        compareView.style.display = 'grid';
        compareView.innerHTML = `
          ${buildTeamCompareColumnHtml('teamA', snap)}
          <div class="gmm-tk-compare-col master-center">
            <div class="gmm-tk-compare-header master">
              <span class="gmm-tk-compare-title">👨‍🏫 TRANH KẾT QUẢ CHUẨN GIÁO VIÊN</span>
              <button type="button" class="gmm-view-pill active" onclick="GiaiMaTeacherKey.openMasterFullscreen()">⛶ Toàn Màn Hình</button>
            </div>
            <div class="gmm-tk-compare-canvas">
              <div class="gmm-tk-team-svg-box ${tkWhitePaperBg ? 'paper-bg' : 'dark-bg'} ${tkShowCellCodes ? '' : 'gmm-hide-cell-codes'}" onclick="GiaiMaTeacherKey.openMasterFullscreen()">
                ${buildSolvedMasterSvg('teacher_master_cmp')}
              </div>
            </div>
            <div class="gmm-tk-compare-footer master">
              <span>🎯 Thông điệp chuẩn: <strong>${escapeHtml(activePuzzle.title || 'TRI ÂN THẦY CÔ 20/11')}</strong></span>
            </div>
          </div>
          ${buildTeamCompareColumnHtml('teamB', snap)}
        `;
      }
    }
  }

  function fitTeacherKeyFrame() {
    const bodyEl = document.getElementById('gmmTkFullscreenBody');
    const frame = document.getElementById('gmmTkArtFrame');
    if (!bodyEl || !frame) return;

    const availW = Math.max(300, (bodyEl.clientWidth || (window.innerWidth * 0.95)) - 32);
    const availH = Math.max(200, (bodyEl.clientHeight || (window.innerHeight * 0.94 - 80)) - 24);

    const targetRatio = 800 / 520;
    let targetW = availW;
    let targetH = Math.round(targetW / targetRatio);

    if (targetH > availH) {
      targetH = availH;
      targetW = Math.round(targetH * targetRatio);
    }

    frame.style.width = targetW + 'px';
    frame.style.height = targetH + 'px';
  }

  function renderFullscreenMasterBody() {
    const bodyEl = document.getElementById('gmmTkFullscreenBody');
    if (!bodyEl) return;
    bodyEl.className = `gmm-tk-fs-body ${tkWhitePaperBg ? 'paper-bg' : 'dark-bg'} ${tkShowCellCodes ? '' : 'gmm-hide-cell-codes'}`;
    const svgHtml = buildSolvedMasterSvg('teacher_master_fs');
    const isNeonActive = Boolean(isSideFireworksEnabled);
    bodyEl.innerHTML = `
      <div id="gmmTkArtFrame" class="gmm-tk-art-frame ${isNeonActive ? 'neon-active' : ''}">
        <div class="gmm-neon-glow-halo"></div>
        <div class="gmm-neon-track">
          <div class="gmm-neon-stream"></div>
        </div>
        <div class="gmm-tk-art-inner ${tkWhitePaperBg ? 'paper-inner' : 'dark-inner'}">
          ${svgHtml}
        </div>
      </div>
    `;

    // Căn chỉnh ngay kích thước ôm sát tỷ lệ 800:520 không bị co về 0
    fitTeacherKeyFrame();
    requestAnimationFrame(fitTeacherKeyFrame);
    setTimeout(fitTeacherKeyFrame, 120);

    const fsBtnBg = document.getElementById('gmmTkFsBtnBg');
    const fsBtnSeamless = document.getElementById('gmmTkFsBtnSeamless');
    const fsBtnCodes = document.getElementById('gmmTkFsBtnCodes');
    if (fsBtnBg) {
      fsBtnBg.innerHTML = tkWhitePaperBg ? '📄 Nền Giấy Trắng A1' : '🌑 Nền Tối Máy Chiếu';
    }
    if (fsBtnSeamless) {
      fsBtnSeamless.innerHTML = tkSeamlessStrokes ? '🎨 Liền Khối: Đang Bật' : '🧩 Đường Gân: Đang Hiện';
    }
    if (fsBtnCodes) {
      fsBtnCodes.innerHTML = tkShowCellCodes ? '🔤 Mã Ô: Đang Hiện' : '✨ Mã Ô: Đã Ẩn (Tranh Sạch)';
    }

    updateThemeSongUI();
  }

  // ============================================================================
  // 3. IN PHIẾU ĐÁP ÁN MÀU A4 NGANG CHO BAN GIÁM KHẢO / GIÁO VIÊN CHẤM PHỤ
  // ============================================================================
  function printJudgeAnswerKeyA4() {
    const snap = getHostSnapshot();
    const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : { title: 'TRI ÂN THẦY CÔ 20/11', cells: [], colorRules: {}, targetCellIds: [] };

    const printWin = window.open('', '_blank', 'width=1240,height=880');
    if (!printWin) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép mở popup để in Phiếu Đáp Án Màu A4 cho Giám Khảo!', 'warning');
      }
      return;
    }

    const puzzleTitle = activePuzzle.title || 'TRI ÂN THẦY CÔ 20/11';
    const totalTargetCount = Array.isArray(activePuzzle.targetCellIds) ? activePuzzle.targetCellIds.length : 91;
    const rows = resolveAnswerRuleRows(snap, activePuzzle);

    // Sinh sẵn cả 2 phiên bản SVG Vector (Hiện đường gân chi tiết & Liền khối nghệ thuật) để Giám khảo bấm chuyển ngay trên cửa sổ xem trước
    const svgWithSeams = buildSolvedMasterSvg('judge_print_seams', {
      isPrint: true,
      isSolvedAnswerKey: true,
      seamlessStrokes: false
    });
    const svgSeamless = buildSolvedMasterSvg('judge_print_seamless', {
      isPrint: true,
      isSolvedAnswerKey: true,
      seamlessStrokes: true
    });

    const tableRowsHtml = rows.map(row => `
      <tr>
        <td class="col-q">Câu ${row.qNum}</td>
        <td class="col-code">
          <span class="code-pill" style="background:${row.swatchColor};">${escapeHtml(row.codeKey)}</span>
        </td>
        <td class="col-desc">
          <strong>${escapeHtml(row.colorName)}</strong>${row.partName ? ' • ' + escapeHtml(row.partName) : ''}
        </td>
        <td class="col-cnt">${row.pieceCount} ô</td>
        <td class="col-chk">☐</td>
        <td class="col-chk">☐</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Đáp Án Màu A4 Ban Giám Khảo - ${escapeHtml(puzzleTitle)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 6mm 7mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 10px 14px;
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
    }
    .toolbar-preview {
      max-width: 1120px;
      margin: 0 auto 10px;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2);
    }
    .toolbar-left {
      font-size: 13px;
      line-height: 1.4;
    }
    .toolbar-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tb-btn {
      border: 1px solid #334155;
      background: #1e293b;
      color: #e2e8f0;
      padding: 7px 12px;
      border-radius: 7px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .tb-btn.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
    }
    .tb-btn.print-primary {
      background: #059669;
      border-color: #34d399;
      color: #ffffff;
      font-size: 13px;
      padding: 7px 16px;
    }
    .judge-sheet {
      width: 283mm;
      height: 196mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 4mm 5mm;
      border-radius: 6px;
      box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 2.2mm;
      margin-bottom: 2.5mm;
    }
    .sheet-org {
      font-size: 8.5pt;
      font-weight: 800;
      line-height: 1.3;
      color: #1e293b;
      text-transform: uppercase;
    }
    .sheet-title-wrap {
      text-align: center;
      flex: 1;
      padding: 0 8px;
    }
    .sheet-title-wrap h1 {
      margin: 0;
      font-size: 13.5pt;
      font-weight: 900;
      letter-spacing: 0.3px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sheet-subtitle {
      margin-top: 2px;
      font-size: 8.8pt;
      font-weight: 800;
      color: #0369a1;
    }
    .sheet-badge-confidential {
      font-size: 8.2pt;
      font-weight: 900;
      padding: 4px 9px;
      border: 1.5px solid #0f172a;
      border-radius: 5px;
      background: #fef3c7;
      color: #92400e;
      text-align: right;
      line-height: 1.25;
    }
    .sheet-main {
      flex: 1;
      display: grid;
      grid-template-columns: 1.82fr 1fr;
      gap: 4mm;
      min-height: 0;
      align-items: stretch;
    }
    .matrix-panel {
      border: 1.8px solid #0f172a;
      border-radius: 6px;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #ffffff;
      min-height: 0;
    }
    .matrix-svg-holder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .matrix-svg-holder svg {
      width: 100% !important;
      height: 100% !important;
      max-height: 162mm;
    }
    .hide-codes svg text {
      opacity: 0 !important;
    }
    .checklist-panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 2.2mm;
      min-height: 0;
    }
    .judge-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .judge-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      padding: 4px 4px;
      border: 1px solid #0f172a;
      text-align: center;
      font-size: 7.6pt;
    }
    .judge-table td {
      border: 1px solid #cbd5e1;
      padding: 3.2px 4px;
      vertical-align: middle;
    }
    .judge-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .col-q {
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
      width: 38px;
    }
    .col-code {
      text-align: center;
      width: 44px;
    }
    .code-pill {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 4px;
      color: #ffffff;
      font-weight: 900;
      font-size: 7.8pt;
      border: 1px solid rgba(0, 0, 0, 0.25);
    }
    .col-desc {
      font-size: 7.7pt;
      line-height: 1.2;
    }
    .col-cnt {
      text-align: center;
      font-weight: 800;
      color: #334155;
      white-space: nowrap;
      width: 34px;
    }
    .col-chk {
      text-align: center;
      font-size: 10pt;
      width: 24px;
      color: #475569;
    }
    .score-box {
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 2.5mm 3mm;
      background: #f8fafc;
      font-size: 8pt;
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .score-box-title {
      font-weight: 900;
      font-size: 8.2pt;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 1mm;
    }
    .score-team-line {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
    }
    .sheet-footer {
      margin-top: 2mm;
      padding-top: 1.5mm;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 7.6pt;
      color: #475569;
      font-weight: 600;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .judge-sheet {
        width: 100%;
        height: 195mm;
        box-shadow: none;
        border-radius: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar-preview no-print">
    <div class="toolbar-left">
      <strong>🖨️ Xem Trước Phiếu Đáp Án Màu Khổ A4 Ngang (Dành Cho Ban Giám Khảo):</strong><br>
      <span>Đã bật chế độ ép in màu chuẩn Vector (<code>print-color-adjust: exact</code>) vừa khít 1 trang A4.</span>
    </div>
    <div class="toolbar-actions">
      <button type="button" id="btnToggleSeams" class="tb-btn" onclick="toggleSeams()">🧩 Đường Gân Ô: Đang Hiện</button>
      <button type="button" id="btnToggleCodes" class="tb-btn active" onclick="toggleCodes()">🔤 Mã 1B→10B: Đang Hiện</button>
      <button type="button" class="tb-btn print-primary" onclick="window.print()">🖨️ In Phiếu Đáp Án Màu A4 (Ctrl+P)</button>
    </div>
  </div>

  <div class="judge-sheet">
    <div class="sheet-header">
      <div class="sheet-org">
        TRƯỜNG THCS TÂN HẢI<br>
        BAN GIÁM KHẢO TRÒ CHƠI LỚP HỌC
      </div>
      <div class="sheet-title-wrap">
        <h1>PHIẾU ĐÁP ÁN MÀU CHUẨN — ĐỐI SOÁT CHẤM TRANH GIẤY</h1>
        <div class="sheet-subtitle">Chủ đề: ${escapeHtml(puzzleTitle)} • Tổng số mảng màu đúng: ${totalTargetCount} ô</div>
      </div>
      <div class="sheet-badge-confidential">
        TÀI LIỆU GIÁM KHẢO<br>
        KHỔ IN: A4 MÀU
      </div>
    </div>

    <div class="sheet-main">
      <div class="matrix-panel">
        <div id="svgSeamsWrap" class="matrix-svg-holder">${svgWithSeams}</div>
        <div id="svgSeamlessWrap" class="matrix-svg-holder" style="display:none;">${svgSeamless}</div>
      </div>

      <div class="checklist-panel">
        <table class="judge-table">
          <thead>
            <tr>
              <th>Câu</th>
              <th>Mã</th>
              <th>Màu Bút &amp; Cụm Chi Tiết</th>
              <th>Số Ô</th>
              <th>Đ1</th>
              <th>Đ2</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="score-box">
          <div class="score-box-title">📋 BẢNG GHI ĐIỂM NHANH TẠI BÀN CÁC ĐỘI</div>
          <div class="score-team-line">
            <span>🔴 Đội 1 (Đội A): Đúng ....../${rows.length} cụm</span>
            <span>Thẩm mỹ: ......đ</span>
            <span>Tổng: ........đ</span>
          </div>
          <div class="score-team-line">
            <span>🔵 Đội 2 (Đội B): Đúng ....../${rows.length} cụm</span>
            <span>Thẩm mỹ: ......đ</span>
            <span>Tổng: ........đ</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7.5pt;color:#475569;font-style:italic;">
            <span>* Lưu ý: Các ô bẫy (mã sai) phải để trắng không tô.</span>
            <span>Giám khảo ký tên: ........................</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sheet-footer">
      <span>✔ Quy tắc chấm nhanh: Đối chiếu đúng màu + đúng mã tọa độ trong ô + không tô lem sang ô bẫy kế bên.</span>
      <span>Hệ thống Giải Mã Bức Tranh Bí Ẩn • Bản in Vector sắc nét</span>
    </div>
  </div>

  <script>
    var isSeamless = false;
    var showCodes = true;
    function toggleSeams() {
      isSeamless = !isSeamless;
      document.getElementById('svgSeamsWrap').style.display = isSeamless ? 'none' : 'flex';
      document.getElementById('svgSeamlessWrap').style.display = isSeamless ? 'flex' : 'none';
      var btn = document.getElementById('btnToggleSeams');
      btn.classList.toggle('active', isSeamless);
      btn.textContent = isSeamless ? '🎨 Liền Khối: Đang Bật' : '🧩 Đường Gân Ô: Đang Hiện';
    }
    function toggleCodes() {
      showCodes = !showCodes;
      document.getElementById('svgSeamsWrap').classList.toggle('hide-codes', !showCodes);
      document.getElementById('svgSeamlessWrap').classList.toggle('hide-codes', !showCodes);
      var btn = document.getElementById('btnToggleCodes');
      btn.classList.toggle('active', showCodes);
      btn.textContent = showCodes ? '🔤 Mã 1B→10B: Đang Hiện' : '✨ Mã Ô: Đã Ẩn';
    }
  </script>
</body>
</html>`;

    printWin.document.write(html);
    printWin.document.close();
  }

  // ============================================================================
  // TÍCH HỢP BÀI HÁT "THƯƠNG LẮM THẦY CÔ ƠI" KHI PHÓNG TO TRANH GIÁO VIÊN
  // ============================================================================
  const THEME_SONG_FILE = 'assets/audio/thuong-lam-thay-co-oi.mp3';
  let themeSongAudio = null;
  let isSongEnabled = true; // Mặc định BẬT để khi mở toàn màn hình là tự động phát
  let isSongPlaying = false;
  let audioFadeTimer = null;

  function getThemeSongAudio() {
    if (!themeSongAudio) {
      themeSongAudio = new Audio(THEME_SONG_FILE);
      themeSongAudio.preload = 'auto';
      themeSongAudio.loop = true;
      themeSongAudio.volume = 0.9;

      themeSongAudio.addEventListener('play', () => {
        isSongPlaying = true;
        updateThemeSongUI();
      });
      themeSongAudio.addEventListener('pause', () => {
        isSongPlaying = false;
        updateThemeSongUI();
      });
      themeSongAudio.addEventListener('ended', () => {
        isSongPlaying = false;
        updateThemeSongUI();
      });
      themeSongAudio.addEventListener('error', (err) => {
        console.warn(`Lỗi tải bài hát ${THEME_SONG_FILE}:`, err);
      });
    }
    return themeSongAudio;
  }

  function fadeAudioVolume(targetVolume, duration = 600, callback) {
    const audio = getThemeSongAudio();
    if (!audio) return;
    if (audioFadeTimer) {
      clearInterval(audioFadeTimer);
      audioFadeTimer = null;
    }
    const startVol = audio.volume;
    const diff = targetVolume - startVol;
    const steps = 15;
    const interval = Math.max(16, Math.floor(duration / steps));
    let currentStep = 0;

    audioFadeTimer = setInterval(() => {
      currentStep++;
      const v = Math.min(1, Math.max(0, startVol + (diff * (currentStep / steps))));
      audio.volume = v;
      if (currentStep >= steps) {
        clearInterval(audioFadeTimer);
        audioFadeTimer = null;
        audio.volume = targetVolume;
        if (typeof callback === 'function') callback();
      }
    }, interval);
  }

  function playThemeSong(reset = false) {
    if (!isSongEnabled) return;
    try {
      const audio = getThemeSongAudio();
      if (reset) {
        audio.currentTime = 0;
      }
      audio.volume = 0.05;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          isSongPlaying = true;
          fadeAudioVolume(0.9, 700);
          updateThemeSongUI();
        }).catch(err => {
          console.warn('Trình duyệt chặn autoplay âm thanh:', err);
          isSongPlaying = false;
          updateThemeSongUI();
        });
      }
    } catch (e) {
      console.warn('Lỗi khi phát bài hát:', e);
    }
  }

  function pauseThemeSong(fade = true) {
    if (!themeSongAudio) return;
    if (fade && isSongPlaying) {
      fadeAudioVolume(0, 450, () => {
        if (themeSongAudio) themeSongAudio.pause();
        isSongPlaying = false;
        updateThemeSongUI();
      });
    } else {
      themeSongAudio.pause();
      isSongPlaying = false;
      updateThemeSongUI();
    }
  }

  function toggleThemeSongFullscreen() {
    isSongEnabled = !isSongEnabled;
    if (isSongEnabled) {
      playThemeSong(false);
    } else {
      pauseThemeSong(true);
    }
    updateThemeSongUI();
  }

  function toggleThemeSongToolbar() {
    getThemeSongAudio();
    if (isSongPlaying) {
      pauseThemeSong(true);
    } else {
      isSongEnabled = true;
      playThemeSong(false);
    }
    updateThemeSongUI();
  }

  function updateThemeSongUI() {
    const fsBtn = document.getElementById('gmmTkFsBtnSong');
    const fsTxt = document.getElementById('gmmTkFsSongTxt');
    const fsIcon = document.getElementById('gmmTkFsSongIcon');
    if (fsBtn) {
      fsBtn.classList.toggle('active', isSongEnabled);
      fsBtn.classList.toggle('playing', isSongPlaying);
      if (isSongPlaying) {
        if (fsTxt) fsTxt.textContent = 'Bài Hát: ĐANG HÁT ♫';
        if (fsIcon) fsIcon.textContent = '🎵';
      } else if (isSongEnabled) {
        if (fsTxt) fsTxt.textContent = 'Bài Hát: SẴN SÀNG';
        if (fsIcon) fsIcon.textContent = '🎵';
      } else {
        if (fsTxt) fsTxt.textContent = 'Bài Hát: TẮT';
        if (fsIcon) fsIcon.textContent = '🔇';
      }
    }

    const tbBtn = document.getElementById('gmmTkBtnMusic');
    if (tbBtn) {
      tbBtn.classList.toggle('active', isSongPlaying);
      const span = tbBtn.querySelector('span');
      if (span) {
        span.textContent = isSongPlaying
          ? '⏸️ Dừng Bài Hát 20/11'
          : '🎵 Thương Lắm Thầy Cô Ơi';
      }
    }

    const frame = document.getElementById('gmmTkArtFrame');
    if (frame) {
      frame.classList.toggle('music-active', isSongPlaying);
    }
  }

  // ============================================================================
  // HIỆU ỨNG PHÁO HOA BẮN 2 BÊN TRANH LIÊN TỤC KHÔNG NGHỈ KHI TOÀN MÀN HÌNH
  // ============================================================================
  let fireworksTimer = null;
  let isSideFireworksEnabled = true;
  let fireworkStep = 0;

  const FESTIVAL_FIREWORK_PALETTE = [
    '#ffd700', // Vàng gold
    '#ff3b30', // Đỏ rực
    '#ff9500', // Cam tươi
    '#38bdf8', // Xanh cyan
    '#ff2d55', // Hồng sen
    '#22c55e', // Xanh lục
    '#a855f7', // Tím neon
    '#ffffff', // Trắng bạc
    '#facc15'  // Vàng chanh
  ];

  function pulseNeonBorder() {
    const frame = document.getElementById('gmmTkArtFrame');
    if (!frame) return;
    frame.classList.add('firework-burst-pulse');
    setTimeout(() => {
      if (frame) frame.classList.remove('firework-burst-pulse');
    }, 180);
  }

  function launchSideCannonLeft() {
    if (typeof confetti !== 'function') return;
    pulseNeonBorder();
    confetti({
      particleCount: Math.floor(Math.random() * 15) + 25,
      angle: Math.floor(Math.random() * 20) + 65, // 65° -> 85°
      spread: Math.floor(Math.random() * 20) + 45,
      startVelocity: Math.floor(Math.random() * 16) + 52,
      origin: { x: Math.random() * 0.1 + 0.02, y: Math.random() * 0.12 + 0.84 },
      colors: FESTIVAL_FIREWORK_PALETTE,
      ticks: 240,
      gravity: 0.88,
      scalar: 1.2,
      drift: 0.1,
      zIndex: 2147483647
    });
  }

  function launchSideCannonRight() {
    if (typeof confetti !== 'function') return;
    pulseNeonBorder();
    confetti({
      particleCount: Math.floor(Math.random() * 15) + 25,
      angle: Math.floor(Math.random() * 20) + 95, // 95° -> 115°
      spread: Math.floor(Math.random() * 20) + 45,
      startVelocity: Math.floor(Math.random() * 16) + 52,
      origin: { x: Math.random() * 0.1 + 0.88, y: Math.random() * 0.12 + 0.84 },
      colors: FESTIVAL_FIREWORK_PALETTE,
      ticks: 240,
      gravity: 0.88,
      scalar: 1.2,
      drift: -0.1,
      zIndex: 2147483647
    });
  }

  function launchSkyBurst(side) {
    if (typeof confetti !== 'function') return;
    pulseNeonBorder();
    const x = side === 'left'
      ? (Math.random() * 0.09 + 0.04)
      : (Math.random() * 0.09 + 0.87);
    const y = Math.random() * 0.28 + 0.18;
    confetti({
      particleCount: 35,
      angle: 90,
      spread: 360,
      startVelocity: 34,
      origin: { x: x, y: y },
      colors: FESTIVAL_FIREWORK_PALETTE,
      ticks: 200,
      gravity: 0.82,
      scalar: 1.25,
      zIndex: 2147483647
    });
  }

  function startContinuousSideFireworks() {
    stopContinuousSideFireworks();
    const frame = document.getElementById('gmmTkArtFrame');
    if (frame) frame.classList.toggle('neon-active', isSideFireworksEnabled);
    if (!isSideFireworksEnabled) return;

    // Loạt pháo khai màn tức thì ở cả 2 bên
    launchSideCannonLeft();
    launchSideCannonRight();

    // Vòng lặp bắn liên tục không nghỉ
    fireworksTimer = setInterval(() => {
      if (!tkFullscreenOpen || !isSideFireworksEnabled) {
        stopContinuousSideFireworks();
        return;
      }

      fireworkStep = (fireworkStep + 1) % 6;

      // Nhịp 1, 3, 5: Bắn bên trái
      if (fireworkStep % 2 === 0) {
        launchSideCannonLeft();
      }
      // Nhịp 2, 4, 0: Bắn bên phải
      if (fireworkStep % 2 === 1) {
        launchSideCannonRight();
      }

      // Nhịp đặc biệt: Nổ hoa bung 360° trên không trung (Sky Burst)
      if (fireworkStep === 0) {
        launchSkyBurst('left');
        launchSideCannonRight();
      } else if (fireworkStep === 3) {
        launchSkyBurst('right');
        launchSideCannonLeft();
      }
    }, 280);
  }

  function stopContinuousSideFireworks() {
    if (fireworksTimer) {
      clearInterval(fireworksTimer);
      fireworksTimer = null;
    }
    const frame = document.getElementById('gmmTkArtFrame');
    if (frame && !isSideFireworksEnabled) {
      frame.classList.remove('neon-active');
    }
  }

  function toggleSideFireworks() {
    isSideFireworksEnabled = !isSideFireworksEnabled;
    const btn = document.getElementById('gmmTkFsBtnFireworks');
    if (btn) {
      btn.innerHTML = isSideFireworksEnabled ? '🎆 Pháo Hoa: BẬT' : '🎆 Pháo Hoa: TẮT';
      btn.classList.toggle('active', isSideFireworksEnabled);
      btn.style.opacity = isSideFireworksEnabled ? '1' : '0.6';
    }
    const frame = document.getElementById('gmmTkArtFrame');
    if (frame) {
      frame.classList.toggle('neon-active', isSideFireworksEnabled);
    }
    if (isSideFireworksEnabled && tkFullscreenOpen) {
      startContinuousSideFireworks();
    } else {
      stopContinuousSideFireworks();
    }
  }

  function openMasterFullscreen() {
    const modal = document.getElementById('gmmTeacherKeyFullscreenModal');
    if (!modal) return;
    tkFullscreenOpen = true;
    modal.style.display = 'flex';
    renderFullscreenMasterBody();

    // Bắt đầu bắn pháo hoa liên tục không nghỉ ở 2 bên sườn tranh
    if (isSideFireworksEnabled) {
      startContinuousSideFireworks();
    }

    // Tự động phát bài hát "Thương lắm thầy cô ơi" vang lên hòa nhịp cùng bức tranh & pháo hoa
    if (isSongEnabled) {
      playThemeSong(true);
    }

    // Kích hoạt toàn màn hình trình duyệt tràn viền máy chiếu
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function closeMasterFullscreen() {
    const modal = document.getElementById('gmmTeacherKeyFullscreenModal');
    if (modal) modal.style.display = 'none';
    tkFullscreenOpen = false;

    // Dừng ngay pháo hoa khi thoát toàn màn hình
    stopContinuousSideFireworks();

    // Dừng bài hát êm ái khi thu nhỏ tranh
    pauseThemeSong(true);

    // Thoát Fullscreen trình duyệt nếu đang bật
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tkFullscreenOpen) {
      closeMasterFullscreen();
    }
  });

  window.addEventListener('resize', () => {
    if (tkFullscreenOpen) fitTeacherKeyFrame();
  });

  document.addEventListener('fullscreenchange', () => {
    if (tkFullscreenOpen) {
      setTimeout(fitTeacherKeyFrame, 80);
      setTimeout(fitTeacherKeyFrame, 220);
    }
  });

  window.GiaiMaTeacherKey = {
    renderLiveQuizCards,
    inspectTeamQuestion,
    followLivePhone,
    resetLiveQuizTracking,
    toggleArenaAnswerReveal,
    renderTeacherAnswerKeyTab,
    setTeacherKeyViewMode,
    toggleTeacherKeyBackground,
    toggleTeacherKeyCodes,
    toggleTeacherKeySeamless,
    toggleTeacherKeyDateSeparator,
    printJudgeAnswerKeyA4,
    setCompareTeamSource,
    openMasterFullscreen,
    closeMasterFullscreen,
    startContinuousSideFireworks,
    stopContinuousSideFireworks,
    toggleSideFireworks,
    playThemeSong,
    pauseThemeSong,
    toggleThemeSongFullscreen,
    toggleThemeSongToolbar,
    updateThemeSongUI
  };
})();
