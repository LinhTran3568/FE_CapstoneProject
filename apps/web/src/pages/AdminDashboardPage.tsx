import React from 'react';
import { useAdminDashboardData } from '../hooks/useAdminMetrics';
import { MetricCard } from '../components/admin/MetricCard';
import { BotDecisionChart } from '../components/admin/BotDecisionChart';
import { RiskDistributionChart } from '../components/admin/RiskDistributionChart';
import { formatVND, formatVietnameseDate } from '../utils/formatters';
import { ShieldAlert, Bot, Cpu, Lock, AlertTriangle, Activity, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { metrics, botSessions, suspiciousListings, auditLogs, isLoading } = useAdminDashboardData();

  if (isLoading || !metrics) {
    return <div className="p-12 text-center text-slate-400">Đang tải dữ liệu giám sát Admin...</div>;
  }

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-navy-750 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" /> Bảng Giám Sát An Ninh System Administrator
          </h1>
          <p className="text-xs text-slate-400 mt-1">Giám sát Bot AI real-time, giao dịch Escrow & phát hiện vé phe vé đầu cơ</p>
        </div>

        <div className="flex gap-3">
          <Link to="/admin/bot-detection">
            <button className="bg-navy-800 hover:bg-navy-750 text-cyan-400 border border-navy-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Nhật Ký AI Bot Sessions
            </button>
          </Link>
          <Link to="/admin/resale-monitoring">
            <button className="bg-navy-800 hover:bg-navy-750 text-amber-400 border border-navy-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Niêm Yết Nghi Vấn
            </button>
          </Link>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tổng Thể Tích Khóa Tiền Escrow"
          value={formatVND(metrics.totalEscrowVolumeVnd)}
          subtitle="Tự động giải ngân sau check-in"
          icon={<Lock className="w-5 h-5" />}
          color="cyan"
        />
        <MetricCard
          title="Phiên Làm Việc AI Giám Sát"
          value={metrics.botSessionsCount.toLocaleString()}
          subtitle={`Blocked: ${metrics.blockedSessionsCount} | Throttled: ${metrics.throttledSessionsCount}`}
          icon={<Bot className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard
          title="Độ Chính Xác AI Classification"
          value={`${metrics.detectionAccuracy}%`}
          subtitle={`False Positive Rate: ${metrics.falsePositiveRate}%`}
          icon={<Cpu className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          title="Niêm Yết Nghi Vấn Scalping"
          value={metrics.suspiciousListingsCount}
          subtitle={`Khiếu nại chưa giải quyết: ${metrics.openDisputesCount}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Quyết Định AI Bot Detection Theo Thời Gian
            </h3>
            <span className="text-xs text-slate-400">ALLOWED vs THROTTLED vs BLOCKED</span>
          </div>
          <BotDecisionChart />
        </div>

        <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <h3 className="text-sm font-bold text-white">Phân Phối Điểm Phân Loại Rủi Ro AI</h3>
          <RiskDistributionChart />
        </div>
      </div>

      {/* Tables Row: Suspicious Listings & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suspicious Listings Table */}
        <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Niêm Yết Nghi Vấn Scalping Cần Xử Lý
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Sự kiện</th>
                  <th className="p-2.5">Người bán</th>
                  <th className="p-2.5">Độ lệch giá</th>
                  <th className="p-2.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {suspiciousListings.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2.5 font-semibold text-white truncate max-w-[150px]">{item.eventTitle}</td>
                    <td className="p-2.5">{item.sellerName}</td>
                    <td className="p-2.5 font-bold text-red-400">+{item.priceDeltaPercentage}%</td>
                    <td className="p-2.5">
                      <button className="bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white px-2 py-1 rounded text-[11px] font-bold">
                        Khóa Niêm Yết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Nhật Ký Thao Tác Hệ Thống (Audit Logs)
          </h3>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-navy-900 p-3 rounded-xl border border-navy-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <strong className="text-cyan-400">{log.actorName} ({log.actorRole})</strong>
                  <span>{formatVietnameseDate(log.timestamp)}</span>
                </div>
                <p className="text-slate-200 font-medium">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
