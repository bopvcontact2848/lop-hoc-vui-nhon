/**
 * ==============================================================================
 * MODULE NGÂN HÀNG 10 CÂU HỎI & NHẬP/XUẤT EXCEL (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmQuestionBank.js
 * Trách nhiệm: Lưu bộ 10 câu hỏi mặc định, đồng bộ LocalStorage, trình soạn thảo
 * câu hỏi trực quan và xuất/nhập file Excel (.xlsx) bằng thư viện SheetJS.
 * ==============================================================================
 */

(function () {
  'use strict';

  // 1. DỮ LIỆU BỘ 10 CÂU HỎI CHÍNH THỨC (THEO TÀI LIỆU GIẢI MÃ BÍ MẬT 20/11)
  const DEFAULT_QUESTIONS = [
    {
      id: 1,
      question: 'Hành vi nào dưới đây thể hiện sự tôn trọng sự khác biệt của bạn bè trong trường học?',
      options: [
        'Cười cợt khi bạn có giọng nói địa phương hoặc sở thích khác mình.',
        'Lắng nghe, tôn trọng quan điểm riêng và không phán xét cá tính lành mạnh của bạn.',
        'Bắt ép bạn phải thay đổi tính cách theo sở thích nhóm mình.',
        'Tránh mặt, không tiếp xúc với những bạn có học lực yếu hơn mình.'
      ],
      correct: 1, // B
      time: 30,
      coordinate: 'Mã 1B (Đỏ son)',
      regionId: 'code_1B',
      regionName: 'Mã 1B (Chữ TRI)'
    },
    {
      id: 2,
      question: 'Khi phát hiện bạn cùng lớp bị một nhóm học sinh khác cô lập, đe dọa trên mạng xã hội, hành động đúng đắn nhất của em là gì?',
      options: [
        'Bình luận thêm để tăng tính ly kỳ cho bài viết.',
        'Im lặng coi như không biết vì sợ bị trả thù hoặc liên lụy.',
        'Khuyên bạn lưu lại bằng chứng và cùng bạn báo ngay cho thầy cô, BGH hoặc gia đình can thiệp.',
        'Hẹn nhóm bắt nạt ra ngoài cổng trường để giải quyết bằng bạo lực.'
      ],
      correct: 2, // C
      time: 30,
      coordinate: 'Mã 2C (Đỏ son)',
      regionId: 'code_2C',
      regionName: 'Mã 2C (Chữ ÂN)'
    },
    {
      id: 3,
      question: 'Việc làm nào sau đây của học sinh lớp 9 thể hiện rõ nhất ý thức phát huy truyền thống nhà trường?',
      options: [
        'Chuyên cần học tập, tích cực rèn luyện đạo đức, đoàn kết giúp đỡ bạn bè cùng tiến bộ và giữ gìn trường lớp xanh – sạch – đẹp.',
        'Chỉ tập trung học môn thi tuyển sinh vào lớp 10, bỏ qua mọi phong trào của Đội và trường.',
        'Tham gia các hoạt động tập thể chỉ khi bị thầy cô nhắc nhở, kiểm tra.',
        'Khắc tên lớp và tên cá nhân lên bàn ghế, tường phòng học để lưu lại kỷ niệm.'
      ],
      correct: 0, // A
      time: 30,
      coordinate: 'Mã 3A (Vàng cam)',
      regionId: 'code_3A',
      regionName: 'Mã 3A (Chữ THẦY)'
    },
    {
      id: 4,
      question: 'Biểu hiện nào sau đây thể hiện hành vi giao tiếp tích cực trong môi trường học đường?',
      options: [
        'Thường xuyên ngắt lời thầy cô và bạn bè khi người khác chưa kịp nói xong.',
        'Nói năng cộc lốc, không thưa gửi với người lớn tuổi.',
        'Chú ý lắng nghe, ánh mắt thiện cảm, thái độ cầu thị và dùng lời nói lịch sự, tôn trọng người đối thoại.',
        'Tỏ thái độ khinh thường khi bạn mình nêu ra ý kiến chưa chính xác trong giờ học.'
      ],
      correct: 2, // C
      time: 30,
      coordinate: 'Mã 4C (Vàng cam)',
      regionId: 'code_4C',
      regionName: 'Mã 4C (Chữ CÔ)'
    },
    {
      id: 5,
      question: 'Khi bị bạn bè hiểu lầm dẫn đến việc bị nói xấu sau lưng, cách giải tỏa cảm xúc tiêu cực và ứng xử văn minh nhất là gì?',
      options: [
        'Lên mạng xã hội viết bài công kích, xúc phạm lại bạn đó.',
        'Hít thở sâu để lấy lại bình tĩnh, sau đó chủ động hẹn gặp bạn để nói chuyện thẳng thắn trên tinh thần hòa giải.',
        'Tự ý bỏ học để thể hiện sự phản kháng với tập thể lớp.',
        'Giữ kín trong lòng, ấm ức một mình dẫn đến suy sụp tinh thần.'
      ],
      correct: 1, // B
      time: 30,
      coordinate: 'Mã 5B (Xanh dương)',
      regionId: 'code_5B',
      regionName: 'Mã 5B (Số 20)'
    },
    {
      id: 6,
      question: 'Khả năng thích nghi của bản thân với sự thay đổi trong cuộc sống thể hiện rõ nhất qua hành vi nào?',
      options: [
        'Than vãn, buông xuôi khi gặp môi trường học tập hoặc thầy cô giáo mới.',
        'Cố chấp giữ nguyên thói quen sinh hoạt cũ dù hoàn cảnh gia đình đã thay đổi.',
        'Chủ động tìm hiểu hoàn cảnh mới, chấp nhận sự thay đổi, lập kế hoạch cá nhân linh hoạt và tìm kiếm sự hỗ trợ để hòa nhập.',
        'Tránh né mọi thử thách mới vì sợ bản thân sẽ thất bại.'
      ],
      correct: 2, // C
      time: 30,
      coordinate: 'Mã 6C (Xanh dương)',
      regionId: 'code_6C',
      regionName: 'Mã 6C (Số /11)'
    },
    {
      id: 7,
      question: 'Hành vi nào dưới đây bị xếp vào dạng "Bắt nạt học đường trên không gian mạng"?',
      options: [
        'Lập nhóm học tập trực tuyến để cùng nhau giải bài tập khó.',
        'Nhắn tin hỏi thăm bài vở khi bạn bị ốm phải nghỉ học.',
        'Chụp lén hình ảnh xấu của bạn rồi chỉnh sửa, chế giễu và đăng tải lên mạng xã hội kèm lời lẽ lăng mạ.',
        'Chia sẻ bài viết tuyên truyền phòng chống bạo lực học đường do Liên đội phát động.'
      ],
      correct: 2, // C
      time: 30,
      coordinate: 'Mã 7C (Hồng sen)',
      regionId: 'code_7C',
      regionName: 'Mã 7C (Trái tim trái)'
    },
    {
      id: 8,
      question: 'Điểm khác biệt căn bản giữa một cuộc tranh biện văn minh và một cuộc cãi vã xúc phạm nhau là gì?',
      options: [
        'Tranh biện văn minh dùng lý lẽ, dẫn chứng khoa học và tôn trọng đối phương; cãi vã dùng cảm xúc nóng giận, hạ nhục cá nhân.',
        'Tranh biện văn minh là ai nói to hơn thì người đó giành chiến thắng.',
        'Cả hai đều giống nhau vì đều nhằm mục đích công kích đối phương.',
        'Tranh biện là chỉ một người nói, người kia buộc phải im lặng tuyệt đối.'
      ],
      correct: 0, // A
      time: 30,
      coordinate: 'Mã 8A (Hồng sen)',
      regionId: 'code_8A',
      regionName: 'Mã 8A (Trái tim phải)'
    },
    {
      id: 9,
      question: 'Để nhận diện chính xác điểm mạnh và điểm hạn chế của bản thân, học sinh cần thực hiện theo quy trình nào?',
      options: [
        'Tự đánh giá qua kết quả hoạt động -> Lắng nghe nhận xét khách quan của thầy cô, bạn bè -> So sánh, đối chiếu -> Xác định rõ điểm cần phát huy và khắc phục.',
        'Chỉ lắng nghe lời khen ngợi của bạn thân, bỏ qua hoàn toàn các lời góp ý phê bình.',
        'Hoàn toàn phụ thuộc vào nhận xét của người khác mà không cần tự suy ngẫm.',
        'Tự cho mình là hoàn hảo, không có khuyết điểm nào cần sửa đổi.'
      ],
      correct: 0, // A
      time: 30,
      coordinate: 'Mã 9A (Xanh lục)',
      regionId: 'code_9A',
      regionName: 'Mã 9A (Nhành lá tri ân)'
    },
    {
      id: 10,
      question: 'Khi bước vào năm học lớp 9 với nhiều áp lực thi cử và chọn trường sau THCS, hành vi nào thể hiện năng lực tự chủ và thích ứng tốt nhất?',
      options: [
        'Thức thâu đêm chơi điện tử để xả stress rồi lên lớp ngủ bù.',
        'Xây dựng thời gian biểu khoa học giữa học tập – nghỉ ngơi – thể thao, kiên trì thực hiện mục tiêu và chủ động nhờ thầy cô tư vấn.',
        'Tự tạo áp lực nặng nề khiến cơ thể suy nhược, luôn lo âu, hoảng sợ.',
        'Đổ lỗi cho chương trình học nặng và phó mặc kết quả học tập.'
      ],
      correct: 1, // B
      time: 30,
      coordinate: 'Mã 10B (Vàng kim)',
      regionId: 'code_10B',
      regionName: 'Mã 10B (Ngôi sao tri thức)'
    }
  ];


  const STORAGE_KEY_QUESTIONS = 'giai_ma_bi_mat_questions_v2';

  window.GmmQuestionBank = {
    DEFAULT_QUESTIONS,
    create: function (ctx) {
      const { gameState, renderQuestionUI, broadcastHostStateToServer } = ctx;

  // Khôi phục câu hỏi đã lưu từ LocalStorage
  function loadQuestionsFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) {
          ctx.setQuestionsList(parsed);
        }
      }
    } catch (_e) {}
  }

  function saveQuestionsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(ctx.getQuestionsList()));
    } catch (_e) {}
  }


  // 7. QUẢN LÝ & CHỈNH SỬA 10 CÂU HỎI
  function openQuestionEditor() {
    const modal = document.getElementById('gmmQuestionEditModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderQuestionEditor();
  }

  function closeQuestionEditor() {
    const modal = document.getElementById('gmmQuestionEditModal');
    if (modal) modal.style.display = 'none';
  }

  function renderQuestionEditor() {
    const nav = document.getElementById('gmmQEditNav');
    const form = document.getElementById('gmmQEditForm');
    if (!nav || !form) return;

    // Render danh sách nút câu 1..10
    nav.innerHTML = '';
    ctx.getQuestionsList().forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gmm-qedit-tab-btn ${idx === gameState.editingQIndex ? 'active' : ''}`;
      btn.textContent = `Câu ${idx + 1}`;
      btn.onclick = () => {
        saveCurrentEditFormToState();
        gameState.editingQIndex = idx;
        renderQuestionEditor();
      };
      nav.appendChild(btn);
    });

    // Render form câu đang chọn
    const curQ = ctx.getQuestionsList()[gameState.editingQIndex];
    if (!curQ) return;

    const letters = ['A', 'B', 'C', 'D'];

    form.innerHTML = `
      <div class="gmm-qedit-field">
        <label>Nội Dung Câu Hỏi ${gameState.editingQIndex + 1}:</label>
        <textarea id="editQ_text" class="gmm-qedit-textarea" rows="2">${curQ.question}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div class="gmm-qedit-field" style="margin: 0;">
          <label>Thời Gian Suy Nghĩ (giây):</label>
          <input type="number" id="editQ_time" class="gmm-qedit-input" min="5" max="120" value="${curQ.time || 30}">
        </div>
        <div class="gmm-qedit-field" style="margin: 0;">
          <label>Đáp Án Đúng:</label>
          <select id="editQ_correct" class="gmm-qedit-input">
            ${letters.map((l, i) => `<option value="${i}" ${curQ.correct === i ? 'selected' : ''}>Phương án ${l}</option>`).join('')}
          </select>
        </div>
      </div>

      <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">Bốn Phương Án Trả Lời:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${curQ.options.map((opt, i) => `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: #fde047; width: 20px;">${letters[i]}:</span>
            <input type="text" id="editQ_opt_${i}" class="gmm-qedit-input" value="${opt}">
          </div>
        `).join('')}
      </div>
    `;
  }

  function saveCurrentEditFormToState() {
    const curQ = ctx.getQuestionsList()[gameState.editingQIndex];
    if (!curQ) return;

    const textEl = document.getElementById('editQ_text');
    const timeEl = document.getElementById('editQ_time');
    const correctEl = document.getElementById('editQ_correct');

    if (textEl) curQ.question = textEl.value.trim();
    if (timeEl) curQ.time = parseInt(timeEl.value, 10) || 30;
    if (correctEl) curQ.correct = parseInt(correctEl.value, 10) || 0;

    for (let i = 0; i < 4; i++) {
      const optEl = document.getElementById(`editQ_opt_${i}`);
      if (optEl) curQ.options[i] = optEl.value.trim();
    }
  }

  function saveQuestionEdit() {
    saveCurrentEditFormToState();
    saveQuestionsToStorage();
    closeQuestionEditor();
    renderQuestionUI();
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast('💾 Đã lưu thành công 10 câu hỏi vào bộ nhớ máy!', 'success');
    }
  }

  function restoreDefaultQuestions() {
    if (confirm('Thầy/Cô có muốn khôi phục lại 10 câu hỏi chuẩn Hoạt động trải nghiệm (Giải mã bí mật) không?')) {
      ctx.setQuestionsList(JSON.parse(JSON.stringify(DEFAULT_QUESTIONS)));
      saveQuestionsToStorage();
      renderQuestionEditor();
      renderQuestionUI();
      broadcastHostStateToServer();
      if (typeof window.showToast === 'function') {
        window.showToast('🔄 Đã khôi phục bộ 10 câu hỏi chuẩn Hoạt động trải nghiệm thành công!', 'info');
      }
    }
  }

  // ============================================================================
  // 8. TÍNH NĂNG XUẤT / NHẬP EXCEL & FILE MẪU BẰNG SHEETJS (window.XLSX)
  // ============================================================================

  // Tải file Excel mẫu gồm 10 câu hỏi chính thức
  function downloadQuestionTemplate() {
    if (typeof window.XLSX === 'undefined') {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Đang kết nối thư viện SheetJS, vui lòng thử lại sau 2 giây!', 'warning');
      }
      return;
    }

    const headers = [
      'STT',
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng (A/B/C/D)',
      'Thời gian (giây)',
      'Tọa độ mở khóa bảng A1'
    ];

    const letters = ['A', 'B', 'C', 'D'];
    const rows = [headers];

    DEFAULT_QUESTIONS.forEach((q, idx) => {
      rows.push([
        idx + 1,
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        letters[q.correct] || 'A',
        q.time || 30,
        q.coordinate || (`Ô số ${idx + 1}`)
      ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 60 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 }
    ];

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Giai_Ma_Bi_Mat');
    window.XLSX.writeFile(wb, 'Mau_10_Cau_Hoi_Giai_Ma_Bi_Mat.xlsx');

    if (typeof window.showToast === 'function') {
      window.showToast('📥 Đã tải xuống file Excel mẫu 10 câu hỏi thành công!', 'success');
    }
  }

  // Xuất bộ 10 câu hỏi hiện tại ra file Excel (.xlsx)
  function exportQuestionsToExcel() {
    if (typeof window.XLSX === 'undefined') {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Không tìm thấy thư viện SheetJS để xuất Excel!', 'warning');
      }
      return;
    }

    const headers = [
      'STT',
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng (A/B/C/D)',
      'Thời gian (giây)',
      'Tọa độ mở khóa bảng A1'
    ];

    const letters = ['A', 'B', 'C', 'D'];
    const rows = [headers];

    ctx.getQuestionsList().forEach((q, idx) => {
      rows.push([
        idx + 1,
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        letters[q.correct] || 'A',
        q.time || 30,
        q.coordinate || (`Ô số ${idx + 1}`)
      ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 60 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 }
    ];

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Giai_Ma_Bi_Mat');
    window.XLSX.writeFile(wb, 'Bo_Cau_Hoi_Giai_Ma_Bi_Mat.xlsx');

    if (typeof window.showToast === 'function') {
      window.showToast('💾 Đã xuất toàn bộ 10 câu hỏi ra file Excel thành công!', 'success');
    }
  }

  // Nhập file Excel / CSV từ máy tính
  function handleExcelFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (typeof window.XLSX === 'undefined') {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Thư viện SheetJS chưa sẵn sàng!', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu câu hỏi!');
        }

        // Bỏ dòng tiêu đề header
        const dataRows = rawJson.slice(1).filter(row => row && row.length >= 2 && String(row[1] || '').trim() !== '');

        if (dataRows.length === 0) {
          throw new Error('Không tìm thấy dòng câu hỏi hợp lệ trong file Excel!');
        }

        const letterMap = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };
        const newQuestions = [];

        dataRows.slice(0, 10).forEach((row, idx) => {
          const qText = String(row[1] || '').trim();
          const optA = String(row[2] || 'A').trim();
          const optB = String(row[3] || 'B').trim();
          const optC = String(row[4] || 'C').trim();
          const optD = String(row[5] || 'D').trim();

          const correctStr = String(row[6] || 'A').trim().toUpperCase();
          const correctIdx = letterMap[correctStr] !== undefined ? letterMap[correctStr] : (parseInt(correctStr, 10) || 0);

          const timeVal = parseInt(row[7], 10) || 30;

          const defaultInfo = DEFAULT_QUESTIONS[idx] || {
            regionId: `reg_${idx + 1}`,
            regionName: `Mảng ${idx + 1}`
          };

          newQuestions.push({
            id: idx + 1,
            question: qText,
            options: [optA, optB, optC, optD],
            correct: correctIdx,
            time: Math.max(5, Math.min(timeVal, 180)),
            regionId: defaultInfo.regionId,
            regionName: defaultInfo.regionName
          });
        });

        // Nếu file có ít hơn 10 câu, bổ sung các câu mặc định còn lại
        while (newQuestions.length < 10) {
          const fallbackIdx = newQuestions.length;
          newQuestions.push(JSON.parse(JSON.stringify(DEFAULT_QUESTIONS[fallbackIdx])));
        }

        ctx.setQuestionsList(newQuestions);
        saveQuestionsToStorage();
        renderQuestionEditor();
        renderQuestionUI();
        broadcastHostStateToServer();

        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Đã nhập thành công ${dataRows.length} câu hỏi từ file Excel!`, 'success');
        }
      } catch (err) {
        if (typeof window.showToast === 'function') {
          window.showToast(`❌ Lỗi đọc file Excel: ${err.message}`, 'danger');
        }
      } finally {
        event.target.value = ''; // Reset input để có thể chọn lại cùng file
      }
    };

    reader.readAsArrayBuffer(file);
  }


      return {
        loadQuestionsFromStorage,
        saveQuestionsToStorage,
        openQuestionEditor,
        closeQuestionEditor,
        renderQuestionEditor,
        saveCurrentEditFormToState,
        saveQuestionEdit,
        restoreDefaultQuestions,
        downloadQuestionTemplate,
        exportQuestionsToExcel,
        handleExcelFileUpload
      };
    }
  };
})();
