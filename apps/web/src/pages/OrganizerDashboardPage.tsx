import React, { useState } from 'react';
import { organizerApi, WebhookLog } from '@ticketshield/api-client';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { formatVietnameseDate } from '../utils/formatters';
import { ShieldCheck, Key, Webhook, Ticket, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../stores/uiStore';

export const OrganizerDashboardPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('ts_live_pk_994810294810294');
  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: 'wh-101',
      eventType: 'OWNERSHIP_TRANSFERRED',
      payload: '{"ticketId":"tkt-102","newOwnerId":"usr-buyer-01"}',
      responseCode: 200,
      timestamp: new Date().toISOString(),
    },
  ]);
  const { showToast } = useUIStore();

  const handleRegenerateKey = async () => {
    const res = await organizerApi.regenerateApiKey();
    setApiKey(res.apiKey);
    showToast('Đã cấp lại API Key tích hợp mới!', 'success');
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-navy-850 p-6 rounded-3xl border border-navy-750">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <VerifiedBadge text="Đơn Vị Tổ Chức Chính Thức" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Cổng Đối Tác Ban Tổ Chức (Organizer Portal)</h1>
          <p className="text-xs text-slate-400 mt-1">CT Wave Entertainment • Mã doanh nghiệp: 01099887766</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" /> API TicketShield Connected
        </div>
      </div>

      {/* API Key & Webhook Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" /> Tích Hợp API Chuyển Quyền Sở Hữu (Ownership Transfer API)
          </h3>

          <div className="space-y-2 text-xs">
            <label className="text-slate-400 block">Live Production API Key:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono"
              />
              <Button onClick={handleRegenerateKey} size="sm" variant="outline">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-cyan-400" /> Webhook Cập Nhật Trạng Thái Vé
          </h3>
          <div className="space-y-2 text-xs">
            <label className="text-slate-400 block">Webhook Endpoint URL:</label>
            <input
              type="text"
              readOnly
              value="https://api.ctwave.vn/webhooks/ticketshield"
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Webhook Activity Logs */}
      <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
        <h3 className="text-sm font-bold text-white">Nhật Ký Webhook & Tra Cứu Vé Real-time</h3>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-navy-900 p-3 rounded-xl border border-navy-800 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-400 block">{log.eventType}</span>
                <span className="font-mono text-slate-400 text-[11px]">{log.payload}</span>
              </div>
              <div className="text-right">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                  HTTP {log.responseCode} OK
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">{formatVietnameseDate(log.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
