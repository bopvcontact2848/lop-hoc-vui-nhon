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

  // Tiếng click kịch tính trong 3 giây cuối kèm nhịp tim đập thót tim (Heartbeat Sub-bass + Click)
  playTensionTick(_progress = 0.8, remainingSlices = 2) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. ÂM THANH NHỊP TIM THÓT TIM (Heartbeat Sub-bass Thud)
      const oscHeart = this.ctx.createOscillator();
      const gainHeart = this.ctx.createGain();
      const filterHeart = this.ctx.createBiquadFilter();

      oscHeart.type = 'sine';
      oscHeart.frequency.setValueAtTime(56, now);
      oscHeart.frequency.exponentialRampToValueAtTime(30, now + 0.22);

      filterHeart.type = 'lowpass';
      filterHeart.frequency.setValueAtTime(80, now);

      // Càng gần đích (còn ít nan quạt), nhịp tim đập càng mạnh mẽ
      const heartVol = remainingSlices <= 1.2 ? 0.38 : (remainingSlices <= 2.2 ? 0.32 : 0.25);
      gainHeart.gain.setValueAtTime(heartVol, now);
      gainHeart.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      oscHeart.connect(filterHeart);
      filterHeart.connect(gainHeart);
      gainHeart.connect(this.ctx.destination);
      oscHeart.start(now);
      oscHeart.stop(now + 0.25);

      // 2. ÂM THANH CLICK SẮC NÉT CƠ HỌC (Sharp Mechanical Click)
      const oscClick = this.ctx.createOscillator();
      const gainClick = this.ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(820 + (1 - Math.min(remainingSlices / 3, 1)) * 220, now);
      oscClick.frequency.exponentialRampToValueAtTime(260, now + 0.04);

      gainClick.gain.setValueAtTime(0.24, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      oscClick.connect(gainClick);
      gainClick.connect(this.ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + 0.05);

    } catch (e) {
      console.warn("Audio playTensionTick error:", e);
    }
  }

  // Âm thanh kim gật gù đàn hồi cơ học nảy tắt dần khi bánh xe dừng hẳn (Plastic Spring Snap)
  playPointerSpringSnap() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const snaps = [
        { time: 0, freq: 880, vol: 0.22, dur: 0.035 },
        { time: 0.08, freq: 720, vol: 0.14, dur: 0.025 },
        { time: 0.16, freq: 580, vol: 0.07, dur: 0.020 }
      ];

      snaps.forEach(snap => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + snap.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(snap.freq, t);
        osc.frequency.exponentialRampToValueAtTime(snap.freq * 0.45, t + snap.dur);

        gain.gain.setValueAtTime(snap.vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + snap.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + snap.dur);
      });
    } catch (e) {
      console.warn("Audio playPointerSpringSnap error:", e);
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

  // Âm thanh vệt sáng laser / tia sét bốc thăm gọi tên (Web Audio Synthesizer)
  playLaserZap(pitch = 750) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn("Audio playLaserZap error:", e);
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

  // Âm thanh nhịp tim dồn dập (Heartbeat Countdown) trong 10 giây cuối cùng
  playHeartbeat(secondsLeft = 10) {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const isExtreme = secondsLeft <= 4;

      // Nhịp đập 1: "Thình" (Sub-bass sâu thẳm)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(isExtreme ? 65 : 55, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.16);

      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(isExtreme ? 110 : 90, now);

      gain1.gain.setValueAtTime(isExtreme ? 0.45 : 0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Nhịp đập 2: "Thịch" (sau 0.13 giây)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const filter2 = this.ctx.createBiquadFilter();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(isExtreme ? 72 : 62, now + 0.13);
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.28);

      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(isExtreme ? 120 : 95, now + 0.13);

      gain2.gain.setValueAtTime(isExtreme ? 0.38 : 0.28, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.32);

      // Tiếng tick kim loại đồng hồ dồn dập
      const oscTick = this.ctx.createOscillator();
      const gainTick = this.ctx.createGain();
      oscTick.type = isExtreme ? 'sawtooth' : 'triangle';
      oscTick.frequency.setValueAtTime(isExtreme ? 1100 : 850, now);
      oscTick.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gainTick.gain.setValueAtTime(isExtreme ? 0.24 : 0.15, now);
      gainTick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscTick.connect(gainTick);
      gainTick.connect(this.ctx.destination);
      oscTick.start(now);
      oscTick.stop(now + 0.055);

    } catch (e) {
      console.warn("Audio playHeartbeat error:", e);
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

  // Tiếng đại bác phóng pháo hoa ("VÚT... BÙM!")
  playFireworkLaunch() {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (_err) {}
  }

  // Âm thanh chuông chiến thắng Ting-Ting đặc biệt (Victory Chime) khi hoàn thành 10/10 câu trước thời hạn
  playVictoryChime() {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Chuỗi hợp âm chuông pha lê ngũ cung C Major rực rỡ
      const notes = [
        { f: 1046.50, t: 0, d: 0.8 },     // C6
        { f: 1318.51, t: 0.08, d: 0.85 }, // E6
        { f: 1567.98, t: 0.16, d: 0.9 },  // G6
        { f: 2093.00, t: 0.24, d: 1.1 },  // C7
        { f: 2637.02, t: 0.32, d: 1.3 },  // E7
        { f: 3135.96, t: 0.40, d: 1.6 }   // G7
      ];

      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + n.t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, startTime);

        gain.gain.setValueAtTime(0.28, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + n.d);
      });

      // Kèm tiếng vỗ tay rộn rã chúc mừng
      setTimeout(() => {
        this.playApplause();
      }, 350);

    } catch (e) {
      console.warn("Audio playVictoryChime error:", e);
    }
  }

  // ==================== NHẠC NỀN THI ĐẤU (BATTLE / FOCUS BACKGROUND MUSIC) ====================
  // Bộ tổng hợp nhạc nền Web Audio API: 2 Thể loại ("epic" - Sôi động kịch tính 124 BPM hoặc "chill" - Nhẹ nhàng tập trung 84 BPM Lofi)
  startBattleMusic(genre) {
    this.init();
    if (!this.ctx) return false;

    if (genre && (genre === 'epic' || genre === 'chill')) {
      this._battleBgmGenre = genre;
    } else if (!this._battleBgmGenre) {
      this._battleBgmGenre = 'epic';
    }

    if (this._battleBgmPlaying) {
      return true;
    }

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const isChill = (this._battleBgmGenre === 'chill');
      const volRatio = (typeof this._battleBgmVolume === 'number') ? this._battleBgmVolume : 0.7;
      const basePeak = isChill ? 0.25 : 0.30;
      const targetGain = Math.max(0.01, basePeak * volRatio);
      this._battleBgmPlaying = true;
      this._battleBgmMasterGain = this.ctx.createGain();
      this._battleBgmMasterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this._battleBgmMasterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.6); // Fade-in êm ái
      this._battleBgmMasterGain.connect(this.ctx.destination);

      let step = 0;
      const bpm = isChill ? 84 : 124;
      const stepInterval = (60 / bpm) / 4; // 16th note
      let nextStepTime = this.ctx.currentTime + 0.05;

      // Chuỗi nốt Epic: Bassline A minor kịch tính (A1, C2, D2, F1, E1)
      const epicBassNotes = [55, 55, 65.4, 55, 73.4, 55, 65.4, 55, 43.65, 43.65, 55, 43.65, 41.2, 41.2, 49, 41.2];

      // Chuỗi hợp âm Chill Lofi (Cmaj7, Am7, Fmaj7, G6)
      const chillChords = [
        [261.6, 329.6, 392.0, 493.9], // Cmaj7 (C4, E4, G4, B4)
        [220.0, 261.6, 329.6, 392.0], // Am7 (A3, C4, E4, G4)
        [174.6, 220.0, 261.6, 329.6], // Fmaj7 (F3, A3, C4, E4)
        [196.0, 246.9, 293.7, 392.0]  // G6 (G3, B3, D4, G4)
      ];
      const chillArp = [261.6, 329.6, 392.0, 523.2, 392.0, 329.6, 220.0, 261.6];

      const scheduleBattleStep = () => {
        if (!this._battleBgmPlaying || !this.ctx) return;

        while (nextStepTime < this.ctx.currentTime + 0.15) {
          const currentStep = step % 16;
          const t = nextStepTime;

          if (isChill) {
            // ===== CHILL / LO-FI FOCUS BEAT (84 BPM) =====
            // 1. Soft Deep Kick ở Beat 0 và Beat 8
            if (currentStep === 0 || currentStep === 8) {
              const oscKick = this.ctx.createOscillator();
              const gainKick = this.ctx.createGain();
              oscKick.type = 'sine';
              oscKick.frequency.setValueAtTime(80, t);
              oscKick.frequency.exponentialRampToValueAtTime(38, t + 0.2);
              gainKick.gain.setValueAtTime(0.24, t);
              gainKick.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
              oscKick.connect(gainKick);
              gainKick.connect(this._battleBgmMasterGain);
              oscKick.start(t);
              oscKick.stop(t + 0.24);
            }

            // 2. Soft Rim Click / Finger Snap ở Beat 4 và Beat 12
            if (currentStep === 4 || currentStep === 12) {
              const oscSnap = this.ctx.createOscillator();
              const gainSnap = this.ctx.createGain();
              const filterSnap = this.ctx.createBiquadFilter();
              oscSnap.type = 'triangle';
              oscSnap.frequency.setValueAtTime(440, t);
              filterSnap.type = 'bandpass';
              filterSnap.frequency.setValueAtTime(1600, t);
              gainSnap.gain.setValueAtTime(0.12, t);
              gainSnap.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
              oscSnap.connect(filterSnap);
              filterSnap.connect(gainSnap);
              gainSnap.connect(this._battleBgmMasterGain);
              oscSnap.start(t);
              oscSnap.stop(t + 0.09);
            }

            // 3. Shaker êm dịu ở các nhịp lẻ
            if (currentStep % 4 === 2) {
              const oscShaker = this.ctx.createOscillator();
              const gainShaker = this.ctx.createGain();
              const filterShaker = this.ctx.createBiquadFilter();
              oscShaker.type = 'sine';
              oscShaker.frequency.setValueAtTime(3200, t);
              filterShaker.type = 'highpass';
              filterShaker.frequency.setValueAtTime(2800, t);
              gainShaker.gain.setValueAtTime(0.035, t);
              gainShaker.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
              oscShaker.connect(filterShaker);
              filterShaker.connect(gainShaker);
              gainShaker.connect(this._battleBgmMasterGain);
              oscShaker.start(t);
              oscShaker.stop(t + 0.045);
            }

            // 4. Hợp âm Rhodes Piano êm dịu (chuyển hợp âm mỗi 4 nhịp)
            if (currentStep === 0 || currentStep === 4 || currentStep === 8 || currentStep === 12) {
              const chordIdx = Math.floor(currentStep / 4);
              const chord = chillChords[chordIdx] || chillChords[0];
              chord.forEach((freq, noteIdx) => {
                const oscChord = this.ctx.createOscillator();
                const gainChord = this.ctx.createGain();
                const filterChord = this.ctx.createBiquadFilter();

                oscChord.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
                oscChord.frequency.setValueAtTime(freq, t);

                filterChord.type = 'lowpass';
                filterChord.frequency.setValueAtTime(950, t);

                gainChord.gain.setValueAtTime(0.04, t);
                gainChord.gain.exponentialRampToValueAtTime(0.001, t + stepInterval * 3.8);

                oscChord.connect(filterChord);
                filterChord.connect(gainChord);
                gainChord.connect(this._battleBgmMasterGain);
                oscChord.start(t);
                oscChord.stop(t + stepInterval * 3.9);
              });
            }

            // 5. Giai điệu Arpeggio giọt nước lofi thanh tao
            if (currentStep % 2 === 0) {
              const noteFreq = chillArp[(step / 2) % chillArp.length];
              const oscArp = this.ctx.createOscillator();
              const gainArp = this.ctx.createGain();
              oscArp.type = 'sine';
              oscArp.frequency.setValueAtTime(noteFreq, t);
              gainArp.gain.setValueAtTime(0.03, t);
              gainArp.gain.exponentialRampToValueAtTime(0.001, t + stepInterval * 1.6);
              oscArp.connect(gainArp);
              gainArp.connect(this._battleBgmMasterGain);
              oscArp.start(t);
              oscArp.stop(t + stepInterval * 1.7);
            }

          } else {
            // ===== EPIC BATTLE BEAT (124 BPM) =====
            // 1. Kick Drum (Beat 0, 4, 8, 12 - nhịp 4/4 chắc nịch)
            if (currentStep === 0 || currentStep === 4 || currentStep === 8 || currentStep === 12) {
              const oscKick = this.ctx.createOscillator();
              const gainKick = this.ctx.createGain();
              oscKick.type = 'sine';
              oscKick.frequency.setValueAtTime(110, t);
              oscKick.frequency.exponentialRampToValueAtTime(35, t + 0.14);
              gainKick.gain.setValueAtTime(0.45, t);
              gainKick.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
              oscKick.connect(gainKick);
              gainKick.connect(this._battleBgmMasterGain);
              oscKick.start(t);
              oscKick.stop(t + 0.18);
            }

            // 2. Snare / Clap (Beat 4, 12)
            if (currentStep === 4 || currentStep === 12) {
              const oscSnare = this.ctx.createOscillator();
              const gainSnare = this.ctx.createGain();
              oscSnare.type = 'triangle';
              oscSnare.frequency.setValueAtTime(220, t);
              oscSnare.frequency.exponentialRampToValueAtTime(90, t + 0.1);
              gainSnare.gain.setValueAtTime(0.2, t);
              gainSnare.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
              oscSnare.connect(gainSnare);
              gainSnare.connect(this._battleBgmMasterGain);
              oscSnare.start(t);
              oscSnare.stop(t + 0.13);
            }

            // 3. Hi-Hat kim loại nảy xì xào (Mỗi nốt thứ 2, 6, 10, 14)
            if (currentStep % 2 === 1) {
              const oscHat = this.ctx.createOscillator();
              const gainHat = this.ctx.createGain();
              const filterHat = this.ctx.createBiquadFilter();
              oscHat.type = 'sawtooth';
              oscHat.frequency.setValueAtTime(7500, t);
              filterHat.type = 'highpass';
              filterHat.frequency.setValueAtTime(6000, t);
              gainHat.gain.setValueAtTime(0.08, t);
              gainHat.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
              oscHat.connect(filterHat);
              filterHat.connect(gainHat);
              gainHat.connect(this._battleBgmMasterGain);
              oscHat.start(t);
              oscHat.stop(t + 0.045);
            }

            // 4. Bassline Synth điện tử chạy nhịp nhàng dồn dập
            const freq = epicBassNotes[currentStep];
            if (freq) {
              const oscBass = this.ctx.createOscillator();
              const gainBass = this.ctx.createGain();
              const filterBass = this.ctx.createBiquadFilter();

              oscBass.type = 'sawtooth';
              oscBass.frequency.setValueAtTime(freq, t);

              filterBass.type = 'lowpass';
              filterBass.frequency.setValueAtTime(320, t);
              filterBass.frequency.exponentialRampToValueAtTime(140, t + stepInterval * 0.85);

              gainBass.gain.setValueAtTime(0.18, t);
              gainBass.gain.exponentialRampToValueAtTime(0.001, t + stepInterval * 0.9);

              oscBass.connect(filterBass);
              filterBass.connect(gainBass);
              gainBass.connect(this._battleBgmMasterGain);
              oscBass.start(t);
              oscBass.stop(t + stepInterval * 0.95);
            }
          }

          nextStepTime += stepInterval;
          step++;
        }

        this._battleBgmTimer = setTimeout(scheduleBattleStep, 50);
      };

      scheduleBattleStep();
      return true;

    } catch (e) {
      console.warn("Audio startBattleMusic error:", e);
      this._battleBgmPlaying = false;
      return false;
    }
  }

  setBattleMusicGenre(genre) {
    if (genre !== 'epic' && genre !== 'chill') return;
    this._battleBgmGenre = genre;
    if (this._battleBgmPlaying) {
      this.stopBattleMusic(0.2);
      setTimeout(() => {
        this.startBattleMusic(genre);
      }, 230);
    }
  }

  getBattleMusicGenre() {
    return this._battleBgmGenre || 'epic';
  }

  setBattleMusicVolume(percent) {
    const clamped = Math.min(100, Math.max(10, Number(percent) || 70));
    this._battleBgmVolume = clamped / 100;
    if (this._battleBgmPlaying && this._battleBgmMasterGain && this.ctx) {
      const isChill = (this._battleBgmGenre === 'chill');
      const basePeak = isChill ? 0.25 : 0.30;
      const targetGain = Math.max(0.01, basePeak * this._battleBgmVolume);
      try {
        const now = this.ctx.currentTime;
        this._battleBgmMasterGain.gain.setValueAtTime(this._battleBgmMasterGain.gain.value, now);
        this._battleBgmMasterGain.gain.linearRampToValueAtTime(targetGain, now + 0.08);
      } catch (_e) {}
    }
  }

  getBattleMusicVolume() {
    const ratio = (typeof this._battleBgmVolume === 'number') ? this._battleBgmVolume : 0.7;
    return Math.round(ratio * 100);
  }

  stopBattleMusic(fadeTime = 0.5) {
    if (!this._battleBgmPlaying) return;
    this._battleBgmPlaying = false;

    if (this._battleBgmTimer) {
      clearTimeout(this._battleBgmTimer);
      this._battleBgmTimer = null;
    }

    if (this._battleBgmMasterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this._battleBgmMasterGain.gain.setValueAtTime(this._battleBgmMasterGain.gain.value, now);
        this._battleBgmMasterGain.gain.linearRampToValueAtTime(0.001, now + fadeTime);
        setTimeout(() => {
          if (this._battleBgmMasterGain) {
            try { this._battleBgmMasterGain.disconnect(); } catch (_e) {}
            this._battleBgmMasterGain = null;
          }
        }, (fadeTime + 0.05) * 1000);
      } catch (_e) {
        this._battleBgmMasterGain = null;
      }
    }
  }

  isBattleMusicPlaying() {
    return Boolean(this._battleBgmPlaying);
  }

  // Tiếng nổ pháo hoa kèm chuỗi nổ lách tách, xèo xèo tí tách chân thực (Burst & Crackle)
  playFireworkBurst(intensity = 'medium') {
    if (!window.state || !window.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const isGrand = intensity === 'grand';
      const isDouble = intensity === 'double';

      // --- PHẦN 1: TIẾNG NỔ BÙM TRẦM (BASS BOOM) ---
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(isGrand ? 160 : 130, now);
      oscBoom.frequency.exponentialRampToValueAtTime(32, now + (isGrand ? 0.35 : 0.24));

      gainBoom.gain.setValueAtTime(isGrand ? 0.45 : 0.32, now);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, now + (isGrand ? 0.38 : 0.26));

      oscBoom.connect(gainBoom);
      gainBoom.connect(this.ctx.destination);
      oscBoom.start(now);
      oscBoom.stop(now + 0.4);

      // --- PHẦN 2: TIẾNG VỌNG VỞ KHÔNG KHÍ (NOISE THUD) ---
      const thudDuration = isGrand ? 0.28 : 0.18;
      const thudBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * thudDuration), this.ctx.sampleRate);
      const thudData = thudBuffer.getChannelData(0);
      for (let i = 0; i < thudData.length; i++) {
        thudData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
      }
      const thudSource = this.ctx.createBufferSource();
      thudSource.buffer = thudBuffer;

      const thudFilter = this.ctx.createBiquadFilter();
      thudFilter.type = 'lowpass';
      thudFilter.frequency.setValueAtTime(500, now);
      thudFilter.frequency.exponentialRampToValueAtTime(80, now + thudDuration);

      const thudGain = this.ctx.createGain();
      thudGain.gain.setValueAtTime(isGrand ? 0.4 : 0.28, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + thudDuration);

      thudSource.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudSource.start(now);

      // --- PHẦN 3: TIẾNG NỔ LÁCH TÁCH, XÈO XÈO ĐỒNG BỘ (CRACKLING SPARKLES) ---
      const popCount = isGrand ? 30 : (isDouble ? 22 : 16);
      const crackleDuration = isGrand ? 1.05 : 0.75;

      for (let p = 0; p < popCount; p++) {
        const delay = 0.04 + Math.random() * crackleDuration;
        const popTime = now + delay;
        const popDur = 0.012 + Math.random() * 0.018;

        const popBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * popDur), this.ctx.sampleRate);
        const popData = popBuffer.getChannelData(0);
        for (let i = 0; i < popData.length; i++) {
          popData[i] = (Math.random() * 2 - 1) * (1 - i / popData.length);
        }
        const popSource = this.ctx.createBufferSource();
        popSource.buffer = popBuffer;

        const popFilter = this.ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(2400 + Math.random() * 3200, popTime);
        popFilter.Q.setValueAtTime(3.8, popTime);

        const popGain = this.ctx.createGain();
        const vol = 0.14 + Math.random() * 0.18;
        popGain.gain.setValueAtTime(vol, popTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, popTime + popDur);

        popSource.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.ctx.destination);
        popSource.start(popTime);
      }
    } catch (_err) {}
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

