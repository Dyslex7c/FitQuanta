'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Toast from '@/components/Toast';

export default function TrainerPlansPage() {
  const router = useRouter();
  const { token, user } = useSelector((s: RootState) => s.auth);

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trainer verification status state
  const [trainerStatus, setTrainerStatus] = useState<string>('pending');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [priceINR, setPriceINR] = useState(1500);
  const [featuresInput, setFeaturesInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [includesDiet, setIncludesDiet] = useState(false);
  const [includesWorkout, setIncludesWorkout] = useState(true);
  const [includesChat, setIncludesChat] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/api/trainer/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('[FETCH PLANS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerStatus = async () => {
    try {
      const res = await axios.get('/api/trainer/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTrainerStatus(res.data.data.status);
      }
    } catch (err) {
      console.error('[FETCH TRAINER STATUS ERROR]', err);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'trainer') {
      router.replace('/dashboard');
      return;
    }

    fetchPlans();
    fetchTrainerStatus();
  }, [token, user, router]);

  const handleAddFeature = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = featuresInput.trim();
      if (val && !features.includes(val)) {
        setFeatures(prev => [...prev, val]);
        setFeaturesInput('');
      }
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setName('');
    setDurationWeeks(4);
    setPriceINR(1500);
    setFeaturesInput('');
    setFeatures([]);
    setIncludesDiet(false);
    setIncludesWorkout(true);
    setIncludesChat(false);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setToast({ message: 'Plan Name must be at least 2 characters long.', type: 'error' });
      return;
    }

    const duration = Number(durationWeeks);
    if (isNaN(duration) || duration < 1 || duration > 52) {
      setToast({ message: 'Duration must be between 1 and 52 weeks.', type: 'error' });
      return;
    }

    const price = Number(priceINR);
    if (isNaN(price) || price < 0 || price > 1000000) {
      setToast({ message: 'Price must be a valid amount between ₹0 and ₹10,00,000.', type: 'error' });
      return;
    }

    setSubmitting(true);

    // Automatically capture any custom feature currently typed but not yet committed via Enter key
    const finalFeatures = [...features];
    const pendingFeature = featuresInput.trim();
    if (pendingFeature && !finalFeatures.includes(pendingFeature)) {
      finalFeatures.push(pendingFeature);
    }

    const payload = {
      name: name.trim(),
      durationWeeks: duration,
      priceINR: price,
      features: finalFeatures,
      includesDiet,
      includesWorkout,
      includesChat
    };

    try {
      const res = await axios.post('/api/trainer/plans', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setToast({ message: 'Coaching Plan created successfully!', type: 'success' });
        resetForm();
        fetchPlans();
      }
    } catch (err: any) {
      console.error('[CREATE PLAN ERROR]', err);
      setToast({ message: err.response?.data?.message || 'Failed to create plan. Please verify approval.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan package? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`/api/trainer/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setToast({ message: 'Plan deleted successfully!', type: 'success' });
        fetchPlans();
      }
    } catch (err) {
      console.error('[DELETE PLAN ERROR]', err);
      setToast({ message: 'Failed to delete plan.', type: 'error' });
    }
  };

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
      

      <div className="page-inner">
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }} className="animate-slide-up">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Coaching Plans
            </h1>
            <p style={{ fontSize: '13.5px', color: '#9090a0', margin: 0 }}>
              Build and customize subscriptions offered to clients
            </p>
          </div>
          
          {trainerStatus === 'approved' ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px' }}
            >
              ＋ Add New Plan
            </button>
          ) : (
            <button
              disabled
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px', opacity: 0.5, cursor: 'not-allowed' }}
              title="Your trainer profile must be approved by admin to create plans."
            >
              ＋ Add New Plan (Pending Approval)
            </button>
          )}
        </div>

        {/* Verification Status Alert Banner */}
        {trainerStatus !== 'approved' && (
          <div
            className="card animate-slide-up"
            style={{
              marginBottom: '32px',
              padding: '20px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(240,112,40,0.08) 0%, rgba(6,6,10,0) 100%)',
              borderColor: 'rgba(240,112,40,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span style={{ fontSize: '28px' }}>⚠️</span>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Profile Verification Required
              </h4>
              <p style={{ fontSize: '12.5px', color: '#9090a0', margin: 0, lineHeight: '1.5' }}>
                Your professional trainer application is currently **pending approval** by our system administrators. 
                You will be able to create coaching packages and appear in the marketplace catalog once your profile status is changed to **Approved** by an admin.
              </p>
            </div>
          </div>
        )}

        {/* Existing plans grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span className="spinner" />
          </div>
        ) : plans.length === 0 ? (
          <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '50px 24px', borderStyle: 'dashed' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>📋</span>
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>No Plans Configured</h3>
            <p style={{ fontSize: '12.5px', color: '#545870', marginBottom: '20px' }}>
              You must create at least one coaching plan package to appear in the client marketplace catalog.
            </p>
            {trainerStatus === 'approved' ? (
              <button onClick={() => setIsFormOpen(true)} className="btn btn-primary">
                Create First Plan
              </button>
            ) : (
              <button
                disabled
                className="btn btn-primary"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="Your trainer profile must be approved by admin to create plans."
              >
                Create First Plan (Pending Approval)
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }} className="animate-slide-up">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#0d0d14',
                  borderColor: '#22223a',
                  padding: '24px',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ffffff', margin: 0 }}>
                    {plan.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan._id)}
                    style={{ background: 'transparent', border: 0, color: '#ff4d4d', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                    title="Delete Plan"
                  >
                    🗑️
                  </button>
                </div>

                <p style={{ fontSize: '11.5px', color: '#9090a0', marginBottom: '14px' }}>
                  Duration: <strong style={{ color: '#ffffff' }}>{plan.durationWeeks} Weeks</strong>
                </p>

                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1ed696', marginBottom: '20px' }}>
                  ₹{plan.priceINR.toLocaleString('en-IN')}
                </div>

                {/* Features Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: plan.includesWorkout ? '#ffffff' : '#545870' }}>
                    <span>{plan.includesWorkout ? '✓' : '✗'}</span> Workout Plans
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: plan.includesDiet ? '#ffffff' : '#545870' }}>
                    <span>{plan.includesDiet ? '✓' : '✗'}</span> Nutrition Diets
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: plan.includesChat ? '#ffffff' : '#545870' }}>
                    <span>{plan.includesChat ? '✓' : '✗'}</span> Real-time Chat
                  </div>
                  {plan.features.map((f: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
                      <span>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form Overlay */}
        {isFormOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'rgba(6,6,10,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              className="card animate-slide-up"
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#0d0d14',
                borderColor: '#22223a',
                padding: '28px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffffff', marginBottom: '20px', borderBottom: '1px solid #22223a', paddingBottom: '10px' }}>
                Create Coaching Package
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Plan Name */}
                <div>
                  <label className="label" htmlFor="pl-name">Plan Name</label>
                  <input
                    id="pl-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 1-Month Muscle Gaining Split"
                    className="input"
                    required
                  />
                </div>

                {/* Duration & Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label" htmlFor="pl-dur">Duration (Weeks)</label>
                    <input
                      id="pl-dur"
                      type="number"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(Number(e.target.value))}
                      className="input"
                      min="1"
                      max="52"
                      required
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="pl-pr">Price (INR)</label>
                    <input
                      id="pl-pr"
                      type="number"
                      value={priceINR}
                      onChange={(e) => setPriceINR(Number(e.target.value))}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Checklist options */}
                <div>
                  <label className="label" style={{ marginBottom: '8px' }}>Package Inclusions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includesWorkout}
                        onChange={(e) => setIncludesWorkout(e.target.checked)}
                        style={{ accentColor: '#f07028' }}
                      />
                      Includes Workout splits & routines
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includesDiet}
                        onChange={(e) => setIncludesDiet(e.target.checked)}
                        style={{ accentColor: '#f07028' }}
                      />
                      Includes Custom Diet & Nutrition plans
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includesChat}
                        onChange={(e) => setIncludesChat(e.target.checked)}
                        style={{ accentColor: '#f07028' }}
                      />
                      Includes Real-time messenger support
                    </label>
                  </div>
                </div>

                {/* Additional Features */}
                <div>
                  <label className="label" htmlFor="pl-feats">Custom Features (Press Enter to add)</label>
                  <input
                    id="pl-feats"
                    type="text"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    onKeyDown={handleAddFeature}
                    placeholder="e.g. 24/7 video calls support"
                    className="input"
                  />
                  {features.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {features.map((feat, idx) => (
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
                          {feat}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            style={{ border: 0, background: 'transparent', color: '#f07028', cursor: 'pointer', padding: 0 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-ghost"
                    style={{ flex: 1, border: '1px solid #22223a', fontSize: '12.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '12.5px' }}
                  >
                    {submitting ? 'Creating…' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
