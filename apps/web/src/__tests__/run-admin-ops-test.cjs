// US-11.1 (SCRUM-335, 337, 339): test logic trang Admin. Chay bang: npm run test:admin
// Co dinh mui gio Viet Nam de ngay gio va khoang ngay giong nhau tren moi may.
process.env.TZ = 'Asia/Ho_Chi_Minh';
const assert = require('node:assert/strict');

const money = () => require('../utils/moneyStatus');
const ops = () => require('../utils/adminOps');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// Gio co dinh de test dem nguoc va khoang ngay khong phu thuoc may chay.
const NOW = new Date('2026-11-15T10:00:00+07:00');
const plus = (ms) => new Date(NOW.getTime() + ms).toISOString();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---------- Nhan tien (moneyStatus) ----------
test('nhan giu tien du 9 trang thai dung chu cua trang doanh thu', () => {
  const { ESCROW_STATUS_LABEL, labelOf } = money();
  const want = {
    Pending: 'Awaiting payment',
    Locked: 'On hold',
    Releasing: 'Awaiting receipt',
    Released: 'Paid out',
    Refunded: 'Refunded',
    Disputed: 'In dispute',
    RefundQueued: 'Refunding',
    Expired: 'Expired',
    Cancelled: 'Cancelled',
  };
  for (const [status, label] of Object.entries(want)) {
    assert.equal(labelOf(ESCROW_STATUS_LABEL, status), label, status);
  }
});

test('chi Released ra Paid out', () => {
  const { ESCROW_STATUS_LABEL, labelOf } = money();
  const paidOut = Object.keys(ESCROW_STATUS_LABEL).filter((s) => labelOf(ESCROW_STATUS_LABEL, s) === 'Paid out');
  assert.deepEqual(paidOut, ['Released']);
});

test('nhan giai ngan du 4 trang thai', () => {
  const { PAYOUT_STATUS_LABEL, labelOf } = money();
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, 'Pending'), 'Pending');
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, 'Processing'), 'Sending');
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, 'Success'), 'Sent');
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, 'Failed'), 'Could not send');
});

test('trang thai la tra nguyen van, khong ra Paid out', () => {
  const { ESCROW_STATUS_LABEL, labelOf } = money();
  assert.equal(labelOf(ESCROW_STATUS_LABEL, 'Frozen'), 'Frozen');
  assert.equal(labelOf(ESCROW_STATUS_LABEL, '7'), '7');
});

test('null va rong ra gach ngang', () => {
  const { PAYOUT_STATUS_LABEL, labelOf } = money();
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, null), '—');
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, undefined), '—');
  assert.equal(labelOf(PAYOUT_STATUS_LABEL, ''), '—');
});

test('nhan tin dang chep tu ListingStatusPill, Draft viet hoa', () => {
  const { LISTING_STATUS_LABEL, listingStatusLabel } = money();
  assert.equal(LISTING_STATUS_LABEL.Verified, 'ON SALE');
  assert.equal(listingStatusLabel('Verified'), 'ON SALE');
  assert.equal(listingStatusLabel('Transacting'), 'PROCESSING');
  assert.equal(listingStatusLabel('Sold'), 'SOLD');
  assert.equal(listingStatusLabel('Cancelled'), 'CANCELLED');
  assert.equal(listingStatusLabel('Expired'), 'EXPIRED');
  assert.equal(listingStatusLabel('Draft'), 'DRAFT');
  assert.equal(listingStatusLabel(null), '—');
});

test('nhan xac thuc tin dang', () => {
  const { VERIFICATION_STATUS_LABEL, labelOf } = money();
  assert.equal(labelOf(VERIFICATION_STATUS_LABEL, 'PendingOtp'), 'Awaiting OTP');
  assert.equal(labelOf(VERIFICATION_STATUS_LABEL, 'Verified'), 'Verified');
  assert.equal(labelOf(VERIFICATION_STATUS_LABEL, 'Rejected'), 'Rejected');
});

// ---------- Logic Admin (adminOps) ----------
const tx = (overrides = {}) => ({
  status: 'Locked',
  createdAt: plus(-2 * HOUR),
  transferredAt: plus(-2 * HOUR + MIN),
  disputeDeadline: plus(22 * HOUR),
  disputeWaived: false,
  disputeWaivedAt: null,
  unlockAt: plus(22 * HOUR),
  refundedAt: null,
  payoutStatus: null,
  payoutProcessedAt: null,
  originalTicketPrice: 1_000_000,
  buyerFee: 50_000,
  sellerFee: 50_000,
  totalBuyerPaid: 1_050_000,
  netSellerPayout: 950_000,
  ...overrides,
});

