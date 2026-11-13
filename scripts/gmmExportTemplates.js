/**
 * ==============================================================================
 * MODULE MẪU HTML/CSS XUẤT PDF & WORD (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmExportTemplates.js
 * Trách nhiệm: Dựng SVG sạch, bảng đáp án 10 câu, bảng chấm BGK và chuỗi HTML
 * khổ A4 nằm ngang phục vụ in PDF và xuất Microsoft Word (.doc).
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmExportTemplates = {
    create: function (ctx) {
      const { getExportSchoolLogo } = ctx;

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

      function buildPdfPrintHtml(data, printSvg, answerKeySvg, includeKey) {
        return `
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
      }

      function buildWordSection2Html(data, imageHtmlPage2) {
        return `
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

      function buildWordExportHtml(data, imageHtmlPage1, section2Html) {
        return `
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
      }

      return {
        getCleanPrintSvg,
        buildAnswerKeyTableHtml,
        buildBgkRubricHtml,
        formatTextLines,
        getExportFormData,
        buildDynamicLegendGroups,
        buildPdfPrintHtml,
        buildWordSection2Html,
        buildWordExportHtml
      };
    }
  };
})();
