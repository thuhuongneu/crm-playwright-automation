export type HeaderEntry = { name: string; value: string };

export type ParsedCookie = {
  name: string;
  value: string;
  /** Khoá thuộc tính viết thường: `httponly` · `secure` · `samesite` · `path` · `max-age`… */
  attributes: Map<string, string>;
};

/** Một lượt request/response đã ghi lại — nguồn cho attachment cuối test */
export type Exchange = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  encoding?: string;
  requestBody?: unknown;
  status: number;
  responseHeaders: HeaderEntry[];
  responseBody: unknown;
  durationMs: number;
};

function parseSetCookie(raw: string): ParsedCookie {
  const [pair, ...attrs] = raw.split(';');
  const eq = pair.indexOf('=');
  const attributes = new Map<string, string>();
  for (const attr of attrs) {
    const [key, ...rest] = attr.trim().split('=');
    if (key) {
      attributes.set(key.toLowerCase(), rest.join('='));
    }
  }
  return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim(), attributes };
}

/** Response đã đọc xong — test assert trên đối tượng này, không đụng APIResponse của Playwright */
export class ApiResult<T = unknown> {
  constructor(private readonly exchange: Exchange, readonly text: string) {}

  get status(): number {
    return this.exchange.status;
  }

  get durationMs(): number {
    return this.exchange.durationMs;
  }

  get body(): T {
    return this.exchange.responseBody as T;
  }

  header(name: string): string | undefined {
    return this.exchange.responseHeaders.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;
  }

  get setCookies(): ParsedCookie[] {
    return this.exchange.responseHeaders
      .filter(h => h.name.toLowerCase() === 'set-cookie')
      .map(h => parseSetCookie(h.value));
  }

  cookies(name: string): ParsedCookie[] {
    return this.setCookies.filter(c => c.name === name);
  }
}
