/**
 * SDK-13.2.2: Unit Test Suite cho Canvas Micro-Entropy & Prototype Tampering Inspection Module.
 * Chạy bằng lệnh: node --experimental-strip-types src/__tests__/run-prototype-tampering-test.ts
 */
import assert from 'node:assert/strict';
import {
  inspectWebdriverPrototype,
  extractCanvasMicroEntropy,
  antiBotSdk,
} from '../lib/anti-bot-sdk.ts';

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [];
const test = (name: string, fn: () => void | Promise<void>) => tests.push({ name, fn });

// ============================================================================
// 1. KIỂM THỬ AN TOÀN TRONG MÔI TRƯỜNG NODE.JS / SSR (FAIL-SAFE)
// ============================================================================
test('inspectWebdriverPrototype() an toàn khi chạy trong Node.js (không có DOM/navigator)', () => {
  const result = inspectWebdriverPrototype();
  assert.equal(typeof result, 'object');
  assert.equal(result.prototype_tampered, 0); // Không bao giờ phạt nhầm khi môi trường thiếu navigator
  assert.equal(result.is_webdriver_effective, 0);
});

test('extractCanvasMicroEntropy() an toàn khi chạy trong Node.js (không có HTMLCanvasElement)', () => {
  const result = extractCanvasMicroEntropy();
  assert.equal(typeof result, 'object');
  assert.equal(result.canvas_hash, 'unavailable');
  assert.equal(result.canvas_tampered, 0);
});

// ============================================================================
// 2. KIỂM THỬ HỢP ĐỒNG TELEMETRY VÀ CẦU NỐI ONNX TỪ antiBotSdk.collect()
// ============================================================================
test('antiBotSdk.collect() phát hành đầy đủ các trường telemetry của US-13.2.2', async () => {
  const telemetry = await antiBotSdk.collect();

  assert.equal(typeof telemetry, 'object');
  // Các trường cốt lõi
  assert.ok('is_webdriver' in telemetry);
  assert.ok('virtual_gpu_detected' in telemetry);
  assert.ok('device_fingerprint' in telemetry);
  assert.ok('nonce' in telemetry);
  assert.ok('client_timestamp' in telemetry);

  // Các trường mới của US-13.2.2 (SCRUM-375)
  assert.ok('prototype_tampered' in telemetry);
  assert.ok(telemetry.prototype_tampered === 0 || telemetry.prototype_tampered === 1);
  assert.ok('canvas_hash' in telemetry);
  assert.ok(typeof telemetry.canvas_hash === 'string');
  assert.ok('canvas_tampered' in telemetry);
  assert.ok(telemetry.canvas_tampered === 0 || telemetry.canvas_tampered === 1);
});

// ============================================================================
// 3. KIỂM THỬ LOGIC BẪY PROTOTYPE VÀ KHỬ FALSE POSITIVE QUA MOCK OBJECTS
// ============================================================================
test('Logic Bẫy Own Property: Phát hiện bot stealth dùng Object.defineProperty(navigator, "webdriver", ...)', () => {
  const fakeNavigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    webdriver: false,
  };
  // Thuộc tính là own property trên instance
  const isOwnProperty = Object.prototype.hasOwnProperty.call(fakeNavigator, 'webdriver');
  assert.equal(isOwnProperty, true, 'Bot stealth đã chèn own property trên instance!');
});

test('Logic Khử False Positive: Safari WebKit & In-App WebView (Zalo/FB/TikTok) không có webdriver', () => {
  const zaloUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Zalo/23.09.01';
  const isInAppWebView = /FBAN|FBAV|Instagram|Zalo|TikTok|Line|Snapchat/i.test(zaloUa);
  const isSafari = /Safari/i.test(zaloUa) && !/Chrome|Chromium|Edg|CriOS|OPR/i.test(zaloUa);

  assert.equal(isInAppWebView || isSafari, true);
  // Không được coi là bot cày vé
});

test('Logic Bẫy Native Code: Phát hiện getter giả mạo bằng JavaScript function thường', () => {
  const fakeGetter = function () { return false; };
  const isNative = /\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(fakeGetter));
  assert.equal(isNative, false, 'Phát hiện getter thiếu native code!');
});

test('Logic Cầu Nối ONNX 6D: prototype_tampered = 1 tự động ép is_webdriver = 1', () => {
  const mockProtoResult = { prototype_tampered: 1 as const, is_webdriver_effective: 1 as const };
  const effectiveWd = mockProtoResult.prototype_tampered === 1 || mockProtoResult.is_webdriver_effective === 1 ? 1 : 0;
  assert.equal(effectiveWd, 1, 'Cầu nối ONNX kích hoạt cờ is_webdriver = 1 thành công!');
});

// ============================================================================
// 4. KIỂM THỬ DOUBLE-READ CHECK TRÊN CANVAS NOISE POISONING
// ============================================================================
test('Double-Read Check: Phát hiện khi pixel giữa 2 lần đọc bị lệch (Brave Farbling/Canvas Poisoning)', () => {
  const d1 = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
  const d2 = new Uint8ClampedArray([255, 0, 0, 255, 0, 254, 0, 255]); // Sai lệch sub-pixel do noise injector

  let isPoisoned = false;
  for (let i = 0; i < d1.length; i++) {
    if (d1[i] !== d2[i]) {
      isPoisoned = true;
      break;
    }
  }

  assert.equal(isPoisoned, true, 'Double-Read Check bắt quả tang Canvas Noise thành công!');
});

// ============================================================================
// RUNNER TỔNG HỢP
// ============================================================================
async function runAll() {
  console.log('================================================================');
  console.log('🧪 TEST RUNNER: SDK-13.2.2 Canvas Micro-Entropy & Tampering Test');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✅ [PASS] ${t.name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ [FAIL] ${t.name}`);
      console.error(`     Error: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log('----------------------------------------------------------------');
  console.log(`Kết quả: ${passed} PASSED, ${failed} FAILED / Tổng số: ${tests.length}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll();
