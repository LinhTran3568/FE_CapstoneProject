import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TicketShieldLogo } from '../components/ui/TicketShieldLogo';

export const RegisterPage: React.FC = () => {
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'BUYER',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await authApi.register(data);
      login(res.user, res.token);
      showToast('Account registered successfully!', 'success');
      navigate('/');
    } catch (err: any) {
      showToast('Registration failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#05070A] text-[#F5F5F2] font-sans">
      {/* Left Column: Dramatic Concert Photo Showcase (7 cols) */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden flex-col justify-between p-12 bg-[#05070A]">
        {/* Background Concert Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing/featured-1.jpg"
            alt="Coldplay Concert Spectacle"
            className="w-full h-full object-cover filter brightness-[0.6] contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#05070A]" />
        </div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <TicketShieldLogo size="lg" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#A3A8B3] hover:text-[#F5F5F2] uppercase font-display transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Website</span>
          </Link>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 max-w-xl my-auto">
          <span className="px-3.5 py-1 bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF5A36] text-xs font-bold uppercase tracking-widest rounded-full font-display inline-block">
            Join 50,000+ Fans
          </span>
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold uppercase leading-[0.95] tracking-tight">
            Join The <br />
            <span className="text-[#FF5A36]">Movement.</span>
          </h1>
          <p className="text-[#A3A8B3] text-base leading-relaxed">
            Create your account to browse, buy, and securely transfer verified live concert and sports tickets.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#A3A8B3] font-display">
          <span>Instant Mobile Ticket Delivery</span>
          <span className="text-[#F5F5F2] font-semibold">Zero Fraud Guarantee</span>
        </div>
      </div>

      {/* Right Column: Dark Registration Form (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 bg-[#0A0D12] relative border-l border-white/10 overflow-y-auto">
        {/* Mobile Header Link */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5A36]" />
            <span className="font-display font-bold text-xl text-[#F5F5F2]">TicketShield</span>
          </Link>
          <Link to="/" className="text-xs text-[#A3A8B3] font-display uppercase tracking-widest">
            Home
          </Link>
        </div>

        <div className="my-auto max-w-md w-full mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-[#A3A8B3]">
              Fill in your details to get started with TicketShield
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                {...register('fullName')}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
              {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="0901234567"
                {...register('phoneNumber')}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-400 mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-1 font-display">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#A3A8B3] cursor-pointer pt-1">
              <input
                type="checkbox"
                {...register('acceptTerms')}
                className="rounded border-white/20 bg-[#05070A] text-[#FF5A36] focus:ring-0"
              />
              <span>I agree to the Terms of Service and Privacy Policy</span>
            </label>
            {errors.acceptTerms && <p className="text-xs text-red-400">{errors.acceptTerms.message}</p>}

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full font-display font-bold uppercase tracking-widest bg-[#FF5A36] hover:bg-[#FF7252] text-white py-3 rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all mt-2"
            >
              Create Account
            </Button>
          </form>

          {/* Redirect Link */}
          <p className="text-center text-xs text-[#A3A8B3]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF5A36] hover:underline font-bold font-display ml-1">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 text-center lg:text-left text-[11px] text-[#A3A8B3] font-mono">
          © 2026 TicketShield Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};
