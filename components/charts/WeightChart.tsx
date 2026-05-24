'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface WeightChartProps {
  data: Array<{ date: string; weight: number }>;
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

export default function WeightChart({ data }: WeightChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Loading...</div>;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">⚖️</div>
        <p className="text-text-muted text-sm font-medium mb-1">No data yet</p>
        <p className="text-text-hint text-xs mb-4">Start logging to see your progress here.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-secondary text-xs px-4 py-2">Log now →</button>
      </div>
    );
  }

  // First logged entry represents the starting weight
  const startingWeight = data[0]?.weight ?? 0;

  return (
    <div className="w-full h-64 space-y-2">
      <div className="text-xs font-semibold text-text-muted">Weight Progress (kg)</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
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
          {startingWeight > 0 && (
            <ReferenceLine
              y={startingWeight}
              stroke={C.orange}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `Start: ${startingWeight}kg`, fill: C.orange, fontSize: 9, position: 'top' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke={C.cyan}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: C.cyan }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
