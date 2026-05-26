import type { IRewardTier } from '@/types/achievement';

interface Props {
  tier:      IRewardTier;
  isCurrent: boolean;
  isLocked:  boolean;
  badgesEarned: number;
}

export default function RewardTierCard({ tier, isCurrent, isLocked, badgesEarned }: Props) {
  const progress = Math.min(Math.round((badgesEarned / tier.badgesRequired) * 100), 100);

  return (
    <div style={{
      background:   '#0d0d14',
      border:       `1px solid ${isCurrent ? tier.colorHex + '50' : '#22223a'}`,
      borderRadius: '12px',
      padding:      '18px 20px',
      opacity:       isLocked ? 0.5 : 1,
      position:     'relative',
      overflow:     'hidden',
    }}>
      {isCurrent && (
        <div style={{
          position: 'absolute', top: '10px', right: '12px',
          fontSize: '10px', fontWeight: 700,
          background: tier.colorHex + '20',
          color: tier.colorHex,
          border: `1px solid ${tier.colorHex}35`,
          borderRadius: '4px',
          padding: '2px 8px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Current
        </div>
      )}

      <p style={{ fontSize: '11px', color: tier.colorHex, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
        {tier.label}
      </p>
      <p style={{ fontSize: '13px', color: '#8890a8', marginBottom: '12px' }}>
        Requires {tier.badgesRequired} badges · {tier.rewardDescription}
      </p>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
        {tier.perks.map((perk, i) => (
          <span key={i} style={{
            fontSize: '11px', padding: '2px 9px', borderRadius: '4px',
            background: tier.colorHex + '12',
            color: tier.colorHex,
            border: `1px solid ${tier.colorHex}25`,
          }}>
            {perk}
          </span>
        ))}
      </div>

      {!isLocked && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'10px', color:'#545870' }}>Progress</span>
            <span style={{ fontSize:'10px', color:'#8890a8', fontFamily:'var(--font-mono)' }}>
              {Math.min(badgesEarned, tier.badgesRequired)} / {tier.badgesRequired}
            </span>
          </div>
          <div style={{ width:'100%', height:'5px', background:'#22223a', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: tier.colorHex,
              borderRadius: '3px',
              transition: 'width 1s ease',
            }} />
          </div>
        </>
      )}
    </div>
  );
}
