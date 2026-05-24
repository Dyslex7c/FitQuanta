'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] bg-[#0a0a0f] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35] mb-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            Setup Your Profile
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Help us understand your biology, lifestyle, and targets to generate customized plans.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </ProtectedRoute>
  );
}