// Bảng màu kim tuyến & pháo hoa rực rỡ hoàng gia (Golden Jubilee & Vibrant Celebration)
const VIBRANT_FIREWORKS_PALETTE = [
  '#ffd700', // Vàng gold óng ả
  '#ff3b30', // Đỏ tươi rực rỡ
  '#ff9500', // Cam đào năng động
  '#00e5ff', // Lam ngọc dạ quang
  '#34c759', // Xanh ngọc lục bảo
  '#ff2d55', // Hồng cánh sen
  '#ffea00', // Vàng chanh lấp lánh
  '#ffffff'  // Trắng bạc ánh sao
];

/**
 * HIỆU ỨNG PHÁO HOA & KIM TUYẾN TOÀN MÀN HÌNH SIÊU HOÀNG TRÁNG (GRAND FIREWORKS & FULLSCREEN CONFETTI)
 * Nâng cấp đặc biệt cho khoảnh khắc dừng trúng học sinh may mắn:
 * 1. Pháo đại bác bắn chéo từ 2 góc dưới (Dual Mega Cannons - 110 hạt mỗi bên)
 * 2. Loạt 4 chùm pháo hoa nổ bung 360 độ trên bầu trời (Sky Fireworks Bursts)
 * 3. Mưa kim tuyến và ngôi sao lấp lánh rơi chầm chậm từ trần suốt 3.2 giây
 */
