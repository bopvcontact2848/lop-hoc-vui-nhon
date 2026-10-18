/**
 * ==============================================================================
 * MODULE QUẢN LÝ HỌC SINH & LỚP HỌC (scripts/students.js)
 * Chịu trách nhiệm quản lý danh sách học sinh, đa lớp học, nạp/đọc file Excel,
 * LocalStorage và tính năng SAO LƯU / KHÔI PHỤC (Backup/Restore JSON).
 * ==============================================================================
 */

// --- DANH SÁCH DỮ LIỆU MẪU 45 HỌC SINH VIỆT NAM (CHUẨN LỚP 9A4) ---
const SAMPLE_STUDENTS = [
  "Trần Thanh Phú", "Nguyễn Võ Anh Thư", "Trà Tuấn Minh", "Nguyễn Đỗ Khánh Ly",
  "Nguyễn Đặng Quỳnh Khanh", "Nguyễn Duy Thịnh", "Nguyễn Huỳnh Phương Trang", "Nguyễn Thị Mới",
  "Nguyễn Ngọc Hân", "Lê Quốc Nguyên", "Đào Lê Hồng Ngọc", "Nguyễn Thị Mỹ Loan",
  "Nguyễn Hạo Văn", "Võ Thị Yến Như", "Lê Minh Thắng", "Lê Nhã Quỳnh",
  "Nguyễn Thị Ngọc Trâm", "Võ Bình Minh", "Nguyễn Thị Kỳ Duyên", "Phạm Đương Kim",
  "Nguyễn Minh Trọng", "Lê Khánh Toàn", "Ngô Thị Ánh Tuyết", "Huỳnh Gia Hưng",
  "Đinh Bảo Châu", "Trần Minh Quân", "Phan Thùy Linh", "Lý Thanh Tùng",
  "Đặng Ngọc Mai", "Bùi Thế Phong", "Dương Hoàng Yến", "Hà Tuấn Khang",
  "Vũ Mai Phương", "Lưu Đức Thắng", "Cao Bích Ngọc", "Tạ Nhật Hoàng",
  "Đỗ Cẩm Tú", "Hoàng Kim Ngân", "Trương Bá Đạt", "Lương Thảo Nguyên",
  "Châu Vĩnh Khang", "Tô Thùy Trang", "Mai Quốc Việt", "Nghiêm Hoàng Nam", "Bạch Yến Nhi"
];

// --- BỘ 5 LỚP HỌC MẪU HOÀN CHỈNH KÈM SƠ ĐỒ CHỖ NGỒI RIÊNG BIỆT ---
const SAMPLE_CLASSES_DEFINITIONS = [
  {
    id: 'cls_sample_9a4',
    name: 'Lớp 9A4',
    students: [...SAMPLE_STUDENTS],
    seatingConfig: { aisles: 4, rows: 6, deskType: 'double' }
  },
  {
    id: 'cls_sample_9a1',
    name: 'Lớp 9A1',
    students: [
      "Hoàng Đức Anh", "Vũ Thảo Vy", "Đặng Tuấn Kiệt", "Bùi Khánh Linh",
      "Đỗ Gia Hưng", "Hồ Yến Nhi", "Ngô Quang Huy", "Dương Phương Anh",
      "Lý Thiên Phúc", "Võ Trúc Mai", "Đinh Hữu Nghĩa", "Mai Thùy Chi",
      "Trịnh Quốc Bảo", "Phan Cẩm Tú", "Lưu Đăng Khoa", "Cao Mỹ Duyên",
      "Lương Việt Dũng", "Tạ Bích Hạnh", "Châu Vĩnh Phát", "Tô Diệu Huyền",
      "Đào Hải Đăng", "Hà Ngọc Trâm", "Tăng Quốc Huy", "Nghiêm Hoàng Yến",
      "Khổng Minh Tuấn", "Quách Như Quỳnh", "Trương Bá Thắng", "Vương Thúy Nga",
      "Ân Nhật Minh", "Thái Hà My", "Lâm Quốc Trọng", "Cù Mai Trang",
      "Bạch Đình Phong", "Giang Tuệ Mẫn", "Phạm Minh Khang", "Trần Gia Bảo",
      "Lê Bảo Trâm", "Hoàng Nhật Nam", "Nguyễn Thùy Dương", "Vũ Hoàng Long"
    ],
    seatingConfig: { aisles: 4, rows: 5, deskType: 'double' }
  },
  {
    id: 'cls_sample_8a2',
    name: 'Lớp 8A2',
    students: [
      "Nguyễn Hải Đăng", "Trần Phương Thảo", "Lê Bảo Nam", "Phạm Thu Uyên",
      "Hoàng Gia Huy", "Vũ Ngọc Diệp", "Đặng Minh Quân", "Bùi Tường Vy",
      "Đỗ Thành Đạt", "Hồ Thanh Trúc", "Ngô Quốc Anh", "Dương Thảo Nguyên",
      "Lý Quốc Huy", "Võ Mai Anh", "Đinh Hoàng Bách", "Mai Bảo Châu",
      "Trịnh Minh Đức", "Phan Thảo Linh", "Lưu Tuấn Kiệt", "Cao Kim Ngân",
      "Lương Hoàng Long", "Tạ Bảo Hân", "Châu Minh Khôi", "Tô Như Ý",
      "Đào Tuấn Anh", "Hà Phương Linh", "Tăng Minh Trí", "Nghiêm Thảo Nhi",
      "Khổng Gia Phúc", "Quách Tú Anh", "Trương Minh Quân", "Vương Trúc Linh",
      "Ân Bảo Long", "Thái Yến Vy", "Lâm Tuấn Kiệt", "Cù Minh Trang"
    ],
    seatingConfig: { aisles: 3, rows: 6, deskType: 'double' }
  },
  {
    id: 'cls_sample_7a3',
    name: 'Lớp 7A3',
    students: [
      "Nguyễn Thành Vinh", "Trần Ngọc Lan", "Lê Tuấn Hưng", "Phạm Hải Yến",
      "Hoàng Gia Khiêm", "Vũ Quỳnh Nga", "Đặng Đức Duy", "Bùi Thùy Dung",
      "Đỗ Minh Triết", "Hồ Khánh An", "Ngô Hoàng Nam", "Dương Cát Tường",
      "Lý Gia Bảo", "Võ Thùy Tiên", "Đinh Nhật Minh", "Mai Ánh Dương",
      "Trịnh Quốc Đạt", "Phan Ngọc Ánh", "Lưu Hoàng Phát", "Cao Yến Trang",
      "Lương Hữu Phước", "Tạ Thảo My", "Châu Hưng Thịnh", "Tô Diệu Linh",
      "Đào Gia Huy", "Hà Tú Uyên", "Tăng Thế Vinh", "Nghiêm Khánh Chi",
      "Khổng Quốc Bảo", "Quách Trà My", "Trương Hữu Nghĩa", "Vương Ngọc Diệp"
    ],
    seatingConfig: { aisles: 4, rows: 4, deskType: 'double' }
  },
  {
    id: 'cls_sample_6a5',
    name: 'Lớp 6A5',
    students: [
      "Nguyễn Phúc Khang", "Trần Thảo Vân", "Lê Hoàng Yến", "Phạm Minh Khôi",
      "Hoàng Ngọc Mai", "Vũ Quốc Việt", "Đặng Thanh Trúc", "Bùi Đức Trí",
      "Đỗ Phương Dung", "Hồ Bảo An", "Ngô Gia Thịnh", "Dương Hoàng Oanh",
      "Lý Quốc Cường", "Võ Minh Châu", "Đinh Văn Quyết", "Mai Tú Trâm",
      "Trịnh Gia Hưng", "Phan Diệp Anh", "Lưu Đình Phong", "Cao Thảo Hiền",
      "Lương Gia Phát", "Tạ Minh Thư", "Châu Bảo Long", "Tô Yến Nhi",
      "Đào Quốc Huy", "Hà Mai Phương", "Tăng Gia Bảo", "Nghiêm Thảo Vy",
      "Khổng Minh Quân", "Quách Hải Đăng"
    ],
    seatingConfig: { aisles: 3, rows: 5, deskType: 'double' }
  }
];

