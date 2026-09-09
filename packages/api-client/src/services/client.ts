// API Client Abstraction & Helpers

declare const process: any;

export const API_CONFIG = {
  baseURL:
    (typeof process !== 'undefined' && process?.env?.VITE_API_BASE_URL) ||
    'https://api.ticketshield.vn/api/v1',
  mockDelayMs: 400,
};

export const delay = (ms: number = API_CONFIG.mockDelayMs) =>
  new Promise((resolve) => setTimeout(resolve, ms));
