// Đếm kết quả từ thư mục allure-results, in ra dạng `passed=N` để ghi vào $GITHUB_OUTPUT.
// Test được retry sinh nhiều file kết quả cùng historyId -> chỉ tính lần chạy cuối.
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const latest = new Map();

if (dir && fs.existsSync(dir)) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('-result.json')) {
      continue;
    }
    const result = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const key = result.historyId || file;
    const previous = latest.get(key);
    if (!previous || (result.stop || 0) >= (previous.stop || 0)) {
      latest.set(key, result);
    }
  }
}

const counts = { passed: 0, failed: 0, broken: 0, skipped: 0 };
for (const result of latest.values()) {
  if (result.status in counts) {
    counts[result.status] += 1;
  }
}
for (const [status, count] of Object.entries(counts)) {
  console.log(`${status}=${count}`);
}
