import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi, AdminUserDto } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Filter,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  X,
  UserCheck,
  UserX,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

export interface DisplayUserRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'ADMIN' | 'MODERATOR' | 'ORGANIZER' | 'USER';
  roleLabel: string;
  isActive: boolean;
  isVerified: boolean;
  trustScore: number;
  bankInfo?: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentAuthUser } = useAuthStore();
  const { showToast } = useUIStore();

  const [users, setUsers] = useState<DisplayUserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<DisplayUserRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ánh xạ role từ backend sang định dạng hiển thị
  const mapRole = (roleStr: string): { role: DisplayUserRecord['role']; roleLabel: string } => {
    const upper = (roleStr || '').toUpperCase();
    if (upper === 'ADMIN' || upper === '3') {
      return { role: 'ADMIN', roleLabel: 'Super Admin' };
    }
    if (upper === 'MODERATOR' || upper === 'CSKH' || upper === '4') {
      return { role: 'MODERATOR', roleLabel: 'Kiểm Duyệt Viên / CSKH' };
    }
    if (upper === 'ORGANIZER' || upper === '2') {
      return { role: 'ORGANIZER', roleLabel: 'Ban Tổ Chức (Organizer)' };
    }
    return { role: 'USER', roleLabel: 'Người Dùng (Trader)' };
  };

  // Tải danh sách người dùng từ API Backend
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      if (Array.isArray(data)) {
        const mappedList: DisplayUserRecord[] = data.map((dto: AdminUserDto) => {
          const { role, roleLabel } = mapRole(dto.role);
          return {
            id: dto.id,
            fullName: dto.fullName || 'Người dùng hệ thống',
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            role,
            roleLabel,
            isActive: dto.isActive,
            isVerified: dto.isKycVerified ?? false,
            trustScore: dto.trustScore ?? 100,
            bankInfo: dto.bankCode
              ? {
                  bankCode: dto.bankCode,
                  accountNumber: dto.bankAccountNumber || '—',
                  accountName: dto.accountHolderName || dto.fullName,
                }
              : undefined,
            createdAt: dto.createdAt || new Date().toISOString(),
          };
        });

        // Đảm bảo phiên đăng nhập hiện tại luôn có mặt nếu chưa có
        if (currentAuthUser?.id && !mappedList.some((u) => u.id === currentAuthUser.id)) {
          mappedList.unshift({
            id: currentAuthUser.id,
            fullName: currentAuthUser.fullName || 'Administrator',
            email: currentAuthUser.email || 'admin@ticketshield.vn',
            phoneNumber: currentAuthUser.phoneNumber || '0909999999',
            role: 'ADMIN',
            roleLabel: 'Super Admin',
            isActive: true,
            isVerified: true,
            trustScore: 100,
            createdAt: new Date().toISOString(),
          });
        }

        setUsers(mappedList);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.warn('Lỗi tải danh sách người dùng từ BE:', err);
      setError(err?.message || 'Không thể đồng bộ danh sách tài khoản từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [currentAuthUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast('Đã sao chép UUID tài khoản', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuspend = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetId === currentAuthUser?.id) {
      showToast('Không thể khóa tài khoản đang trong phiên làm việc hiện tại!', 'error');
      return;
    }

    const confirmed = window.confirm(
      'CẢNH BÁO (SCRUM-220): Bạn có chắc chắn muốn khóa vĩnh viễn tài khoản người dùng này không?\n\nHành động này sẽ hạ điểm uy tín TrustScore về 0 và lập tức thu hồi toàn bộ phiên đăng nhập.'
    );
    if (!confirmed) return;

    setActionLoadingId(targetId);
    try {
      await adminApi.suspendUser(targetId);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isActive: false, trustScore: 0 } : u))
      );
      if (selectedUser?.id === targetId) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: false, trustScore: 0 } : null));
      }
      showToast('Đã khóa vĩnh viễn tài khoản người dùng thành công (SCRUM-220)!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể khóa tài khoản người dùng.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered & searched users
  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      // Role filter
      if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.isActive) return false;
      if (statusFilter === 'INACTIVE' && item.isActive) return false;
      if (statusFilter === 'VERIFIED' && !item.isVerified) return false;
      if (statusFilter === 'UNVERIFIED' && item.isVerified) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchPhone = item.phoneNumber?.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchId;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'ADMIN' || u.role === 'MODERATOR').length,
      organizers: users.filter((u) => u.role === 'ORGANIZER').length,
      users: users.filter((u) => u.role === 'USER').length,
    };
  }, [users]);

  const getRoleBadge = (role: DisplayUserRecord['role']) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#101722] text-white">
            <Shield className="w-3 h-3 text-[#F45135]" />
            SUPER ADMIN
          </span>
        );
      case 'MODERATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            CSKH / MODERATOR
          </span>
        );
      case 'ORGANIZER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" />
            BAN TỔ CHỨC
          </span>
        );
      case 'USER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Users className="w-3 h-3 text-slate-500" />
            NGƯỜI DÙNG
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight flex items-center gap-2">
            <span>Danh Sách Tài Khoản Người Dùng</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {filteredUsers.length} tài khoản
            </span>
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Dữ liệu tài khoản thời gian thực từ cơ sở dữ liệu TicketShield Identity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#667085] ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* ── Metric Summary Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider font-mono">
            Tổng Tài Khoản
          </div>
          <div className="text-2xl font-black text-[#101722] mt-1 font-mono tracking-tight">
            {stats.total}
          </div>
          <div className="text-[11px] text-[#667085] mt-1">Hồ sơ người dùng thực tế</div>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider font-mono">
            Quản Trị & Nhân Sự
          </div>
          <div className="text-2xl font-black text-[#F45135] mt-1 font-mono tracking-tight">
            {stats.admins}
          </div>
          <div className="text-[11px] text-[#667085] mt-1">Super Admin & CSKH</div>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider font-mono">
            Đối Tác Ban Tổ Chức
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono tracking-tight">
            {stats.organizers}
          </div>
          <div className="text-[11px] text-[#667085] mt-1">Doanh nghiệp soát vé</div>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider font-mono">
            Người Dùng Giao Dịch
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono tracking-tight">
            {stats.users}
          </div>
          <div className="text-[11px] text-[#667085] mt-1">Người mua & người bán</div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại hoặc mã UUID..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F45135] focus:bg-white text-[#101722] placeholder:text-[#667085]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role & Status Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Vai trò:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-[#E5EAF0] rounded-lg px-2.5 py-1.5 text-[#101722] focus:outline-none focus:ring-1 focus:ring-[#F45135] cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Super Admin</option>
            <option value="MODERATOR">CSKH / Moderator</option>
            <option value="ORGANIZER">Ban Tổ Chức</option>
            <option value="USER">Người Dùng (Trader)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-[#E5EAF0] rounded-lg px-2.5 py-1.5 text-[#101722] focus:outline-none focus:ring-1 focus:ring-[#F45135] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa vĩnh viễn (SCRUM-220)</option>
            <option value="VERIFIED">Đã xác thực KYC (CCCD)</option>
            <option value="UNVERIFIED">Chưa xác thực KYC</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner if any ── */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 font-bold text-amber-900 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── User Accounts Table ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] text-[#667085] border-b border-[#E5EAF0] text-[10px] font-mono font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[240px]">Họ Tên & Email</th>
                <th className="py-3 px-4 min-w-[140px]">Vai Trò Phân Hệ</th>
                <th className="py-3 px-4 min-w-[150px]">Số Điện Thoại / UUID</th>
                <th className="py-3 px-4 min-w-[170px]">Tài Khoản Ngân Hàng</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Trạng Thái</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#667085]">
                    <Loader2 className="w-7 h-7 text-[#F45135] animate-spin mx-auto mb-2" />
                    <span className="text-xs font-mono">Đang tải danh sách tài khoản từ máy chủ...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#101722]">Không tìm thấy tài khoản phù hợp</p>
                    <p className="text-xs text-[#667085] mt-0.5">Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const isCurrentAuth = userItem.id === currentAuthUser?.id;
                  const isUpdatingThis = actionLoadingId === userItem.id;

                  return (
                    <tr
                      key={userItem.id}
                      onClick={() => setSelectedUser(userItem)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#101722] to-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {userItem.fullName ? userItem.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-[#101722]">{userItem.fullName}</span>
                              {userItem.isVerified && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  title="Đã xác thực định danh KYC / CCCD"
                                >
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                  KYC
                                </span>
                              )}
                              {isCurrentAuth && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F45135]/10 text-[#F45135] border border-[#F45135]/20">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{userItem.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <div>
                          {getRoleBadge(userItem.role)}
                          <div className="text-[10px] text-[#667085] mt-1 font-medium">
                            {userItem.roleLabel}
                          </div>
                        </div>
                      </td>

                      {/* Phone & UUID */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-[#101722] font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{userItem.phoneNumber || '—'}</span>
                          </div>
                          <div className="text-[10px] text-[#667085] font-mono flex items-center gap-1">
                            <span>ID: {userItem.id.slice(0, 8)}...{userItem.id.slice(-4)}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(userItem.id, e)}
                              title="Sao chép UUID"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedId === userItem.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Bank Info */}
                      <td className="py-3 px-4">
                        {userItem.bankInfo ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-[#F45135]" />
                              <span className="font-mono font-bold text-xs text-[#101722]">
                                {userItem.bankInfo.bankCode} · {userItem.bankInfo.accountNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#667085] uppercase truncate max-w-[160px]">
                              {userItem.bankInfo.accountName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chưa thiết lập ví</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {userItem.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <UserX className="w-3 h-3 text-rose-600" />
                            Đã khóa vĩnh viễn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(userItem)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#101722] hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết tài khoản"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {userItem.isActive ? (
                            <button
                              type="button"
                              onClick={(e) => handleSuspend(userItem.id, e)}
                              disabled={isCurrentAuth || isUpdatingThis}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isCurrentAuth
                                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isCurrentAuth ? 'Tài khoản của bạn' : 'Khóa vĩnh viễn tài khoản (SCRUM-220)'}
                            >
                              {isUpdatingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg text-rose-300 cursor-not-allowed inline-flex"
                              title="Tài khoản đã bị khóa vĩnh viễn (SCRUM-220)"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-[#F4F6F9] border-b border-[#E5EAF0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#101722] text-white flex items-center justify-center font-bold text-sm">
                  {selectedUser.fullName ? selectedUser.fullName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#101722]">{selectedUser.fullName}</h3>
                  <p className="text-[11px] text-[#667085] font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Role & Verification Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF0]">
                <div>
                  <div className="text-[10px] text-[#667085] uppercase font-mono font-bold">Vai Trò Hệ Thống</div>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#667085] uppercase font-mono font-bold">Điểm Uy Tín TrustScore</div>
                  <div className="mt-1">
                    <span className={`font-mono font-bold text-xs ${selectedUser.trustScore >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedUser.trustScore} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF0]">
                  <div className="text-[10px] text-[#667085] font-mono font-semibold">Số điện thoại</div>
                  <div className="font-mono font-bold text-[#101722] mt-0.5">
                    {selectedUser.phoneNumber || '—'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF0]">
                  <div className="text-[10px] text-[#667085] font-mono font-semibold">Trạng thái KYC (CCCD)</div>
                  <div className="mt-0.5">
                    {selectedUser.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã xác thực CCCD
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa xác thực</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF0] col-span-2">
                  <div className="text-[10px] text-[#667085] font-mono font-semibold">Ngày đăng ký tài khoản</div>
                  <div className="font-mono text-[#101722] mt-0.5 font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-[#E5EAF0] space-y-2">
                <div className="text-[10px] font-mono font-bold text-[#101722] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#F45135]" />
                  <span>Tài Khoản Thụ Hưởng Giải Ngân Escrow</span>
                </div>
                {selectedUser.bankInfo ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Ngân hàng:</span>
                      <strong className="font-mono text-[#101722]">{selectedUser.bankInfo.bankCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Số tài khoản:</span>
                      <strong className="font-mono text-[#101722]">{selectedUser.bankInfo.accountNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Chủ tài khoản:</span>
                      <strong className="text-[#101722]">{selectedUser.bankInfo.accountName}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[11px]">
                    Người dùng chưa liên kết số tài khoản ngân hàng nhận tiền thanh toán.
                  </div>
                )}
              </div>

              {/* UUID */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF0] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#667085] font-mono">User UUID (Identity Primary Key)</div>
                  <div className="font-mono text-[11px] text-[#101722] select-all mt-0.5">
                    {selectedUser.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopyId(selectedUser.id, e)}
                  className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#667085] hover:text-[#101722]"
                >
                  {copiedId === selectedUser.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#F4F6F9] border-t border-[#E5EAF0] flex items-center justify-between gap-2">
              <div>
                {!selectedUser.isActive && (
                  <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5" /> Đã khóa vĩnh viễn (SCRUM-220)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedUser.isActive && selectedUser.id !== currentAuthUser?.id && (
                  <button
                    type="button"
                    onClick={(e) => handleSuspend(selectedUser.id, e)}
                    disabled={actionLoadingId === selectedUser.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    {actionLoadingId === selectedUser.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserX className="w-3.5 h-3.5" />
                    )}
                    Khóa vĩnh viễn (SCRUM-220)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
