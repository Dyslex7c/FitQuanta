'use client';

interface DayEntry {
  date:         string;
  fatigueScore: number;
  status:       string;
}

interface Props {
  dailyFatigue: DayEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  optimal:             '#22c55e',
  slight_undertraining:'#eab308',
  undertraining:       '#ef4444',
  overtraining:        '#7f1d1d',
};

export default function FatigueHeatmap({ dailyFatigue }: Props) {
  return (
    <div style={{ background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', padding:'20px' }}>
      <p style={{ fontSize:'12px', fontWeight:700, color:'#8890a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px' }}>
        7-Day Fatigue Heatmap
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' }}>
        {dailyFatigue.slice(0, 7).reverse().map((day, i) => {
          const color = STATUS_COLORS[day.status] ?? '#22223a';
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
              <div style={{
                width:'100%', aspectRatio:'1',
                background: color + '25',
                border: `1px solid ${color}45`,
                borderRadius:'8px',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'11px', fontWeight:700, color,
                fontFamily:'var(--font-mono)',
              }}>
                {day.fatigueScore}
              </div>
              <p style={{ fontSize:'9px', color:'#545870', textAlign:'center' }}>
                {new Date(day.date).toLocaleDateString('en-IN',{ weekday:'short' })}
              </p>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:'12px', marginTop:'14px', flexWrap:'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([key, color]) => (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:color }} />
            <p style={{ fontSize:'10px', color:'#545870', textTransform:'capitalize' }}>
              {key.replace('_',' ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
