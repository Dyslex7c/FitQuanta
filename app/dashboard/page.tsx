'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BMICard from '@/components/BMICard';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import api from '@/lib/axiosInstance';

function DashboardContent({ user }: { user: any }) {
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/plans')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setHasPlan(true);
        }
      })
      .catch(() => {
        setHasPlan(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hasMedicalGate =
    (user.medicalConditions?.filter((c: string) => c.trim()).length ?? 0) > 0 ||
    (user.injuries?.filter((i: string) => i.trim()).length ?? 0) > 0;

  return (
    <div className="page-wrapper">
      <div className="page-inner animate-fade-in">
        
        {/* Medical gate banner */}
        {hasMedicalGate && (
          <div className="alert-warning" style={{ marginBottom: '24px' }}>
            <span style={{ color: '#ff6b2b', fontSize: '15px', flexShrink: 0 }}>⚠</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#ff6b2b', marginBottom: '3px' }}>AI plan unavailable</p>
              <p style={{ fontSize: '12px', color: '#9090a0' }}>Medical conditions on file. Work with a certified trainer for a safe programme.</p>
            </div>
            <Link href="/trainer" className="btn btn-fire btn-sm" style={{ flexShrink: 0 }}>Find trainer</Link>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p className="section-title" style={{ marginBottom: '6px' }}>Welcome back</p>
          <h1>{user.name}</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          <div className="stat-block">
            <span className="stat-label">BMI</span>
            <span className="stat-value">{user.bmi ?? '—'}</span>
            <span className={`stat-sub ${user.bmiCategory ? 'bmi-' + user.bmiCategory.toLowerCase() : ''}`}>
              {user.bmiCategory ?? 'Not set'}
            </span>
            {user.bmi && (
              <div className="bmi-track">
                <div className={`bmi-fill-${user.bmiCategory?.toLowerCase() ?? 'normal'}`}
                  style={{ width: `${Math.min(((user.bmi - 10) / 30) * 100, 100)}%` }} />
              </div>
            )}
          </div>
          <div className="stat-block">
            <span className="stat-label">Weight</span>
            <span className="stat-value">{user.weight ?? '—'}<span style={{ fontSize: '14px', color: '#545870', marginLeft: '3px', fontWeight: 400 }}>kg</span></span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Goal</span>
            <span className="stat-value" style={{ fontSize: '16px', textTransform: 'capitalize' }}>{user.fitnessGoal?.replace('_', ' ') ?? '—'}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Plan</span>
            <span className={`stat-value ${hasPlan ? 'stat-value-emerald' : ''}`} style={{ fontSize: '16px' }}>
              {hasPlan ? 'Active' : 'None'}
            </span>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px' }}>
          {!hasMedicalGate ? (
            <Link href="/plans" className="card-interactive">
              <p className="section-title-cyan" style={{ marginBottom: '7px' }}>My Plan</p>
              <p style={{ fontSize: '12px', color: '#9090a0' }}>View AI-generated workout and diet plan</p>
            </Link>
          ) : (
            <div className="card opacity-60 cursor-not-allowed">
              <p className="section-title" style={{ marginBottom: '7px' }}>My Plan</p>
              <p style={{ fontSize: '12px', color: '#9090a0' }}>Disabled due to reported medical history</p>
            </div>
          )}
          <Link href="/progress" className="card-interactive">
            <p className="section-title" style={{ marginBottom: '7px' }}>Progress</p>
            <p style={{ fontSize: '12px', color: '#9090a0' }}>Log activity and visualise your charts</p>
          </Link>
          <Link href="/trainer" className="card-interactive">
            <p className="section-title-cyan" style={{ marginBottom: '7px' }}>Trainers</p>
            <p style={{ fontSize: '12px', color: '#9090a0' }}>Hire a certified coach for custom splits & chat</p>
          </Link>
          <Link href="/purchases" className="card-interactive">
            <p className="section-title-cyan" style={{ marginBottom: '7px' }}>Coaching & Billing</p>
            <p style={{ fontSize: '12px', color: '#9090a0' }}>Manage subscriptions, leaves, and reviews</p>
          </Link>
        </div>


      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <ProtectedRoute>
      {user && <DashboardContent user={user} />}
    </ProtectedRoute>
  );
}

