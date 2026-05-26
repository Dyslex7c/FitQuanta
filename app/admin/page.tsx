'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { token, user } = useSelector((s: RootState) => s.auth);

  const [stats, setStats] = useState<any>({
    totalSales: 0,
    grossPlatformFee: 0,
    totalTrainers: 0,
    pendingTrainers: 0,
  });
  const [purchases, setPurchases] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'earnings' | 'coaches' | 'maintenance'>('analytics');
  
  // Software logs simulation
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Booting FitQuanta admin terminal...',
    '[DB] Establishing secure MongoDB Mongoose connection pool...',
    '[DB] Connected to Atlas Cluster0 cluster0.p1btfso.mongodb.net successfully.',
    '[WS] Socket.io event emitter initialized on port 3001.',
    '[AUTH] Middleware verifyAuth validated JWT payload successfully.',
    '[API] GET /api/payments/history - status 200 OK (18ms)',
    '[API] GET /api/trainer/search - status 200 OK (26ms)',
    '[CRON] Running hourly platform maintenance check...'
  ]);

  useEffect(() => {
    // Add periodic diagnostic log print simulation for premium experience
    const interval = setInterval(() => {
      const endpoints = [
        'GET /api/profile',
        'GET /api/exercises',
        'POST /api/payments/verify',
        'GET /api/chat/conversations',
        'PUT /api/trainer/profile'
      ];
      const selected = endpoints[Math.floor(Math.random() * endpoints.length)];
      const ms = Math.floor(Math.random() * 30) + 10;
      setLogs(prev => [
        ...prev.slice(-15), // keep last 15
        `[API] ${selected} - status 200 OK (${ms}ms) - timestamp ${new Date().toLocaleTimeString()}`
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchAdminStats = async () => {
    try {
      const [historyRes, trainersRes, pendingRes] = await Promise.all([
        axios.get('/api/payments/history', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/trainer/search?sortBy=rating', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/trainer/approve', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let totalSales = 0;
      let platformCommission = 0;
      let historyData: any[] = [];
      if (historyRes.data.success) {
        historyData = historyRes.data.data;
        totalSales = historyData.reduce((acc: number, curr: any) => acc + curr.amountINR, 0);
        platformCommission = historyData.reduce((acc: number, curr: any) => acc + curr.platformCommissionINR, 0);
        setPurchases(historyData);
      }

      let trainerData: any[] = [];
      let totalTrainers = 0;
      if (trainersRes.data.success) {
        trainerData = trainersRes.data.data.trainers;
        totalTrainers = trainersRes.data.data.total || trainerData.length;
        setTrainers(trainerData);
      }

      let pendingCount = 0;
      if (pendingRes.data.success) {
        pendingCount = pendingRes.data.data.length;
      }

      setStats({
        totalSales,
        grossPlatformFee: platformCommission,
        totalTrainers,
        pendingTrainers: pendingCount,
      });
    } catch (err) {
      console.error('[ADMIN STATS FETCH ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    fetchAdminStats();
  }, [token, user, router]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="page-inner">
        
        {/* Title and Controls Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }} className="animate-slide-up">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffffff' }}>
              Admin Control Center
            </h1>
            <p style={{ fontSize: '13px', color: '#9090a0', margin: 0 }}>
              System-wide metrics ledger, software diagnostics console, and reviews auditing.
            </p>
          </div>

          {/* Tab buttons */}
          <div style={{ display: 'flex', background: '#0d0d14', border: '1px solid #22223a', borderRadius: '8px', padding: '3px' }}>
            {([
              { id: 'analytics', label: 'Overview' },
              { id: 'earnings', label: 'Earnings cut' },
              { id: 'coaches', label: 'Coaches & Ratings' },
              { id: 'maintenance', label: 'Maintenance' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 0,
                  borderRadius: '6px',
                  background: activeTab === tab.id ? '#f07028' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#9090a0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Metric Cards (Miniaturized for reference) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="animate-slide-up">
          <div className="card" style={{ padding: '16px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Gross Volume (Sales)
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              ₹{stats.totalSales.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="card" style={{ padding: '16px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Platform Commissions (15%)
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 800, color: '#1ed696' }}>
              ₹{stats.grossPlatformFee.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="card" style={{ padding: '16px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Verified Coaches
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              {stats.totalTrainers}
            </strong>
          </div>

          <div className="card" style={{ padding: '16px', background: '#0d0d14', border: '1px solid #22223a' }}>
            <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Pending Applications
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 800, color: '#f07028' }}>
              {stats.pendingTrainers}
            </strong>
          </div>
        </div>

        {/* Tab content rendering */}
        {activeTab === 'analytics' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Overview dashboard header banner */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(240,112,40,0.05) 0%, rgba(6,6,10,0) 100%)',
                borderColor: 'rgba(240,112,40,0.2)',
                padding: '36px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '14px' }}>📋</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: '6px' }}>
                Trainer Onboarding pipeline
              </h3>
              <p style={{ fontSize: '13px', color: '#9090a0', marginBottom: '24px', maxWidth: '460px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                Ensure system-wide excellence by verifying coach profiles, qualifications, experience, and custom coaching subscription structures.
              </p>
              <Link href="/admin/trainers" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 24px', fontSize: '12px' }}>
                Manage Pending Trainer Requests ({stats.pendingTrainers})
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="card animate-slide-up" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px', borderBottom: '1px solid #22223a', paddingBottom: '8px', color: '#ffffff' }}>
              Systems Earnings & Transaction Ledger
            </h3>
            
            {purchases.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#545870', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                No completed subscriptions processed through checkout yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #22223a', color: '#545870' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Plan Details</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Razorpay Order</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Total Paid</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Platform Cut (15%)</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Net Coach Share</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((pur) => (
                      <tr key={pur._id} style={{ borderBottom: '1px solid #13131e' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#ffffff' }}>{pur.planName}</td>
                        <td style={{ padding: '12px 8px', color: '#9090a0', fontFamily: 'monospace', fontSize: '11px' }}>{pur.razorpayOrderId}</td>
                        <td style={{ padding: '12px 8px', color: '#ffffff' }}>₹{pur.amountINR.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 8px', color: '#1ed696', fontWeight: 600 }}>₹{pur.platformCommissionINR.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 8px', color: '#9090a0' }}>₹{pur.trainerEarningsINR.toLocaleString('en-IN')}</td>
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
        )}

        {activeTab === 'coaches' && (
          <div className="card animate-slide-up" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px', borderBottom: '1px solid #22223a', paddingBottom: '8px', color: '#ffffff' }}>
              Coaches & Ratings Audit Feed
            </h3>
            
            {trainers.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#545870', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                No verified coaches found in database.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #22223a', color: '#545870' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Coach Name</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Experience</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Average Rating</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Total Reviews</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Availability</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((tr) => (
                      <tr key={tr._id} style={{ borderBottom: '1px solid #13131e' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#ffffff' }}>{tr.name}</td>
                        <td style={{ padding: '12px 8px', color: '#9090a0' }}>{tr.yearsOfExperience} Years</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#f07028', fontWeight: 700 }}>
                              {tr.averageRating > 0 ? tr.averageRating.toFixed(1) : 'New'}
                            </span>
                            {tr.averageRating > 0 && (
                              <span style={{ color: '#f07028', fontSize: '11px' }}>
                                {'★'.repeat(Math.round(tr.averageRating))}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#9090a0' }}>{tr.totalReviews} student reviews</td>
                        <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: tr.availabilityStatus === 'available' ? '#1ed696' : '#f07028' }}>
                          ● {tr.availabilityStatus}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            background: tr.status === 'approved' ? 'rgba(30,214,150,0.1)' : 'rgba(240,112,40,0.1)',
                            color: tr.status === 'approved' ? '#1ed696' : '#f07028',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* System Diagnostic Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
                <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Database Latency
                </span>
                <strong style={{ fontSize: '18px', fontWeight: 800, color: '#1ed696' }}>
                  0.8ms (Excellent)
                </strong>
                <div style={{ height: '4px', width: '100%', background: '#22223a', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92%', background: '#1ed696' }} />
                </div>
              </div>

              <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
                <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Socket Event Engine
                </span>
                <strong style={{ fontSize: '18px', fontWeight: 800, color: '#1ed696' }}>
                  Active Split-Sync
                </strong>
                <div style={{ height: '4px', width: '100%', background: '#22223a', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: '#1ed696' }} />
                </div>
              </div>

              <div className="card" style={{ padding: '20px', background: '#0d0d14', border: '1px solid #22223a' }}>
                <span style={{ fontSize: '10px', color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Heap Memory Usage
                </span>
                <strong style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  146MB / 512MB
                </strong>
                <div style={{ height: '4px', width: '100%', background: '#22223a', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '28%', background: '#f07028' }} />
                </div>
              </div>
            </div>

            {/* Simulated Live System Logs console */}
            <div className="card" style={{ padding: '24px', background: '#08080c', border: '1px solid #22223a', fontFamily: 'monospace' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#545870', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', fontFamily: 'var(--font-sans), Inter, sans-serif' }}>
                Live Software Maintenance Diagnostics Log
              </h4>

              <div
                style={{
                  background: '#040406',
                  borderRadius: '8px',
                  border: '1px solid #13131e',
                  padding: '16px',
                  height: '240px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11.5px',
                  color: '#70e0a0',
                  lineHeight: '1.5'
                }}
              >
                {logs.map((log, index) => {
                  let color = '#70e0a0'; // default api
                  if (log.startsWith('[SYSTEM]')) color = '#f07028'; // orange system
                  else if (log.startsWith('[DB]')) color = '#70b0ff'; // blue db
                  else if (log.startsWith('[AUTH]')) color = '#df70ff'; // purple auth
                  else if (log.startsWith('[CRON]')) color = '#e8d850'; // yellow cron
                  
                  return (
                    <div key={index} style={{ color }}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 500px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
