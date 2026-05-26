'use client';
import React from 'react';
import BadgeCard from './BadgeCard';
import type { IAchievementWithProgress } from '@/types/achievement';

interface Props {
  achievements: IAchievementWithProgress[];
  loading?: boolean;
}

export default function BadgeGrid({ achievements, loading = false }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '180px',
              background: '#0d0d14',
              border: '1px solid #22223a',
              borderRadius: '12px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #22223a', borderRadius: '12px', color: '#545870' }}>
        No badges found matching the filter.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
      {achievements.map((ach) => (
        <BadgeCard key={ach._id} achievement={ach} />
      ))}
    </div>
  );
}
