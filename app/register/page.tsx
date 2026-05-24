'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/schemas/registerSchema';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Toast from '@/components/Toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setToast(null);
    try {
      const res = await axios.post('/api/auth/register', data);
      if (res.data.success) {
        const token = res.data.data.token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profileRes = await axios.get('/api/profile');
        if (profileRes.data.success) {
          dispatch(setCredentials({ token, user: profileRes.data.data }));
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Registration failed. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-orange p-[1.5px] shadow-[0_0_20px_rgba(0,212,255,0.25)] mb-4 animate-pulse-cyan">
            <div className="w-full h-full bg-[#0a0a12] rounded-[10px] flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase text-cyan">
            FitQuanta
          </h1>
          <p className="text-text-muted text-sm mt-1">Create your account</p>
        </div>

        {/* Form card */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                {...register('name')}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                {...register('email')}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                {...register('password')}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-cyan hover:text-cyan-dim transition-colors">
              Sign in to your account
            </Link>
          </p>
        </div>

      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
