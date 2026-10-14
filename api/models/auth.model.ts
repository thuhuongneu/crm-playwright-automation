/** Body `POST /api/register` — để kiểu lỏng vì TC âm tính cố tình gửi sai kiểu / thiếu khoá */
export type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  [extra: string]: unknown;
};

/** Body `POST /api/login` */
export type LoginBody = {
  email?: unknown;
  password?: unknown;
};

/** Cách mã hoá body — spec khai cả 3 cho register và login */
export type BodyEncoding = 'json' | 'form' | 'multipart';

export type MessageResponse = {
  msg: string;
};

export type ErrorResponse = {
  msg: string;
  fields: Record<string, string[]>;
};

export type LoginSuccessResponse = {
  msg: string;
  accessToken: string;
  exp: string;
};

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
  address: string;
  config?: unknown;
};

/** Tài khoản do chính suite tạo — KHÔNG bao giờ là tài khoản có sẵn của hệ thống */
export type TestAccount = {
  name: string;
  email: string;
  password: string;
};
