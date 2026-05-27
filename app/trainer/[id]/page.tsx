'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import TrainerPlanCard from '@/components/trainer/TrainerPlanCard';
import Toast from '@/components/Toast';
import type { ITrainerPlan } from '@/types/trainer';

interface Review {
  _id: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface TrainerProfile {
  trainer: {
    _id: string;
    name: string;
    location?: string;
    country: string;
    yearsOfExperience: number;
    clientsTrained: number;
    specializations: string[];
    bio: string;
    certifications?: string[];
    profilePhotoUrl?: string;
    averageRating: number;
    totalReviews: number;
  };
  plans: ITrainerPlan[];
  reviews: Review[];
}

export default function TrainerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<TrainerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/trainer/profile/${id}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Trainer not found.');
        }
      } catch (err) {
        console.error('[DETAIL PROFILE ERROR]', err);
        setError('Trainer profile not found.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTrainerProfile();
  }, [id]);

  const handlePaymentSuccess = (conversationId: string) => {
    setToast({ message: 'Coaching Plan Subscribed successfully! Opening chat inbox…', type: 'success' });
    setTimeout(() => {
      router.push(`/chat/${conversationId}`);
    }, 2500);
  };

  const handlePaymentFailure = (errorMsg: string) => {
    setToast({ message: errorMsg, type: 'error' });
  };

  const getSpecializationLabel = (spec: string) => {
    return spec.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
        <div className="page-inner" style={{ maxWidth: '600px' }}>
          <div className="card card-fire" style={{ textAlign: 'center', padding: '40px' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>Trainer Profile Unavailable</h3>
            <p style={{ fontSize: '13px', color: '#9090a0', margin: '0 0 20px 0' }}>{error || 'This trainer could not be found.'}</p>
            <button onClick={() => router.push('/trainer')} className="btn btn-outline" style={{ display: 'inline-flex', margin: '0 auto' }}>
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { trainer, plans, reviews } = data;
  const defaultAvatar = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
      
      {/* Profile Header Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(240,112,40,0.08) 0%, rgba(6,6,10,0) 100%)',
          borderBottom: '1px solid #13131e',
          padding: '48px 0 36px 0'
        }}
      >
        <div className="page-inner" style={{ padding: '0 24px', display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Photo */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '3px solid #f07028',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={trainer.profilePhotoUrl || defaultAvatar} alt={trainer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Details */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {trainer.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid #22223a', padding: '3px 8px', borderRadius: '6px' }}>
                <span style={{ color: '#f07028', fontSize: '13px' }}>★</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  {trainer.averageRating > 0 ? trainer.averageRating.toFixed(1) : 'New'}
                </span>
                <span style={{ fontSize: '11px', color: '#545870' }}>({trainer.totalReviews})</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#9090a0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span>📍 {trainer.location ? `${trainer.location}, ` : ''}{trainer.country}</span>
              <span>•</span>
              <span>💼 {trainer.yearsOfExperience} {trainer.yearsOfExperience === 1 ? 'Year' : 'Years'} Exp</span>
              <span>•</span>
              <span>💪 {trainer.clientsTrained} Clients Trained</span>
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {trainer.specializations.map((spec: string) => (
                <span
                  key={spec}
                  style={{
                    background: 'rgba(240,112,40,0.06)',
                    border: '1px solid rgba(240,112,40,0.15)',
                    color: '#f07028',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {getSpecializationLabel(spec)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      {/* Main Details Body */}
      <div className="page-inner grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start pt-9">
        
        {/* Left Column Profile info & Reviews */}
        <div>
          
          {/* About Bio */}
          <div className="card animate-slide-up" style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid #22223a', paddingBottom: '8px', color: '#ffffff' }}>
              About the Coach
            </h3>
            <p style={{ fontSize: '13.5px', color: '#9090a0', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {trainer.bio}
            </p>

            {trainer.certifications && trainer.certifications.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#545870', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Certifications & Credentials
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {trainer.certifications.map((cert: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid #22223a',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        color: '#ffffff'
                      }}
                    >
                      📜 {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client Reviews list */}
          <div className="card animate-slide-up">
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', borderBottom: '1px solid #22223a', paddingBottom: '8px', color: '#ffffff' }}>
              Client Reviews
            </h3>
            {reviews.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#545870', margin: 0, fontStyle: 'italic' }}>
                No reviews yet. Be the first to train and share your feedback!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev: Review) => (
                  <div key={rev._id} style={{ borderBottom: '1px solid #13131e', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                        {rev.clientName}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#545870' }}>
                        {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '2px', color: '#f07028', fontSize: '11px', marginBottom: '8px' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < rev.rating ? '★' : '☆'}</span>
                      ))}
                    </div>

                    <p style={{ fontSize: '12.5px', color: '#9090a0', margin: 0, lineHeight: '1.6' }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column Available Pricing Plans */}
        <aside className="lg:sticky lg:top-20">
          <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', color: '#ffffff' }}>
            Choose Plan Package
          </h3>
          {plans.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#545870', fontSize: '12.5px', borderStyle: 'dashed' }}>
              No plans available currently. Contact trainer or check back later!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plans.map((plan: ITrainerPlan) => (
                <div key={plan._id}>
                  <TrainerPlanCard
                    plan={plan}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                </div>
              ))}
            </div>
          )}
        </aside>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
