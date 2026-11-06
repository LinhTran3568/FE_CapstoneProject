import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Text } from '../src/components/AppText';
import { Stack, useRouter } from 'expo-router';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  X,
  Plus,
} from 'lucide-react-native';
import { bankAccountsApi, BankInfo } from '@ticketshield/api-client';
import { UserBankAccountDto } from '@ticketshield/types';
import { FintechButton } from '../src/components/FintechButton';
import { FintechInput } from '../src/components/FintechInput';
import { theme } from '../src/theme';
import { styles } from '../src/styles/payout-accounts.styles';

export default function PayoutAccountsScreen() {
  const router = useRouter();

  // Danh sách tài khoản đã liên kết
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const hasLoadedAccountsRef = useRef(false);

  // Form liên kết tài khoản mới
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tra cứu tự động tên chủ tài khoản
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [isVerifiedName, setIsVerifiedName] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);

  // Modal chọn ngân hàng
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  const selectedBank = banks.find((b) => b.code === bankCode) ?? null;
  const normalizedBankSearch = bankSearch
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const filteredBanks = banks.filter((bank) =>
    [bank.name, bank.shortName, bank.code, bank.bin]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(normalizedBankSearch)
  );

  const fetchBankAccounts = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const res = await bankAccountsApi.getMyBankAccounts();
      const accounts = res || [];
      setBankAccounts(accounts);
      // The first payout account is required for selling, so keep its form open.
      // Once an account exists, the form becomes an explicit secondary action.
      if (!hasLoadedAccountsRef.current) {
        setIsAddFormVisible(accounts.length === 0);
        hasLoadedAccountsRef.current = true;
      }
    } catch (err: any) {
      console.warn('[PayoutAccounts] Error loading accounts:', err);
      if (!hasLoadedAccountsRef.current) {
        setIsAddFormVisible(true);
        hasLoadedAccountsRef.current = true;
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  useEffect(() => {
    let active = true;
    bankAccountsApi
      .getBanks()
      .then((items) => {
        if (!active) return;
        setBanks(items);
        setBankCode((current) => current || items[0]?.code || '');
      })
      .catch(() => {
        if (active) setBanks([]);
      })
      .finally(() => {
        if (active) setIsLoadingBanks(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Tự động tra cứu tên chủ tài khoản khi nhập đủ số tài khoản
  useEffect(() => {
    const cleanAcc = accountNumber.trim().replace(/\D/g, '');
    if (cleanAcc.length < 6) {
      setIsVerifiedName(false);
      setLookupFailed(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingName(true);
      setLookupFailed(false);
      try {
        const res = await bankAccountsApi.lookupAccountHolderName(selectedBank?.bin || '', cleanAcc);
        if (res.success && res.accountName) {
          setAccountHolderName(res.accountName);
          setIsVerifiedName(true);
          setLookupFailed(false);
        } else {
          setIsVerifiedName(false);
          setLookupFailed(true);
        }
      } catch {
        setIsVerifiedName(false);
        setLookupFailed(true);
      } finally {
        setIsSearchingName(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [accountNumber, selectedBank?.bin]);

  const handleLinkAccount = async () => {
    const cleanAcc = accountNumber.trim().replace(/\D/g, '');
    if (cleanAcc.length < 6) {
      Alert.alert('Validation Error', 'Please enter a valid bank account number (at least 6 digits).');
      return;
    }

    if (!accountHolderName.trim()) {
      Alert.alert('Validation Error', 'Account holder name is required.');
      return;
    }
    if (!selectedBank) {
      Alert.alert('Validation Error', 'Please select a bank from the current bank directory.');
      return;
    }

    setIsSubmitting(true);
    try {
      await bankAccountsApi.addBankAccount({
        bankCode,
        bankAccountNumber: cleanAcc,
        accountHolderName: accountHolderName.trim().toUpperCase(),
        isDefault,
      });

      Alert.alert('Success', 'Bank account linked successfully for resale payouts!');
      setAccountNumber('');
      setAccountHolderName('');
      setIsVerifiedName(false);
      setLookupFailed(false);
      await fetchBankAccounts();
      setIsAddFormVisible(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to link bank account. Please try again.';
      Alert.alert('Link Account Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.sectionTitle}>Linked Accounts</Text>
            {isLoadingList && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>

          {bankAccounts.length === 0 && !isLoadingList ? (
            <View style={styles.emptyContainer}>
              <CreditCard size={36} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>
                No payout bank accounts linked yet. Use the form below to link your first beneficiary account.
              </Text>
            </View>
          ) : (
            bankAccounts.map((acc, index) => {
              const bank = banks.find((b) => b.code === acc.bankCode);
              return (
                <View key={acc.id || index} style={styles.accountCard}>
                  <View style={styles.accountCardHeader}>
                    <View style={styles.bankInfoSlot}>
                      <View style={styles.bankBadgeIcon}>
                        <Building2 size={18} color={theme.colors.primary} />
                      </View>
                      <View style={styles.bankTextGroup}>
                        <Text style={styles.bankShortName}>{bank?.shortName || acc.bankCode}</Text>
                        <Text style={styles.bankFullName} numberOfLines={1}>
                          {bank?.name || acc.bankCode}
                        </Text>
                      </View>
                    </View>
                    {acc.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Check size={12} color={theme.colors.success} />
                        <Text style={styles.defaultBadgeText}>Default Payout</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.accountCardDivider} />

                  <View style={styles.accountCardBottom}>
                    <View>
                      <Text style={styles.accountNumberLabel}>Account Number</Text>
                      <Text style={styles.accountNumber}>{acc.bankAccountNumber}</Text>
                    </View>
                    <View style={styles.accountHolderGroup}>
                      <Text style={styles.accountHolderLabel}>Beneficiary Name</Text>
                      <Text style={styles.accountHolder}>{acc.accountHolderName}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {bankAccounts.length > 0 && !isLoadingList && !isAddFormVisible && (
          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => setIsAddFormVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add bank account"
          >
            <Plus size={18} color={theme.colors.primary} />
            <Text style={styles.addAccountButtonText}>Add Bank Account</Text>
          </TouchableOpacity>
        )}

        {/* Form liên kết tài khoản mới: only expand on demand after the first account. */}
        {isAddFormVisible && (
          <View style={styles.sectionCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>Link New Bank Account</Text>
              {bankAccounts.length > 0 && (
                <TouchableOpacity
                  style={styles.closeFormButton}
                  onPress={() => setIsAddFormVisible(false)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Close add bank account form"
                >
                  <X size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Chọn ngân hàng */}
            <View>
              <Text style={styles.formLabel}>Select Bank</Text>
              <TouchableOpacity
                style={styles.bankSelectorBtn}
                onPress={() => {
                  setBankSearch('');
                  setIsBankModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.bankSelectorText}>
                  {isLoadingBanks
                    ? 'Loading bank directory...'
                    : selectedBank
                      ? `${selectedBank.shortName} (${selectedBank.code}) — ${selectedBank.name}`
                      : 'Select a bank'}
                </Text>
                <ChevronDown size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

          {/* Nhập số tài khoản */}
            <FintechInput
            label="Account Number"
            placeholder="e.g. 0123456789"
            value={accountNumber}
            onChangeText={(txt) => setAccountNumber(txt.replace(/\D/g, ''))}
            keyboardType="numeric"
            icon={<CreditCard size={18} color={theme.colors.textSecondary} />}
          />

          {/* Trạng thái tra cứu tự động */}
            {isSearchingName && (
            <View style={styles.verifiedCard}>
              <ActivityIndicator size="small" color={theme.colors.success} />
              <Text style={styles.verifiedText}>Verifying account with NAPAS / VietQR...</Text>
            </View>
          )}

            {isVerifiedName && (
            <View style={styles.verifiedCard}>
              <CheckCircle2 size={18} color={theme.colors.success} />
              <Text style={styles.verifiedText}>
                Verified: {accountHolderName}
              </Text>
            </View>
          )}

            {lookupFailed && (
            <View style={styles.lookupErrorCard}>
              <AlertCircle size={18} color={theme.colors.danger} />
              <Text style={styles.lookupErrorText}>
                Could not automatically verify account holder. You can enter your name manually.
              </Text>
            </View>
          )}

          {/* Tên chủ tài khoản */}
            <FintechInput
            label="Account Holder Name"
            placeholder="FULL NAME (AS ON BANK ACCOUNT)"
            value={accountHolderName}
            onChangeText={(txt) => setAccountHolderName(txt.toUpperCase())}
            autoCapitalize="characters"
          />

          {/* Checkbox đặt làm mặc định */}
            <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsDefault(!isDefault)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
              {isDefault && <Check size={14} color={theme.colors.onPrimary} />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default payout account</Text>
          </TouchableOpacity>

          {/* Nút Submit */}
            <FintechButton
            title="Link Bank Account"
            onPress={handleLinkAccount}
            loading={isSubmitting}
            icon={<Plus size={18} color={theme.colors.onPrimary} />}
          />
          </View>
        )}
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
              <TouchableOpacity onPress={() => {
                setBankSearch('');
                setIsBankModalVisible(false);
              }}>
                <X size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              autoFocus
              value={bankSearch}
              onChangeText={setBankSearch}
              placeholder="Search name, code, or BIN..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.bankSearchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyBankSearchText}>No matching banks found.</Text>
              }
              renderItem={({ item }) => {
                const isActive = item.code === bankCode;
                return (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => {
                      setBankCode(item.code);
                      setBankSearch('');
                      setIsBankModalVisible(false);
                      setIsVerifiedName(false);
                    }}
                  >
                    <View style={styles.bankItemTextGroup}>
                      <Text style={[styles.bankItemShortName, isActive && styles.bankItemActiveText]}>
                        {item.shortName} ({item.code})
                      </Text>
                      <Text style={styles.bankItemFullName} numberOfLines={1}>{item.name}</Text>
                    </View>
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
