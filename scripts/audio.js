/**
 * ==============================================================================
 * MODULE ÂM THANH & HIỆU ỨNG PHÁO HOA (scripts/audio.js)
 * Tích hợp Web Audio API Synthesizer (chạy 100% offline, không cần file mp3 ngoài)
 * Hỗ trợ đa dạng chủ đề âm thanh:
 * - Khi quay: Cổ điển (Classic), Xổ số kịch tính (Suspense), Arcade 8-bit
 * - Khi dừng: Khúc khải hoàn (Fanfare), Tràng pháo tay (Applause), Tiếng chuông vàng (Chime)
 * ==============================================================================
 */

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  // Khởi tạo AudioContext khi có tương tác người dùng
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tiếng khi vòng quay lướt qua nan quạt theo Audio Theme đã chọn
  playTick(freq = 600, progress = 0) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const theme = (window.state && window.state.audioTheme) || 'classic';

    try {
      const now = this.ctx.currentTime;

      if (theme === 'suspense') {
        // Chủ đề Xổ số kịch tính: Âm bass trầm thúc giục + tiếng lách cách đếm ngược
        const oscBass = this.ctx.createOscillator();
        const gainBass = this.ctx.createGain();
        oscBass.type = 'sawtooth';
        oscBass.frequency.setValueAtTime(140 + progress * 160, now);
        oscBass.frequency.exponentialRampToValueAtTime(70, now + 0.05);
        gainBass.gain.setValueAtTime(0.2, now);
        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscBass.connect(gainBass);
        gainBass.connect(this.ctx.destination);
        oscBass.start(now);
        oscBass.stop(now + 0.05);

        // Click sắc nét
        const oscClick = this.ctx.createOscillator();
        const gainClick = this.ctx.createGain();
        oscClick.type = 'triangle';
        oscClick.frequency.setValueAtTime(750 + progress * 400, now);
        gainClick.gain.setValueAtTime(0.12, now);
        gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        oscClick.connect(gainClick);
        gainClick.connect(this.ctx.destination);
        oscClick.start(now);
        oscClick.stop(now + 0.03);

      } else if (theme === 'arcade') {
        // Chủ đề Arcade 8-bit retro vui nhộn
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq * 1.2, now);
        osc.frequency.setValueAtTime(freq * 1.5, now + 0.02);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);

      } else {
        // Chủ đề Cổ điển (Classic): Tiếng tách thanh mảnh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      console.warn("Audio playTick error:", e);
    }
  }

  // Tiếng nhạc chuỗi nốt chiến thắng (Fanfare arpeggio)
  playFanfare() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 587.33, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + index * 0.09;
        const duration = index === notes.length - 1 ? 0.6 : 0.12;

        osc.type = index === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn("Audio playFanfare error:", e);
    }
  }

  // Âm thanh vỗ tay rộn rã (Applause Synthesizer) tạo từ dải nhiễu trắng (White Noise)
  playApplause() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 giây vỗ tay
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Xung nhịp mô phỏng từng nhịp vỗ tay của đám đông
        const decay = Math.exp(-i / (this.ctx.sampleRate * 0.9));
        const noise = Math.random() * 2 - 1;
        const clapPulse = Math.sin(i * 0.04) > 0.65 ? 1.5 : 0.4;
        output[i] = noise * decay * clapPulse * 0.35;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Bộ lọc dải tần âm học (Bandpass Filter) để mô phỏng âm thanh tiếng vỗ tay thật
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1050;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch (e) {
      console.warn("Audio playApplause error:", e);
      this.playFanfare();
    }
  }

  // Tiếng chuông vàng lấp lánh (Magic Chimes / Glockenspiel)
  playChime() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [784, 988, 1175, 1318, 1568, 2093]; // G5, B5, D6, E6, G6, C7

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.07;
        const dur = 0.55;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn("Audio playChime error:", e);
    }
  }

  // Tiếng tích tắc đếm ngược hồi hộp của đồng hồ
  playTimerTick(secondsLeft = 10) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const isUrgent = secondsLeft <= 5;
      const freq = isUrgent ? 950 : 580;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isUrgent ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.05);

      gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn("Audio playTimerTick error:", e);
    }
  }

  // Âm thanh còi báo "HẾT GIỜ!" (Buzzer Alarm)
  playTimerBuzzer() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [145, 150].forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.setValueAtTime(0.3, now + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
      });
    } catch (e) {
      console.warn("Audio playTimerBuzzer error:", e);
    }
  }

  // Phát âm thanh chiến thắng dựa trên lựa chọn người dùng
  playVictory() {
    const theme = (window.state && window.state.celebrationTheme) || 'fanfare';
    if (theme === 'applause') {
      this.playApplause();
    } else if (theme === 'chime') {
      this.playChime();
    } else {
      this.playFanfare();
    }
  }

  // Âm nhạc cổ vũ chiến thắng đặc trưng riêng biệt cho từng Tổ (Web Audio API Synthesizer)
  playGroupVictory(groupNum) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (groupNum === 1) {
        // TỔ 1 (Xanh Dương): Cyber Fanfare & Electronic Chimes (Hợp âm C5 - E5 - G5 - B5 - C6)
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          const start = now + idx * 0.08;
          const dur = idx === notes.length - 1 ? 0.8 : 0.16;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, start);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2500, start);
          filter.frequency.exponentialRampToValueAtTime(800, start + dur);

          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
        setTimeout(() => this.playApplause(), 300);

      } else if (groupNum === 2) {
        // TỔ 2 (Xanh Lục): Khúc Ca Thiên Nhiên & Kèn Đồng Rộn Rã (Hợp âm F4 - A4 - C5 - F5 - A5 - C6)
        const notes = [349.23, 440.00, 523.25, 698.46, 880.00, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + idx * 0.09;
          const dur = idx >= notes.length - 2 ? 0.7 : 0.14;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
        setTimeout(() => this.playApplause(), 350);

      } else if (groupNum === 3) {
        // TỔ 3 (Vàng Cam): Trống Trận & Hào Khí Hừng Hực (4 Nhịp Bass Kick + Hợp âm D5 - F#5 - A5 - D6)
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = now + beat * 0.14;
          const oscKick = this.ctx.createOscillator();
          const gainKick = this.ctx.createGain();
          oscKick.type = 'sine';
          oscKick.frequency.setValueAtTime(160, beatTime);
          oscKick.frequency.exponentialRampToValueAtTime(45, beatTime + 0.1);
          gainKick.gain.setValueAtTime(0.4, beatTime);
          gainKick.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.1);
          oscKick.connect(gainKick);
          gainKick.connect(this.ctx.destination);
          oscKick.start(beatTime);
          oscKick.stop(beatTime + 0.1);
        }

        const notes = [587.33, 739.99, 880.00, 1174.66];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + 0.5 + idx * 0.09;
          const dur = 0.65;
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        });
        setTimeout(() => this.playApplause(), 500);

      } else if (groupNum === 4) {
        // TỔ 4 (Hồng Tím): Magic Harp Glissando & Chuông Pha Lê (Vuốt dây E5 - G#5 - B5 - E6 - G#6 - B6)
        const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + idx * 0.065;
          const dur = 0.85;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.22, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
        setTimeout(() => this.playApplause(), 400);

      } else {
        this.playVictory();
      }
    } catch (e) {
      console.warn("Audio playGroupVictory error:", e);
      this.playVictory();
    }
  }
}

