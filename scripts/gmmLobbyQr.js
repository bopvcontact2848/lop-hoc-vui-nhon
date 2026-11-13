/**
 * ==============================================================================
 * MODULE PHÒNG CHỜ QR & DÒ ĐỊA CHỈ MẠNG LAN (GIẢI MÃ BÍ MẬT)
 * File: scripts/gmmLobbyQr.js
 * Trách nhiệm: Tự động phát hiện IP Wi-Fi LAN từ server.js, sinh mã QR 2 đội
 * (Đội A / Đội B) và quản lý cấu hình URL tùy chỉnh trong LocalStorage.
 * ==============================================================================
 */

(function () {
  'use strict';

  window.GmmLobbyQr = {
    create: function (ctx) {
      const { gameState } = ctx;

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

    if (typeof window.QRCode !== 'undefined') {
      try {
        new window.QRCode(qrA, {
          text: urlA,
          width: 170,
          height: 170,
          colorDark: '#991b1b',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
        new window.QRCode(qrB, {
          text: urlB,
          width: 170,
          height: 170,
          colorDark: '#1e40af',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('window.QRCode render error:', err);
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

      return {
        getGmmBaseUrl,
        updateLobbyNetworkUI,
        renderQrCodes,
        copyBaseUrl,
        copyTeamUrl,
        promptCustomUrl,
        refreshGmmNetworkIp
      };
    }
  };
})();
