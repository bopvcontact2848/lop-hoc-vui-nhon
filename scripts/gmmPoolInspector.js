/**
 * GMM Pool Inspector & Quick Inline Editor
 * Cho phép Thầy/Cô xem toàn bộ danh sách 30–50+ câu trong kho lớn, theo dõi trạng thái đã bốc/chưa bốc,
 * lọc/tìm kiếm, sửa nhanh chính tả và reset vòng bốc về 0 ngay trong cửa sổ Soạn câu hỏi.
 */
(function initGmmPoolInspector() {
  'use strict';

  let inspectingSetId = '';
  let inspectorFilter = 'all'; // 'all' | 'unseen' | 'seen'
  let savedSetsCtx = null;

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveInspectingSet() {
    const setsApi = window.GmmQuestionSets;
    if (!setsApi || !inspectingSetId) return null;
    if (inspectingSetId === '__pending_import__') {
      return setsApi.getActivePoolDescriptor();
    }
    return setsApi.findTopicSetById(inspectingSetId);
  }

  function setMainEditorVisibility(inspectorOpen) {
    const inspectorEl = document.getElementById('gmmPoolInspectorPanel');
    const navEl = document.getElementById('gmmQEditNav');
    const formEl = document.getElementById('gmmQEditForm');
    const batchBar = document.querySelector('#gmmQuestionEditModal .gmm-batch-tools-bar');
    const pastePanel = document.getElementById('gmmQuickPastePanel');
    const setsPanel = document.getElementById('gmmQuestionSetsPanel');

    if (inspectorEl) inspectorEl.style.display = inspectorOpen ? 'flex' : 'none';
    if (navEl) navEl.style.display = inspectorOpen ? 'none' : 'flex';
    if (formEl) formEl.style.display = inspectorOpen ? 'none' : 'block';
    if (batchBar) batchBar.style.display = inspectorOpen ? 'none' : 'flex';
    if (inspectorOpen) {
      if (pastePanel) pastePanel.style.display = 'none';
      if (setsPanel) setsPanel.style.display = 'none';
    }
  }

  function closeAddForm() {
    const box = document.getElementById('gmmPoolInspAddBox');
    if (box) box.style.display = 'none';
  }

  function updateDuplicateWarning(stemText) {
    const warnEl = document.getElementById('inspAdd_dupWarning');
    const setsApi = window.GmmQuestionSets;
    const target = resolveInspectingSet();
    if (!warnEl || !setsApi || typeof setsApi.findSimilarQuestions !== 'function' || !target) {
      if (warnEl) warnEl.style.display = 'none';
      return [];
    }
    const matches = setsApi.findSimilarQuestions(target.questions, stemText || '', 0.72);
    if (!matches.length) {
      warnEl.style.display = 'none';
      warnEl.innerHTML = '';
      return [];
    }
    const top = matches[0];
    const badge = top.isExact
      ? '⚠️ Trùng hoàn toàn'
      : `⚠️ Gần giống (${top.similarity}%)`;
    warnEl.style.display = 'flex';
    warnEl.innerHTML = `
      <div><strong>${badge} với Câu #${top.index + 1}:</strong> "${escHtml(top.question.slice(0, 110))}${top.question.length > 110 ? '...' : ''}"</div>
      <div class="gmm-insp-dup-actions">
        <button type="button" class="gmm-btn-ctrl secondary" style="padding:3px 9px;font-size:0.74rem;" onclick="window.GmmPoolInspector && window.GmmPoolInspector.focusQuestion(${top.index})">👁️ Xem Câu #${top.index + 1}</button>
        <button type="button" class="gmm-qset-apply-btn" style="padding:3px 9px;font-size:0.74rem;" onclick="window.GmmPoolInspector && window.GmmPoolInspector.overwriteQuestionFromAdd(${top.index})">♻️ Ghi đè lên Câu #${top.index + 1}</button>
      </div>
    `;
    return matches;
  }

  function updateAddMathPreview() {
    const prevEl = document.getElementById('inspAdd_mathPreview');
    const qEl = document.getElementById('inspAdd_q');
    const mathApi = window.GmmMathFormat;
    if (qEl) updateDuplicateWarning(qEl.value || '');
    if (!prevEl || !qEl || !mathApi || typeof mathApi.renderEditorMathPreview !== 'function') return;
    const opts = [0, 1, 2, 3].map(o => {
      const el = document.getElementById(`inspAdd_opt_${o}`);
      return el ? (el.value || '') : '';
    });
    mathApi.renderEditorMathPreview(prevEl, qEl.value || '', opts);
  }

  function focusQuestion(idx) {
    const card = document.querySelector(`.gmm-insp-item-card[data-pool-idx="${idx}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('gmm-insp-card-flash');
    setTimeout(() => card.classList.remove('gmm-insp-card-flash'), 1800);
  }

  function overwriteQuestionFromAdd(idx) {
    const setsApi = window.GmmQuestionSets;
    const qEl = document.getElementById('inspAdd_q');
    const cEl = document.getElementById('inspAdd_corr');
    const tEl = document.getElementById('inspAdd_time');
    if (!setsApi || !qEl) return;
    const opts = [0, 1, 2, 3].map(o => {
      const el = document.getElementById(`inspAdd_opt_${o}`);
      return el ? el.value : '';
    });

    const target = resolveInspectingSet();
    if (target && typeof setsApi.findSimilarQuestions === 'function') {
      const dupes = setsApi.findSimilarQuestions(target.questions, qEl.value, 0.85);
      if (dupes.length > 0) {
        const top = dupes[0];
        const okAdd = confirm(
          `Câu vừa nhập ${top.isExact ? 'TRÙNG HOÀN TOÀN' : `gần giống ${top.similarity}%`} với Câu #${top.index + 1}:\n"${top.question.slice(0, 140)}"\n\nThầy/Cô vẫn muốn thêm mới làm câu riêng chứ? (Bấm Cancel nếu muốn bấm nút "Ghi đè" ngay phía trên).`
        );
        if (!okAdd) return;
      }
    }
    const res = setsApi.updatePoolQuestionItem(inspectingSetId, idx, {
      question: qEl.value,
      options: opts,
      correct: cEl ? parseInt(cEl.value, 10) : 0,
      time: tEl ? parseInt(tEl.value, 10) : 30
    });
    if (res.ok) {
      if (res.setId && res.setId !== inspectingSetId) inspectingSetId = res.setId;
      closeAddForm();
      setsApi.renderSetsPanelUi();
      render();
      focusQuestion(idx);
      if (typeof window.showToast === 'function') {
        window.showToast(`♻️ Đã cập nhật gộp vào Câu #${idx + 1} thay vì tạo câu trùng!`, 'success');
      }
    }
  }

  function openAddForm() {
    const box = document.getElementById('gmmPoolInspAddBox');
    if (!box) return;
    const qEl = document.getElementById('inspAdd_q');
    const cEl = document.getElementById('inspAdd_corr');
    const tEl = document.getElementById('inspAdd_time');
    if (qEl) qEl.value = '';
    [0, 1, 2, 3].forEach(o => {
      const el = document.getElementById(`inspAdd_opt_${o}`);
      if (el) el.value = '';
    });
    if (cEl) cEl.value = '0';
    if (tEl) tEl.value = '30';
    box.style.display = 'block';
    updateAddMathPreview();
    if (qEl) qEl.focus();
  }

  function submitNewItem() {
    const setsApi = window.GmmQuestionSets;
    const qEl = document.getElementById('inspAdd_q');
    const cEl = document.getElementById('inspAdd_corr');
    const tEl = document.getElementById('inspAdd_time');
    if (!setsApi || !qEl || typeof setsApi.addPoolQuestionItem !== 'function') return;

    const opts = [0, 1, 2, 3].map(o => {
      const el = document.getElementById(`inspAdd_opt_${o}`);
      return el ? el.value : '';
    });

    const target = resolveInspectingSet();
    if (target && typeof setsApi.findSimilarQuestions === 'function') {
      const dupes = setsApi.findSimilarQuestions(target.questions, qEl.value, 0.85);
      if (dupes.length > 0) {
        const top = dupes[0];
        const okAdd = confirm(
          `Câu vừa nhập ${top.isExact ? 'TRÙNG HOÀN TOÀN' : `gần giống ${top.similarity}%`} với Câu #${top.index + 1}:\n"${top.question.slice(0, 140)}"\n\nThầy/Cô vẫn muốn thêm mới làm câu riêng chứ? (Bấm Cancel nếu muốn bấm nút "Ghi đè" ngay phía trên).`
        );
        if (!okAdd) return;
      }
    }

    const res = setsApi.addPoolQuestionItem(inspectingSetId, {
      question: qEl.value,
      options: opts,
      correct: cEl ? parseInt(cEl.value, 10) : 0,
      time: tEl ? parseInt(tEl.value, 10) : 30
    });

    if (!res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`⚠️ ${res.error}`, 'warning');
      return;
    }

    if (res.setId && res.setId !== inspectingSetId) inspectingSetId = res.setId;
    closeAddForm();
    setsApi.renderSetsPanelUi();
    setsApi.updateBatchPoolButton();
    render();
    const listEl = document.getElementById('gmmPoolInspList');
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
    if (typeof window.showToast === 'function') {
      const num = (res.addedIndex || 0) + 1;
      window.showToast(
        res.clonedFromBuiltin
          ? `➕ Đã tạo bản sao tự lưu và thêm Câu #${num} vào kho!`
          : `➕ Đã thêm Câu mới (#${num}) vào kho!`,
        'success'
      );
    }
  }

  function open(setId, ctx) {
    if (ctx) savedSetsCtx = ctx;
    inspectingSetId = setId || '';
    inspectorFilter = 'all';
    closeAddForm();
    setMainEditorVisibility(true);
    const searchEl = document.getElementById('gmmPoolInspSearch');
    if (searchEl) searchEl.value = '';
    document.querySelectorAll('.gmm-insp-filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.inspFilter === 'all');
    });
    render();
  }

  function close() {
    inspectingSetId = '';
    closeAddForm();
    setMainEditorVisibility(false);
  }

  function setFilterMode(mode) {
    inspectorFilter = (mode === 'seen' || mode === 'unseen') ? mode : 'all';
    document.querySelectorAll('.gmm-insp-filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.inspFilter === inspectorFilter);
    });
    render();
  }

  function refreshIfOpen(targetSetId) {
    const panel = document.getElementById('gmmPoolInspectorPanel');
    if (!panel || panel.style.display === 'none') return;
    if (!targetSetId || targetSetId === inspectingSetId) render();
  }

  function render() {
    const target = resolveInspectingSet();
    const setsApi = window.GmmQuestionSets;
    const headerTitle = document.getElementById('gmmPoolInspTitle');
    const statsEl = document.getElementById('gmmPoolInspStats');
    const listEl = document.getElementById('gmmPoolInspList');
    const cloneBtn = document.getElementById('gmmPoolInspCloneBtn');
    const drawBtn = document.getElementById('gmmPoolInspDrawBtn');
    const resetBtn = document.getElementById('gmmPoolInspResetBtn');

    if (!target || !setsApi || !listEl) return;

    const questions = Array.isArray(target.questions) ? target.questions : [];
    const seenSet = new Set(setsApi.getPoolSeenIndices(target.id));
    const seenCount = seenSet.size;
    const unseenCount = Math.max(0, questions.length - seenCount);

    if (headerTitle) headerTitle.textContent = `📦 KHO CÂU HỎI: ${target.title}`;
    if (statsEl) {
      statsEl.innerHTML = `Tổng: <strong>${questions.length} câu</strong> • ⏳ Chưa bốc: <strong style="color:#6ee7b7;">${unseenCount}</strong> • ✓ Đã bốc lượt này: <strong style="color:#fde047;">${seenCount}</strong>`;
    }
    if (cloneBtn) cloneBtn.style.display = target.isBuiltin ? 'inline-flex' : 'none';
    if (drawBtn) drawBtn.style.display = questions.length > 10 ? 'inline-flex' : 'none';
    if (resetBtn) resetBtn.style.display = (questions.length > 10 && seenCount > 0) ? 'inline-flex' : 'none';

    const query = (document.getElementById('gmmPoolInspSearch') || {}).value || '';
    const cleanQ = query.trim().toLowerCase();
    const letters = ['A', 'B', 'C', 'D'];
    const mathApi = window.GmmMathFormat;

    const filteredPairs = [];
    questions.forEach((q, idx) => {
      const isSeen = seenSet.has(idx);
      if (inspectorFilter === 'seen' && !isSeen) return;
      if (inspectorFilter === 'unseen' && isSeen) return;
      if (cleanQ) {
        const matchStem = String(q.question || '').toLowerCase().includes(cleanQ);
        const matchOpt = (q.options || []).some(o => String(o || '').toLowerCase().includes(cleanQ));
        if (!matchStem && !matchOpt) return;
      }
      filteredPairs.push({ q, idx, isSeen });
    });

    if (filteredPairs.length === 0) {
      listEl.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;">Không có câu hỏi nào khớp với bộ lọc hiện tại.</div>';
      return;
    }

    const itemsHtml = filteredPairs.map(({ q, idx, isSeen }) => {
      const statusBadge = questions.length > 10
        ? (isSeen
          ? '<span class="gmm-insp-status seen">✓ Đã bốc</span>'
          : '<span class="gmm-insp-status unseen">⏳ Chưa bốc</span>')
        : '';

      const previewHtml = (mathApi && mathApi.hasMathSyntax(q.question + ' ' + (q.options || []).join(' ')))
        ? `<div class="gmm-insp-math-preview">📐 ${escHtml(q.question)} (${letters[q.correct] || 'A'}: ${escHtml((q.options || [])[q.correct] || '')})</div>`
        : '';

      return `
        <div class="gmm-insp-item-card" data-pool-idx="${idx}">
          <div class="gmm-insp-item-head">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="gmm-insp-num">Câu #${idx + 1}</span>
              ${statusBadge}
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <select id="insp_corr_${idx}" class="gmm-qedit-input" style="width:auto;padding:4px 8px;font-size:0.78rem;">
                ${letters.map((l, cIdx) => `<option value="${cIdx}" ${Number(q.correct) === cIdx ? 'selected' : ''}>Đáp án ${l}</option>`).join('')}
              </select>
              <button type="button" class="gmm-qset-apply-btn" onclick="GiaiMaBiMat.savePoolInspectorItem(${idx})">💾 Lưu Câu</button>
              <button type="button" class="gmm-qset-del-btn" onclick="GiaiMaBiMat.deletePoolInspectorItem(${idx})" title="Xóa câu này khỏi kho">🗑️</button>
            </div>
          </div>
          <textarea id="insp_q_${idx}" class="gmm-qedit-textarea" rows="2" style="font-size:0.86rem;margin-top:6px;">${escHtml(q.question)}</textarea>
          <div class="gmm-insp-opts-grid">
            ${(q.options || ['', '', '', '']).slice(0, 4).map((opt, oIdx) => `
              <div style="display:flex;align-items:center;gap:6px;">
                <strong style="color:#fde047;width:18px;font-size:0.82rem;">${letters[oIdx]}:</strong>
                <input type="text" id="insp_opt_${idx}_${oIdx}" class="gmm-qedit-input" style="padding:6px 10px;font-size:0.82rem;" value="${escHtml(opt)}">
              </div>
            `).join('')}
          </div>
          ${previewHtml}
        </div>
      `;
    }).join('');

    listEl.innerHTML = `${itemsHtml}
      <div style="display:flex;justify-content:center;padding:8px 0 4px;">
        <button type="button" class="gmm-insp-add-btn" onclick="GiaiMaBiMat.openPoolInspectorAddForm()">➕ Thêm Câu Mới Thủ Công Vào Kho Này</button>
      </div>`;

    if (mathApi && typeof mathApi.renderMathInContainer === 'function') {
      mathApi.renderMathInContainer(listEl);
    }
  }

  function saveItem(idx) {
    const setsApi = window.GmmQuestionSets;
    const qEl = document.getElementById(`insp_q_${idx}`);
    const cEl = document.getElementById(`insp_corr_${idx}`);
    if (!setsApi || !qEl) return;

    const opts = [0, 1, 2, 3].map(o => {
      const el = document.getElementById(`insp_opt_${idx}_${o}`);
      return el ? el.value : '';
    });

    const target = resolveInspectingSet();
    const res = setsApi.updatePoolQuestionItem(inspectingSetId, idx, {
      question: qEl.value,
      options: opts,
      correct: cEl ? parseInt(cEl.value, 10) : 0,
      time: (target && target.questions[idx] && target.questions[idx].time) || 30
    });

    if (res.ok) {
      if (res.setId && res.setId !== inspectingSetId) inspectingSetId = res.setId;
      setsApi.renderSetsPanelUi();
      render();
      if (typeof window.showToast === 'function') {
        window.showToast(
          res.clonedFromBuiltin
            ? `💾 Đã tạo bản sao tự lưu và cập nhật Câu #${idx + 1}!`
            : `💾 Đã cập nhật Câu #${idx + 1} trong kho!`,
          'success'
        );
      }
    }
  }

  function deleteItem(idx) {
    const setsApi = window.GmmQuestionSets;
    if (!setsApi) return;
    if (!confirm(`Thầy/Cô có chắc muốn xóa Câu #${idx + 1} khỏi kho này không?`)) return;
    const res = setsApi.deletePoolQuestionItem(inspectingSetId, idx);
    if (!res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`⚠️ ${res.error}`, 'warning');
      return;
    }
    setsApi.renderSetsPanelUi();
    setsApi.updateBatchPoolButton();
    render();
    if (typeof window.showToast === 'function') {
      window.showToast(`🗑️ Đã xóa Câu #${idx + 1} khỏi kho.`, 'info');
    }
  }

  function cloneAsCustom() {
    const setsApi = window.GmmQuestionSets;
    const target = resolveInspectingSet();
    if (!setsApi || !target) return;
    const res = setsApi.saveTopicSet(`${target.title} (Bản sao)`, target.topic, target.questions);
    if (res.ok) {
      inspectingSetId = res.set.id;
      setsApi.renderSetsPanelUi();
      render();
      if (typeof window.showToast === 'function') {
        window.showToast(`📋 Đã tạo bản sao "${res.set.title}" để Thầy/Cô tự do chỉnh sửa!`, 'success');
      }
    }
  }

  function resetHistory() {
    if (window.GmmQuestionSets && inspectingSetId) {
      window.GmmQuestionSets.handleResetPoolHistory(inspectingSetId);
    }
  }

  function drawTen(ctx) {
    const usedCtx = ctx || savedSetsCtx;
    if (window.GmmQuestionSets && inspectingSetId && usedCtx) {
      const targetId = inspectingSetId;
      close();
      if (targetId === '__pending_import__') {
        window.GmmQuestionSets.handleDrawRandomTenFromActivePool(usedCtx);
      } else {
        window.GmmQuestionSets.handleDrawRandomTenFromSet(targetId, usedCtx);
      }
    }
  }

  window.GmmPoolInspector = {
    open,
    close,
    render,
    setFilterMode,
    refreshIfOpen,
    saveItem,
    deleteItem,
    openAddForm,
    closeAddForm,
    updateAddMathPreview,
    focusQuestion,
    overwriteQuestionFromAdd,
    submitNewItem,
    cloneAsCustom,
    resetHistory,
    drawTen
  };
})();
