import type { ClientTelemetry } from '@ticketshield/api-client';

/**
 * Client Telemetry SDK cho trang đặt vé sơ cấp của BTC (US-8.1, SCRUM-246 / SCRUM-247).
 *
 * Đo ba tín hiệu theo Spec 08 và gắn mã chống phát lại cho mỗi lần checkout:
 * - is_webdriver: cờ navigator.webdriver (Selenium / Puppeteer / Playwright bật cờ này).
 * - action_interval_std_dev: độ lệch chuẩn (ms) giữa các lần bấm, cần tối thiểu 3 lần bấm.
 * - device_fingerprint: 32 ký tự hex đầu của SHA-256 trên vài thuộc tính trình duyệt.
 * - nonce + client_timestamp: mỗi lần collect() một nonce mới, giờ gửi đã chỉnh theo giờ server.
 *
 * Trình duyệt không giữ khóa bí mật nào. Chữ ký HMAC nằm trong session token do server cấp.
 */

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

const computeFingerprint = async (): Promise<string> => {
  const parts = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    String(navigator.hardwareConcurrency ?? ''),
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  /** Đóng gói telemetry cho một request checkout. Mỗi lần gọi sinh một nonce mới. */
  async collect(): Promise<ClientTelemetry> {
    fingerprintPromise ??= computeFingerprint();
    const stdDev = computeIntervalStdDev(actionTimestamps);

    return {
      is_webdriver: navigator.webdriver === true ? 1 : 0,
      ...(stdDev !== undefined && { action_interval_std_dev: stdDev }),
      device_fingerprint: await fingerprintPromise,
      nonce: createNonce(),
      client_timestamp: Date.now() + serverClockOffsetMs,
    };
  },
};
