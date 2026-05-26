'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { IExercise } from '@/types/exercise';

const difficultyColor: Record<string, string> = {
  beginner:     '#1ed696',
  intermediate: '#f07028',
  advanced:     '#f04040',
};

const muscleLabel: Record<string, string> = {
  chest:'Chest', back:'Back', shoulders:'Shoulders', biceps:'Biceps',
  triceps:'Triceps', forearms:'Forearms', core:'Core',
  quadriceps:'Quads', hamstrings:'Hamstrings', glutes:'Glutes',
  calves:'Calves', full_body:'Full Body',
};

interface Props {
  exercise: IExercise;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ExerciseCard({ exercise, isFavorite = false, onToggleFavorite }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/exercises/${exercise.slug}`} style={{ textDecoration:'none', display:'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#0d0d14',
          border: `1px solid ${hovered ? '#2e2e4a' : '#22223a'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-3px)' : 'none',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>

        {/* Header containing difficulty badge and favorite button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px 8px',
          background: '#0d0d14',
          flexShrink: 0
        }}>
          {/* Difficulty badge */}
          <div style={{
            background: 'rgba(6,6,10,0.85)',
            border: `1px solid ${difficultyColor[exercise.difficulty]}40`,
            borderRadius: '5px',
            padding: '3px 9px',
            fontSize: '10px',
            fontWeight: 700,
            color: difficultyColor[exercise.difficulty],
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {exercise.difficulty}
          </div>
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={e => { e.preventDefault(); onToggleFavorite(exercise._id); }}
              style={{
                background: 'rgba(6,6,10,0.8)',
                border: '1px solid #22223a',
                borderRadius: '7px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: isFavorite ? '#f07028' : '#545870',
                transition: 'all 0.15s',
              }}>
              {isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:'8px', flex:1 }}>
          <h3 style={{ fontSize:'14px', fontWeight:600, color:'#ffffff', margin:0, lineHeight:1.3 }}>
            {exercise.name}
          </h3>
          <p style={{ fontSize:'11px', color:'#8890a8', margin:0 }}>
            {muscleLabel[exercise.muscleGroup] ?? exercise.muscleGroup}
            {exercise.secondaryMuscles.length > 0 && ` · ${exercise.secondaryMuscles.map(m => muscleLabel[m] ?? m).slice(0, 2).join(', ')}`}
          </p>
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'2px' }}>
            <span style={{ fontSize:'10px', fontWeight:600, background:'rgba(240,112,40,0.1)', color:'#f07028', border:'1px solid rgba(240,112,40,0.2)', borderRadius:'4px', padding:'2px 8px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              {exercise.workoutType}
            </span>
            <span style={{ fontSize:'10px', fontWeight:600, background:'rgba(184,196,212,0.07)', color:'#b8c4d4', border:'1px solid rgba(184,196,212,0.15)', borderRadius:'4px', padding:'2px 8px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              {exercise.equipment.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
