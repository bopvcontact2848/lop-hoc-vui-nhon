/**
 * ==============================================================================
 * MODULE ĐẤU TRƯỜNG TRẮC NGHIỆM / RUNG CHUÔNG VÀNG (scripts/quiz.js)
 * Chịu trách nhiệm quản lý ngân hàng câu hỏi, nạp/sao lưu câu hỏi,
 * hiển thị câu hỏi trắc nghiệm, lật mở đáp án và điều hướng câu hỏi.
 * ==============================================================================
 */

// Bộ 10 câu hỏi mẫu tiêu chuẩn kiến thức tổng hợp
const DEFAULT_QUIZ_QUESTIONS = [
  {
    id: 'q_1',
    question: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?',
    options: ['TP. Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Hải Phòng'],
    correct: 2, // Index 2 -> Hà Nội
    difficulty: 'easy',
    explanation: 'Hà Nội là thủ đô ngàn năm văn hiến của Việt Nam.'
  },
  {
    id: 'q_2',
    question: 'Bác Hồ đọc bản Tuyên ngôn Độc lập tại Quảng trường Ba Đình vào năm nào?',
    options: ['1930', '1945', '1954', '1975'],
    correct: 1, // Index 1 -> 1945
    difficulty: 'easy',
    explanation: 'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập khai sinh nước VNDCCH.'
  },
  {
    id: 'q_3',
    question: 'Hành tinh nào nằm gần Mặt Trời nhất trong Hệ Mặt Trời?',
    options: ['Sao Kim (Venus)', 'Sao Thủy (Mercury)', 'Sao Hỏa (Mars)', 'Trái Đất (Earth)'],
    correct: 1, // Index 1 -> Sao Thủy
    difficulty: 'medium',
    explanation: 'Sao Thủy là hành tinh nhỏ nhất và gần Mặt Trời nhất.'
  },
  {
    id: 'q_4',
    question: 'Tác phẩm văn học kiệt tác "Truyện Kiều" do đại thi hào nào sáng tác?',
    options: ['Nguyễn Trãi', 'Hồ Xuân Hương', 'Nguyễn Du', 'Đoàn Thị Điểm'],
    correct: 2, // Index 2 -> Nguyễn Du
    difficulty: 'medium',
    explanation: 'Nguyễn Du (1765 - 1820) là Đại thi hào dân tộc, Danh nhân văn hóa thế giới.'
  },
  {
    id: 'q_5',
    question: 'Tam giác có ba cạnh bằng nhau và ba góc bằng nhau ($60^\\circ$) gọi là tam giác gì?',
    options: ['Tam giác vuông', 'Tam giác cân', 'Tam giác đều', 'Tam giác vuông cân'],
    correct: 2, // Index 2 -> Tam giác đều
    difficulty: 'hard',
    explanation: 'Tam giác đều có 3 cạnh bằng nhau và mỗi góc bằng $60^\\circ$.'
  },
  {
    id: 'q_6',
    question: 'Đại dương nào có diện tích và thể tích lớn nhất trên Trái Đất?',
    options: ['Đại Tây Dương', 'Thái Bình Dương', 'Ấn Độ Dương', 'Bắc Băng Dương'],
    correct: 1, // Index 1 -> Thái Bình Dương
    difficulty: 'easy',
    explanation: 'Thái Bình Dương chiếm hơn 30% tổng diện tích bề mặt Trái Đất.'
  },
  {
    id: 'q_7',
    question: 'Nguyên tố hóa học nào có ký hiệu hóa học là "O" và chiếm khoảng 21% khí quyển?',
    options: ['Hydro (Hydrogen)', 'Oxy (Oxygen)', 'Nitơ (Nitrogen)', 'Carbon (Cacbon)'],
    correct: 1, // Index 1 -> Oxy
    difficulty: 'medium',
    explanation: 'Khí oxy ($O_2$) duy trì sự sống và sự cháy.'
  },
  {
    id: 'q_8',
    question: 'Lá cờ Tổ quốc Việt Nam có hình ngôi sao vàng mấy cánh trên nền đỏ?',
    options: ['4 cánh', '5 cánh', '6 cánh', '8 cánh'],
    correct: 1, // Index 1 -> 5 cánh
    difficulty: 'easy',
    explanation: 'Quốc kỳ Việt Nam là cờ đỏ sao vàng năm cánh.'
  },
  {
    id: 'q_9',
    question: 'Quần thể Kim tự tháp Giza và tượng Nhân sư nổi tiếng thuộc quốc gia nào?',
    options: ['Hy Lạp', 'Ai Cập', 'Ý (Italia)', 'Ấn Độ'],
    correct: 1, // Index 1 -> Ai Cập
    difficulty: 'hard',
    image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80',
    explanation: 'Kim tự tháp Giza là kỳ quan cổ đại duy nhất còn tồn tại ở Ai Cập.'
  },
  {
    id: 'q_10',
    question: 'Ở áp suất khí quyển tiêu chuẩn ($1\\text{ atm}$), nước tinh khiết sôi ở bao nhiêu độ C ($^\\circ\\text{C}$)?',
    options: ['$80^\\circ\\text{C}$', '$90^\\circ\\text{C}$', '$100^\\circ\\text{C}$', '$120^\\circ\\text{C}$'],
    correct: 2, // Index 2 -> 100°C
    difficulty: 'medium',
    explanation: 'Nhiệt độ sôi của nước nguyên chất ở $1\\text{ atm}$ là $100^\\circ\\text{C}$.'
  }
];

// Hàm lấy tên nhãn độ khó
function getDifficultyLabel(diff) {
  switch (diff) {
    case 'hard': return '🔴 Vận dụng cao';
    case 'medium': return '🟡 Thông hiểu';
    case 'easy':
    default: return '🟢 Nhận biết';
  }
}

// Hàm render công thức Toán/Lý/Hóa KaTeX an toàn
function triggerMathRendering(element) {
  if (!element) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('Lỗi render KaTeX:', e);
    }
  }
}

const QUIZ_STORAGE_KEY = 'vong_quay_quiz_bank_v1';

// Trạng thái Quản lý Đấu trường Trắc nghiệm
let quizBank = [];
let currentQuestionIndex = 0;
let isAnswerRevealed = false;
let isQuizModeActive = false;

// Trạng thái các quyền trợ giúp (Lifelines Support)
let lifelinesState = {
  used5050: false,
  usedFriend: false,
  hiddenIndices: [],
  friendName: null
};

function resetLifelinesState() {
  lifelinesState = {
    used5050: false,
    usedFriend: false,
    hiddenIndices: [],
    friendName: null
  };
}

// Nạp ngân hàng câu hỏi từ LocalStorage (Bộ nhớ trình duyệt)
function loadQuizBankFromStorage() {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        quizBank = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc câu hỏi từ storage:", e);
  }
  quizBank = [...DEFAULT_QUIZ_QUESTIONS];
  saveQuizBankToStorage();
}

// Lưu ngân hàng câu hỏi vào LocalStorage
function saveQuizBankToStorage() {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizBank));
    window.quizBank = quizBank;
  } catch (e) {
    console.warn("Lỗi lưu câu hỏi vào storage:", e);
  }
}

// Lấy câu hỏi hiện tại
function getCurrentQuestion() {
  if (quizBank.length === 0) return null;
  if (currentQuestionIndex < 0) currentQuestionIndex = 0;
  if (currentQuestionIndex >= quizBank.length) currentQuestionIndex = quizBank.length - 1;
  return quizBank[currentQuestionIndex];
}

// Đồng bộ trạng thái câu hỏi sang thiết bị Remote trên điện thoại
function broadcastQuizIfAvailable() {
  if (window.RemoteSync && typeof window.RemoteSync.broadcastQuizState === 'function') {
    window.RemoteSync.broadcastQuizState();
  }
}

function getQuizState() {
  const curQ = getCurrentQuestion();
  return {
    total: quizBank ? quizBank.length : 0,
    currentIndex: currentQuestionIndex,
    currentQuestion: curQ ? {
      id: curQ.id,
      question: curQ.question,
      type: curQ.type || 'mc4',
      difficulty: curQ.difficulty || 'medium',
      timeLimit: curQ.timeLimit || 'auto',
      options: curQ.options || [],
      correct: curQ.correct,
      explanation: curQ.explanation || ''
    } : null,
    isAnswerRevealed: Boolean(isAnswerRevealed)
  };
}

