import type { ClientTelemetry } from '@ticketshield/api-client';

/**
 * Client Telemetry SDK cho trang đặt vé sơ cấp của BTC (US-8.1, SCRUM-246 / SCRUM-247).
 * Mở rộng: WebGL Unmasked GPU & Software Rasterizer Detection (US-13.2, SCRUM-373 / SCRUM-374).
 *
 * Đo các tín hiệu bảo vệ theo Spec 08 và US-13.2:
 * - is_webdriver: cờ navigator.webdriver (Selenium / Puppeteer / Playwright bật cờ này).
 * - virtual_gpu_detected: cờ phát hiện card đồ họa ảo / CPU software rasterizer (SwiftShader, llvmpipe, VM).
 * - webgl_renderer & webgl_vendor: trích xuất phần cứng đồ họa unmasked qua WebGL extension.
 * - action_interval_std_dev: độ lệch chuẩn (ms) giữa các lần bấm, cần tối thiểu 3 lần bấm.
 * - device_fingerprint: 32 ký tự hex đầu của SHA-256 kết hợp thuộc tính trình duyệt và WebGL GPU.
 * - nonce + client_timestamp: mỗi lần collect() một nonce mới, giờ gửi đã chỉnh theo giờ server.
 *
 * Trình duyệt không giữ khóa bí mật nào. Chữ ký HMAC nằm trong session token do server cấp.
 */

export interface WebGlGpuInfo {
  virtual_gpu_detected: 0 | 1;
  webgl_renderer: string;
  webgl_vendor: string;
  is_tampered: boolean;
}

export interface PrototypeInspectionResult {
  prototype_tampered: 0 | 1;
  is_webdriver_effective: 0 | 1;
  reason?: string;
}

let cachedPrototypeResult: PrototypeInspectionResult | null = null;

/**
 * Kiểm tra can thiệp JavaScript Prototype trên navigator.webdriver (US-13.2.2, SCRUM-375).
 * Phát hiện các công cụ bot stealth dùng delete hoặc Object.defineProperty để che giấu cờ tự động hóa.
 * Áp dụng cơ chế khử False Positive cho In-App WebView (Zalo, FB, TikTok) và Safari WebKit.
 */
export const inspectWebdriverPrototype = (): PrototypeInspectionResult => {
  if (cachedPrototypeResult) return cachedPrototypeResult;

  const fallback: PrototypeInspectionResult = {
    prototype_tampered: 0,
    is_webdriver_effective: typeof navigator !== 'undefined' && navigator.webdriver === true ? 1 : 0,
  };

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return fallback;
  }

  try {
    const ua = navigator.userAgent || '';
    const isInAppWebView = /FBAN|FBAV|Instagram|Zalo|TikTok|Line|Snapchat/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|CriOS|OPR/i.test(ua);

    // Bẫy 1: Own Property Check
    // Trên chuẩn W3C, webdriver KHÔNG ĐƯỢC là thuộc tính riêng (own property) trên instance navigator.
    // Nếu navigator.hasOwnProperty('webdriver') === true => Bot đã can thiệp Object.defineProperty(navigator, 'webdriver', ...)
    if (Object.prototype.hasOwnProperty.call(navigator, 'webdriver')) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'navigator.hasOwnProperty("webdriver") is true (own property injection)',
      };
      return cachedPrototypeResult;
    }

    const proto = Object.getPrototypeOf(navigator);
    if (!proto) {
      cachedPrototypeResult = fallback;
      return cachedPrototypeResult;
    }

    const hasInProto = 'webdriver' in proto;

    // Khử False Positive cho In-App WebView hoặc Safari WebKit không bật automation
    if (!hasInProto && (isInAppWebView || isSafari)) {
      cachedPrototypeResult = fallback;
      return cachedPrototypeResult;
    }

    // Bẫy 2: Prototype Missing Check
    // Trên trình duyệt Chromium (Chrome/Edge/Brave/Cốc Cốc), thuộc tính webdriver bắt buộc phải tồn tại trong Navigator.prototype.
    // Nếu thiếu => Bot đã dùng delete Navigator.prototype.webdriver
    if (!hasInProto) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'webdriver missing from Navigator.prototype (prototype deletion)',
      };
      return cachedPrototypeResult;
    }

    // Bẫy 3: Descriptor Integrity & Native Getter Check
    const desc = Object.getOwnPropertyDescriptor(proto, 'webdriver');
    if (!desc) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'Property descriptor of webdriver is undefined',
      };
      return cachedPrototypeResult;
    }

    if (typeof desc.get !== 'function') {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'webdriver descriptor does not have a getter function',
      };
      return cachedPrototypeResult;
    }

    if (!isNativeFunction(desc.get)) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'webdriver getter is not a native function (tampered with JS code)',
      };
      return cachedPrototypeResult;
    }

    if (desc.set !== undefined) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'webdriver descriptor has unexpected setter',
      };
      return cachedPrototypeResult;
    }

    if (desc.configurable === false || desc.enumerable === false) {
      cachedPrototypeResult = {
        prototype_tampered: 1,
        is_webdriver_effective: 1,
        reason: 'webdriver descriptor configurable/enumerable flags have been modified',
      };
      return cachedPrototypeResult;
    }

    // Hoàn toàn hợp lệ
    cachedPrototypeResult = {
      prototype_tampered: 0,
      is_webdriver_effective: navigator.webdriver === true ? 1 : 0,
    };
    return cachedPrototypeResult;
  } catch {
    return fallback;
  }
};

