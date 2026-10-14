# CRM Playwright Automation

Framework E2E automation cho **Perfex CRM** (`https://crm.anhtester.com`) — Playwright + TypeScript, Page Object Model, Allure report, chạy song song sẵn, có CI GitHub Actions.

---

## 1. Yêu cầu môi trường

| Cần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 18 (khuyến nghị 20) | Bắt buộc — chạy test và gọi Allure CLI |
| Java (JRE) | ≥ 8 (máy dev đang dùng JDK 11) | **Bắt buộc để sinh/mở report** — Allure 2 viết bằng Java. Chạy test thì không cần |

> Không phải cài Allure lên máy. CLI Allure 2 (`allure-commandline`) nằm trong `devDependencies` của project, chỉ cần máy có Java.

## 2. Cài đặt

```bash
npm install
npx playwright install chromium
```

Tạo file `.env` từ mẫu rồi điền tài khoản test:

```bash
cp .env.example .env
```

| Biến | Ý nghĩa |
|---|---|
| `BASE_URL` | `https://crm.anhtester.com` |
| `TEST_USERNAME` / `TEST_PASSWORD` | Tài khoản test — **không commit** (`.env` đã bị `.gitignore` chặn) |
| `HEADLESS` | `false` = mở browser thật (debug local) · `true` = headless (CI) |
| `WORKERS` | Số luồng song song — **nơi duy nhất chỉnh số luồng** |
| `TIMEOUT` | Timeout mỗi test (ms) |

## 3. Chạy test

```bash
npm test                 # chạy toàn bộ suite (headless/headed theo HEADLESS trong .env)
npm run test:headed      # ép mở browser thật, bất kể .env
npm run test:smoke       # chỉ nhóm @smoke
npm run typecheck        # kiểm tra kiểu TypeScript (Playwright KHÔNG tự type-check)
npx playwright test src/tests/auth/login.spec.ts   # chạy 1 file
```

### Đổi số luồng song song

Parallel **luôn bật**, mặc định **5 luồng**. Đổi ở **đúng một chỗ**:

```bash
# Cách 1 — sửa .env
WORKERS=2

# Cách 2 — chỉ cho lần chạy này
npx playwright test --workers=2
```

Trên CI, số luồng khai ở `env.WORKERS` trong `.github/workflows/crm-playwright.yml` ở gốc repo (runner GitHub 2 vCPU nên cân nhắc hạ xuống 2–3).

> 🚨 Test đỏ khi chạy song song là **test sai**, phải sửa test data / khử state dùng chung — **không** hạ `WORKERS=1` để giấu.

## 4. Mở report

```bash
npm run clean         # (khuyến nghị) xoá kết quả các lần chạy cũ
npm test              # chạy test
npm run report        # xoá report cũ → sinh lại từ kết quả mới → mở trình duyệt
```

> ⚠️ **Report cứ mở lại bản cũ?** `reports/allure-results` **cộng dồn** qua các lần chạy, nên report lẫn test cũ (số "Retries" tăng bất thường). Muốn report chỉ chứa lần chạy mới nhất: `npm run clean` **trước** khi `npm test`. `npm run report` đã tự xoá `reports/allure-report` cũ trước khi sinh, nhưng không xoá `allure-results`.
> Suite API tương tự: `npm run report:api` (kết quả ở `reports/api/`).
> Kiểm tra report đã mới chưa: xem giờ ghi của `reports/allure-report/widgets/summary.json`.

Không cần cài Allure lên máy — `allure-commandline` nằm trong `node_modules` (máy cần có Java).

| Tình huống | Cách xem |
|---|---|
| Máy có Node (thường gặp) | `npm run report` |
| Máy **không có Java** | `npm run report:single` → gửi file `reports/allure-report-single/index.html` (1 file, mở bằng trình duyệt bất kỳ) |
| Chỉ cần report của Playwright | `npx playwright show-report reports/html` |

Toàn bộ output nằm trong `reports/` (đã `.gitignore`):

```
reports/
├── allure-results/         # raw results
├── allure-report/          # HTML report Allure
├── allure-report-single/   # report gộp 1 file
├── html/                   # HTML report của Playwright
├── logs/                   # log thực thi (winston)
└── test-artifacts/         # video / trace khi fail
```

> 🔒 Ảnh và video trong `reports/` chụp hệ thống thật — **không commit, không gửi ra ngoài** khi chưa rà lại nội dung.

## 5. Cấu trúc project

