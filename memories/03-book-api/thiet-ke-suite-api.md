---
name: thiet-ke-suite-api
description: Thiết kế suite api/ cho Book — mốc T, ledger dọn dữ liệu, lớp an toàn teardown, che dữ liệu, retries 0, SLA, kết quả 46 PASS / 4 FAIL
metadata:
  type: project
---

# Suite `api/` (Book) — thiết kế & lý do

> Cấu trúc thư mục và lệnh chạy có ở README §10. File này ghi **lý do** và **những thứ không được nới**.

## Vị trí & cách ly
- Sếp yêu cầu: *"Ghi vào repo crm-playwright-automation, tách riêng thư mục"* → `api/` + `playwright.api.config.ts`, report ở `reports/api/…`.
- `api/support/api-env.ts` có env riêng, **không** dùng `src/utils/env.config.ts` → chạy API không đòi tài khoản CRM. Biến: `BOOK_API_BASE_URL` (bắt buộc), `API_SLA_MS` (mặc định 2000), dùng chung `WORKERS`.
- Ngoại lệ duy nhất: spec import `allureMeta` / `Severity` từ `src/utils/allure`.
- Nguồn: 0b11ea16 (01-10).

## Mốc T của lượt chạy
- `playwright.api.config.ts` đặt `process.env.BOOK_RUN_T ??= now` ở process chính → mọi worker dùng chung T. `runTimestamp()` ném lỗi nếu chạy không qua config này.
- Email: `auto_auth_<T+offset>_<suffix>@auto.test` — mốc mẫu `17901504xx` trong TC được thay bằng `T+xx` ("Quy tắc số định danh" của TC). Bảng offset: [[quy-uoc-ma-va-du-lieu]].

## Dọn dữ liệu bằng ledger
- Fixture `registerTracked` chỉ ghi sổ khi register trả **201** và `email` là chuỗi.
- Mỗi process một file `reports/api/data-ledger/<T>/ledger-<pid>.jsonl`, chỉ append → không race. Chỉ chứa email + nguồn, **không** mật khẩu/token.
- `global-setup` tạo userA (offset 30), userB (31). `global-teardown` dọn tài khoản trong test trước, **userA/userB sau cùng**. Mỗi tài khoản tự xoá chính nó: login → `GET /api/me` → `DELETE /api/user/{id}` bằng **token của chính nó** → login lại phải 404. Mật khẩu thử lần lượt theo `api/test-data/auth.data.ts`.
- Kết quả ghi `reports/api/data-cleanup-<T>.md`. Mỗi lượt: tạo 14 / dọn 14 / sót 0.
- Repo Appium `appium-android-app-automation` (repo cha) **mô phỏng** cơ chế này → sửa cleanup ở đây thì nhớ bên kia.

## 🔒 Lớp an toàn teardown — KHÔNG được nới (thêm sau code review 01-10)
1. Chỉ xoá khi `/api/me` trả **đúng** email cần dọn (so chữ thường). Lệch → không xoá, ghi "còn sót".
2. `try/catch` **từng** tài khoản — một lỗi mạng không làm sót userA/userB.
- **Why:** server demo công khai, mật khẩu test đã công khai trong tài liệu khoá học. Nếu server so khớp lỏng / dính SQLi, teardown có thể xoá nhầm tài khoản người khác.

## Che dữ liệu trong report (`api/support/mask.ts`)
- Request: che key khớp `password|token`. Response: **chỉ** che `token` — giữ message lỗi của `fields.password` làm bằng chứng.
- Header `Authorization` không có scheme → che toàn bộ. Set-Cookie chỉ che value, **giữ thuộc tính** (bằng chứng cho TC cookie).
- Message assertion **không** `JSON.stringify(body)` / in `accessToken` → dùng `'accessToken' in body` hoặc chỉ in `msg`.
- Mỗi test đính `request_response` đã che ở cuối (thay screenshot).
- Bẫy: grep `eyJ` trong `reports/api/html/index.html` ra **false positive** (asset base64) → soát leak trong `allure-results`.

## Các quyết định khác
| Quyết định | Vì sao |
|---|---|
| `retries: 0` kể cả CI | Chạy lại test đăng ký trùng email; TC_075 chỉ được gửi 1 request/lượt |
| `APIRequestContext` riêng mỗi test (fixture `apiContext`) | Cookie jar không rò. TC_071 phải gọi `me(tokenA)` **trước** login userB — nếu không request mang cả Bearer A lẫn cookie B, không chứng minh được hành vi Bearer |
| `expectWithinSla` 2 s hard assert mọi test | Workflow yêu cầu. Reviewer nói chặt hơn TC (TC chỉ ghi ≤10 s ở TC_068) → **giữ**, muốn nới chỉnh `API_SLA_MS` |
| Ajv `strict:false, allErrors` | Schema chép tay từ spec inline |
| `expectNoSensitiveData` | Body không trả lại mật khẩu, không stack trace / tên bảng / SQL |
| TC_061 mỗi biến thể email riêng `…_name_a/_name_b` | Chạy song song không giẫm bước "gửi lại → 201" |
| TC_064 chỉ kiểm status | Không kiểm được "không tạo tài khoản" — login email sai định dạng luôn 422 |
- Nguồn: 0b11ea16 (01-10).

## Kết quả ổn định (01-10-2026, Part 01)
- 25 TC → **50 test**. **46 PASS + 4 FAIL phơi bug**, giống hệt qua 2 lượt liên tiếp:
  - TC_062, TC_075 — `@pendingamb` (F-19)
  - TC_080 — `@knownbug` (F-03)
  - TC_068-d — bug mới, **chưa có tag**
- Lượt xanh cho CI: `--grep-invert "@knownbug|@pendingamb"` — TC_068-d vẫn đỏ.
- Biến thể "chưa gọi thật" nay đã chạy được: TC_060-c (multipart), TC_070-c (form).
- Báo cáo chi tiết từng TC: `task.md` ở gốc repo cha.

Liên quan: [[he-thong-va-phat-hien]] · [[quy-uoc-ma-va-du-lieu]] · [[viec-dang-do]]
