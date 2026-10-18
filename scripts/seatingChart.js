/**
 * ==============================================================================
 * MÔ-ĐUN QUẢN LÝ SƠ ĐỒ LỚP HỌC & GỌI TÊN THỰC TẾ (scripts/seatingChart.js)
 * Chịu trách nhiệm:
 * 1. Bố cục lớp học linh hoạt (Dãy bàn, hàng ghế, bàn đôi/đơn).
 * 2. Phân chia màu sắc theo 4 Tổ / Nhóm học tập (Tổ 1, 2, 3, 4) và thanh chú giải thi đua.
 * 3. Kéo thả (Drag & Drop) và Chạm/Click (Touch-friendly) học sinh vào chỗ ngồi.
 * 4. Tự động xếp chỗ / Trộn vị trí / Lưu trữ LocalStorage theo từng lớp.
 * 5. Hiệu ứng ánh sáng đèn Spotlight quay tên trực quan trên sơ đồ lớp học.
 * 6. Phát tín hiệu đồng bộ kết quả tới Remote Screen Sync.
 * ==============================================================================
 */

(function () {
  'use strict';

  // Cấu hình mặc định 4 Tổ / Biệt Đội kèm Linh Vật biểu trưng
  const DEFAULT_GROUP_PROFILES = {
    1: { name: 'Đại Bàng', mascot: '🦅', color: '#38bdf8' },
    2: { name: 'Sư Tử', mascot: '🦁', color: '#34d399' },
    3: { name: 'Cá Mập', mascot: '🦈', color: '#fbbf24' },
    4: { name: 'Rồng Vàng', mascot: '🐉', color: '#f472b6' }
  };

  // Tên và màu sắc hiển thị của 4 Tổ
  const GROUP_CONFIG = {
    1: { name: 'Tổ 1', color: '#38bdf8', label: 'Tổ 1 (Xanh dương)' },
    2: { name: 'Tổ 2', color: '#34d399', label: 'Tổ 2 (Xanh lục)' },
    3: { name: 'Tổ 3', color: '#fbbf24', label: 'Tổ 3 (Vàng cam)' },
    4: { name: 'Tổ 4', color: '#f472b6', label: 'Tổ 4 (Hồng tím)' }
  };

  // --- CẤU HÌNH CÁC CHẾ ĐỘ GỌI TÊN SƠ ĐỒ LỚP ---
  const CALLING_MODES = {
    single: {
      id: 'single',
      name: '🎯 Gọi Cá Nhân',
      shortName: 'Cá Nhân',
      btnLabel: 'QUAY TÊN SƠ ĐỒ',
      desc: 'Hệ thống chọn ngẫu nhiên 1 học sinh may mắn trên toàn bộ sơ đồ lớp.'
    },
    desk: {
      id: 'desk',
      name: '👥 Gọi Theo Bàn',
      shortName: 'Theo Cả Bàn',
      btnLabel: 'QUAY THEO BÀN (2 BẠN)',
      desc: 'Bốc cả 2 bạn cùng bàn (đôi bạn cùng tiến) cùng đứng dậy trả lời.'
    },
    versus: {
      id: 'versus',
      name: '⚔️ Đối Kháng 2 Dãy',
      shortName: 'Đối Kháng 2 Dãy',
      btnLabel: 'QUAY ĐỐI KHÁNG (PK)',
      desc: 'Bốc ngẫu nhiên 2 bạn ở 2 dãy khác nhau để thi đấu đối đầu vấn đáp.'
    },
    all_groups: {
      id: 'all_groups',
      name: '🏆 Đại Chiến 4 Tổ',
      shortName: 'Đại Chiến 4 Tổ',
      btnLabel: 'QUAY 4 TỔ THI ĐUA',
      desc: 'Mỗi dãy/tổ cử ngẫu nhiên 1 đại diện cùng lên bảng thi đấu tính điểm.'
    },
    row: {
      id: 'row',
      name: '📏 Gọi Hàng Ngang',
      shortName: 'Hàng Ngang',
      btnLabel: 'QUAY HÀNG NGANG',
      desc: 'Bốc tất cả học sinh ở cùng 1 hàng bàn của các dãy cùng lên bảng.'
    }
  };

  // --- TRẠNG THÁI NỘI BỘ CỦA SƠ ĐỒ LỚP HỌC ---
  const SeatingState = {
    aisles: 4,           // Số dãy bàn (2 -> 5)
    rows: 5,             // Số hàng mỗi dãy (2 -> 7)
    deskType: 'double',  // 'single' (1 ghế), 'double' (2 ghế), 'triple' (3 ghế)
    teacherDeskPosition: 'right', // Vị trí bàn giáo viên: 'right' (mặc định) | 'left'
    seats: {},           // Bản đồ vị trí: { "aisle_row_seatIndex": "Họ và Tên" }
    deskGroups: {},      // Bản đồ phân tổ: { "aisle_row": 1|2|3|4 }
    groupProfiles: JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES)), // Hồ sơ tên và linh vật 4 tổ
    selectedStudent: null, // Thao tác Click/Touch: { type: 'unassigned'|'seat', name: '', seatKey: '' }
    isSpinning: false,   // Trạng thái đang chạy hiệu ứng gọi tên
    callingMode: 'single', // Chế độ gọi tên: 'single' | 'desk' | 'versus' | 'all_groups' | 'row'
    activePresetId: 'preset_default', // ID phương án sơ đồ hiện tại
    presets: [],         // Danh sách các phương án sơ đồ của lớp này
    lastCalledSeatKey: null,      // Key ghế vừa được gọi để tạo hiệu ứng mờ dần 0.3s
    lastWinnerStudentName: null,  // Tên học sinh vừa được gọi
    highlightedGroup: null        // Tổ đang được làm nổi bật trên sơ đồ
  };

  // Lấy thông tin hồ sơ của Tổ (Tên + Linh vật + Màu sắc)
  function getGroupProfile(groupNum) {
    if (!groupNum || !SeatingState.groupProfiles[groupNum]) return null;
    return SeatingState.groupProfiles[groupNum];
  }

  // Khóa lưu trữ LocalStorage theo ID lớp
  function getStorageKey() {
    const classId = window.state?.currentClassId || 'default';
    return `vong_quay_seating_chart_v1_${classId}`;
  }

  // Áp dụng một phương án sơ đồ (Preset) vào trạng thái làm việc hiện thời
  function applyPresetToState(preset) {
    if (!preset) return;
    SeatingState.aisles = Number(preset.aisles) || 4;
    SeatingState.rows = Number(preset.rows) || 5;
    SeatingState.deskType = preset.deskType || 'double';
    SeatingState.teacherDeskPosition = preset.teacherDeskPosition || 'right';
    SeatingState.seats = preset.seats ? JSON.parse(JSON.stringify(preset.seats)) : {};
    SeatingState.deskGroups = preset.deskGroups ? JSON.parse(JSON.stringify(preset.deskGroups)) : {};
    SeatingState.groupProfiles = preset.groupProfiles
      ? Object.assign(JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES)), preset.groupProfiles)
      : JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES));
  }

  // Tự động khởi tạo sơ đồ hợp lý theo sĩ số của lớp hiện tại
  function initDefaultLayoutForCurrentClass() {
    const students = typeof getAllStudents === 'function' ? getAllStudents() : [];
    const count = students.length;
    let aisles = 4;
    let rows = 5;

    if (count > 40) { aisles = 4; rows = 6; }
    else if (count > 32) { aisles = 4; rows = 5; }
    else if (count > 24) { aisles = 3; rows = 6; }
    else if (count > 16) { aisles = 4; rows = 4; }
    else { aisles = 3; rows = 4; }

    SeatingState.aisles = aisles;
    SeatingState.rows = rows;
    SeatingState.deskType = 'double';
    SeatingState.seats = {};
    SeatingState.deskGroups = {};
    SeatingState.groupProfiles = JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES));

    // Phân 4 tổ theo dãy
    for (let a = 1; a <= aisles; a++) {
      for (let r = 1; r <= rows; r++) {
        SeatingState.deskGroups[`${a}_${r}`] = ((a - 1) % 4) + 1;
      }
    }

    // Xếp tự động học sinh có sẵn trong lớp vào ghế
    if (students.length > 0) {
      let idx = 0;
      for (let a = 1; a <= aisles; a++) {
        for (let r = 1; r <= rows; r++) {
          for (let s = 1; s <= 2; s++) {
            if (idx < students.length) {
              SeatingState.seats[`${a}_${r}_${s}`] = students[idx];
              idx++;
            }
          }
        }
      }
    }

    SeatingState.activePresetId = 'preset_default';
    SeatingState.presets = [
      {
        id: 'preset_default',
        name: 'Sơ đồ chính (Theo tổ)',
        aisles: SeatingState.aisles,
        rows: SeatingState.rows,
        deskType: SeatingState.deskType,
        seats: JSON.parse(JSON.stringify(SeatingState.seats)),
        deskGroups: JSON.parse(JSON.stringify(SeatingState.deskGroups)),
        groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles))
      }
    ];

    saveSeatingData();
  }

  // Tải cấu hình từ LocalStorage
  function loadSeatingData() {
    SeatingState.selectedStudent = null;
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.presets) && parsed.presets.length > 0) {
          SeatingState.presets = parsed.presets;
          SeatingState.activePresetId = parsed.activePresetId || parsed.presets[0].id;
          const active = parsed.presets.find(p => p.id === SeatingState.activePresetId) || parsed.presets[0];
          applyPresetToState(active);
        } else {
          // Cấu trúc sơ đồ đơn truyền thống: Nâng cấp thành hệ thống Presets đa phương án
          SeatingState.aisles = Number(parsed.aisles) || 4;
          SeatingState.rows = Number(parsed.rows) || 5;
          SeatingState.deskType = parsed.deskType || 'double';
          SeatingState.teacherDeskPosition = parsed.teacherDeskPosition || 'right';
          SeatingState.seats = parsed.seats || {};
          SeatingState.deskGroups = parsed.deskGroups || {};
          SeatingState.groupProfiles = parsed.groupProfiles
            ? Object.assign(JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES)), parsed.groupProfiles)
            : JSON.parse(JSON.stringify(DEFAULT_GROUP_PROFILES));

          SeatingState.activePresetId = 'preset_default';
          SeatingState.presets = [
            {
              id: 'preset_default',
              name: 'Sơ đồ chính (Theo tổ)',
              aisles: SeatingState.aisles,
              rows: SeatingState.rows,
              deskType: SeatingState.deskType,
              teacherDeskPosition: SeatingState.teacherDeskPosition,
              seats: JSON.parse(JSON.stringify(SeatingState.seats)),
              deskGroups: JSON.parse(JSON.stringify(SeatingState.deskGroups)),
              groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles))
            }
          ];
        }
      } else {
        // Chưa có dữ liệu: Tự động khởi tạo cấu hình sơ đồ thông minh cho lớp hiện tại
        initDefaultLayoutForCurrentClass();
      }
    } catch (e) {
      console.warn('Lỗi khi đọc dữ liệu sơ đồ lớp từ LocalStorage:', e);
      initDefaultLayoutForCurrentClass();
    }
  }

  // Lưu cấu hình vào LocalStorage
  function saveSeatingData() {
    try {
      if (!Array.isArray(SeatingState.presets) || SeatingState.presets.length === 0) {
        SeatingState.presets = [
          {
            id: 'preset_default',
            name: 'Sơ đồ chính (Theo tổ)',
            aisles: SeatingState.aisles,
            rows: SeatingState.rows,
            deskType: SeatingState.deskType,
            teacherDeskPosition: SeatingState.teacherDeskPosition || 'right',
            seats: JSON.parse(JSON.stringify(SeatingState.seats)),
            deskGroups: JSON.parse(JSON.stringify(SeatingState.deskGroups)),
            groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles))
          }
        ];
        SeatingState.activePresetId = 'preset_default';
      } else {
        const idx = SeatingState.presets.findIndex(p => p.id === SeatingState.activePresetId);
        const currentData = {
          id: SeatingState.activePresetId || 'preset_default',
          name: idx >= 0 ? SeatingState.presets[idx].name : 'Sơ đồ chính (Theo tổ)',
          aisles: SeatingState.aisles,
          rows: SeatingState.rows,
          deskType: SeatingState.deskType,
          teacherDeskPosition: SeatingState.teacherDeskPosition || 'right',
          seats: JSON.parse(JSON.stringify(SeatingState.seats)),
          deskGroups: JSON.parse(JSON.stringify(SeatingState.deskGroups)),
          groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles))
        };
        if (idx >= 0) {
          SeatingState.presets[idx] = currentData;
        } else {
          SeatingState.presets.push(currentData);
        }
      }

      const data = {
        activePresetId: SeatingState.activePresetId,
        presets: SeatingState.presets,
        aisles: SeatingState.aisles,
        rows: SeatingState.rows,
        deskType: SeatingState.deskType,
        teacherDeskPosition: SeatingState.teacherDeskPosition || 'right',
        seats: SeatingState.seats,
        deskGroups: SeatingState.deskGroups,
        groupProfiles: SeatingState.groupProfiles
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (e) {
      console.error('Lỗi khi lưu sơ đồ lớp:', e);
    }
  }

  // Chuyển đổi giữa các phương án sơ đồ của lớp hiện tại
  function switchPreset(presetId) {
    if (SeatingState.isSpinning) return;
    saveSeatingData();
    const target = SeatingState.presets.find(p => p.id === presetId);
    if (!target) return;

    SeatingState.activePresetId = presetId;
    applyPresetToState(target);
    saveSeatingData();
    renderSubbarControls();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();
    renderTeacherDeskPosition();

    if (typeof showToast === 'function') {
      showToast(`📐 Đã chuyển sang: ${target.name}`, 'info');
    }
  }

  // Thêm một phương án sơ đồ mới cho lớp này
  function promptNewPreset() {
    if (SeatingState.isSpinning) return;
    const count = (SeatingState.presets ? SeatingState.presets.length : 1) + 1;
    const name = prompt('Nhập tên phương án sơ đồ mới cho lớp này:', `Phương án ${count} (Đổi chỗ)`);
    if (!name || !name.trim()) return;

    const newId = 'preset_' + Date.now();
    const newPreset = {
      id: newId,
      name: name.trim(),
      aisles: SeatingState.aisles,
      rows: SeatingState.rows,
      deskType: SeatingState.deskType,
      teacherDeskPosition: SeatingState.teacherDeskPosition || 'right',
      seats: JSON.parse(JSON.stringify(SeatingState.seats)),
      deskGroups: JSON.parse(JSON.stringify(SeatingState.deskGroups)),
      groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles))
    };

    if (!Array.isArray(SeatingState.presets)) SeatingState.presets = [];
    SeatingState.presets.push(newPreset);
    SeatingState.activePresetId = newId;

    saveSeatingData();
    renderSubbarControls();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();

    if (typeof showToast === 'function') {
      showToast(`✨ Đã tạo phương án mới: "${name.trim()}"! Thầy có thể chỉnh sửa vị trí cho phương án này.`, 'success');
    }
  }

  // Xóa phương án sơ đồ hiện tại
  function deleteCurrentPreset() {
    if (SeatingState.isSpinning) return;
    if (!Array.isArray(SeatingState.presets) || SeatingState.presets.length <= 1) {
      if (typeof showToast === 'function') {
        showToast('Mỗi lớp cần giữ lại ít nhất 1 phương án sơ đồ!', 'warning');
      }
      return;
    }

    const currentPreset = SeatingState.presets.find(p => p.id === SeatingState.activePresetId);
    if (!confirm(`Thầy có chắc chắn muốn xóa phương án "${currentPreset ? currentPreset.name : ''}" không?`)) {
      return;
    }

    SeatingState.presets = SeatingState.presets.filter(p => p.id !== SeatingState.activePresetId);
    SeatingState.activePresetId = SeatingState.presets[0].id;
    applyPresetToState(SeatingState.presets[0]);

    saveSeatingData();
    renderSubbarControls();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();

    if (typeof showToast === 'function') {
      showToast(`🗑️ Đã xóa phương án và quay về: ${SeatingState.presets[0].name}`, 'info');
    }
  }

  // Lấy số ghế trên mỗi bàn dựa theo deskType
  function getSeatsPerDesk() {
    if (SeatingState.deskType === 'single') return 1;
    if (SeatingState.deskType === 'triple') return 3;
    return 2; // 'double' mặc định
  }

  // Lấy danh sách tên học sinh đã được xếp chỗ trên sơ đồ
  function getAssignedStudentNames() {
    return Object.values(SeatingState.seats).filter(Boolean);
  }

  // Lấy danh sách học sinh của lớp hiện tại chưa được xếp chỗ
  function getUnassignedStudents() {
    const all = typeof getAllStudents === 'function' ? getAllStudents() : [];
    const assignedSet = new Set(getAssignedStudentNames());
    return all.filter(name => !assignedSet.has(name));
  }

  // Tạo nhãn vị trí đẹp (ví dụ: "Dãy 2 - Hàng 3 (Ghế Trái)")
  function formatSeatLabel(aisle, row, seatIdx) {
    const seatsPerDesk = getSeatsPerDesk();
    let seatPos = `Ghế ${seatIdx}`;
    if (seatsPerDesk === 2) {
      seatPos = seatIdx === 1 ? 'Ghế Trái' : 'Ghế Phải';
    } else if (seatsPerDesk === 3) {
      seatPos = seatIdx === 1 ? 'Ghế Trái' : (seatIdx === 2 ? 'Ghế Giữa' : 'Ghế Phải');
    }
    return `Dãy ${aisle} - Hàng ${row} (${seatPos})`;
  }

  // ============================================================================
  // QUẢN LÝ KÍCH THƯỚC CHỮ TÊN HỌC SINH TRÊN SƠ ĐỒ (NHỎ / VỪA / LỚN)
  // ============================================================================
  let currentFontSize = 'medium'; // 'small' | 'medium' | 'large'

  function getSavedFontSize() {
    try {
      const saved = localStorage.getItem('vong_quay_seating_font_size');
      if (saved && ['small', 'medium', 'large'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'medium';
  }

  function applyFontSizeToDOM(size, showNotification = false) {
    currentFontSize = size || 'medium';
    try {
      localStorage.setItem('vong_quay_seating_font_size', currentFontSize);
    } catch (e) {}

    const gridEl = document.getElementById('classroomAislesGrid');
    const stageEl = document.querySelector('.seating-classroom-column');
    const wrapperEl = document.querySelector('.classroom-grid-wrapper');

    [gridEl, stageEl, wrapperEl].forEach(el => {
      if (!el) return;
      el.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
      el.classList.add(`font-size-${currentFontSize}`);
    });

    syncFontSizeUI();

    if (showNotification && typeof showToast === 'function') {
      const labels = {
        small: 'Nhỏ (Gọn gàng cho phòng nhiều bàn)',
        medium: 'Vừa (Tiêu chuẩn sắc nét)',
        large: 'Lớn (Dễ đọc từ xa trên máy chiếu/TV)'
      };
      showToast(`🔤 Đã đổi kích cỡ chữ: ${labels[currentFontSize]}`, 'success');
    }
  }

  function syncFontSizeUI() {
    const size = currentFontSize || getSavedFontSize();
    document.querySelectorAll('.btn-seating-font-size').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });

    const indicator = document.getElementById('seatingFontSizeIndicator');
    if (indicator) {
      if (size === 'small') indicator.textContent = 'Nhỏ gọn';
      else if (size === 'large') indicator.textContent = 'Lớn (Chiếu xa)';
      else indicator.textContent = 'Vừa (Chuẩn)';
    }
  }

  function setFontSize(size) {
    applyFontSizeToDOM(size, true);
  }

  // Phát âm thanh đọc thử câu thoại gọi tên mẫu
  function testVoice() {
    if (window.voiceAnnouncer && typeof window.voiceAnnouncer.testVoice === 'function') {
      window.voiceAnnouncer.testVoice();
      updateVoiceButtonUI(true);
      if (typeof showToast === 'function') {
        showToast('🔊 Đang đọc mẫu: "Mời bạn Nguyễn Minh Huy..."', 'info');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('⚠️ Trình duyệt chưa hỗ trợ bộ phát âm thanh Text-to-Speech!', 'warning');
      }
    }
  }

  // ============================================================================
  // QUẢN LÝ KIỂU HIỂN THỊ TÊN HỌC SINH (TÊN NGẮN GỌN / HỌ VÀ TÊN ĐẦY ĐỦ)
  // ============================================================================
  let currentNameDisplayMode = 'short'; // 'short' (chữ lót cuối + tên) | 'full' (họ và tên đầy đủ)

  // Lấy danh sách toàn bộ học sinh trong lớp học hiện thời
  function getClassStudentList() {
    const listFromFn = typeof getAllStudents === 'function' ? getAllStudents() : [];
    if (listFromFn && listFromFn.length > 0) return listFromFn;
    return Object.values(SeatingState.seats || {}).filter(Boolean);
  }

  // Kiểm tra xem một học sinh có bị trùng tên (2 từ cuối: chữ lót cuối + tên) với bạn khác trong lớp không
  function isDuplicateStudentName(fullName, allNames = null) {
    if (!fullName) return false;
    const cleanFull = fullName.trim();
    const words = cleanFull.split(/\s+/);
    if (words.length <= 1) return false;

    const baseShort = words.length === 2 ? cleanFull : words.slice(-2).join(' ');
    const studentList = allNames || getClassStudentList();
    if (!studentList || studentList.length === 0) return false;

    const matchingDuplicates = studentList.filter(name => {
      if (!name) return false;
      const w = name.trim().split(/\s+/);
      const s = w.length <= 2 ? name.trim() : w.slice(-2).join(' ');
      return s.toLowerCase() === baseShort.toLowerCase();
    });

    return matchingDuplicates.length > 1;
  }

  // Lấy tên ngắn gọn: Chỉ hiển thị chữ lót cuối và tên học sinh (ví dụ: "Nguyễn Phạm Khánh An" -> "Khánh An")
  // Nếu lớp có 2 bạn trở lên trùng cả chữ lót lẫn tên (ví dụ: "Nguyễn Minh Huy" và "Trần Minh Huy"):
  // Hệ thống tự động thêm chữ cái đầu của Họ: "N. Minh Huy" và "T. Minh Huy" để tránh nhầm lẫn!
  function getShortStudentName(fullName, allNames = null) {
    if (!fullName) return '';
    const cleanFull = fullName.trim();
    const words = cleanFull.split(/\s+/);
    if (words.length <= 1) return cleanFull;

    // Tên cơ bản gồm chữ lót cuối + tên học sinh (2 từ cuối)
    const baseShort = words.length === 2 ? cleanFull : words.slice(-2).join(' ');

    const studentList = allNames || getClassStudentList();
    if (!studentList || studentList.length === 0) return baseShort;

    // Tìm tất cả học sinh trong lớp có cùng baseShort (2 từ cuối)
    const matchingDuplicates = studentList.filter(name => {
      if (!name) return false;
      const w = name.trim().split(/\s+/);
      const s = w.length <= 2 ? name.trim() : w.slice(-2).join(' ');
      return s.toLowerCase() === baseShort.toLowerCase();
    });

    // Nếu không trùng tên với ai trong lớp -> Trả về baseShort (chữ lót cuối + tên)
    if (matchingDuplicates.length <= 1) {
      return baseShort;
    }

    // Nếu bị trùng 2 từ cuối (ví dụ: "Nguyễn Minh Huy" và "Trần Minh Huy"):
    // Lấy chữ cái đầu của Họ kèm dấu chấm (Family Name Initial)
    const familyName = words[0];
    const initial = familyName.charAt(0).toUpperCase() + '.';

    // Kiểm tra xem chữ cái đầu của Họ có bị trùng lặp giữa các bạn trùng tên không
    // (ví dụ: "Nguyễn Minh Huy" và "Ngô Minh Huy" đều có Họ bắt đầu bằng 'N')
    const initialsOfDuplicates = matchingDuplicates.map(name => {
      const firstWord = (name.trim().split(/\s+/)[0] || '');
      return firstWord.charAt(0).toUpperCase();
    });

    const isInitialDuplicate = initialsOfDuplicates.filter(ini => ini === familyName.charAt(0).toUpperCase()).length > 1;

    if (isInitialDuplicate && words.length > 2) {
      // Cả chữ cái đầu họ cũng giống nhau -> Hiển thị cả Họ đầy đủ để phân biệt rõ ràng
      return `${familyName} ${baseShort}`;
    }

    // Trường hợp chuẩn: thêm chữ cái đầu của Họ: "N. Minh Huy" và "T. Minh Huy"
    return `${initial} ${baseShort}`;
  }

  // Lấy tên để Loa AI phát âm gọi tên:
  // - Nếu học sinh bị trùng tên (trùng 2 từ cuối) với bạn khác trong lớp (ví dụ: "Nguyễn Minh Huy" và "Trần Minh Huy"):
  //   Loa AI TỰ ĐỘNG đọc đầy đủ cả Họ và Tên ("Nguyễn Minh Huy") để học sinh không đứng dậy nhầm!
  // - Nếu học sinh không bị trùng:
  //   + Ở chế độ "Tên ngắn gọn": Loa AI đọc tên ngắn gọn thân mật (ví dụ: "Khánh An")
  //   + Ở chế độ "Họ và Tên đầy đủ": Loa AI đọc đầy đủ Họ và Tên ("Nguyễn Phạm Khánh An")
  function getSpokenStudentName(fullName, allNames = null) {
    if (!fullName) return '';
    const cleanFull = fullName.trim();
    const words = cleanFull.split(/\s+/);
    if (words.length <= 1) return cleanFull;

    const isDup = isDuplicateStudentName(cleanFull, allNames);
    if (isDup) {
      // Bị trùng tên -> Bắt buộc đọc đầy đủ cả Họ và Tên!
      return cleanFull;
    }

    // Không trùng tên: Đọc theo chế độ hiển thị hiện thời của sơ đồ
    if (currentNameDisplayMode === 'short') {
      return words.length === 2 ? cleanFull : words.slice(-2).join(' ');
    }

    return cleanFull;
  }

  function getSavedNameDisplayMode() {
    try {
      const saved = localStorage.getItem('vong_quay_seating_name_mode');
      if (saved && ['short', 'full'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'short'; // Mặc định hiển thị Tên ngắn gọn (2 chữ cuối) để chữ siêu to rõ rệt!
  }

  function setNameDisplayMode(mode, showNotification = true) {
    currentNameDisplayMode = mode || 'short';
    try {
      localStorage.setItem('vong_quay_seating_name_mode', currentNameDisplayMode);
    } catch (e) {}

    syncNameDisplayModeUI();
    renderClassroomStage();

    if (showNotification && typeof showToast === 'function') {
      if (currentNameDisplayMode === 'short') {
        showToast('🏷️ Đã bật Tên ngắn gọn: Chỉ hiện 2 chữ cuối (chữ lót cuối & tên), chữ siêu to!', 'success');
      } else {
        showToast('📝 Đã bật hiển thị đầy đủ cả Họ và Tên học sinh!', 'info');
      }
    }
  }

  function syncNameDisplayModeUI() {
    const mode = currentNameDisplayMode || getSavedNameDisplayMode();
    document.querySelectorAll('.btn-seating-name-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const indicator = document.getElementById('seatingNameModeIndicator');
    if (indicator) {
      if (mode === 'short') {
        indicator.textContent = 'Tên ngắn gọn (2 chữ cuối)';
        indicator.className = 'seating-name-mode-badge';
      } else {
        indicator.textContent = 'Họ và Tên đầy đủ';
        indicator.className = 'seating-font-badge';
      }
    }
  }

  // ============================================================================
  // QUẢN LÝ CHẾ ĐỘ GỌI TÊN SƠ ĐỒ LỚP (CÁ NHÂN, THEO BÀN, ĐỐI KHÁNG, 4 TỔ, HÀNG NGANG)
  // ============================================================================
  function syncCallingModeUI() {
    const currentMode = SeatingState.callingMode || 'single';
    const modeConfig = CALLING_MODES[currentMode] || CALLING_MODES.single;

    document.querySelectorAll('.seating-mode-card').forEach(card => {
      card.classList.toggle('active', card.dataset.mode === currentMode);
    });

    const nameEl = document.getElementById('seatingActiveModeName');
    if (nameEl) nameEl.textContent = modeConfig.shortName || modeConfig.name;

    const descEl = document.getElementById('seatingActiveModeDesc');
    if (descEl) descEl.textContent = modeConfig.desc;

    // Cập nhật nhãn nút quay trên toàn bộ giao diện
    document.querySelectorAll('.seating-spin-btn .spin-btn-label').forEach(label => {
      if (!SeatingState.isSpinning) {
        label.textContent = modeConfig.btnLabel;
      }
    });
  }

  function setCallingMode(mode, showNotification = true) {
    if (!CALLING_MODES[mode]) mode = 'single';
    SeatingState.callingMode = mode;
    syncCallingModeUI();
    if (showNotification && typeof showToast === 'function') {
      const cfg = CALLING_MODES[mode];
      showToast(`${cfg.name}: ${cfg.desc}`, 'info');
    }
  }

  // Đồng bộ trạng thái lượt gọi tên & số lượng học sinh đã gọi
  function syncRoundStatusUI() {
    const statBadge = document.getElementById('seatingCalledStatBadge');
    const resetBtn = document.getElementById('btnSeatingResetRound');
    const calledSet = typeof getCalledStudentsSet === 'function' ? getCalledStudentsSet() : new Set();
    const allStudents = typeof getAllStudents === 'function' ? getAllStudents() : [];
    const totalCount = allStudents.length || Object.values(SeatingState.seats || {}).filter(Boolean).length;
    const calledCount = calledSet.size;

    if (statBadge) {
      if (calledCount === 0) {
        statBadge.textContent = `Lượt mới (0/${totalCount})`;
        statBadge.className = 'round-control-badge badge-fresh';
      } else if (calledCount >= totalCount && totalCount > 0) {
        statBadge.textContent = `Đã gọi hết (${calledCount}/${totalCount})`;
        statBadge.className = 'round-control-badge badge-full';
      } else {
        statBadge.textContent = `Đã gọi: ${calledCount}/${totalCount}`;
        statBadge.className = 'round-control-badge badge-progress';
      }
    }

    if (resetBtn) {
      if (calledCount >= totalCount && totalCount > 0) {
        resetBtn.classList.add('pulse-suggest');
      } else {
        resetBtn.classList.remove('pulse-suggest');
      }
    }
  }

  // Làm mới danh sách đã gọi để bắt đầu lượt gọi mới
  function resetCalledRound(notify = true) {
    if (SeatingState.isSpinning) return;
    if (typeof window.resetCalledList === 'function') {
      window.resetCalledList(notify);
    } else {
      const cls = typeof getCurrentClass === 'function' ? getCurrentClass() : null;
      if (cls) cls.called = [];
      if (typeof saveStateToStorage === 'function') saveStateToStorage();
      if (notify && typeof showToast === 'function') {
        showToast('✨ Đã làm mới danh sách! Tất cả học sinh có thể được gọi lại từ đầu.', 'success');
      }
    }
    renderClassroomStage();
    syncRoundStatusUI();
  }

  // ============================================================================
  // QUẢN LÝ VỊ TRÍ & KÉO THẢ BÀN GIÁO VIÊN (TRÁI / PHẢI)
  // ============================================================================
  function renderTeacherDeskPosition() {
    const wrapper = document.getElementById('podiumDeskWrapper');
    const arrow = document.getElementById('deskPosArrow');
    const btn = document.getElementById('btnToggleTeacherDeskPos');
    const pos = SeatingState.teacherDeskPosition || 'right';

    if (!wrapper) return;

    wrapper.classList.remove('desk-pos-left', 'desk-pos-right');
    wrapper.classList.add(`desk-pos-${pos}`);

    if (arrow) {
      arrow.textContent = pos === 'right' ? '⮜' : '⮞';
    }
    if (btn) {
      btn.title = pos === 'right'
        ? 'Bấm để chuyển Bàn Giáo Viên sang bên Trái'
        : 'Bấm để chuyển Bàn Giáo Viên sang bên Phải';
    }
  }

  function setTeacherDeskPosition(position, showToastMessage = true) {
    if (position !== 'left' && position !== 'right') return;
    SeatingState.teacherDeskPosition = position;
    renderTeacherDeskPosition();
    saveSeatingData();

    if (showToastMessage && typeof showToast === 'function') {
      showToast(`Đã chuyển Bàn Giáo Viên sang bên ${position === 'left' ? 'TRÁI' : 'PHẢI'}`, 'info');
    }
  }

  function toggleTeacherDeskPosition(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const current = SeatingState.teacherDeskPosition || 'right';
    const nextPos = current === 'right' ? 'left' : 'right';
    setTeacherDeskPosition(nextPos, true);
  }

  function initTeacherDeskInteractions() {
    const podiumBar = document.getElementById('classroomPodiumBar');
    const deskWrapper = document.getElementById('podiumDeskWrapper');
    if (!podiumBar || !deskWrapper) return;

    if (deskWrapper.dataset.dragInitialized === 'true') return;
    deskWrapper.dataset.dragInitialized = 'true';

    const dropZones = podiumBar.querySelectorAll('.podium-drop-zone');

    // 1. Kéo thả bằng chuột (HTML5 Drag & Drop)
    deskWrapper.addEventListener('dragstart', (e) => {
      podiumBar.classList.add('is-dragging-desk');
      deskWrapper.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', 'teacher-desk');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    deskWrapper.addEventListener('dragend', () => {
      podiumBar.classList.remove('is-dragging-desk');
      deskWrapper.classList.remove('dragging');
      dropZones.forEach(z => z.classList.remove('drag-hover'));
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        if (!zone.classList.contains('drag-hover')) {
          zone.classList.add('drag-hover');
        }
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-hover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-hover');
        podiumBar.classList.remove('is-dragging-desk');
        deskWrapper.classList.remove('dragging');
        const targetPos = zone.getAttribute('data-drop-pos');
        if (targetPos) {
          setTeacherDeskPosition(targetPos, true);
        }
      });

      zone.addEventListener('click', () => {
        const targetPos = zone.getAttribute('data-drop-pos');
        if (targetPos) {
          setTeacherDeskPosition(targetPos, true);
        }
      });
    });

    // 2. Kéo thả cảm ứng trên Tablet / Màn hình tương tác (Touch Drag)
    let touchStartX = 0;
    let isTouching = false;

    deskWrapper.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        isTouching = true;
        podiumBar.classList.add('is-dragging-desk');
      }
    }, { passive: true });

    deskWrapper.addEventListener('touchmove', (e) => {
      if (!isTouching || !e.touches || e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const barRect = podiumBar.getBoundingClientRect();
      const relativeX = currentX - barRect.left;

      dropZones.forEach(z => {
        const isLeftZone = z.getAttribute('data-drop-pos') === 'left';
        z.classList.toggle('drag-hover', (relativeX < barRect.width / 2 && isLeftZone) || (relativeX >= barRect.width / 2 && !isLeftZone));
      });
    }, { passive: true });

    deskWrapper.addEventListener('touchend', (e) => {
      if (!isTouching) return;
      isTouching = false;
      podiumBar.classList.remove('is-dragging-desk');
      dropZones.forEach(z => z.classList.remove('drag-hover'));

      if (e.changedTouches && e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const barRect = podiumBar.getBoundingClientRect();
        const relativeX = touchEndX - barRect.left;

        if (Math.abs(touchEndX - touchStartX) > 30) {
          if (relativeX < barRect.width / 2) {
            setTeacherDeskPosition('left', true);
          } else {
            setTeacherDeskPosition('right', true);
          }
        }
      }
    }, { passive: true });
  }

  // ============================================================================
  // THU GỌN / MỞ RỘNG BẢNG ĐIỀU KHIỂN CHẾ ĐỘ GỌI TÊN (CỘT BÊN TRÁI)
  // ============================================================================
  let isModesPanelCollapsed = false;

  function toggleModesPanelCollapse(forceState = null, notify = true) {
    const panel = document.getElementById('seatingModesPanel');
    const arrow = document.getElementById('modesPanelToggleArrow');
    const btn = document.getElementById('btnToggleModesPanel');
    if (!panel) return;

    if (forceState !== null) {
      isModesPanelCollapsed = forceState;
    } else {
      isModesPanelCollapsed = !isModesPanelCollapsed;
    }

    panel.classList.toggle('collapsed', isModesPanelCollapsed);

    if (arrow) {
      arrow.textContent = isModesPanelCollapsed ? '▶' : '◀';
    }
    if (btn) {
      btn.title = isModesPanelCollapsed
        ? 'Mở rộng bảng điều khiển chế độ gọi tên'
        : 'Thu gọn bảng điều khiển (Chỉ hiện icon để mở rộng sơ đồ)';
    }

    try {
      localStorage.setItem('vong_quay_modes_panel_collapsed', isModesPanelCollapsed ? '1' : '0');
    } catch (e) {}

    if (notify && typeof showToast === 'function') {
      showToast(
        isModesPanelCollapsed 
          ? '📐 Đã thu gọn cột điều khiển để mở rộng không gian sơ đồ lớp!' 
          : '📋 Đã mở rộng bảng điều khiển chế độ gọi tên.',
        'info'
      );
    }
  }

  function initModesPanelCollapse() {
    try {
      const saved = localStorage.getItem('vong_quay_modes_panel_collapsed');
      if (saved === '1') {
        toggleModesPanelCollapse(true, false);
      }
    } catch (e) {}
  }

  // ============================================================================
  // HÀM VẼ GIAO DIỆN (RENDER DOM)
  // ============================================================================
  function renderSeatingModule() {
    loadSeatingData();
    renderSubbarControls();
    renderLegendBar();
    applyFontSizeToDOM(getSavedFontSize(), false);
    currentNameDisplayMode = getSavedNameDisplayMode();
    syncNameDisplayModeUI();
    syncCallingModeUI();
    syncRoundStatusUI();
    renderClassroomStage();
    renderUnassignedPool();
    renderTeacherDeskPosition();
    initTeacherDeskInteractions();
    initModesPanelCollapse();

    // Nếu lớp đã xếp đủ 100% học sinh thì mặc định thu gọn; nếu còn học sinh chưa xếp thì mở ra để Thầy xếp
    const unassigned = getUnassignedStudents();
    if (unassigned.length === 0) {
      collapseUnassignedColumn();
    } else {
      expandUnassignedColumn();
    }
  }

  // Đồng bộ giá trị của các dropdown trên thanh subbar
  function renderSubbarControls() {
    const selectAisles = document.getElementById('seatingSelectAisles');
    const selectRows = document.getElementById('seatingSelectRows');
    const selectType = document.getElementById('seatingSelectType');
    const classSelector = document.getElementById('seatingClassSelector');
    const presetSelector = document.getElementById('seatingPresetSelector');

    if (selectAisles) selectAisles.value = SeatingState.aisles;
    if (selectRows) selectRows.value = SeatingState.rows;
    if (selectType) selectType.value = SeatingState.deskType;

    // Đồng bộ danh sách Lớp học vào dropdown trên subbar
    if (classSelector && window.state && Array.isArray(window.state.classes)) {
      classSelector.innerHTML = '';
      window.state.classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls.id;
        opt.textContent = `${cls.name} (${cls.students.length} HS)`;
        if (cls.id === window.state.currentClassId) opt.selected = true;
        classSelector.appendChild(opt);
      });
    }

    // Đồng bộ danh sách Phương án sơ đồ của lớp hiện tại
    if (presetSelector) {
      presetSelector.innerHTML = '';
      const list = Array.isArray(SeatingState.presets) && SeatingState.presets.length > 0
        ? SeatingState.presets
        : [{ id: 'preset_default', name: 'Sơ đồ chính (Theo tổ)' }];

      list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === SeatingState.activePresetId) opt.selected = true;
        presetSelector.appendChild(opt);
      });
    }

    // Đồng bộ nhãn phương án hiện tại trên thanh sân khấu
    const activePresetLabel = document.getElementById('seatingActivePresetLabel');
    if (activePresetLabel) {
      const activeP = (SeatingState.presets || []).find(p => p.id === SeatingState.activePresetId);
      activePresetLabel.textContent = activeP ? activeP.name : 'Sơ đồ chính (Theo tổ)';
    }

    // Đồng bộ nhãn thống kê chỗ ngồi trên thanh sân khấu
    const statsLabel = document.getElementById('seatingStatsLabel');
    if (statsLabel) {
      const totalSeats = SeatingState.aisles * SeatingState.rows * getSeatsPerDesk();
      const seatedCount = Object.values(SeatingState.seats || {}).filter(Boolean).length;
      statsLabel.textContent = `Đã xếp: ${seatedCount}/${totalSeats} chỗ`;
    }

    if (typeof updateVoiceButtonUI === 'function') {
      updateVoiceButtonUI(window.voiceAnnouncer ? window.voiceAnnouncer.enabled : true);
    }
  }

  // Mở modal cài đặt riêng của trò chơi Sơ Đồ Lớp
  function openSettingsModal() {
    const modal = document.getElementById('seatingSettingsModal');
    if (!modal) return;
    renderSubbarControls();
    renderLegendBar();
    syncFontSizeUI();
    syncNameDisplayModeUI();
    if (typeof updateVoiceButtonUI === 'function') {
      updateVoiceButtonUI(window.voiceAnnouncer ? window.voiceAnnouncer.enabled : true);
    }
    modal.classList.add('open');
  }

  // Đóng modal cài đặt riêng của trò chơi Sơ Đồ Lớp
  function closeSettingsModal() {
    const modal = document.getElementById('seatingSettingsModal');
    if (modal) modal.classList.remove('open');
  }

  // Xử lý khi click vào thẻ Tổ trên thanh Thi đua
  function handleGroupChipClick(groupNum) {
    if (SeatingState.isSpinning) return;

    // Đếm xem hiện tại có bàn nào được gán tổ chưa
    const assignedDeskCount = Object.keys(SeatingState.deskGroups).length;
    if (assignedDeskCount === 0) {
      // Chưa có bàn nào gán tổ -> Tự động chia 4 tổ theo dãy
      assignGroupsByAisle();
      return;
    }

    // Nếu đã có bàn gán tổ -> Bật/Tắt chế độ làm nổi bật Tổ
    if (SeatingState.highlightedGroup === groupNum) {
      SeatingState.highlightedGroup = null;
      document.body.classList.remove('stage-celebrate-group-1', 'stage-celebrate-group-2', 'stage-celebrate-group-3', 'stage-celebrate-group-4');
      if (typeof showToast === 'function') {
        showToast('Đã tắt chế độ làm nổi bật Tổ', 'info');
      }
    } else {
      SeatingState.highlightedGroup = groupNum;
      document.body.classList.remove('stage-celebrate-group-1', 'stage-celebrate-group-2', 'stage-celebrate-group-3', 'stage-celebrate-group-4');
      document.body.classList.add(`stage-celebrate-group-${groupNum}`);
      const prof = getGroupProfile(groupNum);
      if (typeof showToast === 'function') {
        showToast(`✨ Đang làm nổi bật ${prof?.mascot || ''} ${prof?.name || 'Tổ ' + groupNum}!`, 'info');
      }
    }
    renderLegendBar();
    renderClassroomStage();
  }

  // Vẽ thanh chú giải thi đua 4 Tổ / Biệt đội
  function renderLegendBar() {
    const legendContainer = document.getElementById('seatingLegendBar');
    if (!legendContainer) return;

    // Đếm số học sinh trong từng tổ
    const groupStudentCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.entries(SeatingState.seats).forEach(([seatKey, studentName]) => {
      if (!studentName) return;
      const parts = seatKey.split('_').map(Number);
      const deskKey = `${parts[0]}_${parts[1]}`;
      const g = SeatingState.deskGroups[deskKey];
      if (g && groupStudentCounts[g] !== undefined) {
        groupStudentCounts[g]++;
      }
    });

    const p1 = SeatingState.groupProfiles[1];
    const p2 = SeatingState.groupProfiles[2];
    const p3 = SeatingState.groupProfiles[3];
    const p4 = SeatingState.groupProfiles[4];

    const totalGroupStudents = groupStudentCounts[1] + groupStudentCounts[2] + groupStudentCounts[3] + groupStudentCounts[4];

    legendContainer.innerHTML = `
      <div class="legend-title"><span>🚩 Thi đua Biệt đội:</span></div>
      <div class="legend-chip group-1 ${SeatingState.highlightedGroup === 1 ? 'active-highlight' : ''}" onclick="SeatingChartModule.handleGroupChipClick(1)" title="Tổ 1: ${p1.mascot} ${p1.name} (Bấm để làm nổi bật hoặc gán tổ)">
        <span>${p1.mascot} ${p1.name}:</span> <strong>${groupStudentCounts[1]} em</strong>
        <span class="chip-edit-icon" onclick="event.stopPropagation(); SeatingChartModule.openGroupSettings(1)" title="Chỉnh sửa tên và linh vật">✏️</span>
      </div>
      <div class="legend-chip group-2 ${SeatingState.highlightedGroup === 2 ? 'active-highlight' : ''}" onclick="SeatingChartModule.handleGroupChipClick(2)" title="Tổ 2: ${p2.mascot} ${p2.name} (Bấm để làm nổi bật hoặc gán tổ)">
        <span>${p2.mascot} ${p2.name}:</span> <strong>${groupStudentCounts[2]} em</strong>
        <span class="chip-edit-icon" onclick="event.stopPropagation(); SeatingChartModule.openGroupSettings(2)" title="Chỉnh sửa tên và linh vật">✏️</span>
      </div>
      <div class="legend-chip group-3 ${SeatingState.highlightedGroup === 3 ? 'active-highlight' : ''}" onclick="SeatingChartModule.handleGroupChipClick(3)" title="Tổ 3: ${p3.mascot} ${p3.name} (Bấm để làm nổi bật hoặc gán tổ)">
        <span>${p3.mascot} ${p3.name}:</span> <strong>${groupStudentCounts[3]} em</strong>
        <span class="chip-edit-icon" onclick="event.stopPropagation(); SeatingChartModule.openGroupSettings(3)" title="Chỉnh sửa tên và linh vật">✏️</span>
      </div>
      <div class="legend-chip group-4 ${SeatingState.highlightedGroup === 4 ? 'active-highlight' : ''}" onclick="SeatingChartModule.handleGroupChipClick(4)" title="Tổ 4: ${p4.mascot} ${p4.name} (Bấm để làm nổi bật hoặc gán tổ)">
        <span>${p4.mascot} ${p4.name}:</span> <strong>${groupStudentCounts[4]} em</strong>
        <span class="chip-edit-icon" onclick="event.stopPropagation(); SeatingChartModule.openGroupSettings(4)" title="Chỉnh sửa tên và linh vật">✏️</span>
      </div>
      <div class="legend-actions-wrap" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
        ${totalGroupStudents === 0 ? `
          <button class="legend-btn-quick-assign" onclick="SeatingChartModule.assignGroupsByAisle()" title="Tự động chia 4 Tổ theo từng Dãy bàn để bắt đầu tính điểm">
            ⚡ Gán 4 Tổ theo Dãy
          </button>
        ` : `
          <button class="legend-btn-clear-groups" onclick="SeatingChartModule.clearGroups()" title="Xóa phân chia màu Tổ">
            Bỏ màu Tổ
          </button>
        `}
        <button class="legend-btn-edit" onclick="SeatingChartModule.openGroupSettings()" title="Tùy biến tên gọi và linh vật đại diện cho 4 Tổ">
          ⚙️ Đổi Tên & Linh Vật
        </button>
      </div>
    `;
  }

  // Vẽ lưới bàn ghế phòng học
  function renderClassroomStage() {
    const container = document.getElementById('classroomAislesGrid');
    if (!container) return;

    container.innerHTML = '';
    container.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    container.classList.add(`font-size-${currentFontSize}`);
    const seatsPerDesk = getSeatsPerDesk();
    const calledSet = typeof getCalledStudentsSet === 'function' ? getCalledStudentsSet() : new Set();
    const isNoRepeat = window.state?.noRepeat ?? true;
    const classStudents = getClassStudentList();

    for (let a = 1; a <= SeatingState.aisles; a++) {
      const aisleCol = document.createElement('div');
      aisleCol.className = 'aisle-column';

      const aisleHeader = document.createElement('div');
      aisleHeader.className = 'aisle-header';
      aisleHeader.textContent = `Dãy ${a}`;
      aisleCol.appendChild(aisleHeader);

      for (let r = 1; r <= SeatingState.rows; r++) {
        const deskKey = `${a}_${r}`;
        const groupNum = SeatingState.deskGroups[deskKey];

        const deskRow = document.createElement('div');
        deskRow.className = `desk-row-unit ${groupNum ? 'group-' + groupNum : ''}`;

        const deskLabel = document.createElement('div');
        deskLabel.className = 'desk-label';

        let groupTagHtml = '';
        if (groupNum) {
          const prof = getGroupProfile(groupNum);
          const tagLabel = prof ? `${prof.mascot} ${prof.name}` : `Tổ ${groupNum}`;
          groupTagHtml = `<span class="desk-group-tag" title="${tagLabel} (Nhấp để đổi tổ)" data-desk-group-toggle="${deskKey}">${tagLabel}</span>`;
        } else {
          groupTagHtml = `<span class="desk-group-tag" style="opacity:0.4;" title="Nhấp để gán vào Tổ 1, 2, 3, 4" data-desk-group-toggle="${deskKey}">+ Tổ</span>`;
        }

        deskLabel.innerHTML = `<span>Bàn ${r} ${groupTagHtml}</span><span style="font-size:0.68rem;opacity:0.7;">D${a}-H${r}</span>`;
        deskRow.appendChild(deskLabel);

        const seatsGroup = document.createElement('div');
        seatsGroup.className = 'desk-seats-group';

        for (let s = 1; s <= seatsPerDesk; s++) {
          const seatKey = `${a}_${r}_${s}`;
          const studentName = SeatingState.seats[seatKey];
          const isOccupied = Boolean(studentName);
          const isCalled = isOccupied && isNoRepeat && calledSet.has(studentName);
          const isSelected = SeatingState.selectedStudent?.seatKey === seatKey;
          const isJustCalled = isCalled && (seatKey === SeatingState.lastCalledSeatKey || studentName === SeatingState.lastWinnerStudentName);

          const isShortMode = currentNameDisplayMode === 'short';
          const displayName = isShortMode ? getShortStudentName(studentName, classStudents) : studentName;

          const seatSlot = document.createElement('div');
          seatSlot.className = `seat-slot ${isOccupied ? 'occupied' : 'empty'} ${isCalled ? 'called-student' : ''} ${isJustCalled ? 'just-called' : ''} ${isSelected ? 'selected-seat' : ''}`;
          seatSlot.dataset.seatKey = seatKey;
          seatSlot.title = isOccupied
            ? `${studentName} (${formatSeatLabel(a, r, s)})${isShortMode ? ' • Họ và Tên đầy đủ: ' + studentName : ''}`
            : `Ghế trống (${formatSeatLabel(a, r, s)}) - Kéo hoặc bấm để xếp chỗ`;

          if (isOccupied) {
            const cleanName = displayName.trim();
            const words = cleanName.split(/\s+/);
            let nameClasses = 'seat-student-name';
            if (isShortMode) {
              nameClasses += ' short-mode-name';
            } else {
              if (cleanName.length >= 22 || words.length >= 5) {
                nameClasses += ' extra-long-name';
              } else if (cleanName.length >= 16 || words.length >= 4) {
                nameClasses += ' long-name';
              }
            }

            seatSlot.draggable = true;
            seatSlot.innerHTML = `
              <div class="${nameClasses}">${displayName}</div>
              <button class="seat-remove-btn" title="Gỡ học sinh khỏi ghế" data-seat-remove="${seatKey}">&times;</button>
            `;

            // Bắt sự kiện kéo học sinh từ ghế này
            seatSlot.addEventListener('dragstart', (e) => {
              if (SeatingState.isSpinning) return;
              e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'from-seat',
                studentName: studentName,
                sourceSeatKey: seatKey
              }));
              seatSlot.classList.add('dragging');
            });

            seatSlot.addEventListener('dragend', () => {
              seatSlot.classList.remove('dragging');
            });
          } else {
            seatSlot.innerHTML = `
              <div style="font-size: 1.1rem; opacity: 0.5;">🪑</div>
              <div class="seat-slot-badge">Trống</div>
            `;
          }

          // Sự kiện Click / Chạm để gán hoặc hoán đổi chỗ ngồi
          seatSlot.addEventListener('click', (e) => {
            if (e.target.closest('[data-seat-remove]')) return; // Bấm nút xóa thì bỏ qua
            handleSeatClick(seatKey, studentName);
          });

          // Sự kiện Drag Over và Drop cho ghế
          seatSlot.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!seatSlot.classList.contains('drag-over')) {
              seatSlot.classList.add('drag-over');
            }
          });

          seatSlot.addEventListener('dragleave', () => {
            seatSlot.classList.remove('drag-over');
          });

          seatSlot.addEventListener('drop', (e) => {
            e.preventDefault();
            seatSlot.classList.remove('drag-over');
            handleSeatDrop(e, seatKey);
          });

          seatsGroup.appendChild(seatSlot);
        }

        deskRow.appendChild(seatsGroup);
        aisleCol.appendChild(deskRow);
      }

      container.appendChild(aisleCol);
    }
  }

  // Trạng thái thu gọn/mở rộng cột danh sách học sinh chưa xếp chỗ
  let isUnassignedColumnCollapsed = false;

  function toggleUnassignedColumn(forceState = null) {
    const col = document.querySelector('.seating-unassigned-column');
    const expandTab = document.getElementById('btnUnassignedExpandTab');
    const badge = document.getElementById('unassignedTabBadge');
    const unassigned = getUnassignedStudents();

    if (forceState !== null) {
      isUnassignedColumnCollapsed = forceState;
    } else {
      isUnassignedColumnCollapsed = !isUnassignedColumnCollapsed;
    }

    if (col) {
      col.classList.toggle('collapsed', isUnassignedColumnCollapsed);
    }

    if (expandTab) {
      expandTab.style.display = 'flex';
      expandTab.classList.toggle('active', !isUnassignedColumnCollapsed);
      if (badge) badge.textContent = `${unassigned.length}`;
      const arrow = expandTab.querySelector('.expand-tab-arrow');
      if (arrow) {
        arrow.textContent = isUnassignedColumnCollapsed ? '◀' : '▶';
      }
      expandTab.title = isUnassignedColumnCollapsed
        ? 'Mở rộng danh sách học sinh chưa xếp chỗ'
        : 'Thu gọn danh sách học sinh chưa xếp chỗ';
    }
  }

  function collapseUnassignedColumn() {
    toggleUnassignedColumn(true);
  }

  function expandUnassignedColumn() {
    toggleUnassignedColumn(false);
  }

  // Lọc tìm kiếm học sinh chưa xếp chỗ
  let unassignedSearchKeyword = '';
  function filterUnassignedStudents(keyword) {
    unassignedSearchKeyword = (keyword || '').trim().toLowerCase();
    renderUnassignedPool();
  }

  // Vẽ khay các học sinh chưa được xếp chỗ
  function renderUnassignedPool() {
    const chipsContainer = document.getElementById('unassignedChipsContainer');
    const badgeCount = document.getElementById('unassignedCountBadge');
    const tabBadge = document.getElementById('unassignedTabBadge');
    if (!chipsContainer) return;

    const all = typeof getAllStudents === 'function' ? getAllStudents() : [];
    const unassigned = getUnassignedStudents();
    if (badgeCount) badgeCount.textContent = `${unassigned.length} em`;
    if (tabBadge) tabBadge.textContent = `${unassigned.length}`;

    chipsContainer.innerHTML = '';
    if (all.length === 0) {
      chipsContainer.innerHTML = `
        <div style="color: #64748b; font-size: 0.82rem; padding: 16px 12px; font-weight: 600; text-align: center; background: #f8fafc; border-radius: 10px; border: 1.5px dashed #cbd5e1; width: 100%;">
          Lớp này chưa có học sinh. Hãy nạp file Excel hoặc nhập danh sách học sinh để bắt đầu xếp chỗ!
        </div>
      `;
      return;
    }

    if (unassigned.length === 0) {
      chipsContainer.innerHTML = `
        <div style="color: #047857; font-size: 0.82rem; padding: 16px 12px; font-weight: 700; text-align: center; background: #ecfdf5; border-radius: 10px; border: 1.5px dashed #6ee7b7; width: 100%;">
          🎉 Tuyệt vời! Toàn bộ ${all.length} học sinh đã được xếp chỗ vào sơ đồ.
        </div>
      `;
      return;
    }

    let displayList = unassigned;
    if (unassignedSearchKeyword) {
      displayList = unassigned.filter(name => name.toLowerCase().includes(unassignedSearchKeyword));
    }

    if (displayList.length === 0) {
      chipsContainer.innerHTML = `
        <div style="color: #b45309; font-size: 0.8rem; padding: 12px 10px; text-align: center; background: #fffbeb; border-radius: 8px; border: 1px dashed #fcd34d; width: 100%;">
          Không tìm thấy em nào khớp với "<strong>${unassignedSearchKeyword}</strong>".
        </div>
      `;
      return;
    }

    displayList.forEach(name => {
      const chip = document.createElement('div');
      const isSelected = SeatingState.selectedStudent?.type === 'unassigned' && SeatingState.selectedStudent?.name === name;
      chip.className = `unassigned-chip ${isSelected ? 'selected-chip' : ''}`;
      chip.draggable = true;
      chip.innerHTML = `<span>🎓</span><span style="overflow:hidden; text-overflow:ellipsis;">${name}</span>`;
      chip.title = `Kéo em ${name} hoặc bấm chọn rồi bấm vào ghế trống trên sơ đồ`;

      // Dragstart
      chip.addEventListener('dragstart', (e) => {
        if (SeatingState.isSpinning) return;
        e.dataTransfer.setData('text/plain', JSON.stringify({
          type: 'from-unassigned',
          studentName: name
        }));
        chip.classList.add('dragging');
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
      });

      // Click / Touch select
      chip.addEventListener('click', () => {
        handleUnassignedChipClick(name);
      });

      chipsContainer.appendChild(chip);
    });
  }

  // ============================================================================
  // XỬ LÝ SỰ KIỆN KÉO THẢ & CLICK CHỌN
  // ============================================================================

  // Xử lý khi Drop vào một ghế
  function handleSeatDrop(e, targetSeatKey) {
    if (SeatingState.isSpinning) return;
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      const incomingName = data.studentName;
      const currentTargetName = SeatingState.seats[targetSeatKey];

      if (data.type === 'from-unassigned') {
        // Đặt từ khay unassigned vào ghế
        SeatingState.seats[targetSeatKey] = incomingName;
        saveSeatingData();
        renderLegendBar();
        renderClassroomStage();
        renderUnassignedPool();
        if (typeof showToast === 'function') {
          showToast(`Đã xếp ${incomingName} vào chỗ ngồi`, 'success');
        }
      } else if (data.type === 'from-seat') {
        const sourceSeatKey = data.sourceSeatKey;
        if (sourceSeatKey === targetSeatKey) return;

        // Hoán đổi (Swap) hoặc Di chuyển
        SeatingState.seats[targetSeatKey] = incomingName;
        if (currentTargetName) {
          SeatingState.seats[sourceSeatKey] = currentTargetName;
          if (typeof showToast === 'function') {
            showToast(`Đã hoán đổi vị trí: ${incomingName} ⇄ ${currentTargetName}`, 'info');
          }
        } else {
          delete SeatingState.seats[sourceSeatKey];
        }

        saveSeatingData();
        renderLegendBar();
        renderClassroomStage();
        renderUnassignedPool();
      }
    } catch (err) {
      console.error('Lỗi khi drop ghế:', err);
    }
  }

  // Xử lý Click vào chip học sinh chưa xếp chỗ (Touch friendly)
  function handleUnassignedChipClick(name) {
    if (SeatingState.isSpinning) return;

    if (SeatingState.selectedStudent?.name === name) {
      // Bấm lần 2 -> Hủy chọn
      SeatingState.selectedStudent = null;
    } else {
      SeatingState.selectedStudent = {
        type: 'unassigned',
        name: name
      };
      if (typeof showToast === 'function') {
        showToast(`Đã chọn: ${name}. Hãy bấm vào một ghế trên sơ đồ để xếp chỗ!`, 'info');
      }
    }
    renderClassroomStage();
    renderUnassignedPool();
  }

  // Xử lý Click vào ghế học sinh (Touch friendly)
  function handleSeatClick(targetSeatKey, currentStudentName) {
    if (SeatingState.isSpinning) return;

    // Nếu đang có một học sinh được chọn trước đó
    if (SeatingState.selectedStudent) {
      const selected = SeatingState.selectedStudent;

      if (selected.type === 'unassigned') {
        // Gán từ unassigned vào ghế này
        SeatingState.seats[targetSeatKey] = selected.name;
        SeatingState.selectedStudent = null;
        saveSeatingData();
        renderLegendBar();
        renderClassroomStage();
        renderUnassignedPool();
        if (typeof showToast === 'function') {
          showToast(`Đã xếp ${selected.name} vào chỗ ngồi!`, 'success');
        }
      } else if (selected.type === 'seat') {
        const sourceSeatKey = selected.seatKey;
        if (sourceSeatKey !== targetSeatKey) {
          // Hoán đổi hoặc di chuyển
          SeatingState.seats[targetSeatKey] = selected.name;
          if (currentStudentName) {
            SeatingState.seats[sourceSeatKey] = currentStudentName;
            if (typeof showToast === 'function') {
              showToast(`Đã hoán đổi vị trí: ${selected.name} ⇄ ${currentStudentName}`, 'info');
            }
          } else {
            delete SeatingState.seats[sourceSeatKey];
          }
          SeatingState.selectedStudent = null;
          saveSeatingData();
          renderLegendBar();
          renderClassroomStage();
          renderUnassignedPool();
        } else {
          // Bấm lại chính ghế đó -> Hủy chọn
          SeatingState.selectedStudent = null;
          renderClassroomStage();
        }
      }
    } else {
      // Nếu chưa chọn ai, và ghế này đang có học sinh -> Chọn học sinh ở ghế này
      if (currentStudentName) {
        SeatingState.selectedStudent = {
          type: 'seat',
          name: currentStudentName,
          seatKey: targetSeatKey
        };
        renderClassroomStage();
        if (typeof showToast === 'function') {
          showToast(`Đã chọn ${currentStudentName}. Bấm vào ghế khác để di chuyển/hoán đổi!`, 'info');
        }
      }
    }
  }

  // Bắt sự kiện Click nút đổi Tổ trên nhãn bàn và nút xóa học sinh
  document.addEventListener('click', (e) => {
    // Đóng modal group settings khi bấm ra ngoài nền mờ
    if (e.target.id === 'groupSettingsModal') {
      closeGroupSettingsModal();
      return;
    }

    // Đổi màu Tổ bàn học
    const groupToggle = e.target.closest('[data-desk-group-toggle]');
    if (groupToggle) {
      e.stopPropagation();
      const deskKey = groupToggle.getAttribute('data-desk-group-toggle');
      cycleDeskGroup(deskKey);
      return;
    }

    // Gỡ học sinh khỏi ghế
    const removeBtn = e.target.closest('[data-seat-remove]');
    if (removeBtn) {
      e.stopPropagation();
      const seatKey = removeBtn.getAttribute('data-seat-remove');
      const studentName = SeatingState.seats[seatKey];
      if (studentName) {
        delete SeatingState.seats[seatKey];
        if (SeatingState.selectedStudent?.seatKey === seatKey) {
          SeatingState.selectedStudent = null;
        }
        saveSeatingData();
        renderLegendBar();
        renderClassroomStage();
        renderUnassignedPool();
        if (typeof showToast === 'function') {
          showToast(`Đã gỡ ${studentName} khỏi ghế`, 'info');
        }
      }
    }
  });

  // ============================================================================
  // CÁC HÀM TIỆN ÍCH TỔ / NHÓM HỌC TẬP
  // ============================================================================

  // Tự động phân chia 4 Tổ theo từng Dãy bàn
  function assignGroupsByAisle() {
    if (SeatingState.isSpinning) return;
    for (let a = 1; a <= SeatingState.aisles; a++) {
      const g = ((a - 1) % 4) + 1; // 1, 2, 3, 4, 1...
      for (let r = 1; r <= SeatingState.rows; r++) {
        SeatingState.deskGroups[`${a}_${r}`] = g;
      }
    }
    saveSeatingData();
    renderClassroomStage();
    renderLegendBar();
    if (typeof showToast === 'function') {
      showToast('🎨 Đã tự động phân chia 4 Tổ theo từng Dãy bàn học!', 'success');
    }
  }

  // Đổi nhanh Tổ của một bàn khi click vào thẻ Tổ (Cycle 0 -> 1 -> 2 -> 3 -> 4 -> 0)
  function cycleDeskGroup(deskKey) {
    if (SeatingState.isSpinning) return;
    const current = SeatingState.deskGroups[deskKey] || 0;
    const next = (current + 1) % 5;
    if (next === 0) {
      delete SeatingState.deskGroups[deskKey];
    } else {
      SeatingState.deskGroups[deskKey] = next;
    }
    saveSeatingData();
    renderClassroomStage();
    renderLegendBar();
  }

  // Xóa bỏ phân chia Tổ
  function clearGroups() {
    if (SeatingState.isSpinning) return;
    SeatingState.deskGroups = {};
    saveSeatingData();
    renderClassroomStage();
    renderLegendBar();
    if (typeof showToast === 'function') {
      showToast('Đã xóa phân chia màu Tổ trên sơ đồ', 'info');
    }
  }

  // ============================================================================
  // CÁC HÀM TIỆN ÍCH TỰ ĐỘNG XẾP CHỖ / TRỘN / XÓA
  // ============================================================================

  // Tự động xếp tất cả học sinh chưa có chỗ vào các ghế trống
  function autoAssignSeats() {
    if (SeatingState.isSpinning) return;
    const all = typeof getAllStudents === 'function' ? getAllStudents() : [];
    if (all.length === 0) {
      if (typeof showToast === 'function') showToast('Lớp hiện tại chưa có học sinh nào!', 'warning');
      return;
    }

    const assignedSet = new Set(getAssignedStudentNames());
    const unassigned = all.filter(name => !assignedSet.has(name));

    if (unassigned.length === 0) {
      if (typeof showToast === 'function') showToast('Toàn bộ học sinh đã có chỗ ngồi trên sơ đồ!', 'info');
      return;
    }

    const seatsPerDesk = getSeatsPerDesk();
    let unassignedIdx = 0;

    // Duyệt qua tất cả ghế theo thứ tự Dãy -> Hàng -> Vị trí bàn
    for (let a = 1; a <= SeatingState.aisles; a++) {
      for (let r = 1; r <= SeatingState.rows; r++) {
        for (let s = 1; s <= seatsPerDesk; s++) {
          const seatKey = `${a}_${r}_${s}`;
          if (!SeatingState.seats[seatKey] && unassignedIdx < unassigned.length) {
            SeatingState.seats[seatKey] = unassigned[unassignedIdx];
            unassignedIdx++;
          }
        }
      }
    }

    saveSeatingData();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();

    if (typeof showToast === 'function') {
      showToast(`⚡ Đã tự động xếp thành công ${unassignedIdx} học sinh vào sơ đồ!`, 'success');
    }

    // Nếu toàn bộ học sinh đã có chỗ ngồi (còn 0 em chưa xếp), tự động thu gọn cột phải để mở rộng tối đa sơ đồ lớp
    if (getUnassignedStudents().length === 0) {
      setTimeout(() => {
        collapseUnassignedColumn();
      }, 350);
    }
  }

  // Xáo trộn ngẫu nhiên chỗ ngồi của các học sinh hiện có trên sơ đồ
  function shuffleAssignedSeats() {
    if (SeatingState.isSpinning) return;
    const assignedEntries = Object.entries(SeatingState.seats).filter(([k, v]) => Boolean(v));
    if (assignedEntries.length < 2) {
      if (typeof showToast === 'function') showToast('Cần ít nhất 2 học sinh trên sơ đồ để xáo trộn!', 'warning');
      return;
    }

    const keys = assignedEntries.map(e => e[0]);
    const names = assignedEntries.map(e => e[1]);

    // Thuật toán xáo trộn Fisher-Yates
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    keys.forEach((key, idx) => {
      SeatingState.seats[key] = names[idx];
    });

    saveSeatingData();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();

    if (typeof showToast === 'function') {
      showToast('🔀 Đã xáo trộn ngẫu nhiên chỗ ngồi của cả lớp!', 'success');
    }
  }

  // Dọn sạch toàn bộ chỗ ngồi (Đưa tất cả về khay chưa xếp chỗ)
  function clearAllSeats() {
    if (SeatingState.isSpinning) return;
    if (Object.keys(SeatingState.seats).length === 0) return;

    if (!confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ chỗ ngồi trên sơ đồ của lớp này không?')) {
      return;
    }

    SeatingState.seats = {};
    SeatingState.selectedStudent = null;
    saveSeatingData();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();

    if (typeof showToast === 'function') {
      showToast('🗑️ Đã làm sạch sơ đồ lớp học!', 'info');
    }
  }

  // Cập nhật kích thước ma trận lớp học khi thay đổi Dropdown
  function updateClassroomDimensions() {
    const selectAisles = document.getElementById('seatingSelectAisles');
    const selectRows = document.getElementById('seatingSelectRows');
    const selectType = document.getElementById('seatingSelectType');

    if (selectAisles) SeatingState.aisles = parseInt(selectAisles.value, 10) || 3;
    if (selectRows) SeatingState.rows = parseInt(selectRows.value, 10) || 4;
    if (selectType) SeatingState.deskType = selectType.value || 'double';

    // Lọc lại các ghế vượt quá kích thước mới và xóa đi
    const seatsPerDesk = getSeatsPerDesk();
    const cleanSeats = {};
    Object.entries(SeatingState.seats).forEach(([key, name]) => {
      const parts = key.split('_').map(Number);
      if (parts[0] <= SeatingState.aisles && parts[1] <= SeatingState.rows && parts[2] <= seatsPerDesk) {
        cleanSeats[key] = name;
      }
    });
    SeatingState.seats = cleanSeats;

    saveSeatingData();
    renderLegendBar();
    renderClassroomStage();
    renderUnassignedPool();
  }

  // ============================================================================
  // TRÒ CHƠI QUAY TÊN NGẪU NHIÊN TRÊN SƠ ĐỒ LỚP HỌC (SEATING LOTTERY GAME)
  // ============================================================================
  function spinSeatingChart() {
    if (SeatingState.isSpinning) return;

    const assignedEntries = Object.entries(SeatingState.seats).filter(([k, name]) => Boolean(name));
    if (assignedEntries.length === 0) {
      if (typeof showToast === 'function') {
        showToast('Chưa có học sinh nào trên sơ đồ! Hãy xếp chỗ hoặc bấm "Tự động xếp chỗ" trước.', 'warning');
      }
      return;
    }

    const calledSet = typeof getCalledStudentsSet === 'function' ? getCalledStudentsSet() : new Set();
    const isNoRepeat = window.state?.noRepeat ?? true;

    // Lọc các ghế đủ điều kiện tham gia (chưa bị gọi nếu bật noRepeat)
    let eligibleSeats = assignedEntries;
    if (isNoRepeat) {
      eligibleSeats = assignedEntries.filter(([k, name]) => !calledSet.has(name));
    }

    if (eligibleSeats.length === 0) {
      if (typeof showToast === 'function') {
        showToast('Tất cả học sinh trong sơ đồ đều đã được gọi tên! Thầy/Cô hãy bấm "Làm mới danh sách gọi lại" ở cột trái nhé.', 'warning');
      }
      return;
    }

    // Tự động thu gọn cột danh sách chưa xếp chỗ để mở rộng 100% sân khấu sơ đồ lớp
    collapseUnassignedColumn();

    const mode = SeatingState.callingMode || 'single';
    let chosenEntries = [];

    if (mode === 'desk') {
      // 1. GỌI THEO BÀN: Chọn 1 bàn ngẫu nhiên, bốc toàn bộ học sinh ở bàn đó
      const deskMap = {};
      assignedEntries.forEach(([key, name]) => {
        const parts = key.split('_');
        const deskKey = `${parts[0]}_${parts[1]}`;
        if (!deskMap[deskKey]) deskMap[deskKey] = [];
        deskMap[deskKey].push([key, name]);
      });

      let availableDesks = Object.keys(deskMap);
      if (isNoRepeat) {
        const uncalledDesks = availableDesks.filter(dk => {
          return deskMap[dk].some(([k, name]) => !calledSet.has(name));
        });
        if (uncalledDesks.length > 0) availableDesks = uncalledDesks;
      }

      const chosenDeskKey = availableDesks[Math.floor(Math.random() * availableDesks.length)];
      chosenEntries = deskMap[chosenDeskKey] || [];
    } else if (mode === 'versus') {
      // 2. ĐỐI KHÁNG 2 DÃY (PK 1vs1): Chọn 2 học sinh ở 2 dãy khác nhau
      const aisleMap = {};
      const pool = eligibleSeats.length >= 2 ? eligibleSeats : assignedEntries;
      pool.forEach(([key, name]) => {
        const aisle = key.split('_')[0];
        if (!aisleMap[aisle]) aisleMap[aisle] = [];
        aisleMap[aisle].push([key, name]);
      });

      const aisles = Object.keys(aisleMap);
      if (aisles.length >= 2) {
        const shuffledAisles = [...aisles].sort(() => 0.5 - Math.random());
        const a1 = shuffledAisles[0];
        const a2 = shuffledAisles[1];
        const s1 = aisleMap[a1][Math.floor(Math.random() * aisleMap[a1].length)];
        const s2 = aisleMap[a2][Math.floor(Math.random() * aisleMap[a2].length)];
        chosenEntries = [s1, s2];
      } else {
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        chosenEntries = shuffled.slice(0, Math.min(2, shuffled.length));
      }
    } else if (mode === 'all_groups') {
      // 3. ĐẠI CHIẾN 4 TỔ: Mỗi tổ chọn 1 đại diện
      const groupMap = { 1: [], 2: [], 3: [], 4: [] };
      const pool = eligibleSeats.length >= 4 ? eligibleSeats : assignedEntries;

      pool.forEach(([key, name]) => {
        const parts = key.split('_');
        const deskKey = `${parts[0]}_${parts[1]}`;
        const groupNum = SeatingState.deskGroups[deskKey] || (((Number(parts[0]) - 1) % 4) + 1);
        if (groupMap[groupNum]) {
          groupMap[groupNum].push([key, name]);
        }
      });

      for (let g = 1; g <= 4; g++) {
        if (groupMap[g] && groupMap[g].length > 0) {
          const rep = groupMap[g][Math.floor(Math.random() * groupMap[g].length)];
          chosenEntries.push(rep);
        }
      }

      if (chosenEntries.length === 0) {
        chosenEntries = [pool[Math.floor(Math.random() * pool.length)]];
      }
    } else if (mode === 'row') {
      // 4. GỌI HÀNG NGANG: Chọn 1 hàng bàn bất kỳ, bốc toàn bộ học sinh ở hàng đó
      const rowMap = {};
      assignedEntries.forEach(([key, name]) => {
        const row = key.split('_')[1];
        if (!rowMap[row]) rowMap[row] = [];
        rowMap[row].push([key, name]);
      });

      let availableRows = Object.keys(rowMap);
      if (isNoRepeat) {
        const uncalledRows = availableRows.filter(r => {
          return rowMap[r].some(([k, name]) => !calledSet.has(name));
        });
        if (uncalledRows.length > 0) availableRows = uncalledRows;
      }

      const chosenRow = availableRows[Math.floor(Math.random() * availableRows.length)];
      chosenEntries = rowMap[chosenRow] || [];
    } else {
      // 5. GỌI CÁ NHÂN (CHUẨN): 1 học sinh
      const winnerIndex = Math.floor(Math.random() * eligibleSeats.length);
      chosenEntries = [eligibleSeats[winnerIndex]];
    }

    if (chosenEntries.length === 0) {
      chosenEntries = [eligibleSeats[0]];
    }

    const targetWinnerKeys = chosenEntries.map(e => e[0]);

    // Khởi tạo âm thanh
    if (window.sound && typeof window.sound.init === 'function') {
      window.sound.init();
    }

    SeatingState.isSpinning = true;
    document.querySelectorAll('.seating-spin-btn').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('spinning');
      const label = btn.querySelector('.spin-btn-label');
      if (label) label.textContent = 'ĐANG QUAY...';
    });

    // Lấy danh sách các phần tử ghế hợp lệ trên DOM để tạo chuỗi nhảy Spotlight
    const seatElementsMap = {};
    document.querySelectorAll('.seat-slot.occupied').forEach(el => {
      const key = el.dataset.seatKey;
      if (key) seatElementsMap[key] = el;
    });

    const eligibleKeys = assignedEntries.map(e => e[0]);

    // Tạo hiệu ứng nhảy đèn Spotlight chậm dần đồng thời cho các ghế
    const totalSteps = 28 + Math.floor(Math.random() * 6);
    let currentStep = 0;
    let delay = 60; // Tốc độ ban đầu 60ms
    let lastHighlightedKeys = [];

    function runSpotlightStep() {
      // Xóa highlight ở các ghế bước trước
      lastHighlightedKeys.forEach(k => {
        if (seatElementsMap[k]) seatElementsMap[k].classList.remove('spotlight-active');
      });

      currentStep++;

      // Xác định các ghế highlight ở bước này
      if (currentStep >= totalSteps) {
        // Bước cuối cùng: Nhảy vào đúng các ghế người chiến thắng
        lastHighlightedKeys = targetWinnerKeys;
      } else {
        // Nhảy ngẫu nhiên qua các ghế với số lượng tương ứng
        const count = Math.min(targetWinnerKeys.length, eligibleKeys.length);
        const shuffled = [...eligibleKeys].sort(() => 0.5 - Math.random());
        lastHighlightedKeys = shuffled.slice(0, count);
      }

      lastHighlightedKeys.forEach(k => {
        if (seatElementsMap[k]) {
          seatElementsMap[k].classList.add('spotlight-active');
        }
      });

      // Cuộn nhẹ ghế đầu tiên nếu nằm ngoài tầm nhìn
      if (lastHighlightedKeys[0] && seatElementsMap[lastHighlightedKeys[0]]) {
        seatElementsMap[lastHighlightedKeys[0]].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Phát âm thanh tick
      if (window.sound && typeof window.sound.playTick === 'function') {
        window.sound.playTick();
      }

      if (currentStep < totalSteps) {
        if (currentStep > totalSteps - 12) {
          delay += 35;
        } else if (currentStep > totalSteps - 6) {
          delay += 60;
        } else {
          delay += 6;
        }
        setTimeout(runSpotlightStep, delay);
      } else {
        // Dừng lại và kết thúc: Công bố kết quả
        finalizeSeatingSpin(chosenEntries, mode, seatElementsMap);
      }
    }

    runSpotlightStep();
  }

  // Kết thúc vòng quay và công bố người chiến thắng
  function finalizeSeatingSpin(chosenEntries, mode, seatElementsMap) {
    SeatingState.isSpinning = false;
    const modeConfig = CALLING_MODES[mode] || CALLING_MODES.single;

    document.querySelectorAll('.seating-spin-btn').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('spinning');
      const label = btn.querySelector('.spin-btn-label');
      if (label) label.textContent = modeConfig.btnLabel || 'QUAY TÊN SƠ ĐỒ';
    });

    // Tạo danh sách hồ sơ chi tiết của các học sinh chiến thắng
    const winners = chosenEntries.map(([seatKey, studentName]) => {
      const parts = seatKey.split('_').map(Number);
      const locationText = formatSeatLabel(parts[0], parts[1], parts[2]);
      const deskKey = `${parts[0]}_${parts[1]}`;
      const groupNum = SeatingState.deskGroups[deskKey] || (((parts[0] - 1) % 4) + 1);
      const groupProfile = getGroupProfile(groupNum);
      const groupInfo = groupProfile ? `${groupProfile.mascot} ${groupProfile.name}` : (groupNum && GROUP_CONFIG[groupNum] ? GROUP_CONFIG[groupNum].label : '');
      const seatEl = seatElementsMap ? seatElementsMap[seatKey] : document.querySelector(`.seat-slot[data-seat-key="${seatKey}"]`);
      return {
        seatKey,
        studentName,
        aisle: parts[0],
        row: parts[1],
        seatIdx: parts[2],
        deskKey,
        groupNum,
        groupProfile,
        groupInfo,
        locationText,
        seatEl
      };
    });

    // Kích hoạt hiệu ứng nổi bật ghế chiến thắng
    winners.forEach(w => {
      if (w.seatEl) w.seatEl.classList.add('winner-seat');
    });

    // Phát âm thanh giọng nói bình luận viên AI theo từng chế độ
    if (mode === 'versus' && winners.length >= 2) {
      if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speak === 'function') {
        const p1 = getSpokenStudentName(winners[0].studentName);
        const p2 = getSpokenStudentName(winners[1].studentName);
        window.voiceAnnouncer.speak(`Trận đấu đối kháng giữa bạn ${p1} dãy ${winners[0].aisle} và bạn ${p2} dãy ${winners[1].aisle}! Cả hai bạn cùng chuẩn bị lên bảng nhé!`);
      }
    } else if (mode === 'desk') {
      if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speak === 'function') {
        const names = winners.map(w => getSpokenStudentName(w.studentName)).join(' và bạn ');
        window.voiceAnnouncer.speak(`Mời đôi bạn cùng tiến ở dãy ${winners[0].aisle} bàn ${winners[0].row}: bạn ${names} cùng đứng dậy trả lời!`);
      }
    } else if (mode === 'all_groups') {
      if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speak === 'function') {
        window.voiceAnnouncer.speak(`Đại chiến bốn tổ! Mời các đại diện xuất sắc của các tổ cùng tiến lên sân khấu!`);
      }
    } else if (mode === 'row') {
      if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speak === 'function') {
        window.voiceAnnouncer.speak(`Mời tất cả các bạn ở hàng ${winners[0]?.row || 1} của tất cả các dãy cùng đứng dậy trả lời!`);
      }
    } else {
      // Chế độ Gọi cá nhân chuẩn
      const w = winners[0];
      const spokenWinnerName = getSpokenStudentName(w.studentName);
      if (window.voiceAnnouncer && typeof window.voiceAnnouncer.speakWinner === 'function') {
        window.voiceAnnouncer.speakWinner({
          name: spokenWinnerName,
          row: w.row,
          col: w.seatIdx,
          aisle: w.aisle,
          groupNum: w.groupNum,
          groupName: w.groupProfile?.name || '',
          mascot: w.groupProfile?.mascot || ''
        });
      }
    }

    // Hiệu ứng màu sắc và âm thanh chúc mừng
    if (mode === 'single' && winners[0]?.groupNum) {
      const gNum = winners[0].groupNum;
      document.body.classList.remove('stage-celebrate-group-1', 'stage-celebrate-group-2', 'stage-celebrate-group-3', 'stage-celebrate-group-4');
      document.body.classList.add(`stage-celebrate-group-${gNum}`);

      if (window.sound && typeof window.sound.playGroupVictory === 'function') {
        window.sound.playGroupVictory(gNum);
      } else if (window.sound && typeof window.sound.playVictory === 'function') {
        window.sound.playVictory();
      }

      if (typeof triggerGroupConfetti === 'function') {
        triggerGroupConfetti(gNum);
      } else if (typeof triggerCelebrationConfetti === 'function') {
        triggerCelebrationConfetti();
      }
    } else {
      if (window.sound && typeof window.sound.playVictory === 'function') {
        window.sound.playVictory();
      }
      if (typeof triggerCelebrationConfetti === 'function') {
        triggerCelebrationConfetti();
      }
    }

    // Cập nhật danh sách đã gọi & lịch sử gọi cho tất cả người trúng
    const cls = typeof getCurrentClass === 'function' ? getCurrentClass() : null;
    winners.forEach(w => {
      if (cls && window.state?.noRepeat) {
        if (!cls.called.includes(w.studentName)) {
          cls.called.push(w.studentName);
        }
      }
      if (typeof recordStudentCall === 'function') {
        recordStudentCall(w.studentName);
      }
    });

    // Ghi nhận ghế và tên học sinh vừa trúng để tạo hiệu ứng mờ dần
    SeatingState.lastCalledSeatKey = winners[0]?.seatKey || null;
    SeatingState.lastWinnerStudentName = winners[0]?.studentName || null;
    window.lastCalledWinnerName = winners[0]?.studentName || null;

    setTimeout(() => {
      SeatingState.lastCalledSeatKey = null;
      SeatingState.lastWinnerStudentName = null;
      if (window.lastCalledWinnerName === winners[0]?.studentName) {
        window.lastCalledWinnerName = null;
      }
    }, 1500);

    if (typeof updateUI === 'function') {
      updateUI();
    }
    syncRoundStatusUI();

    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage();
    }

    // Mở Modal chúc mừng tương ứng với từng chế độ
    openSeatingWinnerModal(winners, mode);

    // Đồng bộ kết quả sang Remote Screen Sync (Điện thoại Thầy)
    if (window.RemoteSync && typeof window.RemoteSync.send === 'function') {
      window.RemoteSync.send('winner_announced', {
        mode: mode,
        studentName: winners.map(w => w.studentName).join(', '),
        locationText: winners[0]?.locationText || '',
        groupInfo: winners[0]?.groupInfo || '',
        groupNum: winners[0]?.groupNum || 1,
        mascot: winners[0]?.groupProfile?.mascot || '',
        groupName: winners[0]?.groupProfile?.name || ''
      });
    }
  }

  // Mở Popup chúc mừng người chiến thắng trên sơ đồ
  function openSeatingWinnerModal(winners, mode) {
    const existing = document.getElementById('seatingWinnerModal');
    if (existing) existing.remove();

    if (!Array.isArray(winners) || winners.length === 0) return;

    const modal = document.createElement('div');
    modal.id = 'seatingWinnerModal';
    modal.className = 'seating-winner-modal';

    let contentHtml = '';
    let headlineText = 'CHÚC MỪNG BẠN ĐÃ ĐƯỢC CHỌN!';
    let crownIcon = '👑';
    let borderColor = '#f59e0b';

    if (mode === 'versus' && winners.length >= 2) {
      headlineText = '⚔️ ĐỐI ĐẦU ĐỈNH CAO: 2 DÃY TRANH TÀI!';
      crownIcon = '⚔️';
      borderColor = '#ea580c';
      const w1 = winners[0];
      const w2 = winners[1];
      contentHtml = `
        <div class="winner-versus-box">
          <div class="fighter-card fighter-blue">
            <span class="fighter-badge">Dãy ${w1.aisle} • ${w1.groupInfo || 'Chiến Binh 1'}</span>
            <div class="fighter-name">${w1.studentName}</div>
            <div class="fighter-location">📍 Hàng ${w1.row} (${w1.seatIdx === 1 ? 'Ghế Trái' : 'Ghế Phải'})</div>
          </div>
          <div class="versus-vs-badge">VS</div>
          <div class="fighter-card fighter-red">
            <span class="fighter-badge">Dãy ${w2.aisle} • ${w2.groupInfo || 'Chiến Binh 2'}</span>
            <div class="fighter-name">${w2.studentName}</div>
            <div class="fighter-location">📍 Hàng ${w2.row} (${w2.seatIdx === 1 ? 'Ghế Trái' : 'Ghế Phải'})</div>
          </div>
        </div>
      `;
    } else if (mode === 'desk') {
      headlineText = '👥 ĐÔI BẠN CÙNG TIẾN: CÙNG LÊN BẢNG!';
      crownIcon = '🤝';
      borderColor = '#ea580c';
      const w1 = winners[0];
      const w2 = winners[1];
      if (w2) {
        contentHtml = `
          <div class="winner-pair-box">
            <div class="pair-card">
              <span class="pair-seat-tag">Dãy ${w1.aisle} - Hàng ${w1.row} (${w1.seatIdx === 1 ? 'Ghế Trái' : 'Ghế Phải'})</span>
              <div class="pair-student-name">${w1.studentName}</div>
            </div>
            <div class="pair-and-icon">🤝</div>
            <div class="pair-card">
              <span class="pair-seat-tag">Dãy ${w2.aisle} - Hàng ${w2.row} (${w2.seatIdx === 1 ? 'Ghế Trái' : 'Ghế Phải'})</span>
              <div class="pair-student-name">${w2.studentName}</div>
            </div>
          </div>
          <div class="winner-seat-location" style="border-color: #f97316;">
            <span>📍</span>
            <span>Bàn số ${w1.row} • Dãy ${w1.aisle}${w1.groupInfo ? ' • ' + w1.groupInfo : ''}</span>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="winner-student-name">${w1.studentName}</div>
          <div class="winner-seat-location" style="border-color: #f97316;">
            <span>📍</span>
            <span>${w1.locationText} (Bàn đơn)</span>
          </div>
        `;
      }
    } else if (mode === 'all_groups') {
      headlineText = '🏆 ĐẠI CHIẾN 4 TỔ: CÁC ĐẠI DIỆN TRANH TÀI!';
      crownIcon = '🏆';
      borderColor = '#ea580c';
      const cardsHtml = winners.map(w => {
        const color = w.groupProfile?.color || '#ea580c';
        const mascot = w.groupProfile?.mascot || '🚩';
        const groupName = w.groupProfile?.name || `Tổ ${w.groupNum}`;
        return `
          <div class="quad-card" style="border-color: ${color};">
            <div class="quad-mascot">${mascot}</div>
            <div class="quad-name">${w.studentName}</div>
            <div class="quad-group-tag" style="color: ${color};">${groupName} (Dãy ${w.aisle})</div>
          </div>
        `;
      }).join('');
      contentHtml = `<div class="winner-quad-box">${cardsHtml}</div>`;
    } else if (mode === 'row') {
      headlineText = `📏 HÀNG NGANG XUẤT TRẬN: TOÀN BỘ HÀNG ${winners[0]?.row || 1}!`;
      crownIcon = '📏';
      borderColor = '#9333ea';
      const cardsHtml = winners.map(w => `
        <div class="row-student-card">
          <span class="row-aisle-tag">Dãy ${w.aisle}</span>
          <span class="row-student-name">${w.studentName}</span>
        </div>
      `).join('');
      contentHtml = `<div class="winner-row-box">${cardsHtml}</div>`;
    } else {
      // mode === 'single'
      const w = winners[0];
      const groupColor = w.groupProfile?.color || (w.groupNum && GROUP_CONFIG[w.groupNum] ? GROUP_CONFIG[w.groupNum].color : '#f59e0b');
      const mascotEmoji = w.groupProfile?.mascot || '👑';
      crownIcon = mascotEmoji;
      borderColor = groupColor;
      contentHtml = `
        <div class="winner-student-name">${w.studentName}</div>
        <div class="winner-seat-location" style="border-color: ${groupColor};">
          <span>📍</span>
          <span>${w.locationText}${w.groupInfo ? ' • 🎖️ ' + w.groupInfo : ''}</span>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="seating-winner-card" style="border-color: ${borderColor};">
        <div class="winner-crown-icon">${crownIcon}</div>
        <div class="winner-headline" style="color: ${borderColor};">${headlineText}</div>
        ${contentHtml}
        <div class="winner-actions-row">
          <button id="btnSeatingSpinAgain" class="seating-spin-btn btn-winner-spin-again" style="background: linear-gradient(135deg, ${borderColor}, #ea580c);">
            🎲 Quay tiếp
          </button>
          <button id="btnCloseSeatingWinner" class="seating-btn-action btn-winner-close">
            Đóng
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      document.body.classList.remove('stage-celebrate-group-1', 'stage-celebrate-group-2', 'stage-celebrate-group-3', 'stage-celebrate-group-4');
      winners.forEach(w => {
        if (w.seatEl) w.seatEl.classList.remove('winner-seat');
      });
      renderClassroomStage();
    };

    document.getElementById('btnCloseSeatingWinner')?.addEventListener('click', closeModal);
    document.getElementById('btnSeatingSpinAgain')?.addEventListener('click', () => {
      closeModal();
      setTimeout(spinSeatingChart, 200);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // ============================================================================
  // CÀI ĐẶT TÙY BIẾN TÊN GỌI & LINH VẬT 4 TỔ (GROUP PROFILES SETTINGS)
  // ============================================================================
  const GROUP_PRESETS = {
    beasts: {
      name: 'Muông Thú Oai Dũng',
      groups: {
        1: { name: 'Đại Bàng', mascot: '🦅' },
        2: { name: 'Sư Tử', mascot: '🦁' },
        3: { name: 'Cá Mập', mascot: '🦈' },
        4: { name: 'Sói Xám', mascot: '🐺' }
      }
    },
    mythic: {
      name: 'Tứ Linh Huyền Thoại',
      groups: {
        1: { name: 'Thanh Long', mascot: '🐉' },
        2: { name: 'Bạch Hổ', mascot: '🐅' },
        3: { name: 'Chu Tước', mascot: '🦅' },
        4: { name: 'Huyền Vũ', mascot: '🐢' }
      }
    },
    heroes: {
      name: 'Siêu Anh Hùng',
      groups: {
        1: { name: 'Tia Chớp', mascot: '⚡' },
        2: { name: 'Chiến Binh', mascot: '🛡️' },
        3: { name: 'Phi Thuyền', mascot: '🚀' },
        4: { name: 'Ngôi Sao', mascot: '🌟' }
      }
    },
    seasons: {
      name: 'Bốn Mùa Tươi Đẹp',
      groups: {
        1: { name: 'Mùa Xuân', mascot: '🌸' },
        2: { name: 'Mùa Hạ', mascot: '☀️' },
        3: { name: 'Mùa Thu', mascot: '🍁' },
        4: { name: 'Mùa Đông', mascot: '❄️' }
      }
    },
    classic: {
      name: 'Mặc Định 4 Tổ',
      groups: {
        1: { name: 'Tổ 1', mascot: '1️⃣' },
        2: { name: 'Tổ 2', mascot: '2️⃣' },
        3: { name: 'Tổ 3', mascot: '3️⃣' },
        4: { name: 'Tổ 4', mascot: '4️⃣' }
      }
    }
  };

  // Mở modal cài đặt 4 Tổ và linh vật
  function openGroupSettingsModal(focusGroupNum = 1) {
    const modal = document.getElementById('groupSettingsModal');
    if (!modal) return;

    for (let g = 1; g <= 4; g++) {
      const prof = SeatingState.groupProfiles[g] || DEFAULT_GROUP_PROFILES[g];
      const nameInput = document.getElementById(`groupSettingName_${g}`);
      const mascotBadge = document.getElementById(`groupSettingMascotBadge_${g}`);
      const mascotInput = document.getElementById(`groupSettingMascot_${g}`);

      if (nameInput) nameInput.value = prof.name || '';
      if (mascotBadge) mascotBadge.textContent = prof.mascot || '🚩';
      if (mascotInput) mascotInput.value = prof.mascot || '🚩';
    }

    modal.classList.add('open');
    const targetInput = document.getElementById(`groupSettingName_${focusGroupNum}`);
    if (targetInput) {
      setTimeout(() => targetInput.focus(), 150);
    }
  }

  // Đóng modal cài đặt tổ
  function closeGroupSettingsModal() {
    const modal = document.getElementById('groupSettingsModal');
    if (modal) modal.classList.remove('open');
  }

  // Chọn emoji cho tổ
  function selectMascotForGroup(groupNum, emoji) {
    const mascotBadge = document.getElementById(`groupSettingMascotBadge_${groupNum}`);
    const mascotInput = document.getElementById(`groupSettingMascot_${groupNum}`);
    if (mascotBadge) mascotBadge.textContent = emoji;
    if (mascotInput) mascotInput.value = emoji;
  }

  // Áp dụng bộ mẫu có sẵn (Preset)
  function applyGroupPreset(presetKey) {
    const preset = GROUP_PRESETS[presetKey];
    if (!preset) return;

    for (let g = 1; g <= 4; g++) {
      const data = preset.groups[g];
      const nameInput = document.getElementById(`groupSettingName_${g}`);
      const mascotBadge = document.getElementById(`groupSettingMascotBadge_${g}`);
      const mascotInput = document.getElementById(`groupSettingMascot_${g}`);

      if (nameInput) nameInput.value = data.name;
      if (mascotBadge) mascotBadge.textContent = data.mascot;
      if (mascotInput) mascotInput.value = data.mascot;
    }

    if (typeof showToast === 'function') {
      showToast(`Đã nạp bộ mẫu: ${preset.name}`, 'info');
    }
  }

  // Lưu cài đặt tổ từ modal
  function saveGroupSettings() {
    for (let g = 1; g <= 4; g++) {
      const nameInput = document.getElementById(`groupSettingName_${g}`);
      const mascotInput = document.getElementById(`groupSettingMascot_${g}`);

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const mascotVal = mascotInput ? mascotInput.value.trim() : '';

      SeatingState.groupProfiles[g].name = nameVal || `Tổ ${g}`;
      SeatingState.groupProfiles[g].mascot = mascotVal || '🚩';
    }

    saveSeatingData();
    renderLegendBar();
    renderClassroomStage();
    closeGroupSettingsModal();

    if (typeof showToast === 'function') {
      showToast('✨ Đã cập nhật thành công tên gọi & linh vật của 4 Tổ!', 'success');
    }
  }

  // Bật/Tắt giọng đọc bình luận viên AI
  function toggleVoiceAnnouncer() {
    if (!window.voiceAnnouncer) return;
    const isEnabled = window.voiceAnnouncer.toggle();
    updateVoiceButtonUI(isEnabled);
    if (typeof showToast === 'function') {
      showToast(
        isEnabled ? '🗣️ Đã BẬT giọng bình luận viên AI gọi tên!' : '🔇 Đã TẮT giọng bình luận viên AI',
        isEnabled ? 'success' : 'info'
      );
    }
  }

  // Cập nhật giao diện nút voice toggle
  function updateVoiceButtonUI(enabled) {
    const btn = document.getElementById('btnVoiceAnnouncerToggle');
    if (!btn) return;
    if (enabled) {
      btn.classList.add('active');
      btn.innerHTML = '<span>🗣️ Giọng AI: BẬT</span>';
      btn.title = 'Nhấp để TẮT giọng bình luận viên AI';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<span>🔇 Giọng AI: TẮT</span>';
      btn.title = 'Nhấp để BẬT giọng bình luận viên AI';
    }
  }

  // ============================================================================
  // XUẤT MODULE RA WINDOW
  // ============================================================================
  window.SeatingChartModule = {
    render: renderSeatingModule,
    openSettingsModal: openSettingsModal,
    closeSettingsModal: closeSettingsModal,
    autoAssign: autoAssignSeats,
    shuffle: shuffleAssignedSeats,
    clearAll: clearAllSeats,
    spin: spinSeatingChart,
    updateDimensions: updateClassroomDimensions,
    assignGroupsByAisle: assignGroupsByAisle,
    cycleDeskGroup: cycleDeskGroup,
    clearGroups: clearGroups,
    openGroupSettings: openGroupSettingsModal,
    closeGroupSettings: closeGroupSettingsModal,
    handleGroupChipClick: handleGroupChipClick,
    selectMascot: selectMascotForGroup,
    applyPreset: applyGroupPreset,
    saveGroupSettings: saveGroupSettings,
    toggleVoice: toggleVoiceAnnouncer,
    updateVoiceButtonUI: updateVoiceButtonUI,
    filterUnassigned: filterUnassignedStudents,
    toggleUnassignedColumn: toggleUnassignedColumn,
    collapseUnassignedColumn: collapseUnassignedColumn,
    expandUnassignedColumn: expandUnassignedColumn,
    switchPreset: switchPreset,
    promptNewPreset: promptNewPreset,
    deleteCurrentPreset: deleteCurrentPreset,
    setFontSize: setFontSize,
    getFontSize: () => currentFontSize,
    syncFontSizeUI: syncFontSizeUI,
    setNameDisplayMode: setNameDisplayMode,
    getNameDisplayMode: () => currentNameDisplayMode,
    getShortStudentName: getShortStudentName,
    getSpokenName: getSpokenStudentName,
    isDuplicateName: isDuplicateStudentName,
    syncNameDisplayModeUI: syncNameDisplayModeUI,
    testVoice: testVoice,
    setCallingMode: setCallingMode,
    getCallingMode: () => SeatingState.callingMode || 'single',
    syncCallingModeUI: syncCallingModeUI,
    resetCalledRound: resetCalledRound,
    syncRoundStatusUI: syncRoundStatusUI,
    toggleTeacherDeskPosition: toggleTeacherDeskPosition,
    setTeacherDeskPosition: setTeacherDeskPosition,
    getTeacherDeskPosition: () => SeatingState.teacherDeskPosition || 'right',
    toggleModesPanelCollapse: toggleModesPanelCollapse,
    isModesPanelCollapsed: () => isModesPanelCollapsed,
    getState: () => ({
      aisles: SeatingState.aisles,
      rows: SeatingState.rows,
      deskType: SeatingState.deskType,
      teacherDeskPosition: SeatingState.teacherDeskPosition || 'right',
      callingMode: SeatingState.callingMode,
      seats: { ...SeatingState.seats },
      deskGroups: { ...SeatingState.deskGroups },
      groupProfiles: JSON.parse(JSON.stringify(SeatingState.groupProfiles)),
      lastCalledSeatKey: SeatingState.lastCalledSeatKey,
      lastWinnerStudentName: SeatingState.lastWinnerStudentName
    })
  };

})();

