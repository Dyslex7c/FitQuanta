'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface RazorpayButtonProps {
  planId: string;
  priceINR: number;
  onSuccess?: ((conversationId: string) => void) | undefined;
  onFailure?: ((errorMsg: string) => void) | undefined;
}

export default function RazorpayButton({ planId, priceINR, onSuccess, onFailure }: RazorpayButtonProps) {
  const { token, user } = useSelector((s: RootState) => s.auth);
  const [loading, setLoading] = useState(false);

  // Mock modal states
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockData, setMockData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'card' | 'processing'>('methods');
  const [mockCardNumber, setMockCardNumber] = useState('');
  const [mockCardExpiry, setMockCardExpiry] = useState('');
  const [mockCardCvc, setMockCardCvc] = useState('');
  const [mockCardName, setMockCardName] = useState('');
  const [mockErrors, setMockErrors] = useState<Record<string, string>>({});

  const loadScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!token || !user) {
      if (onFailure) onFailure('Please log in to purchase coaching plans.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order on server
      const orderRes = await axios.post(
        '/api/payments/create-order',
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create payment order.');
      }

      const orderData = orderRes.data.data;

      if (orderData.orderId.startsWith('mock_order_')) {
        // Trigger simulated interactive Razorpay modal
        setMockData(orderData);
        setPaymentStep('methods');
        setMockCardNumber('');
        setMockCardExpiry('');
        setMockCardCvc('');
        setMockCardName('');
        setMockErrors({});
        setShowMockModal(true);
        setLoading(false);
        return;
      }

      // Load Razorpay Script for real payment gateway
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you connected to the internet?');
      }

      // Configure Razorpay modal options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FitQuanta Coaching',
        description: `Purchase subscription: ${orderData.planName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await axios.post(
              '/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId: orderData.purchaseId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              if (onSuccess) {
                onSuccess(verifyRes.data.data.conversationId);
              }
            } else {
              throw new Error(verifyRes.data.message || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            console.error('[RAZORPAY HANDLER ERROR]', err);
            if (onFailure) {
              onFailure(err.response?.data?.message || err.message || 'Payment verification failed.');
            }
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#f07028',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error('[RAZORPAY INITIATION ERROR]', error);
      if (onFailure) {
        onFailure(error.response?.data?.message || error.message || 'Could not initiate checkout.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaySubmit = async (method: 'card' | 'upi') => {
    if (method === 'card') {
      const tempErrors: Record<string, string> = {};
      if (mockCardNumber.replace(/\s/g, '').length < 15) tempErrors.number = 'Invalid card number';
      if (mockCardExpiry.length < 5) tempErrors.expiry = 'Use MM/YY';
      if (mockCardCvc.length < 3) tempErrors.cvc = 'Invalid CVC';
      if (!mockCardName.trim()) tempErrors.name = 'Name required';

      if (Object.keys(tempErrors).length > 0) {
        setMockErrors(tempErrors);
        return;
      }
    }

    setPaymentStep('processing');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const verifyRes = await axios.post(
        '/api/payments/verify',
        {
          razorpay_order_id: mockData.orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          purchaseId: mockData.purchaseId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyRes.data.success) {
        setShowMockModal(false);
        if (onSuccess) {
          onSuccess(verifyRes.data.data.conversationId);
        }
      } else {
        throw new Error(verifyRes.data.message || 'Mock payment verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      setShowMockModal(false);
      if (onFailure) {
        onFailure(err.response?.data?.message || err.message || 'Payment verification failed.');
      }
    }
  };

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    const parts = clean.match(/.{1,4}/g);
    return parts ? parts.join(' ') : clean;
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    if (clean.length >= 2) {
      return `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
    }
    return clean;
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', padding: '10px 16px', fontWeight: 600, fontSize: '13px' }}
      >
        {loading ? (
          <>
            <span className="spinner" style={{ marginRight: '6px' }} />
            Processing…
          </>
        ) : (
          `Subscribe for ₹${priceINR.toLocaleString('en-IN')}`
        )}
      </button>

      {/* Mock Razorpay Secure Checkout Modal */}
      {showMockModal && mockData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              background: '#0d0d14',
              borderRadius: '12px',
              border: '1px solid #22223a',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Razorpay Banner Header */}
            <div
              style={{
                background: '#111222',
                padding: '18px 24px',
                borderBottom: '1px solid #22223a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#f07028' }}>Razorpay</span>
                  <span
                    style={{
                      fontSize: '8px',
                      background: 'rgba(240,112,40,0.12)',
                      color: '#f07028',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    MOCK
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#545870', marginTop: '2px' }}>{mockData.planName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>₹{priceINR.toLocaleString('en-IN')}</span>
                <div style={{ fontSize: '9px', color: '#1ed696', fontWeight: 600 }}>Test Mode</div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px' }}>
              {paymentStep === 'methods' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '12.5px', color: '#9090a0', margin: '0 0 4px 0' }}>Select payment option:</p>

                  <button
                    onClick={() => setPaymentStep('card')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#13131e',
                      border: '1px solid #22223a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span>💳 Card (Visa/Mastercard)</span>
                    <span style={{ color: '#545870' }}>➔</span>
                  </button>

                  <button
                    onClick={() => handleMockPaySubmit('upi')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#13131e',
                      border: '1px solid #22223a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span>⚡ UPI / QR Payment</span>
                    <span style={{ color: '#1ed696', fontSize: '10px', fontWeight: 700 }}>Auto-approve</span>
                  </button>

                  <button
                    onClick={() => setShowMockModal(false)}
                    style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff4d4d',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel Payment
                  </button>
                </div>
              )}

              {paymentStep === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#545870', marginBottom: '4px' }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={mockCardNumber}
                      onChange={(e) => {
                        setMockCardNumber(formatCardNumber(e.target.value));
                        setMockErrors((p) => ({ ...p, number: '' }));
                      }}
                      style={{
                        width: '100%',
                        background: '#13131e',
                        border: mockErrors.number ? '1px solid #ff4d4d' : '1px solid #22223a',
                        borderRadius: '6px',
                        padding: '10px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {mockErrors.number && <span style={{ fontSize: '10px', color: '#ff4d4d' }}>{mockErrors.number}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#545870', marginBottom: '4px' }}>Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={mockCardExpiry}
                        onChange={(e) => {
                          setMockCardExpiry(formatExpiry(e.target.value));
                          setMockErrors((p) => ({ ...p, expiry: '' }));
                        }}
                        style={{
                          width: '100%',
                          background: '#13131e',
                          border: mockErrors.expiry ? '1px solid #ff4d4d' : '1px solid #22223a',
                          borderRadius: '6px',
                          padding: '10px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#545870', marginBottom: '4px' }}>CVC</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={mockCardCvc}
                        onChange={(e) => {
                          setMockCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3));
                          setMockErrors((p) => ({ ...p, cvc: '' }));
                        }}
                        style={{
                          width: '100%',
                          background: '#13131e',
                          border: mockErrors.cvc ? '1px solid #ff4d4d' : '1px solid #22223a',
                          borderRadius: '6px',
                          padding: '10px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  </div>
                  {(mockErrors.expiry || mockErrors.cvc) && (
                    <span style={{ fontSize: '10px', color: '#ff4d4d' }}>
                      {mockErrors.expiry || mockErrors.cvc}
                    </span>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#545870', marginBottom: '4px' }}>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={mockCardName}
                      onChange={(e) => {
                        setMockCardName(e.target.value);
                        setMockErrors((p) => ({ ...p, name: '' }));
                      }}
                      style={{
                        width: '100%',
                        background: '#13131e',
                        border: mockErrors.name ? '1px solid #ff4d4d' : '1px solid #22223a',
                        borderRadius: '6px',
                        padding: '10px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {mockErrors.name && <span style={{ fontSize: '10px', color: '#ff4d4d' }}>{mockErrors.name}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => setPaymentStep('methods')}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: '1px solid #22223a',
                        color: '#9090a0',
                        borderRadius: '6px',
                        padding: '10px',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: 600,
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleMockPaySubmit('card')}
                      style={{
                        flex: 2,
                        background: 'linear-gradient(135deg, #f07028 0%, #ff521d 100%)',
                        border: 'none',
                        color: '#ffffff',
                        borderRadius: '6px',
                        padding: '10px',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      Pay ₹{priceINR.toLocaleString('en-IN')}
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div
                    className="mock-razorpay-spinner"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(240,112,40,0.15)',
                      borderTopColor: '#f07028',
                      borderRadius: '50%',
                      margin: '0 auto 16px auto',
                      animation: 'mock-rzp-spin 0.8s linear infinite',
                    }}
                  />
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Processing secure payment...</p>
                  <p style={{ fontSize: '11px', color: '#545870', marginTop: '6px' }}>Do not refresh or close this window</p>
                </div>
              )}
            </div>
          </div>
          <style jsx>{`
            @keyframes mock-rzp-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
