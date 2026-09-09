import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListingDetail } from '../hooks/useListings';
import { useBotAssessment } from '../hooks/useBotAssessment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@ticketshield/validation';
import { ordersApi, paymentsApi, botDetectionApi } from '@ticketshield/api-client';
import { formatVND } from '../utils/formatters';
import { BotDecisionCard } from '../components/checkout/BotDecisionCard';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { SecurityBadge } from '../components/ui/SecurityBadge';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../stores/uiStore';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing, isLoading: isListingLoading } = useListingDetail(listingId || 'lst-301');
  const { data: botAssessment, isLoading: isBotLoading } = useBotAssessment();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [captchaInput, setCaptchaInput] = useState('');
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      listingId: listingId || 'lst-301',
      paymentMethod: 'MOMO',
      fullName: 'Nguyễn Văn An',
      email: 'nguyen.van.a@gmail.com',
      phoneNumber: '0901234567',
      agreeEscrowTerms: true,
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (botAssessment?.decision === 'BLOCKED') {
      showToast('Phiên mua hàng bị chặn bởi AI Bot Detection (Giao dịch tự động)', 'error');
      return;
    }

    if (botAssessment?.decision === 'THROTTLED' && !isCaptchaSolved) {
      showToast('Vui lòng hoàn thành xác minh CAPTCHA trước khi thanh toán', 'warning');
      return;
    }

    setIsProcessingOrder(true);
    try {
      const order = await ordersApi.createOrder(data);
      await paymentsApi.processPayment(order.id, data.paymentMethod, order.totalAmount);
      showToast('Thanh toán thành công & Nạp Escrow bảo vệ!', 'success');
      navigate(`/checkout/${listingId}/success?orderId=${order.id}`);
    } catch (err: any) {
      showToast('Thanh toán thất bại: ' + err.message, 'error');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleVerifyCaptcha = async () => {
    if (captchaInput.trim().length > 0) {
      setIsCaptchaSolved(true);
      showToast('Xác minh CAPTCHA thành công! Mở khóa tiến hành thanh toán.', 'success');
    } else {
      showToast('Vui lòng nhập mã xác minh', 'error');
    }
  };

  if (isListingLoading || !listing) {
    return <div className="p-12 text-center text-slate-400">Đang tải thông tin đơn hàng...</div>;
  }

  const isBlocked = botAssessment?.decision === 'BLOCKED';
  const isThrottled = botAssessment?.decision === 'THROTTLED' && !isCaptchaSolved;

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-navy-750 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Thanh Toán & Nạp Tiền Bảo Vệ Escrow</h1>
          <p className="text-xs text-slate-400 mt-1">Đơn hàng được bảo mật bởi AI Behavioral Classification Model</p>
        </div>
        <SecurityBadge text="100% Escrow Protected" />
      </div>

      {/* AI Bot Decision Assessment Component */}
      {botAssessment && <BotDecisionCard assessment={botAssessment} />}

      {/* Blocked State UI */}
      {isBlocked && (
        <div className="bg-red-500/10 border-2 border-red-500/50 p-6 rounded-2xl text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-400">PHIÊN GIAO DỊCH BỊ KHÓA BỞI TICKETSHIELD AI</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Hệ thống phát hiện dấu hiệu bất thường (Tốc độ gửi request cao, IP proxy rủi ro). Vui lòng thử lại sau 15 phút hoặc liên hệ bộ phận hỗ trợ.
          </p>
        </div>
      )}

      {/* Throttled State CAPTCHA Challenge UI */}
      {botAssessment?.decision === 'THROTTLED' && !isCaptchaSolved && (
        <div className="bg-amber-500/10 border-2 border-amber-500/50 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-400">XÁC MINH AN NINH BỔ SUNG (SECURITY CHALLENGE)</h4>
              <p className="text-xs text-slate-300">Nhập mã an ninh phía dưới để tiếp tục thanh toán vé.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-navy-900 p-4 rounded-xl border border-navy-750">
            <div className="bg-navy-800 text-cyan-400 px-4 py-2 rounded font-mono font-extrabold text-lg tracking-widest border border-cyan-500/30">
              TS-8849
            </div>
            <input
              type="text"
              placeholder="Nhập lại mã TS-8849"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <Button onClick={handleVerifyCaptcha} size="sm" className="font-bold">
              Xác Nhận CAPTCHA
            </Button>
          </div>
        </div>
      )}

      {/* Main Checkout Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Thông Tin Người Nhận Vé</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Nhận Vé</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Phương Thức Thanh Toán Việt Nam</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-xl border border-cyan-500 bg-cyan-500/10 font-bold text-white flex items-center justify-between cursor-pointer">
                <span>Ví MoMo / VNPay QR</span>
                <input type="radio" value="MOMO" {...register('paymentMethod')} defaultChecked />
              </label>
              <label className="p-3 rounded-xl border border-navy-700 bg-navy-900 text-slate-300 flex items-center justify-between cursor-pointer">
                <span>Chuyển Khoản Ngân Hàng 24/7</span>
                <input type="radio" value="BANK_TRANSFER" {...register('paymentMethod')} />
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary & Final Submit */}
        <div className="space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-cyan-500/30 shadow-glow-cyan space-y-4">
            <h3 className="text-base font-bold text-white">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-2 text-xs text-slate-300 border-b border-navy-750 pb-3">
              <div className="flex justify-between">
                <span>Vé sự kiện:</span>
                <strong className="text-white">{listing.eventTitle}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chỗ ngồi:</span>
                <span>{listing.seatZone}</span>
              </div>
              <div className="flex justify-between">
                <span>Giá sang nhượng:</span>
                <span>{formatVND(listing.resalePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí dịch vụ Escrow:</span>
                <span>{formatVND(50000)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-white">
              <span>Tổng cộng:</span>
              <span className="text-xl font-extrabold text-cyan-400">{formatVND(listing.resalePrice + 50000)}</span>
            </div>

            <Button
              type="submit"
              disabled={isBlocked || isThrottled}
              isLoading={isProcessingOrder}
              size="lg"
              className="w-full font-bold shadow-glow-cyan"
            >
              Xác Nhận Thanh Toán Escrow
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
