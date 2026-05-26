'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Toast from '@/components/Toast';

export default function ClientPurchasesPage() {
  const router = useRouter();
  const { token, user } = useSelector((s: RootState) => s.auth);

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active coach state
  const [profile, setProfile] = useState<any>(null);
  const [activeTrainer, setActiveTrainer] = useState<any>(null);

  // Review form states
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/api/payments/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPurchases(res.data.data);
      }
    } catch (err) {
      console.error('[FETCH PURCHASES ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAndTrainer = async () => {
    try {
      const pRes = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.data.success) {
        setProfile(pRes.data.data);
        const trId = pRes.data.data.activeTrainerId;
        if (trId) {
          const tRes = await axios.get(`/api/trainer/profile/${trId}`);
          if (tRes.data.success) {
            setActiveTrainer(tRes.data.data.trainer);
          }
        } else {
          setActiveTrainer(null);
        }
      }
    } catch (err) {
      console.error('[FETCH PROFILE/TRAINER ERROR]', err);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    fetchPurchases();
    fetchProfileAndTrainer();
  }, [token, user, router]);

  const handleLeaveTrainer = async () => {
    if (!window.confirm('Are you sure you want to end your subscription and leave your active trainer? You will no longer be able to chat with them or receive custom routines, but you will be free to choose another coach.')) return;
    
    try {
      const res = await axios.post('/api/trainer/leave', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setToast({ message: res.data.message || 'Successfully left coach!', type: 'success' });
        fetchProfileAndTrainer(); // Refresh UI
      }
    } catch (err) {
      console.error('[LEAVE TRAINER ERROR]', err);
      setToast({ message: 'Failed to leave trainer. Please try again.', type: 'error' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    setIsSubmittingReview(true);
    const payload = {
      trainerId: selectedPurchase.trainerId,
      purchaseId: selectedPurchase._id,
      rating: Number(rating),
      comment: comment.trim()
    };

    try {
      const res = await axios.post('/api/reviews', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setToast({ message: 'Thank you for your rating! Your review has been saved.', type: 'success' });
        setSelectedPurchase(null);
        setRating(5);
        setComment('');
        fetchPurchases();
      }
    } catch (err: any) {
      console.error('[REVIEW SUBMIT ERROR]', err);
      setToast({ message: err.response?.data?.message || 'Failed to submit review.', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
      

      <div className="page-inner">
        {/* Header */}
        <div style={{ marginBottom: '32px' }} className="animate-slide-up">
          <h1 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Purchased Coaching Plans
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9090a0', margin: 0 }}>
            Billing history, custom plan subscriptions, and review portals
          </p>
        </div>

        {/* Active Coach Panel */}
        {activeTrainer ? (
          <div
            className="card animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(30,214,150,0.06) 0%, rgba(6,6,10,0) 100%)',
              borderColor: 'rgba(30,214,150,0.2)',
              padding: '24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid #1ed696',
                  overflow: 'hidden',
                  background: '#13131e'
                }}
              >
                <img
                  src={activeTrainer.profilePhotoUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200'}
                  alt={activeTrainer.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#1ed696', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Your Active Coach
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>
                  {activeTrainer.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#9090a0', margin: '2px 0 0 0' }}>
                  💼 {activeTrainer.yearsOfExperience} Yrs Exp · ★ {activeTrainer.averageRating > 0 ? activeTrainer.averageRating.toFixed(1) : 'New'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push('/chat')}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '8px 16px', background: '#1ed696', borderColor: '#1ed696' }}
              >
                💬 Open Chat Room
              </button>
              <button
                onClick={handleLeaveTrainer}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '8px 16px', borderColor: 'rgba(255,77,77,0.3)', color: '#ff4d4d' }}
              >
                🚪 Leave Coach
              </button>
            </div>
          </div>
        ) : profile && !profile.activeTrainerId ? (
          <div
            className="card animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(240,112,40,0.03) 0%, rgba(6,6,10,0) 100%)',
              borderColor: '#22223a',
              padding: '20px 24px',
              borderRadius: '12px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                You are currently a Free User
              </h4>
              <p style={{ fontSize: '12px', color: '#9090a0', margin: 0 }}>
                Subscribe to a professional coach package in our marketplace to receive 1-on-1 diet and workout sheets.
              </p>
            </div>
            <button
              onClick={() => router.push('/trainer')}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              Browse Trainers →
            </button>
          </div>
        ) : null}

        {/* Invoice list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span className="spinner" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '50px 24px', borderStyle: 'dashed' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>💳</span>
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>No Purchases Found</h3>
            <p style={{ fontSize: '12.5px', color: '#545870', marginBottom: '20px', maxWidth: '380px', margin: '0 auto 20px auto' }}>
              Subscribe to certified coaching packages in our marketplace to receive professional plan splits and chat rooms.
            </p>
            <button onClick={() => router.push('/trainer')} className="btn btn-primary">
              Browse Trainers
            </button>
          </div>
        ) : (
          <div className="card animate-slide-up" style={{ padding: '24px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #22223a', color: '#545870' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Plan Name</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Amount Paid</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Order ID</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Purchase Date</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((pur) => (
                    <tr key={pur._id} style={{ borderBottom: '1px solid #13131e' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#ffffff' }}>{pur.planName}</td>
                      <td style={{ padding: '12px 8px', color: '#ffffff' }}>₹{pur.amountINR.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', color: '#9090a0' }}>{pur.razorpayOrderId}</td>
                      <td style={{ padding: '12px 8px', color: '#545870' }}>
                        {new Date(pur.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedPurchase(pur)}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'inline-flex' }}
                        >
                          ★ Leave Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Star feedback rating modal overlay */}
        {selectedPurchase && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'rgba(6,6,10,0.85)',
              backdropFilter: 'blur(8px)',
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
                maxWidth: '400px',
                background: '#0d0d14',
                borderColor: '#22223a',
                padding: '28px'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffffff', marginBottom: '8px' }}>
                Rate Your Coach
              </h3>
              <p style={{ fontSize: '11.5px', color: '#9090a0', marginBottom: '20px', lineHeight: '1.5' }}>
                How was your experience training under this coach? Your ratings help other clients make informed decisions.
              </p>

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Star rating selector */}
                <div>
                  <label className="label" style={{ marginBottom: '8px' }}>Star Rating</label>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '24px', color: '#f07028', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        style={{ userSelect: 'none', transition: 'transform 0.1s' }}
                      >
                        {star <= rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rating comments */}
                <div>
                  <label className="label" htmlFor="rev-comm">Write Comments (Optional)</label>
                  <textarea
                    id="rev-comm"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your coach's helpfulness, splits, diets, support availability, or training styles..."
                    className="input"
                    rows={4}
                    style={{ height: 'auto', resize: 'vertical', fontSize: '12.5px' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPurchase(null)}
                    className="btn btn-ghost"
                    style={{ flex: 1, border: '1px solid #22223a', fontSize: '12.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '12.5px' }}
                  >
                    {isSubmittingReview ? 'Saving…' : 'Submit Review'}
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
