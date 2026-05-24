'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface CalorieChartProps {
  data: Array<{ date: string; calories: number }>;
  targetCalories?: number;
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

export default function CalorieChart({ data, targetCalories = 2000 }: CalorieChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-[#94a3b8]">Loading...</div>;

  if (data.length === 0) {
    return (
      <div className="h-64 bg-[#12121a]/30 border border-[#1e1e2e] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="text-4xl">🔥</div>
        <h4 className="text-[#e2e8f0] font-bold text-sm">No data yet</h4>
        <p className="text-xs text-[#94a3b8] max-w-[250px]">
          Start logging your meals to see your progress here.
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
      <div className="text-xs font-semibold text-[#94a3b8]">Calorie Intake (kcal)</div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <defs>
            <linearGradient id="calorieColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <YAxis stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine
            y={targetCalories}
            stroke={CHART_COLORS.orange}
            strokeDasharray="3 3"
            label={{ value: `Goal: ${targetCalories} kcal`, fill: CHART_COLORS.orange, fontSize: 9, position: 'top' }}
          />
          <Area
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke={CHART_COLORS.cyan}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#calorieColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