// Hàm khởi tạo và lưu cấu hình sơ đồ cho một lớp học vào LocalStorage
function generateSeatingLayoutForClass(classId, students, config = {}) {
  const aisles = config.aisles || 4;
  const rows = config.rows || Math.max(3, Math.ceil((students.length || 20) / (aisles * 2)));
  const deskType = config.deskType || 'double';
  const seatsPerDesk = deskType === 'single' ? 1 : (deskType === 'triple' ? 3 : 2);

  const deskGroups = {};
  for (let a = 1; a <= aisles; a++) {
    for (let r = 1; r <= rows; r++) {
      const deskKey = `${a}_${r}`;
      if (aisles === 4) {
        deskGroups[deskKey] = a; // Dãy 1..4 -> Tổ 1..4
      } else if (aisles === 3) {
        if (r <= Math.ceil(rows / 2)) {
          deskGroups[deskKey] = a;
        } else {
          deskGroups[deskKey] = a === 3 ? 4 : a;
        }
      } else {
        deskGroups[deskKey] = ((a - 1) % 4) + 1;
      }
    }
  }

  const seats = {};
  let studentIdx = 0;
  for (let a = 1; a <= aisles; a++) {
    for (let r = 1; r <= rows; r++) {
      for (let s = 1; s <= seatsPerDesk; s++) {
        if (studentIdx < students.length) {
          seats[`${a}_${r}_${s}`] = students[studentIdx];
          studentIdx++;
        }
      }
    }
  }

  const groupProfiles = {
    1: { name: 'Đại Bàng', mascot: '🦅', color: '#38bdf8' },
    2: { name: 'Sư Tử', mascot: '🦁', color: '#34d399' },
    3: { name: 'Cá Mập', mascot: '🦈', color: '#fbbf24' },
    4: { name: 'Rồng Vàng', mascot: '🐉', color: '#f472b6' }
  };

  const layout = {
    activePresetId: 'preset_default',
    presets: [
      {
        id: 'preset_default',
        name: 'Sơ đồ chính (Theo tổ)',
        aisles: aisles,
        rows: rows,
        deskType: deskType,
        seats: seats,
        deskGroups: deskGroups,
        groupProfiles: groupProfiles
      }
    ],
    aisles: aisles,
    rows: rows,
    deskType: deskType,
    seats: seats,
    deskGroups: deskGroups,
    groupProfiles: groupProfiles
  };

  try {
    localStorage.setItem(`vong_quay_seating_chart_v1_${classId}`, JSON.stringify(layout));
  } catch (e) {
    console.error('Lỗi khi ghi sơ đồ vào LocalStorage:', e);
  }
  return layout;
}

// --- KHÓA LƯU TRỮ TRÌNH DUYỆT (LOCALSTORAGE) ---
const STORAGE_KEY = 'vong_quay_lop_hoc_v2_store';

// --- QUẢN LÝ TRẠNG THÁI TOÀN CỤC (STATE) ---
window.state = {
  classes: [],              // Danh sách lớp: [{ id, name, students: [], called: [], callCounts: {}, history: [] }]
  currentClassId: '',       // ID của lớp đang chọn
  currentMode: 'single',    // 'single', 'pair', 'group4', 'group6'
  viewMode: 'slot',         // 'slot' hoặc 'wheel'
  noRepeat: true,           // Toggle chống trùng lặp
  isSpinning: false,        // Trạng thái đang quay
  soundEnabled: true,       // Bật/tắt âm thanh
  audioTheme: 'classic',    // 'classic', 'suspense', 'arcade'
  celebrationTheme: 'fanfare', // 'fanfare', 'applause', 'chime'
  activeTab: 'remaining',   // 'remaining', 'called', 'history'
  lastResult: [],           // Kết quả lượt quay gần nhất
  searchQuery: '',          // Từ khóa tìm kiếm
  wheelRotation: 0,         // Góc xoay hiện tại của bánh xe (radians)
  wheelStudents: null,      // Danh sách học sinh đang hiển thị trên các nan quạt của vòng quay
  wheelWinnerIdx: null      // Chỉ số của học sinh trúng thưởng để làm nổi bật nan quạt
};

// --- CÁC HÀM TRUY VẤN DỮ LIỆU LỚP VÀ HỌC SINH ---
function getCurrentClass() {
  const state = window.state;
  if (!state.classes || state.classes.length === 0) return null;
  let cls = state.classes.find(c => c.id === state.currentClassId);
  if (!cls) {
    cls = state.classes[0];
    state.currentClassId = cls.id;
  }
  if (!cls.callCounts) cls.callCounts = {};
  if (!Array.isArray(cls.history)) cls.history = [];
  return cls;
}

function getAllStudents() {
  const cls = getCurrentClass();
  return cls ? cls.students : [];
}

function getCalledStudentsSet() {
  const cls = getCurrentClass();
  return new Set(cls ? cls.called : []);
}

function getAvailableStudents() {
  const all = getAllStudents();
  if (!window.state.noRepeat) {
    return [...all];
  }
  const calledSet = getCalledStudentsSet();
  return all.filter(name => !calledSet.has(name));
}

