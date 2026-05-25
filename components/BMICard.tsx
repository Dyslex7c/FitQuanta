'use client';

import React from 'react';
import type { BMICategory } from '@/types/user';

interface BMICardProps {
  bmi?: number | undefined;
  bmiCategory?: BMICategory | undefined;
}

export default function BMICard({ bmi, bmiCategory }: BMICardProps) {
  if (!bmi || !bmiCategory) {
    return (
      <div className="card flex flex-col justify-center items-center text-center py-10">
        <h3 className="font-display text-lg font-bold text-text-muted mb-2">BMI Status</h3>
        <p className="text-sm text-text-muted">Complete your onboarding to see your BMI stats.</p>
      </div>
    );
  }

  // Get color styles based on category
  const stylesMap: Record<BMICategory, { text: string; badge: string; bg: string }> = {
    Underweight: {
      text: 'bmi-underweight',
      badge: 'badge-amber',
      bg: 'bg-amber',
    },
    Normal: {
      text: 'bmi-normal',
      badge: 'badge-emerald',
      bg: 'bg-emerald',
    },
    Overweight: {
      text: 'bmi-overweight',
      badge: 'badge-fire',
      bg: 'bg-fire',
    },
    Obese: {
      text: 'bmi-obese',
      badge: 'badge-danger',
      bg: 'bg-danger',
    },
  };

  const currentStyles = stylesMap[bmiCategory] ?? stylesMap.Normal;

  // Scale: 15 (0%) to 35 (100%)
  const percentage = Math.min(Math.max(((bmi - 15) / (35 - 15)) * 100, 0), 100);

  return (
    <div className="card flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">
          BMI Status
        </h3>
        <span className={currentStyles.badge}>
          {bmiCategory}
        </span>
      </div>

      <div className="flex items-baseline space-x-2 my-2">
        <span className={`text-5xl font-display font-extrabold tracking-tight ${currentStyles.text}`}>
          {bmi}
        </span>
        <span className="text-text-muted text-sm">kg/m²</span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="mt-4">
        <div className="w-full bg-raised h-3 rounded-full overflow-hidden border border-border relative p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${currentStyles.bg}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-2 px-1">
          <span>15 (Min)</span>
          <span>22.5 (Ideal)</span>
          <span>35 (Obese+)</span>
        </div>
      </div>
    </div>
  );
}
