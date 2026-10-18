/**
 * TEST-8.1.4 (SCRUM-249): Selenium WebDriver (Chrome) mở trang đặt vé sơ cấp, đặt 1 vé,
 * xác nhận Client SDK gửi is_webdriver = 1 kèm nonce và client_timestamp.
 * Selenium Manager tự tải chromedriver khớp với Chrome trên máy.
 *
 * Chạy: node e2e/webdriver-selenium.mjs   (hoặc npm run test:bot)
 */
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {
  STORE_URL,
  SELECTORS,
  PROCEED_TEXT,
  CONFIRM_TEXT,
  FETCH_HOOK_SCRIPT,
  buyerFor,
  assertBotTelemetry,
} from './shared.mjs';

const TOOL = 'Selenium';

/**
 * Cuộn phần tử ra giữa màn hình rồi bấm, tránh bị thanh dính cuối trang che mất.
 * behavior 'instant' vì trang bật scroll-behavior: smooth, cuộn mượt thì Selenium bấm khi trang còn đang trượt.
 */
const scrollAndClick = async (driver, element) => {
  await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', behavior: 'instant' });", element);
  await element.click();
};

/** Bấm nút đang hiển thị có chứa đoạn chữ (trang có cả nút desktop và mobile). */
const clickVisibleButton = async (driver, text) => {
  const buttons = await driver.findElements(By.xpath(`//button[contains(normalize-space(.), "${text}")]`));
  for (const button of buttons) {
    if ((await button.isDisplayed()) && (await button.isEnabled())) {
      await scrollAndClick(driver, button);
      return;
    }
  }
  throw new Error(`Không thấy nút "${text}" đang hiển thị`);
};

const options = new chrome.Options().addArguments('--headless=new', '--window-size=1366,900');
const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
let passed = false;
try {
  const buyer = buyerFor(TOOL);

  await driver.get(STORE_URL);
  await driver.wait(
    () => driver.executeScript(
      "return performance.getEntriesByType('resource').some((e) => e.name.includes('/orders/session'))"
    ),
    30_000,
    'Trang không lấy được session token'
  );

  const increase = await driver.wait(until.elementLocated(By.css(SELECTORS.increaseButton)), 30_000);
  await driver.wait(until.elementIsVisible(increase), 10_000);
  await scrollAndClick(driver, increase);
  await clickVisibleButton(driver, PROCEED_TEXT);

  const nameInput = await driver.wait(until.elementLocated(By.css(SELECTORS.nameInput)), 10_000);
  await driver.wait(until.elementIsVisible(nameInput), 10_000);
  await nameInput.sendKeys(buyer.name);
  await driver.findElement(By.css(SELECTORS.emailInput)).sendKeys(buyer.email);
  await driver.findElement(By.css(SELECTORS.phoneInput)).sendKeys(buyer.phone);
  await scrollAndClick(driver, await driver.findElement(By.css(SELECTORS.termsCheckbox)));

  await driver.executeScript(FETCH_HOOK_SCRIPT);
  await clickVisibleButton(driver, CONFIRM_TEXT);

  const captured = await driver.wait(
    () => driver.executeScript('return window.__e2eCheckout'),
    30_000,
    'Không bắt được request checkout'
  );
  passed = assertBotTelemetry(TOOL, captured);
} catch (err) {
  console.error(`[${TOOL}] ERROR: ${err instanceof Error ? err.message : err}`);
} finally {
  await driver.quit();
}

process.exitCode = passed ? 0 : 1;