// Lưu trạng thái vào bộ nhớ LocalStorage
function saveStateToStorage() {
  try {
    const state = window.state;
    const data = {
      classes: state.classes,
      currentClassId: state.currentClassId,
      viewMode: state.viewMode,
      currentMode: state.currentMode,
      gameMode: state.gameMode || 'classic',
      noRepeat: state.noRepeat,
      soundEnabled: state.soundEnabled,
      audioTheme: state.audioTheme || 'classic',
      celebrationTheme: state.celebrationTheme || 'fanfare'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Lỗi khi lưu LocalStorage:", e);
  }
}

// Tải trạng thái từ LocalStorage
function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.classes) && data.classes.length > 0) {
        const state = window.state;
        state.classes = data.classes.map(cls => ({
          ...cls,
          callCounts: cls.callCounts || {},
          history: Array.isArray(cls.history) ? cls.history : []
        }));
        state.currentClassId = data.currentClassId || data.classes[0].id;
        state.viewMode = data.viewMode || 'slot';
        state.currentMode = data.currentMode || 'single';
        state.gameMode = data.gameMode || 'classic';
        state.noRepeat = typeof data.noRepeat === 'boolean' ? data.noRepeat : true;
        state.soundEnabled = typeof data.soundEnabled === 'boolean' ? data.soundEnabled : true;
        state.audioTheme = data.audioTheme || 'classic';
        state.celebrationTheme = data.celebrationTheme || 'fanfare';

        // Tự động dọn dẹp và loại bỏ toàn bộ các lớp mẫu demo nếu còn tồn tại trong LocalStorage
        const sampleIds = new Set(SAMPLE_CLASSES_DEFINITIONS.map(d => d.id));
        const sampleNames = new Set(SAMPLE_CLASSES_DEFINITIONS.map(d => d.name));
        const hasSample = state.classes.some(c => sampleIds.has(c.id) || (typeof c.id === 'string' && c.id.startsWith('cls_sample_')) || sampleNames.has(c.name));

        if (hasSample) {
          state.classes.forEach(c => {
            if (sampleIds.has(c.id) || (typeof c.id === 'string' && c.id.startsWith('cls_sample_')) || sampleNames.has(c.name)) {
              try { localStorage.removeItem(`vong_quay_seating_chart_v1_${c.id}`); } catch (e) {}
            }
          });
          state.classes = state.classes.filter(c => !(sampleIds.has(c.id) || (typeof c.id === 'string' && c.id.startsWith('cls_sample_')) || sampleNames.has(c.name)));

          if (state.classes.length === 0) {
            const newId = 'cls_' + Date.now();
            state.classes.push({
              id: newId,
              name: 'Lớp 1',
              students: [],
              called: [],
              callCounts: {},
              history: []
            });
            state.currentClassId = newId;
            generateSeatingLayoutForClass(newId, [], { aisles: 4, rows: 5, deskType: 'double' });
          } else if (!state.classes.some(c => c.id === state.currentClassId)) {
            state.currentClassId = state.classes[0].id;
          }
          saveStateToStorage();
        }
        return true;
      }
    }
  } catch (e) {
    console.error("Lỗi khi đọc LocalStorage:", e);
  }
  return false;
}

// --- QUẢN LÝ ĐA LỚP HỌC (MULTI-CLASS) ---
let classModalMode = 'create'; // 'create' hoặc 'rename'
let renameTargetClassId = null;

function renderClassSelector() {
  const DOM = window.DOM;
  const state = window.state;
  if (!state || !Array.isArray(state.classes)) return;

  const headerSelector = document.getElementById('headerClassSelector');
  const seatingSelector = document.getElementById('seatingClassSelector');
  const selectors = [DOM && DOM.classSelector, headerSelector, seatingSelector].filter(Boolean);

  selectors.forEach(sel => {
    sel.innerHTML = '';
    state.classes.forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls.id;
      opt.textContent = `${cls.name} (${cls.students.length} HS)`;
      if (cls.id === state.currentClassId) opt.selected = true;
      sel.appendChild(opt);
    });
  });

  const curr = getCurrentClass();
  if (DOM && DOM.excelTargetCurrentName) {
    DOM.excelTargetCurrentName.textContent = curr ? curr.name : 'Chưa có lớp';
  }

  // Cập nhật thẻ tóm tắt dưới chân cột trái
  const navFooterName = document.getElementById('navFooterClassName');
  const navFooterCount = document.getElementById('navFooterStudentCount');
  if (navFooterName) navFooterName.textContent = curr ? curr.name : 'Chưa có lớp';
  if (navFooterCount && curr) {
    const calledSet = new Set(curr.called || []);
    const remaining = curr.students.filter(name => !calledSet.has(name)).length;
    navFooterCount.textContent = `Chờ gọi: ${remaining}/${curr.students.length}`;
  }
}

function switchClass(classId) {
  const state = window.state;
  if (state.isSpinning) return;
  state.currentClassId = classId;
  state.lastResult = [];
  state.wheelStudents = null;
  state.wheelWinnerIdx = null;
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
  const cls = getCurrentClass();
  if (typeof showToast === 'function') showToast(`Đã chuyển sang: ${cls?.name}`, 'info');
}

// Mở hộp thoại tạo lớp học mới
function openNewClassModal() {
  openCreateClassModal();
}

function openCreateClassModal() {
  classModalMode = 'create';
  renameTargetClassId = null;
  const DOM = window.DOM;
  if (DOM && DOM.classModalTitle) DOM.classModalTitle.textContent = '➕ Thêm Lớp Học Mới';
  if (DOM && DOM.classNameInput) {
    DOM.classNameInput.value = `Lớp mới ${window.state.classes.length + 1}`;
  }
  const initGroup = document.getElementById('classModalInitGroup');
  if (initGroup) initGroup.style.display = 'flex';

  const modal = document.getElementById('classModal');
  if (modal) modal.classList.add('open');
  if (DOM && DOM.classNameInput) DOM.classNameInput.focus();
}

function openRenameClassModal(targetId = null) {
  const cls = targetId ? window.state.classes.find(c => c.id === targetId) : getCurrentClass();
  if (!cls) return;
  classModalMode = 'rename';
  renameTargetClassId = cls.id;
  const DOM = window.DOM;
  if (DOM && DOM.classModalTitle) DOM.classModalTitle.textContent = `✏️ Đổi Tên: ${cls.name}`;
  if (DOM && DOM.classNameInput) DOM.classNameInput.value = cls.name;

  const initGroup = document.getElementById('classModalInitGroup');
  if (initGroup) initGroup.style.display = 'none';

  const modal = document.getElementById('classModal');
  if (modal) modal.classList.add('open');
  if (DOM && DOM.classNameInput) DOM.classNameInput.focus();
}

function saveClassModalSubmit() {
  const DOM = window.DOM;
  const state = window.state;
  const name = DOM && DOM.classNameInput ? DOM.classNameInput.value.trim() : '';
  if (!name) {
    if (typeof showToast === 'function') showToast('Tên lớp không được để trống!', 'warning');
    return;
  }

  if (classModalMode === 'create') {
    const newId = 'cls_' + Date.now();
    const initOpt = document.getElementById('classModalInitOption')?.value || 'empty';
    let students = [];

    if (initOpt === 'sample_seating') {
      students = [...SAMPLE_STUDENTS];
      generateSeatingLayoutForClass(newId, students, { aisles: 4, rows: 6, deskType: 'double' });
    } else if (initOpt === 'clone') {
      const curr = getCurrentClass();
      if (curr) {
        students = [...curr.students];
        try {
          const rawLayout = localStorage.getItem(`vong_quay_seating_chart_v1_${curr.id}`);
          if (rawLayout) localStorage.setItem(`vong_quay_seating_chart_v1_${newId}`, rawLayout);
        } catch (e) {
          console.warn(e);
        }
      }
    } else {
      // Mặc định: Lớp trống độc lập (0 học sinh)
      students = [];
      generateSeatingLayoutForClass(newId, [], { aisles: 4, rows: 5, deskType: 'double' });
    }

    const newClass = {
      id: newId,
      name: name,
      students: students,
      called: [],
      callCounts: {},
      history: []
    };
    state.classes.push(newClass);
    state.currentClassId = newId;
    if (typeof showToast === 'function') {
      const toastMsg = initOpt === 'empty' 
        ? `Đã tạo lớp "${name}" độc lập (0 học sinh)!` 
        : `Đã tạo "${name}" thành công kèm sơ đồ chỗ ngồi riêng!`;
      showToast(toastMsg, 'success');
    }
  } else {
    const cls = renameTargetClassId ? state.classes.find(c => c.id === renameTargetClassId) : getCurrentClass();
    if (cls) {
      cls.name = name;
      if (typeof showToast === 'function') showToast(`Đã đổi tên thành: ${name}!`, 'success');
    }
  }

  const modal = document.getElementById('classModal');
  if (modal) modal.classList.remove('open');
  if (state) {
    state.wheelStudents = null;
    state.wheelWinnerIdx = null;
  }
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderClassManagerModalList === 'function') renderClassManagerModalList();
  saveStateToStorage();
}

