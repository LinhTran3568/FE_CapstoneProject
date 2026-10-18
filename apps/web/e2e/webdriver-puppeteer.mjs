/**
 * TEST-8.1.4 (SCRUM-249): Puppeteer mở trang đặt vé sơ cấp, đặt 1 vé,
 * xác nhận Client SDK gửi is_webdriver = 1 kèm nonce và client_timestamp.
 *
 * Chạy: node e2e/webdriver-puppeteer.mjs   (hoặc npm run test:bot)
 */
import puppeteer from 'puppeteer';
import {
  STORE_URL,
  SELECTORS,
  PROCEED_TEXT,
  CONFIRM_TEXT,
  FETCH_HOOK_SCRIPT,
  buyerFor,
  assertBotTelemetry,
} from './shared.mjs';

const TOOL = 'Puppeteer';

/** Bấm nút đang hiển thị có chứa đoạn chữ (trang có cả nút desktop và mobile). */
const clickVisibleButton = async (page, text) => {
  const buttons = await page.$$(`::-p-text(${text})`);
  for (const handle of buttons) {
    const button = await handle.evaluateHandle((el) => el.closest('button'));
    const visible = await button.evaluate((el) => !!el && el.offsetParent !== null && !el.disabled);
    if (visible) {
      await button.click();
      return;
    }
  }
  throw new Error(`Không thấy nút "${text}" đang hiển thị`);
};

const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1366, height: 900 } });
let passed = false;
try {
  const page = await browser.newPage();
  const buyer = buyerFor(TOOL);

  const sessionLoaded = page.waitForResponse((r) => r.url().includes('/orders/session'), { timeout: 30_000 });
  await page.goto(STORE_URL, { waitUntil: 'domcontentloaded' });
  await sessionLoaded;

  await page.waitForSelector(SELECTORS.increaseButton, { visible: true, timeout: 30_000 });
  await page.click(SELECTORS.increaseButton);
  await clickVisibleButton(page, PROCEED_TEXT);

  await page.waitForSelector(SELECTORS.nameInput, { visible: true, timeout: 10_000 });
  await page.type(SELECTORS.nameInput, buyer.name);
  await page.type(SELECTORS.emailInput, buyer.email);
  await page.type(SELECTORS.phoneInput, buyer.phone);
  await page.click(SELECTORS.termsCheckbox);

  await page.evaluate(FETCH_HOOK_SCRIPT);
  await clickVisibleButton(page, CONFIRM_TEXT);

  await page.waitForFunction(() => window.__e2eCheckout !== null, { timeout: 30_000 });
  const captured = await page.evaluate(() => window.__e2eCheckout);
  passed = assertBotTelemetry(TOOL, captured);
} catch (err) {
  console.error(`[${TOOL}] ERROR: ${err instanceof Error ? err.message : err}`);
} finally {
  await browser.close();
}

process.exitCode = passed ? 0 : 1;
