import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDisputeSchema, CreateDisputeFormData } from '@ticketshield/validation';
import { disputesApi, MOCK_DISPUTES } from '@ticketshield/api-client';
import { Dispute } from '@ticketshield/types';
import { formatVietnameseDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../stores/uiStore';
import { AlertTriangle, ShieldAlert, CheckCircle2, FileText, Clock } from 'lucide-react';

export const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [isFiling, setIsFiling] = useState(false);
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDisputeFormData>({
    resolver: zodResolver(createDisputeSchema),
    defaultValues: {
      orderId: 'ord-8801',
      reason: 'INVALID_TICKET_AT_VENUE',
      description: 'Khi quét mã QR tại cổng B trung tâm hội nghị, máy báo vé đã được sử dụng 10 phút trước.',
    },
  });

  const onSubmit = async (data: CreateDisputeFormData) => {
    setIsFiling(true);
    try {
      const newDsp = await disputesApi.createDispute(data);
      setDisputes([newDsp, ...disputes]);
      showToast('Đã mở khiếu nại thành công! Tiền Escrow được khóa an toàn.', 'success');
      reset();
    } catch (err: any) {
      showToast('Tạo khiếu nại thất bại: ' + err.message, 'error');
    } finally {
      setIsFiling(false);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-amber-400" /> Trung Tâm Khiếu Nại & Bảo Vệ Escrow
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Hệ thống giải quyết tranh chấp sự cố quẹt vé không thành công hoặc vé trùng lặp
        </p>
      </div>

      {/* File Dispute Form */}
      <div className="bg-navy-850 p-6 rounded-3xl border border-navy-750 space-y-4">
        <h3 className="text-base font-bold text-white border-b border-navy-750 pb-3">Gửi Khiếu Nại Sự Cố Cổng Sự Kiện</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Đơn Hàng / Mã Vé</label>
              <input
                type="text"
                {...register('orderId')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              {errors.orderId && <p className="text-xs text-red-400 mt-1">{errors.orderId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lý Do Khiếu Nại</label>
              <select
                {...register('reason')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="INVALID_TICKET_AT_VENUE">Vé bị báo không hợp lệ tại cổng sự kiện</option>
                <option value="ALREADY_SCANNED">Vé đã bị quét trước đó bởi người khác</option>
                <option value="SEAT_MISMATCH">Chỗ ngồi thực tế không đúng niêm yết</option>
                <option value="TRANSFER_FAILED">Không nhận được chuyển quyền sở hữu vé</option>
                <option value="OTHER">Lý do khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô Tả Chi Tiết Sự Cố</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>

          <Button type="submit" isLoading={isFiling} className="font-bold shadow-glow-cyan bg-amber-500 hover:bg-amber-400 text-slate-950">
            Nộp Khiếu Nại Yêu Cầu Khóa Tiền Escrow
          </Button>
        </form>
      </div>

      {/* Disputes History List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Danh Sách Khiếu Nại Của Tôi</h3>

        <div className="space-y-4">
          {disputes.map((dsp) => (
            <div key={dsp.id} className="bg-navy-850 p-5 rounded-2xl border border-navy-750 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-cyan-400 font-bold">{dsp.disputeNumber}</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  {dsp.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{dsp.description}</p>
              <span className="text-[11px] text-slate-400 block">Thời gian tạo: {formatVietnameseDate(dsp.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
