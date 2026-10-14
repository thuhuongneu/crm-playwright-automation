import { expect } from '@playwright/test';
import Ajv from 'ajv';
import { ApiResult } from '../clients/api-result';
import { apiEnv } from './api-env';

const ajv = new Ajv({ allErrors: true, strict: false });

/** Dấu hiệu lộ chi tiết máy chủ trong body lỗi: stack trace, đường dẫn mã nguồn, tên bảng / câu SQL */
const SERVER_LEAK = /"stack"|\bat \S+ \(.*:\d+:\d+\)|node_modules|prisma|\bselect\b.+\bfrom\b|\binsert into\b/i;

export function expectSchema(result: ApiResult, schema: object, label: string): void {
  const validate = ajv.compile(schema);
  const valid = validate(result.body);
  expect(valid, `${label} phải khớp JSON Schema của spec — lỗi: ${ajv.errorsText(validate.errors)}`).toBe(true);
}

export function expectWithinSla(result: ApiResult, limitMs: number = apiEnv.slaMs): void {
  expect(result.durationMs, `Thời gian phản hồi phải dưới ${limitMs} ms`).toBeLessThan(limitMs);
}

/** Body không được trả lại giá trị bí mật đã gửi (mật khẩu…) và không lộ chi tiết máy chủ */
export function expectNoSensitiveData(result: ApiResult, secrets: string[] = []): void {
  for (const secret of secrets) {
    expect(result.text.includes(secret), 'Body không được chứa lại mật khẩu đã gửi').toBe(false);
  }
  expect(SERVER_LEAK.test(result.text), 'Body không được chứa stack trace / tên bảng / câu SQL').toBe(false);
}

export function expectNoSetCookie(result: ApiResult): void {
  expect(result.setCookies.map(c => c.name), 'Response không được có Set-Cookie (không mở phiên)').toEqual([]);
}
