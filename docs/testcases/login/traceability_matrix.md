# Ma Trận Truy Vết (RTM) — Module Đăng nhập / Xác thực `LOGIN` · Perfex CRM (Web)

| Mục | Giá trị |
|---|---|
| **Ngày lập** | 14-10-2026 |
| **Phạm vi** | Module `LOGIN` — nền tảng **Web**. Mobile · API: chưa có tài liệu (xem mục ⬛) |
| **Nguồn requirements** | [REQUIREMENTS_LOGIN_SUMMARY.md](../../requirements/login/REQUIREMENTS_LOGIN_SUMMARY.md) + [requirements_login_web.md](../../requirements/login/web/requirements_login_web.md) — 44 REQ, **40 trong phạm vi** |
| **Nguồn test cases** | [TEST_CASES_LOGIN_SUMMARY.md](TEST_CASES_LOGIN_SUMMARY.md) + [test_cases_login_web.md](web/test_cases_login_web.md) — 51 TC (`CRM_LOGIN_TC_001` → `051`) |
| **Nguồn automation** | Quét `src/tests/**/*.spec.ts` theo `allureMeta({ testId })` — 4 file, 19 testId (18 `CRM_LOGIN_*` + 1 `CRM_DASH_*`) |
| **Cách map** | **100% bằng ID** (REQ ↔ TC theo cột `REQ ID`; TC ↔ script theo `testId`). **Không có mapping suy luận ⚠️** |

> ⚠️ Cột `Automation` trong file TC là **khả năng** automate (Yes/Partial/No), **không** phải "đã có script". RTM này tính theo **script thật trong `src/`**, không theo cột đó.

---

## ⬛ Phần hệ thống KHÔNG nằm trong RTM này (đọc trước các con số)

RTM này **chỉ** phủ module `LOGIN`. Mọi phần trăm bên dưới **chỉ đúng trong module này**, không phản ánh toàn hệ thống.

| Phạm vi | Tình trạng (theo `docs/requirements/README.md` · `docs/testcases/README.md`) |
|---|---|
| **20/23 module chưa có tài liệu** — `CONT` · `LEAD` · `TASK` · `EST` · `PROP` · `INV` · `PAY` · `CN` · `SUB` · `CTR` · `EXP` · `ITEM` · `TICK` · `ESTREQ` · `KB` · `REP` · `DASH` · `TODO` · `REM` · `PROF` | ⬜ Chưa khảo sát — **không có REQ nào**, nên không xuất hiện trong ma trận. Coverage 100% ở đây **không nói gì** về các module này |
| `PRJ` (104 REQ) | Có requirements nhưng **chưa có test case** nào ở `docs/testcases/` |
| `CUST` (84 REQ · 129 TC) | Có đủ REQ + TC, **chưa có RTM riêng** — chạy `/generate-traceability-matrix Customers` |
| Mobile · API của `LOGIN` | Không có tài liệu — 40 REQ chỉ khai nền tảng **Web** nên **Platform Coverage = Req Coverage** |
| Vùng chưa cấp prefix (Setup · Calendar · Media · Cổng khách hàng) | Ngoài phạm vi đợt khảo sát 14-08-2026 |

---

## Tổng quan Coverage

| Metric | Giá trị | Ghi chú |
|---|---|---|
| **Requirement Coverage** | **40/40 (100.0%)** | 40 REQ trong phạm vi đều có ≥1 TC. 4 REQ ngoài phạm vi (`27`, `34`, `35`, `40`) **không tính** vào mẫu số |
| **Platform Coverage** | **40/40 (100.0%)** | 40 cặp (REQ × Web); không REQ nào khai Android/iOS/API |
| **Automation Coverage (TC)** | **18/51 (35.3%)** | 18 TC có script. Loại 3 TC cột `Automation = No` (026, 044, 051) khỏi mẫu số → 18/48 (37.5%) |
| **Automation Coverage (REQ)** | ✅ Full 14 · 🟠 một phần 6 · 🟡 chỉ thủ công 20 | trên 40 REQ trong phạm vi — REQ "Full" = **mọi** TC của REQ đã có script |
| **Orphan Tests** | **1** | `CRM_DASH_TC_001` — module `DASH` chưa khảo sát |
| TC `@Deprecated` | 0 | Không có TC bị gỡ |
| TC trỏ vào REQ ngoài phạm vi / REQ không tồn tại | 0 / 0 | Đã kiểm — sạch |
| Lệch giữa cột `REQ ID` của TC và Bảng Đối Soát Coverage ở index | 0 | Hai nguồn khớp 40/40 REQ |

