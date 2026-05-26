'use client';
import type { IAchievementWithProgress } from '@/types/achievement';

const rarityLabel: Record<string, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};

interface Props {
  achievement: IAchievementWithProgress;
  animateIn?: boolean;
}

export default function BadgeCard({ achievement, animateIn = false }: Props) {
  const { earned, icon, name, description, rarity, colorHex, progress, currentValue, condition } = achievement;

  return (
    <div style={{
      background:   '#0d0d14',
      border:       `1px solid ${earned ? colorHex + '45' : '#22223a'}`,
      borderRadius: '12px',
      padding:      '20px 18px',
      display:      'flex',
      flexDirection:'column',
      gap:          '12px',
      opacity:       earned ? 1 : 0.55,
      transition:   'all 0.2s ease',
      position:     'relative',
      overflow:     'hidden',
      animation:    animateIn ? 'badgeReveal 0.5s ease-out' : 'none',
    }}>

      {/* Earned glow blob behind icon */}
      {earned && (
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '80px', height: '80px',
          background: colorHex + '18',
          borderRadius: '50%',
          filter: 'blur(16px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon + rarity */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          width: '48px', height: '48px',
          background: earned ? colorHex + '18' : '#13131e',
          border: `1px solid ${earned ? colorHex + '35' : '#22223a'}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          filter: earned ? 'none' : 'grayscale(1)',
        }}>
          {earned ? icon : '🔒'}
        </div>

        <span style={{
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: '4px',
          background: earned ? colorHex + '18' : '#13131e',
          color: earned ? colorHex : '#545870',
          border: `1px solid ${earned ? colorHex + '30' : '#22223a'}`,
        }}>
          {rarityLabel[rarity]}
        </span>
      </div>

      {/* Name + description */}
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: earned ? '#ffffff' : '#8890a8', marginBottom: '4px' }}>
          {name}
        </p>
        <p style={{ fontSize: '11px', color: '#545870', lineHeight: 1.55 }}>
          {description}
        </p>
      </div>

      {/* Progress bar — only for locked badges */}
      {!earned && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'10px', color:'#545870' }}>Progress</span>
            <span style={{ fontSize:'10px', color:'#8890a8', fontFamily:'var(--font-mono)' }}>
              {currentValue ?? 0} / {condition.threshold}
            </span>
          </div>
          <div style={{ width:'100%', height:'4px', background:'#22223a', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress ?? 0}%`,
              background: colorHex,
              borderRadius: '2px',
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}

      {/* Earned date */}
      {earned && achievement.unlockedAt && (
        <p style={{ fontSize: '10px', color: '#545870', marginTop: '-4px' }}>
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
        </p>
      )}
    </div>
  );
}
