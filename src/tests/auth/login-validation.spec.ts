import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/base.fixture';
import { LoginPage } from '../../pages/login.page';
import { absoluteUrl, env, routes } from '../../utils/env.config';
import { allureMeta, Severity } from '../../utils/allure';
import { TestData } from '../../utils/test-data';

const LOGIN_URL = absoluteUrl(routes.login);
const DASHBOARD_URL = absoluteUrl(routes.dashboardPath);
const INVALID_CREDENTIALS = 'Invalid email or password';
const PASSWORD_REQUIRED = 'The Password field is required.';
const EMAIL_REQUIRED = 'The Email Address field is required.';
const LOCKOUT_WORDS = /locked|blocked|too many|try again in/i;
const DATABASE_ERROR = /database error|sql syntax|mysqli|PDOException|Fatal error/i;

/** Ký hiệu `·` trong TC = 1 dấu cách */
const REQUIRED_FIELD_VARIANTS = [
  { key: 'a', name: 'rỗng cả hai', email: '', password: '', expected: [PASSWORD_REQUIRED, EMAIL_REQUIRED], smoke: true },
  { key: 'b', name: 'rỗng riêng Email', email: '', password: 'Abc12345', expected: [EMAIL_REQUIRED], smoke: false },
  { key: 'c', name: 'rỗng riêng Password', email: 'useAccount', password: '', expected: [PASSWORD_REQUIRED], smoke: false },
  { key: 'd', name: 'toàn khoảng trắng', email: '   ', password: '   ', expected: [PASSWORD_REQUIRED, EMAIL_REQUIRED], smoke: false },
];

const MALFORMED_EMAIL_VARIANTS = [
  { key: 'a', name: 'thiếu @', email: 'abc' },
  { key: 'b', name: 'thiếu tên miền', email: 'abc@' },
  { key: 'c', name: 'thiếu phần trước @', email: '@example.com' },
  { key: 'd', name: 'nhiều @', email: 'a@b@example.com' },
  { key: 'e', name: 'chuỗi tiêm SQL', email: "admin@example.com' OR '1'='1" },
];

const ATTACK_PASSWORD_VARIANTS = [
  {
    key: 'a', name: 'XSS', useAccount: false, password: '<script>alert(1)</script>',
    /** Chuỗi xuất hiện trong HTML phải ở dạng đã mã hoá, không phải thẻ <script> sống */
    rawMustNotAppear: '<script>alert(1)</script>',
  },
  { key: 'b', name: 'tiêm SQL', useAccount: true, password: "' OR 1=1--", rawMustNotAppear: undefined },
];

type FailureOutcome = { alerts: string[]; url: string };

/** Gửi một cặp sai, ghi lại 3 tiêu chí so sánh: nội dung dải lỗi · số lượng dải · URL */
async function submitAndRecordFailure(
  page: Page, loginPage: LoginPage, email: string, password: string): Promise<FailureOutcome> {
  await loginPage.open();
  await loginPage.fillCredentials(email, password);
  await loginPage.submitAndCaptureResponses();
  await expect(loginPage.errorAlert, 'Phải hiện dải báo lỗi sau khi gửi biểu mẫu').not.toHaveCount(0);
  return { alerts: await loginPage.errorAlert.allInnerTexts(), url: page.url() };
}

