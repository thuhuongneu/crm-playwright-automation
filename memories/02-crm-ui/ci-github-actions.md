---
name: ci-github-actions
description: CI GitHub Actions của repo — workflow đã dựng lại 14-10-2026, quyết định loại TC cố tình FAIL, secrets, điều chưa kiểm
metadata:
  type: project
---

# CI GitHub Actions

## Tình trạng (14-10-2026)
- Sau tách repo ([[tach-repo]]) file CI từng mất ở cả hai nơi. **Đã dựng lại** ở `.github/workflows/crm-playwright.yml` (gốc repo này); README §8 đã sửa khớp.
- **Đã chạy thật trên GitHub, cả 2 job xanh** (14-10-2026, run 38540385826, commit `8a05fb2`). Repo **public**: `thuhuongneu/crm-playwright-automation`, nhánh `main`.
- Đã khai 6 secrets bằng `gh secret set` đọc từ `.env` (không in giá trị). `gh` cài bằng winget, đăng nhập tài khoản `thuhuongneu`.
- Lượt đầu (chưa có secrets) đỏ vì thiếu biến; lượt hai UI xanh, API đỏ 4 test do **SLA 2000 ms** (đo 2032 · 2072 · 3294 · 3411 ms — độ trễ mạng runner → server demo, nội dung phản hồi đúng).

## Thiết kế & lý do (sếp chốt 14-10-2026)
- **2 job độc lập:** `ui-crm` (push main · PR không-fork · dispatch) và `api-book` (chỉ push main · dispatch).
  - **Why:** suite API đăng ký rồi xoá tài khoản trên server demo dùng chung → không chạy ở PR, `concurrency: api-book` không cho chồng lượt. PR từ fork không có secrets → UI sẽ crash nên bỏ qua.
- **PM dùng secret** (`PM_EMAIL`/`PM_PASSWORD`), KHÔNG đổi `env.config.ts` sang `optional()`. Secrets: `BASE_URL` `TEST_USERNAME` `TEST_PASSWORD` `PM_EMAIL` `PM_PASSWORD` (UI) · `BOOK_API_BASE_URL` (API).
- **Loại TC cố tình FAIL khỏi CI** bằng biến `EXCLUDE_KNOWN_BUGS` + `--grep-invert` (không sửa file test, không hạ assertion):
  - theo tag `@knownbug|@pendingamb` (TC_016 UI; TC_062/075/080 API);
  - theo **tên** 2 TC chưa gắn tag: `CRM_LOGIN_TC_004` ("Bấm logo trên trang đăng nhập") và `BK_AUTH_TC_068-d` ("không gây lỗi máy chủ \(biến thể d").
  - Đo bằng `--list`: UI 31 → **29**, API 50 → **46**.
  - **How to apply:** bug nào sửa xong thì bỏ phần tương ứng khỏi biến. Nếu gắn tag `@knownbug` cho TC_004 / TC_068-d trong code thì bỏ phần theo tên đi.
- **Job API đặt `API_SLA_MS=5000`** (local vẫn 2000, mặc định của `api-env.ts`). **Why:** ngưỡng 2000 ms đo từ máy dev; runner GitHub chậm hơn. Chỉnh bằng biến môi trường, không hạ assertion. **How to apply:** thấy API đỏ vì "Thời gian phản hồi phải dưới" thì xem số đo trước — chậm do mạng thì nới `API_SLA_MS`, đừng sửa test.
- `WORKERS=2` (runner 2 vCPU), `HEADLESS=true`, UI `retries: 2` do `process.env.CI`. Upload `reports/` thành `test-reports-ui` / `test-reports-api`, `if: always()`, 14 ngày.

## Bẫy khi viết regex loại theo tên
- Pattern phải **bao trọn** ngữ cảnh: `biến thể d: chuỗi 10\.000` lỡ loại luôn test **login** cùng nhãn (biến thể d password) — không hỏng nhưng bị mất khỏi CI. Dùng `không gây lỗi máy chủ \(biến thể d` mới đúng 1 test.
- Truyền pattern có `|` và dấu cách vào shell phải **đặt trong dấu nháy** — thiếu nháy thì shell tách từ, chỉ nhận được đoạn đầu và loại sai.
- `--list` bị `rtk` lọc chỉ còn dòng tổng; muốn xem tên test dùng `--reporter=json` + `PLAYWRIGHT_JSON_OUTPUT_NAME`.

## Chưa kiểm / còn mở
- Server demo chịu được 2 worker headless từ IP runner và không chặn IP (đã đo 14-10). Mới chạy 1–2 lượt, chưa theo dõi độ ổn định lâu dài.
- GitHub cảnh báo Node.js 20 sắp bị loại cho `checkout`/`setup-node`/`upload-artifact` `@v4`; `ubuntu-latest` chuyển Ubuntu 26 từ 19-10-2026 — theo dõi nếu workflow bỗng lỗi.
- Artifact `reports/` chứa trace `retain-on-failure` có giá trị đã điền (email admin) — repo công khai thì cân nhắc ([[viec-dang-do]]).
- Allure không sinh trên CI (chỉ upload `allure-results`); xem local bằng `npm run report` (cần JRE 8+).

Liên quan: [[tach-repo]] · [[viec-dang-do]] · [[framework-playwright-ui]]
