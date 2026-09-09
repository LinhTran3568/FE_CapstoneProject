import React from 'react';
import { MOCK_SUSPICIOUS_LISTINGS } from '@ticketshield/api-client';
import { RiskBadge } from '../components/ui/RiskBadge';
import { formatVietnameseDate } from '../utils/formatters';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const AdminResaleMonitoringPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-amber-400" /> Giám Sát Thị Trường Sang Nhượng & Anti-Scalping
        </h1>
        <p className="text-sm text-slate-400 mt-1">Phát hiện các hành vi nâng giá đột biến, đầu cơ vé và lừa đảo</p>
      </div>

      <div className="bg-navy-850 p-6 rounded-3xl border border-navy-750 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-navy-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-3">Mã Niêm Yết</th>
              <th className="p-3">Sự Kiện</th>
              <th className="p-3">Người Bán</th>
              <th className="p-3">Độ Lệch Giá</th>
              <th className="p-3">Lý Do Cờ Báo</th>
              <th className="p-3">Mức Rủi Ro</th>
              <th className="p-3">Thao Tác Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {MOCK_SUSPICIOUS_LISTINGS.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-mono text-cyan-400 font-bold">{item.listingId}</td>
                <td className="p-3 font-bold text-white max-w-[200px] truncate">{item.eventTitle}</td>
                <td className="p-3">{item.sellerName}</td>
                <td className="p-3 font-extrabold text-red-400">+{item.priceDeltaPercentage}%</td>
                <td className="p-3 text-slate-300 max-w-[250px]">{item.flagReason}</td>
                <td className="p-3"><RiskBadge score={item.riskScore} /></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="bg-red-500 hover:bg-red-400 text-white px-2.5 py-1 rounded text-xs font-bold shadow-glow-red">
                      Tạm Đình Chỉ
                    </button>
                    <button className="bg-navy-800 hover:bg-navy-750 text-slate-300 px-2.5 py-1 rounded text-xs font-bold border border-navy-700">
                      Duyệt Hợp Lệ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
