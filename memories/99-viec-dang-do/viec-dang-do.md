---
name: viec-dang-do
description: Danh sách việc còn treo của CRM UI, Book API, Book Web/Mobile và framework — xong việc nào xoá dòng đó
metadata:
  type: project
---

# Việc còn dang dở (cập nhật 05-10-2026)

> Xong việc nào → **xoá dòng** đó và ghi kết quả vào file chủ đề tương ứng.

## Sau khi tách repo / framework
- [ ] Lịch CI: **sáng 16-10 kiểm lượt `workflow_dispatch` ~08:00** do cron-job.org (sếp phải đổi job từ 11:00 về 08:00 + Title) · **gửi ticket GitHub Support** vì `schedule:` không chạy (chưa soạn) · **tạo token mới trước 13-01-2027** → [[ci-github-actions]]
- [ ] Rà `~/.claude/settings.json`: 4 rule `git` đã chuyển `deny` → `ask` (14-10) nhưng lệnh `git add/commit/push` vẫn chạy không hỏi → kiểm tra file đã lưu / phiên đã nạp lại chưa · *chờ sếp*
- [ ] Sếp cân nhắc **xoay PAT/webhook** trong `~/.claude/settings.json` (lỡ in ra transcript 14-10) — memory không ghi giá trị
- [ ] Đồng bộ viewport: `.mcp.json` `1600,780` ↔ `CLAUDE.md` / `playwright_rules.md` `1600×770` → [[ly-do-thiet-ke]] · *chờ sếp*
- [ ] (Đề xuất) bổ sung dòng "không tự commit" vào `CLAUDE.md` → [[phan-hoi-cach-lam-viec]] · *chờ sếp*

## CRM UI (`src/`)
- [ ] Cập nhật README §7 (bảng test theo bộ TC mới, thêm `login-page.spec.ts`) và §9 (bỏ đoạn lo khoá tài khoản; ghi chú TC_004 theo nghĩa mới) → [[test-login-dashboard]]
- [ ] `CRM_LOGIN_TC_004` FAIL chờ PO: lỗi → `@KnownBug`; thiết kế → sửa TC trước
- [ ] Automate TC_019, TC_020 (cần `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` trong `.env`) và TC_021 → 051 theo thứ tự ưu tiên trong [[test-login-dashboard]]
- [ ] TC_014 cần sếp cấp tài khoản staff mật khẩu có chữ cái → điền `TC014_EMAIL`/`TC014_PASSWORD`
- [ ] (Đề xuất, chờ sếp) `BasePage.goto` dùng `waitUntil: 'domcontentloaded'` + nới timeout chụp ảnh ở fixture — 2 lần lỗi lẻ do server demo chậm (05-10-2026)
- [ ] (Góp ý review 05-10) `trace: 'retain-on-failure'` lưu nguyên giá trị đã điền — TC_016 luôn FAIL nên trace luôn chứa email admin trong `reports/`
- [ ] Góp ý review 11-09 chưa làm: thu hẹp phạm vi `menuItem()` (phần tên step lộ email đã sửa 05-10-2026)

## Book API (`api/`)
- [ ] `/create-bug-report` cho 4 test FAIL, ưu tiên **TC_068-d** (bug mới) → [[thiet-ke-suite-api]]
- [ ] Ghi TC_068-d và quan sát `Content-Type: text/plain` của login thành F-nn mới trong `api_map.md` qua `/generate-requirements-from-api` (delta) → [[he-thong-va-phat-hien]]
- [ ] Áp Impact `DEMO-AMB-2509` vào TC API: `AMB-BK-AUTH-03` đã chốt là **lỗi** (25-09-2026) → TC_062, TC_075 bỏ `@PendingAMB` sang `@KnownBug`; gỡ 5 dòng "TC treo" ở index. Thứ tự: `/update-testcases-from-impact` → `/update-automation-from-impact` (đổi `@pendingamb` → `@knownbug` trong `api/tests/auth/*.api.spec.ts`, sửa lệnh grep-invert ở README)
- [ ] Automate **Part 02 API**: `TC_082→105` + `TC_108` (refetch-token qua cookie, logout, me, profile). Cần userD (37) và userE (38). TC dính F-16 (098, 099, 102→104) và TC_090 (F-17) là `@KnownBug`

## Book Web / Mobile
- [ ] Automation Web Book chưa có — phải inspect DOM trước → [[mat-web-mobile-book]]
- [ ] Mobile Part 01: ghi ngược cột `Automation` (TC_001, TC_005: Yes → Partial) + bổ sung 4 TC (004 · 018 · 021 · 024) vào điều kiện "định danh avatar/nút mắt" ở index — *chờ sếp duyệt; file có thay đổi chưa commit*
- [ ] Bug report cho 3 hành vi thấy trên app (login trùng, logout bật lại, email có dấu cách) — *đã hỏi sếp, chưa trả lời*