// Khởi tạo đối tượng âm thanh toàn cục
window.sound = new SoundFX();

// ==============================================================================
// HIỆU ỨNG PHÁO GIẤY HOA RƠI PASTEL (PASTEL CONFETTI CARNIVAL)
// Kết hợp:
// 1. Đôi đại bác bắn chéo từ 2 góc dưới màn hình (Dual Corner Cannons)
// 2. Mưa cánh hoa (🌸), ngôi sao (✨), trái tim (💕) và hạt tròn rơi chậm từ đỉnh màn hình
// 3. Bảng màu Pastel đồng điệu: Hồng phấn, Cam đào, Vàng bơ, Xanh bạc hà, Kem ấm
// 4. Đồng bộ dải màu & Linh vật đại diện theo từng Tổ học tập
// ==============================================================================

const PASTEL_CELEBRATION_PALETTE = [
  '#f472b6', // Hồng phấn pastel
  '#fb923c', // Cam đào peach
  '#fde047', // Vàng bơ pastel
  '#fbcfe8', // Hồng nhạt pastel
  '#fed7aa', // Đào sữa pastel
  '#86efac', // Bạc hà mint pastel
  '#fffdfa'  // Trắng kem ấm
];

const GROUP_PASTEL_PALETTES = {
  1: ['#7dd3fc', '#38bdf8', '#bae6fd', '#0284c7', '#f0f9ff', '#fffdfa'], // Tổ 1: Xanh Lam Pastel
  2: ['#86efac', '#34d399', '#bbf7d0', '#16a34a', '#f0fdf4', '#fffdfa'], // Tổ 2: Xanh Bạc Hà Mint Pastel
  3: ['#fde047', '#fbbf24', '#fef08a', '#d97706', '#fffbeb', '#fffdfa'], // Tổ 3: Vàng Bơ Hổ Phách Pastel
  4: ['#f472b6', '#fbcfe8', '#f43f5e', '#db2777', '#fdf2f8', '#fffdfa']  // Tổ 4: Hồng Phấn Đào Pastel
};