// 4.1 Tien
test('formatMoney dung formatVND co san', () => {
  assert.equal(ops().formatMoney(1_050_000), '1,050,000 ₫');
  assert.equal(ops().formatMoney(0), '0 ₫');
});

test('formatMoney null ra gach ngang, khong co dau do la', () => {
  assert.equal(ops().formatMoney(null), '—');
  assert.equal(ops().formatMoney(undefined), '—');
  assert.ok(!ops().formatMoney(123).includes('$'));
});

// 4.2 Gio mo khoa
test('Locked con 18 gio 20 phut ra in 18h 20m', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: plus(18 * HOUR + 20 * MIN) }), NOW), 'in 18h 20m');
});

test('Locked con 45 phut ra in 45m', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: plus(45 * MIN) }), NOW), 'in 45m');
});

test('Locked con 2 ngay 3 gio ra in 2d 3h', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: plus(2 * DAY + 3 * HOUR) }), NOW), 'in 2d 3h');
});

test('Locked con duoi 1 phut ra in <1m', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: plus(30 * 1000) }), NOW), 'in <1m');
});

test('Locked da qua gio mo khoa ra ngay gio', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: plus(-1 * HOUR) }), NOW), '15 Nov 2026, 09:00');
});

test('Released ra ngay gio, khong dem nguoc', () => {
  assert.equal(ops().unlockLabel(tx({ status: 'Released', unlockAt: plus(5 * HOUR) }), NOW), '15 Nov 2026, 15:00');
});

test('khong co unlockAt ra gach ngang', () => {
  assert.equal(ops().unlockLabel(tx({ unlockAt: null }), NOW), '—');
});

// 4.3 Phan bo tien va moc thoi gian
test('san giu bang phi nguoi mua cong phi nguoi ban', () => {
  const split = ops().moneySplit(tx());
  assert.deepEqual(split, {
    ticketPrice: 1_000_000,
    buyerFee: 50_000,
    buyerPaid: 1_050_000,
    sellerFee: 50_000,
    sellerReceives: 950_000,
    platformKeeps: 100_000,
  });
});

test('phan bo tien doc thang so BE tra, khong tu cong lai', () => {
  const split = ops().moneySplit(tx({ totalBuyerPaid: 1_050_001, netSellerPayout: 949_999 }));
  assert.equal(split.buyerPaid, 1_050_001);
  assert.equal(split.sellerReceives, 949_999);
});

test('moc thoi gian dung thu tu, moc tuong lai chua xay ra', () => {
  const steps = ops().transactionTimeline(tx(), NOW);
  assert.deepEqual(steps.map((s) => s.key), ['created', 'transferred', 'dispute', 'unlock', 'settled']);
  assert.deepEqual(steps.map((s) => s.done), [true, true, false, false, false]);
  assert.equal(steps[2].label, 'Dispute window ends');
  assert.equal(steps[4].label, 'Paid out');
  assert.equal(steps[4].at, null);
});

test('nguoi mua bo quyen khieu nai thi doc disputeWaivedAt', () => {
  const waivedAt = plus(-1 * HOUR);
  const steps = ops().transactionTimeline(tx({ disputeWaived: true, disputeWaivedAt: waivedAt }), NOW);
  assert.equal(steps[2].label, 'Dispute waived');
  assert.equal(steps[2].at, waivedAt);
  assert.equal(steps[2].done, true);
});

test('hoan tien thay moc giai ngan', () => {
  const refundedAt = plus(-10 * MIN);
  const steps = ops().transactionTimeline(tx({ status: 'Refunded', refundedAt }), NOW);
  assert.equal(steps[4].label, 'Refunded');
  assert.equal(steps[4].at, refundedAt);
  assert.equal(steps[4].done, true);
});

test('giai ngan thanh cong moi tinh la Paid out', () => {
  const at = plus(-5 * MIN);
  const ok = ops().transactionTimeline(tx({ status: 'Released', payoutStatus: 'Success', payoutProcessedAt: at }), NOW);
  assert.equal(ok[4].done, true);
  assert.equal(ok[4].at, at);
  const failed = ops().transactionTimeline(tx({ payoutStatus: 'Failed', payoutProcessedAt: at }), NOW);
  assert.equal(failed[4].done, false);
  assert.equal(failed[4].at, null);
});

