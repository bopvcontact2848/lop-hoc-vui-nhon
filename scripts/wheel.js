/**
 * ==============================================================================
 * MODULE VÒNG QUAY BÁNH XE MAY MẮN (scripts/wheel.js)
 * Chịu trách nhiệm vẽ HTML5 Canvas, hoạt ảnh quay tròn (Easing animation),
 * tính góc trúng thưởng, hiệu ứng kim giật và hoàn tất kết quả.
 * ==============================================================================
 */

// Bảng màu rực rỡ sắc nét cho Vòng quay Bánh xe may mắn
const WHEEL_COLORS = [
  '#4f46e5', '#ec4899', '#06b6d4', '#f59e0b',
  '#10b981', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#3b82f6', '#84cc16', '#d946ef'
];

/**
 * Vẽ vòng quay may mắn lên Canvas với độ nét chuẩn DPR (Retina)
 * Hỗ trợ linh hoạt cả Chế độ Gọi Cá Nhân và Gọi Nhóm (6 đến 12 nhóm)
 */
function drawLuckyWheel(customRotation) {
  const rotation = typeof customRotation === 'number' ? customRotation : window.state.wheelRotation;
  const canvas = window.DOM ? window.DOM.luckyWheelCanvas : document.getElementById('luckyWheelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 520;

  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = 236;

  ctx.clearRect(0, 0, size, size);

  const isGroupMode = (window.state && window.state.wheelTargetType === 'group');
  let items = [];
  let emptyMsg = '';

  if (isGroupMode) {
    items = typeof getAvailableWheelGroups === 'function' ? getAvailableWheelGroups() : [];
    if (items.length === 0) {
      emptyMsg = 'Tất cả các nhóm đã được gọi';
    }
  } else {
    items = typeof getAvailableStudents === 'function' ? getAvailableStudents() : [];
    if (items.length === 0) {
      const all = typeof getAllStudents === 'function' ? getAllStudents() : [];
      emptyMsg = all.length === 0 ? 'Lớp trống (Chưa có học sinh)' : 'Tất cả học sinh đã được gọi';
    }
  }

  const count = items.length;

  if (count === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emptyMsg, cx, cy);
    ctx.restore();
    return;
  }

  const arc = (2 * Math.PI) / count;

  // Vẽ từng nan quạt (học sinh hoặc nhóm)
  for (let i = 0; i < count; i++) {
    const startAngle = rotation + i * arc;
    const endAngle = startAngle + arc;
    const item = items[i];

    let color = isGroupMode ? (item.color || WHEEL_COLORS[i % WHEEL_COLORS.length]) : WHEEL_COLORS[i % WHEEL_COLORS.length];
    if (i === count - 1 && (i % WHEEL_COLORS.length) === 0 && count > 1 && !isGroupMode) {
      color = WHEEL_COLORS[1];
    }

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vẽ tên học sinh hoặc nhóm theo góc nan quạt
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    if (isGroupMode) {
      // Nhãn nan quạt chế độ Gọi Nhóm
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      const label = `${item.mascot} ${item.name}`;
      ctx.fillText(label, radius - 26, -5);

      ctx.font = '600 11.5px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(item.title, radius - 26, 13);
    } else {
      // Nhãn nan quạt chế độ Học sinh
      let fontSize = 15;
      if (count > 45) fontSize = 11;
      else if (count > 32) fontSize = 12;
      else if (count > 20) fontSize = 13.5;

      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

      let displayName = item;
      if (displayName.length > 17) {
        displayName = displayName.slice(0, 15) + '..';
      }

      ctx.fillText(displayName, radius - 26, 0);
    }
    ctx.restore();
  }

  // Viền ngoài ánh kim vàng gold
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#eab308';
  ctx.stroke();

  // Các chốt đèn viền trang trí (Pegs)
  const pegCount = Math.min(Math.max(count, 24), 48);
  const pegArc = (2 * Math.PI) / pegCount;
  for (let p = 0; p < pegCount; p++) {
    const pAngle = rotation + p * pegArc;
    const px = cx + (radius - 2) * Math.cos(pAngle);
    const py = cy + (radius - 2) * Math.sin(pAngle);

    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Thực hiện quay vòng bánh xe may mắn với thuật toán giảm tốc mượt mà
 */
function spinLuckyWheel() {
  const state = window.state;
  const DOM = window.DOM;
  if (!state || state.isSpinning) return;

  const isGroupMode = (state.wheelTargetType === 'group');
  let available = [];

  if (isGroupMode) {
    available = typeof getAvailableWheelGroups === 'function' ? getAvailableWheelGroups() : [];
    if (available.length === 0) {
      if (state.noRepeat) {
        if (typeof showToast === 'function') showToast('Tất cả các nhóm đã được gọi! Đã tự động làm mới danh sách nhóm.', 'info');
        if (typeof resetCalledGroups === 'function') resetCalledGroups(false);
        return spinLuckyWheel();
      }
      if (typeof showToast === 'function') showToast('Không có nhóm khả dụng để quay!', 'warning');
      return;
    }
  } else {
    available = typeof getAvailableStudents === 'function' ? getAvailableStudents() : [];
    const all = typeof getAllStudents === 'function' ? getAllStudents() : [];

    if (all.length === 0) {
      if (typeof showToast === 'function') showToast('Lớp hiện tại chưa có học sinh nào!', 'warning');
      return;
    }

    if (available.length === 0) {
      if (state.noRepeat) {
        if (typeof showToast === 'function') showToast('Tất cả học sinh đã được gọi! Đã tự động làm mới danh sách.', 'info');
        if (typeof resetCalledList === 'function') resetCalledList(false);
        return spinLuckyWheel();
      }
      if (typeof showToast === 'function') showToast('Không có học sinh khả dụng để quay!', 'warning');
      return;
    }
  }

  state.isSpinning = true;
  if (DOM.btnSpin) DOM.btnSpin.disabled = true;
  if (DOM.wheelWinnerCard) DOM.wheelWinnerCard.style.display = 'none';
  if (DOM.postSpinActions) DOM.postSpinActions.classList.remove('visible');
  if (window.sound) window.sound.init();

  const count = available.length;
  const arc = (2 * Math.PI) / count;
  const topAngle = -Math.PI / 2; // Góc 12 giờ của kim chỉ

  const winnerIdx = Math.floor(Math.random() * count);
  const winnerItem = available[winnerIdx];
  state.lastResult = [isGroupMode ? winnerItem.name : winnerItem];

  const winnerCenterAngle = winnerIdx * arc + arc / 2;
  const targetR = topAngle - winnerCenterAngle;
  const startAngle = state.wheelRotation;

  const fullSpins = 7 + Math.floor(Math.random() * 3);
  let deltaAngle = (targetR - startAngle);
  while (deltaAngle < fullSpins * 2 * Math.PI) {
    deltaAngle += 2 * Math.PI;
  }

  // Thời gian quay hồi hộp (đọc từ cấu hình state hoặc mặc định 4.5s)
  const duration = (window.state && window.state.wheelDuration) ? window.state.wheelDuration : 4500;
  const startTime = performance.now();
  let lastHoverIdx = -1;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);

    state.wheelRotation = startAngle + deltaAngle * eased;
    drawLuckyWheel(state.wheelRotation);

    // Hiệu ứng kim giật và âm thanh click khi nan quạt đi qua kim chỉ
    let rel = (topAngle - state.wheelRotation) % (2 * Math.PI);
    if (rel < 0) rel += 2 * Math.PI;
    const currHoverIdx = Math.floor(rel / arc) % count;

    if (currHoverIdx !== lastHoverIdx) {
      lastHoverIdx = currHoverIdx;
      if (window.sound) window.sound.playTick(550 + progress * 250);
      if (DOM.wheelPointer) {
        DOM.wheelPointer.classList.add('twitch');
        setTimeout(() => DOM.wheelPointer.classList.remove('twitch'), 60);
      }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finalizeWheelSpin(winnerItem);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Xử lý kết quả sau khi vòng quay dừng hẳn
 */
function finalizeWheelSpin(winnerItem) {
  const state = window.state;
  const DOM = window.DOM;

  state.isSpinning = false;
  if (DOM.btnSpin) DOM.btnSpin.disabled = false;

  const isGroupMode = (state.wheelTargetType === 'group');

  if (isGroupMode) {
    // KẾT QUẢ CHO CHẾ ĐỘ GỌI NHÓM
    const winnerGroup = winnerItem; // { num, name, mascot, title, color }
    const groupNum = winnerGroup.num;
    const members = typeof getWheelGroupMembers === 'function' ? getWheelGroupMembers(groupNum) : [];

    if (DOM.wheelWinnerCard) {
      let membersHtml = '';
      if (members.length > 0) {
        membersHtml = `
          <div class="winner-group-members-box">
            <div class="winner-group-members-label">👥 Thành viên (${members.length} bạn):</div>
            <div class="winner-group-chips">
              ${members.map(m => `<span class="winner-member-chip">${m}</span>`).join('')}
            </div>
          </div>
        `;
      }
      DOM.wheelWinnerCard.innerHTML = `
        <div class="winner-group-card-content">
          <div class="winner-group-badge">🎉 XIN CHÚC MỪNG 🎉</div>
          <div class="winner-group-name">${winnerGroup.mascot} ${winnerGroup.name} - ${winnerGroup.title}</div>
          ${membersHtml}
        </div>
      `;
      DOM.wheelWinnerCard.style.display = 'flex';
    }

    if (state.noRepeat) {
      const cls = getCurrentClass();
      if (cls) {
        cls.calledGroups = cls.calledGroups || [];
        if (!cls.calledGroups.includes(groupNum)) {
          cls.calledGroups.push(groupNum);
        }
      }
      state.calledGroups = state.calledGroups || [];
      if (!state.calledGroups.includes(groupNum)) {
        state.calledGroups.push(groupNum);
      }
    }

    // Ghi nhận lịch sử gọi
    if (typeof recordStudentCall === 'function') {
      recordStudentCall(`${winnerGroup.name} (${winnerGroup.title})`);
    }

    if (window.sound) window.sound.playVictory();
    if (typeof triggerCelebrationConfetti === 'function') triggerCelebrationConfetti();

    if (DOM.postSpinActions) DOM.postSpinActions.classList.add('visible');
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveStateToStorage === 'function') saveStateToStorage();

    // Đồng bộ kết quả sang Remote trên điện thoại
    if (window.RemoteSync && typeof window.RemoteSync.send === 'function') {
      window.RemoteSync.send('winner_announced', {
        studentName: `${winnerGroup.mascot} ${winnerGroup.name}`,
        locationText: 'Vòng Quay May Mắn (Gọi Nhóm)',
        groupInfo: members.join(', '),
        groupNum: groupNum,
        mascot: winnerGroup.mascot,
        color: winnerGroup.color,
        groupName: `${winnerGroup.name} (${winnerGroup.title})`
      });
    }

  } else {
    // KẾT QUẢ CHO CHẾ ĐỘ GỌI CÁ NHÂN HỌC SINH
    const winnerName = winnerItem;

    if (DOM.wheelWinnerCard) {
      DOM.wheelWinnerCard.innerHTML = `<div class="winner-individual-text">🎉 CHÚC MỪNG: ${winnerName} 🎉</div>`;
      DOM.wheelWinnerCard.style.display = 'flex';
    }

    if (state.noRepeat) {
      const cls = getCurrentClass();
      if (cls && !cls.called.includes(winnerName)) {
        cls.called.push(winnerName);
      }
    }

    // Ghi nhận số lần gọi và lịch sử
    if (typeof recordStudentCall === 'function') {
      recordStudentCall(winnerName);
    }

    // Ghi nhận tên học sinh vừa trúng để tạo hiệu ứng mờ dần 0.3s
    window.lastCalledWinnerName = winnerName;
    setTimeout(() => {
      if (window.lastCalledWinnerName === winnerName) {
        window.lastCalledWinnerName = null;
      }
    }, 1500);

    if (window.sound) window.sound.playVictory();
    if (typeof triggerCelebrationConfetti === 'function') triggerCelebrationConfetti();

    if (DOM.postSpinActions) DOM.postSpinActions.classList.add('visible');
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveStateToStorage === 'function') saveStateToStorage();

    // Đồng bộ kết quả người chiến thắng sang Remote trên điện thoại
    if (window.RemoteSync && typeof window.RemoteSync.send === 'function') {
      window.RemoteSync.send('winner_announced', {
        studentName: winnerName,
        locationText: 'Vòng Quay May Mắn',
        groupInfo: '',
        groupNum: null,
        mascot: '🎉',
        groupName: ''
      });
    }
  }
}

// ==============================================================================
// VÒNG XOAY ĐIỂM SỐ & PHẦN THƯỞNG (BONUS POINTS WHEEL)
// ==============================================================================

const DEFAULT_BONUS_REWARDS = [
  { text: "+1 Điểm", color: "#10b981", icon: "⭐" },
  { text: "+2 Điểm", color: "#f59e0b", icon: "🌟" },
  { text: "Tràng pháo tay", color: "#ec4899", icon: "👏" },
  { text: "+1 Điểm", color: "#06b6d4", icon: "⭐" },
  { text: "Chọn bạn trợ giúp", color: "#8b5cf6", icon: "🤝" },
  { text: "+3 Điểm", color: "#ef4444", icon: "🔥" },
  { text: "Lời khen ngợi", color: "#14b8a6", icon: "❤️" },
  { text: "Điểm 10 may mắn", color: "#f97316", icon: "🎯" }
];

const REWARDS_STORAGE_KEY = 'vong_quay_bonus_rewards_custom';
let BONUS_REWARDS = [...DEFAULT_BONUS_REWARDS];

function loadBonusRewardsFromStorage() {
  try {
    const raw = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        BONUS_REWARDS = parsed;
        return;
      }
    }
  } catch (e) {
    console.error("Lỗi đọc danh sách phần thưởng:", e);
  }
  BONUS_REWARDS = [...DEFAULT_BONUS_REWARDS];
}

