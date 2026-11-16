'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { defineConfig } = require('@playwright/test');

const E2E_PORT = 3456;
const E2E_DATA_DIR = path.join(os.tmpdir(), `lhvn-playwright-${process.pid}`);
fs.mkdirSync(E2E_DATA_DIR, { recursive: true });

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node server.js',
    url: `http://127.0.0.1:${E2E_PORT}/index.html`,
    reuseExistingServer: false,
    timeout: 15000,
    env: {
      ...process.env,
      PORT: String(E2E_PORT),
      MAT_THU_FILE: path.join(E2E_DATA_DIR, 'matthu_scores.e2e.json'),
      GMM_SETS_FILE: path.join(E2E_DATA_DIR, 'gmm_question_sets.e2e.json'),
      GMM_PUZZLES_FILE: path.join(E2E_DATA_DIR, 'gmm_custom_puzzles.e2e.json')
    }
  }
});
