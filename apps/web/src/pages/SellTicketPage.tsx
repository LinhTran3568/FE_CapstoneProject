import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { resaleApi, bankAccountsApi, VerificationResult, SellerListingDto } from '@ticketshield/api-client';
import { UserBankAccountDto, PurchasedTicketDto } from '@ticketshield/types';
import { useMyTickets } from '../hooks/useMyTickets';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Lock,
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  Edit3,
  Check,
  ChevronDown,
  Info,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Share2,
  Sparkles,
  Building2
} from 'lucide-react';
import { TicketShieldTrustBadge } from '../components/ui/TicketShieldTrustBadge';
import { PrivateResaleScenarioModal } from '../components/ui/PrivateResaleScenarioModal';
import { SellerBankAccountModal } from '../components/profile/SellerBankAccountModal';
import { buildPrivateShareLink, buildPublicShareLink, copyToClipboard } from '../utils/shareLink';

export const SellTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
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
  const [ticketCode, setTicketCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);

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
  }, [verificationId, currentStep, ticketCode, faceValue, resalePrice, priceInputText, verificationResult, otpExpiresAt]);

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

  // Purchased on TicketShield and released from escrow; not already listed.
  const eligibleTickets = purchasedTickets.filter((t) => {
    if ((t.status || '').trim().toUpperCase() !== 'VALID') return false;
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
          resaleApi.closeVerification(verificationIdRef.current).catch(() => {});
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
      showToast('⚠️ Bạn chưa cập nhật tài khoản ngân hàng thụ hưởng! Vui lòng liên kết tài khoản ngân hàng trước khi đăng bán vé.', 'warning');
      setIsAddBankModalOpen(true);
      return;
    }

    const normalizedCode = ticketCode.trim().toUpperCase();
    if (!normalizedCode) {
      showToast('Please enter the ticket identifier code!', 'warning');
      return;
    }

    const isAlreadyListed = existingListings.some(
      (l) => l.originalTicketCode === normalizedCode &&
        String(l.listingStatus).toLowerCase() !== 'cancelled'
    );
    if (isAlreadyListed) {
      showToast('This ticket is already listed on Marketplace! Please check "My Listings" to manage.', 'warning');
      return;
    }

    const ownedPurchase = purchasedTickets.find(
      (t) => purchasedPassCode(t).toUpperCase() === normalizedCode
    );
    if (ownedPurchase && (ownedPurchase.status || '').trim().toUpperCase() !== 'VALID') {
      showToast('This ticket cannot be resold yet. Wait until escrow is released.', 'error');
      return;
    }

    try {
      setIsRequestingOtp(true);
      showToast('Verifying ticket & requesting OTP from Organizer...', 'info');
      const result = await resaleApi.requestVerificationOtp(normalizedCode);
      setVerificationId(result.verificationId);
      setVerificationResult(result);
      const targetExpiresAt = Date.now() + 300 * 1000;
      setOtpExpiresAt(targetExpiresAt);
      setOtpTimeLeft(300);
      if (result.originalPrice && result.originalPrice > 0) {
        setFaceValue(result.originalPrice);
        setResalePrice(result.originalPrice);
        setPriceInputText(result.originalPrice.toLocaleString('vi-VN'));
      }
      showToast('OTP code sent! Please check the ticket owner email/phone.', 'success');
      setCurrentStep(2);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('TICKET_NOT_ELIGIBLE') || msg.includes('TICKET_NOT_AVAILABLE') || msg.includes('LOCKED')) {
        showToast('This ticket is currently in another transaction or unavailable for resale.', 'warning');
      } else if (msg.includes('TICKET_NOT_FOUND')) {
        showToast('Ticket not found. Please double check your ticket code!', 'error');
      } else {
        showToast('Unable to verify ticket at this time.', 'error');
      }
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
      showToast('Could not resend OTP. Please try again shortly!', 'error');
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
        setFaceValue(result.originalPrice);
        setResalePrice(result.originalPrice);
        setPriceInputText(result.originalPrice.toLocaleString('vi-VN'));
      }
      showToast('OTP verified & ticket locked successfully!', 'success');
      setCurrentStep(3);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      if (serverMsg.includes('TICKET_LOCKED')) {
        showToast('This ticket is currently locked or already listed!', 'error');
      } else if (serverMsg.includes('OTP_INVALID')) {
        showToast('Invalid OTP code. Please check again!', 'error');
      } else if (serverMsg.includes('OTP_EXPIRED') || serverMsg.includes('VERIFICATION_CLOSED')) {
        showToast('Verification session expired. Please click Resend OTP!', 'error');
      } else {
        showToast(serverMsg || 'Invalid OTP or session expired. Please try again!', 'error');
      }
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
      showToast('⚠️ Bạn chưa có tài khoản ngân hàng thụ hưởng để nhận tiền! Vui lòng thêm tài khoản trước khi hoàn tất đăng bán.', 'warning');
      setIsAddBankModalOpen(true);
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
      const result = await resaleApi.publishListing(verificationId, resalePrice, isPrivateListing);
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
      const msg = err?.message || '';
      if (msg.includes('TICKET_ALREADY_LISTED')) {
        showToast('This ticket has already been listed! Please check "MY LISTINGS".', 'warning');
      } else if (msg.includes('PRICE_EXCEEDS_CEILING')) {
        showToast(
          `Resale price cannot exceed the event ceiling (${priceCeiling.toLocaleString('vi-VN')} VND). Lower the price and try again.`,
          'warning'
        );
      } else if (msg.includes('PRICE_BELOW_MINIMUM_SELLER_FEE')) {
        showToast(
          'Resale price must be at least the minimum seller fee. Raise the price and try again.',
          'warning'
        );
      } else {
        showToast('Could not create listing at this time. Please try again later!', 'error');
      }
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

        {/* Process Stepper Header Bar (Compact & Close Proximity) */}
        <div className="w-fit mx-auto bg-[#0A0D14]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 sm:px-5 sm:py-2 shadow-2xl flex items-center justify-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {currentStep > 1 && currentStep < 6 && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2) {
                    handleAbandonSession();
                  } else {
                    setCurrentStep((prev) => prev - 1);
                  }
                }}
                className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Back to previous step"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide shrink-0">
              {currentStep === 1 && 'Step 1: Enter Ticket Code'}
              {currentStep === 2 && 'Step 2: Organizer Verification'}
              {currentStep === 3 && 'Step 3: Confirm Ticket Details'}
              {currentStep === 4 && 'Step 4: Set Resale Price'}
              {currentStep === 5 && 'Step 5: Review & Publish'}
              {currentStep === 6 && 'Step 6: Listing Complete'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-white/15 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => {
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <React.Fragment key={stepNum}>
                  <button
                    type="button"
                    onClick={() => {
                      if (stepNum < currentStep) setCurrentStep(stepNum);
                    }}
                    disabled={stepNum > currentStep}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 ${
                      isCurrent
                        ? "bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/30 scale-105 ring-2 ring-[#FF5722]/30"
                        : isCompleted
                        ? "bg-emerald-500 text-black cursor-pointer hover:scale-105"
                        : "bg-[#151B26] text-slate-400 border border-white/5 cursor-default"
                    }`}
                    title={`Step ${stepNum}`}
                  >
                    {isCompleted ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3]" /> : stepNum}
                  </button>
                  {stepNum < 6 && (
                    <div
                      className={`w-1.5 sm:w-2.5 h-[1.5px] rounded-full transition-colors ${
                        stepNum < currentStep ? "bg-emerald-500" : "bg-slate-700/70"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>



        {/* Draft resume session banner */}
        {resumeDraftAvailable && currentStep > 1 && currentStep < 6 && (
          <div className="max-w-2xl mx-auto px-4 py-2.5 bg-[#0A131F]/90 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <div className="text-xs text-slate-200 truncate flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-white">Draft Session:</span>
                <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold rounded text-[11px]">
                  {ticketCode}
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (Step {currentStep}/6 · Auto Restored)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAbandonSession}
              disabled={isCancellingSession}
              className="self-end sm:self-auto px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/35 hover:border-rose-400 rounded-lg font-mono text-[11px] font-semibold transition-all duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
              title="Cancel session & unlock ticket at Organizer"
            >
              {isCancellingSession ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  <span>Discard & Unlock</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 1: ENTER TICKET CODE */}
        {currentStep === 1 && (
          <div key={1} className="animate-fade-in-up max-w-lg mx-auto space-y-6 text-center pt-4">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                Enter Original Ticket Code
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto leading-relaxed">
                Enter the ticket identifier code issued by the Organizer partner to initiate verification and Escrow lock.
              </p>
            </div>

            {/* Bank Account Warning Banner */}
            {bankAccounts.length === 0 && !isLoadingBankAccounts && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-left animate-fade-in-up">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Yêu cầu Tài khoản Ngân hàng Thụ hưởng
                  </h4>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Để nhận tiền bán vé tự động &amp; an toàn qua hệ thống <b>Escrow 24/7</b>, bạn cần cập nhật tài khoản ngân hàng chính chủ trước khi đăng bán.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="mt-1 px-3 py-1.5 bg-amber-500 text-black hover:bg-amber-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm tài khoản ngân hàng ngay
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleNextStep1} className="space-y-6 text-left bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-300">
              <div className="space-y-2.5">
                <label
                  htmlFor="sell-ticket-from-purchases"
                  className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block"
                >
                  Chọn từ vé của tôi
                </label>
                <div className="relative">
                  <select
                    id="sell-ticket-from-purchases"
                    value={
                      eligibleTickets.some((t) => purchasedPassCode(t).toUpperCase() === ticketCode)
                        ? ticketCode
                        : ''
                    }
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    disabled={isLoadingPurchased || eligibleTickets.length === 0}
                    className="w-full h-14 sm:h-16 appearance-none bg-[#05070A] border border-white/15 rounded-2xl pl-4 pr-12 text-sm font-mono font-semibold text-white focus:outline-none focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/20 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">
                      {isLoadingPurchased
                        ? 'Loading purchased tickets...'
                        : eligibleTickets.length === 0
                          ? 'No eligible purchased tickets'
                          : 'Select a purchased ticket'}
                    </option>
                    {eligibleTickets.map((t) => {
                      const code = purchasedPassCode(t).toUpperCase();
                      return (
                        <option key={t.escrowId} value={code}>
                          {t.eventName} — {code}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#A3A8B3] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-[#8B929C] leading-relaxed">
                  Only tickets you bought on TicketShield after escrow is released. Seed or organizer codes still go in the box below.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block">
                  Original Ticket Code
                </label>

                {/* Rescaled Prominent Input: Compact width, increased height */}
                <div className="relative group">
                  <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF5A36] absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 group-focus-within:scale-110 group-focus-within:text-[#FF7252] transition-all duration-200 pointer-events-none z-10" />
                  
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ATSH-VIP-888"
                    className="w-full h-16 sm:h-[72px] bg-[#05070A] border border-white/15 rounded-2xl pl-14 sm:pl-16 pr-12 sm:pr-14 text-base sm:text-lg font-mono font-bold tracking-widest text-white placeholder-[#A3A8B3]/30 focus:outline-none focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/20 transition-all duration-200"
                    required
                  />

                  {ticketCode && (
                    <button
                      type="button"
                      onClick={() => setTicketCode('')}
                      className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-[#8F96A3] hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 cursor-pointer"
                      title="Clear code"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp || !ticketCode.trim()}
                className={`w-full h-14 sm:h-15 font-bold font-display uppercase tracking-widest text-xs sm:text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  !ticketCode.trim() || isRequestingOtp
                    ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                    : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                }`}
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Ticket</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: VERIFY OTP CODE */}
        {currentStep === 2 && (
          <div key={2} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-4">
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl hover:border-white/20 transition-all duration-300">

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  Verify Owner OTP Code
                </h2>
                <p className="text-xs text-[#A3A8B3] leading-relaxed">
                  Enter the OTP sent by the Organizer to the ticket owner's email/phone to lock the ticket.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                      Verification OTP (6 Digits)
                    </label>
                    <div className="flex items-center gap-3">
                      {otp.some((d) => d !== '') && (
                        <button
                          type="button"
                          onClick={handleClearOtp}
                          className="text-xs text-[#A3A8B3] hover:text-white hover:underline transition-colors font-mono"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className="text-xs text-[#FF5A36] hover:underline transition-all font-mono flex items-center gap-1"
                      >
                        {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-full h-12 bg-[#05070A] border border-white/15 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 focus:scale-105 transition-all duration-200"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm font-mono mt-3">
                    <span className="text-[#A3A8B3]">
                      Code expires in:
                    </span>
                    <span className={`text-sm sm:text-base font-bold font-mono tracking-wider ${otpTimeLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-[#FF5A36]'}`}>
                      {formatOtpTimer(otpTimeLeft)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpTimeLeft === 0}
                  className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm & Lock</span>
                  )}
                </button>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2 hover:border-emerald-500/30 transition-all duration-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>System verification ensures ticket is authentic and not yet used.</span>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleAbandonSession}
                    disabled={isCancellingSession}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 border border-rose-500/30 hover:border-rose-400 rounded-xl text-xs font-mono font-semibold transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                  >
                    {isCancellingSession ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Cancel</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* STEP 3: TICKET VERIFIED & LOCKED */}
        {currentStep === 3 && (
          <div key={3} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 pt-2">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Ticket Verified & Safely Locked
              </h2>
              <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
                Your ticket has been verified as authentic and is ready for pricing.
              </p>
            </div>

            {/* Ticket Card Preview */}
            <div className="group relative bg-[#0A0D12]/90 backdrop-blur-md border border-white/[0.08] hover:border-white/[0.16] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
              {/* Holographic Shimmer Light Sweep */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-ticket-shimmer" />
              </div>

              {/* Concert image banner */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src="/images/landing/featured-1.jpg"
                  alt="Concert Ticket"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/50 to-transparent" />
              </div>

              {/* Ticket body */}
              <div className="p-6 space-y-5">

                {/* Header row: label + verified status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      OFFICIAL DIGITAL TICKET PASS
                    </span>
                    <h3 className="text-2xl font-extrabold font-display text-white group-hover:text-[#FF7252] transition-colors duration-300 leading-tight">
                      Anh Trai Say Hi Concert 2026
                    </h3>
                  </div>

                  {/* Verified status with pulsing radar ping effect */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A36] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]" />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-[#FF5A36] whitespace-nowrap">
                      VERIFIED · LOCKED
                    </span>
                  </div>
                </div>

                {/* Info row: ticket code + location */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
                  <div className="p-3.5 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      ORIGINAL TICKET CODE
                    </span>
                    <p className="font-bold text-white font-mono text-sm tracking-wide group-hover:text-[#FF5A36] transition-colors duration-200">
                      {ticketCode}
                    </p>
                  </div>
                  <div className="p-3.5 pl-4 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      VENUE
                    </span>
                    <p className="font-bold text-white text-sm">Van Hanh Mall Stadium, TP.HCM</p>
                  </div>
                </div>

                {/* Price cap row */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
                  <div className="p-4 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      FACE VALUE
                    </span>
                    <p className="text-lg font-bold font-display text-white">
                      {faceValue.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                  <div className="p-4 pl-5 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      MAX RESALE PRICE
                    </span>
                    <p className="text-lg font-bold font-display text-white">
                      {priceCeiling.toLocaleString('vi-VN')} VND
                    </p>
                    <span className="text-[10px] text-[#8F96A3] font-mono block leading-tight">
                      {markupPercent > 0
                        ? `Face value + ${markupPercent}% event markup`
                        : 'Per TicketShield policy'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Glowing CTA Button with Shimmer Sheen */}
            <button
              onClick={() => setCurrentStep(4)}
              className="group relative w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-2xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
              <span>Continue</span>
            </button>
          </div>
        )}

        {/* STEP 4: SET RESALE PRICE */}
        {currentStep === 4 && (
          <div key={4} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-2">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Set Resale Price
              </h2>
              <p className="text-xs text-[#A3A8B3]">
                Slide or type a price up to the event ceiling ({priceCeiling.toLocaleString('vi-VN')} VND
                {markupPercent > 0 ? `, face value + ${markupPercent}%` : ''}).
              </p>
            </div>

            {/* Price Selector Main Box */}
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center hover:border-white/20 transition-all duration-300">
              <span className="text-xs text-[#A3A8B3] uppercase tracking-wider font-display font-semibold">
                PROPOSED RESALE PRICE
              </span>

              <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-300">
                <span className="transition-all duration-300">
                  {resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : '0'}
                </span>
                <span className="text-base font-normal text-[#FF5A36]">VND</span>
              </div>

              <div className="space-y-2 text-left">
                <label htmlFor="resale-price-slider" className="sr-only">
                  Resale price within the event ceiling
                </label>
                <input
                  id="resale-price-slider"
                  type="range"
                  min={1000}
                  max={Math.max(priceCeiling, 1000)}
                  step={1000}
                  value={Math.min(Math.max(Math.round((resalePrice || 1000) / 1000) * 1000, 1000), Math.max(priceCeiling, 1000))}
                  onChange={(e) => updatePrice(Number(e.target.value))}
                  aria-valuemin={1000}
                  aria-valuemax={priceCeiling}
                  aria-valuenow={resalePrice}
                  className="w-full h-2 appearance-none rounded-full cursor-pointer bg-white/10 accent-[#FF5A36]"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8F96A3]">
                  <span>Min</span>
                  <span>Max {priceCeiling.toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* Manual Price Input – Compact row with stepper */}
              <div className="space-y-1.5">
                {/* Label + Input row */}
                <div className="flex items-center gap-3">
                  {/* Label */}
                  <div className="flex flex-col text-left shrink-0">
                    <span className="text-[10px] text-[#A3A8B3] font-mono uppercase tracking-wider whitespace-nowrap font-semibold">
                      Custom Price (VND)
                    </span>
                    <span className="text-[9px] text-[#8F96A3] font-mono whitespace-nowrap">
                      (Cannot exceed event ceiling)
                    </span>
                  </div>

                  {/* Stepper row: [ input ] [ − ] [ + ] */}
                  <div className="flex items-center flex-1 gap-2">
                    {/* Input */}
                    <div className="relative flex-1 group/input">
                      <input
                        id="resale-price-input"
                        type="text"
                        inputMode="numeric"
                        value={priceInputText}
                        onChange={handlePriceInputChange}
                        onFocus={(e) => e.target.select()}
                        onBlur={handlePriceInputBlur}
                        className={`w-full bg-[#05070A] border rounded-xl pl-3 pr-14 py-2.5 text-sm font-mono font-bold text-white tracking-wider text-right focus:outline-none transition-all duration-200 ${resalePrice > priceCeiling
                          ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                          : 'border-white/15 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 group-hover/input:border-white/25'
                          }`}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#FF5A36] font-bold pointer-events-none">
                        VND
                      </span>
                    </div>

                    {/* Decrease button */}
                    <button
                      type="button"
                      onClick={() => handleStepPrice(-10000)}
                      disabled={resalePrice <= 0}
                      className={`w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none ${
                        resalePrice <= 0
                          ? 'border-white/5 text-white/20 cursor-not-allowed opacity-40'
                          : 'border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 active:scale-95 cursor-pointer'
                      }`}
                      title="Decrease 10,000 VND"
                    >
                      −
                    </button>

                    {/* Increase button */}
                    <button
                      type="button"
                      onClick={() => handleStepPrice(10000)}
                      disabled={resalePrice >= priceCeiling}
                      className={`w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none ${
                        resalePrice >= priceCeiling
                          ? 'border-white/5 text-white/20 cursor-not-allowed opacity-40'
                          : 'border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 active:scale-95 cursor-pointer'
                      }`}
                      title={resalePrice >= priceCeiling ? 'Cannot exceed the event ceiling' : 'Increase 10,000 VND'}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Validation hint */}
                <div className="min-h-[20px] flex items-center justify-end text-[10px] font-mono">
                  {resalePrice > priceCeiling && (
                    <span className="text-rose-400 font-semibold">
                      Cannot exceed the event ceiling ({priceCeiling.toLocaleString('vi-VN')} VND)
                    </span>
                  )}
                  {resalePrice < faceValue && resalePrice > 0 && (
                    <span className="text-emerald-400">
                      {(faceValue - resalePrice).toLocaleString('vi-VN')} VND ({Math.round((1 - resalePrice / faceValue) * 100)}%) below face value
                    </span>
                  )}
                  {resalePrice === faceValue && (
                    <span className="text-[#A3A8B3]">
                      At face value ({faceValue.toLocaleString('vi-VN')} VND)
                    </span>
                  )}
                  {resalePrice > faceValue && resalePrice <= priceCeiling && (
                    <span className="text-[#A3A8B3]">
                      {(resalePrice - faceValue).toLocaleString('vi-VN')} VND above face, within the {markupPercent}% ceiling
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Discount Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] text-[#A3A8B3]">Quick price presets:</span>
                <div className={`grid gap-2 text-xs font-mono ${priceCeiling > faceValue ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'}`}>
                  <button
                    onClick={() => handleApplyDiscount(5)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.95)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -5%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(10)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.9)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -10%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(15)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.85)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -15%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(0)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === faceValue
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    Face Value
                  </button>

                  {priceCeiling > faceValue && (
                    <button
                      onClick={() => updatePrice(priceCeiling)}
                      className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === priceCeiling
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                        }`}
                    >
                      Max Price
                    </button>
                  )}
                </div>
              </div>

              {/* Platform Fee & Net Payout Breakdown Box */}
              <div className="p-4 sm:p-5 bg-[#080B11]/90 backdrop-blur-sm border border-emerald-500/25 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Chi tiết biểu phí sàn</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Phí người bán 3%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Giá niêm yết:</span>
                    <span className="font-semibold text-zinc-200 tabular-nums">
                      {resalePrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Phí dịch vụ người bán (3%):</span>
                    <span className="font-medium text-amber-400 tabular-nums">
                      - {Math.max(Math.round(resalePrice * 0.03), 5000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2.5 border-t border-white/10">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      Thực nhận của người bán
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      (Tự động chuyển về STK sau khi giao dịch hoàn tất)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                      {Math.max(resalePrice - Math.max(Math.round(resalePrice * 0.03), 5000), 0).toLocaleString('vi-VN')}
                    </span>
                    <span className="ml-1 text-xs font-bold text-emerald-400">đ</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(5)}
                disabled={resalePrice > priceCeiling || resalePrice <= 0}
                className={`w-full py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  resalePrice > priceCeiling || resalePrice <= 0
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
                    : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                }`}
              >
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRM LISTING */}
        {currentStep === 5 && (
          <div key={5} className="animate-fade-in-up max-w-[640px] mx-auto space-y-5 pt-2">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold font-display text-white">
                Review &amp; Confirm Listing
              </h2>
              <p className="text-xs text-gray-400">
                Review your ticket details before publishing to TicketShield Marketplace.
              </p>
            </div>

            {/* Main Panel */}
            <div className="bg-[#0B0E14] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-7 space-y-6 text-left">
              {/* 1. Ticket Summary Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-800/80">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    Anh Trai Say Hi Concert 2026
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ticket Code: <strong className="text-gray-200">{ticketCode || 'ATSH-VIP-8862'}</strong></span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono rounded-full shrink-0 uppercase">
                  VERIFIED
                </span>
              </div>

              {/* 2. Compact Price Comparison */}
              <div className="grid grid-cols-2 gap-4 text-xs pb-3 border-b border-gray-800/80">
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5 uppercase tracking-wider text-[11px]">ORIGINAL PRICE</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {faceValue.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-medium block mb-0.5 uppercase tracking-wider text-[11px]">RESALE PRICE</span>
                  <span className="font-mono font-bold text-[#FF5A36] text-sm">
                    {resalePrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>

              {/* 3. Redesigned Fee Breakdown ("PRICE BREAKDOWN") */}
              <div className="space-y-3 pb-3 border-b border-gray-800/80">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  PRICE BREAKDOWN
                </span>

                <div className="space-y-2.5 text-xs">
                  {/* Resale Price */}
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Resale Price</span>
                    <span className="font-mono font-medium text-white">{resalePrice.toLocaleString('vi-VN')} VND</span>
                  </div>

                  {/* Seller Fee */}
                  <div className="relative flex justify-between items-center text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <span>Seller Fee · 3%</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFeeTooltip(activeFeeTooltip === 'seller' ? null : 'seller');
                        }}
                        className="w-4 h-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                        title="Seller fee info"
                      >
                        ?
                      </button>
                      {activeFeeTooltip === 'seller' && (
                        <div className="absolute left-0 top-full mt-1.5 w-68 p-3 bg-[#131822] border border-gray-700 rounded-xl shadow-2xl text-[11px] text-gray-200 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="font-semibold text-white mb-1">3% Seller Fee</div>
                          <div>TicketShield deducts 3% from the resale price for transaction processing and order support.</div>
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-gray-400">-{Math.max(Math.round(resalePrice * 0.03), 5000).toLocaleString('vi-VN')} VND</span>
                  </div>

                  {/* Seller Net Payout (Primary Number) */}
                  <div className="flex justify-between items-center pt-1 text-sm font-bold">
                    <span className="text-white">You Receive</span>
                    <span className={`font-mono text-base ${resalePrice < 5000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {resalePrice < 5000
                        ? 'Below minimum fee'
                        : `${Math.max(resalePrice - Math.max(Math.round(resalePrice * 0.03), 5000), 0).toLocaleString('vi-VN')} VND`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Destination Account */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  PAYOUT BANK ACCOUNT (TÀI KHOẢN NHẬN TIỀN)
                </span>
                <div className="p-3.5 bg-[#05070A] border border-gray-800 rounded-xl">
                  {bankAccounts.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0052CC]/20 border border-[#0052CC]/40 flex items-center justify-center font-bold text-[#4C9EEB] text-xs font-mono">
                          {bankAccounts[0].bankCode}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                            <span>{bankAccounts[0].accountHolderName}</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                              ✓ Verified
                            </span>
                          </div>
                          <div className="text-[11px] text-[#A3A8B3]">
                            Ngân hàng {bankAccounts[0].bankCode} • **** {bankAccounts[0].bankAccountNumber.slice(-4)}
                          </div>
                        </div>
                      </div>
                      {bankAccounts.length > 1 && (
                        <span className="text-[10px] text-[#A3A8B3] font-mono">
                          +{bankAccounts.length - 1} view all
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Chưa cập nhật tài khoản ngân hàng nhận tiền</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddBankModalOpen(true)}
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        + Thêm tài khoản
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Visibility Control */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  VISIBILITY
                </span>
                <div className="grid grid-cols-2 p-1 bg-[#05070A] border border-gray-800 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPrivateListing(false)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !isPrivateListing
                        ? 'bg-white/10 text-white font-bold shadow-sm'
                        : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>Public</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivateListing(true)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPrivateListing
                        ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 font-bold shadow-sm'
                        : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Private</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  {!isPrivateListing
                    ? 'Listed openly on Marketplace. Anyone can search and buy.'
                    : 'Hidden from Marketplace. Accessible only via secret link or QR code.'}
                </p>
              </div>

              {/* 5. Confirmation Checkbox */}
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer pt-2 group">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-gray-700 bg-black text-[#FF5A36] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">
                  I certify that I am the authentic ticket owner and agree to list on TicketShield Marketplace
                </span>
              </label>

              {/* 6. Publish Button */}
              <button
                onClick={handlePublishListing}
                disabled={isPublishing || !agreedTerms}
                className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <span>PUBLISH LISTING</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: LISTING PUBLISHED */}
        {currentStep === 6 && (() => {
          const matchedListing = existingListings.find(
            (l) => (publishedListingId && l.listingId === publishedListingId) || l.originalTicketCode === ticketCode
          );
          const isAtsh = ticketCode.startsWith('ATSH') || !ticketCode;
          const resolvedEventName = matchedListing?.eventName || (isAtsh ? 'Anh Trai Say Hi Concert 2026' : 'Official Concert Digital Pass');
          const resolvedEventDate = matchedListing?.eventStartAt
            ? new Date(matchedListing.eventStartAt).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '19:00, 26 Tháng 10, 2026';
          const resolvedVenue = matchedListing?.eventVenue || 'Van Hanh Mall Stadium, TP.HCM';
          const resolvedTier = matchedListing?.tierName || (
            ticketCode.includes('VIP')
              ? 'VIP Zone A - Hàng 1 Ghế 12'
              : ticketCode.includes('GA')
              ? 'GA Standing Zone 2'
              : 'Standard Zone C'
          );
          const resolvedPoster = '/images/landing/featured-1.jpg';

          return (
            <div key={6} className="animate-fade-in-up w-full mx-auto space-y-6 pt-2">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-xl animate-pop-in ${
                  isPrivateListing
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400 shadow-purple-500/30'
                    : 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-emerald-500/40'
                }`}>
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  {isPrivateListing ? 'Private Listing Created Successfully!' : 'Listing Published Successfully!'}
                </h2>
                <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-lg mx-auto">
                  {isPrivateListing
                    ? 'Your ticket is secured with 100% Escrow Protection. Share your private link or QR code directly with your buyer.'
                    : 'Your ticket is now live on TicketShield Marketplace with 100% Escrow Protection.'}
                </p>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Ticketbox-style Ticket Pass + Bottom Navigation Buttons */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  {/* TICKETBOX SHAPE CARD WITH 100% TRANSLUCENT CUTOUTS */}
                  <div className="relative ticket-perforated-mask bg-[#0A0D14] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col sm:flex-row">
                    {/* Top Notch Transparent Cutout Rim Arc (Desktop) */}
                    <svg
                      className="hidden sm:block absolute -top-[1px] right-[calc(14rem-14px)] w-7 h-3.5 z-20 pointer-events-none"
                      viewBox="0 0 28 14"
                      fill="none"
                    >
                      <path d="M0 0 A 14 14 0 0 0 28 0" stroke="#27272A" strokeWidth="1.5" fill="none" />
                    </svg>

                    {/* Bottom Notch Transparent Cutout Rim Arc (Desktop) */}
                    <svg
                      className="hidden sm:block absolute -bottom-[1px] right-[calc(14rem-14px)] w-7 h-3.5 z-20 pointer-events-none"
                      viewBox="0 0 28 14"
                      fill="none"
                    >
                      <path d="M0 14 A 14 14 0 0 1 28 14" stroke="#27272A" strokeWidth="1.5" fill="none" />
                    </svg>

                    {/* Perforated Dashed Seam Divider (Desktop) */}
                    <div className="hidden sm:block absolute top-3.5 bottom-3.5 right-[14rem] w-[1px] border-r-2 border-dashed border-[#27272A] z-10 pointer-events-none" />

                    {/* Left: Text Content Wrapper */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4 relative min-w-0">

                      {/* Top Header: Badge & Event Name */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                            OFFICIAL DIGITAL TICKET PASS
                          </span>
                          {isPrivateListing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-purple-500/20 border border-purple-500/40 text-purple-300">
                              <Lock className="w-2.5 h-2.5" /> PRIVATE PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                              <Globe className="w-2.5 h-2.5" /> PUBLIC
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold font-display text-white leading-tight">
                          {resolvedEventName}
                        </h3>
                        <p className="text-xs font-mono font-semibold text-[#FF5A36] tracking-wide">
                          {resolvedTier}
                        </p>
                      </div>

                      {/* Event Info: Date & Venue */}
                      <div className="space-y-2 text-left text-xs font-sans">
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
                          <span className="font-semibold text-xs">{resolvedEventDate}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[#E4E4E7]">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-xs uppercase tracking-wide">
                            {resolvedVenue}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Meta Grid: Code & Listing ID */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#27272A] text-left">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                            TICKET CODE
                          </span>
                          <p className="font-mono font-bold text-xs text-white tracking-wider truncate">
                            {ticketCode || 'ATSH-VIP-888'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                            LISTING ID
                          </span>
                          <p className="font-mono font-bold text-xs text-[#A3A8B3] truncate">
                            {publishedListingId || 'TS-RESALE-LISTING'}
                          </p>
                        </div>
                      </div>

                      {/* Price Row: Face Value vs Resale Price */}
                      <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-left">
                        <div>
                          <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                            ORIGINAL PRICE
                          </span>
                          <span className="text-xs sm:text-sm text-[#A3A8B3] line-through font-mono">
                            {faceValue.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">
                            RESALE PRICE
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold font-display text-emerald-400">
                            {resalePrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Img Wrapper (Concert poster) */}
                    <div className="w-full sm:w-52 md:w-56 shrink-0 relative overflow-hidden bg-[#0A0D14] min-h-[200px] sm:min-h-[320px]">
                      <img
                        src={resolvedPoster}
                        alt={resolvedEventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 text-center">
                        <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-md text-[9px] font-mono uppercase font-bold text-white/90 border border-white/10 block shadow-md">
                          VERIFIED SECURE PASS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <button
                      onClick={() => navigate('/my-listings')}
                      className="w-full sm:flex-1 py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-[#FF5A36]/25 hover:shadow-xl hover:shadow-[#FF5A36]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center cursor-pointer"
                    >
                      Manage My Listings
                    </button>

                    {isPrivateListing ? (
                      <a
                        href={getShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview Ticket Link</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate('/marketplace')}
                        className="w-full sm:flex-1 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>View on Marketplace</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Share Link, QR Code & Actions */}
                <div className="lg:col-span-5 p-6 bg-gradient-to-b from-[#0e131b] to-[#080b0f] border border-white/15 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between">
                  {/* Link Section */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isPrivateListing ? 'bg-purple-500/20 text-purple-400' : 'bg-[#FF5A36]/20 text-[#FF5A36]'}`}>
                          <Share2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white font-display">
                          {isPrivateListing ? 'Secret Shareable Link' : 'Marketplace Listing Link'}
                        </span>
                      </div>
                      {isPrivateListing && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          Secret URL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-[#05070A] border border-white/10 rounded-xl p-1.5 focus-within:border-[#FF5A36]/50 transition-colors">
                      <input
                        type="text"
                        readOnly
                        value={getShareUrl()}
                        className="bg-transparent border-none text-white text-xs font-mono px-2 flex-1 focus:ring-0 truncate select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        type="button"
                        className="px-3.5 py-2 bg-white/10 hover:bg-[#FF5A36] text-white text-xs font-bold font-display rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center space-y-3 pt-1">
                    <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-black/60 border border-white/80 inline-block">
                      <QRCodeCanvas
                        id="listing-qr-canvas"
                        value={getShareUrl()}
                        size={155}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <p className="text-[11px] text-[#A3A8B3] max-w-xs text-center leading-relaxed">
                      Scan this QR code with any camera or phone scanner to open ticket checkout instantly.
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                      <button
                        onClick={handleCopyQrImage}
                        type="button"
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-white/20 active:scale-95 cursor-pointer"
                      >
                        {copiedQr ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Image Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#A3A8B3]" />
                            <span>Copy QR Image</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownloadQr}
                        type="button"
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-white/20 active:scale-95 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#A3A8B3]" />
                        <span>Download QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Escrow Guarantee Note */}
                  <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center gap-2.5 text-[11px] text-[#A3A8B3] text-left">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% Escrow Protection: Buyer's payment is held until ticket entry is confirmed.</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
          onSuccess={() => {
            fetchBankAccounts();
            showToast('Đã lưu tài khoản ngân hàng thụ hưởng! Bạn có thể tiếp tục đăng bán vé.', 'success');
          }}
        />
      </div>
    </div>
  );
};

export default SellTicketPage;
