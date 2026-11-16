/**
 * ==============================================================================
 * MODULE THUẬT TOÁN XỬ LÝ BỘ ĐỀ & TRỘN ĐỀ THI (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmQuestionSetHelpers.js
 * Trách nhiệm: Chuẩn hóa câu hỏi, tìm câu trùng/tương đồng, bốc 10 câu không trùng,
 * trộn phương án A/B/C/D và sinh 1-4 mã đề thi giấy (101-104).
 * ==============================================================================
 */
(function () {
  'use strict';

  function escapeSafeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeQuestionItem(q) {
    const mathApi = window.GmmMathFormat;
    const norm = (mathApi && typeof mathApi.normalizeMathNotation === 'function')
      ? mathApi.normalizeMathNotation
      : (s) => String(s || '');
    const opts = Array.isArray(q && q.options) ? q.options.slice(0, 4) : ['', '', '', ''];
    while (opts.length < 4) opts.push('');
    return {
      question: norm(String((q && q.question) || '').trim()),
      options: opts.map(o => norm(String(o || '').trim())),
      correct: Math.max(0, Math.min(3, parseInt(q && q.correct, 10) || 0)),
      time: Math.max(5, Math.min(180, parseInt(q && q.time, 10) || 30))
    };
  }

  function cloneQuestionsWithTemplateSlots(rawQuestions, templateSlots) {
    const slots = Array.isArray(templateSlots) ? templateSlots : [];
    const src = Array.isArray(rawQuestions) ? rawQuestions : [];
    const letters = ['A', 'B', 'C', 'D'];
    if (src.length === 0) return [];
    const result = [];
    for (let i = 0; i < 10; i++) {
      const item = src[i % src.length] || {};
      const slot = slots[i] || {};
      const opts = Array.isArray(item.options) ? item.options.slice(0, 4) : [];
      while (opts.length < 4) opts.push(`Phương án ${letters[opts.length] || 'D'}`);
      result.push({
        id: i + 1,
        question: String(item.question || `Câu hỏi ${i + 1}`),
        options: opts.map(o => String(o || '')),
        correct: Math.max(0, Math.min(3, parseInt(item.correct, 10) || 0)),
        time: Math.max(5, Math.min(180, parseInt(item.time, 10) || 30)),
        coordinate: slot.coordinate || `Mã ${i + 1}${letters[i % 4]}`,
        regionId: slot.regionId || `code_${i + 1}${letters[i % 4]}`,
        regionName: slot.regionName || `Mảng ${i + 1}`
      });
    }
    return result;
  }

  function shuffleArrayFisherYates(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * Bốc ngẫu nhiên đúng 10 chỉ số không trùng lặp từ kho N > 10 câu.
   * Ưu tiên các câu chưa từng bốc trong chu kỳ hiện tại trước khi xoay vòng mới.
   */
  function pickNonRepeatingTenIndices(poolLength, seenHistory) {
    const total = Math.max(0, parseInt(poolLength, 10) || 0);
    if (total <= 10) {
      return {
        chosenIndices: Array.from({ length: total }, (_, i) => i),
        nextHistory: [],
        cycleReset: false,
        remainingUnseen: 0
      };
    }

    const validSeen = new Set(
      (Array.isArray(seenHistory) ? seenHistory : []).filter(idx => Number.isInteger(idx) && idx >= 0 && idx < total)
    );
    const unseen = [];
    for (let i = 0; i < total; i++) {
      if (!validSeen.has(i)) unseen.push(i);
    }

    const shuffledUnseen = shuffleArrayFisherYates(unseen);
    if (shuffledUnseen.length >= 10) {
      const chosen = shuffledUnseen.slice(0, 10);
      chosen.forEach(idx => validSeen.add(idx));
      return {
        chosenIndices: chosen,
        nextHistory: Array.from(validSeen),
        cycleReset: false,
        remainingUnseen: total - validSeen.size
      };
    }

    const chosenSet = new Set(shuffledUnseen);
    const allOther = [];
    for (let i = 0; i < total; i++) {
      if (!chosenSet.has(i)) allOther.push(i);
    }
    const extra = shuffleArrayFisherYates(allOther).slice(0, 10 - shuffledUnseen.length);
    const chosenIndices = [...shuffledUnseen, ...extra];

    return {
      chosenIndices,
      nextHistory: extra.slice(),
      cycleReset: true,
      remainingUnseen: Math.max(0, total - extra.length)
    };
  }

  function normalizeStemForSimilarity(text) {
    return String(text || '')
      .replace(/\$+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase()
      .replace(/^(câu|bai)\s*\d+\s*[:.)-]?\s*/i, '')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function computeStemSimilarity(a, b) {
    const na = normalizeStemForSimilarity(a);
    const nb = normalizeStemForSimilarity(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if ((na.includes(nb) || nb.includes(na)) && Math.min(na.length, nb.length) >= 16) {
      return 0.9;
    }
    const tokensA = na.split(' ').filter(t => t.length > 1);
    const tokensB = nb.split(' ').filter(t => t.length > 1);
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let intersect = 0;
    setA.forEach(tok => { if (setB.has(tok)) intersect += 1; });
    const tokenDice = (setA.size + setB.size) > 0 ? (2 * intersect) / (setA.size + setB.size) : 0;

    const getBigrams = (s) => {
      const compact = s.replace(/\s+/g, '');
      const list = [];
      for (let i = 0; i < compact.length - 1; i++) list.push(compact.slice(i, i + 2));
      return list;
    };
    const biA = getBigrams(na);
    const biB = getBigrams(nb);
    if (biA.length === 0 || biB.length === 0) return tokenDice;
    const freqB = {};
    biB.forEach(bg => { freqB[bg] = (freqB[bg] || 0) + 1; });
    let biHit = 0;
    biA.forEach(bg => {
      if (freqB[bg] > 0) {
        biHit += 1;
        freqB[bg] -= 1;
      }
    });
    const bigramDice = (2 * biHit) / (biA.length + biB.length);
    return Math.max(tokenDice, bigramDice);
  }

  function findSimilarQuestions(existingList, candidateStem, threshold) {
    const minSim = typeof threshold === 'number' ? threshold : 0.72;
    const normCand = normalizeStemForSimilarity(candidateStem);
    if (!normCand || normCand.length < 6 || !Array.isArray(existingList)) return [];

    const matches = [];
    existingList.forEach((item, index) => {
      const stem = String((item && item.question) || '').trim();
      if (!stem) return;
      const similarity = computeStemSimilarity(candidateStem, stem);
      if (similarity >= minSim) {
        matches.push({
          index,
          question: stem,
          similarity: Math.round(similarity * 100),
          isExact: similarity >= 0.995
        });
      }
    });
    matches.sort((x, y) => y.similarity - x.similarity);
    return matches.slice(0, 3);
  }

  function shuffleOptionsInList(list) {
    if (!Array.isArray(list) || list.length === 0) return { shuffledCount: 0, skippedCount: 0 };
    const orderDependentRe = /(cả\s+[abcd]|tất\s+cả\s+các\s+(?:đáp\s+án|phương\s+án|ý)|cả\s+(?:2|hai|ba|3|bốn)\s+(?:ý|phương\s+án)|không\s+có\s+(?:đáp\s+án|phương\s+án)\s+nào\s+(?:đúng|sai)|tất\s+cả\s+đều\s+(?:đúng|sai))/i;
    let shuffledCount = 0;
    let skippedCount = 0;
    list.forEach(q => {
      if (!q || !Array.isArray(q.options) || q.options.length < 4) return;
      if (q.options.some(opt => orderDependentRe.test(String(opt || '')))) {
        skippedCount++;
        return;
      }
      const origCorrect = Math.max(0, Math.min(3, parseInt(q.correct, 10) || 0));
      const pairs = q.options.slice(0, 4).map((text, idx) => ({ text, isCorrect: idx === origCorrect }));
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pairs[i];
        pairs[i] = pairs[j];
        pairs[j] = tmp;
      }
      q.options = pairs.map(p => p.text);
      const nextIdx = pairs.findIndex(p => p.isCorrect);
      q.correct = nextIdx >= 0 ? nextIdx : 0;
      shuffledCount++;
    });
    return { shuffledCount, skippedCount };
  }

  function applyBulkTimeToList(list, seconds) {
    const sec = Math.max(5, Math.min(180, parseInt(seconds, 10) || 30));
    if (Array.isArray(list)) {
      list.forEach(q => {
        if (q) q.time = sec;
      });
    }
    return sec;
  }

  /**
   * Sinh 1-4 Mã đề thi giấy trắc nghiệm trộn sẵn (Mã 101-104) từ Kho lớn hoặc bộ hiện tại.
   */
  function generateExamPaperVariants(sourcePool, fallbackTen, variantCount, questionsPerVariant) {
    const count = Math.max(1, Math.min(4, parseInt(variantCount, 10) || 1));
    const pool = (Array.isArray(sourcePool) && sourcePool.length > 0)
      ? sourcePool
      : (Array.isArray(fallbackTen) ? fallbackTen : []);
    if (pool.length === 0) return [];

    const rawTarget = (questionsPerVariant === 'all' || questionsPerVariant === Infinity)
      ? pool.length
      : (parseInt(questionsPerVariant, 10) || 10);
    const targetCount = Math.max(1, Math.min(pool.length, rawTarget));

    const letters = ['A', 'B', 'C', 'D'];
    const cloneClean = (raw) => {
      const opts = Array.isArray(raw && raw.options) ? raw.options.slice(0, 4) : ['', '', '', ''];
      while (opts.length < 4) opts.push(`Phương án ${letters[opts.length] || 'D'}`);
      return {
        question: String((raw && raw.question) || ''),
        options: opts.map(o => String(o || '')),
        correct: Math.max(0, Math.min(3, parseInt(raw && raw.correct, 10) || 0)),
        time: parseInt(raw && raw.time, 10) || 30
      };
    };

    let cursorPool = shuffleArrayFisherYates(pool.map((_, idx) => idx));
    const variants = [];

    for (let v = 0; v < count; v++) {
      const code = String(101 + v);
      let pickedIndices = [];
      if (pool.length <= targetCount) {
        pickedIndices = shuffleArrayFisherYates(pool.map((_, idx) => idx)).slice(0, targetCount);
      } else if (cursorPool.length >= targetCount) {
        pickedIndices = cursorPool.slice(0, targetCount);
        cursorPool = cursorPool.slice(targetCount);
      } else {
        pickedIndices = cursorPool.slice();
        const need = targetCount - pickedIndices.length;
        const usedSet = new Set(pickedIndices);
        const rest = shuffleArrayFisherYates(pool.map((_, i) => i).filter(i => !usedSet.has(i)));
        pickedIndices = pickedIndices.concat(rest.slice(0, need));
        cursorPool = rest.slice(need);
      }

      const variantQuestions = pickedIndices.slice(0, targetCount).map(idx => cloneClean(pool[idx]));
      shuffleOptionsInList(variantQuestions);
      variants.push({
        code,
        sourceCount: pool.length,
        questionCount: variantQuestions.length,
        questions: variantQuestions
      });
    }

    return variants;
  }

  window.GmmQuestionSetHelpers = {
    escapeSafeHtml,
    normalizeQuestionItem,
    cloneQuestionsWithTemplateSlots,
    shuffleArrayFisherYates,
    pickNonRepeatingTenIndices,
    normalizeStemForSimilarity,
    computeStemSimilarity,
    findSimilarQuestions,
    shuffleOptionsInList,
    applyBulkTimeToList,
    generateExamPaperVariants
  };
})();
