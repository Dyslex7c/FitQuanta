'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Toast from '@/components/Toast';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function TrainerRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [certInput, setCertInput] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState(2);
  const [clientsTrained, setClientsTrained] = useState(0);
  const [specializations, setSpecializations] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const availableSpecs = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'strength', label: 'Strength & Conditioning' },
    { value: 'cardio', label: 'Cardio Training' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'rehabilitation', label: 'Rehabilitation' },
    { value: 'sports', label: 'Sports Coaching' },
    { value: 'nutrition', label: 'Diet & Nutrition' },
  ];

  const handleSpecChange = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleAddCert = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = certInput.trim();
      if (val && !certifications.includes(val)) {
        setCertifications((prev) => [...prev, val]);
        setCertInput('');
      }
    }
  };

  const handleRemoveCert = (idxToRemove: number) => {
    setCertifications((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full Name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid email.';
    if (password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    else if (!/[0-9]/.test(password))
      errs.password = 'Password must contain a number.';
    else if (!/[^a-zA-Z0-9]/.test(password))
      errs.password = 'Password must contain a special character.';

    if (!country.trim()) errs.country = 'Country is required.';
    if (!bio.trim() || bio.trim().length < 50)
      errs.bio = 'Please write a bio of at least 50 characters.';
    if (specializations.length === 0)
      errs.specializations = 'Select at least one specialization.';

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setToast({ message: 'Please fix the highlighted errors before submitting.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast(null);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      age: Number(age),
      gender,
      country: country.trim(),
      location: location.trim(),
      bio: bio.trim(),
      certifications,
      yearsOfExperience: Number(yearsOfExperience),
      clientsTrained: Number(clientsTrained),
      specializations,
      turnstileToken: captchaToken,
    };

    try {
      const res = await axios.post('/api/trainer/register', payload);
      if (res.data.success) {
        setToast({
          message: 'Application submitted successfully! Redirecting to login…',
          type: 'success',
        });
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('[TRAINER SUBMIT ERROR]', err);
      setToast({
        message: err.response?.data?.message || 'Onboarding failed. Please try again.',
        type: 'error',
      });
      /* Reset CAPTCHA widget on any error so user gets a fresh token */
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-wrapper"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#06060a', padding: '40px 24px' }}
    >
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="FitQuanta" style={{ height: '52px', width: '52px', margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '6px' }}>
            Trainer Application
          </h2>
          <p style={{ fontSize: '13px', color: '#9090a0' }}>Apply to join FitQuanta coaching program</p>
        </div>

        <div className="card" style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Primary Details Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label" htmlFor="tr-name">Full Name</label>
                <input
                  id="tr-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Coach John Doe"
                  required
                />
                {errors.name && <p className="error-msg">{errors.name}</p>}
              </div>

              <div>
                <label className="label" htmlFor="tr-email">Email Address</label>
                <input
                  id="tr-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="john.doe@fitquanta.com"
                  required
                />
                {errors.email && <p className="error-msg">{errors.email}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="tr-pw">Create Password</label>
              <input
                id="tr-pw"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Password (8+ chars, with number & spec char)"
                required
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            {/* Bio */}
            <div>
              <label className="label" htmlFor="tr-bio">Biography (Min 50 chars)</label>
              <textarea
                id="tr-bio"
                value={bio}
                onChange={(e) => { setBio(e.target.value); setErrors(p => ({ ...p, bio: '' })); }}
                className={`input ${errors.bio ? 'input-error' : ''}`}
                placeholder="Introduce yourself to clients! Share your values, training philosophy, methods, and inspiration..."
                rows={4}
                style={{ height: 'auto', resize: 'vertical' }}
                required
              />
              {errors.bio && <p className="error-msg">{errors.bio}</p>}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label" htmlFor="tr-age">Age</label>
                <input
                  id="tr-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="input"
                  min="18"
                  max="80"
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="tr-gender">Gender</label>
                <select
                  id="tr-gender"
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="input"
                  style={{ height: 'auto', padding: '10px' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="tr-exp">Years of Experience</label>
                <input
                  id="tr-exp"
                  type="number"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="input"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Country & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label" htmlFor="tr-country">Country</label>
                <input
                  id="tr-country"
                  type="text"
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setErrors(p => ({ ...p, country: '' })); }}
                  className={`input ${errors.country ? 'input-error' : ''}`}
                  placeholder="India"
                  required
                />
                {errors.country && <p className="error-msg">{errors.country}</p>}
              </div>

              <div>
                <label className="label" htmlFor="tr-location">City / State</label>
                <input
                  id="tr-location"
                  type="text"
                  value={location}
                  placeholder="Mumbai, Maharashtra"
                  onChange={(e) => setLocation(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Certifications tags */}
            <div>
              <label className="label" htmlFor="tr-certs">Certifications (Press Enter or comma to add)</label>
              <input
                id="tr-certs"
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={handleAddCert}
                className="input"
                placeholder="e.g. NASM CPT, Gold's Gym Certified"
              />
              {certifications.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid #22223a',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#ffffff'
                      }}
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(idx)}
                        style={{ border: 0, background: 'transparent', color: '#f07028', cursor: 'pointer', fontSize: '11px', padding: 0 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specializations selectors */}
            <div>
              <label className="label" style={{ marginBottom: '8px' }}>Specializations (Select 1 or more)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                {availableSpecs.map((spec) => {
                  const checked = specializations.includes(spec.value);
                  return (
                    <label
                      key={spec.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: checked ? '#ffffff' : '#9090a0',
                        cursor: 'pointer',
                        background: checked ? 'rgba(240,112,40,0.04)' : 'transparent',
                        border: `1px solid ${checked ? 'rgba(240,112,40,0.3)' : '#22223a'}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => { handleSpecChange(spec.value); setErrors(p => ({ ...p, specializations: '' })); }}
                        style={{ accentColor: '#f07028' }}
                      />
                      {spec.label}
                    </label>
                  );
                })}
              </div>
              {errors.specializations && <p className="error-msg" style={{ marginTop: '8px' }}>{errors.specializations}</p>}
            </div>

            {/* CAPTCHA Widget */}
            {mounted && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={
                    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) || process.env.NODE_ENV !== 'production'
                      ? '1x0000000000000000000016'
                      : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x0000000000000000000016')
                  }
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'dark', size: 'flexible' }}
                />
              </div>
            )}

            {/* Form actions */}
            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '13px', marginTop: '10px' }}
            >
              {loading ? 'Submitting Application…' : 'Submit Application'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#545870', marginTop: '20px' }}>
          Back to registration?{' '}
          <Link href="/register" style={{ color: '#f07028', fontWeight: 500 }}>Go Back</Link>
        </p>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <style jsx global>{`
        @media (max-width: 500px) {
          div[style*="gridTemplateColumns: 1fr 1fr"],
          div[style*="gridTemplateColumns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
