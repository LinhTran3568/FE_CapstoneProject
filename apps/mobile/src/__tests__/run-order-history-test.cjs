// US-9.5: test logic don hang va form STK mobile. Chay bang: npm run test:orders
const assert = require('node:assert/strict');

const orders = () => require('../utils/orderView');
const form = () => require('../utils/payoutAccountForm');

const listing = (overrides = {}) => ({
  listingId: 'listing-1',
  eventId: 'event-1',
  eventName: 'Concert',
  eventVenue: 'Stadium',
  eventStartAt: '2026-12-01T13:00:00.000Z',
  tierId: 'tier-1',
  tierName: 'GA',
  seatZone: 'Zone A',
  originalTicketCode: 'ATSH-GA-001',
  originalPrice: 500000,
  resalePrice: 450000,
  discountAmount: 50000,
  discountPercentage: 10,
  isPrivate: false,
  privateAccessToken: null,
  shareUrl: null,
  verificationStatus: 'Verified',
  listingStatus: 'Sold',
  escrowStatus: null,
  payoutStatus: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  bundleId: null,
  bundleTotalTickets: null,
  ...overrides,
});

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------- Nhan tien don mua ----------
test('don mua hien nhan tien theo trang thai', () => {
  const { getPurchaseMoneyLabel } = orders();
  assert.equal(getPurchaseMoneyLabel('IN_ESCROW').label, 'On hold');
  assert.equal(getPurchaseMoneyLabel('RELEASING').label, 'Awaiting receipt');
  assert.equal(getPurchaseMoneyLabel('VALID').label, 'Paid out');
  assert.equal(getPurchaseMoneyLabel('DISPUTED').label, 'In dispute');
  assert.equal(getPurchaseMoneyLabel('REFUNDED').label, 'Refunded');
});

test('nhan don mua khong phan biet hoa thuong va khoang trang', () => {
  const { getPurchaseMoneyLabel } = orders();
  assert.equal(getPurchaseMoneyLabel(' in_escrow ').label, 'On hold');
});

test('trang thai la cua don mua giu nguyen gia tri BE tra', () => {
  const { getPurchaseMoneyLabel } = orders();
  assert.equal(getPurchaseMoneyLabel('PENDING_PAYMENT').label, 'PENDING_PAYMENT');
});

test('don mua khong co trang thai hien gach ngang', () => {
  const { getPurchaseMoneyLabel } = orders();
  assert.equal(getPurchaseMoneyLabel('').label, '—');
});

test('don mua chi VALID moi ra Paid out', () => {
  const { getPurchaseMoneyLabel } = orders();
  ['IN_ESCROW', 'RELEASING', 'DISPUTED', 'REFUNDED', 'PENDING_PAYMENT', ''].forEach((status) => {
    assert.notEqual(getPurchaseMoneyLabel(status).label, 'Paid out', status);
  });
});

test('mau cua nhan tien don mua theo muc do', () => {
  const { getPurchaseMoneyLabel } = orders();
  assert.equal(getPurchaseMoneyLabel('IN_ESCROW').tone, 'warning');
  assert.equal(getPurchaseMoneyLabel('VALID').tone, 'success');
  assert.equal(getPurchaseMoneyLabel('REFUNDED').tone, 'danger');
  assert.equal(getPurchaseMoneyLabel('PENDING_PAYMENT').tone, 'muted');
});

// ---------- Nhan tin ban ----------
test('nhan tin ban giong web', () => {
  const { getListingPill } = orders();
  assert.equal(getListingPill('Verified'), 'ON SALE');
  assert.equal(getListingPill('Transacting'), 'PROCESSING');
  assert.equal(getListingPill('Sold'), 'SOLD');
  assert.equal(getListingPill('Cancelled'), 'CANCELLED');
  assert.equal(getListingPill('Expired'), 'EXPIRED');
});

test('nhan tin la viet hoa giong web', () => {
  const { getListingPill } = orders();
  assert.equal(getListingPill('Draft'), 'DRAFT');
});

