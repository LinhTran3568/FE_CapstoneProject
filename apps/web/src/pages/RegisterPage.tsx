import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TicketShieldLogo } from '../components/ui/TicketShieldLogo';

export const RegisterPage: React.FC = () => {
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/marketplace';

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
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast('Registration failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#05070A] text-[#F5F5F2] font-sans overflow-hidden">
      {/* Inline Keyframes */}
      <style>{`
        @keyframes festivalPulse {
          0% { transform: scale(1.03) translate(0px, 0px); filter: brightness(0.75) contrast(1.25); }
          25% { transform: scale(1.1) translate(-18px, -12px); filter: brightness(0.95) contrast(1.4); }
          50% { transform: scale(1.16) translate(12px, -20px); filter: brightness(0.85) contrast(1.3); }
          75% { transform: scale(1.08) translate(-10px, 10px); filter: brightness(1.0) contrast(1.45); }
          100% { transform: scale(1.03) translate(0px, 0px); filter: brightness(0.75) contrast(1.25); }
        }
        @keyframes laserSweep {
          0% { transform: rotate(-35deg) translateY(-25%) scale(0.9); opacity: 0.2; }
          50% { transform: rotate(25deg) translateY(15%) scale(1.25); opacity: 0.65; }
          100% { transform: rotate(-35deg) translateY(-25%) scale(0.9); opacity: 0.2; }
        }
        @keyframes energeticGlow {
          0%, 100% { opacity: 0.25; transform: scale(0.95); }
          50% { opacity: 0.65; transform: scale(1.3); }
        }
        .animate-festival-pulse {
          animation: festivalPulse 7s ease-in-out infinite alternate;
        }
        .animate-laser-sweep {
          animation: laserSweep 5s ease-in-out infinite alternate;
        }
        .animate-energetic-glow {
          animation: energeticGlow 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Left Column: Dramatic Concert Photo Showcase (7 cols) */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden flex-col justify-between p-12 bg-[#05070A]">
        {/* Background Concert Image with Fast Festival Motion */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/landing/featured-1.jpg"
            alt="Coldplay Concert Spectacle"
            className="w-full h-full object-cover animate-festival-pulse transform-gpu origin-center"
          />
          {/* Sweeping Laser Light Beams */}
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-[#FF5A36]/40 to-transparent blur-2xl animate-laser-sweep pointer-events-none" />
          <div className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-to-l from-transparent via-cyan-400/35 to-transparent blur-2xl animate-laser-sweep pointer-events-none" style={{ animationDelay: '2.5s' }} />

          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#05070A]" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[100px] animate-energetic-glow" />
          <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-[#FF5A36]/35 rounded-full blur-[90px] animate-energetic-glow" style={{ animationDelay: '1.8s' }} />
        </div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="hover:scale-105 transition-transform duration-200">
            <TicketShieldLogo size="lg" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#A3A8B3] hover:text-[#F5F5F2] uppercase font-display transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Website</span>
          </Link>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 max-w-xl my-auto">
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
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 bg-[#0A0D12]/95 backdrop-blur-xl relative border-l border-white/10 overflow-y-auto">
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
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
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
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
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
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
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
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
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
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#A3A8B3] cursor-pointer pt-1 group">
              <input
                type="checkbox"
                {...register('acceptTerms')}
                className="rounded border-white/20 bg-[#05070A] text-[#FF5A36] focus:ring-0 transition-transform duration-200 group-hover:scale-110"
              />
              <span className="group-hover:text-white transition-colors duration-200">I agree to the Terms of Service and Privacy Policy</span>
            </label>
            {errors.acceptTerms && <p className="text-xs text-red-400">{errors.acceptTerms.message}</p>}

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full font-display font-bold uppercase tracking-widest bg-[#FF5A36] hover:bg-[#FF7252] text-white py-3 rounded-xl shadow-lg shadow-[#FF5A36]/25 hover:shadow-xl hover:shadow-[#FF5A36]/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
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
