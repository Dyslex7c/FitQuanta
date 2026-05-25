'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="page-wrapper py-12">
        <div className="w-full max-w-2xl animate-fade-in mx-auto px-4 sm:px-6">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ marginBottom: '8px' }}>Setup Your Profile</h1>
            <p style={{ fontSize: '13px', color: '#8890a8' }}>
              Help us understand your biology, lifestyle, and targets to generate customized plans.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
