// US-11.2 (SCRUM-342): test logic tab Orders cua nguoi mua. Chay bang: npm run test:orders
// Co dinh mui gio Viet Nam de ngay gio giong nhau tren moi may.
process.env.TZ = 'Asia/Ho_Chi_Minh';
const assert = require('node:assert/strict');

const lib = () => require('../utils/buyerOrders');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const NOW = new Date('2026-11-14T20:00:00+07:00');

/** Mot don mau da tra tien va nhan ve, con trong han khieu nai. */
const order = (overrides = {}) => ({
  orderId: 'o-1',
  orderCode: 'ORD-TS7F3K9A2B',
  listingId: 'l-1',
  bundleId: null,
  isBundle: false,
  bundleTotalTickets: 1,
  eventId: 'e-1',
  eventName: 'Anh Trai Say Hi',
  eventVenue: 'My Dinh',
  eventStartAt: '2026-12-20T19:00:00+07:00',
  tierName: 'VIP',
  seatZone: 'Zone A3',
  ticketCode: 'TS-8F2A-9C91',
  tickets: [{ ticketCode: 'TS-8F2A-9C91', seatZone: 'Zone A3' }],
  originalTicketPrice: 1000000,
  buyerFee: 50000,
  totalBuyerPaid: 1050000,
  paymentReference: 'TS7F3K9A2B',
  bankTransactionReference: 'FT26318ABC',
  status: 'Locked',
  statusDescription: 'Đã thanh toán - Đang giữ ký quỹ an toàn',
  transferredAt: '2026-11-14T09:13:00+07:00',
  disputeDeadline: '2026-11-15T09:13:00+07:00',
  createdAt: '2026-11-14T09:12:00+07:00',
  updatedAt: '2026-11-14T09:13:00+07:00',
  isRefunded: false,
  isRefundQueued: false,
  refundAmount: 0,
  refundedAt: null,
  refundReason: null,
  disputeId: null,
  disputeStatus: null,
  disputeWaived: false,
  ...overrides,
});

/** Don giu ve roi bo hoac chua tra: chua co ma SePay, chua chuyen ve. */
const unpaid = (status, overrides = {}) =>
  order({
    status,
    bankTransactionReference: null,
    transferredAt: null,
    disputeDeadline: null,
    ticketCode: 'TS-8F2A-****',
    tickets: [{ ticketCode: 'TS-8F2A-****', seatZone: 'Zone A3' }],
    updatedAt: '2026-11-14T09:22:00+07:00',
    ...overrides,
  });

const step = (timeline, key) => timeline.find((s) => s.key === key);
const keys = (timeline) => timeline.map((s) => s.key);

// ---------- 3.1 Nhan trang thai ----------
test('nhan nguoi mua du 9 trang thai dung bang o spec', () => {
  const want = {
    Pending: 'Awaiting payment',
    Locked: 'Held in escrow',
    Releasing: 'Completed',
    Released: 'Completed',
    Disputed: 'In dispute',
    RefundQueued: 'Refunding',
    Refunded: 'Refunded',
    Expired: 'Expired',
    Cancelled: 'Cancelled',
  };
  for (const [status, label] of Object.entries(want)) {
    assert.equal(lib().orderStatusLabel(status), label, status);
  }
  assert.equal(Object.keys(lib().BUYER_ORDER_STATUS_LABEL).length, 9);
});

test('trang thai la hien nguyen van, rong ra gach ngang', () => {
  assert.equal(lib().orderStatusLabel('OnHoldByAdmin'), 'OnHoldByAdmin');
  assert.equal(lib().orderStatusLabel(null), '—');
  assert.equal(lib().orderStatusLabel(''), '—');
  assert.equal(lib().orderStatusLabel(undefined), '—');
});

test('khong trang thai nao ra Paid out', () => {
  const labels = Object.values(lib().BUYER_ORDER_STATUS_LABEL);
  assert.equal(labels.includes('Paid out'), false);
});

