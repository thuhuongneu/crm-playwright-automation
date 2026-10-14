---
name: he-thong-va-phat-hien
description: AnhTester Book API — spec + sha, hành vi auth thật, các phát hiện F-xx, sự cố xoá tài khoản seed 14-08, môi trường và năng lực QA
metadata:
  type: project
---

# Book API — hệ thống & phát hiện

> Book là hệ thống **khác hẳn** Perfex CRM — code, config, report, prefix đều tách riêng. Base URL: `BOOK_API_BASE_URL` trong `.env`. Chi tiết F-xx đầy đủ: `docs/requirements/_book-api/_discovery/api_map.md` mục 3 (repo cha).

## Spec
- Spec thô: `https://book.anhtester.com/swagger/json`. Trang `/swagger` chỉ là **Scalar renderer**, không phải spec.
- Snapshot dùng sinh TC: `docs/requirements/_book-api/_discovery/sources/openapi_2026-09-19.json`, sha256 bắt đầu `32bb8b39…` kết thúc `…3f09`. Ngày 01-10-2026 vẫn khớp online.
- OpenAPI 3.0.0 · 35 operation / 8 nhóm · **1 server duy nhất = Production**.
- `components.schemas` **rỗng** — mọi schema khai inline → schema trong `api/models/*.schema.ts` là chép tay từ snapshot.
- `BearerAuth` khai toàn cục nhưng **15 operation ghi đè `security: []`** (register, login, refetch-token…) → đọc auth **theo từng operation**.
- ⚠️ **Bẫy sha:** sha **đổi mỗi lần server khởi động lại** vì `default` ngày của PROMO lấy theo giờ khởi động. Sha lệch → so cấu trúc, bỏ qua `default` dạng ngày, rồi mới kết luận spec đổi.
- **How to apply:** trước khi automate part mới: tải spec bằng `curl` (không dùng WebFetch) → so sha. Đổi thật → chạy delta `/generate-requirements-from-api` → `/update-testcases-from-impact`.
- Nguồn: 0b11ea16 (01-10).

## Hành vi auth thật
- Login trả `accessToken` trong body **và** set 2 cookie `accessToken` + `refetchToken`.
- Endpoint 🔒 **chỉ đọc header `Authorization`** — không endpoint nào đọc cookie `accessToken`.
- `refetch-token` **chỉ** đọc cookie `refetchToken`, không trả cookie mới. `exp` = `"6d"` (F-11).
- Thông báo thật `Login successfully.` (có dấu chấm) → TC dùng "chứa".
- `POST /api/login` 200 trả **`Content-Type: text/plain;charset=utf-8`** dù body JSON và spec khai `application/json` (422 thì đúng JSON). Helper `expectJsonResponse` đã bị bỏ khỏi suite vì vậy. **Chưa assert** — chưa có TC/REQ chốt (việc treo).
- **How to apply:** dùng `body.accessToken` làm Bearer; chỉ giữ cookie jar khi gọi refetch-token.
- Nguồn: 0b11ea16 (01-10).

## Phát hiện F-xx chính (AUTH)
| Mã | Nội dung | TC liên quan |
|---|---|---|
| F-01 | `GET /api/user`, `/api/user/{id}` công khai, lộ PII mọi user | |
| F-02 | Không phân quyền — token user thường PATCH/DELETE được user khác (BOLA/BFLA) | |
| F-03 | Cookie `accessToken` chỉ `Path=/`, thiếu HttpOnly/Secure/SameSite (`refetchToken` thì đủ) | **TC_080 `@knownbug`** |
| F-16 | `PATCH /api/profile` body **thiếu khoá** → 422 với `fields.fields: ["Property 'fields' is missing","Expected object"]` (AMB-BK-AUTH-21) | TC_098 · 099 · 102→104 |
| F-17 / F-18 / F-23 | Logout không thu hồi refresh token · refresh token không xoay vòng · access token vẫn dùng được sau logout | TC_090 (F-17) |
| F-19 | Thiếu `email` → server tự dùng `user@example.com`: register `422 Email already exists.`, login `400 Invalid password.` | **TC_062 · TC_075** |
| F-20 | Login lộ email đã đăng ký (sai mật khẩu 400, email không tồn tại 404 `User not found.`) | |
| F-21 | `Max-Age` của `refetchToken` là mốc epoch, không phải số giây | |
| F-22 | Không có chính sách mật khẩu (`"1"` vẫn 201); chuỗi rỗng sinh body lỗi kiểu `fields.fields` | |
| F-27 | `PATCH /api/user/{id}` thiếu khoá `email` → `422 Email already exists.` | |
- F-04→F-10: price âm, category không tồn tại, sách mồ côi, `POST /api/user` gán mật khẩu mặc định, sai status so spec, header `Server` lộ nginx. F-26→F-49 thuộc USER / BOOK.
- **Bug mới chưa ghi F-nn:** `TC_068-d` — `name` 10.000 ký tự → 422 nhưng body `fields.fields` thay vì `fields.name` (cùng lớp F-16/F-22). Giữ nguyên assertion.
- Nguồn: 0b11ea16 (01-10).

## Môi trường & năng lực QA
- Môi trường **KHÔNG dùng chung** (sếp chốt 14-08-2026) — được thao tác phá huỷ, **nhưng chỉ trên bản ghi do chính suite tạo**.
- Gọi API ✅ (19-09-2026) · Truy vấn CSDL ❌ (20-09-2026, *"Không cho QA đụng Database"*) → dữ liệu lưu chỉ kiểm gián tiếp qua `GET /api/me`.
- Server có sẵn ~744 sách, ~2714 user và nhiều bản ghi `auto_*` từ lượt trước → **không** assert theo tổng số bản ghi.
- Nguồn: 0b11ea16, 0ebb7ee7 (01-10), 707a6dce (01-10).

## 🚨 Sự cố 14-08-2026 — nguồn gốc luật "chỉ đụng bản ghi mình tạo"
- Khi kiểm BOLA, phiên cũ đã PATCH rồi DELETE **tài khoản seed của khoá học**. Tạo lại được nhưng ra ID mới, sách của tài khoản cũ thành `auth: null`.
- **Why:** đây là lý do luật 3.4.4 của `skills-requirements-analyzer` và mục BOLA/IDOR trong `CLAUDE.md`: không ghi/xoá bản ghi không do suite tạo, **kể cả khi được nói "xoá thoải mái"**. Cấm lấy `id` từ API danh sách.
- `user@example.com` là tài khoản thật, không do QA tạo (RISK-BK-AUTH-03): **không** đăng nhập thành công, sửa hay xoá. TC_075 chỉ được gửi **đúng 1** request login sai vào nó mỗi lượt.
- Nguồn: 0b11ea16 (01-10).

Liên quan: [[thiet-ke-suite-api]] · [[quy-uoc-ma-va-du-lieu]] · [[mat-web-mobile-book]]
