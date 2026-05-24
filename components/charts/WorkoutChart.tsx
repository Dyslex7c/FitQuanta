'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IProgressLog } from '@/types/progress';

interface WorkoutChartProps {
  logs: IProgressLog[];
}

export default function WorkoutChart({ logs }: WorkoutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const workoutLogs = logs.filter((l) => l.type === 'workout' && l.exercises && l.exercises.length > 0);

  const exercisesSet = new Set<string>();
  workoutLogs.forEach((l) => {
    l.exercises?.forEach((ex) => {
      if (ex.name) exercisesSet.add(ex.name.trim());
    });
  });
  const uniqueExercises = Array.from(exercisesSet);

  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(uniqueExercises[0] || '');
    }
  }, [uniqueExercises, selectedExercise]);

  if (!mounted) return <div className="h-64 flex items-center justify-center text-[#94a3b8]">Loading Chart...</div>;

  if (workoutLogs.length === 0 || uniqueExercises.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-sm text-[#94a3b8]">
        <p className="mb-2">No workout log data available.</p>
      </div>
    );
  }

  const chartData = workoutLogs
    .map((l) => {
      const match = l.exercises?.find((ex) => ex.name.trim() === selectedExercise);
      const volume = match ? match.sets * match.reps * match.weight : 0;
      return {
        date: l.date,
        volume,
        formattedDate: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
    })
    .filter((d) => d.volume > 0)
    .reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#94a3b8]">Filter Exercise:</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-[#0a0a0f] border border-[#1e1e2e] text-[#e2e8f0] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00d4ff]"
        >
          {uniqueExercises.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full h-56">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-[#94a3b8]">
            No records for this exercise.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#1e1e2e', borderRadius: '12px' }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                itemStyle={{ color: '#ff6b35' }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                name="Volume (sets×reps×kg)"
                stroke="#ff6b35"
                strokeWidth={3}
                dot={{ fill: '#ff6b35', r: 4 }}
                activeDot={{ r: 6, stroke: '#0a0a0f', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
