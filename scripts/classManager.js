/**
 * classManager.js - Quản Lý Lớp Học & Nhập Danh Sách Học Sinh Thật
 * Hỗ trợ tạo lớp với danh sách thật (Dán văn bản, tải file Excel)
 * và chỉnh sửa danh sách học sinh cho từng lớp học.
 */

// Biến lưu trữ tạm thời khi đang chỉnh sửa danh sách học sinh của một lớp
let currentEditorClassId = null;
let currentEditorStudents = [];

/**
 * Hàm làm sạch và chuẩn hóa danh sách họ tên tiếng Việt từ văn bản dán vào
 * Hỗ trợ lọc bỏ số thứ tự, gạch đầu dòng, dấu chấm, khoảng trắng thừa
 */
function cleanStudentNameList(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/);
  const result = [];
  const seen = new Set();

  for (let line of lines) {
    let text = line.trim();
    if (!text) continue;

    const lower = text.toLowerCase();
    // Bỏ qua các dòng tiêu đề bảng tính phổ biến
    if (
      lower.startsWith('họ và tên') ||
      lower.startsWith('danh sách') ||
      lower.startsWith('stt') ||
      lower === 'nam' || lower === 'nữ' || lower === 'nu' ||
      lower.startsWith('tổng số') ||
      lower.startsWith('sĩ số') ||
      lower.startsWith('ghi chú')
    ) {
      continue;
    }

    // Xóa số thứ tự ở đầu dòng (ví dụ: "1. ", "01. ", "1/ ", "1) ", "1 - ", "1	")
    text = text.replace(/^(stt\s*[:.-]?\s*)?\d+[\s./\-)–—:]+\s*/i, '');
    text = text.replace(/^[-•*+]\s*/, ''); // Bỏ gạch đầu dòng
    text = text.replace(/\t+/g, ' ');      // Thay thế tab bằng khoảng cách
    text = text.replace(/\s+/g, ' ').trim(); // Chuẩn hóa khoảng trắng

    // Bỏ qua nếu sau khi lọc chỉ còn là số hoặc quá ngắn
    if (!text || !isNaN(text) || text.length < 2) continue;

    // Tránh trùng lặp trong cùng một lần nạp
    if (!seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      result.push(text);
    }
  }

  return result;
}

/**
 * Trích xuất danh sách học sinh từ file Excel (.xlsx, .xls)
 */