// Nạp nhanh bộ 5 lớp học mẫu có sẵn sơ đồ riêng biệt
function seedSampleClassesAction(notify = true) {
  const state = window.state;
  if (!state || !Array.isArray(state.classes)) return;

  let addedCount = 0;
  SAMPLE_CLASSES_DEFINITIONS.forEach(def => {
    let existing = state.classes.find(c => c.id === def.id || c.name === def.name || (def.id === 'cls_sample_9a4' && (c.name.includes('9A4') || c.id === 'cls_sample_9a4')));
    if (!existing) {
      existing = {
        id: def.id,
        name: def.name,
        students: [...def.students],
        called: [],
        callCounts: {},
        history: []
      };
      state.classes.push(existing);
      addedCount++;
    } else {
      // Nếu là lớp mẫu nhưng bị kẹt ở dữ liệu cũ (ví dụ 38 học sinh thay vì 45 học sinh)
      if (!existing.students || existing.students.length <= 38 || def.id === 'cls_sample_9a4') {
        existing.name = def.name;
        existing.students = [...def.students];
        existing.called = [];
        existing.callCounts = {};
        existing.history = [];
        const key = `vong_quay_seating_chart_v1_${existing.id}`;
        localStorage.removeItem(key);
      }
    }

    const key = `vong_quay_seating_chart_v1_${existing.id}`;
    if (!localStorage.getItem(key)) {
      generateSeatingLayoutForClass(existing.id, existing.students, def.seatingConfig);
    }
  });

  saveStateToStorage();
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderClassManagerModalList === 'function') renderClassManagerModalList();

  if (notify && typeof showToast === 'function') {
    showToast(`✅ Đã nạp thành công 5 lớp học mẫu kèm sơ đồ chỗ ngồi riêng biệt!`, 'success');
  }
}

// Xóa toàn bộ các lớp mẫu (9A4, 9A1, 8A2, 7A3, 6A5) khỏi hệ thống
function deleteSampleClasses(notify = true) {
  const state = window.state;
  if (!state || !Array.isArray(state.classes)) return;

  const sampleIds = new Set(SAMPLE_CLASSES_DEFINITIONS.map(d => d.id));
  const sampleNames = new Set(SAMPLE_CLASSES_DEFINITIONS.map(d => d.name));

  const sampleClasses = state.classes.filter(c => sampleIds.has(c.id) || (typeof c.id === 'string' && c.id.startsWith('cls_sample_')) || sampleNames.has(c.name));

  if (sampleClasses.length === 0) {
    if (notify && typeof showToast === 'function') {
      showToast('Hiện tại không có lớp mẫu nào để xóa!', 'info');
    }
    return;
  }

  if (notify && !confirm(`Thầy có chắc chắn muốn xóa sạch toàn bộ ${sampleClasses.length} lớp mẫu demo không?`)) {
    return;
  }

  sampleClasses.forEach(c => {
    try {
      localStorage.removeItem(`vong_quay_seating_chart_v1_${c.id}`);
    } catch (e) {
      console.warn(e);
    }
  });

  state.classes = state.classes.filter(c => !(sampleIds.has(c.id) || (typeof c.id === 'string' && c.id.startsWith('cls_sample_')) || sampleNames.has(c.name)));

  if (state.classes.length === 0) {
    const newId = 'cls_' + Date.now();
    state.classes.push({
      id: newId,
      name: 'Lớp 1',
      students: [],
      called: [],
      callCounts: {},
      history: []
    });
    state.currentClassId = newId;
    generateSeatingLayoutForClass(newId, [], { aisles: 4, rows: 5, deskType: 'double' });
  } else if (!state.classes.some(c => c.id === state.currentClassId)) {
    state.currentClassId = state.classes[0].id;
  }

  state.wheelStudents = null;
  state.wheelWinnerIdx = null;
  state.lastResult = [];
  saveStateToStorage();
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  if (typeof renderClassManagerModalList === 'function') renderClassManagerModalList();

  if (notify && typeof showToast === 'function') {
    showToast(`🗑️ Đã xóa sạch toàn bộ ${sampleClasses.length} lớp mẫu!`, 'success');
  }
}

// --- MODAL QUẢN LÝ LỚP HỌC & ĐA SƠ ĐỒ ---
function openClassManagerModal() {
  const modal = document.getElementById('classManagerModal');
  if (!modal) return;
  renderClassManagerModalList();
  modal.classList.add('open');
}

function closeClassManagerModal() {
  const modal = document.getElementById('classManagerModal');
  if (modal) modal.classList.remove('open');
}

