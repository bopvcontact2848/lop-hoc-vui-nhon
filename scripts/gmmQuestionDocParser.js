/**
 * ==============================================================================
 * MODULE ĐỌC FILE WORD (.DOCX) & PHÂN TÍCH VĂN BẢN DÁN CÂU HỎI THÔNG MINH
 * File: scripts/gmmQuestionDocParser.js
 * Trách nhiệm:
 *   1. Đọc trực tiếp file .docx trong trình duyệt (PKZIP + word/document.xml)
 *   2. Nhận diện văn bản dán (cả Plain Text lẫn Rich HTML từ Word/Google Docs)
 *   3. Tự động tách câu hỏi, 4 phương án A/B/C/D, nhận diện đáp án đúng
 *      (qua ký hiệu * / (Đúng), dòng "Đáp án:", Bảng đáp án cuối đề,
 *       hoặc định dạng gạch chân / tô màu / bôi vàng / in đậm duy nhất từ Word)
 *   4. Tự động dàn trải đều thành đủ 10 câu hỏi chuẩn cho Đấu trường Giải Mã
 * ==============================================================================
 */

(function () {
  'use strict';

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
  const LETTER_INDEX_MAP = { A: 0, B: 1, C: 2, D: 3 };

  function decodeUtf8(bytes) {
    if (typeof window.TextDecoder === 'function') {
      return new window.TextDecoder('utf-8').decode(bytes);
    }
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(bytes[i]);
    }
    try {
      return decodeURIComponent(escape(out));
    } catch (_e) {
      return out;
    }
  }

  function findZipEocdOffset(bytes) {
    const minOffset = Math.max(0, bytes.length - 65558);
    for (let i = bytes.length - 22; i >= minOffset; i--) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
        return i;
      }
    }
    return -1;
  }

  async function inflateRawBytes(compressedBytes) {
    if (typeof window.DecompressionStream === 'undefined' || typeof window.Response === 'undefined') {
      throw new Error('Trình duyệt hiện tại chưa hỗ trợ giải nén file .docx trực tiếp. Vui lòng dùng Chrome/Edge mới hoặc dán văn bản câu hỏi trực tiếp.');
    }
    const stream = new Blob([compressedBytes]).stream().pipeThrough(new window.DecompressionStream('deflate-raw'));
    const text = await new window.Response(stream).text();
    return text;
  }

  /**
   * Giải nén trực tiếp entry word/document.xml từ ArrayBuffer của file .docx
   */
  async function extractDocxDocumentXml(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const eocdOffset = findZipEocdOffset(bytes);
    if (eocdOffset < 0) {
      throw new Error('File không đúng định dạng Word (.docx) hợp lệ.');
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    let ptr = cdOffset;

    for (let idx = 0; idx < totalEntries && ptr + 46 <= bytes.length; idx++) {
      const sig = view.getUint32(ptr, true);
      if (sig !== 0x02014b50) break;

      const compressionMethod = view.getUint16(ptr + 10, true);
      const compressedSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localHeaderOffset = view.getUint32(ptr + 42, true);

      const entryName = decodeUtf8(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      ptr += 46 + nameLen + extraLen + commentLen;

      if (entryName === 'word/document.xml') {
        if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
          throw new Error('Không thể đọc phần dữ liệu nội dung bên trong file .docx.');
        }
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compressedSlice = bytes.subarray(dataStart, dataStart + compressedSize);

        if (compressionMethod === 0) {
          return decodeUtf8(compressedSlice);
        }
        if (compressionMethod === 8) {
          return await inflateRawBytes(compressedSlice);
        }
        throw new Error(`Thuật toán nén .docx (method ${compressionMethod}) chưa được hỗ trợ.`);
      }
    }

    throw new Error('Không tìm thấy nội dung word/document.xml bên trong file .docx.');
  }

  function isAccentColorHex(val) {
    if (!val) return false;
    const clean = String(val).trim().replace(/^#/, '').toUpperCase();
    if (!clean || clean === 'AUTO' || clean === '000000' || clean === 'FFFFFF' || clean === '111111' || clean === '222222' || clean === '333333') {
      return false;
    }
    return /^[0-9A-F]{6}$/.test(clean);
  }

  function readWordRunFormatting(rPrNode) {
    const flags = { bold: false, underline: false, highlight: false, colored: false, vertAlign: '' };
    if (!rPrNode) return flags;

    const children = rPrNode.children || [];
    for (let i = 0; i < children.length; i++) {
      const ch = children[i];
      const local = ch.localName || ch.nodeName.replace(/^.*:/, '');
      const val = ch.getAttribute('w:val') || ch.getAttribute('val') || '';

      if (local === 'b') {
        flags.bold = val !== '0' && val.toLowerCase() !== 'false';
      } else if (local === 'u') {
        flags.underline = Boolean(val && val.toLowerCase() !== 'none');
      } else if (local === 'highlight') {
        flags.highlight = Boolean(val && val.toLowerCase() !== 'none');
      } else if (local === 'shd') {
        const fill = ch.getAttribute('w:fill') || ch.getAttribute('fill') || '';
        if (isAccentColorHex(fill)) flags.highlight = true;
      } else if (local === 'color') {
        if (isAccentColorHex(val)) flags.colored = true;
      } else if (local === 'vertAlign') {
        const va = val.toLowerCase();
        if (va === 'superscript' || va === 'subscript') {
          flags.vertAlign = va;
        }
      }
    }
    return flags;
  }

  function extractParagraphStructuredLine(pNode) {
    const runs = [];
    let fullText = '';

    const walkParagraph = (node, activeFlags) => {
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        const ch = children[i];
        if (ch.nodeType !== 1) continue;
        const local = ch.localName || ch.nodeName.replace(/^.*:/, '');

        if (local === 'oMathPara' || local === 'oMath') {
          const latex = window.GmmMathFormat
            ? window.GmmMathFormat.extractOmmlToLatex(ch)
            : (ch.textContent || '');
          if (latex) {
            const start = fullText.length;
            fullText += latex;
            runs.push({ start, end: fullText.length, text: latex, flags: activeFlags });
          }
        } else if (local === 'r') {
          let rPr = null;
          for (let j = 0; j < ch.children.length; j++) {
            const subLocal = ch.children[j].localName || ch.children[j].nodeName.replace(/^.*:/, '');
            if (subLocal === 'rPr') {
              rPr = ch.children[j];
              break;
            }
          }
          const flags = readWordRunFormatting(rPr);
          walkParagraph(ch, flags);
        } else if (local === 't' || local === 'delText') {
          const rawVal = ch.textContent || '';
          if (rawVal) {
            let tVal = rawVal;
            if (activeFlags.vertAlign === 'superscript' && rawVal.trim()) {
              tVal = `^{${rawVal.trim()}}`;
            } else if (activeFlags.vertAlign === 'subscript' && rawVal.trim()) {
              tVal = `_{${rawVal.trim()}}`;
            }
            const start = fullText.length;
            fullText += tVal;
            runs.push({ start, end: fullText.length, text: tVal, flags: activeFlags });
          }
        } else if (local === 'tab') {
          const start = fullText.length;
          fullText += '\t';
          runs.push({ start, end: fullText.length, text: '\t', flags: activeFlags });
        } else if (local === 'br' || local === 'cr') {
          const start = fullText.length;
          fullText += '\n';
          runs.push({ start, end: fullText.length, text: '\n', flags: activeFlags });
        } else if (local !== 'rPr' && local !== 'pPr') {
          walkParagraph(ch, activeFlags);
        }
      }
    };

    walkParagraph(pNode, { bold: false, underline: false, highlight: false, colored: false });
    if (!fullText) return [];

    // Split on hard breaks inside a paragraph cleanly while shifting offsets
    const rawParts = fullText.split('\n');
    if (rawParts.length === 1) {
      return [{ text: fullText, runs }];
    }

    const splitLines = [];
    let offset = 0;
    rawParts.forEach(part => {
      const partStart = offset;
      const partEnd = partStart + part.length;
      const partRuns = [];
      runs.forEach(r => {
        if (r.end > partStart && r.start < partEnd) {
          partRuns.push({
            start: Math.max(0, r.start - partStart),
            end: Math.min(part.length, r.end - partStart),
            text: r.text,
            flags: r.flags
          });
        }
      });
      splitLines.push({ text: part, runs: partRuns });
      offset = partEnd + 1;
    });
    return splitLines;
  }

  function extractDocxContentFromXml(xmlString) {
    const parser = new window.DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const body = xmlDoc.getElementsByTagNameNS('*', 'body')[0] || xmlDoc.documentElement;
    if (!body) return { lines: [], tableAnswers: {} };

    const lines = [];
    const tableAnswers = {};

    const parseTableNode = (tblNode) => {
      const trNodes = Array.from(tblNode.children || []).filter(n => (n.localName || n.nodeName.replace(/^.*:/, '')) === 'tr');
      const tableGrid = [];

      trNodes.forEach(tr => {
        const tcNodes = Array.from(tr.children || []).filter(n => (n.localName || n.nodeName.replace(/^.*:/, '')) === 'tc');
        const rowCells = tcNodes.map(tc => {
          const pNodes = tc.getElementsByTagNameNS('*', 'p');
          const cellLines = [];
          for (let i = 0; i < pNodes.length; i++) {
            extractParagraphStructuredLine(pNodes[i]).forEach(sl => {
              if (sl.text.trim()) cellLines.push(sl);
            });
          }
          return {
            text: cellLines.map(cl => cl.text.trim()).join(' ').trim(),
            structuredLines: cellLines
          };
        });
        tableGrid.push(rowCells);
      });

      // Detect Answer Key Table: 2+ rows with Question Number headers + single A-D values
      let foundKeyPairs = 0;
      for (let r = 0; r < tableGrid.length - 1; r++) {
        const rowTop = tableGrid[r];
        const rowBot = tableGrid[r + 1];
        if (rowTop.length >= 2 && rowTop.length === rowBot.length) {
          let rowMatches = 0;
          const candidatePairs = {};
          for (let c = 0; c < rowTop.length; c++) {
            const topM = rowTop[c].text.match(/^(?:câu\s*)?(\d{1,3})[.:)]?$/i);
            const botM = rowBot[c].text.match(/^([A-D])$/i);
            if (topM && botM) {
              rowMatches++;
              candidatePairs[parseInt(topM[1], 10)] = LETTER_INDEX_MAP[botM[1].toUpperCase()];
            }
          }
          if (rowMatches >= 2) {
            Object.assign(tableAnswers, candidatePairs);
            foundKeyPairs += rowMatches;
          }
        }
      }

      // Check vertical 2-column table: "Câu 1 | B" or "1 | B"
      if (foundKeyPairs === 0) {
        tableGrid.forEach(row => {
          if (row.length === 2) {
            const leftM = row[0].text.match(/^(?:câu\s*)?(\d{1,3})[.:)]?$/i);
            const rightM = row[1].text.match(/^([A-D])$/i);
            if (leftM && rightM) {
              tableAnswers[parseInt(leftM[1], 10)] = LETTER_INDEX_MAP[rightM[1].toUpperCase()];
              foundKeyPairs++;
            }
          }
        });
      }

      // If not an answer key table, extract cell paragraphs as normal question lines
      if (foundKeyPairs === 0) {
        tableGrid.forEach(row => {
          row.forEach(cell => {
            cell.structuredLines.forEach(sl => lines.push(sl));
          });
        });
      }
    };

    const bodyChildren = body.children || [];
    for (let i = 0; i < bodyChildren.length; i++) {
      const ch = bodyChildren[i];
      const local = ch.localName || ch.nodeName.replace(/^.*:/, '');
      if (local === 'p') {
        extractParagraphStructuredLine(ch).forEach(sl => lines.push(sl));
      } else if (local === 'tbl') {
        parseTableNode(ch);
      }
    }

    return { lines, tableAnswers };
  }

  function isHtmlColorAccent(colorStr) {
    if (!colorStr) return false;
    const c = String(colorStr).trim().toLowerCase();
    if (!c || c === 'black' || c === 'windowtext' || c === '#000' || c === '#000000' || c === 'rgb(0, 0, 0)' || c === 'inherit' || c === 'initial' || c === 'white' || c === '#fff' || c === '#ffffff' || c === 'rgb(255, 255, 255)') {
      return false;
    }
    const rgbMatch = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      if (r < 45 && g < 45 && b < 45) return false;
    }
    return true;
  }

  function extractStructuredLinesFromHtml(htmlString) {
    if (!htmlString || typeof window.DOMParser === 'undefined') return [];
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    if (!doc || !doc.body) return [];

    const lines = [];
    let curText = '';
    let curRuns = [];

    const flushLine = () => {
      if (curText.trim()) {
        lines.push({ text: curText, runs: curRuns });
      }
      curText = '';
      curRuns = [];
    };

    const mergeFlags = (parent, el) => {
      const next = Object.assign({}, parent);
      const tag = (el.tagName || '').toUpperCase();
      const style = el.getAttribute ? (el.getAttribute('style') || '') : '';

      if (tag === 'B' || tag === 'STRONG' || /font-weight\s*:\s*(bold|[6-9]00)/i.test(style)) {
        next.bold = true;
      }
      if (tag === 'U' || /text-decoration[^;]*underline/i.test(style)) {
        next.underline = true;
      }
      if (tag === 'MARK' || /background(-color)?\s*:\s*(?!transparent|none|white|#fff|rgb\(255)/i.test(style)) {
        next.highlight = true;
      }
      if (tag === 'FONT' && isHtmlColorAccent(el.getAttribute('color'))) {
        next.colored = true;
      }
      const colorM = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (colorM && isHtmlColorAccent(colorM[1])) {
        next.colored = true;
      }
      return next;
    };

    const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

    const walk = (node, flags) => {
      if (!node) return;
      if (node.nodeType === 3) {
        const val = String(node.nodeValue || '').replace(/\r?\n+/g, ' ');
        if (val) {
          const start = curText.length;
          curText += val;
          curRuns.push({ start, end: curText.length, text: val, flags });
        }
        return;
      }
      if (node.nodeType !== 1) return;

      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'XML') return;
      if (tag === 'BR') {
        flushLine();
        return;
      }

      const isBlock = BLOCK_TAGS.has(tag);
      if (isBlock && curText.trim()) {
        flushLine();
      }

      const nextFlags = mergeFlags(flags, node);
      const styleStr = node.getAttribute ? (node.getAttribute('style') || '') : '';
      const isSup = tag === 'SUP' || /vertical-align\s*:\s*super/i.test(styleStr);
      const isSub = tag === 'SUB' || /vertical-align\s*:\s*sub/i.test(styleStr);
      if (isSup || isSub) {
        const scriptInner = String(node.textContent || '').replace(/\r?\n+/g, '').trim();
        if (scriptInner) {
          const val = isSup ? `^{${scriptInner}}` : `_{${scriptInner}}`;
          const start = curText.length;
          curText += val;
          curRuns.push({ start, end: curText.length, text: val, flags: nextFlags });
        }
        return;
      }

      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        walk(children[i], nextFlags);
      }

      if (tag === 'TD' || tag === 'TH') {
        const start = curText.length;
        curText += '\t';
        curRuns.push({ start, end: curText.length, text: '\t', flags: nextFlags });
      }
      if (isBlock) {
        flushLine();
      }
    };

    walk(doc.body, { bold: false, underline: false, highlight: false, colored: false });
    flushLine();
    return lines;
  }

  function extractStructuredLinesFromPlainText(rawText) {
    return String(rawText || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => ({ text: line, runs: [] }));
  }

  function sliceFormattingClues(lineObj, startIdx, endIdx) {
    const clue = { bold: false, underline: false, highlight: false, colored: false };
    if (!lineObj || !Array.isArray(lineObj.runs) || lineObj.runs.length === 0) return clue;

    let boldChars = 0;
    let totalChars = 0;
    lineObj.runs.forEach(r => {
      if (r.end > startIdx && r.start < endIdx) {
        const overlap = Math.min(endIdx, r.end) - Math.max(startIdx, r.start);
        const f = r.flags || {};
        totalChars += overlap;
        if (f.underline) clue.underline = true;
        if (f.highlight) clue.highlight = true;
        if (f.colored) clue.colored = true;
        if (f.bold) boldChars += overlap;
      }
    });
    if (totalChars > 0 && boldChars >= Math.min(2, totalChars)) {
      clue.bold = true;
    }
    return clue;
  }

  function inferCorrectFromFormattingClues(optionClues) {
    if (!Array.isArray(optionClues) || optionClues.length < 2) return -1;

    // Priority: underline -> highlight -> colored -> unique bold across all options
    const checks = ['underline', 'highlight', 'colored', 'bold'];
    for (let c = 0; c < checks.length; c++) {
      const prop = checks[c];
      const matched = [];
      optionClues.forEach((clue, idx) => {
        if (clue && clue[prop]) matched.push(idx);
      });
      if (matched.length === 1) {
        return matched[0];
      }
    }
    return -1;
  }

  /**
   * Phân tích danh sách dòng có cấu trúc thành mảng câu hỏi trắc nghiệm chuẩn
   */
  function parseStructuredLinesToQuestions(rawLines, tableAnswers) {
    const cleanLines = (rawLines || [])
      .map(item => ({
        text: String(item.text || '').replace(/\u00A0/g, ' ').trim(),
        runs: item.runs || [],
        rawText: String(item.text || '').replace(/\u00A0/g, ' ')
      }))
      .filter(item => item.text.length > 0);

    const questions = [];
    const answerKeyMap = Object.assign({}, tableAnswers || {});
    let inAnswerKeySection = false;
    let currentQ = null;

    const qStartRegex = /^(?:câu\s*hỏi|câu|cau|bài|bai|question|q)\s*(\d+)[\s:.)\-\]]*(.*)/i;
    const numStartRegex = /^(\d{1,3})[\s.)\-\]:]+(.+)/;
    const optionMarkerInlineRegex = /(?:^|\s{2,}|\t|\s+(?=[*✓]?\(?[A-D][.):\]\s]))([*✓]?)\(?([A-D])\)?([*]?)(?:[\s.):\-\]]+)/g;
    const inlineTrailingAnsRegex = /(?:^|[.;\s])(?:đáp\s*án\s*(?:đúng\s*(?:là)?)?|dap\s*an(?:\s*dung)?|đ\/a|key|answer)\s*[:.\-\s]*([A-D])\s*[.)]?\s*$/i;

    function extractInlineTrailingAnswer(rawStr, qObj) {
      const m = String(rawStr || '').match(inlineTrailingAnsRegex);
      if (m && LETTER_INDEX_MAP[m[1].toUpperCase()] !== undefined) {
        if (qObj && qObj.correct === -1) {
          qObj.correct = LETTER_INDEX_MAP[m[1].toUpperCase()];
          qObj.answerSource = 'explicit';
        }
        return String(rawStr || '').slice(0, m.index).trim();
      }
      return rawStr;
    }

    function finalizeCurrentQuestion() {
      if (!currentQ) return;
      if (currentQ.options && currentQ.options.length >= 2) {
        if (currentQ.correct === -1) {
          const fmtCorrect = inferCorrectFromFormattingClues(currentQ.optionClues);
          if (fmtCorrect !== -1) {
            currentQ.correct = fmtCorrect;
            currentQ.answerSource = 'format';
          }
        }
        while (currentQ.options.length < 4) {
          const nextLtr = OPTION_LETTERS[currentQ.options.length] || 'D';
          currentQ.options.push(`Phương án ${nextLtr}`);
        }
        currentQ.options = currentQ.options.slice(0, 4);
        questions.push(currentQ);
      }
      currentQ = null;
    }

    function createEmptyQuestion(qNum, qText) {
      return {
        detectedNum: qNum,
        question: (qText || '').trim(),
        options: [],
        optionClues: [],
        correct: -1,
        answerSource: 'default'
      };
    }

    function parseOptionsFromLine(lineObj) {
      const text = lineObj.text;
      // Normalize leading index offset into rawText if needed
      const leadingSpaces = lineObj.rawText.length - lineObj.rawText.trimStart().length;

      // First try finding multiple options on the same line (e.g. A. ...  B. ...  C. ...  D. ...)
      const matches = [];
      let m;
      const multiRegex = new RegExp(optionMarkerInlineRegex.source, 'g');
      while ((m = multiRegex.exec(text)) !== null) {
        const ltr = m[2].toUpperCase();
        // Verify sequential sanity if not at index 0
        if (matches.length === 0 && m.index > 0) continue;
        const markerOffset = m[0].search(/[*✓\(A-Da-d]/);
        matches.push({
          letter: ltr,
          start: m.index + Math.max(0, markerOffset),
          contentStart: m.index + m[0].length,
          starBefore: Boolean(m[1]),
          starAfter: Boolean(m[3])
        });
      }

      if (matches.length >= 2) {
        for (let k = 0; k < matches.length; k++) {
          const cur = matches[k];
          const nextStart = (k + 1 < matches.length) ? matches[k + 1].start : text.length;
          let optText = text.substring(cur.contentStart, nextStart).trim();
          if (k === matches.length - 1) {
            optText = extractInlineTrailingAnswer(optText, currentQ);
          }

          const starInText = optText.includes('*') || optText.includes('✓');
          const dungInText = /\((?:đúng|dung|x)\)|\[x\]/i.test(optText);
          optText = optText
            .replace(/\*+/g, '')
            .replace(/✓/g, '')
            .replace(/\((?:đúng|dung|x)\)|\[x\]/gi, '')
            .trim();

          const optIdx = currentQ.options.length;
          currentQ.options.push(optText || `Phương án ${cur.letter}`);
          currentQ.optionClues.push(sliceFormattingClues(lineObj, leadingSpaces + cur.start, leadingSpaces + nextStart));

          if (cur.starBefore || cur.starAfter || starInText || dungInText) {
            currentQ.correct = optIdx;
            currentQ.answerSource = 'marker';
          }
        }
        return true;
      }

      // Single option per line: A. ..., a) ..., *B. ..., (C) ..., [D] ...
      const singleM = text.match(/^([*✓]?)\(?([A-Da-d])\)?([*]?)(?:[\s.):\-\]]+)(.+)$/);
      if (singleM) {
        const starBefore = Boolean(singleM[1]);
        const letter = singleM[2].toUpperCase();
        const starAfter = Boolean(singleM[3]);
        let optText = extractInlineTrailingAnswer(singleM[4].trim(), currentQ);

        const starInText = optText.endsWith('*') || optText.startsWith('*') || optText.includes('✓');
        const dungInText = /\((?:đúng|dung|x)\)|\[x\]/i.test(optText);
        optText = optText
          .replace(/\*+/g, '')
          .replace(/✓/g, '')
          .replace(/\((?:đúng|dung|x)\)|\[x\]/gi, '')
          .trim();

        // Preserve logical A/B/C/D order if options are parsed cleanly
        const targetIdx = currentQ.options.length;
        if (targetIdx < 4 || LETTER_INDEX_MAP[letter] === targetIdx) {
          currentQ.options.push(optText || `Phương án ${letter}`);
          currentQ.optionClues.push(sliceFormattingClues(lineObj, leadingSpaces, leadingSpaces + text.length));
          if (starBefore || starAfter || starInText || dungInText) {
            currentQ.correct = targetIdx;
            currentQ.answerSource = 'marker';
          }
          return true;
        }
      }

      return false;
    }

    for (let i = 0; i < cleanLines.length; i++) {
      const lineObj = cleanLines[i];
      const line = lineObj.text;

      // 1. Answer Key section header (including multi-pair "Đáp án: 1.A 2.B ...")
      const isMultiKeyLine = /^(?:đáp\s*án|dap\s*an|key)/i.test(line) && /(?:^|\s)1[\s.:\-\)]*[A-D].*?(?:^|\s)2[\s.:\-\)]*[A-D]/i.test(line);
      if (isMultiKeyLine ||
          /^(?:bảng\s*đáp\s*án|bang\s*dap\s*an|đáp\s*án\s*(?:chi\s*tiết|tham\s*khảo|đề\s*thi)?|answer\s*key|key\s*sheet)\s*[:\-–]?$/i.test(line) ||
          /^(?:bảng\s*đáp\s*án|bang\s*dap\s*an|answer\s*key)/i.test(line)) {
        finalizeCurrentQuestion();
        inAnswerKeySection = true;
        const inlineKeys = line.replace(/^(?:bảng\s*đáp\s*án|bang\s*dap\s*an|đáp\s*án(?:\s*chi\s*tiết)?|dap\s*an|answer\s*key|key)[\s:.\-]*/i, '');
        if (inlineKeys) {
          const kmRegex = /(?:^|\s|,|;|câu\s*)(\d{1,3})[\s.:\-\)]*([A-D])(?:\b|\s|,|;|$)/gi;
          let km;
          while ((km = kmRegex.exec(inlineKeys)) !== null) {
            answerKeyMap[parseInt(km[1], 10)] = LETTER_INDEX_MAP[km[2].toUpperCase()];
          }
        }
        continue;
      }

      if (inAnswerKeySection) {
        const kmRegex = /(?:^|\s|,|;|câu\s*)(\d{1,3})[\s.:\-\)]*([A-D])(?:\b|\s|,|;|$)/gi;
        let km;
        while ((km = kmRegex.exec(line)) !== null) {
          answerKeyMap[parseInt(km[1], 10)] = LETTER_INDEX_MAP[km[2].toUpperCase()];
        }
        continue;
      }

      // 2. Question header detection ("Câu 1:", "1.", etc.)
      let qNum = null;
      let qContent = null;
      const matchQ = line.match(qStartRegex);
      if (matchQ) {
        qNum = parseInt(matchQ[1], 10);
        qContent = matchQ[2].trim();
      } else {
        const matchNum = line.match(numStartRegex);
        if (matchNum && (!currentQ || currentQ.options.length >= 2)) {
          qNum = parseInt(matchNum[1], 10);
          qContent = matchNum[2].trim();
        }
      }

      if (qNum !== null) {
        finalizeCurrentQuestion();
        // Check if A. ... B. ... options appear inline right after the question stem on the same line
        const inlineSplitMatch = qContent.match(/^(.*?)\s+([*✓]?\(?A[.):\]]\s+.+\s+[*✓]?\(?B[.):\]]\s+.+)$/);
        if (inlineSplitMatch) {
          currentQ = createEmptyQuestion(qNum, inlineSplitMatch[1].trim() || `Câu hỏi ${qNum}`);
          const optPart = inlineSplitMatch[2];
          const optStartOffset = lineObj.rawText.indexOf(optPart);
          const shiftedRuns = (lineObj.runs || [])
            .filter(r => optStartOffset >= 0 && r.end > optStartOffset)
            .map(r => ({
              start: Math.max(0, r.start - optStartOffset),
              end: r.end - optStartOffset,
              text: r.text,
              flags: r.flags
            }));
          parseOptionsFromLine({ text: optPart, rawText: optPart, runs: shiftedRuns });
        } else {
          currentQ = createEmptyQuestion(qNum, qContent || `Câu hỏi ${qNum}`);
        }
        continue;
      }

      // Support unnumbered question line immediately preceding options
      if (!currentQ) {
        // Ignore pure title lines like "ĐỀ KIỂM TRA..." if followed by a numbered Câu 1
        const nextLine = cleanLines[i + 1] ? cleanLines[i + 1].text : '';
        const looksFollowedByOption = /^([*✓]?)\(?[A-Da-d]\)?[\s.):\-\]]+/.test(nextLine);
        if (looksFollowedByOption) {
          currentQ = createEmptyQuestion(questions.length + 1, line);
        }
        continue;
      }

      // 3. Explicit answer line inside question: "Đáp án: B", "ĐA: C", "Key: A", "Chọn: D"
      const ansMatch = line.match(/^(?:đáp\s*án\s*đúng\s*là|đáp\s*án\s*đúng|đáp\s*án|dap\s*an\s*dung|dap\s*an|chọn|chon|key|đ\/a|da|ans|answer)[\s:.\-]*([A-D])(?:\b|\s|$|\.)/i);
      if (ansMatch) {
        const ltr = ansMatch[1].toUpperCase();
        if (LETTER_INDEX_MAP[ltr] !== undefined) {
          currentQ.correct = LETTER_INDEX_MAP[ltr];
          currentQ.answerSource = 'explicit';
        }
        continue;
      }

      // Ignore explanation / difficulty meta lines after options
      if (currentQ.options.length > 0 && /^(?:giải\s*thích|lời\s*giải|hướng\s*dẫn|mức\s*độ|độ\s*khó|ghi\s*chú)[\s:.\-]/i.test(line)) {
        continue;
      }

      // 4. Parse A/B/C/D options
      if (parseOptionsFromLine(lineObj)) {
        continue;
      }

      // 5. If all 4 options already collected and an unnumbered paragraph appears, start next question!
      if (currentQ.options.length >= 4) {
        const nextLine = cleanLines[i + 1] ? cleanLines[i + 1].text : '';
        const nextIsOpt = /^([*✓]?)\(?[A-Da-d]\)?[\s.):\-\]]+/.test(nextLine);
        if (nextIsOpt) {
          finalizeCurrentQuestion();
          currentQ = createEmptyQuestion(questions.length + 1, line);
          continue;
        }
      }

      // 6. Multi-line question stem continuation before options
      if (currentQ.options.length === 0) {
        currentQ.question = currentQ.question ? `${currentQ.question} ${line}` : line;
      }
    }

    finalizeCurrentQuestion();

    // Apply Answer Key map (from end-of-doc section or Word Table) & KaTeX math normalization
    const normalizeMath = window.GmmMathFormat && typeof window.GmmMathFormat.normalizeMathNotation === 'function'
      ? window.GmmMathFormat.normalizeMathNotation
      : (s) => s;

    let detectedAnswersCount = 0;
    questions.forEach((q, idx) => {
      const lookupNum = q.detectedNum || (idx + 1);
      if (q.correct === -1 && answerKeyMap[lookupNum] !== undefined) {
        q.correct = answerKeyMap[lookupNum];
        q.answerSource = 'keyTable';
      }
      if (q.correct >= 0 && q.correct <= 3) {
        detectedAnswersCount++;
      } else {
        q.correct = 0;
      }
      q.question = normalizeMath(q.question);
      q.options = q.options.map(opt => normalizeMath(opt));
    });

    return {
      questions,
      detectedAnswersCount
    };
  }

  /**
   * Tự động dàn trải N câu hỏi đã đọc được thành đúng 10 câu cho Đấu trường Giải Mã
   * - mode = 'spread': Dàn trải đều toàn đề (N > 10 lấy rải đều từ đầu tới cuối; N < 10 phân bổ xoay vòng đều 10 vị trí)
   * - mode = 'first10': Lấy tối đa 10 câu đầu tiên (nếu thiếu thì giữ câu mẫu ở phần dư)
   */
  function distributeQuestionsToTenSlots(parsedQuestions, templateSlots, mode) {
    const list = Array.isArray(parsedQuestions) ? parsedQuestions : [];
    const fallbackList = Array.isArray(templateSlots) ? templateSlots : [];
    const useSpread = mode !== 'first10';
    const result = [];

    if (list.length === 0) return result;

    for (let slotIdx = 0; slotIdx < 10; slotIdx++) {
      let picked = null;
      if (list.length === 10) {
        picked = list[slotIdx];
      } else if (list.length > 10) {
        const mappedIdx = useSpread
          ? Math.round((slotIdx * (list.length - 1)) / 9)
          : slotIdx;
        picked = list[Math.min(list.length - 1, Math.max(0, mappedIdx))];
      } else {
        // N < 10: Xoay vòng đều qua 10 ô để các câu liên tiếp không bị lặp lại liền kề
        if (useSpread) {
          picked = list[slotIdx % list.length];
        } else {
          picked = slotIdx < list.length ? list[slotIdx] : fallbackList[slotIdx];
        }
      }

      const slotMeta = fallbackList[slotIdx] || {};
      const safePicked = picked || slotMeta;
      const opts = Array.isArray(safePicked.options) ? safePicked.options.slice(0, 4) : ['A', 'B', 'C', 'D'];
      while (opts.length < 4) {
        opts.push(`Phương án ${OPTION_LETTERS[opts.length] || 'D'}`);
      }

      result.push({
        id: slotIdx + 1,
        question: String(safePicked.question || `Câu hỏi ${slotIdx + 1}`).trim(),
        options: opts,
        correct: Math.max(0, Math.min(3, parseInt(safePicked.correct, 10) || 0)),
        time: parseInt(safePicked.time, 10) || 30,
        coordinate: slotMeta.coordinate || `Ô số ${slotIdx + 1}`,
        regionId: slotMeta.regionId || `code_${slotIdx + 1}${OPTION_LETTERS[slotIdx % 4]}`,
        regionName: slotMeta.regionName || `Mảng ${slotIdx + 1}`,
        answerSource: safePicked.answerSource || 'default'
      });
    }

    return result;
  }

  async function parseDocxFile(file) {
    const buffer = await file.arrayBuffer();
    const xmlStr = await extractDocxDocumentXml(buffer);
    const { lines, tableAnswers } = extractDocxContentFromXml(xmlStr);
    return parseStructuredLinesToQuestions(lines, tableAnswers);
  }

  function parsePastedInput(plainText, htmlText) {
    if (htmlText && String(htmlText).trim()) {
      const htmlLines = extractStructuredLinesFromHtml(htmlText);
      const htmlRes = parseStructuredLinesToQuestions(htmlLines, {});
      if (htmlRes.questions.length > 0) {
        return htmlRes;
      }
    }
    const plainLines = extractStructuredLinesFromPlainText(plainText);
    return parseStructuredLinesToQuestions(plainLines, {});
  }

  window.GmmQuestionDocParser = {
    parseDocxFile,
    parsePastedInput,
    distributeQuestionsToTenSlots,
    OPTION_LETTERS
  };
})();
