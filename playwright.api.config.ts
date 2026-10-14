import { defineConfig } from '@playwright/test';
import { apiEnv, RUN_T_ENV } from './api/support/api-env';

// Mốc T của lượt chạy — đặt một lần ở process chính, mọi worker kế thừa nên dữ liệu test không trùng giữa các luồng
process.env[RUN_T_ENV] ??= String(Math.floor(Date.now() / 1000));

/** Suite API Book (https://book.anhtester.com) — tách riêng hoàn toàn khỏi suite UI CRM ở playwright.config.ts */
export default defineConfig({
  testDir: './api/tests',
  testMatch: '**/*.api.spec.ts',
  timeout: 60_000,

  fullyParallel: true,
  workers: apiEnv.workers,
  // Không retry: mỗi lần chạy lại một test đăng ký sẽ trùng email của chính lần trước
  retries: 0,
  forbidOnly: !!process.env.CI,

  globalSetup: './api/setup/global-setup.ts',
  globalTeardown: './api/setup/global-teardown.ts',

  outputDir: 'reports/api/test-artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/api/html', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/api/allure-results', detail: false }],
  ],

  use: {
    baseURL: apiEnv.baseURL,
  },
});
