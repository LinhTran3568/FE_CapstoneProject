import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
      showToast('Đăng nhập thành công!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Đăng nhập thất bại: ' + err.message, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      // Giả lập / nhận Google IdToken từ SDK hoặc input test
      const dummyGoogleToken = 'google_id_token_demo_' + Date.now();
      const res = await authApi.googleLogin(dummyGoogleToken);
      login(res.user, res.token);
      showToast('Đăng nhập Google thành công!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Đăng nhập Google thất bại: ' + err.message, 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-navy-850 p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng Nhập</h1>
          <p className="text-xs text-slate-400">Nhập thông tin tài khoản của bạn để tiếp tục</p>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Mật khẩu</label>
              <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full font-bold shadow-glow-cyan">
            Đăng Nhập
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-navy-700"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Hoặc</span>
          <div className="flex-grow border-t border-navy-700"></div>
        </div>

        <Button
          type="button"
          variant="secondary"
          isLoading={isGoogleLoading}
          onClick={handleGoogleLogin}
          className="w-full bg-navy-800 border-navy-700 hover:bg-navy-750 text-slate-200 flex items-center justify-center gap-2"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Đăng nhập với Google</span>
        </Button>

        <p className="text-center text-xs text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
