export const MIN_ACCOUNT_DIGITS = 6;

export type LookupStatus = 'idle' | 'searching' | 'verified' | 'failed';
type NameSource = 'none' | 'lookup' | 'manual';

export interface PayoutAccountFormState {
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  nameSource: NameSource;
  lookup: LookupStatus;
}

export type PayoutAccountFormEvent =
  | { type: 'bankChanged'; bankCode: string }
  | { type: 'numberChanged'; accountNumber: string }
  | { type: 'nameEdited'; accountHolderName: string }
  | { type: 'lookupSucceeded'; bankCode: string; accountNumber: string; accountName: string }
  | { type: 'lookupFailed'; bankCode: string; accountNumber: string }
  | { type: 'reset' };

export const initialFormState: PayoutAccountFormState = {
  bankCode: 'MB',
  accountNumber: '',
  accountHolderName: '',
  nameSource: 'none',
  lookup: 'idle',
};

/** Tên tra được chỉ đúng với cặp ngân hàng và số đó, đổi một trong hai là bỏ. */
const withNewAccount = (
  state: PayoutAccountFormState,
  bankCode: string,
  accountNumber: string
): PayoutAccountFormState => {
  const nameFromLookup = state.nameSource === 'lookup';
  return {
    bankCode,
    accountNumber,
    accountHolderName: nameFromLookup ? '' : state.accountHolderName,
    nameSource: nameFromLookup ? 'none' : state.nameSource,
    lookup: accountNumber.length >= MIN_ACCOUNT_DIGITS ? 'searching' : 'idle',
  };
};

const isCurrentAccount = (
  state: PayoutAccountFormState,
  event: { bankCode: string; accountNumber: string }
) => event.bankCode === state.bankCode && event.accountNumber === state.accountNumber;

export function payoutAccountFormReducer(
  state: PayoutAccountFormState,
  event: PayoutAccountFormEvent
): PayoutAccountFormState {
  switch (event.type) {
    case 'bankChanged':
      if (event.bankCode === state.bankCode) return state;
      return withNewAccount(state, event.bankCode, state.accountNumber);
    case 'numberChanged': {
      const accountNumber = event.accountNumber.replace(/\D/g, '');
      if (accountNumber === state.accountNumber) return state;
      return withNewAccount(state, state.bankCode, accountNumber);
    }
    case 'nameEdited': {
      const accountHolderName = event.accountHolderName.toUpperCase();
      return {
        ...state,
        accountHolderName,
        nameSource: accountHolderName ? 'manual' : 'none',
        lookup: state.lookup === 'verified' ? 'idle' : state.lookup,
      };
    }
    case 'lookupSucceeded':
      if (!isCurrentAccount(state, event)) return state;
      return {
        ...state,
        accountHolderName: event.accountName.trim().toUpperCase(),
        nameSource: 'lookup',
        lookup: 'verified',
      };
    case 'lookupFailed':
      if (!isCurrentAccount(state, event)) return state;
      return { ...state, lookup: 'failed' };
    case 'reset':
      return initialFormState;
  }
}

/** Đang tra thì khoá, kể cả lúc chờ debounce, để tên về muộn không đổi sau khi người dùng đã xem lại. */
export const canContinue = (state: PayoutAccountFormState) =>
  state.accountNumber.length >= MIN_ACCOUNT_DIGITS &&
  state.accountHolderName.trim().length > 0 &&
  state.lookup !== 'searching';