// Hiển thị câu hỏi ra giao diện Arena
function renderQuizArenaCard() {
  const container = document.getElementById('quizArenaContainer');
  if (!container) return;

  const q = getCurrentQuestion();
  if (!q) {
    container.innerHTML = `
      <div class="quiz-empty-box">
        <p>📭 Chưa có câu hỏi nào trong ngân hàng đề thi.</p>
        <button class="btn-primary" onclick="openQuizManagerModal()">+ Thêm câu hỏi ngay</button>
      </div>
    `;
    return;
  }

  const isTF = q.type === 'tf' || (q.options && q.options.length === 2);
  const tfIcons = ['✅', '❌'];
  const optionLetters = isTF ? ['✓', '✕'] : ['A', 'B', 'C', 'D'];
  const timeLimit = getQuestionTimeLimit(q);

  // Tự động đồng bộ thời gian vào bộ đếm ngược theo độ khó
  if (typeof window.setTimerDuration === 'function') {
    window.setTimerDuration(timeLimit);
  }

  const optionsHtml = q.options.map((opt, idx) => {
    let classes = 'quiz-option-card' + (isTF ? ' tf-card' : '');
    const isEliminated = lifelinesState.hiddenIndices.includes(idx);

    if (isEliminated) {
      classes += ' lifeline-eliminated';
    } else if (isAnswerRevealed) {
      if (idx === q.correct) {
        classes += ' correct-answer';
      } else {
        classes += ' wrong-answer';
      }
    }

    return `
      <div class="${classes}" data-index="${idx}" onclick="selectQuizOption(${idx})">
        <span class="quiz-option-badge">${optionLetters[idx]}</span>
        <span class="quiz-option-text">${isTF ? `${tfIcons[idx] || ''} ` : ''}${opt}</span>
        ${isEliminated ? '<span class="quiz-eliminated-badge">✕ Đã loại trừ</span>' : ''}
        ${isAnswerRevealed && idx === q.correct ? '<span class="quiz-check-badge">✓ Đúng</span>' : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="quiz-card-wrapper animate-pop">
      <div class="quiz-header-bar">
        <div class="quiz-badge-info">
          <span class="quiz-order-tag">CÂU ${currentQuestionIndex + 1}/${quizBank.length}</span>
          <span class="quiz-difficulty-tag diff-${q.difficulty || 'easy'}">${getDifficultyLabel(q.difficulty)}</span>
          ${isTF ? '<span class="quiz-type-badge">⚖️ Đúng/Sai</span>' : ''}
          <button class="quiz-quick-timer-btn" onclick="triggerQuestionTimer(${timeLimit})" title="Bấm để kích hoạt đếm ngược ${timeLimit}s cho câu này">
            ⏱️ ${timeLimit}s ▶
          </button>
          <span class="quiz-topic-tag">🏆 Đấu trường Tri Thức</span>
        </div>
        <div class="quiz-controls-top">
          <button class="quiz-ctrl-btn btn-shuffle-top" onclick="shuffleQuizQuestions()" title="Xáo trộn ngẫu nhiên thứ tự các câu hỏi">🔀 Xáo trộn</button>
          <button class="quiz-ctrl-btn" onclick="prevQuizQuestion()" title="Câu trước đó" ${currentQuestionIndex === 0 ? 'disabled' : ''}>◀ Trước</button>
          <button class="quiz-ctrl-btn" onclick="nextQuizQuestion()" title="Câu tiếp theo" ${currentQuestionIndex === quizBank.length - 1 ? 'disabled' : ''}>Tiếp ▶</button>
          <button class="quiz-ctrl-btn" onclick="openQuizManagerModal()" title="Mở danh sách quản lý câu hỏi">⚙️ Soạn đề</button>
        </div>
      </div>

      <!-- Thanh Quyền Trợ Giúp (Lifelines Support) -->
      <div class="quiz-lifelines-bar">
        <div class="quiz-lifeline-btn-group">
          <span class="quiz-lifeline-label">Quyền trợ giúp:</span>
          <button id="btnLifeline5050" class="btn-lifeline ${lifelinesState.used5050 || isTF ? 'used' : ''}" onclick="useLifeline5050()" ${lifelinesState.used5050 || isAnswerRevealed || isTF ? 'disabled' : ''} title="${isTF ? 'Không áp dụng 50:50 cho câu Đúng/Sai' : 'Loại bỏ ngẫu nhiên 2 phương án sai'}">
            🎲 50:50 ${lifelinesState.used5050 ? '✓' : ''}
          </button>
          <button id="btnLifelineFriend" class="btn-lifeline ${lifelinesState.usedFriend ? 'used' : ''}" onclick="useLifelineCallFriend()" ${lifelinesState.usedFriend || isAnswerRevealed ? 'disabled' : ''} title="Bốc thăm ngẫu nhiên 1 bạn trong lớp hỗ trợ">
            🤝 Gọi bạn trợ giúp ${lifelinesState.usedFriend ? '✓' : ''}
          </button>
        </div>
        ${lifelinesState.friendName ? `
          <div class="quiz-friend-badge animate-pop">
            🌟 Bạn hỗ trợ: <strong>${lifelinesState.friendName}</strong>
          </div>
        ` : ''}
      </div>

      <div class="quiz-question-title">
        ${q.question}
      </div>

      ${q.image ? `
        <div class="quiz-arena-image-wrap">
          <img src="${q.image}" alt="Hình ảnh minh họa" class="quiz-arena-image" onclick="openQuizImageLightbox('${q.image}')" title="🔍 Bấm để phóng to ảnh">
        </div>
      ` : ''}

      <div class="quiz-options-grid ${isTF ? 'tf-mode' : ''}">
        ${optionsHtml}
      </div>

      <div class="quiz-action-bar">
        <button id="btnRevealQuizAnswer" class="btn-quiz-reveal ${isAnswerRevealed ? 'revealed' : ''}" onclick="toggleRevealAnswer()">
          ${isAnswerRevealed ? '🙈 Ẩn đáp án' : '👁️ Mở đáp án chính xác'}
        </button>
        ${isAnswerRevealed && q.explanation ? `<div class="quiz-explanation-box">💡 <strong>Giải thích:</strong> ${q.explanation}</div>` : ''}
      </div>
    </div>
  `;

  triggerMathRendering(container);
  broadcastQuizIfAvailable();
}

// Bật/tắt lật mở đáp án
function toggleRevealAnswer() {
  isAnswerRevealed = !isAnswerRevealed;
  if (isAnswerRevealed) {
    if (typeof window.stopTimer === 'function') {
      window.stopTimer();
    }
    if (window.sound) {
      window.sound.init();
      window.sound.playVictory();
    }
    if (typeof triggerCelebrationConfetti === 'function') {
      triggerCelebrationConfetti();
    }
  }
  renderQuizArenaCard();
}

// Chọn hoặc kiểm tra đáp án khi click vào thẻ lựa chọn
function selectQuizOption(idx) {
  if (isAnswerRevealed) return;
  if (lifelinesState.hiddenIndices.includes(idx)) return; // Bỏ qua nếu phương án đã bị loại bởi 50:50

  const q = getCurrentQuestion();
  if (!q) return;

  isAnswerRevealed = true;
  if (idx === q.correct) {
    if (window.sound) {
      window.sound.init();
      window.sound.playVictory();
    }
    if (typeof showToast === 'function') {
      showToast('🎉 Chính xác tuyệt đối! Xin chúc mừng!', 'success');
    }
    if (typeof triggerCelebrationConfetti === 'function') {
      triggerCelebrationConfetti();
    }
  } else {
    if (window.sound) {
      window.sound.init();
      window.sound.playTimerBuzzer();
    }
    if (typeof showToast === 'function') {
      showToast('❌ Rất tiếc, câu trả lời chưa chính xác!', 'warning');
    }
  }
  renderQuizArenaCard();
}

// Chuyển sang câu kế tiếp (tự động làm mới quyền trợ giúp theo Socratic Gate)
function nextQuizQuestion() {
  if (currentQuestionIndex < quizBank.length - 1) {
    currentQuestionIndex++;
    isAnswerRevealed = false;
    resetLifelinesState();
    renderQuizArenaCard();
  }
}

// Quay về câu trước
function prevQuizQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    isAnswerRevealed = false;
    resetLifelinesState();
    renderQuizArenaCard();
  }
}

// --- LOGIC CÁC QUYỀN TRỢ GIÚP (LIFELINES) ---
function useLifeline5050() {
  if (lifelinesState.used5050 || isAnswerRevealed) return;
  const q = getCurrentQuestion();
  if (!q) return;

  const wrongIndices = [];
  q.options.forEach((_, idx) => {
    if (idx !== q.correct) wrongIndices.push(idx);
  });

  // Xáo trộn ngẫu nhiên và chọn 2 phương án sai để loại bỏ
  for (let i = wrongIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
  }

  lifelinesState.hiddenIndices = wrongIndices.slice(0, 2);
  lifelinesState.used5050 = true;

  if (window.sound) {
    window.sound.init();
    window.sound.playTick(450, 0.4);
  }

  if (typeof showToast === 'function') {
    showToast('🎲 Trợ giúp 50:50: Đã loại bỏ 2 phương án sai!', 'info');
  }

  renderQuizArenaCard();
}

function useLifelineCallFriend() {
  if (lifelinesState.usedFriend || isAnswerRevealed) return;

  const currentWinner = (window.state && window.state.lastResult && window.state.lastResult[0]) || '';
  
  // Ưu tiên danh sách học sinh "Chờ gọi" theo đúng thống nhất Socratic Gate
  let candidateStudents = typeof getAvailableStudents === 'function' ? getAvailableStudents() : [];
  candidateStudents = candidateStudents.filter(s => s !== currentWinner);

  // Nếu danh sách chờ gọi trống, lấy từ toàn bộ lớp
  if (candidateStudents.length === 0 && typeof getAllStudents === 'function') {
    candidateStudents = getAllStudents().filter(s => s !== currentWinner);
  }

  if (candidateStudents.length === 0) {
    if (typeof showToast === 'function') {
      showToast('Không có bạn học sinh nào khả dụng trong lớp để gọi trợ giúp!', 'warning');
    }
    return;
  }

  const randomFriend = candidateStudents[Math.floor(Math.random() * candidateStudents.length)];
  lifelinesState.usedFriend = true;
  lifelinesState.friendName = randomFriend;

  if (window.sound) {
    window.sound.init();
    window.sound.playVictory();
  }

  if (typeof triggerCelebrationConfetti === 'function') {
    triggerCelebrationConfetti();
  }

  if (typeof showToast === 'function') {
    showToast(`🤝 Xin mời bạn "${randomFriend}" đứng lên hỗ trợ đồng đội!`, 'success');
  }

  renderQuizArenaCard();
}

