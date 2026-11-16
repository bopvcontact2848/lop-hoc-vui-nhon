'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

function openSseClient(url) {
  const events = [];
  const waiters = [];
  let buffer = '';
  let response = null;
  let closed = false;

  function flushWaiters() {
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      const matchIdx = events.findIndex(w.predicate);
      if (matchIdx >= 0) {
        const matched = events[matchIdx];
        clearTimeout(w.timer);
        waiters.splice(i, 1);
        w.resolve(matched);
      }
    }
  }

  const req = http.get(url, (res) => {
    response = res;
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      buffer += chunk;
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        const lines = frame.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            events.push(parsed);
            flushWaiters();
          } catch (_err) {
            // Bỏ qua heartbeat hoặc frame không phải JSON
          }
        }
      }
    });
  });

  req.on('error', () => {
    // Bỏ qua lỗi socket khi test chủ động đóng kết nối
  });

  return {
    events,
    waitForEvent(predicate, timeoutMs = 5000) {
      const existing = events.find(predicate);
      if (existing) return Promise.resolve(existing);

      return new Promise((resolve, reject) => {
        const entry = {
          predicate,
          resolve,
          timer: setTimeout(() => {
            const idx = waiters.indexOf(entry);
            if (idx >= 0) waiters.splice(idx, 1);
            reject(new Error(`Hết thời gian chờ SSE event sau ${timeoutMs}ms`));
          }, timeoutMs)
        };
        waiters.push(entry);
      });
    },
    close() {
      if (closed) return;
      closed = true;
      for (const w of waiters) {
        clearTimeout(w.timer);
      }
      waiters.length = 0;
      try { req.destroy(); } catch (_err) {}
      if (response) {
        try { response.destroy(); } catch (_err) {}
      }
    }
  };
}

