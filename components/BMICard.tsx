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
      <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] flex flex-col justify-center items-center text-center py-10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <h3 className="font-display text-lg font-bold text-[#94a3b8] mb-2">BMI Status</h3>
        <p className="text-sm text-[#94a3b8]">Complete your onboarding to see your BMI stats.</p>
      </div>
    );
  }

  // Get color styles based on category
  const stylesMap: Record<BMICategory, { text: string; bg: string; shadow: string }> = {
    Underweight: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-400',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]',
    },
    Normal: {
      text: 'text-[#00d4ff]',
      bg: 'bg-[#00d4ff]',
      shadow: 'shadow-[0_0_15px_rgba(0,212,255,0.4)]',
    },
    Overweight: {
      text: 'text-[#ff6b35]',
      bg: 'bg-[#ff6b35]',
      shadow: 'shadow-[0_0_15px_rgba(255,107,53,0.4)]',
    },
    Obese: {
      text: 'text-red-500',
      bg: 'bg-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    },
  };

  const currentStyles = stylesMap[bmiCategory] ?? stylesMap.Normal;

  // Scale: 15 (0%) to 35 (100%)
  const percentage = Math.min(Math.max(((bmi - 15) / (35 - 15)) * 100, 0), 100);

  return (
    <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold tracking-wider text-[#94a3b8] uppercase">
          BMI Status
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStyles.bg} text-[#0a0a0f] ${currentStyles.shadow}`}>
          {bmiCategory}
        </span>
      </div>

      <div className="flex items-baseline space-x-2 my-2">
        <span className={`text-5xl font-display font-extrabold tracking-tight ${currentStyles.text}`}>
          {bmi}
        </span>
        <span className="text-[#94a3b8] text-sm">kg/m²</span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="mt-4">
        <div className="w-full bg-[#0a0a0f] h-3 rounded-full overflow-hidden border border-[#1e1e2e] relative p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${currentStyles.bg}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#94a3b8] mt-2 px-1">
          <span>15 (Min)</span>
          <span>22.5 (Ideal)</span>
          <span>35 (Obese+)</span>
        </div>
      </div>
    </div>
  );
}