// Chuyển đổi chế độ hoạt động lớn (Activity / Game Mode Hub)
function switchGameMode(mode) {
  if (window.state) {
    window.state.gameMode = mode;
    if (mode === 'quiz') window.state.currentGameId = 'quiz';
    else if (mode === 'seating') window.state.currentGameId = 'seating';
    else if (mode === 'minigames') window.state.currentGameId = 'bonus';
    else if (mode === 'classic') window.state.currentGameId = window.state.viewMode === 'wheel' ? 'wheel' : 'slot';
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  }

  const btnClassic = document.getElementById('btnModeClassicSpin');
  const btnQuiz = document.getElementById('btnModeQuizArena');
  const btnSeating = document.getElementById('btnModeSeatingChart');
  const btnMini = document.getElementById('btnModeMinigames');

  const subbarClassic = document.getElementById('subbarClassic');
  const subbarQuiz = document.getElementById('subbarQuiz');
  const subbarSeating = document.getElementById('subbarSeating');
  const subbarMini = document.getElementById('subbarMinigames');

  const arenaContainer = document.getElementById('arenaContainer');
  const quizSection = document.getElementById('quizArenaSection');
  const stagePicker = document.getElementById('stagePickerSection');
  const minigamesSection = document.getElementById('minigamesHubSection');
  const seatingSection = document.getElementById('seatingArenaSection');

  // Gỡ bỏ class active trên tất cả tab hub
  [btnClassic, btnQuiz, btnSeating, btnMini].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  if (mode !== 'classic') {
    document.body.classList.remove('wheel-spotlight-dimmed');
  }

  if (mode === 'quiz') {
    if (btnQuiz) btnQuiz.classList.add('active');
    if (subbarClassic) subbarClassic.style.display = 'none';
    if (subbarQuiz) subbarQuiz.style.display = 'flex';
    if (subbarSeating) subbarSeating.style.display = 'none';
    if (subbarMini) subbarMini.style.display = 'none';

    if (arenaContainer) {
      arenaContainer.classList.add('dual-mode');
      arenaContainer.classList.remove('classic-mode', 'minigames-mode', 'seating-mode');
    }
    if (quizSection) quizSection.style.display = 'block';
    if (stagePicker) stagePicker.style.display = 'flex';
    if (minigamesSection) minigamesSection.style.display = 'none';
    if (seatingSection) seatingSection.style.display = 'none';

    isQuizModeActive = true;
    renderQuizArenaCard();

    // Đồng bộ lại kích thước vẽ vòng quay nếu đang ở chế độ bánh xe
    if (window.state && window.state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') {
      setTimeout(drawLuckyWheel, 50);
    }

    if (typeof showToast === 'function') {
      showToast('🏆 Chế độ Đấu trường: Câu hỏi & Bốc thăm hiển thị song song!', 'info');
    }
  } else if (mode === 'seating') {
    if (btnSeating) btnSeating.classList.add('active');
    if (subbarClassic) subbarClassic.style.display = 'none';
    if (subbarQuiz) subbarQuiz.style.display = 'none';
    if (subbarSeating) subbarSeating.style.display = 'none';
    if (subbarMini) subbarMini.style.display = 'none';

    if (arenaContainer) {
      arenaContainer.classList.add('seating-mode');
      arenaContainer.classList.remove('dual-mode', 'classic-mode', 'minigames-mode');
    }
    if (quizSection) quizSection.style.display = 'none';
    if (stagePicker) stagePicker.style.display = 'none';
    if (minigamesSection) minigamesSection.style.display = 'none';
    if (seatingSection) seatingSection.style.display = 'block';

    isQuizModeActive = false;
    if (window.SeatingChartModule && typeof window.SeatingChartModule.render === 'function') {
      window.SeatingChartModule.render();
    }

    if (typeof showToast === 'function') {
      showToast('🪑 Chế độ Sơ đồ lớp học: Kéo thả và gọi tên học sinh theo chỗ ngồi!', 'info');
    }
  } else if (mode === 'minigames') {
    if (btnMini) btnMini.classList.add('active');
    if (subbarClassic) subbarClassic.style.display = 'none';
    if (subbarQuiz) subbarQuiz.style.display = 'none';
    if (subbarSeating) subbarSeating.style.display = 'none';
    if (subbarMini) subbarMini.style.display = 'flex';

    if (arenaContainer) {
      arenaContainer.classList.add('minigames-mode');
      arenaContainer.classList.remove('dual-mode', 'classic-mode', 'seating-mode');
    }
    if (quizSection) quizSection.style.display = 'none';
    if (stagePicker) stagePicker.style.display = 'none';
    if (minigamesSection) minigamesSection.style.display = 'block';
    if (seatingSection) seatingSection.style.display = 'none';

    isQuizModeActive = false;
  } else {
    // Mode 'classic' (Mặc định: Chỉ gọi tên)
    if (btnClassic) btnClassic.classList.add('active');
    if (subbarClassic) subbarClassic.style.display = 'flex';
    if (subbarQuiz) subbarQuiz.style.display = 'none';
    if (subbarSeating) subbarSeating.style.display = 'none';
    if (subbarMini) subbarMini.style.display = 'none';

    if (arenaContainer) {
      arenaContainer.classList.add('classic-mode');
      arenaContainer.classList.remove('dual-mode', 'minigames-mode', 'seating-mode');
    }
    if (quizSection) quizSection.style.display = 'none';
    if (stagePicker) stagePicker.style.display = 'flex';
    if (minigamesSection) minigamesSection.style.display = 'none';
    if (seatingSection) seatingSection.style.display = 'none';

    isQuizModeActive = false;
    if (typeof renderDefaultStage === 'function') renderDefaultStage();
    if (window.state && window.state.viewMode === 'wheel' && typeof drawLuckyWheel === 'function') {
      setTimeout(drawLuckyWheel, 50);
    }
  }

  // Đồng bộ trạng thái active trên Cột Trái Kho Trò Chơi
  if (typeof syncGameNavSidebar === 'function') {
    syncGameNavSidebar(mode, window.state ? window.state.viewMode : 'wheel');
  }

  // Luôn đảm bảo sân khấu cuộn về đỉnh khi đổi trò chơi
  const mainStage = document.querySelector('.main-stage');
  if (mainStage) {
    mainStage.scrollTop = 0;
  }
}

// Bật/tắt ẩn hiện câu hỏi khi đang ở chế độ Đấu trường
function toggleQuestionVisibility() {
  const quizSection = document.getElementById('quizArenaSection');
  const arenaContainer = document.getElementById('arenaContainer');
  const toggleBtn = document.getElementById('btnToggleQuestionVisibility');

  const isVisible = quizSection && quizSection.style.display !== 'none';
  if (isVisible) {
    if (quizSection) quizSection.style.display = 'none';
    if (arenaContainer) arenaContainer.classList.remove('dual-mode');
    if (toggleBtn) toggleBtn.innerHTML = '👁️ Hiện câu hỏi song song';
    if (typeof showToast === 'function') showToast('Đã tạm ẩn câu hỏi, mở rộng sân khấu bốc thăm!', 'info');
  } else {
    if (quizSection) quizSection.style.display = 'block';
    if (arenaContainer) arenaContainer.classList.add('dual-mode');
    if (toggleBtn) toggleBtn.innerHTML = '🙈 Tạm ẩn câu hỏi';
    renderQuizArenaCard();
    if (typeof showToast === 'function') showToast('Đã hiển thị câu hỏi song song với bốc thăm!', 'info');
  }
}

// Bật/tắt chế độ Đấu trường Quiz trên giao diện (Tương thích nút cũ)
function toggleQuizMode() {
  const currentMode = (window.state && window.state.gameMode) || (isQuizModeActive ? 'quiz' : 'classic');
  if (currentMode === 'quiz') {
    switchGameMode('classic');
  } else {
    switchGameMode('quiz');
  }
}

