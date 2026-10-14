# Automation Web — Progress (mode TC) · LOGIN TC_011 → TC_020

Nguồn TC: `docs/testcases/login/web/test_cases_login_web.md` · Stack: Playwright + TypeScript (framework sẵn có `src/`)

- [x] Bước 1: Phân tích test cases
- [x] Bước 2: Khảo sát UI (MCP Recon) — viewport đo 1600×750 (inner < outer, không bị cắt)
- [x] Bước 3: Thiết kế POM — mở rộng `LoginPage`
- [x] Bước 4: Chuẩn bị test data — `TestData.email/password/swapCase`, biến tuỳ chọn `TC014_*`
- [x] Bước 5: Sinh automation scripts — `src/tests/auth/login-validation.spec.ts`
- [x] Bước 6: Chạy test + Auto-heal
- [x] Bước 7: Cleanup & code review (subagent)

## Kết Quả (lượt cuối 05-10-2026, headed, 5 luồng)
| TC ID | Title | Số test | Status | Stability | Ghi chú |
|---|---|---|---|---|---|
| CRM_LOGIN_TC_011 | Trường bắt buộc (a–d) | 4 | ✅ PASS | 3/3 lượt cuối | `b` từng timeout 1 lần ở `page.goto` (server chậm) — nhiễu môi trường |
| CRM_LOGIN_TC_012 | Email sai định dạng bị trình duyệt chặn (a–e) | 5 | ✅ PASS | 3/3 lượt cuối | `e` từng timeout 1 lần ở fixture chụp ảnh cuối — nhiễu môi trường |
| CRM_LOGIN_TC_013 | Sai thông tin → thông báo chung, so sánh 2 biến thể | 1 | ✅ PASS | 3/3 | Thay bản phủ thiếu cũ (`login-invalid.spec.ts` đã xoá) |
| CRM_LOGIN_TC_014 | Mật khẩu sai kiểu chữ | 1 | ⏭️ SKIP | — | Thiếu `TC014_EMAIL`/`TC014_PASSWORD` trong `.env` |
| CRM_LOGIN_TC_015 | Sai nhiều lần không khoá (a, b) | 2 | ✅ PASS | 3/3 | — |
| CRM_LOGIN_TC_016 | 🐞 Ô Email giữ giá trị sau login thất bại | 1 | ❌ FAIL (phơi bug) | FAIL ổn định | `BUG_login_1787226514_TC016` — giữ kỳ vọng, tag `@knownbug` |
| CRM_LOGIN_TC_017 | Chuỗi tấn công ở ô Password (a, b) | 2 | ✅ PASS | 3/3 | — |
| CRM_LOGIN_TC_018 | Mật khẩu đa ngôn ngữ + emoji | 1 | ✅ PASS | 3/3 | — |
| CRM_LOGIN_TC_019 | Tài khoản khách hàng bị từ chối ở /admin | — | ⏭️ SKIP | — | Sếp chọn bỏ qua (thiếu tài khoản Customer) |
| CRM_LOGIN_TC_020 | Phiên khách hàng không mở được /admin | — | ⏭️ SKIP | — | Sếp chọn bỏ qua (thiếu tài khoản Customer) |

## Files
- Tạo: `src/tests/auth/login-validation.spec.ts`
- Sửa: `src/pages/login.page.ts` · `src/utils/env.config.ts` · `src/utils/test-data.ts` · `.env.example` · `README.md` (dòng cây thư mục)
- Xoá: `src/tests/auth/login-invalid.spec.ts` · `test-data/login-invalid.json`

## Nhật ký
- Vòng 1: TC_011 a–d timeout chờ GET sau chuyển hướng — lỗi validate trả thẳng ở POST 200, không có 303 → đổi sang bắt "phản hồi điều hướng cuối cùng không phải 3xx" → PASS
- Review subagent: TC_012 dùng sự kiện `invalid` làm bằng chứng chặn gửi (tránh pass giả) · TC_014 không đưa mật khẩu vào `expect` · chờ `domcontentloaded` của tài liệu MỚI · metadata trước `test.skip` · `useInnerText` · `serverRenderedEmailValue` nhận nháy đơn + giải mã entity
