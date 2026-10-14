import { request } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { ApiRecorder } from '../clients/base.client';
import { apiEnv } from '../support/api-env';
import { recordLedger } from '../support/data-ledger';
import { apiLogger } from '../support/api-logger';
import { sharedAccounts } from '../test-data/auth.data';

/** Setup tuần tự trước mọi TC: đăng ký userA · userB (Dependencies & Execution Order (API)) */
export default async function globalSetup(): Promise<void> {
  const context = await request.newContext({ baseURL: apiEnv.baseURL });
  const auth = new AuthClient(context, new ApiRecorder());
  try {
    for (const account of Object.values(sharedAccounts)) {
      const result = await auth.register(account);
      if (result.status !== 201) {
        throw new Error(`Setup thất bại: đăng ký ${account.email} trả ${result.status} — ${result.text}`);
      }
      recordLedger({ action: 'created', email: account.email, source: 'global-setup' });
      apiLogger.info(`Setup: đã tạo tài khoản dùng chung ${account.email}`);
    }
  } finally {
    await context.dispose();
  }
}
