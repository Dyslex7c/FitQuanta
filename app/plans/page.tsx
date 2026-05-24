'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axios from 'axios';
import type { IPlan } from '@/types/plan';

export default function PlansPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [plan, setPlan] = useState<IPlan | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      const res = await axios.get('/api/plans');
      if (res.data.success) {
        setPlan(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setErrorMsg('Failed to load fitness plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const hasMedicalRisk =
        (user.medicalConditions?.filter((c) => c.trim()).length ?? 0) > 0 ||
        (user.injuries?.filter((i) => i.trim()).length ?? 0) > 0;

      if (hasMedicalRisk) {
        setBlocked(true);
        setBlockedReason(
          'Due to your reported medical conditions or injuries, we cannot safely generate an AI plan. Please consult a certified trainer on our platform.'
        );
        setLoading(false);
      } else {
        fetchPlan();
      }
    }
  }, [user]);

  const generatePlan = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/plans/generate');
      if (res.data.success) {
        if (res.data.data.blocked) {
          setBlocked(true);
          setBlockedReason(res.data.data.reason);
        } else {
          setPlan(res.data.data);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Plan generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] bg-[#0a0a0f] py-10 px-6 font-body text-[#e2e8f0]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35] mb-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.2)]">
              Your Training & Diet Plan
            </h1>
            <p className="text-sm text-[#94a3b8]">
              Evidence-based, structured templates tailored to your biometrics.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl text-sm text-center">
              {errorMsg}
            </div>
          )}

          {/* Medical Safety Gate / Blocked Card */}
          {blocked ? (
            <div className="bg-[#ff6b35]/10 border-2 border-[#ff6b35] p-8 rounded-2xl shadow-[0_0_25px_rgba(255,107,53,0.2)] text-center space-y-6">
              <div className="w-16 h-16 bg-[#ff6b35]/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                <svg className="w-8 h-8 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="max-w-lg mx-auto">
                <h3 className="font-display text-2xl font-bold text-[#ff6b35] mb-2">AI Plan Generation Blocked</h3>
                <p className="text-sm text-[#e2e8f0] leading-relaxed">
                  {blockedReason}
                </p>
              </div>
              <div>
                <button className="px-6 py-3 bg-[#ff6b35] text-[#0a0a0f] rounded-xl font-bold hover:bg-[#cc5222] shadow-[0_0_15px_rgba(255,107,53,0.3)] transition-all">
                  Find a Certified Trainer
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.4)]"></div>
            </div>
          ) : !plan ? (
            // No Plan generated state
            <div className="bg-[#12121a] p-8 rounded-2xl border border-[#1e1e2e] text-center space-y-6 py-12">
              <h3 className="font-display text-xl font-bold">No Plan Generated Yet</h3>
              <p className="text-sm text-[#94a3b8] max-w-md mx-auto">
                Calculate your BMI and let our Llama 3 models craft a custom workout and nutrition plan.
              </p>
              <button
                onClick={generatePlan}
                disabled={generating}
                className="px-6 py-3 bg-[#00d4ff] text-[#0a0a0f] rounded-xl font-bold hover:bg-[#0099bb] shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50"
              >
                {generating ? 'Generating Plan...' : 'Generate AI Plan'}
              </button>
            </div>
          ) : (
            // Render Plan
            <div className="space-y-6">
              {/* Tab Toggles */}
              <div className="flex justify-center bg-[#12121a] p-1.5 rounded-xl border border-[#1e1e2e] max-w-xs mx-auto">
                <button
                  onClick={() => setActiveTab('workout')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'workout'
                      ? 'bg-[#00d4ff] text-[#0a0a0f] shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  Workout Plan
                </button>
                <button
                  onClick={() => setActiveTab('diet')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'diet'
                      ? 'bg-[#00d4ff] text-[#0a0a0f] shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  Diet Plan
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-4">
                {activeTab === 'workout' ? (
                  plan.workoutPlan.map((dayPlan, idx) => (
                    <div
                      key={idx}
                      className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.15)]"
                    >
                      <button
                        onClick={() => toggleDay(dayPlan.day)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1a1a2e]/40 transition-colors"
                      >
                        <h4 className="font-display font-bold text-lg text-[#00d4ff]">
                          {dayPlan.day}
                        </h4>
                        <span className="text-[#94a3b8] text-sm">
                          {expandedDay === dayPlan.day ? 'Hide Exercises ▲' : 'Show Exercises ▼'}
                        </span>
                      </button>
                      
                      {expandedDay === dayPlan.day && (
                        <div className="px-6 pb-6 border-t border-[#1e1e2e] pt-4 bg-[#0a0a0f]/50 space-y-4">
                          {dayPlan.exercises.length === 0 ? (
                            <p className="text-sm text-[#94a3b8] italic">Rest Day - Recovery is essential.</p>
                          ) : (
                            dayPlan.exercises.map((ex, eIdx) => (
                              <div key={eIdx} className="flex justify-between items-center bg-[#12121a] p-4 rounded-xl border border-[#1e1e2e]">
                                <div>
                                  <h5 className="font-bold text-[#e2e8f0]">{ex.name}</h5>
                                  <p className="text-xs text-[#94a3b8] mt-1">Rest: {ex.rest}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <span className="px-2 py-1 bg-[#1e1e2e] text-[#e2e8f0] text-xs font-bold rounded-lg">
                                    {ex.sets} sets
                                  </span>
                                  <span className="px-2 py-1 bg-[#1e1e2e] text-[#e2e8f0] text-xs font-bold rounded-lg">
                                    {ex.reps} reps
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  plan.dietPlan.map((dayPlan, idx) => (
                    <div
                      key={idx}
                      className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.15)]"
                    >
                      <button
                        onClick={() => toggleDay(dayPlan.day)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1a1a2e]/40 transition-colors"
                      >
                        <h4 className="font-display font-bold text-lg text-[#ff6b35]">
                          {dayPlan.day}
                        </h4>
                        <span className="text-[#94a3b8] text-sm">
                          {expandedDay === dayPlan.day ? 'Hide Meals ▲' : 'Show Meals ▼'}
                        </span>
                      </button>

                      {expandedDay === dayPlan.day && (
                        <div className="px-6 pb-6 border-t border-[#1e1e2e] pt-4 bg-[#0a0a0f]/50 space-y-4">
                          {dayPlan.meals.map((meal, mIdx) => (
                            <div key={mIdx} className="bg-[#12121a] p-4 rounded-xl border border-[#1e1e2e] space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold text-[#e2e8f0]">{meal.name}</h5>
                                <div className="flex flex-wrap gap-2">
                                  {/* protein: cyan */}
                                  <span className="px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 text-[10px] font-bold rounded-full">
                                    P: {meal.protein}g
                                  </span>
                                  {/* carbs: orange */}
                                  <span className="px-2 py-0.5 bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20 text-[10px] font-bold rounded-full">
                                    C: {meal.carbs}g
                                  </span>
                                  {/* fats: yellow */}
                                  <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[10px] font-bold rounded-full">
                                    F: {meal.fats}g
                                  </span>
                                  {/* calories: white/muted */}
                                  <span className="px-2 py-0.5 bg-white/5 text-[#e2e8f0] border border-white/10 text-[10px] font-bold rounded-full">
                                    {meal.calories} kcal
                                  </span>
                                </div>
                              </div>
                              <ul className="text-xs text-[#94a3b8] list-disc list-inside space-y-1">
                                {meal.foods.map((food, fIdx) => (
                                  <li key={fIdx}>{food}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Re-generate CTA */}
              <div className="text-center pt-6">
                <button
                  onClick={generatePlan}
                  disabled={generating}
                  className="px-6 py-3 border border-[#00d4ff] text-[#00d4ff] rounded-xl font-bold hover:bg-[#00d4ff]/10 shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all"
                >
                  {generating ? 'Re-generating...' : 'Re-generate AI Plan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
