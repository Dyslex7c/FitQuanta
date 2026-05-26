'use client';
import { useState, useEffect, useCallback } from 'react';
import ExerciseSearch from '@/components/exercises/ExerciseSearch';
import ExerciseFilters from '@/components/exercises/ExerciseFilters';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseCardSkeleton from '@/components/exercises/ExerciseCardSkeleton';
import api from '@/lib/axiosInstance';
import type { IExercise, IExerciseFilters, IExerciseListResponse } from '@/types/exercise';

const DEFAULT_FILTERS: IExerciseFilters = {
  search: '', muscleGroup: '', workoutType: '',
  difficulty: '', equipment: '', page: 1,
};

export default function ExercisesPage() {
  const [filters, setFilters] = useState<IExerciseFilters>(DEFAULT_FILTERS);
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [meta, setMeta] = useState<Omit<IExerciseListResponse, 'exercises'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch exercises list based on current filters
  const fetchExercises = useCallback(async (f: IExerciseFilters, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search)      params.set('search',      f.search);
      if (f.muscleGroup) params.set('muscleGroup',  f.muscleGroup);
      if (f.workoutType) params.set('workoutType',  f.workoutType);
      if (f.difficulty)  params.set('difficulty',   f.difficulty);
      if (f.equipment)   params.set('equipment',    f.equipment);
      params.set('page', String(f.page));
      params.set('limit', '12');

      const res = await api.get<{ success: boolean; data: IExerciseListResponse }>(
        `/exercises?${params.toString()}`
      );
      const { exercises: list, ...rest } = res.data.data;
      setExercises(prev => append ? [...prev, ...list] : list);
      setMeta(rest);
    } catch {
      // handle silently — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch favorites on mount to pre-populate the heart icons
  useEffect(() => {
    api.get<{ success: boolean; data: IExercise[] }>('/exercises/favorites')
      .then(res => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setFavorites(new Set(res.data.data.map(ex => ex._id)));
        }
      })
      .catch(() => { /* ignore, e.g. not logged in */ });
  }, []);

  useEffect(() => {
    setExercises([]);
    fetchExercises({ ...filters, page: 1 }, false);
  }, [filters.search, filters.muscleGroup, filters.workoutType, filters.difficulty, filters.equipment]);

  const handleFilterChange = (partial: Partial<IExerciseFilters>) => {
    setFilters(prev => ({ ...prev, ...partial, page: 1 }));
  };

  const handleLoadMore = () => {
    const nextPage = filters.page + 1;
    setFilters(prev => ({ ...prev, page: nextPage }));
    fetchExercises({ ...filters, page: nextPage }, true);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await api.post('/exercises/favorites', { exerciseId: id });
      setFavorites(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="page-wrapper">
      <div className="page-inner">

        {/* Header */}
        <div style={{ marginBottom:'32px' }}>
          <p style={{ fontSize:'11px', fontWeight:700, color:'#f07028', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px', fontFamily:'var(--font-display)' }}>
            Exercise Library
          </p>
          <h1 style={{ fontSize:'28px', fontWeight:900, color:'#ffffff', fontFamily:'var(--font-display)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'8px' }}>
            Find Your Exercise
          </h1>
          <p style={{ fontSize:'14px', color:'#8890a8' }}>
            {meta?.total ?? '—'} exercises — search by name, muscle group, or workout type.
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom:'16px' }}>
          <ExerciseSearch
            value={filters.search}
            onChange={val => handleFilterChange({ search: val })}
          />
        </div>

        {/* Filters */}
        <div style={{ marginBottom:'28px' }}>
          <ExerciseFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </div>

        {/* Grid */}
        {loading && exercises.length === 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
            {Array.from({ length: 12 }).map((_, i) => <ExerciseCardSkeleton key={i} />)}
          </div>
        ) : exercises.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <p style={{ fontSize:'32px', marginBottom:'12px' }}>🏋️</p>
            <p style={{ fontSize:'15px', fontWeight:600, color:'#ffffff', marginBottom:'6px' }}>No exercises found</p>
            <p style={{ fontSize:'13px', color:'#8890a8', marginBottom:'20px' }}>Try adjusting your search or filters</p>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="btn btn-ghost btn-sm">Clear all filters</button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
              {exercises.map(ex => (
                <ExerciseCard
                  key={ex._id}
                  exercise={ex}
                  isFavorite={favorites.has(ex._id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* Load more */}
            {meta?.hasMore && (
              <div style={{ textAlign:'center', marginTop:'36px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="btn btn-outline">
                  {loading ? <><span className="spinner" /> Loading...</> : 'Load more exercises'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
