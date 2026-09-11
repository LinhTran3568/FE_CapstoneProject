import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@ticketshield/validation';
import { authApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
      showToast('Đăng ký tài khoản thành công!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Đăng ký thất bại: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-navy-850 p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-slate-400">Điền thông tin để tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              {...register('fullName')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Số Điện Thoại</label>
            <input
              type="text"
              placeholder="0901234567"
              {...register('phoneNumber')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.phoneNumber && <p className="text-xs text-red-400 mt-1">{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
            <input type="checkbox" {...register('acceptTerms')} className="rounded border-navy-700 text-cyan-500" />
            <span>Tôi đồng ý với các điều khoản dịch vụ</span>
          </label>
          {errors.acceptTerms && <p className="text-xs text-red-400">{errors.acceptTerms.message}</p>}

          <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full font-bold shadow-glow-cyan">
            Tạo Tài Khoản
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};
