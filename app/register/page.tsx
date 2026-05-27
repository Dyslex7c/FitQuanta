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

function validateRegister(name: string, email: string, password: string) {
  const errors: Record<string, string> = {};
  if (!name.trim() || name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Please enter a valid email address';
  if (password.length < 8)
    errors.password = 'Password must be at least 8 characters';
  else if (!/[0-9]/.test(password))
    errors.password = 'Password must contain at least one number';
  else if (!/[^a-zA-Z0-9]/.test(password))
    errors.password = 'Password must contain at least one special character (e.g. @, #, !)';
  return errors;
}

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [toast,       setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setCaptchaToken('dev-bypass');
    }
  }, []);

  // Redirect already-authenticated users away — runs only after hydration
  useEffect(() => {
    if (isAuthenticated && user) {
      setRedirecting(true);
      router.replace(user.onboardingComplete ? '/dashboard' : '/onboarding');
    }
  }, [isAuthenticated, user, router]);

  const pwChecks = {
    length:  password.length >= 8,
    number:  /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegister(name, email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setToast(null);
    try {
      const res = await axios.post('/api/auth/register', {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
        turnstileToken: captchaToken,
      });

      if (res.data.success) {
        const token = res.data.data.token;
        const profileRes = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.data.success) {
          dispatch(setCredentials({ token, user: profileRes.data.data }));
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setToast({ message: 'Too many attempts. Please wait 15 minutes and try again.', type: 'error' });
      } else if (err.response?.status === 409) {
        setToast({ message: 'That email is already registered — try signing in instead.', type: 'error' });
      } else {
        setToast({ message: err.response?.data?.message || 'Registration failed. Please try again.', type: 'error' });
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
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="FitQuanta" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '6px' }}>
            Create Account
          </h2>
          <p style={{ fontSize: '13px', color: '#9090a0' }}>Start your fitness journey today</p>
        </div>

        <div className="card">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <div>
              <label className="label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
                autoComplete="name"
                disabled={loading}
              />
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
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

            {/* Password */}
            <div>
              <label className="label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={loading}
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}

              {/* Live checklist — always rendered once typing starts */}
              {password.length > 0 && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #22223a', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {([
                    { ok: pwChecks.length,  label: 'At least 8 characters' },
                    { ok: pwChecks.number,  label: 'Contains a number (0–9)' },
                    { ok: pwChecks.special, label: 'Contains a special character (@, #, !, etc.)' },
                  ] as const).map(({ ok, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: ok ? '#1ed696' : '#545870', transition: 'color 0.2s' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{ok ? '✓' : '○'}</span>
                      {label}
                    </div>
                  ))}
                </div>
              )}
              {password.length === 0 && (
                <p style={{ fontSize: '11px', color: '#545870', marginTop: '6px' }}>
                  Must be 8+ characters with a number and a special character
                </p>
              )}
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
              id="register-submit"
              type="submit"
              disabled={loading || !captchaToken}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#545870', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#f07028', fontWeight: 500 }}>Sign in</Link>
        </p>

        {/* Trainer Portal Link Option */}
        <div
          className="card"
          style={{
            marginTop: '24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(240,112,40,0.05) 0%, rgba(6,6,10,0) 100%)',
            borderColor: 'rgba(240,112,40,0.15)',
            padding: '16px 18px'
          }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
            Are you a Professional Trainer?
          </h4>
          <p style={{ fontSize: '11px', color: '#9090a0', marginBottom: '12px' }}>
            Apply to join our coaching program, build custom plans, and train clients worldwide.
          </p>
          <Link
            href="/trainer/register"
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '12px', padding: '6px 12px' }}
          >
            Apply as Trainer
          </Link>
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
