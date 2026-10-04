import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { resaleApi, bankAccountsApi, VerificationResult, SellerListingDto } from '@ticketshield/api-client';
import { UserBankAccountDto, PurchasedTicketDto } from '@ticketshield/types';
import { useMyTickets } from '../hooks/useMyTickets';
import { useOrganizers } from '../hooks/useOrganizers';
import { PrivateResaleScenarioModal } from '../components/ui/PrivateResaleScenarioModal';
import { SellerBankAccountModal } from '../components/profile/SellerBankAccountModal';
import { buildPrivateShareLink, buildPublicShareLink, copyToClipboard } from '../utils/shareLink';
import {
  SellWizardProgress,
  Step1EnterTicketCode,
  Step2VerifyOtp,
  Step3ConfirmDetails,
  Step4SetPrice,
  Step5ReviewPublish,
  Step6ListingSuccess,
} from '../components/sell';

export const SellTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { data: purchasedTickets = [], isPending: isLoadingPurchased } = useMyTickets();

  const purchasedPassCode = (ticket: PurchasedTicketDto) =>
    (ticket.ticketPassCode || ticket.qrCodeData || '').trim();

  const DRAFT_STORAGE_KEY = 'ticketshield_sell_draft';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCancellingSession, setIsCancellingSession] = useState<boolean>(false);
  const [resumeDraftAvailable, setResumeDraftAvailable] = useState<boolean>(false);

  // Auto scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Resale Workflow Verification state
  // =========================================================================================
  // [AI AGENT INSTRUCTION - BUNDLE RESALE STATE EXTENSION]
  // Khi triển khai tính năng Bán vé theo Combo/Gói (Bundle Resale):
  // 1. Mở rộng state `ticketCode: string` -> hỗ trợ `selectedTicketCodes: string[]`.
  // 2. Đảm bảo form Step 1 hỗ trợ hiển thị danh sách mã vé (chips/tags) thay vì chỉ 1 chuỗi đơn.
  // =========================================================================================
  const [ticketCode, setTicketCode] = useState('');
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const { data: organizers = [], isLoading: isLoadingOrganizers } = useOrganizers();

  // Scenario Modal state
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [activeFeeTooltip, setActiveFeeTooltip] = useState<'seller' | 'buyer' | null>(null);

  // Step 4 Pricing state (declared early for draft storage)
  const [faceValue, setFaceValue] = useState<number>(2500000);
  const [resalePrice, setResalePrice] = useState<number>(2500000);
  const [priceInputText, setPriceInputText] = useState<string>('2.500.000');
  const markupPercent = verificationResult?.markupPercent ?? 0;
  const priceCeiling =
    verificationResult?.priceCeiling && verificationResult.priceCeiling > 0
      ? verificationResult.priceCeiling
      : Math.trunc(faceValue * (1 + markupPercent / 100));

  // Step 2 OTP Form state & Expiry timestamp
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(300);

  // Auto restore unfinished draft session from localStorage on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.verificationId && d.currentStep > 1 && d.currentStep < 6) {
          setTicketCode(d.ticketCode || '');
          if (d.selectedOrganizerId) setSelectedOrganizerId(d.selectedOrganizerId);
          setVerificationId(d.verificationId);
          setVerificationResult(d.verificationResult || null);
          setFaceValue(d.faceValue || 2500000);
          setResalePrice(d.resalePrice || 2500000);
          setPriceInputText(d.priceInputText || (d.resalePrice ? d.resalePrice.toLocaleString('vi-VN') : '2.500.000'));

          if (d.otpExpiresAt) {
            setOtpExpiresAt(d.otpExpiresAt);
            const remaining = Math.max(0, Math.floor((d.otpExpiresAt - Date.now()) / 1000));
            setOtpTimeLeft(remaining);
          }

          setCurrentStep(d.currentStep);
          setResumeDraftAvailable(true);
        }
      }
    } catch (e) {
      console.warn('Could not restore sell draft', e);
    }
  }, []);

  // Auto save draft session to localStorage on step change
  useEffect(() => {
    if (verificationId && currentStep > 1 && currentStep < 6) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          ticketCode,
          selectedOrganizerId,
          verificationId,
          verificationResult,
          currentStep,
          faceValue,
          resalePrice,
          priceInputText: priceInputText || resalePrice.toLocaleString('vi-VN'),
          otpExpiresAt,
          savedAt: Date.now(),
        })
      );
    }
  }, [verificationId, currentStep, ticketCode, selectedOrganizerId, faceValue, resalePrice, priceInputText, verificationResult, otpExpiresAt]);

  const [existingListings, setExistingListings] = useState<SellerListingDto[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);

  // Seller Bank Account Enforcement state
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState<boolean>(true);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState<boolean>(false);

  // Load seller bank accounts to verify payout readiness
  const fetchBankAccounts = useCallback(async () => {
    try {
      setIsLoadingBankAccounts(true);
      const res = await bankAccountsApi.getMyBankAccounts();
      setBankAccounts(res || []);
    } catch (err) {
      console.warn('Could not load bank accounts', err);
    } finally {
      setIsLoadingBankAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Load existing listings to exclude already listed tickets
  const fetchExistingListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      const data = await resaleApi.getMyListings();
      setExistingListings(data || []);
    } catch (err) {
      console.warn('Could not load existing listings', err);
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingListings();
  }, [fetchExistingListings]);

  // Purchased on TicketShield and released or held in escrow; not already listed.
  const eligibleTickets = purchasedTickets.filter((t) => {
    const status = (t.status || '').trim().toUpperCase();
    if (status !== 'VALID' && status !== 'IN_ESCROW' && status !== 'LOCKED') return false;
    const code = purchasedPassCode(t).toUpperCase();
    if (!code) return false;
    return !existingListings.some(
      (listing) =>
        (listing.originalTicketCode || '').toUpperCase() === code &&
        String(listing.listingStatus).toLowerCase() !== 'cancelled'
    );
  });

  const verificationIdRef = useRef(verificationId);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    verificationIdRef.current = verificationId;
    currentStepRef.current = currentStep;
  }, [verificationId, currentStep]);

  // Auto send gRPC unlock beacon when user exits or navigates away (PAGEHIDE / BEFOREUNLOAD)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (verificationIdRef.current && currentStepRef.current > 1 && currentStepRef.current < 6) {
        resaleApi.closeVerificationBeacon(verificationIdRef.current);
      }
    };

    const handlePageHide = () => {
      if (verificationIdRef.current && currentStepRef.current > 1 && currentStepRef.current < 6) {
        resaleApi.closeVerificationBeacon(verificationIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Countdown timer for OTP (5 minutes) - Based on exact target timestamp otpExpiresAt
  useEffect(() => {
    if (currentStep !== 2) return;

    let targetExpiry = otpExpiresAt;
    if (!targetExpiry) {
      targetExpiry = Date.now() + 300 * 1000;
      setOtpExpiresAt(targetExpiry);
    }

    const checkAndTick = () => {
      const remaining = Math.max(0, Math.floor((targetExpiry! - Date.now()) / 1000));
      setOtpTimeLeft(remaining);

      if (remaining <= 0) {
        if (verificationIdRef.current) {
          resaleApi.closeVerification(verificationIdRef.current).catch(() => { });
          showToast('Verification session expired (5 minutes). Ticket lock released at Organizer.', 'warning');
          resetToStep1();
        }
      }
    };

    checkAndTick();
    const interval = setInterval(checkAndTick, 1000);

    return () => clearInterval(interval);
  }, [currentStep, otpExpiresAt]);

  const formatOtpTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updatePrice = (val: number) => {
    const clamped = Math.max(0, Math.min(val, priceCeiling));
    setResalePrice(clamped);
    setPriceInputText(clamped > 0 ? clamped.toLocaleString('vi-VN') : '');
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldVal = input.value;
    const oldPos = input.selectionStart || 0;

    const digitsBeforeCursor = oldVal.slice(0, oldPos).replace(/\D/g, '').length;

    const raw = oldVal.replace(/\D/g, '');
    if (raw === '') {
      setPriceInputText('');
      setResalePrice(0);
      return;
    }

    if (raw.length > 11) return;

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const formatted = parsed.toLocaleString('vi-VN');
      setResalePrice(parsed);
      setPriceInputText(formatted);

      requestAnimationFrame(() => {
        let newPos = 0;
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            count++;
          }
          if (count >= digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        if (newPos === 0 && formatted.length > 0) newPos = formatted.length;
        input.setSelectionRange(newPos, newPos);
      });
    }
  };

  const handlePriceInputBlur = () => {
    if (!priceInputText || resalePrice === 0) {
      updatePrice(faceValue);
    } else if (resalePrice > priceCeiling) {
      updatePrice(priceCeiling);
    }
  };

  const handleStepPrice = (delta: number) => {
    const current = resalePrice || 0;
    const next = current + delta;
    if (delta > 0 && next > priceCeiling) {
      updatePrice(priceCeiling);
      return;
    }
    if (next < 0) {
      updatePrice(0);
      return;
    }
    updatePrice(next);
  };

  const handleApplyDiscount = (percent: number) => {
    if (percent === 0) {
      updatePrice(faceValue);
    } else {
      updatePrice(Math.round(faceValue * (1 - percent / 100)));
    }
  };

  // Step 5 Confirmation state
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isPrivateListing, setIsPrivateListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string>('');
  const [publishedPrivateToken, setPublishedPrivateToken] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedQr, setCopiedQr] = useState<boolean>(false);

  // Step 1: Request OTP for Ticket Verification
  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce Seller Bank Account requirement before starting resale verification
    if (bankAccounts.length === 0) {
      showToast('⚠️ Vui lòng liên kết tài khoản ngân hàng nhận tiền trước khi đăng bán vé!', 'warning');
      navigate('/payout-accounts?returnUrl=/sell-ticket');
      return;
    }

    const codes = ticketCode
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      showToast('Please enter the ticket identifier code!', 'warning');
      return;
    }

    for (const code of codes) {
      const isAlreadyListed = existingListings.some(
        (l) => l.originalTicketCode === code &&
          String(l.listingStatus).toLowerCase() !== 'cancelled'
      );
      if (isAlreadyListed) {
        showToast(`Ticket ${code} is already listed on Marketplace! Please check "My Listings" to manage.`, 'warning');
        return;
      }

      const ownedPurchase = purchasedTickets.find(
        (t) => purchasedPassCode(t).toUpperCase() === code
      );
      if (ownedPurchase && (ownedPurchase.status || '').trim().toUpperCase() !== 'VALID') {
        showToast(`Ticket ${code} cannot be resold yet. Please wait until the protection period has concluded.`, 'error');
        return;
      }
    }

    // For multi-ticket combo selection, send primary ticket code codes[0] to Organizer for OTP verification
    const primaryCode = codes[0];

    try {
      setIsRequestingOtp(true);
      showToast('Verifying ticket & requesting OTP from Organizer...', 'info');
      const result = await resaleApi.requestVerificationOtp(primaryCode, selectedOrganizerId || undefined);
      setVerificationId(result.verificationId);
      setVerificationResult(result);
      const targetExpiresAt = Date.now() + 300 * 1000;
      setOtpExpiresAt(targetExpiresAt);
      setOtpTimeLeft(300);
      if (result.originalPrice && result.originalPrice > 0) {
        const totalFaceValue = result.originalPrice * codes.length;
        setFaceValue(totalFaceValue);
        setResalePrice(totalFaceValue);
        setPriceInputText(totalFaceValue.toLocaleString('vi-VN'));
      }
      showToast('OTP code sent! Please check the ticket owner email/phone.', 'success');
      setCurrentStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed. Please check the ticket code and try again.';
      showToast(msg, 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!verificationId) {
      showToast('Verification session not found!', 'warning');
      return;
    }
    try {
      setIsResendingOtp(true);
      await resaleApi.resendVerificationOtp(verificationId);
      const targetExpiresAt = Date.now() + 300 * 1000;
      setOtpExpiresAt(targetExpiresAt);
      setOtpTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      showToast('OTP code resent successfully!', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not resend OTP. Please try again shortly!';
      showToast(msg, 'error');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Step 2: Confirm OTP & Lock Ticket
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('').trim();
    if (otpCode.length < 4) {
      showToast('Please enter the full 6-digit OTP code!', 'warning');
      return;
    }

    if (!verificationId) {
      showToast('Invalid verification session!', 'error');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const result = await resaleApi.confirmVerificationOtp(verificationId, otpCode);
      setVerificationResult(result);
      if (result.originalPrice && result.originalPrice > 0) {
        const codes = ticketCode
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean);
        const totalFaceValue = result.originalPrice * Math.max(1, codes.length);
        setFaceValue(totalFaceValue);
        setResalePrice(totalFaceValue);
        setPriceInputText(totalFaceValue.toLocaleString('vi-VN'));
      }
      showToast('OTP verified & ticket locked successfully!', 'success');
      setCurrentStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code!';
      showToast(msg, 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Helper reset form to Step 1 and remove draft
  const resetToStep1 = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear sell draft', e);
    }
    setVerificationId('');
    setVerificationResult(null);
    setTicketCode('');
    setOtp(['', '', '', '', '', '']);
    setOtpExpiresAt(null);
    setOtpTimeLeft(300);
    setCurrentStep(1);
    setResumeDraftAvailable(false);
  };

  // Close abandoned session and release lock at Organizer
  const handleAbandonSession = async () => {
    if (!verificationId) {
      resetToStep1();
      return;
    }
    try {
      setIsCancellingSession(true);
      showToast('Cancelling session and unlocking ticket with Organizer...', 'info');
      await resaleApi.closeVerification(verificationId);
      showToast('Session cancelled and ticket unlocked successfully!', 'success');
      resetToStep1();
      fetchExistingListings();
    } catch (err: any) {
      console.warn('Could not close verification session on backend', err);
      showToast('Draft session cleared locally.', 'warning');
      resetToStep1();
    } finally {
      setIsCancellingSession(false);
    }
  };

  // Step 5: Publish Resale Listing
  const handlePublishListing = async () => {
    // Enforce Seller Bank Account requirement before publishing
    if (bankAccounts.length === 0) {
      showToast('⚠️ Vui lòng liên kết tài khoản ngân hàng nhận tiền trước khi hoàn tất đăng bán!', 'warning');
      navigate('/payout-accounts?returnUrl=/sell-ticket');
      return;
    }

    if (!agreedTerms) {
      showToast('Please agree to the authentic ticket listing terms!', 'warning');
      return;
    }

    if (!verificationId) {
      showToast('Missing verification session!', 'error');
      return;
    }

    if (resalePrice > priceCeiling) {
      showToast(
        `Resale price cannot exceed the event ceiling (${priceCeiling.toLocaleString('vi-VN')} VND). Lower the price and try again.`,
        'warning'
      );
      return;
    }

    if (resalePrice < 5000) {
      showToast(
        'Resale price must be at least the minimum seller fee (5.000 VND). Raise the price and try again.',
        'warning'
      );
      return;
    }

    try {
      setIsPublishing(true);
      const codes = ticketCode
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      const isCombo = codes.length > 1;
      const bundleId = isCombo ? crypto.randomUUID() : undefined;
      const bundleTotalTickets = isCombo ? codes.length : undefined;

      const result = await resaleApi.publishListing(
        verificationId,
        resalePrice,
        isPrivateListing,
        bundleId,
        isCombo ? true : undefined,
        bundleTotalTickets
      );
      if (result.listingId) {
        setPublishedListingId(result.listingId);
      }
      if (result.privateAccessToken) {
        setPublishedPrivateToken(result.privateAccessToken);
      }
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        console.warn('Could not remove draft', e);
      }
      setResumeDraftAvailable(false);
      showToast(
        isPrivateListing
          ? 'Private ticket listing created! Access via secret link or QR code.'
          : 'Ticket listed successfully on TicketShield Marketplace!',
        'success'
      );
      fetchExistingListings();
      setCurrentStep(6);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not publish listing. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const getShareUrl = () => {
    if (isPrivateListing && publishedPrivateToken) {
      return buildPrivateShareLink(publishedPrivateToken);
    }
    if (publishedListingId) {
      return buildPublicShareLink(publishedListingId);
    }
    return `${window.location.origin}/marketplace`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await copyToClipboard(url);
      setCopiedLink(true);
      showToast(
        isPrivateListing
          ? 'Secret private listing link copied to clipboard!'
          : 'Marketplace ticket link copied to clipboard!',
        'success'
      );
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Could not copy link. Please copy manually.', 'error');
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById('listing-qr-canvas') as HTMLCanvasElement;
    if (!canvas) {
      showToast('QR Code canvas not found.', 'error');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticketshield-${isPrivateListing ? 'private' : 'public'}-${publishedListingId || 'ticket'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR Code saved as PNG image!', 'success');
  };

  const handleCopyQrImage = async () => {
    try {
      const canvas = document.getElementById('listing-qr-canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Canvas not found');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          handleDownloadQr();
          return;
        }
        try {
          if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedQr(true);
            showToast('QR Code image copied to clipboard! You can paste directly into chat messages.', 'success');
            setTimeout(() => setCopiedQr(false), 2500);
          } else {
            handleDownloadQr();
          }
        } catch {
          handleDownloadQr();
        }
      }, 'image/png');
    } catch {
      handleDownloadQr();
    }
  };

  const handleClearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    document.getElementById('otp-input-0')?.focus();
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6 - index).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      document.getElementById(`otp-input-${nextIdx}`)?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned[0];
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const focusIdx = Math.min(digits.length, 5);
    const targetInput = document.getElementById(`otp-input-${focusIdx}`);
    targetInput?.focus();
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-20 pb-12 px-4 sm:px-6 md:px-12 font-sans antialiased selection:bg-[#FF5A36] selection:text-white overflow-hidden">
      {/* Inline Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.38; transform: scale(1.12); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.6); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes kenburnsGentle {
          0% {
            transform: scale(1.03) translate(0, 0);
          }
          35% {
            transform: scale(1.06) translate(1.2%, -0.8%);
          }
          70% {
            transform: scale(1.075) translate(-0.8%, 0.9%);
          }
          100% {
            transform: scale(1.04) translate(0.4%, -0.3%);
          }
        }
        @keyframes stageSpotlightGentle {
          0% { transform: rotate(-25deg) translateY(-10%) translateX(-15%); opacity: 0.22; }
          50% { transform: rotate(15deg) translateY(8%) translateX(18%); opacity: 0.45; }
          100% { transform: rotate(-25deg) translateY(-10%) translateX(-15%); opacity: 0.22; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtle-glow {
          animation: subtleGlow 7s ease-in-out infinite;
        }
        .animate-pop-in {
          animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-glow {
          animation: subtleGlow 4s ease-in-out infinite;
        }
        .animate-kenburns-gentle {
          animation: kenburnsGentle 14s ease-in-out infinite alternate;
        }
        .animate-stage-spotlight {
          animation: stageSpotlightGentle 8s ease-in-out infinite alternate;
        }
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ticketShimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          50%, 100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .animate-scanline {
          animation: scanline 2.2s ease-in-out infinite;
        }
        .animate-ticket-shimmer {
          animation: ticketShimmer 5s ease-in-out infinite;
        }
        .animate-pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }
        @media (min-width: 640px) {
          .ticket-perforated-mask {
            -webkit-mask-image: radial-gradient(circle 14px at calc(100% - 14rem) 0px, transparent 13.5px, black 14px),
                                radial-gradient(circle 14px at calc(100% - 14rem) 100%, transparent 13.5px, black 14px);
            -webkit-mask-size: 100% 51%;
            -webkit-mask-position: top, bottom;
            -webkit-mask-repeat: no-repeat;
            mask-image: radial-gradient(circle 14px at calc(100% - 14rem) 0px, transparent 13.5px, black 14px),
                        radial-gradient(circle 14px at calc(100% - 14rem) 100%, transparent 13.5px, black 14px);
            mask-size: 100% 51%;
            mask-position: top, bottom;
            mask-repeat: no-repeat;
          }
        }
      `}</style>

      {/* Background Lights */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Live Concert Stage"
          className="w-full h-full object-cover opacity-70 animate-kenburns-gentle transform-gpu origin-center"
        />
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-[#FF5A36]/30 to-transparent blur-3xl animate-stage-spotlight pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/75 via-[#05070A]/55 to-[#05070A]/90" />
      </div>

      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className={`relative z-10 mx-auto space-y-4 transition-all duration-300 ${currentStep === 6 ? 'max-w-6xl' : 'max-w-3xl'}`}>

        {/* Process Stepper Header & Draft Banner */}
        <SellWizardProgress
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          handleAbandonSession={handleAbandonSession}
          resumeDraftAvailable={resumeDraftAvailable}
          ticketCode={ticketCode}
          isCancellingSession={isCancellingSession}
        />

        {/* STEP 1: ENTER TICKET CODE */}
        {currentStep === 1 && (
          <Step1EnterTicketCode
            ticketCode={ticketCode}
            setTicketCode={setTicketCode}
            selectedOrganizerId={selectedOrganizerId}
            setSelectedOrganizerId={setSelectedOrganizerId}
            organizers={organizers}
            isLoadingOrganizers={isLoadingOrganizers}
            eligibleTickets={eligibleTickets}
            purchasedPassCode={purchasedPassCode}
            handleStartVerification={handleNextStep1}
            isRequestingOtp={isRequestingOtp}
            bankAccounts={bankAccounts}
            isLoadingBankAccounts={isLoadingBankAccounts}
            onAddBankAccount={() => setIsAddBankModalOpen(true)}
          />
        )}


        {/* STEP 2: VERIFY OTP CODE */}
        {currentStep === 2 && (
          <Step2VerifyOtp
            otp={otp}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            handleOtpPaste={handleOtpPaste}
            handleClearOtp={handleClearOtp}
            handleResendOtp={handleResendOtp}
            isResendingOtp={isResendingOtp}
            otpTimeLeft={otpTimeLeft}
            formatOtpTimer={formatOtpTimer}
            handleVerifyOtp={handleVerifyOtp}
            isVerifyingOtp={isVerifyingOtp}
            handleAbandonSession={handleAbandonSession}
            isCancellingSession={isCancellingSession}
          />
        )}

        {/* STEP 3: TICKET VERIFIED & LOCKED */}
        {currentStep === 3 && (
          <Step3ConfirmDetails
            ticketCode={ticketCode}
            faceValue={faceValue}
            priceCeiling={priceCeiling}
            markupPercent={markupPercent}
            seatZone={purchasedTickets.find((t) => purchasedPassCode(t) === ticketCode)?.seatZone}
            onContinue={() => setCurrentStep(4)}
          />
        )}

        {/* STEP 4: SET RESALE PRICE */}
        {currentStep === 4 && (
          <Step4SetPrice
            priceCeiling={priceCeiling}
            faceValue={faceValue}
            markupPercent={markupPercent}
            resalePrice={resalePrice}
            updatePrice={updatePrice}
            priceInputText={priceInputText}
            handlePriceInputChange={handlePriceInputChange}
            handlePriceInputBlur={handlePriceInputBlur}
            handleStepPrice={handleStepPrice}
            handleApplyDiscount={handleApplyDiscount}
            onContinue={() => setCurrentStep(5)}
          />
        )}

        {/* STEP 5: REVIEW & CONFIRM LISTING */}
        {currentStep === 5 && (
          <Step5ReviewPublish
            ticketCode={ticketCode}
            faceValue={faceValue}
            resalePrice={resalePrice}
            bankAccounts={bankAccounts}
            seatZone={purchasedTickets.find((t) => purchasedPassCode(t) === ticketCode)?.seatZone}
            isPrivateListing={isPrivateListing}
            setIsPrivateListing={setIsPrivateListing}
            agreedTerms={agreedTerms}
            setAgreedTerms={setAgreedTerms}
            handlePublishListing={handlePublishListing}
            isPublishing={isPublishing}
            activeFeeTooltip={activeFeeTooltip}
            setActiveFeeTooltip={setActiveFeeTooltip}
            onManageBankAccounts={() => navigate('/payout-accounts?returnUrl=/sell-ticket')}
          />
        )}

        {/* STEP 6: LISTING PUBLISHED */}
        {currentStep === 6 && (
          <Step6ListingSuccess
            ticketCode={ticketCode}
            publishedListingId={publishedListingId}
            existingListings={existingListings}
            faceValue={faceValue}
            resalePrice={resalePrice}
            isPrivateListing={isPrivateListing}
            getShareUrl={getShareUrl}
            handleCopyLink={handleCopyLink}
            copiedLink={copiedLink}
            handleCopyQrImage={handleCopyQrImage}
            copiedQr={copiedQr}
            handleDownloadQr={handleDownloadQr}
            onNavigateMyListings={() => navigate('/my-listings')}
            onNavigateMarketplace={() => navigate('/marketplace')}
          />
        )}

        {/* Private Resale Scenario Messaging Modal */}
        <PrivateResaleScenarioModal
          isOpen={showScenarioModal}
          onClose={() => setShowScenarioModal(false)}
          role="seller"
        />

        {/* Seller Bank Account Setup Modal */}
        <SellerBankAccountModal
          isOpen={isAddBankModalOpen}
          onClose={() => setIsAddBankModalOpen(false)}
          onSuccess={(newAccount) => {
            setBankAccounts((prev) => [newAccount, ...prev.filter((a) => a.id !== newAccount.id)]);
            fetchBankAccounts();
            showToast('Payout bank account saved! You can now proceed with listing your ticket.', 'success');
          }}
        />
      </div>
    </div>
  );
};

export default SellTicketPage;
