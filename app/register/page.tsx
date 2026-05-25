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
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#06060a' }}>
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eceef4', marginBottom: '6px' }}>
            Register
          </h2>
          <p style={{ fontSize: '13px', color: '#545870' }}>Create your account to get started</p>
        </div>

        <div className="card">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit(onSubmit)}>
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#545870', marginTop: '20px' }}>
          Already have an account? <Link href="/login" style={{ color: '#00d4ff', fontWeight: 500 }}>Sign in</Link>
        </p>

      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
