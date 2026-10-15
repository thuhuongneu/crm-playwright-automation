# MEMORY.md — Bản đồ bộ nhớ dự án `crm-playwright-automation`

> **Thứ tự đọc bắt buộc cho MỌI yêu cầu:** `CLAUDE.md` → **file này** → mở đúng các file bộ nhớ mà bảng "Đang làm gì → đọc gì" chỉ ra. **Không** đọc hết cả thư mục.
>
> Bộ nhớ này gom lại từ 18 phiên làm việc cũ (26-08-2026 → 02-10-2026). Các phiên đó chạy ở repo cha `D:\AI_Testing_Automation_Course\course-ai-test-automation`, trước khi tách repo ngày 05-10-2026. Mỗi file ghi rõ nguồn: mã phiên và ngày.

---

## 1. Đang làm gì → đọc gì

| Yêu cầu của sếp | Đọc các file này (theo thứ tự) |
|---|---|
| **Bất kỳ việc gì** | [00-chung/phan-hoi-cach-lam-viec.md](00-chung/phan-hoi-cach-lam-viec.md) · [99-viec-dang-do/viec-dang-do.md](99-viec-dang-do/viec-dang-do.md) |
| Viết / sửa / chạy test **UI CRM** (`src/`) | [02-crm-ui/he-thong-perfex-crm.md](02-crm-ui/he-thong-perfex-crm.md) → [02-crm-ui/framework-playwright-ui.md](02-crm-ui/framework-playwright-ui.md) → [02-crm-ui/test-login-dashboard.md](02-crm-ui/test-login-dashboard.md) |
| Viết / sửa / chạy test **API Book** (`api/`) | [03-book-api/he-thong-va-phat-hien.md](03-book-api/he-thong-va-phat-hien.md) → [03-book-api/thiet-ke-suite-api.md](03-book-api/thiet-ke-suite-api.md) → [03-book-api/quy-uoc-ma-va-du-lieu.md](03-book-api/quy-uoc-ma-va-du-lieu.md) |
| Automation **Web / Mobile của Book** | [03-book-api/mat-web-mobile-book.md](03-book-api/mat-web-mobile-book.md) · [03-book-api/quy-uoc-ma-va-du-lieu.md](03-book-api/quy-uoc-ma-va-du-lieu.md) |
| Đụng tới requirements / test cases / bug / execution (`docs/`) | [04-tai-lieu-docs/vi-tri-tai-lieu.md](04-tai-lieu-docs/vi-tri-tai-lieu.md) |
| Dựng / sửa **CI** GitHub Actions | [02-crm-ui/ci-github-actions.md](02-crm-ui/ci-github-actions.md) · [05-lich-su-repo/tach-repo.md](05-lich-su-repo/tach-repo.md) |
| Mở report Allure, debug bằng Playwright MCP, lỗi lệnh/terminal | [00-chung/moi-truong-may-va-cong-cu.md](00-chung/moi-truong-may-va-cong-cu.md) |
| Sửa `CLAUDE.md`, `.claude/rules`, `.mcp.json`, skill, command | [01-framework-claude/ly-do-thiet-ke.md](01-framework-claude/ly-do-thiet-ke.md) |
| Hỏi "repo này lấy từ đâu", "file X trước ở đâu" | [05-lich-su-repo/tach-repo.md](05-lich-su-repo/tach-repo.md) |

---

## 2. Danh mục file

### `00-chung/` — áp dụng cho mọi việc
- [ho-so-user.md](00-chung/ho-so-user.md) — sếp là ai, cách xưng hô, kiểu câu hỏi hay gặp, mục tiêu automation
- [phan-hoi-cach-lam-viec.md](00-chung/phan-hoi-cach-lam-viec.md) — các lần sếp sửa / duyệt cách làm: không tự commit, không đoán UI, tự chạy test, tách đã đo / suy luận…
- [moi-truong-may-va-cong-cu.md](00-chung/moi-truong-may-va-cong-cu.md) — máy Windows: Node, không có Python, PowerShell 5.1, `rtk`, log MCP, tiến trình rác

