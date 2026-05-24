'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface WorkoutChartProps {
  logs: IProgressLog[];
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

export default function WorkoutChart({ logs }: WorkoutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const workoutLogs = logs.filter(
    (l) => l.type === 'workout' && Array.isArray(l.exercises) && l.exercises.length > 0
  );

  const uniqueExercises = Array.from(
    new Set(
      workoutLogs.flatMap((l) => l.exercises?.map((e) => e.name.trim()) ?? [])
    )
  ).filter(Boolean);

  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(uniqueExercises[0] || '');
    }
  }, [uniqueExercises, selectedExercise]);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-[#94a3b8]">Loading...</div>;

  if (workoutLogs.length === 0 || uniqueExercises.length === 0) {
    return (
      <div className="h-64 bg-[#12121a]/30 border border-[#1e1e2e] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="text-4xl">💪</div>
        <h4 className="text-[#e2e8f0] font-bold text-sm">No data yet</h4>
        <p className="text-xs text-[#94a3b8] max-w-[250px]">
          Start logging your workouts to see your progress here.
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

  const chartData = [...workoutLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((l) => {
      const match = l.exercises?.find((e) => e.name.trim() === selectedExercise);
      return {
        date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        volume: match ? match.sets * match.reps * match.weight : 0,
      };
    })
    .filter((d) => d.volume > 0);

  return (
    <div className="w-full h-64 space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-xs font-semibold text-[#94a3b8]">Workout Volume</div>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-[#1a1a2e] border border-[#1e1e2e] text-[#e2e8f0] text-xs rounded-xl px-2 py-1 focus:ring-1 focus:ring-[#00d4ff] focus:outline-none max-w-[150px] truncate"
        >
          {uniqueExercises.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <YAxis stroke={CHART_COLORS.text} fontSize={10} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="volume"
            name="Volume (kg)"
            stroke={CHART_COLORS.cyan}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.cyan, r: 4 }}
            activeDot={{ r: 6, stroke: '#0a0a0f', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
