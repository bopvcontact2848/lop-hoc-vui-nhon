/**
 * ==============================================================================
 * MODULE XUẤT BỘ ĐỀ TRẮC NGHIỆM NHIỀU MÃ ĐỀ RA FILE WORD (.DOCX) CHUẨN TIMES NEW ROMAN
 * File: scripts/gmmDocxVariantsExport.js
 * Trách nhiệm:
 *   1. Đóng gói file .docx chuẩn OpenXML (PKZIP Store thuần JS — chạy 100% offline không cần CDN)
 *   2. Định dạng toàn bộ văn bản chuẩn phông Times New Roman cỡ 13pt (26 half-points)
 *   3. Chuyển đổi ký hiệu Toán/Lý/Hóa KaTeX ($x^2$, \frac{a}{b}, H_2O...) sang ký hiệu Word sạch đẹp
 *   4. Tự động xuất đầy đủ từng Mã đề 101–104 (ngắt trang riêng mỗi mã) + Bảng đáp án đối chiếu cuối file
 * ==============================================================================
 */
(function initGmmDocxVariantsExport() {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];

  const SUPERSCRIPT_MAP = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ'
  };

  const SUBSCRIPT_MAP = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
  };

  const CRC_TABLE = (function buildCrcTable() {
    const tbl = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      tbl[n] = c >>> 0;
    }
    return tbl;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function encodeUtf8(str) {
    const s = String(str == null ? '' : str);
    if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(s);
    }
    const utf8 = unescape(encodeURIComponent(s));
    const arr = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
      arr[i] = utf8.charCodeAt(i);
    }
    return arr;
  }

  function xmlEsc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function mapScriptChars(raw, table) {
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (table[ch]) out += table[ch];
      else return null;
    }
    return out;
  }

  /**
   * Chuyển các biểu thức LaTeX / KaTeX đơn giản sang chữ & ký hiệu Unicode rõ nét để biên tập tiếp trên MS Word.
   */
  function formatFormulaForWord(rawText) {
    let text = String(rawText == null ? '' : rawText).trim();
    if (!text) return '';

    text = text
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\sqrt\s+([A-Za-z0-9]+)/g, '√$1')
      .replace(/\\(times|cdot)/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\pm/g, '±')
      .replace(/\\leq?/g, '≤')
      .replace(/\\geq?/g, '≥')
      .replace(/\\neq?/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\infty/g, '∞')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\pi/g, 'π')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\omega/g, 'ω')
      .replace(/\\mu/g, 'μ')
      .replace(/\\degree|\\circ/g, '°')
      .replace(/\\rightarrow|\\to/g, '→')
      .replace(/\\leftrightarrow/g, '↔')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\mathrm\{([^{}]*)\}/g, '$1');

    text = text.replace(/\^\{([^{}]+)\}/g, (m, inner) => mapScriptChars(inner, SUPERSCRIPT_MAP) || `^(${inner})`);
    text = text.replace(/\^([0-9+\-ni])/g, (m, ch) => SUPERSCRIPT_MAP[ch] || m);
    text = text.replace(/_\{([^{}]+)\}/g, (m, inner) => mapScriptChars(inner, SUBSCRIPT_MAP) || `_${inner}`);
    text = text.replace(/_([0-9+\-])/g, (m, ch) => SUBSCRIPT_MAP[ch] || m);

    return text
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Đóng gói mảng [{ name, data: Uint8Array|string }] thành file PKZIP (phương thức Store = 0).
   */
  function createZipBytes(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach((entry) => {
      const nameBytes = encodeUtf8(entry.name);
      const dataBytes = entry.data instanceof Uint8Array ? entry.data : encodeUtf8(entry.data);
      const crc = crc32(dataBytes);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lView = new DataView(localHeader.buffer);
      lView.setUint32(0, 0x04034b50, true);
      lView.setUint16(4, 20, true);
      lView.setUint16(6, 0x0800, true); // UTF-8 filename flag
      lView.setUint16(8, 0, true); // Store (no compression)
      lView.setUint16(10, 0, true);
      lView.setUint16(12, 0x5421, true);
      lView.setUint32(14, crc, true);
      lView.setUint32(18, dataBytes.length, true);
      lView.setUint32(22, dataBytes.length, true);
      lView.setUint16(26, nameBytes.length, true);
      lView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      const cdHeader = new Uint8Array(46 + nameBytes.length);
      const cView = new DataView(cdHeader.buffer);
      cView.setUint32(0, 0x02014b50, true);
      cView.setUint16(4, 20, true);
      cView.setUint16(6, 20, true);
      cView.setUint16(8, 0x0800, true);
      cView.setUint16(10, 0, true);
      cView.setUint16(12, 0, true);
      cView.setUint16(14, 0x5421, true);
      cView.setUint32(16, crc, true);
      cView.setUint32(20, dataBytes.length, true);
      cView.setUint32(24, dataBytes.length, true);
      cView.setUint16(28, nameBytes.length, true);
      cView.setUint16(30, 0, true);
      cView.setUint16(32, 0, true);
      cView.setUint16(34, 0, true);
      cView.setUint16(36, 0, true);
      cView.setUint32(38, 0, true);
      cView.setUint32(42, offset, true);
      cdHeader.set(nameBytes, 46);

      centralParts.push(cdHeader);
      offset += localHeader.length + dataBytes.length;
    });

    const cdSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const eView = new DataView(eocd.buffer);
    eView.setUint32(0, 0x06054b50, true);
    eView.setUint16(4, 0, true);
    eView.setUint16(6, 0, true);
    eView.setUint16(8, entries.length, true);
    eView.setUint16(10, entries.length, true);
    eView.setUint32(12, cdSize, true);
    eView.setUint32(16, offset, true);
    eView.setUint16(20, 0, true);

    const totalSize = offset + cdSize + eocd.length;
    const out = new Uint8Array(totalSize);
    let ptr = 0;
    localParts.forEach((p) => { out.set(p, ptr); ptr += p.length; });
    centralParts.forEach((p) => { out.set(p, ptr); ptr += p.length; });
    out.set(eocd, ptr);
    return out;
  }

  function buildRunXml(text, opts) {
    const o = opts || {};
    const size = o.size || 26;
    const rPrParts = [
      '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>',
      o.bold ? '<w:b/>' : '',
      o.italic ? '<w:i/>' : '',
      o.color ? `<w:color w:val="${xmlEsc(o.color)}"/>` : '',
      `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`
    ].join('');
    return `<w:r><w:rPr>${rPrParts}</w:rPr><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
  }

  function buildParagraphXml(runsXml, opts) {
    const o = opts || {};
    const alignXml = o.align ? `<w:jc w:val="${o.align}"/>` : '';
    const spaceXml = `<w:spacing w:before="${o.before != null ? o.before : 20}" w:after="${o.after != null ? o.after : 60}" w:line="276" w:lineRule="auto"/>`;
    const keepNext = o.keepNext ? '<w:keepNext/>' : '';
    const keepLines = '<w:keepLines/>';
    return `<w:p><w:pPr>${keepNext}${keepLines}${spaceXml}${alignXml}</w:pPr>${runsXml}</w:p>`;
  }

  function buildVariantHeaderTableXml(schoolName, examTitle, subjectTitle, code, questionCount) {
    return `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="9355" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
            <w:insideH w:val="none"/><w:insideV w:val="none"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid><w:gridCol w:w="4100"/><w:gridCol w:w="5255"/></w:tblGrid>
        <w:tr>
          <w:tc>
            <w:tcPr><w:tcW w:w="4100" w:type="dxa"/></w:tcPr>
            ${buildParagraphXml(buildRunXml(schoolName || 'TRƯỜNG THCS TÂN HẢI', { bold: true, size: 24 }), { align: 'center', after: 20 })}
            ${buildParagraphXml(buildRunXml('TỔ CHUYÊN MÔN', { size: 22, italic: true }), { align: 'center', after: 20 })}
            ${buildParagraphXml(buildRunXml(`(Đề gồm ${questionCount} câu trắc nghiệm)`, { size: 20, italic: true }), { align: 'center', after: 0 })}
          </w:tc>
          <w:tc>
            <w:tcPr><w:tcW w:w="5255" w:type="dxa"/></w:tcPr>
            ${buildParagraphXml(buildRunXml(examTitle || 'ĐỀ KIỂM TRA TRẮC NGHIỆM', { bold: true, size: 26 }), { align: 'center', after: 20 })}
            ${buildParagraphXml(buildRunXml(`Chủ đề: ${subjectTitle || 'Tổng hợp'}`, { bold: true, size: 24 }), { align: 'center', after: 40 })}
            ${buildParagraphXml(buildRunXml(`MÃ ĐỀ: ${code}`, { bold: true, size: 26, color: '0F172A' }), { align: 'center', after: 0 })}
          </w:tc>
        </w:tr>
      </w:tbl>
    `;
  }

  function buildAnswerKeyTableChunkXml(variants, startIdx, endIdx) {
    const colCount = 1 + (endIdx - startIdx);
    const totalW = 9355;
    const firstW = 1350;
    const cellW = Math.max(420, Math.floor((totalW - firstW) / Math.max(1, colCount - 1)));
    const gridCols = [`<w:gridCol w:w="${firstW}"/>`];
    for (let c = startIdx; c < endIdx; c++) gridCols.push(`<w:gridCol w:w="${cellW}"/>`);

    const headerCells = [
      `<w:tc><w:tcPr><w:tcW w:w="${firstW}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/></w:tcPr>${buildParagraphXml(buildRunXml('Mã Đề', { bold: true, size: 22 }), { align: 'center', before: 20, after: 20 })}</w:tc>`
    ];
    for (let q = startIdx; q < endIdx; q++) {
      headerCells.push(
        `<w:tc><w:tcPr><w:tcW w:w="${cellW}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/></w:tcPr>${buildParagraphXml(buildRunXml(`C${q + 1}`, { bold: true, size: 22 }), { align: 'center', before: 20, after: 20 })}</w:tc>`
      );
    }

    const bodyRows = variants.map((v) => {
      const cells = [
        `<w:tc><w:tcPr><w:tcW w:w="${firstW}" w:type="dxa"/></w:tcPr>${buildParagraphXml(buildRunXml(`Mã ${v.code}`, { bold: true, size: 22 }), { align: 'center', before: 20, after: 20 })}</w:tc>`
      ];
      for (let q = startIdx; q < endIdx; q++) {
        const item = v.questions && v.questions[q];
        const letter = item ? (LETTERS[item.correct] || 'A') : '-';
        cells.push(
          `<w:tc><w:tcPr><w:tcW w:w="${cellW}" w:type="dxa"/></w:tcPr>${buildParagraphXml(buildRunXml(letter, { bold: true, size: 22, color: 'B91C1C' }), { align: 'center', before: 20, after: 20 })}</w:tc>`
        );
      }
      return `<w:tr>${cells.join('')}</w:tr>`;
    });

    return `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="${totalW}" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="475569"/>
            <w:left w:val="single" w:sz="6" w:space="0" w:color="475569"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="475569"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="475569"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>${gridCols.join('')}</w:tblGrid>
        <w:tr>${headerCells.join('')}</w:tr>
        ${bodyRows.join('')}
      </w:tbl>
    `;
  }

  function buildDocumentXml(variants, meta) {
    const m = meta || {};
    const schoolName = formatFormulaForWord(m.schoolName || 'TRƯỜNG THCS TÂN HẢI');
    const examTitle = formatFormulaForWord(m.examTitle || 'ĐỀ KIỂM TRA TRẮC NGHIỆM');
    const subjectTitle = formatFormulaForWord(m.subjectTitle || 'Bộ đề ôn tập');
    const bodyParts = [];

    variants.forEach((v, vIdx) => {
      if (vIdx > 0) {
        bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      }
      bodyParts.push(buildVariantHeaderTableXml(schoolName, examTitle, subjectTitle, v.code, (v.questions || []).length));
      bodyParts.push(buildParagraphXml(
        buildRunXml('Họ và tên học sinh: .........................................................   Lớp: ...............   SBD: .............', { size: 24 }),
        { before: 100, after: 120 }
      ));

      (v.questions || []).forEach((q, qIdx) => {
        const stem = formatFormulaForWord(q.rawQuestion != null ? q.rawQuestion : q.question);
        bodyParts.push(buildParagraphXml(
          buildRunXml(`Câu ${qIdx + 1}: `, { bold: true, size: 26 }) + buildRunXml(stem, { size: 26 }),
          { before: 90, after: 30, keepNext: true }
        ));

        const opts = Array.isArray(q.rawOptions) ? q.rawOptions : (Array.isArray(q.options) ? q.options : []);
        const cleanedOpts = [0, 1, 2, 3].map((oi) => formatFormulaForWord(opts[oi] || ''));
        const allShort = cleanedOpts.every((t) => t.length > 0 && t.length <= 24);
        if (allShort) {
          bodyParts.push(buildParagraphXml(
            buildRunXml(`    A. ${cleanedOpts[0]}        B. ${cleanedOpts[1]}`, { size: 25 }),
            { before: 10, after: 20 }
          ));
          bodyParts.push(buildParagraphXml(
            buildRunXml(`    C. ${cleanedOpts[2]}        D. ${cleanedOpts[3]}`, { size: 25 }),
            { before: 0, after: 45 }
          ));
        } else {
          cleanedOpts.forEach((optText, oIdx) => {
            bodyParts.push(buildParagraphXml(
              buildRunXml(`    ${LETTERS[oIdx]}. `, { bold: true, size: 25 }) + buildRunXml(optText, { size: 25 }),
              { before: 10, after: oIdx === 3 ? 45 : 15 }
            ));
          });
        }
      });

      bodyParts.push(buildParagraphXml(
        buildRunXml(`--- HẾT MÃ ĐỀ ${v.code} ---`, { bold: true, italic: true, size: 24 }),
        { align: 'center', before: 140, after: 40 }
      ));
    });

    // Bảng đáp án cuối file
    const maxQ = variants.reduce((mx, v) => Math.max(mx, (v.questions || []).length), 0);
    if (maxQ > 0) {
      bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      bodyParts.push(buildParagraphXml(
        buildRunXml(`BẢNG ĐÁP ÁN ĐỐI CHIẾU CÁC MÃ ĐỀ (${variants.length} MÃ ĐỀ)`, { bold: true, size: 28 }),
        { align: 'center', before: 40, after: 40 }
      ));
      bodyParts.push(buildParagraphXml(
        buildRunXml(`Chủ đề: ${subjectTitle} • Dành cho Giáo viên chấm bài`, { italic: true, size: 24 }),
        { align: 'center', before: 0, after: 140 }
      ));
      for (let start = 0; start < maxQ; start += 10) {
        const end = Math.min(maxQ, start + 10);
        bodyParts.push(buildAnswerKeyTableChunkXml(variants, start, end));
        bodyParts.push(buildParagraphXml(buildRunXml('', { size: 18 }), { before: 20, after: 60 }));
      }
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }

  function buildDocxBytes(variants, meta) {
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Không có mã đề nào để xuất file Word.');
    }

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>
        <w:sz w:val="26"/><w:szCs w:val="26"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>
      <w:sz w:val="26"/><w:szCs w:val="26"/>
    </w:rPr>
  </w:style>
</w:styles>`;

    const documentXml = buildDocumentXml(variants, meta);
    return createZipBytes([
      { name: '[Content_Types].xml', data: contentTypesXml },
      { name: '_rels/.rels', data: rootRelsXml },
      { name: 'word/_rels/document.xml.rels', data: docRelsXml },
      { name: 'word/styles.xml', data: stylesXml },
      { name: 'word/document.xml', data: documentXml }
    ]);
  }

  function exportVariantsToDocx(variants, meta) {
    const bytes = buildDocxBytes(variants, meta);
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    const url = URL.createObjectURL(blob);
    const safeTitle = String((meta && meta.subjectTitle) || 'BoDeTracNghiem')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
      .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'BoDeTracNghiem';
    const codesTag = (variants || []).map((v) => v.code).join('-');
    const fileName = `De_${safeTitle}_Ma_${codesTag || '101'}.docx`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, fileName, byteLength: bytes.length };
  }

  window.GmmDocxVariantsExport = {
    formatFormulaForWord,
    createZipBytes,
    buildDocxBytes,
    exportVariantsToDocx
  };
})();