// --- BỘ ĐẾM THỜI GIAN THEO ĐỘ KHÓ & XÁO TRỘN CÂU HỎI ---
function getQuestionTimeLimit(q) {
  if (!q) return 15;
  if (q.timeLimit && q.timeLimit !== 'auto') {
    const val = parseInt(q.timeLimit, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  const diff = q.difficulty || 'easy';
  if (diff === 'hard') return 60;
  if (diff === 'medium') return 30;
  return 15;
}

function triggerQuestionTimer(seconds) {
  if (typeof window.setTimerDuration === 'function') {
    window.setTimerDuration(seconds);
  }
  if (typeof window.toggleTimer === 'function') {
    window.toggleTimer();
  }
}

// Xáo trộn ngẫu nhiên thứ tự các câu hỏi (Shuffle Questions)
function shuffleQuizQuestions() {
  if (!quizBank || quizBank.length <= 1) {
    if (typeof showToast === 'function') showToast('Cần ít nhất 2 câu hỏi để xáo trộn!', 'warning');
    return;
  }
  // Thuật toán Fisher-Yates shuffle chuẩn xác
  for (let i = quizBank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizBank[i], quizBank[j]] = [quizBank[j], quizBank[i]];
  }
  currentQuestionIndex = 0;
  isAnswerRevealed = false;
  resetLifelinesState();
  saveQuizBankToStorage();
  renderQuizArenaCard();
  renderQuizManagerList();
  if (typeof showToast === 'function') {
    showToast(`🔀 Đã xáo trộn ngẫu nhiên toàn bộ ${quizBank.length} câu hỏi!`, 'success');
  }
}

// Thay đổi dạng câu hỏi (4 Lựa chọn vs Đúng / Sai)
function handleQuizTypeChange(type) {
  const isTF = (type === 'tf');
  const optItem2 = document.getElementById('quizEditOptItem2');
  const optItem3 = document.getElementById('quizEditOptItem3');
  const title = document.getElementById('quizEditOptionsGroupTitle');
  const tag0 = document.getElementById('quizOptTag0');
  const tag1 = document.getElementById('quizOptTag1');
  const opt0 = document.getElementById('quizEditOpt0');
  const opt1 = document.getElementById('quizEditOpt1');

  if (isTF) {
    if (title) title.innerHTML = '🔘 2 Lựa chọn Đúng / Sai (Tích chọn tròn để đặt ĐÁP ÁN ĐÚNG): <span class="req">*</span>';
    if (tag0) tag0.innerHTML = '✓';
    if (tag1) tag1.innerHTML = '✕';
    if (opt0 && (!opt0.value || opt0.value === 'Phương án A')) opt0.value = 'Đúng';
    if (opt1 && (!opt1.value || opt1.value === 'Phương án B')) opt1.value = 'Sai';
    if (optItem2) optItem2.style.display = 'none';
    if (optItem3) optItem3.style.display = 'none';
  } else {
    if (title) title.innerHTML = '🔘 4 Phương án trả lời (Tích chọn tròn để đặt ĐÁP ÁN ĐÚNG): <span class="req">*</span>';
    if (tag0) tag0.innerHTML = 'A';
    if (tag1) tag1.innerHTML = 'B';
    if (optItem2) optItem2.style.display = 'flex';
    if (optItem3) optItem3.style.display = 'flex';
  }
  updateQuizLiveMathPreview();
}

function handleQuizDifficultyChange(diff) {
  updateQuizLiveMathPreview();
}

// Xem trước công thức Toán/Lý/Hóa KaTeX trực tiếp khi đang gõ (Live Math Preview)
function updateQuizLiveMathPreview() {
  const qText = (document.getElementById('quizEditQuestionText')?.value || '').trim();
  const previewBox = document.getElementById('quizLiveMathPreviewBox');
  const previewContent = document.getElementById('quizLiveMathPreviewContent');
  if (!previewBox || !previewContent) return;

  const type = document.getElementById('quizEditQuestionType')?.value || 'mc4';
  const opt0 = (document.getElementById('quizEditOpt0')?.value || '').trim();
  const opt1 = (document.getElementById('quizEditOpt1')?.value || '').trim();
  const opt2 = (document.getElementById('quizEditOpt2')?.value || '').trim();
  const opt3 = (document.getElementById('quizEditOpt3')?.value || '').trim();
  const expl = (document.getElementById('quizEditExplanation')?.value || '').trim();

  const allText = `${qText} ${opt0} ${opt1} ${opt2} ${opt3} ${expl}`;

  if (allText.includes('$') || qText.length > 0) {
    previewBox.style.display = 'block';

    let html = `<div style="margin-bottom: 6px;"><strong>Đề bài:</strong> ${qText || '<em style="color:#94a3b8;">(Chưa có nội dung)</em>'}</div>`;

    if (type === 'tf') {
      html += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.88rem;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:6px 10px; border-radius:6px; font-weight:700;">✅ ${opt0 || 'Đúng'}</div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:6px 10px; border-radius:6px; font-weight:700;">❌ ${opt1 || 'Sai'}</div>
        </div>
      `;
    } else {
      html += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.84rem;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:5px 8px; border-radius:6px;"><strong>A.</strong> ${opt0 || '...'}</div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:5px 8px; border-radius:6px;"><strong>B.</strong> ${opt1 || '...'}</div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:5px 8px; border-radius:6px;"><strong>C.</strong> ${opt2 || '...'}</div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:5px 8px; border-radius:6px;"><strong>D.</strong> ${opt3 || '...'}</div>
        </div>
      `;
    }

    if (expl) {
      html += `<div style="margin-top: 6px; font-size: 0.8rem; color: #475569;">💡 <strong>Giải thích:</strong> ${expl}</div>`;
    }

    previewContent.innerHTML = html;
    triggerMathRendering(previewContent);
  } else {
    previewBox.style.display = 'none';
  }
}

// --- QUẢN LÝ NGÂN HÀNG CÂU HỎI (QUIZ MANAGER MODAL) ---
let quizManagerSearchQuery = '';
let quizDifficultyFilter = 'all'; // 'all' | 'easy' | 'medium' | 'hard'
let currentEditImageBase64 = '';

function handleQuizSearch(query) {
  quizManagerSearchQuery = (query || '').trim().toLowerCase();
  renderQuizManagerList();
}

function setQuizDifficultyFilter(filter) {
  quizDifficultyFilter = filter || 'all';
  renderQuizManagerList();
}

function clearAllQuizzes() {
  if (!quizBank || quizBank.length === 0) {
    if (typeof showToast === 'function') showToast('Ngân hàng câu hỏi đang trống!', 'warning');
    return;
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${quizBank.length} câu hỏi trong ngân hàng không?`)) {
    return;
  }
  quizBank = [];
  currentQuestionIndex = 0;
  saveQuizBankToStorage();
  resetLifelinesState();
  isAnswerRevealed = false;
  renderQuizManagerList();
  renderQuizArenaCard();
  if (typeof showToast === 'function') {
    showToast('🗑️ Đã xóa toàn bộ câu hỏi trong ngân hàng!', 'info');
  }
}

function openQuizManagerModal() {
  const modal = document.getElementById('quizManagerModal');
  if (!modal) return;
  quizManagerSearchQuery = '';
  quizDifficultyFilter = 'all';
  const searchInput = document.getElementById('quizSearchInput');
  if (searchInput) searchInput.value = '';
  renderQuizManagerList();
  modal.classList.add('open');
}

function closeQuizManagerModal() {
  const modal = document.getElementById('quizManagerModal');
  if (modal) modal.classList.remove('open');
}

// Vẽ danh sách câu hỏi trong modal quản lý
function renderQuizManagerList() {
  const container = document.getElementById('quizQuestionsList');
  const countBadge = document.getElementById('quizTotalCountBadge');
  const diffBar = document.getElementById('quizDifficultyFilterBar');

  if (countBadge) countBadge.textContent = `${quizBank.length} câu hỏi`;

  // Render thanh thống kê ma trận độ khó & bộ lọc
  if (diffBar) {
    const totalCount = quizBank.length;
    const easyCount = quizBank.filter(q => (q.difficulty || 'easy') === 'easy').length;
    const medCount = quizBank.filter(q => q.difficulty === 'medium').length;
    const hardCount = quizBank.filter(q => q.difficulty === 'hard').length;

    diffBar.innerHTML = `
      <span class="diff-chip diff-chip-all ${quizDifficultyFilter === 'all' ? 'active' : ''}" onclick="setQuizDifficultyFilter('all')" title="Xem toàn bộ câu hỏi">
        Tất cả (${totalCount})
      </span>
      <span class="diff-chip diff-chip-easy ${quizDifficultyFilter === 'easy' ? 'active' : ''}" onclick="setQuizDifficultyFilter('easy')" title="Lọc các câu mức Nhận biết">
        🟢 Nhận biết (${easyCount})
      </span>
      <span class="diff-chip diff-chip-medium ${quizDifficultyFilter === 'medium' ? 'active' : ''}" onclick="setQuizDifficultyFilter('medium')" title="Lọc các câu mức Thông hiểu">
        🟡 Thông hiểu (${medCount})
      </span>
      <span class="diff-chip diff-chip-hard ${quizDifficultyFilter === 'hard' ? 'active' : ''}" onclick="setQuizDifficultyFilter('hard')" title="Lọc các câu mức Vận dụng cao">
        🔴 Vận dụng cao (${hardCount})
      </span>
    `;
  }

  if (!container) return;

  if (quizBank.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8; font-weight: 600;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
        Chưa có câu hỏi nào trong ngân hàng.<br>Hãy bấm <strong>"Thêm 1 câu"</strong>, nạp 10 câu mẫu hoặc dán đề thi ở cột bên trái!
      </div>
    `;
    return;
  }

  // Lọc theo cả từ khóa tìm kiếm và mức độ nhận thức (độ khó)
  const filteredList = quizBank.map((q, origIdx) => ({ q, origIdx })).filter(item => {
    const diff = item.q.difficulty || 'easy';
    if (quizDifficultyFilter !== 'all' && diff !== quizDifficultyFilter) {
      return false;
    }
    if (quizManagerSearchQuery) {
      const qText = (item.q.question || '').toLowerCase();
      const optsText = (item.q.options || []).join(' ').toLowerCase();
      return qText.includes(quizManagerSearchQuery) || optsText.includes(quizManagerSearchQuery);
    }
    return true;
  });

  if (filteredList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8; font-weight: 600;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
        Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
      </div>
    `;
    return;
  }

  const optionLetters = ['A', 'B', 'C', 'D'];
  try {
    container.innerHTML = filteredList.map(({ q, origIdx }) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const isTF = q.type === 'tf' || opts.length === 2;
      const timeLimit = getQuestionTimeLimit(q);
      const itemOptLetters = isTF ? ['✓', '✕'] : optionLetters;
      return `
        <div class="quiz-manager-item" data-id="${q.id || origIdx}">
          <div class="quiz-manager-item-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="quiz-manager-item-num">Câu ${origIdx + 1}</span>
              <span class="quiz-diff-badge diff-${q.difficulty || 'easy'}">${getDifficultyLabel(q.difficulty)}</span>
              ${isTF ? '<span class="quiz-type-badge">⚖️ Đúng/Sai</span>' : ''}
              <span style="font-size: 0.74rem; color: #64748b; font-weight: 700;">⏱️ ${timeLimit}s</span>
            </div>
            <div class="quiz-item-actions">
              <button class="btn-quiz-item-edit" onclick="openEditQuestionModal(${origIdx})" title="Chỉnh sửa câu hỏi này">✏️ Sửa</button>
              <button class="btn-quiz-item-delete" onclick="deleteQuizQuestion(${origIdx})" title="Xóa câu hỏi này">✕</button>
            </div>
          </div>
          <div class="quiz-manager-item-q">${q.question || 'Chưa có nội dung câu hỏi'}</div>
          ${q.image ? `
            <div class="quiz-item-image-row">
              <img src="${q.image}" alt="Ảnh câu hỏi" class="quiz-item-thumb" onclick="openQuizImageLightbox('${q.image}')" title="🔍 Bấm để xem ảnh lớn">
              <span style="font-size: 0.76rem; color: #64748b; font-weight: 600;">(Đính kèm ảnh minh họa)</span>
            </div>
          ` : ''}
          <div class="quiz-manager-item-options">
            ${opts.map((opt, oIdx) => `
              <span class="quiz-manager-opt-pill ${oIdx === q.correct ? 'correct' : ''}">
                ${itemOptLetters[oIdx] || oIdx + 1}. ${opt} ${oIdx === q.correct ? '★' : ''}
              </span>
            `).join('')}
          </div>
          ${q.explanation ? `
            <div style="margin-top: 8px; font-size: 0.78rem; color: #64748b; font-style: italic;">
              💡 <strong>Giải thích:</strong> ${q.explanation}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi khi render quiz manager list:', err);
    container.innerHTML = `<div style="color: #ef4444; padding: 20px;">Lỗi hiển thị câu hỏi: ${err.message}</div>`;
  }

  triggerMathRendering(container);
}

// Xóa 1 câu hỏi
function deleteQuizQuestion(index) {
  if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi số ${index + 1}?`)) return;
  quizBank.splice(index, 1);
  saveQuizBankToStorage();
  if (currentQuestionIndex >= quizBank.length) {
    currentQuestionIndex = Math.max(0, quizBank.length - 1);
  }
  isAnswerRevealed = false;
  renderQuizManagerList();
  renderQuizArenaCard();
  if (typeof showToast === 'function') {
    showToast('Đã xóa câu hỏi thành công.', 'info');
  }
}

// Mở Modal Tạo Mới Câu Hỏi Trắc Nghiệm
function openCreateQuestionModal() {
  const modal = document.getElementById('quizEditQuestionModal');
  if (!modal) return;

  const titleElem = document.getElementById('quizEditModalTitle');
  if (titleElem) titleElem.innerHTML = '➕ Thêm Câu Hỏi Trắc Nghiệm Mới';

  document.getElementById('quizEditQuestionIndex').value = '-1';
  document.getElementById('quizEditQuestionType').value = 'mc4';
  document.getElementById('quizEditDifficulty').value = 'easy';
  document.getElementById('quizEditTimeLimit').value = 'auto';
  document.getElementById('quizEditQuestionText').value = '';
  document.getElementById('quizEditImageUrl').value = '';
  currentEditImageBase64 = '';

  const prevWrap = document.getElementById('quizEditImagePreviewWrap');
  if (prevWrap) prevWrap.style.display = 'none';

  for (let i = 0; i < 4; i++) {
    const optInput = document.getElementById(`quizEditOpt${i}`);
    if (optInput) optInput.value = '';
  }
  const radio0 = document.getElementById('quizOptRadio0');
  if (radio0) radio0.checked = true;

  const explInput = document.getElementById('quizEditExplanation');
  if (explInput) explInput.value = '';

  handleQuizTypeChange('mc4');
  updateQuizLiveMathPreview();

  modal.classList.add('open');
}

// Mở Modal Chỉnh Sửa Câu Hỏi Hiện Có (Nhấn nút ✏️)
function openEditQuestionModal(index) {
  const modal = document.getElementById('quizEditQuestionModal');
  if (!modal || index < 0 || index >= quizBank.length) return;

  const q = quizBank[index];
  const titleElem = document.getElementById('quizEditModalTitle');
  if (titleElem) titleElem.innerHTML = `✏️ Chỉnh Sửa Câu Hỏi Số ${index + 1}`;

  document.getElementById('quizEditQuestionIndex').value = index;
  const qType = q.type || ((q.options && q.options.length === 2) ? 'tf' : 'mc4');
  document.getElementById('quizEditQuestionType').value = qType;
  document.getElementById('quizEditDifficulty').value = q.difficulty || 'easy';
  document.getElementById('quizEditTimeLimit').value = q.timeLimit || 'auto';
  document.getElementById('quizEditQuestionText').value = q.question || '';

  const imgUrlInput = document.getElementById('quizEditImageUrl');
  const prevWrap = document.getElementById('quizEditImagePreviewWrap');
  const prevImg = document.getElementById('quizEditImagePreviewImg');

  if (q.image) {
    if (imgUrlInput) imgUrlInput.value = q.image.startsWith('data:') ? '' : q.image;
    currentEditImageBase64 = q.image;
    if (prevImg) prevImg.src = q.image;
    if (prevWrap) prevWrap.style.display = 'flex';
  } else {
    if (imgUrlInput) imgUrlInput.value = '';
    currentEditImageBase64 = '';
    if (prevWrap) prevWrap.style.display = 'none';
  }

  for (let i = 0; i < 4; i++) {
    const optInput = document.getElementById(`quizEditOpt${i}`);
    if (optInput) optInput.value = (q.options && q.options[i]) || '';
  }

  const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
  const radio = document.getElementById(`quizOptRadio${correctIdx}`);
  if (radio) radio.checked = true;

  const explInput = document.getElementById('quizEditExplanation');
  if (explInput) explInput.value = q.explanation || '';

  handleQuizTypeChange(qType);
  updateQuizLiveMathPreview();

  modal.classList.add('open');
}

// Đóng Modal Chỉnh Sửa
function closeQuizEditModal() {
  const modal = document.getElementById('quizEditQuestionModal');
  if (modal) modal.classList.remove('open');
}

// Thay đổi link ảnh trực tuyến
function handleQuizEditImageUrlChange(url) {
  const prevWrap = document.getElementById('quizEditImagePreviewWrap');
  const prevImg = document.getElementById('quizEditImagePreviewImg');
  const trimmed = (url || '').trim();

  if (trimmed) {
    currentEditImageBase64 = trimmed;
    if (prevImg) prevImg.src = trimmed;
    if (prevWrap) prevWrap.style.display = 'flex';
  } else {
    currentEditImageBase64 = '';
    if (prevWrap) prevWrap.style.display = 'none';
  }
}

// Tải ảnh từ máy tính & tự động nén nhẹ (Canvas resize dưới 60KB)
function handleQuizEditImageUpload(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    if (typeof showToast === 'function') showToast('Vui lòng chọn tệp hình ảnh hợp lệ!', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      currentEditImageBase64 = compressedDataUrl;

      const prevWrap = document.getElementById('quizEditImagePreviewWrap');
      const prevImg = document.getElementById('quizEditImagePreviewImg');
      const imgUrlInput = document.getElementById('quizEditImageUrl');

      if (imgUrlInput) imgUrlInput.value = '';
      if (prevImg) prevImg.src = compressedDataUrl;
      if (prevWrap) prevWrap.style.display = 'flex';

      if (typeof showToast === 'function') {
        showToast('🖼️ Đã nén và đính kèm ảnh thành công!', 'success');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

// Xóa hình ảnh đính kèm trong câu hỏi
function clearQuizEditImage() {
  currentEditImageBase64 = '';
  const imgUrlInput = document.getElementById('quizEditImageUrl');
  const fileInput = document.getElementById('quizEditImageFileInput');
  const prevWrap = document.getElementById('quizEditImagePreviewWrap');
  if (imgUrlInput) imgUrlInput.value = '';
  if (fileInput) fileInput.value = '';
  if (prevWrap) prevWrap.style.display = 'none';
  if (typeof showToast === 'function') showToast('Đã gỡ bỏ hình ảnh đính kèm.', 'info');
}

// Lưu câu hỏi từ Modal (Thêm mới hoặc Cập nhật)
function saveQuizEditQuestion() {
  const qText = (document.getElementById('quizEditQuestionText').value || '').trim();
  if (!qText) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
    return;
  }

  const qType = document.getElementById('quizEditQuestionType')?.value || 'mc4';
  const qTimeLimit = document.getElementById('quizEditTimeLimit')?.value || 'auto';
  const difficulty = document.getElementById('quizEditDifficulty')?.value || 'easy';
  const explanation = (document.getElementById('quizEditExplanation')?.value || '').trim();
  const image = currentEditImageBase64 || (document.getElementById('quizEditImageUrl')?.value || '').trim();

  let options = [];
  let correctIdx = 0;

  if (qType === 'tf') {
    const opt0 = (document.getElementById('quizEditOpt0')?.value || '').trim() || 'Đúng';
    const opt1 = (document.getElementById('quizEditOpt1')?.value || '').trim() || 'Sai';
    options = [opt0, opt1];

    const radio1 = document.getElementById('quizOptRadio1');
    if (radio1 && radio1.checked) {
      correctIdx = 1;
    } else {
      correctIdx = 0;
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const val = (document.getElementById(`quizEditOpt${i}`)?.value || '').trim();
      options.push(val || `Phương án ${['A','B','C','D'][i]}`);
    }

    for (let i = 0; i < 4; i++) {
      const radio = document.getElementById(`quizOptRadio${i}`);
      if (radio && radio.checked) {
        correctIdx = i;
        break;
      }
    }
  }

  const editIndex = parseInt(document.getElementById('quizEditQuestionIndex').value, 10);

  if (editIndex >= 0 && editIndex < quizBank.length) {
    quizBank[editIndex] = {
      ...quizBank[editIndex],
      question: qText,
      options: options,
      correct: correctIdx,
      difficulty: difficulty,
      type: qType,
      timeLimit: qTimeLimit,
      explanation: explanation,
      image: image || null
    };
    if (typeof showToast === 'function') showToast(`✅ Đã cập nhật câu hỏi số ${editIndex + 1}!`, 'success');
  } else {
    quizBank.push({
      id: 'q_' + Date.now(),
      question: qText,
      options: options,
      correct: correctIdx,
      difficulty: difficulty,
      type: qType,
      timeLimit: qTimeLimit,
      explanation: explanation,
      image: image || null
    });
    if (typeof showToast === 'function') showToast(`✅ Đã thêm câu hỏi mới vào ngân hàng!`, 'success');
  }

  saveQuizBankToStorage();
  renderQuizManagerList();
  renderQuizArenaCard();
  closeQuizEditModal();
}

// Phóng to ảnh (Lightbox)
function openQuizImageLightbox(src) {
  if (!src) return;
  const modal = document.getElementById('quizImageLightboxModal');
  const img = document.getElementById('quizLightboxImg');
  if (img) img.src = src;
  if (modal) modal.classList.add('open');
}

function closeQuizImageLightbox() {
  const modal = document.getElementById('quizImageLightboxModal');
  if (modal) modal.classList.remove('open');
}

// Thêm 1 câu hỏi thủ công (chuyển sang mở modal chuẩn)
function addNewSingleQuestion() {
  openCreateQuestionModal();
}

// Phân tích văn bản câu hỏi dạng Text/Word (Parser thông minh nâng cao)
function parseRawQuizText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Chuẩn hóa ký tự: thay thế non-breaking space, chuẩn hóa xuống dòng
  const cleanText = rawText
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQ = null;

  // Regex kiểm tra câu hỏi bắt đầu: "Câu 1:", "Câu 1.", "Câu 1 ", "1.", "1)", "1:", "Bài 1:", "Question 1:", "Q1:"
  const qStartRegex = /^(?:câu|cau|bài|bai|question|q)\s*(\d+)[\s:.)\-\]]*(.*)/i;
  const numStartRegex = /^(\d+)[\s:.)\-\]](.*)/;

  function finalizeCurrentQuestion() {
    if (!currentQ) return;
    if (currentQ.options && currentQ.options.length >= 2) {
      if (currentQ.options.length === 2) {
        currentQ.type = 'tf';
      } else {
        currentQ.type = 'mc4';
      }
      // Đảm bảo correct hợp lệ trong khoảng options
      if (typeof currentQ.correct !== 'number' || currentQ.correct < 0 || currentQ.correct >= currentQ.options.length) {
        currentQ.correct = 0;
      }
      questions.push(currentQ);
    }
  }

  // Tra cứu bảng đáp án cuối bài (nếu có): e.g. "Bảng đáp án: 1.A 2.B 3.C"
  const answerKeyMap = {};
  let inAnswerKeySection = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Phát hiện bắt đầu khu vực bảng đáp án tổng hợp ở cuối đề
    if (/^(?:bảng\s*đáp\s*án|bang\s*dap\s*an|đáp\s*án\s*chi\s*tiết|key\s*sheet|answer\s*key)/i.test(line)) {
      inAnswerKeySection = true;
      finalizeCurrentQuestion();
      currentQ = null;
      continue;
    }

    if (inAnswerKeySection) {
      // Quét các cặp STT - Ký tự đáp án: "1.A", "2-B", "3:C", "4D", "1. A"
      const keyRegex = /(?:^|\s|,|;)(\d+)[\s.:\-\)]*([A-D])(?:\b|\s|,|;|$)/gi;
      let km;
      while ((km = keyRegex.exec(line)) !== null) {
        const qIdx = parseInt(km[1], 10);
        const ltr = km[2].toUpperCase();
        const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        if (map[ltr] !== undefined) {
          answerKeyMap[qIdx] = map[ltr];
        }
      }
      continue;
    }

    // 1. Kiểm tra dòng bắt đầu câu hỏi mới
    let qNum = null;
    let qContent = null;

    const matchQ = line.match(qStartRegex);
    if (matchQ) {
      qNum = parseInt(matchQ[1], 10);
      qContent = matchQ[2].trim();
    } else {
      const matchNum = line.match(numStartRegex);
      if (matchNum) {
        qNum = parseInt(matchNum[1], 10);
        qContent = matchNum[2].trim();
      }
    }

    if (qNum !== null) {
      finalizeCurrentQuestion();
      currentQ = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        question: qContent || `Câu hỏi ${qNum}`,
        options: [],
        correct: -1, // -1 nghĩa là chưa phát hiện đáp án đúng
        difficulty: 'easy',
        explanation: '',
        image: null,
        detectedNum: qNum
      };

      // Tự động kiểm tra xem trong nội dung câu hỏi có tag mức độ không: [Nhận biết], [Thông hiểu], [Vận dụng]
      const inlineDiffMatch = currentQ.question.match(/\[(nhận biết|thông hiểu|vận dụng|vận dụng cao|dễ|trung bình|khó|easy|medium|hard)\]/i);
      if (inlineDiffMatch) {
        const dText = inlineDiffMatch[1].toLowerCase();
        if (dText.includes('vận dụng') || dText.includes('khó') || dText.includes('hard')) currentQ.difficulty = 'hard';
        else if (dText.includes('thông hiểu') || dText.includes('trung') || dText.includes('medium')) currentQ.difficulty = 'medium';
        else currentQ.difficulty = 'easy';
        currentQ.question = currentQ.question.replace(inlineDiffMatch[0], '').trim();
      }
      continue;
    }

    if (!currentQ) continue;

    // 2. Phát hiện mức độ nhận thức (độ khó) trên dòng riêng: "Mức độ: Thông hiểu", "Độ khó: Vận dụng cao"
    const diffMatch = line.match(/^(?:mức\s*độ|độ\s*khó|muc\s*do|do\s*kho|difficulty|cấp\s*độ)[\s:.\-]*(.*)/i);
    if (diffMatch) {
      const val = diffMatch[1].toLowerCase();
      if (val.includes('vận dụng') || val.includes('van dung') || val.includes('kho') || val.includes('hard')) {
        currentQ.difficulty = 'hard';
      } else if (val.includes('thông hiểu') || val.includes('thong hieu') || val.includes('trung') || val.includes('medium')) {
        currentQ.difficulty = 'medium';
      } else {
        currentQ.difficulty = 'easy';
      }
      continue;
    }

    // 3. Phát hiện link hình ảnh đính kèm: "Ảnh: https://...", "Hình ảnh: https://..."
    const imgMatch = line.match(/^(?:hình\s*ảnh|ảnh|hinh\s*anh|anh|image|img)[\s:.\-]*(https?:\/\/\S+)/i);
    if (imgMatch) {
      currentQ.image = imgMatch[1].trim();
      continue;
    }

    // 4. Phát hiện lời giải thích: "Giải thích: ...", "Lời giải: ...", "Hướng dẫn giải: ..."
    const explMatch = line.match(/^(?:giải\s*thích|giai\s*thich|lời\s*giải|loi\s*giai|hướng\s*dẫn\s*giải|ghi\s*chú|ghi\s*chu|explanation)[\s:.\-]*(.*)/i);
    if (explMatch) {
      currentQ.explanation = explMatch[1].trim();
      continue;
    }

    // 5. Phát hiện dòng đáp án riêng: "Đáp án: A", "Đáp án đúng: A", "Đáp án đúng là: A", "Key: A", "Chọn: A"
    const ansMatch = line.match(/^(?:đáp\s*án\s*đúng\s*là|đáp\s*án\s*đúng|đáp\s*án|dap\s*an\s*dung|dap\s*an|chọn|chon|key|đ\/a|da|ans|answer)[\s:.\-]*([A-D])/i);
    if (ansMatch) {
      const letter = ansMatch[1].toUpperCase();
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (map[letter] !== undefined) {
        currentQ.correct = map[letter];
      }
      continue;
    }

    // 6. Phát hiện các phương án lựa chọn:
    // Kiểm tra xem dòng này có chứa nhiều phương án A, B, C, D trên cùng 1 dòng không!
    // Ví dụ: "A. Hà Nội    B. Đà Nẵng    C. TP.HCM    D. Hải Phòng"
    const multiOptRegex = /(?:^|\s{2,}|\t)([*✓]?[A-D][\s:.)\-\]])/g;
    const multiMatches = [];
    let m;
    while ((m = multiOptRegex.exec(line)) !== null) {
      multiMatches.push({ index: m.index + (m[0].length - m[1].length), token: m[1] });
    }

    if (multiMatches.length >= 2) {
      for (let k = 0; k < multiMatches.length; k++) {
        const start = multiMatches[k].index;
        const end = (k + 1 < multiMatches.length) ? multiMatches[k + 1].index : line.length;
        const chunk = line.substring(start, end).trim();

        const optMatch = chunk.match(/^([*✓]?)([A-D])[\s:.)\-\]]+(.*)/i);
        if (optMatch) {
          const isMarked = Boolean(optMatch[1]) || chunk.includes('*') || chunk.toLowerCase().includes('(đúng)');
          let text = optMatch[3].replace(/\*+/g, '').replace(/\(đúng\)/i, '').replace(/\(dung\)/i, '').trim();
          const letter = optMatch[2].toUpperCase();
          const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          const optIdx = currentQ.options.length;
          currentQ.options.push(text);
          if (isMarked || (currentQ.correct === -1 && map[letter] === optIdx && isMarked)) {
            currentQ.correct = optIdx;
          }
        }
      }
      continue;
    }

    // 7. Phát hiện 1 phương án trên dòng đơn lẻ: "A. Nội dung", "*B. Nội dung", "B*. Nội dung", "B. Nội dung (Đúng)"
    const singleOptMatch = line.match(/^([*✓]?)([A-D])([*]?)(?:[\s:.)\-\]]+)(.*)/i);
    if (singleOptMatch) {
      const starBefore = Boolean(singleOptMatch[1]);
      const letter = singleOptMatch[2].toUpperCase();
      const starAfter = Boolean(singleOptMatch[3]);
      let text = singleOptMatch[4].trim();

      const starInText = text.endsWith('*') || text.includes('*');
      const dungInText = /\((?:đúng|dung)\)/i.test(text);
      if (starInText || dungInText) {
        text = text.replace(/\*+/g, '').replace(/\((?:đúng|dung)\)/gi, '').trim();
      }

      const isCorrect = starBefore || starAfter || starInText || dungInText;
      const optIdx = currentQ.options.length;
      currentQ.options.push(text);

      if (isCorrect) {
        currentQ.correct = optIdx;
      }
      continue;
    }

    // 8. Nếu chưa có options nào, nối dòng vào câu hỏi (hỗ trợ câu hỏi nhiều dòng)
    if (currentQ.options.length === 0) {
      currentQ.question += ' ' + line;
    }
  }

  finalizeCurrentQuestion();

  // Áp dụng bảng đáp án cuối bài (nếu có)
  questions.forEach((q, idx) => {
    const qNum = q.detectedNum || (idx + 1);
    if (answerKeyMap[qNum] !== undefined && q.correct === -1) {
      q.correct = answerKeyMap[qNum];
    }
    delete q.detectedNum;
  });

  // Đảm bảo mọi câu hỏi có đáp án đúng mặc định nếu chưa phát hiện
  questions.forEach(q => {
    if (q.correct === -1 || typeof q.correct !== 'number') {
      q.correct = 0;
    }
    // Chuẩn hóa câu 4 đáp án nếu có 3 đáp án
    if (q.type !== 'tf' && q.options.length > 2 && q.options.length < 4) {
      while (q.options.length < 4) {
        q.options.push(`Lựa chọn ${String.fromCharCode(65 + q.options.length)}`);
      }
    }
  });

  return questions;
}

