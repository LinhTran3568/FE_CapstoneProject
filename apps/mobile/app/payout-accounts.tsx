import React, { useState, useEffect, useCallback, useReducer } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../src/components/AppText';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
import { UserBankAccountDto } from '@ticketshield/types';
import { FintechButton } from '../src/components/FintechButton';
import { FintechInput } from '../src/components/FintechInput';
import {
  MIN_ACCOUNT_DIGITS,
  canContinue,
  initialFormState,
  payoutAccountFormReducer,
} from '../src/utils/payoutAccountForm';
import { theme } from '../src/theme';
import { styles } from '../src/styles/payout-accounts.styles';

const LOOKUP_DEBOUNCE_MS = 600;

const getBankNameByCode = (code: string) => {
  const bank = VIETNAM_BANKS.find((item) => item.code.toUpperCase() === code.toUpperCase());
  return bank ? bank.name : code;
};

export default function PayoutAccountsScreen() {
  // Danh sách tài khoản đã liên kết
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Form: bước 1 nhập liệu, bước 2 xác nhận lại
  const [formStep, setFormStep] = useState<'input' | 'confirm'>('input');
  const [form, dispatch] = useReducer(payoutAccountFormReducer, initialFormState);
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal chọn ngân hàng
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);

  const { bankCode, accountNumber, accountHolderName, lookup } = form;
  const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];
  const holderName = accountHolderName.trim();

  const fetchBankAccounts = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const res = await bankAccountsApi.getMyBankAccounts();
      setBankAccounts(res || []);
    } catch (err: any) {
      console.warn('[PayoutAccounts] Error loading accounts:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Tự động tra cứu tên chủ tài khoản khi nhập đủ số tài khoản
  useEffect(() => {
    if (accountNumber.length < MIN_ACCOUNT_DIGITS) return;

    const timer = setTimeout(async () => {
      try {
        const res = await bankAccountsApi.lookupAccountHolderName(bankCode, accountNumber);
        if (res.success && res.accountName) {
          dispatch({
            type: 'lookupSucceeded',
            bankCode,
            accountNumber,
            accountName: res.accountName,
          });
        } else {
          dispatch({ type: 'lookupFailed', bankCode, accountNumber });
        }
      } catch {
        dispatch({ type: 'lookupFailed', bankCode, accountNumber });
      }
    }, LOOKUP_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [bankCode, accountNumber]);

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    try {
      await bankAccountsApi.addBankAccount({
        bankCode,
        bankAccountNumber: accountNumber,
        accountHolderName: holderName,
        isDefault,
      });

      Alert.alert('Success', 'Bank account linked successfully!');
      dispatch({ type: 'reset' });
      setIsDefault(true);
      setFormStep('input');
      await fetchBankAccounts();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to link bank account. Please try again!';
      Alert.alert('Link Account Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLinkedAccounts = () => {
    if (isLoadingList) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading bank accounts...</Text>
        </View>
      );
    }

    if (bankAccounts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <CreditCard size={36} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No payout account linked</Text>
          <Text style={styles.emptyText}>
            Add your beneficiary bank account using the form below to receive automatic payouts.
          </Text>
        </View>
      );
    }

    return bankAccounts.map((account) => (
      <View
        key={account.id}
        style={[styles.accountCard, account.isDefault && styles.accountCardDefault]}
      >
        <View style={styles.accountCardHeader}>
          <View style={styles.bankChip}>
            <Text style={styles.bankChipText}>{account.bankCode}</Text>
          </View>
          <Text style={styles.bankName} numberOfLines={1}>
            {getBankNameByCode(account.bankCode)}
          </Text>
          {account.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>

        <Text style={styles.accountNumber}>{account.bankAccountNumber}</Text>

        <View style={styles.accountCardBottom}>
          <Text style={styles.accountHolder} numberOfLines={1}>
            {account.accountHolderName}
          </Text>
          <View style={styles.verifiedTag}>
            <Check size={12} color={theme.colors.success} />
            <Text style={styles.verifiedTagText}>Bank Verified</Text>
          </View>
        </View>
      </View>
    ));
  };

  const renderLookupStatus = () => {
    if (lookup === 'searching' && accountNumber.length >= MIN_ACCOUNT_DIGITS) {
      return (
        <View style={styles.lookupRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.lookupSearchingText}>Verifying with bank...</Text>
        </View>
      );
    }
    if (lookup === 'verified') {
      return (
        <View style={styles.lookupRow}>
          <View style={styles.verifiedPill}>
            <Check size={12} color={theme.colors.success} />
            <Text style={styles.verifiedTagText}>Bank Verified</Text>
          </View>
        </View>
      );
    }
    if (lookup === 'failed') {
      return (
        <View style={styles.lookupRow}>
          <Text style={styles.lookupFailedText}>✏️ Enter name manually</Text>
        </View>
      );
    }
    return null;
  };

  const renderInputStep = () => (
    <>
      <View>
        <Text style={styles.formLabel}>Beneficiary Bank *</Text>
        <TouchableOpacity
          style={styles.bankSelectorBtn}
          onPress={() => setIsBankModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.bankSelectorText}>
            {selectedBank.name} ({selectedBank.code})
          </Text>
          <ChevronDown size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FintechInput
        label="Bank Account Number *"
        placeholder="Enter account number (e.g. 0938434102)"
        value={accountNumber}
        onChangeText={(txt) => dispatch({ type: 'numberChanged', accountNumber: txt })}
        keyboardType="numeric"
      />

      {/* Đặt trên ô tên để không bị bàn phím che khi đang nhập số tài khoản */}
      {renderLookupStatus()}

      <FintechInput
        label="Account Holder Name *"
        placeholder="NGUYEN VAN A"
        value={accountHolderName}
        onChangeText={(txt) => dispatch({ type: 'nameEdited', accountHolderName: txt })}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setIsDefault(!isDefault)}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDefault }}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
          {isDefault && <Check size={14} color={theme.colors.onPrimary} />}
        </View>
        <Text style={styles.checkboxLabel}>Set as default payout account</Text>
      </TouchableOpacity>

      <FintechButton
        title="Continue to Review"
        onPress={() => setFormStep('confirm')}
        disabled={!canContinue(form)}
        icon={<ArrowRight size={18} color={theme.colors.onPrimary} />}
      />
    </>
  );

  const renderConfirmStep = () => (
    <>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewHeading}>CONFIRM ACCOUNT DETAILS</Text>

        <View>
          <Text style={styles.reviewLabel}>Bank</Text>
          <Text style={styles.reviewValue}>
            {selectedBank.name} ({selectedBank.code})
          </Text>
        </View>

        <View>
          <Text style={styles.reviewLabel}>Account Number</Text>
          <Text style={styles.reviewNumber}>{accountNumber}</Text>
        </View>

        <View>
          <Text style={styles.reviewLabel}>Account Holder Name</Text>
          <Text style={styles.reviewName}>{holderName}</Text>
        </View>

        <View>
          <Text style={styles.reviewLabel}>Account Role</Text>
          <View style={styles.reviewRoleRow}>
            <CheckCircle2 size={14} color={theme.colors.success} />
            <Text style={styles.reviewRole}>
              {isDefault ? 'Default Payout Account' : 'Secondary Account'}
            </Text>
          </View>
        </View>

        <View style={styles.reviewNotice}>
          <AlertCircle size={16} color={theme.colors.warning} />
          <Text style={styles.reviewNoticeText}>
            Please verify your bank account number and beneficiary name before confirming.
          </Text>
        </View>
      </View>

      <FintechButton
        title={isSubmitting ? 'Saving Account...' : 'Confirm & Save Account'}
        onPress={handleConfirmSave}
        disabled={isSubmitting}
        icon={isSubmitting ? undefined : <Check size={18} color={theme.colors.onPrimary} />}
      />
      <FintechButton
        title="Back to Edit"
        onPress={() => setFormStep('input')}
        disabled={isSubmitting}
        variant="outline"
        icon={<ArrowLeft size={18} color={theme.colors.primary} />}
      />
    </>
  );

  const isConfirmStep = formStep === 'confirm';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Payout Accounts',
          headerShown: true,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Danh sách tài khoản đã liên kết */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.titleWithCount}>
                <Text style={styles.sectionTitle}>Linked Accounts</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{bankAccounts.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Beneficiary accounts for payout settlements
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchBankAccounts}
              disabled={isLoadingList}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Refresh"
            >
              <RefreshCw
                size={18}
                color={isLoadingList ? theme.colors.primary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {renderLinkedAccounts()}
        </View>

        {/* Form thêm tài khoản: bước 1 nhập, bước 2 xác nhận */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>
                {isConfirmStep ? 'Confirm Account Details' : 'Add Bank Account'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isConfirmStep
                  ? 'Step 2: Review account details before saving'
                  : 'Step 1: Enter beneficiary account number and bank'}
              </Text>
            </View>

            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, isConfirmStep ? styles.stepDotDone : styles.stepDotActive]}>
                {isConfirmStep ? (
                  <Check size={13} color={theme.colors.onSuccess} />
                ) : (
                  <Text style={styles.stepDotActiveText}>1</Text>
                )}
              </View>
              <View style={[styles.stepLine, isConfirmStep && styles.stepLineDone]} />
              <View style={[styles.stepDot, isConfirmStep && styles.stepDotActive]}>
                <Text style={isConfirmStep ? styles.stepDotActiveText : styles.stepDotText}>2</Text>
              </View>
            </View>
          </View>

          {isConfirmStep ? renderConfirmStep() : renderInputStep()}
        </View>
      </ScrollView>

      {/* Modal Chọn Ngân Hàng */}
      <Modal
        visible={isBankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setIsBankModalVisible(false)}>
                <X size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={VIETNAM_BANKS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isActive = item.code === bankCode;
                return (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => {
                      dispatch({ type: 'bankChanged', bankCode: item.code });
                      setIsBankModalVisible(false);
                    }}
                  >
                    <Text style={[styles.bankItemText, isActive && styles.bankItemActiveText]}>
                      {item.name} ({item.code})
                    </Text>
                    {isActive && <Check size={18} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
