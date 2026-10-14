// Gửi thẻ kết quả CI vào Google Chat (Cards v2). Chạy trong workflow (job notify-chat) và chạy local để xem thử.
// Biến môi trường: GCHAT_WEBHOOK_NOTE (bắt buộc) · UI_*/API_* (RESULT, PASSED, FAILED, BROKEN, SKIPPED) · PAGES_RESULT
// · GITHUB_* của Actions · GITHUB_TOKEN (tuỳ chọn, để đọc giờ bắt đầu lượt chạy) · DRY_RUN=1 để chỉ in JSON.

const env = process.env;
const num = (key) => Number(env[key]) || 0;

const suites = [
  { name: 'UI CRM', result: env.UI_RESULT, passed: num('UI_PASSED'), failed: num('UI_FAILED'), broken: num('UI_BROKEN'), skipped: num('UI_SKIPPED') },
  { name: 'API Book', result: env.API_RESULT, passed: num('API_PASSED'), failed: num('API_FAILED'), broken: num('API_BROKEN'), skipped: num('API_SKIPPED') },
];
const sum = (key) => suites.reduce((total, suite) => total + suite[key], 0);
const [passed, failed, broken, skipped] = ['passed', 'failed', 'broken', 'skipped'].map(sum);
const total = passed + failed + broken + skipped;

const ok = suites.every((suite) => suite.result === 'success');
const status = ok ? 'PASS' : 'FAIL';
const repo = env.GITHUB_REPOSITORY || 'owner/repo';
const [owner, repoName] = repo.split('/');
const runUrl = `${env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${env.GITHUB_RUN_ID || ''}`;
const pagesUrl = `https://${owner.toLowerCase()}.github.io/${repoName}`;

const triggerLabel = { schedule: 'theo lịch', workflow_dispatch: 'bấm tay', push: 'push' }[env.GITHUB_EVENT_NAME] || env.GITHUB_EVENT_NAME || '—';

function formatNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`;
}

async function elapsed() {
  if (env.DURATION) {
    return env.DURATION;
  }
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${env.GITHUB_RUN_ID}`, { headers });
    const data = await response.json();
    const seconds = Math.round((Date.now() - new Date(data.run_started_at).getTime()) / 1000);
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } catch {
    return '—';
  }
}

const line = (suite) => `${suite.result === 'success' ? '✅' : '❌'} <b>${suite.name}</b>: ${suite.passed} passed · ${suite.failed} failed · ${suite.broken} broken · ${suite.skipped} skipped`;

function buttons() {
  const list = [];
  if (env.PAGES_RESULT === 'success') {
    list.push({ text: 'Allure UI', onClick: { openLink: { url: `${pagesUrl}/ui/` } } });
    list.push({ text: 'Allure API', onClick: { openLink: { url: `${pagesUrl}/api/` } } });
  }
  list.push({ text: 'Log lượt chạy', onClick: { openLink: { url: runUrl } } });
  return list;
}

async function main() {
  const duration = await elapsed();
  const widgetsMain = [
    {
      columns: {
        columnItems: [
          {
            horizontalSizeStyle: 'FILL_AVAILABLE_SPACE',
            widgets: [{
              textParagraph: {
                text: `<b>Kết quả</b><br>✅ ${passed} passed · ❌ ${failed} failed<br>💥 ${broken} broken · ⏭️ ${skipped} skipped`,
              },
            }],
          },
          {
            horizontalSizeStyle: 'FILL_AVAILABLE_SPACE',
            widgets: [{ textParagraph: { text: `<b>Thời gian</b><br>${formatNow()} · chạy ${duration}` } }],
          },
        ],
      },
    },
    { divider: {} },
    { textParagraph: { text: suites.map(line).join('<br>') } },
  ];

  const widgetsFooter = [
    {
      textParagraph: {
        text: `<font color="#6b7280">Kích hoạt: <b>${triggerLabel}</b> · Nhánh: <b>${env.GITHUB_REF_NAME || '—'}</b> · Commit: <b>${(env.GITHUB_SHA || '').slice(0, 7) || '—'}</b> · Bởi: <b>${env.GITHUB_ACTOR || '—'}</b></font>`,
      },
    },
  ];
  if (env.PAGES_RESULT && env.PAGES_RESULT !== 'success') {
    widgetsFooter.push({ textParagraph: { text: `⚠️ Chưa publish được report lên Pages (${env.PAGES_RESULT}) — xem artifact allure-report-* trong lượt chạy.` } });
  }
  widgetsFooter.push({ buttonList: { buttons: buttons() } });

  const payload = {
    cardsV2: [{
      cardId: 'ci-result',
      card: {
        header: {
          title: `${ok ? '🟢' : '🔴'} CRM Playwright — GitHub Actions: ${status} ${passed}/${total} test`,
          subtitle: repo,
        },
        sections: [{ widgets: widgetsMain }, { widgets: widgetsFooter }],
      },
    }],
  };

  if (env.DRY_RUN) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const webhook = env.GCHAT_WEBHOOK_NOTE;
  if (!webhook) {
    throw new Error('Thiếu GCHAT_WEBHOOK_NOTE');
  }
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Google Chat trả HTTP ${response.status}: ${(await response.text()).replace(webhook, '*****').slice(0, 300)}`);
  }
  console.log(`Đã gửi vào Google Chat (HTTP ${response.status}): ${status} ${passed}/${total}`);
}

main().catch((error) => {
  console.error(String(error.message).replace(env.GCHAT_WEBHOOK_NOTE || '\u0000', '*****'));
  process.exit(1);
});
