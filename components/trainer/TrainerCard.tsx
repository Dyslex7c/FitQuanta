'use client';

import React from 'react';
import Link from 'next/link';
import type { ITrainer } from '@/types/trainer';

interface TrainerCardProps {
  trainer: ITrainer & { cheapestPlan?: { priceINR: number } | null };
}

export default function TrainerCard({ trainer }: TrainerCardProps) {
  const getSpecializationLabel = (spec: string) => {
    return spec.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400';

  return (
    <div
      className="card-interactive animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner Photo */}
      <div style={{ position: 'relative', height: '140px', margin: '-20px -22px 16px -22px', overflow: 'hidden' }}>
        <img
          src={trainer.profilePhotoUrl || defaultAvatar}
          alt={trainer.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, #0d0d14, transparent)' }} />

        {/* Status indicator */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: trainer.availabilityStatus === 'available' ? 'rgba(30,214,150,0.9)' : 'rgba(240,112,40,0.9)',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {trainer.availabilityStatus}
        </span>
      </div>

      {/* Ratings & Basic Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
          {trainer.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid #22223a', padding: '2px 6px', borderRadius: '6px' }}>
          <span style={{ color: '#f07028', fontSize: '12px' }}>★</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>
            {trainer.averageRating > 0 ? trainer.averageRating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>

      {/* Country & Bio excerpt */}
      <p style={{ fontSize: '11px', color: '#545870', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>📍</span> {trainer.location ? `${trainer.location}, ` : ''}{trainer.country}
      </p>

      <p style={{ fontSize: '12px', color: '#9090a0', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '1.6' }}>
        {trainer.bio || 'Professional fitness trainer certified and ready to help you hit your lifestyle goals.'}
      </p>

      {/* Specializations badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
        {trainer.specializations.slice(0, 3).map((spec) => (
          <span
            key={spec}
            style={{
              background: 'rgba(240,112,40,0.08)',
              border: '1px solid rgba(240,112,40,0.15)',
              color: '#f07028',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 500
            }}
          >
            {getSpecializationLabel(spec)}
          </span>
        ))}
        {trainer.specializations.length > 3 && (
          <span style={{ background: '#13131e', border: '1px solid #22223a', color: '#9090a0', padding: '2px 6px', borderRadius: '6px', fontSize: '10px' }}>
            +{trainer.specializations.length - 3} more
          </span>
        )}
      </div>

      {/* Footer stats & Action */}
      <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #22223a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', color: '#545870', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Starting at
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1ed696', margin: 0 }}>
            {trainer.cheapestPlan ? `₹${trainer.cheapestPlan.priceINR.toLocaleString('en-IN')}` : 'Contact'}
          </p>
        </div>

        <Link href={`/trainer/${trainer._id}`} className="btn btn-primary btn-sm" style={{ fontSize: '11px', padding: '6px 12px' }}>
          View Details
        </Link>
      </div>
    </div>
  );
}
