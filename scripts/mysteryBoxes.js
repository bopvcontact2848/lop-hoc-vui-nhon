/**
 * ==============================================================================
 * MODULE 6 HỘP QUÀ BÍ ẨN & KHO PHẦN THƯỞNG MỞ RỘNG (scripts/mysteryBoxes.js)
 * - Cho phép Giáo viên cài đặt 6 hoặc nhiều hơn phần thưởng trong Kho Phần Thưởng,
 *   bổ sung nhanh quà tặng học đường (1 đôi giấy kiểm tra, 1 cây viết, quyển vở...)
 *   kèm bảng chọn 40+ Icon trực quan.
 * - Tùy chọn ẩn 1 hoặc 2 "Ngôi Sao Hy Vọng (x2)" trong 6 hộp quà (hoặc Tắt).
 * - Chế độ "Không mở trùng hộp quà giữa các lượt quay": Giữ nguyên các hộp đã mở
 *   qua từng lượt học sinh (tự động tính xác suất săn Ngôi Sao tăng dần ở các hộp còn lại)
 *   cho đến khi cả 6 hộp đều được mở hết rồi mới tự động trộn lại vòng 6 hộp mới.
 * - Tự động lưu phần thưởng hộp quà vừa mở vào Lịch sử gọi tên của học sinh.
 * ==============================================================================
 */

