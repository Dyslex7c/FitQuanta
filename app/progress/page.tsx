'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import WeightChart from '@/components/charts/WeightChart';
import WorkoutChart from '@/components/charts/WorkoutChart';
import NutritionChart from '@/components/charts/NutritionChart';
import CalorieChart from '@/components/charts/CalorieChart';
import SleepChart from '@/components/charts/SleepChart';
import StepsChart from '@/components/charts/StepsChart';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { progressLogSchema, ProgressLogInput } from '@/schemas/progressLogSchema';
import type { IProgressLog, IExerciseEntry } from '@/types/progress';
import axios from 'axios';

export default function ProgressPage() {
  const [activeFormTab, setActiveFormTab] = useState<'workout' | 'nutrition' | 'health'>('workout');
  const [logs, setLogs] = useState<IProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Temporary list for adding exercises to a single workout log
  const [tempExercises, setTempExercises] = useState<IExerciseEntry[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState(60);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/progress');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgressLogInput>({
    resolver: zodResolver(progressLogSchema),
    defaultValues: {
      date: new Date().toISOString(),
      type: 'workout',
      exercises: [],
    },
  });

  const addTempExercise = () => {
    if (!exName.trim()) return;
    setTempExercises((prev) => [
      ...prev,
      { name: exName.trim(), sets: exSets, reps: exReps, weight: exWeight },
    ]);
    setExName('');
  };

  const removeTempExercise = (index: number) => {
    setTempExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProgressLogInput) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        date: data.date,
        type: activeFormTab,
      };

      if (activeFormTab === 'workout') {
        if (tempExercises.length === 0) {
          setErrorMsg('Please add at least one exercise to your workout log.');
          setSubmitting(false);
          return;
        }
        payload.exercises = tempExercises;
      } else if (activeFormTab === 'nutrition') {
        payload.calories = data.calories;
        payload.protein = data.protein;
        payload.carbs = data.carbs;
        payload.fats = data.fats;
      } else if (activeFormTab === 'health') {
        payload.sleepHours = data.sleepHours;
        payload.steps = data.steps;
        payload.bodyWeight = data.bodyWeight;
      }

      const res = await axios.post('/api/progress/log', payload);
      if (res.data.success) {
        reset();
        setTempExercises([]);
        fetchLogs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit log entry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract subset data for each chart
  const weightData = logs
    .filter((l) => l.type === 'health' && l.bodyWeight !== undefined)
    .map((l) => ({ date: l.date, bodyWeight: l.bodyWeight! }));

  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] bg-[#0a0a0f] py-10 px-6 font-body text-[#e2e8f0]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35] mb-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.2)]">
              Progress & Logs Analytics
            </h1>
            <p className="text-sm text-[#94a3b8]">
              Record your metrics and view real-time charts powered by Recharts.
            </p>
          </div>

          {/* Form and Input Panel */}
          <div className="bg-[#12121a] p-8 rounded-2xl border border-[#1e1e2e] shadow-[0_0_20px_rgba(0,0,0,0.3)] max-w-2xl mx-auto">
            <h2 className="font-display text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35] mb-6">
              Log Daily Metric
            </h2>

            {/* Form Tab Toggles */}
            <div className="flex bg-[#0a0a0f] p-1.5 rounded-xl border border-[#1e1e2e] mb-6">
              {(['workout', 'nutrition', 'health'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(t);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                    activeFormTab === t
                      ? 'bg-[#00d4ff] text-[#0a0a0f] shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('date')}
                  defaultValue={new Date().toISOString().substring(0, 16)}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                />
              </div>

              {/* Workout Fields */}
              {activeFormTab === 'workout' && (
                <div className="space-y-4 border-t border-[#1e1e2e] pt-4">
                  <h4 className="text-sm font-bold text-[#00d4ff] mb-2">Workout Exercises</h4>
                  
                  {/* Temp Exercise List */}
                  {tempExercises.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {tempExercises.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded-xl border border-[#1e1e2e]">
                          <div>
                            <span className="font-bold text-sm text-[#e2e8f0]">{ex.name}</span>
                            <span className="block text-[10px] text-[#94a3b8]">
                              {ex.sets} sets &times; {ex.reps} reps @ {ex.weight} kg
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTempExercise(i)}
                            className="text-red-500 hover:text-red-400 text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Exercise Panel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0a0f] p-4 rounded-xl border border-[#1e1e2e]">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Exercise Name</label>
                      <input
                        type="text"
                        value={exName}
                        onChange={(e) => setExName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                        placeholder="e.g. Bench Press"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Sets</label>
                      <input
                        type="number"
                        value={exSets}
                        onChange={(e) => setExSets(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Reps</label>
                      <input
                        type="number"
                        value={exReps}
                        onChange={(e) => setExReps(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={exWeight}
                        onChange={(e) => setExWeight(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 pt-2">
                      <button
                        type="button"
                        onClick={addTempExercise}
                        className="w-full py-2 bg-[#1e1e2e] hover:bg-[#1e1e2e]/80 text-[#00d4ff] border border-[#00d4ff]/20 text-xs font-bold rounded-lg transition-all"
                      >
                        + Add Exercise to List
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition Fields */}
              {activeFormTab === 'nutrition' && (
                <div className="grid grid-cols-2 gap-4 border-t border-[#1e1e2e] pt-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      {...register('calories', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 2100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Protein (g)</label>
                    <input
                      type="number"
                      {...register('protein', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 140"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      {...register('carbs', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 220"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Fats (g)</label>
                    <input
                      type="number"
                      {...register('fats', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 70"
                    />
                  </div>
                </div>
              )}

              {/* Health Fields */}
              {activeFormTab === 'health' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#1e1e2e] pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Sleep Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('sleepHours', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 7.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Daily Steps</label>
                    <input
                      type="number"
                      {...register('steps', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 10000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('bodyWeight', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm"
                      placeholder="e.g. 72.4"
                    />
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#00d4ff] text-[#0a0a0f] rounded-xl font-bold hover:bg-[#0099bb] shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving Entry...' : 'Save Log Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* Charts Grid */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wider mb-8 text-center md:text-left">
              Metric Progress Charts
            </h2>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Weight Progress */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Weight Progress
                  </h3>
                  <WeightChart data={weightData} />
                </div>

                {/* 2. Workout Volume Progress */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Workout Volume
                  </h3>
                  <WorkoutChart logs={logs} />
                </div>

                {/* 3. Nutrition Macros */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Nutrition Breakdown
                  </h3>
                  <NutritionChart logs={logs} />
                </div>

                {/* 4. Calories Intake */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Calorie Intake vs. Target
                  </h3>
                  <CalorieChart logs={logs} />
                </div>

                {/* 5. Sleep Hours */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Sleep Analysis
                  </h3>
                  <SleepChart logs={logs} />
                </div>

                {/* 6. Daily Steps */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Steps Walked
                  </h3>
                  <StepsChart logs={logs} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
