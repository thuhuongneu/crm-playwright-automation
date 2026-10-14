import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { runTimestamp } from './api-env';

/**
 * Sổ ghi tài khoản đã tạo / đã xoá trong lượt chạy — mỗi process ghi file riêng
 * để các worker song song không giẫm nhau. Chỉ ghi email + TC ID, KHÔNG ghi mật khẩu hay token.
 */
export type LedgerEntry = { action: 'created' | 'deleted'; email: string; source: string };

function ledgerDir(): string {
  return join('reports', 'api', 'data-ledger', String(runTimestamp()));
}

export function recordLedger(entry: LedgerEntry): void {
  const dir = ledgerDir();
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, `ledger-${process.pid}.jsonl`), `${JSON.stringify(entry)}\n`);
}

export function readLedger(): LedgerEntry[] {
  const dir = ledgerDir();
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .flatMap(f => readFileSync(join(dir, f), 'utf8').split('\n'))
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line) as LedgerEntry);
}