```
crm-playwright-automation/
├── playwright.config.ts        # viewport 1920x1080, parallel, reporter, baseURL
├── .env.example                # mẫu biến môi trường
├── src/
│   ├── pages/                  # Page Object — locator + hành vi, KHÔNG chứa assertion
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   └── dashboard.page.ts
│   ├── fixtures/
│   │   └── base.fixture.ts     # inject page object + fixture đăng nhập sẵn + ảnh cuối test
│   ├── utils/
│   │   ├── env.config.ts       # đọc .env + danh sách route
│   │   ├── allure.ts           # khai metadata test (testId/severity/description)
│   │   ├── test-data.ts        # sinh data unique + traceable
│   │   └── logger.ts           # winston -> reports/logs/
│   └── tests/
│       ├── auth/               # login-page.spec.ts · login.spec.ts · login-validation.spec.ts
│       └── dashboard/          # dashboard.spec.ts
└── test-data/                  # data cho test data-driven
```

> File CI **không** nằm trong thư mục này — xem mục 8.

## 6. Quy ước viết test

| Mục | Quy ước |
|---|---|
| Tên file test | `<module>.spec.ts` — kebab-case |
| Page class | PascalCase + hậu tố `Page`, file `<ten>.page.ts` |
| Tên test | **Tiếng Việt**, mô tả hành vi (`Đăng nhập thành công với tài khoản admin hợp lệ`) |
| Metadata | Mỗi test gọi `allureMeta({ testId, description, severity })` ở dòng đầu. Tên hiển thị trong Allure tự thành `<testId> - <tên test>`; tên trong `test(...)` **không** ghi mã TC |
| Tag | Khai bằng `test('...', { tag: ['@smoke'] }, ...)` của Playwright — để `--grep @smoke` lọc được; `allure-playwright` tự map sang tag trong report. **Không** khai tag trong `allureMeta` |
| TC ID | `CRM_<MODULE>_TC_<3 số>` — khoá truy vết sang manual test case |
| Thân test | Bọc trong `test.step('Arrange: …')` / `'Act: …'` / `'Assert: …'` |
| Locator | Khai trong Page class, ưu tiên `getByRole` / `getByLabel`; CSS chỉ khi không còn lựa chọn semantic |
| Chờ đợi | Chỉ smart wait (`expect().toBeVisible()`…) — **cấm** `waitForTimeout` |
| Test data | Field unique sinh bằng `TestData` (timestamp + random), không hardcode |
| Assertion | Luôn kèm message Tiếng Việt giải thích kỳ vọng |

### Thêm một test mới

1. Thêm locator + hành vi vào Page class (hoặc tạo page mới kế thừa `BasePage`).
2. Đăng ký page vào `src/fixtures/base.fixture.ts` nếu muốn inject thẳng vào test.
3. Viết spec trong `src/tests/<module>/`, gọi `allureMeta` rồi chia 3 step Arrange/Act/Assert.

## 7. Test hiện có

| TC ID | Tên test | Nhóm |
|---|---|---|
| `CRM_LOGIN_TC_001` | Đăng nhập thành công với tài khoản admin hợp lệ | smoke |
| `CRM_LOGIN_TC_002` | Đăng nhập thất bại khi nhập sai mật khẩu | regression |
| `CRM_LOGIN_TC_003` | Đăng nhập thất bại khi email không tồn tại trong hệ thống | regression |
| `CRM_LOGIN_TC_004` | Không đăng nhập được khi bỏ trống email và mật khẩu | regression |
| `CRM_DASH_TC_001` | Điều hướng từ Dashboard sang trang Khách hàng | smoke |

## 8. CI/CD

Workflow: **`.github/workflows/crm-playwright.yml`** (gốc repo). Có 2 job độc lập:

| Job | Chạy khi | Nội dung |
|---|---|---|
| `ui-crm` | `push` vào `main` · `pull_request` (trừ PR từ fork) · `workflow_dispatch` | `npm ci` → `typecheck` → cài Chromium → chạy suite UI CRM |
| `api-book` | `push` vào `main` · `workflow_dispatch` (**không** chạy ở PR) | `npm ci` → chạy suite API Book |

Suite API **đăng ký rồi xoá tài khoản** trên server demo dùng chung nên không chạy ở PR, và hai lượt chạy không được chồng nhau (`concurrency: api-book`).

**GitHub Secrets cần khai** (Settings → Secrets and variables → Actions):

| Secret | Dùng cho |
|---|---|
| `BASE_URL` · `TEST_USERNAME` · `TEST_PASSWORD` · `PM_EMAIL` · `PM_PASSWORD` | Job `ui-crm` — thiếu **một** biến là cả suite crash |
| `BOOK_API_BASE_URL` | Job `api-book` |

`TC014_EMAIL` / `TC014_PASSWORD` là tuỳ chọn — không khai thì `CRM_LOGIN_TC_014` tự skip.

**TC cố tình FAIL bị loại khỏi CI** (app đang có bug, không hạ assertion để né): biến `EXCLUDE_KNOWN_BUGS` ở đầu file workflow loại theo tag `@knownbug` · `@pendingamb` và theo tên 2 TC chưa gắn tag — `CRM_LOGIN_TC_004` (bấm logo) và `BK_AUTH_TC_068-d` (name 10.000 ký tự). Khi bug được sửa thì bỏ phần tương ứng khỏi biến đó. Chạy tay cho khớp CI: `npx playwright test --grep-invert "<giá trị biến>"`.

