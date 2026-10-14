import { APIRequestContext } from '@playwright/test';
import { BodyEncoding } from '../models/auth.model';
import { ApiResult, Exchange } from './api-result';

type SendOptions = {
  body?: Record<string, unknown>;
  encoding?: BodyEncoding;
  headers?: Record<string, string>;
};

/** Sổ ghi mọi request/response của MỘT test — fixture đính vào report ở cuối test */
export class ApiRecorder {
  readonly exchanges: Exchange[] = [];
}

/** Multipart / form chỉ nhận giá trị nguyên thuỷ — giá trị lồng được gửi dưới dạng chuỗi JSON */
function flatten(body: Record<string, unknown>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? value
        : JSON.stringify(value),
    ]),
  );
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export abstract class BaseClient {
  constructor(
    protected readonly request: APIRequestContext,
    private readonly recorder: ApiRecorder,
  ) {}

  protected async send<T>(method: 'GET' | 'POST' | 'DELETE', path: string, options: SendOptions = {}): Promise<ApiResult<T>> {
    const { body, encoding = 'json', headers = {} } = options;
    const payload = body === undefined
      ? {}
      : encoding === 'json'
        ? { data: body }
        : encoding === 'form'
          ? { form: flatten(body) }
          : { multipart: flatten(body) };

    const startedAt = Date.now();
    const response = await this.request.fetch(path, { method, headers, ...payload });
    const durationMs = Date.now() - startedAt;
    const text = await response.text();

    const exchange: Exchange = {
      method,
      url: response.url(),
      requestHeaders: headers,
      encoding: body === undefined ? undefined : encoding,
      requestBody: body,
      status: response.status(),
      responseHeaders: response.headersArray(),
      responseBody: parseBody(text),
      durationMs,
    };
    this.recorder.exchanges.push(exchange);
    return new ApiResult<T>(exchange, text);
  }
}
