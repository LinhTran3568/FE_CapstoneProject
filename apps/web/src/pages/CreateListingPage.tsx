import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createListingSchema, CreateListingFormData } from '@ticketshield/validation';
import { useCreateListing } from '../hooks/useListings';
import { useUIStore } from '../stores/uiStore';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

export const CreateListingPage: React.FC = () => {
  const createListingMutation = useCreateListing();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      ticketId: 'tkt-102',
      resalePrice: 2400000,
      seatInfo: 'Tầng 1 - Hàng D, Ghế 08',
      bankAccount: '19034455667788',
      bankName: 'Techcombank',
      notes: 'Vé chính chủ cần nhượng lại gấp do trùng lịch công tác.',
    },
  });

  const onSubmit = async (data: CreateListingFormData) => {
    try {
      await createListingMutation.mutateAsync(data);
      showToast('Đã đăng vé lên Sàn Verified thành công!', 'success');
      navigate('/marketplace');
    } catch (err: any) {
      showToast('Tạo bài đăng thất bại: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white">Tạo Niêm Yết Sang Nhượng Vé Verified</h1>
        <p className="text-xs text-slate-400">
          Vé đã được xác thực mã QR chính chủ bởi TicketShield AI Verification Engine
        </p>
      </div>

      <div className="bg-navy-850 p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 block">Hà Anh Tuấn Live Concert - Rực Rỡ Sức Sống 2026</span>
            <span className="text-[11px] text-slate-300">Mã vé xác thực: TS-HAT-554109 (Ghế GOLD-T1)</span>
          </div>
          <VerifiedBadge text="Verified" size="sm" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Giá Nhượng Lại (VNĐ)</label>
            <input
              type="number"
              {...register('resalePrice', { valueAsNumber: true })}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white font-extrabold text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.resalePrice && <p className="text-xs text-red-400 mt-1">{errors.resalePrice.message}</p>}
            <p className="text-[11px] text-slate-400 mt-1">Giá niêm yết gốc BTC: 2.200.000 ₫ (Không vượt quá 150% để tránh bị hệ thống cờ Anti-Scalping)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô Tả Vị Trí Chỗ Ngồi</label>
            <input
              type="text"
              {...register('seatInfo')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.seatInfo && <p className="text-xs text-red-400 mt-1">{errors.seatInfo.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ngân Hàng Nhận Tiền Giải Ngân</label>
              <input
                type="text"
                {...register('bankName')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Số Tài Khoản Ngân Hàng</label>
              <input
                type="text"
                {...register('bankAccount')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              {errors.bankAccount && <p className="text-xs text-red-400 mt-1">{errors.bankAccount.message}</p>}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={createListingMutation.isPending}
            size="lg"
            className="w-full font-bold shadow-glow-cyan"
          >
            Đăng Vé Lên Sàn Niêm Yết Ngay
          </Button>
        </form>
      </div>
    </div>
  );
};
