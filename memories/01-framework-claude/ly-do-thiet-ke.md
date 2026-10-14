---
name: ly-do-thiet-ke
description: Vì sao bộ khung CLAUDE.md / .claude/rules có các quy tắc hiện tại, và các chỗ cấu hình đang lệch nhau
metadata:
  type: project
---

# Bộ khung `.claude/` — lý do thiết kế

> Nội dung rule đã nằm trong `CLAUDE.md` và `.claude/rules/*`. File này chỉ ghi **vì sao** có rule đó, để khi muốn sửa rule biết mình đang bỏ đi cái gì.

## Lý do các rule
| Rule | Vì sao có | Nguồn |
|---|---|---|
| Được đọc `.env` để lấy tài khoản | 09-09 agent từ chối nhập mật khẩu thật, chỉ recon bằng dữ liệu giả → Happy Path chỉ ghi được là "giả định", sếp phải xác nhận tay. *(Suy luận: mục này được thêm sau để gỡ vướng — transcript không ghi rõ.)* | 92579dfe (09-09) |
| `.mcp.json` riêng từng project, đường dẫn tương đối | Server global có cwd bám theo project khởi động trước → evidence lạc sang project khác; 24-09 config global trỏ sai đường dẫn → ENOENT | 3fd85337 · 5ddba469 (24-09) |
| Allure CLI cài **trong** project, cấm cài lên máy | Máy không có Allure / Maven / Python. Máy mới clone về `npm test` báo thiếu playwright vì chưa `npm install`. CI checkout cũng không có tool hệ thống | 591c7695 (03-09), 92579dfe (09-09) |
| Parallel là mặc định (5 luồng) | 26-08 từng hạ `workers:1` vì trang dev nặng (~40 s/lần load). Sau đó chốt: test đỏ khi song song là test sai. Muốn xem tuần tự thì `--workers=1` lúc chạy, **không** đổi config | 591c7695 (26-08) |
| Screenshot chụp ở teardown, cấm stdout | Report phải chứng minh test chạy thật trên UI. Lệnh chụp trong teardown phải bọc try/catch — session đã chết thì nó ném lỗi và che mất lỗi gốc | 92579dfe (09-09) |
| Retry chỉ bọc bước đọc / chờ | Retry bước có side-effect (quét mã, gõ ô search có debounce) nhân bản dữ liệu mà test vẫn xanh. Chạy lẻ từng class pass, cả suite fail = rò state | fd283ca9 (15-09) |
| Một nghiệp vụ = một prefix trên mọi nền tảng (`web/` · `mobile/` · `api/`) | Book có cả API, Android, Web — tách prefix theo nền tảng là nhân đôi REQ cho cùng một rule | 707a6dce (01-10), CLAUDE.md §6b |
| Cấm lấy `id` từ API danh sách để PATCH/DELETE (test BOLA dùng 2 tài khoản tự tạo) | Sự cố 14-08-2026: phiên kiểm BOLA đã sửa rồi xoá tài khoản seed của Book (xem [[he-thong-va-phat-hien]]) | 0b11ea16 (01-10) |
| Headless ≠ `fullyParallel` | Sếp hỏi headless có nhanh hơn không — hai thứ độc lập | 591c7695 (26-08) |

## ⚠️ Chỗ cấu hình đang lệch (chưa sửa — chờ sếp chốt)
1. **Viewport headed:** `.mcp.json` đặt `--viewport-size=1600,780`, còn `CLAUDE.md` và `.claude/rules/playwright_rules.md` ghi **`1600×770`**. Một trong hai cần đồng bộ. Đổi `.mcp.json` thì phải khởi động lại Claude Code.
2. **Commit:** `CLAUDE.md` mới cấm `pull/checkout/merge/rebase/reset`, chưa có dòng "không tự commit" (sếp đã yêu cầu nhiều lần — xem [[phan-hoi-cach-lam-viec]] mục 1).
3. **README §8** vẫn nói file CI nằm ở gốc repo cha — đã sai sau khi tách (xem [[ci-github-actions]]).
- Kiểm ngày 05-10-2026.

## Cấu hình MCP hiện tại
- `.mcp.json`: `npx -y @playwright/mcp --viewport-size=1600,780 --config .claude/playwright-mcp-config.json`
- `.claude/playwright-mcp-config.json`: launch args `--test-type`, `--window-position=-3,0`.
- Viewport suite chạy test (khác viewport MCP): `1920×1080` trong `playwright.config.ts` (xem [[framework-playwright-ui]]).

Liên quan: [[moi-truong-may-va-cong-cu]] · [[tach-repo]]
