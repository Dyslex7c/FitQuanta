'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import api from '@/lib/axiosInstance';

export default function OnboardingForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  const [activityLevel, setActivityLevel] = useState<string>('sedentary');
  const [fitnessLevel, setFitnessLevel] = useState<string>('beginner');
  const [fitnessGoal, setFitnessGoal] = useState<string>('fat_loss');
  const [equipment, setEquipment] = useState<string>('none');

  const [dietPreference, setDietPreference] = useState<string>('veg');
  const [budget, setBudget] = useState<string>('low');

  const [foodAllergiesInput, setFoodAllergiesInput] = useState('');
  const [medicalConditionsInput, setMedicalConditionsInput] = useState('');
  const [injuriesInput, setInjuriesInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      const parsedAge = parseInt(age, 10);
      if (!age.trim()) {
        newErrors.age = 'Age is required';
      } else if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 100) {
        newErrors.age = 'Age must be a number between 13 and 100';
      }

      if (!gender) {
        newErrors.gender = 'Gender is required';
      } else if (!['male', 'female', 'other'].includes(gender)) {
        newErrors.gender = 'Invalid gender value';
      }

      const parsedHeight = parseFloat(height);
      if (!height.trim()) {
        newErrors.height = 'Height is required';
      } else if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 300) {
        newErrors.height = 'Height must be between 50 and 300 cm';
      }

      const parsedWeight = parseFloat(weight);
      if (!weight.trim()) {
        newErrors.weight = 'Weight is required';
      } else if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 500) {
        newErrors.weight = 'Weight must be between 20 and 500 kg';
      }

      if (!country.trim()) {
        newErrors.country = 'Country is required';
      } else if (country.trim().length < 2 || country.trim().length > 100) {
        newErrors.country = 'Country must be between 2 and 100 characters';
      }
    } else if (currentStep === 2) {
      if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityLevel)) {
        newErrors.activityLevel = 'Invalid activity level selected';
      }
      if (!['beginner', 'intermediate', 'advanced'].includes(fitnessLevel)) {
        newErrors.fitnessLevel = 'Invalid fitness level selected';
      }
      if (!['fat_loss', 'muscle_gain', 'maintenance'].includes(fitnessGoal)) {
        newErrors.fitnessGoal = 'Invalid fitness goal selected';
      }
      if (!['none', 'home', 'gym'].includes(equipment)) {
        newErrors.equipment = 'Invalid equipment option selected';
      }
    } else if (currentStep === 3) {
      if (!['veg', 'non-veg', 'vegan'].includes(dietPreference)) {
        newErrors.dietPreference = 'Invalid diet preference selected';
      }
      if (!['low', 'medium', 'high'].includes(budget)) {
        newErrors.budget = 'Invalid budget level selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step >= 4) return;
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all steps are valid
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setErrorMsg('Please go back and correct validation errors in previous steps.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const finalData = {
        age: parseInt(age, 10),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        country: country.trim(),
        activityLevel,
        fitnessLevel,
        fitnessGoal,
        dietPreference,
        budget,
        equipment,
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

      const profileRes = await api.put('/profile', finalData);
      if (profileRes.data.success) {
        await api.post('/bmi');
        const freshProfileRes = await api.get('/profile');
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
      {/* Stepper */}
      <div className="stepper">
        {[1, 2, 3, 4].map((stepVal, i) => (
          <React.Fragment key={i}>
            <div className={`step-dot ${stepVal < step ? 'step-dot-done' : stepVal === step ? 'step-dot-active' : ''}`}>
              {stepVal < step ? '✓' : stepVal}
            </div>
            {i < 3 && (
              <div className={`step-connector ${stepVal < step ? 'step-connector-done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 alert-danger text-center">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 4) {
            handleSubmit(e);
          } else {
            nextStep();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && step < 4) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
        noValidate
      >
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="section-title-cyan mb-4">Step 1: Personal Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="onboard-age">Age</label>
                <input
                  id="onboard-age"
                  type="number"
                  value={age}
                  onChange={(e) => { setAge(e.target.value); setErrors((p) => ({ ...p, age: '' })); }}
                  className={`input ${errors.age ? 'input-error' : ''}`}
                  placeholder="e.g. 25"
                  disabled={loading}
                />
                {errors.age && <p className="error-msg">{errors.age}</p>}
              </div>
              <div>
                <label className="label" htmlFor="onboard-gender">Gender</label>
                <select
                  id="onboard-gender"
                  value={gender}
                  onChange={(e) => { setGender(e.target.value); setErrors((p) => ({ ...p, gender: '' })); }}
                  className="input"
                  disabled={loading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="error-msg">{errors.gender}</p>}
              </div>
              <div>
                <label className="label" htmlFor="onboard-height">Height (cm)</label>
                <input
                  id="onboard-height"
                  type="number"
                  value={height}
                  onChange={(e) => { setHeight(e.target.value); setErrors((p) => ({ ...p, height: '' })); }}
                  className={`input ${errors.height ? 'input-error' : ''}`}
                  placeholder="e.g. 175"
                  disabled={loading}
                />
                {errors.height && <p className="error-msg">{errors.height}</p>}
              </div>
              <div>
                <label className="label" htmlFor="onboard-weight">Weight (kg)</label>
                <input
                  id="onboard-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => { setWeight(e.target.value); setErrors((p) => ({ ...p, weight: '' })); }}
                  className={`input ${errors.weight ? 'input-error' : ''}`}
                  placeholder="e.g. 70"
                  disabled={loading}
                />
                {errors.weight && <p className="error-msg">{errors.weight}</p>}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="onboard-country">Country</label>
              <input
                id="onboard-country"
                type="text"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setErrors((p) => ({ ...p, country: '' })); }}
                className={`input ${errors.country ? 'input-error' : ''}`}
                placeholder="e.g. United States"
                disabled={loading}
              />
              {errors.country && <p className="error-msg">{errors.country}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Fitness info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="section-title-cyan mb-4">Step 2: Fitness Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="onboard-activity">Activity Level</label>
                <select
                  id="onboard-activity"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="sedentary">Sedentary (Little/no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (Athletic/Physical job)</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="onboard-fitness-level">Fitness Level</label>
                <select
                  id="onboard-fitness-level"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="onboard-fitness-goal">Fitness Goal</label>
                <select
                  id="onboard-fitness-goal"
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="fat_loss">Fat Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="onboard-equipment">Available Equipment</label>
                <select
                  id="onboard-equipment"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="input"
                  disabled={loading}
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
            <h3 className="section-title-cyan mb-4">Step 3: Dietary Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="onboard-diet">Diet Preference</label>
                <select
                  id="onboard-diet"
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="onboard-budget">Budget Level</label>
                <select
                  id="onboard-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="low">Low Budget</option>
                  <option value="medium">Medium Budget</option>
                  <option value="high">High Budget</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="onboard-allergies">Food Allergies (comma separated)</label>
              <input
                id="onboard-allergies"
                type="text"
                value={foodAllergiesInput}
                onChange={(e) => setFoodAllergiesInput(e.target.value)}
                className="input"
                placeholder="e.g. peanuts, dairy, gluten"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Step 4: Medical info & Disclaimer */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="section-title-cyan mb-4">Step 4: Medical Info & Safety</h3>
            
            <div className="alert-warning" style={{ marginBottom: '20px' }}>
              <span style={{ color: '#ff6b2b', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>⚠</span>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b2b', marginBottom: '3px' }}>Safety notice</p>
                <p style={{ fontSize: '12px', color: '#8890a8', lineHeight: 1.6 }}>
                  If you report medical conditions or injuries, AI plan generation is disabled. You will be guided to certified trainers instead.
                </p>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="onboard-conditions">Medical Conditions (comma separated)</label>
              <input
                id="onboard-conditions"
                type="text"
                value={medicalConditionsInput}
                onChange={(e) => setMedicalConditionsInput(e.target.value)}
                className="input"
                placeholder="e.g. asthma, diabetes"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label" htmlFor="onboard-injuries">Injuries (comma separated)</label>
              <input
                id="onboard-injuries"
                type="text"
                value={injuriesInput}
                onChange={(e) => setInjuriesInput(e.target.value)}
                className="input"
                placeholder="e.g. knee pain, lower back strain"
                disabled={loading}
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
              className="btn btn-ghost btn-sm"
              disabled={loading}
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
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm"
            >
              {loading ? 'Submitting...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