// ---------- 3.2 Tong mau va don chua tra ----------
test('tong mau theo design', () => {
  const want = {
    Pending: 'amber',
    Locked: 'amber',
    Releasing: 'emerald',
    Released: 'emerald',
    Disputed: 'rose',
    RefundQueued: 'indigo',
    Refunded: 'indigo',
    Expired: 'zinc',
    Cancelled: 'zinc',
    OnHoldByAdmin: 'zinc',
  };
  for (const [status, tone] of Object.entries(want)) {
    assert.equal(lib().orderStatusTone(status), tone, status);
  }
  assert.equal(lib().orderStatusTone(null), 'zinc');
});

test('chi Pending, Expired, Cancelled la don chua tra tien', () => {
  for (const s of ['Pending', 'Expired', 'Cancelled']) assert.equal(lib().isUnpaidOrder(s), true, s);
  for (const s of ['Locked', 'Releasing', 'Released', 'Disputed', 'RefundQueued', 'Refunded']) {
    assert.equal(lib().isUnpaidOrder(s), false, s);
  }
});

test('ve da giao khi co transferredAt', () => {
  assert.equal(lib().isTicketIssued(order()), true);
  assert.equal(lib().isTicketIssued(unpaid('Pending')), false);
});

// ---------- 3.3 Danh sach ve ----------
test('co tickets thi giu dung thu tu va khu ghe', () => {
  const tickets = [
    { ticketCode: 'C1', seatZone: 'A3' },
    { ticketCode: 'C2', seatZone: 'A3' },
    { ticketCode: 'C3', seatZone: 'A4' },
    { ticketCode: 'C4', seatZone: 'A4' },
  ];
  assert.deepEqual(lib().orderTickets(order({ tickets, ticketCode: 'C1,C2,C3,C4' })), tickets);
});

test('tickets rong va ticketCode 3 ma thi ra 3 ve khong khu ghe', () => {
  const got = lib().orderTickets(order({ tickets: [], ticketCode: 'C1, C2,C3', seatZone: 'A3' }));
  assert.deepEqual(got, [
    { ticketCode: 'C1', seatZone: null },
    { ticketCode: 'C2', seatZone: null },
    { ticketCode: 'C3', seatZone: null },
  ]);
});

test('tickets rong va ticketCode 1 ma thi lay seatZone cua don', () => {
  assert.deepEqual(lib().orderTickets(order({ tickets: [], ticketCode: 'C1', seatZone: 'A3' })), [
    { ticketCode: 'C1', seatZone: 'A3' },
  ]);
  assert.deepEqual(lib().orderTickets(order({ tickets: undefined, ticketCode: 'C1', seatZone: null })), [
    { ticketCode: 'C1', seatZone: null },
  ]);
});

test('khong co ma nao thi ra rong', () => {
  assert.deepEqual(lib().orderTickets(order({ tickets: [], ticketCode: null })), []);
  assert.deepEqual(lib().orderTickets(order({ tickets: [], ticketCode: '  ' })), []);
});

// ---------- 3.4 Hang ve ----------
test('hang ve le va combo', () => {
  assert.equal(lib().orderTierLabel(order()), 'VIP');
  assert.equal(lib().orderTierLabel(order({ bundleId: 'b-1', bundleTotalTickets: 4 })), 'VIP · Combo (4 tickets)');
  assert.equal(lib().orderTierLabel(order({ bundleTotalTickets: 1 })), 'VIP');
  assert.equal(lib().orderTierLabel(order({ tierName: '' })), '—');
});

// ---------- 3.5 Hoan tien ----------
test('Refunded ra so tien kem ngay', () => {
  const line = lib().refundLine(
    order({ status: 'Refunded', isRefunded: true, refundAmount: 1050000, refundedAt: '2026-11-10T14:00:00+07:00' })
  );
  assert.equal(line.state, 'done');
  assert.equal(line.amount, 1050000);
  assert.equal(line.text, 'Refunded 1,050,000 ₫ on 10/11/2026');
});