function getPastelConfettiShapes(extraEmoji = null) {
  if (typeof confetti !== 'function') return ['circle', 'square'];

  const shapes = [];

  // Tạo emoji hình dạng độc đáo nếu thư viện hỗ trợ shapeFromText
  if (typeof confetti.shapeFromText === 'function') {
    try {
      const flower = confetti.shapeFromText({ text: '🌸', scalar: 2.0 });
      const star = confetti.shapeFromText({ text: '✨', scalar: 1.8 });
      const heart = confetti.shapeFromText({ text: '💕', scalar: 1.8 });
      if (flower) shapes.push(flower);
      if (star) shapes.push(star);
      if (heart) shapes.push(heart);

      // Nếu có linh vật riêng của Tổ trúng thưởng
      if (extraEmoji && typeof extraEmoji === 'string' && extraEmoji.trim().length > 0) {
        const mascotShape = confetti.shapeFromText({ text: extraEmoji.trim(), scalar: 2.2 });
        if (mascotShape) shapes.push(mascotShape);
      }
    } catch (e) {
      console.warn("Không thể render emoji confetti shape:", e);
    }
  }

  // Luôn thêm hạt tròn mềm mại
  shapes.push('circle');
  return shapes;
}

/**
 * Vũ điệu pháo hoa Pastel: Đại bác đôi 2 góc dưới + Mưa hoa rơi bồng bềnh từ trần màn hình
 * @param {Array<string>} palette - Mảng màu pastel
 * @param {Array<any>} shapes - Mảng hình dạng hạt
 */
function launchPastelCarnivalConfetti(palette, shapes) {
  if (typeof confetti !== 'function') return;

  const validPalette = (Array.isArray(palette) && palette.length > 0) ? palette : PASTEL_CELEBRATION_PALETTE;
  const validShapes = (Array.isArray(shapes) && shapes.length > 0) ? shapes : getPastelConfettiShapes();

  // ĐỢT 1: ĐÔI ĐẠI BÁC BẮN CHÉO TỪ 2 GÓC DƯỚI (DUAL CORNER CANNONS)
  // Góc dưới bên trái bắn hướng lên sang phải (góc 60 độ)
  confetti({
    particleCount: 55,
    angle: 60,
    spread: 55,
    origin: { x: 0.05, y: 0.88 },
    colors: validPalette,
    shapes: validShapes,
    scalar: 1.15,
    drift: 0.2,
    startVelocity: 55,
    ticks: 240,
    gravity: 0.9
  });

  // Góc dưới bên phải bắn hướng lên sang trái (góc 120 độ)
  confetti({
    particleCount: 55,
    angle: 120,
    spread: 55,
    origin: { x: 0.95, y: 0.88 },
    colors: validPalette,
    shapes: validShapes,
    scalar: 1.15,
    drift: -0.2,
    startVelocity: 55,
    ticks: 240,
    gravity: 0.9
  });

  // Đợt nổ bổ trợ ở tâm giữa chậm hơn 120ms
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 90,
      spread: 75,
      origin: { x: 0.5, y: 0.72 },
      colors: validPalette,
      shapes: validShapes,
      scalar: 1.25,
      startVelocity: 48,
      ticks: 260,
      gravity: 0.85
    });
  }, 120);

  // ĐỢT 2: CƠN MƯA CÁNH HOA VÀ NGÔI SAO RƠI CHẬM TỪ TRÊN CAO (GENTLE SKY PETAL SHOWER)
  // Khởi động sau 280ms, kéo dài ~1.12 giây với vận tốc rơi êm ái, bồng bềnh
  setTimeout(() => {
    let showerTick = 0;
    const maxShowerBursts = 14; // 14 nhịp x 80ms = ~1.12 giây
    const showerTimer = setInterval(() => {
      if (showerTick >= maxShowerBursts || typeof confetti !== 'function') {
        clearInterval(showerTimer);
        return;
      }
      showerTick++;

      // Rải ngẫu nhiên cánh hoa và ngôi sao từ trần màn hình
      confetti({
        particleCount: 6,
        angle: 90,
        spread: 120,
        origin: { x: 0.1 + Math.random() * 0.8, y: -0.02 },
        colors: validPalette,
        shapes: validShapes,
        gravity: 0.55,                      // Trọng lực nhỏ -> hạt rơi chậm, bay lượn
        startVelocity: 5,                    // Vận tốc ban đầu nhỏ để rơi tự nhiên
        scalar: 1.35,                       // Cánh hoa to rõ
        drift: (Math.random() - 0.5) * 0.7, // Gió nhẹ đung đưa qua lại
        ticks: 320
      });
    }, 80);
  }, 280);
}

