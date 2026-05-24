'use client';

import React, { useState } from 'react';
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

export default function ProgressPage() {
  const [activeFormTab, setActiveFormTab] = useState<'workout' | 'nutrition' | 'health'>('workout');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      date: new Date().toISOString().substring(0, 16),
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
          date: new Date().toISOString().substring(0, 16),
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('date')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>

              {/* Workout Fields */}
              {activeFormTab === 'workout' && (
                <div className="space-y-4 border-t border-[#1e1e2e] pt-4">
                  <h4 className="text-sm font-bold text-[#00d4ff] mb-2">Workout Exercises</h4>

                  {/* Exercise List */}
                  {exerciseFields.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {exerciseFields.map((field, i) => (
                        <div
                          key={field.id}
                          className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded-xl border border-[#1e1e2e]"
                        >
                          <div>
                            <span className="font-bold text-sm text-[#e2e8f0]">
                              {/* Registered in form state */}
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
                            <span className="block text-[10px] text-[#94a3b8]">
                              {field.sets} sets &times; {field.reps} reps @ {field.weight} kg
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExercise(i)}
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
                        value={tempExercise.name}
                        onChange={(e) => setTempExercise({ ...tempExercise, name: e.target.value })}
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                        placeholder="e.g. Bench Press"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Sets</label>
                      <input
                        type="number"
                        value={tempExercise.sets}
                        onChange={(e) =>
                          setTempExercise({ ...tempExercise, sets: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Reps</label>
                      <input
                        type="number"
                        value={tempExercise.reps}
                        onChange={(e) =>
                          setTempExercise({ ...tempExercise, reps: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tempExercise.weight}
                        onChange={(e) =>
                          setTempExercise({ ...tempExercise, weight: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 pt-2">
                      <button
                        type="button"
                        onClick={addExerciseToList}
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
                      {...register('calories', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                      placeholder="e.g. 2100"
                    />
                    {errors.calories && <p className="text-red-500 text-xs mt-1">{errors.calories.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Protein (g)</label>
                    <input
                      type="number"
                      {...register('protein', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                      placeholder="e.g. 140"
                    />
                    {errors.protein && <p className="text-red-500 text-xs mt-1">{errors.protein.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      {...register('carbs', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                      placeholder="e.g. 220"
                    />
                    {errors.carbs && <p className="text-red-500 text-xs mt-1">{errors.carbs.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Fats (g)</label>
                    <input
                      type="number"
                      {...register('fats', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                      className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                      placeholder="e.g. 70"
                    />
                    {errors.fats && <p className="text-red-500 text-xs mt-1">{errors.fats.message}</p>}
                  </div>
                </div>
              )}

              {/* Health Fields */}
              {activeFormTab === 'health' && (
                <div className="space-y-6 border-t border-[#1e1e2e] pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Sleep Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        {...register('sleepHours', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                        placeholder="e.g. 7.5"
                      />
                      {errors.sleepHours && (
                        <p className="text-red-500 text-xs mt-1">{errors.sleepHours.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Daily Steps</label>
                      <input
                        type="number"
                        {...register('steps', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                        placeholder="e.g. 10000"
                      />
                      {errors.steps && <p className="text-red-500 text-xs mt-1">{errors.steps.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Body Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('bodyWeight', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                        className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                        placeholder="e.g. 72.4"
                      />
                      {errors.bodyWeight && (
                        <p className="text-red-500 text-xs mt-1">{errors.bodyWeight.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Cardio Entry Section */}
                  <div className="space-y-4 pt-2">
                    <h5 className="text-sm font-bold text-[#ff6b35]">Cardio Activities</h5>

                    {/* Cardio List */}
                    {cardioFields.length > 0 && (
                      <div className="space-y-2">
                        {cardioFields.map((field, i) => (
                          <div
                            key={field.id}
                            className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded-xl border border-[#1e1e2e]"
                          >
                            <div>
                              <span className="font-bold text-sm text-[#e2e8f0]">
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
                              <span className="block text-[10px] text-[#94a3b8]">
                                {field.durationMinutes} mins
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCardio(i)}
                              className="text-red-500 hover:text-red-400 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Cardio Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0a0f] p-4 rounded-xl border border-[#1e1e2e]">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">
                          Activity Name
                        </label>
                        <input
                          type="text"
                          value={tempCardio.activity}
                          onChange={(e) => setTempCardio({ ...tempCardio, activity: e.target.value })}
                          className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                          placeholder="e.g. Running"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={tempCardio.durationMinutes}
                          onChange={(e) =>
                            setTempCardio({ ...tempCardio, durationMinutes: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-[#1e1e2e] bg-[#12121a] text-[#e2e8f0] rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 pt-2">
                        <button
                          type="button"
                          onClick={addCardioToList}
                          className="w-full py-2 bg-[#1e1e2e] hover:bg-[#1e1e2e]/80 text-[#ff6b35] border border-[#ff6b35]/20 text-xs font-bold rounded-lg transition-all"
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
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl text-sm focus:ring-1 focus:ring-[#00d4ff] focus:outline-none"
                  placeholder="Additional thoughts, feelings, or details..."
                  rows={2}
                  maxLength={500}
                />
                {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
              </div>

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

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff]"></div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl text-sm text-center">
                Failed to load metrics charts data.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Weight Progress */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Weight Progress
                  </h3>
                  <WeightChart data={getWeightData(logs)} />
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
                  <NutritionChart data={getMacroData(logs)} />
                </div>

                {/* 4. Calories Intake */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Calorie Intake vs. Target
                  </h3>
                  <CalorieChart data={getCalorieData(logs)} />
                </div>

                {/* 5. Sleep Hours */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Sleep Analysis
                  </h3>
                  <SleepChart data={getSleepData(logs)} />
                </div>

                {/* 6. Daily Steps */}
                <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                  <h3 className="font-display text-sm font-bold tracking-wider text-[#94a3b8] uppercase mb-4">
                    Steps Walked
                  </h3>
                  <StepsChart data={getStepsData(logs)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ProtectedRoute>
  );
}
