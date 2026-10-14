import { test } from '@playwright/test';
import { description, displayName, label, severity, Severity } from 'allure-js-commons';

export { Severity };

export type TestMeta = {
  /** Mã manual test case — khoá truy vết sang RTM và execution report */
  testId: string;
  /** 1–2 câu: test kiểm tra gì, điều kiện gì, kỳ vọng gì */
  description: string;
  severity: Severity;
};

/**
 * Khai báo metadata bắt buộc cho một test — gọi ở dòng đầu mỗi test.
 * Tags KHÔNG khai ở đây: dùng `{ tag: ['@smoke'] }` của Playwright để `--grep @smoke`
 * lọc được, allure-playwright tự map tag đó thành label tag trong report.
 * Tên hiển thị trong report có dạng `<TC ID> - <tên test>`; tên test trong code giữ nguyên để `--grep` không đổi.
 */
export async function allureMeta(meta: TestMeta): Promise<void> {
  const title = test.info().title;
  await displayName(title.startsWith(`${meta.testId} - `) ? title : `${meta.testId} - ${title}`);
  await description(meta.description);
  await severity(meta.severity);
  await label('testId', meta.testId);
}