// ---------- Nhan tien tin ban ----------
test('tin chua ban khong co nhan tien du con giao dich cu', () => {
  const { getListingMoney } = orders();
  ['Verified', 'Transacting', 'Cancelled', 'Expired'].forEach((listingStatus) => {
    assert.equal(getListingMoney(listing({ listingStatus, escrowStatus: 'Expired' })), null, listingStatus);
    assert.equal(getListingMoney(listing({ listingStatus, escrowStatus: 'Released' })), null, listingStatus);
  });
});

test('tin da ban thieu giao dich thi khong co nhan tien', () => {
  const { getListingMoney } = orders();
  assert.equal(getListingMoney(listing({ escrowStatus: null })), null);
  assert.equal(getListingMoney(listing({ escrowStatus: undefined })), null);
  assert.equal(getListingMoney(listing({ escrowStatus: '' })), null);
});

test('tin da ban hien nhan tien theo giao dich', () => {
  const { getListingMoney } = orders();
  const labelOf = (escrowStatus) => getListingMoney(listing({ escrowStatus })).label;
  assert.equal(labelOf('Locked'), 'On hold');
  assert.equal(labelOf('Releasing'), 'Awaiting receipt');
  assert.equal(labelOf('Released'), 'Paid out');
  assert.equal(labelOf('Disputed'), 'In dispute');
  assert.equal(labelOf('Refunded'), 'Refunded');
});

test('nhan tien binh thuong khong co dong nhac', () => {
  const { getListingMoney } = orders();
  assert.equal(getListingMoney(listing({ escrowStatus: 'Locked' })).hint, null);
});

test('giao dich la cua tin da ban giu nguyen gia tri, khong ra Paid out', () => {
  const { getListingMoney } = orders();
  assert.equal(getListingMoney(listing({ escrowStatus: 'Frozen' })).label, 'Frozen');
});

test('chuyen tien loi hien Could not send kem dong nhac', () => {
  const { getListingMoney } = orders();
  const money = getListingMoney(listing({ escrowStatus: 'Locked', payoutStatus: 'Failed' }));
  assert.equal(money.label, 'Could not send');
  assert.equal(money.hint, 'Check the receiving account.');
  assert.equal(money.tone, 'danger');
});

test('dang giu tien va chua loi chi tra thi van la On hold', () => {
  const { getListingMoney } = orders();
  ['Pending', 'Processing', null].forEach((payoutStatus) => {
    assert.equal(
      getListingMoney(listing({ escrowStatus: 'Locked', payoutStatus })).label,
      'On hold',
      String(payoutStatus)
    );
  });
});

test('khieu nai moi hon nen thang chi tra loi', () => {
  const { getListingMoney } = orders();
  const disputed = getListingMoney(listing({ escrowStatus: 'Disputed', payoutStatus: 'Failed' }));
  assert.equal(disputed.label, 'In dispute');
  assert.equal(disputed.hint, null);
  const refunded = getListingMoney(listing({ escrowStatus: 'Refunded', payoutStatus: 'Failed' }));
  assert.equal(refunded.label, 'Refunded');
});

test('tin chua ban khong bao Could not send du lan chi tra cu loi', () => {
  const { getListingMoney } = orders();
  const relisted = listing({ listingStatus: 'Verified', escrowStatus: 'Locked', payoutStatus: 'Failed' });
  assert.equal(getListingMoney(relisted), null);
});

// ---------- Ve goi ----------
test('tin le khong co nhan COMBO', () => {
  const { getComboLabel } = orders();
  assert.equal(getComboLabel(listing()), null);
  assert.equal(getComboLabel(listing({ bundleTotalTickets: 1 })), null);
});

test('tin trong goi hien so ve cua goi', () => {
  const { getComboLabel } = orders();
  assert.equal(getComboLabel(listing({ bundleId: 'bundle-1', bundleTotalTickets: 3 })), 'COMBO (3 VÉ)');
});

test('khong co bundleId nhung co so ve van la goi', () => {
  const { getComboLabel } = orders();
  assert.equal(getComboLabel(listing({ bundleTotalTickets: 4 })), 'COMBO (4 VÉ)');
});

