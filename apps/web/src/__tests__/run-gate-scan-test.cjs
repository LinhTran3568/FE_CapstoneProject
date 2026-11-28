// US-9.4: test logic tab Soat ve. Chay bang: npm run test:gate
const assert = require('node:assert/strict');

const gate = () => require('../utils/gateScan');

const response = (overrides = {}) => ({
  scanId: 'scan-1',
  result: 'SUCCESS',
  ticketCode: 'ATSH-GA-999',
  eventName: 'Anh Trai Say Hi Concert 2026',
  seatZone: 'GA Standing Zone 1',
  scannedAt: '2026-11-02T12:30:00Z',
  firstScannedAt: null,
  firstGateName: null,
  ...overrides,
});

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------- Ma ve ----------
test('ma ve bo khoang trang hai dau', () => {
  assert.equal(gate().normalizeTicketCode('  ATSH-GA-999 \n'), 'ATSH-GA-999');
});

test('ma ve giu nguyen chu hoa chu thuong', () => {
  assert.equal(gate().normalizeTicketCode('atsh-ga-999'), 'atsh-ga-999');
});

test('ma ve rong tra null', () => {
  assert.equal(gate().normalizeTicketCode(''), null);
  assert.equal(gate().normalizeTicketCode('   '), null);
});

test('ma ve dai hon 50 ky tu tra null', () => {
  assert.equal(gate().normalizeTicketCode('A'.repeat(51)), null);
  assert.equal(gate().normalizeTicketCode('A'.repeat(50)), 'A'.repeat(50));
});

// ---------- The ket qua ----------
test('SUCCESS ra the xanh kem su kien va khu ghe', () => {
  const view = gate().getScanResultView(response());
  assert.equal(view.tone, 'success');
  assert.equal(view.title, 'APPROVED - PLEASE ENTER');
  assert.ok(view.detail.includes('Anh Trai Say Hi Concert 2026'));
  assert.ok(view.detail.includes('GA Standing Zone 1'));
  assert.equal(view.canRetry, false);
});

test('DUPLICATE_ENTRY co gio va cong lan truoc', () => {
  const view = gate().getScanResultView(
    response({
      result: 'DUPLICATE_ENTRY',
      firstScannedAt: '2026-11-02T12:30:00Z',
      firstGateName: 'Gate A',
    })
  );
  assert.equal(view.tone, 'danger');
  assert.equal(view.title, 'REJECTED - TICKET ALREADY USED');
  assert.ok(view.detail.includes('19:30'));
  assert.ok(view.detail.includes('Gate A'));
  assert.equal(view.canRetry, false);
});

test('DUPLICATE_ENTRY khong co gio lan truoc van ra do', () => {
  const view = gate().getScanResultView(response({ result: 'DUPLICATE_ENTRY' }));
  assert.equal(view.tone, 'danger');
  assert.equal(view.detail, null);
});

test('REVOKED ra the do dung ly do', () => {
  const view = gate().getScanResultView(response({ result: 'REVOKED' }));
  assert.equal(view.tone, 'danger');
  assert.equal(view.title, 'REJECTED - TICKET TRANSFERRED OR CANCELLED');
});

test('INVALID_TICKET ra the do dung ly do', () => {
  const view = gate().getScanResultView(response({ result: 'INVALID_TICKET' }));
  assert.equal(view.tone, 'danger');
  assert.equal(view.title, 'REJECTED - TICKET NOT FOUND');
});

test('ma ket qua la ra the vang va cho thu lai', () => {
  const view = gate().getScanResultView(response({ result: 'SOMETHING_NEW' }));
  assert.equal(view.tone, 'warning');
  assert.equal(view.title, 'NOT VERIFIED - TRY AGAIN');
  assert.equal(view.canRetry, true);
});

test('thieu ket qua ra the vang va cho thu lai', () => {
  for (const value of [null, undefined]) {
    const view = gate().getScanResultView(value);
    assert.equal(view.tone, 'warning');
    assert.equal(view.canRetry, true);
  }
});

test('khong duong nao mac dinh ra xanh', () => {
  const { getScanResultView } = gate();
  for (const result of ['', 'success', 'Success', 'OK', 'VALID', 'USED']) {
    assert.notEqual(getScanResultView(response({ result })).tone, 'success');
  }
});

// ---------- Nhat ky ----------
test('nhan nhat ky cong theo ket qua', () => {
  const { getScanLogLabel } = gate();
  assert.equal(getScanLogLabel('SUCCESS'), 'Valid');
  assert.equal(getScanLogLabel('DUPLICATE_ENTRY'), 'Already used');
  assert.equal(getScanLogLabel('REVOKED'), 'Transferred or cancelled');
  assert.equal(getScanLogLabel('INVALID_TICKET'), 'Not found');
  assert.equal(getScanLogLabel('SOMETHING_NEW'), 'SOMETHING_NEW');
});

// ---------- Goi API ----------
const api = () => require('../utils/gateScanApi');
const request = { scanId: 'scan-1', ticketCode: 'ATSH-GA-999', gateName: 'Gate A' };
const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('goi dung dia chi va dung body', async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    return jsonResponse(200, response());
  };
  await api().scanGateTicket('http://localhost:5001/api/organizer', request, { fetchFn });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://localhost:5001/api/organizer/gate/scan');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), request);
});

test('HTTP 200 tra ket qua cua API', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    fetchFn: async () => jsonResponse(200, response({ result: 'REVOKED' })),
  });
  assert.equal(outcome.kind, 'result');
  assert.equal(outcome.response.result, 'REVOKED');
});

test('HTTP 400 bao loi nhap', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    fetchFn: async () => jsonResponse(400, {}),
  });
  assert.equal(outcome.kind, 'invalid');
});

test('HTTP 5xx la chua kiem tra duoc, khong phai tu choi', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    fetchFn: async () => jsonResponse(503, {}),
  });
  assert.equal(outcome.kind, 'unverified');
});

test('mat ket noi la chua kiem tra duoc', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    fetchFn: async () => {
      throw new TypeError('Failed to fetch');
    },
  });
  assert.equal(outcome.kind, 'unverified');
});

test('qua thoi gian cho la chua kiem tra duoc', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    timeoutMs: 10,
    fetchFn: (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  });
  assert.equal(outcome.kind, 'unverified');
});

test('HTTP 200 nhung body hong la chua kiem tra duoc', async () => {
  const outcome = await api().scanGateTicket('http://mock', request, {
    fetchFn: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }),
  });
  assert.equal(outcome.kind, 'unverified');
});

(async () => {
  console.log('\n TICKETSHIELD WEB - US-9.4 GATE SCAN\n');
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
