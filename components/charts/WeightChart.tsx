'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightChartProps {
  data: Array<{ date: string; bodyWeight: number }>;
}

export default function WeightChart({ data }: WeightChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No weight log data available.</p>
      </div>
    );
  }

  const chartData = data
    .map((d) => ({
      ...d,
      formattedDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
    .reverse();

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#1e1e2e', borderRadius: '12px' }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
            itemStyle={{ color: '#00d4ff' }}
          />
          <Line
            type="monotone"
            dataKey="bodyWeight"
            name="Weight (kg)"
            stroke="#00d4ff"
            strokeWidth={3}
            dot={{ fill: '#00d4ff', r: 4 }}
            activeDot={{ r: 6, stroke: '#0a0a0f', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