// Xử lý nạp văn bản hàng loạt từ Textarea
function applyBulkQuizImport() {
  const textarea = document.getElementById('quizBulkTextarea');
  if (!textarea) return;
  const rawText = textarea.value.trim();
  if (!rawText) {
    if (typeof showToast === 'function') showToast('Vui lòng dán nội dung câu hỏi!', 'warning');
    return;
  }

  const parsed = parseRawQuizText(rawText);
  if (parsed.length === 0) {
    if (typeof showToast === 'function') {
      showToast('Không nhận diện được câu hỏi nào. Vui lòng kiểm tra lại định dạng (Ví dụ: Câu 1: ... A. ... B. ... Đáp án: A)', 'warning');
    }
    return;
  }

  quizBank = [...quizBank, ...parsed];
  saveQuizBankToStorage();
  textarea.value = '';
  renderQuizManagerList();
  renderQuizArenaCard();
  if (typeof showToast === 'function') {
    showToast(`✅ Đã nhập thành công ${parsed.length} câu hỏi mới vào ngân hàng đề thi!`, 'success');
  }
}

// Khôi phục 10 câu hỏi mẫu mặc định
function resetDefaultQuizQuestions() {
  if (!confirm('Khôi phục lại 10 câu hỏi mẫu mặc định ban đầu? Các câu hỏi tự thêm sẽ được thay thế.')) return;
  quizBank = [...DEFAULT_QUIZ_QUESTIONS];
  currentQuestionIndex = 0;
  isAnswerRevealed = false;
  saveQuizBankToStorage();
  renderQuizManagerList();
  renderQuizArenaCard();
  if (typeof showToast === 'function') {
    showToast('Đã khôi phục 10 câu hỏi mẫu kiến thức tổng hợp!', 'info');
  }
}

