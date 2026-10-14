---
name: test-login-dashboard
description: TC CRM đã automate — map TC ID ↔ file spec, quyết định đánh số lại 28-09, kết quả chạy gần nhất, TC cố tình FAIL
metadata:
  type: project
---

# Test UI CRM đã automate

## Đánh số lại theo bộ TC mới (28-09-2026)
- Bộ TC login thủ công đã **đánh số lại thành 51 TC** (`CRM_LOGIN_TC_001` → `051`). Code cũ (11-09) dùng TC_001–004 với **nghĩa khác**.
- Sếp chọn **"Viết lại theo tài liệu mới"**.
- **Why:** hai test khác nội dung mà trùng testId phá truy vết RTM.
- **How to apply:** testId luôn lấy theo `docs/testcases/login/web/test_cases_login_web.md` hiện hành (repo cha), **không** theo code cũ.
- Nguồn: 6fc61c22 (28-09).

## Map hiện tại (kiểm trên code 05-10-2026)
| File | TC ID | Nội dung |
|---|---|---|
| `src/tests/auth/login-page.spec.ts` | `CRM_LOGIN_TC_001` → `004` | Giao diện, cấu trúc trang, logo. TC_001–003 kiểm cả ghi chú kỹ thuật: HTTP 200, autofocus, label-for, không CAPTCHA, không `<script>` lạ, không request JS |
| `src/tests/auth/login.spec.ts` | `CRM_LOGIN_TC_005` → `010` | Đăng nhập thành công, PM (TC_006), biến thể email (TC_007 a–d), cookie/CSRF… |
| `src/tests/auth/login-validation.spec.ts` | `CRM_LOGIN_TC_011` → `018` | Nhóm C (05-10-2026). TC_013 viết lại đủ bước so sánh — `login-invalid.spec.ts` + `login-invalid.json` **đã xoá** (sếp duyệt). TC_014 tự skip khi thiếu `TC014_EMAIL`/`TC014_PASSWORD`. TC_016 FAIL có chủ đích (`@knownbug`). TC_019/020 **chưa làm** — sếp chọn bỏ qua vì thiếu tài khoản Customer |

### Sự thật đo được khi làm Nhóm C (05-10-2026)
- Lỗi **validate** (trường bắt buộc) được trả thẳng ở **POST 200**, không chuyển hướng; sai thông tin thì **POST 303 → GET 200**. Helper `LoginPage.submitAndCaptureResponses()` bắt "phản hồi điều hướng cuối cùng không phải 3xx" để phủ cả hai.
- `#email` là `type=email` (không `required`) → email sai định dạng bị trình duyệt chặn, 0 POST. Bằng chứng chặn gửi tin được = sự kiện `invalid` (`armSubmitBlockProbe`), không phải chỉ `validity`.
- `type=email` tự bỏ khoảng trắng → TC_011-d chỉ kiểm được việc máy chủ cắt khoảng trắng ở ô Password.
- Server demo thỉnh thoảng treo sự kiện `load` / chụp ảnh fullPage quá 20s khi chạy 5 trình duyệt headed → 2 lần lỗi lẻ trong ~70 lượt test, đều ở `BasePage.goto` và fixture chụp ảnh (file dùng chung, chưa sửa).
| `src/tests/dashboard/dashboard.spec.ts` | `CRM_DASH_TC_001` | Điều hướng Dashboard → Khách hàng. Module `DASH` **chưa recon, chưa có TC thủ công** → test mồ côi trong RTM |

> ⚠️ **README §7 đã lỗi thời** — bảng test vẫn ghi nghĩa cũ của TC_001–004 và thiếu `login-page.spec.ts`.

## Kết quả chạy gần nhất (28-09-2026)
- 10 TC → 13 test (TC_007 có 4 biến thể): **12 PASS · 1 FAIL**. FAIL là **TC_004** do bug app `BUG_login_1787226513_TC004` — **cố tình**, chờ PO (xem [[he-thong-perfex-crm]]).
- Sếp yêu cầu "pass 1 lần là báo" → lượt này chỉ chạy 1 lần.
- Thay đổi ngày 28-09 **chưa commit** tại thời điểm cuối phiên.

## Việc tiếp theo theo review automation 19-09
- `docs/testcases/login/review/automation_review_web_20260919.md` (repo cha) chấm TC nào automate được.
- TC_004 và TC_029 ⏸️ Hoãn chờ PO. TC_008/009/024/037 (cookie/CSRF) chấm Yes.
- Thứ tự ưu tiên tiếp: TC_006, 019, 020, 022, 027, 030, 033, 036-b, 010, 040–043, 048, 003, 018.
- TC_011 → 051 chưa automate (trừ TC_013 một phần).

Liên quan: [[framework-playwright-ui]] · [[viec-dang-do]] · [[vi-tri-tai-lieu]]
