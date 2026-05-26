'use client';

import type { TrainingStatus } from '@/types/training';
import { STATUS_COLOR } from '@/types/training';

interface Props {
  status: TrainingStatus;
  score: number; /* 0–100 */
}

export default function TrainingZoneBar({ status, score }: Props) {
  const pointerPosition = `${score}%`;
  const pointerColor = STATUS_COLOR[status];

  return (
    <div style={{
      background: '#0d0d14',
      border: '1px solid #22223a',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#8890a8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
        Training Intensity Zone
      </p>

      {/* Bar Container */}
      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '8px' }}>
        {/* Scale Bar */}
        <div style={{
          height: '10px',
          borderRadius: '5px',
          background: 'linear-gradient(to right, #ef4444 0%, #ef4444 40%, #eab308 40%, #eab308 55%, #22c55e 55%, #22c55e 85%, #7f1d1d 85%, #7f1d1d 100%)',
          width: '100%'
        }} />

        {/* Pointer */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: `calc(${pointerPosition} - 6px)`,
          width: '12px',
          height: '22px',
          background: pointerColor,
          border: '2px solid #ffffff',
          borderRadius: '6px',
          boxShadow: `0 0 12px ${pointerColor}`,
          transition: 'left 1s ease',
          zIndex: 10
        }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#545870', textTransform: 'uppercase', fontWeight: 600 }}>
        <span style={{ color: '#ef4444' }}>Under (0-40)</span>
        <span style={{ color: '#eab308' }}>Slight Under (40-55)</span>
        <span style={{ color: '#22c55e' }}>Optimal (55-85)</span>
        <span style={{ color: '#7f1d1d' }}>Over (85-100)</span>
      </div>

      <p style={{ fontSize: '11px', color: '#8890a8', margin: '4px 0 0 0', lineHeight: 1.4 }}>
        Your score is <strong style={{ color: pointerColor }}>{score}</strong>, classifying your current state as <strong style={{ color: pointerColor, textTransform: 'uppercase' }}>{status.replace('_', ' ')}</strong>.
      </p>
    </div>
  );
}