// 1. Pháo hoa mừng chiến thắng chung (Gọi tên Slot, Vòng quay Wheel, Đấu trường Quiz)
function triggerCelebrationConfetti() {
  if (typeof confetti !== 'function') return;
  const shapes = getPastelConfettiShapes();
  launchPastelCarnivalConfetti(PASTEL_CELEBRATION_PALETTE, shapes);
}

// 2. Pháo hoa Confetti đa tầng theo dải màu & linh vật của Tổ trúng thưởng
function triggerGroupConfetti(groupNum) {
  if (typeof confetti !== 'function') return;

  const palette = GROUP_PASTEL_PALETTES[groupNum] || PASTEL_CELEBRATION_PALETTE;

  // Lấy linh vật đại diện của Tổ nếu có trong SeatingState
  let mascot = null;
  if (window.SeatingState && window.SeatingState.groupProfiles && window.SeatingState.groupProfiles[groupNum]) {
    mascot = window.SeatingState.groupProfiles[groupNum].mascot;
  }

  const shapes = getPastelConfettiShapes(mascot);
  launchPastelCarnivalConfetti(palette, shapes);
}

window.triggerCelebrationConfetti = triggerCelebrationConfetti;
window.triggerGroupConfetti = triggerGroupConfetti;
window.launchPastelCarnivalConfetti = launchPastelCarnivalConfetti;

/**
 * ==============================================================================
 * BÌNH LUẬN VIÊN GIỌNG NÓI AI (VOICE ANNOUNCER)
 * Tích hợp Web Speech API (speechSynthesis) tự nhiên:
 * - Tự động phát hiện giọng đọc Tiếng Việt (vi-VN, Google Tiếng Việt, Microsoft HoaiMy, Linh...)
 * - Kịch bản phát thanh sinh động kèm Tên, Vị trí bàn ghế, Biệt đội & Linh vật Tổ
 * - Tự động tránh chồng lấn âm thanh và hỗ trợ bật/tắt linh hoạt
 * ==============================================================================
 */
