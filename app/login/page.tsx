'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Toast from '@/components/Toast';

function validateLogin(email: string, password: string) {
  const errors: Record<string, string> = {};
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Please enter a valid email address';
  if (!password)
    errors.password = 'Please enter your password';
  return errors;
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [toast,       setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Redirect already-authenticated users away — runs only after hydration
  useEffect(() => {
    if (isAuthenticated && user) {
      setRedirecting(true);
      router.replace(user.onboardingComplete ? '/dashboard' : '/onboarding');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLogin(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setToast(null);
    try {
      const res = await axios.post('/api/auth/login', {
        email:    email.trim().toLowerCase(),
        password,
      });

      if (res.data.success) {
        const { token, user: userData } = res.data.data;
        dispatch(setCredentials({ token, user: userData }));
        router.push(userData.onboardingComplete ? '/dashboard' : '/onboarding');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setToast({ message: 'Incorrect email or password. Please try again.', type: 'error' });
      } else if (err.response?.status === 429) {
        setToast({ message: 'Too many attempts. Please wait before trying again.', type: 'error' });
      } else {
        setToast({ message: err.response?.data?.message || 'Login failed. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show a spinner while redirect is in progress (not a blank page)
  if (redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06060a' }}>
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div
      className="page-wrapper"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#06060a' }}
    >
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '380px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="FitQuanta" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '6px' }}>
            Sign In
          </h2>
          <p style={{ fontSize: '13px', color: '#9090a0' }}>Enter your details to continue</p>
        </div>

        <div className="card">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit} noValidate>

            <div>
              <label className="label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#545870', marginTop: '20px' }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#f07028', fontWeight: 500 }}>Create one</Link>
        </p>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