function saveBonusRewardsToStorage() {
  try {
    localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(BONUS_REWARDS));
  } catch (e) {
    console.error("Lỗi lưu danh sách phần thưởng:", e);
  }
}

// Tự động nạp phần thưởng đã lưu
loadBonusRewardsFromStorage();

let bonusRotation = 0;
let isBonusSpinning = false;

function drawBonusWheel(customRotation = bonusRotation) {
  const canvas = document.getElementById('bonusWheelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 360;

  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = 160;

  ctx.clearRect(0, 0, size, size);

  const count = BONUS_REWARDS.length;
  const arc = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const startAngle = customRotation + i * arc;
    const endAngle = startAngle + arc;
    const item = BONUS_REWARDS[i];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vẽ text và icon
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';

    ctx.fillText(`${item.icon} ${item.text}`, radius - 20, 0);
    ctx.restore();
  }

  // Viền vàng kim
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  // Tâm điểm thưởng
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 13px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎁', cx, cy);

  ctx.restore();
}

function openBonusWheelModal() {
  const modal = document.getElementById('bonusWheelModal');
  if (!modal) return;
  const currentStudentName = (window.state.lastResult && window.state.lastResult[0]) || 'Học sinh';
  const titleEl = document.getElementById('bonusStudentTitle');
  if (titleEl) titleEl.textContent = `Vòng Quay Điểm Thưởng Cho: ${currentStudentName}`;
  const winnerCard = document.getElementById('bonusWinnerCard');
  if (winnerCard) {
    winnerCard.style.display = 'none';
  }
  const spinBtn = document.getElementById('btnSpinBonus');
  if (spinBtn) spinBtn.disabled = false;

  modal.classList.add('open');
  drawBonusWheel();
}