class VoiceAnnouncer {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.enabled = true;
    this.voices = [];
    this.selectedVoice = null;
    this.preferredVoiceURI = null;
    this.rate = 1.02;  // Tốc độ phát thanh (0.5 -> 2.0)
    this.pitch = 1.06; // Cao độ phát thanh (0.5 -> 2.0)
    this.volume = 1.0;
    this.init();
  }

  // Khởi tạo giọng đọc, nạp tham số từ LocalStorage và tìm voice tiếng Việt
  init() {
    try {
      const savedEnabled = localStorage.getItem('vong_quay_voice_announcer_enabled');
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }

      const savedRate = localStorage.getItem('vong_quay_voice_announcer_rate');
      if (savedRate !== null) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) this.rate = parsed;
      }

      const savedPitch = localStorage.getItem('vong_quay_voice_announcer_pitch');
      if (savedPitch !== null) {
        const parsed = parseFloat(savedPitch);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) this.pitch = parsed;
      }

      this.preferredVoiceURI = localStorage.getItem('vong_quay_voice_announcer_voice_uri') || null;
    } catch (e) {
      console.warn("Lỗi đọc trạng thái VoiceAnnouncer từ LocalStorage:", e);
    }

    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      if (!this.voices || this.voices.length === 0) return;

      // 1. Kiểm tra nếu người dùng đã từng chọn một giọng cụ thể
      if (this.preferredVoiceURI) {
        const matched = this.voices.find(v => (v.voiceURI === this.preferredVoiceURI || v.name === this.preferredVoiceURI));
        if (matched) {
          this.selectedVoice = matched;
          this.syncModalUI();
          return;
        }
      }

      // 2. Lọc danh sách giọng đọc Tiếng Việt
      const viVoices = this.voices.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        return lang.startsWith('vi') || lang.includes('vietnam');
      });

      if (viVoices.length > 0) {
        // Ưu tiên giọng tự nhiên cao cấp: Google, Microsoft HoaiMy/NamMinh, Natural
        const preferred = viVoices.find(v => /google|hoaimy|namminh|natural|online/i.test(v.name));
        this.selectedVoice = preferred || viVoices[0];
      } else {
        // Dự phòng giọng mặc định của hệ thống
        this.selectedVoice = this.voices.find(v => v.default) || this.voices[0] || null;
      }

      this.syncModalUI();
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Điều chỉnh tốc độ đọc (Speed / Rate: 0.5x - 1.8x)
  setRate(value) {
    const num = Math.max(0.5, Math.min(2.0, parseFloat(value) || 1.0));
    this.rate = Math.round(num * 100) / 100;
    try {
      localStorage.setItem('vong_quay_voice_announcer_rate', String(this.rate));
    } catch (e) {}
    this.syncModalUI();
    return this.rate;
  }

  // Điều chỉnh cao độ giọng (Pitch: 0.5x - 1.8x)
  setPitch(value) {
    const num = Math.max(0.5, Math.min(2.0, parseFloat(value) || 1.0));
    this.pitch = Math.round(num * 100) / 100;
    try {
      localStorage.setItem('vong_quay_voice_announcer_pitch', String(this.pitch));
    } catch (e) {}
    this.syncModalUI();
    return this.pitch;
  }

  // Đổi giọng đọc từ danh sách thiết bị
  setVoiceByURI(voiceURI) {
    if (!this.voices || this.voices.length === 0) return;
    const found = this.voices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
    if (found) {
      this.selectedVoice = found;
      this.preferredVoiceURI = voiceURI;
      try {
        localStorage.setItem('vong_quay_voice_announcer_voice_uri', voiceURI);
      } catch (e) {}
    }
  }

  // Áp dụng nhanh bộ thiết lập theo lứa tuổi học sinh
  applyAgePreset(presetKey) {
    if (presetKey === 'primary') {
      // Tiểu học / Mầm non: Giọng nhí nhảnh, cao, vui nhộn
      this.setRate(0.98);
      this.setPitch(1.35);
      this.speak("Xin chào các bạn nhỏ! Chúng mình cùng học thật vui nhé!");
    } else if (presetKey === 'secondary') {
      // THCS (Cấp 2): Hào hứng, dứt khoát, tự nhiên
      this.setRate(1.05);
      this.setPitch(1.08);
      this.speak("Xin chào các bạn! Hãy chuẩn bị sẵn sàng trả lời câu hỏi nhé!");
    } else if (presetKey === 'highschool') {
      // THPT (Cấp 3): Trầm ấm, truyền cảm, trang trọng
      this.setRate(1.0);
      this.setPitch(0.85);
      this.speak("Xin chúc mừng bạn đã được chọn tham gia phần thi tiếp theo.");
    }
    this.syncModalUI();
  }

  // Đọc thử câu thoại mẫu để kiểm tra âm thanh
  testVoice() {
    const wasEnabled = this.enabled;
    this.enabled = true;
    try {
      localStorage.setItem('vong_quay_voice_announcer_enabled', 'true');
    } catch (e) {}

    this.speak("Mời bạn Nguyễn Minh Huy hãy tự tin đứng dậy trả lời câu hỏi nhé!");

    if (!wasEnabled) {
      this.syncModalUI();
      const btn = document.getElementById('btnVoiceAnnouncerToggle');
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🗣️ Giọng AI: BẬT</span>';
      }
    }
  }

  // Đọc câu thoại bất kỳ
  speak(text) {
    if (!this.enabled || !this.synth || !text) return;

    try {
      this.synth.cancel(); // Ngắt câu cũ để tránh chồng lấn âm thanh
      if (typeof this.synth.resume === 'function') {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang || 'vi-VN';
      } else {
        utterance.lang = 'vi-VN';
      }
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      // Giữ tham chiếu toàn cục tránh browser Garbage Collection xóa giữa chừng
      window._activeSpeechUtterance = utterance;
      utterance.onend = () => { window._activeSpeechUtterance = null; };
      utterance.onerror = (e) => {
        console.warn("Lỗi phát âm SpeechSynthesis:", e);
        window._activeSpeechUtterance = null;
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn("Lỗi phát giọng đọc AI:", err);
    }
  }

  // Đồng bộ giá trị lên các thành phần giao diện nếu đang mở
  syncModalUI() {
    const rateSlider = document.getElementById('voiceRateSlider');
    const rateText = document.getElementById('voiceRateValueText');
    const pitchSlider = document.getElementById('voicePitchSlider');
    const pitchText = document.getElementById('voicePitchValueText');
    const modalToggle = document.getElementById('voiceAnnouncerModalToggle');
    const voiceSelect = document.getElementById('voiceDeviceSelect');

    if (rateSlider) rateSlider.value = this.rate;
    if (rateText) rateText.textContent = `${this.rate.toFixed(2)}x`;

    if (pitchSlider) pitchSlider.value = this.pitch;
    if (pitchText) {
      let pitchLabel = 'Tự nhiên';
      if (this.pitch > 1.2) pitchLabel = 'Vui nhộn / Nhí nhảnh';
      else if (this.pitch < 0.95) pitchLabel = 'Trầm ấm / Chững chạc';
      pitchText.textContent = `${this.pitch.toFixed(2)}x (${pitchLabel})`;
    }

    if (modalToggle) modalToggle.checked = this.enabled;

    // Nạp danh sách giọng đọc vào dropdown nếu có
    if (voiceSelect && this.voices && this.voices.length > 0 && voiceSelect.options.length <= 1) {
      voiceSelect.innerHTML = '';
      this.voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        const isVi = (v.lang || '').toLowerCase().startsWith('vi');
        opt.textContent = `${isVi ? '🇻🇳 ' : '🌐 '}${v.name} (${v.lang || 'default'})`;
        if (this.selectedVoice && (v.voiceURI === this.selectedVoice.voiceURI || v.name === this.selectedVoice.name)) {
          opt.selected = true;
        }
        voiceSelect.appendChild(opt);
      });
    } else if (voiceSelect && this.selectedVoice) {
      for (let i = 0; i < voiceSelect.options.length; i++) {
        if (voiceSelect.options[i].value === this.selectedVoice.voiceURI) {
          voiceSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  // Bình luận viên xướng tên người chiến thắng trên sơ đồ kèm Tổ và Linh vật
  speakWinner({ name, row, col, aisle, groupNum, groupName, mascot }) {
    if (!this.enabled || !this.synth || !name) return;

    const teamTitle = (mascot ? mascot + ' ' : '') + (groupName || (groupNum ? 'Tổ ' + groupNum : ''));

    let templates = [];
    if (teamTitle) {
      templates = [
        `Mời bạn ${name} đến từ ${teamTitle}!`,
        `Xin mời bạn ${name} của ${teamTitle} hãy đứng dậy trả lời câu hỏi!`,
        `Mời bạn ${name}! Đại diện xuất sắc của ${teamTitle}!`,
        `Xin chúc mừng và mời bạn ${name} thuộc ${teamTitle}!`,
        `Mời bạn ${name} hãy tự tin trả lời giúp ${teamTitle} ghi điểm nào!`
      ];
    } else {
      templates = [
        `Mời bạn ${name}!`,
        `Xin mời bạn ${name} hãy đứng dậy trả lời câu hỏi!`,
        `Mời bạn ${name} hãy tự tin đứng lên nào!`,
        `Xin chúc mừng và mời bạn ${name}!`
      ];
    }

    const scriptText = templates[Math.floor(Math.random() * templates.length)];

    // Trì hoãn nhẹ 400ms để hiệu ứng pháo hoa và chuông nổ mở màn xong rồi giọng đọc cất lên rõ ràng
    setTimeout(() => {
      this.speak(scriptText);
    }, 400);
  }
}

// Khởi tạo bình luận viên AI toàn cục
window.voiceAnnouncer = new VoiceAnnouncer();
