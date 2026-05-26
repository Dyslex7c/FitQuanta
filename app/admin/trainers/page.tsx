'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Toast from '@/components/Toast';

export default function AdminTrainersPage() {
  const router = useRouter();
  const { token, user } = useSelector((s: RootState) => s.auth);

  const [pendingTrainers, setPendingTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Admin note updates per trainer
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchPendingTrainers = async () => {
    try {
      const res = await axios.get('/api/trainer/approve', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPendingTrainers(res.data.data);
      }
    } catch (err) {
      console.error('[FETCH PENDING TRAINERS ERROR]', err);
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

    fetchPendingTrainers();
  }, [token, user, router]);

  const handleAction = async (trainerId: string, action: 'approve' | 'reject' | 'suspend') => {
    const adminNote = adminNotes[trainerId] || '';
    if (action === 'reject' && !adminNote.trim()) {
      setToast({ message: 'Please specify a reason/note to reject an application.', type: 'error' });
      return;
    }

    try {
      const res = await axios.post(
        '/api/trainer/approve',
        { trainerId, action, adminNote: adminNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setToast({ message: `Trainer status updated successfully (${action}d)!`, type: 'success' });
        // Clean note
        setAdminNotes(prev => {
          const c = { ...prev };
          delete c[trainerId];
          return c;
        });
        fetchPendingTrainers();
      }
    } catch (err) {
      console.error('[TRAINER ACTION ERROR]', err);
      setToast({ message: 'Failed to update trainer status.', type: 'error' });
    }
  };

  const getSpecializationLabel = (spec: string) => {
    return spec.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>
      

      <div className="page-inner">
        {/* Header */}
        <div style={{ marginBottom: '32px' }} className="animate-slide-up">
          <h1 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Trainer Approvals Pipeline
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9090a0', margin: 0 }}>
            Inspect incoming professional application logs and update listing statuses
          </p>
        </div>

        {/* Verification list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span className="spinner" />
          </div>
        ) : pendingTrainers.length === 0 ? (
          <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '50px 24px', borderStyle: 'dashed' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>🏆</span>
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>No Pending Applications</h3>
            <p style={{ fontSize: '12.5px', color: '#545870', margin: 0 }}>
              All professional coaching requests are fully resolved! Check back later for new onboarding records.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {pendingTrainers.map((tr) => (
              <div key={tr._id} className="card animate-slide-up" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #22223a', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {tr.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#9090a0', margin: 0 }}>
                      Age: <strong style={{ color: '#ffffff' }}>{tr.age}</strong> •
                      Gender: <strong style={{ color: '#ffffff' }}>{tr.gender}</strong> •
                      Country: <strong style={{ color: '#ffffff' }}>{tr.country}</strong> •
                      Exp: <strong style={{ color: '#ffffff' }}>{tr.yearsOfExperience} Yrs</strong>
                    </p>
                  </div>
                  <span style={{ background: 'rgba(240,112,40,0.1)', color: '#f07028', border: '1px solid rgba(240,112,40,0.2)', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    Pending Verification
                  </span>
                </div>

                {/* Specialties */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {tr.specializations.map((spec: string) => (
                    <span key={spec} style={{ background: '#13131e', border: '1px solid #22223a', color: '#9090a0', fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px' }}>
                      {getSpecializationLabel(spec)}
                    </span>
                  ))}
                </div>

                {/* Bio excerpt */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#545870', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Biography Details
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#9090a0', lineHeight: '1.6', margin: 0 }}>
                    {tr.bio}
                  </p>
                </div>

                {/* Certificates */}
                {tr.certifications && tr.certifications.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#545870', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Onboarded Certifications
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {tr.certifications.map((cert: string, i: number) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #22223a', color: '#ffffff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                          📜 {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review inputs panel */}
                <div style={{ borderTop: '1px solid #22223a', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="label" htmlFor={`note-${tr._id}`} style={{ fontSize: '11px', textTransform: 'uppercase', color: '#545870' }}>
                      Admin Review note / Reason (Required for declination)
                    </label>
                    <input
                      id={`note-${tr._id}`}
                      type="text"
                      value={adminNotes[tr._id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [tr._id]: e.target.value }))}
                      placeholder="e.g. Valid certificates. Approved! or Missing NASM verification."
                      className="input"
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', width: '100%', maxWidth: '360px' }}>
                    <button
                      onClick={() => handleAction(tr._id, 'reject')}
                      className="btn btn-ghost"
                      style={{ flex: 1, border: '1px solid #22223a', color: '#ff4d4d', fontSize: '12px' }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(tr._id, 'approve')}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '12px' }}
                    >
                      Verify & Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
