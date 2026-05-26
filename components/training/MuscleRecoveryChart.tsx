'use client';
import type { IMuscleRecovery } from '@/types/training';

interface Props {
  muscleRecovery: IMuscleRecovery[];
}

export default function MuscleRecoveryChart({ muscleRecovery }: Props) {
  return (
    <div style={{ background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', padding:'20px' }}>
      <p style={{ fontSize:'12px', fontWeight:700, color:'#8890a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>
        Muscle Recovery Status
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {muscleRecovery.map((m) => {
          const color = m.needsRest
            ? m.recoveryPercent < 30 ? '#7f1d1d' : '#ef4444'
            : '#22c55e';
          return (
            <div key={m.muscle}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                <span style={{ fontSize:'12px', color:'#8890a8', textTransform:'capitalize' }}>{m.muscle}</span>
                <span style={{ fontSize:'11px', color, fontFamily:'var(--font-mono)' }}>
                  {m.recoveryPercent}% {m.needsRest ? '⚠ Needs Rest' : '✓ Ready'}
                </span>
              </div>
              <div style={{ width:'100%', height:'5px', background:'#22223a', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{
                  height:'100%', width:`${m.recoveryPercent}%`,
                  background: color,
                  borderRadius:'3px',
                  transition:'width 1s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
