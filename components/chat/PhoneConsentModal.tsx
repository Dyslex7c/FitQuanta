'use client';

import React, { useState } from 'react';

interface PhoneConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string) => void;
}

export default function PhoneConsentModal({ isOpen, onClose, onSubmit }: PhoneConsentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setError('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    setError('');
    onSubmit(phoneNumber.trim());
    setPhoneNumber('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        background: 'rgba(6,6,10,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="card animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#0d0d14',
          borderColor: '#22223a',
          padding: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📱</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', margin: '0 0 6px 0' }}>
            Share Contact Details
          </h3>
          <p style={{ fontSize: '12px', color: '#9090a0', margin: 0, lineHeight: '1.6' }}>
            Your trainer has requested your phone number to coordinate workouts, diets, or calls.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label" htmlFor="consent-phone">Mobile Number</label>
            <input
              id="consent-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="+91 98765 43210"
              required
            />
            {error && <p className="error-msg" style={{ fontSize: '11px', marginTop: '4px' }}>{error}</p>}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1, border: '1px solid #22223a', fontSize: '12px', padding: '8px 12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
            >
              Share Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
