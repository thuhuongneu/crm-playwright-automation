import { request } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AuthClient } from '../clients/auth.client';
import { ApiRecorder } from '../clients/base.client';
import { UserClient } from '../clients/user.client';
import { CleanupOutcome, deleteOwnAccount } from '../support/account-cleanup';
import { apiEnv } from '../support/api-env';
import { apiLogger } from '../support/api-logger';
import { readLedger } from '../support/data-ledger';
import { CLEANUP_PASSWORDS, runT, sharedAccounts } from '../test-data/auth.data';

/**
 * Teardown: dọn MỌI tài khoản suite đã ghi sổ — tài khoản tạo trong test trước, userA · userB sau cùng.
 * Xuất báo cáo số tạo / số dọn / còn sót ra reports/api/data-cleanup-<T>.md.
 */
export default async function globalTeardown(): Promise<void> {
  const ledger = readLedger();
  const created = [...new Set(ledger.filter(e => e.action === 'created').map(e => e.email))];
  const deletedInTest = new Set(ledger.filter(e => e.action === 'deleted').map(e => e.email));
  const sharedEmails = Object.values(sharedAccounts).map(a => a.email);

  const context = await request.newContext({ baseURL: apiEnv.baseURL });
  const recorder = new ApiRecorder();
  const auth = new AuthClient(context, recorder);
  const users = new UserClient(context, recorder);
  const outcomes = new Map<string, CleanupOutcome>();

  try {
    const testCreated = created.filter(e => !sharedEmails.includes(e));
    for (const email of [...testCreated, ...sharedEmails.filter(e => created.includes(e))]) {
      const isShared = sharedEmails.includes(email);
      try {
        outcomes.set(email, await deleteOwnAccount(auth, users, email, CLEANUP_PASSWORDS, isShared ? [] : sharedEmails));
      } catch (error) {
        apiLogger.error(`Teardown: lỗi khi dọn ${email} — ${(error as Error).message}`);
        outcomes.set(email, 'failed');
      }
    }
  } finally {
    await context.dispose();
  }

  const count = (o: CleanupOutcome) => [...outcomes.values()].filter(v => v === o).length;
  const leftovers = [...outcomes.entries()].filter(([, o]) => o === 'failed' || o === 'skipped-protected');
  const lines = [
    `# Dọn dữ liệu — lượt T = ${runT}`,
    '',
    '| Chỉ số | Số lượng |',
    '|---|---|',
    `| Tài khoản suite đã tạo | ${created.length} |`,
    `| Teardown xoá | ${count('deleted')} |`,
    `| Đã xoá sẵn trong test | ${count('already-gone')} (ghi sổ trong test: ${deletedInTest.size}) |`,
    `| Còn sót | ${leftovers.length} |`,
    '',
    ...leftovers.map(([email, o]) => `- ⚠️ ${email} — ${o}`),
  ];
  mkdirSync(join('reports', 'api'), { recursive: true });
  writeFileSync(join('reports', 'api', `data-cleanup-${runT}.md`), `${lines.join('\n')}\n`);
  apiLogger.info(`Teardown: tạo ${created.length} · xoá ${count('deleted')} · đã xoá sẵn ${count('already-gone')} · sót ${leftovers.length}`);
}