test('goi thieu so ve thi hien 2 ve giong web', () => {
  const { getComboLabel } = orders();
  assert.equal(getComboLabel(listing({ bundleId: 'bundle-1' })), 'COMBO (2 VÉ)');
});

// ---------- Form STK: tra ten ----------
const apply = (...events) => {
  const { payoutAccountFormReducer, initialFormState } = form();
  return events.reduce(payoutAccountFormReducer, initialFormState);
};

const numberEvent = (accountNumber) => ({ type: 'numberChanged', accountNumber });
const bankEvent = (bankCode) => ({ type: 'bankChanged', bankCode });
const nameEvent = (accountHolderName) => ({ type: 'nameEdited', accountHolderName });
const found = (accountNumber, accountName = 'NGUYEN VAN A', bankCode = 'MB') => ({
  type: 'lookupSucceeded',
  bankCode,
  accountNumber,
  accountName,
});
const notFound = (accountNumber, bankCode = 'MB') => ({ type: 'lookupFailed', bankCode, accountNumber });

const NUMBER_A = '0938434102';
const NUMBER_B = '0123456789';

test('du 6 chu so thi bat dau tra ten', () => {
  assert.equal(apply(numberEvent('12345')).lookup, 'idle');
  assert.equal(apply(numberEvent('123456')).lookup, 'searching');
});

test('so tai khoan chi giu chu so', () => {
  assert.equal(apply(numberEvent('09-38 abc')).accountNumber, '0938');
});

test('tra duoc ten thi dien ten va danh dau da xac minh', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A));
  assert.equal(state.accountHolderName, 'NGUYEN VAN A');
  assert.equal(state.lookup, 'verified');
});

test('ten tra ve duoc viet hoa va bo khoang trang thua', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A, ' nguyen van a '));
  assert.equal(state.accountHolderName, 'NGUYEN VAN A');
});

test('ket qua cua so cu ve cham thi bi bo qua', () => {
  const state = apply(numberEvent(NUMBER_A), numberEvent(NUMBER_B), found(NUMBER_A, 'TEN SO A'));
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'searching');
});

test('ket qua cua so cu ve truoc roi so moi van dien dung ten so moi', () => {
  const state = apply(
    numberEvent(NUMBER_A),
    numberEvent(NUMBER_B),
    found(NUMBER_A, 'TEN SO A'),
    found(NUMBER_B, 'TEN SO B')
  );
  assert.equal(state.accountHolderName, 'TEN SO B');
  assert.equal(state.lookup, 'verified');
});

test('ket qua cua ngan hang cu ve cham thi bi bo qua', () => {
  const state = apply(numberEvent(NUMBER_A), bankEvent('VCB'), found(NUMBER_A, 'TEN CU', 'MB'));
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'searching');
});

test('that bai cua so cu khong lam hong lan tra moi', () => {
  const state = apply(numberEvent(NUMBER_A), numberEvent(NUMBER_B), notFound(NUMBER_A));
  assert.equal(state.lookup, 'searching');
});

test('doi ngan hang xoa ten da tra va tra lai', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A), bankEvent('VCB'));
  assert.equal(state.bankCode, 'VCB');
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'searching');
});

test('doi so xoa ten da tra', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A), numberEvent(NUMBER_B));
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'searching');
});

test('xoa bot so duoi 6 chu so thi het xac minh', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A), numberEvent('123'));
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'idle');
});

test('doi so giu ten tu go', () => {
  const state = apply(
    numberEvent(NUMBER_A),
    notFound(NUMBER_A),
    nameEvent('TEN TU GO'),
    numberEvent(NUMBER_B)
  );
  assert.equal(state.accountHolderName, 'TEN TU GO');
});

test('doi ngan hang giu ten tu go', () => {
  const state = apply(
    numberEvent(NUMBER_A),
    notFound(NUMBER_A),
    nameEvent('TEN TU GO'),
    bankEvent('VCB')
  );
  assert.equal(state.accountHolderName, 'TEN TU GO');
});

