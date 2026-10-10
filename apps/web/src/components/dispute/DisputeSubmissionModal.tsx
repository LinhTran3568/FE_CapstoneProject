import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
  Upload,
  X,
  Trash2,
} from 'lucide-react';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { disputesApi, DisputeReasonCode } from '@ticketshield/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { myPurchasedTicketsQueryKey } from '../../hooks/useMyTickets';
import { useUIStore } from '../../stores/uiStore';

interface DisputeSubmissionModalProps {
  ticket: PurchasedTicketDto;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EvidenceFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const DisputeSubmissionModal: React.FC<DisputeSubmissionModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const modalTitleId = useId();
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  const [reasonCode, setReasonCode] = useState<DisputeReasonCode>(DisputeReasonCode.TicketInvalid);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdDispute, setCreatedDispute] = useState<{ id: string; code: string } | null>(null);

  const activeUrlsRef = useRef<Set<string>>(new Set());
  const uploadedEvidenceIdsRef = useRef<Set<string>>(new Set());

  // Close on Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    },
    [onClose, isSubmitting]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Clean up object URLs on unmount
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const validFiles: EvidenceFileItem[] = [];

    selected.forEach((file) => {
      // Validate format (BE allows JPEG, PNG, WebP)
      if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
        showToast(`File ${file.name} không được hỗ trợ. Chỉ nhận ảnh JPEG, PNG hoặc WebP.`, 'error');
        return;
      }
      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Ảnh ${file.name} vượt quá dung lượng tối đa 5MB.`, 'error');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      activeUrlsRef.current.add(previewUrl);

      validFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
      });
    });

    if (validFiles.length > 0) {
      setEvidenceFiles((prev) => [...prev, ...validFiles].slice(0, 3)); // Max 3 evidence images
    }

    // Reset input value
    e.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setEvidenceFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        activeUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.escrowId) {
      setErrorMsg('Không tìm thấy thông tin giao dịch Escrow để khiếu nại.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết sự cố bạn gặp phải.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMsg('Mô tả sự cố phải có ít nhất 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    let disputeId = createdDispute?.id;
    let disputeCode = createdDispute?.code;

    try {
      // 1. Create the dispute only once. On an evidence retry, reuse the existing one.
      if (!disputeId) {
        const disputeRes = await disputesApi.createDispute({
          escrowId: ticket.escrowId,
          reason: description.trim(),
          reasonCode,
        });
        disputeId = disputeRes.disputeId;
        disputeCode = disputeRes.disputeCode;
        setCreatedDispute({ id: disputeId, code: disputeCode });

        // Dispute already exists at this point: reflect DISPUTED status on the tickets list.
        await queryClient.invalidateQueries({ queryKey: myPurchasedTicketsQueryKey });
      }

      // 2. Upload only the evidence that has not been uploaded yet.
      const pendingFiles = evidenceFiles.filter(
        (item) => !uploadedEvidenceIdsRef.current.has(item.id)
      );
      for (const item of pendingFiles) {
        await disputesApi.addEvidence(disputeId, item.file);
        uploadedEvidenceIdsRef.current.add(item.id);
      }

      showToast(`Khiếu nại ${disputeCode || ''} đã được gửi thành công!`, 'success');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      if (disputeId) {
        // Dispute was created but an evidence upload failed: keep the modal open
        // so the buyer can retry only the images without hitting a duplicate-dispute 422.
        setErrorMsg(
          `Khiếu nại ${disputeCode || ''} đã được ghi nhận nhưng ảnh bằng chứng tải lên thất bại. Nhấn "Gửi lại ảnh" để thử lại.`
        );
      } else {
        setErrorMsg(err.message || 'Gửi khiếu nại thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="bg-[#10141D] border border-rose-500/30 rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl relative text-left my-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng modal khiếu nại"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-7">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/10">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h2 id={modalTitleId} className="text-base font-bold font-display text-white tracking-tight leading-snug">
              Gửi Khiếu Nại Sự Cố Vé
            </h2>
            <p className="text-[11px] text-[#94A3B8] leading-tight">
              Tiền sẽ được lưu giữ an toàn trong ví Escrow để xác minh.
            </p>
          </div>
        </div>

        {/* Ticket Summary Card */}
        <div className="p-2.5 rounded-xl bg-[#080A10] border border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 min-w-0">
            <div className="font-bold text-white text-xs truncate">{ticket.eventName}</div>
            <div className="text-[#94A3B8] font-mono text-[10.5px] truncate">
              Khu vực: <span className="text-amber-400 font-semibold">{ticket.tierName || ticket.seatZone || 'Standard'}</span>
              {ticket.ticketPassCode && ` • Mã: ${ticket.ticketPassCode}`}
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[9.5px] font-mono font-bold uppercase shrink-0">
            ESCROW HOLD
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-white uppercase tracking-wider">
              Lý do khiếu nại <span className="text-rose-400">*</span>
            </label>
            <div className={`grid grid-cols-1 gap-1.5 ${createdDispute ? 'pointer-events-none opacity-60' : ''}`}>
              {[
                {
                  code: DisputeReasonCode.TicketInvalid,
                  title: 'Vé không hợp lệ / Không quét được mã',
                  desc: 'Mã QR bị từ chối hoặc máy quét tại cổng báo không đúng dữ liệu.',
                },
                {
                  code: DisputeReasonCode.DuplicateEntry,
                  title: 'Vé trùng lặp / Đã có người quét trước',
                  desc: 'Vé đã được người khác sử dụng để vào cổng trước bạn.',
                },
                {
                  code: DisputeReasonCode.FakeTicket,
                  title: 'Vé giả / Sai thông tin niêm yết',
                  desc: 'Khán đài, vị trí ghế hoặc chi tiết sự kiện không đúng cam kết.',
                },
              ].map((item) => (
                <div
                  key={item.code}
                  onClick={() => setReasonCode(item.code)}
                  className={`p-2 px-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    reasonCode === item.code
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm shadow-rose-500/10'
                      : 'bg-[#0B0E17] border-white/10 text-[#CBD5E1] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-white">{item.title}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        reasonCode === item.code ? 'border-rose-400 bg-rose-500' : 'border-white/30'
                      }`}
                    >
                      {reasonCode === item.code && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider">
                Mô tả chi tiết sự cố <span className="text-rose-400">*</span>
              </label>
              <span className="text-[9.5px] text-[#64748B]">Tối thiểu 10 ký tự</span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting || Boolean(createdDispute)}
              placeholder="Mô tả diễn biến sự cố tại cổng soát vé..."
              className="w-full bg-[#0B0E17] border border-white/10 rounded-lg p-2 px-2.5 text-xs font-sans text-white placeholder-[#64748B] focus:border-rose-500 focus:outline-none transition-colors resize-none leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Evidence Uploader */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider">
                Ảnh bằng chứng (Tùy chọn)
              </label>
              <span className="text-[9.5px] text-[#94A3B8]">Tối đa 3 ảnh (&le; 5MB/ảnh)</span>
            </div>

            {/* Thumbnail Previews */}
            {evidenceFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 my-1">
                {evidenceFiles.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-white/20 aspect-square bg-black">
                    <img src={item.previewUrl} alt="Bằng chứng" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 text-rose-400 hover:text-rose-200 rounded backdrop-blur-md transition-colors"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File Input Trigger */}
            {evidenceFiles.length < 3 && (
              <label className="flex items-center justify-center p-2 px-3 border border-dashed border-white/15 hover:border-rose-500/50 rounded-xl bg-[#0B0E17] hover:bg-[#121624] transition-all cursor-pointer group text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] group-hover:text-white transition-colors font-medium">
                  <Upload className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Tải ảnh bằng chứng (màn hình báo lỗi, biên bản...)</span>
                </div>
              </label>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-2 px-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] flex items-start gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 min-h-9 bg-white/5 hover:bg-white/10 text-[#CBD5E1] hover:text-white font-medium text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 min-h-9 bg-rose-600 hover:bg-rose-500 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{createdDispute ? 'Gửi lại ảnh' : 'Gửi Khiếu Nại'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
