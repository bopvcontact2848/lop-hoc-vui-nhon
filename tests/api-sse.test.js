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
  const child = spawn(process.execPath, [path.join(ROOT_DIR, 'server.js')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: '0',
      MAT_THU_FILE: matThuPath
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
});
