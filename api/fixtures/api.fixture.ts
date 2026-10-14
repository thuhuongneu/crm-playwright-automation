import { APIRequestContext, test as base } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { ApiRecorder } from '../clients/base.client';
import { UserClient } from '../clients/user.client';
import { BodyEncoding, RegisterBody, TestAccount } from '../models/auth.model';
import { apiEnv } from '../support/api-env';
import { recordLedger } from '../support/data-ledger';
import { maskExchange } from '../support/mask';
import { sharedAccounts } from '../test-data/auth.data';

type ApiFixtures = {
  recorder: ApiRecorder;
  apiContext: APIRequestContext;
  authApi: AuthClient;
  userApi: UserClient;
  /** Đăng ký qua đây để tài khoản được ghi sổ — global-teardown dọn mọi tài khoản đã ghi */
  registerTracked: (body: RegisterBody, encoding?: BodyEncoding) => ReturnType<AuthClient['register']>;
  /** Tài khoản dùng chung do global-setup tạo */
  userA: TestAccount;
  userB: TestAccount;
  /** Fixture tự chạy: đính request/response đã che ở cuối MỌI test — thay cho screenshot của UI */
  attachExchanges: void;
};

export const test = base.extend<ApiFixtures>({
  recorder: async ({}, use) => {
    await use(new ApiRecorder());
  },

  // Context riêng cho từng test — cookie jar không rò từ test này sang test khác
  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: apiEnv.baseURL,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(context);
    await context.dispose();
  },

  authApi: async ({ apiContext, recorder }, use) => {
    await use(new AuthClient(apiContext, recorder));
  },

  userApi: async ({ apiContext, recorder }, use) => {
    await use(new UserClient(apiContext, recorder));
  },

  registerTracked: async ({ authApi }, use, testInfo) => {
    const source = testInfo.title;
    await use(async (body, encoding = 'json') => {
      const result = await authApi.register(body, encoding);
      if (result.status === 201 && typeof body.email === 'string') {
        recordLedger({ action: 'created', email: body.email, source });
      }
      return result;
    });
  },

  userA: async ({}, use) => {
    await use(sharedAccounts.userA);
  },

  userB: async ({}, use) => {
    await use(sharedAccounts.userB);
  },

  attachExchanges: [
    async ({ recorder }, use, testInfo) => {
      await use();
      await testInfo.attach('request_response', {
        body: JSON.stringify(recorder.exchanges.map(maskExchange), null, 2),
        contentType: 'application/json',
      });
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
