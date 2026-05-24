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

  const getGoalLabel = (goal?: string) => {
    if (goal === 'fat_loss') return 'Fat Loss';
    if (goal === 'muscle_gain') return 'Muscle Gain';
    if (goal === 'maintenance') return 'Maintenance';
    return 'Not Set';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] bg-[#0a0a0f] py-10 px-6 font-body text-[#e2e8f0]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Medical Gate Banner */}
          {hasMedicalGate && (
            <div className="border-l-4 border-orange-500 bg-orange-500/10 rounded-r-xl px-6 py-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_0_15px_rgba(255,107,53,0.1)]">
              <div>
                <span className="font-bold text-orange-400">🏥 You have medical conditions on file. AI plan generation is disabled for your safety.</span>
                <p className="text-xs text-[#94a3b8] mt-1">Work with a certified trainer for a safe, personalised programme.</p>
              </div>
              <Link href="/trainer" className="inline-block px-4 py-2 border border-orange-500 text-orange-500 hover:bg-orange-500/10 rounded-xl text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,107,53,0.1)] text-center whitespace-nowrap">
                Find a Trainer &rarr;
              </Link>
            </div>
          )}

          {/* Welcome Screen */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-[#12121a] to-[#1a1a2e] p-8 rounded-2xl border border-[#1e1e2e] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-wide mb-2">
                Welcome back, <span className="text-[#00d4ff]">{user.name}</span>
              </h1>
              <p className="text-sm text-[#94a3b8]">
                Your futuristic AI fitness hub is fully optimized. Track progress and keep pushing.
              </p>
            </div>
            {user.bmi && (
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                <span className="text-xs font-semibold tracking-wider text-[#94a3b8] uppercase">Current BMI:</span>
                <span className="px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-full text-sm font-bold border border-[#00d4ff]/20">
                  {user.bmi} ({user.bmiCategory})
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats & BMI Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BMI Card */}
            <BMICard bmi={user.bmi} bmiCategory={user.bmiCategory} />

            {/* Quick Stats Card */}
            <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.3)] col-span-1 md:col-span-2">
              <h3 className="font-display text-sm font-semibold tracking-wider text-[#94a3b8] uppercase mb-6">
                Biometric Highlights
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <span className="block text-xs font-bold text-[#94a3b8] mb-1">Height</span>
                  <span className="text-2xl font-display font-extrabold text-[#e2e8f0]">{user.height || '--'} <span className="text-xs font-normal text-[#94a3b8]">cm</span></span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#94a3b8] mb-1">Weight</span>
                  <span className="text-2xl font-display font-extrabold text-[#e2e8f0]">{user.weight || '--'} <span className="text-xs font-normal text-[#94a3b8]">kg</span></span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#94a3b8] mb-1">Fitness Goal</span>
                  <span className="text-lg font-bold text-[#00d4ff]">{getGoalLabel(user.fitnessGoal)}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#94a3b8] mb-1">Fitness Level</span>
                  <span className="text-lg font-bold text-[#ff6b35] capitalize">{user.fitnessLevel || 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / CTA Panel */}
          <div>
            <h3 className="font-display text-lg font-bold tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!hasMedicalGate ? (
                <Link
                  href="/plans"
                  className="bg-[#12121a] hover:bg-[#1a1a2e] border border-[#1e1e2e] hover:border-[#00d4ff]/40 p-6 rounded-2xl flex flex-col justify-between items-start transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)] group"
                >
                  <div>
                    <h4 className="font-display font-bold text-xl text-[#00d4ff] mb-2 group-hover:drop-shadow-[0_0_5px_rgba(0,212,255,0.4)] transition-all">
                      {hasPlan ? 'View My Plan' : 'Generate AI Plan'}
                    </h4>
                    <p className="text-sm text-[#94a3b8]">
                      {hasPlan ? 'Inspect your customized diet & workout plan.' : 'Build a personalized workout & diet plan instantly.'}
                    </p>
                  </div>
                  <span className="mt-6 text-sm font-semibold text-[#00d4ff] flex items-center group-hover:translate-x-2 transition-transform duration-200">
                    Go to plans &rarr;
                  </span>
                </Link>
              ) : (
                <div className="bg-[#12121a]/50 border border-[#1e1e2e]/55 p-6 rounded-2xl opacity-60 cursor-not-allowed">
                  <h4 className="font-display font-bold text-xl text-[#94a3b8] mb-2">
                    AI Plan Generator
                  </h4>
                  <p className="text-sm text-[#94a3b8]">
                    Disabled for safety due to reported medical history.
                  </p>
                </div>
              )}

              <Link
                href="/progress"
                className="bg-[#12121a] hover:bg-[#1a1a2e] border border-[#1e1e2e] hover:border-[#ff6b35]/40 p-6 rounded-2xl flex flex-col justify-between items-start transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)] group"
              >
                <div>
                  <h4 className="font-display font-bold text-xl text-[#ff6b35] mb-2 group-hover:drop-shadow-[0_0_5px_rgba(255,107,53,0.4)] transition-all">
                    Log Progress
                  </h4>
                  <p className="text-sm text-[#94a3b8]">
                    Log workouts, nutrition macros, sleep hours, daily steps, and body weight.
                  </p>
                </div>
                <span className="mt-6 text-sm font-semibold text-[#ff6b35] flex items-center group-hover:translate-x-2 transition-transform duration-200">
                  Record stats &rarr;
                </span>
              </Link>

              <Link
                href="/progress"
                className="bg-[#12121a] hover:bg-[#1a1a2e] border border-[#1e1e2e] hover:border-[#00d4ff]/40 p-6 rounded-2xl flex flex-col justify-between items-start transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)] group"
              >
                <div>
                  <h4 className="font-display font-bold text-xl text-[#00d4ff] mb-2 group-hover:drop-shadow-[0_0_5px_rgba(0,212,255,0.4)] transition-all">
                    View Analytics
                  </h4>
                  <p className="text-sm text-[#94a3b8]">
                    Visualize historical trends for workouts, sleep, weight, and calorie intakes.
                  </p>
                </div>
                <span className="mt-6 text-sm font-semibold text-[#00d4ff] flex items-center group-hover:translate-x-2 transition-transform duration-200">
                  Analyze charts &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
