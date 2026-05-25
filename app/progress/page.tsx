'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import WeightChart from '@/components/charts/WeightChart';
import WorkoutChart from '@/components/charts/WorkoutChart';
import NutritionChart from '@/components/charts/NutritionChart';
import CalorieChart from '@/components/charts/CalorieChart';
import SleepChart from '@/components/charts/SleepChart';
import StepsChart from '@/components/charts/StepsChart';
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

  // Form Fields State
  const [date, setDate] = useState(getLocalDatetimeString());
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Array<{ name: string; sets: number; reps: number; weight: number }>>([]);
  const [cardio, setCardio] = useState<Array<{ activity: string; durationMinutes: number }>>([]);

  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');

  const [sleepHours, setSleepHours] = useState<string>('');
  const [steps, setSteps] = useState<string>('');
  const [bodyWeight, setBodyWeight] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Temporary state for adding a single exercise dynamically
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

  // Reset form helper
  const handleReset = () => {
    setDate(getLocalDatetimeString());
    setNotes('');
    setExercises([]);
    setCardio([]);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setSleepHours('');
    setSteps('');
    setBodyWeight('');
    setErrors({});
  };

  // Add exercise to local state list
  const addExerciseToList = () => {
    if (!tempExercise.name.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        name: tempExercise.name.trim(),
        sets: Number(tempExercise.sets) || 1,
        reps: Number(tempExercise.reps) || 1,
        weight: Number(tempExercise.weight) || 0,
      },
    ]);
    setTempExercise({ name: '', sets: 3, reps: 10, weight: 60 });
  };

  // Remove exercise from local state list
  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Add cardio to local state list
  const addCardioToList = () => {
    if (!tempCardio.activity.trim()) return;
    setCardio((prev) => [
      ...prev,
      {
        activity: tempCardio.activity.trim(),
        durationMinutes: Number(tempCardio.durationMinutes) || 1,
      },
    ]);
    setTempCardio({ activity: '', durationMinutes: 30 });
  };

  // Remove cardio from local state list
  const removeCardio = (index: number) => {
    setCardio((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form state before submission
  const validateLog = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date || isNaN(Date.parse(date))) {
      newErrors.date = 'Invalid date and time selected';
    }

    if (activeFormTab === 'workout') {
      if (exercises.length === 0) {
        setToast({
          message: 'Please add at least one exercise to your workout log.',
          type: 'error',
        });
        return false;
      }
    } else if (activeFormTab === 'nutrition') {
      if (calories !== '') {
        const parsed = Number(calories);
        if (isNaN(parsed) || parsed < 0 || parsed > 20000) {
          newErrors.calories = 'Calories must be a number between 0 and 20,000';
        }
      }
      if (protein !== '') {
        const parsed = Number(protein);
        if (isNaN(parsed) || parsed < 0 || parsed > 1000) {
          newErrors.protein = 'Protein must be a number between 0 and 1,000';
        }
      }
      if (carbs !== '') {
        const parsed = Number(carbs);
        if (isNaN(parsed) || parsed < 0 || parsed > 2000) {
          newErrors.carbs = 'Carbs must be a number between 0 and 2,000';
        }
      }
      if (fats !== '') {
        const parsed = Number(fats);
        if (isNaN(parsed) || parsed < 0 || parsed > 1000) {
          newErrors.fats = 'Fats must be a number between 0 and 1,000';
        }
      }
    } else if (activeFormTab === 'health') {
      if (sleepHours !== '') {
        const parsed = Number(sleepHours);
        if (isNaN(parsed) || parsed < 0 || parsed > 24) {
          newErrors.sleepHours = 'Sleep hours must be a number between 0 and 24';
        }
      }
      if (steps !== '') {
        const parsed = Number(steps);
        if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 100000) {
          newErrors.steps = 'Steps must be an integer between 0 and 100,000';
        }
      }
      if (bodyWeight !== '') {
        const parsed = Number(bodyWeight);
        if (isNaN(parsed) || parsed < 20 || parsed > 500) {
          newErrors.bodyWeight = 'Body weight must be between 20 and 500 kg';
        }
      }
    }

    if (notes && notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLog()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        date: new Date(date).toISOString(),
        type: activeFormTab,
        notes: notes.trim() || undefined,
      };

      if (activeFormTab === 'workout') {
        payload.exercises = exercises;
      } else if (activeFormTab === 'nutrition') {
        if (calories !== '') payload.calories = Number(calories);
        if (protein !== '') payload.protein = Number(protein);
        if (carbs !== '') payload.carbs = Number(carbs);
        if (fats !== '') payload.fats = Number(fats);
      } else if (activeFormTab === 'health') {
        if (sleepHours !== '') payload.sleepHours = Number(sleepHours);
        if (steps !== '') payload.steps = Number(steps);
        if (bodyWeight !== '') payload.bodyWeight = Number(bodyWeight);
        if (cardio.length > 0) {
          payload.cardio = cardio;
        }
      }

      const res = await api.post('/progress/log', payload);
      if (res.data.success) {
        setToast({ message: 'Log entry saved successfully!', type: 'success' });
        handleReset();
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
        <div className="page-inner space-y-12">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ marginBottom: '8px' }}>Progress & Logs</h1>
            <p style={{ fontSize: '13px', color: '#9090a0' }}>
              Record your daily parameters and view metrics charts.
            </p>
          </div>

          {/* Main Switcher Tab Bar */}
          <div className="tab-list" style={{ marginBottom: '20px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setActivePageTab('log')}
              className={activePageTab === 'log' ? 'tab-item tab-item-active' : 'tab-item'}
            >
              Log Progress
            </button>
            <button
              type="button"
              onClick={() => setActivePageTab('analytics')}
              className={activePageTab === 'analytics' ? 'tab-item tab-item-active' : 'tab-item'}
            >
              View Analytics
            </button>
          </div>

          {activePageTab === 'log' ? (
            /* Form and Input Panel */
            <div className="card max-w-2xl mx-auto mb-8">
              <h2 className="section-title text-base mb-6">
                Log Daily Metric
              </h2>

              {/* Form Tab Toggles */}
              <div className="tab-list" style={{ marginBottom: '20px' }}>
                {(['workout', 'nutrition', 'health'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setActiveFormTab(t);
                      setErrors({});
                    }}
                    className={activeFormTab === t ? 'tab-item tab-item-active' : 'tab-item'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="space-y-6" noValidate>
                {/* Date Input */}
                <div>
                  <label className="label" htmlFor="progress-date">Date & Time</label>
                  <input
                    id="progress-date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: '' })); }}
                    className={`input ${errors.date ? 'input-error' : ''}`}
                    disabled={submitting}
                  />
                  {errors.date && <p className="error-msg">{errors.date}</p>}
                </div>

                {/* Workout Fields */}
                {activeFormTab === 'workout' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="text-sm font-bold text-mint mb-2">Workout Exercises</h4>

                    {/* Exercise List */}
                    {exercises.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {exercises.map((field, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-raised p-3 rounded-lg border border-border"
                          >
                            <div>
                              <span className="font-semibold text-sm text-text-primary">
                                {field.name}
                              </span>
                              <span className="block text-[10px] text-text-muted mt-0.5">
                                <span className="font-mono">{field.sets}</span> sets &times; <span className="font-mono">{field.reps}</span> reps @ <span className="font-mono">{field.weight}</span> kg
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExercise(i)}
                              className="text-danger hover:text-danger/80 text-xs font-semibold"
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
                        <label className="label" htmlFor="temp-ex-name">Exercise Name</label>
                        <input
                          id="temp-ex-name"
                          type="text"
                          value={tempExercise.name}
                          onChange={(e) => setTempExercise({ ...tempExercise, name: e.target.value })}
                          className="input"
                          placeholder="e.g. Bench Press"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="temp-ex-sets">Sets</label>
                        <input
                          id="temp-ex-sets"
                          type="number"
                          value={tempExercise.sets}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, sets: parseInt(e.target.value) || 0 })
                          }
                          className="input font-mono"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="temp-ex-reps">Reps</label>
                        <input
                          id="temp-ex-reps"
                          type="number"
                          value={tempExercise.reps}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, reps: parseInt(e.target.value) || 0 })
                          }
                          className="input font-mono"
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 pt-2">
                        <label className="label" htmlFor="temp-ex-weight">Weight (kg)</label>
                        <input
                          id="temp-ex-weight"
                          type="number"
                          step="0.5"
                          value={tempExercise.weight}
                          onChange={(e) =>
                            setTempExercise({ ...tempExercise, weight: parseFloat(e.target.value) || 0 })
                          }
                          className="input font-mono"
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 pt-2">
                        <button
                          type="button"
                          onClick={addExerciseToList}
                          className="btn btn-ghost"
                          style={{ width: '100%' }}
                          disabled={submitting}
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
                      <label className="label" htmlFor="progress-calories">Calories (kcal)</label>
                      <input
                        id="progress-calories"
                        type="number"
                        value={calories}
                        onChange={(e) => { setCalories(e.target.value); setErrors((prev) => ({ ...prev, calories: '' })); }}
                        className={`input font-mono ${errors.calories ? 'input-error' : ''}`}
                        placeholder="e.g. 2100"
                        disabled={submitting}
                      />
                      {errors.calories && <p className="error-msg">{errors.calories}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="progress-protein">Protein (g)</label>
                      <input
                        id="progress-protein"
                        type="number"
                        value={protein}
                        onChange={(e) => { setProtein(e.target.value); setErrors((prev) => ({ ...prev, protein: '' })); }}
                        className={`input font-mono ${errors.protein ? 'input-error' : ''}`}
                        placeholder="e.g. 140"
                        disabled={submitting}
                      />
                      {errors.protein && <p className="error-msg">{errors.protein}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="progress-carbs">Carbs (g)</label>
                      <input
                        id="progress-carbs"
                        type="number"
                        value={carbs}
                        onChange={(e) => { setCarbs(e.target.value); setErrors((prev) => ({ ...prev, carbs: '' })); }}
                        className={`input font-mono ${errors.carbs ? 'input-error' : ''}`}
                        placeholder="e.g. 220"
                        disabled={submitting}
                      />
                      {errors.carbs && <p className="error-msg">{errors.carbs}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="progress-fats">Fats (g)</label>
                      <input
                        id="progress-fats"
                        type="number"
                        value={fats}
                        onChange={(e) => { setFats(e.target.value); setErrors((prev) => ({ ...prev, fats: '' })); }}
                        className={`input font-mono ${errors.fats ? 'input-error' : ''}`}
                        placeholder="e.g. 70"
                        disabled={submitting}
                      />
                      {errors.fats && <p className="error-msg">{errors.fats}</p>}
                    </div>
                  </div>
                )}

                {/* Health Fields */}
                {activeFormTab === 'health' && (
                  <div className="space-y-6 border-t border-border pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="label" htmlFor="progress-sleep">Sleep Hours</label>
                        <input
                          id="progress-sleep"
                          type="number"
                          step="0.5"
                          value={sleepHours}
                          onChange={(e) => { setSleepHours(e.target.value); setErrors((prev) => ({ ...prev, sleepHours: '' })); }}
                          className={`input font-mono ${errors.sleepHours ? 'input-error' : ''}`}
                          placeholder="e.g. 7.5"
                          disabled={submitting}
                        />
                        {errors.sleepHours && (
                          <p className="error-msg">{errors.sleepHours}</p>
                        )}
                      </div>
                      <div>
                        <label className="label" htmlFor="progress-steps">Daily Steps</label>
                        <input
                          id="progress-steps"
                          type="number"
                          value={steps}
                          onChange={(e) => { setSteps(e.target.value); setErrors((prev) => ({ ...prev, steps: '' })); }}
                          className={`input font-mono ${errors.steps ? 'input-error' : ''}`}
                          placeholder="e.g. 10000"
                          disabled={submitting}
                        />
                        {errors.steps && <p className="error-msg">{errors.steps}</p>}
                      </div>
                      <div>
                        <label className="label" htmlFor="progress-weight">Body Weight (kg)</label>
                        <input
                          id="progress-weight"
                          type="number"
                          step="0.1"
                          value={bodyWeight}
                          onChange={(e) => { setBodyWeight(e.target.value); setErrors((prev) => ({ ...prev, bodyWeight: '' })); }}
                          className={`input font-mono ${errors.bodyWeight ? 'input-error' : ''}`}
                          placeholder="e.g. 72.4"
                          disabled={submitting}
                        />
                        {errors.bodyWeight && (
                          <p className="error-msg">{errors.bodyWeight}</p>
                        )}
                      </div>
                    </div>

                    {/* Cardio Entry Section */}
                    <div className="space-y-4 pt-2">
                      <h5 className="text-sm font-bold text-fire uppercase tracking-wider">Cardio Activities</h5>

                      {/* Cardio List */}
                      {cardio.length > 0 && (
                        <div className="space-y-2">
                          {cardio.map((field, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center bg-raised p-3 rounded-lg border border-border"
                            >
                              <div>
                                <span className="font-semibold text-sm text-text-primary">
                                  {field.activity}
                                </span>
                                <span className="block text-[10px] text-text-muted mt-0.5">
                                  <span className="font-mono">{field.durationMinutes}</span> mins
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCardio(i)}
                                className="text-danger hover:text-danger/80 text-xs font-semibold"
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
                          <label className="label" htmlFor="temp-cardio-act">
                            Activity Name
                          </label>
                          <input
                            id="temp-cardio-act"
                            type="text"
                            value={tempCardio.activity}
                            onChange={(e) => setTempCardio({ ...tempCardio, activity: e.target.value })}
                            className="input"
                            placeholder="e.g. Running"
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="temp-cardio-dur">
                            Duration (minutes)
                          </label>
                          <input
                            id="temp-cardio-dur"
                            type="number"
                            value={tempCardio.durationMinutes}
                            onChange={(e) =>
                              setTempCardio({ ...tempCardio, durationMinutes: parseInt(e.target.value) || 0 })
                            }
                            className="input font-mono"
                            disabled={submitting}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2 pt-2">
                          <button
                            type="button"
                            onClick={addCardioToList}
                            className="btn btn-ghost"
                            style={{ width: '100%' }}
                            disabled={submitting}
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
                  <label className="label" htmlFor="progress-notes">Notes</label>
                  <textarea
                    id="progress-notes"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setErrors((prev) => ({ ...prev, notes: '' })); }}
                    className={`input ${errors.notes ? 'input-error' : ''}`}
                    placeholder="Additional thoughts, feelings, or details..."
                    rows={2}
                    maxLength={500}
                    disabled={submitting}
                  />
                  {errors.notes && <p className="error-msg">{errors.notes}</p>}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
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
                <h2 className="section-title mb-6">Your Progress</h2>

                {isLoading ? (
                  <div className="flex justify-center py-20">
                     <div className="spinner-lg"></div>
                  </div>
                ) : error ? (
                  <div className="alert-danger text-center">
                    Failed to load metrics charts data.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Weight Progress */}
                    <div className="card">
                      <h3 className="card-title mb-4">
                        Weight Progress
                      </h3>
                      <WeightChart data={getWeightData(logs)} />
                    </div>

                    {/* 2. Workout Volume Progress */}
                    <div className="card">
                      <h3 className="card-title mb-4">
                        Workout Volume
                      </h3>
                      <WorkoutChart logs={logs} />
                    </div>

                    {/* 3. Nutrition Breakdown */}
                    <div className="card">
                      <h3 className="card-title mb-4">
                        Nutrition Breakdown
                      </h3>
                      <NutritionChart data={getMacroData(logs)} />
                    </div>

                    {/* 4. Calories Intake */}
                    <div className="card">
                      <h3 className="card-title mb-4">
                        Calorie Intake vs. Target
                      </h3>
                      <CalorieChart data={getCalorieData(logs)} />
                    </div>

                    {/* 5. Sleep Hours */}
                    <div className="card">
                      <h3 className="card-title mb-4">
                        Sleep Analysis
                      </h3>
                      <SleepChart data={getSleepData(logs)} />
                    </div>

                    {/* 6. Daily Steps */}
                    <div className="card">
                      <h3 className="card-title mb-4">
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
                                log.type === 'workout' ? 'bg-sky/10 text-sky border border-sky/20' :
                                log.type === 'nutrition' ? 'bg-mint/10 text-mint border border-mint/20' :
                                'bg-fire/10 text-fire border border-fire/20'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-xs text-text-muted font-mono">
                                {new Date(log.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            {(log as any).notes && (
                              <p className="text-xs text-text-muted italic mt-1">"{(log as any).notes}"</p>
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
                                {log.protein && <div>P: <span className="font-mono font-bold text-mint">{log.protein}</span>g</div>}
                                {log.carbs && <div>C: <span className="font-mono font-bold text-fire">{log.carbs}</span>g</div>}
                                {log.fats && <div>F: <span className="font-mono font-bold text-amber">{log.fats}</span>g</div>}
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
                                      <span key={i} className="badge bg-fire/10 text-fire border border-fire/20 text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded">
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