test('RefundQueued ra so tien dang cho, Released ra null', () => {
  const line = lib().refundLine(order({ status: 'RefundQueued', isRefundQueued: true, refundAmount: 1050000 }));
  assert.equal(line.state, 'queued');
  assert.equal(line.text, 'Refund of 1,050,000 ₫ queued');
  assert.equal(lib().refundLine(order({ status: 'Released' })), null);
});

test('Refunded thieu refundAmount thi lay tong da tra', () => {
  const line = lib().refundLine(order({ status: 'Refunded', refundAmount: 0, refundedAt: null }));
  assert.equal(line.amount, 1050000);
  assert.equal(line.text, 'Refunded 1,050,000 ₫');
});

test('nguon hoan tien', () => {
  assert.equal(lib().refundSource(order({ status: 'Refunded', disputeId: 'd-1' })), 'dispute');
  assert.equal(lib().refundSource(order({ status: 'RefundQueued', transferredAt: null })), 'transfer_failed');
  assert.equal(lib().refundSource(order({ status: 'Refunded' })), 'platform');
  assert.equal(lib().refundSource(order({ status: 'Released' })), null);
});

// ---------- 3.6 Tien trinh ----------
test('Locked con trong han khieu nai', () => {
  const t = lib().orderTimeline(order(), NOW);
  assert.deepEqual(keys(t), ['placed', 'paid', 'dispute', 'final']);
  assert.equal(step(t, 'placed').state, 'done');
  assert.equal(step(t, 'paid').state, 'done');
  assert.equal(step(t, 'paid').at, '2026-11-14T09:13:00+07:00');
  assert.equal(step(t, 'dispute').state, 'current');
  assert.equal(step(t, 'dispute').at, '2026-11-15T09:13:00+07:00');
  assert.equal(step(t, 'final').state, 'upcoming');
  assert.equal(step(t, 'final').label, 'Completed');
});

test('Locked da qua han khieu nai', () => {
  const t = lib().orderTimeline(order({ disputeDeadline: '2026-11-14T19:00:00+07:00' }), NOW);
  assert.equal(step(t, 'dispute').state, 'done');
  assert.match(step(t, 'dispute').label, /closed/i);
});

test('da bo quyen khieu nai vi dang ban lai ve', () => {
  const t = lib().orderTimeline(order({ disputeWaived: true }), NOW);
  assert.equal(step(t, 'dispute').state, 'done');
  assert.match(step(t, 'dispute').label, /waived/i);
  assert.match(step(t, 'dispute').detail, /resold/i);
});

test('Disputed: buoc cuoi dang cho ket qua', () => {
  const t = lib().orderTimeline(order({ status: 'Disputed', disputeId: 'd-1' }), NOW);
  assert.match(step(t, 'dispute').label, /dispute opened/i);
  assert.equal(step(t, 'dispute').state, 'done');
  assert.equal(step(t, 'final').state, 'current');
  assert.match(step(t, 'final').label, /dispute result/i);
});

test('Released va Releasing: buoc cuoi Completed', () => {
  for (const status of ['Released', 'Releasing']) {
    const t = lib().orderTimeline(order({ status, disputeDeadline: null }), NOW);
    assert.equal(step(t, 'final').label, 'Completed', status);
    assert.equal(step(t, 'final').state, 'done', status);
    assert.equal(step(t, 'dispute').state, 'done', status);
  }
});

test('Refunded: buoc cuoi kem ngay hoan', () => {
  const t = lib().orderTimeline(
    order({ status: 'Refunded', disputeId: 'd-1', refundedAt: '2026-11-10T14:00:00+07:00' }),
    NOW
  );
  assert.equal(step(t, 'final').label, 'Refunded');
  assert.equal(step(t, 'final').state, 'done');
  assert.equal(step(t, 'final').at, '2026-11-10T14:00:00+07:00');
});

test('RefundQueued chua chuyen ve: buoc tra tien ghi ve chua chuyen duoc', () => {
  const t = lib().orderTimeline(order({ status: 'RefundQueued', transferredAt: null, disputeDeadline: null }), NOW);
  assert.deepEqual(keys(t), ['placed', 'paid', 'final']);
  assert.match(step(t, 'paid').label, /not transferred/i);
  assert.equal(step(t, 'final').state, 'current');
  assert.match(step(t, 'final').label, /refund/i);
});

