'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axiosInstance';
import BadgeCard from '@/components/badges/BadgeCard';
import BadgeUnlockToast from '@/components/badges/BadgeUnlockToast';
import RewardTierCard from '@/components/badges/RewardTierCard';
import type { IAchievementWithProgress, IUserReward, IRewardTier } from '@/types/achievement';

type FilterTab = 'all' | 'earned' | 'locked';

export default function BadgesPage() {
  const [achievements, setAchievements] = useState<IAchievementWithProgress[]>([]);
  const [rewardData,   setRewardData]   = useState<{
    totalBadgesEarned: number;
    currentTier: IRewardTier | null;
    nextTier: IRewardTier | null;
    badgesUntilNextTier: number;
    discountCodes: Array<{ code: string; discountPercent: number; expiresAt: string }>;
    allTiers: IRewardTier[];
  } | null>(null);
  const [filter,   setFilter]   = useState<FilterTab>('all');
  const [loading,  setLoading]  = useState(true);
  const [toasts,   setToasts]   = useState<Array<{ id: string; name: string; icon: string; color: string }>>([]);

  useEffect(() => {
    Promise.all([
      api.get('/achievements').then(r => r.data.data),
      api.get('/rewards').then(r => r.data.data),
    ]).then(([ach, rew]) => {
      setAchievements(ach);
      setRewardData(rew);

      /* Show unlock toasts for recently earned unseen badges */
      const unseen = (ach as IAchievementWithProgress[]).filter(a => a.earned && !a.unlockedAt);
      unseen.forEach((a, i) => {
        setTimeout(() => {
          setToasts(prev => [...prev, { id: a._id, name: a.name, icon: a.icon, color: a.colorHex }]);
        }, i * 600);
      });
    }).finally(() => setLoading(false));

    /* Mark all as seen */
    api.patch('/achievements/my').catch(() => {});
  }, []);

  const filtered = achievements.filter(a => {
    if (filter === 'earned') return a.earned;
    if (filter === 'locked') return !a.earned;
    return true;
  });

  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <div className="page-wrapper">
      <div className="page-inner">

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize:'11px', fontWeight:700, color:'#f07028', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px', fontFamily:'var(--font-display)' }}>
            Achievements
          </p>
          <h1 style={{ fontSize:'28px', fontWeight:900, color:'#ffffff', fontFamily:'var(--font-display)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'8px' }}>
            Your Badges
          </h1>
          <p style={{ fontSize:'14px', color:'#8890a8' }}>
            {earnedCount} of {achievements.length} badges earned
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <span style={{ fontSize:'13px', fontWeight:600, color:'#ffffff' }}>Overall Progress</span>
            <span style={{ fontSize:'13px', fontFamily:'var(--font-mono)', color:'#f07028' }}>
              {earnedCount}/{achievements.length}
            </span>
          </div>
          <div style={{ width:'100%', height:'8px', background:'#22223a', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{
              height: '100%',
              width:  `${achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #f07028, #e8a820)',
              borderRadius: '4px',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

        {/* Reward tier summary */}
        {rewardData && (
          <div className="card" style={{ marginBottom:'28px', borderColor: rewardData.currentTier ? rewardData.currentTier.colorHex + '35' : '#22223a' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <p style={{ fontSize:'11px', color:'#545870', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'4px' }}>
                  Current Reward Tier
                </p>
                <p style={{ fontSize:'18px', fontWeight:700, color: rewardData.currentTier?.colorHex ?? '#545870' }}>
                  {rewardData.currentTier?.label ?? 'No tier yet'}
                </p>
                {rewardData.nextTier && (
                  <p style={{ fontSize:'12px', color:'#8890a8', marginTop:'2px' }}>
                    {rewardData.badgesUntilNextTier} more badge{rewardData.badgesUntilNextTier !== 1 ? 's' : ''} to {rewardData.nextTier.label}
                  </p>
                )}
              </div>
              {rewardData.discountCodes.length > 0 && (
                <div style={{ background:'#13131e', border:'1px solid #22223a', borderRadius:'8px', padding:'10px 14px', textAlign:'center' }}>
                  <p style={{ fontSize:'10px', color:'#545870', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Your Discount Code</p>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:'15px', fontWeight:700, color:'#f07028', letterSpacing:'0.08em' }}>
                    {rewardData.discountCodes[0]!.code}
                  </p>
                  <p style={{ fontSize:'10px', color:'#8890a8', marginTop:'2px' }}>
                    {rewardData.discountCodes[0]!.discountPercent}% off trainer plans
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="tab-list" style={{ marginBottom:'24px' }}>
          {(['all', 'earned', 'locked'] as FilterTab[]).map(t => (
            <button
              key={t}
              className={filter === t ? 'tab-item tab-item-active' : 'tab-item'}
              onClick={() => setFilter(t)}>
              {t === 'all' ? `All (${achievements.length})` : t === 'earned' ? `Earned (${earnedCount})` : `Locked (${achievements.length - earnedCount})`}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'14px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height:'180px', background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', animation:'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'14px', marginBottom:'40px' }}>
            {filtered.map(a => (
              <BadgeCard key={a._id} achievement={a} />
            ))}
          </div>
        )}

        {/* Reward Tiers */}
        {rewardData && (
          <>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:700, color:'#ffffff', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'16px' }}>
              Reward Tiers
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'12px' }}>
              {rewardData.allTiers.map((tier, i) => (
                <RewardTierCard
                  key={tier.label}
                  tier={tier}
                  isCurrent={rewardData.currentTier?.label === tier.label}
                  isLocked={rewardData.totalBadgesEarned < (rewardData.allTiers[i - 1]?.badgesRequired ?? 0)}
                  badgesEarned={rewardData.totalBadgesEarned}
                />
              ))}
            </div>
          </>
        )}

      </div>

      {/* Badge unlock toasts */}
      {toasts.map(t => (
        <BadgeUnlockToast
          key={t.id}
          badgeName={t.name}
          badgeIcon={t.icon}
          colorHex={t.color}
          onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
