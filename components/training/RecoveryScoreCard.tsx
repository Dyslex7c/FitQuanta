'use client';

interface Props {
  score: number; /* 0–100 */
  sleepHours?: number;
  cardioMinutes?: number;
}

export default function RecoveryScoreCard({ score, sleepHours = 7, cardioMinutes = 0 }: Props) {
  let color = '#22c55e'; // Green (default)
  let status = 'Excellent';
  let desc = 'Your body is fully primed for high-intensity training.';

  if (score < 25) {
    color = '#7f1d1d'; // Dark Red
    status = 'Critical Rest Needed';
    desc = 'Severe under-recovery. Avoid training today to prevent injury and burnout.';
  } else if (score < 50) {
    color = '#ef4444'; // Red
    status = 'Poor Recovery';
    desc = 'Recovery levels are low. Focus on active rest, hydration, and sleep.';
  } else if (score < 75) {
    color = '#eab308'; // Yellow
    status = 'Moderate Recovery';
    desc = 'Reasonable recovery, but consider light training or active rest.';
  }

  return (
    <div style={{
      background: '#0d0d14',
      border: `1px solid ${color}40`,
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: '-40px',
        width: '100px',
        height: '100px',
        background: `${color}15`,
        borderRadius: '50%',
        filter: 'blur(20px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#545870', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Recovery Status
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {status}
          </h3>
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 900,
          color: color,
          fontFamily: 'var(--font-mono)'
        }}>
          {score}%
        </div>
      </div>

      <div style={{ width: '100%', height: '6px', background: '#22223a', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 1s ease'
        }} />
      </div>

      <p style={{ fontSize: '12px', color: '#8890a8', lineHeight: 1.5, margin: 0 }}>
        {desc}
      </p>

      <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #22223a', paddingTop: '12px', marginTop: '4px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#545870', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Sleep</p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: 'var(--font-mono)' }}>
            {sleepHours.toFixed(1)} hrs
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#545870', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Cardio Load</p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: 'var(--font-mono)' }}>
            {cardioMinutes} mins
          </p>
        </div>
      </div>
    </div>
  );
}