function extractStudentsFromExcelFile(file, callback) {
  if (typeof XLSX === 'undefined') {
    if (typeof showToast === 'function') {
      showToast('Thư viện Excel (SheetJS) chưa tải xong, vui lòng thử lại sau giây lát!', 'warning');
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        if (typeof showToast === 'function') showToast('File Excel không có trang tính nào!', 'warning');
        return;
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
      if (!rows || rows.length === 0) {
        if (typeof showToast === 'function') showToast('File Excel không có dữ liệu!', 'warning');
        return;
      }

      // Nhận diện cột Họ và Tên
      let hoCol = -1;
      let tenCol = -1;
      let startRow = 0;
      let endRow = rows.length - 1;

      if (typeof smartDetectColumnsAndRange === 'function') {
        const detected = smartDetectColumnsAndRange(rows);
        hoCol = detected.hoCol;
        tenCol = detected.tenCol;
        if (detected.startRow >= 0) startRow = detected.startRow;
        if (detected.endRow >= 0) endRow = detected.endRow;
      }

      const students = [];
      for (let r = startRow; r <= endRow; r++) {
        if (!rows[r]) continue;
        let fullName = '';
        if (hoCol >= 0 && tenCol >= 0 && hoCol !== tenCol) {
          const ho = String(rows[r][hoCol] || '').trim();
          const ten = String(rows[r][tenCol] || '').trim();
          fullName = `${ho} ${ten}`.trim();
        } else if (hoCol >= 0) {
          fullName = String(rows[r][hoCol] || '').trim();
        } else {
          // Tìm ô chữ dài nhất trong hàng làm họ tên
          for (let c = 0; c < rows[r].length; c++) {
            const val = String(rows[r][c] || '').trim();
            if (val && isNaN(val) && val.split(' ').length >= 2) {
              fullName = val;
              break;
            }
          }
        }

        if (fullName && isNaN(fullName)) {
          const cleaned = fullName.replace(/^(stt\s*[:.-]?\s*)?\d+[\s./\-)–—:]+\s*/i, '').trim();
          if (cleaned.length >= 2 && (!window.isExcludeRow || !window.isExcludeRow(cleaned))) {
            students.push(cleaned);
          }
        }
      }

      const uniqueStudents = Array.from(new Set(students));
      const baseName = file.name.replace(/\.[^/.]+$/, '').trim();

      callback({
        fileName: file.name,
        suggestedClassName: baseName,
        students: uniqueStudents
      });
    } catch (err) {
      console.error('Lỗi phân tích Excel:', err);
      if (typeof showToast === 'function') showToast('Không thể đọc dữ liệu file Excel!', 'warning');
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Cập nhật số lượng học sinh được phát hiện trong ô dán tại Modal Quản Lý Lớp Học
 */
function updateManagerParsedCount() {
  const pasteArea = document.getElementById('managerStudentListText');
  const badge = document.getElementById('managerParsedCountBadge');
  if (!pasteArea || !badge) return;

  const names = cleanStudentNameList(pasteArea.value);
  badge.textContent = `${names.length} học sinh`;
  badge.style.color = names.length > 0 ? '#16a34a' : '#0284c7';
  badge.style.background = names.length > 0 ? '#dcfce7' : '#e0f2fe';
}

/**
 * Xử lý khi người dùng đổi tùy chọn danh sách học sinh khi tạo lớp mới
 */
function onManagerClassOptionChange(val) {
  const pasteArea = document.getElementById('managerPasteArea');
  const excelArea = document.getElementById('managerExcelArea');

  if (pasteArea) pasteArea.style.display = val === 'paste' ? 'block' : 'none';
  if (excelArea) excelArea.style.display = val === 'excel' ? 'block' : 'none';
}

/**
 * Xử lý khi chọn file Excel trong Form Tạo Lớp Mới
 */
function handleManagerExcelUpload(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];

  extractStudentsFromExcelFile(file, function(result) {
    const nameInput = document.getElementById('managerNewClassName');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.value = result.suggestedClassName;
    }

    const pasteArea = document.getElementById('managerStudentListText');
    if (pasteArea) {
      pasteArea.value = result.students.join('\n');
    }

    // Chuyển sang hiển thị ô dán để thầy xem lại danh sách học sinh
    const optSelect = document.getElementById('managerNewClassOption');
    if (optSelect) optSelect.value = 'paste';
    onManagerClassOptionChange('paste');
    updateManagerParsedCount();

    const info = document.getElementById('managerExcelFileInfo');
    if (info) {
      info.textContent = `✅ Đã đọc thành công ${result.students.length} học sinh từ file: ${file.name}`;
    }

    if (typeof showToast === 'function') {
      showToast(`Đã nhận diện ${result.students.length} học sinh từ "${file.name}"!`, 'success');
    }
  });

  input.value = '';
}

/**
 * Nâng cấp hàm Tạo Lớp Học Mới: Hỗ trợ nạp danh sách thật và tự động tạo sơ đồ chỗ ngồi
 */
function submitCreateNewClassFromManager() {
  const nameInput = document.getElementById('managerNewClassName');
  const optSelect = document.getElementById('managerNewClassOption');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập tên lớp học!', 'warning');
    if (nameInput) nameInput.focus();
    return;
  }

  const newId = 'cls_' + Date.now();
  const initOpt = optSelect ? optSelect.value : 'paste';
  let students = [];

  if (initOpt === 'paste') {
    const pasteArea = document.getElementById('managerStudentListText');
    const rawText = pasteArea ? pasteArea.value : '';
    students = cleanStudentNameList(rawText);

    if (students.length === 0) {
      const confirmEmpty = confirm(`Thầy chưa dán danh sách học sinh thật cho lớp "${name}". Thầy có muốn tạo lớp trống (0 học sinh) để cập nhật sau không?`);
      if (!confirmEmpty) {
        if (pasteArea) pasteArea.focus();
        return;
      }
    }
  } else if (initOpt === 'sample_seating') {
    students = window.SAMPLE_STUDENTS ? [...window.SAMPLE_STUDENTS] : [];
  } else if (initOpt === 'clone') {
    const curr = typeof getCurrentClass === 'function' ? getCurrentClass() : null;
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
    // Lớp trống (0 học sinh)
    students = [];
  }

  // Tự động khởi tạo sơ đồ chỗ ngồi phù hợp với số lượng học sinh thật
  const autoSeatingCheck = document.getElementById('managerAutoSeatingCheck');
  const shouldCreateSeating = autoSeatingCheck ? autoSeatingCheck.checked : true;

  if (shouldCreateSeating && initOpt !== 'clone') {
    const aisles = 4;
    const computedRows = Math.max(4, Math.ceil(Math.max(students.length, 24) / (aisles * 2)));
    if (typeof generateSeatingLayoutForClass === 'function') {
      generateSeatingLayoutForClass(newId, students, {
        aisles: aisles,
        rows: computedRows,
        deskType: 'double'
      });
    }
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

  // Xóa trắng form nhập
  if (nameInput) nameInput.value = '';
  const pasteArea = document.getElementById('managerStudentListText');
  if (pasteArea) pasteArea.value = '';
  updateManagerParsedCount();

  saveStateToStorage();
  if (typeof updateUI === 'function') updateUI();
  renderClassManagerModalList();

  if (typeof showToast === 'function') {
    const msg = students.length > 0
      ? `🎉 Đã tạo thành công lớp "${name}" với ${students.length} học sinh thật!`
      : `➕ Đã tạo thành công lớp "${name}" độc lập (0 học sinh)!`;
    showToast(msg, 'success');
  }
}

