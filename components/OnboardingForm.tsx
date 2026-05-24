'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, OnboardingInput } from '@/schemas/onboardingSchema';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function OnboardingForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [foodAllergiesInput, setFoodAllergiesInput] = useState('');
  const [medicalConditionsInput, setMedicalConditionsInput] = useState('');
  const [injuriesInput, setInjuriesInput] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gender: 'male',
      activityLevel: 'sedentary',
      fitnessLevel: 'beginner',
      fitnessGoal: 'fat_loss',
      equipment: 'none',
      dietPreference: 'veg',
      budget: 'low',
      foodAllergies: [],
      medicalConditions: [],
      injuries: [],
    },
  });

  const nextStep = async () => {
    if (step >= 4) return; // Don't go beyond step 4
    let fieldsToValidate: Array<keyof OnboardingInput> = [];
    if (step === 1) {
      fieldsToValidate = ['age', 'gender', 'height', 'weight', 'country'];
    } else if (step === 2) {
      fieldsToValidate = ['activityLevel', 'fitnessLevel', 'fitnessGoal', 'equipment'];
    } else if (step === 3) {
      fieldsToValidate = ['dietPreference', 'budget'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  // Guard: block form submission on steps 1-3 (e.g. when user presses Enter in a text input)
  const guardedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (step < 4) {
      e.preventDefault();
      return;
    }
    handleSubmit(onSubmit)(e);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const finalData = {
        ...data,
        foodAllergies: foodAllergiesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        medicalConditions: medicalConditionsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        injuries: injuriesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        onboardingComplete: true,
      };

      const profileRes = await axios.put('/api/profile', finalData);
      if (profileRes.data.success) {
        await axios.post('/api/bmi');
        const freshProfileRes = await axios.get('/api/profile');
        if (freshProfileRes.data.success && token) {
          dispatch(setCredentials({ token, user: freshProfileRes.data.data }));
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save onboarding profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto shadow-lg animate-slide-up">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all
              ${step > s ? 'bg-cyan border-cyan text-bg shadow-cyan' :
                step === s ? 'bg-cyan/10 border-cyan text-cyan' :
                'bg-raised border-border text-text-hint'}`}>
              {step > s ? '✓' : s}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-cyan' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={guardedSubmit}
        onKeyDown={(e) => {
          // Block Enter key from submitting the form on steps 1-3
          if (e.key === 'Enter' && step < 4) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="card-title font-display text-lg mb-4 uppercase tracking-wider text-cyan">Step 1: Personal Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className={`input ${errors.age ? 'border-red/60' : ''}`}
                  placeholder="e.g. 25"
                />
                {errors.age && <p className="error-msg">{errors.age.message as any}</p>}
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  {...register('gender')}
                  className="input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="error-msg">{errors.gender.message as any}</p>}
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input
                  type="number"
                  {...register('height', { valueAsNumber: true })}
                  className={`input ${errors.height ? 'border-red/60' : ''}`}
                  placeholder="e.g. 175"
                />
                {errors.height && <p className="error-msg">{errors.height.message as any}</p>}
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  {...register('weight', { valueAsNumber: true })}
                  className={`input ${errors.weight ? 'border-red/60' : ''}`}
                  placeholder="e.g. 70"
                />
                {errors.weight && <p className="error-msg">{errors.weight.message as any}</p>}
              </div>
            </div>
            <div>
              <label className="label">Country</label>
              <input
                type="text"
                {...register('country')}
                className={`input ${errors.country ? 'border-red/60' : ''}`}
                placeholder="e.g. United States"
              />
              {errors.country && <p className="error-msg">{errors.country.message as any}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Fitness info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="card-title font-display text-lg mb-4 uppercase tracking-wider text-cyan">Step 2: Fitness Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Activity Level</label>
                <select
                  {...register('activityLevel')}
                  className="input"
                >
                  <option value="sedentary">Sedentary (Little/no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (Athletic/Physical job)</option>
                </select>
              </div>
              <div>
                <label className="label">Fitness Level</label>
                <select
                  {...register('fitnessLevel')}
                  className="input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Fitness Goal</label>
                <select
                  {...register('fitnessGoal')}
                  className="input"
                >
                  <option value="fat_loss">Fat Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="label">Available Equipment</label>
                <select
                  {...register('equipment')}
                  className="input"
                >
                  <option value="none">None (Bodyweight only)</option>
                  <option value="home">Home Gym (Dumbbells/bands)</option>
                  <option value="gym">Full Gym Access</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Diet info */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="card-title font-display text-lg mb-4 uppercase tracking-wider text-cyan">Step 3: Dietary Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Diet Preference</label>
                <select
                  {...register('dietPreference')}
                  className="input"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="label">Budget Level</label>
                <select
                  {...register('budget')}
                  className="input"
                >
                  <option value="low">Low Budget</option>
                  <option value="medium">Medium Budget</option>
                  <option value="high">High Budget</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Food Allergies (comma separated)</label>
              <input
                type="text"
                value={foodAllergiesInput}
                onChange={(e) => setFoodAllergiesInput(e.target.value)}
                className="input"
                placeholder="e.g. peanuts, dairy, gluten"
              />
            </div>
          </div>
        )}

        {/* Step 4: Medical info & Disclaimer */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="card-title font-display text-lg mb-4 uppercase tracking-wider text-cyan">Step 4: Medical Info & Safety</h3>
            
            <div className="alert-warning mb-6">
              <p className="text-sm text-orange font-semibold mb-1">⚠️ Important safety notice</p>
              <p className="text-sm text-text-muted">
                If you report medical conditions or injuries, AI plan generation will be disabled for your safety.
                You will be connected with certified trainers instead.
              </p>
            </div>

            <div>
              <label className="label">Medical Conditions (comma separated)</label>
              <input
                type="text"
                value={medicalConditionsInput}
                onChange={(e) => setMedicalConditionsInput(e.target.value)}
                className="input"
                placeholder="e.g. asthma, diabetes"
              />
            </div>
            <div>
              <label className="label">Injuries (comma separated)</label>
              <input
                type="text"
                value={injuriesInput}
                onChange={(e) => setInjuriesInput(e.target.value)}
                className="input"
                placeholder="e.g. knee pain, lower back strain"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn-ghost text-sm py-2.5 px-6"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary text-sm py-2.5 px-6"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(onSubmit)()}
              className="btn-primary bg-orange hover:bg-orange-dim text-bg text-sm py-2.5 px-6"
            >
              {loading ? 'Submitting...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