/**
 * Danh sách chữ ký nhận diện card đồ họa ảo / bộ dựng hình bằng phần mềm qua CPU (US-13.2, SCRUM-374).
 * Hầu hết các trang trại bot chạy Chromium headless trên Cloud VPS/Server không có GPU rời,
 * buộc phải sử dụng SwiftShader hoặc llvmpipe để render.
 */
export const VIRTUAL_GPU_PATTERNS = [
  /swiftshader/i,               // Chrome headless software 3D
  /llvmpipe/i,                  // Mesa LLVM software rasterizer (Linux Cloud VPS)
  /virtualbox/i, /vbox/i,       // VirtualBox GPU
  /vmware/i, /svga3d/i,         // VMware SVGA
  /mesa offscreen/i,            // Mesa offscreen rendering
  /microsoft basic render/i,    // DirectX WARP software driver (Windows VPS)
  /apple software renderer/i,   // macOS VM software rasterizer
  /softpipe/i,                  // Mesa CPU software fallback
];

/** Đối chiếu chuỗi vendor và renderer với danh sách phần cứng ảo/software rasterizer. */
export const isVirtualGpu = (renderer: string, vendor: string): boolean => {
  const combined = `${vendor} ${renderer}`.trim();
  return VIRTUAL_GPU_PATTERNS.some((pattern) => pattern.test(combined));
};

/** Kiểm tra hàm native code để bẫy các stealth plugin cố tình ghi đè prototype. */
const isNativeFunction = (fn: unknown): boolean => {
  if (typeof fn !== 'function') return false;
  try {
    return /\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(fn));
  } catch {
    return false;
  }
};

let cachedGpuInfo: WebGlGpuInfo | null = null;

/**
 * Trích xuất thông tin WebGL Unmasked GPU và nhận diện software rasterizer.
 * Áp dụng Singleton Cache & WEBGL_lose_context để chống rò rỉ VRAM / xung đột Three.js.
 */
export const extractWebGlGpuInfo = (): WebGlGpuInfo => {
  if (cachedGpuInfo) return cachedGpuInfo;

  const fallback: WebGlGpuInfo = {
    virtual_gpu_detected: 0,
    webgl_renderer: 'unavailable',
    webgl_vendor: 'unavailable',
    is_tampered: false,
  };

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = (
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    ) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (!gl) {
      cachedGpuInfo = {
        ...fallback,
        webgl_renderer: 'disabled',
        webgl_vendor: 'disabled',
      };
      return cachedGpuInfo;
    }

    // Bẫy Anti-Tampering: Phát hiện bot stealth ghi đè gl.getParameter
    const isTampered = !isNativeFunction(gl.getParameter);

    // Kích hoạt extension unmask GPU
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let renderer = '';
    let vendor = '';

    if (debugInfo) {
      vendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? '');
      renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '');
    } else {
      // Fallback khi extension bị ẩn (Firefox Privacy RFP, Safari)
      vendor = String(gl.getParameter(gl.VENDOR) ?? 'masked');
      renderer = String(gl.getParameter(gl.RENDERER) ?? 'masked');
    }

    // Giải phóng WebGL context ngay lập tức để bảo toàn tài nguyên cho các canvas khác
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    const isVirtual = isVirtualGpu(renderer, vendor);

    cachedGpuInfo = {
      virtual_gpu_detected: isVirtual ? 1 : 0,
      webgl_renderer: renderer || 'unknown',
      webgl_vendor: vendor || 'unknown',
      is_tampered: isTampered,
    };

    return cachedGpuInfo;
  } catch {
    // Fail-Safe: Tránh crash ứng dụng nếu WebGL ném lỗi
    return fallback;
  }
};

