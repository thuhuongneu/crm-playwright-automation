import { TestAccount } from '../models/auth.model';
import { runTimestamp } from '../support/api-env';

/**
 * Test data module AUTH (API) — bám "Quy tắc số định danh" ở TEST_CASES_AUTH_SUMMARY.md:
 * mọi mốc mẫu 17901504xx trong TC được thay bằng T + xx, T = mốc bắt đầu lượt chạy.
 * Nhìn email trong hệ thống là biết lượt chạy và TC nào đã tạo ra.
 */
const T = runTimestamp();

/** Mật khẩu của tài khoản do suite tự tạo — dữ liệu test công khai trong TC, không phải bí mật */
export const PASSWORD = 'Auto@12345';
/** Mật khẩu khác dùng ở TC_065 — teardown thử cả hai khi dọn */
export const OTHER_PASSWORD = 'Khac@12345';
export const CLEANUP_PASSWORDS = [PASSWORD, OTHER_PASSWORD];

export function authEmail(offset: number, suffix?: string): string {
  return `auto_auth_${T + offset}${suffix ? `_${suffix}` : ''}@auto.test`;
}

export function authName(offset: number): string {
  return `Auto Auth API ${T + offset}`;
}

/** Tài khoản dùng chung — global-setup tạo, global-teardown xoá */
export const sharedAccounts: { userA: TestAccount; userB: TestAccount } = {
  userA: { name: 'Auto Auth API A', email: authEmail(30, 'a'), password: PASSWORD },
  userB: { name: 'Auto Auth API B', email: authEmail(31, 'b'), password: PASSWORD },
};

export const runT = T;

/** Biến thể email sai định dạng — TC_064 dùng a→f, TC_077 dùng a→d */
export const INVALID_EMAILS = [
  { key: 'a', email: 'khong-phai-email' },
  { key: 'b', email: 'auto_auth@' },
  { key: 'c', email: '@auto.test' },
  { key: 'd', email: 'auto@auth@auto.test' },
  { key: 'e', email: 'auto auth@auto.test' },
  { key: 'f', email: "' OR 1=1--" },
];

export const messages = {
  registerOk: 'Register successfully',
  loginOk: 'Login successfully',
  invalidData: 'Invalid data.',
  emailExists: 'Email already exists.',
  invalidEmail: "Property 'email' should be email",
  passwordMissing: "Expected property 'password' to be string but found: undefined",
} as const;

export const errorBodies = {
  emailExists: { msg: 'Email already exists.', fields: { email: ['Email already exists.'] } },
  invalidPassword: { msg: 'Invalid password.', fields: { password: ['Invalid password, please try again.'] } },
  userNotFound: { msg: 'User not found.', fields: { email: ['Email not found, please register.'] } },
} as const;
