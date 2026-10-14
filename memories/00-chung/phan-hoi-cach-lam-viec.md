---
name: phan-hoi-cach-lam-viec
description: Các lần sếp sửa hoặc duyệt cách làm việc — áp cho mọi tác vụ trong repo
metadata:
  type: feedback
---

# Phản hồi về cách làm việc

> Mỗi mục là một lần sếp **sửa** hoặc **xác nhận** cách làm. Mục đánh dấu ⭐ là sếp đã nói thẳng nhiều lần.

## Git & phạm vi thay đổi
1. ⭐ **Không tự `git commit` / `push`.** Sếp chặn: *"ko được git commit gì"*.
   - **Why:** sếp tự review và tự quyết lúc commit. `CLAUDE.md` mới cấm `pull/checkout/merge/rebase/reset`, chưa ghi rõ phần commit. `.claude/settings.json` có deny "Commit to remote repositories".
   - **How to apply:** làm xong thì báo cáo và dừng. Cần commit thì nhờ sếp tự làm.
   - Nguồn: fd283ca9 (15-09), 0ebb7ee7 (01-10).
2. **Trước khi sửa file tài liệu (TC, index)** chạy `git status --short <file>`. Có thay đổi chưa commit thì **dừng**, nhờ sếp commit trước. Sạch thì ghi mốc `git log -1 --format=%h` vào Nhật ký.
   - Nguồn: 0ebb7ee7, 56c1f368 (01-10).
3. **Không tự sửa file dùng chung** (base class, config, suite xml, fixture) khi chưa được duyệt. Sếp từng chọn "Tạm dừng, bàn giao hướng dẫn trước" và "Không, giữ nguyên".
   - **How to apply:** hỏi trước. Chưa được duyệt thì chọn cách không đụng file đó và ghi rõ còn tồn đọng gì.
   - Nguồn: fd283ca9 (15-09).
4. **Làm thử nghiệm thì giữ nguyên code cũ, chỉ thêm file mới.** Sếp muốn xem kế hoạch từng bước, duyệt rồi mới code.
   - Nguồn: 306ca184 (02-10).

## Recon & bằng chứng
5. ⭐ **Không viết code theo "UI giả định".** Agent từng đoán flow, sinh 3 TC rồi ghi chú "sếp chỉnh lại nếu UI khác". Sếp bắt bỏ. Sau đó phải xoá các class đoán sai.
   - **Why:** đoán sai toàn bộ, tốn gấp đôi công.
   - **How to apply:** recon UI thật trước dòng code đầu tiên. Thiếu flow thì hỏi.
   - Nguồn: fd283ca9 (15-09).
6. ⭐ **Tách rõ "đã đo" và "suy luận".** Sếp hỏi thẳng: *"bạn có thực sự attach … hay đang suy luận?"*. Agent đã ghi một suy luận vào README như sự thật, kéo theo cả kiến trúc dựng sai.
   - **How to apply:** báo cáo ghi rõ cái nào đã đo, cái nào suy luận. Không ghi suy luận vào tài liệu như dữ kiện. Sai thì nhận ngay và sửa tài liệu.
   - Nguồn: 524a5d71 (14/15-09).
7. **Trước khi nói "file đã bị đổi / revert"** thì đọc lại lần nữa — từng có lần đọc lệch thời điểm.
   - Nguồn: 591c7695 (26-08).
8. **So sánh / benchmark phải công bằng**: cùng logic retry, cùng số vòng, môi trường sạch. Tách nhiễu môi trường khỏi lỗi thật.
   - Nguồn: 524a5d71, 234c09ae (15-09).

## Chạy test & báo cáo
9. ⭐ **Tự chạy test, không đẩy việc chạy sang sếp.** Sếp: *"bạn tự chạy đi, pass 2 lần thì báo lại cho mình"*.
   - **How to apply:** lặp chạy → sửa → chạy. Thiếu tool thì tìm cách có tool (xin phép khi cần).
   - Ngoại lệ: lệnh mở report Allure bị `rtk` chặn khi agent chạy → nhờ sếp tự chạy `npm run report` (xem [[moi-truong-may-va-cong-cu]]).
   - Nguồn: fd283ca9 (15-09), 6fc61c22 (28-09).
10. **Làm theo phạm vi sếp đặt**, kể cả khi lệch DoD. Ví dụ sếp nói *"chỉ cần chạy pass 1 lần là báo cáo"* thì bỏ yêu cầu 2 lần. Mục tiêu chỉ là dựng framework thì đừng chặn vì thiếu dữ liệu, đề xuất đổi phạm vi.
    - Nguồn: 6fc61c22 (28-09), 9d6bea79 (25-09), 707a6dce (01-10).