// 4.4 Che so tai khoan
test('so tai khoan chi lo 4 so cuoi', () => {
  assert.equal(ops().maskAccountNumber('0123456789'), '••••6789');
  assert.equal(ops().maskAccountNumber('1234'), '••••');
  assert.equal(ops().maskAccountNumber('123'), '••••');
  assert.equal(ops().maskAccountNumber(''), '—');
  assert.equal(ops().maskAccountNumber(null), '—');
});

// 4.5 Tran gia
const listing = (overrides = {}) => ({
  isAtPriceCeiling: false,
  isPriceCeilingExceeded: false,
  appliedMarkupPercentage: 10,
  eventMaxMarkupPercentage: 10,
  bundleId: null,
  bundleTotalTickets: 0,
  ...overrides,
});

test('xep loai tran gia doc co cua BE', () => {
  assert.equal(ops().ceilingVerdict(listing()), 'UNDER');
  assert.equal(ops().ceilingVerdict(listing({ isAtPriceCeiling: true })), 'AT_CAP');
  assert.equal(ops().ceilingVerdict(listing({ isPriceCeilingExceeded: true })), 'OVER');
});

test('vuot tran thang bang tran', () => {
  assert.equal(ops().ceilingVerdict(listing({ isAtPriceCeiling: true, isPriceCeilingExceeded: true })), 'OVER');
});

test('tran luc dang khac tran hien tai thi Cap changed', () => {
  assert.equal(ops().capChanged(listing({ appliedMarkupPercentage: 15, eventMaxMarkupPercentage: 10 })), true);
  assert.equal(ops().capChanged(listing({ appliedMarkupPercentage: 10, eventMaxMarkupPercentage: 10 })), false);
});

test('tran su kien bang 0 (tin thieu su kien) khong bao Cap changed', () => {
  assert.equal(ops().capChanged(listing({ appliedMarkupPercentage: 15, eventMaxMarkupPercentage: 0 })), false);
});

// 4.6 Nhan combo
test('nhan combo chep dieu kien cua web', () => {
  assert.equal(ops().comboLabel(listing()), null);
  assert.equal(ops().comboLabel(listing({ bundleId: 'b-1', bundleTotalTickets: 3 })), 'COMBO (3 TICKETS)');
  assert.equal(ops().comboLabel(listing({ bundleId: null, bundleTotalTickets: 4 })), 'COMBO (4 TICKETS)');
  assert.equal(ops().comboLabel(listing({ bundleId: 'b-1', bundleTotalTickets: 0 })), 'COMBO (2 TICKETS)');
});

// 4.7 Top su kien
const ev = (name, revenue, gmv) => ({ eventId: name, eventName: name, totalPlatformRevenue: revenue, totalTransactionVolume: gmv });

test('12 su kien ra 8 su kien doanh thu cao nhat, giam dan', () => {
  const events = Array.from({ length: 12 }, (_, i) => ev(`E${i + 1}`, (i + 1) * 1000, 1));
  const top = ops().topEvents(events, 'revenue');
  assert.deepEqual(top.map((e) => e.eventName), ['E12', 'E11', 'E10', 'E9', 'E8', 'E7', 'E6', 'E5']);
  assert.deepEqual(top.map((e) => e.value), [12000, 11000, 10000, 9000, 8000, 7000, 6000, 5000]);
});

test('doi sang GMV thi doi thu tu', () => {
  const events = [ev('A', 300, 10), ev('B', 200, 30), ev('C', 100, 20)];
  assert.deepEqual(ops().topEvents(events, 'revenue').map((e) => e.eventName), ['A', 'B', 'C']);
  assert.deepEqual(ops().topEvents(events, 'gmv').map((e) => e.eventName), ['B', 'C', 'A']);
});

test('bo su kien bang 0, danh sach rong ra rong', () => {
  assert.deepEqual(ops().topEvents([ev('A', 0, 0), ev('B', 5, 5)], 'revenue').map((e) => e.eventName), ['B']);
  assert.deepEqual(ops().topEvents([], 'revenue'), []);
});

// 4.8 Khoang thoi gian Dashboard
test('7d va 30d lui ve dau ngay, tinh ca hom nay', () => {
  assert.deepEqual(ops().rangeToDates('7d', NOW), { fromDate: '2026-11-08T17:00:00.000Z' });
  assert.deepEqual(ops().rangeToDates('30d', NOW), { fromDate: '2026-10-16T17:00:00.000Z' });
});

test('All khong gioi han ngay', () => {
  assert.deepEqual(ops().rangeToDates('All', NOW), {});
});

// 4.9 Bo loc tren URL
const sp = (qs) => new URLSearchParams(qs);

