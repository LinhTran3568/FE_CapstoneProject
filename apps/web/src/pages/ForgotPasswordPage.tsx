import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const msg = await authApi.forgotPassword(data.email);
      showToast(msg || 'A 6-digit OTP verification code has been sent to your email!', 'success');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      showToast('Request failed: ' + err.message, 'error');
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
            Account Recovery
          </span>
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold uppercase leading-[0.95] tracking-tight">
            Reset Your <br />
            <span className="text-[#FF5A36]">Password.</span>
          </h1>
          <p className="text-[#A3A8B3] text-base leading-relaxed">
            Enter your registered email address and we'll send you a 6-digit verification code to reset your account password safely.
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-[#A3A8B3] font-display">
          <span>100% Secure Account Verification</span>
        </div>
      </div>

      {/* Right Column Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 bg-[#0A0D12] relative border-l border-white/10">
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5A36]" />
            <span className="font-display font-bold text-xl text-[#F5F5F2]">TicketShield</span>
          </Link>
          <Link to="/login" className="text-xs text-[#A3A8B3] font-display uppercase tracking-widest">
            Login
          </Link>
        </div>

        <div className="my-auto max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              Forgot Password
            </h2>
            <p className="text-sm text-[#A3A8B3]">
              Enter your email to receive a 6-digit OTP verification code
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-2 font-display">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full font-display font-bold uppercase tracking-widest bg-[#FF5A36] hover:bg-[#FF7252] text-white py-3.5 rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all"
            >
              Send OTP Code
            </Button>
          </form>

          <p className="text-center text-xs text-[#A3A8B3]">
            Remember your password?{' '}
            <Link to="/login" className="text-[#FF5A36] hover:underline font-bold font-display ml-1">
              Back to Sign In
            </Link>
          </p>
        </div>

        <div className="pt-8 text-center lg:text-left text-[11px] text-[#A3A8B3] font-mono">
          © 2026 TicketShield Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};
