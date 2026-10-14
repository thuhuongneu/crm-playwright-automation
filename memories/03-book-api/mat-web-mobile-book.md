---
name: mat-web-mobile-book
description: Sự thật mặt Web và Android của Book đã khảo sát, bug thấy trên app cần đối chiếu ở API/web, lưu ý khi automate Web Book trong repo này
metadata:
  type: project
---

# Book — mặt Web & Mobile

> Repo này mới có automation **API** của Book. Web Book (`https://book.anhtester.com`, React) nếu automate sẽ dùng Playwright → nhiều khả năng nằm trong repo này. Android nằm ở repo cha (`appium-android-app-automation`).

## Mặt Web (từ review automation 01-10)
- **DOM web chưa được inspect** — chưa biết nút avatar và nút mắt có `aria-label` hay không. Phải recon trước khi viết locator.
- Toast góc trên phải, tự đóng sau ~3 giây (RISK-BK-AUTH-10) → assert ngay, không chờ lâu.
- Tài khoản bị khoá đăng nhập → API 403, toast `User account is disabled.`, **kể cả khi sai mật khẩu** (AMB-26).
- `redirect` làm mất query string → **TC_131 `@KnownBug`** (AMB-BK-AUTH-25).
- Logout xoá `accessToken` ở Local Storage và cookie.
- Menu `Database` (`/db-management`) chưa cấp prefix.
- TC_136 không cần Partial trên Playwright; TC_140 Partial (viền focus phải nhìn bằng mắt).
- **How to apply:** script tự tạo TK-W / TK-L trong setup (qua API như suite `api/`), **không** dựa vào TC_144 hay TC_130 chạy trước.
- Báo cáo: `docs/testcases/_book-api/auth/review/automation_review_web_20261001.md` (repo cha).
- Nguồn: 0ebb7ee7 (01-10).

## Mặt Android (để đối chiếu)
- App **Hybrid** (Capacitor): React trong WebView tiêu đề "Sign in - Book UI for api-book.anhtester.com" → **rất có thể chung frontend với web** → bug thấy trên app có thể tái hiện ở web.
- Emulator `Pixel_10_Pro_XL_API_37`, Android 17, dọc, en-US. iOS chưa khảo sát.
- Cây WebView **rỗng tới lần chạm đầu** (RISK-BK-AUTH-11); lần bấm Login đầu đôi khi không gửi form (RISK-08); nút avatar / nút mắt chưa có `content-desc` (RISK-07).
- Nguồn: 56c1f368 · 707a6dce (01-10).

## Bug / hành vi thấy trên app — cần kiểm lại ở API & Web
1. **Gửi đăng nhập trùng**: bấm Login 2 lần → 2 request, 2 toast `Login successfully.` (BK_AUTH_TC_019).
2. **Đăng xuất bị bật lại**: sau Logout lúc có lúc không tự về Dashboard với `Welcome undefined` (TC_006, TC_021).
3. **Email có dấu cách đầu/cuối** bị báo `Invalid email address`, trái giả định `ASM-BK-AUTH-02` (app tự trim). Coi như AMB 🔴 tới khi BA chốt. Khi viết TC/REQ API/web → đối chiếu server có trim email không.
- Tài khoản không tồn tại báo `User not found.`
- Chưa lập bug report (đã hỏi sếp, chưa có trả lời). Assertion giữ nguyên, không hạ.
- Nguồn: 707a6dce (01-10).

Liên quan: [[quy-uoc-ma-va-du-lieu]] · [[he-thong-va-phat-hien]] · [[viec-dang-do]]
