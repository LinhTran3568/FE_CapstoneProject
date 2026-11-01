// US-9.2: test logic cua vi ve mobile. Chay bang: npm run test:wallet
const assert = require('node:assert/strict');
const Module = require('module');
const { AxiosError } = require('axios');

const storage = new Map();
const fakeAsyncStorage = {
  getItem: async (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: async (key, value) => {
    storage.set(key, String(value));
  },
  getAllKeys: async () => [...storage.keys()],
  multiRemove: async (keys) => {
    keys.forEach((key) => storage.delete(key));
  },
};

const secureMemory = new Map();

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  if (request === '@react-native-async-storage/async-storage') {
    return { __esModule: true, default: fakeAsyncStorage };
  }
  if (request === 'react-native') {
    return { Platform: { OS: 'android', select: (obj) => obj.android || obj.default } };
  }
  if (request === 'expo-secure-store') {
    return {
      getItemAsync: async (key) => secureMemory.get(key) ?? null,
      setItemAsync: async (key, value) => {
        secureMemory.set(key, String(value));
      },
      deleteItemAsync: async (key) => {
        secureMemory.delete(key);
      },
    };
  }
  if (request === 'expo-constants') {
    return { __esModule: true, default: { expoConfig: { hostUri: '10.0.2.2:8081' } } };
  }
  return originalRequire.apply(this, arguments);
};

const view = () => require('../utils/ticketView');
const cache = () => require('../services/ticketCacheService');
const api = () => require('../../../../packages/api-client/src/services/client');
const apiClient = () => require('@ticketshield/api-client');
const authStore = () => require('../stores/authStore').useAuthStore;
const secure = () => require('../lib/secureStore').secureStorage;

const USER = {
  id: 'user-a',
  email: 'buyer@example.test',
  fullName: 'Buyer',
  phoneNumber: '',
  role: 'User',
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

const withinOneSecond = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('van dang cho may chu')), 1000)),
  ]);

const signedIn = async () => {
  await secure().setTokens('access-token', 'refresh-token');
  await secure().setUser(USER);
  authStore().setState({ user: USER, isAuthenticated: true, isLoading: false, token: 'access-token' });
};

// Su kien 20:00 gio Viet Nam ngay 01/12/2026.
const EVENT_START = '2026-12-01T13:00:00.000Z';

