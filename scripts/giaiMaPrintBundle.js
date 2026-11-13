/**
 * ==============================================================================
 * MODULE XUẤT TRỌN BỘ "GÓI HỌC LIỆU IN ẤN 1 CHẠM" ĐỒNG BỘ CHỦ ĐỀ
 * File: scripts/giaiMaPrintBundle.js
 *
 * Chỉ với 1 cú nhấp chuột trước tiết dạy / hội giảng, xuất đồng bộ:
 *   1. Phiếu Tranh Ma Trận Học Sinh (2 bản điền sẵn tên Đội 1 & Đội 2 hoặc 1 bản chung, khổ A4/A3/A1)
 *   2. Phiếu Đáp Án Màu A4 Chuẩn Cho Ban Giám Khảo (kèm số lượng ô từng mã & thang điểm)
 *   3. Bảng 10 Câu Hỏi & Kịch Bản Đáp Án Dành Cho Giáo Viên / MC Dẫn Chương Trình
 *   4. (Tùy chọn 1 chạm) Đề Thi Trắc Nghiệm Giấy Dự Phòng Cho Học Sinh (ẩn đáp án khi mất Wi-Fi)
 *   5. Nút tải trực tiếp file Vector SVG khổ Bạt Sân Khấu A1/A0 gửi tiệm in quảng cáo
 * ==============================================================================
 */

