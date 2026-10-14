import { BodyEncoding, LoginBody, LoginSuccessResponse, MeResponse, RegisterBody } from '../models/auth.model';
import { BaseClient } from './base.client';

export const authPaths = {
  register: '/api/register',
  login: '/api/login',
  me: '/api/me',
} as const;

/** Nhóm tài nguyên Authentication Management */
export class AuthClient extends BaseClient {
  register(body: RegisterBody, encoding: BodyEncoding = 'json', headers: Record<string, string> = {}) {
    return this.send<unknown>('POST', authPaths.register, { body, encoding, headers });
  }

  login(body: LoginBody, encoding: BodyEncoding = 'json', headers: Record<string, string> = {}) {
    return this.send<LoginSuccessResponse>('POST', authPaths.login, { body, encoding, headers });
  }

  me(accessToken: string) {
    return this.send<MeResponse>('GET', authPaths.me, { headers: { Authorization: `Bearer ${accessToken}` } });
  }
}
