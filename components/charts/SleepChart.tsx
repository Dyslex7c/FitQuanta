'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface SleepChartProps {
  data: Array<{ date: string; hours: number }>;
}

const C = {
  cyan:    '#00d4ff',
  fire:    '#ff6b2b',
  emerald: '#1ed696',
  moon:    '#7eb8e8',
  amber:   '#f0a020',
  chrome:  '#b8c4d4',
  grid:    '#22223a',
  axis:    '#545870',
  tooltip: { bg:'#13131e', border:'#2e2e4a', text:'#eceef4' },
} as const;

export default function SleepChart({ data }: SleepChartProps) {
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

  return (
    <div className="w-full h-64 space-y-2">
      <div className="text-xs font-semibold text-text-muted">Sleep Hours</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
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
          <ReferenceLine
            y={8}
            stroke={C.fire}
            strokeDasharray="5 3"
            strokeWidth={1}
            label={{ value: 'Ideal: 8h', fill: C.fire, fontSize: 9, position: 'top' }}
          />
          <Bar dataKey="hours" name="Sleep Hours" fill={C.moon} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
