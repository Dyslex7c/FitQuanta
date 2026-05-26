'use client';

interface Props {
  score:    number;   /* 0–100 */
  label:    string;
  colorHex: string;
  size?:    number;
}

export default function TrainingScoreGauge({ score, label, colorHex, size = 140 }: Props) {
  const r        = (size / 2) - 12;
  const circ     = 2 * Math.PI * r;
  const arc      = circ * 0.75;          /* 270° gauge */
  const fill     = arc * (score / 100);
  const rotation = 135;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(0deg)' }}>
          {/* Track */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke="#22223a" strokeWidth="10"
            strokeDasharray={`${arc} ${circ - arc}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size/2} ${size/2})`}
          />
          {/* Fill */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={colorHex} strokeWidth="10"
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position:'absolute', inset:0,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <p style={{ fontSize:'22px', fontWeight:900, color: colorHex, fontFamily:'var(--font-mono)', lineHeight:1 }}>
            {score}
          </p>
          <p style={{ fontSize:'9px', color:'#545870', textTransform:'uppercase', letterSpacing:'0.06em' }}>/ 100</p>
        </div>
      </div>
      <p style={{ fontSize:'12px', color:'#8890a8', fontWeight:600, textAlign:'center' }}>{label}</p>
    </div>
  );
}
