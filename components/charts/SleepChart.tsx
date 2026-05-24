'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface SleepChartProps {
  logs: IProgressLog[];
}

export default function SleepChart({ logs }: SleepChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sleepLogs = logs.filter((l) => l.type === 'health' && l.sleepHours !== undefined);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (sleepLogs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No sleep log data available.</p>
      </div>
    );
  }

  const chartData = sleepLogs
    .map((l) => ({
      date: l.date,
      sleepHours: l.sleepHours || 0,
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
            itemStyle={{ color: '#00d4ff' }}
          />
          <ReferenceLine y={8} stroke="#ff6b35" strokeDasharray="3 3" label={{ value: 'Ideal: 8h', fill: '#ff6b35', fontSize: 10, position: 'top' }} />
          <Bar dataKey="sleepHours" name="Sleep (hours)" fill="#00d4ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
