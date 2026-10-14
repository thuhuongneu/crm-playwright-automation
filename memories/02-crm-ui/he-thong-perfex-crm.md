---
name: he-thong-perfex-crm
description: Kết quả recon Perfex CRM (crm.anhtester.com) — route, 3 vai trò, DOM form login, hành vi lỗi, bug đã biết, môi trường dùng chung
metadata:
  type: project
---

# Perfex CRM — sự thật hệ thống đã đo

> Hệ thống: **Perfex CRM — Anh Tester Demo**, `BASE_URL` trong `.env`. Mọi mục dưới đây đo trên DOM thật (11-09 và 28-09-2026). Tài liệu chi tiết ở repo cha — xem [[vi-tri-tai-lieu]].

## Môi trường & năng lực QA
- **Môi trường demo DÙNG CHUNG** → cấm thao tác phá huỷ. Test có ghi dữ liệu phải tự sinh data (`TestData`) và tự dọn cuối test.
- Năng lực QA (chốt 11-09-2026): ❌ gọi API · ❌ truy vấn CSDL · ❌ kiểm tầng tích hợp · ❌ Activity Log (`/admin/utilities/activity_log` trả "Từ chối truy cập" với Admin demo) · ✅ DevTools trình duyệt (TC `@TechCheck`).
- **How to apply:** phần cần API / CSDL / tích hợp → ghi "đội Dev xác minh", không tự bịa cách kiểm.
- Nguồn: `docs/requirements/README.md` (repo cha).

## Route & vai trò
| Vai trò | Trang login | Sau đăng nhập | Ghi chú |
|---|---|---|---|
| Admin | `/admin/authentication` | `/admin/` | body class `user-id-2` |
| Project Manager | `/admin/authentication` | `/admin/` | body class `user-id-3`. Thấy đúng **9 mục menu**: Dashboard, Customers, Projects, Tasks, Contracts, Sales, Support, Leads, Utilities (ẩn 5 mục so với Admin) |
| Customer | **`/login`** (cổng khách hàng riêng) | — | Không vào được `/admin` |
- POST login trả **303**. URL `/` trả 303 sang `/authentication/login` (cổng khách hàng, tab "Please login").
- Tài khoản: `TEST_USERNAME`/`TEST_PASSWORD` (Admin) và `PM_EMAIL`/`PM_PASSWORD` (PM, sếp đưa 28-09) trong `.env`.
- **How to apply:** route khai trong `routes` của `src/utils/env.config.ts`, không hardcode trong test.
- Nguồn: 59955a6a (11-09), 6fc61c22 (28-09).

## Form login — DOM
- Ô nhập `#email` / `#password`, label **"Email Address"** / **"Password"**. Form có hidden `csrf_token_name`. Body class `login_admin`.
- Ô email **không** có `required`, `validationMessage` rỗng → trình duyệt không chặn submit rỗng.
- **2 kiểu dải lỗi đỏ**, cả hai **không có role**, chỉ có class `alert-danger`:
  - Lỗi validate (VD *"The Password field is required."*) nằm thẳng trong `<form>`.
  - Lỗi sai thông tin (*"Invalid email or password"*) nằm trong `#alerts`.
  - → locator đúng là **`.alert-danger`**. Locator cũ `#alerts .alert-danger` bỏ sót lỗi validate — **không quay lại**.
- Bấm Login khi form trống: bản 11-09 ghi "không có thông báo gì", recon 28-09 thấy server trả dải lỗi validate. Assert theo hành vi đo được lúc viết test.
- Remember me: tích → cấp cookie `autologin` (hình thái 16 ký tự hex); không tích → không có. Click chữ "Remember me" (LABEL) cũng tích được. PO coi tính năng này không hoạt động, đưa ra ngoài phạm vi (`AMB-LOGIN-15`, `RISK-LOGIN-08`). Chỉ assert hình thái, không log giá trị.
- Bấm Login 2 lần liên tiếp vẫn vào Dashboard (không ra `419 Page Expired!`). Email viết hoa/thường hoặc có khoảng trắng đều đăng nhập được (TC_007 a–d).
- Nguồn: 6fc61c22 (28-09).

## Chính sách đã chốt
- **Không khoá tài khoản** sau nhiều lần sai (`AMB-LOGIN-02`, `REQ-LOGIN-41`) → README §9 còn lo "nếu bật khoá sau N lần sai" là đã cũ.
- Phiên hết hạn sau **1 giờ không hoạt động**, mỗi thao tác gia hạn lại (`REQ-LOGIN-42`).
- Nguồn: `docs/requirements/README.md` (AMB chốt 18–19/09-2026).

## Bug đang mở (module LOGIN, web)
| Bug | Nội dung | Ảnh hưởng automation |
|---|---|---|
| `BUG_login_1785678750_TC039` 🔴 Critical | Login phục vụ qua HTTP thuần, không ép HTTPS, không HSTS (`REQ-LOGIN-44`) | — |
| `BUG_login_1787226513_TC004` 🟡 Minor | Bấm logo → cổng khách hàng thay vì trang chủ | **`CRM_LOGIN_TC_004` FAIL có chủ đích**, chờ PO: "lỗi" → gắn `@KnownBug`; "thiết kế" → sửa Expected TC trước rồi mới sửa script. **Không** hạ kỳ vọng |
| `BUG_login_1787226514_TC016` | Ô Email không giữ giá trị sau login thất bại | — |
| `BUG_login_1787226516_TC028` | Quên mật khẩu bỏ trống email báo `Email not found` | — |
- Danh mục đầy đủ: `docs/bugs/README.md` (repo cha).

## Locator gotcha
- Link sidebar có icon Font Awesome → glyph cộng vào accessible name → `menuItem()` cố ý **không** dùng `exact: true`. Review 11-09 lưu ý: khớp chuỗi con có thể strict-mode violation khi menu nở mục con (VD "Sales") → nên thu hẹp phạm vi (`#side-menu > li > a`).
- Nguồn: 59955a6a (11-09).

Liên quan: [[framework-playwright-ui]] · [[test-login-dashboard]] · [[vi-tri-tai-lieu]]