function triggerGrandWheelFireworks(extraEmoji = null, customPalette = null) {
  if (typeof confetti !== 'function') return;

  const shapes = getPastelConfettiShapes(extraEmoji);
  const palette = (Array.isArray(customPalette) && customPalette.length > 0) ? customPalette : VIBRANT_FIREWORKS_PALETTE;

  // Âm thanh: Đại bác phóng vút lên trời
  if (window.sound && typeof window.sound.playFireworkLaunch === 'function') {
    window.sound.playFireworkLaunch();
  }

  // ĐỢT 1: Đôi đại bác bắn chéo 2 góc dưới với công suất cực đại (60 độ và 120 độ)
  confetti({
    particleCount: 110,
    angle: 60,
    spread: 75,
    origin: { x: 0.04, y: 0.92 },
    colors: palette,
    shapes: shapes,
    scalar: 1.35,
    drift: 0.15,
    startVelocity: 68,
    ticks: 360,
    gravity: 0.88,
    zIndex: 9999
  });

  confetti({
    particleCount: 110,
    angle: 120,
    spread: 75,
    origin: { x: 0.96, y: 0.92 },
    colors: palette,
    shapes: shapes,
    scalar: 1.35,
    drift: -0.15,
    startVelocity: 68,
    ticks: 360,
    gravity: 0.88,
    zIndex: 9999
  });

  // Tiếng nổ đại bác đợt 1
  setTimeout(() => {
    if (window.sound && typeof window.sound.playFireworkBurst === 'function') {
      window.sound.playFireworkBurst('medium');
    }
  }, 70);

  // ĐỢT 2: Chuỗi pháo hoa nổ bung 360 độ trên không trung (Sky Fireworks)
  // Quả 1 bên trái (180ms)
  setTimeout(() => {
    if (window.sound && typeof window.sound.playFireworkBurst === 'function') {
      window.sound.playFireworkBurst('medium');
    }
    confetti({
      particleCount: 65,
      angle: 90,
      spread: 360,
      origin: { x: 0.28, y: 0.32 },
      colors: ['#ffd700', '#ff2d55', '#ff9500', '#ffffff'],
      shapes: shapes,
      startVelocity: 38,
      ticks: 240,
      gravity: 0.8,
      scalar: 1.25,
      zIndex: 9999
    });
  }, 180);

  // Quả 2 bên phải (380ms)
  setTimeout(() => {
    if (window.sound && typeof window.sound.playFireworkBurst === 'function') {
      window.sound.playFireworkBurst('medium');
    }
    confetti({
      particleCount: 65,
      angle: 90,
      spread: 360,
      origin: { x: 0.72, y: 0.28 },
      colors: ['#00e5ff', '#34c759', '#ffd700', '#ffffff'],
      shapes: shapes,
      startVelocity: 40,
      ticks: 240,
      gravity: 0.8,
      scalar: 1.25,
      zIndex: 9999
    });
  }, 380);

  // Quả 3 chính diện tâm trên nổ đại hoành tráng (600ms)
  setTimeout(() => {
    if (window.sound && typeof window.sound.playFireworkBurst === 'function') {
      window.sound.playFireworkBurst('grand');
    }
    confetti({
      particleCount: 95,
      angle: 90,
      spread: 360,
      origin: { x: 0.5, y: 0.22 },
      colors: ['#ffd700', '#ff3b30', '#ffea00', '#ffffff', '#ff2d55'],
      shapes: shapes,
      startVelocity: 46,
      ticks: 280,
      gravity: 0.82,
      scalar: 1.45,
      zIndex: 9999
    });
  }, 600);

  // Quả 4 nổ đôi đối xứng (850ms)
  setTimeout(() => {
    if (window.sound && typeof window.sound.playFireworkBurst === 'function') {
      window.sound.playFireworkBurst('double');
    }
    confetti({
      particleCount: 45,
      spread: 360,
      origin: { x: 0.38, y: 0.38 },
      colors: palette,
      shapes: shapes,
      startVelocity: 35,
      ticks: 200,
      zIndex: 9999
    });
    confetti({
      particleCount: 45,
      spread: 360,
      origin: { x: 0.62, y: 0.38 },
      colors: palette,
      shapes: shapes,
      startVelocity: 35,
      ticks: 200,
      zIndex: 9999
    });
  }, 850);

  // ĐỢT 3: Cơn mưa kim tuyến vàng & sao hoa rơi bồng bềnh khắp toàn màn hình suốt 3 giây
  setTimeout(() => {
    let showerCount = 0;
    const maxBursts = 25; // 25 đợt x 80ms = 2.0 giây mưa rải rác
    const rainTimer = setInterval(() => {
      showerCount++;
      if (showerCount >= maxBursts || typeof confetti !== 'function') {
        clearInterval(rainTimer);
        return;
      }
      confetti({
        particleCount: 8,
        angle: 90,
        spread: 140,
        origin: { x: 0.05 + Math.random() * 0.9, y: -0.04 },
        colors: palette,
        shapes: shapes,
        gravity: 0.52,                      // Rơi chậm, êm dịu bồng bềnh
        startVelocity: 6,
        scalar: 1.35 + Math.random() * 0.35, // Hạt to rõ
        drift: (Math.random() - 0.5) * 0.8, // Đung đưa nhẹ
        ticks: 360,
        zIndex: 9999
      });
    }, 80);
  }, 320);
}

