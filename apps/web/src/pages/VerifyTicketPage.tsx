import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyTicketSchema, VerifyTicketFormData } from '@ticketshield/validation';
import { verificationApi } from '@ticketshield/api-client';
import { TicketVerification } from '@ticketshield/types';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { formatVietnameseDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VerifyTicketPage: React.FC = () => {
  const [result, setResult] = useState<TicketVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyTicketFormData>({
    resolver: zodResolver(verifyTicketSchema),
    defaultValues: {
      ticketCode: 'TS-HAT-554109',
      eventId: 'evt-02',
      idCardNumber: '001099887766',
    },
  });

  const onSubmit = async (data: VerifyTicketFormData) => {
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verificationApi.verifyTicket(data);
      setResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Xác Thực Mã Vé Sang Nhượng AI Engine</h1>
        <p className="text-sm text-slate-400">
          Đối soát dữ liệu thời gian thực trực tiếp với API của Ban Tổ Chức để nhận huy hiệu Verified by TicketShield.
        </p>
      </div>

      {/* Form */}
      <div className="bg-navy-850 p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Vé / Mã Tra Cứu Sự Kiện</label>
            <input
              type="text"
              {...register('ticketCode')}
              placeholder="VD: TS-HAT-554109"
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            {errors.ticketCode && <p className="text-xs text-red-400 mt-1">{errors.ticketCode.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sự Kiện Tương Ứng</label>
              <select
                {...register('eventId')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="evt-02">Hà Anh Tuấn Live Concert - Rực Rỡ Sức Sống 2026</option>
                <option value="evt-01">Anh Trai Vượt Ngàn Chông Gai - Concert 3 (Hà Nội)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Số CMND/CCCD Chủ Vé</label>
              <input
                type="text"
                {...register('idCardNumber')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              {errors.idCardNumber && <p className="text-xs text-red-400 mt-1">{errors.idCardNumber.message}</p>}
            </div>
          </div>

          <Button type="submit" isLoading={isVerifying} size="lg" className="w-full font-bold shadow-glow-cyan">
            Kích Hoạt Kiểm Tra AI Verification
          </Button>
        </form>

        {/* Verification Result Component */}
        {result && (
          <div className="pt-6 border-t border-navy-750 space-y-4 animate-fadeIn">
            {result.status === 'VERIFIED' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <VerifiedBadge text="Xác Thực Thành Công 100%" />
                  <span className="text-xs font-mono text-emerald-400">ID: {result.id}</span>
                </div>

                <div className="space-y-2 text-xs text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạng thái vé BTC:</span>
                    <strong className="text-emerald-400 font-bold">HỢP LỆ • CHÍNH CHỦ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian xác thực:</span>
                    <span>{formatVietnameseDate(result.verifiedAt || new Date().toISOString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chữ ký số BTC (Digital Signature):</span>
                    <span className="font-mono text-[10px] text-cyan-400">{result.organizerSignature}</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/seller/listings/new')}
                  className="w-full font-bold shadow-glow-emerald bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2"
                >
                  <span>Đăng Vé Lên Sàn Niêm Yết Verified</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/40 p-6 rounded-2xl space-y-3 text-red-400 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                  <XCircle className="w-5 h-5" /> Vé Không Hợp Lệ ({result.status})
                </div>
                <p className="text-slate-300">{result.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
