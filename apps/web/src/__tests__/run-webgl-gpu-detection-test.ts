/**
 * SDK-13.2.1: Unit Test Suite cho WebGL Unmasked GPU & Software Rasterizer Detection Module.
 * Chạy bằng lệnh: npx tsx src/__tests__/run-webgl-gpu-detection-test.ts
 */
import assert from 'node:assert/strict';
import {
  isVirtualGpu,
  extractWebGlGpuInfo,
  antiBotSdk,
  VIRTUAL_GPU_PATTERNS,
} from '../lib/anti-bot-sdk.ts';

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [];
const test = (name: string, fn: () => void | Promise<void>) => tests.push({ name, fn });

// ============================================================================
// 1. KIỂM THỬ ĐỐI CHIẾU BLACKLIST SOFTWARE RASTERIZER & VIRTUAL GPU (SCRUM-374)
// ============================================================================
test('Nhận diện đúng Google SwiftShader (Chromium headless mặc định)', () => {
  assert.equal(isVirtualGpu('Google SwiftShader (ANGLE)', 'Google Inc.'), true);
  assert.equal(isVirtualGpu('SwiftShader', ''), true);
});

test('Nhận diện đúng Mesa llvmpipe (Linux Cloud VPS cày bot)', () => {
  assert.equal(isVirtualGpu('llvmpipe (LLVM 12.0.0, 256 bits)', 'Mesa/X.org'), true);
  assert.equal(isVirtualGpu('Gallium 0.4 on llvmpipe (LLVM 3.8, 128 bits)', 'VMware, Inc.'), true);
});

test('Nhận diện đúng Máy ảo VirtualBox', () => {
  assert.equal(isVirtualGpu('VirtualBox Graphics Adapter', 'InnoTek Systemberatung GmbH'), true);
  assert.equal(isVirtualGpu('VBox SVGA', 'Oracle Corporation'), true);
});

test('Nhận diện đúng Máy ảo VMware', () => {
  assert.equal(isVirtualGpu('VMware SVGA 3D', 'VMware, Inc.'), true);
  assert.equal(isVirtualGpu('SVGA3D', ''), true);
});

test('Nhận diện đúng Mesa OffScreen rendering', () => {
  assert.equal(isVirtualGpu('Mesa OffScreen', 'Brian Paul'), true);
});

test('Nhận diện đúng Microsoft Basic Render Driver (DirectX WARP trên Windows VPS)', () => {
  assert.equal(isVirtualGpu('Microsoft Basic Render Driver', 'Microsoft Corporation'), true);
});

test('Nhận diện đúng Apple Software Renderer (macOS VM)', () => {
  assert.equal(isVirtualGpu('Apple Software Renderer', 'Apple Inc.'), true);
});

test('Nhận diện đúng Mesa CPU softpipe fallback', () => {
  assert.equal(isVirtualGpu('softpipe', 'Mesa'), true);
});

// ============================================================================
// 2. KIỂM THỬ CHỐNG FALSE POSITIVE TRÊN GPU VẬT LÝ THẬT (NGƯỜI DÙNG THẬT)
// ============================================================================
test('Không nhận nhầm NVIDIA GeForce chuyên dụng', () => {
  assert.equal(isVirtualGpu('NVIDIA GeForce RTX 4070 Laptop GPU/PCIe/SSE2', 'NVIDIA Corporation'), false);
  assert.equal(isVirtualGpu('ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11)', 'Google Inc. (NVIDIA)'), false);
});

test('Không nhận nhầm Intel Iris Xe / UHD Graphics (Laptop mỏng nhẹ văn phòng)', () => {
  assert.equal(isVirtualGpu('Intel(R) Iris(R) Xe Graphics', 'Intel Inc.'), false);
  assert.equal(isVirtualGpu('ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11)', 'Google Inc. (Intel)'), false);
});

test('Không nhận nhầm Apple Silicon GPU (MacBook M1/M2/M3/M4)', () => {
  assert.equal(isVirtualGpu('Apple M2 Max', 'Apple'), false);
  assert.equal(isVirtualGpu('Apple M3 Pro GPU', 'Apple Inc.'), false);
});

test('Không nhận nhầm AMD Radeon', () => {
  assert.equal(isVirtualGpu('AMD Radeon RX 6700 XT', 'ATI Technologies Inc.'), false);
  assert.equal(isVirtualGpu('AMD Radeon(TM) Graphics', 'Advanced Micro Devices, Inc.'), false);
});

test('Không nhận nhầm GPU di động (Android / iOS Smartphone)', () => {
  assert.equal(isVirtualGpu('Adreno (TM) 730', 'Qualcomm'), false);
  assert.equal(isVirtualGpu('Mali-G78 MP14', 'ARM'), false);
  assert.equal(isVirtualGpu('Apple A16 GPU', 'Apple'), false);
});

// ============================================================================
// 3. KIỂM THỬ AN TOÀN TRONG MÔI TRƯỜNG NODE.JS / SSR (FAIL-SAFE)
// ============================================================================
test('extractWebGlGpuInfo() an toàn khi không có DOM (Node.js runtime)', () => {
  const info = extractWebGlGpuInfo();
  assert.equal(typeof info, 'object');
  assert.equal(info.virtual_gpu_detected, 0); // Không bao giờ phạt nhầm khi thiếu WebGL
  assert.equal(info.webgl_renderer, 'unavailable');
  assert.equal(info.webgl_vendor, 'unavailable');
  assert.equal(info.is_tampered, false);
});

// ============================================================================
// 4. KIỂM THỬ HỢP ĐỒNG TELEMETRY PAYLOAD TỪ antiBotSdk.collect()
// ============================================================================
test('antiBotSdk.collect() trả về đầy đủ các trường WebGL mở rộng', async () => {
  const telemetry = await antiBotSdk.collect();

  assert.equal(typeof telemetry, 'object');
  // Trường cốt lõi
  assert.ok('is_webdriver' in telemetry);
  assert.ok('device_fingerprint' in telemetry);
  assert.ok('nonce' in telemetry);
  assert.ok('client_timestamp' in telemetry);

  // Trường WebGL mở rộng (US-13.2)
  assert.ok('virtual_gpu_detected' in telemetry);
  assert.ok(telemetry.virtual_gpu_detected === 0 || telemetry.virtual_gpu_detected === 1);
  assert.ok('webgl_renderer' in telemetry);
  assert.ok('webgl_vendor' in telemetry);

  // Định dạng hex fingerprint
  assert.equal(telemetry.device_fingerprint.length, 32);
});

// ============================================================================
// RUNNER TỔNG HỢP
// ============================================================================
async function runAll() {
  console.log('================================================================');
  console.log('🧪 TEST RUNNER: SDK-13.2.1 WebGL GPU & Software Rasterizer Test');
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
