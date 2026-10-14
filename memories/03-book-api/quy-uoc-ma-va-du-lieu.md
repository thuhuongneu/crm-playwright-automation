---
name: quy-uoc-ma-va-du-lieu
description: Quy ước mã hệ thống Book (BK) — REQ/AMB/RISK/ASM/TC ID, dải TC theo nền tảng, offset tài khoản test, tag trong TC, smoke API
metadata:
  type: reference
---

# Book — quy ước mã & dữ liệu test

## Mã
- Mã hệ thống **`BK`**, namespace tài liệu **`_book-api/`** (repo cha). Không dùng chung prefix / REQ / TC ID với CRM.
- Module: `AUTH · USER · BOOK · CAT · PROMO · FILE · ADDR · SYS` (+ `DASH` chỉ có trên app).
- REQ `REQ-BK-AUTH-nn` · AMB `AMB-BK-AUTH-nn` (cấp hệ thống `AMB-BK-nn`, kế tiếp `AMB-BK-13`) · RISK `RISK-BK-AUTH-nn` · Assumption `ASM-BK-AUTH-nn`.
- TC `BK_AUTH_TC_nnn` — **một dải chung cho mọi nền tảng** của module (một nghiệp vụ = một prefix).
- Mã quyết định giả lập dùng làm dữ liệu dạy học, **không phải** câu trả lời thật của PO: `DEMO-AMB-2509`, `DEMO-AMB-2509B`, `DEMO-AMB-2609`.
- AUTH hiện **0 AMB treo** (35/35 đã chốt) theo index REQ.
- Nguồn: 0ebb7ee7 · 56c1f368 (01-10).

## Dải TC của AUTH (193 TC)
| Nền tảng | Dải | Part |
|---|---|---|
| Mobile | `001–058` | part_01 `001–025` · part_02 `026–057` |
| API | `059–108` | part_01 `059–081` + `106`, `107` · part_02 `082–105` + `108` |
| Web | `109–193` | part_01 `109–140` · part_02 `141–171` · part_03 `172–193` |
- `106–108` được **nối tiếp** dải khi tách TC ngày 20-09-2026, không chèn vào giữa.
- USER: `BK_USER_TC_001→149` · BOOK: `BK_BOOK_TC_001→180`.
- **How to apply:** TC mới nối tiếp mã cuối của module, không đánh lại.

## Offset tài khoản test (`T + offset`)
| Nền tảng | Offset | Tài khoản |
|---|---|---|
| Mobile | `00–19` | `TK-A` = 00 |
| API | `20–49` | userA = 30 · userB = 31 · userC = 36 (TC_074-b, tự xoá trong test) · userD = 37 (TC_097) · userE = 38 (TC_102→104, đổi mật khẩu — khi dọn thử mật khẩu mới trước rồi mật khẩu gốc) |
| Web | `50–64` | TK-W = 50 · TK-W2 = 51 · TK-L = 52 (bị khoá — xoá qua UI bằng TK-W **trước** khi xoá TK-W) · TK-P = 53 · TK-P2 = 54 |
- **How to apply:** mỗi nền tảng dùng đúng khoảng offset của mình để chạy song song không trùng email.

## Thứ tự & smoke API
- `@smoke` API: TC_059 · 106 · 069 · 071 · 082 · 086 · 091.
- Thứ tự chạy (index, mục *Dependencies & Execution Order (API)*): setup userA/B/E → đợt 1 register → đợt 2 login → đợt 3 refetch/logout/me → đợt 4 profile (**tuần tự**).

## Tag trong TC
| Tag | Nghĩa | Automation |
|---|---|---|
| `@KnownBug` | Hệ thống đang sai so với kỳ vọng đã chốt | Dự kiến FAIL, **vẫn automate**, giữ kỳ vọng. Chỉ được `expect.soft` theo tinh thần KnownBug |
| `⚪ Chờ chốt <AMB>` / `@PendingAMB` | Kỳ vọng theo spec, AMB chưa có câu trả lời | Automate, tag `@pendingamb` trong code |
| `@NeedsVerify` / `⚠️ chưa có evidence` | Biến thể chưa kiểm chứng | Chỉ automate biến thể đã có evidence |
| `@TechCheck` / 🔧 | Kiểm qua DevTools / API | |
- Độ hạt **GỘP**: biến thể `a/b/c` → test tham số hoá; báo FAIL ghi `TC_xxx-c`.
- Nguồn: 0b11ea16 · 0ebb7ee7 (01-10).

Liên quan: [[thiet-ke-suite-api]] · [[mat-web-mobile-book]] · [[vi-tri-tai-lieu]]
