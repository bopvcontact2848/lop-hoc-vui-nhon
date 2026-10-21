const { execSync } = require('child_process');
const path = require('path');

console.log('===============================================================');
console.log('  🛡️  [Git Pre-commit Hook] Đang kiểm tra mã nguồn tự động...');
console.log('===============================================================\n');

// 1. Kiểm tra cú pháp
try {
  require('./checkSyntax');
} catch (e) {
  console.error('\n❌ [CHẶN COMMIT] Kiểm tra cú pháp thất bại!');
  process.exit(1);
}

// 2. Kiểm tra chất lượng code với ESLint
console.log('🔍 Đang kiểm tra quy chuẩn chất lượng code bằng ESLint...');
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

try {
  execSync(`${npxCmd} eslint server.js scripts/`, { stdio: 'inherit' });
  console.log('\n✅ [ESLint OK] Không có lỗi nghiêm trọng nào được phát hiện!');
} catch (e) {
  console.error('\n❌ [CHẶN COMMIT] Mã nguồn chưa đạt chuẩn ESLint! Vui lòng khắc phục các lỗi đỏ ở trên trước khi commit.');
  process.exit(1);
}

console.log('\n===============================================================');
console.log('  🎉 [THÀNH CÔNG] Toàn bộ mã nguồn đạt chuẩn, cho phép commit!');
console.log('===============================================================\n');
process.exit(0);
