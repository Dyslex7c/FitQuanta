'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Toast from '@/components/Toast';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

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
  const [loginMode,   setLoginMode]   = useState<'client' | 'trainer'>('client');
  const [mounted,     setMounted]     = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setCaptchaToken('dev-bypass');
    }
  }, []);

  const getRedirectPath = (u: any) => {
    if (u.role === 'admin') return '/admin';
    if (u.role === 'trainer') return '/trainer/dashboard';
    return u.onboardingComplete ? '/dashboard' : '/onboarding';
  };

  // Redirect already-authenticated users away — runs only after hydration
  useEffect(() => {
    if (isAuthenticated && user) {
      setRedirecting(true);
      router.replace(getRedirectPath(user));
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
        role:     loginMode,
        turnstileToken: captchaToken,
      });

      if (res.data.success) {
        const { token, user: userData } = res.data.data;
        dispatch(setCredentials({ token, user: userData }));
        router.push(getRedirectPath(userData));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setToast({ message: 'Incorrect email or password. Please try again.', type: 'error' });
      } else if (err.response?.status === 429) {
        setToast({ message: 'Too many attempts. Please wait before trying again.', type: 'error' });
      } else {
        setToast({ message: err.response?.data?.message || 'Login failed. Please try again.', type: 'error' });
      }
      /* Reset CAPTCHA widget on any error so user gets a fresh token */
      setCaptchaToken(
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'dev-bypass'
          : null
      );
      turnstileRef.current?.reset();
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="FitQuanta" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '6px' }}>
            Sign In
          </h2>
          <p style={{ fontSize: '13px', color: '#9090a0' }}>
            {loginMode === 'client' ? 'Enter your credentials to continue' : 'Enter your professional trainer credentials'}
          </p>
        </div>

        {/* Role visual tabs */}
        <div style={{ display: 'flex', background: '#0d0d14', border: '1px solid #22223a', borderRadius: '8px', padding: '3px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setLoginMode('client')}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              border: 0,
              borderRadius: '6px',
              background: loginMode === 'client' ? '#f07028' : 'transparent',
              color: loginMode === 'client' ? '#ffffff' : '#9090a0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            User Access
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('trainer')}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              border: 0,
              borderRadius: '6px',
              background: loginMode === 'trainer' ? '#f07028' : 'transparent',
              color: loginMode === 'trainer' ? '#ffffff' : '#9090a0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Trainer Access
          </button>
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

            {mounted && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x0000000000000000000016'}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'dark', size: 'flexible' }}
                />
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading || !captchaToken}
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
