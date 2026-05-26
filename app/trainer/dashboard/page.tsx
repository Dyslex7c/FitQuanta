'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Toast from '@/components/Toast';

export default function TrainerDashboardPage() {
  const router = useRouter();
  const { token, user } = useSelector((s: RootState) => s.auth);

  const [trainer, setTrainer] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        axios.get('/api/trainer/profile', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/payments/history', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (profileRes.data.success) setTrainer(profileRes.data.data);
      if (historyRes.data.success) setPurchases(historyRes.data.data);
    } catch (err) {
      console.error('[TRAINER DASHBOARD ERROR]', err);
    } finally {
      setLoading(false);
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

    fetchDashboardData();
  }, [token, user, router]);

  const handleUpdateAvailability = async (status: string) => {
    try {
      const res = await axios.put(
        '/api/trainer/profile',
        { availabilityStatus: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTrainer(res.data.data);
        setToast({ message: `Availability status updated to ${status}!`, type: 'success' });
      }
    } catch (err) {
      console.error('[UPDATE AVAILABILITY ERROR]', err);
      setToast({ message: 'Failed to update availability status.', type: 'error' });
    }
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

  if (!trainer) {
    return (
      <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
        <div className="page-inner" style={{ maxWidth: '600px' }}>
          <div className="card card-fire" style={{ textAlign: 'center', padding: '40px' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>Dashboard Offline</h3>
            <p style={{ fontSize: '13px', color: '#9090a0', margin: '0 0 20px 0' }}>Your trainer profile records could not be retrieved.</p>
            <button onClick={() => router.push('/login')} className="btn btn-outline" style={{ display: 'inline-flex', margin: '0 auto' }}>
              Relog in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totalEarnings = purchases.reduce((acc, curr) => acc + curr.trainerEarningsINR, 0);
  const activeClientsCount = new Set(purchases.map(p => p.clientId?.toString())).size;


  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
      

      <div className="page-inner">
        {/* Verification Status Banner */}
        {trainer.status === 'pending' && (
          <div className="card card-fire animate-slide-up" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '24px' }}>⏳</span>
            <div>
              <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', marginBottom: '3px' }}>
                Trainer Profile Application Pending Approval
              </h4>
              <p style={{ fontSize: '12px', color: '#9090a0', margin: 0 }}>
                Our system administrators are currently reviewing your credentials. You will be notified in your dashboard once approved.
              </p>
            </div>
          </div>
        )}

        {trainer.status === 'rejected' && (
          <div className="card card-fire animate-slide-up" style={{ marginBottom: '30px', borderColor: 'rgba(255,50,50,0.3)', background: 'rgba(255,50,50,0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '24px' }}>❌</span>
            <div>
              <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', marginBottom: '3px' }}>
                Application Declined
              </h4>
              <p style={{ fontSize: '12px', color: '#9090a0', margin: 0 }}>
                Reason: {trainer.adminNote || 'Does not satisfy minimal validation criteria.'}
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Title & Stats Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }} className="animate-slide-up">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Trainer Panel
            </h1>
            <p style={{ fontSize: '13.5px', color: '#9090a0', margin: 0 }}>
              Welcome back, <strong style={{ color: '#ffffff' }}>{trainer.name}</strong>
            </p>
          </div>

          {/* Quick Availability Switch */}
          {trainer.status === 'approved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0d0d14', border: '1px solid #22223a', borderRadius: '10px', padding: '6px 12px' }}>
              <span style={{ fontSize: '12px', color: '#9090a0', fontWeight: 500 }}>Availability:</span>
              <select
                value={trainer.availabilityStatus}
                onChange={(e) => handleUpdateAvailability(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#f07028',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="available" style={{ background: '#0d0d14', color: '#ffffff' }}>Available</option>
                <option value="busy" style={{ background: '#0d0d14', color: '#ffffff' }}>Busy</option>
                <option value="unavailable" style={{ background: '#0d0d14', color: '#ffffff' }}>Unavailable</option>
              </select>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }} className="animate-slide-up">
          <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '11px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Total Earnings
            </span>
            <strong style={{ fontSize: '22px', fontWeight: 800, color: '#1ed696' }}>
              ₹{totalEarnings.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '11px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Active Clients
            </span>
            <strong style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              {activeClientsCount}
            </strong>
          </div>

          <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '11px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Avg Profile Rating
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong style={{ fontSize: '22px', fontWeight: 800, color: '#f07028' }}>
                {trainer.averageRating > 0 ? trainer.averageRating.toFixed(1) : 'New'}
              </strong>
              {trainer.averageRating > 0 && <span style={{ fontSize: '13px', color: '#545870' }}>★ ({trainer.totalReviews})</span>}
            </div>
          </div>
        </div>

        {/* Client Subscriptions Table */}
        <div className="card animate-slide-up" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px', borderBottom: '1px solid #22223a', paddingBottom: '8px', color: '#ffffff' }}>
            Subscribed Clients & Purchases
          </h3>
          
          {purchases.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: '#545870', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              No subscriptions found yet. Subscribed client details will appear here once purchases complete!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #22223a', color: '#545870' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Plan Name</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Amount Paid</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Commission (15%)</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Net Earnings</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((pur) => (
                    <tr key={pur._id} style={{ borderBottom: '1px solid #13131e' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#ffffff' }}>{pur.planName}</td>
                      <td style={{ padding: '12px 8px', color: '#ffffff' }}>₹{pur.amountINR.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', color: '#9090a0' }}>₹{pur.platformCommissionINR.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', color: '#1ed696', fontWeight: 600 }}>₹{pur.trainerEarningsINR.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 8px', color: '#545870' }}>
                        {new Date(pur.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <style jsx global>{`
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