test.describe('Đăng nhập — kiểm tra dữ liệu đầu vào & đăng nhập thất bại', () => {
  for (const variant of REQUIRED_FIELD_VARIANTS) {
    test(
      `Kiểm tra trường bắt buộc trên biểu mẫu đăng nhập (biến thể ${variant.key}: ${variant.name})`,
      { tag: variant.smoke ? ['@smoke', '@regression', '@login'] : ['@regression', '@login'] },
      async ({ loginPage, page }) => {
        await allureMeta({
          testId: 'CRM_LOGIN_TC_011',
          description:
            `Kiểm tra gửi biểu mẫu với biến thể ${variant.key} (${variant.name}) thì hệ thống không cho vào Dashboard, `
            + `vẫn ở trang đăng nhập và hiện đúng các dải lỗi trường bắt buộc theo thứ tự: ${variant.expected.join(' → ')}.`
            + (variant.key === 'd'
              ? ' Lưu ý: ô Email là type=email nên trình duyệt tự bỏ khoảng trắng trước khi gửi — biến thể này chỉ kiểm '
                + 'được việc máy chủ cắt khoảng trắng ở ô Password.'
              : ''),
          severity: Severity.BLOCKER,
        });
        const email = variant.email === 'useAccount' ? env.username : variant.email;

        await test.step('Arrange: Mở trang đăng nhập', async () => {
          await loginPage.open();
        });

        await test.step(`Act: Gửi biểu mẫu với biến thể ${variant.key} (${variant.name})`, async () => {
          await loginPage.fillCredentials(email, variant.password);
          await loginPage.submitAndCaptureResponses();
        });

        await test.step('Assert: Hiện đúng số dải lỗi, đúng nội dung và thứ tự từ trên xuống', async () => {
          await expect(loginPage.errorAlert, `Phải có đúng ${variant.expected.length} dải lỗi theo thứ tự kỳ vọng`)
            .toHaveText(variant.expected);
          await expect(loginPage.errorAlert.filter({ hasText: INVALID_CREDENTIALS }),
            `Không được kèm dải "${INVALID_CREDENTIALS}"`).toHaveCount(0);
        });

        await test.step('Assert: Không vào được Dashboard, vẫn ở trang đăng nhập', async () => {
          await expect(page, 'Phải vẫn ở /admin/authentication').toHaveURL(LOGIN_URL);
          await expect(loginPage.loginButton, 'Biểu mẫu đăng nhập phải còn hiển thị').toBeVisible();
        });
      },
    );
  }

  for (const variant of MALFORMED_EMAIL_VARIANTS) {
    test(
      `Email sai định dạng bị trình duyệt chặn ngay, biểu mẫu không gửi đi (biến thể ${variant.key}: ${variant.name})`,
      { tag: ['@regression', '@boundary', '@security', '@techcheck', '@login'] },
      async ({ loginPage, page }) => {
        await allureMeta({
          testId: 'CRM_LOGIN_TC_012',
          description:
            `Kiểm tra email sai định dạng (biến thể ${variant.key}: ${variant.name}) bị trình duyệt chặn ngay: có bong bóng `
            + 'cảnh báo cạnh ô Email, trang không nạp lại, dữ liệu hai ô còn nguyên, không có request POST nào gửi đi.',
          severity: Severity.CRITICAL,
        });
        const password = 'Abc12345';
        const postRequests: string[] = [];

        await test.step('Arrange: Mở trang đăng nhập, theo dõi request POST và sự kiện chặn gửi', async () => {
          await loginPage.open();
          expect(await loginPage.isBrowserValidationEnabled(), 'Biểu mẫu không được mang novalidate').toBe(true);
          await loginPage.armSubmitBlockProbe();
          page.on('request', request => {
            if (request.method() === 'POST' && request.url() === LOGIN_URL) {
              postRequests.push(request.url());
            }
          });
        });

        await test.step(`Act: Nhập email sai định dạng (${variant.name}) rồi bấm Login`, async () => {
          await loginPage.fillCredentials(variant.email, password);
          await loginPage.submit();
        });

        await test.step('Assert: Trình duyệt chặn gửi và bật bong bóng cảnh báo ở ô Email', async () => {
          // Sự kiện invalid chỉ bắn khi trình duyệt CHẶN gửi biểu mẫu — nhờ đó các check "không nạp lại",
          // "không POST" bên dưới không thể đúng giả do chạy trước khi trang kịp chuyển
          await expect.poll(() => loginPage.emailInvalidEventCount(),
            'Trình duyệt phải chặn gửi biểu mẫu vì ô Email sai định dạng').toBeGreaterThan(0);
          expect(await loginPage.isEmailValidByBrowser(), 'Ô Email phải bị trình duyệt đánh dấu sai định dạng')
            .toBe(false);
          // Nội dung bong bóng do trình duyệt sinh, đổi theo ngôn ngữ — chỉ chấm CÓ hay KHÔNG
          expect(await loginPage.emailValidationMessage(), 'Phải có bong bóng cảnh báo cạnh ô Email').not.toBe('');
        });

        await test.step('Assert: Trang không nạp lại, dữ liệu còn nguyên, không có dải lỗi hệ thống', async () => {
          expect(await loginPage.isSameDocumentAsMarked(), 'Trang không được nạp lại').toBe(true);
          await expect(page, 'Phải vẫn ở /admin/authentication').toHaveURL(LOGIN_URL);
          await expect(loginPage.emailInput, 'Ô Email phải còn nguyên chữ đã nhập').toHaveValue(variant.email);
          await expect(loginPage.passwordInput, 'Ô Password phải còn nguyên chữ đã nhập').toHaveValue(password);
          await expect(loginPage.errorAlert, 'Không được hiện dải báo lỗi của hệ thống').toHaveCount(0);
        });

        await test.step('Assert: Ghi chú kỹ thuật — không có request POST /admin/authentication', async () => {
          expect(postRequests, 'Biểu mẫu không được gửi tới máy chủ').toEqual([]);
        });
      },
    );
  }

  test(
    'Sai thông tin đăng nhập trả về một thông báo chung, không tiết lộ email nào có thật',
    { tag: ['@smoke', '@regression', '@security', '@login'] },
    async ({ loginPage, page }) => {
      await allureMeta({
        testId: 'CRM_LOGIN_TC_013',
        description:
          'Kiểm tra hai lượt đăng nhập sai — (a) email có thật + mật khẩu sai, (b) email không tồn tại — đều trả đúng 1 dải '
          + `"${INVALID_CREDENTIALS}", vẫn ở trang đăng nhập, và hai kết quả giống hệt nhau nên không lộ email nào có thật.`,
        severity: Severity.BLOCKER,
      });
      const expected: FailureOutcome = { alerts: [INVALID_CREDENTIALS], url: LOGIN_URL };

      const existing = await test.step('Act: Biến thể a — email có thật, mật khẩu sai', () =>
        submitAndRecordFailure(page, loginPage, env.username, TestData.password()));

      await test.step('Assert: Biến thể a trả đúng 1 dải lỗi chung, vẫn ở trang đăng nhập', async () => {
        expect(existing, 'Biến thể a: nội dung dải · số lượng dải · URL không đúng kỳ vọng').toEqual(expected);
      });

      const unknown = await test.step('Act: Biến thể b — email không tồn tại', () =>
        submitAndRecordFailure(page, loginPage, TestData.email('tc013b'), TestData.password()));

      await test.step('Assert: Biến thể b trả đúng 1 dải lỗi chung, vẫn ở trang đăng nhập', async () => {
        expect(unknown, 'Biến thể b: nội dung dải · số lượng dải · URL không đúng kỳ vọng').toEqual(expected);
      });

      await test.step('Assert: Hai bộ kết quả giống hệt nhau ở cả 3 tiêu chí', async () => {
        expect(unknown, 'Kết quả email không tồn tại phải giống hệt email có thật (REQ-LOGIN-15)').toEqual(existing);
      });
    },
  );

  test(
    'Mật khẩu đúng nhưng sai kiểu chữ hoa/thường thì bị từ chối',
    { tag: ['@regression', '@security', '@login'] },
    async ({ loginPage, page }) => {
      // Metadata khai TRƯỚC skip để lượt skip vẫn mang testId trong Allure / RTM
      await allureMeta({
        testId: 'CRM_LOGIN_TC_014',
        description:
          'Kiểm tra đăng nhập bằng tài khoản staff với mật khẩu đúng nhưng đảo kiểu chữ hoa/thường thì bị từ chối: '
          + `đúng 1 dải "${INVALID_CREDENTIALS}", vẫn ở trang đăng nhập.`,
        severity: Severity.NORMAL,
      });
      test.skip(!env.tc014Email || !env.tc014Password,
        'Thiếu TC014_EMAIL / TC014_PASSWORD trong .env — cần staff có mật khẩu chứa chữ cái (RISK-LOGIN-07)');
      const email = env.tc014Email as string;
      const swappedPassword = TestData.swapCase(env.tc014Password as string);

      await test.step('Arrange: Mở trang đăng nhập', async () => {
        // So bằng boolean — KHÔNG đưa mật khẩu vào expect, khi fail sẽ in giá trị thật ra report
        expect(/\p{L}/u.test(env.tc014Password as string), 'Mật khẩu TC014 phải chứa chữ cái để đảo kiểu chữ có nghĩa')
          .toBe(true);
        await loginPage.open();
      });

      await test.step('Act: Đăng nhập bằng mật khẩu đã đảo kiểu chữ', async () => {
        await loginPage.fillCredentials(email, swappedPassword);
        await loginPage.submitAndCaptureResponses();
      });

      await test.step('Assert: Bị từ chối với đúng 1 dải lỗi chung, vẫn ở trang đăng nhập', async () => {
        await expect(loginPage.errorAlert, `Phải có đúng 1 dải "${INVALID_CREDENTIALS}"`).toHaveText([INVALID_CREDENTIALS]);
        await expect(page, 'Phải vẫn ở /admin/authentication').toHaveURL(LOGIN_URL);
      });
    },
  );

  const BRUTE_FORCE_VARIANTS = [
    {
      key: 'a', name: 'khoá theo email — 6 lần cùng tài khoản Admin',
      attempts: () => Array.from({ length: 6 }, () => ({ email: env.username, password: TestData.password() })),
    },
    {
      key: 'b', name: 'khoá theo IP — 5 lần với 5 email khác nhau',
      attempts: () => Array.from({ length: 5 }, (_, i) => ({ email: TestData.email(`tc015b_${i + 1}`), password: TestData.password() })),
    },
  ];

  for (const variant of BRUTE_FORCE_VARIANTS) {
    test(
      `Đăng nhập sai nhiều lần liên tiếp không làm khoá tài khoản và không chặn theo IP (biến thể ${variant.key}: ${variant.name})`,
      { tag: ['@regression', '@security', '@techcheck', '@login'] },
      async ({ loginPage, page }) => {
        await allureMeta({
          testId: 'CRM_LOGIN_TC_015',
          description:
            `Kiểm tra gửi sai liên tiếp (${variant.name}) thì mỗi lần đều trả đúng 1 dải "${INVALID_CREDENTIALS}" không đổi, `
            + 'không có thông báo khoá/hạn chế, không phản hồi 429, và ngay sau đó tài khoản Admin vẫn đăng nhập được.',
          severity: Severity.CRITICAL,
        });
        const attempts = variant.attempts();
        const statuses: number[] = [];

        await test.step(`Act: Gửi sai ${attempts.length} lần liên tiếp`, async () => {
          for (const [index, attempt] of attempts.entries()) {
            await test.step(`Lần sai thứ ${index + 1}`, async () => {
              await loginPage.open();
              await loginPage.fillCredentials(attempt.email, attempt.password);
              const { post, document } = await loginPage.submitAndCaptureResponses();
              statuses.push(post.status(), document.status());
              await expect(loginPage.errorAlert, `Lần ${index + 1}: phải đúng 1 dải "${INVALID_CREDENTIALS}", không đổi`)
                .toHaveText([INVALID_CREDENTIALS]);
            });
          }
        });

        await test.step('Assert: Sau lần cuối không có thông báo khoá / hạn chế nào', async () => {
          await expect(loginPage.body, 'Không được có các từ locked / blocked / too many / try again in')
            .not.toContainText(LOCKOUT_WORDS, { useInnerText: true });
        });

        await test.step('Act: Đăng nhập ngay bằng tài khoản Admin đúng', async () => {
          await loginPage.open();
          await loginPage.fillCredentials(env.username, env.password);
          const { post, document } = await loginPage.submitAndCaptureResponses();
          statuses.push(post.status(), document.status());
        });

        await test.step('Assert: Đăng nhập thành công, vào Dashboard', async () => {
          await expect(page, 'Tài khoản không bị khoá — phải vào được /admin/').toHaveURL(DASHBOARD_URL);
        });

        await test.step('Assert: Ghi chú kỹ thuật — không phản hồi nào trả HTTP 429', async () => {
          expect(statuses, 'Không phản hồi nào được trả 429 Too Many Requests').not.toContain(429);
        });
      },
    );
  }

  test(
    'Sau khi đăng nhập thất bại, ô Email phải còn giữ email vừa nhập',
    { tag: ['@regression', '@knownbug', '@techcheck', '@login'] },
    async ({ loginPage }) => {
      await allureMeta({
        testId: 'CRM_LOGIN_TC_016',
        description:
          'Kiểm tra sau khi đăng nhập sai mật khẩu, trang nạp lại vẫn giữ email vừa nhập trong ô Email. Chạy trong context '
          + 'trình duyệt mới (tương đương ẩn danh, không tự điền). Bug đã biết BUG_login_1787226514_TC016 (AMB-LOGIN-10) — '
          + 'FAIL là kết quả đúng hiện tại, KHÔNG hạ kỳ vọng.',
        severity: Severity.CRITICAL,
      });

      await test.step('Arrange: Mở trang đăng nhập', async () => {
        await loginPage.open();
      });

      const { document } = await test.step('Act: Đăng nhập bằng email Admin với mật khẩu sai', async () => {
        await loginPage.fillCredentials(env.username, TestData.password());
        return loginPage.submitAndCaptureResponses();
      });

      await test.step(`Assert: Hiện dải báo lỗi "${INVALID_CREDENTIALS}"`, async () => {
        await expect(loginPage.errorAlert, `Phải có đúng 1 dải "${INVALID_CREDENTIALS}"`).toHaveText([INVALID_CREDENTIALS]);
      });

      await test.step('Assert: Ô Email còn hiển thị email vừa nhập', async () => {
        await expect(loginPage.emailInput, 'Ô Email phải còn giữ email vừa nhập — người dùng không phải gõ lại')
          .toHaveValue(env.username);
      });

      await test.step('Assert: Ghi chú kỹ thuật — HTML máy chủ trả về có value cho input#email', async () => {
        expect(LoginPage.serverRenderedEmailValue(await document.text()),
          'Thẻ input#email trong HTML máy chủ trả về phải mang value bằng email vừa nhập').toBe(env.username);
      });
    },
  );

  for (const variant of ATTACK_PASSWORD_VARIANTS) {
    test(
      `Chuỗi tấn công nhập vào ô Password không vượt qua được xác thực và không được thực thi (biến thể ${variant.key}: ${variant.name})`,
      { tag: ['@regression', '@security', '@techcheck', '@login'] },
      async ({ loginPage, page }) => {
        await allureMeta({
          testId: 'CRM_LOGIN_TC_017',
          description:
            `Kiểm tra nhập chuỗi tấn công ${variant.name} vào ô Password thì không vào được Dashboard, không hộp thoại nào `
            + `bật lên, hiện dải "${INVALID_CREDENTIALS}", không lộ lỗi cơ sở dữ liệu, máy chủ không trả lỗi 5xx.`,
          severity: Severity.BLOCKER,
        });
        const email = variant.useAccount ? env.username : TestData.email(`tc017${variant.key}`);
        const dialogs: string[] = [];

        await test.step('Arrange: Mở trang đăng nhập, theo dõi hộp thoại bật lên', async () => {
          page.on('dialog', async dialog => {
            dialogs.push(dialog.type());
            await dialog.dismiss();
          });
          await loginPage.open();
        });

        const { post, document } = await test.step(`Act: Gửi chuỗi tấn công ${variant.name} ở ô Password`, async () => {
          await loginPage.fillCredentials(email, variant.password);
          return loginPage.submitAndCaptureResponses();
        });

        await test.step('Assert: Bị từ chối với dải lỗi chung, vẫn ở trang đăng nhập', async () => {
          await expect(loginPage.errorAlert, `Phải có đúng 1 dải "${INVALID_CREDENTIALS}"`).toHaveText([INVALID_CREDENTIALS]);
          await expect(page, 'Không được vào Dashboard, phải vẫn ở /admin/authentication').toHaveURL(LOGIN_URL);
        });

        await test.step('Assert: Không hộp thoại nào bật lên, không lộ lỗi cơ sở dữ liệu hay mã lạ', async () => {
          expect(dialogs, 'Không được có hộp thoại nào bật lên').toEqual([]);
          // useInnerText: chỉ chấm chữ HIỂN THỊ ra màn hình, không tính phần tử ẩn
          await expect(loginPage.body, 'Không được hiện thông báo lỗi cơ sở dữ liệu')
            .not.toContainText(DATABASE_ERROR, { useInnerText: true });
          await expect(loginPage.body, 'Không được hiện đoạn mã lạ ra màn hình')
            .not.toContainText(variant.password, { useInnerText: true });
        });

        await test.step('Assert: Ghi chú kỹ thuật — máy chủ không lỗi 5xx, không phản chiếu thẻ <script> sống', async () => {
          expect(post.status(), 'POST /admin/authentication không được trả lỗi máy chủ 5xx').toBeLessThan(500);
          expect(document.status(), 'Trang đăng nhập nạp lại phải trả HTTP 200').toBe(200);
          if (variant.rawMustNotAppear) {
            expect(await document.text(), 'HTML không được chứa thẻ <script> sống của chuỗi tấn công')
              .not.toContain(variant.rawMustNotAppear);
          }
        });
      },
    );
  }

  test(
    'Mật khẩu chứa ký tự đa ngôn ngữ và emoji không làm hệ thống lỗi máy chủ',
    { tag: ['@regression', '@boundary', '@localization', '@techcheck', '@login'] },
    async ({ loginPage, page }) => {
      await allureMeta({
        testId: 'CRM_LOGIN_TC_018',
        description:
          'Kiểm tra mật khẩu chứa tiếng Việt có dấu và emoji thì trang nạp lại bình thường về trang đăng nhập, '
          + `hiện đúng 1 dải "${INVALID_CREDENTIALS}" không vỡ ký tự, máy chủ không trả lỗi 5xx.`,
        severity: Severity.NORMAL,
      });

      await test.step('Arrange: Mở trang đăng nhập', async () => {
        await loginPage.open();
      });

      const { post, document } = await test.step('Act: Gửi email không tồn tại với mật khẩu tiếng Việt + emoji', async () => {
        await loginPage.fillCredentials(TestData.email('tc018'), 'MậtKhẩuTiếngViệt😀🎉');
        return loginPage.submitAndCaptureResponses();
      });

      await test.step('Assert: Trang nạp lại bình thường về trang đăng nhập', async () => {
        await expect(page, 'Phải về đúng /admin/authentication').toHaveURL(LOGIN_URL);
        await expect(loginPage.loginButton, 'Biểu mẫu đăng nhập phải hiển thị — không trang trắng').toBeVisible();
      });

      await test.step('Assert: Đúng 1 dải lỗi tiếng Anh, không vỡ ký tự', async () => {
        await expect(loginPage.errorAlert, `Phải có đúng 1 dải "${INVALID_CREDENTIALS}", hiển thị nguyên vẹn`)
          .toHaveText([INVALID_CREDENTIALS]);
        await expect(loginPage.body, 'Không được có ký tự thay thế lỗi mã hoá (U+FFFD)')
          .not.toContainText('�', { useInnerText: true });
      });

      await test.step('Assert: Ghi chú kỹ thuật — máy chủ không trả lỗi 500', async () => {
        expect(post.status(), 'POST /admin/authentication không được trả lỗi máy chủ 5xx').toBeLessThan(500);
        expect(document.status(), 'Trang đăng nhập nạp lại phải trả HTTP 200').toBe(200);
      });
    },
  );
});