test('bo loc giao dich: ghi roi doc ra dung bo loc cu', () => {
  const f = { page: 3, size: 20, keyword: 'ATSH', status: 'Locked', payoutStatus: 'Failed', holdOnly: true, from: '2026-11-01', to: '2026-11-15' };
  const qs = ops().writeTransactionFilters(f);
  assert.deepEqual(ops().readTransactionFilters(sp(qs)), f);
});

test('bo loc giao dich mac dinh khong len URL', () => {
  const defaults = ops().readTransactionFilters(sp(''));
  assert.deepEqual(defaults, { page: 1, size: 20, keyword: '', status: '', payoutStatus: '', holdOnly: false, from: '', to: '' });
  assert.equal(ops().writeTransactionFilters(defaults), '');
});

test('bo loc giao dich: gia tri hong ve mac dinh', () => {
  const f = ops().readTransactionFilters(sp('status=Frozen&payout=x&page=abc&size=0&from=15-11-2026'));
  assert.equal(f.status, '');
  assert.equal(f.payoutStatus, '');
  assert.equal(f.page, 1);
  assert.equal(f.size, 20);
  assert.equal(f.from, '');
});

test('size chi doc tu URL, gioi han 1 den 100', () => {
  assert.equal(ops().readTransactionFilters(sp('size=2')).size, 2);
  assert.equal(ops().readTransactionFilters(sp('size=500')).size, 20);
});

test('doi bo loc dua ve trang 1, doi trang thi giu bo loc', () => {
  const f = ops().readTransactionFilters(sp('page=3&status=Locked'));
  assert.equal(ops().withFilter(f, { payoutStatus: 'Failed' }).page, 1);
  const paged = ops().withFilter(f, { page: 4 });
  assert.equal(paged.page, 4);
  assert.equal(paged.status, 'Locked');
});

test('bo loc giao dich doi sang tham so API, ngay theo dau va cuoi ngay', () => {
  const f = ops().readTransactionFilters(sp('page=2&q=%20ATSH%20&status=Locked&hold=1&from=2026-11-01&to=2026-11-15'));
  assert.deepEqual(ops().toTransactionParams(f), {
    page: 2,
    size: 20,
    keyword: 'ATSH',
    status: 'Locked',
    payoutStatus: undefined,
    inSettlementBufferOnly: true,
    fromDate: '2026-10-31T17:00:00.000Z',
    toDate: '2026-11-15T16:59:59.999Z',
  });
});

test('bo loc tin dang: ghi roi doc ra dung, eventId va sellerId tren URL', () => {
  const f = {
    page: 2, size: 2, keyword: 'TCK', type: 'combo', status: 'Sold', verification: 'Verified',
    eventId: '6f1b2c3d-1111-2222-3333-444455556666', sellerId: '7a1b2c3d-1111-2222-3333-444455556666',
    atCapOnly: true, from: '2026-11-01', to: '',
  };
  const qs = ops().writeListingFilters(f);
  assert.ok(qs.includes('eventId=6f1b2c3d-1111-2222-3333-444455556666'));
  assert.ok(qs.includes('sellerId=7a1b2c3d-1111-2222-3333-444455556666'));
  assert.deepEqual(ops().readListingFilters(sp(qs)), f);
});

test('bo loc tin dang: loai la ve All, eventId hong bi bo', () => {
  const f = ops().readListingFilters(sp('type=bundle&eventId=<script>&status=Sold'));
  assert.equal(f.type, 'all');
  assert.equal(f.eventId, '');
  assert.equal(f.status, 'Sold');
});

test('loai tin doi sang co cua API', () => {
  const base = ops().readListingFilters(sp(''));
  assert.equal(ops().toListingParams({ ...base, type: 'combo' }).isBundleOnly, true);
  assert.equal(ops().toListingParams({ ...base, type: 'combo' }).isSingleOnly, undefined);
  assert.equal(ops().toListingParams({ ...base, type: 'single' }).isSingleOnly, true);
  assert.equal(ops().toListingParams(base).isBundleOnly, undefined);
});

(async () => {
  console.log('\n TICKETSHIELD WEB - US-11.1 ADMIN OPERATIONS\n');
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(` [PASS] ${name}`);
    } catch (err) {
      failed += 1;
      console.error(` [FAIL] ${name}\n        ${String(err.message).split('\n')[0]}`);
    }
  }
  console.log(`\n RESULTS: ${tests.length - failed}/${tests.length} passed\n`);
  process.exit(failed ? 1 : 0);
})();
