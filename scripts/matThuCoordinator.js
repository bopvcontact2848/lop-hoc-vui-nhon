/**
 * TRUNG TÂM ĐIỀU PHỐI TRÒ CHƠI LỚN & BẢNG XẾP HẠNG THỜI GIAN THỰC
 * Giải Mã Mật Thư 20/11 - THCS Tân Hải
 */

(function () {
  'use strict';

  let currentTab = 'qr';
  let activeGradeFilter = 'all';
  let activeSeriesFilter = 'all'; // 'all' | 'A' | 'B'
  let cachedIpInfo = null;
  let cachedScores = [];
  let sseEventSource = null;

  const CUSTOM_URL_KEY = 'matthu_custom_server_url_v1';
  let cachedBaseUrl = null;

  // Lấy URL cơ sở thi đấu từ máy chủ LAN (hoặc location hiện tại)
  async function getBaseGameUrl() {
    // 1. Nếu Thầy/Cô đã lưu cấu hình URL tùy chỉnh (ví dụ Hosting hoặc IP Wi-Fi tĩnh)
    const custom = localStorage.getItem(CUSTOM_URL_KEY);
    if (custom && custom.trim().startsWith('http')) {
      cachedBaseUrl = custom.trim();
      updateNetworkStatusUI(cachedBaseUrl, 'custom');
      return cachedBaseUrl;
    }

    if (cachedIpInfo && cachedIpInfo.matThuUrl) {
      cachedBaseUrl = cachedIpInfo.matThuUrl;
      updateNetworkStatusUI(cachedBaseUrl, 'online');
      return cachedBaseUrl;
    }

    // 2. Thử fetch API tương đối (khi mở bằng http://localhost:3000 hoặc http://IP:3000)
    try {
      const res = await fetch('/api/ip');
      if (res.ok) {
        cachedIpInfo = await res.json();
        if (cachedIpInfo && cachedIpInfo.matThuUrl) {
          cachedBaseUrl = cachedIpInfo.matThuUrl;
          updateNetworkStatusUI(cachedBaseUrl, 'online');
          return cachedBaseUrl;
        }
      }
    } catch (_e) {}

    // 3. Thử dò tìm http://localhost:3000/api/ip (khi Thầy/Cô mở web bằng file://)
    try {
      const res2 = await fetch('http://localhost:3000/api/ip');
      if (res2.ok) {
        cachedIpInfo = await res2.json();
        if (cachedIpInfo && cachedIpInfo.matThuUrl) {
          cachedBaseUrl = cachedIpInfo.matThuUrl;
          updateNetworkStatusUI(cachedBaseUrl, 'online');
          return cachedBaseUrl;
        }
      }
    } catch (_e2) {}

    // 4. Thử dò tìm http://127.0.0.1:3000/api/ip
    try {
      const res3 = await fetch('http://127.0.0.1:3000/api/ip');
      if (res3.ok) {
        cachedIpInfo = await res3.json();
        if (cachedIpInfo && cachedIpInfo.matThuUrl) {
          cachedBaseUrl = cachedIpInfo.matThuUrl;
          updateNetworkStatusUI(cachedBaseUrl, 'online');
          return cachedBaseUrl;
        }
      }
    } catch (_e3) {}

    // 5. Nếu mở qua web HTTP/HTTPS bình thường (ví dụ Hosting trên mạng)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const pathSegs = window.location.pathname.split('/');
      pathSegs.pop();
      const basePath = pathSegs.join('/') + (pathSegs.length > 1 ? '/' : '');
      cachedBaseUrl = `${window.location.protocol}//${window.location.host}${basePath}index.html?game=mat_thu`;
      updateNetworkStatusUI(cachedBaseUrl, 'online');
      return cachedBaseUrl;
    }

    // 6. Trường hợp mở bằng file:/// và chưa khởi động máy chủ:
    cachedBaseUrl = 'http://localhost:3000/?game=mat_thu';
    updateNetworkStatusUI(cachedBaseUrl, 'file-mode');
    return cachedBaseUrl;
  }

  // Cập nhật giao diện trạng thái mạng & ô nhập địa chỉ
  function updateNetworkStatusUI(url, mode) {
    const input = document.getElementById('matThuBaseUrlInput');
    const badge = document.getElementById('qrNetworkStatusBadge');
    const warnBox = document.getElementById('qrFileWarningBox');

    if (input && !input.matches(':focus')) {
      input.value = url;
    }

    if (badge) {
      if (mode === 'online') {
        badge.className = 'qr-network-badge online';
        badge.textContent = '🟢 Máy chủ Wi-Fi sẵn sàng';
      } else if (mode === 'custom') {
        badge.className = 'qr-network-badge';
        badge.textContent = '🔵 Địa chỉ tùy chỉnh';
      } else {
        badge.className = 'qr-network-badge warning';
        badge.textContent = '⚠️ Đang mở dạng file://';
      }
    }

    if (warnBox) {
      const isFile = (window.location.protocol === 'file:');
      warnBox.classList.toggle('hidden', !isFile);
    }
  }

  // Lưu địa chỉ tùy chỉnh từ ô input
  function saveCustomBaseUrl() {
    const input = document.getElementById('matThuBaseUrlInput');
    if (!input) return;
    const val = input.value.trim();

    if (!val || !val.startsWith('http')) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Vui lòng nhập địa chỉ web hợp lệ bắt đầu bằng http:// hoặc https://', 'error');
      }
      return;
    }

    localStorage.setItem(CUSTOM_URL_KEY, val);
    cachedBaseUrl = val;
    cachedIpInfo = null;
    updateNetworkStatusUI(val, 'custom');
    renderQrCards();

    if (typeof window.showToast === 'function') {
      window.showToast('✅ Đã cập nhật toàn bộ mã QR theo địa chỉ mạng mới!', 'success');
    }
  }

  // Đặt lại tự động dò IP
  function resetDefaultBaseUrl() {
    localStorage.removeItem(CUSTOM_URL_KEY);
    cachedBaseUrl = null;
    cachedIpInfo = null;
    renderQrCards();
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã tự động dò lại địa chỉ IP máy chủ!', 'info');
    }
  }

  // Chuyển đổi qua lại giữa các tab
  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.matthu-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    const panelPlay = document.getElementById('matThuTabPlay');
    const panelQr = document.getElementById('matThuTabQr');
    const panelLb = document.getElementById('matThuTabLeaderboard');
    const panelSt = document.getElementById('matThuTabStations');
    const panelQues = document.getElementById('matThuTabQuestions');

    if (panelPlay) panelPlay.classList.toggle('hidden', tabId !== 'play');
    if (panelQr) panelQr.classList.toggle('hidden', tabId !== 'qr');
    if (panelLb) panelLb.classList.toggle('hidden', tabId !== 'leaderboard');
    if (panelSt) panelSt.classList.toggle('hidden', tabId !== 'stations');
    if (panelQues) panelQues.classList.toggle('hidden', tabId !== 'questions');

    if (tabId === 'qr') {
      renderQrCards();
    } else if (tabId === 'leaderboard') {
      loadLeaderboardScores();
    } else if (tabId === 'stations') {
      renderStationCards();
    } else if (tabId === 'questions') {
      renderQuestionsEditor();
    } else if (tabId === 'play') {
      const frame = document.getElementById('matThuGameFrame');
      if (frame && (!frame.src || frame.src === 'about:blank' || !frame.getAttribute('src'))) {
        frame.src = 'Giai_ma_mat_thu_20_11_THCS_Tan_Hai.html';
      }
      try {
        const savedSplit = localStorage.getItem(SPLIT_STORAGE_KEY);
        if (savedSplit === '1') {
          toggleSplitScreen(true);
        }
      } catch (_e) {}
    }
  }

  // Kiểm tra đội thi có thỏa mãn đồng thời bộ lọc Khối và bộ lọc Dãy phòng hay không
  function isTeamMatchingFilter(team) {
    if (!team) return false;
    // 1. Lọc theo Khối
    if (activeGradeFilter !== 'all' && String(team.grade) !== String(activeGradeFilter)) {
      return false;
    }
    // 2. Lọc theo Dãy phòng (A hoặc B)
    if (activeSeriesFilter === 'A') {
      return /[Aa]/.test(team.className);
    }
    if (activeSeriesFilter === 'B') {
      return /[Bb]/.test(team.className);
    }
    return true;
  }

  // Lọc theo Khối
  function setGradeFilter(grade) {
    activeGradeFilter = grade;
    document.querySelectorAll('.qr-grade-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-grade') === String(grade));
    });
    if (currentTab === 'qr') {
      renderQrCards();
    } else {
      renderLeaderboardView();
    }
  }

  // Lọc theo Dãy phòng (Dãy A / Dãy B)
  function setSeriesFilter(series) {
    activeSeriesFilter = series;
    document.querySelectorAll('.qr-series-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-series') === String(series));
    });
    if (currentTab === 'qr') {
      renderQrCards();
    } else {
      renderLeaderboardView();
    }
  }

  // Vẽ danh sách Thẻ Mã QR cho các lớp
  async function renderQrCards() {
    const container = document.getElementById('matThuQrGrid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #854d0e;">⏳ Đang tạo mã QR cho các Chi đội...</div>';

    const baseUrl = await getBaseGameUrl();
    const allTeams = (window.MatThuData && typeof window.MatThuData.getAllClassesList === 'function')
      ? window.MatThuData.getAllClassesList()
      : [];

    const filtered = allTeams.filter(isTeamMatchingFilter);

    container.innerHTML = '';

    filtered.forEach(teamItem => {
      const card = document.createElement('div');
      card.className = 'qr-team-card';

      const teamUrl = `${baseUrl}?grade=${teamItem.grade}&class=${encodeURIComponent(teamItem.className)}&team=${encodeURIComponent(teamItem.teamName)}`;
      const qrId = `qr_canvas_${teamItem.className}`;

      card.innerHTML = `
        <span class="qr-team-badge badge-grade-${teamItem.grade}">Khối ${teamItem.grade}</span>
        <div class="qr-team-name">${teamItem.teamName}</div>
        <div id="${qrId}" class="qr-canvas-box" title="Quét mã QR để vào thi"></div>
        <div class="qr-url-preview" title="${teamUrl}">${teamUrl}</div>
        <div class="qr-card-footer">
          <button type="button" class="btn-matthu-download" onclick="MatThuCoordinator.downloadTeamQrPng('${teamItem.className}', '${teamItem.grade}', '${teamItem.teamName}', '${teamUrl}')" title="Tải ảnh PNG thẻ QR này để gửi Zalo cho lớp">
            📥 Tải PNG
          </button>
          <button type="button" class="btn-matthu-primary" onclick="MatThuCoordinator.printSingleQr('${teamItem.className}', '${teamItem.grade}', '${teamItem.teamName}', '${teamUrl}')" title="In thẻ này">
            🖨️ In
          </button>
          <button type="button" class="btn-matthu-secondary" onclick="MatThuCoordinator.openTeamUrl('${teamUrl}', '${teamItem.className}', '${teamItem.teamName}')" title="Chơi ngay với lớp này trên màn hình thi đấu">
            🎮 Chơi ngay
          </button>
        </div>
      `;

      container.appendChild(card);

      // Tạo mã QR bằng thư viện qrcode.js
      setTimeout(() => {
        const qrBox = document.getElementById(qrId);
        if (qrBox && typeof QRCode !== 'undefined') {
          new QRCode(qrBox, {
            text: teamUrl,
            width: 130,
            height: 130,
            colorDark: '#4a1525',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      }, 10);
    });
  }

  // Tải danh sách điểm số từ máy chủ
  async function loadLeaderboardScores() {
    try {
      const res = await fetch('/api/matthu/scores');
      if (res.ok) {
        const data = await res.json();
        cachedScores = (data && Array.isArray(data.scores)) ? data.scores : [];
      } else {
        cachedScores = getLocalFallbackScores();
      }
    } catch (_e) {
      cachedScores = getLocalFallbackScores();
    }
    renderLeaderboardView();
  }

  function getLocalFallbackScores() {
    try {
      return JSON.parse(localStorage.getItem('tan_hai_2011_scores_v2') || '[]');
    } catch (_e) {
      return [];
    }
  }

  // Vẽ Bảng Xếp Hạng Trực Tiếp (Podium Top 3 + Bảng chi tiết)
  function renderLeaderboardView() {
    const list = [...cachedScores].filter(s => {
      return isTeamMatchingFilter({ grade: s.grade, className: s.className });
    }).sort((a, b) => (b.score - a.score) || (a.elapsed - b.elapsed));

    // Cập nhật số liệu tổng quan
    const statTotalEl = document.getElementById('lbStatTotal');
    const statMaxScoreEl = document.getElementById('lbStatMaxScore');
    const statTopClassEl = document.getElementById('lbStatTopClass');

    if (statTotalEl) statTotalEl.textContent = `${list.length} đội`;
    if (statMaxScoreEl) statMaxScoreEl.textContent = list[0] ? `${list[0].score}đ` : '0đ';
    if (statTopClassEl) statTopClassEl.textContent = list[0] ? list[0].className : '--';

    // Vẽ Bục Top 3
    const p1 = list[0];
    const p2 = list[1];
    const p3 = list[2];

    const formatClock = s => {
      const m = Math.floor((s || 0) / 60);
      const sec = (s || 0) % 60;
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const podiumContainer = document.getElementById('matThuPodium');
    if (podiumContainer) {
      podiumContainer.innerHTML = `
        <div class="podium-col">
          <div class="podium-card podium-2">
            <div class="podium-trophy">🥈</div>
            <div class="podium-team">${p2 ? p2.team : 'Đang chờ...'}</div>
            <div class="podium-score">${p2 ? p2.score + 'đ' : '--'}</div>
            <div class="podium-time">${p2 ? formatClock(p2.elapsed) : ''}</div>
          </div>
        </div>
        <div class="podium-col">
          <div class="podium-card podium-1">
            <div class="podium-trophy">👑 🥇</div>
            <div class="podium-team">${p1 ? p1.team : 'Đang chờ...'}</div>
            <div class="podium-score">${p1 ? p1.score + 'đ' : '--'}</div>
            <div class="podium-time">${p1 ? formatClock(p1.elapsed) : ''}</div>
          </div>
        </div>
        <div class="podium-col">
          <div class="podium-card podium-3">
            <div class="podium-trophy">🥉</div>
            <div class="podium-team">${p3 ? p3.team : 'Đang chờ...'}</div>
            <div class="podium-score">${p3 ? p3.score + 'đ' : '--'}</div>
            <div class="podium-time">${p3 ? formatClock(p3.elapsed) : ''}</div>
          </div>
        </div>
      `;
    }

    // Vẽ Bảng Danh Sách Đầy Đủ
    const tbody = document.getElementById('matThuLeaderboardRows');
    if (tbody) {
      tbody.innerHTML = '';
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #854d0e;">⏳ Chưa có đội thi nào nộp bài. Bảng xếp hạng sẽ tự động cập nhật khi các Chi đội hoàn thành!</td></tr>';
        return;
      }

      list.forEach((row, idx) => {
        const rank = idx + 1;
        let rankClass = 'rank-badge';
        if (rank === 1) rankClass += ' rank-1';
        else if (rank === 2) rankClass += ' rank-2';
        else if (rank === 3) rankClass += ' rank-3';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="${rankClass}">${rank}</span></td>
          <td><strong>${row.team}</strong></td>
          <td><span class="qr-team-badge badge-grade-${row.grade || 6}">Khối ${row.grade || 6}</span></td>
          <td>${row.className}</td>
          <td><strong style="color: #8d2341; font-size: 1.05rem;">${row.score}đ</strong></td>
          <td>⏱️ ${formatClock(row.elapsed)}</td>
          <td style="font-size: 0.78rem; opacity: 0.85;">${row.when || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Đồng bộ sang Bảng Xếp Hạng dành riêng cho Chế Độ Song Song (Split Screen)
    renderSplitLeaderboard(list);
  }

  // Render Bảng Xếp Hạng dành riêng cho Chế Độ Song Song (Split Screen)
  function renderSplitLeaderboard(list) {
    const totalEl = document.getElementById('splitStatTotal');
    const maxScoreEl = document.getElementById('splitStatMaxScore');
    const topTeamEl = document.getElementById('splitStatTopTeam');
    const podiumEl = document.getElementById('matThuSplitPodium');
    const listEl = document.getElementById('matThuSplitList');

    if (totalEl) totalEl.textContent = `${list.length}`;
    if (maxScoreEl) maxScoreEl.textContent = list[0] ? `${list[0].score}đ` : '0đ';
    if (topTeamEl) topTeamEl.textContent = list[0] ? list[0].className : '--';

    // Cập nhật trạng thái active chip khối trên thanh lọc Split
    document.querySelectorAll('.split-filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-grade') === String(activeGradeFilter));
    });

    const formatClock = s => {
      const m = Math.floor((s || 0) / 60);
      const sec = (s || 0) % 60;
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    if (podiumEl) {
      const p1 = list[0];
      const p2 = list[1];
      const p3 = list[2];

      podiumEl.innerHTML = `
        <div class="split-podium-item split-p2">
          <span class="split-p-trophy">🥈</span>
          <span class="split-p-team">${p2 ? p2.team : 'Đang chờ...'}</span>
          <span class="split-p-score">${p2 ? p2.score + 'đ' : '--'}</span>
          <span class="split-p-time">${p2 ? formatClock(p2.elapsed) : ''}</span>
        </div>
        <div class="split-podium-item split-p1">
          <span class="split-p-trophy">👑 🥇</span>
          <span class="split-p-team">${p1 ? p1.team : 'Đang chờ...'}</span>
          <span class="split-p-score">${p1 ? p1.score + 'đ' : '--'}</span>
          <span class="split-p-time">${p1 ? formatClock(p1.elapsed) : ''}</span>
        </div>
        <div class="split-podium-item split-p3">
          <span class="split-p-trophy">🥉</span>
          <span class="split-p-team">${p3 ? p3.team : 'Đang chờ...'}</span>
          <span class="split-p-score">${p3 ? p3.score + 'đ' : '--'}</span>
          <span class="split-p-time">${p3 ? formatClock(p3.elapsed) : ''}</span>
        </div>
      `;
    }

    if (listEl) {
      if (list.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 25px; color: #854d0e; font-size: 0.85rem;">⏳ Chưa có kết quả nộp bài. Bảng điểm sẽ nhảy tự động theo thời gian thực!</div>';
        return;
      }

      listEl.innerHTML = '';
      list.forEach((row, idx) => {
        const rank = idx + 1;
        let rankClass = 'split-rank-badge';
        if (rank === 1) rankClass += ' rank-1';
        else if (rank === 2) rankClass += ' rank-2';
        else if (rank === 3) rankClass += ' rank-3';

        const item = document.createElement('div');
        item.className = 'split-lb-item';
        item.innerHTML = `
          <div class="split-lb-item-left">
            <span class="${rankClass}">${rank}</span>
            <div class="split-lb-item-name">
              <strong>${row.team}</strong>
              <small>Lớp ${row.className} • Khối ${row.grade || 6}</small>
            </div>
          </div>
          <div class="split-lb-item-right">
            <span class="split-lb-item-score">${row.score}đ</span>
            <span class="split-lb-item-time">⏱️ ${formatClock(row.elapsed)}</span>
          </div>
        `;
        listEl.appendChild(item);
      });
    }
  }

  // --- ĐIỀU KHIỂN CHẾ ĐỘ THI ĐẤU SONG SONG (SPLIT SCREEN) ---
  const SPLIT_STORAGE_KEY = 'matthu_split_screen_v1';

  function toggleSplitScreen(forcedState) {
    const container = document.getElementById('matThuPlaySplitContainer');
    const rightPane = document.getElementById('matThuSplitRightLeaderboard');
    const toggleBtn = document.getElementById('btnToggleSplitScreen');
    const modal = document.getElementById('matThuCoordinatorModal');
    const card = modal ? modal.querySelector('.matthu-modal-card') : null;

    if (!container || !rightPane) return;

    let isSplit;
    if (typeof forcedState === 'boolean') {
      isSplit = forcedState;
    } else {
      isSplit = !container.classList.contains('is-split-active');
    }

    container.classList.toggle('is-split-active', isSplit);
    rightPane.classList.toggle('hidden', !isSplit);
    if (card) card.classList.toggle('is-split-mode', isSplit);

    if (toggleBtn) {
      toggleBtn.classList.toggle('active', isSplit);
      toggleBtn.innerHTML = isSplit ? '📱 Thu Về 1 Cột' : '📺 Chế độ Song Song (Split)';
    }

    try {
      localStorage.setItem(SPLIT_STORAGE_KEY, isSplit ? '1' : '0');
    } catch (_e) {}

    if (isSplit) {
      loadLeaderboardScores();
      if (typeof window.showToast === 'function' && typeof forcedState !== 'boolean') {
        window.showToast('📺 Đã bật Chế độ Song Song: Thi đấu bên trái & Bảng xếp hạng bên phải!', 'success');
      }
    }
  }

  // Kết nối Server-Sent Events (SSE) để cập nhật thời gian thực
  function connectSseEvents() {
    if (sseEventSource) return;
    try {
      sseEventSource = new EventSource('/api/sync/events');
      sseEventSource.onmessage = function (e) {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.type === 'matthu_new_submission') {
            onNewScoreSubmitted(payload.record);
          } else if (payload && payload.type === 'matthu_scores_reset') {
            cachedScores = [];
            renderLeaderboardView();
          }
        } catch (_err) {}
      };
      sseEventSource.onerror = function () {
        // Tự động kết nối lại khi có lỗi mạng
      };
    } catch (_err) {}
  }

  // Xử lý khi có đội thi vừa nộp bài thành công
  function onNewScoreSubmitted(record) {
    if (!record) return;

    // Cập nhật mảng kết quả
    const existIdx = cachedScores.findIndex(s => s.className === record.className);
    if (existIdx >= 0) {
      cachedScores[existIdx] = record;
    } else {
      cachedScores.push(record);
    }

    // Hiển thị thông báo Toast chúc mừng
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 ${record.team} (Khối ${record.grade}) vừa hoàn thành với ${record.score} điểm!`, 'success');
    }

    // Phát âm thanh chúc mừng nếu đang mở Bảng Xếp Hạng
    if (window.sound && typeof window.sound.playVictory === 'function' && currentTab === 'leaderboard') {
      window.sound.playVictory();
    }

    // Hiệu ứng pháo hoa ăn mừng
    if (typeof window.triggerCelebrationConfetti === 'function' && currentTab === 'leaderboard') {
      window.triggerCelebrationConfetti();
    }

    renderLeaderboardView();
  }

  // In hàng loạt Thẻ Mã QR cho toàn bộ 40 lớp (Trang in khổ A4)
  async function printAllQrSheets() {
    const printArea = document.getElementById('matThuPrintArea');
    if (!printArea) return;

    printArea.innerHTML = '<div style="text-align: center; padding: 20px;">Đang chuẩn bị trang in thẻ thi đấu...</div>';

    const baseUrl = await getBaseGameUrl();
    const allTeams = (window.MatThuData && typeof window.MatThuData.getAllClassesList === 'function')
      ? window.MatThuData.getAllClassesList()
      : [];

    const filtered = allTeams.filter(isTeamMatchingFilter);

    let gradeLabel = 'Toàn trường';
    if (activeGradeFilter !== 'all') {
      gradeLabel = `Khối ${activeGradeFilter}`;
    }
    let seriesLabel = '';
    if (activeSeriesFilter === 'A') {
      seriesLabel = ' • Dãy A (A1-A6)';
    } else if (activeSeriesFilter === 'B') {
      seriesLabel = ' • Dãy B (B1-B4)';
    }

    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #8d2341; text-transform: uppercase;">LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI</h2>
        <h3 style="margin: 4px 0;">THẺ MÃ QR THI ĐẤU - GIẢI MÃ MẬT THƯ 20/11</h3>
        <p style="font-size: 11pt; color: #555;">Hành trình 5 cửa ải • Dành riêng cho các Chi đội ${gradeLabel}${seriesLabel} (${filtered.length} lớp)</p>
      </div>
      <div class="print-qr-grid">
    `;

    filtered.forEach(item => {
      const qrId = `print_qr_${item.className}`;
      html += `
        <div class="print-qr-card">
          <h4>${item.teamName} (Khối ${item.grade})</h4>
          <p>Trường THCS Tân Hải • Năm học 2026 - 2027</p>
          <div id="${qrId}" class="print-qr-box"></div>
          <div class="print-instruction">
            <strong>Hướng dẫn:</strong> Dùng camera điện thoại hoặc Zalo quét mã QR này để vào thẳng phòng thi của Chi đội!
          </div>
        </div>
      `;
    });

    html += `</div>`;
    printArea.innerHTML = html;

    // Sinh mã QR vào từng thẻ in
    filtered.forEach(item => {
      const qrId = `print_qr_${item.className}`;
      const teamUrl = `${baseUrl}?grade=${item.grade}&class=${encodeURIComponent(item.className)}&team=${encodeURIComponent(item.teamName)}`;
      const box = document.getElementById(qrId);
      if (box && typeof QRCode !== 'undefined') {
        new QRCode(box, {
          text: teamUrl,
          width: 140,
          height: 140,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    });

    setTimeout(() => {
      window.print();
    }, 500);
  }

  // In 1 thẻ đơn lẻ
  function printSingleQr(className, grade, teamName, teamUrl) {
    const printArea = document.getElementById('matThuPrintArea');
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="max-width: 450px; margin: 40px auto; border: 3px solid #8d2341; border-radius: 16px; padding: 24px; text-align: center;">
        <h2 style="color: #8d2341; margin: 0 0 6px 0;">LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI</h2>
        <h3 style="margin: 4px 0 12px 0;">THẺ THI ĐẤU: ${teamName} (Khối ${grade})</h3>
        <div id="print_single_box" style="width: 180px; height: 180px; margin: 16px auto;"></div>
        <p style="font-size: 11pt; color: #333; margin: 12px 0;">Dùng điện thoại quét mã QR để bắt đầu hành trình Vượt 5 Cửa Ải Tri Thức 20/11!</p>
      </div>
    `;

    setTimeout(() => {
      const box = document.getElementById('print_single_box');
      if (box && typeof QRCode !== 'undefined') {
        new QRCode(box, {
          text: teamUrl,
          width: 180,
          height: 180,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
      setTimeout(() => window.print(), 300);
    }, 100);
  }

  // Mở modal điều phối & thi đấu (mặc định luôn hiển thị toàn màn hình)
  function openCoordinatorModal(initialTab = 'play') {
    const modal = document.getElementById('matThuCoordinatorModal');
    if (!modal) return;
    document.body.classList.add('modal-open', 'matthu-modal-open');
    modal.classList.add('open', 'has-maximized');
    const card = modal.querySelector('.matthu-modal-card');
    if (card) {
      card.classList.add('is-maximized');
    }
    updateGradeSelectOptions();
    updateQrTabBadges();
    connectSseEvents();
    switchTab(initialTab);
  }

  function closeCoordinatorModal() {
    const modal = document.getElementById('matThuCoordinatorModal');
    if (modal) {
      modal.classList.remove('open');
    }
    document.body.classList.remove('modal-open', 'matthu-modal-open');
  }

  // ==========================================================================
  // HỆ THỐNG THI ĐẤU GIẢI MÃ MẬT THƯ TRỰC TIẾP (DIRECT ARENA ENGINE - NO IFRAME)
  // ==========================================================================
  let examState = null;
  let examTicker = null;
  let examScoreReturn = 'matThuStartPanel';
  const EXAM_STORAGE_KEY = 'matthu_scores_thcs_tanhai_v2';
  const ACTIVE_EXAM_SESSION_KEY = 'matthu_active_session_state_v1';

  function saveActiveExamState() {
    try {
      if (examState && !examState.finished) {
        localStorage.setItem(ACTIVE_EXAM_SESSION_KEY, JSON.stringify(examState));
      } else {
        localStorage.removeItem(ACTIVE_EXAM_SESSION_KEY);
      }
    } catch (_e) {}
  }

  function loadActiveExamState() {
    try {
      const raw = localStorage.getItem(ACTIVE_EXAM_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.team && parsed.questions && parsed.deadline > Date.now()) {
          return parsed;
        }
      }
    } catch (_e) {}
    return null;
  }

  function clearActiveExamState() {
    try {
      localStorage.removeItem(ACTIVE_EXAM_SESSION_KEY);
    } catch (_e) {}
  }

  function playExamBeep(freq = 600, duration = 0.12, type = 'sine') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_e) {}
  }

  function playExamSuccess() {
    playExamBeep(523, 0.08);
    setTimeout(() => playExamBeep(659, 0.08), 80);
    setTimeout(() => playExamBeep(784, 0.16), 160);
  }

  function playExamWrong() {
    playExamBeep(260, 0.18, 'sawtooth');
  }

  function showArenaPanel(panelId) {
    const panels = ['matThuStartPanel', 'matThuGamePanel', 'matThuResultPanel', 'matThuCertificatePanel', 'matThuScoresPanel'];
    panels.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== panelId);
    });
    const container = document.getElementById('matThuArenaContainer');
    if (container) container.scrollTop = 0;
  }

  function populateClasses(grade, selectedClass = '') {
    const classSelect = document.getElementById('matThuClassName');
    if (!classSelect || typeof MatThuData === 'undefined') return;
    classSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';

    const allTeams = (MatThuData.TEAMS || (typeof MatThuData.getAllClassesList === 'function' ? MatThuData.getAllClassesList() : []));
    const teams = allTeams.filter(t => String(t.grade) === String(grade));
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.className;
      opt.textContent = `Lớp ${t.className} (${t.teamName})`;
      if (t.className === selectedClass) opt.selected = true;
      classSelect.appendChild(opt);
    });

    onClassChange();
  }

  function onGradeChange() {
    const gradeSelect = document.getElementById('matThuGradeSelect');
    if (gradeSelect) {
      populateClasses(gradeSelect.value);
    }
  }

  function onClassChange() {
    const classSelect = document.getElementById('matThuClassName');
    const teamInput = document.getElementById('matThuTeam');
    if (!classSelect || !teamInput || typeof MatThuData === 'undefined') return;

    const val = classSelect.value;
    if (val) {
      const allTeams = (MatThuData.TEAMS || (typeof MatThuData.getAllClassesList === 'function' ? MatThuData.getAllClassesList() : []));
      const team = allTeams.find(t => t.className === val);
      teamInput.value = team ? team.teamName : `Chi đội ${val}`;
    } else {
      teamInput.value = '';
    }
  }

  function formatClock(seconds) {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function tickExamTimer() {
    if (!examState || examState.finished) return;
    const now = Date.now();
    examState.left = Math.max(0, Math.round((examState.deadline - now) / 1000));
    const timeEl = document.getElementById('matThuTime');
    if (timeEl) {
      timeEl.textContent = formatClock(examState.left);
      if (examState.left <= 120) {
        timeEl.style.color = '#dc2626';
      } else {
        timeEl.style.color = '#8d2341';
      }
    }
    if (examState.left <= 0) {
      finishExam('Hết thời gian 20 phút');
    }
  }

  // Khởi động bài thi
  function startExam() {
    const gradeSelect = document.getElementById('matThuGradeSelect');
    const classSelect = document.getElementById('matThuClassName');
    const teamInput = document.getElementById('matThuTeam');
    const leaderInput = document.getElementById('matThuLeader');
    const campusSelect = document.getElementById('matThuCampus');
    const stationModeCb = document.getElementById('matThuStationModeCheckbox');
    const errEl = document.getElementById('matThuStartError');

    const grade = gradeSelect ? gradeSelect.value : '6';
    const className = classSelect ? classSelect.value.trim() : '';
    const team = teamInput ? teamInput.value.trim() : '';
    const leader = leaderInput ? leaderInput.value.trim() : '';
    const campus = campusSelect ? campusSelect.value : 'Trường chính';
    const stationMode = stationModeCb ? stationModeCb.checked : true;

    if (!className) {
      if (errEl) errEl.textContent = '⚠️ Vui lòng chọn Lớp / Chi đội dự thi!';
      return;
    }
    if (!team) {
      if (errEl) errEl.textContent = '⚠️ Vui lòng nhập Tên Chi đội!';
      return;
    }
    if (!leader) {
      if (errEl) errEl.textContent = '⚠️ Vui lòng nhập Họ tên Đội trưởng / Đại diện!';
      return;
    }
    if (errEl) errEl.textContent = '';

    if (typeof MatThuData === 'undefined' || !MatThuData.QUESTIONS || !MatThuData.QUESTIONS[grade]) {
      alert('Không tìm thấy ngân hàng câu hỏi cho khối ' + grade);
      return;
    }

    // Lấy câu hỏi đầy đủ cho khối từ MatThuData
    const rawQuestions = JSON.parse(JSON.stringify(MatThuData.QUESTIONS[grade]));
    const questions = rawQuestions;

    examState = {
      team,
      className,
      grade,
      leader,
      campus,
      stationMode,
      questions,
      index: 0,
      score: 0,
      codes: [],
      answered: false,
      finished: false,
      left: 1200,
      deadline: Date.now() + 1200000,
      startedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    saveActiveExamState();

    const label = document.getElementById('matThuFrameCurrentTeam');
    if (label) {
      label.textContent = `${team} (Lớp ${className})`;
    }

    if (examTicker) clearInterval(examTicker);
    examTicker = setInterval(tickExamTimer, 500);

    showArenaPanel('matThuGamePanel');
    renderExamQuestion();
    tickExamTimer();

    if (typeof window.showToast === 'function') {
      window.showToast(`🚀 Chi đội ${team} bắt đầu vượt 5 cửa ải!`, 'success');
    }
  }

  function renderExamQuestion() {
    if (!examState) return;
    const q = examState.questions[examState.index];
    if (!q) return;

    examState.answered = false;

    // Cập nhật số câu & điểm
    const qnumEl = document.getElementById('matThuQnum');
    const scoreEl = document.getElementById('matThuScore');
    const barEl = document.getElementById('matThuBar');
    if (qnumEl) qnumEl.textContent = `${examState.index + 1}/${examState.questions.length}`;
    if (scoreEl) scoreEl.textContent = `${examState.score}`;
    if (barEl) barEl.style.width = `${((examState.index) / examState.questions.length) * 100}%`;

    // Cập nhật 5 Doors
    const doorsBox = document.getElementById('matThuDoors');
    if (doorsBox) {
      doorsBox.innerHTML = '';
      const totalDoors = 5;
      const currentDoorIdx = (typeof q.stage === 'number') ? q.stage : Math.floor(examState.index / 4);

      for (let i = 0; i < totalDoors; i++) {
        const doorDiv = document.createElement('div');
        doorDiv.className = 'matthu-door';
        const st = MatThuData.STATIONS[i] || { icon: '🚪', code: `M${i+1}`, title: `Ải ${i+1}` };

        if (i < currentDoorIdx) {
          doorDiv.classList.add('done');
          doorDiv.innerHTML = `<span class="matthu-door-icon">✅</span><span>Ải ${i+1}</span><span class="matthu-door-code">${st.code}</span>`;
        } else if (i === currentDoorIdx) {
          doorDiv.classList.add('current');
          doorDiv.innerHTML = `<span class="matthu-door-icon">${st.icon}</span><span>Ải ${i+1}</span><span class="matthu-door-code">Đang thi</span>`;
        } else {
          doorDiv.innerHTML = `<span class="matthu-door-icon">🔒</span><span>Ải ${i+1}</span><span class="matthu-door-code">${st.code}</span>`;
        }
        doorsBox.appendChild(doorDiv);
      }
    }

    // Biểu ngữ Cửa ải hiện tại
    const stageIdx = (typeof q.stage === 'number') ? q.stage : Math.floor(examState.index / 4);
    const stData = MatThuData.STATIONS[stageIdx] || { icon: '🚩', title: `Cửa ải ${stageIdx + 1}` };
    const stageIcon = document.getElementById('matThuStageIcon');
    const stageLabel = document.getElementById('matThuStageLabel');
    const stageBadge = document.getElementById('matThuStageBadge');
    if (stageIcon) stageIcon.textContent = stData.icon;
    if (stageLabel) stageLabel.textContent = `Cửa Ải ${stageIdx + 1}: ${stData.title}`;
    if (stageBadge) {
      const qInStage = examState.questions.slice(0, examState.index + 1).filter(item => item.stage === stageIdx).length;
      const totalInStage = examState.questions.filter(item => item.stage === stageIdx).length;
      const pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 10;
      const diffLabel = formatDifficultyLabel(q.difficulty);
      stageBadge.innerHTML = `CÂU ${qInStage}/${totalInStage || 1} • <span style="color: #fbbf24; font-weight: 800;">⭐ ${pts}đ</span> • ${diffLabel}`;
    }

    // Câu hỏi
    const questionEl = document.getElementById('matThuQuestion');
    if (questionEl) questionEl.textContent = `Câu ${examState.index + 1}: ${q.q}`;

    // Đáp án
    const answersBox = document.getElementById('matThuAnswers');
    if (answersBox) {
      answersBox.innerHTML = '';
      const optLabels = ['A', 'B', 'C', 'D'];
      q.opts.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'matthu-answer';
        btn.innerHTML = `<span class="opt-badge">${optLabels[optIdx]}</span><span>${optText}</span>`;
        btn.onclick = () => chooseExamAnswer(optIdx);
        answersBox.appendChild(btn);
      });
    }

    // Ẩn feedback và nút Next
    const fbEl = document.getElementById('matThuFeedback');
    const nextBtn = document.getElementById('btnMatThuNext');
    if (fbEl) fbEl.classList.add('hidden');
    if (nextBtn) {
      nextBtn.classList.add('hidden');
      if (examState.index === examState.questions.length - 1) {
        nextBtn.textContent = '🏁 Nộp bài & Xem kết quả';
      } else {
        nextBtn.textContent = 'Câu tiếp theo ➜';
      }
    }

    // Cập nhật các mảnh mật mã
    renderCollectedCodes();
  }

  function formatDifficultyLabel(diff) {
    switch (diff) {
      case 'easy': return '🟢 Dễ';
      case 'hard': return '🟠 Khó';
      case 'expert': return '🔴 Rất khó';
      default: return '🟡 Trung bình';
    }
  }

  function chooseExamAnswer(chosenIdx) {
    if (!examState || examState.answered) return;
    examState.answered = true;

    const q = examState.questions[examState.index];
    const answersBox = document.getElementById('matThuAnswers');
    const buttons = answersBox ? answersBox.querySelectorAll('.matthu-answer') : [];

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.a) {
        btn.classList.add('correct');
      } else if (idx === chosenIdx) {
        btn.classList.add('wrong');
      }
    });

    const isCorrect = (chosenIdx === q.a);
    const awardPts = (typeof q.points === 'number' && q.points > 0) ? q.points : 10;
    if (isCorrect) {
      examState.score += awardPts;
      playExamSuccess();
    } else {
      playExamWrong();
    }

    const scoreEl = document.getElementById('matThuScore');
    if (scoreEl) scoreEl.textContent = `${examState.score}`;

    // Hiển thị giải thích
    const fbEl = document.getElementById('matThuFeedback');
    if (fbEl) {
      fbEl.innerHTML = isCorrect
        ? `🎉 <strong>Chính xác (+${awardPts} điểm)!</strong> ${q.exp || ''}`
        : `❌ <strong>Chưa chính xác!</strong> Đáp án đúng là <strong>${['A', 'B', 'C', 'D'][q.a]}. ${q.opts[q.a]}</strong>. ${q.exp || ''}`;
      fbEl.classList.remove('hidden');
    }

    // Nếu vừa trả lời câu cuối cùng của ải (tức hoàn thành ải đó)
    const currentQ = examState.questions[examState.index];
    const nextQ = examState.questions[examState.index + 1];
    const isEndOfStage = !nextQ || (nextQ.stage !== currentQ.stage);

    if (isEndOfStage) {
      const stageIdx = (typeof currentQ.stage === 'number') ? currentQ.stage : Math.floor(examState.index / 4);
      const st = MatThuData.STATIONS[stageIdx];
      if (st && !examState.codes.includes(st.code)) {
        examState.codes.push(st.code);
        renderCollectedCodes();
        if (typeof window.showToast === 'function') {
          window.showToast(`🔓 Mở khóa mảnh mật mã: ${st.code}!`, 'success');
        }
      }
    }

    saveActiveExamState();

    const nextBtn = document.getElementById('btnMatThuNext');
    if (nextBtn) nextBtn.classList.remove('hidden');
  }

  function renderCollectedCodes() {
    const list = document.getElementById('matThuCodesList');
    if (!list || !examState) return;
    list.innerHTML = '';
    const allStations = MatThuData.STATIONS || [];
    allStations.forEach(st => {
      const span = document.createElement('span');
      const hasCode = examState.codes.includes(st.code);
      span.className = `matthu-code-badge ${hasCode ? 'unlocked' : ''}`;
      span.textContent = hasCode ? `★ ${st.code}` : `🔒 ???`;
      list.appendChild(span);
    });
  }

  // Chuyển sang câu tiếp theo
  function nextQuestion() {
    if (!examState) return;

    const currentQ = examState.questions[examState.index];
    const nextIndex = examState.index + 1;
    const nextQ = examState.questions[nextIndex];

    if (nextIndex >= examState.questions.length) {
      finishExam('Hoàn thành tất cả các ải thi');
      return;
    }

    // Kiểm tra ranh giới trạm: khi câu tiếp theo thuộc stage mới
    const isEndOfStage = nextQ && currentQ && (nextQ.stage !== currentQ.stage);

    if (isEndOfStage && examState.stationMode) {
      const nextStageIdx = nextQ.stage;
      openStationGate(nextStageIdx);
      return;
    }

    examState.index = nextIndex;
    saveActiveExamState();
    renderExamQuestion();
  }

  // Mở modal trạm kiểm soát sân trường
  let pendingStationIndex = null;
  function openStationGate(stageIdx) {
    pendingStationIndex = stageIdx;
    if (examState) {
      examState.pendingStation = stageIdx + 1; // Số thứ tự trạm (1-5)
      saveActiveExamState();
    }
    const modal = document.getElementById('matThuStationGateModal');
    const title = document.getElementById('matThuGateTitle');
    const loc = document.getElementById('matThuGateLocation');
    const rewardNotice = document.getElementById('matThuGateRewardNotice');
    const pinInput = document.getElementById('matThuGatePinInput');
    const err = document.getElementById('matThuGateError');

    const prevSt = MatThuData.STATIONS[stageIdx - 1];
    const st = MatThuData.STATIONS[stageIdx] || { title: `Trạm ${stageIdx + 1}`, location: 'Sân trường', code: '---', pin: '0000' };

    if (title) title.textContent = `TRẠM TIẾP THEO: TRẠM ${stageIdx + 1} - ${st.title.toUpperCase()}`;
    if (loc) loc.textContent = `📍 Vị trí: ${st.location}`;
    if (rewardNotice && prevSt) {
      rewardNotice.innerHTML = `🎉 Chi đội đã giải mã thành công Trạm ${stageIdx}! Mảnh mật mã thu thập được: <strong style="color: #dc2626; font-size: 1.05rem;">★ ${prevSt.code} ★</strong>`;
    }

    // Hiển thị Bản đồ 2D và tuyến đường phát sáng tới trạm mới
    const gateMapContainer = document.getElementById('matThuGateMapContainer');
    const routeTextEl = document.getElementById('gateMapRouteText');
    if (routeTextEl) {
      routeTextEl.textContent = `Trạm ${stageIdx} ➜ Trạm ${stageIdx + 1} (${st.location})`;
    }
    if (gateMapContainer && typeof renderSchoolMapSvg === 'function') {
      renderSchoolMapSvg(gateMapContainer, stageIdx, true);
    }

    if (pinInput) pinInput.value = '';
    if (err) err.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
    setTimeout(() => {
      if (pinInput) pinInput.focus();
    }, 100);
  }

  function submitStationPin() {
    if (pendingStationIndex === null || !examState) return;
    const pinInput = document.getElementById('matThuGatePinInput');
    const err = document.getElementById('matThuGateError');
    const modal = document.getElementById('matThuStationGateModal');

    const entered = (pinInput ? pinInput.value : '').trim();
    const st = MatThuData.STATIONS[pendingStationIndex];

    if (!st || (entered !== String(st.pin) && entered !== String(st.pin).toLowerCase())) {
      if (err) err.classList.remove('hidden');
      playExamWrong();
      return;
    }

    playExamSuccess();
    if (modal) modal.classList.add('hidden');

    if (st && !examState.codes.includes(st.code)) {
      examState.codes.push(st.code);
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`🔓 Mở khóa thành công Trạm ${pendingStationIndex + 1}: ${st.title}!`, 'success');
    }

    examState.index++;
    examState.pendingStation = null;
    pendingStationIndex = null;
    saveActiveExamState();
    renderExamQuestion();
  }

  function finishEarly() {
    if (confirm('Chi đội có chắc chắn muốn nộp bài sớm? Những câu chưa trả lời sẽ không có điểm!')) {
      finishExam('Nộp bài sớm');
    }
  }

  // Kết thúc bài thi
  async function finishExam(reason) {
    if (!examState || examState.finished) return;
    examState.finished = true;
    if (examTicker) clearInterval(examTicker);
    clearActiveExamState();

    const elapsed = 1200 - examState.left;
    const when = new Date().toLocaleString('vi-VN');

    // Bắn pháo hoa Confetti
    if (typeof confetti === 'function') {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (_e) {}
    }

    // Hiển thị kết quả
    const resultInfo = document.getElementById('matThuResultInfo');
    if (resultInfo) {
      resultInfo.innerHTML = `Chi đội: <strong>${examState.team}</strong> (Lớp ${examState.className}) • Điểm số: <strong style="color:#8d2341; font-size:18px;">${examState.score}/100</strong><br>Thời gian hoàn thành: <strong>${formatClock(elapsed)}</strong> • Lý do: ${reason}`;
    }

    const finalCodesBox = document.getElementById('matThuFinalCodes');
    if (finalCodesBox) {
      finalCodesBox.innerHTML = '';
      (MatThuData.STATIONS || []).forEach(st => {
        const span = document.createElement('span');
        span.className = 'matthu-code-badge unlocked';
        span.style.fontSize = '14px';
        span.style.padding = '6px 14px';
        span.textContent = `★ ${st.code} ★`;
        finalCodesBox.appendChild(span);
      });
    }

    // Lưu vào LocalStorage thiết bị
    try {
      const record = {
        team: examState.team,
        className: examState.className,
        grade: examState.grade,
        leader: examState.leader,
        campus: examState.campus,
        score: examState.score,
        elapsed: elapsed,
        when: when,
        reason: reason
      };
      const existing = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY) || '[]');
      existing.unshift(record);
      localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
    } catch (_e) {}

    // Gửi kết quả về máy chủ SSE để cập nhật Bảng Xếp Hạng trực tiếp
    try {
      await fetch('/api/matthu/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: examState.team,
          className: examState.className,
          grade: Number(examState.grade),
          leader: examState.leader,
          campus: examState.campus,
          score: examState.score,
          elapsed: elapsed,
          when: when,
          reason: reason
        })
      });
      loadLeaderboardScores();
    } catch (_e2) {}

    showArenaPanel('matThuResultPanel');
  }

  function openCertificate() {
    if (!examState) return;
    const certTeam = document.getElementById('matThuCertTeam');
    const certDetail = document.getElementById('matThuCertDetail');
    const certScore = document.getElementById('matThuCertScore');
    const certDate = document.getElementById('matThuCertDate');
    const certHash = document.getElementById('matThuCertSecurityHash');

    if (certTeam) certTeam.textContent = examState.team.toUpperCase();
    if (certDetail) certDetail.textContent = `Lớp ${examState.className} • Khối ${examState.grade} • ${examState.campus} • Đội trưởng: ${examState.leader}`;
    if (certScore) certScore.textContent = `ĐIỂM SỐ XUẤT SẮC: ${examState.score}/100 ĐIỂM • THỜI GIAN: ${formatClock(1200 - examState.left)}`;
    if (certDate) certDate.textContent = `Ngày hoàn thành: ${new Date().toLocaleDateString('vi-VN')}`;
    if (certHash) certHash.textContent = `MÃ XÁC THỰC BTC: THCS-TANHAI-2011-${examState.className}-${examState.score}`;

    showArenaPanel('matThuCertificatePanel');
  }

  function backToResult() {
    showArenaPanel('matThuResultPanel');
  }

  function showScores(fromPanel) {
    examScoreReturn = fromPanel;
    const rows = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY) || '[]')
      .sort((a, b) => b.score - a.score || a.elapsed - b.elapsed);

    const tbody = document.getElementById('matThuScoreRows');
    if (tbody) {
      tbody.innerHTML = '';
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 18px; color: #94a3b8;">Chưa có kết quả nào được lưu trên thiết bị này.</td></tr>';
      } else {
        rows.forEach((r, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${r.team}</strong></td>
            <td>Khối ${r.grade}</td>
            <td>${r.className}</td>
            <td><strong style="color:#8d2341;">${r.score}đ</strong></td>
            <td>${formatClock(r.elapsed)}</td>
            <td>${r.when}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
    showArenaPanel('matThuScoresPanel');
  }

  function backFromScores() {
    showArenaPanel(examScoreReturn || 'matThuStartPanel');
  }

  function clearDeviceScores() {
    if (confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ lịch sử thi đấu lưu trên thiết bị này?')) {
      localStorage.removeItem(EXAM_STORAGE_KEY);
      showScores(examScoreReturn);
    }
  }

  function exportDeviceScoresCsv() {
    const rows = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY) || '[]');
    if (!rows.length) {
      alert('Chưa có kết quả nào để xuất!');
      return;
    }
    const cols = ['STT', 'Chi đội', 'Khối', 'Lớp', 'Đại diện', 'Điểm trường', 'Điểm số', 'Giây hoàn thành', 'Thời gian hoàn thành', 'Ngày thi', 'Lý do'];
    const csv = [
      cols,
      ...rows.map((r, i) => [i + 1, r.team, r.grade, r.className, r.leader, r.campus, r.score, r.elapsed, formatClock(r.elapsed), r.when, r.reason])
    ].map(row => row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bang_diem_Giai_ma_mat_thu_thiet_bi.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Khởi động lại bài thi hoặc chuyển lớp
  function resetExam() {
    if (examTicker) clearInterval(examTicker);
    examState = null;
    clearActiveExamState();
    showArenaPanel('matThuStartPanel');
  }

  function openTeamUrl(url, className, teamName) {
    switchTab('play');
    resetExam();

    // Tự động điền lớp và tên đội
    const teamInput = document.getElementById('matThuTeam');
    const gradeSelect = document.getElementById('matThuGradeSelect');

    if (className && typeof MatThuData !== 'undefined') {
      const allTeams = (MatThuData.TEAMS || (typeof MatThuData.getAllClassesList === 'function' ? MatThuData.getAllClassesList() : []));
      const teamItem = allTeams.find(t => t.className === className);
      if (teamItem && gradeSelect) {
        gradeSelect.value = String(teamItem.grade);
        populateClasses(teamItem.grade, className);
      }
    }
    if (teamInput && teamName) teamInput.value = teamName;

    const label = document.getElementById('matThuFrameCurrentTeam');
    if (label) {
      label.textContent = teamName ? `${teamName} (Lớp ${className})` : 'Đang thi đấu theo lớp';
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`🎮 Đã chuyển sang màn hình thi đấu cho ${teamName || className}!`, 'info');
    }
  }

  function reloadGameFrame() {
    resetExam();
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã khởi động lại bài thi!', 'info');
    }
  }

  function resetClassInFrame() {
    resetExam();
    const label = document.getElementById('matThuFrameCurrentTeam');
    if (label) {
      label.textContent = 'Chế độ tự do (hoặc chọn lớp từ tab Mã QR)';
    }
    if (typeof window.showToast === 'function') {
      window.showToast('👥 Đã chuyển sang chế độ chọn lớp tự do!', 'info');
    }
  }

  // Bật/tắt chế độ toàn màn hình cho modal (dự phòng nếu được gọi từ bên ngoài)
  function toggleModalMaximize() {
    const modal = document.getElementById('matThuCoordinatorModal');
    const card = modal ? modal.querySelector('.matthu-modal-card') : null;
    const btn = document.querySelector('.btn-matthu-header-maximize');
    const btnToolbar = document.querySelector('.btn-matthu-play-maximize');

    if (!card) return;
    const isMax = card.classList.toggle('is-maximized');
    if (modal) modal.classList.toggle('has-maximized', isMax);

    if (btn) btn.innerHTML = isMax ? '❐ Thu nhỏ' : '⛶ Phóng to';
    if (btnToolbar) btnToolbar.innerHTML = isMax ? '❐ Thu nhỏ' : '⛶ Toàn màn hình';
  }

  // Xuất file CSV kết quả thi
  function exportLeaderboardCsv() {
    const list = [...cachedScores].sort((a, b) => (b.score - a.score) || (a.elapsed - b.elapsed));
    if (list.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('Chưa có kết quả để xuất!', 'info');
      return;
    }

    const cols = ['Hạng', 'Chi đội', 'Khối', 'Lớp', 'Đại diện', 'Điểm trường', 'Điểm số', 'Thời gian (giây)', 'Ngày hoàn thành'];
    const csv = [
      cols,
      ...list.map((r, i) => [i + 1, r.team, r.grade || 6, r.className, r.leader || '', r.campus || '', r.score, r.elapsed, r.when || ''])
    ].map(row => row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bang_Xep_Hang_Giai_Ma_Mat_Thu_20_11.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ============================================================================
  // XUẤT ẢNH PNG THẺ QR & ÁP PHÍCH 5 TRẠM SÂN TRƯỜNG (HTML5 CANVAS)
  // ============================================================================

  // Tạo Canvas mã QR từ text
  function createQrCanvas(text, size = 360, colorDark = '#4a1525') {
    return new Promise(resolve => {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.visibility = 'hidden';
      document.body.appendChild(tempDiv);

      new QRCode(tempDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: colorDark || '#4a1525',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      setTimeout(() => {
        const qrCanvas = tempDiv.querySelector('canvas');
        if (qrCanvas) {
          const clone = document.createElement('canvas');
          clone.width = size;
          clone.height = size;
          const ctx = clone.getContext('2d');
          ctx.drawImage(qrCanvas, 0, 0);
          tempDiv.remove();
          resolve(clone);
        } else {
          const img = tempDiv.querySelector('img');
          if (img && img.src) {
            const clone = document.createElement('canvas');
            clone.width = size;
            clone.height = size;
            const ctx = clone.getContext('2d');
            const newImg = new Image();
            newImg.onload = () => {
              ctx.drawImage(newImg, 0, 0, size, size);
              tempDiv.remove();
              resolve(clone);
            };
            newImg.onerror = () => {
              tempDiv.remove();
              resolve(null);
            };
            newImg.src = img.src;
          } else {
            tempDiv.remove();
            resolve(null);
          }
        }
      }, 70);
    });
  }

  // Tải 1 ảnh thẻ QR lớp dạng PNG đẹp để gửi Zalo
  async function downloadTeamQrPng(className, grade, teamName, teamUrl) {
    if (!teamUrl) {
      const baseUrl = await getBaseGameUrl();
      teamUrl = `${baseUrl}?grade=${grade}&class=${encodeURIComponent(className)}&team=${encodeURIComponent(teamName)}`;
    }

    const qrCanvas = await createQrCanvas(teamUrl, 360);
    if (!qrCanvas) return;

    const width = 760;
    const height = 1060;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Nền Gradient ấm áp, sang trọng chủ đề 20/11
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#fffdfa');
    bgGrad.addColorStop(0.5, '#fff6eb');
    bgGrad.addColorStop(1, '#ffeef2');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Viền đôi trang trí lễ hội
    ctx.strokeStyle = '#8d2341';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 3. Tiêu đề Đơn vị tổ chức
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 22px system-ui, Arial, sans-serif';
    ctx.fillText('LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI', width / 2, 78);

    // 4. Tiêu đề Trò chơi lớn
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 28px system-ui, Arial, sans-serif';
    ctx.fillText('GIẢI MÃ MẬT THƯ 20/11', width / 2, 118);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 15px system-ui, Arial, sans-serif';
    ctx.fillText('Hành Trình Vượt 5 Cửa Ải Tri Thức – Chào Mừng Ngày Nhà Giáo Việt Nam', width / 2, 146);

    // Dải phân cách mạ vàng
    const dividerGrad = ctx.createLinearGradient(150, 164, width - 150, 164);
    dividerGrad.addColorStop(0, 'rgba(217, 119, 6, 0)');
    dividerGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.8)');
    dividerGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 168);
    ctx.lineTo(width - 150, 168);
    ctx.stroke();

    // 5. Thẻ Tên Chi Đội Nổi Bật
    const teamBoxY = 190;
    const teamBoxH = 68;
    ctx.fillStyle = '#8d2341';
    ctx.beginPath();
    ctx.roundRect(70, teamBoxY, width - 140, teamBoxH, 16);
    ctx.fill();

    ctx.fillStyle = '#ffd17a';
    ctx.font = 'bold 29px system-ui, Arial, sans-serif';
    ctx.fillText(teamName.toUpperCase(), width / 2, teamBoxY + 44);

    // 6. Khung chứa Mã QR trắng tinh có bóng đổ
    const qrBoxX = (width - 430) / 2;
    const qrBoxY = 280;
    const qrBoxSize = 430;

    ctx.shadowColor = 'rgba(141, 35, 65, 0.15)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#f1e2dd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.stroke();

    // Vẽ QR code
    ctx.drawImage(qrCanvas, qrBoxX + 35, qrBoxY + 35, 360, 360);

    // 7. Huy hiệu Khối lớp
    ctx.fillStyle = '#fff7ed';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect((width - 260) / 2, 730, 260, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 15px system-ui, Arial, sans-serif';
    ctx.fillText(`CHI ĐỘI KHỐI ${grade} • NĂM HỌC 2026-2027`, width / 2, 754);

    // 8. Hướng dẫn quét mã
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 19px system-ui, Arial, sans-serif';
    ctx.fillText('📱 DÙNG CAMERA ĐIỆN THOẠI HOẶC ZALO ĐỂ QUÉT', width / 2, 804);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px system-ui, Arial, sans-serif';
    ctx.fillText('Quét mã để truy cập ngay vào phòng thi dành riêng cho Chi đội', width / 2, 830);

    // Link URL rút gọn
    ctx.fillStyle = '#8d2341';
    ctx.font = '13px monospace';
    const displayUrl = teamUrl.length > 70 ? (teamUrl.substring(0, 68) + '...') : teamUrl;
    ctx.fillText(displayUrl, width / 2, 862);

    // 9. Lời chúc bế mạc
    ctx.fillStyle = '#b45309';
    ctx.font = 'italic bold 16px system-ui, Arial, sans-serif';
    ctx.fillText('⭐ Chúc Chi đội đoàn kết, tự tin và giải mã thành công mật thư! ⭐', width / 2, 915);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px system-ui, Arial, sans-serif';
    ctx.fillText('Trường THCS Tân Hải • Ngày Nhà Giáo Việt Nam 20/11', width / 2, 946);

    // Kích hoạt tải ảnh PNG
    const link = document.createElement('a');
    link.download = `The_QR_20_11_${className}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Tải hàng loạt ảnh thẻ QR của các lớp đang lọc
  async function downloadAllFilteredQrPng() {
    const allTeams = (window.MatThuData && typeof window.MatThuData.getAllClassesList === 'function')
      ? window.MatThuData.getAllClassesList()
      : [];

    const filtered = allTeams.filter(isTeamMatchingFilter);

    if (filtered.length === 0) {
      if (typeof window.showToast === 'function') window.showToast('Không có lớp nào trong danh sách lọc!', 'info');
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`📥 Bắt đầu tải loạt ${filtered.length} ảnh thẻ QR...`, 'info');
    }

    const baseUrl = await getBaseGameUrl();

    for (let i = 0; i < filtered.length; i++) {
      const item = filtered[i];
      const teamUrl = `${baseUrl}?grade=${item.grade}&class=${encodeURIComponent(item.className)}&team=${encodeURIComponent(item.teamName)}`;
      await downloadTeamQrPng(item.className, item.grade, item.teamName, teamUrl);
      await new Promise(r => setTimeout(r, 300));
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`✅ Đã tải xong ${filtered.length} thẻ mã QR dạng ảnh PNG!`, 'success');
    }
  }

  // ============================================================================
  // TAB 3: 5 TRẠM KIỂM SOÁT SÂN TRƯỜNG (4 MÃ QR CHO 4 KHỐI 6, 7, 8, 9 MỖI TRẠM)
  // ============================================================================

  function getGradeColor(grade) {
    const g = Number(grade);
    if (g === 6) return '#0284c7';
    if (g === 7) return '#16a34a';
    if (g === 8) return '#ea580c';
    if (g === 9) return '#9333ea';
    return '#8d2341';
  }

  // Render 5 Trạm sân trường với 4 Mã QR riêng biệt cho từng khối
  async function renderStationCards() {
    const container = document.getElementById('matThuStationsGrid');
    if (!container) return;

    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    const baseUrl = await getBaseGameUrl();

    container.innerHTML = '';

    // Render Sơ đồ 2D trong Tab Áp phích
    const tabMapContainer = document.getElementById('matThuStationsTabMapContainer');
    if (tabMapContainer && typeof renderSchoolMapSvg === 'function') {
      renderSchoolMapSvg(tabMapContainer, -1, false);
    }

    stations.forEach(st => {
      const card = document.createElement('div');
      card.className = 'station-card';

      card.innerHTML = `
        <div class="station-card-header" style="justify-content: center;">
          <span class="station-card-icon">${st.icon}</span>
          <h4 class="station-card-title">${st.title}</h4>
        </div>
        <div class="station-card-location">📍 ${st.location}</div>
        <div class="station-card-top-badges">
          <span class="station-code-pill">★ MẢNH: <strong>${st.code}</strong></span>
          <span class="station-pin-pill" style="margin-bottom: 0;">🔑 MÃ PIN DỰ PHÒNG: <strong>${st.pin}</strong></span>
        </div>
        <p class="station-card-desc" style="margin-bottom: 8px;">${st.desc}</p>

        <!-- Lưới 4 Mã QR đại diện cho 4 Khối -->
        <div class="station-qr-quad">
          ${[6, 7, 8, 9].map(g => `
            <div class="station-grade-item">
              <span class="station-grade-badge k${g}">🎓 Khối ${g}</span>
              <span class="station-grade-classes">(${g}A1 - ${g}B4)</span>
              <div id="st_${st.stationId}_qr_k${g}" class="station-qr-subbox" title="Mã QR Trạm ${st.stationId} - Khối ${g}"></div>
              <div class="station-sub-actions">
                <button type="button" class="btn-station-sub-dl" onclick="MatThuCoordinator.downloadStationGradeQrPng(${st.stationId}, ${g})" title="Tải ảnh PNG riêng mã QR khối ${g}">
                  📥 Tải QR K${g}
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 8px; width: 100%; justify-content: center; margin-top: auto; flex-wrap: wrap;">
          <button type="button" class="btn-matthu-primary" style="font-size: 0.82rem; padding: 6px 14px;" onclick="MatThuCoordinator.printSingleStationPoster(${st.stationId})" title="In áp phích khổ A4 gồm 4 khối">
            🖨️ In Áp Phích Trạm (A4)
          </button>
          <button type="button" class="btn-matthu-download" style="font-size: 0.82rem; padding: 6px 14px;" onclick="MatThuCoordinator.downloadStationPosterPng(${st.stationId})" title="Tải ảnh PNG áp phích 4 khối chất lượng cao">
            📥 Tải Áp Phích (PNG)
          </button>
        </div>
      `;

      container.appendChild(card);

      // Tạo 4 mã QR cho 4 khối
      setTimeout(() => {
        [6, 7, 8, 9].forEach(g => {
          const qrId = `st_${st.stationId}_qr_k${g}`;
          const box = document.getElementById(qrId);
          const checkinUrl = `${baseUrl}?game=mat_thu&station=${st.stationId}&grade=${g}&checkin=TRAM${st.stationId}_K${g}`;
          if (box && typeof QRCode !== 'undefined') {
            new QRCode(box, {
              text: checkinUrl,
              width: 104,
              height: 104,
              colorDark: getGradeColor(g),
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          }
        });
      }, 20);
    });
  }

  // Tải 1 Áp phích Trạm A4 dạng PNG (chứa trọn bộ 4 mã QR của 4 khối 6, 7, 8, 9)
  async function downloadStationPosterPng(stationId) {
    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    const st = stations.find(s => s.stationId === Number(stationId));
    if (!st) return;

    const baseUrl = await getBaseGameUrl();

    // Chuẩn bị 4 Canvas QR cho 4 khối
    const qr6 = await createQrCanvas(`${baseUrl}?game=mat_thu&station=${st.stationId}&grade=6&checkin=TRAM${st.stationId}_K6`, 300, getGradeColor(6));
    const qr7 = await createQrCanvas(`${baseUrl}?game=mat_thu&station=${st.stationId}&grade=7&checkin=TRAM${st.stationId}_K7`, 300, getGradeColor(7));
    const qr8 = await createQrCanvas(`${baseUrl}?game=mat_thu&station=${st.stationId}&grade=8&checkin=TRAM${st.stationId}_K8`, 300, getGradeColor(8));
    const qr9 = await createQrCanvas(`${baseUrl}?game=mat_thu&station=${st.stationId}&grade=9&checkin=TRAM${st.stationId}_K9`, 300, getGradeColor(9));

    const width = 1200;
    const height = 1700;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Nền sáng ấm áp
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#fff9f0');
    bgGrad.addColorStop(1, '#fff1f3');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Viền khung áp phích
    ctx.strokeStyle = '#8d2341';
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(38, 38, width - 76, height - 76);

    // Tiêu đề trường & trò chơi
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 26px system-ui, Arial, sans-serif';
    ctx.fillText('LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI', width / 2, 85);

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 34px system-ui, Arial, sans-serif';
    ctx.fillText('TRÒ CHƠI LỚN 20/11: GIẢI MÃ MẬT THƯ', width / 2, 130);

    // Tên Trạm & Icon
    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 42px system-ui, Arial, sans-serif';
    ctx.fillText(`${st.icon} ${st.title}`, width / 2, 195);

    // Vị trí Trạm
    const locBoxY = 225;
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(160, locBoxY, width - 320, 50, 25);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 22px system-ui, Arial, sans-serif';
    ctx.fillText(`📍 VỊ TRÍ: ${st.location.toUpperCase()}`, width / 2, locBoxY + 33);

    // Dòng hướng dẫn quét theo khối
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 19px system-ui, Arial, sans-serif';
    ctx.fillText('CHI ĐỘI QUÉT ĐÚNG MÃ QR THEO KHỐI LỚP ĐỂ NHẬN THỬ THÁCH TRẠM NÀY', width / 2, 310);

    // Vẽ 4 Hộp Thẻ QR cho 4 Khối theo dạng lưới 2x2
    const gradeCards = [
      { grade: 6, label: 'KHỐI 6 (6A1 - 6B4)', color: '#0284c7', qr: qr6, x: 60, y: 340 },
      { grade: 7, label: 'KHỐI 7 (7A1 - 7B4)', color: '#16a34a', qr: qr7, x: 620, y: 340 },
      { grade: 8, label: 'KHỐI 8 (8A1 - 8B4)', color: '#ea580c', qr: qr8, x: 60, y: 860 },
      { grade: 9, label: 'KHỐI 9 (9A1 - 9B4)', color: '#9333ea', qr: qr9, x: 620, y: 860 }
    ];

    const cardW = 520;
    const cardH = 490;

    gradeCards.forEach(c => {
      // Hộp card trắng
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, cardW, cardH, 20);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, cardW, cardH, 20);
      ctx.stroke();

      // Header của card khối
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, cardW, 58, [20, 20, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, Arial, sans-serif';
      ctx.fillText(`🎓 ${c.label}`, c.x + cardW / 2, c.y + 38);

      // Vẽ mã QR
      if (c.qr) {
        ctx.drawImage(c.qr, c.x + (cardW - 300) / 2, c.y + 80, 300, 300);
      }

      // Caption dưới QR
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 18px system-ui, Arial, sans-serif';
      ctx.fillText(`Quét mở thử thách Trạm ${st.stationId} (Khối ${c.grade})`, c.x + cardW / 2, c.y + 420);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace, Arial, sans-serif';
      ctx.fillText(`Token: TRAM${st.stationId}_K${c.grade}`, c.x + cardW / 2, c.y + 455);
    });

    // Phần chân Áp phích: Mảnh Mật Mã & PIN Dự Phòng
    const footY = 1390;

    // Mảnh Mật Mã
    ctx.fillStyle = '#fdf2f4';
    ctx.strokeStyle = '#8d2341';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, footY, 420, 70, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 24px system-ui, Arial, sans-serif';
    ctx.fillText(`★ MẢNH MẬT MÃ: ${st.code} ★`, 350, footY + 44);

    // PIN Dự Phòng
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(640, footY, 420, 70, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px monospace, Arial, sans-serif';
    ctx.fillText(`🔑 PIN DỰ PHÒNG: ${st.pin}`, 850, footY + 44);

    // Lưu ý quy chế thi đấu
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 17px system-ui, Arial, sans-serif';
    ctx.fillText(`⚠️ Lưu ý: Chi đội thuộc khối nào chỉ quét đúng mã QR của khối đó. Hoàn thành trạm ${st.stationId} mới được mở mật thư sang trạm tiếp theo!`, width / 2, 1510);

    // Chân trang bản quyền
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px system-ui, Arial, sans-serif';
    ctx.fillText('Trường THCS Tân Hải • Ngày Nhà Giáo Việt Nam 20/11', width / 2, 1630);

    const link = document.createElement('a');
    link.download = `Ap_Phich_Tram_${st.stationId}_4_Khoi_${st.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Tải riêng thẻ QR của 1 khối tại 1 trạm
  async function downloadStationGradeQrPng(stationId, grade) {
    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    const st = stations.find(s => s.stationId === Number(stationId));
    if (!st) return;

    const baseUrl = await getBaseGameUrl();
    const gColor = getGradeColor(grade);
    const checkinUrl = `${baseUrl}?game=mat_thu&station=${st.stationId}&grade=${grade}&checkin=TRAM${st.stationId}_K${grade}`;
    const qrCanvas = await createQrCanvas(checkinUrl, 380, gColor);
    if (!qrCanvas) return;

    const width = 750;
    const height = 1050;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Nền trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = gColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 22px system-ui, Arial, sans-serif';
    ctx.fillText('TRƯỜNG THCS TÂN HẢI - TRÒ CHƠI LỚN 20/11', width / 2, 70);

    ctx.fillStyle = gColor;
    ctx.font = 'bold 36px system-ui, Arial, sans-serif';
    ctx.fillText(`${st.icon} ${st.title}`, width / 2, 125);

    // Khối badge
    ctx.fillStyle = gColor;
    ctx.beginPath();
    ctx.roundRect(140, 150, width - 280, 56, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, Arial, sans-serif';
    ctx.fillText(`🎓 DÀNH CHO KHỐI ${grade} (${grade}A1 - ${grade}B4)`, width / 2, 188);

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 18px system-ui, Arial, sans-serif';
    ctx.fillText(`📍 Vị trí: ${st.location}`, width / 2, 245);

    // QR box
    const qrBoxSize = 420;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = 270;
    ctx.drawImage(qrCanvas, qrX + 20, qrY + 20, 380, 380);

    // PIN & Mật mã
    ctx.fillStyle = '#fdf2f4';
    ctx.strokeStyle = '#8d2341';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(120, 740, width - 240, 70, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8d2341';
    ctx.font = 'bold 22px system-ui, Arial, sans-serif';
    ctx.fillText(`🔑 MÃ PIN DỰ PHÒNG: ${st.pin}  •  ★ MẢNH: ${st.code}`, width / 2, 784);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px system-ui, Arial, sans-serif';
    ctx.fillText('Chi đội quét mã QR để mở khóa đề thi Trạm này.', width / 2, 860);

    const link = document.createElement('a');
    link.download = `The_QR_Tram_${st.stationId}_Khoi_${grade}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Tải trọn bộ 5 áp phích trạm
  async function downloadAllStationPostersPng() {
    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    if (typeof window.showToast === 'function') {
      window.showToast(`📥 Bắt đầu tải bộ 5 áp phích trạm (mỗi trạm 4 khối)...`, 'info');
    }
    for (let i = 0; i < stations.length; i++) {
      await downloadStationPosterPng(stations[i].stationId);
      await new Promise(r => setTimeout(r, 400));
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`✅ Đã tải xong 5 áp phích trạm dạng PNG!`, 'success');
    }
  }

  // In trọn bộ 5 áp phích trạm khổ A4 (Mỗi trạm 1 tờ A4 gồm cả 4 khối)
  async function printAllStationPosters() {
    const printArea = document.getElementById('matThuPrintArea');
    if (!printArea) return;

    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    const baseUrl = await getBaseGameUrl();

    let html = '';
    stations.forEach(st => {
      html += `
        <div class="station-poster-page">
          <div class="station-poster-header">
            <h2>LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI</h2>
            <h3>TRÒ CHƠI LỚN 20/11: GIẢI MÃ MẬT THƯ</h3>
          </div>
          <div class="station-poster-title">${st.icon} ${st.title}</div>
          <div class="station-poster-loc">📍 VỊ TRÍ: ${st.location.toUpperCase()}</div>
          <div class="station-poster-sub">HỌC SINH QUÉT ĐÚNG MÃ QR THEO KHỐI LỚP ĐỂ NHẬN ĐỀ THI TRẠM NÀY</div>

          <div class="station-poster-grid-4">
            <div class="poster-grade-card k6">
              <div class="poster-grade-header" style="background:#0284c7; color:#fff;">🎓 KHỐI 6 (6A1 - 6B4)</div>
              <div id="print_st_${st.stationId}_k6" class="poster-qr-cell"></div>
              <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K6)</div>
            </div>
            <div class="poster-grade-card k7">
              <div class="poster-grade-header" style="background:#16a34a; color:#fff;">🎓 KHỐI 7 (7A1 - 7B4)</div>
              <div id="print_st_${st.stationId}_k7" class="poster-qr-cell"></div>
              <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K7)</div>
            </div>
            <div class="poster-grade-card k8">
              <div class="poster-grade-header" style="background:#ea580c; color:#fff;">🎓 KHỐI 8 (8A1 - 8B4)</div>
              <div id="print_st_${st.stationId}_k8" class="poster-qr-cell"></div>
              <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K8)</div>
            </div>
            <div class="poster-grade-card k9">
              <div class="poster-grade-header" style="background:#7e22ce; color:#fff;">🎓 KHỐI 9 (9A1 - 9B4)</div>
              <div id="print_st_${st.stationId}_k9" class="poster-qr-cell"></div>
              <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K9)</div>
            </div>
          </div>

          <div class="station-poster-footer-row">
            <div class="station-poster-code-badge">★ Mảnh Mật Mã: <strong>${st.code}</strong></div>
            <div class="station-poster-pin-badge">🔑 PIN Dự Phòng: <strong>${st.pin}</strong></div>
          </div>
          <div class="station-poster-warning">
            ⚠️ <strong>Lưu ý:</strong> Mỗi Chi đội chỉ quét đúng mã QR của khối mình. Trả lời xong các câu hỏi của trạm này mới được mở mật thư di chuyển sang trạm tiếp theo!
          </div>
        </div>
      `;
    });

    printArea.innerHTML = html;

    stations.forEach(st => {
      [6, 7, 8, 9].forEach(g => {
        const box = document.getElementById(`print_st_${st.stationId}_k${g}`);
        const checkinUrl = `${baseUrl}?game=mat_thu&station=${st.stationId}&grade=${g}&checkin=TRAM${st.stationId}_K${g}`;
        if (box && typeof QRCode !== 'undefined') {
          new QRCode(box, {
            text: checkinUrl,
            width: 140,
            height: 140,
            colorDark: getGradeColor(g),
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      });
    });

    setTimeout(() => {
      window.print();
    }, 500);
  }

  // In 1 áp phích trạm đơn lẻ khổ A4 (Gồm 4 khối)
  async function printSingleStationPoster(stationId) {
    const printArea = document.getElementById('matThuPrintArea');
    const stations = (window.MatThuData && window.MatThuData.STATIONS_CONFIG) || [];
    const st = stations.find(s => s.stationId === Number(stationId));
    if (!printArea || !st) return;

    const baseUrl = await getBaseGameUrl();

    printArea.innerHTML = `
      <div class="station-poster-page">
        <div class="station-poster-header">
          <h2>LIÊN ĐỘI TRƯỜNG THCS TÂN HẢI</h2>
          <h3>TRÒ CHƠI LỚN 20/11: GIẢI MÃ MẬT THƯ</h3>
        </div>
        <div class="station-poster-title">${st.icon} ${st.title}</div>
        <div class="station-poster-loc">📍 VỊ TRÍ: ${st.location.toUpperCase()}</div>
        <div class="station-poster-sub">HỌC SINH QUÉT ĐÚNG MÃ QR THEO KHỐI LỚP ĐỂ NHẬN ĐỀ THI TRẠM NÀY</div>

        <div class="station-poster-grid-4">
          <div class="poster-grade-card k6">
            <div class="poster-grade-header" style="background:#0284c7; color:#fff;">🎓 KHỐI 6 (6A1 - 6B4)</div>
            <div id="print_single_st_${st.stationId}_k6" class="poster-qr-cell"></div>
            <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K6)</div>
          </div>
          <div class="poster-grade-card k7">
            <div class="poster-grade-header" style="background:#16a34a; color:#fff;">🎓 KHỐI 7 (7A1 - 7B4)</div>
            <div id="print_single_st_${st.stationId}_k7" class="poster-qr-cell"></div>
            <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K7)</div>
          </div>
          <div class="poster-grade-card k8">
            <div class="poster-grade-header" style="background:#ea580c; color:#fff;">🎓 KHỐI 8 (8A1 - 8B4)</div>
            <div id="print_single_st_${st.stationId}_k8" class="poster-qr-cell"></div>
            <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K8)</div>
          </div>
          <div class="poster-grade-card k9">
            <div class="poster-grade-header" style="background:#7e22ce; color:#fff;">🎓 KHỐI 9 (9A1 - 9B4)</div>
            <div id="print_single_st_${st.stationId}_k9" class="poster-qr-cell"></div>
            <div class="poster-grade-foot">Quét mở đề thi Trạm ${st.stationId} (K9)</div>
          </div>
        </div>

        <div class="station-poster-footer-row">
          <div class="station-poster-code-badge">★ Mảnh Mật Mã: <strong>${st.code}</strong></div>
          <div class="station-poster-pin-badge">🔑 PIN Dự Phòng: <strong>${st.pin}</strong></div>
        </div>
        <div class="station-poster-warning">
          ⚠️ <strong>Lưu ý:</strong> Mỗi Chi đội chỉ quét đúng mã QR của khối mình. Trả lời xong các câu hỏi của trạm này mới được mở mật thư di chuyển sang trạm tiếp theo!
        </div>
      </div>
    `;

    setTimeout(() => {
      [6, 7, 8, 9].forEach(g => {
        const box = document.getElementById(`print_single_st_${st.stationId}_k${g}`);
        const checkinUrl = `${baseUrl}?game=mat_thu&station=${st.stationId}&grade=${g}&checkin=TRAM${st.stationId}_K${g}`;
        if (box && typeof QRCode !== 'undefined') {
          new QRCode(box, {
            text: checkinUrl,
            width: 140,
            height: 140,
            colorDark: getGradeColor(g),
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      });
      setTimeout(() => window.print(), 300);
    }, 100);
  }

  // ============================================================================
  // TAB 5: QUẢN LÝ CÂU HỎI THEO 4 KHỐI & 5 TRẠM (SOẠN THẢO, LƯU, SAO LƯU JSON)
  // ============================================================================
  let editorGrade = 6;
  let editorStationId = 1;
  let workingQuestions = null;

  function ensureWorkingQuestions() {
    if (!workingQuestions) {
      workingQuestions = JSON.parse(JSON.stringify(window.MatThuData.getCurrentQuestions()));
    }
    return workingQuestions;
  }

  function selectEditorGrade(grade) {
    saveCurrentEditorDomToWorking();
    editorGrade = parseInt(grade, 10);
    document.querySelectorAll('.q-grade-chip').forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.getAttribute('data-grade'), 10) === editorGrade);
    });
    renderQuestionsEditor();
  }

  function selectEditorStation(stationId) {
    saveCurrentEditorDomToWorking();
    editorStationId = parseInt(stationId, 10);
    document.querySelectorAll('.q-station-chip').forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.getAttribute('data-station'), 10) === editorStationId);
    });
    renderQuestionsEditor();
  }

  function saveCurrentEditorDomToWorking() {
    ensureWorkingQuestions();
    const listEl = document.getElementById('matThuQuestionsEditorList');
    if (!listEl) return;

    const cards = listEl.querySelectorAll('.q-editor-card');
    const newItems = [];

    cards.forEach(card => {
      const textarea = card.querySelector('.q-text-textarea');
      const qText = textarea ? textarea.value.trim() : '';

      const timeSelect = card.querySelector('.q-time-select');
      const timeLimit = timeSelect ? parseInt(timeSelect.value, 10) : 45;

      const diffSelect = card.querySelector('.q-diff-select');
      const difficulty = diffSelect ? diffSelect.value : 'medium';

      const ptsInput = card.querySelector('.q-points-input');
      const points = ptsInput ? parseInt(ptsInput.value, 10) : 10;

      const optInputs = card.querySelectorAll('.q-opt-input');
      const opts = [];
      optInputs.forEach(inp => opts.push(inp.value.trim()));
      while (opts.length < 4) opts.push(`Đáp án ${opts.length + 1}`);

      const checkedRadio = card.querySelector('input[type="radio"]:checked');
      const correctIdx = checkedRadio ? parseInt(checkedRadio.value, 10) : 0;

      const expInput = card.querySelector('.q-exp-input');
      const explain = expInput ? expInput.value.trim() : '';

      newItems.push([qText, opts, correctIdx, explain, { timeLimit, difficulty, points }]);
    });

    const gObj = workingQuestions[editorGrade] || workingQuestions[String(editorGrade)];
    if (gObj && gObj.stages) {
      const stObj = gObj.stages.find(s => s.stageId === editorStationId) || gObj.stages[editorStationId - 1];
      if (stObj) {
        stObj.items = newItems;
      }
    }
  }

  function renderQuestionsEditor() {
    ensureWorkingQuestions();
    const listEl = document.getElementById('matThuQuestionsEditorList');
    const metaEl = document.getElementById('matThuQuestionsMetaBar');
    if (!listEl) return;

    const gObj = workingQuestions[editorGrade] || workingQuestions[String(editorGrade)];
    if (!gObj || !gObj.stages) {
      listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Không tìm thấy dữ liệu khối ' + editorGrade + '</div>';
      return;
    }

    const stObj = gObj.stages.find(s => s.stageId === editorStationId) || gObj.stages[editorStationId - 1];
    if (!stObj) {
      listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Không tìm thấy dữ liệu trạm ' + editorStationId + '</div>';
      return;
    }

    const stInfo = (window.MatThuData.STATIONS_CONFIG || []).find(s => s.stationId === editorStationId) || {};

    if (metaEl) {
      const totalPts = (stObj.items || []).reduce((sum, item) => {
        const meta = (item[4] && typeof item[4] === 'object') ? item[4] : {};
        return sum + (typeof meta.points === 'number' ? meta.points : 10);
      }, 0);

      metaEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <strong style="color: #8d2341; font-size: 1.05rem;">🎓 KHỐI ${editorGrade} • ${stObj.name.toUpperCase()}</strong>
          <span style="background: #fdf2f4; color: #8d2341; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; border: 1px solid #fecdd3;">
            ★ Mảnh Mật Mã: ${stObj.code}
          </span>
          <span style="color: #64748b; font-size: 0.82rem;">📍 ${stInfo.location || 'Sân trường'}</span>
          <span style="color: #854d0e; font-size: 0.82rem; font-weight: 700; background: #fef9c3; padding: 2px 7px; border-radius: 4px; border: 1px solid #fde047;">
            🔑 PIN: ${stInfo.pin || '2011'}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-weight: 700; color: #15803d; font-size: 0.85rem;">
            📊 ${stObj.items.length} câu hỏi (${totalPts} điểm)
          </span>
          <button type="button" class="btn-matthu-primary" style="font-size: 0.8rem; padding: 5px 12px; background: linear-gradient(135deg, #0284c7, #0369a1);" onclick="MatThuCoordinator.openPrintJudgeModal()" title="In phiếu câu hỏi & đáp án dự phòng khổ A4 cho Ban Giám Khảo">
            🖨️ In Phiếu BGK (A4)
          </button>
        </div>
      `;
    }

    if (!stObj.items || stObj.items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1.5px dashed #cbd5e1;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
          <h4 style="margin: 0 0 6px; color: #8d2341;">Trạm này chưa có câu hỏi nào!</h4>
          <p style="margin: 0 0 14px; font-size: 0.85rem; color: #64748b;">Thầy/Cô hãy bấm nút bên dưới để thêm câu hỏi đầu tiên cho Trạm ${editorStationId} - Khối ${editorGrade}.</p>
          <button type="button" class="btn-matthu-primary" onclick="MatThuCoordinator.addNewQuestion()">➕ Thêm Câu Hỏi Mới</button>
        </div>
      `;
      return;
    }

    let html = '';
    stObj.items.forEach((item, idx) => {
      const qText = item[0] || '';
      const opts = item[1] || ['A', 'B', 'C', 'D'];
      const correctIdx = typeof item[2] === 'number' ? item[2] : 0;
      const explain = item[3] || '';
      const meta = (item[4] && typeof item[4] === 'object') ? item[4] : {};
      const timeLimit = meta.timeLimit || (typeof item[4] === 'number' ? item[4] : 45);
      const difficulty = meta.difficulty || (typeof item[5] === 'string' ? item[5] : 'medium');
      const points = typeof meta.points === 'number' ? meta.points : (typeof item[6] === 'number' ? item[6] : 10);

      html += `
        <div class="q-editor-card" data-index="${idx}">
          <div class="q-card-head">
            <div class="q-card-title">
              <span>❓ CÂU HỎI ${idx + 1}</span>
              <span class="q-station-pill">Trạm ${editorStationId}</span>
              <span class="q-grade-pill">Khối ${editorGrade}</span>
            </div>
            <div class="q-card-actions">
              <button type="button" class="btn-q-action" onclick="MatThuCoordinator.moveQuestion(${idx}, -1)" title="Di chuyển câu hỏi lên trên" ${idx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>⬆️ Lên</button>
              <button type="button" class="btn-q-action" onclick="MatThuCoordinator.moveQuestion(${idx}, 1)" title="Di chuyển câu hỏi xuống dưới" ${idx === stObj.items.length - 1 ? 'disabled style="opacity: 0.4;"' : ''}>⬇️ Xuống</button>
              <button type="button" class="btn-q-action btn-q-delete" onclick="MatThuCoordinator.deleteQuestion(${idx})" title="Xóa câu hỏi này">🗑️ Xóa</button>
            </div>
          </div>

          <!-- Cấu hình thông số câu hỏi: Thời gian suy nghĩ, Độ khó, Điểm số -->
          <div class="q-meta-settings-row">
            <div class="q-meta-field">
              <label class="q-meta-label">⏱️ Thời gian suy nghĩ:</label>
              <select class="q-meta-select q-time-select">
                <option value="15" ${timeLimit === 15 ? 'selected' : ''}>15 giây</option>
                <option value="20" ${timeLimit === 20 ? 'selected' : ''}>20 giây</option>
                <option value="30" ${timeLimit === 30 ? 'selected' : ''}>30 giây</option>
                <option value="45" ${timeLimit === 45 ? 'selected' : ''}>45 giây (Chuẩn)</option>
                <option value="60" ${timeLimit === 60 ? 'selected' : ''}>60 giây (1 phút)</option>
                <option value="90" ${timeLimit === 90 ? 'selected' : ''}>90 giây (1.5 phút)</option>
                <option value="120" ${timeLimit === 120 ? 'selected' : ''}>120 giây (2 phút)</option>
              </select>
            </div>
            <div class="q-meta-field">
              <label class="q-meta-label">⭐ Mức độ câu hỏi:</label>
              <select class="q-meta-select q-diff-select">
                <option value="easy" ${difficulty === 'easy' ? 'selected' : ''}>🟢 Dễ (Nhận biết)</option>
                <option value="medium" ${difficulty === 'medium' ? 'selected' : ''}>🟡 Trung bình (Thông hiểu)</option>
                <option value="hard" ${difficulty === 'hard' ? 'selected' : ''}>🟠 Khó (Vận dụng)</option>
                <option value="expert" ${difficulty === 'expert' ? 'selected' : ''}>🔴 Rất khó (Vận dụng cao)</option>
              </select>
            </div>
            <div class="q-meta-field">
              <label class="q-meta-label">🏆 Điểm số:</label>
              <div style="display: flex; align-items: center; gap: 4px;">
                <input type="number" class="q-meta-input q-points-input" min="1" max="100" value="${points}" step="1">
                <span style="font-size: 0.8rem; font-weight: 700; color: #64748b;">điểm</span>
              </div>
            </div>
          </div>

          <label style="font-size: 0.8rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Nội dung câu hỏi:</label>
          <textarea class="q-text-textarea" placeholder="Nhập nội dung câu hỏi...">${escapeHtml(qText)}</textarea>

          <label style="font-size: 0.8rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            Các phương án trả lời (chọn nút tròn để đánh dấu ĐÁP ÁN ĐÚNG):
          </label>
          <div class="q-opts-grid">
            <div class="q-opt-item ${correctIdx === 0 ? 'is-correct' : ''}">
              <input type="radio" class="q-opt-radio" name="q_correct_${editorGrade}_${editorStationId}_${idx}" value="0" ${correctIdx === 0 ? 'checked' : ''} onchange="MatThuCoordinator.onRadioCorrectChange(this)" title="Đáp án đúng A">
              <span class="q-opt-letter">A.</span>
              <input type="text" class="q-opt-input" value="${escapeHtml(opts[0] || '')}" placeholder="Nội dung phương án A">
            </div>
            <div class="q-opt-item ${correctIdx === 1 ? 'is-correct' : ''}">
              <input type="radio" class="q-opt-radio" name="q_correct_${editorGrade}_${editorStationId}_${idx}" value="1" ${correctIdx === 1 ? 'checked' : ''} onchange="MatThuCoordinator.onRadioCorrectChange(this)" title="Đáp án đúng B">
              <span class="q-opt-letter">B.</span>
              <input type="text" class="q-opt-input" value="${escapeHtml(opts[1] || '')}" placeholder="Nội dung phương án B">
            </div>
            <div class="q-opt-item ${correctIdx === 2 ? 'is-correct' : ''}">
              <input type="radio" class="q-opt-radio" name="q_correct_${editorGrade}_${editorStationId}_${idx}" value="2" ${correctIdx === 2 ? 'checked' : ''} onchange="MatThuCoordinator.onRadioCorrectChange(this)" title="Đáp án đúng C">
              <span class="q-opt-letter">C.</span>
              <input type="text" class="q-opt-input" value="${escapeHtml(opts[2] || '')}" placeholder="Nội dung phương án C">
            </div>
            <div class="q-opt-item ${correctIdx === 3 ? 'is-correct' : ''}">
              <input type="radio" class="q-opt-radio" name="q_correct_${editorGrade}_${editorStationId}_${idx}" value="3" ${correctIdx === 3 ? 'checked' : ''} onchange="MatThuCoordinator.onRadioCorrectChange(this)" title="Đáp án đúng D">
              <span class="q-opt-letter">D.</span>
              <input type="text" class="q-opt-input" value="${escapeHtml(opts[3] || '')}" placeholder="Nội dung phương án D">
            </div>
          </div>

          <div class="q-exp-row">
            <span class="q-exp-label">💡 Lời giải thích / Gợi ý kiến thức:</span>
            <input type="text" class="q-exp-input" value="${escapeHtml(explain)}" placeholder="Nhập gợi ý kiến thức hoặc thông điệp giáo dục tri ân thầy cô...">
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  function onRadioCorrectChange(radioEl) {
    if (!radioEl) return;
    const card = radioEl.closest('.q-editor-card');
    if (!card) return;
    card.querySelectorAll('.q-opt-item').forEach(item => item.classList.remove('is-correct'));
    const parentItem = radioEl.closest('.q-opt-item');
    if (parentItem) parentItem.classList.add('is-correct');
  }

  function addNewQuestion() {
    saveCurrentEditorDomToWorking();
    ensureWorkingQuestions();
    const gObj = workingQuestions[editorGrade] || workingQuestions[String(editorGrade)];
    if (!gObj || !gObj.stages) return;
    const stObj = gObj.stages.find(s => s.stageId === editorStationId) || gObj.stages[editorStationId - 1];
    if (!stObj) return;

    stObj.items.push([
      'Nội dung câu hỏi mới...',
      ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      0,
      'Gợi ý và giải thích kiến thức cho câu hỏi này.',
      { timeLimit: 45, difficulty: 'medium', points: 10 }
    ]);

    renderQuestionsEditor();

    // Cuộn xuống câu mới
    setTimeout(() => {
      const listEl = document.getElementById('matThuQuestionsEditorList');
      if (listEl && listEl.lastElementChild) {
        listEl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = listEl.lastElementChild.querySelector('.q-text-textarea');
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }
    }, 100);

    if (typeof window.showToast === 'function') {
      window.showToast(`➕ Đã thêm câu hỏi mới vào Trạm ${editorStationId}!`, 'info');
    }
  }

  function deleteQuestion(index) {
    saveCurrentEditorDomToWorking();
    ensureWorkingQuestions();
    const gObj = workingQuestions[editorGrade] || workingQuestions[String(editorGrade)];
    if (!gObj || !gObj.stages) return;
    const stObj = gObj.stages.find(s => s.stageId === editorStationId) || gObj.stages[editorStationId - 1];
    if (!stObj || !stObj.items[index]) return;

    if (confirm(`Thầy/Cô có chắc chắn muốn xóa Câu hỏi ${index + 1}?`)) {
      stObj.items.splice(index, 1);
      renderQuestionsEditor();
      if (typeof window.showToast === 'function') {
        window.showToast(`🗑️ Đã xóa câu hỏi khỏi Trạm ${editorStationId}!`, 'info');
      }
    }
  }

  function moveQuestion(index, direction) {
    saveCurrentEditorDomToWorking();
    ensureWorkingQuestions();
    const gObj = workingQuestions[editorGrade] || workingQuestions[String(editorGrade)];
    if (!gObj || !gObj.stages) return;
    const stObj = gObj.stages.find(s => s.stageId === editorStationId) || gObj.stages[editorStationId - 1];
    if (!stObj) return;

    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= stObj.items.length) return;

    const temp = stObj.items[index];
    stObj.items[index] = stObj.items[targetIdx];
    stObj.items[targetIdx] = temp;

    renderQuestionsEditor();
  }

  function saveAllQuestions() {
    saveCurrentEditorDomToWorking();
    const ok = window.MatThuData.saveCustomQuestions(workingQuestions);
    if (ok) {
      if (typeof window.showToast === 'function') {
        window.showToast('💾 Đã lưu thành công ngân hàng câu hỏi vào bộ nhớ trình duyệt!', 'success');
      } else {
        alert('Đã lưu thành công ngân hàng câu hỏi!');
      }
      onGradeChange();
    } else {
      alert('Không thể lưu câu hỏi. Vui lòng kiểm tra dung lượng bộ nhớ trình duyệt!');
    }
  }

  function resetQuestionsToDefaultConfirm() {
    if (confirm('Thầy/Cô có chắc chắn muốn khôi phục lại toàn bộ ngân hàng câu hỏi gốc mặc định của trường THCS Tân Hải?\nMọi câu hỏi đã thêm hoặc sửa đổi sẽ trở về nội dung ban đầu!')) {
      window.MatThuData.resetQuestionsToDefault();
      workingQuestions = null;
      renderQuestionsEditor();
      if (typeof window.showToast === 'function') {
        window.showToast('↺ Đã khôi phục câu hỏi về mặc định thành công!', 'success');
      }
    }
  }

  function exportQuestionsJson() {
    saveCurrentEditorDomToWorking();
    const jsonStr = JSON.stringify(workingQuestions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngan_hang_cau_hoi_mat_thu_4_khoi_5_tram.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (typeof window.showToast === 'function') {
      window.showToast('📥 Đã tải file JSON ngân hàng câu hỏi về máy!', 'success');
    }
  }

  function importQuestionsFile(event) {
    const file = event && event.target && event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && (parsed[6] || parsed['6'])) {
          window.MatThuData.saveCustomQuestions(parsed);
          workingQuestions = JSON.parse(JSON.stringify(parsed));
          renderQuestionsEditor();
          if (typeof window.showToast === 'function') {
            window.showToast('📤 Nạp ngân hàng câu hỏi từ file JSON thành công!', 'success');
          }
        } else {
          alert('Cấu trúc file JSON không hợp lệ! Vui lòng chọn file xuất từ hệ thống.');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================================================
  // IN PHIẾU CÂU HỎI & ĐÁP ÁN DỰ PHÒNG CHO BAN GIÁM KHẢO TRẠM (A4)
  // ============================================================================
  function openPrintJudgeModal() {
    saveCurrentEditorDomToWorking();
    const modal = document.getElementById('matThuPrintJudgeModal');
    const badge = document.getElementById('printOptCurrentBadge');
    const desc = document.getElementById('printOptCurrentDesc');
    const stInfo = (window.MatThuData.STATIONS_CONFIG || []).find(s => s.stationId === editorStationId) || {};

    if (badge) badge.textContent = `Trạm ${editorStationId} • Khối ${editorGrade}`;
    if (desc) desc.textContent = `In phiếu câu hỏi & đáp án dự phòng cho Trạm ${editorStationId} (${stInfo.title || ''}) - Khối ${editorGrade}.`;

    if (modal) modal.classList.add('active');
  }

  function closePrintJudgeModal() {
    const modal = document.getElementById('matThuPrintJudgeModal');
    if (modal) modal.classList.remove('active');
  }

  function buildJudgeSheetHtmlForGradeAndStation(grade, stationId) {
    ensureWorkingQuestions();
    const gObj = workingQuestions[grade] || workingQuestions[String(grade)];
    if (!gObj || !gObj.stages) return '';
    const stObj = gObj.stages.find(s => s.stageId === stationId) || gObj.stages[stationId - 1];
    if (!stObj) return '';

    const stInfo = (window.MatThuData.STATIONS_CONFIG || []).find(s => s.stationId === stationId) || {
      stationId: stationId,
      title: stObj.name || `Trạm ${stationId}`,
      location: 'Sân trường',
      pin: '2011',
      code: stObj.code || 'MATMA'
    };

    const items = stObj.items || [];
    const totalPts = items.reduce((sum, item) => {
      const meta = (item[4] && typeof item[4] === 'object') ? item[4] : {};
      return sum + (typeof meta.points === 'number' ? meta.points : 10);
    }, 0);

    return `
      <div class="judge-sheet-page">
        <!-- Đầu trang -->
        <div class="judge-sheet-header">
          <div class="judge-header-left">
            <div class="judge-org-name">TRƯỜNG THCS TÂN HẢI - LIÊN ĐỘI THCS TÂN HẢI</div>
            <div class="judge-sub-name">HỘI THI TRÒ CHƠI LỚN 20/11: "GIẢI MÃ MẬT THƯ"</div>
          </div>
          <div class="judge-header-right">
            <div class="judge-badge-station">TRẠM ${stInfo.stationId}: ${stInfo.title.toUpperCase()}</div>
            <div class="judge-badge-grade">KHỐI ${grade} (LỚP ${grade}A1 - ${grade}B4)</div>
          </div>
        </div>

        <div class="judge-doc-title">
          <h2>PHIẾU ĐỀ THI & ĐÁP ÁN DỰ PHÒNG CHO BAN GIÁM KHẢO TRẠM</h2>
          <div class="judge-doc-subtitle">
            (Tài liệu mật dành cho Trưởng trạm kiểm soát điều hành & chấm điểm dự phòng khi thiết bị học sinh gặp sự cố)
          </div>
        </div>

        <!-- Thông số trạm -->
        <div class="judge-info-bar">
          <div class="judge-info-item"><strong>📍 Vị trí:</strong> ${escapeHtml(stInfo.location || 'Sân trường')}</div>
          <div class="judge-info-item"><strong>🔑 Mã PIN mở trạm:</strong> <span class="judge-pin-tag">${stInfo.pin || '2011'}</span></div>
          <div class="judge-info-item"><strong>🧩 Mảnh Mật Mã cấp:</strong> <span class="judge-code-tag">${stObj.code || stInfo.code}</span></div>
          <div class="judge-info-item"><strong>📊 Tổng câu hỏi:</strong> ${items.length} câu (${totalPts} điểm)</div>
        </div>

        <!-- Bảng đáp án nhanh -->
        <div class="judge-quick-answers">
          <div class="quick-ans-title">⚡ BẢNG TRA CỨU ĐÁP ÁN NHANH TRẠM ${stInfo.stationId} (KHỐI ${grade}):</div>
          <div class="quick-ans-grid">
            ${items.map((item, idx) => `
              <div class="quick-ans-cell">
                <span class="qac-num">Câu ${idx + 1}:</span>
                <span class="qac-ans">${['A', 'B', 'C', 'D'][item[2] || 0]}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Danh sách câu hỏi chi tiết -->
        <div class="judge-questions-list">
          ${items.map((item, idx) => {
            const qText = item[0] || '';
            const opts = item[1] || ['A', 'B', 'C', 'D'];
            const correctIdx = typeof item[2] === 'number' ? item[2] : 0;
            const explain = item[3] || '';
            const meta = (item[4] && typeof item[4] === 'object') ? item[4] : {};
            const timeLimit = meta.timeLimit || 45;
            const diffText = formatDifficultyLabel(meta.difficulty || 'medium');
            const pts = typeof meta.points === 'number' ? meta.points : 10;

            return `
              <div class="judge-q-card">
                <div class="judge-q-head">
                  <span class="judge-q-num">CÂU ${idx + 1} (${pts}đ • ⏱️ ${timeLimit}s • ${diffText}):</span>
                  <span class="judge-q-text">${escapeHtml(qText)}</span>
                </div>
                <div class="judge-opts-grid">
                  ${opts.map((opt, oIdx) => {
                    const isCorrect = (oIdx === correctIdx);
                    return `
                      <div class="judge-opt-item ${isCorrect ? 'is-correct-print' : ''}">
                        <span class="j-opt-letter">${['A', 'B', 'C', 'D'][oIdx]}.</span>
                        <span class="j-opt-content">${escapeHtml(opt)}</span>
                        ${isCorrect ? '<span class="j-correct-tag">✓ ĐÚNG</span>' : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
                ${explain ? `
                  <div class="judge-q-explain">
                    <strong>💡 Gợi ý / Lời giải:</strong> ${escapeHtml(explain)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Bảng ghi nhận kết quả dự phòng thực địa -->
        <div class="judge-field-table-section">
          <div class="field-table-title">📋 BẢNG THEO DÕI & CHẤM ĐIỂM DỰ PHÒNG TẠI TRẠM (Trưởng trạm ghi nhận khi có sự cố thiết bị)</div>
          <table class="judge-table">
            <thead>
              <tr>
                <th style="width: 30px;">STT</th>
                <th style="width: 125px;">Tên Chi Đội (Lớp)</th>
                <th style="width: 80px;">Giờ đến</th>
                <th style="width: 85px;">Số câu đúng</th>
                <th style="width: 75px;">Tổng điểm</th>
                <th style="width: 90px;">Đã cấp mật mã</th>
                <th>Ghi chú / Nhận xét của Trưởng Trạm</th>
                <th style="width: 90px;">Chữ ký</th>
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6].map(r => `
                <tr>
                  <td style="text-align:center;">${r}</td>
                  <td></td>
                  <td></td>
                  <td style="text-align:center;">... / ${items.length}</td>
                  <td></td>
                  <td style="text-align:center;">[  ] Đã cấp</td>
                  <td></td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Chữ ký xác nhận -->
        <div class="judge-signatures">
          <div class="sig-box">
            <div class="sig-title">ĐẠI DIỆN BAN TỔ CHỨC HỘI THI</div>
            <div class="sig-note">(Ký và ghi rõ họ tên)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">TRƯỞNG TRẠM KIỂM SOÁT</div>
            <div class="sig-note">(Ký và ghi rõ họ tên)</div>
          </div>
        </div>
      </div>
    `;
  }

  function printJudgeSheet(mode) {
    saveCurrentEditorDomToWorking();
    ensureWorkingQuestions();
    const printArea = document.getElementById('matThuPrintArea');
    if (!printArea) return;

    let pagesHtml = '';

    if (mode === 'single') {
      pagesHtml = buildJudgeSheetHtmlForGradeAndStation(editorGrade, editorStationId);
    } else if (mode === 'station_all_grades') {
      [6, 7, 8, 9].forEach(g => {
        pagesHtml += buildJudgeSheetHtmlForGradeAndStation(g, editorStationId);
      });
    } else if (mode === 'grade_all_stations') {
      [1, 2, 3, 4, 5].forEach(s => {
        pagesHtml += buildJudgeSheetHtmlForGradeAndStation(editorGrade, s);
      });
    } else if (mode === 'all_full_pack') {
      [6, 7, 8, 9].forEach(g => {
        [1, 2, 3, 4, 5].forEach(s => {
          pagesHtml += buildJudgeSheetHtmlForGradeAndStation(g, s);
        });
      });
    }

    if (!pagesHtml) {
      alert('Không có dữ liệu câu hỏi để in!');
      return;
    }

    closePrintJudgeModal();
    printArea.innerHTML = pagesHtml;
    printArea.style.display = 'block';

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printArea.style.display = 'none';
        printArea.innerHTML = '';
      }, 1500);
    }, 150);

    if (typeof window.showToast === 'function') {
      window.showToast('🖨️ Đang mở lệnh in Phiếu câu hỏi & đáp án dự phòng...', 'success');
    }
  }

  // ============================================================================
  // MÃ PIN BẢO MẬT BAN GIÁM KHẢO (ĐẶT LẠI KẾT QUẢ THI ĐẤU)
  // ============================================================================
  const JUDGE_PIN_KEY = 'matthu_judge_pin';
  const DEFAULT_PIN = '2011';

  function openPinModal() {
    const modal = document.getElementById('matThuPinModal');
    const input = document.getElementById('matThuPinInput');
    const err = document.getElementById('matThuPinError');
    if (!modal) return;
    if (input) input.value = '';
    if (err) err.classList.add('hidden');
    modal.classList.add('open');
    setTimeout(() => {
      if (input) input.focus();
    }, 150);
  }

  function closePinModal() {
    const modal = document.getElementById('matThuPinModal');
    if (modal) modal.classList.remove('open');
  }

  function resetAllScores() {
    openPinModal();
  }

  async function confirmResetWithPin() {
    const input = document.getElementById('matThuPinInput');
    const err = document.getElementById('matThuPinError');
    if (!input) return;

    const enteredPin = input.value.trim();
    const correctPin = localStorage.getItem(JUDGE_PIN_KEY) || DEFAULT_PIN;

    if (enteredPin !== correctPin) {
      if (err) {
        err.textContent = '❌ Mã PIN không chính xác! Vui lòng thử lại (Mặc định: 2011)';
        err.classList.remove('hidden');
      }
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      input.focus();
      return;
    }

    closePinModal();

    if (!confirm('⚠️ XÁC NHẬN CUỐI CÙNG: Toàn bộ bảng điểm thi đấu của 40 lớp sẽ bị xóa sạch trên máy chủ. Thầy/Cô có chắc chắn không?')) {
      return;
    }

    try {
      const res = await fetch('/api/matthu/reset', { method: 'POST' });
      if (res.ok) {
        cachedScores = [];
        renderLeaderboardView();
        if (typeof window.showToast === 'function') {
          window.showToast('✅ Đã xác thực Ban Giám Khảo & đặt lại toàn bộ điểm thi đấu!', 'success');
        }
      }
    } catch (_e) {
      localStorage.removeItem('tan_hai_2011_scores_v2');
      cachedScores = [];
      renderLeaderboardView();
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đã đặt lại dữ liệu điểm thi cục bộ!', 'success');
      }
    }
  }

  // Đóng modal Giải Mã Mật Thư khi nhấn phím Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('matThuCoordinatorModal');
      if (modal && modal.classList.contains('open')) {
        closeCoordinatorModal();
      }
    }
  });

  // =========================================================================
  // TÙY CHỈNH DANH SÁCH LỚP CÁC KHỐI & GIAO DIỆN
  // =========================================================================

  function updateGradeSelectOptions() {
    const gradeSelect = document.getElementById('matThuGradeSelect');
    if (!gradeSelect || typeof MatThuData === 'undefined' || typeof MatThuData.getCurrentClasses !== 'function') return;
    const cur = MatThuData.getCurrentClasses();
    const curVal = gradeSelect.value || '6';

    const getShortLabel = (grade) => {
      const list = cur[grade] || [];
      if (list.length === 0) return `Khối ${grade}`;
      if (list.length <= 4) return `Khối ${grade} (${list.join(', ')})`;
      const aList = list.filter(c => /[Aa]/.test(c));
      const bList = list.filter(c => /[Bb]/.test(c));
      const otherList = list.filter(c => !/[Aa]/.test(c) && !/[Bb]/.test(c));
      const parts = [];
      if (aList.length > 0) parts.push(aList.length > 1 ? `${aList[0]} - ${aList[aList.length - 1]}` : aList[0]);
      if (bList.length > 0) parts.push(bList.length > 1 ? `${bList[0]} - ${bList[bList.length - 1]}` : bList[0]);
      if (otherList.length > 0) parts.push(otherList.join(', '));
      return `Khối ${grade} (${parts.join(', ')})`;
    };

    gradeSelect.innerHTML = `
      <option value="6">${getShortLabel(6)}</option>
      <option value="7">${getShortLabel(7)}</option>
      <option value="8">${getShortLabel(8)}</option>
      <option value="9">${getShortLabel(9)}</option>
    `;
    gradeSelect.value = curVal;
  }

  function updateQrTabBadges() {
    if (typeof MatThuData === 'undefined' || typeof MatThuData.getAllClassesList !== 'function') return;
    const all = MatThuData.getAllClassesList();
    const allBtn = document.querySelector('.qr-grade-chip[data-grade="all"]');
    if (allBtn) {
      allBtn.textContent = `Tất cả (${all.length} lớp)`;
    }
  }

  function openClassSettingsModal() {
    const modal = document.getElementById('matThuClassSettingsModal');
    if (!modal || typeof MatThuData === 'undefined') return;

    const cur = typeof MatThuData.getCurrentClasses === 'function'
      ? MatThuData.getCurrentClasses()
      : MatThuData.DEFAULT_CLASSES;

    for (let g = 6; g <= 9; g++) {
      const input = document.getElementById(`classSettingsInput_${g}`);
      const list = cur[g] || [];
      if (input) {
        input.value = list.join(', ');
      }
      onClassInputPreview(g);
    }

    modal.classList.add('open');
  }

  function closeClassSettingsModal() {
    const modal = document.getElementById('matThuClassSettingsModal');
    if (modal) modal.classList.remove('open');
  }

  function onClassInputPreview(grade) {
    const input = document.getElementById(`classSettingsInput_${grade}`);
    const badge = document.getElementById(`classSettingsCount_${grade}`);
    if (!input || !badge) return;
    const items = input.value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    badge.textContent = `${items.length} lớp`;
  }

  function saveClassSettingsFromModal() {
    if (typeof MatThuData === 'undefined' || typeof MatThuData.saveCustomClasses !== 'function') return;

    const newConfig = {};
    for (let g = 6; g <= 9; g++) {
      const input = document.getElementById(`classSettingsInput_${g}`);
      const val = input ? input.value : '';
      const list = val.split(/[,;\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      if (list.length === 0) {
        alert(`⚠️ Khối ${g} phải có ít nhất 1 lớp! Vui lòng nhập tên lớp.`);
        if (input) input.focus();
        return;
      }
      newConfig[g] = list;
    }

    MatThuData.saveCustomClasses(newConfig);
    closeClassSettingsModal();
    refreshAllClassUIs();

    if (typeof window.showToast === 'function') {
      window.showToast('🎉 Đã lưu cấu hình danh sách lớp thành công!', 'success');
    }
  }

  function resetClassSettingsToDefault() {
    if (!confirm('Thầy/Cô có chắc chắn muốn khôi phục danh sách lớp về chuẩn mặc định ban đầu (A1-A6 & B1-B4)?')) {
      return;
    }
    if (typeof MatThuData !== 'undefined' && typeof MatThuData.resetClassesToDefault === 'function') {
      MatThuData.resetClassesToDefault();
    }
    openClassSettingsModal(); // nạp lại giá trị mặc định lên modal
    refreshAllClassUIs();
    if (typeof window.showToast === 'function') {
      window.showToast('🔄 Đã khôi phục danh sách lớp về chuẩn ban đầu!', 'info');
    }
  }

  function refreshAllClassUIs() {
    updateGradeSelectOptions();
    updateQrTabBadges();
    const gradeSelect = document.getElementById('matThuGradeSelect');
    if (gradeSelect) {
      populateClasses(gradeSelect.value);
    }
    if (currentTab === 'qr') {
      renderQrCards();
    } else {
      renderLeaderboardView();
    }
  }

  // ============================================================================
  // HỆ THỐNG BẢN ĐỒ SÂN TRƯỜNG 2D TƯƠNG TÁC (INTERACTIVE 2D SCHOOLYARD MAP)
  // ============================================================================
  const STATIONS_GEO = [
    {
      stationId: 1,
      title: 'TRẠM 1: DẤU ẤN 20/11',
      subtitle: 'Khởi đầu hành trình tri thức',
      icon: '📚',
      x: 210,
      y: 410,
      zone: 'Sân Cờ / Cột Cờ Trung Tâm',
      code: 'TRI',
      pin: '1101',
      desc: 'Sảnh chính sân cờ trường THCS Tân Hải. Vượt qua 5 câu trắc nghiệm truyền thống 20/11 để nhận mảnh TRI và mở khóa Trạm 2.'
    },
    {
      stationId: 2,
      title: 'TRẠM 2: Ô CHỮ BÍ ẨN',
      subtitle: 'Giải mã từ khóa Người Thầy',
      icon: '🧩',
      x: 230,
      y: 165,
      zone: 'Dãy Phòng Học A (Thư viện)',
      code: 'ÂN',
      pin: '2202',
      desc: 'Hành lang Tầng 1 Dãy nhà A, gần Thư viện và Phòng truyền thống. Giải mã 5 ô chữ bí ẩn để nhận mảnh ÂN.'
    },
    {
      stationId: 3,
      title: 'TRẠM 3: THỬ THÁCH MÔN HỌC',
      subtitle: 'Nhận diện thế giới tri thức',
      icon: '🔬',
      x: 520,
      y: 135,
      zone: 'Dãy Phòng Học B (Phòng KHTN)',
      code: 'THẦY',
      pin: '3303',
      desc: 'Khu vực phòng Thực hành Bộ môn KHTN Dãy B. Quan sát gợi ý & dụng cụ nhận diện 5 môn học để nhận mảnh THẦY.'
    },
    {
      stationId: 4,
      title: 'TRẠM 4: GIẢI MÃ MẬT THƯ',
      subtitle: 'Bứt phá tư duy logic',
      icon: '🔐',
      x: 740,
      y: 265,
      zone: 'Nhà Đa Năng / Sân Thể Thao',
      code: 'CÔ',
      pin: '4404',
      desc: 'Khu Giáo dục Thể chất & Nhà Đa Năng phía sau trường. Giải các mật mã số học và hoán vị chữ cái để nhận mảnh CÔ.'
    },
    {
      stationId: 5,
      title: 'TRẠM 5: KHO BÁU TRI ÂN',
      subtitle: 'Về đích vinh quang 20/11',
      icon: '🎁',
      x: 530,
      y: 430,
      zone: 'Sân Khấu Lễ Hội 20/11',
      code: '20/11',
      pin: '5505',
      desc: 'Bục Lễ hội trung tâm trường. Ghép đủ bộ 4 mảnh TRI ÂN THẦY CÔ và mở rương kho báu tri ân!'
    }
  ];

  const MAP_PATHS = [
    { from: 1, to: 2, d: "M 210 410 Q 180 280 230 165", midX: 185, midY: 280 },
    { from: 2, to: 3, d: "M 230 165 Q 370 115 520 135", midX: 375, midY: 120 },
    { from: 3, to: 4, d: "M 520 135 Q 640 165 740 265", midX: 645, midY: 175 },
    { from: 4, to: 5, d: "M 740 265 Q 660 395 530 430", midX: 665, midY: 385 }
  ];

  function renderSchoolMapSvg(container, targetStageIdx = -1, _isCompact = false) {
    if (!container) return;

    if (targetStageIdx === -1 && examState && !examState.finished) {
      targetStageIdx = (examState.pendingStation ? examState.pendingStation - 1 : (typeof examState.questions[examState.index]?.stage === 'number' ? examState.questions[examState.index].stage : 0));
    }

    let pathsHtml = '';
    MAP_PATHS.forEach((p, idx) => {
      let pathClass = 'svg-trail-locked';
      if (targetStageIdx === -1) {
        pathClass = 'svg-trail-done';
      } else if (idx < targetStageIdx - 1) {
        pathClass = 'svg-trail-done';
      } else if (idx === targetStageIdx - 1) {
        pathClass = 'svg-trail-active';
      }

      pathsHtml += `<path d="${p.d}" class="${pathClass}" fill="none"/>`;

      // Nếu là lộ trình đang kích hoạt, vẽ thêm biểu tượng đội thi di chuyển
      if (targetStageIdx !== -1 && idx === targetStageIdx - 1) {
        pathsHtml += `
          <g class="svg-runner-avatar" transform="translate(${p.midX}, ${p.midY})">
            <circle cx="0" cy="0" r="16" fill="#ea580c" stroke="#ffffff" stroke-width="2.5"/>
            <text x="0" y="6" text-anchor="middle" font-size="16">🏃</text>
          </g>
        `;
      }
    });

    let stationsHtml = '';
    STATIONS_GEO.forEach((st, sIdx) => {
      let state = 'overview';
      if (targetStageIdx !== -1) {
        if (sIdx < targetStageIdx) state = 'done';
        else if (sIdx === targetStageIdx) state = 'target';
        else state = 'locked';
      }

      let badgeFill = '#8d2341';
      let badgeStroke = '#ffffff';
      let badgeRadius = 22;
      let symbolHtml = `<text x="${st.x}" y="${st.y + 6}" text-anchor="middle" font-size="18">${st.icon}</text>`;
      let pulseHtml = '';
      let statusTag = '';

      if (state === 'done') {
        badgeFill = '#16a34a';
        badgeRadius = 20;
        symbolHtml = `<text x="${st.x}" y="${st.y + 6}" text-anchor="middle" font-size="18" fill="#ffffff" font-weight="900">✓</text>`;
        statusTag = `★ ${st.code}`;
      } else if (state === 'target') {
        badgeFill = '#ea580c';
        badgeRadius = 24;
        pulseHtml = `<circle cx="${st.x}" cy="${st.y}" r="24" class="svg-radar-pulse"/>`;
        symbolHtml = `<text x="${st.x}" y="${st.y + 7}" text-anchor="middle" font-size="20">${st.icon}</text>`;
        statusTag = 'ĐÍCH ĐẾN 🎯';
      } else if (state === 'locked') {
        badgeFill = '#64748b';
        badgeRadius = 18;
        symbolHtml = `<text x="${st.x}" y="${st.y + 5}" text-anchor="middle" font-size="14" fill="#ffffff">🔒</text>`;
        statusTag = 'Khóa';
      } else {
        statusTag = `Trạm ${st.stationId}`;
      }

      const pillWidth = 140;
      const pillHeight = 24;
      const pillX = st.x - (pillWidth / 2);
      const pillY = st.y + badgeRadius + 4;

      stationsHtml += `
        <g class="station-node-group ${state === 'target' ? 'svg-marker-target' : ''}" onclick="MatThuCoordinator.onMapStationClick(${st.stationId})">
          ${pulseHtml}
          <!-- Vòng tròn trạm -->
          <circle cx="${st.x}" cy="${st.y}" r="${badgeRadius}" fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="3" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.25))"/>
          ${symbolHtml}
          <!-- Thẻ tên trạm bên dưới -->
          <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="6" fill="#ffffff" stroke="${state === 'target' ? '#ea580c' : (state === 'done' ? '#16a34a' : '#cbd5e1')}" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
          <text x="${st.x}" y="${pillY + 16}" text-anchor="middle" font-family="system-ui, Arial, sans-serif" font-size="10.5" font-weight="800" fill="${state === 'target' ? '#c2410c' : (state === 'done' ? '#15803d' : '#334155')}">
            ${st.title.replace('TRẠM ', 'T')} • ${statusTag}
          </text>
        </g>
      `;
    });

    const svg = `
      <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block; border-radius: 12px; font-family: system-ui, Arial, sans-serif;">
        <defs>
          <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f0fdf4"/>
            <stop offset="100%" stop-color="#dcfce7"/>
          </linearGradient>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef3c7"/>
            <stop offset="100%" stop-color="#fde68a"/>
          </linearGradient>
          <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- NỀN KHUÔN VIÊN TRƯỜNG -->
        <rect x="0" y="0" width="900" height="600" fill="url(#grassGrad)"/>

        <!-- ĐƯỜNG NỘI BỘ VÀ LỐI ĐI SÂN TRƯỜNG -->
        <path d="M 115 540 L 210 440 L 230 190 L 520 160 L 740 280 L 530 450 Z" fill="none" stroke="url(#roadGrad)" stroke-width="38" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
        <path d="M 210 410 L 530 430" fill="none" stroke="url(#roadGrad)" stroke-width="30" stroke-linecap="round" opacity="0.7"/>

        <!-- CÂY XANH KHUÔN VIÊN BỐ TRÍ XUNG QUANH -->
        <g opacity="0.75">
          <!-- Cụm cây hàng rào cổng -->
          <circle cx="35" cy="480" r="14" fill="#86efac"/>
          <circle cx="30" cy="515" r="16" fill="#4ade80"/>
          <circle cx="35" cy="550" r="13" fill="#22c55e"/>
          <!-- Cụm cây sau dãy A -->
          <circle cx="95" cy="50" r="16" fill="#4ade80"/>
          <circle cx="125" cy="40" r="18" fill="#22c55e"/>
          <circle cx="365" cy="40" r="16" fill="#86efac"/>
          <!-- Cụm cây sau dãy B -->
          <circle cx="395" cy="40" r="17" fill="#4ade80"/>
          <circle cx="645" cy="45" r="18" fill="#22c55e"/>
          <circle cx="670" cy="70" r="15" fill="#86efac"/>
          <!-- Cụm cây khu thể thao -->
          <circle cx="855" cy="160" r="17" fill="#4ade80"/>
          <circle cx="865" cy="210" r="19" fill="#22c55e"/>
          <circle cx="860" cy="270" r="17" fill="#86efac"/>
          <circle cx="850" cy="330" r="16" fill="#4ade80"/>
          <!-- Cụm cây sân khấu -->
          <circle cx="655" cy="455" r="16" fill="#4ade80"/>
          <circle cx="680" cy="485" r="18" fill="#22c55e"/>
          <circle cx="390" cy="455" r="15" fill="#86efac"/>
        </g>

        <!-- SÂN CỜ TRUNG TÂM (KHU VỰC TRẠM 1) -->
        <rect x="145" y="345" width="150" height="135" rx="12" fill="#fff7ed" stroke="#fed7aa" stroke-width="2"/>
        <!-- Lưới gạch sân cờ -->
        <line x1="145" y1="390" x2="295" y2="390" stroke="#ffedd5" stroke-width="1.5"/>
        <line x1="145" y1="435" x2="295" y2="435" stroke="#ffedd5" stroke-width="1.5"/>
        <line x1="195" y1="345" x2="195" y2="480" stroke="#ffedd5" stroke-width="1.5"/>
        <line x1="245" y1="345" x2="245" y2="480" stroke="#ffedd5" stroke-width="1.5"/>
        <text x="220" y="365" text-anchor="middle" font-weight="850" font-size="11" fill="#c2410c">SÂN CỜ TRUNG TÂM 🇻🇳</text>

        <!-- DÃY NHÀ A (THƯ VIỆN & TRUYỀN THỐNG - KHU VỰC TRẠM 2) -->
        <rect x="125" y="65" width="210" height="90" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"/>
        <!-- Mái nhà ngói cam Dãy A -->
        <polygon points="115,65 345,65 330,42 130,42" fill="#ea580c"/>
        <rect x="135" y="75" width="190" height="6" fill="#fed7aa" rx="2"/>
        <!-- Các ô cửa sổ -->
        <rect x="145" y="90" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="180" y="90" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="255" y="90" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="290" y="90" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <text x="230" y="125" text-anchor="middle" font-weight="900" font-size="12" fill="#1e293b">DÃY PHÒNG HỌC A</text>
        <text x="230" y="142" text-anchor="middle" font-size="10.5" fill="#64748b">Thư Viện & Phòng Truyền Thống</text>

        <!-- DÃY NHÀ B (PHÒNG BỘ MÔN KHTN - KHU VỰC TRẠM 3) -->
        <rect x="415" y="45" width="210" height="85" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"/>
        <!-- Mái nhà Dãy B -->
        <polygon points="405,45 635,45 620,24 420,24" fill="#0284c7"/>
        <rect x="425" y="55" width="190" height="6" fill="#bae6fd" rx="2"/>
        <rect x="435" y="70" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="470" y="70" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="545" y="70" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <rect x="580" y="70" width="22" height="18" rx="2" fill="#e0f2fe" stroke="#38bdf8"/>
        <text x="520" y="103" text-anchor="middle" font-weight="900" font-size="12" fill="#1e293b">DÃY PHÒNG HỌC B</text>
        <text x="520" y="120" text-anchor="middle" font-size="10.5" fill="#64748b">Phòng Thực Hành & Bộ Môn KHTN 🔬</text>

        <!-- NHÀ ĐA NĂNG & KHU THỂ THAO (KHU VỰC TRẠM 4) -->
        <rect x="655" y="165" width="180" height="145" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"/>
        <!-- Mái vòm nhà đa năng -->
        <path d="M 655 165 Q 745 130 835 165 Z" fill="#9333ea"/>
        <!-- Sân bóng rổ mặt bằng -->
        <rect x="670" y="180" width="150" height="85" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
        <circle cx="745" cy="222" r="18" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
        <line x1="745" y1="180" x2="745" y2="265" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="745" y="285" text-anchor="middle" font-weight="900" font-size="12" fill="#1e293b">NHÀ ĐA NĂNG</text>
        <text x="745" y="300" text-anchor="middle" font-size="10.5" fill="#64748b">Sân Bóng Rổ & Thể Thao 🏀</text>

        <!-- SÂN KHẤU LỄ HỘI 20/11 (KHU VỰC TRẠM 5 - ĐÍCH ĐẾN) -->
        <rect x="425" y="365" width="210" height="110" rx="10" fill="#ffffff" stroke="#fecdd3" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"/>
        <!-- Mái vòm sân khấu màu đỏ lễ hội -->
        <path d="M 425 365 L 530 335 L 635 365 Z" fill="#dc2626"/>
        <!-- Thảm đỏ lễ hội -->
        <rect x="460" y="375" width="140" height="55" rx="4" fill="#fee2e2" stroke="#f87171" stroke-width="1"/>
        <text x="530" y="398" text-anchor="middle" font-weight="900" font-size="12.5" fill="#8d2341">SÂN KHẤU LỄ HỘI 20/11</text>
        <text x="530" y="415" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b91c1c">Đích Đến Mở Kho Báu Tri Ân 🏆</text>

        <!-- CỔNG CHÍNH TRƯỜNG -->
        <rect x="45" y="500" width="130" height="65" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <polygon points="35,500 185,500 175,480 45,480" fill="#8d2341"/>
        <text x="110" y="525" text-anchor="middle" font-weight="900" font-size="11.5" fill="#8d2341">CỔNG TRƯỜNG</text>
        <text x="110" y="545" text-anchor="middle" font-size="10" fill="#64748b">THCS Tân Hải ⛩️</text>

        <!-- TIÊU ĐỀ BẢN ĐỒ NẰM GÓC TRÊN TRÁI -->
        <g transform="translate(16, 16)">
          <rect x="0" y="0" width="220" height="34" rx="8" fill="#ffffff" stroke="#8d2341" stroke-width="1.5" opacity="0.95"/>
          <text x="12" y="22" font-size="12" font-weight="900" fill="#8d2341">🗺️ SƠ ĐỒ 2D THCS TÂN HẢI</text>
        </g>

        <!-- VẼ CÁC TUYẾN ĐƯỜNG NỐI CÁC TRẠM (TRAILS) -->
        <g>
          ${pathsHtml}
        </g>

        <!-- VẼ CÁC TRẠM KIỂM SOÁT (STATIONS NODES) -->
        <g>
          ${stationsHtml}
        </g>
      </svg>
    `;

    container.innerHTML = svg;
  }

  function onMapStationClick(stationId) {
    const st = STATIONS_GEO.find(s => s.stationId === Number(stationId));
    if (!st) return;

    let status = 'overview';
    let statusText = 'Sẵn sàng';
    let statusClass = 'target';

    if (examState && !examState.finished) {
      const currentStage = examState.pendingStation ? examState.pendingStation - 1 : (typeof examState.questions[examState.index]?.stage === 'number' ? examState.questions[examState.index].stage : 0);
      const sIdx = st.stationId - 1;
      if (sIdx < currentStage) {
        status = 'done';
        statusText = '✅ Đã giải mã thành công';
        statusClass = 'done';
      } else if (sIdx === currentStage) {
        status = 'target';
        statusText = '🎯 ĐÍCH ĐẾN TIẾP THEO';
        statusClass = 'target';
      } else {
        status = 'locked';
        statusText = '🔒 Đang khóa';
        statusClass = 'locked';
      }
    }

    const box = document.getElementById('matThuStationDetailBox');
    const iconEl = document.getElementById('stDetailIcon');
    const titleEl = document.getElementById('stDetailTitle');
    const locEl = document.getElementById('stDetailLoc');
    const badgeEl = document.getElementById('stDetailStatusBadge');
    const descEl = document.getElementById('stDetailDesc');
    const codeEl = document.getElementById('stDetailCode');
    const pinEl = document.getElementById('stDetailPin');

    if (box) {
      if (iconEl) iconEl.textContent = st.icon;
      if (titleEl) titleEl.textContent = st.title;
      if (locEl) locEl.textContent = `📍 ${st.zone}`;
      if (badgeEl) {
        badgeEl.className = `st-detail-badge ${statusClass}`;
        badgeEl.textContent = statusText;
      }
      if (descEl) descEl.textContent = st.desc;
      if (codeEl) codeEl.textContent = (status === 'done' || !examState) ? `★ ${st.code} ★` : '🔒 ???';
      if (pinEl) pinEl.textContent = (status === 'target' || !examState) ? st.pin : '••••';

      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (typeof playExamBeep === 'function') {
      playExamBeep(700, 0.08, 'sine');
    }
  }

  function openMapModal() {
    const modal = document.getElementById('matThuMapModal');
    if (!modal) return;

    const teamNote = document.getElementById('mapModalCurrentTeamNote');
    if (teamNote) {
      if (examState && !examState.finished) {
        teamNote.textContent = `Chi đội: ${examState.team} (Khối ${examState.grade})`;
      } else {
        teamNote.textContent = 'Chế độ xem sơ đồ tự do';
      }
    }

    const container = document.getElementById('matThuModalMapContainer');
    if (container) {
      renderSchoolMapSvg(container);
    }

    const detailBox = document.getElementById('matThuStationDetailBox');
    if (detailBox) detailBox.classList.add('hidden');

    modal.classList.add('open');
  }

  function closeMapModal() {
    const modal = document.getElementById('matThuMapModal');
    if (modal) modal.classList.remove('open');
  }

  let isStationsMapCollapsed = false;
  function toggleStationsMapPreview() {
    const wrapper = document.getElementById('matThuStationsTabMapWrapper');
    const btnText = document.getElementById('btnToggleStationsMapText');
    if (!wrapper) return;

    isStationsMapCollapsed = !isStationsMapCollapsed;
    wrapper.style.display = isStationsMapCollapsed ? 'none' : 'block';
    if (btnText) {
      btnText.textContent = isStationsMapCollapsed ? '▼ Mở rộng Sơ đồ' : '▲ Thu gọn Sơ đồ';
    }
  }

  // Public API
  window.MatThuCoordinator = {
    openCoordinatorModal: openCoordinatorModal,
    closeCoordinatorModal: closeCoordinatorModal,
    switchTab: switchTab,
    setGradeFilter: setGradeFilter,
    setSeriesFilter: setSeriesFilter,
    openClassSettingsModal: openClassSettingsModal,
    closeClassSettingsModal: closeClassSettingsModal,
    onClassInputPreview: onClassInputPreview,
    saveClassSettingsFromModal: saveClassSettingsFromModal,
    resetClassSettingsToDefault: resetClassSettingsToDefault,
    refreshAllClassUIs: refreshAllClassUIs,
    printAllQrSheets: printAllQrSheets,
    printSingleQr: printSingleQr,
    downloadTeamQrPng: downloadTeamQrPng,
    downloadAllFilteredQrPng: downloadAllFilteredQrPng,
    renderStationCards: renderStationCards,
    downloadStationPosterPng: downloadStationPosterPng,
    downloadStationGradeQrPng: downloadStationGradeQrPng,
    downloadAllStationPostersPng: downloadAllStationPostersPng,
    printAllStationPosters: printAllStationPosters,
    printSingleStationPoster: printSingleStationPoster,
    // Question Management Editor APIs
    selectEditorGrade: selectEditorGrade,
    selectEditorStation: selectEditorStation,
    addNewQuestion: addNewQuestion,
    deleteQuestion: deleteQuestion,
    moveQuestion: moveQuestion,
    saveAllQuestions: saveAllQuestions,
    resetQuestionsToDefaultConfirm: resetQuestionsToDefaultConfirm,
    exportQuestionsJson: exportQuestionsJson,
    importQuestionsFile: importQuestionsFile,
    onRadioCorrectChange: onRadioCorrectChange,
    openPrintJudgeModal: openPrintJudgeModal,
    closePrintJudgeModal: closePrintJudgeModal,
    printJudgeSheet: printJudgeSheet,
    formatDifficultyLabel: formatDifficultyLabel,
    // 2D Schoolyard Map APIs
    openMapModal: openMapModal,
    closeMapModal: closeMapModal,
    onMapStationClick: onMapStationClick,
    toggleStationsMapPreview: toggleStationsMapPreview,
    renderSchoolMapSvg: renderSchoolMapSvg,
    openPinModal: openPinModal,
    closePinModal: closePinModal,
    confirmResetWithPin: confirmResetWithPin,
    openTeamUrl: openTeamUrl,
    reloadGameFrame: reloadGameFrame,
    resetClassInFrame: resetClassInFrame,
    toggleModalMaximize: toggleModalMaximize,
    toggleSplitScreen: toggleSplitScreen,
    exportLeaderboardCsv: exportLeaderboardCsv,
    resetAllScores: resetAllScores,
    refreshScores: loadLeaderboardScores,
    saveCustomBaseUrl: saveCustomBaseUrl,
    resetDefaultBaseUrl: resetDefaultBaseUrl,
    // Direct Arena Game Engine APIs
    startExam: startExam,
    onGradeChange: onGradeChange,
    onClassChange: onClassChange,
    chooseExamAnswer: chooseExamAnswer,
    nextQuestion: nextQuestion,
    finishEarly: finishEarly,
    submitStationPin: submitStationPin,
    openCertificate: openCertificate,
    backToResult: backToResult,
    showScores: showScores,
    backFromScores: backFromScores,
    clearDeviceScores: clearDeviceScores,
    exportDeviceScoresCsv: exportDeviceScoresCsv,
    resetExam: resetExam
  };

  // Xử lý khi học sinh dùng camera quét mã QR Trạm
  function handleStationQrScan(scannedStation, scannedGrade, _token) {
    if (!examState || examState.finished) return;

    // 1. Kiểm tra Khối (Anti-cheat: Chống quét nhầm khối lớp)
    if (Number(examState.grade) !== Number(scannedGrade)) {
      alert(`⚠️ LỖI KHỐI DỰ THI!\n\nChi đội của bạn thuộc KHỐI ${examState.grade}.\nBạn đang quét mã QR của KHỐI ${scannedGrade} tại Trạm ${scannedStation}!\n\n👉 Vui lòng quét đúng mã QR của Khối ${examState.grade} trên Áp phích Trạm ${scannedStation}.`);
      if (typeof playExamWrong === 'function') playExamWrong();
      return;
    }

    // 2. Kiểm tra Trạm (Sequence: Khóa tuần tự từng trạm)
    const expectedStation = examState.pendingStation || (Math.floor(examState.index / 4) + 1);

    if (scannedStation < expectedStation) {
      alert(`ℹ️ Chi đội đã hoàn thành xuất sắc Trạm ${scannedStation} trước đó rồi!\nHãy tiếp tục chặng đua tại Trạm ${expectedStation}.`);
      return;
    }

    if (scannedStation > expectedStation) {
      alert(`🚫 BẠN ĐANG NHẢY CÓC TRẠM!\n\nChi đội chưa hoàn thành thử thách tại Trạm ${expectedStation}.\n\n👉 Vui lòng di chuyển đến Trạm ${expectedStation} để giải mật thư trước khi tới Trạm ${scannedStation}!`);
      if (typeof playExamWrong === 'function') playExamWrong();
      return;
    }

    // Đúng Trạm và đúng Khối!
    if (pendingStationIndex !== null || examState.pendingStation) {
      const modal = document.getElementById('matThuStationGateModal');
      if (modal) modal.classList.add('hidden');
      if (typeof playExamSuccess === 'function') playExamSuccess();

      const stData = MatThuData.STATIONS[scannedStation - 1];
      if (stData && !examState.codes.includes(stData.code)) {
        examState.codes.push(stData.code);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`🔓 Mở khóa thành công Trạm ${scannedStation}: ${stData ? stData.title : ''}!`, 'success');
      }

      examState.pendingStation = null;
      pendingStationIndex = null;
      examState.index++;
      saveActiveExamState();
      renderExamQuestion();
    }
  }

  // Khởi tạo và kiểm tra tham số URL khi load trang (Học sinh quét mã QR truy cập thẳng)
  function checkUrlGameParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const game = params.get('game');
      const stationParam = params.get('station');
      const gradeParam = params.get('grade');
      const checkinParam = params.get('checkin');

      if (game === 'mat_thu') {
        setTimeout(() => {
          openCoordinatorModal('play');

          // 1. Kiểm tra xem có phiên thi đấu đang diễn ra trên máy không
          const savedExam = loadActiveExamState();
          if (savedExam && !savedExam.finished) {
            examState = savedExam;
            showArenaPanel('matThuGamePanel');
            if (examTicker) clearInterval(examTicker);
            examTicker = setInterval(tickExamTimer, 500);

            // Nếu người dùng vừa quét QR Trạm ngoài sân
            if (stationParam && gradeParam) {
              handleStationQrScan(parseInt(stationParam, 10), parseInt(gradeParam, 10), checkinParam);
              return;
            }

            if (examState.pendingStation) {
              openStationGate(examState.pendingStation - 1);
            } else {
              renderExamQuestion();
            }
            return;
          }

          // 2. Nếu chưa có bài thi đang làm, thiết lập trạng thái ban đầu từ URL
          if (gradeParam) {
            const gradeSelect = document.getElementById('matThuGradeSelect');
            if (gradeSelect) {
              gradeSelect.value = String(gradeParam);
              onGradeChange();
            }
          }

          const className = params.get('class');
          const teamName = params.get('team');
          if (className) {
            openTeamUrl('', className, teamName);
          }

          if (stationParam && gradeParam) {
            if (typeof window.showToast === 'function') {
              window.showToast(`🚩 Bạn đang tại Trạm ${stationParam} (Khối ${gradeParam}). Hãy chọn lớp và bắt đầu thử thách!`, 'info');
            }
          }
        }, 300);
      }
    } catch (_e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateGradeSelectOptions();
    updateQrTabBadges();
    onGradeChange();
    checkUrlGameParams();
  });

})();