(function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const STORAGE_KEY_LOGO = 'gmm_export_school_logo';
  const DEFAULT_LOGO_REL = 'assets/images/logo-truong-thcs-Tan-Hai.jpg';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveLogoUrl() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGO);
      if (saved === 'none') return '';
      if (saved && saved.startsWith('data:')) return saved;
      const normalized = saved === 'logo-truong-thcs-Tan-Hai.jpg' ? DEFAULT_LOGO_REL : saved;
      const rel = normalized || DEFAULT_LOGO_REL;
      return new URL(rel, window.location.href).href;
    } catch {
      return '';
    }
  }

  function resolveSchoolHeaderLines() {
    const el = document.getElementById('gmmExportSchoolName');
    const raw = (el && el.value && el.value.trim())
      ? el.value.trim()
      : 'TRƯỜNG THCS TÂN HẢI\nHOẠT ĐỘNG DẠY HỌC TÍCH CỰC';
    return raw.split('\n').map(s => esc(s.trim())).filter(Boolean).join('<br>');
  }

  function buildStudentLegendItemsHtml(colorRules) {
    const groups = {};
    Object.keys(colorRules || {})
      .sort((a, b) => ((colorRules[a] && colorRules[a].qNum) || 0) - ((colorRules[b] && colorRules[b].qNum) || 0))
      .forEach(code => {
        const r = colorRules[code];
        if (!r) return;
        const key = `${r.color || '#dc2626'}|${r.name || 'Màu bút dạ'}`;
        if (!groups[key]) {
          groups[key] = { color: r.color || '#dc2626', name: r.name || 'Màu bút dạ', qNums: [] };
        }
        if (r.qNum && !groups[key].qNums.includes(r.qNum)) {
          groups[key].qNums.push(r.qNum);
        }
      });

    return Object.values(groups).map(g => `
      <span class="legend-chip">
        <span class="swatch-dot" style="background:${esc(g.color)};"></span>
        <span>Câu ${g.qNums.join(', ')}: <strong>${esc(g.name)}</strong></span>
      </span>
    `).join('');
  }

  function resolveJudgeAndQuizData(puzzle, snap) {
    const colorRules = (puzzle && puzzle.colorRules) ? puzzle.colorRules : {};
    const cells = (puzzle && Array.isArray(puzzle.cells)) ? puzzle.cells : [];
    const questions = (snap && Array.isArray(snap.questions)) ? snap.questions : [];

    const pieceCounts = {};
    cells.forEach(c => {
      if (c && c.isTarget && c.code) {
        pieceCounts[c.code] = (pieceCounts[c.code] || 0) + 1;
      }
    });

    const sortedRuleEntries = Object.keys(colorRules)
      .map(codeKey => ({ codeKey, rule: colorRules[codeKey] }))
      .sort((a, b) => ((a.rule && a.rule.qNum) || 0) - ((b.rule && b.rule.qNum) || 0));

    const useRuleEntries = questions.length === 0 ||
      (sortedRuleEntries.length > 0 && sortedRuleEntries.length !== questions.length);

    const ruleRows = useRuleEntries
      ? sortedRuleEntries.map((entry, idx) => ({
          qNum: (entry.rule && entry.rule.qNum) ? entry.rule.qNum : (idx + 1),
          codeKey: entry.codeKey,
          color: (entry.rule && entry.rule.color) ? entry.rule.color : '#059669',
          name: (entry.rule && entry.rule.name) ? entry.rule.name : 'Màu chuẩn',
          part: (entry.rule && entry.rule.part) ? entry.rule.part : '',
          pieceCount: pieceCounts[entry.codeKey] || 0
        }))
      : questions.map((q, idx) => {
          const qNum = idx + 1;
          const letter = LETTERS[q.correct] || 'A';
          const fallback = sortedRuleEntries.find(e => e.rule && e.rule.qNum === qNum);
          const codeKey = colorRules[`${qNum}${letter}`]
            ? `${qNum}${letter}`
            : (fallback ? fallback.codeKey : `${qNum}${letter}`);
          const r = colorRules[codeKey] || {};
          return {
            qNum,
            codeKey,
            color: r.color || '#059669',
            name: r.name || 'Màu chuẩn',
            part: r.part || '',
            pieceCount: pieceCounts[codeKey] || 0
          };
        });

    return { ruleRows, questions };
  }

  function buildStudentPageHtml(opts) {
    const { schoolHtml, logoUrl, puzzleTitle, teamHeading, legendHtml, uncoloredSvg, extraClass } = opts;
    return `
      <section class="bundle-page ${extraClass || ''}">
        <header class="doc-header">
          <div class="doc-org">
            ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
            <div>${schoolHtml}</div>
          </div>
          <div class="doc-title-center">
            <h1>PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH BÍ ẨN</h1>
            <div class="doc-sub">Hoạt động trải nghiệm &amp; giáo dục kỹ năng sống • Bản tô màu bút dạ</div>
          </div>
          <div class="doc-team-badge">
            ${teamHeading}<br>
            <span>LỚP: ............ • ĐIỂM: ............</span>
          </div>
        </header>

        <div class="student-legend-bar">
          <span class="legend-lead">👉 QUY ƯỚC BÚT DẠ:</span>
          ${legendHtml}
        </div>

        <div class="student-svg-frame">
          ${uncoloredSvg}
        </div>

        <footer class="doc-footer">
          <span>* Hướng dẫn: Trả lời đúng câu hỏi ➔ Tìm các ô mang mã tương ứng trên tranh ➔ Tô kín bằng màu bút dạ của câu đó. Các ô mã nhiễu để trắng.</span>
          <span>Giám khảo chấm: ........................ (${esc(puzzleTitle)})</span>
        </footer>
      </section>
    `;
  }

  function buildQuestionsGridHtml(questions, ruleRows, revealAnswers) {
    if (!questions || questions.length === 0) {
      return '<div style="padding:18px;text-align:center;color:#475569;">Chưa có dữ liệu câu hỏi trắc nghiệm trong bộ đề hiện tại.</div>';
    }
    return `
      <div class="quiz-two-col-grid">
        ${questions.map((q, idx) => {
          const qNum = idx + 1;
          const rRow = ruleRows[idx] || null;
          const badgeHtml = (revealAnswers && rRow)
            ? `<span class="q-unlock-pill" style="background:${esc(rRow.color)};">Mở mã ${esc(rRow.codeKey)} • ${esc(rRow.name)} (${rRow.pieceCount} ô)</span>`
            : `<span class="q-blank-pill">Ô mã mở khóa: .......</span>`;

          const optsHtml = (q.options || []).map((optText, oIdx) => {
            const letter = LETTERS[oIdx] || String(oIdx + 1);
            const isCorrect = revealAnswers && Number(q.correct) === oIdx;
            return `
              <div class="q-opt-item ${isCorrect ? 'correct' : ''}">
                <span class="q-opt-box">${isCorrect ? '✔ ' + letter : letter + '.'}</span>
                <span>${esc(optText)}</span>
              </div>
            `;
          }).join('');

          return `
            <div class="q-card-print">
              <div class="q-card-top">
                <span class="q-num-tag">CÂU ${qNum}</span>
                ${badgeHtml}
              </div>
              <div class="q-stem-text">${esc(q.question)}</div>
              <div class="q-opts-grid">${optsHtml}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function openOneClickPrintBundle(overridePuzzle) {
    const activePuzzle = overridePuzzle || (
      (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
        ? window.GiaiMaPuzzle.getActivePuzzle()
        : null
    );

    if (!activePuzzle || !window.GiaiMaPuzzle || typeof window.GiaiMaPuzzle.renderSvgMatrix !== 'function') {
      if (typeof window.showToast === 'function') {
        window.showToast('Chưa tải xong dữ liệu ma trận tranh để xuất gói học liệu!', 'warning');
      }
      return;
    }

    const win = window.open('', '_blank', 'width=1280,height=900');
    if (!win) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép mở cửa sổ popup để xuất Gói Học Liệu In Ấn 1 Chạm!', 'warning');
      }
      return;
    }

    const snap = (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.getArenaLiveSnapshot === 'function')
      ? window.GiaiMaBiMat.getArenaLiveSnapshot()
      : null;

    const teamAName = (snap && snap.teamA && snap.teamA.name) ? snap.teamA.name : 'ĐOÀN KẾT';
    const teamBName = (snap && snap.teamB && snap.teamB.name) ? snap.teamB.name : 'LA BÀN TUỔI TRẺ';
    const puzzleTitle = activePuzzle.title || 'TRI ÂN THẦY CÔ 20/11';
    const targetCount = Array.isArray(activePuzzle.targetCellIds)
      ? activePuzzle.targetCellIds.length
      : (activePuzzle.cells || []).filter(c => c.isTarget).length;

    const schoolHtml = resolveSchoolHeaderLines();
    const logoUrl = resolveLogoUrl();
    const legendHtml = buildStudentLegendItemsHtml(activePuzzle.colorRules || {});
    const { ruleRows, questions } = resolveJudgeAndQuizData(activePuzzle, snap);

    const uncoloredSvg = window.GiaiMaPuzzle.renderSvgMatrix('bundle_student', {}, {
      isPrint: true,
      puzzle: activePuzzle
    });
    const judgeSvgSeams = window.GiaiMaPuzzle.renderSvgMatrix('bundle_judge_seams', {}, {
      isPrint: true,
      isSolvedAnswerKey: true,
      seamlessStrokes: false,
      puzzle: activePuzzle
    });
    const judgeSvgSeamless = window.GiaiMaPuzzle.renderSvgMatrix('bundle_judge_seamless', {}, {
      isPrint: true,
      isSolvedAnswerKey: true,
      seamlessStrokes: true,
      puzzle: activePuzzle
    });

    // Chuẩn bị nội dung SVG thuần cho nút tải bạt sân khấu A1/A0 ngay trong cửa sổ
    const bannerSvgCells = (activePuzzle.cells || []).map(c => {
      const fs = c.fontSize || 9.5;
      return `<path class="c" d="${c.d}"/><text class="t" x="${c.labelPos[0]}" y="${c.labelPos[1]}" font-size="${fs}">${esc(c.code)}</text>`;
    }).join('');
    const rawStageSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="841mm" height="594mm"><style>.c{fill:#fff;stroke:#000;stroke-width:1.8;stroke-linejoin:round}.t{font-family:Arial,sans-serif;font-weight:700;fill:#000;text-anchor:middle;dominant-baseline:central}</style><rect width="800" height="520" fill="#fff"/>${bannerSvgCells}</svg>`;

    const judgeRowsHtml = ruleRows.map(r => `
      <tr>
        <td style="text-align:center;font-weight:800;">Câu ${r.qNum}</td>
        <td style="text-align:center;"><span class="judge-code-badge" style="background:${esc(r.color)};">${esc(r.codeKey)}</span></td>
        <td><strong>${esc(r.name)}</strong>${r.part ? ' • ' + esc(r.part) : ''}</td>
        <td style="text-align:center;font-weight:800;">${r.pieceCount} ô</td>
        <td style="text-align:center;">☐</td>
        <td style="text-align:center;">☐</td>
      </tr>
    `).join('');

    const pageStudentTeamA = buildStudentPageHtml({
      schoolHtml,
      logoUrl,
      puzzleTitle,
      teamHeading: `ĐỘI 1: <strong>${esc(teamAName)}</strong>`,
      legendHtml,
      uncoloredSvg,
      extraClass: 'sec-student sec-student-2teams'
    });

    const pageStudentTeamB = buildStudentPageHtml({
      schoolHtml,
      logoUrl,
      puzzleTitle,
      teamHeading: `ĐỘI 2: <strong>${esc(teamBName)}</strong>`,
      legendHtml,
      uncoloredSvg,
      extraClass: 'sec-student sec-student-2teams'
    });

    const pageStudentBlank = buildStudentPageHtml({
      schoolHtml,
      logoUrl,
      puzzleTitle,
      teamHeading: 'ĐỘI THI: ...............................',
      legendHtml,
      uncoloredSvg,
      extraClass: 'sec-student sec-student-single hidden-sec'
    });

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Gói Học Liệu In Ấn 1 Chạm — ${esc(puzzleTitle)}</title>
  <style id="dynamicPageCss">
    @page { size: A4 landscape; margin: 6mm 7mm; }
  </style>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 12px;
      background: #e2e8f0;
      color: #0f172a;
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
    }
    .bundle-dock {
      max-width: 1160px;
      margin: 0 auto 14px;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 10px;
      padding: 12px 16px;
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.25);
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1.5px solid #f59e0b;
    }
    .dock-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .dock-title {
      font-size: 15px;
      font-weight: 900;
      color: #fde047;
    }
    .dock-sub {
      font-size: 12.5px;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .dock-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .dock-btn {
      border: 1px solid #334155;
      background: #1e293b;
      color: #f8fafc;
      padding: 8px 13px;
      border-radius: 7px;
      font-weight: 800;
      font-size: 12.5px;
      cursor: pointer;
    }
    .dock-btn.svg-dl {
      background: #0369a1;
      border-color: #38bdf8;
    }
    .dock-btn.print-now {
      background: #059669;
      border-color: #34d399;
      font-size: 13.5px;
      padding: 9px 18px;
    }
    .dock-options {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid rgba(148, 163, 184, 0.22);
      font-size: 12.5px;
    }
    .dock-chk {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      background: rgba(30, 41, 59, 0.85);
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      font-weight: 700;
    }
    .dock-select {
      background: #1e293b;
      color: #fde047;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 5px 8px;
      font-weight: 800;
      font-size: 12.5px;
    }
    .bundle-page {
      width: 283mm;
      height: 196mm;
      margin: 0 auto 14px;
      background: #ffffff;
      padding: 4mm 5mm;
      border-radius: 4px;
      box-shadow: 0 6px 22px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .bundle-page.auto-height-page {
      height: auto;
      min-height: 196mm;
      overflow: visible;
    }
    .hidden-sec {
      display: none !important;
    }
    .page-break-before {
      page-break-before: always;
      break-before: page;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 2mm;
      margin-bottom: 2mm;
      gap: 8px;
    }
    .doc-org {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 8.5pt;
      font-weight: 800;
      line-height: 1.3;
      text-transform: uppercase;
    }
    .doc-logo {
      width: 38px;
      height: 38px;
      object-fit: contain;
    }
    .doc-title-center {
      text-align: center;
      flex: 1;
    }
    .doc-title-center h1 {
      margin: 0;
      font-size: 13.5pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .doc-sub {
      font-size: 8.5pt;
      color: #334155;
      font-weight: 700;
      margin-top: 1px;
    }
    .doc-team-badge {
      border: 1.5px dashed #0f172a;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      line-height: 1.35;
      background: #f8fafc;
    }
    .student-legend-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      align-items: center;
      border: 1.5px solid #0f172a;
      background: #f8fafc;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      margin-bottom: 2mm;
    }
    .legend-lead {
      font-weight: 900;
    }
    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .swatch-dot {
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      border-radius: 2px;
      display: inline-block;
    }
    .student-svg-frame {
      flex: 1;
      min-height: 0;
      border: 1.8px solid #0f172a;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .student-svg-frame svg {
      width: 100% !important;
      height: 100% !important;
      max-height: 158mm;
    }
    .doc-footer {
      margin-top: 2mm;
      padding-top: 1.5mm;
      border-top: 1px solid #94a3b8;
      display: flex;
      justify-content: space-between;
      font-size: 7.8pt;
      font-style: italic;
      color: #334155;
    }
    .judge-split {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 4mm;
    }
    .judge-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
    }
    .judge-table th {
      background: #0f172a;
      color: #fff;
      padding: 3.5px 4px;
      border: 1px solid #0f172a;
    }
    .judge-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
    }
    .judge-code-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      color: #fff;
      font-weight: 900;
      font-size: 7.6pt;
    }
    .judge-score-card {
      border: 1.5px solid #0f172a;
      border-radius: 4px;
      padding: 2.5mm 3mm;
      background: #f8fafc;
      font-size: 8pt;
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .quiz-two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5mm 4mm;
      flex: 1;
      align-content: start;
    }
    .q-card-print {
      border: 1px solid #94a3b8;
      border-radius: 4px;
      padding: 2mm 2.6mm;
      background: #ffffff;
      break-inside: avoid;
    }
    .q-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1mm;
    }
    .q-num-tag {
      font-weight: 900;
      font-size: 8.2pt;
      color: #0f172a;
    }
    .q-unlock-pill {
      color: #fff;
      font-size: 7.3pt;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 3px;
    }
    .q-blank-pill {
      font-size: 7.3pt;
      color: #475569;
      font-style: italic;
    }
    .q-stem-text {
      font-size: 8.1pt;
      font-weight: 700;
      margin-bottom: 1.2mm;
      line-height: 1.28;
    }
    .q-opts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1mm 2.5mm;
      font-size: 7.6pt;
    }
    .q-opt-item {
      display: flex;
      gap: 3px;
      line-height: 1.22;
    }
    .q-opt-item.correct {
      font-weight: 900;
      color: #047857;
      background: #ecfdf5;
      border-radius: 2px;
      padding: 0 3px;
    }
    .q-opt-box {
      font-weight: 800;
      white-space: nowrap;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      .bundle-page {
        width: 100%;
        height: 195mm;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        padding: 0;
      }
      .bundle-page.auto-height-page {
        height: auto;
        min-height: 0;
      }
    }
  </style>