test('Pending: buoc tra tien dang dien ra', () => {
  const t = lib().orderTimeline(unpaid('Pending'), NOW);
  assert.deepEqual(keys(t), ['placed', 'paid', 'dispute', 'final']);
  assert.equal(step(t, 'paid').state, 'current');
  assert.equal(step(t, 'dispute').state, 'upcoming');
  assert.equal(step(t, 'final').state, 'upcoming');
});

test('Expired va Cancelled chi con buoc dat don va buoc cuoi', () => {
  for (const status of ['Expired', 'Cancelled']) {
    const t = lib().orderTimeline(unpaid(status), NOW);
    assert.deepEqual(keys(t), ['placed', 'final'], status);
    assert.equal(step(t, 'final').label, status);
    assert.equal(step(t, 'final').state, 'done');
    assert.equal(step(t, 'final').at, '2026-11-14T09:22:00+07:00');
  }
});

test('trang thai la: buoc cuoi ghi nguyen van', () => {
  const t = lib().orderTimeline(order({ status: 'OnHoldByAdmin' }), NOW);
  assert.equal(step(t, 'final').label, 'OnHoldByAdmin');
});

// ---------- 3.7 Tu khoa va tham so ----------
test('bo tien to ORD- khoi tu khoa', () => {
  assert.equal(lib().normalizeOrderKeyword('  ORD-TS7F3K9A2B '), 'TS7F3K9A2B');
  assert.equal(lib().normalizeOrderKeyword('ord-ts7f3k9a2b'), 'ts7f3k9a2b');
  assert.equal(lib().normalizeOrderKeyword('Anh Trai'), 'Anh Trai');
  assert.equal(lib().normalizeOrderKeyword('ORD-'), '');
  assert.equal(lib().normalizeOrderKeyword(''), '');
});

test('5 nut loc ra dung status cua BE', () => {
  const want = { all: undefined, escrow: 'Locked', completed: 'Released', dispute: 'Disputed', refunded: 'Refunded' };
  for (const [filter, status] of Object.entries(want)) {
    const params = lib().toOrderParams({ page: 1, keyword: '', filter });
    assert.equal(params.status, status, filter);
    assert.equal('status' in params, status !== undefined, filter);
  }
  assert.deepEqual(
    lib().ORDER_FILTERS.map((f) => f.label),
    ['All', 'Held in escrow', 'Completed', 'In dispute', 'Refunded']
  );
});

test('size luon 10, tu khoa rong khong gui', () => {
  const p = lib().toOrderParams({ page: 3, keyword: '  ', filter: 'all' });
  assert.deepEqual(p, { page: 3, size: 10 });
  assert.equal(lib().toOrderParams({ page: 1, keyword: 'ORD-TS1', filter: 'all' }).keyword, 'TS1');
});

// ---------- 3.8 Tab va loi sang My Tickets ----------
test('doc tab tren URL', () => {
  for (const tab of ['orders', 'tickets', 'listings']) assert.equal(lib().readProfileTab(tab), tab);
  assert.equal(lib().readProfileTab('abc'), 'account');
  assert.equal(lib().readProfileTab('account'), 'account');
  assert.equal(lib().readProfileTab(null), 'account');
});

test('chi don da chuyen ve va chua hoan moi sang My Tickets', () => {
  assert.equal(lib().canOpenMyTickets(order()), true);
  assert.equal(lib().canOpenMyTickets(order({ status: 'Released' })), true);
  assert.equal(lib().canOpenMyTickets(unpaid('Pending')), false);
  assert.equal(lib().canOpenMyTickets(order({ status: 'Refunded' })), false);
  assert.equal(lib().canOpenMyTickets(order({ status: 'RefundQueued' })), false);
});

(async () => {
  console.log('\n TICKETSHIELD WEB - US-11.2 BUYER ORDER HISTORY\n');
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
