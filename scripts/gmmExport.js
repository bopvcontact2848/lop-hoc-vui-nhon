/**
 * ==============================================================================
 * MODULE XUẤT PHIẾU MA TRẬN TRANH & ẢNH KỶ NIỆM LỚP (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmExport.js
 * Trách nhiệm: Quản lý logo trường, xem trước bản in A4, kích hoạt xuất PDF/Word,
 * tải PNG 300 DPI / Vector SVG và chụp ảnh kỷ niệm lớp học 2K.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmExport = {
    create: function (ctx) {
      const { gameState, generateSvgPuzzle } = ctx;
      let exportPreviewActivePage = 1;

  function switchExportPreviewPage(pageNum) {
    exportPreviewActivePage = pageNum;
    const tab1 = document.getElementById('gmmTabPreviewPage1');
    const tab2 = document.getElementById('gmmTabPreviewPage2');
    if (tab1) tab1.classList.toggle('active', pageNum === 1);
    if (tab2) tab2.classList.toggle('active', pageNum === 2);
    updateExportPreview();
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

      const tpl = window.GmmExportTemplates.create({
        getQuestionsList: ctx.getQuestionsList,
        DEFAULT_QUESTIONS: ctx.DEFAULT_QUESTIONS,
        generateSvgPuzzle,
        getExportSchoolLogo
      });

      const getCleanPrintSvg = tpl.getCleanPrintSvg;
      const buildAnswerKeyTableHtml = tpl.buildAnswerKeyTableHtml;
      const buildBgkRubricHtml = tpl.buildBgkRubricHtml;
      const formatTextLines = tpl.formatTextLines;
      const getExportFormData = tpl.getExportFormData;
      const buildDynamicLegendGroups = tpl.buildDynamicLegendGroups;

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

    const htmlContent = tpl.buildPdfPrintHtml(data, printSvg, answerKeySvg, includeKey);
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
        section2Html = tpl.buildWordSection2Html(data, imageHtmlPage2);
      }

      const wordHtml = tpl.buildWordExportHtml(data, imageHtmlPage1, section2Html);
      const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
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
