import { AuthClient } from '../clients/auth.client';
import { UserClient } from '../clients/user.client';

export type CleanupOutcome = 'deleted' | 'already-gone' | 'skipped-protected' | 'failed';

/**
 * Tài khoản tự xoá CHÍNH NÓ: đăng nhập bằng chính nó → DELETE /api/user/{id} bằng token của nó
 * → đăng nhập lại phải ra 404. Không bao giờ dùng id lấy từ API danh sách.
 *
 * `protectedEmails`: tài khoản không được xoá ở bước này (VD tài khoản dùng chung) — chặn trường hợp
 * email biến thể hoa thường đăng nhập trúng tài khoản khác.
 */
export async function deleteOwnAccount(
  auth: AuthClient,
  users: UserClient,
  email: string,
  passwords: string[],
  protectedEmails: string[] = [],
): Promise<CleanupOutcome> {
  for (const password of passwords) {
    const login = await auth.login({ email, password });
    if (login.status === 404) {
      return 'already-gone';
    }
    if (login.status !== 200) {
      continue;
    }
    const me = await auth.me(login.body.accessToken);
    if (me.status !== 200) {
      return 'failed';
    }
    const ownerEmail = String(me.body.email ?? '').toLowerCase();
    // Token phải trỏ đúng tài khoản cần dọn — lệch là có thể đang cầm tài khoản của người khác, KHÔNG xoá
    if (ownerEmail !== email.toLowerCase() || protectedEmails.some(p => p.toLowerCase() === ownerEmail)) {
      return 'skipped-protected';
    }
    const removed = await users.deleteUser(me.body.id, login.body.accessToken);
    if (removed.status !== 200) {
      return 'failed';
    }
    const relogin = await auth.login({ email, password });
    return relogin.status === 404 ? 'deleted' : 'failed';
  }
  return 'failed';
}
