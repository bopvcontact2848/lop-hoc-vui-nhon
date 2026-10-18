/**
 * ==============================================================================
 * MÔ-ĐUN ĐỒNG BỘ 2 MÀN HÌNH & ĐIỀU KHIỂN TỪ XA (scripts/remoteSync.js)
 * Chịu trách nhiệm:
 * 1. Đồng bộ 2 cửa sổ/tab trên cùng máy tính qua BroadcastChannel (độ trễ 0ms).
 * 2. Đồng bộ điện thoại qua mạng Wi-Fi LAN bằng Server-Sent Events (SSE).
 * 3. Chế độ Màn hình Trình chiếu Máy Chiếu tối giản (Cinema View).
 * 4. Tạo mã QR và liên kết kết nối di động.
 * ==============================================================================
 */

(function () {
  'use strict';

  const CHANNEL_NAME = 'vong_quay_sync_channel_v1';
  const CLIENT_ID = 'client_' + Math.random().toString(36).substring(2, 9);

  let broadcastChannel = null;
  let eventSource = null;
  let isConnectedSSE = false;

  // Lắng nghe các callback đăng ký khi có kết quả người thắng & trạng thái đồng bộ
  const winnerListeners = [];
  const stateListeners = [];
  const timerListeners = [];
  const quizListeners = [];

  // ============================================================================
  // PHÁT SÓNG ĐỒNG BỘ TIMER VÀ QUIZ RIÊNG BIỆT (REAL-TIME BROADCASTS)
  // ============================================================================
  function broadcastTimerState() {
    if (typeof window.getTimerState !== 'function') return;
    const timerData = window.getTimerState();
    sendAction('sync_timer', timerData);
  }

  function broadcastQuizState() {
    if (typeof window.getQuizState !== 'function') return;
    const quizData = window.getQuizState();
    sendAction('sync_quiz', quizData);
  }

  // ============================================================================
  // PHÁT SÓNG TOÀN BỘ TRẠNG THÁI (LỚP, HỌC SINH, ĐÃ GỌI, SƠ ĐỒ, TIMER, QUIZ) SANG THIẾT BỊ REMOTE
  // ============================================================================
  function broadcastFullState() {
    if (typeof window.getCurrentClass !== 'function' || !window.state) return;

    try {
      const cls = window.getCurrentClass();
      const all = typeof window.getAllStudents === 'function' ? window.getAllStudents() : [];
      const seatingState = window.SeatingChartModule && typeof window.SeatingChartModule.getState === 'function'
        ? window.SeatingChartModule.getState()
        : null;

      let quizData = null;
      if (typeof window.getQuizState === 'function') {
        quizData = window.getQuizState();
      }

      let timerData = null;
      if (typeof window.getTimerState === 'function') {
        timerData = window.getTimerState();
      }

      const payload = {
        className: cls ? cls.name : 'Chưa có lớp',
        classId: window.state.currentClassId,
        students: all,
        called: cls ? [...cls.called] : [],
        callCounts: cls?.callCounts ? { ...cls.callCounts } : {},
        noRepeat: window.state.noRepeat ?? true,
        gameMode: window.state.gameMode || 'seating',
        viewMode: window.state.viewMode || 'wheel',
        seating: seatingState,
        lastWinnerStudentName: window.lastCalledWinnerName || seatingState?.lastWinnerStudentName || null,
        quiz: quizData,
        timer: timerData,
        timestamp: Date.now()
      };

      sendAction('sync_state', payload);
    } catch (err) {
      console.warn('Lỗi khi broadcast trạng thái sang Remote:', err);
    }
  }

  // ============================================================================
  // KHỞI TẠO KÊNH ĐỒNG BỘ KÉP (BROADCASTCHANNEL + SSE)
  // ============================================================================
  function initSync() {
    // 1. Kênh BroadcastChannel (Dành cho 2 tab/cửa sổ trên cùng máy tính)
    if ('BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.senderId !== CLIENT_ID) {
            handleAction(event.data.action, event.data.payload);
          }
        };
      } catch (e) {
        console.warn('Trình duyệt không hỗ trợ BroadcastChannel:', e);
      }
    }

    // 2. Kênh Server-Sent Events (SSE) (Dành cho điện thoại kết nối qua Wi-Fi)
    connectSSE();

    // Tự động yêu cầu đồng bộ trạng thái ban đầu
    setTimeout(() => {
      sendAction('request_state_sync');
    }, 250);

    // 3. Kiểm tra tham số URL để kích hoạt Chế độ Máy Chiếu nếu có ?projector=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('projector') === '1') {
      setTimeout(enableProjectorMode, 300);
    }
  }

  // Kết nối tới Server-Sent Events
  function connectSSE() {
    if (!('EventSource' in window)) return;
    try {
      if (eventSource) eventSource.close();
      eventSource = new EventSource('/api/sync/events');

      eventSource.onopen = () => {
        isConnectedSSE = true;
        updateConnectionStatusUI(true);
        // Tự động yêu cầu lấy trạng thái mới nhất khi kết nối thành công
        sendAction('request_state_sync');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.action && data.senderId !== CLIENT_ID) {
            handleAction(data.action, data.payload);
          }
        } catch (err) {
          // Tin nhắn kết nối thông thường
        }
      };

      eventSource.onerror = () => {
        isConnectedSSE = false;
        updateConnectionStatusUI(false);
        // Tự động kết nối lại sau 4 giây
        setTimeout(connectSSE, 4000);
      };
    } catch (e) {
      console.warn('Lỗi kết nối SSE:', e);
    }
  }

  // ============================================================================
  // GỬI LỆNH ĐIỀU KHIỂN (SEND ACTIONS)
  // ============================================================================
  function sendAction(action, payload = {}) {
    const message = {
      action: action,
      payload: payload,
      senderId: CLIENT_ID,
      timestamp: Date.now()
    };

    // Gửi qua BroadcastChannel nội bộ
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(message);
      } catch (e) {}
    }

    // Gửi qua HTTP POST tới Server để phát cho các thiết bị qua mạng Wi-Fi
    fetch('/api/sync/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    }).catch(err => {
      // Offline fallback (không có server Node.js)
    });
  }

  // ============================================================================
  // TIẾP NHẬN VÀ THỰC THI LỆNH (HANDLE ACTIONS)
  // ============================================================================
  function handleAction(action, payload = {}) {
    switch (action) {
      case 'spin':
        if (window.state?.gameMode === 'seating' && window.SeatingChartModule) {
          window.SeatingChartModule.spin();
        } else if (typeof spin === 'function') {
          spin();
        }
        break;

      case 'spin_seating':
        if (typeof switchGameMode === 'function') switchGameMode('seating');
        setTimeout(() => {
          if (window.SeatingChartModule) window.SeatingChartModule.spin();
        }, 150);
        break;

      case 'spin_wheel':
        if (typeof switchGameMode === 'function') switchGameMode('classic');
        if (typeof switchViewMode === 'function') switchViewMode('wheel');
        setTimeout(() => {
          if (typeof spin === 'function') spin();
        }, 150);
        break;

      case 'spin_slot':
        if (typeof switchGameMode === 'function') switchGameMode('classic');
        if (typeof switchViewMode === 'function') switchViewMode('slot');
        setTimeout(() => {
          if (typeof spin === 'function') spin();
        }, 150);
        break;

      case 'auto_assign':
        if (typeof switchGameMode === 'function') switchGameMode('seating');
        if (window.SeatingChartModule) window.SeatingChartModule.autoAssign();
        break;

      case 'shuffle':
        if (window.SeatingChartModule) window.SeatingChartModule.shuffle();
        break;

      case 'assign_groups':
        if (window.SeatingChartModule) window.SeatingChartModule.assignGroupsByAisle();
        break;

      case 'clear_groups':
        if (window.SeatingChartModule) window.SeatingChartModule.clearGroups();
        break;

      case 'clear_seats':
        if (window.SeatingChartModule) window.SeatingChartModule.clearAll();
        break;

      case 'switch_class':
        if (payload.classId && typeof switchClass === 'function') {
          switchClass(payload.classId);
        }
        break;

      case 'switch_mode':
        if (payload.mode && typeof switchGameMode === 'function') {
          switchGameMode(payload.mode);
        }
        break;

      case 'winner_announced':
        winnerListeners.forEach(cb => cb(payload));
        break;

      case 'request_state_sync':
        broadcastFullState();
        break;

      case 'sync_state':
        stateListeners.forEach(cb => cb(payload));
        if (payload && payload.quiz) {
          quizListeners.forEach(cb => cb(payload.quiz));
        }
        if (payload && payload.timer) {
          timerListeners.forEach(cb => cb(payload.timer));
        }
        break;

      case 'sync_timer':
        timerListeners.forEach(cb => cb(payload));
        break;

      case 'sync_quiz':
        quizListeners.forEach(cb => cb(payload));
        break;

      case 'timer_toggle':
        if (typeof window.toggleTimer === 'function') {
          window.toggleTimer();
        }
        break;

      case 'timer_start':
        if (typeof window.startTimer === 'function') {
          window.startTimer();
        }
        break;

      case 'timer_stop':
        if (typeof window.stopTimer === 'function') {
          window.stopTimer();
        }
        break;

      case 'timer_set':
        if (payload && payload.seconds && typeof window.setTimerDuration === 'function') {
          window.setTimerDuration(payload.seconds);
          if (payload.autoStart && typeof window.startTimer === 'function') {
            window.startTimer();
          }
        }
        break;

      case 'timer_reset':
        if (typeof window.resetTimer === 'function') {
          window.resetTimer();
        }
        break;

      case 'quiz_shuffle':
        if (typeof window.shuffleQuizQuestions === 'function') {
          window.shuffleQuizQuestions();
        }
        break;

      case 'quiz_next':
        if (typeof window.nextQuizQuestion === 'function') {
          window.nextQuizQuestion();
        }
        break;

      case 'quiz_prev':
        if (typeof window.prevQuizQuestion === 'function') {
          window.prevQuizQuestion();
        }
        break;

      case 'quiz_reveal':
        if (typeof window.toggleRevealAnswer === 'function') {
          window.toggleRevealAnswer();
        }
        break;

      case 'quiz_quick_timer':
        if (typeof window.triggerQuestionTimer === 'function') {
          window.triggerQuestionTimer(payload.seconds || 30);
        }
        break;

      case 'reset_called':
        if (typeof window.resetCalledList === 'function') {
          window.resetCalledList(false);
          broadcastFullState();
        }
        break;

      default:
        break;
    }
  }

  // ============================================================================
  // CHẾ ĐỘ TOÀN MÀN HÌNH MÁY CHIẾU (PROJECTOR DISPLAY MODE)
  // ============================================================================
  function enableProjectorMode() {
    document.body.classList.add('projector-mode');

    // Chuyển sang tab Sơ đồ nếu chưa ở đó
    if (typeof switchGameMode === 'function') {
      switchGameMode('seating');
    }

    // Thêm thanh trạng thái máy chiếu ở góc
    let badge = document.getElementById('projectorLiveBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'projectorLiveBadge';
      badge.className = 'projector-live-badge';
      badge.innerHTML = `
        <span>📽️ MÁY CHIẾU: ĐANG KẾT NỐI ĐIỀU KHIỂN</span>
        <button class="projector-exit-btn" id="btnExitProjectorMode">Thoát</button>
      `;
      document.body.appendChild(badge);

      document.getElementById('btnExitProjectorMode')?.addEventListener('click', disableProjectorMode);
    }

    if (typeof showToast === 'function') {
      showToast('📽️ Đã kích hoạt Chế độ Trình chiếu Máy Chiếu!', 'success');
    }
  }

  function disableProjectorMode() {
    document.body.classList.remove('projector-mode');
    const badge = document.getElementById('projectorLiveBadge');
    if (badge) badge.remove();
  }

  function toggleProjectorMode() {
    if (document.body.classList.contains('projector-mode')) {
      disableProjectorMode();
    } else {
      enableProjectorMode();
    }
  }

  // ============================================================================
  // CẬP NHẬT TRẠNG THÁI KẾT NỐI TRÊN GIAO DIỆN
  // ============================================================================
  function updateConnectionStatusUI(connected) {
    const statusDot = document.getElementById('remoteStatusDot');
    const statusText = document.getElementById('remoteStatusText');
    if (statusDot) {
      statusDot.style.background = connected ? '#10b981' : '#f59e0b';
    }
    if (statusText) {
      statusText.textContent = connected ? 'Đã kết nối điều khiển Wi-Fi' : 'Đang chờ kết nối...';
    }
  }

  // ============================================================================
  // LẤY THÔNG TIN ĐỊA CHỈ IP TỪ SERVER ĐỂ TẠO MÃ QR VÀ LINK
  // ============================================================================
  async function fetchNetworkInfo() {
    try {
      const res = await fetch('/api/ip');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    // Fallback nếu không kết nối được API
    return {
      success: true,
      ip: window.location.hostname || 'localhost',
      port: window.location.port || 3000,
      remoteUrl: `${window.location.protocol}//${window.location.host}/remote.html`,
      projectorUrl: `${window.location.protocol}//${window.location.host}/index.html?projector=1`
    };
  }

  // Mở modal kết nối điều khiển từ xa & máy chiếu
  async function openRemoteModal() {
    const modal = document.getElementById('remoteSyncModal');
    if (!modal) return;
    modal.classList.add('open');

    const info = await fetchNetworkInfo();
    const input = document.getElementById('remoteUrlInput');
    if (input) input.value = info.remoteUrl;

    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: info.remoteUrl,
          width: 124,
          height: 124,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        qrContainer.innerHTML = `<a href="${info.remoteUrl}" target="_blank" style="font-size:0.75rem;word-break:break-all;color:#4f46e5;text-align:center;">Bấm mở Remote</a>`;
      }
    }
  }

  function closeRemoteModal() {
    const modal = document.getElementById('remoteSyncModal');
    if (modal) modal.classList.remove('open');
  }

  function copyRemoteUrl() {
    const input = document.getElementById('remoteUrlInput');
    if (input && input.value) {
      navigator.clipboard.writeText(input.value).then(() => {
        if (typeof showToast === 'function') {
          showToast('📋 Đã sao chép link điều khiển vào khay nhớ tạm!', 'success');
        }
      }).catch(() => {
        input.select();
        document.execCommand('copy');
        if (typeof showToast === 'function') {
          showToast('📋 Đã sao chép link điều khiển!', 'success');
        }
      });
    }
  }

  // ============================================================================
  // XUẤT MODULE RA WINDOW
  // ============================================================================
  window.openRemoteModal = openRemoteModal;
  window.closeRemoteModal = closeRemoteModal;
  window.copyRemoteUrl = copyRemoteUrl;

  window.RemoteSync = {
    init: initSync,
    send: sendAction,
    enableProjectorMode: enableProjectorMode,
    disableProjectorMode: disableProjectorMode,
    toggleProjectorMode: toggleProjectorMode,
    fetchNetworkInfo: fetchNetworkInfo,
    openRemoteModal: openRemoteModal,
    closeRemoteModal: closeRemoteModal,
    copyRemoteUrl: copyRemoteUrl,
    broadcastFullState: broadcastFullState,
    broadcastTimerState: broadcastTimerState,
    broadcastQuizState: broadcastQuizState,
    onWinner: (cb) => winnerListeners.push(cb),
    onState: (cb) => stateListeners.push(cb),
    onTimer: (cb) => timerListeners.push(cb),
    onQuiz: (cb) => quizListeners.push(cb)
  };

  // Tự động khởi tạo sau khi tài liệu DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSync);
  } else {
    initSync();
  }

})();
