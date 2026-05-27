'use client';

import React from 'react';
import type { ITrainerPlan } from '@/types/trainer';
import RazorpayButton from '../payment/RazorpayButton';
import StripeButton from '../payment/StripeButton';

interface TrainerPlanCardProps {
  plan: ITrainerPlan;
  onSuccess?: (conversationId: string) => void;
  onFailure?: (errorMsg: string) => void;
}

export default function TrainerPlanCard({ plan, onSuccess, onFailure }: TrainerPlanCardProps) {
  return (
    <div
      className="card animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d0d14',
        border: '1px solid #22223a',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative'
      }}
    >
      {/* Popular indicator for active structures */}
      {plan.includesDiet && plan.includesWorkout && plan.includesChat && (
        <span
          style={{
            position: 'absolute',
            top: '-12px',
            left: '24px',
            background: 'linear-gradient(135deg, #f07028 0%, #ff521d 100%)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            boxShadow: '0 4px 12px rgba(240,112,40,0.2)'
          }}
        >
          All-Inclusive
        </span>
      )}

      {/* Plan Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px 0', color: '#ffffff' }}>
          {plan.name}
        </h3>
        <p style={{ fontSize: '12px', color: '#545870', margin: 0 }}>
          Plan duration: <strong style={{ color: '#ffffff' }}>{plan.durationWeeks} {plan.durationWeeks === 1 ? 'Week' : 'Weeks'}</strong>
        </p>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: '#1ed696' }}>
          ₹{plan.priceINR.toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: '11px', color: '#545870' }}>/ one-time</span>
      </div>

      {/* Features Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: plan.includesWorkout ? '#ffffff' : '#545870' }}>
          <span style={{ color: plan.includesWorkout ? '#1ed696' : '#545870' }}>{plan.includesWorkout ? '✓' : '✗'}</span>
          <span>Workout Plan Included</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: plan.includesDiet ? '#ffffff' : '#545870' }}>
          <span style={{ color: plan.includesDiet ? '#1ed696' : '#545870' }}>{plan.includesDiet ? '✓' : '✗'}</span>
          <span>Diet & Nutrition Plan</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: plan.includesChat ? '#ffffff' : '#545870' }}>
          <span style={{ color: plan.includesChat ? '#1ed696' : '#545870' }}>{plan.includesChat ? '✓' : '✗'}</span>
          <span>Real-time Chat Support</span>
        </div>

        {plan.features.map((feat, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
            <span style={{ color: '#1ed696' }}>✓</span>
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* Pay action */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <StripeButton
          planId={plan._id}
          priceINR={plan.priceINR}
          onFailure={onFailure}
        />
        <div style={{ textAlign: 'center', fontSize: '9px', color: '#545870', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0' }}>
          — OR —
        </div>
        <RazorpayButton
          planId={plan._id}
          priceINR={plan.priceINR}
          onSuccess={onSuccess}
          onFailure={onFailure}
        />
      </div>
    </div>
  );
}