Cấu hình CI: headless, `WORKERS=2` (runner 2 vCPU), suite UI tự `retries: 2` khi có `CI`. Toàn bộ `reports/` được upload thành artifact `test-reports-ui` / `test-reports-api` (giữ 14 ngày), kể cả khi test fail.

## 9. Giới hạn đã biết

- Hệ thống đích là **môi trường demo dùng chung** — dữ liệu có thể bị người khác thay đổi. Test hiện tại chỉ đọc và điều hướng, chưa tạo/sửa/xoá bản ghi. Khi thêm test có ghi dữ liệu, phải sinh data riêng bằng `TestData` và tự dọn ở cuối test.
- Trang login đặt ở `/admin/authentication`; sau khi đăng nhập hệ thống chuyển về `/admin/`.
- `CRM_LOGIN_TC_002` (sai mật khẩu) cố tình đăng nhập hỏng vào **chính tài khoản trong `.env`** — đúng bản chất ca kiểm thử, nên `test-data/login-invalid.json` để `email: null` và lấy từ `env.username` thay vì chép email ra file commit được. Nếu sau này hệ thống bật khoá tài khoản sau N lần sai, TC này sẽ làm đỏ các test khác chạy song song — khi đó phải cấp một tài khoản riêng chỉ dùng cho ca sai mật khẩu.
- `CRM_LOGIN_TC_004`: bấm Login khi form trống thì hệ thống **không hiển thị thông báo nào**, chỉ đứng yên. Test đang khẳng định đúng hành vi thực tế này, không phải khẳng định "có báo lỗi".
- Link trên sidebar dùng icon Font Awesome — glyph của icon cộng vào accessible name, nên `menuItem()` cố ý **không** dùng `exact: true`.

---

## 10. Suite API Book — thư mục `api/` (tách riêng khỏi UI CRM)

Suite REST API cho **AnhTester Book API** (`https://book.anhtester.com`) — hệ thống **khác** Perfex CRM, nên code, config và report đều tách riêng. Chạy API **không** cần tài khoản CRM; chạy UI **không** đụng gì tới `api/`.

| | UI CRM | API Book |
|---|---|---|
| Config | `playwright.config.ts` | `playwright.api.config.ts` |
| Code | `src/` | `api/` |
| Report | `reports/allure-results` … | `reports/api/allure-results` … |
| Lệnh | `npm test` | `npm run test:api` · `npm run test:api:smoke` · `npm run report:api` |

Biến `.env`: `BOOK_API_BASE_URL` (bắt buộc) · `API_SLA_MS` (mặc định 2000).

```
api/
├── clients/      base.client.ts (ghi request/response) · auth.client.ts · user.client.ts · api-result.ts
├── models/       auth.model.ts (DTO) · auth.schema.ts (JSON Schema chép từ spec)
├── fixtures/     api.fixture.ts — context riêng mỗi test, userA/userB, đính request_response đã che
├── setup/        global-setup.ts (tạo userA · userB) · global-teardown.ts (dọn mọi tài khoản đã ghi sổ)
├── support/      api-assertions.ts · mask.ts · data-ledger.ts · account-cleanup.ts · api-env.ts · api-logger.ts
├── test-data/    auth.data.ts — email theo mốc T + độ lệch của TC
└── tests/auth/   register.api.spec.ts (TC_059 → 068) · login.api.spec.ts (TC_069 → 081 · 106 · 107)
```

**Dữ liệu test:** mọi tài khoản do suite tự tạo (`auto_auth_<T+xx>_…@auto.test`, `T` = mốc bắt đầu lượt chạy) và được ghi sổ ở `reports/api/data-ledger/<T>/`. Teardown cho **chính** tài khoản đó tự xoá (đăng nhập → `DELETE /api/user/{id}` bằng token của nó → đăng nhập lại phải 404), rồi ghi số tạo / dọn / còn sót vào `reports/api/data-cleanup-<T>.md`. 🚫 Không bao giờ ghi/xoá tài khoản không do suite tạo. Không retry (`retries: 0`) — chạy lại một test đăng ký sẽ trùng email.

**TC đang phơi bug** (dự kiến FAIL, KHÔNG hạ assertion): `TC_062` · `TC_075` (`@pendingamb`, F-19) · `TC_080` (`@knownbug`, F-03) · `TC_068-d`. Muốn lượt chạy xanh cho CI: `npx playwright test -c playwright.api.config.ts --grep-invert "@knownbug|@pendingamb"` — nhưng `TC_068-d` vẫn đỏ cho tới khi bug được sửa.
