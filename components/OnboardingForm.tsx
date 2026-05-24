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
  const { token, user } = useSelector((state: RootState) => state.auth);
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
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      foodAllergies: [],
      medicalConditions: [],
      injuries: [],
    },
  });

  const nextStep = async () => {
    // Validate current step fields before going forward
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
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: OnboardingInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Parse list strings to arrays
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

      // Call API PUT /api/profile
      const profileRes = await axios.put('/api/profile', finalData);
      if (profileRes.data.success) {
        // Trigger BMI post
        await axios.post('/api/bmi');
        
        // Refresh profile details in state
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
    <div className="w-full max-w-2xl bg-[#12121a] p-8 rounded-2xl border border-[#1e1e2e] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Progress Tracker */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold border transition-all ${
              step >= s 
                ? 'bg-[#00d4ff] text-[#0a0a0f] border-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                : 'bg-[#0a0a0f] text-[#94a3b8] border-[#1e1e2e]'
            }`}>
              {s}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-[2px] mx-2 transition-all ${
                step > s ? 'bg-[#00d4ff]' : 'bg-[#1e1e2e]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-[#e2e8f0] mb-4">Step 1: Personal Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Age</label>
                <input
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                  placeholder="e.g. 25"
                />
                {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Height (cm)</label>
                <input
                  type="number"
                  {...register('height', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                  placeholder="e.g. 175"
                />
                {errors.height && <p className="mt-1 text-xs text-red-500">{errors.height.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Weight (kg)</label>
                <input
                  type="number"
                  {...register('weight', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                  placeholder="e.g. 70"
                />
                {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Country</label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                placeholder="e.g. United States"
              />
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Fitness info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-[#e2e8f0] mb-4">Step 2: Fitness Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Activity Level</label>
                <select
                  {...register('activityLevel')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="sedentary">Sedentary (Little/no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (Athletic/Physical job)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Fitness Level</label>
                <select
                  {...register('fitnessLevel')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Fitness Goal</label>
                <select
                  {...register('fitnessGoal')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="fat_loss">Fat Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Available Equipment</label>
                <select
                  {...register('equipment')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
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
            <h3 className="font-display text-xl font-bold text-[#e2e8f0] mb-4">Step 3: Dietary Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Diet Preference</label>
                <select
                  {...register('dietPreference')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Budget Level</label>
                <select
                  {...register('budget')}
                  className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                >
                  <option value="low">Low Budget</option>
                  <option value="medium">Medium Budget</option>
                  <option value="high">High Budget</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Food Allergies (comma separated)</label>
              <input
                type="text"
                value={foodAllergiesInput}
                onChange={(e) => setFoodAllergiesInput(e.target.value)}
                className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                placeholder="e.g. peanuts, dairy, gluten"
              />
            </div>
          </div>
        )}

        {/* Step 4: Medical info & Disclaimer */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-[#e2e8f0] mb-4">Step 4: Medical Info & Safety</h3>
            
            <div className="bg-[#ff6b35]/15 border border-[#ff6b35] p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(255,107,53,0.15)]">
              <h4 className="font-display font-bold text-[#ff6b35] mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Medical Safety Gate Disclaimer
              </h4>
              <p className="text-xs text-[#e2e8f0] leading-relaxed">
                If you have medical conditions or injuries, our AI plan generator will be disabled for your safety. You will be matched with certified trainers instead.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Medical Conditions (comma separated)</label>
              <input
                type="text"
                value={medicalConditionsInput}
                onChange={(e) => setMedicalConditionsInput(e.target.value)}
                className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
                placeholder="e.g. asthma, diabetes"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Injuries (comma separated)</label>
              <input
                type="text"
                value={injuriesInput}
                onChange={(e) => setInjuriesInput(e.target.value)}
                className="w-full px-4 py-3 border border-[#1e1e2e] bg-[#0a0a0f] text-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d4ff] text-sm"
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
              className="px-6 py-3 border border-[#1e1e2e] text-[#e2e8f0] rounded-xl hover:bg-[#1e1e2e] text-sm font-bold transition-all"
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
              className="px-6 py-3 bg-[#00d4ff] text-[#0a0a0f] rounded-xl hover:bg-[#0099bb] text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#ff6b35] text-[#0a0a0f] rounded-xl hover:bg-[#cc5222] text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,107,53,0.2)] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