/** Giữ 21 mốc gần nhất = 20 khoảng cách. */
const MAX_ACTION_TIMESTAMPS = 21;
/** Spec 08: dưới 3 thao tác thì action_interval_std_dev không khả dụng. */
const MIN_ACTIONS = 3;

let actionTimestamps: number[] = [];
let listening = false;
let serverClockOffsetMs = 0;
let fingerprintPromise: Promise<string> | null = null;

const handlePointerDown = () => {
  actionTimestamps.push(performance.now());
  if (actionTimestamps.length > MAX_ACTION_TIMESTAMPS) {
    actionTimestamps = actionTimestamps.slice(-MAX_ACTION_TIMESTAMPS);
  }
};

/** Độ lệch chuẩn tổng thể (chia cho n) của các khoảng cách, làm tròn 1 chữ số thập phân. */
const computeIntervalStdDev = (timestamps: number[]): number | undefined => {
  if (timestamps.length < MIN_ACTIONS) return undefined;

  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  const mean = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Hash 128-bit không cần crypto.subtle (cyrb128).
 * Chỉ dùng khi trang mở qua http không bảo mật (ví dụ IP LAN trên điện thoại) nên không có crypto.subtle.
 */
const fallbackHash128 = (input: string): string => {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [h1 ^ h2 ^ h3 ^ h4, h2 ^ h1, h3 ^ h1, h4 ^ h1]
    .map((h) => (h >>> 0).toString(16).padStart(8, '0'))
    .join('');
};

export interface CanvasEntropyResult {
  canvas_hash: string;
  canvas_tampered: 0 | 1;
}

let cachedCanvasResult: CanvasEntropyResult | null = null;

/**
 * Trích xuất sai khác khử răng cưa Canvas 2D (Micro-Entropy) và bẫy phát hiện Canvas Noise Poisoning (US-13.2.2, SCRUM-375).
 * Kiểm tra tính toàn vẹn của API Canvas và áp dụng Double-Read Check để phát hiện các tiện ích tiêm nhiễu ngẫu nhiên.
 */
export const extractCanvasMicroEntropy = (): CanvasEntropyResult => {
  if (cachedCanvasResult) return cachedCanvasResult;

  const fallback: CanvasEntropyResult = {
    canvas_hash: 'unavailable',
    canvas_tampered: 0,
  };

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  try {
    // 1. Kiểm tra Native Code trên Prototype của Canvas API
    const isToDataUrlTampered =
      typeof HTMLCanvasElement !== 'undefined' &&
      !isNativeFunction(HTMLCanvasElement.prototype.toDataURL);
    const isGetImageDataTampered =
      typeof CanvasRenderingContext2D !== 'undefined' &&
      !isNativeFunction(CanvasRenderingContext2D.prototype.getImageData);

    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      cachedCanvasResult = {
        canvas_hash: 'disabled',
        canvas_tampered: 0,
      };
      return cachedCanvasResult;
    }

    // 2. Vẽ hình ảnh phức tạp để kích hoạt khử răng cưa (Anti-Aliasing) và sub-pixel rendering
    const grad = ctx.createLinearGradient(0, 0, 180, 0);
    grad.addColorStop(0, '#f38b00');
    grad.addColorStop(1, '#e52d27');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 40);

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = '#069';
    ctx.fillText('TicketShield 🎟️ 2026', 4, 4);

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('AntiBot 🛡️ Micro-Entropy', 4, 20);

    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(160, 20, 12, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Double-Read Check: Đọc 2 lần liên tiếp vùng pixel tĩnh để phát hiện Canvas Noise Poisoning (Brave Farbling/Spook)
    const img1 = ctx.getImageData(0, 0, 180, 40).data;
    const img2 = ctx.getImageData(0, 0, 180, 40).data;
    let isNoisePoisoned = false;

    // Lấy mẫu bước nhảy 16 bytes để tối ưu tốc độ (< 0.2ms)
    for (let i = 0; i < img1.length; i += 16) {
      if (img1[i] !== img2[i]) {
        isNoisePoisoned = true;
        break;
      }
    }

    const dataUrl = canvas.toDataURL();
    const canvasHash = fallbackHash128(dataUrl).slice(0, 32);

    cachedCanvasResult = {
      canvas_hash: canvasHash,
      canvas_tampered: isToDataUrlTampered || isGetImageDataTampered || isNoisePoisoned ? 1 : 0,
    };

    return cachedCanvasResult;
  } catch {
    return fallback;
  }
};