11. **Sếp không chịu được lượt chạy dài** (*"30 phút quá lâu ko được"*, *"đang chạy gì mà lâu thế?"*).
    - **How to apply:** ước lượng thời gian trước, thu hẹp phạm vi, dừng ngay ở FAIL đầu tiên khi đang dò lỗi. Báo tiến độ ngắn.
    - Nguồn: 306ca184 (02-10), 707a6dce (01-10).
12. **Không báo nền quá dày.** Sếp gõ "stop báo" rồi "stop". Chỉ báo ở mốc chính hoặc khi xong.
    - Nguồn: 524a5d71 (15-09).
13. **Đọc số Tests / Failures / Skipped thật** trong report trước khi nói PASS. Test bị Skipped do setup lỗi trông như "chạy mà không làm gì". Ảnh cuối test phải đúng màn kết quả (đóng popup chen ngang trước khi chụp). Bước setup không được hiện như một test case.
    - Nguồn: 524a5d71 (14-09).
14. **Không hạ assertion để né bug.** Test FAIL vì hệ thống sai thì giữ kỳ vọng, đánh dấu phơi bug (`@KnownBug`), đề xuất `/create-bug-report`.
    - Nguồn: 0b11ea16 (01-10), 6fc61c22 (28-09).
15. **Code review sau khi implement** — giao subagent review, sửa lỗi thật, giải thích lý do với điểm không sửa.
    - Nguồn: 0b11ea16, 707a6dce (01-10).

## Giao tiếp & hỏi đáp
16. **Sếp hỏi thì chỉ trả lời, không tự làm.** Ví dụ: *"chỉ hỏi trả lời thôi chưa làm gì nhé"*. Câu dạng "có phải…", "vì sao…" → trả lời, không sửa code.
    - Nguồn: 524a5d71 (14-09).
17. **Lời đề xuất phải cụ thể**: lệnh nào, file nào đổi, có đụng code không. Sếp từng hỏi ngược *"bạn cập nhật gì?"*.
    - Nguồn: 92579dfe (09-09).
18. **Câu hỏi kỹ thuật thuần thì tự chọn** phương án ổn định + hiệu quả nhất, kèm số đo làm căn cứ. Sếp: *"cách nào hay tối ưu hiệu quả và chạy ổn định nhất thì chọn"*.
    - Nguồn: 591c7695 (26-08).
19. **Xung đột dữ liệu / mã (như trùng TC ID)** → hỏi bằng câu hỏi có lựa chọn + nêu lựa chọn khuyến nghị. Sửa lỗi thì tự sửa, không hỏi.
    - Nguồn: 6fc61c22 (28-09).
20. **Việc đơn giản làm đúng yêu cầu, không chẩn đoán thêm.** Sếp reject khi agent tự đi soi cấu hình MCP lúc chỉ được nhờ "mở trang và chụp màn hình". Phát hiện thiếu sót thì nêu trong báo cáo.
    - Nguồn: 3fd85337 (24-09).
21. **README phải đủ cho người mới**: liệt kê từng thứ cần cài/bật, biến môi trường, lệnh chạy đúng shell, chia "cài lần đầu" và "mỗi lần chạy".
    - Nguồn: 9d6bea79 (28-09).

## Bảo mật
22. **Không in giá trị bí mật trong chat**, không bảo sếp dán credentials vào chat. Có lần sếp tự dán, agent không dùng mà nhờ sếp điền `.env`. Liệt kê `.env` chỉ in **tên biến**.
    - Nguồn: 9d6bea79 (25-09), 6fc61c22 (28-09).
23. **Chạm giới hạn quyền hệ thống** (UAC, execution policy, cài MSI, biến hệ thống) → dừng và hỏi. Ngoại lệ: sếp nói rõ *"set luôn biến môi trường trong máy đi"* → chỉ đặt ở phạm vi user.
    - Nguồn: 524a5d71 (14-09), 9d6bea79 (28-09).

Liên quan: [[ho-so-user]] · [[viec-dang-do]]

## Luôn dùng Allure 2 (13-10-2026)
- **Sếp chốt:** mọi project dùng CLI Allure 2 (`allure-commandline`), không dùng gói `allure` (v3), không có `allurerc*.mjs`.
- **Why:** sếp muốn giao diện Allure 2 cổ điển. Đánh đổi: máy sinh/mở report cần JRE 8+ (máy dev có JDK 11).
- **How to apply:** script `allure generate <results> -o <out> --clean`; gộp 1 file dùng `--single-file`. Đã đồng bộ vào `.claude/rules/reporting_rules.md`, skill/command framework-architect, README.
