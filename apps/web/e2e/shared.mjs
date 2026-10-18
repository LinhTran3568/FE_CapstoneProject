/**
 * Dùng chung cho script kiểm thử bot (TEST-8.1.4, SCRUM-249).
 * Cần BE MockOrganizer.API (localhost:5001) và FE dev (localhost:3000) đang chạy.
 */

export const FE_BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const EVENT_ID = process.env.E2E_EVENT_ID ?? 'atsh-2026';
export const STORE_URL = `${FE_BASE_URL}/storefront/event/${EVENT_ID}/og-store`;

export const buyerFor = (tool) => ({
  name: `Bot Test ${tool}`,
  email: `bot-${tool.toLowerCase()}-${Date.now()}@test.vn`,
  phone: '0912345678',
});

export const SELECTORS = {
  increaseButton: 'button[id^="increase-"]:not([disabled])',
  nameInput: 'input[placeholder^="Nhập họ và tên"]',
  emailInput: 'input[placeholder^="Địa chỉ email"]',
  phoneInput: 'input[placeholder^="Số điện thoại"]',
  termsCheckbox: 'input[type="checkbox"]',
};

export const PROCEED_TEXT = 'Tiếp tục đặt vé';
export const CONFIRM_TEXT = 'Xác nhận & Mua vé';

/**
 * Bọc window.fetch trong trang để giữ lại body và response của request checkout.
 * Không sửa code app để phục vụ test.
 */
export const FETCH_HOOK_SCRIPT = `
  const originalFetch = window.fetch;
  window.__e2eCheckout = null;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const res = await originalFetch(input, init);
    if (url.includes('/orders/checkout') && init && init.body) {
      const text = await res.clone().text();
      window.__e2eCheckout = { body: JSON.parse(init.body), status: res.status, response: text };
    }
    return res;
  };
`;

/** Kiểm tra payload checkout của trình duyệt tự động. Trả về true nếu đạt. */
export const assertBotTelemetry = (tool, captured) => {
  const telemetry = captured?.body?.telemetry;
  const problems = [];

  if (!telemetry) {
    problems.push('body checkout không có object telemetry');
  } else {
    if (telemetry.is_webdriver !== 1) problems.push(`is_webdriver = ${telemetry.is_webdriver}, kỳ vọng 1`);
    if (typeof telemetry.nonce !== 'string' || telemetry.nonce.length === 0) problems.push('thiếu nonce');
    if (typeof telemetry.client_timestamp !== 'number') problems.push('thiếu client_timestamp');
  }

  let verdict = '';
  try {
    const json = JSON.parse(captured?.response ?? '{}');
    const decision = json.antiBot?.decision ?? json.decision ?? json.code ?? 'n/a';
    const riskScore = json.antiBot?.riskScore ?? json.riskScore ?? 'n/a';
    verdict = ` | server: HTTP ${captured.status}, decision=${decision}, riskScore=${riskScore}`;
  } catch {
    verdict = ` | server: HTTP ${captured?.status}`;
  }

  if (problems.length > 0) {
    console.error(`[${tool}] FAIL: ${problems.join('; ')}${verdict}`);
    return false;
  }
  console.log(`[${tool}] PASS: is_webdriver=1, nonce=${telemetry.nonce}, client_timestamp=${telemetry.client_timestamp}${verdict}`);
  return true;
};
