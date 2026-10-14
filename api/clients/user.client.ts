import { MessageResponse } from '../models/auth.model';
import { BaseClient } from './base.client';

/** Nhóm tài nguyên User Management — suite CHỈ dùng để tài khoản tự xoá chính nó */
export class UserClient extends BaseClient {
  deleteUser(id: string, accessToken: string) {
    return this.send<MessageResponse>('DELETE', `/api/user/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