const computeFingerprint = async (): Promise<string> => {
  const gpu = extractWebGlGpuInfo();
  const parts = [
    typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
    typeof navigator !== 'undefined' ? navigator.language : 'en',
    typeof navigator !== 'undefined' ? navigator.platform : 'server',
    typeof navigator !== 'undefined' ? String(navigator.hardwareConcurrency ?? '') : '',
    typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : '0x0x0',
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    gpu.webgl_vendor,
    gpu.webgl_renderer,
  ].join('|');

  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts));
    return toHex(new Uint8Array(digest)).slice(0, 32);
  }
  return fallbackHash128(parts);
};

/** UUID v4. crypto.randomUUID chỉ có trong secure context nên tự ráp từ getRandomValues khi thiếu. */
const createNonce = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const antiBotSdk = {
  /** Bắt đầu ghi mốc bấm chuột / chạm. Gọi lại nhiều lần không gắn listener trùng. */
  start(): void {
    if (listening) return;
    document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    listening = true;
  },

  /** Gỡ listener và xóa mốc bấm. Giữ lại độ lệch đồng hồ và fingerprint. */
  stop(): void {
    document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    listening = false;
    actionTimestamps = [];
  },

  /** Ghi độ lệch giữa đồng hồ máy và giờ server, đọc từ issuedAtUtc của session token. */
  setServerClock(issuedAtUtc: string): void {
    const serverMs = Date.parse(issuedAtUtc);
    if (!Number.isNaN(serverMs)) {
      serverClockOffsetMs = serverMs - Date.now();
    }
  },

  /** Lấy thông tin trích xuất phần cứng GPU WebGL. */
  getGpuInfo(): WebGlGpuInfo {
    return extractWebGlGpuInfo();
  },

  /** Kiểm tra tính toàn vẹn của prototype navigator.webdriver (US-13.2.2). */
  inspectPrototype(): PrototypeInspectionResult {
    return inspectWebdriverPrototype();
  },

  /** Trích xuất Canvas Micro-Entropy và kiểm tra Canvas Noise Poisoning (US-13.2.2). */
  getCanvasEntropy(): CanvasEntropyResult {
    return extractCanvasMicroEntropy();
  },

  /** Đóng gói telemetry cho một request checkout. Hỗ trợ One-Time Cryptographic Nonce từ Server hoặc tự sinh (US-13.2.3). */
  async collect(options?: { nonce?: string }): Promise<ClientTelemetry> {
    fingerprintPromise ??= computeFingerprint();
    const stdDev = computeIntervalStdDev(actionTimestamps);
    const gpu = extractWebGlGpuInfo();
    const proto = inspectWebdriverPrototype();
    const canvas = extractCanvasMicroEntropy();

    // Cơ chế Cầu Nối ONNX 6D (Bridge to ONNX):
    // Nếu phát hiện bot stealth can thiệp/xóa webdriver (prototype_tampered = 1),
    // tự động ép cờ is_webdriver = 1 để kích hoạt hình phạt tối đa trong mô hình ONNX 6 chiều.
    const isWdEffective: 0 | 1 =
      proto.prototype_tampered === 1 || proto.is_webdriver_effective === 1
        ? 1
        : typeof navigator !== 'undefined' && navigator.webdriver === true
          ? 1
          : 0;

    const effectiveNonce = options?.nonce && options.nonce.trim().length > 0
      ? options.nonce.trim()
      : createNonce();

    const clientUserAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';

    return {
      is_webdriver: isWdEffective,
      virtual_gpu_detected: gpu.virtual_gpu_detected,
      prototype_tampered: proto.prototype_tampered,
      canvas_hash: canvas.canvas_hash,
      canvas_tampered: canvas.canvas_tampered,
      webgl_renderer: gpu.webgl_renderer,
      webgl_vendor: gpu.webgl_vendor,
      ...(stdDev !== undefined && { action_interval_std_dev: stdDev }),
      device_fingerprint: await fingerprintPromise,
      nonce: effectiveNonce,
      client_timestamp: Date.now() + serverClockOffsetMs,
      client_user_agent: clientUserAgent,
    };
  },
};