test('sua ten da tra thi mat xac minh va giu ten vua go', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A), nameEvent('NGUYEN VAN B'));
  assert.equal(state.lookup, 'idle');
  assert.equal(state.accountHolderName, 'NGUYEN VAN B');
});

test('ten tu go duoc viet hoa va giu khoang trang giua cac tu', () => {
  assert.equal(apply(nameEvent('nguyen van ')).accountHolderName, 'NGUYEN VAN ');
});

test('sua ten da tra roi doi so thi giu ten vua go', () => {
  const state = apply(
    numberEvent(NUMBER_A),
    found(NUMBER_A),
    nameEvent('NGUYEN VAN B'),
    numberEvent(NUMBER_B)
  );
  assert.equal(state.accountHolderName, 'NGUYEN VAN B');
});

test('tra that bai thi cho tu nhap', () => {
  const failed = apply(numberEvent(NUMBER_A), notFound(NUMBER_A));
  assert.equal(failed.lookup, 'failed');
  const typed = apply(numberEvent(NUMBER_A), notFound(NUMBER_A), nameEvent('TEN TU GO'));
  assert.equal(typed.accountHolderName, 'TEN TU GO');
  assert.equal(typed.lookup, 'failed');
});

test('go ky tu khong doi so thi khong ket o dang tra', () => {
  const state = apply(numberEvent(NUMBER_A), notFound(NUMBER_A), numberEvent(`${NUMBER_A}x`));
  assert.equal(state.lookup, 'failed');
});

test('chon lai dung ngan hang cu thi khong ket o dang tra', () => {
  const state = apply(numberEvent(NUMBER_A), found(NUMBER_A), bankEvent('MB'));
  assert.equal(state.lookup, 'verified');
  assert.equal(state.accountHolderName, 'NGUYEN VAN A');
});

test('xoa form ve mac dinh', () => {
  const state = apply(bankEvent('VCB'), numberEvent(NUMBER_A), found(NUMBER_A, 'TEN', 'VCB'), {
    type: 'reset',
  });
  assert.equal(state.bankCode, 'MB');
  assert.equal(state.accountNumber, '');
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'idle');
});

test('ket qua ve sau khi da xoa form thi bi bo qua', () => {
  const state = apply(numberEvent(NUMBER_A), { type: 'reset' }, found(NUMBER_A));
  assert.equal(state.accountHolderName, '');
  assert.equal(state.lookup, 'idle');
});

// ---------- Form STK: nut tiep tuc ----------
test('du so va ten thi duoc tiep tuc', () => {
  const { canContinue } = form();
  assert.equal(canContinue(apply(numberEvent(NUMBER_A), found(NUMBER_A))), true);
});

test('duoi 6 chu so thi khong duoc tiep tuc', () => {
  const { canContinue } = form();
  assert.equal(canContinue(apply(numberEvent('12345'), nameEvent('TEN TU GO'))), false);
});

test('ten rong thi khong duoc tiep tuc', () => {
  const { canContinue } = form();
  assert.equal(canContinue(apply(numberEvent(NUMBER_A), notFound(NUMBER_A))), false);
  assert.equal(canContinue(apply(numberEvent(NUMBER_A), notFound(NUMBER_A), nameEvent('   '))), false);
});

test('dang tra ten thi khong duoc tiep tuc, ke ca da co ten tu go', () => {
  const { canContinue } = form();
  const state = apply(nameEvent('TEN TU GO'), numberEvent(NUMBER_A));
  assert.equal(state.lookup, 'searching');
  assert.equal(canContinue(state), false);
});

test('tra that bai va tu nhap ten thi duoc tiep tuc', () => {
  const { canContinue } = form();
  const state = apply(numberEvent(NUMBER_A), notFound(NUMBER_A), nameEvent('TEN TU GO'));
  assert.equal(canContinue(state), true);
});

(async () => {
  console.log('\n TICKETSHIELD MOBILE - US-9.5 ORDER HISTORY\n');
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
