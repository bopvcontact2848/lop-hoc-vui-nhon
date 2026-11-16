/**
 * ==============================================================================
 * MODULE XUẤT TRANH VECTOR SVG & PDF CHUẨN IN KHỔ LỚN (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleVectorExport.js
 * Trách nhiệm: Xuất tệp SVG vector vô cực và mở bản in PDF khổ A1/A0/A4.
 * ==============================================================================
 */
(function () {
  'use strict';

  function exportSvgVector(puzzleData, mode = 'stage') {
    const store = window.GiaiMaPuzzlePresetStore;
    const isStageOnly = (mode === 'stage');
    const showFooterLegend = puzzleData ? (puzzleData.showFooterLegend !== false) : true;
    const defaultHeader = store ? store.getSavedPrintHeader() : '';
    const defaultRightNote = store ? store.getSavedPrintRightNote() : '';
    const printHeaderText = String((puzzleData && puzzleData.printHeader !== undefined) ? puzzleData.printHeader : defaultHeader).trim();
    const printRightNoteText = String((puzzleData && puzzleData.printRightNote !== undefined) ? puzzleData.printRightNote : defaultRightNote).trim();
    const hasTopHeader = Boolean((printHeaderText || printRightNoteText) && window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.buildTopHeaderSvgGroup === 'function');
    const width = 800;
    const minY = hasTopHeader ? -34 : 0;
    const height = (showFooterLegend ? 568 : 520) + (hasTopHeader ? 34 : 0);
    const cells = (puzzleData && puzzleData.cells) ? puzzleData.cells : [];
    const strokeW = (puzzleData && parseFloat(puzzleData.strokeWidth) > 0) ? parseFloat(puzzleData.strokeWidth) : 1.8;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${minY} ${width} ${height}" width="${isStageOnly ? '841mm' : '297mm'}" height="${isStageOnly ? '594mm' : '210mm'}">
  <style>
    .cell { fill: #ffffff; stroke: #000000; stroke-width: ${strokeW}; stroke-linejoin: round; }
    .label { font-family: 'Arial', sans-serif; font-size: 10px; font-weight: bold; fill: #000000; text-anchor: middle; dominant-baseline: central; }
  </style>
  <rect x="0" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/>
`;

    if (hasTopHeader) {
      svg += window.GiaiMaPuzzle.buildTopHeaderSvgGroup(puzzleData, {
        printHeader: printHeaderText,
        printRightNote: printRightNoteText
      }) + '\n';
    }

    cells.forEach(cell => {
      const fsize = cell.fontSize || 10;
      svg += `  <path class="cell" d="${cell.d}" />\n`;
      svg += `  <text class="label" x="${cell.labelPos[0]}" y="${cell.labelPos[1]}" font-size="${fsize}">${cell.code}</text>\n`;
    });

    if (showFooterLegend && window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.buildFooterLegendSvgGroup === 'function') {
      svg += window.GiaiMaPuzzle.buildFooterLegendSvgGroup(puzzleData, { isSolvedAnswerKey: false }) + '\n';
    }

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (puzzleData.title || 'Ma_Tran_Giai_Ma').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `${safeTitle}_${mode.toUpperCase()}_VECTOR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPdfVector(puzzleData, mode = 'stage') {
    const store = window.GiaiMaPuzzlePresetStore;
    const DEFAULT_PRINT_HEADER = store ? store.DEFAULT_PRINT_HEADER : 'TRƯỜNG THCS TÂN HẢI - HOẠT ĐỘNG DẠY HỌC TÍCH CỰC';
    const DEFAULT_PRINT_RIGHT_NOTE = store ? store.DEFAULT_PRINT_RIGHT_NOTE : 'ĐỘI THI: .............................';
    const defaultHeader = store ? store.getSavedPrintHeader() : DEFAULT_PRINT_HEADER;
    const defaultRightNote = store ? store.getSavedPrintRightNote() : DEFAULT_PRINT_RIGHT_NOTE;

    const isStage = (mode === 'stage');
    const safeTitle = (puzzleData && puzzleData.title) ? puzzleData.title : 'BỨC TRANH BÍ ẨN';
    const strokeW = (puzzleData && parseFloat(puzzleData.strokeWidth) > 0) ? parseFloat(puzzleData.strokeWidth) : 1.8;
    const showFooterLegend = puzzleData ? (puzzleData.showFooterLegend !== false) : true;
    const rawPrintHeader = String((puzzleData && puzzleData.printHeader !== undefined) ? puzzleData.printHeader : defaultHeader).trim();
    const rawPrintRightNote = String((puzzleData && puzzleData.printRightNote !== undefined) ? puzzleData.printRightNote : defaultRightNote).trim();
    const rightNoteHtml = (rawPrintRightNote || DEFAULT_PRINT_RIGHT_NOTE)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const headerLinesHtml = (rawPrintHeader || DEFAULT_PRINT_HEADER)
      .split(/\n| - | • /)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('<br>');

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép mở cửa sổ popup để in / tải PDF Vector!', 'warning');
      }
      return;
    }

    const svgContent = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function')
      ? window.GiaiMaPuzzle.renderSvgMatrix('export_pdf', {}, {
          isPrint: true,
          strokeWidth: strokeW,
          showFooterLegend: showFooterLegend,
          puzzle: puzzleData
        })
      : '<p>Không thể tạo SVG</p>';

    let legendHtml = '';
    const colorRules = (puzzleData && puzzleData.colorRules)
      ? puzzleData.colorRules
      : (window.GiaiMaPuzzle ? window.GiaiMaPuzzle.COLOR_RULES : null);

    if (colorRules && !showFooterLegend) {
      const colorGroups = {};
      Object.keys(colorRules).forEach(code => {
        const item = colorRules[code];
        if (!item) return;
        const col = item.color || '#dc2626';
        if (!colorGroups[col]) {
          colorGroups[col] = {
            color: col,
            name: item.name || 'Màu',
            questions: []
          };
        }
        if (item.qNum && !colorGroups[col].questions.includes(item.qNum)) {
          colorGroups[col].questions.push(item.qNum);
        }
      });

      const itemsHtml = Object.values(colorGroups).map(grp => {
        grp.questions.sort((a, b) => a - b);
        const qText = grp.questions.length > 1
          ? `Câu ${grp.questions.join(', Câu ')}`
          : `Câu ${grp.questions[0] || 1}`;
        return `
          <span style="display: inline-flex; align-items: center; gap: 5px; font-weight: bold; margin: 2px 6px;">
            <span style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid #000; background: ${grp.color};"></span>
            ${qText}: ${grp.name}
          </span>
        `;
      }).join('');

      legendHtml = `
        <div class="legend-bar" style="display: flex; flex-wrap: wrap; gap: 8px; background: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 10pt; margin-bottom: 8px; border: 1.5px solid #000; justify-content: center; align-items: center;">
          <strong style="color: #000;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</strong>
          ${itemsHtml}
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH MA TRẬN</title>
        <style>
          @page {
            size: ${isStage ? 'A1 landscape' : 'A4 landscape'};
            margin: ${isStage ? '12mm' : '8mm'};
          }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #000;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .title-text h1 {
            font-size: ${isStage ? '26pt' : '16pt'};
            margin: 0;
            text-transform: uppercase;
            text-align: center;
          }
          .canvas-box {
            width: 100%;
            height: ${showFooterLegend ? (isStage ? '84vh' : '74vh') : (isStage ? '80vh' : '68vh')};
            border: 2px solid #000;
            border-radius: 8px;
            overflow: hidden;
          }
          .notice-box {
            background: #e0f2fe;
            border: 1px solid #0284c7;
            padding: 10px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print notice-box">
          <div>
            <strong>📐 Bản in Vector Khổ ${isStage ? 'A1 / A0 (In Bạt Sân Khấu)' : 'A4 / A3 (Phiếu Học Sinh)'} • Nét viền ${strokeW}px${showFooterLegend ? ' • Có Bảng Chú Giải 10 Màu Dưới Chân Tranh' : ''}:</strong>
            <span> Độ phân giải chuẩn Vector cực nét, không bị răng cưa khi phóng to.</span>
          </div>
          <button onclick="window.print()" style="background: #0284c7; color: #fff; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            🖨️ In / Lưu Dạng PDF (Ctrl+P)
          </button>
        </div>

        <div class="header-bar">
          <div style="font-size: 11pt; font-weight: bold; line-height: 1.3; text-transform: uppercase;">
            ${headerLinesHtml}
          </div>
          <div class="title-text">
            <h1>GIẢI MÃ BỨC TRANH BÍ ẨN</h1>
            ${isStage ? `<div style="font-size: 11pt; color: #475569; font-weight: bold; margin-top: 4px;">(Bản bạt sân khấu - Đối soát Ban Giám Khảo: ${safeTitle})</div>` : ''}
          </div>
          <div style="font-size: 11pt; font-weight: bold; text-align: right;">
            ${rightNoteHtml}<br>
            KHỔ: <strong>${isStage ? 'A1 / A0' : 'A4 / A3'}</strong>
          </div>
        </div>

        ${legendHtml}

        <div class="canvas-box">
          ${svgContent}
        </div>

        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 9.5pt; font-style: italic; border-top: 1px solid #000; padding-top: 6px;">
          <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
          <span>Ban Giám Khảo chấm điểm độ chính xác và tính thẩm mỹ</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  window.GiaiMaPuzzleVectorExport = {
    exportSvgVector,
    exportPdfVector
  };
})();
