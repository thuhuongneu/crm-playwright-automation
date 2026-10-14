import { Exchange } from '../clients/api-result';

/**
 * Che dữ liệu nhạy cảm trước khi đính vào report: token, cookie, mật khẩu chỉ còn HÌNH THÁI.
 * Thuộc tính cookie (HttpOnly, Secure, SameSite…) giữ nguyên — đó là bằng chứng của TC cookie.
 */
const MAX_STRING = 300;
/** Request: che mật khẩu + token đã gửi · Response: chỉ che token — giữ nguyên message lỗi của fields.password làm bằng chứng */
const REQUEST_SECRET = /password|token/i;
const RESPONSE_SECRET = /token/i;

function shape(value: string): string {
  return value.split('.').length === 3 ? `<JWT ${value.length} ký tự>` : `<${value.length} ký tự>`;
}

function maskValue(key: string, value: unknown, secret: RegExp): unknown {
  if (typeof value === 'string') {
    if (secret.test(key)) {
      return shape(value);
    }
    return value.length > MAX_STRING ? `${value.slice(0, 40)}…<${value.length} ký tự>` : value;
  }
  if (Array.isArray(value)) {
    return value.map(v => maskValue(key, v, secret));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskValue(secret.test(key) ? key : k, v, secret)]));
  }
  return value;
}

function maskCookie(raw: string): string {
  const [pair, ...attrs] = raw.split(';');
  const eq = pair.indexOf('=');
  return [`${pair.slice(0, eq)}=${shape(pair.slice(eq + 1))}`, ...attrs].join(';');
}

function maskHeader(name: string, value: string): string {
  const lower = name.toLowerCase();
  if (lower === 'authorization') {
    const parts = value.split(' ');
    return parts.length < 2 ? shape(value) : `${parts[0]} ${shape(parts.slice(1).join(' '))}`;
  }
  if (lower === 'set-cookie') {
    return maskCookie(value);
  }
  if (lower === 'cookie') {
    return value.split(';').map(maskCookie).join(';');
  }
  return value;
}

export function maskExchange(exchange: Exchange): unknown {
  return {
    request: `${exchange.method} ${exchange.url}`,
    encoding: exchange.encoding,
    requestHeaders: Object.fromEntries(
      Object.entries(exchange.requestHeaders).map(([k, v]) => [k, maskHeader(k, v)]),
    ),
    requestBody: maskValue('', exchange.requestBody, REQUEST_SECRET),
    status: exchange.status,
    durationMs: exchange.durationMs,
    responseHeaders: exchange.responseHeaders.map(h => `${h.name}: ${maskHeader(h.name, h.value)}`),
    responseBody: maskValue('', exchange.responseBody, RESPONSE_SECRET),
  };
}
