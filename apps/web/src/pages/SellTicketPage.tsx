import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { resaleApi, bankAccountsApi, SellerListingDto } from '@ticketshield/api-client';
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
  TicketPriceItem,
} from '../components/sell';

export const SellTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { data: purchasedTickets = [], isPending: isLoadingPurchased } = useMyTickets();

  const purchasedPassCode = (ticket: PurchasedTicketDto) =>
    (ticket.ticketPassCode || ticket.qrCodeData || '').trim();

const DRAFT_STORAGE_KEY = 'ticketshield_sell_draft';
  const OTP_TTL_MS = 300 * 1000;
  /** Domain Law: một gói vé chỉ chứa từ 2 đến 3 vé (khớp ResaleListing.MaxBundleTickets ở BE). */
  const MAX_BUNDLE_TICKETS = 3;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCancellingSession, setIsCancellingSession] = useState<boolean>(false);
  const [resumeDraftAvailable, setResumeDraftAvailable] = useState<boolean>(false);

  // Auto scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // =========================================================================================
  // Resale Workflow Verification state
  // =========================================================================================
  // Mỗi vé trong gói có MỘT phiên OTP riêng: BTC chỉ cấp OTP/khóa được từng vé một,
  // nên không thể dùng chung một verificationId cho cả gói.
  interface TicketSession {
    code: string;
    verificationId: string;
    originalPrice: number;
    priceCeiling: number;
    markupPercent: number;
    locked: boolean;
    expiresAt: number | null;
  }

  const [ticketCode, setTicketCode] = useState('');
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>('');
  const [sessions, setSessions] = useState<TicketSession[]>([]);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const { data: organizers = [], isLoading: isLoadingOrganizers } = useOrganizers();

  // Scenario Modal state
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [activeFeeTooltip, setActiveFeeTooltip] = useState<'seller' | 'buyer' | null>(null);

  // Step 4 Pricing state: lưu giá bán của từng vé (theo mã vé)
  const [ticketPrices, setTicketPrices] = useState<Record<string, number>>({});
  const [activeTicketIndex, setActiveTicketIndex] = useState<number>(0);

  const markupPercent = sessions[0]?.markupPercent ?? 0;
  const faceValue = sessions.reduce((sum, s) => sum + s.originalPrice, 0);
  const priceCeiling = sessions.length
    ? sessions.reduce((min, s) => Math.min(min, s.priceCeiling || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER)
    : 0;

  // Step 2 OTP state
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendingCode, setResendingCode] = useState<string | null>(null);

  const ticketCodes = useMemo(() => sessions.map((s) => s.code), [sessions]);
  const otpTickets = useMemo(
    () => sessions.map((s) => ({ code: s.code, expiresAt: s.expiresAt, locked: s.locked })),
    [sessions]
  );
  const ticketCount = Math.max(sessions.length, 1);
  const isBundle = sessions.length > 1;
  const perTicketFaceValue = Math.trunc(faceValue / ticketCount);

  // Auto restore unfinished draft session from localStorage on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.sessions?.length && d.currentStep > 1 && d.currentStep < 6) {
          setTicketCode((d.ticketCodes || []).join(', '));
          if (d.selectedOrganizerId) setSelectedOrganizerId(d.selectedOrganizerId);
          setSessions(d.sessions);
          if (d.ticketPrices && typeof d.ticketPrices === 'object') {
            setTicketPrices(d.ticketPrices);
          } else if (d.resalePrice) {
            const fallback: Record<string, number> = {};
            (d.sessions as any[]).forEach((s) => {
              fallback[s.code] = d.resalePrice;
            });
            setTicketPrices(fallback);
          }
          if (typeof d.activeTicketIndex === 'number') {
            setActiveTicketIndex(d.activeTicketIndex);
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
    if (sessions.length > 0 && currentStep > 1 && currentStep < 6) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          ticketCodes,
          selectedOrganizerId,
          sessions,
          currentStep,
          ticketPrices,
          activeTicketIndex,
          savedAt: Date.now(),
        })
      );
    }
  }, [sessions, currentStep, ticketCodes, selectedOrganizerId, ticketPrices, activeTicketIndex]);

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

  // Flatten purchased tickets so each ticket in a bundle/pair is an individual item for resale
  const allPurchasedTickets = useMemo(() => {
    const list: PurchasedTicketDto[] = [];
    for (const t of purchasedTickets) {
      if (t.bundleItems && t.bundleItems.length > 0) {
        t.bundleItems.forEach((item, idx) => {
          const code = (item.ticketCode || '').trim();
          if (!code) return;
          list.push({
            ...t,
            escrowId: `${t.escrowId}-${item.listingId || code}-${idx}`,
            listingId: item.listingId || t.listingId,
            ticketPassCode: code,
            seatZone: item.seatZone || t.seatZone,
            qrCodeData: item.qrCodeData || code,
            qrCodeImageUrl: item.qrCodeImageUrl || t.qrCodeImageUrl,
            bundleTotalTickets: t.bundleTotalTickets || t.bundleItems?.length,
          });
        });
      } else {
        list.push(t);
      }
    }
    return list;
  }, [purchasedTickets]);

  // Purchased on TicketShield and released or held in escrow; not already listed.
  const eligibleTickets = useMemo(() => {
    return allPurchasedTickets.filter((t) => {
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
  }, [allPurchasedTickets, existingListings]);

  const verificationIdsRef = useRef<string[]>([]);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    verificationIdsRef.current = sessions.map((s) => s.verificationId).filter(Boolean);
    currentStepRef.current = currentStep;
  }, [sessions, currentStep]);

  // Auto send gRPC unlock beacons for EVERY session when user exits or navigates away
  useEffect(() => {
    const releaseAll = () => {
      const ids = verificationIdsRef.current;
      if (ids.length > 0 && currentStepRef.current > 1 && currentStepRef.current < 6) {
        ids.forEach((id) => resaleApi.closeVerificationBeacon(id));
      }
    };

    window.addEventListener('beforeunload', releaseAll);
    window.addEventListener('pagehide', releaseAll);

    return () => {
      window.removeEventListener('beforeunload', releaseAll);
      window.removeEventListener('pagehide', releaseAll);
    };
  }, []);


  const handleUpdateTicketPrice = useCallback((code: string, newPrice: number) => {
    const targetSession = sessions.find((s) => s.code === code);
    const ceiling = targetSession?.priceCeiling && targetSession.priceCeiling > 0
      ? targetSession.priceCeiling
      : Number.MAX_SAFE_INTEGER;
    const clamped = Math.max(0, Math.min(newPrice, ceiling));
    setTicketPrices((prev) => ({
      ...prev,
      [code]: clamped,
    }));
  }, [sessions]);

  const ticketsPriceList = useMemo<TicketPriceItem[]>(() => {
    return sessions.map((s) => {
      const price = ticketPrices[s.code] ?? s.originalPrice ?? 0;
      return {
        code: s.code,
        originalPrice: s.originalPrice,
        markupPercent: s.markupPercent,
        priceCeiling: s.priceCeiling,
        resalePrice: price,
        seatZone: allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === s.code.toUpperCase())?.seatZone,
      };
    });
  }, [sessions, ticketPrices, allPurchasedTickets]);

  // Step 5 Confirmation state
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isPrivateListing, setIsPrivateListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string>('');
  const [publishedPrivateToken, setPublishedPrivateToken] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedQr, setCopiedQr] = useState<boolean>(false);

  // Khóa các trường hợp không cho quay lại bước trước tránh bị lỗi
  // Đặc biệt: khi đã publish vé (Bước 6), tuyệt đối không cho quay lại Bước 4 hay bất kỳ bước nào
  const handleSetCurrentStep = useCallback(
    (action: React.SetStateAction<number>) => {
      setCurrentStep((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        // Đã publish (Bước 6) -> Không cho quay lại bất kỳ bước nào (kể cả Bước 4)
        if (prev === 6 && next < 6) {
          return 6;
        }
        // Đang publish -> Không cho đổi bước
        if (isPublishing) {
          return prev;
        }
        // Đã xác thực OTP & khóa vé (Bước >= 3) -> Không cho quay lại Bước 1 hoặc 2
        if (prev >= 3 && next <= 2) {
          return prev;
        }
        // Đang ở Bước 3 -> Không cho quay lại Bước 2 (OTP)
        if (prev === 3 && next < 3) {
          return 3;
        }
        return next;
      });
    },
    [isPublishing]
  );

  /** Đóng mọi phiên đã tạo (dùng khi luồng lỗi giữa chừng) — không để vé nào bị khoá treo. */
  const closeAllSessions = useCallback(async () => {
    const ids = sessions.map((s) => s.verificationId).filter(Boolean);
    await Promise.allSettled(ids.map((id) => resaleApi.closeVerification(id)));
  }, [sessions]);

  // Step 1: Request an OTP for EVERY ticket (BTC issues one OTP per ticket)
  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRequestingOtp) return;

    const codes = ticketCode
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      showToast('Please enter the ticket identifier code!', 'warning');
      return;
    }

    if (codes.length > MAX_BUNDLE_TICKETS) {
      showToast(`A combo can include at most ${MAX_BUNDLE_TICKETS} tickets. Please remove some codes.`, 'warning');
      return;
    }

    const duplicate = codes.find((code, i) => codes.indexOf(code) !== i);
    if (duplicate) {
      showToast(`Ticket ${duplicate} appears more than once. Each code must be unique.`, 'warning');
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

      const ownedPurchase = allPurchasedTickets.find(
        (t) => purchasedPassCode(t).toUpperCase() === code
      );
      if (ownedPurchase && (ownedPurchase.status || '').trim().toUpperCase() !== 'VALID') {
        showToast(`Ticket ${code} cannot be resold yet. Please wait until the protection period has concluded.`, 'error');
        return;
      }
    }

    if (codes.length > 1) {
      const matched = codes
        .map((c) => allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === c))
        .filter(Boolean);
      if (matched.length > 1) {
        const firstEventId = matched[0]?.eventId;
        if (firstEventId && matched.some((m) => m?.eventId && m.eventId !== firstEventId)) {
          showToast('Tất cả các vé trong gói bán phải thuộc cùng một sự kiện!', 'error');
          return;
        }
      }
    }

    let created: TicketSession[] = [];

    try {
      setIsRequestingOtp(true);
      showToast(
        codes.length > 1
          ? `Requesting a separate OTP for each of the ${codes.length} tickets...`
          : 'Verifying ticket & requesting OTP from Organizer...',
        'info'
      );

      // Gọi song song cho tất cả các vé thay vì gọi tuần tự để tăng tốc độ tối đa
      created = await Promise.all(
        codes.map(async (code) => {
          const result = await resaleApi.requestVerificationOtp(code, selectedOrganizerId || undefined);
          const originalPrice = result.originalPrice ?? 0;
          const markup = result.markupPercent ?? 0;

          return {
            code,
            verificationId: result.verificationId,
            originalPrice,
            markupPercent: markup,
            priceCeiling:
              result.priceCeiling && result.priceCeiling > 0
                ? result.priceCeiling
                : Math.trunc(originalPrice * (1 + markup / 100)),
            locked: false,
            expiresAt: Date.now() + OTP_TTL_MS,
          };
        })
      );

      setSessions(created);
      setTicketCode(codes.join(', '));

      const initialPrices: Record<string, number> = {};
      created.forEach((s) => {
        initialPrices[s.code] = s.originalPrice > 0 ? s.originalPrice : 50000;
      });
      setTicketPrices(initialPrices);
      setActiveTicketIndex(0);

      showToast(
        codes.length > 1
          ? `${created.length} OTP codes sent. Each ticket has its own code.`
          : 'OTP code sent! Please check the ticket owner email/phone.',
        'success'
      );
      setCurrentStep(2);
    } catch (err: any) {
      // Hoàn tác phần đã tạo: không vé nào được giữ ở trạng thái chờ OTP.
      await Promise.allSettled(created.map((s) => resaleApi.closeVerification(s.verificationId)));
      const msg = err?.response?.data?.message || err?.message || 'Verification failed. Please check the ticket code and try again.';
      showToast(msg, 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Resend OTP cho một vé cụ thể
  const handleResendOtp = async (code: string) => {
    const target = sessions.find((s) => s.code === code);
    if (!target) return;

    try {
      setResendingCode(code);
      await resaleApi.resendVerificationOtp(target.verificationId);
      setSessions((prev) =>
        prev.map((s) => (s.code === code ? { ...s, expiresAt: Date.now() + OTP_TTL_MS } : s))
      );
      showToast(`New OTP sent for ticket ${code}.`, 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not resend OTP. Please try again shortly!';
      showToast(msg, 'error');
    } finally {
      setResendingCode(null);
    }
  };

  // Step 2: Confirm OTP từng vé (all-or-nothing).
  // Mỗi trang xác thực đúng 1 vé; nếu một vé bị khóa/quá số lần nhập thì giải phóng toàn bộ và về Bước 1.
  // Nếu chỉ sai mã OTP thông thường (OTP_INVALID) thì giữ nguyên trang để người dùng nhập lại.
  const handleVerifyOneTicket = async (entry: { code: string; otp: string }): Promise<boolean> => {
    if (sessions.length === 0) {
      showToast('Phiên xác thực không hợp lệ!', 'error');
      return false;
    }

    const target = sessions.find((s) => s.code === entry.code);
    if (!target) {
      showToast(`Vé ${entry.code} không tồn tại trong danh sách xác thực.`, 'error');
      return false;
    }

    try {
      setIsVerifyingOtp(true);
      const result = await resaleApi.confirmVerificationOtp(target.verificationId, entry.otp);

      setSessions((prev) =>
        prev.map((s) =>
          s.code === entry.code
            ? {
                ...s,
                locked: true,
                originalPrice: result.originalPrice ?? s.originalPrice,
                markupPercent: result.markupPercent ?? s.markupPercent,
                priceCeiling:
                  result.priceCeiling && result.priceCeiling > 0 ? result.priceCeiling : s.priceCeiling,
              }
            : s
        )
      );

      if (result.originalPrice && result.originalPrice > 0) {
        setTicketPrices((prev) => ({
          ...prev,
          [entry.code]: prev[entry.code] || result.originalPrice || 50000,
        }));
      }

      return true;
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      const errorCode = err?.response?.data?.errors?.[0] || rawMsg;
      const status = err?.response?.status;

      // Chỉ hủy toàn bộ và đá về Step 1 khi số lần thử đã cạn kiệt (429 / OTP_ATTEMPTS_EXHAUSTED) hoặc vé đã bị khóa bên khác
      const isFatal =
        errorCode === 'OTP_ATTEMPTS_EXHAUSTED' ||
        status === 429 ||
        errorCode === 'TICKET_CHANGED' ||
        errorCode === 'TICKET_LOCKED';

      if (isFatal) {
        await closeAllSessions();
        resetToStep1(sessions.map((s) => s.code).join(', '));
        const fatalMsg =
          errorCode === 'OTP_ATTEMPTS_EXHAUSTED' || status === 429
            ? 'Đã nhập sai OTP quá 3 lần. Toàn bộ vé trong gói đã được mở khóa, vui lòng thực hiện lại từ đầu!'
            : `Xác thực thất bại (${rawMsg || 'Vé không khả dụng'}). Toàn bộ vé đã được mở khóa.`;
        showToast(fatalMsg, 'error');
        return false;
      }

      // Xử lý lỗi có thể thử lại tại Step 2 (không bị out ra):
      let userFriendlyMsg = 'Mã OTP không chính xác. Vui lòng kiểm tra lại!';
      if (errorCode === 'OTP_INVALID' || rawMsg.includes('OTP_INVALID')) {
        userFriendlyMsg = 'Mã OTP không chính xác. Vui lòng kiểm tra kỹ 6 chữ số được gửi tới email/SĐT chủ vé!';
      } else if (errorCode === 'OTP_EXPIRED' || rawMsg.includes('OTP_EXPIRED') || rawMsg.includes('expired')) {
        userFriendlyMsg = 'Mã OTP đã hết hạn. Vui lòng bấm "Gửi lại OTP" bên dưới để nhận mã mới!';
      } else if (rawMsg) {
        userFriendlyMsg = rawMsg;
      }

      showToast(userFriendlyMsg, 'error');
      throw new Error(userFriendlyMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Tất cả vé đã khoá -> sang bước 3
  const handleOtpVerified = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 2) {
        showToast(
          sessions.length > 1
            ? `All ${sessions.length} tickets verified & locked successfully!`
            : 'OTP verified & ticket locked successfully!',
          'success'
        );
        return 3;
      }
      return prev;
    });
  }, [sessions.length, showToast]);

  // Helper reset form to Step 1 and remove draft (giữ lại mã vé nếu muốn thử lại)
  const resetToStep1 = (keepCodes?: string) => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear sell draft', e);
    }
    setSessions([]);
    setTicketCode(keepCodes ?? '');
    setTicketPrices({});
    setActiveTicketIndex(0);
    setCurrentStep(1);
    setResumeDraftAvailable(false);
  };

  // Close abandoned sessions and release ALL ticket locks at Organizer
  const handleAbandonSession = async () => {
    if (sessions.length === 0) {
      resetToStep1();
      return;
    }
    try {
      setIsCancellingSession(true);
      showToast(
        sessions.length > 1
          ? 'Cancelling all sessions and unlocking every ticket with Organizer...'
          : 'Cancelling session and unlocking ticket with Organizer...',
        'info'
      );
      await closeAllSessions();
      showToast(
        sessions.length > 1
          ? 'All sessions cancelled and tickets unlocked successfully!'
          : 'Session cancelled and ticket unlocked successfully!',
        'success'
      );
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

  // Step 5: Publish Resale Listing (1 vé = publish, 2–3 vé = bulk all-or-nothing)
  const handlePublishListing = async () => {
    if (!agreedTerms) {
      showToast('Please agree to the authentic ticket listing terms!', 'warning');
      return;
    }

    if (sessions.length === 0) {
      showToast('Missing verification session!', 'error');
      return;
    }

    if (!sessions.every((s) => s.locked)) {
      showToast('Every ticket must pass its own OTP check before listing.', 'warning');
      return;
    }

    for (const s of sessions) {
      const p = ticketPrices[s.code] ?? s.originalPrice;
      const ceiling = s.priceCeiling && s.priceCeiling > 0 ? s.priceCeiling : Number.MAX_SAFE_INTEGER;
      if (p > ceiling) {
        showToast(
          `Giá bán vé ${s.code} vượt quá trần cho phép (${ceiling.toLocaleString('vi-VN')} VND). Vui lòng hạ giá.`,
          'warning'
        );
        return;
      }
      if (p < 5000) {
        showToast(
          `Giá bán vé ${s.code} phải tối thiểu 5.000 VND. Vui lòng tăng giá.`,
          'warning'
        );
        return;
      }
    }

    try {
      setIsPublishing(true);

      if (sessions.length === 1) {
        const p = ticketPrices[sessions[0].code] ?? sessions[0].originalPrice;
        const result = await resaleApi.publishListing(
          sessions[0].verificationId,
          p,
          isPrivateListing
        );
        setPublishedListingId(result.listingId ?? '');
        setPublishedPrivateToken(result.privateAccessToken ?? '');
      } else {
        // BE tạo N listing thật trong 1 transaction; mỗi vé mang giá bán riêng của chính nó
        const result = await resaleApi.bulkPublishListing(
          sessions.map((s) => ({
            verificationId: s.verificationId,
            resalePrice: ticketPrices[s.code] ?? s.originalPrice,
            isPrivate: isPrivateListing,
          })),
          true
        );
        setPublishedListingId(result.listings?.[0]?.listingId ?? '');
        if (isPrivateListing) {
          const token = (result as any).privateAccessToken || (result.listings?.[0] as any)?.privateAccessToken || '';
          setPublishedPrivateToken(token);
        }
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        console.warn('Could not remove draft', e);
      }
      setResumeDraftAvailable(false);
      showToast(
        isBundle
          ? `Combo of ${sessions.length} tickets listed successfully on TicketShield Marketplace!`
          : isPrivateListing
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
          setCurrentStep={handleSetCurrentStep}
          handleAbandonSession={handleAbandonSession}
          resumeDraftAvailable={resumeDraftAvailable}
          ticketCode={ticketCode}
          isCancellingSession={isCancellingSession}
          isPublishing={isPublishing}
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
            tickets={otpTickets}
            onVerifyTicket={handleVerifyOneTicket}
            onComplete={handleOtpVerified}
            onResend={handleResendOtp}
            onAbandon={handleAbandonSession}
            isVerifying={isVerifyingOtp}
            resendingCode={resendingCode}
            isCancelling={isCancellingSession}
          />
        )}

        {/* STEP 3: TICKET VERIFIED & LOCKED */}
        {currentStep === 3 && (
          <Step3ConfirmDetails
            tickets={sessions.map((s) => ({
              code: s.code,
              originalPrice: s.originalPrice,
              priceCeiling: s.priceCeiling,
              seatZone: allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === s.code.toUpperCase())?.seatZone,
            }))}
            markupPercent={markupPercent}
            eventName={allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === sessions[0]?.code?.toUpperCase())?.eventName}
            eventVenue={allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === sessions[0]?.code?.toUpperCase())?.eventVenue}
            onContinue={() => setCurrentStep(4)}
          />
        )}

        {/* STEP 4: SET RESALE PRICE */}
        {currentStep === 4 && (
          <Step4SetPrice
            tickets={ticketsPriceList}
            activeTicketIndex={activeTicketIndex}
            setActiveTicketIndex={setActiveTicketIndex}
            onUpdateTicketPrice={handleUpdateTicketPrice}
            onContinue={() => setCurrentStep(5)}
          />
        )}

        {/* STEP 5: REVIEW & CONFIRM LISTING */}
        {currentStep === 5 && (
          <Step5ReviewPublish
            ticketCodes={ticketCodes}
            tickets={ticketsPriceList}
            faceValue={faceValue}
            resalePrice={ticketPrices[sessions[0]?.code] ?? sessions[0]?.originalPrice ?? 0}
            bankAccounts={bankAccounts}
            seatZone={allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === sessions[0]?.code?.toUpperCase())?.seatZone}
            eventName={allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === sessions[0]?.code?.toUpperCase())?.eventName}
            eventVenue={allPurchasedTickets.find((t) => purchasedPassCode(t).toUpperCase() === sessions[0]?.code?.toUpperCase())?.eventVenue}
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
            ticketCodes={ticketCodes}
            publishedListingId={publishedListingId}
            existingListings={existingListings}
            faceValue={faceValue}
            resalePrice={ticketPrices[sessions[0]?.code] ?? sessions[0]?.originalPrice ?? 0}
            totalResalePrice={sessions.reduce((sum, s) => sum + (ticketPrices[s.code] ?? s.originalPrice ?? 0), 0)}
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
