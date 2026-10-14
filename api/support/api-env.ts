import * as dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}. Copy .env.example thành .env rồi điền giá trị.`);
  }
  return value;
}

function positiveInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Biến môi trường ${key} phải là số nguyên dương, đang là "${raw}".`);
  }
  return value;
}

/**
 * Cấu hình riêng của suite API Book — KHÔNG dùng chung env.config.ts của suite UI CRM,
 * để chạy API không bắt buộc phải có tài khoản CRM.
 */
export const apiEnv = {
  baseURL: required('BOOK_API_BASE_URL'),
  /** Ngưỡng thời gian phản hồi của request chính trong mỗi test */
  slaMs: positiveInt('API_SLA_MS', 2_000),
  workers: positiveInt('WORKERS', 5),
} as const;

/** Biến môi trường mang mốc T của lượt chạy — đặt ở playwright.api.config.ts, worker kế thừa */
export const RUN_T_ENV = 'BOOK_RUN_T';

/** Mốc T (Unix giây) dùng chung cho mọi worker trong cùng một lượt chạy */
export function runTimestamp(): number {
  const value = Number(process.env[RUN_T_ENV]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Thiếu mốc ${RUN_T_ENV} — chạy suite qua playwright.api.config.ts (npm run test:api).`);
  }
  return value;
}
