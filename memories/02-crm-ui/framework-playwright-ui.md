---
name: framework-playwright-ui
description: Quyết định thiết kế framework UI CRM (src/, playwright.config.ts) và lý do — viewport, tag, Allure detail, typecheck, env, test data
metadata:
  type: project
---

# Framework Playwright UI (`src/`) — quyết định & lý do

> Stack sếp đã duyệt (11-09-2026): Playwright TS + POM + Allure 2 (devDependency `allure-commandline`, cần Java; đổi từ Allure 3 theo yêu cầu sếp 13-10-2026 — không còn `allurerc*.mjs`, report gộp 1 file dùng `--single-file`) + `allure-js-commons` + `allure-playwright`, parallel 5 luồng qua `WORKERS`. Cách dùng có trong README — file này chỉ ghi **lý do** và **bẫy**.

| Quyết định | Vì sao (bẫy đã gặp) | How to apply |
|---|---|---|
| `viewport: 1920×1080` khai **SAU** `...devices['Desktop Chrome']` trong `projects[].use` | Preset Desktop Chrome có sẵn 1280×720; khai ở `use` cấp config bị ghi đè **không báo gì** — review đã đo thật ra 1280×720 | Không chuyển viewport lên `use` cấp config |
| Tag khai bằng `test('…', { tag: ['@smoke'] })`, **không** qua `allureMeta` | Tag kiểu Allure làm `--grep @smoke` chạy **0 test mà vẫn exit 0** → CI xanh giả | `allure-playwright` tự map tag sang report |
| `allure-playwright` `detail: false`, `screenshot: 'off'` | Step nội bộ Fill/Click in giá trị đã nhập → lộ mật khẩu. Ảnh đã được fixture attach cho cả PASS/FAIL, bật `screenshot` thì đính 2 lần | Ảnh cuối: `trang_thai_cuoi_cua_test` (PASS) / `trang_thai_khi_that_bai` (FAIL) |
| Luôn chạy `npm run typecheck` (`tsc --noEmit`) | Playwright transpile bằng esbuild, **không** kiểm kiểu → `strict`/`noUnusedLocals` vô tác dụng. Thiếu `--noEmit` thì `tsc` rải `.js` cạnh source | Chạy trước khi báo xong |
| `env.config.ts` dùng `required()` và `positiveInt()` (TIMEOUT mặc định 90000, WORKERS 5) | `WORKERS=` rỗng → `Number('')` = 0, gõ nhầm → NaN, cả hai lọt xuống không báo | Thêm biến mới thì đi qua 2 hàm này |
| Email ca "sai mật khẩu" lấy từ `env.username`, `login-invalid.json` để `email: null` | Đổi tài khoản test thì ca "sai mật khẩu" âm thầm thành "email không tồn tại" mà vẫn PASS → mất phủ; thêm nữa là 2 nguồn sự thật | Không chép email/tài khoản vào file commit được |
| Logger winston ghi file riêng mỗi worker `reports/logs/test-execution-worker-<TEST_PARALLEL_INDEX>.log` | 5 process ghi chung 1 file → dòng log xen kẽ / bị cắt | Đã có trong code (kiểm 05-10-2026) |
| `retries: process.env.CI ? 2 : 0` | Local thấy flaky ngay, CI chịu nhiễu mạng | Suite API thì **0 cả trên CI** (xem [[thiet-ke-suite-api]]) |
- Nguồn: 59955a6a (11-09-2026).

## ⚠️ Bẫy còn tồn tại trong code (chưa sửa)
1. **`PM_EMAIL` / `PM_PASSWORD` là biến `required()` lúc nạp module** (`src/utils/env.config.ts:31-32`) → máy hoặc CI thiếu 2 biến này thì **toàn suite crash**, kể cả smoke. Agent đã đề xuất chỉ skip TC_006 khi thiếu — **sếp chưa chốt**. Nguồn: 6fc61c22 (28-09).
2. ~~Tên step lộ email~~ — **đã sửa 05-10-2026**: step tĩnh `Nhập email`.
3. **Biến chỉ một vài TC cần** đi qua `optional()` trong `env.config.ts` (thêm 05-10-2026) — thiếu thì TC đó `test.skip`, không crash suite. Mẫu: `tc014Email`. Gọi `allureMeta` **trước** `test.skip` để lượt skip vẫn có testId.
- Kiểm trên code ngày 05-10-2026.

Liên quan: [[he-thong-perfex-crm]] · [[test-login-dashboard]] · [[ci-github-actions]] · [[moi-truong-may-va-cong-cu]]