async function startTestServer(tempDir) {
  const matThuPath = path.join(tempDir, 'matthu_scores.test.json');
  const gmmSetsPath = path.join(tempDir, 'gmm_question_sets.test.json');
  const gmmPuzzlesPath = path.join(tempDir, 'gmm_custom_puzzles.test.json');
  const child = spawn(process.execPath, [path.join(ROOT_DIR, 'server.js')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: '0',
      MAT_THU_FILE: matThuPath,
      GMM_SETS_FILE: gmmSetsPath,
      GMM_PUZZLES_FILE: gmmPuzzlesPath
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdoutBuf = '';
  let stderrBuf = '';

  const baseUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Server không khởi động trong 8s.\nSTDOUT:\n${stdoutBuf}\nSTDERR:\n${stderrBuf}`));
    }, 8000);

    child.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString('utf8');
      const match = stdoutBuf.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://localhost:${match[1]}`);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString('utf8');
    });

    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server thoát sớm với mã ${code}.\nSTDERR:\n${stderrBuf}`));
    });
  });

  return { child, baseUrl };
}

test('API & SSE Integration Suite', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lhvn-test-'));
  const { child, baseUrl } = await startTestServer(tempDir);

  t.after(async () => {
    if (!child.killed) {
      child.kill('SIGTERM');
      await new Promise((resolve) => {
        const forceTimer = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch (_err) {}
          resolve();
        }, 2500);
        child.once('exit', () => {
          clearTimeout(forceTimer);
          resolve();
        });
      });
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await t.test('Giải Mã Mật Thư: POST /api/matthu/submit -> SSE matthu_new_submission & reset', async () => {
    const sse = openSseClient(`${baseUrl}/api/sync/events`);
    try {
      const hello = await sse.waitForEvent((e) => e.type === 'connected');
      assert.equal(hello.type, 'connected');

      const submitRes = await fetch(`${baseUrl}/api/matthu/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: 'Chi đội Kiểm thử 9A1',
          className: '9A1',
          grade: 9,
          leader: 'Nguyễn Văn A',
          campus: 'Trường chính',
          score: 95,
          elapsed: 118,
          reason: 'Hoàn thành'
        })
      });
      assert.equal(submitRes.status, 200);
      const submitJson = await submitRes.json();
      assert.equal(submitJson.success, true);
      assert.equal(submitJson.record.className, '9A1');
      assert.equal(submitJson.record.score, 95);

      const sseSubmission = await sse.waitForEvent((e) => e.type === 'matthu_new_submission');
      assert.equal(sseSubmission.record.team, 'Chi đội Kiểm thử 9A1');
      assert.equal(sseSubmission.totalSubmissions, 1);

      const scoresRes = await fetch(`${baseUrl}/api/matthu/scores`);
      assert.equal(scoresRes.status, 200);
      const scoresJson = await scoresRes.json();
      assert.equal(scoresJson.success, true);
      assert.equal(scoresJson.total, 1);
      assert.equal(scoresJson.scores[0].score, 95);

      const resetRes = await fetch(`${baseUrl}/api/matthu/reset`, { method: 'POST' });
      assert.equal(resetRes.status, 200);
      const sseReset = await sse.waitForEvent((e) => e.type === 'matthu_scores_reset');
      assert.equal(sseReset.type, 'matthu_scores_reset');
    } finally {
      sse.close();
    }
  });

  await t.test('Giải Mã Bí Mật & Remote: /api/sync/action, decrypt-timer & Reconnect SSE đồng bộ remainingSeconds', async () => {
    const sse1 = openSseClient(`${baseUrl}/api/sync/events?role=student&team=teamA&cid=test_mob_a1`);
    let sse2 = null;

    try {
      const connected1 = await sse1.waitForEvent((e) => e.type === 'connected');
      assert.equal(typeof connected1.remainingSeconds, 'number');
      assert.equal(typeof connected1.decryptTimeLeft, 'number');

      const actionRes = await fetch(`${baseUrl}/api/sync/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'remote_test_action', action: 'spin' })
      });
      assert.equal(actionRes.status, 200);
      const actionEvent = await sse1.waitForEvent((e) => e.type === 'remote_test_action');
      assert.equal(actionEvent.action, 'spin');

      const startRes = await fetch(`${baseUrl}/api/gmm/decrypt-timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', seconds: 120, totalSeconds: 120 })
      });
      assert.equal(startRes.status, 200);
      const startJson = await startRes.json();
      assert.equal(startJson.success, true);
      assert.equal(startJson.isDecryptTimerRunning, true);
      assert.equal(startJson.remainingSeconds, 120);

      const startEvt = await sse1.waitForEvent((e) => e.type === 'gmm_decrypt_timer_start');
      assert.equal(startEvt.remainingSeconds, 120);
      assert.equal(startEvt.decryptTimeLeft, 120);
      assert.equal(startEvt.isDecryptTimerRunning, true);

      // Giả lập điện thoại rớt Wi-Fi, chờ >1.2 giây rồi mở kết nối SSE mới
      sse1.close();
      await new Promise((resolve) => setTimeout(resolve, 1250));

      sse2 = openSseClient(`${baseUrl}/api/sync/events?role=student&team=teamA&cid=test_mob_a2`);
      const reconnectedHello = await sse2.waitForEvent((e) => e.type === 'connected');
      assert.equal(reconnectedHello.isDecryptPhase, true);
      assert.equal(reconnectedHello.isDecryptTimerRunning, true);
      assert.ok(
        reconnectedHello.remainingSeconds <= 119 && reconnectedHello.remainingSeconds >= 115,
        `Kỳ vọng remainingSeconds sau khi nối lại nằm trong [115..119], thực tế nhận được ${reconnectedHello.remainingSeconds}`
      );
      assert.equal(reconnectedHello.decryptTimeLeft, reconnectedHello.remainingSeconds);

      const stateRes = await fetch(`${baseUrl}/api/gmm/state`);
      assert.equal(stateRes.status, 200);
      const stateJson = await stateRes.json();
      assert.equal(stateJson.success, true);
      assert.ok(stateJson.remainingSeconds <= 119);
      assert.equal(stateJson.state.decryptTimeLeft, stateJson.remainingSeconds);

      const stopRes = await fetch(`${baseUrl}/api/gmm/decrypt-timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      assert.equal(stopRes.status, 200);
      const resetGmmRes = await fetch(`${baseUrl}/api/gmm/reset`, { method: 'POST' });
      assert.equal(resetGmmRes.status, 200);
      const resetGmmJson = await resetGmmRes.json();
      assert.equal(resetGmmJson.state.isDecryptTimerRunning, false);
    } finally {
      sse1.close();
      if (sse2) sse2.close();
    }
  });

  await t.test('Tài nguyên tĩnh sau khi di chuyển sang assets/ phục vụ HTTP 200', async () => {
    const logoRes = await fetch(`${baseUrl}/assets/images/logo-truong-thcs-Tan-Hai.jpg`);
    assert.equal(logoRes.status, 200);
    assert.match(logoRes.headers.get('content-type') || '', /image\/jpeg/);
    const logoBuf = await logoRes.arrayBuffer();
    assert.ok(logoBuf.byteLength > 10000);

    const mp3Res = await fetch(`${baseUrl}/assets/audio/thuong-lam-thay-co-oi.mp3`);
    assert.equal(mp3Res.status, 200);
    assert.match(mp3Res.headers.get('content-type') || '', /audio\/mpeg/);
    const mp3Buf = await mp3Res.arrayBuffer();
    assert.ok(mp3Buf.byteLength > 100000);
  });

  await t.test('HTML Partials: GET / và GET /index.html ghép đầy đủ modal & không sót @include', async () => {
    for (const urlPath of ['/', '/index.html']) {
      const res = await fetch(`${baseUrl}${urlPath}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/html/);
      const html = await res.text();
      assert.ok(html.includes('id="matThuCoordinatorModal"'), `Thiếu #matThuCoordinatorModal khi tải ${urlPath}`);
      assert.ok(html.includes('id="giaiMaBiMatModal"'), `Thiếu #giaiMaBiMatModal khi tải ${urlPath}`);
      assert.equal(html.includes('<!-- @include'), false, `Vẫn còn thẻ <!-- @include chưa ghép trong ${urlPath}`);
    }
  });

  await t.test('Giải Mã Bí Mật Quiz Lifecycle: /api/gmm/state -> submit -> lock-team -> unlock-team', async () => {
    const sse = openSseClient(`${baseUrl}/api/sync/events?role=host&cid=test_host_quiz`);
    try {
      await sse.waitForEvent((e) => e.type === 'connected');

      const sessionId = `test_sess_${Date.now()}`;
      const stateInitRes = await fetch(`${baseUrl}/api/gmm/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'quiz',
          isMatchStarted: true,
          timerSeconds: 180,
          totalMatchSeconds: 180,
          questions: [{ id: 'q1', text: 'Câu 1', options: ['A', 'B', 'C', 'D'], correct: 1 }]
        })
      });
      assert.equal(stateInitRes.status, 200);
      const stateInitJson = await stateInitRes.json();
      assert.equal(stateInitJson.success, true);

      // 1. Nộp 1 đáp án hợp lệ -> 200 + SSE gmm_team_answered
      const submitRes = await fetch(`${baseUrl}/api/gmm/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          team: 'teamA',
          questionId: 'q1',
          optionIndex: 1,
          currentQ: 1
        })
      });
      assert.equal(submitRes.status, 200);
      const submitJson = await submitRes.json();
      assert.equal(submitJson.success, true);

      const answeredEvt = await sse.waitForEvent((e) => e.type === 'gmm_team_answered' && e.team === 'teamA');
      assert.equal(answeredEvt.questionId, 'q1');
      assert.equal(answeredEvt.optionIndex, 1);

      // 2. Chốt bài đội A -> 200 + SSE gmm_team_locked
      const lockRes = await fetch(`${baseUrl}/api/gmm/lock-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          team: 'teamA',
          answers: { q1: 1 },
          finishTime: '00:15',
          finishSeconds: 15
        })
      });
      assert.equal(lockRes.status, 200);
      const lockJson = await lockRes.json();
      assert.equal(lockJson.success, true);

      const lockedEvt = await sse.waitForEvent((e) => e.type === 'gmm_team_locked' && e.team === 'teamA');
      assert.equal(lockedEvt.finishTime, '00:15');
      assert.equal(lockedEvt.state.teamA.isLocked, true);

      // 3. Thử nộp tiếp khi đội A đã khóa -> 409 teamLocked
      const blockedSubmitRes = await fetch(`${baseUrl}/api/gmm/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          team: 'teamA',
          questionId: 'q1',
          optionIndex: 2,
          currentQ: 1
        })
      });
      assert.equal(blockedSubmitRes.status, 409);
      const blockedJson = await blockedSubmitRes.json();
      assert.equal(blockedJson.teamLocked, true);

      // 4. Mở khóa cho đội A -> 200 + giữ nguyên answers + SSE gmm_team_unlocked
      const unlockRes = await fetch(`${baseUrl}/api/gmm/unlock-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: 'teamA' })
      });
      assert.equal(unlockRes.status, 200);
      const unlockJson = await unlockRes.json();
      assert.equal(unlockJson.success, true);
      assert.equal(unlockJson.state.teamA.isLocked, false);
      assert.equal(unlockJson.answers.q1, 1);

      const unlockedEvt = await sse.waitForEvent((e) => e.type === 'gmm_team_unlocked' && e.team === 'teamA');
      assert.equal(unlockedEvt.state.teamA.isLocked, false);
      assert.equal(unlockedEvt.answers.q1, 1);

      const resetRes = await fetch(`${baseUrl}/api/gmm/reset`, { method: 'POST' });
      assert.equal(resetRes.status, 200);
    } finally {
      sse.close();
    }
  });

  await t.test('Giải Mã Bí Mật Tô Tranh & Ảnh Giấy: paint -> finish-artwork -> upload-artwork -> artworks', async () => {
    const sse = openSseClient(`${baseUrl}/api/sync/events?role=host&cid=test_host_artwork`);
    try {
      await sse.waitForEvent((e) => e.type === 'connected');

      const resetFirst = await fetch(`${baseUrl}/api/gmm/reset`, { method: 'POST' });
      assert.equal(resetFirst.status, 200);

      // 1. Tô màu 1 mảng trên điện thoại/máy chiếu -> 200 + SSE gmm_region_colored + lưu state
      const paintRes = await fetch(`${baseUrl}/api/gmm/paint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: 'teamA', regionId: 'code_1B', color: '#ef4444' })
      });
      assert.equal(paintRes.status, 200);
      const paintJson = await paintRes.json();
      assert.equal(paintJson.success, true);
      assert.equal(paintJson.regionId, 'code_1B');

      const paintEvt = await sse.waitForEvent((e) => e.type === 'gmm_region_colored' && e.team === 'teamA');
      assert.equal(paintEvt.regionId, 'code_1B');
      assert.equal(paintEvt.color, '#ef4444');

      // 2. Đội A báo hoàn thành tô tranh sớm -> 200 + cộng điểm thưởng + SSE gmm_artwork_finished
      const finishRes = await fetch(`${baseUrl}/api/gmm/finish-artwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: 'teamA',
          finishTime: '02:15',
          finishSeconds: 135,
          remainingSeconds: 165,
          speedBonus: 2
        })
      });
      assert.equal(finishRes.status, 200);
      const finishJson = await finishRes.json();
      assert.equal(finishJson.success, true);
      assert.equal(finishJson.speedBonus, 2);
      assert.equal(finishJson.bonusScore, 2);
      assert.equal(finishJson.state.teamA.isArtworkFinished, true);

      const finishEvt = await sse.waitForEvent((e) => e.type === 'gmm_artwork_finished' && e.team === 'teamA');
      assert.equal(finishEvt.finishTime, '02:15');
      assert.equal(finishEvt.bonusScore, 2);

      // Kiểm tra 400 khi gửi sai tên đội tới finish-artwork
      const badFinishRes = await fetch(`${baseUrl}/api/gmm/finish-artwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: 'teamInvalid' })
      });
      assert.equal(badFinishRes.status, 400);

      // 3. Upload ảnh tác phẩm tranh giấy (hỗ trợ team: 'A' -> 'teamA') -> 200 + SSE gmm_artwork_photo
      const fakePhotoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAA==';
      const uploadRes = await fetch(`${baseUrl}/api/gmm/upload-artwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: 'A', photoData: fakePhotoData })
      });
      assert.equal(uploadRes.status, 200);
      const uploadJson = await uploadRes.json();
      assert.equal(uploadJson.success, true);
      assert.equal(uploadJson.team, 'teamA');
      assert.ok(typeof uploadJson.timestamp === 'number' && uploadJson.timestamp > 0);

      const photoEvt = await sse.waitForEvent((e) => e.type === 'gmm_artwork_photo' && e.team === 'teamA');
      assert.equal(photoEvt.photoData, fakePhotoData);

      // Kiểm tra 400 khi thiếu photoData
      const badUploadRes = await fetch(`${baseUrl}/api/gmm/upload-artwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: 'teamA', photoData: '' })
      });
      assert.equal(badUploadRes.status, 400);

      // 4. Kênh polling dự phòng GET /api/gmm/artworks?tsA=0&tsB=0 trả đúng ảnh mới nhất
      const artworksRes = await fetch(`${baseUrl}/api/gmm/artworks?tsA=0&tsB=0`);
      assert.equal(artworksRes.status, 200);
      const artworksJson = await artworksRes.json();
      assert.equal(artworksJson.success, true);
      assert.equal(artworksJson.hasUpdate, true);
      assert.equal(artworksJson.teamA.photoData, fakePhotoData);

      const noNewRes = await fetch(`${baseUrl}/api/gmm/artworks?tsA=${uploadJson.timestamp}&tsB=${uploadJson.timestamp}`);
      const noNewJson = await noNewRes.json();
      assert.equal(noNewJson.hasUpdate, false);

      // Xác nhận state hiện tại ghi nhận coloredRegions & hasArtworkPhoto
      const stateRes = await fetch(`${baseUrl}/api/gmm/state`);
      const stateJson = await stateRes.json();
      assert.equal(stateJson.state.teamA.coloredRegions.code_1B, '#ef4444');
      assert.equal(stateJson.state.teamA.hasArtworkPhoto, true);

      const finalReset = await fetch(`${baseUrl}/api/gmm/reset`, { method: 'POST' });
      assert.equal(finalReset.status, 200);
    } finally {
      sse.close();
    }
  });

  await t.test('Đồng bộ Kho Bộ Đề lên Server JSON (/api/gmm/question-sets*): sync, merge, history, delete & SSE', async () => {
    const sse = openSseClient(`${baseUrl}/api/sync/events?role=host`);
    try {
      await sse.waitForEvent((e) => e.type === 'connected');

      const initRes = await fetch(`${baseUrl}/api/gmm/question-sets`);
      assert.equal(initRes.status, 200);
      const initJson = await initRes.json();
      assert.equal(initJson.success, true);
      assert.equal(initJson.serverSyncAvailable, true);
      assert.deepEqual(initJson.sets, []);

      // Chrome đẩy 1 bộ đề tự tạo lên server JSON
      const setA = {
        id: 'custom_sync_test_1',
        title: 'Đề Toán 9 Đồng Bộ',
        topic: 'Toán 9',
        updatedAt: Date.now(),
        questions: [
          { question: 'Tính $2^3$', options: ['6', '8', '9', '12'], correct: 1, time: 30 }
        ]
      };
      const syncRes = await fetch(`${baseUrl}/api/gmm/question-sets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          clientOriginId: 'chrome_tab_1',
          sets: [setA]
        })
      });
      assert.equal(syncRes.status, 200);
      const syncJson = await syncRes.json();
      assert.equal(syncJson.success, true);
      assert.equal(syncJson.totalSets, 1);
      assert.equal(syncJson.sets[0].id, setA.id);

      const sseEvt = await sse.waitForEvent((e) => e.type === 'gmm_question_sets_updated' && e.clientOriginId === 'chrome_tab_1');
      assert.equal(sseEvt.totalSets, 1);

      // Edge đọc lại và hợp nhất thêm bộ đề thứ 2
      const setB = {
        id: 'custom_sync_test_2',
        title: 'Đề Ngữ Văn 8',
        topic: 'Ngữ Văn',
        updatedAt: Date.now() + 100,
        questions: [
          { question: 'Tác giả Lão Hạc?', options: ['Nam Cao', 'Ngô Tất Tố', 'Vũ Trọng Phụng', 'Tô Hoài'], correct: 0, time: 25 }
        ]
      };
      const mergeRes = await fetch(`${baseUrl}/api/gmm/question-sets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'merge', clientOriginId: 'edge_tab_1', sets: [setB] })
      });
      assert.equal(mergeRes.status, 200);
      const mergeJson = await mergeRes.json();
      assert.equal(mergeJson.totalSets, 2);

      // Cập nhật và reset lịch sử bốc ngẫu nhiên trên server
      const histRes = await fetch(`${baseUrl}/api/gmm/question-sets/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: setA.id, seenIndices: [0], clientOriginId: 'chrome_tab_1' })
      });
      assert.equal(histRes.status, 200);
      const histJson = await histRes.json();
      assert.deepEqual(histJson.poolHistory[setA.id], [0]);

      const histResetRes = await fetch(`${baseUrl}/api/gmm/question-sets/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: setA.id, action: 'reset', clientOriginId: 'edge_tab_1' })
      });
      assert.equal(histResetRes.status, 200);
      const histResetJson = await histResetRes.json();
      assert.equal(histResetJson.poolHistory[setA.id], undefined);

      // Xóa setA -> xác nhận tombstone ngăn merge cũ làm sống lại setA
      const delRes = await fetch(`${baseUrl}/api/gmm/question-sets/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: setA.id, clientOriginId: 'edge_tab_1' })
      });
      assert.equal(delRes.status, 200);
      const delJson = await delRes.json();
      assert.equal(delJson.totalSets, 1);

      const staleRes = await fetch(`${baseUrl}/api/gmm/question-sets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'merge', sets: [setA] })
      });
      const staleJson = await staleRes.json();
      assert.equal(staleJson.totalSets, 1);
      assert.equal(staleJson.sets[0].id, setB.id);

      // Kiểm tra 400 khi gửi dữ liệu sai định dạng
      const badRes = await fetch(`${baseUrl}/api/gmm/question-sets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sets: 'invalid' })
      });
      assert.equal(badRes.status, 400);
    } finally {
      sse.close();
    }
  });

  await t.test('Đồng bộ Bộ Sưu Tập Tranh Tự Tạo lên Server JSON (/api/gmm/custom-puzzles*): sync, merge, delete & SSE', async () => {
    const sse = openSseClient(`${baseUrl}/api/sync/events?role=host`);
    try {
      await sse.waitForEvent((e) => e.type === 'connected');

      const initRes = await fetch(`${baseUrl}/api/gmm/custom-puzzles`);
      assert.equal(initRes.status, 200);
      const initJson = await initRes.json();
      assert.equal(initJson.success, true);
      assert.equal(initJson.serverSyncAvailable, true);
      assert.deepEqual(initJson.puzzles, []);

      const puzzleA = {
        id: 'custom_puzzle_1',
        title: 'BẢO VỆ MÔI TRƯỜNG XANH',
        questionCount: 10,
        meshStyle: 'polygon',
        difficulty: 'normal',
        strokeWidth: 1.8,
        updatedAt: Date.now(),
        matrixData: { id: 'custom_puzzle_1', title: 'BẢO VỆ MÔI TRƯỜNG XANH', cells: [{ id: 1, isTarget: true }] }
      };
      const syncRes = await fetch(`${baseUrl}/api/gmm/custom-puzzles/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'merge', clientOriginId: 'chrome_p1', puzzles: [puzzleA] })
      });
      assert.equal(syncRes.status, 200);
      const syncJson = await syncRes.json();
      assert.equal(syncJson.totalPuzzles, 1);
      assert.equal(syncJson.puzzles[0].id, puzzleA.id);

      const sseEvt = await sse.waitForEvent((e) => e.type === 'gmm_custom_puzzles_updated' && e.clientOriginId === 'chrome_p1');
      assert.equal(sseEvt.totalPuzzles, 1);

      const delRes = await fetch(`${baseUrl}/api/gmm/custom-puzzles/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: puzzleA.id, clientOriginId: 'edge_p1' })
      });
      assert.equal(delRes.status, 200);
      const delJson = await delRes.json();
      assert.equal(delJson.totalPuzzles, 0);

      const badRes = await fetch(`${baseUrl}/api/gmm/custom-puzzles/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzles: 'invalid' })
      });
      assert.equal(badRes.status, 400);
    } finally {
      sse.close();
    }
  });

  await t.test('Bảo mật HTTP Static & 404: chặn .git/, .agent/, server/data/, trả 404 cho tệp thiếu & 200 cho KaTeX', async () => {
    for (const blockedPath of ['/.git/config', '/.agent/ARCHITECTURE.md', '/server/data/gmm_question_sets.json', '/matthu_scores.json']) {
      const res = await fetch(`${baseUrl}${blockedPath}`);
      assert.equal(res.status, 403, `Kỳ vọng 403 khi truy cập ${blockedPath}, thực tế nhận ${res.status}`);
    }

    for (const missingPath of ['/scripts/khong-ton-tai.js', '/assets/vendor/katex/fonts/missing.woff']) {
      const res = await fetch(`${baseUrl}${missingPath}`);
      assert.equal(res.status, 404, `Kỳ vọng 404 khi tệp không tồn tại: ${missingPath}`);
    }

    const katexJsRes = await fetch(`${baseUrl}/assets/vendor/katex/katex.min.js`);
    assert.equal(katexJsRes.status, 200);
    assert.match(katexJsRes.headers.get('content-type') || '', /javascript/);

    const katexFontRes = await fetch(`${baseUrl}/assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2`);
    assert.equal(katexFontRes.status, 200);
    assert.match(katexFontRes.headers.get('content-type') || '', /font\/woff2/);

    const xlsxRes = await fetch(`${baseUrl}/assets/vendor/sheetjs/xlsx.full.min.js`);
    assert.equal(xlsxRes.status, 200);
    assert.match(xlsxRes.headers.get('content-type') || '', /javascript/);
  });
});
