'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/schemas/loginSchema';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/login', data);
      if (res.data.success) {
        const { token, user } = res.data.data;
        dispatch(setCredentials({ token, user }));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (user.onboardingComplete) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#12121a] p-8 rounded-2xl border border-[#1e1e2e] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[#e2e8f0]">
            Sign in to FitQuanta
          </h2>
          <p className="mt-2 text-center text-sm text-[#94a3b8]">
            Or{' '}
            <Link href="/register" className="font-medium text-[#00d4ff] hover:text-[#0099bb] transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Email address</label>
              <input
                type="email"
                {...register('email')}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-[#00d4ff] transition-all text-sm"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-[#00d4ff] transition-all text-sm"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-[#0a0a0f] bg-[#00d4ff] hover:bg-[#0099bb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d4ff] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
