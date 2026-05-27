'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axiosInstance';
import type { IExercise } from '@/types/exercise';

const difficultyColor: Record<string, string> = {
  beginner: '#1ed696', intermediate: '#f07028', advanced: '#f04040',
};

export default function ExerciseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [exercise, setExercise] = useState<IExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    // Fetch exercise details and favorites in parallel to accurately show saved status on load
    Promise.all([
      api.get<{ success: boolean; data: IExercise }>(`/exercises/${slug}`),
      api.get<{ success: boolean; data: IExercise[] }>('/exercises/favorites').catch(() => null)
    ])
      .then(([exRes, favsRes]) => {
        const exData = exRes.data.data;
        setExercise(exData);
        if (favsRes && favsRes.data?.success && Array.isArray(favsRes.data.data)) {
          const isSaved = favsRes.data.data.some(f => f._id === exData._id);
          setIsFavorite(isSaved);
        }
      })
      .catch(() => setExercise(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleFavorite = async () => {
    if (!exercise) return;
    try {
      await api.post('/exercises/favorites', { exerciseId: exercise._id });
      setIsFavorite(p => !p);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-inner" style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
          <div className="spinner-lg" />
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="page-wrapper">
        <div className="page-inner" style={{ textAlign:'center', paddingTop:'80px' }}>
          <p style={{ fontSize:'14px', color:'#8890a8', marginBottom:'16px' }}>Exercise not found.</p>
          <Link href="/exercises" className="btn btn-ghost btn-sm">← Back to library</Link>
        </div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom:'14px' }}>
      <p style={{ fontSize:'11px', fontWeight:700, color:'#f07028', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'14px', fontFamily:'var(--font-display)' }}>
        {title}
      </p>
      {children}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'32px 24px', width:'100%' }}>

        {/* Back link */}
        <Link href="/exercises" style={{ fontSize:'13px', color:'#8890a8', display:'inline-flex', alignItems:'center', gap:'5px', marginBottom:'20px', textDecoration:'none' }}>
          ← Back to library
        </Link>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', marginBottom:'20px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'24px', fontWeight:700, color:'#ffffff', fontFamily:'var(--font-display)', letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:'10px' }}>
              {exercise.name}
            </h1>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', fontWeight:700, background:`${difficultyColor[exercise.difficulty]}18`, color:difficultyColor[exercise.difficulty], border:`1px solid ${difficultyColor[exercise.difficulty]}30`, borderRadius:'5px', padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {exercise.difficulty}
              </span>
              <span style={{ fontSize:'11px', fontWeight:600, background:'rgba(240,112,40,0.1)', color:'#f07028', border:'1px solid rgba(240,112,40,0.2)', borderRadius:'5px', padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {exercise.workoutType}
              </span>
              <span style={{ fontSize:'11px', fontWeight:600, background:'rgba(184,196,212,0.07)', color:'#b8c4d4', border:'1px solid rgba(184,196,212,0.15)', borderRadius:'5px', padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {exercise.equipment.replace('_', ' ')}
              </span>
              <span style={{ fontSize:'11px', fontWeight:600, background:'rgba(30,214,150,0.1)', color:'#1ed696', border:'1px solid rgba(30,214,150,0.2)', borderRadius:'5px', padding:'3px 10px' }}>
                ~{exercise.caloriesBurnedEstimate} kcal
              </span>
            </div>
          </div>
          <button onClick={toggleFavorite} className="btn btn-ghost btn-sm" style={{ color: isFavorite ? '#f07028' : '#8890a8', borderColor: isFavorite ? 'rgba(240,112,40,0.35)' : '#22223a', flexShrink:0 }}>
            {isFavorite ? '♥ Saved' : '♡ Save'}
          </button>
        </div>

        {/* Recommended Sets and Reps */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
          <div className="card-sm" style={{ textAlign:'center' }}>
            <p style={{ fontSize:'10px', fontWeight:700, color:'#545870', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'6px' }}>Sets</p>
            <p style={{ fontSize:'22px', fontWeight:600, color:'#f07028', fontFamily:'var(--font-mono)' }}>{exercise.recommendedSets}</p>
          </div>
          <div className="card-sm" style={{ textAlign:'center' }}>
            <p style={{ fontSize:'10px', fontWeight:700, color:'#545870', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'6px' }}>Reps</p>
            <p style={{ fontSize:'22px', fontWeight:600, color:'#f07028', fontFamily:'var(--font-mono)' }}>{exercise.recommendedReps}</p>
          </div>
        </div>

        {/* ── 2. FORM INSTRUCTIONS ─────────────────── */}
        <Section title="Form Instructions">
          <ol style={{ paddingLeft:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {exercise.instructions.map((step, i) => (
              <li key={i} style={{ fontSize:'13px', color:'#eceef4', lineHeight:1.65 }}>
                {step}
              </li>
            ))}
          </ol>
        </Section>

        {/* ── 3. MUSCLES TARGETED ──────────────────── */}
        <Section title="Muscles Targeted">
          <div>
            <p style={{ fontSize:'11px', color:'#545870', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Primary</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
              <span style={{ fontSize:'12px', fontWeight:600, background:'rgba(240,112,40,0.12)', color:'#f07028', border:'1px solid rgba(240,112,40,0.22)', borderRadius:'5px', padding:'4px 11px' }}>
                {exercise.muscleGroup.replace('_', ' ')}
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <>
                <p style={{ fontSize:'11px', color:'#545870', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Secondary</p>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {exercise.secondaryMuscles.map(m => (
                    <span key={m} style={{ fontSize:'12px', fontWeight:600, background:'rgba(184,196,212,0.07)', color:'#b8c4d4', border:'1px solid rgba(184,196,212,0.15)', borderRadius:'5px', padding:'4px 11px' }}>
                      {m.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ── 4. COMMON MISTAKES ───────────────────── */}
        <Section title="Common Mistakes">
          <ul style={{ paddingLeft:'18px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {exercise.commonMistakes.map((m, i) => (
              <li key={i} style={{ fontSize:'13px', color:'#eceef4', lineHeight:1.65 }}>
                <span style={{ color:'#f04040', marginRight:'4px' }}>✗</span> {m}
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 5. SAFETY NOTES ──────────────────────── */}
        <Section title="Safety Instructions">
          <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:'8px' }}>
            {exercise.safetyNotes.map((n, i) => (
              <li key={i} style={{ fontSize:'13px', color:'#eceef4', lineHeight:1.65, display:'flex', gap:'8px', alignItems:'flex-start' }}>
                <span style={{ color:'#1ed696', flexShrink:0, marginTop:'2px' }}>✓</span> {n}
              </li>
            ))}
          </ul>
        </Section>

      </div>
    </div>
  );
}