---

## Ma trận chi tiết

> Ký hiệu cột Trạng thái: ✅ Full (mọi TC đã có script) · 🟠 Một phần · 🟡 Manual only (có TC, chưa có script) · 🔴 NOT COVERED (chưa có TC) · ⛔ Ngoài phạm vi (PO 18-08-2026). 🐞 = TC của REQ này **sẽ FAIL** vì hệ thống lỗi (kết quả đúng, đã/đang mở bug). Ngoặc `(n)` sau tên spec = số TC của REQ do file đó phủ.

| REQ ID | Mô tả ngắn | TC IDs | Automation | Trạng thái |
|---|---|---|---|---|
| REQ-LOGIN-01 | Truy cập trang đăng nhập | TC_001 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-02 | Thành phần biểu mẫu đăng nhập | TC_002, TC_038, TC_042, TC_043, TC_044, TC_048, TC_049, TC_050 | login-page.spec.ts (1) — 1/8 TC | 🟠 Một phần |
| REQ-LOGIN-03 | Tự động đặt con trỏ vào ô Email | TC_002 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-04 | Logo dẫn về trang chủ | TC_004 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-05 | Không có CAPTCHA | TC_003 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-36 | Không có đăng nhập mạng xã hội | TC_003 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-37 | Trang đăng nhập không nạp tệp JavaScript nào | TC_003 | login-page.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-06 | Đăng nhập bằng thông tin hợp lệ | TC_005, TC_006, TC_010, TC_041, TC_050 | login.spec.ts (3) — 3/5 TC | 🟠 Một phần |
| REQ-LOGIN-07 | Email không phân biệt hoa thường | TC_007 | login.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-38 | Email bỏ qua khoảng trắng thừa đầu/cuối | TC_007 | login.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-08 | Ghi nhớ đăng nhập sinh cookie `autologin` | TC_008 | login.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-09 | Không tích Ghi nhớ thì không phát hành cookie `autologin` | TC_009 | login.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-10 | Bỏ trống cả hai trường | TC_011, TC_043 | login-validation.spec.ts (1) — 1/2 TC | 🟠 Một phần |
| REQ-LOGIN-11 | Bỏ trống riêng Email | TC_011 | login-validation.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-12 | Bỏ trống riêng Mật khẩu | TC_011 | login-validation.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-13 | Chặn email sai định dạng ngay tại trình duyệt | TC_012, TC_045, TC_046 | login-validation.spec.ts (1) — 1/3 TC | 🟠 Một phần |
| REQ-LOGIN-14 | Thông báo khi sai thông tin đăng nhập | TC_013, TC_014, TC_017, TC_018, TC_040, TC_045, TC_047, TC_050 | login-validation.spec.ts (4) — 4/8 TC | 🟠 Một phần |
| REQ-LOGIN-15 | Thông báo lỗi không tiết lộ email nào có thật | TC_013, TC_019 | login-validation.spec.ts (1) — 1/2 TC | 🟠 Một phần |
| REQ-LOGIN-41 | Không khoá tài khoản sau nhiều lần đăng nhập sai | TC_015 | login-validation.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-16 🐞 | Máy chủ phải giữ lại email đã nhập sau khi đăng nhập thất bại | TC_016 | login-validation.spec.ts (1) — 1/1 TC | ✅ Full |
| REQ-LOGIN-17 | Chặn URL nội bộ khi chưa đăng nhập | TC_021 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-18 | Không ghi nhớ URL đích sau khi chuyển hướng | TC_022 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-19 | Đã đăng nhập thì không vào lại trang đăng nhập | TC_023 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-20 | Đã đăng nhập thì không vào trang Quên mật khẩu | TC_023 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-43 | Tài khoản khách hàng không đăng nhập được vào khu quản trị | TC_019, TC_020 | — (0/2 TC) | 🟡 Manual only |
| REQ-LOGIN-42 | Phiên đăng nhập hết hạn sau 1 giờ | TC_026, TC_051 | — (0/2 TC) | 🟡 Manual only |
| REQ-LOGIN-21 | Biểu mẫu đăng nhập mang mã chống CSRF | TC_024 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-22 | Từ chối yêu cầu có mã CSRF sai | TC_025 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-44 🐞 | Ép truy cập qua HTTPS | TC_039 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-23 | Truy cập trang Quên mật khẩu | TC_027 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-24 | Trang Quên mật khẩu không có lối quay lại đăng nhập | TC_027 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-25 🐞 | Gửi biểu mẫu Quên mật khẩu khi bỏ trống email | TC_028 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-26 | Email không tồn tại trong hệ thống | TC_029, TC_030 | — (0/2 TC) | 🟡 Manual only |
| REQ-LOGIN-27 | Email tồn tại thì gửi liên kết đặt lại mật khẩu | — | — | ⛔ Ngoài phạm vi |
| REQ-LOGIN-28 | Liên kết đặt lại mật khẩu sai/hết hạn | TC_031 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-29 | Mỗi viewport có một lối đăng xuất dùng được | TC_032, TC_033 | — (0/2 TC) | 🟡 Manual only |
| REQ-LOGIN-30 | Cảnh báo khi còn bộ đếm giờ đang chạy | TC_034 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-31 | Đăng xuất ngay khi không có bộ đếm giờ | TC_035 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-32 | Kết thúc phiên và về trang đăng nhập | TC_036 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-33 | URL nội bộ bị chặn lại sau khi đăng xuất | TC_036 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-34 | Cookie `autologin` không bị xoá khỏi trình duyệt khi đăng xuất | — | — | ⛔ Ngoài phạm vi |
| REQ-LOGIN-35 | Cookie `autologin` đọc được bằng JavaScript | — | — | ⛔ Ngoài phạm vi |
| REQ-LOGIN-39 | Cookie `autologin` không tự đăng nhập lại sau khi đăng xuất chủ động | TC_037 | — (0/1 TC) | 🟡 Manual only |
| REQ-LOGIN-40 | Cookie `autologin` khi phiên hết hạn tự nhiên | — | — | ⛔ Ngoài phạm vi |

