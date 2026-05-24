'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface StepsChartProps {
  logs: IProgressLog[];
}

export default function StepsChart({ logs }: StepsChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stepsLogs = logs.filter((l) => l.type === 'health' && l.steps !== undefined);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (stepsLogs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No steps log data available.</p>
      </div>
    );
  }

  const chartData = stepsLogs
    .map((l) => ({
      date: l.date,
      steps: l.steps || 0,
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
            itemStyle={{ color: '#ff6b35' }}
          />
          <ReferenceLine y={10000} stroke="#00d4ff" strokeDasharray="3 3" label={{ value: 'Target: 10k', fill: '#00d4ff', fontSize: 10, position: 'top' }} />
          <Bar dataKey="steps" name="Steps" fill="#ff6b35" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
