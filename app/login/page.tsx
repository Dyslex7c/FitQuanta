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
import Toast from '@/components/Toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
    setToast(null);
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
      setToast({
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#06060a' }}>
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eceef4', marginBottom: '6px' }}>
            Sign in
          </h2>
          <p style={{ fontSize: '13px', color: '#545870' }}>Enter your details to continue</p>
        </div>

        <div className="card">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit(onSubmit)}>
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#545870', marginTop: '20px' }}>
          No account? <Link href="/register" style={{ color: '#00d4ff', fontWeight: 500 }}>Create one</Link>
        </p>

      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