// --- XUẤT / NHẬP NGÂN HÀNG CÂU HỎI RA FILE (EXCEL & JSON) ---

// 1. Xuất file JSON
function exportQuizToJson() {
  if (quizBank.length === 0) {
    if (typeof showToast === 'function') showToast('Ngân hàng câu hỏi đang trống!', 'warning');
    return;
  }

  const exportData = {
    title: 'Ngân hàng đề thi trắc nghiệm - Vòng Quay Lớp Học',
    exportedAt: new Date().toISOString(),
    totalQuestions: quizBank.length,
    questions: quizBank
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ngan-hang-cau-hoi-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast(`💾 Đã xuất ${quizBank.length} câu hỏi ra file JSON thành công!`, 'success');
  }
}

// 2. Xuất file Excel (.xlsx) chuẩn hóa
function exportQuizToExcel() {
  if (typeof XLSX === 'undefined') {
    if (typeof showToast === 'function') showToast('Thư viện Excel (SheetJS) chưa sẵn sàng!', 'warning');
    return;
  }
  if (quizBank.length === 0) {
    if (typeof showToast === 'function') showToast('Ngân hàng câu hỏi đang trống!', 'warning');
    return;
  }

  const letterMap = ['A', 'B', 'C', 'D'];
  const diffNameMap = { 'easy': 'Nhận biết', 'medium': 'Thông hiểu', 'hard': 'Vận dụng cao' };
  const rows = quizBank.map((q, idx) => ({
    'STT': idx + 1,
    'Câu hỏi': q.question,
    'Mức độ': diffNameMap[q.difficulty || 'easy'] || 'Nhận biết',
    'Phương án A': (q.options && q.options[0]) || '',
    'Phương án B': (q.options && q.options[1]) || '',
    'Phương án C': (q.options && q.options[2]) || '',
    'Phương án D': (q.options && q.options[3]) || '',
    'Đáp án đúng': letterMap[q.correct] || 'A',
    'Giải thích': q.explanation || '',
    'Ảnh minh họa': q.image || ''
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 16 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 14 },
    { wch: 35 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DeThiTracNghiem');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `de-thi-trac-nghiem-${dateStr}.xlsx`);

  if (typeof showToast === 'function') {
    showToast(`📊 Đã xuất ${quizBank.length} câu hỏi ra file Excel (.xlsx)!`, 'success');
  }
}

// 3. Tải file Excel mẫu câu hỏi trắc nghiệm chuẩn hóa
function downloadQuizTemplateExcel() {
  if (typeof XLSX === 'undefined') {
    if (typeof showToast === 'function') showToast('Thư viện Excel chưa được tải!', 'warning');
    return;
  }

  const sampleRows = [
    {
      'STT': 1,
      'Câu hỏi': 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?',
      'Mức độ': 'Nhận biết',
      'Phương án A': 'TP. Hồ Chí Minh',
      'Phương án B': 'Đà Nẵng',
      'Phương án C': 'Hà Nội',
      'Phương án D': 'Hải Phòng',
      'Đáp án đúng': 'C',
      'Giải thích': 'Hà Nội là thủ đô ngàn năm văn hiến của Việt Nam.',
      'Ảnh minh họa': ''
    },
    {
      'STT': 2,
      'Câu hỏi': 'Tam giác có ba cạnh bằng nhau và ba góc bằng nhau ($60^\\circ$) gọi là tam giác gì?',
      'Mức độ': 'Thông hiểu',
      'Phương án A': 'Tam giác vuông',
      'Phương án B': 'Tam giác cân',
      'Phương án C': 'Tam giác đều',
      'Phương án D': 'Tam giác vuông cân',
      'Đáp án đúng': 'C',
      'Giải thích': 'Tam giác đều có 3 cạnh bằng nhau và mỗi góc bằng 60 độ.',
      'Ảnh minh họa': ''
    },
    {
      'STT': 3,
      'Câu hỏi': 'Quần thể Kim tự tháp Giza và tượng Nhân sư nổi tiếng thuộc quốc gia nào?',
      'Mức độ': 'Vận dụng cao',
      'Phương án A': 'Hy Lạp',
      'Phương án B': 'Ai Cập',
      'Phương án C': 'Ý (Italia)',
      'Phương án D': 'Ấn Độ',
      'Đáp án đúng': 'B',
      'Giải thích': 'Kim tự tháp Giza là kỳ quan cổ đại duy nhất còn tồn tại ở Ai Cập.',
      'Ảnh minh họa': 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 16 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 14 },
    { wch: 35 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MauDeThi');
  XLSX.writeFile(wb, 'mau-de-thi-trac-nghiem.xlsx');

  if (typeof showToast === 'function') {
    showToast('📥 Đã tải xuống file Excel mẫu câu hỏi chuẩn hóa (.xlsx)!', 'success');
  }
}

// 4. Xử lý đọc file nhập (JSON hoặc Excel)
function handleQuizFileInput(file) {
  if (!file) return;
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        processImportedQuizQuestions(questions, file.name);
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Lỗi đọc file JSON: Tệp không đúng định dạng!', 'warning');
      }
    };
    reader.readAsText(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    if (typeof XLSX === 'undefined') {
      if (typeof showToast === 'function') showToast('Thư viện Excel chưa sẵn sàng!', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const questions = [];

        function getCol(row, candidates) {
          const keys = Object.keys(row);
          for (const cand of candidates) {
            const candNorm = cand.toLowerCase().trim();
            for (const k of keys) {
              if (k.toLowerCase().trim() === candNorm) {
                return (row[k] !== undefined && row[k] !== null) ? row[k].toString().trim() : '';
              }
            }
          }
          return '';
        }

        rawRows.forEach((row, rIdx) => {
          const qText = getCol(row, ['Câu hỏi', 'Cau hoi', 'Question', 'Nội dung', 'Noi dung', 'Đề bài', 'De bai', 'Câu', 'Cau']);
          if (!qText) return;

          const rawDiff = getCol(row, ['Mức độ', 'Muc do', 'Độ khó', 'Do kho', 'Difficulty', 'Cấp độ', 'Cap do', 'Level']).toLowerCase();
          let difficulty = 'easy';
          if (rawDiff.includes('vận dụng') || rawDiff.includes('van dung') || rawDiff.includes('kho') || rawDiff.includes('hard')) {
            difficulty = 'hard';
          } else if (rawDiff.includes('thông hiểu') || rawDiff.includes('thong hieu') || rawDiff.includes('trung') || rawDiff.includes('medium')) {
            difficulty = 'medium';
          }

          const optA = getCol(row, ['Phương án A', 'Phuong an A', 'A', 'Đáp án A', 'Dap an A', 'Lựa chọn A', 'Lua chon A']);
          const optB = getCol(row, ['Phương án B', 'Phuong an B', 'B', 'Đáp án B', 'Dap an B', 'Lựa chọn B', 'Lua chon B']);
          const optC = getCol(row, ['Phương án C', 'Phuong an C', 'C', 'Đáp án C', 'Dap an C', 'Lựa chọn C', 'Lua chon C']);
          const optD = getCol(row, ['Phương án D', 'Phuong an D', 'D', 'Đáp án D', 'Dap an D', 'Lựa chọn D', 'Lua chon D']);

          const rawAns = getCol(row, ['Đáp án đúng', 'Dap an dung', 'Đáp án', 'Dap an', 'Answer', 'Key', 'Correct', 'Đúng', 'Dung']).toUpperCase();
          const correctIdx = letterMap[rawAns.charAt(0)] !== undefined ? letterMap[rawAns.charAt(0)] : 0;
          const explanation = getCol(row, ['Giải thích', 'Giai thich', 'Explanation', 'Lời giải', 'Loi giai', 'Ghi chú', 'Ghi chu']);
          const image = getCol(row, ['Ảnh minh họa', 'Anh minh hoa', 'Ảnh', 'Anh', 'Image', 'Hình ảnh', 'Hinh anh']);

          const options = [optA || 'Lựa chọn A', optB || 'Lựa chọn B'];
          if (optC || optD) {
            options.push(optC || 'Lựa chọn C');
            options.push(optD || 'Lựa chọn D');
          }

          questions.push({
            id: 'q_' + Date.now() + '_' + rIdx,
            question: qText,
            options: options,
            type: options.length === 2 ? 'tf' : 'mc4',
            correct: Math.min(correctIdx, options.length - 1),
            difficulty: difficulty,
            explanation: explanation,
            image: image || null
          });
        });

        processImportedQuizQuestions(questions, file.name);
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Lỗi phân tích tệp Excel câu hỏi!', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    if (typeof showToast === 'function') showToast('Vui lòng chọn file định dạng .xlsx hoặc .json!', 'warning');
  }
}

// 5. Áp dụng câu hỏi đã nhập vào ngân hàng
function processImportedQuizQuestions(newQuestions, fileName) {
  if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
    if (typeof showToast === 'function') showToast('Không tìm thấy câu hỏi hợp lệ trong tệp tải lên!', 'warning');
    return;
  }

  const shouldMerge = confirm(
    `Đã nhận diện ${newQuestions.length} câu hỏi từ tệp "${fileName}".\n\n` +
    `- Bấm OK để GỘP THÊM vào ngân hàng hiện tại (${quizBank.length} câu).\n` +
    `- Bấm CANCEL để GHI ĐÈ (Thay thế toàn bộ ngân hàng câu hỏi cũ).`
  );

  if (shouldMerge) {
    quizBank = [...quizBank, ...newQuestions];
  } else {
    quizBank = [...newQuestions];
    currentQuestionIndex = 0;
  }

  resetLifelinesState();
  isAnswerRevealed = false;
  saveQuizBankToStorage();
  renderQuizManagerList();
  renderQuizArenaCard();

  if (typeof showToast === 'function') {
    showToast(`✅ Đã nạp thành công ${newQuestions.length} câu hỏi từ "${fileName}"!`, 'success');
  }
}

// Khởi chạy module Quiz khi tài liệu sẵn sàng
loadQuizBankFromStorage();

// Xuất các hàm ra phạm vi toàn cục (Global Scope)
window.quizBank = quizBank;
window.getCurrentQuestion = getCurrentQuestion;
window.renderQuizArenaCard = renderQuizArenaCard;
window.toggleRevealAnswer = toggleRevealAnswer;
window.selectQuizOption = selectQuizOption;
window.nextQuizQuestion = nextQuizQuestion;
window.prevQuizQuestion = prevQuizQuestion;
window.toggleQuizMode = toggleQuizMode;
window.switchGameMode = switchGameMode;
window.toggleQuestionVisibility = toggleQuestionVisibility;
window.openQuizManagerModal = openQuizManagerModal;
window.closeQuizManagerModal = closeQuizManagerModal;
window.renderQuizManagerList = renderQuizManagerList;
window.deleteQuizQuestion = deleteQuizQuestion;
window.addNewSingleQuestion = addNewSingleQuestion;
window.applyBulkQuizImport = applyBulkQuizImport;
window.parseRawQuizText = parseRawQuizText;
window.resetDefaultQuizQuestions = resetDefaultQuizQuestions;
window.useLifeline5050 = useLifeline5050;
window.useLifelineCallFriend = useLifelineCallFriend;
window.exportQuizToJson = exportQuizToJson;
window.exportQuizToExcel = exportQuizToExcel;
window.downloadQuizTemplateExcel = downloadQuizTemplateExcel;
window.handleQuizFileInput = handleQuizFileInput;
window.handleQuizSearch = handleQuizSearch;
window.clearAllQuizzes = clearAllQuizzes;
window.openCreateQuestionModal = openCreateQuestionModal;
window.openEditQuestionModal = openEditQuestionModal;
window.closeQuizEditModal = closeQuizEditModal;
window.handleQuizEditImageUrlChange = handleQuizEditImageUrlChange;
window.handleQuizEditImageUpload = handleQuizEditImageUpload;
window.clearQuizEditImage = clearQuizEditImage;
window.saveQuizEditQuestion = saveQuizEditQuestion;
window.openQuizImageLightbox = openQuizImageLightbox;
window.closeQuizImageLightbox = closeQuizImageLightbox;
window.setQuizDifficultyFilter = setQuizDifficultyFilter;
window.getDifficultyLabel = getDifficultyLabel;
window.triggerMathRendering = triggerMathRendering;
window.getQuestionTimeLimit = getQuestionTimeLimit;
window.triggerQuestionTimer = triggerQuestionTimer;
window.shuffleQuizQuestions = shuffleQuizQuestions;
window.handleQuizTypeChange = handleQuizTypeChange;
window.handleQuizDifficultyChange = handleQuizDifficultyChange;
window.updateQuizLiveMathPreview = updateQuizLiveMathPreview;
window.getQuizState = getQuizState;
window.getCurrentQuizIndex = () => currentQuestionIndex;


