'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface CalorieChartProps {
  logs: IProgressLog[];
  targetCalories?: number;
}

export default function CalorieChart({ logs, targetCalories = 2000 }: CalorieChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const calorieLogs = logs.filter((l) => l.type === 'nutrition' && l.calories !== undefined);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (calorieLogs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No calorie log data available.</p>
      </div>
    );
  }

  const chartData = calorieLogs
    .map((l) => ({
      date: l.date,
      calories: l.calories || 0,
      formattedDate: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
    .reverse();

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#1e1e2e', borderRadius: '12px' }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
            itemStyle={{ color: '#00d4ff' }}
          />
          <ReferenceLine y={targetCalories} stroke="#ff6b35" strokeDasharray="3 3" label={{ value: `Goal: ${targetCalories}`, fill: '#ff6b35', fontSize: 10, position: 'top' }} />
          <Area type="monotone" dataKey="calories" name="Calories (kcal)" stroke="#00d4ff" fillOpacity={1} fill="url(#colorCalories)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
