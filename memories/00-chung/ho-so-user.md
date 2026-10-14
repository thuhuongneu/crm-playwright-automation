---
name: ho-so-user
description: Sếp là ai, cách xưng hô, kiểu câu hỏi hay gặp, mục tiêu dùng automation
metadata:
  type: user
---

# Hồ sơ user

## Xưng hô và ngôn ngữ
- Viết **tiếng Việt**. Gọi user là **"sếp"**, xưng **"em"**. Báo cáo ngắn gọn, lịch sự.
- **Why:** quy định trong `~/.claude/CLAUDE.md` (honorific theo ngôn ngữ) và `CLAUDE.md` §1 của repo. Cả 18 phiên cũ đều dùng cách này.
- **How to apply:** mọi câu trả lời, câu hỏi xác nhận và báo lỗi.

## Trình độ và kiểu câu hỏi hay gặp
- QA đang học / làm automation (khoá *AI Testing Automation Course*). Hay hỏi: "lệnh này để làm gì", "chạy lệnh gì trên VS Code", "máy mới clone về chạy gì", "xem report Allure thế nào", "locator này nằm file nào dòng nào".
- **How to apply:**
  - Đưa lệnh chạy được ngay, **ghi rõ shell** (terminal VS Code của sếp là **PowerShell 5.1**) và giải thích mục đích từng bước.
  - Chỉ vị trí bằng đường dẫn file + số dòng.
  - Hướng dẫn report: `npm run clean` → chạy test → `npm run report`. Nói rõ report đang xem có phải bản cũ không.
- Nguồn: 591c7695 (26-08), 59955a6a (11-09), 524a5d71 (14-09), 6fc61c22 (28-09).

## Mẫu prompt sếp hay dùng
- Khung **ROLE / TASK / CONTEXT / INSTRUCTIONS / OUTPUT FORMAT**. Bảng TC thường có dạng `| ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |`.
- **How to apply:** giữ đúng format output sếp đưa. Liệt kê riêng các giả định để sếp xác nhận.
- Nguồn: 2cf5afa7 (08-09).

## Mục tiêu automation
- Dùng cho **regression**: thêm màn mới, đẩy lên git là phải tự chạy lại login và các màn khác. Lâu dài muốn chạy **nightly lúc 2h sáng**, nhưng còn lo máy tắt khi về.
- **How to apply:** khi tư vấn CI, luôn tính trigger tự động, và nói thẳng các ràng buộc hạ tầng (runner, máy bật, secrets).
- Nguồn: fd283ca9 (15-09).

## Plugin
- Hook nhắc cài `claude-mem`, `superpowers`, `rtk`. Phiên 0ebb7ee7 (01-10) sếp đã trả lời **"có"** và nhận lệnh cài. Lệnh `/plugin` chỉ chạy trong terminal `claude`, không chạy trong tab Code.
- **How to apply:** chỉ nhắc **một dòng**, không hỏi lại nhiều lần trong cùng phiên.

Liên quan: [[phan-hoi-cach-lam-viec]] · [[moi-truong-may-va-cong-cu]]