function closeBonusWheelModal() {
  if (isBonusSpinning) return;
  const modal = document.getElementById('bonusWheelModal');
  if (modal) modal.classList.remove('open');
}

function spinBonusWheel() {
  if (isBonusSpinning) return;
  isBonusSpinning = true;

  const spinBtn = document.getElementById('btnSpinBonus');
  if (spinBtn) spinBtn.disabled = true;

  const winnerCard = document.getElementById('bonusWinnerCard');
  if (winnerCard) winnerCard.style.display = 'none';

  if (window.sound) window.sound.init();

  const count = BONUS_REWARDS.length;
  const arc = (2 * Math.PI) / count;
  const topAngle = -Math.PI / 2;

  const winnerIdx = Math.floor(Math.random() * count);
  const winnerReward = BONUS_REWARDS[winnerIdx];

  const winnerCenterAngle = winnerIdx * arc + arc / 2;
  const targetR = topAngle - winnerCenterAngle;
  const startAngle = bonusRotation;

  const fullSpins = 6 + Math.floor(Math.random() * 3);
  let deltaAngle = (targetR - startAngle);
  while (deltaAngle < fullSpins * 2 * Math.PI) {
    deltaAngle += 2 * Math.PI;
  }

  const duration = 3800;
  const startTime = performance.now();
  let lastHoverIdx = -1;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);

    bonusRotation = startAngle + deltaAngle * eased;
    drawBonusWheel(bonusRotation);

    let rel = (topAngle - bonusRotation) % (2 * Math.PI);
    if (rel < 0) rel += 2 * Math.PI;
    const currHoverIdx = Math.floor(rel / arc) % count;

    if (currHoverIdx !== lastHoverIdx) {
      lastHoverIdx = currHoverIdx;
      if (window.sound) window.sound.playTick(600 + progress * 200, progress);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finalizeBonusSpin(winnerReward);
    }
  }

  requestAnimationFrame(animate);
}