const ticket = (overrides = {}) => ({
  escrowId: 'escrow-1',
  listingId: 'listing-1',
  eventId: 'event-1',
  eventName: 'Concert',
  eventVenue: 'Stadium',
  eventStartAt: EVENT_START,
  tierName: 'GA',
  seatZone: 'Zone A',
  ticketPassCode: 'ATSH-GA-999',
  totalAmountPaid: 60000,
  status: 'IN_ESCROW',
  recipientName: 'Buyer',
  recipientEmail: 'buyer@example.test',
  qrCodeData: 'ATSH-GA-999',
  qrCodeImageUrl: '',
  purchasedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------- Chia tab ----------
test('5 phut sau gio bat dau van o Upcoming', () => {
  const { isPastTicket } = view();
  assert.equal(isPastTicket(ticket(), new Date('2026-12-01T13:05:00.000Z')), false);
});

test('dung moc 12 tieng van o Upcoming', () => {
  const { isPastTicket } = view();
  assert.equal(isPastTicket(ticket(), new Date('2026-12-02T01:00:00.000Z')), false);
});

test('qua moc 12 tieng thi sang Past', () => {
  const { isPastTicket } = view();
  assert.equal(isPastTicket(ticket(), new Date('2026-12-02T01:01:00.000Z')), true);
});

test('ve REFUNDED sang Past du su kien chua dien ra', () => {
  const { isPastTicket } = view();
  const refunded = ticket({ status: 'REFUNDED' });
  assert.equal(isPastTicket(refunded, new Date('2026-11-20T00:00:00.000Z')), true);
});

test('thieu gio bat dau thi o Upcoming', () => {
  const { isPastTicket } = view();
  const now = new Date('2030-01-01T00:00:00.000Z');
  assert.equal(isPastTicket(ticket({ eventStartAt: '' }), now), false);
  assert.equal(isPastTicket(ticket({ eventStartAt: 'khong-phai-ngay' }), now), false);
});

test('Upcoming xep su kien gan nhat len dau', () => {
  const { splitTickets } = view();
  const later = ticket({ escrowId: 'later', eventStartAt: '2026-12-20T13:00:00.000Z' });
  const sooner = ticket({ escrowId: 'sooner', eventStartAt: '2026-12-02T13:00:00.000Z' });
  const noDate = ticket({ escrowId: 'no-date', eventStartAt: '' });
  const { upcoming } = splitTickets([noDate, later, sooner], new Date('2026-12-01T00:00:00.000Z'));
  assert.deepEqual(
    upcoming.map((item) => item.escrowId),
    ['sooner', 'later', 'no-date']
  );
});

test('Past xep su kien moi dien ra len dau', () => {
  const { splitTickets } = view();
  const older = ticket({ escrowId: 'older', eventStartAt: '2026-01-01T13:00:00.000Z' });
  const newer = ticket({ escrowId: 'newer', eventStartAt: '2026-06-01T13:00:00.000Z' });
  const { past, upcoming } = splitTickets([older, newer], new Date('2026-12-01T00:00:00.000Z'));
  assert.deepEqual(
    past.map((item) => item.escrowId),
    ['newer', 'older']
  );
  assert.equal(upcoming.length, 0);
});

// ---------- Nhan trang thai ----------
test('ba trang thai dung duoc deu hien Ready for Entry', () => {
  const { getStatusView } = view();
  ['IN_ESCROW', 'RELEASING', 'VALID'].forEach((status) => {
    const result = getStatusView(status);
    assert.equal(result.label, 'Ready for Entry');
    assert.equal(result.tone, 'ready');
  });
});

test('DISPUTED hien giong web', () => {
  const { getStatusView } = view();
  assert.equal(getStatusView('DISPUTED').label, 'DISPUTED');
});

test('REFUNDED hien giong web', () => {
  const { getStatusView } = view();
  assert.equal(getStatusView('REFUNDED').label, 'ĐÃ HOÀN TIỀN');
});

test('trang thai la hien ISSUING giong web, khong hien ma tho', () => {
  const { getStatusView } = view();
  assert.equal(getStatusView('REFUNDQUEUED').label, 'ISSUING...');
  assert.equal(getStatusView('').label, 'ISSUING...');
});

test('nhan tren nut mo QR giong web', () => {
  const { getPassActionLabel } = view();
  assert.equal(getPassActionLabel(ticket()), 'VIEW ENTRY QR');
  assert.equal(getPassActionLabel(ticket({ bundleTotalTickets: 2 })), 'VIEW QRS (2)');
});

test('so ve trong goi lay tu bundleTotalTickets roi bundleItems', () => {
  const { getTicketCount } = view();
  const item = { listingId: 'a', ticketCode: 'A', seatZone: 'A', qrCodeData: 'A', qrCodeImageUrl: '' };
  assert.equal(getTicketCount(ticket()), 1);
  assert.equal(getTicketCount(ticket({ bundleTotalTickets: 3 })), 3);
  assert.equal(getTicketCount(ticket({ bundleItems: [item, { ...item, listingId: 'b' }] })), 2);
});

test('nhan biet ve da hoan tien', () => {
  const { isRefundedTicket } = view();
  assert.equal(isRefundedTicket(ticket({ status: ' refunded ' })), true);
  assert.equal(isRefundedTicket(ticket()), false);
});

test('nhan khong phan biet hoa thuong va khoang trang', () => {
  const { getStatusView } = view();
  assert.equal(getStatusView(' in_escrow ').label, 'Ready for Entry');
});

// ---------- Quyen hien QR ----------
test('chi 4 trang thai duoc hien QR', () => {
  const { canShowEntryQr } = view();
  ['IN_ESCROW', 'RELEASING', 'VALID', 'DISPUTED'].forEach((status) => {
    assert.equal(canShowEntryQr(ticket({ status })), true, status);
  });
  ['REFUNDED', 'PENDING_PAYMENT', 'REFUNDQUEUED', ''].forEach((status) => {
    assert.equal(canShowEntryQr(ticket({ status })), false, status);
  });
});

test('ve khong co ma thi khong hien QR', () => {
  const { canShowEntryQr } = view();
  assert.equal(canShowEntryQr(ticket({ qrCodeData: '', ticketPassCode: '' })), false);
});

// ---------- Noi dung QR ----------
test('ve don tra mot ve voi QR tu qrCodeData', () => {
  const { getPassItems } = view();
  const items = getPassItems(ticket({ qrCodeData: 'QR-1', ticketPassCode: 'CODE-1' }));
  assert.equal(items.length, 1);
  assert.equal(items[0].qrValue, 'QR-1');
  assert.equal(items[0].ticketCode, 'CODE-1');
  assert.equal(items[0].seatZone, 'Zone A');
});

test('qrCodeData rong thi QR dung ma ve', () => {
  const { getPassItems } = view();
  const [item] = getPassItems(ticket({ qrCodeData: '  ', ticketPassCode: 'CODE-1' }));
  assert.equal(item.qrValue, 'CODE-1');
});

test('ve goi tra tung ve voi QR rieng', () => {
  const { getPassItems } = view();
  const items = getPassItems(
    ticket({
      bundleItems: [
        { listingId: 'a', ticketCode: 'CODE-A', seatZone: 'A1', qrCodeData: 'QR-A', qrCodeImageUrl: '' },
        { listingId: 'b', ticketCode: 'CODE-B', seatZone: 'A2', qrCodeData: '', qrCodeImageUrl: '' },
      ],
    })
  );
  assert.deepEqual(
    items.map((item) => [item.ticketCode, item.seatZone, item.qrValue]),
    [
      ['CODE-A', 'A1', 'QR-A'],
      ['CODE-B', 'A2', 'CODE-B'],
    ]
  );
});

test('bundleItems rong thi coi nhu ve don', () => {
  const { getPassItems } = view();
  assert.equal(getPassItems(ticket({ bundleItems: [] })).length, 1);
});

// ---------- Ban luu ve ----------
test('luu roi doc lai duoc ve va gio luu', async () => {
  storage.clear();
  const { saveTickets, loadTickets } = cache();
  await saveTickets('user-a', [ticket()], new Date('2026-12-01T12:02:00.000Z'));
  const saved = await loadTickets('user-a');
  assert.equal(saved.savedAt, '2026-12-01T12:02:00.000Z');
  assert.equal(saved.tickets[0].qrCodeData, 'ATSH-GA-999');
});

test('ban moi thay the hoan toan ban cu', async () => {
  storage.clear();
  const { saveTickets, loadTickets } = cache();
  await saveTickets('user-a', [ticket({ escrowId: 'old' })]);
  await saveTickets('user-a', [ticket({ escrowId: 'new' })]);
  const saved = await loadTickets('user-a');
  assert.deepEqual(
    saved.tickets.map((item) => item.escrowId),
    ['new']
  );
});

test('tai khoan khac khong doc duoc ban luu', async () => {
  storage.clear();
  const { saveTickets, loadTickets } = cache();
  await saveTickets('user-a', [ticket()]);
  assert.equal(await loadTickets('user-b'), null);
});

test('du lieu hong coi nhu khong co ban luu', async () => {
  storage.clear();
  const { saveTickets, loadTickets } = cache();
  await saveTickets('user-a', [ticket()]);
  const [key] = [...storage.keys()];
  storage.set(key, '{khong-phai-json');
  assert.equal(await loadTickets('user-a'), null);
  storage.set(key, JSON.stringify({ savedAt: 'x', tickets: 'khong-phai-mang' }));
  assert.equal(await loadTickets('user-a'), null);
});

test('xoa toan bo ve da luu nhung giu du lieu khac', async () => {
  storage.clear();
  const { saveTickets, loadTickets, clearAllTickets } = cache();
  storage.set('other-feature', 'keep');
  await saveTickets('user-a', [ticket()]);
  await saveTickets('user-b', [ticket()]);
  await clearAllTickets();
  assert.equal(await loadTickets('user-a'), null);
  assert.equal(await loadTickets('user-b'), null);
  assert.equal(storage.get('other-feature'), 'keep');
});

// ---------- Tu choi phien ----------
const axiosError = (status) =>
  new AxiosError(
    'request failed',
    status ? 'ERR_BAD_RESPONSE' : 'ERR_NETWORK',
    undefined,
    undefined,
    status ? { status, data: {} } : undefined
  );

test('khong co phan hoi thi khong phai bi tu choi', () => {
  assert.equal(api().isSessionRejected(axiosError()), false);
});

test('het thoi gian cho thi khong phai bi tu choi', () => {
  const timeout = new AxiosError('timeout', 'ECONNABORTED');
  assert.equal(api().isSessionRejected(timeout), false);
});

test('may chu loi 5xx thi khong phai bi tu choi', () => {
  assert.equal(api().isSessionRejected(axiosError(503)), false);
  assert.equal(api().isSessionRejected(axiosError(500)), false);
});

test('phan hoi 400 401 403 la bi tu choi', () => {
  [400, 401, 403].forEach((status) => {
    assert.equal(api().isSessionRejected(axiosError(status)), true, String(status));
  });
});

test('refresh token khong hop le la bi tu choi', () => {
  assert.equal(api().isSessionRejected(new Error('Refresh token is invalid or has expired')), true);
});

test('setApiTimeout dat gioi han cho cho moi request', () => {
  const { setApiTimeout, axiosClient } = api();
  setApiTimeout(10000);
  assert.equal(axiosClient.defaults.timeout, 10000);
  setApiTimeout(0);
});

// ---------- Mo app khi mang kem ----------
test('mo app co phien da luu thi vao ngay, khong cho may chu', async () => {
  await signedIn();
  authStore().setState({ isAuthenticated: false, isLoading: true });
  apiClient().authApi.getCurrentUser = () => new Promise(() => {});

  await withinOneSecond(authStore().getState().loadStoredAuth());

  const state = authStore().getState();
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.isLoading, false);
  assert.equal(state.user.id, 'user-a');
});

test('kiem tra nen thanh cong thi cap nhat nguoi dung', async () => {
  await signedIn();
  apiClient().authApi.getCurrentUser = async () => ({ ...USER, fullName: 'Ten moi' });

  await authStore().getState().loadStoredAuth();
  await tick();

  assert.equal(authStore().getState().user.fullName, 'Ten moi');
});

test('kiem tra nen loi mang thi giu nguyen phien', async () => {
  await signedIn();
  apiClient().authApi.getCurrentUser = async () => {
    throw new AxiosError('Network Error', 'ERR_NETWORK');
  };

  await authStore().getState().loadStoredAuth();
  await tick();

  assert.equal(authStore().getState().isAuthenticated, true);
  assert.equal(await secure().getAccessToken(), 'access-token');
});

test('kiem tra nen tra ve sau khi da dang xuat thi khong dang nhap lai', async () => {
  await signedIn();
  let finish;
  apiClient().authApi.getCurrentUser = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  apiClient().authApi.logout = async () => {};

  await authStore().getState().loadStoredAuth();
  await authStore().getState().logout();
  finish(USER);
  await tick();

  assert.equal(authStore().getState().user, null);
  assert.equal(authStore().getState().isAuthenticated, false);
});

test('mo app dat gioi han cho 10 giay', async () => {
  await signedIn();
  apiClient().authApi.getCurrentUser = async () => USER;

  await authStore().getState().loadStoredAuth();

  assert.equal(apiClient().axiosClient.defaults.timeout, 10000);
});

// ---------- Dang xuat ----------
test('dang xuat xoa ve da luu', async () => {
  storage.clear();
  await signedIn();
  await cache().saveTickets('user-a', [ticket()]);
  apiClient().authApi.logout = async () => {};

  await authStore().getState().logout();

  assert.equal(await cache().loadTickets('user-a'), null);
});

test('may chu tu choi phien thi dang xuat va xoa ve', async () => {
  storage.clear();
  await signedIn();
  await cache().saveTickets('user-a', [ticket()]);
  apiClient().authApi.logout = async () => {};

  apiClient().notifyUnauthorized();
  await tick();

  assert.equal(authStore().getState().isAuthenticated, false);
  assert.equal(await cache().loadTickets('user-a'), null);
});

// ---------- Lam moi phien ----------
const axios = require('axios').default;
const originalPost = axios.post;

const answer401 = async (config) => {
  throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {}, config });
};

