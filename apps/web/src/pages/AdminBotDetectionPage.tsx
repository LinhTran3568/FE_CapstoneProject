import React from 'react';
import { MOCK_BOT_SESSIONS } from '@ticketshield/api-client';
import { BotDecisionBadge } from '../components/ui/BotDecisionBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { formatVietnameseDate } from '../utils/formatters';
import { Bot, ShieldCheck } from 'lucide-react';

export const AdminBotDetectionPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" /> Giám Sát Chi Tiết AI Bot Detection Sessions
        </h1>
        <p className="text-sm text-slate-400 mt-1">Phân tích tần suất request, IP reputation, entropy hành vi chuột & thiết bị</p>
      </div>

      <div className="bg-navy-850 p-6 rounded-3xl border border-navy-750 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-navy-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-3">Session ID</th>
              <th className="p-3">Địa chỉ IP & Vị trí</th>
              <th className="p-3">Fingerprint Thiết bị</th>
              <th className="p-3">Tốc độ Request</th>
              <th className="p-3">Điểm Rủi Ro</th>
              <th className="p-3">Quyết Định AI</th>
              <th className="p-3">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {MOCK_BOT_SESSIONS.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-mono text-cyan-400 font-bold">{s.id}</td>
                <td className="p-3">
                  <span className="font-bold text-white block">{s.ipAddress}</span>
                  <span className="text-slate-400 text-[11px]">{s.country}</span>
                </td>
                <td className="p-3 font-mono text-[11px] text-slate-400">{s.deviceFingerprint}</td>
                <td className="p-3 font-bold text-slate-200">{s.requestsPerMinute} req/min</td>
                <td className="p-3"><RiskBadge score={s.riskScore} /></td>
                <td className="p-3"><BotDecisionBadge decision={s.decision} /></td>
                <td className="p-3 text-[11px] text-slate-400">{formatVietnameseDate(s.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
