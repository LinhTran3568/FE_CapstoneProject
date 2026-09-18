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
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  React.useEffect(() => {
    if (initialEmail) {
      setValue('email', initialEmail);
    }
  }, [initialEmail, setValue]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const currentEmail = watch('email');

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const msg = await authApi.resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      showToast(msg || 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast('Đặt lại mật khẩu thất bại: ' + (err.message || 'Đã xảy ra lỗi'), 'error');
    }
  };

  const handleResendOtp = async () => {
    if (!currentEmail || !/^\S+@\S+\.\S+$/.test(currentEmail)) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ để gửi lại mã OTP.', 'error');
      return;
    }
    try {
      setIsResending(true);
      const msg = await authApi.forgotPassword(currentEmail);
      showToast(msg || 'Mã OTP mới đã được gửi tới email của bạn.', 'success');
      setResendCooldown(60);
    } catch (err: any) {
      showToast('Gửi lại mã OTP thất bại: ' + (err.message || 'Đã xảy ra lỗi'), 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#05070A] text-[#F5F5F2] font-sans">
      {/* Left Column Showcase */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden flex-col justify-between p-12 bg-[#05070A]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing/electronic.jpg"
            alt="Concert Stage Atmosphere"
            className="w-full h-full object-cover filter brightness-[0.5] contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#05070A]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5A36] shadow-[0_0_10px_#FF5A36]" />
            <span className="font-display font-bold text-2xl tracking-tight text-[#F5F5F2]">
              TicketShield
            </span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#A3A8B3] hover:text-[#F5F5F2] uppercase font-display transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-xl my-auto">
          <span className="px-3.5 py-1 bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF5A36] text-xs font-bold uppercase tracking-widest rounded-full font-display inline-block">
            Final Step
          </span>
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold uppercase leading-[0.95] tracking-tight">
            Confirm New <br />
            <span className="text-[#FF5A36]">Password.</span>
          </h1>
          <p className="text-[#A3A8B3] text-base leading-relaxed">
            Enter the 6-digit verification code sent to your email and specify your new secure password.
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-[#A3A8B3] font-display">
          <span>Cryptographically Secured Account Reset</span>
        </div>
      </div>

      {/* Right Column Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 bg-[#0A0D12] relative border-l border-white/10 overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5A36]" />
            <span className="font-display font-bold text-xl text-[#F5F5F2]">TicketShield</span>
          </Link>
          <Link to="/login" className="text-xs text-[#A3A8B3] font-display uppercase tracking-widest">
            Login
          </Link>
        </div>

        <div className="my-auto max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              Reset Password
            </h2>
            <p className="text-xs text-[#A3A8B3]">
              Enter the 6-digit OTP code and set your new password
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F5F2] focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending || resendCooldown > 0}
                  className="text-xs text-[#FF5A36] hover:underline font-medium font-display disabled:opacity-50 disabled:no-underline transition-colors"
                >
                  {isResending
                    ? 'Đang gửi...'
                    : resendCooldown > 0
                    ? `Gửi lại sau (${resendCooldown}s)`
                    : 'Gửi lại mã OTP'}
                </button>
              </div>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  {...register('otp')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F5F2] tracking-widest font-mono text-center focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.otp && <p className="text-xs text-red-400 mt-1">{errors.otp.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('newPassword')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F5F2] focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F5F2] focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full font-display font-bold uppercase tracking-widest bg-[#FF5A36] hover:bg-[#FF7252] text-white py-3 rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all mt-2"
            >
              Reset Password
            </Button>
          </form>

          <p className="text-center text-xs text-[#A3A8B3]">
            Remember your password?{' '}
            <Link to="/login" className="text-[#FF5A36] hover:underline font-bold font-display ml-1">
              Back to Sign In
            </Link>
          </p>
        </div>

        <div className="pt-6 text-center lg:text-left text-[11px] text-[#A3A8B3] font-mono">
          © 2026 TicketShield Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};
