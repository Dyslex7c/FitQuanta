'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import type { ITrainer, ITrainerFilters } from '@/types/trainer';
import TrainerCard from '@/components/trainer/TrainerCard';
import TrainerFilters from '@/components/trainer/TrainerFilters';
import TrainerSearch from '@/components/trainer/TrainerSearch';

export default function TrainerMarketplacePage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const [trainers, setTrainers] = useState<(ITrainer & { cheapestPlan?: { priceINR: number } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<ITrainerFilters>({
    search: '',
    specialization: '',
    minExperience: 0,
    maxPriceINR: 999999,
    country: '',
    availability: '',
    sortBy: 'rating',
    page: 1,
  });

  const fetchTrainers = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.specialization) queryParams.set('specialization', filters.specialization);
      if (filters.minExperience > 0) queryParams.set('minExp', String(filters.minExperience));
      if (filters.maxPriceINR < 999999) queryParams.set('maxPrice', String(filters.maxPriceINR));
      if (filters.country) queryParams.set('country', filters.country);
      if (filters.availability) queryParams.set('availability', filters.availability);
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('page', String(filters.page));

      const url = `/api/trainer/search?${queryParams.toString()}`;
      const res = await axios.get(url);

      if (res.data.success) {
        setTrainers(res.data.data.trainers);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setError(res.data.message || 'Failed to search trainers.');
      }
    } catch (err: any) {
      console.error('[FETCH TRAINERS ERROR]', err);
      setError('Something went wrong. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [filters]);

  const handleSearch = (searchVal: string) => {
    setFilters(prev => ({ ...prev, search: searchVal, page: 1 }));
  };

  return (
    <div className="page-wrapper" style={{ background: '#06060a', minHeight: '100vh' }}>

      <div className="page-inner">
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-slide-up">
          <h1
            style={{
              fontFamily: 'var(--font-display), Orbitron, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'linear-gradient(to right, #ffffff 30%, #9090a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px'
            }}
          >
            Trainer Marketplace
          </h1>
          <p style={{ fontSize: '14px', color: '#9090a0', maxWidth: '500px', margin: '0 auto' }}>
            Browse and connect with certified professional coaches to receive custom workout splits, diets, and real-time chat support.
          </p>
        </div>

        {/* Search Bar Row */}
        <div style={{ marginBottom: '28px' }} className="animate-slide-up">
          <TrainerSearch value={filters.search} onSearch={handleSearch} />
        </div>

        {/* Main Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '30px', alignItems: 'flex-start' }}>
          
          {/* Left Column Filters */}
          <aside className="animate-slide-up" style={{ position: 'sticky', top: '80px' }}>
            <TrainerFilters filters={filters} onChange={setFilters} />
          </aside>

          {/* Right Column Grid */}
          <main style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="card" style={{ height: '350px', background: '#0d0d14', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : error ? (
              <div className="card card-fire" style={{ textAlign: 'center', padding: '30px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>⚠️</span>
                <p style={{ color: '#ffffff', fontSize: '13px', margin: 0 }}>{error}</p>
              </div>
            ) : trainers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 24px', borderStyle: 'dashed' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>🤷‍♂️</span>
                <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>No Trainers Found</h3>
                <p style={{ fontSize: '12.5px', color: '#545870', margin: 0 }}>
                  Try resetting the filter criteria or searching for different keywords.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {trainers.map((trainer) => (
                    <div key={trainer._id}>
                      <TrainerCard trainer={trainer} />
                    </div>
                  ))}
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '36px' }}>
                    <button
                      disabled={filters.page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="btn btn-ghost"
                      style={{ border: '1px solid #22223a', fontSize: '11px', padding: '6px 12px' }}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: '12.5px', color: '#9090a0' }}>
                      Page <strong style={{ color: '#ffffff' }}>{filters.page}</strong> of {totalPages}
                    </span>
                    <button
                      disabled={filters.page === totalPages}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="btn btn-ghost"
                      style={{ border: '1px solid #22223a', fontSize: '11px', padding: '6px 12px' }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

        </div>
      </div>
      
      {/* Flattened CSS for custom range inputs and grid media queries */}
      <style jsx global>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 260px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: relative !important;
            top: 0 !important;
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
}
