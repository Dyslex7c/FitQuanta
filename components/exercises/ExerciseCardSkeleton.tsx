export default function ExerciseCardSkeleton() {
  return (
    <div className="animate-pulse" style={{ background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ width:'100%', aspectRatio:'16/9', background:'#13131e' }} />
      <div style={{ padding:'16px' }}>
        <div style={{ height:'16px', background:'#13131e', borderRadius:'4px', marginBottom:'10px', width:'70%' }} />
        <div style={{ height:'12px', background:'#13131e', borderRadius:'4px', marginBottom:'8px', width:'50%' }} />
        <div style={{ display:'flex', gap:'6px' }}>
          <div style={{ height:'22px', width:'70px', background:'#13131e', borderRadius:'5px' }} />
          <div style={{ height:'22px', width:'60px', background:'#13131e', borderRadius:'5px' }} />
        </div>
      </div>
    </div>
  );
}
