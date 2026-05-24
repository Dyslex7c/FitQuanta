'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="page-wrapper flex flex-col items-center justify-center min-h-[85vh]">
        <div className="page-content w-full max-w-2xl animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-extrabold text-cyan mb-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.2)]">
              Setup Your Profile
            </h1>
            <p className="text-sm text-text-muted">
              Help us understand your biology, lifestyle, and targets to generate customized plans.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
