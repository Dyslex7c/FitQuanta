'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BMICard from '@/components/BMICard';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import api from '@/lib/axiosInstance';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

  if (!user) return null;

  const hasMedicalGate =
    (user.medicalConditions?.filter((c) => c.trim()).length ?? 0) > 0 ||
    (user.injuries?.filter((i) => i.trim()).length ?? 0) > 0;

  return (
    <ProtectedRoute>
      <div className="page-wrapper">
        <div className="page-content space-y-6">

          {/* Page header */}
          <div className="mb-8 animate-fade-in">
            <p className="text-text-muted text-sm mb-1">Welcome back,</p>
            <h1 className="page-title text-cyan">{user.name}</h1>
          </div>

          {/* Medical banner — only if conditions exist, keep existing logic */}
          {hasMedicalGate && (
            <div className="alert-warning mb-6 flex items-start gap-3 animate-fade-in">
              <span className="text-orange text-lg mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-orange text-sm mb-1">AI plan unavailable</p>
                <p className="text-text-muted text-sm">Medical conditions detected. Consult a certified trainer for a safe, personalised programme.</p>
              </div>
              <Link href="/trainer" className="ml-auto btn-secondary text-xs px-4 py-1.5 shrink-0">
                Find trainer
              </Link>
            </div>
          )}

          {/* Stats row & BMI Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BMI Card */}
            <BMICard bmi={user.bmi} bmiCategory={user.bmiCategory} />

            {/* Quick Stats Grid */}
            <div className="bg-surface p-6 rounded-lg border border-border shadow-sm col-span-1 md:col-span-2">
              <h3 className="section-title text-sm mb-6">Biometric Highlights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="stat-card bg-transparent border-0 p-0 shadow-none">
                  <span className="stat-label">Height</span>
                  <span className="stat-value">{user.height || '--'}<span className="text-xs font-normal text-text-muted ml-1">cm</span></span>
                </div>
                <div className="stat-card bg-transparent border-0 p-0 shadow-none">
                  <span className="stat-label">Weight</span>
                  <span className="stat-value">{user.weight || '--'}<span className="text-xs font-normal text-text-muted ml-1">kg</span></span>
                </div>
                <div className="stat-card bg-transparent border-0 p-0 shadow-none">
                  <span className="stat-label">Goal</span>
                  <span className="stat-value text-base capitalize">{user.fitnessGoal?.replace('_', ' ') ?? '—'}</span>
                </div>
                <div className="stat-card bg-transparent border-0 p-0 shadow-none">
                  <span className="stat-label">Plan</span>
                  <span className="stat-value text-base">{hasPlan ? 'Active' : 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA cards */}
          <div className="pt-4">
            <h3 className="section-title text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!hasMedicalGate ? (
                <Link href="/plans" className="card-hover group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="card-title font-display text-sm font-bold tracking-wider uppercase text-cyan">My Plan</span>
                    <span className="text-cyan group-hover:translate-x-1 transition-transform duration-150">→</span>
                  </div>
                  <p className="text-text-muted text-sm">
                    {hasPlan ? 'Inspect your customized diet & workout plan.' : 'Build a personalized workout & diet plan instantly.'}
                  </p>
                </Link>
              ) : (
                <div className="card opacity-60 cursor-not-allowed">
                  <div className="flex items-center justify-between mb-3">
                    <span className="card-title font-display text-sm font-bold tracking-wider uppercase text-text-muted">AI Plan Generator</span>
                  </div>
                  <p className="text-text-muted text-sm">
                    Disabled for safety due to reported medical history.
                  </p>
                </div>
              )}

              <Link href="/progress" className="card-hover group">
                <div className="flex items-center justify-between mb-3">
                  <span className="card-title font-display text-sm font-bold tracking-wider uppercase text-orange">Log Progress</span>
                  <span className="text-orange group-hover:translate-x-1 transition-transform duration-150">→</span>
                </div>
                <p className="text-text-muted text-sm">Log workouts, nutrition macros, sleep hours, daily steps, and body weight.</p>
              </Link>

              <Link href="/progress" className="card-hover group">
                <div className="flex items-center justify-between mb-3">
                  <span className="card-title font-display text-sm font-bold tracking-wider uppercase text-cyan">View Analytics</span>
                  <span className="text-cyan group-hover:translate-x-1 transition-transform duration-150">→</span>
                </div>
                <p className="text-text-muted text-sm">Visualize historical trends for workouts, sleep, weight, and calorie intakes.</p>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
