'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface WeightChartProps {
  data: Array<{ date: string; weight?: number | undefined }>;
}

const C = {
  primary:  '#f07028',   /* orange */
  gold:     '#e8a820',   /* golden yellow */
  emerald:  '#1ed696',   /* keep green for success */
  amber:    '#f5c832',   /* bright yellow for fats */
  chrome:   '#b8c4d4',   /* silver for weight chart */
  grid:     '#22223a',
  axis:     '#545870',
  tooltip:  { bg:'#13131e', border:'#2e2e4a', text:'#ffffff' },
} as const;

export default function WeightChart({ data }: WeightChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Loading...</div>;

  if (data.length === 0) {
    const scrollToForm = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    return (
      <div style={{ padding: '52px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#545870', marginBottom: '14px' }}>No entries logged yet</p>
        <button onClick={scrollToForm} className="btn btn-ghost btn-sm">Log your first entry</button>
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
          <CartesianGrid stroke={C.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: C.tooltip.bg,
              border: `1px solid ${C.tooltip.border}`,
              borderRadius: '8px',
              color: C.tooltip.text,
              fontSize: '12px',
            }}
            cursor={{ stroke: C.grid }}
          />
          {startingWeight > 0 && (
            <ReferenceLine
              y={startingWeight}
              stroke={C.gold}
              strokeDasharray="5 3"
              strokeWidth={1}
              label={{ value: `Start: ${startingWeight}kg`, fill: C.gold, fontSize: 9, position: 'top' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke={C.chrome}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: C.chrome }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
