---
name: moi-truong-may-va-cong-cu
description: Máy Windows của sếp — Node, không Python, PowerShell 5.1, rtk, log MCP, tiến trình rác và các bẫy công cụ
metadata:
  type: reference
---

# Môi trường máy & công cụ (Windows 11)

## Phần mềm có / không có
| Thứ | Tình trạng | Ghi chú |
|---|---|---|
| Node | v24.16.0 · npm 11.13.0 | registry npmjs.org, không proxy (24-09) |
| Python | ❌ **không có** — `python`/`python3` chỉ ra stub Microsoft Store | Xử lý JSON / script thì dùng `node -e` |
| Java | JDK 11.0.29 trong PATH (`C:\Program Files\Microsoft\jdk-11.0.29.7-hotspot`) | Repo này **cần Java** để sinh report (Allure 2 — `allure-commandline`) |
| Maven, Allure hệ thống | ❌ không có | Đúng chủ trương: tool đi theo repo (devDependency) |
| Android SDK | `C:\Users\huongttt\AppData\Local\Android\Sdk`, chưa đặt `ANDROID_HOME` | Chỉ liên quan repo Appium, không phải repo này |
- Nguồn: 92579dfe (09-09), 5ddba469 · b5585ed3 (24-09).

## Shell
- **Terminal VS Code của sếp là Windows PowerShell 5.1**: không có `&&` (dùng `;`), `$env:X=…` không chạy trong cmd.
- PowerShell có thể chặn `npx.ps1` (execution policy). Cách né không đổi policy: dùng `npx.cmd` / `npm.cmd`. Đổi policy (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`) là việc **sếp tự làm** — thiết lập bảo mật.
- Console vỡ chữ tiếng Việt → `chcp 65001`.
- Click vào cửa sổ cmd đang chạy tiến trình bật **QuickEdit** (tiêu đề "Select") làm tiến trình đứng → nhấn Esc/Enter.
- `setx` chỉ có hiệu lực ở cửa sổ mở sau; **không** dùng `setx` sửa `Path` (cắt còn 1024 ký tự).
- Git Bash tự đổi đường dẫn POSIX (`/sdcard` …) → đặt `MSYS_NO_PATHCONV=1`.
- Shell của agent không giữ state giữa các lần gọi → gộp các bước cần state vào một lệnh.
- Nguồn: 591c7695 (26-08), 524a5d71 (14-09), 9d6bea79 (25/28-09), fd283ca9 (15-09).

## `rtk` (Rust Token Killer) — bẫy quan trọng
- `rtk` bọc lệnh của agent:
  - `grep` bị cắt output, cờ có thể hỏng → gọi **`/usr/bin/grep`** khi cần đầy đủ.
  - `npx playwright test` bị **đổi reporter** → Allure / HTML **không sinh**.
  - `allure generate` / `allure open` bị chặn khi agent chạy.
- **How to apply:** chạy test bằng `npm test -- <files>` (hoặc `npm run test:api`). Report thì nhờ sếp tự chạy `npm run report` / `npm run report:api`. Kiểm thời điểm ghi của `reports/allure-report/widgets/summary.json` trước khi tin report đã sinh lại.
- Liên quan: chạy `--reporter=line` cũng **ghi đè** reporter của config → không có `allure-results`.
- Nguồn: 0b11ea16 (01-10), 6fc61c22 (28-09).

## Report cộng dồn
- `reports/allure-results` **cộng dồn** qua các lần chạy. Sếp từng thấy "total 5" vì xem report cũ từ 11-09.
- **How to apply:** `npm run clean` → chạy test → `npm run report`.
- 13-10: sếp báo `npm run report` mở lại report cũ — `reports/allure-report/index.html` vẫn là bản 28-09 vì `allure generate` ghi đè lên thư mục cũ. Đã sửa script `report` / `report:single` / `report:api` xoá thư mục report cũ trước khi sinh; đã ghi vào README mục 4.
- Nguồn: 6fc61c22 (28-09), phiên 13-10.

## Tiến trình rác
- Có lúc tồn 47–48 `chrome.exe` / `chromedriver.exe` làm test timeout. Kill `chromedriver.exe` an toàn; **không** kill `chrome.exe` (có thể là trình duyệt sếp đang dùng) — nhắc sếp tự đóng.
- Tiến trình `allure serve` / server nền cũ giữ cổng (`EADDRINUSE`) hoặc khoá file, làm `npm run clean` không xoá được `reports/` → xin phép rồi mới kill.
- **How to apply:** tắt mọi tiến trình nền mình đã bật trước khi bàn giao, và báo sếp.
- Nguồn: 92579dfe (09-09), fd283ca9 (15-09), 9d6bea79 (25-09), 707a6dce (01-10).

## Playwright MCP & trình duyệt
- Playwright MCP phải khai trong **`.mcp.json` của repo** (đã có). Repo cha từng thiếu file này → phiên không có Playwright MCP, phải dùng trình duyệt trong app (`Claude_Browser`, viewport ~800×455, **không lưu được PNG ra file**).
- Cần evidence PNG lưu đĩa → dùng Playwright MCP, không dùng `Claude_Browser`.
- Log MCP thật của Claude Desktop: `C:\Users\huongttt\AppData\Local\Claude\logs\mcp-server-<name>.log` (`%APPDATA%\Claude\logs\mcp.log` rỗng và cũ).
- 24-09: server `playwright` global trong `claude_desktop_config.json` báo ENOENT vì `--config` trỏ vào đường dẫn package Claude **sai tên thư mục**. Phiên bị ngắt trước khi kết luận trọn — đây là lý do repo dùng `.mcp.json` riêng với đường dẫn tương đối.
- Nguồn: 3fd85337 · 5ddba469 (24-09).

Liên quan: [[ly-do-thiet-ke]] · [[framework-playwright-ui]]
