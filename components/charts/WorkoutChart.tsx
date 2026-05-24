'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface WorkoutChartProps {
  logs: IProgressLog[];
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

  if (!mounted) return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Loading...</div>;

  if (workoutLogs.length === 0 || uniqueExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">💪</div>
        <p className="text-text-muted text-sm font-medium mb-1">No data yet</p>
        <p className="text-text-hint text-xs mb-4">Start logging to see your progress here.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-secondary text-xs px-4 py-2">Log now →</button>
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
        <div className="text-xs font-semibold text-text-muted">Workout Volume</div>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-raised border border-border text-text-primary text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan focus:outline-none max-w-[150px] truncate"
        >
          {uniqueExercises.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
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
          <Line
            type="monotone"
            dataKey="volume"
            name="Volume (kg)"
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
