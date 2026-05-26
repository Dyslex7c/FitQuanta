'use client';

interface WeekEntry {
  weekStartDate: string;
  weeklyVolume:  number;
  trainingScore: number;
  trainingStatus:string;
}

interface Props {
  history: WeekEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  optimal:             '#22c55e',
  slight_undertraining:'#eab308',
  undertraining:       '#ef4444',
  overtraining:        '#7f1d1d',
};

export default function WeeklyVolumeChart({ history }: Props) {
  const maxVolume = Math.max(...history.map(h => h.weeklyVolume), 1);

  return (
    <div style={{ background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', padding:'20px' }}>
      <p style={{ fontSize:'12px', fontWeight:700, color:'#8890a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>
        Weekly Volume Trend
      </p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'100px' }}>
        {[...history].reverse().map((week, i) => {
          const heightPct = (week.weeklyVolume / maxVolume) * 100;
          const color     = STATUS_COLORS[week.trainingStatus] ?? '#545870';
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
              <div style={{ width:'100%', position:'relative', height:'80px', display:'flex', alignItems:'flex-end' }}>
                <div style={{
                  width:'100%',
                  height:`${heightPct}%`,
                  minHeight:'4px',
                  background: color + '40',
                  border: `1px solid ${color}60`,
                  borderRadius:'4px 4px 0 0',
                  transition:'height 1s ease',
                }} />
              </div>
              <p style={{ fontSize:'9px', color:'#545870', textAlign:'center' }}>
                {new Date(week.weekStartDate).toLocaleDateString('en-IN',{ month:'short', day:'numeric' })}
              </p>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize:'10px', color:'#545870', marginTop:'8px' }}>Bar color reflects training status for that week</p>
    </div>
  );
}