const prepareExpiredSession = async () => {
  storage.clear();
  await signedIn();
  await cache().saveTickets('user-a', [ticket()]);
  apiClient().authApi.logout = async () => {};
  apiClient().axiosClient.defaults.adapter = answer401;
};

const requestWithExpiredToken = () => apiClient().axiosClient.get('/tickets').catch(() => {});

test('song rot luc lam moi phien thi giu nguyen phien va ve da luu', async () => {
  await prepareExpiredSession();
  axios.post = async () => {
    throw new AxiosError('Network Error', 'ERR_NETWORK');
  };

  await requestWithExpiredToken();
  await tick();
  axios.post = originalPost;

  assert.equal(authStore().getState().isAuthenticated, true);
  assert.equal(await secure().getRefreshToken(), 'refresh-token');
  assert.equal((await cache().loadTickets('user-a')).tickets.length, 1);
});

test('may chu loi 503 luc lam moi phien thi giu nguyen phien', async () => {
  await prepareExpiredSession();
  axios.post = async () => {
    throw new AxiosError('down', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 503, data: {} });
  };

  await requestWithExpiredToken();
  await tick();
  axios.post = originalPost;

  assert.equal(authStore().getState().isAuthenticated, true);
});

test('may chu tu choi luc lam moi phien thi dang xuat', async () => {
  await prepareExpiredSession();
  axios.post = async () => {
    throw new AxiosError('invalid', 'ERR_BAD_REQUEST', undefined, undefined, { status: 401, data: {} });
  };

  await requestWithExpiredToken();
  await tick();
  axios.post = originalPost;

  assert.equal(authStore().getState().isAuthenticated, false);
  assert.equal(await cache().loadTickets('user-a'), null);
});

(async () => {
  console.log('\n TICKETSHIELD MOBILE - US-9.2 TICKET WALLET\n');
  let failed = 0;
  for (const { name, fn } of tests) {
    // Promise treo khong giu duoc tien trinh, nen can dong ho de test treo bao do thay vi thoat im lang.
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('test bi treo')), 3000);
    });
    try {
      await Promise.race([fn(), timeout]);
      console.log(` [PASS] ${name}`);
    } catch (err) {
      failed += 1;
      console.error(` [FAIL] ${name}\n        ${String(err.message).split('\n')[0]}`);
    } finally {
      clearTimeout(timer);
    }
  }
  console.log(`\n RESULTS: ${tests.length - failed}/${tests.length} passed\n`);
  process.exit(failed ? 1 : 0);
})();
