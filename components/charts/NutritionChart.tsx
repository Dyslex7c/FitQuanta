'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NutritionChartProps {
  data: Array<{ date: string; protein: number; carbs: number; fats: number }>;
}

const C = {
  cyan:        '#00d4ff',
  orange:      '#ff6b35',
  yellow:      '#fbbf24',
  purple:      '#7b5ea7',
  green:       '#22c55e',
  grid:        '#1e1e3a',
  text:        '#475569',
  tooltipBg:   '#1a1a2e',
  tooltipBorder:'#00d4ff33',
};

export default function NutritionChart({ data }: NutritionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Loading...</div>;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">🍎</div>
        <p className="text-text-muted text-sm font-medium mb-1">No data yet</p>
        <p className="text-text-hint text-xs mb-4">Start logging to see your progress here.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-secondary text-xs px-4 py-2">Log now →</button>
      </div>
    );
  }

  return (
    <div className="w-full h-64 space-y-2">
      <div className="text-xs font-semibold text-text-muted">Daily Macros (g)</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: C.tooltipBg,
              border: `1px solid ${C.tooltipBorder}`,
              borderRadius: '10px',
              color: '#e2e8f0',
              fontSize: '13px',
            }}
            cursor={{ stroke: C.grid, strokeWidth: 1 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: C.text }} />
          <Bar dataKey="protein" name="Protein" fill={C.cyan} radius={[4, 4, 0, 0]} />
          <Bar dataKey="carbs" name="Carbs" fill={C.orange} radius={[4, 4, 0, 0]} />
          <Bar dataKey="fats" name="Fats" fill={C.yellow} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