// 1. Pháo hoa mừng chiến thắng chung (Gọi tên Slot, Vòng quay Wheel, Đấu trường Quiz)
function triggerCelebrationConfetti() {
  if (typeof confetti !== 'function') return;
  triggerGrandWheelFireworks();
}

// 2. Pháo hoa Confetti đa tầng theo dải màu & linh vật của Tổ trúng thưởng
function triggerGroupConfetti(groupNum) {
  if (typeof confetti !== 'function') return;

  const palette = GROUP_PASTEL_PALETTES[groupNum] || VIBRANT_FIREWORKS_PALETTE;

  // Lấy linh vật đại diện của Tổ nếu có trong SeatingState
  let mascot = null;
  if (window.SeatingState && window.SeatingState.groupProfiles && window.SeatingState.groupProfiles[groupNum]) {
    mascot = window.SeatingState.groupProfiles[groupNum].mascot;
  }

  triggerGrandWheelFireworks(mascot, palette);
}

window.triggerGrandWheelFireworks = triggerGrandWheelFireworks;
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
    } catch (_e) {}
    this.syncModalUI();
    return this.rate;
  }

  // Điều chỉnh cao độ giọng (Pitch: 0.5x - 1.8x)
  setPitch(value) {
    const num = Math.max(0.5, Math.min(2.0, parseFloat(value) || 1.0));
    this.pitch = Math.round(num * 100) / 100;
    try {
      localStorage.setItem('vong_quay_voice_announcer_pitch', String(this.pitch));
    } catch (_e) {}
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
      } catch (_e) {}
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
    } catch (_e) {}

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
  speakWinner({ name, groupNum, groupName, mascot }) {
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
