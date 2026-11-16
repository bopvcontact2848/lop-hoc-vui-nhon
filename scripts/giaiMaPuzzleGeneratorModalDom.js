/**
 * ==============================================================================
 * MODULE TEMPLATE DOM MODAL TẠO MA TRẬN TRANH TỰ ĐỘNG (GIẢI MÃ BÍ MẬT)
 * File: scripts/giaiMaPuzzleGeneratorModalDom.js
 * Trách nhiệm: Khởi tạo DOM cho cửa sổ Thiết kế & Bộ sưu tập tranh bí ẩn.
 * ==============================================================================
 */
(function () {
  'use strict';

  function createGeneratorModalDOM(onOverlayClose) {
    const div = document.createElement('div');
    div.id = 'gmmGeneratorModal';
    div.className = 'gmm-submodal-overlay gmm-generator-overlay';
    div.style.cssText = 'display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 100050; background: #0f172a; align-items: stretch; justify-content: stretch; padding: 0; margin: 0;';
    div.addEventListener('click', function (e) {
      if (e.target === div && typeof onOverlayClose === 'function') onOverlayClose();
    });
    div.innerHTML = `
      <style>
        #gmmGeneratorModal .gmm-generator-modal-card {
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
        }
        #gmmGenPreviewWrap svg {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain;
          display: block;
        }
        #gmmGenPreviewWrap .gmm-svg-region:hover {
          filter: brightness(1.14) saturate(1.15);
        }
        @keyframes gmmMarkerChipPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.85); }
          40% { transform: scale(1.06); box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.55); }
          100% { transform: scale(1); box-shadow: 0 0 14px rgba(250, 204, 21, 0.55); }
        }
        #gmmQuickMarkerEditorGrid .gmm-marker-chip.gmm-marker-chip-active-flash {
          border: 2px solid #facc15 !important;
          background: rgba(234, 179, 8, 0.25) !important;
          animation: gmmMarkerChipPulse 0.65s ease-out;
          box-shadow: 0 0 14px rgba(250, 204, 21, 0.55) !important;
        }
        #gmmGenPreviewWrap .gmm-svg-region.gmm-preview-cell-flash {
          stroke: #facc15 !important;
          stroke-width: 3.2px !important;
          filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.95));
        }
        #gmmGeneratorModal.preview-only-fullscreen #gmmGenLeftConfigCol,
        #gmmGeneratorModal.preview-only-fullscreen #gmmGenMarkerCard,
        #gmmGeneratorModal.preview-only-fullscreen #gmmGenPresetCollectionCard {
          display: none !important;
        }
        #gmmGeneratorModal.preview-only-fullscreen #gmmGenPreviewWrap {
          height: calc(100vh - 134px) !important;
          max-height: calc(100vh - 134px) !important;
          border-color: rgba(56, 189, 248, 0.55) !important;
          box-shadow: 0 12px 45px rgba(0, 0, 0, 0.75) !important;
        }
      </style>
      <div class="gmm-generator-modal-card" style="width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; border: none; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; flex-direction: column; overflow: hidden; color: #f8fafc;">
        <div class="gmm-header" style="padding: 10px 20px; border-bottom: 1px solid rgba(56, 189, 248, 0.25); flex-shrink: 0;">
          <div class="gmm-header-title">
            <div class="gmm-title-icon" style="background: linear-gradient(135deg, #0284c7, #0369a1);">✨</div>
            <div class="gmm-title-text">
              <h3>BỘ CÔNG CỤ TẠO MA TRẬN TRANH TỰ ĐỘNG & BỘ SƯU TẬP</h3>
              <p>Tự động sinh bức tranh bí ẩn từ bất kỳ thông điệp nào • Tùy chỉnh màu bút dạ &amp; Bộ sưu tập tranh</p>
            </div>
          </div>
          <button type="button" class="gmm-btn-ctrl secondary" onclick="GiaiMaPuzzleGenerator.closeGeneratorModal()" style="border-radius: 8px; padding: 6px 14px; font-weight: 800; font-size: 0.85rem; border-color: rgba(248, 113, 113, 0.45); color: #fca5a5;" title="Đóng cửa sổ Tạo Tranh (ESC)">✕ Đóng</button>
        </div>

        <div style="display: flex; flex: 1; overflow: hidden; padding: 14px 20px; gap: 18px;">
          <div id="gmmGenLeftConfigCol" style="flex: 0 0 430px; max-width: 37vw; display: flex; flex-direction: column; gap: 12px; background: rgba(15, 23, 42, 0.65); padding: 16px 18px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1); overflow-y: auto;">
            <h4 style="margin: 0; color: #38bdf8; font-size: 1rem;">📝 1. Nhập thông điệp bức tranh muốn giải mã:</h4>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Từ khóa / Thông điệp bí mật:</label>
                <div style="display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                  <span style="font-size: 0.72rem; color: #94a3b8;">Chèn nhanh:</span>
                  <button type="button" onclick="GiaiMaPuzzleGenerator.insertSymbolToInput(' ❤️ ')" style="padding: 2px 7px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: 1px solid rgba(244, 63, 94, 0.45); background: rgba(225, 29, 72, 0.22); color: #fda4af; cursor: pointer;" title="Chèn hình Trái tim vào giữa dòng chữ (hoặc gõ trực tiếp <3, ❤️)">+ ❤️ Tim</button>
                  <button type="button" onclick="GiaiMaPuzzleGenerator.insertSymbolToInput(' ★ ')" style="padding: 2px 7px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: 1px solid rgba(250, 204, 21, 0.45); background: rgba(202, 138, 4, 0.22); color: #fde047; cursor: pointer;" title="Chèn hình Ngôi sao vào giữa dòng chữ (hoặc gõ trực tiếp *, ★)">+ ★ Sao</button>
                  <button type="button" onclick="GiaiMaPuzzleGenerator.insertSymbolToInput(' 🪷 ')" style="padding: 2px 7px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.45); background: rgba(5, 150, 105, 0.22); color: #6ee7b7; cursor: pointer;" title="Chèn hình Hoa sen vào giữa dòng chữ (hoặc gõ trực tiếp 🪷, 🌸)">+ 🪷 Sen</button>
                </div>
              </div>
              <input type="text" id="gmmGenInputText" value="TRI ÂN THẦY CÔ 20/11"
                     placeholder="VD: LỚP 9A ❤️ THẦY CÔ, ★ TIẾN LÊN ĐOÀN VIÊN ★ (gõ <3, ❤️, ★, 🪷)..."
                     style="width: 100%; margin-top: 5px; padding: 9px 12px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; color: #fff; font-weight: 800; font-size: 0.96rem;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Số lượng câu hỏi:</label>
                <select id="gmmGenQCount" onchange="GiaiMaPuzzleGenerator.handleGenerateClick()" style="width: 100%; margin-top: 5px; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fde047; font-weight: 700;">
                  <option value="5">5 Câu hỏi (Mầm non / Tiểu học)</option>
                  <option value="8">8 Câu hỏi</option>
                  <option value="10" selected>10 Câu hỏi (Chuẩn THCS & THPT)</option>
                  <option value="12">12 Câu hỏi (Đại hội / Trại hè)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Kiểu dáng ma trận:</label>
                <select id="gmmGenMeshStyle" onchange="GiaiMaPuzzleGenerator.handleGenerateClick()" style="width: 100%; margin-top: 5px; padding: 7px 10px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; color: #38bdf8; font-weight: 700;">
                  <option value="polygon" selected>🔷 Đa giác nghệ thuật (Chuẩn nét 20/11)</option>
                  <option value="pixel">🟩 Ô vuông Pixel Art (Retro Lego)</option>
                  <option value="hexagon">🐝 Lưới tổ ong lục giác (Hexagon Grid)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 10px;">
              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Độ khó (Kích thước mảnh):</label>
                <select id="gmmGenDifficulty" onchange="GiaiMaPuzzleGenerator.handleGenerateClick()" style="width: 100%; margin-top: 5px; padding: 7px 9px; background: #0f172a; border: 1px solid #34d399; border-radius: 8px; color: #6ee7b7; font-weight: 700;">
                  <option value="easy">🟢 Dễ: ~180 mảnh lớn</option>
                  <option value="normal" selected>🔵 Chuẩn: ~240 mảnh vừa</option>
                  <option value="hard">🔥 Khó: ~350 mảnh nhỏ</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Độ dày nét viền ô:</label>
                <select id="gmmGenStrokeWidth" onchange="GiaiMaPuzzleGenerator.handleStrokeWidthChange()" style="width: 100%; margin-top: 5px; padding: 7px 9px; background: #0f172a; border: 1px solid #a855f7; border-radius: 8px; color: #e9d5ff; font-weight: 700;">
                  <option value="1.2">Mảnh 1.2px (Nét thanh)</option>
                  <option value="1.8" selected>Chuẩn 1.8px (Đa năng)</option>
                  <option value="2.5">Đậm 2.5px (Rõ nét)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Biểu tượng trang trí góc tranh:</label>
                <select id="gmmGenDecorMotif" onchange="GiaiMaPuzzleGenerator.handleGenerateClick()" style="width: 100%; margin-top: 5px; padding: 7px 10px; background: #0f172a; border: 1px solid #f59e0b; border-radius: 8px; color: #fde047; font-weight: 700;">
                  <option value="auto" selected>✨ Tự động theo chủ đề</option>
                  <option value="stars">⭐ Ngôi sao &amp; Nguyệt quế (26/3)</option>
                  <option value="lotus">🪷 Hoa sen &amp; Nhành lá (8/3, 20/11)</option>
                  <option value="hearts">💖 Trái tim &amp; Tia nắng (Hạnh phúc)</option>
                  <option value="bamboo">🎋 Búp măng non &amp; Sao (Đội viên)</option>
                  <option value="none">🚫 Không chèn (Chỉ chữ lớn)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Tỉ lệ thước đo giấy:</label>
                <select id="gmmGenPaperSize" onchange="GiaiMaPuzzleGenerator.handlePaperSizeChange()" style="width: 100%; margin-top: 5px; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #34d399; font-weight: 700;">
                  <option value="A1" selected>Khổ A1 (Bạt lớn)</option>
                  <option value="A0">Khổ A0 (Hội trường)</option>
                  <option value="A3">Khổ A3 (Bàn nhóm)</option>
                  <option value="A4">Khổ A4 (Cá nhân)</option>
                </select>
              </div>
            </div>

            <button type="button" class="gmm-btn-ctrl primary" onclick="GiaiMaPuzzleGenerator.handleGenerateClick()" style="padding: 10px; font-weight: 800; font-size: 0.94rem; justify-content: center; background: linear-gradient(135deg, #0284c7, #2563eb);">
              🚀 Sinh Ma Trận Mới Tự Động
            </button>

            <div style="padding: 10px 12px; border-radius: 10px; background: rgba(15, 23, 42, 0.78); border: 1px dashed rgba(56, 189, 248, 0.35); color: #cbd5e1; font-size: 0.78rem; line-height: 1.45;">
              💡 <strong style="color: #38bdf8;">Hướng dẫn:</strong> Sau khi tạo tranh ưng ý, bấm <strong>🎯 Áp Dụng Ngay Vào Ván Thi Đấu</strong> bên dưới. Để xuất &amp; in học liệu (A4 / Bạt A1 / Gói 1 chạm), sử dụng nút <strong>🖨️ Xuất &amp; In Học Liệu</strong> tại mục Cài Đặt.
            </div>

            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <button type="button" class="gmm-btn-ctrl warning" onclick="GiaiMaPuzzleGenerator.handleApplyToGame(false)" style="padding: 10px; font-weight: 800; font-size: 0.92rem; justify-content: center;">
                🎯 Áp Dụng Ngay Vào Ván Thi Đấu
              </button>
              <button type="button" class="gmm-btn-ctrl" onclick="GiaiMaPuzzleGenerator.handleApplyToGame(true)" style="padding: 10px; font-weight: 800; font-size: 0.92rem; justify-content: center; background: linear-gradient(135deg, #0284c7, #6366f1); border: 1.5px solid #38bdf8; color: #ffffff; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);">
                🎨 Chuyển Sang Tab 3 Xem Tranh Vừa Tạo ➔
              </button>
            </div>
          </div>

          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9px; overflow-y: auto; padding-right: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 800; color: #fde047; font-size: 0.92rem;">👁️ Xem trước <span style="font-size: 0.74rem; color: #7dd3fc; font-weight: 700;">(👆 Bấm trực tiếp vào chữ trên tranh để đổi màu)</span>:</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" id="gmmPreviewModeUncolored" class="gmm-btn-ctrl secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="GiaiMaPuzzleGenerator.setPreviewMode(false)">Bản Đen Trắng (Học Sinh)</button>
                <button type="button" id="gmmPreviewModeColored" class="gmm-btn-ctrl primary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="GiaiMaPuzzleGenerator.setPreviewMode(true)">Bản Đã Tô Màu (Đáp Án)</button>
                <button type="button" id="gmmPreviewSeamlessBtn" class="gmm-btn-ctrl secondary" style="padding: 4px 10px; font-size: 0.78rem; border-color: rgba(250, 204, 21, 0.45); color: #fde047;" onclick="GiaiMaPuzzleGenerator.togglePreviewSeamless()" title="Ẩn đường gân mảnh ghép bên trong chữ màu để xem chữ liền khối giống Tab 4 Kết Quả Tranh Giáo Viên">✨ Chữ Liền Khối: Tắt</button>
                <button type="button" id="gmmPreviewFullZoomBtn" class="gmm-btn-ctrl secondary" style="padding: 4px 10px; font-size: 0.78rem; border-color: rgba(56, 189, 248, 0.55); color: #7dd3fc;" onclick="GiaiMaPuzzleGenerator.togglePreviewFullscreen()" title="Ẩn tạm các bảng điều khiển để phóng to riêng bức tranh tràn 100% màn hình chiếu lên TV cho cả lớp xem">🔍 Phóng To Tranh 100%</button>
              </div>
            </div>

            <div id="gmmGenPreviewWrap" onclick="GiaiMaPuzzleGenerator.handlePreviewCanvasClick(event)" style="width: 100%; height: 44vh; max-height: 44vh; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 6px; background: #0b1120; border: 2px solid rgba(255,255,255,0.15); border-radius: 12px; overflow: hidden;">
            </div>

            <div id="gmmActiveRuleQuickBar" style="display: none; padding: 7px 11px; border-radius: 9px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96)); border: 1.5px solid #facc15; box-shadow: 0 4px 16px rgba(250, 204, 21, 0.22); align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; flex-shrink: 0;">
            </div>

            <div id="gmmGenPaperSpecBar" style="padding: 7px 11px; border-radius: 8px; background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(52, 211, 153, 0.35); color: #e2e8f0; font-size: 0.76rem; line-height: 1.4; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; flex-shrink: 0;">
            </div>

            <div id="gmmGenMarkerCard" style="background: rgba(15, 23, 42, 0.78); padding: 9px 11px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.28); flex-shrink: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 6px; flex-wrap: wrap;">
                <span style="font-weight: 800; color: #38bdf8; font-size: 0.79rem;">🖍️ SỬA TÊN MÀU &amp; KHÓA MÀU ƯNG Ý (Bấm 🔒 để giữ cố định màu khi đổi bảng màu / tạo lại tranh):</span>
                <div style="display: inline-flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" id="gmmBtnUnlockAllColors" class="gmm-btn-ctrl secondary" style="display: none; padding: 2px 8px; font-size: 0.71rem; border-color: #facc15; color: #fde047; background: rgba(234, 179, 8, 0.18);" onclick="GiaiMaPuzzleGenerator.handleUnlockAllMarkerColors()" title="Mở khóa toàn bộ các ô màu đang khóa">🔓 Mở khóa tất cả</button>
                  <button type="button" class="gmm-btn-ctrl secondary" style="padding: 2px 9px; font-size: 0.72rem; border-color: #f59e0b; color: #fde047; background: rgba(245, 158, 11, 0.16);" onclick="GiaiMaPuzzleGenerator.handleApplyHighContrastPalette()" title="Tự động gán 10 màu cơ bản khác biệt rõ rệt nhất cho các ô chưa khóa 🔒">🎨 Đổi Nhanh Bảng 10 Màu Tương Phản Cao</button>
                  <button type="button" class="gmm-btn-ctrl secondary" style="padding: 2px 8px; font-size: 0.72rem;" onclick="GiaiMaPuzzleGenerator.handleResetMarkerNames()" title="Khôi phục tên màu bút dạ mặc định ban đầu cho các ô chưa khóa 🔒">↺ Khôi phục màu gốc</button>
                </div>
              </div>
              <div id="gmmQuickMarkerEditorGrid" class="gmm-marker-editor-grid"></div>
            </div>

            <div id="gmmGenPresetCollectionCard" style="flex: 1; min-height: 180px; background: rgba(15, 23, 42, 0.6); padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="font-weight: 800; color: #94a3b8; font-size: 0.85rem;">📚 BỘ SƯU TẬP TRANH ĐÃ LƯU (<span id="gmmPresetCountBadge">7</span>):</span>
                <button type="button" class="gmm-btn-ctrl secondary" style="padding: 3px 10px; font-size: 0.75rem; border-color: #34d399; color: #a7f3d0;" onclick="GiaiMaPuzzleGenerator.handleSaveCurrentPreset()">💾 Lưu Tranh Hiện Tại Vào BST</button>
              </div>

              <div id="gmmPuzzleServerSyncBar" class="gmm-server-sync-bar" style="margin-top: 0; padding: 5px 8px;">
                <div id="gmmPuzzleSyncBadge" class="gmm-server-sync-badge is-synced">🖥️ Đồng bộ Tranh Server: Đang kết nối...</div>
                <div class="gmm-server-sync-actions">
                  <button type="button" id="gmmBtnTogglePuzzleSync" class="gmm-server-sync-btn is-active" onclick="window.GmmServerPuzzlesSync && GmmServerPuzzlesSync.toggleSyncMode()" title="Bật/tắt đồng bộ Bộ sưu tập tranh tự tạo qua file JSON trên Server Node">🟢 Bật Đồng Bộ</button>
                  <button type="button" id="gmmBtnManualPuzzleSync" class="gmm-server-sync-btn sync-now" onclick="window.GmmServerPuzzlesSync && GmmServerPuzzlesSync.syncNow()" title="Đồng bộ ngay Bộ sưu tập tranh với trình duyệt khác">🔄 Đồng Bộ Tranh</button>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="position: relative; display: flex; align-items: center;">
                  <input type="text" id="gmmPresetSearchInput"
                         placeholder="🔍 Tìm nhanh tên tranh / chủ đề (VD: Hạnh phúc, Bạo lực, 20/11, 8/3, Khối 6...)"
                         oninput="GiaiMaPuzzleGenerator.handlePresetSearchChange(this.value)"
                         style="width: 100%; padding: 7px 30px 7px 10px; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; color: #f8fafc; font-size: 0.8rem; font-weight: 600; outline: none;" />
                  <button type="button" id="gmmPresetSearchClearBtn" onclick="GiaiMaPuzzleGenerator.handlePresetSearchChange('')" style="display: none; position: absolute; right: 6px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding: 2px 5px;" title="Xóa từ khóa tìm kiếm">✕</button>
                </div>
                <div id="gmmPresetFilterBar" style="display: flex; gap: 5px; flex-wrap: wrap;">
                  <button type="button" class="gmm-preset-filter-chip active" data-filter="all" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('all')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid #38bdf8; background: rgba(2, 132, 199, 0.35); color: #ffffff; cursor: pointer;">Tất cả</button>
                  <button type="button" class="gmm-preset-filter-chip" data-filter="builtin" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('builtin')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(30, 41, 59, 0.75); color: #cbd5e1; cursor: pointer;">⭐ Mẫu chuẩn</button>
                  <button type="button" class="gmm-preset-filter-chip" data-filter="custom" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('custom')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(30, 41, 59, 0.75); color: #cbd5e1; cursor: pointer;">💾 GV tự tạo</button>
                  <button type="button" class="gmm-preset-filter-chip" data-filter="polygon" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('polygon')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(30, 41, 59, 0.75); color: #cbd5e1; cursor: pointer;">🔷 Đa giác</button>
                  <button type="button" class="gmm-preset-filter-chip" data-filter="pixel" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('pixel')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(30, 41, 59, 0.75); color: #cbd5e1; cursor: pointer;">🟩 Pixel</button>
                  <button type="button" class="gmm-preset-filter-chip" data-filter="hexagon" onclick="GiaiMaPuzzleGenerator.setPresetFilterTag('hexagon')" style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(30, 41, 59, 0.75); color: #cbd5e1; cursor: pointer;">🐝 Tổ ong</button>
                </div>
              </div>

              <div id="gmmPresetListContainer" style="display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    const parentHost = document.getElementById('giaiMaBiMatModal') || document.body;
    parentHost.appendChild(div);
  }

  window.GiaiMaPuzzleGeneratorModalDom = {
    createGeneratorModalDOM
  };
})();
