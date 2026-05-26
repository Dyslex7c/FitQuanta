'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axiosInstance';
import TrainingStatusCard   from '@/components/training/TrainingStatusCard';
import TrainingScoreGauge   from '@/components/training/TrainingScoreGauge';
import RecoveryScoreCard    from '@/components/training/RecoveryScoreCard';
import FatigueHeatmap       from '@/components/training/FatigueHeatmap';
import MuscleRecoveryChart  from '@/components/training/MuscleRecoveryChart';
import WeeklyVolumeChart    from '@/components/training/WeeklyVolumeChart';
import TrainingZoneBar      from '@/components/training/TrainingZoneBar';
import TrainingInsightFeed  from '@/components/training/TrainingInsightFeed';
import type { ITrainingAnalysis } from '@/types/training';
import { STATUS_COLOR } from '@/types/training';

export default function TrainingAnalysisPage() {
  const [analysis, setAnalysis] = useState<ITrainingAnalysis | null>(null);
  const [history,  setHistory]  = useState<ITrainingAnalysis[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/training/analysis')
      .then(r => {
        setAnalysis(r.data.data.latest);
        setHistory(r.data.data.history ?? []);
      })
      .catch(err => {
        console.error('Error fetching training analysis:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const colorHex = analysis ? STATUS_COLOR[analysis.trainingStatus as keyof typeof STATUS_COLOR] : '#545870';

  return (
    <div className="page-wrapper">
      <div className="page-inner">

        {/* Header */}
        <div style={{ marginBottom:'32px' }}>
          <p style={{ fontSize:'11px', fontWeight:700, color:'#f07028', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px', fontFamily:'var(--font-display)' }}>
            AI Analysis
          </p>
          <h1 style={{ fontSize:'28px', fontWeight:900, color:'#ffffff', fontFamily:'var(--font-display)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'8px' }}>
            Training Quality
          </h1>
          <p style={{ fontSize:'14px', color:'#8890a8' }}>
            AI-powered analysis of your workout patterns, recovery, and fatigue
          </p>
        </div>

        {loading ? (
          <div style={{ display:'grid', gap:'14px' }}>
            {Array.from({ length: 4 }).map((_,i) => (
              <div key={i} style={{ height:'160px', background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px', animation:'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : !analysis ? (
          <div className="card" style={{ textAlign:'center', padding:'48px 20px' }}>
            <p style={{ fontSize:'32px', marginBottom:'12px' }}>🏋️</p>
            <p style={{ fontSize:'15px', fontWeight:600, color:'#ffffff', marginBottom:'8px' }}>No Analysis Yet</p>
            <p style={{ fontSize:'13px', color:'#8890a8' }}>Log your first workout to generate your AI training analysis.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Status card + gauges */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'14px', alignItems:'start' }}>
              <TrainingStatusCard
                status={analysis.trainingStatus as 'optimal' | 'undertraining' | 'slight_undertraining' | 'overtraining'}
                trainingScore={analysis.trainingScore}
                fatigueLevel={analysis.fatigueLevel}
                insights={analysis.aiInsights}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', padding:'22px 18px', background:'#0d0d14', border:'1px solid #22223a', borderRadius:'12px' }}>
                <TrainingScoreGauge score={analysis.trainingScore}  label="Training Score"  colorHex={colorHex} />
                <TrainingScoreGauge score={analysis.recoveryScore}  label="Recovery Score"  colorHex="#3ecfb2"  />
                <TrainingScoreGauge score={analysis.weeklyIntensityScore} label="Intensity Score" colorHex="#e8a820" />
              </div>
            </div>

            {/* Training intensity zone bar */}
            <TrainingZoneBar status={analysis.trainingStatus} score={analysis.trainingScore} />

            {/* Weekly stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'12px' }}>
              {[
                { label:'Weekly Volume',     value:`${analysis.weeklyVolume} sets`,   color:'#f07028' },
                { label:'Workout Days',      value:`${analysis.weeklyFrequency} days`, color:'#3ecfb2' },
                { label:'Avg Sleep',         value:`${analysis.avgSleepHours.toFixed(1)} hrs`, color:'#7eb8e8' },
                { label:'Cardio Load',       value:`${analysis.cardioLoadMinutes} min`, color:'#e8a820' },
                { label:'Consecutive Days',  value:`${analysis.consecutiveTrainingDays} days`, color: analysis.consecutiveTrainingDays >= 5 ? '#ef4444' : '#22c55e' },
              ].map(stat => (
                <div key={stat.label} style={{ background:'#0d0d14', border:'1px solid #22223a', borderRadius:'10px', padding:'14px 16px' }}>
                  <p style={{ fontSize:'10px', color:'#545870', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>{stat.label}</p>
                  <p style={{ fontSize:'18px', fontWeight:800, color:stat.color, fontFamily:'var(--font-mono)' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recovery card & Fatigue heatmap row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>
              <RecoveryScoreCard
                score={analysis.recoveryScore}
                sleepHours={analysis.avgSleepHours}
                cardioMinutes={analysis.cardioLoadMinutes}
              />
              <FatigueHeatmap dailyFatigue={analysis.dailyFatigue} />
            </div>

            {/* Muscle recovery */}
            {analysis.muscleRecovery.length > 0 && (
              <MuscleRecoveryChart muscleRecovery={analysis.muscleRecovery} />
            )}

            {/* Weekly volume trend */}
            {history.length > 1 && (
              <WeeklyVolumeChart history={history} />
            )}

            {/* AI insight feed */}
            <TrainingInsightFeed insights={analysis.aiInsights} colorHex={colorHex} />

          </div>
        )}
      </div>
    </div>
  );
}
