'use client';

interface Props {
  insights: string[];
  colorHex: string;
}

export default function TrainingInsightFeed({ insights, colorHex }: Props) {
  if (!insights || insights.length === 0) return null;

  return (
    <div style={{ background:'#0d0d14', border:`1px solid ${colorHex}30`, borderRadius:'12px', padding:'20px' }}>
      <p style={{ fontSize:'12px', fontWeight:700, color:'#8890a8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px' }}>
        AI Training Insights
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {insights.map((insight, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:'10px',
            padding:'10px 12px',
            background:'#13131e',
            border:`1px solid ${colorHex}20`,
            borderRadius:'8px',
          }}>
            <span style={{ color:colorHex, fontSize:'14px', flexShrink:0, marginTop:'1px' }}>✦</span>
            <p style={{ fontSize:'12px', color:'#c0c8d8', lineHeight:1.65 }}>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