function renderClassManagerModalList() {
  const container = document.getElementById('managerClassesList');
  const countEl = document.getElementById('managerClassCount');
  if (!container) return;

  const state = window.state;
  if (!state || !Array.isArray(state.classes)) return;

  if (countEl) countEl.textContent = state.classes.length;
  container.innerHTML = '';

  state.classes.forEach(cls => {
    const isCurrent = cls.id === state.currentClassId;
    const card = document.createElement('div');
    card.className = `manager-class-item ${isCurrent ? 'current-active' : ''}`;

    let seatingInfo = 'Chưa có sơ đồ';
    try {
      const rawSeating = localStorage.getItem(`vong_quay_seating_chart_v1_${cls.id}`);
      if (rawSeating) {
        const parsed = JSON.parse(rawSeating);
        const aisles = parsed.aisles || 4;
        const rows = parsed.rows || 5;
        const deskType = parsed.deskType === 'single' ? 'Bàn đơn' : (parsed.deskType === 'triple' ? 'Bàn 3' : 'Bàn đôi');
        const seatedCount = parsed.seats ? Object.values(parsed.seats).filter(Boolean).length : 0;
        seatingInfo = `Sơ đồ: ${aisles} Dãy x ${rows} Hàng (${deskType}) • Đã xếp: ${seatedCount} chỗ`;
      }
    } catch (e) {
      console.warn(e);
    }

    card.innerHTML = `
      <div class="manager-class-left">
        <div class="manager-class-icon">${isCurrent ? '🌟' : '🏫'}</div>
        <div class="manager-class-meta">
          <div class="manager-class-title-row">
            <span class="manager-class-name">${cls.name}</span>
            ${isCurrent ? '<span class="manager-active-badge">ĐANG CHỌN</span>' : ''}
          </div>
          <div class="manager-class-subinfo">
            <span class="manager-class-badge-pill">👥 ${cls.students.length} học sinh</span>
            <span>${seatingInfo}</span>
          </div>
        </div>
      </div>
      <div class="manager-class-actions">
        ${!isCurrent ? `<button class="btn-manager-action btn-select-current" onclick="selectClassFromManager('${cls.id}')" title="Chuyển sang dùng lớp này">👉 Chọn lớp</button>` : `<span style="font-size:0.8rem; font-weight:700; color:#16a34a; padding: 0 6px;">✓ Đang hoạt động</span>`}
        <button class="btn-manager-action" onclick="openRenameClassModal('${cls.id}')" title="Đổi tên lớp học">✏️ Đổi tên</button>
        <button class="btn-manager-action" onclick="cloneClassFromManager('${cls.id}')" title="Nhân bản lớp kèm sơ đồ">📋 Nhân bản</button>
        ${state.classes.length > 1 ? `<button class="btn-manager-action btn-danger-class" onclick="deleteClassFromManager('${cls.id}')" title="Xóa lớp học này">🗑️ Xóa</button>` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

function selectClassFromManager(classId) {
  switchClass(classId);
  renderClassManagerModalList();
}

function cloneClassFromManager(classId) {
  const state = window.state;
  const target = state.classes.find(c => c.id === classId);
  if (!target) return;

  const newId = 'cls_' + Date.now();
  const newName = `${target.name} (Bản sao)`;
  const newClass = {
    id: newId,
    name: newName,
    students: [...target.students],
    called: [],
    callCounts: {},
    history: []
  };

  // Sao chép sơ đồ
  try {
    const raw = localStorage.getItem(`vong_quay_seating_chart_v1_${target.id}`);
    if (raw) localStorage.setItem(`vong_quay_seating_chart_v1_${newId}`, raw);
  } catch (e) {
    console.warn(e);
  }

  state.classes.push(newClass);
  state.currentClassId = newId;
  saveStateToStorage();
  updateUI();
  renderClassManagerModalList();
  if (typeof showToast === 'function') {
    showToast(`📋 Đã nhân bản lớp "${newName}" thành công!`, 'success');
  }
}

function deleteClassFromManager(classId) {
  const state = window.state;
  if (state.classes.length <= 1) {
    if (typeof showToast === 'function') showToast('Không thể xóa! Cần giữ lại ít nhất 1 lớp học.', 'warning');
    return;
  }
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return;

  if (!confirm(`Thầy có chắc chắn muốn xóa lớp "${cls.name}" (${cls.students.length} học sinh) không?`)) {
    return;
  }

  state.classes = state.classes.filter(c => c.id !== classId);
  if (state.currentClassId === classId) {
    state.currentClassId = state.classes[0].id;
  }

  saveStateToStorage();
  updateUI();
  renderClassManagerModalList();
  if (typeof showToast === 'function') showToast(`Đã xóa lớp "${cls.name}"!`, 'info');
}

function submitCreateNewClassFromManager() {
  const nameInput = document.getElementById('managerNewClassName');
  const optSelect = document.getElementById('managerNewClassOption');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập tên lớp học!', 'warning');
    return;
  }

  const newId = 'cls_' + Date.now();
  const initOpt = optSelect ? optSelect.value : 'empty';
  let students = [];

  if (initOpt === 'sample_seating') {
    students = [...SAMPLE_STUDENTS];
    generateSeatingLayoutForClass(newId, students, { aisles: 4, rows: 6, deskType: 'double' });
  } else if (initOpt === 'clone') {
    const curr = getCurrentClass();
    if (curr) {
      students = [...curr.students];
      try {
        const raw = localStorage.getItem(`vong_quay_seating_chart_v1_${curr.id}`);
        if (raw) localStorage.setItem(`vong_quay_seating_chart_v1_${newId}`, raw);
      } catch (e) {
        console.warn(e);
      }
    }
  } else {
    // Mặc định: Lớp trống độc lập (0 học sinh)
    students = [];
    generateSeatingLayoutForClass(newId, [], { aisles: 4, rows: 5, deskType: 'double' });
  }

  const newClass = {
    id: newId,
    name: name,
    students: students,
    called: [],
    callCounts: {},
    history: []
  };

  window.state.classes.push(newClass);
  window.state.currentClassId = newId;

  if (nameInput) nameInput.value = '';
  saveStateToStorage();
  updateUI();
  renderClassManagerModalList();

  if (typeof showToast === 'function') {
    const toastMsg = initOpt === 'empty'
      ? `➕ Đã tạo thành công lớp "${name}" độc lập (0 học sinh)!`
      : `➕ Đã tạo thành công lớp "${name}"!`;
    showToast(toastMsg, 'success');
  }
}

function deleteCurrentClass() {
  const state = window.state;
  if (state.classes.length <= 1) {
    if (typeof showToast === 'function') showToast('Không thể xóa! Cần giữ lại ít nhất 1 lớp học.', 'warning');
    return;
  }
  const cls = getCurrentClass();
  if (!cls) return;
  if (!confirm(`Thầy có chắc chắn muốn xóa lớp "${cls.name}" (${cls.students.length} học sinh) không?`)) {
    return;
  }
  state.classes = state.classes.filter(c => c.id !== cls.id);
  state.currentClassId = state.classes[0].id;
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
  if (typeof showToast === 'function') showToast(`Đã xóa lớp "${cls.name}"!`, 'info');
}

// Xóa 1 học sinh khỏi lớp
function removeStudent(name) {
  const cls = getCurrentClass();
  if (!cls) return;
  cls.students = cls.students.filter(s => s !== name);
  cls.called = cls.called.filter(s => s !== name);
  if (cls.callCounts) delete cls.callCounts[name];
  if (window.state) {
    window.state.wheelStudents = null;
    window.state.wheelWinnerIdx = null;
  }
  if (typeof updateUI === 'function') updateUI();
  if (window.state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
  if (typeof showToast === 'function') showToast(`Đã xóa học sinh "${name}"!`, 'info');
}

// Làm mới danh sách đã gọi (Tách biệt độc lập: Giữ nguyên số lần gọi và lịch sử)
function resetCalledList(notify = true) {
  const cls = getCurrentClass();
  if (!cls) return;
  cls.called = [];
  window.state.lastResult = [];
  if (window.state) {
    window.state.wheelStudents = null;
    window.state.wheelWinnerIdx = null;
  }
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (window.state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  if (window.SeatingChartModule && typeof window.SeatingChartModule.render === 'function') {
    window.SeatingChartModule.render();
  }
  saveStateToStorage();
  if (notify && typeof showToast === 'function') {
    showToast(`Đã làm mới lượt gọi cho lớp "${cls.name}"!`, 'success');
  }
}

// Lấy số lần một học sinh đã được gọi trong lớp hiện tại
function getStudentCallCount(name) {
  const cls = getCurrentClass();
  if (!cls || !cls.callCounts) return 0;
  return cls.callCounts[name] || 0;
}

// Ghi nhận một lượt gọi học sinh kèm lịch sử và phần thưởng (nếu có)
function recordStudentCall(name, bonusReward = null) {
  const cls = getCurrentClass();
  if (!cls) return;
  if (!cls.callCounts) cls.callCounts = {};
  if (!Array.isArray(cls.history)) cls.history = [];

  cls.callCounts[name] = (cls.callCounts[name] || 0) + 1;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  cls.history.unshift({
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    name: name,
    time: timeStr,
    bonusReward: bonusReward
  });

  // Lưu trữ tối đa 100 sự kiện gần nhất
  if (cls.history.length > 100) cls.history.pop();
}

// Cập nhật phần thưởng vào lượt gọi gần nhất của học sinh
function updateStudentLastReward(name, rewardText) {
  const cls = getCurrentClass();
  if (!cls || !cls.history || cls.history.length === 0) return;
  const target = cls.history.find(h => h.name === name);
  if (target) {
    target.bonusReward = rewardText;
    saveStateToStorage();
    if (typeof updateUI === 'function') updateUI();
  }
}

// Đặt lại toàn bộ bộ đếm số lần gọi và lịch sử của lớp hiện tại
function resetCallCounts(notify = true) {
  const cls = getCurrentClass();
  if (!cls) return;
  cls.callCounts = {};
  cls.history = [];
  saveStateToStorage();
  if (typeof updateUI === 'function') updateUI();
  if (notify && typeof showToast === 'function') {
    showToast(`Đã đặt lại số lần gọi của lớp "${cls.name}" về 0!`, 'info');
  }
}

// Tải file Excel mẫu chuẩn hóa (.xlsx)
function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    if (typeof showToast === 'function') showToast('Thư viện Excel đang tải, vui lòng thử lại sau giây lát!', 'warning');
    return;
  }
  const sampleData = [
    ["STT", "Họ và Tên", "Ghi chú"],
    [1, "Nguyễn An Khang", "Tổ 1"],
    [2, "Trần Bảo Ngọc", "Tổ 1"],
    [3, "Lê Minh Triết", "Tổ 2"],
    [4, "Phạm Quỳnh Anh", "Tổ 2"],
    [5, "Hoàng Đức Anh", "Tổ 3"],
    [6, "Vũ Thảo Vy", "Tổ 3"],
    [7, "Đặng Tuấn Kiệt", "Tổ 4"],
    [8, "Bùi Khánh Linh", "Tổ 4"],
    [9, "Đỗ Gia Hưng", "Lớp phó"],
    [10, "Hồ Yến Nhi", "Lớp trưởng"]
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
  XLSX.writeFile(wb, "mau-danh-sach-hoc-sinh.xlsx");
  if (typeof showToast === 'function') {
    showToast('📥 Đã tải xuống file mẫu "mau-danh-sach-hoc-sinh.xlsx"!', 'success');
  }
}

// Báo vắng mặt cho các bạn vừa được gọi
function returnAbsentStudents() {
  const state = window.state;
  const cls = getCurrentClass();
  if (!cls || state.lastResult.length === 0) return;
  const lastSet = new Set(state.lastResult);
  cls.called = cls.called.filter(name => !lastSet.has(name));
  state.lastResult = [];
  state.wheelStudents = null;
  state.wheelWinnerIdx = null;
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
  if (typeof showToast === 'function') showToast('Đã chuyển học sinh vắng mặt về danh sách chờ gọi!', 'info');
}

// Nạp danh sách học sinh mới vào lớp
function setNewStudentList(names, targetMode = 'current', customClassName = '') {
  const state = window.state;
  const uniqueNames = Array.from(new Set(names.map(n => String(n).trim()).filter(Boolean)));
  if (uniqueNames.length === 0) return;

  if (targetMode === 'new') {
    const newId = 'cls_' + Date.now();
    const newName = (customClassName && customClassName.trim()) || `Lớp mới ${state.classes.length + 1}`;
    const newClass = {
      id: newId,
      name: newName,
      students: uniqueNames,
      called: [],
      callCounts: {},
      history: []
    };
    state.classes.push(newClass);
    state.currentClassId = newId;
  } else {
    let cls = getCurrentClass();
    if (!cls) {
      const newId = 'cls_' + Date.now();
      cls = {
        id: newId,
        name: 'Lớp 1',
        students: [],
        called: [],
        callCounts: {},
        history: []
      };
      state.classes.push(cls);
      state.currentClassId = newId;
    }
    cls.students = uniqueNames;
    cls.called = [];
  }

  state.lastResult = [];
  state.wheelStudents = null;
  state.wheelWinnerIdx = null;
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
}

// --- QUẢN LÝ ĐỌC & NHẬN DIỆN FILE EXCEL (SHEETJS) ---
const excelSession = {
  workbook: null,
  fileName: '',
  suggestedClassName: '',
  currentSheet: '',
  sheetRows: [],
  startRow: 0,
  endRow: 0
};

const EXCLUDE_KEYWORDS = [
  'tổng số', 'tong so', 'sĩ số', 'si so', 'nam', 'nữ', 'nu',
  'ngày sinh', 'ngay sinh', 'nơi sinh', 'noi sinh', 'dân tộc', 'dan toc',
  'chữ ký', 'chu ky', 'kí tên', 'ki ten', 'ghi chú', 'ghi chu',
  'giáo viên', 'giao vien', 'chủ nhiệm', 'chu nhiem', 'hiệu trưởng', 'hieu truong',
  'bảng điểm', 'bang diem', 'danh sách', 'danh sach', 'lớp', 'lop', 'trường', 'truong'
];

function isExcludeRow(text) {
  const t = text.toLowerCase().trim();
  return EXCLUDE_KEYWORDS.some(kw => t === kw || t.includes(kw));
}

function getColLetter(colIdx) {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function handleExcelFile(file) {
  if (typeof XLSX === 'undefined') {
    if (typeof showToast === 'function') showToast('Thư viện Excel (SheetJS) chưa tải xong, vui lòng thử lại!', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        if (typeof showToast === 'function') showToast('File Excel không có trang tính (Sheet) nào!', 'warning');
        return;
      }

      excelSession.workbook = workbook;
      excelSession.fileName = file.name;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_]+/g, ' ').trim();
      excelSession.suggestedClassName = cleanName;

      const DOM = window.DOM;
      if (DOM.excelFileName) DOM.excelFileName.textContent = file.name;
      if (DOM.excelTargetNewName) DOM.excelTargetNewName.textContent = cleanName;

      if (DOM.excelSheetSelect) {
        DOM.excelSheetSelect.innerHTML = '';
        workbook.SheetNames.forEach(sName => {
          const opt = document.createElement('option');
          opt.value = sName;
          opt.textContent = sName;
          DOM.excelSheetSelect.appendChild(opt);
        });

        if (workbook.SheetNames.length <= 1) {
          DOM.excelSheetField.style.display = 'none';
        } else {
          DOM.excelSheetField.style.display = 'block';
        }
      }

      const firstSheet = workbook.SheetNames[0];
      loadSheetData(firstSheet);
      if (DOM.excelPreviewModal) DOM.excelPreviewModal.classList.add('open');
    } catch (err) {
      console.error("Lỗi đọc Excel:", err);
      if (typeof showToast === 'function') showToast('Không thể đọc file Excel này! Vui lòng kiểm tra định dạng.', 'warning');
    }
  };
  reader.readAsArrayBuffer(file);
}

function loadSheetData(sheetName) {
  excelSession.currentSheet = sheetName;
  const worksheet = excelSession.workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  excelSession.sheetRows = rows;

  if (excelSession.sheetRows.length === 0) {
    if (typeof showToast === 'function') showToast('Trang tính được chọn trống!', 'warning');
    return;
  }

  const detected = smartDetectColumnsAndRange(excelSession.sheetRows);
  excelSession.startRow = detected.startRow;
  excelSession.endRow = detected.endRow;

  populateColumnSelects(detected.hoCol, detected.tenCol);
  renderExcelPreviewTable();
}

function smartDetectColumnsAndRange(rows) {
  const maxCols = Math.max(...rows.map(r => r.length), 0);
  let sttCol = -1;
  let startRow = -1;
  let endRow = rows.length - 1;

  for (let c = 0; c < Math.min(maxCols, 5); c++) {
    let consecutive = 0;
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const val = Number(rows[r][c]);
      if (val === 1) {
        let run = 1;
        for (let nextR = r + 1; nextR < Math.min(rows.length, r + 10); nextR++) {
          const nextVal = Number(rows[nextR][c]);
          if (nextVal === consecutive + 1 || nextVal === run + 1) {
            run++;
          }
        }
        if (run >= 3) {
          sttCol = c;
          startRow = r;
          consecutive = run;
          break;
        }
      }
    }
    if (sttCol !== -1) break;
  }

  if (sttCol === -1) {
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const rowStr = rows[r].map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('họ và tên') || rowStr.includes('họ tên') || rowStr.includes('ho va ten')) {
        startRow = r + 1;
        break;
      }
    }
  }

  if (startRow === -1) startRow = 1;

  for (let r = rows.length - 1; r >= startRow; r--) {
    const rowStr = rows[r].map(c => String(c).toLowerCase()).join(' ');
    if (isExcludeRow(rowStr)) {
      endRow = r - 1;
    } else {
      const hasContent = rows[r].some(c => String(c).trim().length > 0);
      if (hasContent) {
        endRow = r;
        break;
      }
    }
  }

  const studentRows = rows.slice(startRow, endRow + 1);
  let hoCol = -1;
  let tenCol = -1;
  const textStats = [];

  for (let c = 0; c < maxCols; c++) {
    if (c === sttCol) continue;
    let wordSum = 0;
    let validCount = 0;

    for (let r = 0; r < studentRows.length; r++) {
      const cell = String(studentRows[r][c] || '').trim();
      if (cell && !isExcludeRow(cell) && isNaN(cell)) {
        const words = cell.split(/\s+/).filter(Boolean);
        wordSum += words.length;
        validCount++;
      }
    }

    const avgWords = validCount > 0 ? wordSum / validCount : 0;
    if (validCount >= Math.max(3, studentRows.length * 0.25)) {
      textStats.push({ col: c, avgWords, validCount });
    }
  }

  textStats.sort((a, b) => b.validCount - a.validCount);
  const hoCandidates = textStats.filter(s => s.avgWords >= 1.3);
  const tenCandidates = textStats.filter(s => s.avgWords >= 0.8 && s.avgWords <= 1.5);

  if (hoCandidates.length > 0) {
    const h = hoCandidates[0];
    const matchingTen = tenCandidates.find(t => t.col === h.col + 1 || t.col === h.col + 2);
    if (matchingTen) {
      hoCol = h.col;
      tenCol = matchingTen.col;
    } else {
      hoCol = h.col;
      tenCol = -1;
    }
  }

  if (hoCol === -1 && textStats.length >= 2) {
    hoCol = textStats[0].col;
    tenCol = textStats[1].col;
  } else if (hoCol === -1 && textStats.length === 1) {
    hoCol = textStats[0].col;
  }

  return { sttCol, startRow, endRow, hoCol, tenCol };
}

function populateColumnSelects(selectedHo, selectedTen) {
  const DOM = window.DOM;
  const rows = excelSession.sheetRows;
  const maxCols = Math.max(...rows.map(r => r.length), 0);
  const sRow = excelSession.startRow;

  if (!DOM.excelHoColSelect || !DOM.excelTenColSelect) return;
  DOM.excelHoColSelect.innerHTML = '';
  DOM.excelTenColSelect.innerHTML = '<option value="-1">-- Không dùng cột này --</option>';

  for (let c = 0; c < maxCols; c++) {
    const letter = getColLetter(c);
    const sample1 = String(rows[sRow]?.[c] || '').trim();
    const sample2 = String(rows[sRow + 1]?.[c] || '').trim();
    const sampleText = [sample1, sample2].filter(Boolean).join(', ');
    const label = `Cột ${letter}${sampleText ? `: "${sampleText.slice(0, 22)}${sampleText.length > 22 ? '...' : ''}"` : ''}`;

    const optHo = document.createElement('option');
    optHo.value = c;
    optHo.textContent = label;
    if (c === selectedHo) optHo.selected = true;
    DOM.excelHoColSelect.appendChild(optHo);

    const optTen = document.createElement('option');
    optTen.value = c;
    optTen.textContent = label;
    if (c === selectedTen) optTen.selected = true;
    DOM.excelTenColSelect.appendChild(optTen);
  }
}

function renderExcelPreviewTable() {
  const DOM = window.DOM;
  if (!DOM.excelHoColSelect || !DOM.excelTenColSelect) return;
  const hoCol = parseInt(DOM.excelHoColSelect.value, 10);
  const tenCol = parseInt(DOM.excelTenColSelect.value, 10);
  const rows = excelSession.sheetRows;

  const students = [];
  const sRow = excelSession.startRow;
  const eRow = excelSession.endRow;

  for (let r = sRow; r <= eRow; r++) {
    if (!rows[r]) continue;
    const hoStr = hoCol >= 0 ? String(rows[r][hoCol] || '').trim() : '';
    const tenStr = tenCol >= 0 ? String(rows[r][tenCol] || '').trim() : '';

    let fullName = '';
    if (hoStr && tenStr) {
      fullName = `${hoStr} ${tenStr}`.trim();
    } else {
      fullName = (hoStr || tenStr).trim();
    }

    if (fullName && !isExcludeRow(fullName) && isNaN(fullName)) {
      students.push(fullName);
    }
  }

  excelSession.parsedStudents = students;

  if (DOM.excelPreviewCountBadge) {
    DOM.excelPreviewCountBadge.textContent = `Tìm thấy ${students.length} học sinh`;
  }

  if (DOM.excelPreviewTableBody) {
    DOM.excelPreviewTableBody.innerHTML = '';
    if (students.length === 0) {
      DOM.excelPreviewTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #ef4444; padding: 20px;">Không tìm thấy học sinh nào với cấu hình cột hiện tại!</td></tr>';
      return;
    }

    const previewLimit = Math.min(students.length, 100);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < previewLimit; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td><b>${students[i]}</b></td>`;
      fragment.appendChild(tr);
    }
    DOM.excelPreviewTableBody.appendChild(fragment);
  }
}