function finalizeBonusSpin(reward) {
  isBonusSpinning = false;
  const spinBtn = document.getElementById('btnSpinBonus');
  if (spinBtn) spinBtn.disabled = false;

  const currentStudent = (window.state.lastResult && window.state.lastResult[0]) || '';
  const winnerCard = document.getElementById('bonusWinnerCard');
  if (winnerCard) {
    winnerCard.textContent = `🎉 ${currentStudent ? currentStudent + ' nhận được: ' : ''}${reward.icon} ${reward.text} 🎉`;
    winnerCard.style.display = 'flex';
  }

  if (window.sound) window.sound.playVictory();
  if (typeof triggerCelebrationConfetti === 'function') triggerCelebrationConfetti();

  // Cập nhật phần thưởng vào lịch sử học sinh
  if (currentStudent && typeof updateStudentLastReward === 'function') {
    updateStudentLastReward(currentStudent, `${reward.icon} ${reward.text}`);
  }

  if (typeof showToast === 'function') {
    showToast(`🎁 Đã tặng "${reward.icon} ${reward.text}" cho ${currentStudent}!`, 'success');
  }
}

// --- TRÌNH CHỈNH SỬA PHẦN THƯỞNG TÙY CHỌN (CUSTOM REWARDS EDITOR) ---
function openRewardsEditorModal() {
  const modal = document.getElementById('rewardsEditorModal');
  if (!modal) return;
  renderRewardsEditorList();
  modal.classList.add('open');
}

