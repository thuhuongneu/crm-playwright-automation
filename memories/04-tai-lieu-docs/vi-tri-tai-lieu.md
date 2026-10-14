---
name: vi-tri-tai-lieu
description: docs/ (requirements, testcases, bugs, executions…) đã có trong repo này; đường dẫn, prefix, mã kế tiếp của CRM và Book
metadata:
  type: reference
---

# Vị trí tài liệu `docs/`

## `docs/` đã nằm trong repo này
- Kiểm lại cuối ngày 05-10-2026: `docs/` có sẵn ở gốc repo này (requirements, testcases, bugs, executions…) — workflow đọc `docs/...` thấy file bình thường. Bản ghi cũ "chỉ có ở repo cha" đã lỗi thời.
- ⚠️ Cùng lần kiểm: thư mục này **không phải git repo** (`git status` báo `not a git repository`) → quy tắc "ghi mốc `git log -1` vào Nhật ký trước khi sửa tài liệu" chưa áp được; hỏi sếp trước khi sửa file trong `docs/`.

## Perfex CRM (hệ thống mặc định)
| Loại | Đường dẫn (dưới `docs/`) |
|---|---|
| Danh mục REQ — **đọc đầu tiên** | `requirements/README.md` (23 module, prefix đã chiếm, năng lực QA) |
| Bản đồ hệ thống | `requirements/_discovery/system_map.md` |
| REQ LOGIN | `requirements/login/REQUIREMENTS_LOGIN_SUMMARY.md` — `REQ-LOGIN-01→44`, kế tiếp `45`, AMB treo 0 |
| REQ CUST | `requirements/customers/REQUIREMENTS_CUSTOMERS_SUMMARY.md` — `01→84`, kế tiếp `85` |
| REQ PRJ | `requirements/projects/REQUIREMENTS_PROJECTS_SUMMARY.md` — `01→104`, **6 AMB 🔴 treo** |
| Danh mục TC | `testcases/README.md` |
| TC LOGIN | `testcases/login/TEST_CASES_LOGIN_SUMMARY.md` + `testcases/login/web/test_cases_login_web.md` — `CRM_LOGIN_TC_001→051`, kế tiếp `052`, độ hạt GỘP |
| TC CUST | `testcases/customers/…` — `CRM_CUST_TC_001→129`, kế tiếp `130`, 5 part |
| RTM LOGIN | `testcases/login/traceability_matrix.md` (14-10-2026) — REQ 40/40 có TC · TC có script 18/51 (`001`→`018`) · orphan `CRM_DASH_TC_001`. Đặt cạnh index TC vì chưa có quy ước vị trí RTM; chưa xuất CSV (sếp chưa yêu cầu). RTM `CUST` chưa làm, `PRJ` chưa có TC |
| Review automation LOGIN | `testcases/login/review/automation_review_web_20260919.md` |
| Execution | `executions/login/web/run_1787215085/`, `run_1789759574/` · `executions/test_progress_release_1.0_20260917.md` |
| Bug | `bugs/README.md` + `bugs/login/web/BUG_login_*` (TC004, TC016, TC018, TC028, TC029, TC039) |
| Test plan | `test-plans/test_plan_release_1.0.md` (+ `.input.yaml`, `.pdf`) |
| User guide | `user-guides/login/user_guide_login.md` |
- Quy ước: TC `CRM_<MODULE>_TC_<3 số>` · REQ `REQ-<MODULE>-nn` · `AMB-LOGIN-xx` / `RISK-LOGIN-xx`. Quyết định PO: `PO-2026-08-18`, `PO-2026-08-18-B`, `PO-2026-09-19`.
- `LOGIN` có 4 REQ ngoài phạm vi theo PO 18-08-2026: `27`, `34`, `35`, `40`.
- Module `DASH` mới cấp prefix, **chưa recon** (`CRM_DASH_TC_001` trong code là test mồ côi).

## Book (namespace `_book-api/`)
| Loại | Đường dẫn |
|---|---|
| Danh mục REQ Book | `requirements/_book-api/README.md` |
| Bản đồ API / app | `requirements/_book-api/_discovery/api_map.md` (F-xx ở mục 3) · `system_map.md` · `sources/openapi_2026-09-19.json` |
| REQ AUTH | `requirements/_book-api/auth/REQUIREMENTS_AUTH_SUMMARY.md` + `api/` · `mobile/` · `web/` · `impact/impact_DEMO-AMB-2509.md` |
| TC AUTH | `testcases/_book-api/auth/TEST_CASES_AUTH_SUMMARY.md` + `api|mobile|web/parts/part_NN_*.md` |
| TC API Part 01 (đã automate) | `testcases/_book-api/auth/api/parts/part_01_api_dang_ky_dang_nhap.md` |
| Review automation | `testcases/_book-api/auth/review/automation_review_web_20261001.md` · `automation_review_mobile_20261001.md` |
| Báo cáo automation API Part 01 | `task.md` ở gốc repo cha |
- Quy ước mã Book: [[quy-uoc-ma-va-du-lieu]].

Liên quan: [[tach-repo]] · [[he-thong-perfex-crm]]
