import { Page, Locator, Response, test } from '@playwright/test';
import { BasePage } from './base.page';
import { routes } from '../utils/env.config';

const REMEMBER_ME_COOKIE = 'autologin';
const THIRD_PARTY_LOGIN = /google|facebook|microsoft|sign in with|continue with/i;

/**
 * Trang đăng nhập Perfex CRM — /admin/authentication
 * Locator lấy từ DOM thật (label "Email Address" / "Password" / "Remember me", button submit "Login").
 */
export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly logoLink: Locator;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly rememberMeLabel: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  /**
   * Mọi dải báo lỗi đỏ. Lỗi validate nằm thẳng trong <form>, lỗi sai thông tin nằm trong #alerts —
   * hệ thống không gắn role, chỉ chung class bootstrap alert-danger.
   */
  readonly errorAlert: Locator;
  readonly pageExpiredMessage: Locator;
  readonly buttons: Locator;
  readonly submitButtons: Locator;
  readonly thirdPartyLoginEntries: Locator;
  readonly captchaElements: Locator;
  readonly scripts: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Login', exact: true, level: 1 });
    this.logoLink = page.getByRole('link', { name: 'Perfex CRM | Anh Tester Demo' });
    this.form = page.locator('form');
    this.emailInput = page.getByLabel('Email Address');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
    this.rememberMeLabel = page.getByText('Remember me', { exact: true });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.errorAlert = page.locator('.alert-danger');
    this.pageExpiredMessage = page.getByText('419 Page Expired!');
    this.buttons = page.getByRole('button');
    this.submitButtons = page.locator('button[type=submit], input[type=submit]');
    this.thirdPartyLoginEntries = page.getByRole('button', { name: THIRD_PARTY_LOGIN })
      .or(page.getByRole('link', { name: THIRD_PARTY_LOGIN }));
    this.captchaElements = page.locator('.g-recaptcha, [class*=captcha], iframe[src*=recaptcha]');
    this.scripts = page.locator('script');
  }

  async open(): Promise<Response | null> {
    return this.goto(routes.login);
  }

  /** Mở thẳng URL đăng xuất để kết thúc mọi phiên còn sót */
  async endSessionViaLogoutUrl(): Promise<void> {
    await test.step('Mở URL đăng xuất để kết thúc phiên còn sót', () => this.goto(routes.logout));
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    // Tên step tĩnh: không đưa email (tài khoản thật / chuỗi tấn công) vào report và artifact CI
    await test.step('Nhập email', () => this.fillField(this.emailInput, email));
    await this.fillPassword(password);
  }

  async fillPassword(password: string): Promise<void> {
    await test.step('Nhập mật khẩu', () => this.fillField(this.passwordInput, password));
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async submit(): Promise<void> {
    await test.step('Bấm nút Login', () => this.clickWhenReady(this.loginButton));
  }

  /**
   * Bấm Login và bắt hai phản hồi của lượt gửi:
   * - `post`: phản hồi POST biểu mẫu — 303 khi xác thực xong, 200 khi lỗi validate trả thẳng trang
   * - `document`: trang tài liệu cuối cùng trình duyệt hiển thị (không phải bước chuyển hướng 3xx) —
   *   HTML do máy chủ trả về. Lỗi validate thì chính là `post`; sau 303 là lượt GET kế tiếp.
   */
  async submitAndCaptureResponses(): Promise<{ post: Response; document: Response }> {
    return test.step('Bấm nút Login', async () => {
      const loginUrl = new URL(routes.login, this.page.url()).href;
      const postPromise = this.page.waitForResponse(
        r => r.request().method() === 'POST' && r.url() === loginUrl,
      );
      const documentPromise = this.page.waitForResponse(
        r => r.request().isNavigationRequest()
          && r.request().frame() === this.page.mainFrame()
          && (r.status() < 300 || r.status() >= 400),
      );
      // Chờ DOMContentLoaded của TÀI LIỆU MỚI — waitForLoadState sau khi có response có thể trả về ngay theo trang cũ
      const newDocumentPromise = this.page.waitForEvent('domcontentloaded');
      const [post, document] = await Promise.all([
        postPromise,
        documentPromise,
        newDocumentPromise,
        this.clickWhenReady(this.loginButton),
      ]);
      return { post, document };
    });
  }

  /**
   * Đánh dấu tài liệu đang mở (trang nạp lại thì dấu mất) và gắn bộ đếm sự kiện `invalid` của ô Email.
   * Trình duyệt chỉ bắn `invalid` khi CHẶN gửi biểu mẫu vì ràng buộc — bằng chứng biểu mẫu không đi.
   */
  async armSubmitBlockProbe(): Promise<void> {
    await this.emailInput.evaluate(el => {
      const probe = window as unknown as Record<string, unknown>;
      probe.__autoDocMarker = true;
      probe.__autoEmailInvalidCount = 0;
      el.addEventListener('invalid', () => {
        probe.__autoEmailInvalidCount = (probe.__autoEmailInvalidCount as number) + 1;
      });
    });
  }

  async emailInvalidEventCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as Record<string, number>).__autoEmailInvalidCount ?? 0);
  }

  async isSameDocumentAsMarked(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as Record<string, boolean>).__autoDocMarker === true);
  }

  /** Biểu mẫu có bật kiểm tra ràng buộc của trình duyệt không (không mang novalidate) */
  async isBrowserValidationEnabled(): Promise<boolean> {
    return this.form.evaluate(el => !(el as HTMLFormElement).noValidate);
  }

  /** Ô Email có qua được kiểm tra định dạng của trình duyệt không (input type=email) */
  async isEmailValidByBrowser(): Promise<boolean> {
    return this.emailInput.evaluate(el => (el as HTMLInputElement).validity.valid);
  }

  /** Nội dung bong bóng cảnh báo của trình duyệt — đổi theo trình duyệt/ngôn ngữ, chỉ dùng để biết CÓ hay KHÔNG */
  async emailValidationMessage(): Promise<string> {
    return this.emailInput.evaluate(el => (el as HTMLInputElement).validationMessage);
  }

  /**
   * Thuộc tính value của thẻ input#email trong HTML máy chủ trả về (không phải DOM sau xử lý).
   * null nếu thẻ không mang value.
   */
  static serverRenderedEmailValue(html: string): string | null {
    const tag = html.match(/<input[^>]*\bid=["']email["'][^>]*>/)?.[0] ?? '';
    const raw = tag.match(/\bvalue=(?:"([^"]*)"|'([^']*)')/);
    if (!raw) {
      return null;
    }
    return (raw[1] ?? raw[2])
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  async submitTwiceQuickly(): Promise<void> {
    await test.step('Bấm nút Login hai lần liên tiếp', () => this.loginButton.dblclick());
  }

  /** Thao tác theo trạng thái tích — KHÔNG dựa vào value="estimate" của ô (AMB-LOGIN-11) */
  async checkRememberMe(): Promise<void> {
    await test.step('Tích ô Remember me', () => this.rememberMeCheckbox.check());
  }

  async clickRememberMeLabel(): Promise<void> {
    await test.step('Bấm vào chữ Remember me', () => this.rememberMeLabel.click());
  }

  async clickLogo(): Promise<void> {
    await test.step('Bấm logo phía trên khối biểu mẫu', () => this.clickWhenReady(this.logoLink));
  }

  /** Giá trị đã giải mã của cookie ghi nhớ, undefined nếu hệ thống không phát hành. KHÔNG log giá trị này */
  async rememberMeCookieValue(): Promise<string | undefined> {
    const cookie = (await this.page.context().cookies()).find(c => c.name === REMEMBER_ME_COOKIE);
    return cookie ? decodeURIComponent(cookie.value) : undefined;
  }
}
