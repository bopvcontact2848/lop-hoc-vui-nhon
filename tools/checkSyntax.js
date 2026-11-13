const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Đang kiểm tra cú pháp toàn bộ file JavaScript...');

const filesToCheck = ['server.js'];
const rootDir = path.join(__dirname, '..');
const dirsToScan = ['server', 'scripts', 'tests', 'tools'];

function collectJsFiles(dirRel) {
  const fullDir = path.join(rootDir, dirRel);
  if (!fs.existsSync(fullDir)) return;
  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const entryRel = path.join(dirRel, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(entryRel);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      filesToCheck.push(entryRel);
    }
  }
}

dirsToScan.forEach(collectJsFiles);

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