function closeRewardsEditorModal() {
  const modal = document.getElementById('rewardsEditorModal');
  if (modal) modal.classList.remove('open');
}

function renderRewardsEditorList() {
  const container = document.getElementById('rewardsEditorList');
  if (!container) return;
  container.innerHTML = '';

  BONUS_REWARDS.forEach((item, index) => {
    container.appendChild(createRewardRowElement(item, index));
  });
}

function createRewardRowElement(item, index) {
  const row = document.createElement('div');
  row.className = 'reward-edit-row';
  row.dataset.index = index;

  row.innerHTML = `
    <input type="text" class="reward-icon-input" value="${item.icon || '🎁'}" maxlength="4" title="Biểu tượng Icon (Emoji)">
    <input type="text" class="reward-text-input" value="${item.text || ''}" placeholder="Tên phần thưởng..." maxlength="25">
    <input type="color" class="reward-color-input" value="${item.color || '#10b981'}" title="Màu nan quạt">
    <button type="button" class="btn-remove-reward" title="Xóa phần thưởng này">✕</button>
  `;

  row.querySelector('.btn-remove-reward').addEventListener('click', () => {
    const rows = document.querySelectorAll('.reward-edit-row');
    if (rows.length <= 2) {
      if (typeof showToast === 'function') showToast('Cần giữ lại ít nhất 2 ô phần thưởng để quay!', 'warning');
      return;
    }
    row.remove();
  });

  return row;
}

