import { test } from 'node:test';
import assert from 'node:assert';
import { antiBotSdk } from '../lib/anti-bot-sdk.ts';

test('antiBotSdk.collect() mặc định tự sinh nonce hợp lệ khi không truyền options', async () => {
  const telemetry = await antiBotSdk.collect();

  assert.ok(telemetry.nonce, 'Nonce phải tồn tại');
  assert.strictEqual(typeof telemetry.nonce, 'string');
  assert.ok(telemetry.nonce.length > 0, 'Nonce không được rỗng');
  assert.strictEqual(typeof telemetry.client_timestamp, 'number');
  assert.ok(telemetry.client_timestamp > 0);
});

test('antiBotSdk.collect({ nonce }) nhận đúng One-Time Cryptographic Nonce từ Server', async () => {
  const serverNonce = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const telemetry = await antiBotSdk.collect({ nonce: serverNonce });

  assert.strictEqual(telemetry.nonce, serverNonce, 'Telemetry nonce phải khớp chính xác với server nonce được truyền');
  assert.strictEqual(typeof telemetry.is_webdriver, 'number');
  assert.strictEqual(typeof telemetry.device_fingerprint, 'string');
});

test('antiBotSdk.collect({ nonce: "" }) fallback an toàn sang tự sinh nonce nếu chuỗi rỗng hoặc khoảng trắng', async () => {
  const telemetryEmpty = await antiBotSdk.collect({ nonce: '   ' });

  assert.ok(telemetryEmpty.nonce, 'Nonce phải tự động fallback sinh mới');
  assert.notStrictEqual(telemetryEmpty.nonce.trim(), '', 'Nonce không được là chuỗi trắng');
});

test('Mô phỏng Multi-tier Checkout: Mỗi hạng vé trong giỏ hàng phát hành telemetry với Nonce độc lập', async () => {
  const tierVipNonce = '9f8e7d6c5b4a3a2b1c0d9e8f7a6b5c4d';
  const tierStdNonce = '11223344556677889900aabbccddeeff';

  // Request tier VIP
  const telemetryVip = await antiBotSdk.collect({ nonce: tierVipNonce });
  // Request tier Standard
  const telemetryStd = await antiBotSdk.collect({ nonce: tierStdNonce });

  assert.strictEqual(telemetryVip.nonce, tierVipNonce);
  assert.strictEqual(telemetryStd.nonce, tierStdNonce);
  assert.notStrictEqual(telemetryVip.nonce, telemetryStd.nonce, 'Hai hạng vé khác nhau phải có 2 Nonce hoàn toàn khác biệt');
});

test('Bảo toàn đầy đủ hợp đồng Telemetry của US-13.2.1 và US-13.2.2', async () => {
  const telemetry = await antiBotSdk.collect({ nonce: 'test_nonce_continuity' });

  // US-13.2.1 WebGL GPU signals
  assert.ok('virtual_gpu_detected' in telemetry);
  assert.ok('webgl_renderer' in telemetry);
  assert.ok('webgl_vendor' in telemetry);

  // US-13.2.2 Prototype & Canvas signals
  assert.ok('prototype_tampered' in telemetry);
  assert.ok('canvas_hash' in telemetry);
  assert.ok('canvas_tampered' in telemetry);

  // Core signals
  assert.ok('is_webdriver' in telemetry);
  assert.ok('device_fingerprint' in telemetry);
  assert.ok('client_timestamp' in telemetry);
});
