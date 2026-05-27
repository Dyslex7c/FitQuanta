'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function StripeCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id') || '';
  const purchaseId = searchParams.get('purchase_id') || '';
  const planName = searchParams.get('plan_name') || 'FitQuanta Coaching Plan';
  const amountStr = searchParams.get('amount') || '0';
  const trainerName = searchParams.get('trainer_name') || 'Certified Coach';

  const amount = Number(amountStr);

  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Auto-format card number as 4-4-4-4
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = val.match(/.{1,4}/g);
    setCardNumber(matches ? matches.join(' ') : val);
    setErrors((prev) => ({ ...prev, cardNumber: '' }));
  };

  // Auto-format expiry as MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setExpiry(val);
    }
    setErrors((prev) => ({ ...prev, expiry: '' }));
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvc(val);
    setErrors((prev) => ({ ...prev, cvc: '' }));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const tempErrors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15 || rawCard.length > 16) {
      tempErrors.cardNumber = 'Please enter a valid card number';
    }
    if (expiry.length < 5) {
      tempErrors.expiry = 'Use MM/YY format';
    } else {
      const parts = expiry.split('/');
      const mStr = parts[0] || '';
      const m = parseInt(mStr);
      if (isNaN(m) || m < 1 || m > 12) {
        tempErrors.expiry = 'Invalid month';
      }
    }
    if (cvc.length < 3) {
      tempErrors.cvc = 'Invalid CVC';
    }
    if (!cardName.trim()) {
      tempErrors.cardName = 'Name on card is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate authorization and processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPaymentSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Redirect back to verification page
      router.push(`/api/payments/stripe/verify?session_id=${sessionId}&purchase_id=${purchaseId}`);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0e12',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#151720',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Left Side: Summary Panel */}
        <div
          style={{
            padding: '40px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #151720 0%, #0d0f15 100%)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f07028', letterSpacing: '0.05em' }}>FitQuanta</span>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(240,112,40,0.15)',
                  color: '#f07028',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  border: '1px solid rgba(240,112,40,0.25)'
                }}
              >
                Sandbox
              </span>
            </div>

            <span style={{ fontSize: '12px', color: '#8892b0', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Coaching Plan Subscription
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
              {planName}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#8892b0', margin: 0 }}>
              Coach: <strong style={{ color: '#ffffff' }}>{trainerName}</strong>
            </p>
          </div>

          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: '#8892b0', fontSize: '14px' }}>Subtotal</span>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>₹{amount.toLocaleString('en-IN')}.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: '#8892b0', fontSize: '14px' }}>Tax (GST)</span>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>Total Due</span>
              <span style={{ color: '#1ed696', fontSize: '28px', fontWeight: 800 }}>₹{amount.toLocaleString('en-IN')}.00</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form Panel */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 24px 0', color: '#ffffff' }}>
            Pay with card
          </h3>

          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="stripe-email" style={{ display: 'block', fontSize: '12px', color: '#8892b0', marginBottom: '6px', fontWeight: 500 }}>Email Address</label>
              <input
                id="stripe-email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  background: '#1d202d',
                  border: errors.email ? '1px solid #ff4d4d' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.email && <p style={{ fontSize: '11px', color: '#ff4d4d', margin: '4px 0 0 0' }}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="stripe-card" style={{ display: 'block', fontSize: '12px', color: '#8892b0', marginBottom: '6px', fontWeight: 500 }}>Card Information</label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#1d202d',
                  border: errors.cardNumber || errors.expiry || errors.cvc ? '1px solid #ff4d4d' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}
              >
                <input
                  id="stripe-card"
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="Card number (4242 4242 4242 4242)"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM / YY"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                  <input
                    type="password"
                    required
                    value={cvc}
                    onChange={handleCvcChange}
                    placeholder="CVC"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
              {(errors.cardNumber || errors.expiry || errors.cvc) && (
                <p style={{ fontSize: '11px', color: '#ff4d4d', margin: '4px 0 0 0' }}>
                  {errors.cardNumber || errors.expiry || errors.cvc}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stripe-name" style={{ display: 'block', fontSize: '12px', color: '#8892b0', marginBottom: '6px', fontWeight: 500 }}>Name on Card</label>
              <input
                id="stripe-name"
                type="text"
                required
                value={cardName}
                onChange={(e) => { setCardName(e.target.value); setErrors((prev) => ({ ...prev, cardName: '' })); }}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  background: '#1d202d',
                  border: errors.cardName ? '1px solid #ff4d4d' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.cardName && <p style={{ fontSize: '11px', color: '#ff4d4d', margin: '4px 0 0 0' }}>{errors.cardName}</p>}
            </div>

            <button
              type="submit"
              disabled={isProcessing || paymentSuccess}
              style={{
                width: '100%',
                background: paymentSuccess ? '#1ed696' : 'linear-gradient(135deg, #635bff 0%, #5850e0 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 16px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14.5px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,91,255,0.25)'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && !paymentSuccess) {
                  e.currentTarget.style.background = '#7a73ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing && !paymentSuccess) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #635bff 0%, #5850e0 100%)';
                }
              }}
            >
              {isProcessing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    className="stripe-loading-spinner"
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      animation: 'stripe-spin 0.6s linear infinite'
                    }}
                  />
                  Processing payment...
                </div>
              ) : paymentSuccess ? (
                '✓ Payment Success'
              ) : (
                `Pay ₹${amount.toLocaleString('en-IN')}.00`
              )}
            </button>
          </form>
        </div>
      </div>
      <style jsx global>{`
        @keyframes stripe-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="borderRight: 1px solid"] {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function StripeCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0e12', color: '#ffffff' }}>
          <div>Loading Checkout...</div>
        </div>
      }
    >
      <StripeCheckoutContent />
    </Suspense>
  );
}
