'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import WeightChart from '@/components/charts/WeightChart';
import WorkoutChart from '@/components/charts/WorkoutChart';
import NutritionChart from '@/components/charts/NutritionChart';
import CalorieChart from '@/components/charts/CalorieChart';
import SleepChart from '@/components/charts/SleepChart';
import StepsChart from '@/components/charts/StepsChart';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { progressLogSchema, ProgressLogInput } from '@/schemas/progressLogSchema';
import type { IProgressLog } from '@/types/progress';
import api from '@/lib/axiosInstance';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from '@/components/Toast';
import {
  getWeightData,
  getMacroData,
  getCalorieData,
  getSleepData,
  getStepsData,
} from '@/lib/chartUtils';

// Helper to construct a datetime string in IST (UTC+5:30) for datetime-local inputs
const getLocalDatetimeString = () => {
  const now = new Date();
  // IST is UTC+5:30 = 330 minutes ahead
  const istOffset = 330 * 60000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + istOffset);
  return istTime.toISOString().substring(0, 16);
};

export default function ProgressPage() {
  const [activePageTab, setActivePageTab] = useState<'log' | 'analytics'>('log');
  const [activeFormTab, setActiveFormTab] = useState<'workout' | 'nutrition' | 'health'>('workout');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Read tab parameter from URL query parameter or hash to set the initial page view tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'analytics' || window.location.hash === '#charts') {
        setActivePageTab('analytics');
      } else if (tab === 'log' || window.location.hash === '#log') {
        setActivePageTab('log');
      }
    }
  }, []);

  // Temporary state for adding a single exercise dynamically before appending to form field array
  const [tempExercise, setTempExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: 60,
  });

  // Temporary state for adding a single cardio activity dynamically
  const [tempCardio, setTempCardio] = useState({
    activity: '',
    durationMinutes: 30,
  });

  const queryClient = useQueryClient();

  // Fetch progress logs using TanStack React Query
  const { data: logsData, isLoading, error } = useQuery<IProgressLog[]>({
    queryKey: ['progressLogs'],
    queryFn: async () => {
      const res = await api.get('/progress');
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data.message || 'Failed to fetch progress logs.');
    },
    refetchOnWindowFocus: true,
  });

  const logs = logsData || [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgressLogInput>({
    resolver: zodResolver(progressLogSchema),
    defaultValues: {
      date: getLocalDatetimeString(),
      type: 'workout',
      exercises: [],
      cardio: [],
      notes: '',
    },
  });

  // Field arrays for exercises (Workout tab)
  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control,
    name: 'exercises',
  });

  // Field arrays for cardio (Health tab)
  const {
    fields: cardioFields,
    append: appendCardio,
    remove: removeCardio,
  } = useFieldArray({
    control,
    name: 'cardio',
  });

  // Handle adding exercise to form field array
  const addExerciseToList = () => {
    if (!tempExercise.name.trim()) return;
    appendExercise({
      name: tempExercise.name.trim(),
      sets: Number(tempExercise.sets) || 1,
      reps: Number(tempExercise.reps) || 1,
      weight: Number(tempExercise.weight) || 0,
    });
    setTempExercise({ name: '', sets: 3, reps: 10, weight: 60 });
  };

  // Handle adding cardio to form field array
  const addCardioToList = () => {
    if (!tempCardio.activity.trim()) return;
    appendCardio({
      activity: tempCardio.activity.trim(),
      durationMinutes: Number(tempCardio.durationMinutes) || 1,
    });
    setTempCardio({ activity: '', durationMinutes: 30 });
  };

  const onSubmit = async (data: ProgressLogInput) => {
    setSubmitting(true);
    try {
      const payload: any = {
        date: new Date(data.date).toISOString(),
        type: activeFormTab,
        notes: data.notes || undefined,
      };

      if (activeFormTab === 'workout') {
        if (exerciseFields.length === 0) {
          setToast({
            message: 'Please add at least one exercise to your workout log.',
            type: 'error',
          });
          setSubmitting(false);
          return;
        }
        payload.exercises = data.exercises;
      } else if (activeFormTab === 'nutrition') {
        payload.calories = data.calories;
        payload.protein = data.protein;
        payload.carbs = data.carbs;
        payload.fats = data.fats;
      } else if (activeFormTab === 'health') {
        payload.sleepHours = data.sleepHours;
        payload.steps = data.steps;
        payload.bodyWeight = data.bodyWeight;
        if (data.cardio && data.cardio.length > 0) {
          payload.cardio = data.cardio;
        }
      }

      const res = await api.post('/progress/log', payload);
      if (res.data.success) {
        setToast({ message: 'Log entry saved successfully!', type: 'success' });
        reset({
          date: getLocalDatetimeString(),
          type: activeFormTab,
          exercises: [],
          cardio: [],
          notes: '',
        });
        queryClient.invalidateQueries({ queryKey: ['progressLogs'] });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Failed to save log entry.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="page-wrapper">
        <div className="page-content space-y-12">
          {/* Header */}
          <div className="mb-8 animate-fade-in text-center md:text-left">
            <h1 className="page-title text-cyan">Progress & Logs</h1>
            <p className="text-text-muted text-sm mt-1">
              Record your metrics and view real-time charts powered by Recharts.
            </p>
          </div>

          {/* Main Switcher Tab Bar */}
          <div className="tab-bar max-w-md mx-auto mb-8">
            <button
              type="button"
              onClick={() => setActivePageTab('log')}
              className={`${activePageTab === 'log' ? 'tab-item-active' : 'tab-item'} font-semibold`}
            >
              Log Progress
            </button>
            <button
              type="button"
              onClick={() => setActivePageTab('analytics')}
              className={`${activePageTab === 'analytics' ? 'tab-item-active' : 'tab-item'} font-semibold`}
            >
              View Analytics
            </button>
          </div>

          {activePageTab === 'log' ? (
            /* Form and Input Panel */
            <div className="card max-w-2xl mx-auto">
              <h2 className="section-title text-base mb-6">
                Log Daily Metric
              </h2>

              {/* Form Tab Toggles */}
              <div className="tab-bar mb-6">
                {(['workout', 'nutrition', 'health'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setActiveFormTab(t);
                    }}
                    className={`${activeFormTab === t ? 'tab-item-active' : 'tab-item'} capitalize`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Input */}
                <div>
                  <label className="label">Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('date')}
                    className={`input ${errors.date ? 'input-error' : ''}`}
                  />
                  {errors.date && <p className="error-msg">{errors.date.message}</p>}
                </div>

                {/* Workout Fields */}
                {activeFormTab === 'workout' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="text-sm font-bold text-cyan mb-2">Workout Exercises</h4>

                    {/* Exercise List */}
                    {exerciseFields.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {exerciseFields.map((field, i) => (
                          <div
                            key={field.id}
                            className="flex justify-between items-center bg-raised p-3 rounded-lg border border-border"
                          >
                            <div>
                              <span className="font-semibold text-sm text-text-primary">
                                <input
                                  type="hidden"
                                  {...register(`exercises.${i}.name` as const)}
                                />
                                <input
                                  type="hidden"
                                  {...register(`exercises.${i}.sets` as const, { valueAsNumber: true })}
                                />
                                <input
                                  type="hidden"
                                  {...register(`exercises.${i}.reps` as const, { valueAsNumber: true })}
                                />
                                <input
                                  type="hidden"
                                  {...register(`exercises.${i}.weight` as const, { valueAsNumber: true })}
                                />
                                {field.name}
                              </span>
                              <span className="block text-[10px] text-text-muted mt-0.5">
                                <span className="font-mono">{field.sets}</span> sets &times; <span className="font-mono">{field.reps}</span> reps @ <span className="font-mono">{field.weight}</span> kg
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExercise(i)}
                              className="text-red hover:text-red/80 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Exercise Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 rounded-lg border border-border">
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label">Exercise Name</label>
                        <input
                          type="text"
                          value={tempExercise.name}
                          onChange={(e) => setTempExercise({ ...tempExercise, name: e.target.value })}
                          className="input"
                          placeholder="e.g. Bench Press"
                        />
                      </div>
                      <div>
                        <label className="label">Sets</label>
                        <input
                          type="number"
                          value={tempExercise.sets}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, sets: parseInt(e.target.value) || 0 })
                          }
                          className="input font-mono"
                        />
                      </div>
                      <div>
                        <label className="label">Reps</label>
                        <input
                          type="number"
                          value={tempExercise.reps}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, reps: parseInt(e.target.value) || 0 })
                          }
                          className="input font-mono"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="label">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={tempExercise.weight}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, weight: parseFloat(e.target.value) || 0 })
                          }
                          className="input font-mono"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 pt-2">
                        <button
                          type="button"
                          onClick={addExerciseToList}
                          className="w-full btn-secondary text-xs py-2 px-4"
                        >
                          + Add Exercise to List
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nutrition Fields */}
                {activeFormTab === 'nutrition' && (
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="col-span-2">
                      <label className="label">Calories (kcal)</label>
                      <input
                        type="number"
                        {...register('calories', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className={`input font-mono ${errors.calories ? 'input-error' : ''}`}
                        placeholder="e.g. 2100"
                      />
                      {errors.calories && <p className="error-msg">{errors.calories.message}</p>}
                    </div>
                    <div>
                      <label className="label">Protein (g)</label>
                      <input
                        type="number"
                        {...register('protein', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className={`input font-mono ${errors.protein ? 'input-error' : ''}`}
                        placeholder="e.g. 140"
                      />
                      {errors.protein && <p className="error-msg">{errors.protein.message}</p>}
                    </div>
                    <div>
                      <label className="label">Carbs (g)</label>
                      <input
                        type="number"
                        {...register('carbs', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className={`input font-mono ${errors.carbs ? 'input-error' : ''}`}
                        placeholder="e.g. 220"
                      />
                      {errors.carbs && <p className="error-msg">{errors.carbs.message}</p>}
                    </div>
                    <div>
                      <label className="label">Fats (g)</label>
                      <input
                        type="number"
                        {...register('fats', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className={`input font-mono ${errors.fats ? 'input-error' : ''}`}
                        placeholder="e.g. 70"
                      />
                      {errors.fats && <p className="error-msg">{errors.fats.message}</p>}
                    </div>
                  </div>
                )}

                {/* Health Fields */}
                {activeFormTab === 'health' && (
                  <div className="space-y-6 border-t border-border pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Sleep Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          {...register('sleepHours', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                          className={`input font-mono ${errors.sleepHours ? 'input-error' : ''}`}
                          placeholder="e.g. 7.5"
                        />
                        {errors.sleepHours && (
                          <p className="error-msg">{errors.sleepHours.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Daily Steps</label>
                        <input
                          type="number"
                          {...register('steps', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                          className={`input font-mono ${errors.steps ? 'input-error' : ''}`}
                          placeholder="e.g. 10000"
                        />
                        {errors.steps && <p className="error-msg">{errors.steps.message}</p>}
                      </div>
                      <div>
                        <label className="label">Body Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register('bodyWeight', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                          className={`input font-mono ${errors.bodyWeight ? 'input-error' : ''}`}
                          placeholder="e.g. 72.4"
                        />
                        {errors.bodyWeight && (
                          <p className="error-msg">{errors.bodyWeight.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Cardio Entry Section */}
                    <div className="space-y-4 pt-2">
                      <h5 className="text-sm font-bold text-orange uppercase tracking-wider">Cardio Activities</h5>

                      {/* Cardio List */}
                      {cardioFields.length > 0 && (
                        <div className="space-y-2">
                          {cardioFields.map((field, i) => (
                            <div
                              key={field.id}
                              className="flex justify-between items-center bg-raised p-3 rounded-lg border border-border"
                            >
                              <div>
                                <span className="font-semibold text-sm text-text-primary">
                                  <input
                                    type="hidden"
                                    {...register(`cardio.${i}.activity` as const)}
                                  />
                                  <input
                                    type="hidden"
                                    {...register(`cardio.${i}.durationMinutes` as const, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                  {field.activity}
                                </span>
                                <span className="block text-[10px] text-text-muted mt-0.5">
                                  <span className="font-mono">{field.durationMinutes}</span> mins
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCardio(i)}
                                className="text-red hover:text-red/80 text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Cardio Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 rounded-lg border border-border">
                        <div>
                          <label className="label">
                            Activity Name
                          </label>
                          <input
                            type="text"
                            value={tempCardio.activity}
                            onChange={(e) => setTempCardio({ ...tempCardio, activity: e.target.value })}
                            className="input"
                            placeholder="e.g. Running"
                          />
                        </div>
                        <div>
                          <label className="label">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={tempCardio.durationMinutes}
                            onChange={(e) =>
                              setTempCardio({ ...tempCardio, durationMinutes: parseInt(e.target.value) || 0 })
                            }
                            className="input font-mono"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2 pt-2">
                          <button
                            type="button"
                            onClick={addCardioToList}
                            className="w-full btn-secondary text-xs py-2 px-4 text-orange border-orange/50 hover:bg-orange/10"
                          >
                            + Add Cardio Activity
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Textarea (Optional) */}
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    {...register('notes')}
                    className={`input ${errors.notes ? 'input-error' : ''}`}
                    placeholder="Additional thoughts, feelings, or details..."
                    rows={2}
                    maxLength={500}
                  />
                  {errors.notes && <p className="error-msg">{errors.notes.message}</p>}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary"
                  >
                    {submitting ? 'Saving Entry...' : 'Save Log Entry'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Analytics View: Charts & Recent Activity Log List */
            <div className="space-y-12">
              {/* Charts Grid */}
              <div>
                <h2 className="section-title mb-8 text-center md:text-left">
                  Metric Progress Charts
                </h2>

                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="spinner-lg"></div>
                  </div>
                ) : error ? (
                  <div className="alert-danger text-center">
                    Failed to load metrics charts data.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 1. Weight Progress */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Weight Progress
                      </h3>
                      <WeightChart data={getWeightData(logs)} />
                    </div>

                    {/* 2. Workout Volume Progress */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Workout Volume
                      </h3>
                      <WorkoutChart logs={logs} />
                    </div>

                    {/* 3. Nutrition Breakdown */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Nutrition Breakdown
                      </h3>
                      <NutritionChart data={getMacroData(logs)} />
                    </div>

                    {/* 4. Calories Intake */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Calorie Intake vs. Target
                      </h3>
                      <CalorieChart data={getCalorieData(logs)} />
                    </div>

                    {/* 5. Sleep Hours */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Sleep Analysis
                      </h3>
                      <SleepChart data={getSleepData(logs)} />
                    </div>

                    {/* 6. Daily Steps */}
                    <div className="card">
                      <h3 className="section-title text-sm tracking-wider text-text-muted mb-4">
                        Steps Walked
                      </h3>
                      <StepsChart data={getStepsData(logs)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity Log History */}
              <div className="card animate-fade-in">
                <h2 className="section-title text-base mb-6">Recent Activity Logs</h2>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="spinner"></div>
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-6">No activity logs recorded yet.</p>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {[...logs]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((log) => (
                        <div key={log._id} className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                log.type === 'workout' ? 'bg-cyan/10 text-cyan border border-cyan/20' :
                                log.type === 'nutrition' ? 'bg-green/10 text-green border border-green/20' :
                                'bg-orange/10 text-orange border border-orange/20'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-xs text-text-muted font-mono">
                                {new Date(log.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-xs text-text-muted italic mt-1">"{log.notes}"</p>
                            )}
                          </div>

                          {/* Details according to log type */}
                          <div className="text-sm">
                            {log.type === 'workout' && log.exercises && log.exercises.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {log.exercises.map((ex, i) => (
                                  <span key={i} className="badge bg-raised border border-border text-xs text-text-primary">
                                    {ex.name} (<span className="font-mono">{ex.sets}x{ex.reps}</span> @ <span className="font-mono">{ex.weight}</span>kg)
                                  </span>
                                ))}
                              </div>
                            )}

                            {log.type === 'nutrition' && (
                              <div className="flex gap-3 text-xs">
                                {log.calories && <div>Cal: <span className="font-mono font-bold text-text-primary">{log.calories}</span> kcal</div>}
                                {log.protein && <div>P: <span className="font-mono font-bold text-cyan">{log.protein}</span>g</div>}
                                {log.carbs && <div>C: <span className="font-mono font-bold text-orange">{log.carbs}</span>g</div>}
                                {log.fats && <div>F: <span className="font-mono font-bold text-yellow">{log.fats}</span>g</div>}
                              </div>
                            )}

                            {log.type === 'health' && (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-3 text-xs">
                                  {log.sleepHours && <div>Sleep: <span className="font-mono font-bold text-text-primary">{log.sleepHours}</span> hrs</div>}
                                  {log.steps && <div>Steps: <span className="font-mono font-bold text-text-primary">{log.steps}</span></div>}
                                  {log.bodyWeight && <div>Weight: <span className="font-mono font-bold text-text-primary">{log.bodyWeight}</span> kg</div>}
                                </div>
                                {log.cardio && log.cardio.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {log.cardio.map((c, i) => (
                                      <span key={i} className="badge bg-orange/10 text-orange border border-orange/20 text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded">
                                        🏃 {c.activity} (<span className="font-mono">{c.durationMinutes}</span> mins)
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ProtectedRoute>
  );
}