---

## 🔴 Requirements chưa được cover

**Không có.** 40/40 REQ trong phạm vi có ≥1 TC.

### ⛔ 4 REQ ngoài phạm vi — cố ý không có TC

| REQ ID | Lý do | Căn cứ |
|---|---|---|
| REQ-LOGIN-27 | Không kiểm chứng luồng gửi mail đặt lại với email thật | `AMB-LOGIN-04` ⏭️ |
| REQ-LOGIN-34 | Cookie `autologin` không bị xoá khi đăng xuất — chỉ ghi nhận hiện trạng | `AMB-LOGIN-06` ⏭️ |
| REQ-LOGIN-35 | Cookie `autologin` thiếu `HttpOnly` — chỉ ghi nhận hiện trạng | `AMB-LOGIN-07` ⏭️ |
| REQ-LOGIN-40 | Ghi nhớ đăng nhập khi phiên hết hạn — PO xác nhận không hoạt động | `AMB-LOGIN-15` ⏭️ |

---

## 🟡 TC chưa automate — 33/51 TC (xếp theo Priority, rồi theo mã)

| TC ID | Priority | REQ | Automation (khả năng) | Ghi chú |
|---|---|---|---|---|
| TC_021 | Critical | 17 | Yes | thuộc bộ Smoke |
| TC_025 | Critical | 22 | Yes | — |
| TC_032 | Critical | 29 | Yes | thuộc bộ Smoke |
| TC_036 | Critical | 32, 33 | Yes | thuộc bộ Smoke |
| TC_019 | High | 43, 15 | Yes | — |
| TC_020 | High | 43 | Yes | — |
| TC_024 | High | 21 | Partial | cột Automation = Partial |
| TC_026 | High | 42 | No | cột Automation = No — không làm automation; QA tự chạy (`@PersonalOnly`) |
| TC_027 | High | 23, 24 | Yes | — |
| TC_028 | High | 25 | Yes | 🐞 `@KnownBug` — script phải phơi bug, không hạ assertion |
| TC_029 | High | 26 | Yes | — |
| TC_035 | High | 31 | Yes | thuộc bộ Smoke |
| TC_037 | High | 39 | Partial | cột Automation = Partial |
| TC_039 | High | 44 | Yes | 🐞 `@KnownBug` — script phải phơi bug, không hạ assertion |
| TC_051 | High | 42 | No | cột Automation = No — không làm automation; QA tự chạy (`@PersonalOnly`) |
| TC_022 | Medium | 18 | Yes | — |
| TC_023 | Medium | 19, 20 | Yes | — |
| TC_030 | Medium | 26 | Yes | — |
| TC_031 | Medium | 28 | Yes | — |
| TC_033 | Medium | 29 | Yes | — |
| TC_034 | Medium | 30 | Yes | — |
| TC_038 | Medium | 02 | Yes | — |
| TC_040 | Medium | 14 | Partial | cột Automation = Partial |
| TC_042 | Medium | 02 | Yes | — |
| TC_043 | Medium | 02, 10 | Yes | — |
| TC_045 | Medium | 13, 14 | Yes | — |
| TC_046 | Medium | 13 | Yes | — |
| TC_047 | Medium | 14 | Yes | — |
| TC_049 | Medium | 02 | Yes | — |
| TC_050 | Medium | 02, 06, 14 | Yes | — |
| TC_041 | Low | 06 | Partial | cột Automation = Partial |
| TC_044 | Low | 02 | No | cột Automation = No — không làm automation |
| TC_048 | Low | 02 | Yes | — |