/**
 * Nâng cấp hàm render danh sách lớp trong Modal Quản Lý Lớp Học
 * Bổ sung nút: "👥 DS Học sinh" cho từng lớp
 */
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
            <span class="manager-class-badge-pill" style="font-weight: 700; color: ${cls.students.length > 0 ? '#0369a1' : '#b45309'}; background: ${cls.students.length > 0 ? '#e0f2fe' : '#fef3c7'};">👥 ${cls.students.length} học sinh</span>
            <span>${seatingInfo}</span>
          </div>
        </div>
      </div>
      <div class="manager-class-actions">
        ${!isCurrent ? `<button class="btn-manager-action btn-select-current" onclick="selectClassFromManager('${cls.id}')" title="Chuyển sang dùng lớp này">👉 Chọn lớp</button>` : `<span style="font-size:0.8rem; font-weight:700; color:#16a34a; padding: 0 6px;">✓ Đang hoạt động</span>`}
        <button class="btn-manager-action" onclick="openClassStudentEditor('${cls.id}')" title="Xem & nhập danh sách học sinh thật cho lớp này" style="color: #0284c7; border-color: #bae6fd; background: #f0f9ff; font-weight: 800;">👥 DS Học sinh</button>
        <button class="btn-manager-action" onclick="openRenameClassModal('${cls.id}')" title="Đổi tên lớp học">✏️ Đổi tên</button>
        <button class="btn-manager-action" onclick="cloneClassFromManager('${cls.id}')" title="Nhân bản lớp kèm sơ đồ">📋 Nhân bản</button>
        ${state.classes.length > 1 ? `<button class="btn-manager-action btn-danger-class" onclick="deleteClassFromManager('${cls.id}')" title="Xóa lớp học này">🗑️ Xóa</button>` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

// ==============================================================================
// MODAL XEM & SỬA DANH SÁCH HỌC SINH TỪNG LỚP (classStudentEditorModal)
// ==============================================================================

/**
 * Mở modal chỉnh sửa danh sách học sinh của một lớp cụ thể
 */
function openClassStudentEditor(classId) {
  const state = window.state;
  const targetClass = state.classes.find(c => c.id === classId);
  if (!targetClass) return;

  currentEditorClassId = classId;
  currentEditorStudents = [...targetClass.students];

  const titleEl = document.getElementById('editorModalTitle');
  if (titleEl) {
    titleEl.textContent = `👥 DANH SÁCH HỌC SINH THẬT - ${targetClass.name.toUpperCase()}`;
  }

  const idInput = document.getElementById('editorCurrentClassId');
  if (idInput) idInput.value = classId;

  // Chuẩn bị dữ liệu cho ô dán
  const pasteArea = document.getElementById('editorPasteTextarea');
  if (pasteArea) {
    pasteArea.value = currentEditorStudents.join('\n');
  }
  updateEditorPasteCount();

  switchEditorTab('list');
  renderEditorStudentList();

  const modal = document.getElementById('classStudentEditorModal');
  if (modal) modal.classList.add('open');
}

/**
 * Đóng modal chỉnh sửa học sinh
 */
function closeClassStudentEditorModal() {
  const modal = document.getElementById('classStudentEditorModal');
  if (modal) modal.classList.remove('open');
  currentEditorClassId = null;
  currentEditorStudents = [];
}

/**
 * Chuyển đổi tab giữa Xem danh sách và Dán danh sách
 */
function switchEditorTab(tabName) {
  const btnList = document.getElementById('editorTabBtnList');
  const btnPaste = document.getElementById('editorTabBtnPaste');
  const contentList = document.getElementById('editorTabContentList');
  const contentPaste = document.getElementById('editorTabContentPaste');

  if (tabName === 'list') {
    if (btnList) {
      btnList.style.background = '#e0f2fe';
      btnList.style.borderColor = '#bae6fd';
      btnList.style.color = '#0284c7';
    }
    if (btnPaste) {
      btnPaste.style.background = '#f8fafc';
      btnPaste.style.borderColor = '#e2e8f0';
      btnPaste.style.color = '#475569';
    }
    if (contentList) contentList.style.display = 'flex';
    if (contentPaste) contentPaste.style.display = 'none';
  } else {
    if (btnList) {
      btnList.style.background = '#f8fafc';
      btnList.style.borderColor = '#e2e8f0';
      btnList.style.color = '#475569';
    }
    if (btnPaste) {
      btnPaste.style.background = '#e0f2fe';
      btnPaste.style.borderColor = '#bae6fd';
      btnPaste.style.color = '#0284c7';
    }
    if (contentList) contentList.style.display = 'none';
    if (contentPaste) contentPaste.style.display = 'flex';
  }
}

/**
 * Render danh sách học sinh trong Tab 1
 */
function renderEditorStudentList() {
  const container = document.getElementById('editorStudentListView');
  const countBadge = document.getElementById('editorStudentCount');
  if (!container) return;

  if (countBadge) countBadge.textContent = currentEditorStudents.length;
  container.innerHTML = '';

  if (currentEditorStudents.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: #94a3b8; font-size: 0.9rem;">
        <div>📭 Lớp này hiện chưa có học sinh nào.</div>
        <div style="font-size: 0.8rem; margin-top: 4px;">Thầy hãy nhập họ tên ở ô trên hoặc chuyển sang tab <b>"Dán / Nạp Danh Sách Mới"</b> để dán cả lớp nhé!</div>
      </div>
    `;
    return;
  }

  currentEditorStudents.forEach((name, idx) => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.88rem;';

    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 0.78rem; font-weight: 700; color: #64748b; min-width: 26px;">#${idx + 1}</span>
        <span style="font-weight: 600; color: #1e293b;">${name}</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button type="button" onclick="editStudentInEditor(${idx})" style="background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 0.82rem; color: #0284c7;" title="Sửa tên">✏️</button>
        <button type="button" onclick="removeStudentFromEditor(${idx})" style="background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 0.82rem; color: #ef4444;" title="Xóa em này">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

/**
 * Thêm nhanh một học sinh vào danh sách đang sửa
 */
function addSingleStudentToEditor() {
  const input = document.getElementById('editorNewStudentName');
  if (!input) return;
  const name = input.value.trim();

  if (!name) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập tên học sinh!', 'warning');
    input.focus();
    return;
  }

  currentEditorStudents.push(name);
  input.value = '';
  renderEditorStudentList();

  // Đồng bộ sang ô textarea
  const pasteArea = document.getElementById('editorPasteTextarea');
  if (pasteArea) pasteArea.value = currentEditorStudents.join('\n');
  updateEditorPasteCount();

  input.focus();
}

/**
 * Xóa một học sinh khỏi danh sách
 */
function removeStudentFromEditor(idx) {
  if (idx < 0 || idx >= currentEditorStudents.length) return;
  const removedName = currentEditorStudents[idx];
  currentEditorStudents.splice(idx, 1);
  renderEditorStudentList();

  const pasteArea = document.getElementById('editorPasteTextarea');
  if (pasteArea) pasteArea.value = currentEditorStudents.join('\n');
  updateEditorPasteCount();

  if (typeof showToast === 'function') {
    showToast(`Đã xóa học sinh "${removedName}"`, 'info');
  }
}

/**
 * Sửa tên một học sinh trong danh sách
 */
function editStudentInEditor(idx) {
  if (idx < 0 || idx >= currentEditorStudents.length) return;
  const oldName = currentEditorStudents[idx];
  const newName = prompt(`Sửa họ tên học sinh #${idx + 1}:`, oldName);

  if (newName !== null && newName.trim() && newName.trim() !== oldName) {
    currentEditorStudents[idx] = newName.trim();
    renderEditorStudentList();

    const pasteArea = document.getElementById('editorPasteTextarea');
    if (pasteArea) pasteArea.value = currentEditorStudents.join('\n');
    updateEditorPasteCount();
  }
}

/**
 * Cập nhật số lượng học sinh trong ô dán của Editor Modal
 */
function updateEditorPasteCount() {
  const textarea = document.getElementById('editorPasteTextarea');
  const badge = document.getElementById('editorPasteCountBadge');
  if (!textarea || !badge) return;

  const names = cleanStudentNameList(textarea.value);
  badge.textContent = `${names.length} học sinh`;
}

/**
 * Tải file Excel vào Editor Modal
 */
function handleEditorExcelUpload(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];

  extractStudentsFromExcelFile(file, function(result) {
    const pasteArea = document.getElementById('editorPasteTextarea');
    if (pasteArea) {
      pasteArea.value = result.students.join('\n');
    }
    updateEditorPasteCount();

    if (typeof showToast === 'function') {
      showToast(`Đã nạp ${result.students.length} học sinh từ "${file.name}" vào ô dán!`, 'success');
    }
  });

  input.value = '';
}

/**
 * Lưu các thay đổi từ Editor Modal vào lớp học
 */
function saveClassStudentEditorChanges() {
  if (!currentEditorClassId) return;
  const state = window.state;
  const targetClass = state.classes.find(c => c.id === currentEditorClassId);
  if (!targetClass) return;

  // Lấy dữ liệu từ tab đang mở hoặc gộp
  const contentPaste = document.getElementById('editorTabContentPaste');
  const isPasteTabActive = contentPaste && contentPaste.style.display !== 'none';

  let finalStudents = [];

  if (isPasteTabActive) {
    const pasteArea = document.getElementById('editorPasteTextarea');
    const parsed = cleanStudentNameList(pasteArea ? pasteArea.value : '');
    const modeRadio = document.querySelector('input[name="editorPasteMode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'replace';

    if (mode === 'append') {
      finalStudents = Array.from(new Set([...currentEditorStudents, ...parsed]));
    } else {
      finalStudents = parsed;
    }
  } else {
    finalStudents = [...currentEditorStudents];
  }

  // Cập nhật danh sách học sinh cho lớp
  targetClass.students = finalStudents;
  // Làm sạch các học sinh đã gọi nếu không còn tồn tại trong danh sách
  targetClass.called = (targetClass.called || []).filter(name => finalStudents.includes(name));

  // Tùy chọn cập nhật sơ đồ chỗ ngồi
  const autoSeatingCheck = document.getElementById('editorAutoUpdateSeatingCheck');
  const shouldUpdateSeating = autoSeatingCheck ? autoSeatingCheck.checked : true;

  if (shouldUpdateSeating && finalStudents.length > 0) {
    const aisles = 4;
    const computedRows = Math.max(4, Math.ceil(finalStudents.length / (aisles * 2)));
    if (typeof generateSeatingLayoutForClass === 'function') {
      generateSeatingLayoutForClass(currentEditorClassId, finalStudents, {
        aisles: aisles,
        rows: computedRows,
        deskType: 'double'
      });
    }
  }

  saveStateToStorage();
  if (typeof updateUI === 'function') updateUI();
  renderClassManagerModalList();
  closeClassStudentEditorModal();

  if (typeof showToast === 'function') {
    showToast(`💾 Đã lưu thành công ${finalStudents.length} học sinh thật cho lớp "${targetClass.name}"!`, 'success');
  }
}

// Xuất các hàm ra phạm vi toàn cục (window)
window.cleanStudentNameList = cleanStudentNameList;
window.extractStudentsFromExcelFile = extractStudentsFromExcelFile;
window.updateManagerParsedCount = updateManagerParsedCount;
window.onManagerClassOptionChange = onManagerClassOptionChange;
window.handleManagerExcelUpload = handleManagerExcelUpload;
window.submitCreateNewClassFromManager = submitCreateNewClassFromManager;
window.renderClassManagerModalList = renderClassManagerModalList;
window.openClassStudentEditor = openClassStudentEditor;
window.closeClassStudentEditorModal = closeClassStudentEditorModal;
window.switchEditorTab = switchEditorTab;
window.renderEditorStudentList = renderEditorStudentList;
window.addSingleStudentToEditor = addSingleStudentToEditor;
window.removeStudentFromEditor = removeStudentFromEditor;
window.editStudentInEditor = editStudentInEditor;
window.updateEditorPasteCount = updateEditorPasteCount;
window.handleEditorExcelUpload = handleEditorExcelUpload;
window.saveClassStudentEditorChanges = saveClassStudentEditorChanges;
