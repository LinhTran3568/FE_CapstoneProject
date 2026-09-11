import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const msg = await authApi.resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      showToast(msg || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast('Đặt lại mật khẩu thất bại: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-navy-850 p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đặt Lai Mật Khẩu</h1>
          <p className="text-xs text-slate-400">
            Nhập mã OTP 6 chữ số đã được gửi qua Email và thiết lập mật khẩu mới
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mã OTP (6 chữ số)</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                {...register('otp')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white tracking-widest font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
            {errors.otp && <p className="text-xs text-red-400 mt-1">{errors.otp.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('newPassword')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full font-bold shadow-glow-cyan">
            Xác Nhận Đổi Mật Khẩu
          </Button>
        </form>

        <div className="pt-2 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
