/**
 * ==============================================================================
 * MODULE XUẤT PHIẾU MA TRẬN TRANH & ẢNH KỶ NIỆM LỚP (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmExport.js
 * Trách nhiệm: Xuất PDF / Word / PNG 300DPI / Vector SVG, logo trường & chụp
 * bức ảnh kỷ niệm lớp học 2K sau trận đấu.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmExport = {
    create: function (ctx) {
      const { gameState, generateSvgPuzzle } = ctx;

  // ============================================================================
  // XUẤT PHIẾU MA TRẬN TRANH KHỔ GIẤY A4 NẰM NGANG (PDF & WORD)
  // ============================================================================

  let exportPreviewActivePage = 1;

  function switchExportPreviewPage(pageNum) {
    exportPreviewActivePage = pageNum;
    const tab1 = document.getElementById('gmmTabPreviewPage1');
    const tab2 = document.getElementById('gmmTabPreviewPage2');
    if (tab1) tab1.classList.toggle('active', pageNum === 1);
    if (tab2) tab2.classList.toggle('active', pageNum === 2);
    updateExportPreview();
  }

  function getCleanPrintSvg(isSolvedAnswerKey = false) {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      return window.GiaiMaPuzzle.renderSvgMatrix('print_sheet', {}, {
        isPrint: true,
        isSolvedAnswerKey: isSolvedAnswerKey
      });
    }
    return '';
  }

  function buildAnswerKeyTableHtml(isForWord = false) {
    const list = (ctx.getQuestionsList() && ctx.getQuestionsList().length > 0) ? ctx.getQuestionsList() : ctx.DEFAULT_QUESTIONS;
    const letters = ['A', 'B', 'C', 'D'];
    const rows = list.map((q, idx) => {
      const char = letters[q.correct] || 'A';
      const optText = (q.options && q.options[q.correct]) ? q.options[q.correct] : '';
      const shortOpt = optText.length > 55 ? optText.substring(0, 55) + '...' : optText;
      const coord = q.coordinate ? q.coordinate.replace('Mã ', '') : `${idx + 1}${char}`;
      const colorDot = q.coordinate && q.coordinate.includes('Đỏ') ? '#dc2626'
                     : q.coordinate && q.coordinate.includes('cam') ? '#f59e0b'
                     : q.coordinate && q.coordinate.includes('dương') ? '#2563eb'
                     : q.coordinate && q.coordinate.includes('sen') ? '#ec4899'
                     : q.coordinate && q.coordinate.includes('lục') ? '#10b981'
                     : '#eab308';
      return `
        <tr style="${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; text-align: center; font-weight: bold; width: 38px;">C${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; text-align: center; font-weight: 900; color: #dc2626; width: 32px; font-size: 10.5pt;">${char}</td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; font-weight: bold; width: 75px; white-space: nowrap;">
            <span style="display: inline-block; width: 9px; height: 9px; background: ${colorDot}; border-radius: 2px; margin-right: 3px;"></span>${coord}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 5px; font-size: ${isForWord ? '8.5pt' : '8.2pt'}; line-height: 1.25;">${shortOpt}</td>
        </tr>
      `;
    }).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-family: inherit; margin-bottom: 4px;">
        <thead>
          <tr style="background: #e2e8f0; font-weight: bold;">
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: center;">Câu</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: center;">Đ/A</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: left;">Mã Ô Màu</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: left;">Nội dung phương án chuẩn</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function buildBgkRubricHtml(isForWord = false) {
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: ${isForWord ? '8.5pt' : '8pt'}; border: 1.5px solid #000; font-family: inherit;">
        <tr style="background: #f1f5f9; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #94a3b8; padding: 3px;">Tiêu chí chấm điểm Ban Giám Khảo</td>
          <td style="border: 1px solid #94a3b8; padding: 3px; width: 85px; color: #dc2626;">ĐỘI 1 (ĐỘI A)</td>
          <td style="border: 1px solid #94a3b8; padding: 3px; width: 85px; color: #2563eb;">ĐỘI 2 (ĐỘI B)</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 2px 4px;">1. Đúng ô màu tương ứng câu hỏi (+1đ/câu đúng)</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 2px 4px;">2. Thẩm mỹ tranh, không lem, đều màu bút dạ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
        </tr>
        <tr style="font-weight: bold; background: #fef08a;">
          <td style="border: 1px solid #94a3b8; padding: 3px 4px;">TỔNG ĐIỂM CHUNG CUỘC (Tối đa 20 điểm)</td>
          <td style="border: 1px solid #94a3b8; text-align: center; font-size: 9.5pt;">....... /20đ</td>
          <td style="border: 1px solid #94a3b8; text-align: center; font-size: 9.5pt;">....... /20đ</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #94a3b8; padding: 3px 6px; font-style: italic; text-align: right; font-size: 7.8pt;">
            Chữ ký Giám khảo 1: ........................................ • Giám khảo 2: ........................................
          </td>
        </tr>
      </table>
    `;
  }

  const STORAGE_KEY_EXPORT_LOGO = 'gmm_export_school_logo';
  const DEFAULT_SCHOOL_LOGO = 'assets/images/logo-truong-thcs-Tan-Hai.jpg';

  function getExportSchoolLogo() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPORT_LOGO);
      if (saved === 'none') return '';
      if (saved === 'logo-truong-thcs-Tan-Hai.jpg') return DEFAULT_SCHOOL_LOGO;
      if (saved) return saved;
      return DEFAULT_SCHOOL_LOGO;
    } catch (_e) {
      return DEFAULT_SCHOOL_LOGO;
    }
  }

  function handleLogoUpload(event) {
    const file = event && event.target && event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Thu gọn logo tối đa 240x240 để lưu LocalStorage nhẹ và sắc nét
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/png');
          try {
            localStorage.setItem(STORAGE_KEY_EXPORT_LOGO, compressedDataUrl);
          } catch (_e) {}
        }
        renderLogoUI();
        updateExportPreview();
        if (typeof window.showToast === 'function') {
          window.showToast('🏫 Đã thêm Logo trường học vào phiếu in thành công!', 'success');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = '';
  }

  function removeLogo() {
    try {
      localStorage.setItem(STORAGE_KEY_EXPORT_LOGO, 'none');
    } catch (_e) {}
    renderLogoUI();
    updateExportPreview();
    if (typeof window.showToast === 'function') {
      window.showToast('Đã gỡ logo trường khỏi phiếu in!', 'info');
    }
  }

  function renderLogoUI() {
    const wrap = document.getElementById('gmmExportLogoPreviewWrap');
    const btnRemove = document.getElementById('gmmBtnRemoveLogo');
    const logoUrl = getExportSchoolLogo();

    if (!wrap) return;

    if (logoUrl) {
      wrap.innerHTML = `
        <img src="${logoUrl}" alt="Logo Trường" style="height: 34px; width: 34px; object-fit: contain; border-radius: 4px; background: #fff; padding: 2px; border: 1.5px solid #38bdf8;" />
        <span style="font-size: 0.82rem; color: #34d399; font-weight: 700;">✓ Đã tải logo</span>
      `;
      if (btnRemove) btnRemove.style.display = 'inline-block';
    } else {
      wrap.innerHTML = `<span style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">(Chưa có logo)</span>`;
      if (btnRemove) btnRemove.style.display = 'none';
    }
  }

  function appendExtraInfoTemplate() {
    const teamInput = document.getElementById('gmmExportTeamLabel');
    if (!teamInput) return;
    const curVal = teamInput.value.trim();
    teamInput.value = curVal + '\nGIÁO VIÊN HƯỚNG DẪN: .........................\nBÀN THI SỐ: ..........';
    updateExportPreview();
  }

  function formatTextLines(text, defaultText) {
    const raw = (text && text.trim()) ? text.trim() : defaultText;
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.join('<br>');
  }

  function getExportFormData() {
    const schoolInput = document.getElementById('gmmExportSchoolName');
    const titleInput = document.getElementById('gmmExportTitle');
    const teamInput = document.getElementById('gmmExportTeamLabel');
    const schoolLogo = getExportSchoolLogo();

    const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : null;
    const defaultTitle = activePuzzle && activePuzzle.title ? activePuzzle.title : 'TRI ÂN THẦY CÔ 20/11';

    const defaultSchool = 'TRƯỜNG THCS TÂN HẢI\nHOẠT ĐỘNG DẠY HỌC TÍCH CỰC';
    const defaultTitleStr = 'PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH BÍ ẨN\nCHỦ ĐỀ: KỸ NĂNG SỐNG & HỌC TẬP';
    const defaultTeam = 'ĐỘI THI: .........................\nLỚP: .......... • THỜI GIAN: .....................';

    return {
      schoolName: schoolInput ? schoolInput.value : defaultSchool,
      schoolNameHtml: formatTextLines(schoolInput ? schoolInput.value : '', defaultSchool),
      title: titleInput ? titleInput.value : defaultTitleStr,
      titleHtml: formatTextLines(titleInput ? titleInput.value : '', defaultTitleStr),
      teamLabel: teamInput ? teamInput.value : defaultTeam,
      teamLabelHtml: formatTextLines(teamInput ? teamInput.value : '', defaultTeam),
      schoolLogo: schoolLogo,
      safeTitle: defaultTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')
    };
  }

  function buildDynamicLegendGroups() {
    const active = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : null;
    const rules = (active && active.colorRules) ? active.colorRules : {};
    const groups = {};
    Object.keys(rules)
      .sort((a, b) => ((rules[a] && rules[a].qNum) || 0) - ((rules[b] && rules[b].qNum) || 0))
      .forEach(code => {
        const r = rules[code];
        if (!r) return;
        const key = `${r.color || '#dc2626'}|${r.name || 'Màu bút dạ'}`;
        if (!groups[key]) {
          groups[key] = { color: r.color || '#dc2626', name: r.name || 'Màu bút dạ', qNums: [] };
        }
        if (r.qNum && !groups[key].qNums.includes(r.qNum)) {
          groups[key].qNums.push(r.qNum);
        }
      });
    return Object.values(groups);
  }

  function updateExportPreview() {
    const mockup = document.getElementById('gmmA4SheetMockup');
    if (!mockup) return;

    const data = getExportFormData();
    const isPage2 = (exportPreviewActivePage === 2);

    if (isPage2) {
      // BẢN PREVIEW TRANG 2: ĐÁP ÁN BGK (TRANH MÀU HOÀN THIỆN)
      const solvedSvg = getCleanPrintSvg(true);
      mockup.innerHTML = `
        <div class="mockup-header" style="border-bottom: 2px solid #b91c1c;">
          <div class="mockup-school" style="color: #991b1b; display: flex; align-items: center; gap: 8px;">
            ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo" style="height: 38px; width: 38px; object-fit: contain; border-radius: 3px; flex-shrink: 0;" />` : ''}
            <div>
              ${data.schoolNameHtml}<br>
              <span style="font-size: 7.5pt; color: #b91c1c; font-weight: 800;">HỘI ĐỒNG BAN GIÁM KHẢO</span>
            </div>
          </div>
          <div class="mockup-title">
            <h1 style="color: #991b1b; font-size: 11.5pt;">${data.titleHtml}</h1>
            <div style="font-size: 7.5pt; color: #475569; font-style: italic;">(Bản lưu Ban Giám Khảo đối chiếu kết quả 2 đội thi)</div>
          </div>
          <div class="mockup-team-box" style="border-color: #b91c1c; background: #fff1f2; font-size: 7.5pt;">
            TIÊU CHÍ CHẤM:<br>
            • Đúng ô màu: <strong>10đ</strong><br>
            • Thẩm mỹ đều màu: <strong>10đ</strong>
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex: 1; min-height: 0; align-items: stretch; margin-top: 4px;">
          <!-- Cột trái: Tranh màu chuẩn -->
          <div style="flex: 1.15; border: 1.5px solid #b91c1c; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 7.5pt; padding: 2px 4px; text-align: center; border-bottom: 1px solid #f87171;">
              🎨 BỨC TRANH MÀU HOÀN THIỆN ĐỐI CHIẾU (CHUẨN 100%)
            </div>
            <div class="mockup-canvas" style="flex: 1; border: none; aspect-ratio: auto;">
              ${solvedSvg}
            </div>
          </div>

          <!-- Cột phải: Bảng 10 câu & Phiếu chấm điểm -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-weight: 800; font-size: 8pt; color: #0f172a; margin-bottom: 2px;">
                📋 BẢNG ĐÁP ÁN 10 CÂU & TỌA ĐỘ MÃ MÀU:
              </div>
              ${buildAnswerKeyTableHtml(false)}
            </div>

            <div>
              <div style="font-weight: 800; font-size: 8pt; color: #0f172a; margin-top: 2px; margin-bottom: 2px;">
                ⚖️ PHIẾU GHI ĐIỂM BAN GIÁM KHẢO:
              </div>
              ${buildBgkRubricHtml(false)}
            </div>
          </div>
        </div>

        <div class="mockup-footer" style="margin-top: 3px; font-size: 6.8pt;">
          <span>* Ban Giám Khảo đối chiếu tranh tô màu của 2 đội với bức tranh mẫu chuẩn bên trái.</span>
          <span>Hội đồng chấm thi - Lớp học vui nhộn 2026</span>
        </div>
      `;
    } else {
      // BẢN PREVIEW TRANG 1: PHIẾU HỌC SINH (ĐEN TRẮNG)
      const printSvg = getCleanPrintSvg(false);
      mockup.innerHTML = `
        <div class="mockup-header">
          <div class="mockup-school" style="display: flex; align-items: center; gap: 8px;">
            ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo" style="height: 38px; width: 38px; object-fit: contain; border-radius: 3px; flex-shrink: 0;" />` : ''}
            <div>
              ${data.schoolNameHtml}
            </div>
          </div>
          <div class="mockup-title">
            <h1>${data.titleHtml}</h1>
          </div>
          <div class="mockup-team-box">
            ${data.teamLabelHtml}
          </div>
        </div>

        <div class="mockup-legend">
          <span style="font-weight: 900;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</span>
          ${buildDynamicLegendGroups().map(g => `<span><strong style="color: ${g.color};">■</strong> ${g.name} (C${g.qNums.join(', ')})</span>`).join('')}
        </div>

        <div class="mockup-canvas">
          ${printSvg}
        </div>

        <div class="mockup-footer">
          <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
          <span>Điểm số: ......... / Chữ ký BGK: ................</span>
        </div>
      `;
    }
  }

  function openExportWorksheetModal() {
    const modal = document.getElementById('gmmExportWorksheetModal');
    if (modal) {
      modal.style.display = 'flex';
      exportPreviewActivePage = 1;
      const tab1 = document.getElementById('gmmTabPreviewPage1');
      const tab2 = document.getElementById('gmmTabPreviewPage2');
      if (tab1) tab1.classList.add('active');
      if (tab2) tab2.classList.remove('active');
      renderLogoUI();
      updateExportPreview();
    }
  }

  function closeExportModal() {
    const modal = document.getElementById('gmmExportWorksheetModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function convertSvgToHighResPng(svgString, width = 2400, height = 1560) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Cannot create canvas context'));

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URLObj = window.URL || window.webkitURL || window;
        const blobUrl = URLObj.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URLObj.revokeObjectURL(blobUrl);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
          URLObj.revokeObjectURL(blobUrl);
          reject(err);
        };
        img.src = blobUrl;
      } catch (err) {
        reject(err);
      }
    });
  }

  // 1. Xuất file PDF (Khổ giấy A4, Nằm Ngang, Full 100% trang cho học sinh tô màu + Trang 2 Đáp án BGK)
  function exportWorksheetPdf() {
    const data = getExportFormData();
    const printSvg = getCleanPrintSvg(false);
    const includeKey = document.getElementById('gmmExportIncludeAnswerKey')
      ? document.getElementById('gmmExportIncludeAnswerKey').checked
      : true;
    const answerKeySvg = includeKey ? getCleanPrintSvg(true) : '';

    const printWindow = window.open('', '_blank', 'width=1180,height=850');
    if (!printWindow) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép trình duyệt mở popup để in / lưu file PDF!', 'warning');
      }
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${data.title} - Khổ A4 Nằm Ngang</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 4mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
          }
          .a4-page {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 4px;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .header-left {
            font-size: 10pt;
            font-weight: bold;
            line-height: 1.3;
            text-transform: uppercase;
            max-width: 33%;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .header-center h1 {
            font-size: 15pt;
            margin: 0;
            text-transform: uppercase;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .header-center p {
            font-size: 9pt;
            margin: 2px 0 0;
            font-style: italic;
          }
          .header-right {
            border: 1.5px dashed #000;
            padding: 4px 10px;
            font-size: 9.5pt;
            font-weight: bold;
            border-radius: 4px;
            line-height: 1.35;
            min-width: 180px;
            text-align: left;
          }
          .legend-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            background: #f8fafc;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9pt;
            margin-bottom: 4px;
            border: 1.5px solid #000;
            justify-content: center;
            align-items: center;
          }
          .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-weight: bold;
          }
          .color-dot {
            width: 13px;
            height: 13px;
            border-radius: 3px;
            display: inline-block;
            border: 1px solid #000;
          }
          .matrix-canvas-box {
            width: 100%;
            flex: 1;
            min-height: 0;
            aspect-ratio: 800 / 520;
            max-height: calc(100vh - 105px);
            margin: 0 auto;
            border: 2px solid #000;
            border-radius: 4px;
            overflow: hidden;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .matrix-canvas-box svg {
            width: 100%;
            height: 100%;
            display: block;
          }
          .print-footer {
            margin-top: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            border-top: 1px solid #000;
            padding-top: 3px;
            font-style: italic;
          }
          .no-print {
            background: #0284c7;
            color: #ffffff;
            padding: 10px 18px;
            font-family: system-ui, sans-serif;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .no-print button {
            background: #ffffff;
            color: #0369a1;
            font-weight: 800;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 10pt;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .no-print button:hover {
            background: #f0f9ff;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            .a4-page {
              height: 100%;
              padding: 0;
            }
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <strong>📄 CHẾ ĐỘ XUẤT FILE PDF / IN A4 NẰM NGANG (${includeKey ? '2 TRANG: PHIẾU THI + ĐÁP ÁN BGK' : 'FULL TRANH'})</strong><br>
            <span style="font-size: 0.85rem; opacity: 0.95;">
              📌 Mẹo: Tại mục <strong>Máy in (Destination)</strong> -> Chọn <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> -> Chọn <strong>Khổ giấy A4, Hướng ngang (Landscape), Căn lề Tối thiểu (Minimum/None)</strong>!
            </span>
          </div>
          <button onclick="window.print()">
            🖨️ Bấm Vào Đây Để In / Lưu Dạng PDF (Ctrl+P)
          </button>
        </div>

        <!-- ==================== TRANG 1: PHIẾU HỌC SINH TÔ MÀU ==================== -->
        <div class="a4-page">
          <div class="print-header">
            <div class="header-left" style="display: flex; align-items: center; gap: 8px;">
              ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo Trường" style="height: 52px; width: 52px; object-fit: contain; border-radius: 4px; flex-shrink: 0;" />` : ''}
              <div>
                ${data.schoolNameHtml}
              </div>
            </div>
            <div class="header-center">
              <h1>${data.titleHtml}</h1>
              <p>Hoạt động giáo dục kỹ năng sống - Học sinh tô màu giải mã thông điệp bí mật</p>
            </div>
            <div class="header-right">
              ${data.teamLabelHtml}
            </div>
          </div>

          <div class="legend-bar">
            <span style="font-weight: 900;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</span>
            ${buildDynamicLegendGroups().map(g => `<span class="legend-item"><span class="color-dot" style="background: ${g.color};"></span> Câu ${g.qNums.join(', ')}: ${g.name}</span>`).join('')}
          </div>

          <div class="matrix-canvas-box">
            ${printSvg}
          </div>

          <div class="print-footer">
            <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
            <span>Điểm số: ......... / Chữ ký BGK: ................</span>
          </div>
        </div>

        ${includeKey ? `
        <!-- ==================== TRANG 2: BẢN ĐÁP ÁN MÀU BAN GIÁM KHẢO ==================== -->
        <div class="page-break"></div>
        <div class="a4-page" style="padding-top: 6px;">
          <div class="print-header" style="border-bottom: 2px solid #b91c1c;">
            <div class="header-left" style="color: #991b1b; display: flex; align-items: center; gap: 8px;">
              ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo Trường" style="height: 52px; width: 52px; object-fit: contain; border-radius: 4px; flex-shrink: 0;" />` : ''}
              <div>
                ${data.schoolNameHtml}<br>
                <span style="font-size: 8.5pt; color: #b91c1c; font-weight: bold;">HỘI ĐỒNG BAN GIÁM KHẢO</span>
              </div>
            </div>
            <div class="header-center">
              <h1 style="color: #991b1b; font-size: 14pt;">${data.titleHtml}</h1>
              <p style="color: #475569; font-weight: bold;">(Dành riêng cho Ban Giám Khảo đối chiếu kết quả 2 đội thi)</p>
            </div>
            <div class="header-right" style="border-color: #b91c1c; background: #fff1f2;">
              TIÊU CHÍ CHẤM ĐIỂM:<br>
              • Đúng ô màu: <strong>10đ</strong><br>
              • Thẩm mỹ & Đều màu: <strong>10đ</strong><br>
              • TỔNG ĐIỂM: <strong>20đ</strong>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex: 1; min-height: 0; align-items: stretch; margin-top: 4px;">
            <!-- Cột trái: Tranh màu chuẩn -->
            <div style="flex: 1.15; border: 2px solid #b91c1c; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
              <div style="background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 9pt; padding: 3px 6px; text-align: center; border-bottom: 1px solid #f87171;">
                🎨 BỨC TRANH MÀU HOÀN THIỆN ĐỐI CHIẾU (CHUẨN 100%)
              </div>
              <div class="matrix-canvas-box" style="flex: 1; border: none; aspect-ratio: auto; max-height: none;">
                ${answerKeySvg}
              </div>
            </div>

            <!-- Cột phải: Bảng 10 câu & Phiếu chấm điểm -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: bold; font-size: 9pt; color: #0f172a; margin-bottom: 3px;">
                  📋 BẢNG ĐÁP ÁN 10 CÂU & TỌA ĐỘ MÃ MÀU:
                </div>
                ${buildAnswerKeyTableHtml(false)}
              </div>

              <div>
                <div style="font-weight: bold; font-size: 9pt; color: #0f172a; margin-top: 3px; margin-bottom: 3px;">
                  ⚖️ PHIẾU GHI ĐIỂM BAN GIÁM KHẢO:
                </div>
                ${buildBgkRubricHtml(false)}
              </div>
            </div>
          </div>

          <div class="print-footer" style="margin-top: 4px; font-size: 8pt;">
            <span>* Lưu ý BGK: Mỗi câu trả lời đúng sẽ mở ra các ô có mã tương ứng. Các ô mã gây nhiễu nếu bị tô màu sẽ bị trừ điểm theo thang lỗi.</span>
            <span>Hệ thống Nền Tảng Lớp Học Vui Nhộn - Giải Mã Bí Mật 2026</span>
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    if (typeof window.showToast === 'function') {
      window.showToast(`📄 Đã mở bản in PDF Khổ A4 Nằm Ngang sẵn sàng (${includeKey ? '2 Trang gồm Đáp Án BGK' : '1 Trang'})!`, 'success');
    }
  }

  // 2. Xuất file Word (.doc) (Khổ giấy A4, Nằm Ngang, Dễ Chỉnh Sửa Trong Microsoft Word)
  async function exportWorksheetWord() {
    const data = getExportFormData();
    const printSvg = getCleanPrintSvg(false);
    const includeKey = document.getElementById('gmmExportIncludeAnswerKey')
      ? document.getElementById('gmmExportIncludeAnswerKey').checked
      : true;

    if (!printSvg) {
      if (typeof window.showToast === 'function') {
        window.showToast('Không thể tạo nội dung vector tranh!', 'error');
      }
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast('⏳ Đang kết xuất hình ảnh 300 DPI và tạo file Word (.doc)...', 'info');
    }

    try {
      // Chuyển vector SVG sang PNG độ phân giải cực nét 2400x1560 (300 DPI)
      let imageHtmlPage1 = '';
      try {
        const pngDataUrl = await convertSvgToHighResPng(printSvg, 2400, 1560);
        imageHtmlPage1 = `<img src="${pngDataUrl}" alt="Ma trận tranh tô màu" class="matrix-img" style="width: 100%; max-width: 100%; height: auto;" />`;
      } catch (_imgErr) {
        imageHtmlPage1 = `<div style="text-align: center;">${printSvg}</div>`;
      }

      let section2Html = '';
      if (includeKey) {
        const answerKeySvg = getCleanPrintSvg(true);
        let imageHtmlPage2 = '';
        try {
          const pngKeyDataUrl = await convertSvgToHighResPng(answerKeySvg, 2400, 1560);
          imageHtmlPage2 = `<img src="${pngKeyDataUrl}" alt="Đáp án tranh màu hoàn thiện" class="matrix-img" style="width: 100%; max-width: 100%; height: auto; border: 1.5pt solid #b91c1c;" />`;
        } catch (_imgErr2) {
          imageHtmlPage2 = `<div style="text-align: center;">${answerKeySvg}</div>`;
        }

        section2Html = `
          <br clear="all" style="page-break-before:always; mso-break-type:section-break">
          <div class="Section2">
            <table class="header-table" style="border-bottom: 2pt solid #b91c1c;">
              <tr>
                <td style="width: 32%; font-weight: bold; font-size: 10.5pt; text-transform: uppercase; color: #991b1b;">
                  <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                      ${data.schoolLogo ? `
                      <td style="vertical-align: middle; padding-right: 6pt; border: none;">
                        <img src="${data.schoolLogo}" width="45" height="45" style="width: 45pt; height: 45pt; object-fit: contain;" alt="Logo" />
                      </td>` : ''}
                      <td style="vertical-align: middle; border: none;">
                        ${data.schoolNameHtml}<br>
                        <span style="font-size: 9pt; color: #b91c1c; font-weight: normal;">HỘI ĐỒNG BAN GIÁM KHẢO</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 40%; text-align: center;">
                  <h1 style="font-size: 13.5pt; margin: 0; text-transform: uppercase; font-weight: bold; color: #991b1b;">
                    ${data.titleHtml}
                  </h1>
                  <div style="font-size: 9pt; font-style: italic; color: #475569;">
                    Bản đáp án chuẩn dành riêng cho Ban Giám Khảo đối chiếu kết quả
                  </div>
                </td>
                <td style="width: 28%; text-align: right;">
                  <div style="display: inline-block; border: 1.5pt solid #b91c1c; background: #fff1f2; padding: 3pt 8pt; font-size: 9pt; font-weight: bold; text-align: left;">
                    TIÊU CHÍ CHẤM:<br>
                    • Đúng ô màu: <strong>10đ</strong><br>
                    • Thẩm mỹ đều màu: <strong>10đ</strong><br>
                    • TỔNG ĐIỂM: <strong>20đ</strong>
                  </div>
                </td>
              </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 4pt;">
              <tr>
                <td style="width: 53%; vertical-align: top; padding-right: 8pt;">
                  <div style="border: 1.5pt solid #b91c1c; text-align: center; padding: 2pt; background: #fff;">
                    <div style="background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 9pt; padding: 2pt 4pt; margin-bottom: 3pt;">
                      🎨 BỨC TRANH MÀU HOÀN THIỆN ĐỐI CHIẾU (CHUẨN 100%)
                    </div>
                    ${imageHtmlPage2}
                  </div>
                </td>
                <td style="width: 47%; vertical-align: top;">
                  <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3pt; color: #0f172a;">
                    📋 BẢNG ĐÁP ÁN 10 CÂU & TỌA ĐỘ MÃ MÀU:
                  </div>
                  ${buildAnswerKeyTableHtml(true)}

                  <div style="font-weight: bold; font-size: 9.5pt; margin-top: 4pt; margin-bottom: 2pt; color: #0f172a;">
                    ⚖️ PHIẾU GHI ĐIỂM BAN GIÁM KHẢO:
                  </div>
                  ${buildBgkRubricHtml(true)}
                </td>
              </tr>
            </table>

            <table class="footer-table" style="margin-top: 6pt;">
              <tr>
                <td style="text-align: left;">
                  * Ban Giám Khảo đối chiếu tranh tô màu của 2 đội với bức tranh mẫu chuẩn bên trái để ghi nhận điểm số.
                </td>
                <td style="text-align: right; width: 35%; white-space: nowrap;">
                  Hội đồng chấm thi - Lớp học vui nhộn 2026
                </td>
              </tr>
            </table>
          </div>
        `;
      }

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${data.title}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 841.9pt 595.3pt; /* A4 Landscape: 297mm x 210mm */
              mso-page-orientation: landscape;
              margin: 15pt 20pt 15pt 20pt;
              mso-header-margin: 0pt;
              mso-footer-margin: 0pt;
            }
            div.Section1 {
              page: Section1;
            }
            @page Section2 {
              size: 841.9pt 595.3pt; /* A4 Landscape: 297mm x 210mm */
              mso-page-orientation: landscape;
              margin: 15pt 20pt 15pt 20pt;
              mso-header-margin: 0pt;
              mso-footer-margin: 0pt;
            }
            div.Section2 {
              page: Section2;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 11pt;
              color: #000000;
              margin: 0;
              padding: 0;
            }
            table.header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2pt solid #000000;
              margin-bottom: 5pt;
            }
            table.legend-table {
              width: 100%;
              border-collapse: collapse;
              border: 1.5pt solid #000000;
              background: #f8fafc;
              margin-bottom: 5pt;
            }
            table.legend-table td {
              padding: 3pt 6pt;
              font-size: 9.5pt;
              text-align: center;
              border: 1pt solid #cbd5e1;
            }
            .matrix-img {
              width: 100%;
              max-width: 100%;
              height: auto;
              border: 1.5pt solid #000000;
              display: block;
              margin: 0 auto;
            }
            table.footer-table {
              width: 100%;
              border-collapse: collapse;
              border-top: 1pt solid #000000;
              margin-top: 5pt;
              font-size: 9pt;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            <table class="header-table">
              <tr>
                <td style="width: 32%; font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">
                  <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                      ${data.schoolLogo ? `
                      <td style="vertical-align: middle; padding-right: 6pt; border: none;">
                        <img src="${data.schoolLogo}" width="45" height="45" style="width: 45pt; height: 45pt; object-fit: contain;" alt="Logo" />
                      </td>` : ''}
                      <td style="vertical-align: middle; border: none;">
                        ${data.schoolNameHtml}
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 38%; text-align: center;">
                  <h1 style="font-size: 13.5pt; margin: 0; text-transform: uppercase; font-weight: bold;">
                    ${data.titleHtml}
                  </h1>
                  <div style="font-size: 8.5pt; font-style: italic; margin-top: 2pt;">
                    Bức tranh ma trận ô màu đen trắng dành cho học sinh tô màu
                  </div>
                </td>
                <td style="width: 30%; text-align: right;">
                  <div style="display: inline-block; border: 1.5pt dashed #000; padding: 3pt 8pt; font-size: 9.5pt; font-weight: bold; text-align: left;">
                    ${data.teamLabelHtml}
                  </div>
                </td>
              </tr>
            </table>

            <table class="legend-table">
              <tr>
                <td style="font-weight: bold; background: #e2e8f0; width: 16%;">👉 MÃ MÀU TÔ:</td>
                ${buildDynamicLegendGroups().map(g => `<td><strong style="color: ${g.color};">■ ${g.name}:</strong> C${g.qNums.join(', C')}</td>`).join('')}
              </tr>
            </table>

            <div style="text-align: center; margin: 2pt 0;">
              ${imageHtmlPage1}
            </div>

            <table class="footer-table">
              <tr>
                <td style="text-align: left;">
                  * Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.
                </td>
                <td style="text-align: right; width: 30%; white-space: nowrap;">
                  Điểm số: ......... / Chữ ký BGK: ................
                </td>
              </tr>
            </table>
          </div>

          ${section2Html}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + wordHtml], {
        type: 'application/msword;charset=utf-8'
      });
      const downloadLink = document.createElement('a');
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `Phieu_Tranh_To_Mau_${data.safeTitle}_A4_Ngang.doc`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      if (typeof window.showToast === 'function') {
        window.showToast(`📝 Đã xuất file Word (.doc) khổ A4 ngang thành công (${includeKey ? '2 Trang gồm Đáp Án BGK' : '1 Trang'})!`, 'success');
      }
    } catch (err) {
      console.error('Word export error:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('Lỗi khi xuất file Word: ' + err.message, 'error');
      }
    }
  }

  // 3. In trực tiếp ra máy in
  function printWorksheetDirect() {
    exportWorksheetPdf();
  }

  // 4. Tải ảnh PNG 300 DPI
  async function downloadHighResPng() {
    const data = getExportFormData();
    const printSvg = getCleanPrintSvg();
    if (!printSvg) return;

    if (typeof window.showToast === 'function') {
      window.showToast('⏳ Đang tạo ảnh PNG 300 DPI...', 'info');
    }

    try {
      const pngDataUrl = await convertSvgToHighResPng(printSvg, 2400, 1560);
      const link = document.createElement('a');
      link.href = pngDataUrl;
      link.download = `Tranh_Ma_Tran_To_Mau_${data.safeTitle}_300DPI.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof window.showToast === 'function') {
        window.showToast('🖼️ Đã tải ảnh PNG nét cao 300 DPI thành công!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // 5. Tải file Vector SVG gốc
  function downloadVectorSvg() {
    const data = getExportFormData();
    const printSvg = getCleanPrintSvg();
    if (!printSvg) return;

    const blob = new Blob([printSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tranh_Vector_Ma_Tran_${data.safeTitle}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (typeof window.showToast === 'function') {
      window.showToast('📐 Đã tải file Vector SVG gốc thành công!', 'success');
    }
  }

  function printWorksheet() {
    openExportWorksheetModal();
  }

  // Lấy tên lớp học hiện tại phục vụ ảnh kỷ niệm
  function getSnapshotClassName() {
    try {
      if (window.studentsManager && typeof window.studentsManager.getCurrentClass === 'function') {
        const cls = window.studentsManager.getCurrentClass();
        if (cls) return cls;
      }
      const el = document.getElementById('landingNavClassName');
      if (el && el.textContent) {
        const txt = el.textContent.trim();
        const match = txt.match(/Lớp\s+[0-9A-Za-z\-_]+/i);
        if (match) return match[0];
        return txt.split('(')[0].trim();
      }
    } catch (_e) {}
    return 'Lớp 9A3';
  }

  // Tự động chụp và xuất bức ảnh kỷ niệm lớp học nghệ thuật chất lượng cao (Export Class Memory Snapshot)
  async function exportClassMemorySnapshot() {
    if (typeof window.showToast === 'function') {
      window.showToast('📸 Đang tạo bức ảnh kỷ niệm lớp học nghệ thuật 2K... Xin chờ trong giây lát!', 'info');
    }

    try {
      const className = getSnapshotClassName();
      const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
        ? window.GiaiMaPuzzle.getActivePuzzle()
        : null;
      const activeTitle = activePuzzle && activePuzzle.title ? activePuzzle.title : 'TRI ÂN THẦY CÔ 20/11';

      const totalA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      const totalB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      const pctA = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
        ? window.GiaiMaPuzzle.calculateProgress(gameState.teamA)
        : 0;
      const pctB = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
        ? window.GiaiMaPuzzle.calculateProgress(gameState.teamB)
        : 0;

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateTimeStr = `${timeStr} • Ngày ${dateStr}`;

      // 1. Tạo Canvas kích thước Full 2K tỉ lệ 3:2 (2160 x 1440)
      const canvas = document.createElement('canvas');
      canvas.width = 2160;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D');

      // 2. Nền Background gradient xanh navy huyền bí học đường
      const bgGrad = ctx.createLinearGradient(0, 0, 2160, 1440);
      bgGrad.addColorStop(0, '#070b16');
      bgGrad.addColorStop(0.4, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 2160, 1440);

      // Hiệu ứng ánh sáng tỏa tròn trung tâm (Ambient Radial Glow)
      const ambientGlow = ctx.createRadialGradient(1080, 720, 100, 1080, 720, 950);
      ambientGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      ambientGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, 2160, 1440);

      // Vẽ các hạt bụi sao lấp lánh (Sparkling Star Particles)
      const starSeeds = [
        [160, 200, 3], [340, 120, 2.5], [520, 280, 4], [800, 160, 2], [1300, 180, 3.5],
        [1680, 220, 2.8], [1950, 150, 4], [2020, 320, 2.2], [120, 780, 3], [2000, 850, 3.2],
        [180, 1250, 2.5], [1920, 1280, 3.8], [680, 1340, 2], [1450, 1320, 2.5]
      ];
      starSeeds.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Khung viền đôi hoàng kim nghệ thuật (Double Gold Frame)
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 2080, 1360);

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(52, 52, 2056, 1336);

      // Hoa văn 4 góc trang trọng
      const drawCorner = (cx, cy, dirX, dirY) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dirY * 36);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dirX * 36, cy);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();
      };
      drawCorner(64, 64, 1, 1);
      drawCorner(2096, 64, -1, 1);
      drawCorner(64, 1376, 1, -1);
      drawCorner(2096, 1376, -1, -1);
      ctx.restore();

      // 4. Header: Logo Trường THCS Tân Hải + Tiêu đề
      const logoUrl = getExportSchoolLogo() || DEFAULT_SCHOOL_LOGO;
      try {
        const logoImg = await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = logoUrl;
        });

        if (logoImg) {
          ctx.save();
          // Vẽ nền trắng bo tròn và viền huy hiệu
          ctx.beginPath();
          ctx.arc(145, 145, 54, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
          ctx.shadowBlur = 18;
          ctx.stroke();

          // Clip và vẽ logo
          ctx.clip();
          ctx.drawImage(logoImg, 91, 91, 108, 108);
          ctx.restore();
        }
      } catch (_e) {}

      // Tiêu đề nhà trường & hoạt động
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText('TRƯỜNG THCS TÂN HẢI - TỈNH LÂM ĐỒNG', 225, 128);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('HOẠT ĐỘNG TRẢI NGHIỆM • TRÒ CHƠI HỌC ĐƯỜNG GIẢI MÃ BÍ MẬT', 225, 162);

      // Thẻ lớp học & thời gian bên phải
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      const metaBoxW = 460;
      const metaBoxH = 76;
      const metaBoxX = 2080 - metaBoxW;
      const metaBoxY = 100;
      ctx.fillRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH);
      ctx.strokeRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText(`🏫 ${className.toUpperCase()}`, 2060, 134);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 17px Arial, sans-serif';
      ctx.fillText(`⏱️ ${dateTimeStr}`, 2060, 162);

      // Tiêu đề bức tranh trung tâm
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
      ctx.shadowBlur = 20;
      ctx.font = '900 40px Arial, sans-serif';
      ctx.fillText(`🌺 BỨC TRANH NGHỆ THUẬT: “${activeTitle}” 🌺`, 1080, 248);
      ctx.shadowBlur = 0;

      // 5. Body: Vẽ 2 Bức Tranh của 2 Đội song song
      const svgA = generateSvgPuzzle('teamA');
      const svgB = generateSvgPuzzle('teamB');

      const pngDataA = await convertSvgToHighResPng(svgA, 1600, 1040);
      const pngDataB = await convertSvgToHighResPng(svgB, 1600, 1040);

      const [imgA, imgB] = await Promise.all([
        new Promise(res => { const img = new Image(); img.onload = () => res(img); img.src = pngDataA; }),
        new Promise(res => { const img = new Image(); img.onload = () => res(img); img.src = pngDataB; })
      ]);

      const canvasW = 940;
      const canvasH = 610;
      const yPos = 310;

      // Khung tranh Đội 1
      const xA = 110;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.35)';
      ctx.shadowBlur = 24;
      ctx.fillRect(xA, yPos, canvasW, canvasH);
      ctx.strokeRect(xA, yPos, canvasW, canvasH);
      ctx.shadowBlur = 0;

      if (imgA) {
        ctx.drawImage(imgA, xA + 6, yPos + 6, canvasW - 12, canvasH - 12);
      }

      // Nhãn điểm Đội 1
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(xA, yPos + canvasH + 12, canvasW, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔴 ĐỘI 1 (ĐỘI A)  •  TIẾN ĐỘ: ${pctA}%  •  ĐIỂM SỐ: ${totalA} ĐIỂM`, xA + canvasW / 2, yPos + canvasH + 48);

      // Khung tranh Đội 2
      const xB = 1110;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.35)';
      ctx.shadowBlur = 24;
      ctx.fillRect(xB, yPos, canvasW, canvasH);
      ctx.strokeRect(xB, yPos, canvasW, canvasH);
      ctx.shadowBlur = 0;

      if (imgB) {
        ctx.drawImage(imgB, xB + 6, yPos + 6, canvasW - 12, canvasH - 12);
      }

      // Nhãn điểm Đội 2
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(xB, yPos + canvasH + 12, canvasW, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔵 ĐỘI 2 (ĐỘI B)  •  TIẾN ĐỘ: ${pctB}%  •  ĐIỂM SỐ: ${totalB} ĐIỂM`, xB + canvasW / 2, yPos + canvasH + 48);

      // 6. Footer: Slogan & Bản quyền học đường
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('⭐ LỚP HỌC VUI NHỘN - NỀN TẢNG DẠY HỌC TƯƠNG TÁC SỐ TRƯỜNG THCS TÂN HẢI ⭐', 1080, 1315);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 16px Arial, sans-serif';
      ctx.fillText('Học vui mỗi ngày – Tự tin tỏa sáng • Tôn vinh tinh thần đoàn kết, trí tuệ & sáng tạo tuổi học trò!', 1080, 1345);

      // 7. Tự động tải về file PNG
      const link = document.createElement('a');
      const safeClass = className.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const dateSafe = dateStr.replace(/\//g, '-');
      link.download = `Ky-Niem-Giai-Ma-Tranh_${safeClass}_${dateSafe}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.audioManager && typeof window.audioManager.playVictoryChime === 'function') {
        window.audioManager.playVictoryChime();
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`📸 Đã xuất bức ảnh kỷ niệm lớp ${className} thành công! Thầy có thể gửi ngay vào nhóm Zalo phụ huynh!`, 'success');
      }
    } catch (err) {
      console.error('Lỗi khi xuất ảnh kỷ niệm:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Không thể xuất ảnh kỷ niệm: ' + (err.message || 'Lỗi xử lý đồ họa'), 'error');
      }
    }
  }

      return {
        switchExportPreviewPage,
        getCleanPrintSvg,
        buildAnswerKeyTableHtml,
        buildBgkRubricHtml,
        getExportSchoolLogo,
        handleLogoUpload,
        removeLogo,
        renderLogoUI,
        appendExtraInfoTemplate,
        formatTextLines,
        getExportFormData,
        buildDynamicLegendGroups,
        updateExportPreview,
        openExportWorksheetModal,
        closeExportModal,
        exportWorksheetPdf,
        exportWorksheetWord,
        printWorksheetDirect,
        downloadHighResPng,
        downloadVectorSvg,
        printWorksheet,
        getSnapshotClassName,
        exportClassMemorySnapshot
      };
    }
  };
})();
