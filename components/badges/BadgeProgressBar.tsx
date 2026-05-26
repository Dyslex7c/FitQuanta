'use client';
import React from 'react';

interface Props {
  value: number;
  max: number;
  label?: string;
  colorHex?: string;
}

export default function BadgeProgressBar({ value, max, label, colorHex = '#f07028' }: Props) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      {(label || max > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          {label && <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{label}</span>}
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: colorHex }}>
            {value} / {max}
          </span>
        </div>
      )}
      <div style={{ width: '100%', height: '8px', background: '#22223a', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: colorHex.startsWith('linear-gradient') ? colorHex : `linear-gradient(90deg, ${colorHex}, #e8a820)`,
            borderRadius: '4px',
            transition: 'width 1s ease',
          }}
        />
      </div>
    </div>
  );
}