</head>
<body>
  <div class="bundle-dock no-print">
    <div class="dock-top">
      <div>
        <div class="dock-title">📦 GÓI HỌC LIỆU IN ẤN 1 CHẠM — CHỦ ĐỀ: ${esc(puzzleTitle)}</div>
        <div class="dock-sub">Đồng bộ tự động Phiếu Học Sinh (${esc(teamAName)} &amp; ${esc(teamBName)}) + Phiếu Đáp Án Màu Giám Khảo + Bảng Câu Hỏi Trắc Nghiệm</div>
      </div>
      <div class="dock-btns">
        <button type="button" class="dock-btn svg-dl" onclick="downloadBannerSvg()">📐 Tải Riêng SVG Bạt A1/A0</button>
        <button type="button" id="btnJudgeSeamless" class="dock-btn" onclick="toggleJudgeSeamless()">🧩 Tranh Giám Khảo: Hiện Gân</button>
        <button type="button" class="dock-btn print-now" onclick="window.print()">🖨️ IN TRỌN BỘ NGAY (Ctrl+P)</button>
      </div>
    </div>

    <div class="dock-options">
      <label>
        <strong>📐 Khổ giấy in:</strong>
        <select id="selPaperSize" class="dock-select" onchange="updatePaperSize()">
          <option value="A4" selected>Khổ A4 Ngang (Máy in văn phòng)</option>
          <option value="A3">Khổ A3 Ngang (Phiếu nhóm 4-6 HS)</option>
          <option value="A1">Khổ A1 Ngang (Máy in khổ lớn)</option>
        </select>
      </label>

      <label>
        <strong>👥 Bản phiếu HS:</strong>
        <select id="selStudentMode" class="dock-select" onchange="refreshSections()">
          <option value="2teams" selected>2 Bản điền sẵn Đội 1 &amp; Đội 2</option>
          <option value="single">1 Bản mẫu chung</option>
          <option value="none">Không in phiếu HS</option>
        </select>
      </label>

      <label class="dock-chk">
        <input type="checkbox" id="chkJudgeKey" checked onchange="refreshSections()" />
        <span>🎨 Đáp Án Màu Giám Khảo</span>
      </label>

      <label class="dock-chk">
        <input type="checkbox" id="chkMcScript" checked onchange="refreshSections()" />
        <span>🎤 Bảng Câu Hỏi &amp; Đáp Án MC</span>
      </label>

      <label class="dock-chk">
        <input type="checkbox" id="chkStudentQuizBackup" onchange="refreshSections()" />
        <span>📝 Đề Câu Hỏi Giấy Dự Phòng (Ẩn đáp án)</span>
      </label>
    </div>
  </div>

  <!-- 1. PHIẾU TRANH MA TRẬN HỌC SINH -->
  ${pageStudentTeamA}
  ${pageStudentTeamB}
  ${pageStudentBlank}

  <!-- 2. PHIẾU ĐÁP ÁN MÀU BAN GIÁM KHẢO -->
  <section id="secJudgeKey" class="bundle-page">
    <header class="doc-header" style="border-bottom-color:#b91c1c;">
      <div class="doc-org" style="color:#991b1b;">
        ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
        <div>${schoolHtml}<br><span style="color:#b91c1c;">HỘI ĐỒNG BAN GIÁM KHẢO</span></div>
      </div>
      <div class="doc-title-center">
        <h1 style="color:#991b1b;">PHIẾU ĐÁP ÁN MÀU CHUẨN — ĐỐI SOÁT CHẤM TRANH</h1>
        <div class="doc-sub">Chủ đề: ${esc(puzzleTitle)} • Tổng cộng ${targetCount} mảnh màu mục tiêu</div>
      </div>
      <div class="doc-team-badge" style="border-color:#b91c1c;background:#fef2f2;color:#991b1b;">
        TÀI LIỆU MẬT BGK<br>
        IN MÀU KHỔ NGANG
      </div>
    </header>

    <div class="judge-split">
      <div class="student-svg-frame">
        <div id="judgeSeamsBox" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${judgeSvgSeams}</div>
        <div id="judgeSeamlessBox" style="width:100%;height:100%;display:none;align-items:center;justify-content:center;">${judgeSvgSeamless}</div>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:space-between;gap:2mm;">
        <table class="judge-table">
          <thead>
            <tr>
              <th>Câu</th>
              <th>Mã</th>
              <th>Màu Bút &amp; Chi Tiết</th>
              <th>Số Ô</th>
              <th>Đ1</th>
              <th>Đ2</th>
            </tr>
          </thead>
          <tbody>${judgeRowsHtml}</tbody>
        </table>

        <div class="judge-score-card">
          <div style="font-weight:900;border-bottom:1px dashed #94a3b8;padding-bottom:1mm;">⚖️ CHẤM ĐIỂM TẠI BÀN 2 ĐỘI</div>
          <div style="display:flex;justify-content:space-between;font-weight:700;">
            <span>🔴 ${esc(teamAName)}: ..../${ruleRows.length} cụm</span>
            <span>Thẩm mỹ: ....đ</span>
            <span>Tổng: ......đ</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:700;">
            <span>🔵 ${esc(teamBName)}: ..../${ruleRows.length} cụm</span>
            <span>Thẩm mỹ: ....đ</span>
            <span>Tổng: ......đ</span>
          </div>
          <div style="text-align:right;font-size:7.4pt;font-style:italic;color:#475569;">Chữ ký Giám khảo: ..............................</div>
        </div>
      </div>
    </div>

    <footer class="doc-footer">
      <span>✔ Quy tắc đối soát: Ô mang mã đúng được tô kín màu tương ứng; các ô mã gây nhiễu phải để trắng.</span>
      <span>Gói học liệu đồng bộ — Lớp Học Vui Nhộn</span>
    </footer>
  </section>

  <!-- 3. BẢNG CÂU HỎI & KỊCH BẢN ĐÁP ÁN CHO GIÁO VIÊN / MC -->
  <section id="secMcScript" class="bundle-page auto-height-page">
    <header class="doc-header">
      <div class="doc-org">
        ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
        <div>${schoolHtml}</div>
      </div>
      <div class="doc-title-center">
        <h1>BẢNG CÂU HỎI &amp; KỊCH BẢN ĐÁP ÁN DẪN CHƯƠNG TRÌNH (MC / GV)</h1>
        <div class="doc-sub">Chủ đề tranh giải mã: ${esc(puzzleTitle)} • Đánh dấu sẵn phương án đúng &amp; mã ô mở khóa</div>
      </div>
      <div class="doc-team-badge">
        BẢN GIÁO VIÊN / MC<br>
        <span>Số câu: <strong>${questions.length} câu</strong></span>
      </div>
    </header>

    ${buildQuestionsGridHtml(questions, ruleRows, true)}

    <footer class="doc-footer">
      <span>* Dành cho Giáo viên / MC cầm dẫn dắt phần thi Đấu Trường Câu Hỏi và công bố đáp án.</span>
      <span>Chủ đề: ${esc(puzzleTitle)}</span>
    </footer>
  </section>

  <!-- 4. PHIẾU ĐỀ CÂU HỎI GIẤY DỰ PHÒNG PHÁT HỌC SINH (ẨN ĐÁP ÁN) -->
  <section id="secStudentQuizBackup" class="bundle-page auto-height-page hidden-sec">
    <header class="doc-header">
      <div class="doc-org">
        ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" class="doc-logo" />` : ''}
        <div>${schoolHtml}</div>
      </div>
      <div class="doc-title-center">
        <h1>PHIẾU CÂU HỎI TRẮC NGHIỆM DỰ PHÒNG (BẢN GIẤY CHO ĐỘI THI)</h1>
        <div class="doc-sub">Khoanh tròn phương án đúng nhất A, B, C hoặc D cho mỗi câu hỏi dưới đây</div>
      </div>
      <div class="doc-team-badge">
        ĐỘI THI: .........................<br>
        <span>ĐIỂM CÂU HỎI: ......./${questions.length}</span>
      </div>
    </header>

    ${buildQuestionsGridHtml(questions, ruleRows, false)}

    <footer class="doc-footer">
      <span>* Sau khi hoàn thành phiếu trắc nghiệm, nộp lại cho Ban Giám Khảo để nhận bảng mã ô màu mở khóa trên tranh A1.</span>
      <span>Chủ đề: ${esc(puzzleTitle)}</span>
    </footer>
  </section>

  <script>
    var RAW_STAGE_SVG = ${JSON.stringify(rawStageSvg)};
    var SAFE_FILE = ${JSON.stringify(puzzleTitle.replace(/[^a-zA-Z0-9_-]/g, '_'))};
    var judgeSeamless = false;

    function refreshSections() {
      var sMode = document.getElementById('selStudentMode').value;
      document.querySelectorAll('.sec-student-2teams').forEach(function(el) {
        el.classList.toggle('hidden-sec', sMode !== '2teams');
      });
      document.querySelectorAll('.sec-student-single').forEach(function(el) {
        el.classList.toggle('hidden-sec', sMode !== 'single');
      });
      document.getElementById('secJudgeKey').classList.toggle('hidden-sec', !document.getElementById('chkJudgeKey').checked);
      document.getElementById('secMcScript').classList.toggle('hidden-sec', !document.getElementById('chkMcScript').checked);
      document.getElementById('secStudentQuizBackup').classList.toggle('hidden-sec', !document.getElementById('chkStudentQuizBackup').checked);

      // Gán ngắt trang tự động từ trang hiển thị thứ 2 trở đi để không bao giờ sinh trang trắng đầu tiên
      var visiblePages = Array.prototype.slice.call(document.querySelectorAll('.bundle-page:not(.hidden-sec)'));
      visiblePages.forEach(function(pg, idx) {
        pg.classList.toggle('page-break-before', idx > 0);
      });
    }

    function updatePaperSize() {
      var sz = document.getElementById('selPaperSize').value || 'A4';
      var margin = (sz === 'A1') ? '10mm' : '6mm 7mm';
      document.getElementById('dynamicPageCss').textContent = '@page { size: ' + sz + ' landscape; margin: ' + margin + '; }';
    }

    function toggleJudgeSeamless() {
      judgeSeamless = !judgeSeamless;
      document.getElementById('judgeSeamsBox').style.display = judgeSeamless ? 'none' : 'flex';
      document.getElementById('judgeSeamlessBox').style.display = judgeSeamless ? 'flex' : 'none';
      document.getElementById('btnJudgeSeamless').textContent = judgeSeamless
        ? '🎨 Tranh Giám Khảo: Liền Khối'
        : '🧩 Tranh Giám Khảo: Hiện Gân';
    }

    function downloadBannerSvg() {
      var blob = new Blob([RAW_STAGE_SVG], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Bat_San_Khau_A1_' + SAFE_FILE + '.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    refreshSections();
  </script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();

    if (typeof window.showToast === 'function') {
      window.showToast(`📦 Đã xuất Gói Học Liệu In Ấn 1 Chạm đồng bộ chủ đề "${puzzleTitle}"!`, 'success');
    }
  }

  window.GiaiMaPrintBundle = {
    openOneClickPrintBundle
  };
})();
