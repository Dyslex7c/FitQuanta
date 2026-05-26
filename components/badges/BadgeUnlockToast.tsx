'use client';
import { useEffect, useState } from 'react';

interface Props {
  badgeName:  string;
  badgeIcon:  string;
  colorHex:   string;
  onDismiss:  () => void;
}

export default function BadgeUnlockToast({ badgeName, badgeIcon, colorHex, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position:  'fixed',
      bottom:    '28px',
      left:      '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
      opacity:   visible ? 1 : 0,
      transition:'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      zIndex:    9999,
      background:'#0d0d14',
      border:    `1px solid ${colorHex}45`,
      borderRadius: '14px',
      padding:   '14px 20px',
      display:   'flex',
      alignItems:'center',
      gap:       '14px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${colorHex}25`,
      minWidth:  '280px',
      maxWidth:  '360px',
    }}>
      {/* Animated icon */}
      <div style={{
        width: '44px', height: '44px',
        background: colorHex + '18',
        border: `1px solid ${colorHex}35`,
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px',
        animation: 'badgeBounce 0.6s ease-out',
        flexShrink: 0,
      }}>
        {badgeIcon}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: colorHex, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '2px' }}>
          Badge Unlocked!
        </p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{badgeName}</p>
      </div>

      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
        style={{ background:'none', border:'none', color:'#545870', cursor:'pointer', fontSize:'18px', lineHeight:1, padding:'2px', flexShrink:0 }}>
        ×
      </button>

      <style>{`
        @keyframes badgeBounce {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes badgeReveal {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
