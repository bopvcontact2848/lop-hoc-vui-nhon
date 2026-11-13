/**
 * ==============================================================================
 * MODULE TRÒ CHƠI TƯƠNG TÁC: GIẢI MÃ BÍ MẬT – NGÔI TRƯỜNG HẠNH PHÚC
 * File: scripts/giaiMaBiMat.js
 * Quản lý: Đấu trí 2 Đội A & B, 10 Câu hỏi trắc nghiệm kỹ năng sống,
 * Hiển thị Tọa độ ô màu bí mật mở khóa bảng giấy A1,
 * Cơ chế tranh SVG tô màu & Giải mã biểu tượng bí mật:
 *   - Đội 1 (Đội A): "Ngôi trường hạnh phúc không bạo lực"
 *   - Đội 2 (Đội B): "Trái tim thấu cảm – Tự tin tỏa sáng"
 * Thang điểm: Tối đa 20 điểm (10đ trắc nghiệm + 10đ tô màu giải mã giấy A1).
 * Tính năng nâng cao:
 *   1. Đồng bộ thời gian thực SSE (Server-Sent Events) cho học sinh dùng điện thoại trả lời riêng
 *   2. Xuất / Nhập / Tải file mẫu 10 câu hỏi qua Excel (.xlsx) & CSV với SheetJS
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

  // 2. KHỞI TẠO STATE TRÒ CHƠI
  const STORAGE_KEY_QUESTIONS = 'giai_ma_bi_mat_questions_v2';
  const STORAGE_KEY_STEALTH_MODE = 'gmm_stealth_mode';
  const STORAGE_KEY_TEAM_NAMES = 'gmm_custom_team_names_v1';
  const STORAGE_KEY_CANVAS_THEME = 'gmm_canvas_theme_v1';

  function getInitialCanvasTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CANVAS_THEME);
      if (saved === 'dark' || saved === 'paper') return saved;
      return 'paper'; // Mặc định Nền Giấy Trắng A1 Tương Phản Cao để học sinh nhìn rõ từ xa khi chiếu lên TV/máy chiếu
    } catch (_e) {
      return 'paper';
    }
  }

  function getInitialStealthMode() {
    // Mặc định luôn hiện đầy đủ mã chữ số trên tranh để học sinh định vị tọa độ tô màu
    return false;
  }

  function loadSavedTeamNames() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEAM_NAMES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            teamA: (parsed.teamA && String(parsed.teamA).trim()) || 'ĐOÀN KẾT',
            teamB: (parsed.teamB && String(parsed.teamB).trim()) || 'LA BÀN TUỔI TRẺ'
          };
        }
      }
    } catch (_e) {}
    return { teamA: 'ĐOÀN KẾT', teamB: 'LA BÀN TUỔI TRẺ' };
  }

  const initialTeamNames = loadSavedTeamNames();

  let gameState = {
    sessionId: Date.now(),
    roomCode: '2011-THCS',
    activeTab: 'home',
    roleFocus: 'all', // 'all' (BGK song song), 'teamA', 'teamB'
    canvasTheme: getInitialCanvasTheme(), // 'paper' (Nền Giấy Trắng A1 Tương Phản Cao Chiếu TV) | 'dark'
    isStealthMode: getInitialStealthMode(),
    isStageMode: false, // Chế độ Sân Khấu Máy Chiếu (ẩn nút kỹ thuật, phóng to đồ họa)
    currentQIndex: 0,
    totalMatchSeconds: 120, // Mặc định 2 phút phần thi trắc nghiệm (120 giây)
    timerSeconds: 120,
    timerMax: 120,
    isMatchStarted: false,
    isCountdownRunning: false,
    isTimerRunning: false,
    timerInterval: null,
    isQuestionLocked: false,
    isAnswerRevealed: false,
    isDecryptPhase: false,
    decryptTimeTotal: 300, // Mặc định 5 phút cho phần thi tô màu tranh (300 giây)
    decryptTimeLeft: 300,
    isDecryptTimerRunning: false,
    decryptTimerInterval: null,
    autoFullscreenArtwork: true,
    isDecryptTimerFullscreenOpen: false,
    autoFsOnTimerStart: false,
    selectedColorA: '#ef4444',
    selectedColorB: '#3b82f6',
    teamA: {
      name: initialTeamNames.teamA,
      symbolTitle: 'Ngôi trường hạnh phúc không bạo lực',
      score: 0,
      bonusScore: 0,
      answers: {},
      isLocked: false,
      unlockedRegions: [],
      coloredRegions: {},
      completed: false,
      finishTime: null,
      artworkPhoto: null,
      photoTimestamp: null,
      photoRotation: 0,
      photoTilt: 0,
      isAiEnhanced: true,
      photoViewMode: 'svg'
    },
    teamB: {
      name: initialTeamNames.teamB,
      symbolTitle: 'Trái tim thấu cảm – Tự tin tỏa sáng',
      score: 0,
      bonusScore: 0,
      answers: {},
      isLocked: false,
      unlockedRegions: [],
      coloredRegions: {},
      completed: false,
      finishTime: null,
      artworkPhoto: null,
      photoTimestamp: null,
      photoRotation: 0,
      photoTilt: 0,
      isAiEnhanced: true,
      photoViewMode: 'svg'
    },
    editingQIndex: 0
  };

  let questionsList = [...DEFAULT_QUESTIONS];
  let sseEventSource = null;
  let isStudentMobileClient = false;
  let studentTeamKey = 'teamA'; // 'teamA' hoặc 'teamB'
  let mobileCapturedPhotoData = null;
  let mobileOriginalPhotoData = null;
  let mobileEnhancedPhotoData = null;
  let mobilePhotoRotation = 0;
  let mobilePhotoTilt = 0;
  let isMobileAiEnhanced = true;
  let hostArtworkPollInterval = null;

  // Khôi phục câu hỏi đã lưu từ LocalStorage
  function loadQuestionsFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) {
          questionsList = parsed;
        }
      }
    } catch (_e) {}
  }

  function saveQuestionsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questionsList));
    } catch (_e) {}
  }

  // 3. RENDER TRANH SVG TƯƠNG TÁC CHO ĐỘI A & B
  function generateSvgPuzzle(teamKey, isSolvedKey = false) {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      const newly = (gameState.newlyUnlocked && gameState.newlyUnlocked[teamKey]) || [];
      return window.GiaiMaPuzzle.renderSvgMatrix(teamKey, gameState[teamKey], {
        isDecryptPhase: gameState.isDecryptPhase,
        isSolvedAnswerKey: isSolvedKey,
        isStealthMode: Boolean(gameState.isStealthMode),
        canvasTheme: gameState.canvasTheme || 'paper',
        isPaperTheme: (gameState.canvasTheme || 'paper') === 'paper',
        newlyUnlocked: newly
      });
    }
    return '<div style="color: #94a3b8; padding: 20px; text-align: center;">Đang khởi tạo ma trận bức tranh...</div>';
  }

  // Tùy chọn chuyển đổi giao diện Bảng Tranh: Nền Giấy Trắng A1 (Chuẩn TV/Máy chiếu) hoặc Nền Tối Sân Khấu
  function toggleCanvasTheme() {
    gameState.canvasTheme = (gameState.canvasTheme === 'paper') ? 'dark' : 'paper';
    try {
      localStorage.setItem(STORAGE_KEY_CANVAS_THEME, gameState.canvasTheme);
    } catch (_e) {}

    updateCanvasThemeButtonUI();
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (typeof renderZoomModalContent === 'function') renderZoomModalContent();

    if (typeof window.showToast === 'function') {
      if (gameState.canvasTheme === 'paper') {
        window.showToast('📄 Đã chuyển sang Nền Giấy Trắng A1 (Tương phản cao - Cực kỳ rõ nét trên Tivi & Máy chiếu)!', 'success');
      } else {
        window.showToast('🌑 Đã chuyển sang Nền Tối Sân Khấu.', 'info');
      }
    }
  }

  function getCanvasTheme() {
    return gameState.canvasTheme || 'paper';
  }

  function updateCanvasThemeButtonUI() {
    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    const btnTab4 = document.getElementById('gmmBtnCanvasThemeTab4');
    const textTab4 = document.getElementById('gmmBtnCanvasThemeText');
    if (btnTab4) {
      if (isPaper) {
        btnTab4.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        btnTab4.style.borderColor = '#fde68a';
        btnTab4.style.color = '#ffffff';
        btnTab4.title = 'Đang bật: Nền Giấy Trắng A1 (Rõ nét trên Tivi/Máy chiếu). Bấm để chuyển sang Nền Tối.';
        if (textTab4) textTab4.textContent = '📄 Nền Giấy A1 (Chiếu TV)';
      } else {
        btnTab4.style.background = 'rgba(30, 41, 59, 0.85)';
        btnTab4.style.borderColor = '#64748b';
        btnTab4.style.color = '#cbd5e1';
        btnTab4.title = 'Đang bật: Nền Tối Sân Khấu. Bấm để chuyển sang Nền Giấy Trắng A1 (Khuyên dùng cho Tivi).';
        if (textTab4) textTab4.textContent = '🌑 Nền Tối Sân Khấu';
      }
    }
    const btnSettings = document.getElementById('gmmBtnCanvasThemeSettings');
    if (btnSettings) {
      btnSettings.innerHTML = isPaper
        ? '<span>📄 Nền Tranh: Giấy Trắng A1 (Đổi sang Nền Tối)</span>'
        : '<span>🌑 Nền Tranh: Nền Tối (Đổi sang Giấy Trắng A1)</span>';
    }
    const zoomBtn = document.getElementById('gmmBtnZoomTheme');
    if (zoomBtn) {
      zoomBtn.textContent = isPaper ? '📄 Nền Giấy A1' : '🌑 Nền Tối';
    }
  }

  // Tùy chọn ẩn bớt mã tọa độ chưa mở khóa (Stealth Matrix Mode)
  function toggleStealthMode() {
    gameState.isStealthMode = !gameState.isStealthMode;
    try {
      localStorage.setItem(STORAGE_KEY_STEALTH_MODE, String(gameState.isStealthMode));
    } catch (_e) {}

    updateStealthButtonUI();
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (typeof renderZoomModalContent === 'function') renderZoomModalContent();

    if (typeof window.showToast === 'function') {
      if (gameState.isStealthMode) {
        window.showToast('🕵️ Đã BẬT Chế độ Ẩn Mã Ô Chưa Mở (Stealth Mode) - Kích thích hồi hộp & tò mò cho cả lớp!', 'info');
      } else {
        window.showToast('👁️ Đã TẮT Chế độ Ẩn Mã Ô: Hiện đầy đủ toàn bộ mã chữ số trên ma trận.', 'info');
      }
    }
  }

  function updateStealthButtonUI() {
    const btns = [
      document.getElementById('gmmBtnStealthMode'),
      document.getElementById('gmmBtnStealthModeTab4')
    ];
    btns.forEach(btn => {
      if (!btn) return;
      if (gameState.isStealthMode) {
        btn.innerHTML = '<span>🕵️ Mã Ô: Đang Ẩn (Bí Mật)</span>';
        btn.classList.add('active');
        btn.title = 'Đang BẬT Chế độ Ẩn Mã Ô: Chỉ hiện mã khi giải đúng. Nhấp để hiện toàn bộ mã chữ số.';
      } else {
        btn.innerHTML = '<span>👁️ Mã Ô: Hiện Hết</span>';
        btn.classList.remove('active');
        btn.title = 'Đang hiện toàn bộ mã chữ số. Nhấp để ẩn bớt các mã ô chưa mở giúp tăng kịch tính!';
      }
    });
  }

  // Hiệu ứng sáng đèn lấp lánh (Pulse Glow Effect) tại ô tranh vừa được giải mã thành công
  function triggerPulseGlow(teamKey, regionId) {
    if (!regionId) return;
    if (!gameState.newlyUnlocked) gameState.newlyUnlocked = { teamA: [], teamB: [] };
    if (!gameState.newlyUnlocked[teamKey]) gameState.newlyUnlocked[teamKey] = [];
    if (!gameState.newlyUnlocked[teamKey].includes(regionId)) {
      gameState.newlyUnlocked[teamKey].push(regionId);
    }

    // Tiếng chuông vàng ngân vang lấp lánh (Magic Chimes) rộn rã trên máy chiếu
    if (window.audioManager) {
      if (typeof window.audioManager.playChime === 'function') {
        window.audioManager.playChime();
      }
    }

    // Vẽ lại ma trận ngay lập tức để ô tranh chớp sáng vàng kim
    if (typeof renderDualArena === 'function') renderDualArena();
    if (typeof renderDecryptUI === 'function') renderDecryptUI();
    if (activeZoomTeam === teamKey && typeof renderZoomModalContent === 'function') {
      renderZoomModalContent();
    }

    // Sau 6 giây tự động tắt hiệu ứng lấp lánh, đưa ô về trạng thái mở khóa ổn định
    setTimeout(() => {
      if (gameState.newlyUnlocked && gameState.newlyUnlocked[teamKey]) {
        gameState.newlyUnlocked[teamKey] = gameState.newlyUnlocked[teamKey].filter(id => id !== regionId);
        if (typeof renderDualArena === 'function') renderDualArena();
        if (typeof renderDecryptUI === 'function') renderDecryptUI();
        if (activeZoomTeam === teamKey && typeof renderZoomModalContent === 'function') {
          renderZoomModalContent();
        }
      }
    }, 6000);
  }

  // 4. ĐIỀU KHIỂN ĐỒNG HỒ & CÂU HỎI
  function startQuestion(index) {
    if (index < 0 || index >= questionsList.length) return;
    gameState.currentQIndex = index;
    const q = questionsList[index];

    gameState.timerSeconds = q.time || 30;
    gameState.timerMax = gameState.timerSeconds;
    gameState.isTimerRunning = true;
    gameState.isQuestionLocked = false;
    gameState.isAnswerRevealed = false;

    const btnPause = document.getElementById('gmmBtnPause');
    if (btnPause) btnPause.innerHTML = '<span>⏸️ Tạm Dừng</span>';

    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
      if (!gameState.isTimerRunning) return;
      if (gameState.timerSeconds > 0) {
        gameState.timerSeconds--;
        updateTimerDisplay();

        // Âm thanh đếm ngược trong 5 giây cuối
        if (gameState.timerSeconds <= 5 && gameState.timerSeconds > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(gameState.timerSeconds);
          }
        }

        if (gameState.timerSeconds === 0) {
          clearInterval(gameState.timerInterval);
          gameState.isTimerRunning = false;
          lockAnswer();
          if (window.audioManager && typeof window.audioManager.playTimerBuzzer === 'function') {
            window.audioManager.playTimerBuzzer();
          }
          if (typeof window.showToast === 'function') {
            window.showToast('⏰ Hết thời gian trả lời câu hỏi!', 'warning');
          }
        }
      }
    }, 1000);

    renderQuestionUI();
    updateTimerDisplay();
    broadcastHostStateToServer();
  }

  function pauseTimer() {
    gameState.isTimerRunning = !gameState.isTimerRunning;
    const btn = document.getElementById('gmmBtnPause');
    if (btn) {
      btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
    }
    broadcastHostStateToServer();
  }

  function lockAnswer() {
    if (gameState.isQuestionLocked) return; // Chống cộng điểm lặp
    gameState.isQuestionLocked = true;
    clearInterval(gameState.timerInterval);
    gameState.isTimerRunning = false;

    // Chấm điểm cho từng đội
    const currentQ = questionsList[gameState.currentQIndex];
    const correctIdx = currentQ.correct;

    const toastMsgs = [];
    const coordLabel = currentQ.coordinate || `Ô số ${gameState.currentQIndex + 1}`;
    ['teamA', 'teamB'].forEach(tKey => {
      const teamAns = gameState[tKey].answers[currentQ.id];
      if (teamAns === correctIdx) {
        // Đúng: +1 điểm và mở khóa mảng tranh
        gameState[tKey].score += 1;
        if (!gameState[tKey].unlockedRegions.includes(currentQ.regionId)) {
          gameState[tKey].unlockedRegions.push(currentQ.regionId);
          triggerPulseGlow(tKey, currentQ.regionId);
        }
        toastMsgs.push(`✨ ${gameState[tKey].name}: Đúng (+1đ, mở khóa ${coordLabel} ➔ Tô giấy A1)`);
      } else {
        toastMsgs.push(`❌ ${gameState[tKey].name}: Chưa chính xác`);
      }
    });

    updateHeaderScores();
    renderQuestionUI();
    renderDecryptUI();
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function' && toastMsgs.length > 0) {
      window.showToast(toastMsgs.join(' | '), 'info');
    }
  }

  function showCorrectAnswer() {
    gameState.isAnswerRevealed = true;
    renderQuestionUI();
    broadcastHostStateToServer();

    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  function nextQuestion() {
    if (gameState.currentQIndex < questionsList.length - 1) {
      startQuestion(gameState.currentQIndex + 1);
    } else {
      // Đã xong 10 câu -> Giữ nguyên ở Tab 3, thông báo hoàn thành để Giáo viên tự mở sang Tab 4 khi sẵn sàng
      if (typeof window.showToast === 'function') {
        window.showToast('🎉 ĐÃ HOÀN THÀNH 10 CÂU HỎI! Thầy/Cô vui lòng mở sang Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.', 'success');
      }
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }

  // Chọn đáp án riêng cho từng đội (teamA / teamB)
  function chooseAnswer(teamKey, optionIdx, isRemote = false) {
    if (gameState.isQuestionLocked) {
      if (!isRemote && typeof window.showToast === 'function') {
        window.showToast('🔒 Câu hỏi đã chốt đáp án, không thể thay đổi!', 'warning');
      }
      return;
    }
    const currentQ = questionsList[gameState.currentQIndex];
    if (!currentQ) return;

    gameState[teamKey].answers[currentQ.id] = optionIdx;

    if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
      window.audioManager.playPointerSpringSnap();
    }

    renderQuestionUI();

    // Nếu chọn từ máy chiếu, cập nhật đồng bộ lên Server
    if (!isRemote) {
      broadcastHostStateToServer();
    }
  }

  // 5. GIAI ĐOẠN TÔ MÀU & GIẢI MÃ BÍ MẬT
  function setDecryptDuration(seconds) {
    gameState.decryptTimeTotal = seconds;
    gameState.decryptTimeLeft = seconds;

    // Cập nhật các nút preset 3p (180s), 5p (300s), 7p (420s) trên cả thanh điều khiển & sân khấu Fullscreen
    [180, 300, 420].forEach(s => {
      const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
      if (btn) btn.classList.toggle('primary', s === seconds);
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === seconds);
    });

    const mins = Math.round(seconds / 60);
    const btnStart = document.getElementById('gmmBtnStartDecrypt');
    if (btnStart && !gameState.isDecryptTimerRunning) {
      btnStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }
    const btnFsStart = document.getElementById('gmmBtnFsStartDecrypt');
    if (btnFsStart && !gameState.isDecryptTimerRunning) {
      btnFsStart.textContent = `🚀 Bắt Đầu (${mins}p)`;
    }

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', seconds })
    }).catch(() => {});

    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã đặt thời lượng tô tranh: ${mins} phút!`, 'info');
    }
  }

  function updateDecryptTimerUI() {
    const totalSec = Math.max(0, gameState.decryptTimeLeft || 0);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // 1. Cập nhật đồng hồ đếm ngược trên thanh công cụ Tab 4
    const timerEl = document.getElementById('gmmDecryptTimer');
    if (timerEl) {
      timerEl.textContent = timeStr;

      // Đổi màu cảnh báo & hiệu ứng phát sáng (Neon Glow)
      if (totalSec <= 10) {
        timerEl.style.borderColor = '#ef4444';
        timerEl.style.color = '#ef4444';
        timerEl.classList.add('urgent-pulse');
      } else if (totalSec <= 30) {
        timerEl.style.borderColor = '#f59e0b';
        timerEl.style.color = '#f59e0b';
        timerEl.classList.remove('urgent-pulse');
      } else {
        timerEl.style.borderColor = '#10b981';
        timerEl.style.color = '#34d399';
        timerEl.classList.remove('urgent-pulse');
      }
    }

    // 2. Cập nhật đồng hồ Toàn Màn Hình Khổng Lồ (Fullscreen Countdown Modal)
    const fsTimerDigits = document.getElementById('gmmFsTimerDigits');
    if (fsTimerDigits) {
      fsTimerDigits.textContent = timeStr;
      if (totalSec <= 10) {
        fsTimerDigits.className = 'gmm-timer-fs-digits urgent-red';
      } else if (totalSec <= 30) {
        fsTimerDigits.className = 'gmm-timer-fs-digits warning-amber';
      } else {
        fsTimerDigits.className = 'gmm-timer-fs-digits normal-green';
      }
    }

    // Thanh tiến trình Fullscreen
    const fillEl = document.getElementById('gmmFsTimerProgressFill');
    const totalDuration = Math.max(1, gameState.decryptTimeTotal || 300);
    const percent = Math.min(100, Math.max(0, (totalSec / totalDuration) * 100));
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
      if (totalSec <= 10) {
        fillEl.className = 'gmm-timer-fs-progress-fill urgent-red';
      } else if (totalSec <= 30) {
        fillEl.className = 'gmm-timer-fs-progress-fill warning-amber';
      } else {
        fillEl.className = 'gmm-timer-fs-progress-fill normal-green';
      }
    }

    const percentEl = document.getElementById('gmmFsTimerProgressPercent');
    if (percentEl) {
      percentEl.textContent = `Thời gian còn lại: ${Math.round(percent)}%`;
    }

    const ratioEl = document.getElementById('gmmFsTimerProgressRatio');
    if (ratioEl) {
      const totM = Math.floor(totalDuration / 60);
      const totS = totalDuration % 60;
      const totStr = `${totM.toString().padStart(2, '0')}:${totS.toString().padStart(2, '0')}`;
      ratioEl.textContent = `${timeStr} / ${totStr}`;
    }

    // Hướng dẫn / Thông điệp trạng thái ở trung tâm sân khấu Fullscreen
    const statusTip = document.getElementById('gmmFsTimerStatusTip');
    if (statusTip) {
      if (totalSec === 0) {
        statusTip.textContent = '🎉 HẾT GIỜ TÔ TRANH! Hãy cùng đối chiếu tác phẩm với Tranh Giáo Viên!';
        statusTip.style.color = '#fde047';
      } else if (!gameState.isDecryptTimerRunning) {
        statusTip.textContent = '⏸️ Đang tạm dừng đồng hồ. Bấm "Tiếp Tục" để đếm ngược tiếp tục!';
        statusTip.style.color = '#38bdf8';
      } else if (totalSec <= 10) {
        statusTip.textContent = '🔥 10 GIÂY CUỐI CÙNG! Các đội khẩn trương hoàn thiện những nét tô cuối!';
        statusTip.style.color = '#fca5a5';
      } else {
        statusTip.textContent = '⚡ Hai đội khẩn trương đối chiếu tọa độ ô màu và hoàn thành tranh giấy A1!';
        statusTip.style.color = '#cbd5e1';
      }
    }

    // Cập nhật điểm & số ô mở của 2 đội trên Fullscreen
    const scoreAEl = document.getElementById('gmmFsTeamAScore');
    if (scoreAEl && gameState.teamA) {
      const scoreA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      scoreAEl.textContent = `${scoreA} đ`;
    }
    const progAEl = document.getElementById('gmmFsTeamAProgress');
    if (progAEl && gameState.teamA) {
      const countA = (gameState.teamA.unlockedRegions || []).length;
      progAEl.textContent = `(${countA}/10 ô)`;
    }

    const scoreBEl = document.getElementById('gmmFsTeamBScore');
    if (scoreBEl && gameState.teamB) {
      const scoreB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      scoreBEl.textContent = `${scoreB} đ`;
    }
    const progBEl = document.getElementById('gmmFsTeamBProgress');
    if (progBEl && gameState.teamB) {
      const countB = (gameState.teamB.unlockedRegions || []).length;
      progBEl.textContent = `(${countB}/10 ô)`;
    }
  }

  function toggleDecryptTimer() {
    if (gameState.isDecryptTimerRunning) {
      pauseDecryptTimer();
    } else {
      resumeDecryptTimer();
    }
  }

  function pauseDecryptTimer() {
    gameState.isDecryptTimerRunning = false;
    clearInterval(gameState.decryptTimerInterval);
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '▶️ Tiếp Tục';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '▶️ Tiếp Tục';
    if (typeof window.showToast === 'function') {
      window.showToast('⏸️ Đã tạm dừng đồng hồ tô tranh!', 'info');
    }
    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});
  }

  function resumeDecryptTimer() {
    gameState.isDecryptPhase = true;
    gameState.isDecryptTimerRunning = true;
    const btn = document.getElementById('gmmBtnStartDecrypt');
    if (btn) btn.textContent = '⏸️ Tạm Dừng';
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) fsBtn.textContent = '⏸️ Tạm Dừng';

    if (gameState.autoFsOnTimerStart && !gameState.isDecryptTimerFullscreenOpen) {
      openDecryptTimerFullscreen();
    }

    clearInterval(gameState.decryptTimerInterval);
    gameState.decryptTimerInterval = setInterval(() => {
      if (gameState.decryptTimeLeft > 0) {
        gameState.decryptTimeLeft--;
        updateDecryptTimerUI();

        if (gameState.decryptTimeLeft <= 5 && gameState.decryptTimeLeft > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(gameState.decryptTimeLeft);
          }
        }

        if (gameState.decryptTimeLeft === 0) {
          clearInterval(gameState.decryptTimerInterval);
          gameState.isDecryptTimerRunning = false;
          if (btn) btn.textContent = '🚀 Bắt Đầu Lại';
          if (fsBtn) fsBtn.textContent = '🚀 Bắt Đầu Lại';
          if (window.audioManager && typeof window.audioManager.playTimerBuzzer === 'function') {
            window.audioManager.playTimerBuzzer();
          }
          if (typeof window.showToast === 'function') {
            window.showToast('⏰ Hết giờ tô tranh! Hãy cùng chiêm ngưỡng tác phẩm của 2 đội!', 'info');
          }
        }
      }
    }, 1000);

    updateDecryptTimerUI();
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        seconds: gameState.decryptTimeLeft,
        totalSeconds: gameState.decryptTimeTotal || 300
      })
    }).catch(() => {});
  }

  function startDecryptPhase(seconds = 300) {
    gameState.isDecryptPhase = true;
    setDecryptDuration(seconds);
    resumeDecryptTimer();
    renderDecryptUI();
  }

  function extendDecryptTime(seconds = 30) {
    gameState.decryptTimeLeft = (gameState.decryptTimeLeft || 0) + seconds;
    gameState.decryptTimeTotal = (gameState.decryptTimeTotal || 300) + seconds;
    updateDecryptTimerUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã gia hạn thêm +${seconds} giây cho hai đội!`, 'success');
    }
    broadcastHostStateToServer();
    fetch('/api/gmm/decrypt-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', seconds })
    }).catch(() => {});
  }

  function openDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (!modal) return;
    gameState.isDecryptTimerFullscreenOpen = true;
    modal.style.display = 'flex';

    // Vẽ lại tranh & tiến độ 2 đội hiển thị trọn vẹn tức thì trên Fullscreen
    renderDecryptUI();
    updateProgressBar('teamA');
    updateProgressBar('teamB');

    // Cập nhật giao diện đồng bộ
    updateDecryptTimerUI();

    // Đồng bộ nút preset đang chọn
    const totalDuration = gameState.decryptTimeTotal || 300;
    [180, 300, 420].forEach(s => {
      const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
      if (fsBtn) fsBtn.classList.toggle('active', s === totalDuration);
    });

    // Đồng bộ nút Bắt đầu / Tạm dừng
    const fsBtn = document.getElementById('gmmBtnFsStartDecrypt');
    if (fsBtn) {
      if (gameState.isDecryptTimerRunning) {
        fsBtn.textContent = '⏸️ Tạm Dừng';
      } else if (gameState.decryptTimeLeft === 0) {
        fsBtn.textContent = '🚀 Bắt Đầu Lại';
      } else if (gameState.decryptTimeLeft < totalDuration) {
        fsBtn.textContent = '▶️ Tiếp Tục';
      } else {
        const mins = Math.round(totalDuration / 60);
        fsBtn.textContent = `🚀 Bắt Đầu (${mins}p)`;
      }
    }

    // Đưa trình duyệt vào chế độ toàn màn hình F11 nếu được phép
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function closeDecryptTimerFullscreen() {
    const modal = document.getElementById('gmmDecryptTimerFullscreenModal');
    if (modal) modal.style.display = 'none';
    gameState.isDecryptTimerFullscreenOpen = false;

    // Thoát Fullscreen trình duyệt nếu đang bật
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleAutoFsOnTimerStart(enabled) {
    gameState.autoFsOnTimerStart = Boolean(enabled);
    if (typeof window.showToast === 'function') {
      window.showToast(
        gameState.autoFsOnTimerStart
          ? '🖥️ Đã BẬT tự động phóng to Full màn hình khi bấm Bắt đầu!'
          : '🔲 Đã TẮT tự động phóng to Full màn hình khi bấm Bắt đầu.',
        'info'
      );
    }
  }

  function handleCellClick(teamKey, cellId, specificColor = null, isRemote = false) {
    const teamData = gameState[teamKey];
    if (!teamData) return;
    if (!teamData.coloredRegions) teamData.coloredRegions = {};

    // Lấy màu đang chọn của đội đó hoặc màu chỉ định
    const activeColor = specificColor || (teamKey === 'teamA' ? gameState.selectedColorA : gameState.selectedColorB) || '#dc2626';

    // Toggle màu hoặc xóa màu nếu ô đó đã tô màu này
    if (teamData.coloredRegions[cellId] === activeColor) {
      delete teamData.coloredRegions[cellId];
    } else {
      teamData.coloredRegions[cellId] = activeColor;
    }

    // Âm thanh tương tác
    if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
      window.audioManager.playPointerSpringSnap();
    }

    // Cập nhật giao diện giải mã
    renderDecryptUI();
    checkTeamCompletion(teamKey);
    updateProgressBar(teamKey);

    // Nếu học sinh tô từ điện thoại: gửi lên server
    if (isStudentMobileClient && !isRemote) {
      submitPaintFromMobile(cellId);
    } else if (!isRemote) {
      broadcastHostStateToServer();
    }
  }

  function handleRegionClick(teamKey, regionId, specificColor = null, isRemote = false) {
    handleCellClick(teamKey, regionId, specificColor, isRemote);
  }

  // Tô mẫu thử / giải mã nhanh toàn bộ các mảng chữ & biểu tượng "TRI ÂN THẦY CÔ 20/11"
  function autoColorDemo() {
    ['teamA', 'teamB'].forEach(tKey => {
      if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
        window.GiaiMaPuzzle.autoColorTargetCells(gameState[tKey]);
      }
      checkTeamCompletion(tKey);
      updateProgressBar(tKey);
    });

    renderDecryptUI();
    broadcastHostStateToServer();
    if (typeof window.showToast === 'function') {
      window.showToast('⚡ Đã tô giải mã mẫu hoàn thiện bức tranh “TRI ÂN THẦY CÔ 20/11” cho cả 2 đội!', 'success');
    }
  }

  function checkTeamCompletion(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let isAllColored = false;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      isAllColored = prog.isComplete;
    }

    // Hiệu ứng khích lệ khi đạt 50%
    if (percent >= 50 && !teamData.halfwayNotified) {
      teamData.halfwayNotified = true;
      if (typeof window.showToast === 'function') {
        window.showToast(`🔥 ${teamData.name} đã hoàn thành ${percent}% bức tranh! Sắp lộ diện thông điệp 20/11!`, 'info');
      }
    }

    // Hoàn thành 100%
    if (isAllColored && !teamData.completed) {
      teamData.completed = true;
      teamData.bonusScore = 10; // Thưởng 10 điểm
      teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

      // Pháo hoa ăn mừng
      if (typeof confetti === 'function') {
        confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
      }

      if (window.audioManager && typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }

      const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
        ? window.GiaiMaPuzzle.getActivePuzzle().title
        : 'TRI ÂN THẦY CÔ 20/11';
      const symbolText = `“${activeTitle}”`;

      if (typeof window.showToast === 'function') {
        window.showToast(`🎉 CHÚC MỪNG ${teamData.name} ĐÃ GIẢI MÃ THÀNH CÔNG BỨC TRANH BÍ ẨN ${symbolText} (+10 ĐIỂM)!`, 'success');
      }

      updateHeaderScores();
      broadcastHostStateToServer();
    }
  }

  // Thay đổi điểm thưởng BGK chấm cho từng đội (1 - 10 điểm)
  function onJudgeScoreChange(teamKey, value) {
    const score = Math.min(10, Math.max(1, parseInt(value, 10) || 10));
    if (!gameState[teamKey]) return;
    gameState[teamKey].selectedBonusScore = score;

    // Cập nhật text nút duyệt nếu đội chưa hoàn tất
    if (!gameState[teamKey].completed) {
      const btnText = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
      if (btnText) {
        btnText.textContent = `✅ Duyệt Tranh (+${score}đ)`;
      }
    }
  }

  // Hiệu ứng viền phát sáng màu vàng kim (Gold Glow Aura) 3 giây khi BGK bấm Duyệt Tranh
  function triggerGoldGlowAura(teamKey, displayName, score = 10) {
    const container = document.getElementById(`${teamKey}_canvasContainer`);
    const panel = container ? container.closest('.gmm-canvas-panel') : null;

    if (container) {
      container.classList.remove('gmm-approved-permanent');
      container.classList.add('gmm-gold-glow-active');
    }
    if (panel) {
      panel.classList.remove('gmm-approved-permanent');
      panel.classList.add('gmm-gold-glow-active');
    }

    // Đảm bảo không có bất kỳ con dấu hay phần tử nào che khuất khung tranh của học sinh
    const existingStamp = document.getElementById(`${teamKey}_goldStamp`);
    if (existingStamp) existingStamp.remove();

    // Cập nhật trạng thái nút duyệt tranh thành đã hoàn tất
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    if (btn) {
      btn.classList.add('approved');
      btn.disabled = true;
    }
    if (txt) {
      txt.textContent = `🌟 ĐÃ DUYỆT TRANH (+${score}đ)`;
    }

    // Pháo hoa vàng kim tung bay ăn mừng
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 180,
        spread: 95,
        origin: { x: teamKey === 'teamA' ? 0.3 : 0.7, y: 0.55 },
        colors: ['#facc15', '#fde047', '#eab308', '#ffffff', '#22c55e', '#38bdf8'],
        zIndex: 2147483647
      });
    }

    // Sau đúng 3 giây: Tắt hào quang cực mạnh, chuyển sang viền vàng kim bền vững
    setTimeout(() => {
      if (container) {
        container.classList.remove('gmm-gold-glow-active');
        container.classList.add('gmm-approved-permanent');
      }
      if (panel) {
        panel.classList.remove('gmm-gold-glow-active');
        panel.classList.add('gmm-approved-permanent');
      }
    }, 3000);
  }

  // Ban Giám Khảo xác nhận hoàn thành tô màu tranh trên bảng giấy (Điểm tùy chọn tối đa 10 điểm)
  function approvePaperArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (teamData.completed) {
      const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;
      if (typeof window.showToast === 'function') {
        window.showToast(`ℹ️ ${displayName} đã được xác nhận hoàn thành trước đó!`, 'info');
      }
      return;
    }

    // Đọc số điểm do BGK tùy chọn từ dropdown select (Tối đa 10đ)
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    const rawVal = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    const scoreToAdd = Math.min(10, Math.max(1, parseInt(rawVal, 10) || 10));

    teamData.completed = true;
    teamData.bonusScore = scoreToAdd;
    teamData.finishTime = new Date().toLocaleTimeString('vi-VN');

    // Khóa dropdown điểm sau khi đã duyệt
    if (selectEl) selectEl.disabled = true;

    // Hiển thị nút Chấm lại (Undo) để BGK sửa điểm nếu cần
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) undoBtn.style.display = 'inline-flex';

    // Tên đội hiển thị tùy chỉnh (ĐOÀN KẾT, LA BÀN TUỔI TRẺ...)
    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Tô đầy đủ các mảng trên màn hình để đồng bộ với tranh giấy
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
      window.GiaiMaPuzzle.autoColorTargetCells(teamData);
    }

    // Kích hoạt hiệu ứng hào quang vàng kim 3 giây rực rỡ + pháo hoa vàng gold
    triggerGoldGlowAura(teamKey, displayName, scoreToAdd);

    if (window.audioManager) {
      if (typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }
      // Nếu được 10 điểm tuyệt đối: Tự động phát tràng pháo tay vỗ tay rào rào của khán giả!
      if (scoreToAdd === 10 && typeof window.audioManager.playApplause === 'function') {
        setTimeout(() => {
          window.audioManager.playApplause();
        }, 350);
      }
    }

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';
    const symbolText = `“${activeTitle}”`;

    const applaudNotice = scoreToAdd === 10 ? ' 🌟 10 ĐIỂM TUYỆT ĐỐI! 👏 (Cả lớp vỗ tay rào rào)' : '';
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 BGK ĐÃ XÁC NHẬN ${displayName} HOÀN THÀNH TRANH GIẤY VÀ GIẢI MÃ THÀNH CÔNG BỨC TRANH ${symbolText} (+${scoreToAdd} ĐIỂM)!${applaudNotice}`, 'success');
    }

    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();
  }

  // Ban Giám Khảo hủy kết quả duyệt tranh để chấm lại điểm (Undo)
  function undoApproveArtwork(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    const displayName = (gameState.teamNames && gameState.teamNames[teamKey]) || teamData.name;

    // Hoàn tác trạng thái hoàn thành & điểm thưởng
    teamData.completed = false;
    teamData.bonusScore = 0;
    teamData.finishTime = null;

    // Mở khóa lại dropdown chọn điểm
    const selectEl = document.getElementById(`${teamKey}_customScoreSelect`);
    if (selectEl) {
      selectEl.disabled = false;
    }

    // Khôi phục nút duyệt tranh về ban đầu
    const btn = document.getElementById(teamKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
    const txt = document.getElementById(teamKey === 'teamA' ? 'gmmJudgeBtnTextA' : 'gmmJudgeBtnTextB');
    const currentScore = selectEl ? selectEl.value : (teamData.selectedBonusScore || 10);
    if (btn) {
      btn.classList.remove('approved');
      btn.disabled = false;
    }
    if (txt) {
      txt.textContent = `✅ Duyệt Tranh (+${currentScore}đ)`;
    }

    // Ẩn nút Chấm lại
    const undoBtn = document.getElementById(`${teamKey}_undoJudgeBtn`);
    if (undoBtn) {
      undoBtn.style.display = 'none';
    }

    // Đảm bảo dọn sạch con dấu nếu có
    const stamp = document.getElementById(`${teamKey}_goldStamp`);
    if (stamp) stamp.remove();

    const container = document.getElementById(`${teamKey}_canvasContainer`);
    if (container) {
      container.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }
    const panel = container ? container.closest('.gmm-canvas-panel') : null;
    if (panel) {
      panel.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
    }

    // Cập nhật lại giao diện và điểm số
    updateHeaderScores();
    renderDecryptUI();
    updateProgressBar(teamKey);
    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast(`↩️ Đã hủy duyệt tranh ${displayName}! Thầy/Cô có thể chọn lại số điểm và bấm Duyệt Tranh.`, 'info');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  function updateProgressBar(teamKey) {
    const teamData = gameState[teamKey];
    if (!teamData) return;

    let percent = 0;
    let current = 0;
    let total = 35;

    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function') {
      const prog = window.GiaiMaPuzzle.calculateProgress(teamData);
      percent = prog.percent;
      current = prog.colored;
      total = prog.total;
    } else {
      current = Math.min(Object.keys(teamData.coloredRegions || {}).length, 10);
      percent = Math.round((current / 10) * 100);
      total = 10;
    }

    const fillEl = document.getElementById(`${teamKey}_progressFill`);
    const textEl = document.getElementById(`${teamKey}_progressText`);
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `${percent}% (${current}/${total} mảng)`;

    // Cập nhật đồng bộ trên Đấu Trường Fullscreen
    const fsFillEl = document.getElementById(`${teamKey}_fsProgressFill`);
    const fsTextEl = document.getElementById(`${teamKey}_fsProgressText`);
    if (fsFillEl) fsFillEl.style.width = `${percent}%`;
    if (fsTextEl) fsTextEl.textContent = `${percent}% (${current}/${total} mảng)`;
  }

  // ============================================================================
  // XUẤT PHIẾU MA TRẬN TRANH KHỔ GIẤY A4 NẰM NGANG (PDF & WORD)
  // ============================================================================

  let exportPreviewActivePage = 1;

  function switchExportPreviewPage(pageNum) {
    exportPreviewActivePage = pageNum;
    const tab1 = document.getElementById('gmmTabPreviewPage1');
    const tab2 = document.getElementById('gmmTabPreviewPage2');
    if (tab1) tab1.classList.toggle('active', pageNum === 1);
    if (tab2) tab2.classList.toggle('active', pageNum === 2);
    updateExportPreview();
  }

  function getCleanPrintSvg(isSolvedAnswerKey = false) {
    if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.renderSvgMatrix === 'function') {
      return window.GiaiMaPuzzle.renderSvgMatrix('print_sheet', {}, {
        isPrint: true,
        isSolvedAnswerKey: isSolvedAnswerKey
      });
    }
    return '';
  }

  function buildAnswerKeyTableHtml(isForWord = false) {
    const list = (questionsList && questionsList.length > 0) ? questionsList : DEFAULT_QUESTIONS;
    const letters = ['A', 'B', 'C', 'D'];
    const rows = list.map((q, idx) => {
      const char = letters[q.correct] || 'A';
      const optText = (q.options && q.options[q.correct]) ? q.options[q.correct] : '';
      const shortOpt = optText.length > 55 ? optText.substring(0, 55) + '...' : optText;
      const coord = q.coordinate ? q.coordinate.replace('Mã ', '') : `${idx + 1}${char}`;
      const colorDot = q.coordinate && q.coordinate.includes('Đỏ') ? '#dc2626'
                     : q.coordinate && q.coordinate.includes('cam') ? '#f59e0b'
                     : q.coordinate && q.coordinate.includes('dương') ? '#2563eb'
                     : q.coordinate && q.coordinate.includes('sen') ? '#ec4899'
                     : q.coordinate && q.coordinate.includes('lục') ? '#10b981'
                     : '#eab308';
      return `
        <tr style="${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; text-align: center; font-weight: bold; width: 38px;">C${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; text-align: center; font-weight: 900; color: #dc2626; width: 32px; font-size: 10.5pt;">${char}</td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 4px; font-weight: bold; width: 75px; white-space: nowrap;">
            <span style="display: inline-block; width: 9px; height: 9px; background: ${colorDot}; border-radius: 2px; margin-right: 3px;"></span>${coord}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 2.5px 5px; font-size: ${isForWord ? '8.5pt' : '8.2pt'}; line-height: 1.25;">${shortOpt}</td>
        </tr>
      `;
    }).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-family: inherit; margin-bottom: 4px;">
        <thead>
          <tr style="background: #e2e8f0; font-weight: bold;">
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: center;">Câu</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: center;">Đ/A</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: left;">Mã Ô Màu</th>
            <th style="border: 1px solid #94a3b8; padding: 3px; font-size: 8.5pt; text-align: left;">Nội dung phương án chuẩn</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function buildBgkRubricHtml(isForWord = false) {
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: ${isForWord ? '8.5pt' : '8pt'}; border: 1.5px solid #000; font-family: inherit;">
        <tr style="background: #f1f5f9; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #94a3b8; padding: 3px;">Tiêu chí chấm điểm Ban Giám Khảo</td>
          <td style="border: 1px solid #94a3b8; padding: 3px; width: 85px; color: #dc2626;">ĐỘI 1 (ĐỘI A)</td>
          <td style="border: 1px solid #94a3b8; padding: 3px; width: 85px; color: #2563eb;">ĐỘI 2 (ĐỘI B)</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 2px 4px;">1. Đúng ô màu tương ứng câu hỏi (+1đ/câu đúng)</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 2px 4px;">2. Thẩm mỹ tranh, không lem, đều màu bút dạ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">....... /10đ</td>
        </tr>
        <tr style="font-weight: bold; background: #fef08a;">
          <td style="border: 1px solid #94a3b8; padding: 3px 4px;">TỔNG ĐIỂM CHUNG CUỘC (Tối đa 20 điểm)</td>
          <td style="border: 1px solid #94a3b8; text-align: center; font-size: 9.5pt;">....... /20đ</td>
          <td style="border: 1px solid #94a3b8; text-align: center; font-size: 9.5pt;">....... /20đ</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #94a3b8; padding: 3px 6px; font-style: italic; text-align: right; font-size: 7.8pt;">
            Chữ ký Giám khảo 1: ........................................ • Giám khảo 2: ........................................
          </td>
        </tr>
      </table>
    `;
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

  function formatTextLines(text, defaultText) {
    const raw = (text && text.trim()) ? text.trim() : defaultText;
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.join('<br>');
  }

  function getExportFormData() {
    const schoolInput = document.getElementById('gmmExportSchoolName');
    const titleInput = document.getElementById('gmmExportTitle');
    const teamInput = document.getElementById('gmmExportTeamLabel');
    const schoolLogo = getExportSchoolLogo();

    const activePuzzle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : null;
    const defaultTitle = activePuzzle && activePuzzle.title ? activePuzzle.title : 'TRI ÂN THẦY CÔ 20/11';

    const defaultSchool = 'TRƯỜNG THCS TÂN HẢI\nHOẠT ĐỘNG DẠY HỌC TÍCH CỰC';
    const defaultTitleStr = 'PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH BÍ ẨN\nCHỦ ĐỀ: KỸ NĂNG SỐNG & HỌC TẬP';
    const defaultTeam = 'ĐỘI THI: .........................\nLỚP: .......... • THỜI GIAN: .....................';

    return {
      schoolName: schoolInput ? schoolInput.value : defaultSchool,
      schoolNameHtml: formatTextLines(schoolInput ? schoolInput.value : '', defaultSchool),
      title: titleInput ? titleInput.value : defaultTitleStr,
      titleHtml: formatTextLines(titleInput ? titleInput.value : '', defaultTitleStr),
      teamLabel: teamInput ? teamInput.value : defaultTeam,
      teamLabelHtml: formatTextLines(teamInput ? teamInput.value : '', defaultTeam),
      schoolLogo: schoolLogo,
      safeTitle: defaultTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')
    };
  }

  function buildDynamicLegendGroups() {
    const active = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle()
      : null;
    const rules = (active && active.colorRules) ? active.colorRules : {};
    const groups = {};
    Object.keys(rules)
      .sort((a, b) => ((rules[a] && rules[a].qNum) || 0) - ((rules[b] && rules[b].qNum) || 0))
      .forEach(code => {
        const r = rules[code];
        if (!r) return;
        const key = `${r.color || '#dc2626'}|${r.name || 'Màu bút dạ'}`;
        if (!groups[key]) {
          groups[key] = { color: r.color || '#dc2626', name: r.name || 'Màu bút dạ', qNums: [] };
        }
        if (r.qNum && !groups[key].qNums.includes(r.qNum)) {
          groups[key].qNums.push(r.qNum);
        }
      });
    return Object.values(groups);
  }

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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${data.title} - Khổ A4 Nằm Ngang</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 4mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
          }
          .a4-page {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 4px;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .header-left {
            font-size: 10pt;
            font-weight: bold;
            line-height: 1.3;
            text-transform: uppercase;
            max-width: 33%;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .header-center h1 {
            font-size: 15pt;
            margin: 0;
            text-transform: uppercase;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .header-center p {
            font-size: 9pt;
            margin: 2px 0 0;
            font-style: italic;
          }
          .header-right {
            border: 1.5px dashed #000;
            padding: 4px 10px;
            font-size: 9.5pt;
            font-weight: bold;
            border-radius: 4px;
            line-height: 1.35;
            min-width: 180px;
            text-align: left;
          }
          .legend-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            background: #f8fafc;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9pt;
            margin-bottom: 4px;
            border: 1.5px solid #000;
            justify-content: center;
            align-items: center;
          }
          .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-weight: bold;
          }
          .color-dot {
            width: 13px;
            height: 13px;
            border-radius: 3px;
            display: inline-block;
            border: 1px solid #000;
          }
          .matrix-canvas-box {
            width: 100%;
            flex: 1;
            min-height: 0;
            aspect-ratio: 800 / 520;
            max-height: calc(100vh - 105px);
            margin: 0 auto;
            border: 2px solid #000;
            border-radius: 4px;
            overflow: hidden;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .matrix-canvas-box svg {
            width: 100%;
            height: 100%;
            display: block;
          }
          .print-footer {
            margin-top: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            border-top: 1px solid #000;
            padding-top: 3px;
            font-style: italic;
          }
          .no-print {
            background: #0284c7;
            color: #ffffff;
            padding: 10px 18px;
            font-family: system-ui, sans-serif;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .no-print button {
            background: #ffffff;
            color: #0369a1;
            font-weight: 800;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 10pt;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .no-print button:hover {
            background: #f0f9ff;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            .a4-page {
              height: 100%;
              padding: 0;
            }
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <strong>📄 CHẾ ĐỘ XUẤT FILE PDF / IN A4 NẰM NGANG (${includeKey ? '2 TRANG: PHIẾU THI + ĐÁP ÁN BGK' : 'FULL TRANH'})</strong><br>
            <span style="font-size: 0.85rem; opacity: 0.95;">
              📌 Mẹo: Tại mục <strong>Máy in (Destination)</strong> -> Chọn <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> -> Chọn <strong>Khổ giấy A4, Hướng ngang (Landscape), Căn lề Tối thiểu (Minimum/None)</strong>!
            </span>
          </div>
          <button onclick="window.print()">
            🖨️ Bấm Vào Đây Để In / Lưu Dạng PDF (Ctrl+P)
          </button>
        </div>

        <!-- ==================== TRANG 1: PHIẾU HỌC SINH TÔ MÀU ==================== -->
        <div class="a4-page">
          <div class="print-header">
            <div class="header-left" style="display: flex; align-items: center; gap: 8px;">
              ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo Trường" style="height: 52px; width: 52px; object-fit: contain; border-radius: 4px; flex-shrink: 0;" />` : ''}
              <div>
                ${data.schoolNameHtml}
              </div>
            </div>
            <div class="header-center">
              <h1>${data.titleHtml}</h1>
              <p>Hoạt động giáo dục kỹ năng sống - Học sinh tô màu giải mã thông điệp bí mật</p>
            </div>
            <div class="header-right">
              ${data.teamLabelHtml}
            </div>
          </div>

          <div class="legend-bar">
            <span style="font-weight: 900;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</span>
            ${buildDynamicLegendGroups().map(g => `<span class="legend-item"><span class="color-dot" style="background: ${g.color};"></span> Câu ${g.qNums.join(', ')}: ${g.name}</span>`).join('')}
          </div>

          <div class="matrix-canvas-box">
            ${printSvg}
          </div>

          <div class="print-footer">
            <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
            <span>Điểm số: ......... / Chữ ký BGK: ................</span>
          </div>
        </div>

        ${includeKey ? `
        <!-- ==================== TRANG 2: BẢN ĐÁP ÁN MÀU BAN GIÁM KHẢO ==================== -->
        <div class="page-break"></div>
        <div class="a4-page" style="padding-top: 6px;">
          <div class="print-header" style="border-bottom: 2px solid #b91c1c;">
            <div class="header-left" style="color: #991b1b; display: flex; align-items: center; gap: 8px;">
              ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo Trường" style="height: 52px; width: 52px; object-fit: contain; border-radius: 4px; flex-shrink: 0;" />` : ''}
              <div>
                ${data.schoolNameHtml}<br>
                <span style="font-size: 8.5pt; color: #b91c1c; font-weight: bold;">HỘI ĐỒNG BAN GIÁM KHẢO</span>
              </div>
            </div>
            <div class="header-center">
              <h1 style="color: #991b1b; font-size: 14pt;">${data.titleHtml}</h1>
              <p style="color: #475569; font-weight: bold;">(Dành riêng cho Ban Giám Khảo đối chiếu kết quả 2 đội thi)</p>
            </div>
            <div class="header-right" style="border-color: #b91c1c; background: #fff1f2;">
              TIÊU CHÍ CHẤM ĐIỂM:<br>
              • Đúng ô màu: <strong>10đ</strong><br>
              • Thẩm mỹ & Đều màu: <strong>10đ</strong><br>
              • TỔNG ĐIỂM: <strong>20đ</strong>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex: 1; min-height: 0; align-items: stretch; margin-top: 4px;">
            <!-- Cột trái: Tranh màu chuẩn -->
            <div style="flex: 1.15; border: 2px solid #b91c1c; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
              <div style="background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 9pt; padding: 3px 6px; text-align: center; border-bottom: 1px solid #f87171;">
                🎨 BỨC TRANH MÀU HOÀN THIỆN ĐỐI CHIẾU (CHUẨN 100%)
              </div>
              <div class="matrix-canvas-box" style="flex: 1; border: none; aspect-ratio: auto; max-height: none;">
                ${answerKeySvg}
              </div>
            </div>

            <!-- Cột phải: Bảng 10 câu & Phiếu chấm điểm -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: bold; font-size: 9pt; color: #0f172a; margin-bottom: 3px;">
                  📋 BẢNG ĐÁP ÁN 10 CÂU & TỌA ĐỘ MÃ MÀU:
                </div>
                ${buildAnswerKeyTableHtml(false)}
              </div>

              <div>
                <div style="font-weight: bold; font-size: 9pt; color: #0f172a; margin-top: 3px; margin-bottom: 3px;">
                  ⚖️ PHIẾU GHI ĐIỂM BAN GIÁM KHẢO:
                </div>
                ${buildBgkRubricHtml(false)}
              </div>
            </div>
          </div>

          <div class="print-footer" style="margin-top: 4px; font-size: 8pt;">
            <span>* Lưu ý BGK: Mỗi câu trả lời đúng sẽ mở ra các ô có mã tương ứng. Các ô mã gây nhiễu nếu bị tô màu sẽ bị trừ điểm theo thang lỗi.</span>
            <span>Hệ thống Nền Tảng Lớp Học Vui Nhộn - Giải Mã Bí Mật 2026</span>
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;

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
      // Chuyển vector SVG sang PNG độ phân giải cực nét 2400x1560 (300 DPI)
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

        section2Html = `
          <br clear="all" style="page-break-before:always; mso-break-type:section-break">
          <div class="Section2">
            <table class="header-table" style="border-bottom: 2pt solid #b91c1c;">
              <tr>
                <td style="width: 32%; font-weight: bold; font-size: 10.5pt; text-transform: uppercase; color: #991b1b;">
                  <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                      ${data.schoolLogo ? `
                      <td style="vertical-align: middle; padding-right: 6pt; border: none;">
                        <img src="${data.schoolLogo}" width="45" height="45" style="width: 45pt; height: 45pt; object-fit: contain;" alt="Logo" />
                      </td>` : ''}
                      <td style="vertical-align: middle; border: none;">
                        ${data.schoolNameHtml}<br>
                        <span style="font-size: 9pt; color: #b91c1c; font-weight: normal;">HỘI ĐỒNG BAN GIÁM KHẢO</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 40%; text-align: center;">
                  <h1 style="font-size: 13.5pt; margin: 0; text-transform: uppercase; font-weight: bold; color: #991b1b;">
                    ${data.titleHtml}
                  </h1>
                  <div style="font-size: 9pt; font-style: italic; color: #475569;">
                    Bản đáp án chuẩn dành riêng cho Ban Giám Khảo đối chiếu kết quả
                  </div>
                </td>
                <td style="width: 28%; text-align: right;">
                  <div style="display: inline-block; border: 1.5pt solid #b91c1c; background: #fff1f2; padding: 3pt 8pt; font-size: 9pt; font-weight: bold; text-align: left;">
                    TIÊU CHÍ CHẤM:<br>
                    • Đúng ô màu: <strong>10đ</strong><br>
                    • Thẩm mỹ đều màu: <strong>10đ</strong><br>
                    • TỔNG ĐIỂM: <strong>20đ</strong>
                  </div>
                </td>
              </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 4pt;">
              <tr>
                <td style="width: 53%; vertical-align: top; padding-right: 8pt;">
                  <div style="border: 1.5pt solid #b91c1c; text-align: center; padding: 2pt; background: #fff;">
                    <div style="background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 9pt; padding: 2pt 4pt; margin-bottom: 3pt;">
                      🎨 BỨC TRANH MÀU HOÀN THIỆN ĐỐI CHIẾU (CHUẨN 100%)
                    </div>
                    ${imageHtmlPage2}
                  </div>
                </td>
                <td style="width: 47%; vertical-align: top;">
                  <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3pt; color: #0f172a;">
                    📋 BẢNG ĐÁP ÁN 10 CÂU & TỌA ĐỘ MÃ MÀU:
                  </div>
                  ${buildAnswerKeyTableHtml(true)}

                  <div style="font-weight: bold; font-size: 9.5pt; margin-top: 4pt; margin-bottom: 2pt; color: #0f172a;">
                    ⚖️ PHIẾU GHI ĐIỂM BAN GIÁM KHẢO:
                  </div>
                  ${buildBgkRubricHtml(true)}
                </td>
              </tr>
            </table>

            <table class="footer-table" style="margin-top: 6pt;">
              <tr>
                <td style="text-align: left;">
                  * Ban Giám Khảo đối chiếu tranh tô màu của 2 đội với bức tranh mẫu chuẩn bên trái để ghi nhận điểm số.
                </td>
                <td style="text-align: right; width: 35%; white-space: nowrap;">
                  Hội đồng chấm thi - Lớp học vui nhộn 2026
                </td>
              </tr>
            </table>
          </div>
        `;
      }

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${data.title}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 841.9pt 595.3pt; /* A4 Landscape: 297mm x 210mm */
              mso-page-orientation: landscape;
              margin: 15pt 20pt 15pt 20pt;
              mso-header-margin: 0pt;
              mso-footer-margin: 0pt;
            }
            div.Section1 {
              page: Section1;
            }
            @page Section2 {
              size: 841.9pt 595.3pt; /* A4 Landscape: 297mm x 210mm */
              mso-page-orientation: landscape;
              margin: 15pt 20pt 15pt 20pt;
              mso-header-margin: 0pt;
              mso-footer-margin: 0pt;
            }
            div.Section2 {
              page: Section2;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 11pt;
              color: #000000;
              margin: 0;
              padding: 0;
            }
            table.header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2pt solid #000000;
              margin-bottom: 5pt;
            }
            table.legend-table {
              width: 100%;
              border-collapse: collapse;
              border: 1.5pt solid #000000;
              background: #f8fafc;
              margin-bottom: 5pt;
            }
            table.legend-table td {
              padding: 3pt 6pt;
              font-size: 9.5pt;
              text-align: center;
              border: 1pt solid #cbd5e1;
            }
            .matrix-img {
              width: 100%;
              max-width: 100%;
              height: auto;
              border: 1.5pt solid #000000;
              display: block;
              margin: 0 auto;
            }
            table.footer-table {
              width: 100%;
              border-collapse: collapse;
              border-top: 1pt solid #000000;
              margin-top: 5pt;
              font-size: 9pt;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            <table class="header-table">
              <tr>
                <td style="width: 32%; font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">
                  <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                      ${data.schoolLogo ? `
                      <td style="vertical-align: middle; padding-right: 6pt; border: none;">
                        <img src="${data.schoolLogo}" width="45" height="45" style="width: 45pt; height: 45pt; object-fit: contain;" alt="Logo" />
                      </td>` : ''}
                      <td style="vertical-align: middle; border: none;">
                        ${data.schoolNameHtml}
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 38%; text-align: center;">
                  <h1 style="font-size: 13.5pt; margin: 0; text-transform: uppercase; font-weight: bold;">
                    ${data.titleHtml}
                  </h1>
                  <div style="font-size: 8.5pt; font-style: italic; margin-top: 2pt;">
                    Bức tranh ma trận ô màu đen trắng dành cho học sinh tô màu
                  </div>
                </td>
                <td style="width: 30%; text-align: right;">
                  <div style="display: inline-block; border: 1.5pt dashed #000; padding: 3pt 8pt; font-size: 9.5pt; font-weight: bold; text-align: left;">
                    ${data.teamLabelHtml}
                  </div>
                </td>
              </tr>
            </table>

            <table class="legend-table">
              <tr>
                <td style="font-weight: bold; background: #e2e8f0; width: 16%;">👉 MÃ MÀU TÔ:</td>
                ${buildDynamicLegendGroups().map(g => `<td><strong style="color: ${g.color};">■ ${g.name}:</strong> C${g.qNums.join(', C')}</td>`).join('')}
              </tr>
            </table>

            <div style="text-align: center; margin: 2pt 0;">
              ${imageHtmlPage1}
            </div>

            <table class="footer-table">
              <tr>
                <td style="text-align: left;">
                  * Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.
                </td>
                <td style="text-align: right; width: 30%; white-space: nowrap;">
                  Điểm số: ......... / Chữ ký BGK: ................
                </td>
              </tr>
            </table>
          </div>

          ${section2Html}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + wordHtml], {
        type: 'application/msword;charset=utf-8'
      });
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

  function formatMinutesSeconds(totalSec) {
    const s = Math.max(0, Math.floor(totalSec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  let lastHeartbeatSec = -1;

  function updateMatchTimerUI() {
    const digits = document.getElementById('gmmMatchTimerDigits');
    if (digits) {
      digits.textContent = formatMinutesSeconds(gameState.timerSeconds);

      // Phân tầng hiệu ứng đổi màu đồng hồ theo từng chặng thời gian:
      // - > 30s: Xanh ngọc Emerald bình thường
      // - 11s -> 30s: Vàng hổ phách Amber cảnh báo
      // - <= 10s: Đỏ rực lửa + Nhấp nháy nhịp tim dồn dập
      digits.classList.remove('warning-amber', 'urgent', 'heartbeat-pulse');

      if (gameState.timerSeconds <= 10 && gameState.timerSeconds > 0) {
        digits.classList.add('urgent', 'heartbeat-pulse');
        if (gameState.isTimerRunning && lastHeartbeatSec !== gameState.timerSeconds) {
          lastHeartbeatSec = gameState.timerSeconds;
          if (window.audioManager && typeof window.audioManager.playHeartbeat === 'function') {
            window.audioManager.playHeartbeat(gameState.timerSeconds);
          }
        }
      } else if (gameState.timerSeconds <= 30 && gameState.timerSeconds > 10) {
        digits.classList.add('warning-amber');
        lastHeartbeatSec = -1;
      } else {
        if (gameState.timerSeconds === 0) {
          digits.classList.add('urgent');
        }
        lastHeartbeatSec = -1;
      }
    }
  }

  function recalculateTeamScore(teamKey) {
    const team = gameState[teamKey];
    if (!team) return;
    const oldUnlocked = Array.isArray(team.unlockedRegions) ? [...team.unlockedRegions] : [];
    team.score = 0;
    team.unlockedRegions = [];
    const newItems = [];
    questionsList.forEach((q, idx) => {
      const ans = team.answers ? team.answers[q.id] : undefined;
      if (ans === q.correct) {
        team.score += 1;
        const regId = q.regionId || `reg_${idx + 1}`;
        if (!team.unlockedRegions.includes(regId)) {
          team.unlockedRegions.push(regId);
          if (!oldUnlocked.includes(regId)) {
            newItems.push(regId);
          }
        }
      }
    });
    updateHeaderScores();
    newItems.forEach(regId => triggerPulseGlow(teamKey, regId));
  }

  function renderDualArena() {
    updateMatchTimerUI();
    updateStealthButtonUI();

    // Cập nhật trạng thái nút Bắt đầu / Tạm dừng / Ván Mới trong Đấu trường
    const startArenaBtn = document.getElementById('gmmBtnStartArena');
    const pauseBtn = document.getElementById('gmmBtnMatchPause');
    const restartArenaBtn = document.getElementById('gmmBtnRestartArena');
    const durationGroup = document.getElementById('gmmDurationPresetGroup');

    if (startArenaBtn) {
      if (!gameState.isMatchStarted) {
        startArenaBtn.style.display = 'inline-flex';
        startArenaBtn.innerHTML = '<span>🚀 BẮT ĐẦU TRÒ CHƠI</span>';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (durationGroup) durationGroup.style.display = 'flex';
      } else {
        startArenaBtn.style.display = 'none';
        if (pauseBtn) {
          pauseBtn.style.display = 'inline-flex';
          pauseBtn.innerHTML = gameState.isTimerRunning
            ? '<span>⏸️ Tạm Dừng</span>'
            : '<span>▶️ Tiếp Tục</span>';
        }
      }
    }

    if (restartArenaBtn) {
      const hasAnyProgress = Boolean(
        gameState.isMatchStarted ||
        gameState.teamA?.isLocked ||
        gameState.teamB?.isLocked ||
        Object.keys(gameState.teamA?.answers || {}).length > 0 ||
        Object.keys(gameState.teamB?.answers || {}).length > 0
      );
      restartArenaBtn.style.display = hasAnyProgress ? 'inline-flex' : 'none';
    }

    // Đồng bộ nút trên thanh nổi Sân Khấu Máy Chiếu
    const floatStartBtn = document.getElementById('gmmStageFloatStartBtn');
    const floatPauseBtn = document.getElementById('gmmStageFloatPauseBtn');
    if (floatStartBtn && floatPauseBtn) {
      if (!gameState.isMatchStarted) {
        floatStartBtn.style.display = 'inline-flex';
        floatPauseBtn.style.display = 'none';
      } else {
        floatStartBtn.style.display = 'none';
        floatPauseBtn.style.display = 'inline-flex';
      }
    }

    // Hiển thị nút mở sang Tab 4 Tô Màu khi cả 2 đội đã hoàn thành/chốt bài
    const bothTeamsLocked = Boolean(gameState.teamA?.isLocked && gameState.teamB?.isLocked);
    const nextToDecryptBtn = document.getElementById('gmmBtnNextToDecrypt');
    if (nextToDecryptBtn) {
      nextToDecryptBtn.style.display = bothTeamsLocked ? 'inline-flex' : 'none';
    }
    const floatNextBtn = document.getElementById('gmmStageFloatNextBtn');
    if (floatNextBtn) {
      floatNextBtn.style.display = bothTeamsLocked ? 'inline-flex' : 'none';
    }
    if (bothTeamsLocked) {
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (floatPauseBtn) floatPauseBtn.style.display = 'none';
    }

    ['teamA', 'teamB'].forEach(tKey => {
      const isTeamA = tKey === 'teamA';
      const letter = isTeamA ? 'A' : 'B';
      const team = gameState[tKey];
      if (!team) return;

      if (team.isLocked) {
        recalculateTeamScore(tKey);
      }

      const scoreEl = document.getElementById(`gmmScoreTeam${letter}`);
      if (scoreEl) scoreEl.textContent = team.score + (team.bonusScore || 0);

      const answeredCount = Object.keys(team.answers || {}).length;
      const progEl = document.getElementById(`gmmProgressTeam${letter}`);
      if (progEl) progEl.textContent = `${answeredCount}/${questionsList.length}`;

      const fillEl = document.getElementById(`gmmProgressFillTeam${letter}`);
      if (fillEl) fillEl.style.width = `${(answeredCount / questionsList.length) * 100}%`;

      const statusBadge = document.getElementById(`gmmStatusBadgeTeam${letter}`);
      if (statusBadge) {
        if (team.isLocked) {
          const timeBadgeStr = team.finishTimeFormatted ? ` (⏱️ ${team.finishTimeFormatted})` : '';
          statusBadge.innerHTML = `✅ <span style="color: #34d399;">ĐÃ CHỐT NỘP BÀI${timeBadgeStr}</span>`;
        } else if (!gameState.isMatchStarted) {
          if (gameState.isCountdownRunning) {
            statusBadge.innerHTML = '🚀 <span style="color: #38bdf8;">Chuẩn bị bắt đầu...</span>';
          } else if (gameState.connectedTeams && gameState.connectedTeams[tKey]) {
            statusBadge.innerHTML = '🕒 <span style="color: #7dd3fc;">Đang chờ...</span>';
          } else {
            statusBadge.innerHTML = '🕒 <span style="color: #94a3b8;">Đang chờ...</span>';
          }
        } else if (answeredCount === questionsList.length) {
          statusBadge.innerHTML = '🎯 <span style="color: #38bdf8;">ĐÃ LÀM XONG 10 CÂU</span>';
        } else {
          statusBadge.innerHTML = '⏳ <span style="color: #fde047;">Đang làm bài...</span>';
        }
      }

      const unlockBtn = document.getElementById(`gmmBtnUnlockTeam${letter}`);
      if (unlockBtn) {
        unlockBtn.style.display = team.isLocked ? 'inline-flex' : 'none';
      }

      // Render 10 mini badges in #gmmQGridTeamA / #gmmQGridTeamB
      const gridEl = document.getElementById(`gmmQGridTeam${letter}`);
      if (gridEl) {
        gridEl.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        questionsList.forEach((q, idx) => {
          const badge = document.createElement('div');
          const myAns = team.answers ? team.answers[q.id] : undefined;
          const hasAns = (myAns !== undefined && myAns !== null);

          let badgeClass = 'gmm-team-q-badge';
          let badgeContent = `<span class="q-num">${idx + 1}</span>`;

          if (team.isLocked) {
            if (myAns === q.correct) {
              badgeClass += ' correct';
              badgeContent += `<span class="q-ans">✔</span>`;
            } else {
              badgeClass += ' wrong';
              badgeContent += `<span class="q-ans">✘</span>`;
            }
          } else if (hasAns) {
            badgeClass += ' answered';
            badgeContent += `<span class="q-ans">${letters[myAns]}</span>`;
          }

          badge.className = badgeClass;
          badge.innerHTML = badgeContent;
          badge.title = `Câu ${idx + 1}: ${hasAns ? 'Đã chọn [' + letters[myAns] + ']' : 'Chưa trả lời'}`;
          gridEl.appendChild(badge);
        });
      }

      // Render SVG Puzzle
      const puzzleWrap = document.getElementById(`gmmPuzzleTeam${letter}`);
      if (puzzleWrap) {
        puzzleWrap.innerHTML = generateSvgPuzzle(tKey);
      }

      const unlockedEl = document.getElementById(`gmmUnlockedCount${letter}`);
      if (unlockedEl) {
        unlockedEl.textContent = team.unlockedRegions ? team.unlockedRegions.length : 0;
      }
    });

    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
      window.GiaiMaLiveMonitor.renderHostPingIndicators();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
      window.GiaiMaTeacherKey.renderLiveQuizCards();
    }
  }

  function getConnectedTeams() {
    return gameState.connectedTeams || { teamA: false, teamB: false };
  }

  function getArenaLiveSnapshot() {
    return {
      isMatchStarted: Boolean(gameState.isMatchStarted),
      isStealthMode: Boolean(gameState.isStealthMode),
      connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
      questions: questionsList,
      teamA: gameState.teamA,
      teamB: gameState.teamB
    };
  }

  function getTeamAnsweredCount(teamKey) {
    if (!gameState[teamKey] || !gameState[teamKey].answers) return 0;
    return Object.keys(gameState[teamKey].answers).length;
  }

  function applyTeamUnlockOnHost(teamKey, preservedAnswers = null) {
    const team = gameState[teamKey];
    if (!team) return;
    team.isLocked = false;
    team.finishTime = null;
    team.finishTimeSeconds = null;
    team.finishTimeFormatted = null;
    team.score = 0;
    team.unlockedRegions = [];
    if (preservedAnswers && typeof preservedAnswers === 'object') {
      team.answers = Object.assign({}, preservedAnswers);
    }
    updateHeaderScores();
    renderDualArena();
  }

  function toggleMatchPause() {
    gameState.isTimerRunning = !gameState.isTimerRunning;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});

    const btn = document.getElementById('gmmBtnMatchPause');
    if (btn) {
      btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
    }
    updateStageFloatPauseBtn();
  }

  function addMatchSeconds(sec = 30) {
    gameState.timerSeconds = (gameState.timerSeconds || 0) + sec;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', seconds: sec })
    }).catch(() => {});

    updateMatchTimerUI();
    if (typeof window.showToast === 'function') {
      window.showToast(`⏱️ Đã cộng thêm ${sec} giây cho cả 2 đội!`, 'success');
    }
  }

  function addMatchMinute(sec = 60) {
    addMatchSeconds(sec);
  }

  function setMatchDuration(sec) {
    gameState.totalMatchSeconds = sec;
    gameState.timerSeconds = sec;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', seconds: sec, totalMatchSeconds: sec })
    }).catch(() => {});

    [60, 90, 120, 180].forEach(s => {
      const btn = document.getElementById(`gmmTimeBtn_${s}`);
      if (btn) btn.classList.toggle('primary', s === sec);
    });
    updateMatchTimerUI();
  }

  // Chốt kết quả trận đấu 10 câu trắc nghiệm, tính điểm, phát âm thanh chiến thắng, pháo hoa
  // LƯU Ý: Giữ nguyên ở Tab 3 để Giáo viên chủ động tổng kết, nhận xét, chỉ khi Giáo viên click mở Tab 4 thì mới chuyển
  function handleMatchConclusion(isManualTrigger = false) {
    gameState.isTimerRunning = false;
    gameState.teamA.isLocked = true;
    gameState.teamB.isLocked = true;

    // Dừng nhạc nền thi đấu
    stopBattleMusicUI(0.6);

    // Tính điểm và cập nhật giao diện Đấu trường
    recalculateTeamScore('teamA');
    recalculateTeamScore('teamB');
    renderDualArena();

    // Phát âm thanh ăn mừng chiến thắng
    if (window.audioManager) {
      if (typeof window.audioManager.playVictory === 'function') {
        window.audioManager.playVictory();
      } else if (typeof window.audioManager.playFanfare === 'function') {
        window.audioManager.playFanfare();
      }
    }

    // Bắn hiệu ứng pháo hoa rực rỡ
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (_e) {}
    }

    // Thông báo Toast hoàn thành phần thi 10 câu trắc nghiệm
    if (typeof window.showToast === 'function') {
      const msg = isManualTrigger
        ? '🔒 ĐÃ CHỐT KẾT QUẢ BÀI THI! 10 câu trắc nghiệm đã hoàn thành. Thầy/Cô mở Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.'
        : '⏰ HẾT GIỜ THI ĐẤU! Đã hoàn thành phần thi trắc nghiệm của 2 đội. Thầy/Cô mở Tab 4 (Tô Màu Giải Mã Tranh) khi sẵn sàng.';
      window.showToast(msg, 'success');
    }

    // Đồng bộ trạng thái khóa bài của 2 đội xuống máy chủ và điện thoại học sinh
    broadcastHostStateToServer();
  }

  function forceLockBothTeams() {
    if (!confirm('Thầy/Cô có chắc chắn muốn chốt kết quả và khóa bài làm của cả 2 đội ngay bây giờ không?\n\n(Hệ thống sẽ tổng kết điểm 10 câu trắc nghiệm. Thầy/Cô sẽ tự mở sang Tab tiếp theo khi sẵn sàng)')) {
      return;
    }
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' })
    }).catch(() => {});

    handleMatchConclusion(true);
  }

  function toggleBattleMusic() {
    if (!window.audioManager) return;
    const btn = document.getElementById('gmmBtnBattleMusic');
    const isPlaying = typeof window.audioManager.isBattleMusicPlaying === 'function' && window.audioManager.isBattleMusicPlaying();
    if (isPlaying) {
      window.audioManager.stopBattleMusic();
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
      }
      if (typeof window.showToast === 'function') window.showToast('🔇 Đã tắt nhạc nền thi đấu', 'info');
    } else {
      const ok = window.audioManager.startBattleMusic();
      if (ok) {
        if (btn) {
          btn.classList.add('active');
          btn.innerHTML = '<span>🔊 Nhạc Thi Đấu: BẬT</span>';
        }
        updateBattleMusicUI();
        const genre = (typeof window.audioManager.getBattleMusicGenre === 'function') ? window.audioManager.getBattleMusicGenre() : 'epic';
        const genreName = genre === 'chill' ? 'Nhẹ Nhàng Tập Trung' : 'Sôi Động Kịch Tính';
        if (typeof window.showToast === 'function') window.showToast(`🎵 Đã bật nhạc nền thi đấu [${genreName}]!`, 'success');
      }
    }
  }

  function toggleBattleMusicGenre() {
    if (!window.audioManager) return;
    const current = (typeof window.audioManager.getBattleMusicGenre === 'function')
      ? window.audioManager.getBattleMusicGenre()
      : 'epic';
    const nextGenre = (current === 'epic') ? 'chill' : 'epic';
    if (typeof window.audioManager.setBattleMusicGenre === 'function') {
      window.audioManager.setBattleMusicGenre(nextGenre);
    }
    updateBattleMusicUI();
    if (typeof window.showToast === 'function') {
      if (nextGenre === 'chill') {
        window.showToast('☕ Đã đổi nhạc nền: [Nhẹ Nhàng Tập Trung] (84 BPM Lofi Chill)', 'info');
      } else {
        window.showToast('🔥 Đã đổi nhạc nền: [Sôi Động Kịch Tính] (124 BPM Epic Battle)', 'info');
      }
    }
  }

  function updateBattleMusicUI() {
    const modeBtn = document.getElementById('gmmBtnBattleMusicMode');
    if (!modeBtn) return;
    const isChill = window.audioManager && typeof window.audioManager.getBattleMusicGenre === 'function' && window.audioManager.getBattleMusicGenre() === 'chill';
    modeBtn.className = `gmm-btn-match-ctrl music-mode ${isChill ? 'chill' : 'epic'}`;
    modeBtn.innerHTML = isChill
      ? '<span>☕ Giai Điệu: Nhẹ Nhàng</span>'
      : '<span>🔥 Giai Điệu: Kịch Tính</span>';
  }

  function stopBattleMusicUI(fadeTime = 1.5) {
    if (window.audioManager && typeof window.audioManager.stopBattleMusic === 'function') {
      window.audioManager.stopBattleMusic(fadeTime);
    }
    const btn = document.getElementById('gmmBtnBattleMusic');
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<span>🎵 Nhạc Thi Đấu: Tắt</span>';
    }
  }

  // Khởi tạo sạch sẽ dữ liệu phiên thi đấu mới (dùng chung khi bắt đầu ván mới hoặc chơi lại)
  function prepareFreshMatchSession() {
    gameState.sessionId = Math.max(Date.now(), (Number(gameState.sessionId) || 0) + 1);
    gameState.currentQIndex = 0;
    gameState.isMatchStarted = false;
    gameState.isTimerRunning = false;
    gameState.isQuestionLocked = false;
    gameState.isAnswerRevealed = false;
    gameState.isDecryptPhase = false;
    gameState.isDecryptTimerRunning = false;
    clearInterval(gameState.decryptTimerInterval);
    gameState.newlyUnlocked = { teamA: [], teamB: [] };
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.resetLiveQuizTracking === 'function') {
      window.GiaiMaTeacherKey.resetLiveQuizTracking();
    }

    const savedDuration = gameState.totalMatchSeconds || 120;
    gameState.totalMatchSeconds = savedDuration;
    gameState.timerSeconds = savedDuration;

    ['teamA', 'teamB'].forEach(tKey => {
      const team = gameState[tKey];
      if (!team) return;
      team.score = 0;
      team.bonusScore = 0;
      team.answers = {};
      team.isLocked = false;
      team.unlockedRegions = [];
      team.coloredRegions = {};
      team.completed = false;
      team.finishTime = null;
      team.finishTimeSeconds = null;
      team.finishTimeFormatted = null;
      team.artworkPhoto = null;
      team.photoTimestamp = null;
      team.hasArtworkPhoto = false;
      team.photoRotation = 0;
      team.photoTilt = 0;
      team.isAiEnhanced = true;
      team.photoViewMode = 'svg';

      setArtworkViewMode(tKey, 'svg');
      resetTiltAngle(tKey);

      const img = document.getElementById(`${tKey}_photoImg`);
      const empty = document.getElementById(`${tKey}_photoEmpty`);
      const content = document.getElementById(`${tKey}_photoContent`);
      const dot = document.getElementById(`${tKey}_photoDot`);
      if (img) {
        img.src = '';
        img.style.transform = 'rotate(0deg)';
      }
      if (empty) empty.style.display = 'block';
      if (content) content.style.display = 'none';
      if (dot) dot.style.display = 'none';
    });

    updateHeaderScores();
    renderDualArena();
  }

  function startDualMatch(broadcastOptions = {}) {
    gameState.isMatchStarted = true;
    gameState.isTimerRunning = true;
    gameState.totalMatchSeconds = gameState.totalMatchSeconds || 120;
    gameState.timerSeconds = gameState.timerSeconds || gameState.totalMatchSeconds;

    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        seconds: gameState.timerSeconds,
        totalMatchSeconds: gameState.totalMatchSeconds
      })
    }).catch(() => {});

    renderDualArena();
    broadcastHostStateToServer(broadcastOptions);
  }

  // Giáo viên bấm Bắt đầu trò chơi ngay trong Tab Đấu trường
  function startMatchFromArena() {
    if (gameState.isCountdownRunning) return;
    prepareFreshMatchSession();
    gameState.isCountdownRunning = true;
    renderDualArena();

    // Phát sóng trạng thái đếm ngược 3..2..1 kèm sessionId mới để cả 2 điện thoại xóa sạch kết quả ván cũ
    broadcastCountdownState(3, { resetForNewMatch: true });

    // Kích hoạt hiệu ứng đếm ngược trực quan 3..2..1.. CHIẾN! trên máy chiếu
    runCountdownAnimation(3, () => {
      gameState.isCountdownRunning = false;
      gameState.isMatchStarted = true;
      startDualMatch({ forceTeamOverwrite: true });
      if (typeof window.showToast === 'function') {
        window.showToast('🚀 ĐÃ BẮT ĐẦU TRẬN ĐẤU MỚI! Điện thoại 2 đội đã đồng bộ về Câu 1/10.', 'success');
      }
    });
  }

  // 6. RENDER GIAO DIỆN CÂU HỎI & ĐIỀU KHIỂN
  function updateTimerDisplay() {
    const circle = document.getElementById('gmmTimerNum');
    if (!circle) return;
    circle.textContent = gameState.timerSeconds;

    circle.classList.remove('warning', 'danger');
    if (gameState.timerSeconds <= 5) circle.classList.add('danger');
    else if (gameState.timerSeconds <= 10) circle.classList.add('warning');
  }

  function updateHeaderScores() {
    const scoreA = document.getElementById('gmmScoreA');
    const scoreB = document.getElementById('gmmScoreB');
    if (scoreA) scoreA.textContent = gameState.teamA.score + gameState.teamA.bonusScore;
    if (scoreB) scoreB.textContent = gameState.teamB.score + gameState.teamB.bonusScore;
  }

  function renderQuestionUI() {
    const q = questionsList[gameState.currentQIndex];
    if (!q) return;

    const qNumEl = document.getElementById('gmmQNumber');
    const qTextEl = document.getElementById('gmmQText');
    const coordBadge = document.getElementById('gmmQCoordinateBadge');
    const optionsGrid = document.getElementById('gmmOptionsGrid');
    const choiceTextA = document.getElementById('gmmChoiceTextA');
    const choiceTextB = document.getElementById('gmmChoiceTextB');

    const letters = ['A', 'B', 'C', 'D'];
    const coordName = q.coordinate || `Ô số ${gameState.currentQIndex + 1}`;

    if (qNumEl) qNumEl.textContent = `CÂU HỎI ${gameState.currentQIndex + 1}/10`;
    if (qTextEl) qTextEl.textContent = q.question;
    if (coordBadge) {
      coordBadge.innerHTML = `🎯 TỌA ĐỘ MỞ KHÓA BẢNG GIẤY A1: <strong>${coordName.toUpperCase()}</strong>`;
    }

    // Cập nhật thanh hiển thị trạng thái đã chọn của 2 Đội
    const ansA = gameState.teamA.answers[q.id];
    const ansB = gameState.teamB.answers[q.id];

    if (choiceTextA) {
      if (gameState.isAnswerRevealed) {
        choiceTextA.innerHTML = ansA === q.correct
          ? `<span style="color: #34d399; font-weight: 800;">✅ Đúng [${letters[ansA]}] ➔ Mở khóa ${coordName} (Tô bảng A1)</span>`
          : `<span style="color: #fca5a5;">❌ Sai [${ansA !== undefined && ansA !== null ? letters[ansA] : 'Chưa chọn'}]</span>`;
      } else {
        choiceTextA.textContent = (ansA !== undefined && ansA !== null) ? `Đã chọn [${letters[ansA]}]` : 'Chưa chọn';
      }
    }
    if (choiceTextB) {
      if (gameState.isAnswerRevealed) {
        choiceTextB.innerHTML = ansB === q.correct
          ? `<span style="color: #34d399; font-weight: 800;">✅ Đúng [${letters[ansB]}] ➔ Mở khóa ${coordName} (Tô bảng A1)</span>`
          : `<span style="color: #fca5a5;">❌ Sai [${ansB !== undefined && ansB !== null ? letters[ansB] : 'Chưa chọn'}]</span>`;
      } else {
        choiceTextB.textContent = (ansB !== undefined && ansB !== null) ? `Đã chọn [${letters[ansB]}]` : 'Chưa chọn';
      }
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';

      q.options.forEach((opt, idx) => {
        const btn = document.createElement('div');
        btn.className = 'gmm-option-btn';

        const isASelected = ansA === idx;
        const isBSelected = ansB === idx;

        if (isASelected) btn.classList.add('selected-a');
        if (isBSelected) btn.classList.add('selected-b');

        if (gameState.isAnswerRevealed) {
          if (idx === q.correct) btn.classList.add('correct');
          else if (isASelected || isBSelected) btn.classList.add('wrong');
        }

        btn.innerHTML = `
          <div class="gmm-opt-letter">${letters[idx]}</div>
          <div style="flex: 1; padding: 0 8px;">
            <div>${opt}</div>
            ${gameState.isAnswerRevealed && idx === q.correct ? '<div style="font-size: 0.78rem; color: #34d399; font-weight: 800; margin-top: 3px;">✨ ĐÁP ÁN ĐÚNG ✨</div>' : ''}
          </div>
          <div style="display: flex; gap: 6px; align-items: center;" onclick="event.stopPropagation()">
            <button type="button" class="gmm-pick-team-btn btn-a ${isASelected ? 'selected' : ''}"
                    onclick="window.GiaiMaBiMat.chooseAnswer('teamA', ${idx})" title="Đội 1 chọn phương án ${letters[idx]}">
              🔴 Đội 1
            </button>
            <button type="button" class="gmm-pick-team-btn btn-b ${isBSelected ? 'selected' : ''}"
                    onclick="window.GiaiMaBiMat.chooseAnswer('teamB', ${idx})" title="Đội 2 chọn phương án ${letters[idx]}">
              🔵 Đội 2
            </button>
          </div>
        `;

        // Bấm vào thân thẻ đáp án: Gán cho đội nào chưa chọn, hoặc Đội 1 trước
        btn.onclick = () => {
          if (gameState.isQuestionLocked) return;
          if (ansA === undefined || ansA === null) {
            chooseAnswer('teamA', idx);
          } else {
            chooseAnswer('teamB', idx);
          }
        };

        optionsGrid.appendChild(btn);
      });
    }
  }

  function renderDecryptUI() {
    const wrapA = document.getElementById('teamA_svgWrap');
    const wrapB = document.getElementById('teamB_svgWrap');

    const svgA = generateSvgPuzzle('teamA');
    const svgB = generateSvgPuzzle('teamB');

    if (wrapA) wrapA.innerHTML = svgA;
    if (wrapB) wrapB.innerHTML = svgB;

    // Render đồng bộ lên Sân Khấu Đấu Trường Fullscreen Máy Chiếu
    const fsWrapA = document.getElementById('teamA_fsSvgWrap');
    const fsWrapB = document.getElementById('teamB_fsSvgWrap');
    if (fsWrapA) fsWrapA.innerHTML = svgA;
    if (fsWrapB) fsWrapB.innerHTML = svgB;

    const containerA = document.getElementById('teamA_canvasContainer');
    const containerB = document.getElementById('teamB_canvasContainer');
    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    if (containerA) containerA.classList.toggle('paper-theme', isPaper);
    if (containerB) containerB.classList.toggle('paper-theme', isPaper);

    const fsContainerA = document.getElementById('teamA_fsCanvasContainer');
    const fsContainerB = document.getElementById('teamB_fsCanvasContainer');
    if (fsContainerA) fsContainerA.classList.toggle('paper-theme', isPaper);
    if (fsContainerB) fsContainerB.classList.toggle('paper-theme', isPaper);

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';

    const nameA = (gameState.teamA && gameState.teamA.name) || 'ĐOÀN KẾT';
    const nameB = (gameState.teamB && gameState.teamB.name) || 'LA BÀN TUỔI TRẺ';

    const titleA = document.getElementById('gmmCanvasTitleA') || document.querySelector('.gmm-canvas-panel.team-a .gmm-canvas-title');
    const titleB = document.getElementById('gmmCanvasTitleB') || document.querySelector('.gmm-canvas-panel.team-b .gmm-canvas-title');
    if (titleA) {
      titleA.textContent = gameState.teamA.completed
        ? `🔴 BẢNG TRANH ${nameA}: “${activeTitle}” 🎉`
        : `🔴 BẢNG TRANH: ${nameA}`;
    }
    if (titleB) {
      titleB.textContent = gameState.teamB.completed
        ? `🔵 BẢNG TRANH ${nameB}: “${activeTitle}” 🎉`
        : `🔵 BẢNG TRANH: ${nameB}`;
    }

    // Cập nhật tên và điểm số trên Đấu trường Fullscreen
    const fsNameA = document.getElementById('gmmFsTeamAName');
    const fsNameB = document.getElementById('gmmFsTeamBName');
    if (fsNameA) fsNameA.textContent = nameA;
    if (fsNameB) fsNameB.textContent = nameB;

    const fsScoreA = document.getElementById('gmmFsTeamAScore');
    const fsScoreB = document.getElementById('gmmFsTeamBScore');
    if (fsScoreA && gameState.teamA) {
      const scoreA = (gameState.teamA.score || 0) + (gameState.teamA.bonusScore || 0);
      fsScoreA.textContent = `${scoreA} đ`;
    }
    if (fsScoreB && gameState.teamB) {
      const scoreB = (gameState.teamB.score || 0) + (gameState.teamB.bonusScore || 0);
      fsScoreB.textContent = `${scoreB} đ`;
    }

    updateProgressBar('teamA');
    updateProgressBar('teamB');
    updateStealthButtonUI();
    updateCanvasThemeButtonUI();
  }

  function renderResultUI() {
    const tbody = document.getElementById('gmmResultTbody');
    const announceEl = document.getElementById('gmmWinnerAnnounce');
    if (!tbody) return;

    const totalA = gameState.teamA.score + gameState.teamA.bonusScore;
    const totalB = gameState.teamB.score + gameState.teamB.bonusScore;

    tbody.innerHTML = `
      <tr>
        <td style="text-align: left; font-weight: 700;">Điểm trắc nghiệm trực tuyến (Tối đa 10đ)</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.score} đ</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.score} đ</td>
      </tr>
      <tr>
        <td style="text-align: left; font-weight: 700;">Số tọa độ ô màu đã mở khóa trên giấy A1</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.unlockedRegions.length}/10 ô</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.unlockedRegions.length}/10 ô</td>
      </tr>
      ${(gameState.teamA.speedBonus || gameState.teamB.speedBonus) ? `
      <tr>
        <td style="text-align: left; font-weight: 700;">⚡ Điểm thưởng tốc độ hoàn thành tranh sớm</td>
        <td style="color: #fca5a5; font-weight: 700;">${gameState.teamA.speedBonus ? `+${gameState.teamA.speedBonus} đ (⏱️ ${gameState.teamA.artworkFinishTime || ''})` : '0 đ'}</td>
        <td style="color: #93c5fd; font-weight: 700;">${gameState.teamB.speedBonus ? `+${gameState.teamB.speedBonus} đ (⏱️ ${gameState.teamB.artworkFinishTime || ''})` : '0 đ'}</td>
      </tr>` : ''}
      <tr>
        <td style="text-align: left; font-weight: 700;">Điểm tô màu & giải mã tranh A1 (Tối đa 10đ)</td>
        <td style="color: #fca5a5; font-weight: 700;">+${gameState.teamA.bonusScore} đ</td>
        <td style="color: #93c5fd; font-weight: 700;">+${gameState.teamB.bonusScore} đ</td>
      </tr>
      <tr class="total-row">
        <td style="text-align: left;">TỔNG ĐIỂM CHUNG CUỘC (TỐI ĐA 20 ĐIỂM)</td>
        <td style="color: #ef4444; font-size: 1.25rem;">${totalA} ĐIỂM</td>
        <td style="color: #3b82f6; font-size: 1.25rem;">${totalB} ĐIỂM</td>
      </tr>
    `;

    if (announceEl) {
      if (totalA > totalB) {
        announceEl.innerHTML = `
          <h3 style="color: #ef4444; margin: 0; font-size: 1.5rem;">🏆 QUÁN QUÂN: ${gameState.teamA.name.toUpperCase()} CHIẾN THẮNG!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Xuất sắc giải mã bức tranh biểu tượng: <strong>"Ngôi trường hạnh phúc không bạo lực"</strong> (${totalA}/20 điểm)</p>
        `;
      } else if (totalB > totalA) {
        announceEl.innerHTML = `
          <h3 style="color: #3b82f6; margin: 0; font-size: 1.5rem;">🏆 QUÁN QUÂN: ${gameState.teamB.name.toUpperCase()} CHIẾN THẮNG!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Xuất sắc giải mã bức tranh biểu tượng: <strong>"Trái tim thấu cảm – Tự tin tỏa sáng"</strong> (${totalB}/20 điểm)</p>
        `;
      } else {
        announceEl.innerHTML = `
          <h3 style="color: #f59e0b; margin: 0; font-size: 1.5rem;">🤝 KẾT QUẢ HÒA: HAI ĐỘI CÙNG XUẤT SẮC ĐẠT ĐIỂM SỐ ${totalA}/20 ĐIỂM!</h3>
          <p style="margin: 6px 0 0; color: #cbd5e1;">Cả hai đội đã hoàn thành xuất sắc các thông điệp: <em>"Ngôi trường hạnh phúc không bạo lực"</em> & <em>"Trái tim thấu cảm – Tự tin tỏa sáng"</em>!</p>
        `;
      }
    }

    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    }
  }

  // ============================================================================
  // 6. TẠO MÃ QR VÀ ĐỊA CHỈ PHÒNG THI ĐẤU (TỰ ĐỘNG DÒ IP LAN CHO ĐIỆN THOẠI)
  // ============================================================================
  const GMM_CUSTOM_URL_KEY = 'gmm_custom_server_url_v1';
  let cachedGmmServerUrl = null;
  let cachedNetworkInfo = null;

  async function getGmmBaseUrl(forceRefresh = false) {
    // 1. Kiểm tra cấu hình URL tùy chỉnh do Thầy/Cô thiết lập trong LocalStorage
    const custom = localStorage.getItem(GMM_CUSTOM_URL_KEY);
    if (custom && custom.trim().startsWith('http')) {
      cachedGmmServerUrl = custom.trim().replace(/\/+$/, '') + '/';
      updateLobbyNetworkUI(cachedGmmServerUrl, 'custom');
      return cachedGmmServerUrl;
    }

    if (cachedGmmServerUrl && !forceRefresh) {
      updateLobbyNetworkUI(cachedGmmServerUrl, 'cached');
      return cachedGmmServerUrl;
    }

    const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 2. Nếu đang chạy trên máy tính qua localhost hoặc mở file://, bắt buộc dò IP LAN thật từ server.js
    if (!isHttp || isLocalhost) {
      try {
        const apiUrl = isHttp ? `/api/ip?_t=${Date.now()}` : `http://localhost:3000/api/ip?_t=${Date.now()}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          cachedNetworkInfo = await res.json();
          if (cachedNetworkInfo && cachedNetworkInfo.ip && cachedNetworkInfo.ip !== 'localhost' && cachedNetworkInfo.ip !== '127.0.0.1') {
            const port = cachedNetworkInfo.port || (window.location.port || 3000);
            cachedGmmServerUrl = `http://${cachedNetworkInfo.ip}:${port}/`;
            updateLobbyNetworkUI(cachedGmmServerUrl, 'online');
            return cachedGmmServerUrl;
          }
        }
      } catch (_e) {
        try {
          const res2 = await fetch(`http://127.0.0.1:3000/api/ip?_t=${Date.now()}`);
          if (res2.ok) {
            cachedNetworkInfo = await res2.json();
            if (cachedNetworkInfo && cachedNetworkInfo.ip && cachedNetworkInfo.ip !== 'localhost') {
              cachedGmmServerUrl = `http://${cachedNetworkInfo.ip}:${cachedNetworkInfo.port || 3000}/`;
              updateLobbyNetworkUI(cachedGmmServerUrl, 'online');
              return cachedGmmServerUrl;
            }
          }
        } catch (_e2) {}
      }
    }

    // 3. Nếu đang mở qua IP LAN thật hoặc Tên miền Hosting (https://game.school.edu.vn...)
    if (isHttp && !isLocalhost) {
      const path = window.location.pathname.endsWith('.html') 
        ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)
        : window.location.pathname;
      const cleanPath = path.endsWith('/') ? path : path + '/';
      cachedGmmServerUrl = `${window.location.protocol}//${window.location.host}${cleanPath}`;
      updateLobbyNetworkUI(cachedGmmServerUrl, 'online');
      return cachedGmmServerUrl;
    }

    // 4. Fallback dự phòng nếu chưa kết nối mạng
    cachedGmmServerUrl = 'http://localhost:3000/';
    updateLobbyNetworkUI(cachedGmmServerUrl, 'warning');
    return cachedGmmServerUrl;
  }

  function updateLobbyNetworkUI(url, mode) {
    const input = document.getElementById('gmmBaseUrlInput');
    const badge = document.getElementById('gmmNetBadge');
    if (input && !input.matches(':focus')) {
      input.value = url;
    }
    if (badge) {
      if (mode === 'custom') {
        badge.className = 'gmm-net-badge custom';
        badge.textContent = '🔵 Địa chỉ tùy chỉnh';
      } else if (mode === 'warning') {
        badge.className = 'gmm-net-badge warning';
        badge.textContent = '⚠️ Đang dùng localhost (Cần mở bằng IP Wi-Fi)';
      } else {
        badge.className = 'gmm-net-badge online';
        badge.textContent = '🟢 Mạng Wi-Fi sẵn sàng';
      }
    }
  }

  async function renderQrCodes(forceRefresh = false) {
    const qrA = document.getElementById('gmmQrCanvasA');
    const qrB = document.getElementById('gmmQrCanvasB');
    if (!qrA || !qrB) return;

    qrA.innerHTML = '<div style="padding: 20px; font-size: 0.85rem; color: #94a3b8;">Đang tạo mã QR...</div>';
    qrB.innerHTML = '<div style="padding: 20px; font-size: 0.85rem; color: #94a3b8;">Đang tạo mã QR...</div>';

    const baseUrl = await getGmmBaseUrl(forceRefresh);
    const cleanRoom = encodeURIComponent(gameState.roomCode || '2011-THCS');

    const urlA = `${baseUrl}?game=giai_ma_bi_mat&team=A&room=${cleanRoom}`;
    const urlB = `${baseUrl}?game=giai_ma_bi_mat&team=B&room=${cleanRoom}`;

    // Cập nhật giá trị đường link hiển thị dưới mã QR
    const linkInputA = document.getElementById('gmmTeamLinkA');
    const linkInputB = document.getElementById('gmmTeamLinkB');
    const testLinkA = document.getElementById('gmmTestLinkA');
    const testLinkB = document.getElementById('gmmTestLinkB');

    if (linkInputA) linkInputA.value = urlA;
    if (linkInputB) linkInputB.value = urlB;
    if (testLinkA) testLinkA.href = urlA;
    if (testLinkB) testLinkB.href = urlB;

    qrA.innerHTML = '';
    qrB.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrA, {
          text: urlA,
          width: 170,
          height: 170,
          colorDark: '#991b1b',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        new QRCode(qrB, {
          text: urlB,
          width: 170,
          height: 170,
          colorDark: '#1e40af',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('QRCode render error:', err);
      }
    } else {
      qrA.innerHTML = `<a href="${urlA}" target="_blank" style="padding:16px;font-size:0.8rem;word-break:break-all;color:#ef4444;display:block;">Bấm mở Đội 1</a>`;
      qrB.innerHTML = `<a href="${urlB}" target="_blank" style="padding:16px;font-size:0.8rem;word-break:break-all;color:#3b82f6;display:block;">Bấm mở Đội 2</a>`;
    }
  }

  function copyBaseUrl() {
    const input = document.getElementById('gmmBaseUrlInput');
    if (!input || !input.value) return;
    navigator.clipboard.writeText(input.value).then(() => {
      if (typeof window.showToast === 'function') window.showToast('📋 Đã sao chép địa chỉ IP máy chủ!', 'success');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      if (typeof window.showToast === 'function') window.showToast('📋 Đã sao chép địa chỉ IP máy chủ!', 'success');
    });
  }

  function copyTeamUrl(teamLetter) {
    const input = document.getElementById(teamLetter === 'A' ? 'gmmTeamLinkA' : 'gmmTeamLinkB');
    if (!input || !input.value) return;
    const teamName = teamLetter === 'A' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
    navigator.clipboard.writeText(input.value).then(() => {
      if (typeof window.showToast === 'function') window.showToast(`📋 Đã sao chép link tham gia ${teamName}!`, 'success');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      if (typeof window.showToast === 'function') window.showToast(`📋 Đã sao chép link tham gia ${teamName}!`, 'success');
    });
  }

  async function promptCustomUrl() {
    let hint = '';
    if (cachedNetworkInfo && Array.isArray(cachedNetworkInfo.allIps) && cachedNetworkInfo.allIps.length > 0) {
      const port = cachedNetworkInfo.port || window.location.port || 3000;
      hint = '\n\n💡 Các IP máy tính phát hiện được:\n' +
        cachedNetworkInfo.allIps.map((item, idx) => `  ${idx + 1}. http://${item.ip}:${port}/ (${item.name})`).join('\n') +
        '\n(Để trống rồi bấm OK để tự động đặt lại theo IP Wi-Fi tối ưu nhất)';
    }

    const current = cachedGmmServerUrl || 'http://localhost:3000/';
    const val = prompt('Nhập địa chỉ IP Wi-Fi máy tính hoặc Domain Hosting của Thầy/Cô:' + hint, current);
    if (val === null) return;
    const trimmed = val.trim();
    if (!trimmed) {
      localStorage.removeItem(GMM_CUSTOM_URL_KEY);
      cachedGmmServerUrl = null;
      await renderQrCodes(true);
      if (typeof window.showToast === 'function') window.showToast('🔄 Đã đặt lại tự động nhận diện IP Wi-Fi!', 'info');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      alert('Vui lòng nhập địa chỉ bắt đầu bằng http:// hoặc https://');
      return;
    }
    localStorage.setItem(GMM_CUSTOM_URL_KEY, trimmed);
    cachedGmmServerUrl = trimmed.replace(/\/+$/, '') + '/';
    await renderQrCodes(true);
    if (typeof window.showToast === 'function') window.showToast('✅ Đã cập nhật mã QR theo địa chỉ mới!', 'success');
  }

  async function refreshGmmNetworkIp() {
    localStorage.removeItem(GMM_CUSTOM_URL_KEY);
    cachedGmmServerUrl = null;
    await renderQrCodes(true);
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã cập nhật địa chỉ IP Wi-Fi mới nhất!', 'success');
    }
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
    questionsList.forEach((q, idx) => {
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
    const curQ = questionsList[gameState.editingQIndex];
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
    const curQ = questionsList[gameState.editingQIndex];
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
      questionsList = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
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
  // 8. TÍNH NĂNG XUẤT / NHẬP EXCEL & FILE MẪU BẰNG SHEETJS (XLSX)
  // ============================================================================

  // Tải file Excel mẫu gồm 10 câu hỏi chính thức
  function downloadQuestionTemplate() {
    if (typeof XLSX === 'undefined') {
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

    const ws = XLSX.utils.aoa_to_sheet(rows);
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Giai_Ma_Bi_Mat');
    XLSX.writeFile(wb, 'Mau_10_Cau_Hoi_Giai_Ma_Bi_Mat.xlsx');

    if (typeof window.showToast === 'function') {
      window.showToast('📥 Đã tải xuống file Excel mẫu 10 câu hỏi thành công!', 'success');
    }
  }

  // Xuất bộ 10 câu hỏi hiện tại ra file Excel (.xlsx)
  function exportQuestionsToExcel() {
    if (typeof XLSX === 'undefined') {
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

    questionsList.forEach((q, idx) => {
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

    const ws = XLSX.utils.aoa_to_sheet(rows);
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Giai_Ma_Bi_Mat');
    XLSX.writeFile(wb, 'Bo_Cau_Hoi_Giai_Ma_Bi_Mat.xlsx');

    if (typeof window.showToast === 'function') {
      window.showToast('💾 Đã xuất toàn bộ 10 câu hỏi ra file Excel thành công!', 'success');
    }
  }

  // Nhập file Excel / CSV từ máy tính
  function handleExcelFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Thư viện SheetJS chưa sẵn sàng!', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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

        questionsList = newQuestions;
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

  // ============================================================================
  // 9. ĐỒNG BỘ THỜI GIAN THỰC SERVER-SENT EVENTS (SSE) & HỌC SINH THI ĐẤU ĐIỆN THOẠI
  // ============================================================================

  // Gửi trạng thái hiện tại từ Máy chiếu lên Server để phát sóng thoại
  async function broadcastHostStateToServer(options = {}) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (isStudentMobileClient) return;

    try {
      if (!gameState.sessionId) {
        gameState.sessionId = Date.now();
      }
      const isLobby = (gameState.activeTab === 'home' || gameState.activeTab === 'lobby');
      const isQuizWaiting = (gameState.activeTab === 'quiz' && !gameState.isMatchStarted);
      const curQ = questionsList[gameState.currentQIndex];
      const payload = {
        sessionId: gameState.sessionId,
        resetForNewMatch: Boolean(options.resetForNewMatch),
        forceTeamOverwrite: Boolean(options.forceTeamOverwrite || options.resetForNewMatch),
        roomCode: gameState.roomCode,
        status: isLobby ? 'lobby' : (isQuizWaiting ? 'quiz_waiting' : gameState.activeTab),
        isMatchStarted: Boolean(gameState.isMatchStarted),
        currentQIndex: gameState.currentQIndex,
        totalQuestions: questionsList.length,
        // Khi ở Quiz và đã bấm bắt đầu: gửi toàn bộ danh sách 10 câu hỏi để học sinh làm bài độc lập
        questions: (isLobby || isQuizWaiting) ? [] : questionsList.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          coordinate: q.coordinate || `Ô số ${q.id}`,
          regionId: q.regionId,
          time: q.time
        })),
        currentQuestion: (isLobby || isQuizWaiting) ? null : (curQ ? {
          id: curQ.id,
          question: curQ.question,
          options: curQ.options,
          correct: curQ.correct,
          coordinate: curQ.coordinate || `Ô số ${gameState.currentQIndex + 1}`,
          time: curQ.time
        } : null),
        totalMatchSeconds: gameState.totalMatchSeconds || 120,
        timerSeconds: gameState.timerSeconds,
        isTimerRunning: (isLobby || isQuizWaiting) ? false : gameState.isTimerRunning,
        isQuestionLocked: (isLobby || isQuizWaiting) ? false : gameState.isQuestionLocked,
        isAnswerRevealed: (isLobby || isQuizWaiting) ? false : gameState.isAnswerRevealed,
        isDecryptPhase: gameState.isDecryptPhase,
        decryptTimeLeft: gameState.decryptTimeLeft,
        decryptTimeTotal: gameState.decryptTimeTotal || 300,
        isDecryptTimerRunning: Boolean(gameState.isDecryptTimerRunning),
        connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
        teamNames: {
          teamA: gameState.teamA.name || 'ĐOÀN KẾT',
          teamB: gameState.teamB.name || 'LA BÀN TUỔI TRẺ'
        },
        teamA: {
          name: gameState.teamA.name,
          score: gameState.teamA.score,
          bonusScore: gameState.teamA.bonusScore,
          answers: gameState.teamA.answers || {},
          isLocked: Boolean(gameState.teamA.isLocked),
          finishTime: gameState.teamA.isLocked ? (gameState.teamA.finishTimeFormatted || gameState.teamA.finishTime || null) : null,
          finishSeconds: gameState.teamA.isLocked && typeof gameState.teamA.finishTimeSeconds === 'number' ? gameState.teamA.finishTimeSeconds : null,
          unlockedRegions: gameState.teamA.unlockedRegions || [],
          coloredRegions: gameState.teamA.coloredRegions || {}
        },
        teamB: {
          name: gameState.teamB.name,
          score: gameState.teamB.score,
          bonusScore: gameState.teamB.bonusScore,
          answers: gameState.teamB.answers || {},
          isLocked: Boolean(gameState.teamB.isLocked),
          finishTime: gameState.teamB.isLocked ? (gameState.teamB.finishTimeFormatted || gameState.teamB.finishTime || null) : null,
          finishSeconds: gameState.teamB.isLocked && typeof gameState.teamB.finishTimeSeconds === 'number' ? gameState.teamB.finishTimeSeconds : null,
          unlockedRegions: gameState.teamB.unlockedRegions || [],
          coloredRegions: gameState.teamB.coloredRegions || {}
        }
      };

      const res = await fetch('/api/gmm/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.sessionId) {
          gameState.sessionId = json.sessionId;
        }
        if (json && json.state && json.state.connectedTeams) {
          updateTeamConnectionStatusUI(json.state.connectedTeams);
        }
      }
    } catch (_e) {}
  }

  async function syncHostInitialConnectionState() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (isStudentMobileClient) return;
    try {
      const res = await fetch('/api/gmm/state', { cache: 'no-store' });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.success) {
          if (json.state && json.state.connectedTeams) {
            updateTeamConnectionStatusUI(json.state.connectedTeams);
          }
          if (json.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestBulkTelemetry === 'function') {
            window.GiaiMaLiveMonitor.ingestBulkTelemetry(json.telemetry, json.serverTime);
          }
        }
      }
    } catch (_e) {}
  }

  function updateTeamConnectionStatusUI(connectedTeams) {
    if (!connectedTeams) return;
    if (!gameState.connectedTeams) gameState.connectedTeams = { teamA: false, teamB: false };
    if ('teamA' in connectedTeams) {
      gameState.connectedTeams.teamA = Boolean(connectedTeams.teamA);
    }
    if ('teamB' in connectedTeams) {
      gameState.connectedTeams.teamB = Boolean(connectedTeams.teamB);
    }

    const nameA = (typeof getTeamName === 'function') ? getTeamName('teamA') : 'ĐOÀN KẾT';
    const nameB = (typeof getTeamName === 'function') ? getTeamName('teamB') : 'LA BÀN TUỔI TRẺ';

    const elA = document.getElementById('gmmTeamStatusA');
    if (elA) {
      if (gameState.connectedTeams.teamA) {
        elA.className = 'gmm-team-status-indicator ready';
        elA.innerHTML = `<span>●</span><span>${nameA} (Đội 1) đã kết nối điện thoại</span><button type="button" class="gmm-btn-kick-conn" onclick="event.stopPropagation(); GiaiMaLiveMonitor.kickTeamConnection('teamA')" title="Ngắt / Làm mới kết nối ${nameA}">✕</button>`;
      } else {
        elA.className = 'gmm-team-status-indicator waiting';
        elA.innerHTML = `<span>⏳</span><span>Đang chờ ${nameA} quét mã...</span>`;
      }
    }

    const elB = document.getElementById('gmmTeamStatusB');
    if (elB) {
      if (gameState.connectedTeams.teamB) {
        elB.className = 'gmm-team-status-indicator ready';
        elB.innerHTML = `<span>●</span><span>${nameB} (Đội 2) đã kết nối điện thoại</span><button type="button" class="gmm-btn-kick-conn" onclick="event.stopPropagation(); GiaiMaLiveMonitor.kickTeamConnection('teamB')" title="Ngắt / Làm mới kết nối ${nameB}">✕</button>`;
      } else {
        elB.className = 'gmm-team-status-indicator waiting';
        elB.innerHTML = `<span>⏳</span><span>Đang chờ ${nameB} quét mã...</span>`;
      }
    }

    if (!isStudentMobileClient && !gameState.isMatchStarted) {
      ['teamA', 'teamB'].forEach(tKey => {
        const letter = tKey === 'teamA' ? 'A' : 'B';
        const badge = document.getElementById(`gmmStatusBadgeTeam${letter}`);
        const team = gameState[tKey];
        if (badge && team && !team.isLocked && !gameState.isCountdownRunning) {
          badge.innerHTML = gameState.connectedTeams[tKey]
            ? '🕒 <span style="color: #7dd3fc;">Đang chờ...</span>'
            : '🕒 <span style="color: #94a3b8;">Đang chờ...</span>';
        }
      });
    }

    if (!isStudentMobileClient) {
      if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
        window.GiaiMaLiveMonitor.renderHostPingIndicators();
      }
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderLiveQuizCards === 'function') {
        window.GiaiMaTeacherKey.renderLiveQuizCards();
      }
    }
  }

  // Khởi động kênh lắng nghe SSE trên Máy chiếu (Host)
  let hostConnSyncInterval = null;
  function initHostSseListener() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    if (sseEventSource) return;

    if (!hostConnSyncInterval && !isStudentMobileClient) {
      hostConnSyncInterval = setInterval(() => {
        if (gameState.activeTab === 'lobby' || gameState.activeTab === 'quiz') {
          syncHostInitialConnectionState();
        }
      }, 4500);
    }

    try {
      sseEventSource = new EventSource('/api/sync/events?role=host');
      sseEventSource.onopen = function () {
        syncHostInitialConnectionState();
      };
      sseEventSource.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);

          // Học sinh quét mã và vào phòng thi từ điện thoại
          if (data.type === 'gmm_team_joined') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            } else if (data.team) {
              const patch = {};
              patch[data.team] = true;
              updateTeamConnectionStatusUI(patch);
            }
            if (data.team && data.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, data.telemetry, data.serverTime);
            }
            const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            if (typeof window.showToast === 'function') {
              window.showToast(`📱 ${teamName} vừa kết nối điện thoại vào phòng thi!`, 'success');
            }
            if (window.audioManager && typeof window.audioManager.playChime === 'function') {
              window.audioManager.playChime();
            }
          }

          // Điện thoại học sinh đã thoát khỏi trò chơi hoặc mất kết nối
          if (data.type === 'gmm_team_left') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            } else if (data.team) {
              const patch = {};
              patch[data.team] = false;
              updateTeamConnectionStatusUI(patch);
            }
            if (data.team && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.handleTeamDisconnected === 'function') {
              window.GiaiMaLiveMonitor.handleTeamDisconnected(data.team, data.serverTime);
            }
            if (data.reason !== 'teacher_kick') {
              const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
              if (typeof window.showToast === 'function') {
                window.showToast(`📴 Điện thoại ${teamName} đã thoát khỏi phòng thi!`, 'warning');
              }
            }
          }

          // Nhịp tim kết nối trực tiếp (Live Ping) từ điện thoại 2 đội
          if (data.type === 'gmm_team_ping') {
            if (data.connectedTeams) {
              updateTeamConnectionStatusUI(data.connectedTeams);
            }
            if (data.team && data.telemetry && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, data.telemetry, data.serverTime);
            }
          }

          // Giáo viên mở khóa riêng cho 1 đội làm tiếp
          if (data.type === 'gmm_team_unlocked') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            applyTeamUnlockOnHost(data.team, data.answers || null);
          }

          // Học sinh nộp đáp án từ điện thoại
          if (data.type === 'gmm_team_answered') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            if (gameState[data.team] && !gameState[data.team].isLocked) {
              gameState[data.team].answers[data.questionId] = data.optionIndex;
            }
            if (data.team && typeof data.currentQ === 'number' && window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.ingestServerTelemetry === 'function') {
              window.GiaiMaLiveMonitor.ingestServerTelemetry(data.team, {
                currentQ: data.currentQ,
                currentPage: 'quiz',
                screenState: 'visible',
                lastPingAt: Date.now()
              });
            }
            renderDualArena();
            const teamName = data.team === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            const letters = ['A', 'B', 'C', 'D'];
            if (typeof window.showToast === 'function') {
              window.showToast(`📱 ${teamName} vừa chọn đáp án Câu ${data.questionId}: [${letters[data.optionIndex]}]`, 'success');
            }
            if (window.audioManager && typeof window.audioManager.playPointerSpringSnap === 'function') {
              window.audioManager.playPointerSpringSnap();
            }
          }

          // Học sinh chốt nộp bài từ điện thoại
          if (data.type === 'gmm_team_locked') {
            if (data.sessionId && gameState.sessionId && String(data.sessionId) !== String(gameState.sessionId)) {
              return;
            }
            const teamKey = data.team;
            const elapsed = (typeof data.finishSeconds === 'number')
              ? data.finishSeconds
              : Math.max(0, (gameState.totalMatchSeconds || 120) - (gameState.timerSeconds || 0));
            const finishTimeStr = data.finishTime || formatMinutesSeconds(elapsed);

            if (gameState[teamKey]) {
              gameState[teamKey].isLocked = true;
              gameState[teamKey].finishTimeSeconds = elapsed;
              gameState[teamKey].finishTimeFormatted = finishTimeStr;
              if (data.answers) gameState[teamKey].answers = Object.assign(gameState[teamKey].answers, data.answers);
            }
            recalculateTeamScore(teamKey);
            renderDualArena();
            const teamName = getTeamName(teamKey, 'full');

            const ansCount = Object.keys(gameState[teamKey]?.answers || {}).length;
            const totalQ = questionsList.length || 10;
            const isCompletedAllBeforeTime = (ansCount >= totalQ) && (gameState.timerSeconds > 0);

            // Chuông reo "Ting-Ting" đặc biệt vang dội khi đội hoàn thành trọn vẹn 10/10 câu trước thời hạn!
            if (isCompletedAllBeforeTime && window.audioManager && typeof window.audioManager.playVictoryChime === 'function') {
              window.audioManager.playVictoryChime();
            } else if (window.audioManager && typeof window.audioManager.playChime === 'function') {
              window.audioManager.playChime();
            }

            if (typeof window.showToast === 'function') {
              if (isCompletedAllBeforeTime) {
                window.showToast(`🏆 ${teamName} ĐÃ XUẤT SẮC HOÀN THÀNH 10/10 CÂU TRƯỚC THỜI HẠN (⏱️ ${finishTimeStr})!`, 'success');
              } else {
                window.showToast(`🎉 ${teamName} ĐÃ CHỐT KẾT QUẢ VÀ NỘP BÀI (⏱️ ${finishTimeStr})!`, 'success');
              }
            }

            // Nếu cả 2 đội đều đã chốt nộp bài, nhẹ nhàng hạ âm lượng tắt nhạc nền thi đấu
            if (gameState.teamA?.isLocked && gameState.teamB?.isLocked) {
              stopBattleMusicUI(2.0);
            }

            // Hiệu ứng pháo hoa Confetti trên máy chiếu chúc mừng đội vừa nộp bài
            if (typeof confetti === 'function') {
              try {
                confetti({
                  particleCount: 110,
                  spread: 90,
                  origin: { y: 0.45 },
                  zIndex: 99999
                });
              } catch (_e) {}
            }
          }

          // Đồng hồ máy chủ đếm lùi từng giây qua SSE
          if (data.type === 'gmm_timer_tick') {
            gameState.timerSeconds = data.timerSeconds;
            if (typeof data.totalMatchSeconds === 'number') {
              gameState.totalMatchSeconds = data.totalMatchSeconds;
            }
            updateMatchTimerUI();
          }

          if (data.type === 'gmm_timer_pause') {
            gameState.isTimerRunning = data.isTimerRunning;
            gameState.timerSeconds = data.timerSeconds;
            updateMatchTimerUI();
            const btn = document.getElementById('gmmBtnMatchPause');
            if (btn) {
              btn.innerHTML = gameState.isTimerRunning ? '<span>⏸️ Tạm Dừng</span>' : '<span>▶️ Tiếp Tục</span>';
            }
            updateStageFloatPauseBtn();
          }

          if (data.type === 'gmm_time_up') {
            handleMatchConclusion(false);
          }

          // Đồng hồ máy chủ đếm lùi từng giây cho Giai đoạn 2: Tô Màu Bức Tranh (Tab 4)
          if (data.type === 'gmm_decrypt_timer_tick' || data.type === 'gmm_decrypt_timer_start') {
            if (typeof data.decryptTimeLeft === 'number') {
              gameState.decryptTimeLeft = data.decryptTimeLeft;
            }
            if (typeof data.decryptTimeTotal === 'number') {
              gameState.decryptTimeTotal = data.decryptTimeTotal;
            }
            if (typeof data.isDecryptTimerRunning === 'boolean') {
              gameState.isDecryptTimerRunning = data.isDecryptTimerRunning;
            }
            updateDecryptTimerUI();
          }

          if (data.type === 'gmm_decrypt_timer_pause') {
            gameState.isDecryptTimerRunning = Boolean(data.isDecryptTimerRunning);
            if (typeof data.decryptTimeLeft === 'number') {
              gameState.decryptTimeLeft = data.decryptTimeLeft;
            }
            updateDecryptTimerUI();
          }

          if (data.type === 'gmm_decrypt_time_up') {
            gameState.decryptTimeLeft = 0;
            gameState.isDecryptTimerRunning = false;
            updateDecryptTimerUI();
          }

          // Học sinh tô màu tranh từ điện thoại
          if (data.type === 'gmm_region_colored') {
            handleRegionClick(data.team, data.regionId, data.color, true);
          }

          // Học sinh chụp ảnh và tải tác phẩm tranh giấy A1 lên máy chiếu
          if (data.type === 'gmm_artwork_photo') {
            attachTeamArtworkPhoto(data.team, data.photoData, data.timestamp);
          }

          // Học sinh báo cáo đã tô xong sớm bức tranh giấy A1 từ điện thoại (+2 điểm thưởng tốc độ)
          if (data.type === 'gmm_artwork_finished') {
            const teamKey = data.team;
            const teamName = teamKey === 'teamA' ? 'Đội 1 (Đội A)' : 'Đội 2 (Đội B)';
            const finishTimeStr = data.finishTime || '02:00';
            const speedBonus = typeof data.speedBonus === 'number' ? data.speedBonus : 2;

            if (gameState[teamKey]) {
              gameState[teamKey].completed = true;
              gameState[teamKey].isArtworkFinished = true;
              gameState[teamKey].artworkFinishTime = finishTimeStr;
              gameState[teamKey].speedBonus = speedBonus;
              gameState[teamKey].bonusScore = (gameState[teamKey].bonusScore || 0) + speedBonus;
            }

            // Tô toàn bộ tranh vector để đồng bộ
            if (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.autoColorTargetCells === 'function') {
              window.GiaiMaPuzzle.autoColorTargetCells(gameState[teamKey]);
            }

            // Hiển thị huy hiệu xong sớm trên máy chiếu Tab 4
            const earlyBadge = document.getElementById(`${teamKey}_earlyBadge`);
            if (earlyBadge) {
              earlyBadge.style.display = 'inline-block';
              earlyBadge.textContent = `⚡ XONG SỚM (${finishTimeStr}, +${speedBonus}đ)`;
            }

            // Phát âm thanh chiến thắng
            if (window.audioManager) {
              if (typeof window.audioManager.playVictoryChime === 'function') {
                window.audioManager.playVictoryChime();
              } else if (typeof window.audioManager.playFanfare === 'function') {
                window.audioManager.playFanfare();
              }
            }

            // Pháo hoa Confetti rực rỡ chúc mừng trên máy chiếu
            if (typeof confetti === 'function') {
              try {
                confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 }, zIndex: 99999 });
              } catch (_) {}
            }

            if (typeof window.showToast === 'function') {
              window.showToast(`🏆 ${teamName} ĐÃ BÁO CÁO TÔ XONG TRANH SỚM (⏱️ ${finishTimeStr})! CỘNG +${speedBonus} ĐIỂM THƯỞNG TỐC ĐỘ! 🎉`, 'success');
            }

            updateHeaderScores();
            renderDecryptUI();
            updateProgressBar(teamKey);
          }

          if (data.type === 'gmm_reset' && data.sessionId) {
            gameState.sessionId = data.sessionId;
          }

          // Đồng bộ trạng thái cập nhật chung
          if (data.type === 'gmm_state_update' && data.state) {
            if (data.state.sessionId) {
              gameState.sessionId = data.state.sessionId;
            }
            if (data.state.teamNames) {
              if (data.state.teamNames.teamA && gameState.teamA) gameState.teamA.name = data.state.teamNames.teamA;
              if (data.state.teamNames.teamB && gameState.teamB) gameState.teamB.name = data.state.teamNames.teamB;
              updateAllTeamNamesUI();
            }
            if (data.state.connectedTeams) {
              updateTeamConnectionStatusUI(data.state.connectedTeams);
            }
            if (data.state.teamA) {
              gameState.teamA = Object.assign(gameState.teamA, data.state.teamA);
              gameState.teamA.finishTimeFormatted = data.state.teamA.finishTime || null;
            }
            if (data.state.teamB) {
              gameState.teamB = Object.assign(gameState.teamB, data.state.teamB);
              gameState.teamB.finishTimeFormatted = data.state.teamB.finishTime || null;
            }
            renderDualArena();
          }
        } catch (_err) {}
      };

      sseEventSource.onerror = function () {
        // SSE tự động kết nối lại khi có gián đoạn mạng
      };
    } catch (_err) {}
  }

  let wasMobileInLobby = true;
  let screenWakeLock = null;
  let countdownTimerId = null;

  // Tự động giữ màn hình điện thoại học sinh luôn sáng (Wake Lock API)
  async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        screenWakeLock = await navigator.wakeLock.request('screen');
        screenWakeLock.addEventListener('release', () => {
          screenWakeLock = null;
        });
        const statusText = document.getElementById('gmmMobStatusText');
        if (statusText && isStudentMobileClient) {
          statusText.innerHTML = 'Đã kết nối ⚡ Sáng liên tục';
        }
      } catch (err) {
        console.warn('Wake Lock warning:', err);
      }
    }
  }

  // Tự kích hoạt lại Wake Lock khi học sinh mở lại tab trình duyệt
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (isStudentMobileClient || (gameState && gameState.activeTab !== 'home'))) {
      requestScreenWakeLock();
    }
  });

  document.addEventListener('touchstart', () => {
    if (isStudentMobileClient && !screenWakeLock) {
      requestScreenWakeLock();
    }
  }, { passive: true });

  // Bộ phát âm thanh Web Audio tổng hợp cho Đếm ngược 3..2..1.. Chiến (Không cần file mp3)
  function playCountdownSound(step) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._gmmSoundCtx) window._gmmSoundCtx = new AudioCtx();
      const ctx = window._gmmSoundCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (step > 0) {
        // Tiếng Beep đếm ngược 3, 2, 1 với tần số nâng dần
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = 520 + (3 - step) * 140; // 3: 520Hz, 2: 660Hz, 1: 800Hz
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else {
        // Hợp âm kịch tính khi "CHIẾN!" (C Major chord fanfare vang dội)
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);
          gain.gain.setValueAtTime(0.2, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + 0.65);
        });
      }
    } catch (_e) {}
  }

  // Hiệu ứng đếm ngược trực quan 3..2..1.. Chiến trên máy tính và điện thoại
  // Hiệu ứng đếm 1, 2, 3.. Bắt đầu làm bài trên máy tính và điện thoại
  function runCountdownAnimation(_startSec = 3, onFinish = null) {
    const hostOverlay = document.getElementById('gmmHostCountdownOverlay');
    const hostNum = document.getElementById('gmmHostCountdownNum');
    const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
    const mobNum = document.getElementById('gmmMobCountdownNum');

    if (hostOverlay) hostOverlay.style.display = 'flex';
    if (mobOverlay) mobOverlay.style.display = 'flex';

    let step = 1;

    function renderStep(num) {
      playCountdownSound(num <= 3 ? (4 - num) : 0);

      if (num <= 3) {
        if (hostNum) {
          hostNum.textContent = num;
          hostNum.className = 'gmm-cd-number gmm-zoom-pulse';
        }
        if (mobNum) {
          mobNum.textContent = num;
          mobNum.className = 'gmm-cd-number gmm-zoom-pulse';
        }
        if (navigator.vibrate) {
          try { navigator.vibrate(60); } catch (_) {}
        }
      } else {
        if (hostNum) {
          hostNum.textContent = '🚀 BẮT ĐẦU!';
          hostNum.className = 'gmm-cd-number gmm-cd-fire';
        }
        if (mobNum) {
          mobNum.textContent = '🚀 BẮT ĐẦU!';
          mobNum.className = 'gmm-cd-number gmm-cd-fire';
        }
        if (navigator.vibrate) {
          try { navigator.vibrate([120, 60, 250]); } catch (_) {}
        }
      }
    }

    renderStep(step);

    clearInterval(countdownTimerId);
    countdownTimerId = setInterval(() => {
      step++;
      if (step <= 4) {
        renderStep(step);
      } else {
        clearInterval(countdownTimerId);
        setTimeout(() => {
          if (hostOverlay) hostOverlay.style.display = 'none';
          if (mobOverlay) mobOverlay.style.display = 'none';
          if (typeof onFinish === 'function') onFinish();
        }, 500);
      }
    }, 1000);
  }

  async function broadcastCountdownState(seconds = 3, options = {}) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    try {
      const isReset = Boolean(options.resetForNewMatch);
      const res = await fetch('/api/gmm/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          resetForNewMatch: isReset,
          forceTeamOverwrite: isReset,
          roomCode: gameState.roomCode,
          status: 'countdown',
          isMatchStarted: false,
          countdownSeconds: seconds,
          currentQuestion: null,
          isTimerRunning: false,
          currentQIndex: gameState.currentQIndex,
          totalMatchSeconds: gameState.totalMatchSeconds || 120,
          timerSeconds: gameState.timerSeconds || gameState.totalMatchSeconds || 120,
          connectedTeams: gameState.connectedTeams || { teamA: false, teamB: false },
          teamNames: {
            teamA: gameState.teamA.name || 'ĐOÀN KẾT',
            teamB: gameState.teamB.name || 'LA BÀN TUỔI TRẺ'
          },
          teamA: {
            score: gameState.teamA.score,
            bonusScore: gameState.teamA.bonusScore,
            answers: gameState.teamA.answers || {},
            isLocked: Boolean(gameState.teamA.isLocked),
            unlockedRegions: gameState.teamA.unlockedRegions || [],
            coloredRegions: gameState.teamA.coloredRegions || {}
          },
          teamB: {
            score: gameState.teamB.score,
            bonusScore: gameState.teamB.bonusScore,
            answers: gameState.teamB.answers || {},
            isLocked: Boolean(gameState.teamB.isLocked),
            unlockedRegions: gameState.teamB.unlockedRegions || [],
            coloredRegions: gameState.teamB.coloredRegions || {}
          }
        })
      });
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.sessionId) {
          gameState.sessionId = json.sessionId;
        }
      }
    } catch (_e) {}
  }

  // Cập nhật tình trạng kết nối 2 đội hiển thị trên màn hình phòng chờ điện thoại
  function updateMobileLobbyTeamsStatus(connectedTeams) {
    if (!connectedTeams) return;
    const itemA = document.getElementById('gmmMobLobbyStatusTeamA');
    const itemB = document.getElementById('gmmMobLobbyStatusTeamB');
    if (itemA) {
      if (connectedTeams.teamA) {
        itemA.className = 'gmm-mob-team-item ready';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemA.className = 'gmm-mob-team-item waiting';
        itemA.innerHTML = '<span class="dot">●</span><span>🔴 Đội 1 (Đội A): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
    if (itemB) {
      if (connectedTeams.teamB) {
        itemB.className = 'gmm-mob-team-item ready';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đã sẵn sàng</strong></span>';
      } else {
        itemB.className = 'gmm-mob-team-item waiting';
        itemB.innerHTML = '<span class="dot">●</span><span>🔵 Đội 2 (Đội B): <strong class="val">Đang chờ quét mã...</strong></span>';
      }
    }
  }

  let mobileSessionId = null;
  let mobileSyncPollInterval = null;
  let studentSseSource = null;
  let isMobileLifecycleBound = false;
  let lastMobileStateFingerprint = '';
  let lastMobileJoinAnnounceAt = 0;

  function announceMobileJoinToServer(teamKey, force = false) {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
    const tKey = teamKey || studentTeamKey;
    if (tKey !== 'teamA' && tKey !== 'teamB') return;
    const now = Date.now();
    if (!force && now - lastMobileJoinAnnounceAt < 3000) return;
    lastMobileJoinAnnounceAt = now;

    try {
      fetch('/api/gmm/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: tKey })
      }).catch(() => {});
    } catch (_e) {}
  }

  function startMobileStatePolling() {
    if (mobileSyncPollInterval) {
      clearInterval(mobileSyncPollInterval);
    }
    // Kênh đồng bộ kép (Polling 2.5s dự phòng cho Zalo WebView khi SSE bị đóng băng chạy ngầm)
    mobileSyncPollInterval = setInterval(() => {
      if (isStudentMobileClient) {
        fetchCurrentServerState(true);
      }
    }, 2500);
  }

  function bindMobileLifecycleSync() {
    if (isMobileLifecycleBound || typeof window === 'undefined') return;
    isMobileLifecycleBound = true;

    const handleWakeOrFocus = () => {
      if (!isStudentMobileClient) return;
      if (!studentSseSource || studentSseSource.readyState === 2) {
        connectStudentSSE();
      }
      announceMobileJoinToServer(studentTeamKey, false);
      fetchCurrentServerState(false);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleWakeOrFocus();
      }
    });
    window.addEventListener('focus', handleWakeOrFocus);
    window.addEventListener('pageshow', handleWakeOrFocus);
    window.addEventListener('online', handleWakeOrFocus);
  }

  async function syncMobileNow() {
    if (!isStudentMobileClient) return;
    announceMobileJoinToServer(studentTeamKey, true);
    if (!studentSseSource || studentSseSource.readyState === 2) {
      connectStudentSSE();
    }
    await fetchCurrentServerState(false);
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã đồng bộ trạng thái mới nhất từ máy chiếu!', 'success');
    }
  }

  // Khởi tạo Giao diện Thi đấu dành cho Học sinh trên Điện thoại (Student Mobile Arena)
  async function initStudentMobileArena(teamKey) {
    isStudentMobileClient = true;
    studentTeamKey = teamKey;

    // Kích hoạt chế độ cô lập điện thoại học sinh
    document.documentElement.classList.add('gmm-student-mode');
    document.body.classList.add('gmm-student-mode');

    const arena = document.getElementById('gmmStudentArena');
    if (!arena) return;

    arena.classList.add('active');

    // Cập nhật thông tin nhận diện Đội
    const tag = document.getElementById('gmmMobTeamTag');
    const icon = document.getElementById('gmmMobTeamIcon');
    const name = document.getElementById('gmmMobTeamName');
    const lobbyTitle = document.getElementById('gmmMobLobbyTeamTitle');
    const lobbySymbol = document.getElementById('gmmMobLobbySymbolTitle');
    const lobbyRoom = document.getElementById('gmmMobLobbyRoomCode');

    if (lobbyRoom) lobbyRoom.textContent = gameState.roomCode || '2011-THCS';

    const currentTeamName = (teamKey === 'teamA') ? (gameState.teamA?.name || 'ĐOÀN KẾT') : (gameState.teamB?.name || 'LA BÀN TUỔI TRẺ');
    const teamNumStr = teamKey === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';

    if (teamKey === 'teamA') {
      if (tag) tag.className = 'gmm-mob-team-tag team-a';
      if (icon) icon.textContent = '🔴';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔴 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Ngôi trường hạnh phúc không bạo lực"';
    } else {
      if (tag) tag.className = 'gmm-mob-team-tag team-b';
      if (icon) icon.textContent = '🔵';
      if (name) name.textContent = `${teamNumStr} - ${currentTeamName}`.toUpperCase();
      if (lobbyTitle) lobbyTitle.textContent = `🔵 ${currentTeamName} (${teamNumStr})`.toUpperCase();
      if (lobbySymbol) lobbySymbol.textContent = 'Biểu tượng: "Trái tim thấu cảm – Tự tin tỏa sáng"';
    }

    // Khôi phục dữ liệu tạm từ LocalStorage trước, sau đó kiểm tra đối chiếu sessionId với máy chủ
    loadMobileAnswersFromLocal();

    // Báo cho Server biết đội đã vào phòng thi
    announceMobileJoinToServer(teamKey, true);

    // Kết nối SSE + Kênh Polling dự phòng 2.5s + Tự đồng bộ khi mở lại màn hình Zalo WebView
    connectStudentSSE();
    bindMobileLifecycleSync();
    startMobileStatePolling();

    // Tự động kích hoạt Wake Lock giữ sáng màn hình + Khóa chống thoát trang + Phát nhịp tim Live Ping
    requestScreenWakeLock();
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.initStudentMonitor === 'function') {
      window.GiaiMaLiveMonitor.initStudentMonitor(teamKey);
    }

    // Lấy trạng thái chuẩn xác từ máy chủ TRƯỚC (để tự xóa kết quả cũ nếu Thầy/Cô đã tạo ván mới)
    await fetchCurrentServerState(false);

    // Chỉ gửi bù hàng đợi offline nếu vẫn thuộc cùng phiên thi đấu đang chạy
    if (mobilePendingSyncQueue.length > 0 && !mobileIsLocked) {
      flushPendingSyncQueue();
    }
  }

  function getMobileTelemetrySnapshot() {
    const paintView = document.getElementById('gmmMobPaintView');
    const lobbyView = document.getElementById('gmmMobLobbyView');
    let currentPage = 'quiz';
    if (paintView && paintView.style.display !== 'none') {
      currentPage = 'decrypt';
    } else if (wasMobileInLobby || (lobbyView && lobbyView.style.display !== 'none')) {
      currentPage = 'lobby';
    } else if (mobileIsLocked) {
      currentPage = 'locked';
    }
    return {
      currentPage,
      currentQ: (typeof mobileActiveQIndex === 'number' ? mobileActiveQIndex : 0) + 1,
      answeredCount: Object.keys(mobileTeamAnswers || {}).length,
      isLocked: Boolean(mobileIsLocked)
    };
  }

  function jumpMobileToFirstUnanswered() {
    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      const qId = list[i].id;
      if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
        mobileActiveQIndex = i;
        return;
      }
    }
  }

  async function fetchCurrentServerState(isBackgroundPoll = false) {
    try {
      const res = await fetch('/api/gmm/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state) {
          const statusPill = document.getElementById('gmmMobStatusPill');
          const statusText = document.getElementById('gmmMobStatusText');
          if (statusPill && statusPill.classList.contains('offline') && mobilePendingSyncQueue.length === 0) {
            statusPill.className = 'gmm-mob-status-pill';
            if (statusText) statusText.textContent = 'Đã kết nối máy chiếu';
          }
          applyServerStateToMobile(json.state, isBackgroundPoll);
        }
      }
    } catch (_e) {}
  }

  let mobileQuestionsList = [];
  let mobileActiveQIndex = 0;
  let mobileTeamAnswers = {};
  let mobileIsLocked = false;
  let mobileFinishTimeFormatted = '';
  let mobileFinishTimeSeconds = 0;
  let mobileTotalSeconds = 300;
  let mobileRemainingSeconds = 300;
  let mobileTimerInterval = null;

  function startMobileTimer(sec, totalSec) {
    if (typeof sec === 'number') mobileRemainingSeconds = sec;
    if (typeof totalSec === 'number') mobileTotalSeconds = totalSec;

    clearInterval(mobileTimerInterval);
    updateMobileTimerUI();

    mobileTimerInterval = setInterval(() => {
      if (mobileRemainingSeconds > 0) {
        mobileRemainingSeconds--;
        updateMobileTimerUI();

        if (mobileRemainingSeconds <= 10 && mobileRemainingSeconds > 0) {
          if (window.audioManager && typeof window.audioManager.playTimerTick === 'function') {
            window.audioManager.playTimerTick(mobileRemainingSeconds);
          }
        }

        if (mobileRemainingSeconds === 0) {
          clearInterval(mobileTimerInterval);
          autoLockMobileTeam();
        }
      }
    }, 1000);
  }

  function updateMobileTimerUI() {
    const timerNum = document.getElementById('gmmMobTimerNum');
    const progressBar = document.getElementById('gmmMobTimerProgressBar');
    if (timerNum) {
      timerNum.textContent = formatMinutesSeconds(mobileRemainingSeconds);
      if (mobileRemainingSeconds <= 30) {
        timerNum.style.color = '#ef4444';
      } else {
        timerNum.style.color = '#10b981';
      }
    }
    if (progressBar) {
      const total = mobileTotalSeconds || 300;
      const pct = Math.max(0, Math.min(100, (mobileRemainingSeconds / total) * 100));
      progressBar.style.width = pct + '%';
      if (mobileRemainingSeconds <= 30) {
        progressBar.classList.add('danger');
      } else {
        progressBar.classList.remove('danger');
      }
    }
  }

  // Quản lý đồng hồ đếm ngược Tô Màu & Giải Mã Tranh trên điện thoại học sinh (Tab 4)
  let mobileDecryptRemainingSeconds = 180;
  let mobileDecryptTotalSeconds = 180;
  let mobileIsDecryptTimerRunning = false;
  let mobileDecryptTimerInterval = null;

  function stopMobileDecryptTicker() {
    if (mobileDecryptTimerInterval) {
      clearInterval(mobileDecryptTimerInterval);
      mobileDecryptTimerInterval = null;
    }
  }

  function syncMobileDecryptTimer(remainingSec, totalSec, isRunning) {
    if (typeof remainingSec === 'number' && !Number.isNaN(remainingSec)) {
      mobileDecryptRemainingSeconds = Math.max(0, remainingSec);
    }
    if (typeof totalSec === 'number' && totalSec > 0) {
      mobileDecryptTotalSeconds = totalSec;
    }
    if (typeof isRunning === 'boolean') {
      mobileIsDecryptTimerRunning = isRunning;
    }

    updateMobileDecryptTimerUI();

    if (mobileIsDecryptTimerRunning && mobileDecryptRemainingSeconds > 0) {
      if (!mobileDecryptTimerInterval) {
        mobileDecryptTimerInterval = setInterval(() => {
          if (!mobileIsDecryptTimerRunning) {
            stopMobileDecryptTicker();
            return;
          }
          if (mobileDecryptRemainingSeconds > 0) {
            mobileDecryptRemainingSeconds--;
            updateMobileDecryptTimerUI();
          }
          if (mobileDecryptRemainingSeconds <= 0) {
            mobileIsDecryptTimerRunning = false;
            stopMobileDecryptTicker();
            updateMobileDecryptTimerUI();
          }
        }, 1000);
      }
    } else {
      stopMobileDecryptTicker();
    }
  }

  function updateMobileDecryptTimerUI() {
    const totalSec = Math.max(0, mobileDecryptRemainingSeconds || 0);
    const totalDuration = Math.max(1, mobileDecryptTotalSeconds || 180);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const percent = Math.min(100, Math.max(0, Math.round((totalSec / totalDuration) * 100)));

    const digitsEl = document.getElementById('gmmMobDecTimerDigits');
    const fillEl = document.getElementById('gmmMobDecProgressFill');
    const badgeEl = document.getElementById('gmmMobDecTimerBadge');
    const statusEl = document.getElementById('gmmMobDecTimerStatus');
    const tipEl = document.getElementById('gmmMobDecTimerTip');
    const percentEl = document.getElementById('gmmMobDecTimerPercent');

    if (digitsEl) digitsEl.textContent = timeStr;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;

    let colorClass = 'normal-green';
    let badgeClass = 'normal';

    if (totalSec === 0) {
      colorClass = 'time-up';
      badgeClass = 'done';
      if (statusEl) statusEl.textContent = '🎉 HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = '📸 Hết giờ! Hãy chụp ảnh tranh gửi lên máy chiếu!';
    } else if (!mobileIsDecryptTimerRunning) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏸️ TẠM DỪNG ĐỒNG HỒ';
      if (tipEl) tipEl.textContent = 'Thầy/Cô đang tạm dừng đếm ngược trên máy chiếu.';
    } else if (totalSec <= 10) {
      colorClass = 'urgent-red';
      badgeClass = 'urgent';
      if (statusEl) statusEl.textContent = '🔥 10 GIÂY CUỐI CÙNG!';
      if (tipEl) tipEl.textContent = 'Khẩn trương hoàn tất những nét tô màu cuối!';

      // Rung phản hồi xúc giác (Haptic) khi còn đúng 5, 3, 1 giây
      if ((totalSec === 5 || totalSec === 3 || totalSec === 1) && navigator.vibrate) {
        try { navigator.vibrate([120, 60, 120]); } catch (_) {}
      }
    } else if (totalSec <= 30) {
      colorClass = 'warning-amber';
      badgeClass = 'warning';
      if (statusEl) statusEl.textContent = '⏳ SẮP HẾT GIỜ TÔ TRANH';
      if (tipEl) tipEl.textContent = 'Thời gian sắp hết, hai đội tập trung tăng tốc!';
    } else {
      colorClass = 'normal-green';
      badgeClass = 'normal';
      if (statusEl) statusEl.textContent = '⏱️ ĐANG ĐẾM NGƯỢC TÔ TRANH';
      if (tipEl) tipEl.textContent = '⚡ Hai đội đối chiếu tọa độ và tô màu lên tranh!';
    }

    if (digitsEl) digitsEl.className = `gmm-mob-dec-timer-digits ${colorClass}`;
    if (fillEl) fillEl.className = `gmm-mob-dec-progress-fill ${colorClass}`;
    if (badgeEl) badgeEl.className = `gmm-mob-dec-timer-badge ${badgeClass}`;
  }

  function updateMobileFinishArtworkUI(teamState) {
    const finishBtn = document.getElementById('gmmMobBtnFinishArtwork');
    const finishBadge = document.getElementById('gmmMobFinishSuccessBadge');
    const finishSub = document.getElementById('gmmMobFinishBadgeSub');
    if (teamState && teamState.isArtworkFinished) {
      if (finishBtn) finishBtn.style.display = 'none';
      if (finishBadge) finishBadge.style.display = 'block';
      if (finishSub) {
        const fTime = teamState.artworkFinishTime || '02:00';
        const sBonus = teamState.speedBonus || 2;
        finishSub.textContent = `⏱️ Thời gian: ${fTime} • Nhận +${sBonus} điểm thưởng tốc độ!`;
      }
    } else {
      if (finishBtn) finishBtn.style.display = 'flex';
      if (finishBadge) finishBadge.style.display = 'none';
    }
  }

  // Học sinh bấm nút "Báo Cáo Đã Tô Xong Sớm" từ điện thoại để nhận điểm thưởng tốc độ
  function reportArtworkFinishedFromMobile() {
    const teamData = gameState[studentTeamKey];
    if (teamData && teamData.isArtworkFinished) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ Đội em đã báo cáo hoàn thành tranh trước đó rồi!', 'info');
      }
      return;
    }

    const ok = confirm(
      '🎉 XÁC NHẬN BÁO CÁO ĐÃ TÔ XONG TRANH GIẤY A1!\n\n' +
      'Đội em đã hoàn thiện toàn bộ các mảng màu trên tờ tranh giấy A1 của đội mình chưa?\n\n' +
      '(Hệ thống sẽ ghi nhận mốc thời gian hoàn thành sớm để tính điểm thưởng tốc độ +2 điểm!)'
    );
    if (!ok) return;

    const totalSec = Math.max(1, mobileDecryptTotalSeconds || 180);
    const remSec = Math.max(0, mobileDecryptRemainingSeconds || 0);
    const elapsed = Math.max(0, totalSec - remSec);
    const finishTimeStr = formatMinutesSeconds(elapsed);
    const speedBonus = remSec > 0 ? 2 : 0;

    if (teamData) {
      teamData.completed = true;
      teamData.isArtworkFinished = true;
      teamData.artworkFinishTime = finishTimeStr;
      teamData.artworkFinishSeconds = elapsed;
      teamData.speedBonus = speedBonus;
      teamData.bonusScore = (teamData.bonusScore || 0) + speedBonus;
    }

    // Cập nhật giao diện trên điện thoại ngay lập tức
    const btn = document.getElementById('gmmMobBtnFinishArtwork');
    const badge = document.getElementById('gmmMobFinishSuccessBadge');
    const sub = document.getElementById('gmmMobFinishBadgeSub');
    if (btn) btn.style.display = 'none';
    if (badge) badge.style.display = 'block';
    if (sub) {
      sub.textContent = speedBonus > 0
        ? `⏱️ Thời gian: ${finishTimeStr} • Nhận +${speedBonus} điểm thưởng tốc độ!`
        : `⏱️ Thời gian: ${finishTimeStr} • Đã hoàn thành tranh!`;
    }

    // Bắn pháo hoa Confetti ăn mừng trên điện thoại
    if (typeof confetti === 'function') {
      try {
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, zIndex: 99999 });
      } catch (_) {}
    }
    if (navigator.vibrate) {
      try { navigator.vibrate([120, 60, 120, 60, 240]); } catch (_) {}
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 XUẤT SẮC! Đã báo cáo hoàn thành tranh sớm (⏱️ ${finishTimeStr}, +${speedBonus}đ tốc độ)!`, 'success');
    }

    // Gửi báo cáo lên máy chủ
    fetch('/api/gmm/finish-artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team: studentTeamKey,
        finishTime: finishTimeStr,
        finishSeconds: elapsed,
        remainingSeconds: remSec,
        speedBonus: speedBonus
      })
    }).catch(() => {});
  }

  let mobileAutoAdvanceTimer = null;
  let isMobileSwipeBound = false;
  let isMobileReviewMode = false;
  let mobileAudioCtx = null;
  let mobilePendingSyncQueue = [];

  // Âm thanh "Ting" vui nhộn ngay trên loa điện thoại (Web Audio API Synthesizer)
  function playMobileTingSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!mobileAudioCtx) {
        mobileAudioCtx = new AudioCtx();
      }
      if (mobileAudioCtx.state === 'suspended') {
        mobileAudioCtx.resume().catch(() => {});
      }
      const now = mobileAudioCtx.currentTime;

      // Nốt 1: E6 (1318.5 Hz)
      const osc1 = mobileAudioCtx.createOscillator();
      const gain1 = mobileAudioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(mobileAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nốt 2 lấp lánh vui nhộn: B6 (1975.5 Hz) sau 0.05s
      const osc2 = mobileAudioCtx.createOscillator();
      const gain2 = mobileAudioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.5, now + 0.05);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(mobileAudioCtx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.45);
    } catch (_e) {}
  }

  // Quản lý lưu trữ Offline-first & Hàng đợi đồng bộ bù khi mất Wi-Fi
  function getMobileStorageKey(subKey) {
    return `gmm_mob_${studentTeamKey || 'team'}_${subKey}`;
  }

  function saveMobileAnswersToLocal() {
    try {
      localStorage.setItem(getMobileStorageKey('answers'), JSON.stringify(mobileTeamAnswers));
      if (mobileIsLocked) {
        localStorage.setItem(getMobileStorageKey('locked'), '1');
      } else {
        localStorage.removeItem(getMobileStorageKey('locked'));
      }
      if (mobileFinishTimeFormatted) {
        localStorage.setItem(getMobileStorageKey('finishTime'), mobileFinishTimeFormatted);
      } else {
        localStorage.removeItem(getMobileStorageKey('finishTime'));
      }
      if (mobileSessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), String(mobileSessionId));
      }
    } catch (_e) {}
  }

  function loadMobileAnswersFromLocal() {
    try {
      const savedSession = localStorage.getItem(getMobileStorageKey('sessionId'));
      if (savedSession) {
        mobileSessionId = String(savedSession);
      }
      const saved = localStorage.getItem(getMobileStorageKey('answers'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          mobileTeamAnswers = Object.assign({}, parsed, mobileTeamAnswers);
        }
      }
      if (localStorage.getItem(getMobileStorageKey('locked')) === '1') {
        mobileIsLocked = true;
      }
      const savedFinishTime = localStorage.getItem(getMobileStorageKey('finishTime'));
      if (savedFinishTime) {
        mobileFinishTimeFormatted = savedFinishTime;
      }
      const queueSaved = localStorage.getItem(getMobileStorageKey('syncQueue'));
      if (queueSaved) {
        const queueParsed = JSON.parse(queueSaved);
        if (Array.isArray(queueParsed)) {
          mobilePendingSyncQueue = queueParsed;
        }
      }
    } catch (_e) {}
  }

  // Xóa sạch toàn bộ dữ liệu ván cũ (RAM + LocalStorage + Giao diện Khóa bài) trên điện thoại học sinh
  function resetMobileClientState(newSessionId) {
    clearInterval(mobileTimerInterval);
    mobileTimerInterval = null;
    stopMobileDecryptTicker();
    mobileIsDecryptTimerRunning = false;
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    mobileActiveQIndex = 0;
    mobileTeamAnswers = {};
    mobileIsLocked = false;
    mobileFinishTimeFormatted = '';
    mobileFinishTimeSeconds = 0;
    isMobileReviewMode = false;
    mobilePendingSyncQueue = [];
    lastMobileStateFingerprint = '';

    mobileCapturedPhotoData = null;
    mobileOriginalPhotoData = null;
    mobileEnhancedPhotoData = null;
    mobilePhotoRotation = 0;
    mobilePhotoTilt = 0;
    isMobileAiEnhanced = true;

    if (newSessionId) {
      mobileSessionId = String(newSessionId);
    }

    try {
      localStorage.removeItem(getMobileStorageKey('answers'));
      localStorage.removeItem(getMobileStorageKey('locked'));
      localStorage.removeItem(getMobileStorageKey('finishTime'));
      localStorage.removeItem(getMobileStorageKey('finishSeconds'));
      localStorage.removeItem(getMobileStorageKey('syncQueue'));
      if (mobileSessionId) {
        localStorage.setItem(getMobileStorageKey('sessionId'), mobileSessionId);
      } else {
        localStorage.removeItem(getMobileStorageKey('sessionId'));
      }
    } catch (_e) {}

    // Đóng tất cả thẻ kết quả cũ, modal câu sai và thông báo tải ảnh của ván trước
    closeMistakesReviewModal();
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeScanner === 'function') {
      try { window.GiaiMaArtworkScanner.closeScanner(); } catch (_e) {}
    }

    const lockedCard = document.getElementById('gmmMobLockedSuccessCard');
    if (lockedCard) lockedCard.style.display = 'none';

    const stage = document.getElementById('gmmMobQuestionStage');
    if (stage) stage.style.display = 'block';

    const btnReviewText = document.getElementById('gmmMobBtnReviewText');
    if (btnReviewText) btnReviewText.textContent = '👁️ Lướt xem chi tiết từng câu hỏi';

    const finishBadge = document.getElementById('gmmMobFinishTimeBadge');
    if (finishBadge) finishBadge.style.display = 'none';

    const previewWrap = document.getElementById('gmmMobPhotoPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';

    document.querySelectorAll('.gmm-mob-upload-success').forEach(el => {
      el.style.display = 'none';
    });

    updateSyncStatusBadge();
    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');
  }

  function addToPendingSyncQueue(questionId, optionIdx) {
    const existing = mobilePendingSyncQueue.find(item => item.questionId === questionId);
    if (existing) {
      existing.optionIdx = optionIdx;
      existing.sessionId = mobileSessionId;
      existing.timestamp = Date.now();
    } else {
      mobilePendingSyncQueue.push({
        questionId,
        optionIdx,
        sessionId: mobileSessionId,
        timestamp: Date.now()
      });
    }
    try {
      localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobilePendingSyncQueue));
    } catch (_e) {}
    updateSyncStatusBadge();
  }

  async function flushPendingSyncQueue() {
    if (mobilePendingSyncQueue.length === 0) return;
    const items = [...mobilePendingSyncQueue];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.sessionId && mobileSessionId && String(item.sessionId) !== String(mobileSessionId)) {
        mobilePendingSyncQueue = mobilePendingSyncQueue.filter(q => q !== item);
        continue;
      }
      try {
        const res = await fetch('/api/gmm/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team: studentTeamKey,
            questionId: item.questionId,
            optionIndex: item.optionIdx,
            sessionId: mobileSessionId
          })
        });
        if (res.ok) {
          mobilePendingSyncQueue = mobilePendingSyncQueue.filter(q => q.questionId !== item.questionId);
          try {
            localStorage.setItem(getMobileStorageKey('syncQueue'), JSON.stringify(mobilePendingSyncQueue));
          } catch (_e) {}
        } else if (res.status === 409) {
          const errJson = await res.json().catch(() => ({}));
          if (errJson && errJson.staleSession) {
            resetMobileClientState(errJson.currentSessionId);
            if (errJson.state) applyServerStateToMobile(errJson.state, false);
            return;
          }
          mobilePendingSyncQueue = [];
          try { localStorage.removeItem(getMobileStorageKey('syncQueue')); } catch (_e) {}
          break;
        }
      } catch (_e) {
        break; // Mạng vẫn chưa ổn định
      }
    }
    updateSyncStatusBadge();
  }

  function updateSyncStatusBadge() {
    const statusText = document.getElementById('gmmMobStatusText');
    const statusPill = document.getElementById('gmmMobStatusPill');
    if (!statusText || !statusPill) return;

    if (mobilePendingSyncQueue.length > 0) {
      statusPill.className = 'gmm-mob-status-pill offline';
      statusText.textContent = `Lưu tạm (${mobilePendingSyncQueue.length} câu chờ Wi-Fi)`;
    } else {
      statusPill.className = 'gmm-mob-status-pill';
      statusText.textContent = 'Đã kết nối máy chiếu';
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      flushPendingSyncQueue();
      if (typeof window.showToast === 'function') {
        window.showToast('📶 Đã có kết nối Wi-Fi! Đang tự động gửi bù đáp án...', 'success');
      }
    });
  }

  // Bật / tắt chế độ xem lại 10 câu hỏi sau khi đã nộp bài
  function toggleReviewQuestions() {
    isMobileReviewMode = !isMobileReviewMode;
    const stage = document.getElementById('gmmMobQuestionStage');
    const btnText = document.getElementById('gmmMobBtnReviewText');
    if (stage) {
      stage.style.display = isMobileReviewMode ? 'block' : 'none';
    }
    if (btnText) {
      btnText.textContent = isMobileReviewMode ? '🔼 Thu gọn danh sách câu hỏi' : '👁️ Lướt xem chi tiết từng câu hỏi';
    }
    if (isMobileReviewMode) {
      renderCurrentMobileQuestion();
    }
  }

  // ==================== XEM LẠI CÂU SAI & ĐÁP ÁN CHUẨN TRÊN ĐIỆN THOẠI ====================
  let mistakesFilterType = 'all'; // 'all' | 'wrong' | 'correct'

  function openMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'flex';
    mistakesFilterType = 'all';
    renderMistakesReviewList();
  }

  function closeMistakesReviewModal() {
    const modal = document.getElementById('gmmMobMistakesModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function filterMistakesView(type) {
    mistakesFilterType = type || 'all';
    renderMistakesReviewList();
  }

  function renderMistakesReviewList() {
    const listEl = document.getElementById('gmmMobMistakesList');
    const subtitleEl = document.getElementById('gmmMobMistakesSubtitle');
    const tabAll = document.getElementById('gmmFilterAll');
    const tabWrong = document.getElementById('gmmFilterWrong');
    const tabCorrect = document.getElementById('gmmFilterCorrect');
    if (!listEl) return;

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    const letters = ['A', 'B', 'C', 'D'];

    let correctCount = 0;
    let wrongCount = 0;

    list.forEach((q) => {
      const myAns = mobileTeamAnswers[q.id];
      if (myAns === q.correct) correctCount++;
      else wrongCount++;
    });

    if (subtitleEl) {
      subtitleEl.textContent = `Đội em làm đúng ${correctCount}/${list.length} câu (${Math.round((correctCount / list.length) * 100)}%) • Sai ${wrongCount} câu`;
    }

    if (tabAll) {
      tabAll.textContent = `Tất cả (${list.length})`;
      tabAll.classList.toggle('active', mistakesFilterType === 'all');
    }
    if (tabWrong) {
      tabWrong.textContent = `❌ Câu sai (${wrongCount})`;
      tabWrong.classList.toggle('active', mistakesFilterType === 'wrong');
    }
    if (tabCorrect) {
      tabCorrect.textContent = `✅ Câu đúng (${correctCount})`;
      tabCorrect.classList.toggle('active', mistakesFilterType === 'correct');
    }

    const filtered = list.filter((q) => {
      const myAns = mobileTeamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      if (mistakesFilterType === 'wrong') return !isCorrect;
      if (mistakesFilterType === 'correct') return isCorrect;
      return true;
    });

    if (filtered.length === 0) {
      if (mistakesFilterType === 'wrong') {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #34d399;">
            <div style="font-size: 2.4rem; margin-bottom: 8px;">🎉</div>
            <div style="font-size: 1.05rem; font-weight: 800;">Tuyệt vời! Đội em không làm sai câu nào!</div>
            <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 6px;">Toàn bộ ${list.length} câu trắc nghiệm của đội em đều chính xác hoàn hảo.</div>
          </div>
        `;
      } else {
        listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #94a3b8;">Không có câu hỏi nào trong danh mục này.</div>`;
      }
      return;
    }

    listEl.innerHTML = filtered.map((q) => {
      const origIdx = list.findIndex(item => item.id === q.id);
      const qNumber = origIdx !== -1 ? origIdx + 1 : q.id;
      const myAns = mobileTeamAnswers[q.id];
      const isCorrect = (myAns === q.correct);
      const hasAns = (myAns !== undefined && myAns !== null);

      const myAnsLetter = hasAns ? letters[myAns] : '';
      const myAnsText = hasAns && q.options[myAns] ? q.options[myAns] : 'Chưa chọn đáp án';
      const correctLetter = letters[q.correct];
      const correctText = q.options[q.correct];
      const coordName = q.coordinate || `Ô số ${qNumber}`;

      return `
        <div class="gmm-mob-mistake-card ${isCorrect ? 'correct' : 'wrong'}">
          <div class="gmm-mob-mistake-qnum">
            <span style="color: ${isCorrect ? '#34d399' : '#f87171'};">CÂU HỎI ${qNumber}/${list.length}</span>
            <span style="font-size: 0.76rem; font-weight: 800; color: ${isCorrect ? '#34d399' : '#f87171'};">
              ${isCorrect ? '✅ ĐÃ LÀM ĐÚNG' : '❌ CHƯA ĐÚNG'}
            </span>
          </div>
          <div class="gmm-mob-mistake-qtext">${q.question}</div>

          <!-- Phương án đội em đã chọn -->
          <div class="gmm-mob-mistake-answer-row my-ans ${isCorrect ? 'correct' : 'wrong'}">
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 2px;">
              👉 Lựa chọn của Đội em:
            </div>
            <div>
              <strong>[${myAnsLetter || '?'}]</strong> ${myAnsText}
              ${isCorrect ? ' <span style="color: #34d399; font-weight: 800;">(+1 Điểm)</span>' : ' <span style="color: #ef4444; font-weight: 800;">(Sai)</span>'}
            </div>
          </div>

          <!-- Đáp án chuẩn của Thầy/Cô -->
          ${!isCorrect ? `
            <div class="gmm-mob-mistake-answer-row correct-ans">
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #34d399; margin-bottom: 2px;">
                ✨ Đáp án chuẩn của Thầy/Cô:
              </div>
              <div>
                <strong>[${correctLetter}]</strong> ${correctText}
              </div>
            </div>
          ` : ''}

          <div class="gmm-mob-mistake-coord">
            <span>🎯 Tọa độ mở khóa bảng giấy A1: <strong>${coordName}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render thẻ chúc mừng và danh sách các toạ độ mở khóa
  function renderLockedSuccessCard() {
    const card = document.getElementById('gmmMobLockedSuccessCard');
    const chipsWrap = document.getElementById('gmmMobUnlockedCoordsList');
    if (!card) return;

    if (!mobileIsLocked) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';

    // Cập nhật nhãn thời gian hoàn thành trên điện thoại
    const timeBadge = document.getElementById('gmmMobFinishTimeBadge');
    const timeVal = document.getElementById('gmmMobFinishTimeVal');
    if (timeBadge && timeVal) {
      if (mobileFinishTimeFormatted) {
        timeVal.textContent = mobileFinishTimeFormatted;
        timeBadge.style.display = 'inline-flex';
      } else {
        timeBadge.style.display = 'none';
      }
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    const correctItems = [];

    list.forEach((q, idx) => {
      const myAns = mobileTeamAnswers[q.id];
      if (myAns !== undefined && myAns !== null && myAns === q.correct) {
        correctItems.push({
          num: idx + 1,
          coord: q.coordinate || `Ô số ${idx + 1}`
        });
      }
    });

    if (chipsWrap) {
      if (correctItems.length === 0) {
        chipsWrap.innerHTML = '<div style="color: #cbd5e1; font-size: 0.88rem; font-style: italic;">Chưa mở khóa được ô nào. Đội em hãy cùng quan sát diễn biến trên máy chiếu nhé!</div>';
      } else {
        chipsWrap.innerHTML = correctItems.map(item => `
          <div class="gmm-mob-coord-chip">
            <span>🎯 ${item.coord}</span>
          </div>
        `).join('');
      }
    }

    // Cập nhật nhãn nút Xem lại câu sai & đáp án chuẩn
    const btnMistakes = document.getElementById('gmmMobBtnReviewMistakes');
    if (btnMistakes) {
      let wrong = 0;
      list.forEach((q) => {
        const myAns = mobileTeamAnswers[q.id];
        if (myAns !== q.correct) wrong++;
      });
      if (wrong > 0) {
        btnMistakes.innerHTML = `<span>📝 Xem Lại ${wrong} Câu Sai & Đáp Án Chuẩn</span>`;
        btnMistakes.className = 'gmm-mob-btn-review mistakes';
      } else {
        btnMistakes.innerHTML = `<span>🎉 Đội Em Đúng 10/10 - Xem Bảng Vinh Danh</span>`;
        btnMistakes.className = 'gmm-mob-btn-review';
        btnMistakes.style.borderColor = '#34d399';
        btnMistakes.style.color = '#34d399';
      }
    }
  }

  // Tự động chuyển sang câu tiếp theo sau khi chọn đáp án
  function triggerMobileAutoAdvance(currentIdx) {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    const answeredCount = Object.keys(mobileTeamAnswers).length;

    // Rung nhẹ haptic feedback nếu thiết bị hỗ trợ
    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (_e) {}
    }

    // Hiển thị thông báo trạng thái ngắn
    const banner = document.getElementById('gmmMobStatusBanner');
    if (banner) {
      banner.innerHTML = `⚡ <strong>Đã ghi nhận đáp án!</strong> Đang tự động chuyển câu tiếp theo...`;
    }

    mobileAutoAdvanceTimer = setTimeout(() => {
      if (currentIdx < list.length - 1) {
        goToMobileQuestion(currentIdx + 1, 'next');
      } else {
        let firstUnanswered = -1;
        for (let i = 0; i < list.length; i++) {
          const qId = list[i].id;
          if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
            firstUnanswered = i;
            break;
          }
        }

        if (firstUnanswered !== -1 && firstUnanswered !== currentIdx) {
          goToMobileQuestion(firstUnanswered, 'next');
          if (typeof window.showToast === 'function') {
            window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
          }
        } else if (answeredCount >= list.length) {
          renderCurrentMobileQuestion();
          if (typeof window.showToast === 'function') {
            window.showToast('🎉 Đội em đã hoàn thành 10/10 câu! Hãy kiểm tra lại hoặc bấm Chốt nộp bài.', 'success');
          }
        }
      }
    }, 450);
  }

  // Khởi tạo cử chỉ vuốt ngón tay (Swipe Gesture) sang trái/phải trên màn hình điện thoại
  function bindMobileSwipeGestures() {
    if (isMobileSwipeBound) return;
    const quizView = document.getElementById('gmmMobQuizView');
    if (!quizView) return;
    isMobileSwipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    quizView.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    quizView.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const timeElapsed = Date.now() - touchStartTime;

        // Vuốt dứt khoát trong 500ms, độ dịch chuyển ngang > 50px và góc nghiêng chuẩn
        if (timeElapsed < 500 && Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
          if (diffX < 0) {
            nextMobileQuestion();
          } else {
            prevMobileQuestion();
          }
        }
      }
    }, { passive: true });
  }

  function renderMobileQuestionPalette() {
    const pal = document.getElementById('gmmMobQPalette');
    if (!pal) return;
    pal.innerHTML = '';

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;

    list.forEach((q, idx) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.setAttribute('data-index', idx);
      const myAns = mobileTeamAnswers[q.id];
      const hasAns = (myAns !== undefined && myAns !== null);
      const isActive = (idx === mobileActiveQIndex);

      let cls = 'gmm-mob-q-tag';
      if (mobileIsLocked) {
        if (myAns === q.correct) cls += ' correct';
        else if (hasAns) cls += ' wrong';
      } else if (hasAns) {
        cls += ' answered';
      }
      if (isActive) cls += ' active';

      tag.className = cls;
      tag.textContent = idx + 1;
      tag.onclick = (e) => {
        if (e) e.preventDefault();
        const dir = (idx >= mobileActiveQIndex) ? 'next' : 'prev';
        goToMobileQuestion(idx, dir);
      };
      pal.appendChild(tag);
    });

    const countEl = document.getElementById('gmmMobAnsweredCount');
    if (countEl) {
      countEl.textContent = Object.keys(mobileTeamAnswers).length;
    }

    const lockBtn = document.getElementById('gmmMobBtnLockSubmit');
    if (lockBtn) {
      if (mobileIsLocked) {
        lockBtn.classList.add('locked');
        lockBtn.innerHTML = '<span>✅ Đội Em Đã Nộp Bài Thành Công</span>';
      } else {
        lockBtn.classList.remove('locked');
        const count = Object.keys(mobileTeamAnswers).length;
        lockBtn.innerHTML = `<span>🔒 Chốt Kết Quả & Mở Khóa Ma Trận (${count}/${list.length})</span>`;
      }
    }
  }

  function renderCurrentMobileQuestion(direction = 'none') {
    bindMobileSwipeGestures();
    renderLockedSuccessCard();

    const stage = document.getElementById('gmmMobQuestionStage');
    if (stage) {
      if (mobileIsLocked && !isMobileReviewMode) {
        stage.style.display = 'none';
      } else {
        stage.style.display = 'block';
        // Chỉ chạy hiệu ứng lướt chuyển cảnh khi học sinh chuyển câu (tránh giật khung khi đồng bộ nền)
        if (direction === 'prev' || direction === 'next') {
          stage.classList.remove('gmm-slide-in-right', 'gmm-slide-in-left');
          void stage.offsetWidth;
          stage.classList.add(direction === 'prev' ? 'gmm-slide-in-left' : 'gmm-slide-in-right');
        }
      }
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    if (!list || list.length === 0) return;

    if (mobileActiveQIndex >= list.length) mobileActiveQIndex = 0;
    const q = list[mobileActiveQIndex];
    if (!q) return;

    const qNum = document.getElementById('gmmMobQNum');
    const coordBadge = document.getElementById('gmmMobCoordBadge');
    const qText = document.getElementById('gmmMobQText');
    const grid = document.getElementById('gmmMobOptionsGrid');
    const banner = document.getElementById('gmmMobStatusBanner');
    const prevBtn = document.getElementById('gmmMobBtnPrev');
    const nextBtn = document.getElementById('gmmMobBtnNext');

    if (qNum) qNum.textContent = `CÂU HỎI ${mobileActiveQIndex + 1}/${list.length}`;
    if (coordBadge) coordBadge.textContent = `🎯 ${q.coordinate || 'Ô SỐ ' + (mobileActiveQIndex + 1)}`;
    if (qText) qText.textContent = q.question;

    if (prevBtn) {
      prevBtn.disabled = (mobileActiveQIndex === 0);
    }
    
    const answeredCount = Object.keys(mobileTeamAnswers).length;
    if (nextBtn) {
      if (mobileIsLocked) {
        nextBtn.innerHTML = '<span>Đã Nộp Bài ✅</span>';
        nextBtn.className = 'gmm-mob-nav-btn lock-ready';
      } else if (mobileActiveQIndex === list.length - 1) {
        if (answeredCount >= list.length) {
          nextBtn.innerHTML = '<span>Nộp Bài 🔒</span>';
          nextBtn.className = 'gmm-mob-nav-btn lock-ready';
        } else {
          nextBtn.innerHTML = '<span>Về Đầu ↩</span>';
          nextBtn.className = 'gmm-mob-nav-btn primary';
        }
      } else {
        nextBtn.innerHTML = '<span>Câu Tiếp ▶</span>';
        nextBtn.className = 'gmm-mob-nav-btn primary';
      }
    }

    const myAnswer = mobileTeamAnswers[q.id];
    const letters = ['A', 'B', 'C', 'D'];

    if (grid) {
      grid.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gmm-mob-opt-btn';

        const isChosen = (myAnswer === idx);
        if (isChosen) btn.classList.add('selected');

        if (mobileIsLocked) {
          if (idx === q.correct) btn.classList.add('correct');
          else if (isChosen) btn.classList.add('wrong');
        }

        btn.innerHTML = `
          <div class="gmm-mob-opt-letter">${letters[idx]}</div>
          <div style="flex: 1;">${opt}</div>
        `;

        btn.onclick = () => {
          if (mobileIsLocked) {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 Đội em đã chốt kết quả, không thể đổi đáp án!', 'warning');
            } else {
              alert('Đội em đã chốt kết quả bài thi!');
            }
            return;
          }

          // Phát âm thanh "Ting" vui nhộn ngay trên loa điện thoại
          playMobileTingSound();

          mobileTeamAnswers[q.id] = idx;
          submitAnswerFromMobile(q.id, idx);
          renderMobileQuestionPalette();
          renderCurrentMobileQuestion('next');

          // Tự động chuyển sang câu tiếp theo sau 450ms
          triggerMobileAutoAdvance(mobileActiveQIndex);
        };

        grid.appendChild(btn);
      });
    }

    if (banner) {
      const coordName = q.coordinate || `Ô số ${mobileActiveQIndex + 1}`;
      if (mobileIsLocked) {
        if (myAnswer === q.correct) {
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert success">
              <div style="font-size: 1.15rem; font-weight: 900; color: #34d399;">🎉 CHÍNH XÁC (+1 ĐIỂM)!</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #fde047; margin: 6px 0;">👉 BÁO BẠN TÔ BÚT DẠ VÀO:</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #ffffff; background: #059669; padding: 6px 16px; border-radius: 8px; display: inline-block;">TỌA ĐỘ ${coordName.toUpperCase()}</div>
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 6px;">trên bảng giấy A1 tại bàn thi!</div>
            </div>
          `;
        } else {
          const chosenLetter = (myAnswer !== undefined && myAnswer !== null) ? letters[myAnswer] : 'Chưa chọn';
          const chosenText = (myAnswer !== undefined && myAnswer !== null && q.options[myAnswer]) ? q.options[myAnswer] : 'Chưa chọn đáp án';
          const correctLetter = letters[q.correct];
          const correctText = q.options[q.correct];
          banner.innerHTML = `
            <div class="gmm-mob-coord-alert wrong">
              <div style="font-size: 1.05rem; font-weight: 900; color: #f87171; margin-bottom: 6px;">❌ CHƯA CHÍNH XÁC (Chưa mở khóa ${coordName})</div>
              <div style="font-size: 0.84rem; color: #fca5a5; margin-bottom: 4px;">• Đội em đã chọn: <strong>[${chosenLetter}] ${chosenText}</strong></div>
              <div style="font-size: 0.88rem; color: #34d399; font-weight: 800; background: rgba(5, 150, 105, 0.2); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(52, 211, 153, 0.35);">👉 Đáp án chuẩn của Thầy/Cô: <strong>[${correctLetter}] ${correctText}</strong></div>
            </div>
          `;
        }
      } else if (myAnswer !== undefined && myAnswer !== null) {
        banner.innerHTML = `✅ Đội em đã chọn [${letters[myAnswer]}]. Có thể chạm chọn lại bất kỳ lúc nào hoặc đổi câu ở thanh bên dưới!`;
      } else {
        banner.innerHTML = `👉 Chạm vào 1 trong 4 phương án trên để trả lời câu này!`;
      }
    }
  }

  function goToMobileQuestion(index, direction) {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    if (index < 0 || index >= list.length) return;

    if (!direction) {
      direction = (index >= mobileActiveQIndex) ? 'next' : 'prev';
    }

    mobileActiveQIndex = index;
    renderMobileQuestionPalette();
    renderCurrentMobileQuestion(direction);

    // Đồng bộ tức thì câu hỏi hiện tại của điện thoại lên màn hình Giáo viên
    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
      window.GiaiMaLiveMonitor.sendMobilePing(false);
    }

    // Cuộn màn hình lên đầu card câu hỏi
    const arena = document.getElementById('gmmStudentArena');
    if (arena) {
      arena.scrollTop = 0;
    }

    // Tự động cuộn thanh số Palette để thẻ số đang làm luôn nằm giữa khung nhìn
    setTimeout(() => {
      const activeTag = document.querySelector(`.gmm-mob-q-tag[data-index="${index}"]`);
      if (activeTag && typeof activeTag.scrollIntoView === 'function') {
        activeTag.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 40);
  }

  function prevMobileQuestion() {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }
    if (mobileActiveQIndex > 0) {
      goToMobileQuestion(mobileActiveQIndex - 1, 'prev');
    }
  }

  function nextMobileQuestion() {
    if (mobileAutoAdvanceTimer) {
      clearTimeout(mobileAutoAdvanceTimer);
      mobileAutoAdvanceTimer = null;
    }

    if (mobileIsLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã chốt nộp bài thành công!', 'info');
      }
      return;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    if (mobileActiveQIndex < list.length - 1) {
      goToMobileQuestion(mobileActiveQIndex + 1, 'next');
    } else {
      const answeredCount = Object.keys(mobileTeamAnswers).length;
      if (answeredCount >= list.length) {
        confirmLockMobileTeam();
        return;
      }

      let firstUnanswered = -1;
      for (let i = 0; i < list.length; i++) {
        const qId = list[i].id;
        if (mobileTeamAnswers[qId] === undefined || mobileTeamAnswers[qId] === null) {
          firstUnanswered = i;
          break;
        }
      }
      if (firstUnanswered !== -1 && firstUnanswered !== mobileActiveQIndex) {
        goToMobileQuestion(firstUnanswered, 'next');
        if (typeof window.showToast === 'function') {
          window.showToast(`Chuyển đến Câu ${firstUnanswered + 1} chưa hoàn thành`, 'info');
        }
      } else {
        goToMobileQuestion(0, 'prev');
      }
    }
  }

  function confirmLockMobileTeam() {
    if (mobileIsLocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đội em đã nộp bài thành công!', 'info');
      } else {
        alert('Đội em đã nộp bài thành công!');
      }
      return;
    }

    const list = (mobileQuestionsList && mobileQuestionsList.length > 0) ? mobileQuestionsList : questionsList;
    const answeredCount = Object.keys(mobileTeamAnswers).length;
    const msg = `Đội em đã hoàn thành ${answeredCount}/${list.length} câu hỏi.\n\nSau khi chốt kết quả, các đáp án sẽ được khóa lại và mở khóa các ô ma trận tranh bí mật để các bạn tô lên bảng A1.\n\nĐội em có chắc chắn muốn chốt nộp bài ngay bây giờ không?`;
    if (confirm(msg)) {
      lockMobileTeam();
    }
  }

  async function lockMobileTeam() {
    mobileIsLocked = true;
    clearInterval(mobileTimerInterval);

    const elapsed = Math.max(0, (mobileTotalSeconds || 90) - (mobileRemainingSeconds || 0));
    mobileFinishTimeSeconds = elapsed;
    mobileFinishTimeFormatted = formatMinutesSeconds(elapsed);

    saveMobileAnswersToLocal();

    try {
      const res = await fetch('/api/gmm/lock-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: studentTeamKey,
          sessionId: mobileSessionId,
          answers: mobileTeamAnswers,
          finishTime: mobileFinishTimeFormatted,
          finishSeconds: mobileFinishTimeSeconds
        })
      });
      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Thầy/Cô đã bắt đầu ván mới! Hệ thống đã làm mới bài thi cho đội em.', 'info');
          }
          return;
        }
      }
    } catch (_e) {}

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');

    if (navigator.vibrate) {
      try { navigator.vibrate([150, 80, 250]); } catch (_) {}
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    // Bắn pháo hoa Confetti bung lụa rực rỡ ngay trên màn hình điện thoại
    triggerMobileConfetti();

    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 Đội em đã chốt nộp bài thành công (⏱️ ${mobileFinishTimeFormatted})! Hãy xem các ô mở khóa để tô tranh A1.`, 'success');
    }
  }

  // Hiệu ứng pháo hoa Confetti bung lụa rực rỡ trên màn hình điện thoại
  function triggerMobileConfetti() {
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.55 },
          zIndex: 2147483647,
          colors: ['#38bdf8', '#34d399', '#fde047', '#f43f5e', '#a855f7']
        });
        setTimeout(() => {
          confetti({
            particleCount: 55,
            angle: 60,
            spread: 65,
            origin: { x: 0.05, y: 0.75 },
            zIndex: 2147483647
          });
          confetti({
            particleCount: 55,
            angle: 120,
            spread: 65,
            origin: { x: 0.95, y: 0.75 },
            zIndex: 2147483647
          });
        }, 220);
      } catch (_e) {}
    }
  }

  function autoLockMobileTeam() {
    if (mobileIsLocked) return;
    mobileIsLocked = true;
    clearInterval(mobileTimerInterval);
    lockMobileTeam();
    if (typeof window.showToast === 'function') {
      window.showToast('⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài của đội em.', 'warning');
    }
  }

  function closeStudentSseOnExit() {
    if (studentSseSource) {
      try { studentSseSource.close(); } catch (_e) {}
      studentSseSource = null;
    }
  }

  function connectStudentSSE() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    try {
      if (studentSseSource) {
        try { studentSseSource.close(); } catch (_e) {}
        studentSseSource = null;
      }
      const cid = (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.getMobileClientId === 'function')
        ? window.GiaiMaLiveMonitor.getMobileClientId()
        : ('mob_' + Date.now());
      const sseUrl = `/api/sync/events?role=student&team=${encodeURIComponent(studentTeamKey || '')}&cid=${encodeURIComponent(cid)}`;
      const es = new EventSource(sseUrl);
      studentSseSource = es;
      const statusPill = document.getElementById('gmmMobStatusPill');
      const statusText = document.getElementById('gmmMobStatusText');

      es.onopen = function () {
        if (statusPill) statusPill.className = 'gmm-mob-status-pill';
        if (statusText) statusText.textContent = 'Đã kết nối máy chiếu';
        announceMobileJoinToServer(studentTeamKey, false);
        // Đồng bộ lại ngay state & remainingSeconds từ máy chủ mỗi lần SSE kết nối hoặc tự nối lại sau rớt Wi-Fi
        fetchCurrentServerState(false);
      };

      es.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            if (typeof rem === 'number') {
              syncMobileDecryptTimer(rem, data.decryptTimeTotal, Boolean(data.isDecryptTimerRunning));
            }
            if (data.state) {
              applyServerStateToMobile(data.state, false);
            }
          } else if ((data.type === 'gmm_team_joined' || data.type === 'gmm_team_left') && data.connectedTeams) {
            updateMobileLobbyTeamsStatus(data.connectedTeams);
          } else if (data.type === 'gmm_timer_start') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              resetMobileClientState(data.sessionId);
              fetchCurrentServerState(false);
            }
            startMobileTimer(data.timerSeconds, data.totalMatchSeconds);
          } else if (data.type === 'gmm_timer_tick') {
            mobileRemainingSeconds = data.timerSeconds;
            if (typeof data.totalMatchSeconds === 'number') {
              mobileTotalSeconds = data.totalMatchSeconds;
            }
            updateMobileTimerUI();
          } else if (data.type === 'gmm_timer_pause') {
            if (!data.isTimerRunning) {
              clearInterval(mobileTimerInterval);
              mobileTimerInterval = null;
            } else if (!mobileTimerInterval) {
              startMobileTimer(data.timerSeconds, mobileTotalSeconds);
            }
          } else if (data.type === 'gmm_time_up') {
            if (!data.sessionId || !mobileSessionId || String(data.sessionId) === String(mobileSessionId)) {
              autoLockMobileTeam();
            }
          } else if (data.type === 'gmm_decrypt_timer_start' || data.type === 'gmm_decrypt_timer_tick') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            const running = typeof data.isDecryptTimerRunning === 'boolean'
              ? data.isDecryptTimerRunning
              : (data.type === 'gmm_decrypt_timer_start');
            syncMobileDecryptTimer(rem, data.decryptTimeTotal, running);
            updateMobileFinishArtworkUI(gameState[studentTeamKey]);
          } else if (data.type === 'gmm_decrypt_timer_pause') {
            const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : data.decryptTimeLeft;
            syncMobileDecryptTimer(rem, data.decryptTimeTotal, Boolean(data.isDecryptTimerRunning));
            updateMobileFinishArtworkUI(gameState[studentTeamKey]);
          } else if (data.type === 'gmm_decrypt_time_up') {
            syncMobileDecryptTimer(0, data.decryptTimeTotal, false);
            updateMobileFinishArtworkUI(gameState[studentTeamKey]);
            if (navigator.vibrate) {
              try { navigator.vibrate([150, 80, 150, 80, 250]); } catch (_) {}
            }
            if (typeof window.showToast === 'function') {
              window.showToast('⏰ ĐÃ HẾT GIỜ TÔ TRANH! Hãy chụp ảnh tranh gửi lên máy chiếu.', 'info');
            }
          } else if (data.type === 'gmm_team_locked') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              return;
            }
            if (data.team === studentTeamKey) {
              mobileIsLocked = true;
              if (data.finishTime) {
                mobileFinishTimeFormatted = data.finishTime;
              }
              if (typeof data.finishSeconds === 'number') {
                mobileFinishTimeSeconds = data.finishSeconds;
              }
              saveMobileAnswersToLocal();
              renderMobileQuestionPalette();
              renderCurrentMobileQuestion('none');
              if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
                window.GiaiMaLiveMonitor.sendMobilePing(false);
              }
            }
          } else if (data.type === 'gmm_team_unlocked') {
            if (data.sessionId && mobileSessionId && String(data.sessionId) !== String(mobileSessionId)) {
              return;
            }
            if (data.team === studentTeamKey) {
              mobileIsLocked = false;
              isMobileReviewMode = false;
              mobileFinishTimeFormatted = '';
              mobileFinishTimeSeconds = 0;
              if (data.answers && typeof data.answers === 'object') {
                mobileTeamAnswers = Object.assign({}, data.answers);
              }
              const mistakesModal = document.getElementById('gmmMobMistakesModal');
              if (mistakesModal) mistakesModal.style.display = 'none';
              jumpMobileToFirstUnanswered();
              saveMobileAnswersToLocal();

              if (data.isTimerRunning && !mobileTimerInterval) {
                startMobileTimer(data.timerSeconds || mobileRemainingSeconds || 90, data.totalMatchSeconds || mobileTotalSeconds || 90);
              }

              renderMobileQuestionPalette();
              renderCurrentMobileQuestion('none');

              if (navigator.vibrate) {
                try { navigator.vibrate([90, 50, 90]); } catch (_v) {}
              }
              if (typeof window.showToast === 'function') {
                window.showToast('🔓 Thầy/Cô đã mở khóa bài thi cho đội em! Hãy tiếp tục hoàn thành các câu còn lại.', 'success');
              }
              if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.sendMobilePing === 'function') {
                window.GiaiMaLiveMonitor.sendMobilePing(false);
              }
            }
          } else if (data.type === 'gmm_artwork_finished') {
            if (data.team === studentTeamKey) {
              const localTeam = gameState[studentTeamKey];
              if (localTeam) {
                localTeam.isArtworkFinished = true;
                localTeam.artworkFinishTime = data.finishTime || '02:00';
                localTeam.speedBonus = data.speedBonus || 2;
              }
              updateMobileFinishArtworkUI({
                isArtworkFinished: true,
                artworkFinishTime: data.finishTime,
                speedBonus: data.speedBonus
              });
            }
          } else if (data.type === 'gmm_state_update' && data.state) {
            applyServerStateToMobile(data.state, false);
          } else if (data.type === 'gmm_reset') {
            const nextSession = data.sessionId || (data.state && data.state.sessionId) || null;
            const hadOldProgress = Boolean(mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0);
            resetMobileClientState(nextSession);
            announceMobileJoinToServer(studentTeamKey, true);
            if ((!data.silentToast || hadOldProgress) && typeof window.showToast === 'function') {
              window.showToast('🔄 Thầy/Cô đã đặt lại ván thi mới! Sẵn sàng làm bài từ Câu 1.', 'info');
            }
            if (data.state) {
              applyServerStateToMobile(data.state, false);
            } else {
              fetchCurrentServerState(false);
            }
          }
        } catch (_err) {}
      };

      es.onerror = function () {
        if (statusPill) statusPill.className = 'gmm-mob-status-pill offline';
        if (statusText) statusText.textContent = 'Đang đồng bộ lại Wi-Fi...';
      };
    } catch (_err) {}
  }

  // Cập nhật giao diện điện thoại theo trạng thái máy chiếu (Authoritative Server Sync)
  function applyServerStateToMobile(serverState, isBackgroundPoll = false) {
    if (!serverState) return;

    if (serverState.teamNames) {
      if (serverState.teamNames.teamA && gameState.teamA) gameState.teamA.name = serverState.teamNames.teamA;
      if (serverState.teamNames.teamB && gameState.teamB) gameState.teamB.name = serverState.teamNames.teamB;
      updateAllTeamNamesUI();
    }

    const lobbyView = document.getElementById('gmmMobLobbyView');
    const quizView = document.getElementById('gmmMobQuizView');
    const paintView = document.getElementById('gmmMobPaintView');

    const teamData = serverState[studentTeamKey] || null;
    const serverAnswers = (teamData && teamData.answers && typeof teamData.answers === 'object') ? teamData.answers : {};
    const serverAnswerCount = Object.keys(serverAnswers).length;
    const serverIsLocked = Boolean(teamData && teamData.isLocked);

    // A. PHÁT HIỆN VÁN THI MỚI QUA SESSION ID HOẶC TRẠNG THÁI MỞ KHÓA TRỐNG TỪ MÁY CHỦ
    if (serverState.sessionId) {
      if (mobileSessionId && String(mobileSessionId) !== String(serverState.sessionId)) {
        resetMobileClientState(serverState.sessionId);
      } else if (!mobileSessionId) {
        if (!serverIsLocked && serverAnswerCount === 0 && (mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0)) {
          resetMobileClientState(serverState.sessionId);
        } else {
          mobileSessionId = String(serverState.sessionId);
          saveMobileAnswersToLocal();
        }
      }
    }

    // Bảo vệ kép: Nếu máy chủ xác nhận đội CHƯA khóa bài và có 0 câu trả lời, trong khi điện thoại vẫn kẹt trạng thái đã nộp bài cũ -> Xóa sạch ngay!
    if (!serverIsLocked && serverAnswerCount === 0 && mobileIsLocked) {
      resetMobileClientState(serverState.sessionId || mobileSessionId);
    }

    // Tự động đăng ký lại sự hiện diện của đội nếu máy chủ vừa khởi động lại hoặc reset phòng chờ
    if (studentTeamKey && (!serverState.connectedTeams || !serverState.connectedTeams[studentTeamKey])) {
      announceMobileJoinToServer(studentTeamKey, false);
    }

    // Cập nhật trạng thái 2 đội trong phòng chờ
    if (serverState.connectedTeams) {
      updateMobileLobbyTeamsStatus(serverState.connectedTeams);
    }

    // 0. Nếu đang ở giai đoạn đếm ngược hiệu lệnh khai cuộc 1.. 2.. 3.. Bắt đầu!
    if (serverState.status === 'countdown') {
      lastMobileStateFingerprint = `countdown|${serverState.sessionId || ''}`;
      const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
      if (mobOverlay && mobOverlay.style.display !== 'flex') {
        runCountdownAnimation(serverState.countdownSeconds || 3);
      }
      return;
    } else {
      const mobOverlay = document.getElementById('gmmMobCountdownOverlay');
      if (mobOverlay && mobOverlay.style.display === 'flex') {
        mobOverlay.style.display = 'none';
      }
    }

    // 1. Nếu trạng thái là phòng chờ hoặc trang chủ hoặc đấu trường chưa bắt đầu
    const isLobby = (
      serverState.status === 'lobby' ||
      serverState.status === 'home' ||
      serverState.status === 'quiz_waiting' ||
      (serverState.status === 'quiz' && !serverState.isMatchStarted) ||
      (serverState.status === 'answer_key' && !serverState.isMatchStarted && !serverState.isDecryptPhase)
    );
    if (isLobby) {
      stopMobileDecryptTicker();
      if (!serverIsLocked && serverAnswerCount === 0 && (mobileIsLocked || Object.keys(mobileTeamAnswers).length > 0)) {
        resetMobileClientState(serverState.sessionId || mobileSessionId);
      }
      wasMobileInLobby = true;
      clearInterval(mobileTimerInterval);
      mobileTimerInterval = null;
      if (lobbyView) lobbyView.style.display = 'flex';
      if (quizView) quizView.style.display = 'none';
      if (paintView) paintView.style.display = 'none';

      const descEl = document.querySelector('.gmm-mob-lobby-desc');
      if (descEl) {
        if (serverState.status === 'quiz_waiting' || serverState.status === 'quiz') {
          descEl.innerHTML = `Đấu trường 10 câu hỏi đã sẵn sàng! Xin vui lòng quan sát máy chiếu, đợi Thầy/Cô bấm <strong>[🚀 BẮT ĐẦU TRÒ CHƠI]</strong> để đếm 3, 2, 1 và làm bài.`;
        } else {
          descEl.innerHTML = `Xin vui lòng đợi Ban Giám Khảo phát hiệu lệnh <strong>[🚀 BẮT ĐẦU TRÒ CHƠI]</strong> trên máy chiếu để đếm 3, 2, 1 và mở 10 câu hỏi thi đấu.`;
        }
      }
      lastMobileStateFingerprint = `lobby|${serverState.sessionId || ''}|${serverState.status}`;
      return;
    }

    // 2. Nếu ở giai đoạn Giải mã tô màu tranh (Tab 4 / Decrypt) hoặc Đối chiếu kết quả tranh Giáo viên (Tab 5 / answer_key)
    if (serverState.isDecryptPhase || serverState.status === 'decrypt' || serverState.status === 'answer_key') {
      wasMobileInLobby = false;
      clearInterval(mobileTimerInterval);
      mobileTimerInterval = null;
      if (lobbyView) lobbyView.style.display = 'none';
      if (quizView) quizView.style.display = 'none';
      if (paintView) paintView.style.display = 'flex';

      // Đồng bộ thời gian đếm ngược tô màu tranh từ máy chủ (kể cả khi vừa kết nối lại sau rớt mạng)
      const remDecrypt = typeof serverState.remainingSeconds === 'number'
        ? serverState.remainingSeconds
        : serverState.decryptTimeLeft;
      syncMobileDecryptTimer(
        remDecrypt,
        serverState.decryptTimeTotal,
        typeof serverState.isDecryptTimerRunning === 'boolean' ? serverState.isDecryptTimerRunning : undefined
      );

      if (teamData && gameState[studentTeamKey]) {
        gameState[studentTeamKey].isArtworkFinished = Boolean(teamData.isArtworkFinished);
        gameState[studentTeamKey].artworkFinishTime = teamData.artworkFinishTime || null;
        gameState[studentTeamKey].speedBonus = teamData.speedBonus || 0;
      }
      updateMobileFinishArtworkUI(teamData);

      const paintFingerprint = `decrypt|${serverState.sessionId || ''}|${JSON.stringify(teamData?.coloredRegions || {})}|${JSON.stringify(teamData?.unlockedRegions || [])}`;
      if (!isBackgroundPoll || paintFingerprint !== lastMobileStateFingerprint) {
        lastMobileStateFingerprint = paintFingerprint;
        renderMobilePaintView(serverState);
      }
      return;
    }

    // 3. Nếu đang ở giai đoạn làm bài thi đấu (Tab 3 / Quiz)
    stopMobileDecryptTicker();
    if (lobbyView) lobbyView.style.display = 'none';
    if (quizView) quizView.style.display = 'flex';
    if (paintView) paintView.style.display = 'none';

    if (wasMobileInLobby) {
      wasMobileInLobby = false;
      if (navigator.vibrate) {
        try { navigator.vibrate([100, 60, 100]); } catch (_) {}
      }
    }

    if (serverState.questions && serverState.questions.length > 0) {
      mobileQuestionsList = serverState.questions;
    } else if (mobileQuestionsList.length === 0) {
      mobileQuestionsList = [...DEFAULT_QUESTIONS];
    }

    if (teamData) {
      const wasLockedBefore = mobileIsLocked;
      const syncedAnswers = Object.assign({}, serverAnswers);
      // Chỉ giữ các câu đang chờ gửi bù offline thuộc CÙNG phiên chơi hiện tại
      if (mobilePendingSyncQueue.length > 0) {
        mobilePendingSyncQueue.forEach(item => {
          if (!mobileSessionId || !item.sessionId || String(item.sessionId) === String(mobileSessionId)) {
            syncedAnswers[item.questionId] = item.optionIdx;
          }
        });
      }
      mobileTeamAnswers = syncedAnswers;
      mobileIsLocked = serverIsLocked;

      if (!mobileIsLocked) {
        isMobileReviewMode = false;
        mobileFinishTimeFormatted = '';
        mobileFinishTimeSeconds = 0;
        if (wasLockedBefore) {
          const mistakesModal = document.getElementById('gmmMobMistakesModal');
          if (mistakesModal) mistakesModal.style.display = 'none';
          jumpMobileToFirstUnanswered();
          if (typeof window.showToast === 'function') {
            window.showToast('🔓 Thầy/Cô đã mở khóa bài thi cho đội em! Hãy tiếp tục làm bài.', 'success');
          }
        }
      } else {
        if (teamData.finishTime) {
          mobileFinishTimeFormatted = teamData.finishTime;
        }
        if (typeof teamData.finishSeconds === 'number') {
          mobileFinishTimeSeconds = teamData.finishSeconds;
        }
      }
      saveMobileAnswersToLocal();
    }

    // Đồng bộ đồng hồ mượt mà
    if (serverState.isTimerRunning) {
      if (!mobileTimerInterval) {
        startMobileTimer(serverState.timerSeconds || 120, serverState.totalMatchSeconds || 120);
      } else if (typeof serverState.timerSeconds === 'number' && Math.abs(mobileRemainingSeconds - serverState.timerSeconds) >= 2) {
        mobileRemainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileTotalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    } else {
      if (mobileTimerInterval) {
        clearInterval(mobileTimerInterval);
        mobileTimerInterval = null;
      }
      if (typeof serverState.timerSeconds === 'number') {
        mobileRemainingSeconds = serverState.timerSeconds;
        if (typeof serverState.totalMatchSeconds === 'number') {
          mobileTotalSeconds = serverState.totalMatchSeconds;
        }
        updateMobileTimerUI();
      }
    }

    const quizFingerprint = [
      'quiz',
      serverState.sessionId || '',
      mobileIsLocked ? '1' : '0',
      JSON.stringify(mobileTeamAnswers),
      mobileQuestionsList.length,
      mobileActiveQIndex
    ].join('|');

    if (isBackgroundPoll && quizFingerprint === lastMobileStateFingerprint) {
      return;
    }
    lastMobileStateFingerprint = quizFingerprint;

    renderMobileQuestionPalette();
    renderCurrentMobileQuestion('none');
  }

  // Học sinh bấm gửi câu trả lời lên Server (hỗ trợ lưu LocalStorage & hàng đợi Offline)
  async function submitAnswerFromMobile(questionId, optionIdx) {
    saveMobileAnswersToLocal();

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (_e) {}
    }

    try {
      const res = await fetch('/api/gmm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: studentTeamKey,
          sessionId: mobileSessionId,
          questionId: questionId,
          optionIndex: optionIdx,
          currentQ: (typeof mobileActiveQIndex === 'number' ? mobileActiveQIndex : 0) + 1
        })
      });

      if (res && res.ok) {
        if (mobilePendingSyncQueue.length > 0) {
          flushPendingSyncQueue();
        } else {
          updateSyncStatusBadge();
        }
        return;
      }

      if (res && res.status === 409) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.staleSession) {
          resetMobileClientState(errJson.currentSessionId);
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          if (typeof window.showToast === 'function') {
            window.showToast('🔄 Ván chơi vừa được Thầy/Cô đặt lại! Mời đội em làm lại từ Câu 1.', 'info');
          }
          return;
        }
        if (errJson && errJson.teamLocked) {
          if (errJson.state) applyServerStateToMobile(errJson.state, false);
          return;
        }
      }

      throw new Error('Mã phản hồi từ máy chủ không hợp lệ');
    } catch (_err) {
      console.warn('Lỗi kết nối Wi-Fi khi nộp câu trả lời, lưu vào hàng đợi offline:', _err);
      addToPendingSyncQueue(questionId, optionIdx);
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Mạng Wi-Fi chập chờn - Đáp án đã được lưu an toàn trên máy!', 'warning');
      }
    }
  }

  let mobileCurrentColor = '#ef4444';
  function setMobileColor(c, el) {
    mobileCurrentColor = c;
    document.querySelectorAll('#gmmMobPaletteBar .gmm-color-swatch').forEach(sw => sw.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // Học sinh tô màu tranh từ điện thoại gửi lên Server
  async function submitPaintFromMobile(regionId) {
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (_e) {}
    }
    try {
      await fetch('/api/gmm/paint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: studentTeamKey,
          regionId: regionId,
          color: mobileCurrentColor
        })
      });
    } catch (_err) {}
  }

  // Render tranh SVG trên điện thoại học sinh khi bước vào giai đoạn giải mã
  function renderMobilePaintView() {
    updateMobileDecryptTimerUI();
    const wrap = document.getElementById('gmmMobSvgWrap');
    const palette = document.getElementById('gmmMobPaletteBar');
    if (!wrap || !palette) return;

    wrap.innerHTML = generateSvgPuzzle(studentTeamKey);

    const colors = studentTeamKey === 'teamA' 
      ? ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    palette.innerHTML = `
      <span style="font-size: 0.8rem; color: #cbd5e1; font-weight: 700;">Màu tô:</span>
      ${colors.map((c, i) => `
        <div class="gmm-color-swatch ${i === 0 ? 'active' : ''}" style="background: ${c};" onclick="window.GiaiMaBiMat.setMobileColor('${c}', this)"></div>
      `).join('')}
    `;
  }

  // Ban Giám Khảo phát hiệu lệnh bắt đầu thi đấu từ Phòng Chờ Tab 2
  function startGameFromLobby() {
    if (gameState.isCountdownRunning) return;

    const isResumePausedMatch = Boolean(
      gameState.isMatchStarted &&
      !(gameState.teamA?.isLocked && gameState.teamB?.isLocked)
    );
    if (!isResumePausedMatch) {
      prepareFreshMatchSession();
    }

    gameState.isCountdownRunning = true;

    // Phát sóng trạng thái đếm ngược để cả 2 điện thoại cùng kích hoạt 3..2..1.. Chiến!
    broadcastCountdownState(3, { resetForNewMatch: !isResumePausedMatch });

    // Kích hoạt hiệu ứng đếm ngược trực quan 3..2..1.. CHIẾN! trên máy chiếu
    runCountdownAnimation(3, () => {
      gameState.isCountdownRunning = false;
      if (typeof window.showToast === 'function') {
        window.showToast('🚀 ĐÃ PHÁT HIỆU LỆNH! Trò chơi chính thức bắt đầu!', 'success');
      }
      // Chuyển sang Tab 3 (Đấu trường 10 câu hỏi), khởi chạy đồng hồ và phát sóng SSE
      switchTab('quiz', true, true);
      startDualMatch({ forceTeamOverwrite: !isResumePausedMatch });
    });
  }

  // Ban Giám Khảo tạm thu hồi 2 đội về lại Phòng Chờ để xử lý sự cố thiết bị/mạng
  function recallToLobby() {
    if (!confirm('Thầy/Cô có muốn tạm thu hồi 2 đội về Phòng Chờ không?\n\n(Dữ liệu điểm số, câu trả lời đã làm và kết nối của 2 đội vẫn được giữ nguyên an toàn)')) {
      return;
    }

    // Dừng toàn bộ đồng hồ câu hỏi
    clearInterval(gameState.timerInterval);
    gameState.isTimerRunning = false;
    fetch('/api/gmm/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    }).catch(() => {});

    // Chuyển màn hình máy tính về Tab 2 (Phòng chờ)
    switchTab('lobby');

    // Cập nhật nhãn nút bắt đầu thành "TIẾP TỤC TRÒ CHƠI"
    const btnStart = document.getElementById('gmmBtnStartGame');
    if (btnStart) {
      btnStart.innerHTML = `<span>🚀 TIẾP TỤC TRÒ CHƠI (CÂU ${gameState.currentQIndex + 1})</span>`;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`↩️ Đã thu hồi về phòng chờ thành công! Dữ liệu câu ${gameState.currentQIndex + 1} được bảo lưu an toàn.`, 'info');
    }

    // Phát sóng trạng thái 'lobby' xuống điện thoại của 2 đội
    broadcastHostStateToServer();
  }

  // 10. CHUYỂN TAB VÀ MODAL BAN GIÁM KHẢO
  function switchTab(tabId, force = false, skipBroadcast = false) {
    // Cảnh báo an toàn khi click chuyển tab trong lúc trận đấu 10 câu hỏi đang đếm ngược
    if (!force && gameState.activeTab === 'quiz' && tabId !== 'quiz') {
      const isMatchRunning = gameState.isMatchStarted && gameState.isTimerRunning && (gameState.timerSeconds || 0) > 0;
      if (isMatchRunning) {
        const confirmLeave = confirm(
          '⚠️ CẢNH BÁO AN TOÀN TRẬN ĐẤU!\n\n' +
          'Trận đấu 10 câu hỏi đang diễn ra và đồng hồ vẫn đang đếm ngược trên máy chiếu.\n' +
          'Nếu chuyển sang Tab khác, màn hình máy chiếu sẽ đổi giao diện trong khi học sinh vẫn đang làm bài trên điện thoại.\n\n' +
          'Thầy/Cô có chắc chắn muốn rời khỏi Đấu Trường không?'
        );
        if (!confirmLeave) return;
      }
    }

    // Nếu đang ở Chế độ Sân Khấu Máy Chiếu mà rời tab quiz, tự động hoàn trả giao diện chuẩn
    if (gameState.isStageMode && tabId !== 'quiz') {
      exitProjectorStageMode();
    }

    gameState.activeTab = tabId;

    document.querySelectorAll('.gmm-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.gmm-tab-panel').forEach(p => {
      p.classList.remove('active');
    });

    const activePanel = document.getElementById(`gmmPanel_${tabId}`);
    if (activePanel) activePanel.classList.add('active');

    if (tabId === 'lobby') renderQrCodes();
    if (tabId === 'quiz') renderDualArena();
    if (tabId === 'decrypt') {
      renderDecryptUI();
      updateDecryptTimerUI();
      pollServerArtworksOnce();
    }
    if (tabId === 'answer_key') {
      pollServerArtworksOnce();
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
        window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
      }
    } else {
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.pauseThemeSong === 'function') {
        window.GiaiMaTeacherKey.pauseThemeSong(true);
      }
    }
    if (tabId === 'result') renderResultUI();

    if (!skipBroadcast) {
      broadcastHostStateToServer();
    }
  }

  // ==============================================================================
  // CHẾ ĐỘ 1 CHẠM: SÂN KHẤU MÁY CHIẾU (PROJECTOR STAGE VIEW)
  // Ẩn toàn bộ nút bấm kỹ thuật của giáo viên, phóng to tối đa ma trận & câu hỏi
  // ==============================================================================
  function toggleProjectorStageMode() {
    if (gameState.isStageMode) {
      exitProjectorStageMode();
    } else {
      enterProjectorStageMode();
    }
  }

  function enterProjectorStageMode() {
    gameState.isStageMode = true;
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.add('gmm-stage-mode-active');
    }
    document.body.classList.add('gmm-stage-active');

    const btnStage = document.getElementById('gmmBtnStageMode');
    if (btnStage) {
      btnStage.classList.add('active');
      btnStage.innerHTML = '<span>🖥️ Thoát Sân Khấu</span>';
    }

    const floatBar = document.getElementById('gmmStageFloatingBar');
    if (floatBar) {
      floatBar.style.display = 'flex';
    }
    const floatStartBtn = document.getElementById('gmmStageFloatStartBtn');
    const floatPauseBtn = document.getElementById('gmmStageFloatPauseBtn');
    if (floatStartBtn && floatPauseBtn) {
      if (!gameState.isMatchStarted) {
        floatStartBtn.style.display = 'inline-flex';
        floatPauseBtn.style.display = 'none';
      } else {
        floatStartBtn.style.display = 'none';
        floatPauseBtn.style.display = 'inline-flex';
      }
    }
    updateStageFloatPauseBtn();

    // Tự động kích hoạt toàn màn hình nếu trình duyệt chưa ở chế độ Fullscreen
    if (!document.fullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }
    }

    if (typeof window.showToast === 'function') {
      window.showToast('📽️ Đã kích hoạt Chế Độ Sân Khấu Máy Chiếu! Toàn bộ nút kỹ thuật đã được ẩn gọn gàng (Phím P hoặc ESC để thoát).', 'info');
    }
  }

  function exitProjectorStageMode() {
    gameState.isStageMode = false;
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.remove('gmm-stage-mode-active');
    }
    document.body.classList.remove('gmm-stage-active');

    const btnStage = document.getElementById('gmmBtnStageMode');
    if (btnStage) {
      btnStage.classList.remove('active');
      btnStage.innerHTML = '<span>📽️ Sân Khấu Máy Chiếu</span>';
    }

    const floatBar = document.getElementById('gmmStageFloatingBar');
    if (floatBar) {
      floatBar.style.display = 'none';
    }

    if (typeof window.showToast === 'function') {
      window.showToast('🖥️ Đã quay lại Bảng Điều Khiển Giáo Viên đầy đủ.', 'info');
    }
  }

  function updateStageFloatPauseBtn() {
    const pauseTxt = document.getElementById('gmmStageFloatPauseTxt');
    if (pauseTxt) {
      pauseTxt.textContent = gameState.isTimerRunning ? '⏸️ Tạm Dừng' : '▶️ Tiếp Tục';
    }
  }

  // Quản lý Ô Cài Đặt & Điều Hướng Nhanh (Settings Popover)
  function toggleSettingsMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const box = document.getElementById('gmmSettingsBox');
    if (!box) return;
    if (box.style.display !== 'none') {
      closeSettingsMenu();
    } else {
      openSettingsMenu();
    }
  }

  function openSettingsMenu() {
    const box = document.getElementById('gmmSettingsBox');
    const btn = document.getElementById('gmmBtnSettings');
    if (box) {
      box.style.display = 'block';
    }
    if (btn) {
      btn.classList.add('active');
    }
  }

  function closeSettingsMenu() {
    const box = document.getElementById('gmmSettingsBox');
    const btn = document.getElementById('gmmBtnSettings');
    if (box) {
      box.style.display = 'none';
    }
    if (btn) {
      btn.classList.remove('active');
    }
  }

  // Tự động đóng Ô Cài Đặt khi click chuột ra ngoài
  document.addEventListener('click', (e) => {
    const box = document.getElementById('gmmSettingsBox');
    const wrapper = document.getElementById('gmmSettingsWrapper');
    if (box && box.style.display !== 'none') {
      if (wrapper && !wrapper.contains(e.target)) {
        closeSettingsMenu();
      }
    }
  });

  // ==============================================================================
  // QUẢN LÝ Ô CÀI ĐẶT TAB 4 (TÔ MÀU & GIẢI MÃ BỨC TRANH BÍ MẬT)
  // ==============================================================================
  function toggleSettingsMenuTab4(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const box = document.getElementById('gmmSettingsBoxTab4');
    if (!box) return;
    if (box.style.display !== 'none') {
      closeSettingsMenuTab4();
    } else {
      openSettingsMenuTab4();
    }
  }

  function openSettingsMenuTab4() {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const btn = document.getElementById('gmmBtnSettingsTab4');
    if (box) box.style.display = 'block';
    if (btn) btn.classList.add('active');
  }

  function closeSettingsMenuTab4() {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const btn = document.getElementById('gmmBtnSettingsTab4');
    if (box) box.style.display = 'none';
    if (btn) btn.classList.remove('active');
  }

  // Tự động đóng Ô Cài Đặt Tab 4 khi click chuột ra ngoài
  document.addEventListener('click', (e) => {
    const box = document.getElementById('gmmSettingsBoxTab4');
    const wrapper = document.getElementById('gmmSettingsWrapperTab4');
    if (box && box.style.display !== 'none') {
      if (wrapper && !wrapper.contains(e.target)) {
        closeSettingsMenuTab4();
      }
    }
  });

  // ==============================================================================
  // BỘ LỌC CANVAS AI FILTER & CÂN CHỈNH GÓC NGHIÊNG THÔNG MINH
  // ==============================================================================
  /**
   * TỰ ĐỘNG CÂN BẰNG SÁNG, ĐỘ TƯƠNG PHẢN & LÀM RỰC RỠ MÀU BÚT DẠ TRANH GIẤY A1
   * @param {HTMLCanvasElement} canvas
   */
  function applyCanvasAiEnhance(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const totalPixels = w * h;

      // 1. Phân tích mẫu nhanh histogram độ sáng & cân bằng màu (< 20ms)
      const sampleStep = Math.max(1, Math.floor(totalPixels / 25000));
      let sumLuminance = 0;
      let sampleCount = 0;
      let sumR = 0, sumB = 0;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLuminance += lum;
        sampleCount++;
        sumR += r;
        sumB += b;
      }

      const avgLum = sampleCount > 0 ? (sumLuminance / sampleCount) : 128;
      const avgR = sampleCount > 0 ? (sumR / sampleCount) : 128;
      const avgB = sampleCount > 0 ? (sumB / sampleCount) : 128;

      // 2. Tính hệ số tối ưu cho máy chiếu phòng học
      // Nếu phòng học thiếu sáng hoặc chụp bóng râm, tự động bù sáng thích ứng
      let brightFactor = 1.0;
      if (avgLum < 145) {
        brightFactor = Math.min(1.35, Math.max(1.08, 155 / Math.max(70, avgLum)));
      }

      // Khử ám vàng của đèn huỳnh quang cũ trên nền giấy A1
      let blueGain = 1.0;
      let redGain = 1.0;
      if (avgR > avgB * 1.15) {
        blueGain = Math.min(1.22, 1 + (avgR - avgB) / 255);
        redGain = Math.max(0.92, 1 - (avgR - avgB) / 510);
      }

      // Tăng tương phản giúp các ô toạ độ và nét vẽ màu tách bạch
      const contrast = 1.18;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i] * redGain;
        let g = data[i + 1];
        let b = data[i + 2] * blueGain;

        // Bù sáng
        r = Math.min(255, r * brightFactor);
        g = Math.min(255, g * brightFactor);
        b = Math.min(255, b * brightFactor);

        // Kéo dãn dải tương phản (Contrast Stretch)
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        // Tăng độ bão hòa (Saturation Boost) cho các mảng màu bút dạ
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;
        if (chroma > 25) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const satBoost = 1.25; // +25% độ rực rỡ màu
          r = lum + (r - lum) * satBoost;
          g = lum + (g - lum) * satBoost;
          b = lum + (b - lum) * satBoost;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    } catch (err) {
      console.warn('Canvas AI Enhance error:', err);
      return canvas;
    }
  }

  /**
   * Tạo Canvas đã được xoay góc (rotation) và bù nghiêng (tilt)
   */
  function renderTransformedCanvas(img, maxDimension = 1400, rotationDeg = 0, tiltDeg = 0) {
    const totalAngle = ((rotationDeg + tiltDeg) % 360) * Math.PI / 180;
    const sin = Math.abs(Math.sin(totalAngle));
    const cos = Math.abs(Math.cos(totalAngle));

    let origW = img.width;
    let origH = img.height;

    if (origW > maxDimension || origH > maxDimension) {
      if (origW > origH) {
        origH = Math.round((origH * maxDimension) / origW);
        origW = maxDimension;
      } else {
        origW = Math.round((origW * maxDimension) / origH);
        origH = maxDimension;
      }
    }

    const newW = Math.round(origW * cos + origH * sin);
    const newH = Math.round(origW * sin + origH * cos);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');

    // Nền trắng cho phần viền khi xoay nghiêng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);

    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(totalAngle);
    ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
    ctx.restore();

    return canvas;
  }

  function compressImageClient(file, maxDimension = 1300, quality = 0.84, applyAi = true, rotation = 0, tilt = 0) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = renderTransformedCanvas(img, maxDimension, rotation, tilt);
            if (applyAi) {
              applyCanvasAiEnhance(canvas);
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function triggerMobileCamera() {
    const input = document.getElementById('gmmMobCameraInput');
    if (input) input.click();
  }

  function triggerMobileGallery() {
    const input = document.getElementById('gmmMobGalleryInput');
    if (input) input.click();
  }

  async function handleMobilePhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Đặt lại giá trị input ngay lập tức để chọn lại cùng 1 ảnh trong Bộ sưu tập vẫn kích hoạt onchange
    e.target.value = '';

    const currentTeam = studentTeamKey || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');

    // Mở ngay Studio Quét Tài Liệu 4 Góc Hình Thang (Perspective Warp) + AI Làm Sáng Toàn Màn Hình
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openScannerWithFile === 'function') {
      if (typeof window.showToast === 'function') {
        window.showToast('📐 Đang nhận diện 4 góc giấy A1 & làm sáng màu...', 'info');
      }
      window.GiaiMaArtworkScanner.openScannerWithFile(file, 'mobile', currentTeam);
      return;
    }

    // Dự phòng nếu module Scanner chưa kịp tải
    try {
      const enhancedData = await compressImageClient(file, 1300, 0.85, true);
      mobileEnhancedPhotoData = enhancedData;
      mobileOriginalPhotoData = enhancedData;
      mobileCapturedPhotoData = enhancedData;
      await submitCapturedArtworkPhoto();
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể nạp ảnh, vui lòng thử lại!', 'error');
      }
    }
  }

  function toggleMobileAiEnhance() {
    isMobileAiEnhanced = !isMobileAiEnhanced;
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    const aiBtn = document.getElementById('gmmMobBtnToggleAi');
    const aiBadge = document.getElementById('gmmMobAiBadge');

    if (isMobileAiEnhanced) {
      mobileCapturedPhotoData = mobileEnhancedPhotoData;
      if (previewImg && mobileEnhancedPhotoData) {
        previewImg.src = mobileEnhancedPhotoData;
        previewImg.classList.add('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.add('active');
      if (aiBadge) {
        aiBadge.style.display = 'block';
        aiBadge.textContent = '✨ AI Đã Căn Sáng & Tươi Màu';
      }
      if (typeof window.showToast === 'function') {
        window.showToast('✨ Đã bật Bộ lọc AI làm sáng tranh!', 'info');
      }
    } else {
      mobileCapturedPhotoData = mobileOriginalPhotoData;
      if (previewImg && mobileOriginalPhotoData) {
        previewImg.src = mobileOriginalPhotoData;
        previewImg.classList.remove('gmm-ai-enhanced-img');
      }
      if (aiBtn) aiBtn.classList.remove('active');
      if (aiBadge) aiBadge.style.display = 'none';
      if (typeof window.showToast === 'function') {
        window.showToast('📸 Đã chuyển về ảnh gốc chưa lọc!', 'info');
      }
    }
  }

  function rotateMobilePreview(deltaAngle = 90) {
    mobilePhotoRotation = (mobilePhotoRotation + deltaAngle) % 360;
    updateMobilePreviewTransform();
  }

  function stepMobileTilt(delta = 1) {
    mobilePhotoTilt = Math.max(-15, Math.min(15, mobilePhotoTilt + delta));
    updateMobilePreviewTransform();
  }

  function updateMobilePreviewTransform() {
    const previewImg = document.getElementById('gmmMobPhotoPreviewImg');
    if (previewImg) {
      previewImg.style.transform = `rotate(${mobilePhotoRotation + mobilePhotoTilt}deg)`;
    }
  }

  async function submitCapturedArtworkPhoto() {
    if (!mobileCapturedPhotoData) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Vui lòng chụp ảnh tranh giấy trước khi tải lên!', 'warning');
      }
      return;
    }

    const currentTeam = studentTeamKey || (gameState.roleFocus === 'teamB' ? 'teamB' : 'teamA');
    const teamName = currentTeam === 'teamA' ? 'Đội 1' : 'Đội 2';
    const btnSend = document.getElementById('gmmMobBtnSendPhoto');
    const origHtml = btnSend ? btnSend.innerHTML : '';

    if (btnSend) {
      btnSend.disabled = true;
      btnSend.innerHTML = '<span>⏳ Đang gửi lên máy chiếu...</span>';
    }

    try {
      let finalPhotoData = mobileCapturedPhotoData;

      // Nếu học sinh có chỉnh góc xoay hoặc nghiêng trên điện thoại, render lại canvas ở góc đó
      if (mobilePhotoRotation !== 0 || mobilePhotoTilt !== 0) {
        finalPhotoData = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const c = renderTransformedCanvas(img, 1300, mobilePhotoRotation, mobilePhotoTilt);
            resolve(c.toDataURL('image/jpeg', 0.85));
          };
          img.src = mobileCapturedPhotoData;
        });
      }

      const resp = await fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: currentTeam,
          photoData: finalPhotoData,
          timestamp: Date.now()
        })
      });

      const res = await resp.json();
      if (res && res.success) {
        const previewWrap = document.getElementById('gmmMobPhotoPreviewWrap');
        const successBox = document.getElementById('gmmMobPhotoUploadSuccess');
        if (previewWrap) previewWrap.style.display = 'none';
        if (successBox) successBox.style.display = 'block';

        if (window.audioManager && typeof window.audioManager.playChime === 'function') {
          window.audioManager.playChime();
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Tranh thật của ${teamName} đã được gắn lên màn hình máy chiếu!`, 'success');
        }
      } else {
        throw new Error(res?.error || 'Lỗi tải ảnh');
      }
    } catch (err) {
      if (typeof window.showToast === 'function') {
        window.showToast(`❌ Không thể gửi ảnh lên máy chiếu: ${err.message}`, 'error');
      }
    } finally {
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.innerHTML = origHtml;
      }
    }
  }

  // ==============================================================================
  // QUẢN LÝ GÓC NHÌN, CANVAS AI & TÁC PHẨM TRANH CHỤP TRÊN MÁY CHIẾU (HOST)
  // ==============================================================================
  function setArtworkViewMode(teamKey, mode) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoViewMode = mode;

    const btnSvg = document.getElementById(`${teamKey}_btnViewSvg`);
    const btnPhoto = document.getElementById(`${teamKey}_btnViewPhoto`);
    const wrapSvg = document.getElementById(`${teamKey}_svgWrap`);
    const wrapPhoto = document.getElementById(`${teamKey}_photoWrap`);

    if (btnSvg) btnSvg.classList.toggle('active', mode === 'svg');
    if (btnPhoto) btnPhoto.classList.toggle('active', mode === 'photo');

    if (wrapSvg) wrapSvg.style.display = mode === 'svg' ? 'block' : 'none';
    if (wrapPhoto) wrapPhoto.style.display = mode === 'photo' ? 'flex' : 'none';
  }

  function getTeamArtworkPhoto(teamKey) {
    const normKey = teamKey === 'A' ? 'teamA' : (teamKey === 'B' ? 'teamB' : teamKey);
    return gameState[normKey]?.artworkPhoto || null;
  }

  function getTeamPhotoMeta(teamKey) {
    const normKey = teamKey === 'A' ? 'teamA' : (teamKey === 'B' ? 'teamB' : teamKey);
    const t = gameState[normKey] || {};
    return {
      photo: t.artworkPhoto || null,
      rotation: t.photoRotation || 0,
      tilt: t.photoTilt || 0,
      isAi: t.isAiEnhanced !== false,
      timestamp: t.photoTimestamp || 0
    };
  }

  function toggleAutoFullscreenOnUpload() {
    gameState.autoFullscreenArtwork = !gameState.autoFullscreenArtwork;
    const btn = document.getElementById('gmmBtnAutoFullscreen');
    if (btn) {
      btn.classList.toggle('active', gameState.autoFullscreenArtwork);
      btn.textContent = gameState.autoFullscreenArtwork
        ? '🖥️ Tự Phóng Full: BẬT'
        : '🖥️ Tự Phóng Full: TẮT';
      btn.style.borderColor = gameState.autoFullscreenArtwork ? '#38bdf8' : 'rgba(255,255,255,0.2)';
      btn.style.background = gameState.autoFullscreenArtwork ? 'rgba(2, 132, 199, 0.28)' : 'rgba(30, 41, 59, 0.7)';
      btn.style.color = gameState.autoFullscreenArtwork ? '#e0f2fe' : '#94a3b8';
    }
    if (typeof window.showToast === 'function') {
      window.showToast(
        gameState.autoFullscreenArtwork
          ? '🖥️ Đã BẬT tự động phóng to Full màn hình ngay khi học sinh gửi ảnh tranh!'
          : '🔲 Đã TẮT tự động phóng to (vẫn bấm vào ảnh để phóng Full màn hình bất kỳ lúc nào).',
        'info'
      );
    }
  }

  function playSmartKeystoningFx(teamKey, teamName) {
    const overlay = document.getElementById(`${teamKey}_scanFxOverlay`);
    const statusText = document.getElementById(`${teamKey}_scanFxText`);
    if (!overlay) return;

    const displayName = teamName || (gameState.teamNames && gameState.teamNames[teamKey]) || (teamKey === 'teamA' ? 'Đội 1' : 'Đội 2');
    if (statusText) {
      statusText.innerHTML = `📐 <span style="color:#fde047;">AI ĐANG TỰ ĐỘNG NẮN PHẲNG 4 GÓC & TĂNG SÁNG:</span> <strong>${displayName}</strong>...`;
    }

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';

    // Sau 1.4s: Báo hiệu đã nắn phẳng 4 góc và cân bằng sáng thành công
    setTimeout(() => {
      if (statusText) {
        statusText.innerHTML = `✨ <span style="color:#4ade80;">HOÀN TẤT!</span> ĐÃ TỰ ĐỘNG NẮN PHẲNG 4 GÓC CHO <strong>${displayName}</strong>!`;
      }
    }, 1400);

    // Sau 2.8s: Mờ dần lớp overlay và giải phóng
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 450);
    }, 2800);
  }

  function attachTeamArtworkPhoto(rawTeamKey, photoData, timestamp) {
    const teamKey = rawTeamKey === 'A' ? 'teamA' : (rawTeamKey === 'B' ? 'teamB' : rawTeamKey);
    if (!gameState[teamKey] || !photoData) return;

    // Chống gắn trùng 2 lần khi cả SSE và Polling cùng nhận 1 bức ảnh (cùng timestamp)
    if (timestamp && gameState[teamKey].photoTimestamp === timestamp && gameState[teamKey].artworkPhoto) {
      return;
    }

    gameState[teamKey].artworkPhoto = photoData;
    gameState[teamKey].photoTimestamp = timestamp || Date.now();
    gameState[teamKey].photoRotation = 0;
    gameState[teamKey].photoTilt = 0;
    gameState[teamKey].isAiEnhanced = true;

    // Lấy tên đội tùy chỉnh từ cấu hình (ví dụ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
    const teamName = (gameState.teamNames && gameState.teamNames[teamKey])
      ? gameState.teamNames[teamKey]
      : (teamKey === 'teamA' ? 'Đội 1' : 'Đội 2');

    const img = document.getElementById(`${teamKey}_photoImg`);
    const emptyState = document.getElementById(`${teamKey}_photoEmpty`);
    const contentState = document.getElementById(`${teamKey}_photoContent`);
    const dot = document.getElementById(`${teamKey}_photoDot`);
    const btnAi = document.getElementById(`${teamKey}_btnAiFilter`);
    const badge = document.getElementById(`${teamKey}_photoTagBadge`);

    if (img) {
      img.src = photoData;
      img.style.transform = 'rotate(0deg)';
      img.classList.add('gmm-ai-enhanced-img');
    }
    if (btnAi) btnAi.classList.add('active');
    if (badge) {
      badge.textContent = `✨ Ảnh ${teamName} (AI Scan 4 Góc)`;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (contentState) contentState.style.display = 'flex';
    if (dot) dot.style.display = 'inline-block';

    // 1. Tự động chuyển máy chiếu sang Tab 4 (Tô Màu Giải Mã Tranh) nếu đang ở tab khác
    if (!isStudentMobileClient) {
      if (typeof switchTab === 'function' && gameState.activeTab !== 'puzzle') {
        switchTab('puzzle');
      }
      // Tự động đóng popup đếm ngược toàn màn hình nếu đang mở che màn hình
      if (typeof closeDecryptTimerFullscreen === 'function') {
        closeDecryptTimerFullscreen();
      }
    }

    // 2. Tự động chuyển góc nhìn sang ẢNH CHỤP THẬT để Thầy Cô & Cả lớp thấy ngay
    setArtworkViewMode(teamKey, 'photo');

    // 3. Mở hiệu ứng nắn 4 góc thông minh tự động (Smart AI Keystoning FX)
    playSmartKeystoningFx(teamKey, teamName);

    if (gameState.activeTab === 'answer_key' && window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`📸 ${teamName} vừa gửi tranh giấy A1! Hệ thống đã tự động nắn phẳng 4 góc & làm sáng rực rỡ!`, 'success');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          zIndex: 2147483647,
          origin: { x: teamKey === 'teamA' ? 0.3 : 0.7, y: 0.5 }
        });
      } catch (_e) {}
    }

    // Tự động phóng to Full màn hình (98vw × 96vh) trên máy Thầy/Cô để khắc phục ảnh điện thoại hiển thị nhỏ
    if (!isStudentMobileClient && window.GiaiMaArtworkScanner) {
      const hostModal = document.getElementById('giaiMaBiMatModal');
      const isHostOpen = hostModal && (hostModal.classList.contains('active') || hostModal.classList.contains('open'));
      if (isHostOpen && gameState.autoFullscreenArtwork !== false) {
        // Cho hiệu ứng nắn 4 góc trên khung tranh chạy 0.8s trước khi mở Full màn hình
        setTimeout(() => {
          if (typeof window.GiaiMaArtworkScanner.openTeamFullscreen === 'function') {
            window.GiaiMaArtworkScanner.openTeamFullscreen(teamKey);
          }
        }, 800);
      } else if (typeof window.GiaiMaArtworkScanner.isFullscreenOpen === 'function' && window.GiaiMaArtworkScanner.isFullscreenOpen()) {
        window.GiaiMaArtworkScanner.renderTeamFullscreenView();
      }
    }
  }

  function toggleAiArtworkFilter(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].isAiEnhanced = !gameState[teamKey].isAiEnhanced;
    updateArtworkTransformUI(teamKey);

    const isEnabled = gameState[teamKey].isAiEnhanced;
    const btn = document.getElementById(`${teamKey}_btnAiFilter`);
    if (btn) btn.classList.toggle('active', isEnabled);

    const badge = document.getElementById(`${teamKey}_photoTagBadge`);
    if (badge) {
      const teamName = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';
      badge.textContent = isEnabled ? `✨ Ảnh ${teamName} (AI Căn Sáng)` : `📸 Ảnh ${teamName} (Gốc)`;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(isEnabled
        ? `✨ Đã bật Bộ lọc Canvas AI: Tăng sáng & rực rỡ màu bút dạ!`
        : `📸 Đã chuyển về ảnh gốc chưa qua bộ lọc AI!`, 'info');
    }
  }

  function toggleTiltControl(teamKey) {
    const panel = document.getElementById(`${teamKey}_tiltPanel`);
    const btn = document.getElementById(`${teamKey}_btnTilt`);
    if (!panel) return;
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'flex';
    if (btn) btn.classList.toggle('active', !isVisible);
  }

  function adjustTiltAngle(teamKey, delta) {
    if (!gameState[teamKey]) return;
    let newTilt = Math.max(-20, Math.min(20, (gameState[teamKey].photoTilt || 0) + delta));
    newTilt = Math.round(newTilt * 10) / 10;
    gameState[teamKey].photoTilt = newTilt;

    const slider = document.getElementById(`${teamKey}_tiltSlider`);
    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (slider) slider.value = newTilt;
    if (valText) valText.textContent = `${newTilt > 0 ? '+' : ''}${newTilt}°`;

    updateArtworkTransformUI(teamKey);
  }

  function onTiltSliderChange(teamKey, val) {
    if (!gameState[teamKey]) return;
    const newTilt = parseFloat(val) || 0;
    gameState[teamKey].photoTilt = newTilt;

    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (valText) valText.textContent = `${newTilt > 0 ? '+' : ''}${newTilt}°`;

    updateArtworkTransformUI(teamKey);
  }

  function resetTiltAngle(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoTilt = 0;

    const slider = document.getElementById(`${teamKey}_tiltSlider`);
    const valText = document.getElementById(`${teamKey}_tiltVal`);
    if (slider) slider.value = 0;
    if (valText) valText.textContent = '0°';

    updateArtworkTransformUI(teamKey);
  }

  function updateArtworkTransformUI(teamKey) {
    const img = document.getElementById(`${teamKey}_photoImg`);
    if (!img) return;

    const rot = gameState[teamKey]?.photoRotation || 0;
    const tilt = gameState[teamKey]?.photoTilt || 0;
    const isAi = gameState[teamKey]?.isAiEnhanced !== false;

    img.style.transform = `rotate(${rot + tilt}deg)`;
    img.classList.toggle('gmm-ai-enhanced-img', isAi);
  }

  function rotateArtworkPhoto(teamKey) {
    if (!gameState[teamKey]) return;
    gameState[teamKey].photoRotation = ((gameState[teamKey].photoRotation || 0) + 90) % 360;
    updateArtworkTransformUI(teamKey);
  }

  function zoomArtworkPhoto(teamKey) {
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openTeamFullscreen === 'function') {
      window.GiaiMaArtworkScanner.openTeamFullscreen(teamKey);
      return;
    }

    const photoData = gameState[teamKey]?.artworkPhoto;
    if (!photoData) return;

    openZoomModal();
    const zoomBody = document.getElementById('gmmZoomBody');
    if (zoomBody) {
      const rot = gameState[teamKey]?.photoRotation || 0;
      const tilt = gameState[teamKey]?.photoTilt || 0;
      const isAi = gameState[teamKey]?.isAiEnhanced !== false;
      const teamName = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';

      zoomBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative;">
          <img src="${photoData}" alt="Tranh giấy ${teamName}" class="${isAi ? 'gmm-ai-enhanced-img' : ''}" style="max-width: 96%; max-height: 86vh; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.85); transform: rotate(${rot + tilt}deg);">
        </div>
      `;
    }
  }

  async function handleHostPhotoUpload(teamKey, e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';

    // Mở Studio Quét Tài Liệu 4 Góc Hình Thang để nắn phẳng & làm sáng trước khi gắn lên bảng
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.openScannerWithFile === 'function') {
      window.GiaiMaArtworkScanner.openScannerWithFile(file, 'host', teamKey);
      return;
    }

    try {
      if (typeof window.showToast === 'function') {
        window.showToast('⏳ AI đang cân bằng sáng & độ tương phản...', 'info');
      }
      const compressed = await compressImageClient(file, 1600, 0.86, true);
      const ts = Date.now();
      attachTeamArtworkPhoto(teamKey, compressed, ts);

      fetch('/api/gmm/upload-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: teamKey,
          photoData: compressed,
          timestamp: ts
        })
      }).catch(() => {});
    } catch (_err) {
      if (typeof window.showToast === 'function') {
        window.showToast('❌ Không thể nạp file ảnh!', 'error');
      }
    }
  }

  // Kênh đồng bộ kép (Polling 2s dự phòng cho SSE) đảm bảo 100% ảnh học sinh gửi lên luôn hiện trên máy Thầy/Cô
  async function pollServerArtworksOnce() {
    if (isStudentMobileClient) return;
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;

    try {
      const tsA = gameState.teamA.photoTimestamp || 0;
      const tsB = gameState.teamB.photoTimestamp || 0;
      const resp = await fetch(`/api/gmm/artworks?tsA=${tsA}&tsB=${tsB}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.success && json.hasUpdate) {
        if (json.teamA && json.teamA.photoData) {
          attachTeamArtworkPhoto('teamA', json.teamA.photoData, json.teamA.timestamp);
        }
        if (json.teamB && json.teamB.photoData) {
          attachTeamArtworkPhoto('teamB', json.teamB.photoData, json.teamB.timestamp);
        }
      }
    } catch (_e) {}
  }

  function startHostArtworkPolling() {
    stopHostArtworkPolling();
    pollServerArtworksOnce();
    hostArtworkPollInterval = setInterval(pollServerArtworksOnce, 2000);
  }

  function stopHostArtworkPolling() {
    if (hostArtworkPollInterval) {
      clearInterval(hostArtworkPollInterval);
      hostArtworkPollInterval = null;
    }
  }

  // Chuyển góc nhìn / tiêu điểm Đội (Toàn cảnh / Đội A / Đội B)
  function setRoleFocus(role) {
    gameState.roleFocus = role;

    ['all', 'teamA', 'teamB'].forEach(r => {
      const btn = document.getElementById(`gmmRoleBtn_${r}`);
      if (btn) btn.classList.toggle('active', r === role);
    });

    if (typeof window.showToast === 'function') {
      const roleNames = {
        all: '👨‍🏫 Góc nhìn Ban Giám Khảo (Cả 2 đội)',
        teamA: '🔴 Tiêu điểm Đội 1 (Đội A)',
        teamB: '🔵 Tiêu điểm Đội 2 (Đội B)'
      };
      window.showToast(`Đã chuyển sang: ${roleNames[role]}`, 'info');
    }
  }

  // ============================================================================
  // QUẢN LÝ ĐỔI TÊN ĐẠI DIỆN 2 ĐỘI THI ĐẤU (VÍ DỤ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
  // ============================================================================
  function getTeamName(teamKey, format = 'short') {
    const defaultName = teamKey === 'teamA' ? 'ĐOÀN KẾT' : 'LA BÀN TUỔI TRẺ';
    const numPrefix = teamKey === 'teamA' ? 'Đội 1' : 'Đội 2';
    const custom = (gameState[teamKey]?.name && String(gameState[teamKey].name).trim()) || defaultName;
    if (format === 'full') {
      return `${custom} (${numPrefix})`;
    }
    if (format === 'withNum') {
      return `${numPrefix} - ${custom}`;
    }
    return custom;
  }

  function updateAllTeamNamesUI() {
    const nameA = getTeamName('teamA');
    const nameB = getTeamName('teamB');

    // 1. Header điểm số
    const hA = document.getElementById('gmmHeaderTeamNameA');
    if (hA) hA.textContent = `🔴 ${nameA}:`;
    const hB = document.getElementById('gmmHeaderTeamNameB');
    if (hB) hB.textContent = `🔵 ${nameB}:`;

    // 2. Tab 1: Cổng tham gia
    const entA = document.getElementById('gmmEntryTitleA');
    if (entA) entA.textContent = `ĐỘI 1 (${nameA}) THAM GIA`;
    const entBtnA = document.getElementById('gmmEntryBtnA');
    if (entBtnA) entBtnA.textContent = `Vào Phòng ${nameA}`;

    const entB = document.getElementById('gmmEntryTitleB');
    if (entB) entB.textContent = `ĐỘI 2 (${nameB}) THAM GIA`;
    const entBtnB = document.getElementById('gmmEntryBtnB');
    if (entBtnB) entBtnB.textContent = `Vào Phòng ${nameB}`;

    // 3. Tab 2: Phòng chờ & Mã QR
    const qrA = document.getElementById('gmmQrTitleA');
    if (qrA) qrA.textContent = `🔴 MÃ QR ĐỘI 1: ${nameA}`;
    const copyBtnA = document.getElementById('gmmBtnCopyTeamA');
    if (copyBtnA) copyBtnA.textContent = `📋 Sao chép link ${nameA}`;
    const statusTextA = document.getElementById('gmmTeamStatusTextA');
    if (statusTextA && (!gameState.connectedTeams || !gameState.connectedTeams.teamA)) {
      statusTextA.textContent = `Đang chờ ${nameA} quét mã...`;
    }

    const qrB = document.getElementById('gmmQrTitleB');
    if (qrB) qrB.textContent = `🔵 MÃ QR ĐỘI 2: ${nameB}`;
    const copyBtnB = document.getElementById('gmmBtnCopyTeamB');
    if (copyBtnB) copyBtnB.textContent = `📋 Sao chép link ${nameB}`;
    const statusTextB = document.getElementById('gmmTeamStatusTextB');
    if (statusTextB && (!gameState.connectedTeams || !gameState.connectedTeams.teamB)) {
      statusTextB.textContent = `Đang chờ ${nameB} quét mã...`;
    }

    // 4. Tab 3: Cột đấu trường đối kháng
    const arenaColA = document.getElementById('gmmArenaColTitleA');
    if (arenaColA) arenaColA.textContent = `ĐỘI 1 (${nameA})`;
    const arenaColB = document.getElementById('gmmArenaColTitleB');
    if (arenaColB) arenaColB.textContent = `ĐỘI 2 (${nameB})`;

    const pingTextA = document.getElementById('gmmLivePingTextA');
    if (pingTextA && (!gameState.connectedTeams || !gameState.connectedTeams.teamA)) {
      pingTextA.textContent = `${nameA}: Chưa kết nối điện thoại (Chờ quét QR)`;
    }
    const pingTextB = document.getElementById('gmmLivePingTextB');
    if (pingTextB && (!gameState.connectedTeams || !gameState.connectedTeams.teamB)) {
      pingTextB.textContent = `${nameB}: Chưa kết nối điện thoại (Chờ quét QR)`;
    }

    // 5. Tab 4: Tô màu giải mã tranh
    const canvasA = document.getElementById('gmmCanvasTitleA');
    if (canvasA) canvasA.textContent = `🔴 BẢNG TRANH: ${nameA}`;
    const canvasB = document.getElementById('gmmCanvasTitleB');
    if (canvasB) canvasB.textContent = `🔵 BẢNG TRANH: ${nameB}`;

    const selA = document.getElementById('teamA_customScoreSelect');
    const scoreA = gameState.teamA.completed ? gameState.teamA.bonusScore : (selA ? selA.value : (gameState.teamA.selectedBonusScore || 10));
    const judgeA = document.getElementById('gmmJudgeBtnTextA');
    if (judgeA) {
      judgeA.textContent = gameState.teamA.completed
        ? `🌟 ĐÃ DUYỆT TRANH (+${scoreA}đ)`
        : `✅ Duyệt Tranh (+${scoreA}đ)`;
    }

    const selB = document.getElementById('teamB_customScoreSelect');
    const scoreB = gameState.teamB.completed ? gameState.teamB.bonusScore : (selB ? selB.value : (gameState.teamB.selectedBonusScore || 10));
    const judgeB = document.getElementById('gmmJudgeBtnTextB');
    if (judgeB) {
      judgeB.textContent = gameState.teamB.completed
        ? `🌟 ĐÃ DUYỆT TRANH (+${scoreB}đ)`
        : `✅ Duyệt Tranh (+${scoreB}đ)`;
    }

    const undoA = document.getElementById('teamA_undoJudgeBtn');
    if (undoA) undoA.style.display = gameState.teamA.completed ? 'inline-flex' : 'none';
    const undoB = document.getElementById('teamB_undoJudgeBtn');
    if (undoB) undoB.style.display = gameState.teamB.completed ? 'inline-flex' : 'none';

    const emptyPhotoA = document.getElementById('teamA_photoEmptyTitle');
    if (emptyPhotoA) emptyPhotoA.textContent = `CHƯA CÓ ẢNH TRANH GIẤY TỪ ${nameA}`;
    const emptyPhotoB = document.getElementById('teamB_photoEmptyTitle');
    if (emptyPhotoB) emptyPhotoB.textContent = `CHƯA CÓ ẢNH TRANH GIẤY TỪ ${nameB}`;

    // 6. Tab 5: Đối chiếu tranh giáo viên
    const compareThA = document.getElementById('gmmCompareThA');
    if (compareThA) compareThA.textContent = `${nameA} (Đội 1)`;
    const compareThB = document.getElementById('gmmCompareThB');
    if (compareThB) compareThB.textContent = `${nameB} (Đội 2)`;

    // 7. Tab 6: Bảng điểm & Tổng kết
    const resThA = document.getElementById('gmmResultThA');
    if (resThA) resThA.textContent = `${nameA} (Đội 1)`;
    const resThB = document.getElementById('gmmResultThB');
    if (resThB) resThB.textContent = `${nameB} (Đội 2)`;

    // 8. Màn hình Fullscreen & Máy chiếu
    const fsNameA = document.getElementById('gmmFsTeamAName');
    if (fsNameA) fsNameA.textContent = nameA;
    const fsNameB = document.getElementById('gmmFsTeamBName');
    if (fsNameB) fsNameB.textContent = nameB;

    const fsTabA = document.getElementById('gmmFsTabTeamA');
    if (fsTabA) fsTabA.textContent = `🔴 Full ${nameA}`;
    const fsTabB = document.getElementById('gmmFsTabTeamB');
    if (fsTabB) fsTabB.textContent = `🔵 Full ${nameB}`;

    // 9. Điện thoại học sinh (Mobile client)
    if (isStudentMobileClient) {
      const myTeamName = studentTeamKey === 'teamA' ? nameA : nameB;
      const myNumPrefix = studentTeamKey === 'teamA' ? 'ĐỘI 1' : 'ĐỘI 2';
      const mobName = document.getElementById('gmmMobTeamName');
      if (mobName) mobName.textContent = `${myNumPrefix} - ${myTeamName}`.toUpperCase();
      const mobTitle = document.getElementById('gmmMobLobbyTeamTitle');
      if (mobTitle) mobTitle.textContent = (studentTeamKey === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
      const mobBadge = document.getElementById('gmmMobCountdownTeamBadge');
      if (mobBadge) mobBadge.textContent = (studentTeamKey === 'teamA' ? '🔴 ' : '🔵 ') + `${myTeamName} (${myNumPrefix})`.toUpperCase();
    }

    if (window.GiaiMaLiveMonitor && typeof window.GiaiMaLiveMonitor.renderHostPingIndicators === 'function') {
      window.GiaiMaLiveMonitor.renderHostPingIndicators();
    }
  }

  function openTeamNameModal() {
    const modal = document.getElementById('gmmTeamNameModal');
    if (!modal) return;
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    if (inpA) inpA.value = gameState.teamA?.name || 'ĐOÀN KẾT';
    if (inpB) inpB.value = gameState.teamB?.name || 'LA BÀN TUỔI TRẺ';
    modal.style.display = 'flex';
    if (inpA) setTimeout(() => inpA.focus(), 100);
  }

  function closeTeamNameModal() {
    const modal = document.getElementById('gmmTeamNameModal');
    if (modal) modal.style.display = 'none';
  }

  function setQuickTeamName(teamKey, name) {
    const inp = document.getElementById(teamKey === 'teamA' ? 'gmmInputTeamNameA' : 'gmmInputTeamNameB');
    if (inp) {
      inp.value = name;
      inp.focus();
    }
  }

  function resetDefaultTeamNames() {
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    if (inpA) inpA.value = 'ĐOÀN KẾT';
    if (inpB) inpB.value = 'LA BÀN TUỔI TRẺ';
    if (typeof window.showToast === 'function') {
      window.showToast('↺ Đã điền tên mẫu mặc định: ĐOÀN KẾT & LA BÀN TUỔI TRẺ!', 'info');
    }
  }

  function saveTeamNames() {
    const inpA = document.getElementById('gmmInputTeamNameA');
    const inpB = document.getElementById('gmmInputTeamNameB');
    const valA = (inpA && inpA.value.trim()) || 'ĐOÀN KẾT';
    const valB = (inpB && inpB.value.trim()) || 'LA BÀN TUỔI TRẺ';

    gameState.teamA.name = valA;
    gameState.teamB.name = valB;

    try {
      localStorage.setItem(STORAGE_KEY_TEAM_NAMES, JSON.stringify({ teamA: valA, teamB: valB }));
    } catch (_e) {}

    updateAllTeamNamesUI();
    closeTeamNameModal();

    broadcastHostStateToServer();

    if (typeof window.showToast === 'function') {
      window.showToast(`✅ Đã lưu tên 2 đội: ${valA} & ${valB}!`, 'success');
    }
  }

  // Vào cổng vai trò từ màn hình Trang chủ
  function openAsRole(role) {
    if (role === 'admin') {
      setRoleFocus('all');
      switchTab('lobby');
    } else if (role === 'teamA') {
      setRoleFocus('teamA');
      switchTab(gameState.isDecryptPhase ? 'decrypt' : 'quiz');
    } else if (role === 'teamB') {
      setRoleFocus('teamB');
      switchTab(gameState.isDecryptPhase ? 'decrypt' : 'quiz');
    }
  }

  async function openCoordinatorModal(initialTab = 'home') {
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('open');
      modal.classList.add('has-maximized');
      document.body.classList.add('modal-open', 'gmm-modal-open');
      const card = modal.querySelector('.gmm-modal-card');
      if (card) {
        card.classList.add('is-maximized');
      }
      updateHeaderScores();
      updateAllTeamNamesUI();
      switchTab(initialTab, true, true);
    }
    initHostSseListener();
    startHostArtworkPolling();
    await syncHostInitialConnectionState();
    broadcastHostStateToServer();
  }

  function closeCoordinatorModal() {
    if (gameState.isStageMode) {
      exitProjectorStageMode();
    }
    stopHostArtworkPolling();
    if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeTeamFullscreen === 'function') {
      window.GiaiMaArtworkScanner.closeTeamFullscreen();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.closeMasterFullscreen === 'function') {
      window.GiaiMaTeacherKey.closeMasterFullscreen();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.pauseThemeSong === 'function') {
      window.GiaiMaTeacherKey.pauseThemeSong(true);
    }
    const modal = document.getElementById('giaiMaBiMatModal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('open');
      modal.classList.remove('has-maximized');
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.decryptTimerInterval);
    }
    document.body.classList.remove('modal-open', 'gmm-modal-open');
  }

  function toggleFullscreen() {
    if (typeof window.toggleFullscreen === 'function') {
      window.toggleFullscreen();
    } else {
      const docEl = document.documentElement;
      if (!document.fullscreenElement) {
        docEl.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  async function resetGame(targetTab = null) {
    if (confirm('Thầy/Cô có chắc chắn muốn đặt lại toàn bộ điểm số, mở khóa lại bài thi trên điện thoại học sinh và bắt đầu ván mới không?')) {
      const savedMatchDuration = gameState.totalMatchSeconds || 120;
      const newSessionId = Math.max(Date.now(), (Number(gameState.sessionId) || 0) + 1);
      gameState.sessionId = newSessionId;
      gameState.newlyUnlocked = { teamA: [], teamB: [] };
      if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.resetLiveQuizTracking === 'function') {
        window.GiaiMaTeacherKey.resetLiveQuizTracking();
      }

      gameState.teamA.score = 0;
      gameState.teamA.bonusScore = 0;
      gameState.teamA.answers = {};
      gameState.teamA.isLocked = false;
      gameState.teamA.unlockedRegions = [];
      gameState.teamA.coloredRegions = {};
      gameState.teamA.completed = false;
      gameState.teamA.finishTime = null;
      gameState.teamA.finishTimeSeconds = null;
      gameState.teamA.finishTimeFormatted = null;
      gameState.teamA.artworkPhoto = null;
      gameState.teamA.photoTimestamp = null;
      gameState.teamA.hasArtworkPhoto = false;
      gameState.teamA.photoRotation = 0;
      gameState.teamA.photoTilt = 0;
      gameState.teamA.isAiEnhanced = true;
      gameState.teamA.photoViewMode = 'svg';

      gameState.teamB.score = 0;
      gameState.teamB.bonusScore = 0;
      gameState.teamB.answers = {};
      gameState.teamB.isLocked = false;
      gameState.teamB.unlockedRegions = [];
      gameState.teamB.coloredRegions = {};
      gameState.teamB.completed = false;
      gameState.teamB.finishTime = null;
      gameState.teamB.finishTimeSeconds = null;
      gameState.teamB.finishTimeFormatted = null;
      gameState.teamB.artworkPhoto = null;
      gameState.teamB.photoTimestamp = null;
      gameState.teamB.hasArtworkPhoto = false;
      gameState.teamB.photoRotation = 0;
      gameState.teamB.photoTilt = 0;
      gameState.teamB.isAiEnhanced = true;
      gameState.teamB.photoViewMode = 'svg';

      setArtworkViewMode('teamA', 'svg');
      setArtworkViewMode('teamB', 'svg');
      resetTiltAngle('teamA');
      resetTiltAngle('teamB');

      const imgA = document.getElementById('teamA_photoImg');
      const emptyA = document.getElementById('teamA_photoEmpty');
      const contentA = document.getElementById('teamA_photoContent');
      const dotA = document.getElementById('teamA_photoDot');
      if (imgA) {
        imgA.src = '';
        imgA.style.transform = 'rotate(0deg)';
      }
      if (emptyA) emptyA.style.display = 'block';
      if (contentA) contentA.style.display = 'none';
      if (dotA) dotA.style.display = 'none';

      const imgB = document.getElementById('teamB_photoImg');
      const emptyB = document.getElementById('teamB_photoEmpty');
      const contentB = document.getElementById('teamB_photoContent');
      const dotB = document.getElementById('teamB_photoDot');
      if (imgB) {
        imgB.src = '';
        imgB.style.transform = 'rotate(0deg)';
      }
      if (emptyB) emptyB.style.display = 'block';
      if (contentB) contentB.style.display = 'none';
      if (dotB) dotB.style.display = 'none';

      // Đặt lại hiệu ứng viền vàng kim và con dấu duyệt tranh 2 đội
      ['teamA', 'teamB'].forEach(tKey => {
        const c = document.getElementById(`${tKey}_canvasContainer`);
        if (c) c.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
        const panel = c ? c.closest('.gmm-canvas-panel') : null;
        if (panel) panel.classList.remove('gmm-gold-glow-active', 'gmm-approved-permanent');
        const stamp = document.getElementById(`${tKey}_goldStamp`);
        if (stamp) stamp.remove();
        const btn = document.getElementById(tKey === 'teamA' ? 'gmmJudgePaperBtnA' : 'gmmJudgePaperBtnB');
        if (btn) {
          btn.classList.remove('approved');
          btn.disabled = false;
        }
        const undo = document.getElementById(`${tKey}_undoJudgeBtn`);
        if (undo) undo.style.display = 'none';
        const sel = document.getElementById(`${tKey}_customScoreSelect`);
        if (sel) {
          sel.disabled = false;
          sel.value = '10';
        }
        gameState[tKey].selectedBonusScore = 10;
      });

      mobileCapturedPhotoData = null;
      mobileOriginalPhotoData = null;
      mobileEnhancedPhotoData = null;
      mobilePhotoRotation = 0;
      mobilePhotoTilt = 0;
      isMobileAiEnhanced = true;
      document.querySelectorAll('.gmm-mob-upload-success').forEach(el => { el.style.display = 'none'; });
      if (window.GiaiMaArtworkScanner && typeof window.GiaiMaArtworkScanner.closeTeamFullscreen === 'function') {
        window.GiaiMaArtworkScanner.closeTeamFullscreen();
      }

      clearInterval(countdownTimerId);
      gameState.isCountdownRunning = false;
      const hostCd = document.getElementById('gmmHostCountdownOverlay');
      if (hostCd) hostCd.style.display = 'none';

      gameState.currentQIndex = 0;
      gameState.isMatchStarted = false;
      gameState.isTimerRunning = false;
      gameState.totalMatchSeconds = savedMatchDuration;
      gameState.timerSeconds = savedMatchDuration;
      gameState.isQuestionLocked = false;
      gameState.isAnswerRevealed = false;
      gameState.isDecryptPhase = false;
      gameState.decryptTimeTotal = 300;
      gameState.decryptTimeLeft = 300;
      gameState.isDecryptTimerRunning = false;
      closeDecryptTimerFullscreen();
      updateDecryptTimerUI();
      const btnStartDec = document.getElementById('gmmBtnStartDecrypt');
      if (btnStartDec) btnStartDec.textContent = '🚀 Bắt Đầu (5p)';
      [180, 300, 420].forEach(s => {
        const btn = document.getElementById(`gmmDecTimeBtn_${s}`);
        if (btn) btn.classList.toggle('primary', s === 300);
        const fsBtn = document.getElementById(`gmmFsPresetBtn_${s}`);
        if (fsBtn) fsBtn.classList.toggle('active', s === 300);
      });
      stopBattleMusicUI(0.8);
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.decryptTimerInterval);

      closeSettingsMenu();
      closeSettingsMenuTab4();
      updateHeaderScores();
      updateAllTeamNamesUI();

      // Nếu đang ở Tab Đấu trường hoặc 2 điện thoại đã kết nối sẵn -> chuyển thẳng tới Tab 3 để Thầy/Cô bấm Bắt Đầu Ván Mới ngay!
      const hasConnectedPhones = Boolean(gameState.connectedTeams && (gameState.connectedTeams.teamA || gameState.connectedTeams.teamB));
      const nextTab = targetTab || ((gameState.activeTab === 'quiz' || hasConnectedPhones) ? 'quiz' : 'home');
      switchTab(nextTab, true, true);

      // Bước 1: Gửi lệnh Reset đồng bộ kèm sessionId mới lên máy chủ TRƯỚC (phát SSE gmm_reset xóa kết quả cũ trên điện thoại)
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        try {
          const resetRes = await fetch('/api/gmm/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: newSessionId,
              roomCode: gameState.roomCode,
              totalMatchSeconds: savedMatchDuration,
              keepConnectedTeams: true,
              status: nextTab === 'quiz' ? 'quiz_waiting' : 'lobby'
            })
          });
          if (resetRes && resetRes.ok) {
            const resetJson = await resetRes.json();
            if (resetJson && resetJson.sessionId) {
              gameState.sessionId = resetJson.sessionId;
            }
          }
        } catch (_e) {}

        // Bước 2: Phát trạng thái mới sạch sẽ xuống toàn bộ thiết bị
        await broadcastHostStateToServer({ forceTeamOverwrite: true });
      }

      if (typeof window.showToast === 'function') {
        window.showToast('🔄 Đã đặt lại ván mới thành công! Điện thoại 2 đội đã xóa kết quả cũ và sẵn sàng thi đấu.', 'success');
      }
    }
  }

  // Khởi tạo ban đầu
  loadQuestionsFromStorage();

  // Kiểm tra tham số URL khi trang tải (nếu học sinh quét mã QR truy cập thẳng)
  function checkUrlQueryParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      const teamParam = params.get('team'); // 'A' hoặc 'B'

      if (gameParam === 'giai_ma_bi_mat') {
        if (teamParam === 'A' || teamParam === 'B') {
          // Khóa giao diện chỉ hiển thị Mobile Arena cho học sinh ngay lập tức
          document.documentElement.classList.add('gmm-student-mode');
          document.body.classList.add('gmm-student-mode');
          setTimeout(() => {
            initStudentMobileArena(teamParam === 'A' ? 'teamA' : 'teamB');
          }, 50);
        } else {
          // Mở modal trên máy tính
          setTimeout(() => {
            openCoordinatorModal('home');
          }, 500);
        }
      }
    } catch (_e) {}
  }

  // Lắng nghe phím bấm Escape và phím tắt điều khiển
  document.addEventListener('keydown', (e) => {
    // Phím tắt P bật/tắt Chế độ Sân Khấu Máy Chiếu trong Tab Đấu trường
    if ((e.key === 'p' || e.key === 'P') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      const modal = document.getElementById('giaiMaBiMatModal');
      if (modal && (modal.classList.contains('active') || modal.classList.contains('open')) && gameState.activeTab === 'quiz') {
        e.preventDefault();
        toggleProjectorStageMode();
        return;
      }
    }

    if (e.key === 'Escape') {
      // Ưu tiên 0: Đóng Sân khấu Đồng Hồ Đếm Ngược Full Màn Hình nếu đang mở
      const timerFsModal = document.getElementById('gmmDecryptTimerFullscreenModal');
      if (timerFsModal && timerFsModal.style.display !== 'none') {
        closeDecryptTimerFullscreen();
        return;
      }
      // Ưu tiên 0b: Đóng Ô Cài Đặt Tab 4 nếu đang mở
      const settingsBoxTab4 = document.getElementById('gmmSettingsBoxTab4');
      if (settingsBoxTab4 && settingsBoxTab4.style.display !== 'none') {
        closeSettingsMenuTab4();
        return;
      }
      // Ưu tiên 0c: Đóng Ô Cài Đặt nếu đang mở
      const settingsBox = document.getElementById('gmmSettingsBox');
      if (settingsBox && settingsBox.style.display !== 'none') {
        closeSettingsMenu();
        return;
      }
      // Ưu tiên 1: Nếu đang ở Chế độ Sân Khấu Máy Chiếu thì thoát Sân Khấu trước
      if (gameState.isStageMode) {
        exitProjectorStageMode();
        return;
      }
      const exportModal = document.getElementById('gmmExportWorksheetModal');
      if (exportModal && exportModal.style.display !== 'none') {
        closeExportModal();
        return;
      }
      const qModal = document.getElementById('gmmQuestionEditModal');
      if (qModal && qModal.style.display !== 'none') {
        closeQuestionEditor();
        return;
      }
      const mistakesModal = document.getElementById('gmmMobMistakesModal');
      if (mistakesModal && mistakesModal.style.display !== 'none') {
        closeMistakesReviewModal();
        return;
      }
      const zoomModal = document.getElementById('gmmPuzzleZoomModal');
      if (zoomModal && zoomModal.style.display !== 'none') {
        if (e.key === 'Escape') {
          closeZoomModal();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          switchZoomTeam();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          toggleZoomSplitView();
          return;
        }
      }
      const modal = document.getElementById('giaiMaBiMatModal');
      if (modal && (modal.classList.contains('active') || modal.classList.contains('open'))) {
        closeCoordinatorModal();
      }
    }
  });

  // ==================== QUẢN LÝ THU PHÓNG TOÀN MÀN HÌNH BỨC TRANH (ZOOM IN / FULLSCREEN CANVAS) ====================
  let activeZoomTeam = 'teamA';
  let isZoomAnswerKeyActive = false;
  let isZoomSplitView = false;

  function openZoomModal(teamKey = 'teamA') {
    activeZoomTeam = teamKey;
    isZoomAnswerKeyActive = false;
    isZoomSplitView = false;
    const modal = document.getElementById('gmmPuzzleZoomModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderZoomModalContent();
  }

  function closeZoomModal() {
    const modal = document.getElementById('gmmPuzzleZoomModal');
    if (modal) modal.style.display = 'none';
  }

  function switchZoomTeam() {
    if (isZoomSplitView) {
      isZoomSplitView = false;
    }
    activeZoomTeam = (activeZoomTeam === 'teamA') ? 'teamB' : 'teamA';
    renderZoomModalContent();
  }

  function toggleZoomSplitView() {
    isZoomSplitView = !isZoomSplitView;
    renderZoomModalContent();
  }

  function toggleZoomAnswerKey() {
    isZoomAnswerKeyActive = !isZoomAnswerKeyActive;
    renderZoomModalContent();
  }

  function renderZoomModalContent() {
    const body = document.getElementById('gmmZoomBody');
    const iconEl = document.getElementById('gmmZoomTeamIcon');
    const titleEl = document.getElementById('gmmZoomTitle');
    const progEl = document.getElementById('gmmZoomProgress');
    const switchTargetEl = document.getElementById('gmmZoomSwitchTarget');
    const switchBtn = document.getElementById('gmmBtnZoomSwitch');
    const splitBtn = document.getElementById('gmmBtnZoomSplit');
    const keyBtn = document.getElementById('gmmBtnZoomKey');

    if (!body) return;

    const isPaper = (gameState.canvasTheme || 'paper') === 'paper';
    body.classList.toggle('paper-theme', isPaper);

    const isTeamA = (activeZoomTeam === 'teamA');
    const teamData = gameState[activeZoomTeam];
    const teamName = isTeamA ? 'ĐỘI 1 (ĐỘI A)' : 'ĐỘI 2 (ĐỘI B)';
    const otherName = isTeamA ? 'Đội 2 (Đội B)' : 'Đội 1 (Đội A)';

    const activeTitle = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.getActivePuzzle === 'function')
      ? window.GiaiMaPuzzle.getActivePuzzle().title
      : 'TRI ÂN THẦY CÔ 20/11';

    const pctA = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
      ? window.GiaiMaPuzzle.calculateProgress(gameState.teamA)
      : 0;
    const pctB = (window.GiaiMaPuzzle && typeof window.GiaiMaPuzzle.calculateProgress === 'function')
      ? window.GiaiMaPuzzle.calculateProgress(gameState.teamB)
      : 0;

    // Cập nhật trạng thái nút So Sánh Song Song 2 Đội
    if (splitBtn) {
      if (isZoomSplitView) {
        splitBtn.classList.add('active');
        splitBtn.innerHTML = '🔍 Xem Riêng 1 Đội';
        splitBtn.title = 'Chuyển về xem riêng từng đội phóng to (Phím S)';
      } else {
        splitBtn.classList.remove('active');
        splitBtn.innerHTML = '👥 So Sánh 2 Đội';
        splitBtn.title = 'Chiếu so sánh song song 2 đội cạnh nhau (Phím S)';
      }
    }

    if (switchBtn) {
      switchBtn.style.display = isZoomSplitView ? 'none' : 'inline-flex';
    }

    if (keyBtn) {
      if (isZoomAnswerKeyActive) {
        keyBtn.innerHTML = '🔄 Xem Tranh Thực Tế';
        keyBtn.style.background = '#eab308';
        keyBtn.style.color = '#0f172a';
      } else {
        keyBtn.innerHTML = '👁️ Xem Tranh Mẫu';
        keyBtn.style.background = '';
        keyBtn.style.color = '';
      }
    }

    // 1. Chế độ So Sánh Song Song 2 Đội (Split-Screen Zoom View)
    if (isZoomSplitView) {
      if (iconEl) iconEl.textContent = '👥';
      if (titleEl) {
        titleEl.textContent = isZoomAnswerKeyActive
          ? `🌺 TRANH MẪU ĐÁP ÁN: “${activeTitle}” (SO SÁNH 2 ĐỘI)`
          : `SO SÁNH ĐỐI ĐẦU TRANH 2 ĐỘI - BIỂU TƯỢNG BÍ MẬT`;
      }
      if (progEl) {
        progEl.textContent = `🔴 Đội 1: ${pctA}%  |  🔵 Đội 2: ${pctB}%`;
      }

      body.innerHTML = `
        <div class="gmm-zoom-split-grid">
          <!-- Cột Đội 1 -->
          <div class="gmm-zoom-split-col team-a">
            <div class="gmm-zoom-split-header">
              <span style="font-size: 1.1rem; font-weight: 800; color: #fca5a5;">🔴 ĐỘI 1 (ĐỘI A)</span>
              <span class="gmm-zoom-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);">Tiến độ: ${pctA}%</span>
            </div>
            <div class="gmm-zoom-split-svg-wrap">
              ${generateSvgPuzzle('teamA', isZoomAnswerKeyActive)}
            </div>
          </div>
          <!-- Cột Đội 2 -->
          <div class="gmm-zoom-split-col team-b">
            <div class="gmm-zoom-split-header">
              <span style="font-size: 1.1rem; font-weight: 800; color: #93c5fd;">🔵 ĐỘI 2 (ĐỘI B)</span>
              <span class="gmm-zoom-badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-color: rgba(59, 130, 246, 0.4);">Tiến độ: ${pctB}%</span>
            </div>
            <div class="gmm-zoom-split-svg-wrap">
              ${generateSvgPuzzle('teamB', isZoomAnswerKeyActive)}
            </div>
          </div>
        </div>
      `;
      const splitCols = body.querySelectorAll('.gmm-zoom-split-col');
      splitCols.forEach(col => col.classList.toggle('paper-theme', isPaper));
      updateCanvasThemeButtonUI();
      return;
    }

    // 2. Chế độ Xem Riêng 1 Đội
    if (iconEl) iconEl.textContent = isTeamA ? '🔴' : '🔵';
    if (switchTargetEl) switchTargetEl.textContent = otherName;

    if (titleEl) {
      if (isZoomAnswerKeyActive) {
        titleEl.textContent = `🌺 TRANH MẪU HOÀN THIỆN: “${activeTitle}”`;
      } else if (teamData && teamData.completed) {
        titleEl.textContent = `BẢNG TRANH ${teamName}: “${activeTitle}” 🎉`;
      } else {
        titleEl.textContent = `BẢNG TRANH ${teamName} - BIỂU TƯỢNG BÍ MẬT`;
      }
    }

    if (progEl) {
      const currentPct = isTeamA ? pctA : pctB;
      progEl.textContent = `Tiến độ: ${currentPct}%`;
    }

    body.innerHTML = generateSvgPuzzle(activeZoomTeam, isZoomAnswerKeyActive);
    updateCanvasThemeButtonUI();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUrlQueryParams);
  } else {
    checkUrlQueryParams();
  }

  // EXPORT RA GLOBAL SCOPE
  window.GiaiMaBiMat = {
    openCoordinatorModal,
    closeCoordinatorModal,
    toggleFullscreen,
    switchTab,
    startGameFromLobby,
    recallToLobby,
    renderQrCodes,
    getGmmBaseUrl,
    copyBaseUrl,
    copyTeamUrl,
    promptCustomUrl,
    refreshGmmNetworkIp,
    startQuestion,
    pauseTimer,
    lockAnswer,
    showCorrectAnswer,
    nextQuestion,
    chooseAnswer,
    startDecryptPhase,
    extendDecryptTime,
    handleRegionClick,
    handleCellClick,
    printWorksheet,
    openExportWorksheetModal,
    closeExportModal,
    updateExportPreview,
    switchExportPreviewPage,
    handleLogoUpload,
    removeLogo,
    appendExtraInfoTemplate,
    exportWorksheetPdf,
    exportWorksheetWord,
    printWorksheetDirect,
    downloadHighResPng,
    downloadVectorSvg,
    autoColorDemo,
    approvePaperArtwork,
    undoApproveArtwork,
    onJudgeScoreChange,
    triggerGoldGlowAura,
    openAsRole,
    setRoleFocus,
    openQuestionEditor,
    closeQuestionEditor,
    saveQuestionEdit,
    restoreDefaultQuestions,
    downloadQuestionTemplate,
    exportQuestionsToExcel,
    handleExcelFileUpload,
    setMobileColor,
    resetGame,
    // Các hàm nâng cấp Đấu trường Đối kháng song song & Mobile 10 câu
    setMatchDuration,
    toggleMatchPause,
    toggleBattleMusic,
    toggleBattleMusicGenre,
    addMatchMinute,
    addMatchSeconds,
    forceLockBothTeams,
    startDualMatch,
    startMatchFromArena,
    renderDualArena,
    goToMobileQuestion,
    prevMobileQuestion,
    nextMobileQuestion,
    confirmLockMobileTeam,
    lockMobileTeam,
    resetMobileClientState,
    syncMobileNow,
    getConnectedTeams,
    getArenaLiveSnapshot,
    closeStudentSseOnExit,
    getTeamAnsweredCount,
    applyTeamUnlockOnHost,
    getMobileTelemetrySnapshot,
    toggleReviewQuestions,
    openMistakesReviewModal,
    closeMistakesReviewModal,
    filterMistakesView,
    setColorA: (c) => { gameState.selectedColorA = c; },
    setColorB: (c) => { gameState.selectedColorB = c; },
    // Thu phóng toàn màn hình tranh & Hiệu ứng lấp lánh Pulse Glow
    openZoomModal,
    closeZoomModal,
    switchZoomTeam,
    toggleZoomSplitView,
    toggleZoomAnswerKey,
    triggerPulseGlow,
    exportClassMemorySnapshot,
    // Tùy chọn ẩn bớt mã tọa độ chưa mở khóa (Stealth Matrix Mode)
    toggleStealthMode,
    updateStealthButtonUI,
    // Chế độ 1 chạm: Sân Khấu Máy Chiếu (Projector Stage View)
    toggleProjectorStageMode,
    enterProjectorStageMode,
    exitProjectorStageMode,
    // Ô Cài Đặt & Điều Hướng Nhanh (Settings Popover)
    toggleSettingsMenu,
    openSettingsMenu,
    closeSettingsMenu,
    // Cài đặt và Thời lượng Tab 4 (Tô Màu Giải Mã Tranh)
    toggleSettingsMenuTab4,
    openSettingsMenuTab4,
    closeSettingsMenuTab4,
    setDecryptDuration,
    toggleDecryptTimer,
    pauseDecryptTimer,
    resumeDecryptTimer,
    openDecryptTimerFullscreen,
    closeDecryptTimerFullscreen,
    toggleAutoFsOnTimerStart,
    // Góc nhìn & Tác phẩm tranh chụp của Đội
    setArtworkViewMode,
    playSmartKeystoningFx,
    attachTeamArtworkPhoto,
    getTeamArtworkPhoto,
    getTeamPhotoMeta,
    toggleAutoFullscreenOnUpload,
    pollServerArtworksOnce,
    rotateArtworkPhoto,
    zoomArtworkPhoto,
    handleHostPhotoUpload,
    // Chụp & Tải ảnh từ Mobile học sinh (Camera + Bộ sưu tập)
    triggerMobileCamera,
    triggerMobileGallery,
    handleMobilePhotoSelected,
    submitCapturedArtworkPhoto,
    // Bộ Lọc Canvas AI Filter & Cân Chỉnh Góc Nghiêng
    applyCanvasAiEnhance,
    toggleAiArtworkFilter,
    toggleTiltControl,
    adjustTiltAngle,
    onTiltSliderChange,
    resetTiltAngle,
    toggleMobileAiEnhance,
    rotateMobilePreview,
    stepMobileTilt,
    // Báo cáo hoàn thành tô tranh sớm từ điện thoại học sinh
    reportArtworkFinishedFromMobile,
    // Chế độ Giao diện Bảng Tranh: Nền Giấy Trắng A1 (Tivi/Máy chiếu) / Nền Tối
    toggleCanvasTheme,
    getCanvasTheme,
    updateCanvasThemeButtonUI,
    // Cài đặt tên đại diện 2 đội (ví dụ: ĐOÀN KẾT, LA BÀN TUỔI TRẺ)
    getTeamName,
    updateAllTeamNamesUI,
    openTeamNameModal,
    closeTeamNameModal,
    setQuickTeamName,
    resetDefaultTeamNames,
    saveTeamNames
  };

})();