> Lý do từng TC "Partial" và thứ tự đề xuất đã có sẵn ở [automation_review_web_20260919.md](review/automation_review_web_20260919.md) — RTM này không chấm lại.

---

## ⚪ Orphan tests (không map về REQ nào)

| Test | File | Đề xuất |
|---|---|---|
| `CRM_DASH_TC_001` — Điều hướng Dashboard → Khách hàng | `src/tests/dashboard/dashboard.spec.ts` | Không có REQ/TC thủ công vì module `DASH` chưa khảo sát. Chạy `/generate-requirements-from-website Dashboard` rồi `/generate-testcases-from-requirements` để có REQ/TC neo vào; **chưa xoá** |

---

## ⚠️ Mapping suy luận — cần người xác nhận

**Không có.** Mọi liên kết đều dựa trên ID (cột `REQ ID` của TC · `testId` trong script).

### Lưu ý khi đọc (không phải mapping suy luận)

| Mục | Chi tiết |
|---|---|
| TC có nhiều biến thể | `TC_007` (a–d) · `TC_011` (a–d) · `TC_012` (a–e) · `TC_015` (a–b) · `TC_017` (a–b): script khai đủ biến thể như TC → tính là automate **đủ** |
| `CRM_LOGIN_TC_014` | Có script nhưng **tự skip** khi `.env` thiếu `TC014_EMAIL` / `TC014_PASSWORD` → REQ-LOGIN-14 vẫn tính 🟠 vì còn 5 TC khác chưa có script, nhưng riêng TC_014 chỉ chạy thật khi đủ hai biến |
| `CRM_LOGIN_TC_016` | Script có và **cố tình FAIL** (`@KnownBug` — REQ-LOGIN-16, `AMB-LOGIN-10`). "Có script" ≠ "PASS" |
| `CRM_LOGIN_TC_028`, `CRM_LOGIN_TC_039` | Cũng `@KnownBug` (REQ-LOGIN-25, REQ-LOGIN-44) nhưng **chưa có script** — khi automate phải để FAIL phơi bug |
| `CRM_LOGIN_TC_003` | Một script phủ 3 REQ (`05`, `36`, `37`) — quan hệ n-n, không phải thiếu sót |
| `TC_026`, `TC_051`, `TC_044` | `Automation = No` có chủ ý — không phải gap |

---

## Metrics tự kiểm (khớp số dòng ma trận)

| Phép đếm | Kết quả |
|---|---|
| ✅ Full + 🟠 Một phần + 🟡 Manual only + 🔴 + ⛔ | 14 + 6 + 20 + 0 + 4 = **44** = 44 REQ ✔ |
| TC có script + TC chưa có script | 18 + 33 = **51** TC ✔ |
| testId trong script | 18 `CRM_LOGIN_*` (đều có trong file TC) + 1 orphan = 19 |

---

## Đề xuất bước tiếp theo

1. **Automate TC ưu tiên cao còn thiếu** — các TC `Critical` ở bảng 🟡 trước (`/generate-automation-from-testcases` cho `docs/testcases/login/web/test_cases_login_web.md`).
2. **Khảo sát module còn ⬜** — `/generate-requirements-from-website <module>` (bắt đầu từ thứ tự recon đã chốt: `CONT` → `LEAD` → …).
3. **RTM cho `CUST`** — `/generate-traceability-matrix Customers`. `PRJ` cần sinh TC trước (`/generate-testcases-from-requirements`).
4. **Gắn REQ cho `CRM_DASH_TC_001`** hoặc quyết định giữ làm test mồ côi — chờ khảo sát `DASH`.

> 📊 **Xem trực quan:** mở `scripts/execution-viewer/bundle.html` rồi kéo thả `traceability_matrix.md` vào → tab **Độ phủ automation** (xuất được Excel). *Lưu ý: thư mục `scripts/` hiện không có trong repo này.*
