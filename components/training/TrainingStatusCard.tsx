'use client';
import type { TrainingStatus } from '@/types/training';
import { STATUS_COLOR, STATUS_LABEL } from '@/types/training';

interface Props {
  status:        TrainingStatus;
  trainingScore: number;
  fatigueLevel:  string;
  insights:      string[];
}

export default function TrainingStatusCard({ status, trainingScore, fatigueLevel, insights }: Props) {
  const color = STATUS_COLOR[status];
  const label = STATUS_LABEL[status];

  return (
    <div style={{
      background:   '#0d0d14',
      border:       `1px solid ${color}45`,
      borderRadius: '12px',
      padding:      '22px 20px',
      position:     'relative',
      overflow:     'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        background: color + '12',
        borderRadius: '50%',
        filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <p style={{ fontSize:'11px', fontWeight:700, color:'#545870', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>
            Training Status
          </p>
          <p style={{ fontSize:'20px', fontWeight:800, color }}>
            {label}
          </p>
        </div>
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '50%',
          background: color + '18',
          border: `2px solid ${color}45`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 900, color,
          fontFamily: 'var(--font-mono)',
        }}>
          {trainingScore}
        </div>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', borderRadius: '6px',
        background: color + '14', border: `1px solid ${color}30`,
        marginBottom: '16px',
      }}>
        <span style={{ fontSize:'11px', color, fontWeight:600 }}>
          Fatigue: {fatigueLevel.charAt(0).toUpperCase() + fatigueLevel.slice(1)}
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {insights.map((insight, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
            <span style={{ color, fontSize:'13px', marginTop:'1px', flexShrink:0 }}>›</span>
            <p style={{ fontSize:'12px', color:'#8890a8', lineHeight:1.6 }}>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
