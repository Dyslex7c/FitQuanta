'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface WorkoutChartProps {
  logs: IProgressLog[];
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
    const scrollToForm = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    return (
      <div style={{ padding: '52px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#545870', marginBottom: '14px' }}>No entries logged yet</p>
        <button onClick={scrollToForm} className="btn btn-ghost btn-sm">Log your first entry</button>
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
          className="bg-raised border border-border text-text-primary text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-orange/60 focus:outline-none max-w-[150px] truncate"
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
          <Line
            type="monotone"
            dataKey="volume"
            name="Volume (kg)"
            stroke={C.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: C.primary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
