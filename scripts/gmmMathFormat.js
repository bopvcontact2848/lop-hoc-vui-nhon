/**
 * GMM Math & KaTeX Format Helper
 * Chuyển đổi công thức Toán/Lý/Hóa từ Word (.docx OMML, vertAlign), HTML paste (sup/sub)
 * và ký hiệu văn bản (x^2, H_2O) sang chuẩn KaTeX an toàn để hiển thị đẹp trên mọi màn hình.
 */
(function initGmmMathFormat() {
  'use strict';

  const UNICODE_MATH_MAP = {
    '×': '\\times ',
    '÷': '\\div ',
    '±': '\\pm ',
    '∓': '\\mp ',
    '≤': '\\le ',
    '≥': '\\ge ',
    '≠': '\\ne ',
    '≈': '\\approx ',
    '∞': '\\infty ',
    '→': '\\to ',
    '⇒': '\\Rightarrow ',
    '⇔': '\\Leftrightarrow ',
    '∈': '\\in ',
    '∉': '\\notin ',
    '⊂': '\\subset ',
    '∪': '\\cup ',
    '∩': '\\cap ',
    '∅': '\\emptyset ',
    '∀': '\\forall ',
    '∃': '\\exists ',
    'π': '\\pi ',
    'α': '\\alpha ',
    'β': '\\beta ',
    'γ': '\\gamma ',
    'δ': '\\delta ',
    'Δ': '\\Delta ',
    'θ': '\\theta ',
    'λ': '\\lambda ',
    'μ': '\\mu ',
    'σ': '\\sigma ',
    'φ': '\\varphi ',
    'ω': '\\omega ',
    'Ω': '\\Omega ',
    '°': '^\\circ '
  };

  function getLocalName(node) {
    if (!node) return '';
    return node.localName || String(node.nodeName || '').replace(/^.*:/, '');
  }

  function findChildByLocal(node, name) {
    const children = node && node.children ? node.children : [];
    for (let i = 0; i < children.length; i++) {
      if (getLocalName(children[i]) === name) return children[i];
    }
    return null;
  }

  function mapMathTextChars(str) {
    return String(str || '').replace(/[^\x00-\x7F]/g, (ch) => UNICODE_MATH_MAP[ch] || ch);
  }

  function wrapScriptArg(latex) {
    const clean = String(latex || '').trim();
    if (!clean) return '';
    return `{${clean}}`;
  }

  function ommlNodeToLatex(node) {
    if (!node) return '';
    if (node.nodeType === 3) {
      return mapMathTextChars(node.nodeValue || '');
    }
    if (node.nodeType !== 1) return '';

    const local = getLocalName(node);

    if (local === 'rPr' || local === 'fPr' || local === 'radPr' || local === 'naryPr' || local === 'dPr' || local === 'sSupPr' || local === 'sSubPr' || local === 'ctrlPr') {
      return '';
    }

    if (local === 't') {
      return mapMathTextChars(node.textContent || '');
    }

    if (local === 'f') {
      const num = ommlNodeToLatex(findChildByLocal(node, 'num'));
      const den = ommlNodeToLatex(findChildByLocal(node, 'den'));
      return `\\frac{${num.trim()}}{${den.trim()}}`;
    }

    if (local === 'sSup') {
      const base = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      const sup = ommlNodeToLatex(findChildByLocal(node, 'sup')).trim();
      return `${base}^${wrapScriptArg(sup)}`;
    }

    if (local === 'sSub') {
      const base = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      const sub = ommlNodeToLatex(findChildByLocal(node, 'sub')).trim();
      return `${base}_${wrapScriptArg(sub)}`;
    }

    if (local === 'sSubSup') {
      const base = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      const sub = ommlNodeToLatex(findChildByLocal(node, 'sub')).trim();
      const sup = ommlNodeToLatex(findChildByLocal(node, 'sup')).trim();
      return `${base}_${wrapScriptArg(sub)}^${wrapScriptArg(sup)}`;
    }

    if (local === 'rad') {
      const deg = ommlNodeToLatex(findChildByLocal(node, 'deg')).trim();
      const expr = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      return deg ? `\\sqrt[${deg}]{${expr}}` : `\\sqrt{${expr}}`;
    }

    if (local === 'nary') {
      const pr = findChildByLocal(node, 'naryPr');
      const chrEl = pr ? findChildByLocal(pr, 'chr') : null;
      const chr = chrEl ? (chrEl.getAttribute('m:val') || chrEl.getAttribute('val') || '∫') : '∫';
      const op = chr === '∑' ? '\\sum' : chr === '∏' ? '\\prod' : '\\int';
      const sub = ommlNodeToLatex(findChildByLocal(node, 'sub')).trim();
      const sup = ommlNodeToLatex(findChildByLocal(node, 'sup')).trim();
      const body = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      const subPart = sub ? `_${wrapScriptArg(sub)}` : '';
      const supPart = sup ? `^${wrapScriptArg(sup)}` : '';
      return `${op}${subPart}${supPart} ${body}`.trim();
    }

    if (local === 'd') {
      const pr = findChildByLocal(node, 'dPr');
      const begEl = pr ? findChildByLocal(pr, 'begChr') : null;
      const endEl = pr ? findChildByLocal(pr, 'endChr') : null;
      const beg = begEl ? (begEl.getAttribute('m:val') || begEl.getAttribute('val') || '(') : '(';
      const end = endEl ? (endEl.getAttribute('m:val') || endEl.getAttribute('val') || ')') : ')';
      const inner = [];
      const ch = node.children || [];
      for (let i = 0; i < ch.length; i++) {
        if (getLocalName(ch[i]) === 'e') inner.push(ommlNodeToLatex(ch[i]).trim());
      }
      const safeBeg = beg === '{' ? '\\{' : beg;
      const safeEnd = end === '}' ? '\\}' : end;
      return `${safeBeg}${inner.join(', ')}${safeEnd}`;
    }

    if (local === 'bar') {
      const base = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      return `\\overline{${base}}`;
    }

    if (local === 'acc') {
      const base = ommlNodeToLatex(findChildByLocal(node, 'e')).trim();
      return `\\vec{${base}}`;
    }

    let out = '';
    const children = node.childNodes || [];
    for (let i = 0; i < children.length; i++) {
      out += ommlNodeToLatex(children[i]);
    }
    return out;
  }

  function extractOmmlToLatex(oMathNode) {
    if (!oMathNode) return '';
    const local = getLocalName(oMathNode);
    if (local === 'oMathPara') {
      const innerList = [];
      const children = oMathNode.children || [];
      for (let i = 0; i < children.length; i++) {
        if (getLocalName(children[i]) === 'oMath') {
          const tex = ommlNodeToLatex(children[i]).replace(/\s+/g, ' ').trim();
          if (tex) innerList.push(tex);
        }
      }
      const joined = innerList.join(' ');
      return joined ? `$${joined}$` : '';
    }
    const tex = ommlNodeToLatex(oMathNode).replace(/\s+/g, ' ').trim();
    return tex ? `$${tex}$` : '';
  }

  /**
   * Chuẩn hóa ký hiệu toán học/hóa học trong text thô thành dạng KaTeX an toàn:
   * - Gộp các đoạn chỉ số trên/dưới liền kề: x^{2}^{n} -> x^{2n}
   * - Bọc các biểu thức x^2, x^{2}, H_{2}O, 10^{-5}, \frac{1}{2}, \sqrt{x} vào cặp $...$
   * - Giữ nguyên phần văn bản tiếng Việt và các đoạn đã có $...$, $$...$$, \(...\), \[...\]
   */
  function normalizeMathNotation(rawText) {
    const input = String(rawText || '');
    if (!input) return '';

    // Merge consecutive script blocks emitted by adjacent Word/HTML runs
    let cleaned = input
      .replace(/\}\s*\^\{/g, '')
      .replace(/\}\s*_\{/g, '');

    // Split by existing math delimiters so we never double-wrap existing $...$ or \(...\)
    const existingMathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
    const segments = cleaned.split(existingMathRegex);

    const normalized = segments.map((seg, idx) => {
      if (idx % 2 === 1) {
        // Normalize shorthand x^10 or ^(a+b) inside existing $...$
        return seg;
      }

      // Skip plain fill-in-the-blank underscores (e.g. "____") safely
      let part = seg;

      // Normalize bare LaTeX fractions or roots pasted without $ delimiters
      part = part.replace(/\\(?:frac\{[^{}]+\}\{[^{}]+\}|sqrt(?:\[[^\]]+\])?\{[^{}]+\})/g, (m) => `$${m}$`);

      // Now split again on newly inserted $...$ so the next pass ignores them
      const subSegs = part.split(/(\$[^$\n]+?\$)/g);
      return subSegs.map((s, sIdx) => {
        if (sIdx % 2 === 1) return s;

        // Match algebraic/chemical expressions with ^ or _ (e.g. H_2O, H_{2}SO_{4}, x^2, (a+b)^{2})
        return s.replace(
          /(?<![A-Za-z0-9_\\$])([A-Za-z0-9)\]]+(?:\^(?:\{[^{}]+\}|\([^()]+\)|[+\-]?\d+|[A-Za-z])|_(?:\{[^{}]+\}|\([^()]+\)|\d+|[ijkmn](?![A-Za-z0-9_])))+(?:[A-Za-z0-9()]+(?:\^(?:\{[^{}]+\}|\([^()]+\)|[+\-]?\d+|[A-Za-z])|_(?:\{[^{}]+\}|\([^()]+\)|\d+|[ijkmn](?![A-Za-z0-9_])))*)*)(?![_\\$])/g,
          (expr) => {
            const formatted = expr
              .replace(/\^\(([^()]+)\)/g, '^{$1}')
              .replace(/_\(([^()]+)\)/g, '_{$1}')
              .replace(/\^([+\-]?\d+)/g, (_, num) => (num.length > 1 ? `^{${num}}` : `^${num}`))
              .replace(/_(\d{2,})/g, '_{$1}');
            return `$${formatted}$`;
          }
        );
      }).join('');
    }).join('');

    return normalized;
  }

  function hasMathSyntax(text) {
    const s = String(text || '');
    return /(\$[^$\n]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\^\{|\^[+\-]?[A-Za-z0-9]|_\{|_[0-9ijkmn]|\\frac|\\sqrt)/.test(s);
  }

  function renderMathInContainer(containerEl) {
    if (!containerEl || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(containerEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch (err) {
      console.warn('[GmmMathFormat] KaTeX render fallback:', err);
    }
  }

  const KATEX_CSS_REL = 'assets/vendor/katex/katex.min.css';

  function getKatexPrintCssUrl() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.href) {
        return new URL(KATEX_CSS_REL, window.location.href).href;
      }
    } catch (_e) {}
    return KATEX_CSS_REL;
  }

  function escapePreviewHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function convertLatexSnippetForWord(expr) {
    let html = escapePreviewHtml(expr);
    html = html
      .replace(/\\times\b/g, '×')
      .replace(/\\div\b/g, '÷')
      .replace(/\\pm\b/g, '±')
      .replace(/\\le\b/g, '≤')
      .replace(/\\ge\b/g, '≥')
      .replace(/\\ne\b/g, '≠')
      .replace(/\\approx\b/g, '≈')
      .replace(/\\cdot\b/g, '·')
      .replace(/\\pi\b/g, 'π')
      .replace(/\\infty\b/g, '∞')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)')
      .replace(/\\text\{([^{}]+)\}/g, '$1')
      .replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>')
      .replace(/\^([+\-]?[A-Za-z0-9])/g, '<sup>$1</sup>')
      .replace(/_([A-Za-z0-9])/g, '<sub>$1</sub>');
    return html;
  }

  /**
   * Render text (có thể chứa $...$, $$...$$, \(...\), \[...\] hoặc x^2, H_2O) thành HTML tĩnh sẵn sàng để In/PDF hoặc xuất Word (.doc)
   */
  function renderMathToStaticHtml(rawText, options) {
    const opts = options || {};
    const normalized = normalizeMathNotation(rawText);
    if (!normalized) return '';

    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
    const segments = normalized.split(mathRegex);
    const katexApi = !opts.forWord && window.katex && typeof window.katex.renderToString === 'function'
      ? window.katex
      : null;

    return segments.map((seg, idx) => {
      if (idx % 2 === 0) return escapePreviewHtml(seg);

      let displayMode = false;
      let inner = seg;
      if (seg.startsWith('$$') && seg.endsWith('$$')) {
        displayMode = true;
        inner = seg.slice(2, -2);
      } else if (seg.startsWith('$') && seg.endsWith('$')) {
        inner = seg.slice(1, -1);
      } else if (seg.startsWith('\\[') && seg.endsWith('\\]')) {
        displayMode = true;
        inner = seg.slice(2, -2);
      } else if (seg.startsWith('\\(') && seg.endsWith('\\)')) {
        inner = seg.slice(2, -2);
      }

      if (opts.forWord) {
        return convertLatexSnippetForWord(inner);
      }
      if (katexApi) {
        try {
          return katexApi.renderToString(inner.trim(), { displayMode, throwOnError: false });
        } catch (_err) {
          return escapePreviewHtml(seg);
        }
      }
      return convertLatexSnippetForWord(inner);
    }).join('');
  }

  function truncateMathSafe(rawText, maxLen) {
    const str = String(rawText || '');
    if (str.length <= maxLen) return str;
    // Do not cut inside an open $...$ formula segment
    let cutPos = maxLen;
    let inDollar = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '$' && str[i - 1] !== '\\') {
        inDollar = !inDollar;
      }
      if (i >= maxLen && !inDollar) {
        cutPos = i + 1;
        break;
      }
    }
    if (inDollar) return str;
    return cutPos < str.length ? `${str.slice(0, cutPos).trim()}...` : str;
  }

  function renderEditorMathPreview(previewEl, qText, opts) {
    if (!previewEl) return;
    const list = Array.isArray(opts) ? opts : [];
    const anyMath = hasMathSyntax(qText) || list.some(o => hasMathSyntax(o));
    if (!anyMath) {
      previewEl.style.display = 'none';
      previewEl.innerHTML = '';
      return;
    }
    const letters = ['A', 'B', 'C', 'D'];
    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="font-size:0.74rem; font-weight:800; color:#38bdf8; margin-bottom:6px;">
        📐 XEM TRƯỚC CÔNG THỨC TOÁN / KHOA HỌC (KATEX):
      </div>
      <div style="color:#f8fafc; font-size:0.9rem; margin-bottom:6px;">${escapePreviewHtml(normalizeMathNotation(qText))}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.82rem; color:#cbd5e1;">
        ${list.map((o, idx) => `<div><strong style="color:#fde047;">${letters[idx]}:</strong> ${escapePreviewHtml(normalizeMathNotation(o))}</div>`).join('')}
      </div>
    `;
    renderMathInContainer(previewEl);
  }

  window.GmmMathFormat = {
    KATEX_CSS_REL,
    getKatexPrintCssUrl,
    extractOmmlToLatex,
    normalizeMathNotation,
    hasMathSyntax,
    renderMathInContainer,
    renderMathToStaticHtml,
    truncateMathSafe,
    renderEditorMathPreview
  };
})();
