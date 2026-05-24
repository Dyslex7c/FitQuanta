'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface SleepChartProps {
  data: Array<{ date: string; hours: number }>;
}

const CHART_COLORS = {
  cyan: '#00d4ff',
  orange: '#ff6b35',
  yellow: '#fbbf24',
  grid: '#1e1e2e',
  tooltip_bg: '#1a1a2e',
  tooltip_border: '#00d4ff',
  text: '#94a3b8',
};

const tooltipStyle = { 
  backgroundColor: '#1a1a2e', 
  border: '1px solid #00d4ff', 
  borderRadius: '8px', 
  color: '#e2e8f0' 
};

export default function SleepChart({ data }: SleepChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-[#94a3b8]">Loading...</div>;

  if (data.length === 0) {
    return (
      <div className="h-64 bg-[#12121a]/30 border border-[#1e1e2e] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="text-4xl">😴</div>
        <h4 className="text-[#e2e8f0] font-bold text-sm">No data yet</h4>
        <p className="text-xs text-[#94a3b8] max-w-[250px]">
          Start logging your health to see your progress here.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs text-[#00d4ff] font-bold hover:underline"
        >
          Log Now &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-64 space-y-2">
      <div className="text-xs font-semibold text-[#94a3b8]">Sleep Hours</div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <YAxis stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine
            y={8}
            stroke={CHART_COLORS.cyan}
            strokeDasharray="3 3"
            label={{ value: 'Ideal: 8h', fill: CHART_COLORS.cyan, fontSize: 9, position: 'top' }}
          />
          <Bar dataKey="hours" name="Sleep Hours" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