(function () {
  const STORAGE_KEY = 'vong_quay_mystery_boxes_v1';
  const BOX_COUNT = 6;
  const MAX_PRIZE_POOL = 24;

  const DEFAULT_PRIZES = [
    { icon: '🌟', text: 'Cộng 1 Điểm Miệng (+1đ)' },
    { icon: '📄', text: 'Nhận được 1 đôi giấy kiểm tra' },
    { icon: '🖊️', text: 'Nhận được 1 cây viết' },
    { icon: '🍬', text: '1 Phần Quà / Kẹo Ngọt' },
    { icon: '🔥', text: 'Cộng 2 Điểm Thưởng (+2đ)' },
    { icon: '👑', text: 'Đặc Quyền Chọn Bạn Tiếp Theo' }
  ];

  const PRESET_TEMPLATES = {
    school: [
      { icon: '📄', text: 'Nhận được 1 đôi giấy kiểm tra' },
      { icon: '🖊️', text: 'Nhận được 1 cây viết bi' },
      { icon: '📓', text: 'Nhận được 1 quyển vở / sổ tay' },
      { icon: '📏', text: 'Nhận được 1 cây thước kẻ' },
      { icon: '✏️', text: 'Nhận được 1 cây bút chì & tẩy' },
      { icon: '🌟', text: 'Cộng 1 Điểm Miệng (+1đ)' }
    ],
    points: [
      { icon: '🌟', text: 'Cộng 1 Điểm Miệng (+1đ)' },
      { icon: '🔥', text: 'Cộng 2 Điểm Thưởng (+2đ)' },
      { icon: '✨', text: 'Cộng 0.5 Điểm Khuyến Khích' },
      { icon: '💯', text: 'Điểm 10 Tròn Trĩnh' },
      { icon: '👏', text: 'Tràng Pháo Tay Giòn Giã' },
      { icon: '🏆', text: 'Cộng 3 Điểm Thưởng Xuất Sắc (+3đ)' }
    ],
    gifts: [
      { icon: '📄', text: 'Nhận được 1 đôi giấy kiểm tra' },
      { icon: '🖊️', text: 'Nhận được 1 cây viết xinh xắn' },
      { icon: '🍬', text: 'Nhận được 1 viên kẹo ngọt ngào' },
      { icon: '📓', text: 'Nhận được 1 quyển sổ tay nhỏ' },
      { icon: '🧃', text: 'Nhận được 1 hộp sữa tươi' },
      { icon: '🎁', text: '1 Phần Quà Bí Mật Từ Thầy/Cô' }
    ],
    fun: [
      { icon: '👑', text: 'Ngôi Sao May Mắn (+1đ)' },
      { icon: '🎯', text: 'Được Chọn Bạn Tiếp Theo' },
      { icon: '🛡️', text: 'Thẻ Miễn Trừ 1 Câu Hỏi Khó' },
      { icon: '🤝', text: 'Quyền Nhờ 1 Bạn Trợ Giúp' },
      { icon: '👏', text: 'Cả Lớp Vỗ Tay Khen Ngợi' },
      { icon: '🔥', text: 'Cộng 2 Điểm Thưởng May Mắn (+2đ)' }
    ]
  };

  // Danh sách các thẻ gợi ý phần thưởng học đường để Giáo viên bấm 1 chạm là thêm ngay
  const QUICK_REWARD_SUGGESTIONS = [
    { icon: '📄', text: 'Nhận được 1 đôi giấy kiểm tra' },
    { icon: '🖊️', text: 'Nhận được 1 cây viết' },
    { icon: '📓', text: 'Nhận được 1 quyển vở' },
    { icon: '📏', text: 'Nhận được 1 cây thước kẻ' },
    { icon: '✏️', text: 'Nhận được 1 cây bút chì' },
    { icon: '🖍️', text: 'Nhận được 1 cây bút dạ quang' },
    { icon: '🍬', text: 'Nhận được 1 phần kẹo ngọt' },
    { icon: '🧃', text: 'Nhận được 1 hộp sữa tươi' },
    { icon: '🌟', text: 'Cộng 1 Điểm Miệng (+1đ)' },
    { icon: '🔥', text: 'Cộng 2 Điểm Thưởng (+2đ)' },
    { icon: '💯', text: 'Điểm 10 Tròn Trĩnh' },
    { icon: '🛡️', text: 'Thẻ miễn kiểm tra bài cũ 1 lần' },
    { icon: '👑', text: 'Đặc quyền chọn bạn tiếp theo' },
    { icon: '🤝', text: 'Quyền nhờ 1 bạn trợ giúp' }
  ];

  // Bảng 40+ Icon phân loại theo 4 nhóm trực quan cho Giáo viên lựa chọn
  const ICON_CATEGORIES = [
    {
      label: '📚 Dụng cụ học tập:',
      icons: ['📄', '📝', '🖊️', '✒️', '✏️', '🖍️', '📏', '📐', '📓', '📘', '📚', '✂️', '📎', '🎒']
    },
    {
      label: '⭐ Điểm & Vinh danh:',
      icons: ['🌟', '💯', '🔥', '🏆', '🥇', '👑', '🎖️', '💎', '👏', '✨', '🎉', '❤️']
    },
    {
      label: '🍬 Quà & Ăn vặt:',
      icons: ['🎁', '🍬', '🍭', '🍫', '🍪', '🧃', '🧋', '🍦', '🍰', '🧸', '🎈', '🎀']
    },
    {
      label: '🎯 Đặc quyền & Vui:',
      icons: ['🎯', '🛡️', '💡', '🤝', '🎟️', '🎤', '🎲', '🚀', '🍀', '⚡', '🔔', '🦄']
    }
  ];

  // Danh sách kho phần thưởng do giáo viên cài đặt (>= 6 món)
  let configuredPrizes = [];
  // Số lượng Ngôi Sao Hy Vọng ẩn trong 6 hộp quà: 0 (Tắt), 1 (1 sao), 2 (2 sao)
  let hopeStarCount = 1;
  // Chế độ "Không mở trùng hộp quà giữa các lượt quay" (true = giữ hộp đã mở cho đến khi mở đủ 6 hộp)
  let noRepeatBoxMode = true;
  // Tạm lưu lựa chọn số lượng sao trong Modal cài đặt trước khi bấm Lưu
  let modalSelectedStarCount = 1;
  // Danh sách phần thưởng nháp đang chỉnh sửa trong Modal
  let modalDraftPrizes = [];
  // Chỉ số dòng phần thưởng đang chọn để đổi Icon / điền nhanh trong Modal
  let activeEditingRowIdx = 0;

  // Danh sách 6 ô hộp quà thực tế trên màn hình (đã xáo trộn ngẫu nhiên)
  let boxSlots = [];
  // Chỉ số hộp quà học sinh đã chọn trước khi trả lời câu hỏi (-1 nếu chưa chọn)
  let preSelectedBoxIdx = -1;
  // Lưu phần thưởng vừa trao cho học sinh hiện tại để hiển thị trên thanh trạng thái
  let lastAwardedInfo = null;

  function isHopeStarEnabled() {
    return hopeStarCount > 0;
  }

  function clonePrizes(list) {
    const source = Array.isArray(list) ? list : [];
    const targetLen = Math.min(Math.max(source.length, BOX_COUNT), MAX_PRIZE_POOL);
    const normalized = [];
    for (let i = 0; i < targetLen; i++) {
      const fallback = DEFAULT_PRIZES[i % DEFAULT_PRIZES.length];
      const item = source[i] || fallback;
      normalized.push({
        icon: (item.icon || fallback.icon || '🎁').trim() || '🎁',
        text: (item.text || fallback.text).trim() || fallback.text
      });
    }
    return normalized;
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          configuredPrizes = clonePrizes(parsed);
          hopeStarCount = 1;
          noRepeatBoxMode = true;
          return;
        } else if (parsed && Array.isArray(parsed.prizes) && parsed.prizes.length >= 5) {
          configuredPrizes = clonePrizes(parsed.prizes);
          if (typeof parsed.hopeStarCount === 'number' && [0, 1, 2].includes(parsed.hopeStarCount)) {
            hopeStarCount = parsed.hopeStarCount;
          } else if (typeof parsed.hopeStarEnabled === 'boolean') {
            hopeStarCount = parsed.hopeStarEnabled ? 1 : 0;
          } else {
            hopeStarCount = 1;
          }
          noRepeatBoxMode = typeof parsed.noRepeatBoxMode === 'boolean' ? parsed.noRepeatBoxMode : true;
          return;
        }
      }
    } catch (e) {
      console.warn('Không thể đọc cài đặt 6 hộp quà:', e);
    }
    configuredPrizes = clonePrizes(DEFAULT_PRIZES);
    hopeStarCount = 1;
    noRepeatBoxMode = true;
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        prizes: configuredPrizes,
        hopeStarCount: hopeStarCount,
        hopeStarEnabled: hopeStarCount > 0,
        noRepeatBoxMode: noRepeatBoxMode
      }));
    } catch (e) {
      console.warn('Không thể lưu cài đặt 6 hộp quà:', e);
    }
  }

  /**
   * Thuật toán thông minh nhân đôi nội dung phần thưởng khi trúng Ngôi Sao Hy Vọng x2
   */
  function computeDoubledPrizeText(originalText) {
    const raw = String(originalText || '').trim();
    if (!raw) return 'Phần thưởng Nhân Đôi (x2)';

    // Nếu là "Điểm 10", giữ nguyên Điểm 10 và cộng thêm phần thưởng nhân đôi
    if (/điểm\s*10\b/i.test(raw)) {
      return `${raw} + Thưởng Nhân Đôi (x2)`;
    }

    let hasNumberReplaced = false;
    const doubledText = raw.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
      const normalized = match.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0 && num < 10) {
        hasNumberReplaced = true;
        const doubled = Math.round(num * 2 * 100) / 100;
        return String(doubled);
      }
      return match;
    });

    if (hasNumberReplaced) {
      return `${doubledText} (Nhân đôi x2)`;
    }
    return `${raw} (Nhân đôi x2)`;
  }

  /**
   * Chọn ngẫu nhiên N vị trí không trùng nhau trong 6 hộp quà để ẩn Ngôi Sao Hy Vọng
   */
  function pickRandomStarIndices(count) {
    const starSet = new Set();
    if (count <= 0) return starSet;
    const indices = Array.from({ length: BOX_COUNT }, (_, idx) => idx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    const targetCount = Math.min(count, BOX_COUNT);
    for (let k = 0; k < targetCount; k++) {
      starSet.add(indices[k]);
    }
    return starSet;
  }

  /**
   * Thuật toán Fisher-Yates xáo trộn ngẫu nhiên Kho Phần Thưởng,
   * lấy ra 6 phần thưởng cho 6 hộp quà và ẩn ngẫu nhiên 1 hoặc 2 Ngôi Sao Hy Vọng
   */
  function buildShuffledSlots() {
    const fullPool = clonePrizes(configuredPrizes);
    for (let i = fullPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = fullPool[i];
      fullPool[i] = fullPool[j];
      fullPool[j] = temp;
    }

    const selectedSix = fullPool.slice(0, BOX_COUNT);
    const starIndices = pickRandomStarIndices(hopeStarCount);
    preSelectedBoxIdx = -1;

    boxSlots = selectedSix.map((prize, idx) => ({
      boxNumber: idx + 1,
      icon: prize.icon,
      text: prize.text,
      doubledText: computeDoubledPrizeText(prize.text),
      hasHopeStar: starIndices.has(idx),
      isDoubled: false,
      opened: false,
      openedBy: ''
    }));
  }

  /**
   * Tính toán thống kê trực tiếp các hộp chưa mở và xác suất săn Ngôi Sao Hy Vọng còn lại
   */
  function getRoundStats() {
    if (!boxSlots || boxSlots.length !== BOX_COUNT) {
      return {
        unopenedCount: BOX_COUNT,
        openedCount: 0,
        remainingStars: hopeStarCount,
        chancePercent: Math.round((hopeStarCount / BOX_COUNT) * 100)
      };
    }
    const unopenedSlots = boxSlots.filter(s => !s.opened);
    const unopenedCount = unopenedSlots.length;
    const openedCount = BOX_COUNT - unopenedCount;
    const remainingStars = hopeStarCount > 0
      ? unopenedSlots.filter(s => s.hasHopeStar).length
      : 0;
    const chancePercent = (unopenedCount > 0 && remainingStars > 0)
      ? Math.round((remainingStars / unopenedCount) * 100)
      : 0;
    return {
      unopenedCount,
      openedCount,
      remainingStars,
      chancePercent
    };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatShortStudentName(fullName) {
    const clean = String(fullName || '').trim();
    if (!clean) return '';
    const parts = clean.split(/\s+/);
    if (parts.length <= 2) return clean;
    return parts.slice(-2).join(' ');
  }

  /**
   * Lấy tên Học sinh / Nhóm vừa được gọi gần nhất để tự động gắn phần thưởng vào Lịch sử
   */
  function getActiveWinnerName() {
    if (window.state && Array.isArray(window.state.lastResult) && window.state.lastResult.length > 0 && window.state.lastResult[0]) {
      return String(window.state.lastResult[0]);
    }
    if (typeof window.getCurrentClass === 'function') {
      const cls = window.getCurrentClass();
      if (cls && Array.isArray(cls.history) && cls.history.length > 0 && cls.history[0].name) {
        return String(cls.history[0].name);
      }
    }
    return '';
  }

  /**
   * Cập nhật thanh hiển thị Học sinh đang mở quà & phần thưởng vừa lưu vào lịch sử
   */
  function updateActiveStudentBar() {
    const bar = document.getElementById('mysteryActiveStudentBar');
    const infoEl = document.getElementById('mysteryActiveStudentText');
    if (!bar || !infoEl) return;

    const winnerName = getActiveWinnerName();
    if (winnerName) {
      bar.classList.add('has-winner');
      const rewardChip = (lastAwardedInfo && lastAwardedInfo.studentName === winnerName)
        ? `<span class="mystery-student-reward-chip">${escapeHtml(lastAwardedInfo.badgeText)}</span>`
        : '';
      infoEl.innerHTML = `
        <span>🎓 Học sinh:</span>
        <strong title="${escapeHtml(winnerName)}">${escapeHtml(winnerName)}</strong>
        ${rewardChip}
      `;
    } else {
      bar.classList.remove('has-winner');
      infoEl.innerHTML = `
        <span>🎓 Lượt nhận thưởng:</span>
        <strong>Quay vòng quay để gọi tên học sinh</strong>
      `;
    }
  }

  /**
   * Đồng bộ giao diện nút Ngôi Sao Hy Vọng, nút Không Mở Trùng & phụ đề xác suất
   */
  function updateHopeStarUI() {
    const starBtn = document.getElementById('btnToggleHopeStarMode');
    const starIcon = document.getElementById('hopeStarBtnIcon');
    const starLabel = document.getElementById('hopeStarBtnLabel');
    const noRepeatBtn = document.getElementById('btnToggleNoRepeatBox');
    const noRepeatIcon = document.getElementById('noRepeatBoxBtnIcon');
    const noRepeatLabel = document.getElementById('noRepeatBoxBtnLabel');
    const subtitle = document.getElementById('mysteryHopeStarSubtitle');

    if (starBtn) {
      starBtn.classList.toggle('active', hopeStarCount > 0);
      starBtn.classList.toggle('is-two-stars', hopeStarCount === 2);
    }
    if (starIcon) {
      starIcon.textContent = hopeStarCount === 2 ? '🌟🌟' : (hopeStarCount === 1 ? '🌟' : '⭐');
    }
    if (starLabel) {
      if (hopeStarCount === 2) {
        starLabel.textContent = 'Ngôi sao x2: 2 sao';
      } else if (hopeStarCount === 1) {
        starLabel.textContent = 'Ngôi sao x2: 1 sao';
      } else {
        starLabel.textContent = 'Ngôi sao x2: TẮT';
      }
    }

    if (noRepeatBtn) {
      noRepeatBtn.classList.toggle('active', noRepeatBoxMode);
    }
    if (noRepeatIcon) {
      noRepeatIcon.textContent = noRepeatBoxMode ? '🔒' : '🔄';
    }
    if (noRepeatLabel) {
      noRepeatLabel.textContent = noRepeatBoxMode ? 'Không mở trùng' : 'Mở lại mỗi lượt';
    }

    if (subtitle) {
      const stats = getRoundStats();
      if (noRepeatBoxMode && stats.openedCount > 0 && stats.unopenedCount > 0) {
        if (hopeStarCount > 0) {
          if (stats.remainingStars > 0) {
            subtitle.textContent = `🔥 Còn ${stats.unopenedCount}/6 hộp chưa mở • Ẩn ${stats.remainingStars} 🌟 Ngôi sao (Cơ hội x2: ${stats.chancePercent}%!)`;
          } else {
            subtitle.textContent = `📦 Còn ${stats.unopenedCount}/6 hộp chưa mở (Ngôi sao vòng này đã được mở)`;
          }
        } else {
          subtitle.textContent = `📦 Còn ${stats.unopenedCount}/6 hộp chưa mở (Không mở trùng giữa các lượt)`;
        }
      } else if (hopeStarCount > 0) {
        const baseChance = Math.round((hopeStarCount / BOX_COUNT) * 100);
        const poolNote = configuredPrizes.length > BOX_COUNT ? ` • Kho ${configuredPrizes.length} quà` : '';
        subtitle.textContent = `Ẩn ${hopeStarCount} 🌟 Ngôi sao may mắn (Cơ hội ${baseChance}% • Trả lời đúng = x2${poolNote})`;
      } else {
        subtitle.textContent = 'Học sinh chọn 1 trong 6 hộp quà bất kỳ để mở thưởng';
      }
    }

    // Đồng bộ nút "🎁 6 Hộp Quà Bí Ẩn" ở menu bên trái (#wheelControlPanel)
    const navBadge = document.getElementById('wheelPanelMysteryBadge');
    const navDesc = document.getElementById('wheelPanelMysteryDesc');
    const navMiniBadge = document.getElementById('wheelPanelMysteryMiniBadge');
    const navStats = getRoundStats();

    if (navBadge) {
      if (hopeStarCount === 2) {
        navBadge.textContent = '🌟x2';
        navBadge.style.display = 'inline-flex';
      } else if (hopeStarCount === 1) {
        navBadge.textContent = '🌟x1';
        navBadge.style.display = 'inline-flex';
      } else {
        navBadge.textContent = `${configuredPrizes.length} quà`;
        navBadge.style.display = 'inline-flex';
      }
    }

    if (navDesc) {
      if (noRepeatBoxMode && navStats.openedCount > 0 && navStats.unopenedCount > 0) {
        const starPart = (hopeStarCount > 0 && navStats.remainingStars > 0)
          ? ` • Xác suất 🌟 ${navStats.chancePercent}%`
          : '';
        navDesc.textContent = `Còn ${navStats.unopenedCount}/6 hộp chưa mở${starPart}`;
      } else {
        navDesc.textContent = `Kho ${configuredPrizes.length} quà • Bấm để mở 6 hộp`;
      }
    }

    if (navMiniBadge) {
      navMiniBadge.textContent = `${navStats.unopenedCount}/6`;
    }
  }

  /**
   * Vẽ giao diện 6 Hộp Quà Bí Ẩn
   */
  function renderBoxes() {
    const grid = document.getElementById('mysteryBoxesGrid');
    if (!grid) return;

    if (!boxSlots || boxSlots.length !== BOX_COUNT) {
      buildShuffledSlots();
    }

    updateHopeStarUI();
    updateActiveStudentBar();

    grid.innerHTML = boxSlots.map((slot, idx) => {
      const themeIdx = (idx % BOX_COUNT) + 1;

      // 1. Trạng thái hộp quà ĐÃ MỞ
      if (slot.opened) {
        const displayPrize = slot.isDoubled ? slot.doubledText : slot.text;
        const doubledClass = slot.isDoubled ? 'is-hope-star-doubled' : '';
        const lockedClass = noRepeatBoxMode ? 'is-locked-opened' : '';
        const starTag = slot.isDoubled
          ? `🌟 Hộp ${slot.boxNumber} (NHÂN ĐÔI x2)`
          : (slot.hasHopeStar ? `⭐ Hộp ${slot.boxNumber} (Có Sao)` : `✓ Hộp ${slot.boxNumber}`);
        const displayIcon = slot.isDoubled ? `🌟${slot.icon}` : slot.icon;
        const openedByBadge = slot.openedBy
          ? `<span class="gift-box-opened-by" title="Đã mở bởi: ${escapeHtml(slot.openedBy)}">👤 ${escapeHtml(formatShortStudentName(slot.openedBy))}</span>`
          : '';

        return `
          <div class="mystery-gift-box box-theme-${themeIdx} is-opened ${doubledClass} ${lockedClass}" onclick="MysteryBoxesModule.openBox(${idx})" title="Hộp quà ${slot.boxNumber} (Đã mở${slot.openedBy ? ' bởi ' + escapeHtml(slot.openedBy) : ''}): ${escapeHtml(displayPrize)}">
            <div class="gift-box-opened-view">
              <span class="gift-box-opened-tag">${escapeHtml(starTag)}</span>
              <div class="gift-box-prize-icon">${escapeHtml(displayIcon)}</div>
              <div class="gift-box-prize-text">${escapeHtml(displayPrize)}</div>
              ${openedByBadge}
            </div>
          </div>
        `;
      }

      // 2. Trạng thái hộp quà ĐANG ĐƯỢC HỌC SINH CHỌN TRƯỚC KHI TRẢ LỜI (Pre-selected)
      if (isHopeStarEnabled() && preSelectedBoxIdx === idx) {
        return `
          <div class="mystery-gift-box box-theme-${themeIdx} is-preselected" onclick="MysteryBoxesModule.confirmPreselectedBox(${idx}, true)" title="Bấm lần nữa khi học sinh trả lời đúng trong thời gian đếm ngược để mở Hộp quà ${slot.boxNumber}!">
            <div class="gift-box-closed-view">
              <span class="gift-box-preselected-badge">🎯 ĐÃ CHỌN HỘP ${slot.boxNumber}</span>
              <div class="gift-box-3d-emoji">🎁</div>
              <span class="gift-box-confirm-open-btn">✅ Trả lời đúng (Mở)</span>
            </div>
          </div>
        `;
      }

      // 3. Trạng thái hộp quà ĐANG ĐÓNG (Bí ẩn)
      const hintText = isHopeStarEnabled() ? '? Chọn hộp này' : '? Mở ngay';
      return `
        <div class="mystery-gift-box box-theme-${themeIdx}" onclick="MysteryBoxesModule.openBox(${idx})" title="Bấm để chọn Hộp quà bí ẩn số ${slot.boxNumber}">
          <div class="gift-box-closed-view">
            <span class="gift-box-number-badge">Hộp quà ${slot.boxNumber}</span>
            <div class="gift-box-3d-emoji">🎁</div>
            <span class="gift-box-tap-hint">${hintText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function setBannerMessage(html) {
    const banner = document.getElementById('mysteryRevealBanner');
    if (banner) {
      banner.innerHTML = html;
    }
  }

  /**
   * Ghi nhận phần thưởng hộp quà vào Lịch sử gọi tên của học sinh & cập nhật thẻ chiến thắng dưới vòng quay
   */
  function attachRewardToStudentHistory(slot, finalPrizeText, isDoubled) {
    const winnerName = getActiveWinnerName();
    const prefix = isDoubled ? `🌟x2 Hộp ${slot.boxNumber}:` : `🎁 Hộp ${slot.boxNumber}:`;
    const historyBadge = `${prefix} ${slot.icon} ${finalPrizeText}`;

    const wheelWinnerCard = document.getElementById('wheelWinnerCard');
    if (wheelWinnerCard && winnerName) {
      wheelWinnerCard.style.display = 'flex';
      let existingPill = wheelWinnerCard.querySelector('.winner-box-reward-pill');
      if (!existingPill) {
        existingPill = document.createElement('div');
        wheelWinnerCard.appendChild(existingPill);
      }
      existingPill.className = `winner-box-reward-pill ${isDoubled ? 'is-doubled' : ''}`;
      existingPill.textContent = historyBadge;
    }

    if (!winnerName) {
      updateActiveStudentBar();
      return null;
    }

    if (typeof window.updateStudentLastReward === 'function') {
      const updatedRecord = window.updateStudentLastReward(winnerName, historyBadge);
      lastAwardedInfo = {
        studentName: updatedRecord ? updatedRecord.name : winnerName,
        badgeText: historyBadge
      };
      updateActiveStudentBar();
      return updatedRecord;
    }
    return null;
  }

  /**
   * Xử lý khi học sinh bấm vào 1 hộp quà
   */
  function openBox(idx) {
    if (!boxSlots || !boxSlots[idx]) return;
    const slot = boxSlots[idx];

    if (slot.opened) {
      const stats = getRoundStats();
      const prizeStr = slot.isDoubled ? slot.doubledText : slot.text;
      if (noRepeatBoxMode && stats.unopenedCount > 0) {
        const ownerText = slot.openedBy ? ` bởi <strong>${escapeHtml(slot.openedBy)}</strong>` : '';
        setBannerMessage(`
          <span>🔒 Hộp quà ${slot.boxNumber} đã được mở${ownerText} (${escapeHtml(slot.icon)} ${escapeHtml(prizeStr)}). Hãy chọn <strong>1 trong ${stats.unopenedCount} hộp chưa mở</strong> còn lại!</span>
        `);
        if (typeof showToast === 'function') {
          showToast(`🔒 Hộp ${slot.boxNumber} đã mở rồi! Hãy chọn 1 trong ${stats.unopenedCount} hộp quà còn lại nhé.`, 'info');
        }
      } else {
        setBannerMessage(`🎉 Hộp quà ${slot.boxNumber}: <strong>${escapeHtml(slot.icon)} ${escapeHtml(prizeStr)}</strong>`);
      }
      return;
    }

    if (isHopeStarEnabled() && preSelectedBoxIdx !== idx) {
      preSelectedBoxIdx = idx;
      renderBoxes();

      if (window.sound) {
        window.sound.init();
        if (typeof window.sound.playTick === 'function') {
          window.sound.playTick(680, 0.4);
        }
      }

      const winnerName = getActiveWinnerName();
      const studentLabel = winnerName ? `<strong>${escapeHtml(winnerName)}</strong> đã chọn` : `Đã chọn`;
      const timerSt = (typeof window.getTimerState === 'function') ? window.getTimerState() : { isRunning: false, remainingSeconds: 30 };

      const startTimerBtnHtml = !timerSt.isRunning
        ? `<button type="button" class="mystery-banner-btn btn-timer-quick" onclick="if(typeof startTimer==='function') startTimer(); MysteryBoxesModule.onTimerStateChanged();">⏱️ Chạy đếm ngược (${timerSt.remainingSeconds}s)</button>`
        : `<span style="color:#15803d;font-weight:900;">⏳ Đang đếm ngược...</span>`;

      setBannerMessage(`
        <span>🎯 ${studentLabel} <strong>Hộp ${slot.boxNumber}</strong>!</span>
        ${startTimerBtnHtml}
        <button type="button" class="mystery-banner-btn btn-correct" onclick="MysteryBoxesModule.confirmPreselectedBox(${idx}, true)">
          ✅ Trả lời ĐÚNG trong giờ (Mở quà)
        </button>
      `);
      return;
    }

    revealSingleBox(idx, false);
  }

  /**
   * Xác nhận học sinh đã trả lời xong câu hỏi và mở Hộp quà đã chọn trước
   */
  function confirmPreselectedBox(idx, answeredCorrectly) {
    if (!boxSlots || !boxSlots[idx]) return;
    const timerSt = (typeof window.getTimerState === 'function')
      ? window.getTimerState()
      : { isRunning: false, remainingSeconds: 30 };

    const wasInTime = timerSt.remainingSeconds > 0;
    if (timerSt.isRunning && typeof window.stopTimer === 'function') {
      window.stopTimer();
    }

    const qualifyForDouble = !!(isHopeStarEnabled() && answeredCorrectly && wasInTime);
    revealSingleBox(idx, qualifyForDouble);
  }

  /**
   * Thực hiện mở 1 hộp quà, tính toán nhân đôi Ngôi Sao Hy Vọng và lưu vào Lịch sử học sinh
   */
  function revealSingleBox(idx, qualifyForDouble) {
    if (!boxSlots || !boxSlots[idx]) return;
    const slot = boxSlots[idx];

    const currentWinner = getActiveWinnerName();
    preSelectedBoxIdx = -1;
    slot.opened = true;
    slot.openedBy = currentWinner || '';
    slot.isDoubled = !!(slot.hasHopeStar && qualifyForDouble);

    const finalPrizeText = slot.isDoubled ? slot.doubledText : slot.text;
    renderBoxes();

    const historyRecord = attachRewardToStudentHistory(slot, finalPrizeText, slot.isDoubled);
    const studentName = historyRecord ? historyRecord.name : currentWinner;

    const stats = getRoundStats();
    const roundFinishedNote = (noRepeatBoxMode && stats.unopenedCount === 0)
      ? ` <span style="color:#0369a1;font-weight:800;">• 🔄 Đã mở đủ 6/6 hộp! Lượt quay kế tiếp sẽ tự động trộn vòng mới.</span>`
      : '';

    if (window.sound) {
      window.sound.init();
      if (typeof window.sound.playVictory === 'function') {
        window.sound.playVictory();
      }
    }
    if (typeof triggerCelebrationConfetti === 'function') {
      triggerCelebrationConfetti();
      if (slot.isDoubled) {
        setTimeout(() => triggerCelebrationConfetti(), 450);
      }
    }

    if (slot.isDoubled) {
      const savedNote = studentName ? ` <em>(Đã lưu vào lịch sử của ${escapeHtml(studentName)})</em>` : '';
      setBannerMessage(`
        <span>🌟 <strong>NỔ HŨ NGÔI SAO HY VỌNG x2!</strong> Hộp ${slot.boxNumber}: <strong>${escapeHtml(slot.icon)} ${escapeHtml(finalPrizeText)}</strong>${savedNote}${roundFinishedNote}</span>
      `);
      if (typeof showToast === 'function') {
        showToast(
          studentName
            ? `🌟 Nhân đôi x2! Đã lưu "${slot.icon} ${finalPrizeText}" vào lịch sử của ${studentName}!`
            : `🌟 Chúc mừng! Mở trúng Hộp Quà Ngôi Sao Hy Vọng nhân đôi: ${slot.icon} ${finalPrizeText}!`,
          'success'
        );
      }
      if (window.voiceAnnouncer && window.voiceAnnouncer.enabled && typeof window.voiceAnnouncer.speak === 'function') {
        window.voiceAnnouncer.speak(`Tuyệt vời! Hộp quà số ${slot.boxNumber} có Ngôi Sao May Mắn! Phần thưởng được nhân đôi thành: ${finalPrizeText}!`);
      }
    } else if (slot.hasHopeStar && isHopeStarEnabled() && !qualifyForDouble) {
      const savedNote = studentName ? ` (Đã lưu cho ${escapeHtml(studentName)})` : '';
      setBannerMessage(`
        <span>⭐ Hộp ${slot.boxNumber} có <strong>Ngôi Sao May Mắn</strong> nhưng đã hết giờ đếm ngược: <strong>${escapeHtml(slot.icon)} ${escapeHtml(finalPrizeText)}</strong>${savedNote}${roundFinishedNote}</span>
        <button type="button" class="mystery-banner-btn btn-force-double" onclick="MysteryBoxesModule.forceDoubleBox(${idx})" title="Giáo viên thưởng nóng nhân đôi phần thưởng cho học sinh">
          ⚡ Vẫn nhân đôi x2
        </button>
      `);
      if (typeof showToast === 'function') {
        showToast(
          studentName
            ? `🎁 Đã lưu "${slot.icon} ${finalPrizeText}" vào lịch sử của ${studentName}!`
            : `🎁 Hộp ${slot.boxNumber}: ${slot.icon} ${finalPrizeText}`,
          'info'
        );
      }
    } else {
      const savedNote = studentName ? ` • ✅ Đã lưu lịch sử <strong>${escapeHtml(studentName)}</strong>` : '';
      setBannerMessage(`
        <span>🎉 Hộp số ${slot.boxNumber}: <strong>${escapeHtml(slot.icon)} ${escapeHtml(finalPrizeText)}</strong>${savedNote}${roundFinishedNote}</span>
      `);
      if (typeof showToast === 'function') {
        showToast(
          studentName
            ? `🎁 Đã tự động lưu "${slot.icon} ${finalPrizeText}" vào lịch sử của ${studentName}!`
            : `🎁 Hộp số ${slot.boxNumber}: ${slot.icon} ${finalPrizeText}`,
          'success'
        );
      }
      if (window.voiceAnnouncer && window.voiceAnnouncer.enabled && typeof window.voiceAnnouncer.speak === 'function') {
        window.voiceAnnouncer.speak(`Hộp quà số ${slot.boxNumber} mở ra phần thưởng: ${finalPrizeText}!`);
      }
    }
  }

  /**
   * Cho phép Giáo viên bấm "⚡ Vẫn nhân đôi x2" nếu muốn khích lệ học sinh dù hết giờ
   */
  function forceDoubleBox(idx) {
    if (!boxSlots || !boxSlots[idx]) return;
    const slot = boxSlots[idx];
    slot.opened = true;
    slot.isDoubled = true;
    renderBoxes();

    const historyRecord = attachRewardToStudentHistory(slot, slot.doubledText, true);
    const studentName = historyRecord ? historyRecord.name : getActiveWinnerName();

    if (typeof triggerCelebrationConfetti === 'function') {
      triggerCelebrationConfetti();
    }
    setBannerMessage(`
      <span>🌟 <strong>ĐÃ NHÂN ĐÔI x2!</strong> Hộp ${slot.boxNumber}: <strong>${escapeHtml(slot.icon)} ${escapeHtml(slot.doubledText)}</strong> ${studentName ? `(Đã cập nhật lịch sử ${escapeHtml(studentName)})` : ''}</span>
    `);
    if (typeof showToast === 'function') {
      showToast(`🌟 Đã nhân đôi phần thưởng thành "${slot.icon} ${slot.doubledText}"!`, 'success');
    }
  }

  /**
   * Chuyển đổi số lượng Ngôi Sao Hy Vọng theo vòng: 1 sao -> 2 sao -> 0 (Tắt) -> 1 sao
   */
  function cycleHopeStarCount() {
    if (hopeStarCount === 1) {
      hopeStarCount = 2;
    } else if (hopeStarCount === 2) {
      hopeStarCount = 0;
    } else {
      hopeStarCount = 1;
    }

    saveToStorage();
    buildShuffledSlots();
    renderBoxes();

    if (hopeStarCount === 2) {
      setBannerMessage('🌟🌟 Đã chọn ẩn <strong>2 Ngôi Sao Hy Vọng (x2)</strong> trong 6 hộp quà (Cơ hội trúng x2 tăng lên 33.3%)!');
      if (typeof showToast === 'function') {
        showToast('🌟🌟 Đã ẩn 2 Ngôi Sao Hy Vọng (x2) trong 6 hộp quà (Xác suất trúng 33.3%)!', 'success');
      }
    } else if (hopeStarCount === 1) {
      setBannerMessage('🌟 Đã chọn ẩn <strong>1 Ngôi Sao Hy Vọng (x2)</strong> trong 6 hộp quà (Cơ hội trúng x2: 16.7%).');
      if (typeof showToast === 'function') {
        showToast('🌟 Đã ẩn 1 Ngôi Sao Hy Vọng (x2) trong 6 hộp quà!', 'info');
      }
    } else {
      setBannerMessage('🎁 Đã TẮT chế độ Ngôi Sao Hy Vọng (Bấm 1 lần vào hộp quà để mở ngay).');
      if (typeof showToast === 'function') {
        showToast('Đã TẮT chế độ Ngôi Sao Hy Vọng.', 'info');
      }
    }
  }

  function toggleHopeStarMode() {
    cycleHopeStarCount();
  }

  /**
   * Bật / Tắt chế độ "Không mở trùng hộp quà giữa các lượt quay"
   */
  function toggleNoRepeatBoxMode() {
    noRepeatBoxMode = !noRepeatBoxMode;
    saveToStorage();
    renderBoxes();

    const modalNoRepeatCheckbox = document.getElementById('mysteryNoRepeatModalCheckbox');
    if (modalNoRepeatCheckbox) {
      modalNoRepeatCheckbox.checked = noRepeatBoxMode;
    }

    if (noRepeatBoxMode) {
      setBannerMessage('🔒 Đã BẬT <strong>"Không mở trùng hộp quà"</strong>: Giữ nguyên hộp đã mở qua các lượt quay cho đến khi mở hết cả 6 hộp rồi mới tự động trộn lại vòng mới!');
      if (typeof showToast === 'function') {
        showToast('🔒 Đã BẬT chế độ Không mở trùng hộp quà giữa các lượt quay!', 'success');
      }
    } else {
      setBannerMessage('🔄 Đã chuyển sang <strong>"Mở lại mỗi lượt"</strong>: Tự động đóng và trộn lại cả 6 hộp quà mỗi khi gọi học sinh mới.');
      if (typeof showToast === 'function') {
        showToast('🔄 Đã chuyển sang tự động trộn lại 6 hộp quà ở mỗi lượt quay.', 'info');
      }
    }
  }

  function triggerShuffleGridAnimation() {
    const grid = document.getElementById('mysteryBoxesGrid');
    if (grid) {
      grid.classList.remove('is-shuffling');
      void grid.offsetWidth;
      grid.classList.add('is-shuffling');
      setTimeout(() => grid.classList.remove('is-shuffling'), 600);
    }
  }

  /**
   * Đổi vị trí phần thưởng ngẫu nhiên & đóng tất cả 6 hộp quà lại
   */
  function shuffleBoxes(showNotification) {
    buildShuffledSlots();
    renderBoxes();
    triggerShuffleGridAnimation();

    if (window.sound) {
      window.sound.init();
      [0, 90, 180, 270].forEach((delay, i) => {
        setTimeout(() => {
          if (window.sound && typeof window.sound.playTick === 'function') {
            window.sound.playTick(520 + i * 95, 0.35);
          }
        }, delay);
      });
    }

    const poolNote = configuredPrizes.length > BOX_COUNT
      ? ` (bốc ngẫu nhiên 6 món từ kho ${configuredPrizes.length} phần thưởng)`
      : '';

    setBannerMessage(
      hopeStarCount > 0
        ? `🎲 Đã đảo vị trí phần thưởng${poolNote} & ẩn lại <strong>${hopeStarCount} 🌟 Ngôi Sao Hy Vọng</strong>!`
        : `🎲 Đã đảo ngẫu nhiên 6 hộp quà${poolNote}! Học sinh chọn 1 hộp quà để mở.`
    );

    if (showNotification && typeof showToast === 'function') {
      showToast(`🔀 Đã trộn ngẫu nhiên 6 hộp quà mới${poolNote}!`, 'success');
    }
  }

  /**
   * Mở tất cả 6 hộp quà
   */
  function revealAllBoxes() {
    if (!boxSlots || boxSlots.length !== BOX_COUNT) return;
    preSelectedBoxIdx = -1;
    boxSlots.forEach(s => { s.opened = true; });
    renderBoxes();
    const starNumbers = boxSlots.filter(s => s.hasHopeStar).map(s => s.boxNumber);
    const starNote = (hopeStarCount > 0 && starNumbers.length > 0)
      ? ` (🌟 Ngôi sao may mắn nằm ở Hộp số ${starNumbers.join(', ')})`
      : '';
    setBannerMessage(`👁️ Đã mở toàn bộ 6 hộp quà${starNote}. Bấm "🔀 Đổi ngẫu nhiên" (hoặc quay lượt tiếp theo) để bắt đầu vòng mới!`);
  }

  /**
   * Khi Vòng Quay vừa gọi trúng tên 1 học sinh mới
   */
  function onNewWinnerCalled(winnerName) {
    preSelectedBoxIdx = -1;
    lastAwardedInfo = null;

    const statsBefore = getRoundStats();
    let autoShuffledNewRound = false;

    if (noRepeatBoxMode) {
      if (statsBefore.unopenedCount === 0) {
        buildShuffledSlots();
        autoShuffledNewRound = true;
      }
    } else {
      if (statsBefore.openedCount > 0) {
        buildShuffledSlots();
        autoShuffledNewRound = true;
      }
    }

    updateActiveStudentBar();
    renderBoxes();

    if (autoShuffledNewRound) {
      triggerShuffleGridAnimation();
    }

    if (!winnerName) return;

    // Bổ sung nút mở nhanh Popup 6 Hộp Quà ngay trong thẻ chúc mừng bên dưới Vòng Quay
    const winnerCard = document.getElementById('wheelWinnerCard');
    if (winnerCard && !winnerCard.querySelector('.winner-open-mystery-btn')) {
      const quickBtn = document.createElement('button');
      quickBtn.type = 'button';
      quickBtn.className = 'winner-open-mystery-btn';
      quickBtn.innerHTML = '🎁 Mở 6 Hộp Quà Bí Ẩn';
      quickBtn.title = `Mở cửa sổ 6 Hộp Quà Bí Ẩn cho ${winnerName}`;
      quickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopupModal();
      });
      winnerCard.appendChild(quickBtn);
    }

    const statsAfter = getRoundStats();

    if (autoShuffledNewRound && noRepeatBoxMode) {
      setBannerMessage(`
        <span>🔄 <strong>VÒNG 6 HỘP QUÀ MỚI!</strong> Đã mở hết 6 hộp vòng trước — hệ thống tự động trộn 6 hộp mới cho <strong>${escapeHtml(winnerName)}</strong>!</span>
      `);
      if (typeof showToast === 'function') {
        showToast(`🔄 Đã mở hết 6 hộp! Tự động trộn vòng 6 hộp quà mới cho ${winnerName}.`, 'info');
      }
      return;
    }

    if (noRepeatBoxMode && statsAfter.openedCount > 0 && statsAfter.unopenedCount > 0) {
      const starChanceText = (hopeStarCount > 0 && statsAfter.remainingStars > 0)
        ? ` (Đang ẩn <strong>${statsAfter.remainingStars} 🌟 Ngôi sao</strong> — Cơ hội trúng x2: <strong>${statsAfter.chancePercent}%</strong>!)`
        : '';
      setBannerMessage(`
        <span>🎓 Mời <strong>${escapeHtml(winnerName)}</strong> chọn 1 trong <strong>${statsAfter.unopenedCount} hộp chưa mở</strong>!${starChanceText}</span>
      `);
      return;
    }

    setBannerMessage(
      hopeStarCount > 0
        ? `🎓 Mời <strong>${escapeHtml(winnerName)}</strong> chọn trước 1 hộp quà để săn 🌟 Ngôi Sao Hy Vọng x2 (${hopeStarCount} sao)!`
        : `🎓 Mời <strong>${escapeHtml(winnerName)}</strong> chọn 1 hộp quà may mắn!`
    );
  }

  /**
   * Cập nhật lại gợi ý trên Banner khi trạng thái Đồng hồ đếm ngược thay đổi
   */
  function onTimerStateChanged() {
    if (preSelectedBoxIdx >= 0 && boxSlots[preSelectedBoxIdx] && !boxSlots[preSelectedBoxIdx].opened) {
      const slot = boxSlots[preSelectedBoxIdx];
      const timerSt = (typeof window.getTimerState === 'function') ? window.getTimerState() : { isRunning: false, remainingSeconds: 0 };
      if (timerSt.remainingSeconds <= 0) {
        setBannerMessage(`
          <span>⏰ Đã hết giờ đếm ngược cho <strong>Hộp ${slot.boxNumber}</strong>!</span>
          <button type="button" class="mystery-banner-btn btn-correct" onclick="MysteryBoxesModule.confirmPreselectedBox(${preSelectedBoxIdx}, false)">
            🎁 Mở Hộp ${slot.boxNumber} (Quà gốc)
          </button>
        `);
      } else if (timerSt.isRunning) {
        setBannerMessage(`
          <span>⏳ Đang đếm ngược cho <strong>Hộp ${slot.boxNumber}</strong>! Bấm khi học sinh trả lời đúng:</span>
          <button type="button" class="mystery-banner-btn btn-correct" onclick="MysteryBoxesModule.confirmPreselectedBox(${preSelectedBoxIdx}, true)">
            ✅ Trả lời ĐÚNG trong giờ (Mở Hộp ${slot.boxNumber})
          </button>
        `);
      }
    }
  }

  /**
   * Mở cửa sổ Quản lý Lớp học & Sơ đồ
   */
  function openHistoryDrawer() {
    if (typeof window.openClassManagementAction === 'function') {
      window.openClassManagementAction();
    } else if (typeof window.openStudentListAction === 'function') {
      window.openStudentListAction();
    }

    const tabHistoryBtn = document.getElementById('tabHistoryBtn');
    if (tabHistoryBtn) {
      tabHistoryBtn.click();
    } else if (window.state) {
      window.state.activeTab = 'history';
      if (typeof window.updateUI === 'function') window.updateUI();
    }
  }

  function getSettingsListContainer() {
    return document.getElementById('mysterySettingsList') || document.getElementById('mysteryInputsList');
  }

  /**
   * Đồng bộ dữ liệu Giáo viên đang gõ trên các ô input vào mảng nháp modalDraftPrizes
   */
  function syncDomToModalDraft() {
    const container = getSettingsListContainer();
    if (!container) return;
    const rows = container.querySelectorAll('.mystery-input-row');
    if (!rows || rows.length === 0) return;

    const updated = [];
    rows.forEach((row, idx) => {
      const iconInput = row.querySelector(`[data-mystery-icon="${idx}"]`);
      const textInput = row.querySelector(`[data-mystery-text="${idx}"]`);
      updated.push({
        icon: (iconInput ? iconInput.value.trim() : '🎁') || '🎁',
        text: textInput ? textInput.value : ''
      });
    });
    modalDraftPrizes = updated;
  }

  /**
   * Cập nhật số lượng phần thưởng trong kho trên thanh tiêu đề Modal
   */
  function updateModalPoolCounter() {
    const countEl = document.getElementById('mysteryPrizePoolCount');
    const hintEl = document.getElementById('mysteryPrizePoolHint');
    const total = modalDraftPrizes.length;
    if (countEl) countEl.textContent = String(total);
    if (hintEl) {
      if (total > BOX_COUNT) {
        hintEl.textContent = `Kho có ${total} món — Mỗi vòng hệ thống sẽ bốc ngẫu nhiên 6 món đưa vào 6 hộp quà!`;
      } else {
        hintEl.textContent = `Đủ 6 phần thưởng cho 6 hộp quà (Thầy/Cô có thể bấm "➕ Thêm phần thưởng mới" để tạo kho quà đa dạng hơn)`;
      }
    }
  }

  /**
   * Render danh sách các thẻ gợi ý phần thưởng học đường (Giấy kiểm tra, cây viết, thước kẻ...)
   */
  function renderQuickRewardChips() {
    const chipContainer = document.getElementById('mysteryQuickRewardChips');
    if (!chipContainer) return;

    chipContainer.innerHTML = QUICK_REWARD_SUGGESTIONS.map((item, idx) => `
      <button type="button" class="btn-quick-reward-chip" onclick="MysteryBoxesModule.pickQuickRewardChip(${idx})" title="Bấm để bổ sung '${escapeHtml(item.text)}' vào danh sách phần thưởng">
        <span>${escapeHtml(item.icon)}</span>
        <span>${escapeHtml(item.text)}</span>
        <span style="opacity:0.65;font-size:0.68rem;">➕</span>
      </button>
    `).join('');
  }

  /**
   * Render bảng chọn 40+ Icon Học Đường
   */
  function renderIconPickerPanel() {
    const panel = document.getElementById('mysteryIconPickerPanel');
    if (!panel) return;

    const targetBadge = `🎁 Quà ${activeEditingRowIdx + 1}`;
    panel.innerHTML = `
      <div class="icon-picker-header">
        <span class="icon-picker-title">🎨 Chọn biểu tượng (Icon) cho <strong>${targetBadge}</strong>:</span>
        <button type="button" class="btn-close-icon-picker" onclick="MysteryBoxesModule.closeIconPicker()">✕ Đóng bảng Icon</button>
      </div>
      <div class="icon-picker-categories">
        ${ICON_CATEGORIES.map(cat => `
          <div class="icon-picker-cat-row">
            <span class="icon-picker-cat-label">${escapeHtml(cat.label)}</span>
            <div class="icon-picker-grid">
              ${cat.icons.map(emoji => `
                <button type="button" class="btn-icon-option" onclick="MysteryBoxesModule.selectIconForRow('${emoji}')" title="Chọn icon ${emoji}">
                  ${emoji}
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function openIconPickerForRow(idx) {
    syncDomToModalDraft();
    activeEditingRowIdx = idx;
    highlightActiveRow(idx);
    const panel = document.getElementById('mysteryIconPickerPanel');
    if (panel) {
      renderIconPickerPanel();
      panel.style.display = 'block';
    }
  }

  function closeIconPicker() {
    const panel = document.getElementById('mysteryIconPickerPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  function selectIconForRow(emoji) {
    syncDomToModalDraft();
    if (!modalDraftPrizes[activeEditingRowIdx]) return;
    modalDraftPrizes[activeEditingRowIdx].icon = emoji;
    renderSettingsInputs(modalDraftPrizes);
    renderIconPickerPanel();
  }

  function setActiveRow(idx) {
    activeEditingRowIdx = idx;
    highlightActiveRow(idx);
    const panel = document.getElementById('mysteryIconPickerPanel');
    if (panel && panel.style.display !== 'none') {
      renderIconPickerPanel();
    }
  }

  function highlightActiveRow(idx) {
    const container = getSettingsListContainer();
    if (!container) return;
    container.querySelectorAll('.mystery-input-row').forEach((row, rIdx) => {
      row.classList.toggle('is-active-row', rIdx === idx);
    });
  }

  /**
   * Khi Giáo viên bấm vào 1 thẻ gợi ý phần thưởng (ví dụ: "📄 Nhận được 1 đôi giấy kiểm tra"):
   * - Nếu dòng đang chọn (hoặc có 1 dòng bất kỳ) đang để trống chữ -> Điền ngay vào dòng đó!
   * - Nếu tất cả các dòng đều đã có chữ -> Tự động thêm thành 1 dòng phần thưởng mới vào Kho phần thưởng!
   */
  function pickQuickRewardChip(chipIdx) {
    const suggestion = QUICK_REWARD_SUGGESTIONS[chipIdx];
    if (!suggestion) return;

    syncDomToModalDraft();

    // 1. Kiểm tra xem dòng đang chọn có đang trống nội dung không
    if (modalDraftPrizes[activeEditingRowIdx] && !modalDraftPrizes[activeEditingRowIdx].text.trim()) {
      modalDraftPrizes[activeEditingRowIdx] = {
        icon: suggestion.icon,
        text: suggestion.text
      };
      renderSettingsInputs(modalDraftPrizes);
      if (typeof showToast === 'function') {
        showToast(`✨ Đã điền "${suggestion.icon} ${suggestion.text}" vào Quà ${activeEditingRowIdx + 1}!`, 'success');
      }
      return;
    }

    // 2. Kiểm tra xem có dòng nào đang trống không
    const emptyIdx = modalDraftPrizes.findIndex(item => !item.text || !item.text.trim());
    if (emptyIdx !== -1) {
      activeEditingRowIdx = emptyIdx;
      modalDraftPrizes[emptyIdx] = {
        icon: suggestion.icon,
        text: suggestion.text
      };
      renderSettingsInputs(modalDraftPrizes);
      if (typeof showToast === 'function') {
        showToast(`✨ Đã điền "${suggestion.icon} ${suggestion.text}" vào Quà ${emptyIdx + 1}!`, 'success');
      }
      return;
    }

    // 3. Nếu tất cả các dòng đã có nội dung -> Bổ sung thành dòng phần thưởng mới vào kho
    if (modalDraftPrizes.length >= MAX_PRIZE_POOL) {
      modalDraftPrizes[activeEditingRowIdx] = {
        icon: suggestion.icon,
        text: suggestion.text
      };
      renderSettingsInputs(modalDraftPrizes);
      if (typeof showToast === 'function') {
        showToast(`✨ Đã cập nhật Quà ${activeEditingRowIdx + 1} thành "${suggestion.icon} ${suggestion.text}"!`, 'info');
      }
      return;
    }

    modalDraftPrizes.push({
      icon: suggestion.icon,
      text: suggestion.text
    });
    activeEditingRowIdx = modalDraftPrizes.length - 1;
    renderSettingsInputs(modalDraftPrizes);

    const container = getSettingsListContainer();
    if (container && container.lastElementChild) {
      container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (typeof showToast === 'function') {
      showToast(`➕ Đã bổ sung "${suggestion.icon} ${suggestion.text}" vào Kho phần thưởng (Quà ${modalDraftPrizes.length})!`, 'success');
    }
  }

  /**
   * Thêm 1 dòng phần thưởng mới vào danh sách trong Modal
   */
  function addNewPrizeRow() {
    syncDomToModalDraft();
    if (modalDraftPrizes.length >= MAX_PRIZE_POOL) {
      if (typeof showToast === 'function') {
        showToast(`⚠️ Kho phần thưởng tối đa ${MAX_PRIZE_POOL} món!`, 'info');
      }
      return;
    }

    modalDraftPrizes.push({
      icon: '🎁',
      text: ''
    });
    activeEditingRowIdx = modalDraftPrizes.length - 1;
    renderSettingsInputs(modalDraftPrizes);

    const container = getSettingsListContainer();
    if (container) {
      const textInput = container.querySelector(`[data-mystery-text="${activeEditingRowIdx}"]`);
      if (textInput) {
        textInput.focus();
        textInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /**
   * Xóa 1 dòng phần thưởng (Nếu > 6 món thì xóa dòng; nếu đang có 6 món thì làm trống chữ để nhập mới)
   */
  function removePrizeRow(idx) {
    syncDomToModalDraft();
    if (modalDraftPrizes.length > BOX_COUNT) {
      modalDraftPrizes.splice(idx, 1);
      if (activeEditingRowIdx >= modalDraftPrizes.length) {
        activeEditingRowIdx = modalDraftPrizes.length - 1;
      }
      renderSettingsInputs(modalDraftPrizes);
      if (typeof showToast === 'function') {
        showToast(`🗑️ Đã xóa dòng phần thưởng (Còn ${modalDraftPrizes.length} món trong kho).`, 'info');
      }
    } else if (modalDraftPrizes[idx]) {
      modalDraftPrizes[idx].text = '';
      activeEditingRowIdx = idx;
      renderSettingsInputs(modalDraftPrizes);
      const container = getSettingsListContainer();
      const textInput = container ? container.querySelector(`[data-mystery-text="${idx}"]`) : null;
      if (textInput) textInput.focus();
    }
  }

  /**
   * Chọn số lượng Ngôi Sao Hy Vọng (0, 1, 2) trong Modal Cài đặt
   */
  function selectModalStarCount(count) {
    modalSelectedStarCount = [0, 1, 2].includes(Number(count)) ? Number(count) : 1;
    const group = document.getElementById('mysteryModalStarCountGroup');
    if (!group) return;
    group.querySelectorAll('[data-star-count]').forEach(btn => {
      const btnCount = Number(btn.getAttribute('data-star-count'));
      btn.classList.toggle('active', btnCount === modalSelectedStarCount);
    });
  }

  /**
   * Mở Modal Cài đặt Kho Phần Thưởng 6 Hộp Quà
   */
  function openSettingsModal() {
    const modal = document.getElementById('mysteryBoxesSettingsModal');
    const container = getSettingsListContainer();
    if (!modal || !container) return;

    selectModalStarCount(hopeStarCount);

    const noRepeatCheckbox = document.getElementById('mysteryNoRepeatModalCheckbox');
    if (noRepeatCheckbox) noRepeatCheckbox.checked = noRepeatBoxMode;

    modalDraftPrizes = clonePrizes(configuredPrizes);
    activeEditingRowIdx = 0;

    renderQuickRewardChips();
    closeIconPicker();
    renderSettingsInputs(modalDraftPrizes);
    modal.classList.add('open');
  }

  function closeSettingsModal() {
    const modal = document.getElementById('mysteryBoxesSettingsModal');
    if (modal) modal.classList.remove('open');
    closeIconPicker();
  }

  function renderSettingsInputs(prizesList) {
    const container = getSettingsListContainer();
    if (!container) return;

    modalDraftPrizes = Array.isArray(prizesList) ? prizesList : clonePrizes(DEFAULT_PRIZES);
    updateModalPoolCounter();

    const canRemoveRow = modalDraftPrizes.length > BOX_COUNT;

    container.innerHTML = modalDraftPrizes.map((item, idx) => `
      <div class="mystery-input-row ${idx === activeEditingRowIdx ? 'is-active-row' : ''}" onclick="MysteryBoxesModule.setActiveRow(${idx})">
        <span class="mystery-row-badge">🎁 Quà ${idx + 1}</span>
        <div class="mystery-icon-picker-wrap">
          <input type="text" class="mystery-icon-input" data-mystery-icon="${idx}" value="${escapeHtml(item.icon)}" maxlength="4" onclick="event.stopPropagation(); MysteryBoxesModule.openIconPickerForRow(${idx});" title="Bấm để chọn Icon từ kho 40+ biểu tượng học đường">
          <button type="button" class="btn-open-row-icons" onclick="event.stopPropagation(); MysteryBoxesModule.openIconPickerForRow(${idx});" title="Mở bảng chọn Icon cho Quà ${idx + 1}">
            🎨 Icon
          </button>
        </div>
        <input type="text" class="mystery-text-input" data-mystery-text="${idx}" value="${escapeHtml(item.text)}" onfocus="MysteryBoxesModule.setActiveRow(${idx})" placeholder="Nhập tên phần thưởng (VD: Nhận được 1 đôi giấy kiểm tra, 1 cây viết...)" maxlength="75">
        <button type="button" class="btn-delete-mystery-row" onclick="event.stopPropagation(); MysteryBoxesModule.removePrizeRow(${idx});" title="${canRemoveRow ? 'Xóa phần thưởng này khỏi kho' : 'Xóa trắng nội dung dòng này để nhập mới'}">
          ${canRemoveRow ? '🗑️' : '✕'}
        </button>
      </div>
    `).join('');
  }

  function applyPreset(presetKey) {
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return;
    modalDraftPrizes = clonePrizes(template);
    activeEditingRowIdx = 0;
    renderSettingsInputs(modalDraftPrizes);
    if (typeof showToast === 'function') {
      showToast('✨ Đã nạp bộ mẫu phần thưởng! Thầy/Cô có thể thêm bớt tùy ý rồi bấm Lưu.', 'info');
    }
  }

  function saveSettings(shouldShuffle = true) {
    syncDomToModalDraft();

    const cleanedPrizes = modalDraftPrizes
      .map((item, idx) => ({
        icon: (item.icon || '🎁').trim() || '🎁',
        text: (item.text || '').trim() || DEFAULT_PRIZES[idx % DEFAULT_PRIZES.length].text
      }));

    hopeStarCount = [0, 1, 2].includes(modalSelectedStarCount) ? modalSelectedStarCount : 1;

    const noRepeatCheckbox = document.getElementById('mysteryNoRepeatModalCheckbox');
    if (noRepeatCheckbox) {
      noRepeatBoxMode = !!noRepeatCheckbox.checked;
    }

    configuredPrizes = clonePrizes(cleanedPrizes);
    saveToStorage();
    closeSettingsModal();

    if (shouldShuffle) {
      shuffleBoxes(false);
    } else {
      const starIndices = pickRandomStarIndices(hopeStarCount);
      boxSlots = configuredPrizes.slice(0, BOX_COUNT).map((prize, idx) => ({
        boxNumber: idx + 1,
        icon: prize.icon,
        text: prize.text,
        doubledText: computeDoubledPrizeText(prize.text),
        hasHopeStar: starIndices.has(idx),
        isDoubled: false,
        opened: false,
        openedBy: ''
      }));
      preSelectedBoxIdx = -1;
      renderBoxes();
    }

    if (typeof showToast === 'function') {
      showToast(`✅ Đã lưu kho ${configuredPrizes.length} phần thưởng cho 6 Hộp Quà Bí Ẩn!`, 'success');
    }
  }

  /**
   * Mở cửa sổ Popup 6 Hộp Quà Bí Ẩn lớn giữa màn hình (từ menu bên trái hoặc nút chúc mừng)
   */
  function openPopupModal() {
    const popupModal = document.getElementById('mysteryBoxesPopupModal');
    if (!popupModal) return;

    updateActiveStudentBar();
    renderBoxes();
    popupModal.classList.add('open');

    const navBtn = document.getElementById('btnWheelCardMysteryBoxes');
    if (navBtn) {
      navBtn.classList.add('active-mystery-open');
    }
  }

  /**
   * Đóng cửa sổ Popup 6 Hộp Quà Bí Ẩn
   */
  function closePopupModal() {
    const popupModal = document.getElementById('mysteryBoxesPopupModal');
    if (popupModal) {
      popupModal.classList.remove('open');
    }
    const navBtn = document.getElementById('btnWheelCardMysteryBoxes');
    if (navBtn) {
      navBtn.classList.remove('active-mystery-open');
    }
  }

  function init() {
    loadFromStorage();
    buildShuffledSlots();
    renderBoxes();

    const popupModal = document.getElementById('mysteryBoxesPopupModal');
    if (popupModal) {
      popupModal.addEventListener('click', (e) => {
        if (e.target === popupModal) closePopupModal();
      });
    }

    const modal = document.getElementById('mysteryBoxesSettingsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSettingsModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const settingsModal = document.getElementById('mysteryBoxesSettingsModal');
        if (settingsModal && settingsModal.classList.contains('open')) {
          closeSettingsModal();
          return;
        }
        if (popupModal && popupModal.classList.contains('open')) {
          closePopupModal();
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.MysteryBoxesModule = {
    openPopupModal,
    closePopupModal,
    openBox,
    confirmPreselectedBox,
    forceDoubleBox,
    cycleHopeStarCount,
    toggleHopeStarMode,
    toggleNoRepeatBoxMode,
    selectModalStarCount,
    openIconPickerForRow,
    closeIconPicker,
    selectIconForRow,
    setActiveRow,
    pickQuickRewardChip,
    addNewPrizeRow,
    removePrizeRow,
    shuffleBoxes,
    revealAllBoxes,
    onNewWinnerCalled,
    onTimerStateChanged,
    openHistoryDrawer,
    openSettingsModal,
    closeSettingsModal,
    applyPreset,
    saveSettings
  };
})();
