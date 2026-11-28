import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { authApi } from '@ticketshield/api-client';
import { isAdminRole } from '../utils/staffRole';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  Calendar,
  Lock,
  BadgeCheck,
  KeyRound,
  FileText
} from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { showToast } = useUIStore();

  const isAdmin = user ? isAdminRole(user.role) : false;

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await authApi.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      setUser({
        ...user!,
        fullName: updatedUser.fullName || fullName.trim(),
        phoneNumber: updatedUser.phoneNumber || phoneNumber.trim(),
      });

      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title: Clean, No Subtext */}
      <div className="border-b border-[#E5EAF0] pb-4">
        <h1 className="text-xl font-bold text-[#101722] tracking-tight">
          Profile & Account
        </h1>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F45135] to-amber-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-[#F45135]/20 shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#101722]">{user?.fullName || 'Staff Member'}</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {isAdmin ? 'Super Administrator' : 'Staff Moderator'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[#667085] font-mono mt-1">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-[#F45135]" />
              <h2 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Personal Details
              </h2>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name..."
                    className="w-full bg-slate-50 border border-[#E5EAF0] rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-[#101722] placeholder-slate-400 focus:outline-none focus:border-[#F45135] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Email <span className="text-slate-400">(Read-only)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-100/70 border border-[#E5EAF0] rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for critical system notifications and role-based access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +84 908 888 888"
                    className="w-full bg-slate-50 border border-[#E5EAF0] rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-[#101722] placeholder-slate-400 focus:outline-none focus:border-[#F45135] focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F45135] hover:bg-[#e03d22] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#F45135]/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Permissions & Scope */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Permissions & Roles
              </h2>
            </div>

            <p className="text-xs text-[#667085] leading-relaxed">
              Operational privileges granted to{' '}
              <strong>{isAdmin ? 'Super Admin' : 'Staff Moderator'}</strong> on TicketShield:
            </p>

            <div className="space-y-2.5">
              {isAdmin ? (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Full control over fee schedules, buffers & price ceilings</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">User, staff, and organizer partner management</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Escrow settlement & platform revenue observability</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Executive dispute adjudication authority</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Receive and investigate buyer dispute dossiers</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Inspect organizer gate check-in telemetry</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Execute 1-Click resolution: Refund or Release Escrow</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
