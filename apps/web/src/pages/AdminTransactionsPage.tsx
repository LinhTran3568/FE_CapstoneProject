import React from 'react';
import { SettlementBufferControlPanel } from '../components/admin/SettlementBufferControlPanel';

export const AdminTransactionsPage: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Giao Dịch & Đệm Ký Quỹ Escrow
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Cấu hình thời gian giữ tiền ký quỹ và thời điểm ngừng giao dịch trước giờ khai mạc sự kiện
          </p>
        </div>
      </div>

      <SettlementBufferControlPanel />
    </div>
  );
};
