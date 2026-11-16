/**
 * GMM Multi-Variant Exam Paper Print Builder
 * Sinh 1–4 Mã đề thi trắc nghiệm giấy trộn sẵn (Mã 101, 102, 103, 104) từ Kho 30–50+ câu
 * với số câu linh hoạt (10, 15, 20 hoặc toàn bộ kho) kèm Bảng Đáp Án Đối Chiếu chấm bài cho Giáo viên.
 */
(function initGmmExamVariantsPrint() {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const ORDER_DEP_RE = /(cả\s+[abcd]|tất\s+cả\s+các\s+(?:đáp\s+án|phương\s+án|ý)|cả\s+(?:2|hai|ba|3|bốn)\s+(?:ý|phương\s+án)|không\s+có\s+(?:đáp\s+án|phương\s+án)\s+nào\s+(?:đúng|sai)|tất\s+cả\s+đều\s+(?:đúng|sai))/i;

  const VARIANT_PRINT_CSS = `
    .variant-badge-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      background: #0f172a;
      color: #ffffff;
      font-weight: 900;
      font-size: 10pt;
      letter-spacing: 0.6px;
    }
    .variant-key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2.5mm;
      font-size: 8.6pt;
    }
    .variant-key-table th,
    .variant-key-table td {
      border: 1px solid #94a3b8;
      padding: 1.8mm 1.2mm;
      text-align: center;
    }
    .variant-key-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
    }
    .variant-key-letter {
      font-weight: 900;
      font-size: 10pt;
      color: #b91c1c;
    }
    .variant-detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2.5mm;
      margin-top: 3mm;
    }
    .variant-detail-box {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 2mm 2.5mm;
      background: #f8fafc;
      font-size: 7.4pt;
      line-height: 1.3;
      break-inside: avoid;
    }
    .variant-detail-box h4 {
      margin: 0 0 1.2mm 0;
      font-size: 8.5pt;
      color: #0f172a;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 0.8mm;
    }
    .bubble-a4-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      flex: 1;
      align-items: stretch;
      position: relative;
    }
    .bubble-a4-split::after {
      content: "✂ Đường cắt đôi thành 2 phiếu A5";
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-90deg);
      font-size: 7pt;
      color: #64748b;
      background: #ffffff;
      padding: 1mm 2.5mm;
      border: 1px dashed #94a3b8;
      border-radius: 999px;
      white-space: nowrap;
      pointer-events: none;
    }
    .bubble-a5-card {
      border: 1.5px solid #0f172a;
      border-radius: 5px;
      padding: 3.5mm 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      position: relative;
    }
    .bubble-a5-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 3mm;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 2mm;
    }
    .bubble-a5-title {
      font-size: 9.8pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1.25;
    }
    .bubble-a5-sub {
      font-size: 7.4pt;
      color: #475569;
      margin-top: 0.8mm;
    }
    .bubble-a5-codebox {
      border: 1.6px solid #0f172a;
      border-radius: 4px;
      padding: 1.2mm 2.5mm;
      text-align: center;
      min-width: 24mm;
      background: #f8fafc;
    }
    .bubble-a5-codebox strong {
      display: block;
      font-size: 7.2pt;
      color: #0f172a;
    }
    .bubble-a5-codebox span {
      display: block;
      margin-top: 1.2mm;
      font-size: 11pt;
      letter-spacing: 2px;
      color: #64748b;
    }
    .bubble-a5-student {
      font-size: 8.2pt;
      line-height: 1.55;
      padding: 2mm 0;
      border-bottom: 1px dashed #cbd5e1;
    }
    .bubble-a5-grid {
      display: grid;
      gap: 2.5mm;
      margin: 2.5mm 0;
      flex: 1;
      align-content: start;
    }
    .bubble-a5-col {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 1.5mm 2mm;
      background: #f8fafc;
    }
    .bubble-a5-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.1mm 0;
      border-bottom: 1px dotted #e2e8f0;
      font-size: 8pt;
    }
    .bubble-a5-row:last-child {
      border-bottom: none;
    }
    .bubble-qnum {
      font-weight: 900;
      color: #0f172a;
      min-width: 7mm;
    }
    .bubble-circles {
      display: flex;
      gap: 2mm;
      align-items: center;
    }
    .bubble-circle {
      width: 4.4mm;
      height: 4.4mm;
      border-radius: 50%;
      border: 1.2px solid #0f172a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 6.8pt;
      font-weight: 800;
      color: #0f172a;
      background: #ffffff;
    }
    .bubble-a5-foot {
      border-top: 1px solid #94a3b8;
      padding-top: 1.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.4pt;
      color: #334155;
      gap: 2mm;
    }
    .bubble-score-box {
      border: 1.2px solid #0f172a;
      border-radius: 4px;
      padding: 1.2mm 3mm;
      font-weight: 900;
      font-size: 8.5pt;
      color: #b91c1c;
      white-space: nowrap;
    }
  `;

  function buildKeyTablesHtml(variants, maxQ, esc) {
    const chunkSize = 15;
    const chunks = [];
    for (let start = 0; start < maxQ; start += chunkSize) {
      const end = Math.min(maxQ, start + chunkSize);
      const headerCols = Array.from({ length: end - start }, (_, i) => `<th>C${start + i + 1}</th>`).join('');
      const rows = variants.map((v, vIdx) => {
        const cells = [];
        for (let q = start; q < end; q++) {
          const item = v.questions[q];
          cells.push(`<td class="variant-key-letter">${item ? (LETTERS[item.correct] || 'A') : '-'}</td>`);
        }
        return `
          <tr class="variant-key-row" data-variant-index="${vIdx}">
            <td style="font-weight:900;background:#f1f5f9;white-space:nowrap;">Mã ${esc(v.code)}</td>
            ${cells.join('')}
          </tr>
        `;
      }).join('');
      chunks.push(`
        <table class="variant-key-table">
          <thead><tr><th>Mã Đề</th>${headerCols}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `);
    }
    return chunks.join('');
  }

  function renderVariantsMarkup(params) {
    const { variants, schoolHtml, logoUrl, puzzleTitle, esc, renderQuestionStem, renderOptionText } = params;
    if (!variants.length) return '';

    const maxQ = variants.reduce((m, v) => Math.max(m, (v.questions || []).length), 0);

    const variantPagesHtml = variants.map((v, vIdx) => {
      const cardsHtml = v.questions.map((q, qIdx) => {
        const optsArr = Array.isArray(q.optionHtmls) ? q.optionHtmls : (q.options || []);
        const optsHtml = optsArr.map((optVal, oIdx) => {
          const letter = LETTERS[oIdx] || String(oIdx + 1);
          return `
            <div class="q-opt-item">
              <span class="q-opt-box">${letter}.</span>
              <span>${renderOptionText(optVal)}</span>
            </div>
          `;
        }).join('');
        return `
          <div class="q-card-print">
            <div class="q-card-top">
              <span class="q-num-tag">CÂU ${qIdx + 1}</span>
              <span class="q-blank-pill">Khoanh tròn 1 đáp án đúng</span>
            </div>
            <div class="q-stem-text">${renderQuestionStem(q)}</div>
            <div class="q-opts-grid">${optsHtml}</div>
          </div>
        `;
      }).join('');

      return `
        <section class="bundle-page auto-height-page sec-exam-variant-page hidden-sec" data-variant-index="${vIdx}">
          <header class="doc-header">
            <div class="doc-org">
              ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
              <div>${schoolHtml}</div>
            </div>
            <div class="doc-title-center">
              <h1>PHIẾU ĐỀ KIỂM TRA TRẮC NGHIỆM — <span class="variant-badge-pill">MÃ ĐỀ ${esc(v.code)}</span></h1>
              <div class="doc-sub">Gồm ${v.questions.length} câu (Nguồn kho ${v.sourceCount} câu • Độc lập với tranh tô)</div>
            </div>
            <div class="doc-team-badge">
              HỌ VÀ TÊN: .......................<br>
              <span>LỚP: ........... • ĐIỂM: ....../${v.questions.length}</span>
            </div>
          </header>

          <div class="quiz-two-col-grid">${cardsHtml}</div>

          <footer class="doc-footer">
            <span>* Học sinh giữ đúng số Mã đề <strong>${esc(v.code)}</strong> khi nộp bài để đối chiếu đáp án chính xác.</span>
            <span>Chủ đề: ${esc(puzzleTitle)}</span>
          </footer>
        </section>
      `;
    }).join('');

    const keyTablesHtml = buildKeyTablesHtml(variants, maxQ, esc);

    const keyDetailBoxes = variants.map((v, vIdx) => {
      const lines = v.questions.map((q, idx) => {
        const l = LETTERS[q.correct] || 'A';
        const optsArr = Array.isArray(q.optionHtmls) ? q.optionHtmls : (q.options || []);
        const ansVal = optsArr[q.correct] || '';
        return `<div><strong>C${idx + 1}: ${l}</strong> — ${renderOptionText(ansVal)}</div>`;
      }).join('');
      return `
        <div class="variant-detail-box" data-variant-index="${vIdx}">
          <h4>🔑 Chi tiết Đáp án — Mã đề ${esc(v.code)} (${v.questions.length} câu)</h4>
          ${lines}
        </div>
      `;
    }).join('');

    const answerKeyPageHtml = `
      <section id="secExamVariantsKeyPage" class="bundle-page auto-height-page hidden-sec">
        <header class="doc-header" style="border-bottom-color:#0f766e;">
          <div class="doc-org" style="color:#0f766e;">
            ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
            <div>${schoolHtml}<br><span>TÀI LIỆU CHẤM BÀI GIÁO VIÊN</span></div>
          </div>
          <div class="doc-title-center">
            <h1 style="color:#0f766e;">BẢNG ĐÁP ÁN ĐỐI CHIẾU CÁC MÃ ĐỀ TRỘN (${maxQ} CÂU)</h1>
            <div class="doc-sub">Dùng để chấm nhanh các Phiếu Đề Thi Giấy nhiều mã đề • Chủ đề: ${esc(puzzleTitle)}</div>
          </div>
          <div class="doc-team-badge" style="border-color:#0f766e;background:#f0fdfa;color:#115e59;">
            ĐÁP ÁN CHUẨN<br>${variants.length} MÃ ĐỀ
          </div>
        </header>

        ${keyTablesHtml}

        <div class="variant-detail-grid">${keyDetailBoxes}</div>

        <footer class="doc-footer">
          <span>✔ Mỗi mã đề đã được trộn ngẫu nhiên thứ tự câu hỏi và xáo trộn phương án A/B/C/D độc lập với bảng mã màu tô tranh.</span>
          <span>Gói học liệu đồng bộ — Lớp Học Vui Nhộn</span>
        </footer>
      </section>
    `;

    const bubblePageHtml = buildBubbleSheetPageHtml({
      questionCount: maxQ,
      schoolHtml,
      logoUrl,
      titleText: puzzleTitle,
      esc
    });

    return `${variantPagesHtml}\n${answerKeyPageHtml}\n${bubblePageHtml}`;
  }

  function buildBubbleSheetPageHtml(opts) {
    const qCount = Math.max(1, parseInt(opts && opts.questionCount, 10) || 10);
    const esc = (opts && opts.esc) || ((s) => String(s == null ? '' : s));
    const colsCount = qCount <= 16 ? 2 : (qCount <= 36 ? 3 : 4);
    const perCol = Math.ceil(qCount / colsCount);

    let colsHtml = '';
    for (let c = 0; c < colsCount; c++) {
      const startQ = c * perCol;
      const endQ = Math.min(qCount, startQ + perCol);
      let rows = '';
      for (let q = startQ; q < endQ; q++) {
        const circles = LETTERS.map((l) => `<span class="bubble-circle">${l}</span>`).join('');
        rows += `<div class="bubble-a5-row"><span class="bubble-qnum">C${q + 1}</span><div class="bubble-circles">${circles}</div></div>`;
      }
      if (rows) colsHtml += `<div class="bubble-a5-col">${rows}</div>`;
    }

    const singleCard = `
      <div class="bubble-a5-card">
        <div>
          <div class="bubble-a5-head">
            <div>
              <div class="bubble-a5-title">PHIẾU TRẢ LỜI TRẮC NGHIỆM (A5)</div>
              <div class="bubble-a5-sub">${opts.schoolHtml || ''} • ${esc(opts.titleText || '')}</div>
            </div>
            <div class="bubble-a5-codebox">
              <strong>MÃ ĐỀ</strong>
              <span>[ ____ ]</span>
            </div>
          </div>
          <div class="bubble-a5-student">
            Họ và tên: .................................................... Lớp: .......... SBD: ..........
          </div>
        </div>
        <div class="bubble-a5-grid" style="grid-template-columns: repeat(${colsCount}, 1fr);">
          ${colsHtml}
        </div>
        <div class="bubble-a5-foot">
          <span>* Tô kín 1 chữ cái đúng. Giữ nguyên tờ đề giấy dùng chung cho tiết sau.</span>
          <span class="bubble-score-box">ĐIỂM: ...... / ${qCount}</span>
        </div>
      </div>
    `;

    return `
      <section id="secBubbleSheetA5" class="bundle-page sec-bubble-a5-page hidden-sec">
        <div class="bubble-a4-split">${singleCard}${singleCard}</div>
      </section>
    `;
  }

  function buildVariantExamPagesHtml(opts) {
    const setsApi = window.GmmQuestionSets;
    if (!setsApi || typeof setsApi.generateExamPaperVariants !== 'function') {
      return '';
    }
    const variants = setsApi.generateExamPaperVariants(
      opts.sourcePool,
      opts.fallbackQuestions,
      4,
      opts.questionsPerVariant || 10
    );
    if (!variants.length) return '';

    return renderVariantsMarkup({
      variants,
      schoolHtml: opts.schoolHtml,
      logoUrl: opts.logoUrl,
      puzzleTitle: opts.puzzleTitle,
      esc: opts.escFn,
      renderQuestionStem: (q) => opts.renderMathFn(q.question),
      renderOptionText: (txt) => opts.renderMathFn(txt)
    });
  }

  /**
   * Chuẩn bị dữ liệu câu hỏi đã render KaTeX sẵn + text gốc cho Word Export và mã JS chạy trong cửa sổ in.
   */
  function buildPopupVariantClientPayload(sourcePool, fallbackQuestions, renderMathFn) {
    const src = (Array.isArray(sourcePool) && sourcePool.length > 0)
      ? sourcePool
      : (Array.isArray(fallbackQuestions) ? fallbackQuestions : []);
    return src.map((q) => {
      const opts = Array.isArray(q && q.options) ? q.options.slice(0, 4) : ['', '', '', ''];
      while (opts.length < 4) opts.push(`Phương án ${LETTERS[opts.length] || 'D'}`);
      const rawQuestion = String((q && q.question) || '');
      const rawOptions = opts.map((txt) => String(txt || ''));
      const hasOrderDep = rawOptions.some((txt) => ORDER_DEP_RE.test(txt));
      return {
        rawQuestion,
        rawOptions,
        questionHtml: renderMathFn(rawQuestion),
        optionHtmls: rawOptions.map((txt) => renderMathFn(txt)),
        correct: Math.max(0, Math.min(3, parseInt(q && q.correct, 10) || 0)),
        skipShuffle: hasOrderDep
      };
    });
  }

  function buildPopupVariantSetsPayload(setsList, renderMathFn) {
    return (Array.isArray(setsList) ? setsList : [])
      .filter((s) => s && Array.isArray(s.questions) && s.questions.length > 0)
      .map((s) => ({
        id: String(s.id || ''),
        title: String(s.title || 'Bộ câu hỏi'),
        topic: String(s.topic || ''),
        items: buildPopupVariantClientPayload(s.questions, [], renderMathFn)
      }));
  }

  function getPopupRebuildScript(meta) {
    const fallbackSets = [{
      id: '__current__',
      title: meta.puzzleTitle || 'Bộ đề hiện tại',
      topic: '',
      items: meta.preRenderedPool || []
    }];
    const allSets = (Array.isArray(meta.preRenderedSets) && meta.preRenderedSets.length > 0)
      ? meta.preRenderedSets
      : fallbackSets;

    return `
      var RAW_VARIANT_SETS = ${JSON.stringify(allSets)};
      var VARIANT_SCHOOL_HTML = ${JSON.stringify(meta.schoolHtml)};
      var VARIANT_SCHOOL_NAME = ${JSON.stringify(meta.schoolName || 'TRƯỜNG THCS TÂN HẢI')};
      var VARIANT_LOGO_URL = ${JSON.stringify(meta.logoUrl)};
      var VARIANT_PUZZLE_TITLE = ${JSON.stringify(meta.puzzleTitle)};
      var LETTERS = ['A', 'B', 'C', 'D'];
      var LATEST_BUILT_VARIANTS = [];
      var LATEST_BUILT_SET_TITLE = VARIANT_PUZZLE_TITLE;

      function escPopupHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function shuffleArrPopup(arr) {
        var copy = arr.slice();
        for (var i = copy.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
        }
        return copy;
      }

      function getSelectedVariantSetObj() {
        var selEl = document.getElementById('selExamSourceSet');
        var targetId = selEl ? selEl.value : '';
        var found = RAW_VARIANT_SETS.find(function(s) { return s.id === targetId; });
        return found || RAW_VARIANT_SETS[0] || { id: '', title: VARIANT_PUZZLE_TITLE, items: [] };
      }

      function syncSourceSetCountOptionLabel() {
        var setObj = getSelectedVariantSetObj();
        var cntSel = document.getElementById('selExamQuestionCount');
        if (!cntSel || !setObj) return;
        var allOpt = cntSel.querySelector('option[value="all"]');
        if (allOpt) {
          allOpt.textContent = 'Toàn bộ kho (' + (setObj.items ? setObj.items.length : 0) + ' câu)';
        }
      }

      function generatePopupVariants(vCount, qMode) {
        var setObj = getSelectedVariantSetObj();
        var pool = (setObj && setObj.items) ? setObj.items : [];
        if (!pool.length) return [];
        var rawTarget = (qMode === 'all') ? pool.length : (parseInt(qMode, 10) || 10);
        var targetCount = Math.max(1, Math.min(pool.length, rawTarget));
        var cursorPool = shuffleArrPopup(pool.map(function(_, idx) { return idx; }));
        var out = [];

        for (var v = 0; v < vCount; v++) {
          var code = String(101 + v);
          var picked = [];
          if (pool.length <= targetCount) {
            picked = shuffleArrPopup(pool.map(function(_, idx) { return idx; })).slice(0, targetCount);
          } else if (cursorPool.length >= targetCount) {
            picked = cursorPool.slice(0, targetCount);
            cursorPool = cursorPool.slice(targetCount);
          } else {
            picked = cursorPool.slice();
            var need = targetCount - picked.length;
            var used = {};
            picked.forEach(function(id) { used[id] = true; });
            var rest = shuffleArrPopup(pool.map(function(_, i) { return i; }).filter(function(i) { return !used[i]; }));
            picked = picked.concat(rest.slice(0, need));
            cursorPool = rest.slice(need);
          }

          var qs = picked.slice(0, targetCount).map(function(idx) {
            var src = pool[idx];
            var optHtmls = src.optionHtmls.slice();
            var rawOpts = (src.rawOptions || []).slice();
            var correctIdx = src.correct;
            if (!src.skipShuffle && optHtmls.length >= 4) {
              var pairs = optHtmls.map(function(h, oi) {
                return { h: h, r: rawOpts[oi] || '', c: oi === correctIdx };
              });
              pairs = shuffleArrPopup(pairs);
              optHtmls = pairs.map(function(p) { return p.h; });
              rawOpts = pairs.map(function(p) { return p.r; });
              correctIdx = pairs.findIndex(function(p) { return p.c; });
              if (correctIdx < 0) correctIdx = 0;
            }
            return {
              rawQuestion: src.rawQuestion || '',
              rawOptions: rawOpts,
              questionHtml: src.questionHtml,
              optionHtmls: optHtmls,
              correct: correctIdx
            };
          });
          out.push({ code: code, sourceCount: pool.length, questions: qs });
        }
        return out;
      }

      function buildPopupBubblePageHtml(qCount, sourceTitle) {
        var colsCount = qCount <= 16 ? 2 : (qCount <= 36 ? 3 : 4);
        var perCol = Math.ceil(qCount / colsCount);
        var colsHtml = '';
        for (var c = 0; c < colsCount; c++) {
          var startQ = c * perCol;
          var endQ = Math.min(qCount, startQ + perCol);
          var rows = '';
          for (var q = startQ; q < endQ; q++) {
            var circles = LETTERS.map(function(l) { return '<span class="bubble-circle">' + l + '</span>'; }).join('');
            rows += '<div class="bubble-a5-row"><span class="bubble-qnum">C' + (q + 1) + '</span><div class="bubble-circles">' + circles + '</div></div>';
          }
          if (rows) colsHtml += '<div class="bubble-a5-col">' + rows + '</div>';
        }
        var card = '<div class="bubble-a5-card">' +
          '<div><div class="bubble-a5-head"><div><div class="bubble-a5-title">PHIẾU TRẢ LỜI TRẮC NGHIỆM (A5)</div>' +
          '<div class="bubble-a5-sub">' + VARIANT_SCHOOL_HTML + ' • ' + escPopupHtml(sourceTitle) + '</div></div>' +
          '<div class="bubble-a5-codebox"><strong>MÃ ĐỀ</strong><span>[ ____ ]</span></div></div>' +
          '<div class="bubble-a5-student">Họ và tên: .................................................... Lớp: .......... SBD: ..........</div></div>' +
          '<div class="bubble-a5-grid" style="grid-template-columns: repeat(' + colsCount + ', 1fr);">' + colsHtml + '</div>' +
          '<div class="bubble-a5-foot"><span>* Tô kín 1 chữ cái đúng. Giữ nguyên tờ đề giấy dùng chung cho tiết sau.</span>' +
          '<span class="bubble-score-box">ĐIỂM: ...... / ' + qCount + '</span></div></div>';
        return '<section id="secBubbleSheetA5" class="bundle-page sec-bubble-a5-page hidden-sec"><div class="bubble-a4-split">' + card + card + '</div></section>';
      }

      function rebuildVariantDomFromControls() {
        var root = document.getElementById('examVariantsDynamicRoot');
        if (!root) return;
        syncSourceSetCountOptionLabel();
        var setObj = getSelectedVariantSetObj();
        var sourceTitle = (setObj && setObj.title) ? setObj.title : VARIANT_PUZZLE_TITLE;
        var vCount = Math.max(1, Math.min(4, parseInt(document.getElementById('selExamPaperVariants').value, 10) || 1));
        var qMode = document.getElementById('selExamQuestionCount').value || '10';
        var variants = generatePopupVariants(4, qMode);
        if (!variants.length) {
          LATEST_BUILT_VARIANTS = [];
          root.innerHTML = '';
          return;
        }
        LATEST_BUILT_VARIANTS = variants.slice(0, vCount);
        LATEST_BUILT_SET_TITLE = sourceTitle;

        var maxQ = variants.reduce(function(m, v) { return Math.max(m, v.questions.length); }, 0);
        var logoHtml = VARIANT_LOGO_URL ? '<img src="' + escPopupHtml(VARIANT_LOGO_URL) + '" alt="Logo" class="doc-logo" />' : '';

        var pagesHtml = variants.map(function(v, vIdx) {
          var cards = v.questions.map(function(q, qIdx) {
            var optsHtml = q.optionHtmls.map(function(h, oIdx) {
              return '<div class="q-opt-item"><span class="q-opt-box">' + LETTERS[oIdx] + '.</span><span>' + h + '</span></div>';
            }).join('');
            return '<div class="q-card-print"><div class="q-card-top"><span class="q-num-tag">CÂU ' + (qIdx + 1) + '</span><span class="q-blank-pill">Khoanh tròn 1 đáp án đúng</span></div><div class="q-stem-text">' + q.questionHtml + '</div><div class="q-opts-grid">' + optsHtml + '</div></div>';
          }).join('');

          return '<section class="bundle-page auto-height-page sec-exam-variant-page hidden-sec" data-variant-index="' + vIdx + '">' +
            '<header class="doc-header"><div class="doc-org">' + logoHtml + '<div>' + VARIANT_SCHOOL_HTML + '</div></div>' +
            '<div class="doc-title-center"><h1>PHIẾU ĐỀ KIỂM TRA TRẮC NGHIỆM — <span class="variant-badge-pill">MÃ ĐỀ ' + escPopupHtml(v.code) + '</span></h1>' +
            '<div class="doc-sub">Gồm ' + v.questions.length + ' câu • Bộ đề: ' + escPopupHtml(sourceTitle) + ' (Kho ' + v.sourceCount + ' câu)</div></div>' +
            '<div class="doc-team-badge">HỌ VÀ TÊN: .......................<br><span>LỚP: ........... • ĐIỂM: ....../' + v.questions.length + '</span></div></header>' +
            '<div class="quiz-two-col-grid">' + cards + '</div>' +
            '<footer class="doc-footer"><span>* Học sinh giữ đúng số Mã đề <strong>' + escPopupHtml(v.code) + '</strong> khi nộp bài.</span><span>Bộ đề: ' + escPopupHtml(sourceTitle) + '</span></footer>' +
          '</section>';
        }).join('');

        var tablesHtml = '';
        for (var start = 0; start < maxQ; start += 15) {
          var end = Math.min(maxQ, start + 15);
          var thCols = '';
          for (var c = start; c < end; c++) thCols += '<th>C' + (c + 1) + '</th>';
          var tbodyRows = variants.map(function(v, vIdx) {
            var tds = '';
            for (var q = start; q < end; q++) {
              var item = v.questions[q];
              tds += '<td class="variant-key-letter">' + (item ? (LETTERS[item.correct] || 'A') : '-') + '</td>';
            }
            return '<tr class="variant-key-row" data-variant-index="' + vIdx + '"><td style="font-weight:900;background:#f1f5f9;white-space:nowrap;">Mã ' + escPopupHtml(v.code) + '</td>' + tds + '</tr>';
          }).join('');
          tablesHtml += '<table class="variant-key-table"><thead><tr><th>Mã Đề</th>' + thCols + '</tr></thead><tbody>' + tbodyRows + '</tbody></table>';
        }

        var detailHtml = variants.map(function(v, vIdx) {
          var lines = v.questions.map(function(q, qi) {
            return '<div><strong>C' + (qi + 1) + ': ' + (LETTERS[q.correct] || 'A') + '</strong> — ' + (q.optionHtmls[q.correct] || '') + '</div>';
          }).join('');
          return '<div class="variant-detail-box" data-variant-index="' + vIdx + '"><h4>🔑 Chi tiết Đáp án — Mã đề ' + escPopupHtml(v.code) + ' (' + v.questions.length + ' câu)</h4>' + lines + '</div>';
        }).join('');

        var keyHtml = '<section id="secExamVariantsKeyPage" class="bundle-page auto-height-page hidden-sec">' +
          '<header class="doc-header" style="border-bottom-color:#0f766e;"><div class="doc-org" style="color:#0f766e;">' + logoHtml + '<div>' + VARIANT_SCHOOL_HTML + '<br><span>TÀI LIỆU CHẤM BÀI GIÁO VIÊN</span></div></div>' +
          '<div class="doc-title-center"><h1 style="color:#0f766e;">BẢNG ĐÁP ÁN ĐỐI CHIẾU CÁC MÃ ĐỀ TRỘN (' + maxQ + ' CÂU)</h1><div class="doc-sub">Dùng để chấm nhanh Phiếu Đề Thi Giấy • Bộ đề: ' + escPopupHtml(sourceTitle) + '</div></div>' +
          '<div class="doc-team-badge" style="border-color:#0f766e;background:#f0fdfa;color:#115e59;">ĐÁP ÁN CHUẨN<br>' + vCount + ' MÃ ĐỀ</div></header>' +
          tablesHtml + '<div class="variant-detail-grid">' + detailHtml + '</div>' +
          '<footer class="doc-footer"><span>✔ Mỗi mã đề đã được trộn ngẫu nhiên câu hỏi và đáp án A/B/C/D độc lập với tranh tô.</span><span>Gói học liệu đồng bộ — Lớp Học Vui Nhộn</span></footer></section>';

        var bubbleHtml = buildPopupBubblePageHtml(maxQ, sourceTitle);
        root.innerHTML = pagesHtml + keyHtml + bubbleHtml;
      }
    `;
  }

  window.GmmExamVariantsPrint = {
    VARIANT_PRINT_CSS,
    buildBubbleSheetPageHtml,
    buildVariantExamPagesHtml,
    buildPopupVariantClientPayload,
    buildPopupVariantSetsPayload,
    getPopupRebuildScript
  };
})();
