/**
 * GMM Topic Question Bank & Pool Drawer Manager
 * Quản lý Ngân Hàng Bộ Đề Theo Chủ Đề (10 câu hoặc Kho lớn 30-50+ câu) trong localStorage,
 * kèm thuật toán bốc ngẫu nhiên 10 câu mới không trùng lặp qua từng lượt chơi.
 */
(function initGmmQuestionSets() {
  'use strict';

  const STORAGE_KEY_SETS = 'gmm_question_topic_sets_v1';
  const STORAGE_KEY_POOL_HISTORY = 'gmm_pool_draw_history_v1';
  const STORAGE_KEY_ACTIVE_POOL = 'gmm_active_pool_id_v1';

  let activeFilterMode = 'all';
  let pendingPoolQuestions = null;
  let pendingPoolLabel = '';
  let lastSavedCtx = null;

  const {
    escapeSafeHtml,
    normalizeQuestionItem,
    cloneQuestionsWithTemplateSlots,
    pickNonRepeatingTenIndices,
    normalizeStemForSimilarity,
    findSimilarQuestions,
    shuffleOptionsInList,
    applyBulkTimeToList,
    generateExamPaperVariants
  } = window.GmmQuestionSetHelpers;

  function getBuiltinSets() {
    return Array.isArray(window.GMM_BUILTIN_TOPIC_SETS) ? window.GMM_BUILTIN_TOPIC_SETS : [];
  }

  function loadCustomSets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(s => s && Array.isArray(s.questions) && s.questions.length > 0)
        : [];
    } catch (_e) {
      return [];
    }
  }

  function saveCustomSets(customList) {
    try {
      localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(customList));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function loadPoolHistoryMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POOL_HISTORY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function savePoolHistoryMap(map) {
    try {
      localStorage.setItem(STORAGE_KEY_POOL_HISTORY, JSON.stringify(map));
    } catch (_e) {}
  }

  function getActivePoolId() {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_POOL) || '';
    } catch (_e) {
      return '';
    }
  }

  function setActivePoolId(poolId) {
    try {
      if (poolId) localStorage.setItem(STORAGE_KEY_ACTIVE_POOL, poolId);
      else localStorage.removeItem(STORAGE_KEY_ACTIVE_POOL);
    } catch (_e) {}
  }

  function notifyServerSync(action, payload) {
    const syncApi = window.GmmServerSetsSync;
    if (syncApi && typeof syncApi.pushMutation === 'function') syncApi.pushMutation(action, payload);
  }

  function exportLocalSnapshot() {
    return { sets: loadCustomSets(), poolHistory: loadPoolHistoryMap() };
  }

  function applyServerSnapshot(nextSets, nextHistory) {
    if (Array.isArray(nextSets)) saveCustomSets(nextSets.map((s) => Object.assign({}, s, { isBuiltin: false })));
    if (nextHistory && typeof nextHistory === 'object') savePoolHistoryMap(nextHistory);
    updateBatchPoolButton();
    const panel = document.getElementById('gmmQuestionSetsPanel');
    if (panel && panel.style.display !== 'none') renderSetsPanelUi();
    if (window.GmmPoolInspector && typeof window.GmmPoolInspector.refreshIfOpen === 'function') {
      window.GmmPoolInspector.refreshIfOpen(getActivePoolId());
    }
  }

  function getAllTopicSets() {
    const customs = loadCustomSets().map(s => Object.assign({}, s, { isBuiltin: false }));
    return [...customs, ...getBuiltinSets()];
  }

  function findTopicSetById(setId) {
    return getAllTopicSets().find(s => s.id === setId) || null;
  }

  function filterTopicSets(query, filterMode) {
    const q = String(query || '').trim().toLowerCase();
    const mode = filterMode || 'all';
    return getAllTopicSets().filter(item => {
      if (mode === 'builtin' && !item.isBuiltin) return false;
      if (mode === 'custom' && item.isBuiltin) return false;
      if (!q) return true;
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.topic || '').toLowerCase().includes(q)
      );
    });
  }

  function saveTopicSet(title, topic, rawQuestions) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) return { ok: false, error: 'Thầy/Cô vui lòng nhập tên bộ đề.' };
    const cleanTopic = String(topic || '').trim() || 'Chủ đề tự chọn';
    const validList = Array.isArray(rawQuestions) ? rawQuestions.map(normalizeQuestionItem) : [];
    if (validList.length === 0) return { ok: false, error: 'Không có câu hỏi hợp lệ để lưu.' };

    const customs = loadCustomSets();
    const existingIdx = customs.findIndex(
      s => String(s.title || '').trim().toLowerCase() === cleanTitle.toLowerCase()
    );

    const payload = {
      id: existingIdx >= 0 ? customs[existingIdx].id : `custom_${Date.now()}`,
      title: cleanTitle,
      topic: cleanTopic,
      updatedAt: Date.now(),
      isBuiltin: false,
      questions: validList
    };

    if (existingIdx >= 0) customs[existingIdx] = payload;
    else customs.unshift(payload);

    const saved = saveCustomSets(customs);
    if (saved) {
      if (payload.questions.length > 10) {
        const historyMap = loadPoolHistoryMap();
        delete historyMap[payload.id];
        savePoolHistoryMap(historyMap);
        setActivePoolId(payload.id);
      }
      notifyServerSync('sync');
    }
    return saved
      ? { ok: true, set: payload, replaced: existingIdx >= 0 }
      : { ok: false, error: 'Không thể lưu vào trình duyệt (vượt giới hạn bộ nhớ localStorage).' };
  }

  function appendQuestionsToSet(setId, extraQuestions, options) {
    const customs = loadCustomSets();
    const target = customs.find(s => s.id === setId);
    if (!target) return { ok: false, error: 'Chỉ có thể gộp thêm câu hỏi vào bộ đề tự lưu.' };

    const opts = options || {};
    const nearSkipThreshold = opts.forceIncludeNear ? 101 : 88;
    const existingKeys = new Set(
      target.questions.map(q => normalizeStemForSimilarity(q && q.question))
    );
    const workingList = target.questions.slice();
    const added = [];
    let exactSkippedCount = 0;
    let nearSkippedCount = 0;
    const nearDuplicates = [];

    (extraQuestions || []).forEach(raw => {
      const norm = normalizeQuestionItem(raw);
      const key = normalizeStemForSimilarity(norm.question);
      if (!key) return;
      if (existingKeys.has(key)) {
        exactSkippedCount += 1;
        return;
      }
      const sims = findSimilarQuestions(workingList, norm.question, 0.72);
      const topMatch = sims[0];
      if (topMatch && topMatch.similarity >= nearSkipThreshold) {
        nearSkippedCount += 1;
        nearDuplicates.push({
          question: norm.question,
          matchedIndex: topMatch.index,
          matchedQuestion: topMatch.question,
          similarity: topMatch.similarity
        });
        return;
      }
      if (topMatch) {
        nearDuplicates.push({
          question: norm.question,
          matchedIndex: topMatch.index,
          matchedQuestion: topMatch.question,
          similarity: topMatch.similarity
        });
      }
      existingKeys.add(key);
      workingList.push(norm);
      added.push(norm);
    });

    if (added.length === 0) {
      return {
        ok: false,
        exactSkippedCount,
        nearSkippedCount,
        nearDuplicates,
        error: `Tất cả câu vừa nhập đều đã trùng hoặc gần giống (${exactSkippedCount} trùng khớp, ${nearSkippedCount} gần giống ≥88%) trong bộ đề này!`
      };
    }

    target.questions = target.questions.concat(added);
    target.updatedAt = Date.now();
    const ok = saveCustomSets(customs);
    if (ok) notifyServerSync('sync');
    return ok
      ? {
        ok: true,
        addedCount: added.length,
        totalCount: target.questions.length,
        exactSkippedCount,
        nearSkippedCount,
        nearDuplicates,
        set: target
      }
      : { ok: false, error: 'Lỗi lưu dữ liệu.' };
  }

  function deleteTopicSet(setId) {
    const customs = loadCustomSets();
    const filtered = customs.filter(s => s.id !== setId);
    if (filtered.length === customs.length) return false;
    if (getActivePoolId() === setId) setActivePoolId('');
    const ok = saveCustomSets(filtered);
    if (ok) notifyServerSync('delete', { id: setId });
    return ok;
  }

  function setPendingImportedPool(questions, label) {
    if (Array.isArray(questions) && questions.length > 10) {
      pendingPoolQuestions = questions.map(normalizeQuestionItem);
      pendingPoolLabel = String(label || 'file vừa nhập');
      setActivePoolId('__pending_import__');
    } else {
      pendingPoolQuestions = null;
      pendingPoolLabel = '';
    }
    updateBatchPoolButton();
  }

  function getActivePoolDescriptor() {
    const activeId = getActivePoolId();
    if (activeId === '__pending_import__' && Array.isArray(pendingPoolQuestions) && pendingPoolQuestions.length > 10) {
      return {
        id: '__pending_import__',
        title: `Kho vừa nhập (${pendingPoolLabel})`,
        questions: pendingPoolQuestions,
        isPending: true
      };
    }
    if (activeId) {
      const found = findTopicSetById(activeId);
      if (found && Array.isArray(found.questions) && found.questions.length > 10) {
        return found;
      }
    }
    if (Array.isArray(pendingPoolQuestions) && pendingPoolQuestions.length > 10) {
      return {
        id: '__pending_import__',
        title: `Kho vừa nhập (${pendingPoolLabel})`,
        questions: pendingPoolQuestions,
        isPending: true
      };
    }
    return null;
  }

  function updateBatchPoolButton() {
    const btn = document.getElementById('gmmBtnDrawPoolBatch');
    if (!btn) return;
    const activePool = getActivePoolDescriptor();
    if (!activePool) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = 'inline-flex';
    btn.textContent = `🎲 Bốc 10 Câu Mới (Kho ${activePool.questions.length} câu)`;
    btn.title = `Bốc ngẫu nhiên 10 câu chưa trùng từ "${activePool.title}"`;
  }

  function applyDrawnPoolQuestions(poolId, poolTitle, poolQuestions, ctx) {
    if (!ctx || !Array.isArray(poolQuestions) || poolQuestions.length === 0) return false;
    const historyMap = loadPoolHistoryMap();
    const prevHistory = historyMap[poolId] || [];
    const { chosenIndices, nextHistory, cycleReset, remainingUnseen } = pickNonRepeatingTenIndices(poolQuestions.length, prevHistory);

    historyMap[poolId] = nextHistory;
    savePoolHistoryMap(historyMap);
    setActivePoolId(poolId);
    notifyServerSync('history', { setId: poolId, seenIndices: nextHistory });

    const pickedRaw = chosenIndices.map(idx => poolQuestions[idx]);
    const currentSlots = ctx.getQuestionsList();
    const nextTen = cloneQuestionsWithTemplateSlots(pickedRaw, currentSlots);

    ctx.setQuestionsList(nextTen);
    ctx.gameState.editingQIndex = 0;
    ctx.saveQuestionsToStorage();
    ctx.renderQuestionEditor();
    ctx.renderQuestionUI();
    ctx.broadcastHostStateToServer();
    updateBatchPoolButton();
    renderSetsPanelUi();

    if (typeof window.showToast === 'function') {
      const cycleMsg = cycleReset
        ? 'Đã hoàn thành 1 vòng kho câu hỏi và xoay vòng lượt mới!'
        : `Còn ${remainingUnseen}/${poolQuestions.length} câu chưa bốc trong lượt.`;
      window.showToast(
        `🎲 Đã bốc 10 câu ngẫu nhiên mới từ "${poolTitle}"! (${cycleMsg})`,
        'success'
      );
    }
    return true;
  }

  function setTopicFilterMode(mode) {
    activeFilterMode = (mode === 'builtin' || mode === 'custom') ? mode : 'all';
    document.querySelectorAll('.gmm-qset-filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilterMode);
    });
    renderSetsPanelUi();
  }

  function renderSetsPanelUi() {
    const listEl = document.getElementById('gmmQuestionSetsList');
    const searchEl = document.getElementById('gmmSetSearchInput');
    const countEl = document.getElementById('gmmSetsCountBadge');
    const savePoolBtn = document.getElementById('gmmBtnSaveImportedPool');
    const inspPoolBtn = document.getElementById('gmmBtnInspectPendingPool');
    const hasPending = Boolean(pendingPoolQuestions && pendingPoolQuestions.length > 10);
    if (savePoolBtn) {
      if (hasPending) {
        savePoolBtn.style.display = 'inline-flex';
        savePoolBtn.textContent = `📦 Lưu Trọn Kho ${pendingPoolQuestions.length} Câu`;
      } else {
        savePoolBtn.style.display = 'none';
      }
    }
    if (inspPoolBtn) {
      inspPoolBtn.style.display = hasPending ? 'inline-flex' : 'none';
    }
    updateBatchPoolButton();
    if (!listEl) return;

    const query = searchEl ? searchEl.value : '';
    const items = filterTopicSets(query, activeFilterMode);
    const totalCount = getAllTopicSets().length;
    const historyMap = loadPoolHistoryMap();
    const activePoolId = getActivePoolId();
    if (countEl) countEl.textContent = `(${items.length}/${totalCount})`;

    if (items.length === 0) {
      listEl.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;padding:12px;text-align:center;">Không tìm thấy bộ đề nào khớp với từ khóa hiện tại.</div>';
      return;
    }

    listEl.innerHTML = items.map(item => {
      const totalQ = item.questions ? item.questions.length : 0;
      const isPool = totalQ > 10;
      const seenCount = isPool ? ((historyMap[item.id] && historyMap[item.id].length) || 0) : 0;
      const unseenCount = Math.max(0, totalQ - seenCount);

      const badge = item.isBuiltin
        ? '<span class="gmm-qset-badge builtin">⭐ Mẫu sẵn</span>'
        : '<span class="gmm-qset-badge custom">💾 Tự lưu</span>';
      const countBadge = isPool
        ? `<span class="gmm-qset-pool-badge">📦 Kho ${totalQ} câu • Còn ${unseenCount} chưa bốc</span>`
        : `<span class="gmm-qset-topic-tag">${totalQ} câu</span>`;

      const primaryBtn = isPool
        ? `<button type="button" class="gmm-qset-draw-btn" onclick="GiaiMaBiMat.drawRandomTenFromSetById('${escapeSafeHtml(item.id)}')">🎲 Bốc 10 Câu Mới</button>`
        : `<button type="button" class="gmm-qset-apply-btn" onclick="GiaiMaBiMat.applyTopicSetById('${escapeSafeHtml(item.id)}')">⚡ Chọn Dùng (10 câu)</button>`;

      const inspectBtn = `<button type="button" class="gmm-qset-inspect-btn" onclick="GiaiMaBiMat.openPoolInspector('${escapeSafeHtml(item.id)}')" title="Xem trước toàn bộ danh sách câu &amp; sửa nhanh chính tả trong bộ đề">👁️ Xem Kho</button>`;

      const resetBtn = (isPool && seenCount > 0)
        ? `<button type="button" class="gmm-qset-reset-btn" onclick="GiaiMaBiMat.resetPoolHistoryById('${escapeSafeHtml(item.id)}')" title="Đặt lại chu kỳ bốc về 0 từ đầu tiết học mới">↺ Reset Vòng</button>`
        : '';

      const appendBtn = item.isBuiltin
        ? ''
        : `<button type="button" class="gmm-qset-append-btn" onclick="GiaiMaBiMat.appendCurrentToTopicSet('${escapeSafeHtml(item.id)}')" title="Gộp thêm 10 câu đang soạn vào bộ đề này để tạo kho lớn 30–50 câu">➕ +10 câu</button>`;

      const delBtn = item.isBuiltin
        ? ''
        : `<button type="button" class="gmm-qset-del-btn" onclick="GiaiMaBiMat.deleteTopicSetById('${escapeSafeHtml(item.id)}')" title="Xóa bộ đề này">🗑️</button>`;

      const firstQ = item.questions && item.questions[0] ? item.questions[0].question : '';
      return `
        <div class="gmm-qset-card ${activePoolId === item.id ? 'active-pool' : ''}">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="color:#f8fafc; font-size:0.86rem;">${escapeSafeHtml(item.title)}</strong>
              ${badge}
              ${countBadge}
              <span class="gmm-qset-topic-tag">${escapeSafeHtml(item.topic || 'Tổng hợp')}</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              Câu 1: ${escapeSafeHtml(firstQ)}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0; flex-wrap:wrap;">
            ${primaryBtn}
            ${inspectBtn}
            ${resetBtn}
            ${appendBtn}
            ${delBtn}
          </div>
        </div>
      `;
    }).join('');

    if (window.GmmMathFormat && typeof window.GmmMathFormat.renderMathInContainer === 'function') {
      window.GmmMathFormat.renderMathInContainer(listEl);
    }
  }

  function toggleSetsPanelUi(forceOpen, ctx) {
    if (ctx) lastSavedCtx = ctx;
    const panel = document.getElementById('gmmQuestionSetsPanel');
    const btn = document.getElementById('gmmBtnToggleTopicSets');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
    panel.style.display = nextOpen ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', nextOpen);
    if (nextOpen) {
      const pastePanel = document.getElementById('gmmQuickPastePanel');
      if (pastePanel) pastePanel.style.display = 'none';
      const pasteBtn = document.getElementById('gmmBtnToggleQuickPaste');
      if (pasteBtn) pasteBtn.classList.remove('active');
      renderSetsPanelUi();
      if (window.GmmServerSetsSync && typeof window.GmmServerSetsSync.pullAndMerge === 'function') {
        window.GmmServerSetsSync.pullAndMerge({ silent: true });
      }
    }
  }

  function handleSaveCurrentTopicSet(ctx, usePendingPool) {
    lastSavedCtx = ctx || lastSavedCtx;
    const titleEl = document.getElementById('gmmSetTitleInput');
    const topicEl = document.getElementById('gmmSetTopicInput');
    if (!titleEl) return;

    const usePool = Boolean(usePendingPool && pendingPoolQuestions && pendingPoolQuestions.length > 10);
    if (!usePool && ctx && typeof ctx.saveCurrentEditFormToState === 'function') {
      ctx.saveCurrentEditFormToState();
    }
    const list = usePool
      ? pendingPoolQuestions
      : (ctx && typeof ctx.getQuestionsList === 'function' ? ctx.getQuestionsList() : []);

    const res = saveTopicSet(titleEl.value, topicEl ? topicEl.value : '', list);
    if (!res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`⚠️ ${res.error}`, 'warning');
      return;
    }

    titleEl.value = '';
    if (topicEl) topicEl.value = '';
    if (usePool) {
      pendingPoolQuestions = null;
      pendingPoolLabel = '';
    }
    updateBatchPoolButton();
    renderSetsPanelUi();

    if (typeof window.showToast === 'function') {
      const cnt = res.set.questions.length;
      window.showToast(
        res.replaced
          ? `✅ Đã cập nhật bộ đề "${res.set.title}" (${cnt} câu) trong Ngân hàng chủ đề!`
          : `💾 Đã lưu bộ đề "${res.set.title}" (${cnt} câu) vào Ngân hàng chủ đề!`,
        'success'
      );
    }
  }

  function handleApplyTopicSet(setId, ctx) {
    lastSavedCtx = ctx || lastSavedCtx;
    const found = findTopicSetById(setId);
    if (!found || !ctx) return;
    if (found.questions.length > 10) {
      applyDrawnPoolQuestions(found.id, found.title, found.questions, ctx);
      return;
    }
    setActivePoolId('');
    updateBatchPoolButton();
    const currentSlots = ctx.getQuestionsList();
    const nextList = cloneQuestionsWithTemplateSlots(found.questions, currentSlots);
    ctx.setQuestionsList(nextList);
    ctx.gameState.editingQIndex = 0;
    ctx.saveQuestionsToStorage();
    ctx.renderQuestionEditor();
    ctx.renderQuestionUI();
    ctx.broadcastHostStateToServer();
    renderSetsPanelUi();
    if (typeof window.showToast === 'function') {
      window.showToast(`📚 Đã nạp bộ đề "${found.title}" (10 câu) vào Trận Đấu!`, 'success');
    }
  }

  function handleDrawRandomTenFromSet(setId, ctx) {
    lastSavedCtx = ctx || lastSavedCtx;
    const found = findTopicSetById(setId);
    if (!found || !ctx) return false;
    return applyDrawnPoolQuestions(found.id, found.title, found.questions, ctx);
  }

  function handleDrawRandomTenFromActivePool(ctx) {
    lastSavedCtx = ctx || lastSavedCtx;
    const pool = getActivePoolDescriptor();
    if (!pool || !ctx) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ Thầy/Cô hãy chọn hoặc nhập một kho đề trên 10 câu trong Ngân Hàng Bộ Đề trước!', 'info');
      }
      return false;
    }
    return applyDrawnPoolQuestions(pool.id, pool.title, pool.questions, ctx);
  }

  function handleAppendCurrentToSet(setId, ctx) {
    lastSavedCtx = ctx || lastSavedCtx;
    if (ctx && typeof ctx.saveCurrentEditFormToState === 'function') {
      ctx.saveCurrentEditFormToState();
    }
    const extra = (pendingPoolQuestions && pendingPoolQuestions.length > 0)
      ? pendingPoolQuestions
      : (ctx && typeof ctx.getQuestionsList === 'function' ? ctx.getQuestionsList() : []);
    const res = appendQuestionsToSet(setId, extra);
    if (!res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`⚠️ ${res.error}`, 'warning');
      return;
    }
    setActivePoolId(setId);
    updateBatchPoolButton();
    renderSetsPanelUi();
    if (typeof window.showToast === 'function') {
      const skippedNotes = [];
      if (res.exactSkippedCount > 0) skippedNotes.push(`bỏ qua ${res.exactSkippedCount} câu trùng`);
      if (res.nearSkippedCount > 0) skippedNotes.push(`bỏ qua ${res.nearSkippedCount} câu gần giống`);
      const nearWarnCount = Array.isArray(res.nearDuplicates)
        ? res.nearDuplicates.filter(d => d.similarity < 88).length
        : 0;
      if (nearWarnCount > 0) skippedNotes.push(`lưu ý ${nearWarnCount} câu hơi tương tự`);
      const extraSuffix = skippedNotes.length > 0 ? ` (${skippedNotes.join(', ')})` : '';
      window.showToast(`➕ Đã gộp thêm ${res.addedCount} câu mới vào "${res.set.title}"${extraSuffix}. Tổng kho: ${res.totalCount} câu!`, 'success');
    }
  }

  function handleDeleteTopicSet(setId) {
    if (!confirm('Thầy/Cô có chắc muốn xóa bộ đề tự lưu này không?')) return;
    if (deleteTopicSet(setId)) {
      updateBatchPoolButton();
      renderSetsPanelUi();
      if (typeof window.showToast === 'function') {
        window.showToast('🗑️ Đã xóa bộ đề khỏi Ngân hàng chủ đề.', 'info');
      }
    }
  }

  function getPoolSeenIndices(setId) {
    const historyMap = loadPoolHistoryMap();
    return Array.isArray(historyMap[setId]) ? historyMap[setId].slice() : [];
  }

  function resetPoolHistory(setId) {
    if (!setId) return false;
    const historyMap = loadPoolHistoryMap();
    delete historyMap[setId];
    savePoolHistoryMap(historyMap);
    notifyServerSync('history', { setId, reset: true });
    return true;
  }

  function handleResetPoolHistory(setId) {
    resetPoolHistory(setId);
    renderSetsPanelUi();
    updateBatchPoolButton();
    if (window.GmmPoolInspector && typeof window.GmmPoolInspector.refreshIfOpen === 'function') {
      window.GmmPoolInspector.refreshIfOpen(setId);
    }
    if (typeof window.showToast === 'function') {
      const target = setId === '__pending_import__' ? getActivePoolDescriptor() : findTopicSetById(setId);
      const cnt = target && target.questions ? target.questions.length : 0;
      window.showToast(`↺ Đã đặt lại chu kỳ bốc về 0! Kho hiện sẵn sàng bốc lại từ đầu (${cnt} câu).`, 'info');
    }
  }

  function updatePoolQuestionItem(setId, idx, rawItem) {
    const norm = normalizeQuestionItem(rawItem);
    if (setId === '__pending_import__' && Array.isArray(pendingPoolQuestions) && pendingPoolQuestions[idx]) {
      pendingPoolQuestions[idx] = norm;
      return { ok: true, setId };
    }
    const customs = loadCustomSets();
    const found = customs.find(s => s.id === setId);
    if (found && found.questions[idx]) {
      found.questions[idx] = norm;
      found.updatedAt = Date.now();
      const ok = saveCustomSets(customs);
      if (ok) notifyServerSync('sync');
      return { ok, setId };
    }
    // If editing a built-in set, clone automatically as a custom copy so built-in data remains pristine
    const builtin = findTopicSetById(setId);
    if (!builtin) return { ok: false };
    const clonedQs = (builtin.questions || []).map(q => normalizeQuestionItem(q));
    if (!clonedQs[idx]) return { ok: false };
    clonedQs[idx] = norm;
    const saveRes = saveTopicSet(`${builtin.title} (Đã sửa)`, builtin.topic, clonedQs);
    return saveRes.ok ? { ok: true, setId: saveRes.set.id, clonedFromBuiltin: true } : { ok: false };
  }

  function deletePoolQuestionItem(setId, idx) {
    if (setId === '__pending_import__' && Array.isArray(pendingPoolQuestions)) {
      if (pendingPoolQuestions.length <= 1) return { ok: false, error: 'Kho phải có ít nhất 1 câu hỏi!' };
      pendingPoolQuestions.splice(idx, 1);
      return { ok: true, setId };
    }
    const customs = loadCustomSets();
    const found = customs.find(s => s.id === setId);
    if (found && found.questions.length > 1) {
      found.questions.splice(idx, 1);
      found.updatedAt = Date.now();
      resetPoolHistory(setId);
      const ok = saveCustomSets(customs);
      if (ok) notifyServerSync('sync');
      return { ok, setId };
    }
    return { ok: false, error: 'Không thể xóa câu cuối cùng (hoặc hãy tạo bản sao riêng trước đối với bộ mẫu sẵn).' };
  }

  function addPoolQuestionItem(setId, rawItem) {
    const norm = normalizeQuestionItem(rawItem);
    if (!norm.question) return { ok: false, error: 'Thầy/Cô vui lòng nhập nội dung câu hỏi!' };

    if (setId === '__pending_import__' && Array.isArray(pendingPoolQuestions)) {
      pendingPoolQuestions.push(norm);
      return { ok: true, setId, addedIndex: pendingPoolQuestions.length - 1 };
    }
    const customs = loadCustomSets();
    const found = customs.find(s => s.id === setId);
    if (found && Array.isArray(found.questions)) {
      found.questions.push(norm);
      found.updatedAt = Date.now();
      const ok = saveCustomSets(customs);
      if (ok) notifyServerSync('sync');
      return ok ? { ok: true, setId, addedIndex: found.questions.length - 1 } : { ok: false, error: 'Không thể lưu (vượt bộ nhớ trình duyệt).' };
    }
    const builtin = findTopicSetById(setId);
    if (!builtin) return { ok: false, error: 'Không tìm thấy bộ đề đích.' };
    const clonedQs = (builtin.questions || []).map(q => normalizeQuestionItem(q)).concat([norm]);
    const saveRes = saveTopicSet(`${builtin.title} (Đã sửa)`, builtin.topic, clonedQs);
    return saveRes.ok
      ? { ok: true, setId: saveRes.set.id, clonedFromBuiltin: true, addedIndex: clonedQs.length - 1 }
      : { ok: false, error: saveRes.error || 'Không thể lưu bản sao.' };
  }

  window.GmmQuestionSets = {
    getAllTopicSets,
    filterTopicSets,
    findTopicSetById,
    saveTopicSet,
    appendQuestionsToSet,
    findSimilarQuestions,
    deleteTopicSet,
    exportLocalSnapshot,
    applyServerSnapshot,
    cloneQuestionsWithTemplateSlots,
    pickNonRepeatingTenIndices,
    getPoolSeenIndices,
    resetPoolHistory,
    handleResetPoolHistory,
    updatePoolQuestionItem,
    deletePoolQuestionItem,
    addPoolQuestionItem,
    generateExamPaperVariants,
    setPendingImportedPool,
    getActivePoolDescriptor,
    updateBatchPoolButton,
    setTopicFilterMode,
    renderSetsPanelUi,
    toggleSetsPanelUi,
    handleSaveCurrentTopicSet,
    handleApplyTopicSet,
    handleDrawRandomTenFromSet,
    handleDrawRandomTenFromActivePool,
    handleAppendCurrentToSet,
    handleDeleteTopicSet,
    shuffleOptionsInList,
    applyBulkTimeToList
  };
})();
