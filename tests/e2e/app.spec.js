'use strict';

const { test, expect } = require('@playwright/test');

function attachErrorCollectors(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      httpErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  return {
    assertClean() {
      expect(consoleErrors, `Phát hiện lỗi console.error: ${consoleErrors.join(' | ')}`).toEqual([]);
      expect(pageErrors, `Phát hiện lỗi pageerror: ${pageErrors.join(' | ')}`).toEqual([]);
      expect(httpErrors, `Phát hiện phản hồi HTTP >= 400: ${httpErrors.join(' | ')}`).toEqual([]);
    }
  };
}

test.describe('Kiểm thử E2E Giao Diện Lớp Học Vui Nhộn', () => {
  test('Trang chủ, thư viện Offline (SheetJS, KaTeX, QRCode, Confetti) & các trò chơi chính', async ({ page }) => {
    const collector = attachErrorCollectors(page);

    await page.goto('/');
    await expect(page.locator('#homeLandingView')).toBeVisible();

    // Xác minh logo hiển thị và toàn bộ thư viện offline đã nạp sẵn không cần Internet
    const offlineCheck = await page.evaluate(() => ({
      hasXlsx: typeof globalThis.XLSX !== 'undefined',
      hasKatex: typeof globalThis.katex !== 'undefined',
      hasQr: typeof globalThis.QRCode !== 'undefined',
      hasConfetti: typeof globalThis.confetti !== 'undefined'
    }));
    expect(offlineCheck).toEqual({
      hasXlsx: true,
      hasKatex: true,
      hasQr: true,
      hasConfetti: true
    });

    // 1. Vòng quay may mắn
    await page.locator('.btn-spin-try').click();
    await expect(page.locator('#luckyWheelCanvas')).toBeVisible();

    // 2. Sơ đồ lớp học
    await page.evaluate(() => globalThis.selectGame('seating'));
    await expect(page.locator('#seatingArenaSection')).toBeVisible();

    // 3. 6 Hộp Quà Bí Ẩn
    await page.evaluate(() => globalThis.MysteryBoxesModule.openPopupModal());
    await expect(page.locator('#mysteryBoxesPopupModal')).toHaveClass(/open/);
    await expect(page.locator('#mysteryBoxesGrid .mystery-gift-box')).toHaveCount(6);
    await page.locator('#mysteryBoxesGrid .mystery-gift-box').first().click();
    await page.locator('.btn-mystery-done-close').click();
    await expect(page.locator('#mysteryBoxesPopupModal')).not.toHaveClass(/open/);

    // 4. Giải Mã Mật Thư 20/11
    await page.evaluate(() => globalThis.MatThuCoordinator.openCoordinatorModal());
    await expect(page.locator('#matThuCoordinatorModal')).toBeVisible();
    await page.locator('.btn-matthu-close-custom').click();
    await expect(page.locator('#matThuCoordinatorModal')).not.toHaveClass(/open|active/);

    collector.assertClean();
  });

  test('Giải Mã Bí Mật: Tạo ma trận tranh, Ngân hàng bộ đề KaTeX, Tô màu & Đổi tên đội', async ({ page }) => {
    const collector = attachErrorCollectors(page);

    await page.goto('/');
    await page.evaluate(() => globalThis.GiaiMaBiMat.openCoordinatorModal());
    await expect(page.locator('#giaiMaBiMatModal')).toBeVisible();

    // Mở Tab 6 Cài đặt & Công cụ Tạo Tranh
    await page.locator('.gmm-tab-btn[data-tab="settings"]').click();
    await expect(page.locator('#gmmPanel_settings')).toBeVisible();

    await page.evaluate(() => globalThis.GiaiMaPuzzleGenerator.openGeneratorModal());
    await expect(page.locator('#gmmGeneratorModal')).toBeVisible();
    await expect(page.locator('#gmmGenPreviewWrap svg')).toBeVisible();

    await page.locator('#gmmGenMeshStyle').selectOption('pixel');
    await expect(page.locator('#gmmGenPreviewWrap svg')).toBeVisible();
    await page.locator('#gmmGeneratorModal button:has-text("✕ Đóng")').click();
    await expect(page.locator('#gmmGeneratorModal')).toBeHidden();

    // Mở Ngân hàng bộ đề & kiểm tra KaTeX biên dịch công thức toán học
    await page.evaluate(() => globalThis.GiaiMaBiMat.openQuestionEditor());
    await expect(page.locator('#gmmQuestionEditModal')).toBeVisible();
    await page.locator('#gmmBtnToggleTopicSets').click();
    await expect(page.locator('#gmmQuestionSetsPanel')).toBeVisible();
    await expect(page.locator('#gmmQuestionSetsList .gmm-qset-card').first()).toBeVisible();
    const katexCount = await page.locator('#gmmQuestionSetsList .katex').count();
    expect(katexCount).toBeGreaterThan(0);
    await page.evaluate(() => globalThis.GiaiMaBiMat.closeQuestionEditor());
    await expect(page.locator('#gmmQuestionEditModal')).toBeHidden();

    // Chuyển Tab 3 Tô màu & kiểm tra Modal Đổi tên đội
    await page.locator('.gmm-tab-btn[data-tab="decrypt"]').click();
    await expect(page.locator('#gmmPanel_decrypt')).toBeVisible();
    await page.locator('#gmmBtnEditTeamNames').click();
    await expect(page.locator('#gmmTeamNameModal')).toBeVisible();
    await page.locator('#gmmTeamNameModal button:has-text("Đóng")').click();
    await expect(page.locator('#gmmTeamNameModal')).toBeHidden();

    collector.assertClean();
  });

  test('Trang Điều Khiển Từ Xa (/remote.html): kết nối SSE & chuyển 4 tab điều khiển', async ({ page }) => {
    const collector = attachErrorCollectors(page);

    await page.goto('/remote.html');
    await expect(page.locator('#connectionStatus')).toBeVisible();
    await expect(page.locator('#connectionText')).toContainText(/Đã kết nối|Đang/);

    await page.locator('#tabBtnQuizTimer').click();
    await expect(page.locator('#remoteQuizTimerContainer')).toBeVisible();

    await page.locator('#tabBtnList').click();
    await expect(page.locator('#remoteListContainer')).toBeVisible();

    await page.locator('#tabBtnActions').click();
    await expect(page.locator('#remoteActionsContainer')).toBeVisible();

    await page.locator('#tabBtnSeating').click();
    await expect(page.locator('#remoteSeatingContainer')).toBeVisible();

    collector.assertClean();
  });
});
