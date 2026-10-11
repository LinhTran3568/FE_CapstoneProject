import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Users,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Minus,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  UserCheck,
  Info
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Real permission matrix across actual application features
  const permissionsMatrix = [
    {
      feature: 'Cấu hình Biểu Phí Sàn (Fee Settings)',
      description: 'Điều chỉnh tỷ lệ % phí dịch vụ người mua & người bán',
      admin: true,
      moderator: false,
      organizer: false,
      user: false,
    },
    {
      feature: 'Thời gian Đệm Ký Quỹ & Cutoff (Escrow Buffer)',
      description: 'Quy định cửa sổ giữ tiền an toàn và ranh giới ngừng bán lại',
      admin: true,
      moderator: false,
      organizer: false,
      user: false,
    },
    {
      feature: 'Trần Giá Bán Lại Sự Kiện (Price Ceiling Cap)',
      description: 'Khóa biên độ giá trần vé sang nhượng chống đầu cơ phe vé',
      admin: true,
      moderator: false,
      organizer: false,
      user: false,
    },
    {
      feature: 'Dispute Resolution Console (1-Click Verdict)',
      description: 'Xem hồ sơ chứng cứ, duyệt hoàn tiền hoặc bác bỏ khiếu nại',
      admin: true,
      moderator: true,
      organizer: false,
      user: false,
    },
    {
      feature: 'Đối soát Log cổng soát vé BTC & Blockchain Hash',
      description: 'Kiểm tra nhật ký quét mã vé tại cổng thực tế của ban tổ chức',
      admin: true,
      moderator: true,
      organizer: false,
      user: false,
    },
    {
      feature: 'Thị Trường Mua Bán Vé (Marketplace Operations)',
      description: 'Xem niêm yết vé công khai, mua vé và theo dõi ví cá nhân',
      admin: true,
      moderator: true,
      organizer: true,
      user: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Tài Khoản & Phân Quyền Quản Trị
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Ma trận kiểm soát quyền truy cập dựa trên vai trò (RBAC) và thông tin phiên vận hành
          </p>
        </div>
      </div>

      {/* ── Active Session Profile Card (Compact & Restrained) ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F45135] to-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#101722]">{user?.fullName || 'Administrator'}</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#101722] text-white">
                ROLE: {String(user?.role || 'ADMIN').toUpperCase()}
              </span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Session
              </span>
            </div>
            <p className="text-xs text-[#667085] font-mono mt-0.5">{user?.email || 'admin@ticketshield.vn'}</p>
          </div>
        </div>

        {/* Secondary Security & Metadata details */}
        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs text-[#667085] pt-2 md:pt-0 border-t md:border-t-0 border-[#E5EAF0] w-full md:w-auto">
          {/* Authentic Account Verification Status (from BE) */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tài khoản: <strong className="text-emerald-700">{user?.isVerified ? 'Đã xác thực' : 'Hoạt động'}</strong></span>
          </div>

          {/* Identifier UUID with copy button */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>UUID:</span>
            <span className="bg-slate-100 text-[#101722] px-1.5 py-0.5 rounded">
              {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : '—'}
            </span>
            {user?.id && (
              <button
                type="button"
                onClick={handleCopyId}
                title="Sao chép toàn bộ UUID tài khoản"
                className="text-[#667085] hover:text-[#101722] p-1 rounded transition-colors"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Role-Based Access Control (RBAC) Permissions Matrix ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-3.5 bg-[#F4F6F9] border-b border-[#E5EAF0] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
              Ma Trận Quyền Hạn Thực Tế (RBAC Permission Matrix)
            </h3>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Phân quyền áp dụng theo chính sách bảo mật máy chủ backend (Claim-based Authorization)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] text-[#667085] border-b border-[#E5EAF0] text-[10px] font-mono font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 min-w-[260px]">Chức Năng Phân Hệ</th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">
                  <span className="text-rose-600">Super Admin</span>
                </th>
                <th className="py-2.5 px-4 text-center min-w-[140px]">
                  <span className="text-amber-600">Moderator / CSKH</span>
                </th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">
                  <span className="text-blue-600">Ban Tổ Chức</span>
                </th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">
                  <span className="text-slate-600">Người Dùng</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-xs text-[#101722]">{item.feature}</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">{item.description}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.admin ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                        <span className="font-mono">Toàn quyền</span>
                      </span>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 inline" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.moderator ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                        <span className="font-mono">Cho phép</span>
                      </span>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 inline" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.organizer ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 inline" />
                        <span className="font-mono">Cho phép</span>
                      </span>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 inline" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.user ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-slate-500 inline" />
                        <span className="font-mono">Cho phép</span>
                      </span>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Identity & Access Guidance Notice ── */}
      <div className="p-3.5 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#667085] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#F45135] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#101722]">Cơ chế xác thực & Phân quyền Identity Service</p>
          <p className="text-[11px] leading-relaxed">
            Phân quyền hệ thống được thực thi nghiêm ngặt tại Backend qua JWT Token Claims (<code>Role=Admin</code>, <code>Role=Moderator</code>, <code>Role=Organizer</code>). Mọi truy cập trái thẩm quyền đều bị chặn tại API Gateway với mã <code>403 Forbidden</code>.
          </p>
          <p className="text-[11px] text-slate-500 italic">
            * Lưu ý: Phiên bản Identity v1.0 hiện quản lý phiên làm việc & phân quyền tài khoản đăng nhập. Endpoint quản trị danh sách người dùng (User Management CRUD) sẽ được tích hợp khi Identity Service mở rộng endpoint quản lý tập trung.
          </p>
        </div>
      </div>
    </div>
  );
};
