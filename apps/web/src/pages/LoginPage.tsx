import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TicketShieldLogo } from '../components/ui/TicketShieldLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authApi.login(data);
      login(res.user, res.token);
      showToast('Login successful! Welcome back.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Login failed: ' + err.message, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const dummyGoogleToken = 'google_id_token_demo_' + Date.now();
      const res = await authApi.googleLogin(dummyGoogleToken);
      login(res.user, res.token);
      showToast('Google login successful!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Google login failed: ' + err.message, 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#05070A] text-[#F5F5F2] font-sans">
      {/* Left Column: Dramatic Concert Photo & Brand Showcase (7 cols) */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden flex-col justify-between p-12 bg-[#05070A]">
        {/* Full-screen Background Concert Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing/hero-concert.jpg"
            alt="Live Concert Atmosphere"
            className="w-full h-full object-cover filter brightness-[0.6] contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#05070A]" />
        </div>

        {/* Top Brand Logo & Back to Home */}
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

        {/* Center Graphic Editorial Hero Text */}
        <div className="relative z-10 space-y-6 max-w-xl my-auto">
          <span className="px-3.5 py-1 bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF5A36] text-xs font-bold uppercase tracking-widest rounded-full font-display inline-block">
            Verified Pass Platform
          </span>
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold uppercase leading-[0.95] tracking-tight">
            The Moment <br />
            <span className="text-[#FF5A36]">Starts Here.</span>
          </h1>
          <p className="text-[#A3A8B3] text-base leading-relaxed">
            Access thousands of verified live concerts, music festivals, and theater tickets with 100% escrow protection.
          </p>
        </div>

        {/* Bottom Ticker Info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#A3A8B3] font-display">
          <span>Cryptographic Pass Authentication</span>
          <span className="text-[#F5F5F2] font-semibold">100% Escrow Protection</span>
        </div>
      </div>

      {/* Right Column: Sleek Dark Form (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-[#0A0D12] relative border-l border-white/10">
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

        <div className="my-auto max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-[#A3A8B3]">
              Enter your account credentials to access your digital passes
            </p>
          </div>

          {/* Form */}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#FF5A36] hover:underline font-medium font-display"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F5F2] placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full font-display font-bold uppercase tracking-widest bg-[#FF5A36] hover:bg-[#FF7252] text-white py-3.5 rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs text-[#A3A8B3] uppercase tracking-widest font-display">
              Or continue with
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="secondary"
            isLoading={isGoogleLoading}
            onClick={handleGoogleLogin}
            className="w-full bg-[#05070A] border border-white/15 hover:border-white/30 text-[#F5F5F2] py-3 rounded-xl flex items-center justify-center gap-2 font-display text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Globe className="w-4 h-4 text-[#FF5A36]" />
            <span>Continue with Google</span>
          </Button>

          {/* Redirect Link */}
          <p className="text-center text-xs text-[#A3A8B3]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF5A36] hover:underline font-bold font-display ml-1">
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-8 text-center lg:text-left text-[11px] text-[#A3A8B3] font-mono">
          © 2026 TicketShield Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};
