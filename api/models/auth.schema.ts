/**
 * JSON Schema chép từ snapshot spec `openapi_2026-09-19.json` (sha256 32bb8b39…3f09).
 * Spec để `components.schemas` rỗng, mọi schema khai inline — nên chép tay tại đây.
 */
const fieldErrors = {
  type: 'object',
  patternProperties: { '^(.*)$': { type: 'array', items: { type: 'string' } } },
} as const;

export const schemas = {
  /** 201 của register · 200 của DELETE /api/user/{id} */
  message: {
    type: 'object',
    properties: { msg: { type: 'string' } },
    required: ['msg'],
  },
  /** 400 · 404 · 422 có `fields` */
  error: {
    type: 'object',
    properties: { msg: { type: 'string' }, fields: fieldErrors },
    required: ['msg', 'fields'],
  },
  loginSuccess: {
    type: 'object',
    properties: {
      msg: { type: 'string' },
      accessToken: { type: 'string' },
      exp: { type: 'string' },
    },
    required: ['msg', 'accessToken', 'exp'],
  },
  me: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      avatarUrl: { type: 'string' },
      phone: { type: 'string' },
      address: { type: 'string' },
      config: {},
    },
    required: ['id', 'name', 'email', 'avatarUrl', 'phone', 'address'],
    additionalProperties: false,
  },
} as const;
