'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface NutritionChartProps {
  logs: IProgressLog[];
}

export default function NutritionChart({ logs }: NutritionChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nutritionLogs = logs.filter(
    (l) => l.type === 'nutrition' && (l.protein !== undefined || l.carbs !== undefined || l.fats !== undefined)
  );

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (nutritionLogs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No nutrition log data available.</p>
      </div>
    );
  }

  const chartData = nutritionLogs
    .map((l) => ({
      date: l.date,
      protein: l.protein || 0,
      carbs: l.carbs || 0,
      fats: l.fats || 0,
      formattedDate: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
    .reverse();

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#1e1e2e', borderRadius: '12px' }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="protein" name="Protein (g)" fill="#00d4ff" radius={[4, 4, 0, 0]} />
          <Bar dataKey="carbs" name="Carbs (g)" fill="#ff6b35" radius={[4, 4, 0, 0]} />
          <Bar dataKey="fats" name="Fats (g)" fill="#facc15" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