### `01-framework-claude/` — bộ khung AI testing (`CLAUDE.md`, `.claude/`)
- [ly-do-thiet-ke.md](01-framework-claude/ly-do-thiet-ke.md) — vì sao có các rule (viewport, `.mcp.json` riêng, Allure trong project, parallel mặc định, `.env`…) + chỗ cấu hình đang lệch

### `02-crm-ui/` — Perfex CRM (`https://crm.anhtester.com`) · code ở `src/`
- [he-thong-perfex-crm.md](02-crm-ui/he-thong-perfex-crm.md) — kết quả recon: route, 3 vai trò, DOM form login, hành vi lỗi, bug đã biết, môi trường dùng chung
- [framework-playwright-ui.md](02-crm-ui/framework-playwright-ui.md) — quyết định thiết kế `playwright.config.ts`, fixture, env, tag, Allure, typecheck
- [test-login-dashboard.md](02-crm-ui/test-login-dashboard.md) — TC đã automate, map TC ID ↔ file, kết quả chạy gần nhất, TC cố tình FAIL
- [ci-github-actions.md](02-crm-ui/ci-github-actions.md) — CI: 4 job, secrets, loại TC cố tình FAIL, Allure 2 + Pages + Google Chat, lịch GitHub không chạy → cron-job.org

### `03-book-api/` — AnhTester Book (`https://book.anhtester.com`) · code ở `api/`
- [he-thong-va-phat-hien.md](03-book-api/he-thong-va-phat-hien.md) — spec + sha, hành vi auth thật, các phát hiện F-xx, sự cố xoá tài khoản seed 14-08
- [thiet-ke-suite-api.md](03-book-api/thiet-ke-suite-api.md) — mốc T, ledger dọn dữ liệu, che dữ liệu, `retries: 0`, SLA, kết quả 46 PASS / 4 FAIL phơi bug
- [quy-uoc-ma-va-du-lieu.md](03-book-api/quy-uoc-ma-va-du-lieu.md) — mã `BK`, dải TC theo nền tảng, offset tài khoản test, tag `@KnownBug`/`@PendingAMB`…
- [mat-web-mobile-book.md](03-book-api/mat-web-mobile-book.md) — sự thật mặt Web & Android của Book, bug thấy trên app cần đối chiếu ở API/web

### `04-tai-lieu-docs/`
- [vi-tri-tai-lieu.md](04-tai-lieu-docs/vi-tri-tai-lieu.md) — `docs/` đã có trong repo này (kiểm 05-10): đường dẫn từng loại tài liệu, prefix, mã kế tiếp

### `05-lich-su-repo/`
- [tach-repo.md](05-lich-su-repo/tach-repo.md) — tách repo ngày 05-10-2026: cái gì đi theo, cái gì ở lại, hệ quả

### `99-viec-dang-do/`
- [viec-dang-do.md](99-viec-dang-do/viec-dang-do.md) — việc còn treo của CRM UI, Book API, Book Web/Mobile, framework

---

## 3. Quy tắc duy trì bộ nhớ

| Quy tắc | Lý do |
|---|---|
| Mỗi file **một chủ đề**. Thêm sự thật mới vào **file có sẵn đúng chủ đề**, chỉ tạo file mới khi chưa có chủ đề nào khớp; tạo xong thì thêm 1 dòng vào mục 2 và nếu cần vào bảng mục 1 | Giữ bộ nhớ không phình, không trùng |
| Mỗi mục ghi **Why** + **How to apply** + **Nguồn** (phiên/ngày `DD-MM-YYYY`) | Biết khi nào mục đó còn đúng, khi nào hết hiệu lực |
| Việc trong `99-viec-dang-do/` xong thì **xoá dòng** đó, ghi kết quả vào file chủ đề | File việc dang dở chỉ chứa việc còn treo |
| 🔒 **Không** ghi giá trị bí mật (mật khẩu, token, cookie, email tài khoản thật). Chỉ ghi tên biến `.env` hoặc hình thái | Thư mục này được commit |
| Phát hiện mục nào **sai / lỗi thời** → sửa hoặc xoá ngay, không để song song hai phiên bản | Bộ nhớ sai nguy hiểm hơn không có bộ nhớ |
| Không chép lại thứ đã có trong code, README, CLAUDE.md — chỉ ghi **lý do** và **điều không suy ra được từ code** | Tránh hai nguồn sự thật |
