---
name: tach-repo
description: Repo được tách khỏi course-ai-test-automation ngày 05-10-2026 — cái gì đi theo, cái gì ở lại, hệ quả cần xử lý
metadata:
  type: project
---

# Lịch sử: tách repo khỏi `course-ai-test-automation`

## Sự kiện
- Ngày **05-10-2026** sếp tách `crm-playwright-automation/` khỏi repo cha `D:\AI_Testing_Automation_Course\course-ai-test-automation` thành thư mục / repo riêng `D:\AI_Testing_Automation_Course\crm-playwright-automation`.
- Trong repo cha, git status hiện các file `crm-playwright-automation/*` ở trạng thái **Deleted** (chưa commit) — tức đã chuyển đi.
- Thư mục mới **chưa phải git repo** (kiểm 05-10-2026).
- Mọi phiên làm việc cũ (26-08 → 02-10-2026) chạy ở repo cha; transcript nằm ở `~/.claude/projects/D--AI-Testing-Automation-Course-course-ai-test-automation/`. Bộ nhớ trong thư mục `memories/` này được gom từ đó.

## Đi theo sang repo này
- `src/`, `api/`, `test-data/`, config Playwright / Allure, `package.json`, `.env` / `.env.example`.
- `CLAUDE.md`, `.claude/` (rules, skills, commands, settings, `playwright-mcp-config.json`), `.mcp.json`.

## Ở lại repo cha (KHÔNG có ở đây)
| Thứ | Hệ quả |
|---|---|
| `docs/` toàn bộ | Workflow đọc/ghi `docs/` không thấy file → xem [[vi-tri-tai-lieu]] |
| `.github/workflows/crm-playwright.yml` | **Đã mất ở cả hai nơi** → dựng lại, xem [[ci-github-actions]] |
| `task.md` (báo cáo automation API Part 01) | Tham chiếu ở repo cha |
| `appium-android-app-automation/`, `jim-app-automation/` | Repo Appium khác — không thuộc repo này. Repo Appium Book mô phỏng cleanup của `api/` |
| `AI_FULL_FLOW_AUTOMATION.md`, `AI_FULL_FLOW_MANUAL.md` | Tài liệu quy trình khoá học |

## Việc cần làm do tách repo
- README §8 (CI) cần sửa theo vị trí mới.
- Nếu muốn repo này tự chứa: quyết định có đưa `docs/` (ít nhất `login`, `customers`, `_book-api`) sang đây không — **chờ sếp quyết**.

Liên quan: [[vi-tri-tai-lieu]] · [[ci-github-actions]] · [[viec-dang-do]]
