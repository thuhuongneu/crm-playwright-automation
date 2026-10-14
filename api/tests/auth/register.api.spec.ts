import { test, expect } from '../../fixtures/api.fixture';
import { schemas } from '../../models/auth.schema';
import { ErrorResponse, MeResponse, MessageResponse } from '../../models/auth.model';
import {
  expectNoSensitiveData,
  expectNoSetCookie,
  expectSchema,
  expectWithinSla,
} from '../../support/api-assertions';
import { allureMeta, Severity } from '../../../src/utils/allure';
import { authEmail, authName, errorBodies, INVALID_EMAILS, messages, OTHER_PASSWORD, PASSWORD, runT } from '../../test-data/auth.data';

test.describe('API Đăng ký tài khoản — POST /api/register', () => {
  test(
    'Đăng ký thành công với body JSON đủ trường, không cần token',
    { tag: ['@api', '@auth', '@smoke', '@criticalpath'] },
    async ({ registerTracked }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_059',
        description:
          'Kiểm tra gửi POST /api/register bằng JSON đủ trường, không kèm header Authorization thì hệ thống trả 201, '
          + 'msg chứa "Register successfully" và không set cookie phiên.',
        severity: Severity.BLOCKER,
      });

      const body = await test.step('Arrange: Chuẩn bị body đăng ký với email chưa từng đăng ký', async () => ({
        name: authName(20),
        email: authEmail(20, 'reg'),
        password: PASSWORD,
        phone: '0912345678',
        address: '12 Tràng Tiền',
      }));

      const result = await test.step('Act: Gửi POST /api/register không có header Authorization', async () =>
        registerTracked(body));

      await test.step('Assert: Trả 201, msg chứa "Register successfully"', async () => {
        expect(result.status, 'Đăng ký công khai không được bị 401, phải trả 201').toBe(201);
        expectSchema(result, schemas.message, 'Body 201');
        expect((result.body as MessageResponse).msg, 'msg phải chứa "Register successfully"').toContain(messages.registerOk);
        expectWithinSla(result);
        expectNoSensitiveData(result, [PASSWORD]);
      });

      await test.step('Assert: Không có Set-Cookie — đăng ký không mở phiên', async () => {
        expectNoSetCookie(result);
      });
    },
  );

  const CONTENT_TYPES = [
    { key: 'a', encoding: 'json', email: authEmail(21, 'json') },
    { key: 'b', encoding: 'form', email: authEmail(22, 'form') },
    { key: 'c', encoding: 'multipart', email: authEmail(23, 'multi') },
  ] as const;

  for (const variant of CONTENT_TYPES) {
    test(
      `Đăng ký nhận đủ 3 content-type khai trong spec (biến thể ${variant.key}: ${variant.encoding})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ registerTracked }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_060',
          description:
            `Kiểm tra POST /api/register với body hợp lệ mã hoá ${variant.encoding} thì hệ thống xử lý như JSON: `
            + 'trả 201 và msg chứa "Register successfully".',
          severity: Severity.NORMAL,
        });

        const body = await test.step(`Arrange: Chuẩn bị body hợp lệ, email ${variant.key} chưa từng đăng ký`, async () => ({
          name: 'Auto Auth API CT',
          email: variant.email,
          password: PASSWORD,
        }));

        const result = await test.step(`Act: Gửi POST /api/register mã hoá ${variant.encoding}`, async () =>
          registerTracked(body, variant.encoding));

        await test.step('Assert: Trả 201, msg chứa "Register successfully"', async () => {
          expect(result.status, `Content-type ${variant.encoding} phải được nhận, trả 201`).toBe(201);
          expectSchema(result, schemas.message, 'Body 201');
          expect((result.body as MessageResponse).msg, 'msg phải chứa "Register successfully"').toContain(messages.registerOk);
          expectWithinSla(result);
        });
      },
    );
  }

  const NAME_VARIANTS = [
    { key: 'a', label: 'không có khoá name', name: undefined },
    { key: 'b', label: 'name sai kiểu số', name: 123 },
  ] as const;

  for (const variant of NAME_VARIANTS) {
    test(
      `Thiếu hoặc sai kiểu name bị từ chối (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ registerTracked }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_061',
          description:
            `Kiểm tra POST /api/register với ${variant.label} thì hệ thống trả 422 "Invalid data.", fields.name có lỗi `
            + 'và không tạo tài khoản — gửi lại cùng email với name hợp lệ vẫn đăng ký được.',
          severity: Severity.CRITICAL,
        });

        // Mỗi biến thể một email riêng: hai biến thể chạy song song, bước kiểm "gửi lại → 201" không được giẫm nhau
        const email = authEmail(24, `name_${variant.key}`);
        const body = await test.step(`Arrange: Chuẩn bị body ${variant.label}`, async () =>
          (variant.name === undefined
            ? { email, password: PASSWORD }
            : { name: variant.name, email, password: PASSWORD }));

        const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

        await test.step('Assert: Trả 422 "Invalid data.", fields.name là mảng có ít nhất 1 lỗi', async () => {
          expect(result.status, 'Thiếu / sai kiểu name phải bị từ chối với 422').toBe(422);
          expectSchema(result, schemas.error, 'Body 422');
          const error = result.body as ErrorResponse;
          expect(error.msg, 'msg phải là "Invalid data."').toBe(messages.invalidData);
          expect(error.fields.name?.length ?? 0, 'fields.name phải có ít nhất 1 chuỗi lỗi').toBeGreaterThanOrEqual(1);
          expectWithinSla(result);
        });

        await test.step('Assert: Không tạo tài khoản — gửi lại với name hợp lệ vẫn trả 201', async () => {
          const retry = await registerTracked({ name: authName(24), email, password: PASSWORD });
          expect(retry.status, 'Email chưa bị chiếm nên đăng ký lại với name hợp lệ phải trả 201').toBe(201);
        });
      },
    );
  }

  test(
    'Thiếu email bị từ chối với lỗi thiếu field — Chờ chốt AMB-BK-AUTH-03',
    { tag: ['@api', '@auth', '@regression', '@pendingamb'] },
    async ({ registerTracked }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_062',
        description:
          'Kiểm tra POST /api/register không có khoá email thì hệ thống trả 422 và fields.email báo thiếu field. '
          + 'Dự kiến FAIL theo hiện trạng F-19 (server lấy default user@example.com) — chờ chốt AMB-BK-AUTH-03.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị body không có khoá email', async () => ({
        name: authName(25),
        password: PASSWORD,
      }));

      const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

      await test.step('Assert: Trả 422, fields.email báo thiếu field email', async () => {
        expect(result.status, 'Thiếu email phải bị từ chối với 422').toBe(422);
        expectSchema(result, schemas.error, 'Body 422');
        const emailErrors = (result.body as ErrorResponse).fields.email ?? [];
        expect(
          emailErrors.some(m => m.includes("Expected property 'email'")),
          `fields.email phải báo thiếu field kiểu "Expected property 'email' …", thực tế: ${JSON.stringify(result.body)}`,
        ).toBe(true);
      });
    },
  );

  test(
    'Thiếu password bị từ chối',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ registerTracked, authApi }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_063',
        description:
          'Kiểm tra POST /api/register không có khoá password thì hệ thống trả 422 "Invalid data.", fields.password '
          + 'báo thiếu field và không tạo tài khoản.',
        severity: Severity.CRITICAL,
      });

      const email = authEmail(26);
      const body = await test.step('Arrange: Chuẩn bị body không có khoá password', async () => ({
        name: authName(26),
        email,
      }));

      const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

      await test.step('Assert: Trả 422, fields.password báo thiếu field', async () => {
        expect(result.status, 'Thiếu password phải bị từ chối với 422').toBe(422);
        expectSchema(result, schemas.error, 'Body 422');
        const error = result.body as ErrorResponse;
        expect(error.msg, 'msg phải là "Invalid data."').toBe(messages.invalidData);
        expect(error.fields.password, 'fields.password phải chứa lỗi thiếu field').toContain(messages.passwordMissing);
        expectWithinSla(result);
      });

      await test.step('Assert: Không tạo tài khoản — đăng nhập bằng email đó trả 404', async () => {
        const login = await authApi.login({ email, password: PASSWORD });
        expect(login.status, 'Email chưa được tạo nên đăng nhập phải trả 404').toBe(404);
      });
    },
  );

  for (const variant of INVALID_EMAILS) {
    test(
      `Email sai định dạng bị từ chối khi đăng ký (biến thể ${variant.key}: ${variant.email})`,
      { tag: ['@api', '@auth', '@regression', '@security', '@needsverify'] },
      async ({ registerTracked }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_064',
          description:
            `Kiểm tra POST /api/register với email sai định dạng "${variant.email}" thì hệ thống trả 422 và `
            + `fields.email chứa "${messages.invalidEmail}".`,
          severity: Severity.CRITICAL,
        });

        const body = await test.step('Arrange: Chuẩn bị body với email sai định dạng', async () => ({
          name: authName(27),
          email: variant.email,
          password: PASSWORD,
        }));

        const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

        await test.step(`Assert: Trả 422, fields.email chứa "${messages.invalidEmail}"`, async () => {
          expect(result.status, 'Email sai định dạng phải bị từ chối với 422').toBe(422);
          expectSchema(result, schemas.error, 'Body 422');
          expect((result.body as ErrorResponse).fields.email, 'fields.email phải báo sai định dạng')
            .toContain(messages.invalidEmail);
          expectWithinSla(result);
          expectNoSensitiveData(result);
        });
      },
    );
  }

  test(
    'Đăng ký trùng email bị từ chối',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ registerTracked, authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_065',
        description:
          'Kiểm tra đăng ký lại đúng email của userA (name, mật khẩu khác) thì hệ thống trả 422 với body '
          + '"Email already exists." và mật khẩu của userA không bị đổi.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị body dùng đúng email của userA, mật khẩu khác', async () => ({
        name: 'Auto Auth API Dup',
        email: userA.email,
        password: OTHER_PASSWORD,
      }));

      const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

      await test.step('Assert: Trả 422 với body đúng nguyên văn "Email already exists."', async () => {
        expect(result.status, 'Trùng email phải trả 422 (không phải 409)').toBe(422);
        expect(result.body, 'Body phải đúng nguyên văn lỗi trùng email').toEqual(errorBodies.emailExists);
        expectWithinSla(result);
      });

      await test.step('Assert: Mật khẩu của userA không đổi — đăng nhập bằng mật khẩu cũ trả 200', async () => {
        const login = await authApi.login({ email: userA.email, password: userA.password });
        expect(login.status, 'userA phải đăng nhập được bằng mật khẩu cũ').toBe(200);
      });
    },
  );

  const CASE_VARIANTS = [
    { key: 'a', label: 'viết hoa toàn bộ', transform: (e: string) => e.toUpperCase() },
    {
      key: 'b',
      label: 'hoa thường lẫn',
      transform: (e: string) => e.replace(/(^|[_.@])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase()),
    },
  ];

  for (const variant of CASE_VARIANTS) {
    test(
      `Kiểm trùng email không phân biệt hoa thường (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ registerTracked, authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_066',
          description:
            `Kiểm tra đăng ký bằng email của userA ${variant.label} thì hệ thống vẫn nhận ra trùng: trả 422 `
            + '"Email already exists." và không tạo tài khoản thứ hai.',
          severity: Severity.CRITICAL,
        });

        const body = await test.step(`Arrange: Chuẩn bị email của userA ${variant.label}`, async () => ({
          name: 'Auto Auth API Dup',
          email: variant.transform(userA.email),
          password: PASSWORD,
        }));

        const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

        await test.step('Assert: Trả 422, msg "Email already exists."', async () => {
          expect(result.status, 'Email khác hoa thường vẫn phải bị coi là trùng, trả 422').toBe(422);
          expectSchema(result, schemas.error, 'Body 422');
          expect((result.body as ErrorResponse).msg, 'msg phải là "Email already exists."').toBe(messages.emailExists);
          expectWithinSla(result);
        });

        await test.step('Assert: Không có tài khoản thứ hai — đăng nhập bằng email biến thể vẫn trỏ về userA', async () => {
          const login = await authApi.login({ email: body.email, password: PASSWORD });
          expect(login.status, 'Đăng nhập bằng email biến thể phải trả 200').toBe(200);
          const me = await authApi.me(login.body.accessToken);
          expect(me.body.email, 'Token phải trỏ về đúng userA, không phải tài khoản mới').toBe(userA.email);
        });
      },
    );
  }

  test(
    'Mass Assignment — trường đặc quyền gửi kèm khi đăng ký không có tác dụng',
    { tag: ['@api', '@auth', '@security', '@needsverify'] },
    async ({ registerTracked, authApi }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_067',
        description:
          'Kiểm tra đăng ký kèm trường ngoài spec (role, isAdmin, isActive, id, config) thì các trường đặc quyền không '
          + 'có tác dụng: vẫn đăng nhập được, GET /api/me chỉ trả 7 khoá và id không bị ghi đè.',
        severity: Severity.CRITICAL,
      });

      const customId = `custom-id-${runT + 28}`;
      const body = await test.step('Arrange: Chuẩn bị body có thêm trường đặc quyền ngoài spec', async () => ({
        name: 'Auto Auth API Mass',
        email: authEmail(28, 'mass'),
        password: PASSWORD,
        role: 'admin',
        isAdmin: true,
        isActive: false,
        id: customId,
        config: { theme: 'hacked' },
      }));

      const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

      await test.step('Assert: Trả 201 hoặc 422 từ chối trường lạ', async () => {
        expect([201, 422], `Status phải là 201 hoặc 422, thực tế ${result.status}`).toContain(result.status);
        expectWithinSla(result);
      });

      if (result.status !== 201) {
        return;
      }

      const login = await test.step('Act: Đăng nhập bằng tài khoản vừa đăng ký', async () =>
        authApi.login({ email: body.email, password: PASSWORD }));

      await test.step('Assert: Đăng nhập được — isActive:false không khoá tài khoản', async () => {
        expect(login.status, 'Tài khoản vừa đăng ký phải đăng nhập được').toBe(200);
      });

      const me = await test.step('Act: Gọi GET /api/me bằng token vừa nhận', async () => authApi.me(login.body.accessToken));

      await test.step('Assert: /api/me chỉ có 7 khoá, id không bị ghi đè, không có role / isAdmin', async () => {
        expect(me.status, 'GET /api/me phải trả 200').toBe(200);
        expectSchema(me, schemas.me, 'Body /api/me');
        expect(Object.keys(me.body).sort(), 'Body /api/me chỉ được có 7 khoá theo REQ-35')
          .toEqual(['address', 'avatarUrl', 'config', 'email', 'id', 'name', 'phone']);
        expect((me.body as MeResponse).id, 'id phải do server sinh, không lấy từ body đăng ký').not.toBe(customId);
      });
    },
  );

  const ATTACK_NAMES = [
    { key: 'a', label: 'XSS', name: '<script>alert(1)</script>', suffix: 'xss', offset: 41 },
    { key: 'b', label: 'SQL injection', name: "Robert'); DROP TABLE users;--", suffix: 'sqli', offset: 42 },
    { key: 'c', label: 'NoSQL dạng chuỗi', name: '{"$gt":""}', suffix: 'nosql', offset: 43 },
    { key: 'd', label: 'chuỗi 10.000 ký tự', name: 'A'.repeat(10_000), suffix: 'long', offset: 44 },
  ];

  for (const variant of ATTACK_NAMES) {
    test(
      `Chuỗi tấn công và chuỗi rất dài ở name không gây lỗi máy chủ (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@security', '@boundary', '@needsverify'] },
      async ({ registerTracked, authApi }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_068',
          description:
            `Kiểm tra đăng ký với name là ${variant.label} thì hệ thống trả 201 hoặc 422, không 500, không treo quá `
            + '10 giây, không lộ stack trace; nếu đã tạo thì GET /api/me trả lại name đúng nguyên văn.',
          severity: Severity.CRITICAL,
        });

        const body = await test.step(`Arrange: Chuẩn bị name ${variant.label}`, async () => ({
          name: variant.name,
          email: authEmail(variant.offset, variant.suffix),
          password: PASSWORD,
        }));

        const result = await test.step('Act: Gửi POST /api/register', async () => registerTracked(body));

        await test.step('Assert: Trả 201 hoặc 422 có fields.name, không 500, không treo, không lộ máy chủ', async () => {
          expect([201, 422], `Status phải là 201 hoặc 422, thực tế ${result.status}`).toContain(result.status);
          expectWithinSla(result, 10_000);
          expectNoSensitiveData(result, [PASSWORD]);
          if (result.status === 422) {
            expect((result.body as ErrorResponse).fields?.name, '422 phải chỉ ra lỗi ở fields.name').toBeDefined();
          }
        });

        if (result.status !== 201) {
          return;
        }

        const me = await test.step('Act: Đăng nhập rồi gọi GET /api/me', async () => {
          const login = await authApi.login({ email: body.email, password: PASSWORD });
          expect(login.status, 'Tài khoản vừa tạo phải đăng nhập được').toBe(200);
          return authApi.me(login.body.accessToken);
        });

        await test.step('Assert: name trả về bằng đúng chuỗi đã gửi — không cắt, không mã hoá HTML', async () => {
          expect(me.status, 'GET /api/me phải trả 200').toBe(200);
          expect(me.body.name, 'name phải được lưu và trả lại nguyên văn').toBe(variant.name);
        });
      },
    );
  }
});