function addNewRewardRow(defaultItem = { text: "Phần thưởng mới", color: "#3b82f6", icon: "🎁" }) {
  const container = document.getElementById('rewardsEditorList');
  if (!container) return;
  const count = container.querySelectorAll('.reward-edit-row').length;
  if (count >= 16) {
    if (typeof showToast === 'function') showToast('Tối đa 16 ô phần thưởng để đảm bảo vòng quay hiển thị đẹp!', 'warning');
    return;
  }
  container.appendChild(createRewardRowElement(defaultItem, count));
}

function saveRewardsEditorSubmit() {
  const container = document.getElementById('rewardsEditorList');
  if (!container) return;
  const rows = container.querySelectorAll('.reward-edit-row');

  const newRewards = [];
  rows.forEach(r => {
    const icon = r.querySelector('.reward-icon-input').value.trim() || '🎁';
    const text = r.querySelector('.reward-text-input').value.trim();
    const color = r.querySelector('.reward-color-input').value || '#10b981';
    if (text) {
      newRewards.push({ icon, text, color });
    }
  });

  if (newRewards.length < 2) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập ít nhất 2 phần thưởng hợp lệ!', 'warning');
    return;
  }

  BONUS_REWARDS = newRewards;
  saveBonusRewardsToStorage();
  drawBonusWheel();
  closeRewardsEditorModal();

  if (typeof showToast === 'function') {
    showToast(`✅ Đã cập nhật ${BONUS_REWARDS.length} ô phần thưởng cho Vòng Quay Điểm Thưởng!`, 'success');
  }
}

function resetDefaultRewards() {
  if (!confirm('Khôi phục lại 8 ô phần thưởng mặc định ban đầu?')) return;
  BONUS_REWARDS = [...DEFAULT_BONUS_REWARDS];
  saveBonusRewardsToStorage();
  renderRewardsEditorList();
  drawBonusWheel();
  if (typeof showToast === 'function') {
    showToast('Đã khôi phục 8 ô phần thưởng mặc định!', 'info');
  }
}

window.WHEEL_COLORS = WHEEL_COLORS;
window.BONUS_REWARDS = BONUS_REWARDS;
window.drawLuckyWheel = drawLuckyWheel;
window.spinLuckyWheel = spinLuckyWheel;
window.finalizeWheelSpin = finalizeWheelSpin;
window.drawBonusWheel = drawBonusWheel;
window.spinBonusWheel = spinBonusWheel;
window.openBonusWheelModal = openBonusWheelModal;
window.closeBonusWheelModal = closeBonusWheelModal;
window.openRewardsEditorModal = openRewardsEditorModal;
window.closeRewardsEditorModal = closeRewardsEditorModal;
window.addNewRewardRow = addNewRewardRow;
window.saveRewardsEditorSubmit = saveRewardsEditorSubmit;
window.resetDefaultRewards = resetDefaultRewards;
