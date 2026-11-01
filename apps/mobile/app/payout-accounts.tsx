import React, { useState, useEffect, useCallback } from 'react';
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
import { bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
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

  // Form liên kết tài khoản mới
  const [bankCode, setBankCode] = useState('MB');
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

  const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];

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
        const res = await bankAccountsApi.lookupAccountHolderName(bankCode, cleanAcc);
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
  }, [accountNumber, bankCode]);

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
              const bank = VIETNAM_BANKS.find((b) => b.code === acc.bankCode);
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

        {/* Form liên kết tài khoản mới */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Link New Bank Account</Text>

          {/* Chọn ngân hàng */}
          <View>
            <Text style={styles.formLabel}>Select Bank</Text>
            <TouchableOpacity
              style={styles.bankSelectorBtn}
              onPress={() => setIsBankModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.bankSelectorText}>{selectedBank.name}</Text>
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
                      setBankCode(item.code);
                      setIsBankModalVisible(false);
                      setIsVerifiedName(false);
                    }}
                  >
                    <Text style={[styles.bankItemText, isActive && styles.bankItemActiveText]}>
                      {item.name}
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
