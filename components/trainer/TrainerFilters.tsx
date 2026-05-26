'use client';

import React from 'react';
import type { Specialization, ITrainerFilters } from '@/types/trainer';

interface TrainerFiltersProps {
  filters: ITrainerFilters;
  onChange: (filters: ITrainerFilters) => void;
}

export default function TrainerFilters({ filters, onChange }: TrainerFiltersProps) {
  const specializations: { value: Specialization | ''; label: string }[] = [
    { value: '', label: 'All Specializations' },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'strength', label: 'Strength' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'rehabilitation', label: 'Rehabilitation' },
    { value: 'sports', label: 'Sports' },
    { value: 'nutrition', label: 'Nutrition' },
  ];

  const handleSelectSpecialization = (value: Specialization | '') => {
    onChange({ ...filters, specialization: value, page: 1 });
  };

  const handleSelectSort = (value: any) => {
    onChange({ ...filters, sortBy: value, page: 1 });
  };

  const handleSelectAvailability = (value: any) => {
    onChange({ ...filters, availability: value, page: 1 });
  };

  const handleReset = () => {
    onChange({
      search: '',
      specialization: '',
      minExperience: 0,
      maxPriceINR: 999999,
      country: '',
      availability: '',
      sortBy: 'rating',
      page: 1,
    });
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: '#0d0d14',
        border: '1px solid #22223a',
        borderRadius: '12px',
        padding: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #22223a', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: '#ffffff' }}>
          Filters
        </h3>
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: 0,
            color: '#f07028',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          Reset All
        </button>
      </div>

      {/* Specialization */}
      <div>
        <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#545870', marginBottom: '6px' }}>
          Specialization
        </label>
        <select
          value={filters.specialization}
          onChange={(e) => handleSelectSpecialization(e.target.value as Specialization | '')}
          className="input"
          style={{ fontSize: '12px', padding: '8px 10px', height: 'auto', background: '#06060a' }}
        >
          {specializations.map((spec) => (
            <option key={spec.value} value={spec.value}>
              {spec.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sorting */}
      <div>
        <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#545870', marginBottom: '6px' }}>
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSelectSort(e.target.value)}
          className="input"
          style={{ fontSize: '12px', padding: '8px 10px', height: 'auto', background: '#06060a' }}
        >
          <option value="rating">Top Rated</option>
          <option value="experience">Most Experienced</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Availability */}
      <div>
        <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#545870', marginBottom: '6px' }}>
          Status
        </label>
        <select
          value={filters.availability}
          onChange={(e) => handleSelectAvailability(e.target.value)}
          className="input"
          style={{ fontSize: '12px', padding: '8px 10px', height: 'auto', background: '#06060a' }}
        >
          <option value="">All Statuses</option>
          <option value="available">Available Now</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Experience Range */}
      <div>
        <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#545870', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Experience</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{filters.minExperience}+ Yrs</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={filters.minExperience}
          onChange={(e) => onChange({ ...filters, minExperience: Number(e.target.value), page: 1 })}
          style={{
            width: '100%',
            accentColor: '#f07028',
            height: '4px',
            background: '#22223a',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#545870', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Max Price</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>₹{filters.maxPriceINR.toLocaleString('en-IN')}</span>
        </label>
        <input
          type="range"
          min="500"
          max="15000"
          step="500"
          value={filters.maxPriceINR}
          onChange={(e) => onChange({ ...filters, maxPriceINR: Number(e.target.value), page: 1 })}
          style={{
            width: '100%',
            accentColor: '#f07028',
            height: '4px',
            background: '#22223a',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  );
}
