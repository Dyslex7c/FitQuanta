'use client';

import React from 'react';

interface TypingIndicatorProps {
  name: string;
}

export default function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid #22223a', borderRadius: '12px', width: 'fit-content', margin: '8px 0', animation: 'pulse 1.5s infinite' }}>
      <span style={{ fontSize: '11px', color: '#9090a0' }}>
        {name} is typing
      </span>
      <div style={{ display: 'flex', gap: '3px' }}>
        <span
          style={{
            width: '4px',
            height: '4px',
            background: '#f07028',
            borderRadius: '50%',
            animation: 'bounce 0.8s infinite 0s'
          }}
        />
        <span
          style={{
            width: '4px',
            height: '4px',
            background: '#f07028',
            borderRadius: '50%',
            animation: 'bounce 0.8s infinite 0.2s'
          }}
        />
        <span
          style={{
            width: '4px',
            height: '4px',
            background: '#f07028',
            borderRadius: '50%',
            animation: 'bounce 0.8s infinite 0.4s'
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
