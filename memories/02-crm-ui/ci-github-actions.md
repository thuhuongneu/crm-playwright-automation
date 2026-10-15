---
name: ci-github-actions
description: CI GitHub Actions của repo — workflow, loại TC cố tình FAIL, secrets, Allure 2 + Pages + Google Chat, lịch GitHub trễ nặng → bỏ, dùng cron-job.org
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
- `WORKERS=2` (runner 2 vCPU), `HEADLESS=true`, UI `retries: 2` do `process.env.CI`. Upload `reports/` thành `test-reports-ui` / `test-reports-api` (+ `allure-report-*`, xem mục Report Allure 2), `if: always()`, 14 ngày.

## Report Allure 2 trên CI (14-10-2026, commit `59d40ff`, run 38541786078 xanh)
- Mỗi job có bước `npx allure generate ... --clean --single-file` → upload artifact riêng **`allure-report-ui`** / **`allure-report-api`** (1 file `index.html`, mở thẳng bằng trình duyệt). Bước có `continue-on-error: true` để lỗi sinh report không che kết quả test. Runner `ubuntu-latest` có sẵn Java, không cần `setup-java`.
- **Vì sao có:** sếp mở `reports/html/index.html` trong artifact `test-reports-*` rồi tưởng là Allure 3 — thực ra đó là **Playwright HTML Report**; CI trước đó **không sinh Allure** (chỉ upload `allure-results` thô).
- **Dễ nhầm số 3:** `allure-playwright` / `allure-js-commons` `3.x` là **adapter ghi kết quả**, không phải report. CLI là `allure-commandline` **2.46.1** (Allure 2) — đúng quyết định "luôn dùng Allure 2" ([[phan-hoi-cach-lam-viec]]). Không cài gói `allure` (v3), không có `allurerc`.
- **How to apply:** khi sếp hỏi "xem report" → chỉ artifact `allure-report-*`, nhắc `reports/html/` là Playwright. Sửa workflow phải giữ CLI 2.x. Chưa kiểm bằng mắt giao diện file tải từ GitHub (mới xác nhận bước sinh + upload thành công).

## Pages + Google Chat (14-10-2026)
- **GitHub Pages** (đã bật bằng `gh api -X POST repos/<repo>/pages -f build_type=workflow`): job `publish-report` đưa Allure 2 lên `https://thuhuongneu.github.io/crm-playwright-automation/` (`/ui/`, `/api/`), chỉ từ `main`, ghi đè mỗi lượt. Pages gắn `Cache-Control: max-age=600` → sếp thấy report cũ thì **Ctrl+Shift+R**; nhìn trang chủ để biết report thuộc lượt nào. Repo public → report ai cũng xem được.
- **Thẻ Google Chat** space **Note**: job `notify-chat` chạy `.github/scripts/notify-chat.js` (Cards v2, có hai cột, nút Allure UI/API + Log lượt chạy); số test do `.github/scripts/summarize-allure.js` đếm (dedupe retry theo `historyId`). Gửi sau **mọi** lượt (pass/fail, trừ PR) — sếp chốt 14-10 (mặc định ban đầu tôi đề xuất chỉ gửi khi lịch/đỏ, sếp đổi). Secret `GCHAT_WEBHOOK_NOTE`, nạp từ `.env` bằng `gh secret set`. Giao diện chỉnh theo ảnh mẫu Slack của sếp; Google Chat không cho nền/cột y hệt.
- Webhook QC trong `~/.claude/settings.json` (`OPS_WEBHOOK_GCHAT_QC`) **không dùng** — gửi vào space khác.

