const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Đang kiểm tra cú pháp toàn bộ file JavaScript...');

const filesToCheck = ['server.js'];
const scriptsDir = path.join(__dirname, '..', 'scripts');

if (fs.existsSync(scriptsDir)) {
  const scriptFiles = fs.readdirSync(scriptsDir)
    .filter(file => file.endsWith('.js') && file !== path.basename(__filename))
    .map(file => path.join('scripts', file));
  filesToCheck.push(...scriptFiles);
}

let hasError = false;

for (const file of filesToCheck) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
    console.log(`  ✅ [OK] ${file}`);
  } catch (err) {
    hasError = true;
    console.error(`  ❌ [LỖI CÚ PHÁP] ${file}`);
    if (err.stderr) {
      console.error(err.stderr.toString());
    }
  }
}

if (hasError) {
  console.error('\n❌ Phát hiện lỗi cú pháp! Vui lòng sửa trước khi commit/push.');
  process.exit(1);
} else {
  console.log('\n🎉 Toàn bộ file JavaScript đều chuẩn cú pháp!\n');
}
