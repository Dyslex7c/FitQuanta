'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function ExerciseSearch({ value, onChange, placeholder = 'Search exercises...' }: Props) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(local), 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [local]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#545870', fontSize:'16px', pointerEvents:'none' }}>🔍</span>
      <input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        className="input"
        style={{ paddingLeft: '38px' }}
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange(''); }}
          style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#545870', cursor:'pointer', fontSize:'16px', lineHeight:1 }}>
          ×
        </button>
      )}
    </div>
  );
}