## Lịch hằng ngày: bỏ `schedule:` của GitHub, dùng cron-job.org (15-10-2026)
- **Quyết định (sếp chốt 15-10):** **xoá `schedule:`** khỏi workflow; chạy hằng ngày bằng **cron-job.org** gọi `workflow_dispatch`. **Why:** lịch GitHub trễ nặng và khó đoán, sếp cần kết quả đúng 8h sáng.
- **Đo được:** cron `3 1 * * *` (08:03 giờ VN) chạy thật lúc **12:46 VN** = trễ ~**4h43m** (run 38688618302, sự kiện `schedule`, 4 job xanh, thẻ Chat đã gửi). Các mốc 16:35 · 16:50 · 17:40 (14-10) không thấy lượt nào trong khoảng chờ ngắn (≤ ~30 phút).
- **⚠️ Kết luận cũ của tôi SAI (đã sửa):** tôi từng ghi "GitHub không phát sự kiện schedule cho repo này / lỗi phía GitHub, cần Support". Thực tế là **trễ rất lâu, không phải không chạy**. Probe cron 5 phút chỉ chờ 20 phút nên không thấy lượt nào — **chờ quá ngắn mới kết luận sai**. Bài học: với `schedule:` của GitHub phải chờ **hàng giờ** (và qua nhiều mốc) trước khi kết luận; GitHub tài liệu hoá lịch có thể trễ/bị bỏ khi tải cao, nhất là đầu giờ tròn. Cũng vì đổi cron liên tục 4 lần trong 16 tiếng nên đã không phân biệt được lượt nào trễ lượt nào bị bỏ.
- **Đã loại trừ (cấu hình đúng):** file trên `main` · workflow `active` · Actions bật · không fork/archive/disable · commit gắn đúng tài khoản · GitHub status không có sự cố.
- **cron-job.org** (sếp tự tạo tài khoản + token): `POST /repos/thuhuongneu/crm-playwright-automation/actions/workflows/crm-playwright.yml/dispatches`, body `{"ref":"main"}`, job "CRM Playwright 8h sáng" = `0 8 * * *` múi giờ `Asia/Ho_Chi_Minh`. Máy sếp **không cần mở**. Thử 15-10 lúc 11:00: tự chạy, trễ ~19 giây, 4 job xanh. Thẻ Chat ghi "Kích hoạt: bấm tay" vì là `workflow_dispatch`.
- **Token:** fine-grained PAT **chỉ repo này**, quyền **Actions: Read and write**, **hết hạn 13-01-2027** → tạo mới + sửa header `Authorization` trên cron-job.org. Giá trị token KHÔNG ghi ở đâu trong repo.
- **How to apply:** kiểm lịch → `gh run list --repo thuhuongneu/crm-playwright-automation --limit 3` (tìm `workflow_dispatch` ~08:00). Đổi giờ chạy → sửa trên cron-job.org, KHÔNG thêm lại `schedule:`. Không cần ticket GitHub Support. Muốn lịch trong workflow quay lại thì chấp nhận trễ nhiều giờ.
- **Liên quan Bài 17 (khoá học):** bài phân vai — `schedule:` của GitHub **chạy suite**, task theo lịch của Claude chỉ **đọc kết quả/phân tích**, KHÔNG chạy suite thay CI. Nên không dùng task Claude để chạy test; hết Bài 17 thì dùng chỗ hẹn giờ AI cho phần phân tích. (Bài 17 giả định `schedule:` GitHub chạy — repo này lệch giả định đó vì trễ.)

## Bẫy khi viết regex loại theo tên
- Pattern phải **bao trọn** ngữ cảnh: `biến thể d: chuỗi 10\.000` lỡ loại luôn test **login** cùng nhãn (biến thể d password) — không hỏng nhưng bị mất khỏi CI. Dùng `không gây lỗi máy chủ \(biến thể d` mới đúng 1 test.
- Truyền pattern có `|` và dấu cách vào shell phải **đặt trong dấu nháy** — thiếu nháy thì shell tách từ, chỉ nhận được đoạn đầu và loại sai.
- `--list` bị `rtk` lọc chỉ còn dòng tổng; muốn xem tên test dùng `--reporter=json` + `PLAYWRIGHT_JSON_OUTPUT_NAME`.

## Chưa kiểm / còn mở
- Server demo chịu được 2 worker headless từ IP runner và không chặn IP (đã đo 14-10). Mới chạy 1–2 lượt, chưa theo dõi độ ổn định lâu dài.
- GitHub cảnh báo Node.js 20 sắp bị loại cho `checkout`/`setup-node`/`upload-artifact` `@v4`; `ubuntu-latest` chuyển Ubuntu 26 từ 19-10-2026 — theo dõi nếu workflow bỗng lỗi.
- Artifact `reports/` chứa trace `retain-on-failure` có giá trị đã điền (email admin) — repo công khai thì cân nhắc ([[viec-dang-do]]).
- Allure xem local bằng `npm run report` (cần JRE 8+).

Liên quan: [[tach-repo]] · [[viec-dang-do]] · [[framework-playwright-ui]]