// ==============================================================================
// TÍNH NĂNG SAO LƯU & KHÔI PHỤC DỮ LIỆU DỰ PHÒNG (BACKUP / RESTORE JSON)
// ==============================================================================

let pendingBackupData = null; // Dữ liệu sao lưu đang chờ xác nhận khôi phục

/**
 * Xuất toàn bộ dữ liệu ra file JSON cấu hình nhỏ gọn tải về máy
 */
function exportBackupData() {
  const state = window.state;
  if (!state.classes || state.classes.length === 0) {
    if (typeof showToast === 'function') showToast('Không có dữ liệu lớp học nào để sao lưu!', 'warning');
    return;
  }

  const totalStudents = state.classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const backupPayload = {
    appName: "VongQuayLopHoc",
    appVersion: "2.0",
    exportDate: now.toISOString(),
    totalClasses: state.classes.length,
    totalStudents: totalStudents,
    currentClassId: state.currentClassId,
    settings: {
      viewMode: state.viewMode,
      currentMode: state.currentMode,
      noRepeat: state.noRepeat,
      soundEnabled: state.soundEnabled
    },
    classes: state.classes
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `sao-luu-lop-hoc-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast(`💾 Đã sao lưu thành công ${state.classes.length} lớp học (${totalStudents} HS) vào tệp JSON!`, 'success');
  }
}

/**
 * Xử lý khi người dùng chọn file JSON sao lưu
 */
function handleBackupFileInput(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      // Kiểm tra tính toàn vẹn dữ liệu
      let backupClasses = null;
      if (Array.isArray(parsed.classes)) {
        backupClasses = parsed.classes;
      } else if (Array.isArray(parsed)) {
        backupClasses = parsed;
      }

      if (!backupClasses || backupClasses.length === 0) {
        if (typeof showToast === 'function') {
          showToast('Tệp sao lưu không hợp lệ hoặc không có danh sách lớp!', 'warning');
        }
        return;
      }

      // Lưu trữ dữ liệu chờ khôi phục
      pendingBackupData = {
        classes: backupClasses,
        currentClassId: parsed.currentClassId || backupClasses[0].id,
        settings: parsed.settings || {},
        fileName: file.name
      };

      // Mở modal lựa chọn phương thức khôi phục (Hợp nhất vs Ghi đè)
      openBackupRestoreModal();

    } catch (err) {
      console.error("Lỗi đọc file JSON:", err);
      if (typeof showToast === 'function') {
        showToast('Không thể đọc file JSON! Tệp có thể bị lỗi định dạng.', 'warning');
      }
    }
  };

  reader.readAsText(file, 'utf-8');
}

/**
 * Mở modal hỏi người dùng chọn Hợp nhất hoặc Ghi đè
 */
function openBackupRestoreModal() {
  if (!pendingBackupData) return;
  const DOM = window.DOM;
  const modal = document.getElementById('backupRestoreModal');
  if (!modal) return;

  const totalNewStudents = pendingBackupData.classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const currentTotalClasses = window.state.classes.length;

  const fileNameEl = document.getElementById('backupFileName');
  const summaryEl = document.getElementById('backupSummaryDetail');

  if (fileNameEl) fileNameEl.textContent = pendingBackupData.fileName;
  if (summaryEl) {
    summaryEl.innerHTML = `
      • Tệp sao lưu gồm: <b>${pendingBackupData.classes.length} lớp học</b> (${totalNewStudents} học sinh).<br>
      • Dữ liệu hiện tại trên máy: <b>${currentTotalClasses} lớp học</b>.<br>
      • Hãy chọn một trong hai phương thức khôi phục bên dưới:
    `;
  }

  modal.classList.add('open');
}

/**
 * Đóng modal khôi phục
 */
function closeBackupRestoreModal() {
  const modal = document.getElementById('backupRestoreModal');
  if (modal) modal.classList.remove('open');
  pendingBackupData = null;
  const input = document.getElementById('backupFileInput');
  if (input) input.value = '';
}

/**
 * Thực thi khôi phục theo lựa chọn của người dùng (Merge hoặc Overwrite)
 */
function executeRestore(mode) {
  if (!pendingBackupData || !pendingBackupData.classes) return;

  const state = window.state;
  const newClasses = pendingBackupData.classes;

  if (mode === 'overwrite') {
    // 1. Ghi đè hoàn toàn: Thay thế toàn bộ lớp hiện có bằng lớp trong file sao lưu
    state.classes = newClasses;
    state.currentClassId = pendingBackupData.currentClassId || newClasses[0].id;

    if (pendingBackupData.settings) {
      if (pendingBackupData.settings.viewMode) state.viewMode = pendingBackupData.settings.viewMode;
      if (pendingBackupData.settings.currentMode) state.currentMode = pendingBackupData.settings.currentMode;
      if (typeof pendingBackupData.settings.noRepeat === 'boolean') state.noRepeat = pendingBackupData.settings.noRepeat;
      if (typeof pendingBackupData.settings.soundEnabled === 'boolean') state.soundEnabled = pendingBackupData.settings.soundEnabled;
    }

    if (typeof showToast === 'function') {
      showToast(`✅ Đã ghi đè toàn bộ: Khôi phục thành công ${newClasses.length} lớp học!`, 'success');
    }
  } else if (mode === 'merge') {
    // 2. Hợp nhất: Giữ nguyên lớp hiện tại, gộp thêm các lớp trong file sao lưu
    const existingIds = new Set(state.classes.map(c => c.id));
    const existingNames = new Set(state.classes.map(c => c.name.toLowerCase()));
    let addedCount = 0;

    newClasses.forEach(cls => {
      let finalId = cls.id;
      if (existingIds.has(finalId)) {
        finalId = 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
      existingIds.add(finalId);

      let finalName = cls.name;
      if (existingNames.has(finalName.toLowerCase())) {
        finalName = `${cls.name} (Sao lưu)`;
      }
      existingNames.add(finalName.toLowerCase());

      state.classes.push({
        id: finalId,
        name: finalName,
        students: Array.isArray(cls.students) ? [...cls.students] : [],
        called: Array.isArray(cls.called) ? [...cls.called] : []
      });
      addedCount++;
    });

    if (typeof showToast === 'function') {
      showToast(`✅ Đã hợp nhất: Thêm mới ${addedCount} lớp vào danh sách hiện tại!`, 'success');
    }
  }

  closeBackupRestoreModal();

  if (typeof updateUI === 'function') updateUI();
  if (typeof renderDefaultStage === 'function') renderDefaultStage();
  if (state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') drawLuckyWheel();
  saveStateToStorage();
}

// Gắn các hàm quan trọng vào phạm vi toàn cục (window)
window.SAMPLE_STUDENTS = SAMPLE_STUDENTS;
window.STORAGE_KEY = STORAGE_KEY;
window.getCurrentClass = getCurrentClass;
window.getAllStudents = getAllStudents;
window.getCalledStudentsSet = getCalledStudentsSet;
window.getAvailableStudents = getAvailableStudents;
window.saveStateToStorage = saveStateToStorage;
window.loadStateFromStorage = loadStateFromStorage;
window.renderClassSelector = renderClassSelector;
window.switchClass = switchClass;
window.openCreateClassModal = openCreateClassModal;
window.openRenameClassModal = openRenameClassModal;
window.saveClassModalSubmit = saveClassModalSubmit;
window.deleteCurrentClass = deleteCurrentClass;
window.removeStudent = removeStudent;
window.resetCalledList = resetCalledList;
window.returnAbsentStudents = returnAbsentStudents;
window.setNewStudentList = setNewStudentList;
window.handleExcelFile = handleExcelFile;
window.loadSheetData = loadSheetData;
window.exportBackupData = exportBackupData;
window.handleBackupFileInput = handleBackupFileInput;
window.executeRestore = executeRestore;
window.closeBackupRestoreModal = closeBackupRestoreModal;
window.downloadExcelTemplate = downloadExcelTemplate;
window.getStudentCallCount = getStudentCallCount;
window.recordStudentCall = recordStudentCall;
window.updateStudentLastReward = updateStudentLastReward;
window.resetCallCounts = resetCallCounts;
window.openNewClassModal = openNewClassModal;
window.seedSampleClassesAction = seedSampleClassesAction;
window.openClassManagerModal = openClassManagerModal;
window.closeClassManagerModal = closeClassManagerModal;
window.renderClassManagerModalList = renderClassManagerModalList;
window.selectClassFromManager = selectClassFromManager;
window.cloneClassFromManager = cloneClassFromManager;
window.deleteClassFromManager = deleteClassFromManager;
window.submitCreateNewClassFromManager = submitCreateNewClassFromManager;
window.generateSeatingLayoutForClass = generateSeatingLayoutForClass;
window.SAMPLE_CLASSES_DEFINITIONS = SAMPLE_CLASSES_DEFINITIONS;
window.deleteSampleClasses = deleteSampleClasses;

