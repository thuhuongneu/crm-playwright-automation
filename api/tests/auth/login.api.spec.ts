import { test, expect } from '../../fixtures/api.fixture';
import { ErrorResponse } from '../../models/auth.model';
import { schemas } from '../../models/auth.schema';
import {
  expectNoSensitiveData,
  expectNoSetCookie,
  expectSchema,
  expectWithinSla,
} from '../../support/api-assertions';
import { recordLedger } from '../../support/data-ledger';
import { allureMeta, Severity } from '../../../src/utils/allure';
import { authEmail, authName, errorBodies, INVALID_EMAILS, messages, PASSWORD, runT } from '../../test-data/auth.data';

/** JWT: đúng 3 đoạn base64url */
const JWT_SEGMENT = /^[A-Za-z0-9_-]+$/;

test.describe('API Đăng nhập — POST /api/login', () => {
  test(
    'Đăng nhập thành công trả đủ msg, accessToken, exp',
    { tag: ['@api', '@auth', '@smoke', '@criticalpath'] },
    async ({ authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_069',
        description:
          'Kiểm tra đăng nhập bằng email + mật khẩu đúng của userA thì hệ thống trả 200, body có đủ msg chứa '
          + '"Login successfully", accessToken là JWT 3 đoạn base64url và exp không rỗng.',
        severity: Severity.BLOCKER,
      });

      await test.step('Arrange: userA đã được đăng ký ở global-setup', async () => {
        expect(userA.email, 'Phải có email của userA').toContain('_a@auto.test');
      });

      const result = await test.step('Act: Gửi POST /api/login bằng tài khoản userA', async () =>
        authApi.login({ email: userA.email, password: userA.password }));

      await test.step('Assert: Trả 200, body có đủ 3 khoá kiểu string', async () => {
        expect(result.status, 'Đăng nhập đúng phải trả 200').toBe(200);
        expectSchema(result, schemas.loginSuccess, 'Body 200');
        expect(result.body.msg, 'msg phải chứa "Login successfully"').toContain(messages.loginOk);
        expect(result.body.exp, 'exp không được rỗng').not.toBe('');
        expectWithinSla(result);
        expectNoSensitiveData(result, [userA.password]);
      });

      await test.step('Assert: accessToken đúng 3 đoạn base64url', async () => {
        const segments = result.body.accessToken.split('.');
        expect(segments.length, 'accessToken phải có đúng 3 đoạn ngăn bởi dấu "."').toBe(3);
        for (const segment of segments) {
          expect(JWT_SEGMENT.test(segment), 'Mỗi đoạn chỉ gồm ký tự base64url').toBe(true);
        }
      });
    },
  );

  const CONTENT_TYPES = [
    { key: 'a', encoding: 'json' },
    { key: 'b', encoding: 'multipart' },
    { key: 'c', encoding: 'form' },
  ] as const;

  for (const variant of CONTENT_TYPES) {
    test(
      `Đăng nhập nhận đủ 3 content-type khai trong spec (biến thể ${variant.key}: ${variant.encoding})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_070',
          description:
            `Kiểm tra POST /api/login bằng tài khoản userA, body mã hoá ${variant.encoding}, thì hệ thống trả 200, `
            + 'msg chứa "Login successfully" và có accessToken.',
          severity: Severity.NORMAL,
        });

        const body = await test.step('Arrange: Chuẩn bị email + mật khẩu của userA', async () => ({
          email: userA.email,
          password: userA.password,
        }));

        const result = await test.step(`Act: Gửi POST /api/login mã hoá ${variant.encoding}`, async () =>
          authApi.login(body, variant.encoding));

        await test.step('Assert: Trả 200, msg "Login successfully", có accessToken', async () => {
          expect(result.status, `Content-type ${variant.encoding} phải được nhận, trả 200`).toBe(200);
          expectSchema(result, schemas.loginSuccess, 'Body 200');
          expect(result.body.msg, 'msg phải chứa "Login successfully"').toContain(messages.loginOk);
          expect(result.body.accessToken, 'Phải có accessToken').not.toBe('');
          expectWithinSla(result);
        });
      },
    );
  }

  test(
    'Access token từ đăng nhập dùng được và trỏ đúng tài khoản',
    { tag: ['@api', '@auth', '@smoke', '@security'] },
    async ({ authApi, userA, userB }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_071',
        description:
          'Kiểm tra token của userA gọi GET /api/me trả đúng email userA, token của userB trả đúng email userB — '
          + 'token của ai trả dữ liệu người đó, không lẫn.',
        severity: Severity.CRITICAL,
      });

      // Theo đúng thứ tự TC: dùng tokenA xong mới đăng nhập userB — cookie của B chưa có trong context khi gọi bằng tokenA
      const tokenA = await test.step('Arrange: Đăng nhập userA lấy access token', async () => {
        const loginA = await authApi.login({ email: userA.email, password: userA.password });
        expect(loginA.status, 'userA phải đăng nhập được').toBe(200);
        return loginA.body.accessToken;
      });

      const meA = await test.step('Act: Gọi GET /api/me bằng token của userA', async () => authApi.me(tokenA));

      await test.step('Assert: /api/me trả đúng email userA', async () => {
        expect(meA.status, 'GET /api/me bằng tokenA phải trả 200').toBe(200);
        expectSchema(meA, schemas.me, 'Body /api/me');
        expect(meA.body.email, 'Token của userA phải trả dữ liệu userA').toBe(userA.email);
        expectWithinSla(meA);
        expectNoSensitiveData(meA, [userA.password]);
      });

      const meB = await test.step('Act: Đăng nhập userB rồi gọi GET /api/me bằng token của userB', async () => {
        const loginB = await authApi.login({ email: userB.email, password: userB.password });
        expect(loginB.status, 'userB phải đăng nhập được').toBe(200);
        return authApi.me(loginB.body.accessToken);
      });

      await test.step('Assert: /api/me trả đúng email userB', async () => {
        expect(meB.status, 'GET /api/me bằng tokenB phải trả 200').toBe(200);
        expect(meB.body.email, 'Token của userB phải trả dữ liệu userB').toBe(userB.email);
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
      `Email đăng nhập không phân biệt hoa thường (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_072',
          description:
            `Kiểm tra đăng nhập bằng email userA ${variant.label} thì vẫn trả 200 có accessToken, và GET /api/me `
            + 'bằng token đó trả email chữ thường của userA.',
          severity: Severity.NORMAL,
        });

        const email = await test.step(`Arrange: Chuẩn bị email userA ${variant.label}`, async () =>
          variant.transform(userA.email));

        const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login({ email, password: PASSWORD }));

        await test.step('Assert: Trả 200, có accessToken', async () => {
          expect(result.status, 'Email khác hoa thường vẫn phải đăng nhập được').toBe(200);
          expectSchema(result, schemas.loginSuccess, 'Body 200');
          expectWithinSla(result);
        });

        await test.step('Assert: GET /api/me trả email chữ thường của userA', async () => {
          const me = await authApi.me(result.body.accessToken);
          expect(me.status, 'GET /api/me phải trả 200').toBe(200);
          expect(me.body.email, 'Email lưu trong hệ thống phải là chữ thường').toBe(userA.email);
        });
      },
    );
  }

  const WRONG_PASSWORDS = [
    { key: 'a', label: 'sai hẳn', password: 'Sai@12345' },
    { key: 'b', label: 'chỉ khác hoa thường', password: 'auto@12345' },
    { key: 'c', label: 'thừa dấu cách cuối', password: 'Auto@12345 ' },
  ];

  for (const variant of WRONG_PASSWORDS) {
    test(
      `Sai mật khẩu bị từ chối, không mở phiên (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_073',
          description:
            `Kiểm tra đăng nhập userA với mật khẩu ${variant.label} thì hệ thống trả 400 với body "Invalid password." `
            + 'đúng nguyên văn và không set cookie.',
          severity: Severity.CRITICAL,
        });

        const body = await test.step(`Arrange: Chuẩn bị email userA và mật khẩu ${variant.label}`, async () => ({
          email: userA.email,
          password: variant.password,
        }));

        const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login(body));

        await test.step('Assert: Trả 400 với body đúng nguyên văn "Invalid password."', async () => {
          expect(result.status, 'Sai mật khẩu phải trả 400').toBe(400);
          expect(result.body, 'Body phải đúng nguyên văn lỗi sai mật khẩu').toEqual(errorBodies.invalidPassword);
          expectWithinSla(result);
        });

        await test.step('Assert: Không có Set-Cookie', async () => {
          expectNoSetCookie(result);
        });
      },
    );
  }

  test(
    'Email chưa đăng ký bị từ chối (biến thể a: chưa từng đăng ký)',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ authApi }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_074',
        description:
          'Kiểm tra đăng nhập bằng email chưa từng đăng ký thì hệ thống trả 404 với body "User not found." '
          + 'đúng nguyên văn và không set cookie.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị email chưa từng đăng ký', async () => ({
        email: authEmail(35, 'none'),
        password: PASSWORD,
      }));

      const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login(body));

      await test.step('Assert: Trả 404 với body đúng nguyên văn "User not found.", không Set-Cookie', async () => {
        expect(result.status, 'Email chưa đăng ký phải trả 404').toBe(404);
        expect(result.body, 'Body phải đúng nguyên văn lỗi không tìm thấy').toEqual(errorBodies.userNotFound);
        expectNoSetCookie(result);
        expectWithinSla(result);
      });
    },
  );

  test(
    'Tài khoản đã xoá bị từ chối khi đăng nhập (biến thể b: tài khoản vừa xoá)',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ authApi, userApi, registerTracked }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_074',
        description:
          'Kiểm tra userC đăng ký rồi tự xoá bằng token của chính nó, sau đó đăng nhập lại thì hệ thống trả 404 '
          + 'với body "User not found." đúng nguyên văn và không set cookie.',
        severity: Severity.CRITICAL,
      });

      const userC = { name: authName(36), email: authEmail(36, 'c'), password: PASSWORD };

      await test.step('Arrange: Đăng ký userC rồi xoá bằng token của chính nó', async () => {
        expect((await registerTracked(userC)).status, 'Đăng ký userC phải trả 201').toBe(201);
        const login = await authApi.login({ email: userC.email, password: userC.password });
        expect(login.status, 'userC phải đăng nhập được trước khi xoá').toBe(200);
        const me = await authApi.me(login.body.accessToken);
        expect(me.body.email, 'Token phải trỏ đúng userC trước khi xoá').toBe(userC.email);
        const removed = await userApi.deleteUser(me.body.id, login.body.accessToken);
        expect(removed.status, 'userC tự xoá chính nó phải trả 200').toBe(200);
        recordLedger({ action: 'deleted', email: userC.email, source: 'BK_AUTH_TC_074-b' });
      });

      const result = await test.step('Act: Gửi POST /api/login bằng tài khoản vừa xoá', async () =>
        authApi.login({ email: userC.email, password: userC.password }));

      await test.step('Assert: Trả 404 với body đúng nguyên văn "User not found.", không Set-Cookie', async () => {
        expect(result.status, 'Tài khoản đã xoá phải trả 404').toBe(404);
        expect(result.body, 'Body phải đúng nguyên văn lỗi không tìm thấy').toEqual(errorBodies.userNotFound);
        expectNoSetCookie(result);
        expectWithinSla(result);
      });
    },
  );

  test(
    'Thiếu email khi đăng nhập bị từ chối với lỗi thiếu field — Chờ chốt AMB-BK-AUTH-03',
    { tag: ['@api', '@auth', '@regression', '@pendingamb'] },
    async ({ authApi }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_075',
        description:
          'Kiểm tra POST /api/login chỉ có password thì hệ thống trả 422 và fields.email báo thiếu field. '
          + 'Dự kiến FAIL theo hiện trạng F-19 (server lấy default user@example.com, trả 400) — chờ chốt AMB-BK-AUTH-03.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị body chỉ có password', async () => ({ password: PASSWORD }));

      // Gửi đúng 1 lần mỗi lượt — mỗi lần là một lần đăng nhập sai vào tài khoản không do QA sở hữu
      const result = await test.step('Act: Gửi POST /api/login (đúng 1 lần)', async () => authApi.login(body));

      await test.step('Assert: Trả 422, fields.email báo thiếu field email', async () => {
        expect(result.status, `Thiếu email phải bị từ chối với 422, thực tế msg: ${(result.body as unknown as ErrorResponse).msg}`).toBe(422);
        const emailErrors = (result.body as unknown as ErrorResponse).fields?.email ?? [];
        expect(emailErrors.some(m => m.includes("Expected property 'email'")), 'fields.email phải báo thiếu field').toBe(true);
      });
    },
  );

  test(
    'Thiếu password khi đăng nhập bị từ chối',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_076',
        description:
          'Kiểm tra POST /api/login chỉ có email của userA thì hệ thống trả 422 "Invalid data.", fields.password '
          + 'báo thiếu field và không set cookie.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị body chỉ có email của userA', async () => ({ email: userA.email }));

      const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login(body));

      await test.step('Assert: Trả 422, fields.password báo thiếu field, không Set-Cookie', async () => {
        expect(result.status, 'Thiếu password phải trả 422').toBe(422);
        expectSchema(result, schemas.error, 'Body 422');
        const error = result.body as unknown as ErrorResponse;
        expect(error.msg, 'msg phải là "Invalid data."').toBe(messages.invalidData);
        expect(error.fields.password, 'fields.password phải chứa lỗi thiếu field').toContain(messages.passwordMissing);
        expectNoSetCookie(result);
        expectWithinSla(result);
      });
    },
  );

  for (const variant of INVALID_EMAILS.slice(0, 4)) {
    test(
      `Email sai định dạng bị từ chối khi đăng nhập (biến thể ${variant.key}: ${variant.email})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ authApi }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_077',
          description:
            `Kiểm tra POST /api/login với email sai định dạng "${variant.email}" thì hệ thống trả 422 và fields.email `
            + `chứa "${messages.invalidEmail}".`,
          severity: Severity.CRITICAL,
        });

        const body = await test.step('Arrange: Chuẩn bị email sai định dạng', async () => ({
          email: variant.email,
          password: PASSWORD,
        }));

        const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login(body));

        await test.step(`Assert: Trả 422, fields.email chứa "${messages.invalidEmail}"`, async () => {
          expect(result.status, 'Email sai định dạng phải trả 422').toBe(422);
          expectSchema(result, schemas.error, 'Body 422');
          expect((result.body as unknown as ErrorResponse).fields.email, 'fields.email phải báo sai định dạng')
            .toContain(messages.invalidEmail);
          expectWithinSla(result);
        });
      },
    );
  }

  test(
    'Cookie refetchToken được set với đủ cờ bảo mật',
    { tag: ['@api', '@auth', '@security', '@regression'] },
    async ({ authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_078',
        description:
          'Kiểm tra đăng nhập hợp lệ thì response có đúng một Set-Cookie refetchToken không rỗng, mang đủ HttpOnly, '
          + 'Secure, SameSite=Strict, Path=/ và có thuộc tính Max-Age.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị email + mật khẩu của userA', async () => ({
        email: userA.email,
        password: userA.password,
      }));

      const result = await test.step('Act: Gửi POST /api/login hợp lệ', async () => authApi.login(body));

      await test.step('Assert: Có đúng một Set-Cookie refetchToken không rỗng', async () => {
        expect(result.status, 'Đăng nhập phải trả 200').toBe(200);
        expect(result.cookies('refetchToken').length, 'Phải có đúng một cookie refetchToken').toBe(1);
        expect(result.cookies('refetchToken')[0].value, 'Giá trị refetchToken không được rỗng').not.toBe('');
      });

      await test.step('Assert: Cookie có đủ HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age', async () => {
        const attrs = result.cookies('refetchToken')[0].attributes;
        expect(attrs.has('httponly'), 'Phải có cờ HttpOnly').toBe(true);
        expect(attrs.has('secure'), 'Phải có cờ Secure').toBe(true);
        expect(attrs.get('samesite')?.toLowerCase(), 'SameSite phải là Strict').toBe('strict');
        expect(attrs.get('path'), 'Path phải là /').toBe('/');
        expect(attrs.has('max-age'), 'Phải có thuộc tính Max-Age').toBe(true);
      });
    },
  );

  test(
    'Cookie accessToken mang cùng giá trị với accessToken trong body',
    { tag: ['@api', '@auth', '@regression'] },
    async ({ authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_079',
        description:
          'Kiểm tra đăng nhập hợp lệ thì giá trị cookie accessToken trong Set-Cookie bằng đúng từng ký tự '
          + 'body.accessToken của cùng response.',
        severity: Severity.NORMAL,
      });

      const body = await test.step('Arrange: Chuẩn bị email + mật khẩu của userA', async () => ({
        email: userA.email,
        password: userA.password,
      }));

      const result = await test.step('Act: Gửi POST /api/login hợp lệ', async () => authApi.login(body));

      await test.step('Assert: Có cookie accessToken và bằng đúng body.accessToken', async () => {
        expect(result.status, 'Đăng nhập phải trả 200').toBe(200);
        const cookie = result.cookies('accessToken');
        expect(cookie.length, 'Phải có Set-Cookie accessToken').toBe(1);
        expect(cookie[0].value === result.body.accessToken, 'Cookie accessToken phải bằng body.accessToken').toBe(true);
      });
    },
  );

  test(
    'Cookie accessToken có cờ HttpOnly, Secure, SameSite',
    { tag: ['@api', '@auth', '@security', '@knownbug'] },
    async ({ authApi, userA }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_080',
        description:
          'Kiểm tra cookie accessToken do đăng nhập set có đủ HttpOnly, Secure, SameSite (Strict hoặc Lax). '
          + 'KnownBug F-03 — dự kiến FAIL, AMB-BK-AUTH-04 đã chốt yêu cầu áp dụng nên không hạ kỳ vọng.',
        severity: Severity.CRITICAL,
      });

      const body = await test.step('Arrange: Chuẩn bị email + mật khẩu của userA', async () => ({
        email: userA.email,
        password: userA.password,
      }));

      const result = await test.step('Act: Gửi POST /api/login hợp lệ', async () => authApi.login(body));

      await test.step('Assert: Cookie accessToken có đủ HttpOnly, Secure, SameSite Strict/Lax', async () => {
        expect(result.status, 'Đăng nhập phải trả 200').toBe(200);
        const cookie = result.cookies('accessToken');
        expect(cookie.length, 'Phải có Set-Cookie accessToken').toBe(1);
        const attrs = cookie[0].attributes;
        expect.soft(attrs.has('httponly'), 'Cookie accessToken phải có cờ HttpOnly').toBe(true);
        expect.soft(attrs.has('secure'), 'Cookie accessToken phải có cờ Secure').toBe(true);
        expect.soft(['strict', 'lax'], 'SameSite phải là Strict hoặc Lax').toContain(attrs.get('samesite')?.toLowerCase());
      });
    },
  );

  const ATTACK_PASSWORDS: { key: string; label: string; password: unknown }[] = [
    { key: 'a', label: "SQLi ' OR '1'='1", password: "' OR '1'='1" },
    { key: 'b', label: "SQLi ' OR 1=1--", password: "' OR 1=1--" },
    { key: 'c', label: 'object NoSQL {"$ne":null}', password: { $ne: null } },
    { key: 'd', label: 'chuỗi 10.000 ký tự', password: 'A'.repeat(10_000) },
  ];

  for (const variant of ATTACK_PASSWORDS) {
    test(
      `Chuỗi tấn công ở password không vượt được đăng nhập (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@security', '@needsverify'] },
      async ({ authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_081',
          description:
            `Kiểm tra đăng nhập userA với password là ${variant.label} thì hệ thống không trả 200, không có accessToken, `
            + 'chỉ trả 400 "Invalid password." hoặc 422 "Invalid data.", không 500 và không lộ stack trace.',
          severity: Severity.CRITICAL,
        });

        const body = await test.step(`Arrange: Chuẩn bị email userA và password ${variant.label}`, async () => ({
          email: userA.email,
          password: variant.password,
        }));

        const result = await test.step('Act: Gửi POST /api/login', async () => authApi.login(body));

        await test.step('Assert: Không đăng nhập được, chỉ trả 400 hoặc 422, không lộ máy chủ', async () => {
          expect([400, 422], `Status phải là 400 hoặc 422, thực tế ${result.status}`).toContain(result.status);
          expect('accessToken' in (result.body as object), 'Không được có accessToken').toBe(false);
          const expectedMsg = result.status === 400 ? 'Invalid password.' : messages.invalidData;
          expect((result.body as unknown as ErrorResponse).msg, `msg phải là "${expectedMsg}"`).toBe(expectedMsg);
          expectNoSensitiveData(result);
          expectWithinSla(result);
        });
      },
    );
  }

  test(
    'Tài khoản vừa đăng ký đăng nhập được ngay',
    { tag: ['@api', '@auth', '@smoke', '@criticalpath'] },
    async ({ authApi, registerTracked }) => {
      await allureMeta({
        testId: 'BK_AUTH_TC_106',
        description:
          'Kiểm tra đăng ký tài khoản mới rồi đăng nhập ngay bằng đúng email + mật khẩu đó thì trả 200 có accessToken '
          + '— không cần kích hoạt hay chờ.',
        severity: Severity.BLOCKER,
      });

      const account = { name: `Auto Auth API New ${runT + 48}`, email: authEmail(48, 'new'), password: PASSWORD };

      await test.step('Arrange: Đăng ký tài khoản mới', async () => {
        const register = await registerTracked(account);
        expect(register.status, 'Đăng ký phải trả 201').toBe(201);
        expect((register.body as { msg: string }).msg, 'msg phải chứa "Register successfully"').toContain(messages.registerOk);
      });

      const result = await test.step('Act: Đăng nhập ngay bằng email + mật khẩu vừa đăng ký', async () =>
        authApi.login({ email: account.email, password: account.password }));

      await test.step('Assert: Trả 200, có accessToken không rỗng', async () => {
        expect(result.status, 'Tài khoản vừa đăng ký phải đăng nhập được ngay').toBe(200);
        expectSchema(result, schemas.loginSuccess, 'Body 200');
        expect(result.body.accessToken, 'accessToken không được rỗng').not.toBe('');
        expectWithinSla(result);
      });
    },
  );

  const AUTH_HEADERS: { key: string; label: string; headers: Record<string, string> }[] = [
    { key: 'a', label: 'không gửi header Authorization', headers: {} },
    { key: 'b', label: 'gửi token rác', headers: { Authorization: 'Bearer abc.def.ghi' } },
  ];

  for (const variant of AUTH_HEADERS) {
    test(
      `Đăng nhập là endpoint công khai, không phụ thuộc header Authorization (biến thể ${variant.key}: ${variant.label})`,
      { tag: ['@api', '@auth', '@regression', '@needsverify'] },
      async ({ authApi, userA }) => {
        await allureMeta({
          testId: 'BK_AUTH_TC_107',
          description:
            `Kiểm tra đăng nhập userA khi ${variant.label} thì vẫn trả 200 có accessToken — không bị 401 vì spec `
            + 'khai security: [].',
          severity: Severity.CRITICAL,
        });

        const body = await test.step('Arrange: Chuẩn bị email + mật khẩu của userA', async () => ({
          email: userA.email,
          password: userA.password,
        }));

        const result = await test.step(`Act: Gửi POST /api/login, ${variant.label}`, async () =>
          authApi.login(body, 'json', variant.headers));

        await test.step('Assert: Trả 200, có accessToken, không bị 401', async () => {
          expect(result.status, 'Đăng nhập công khai không được bị 401').toBe(200);
          expectSchema(result, schemas.loginSuccess, 'Body 200');
          expectWithinSla(result);
        });
      },
    );
  }
});
