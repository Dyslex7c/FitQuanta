'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface StripeButtonProps {
  planId: string;
  priceINR: number;
  onFailure?: ((errorMsg: string) => void) | undefined;
}

export default function StripeButton({ planId, priceINR, onFailure }: StripeButtonProps) {
  const { token, user } = useSelector((s: RootState) => s.auth);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!token || !user) {
      if (onFailure) onFailure('Please log in to purchase coaching plans.');
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session
      const res = await axios.post(
        '/api/payments/stripe/checkout',
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.data.url) {
        // Redirect to Stripe checkout page
        window.location.href = res.data.data.url;
      } else {
        throw new Error(res.data.message || 'Failed to initiate Stripe checkout.');
      }
    } catch (error: any) {
      console.error('[STRIPE INITIATION ERROR]', error);
      if (onFailure) {
        onFailure(error.response?.data?.message || error.message || 'Could not initiate Stripe checkout.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-outline"
      style={{
        width: '100%',
        padding: '10px 16px',
        fontWeight: 600,
        fontSize: '13px',
        borderColor: '#635bff',
        color: '#635bff',
        background: 'rgba(99,91,255,0.03)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#635bff';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(99,91,255,0.03)';
        e.currentTarget.style.color = '#635bff';
      }}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ marginRight: '6px', border: '2px solid #635bff', borderTopColor: 'transparent' }} />
          Redirecting…
        </>
      ) : (
        `Subscribe via Cards (Stripe)`
      )}
    </button>
  );
}
