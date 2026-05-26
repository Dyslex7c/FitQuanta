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
      // 1. Load Razorpay Script
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you connected to the internet?');
      }

      // 2. Create order on server
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
        // Mock checkout simulation for sandbox / free plans
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const verifyRes = await axios.post(
          '/api/payments/verify',
          {
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: 'mock_signature',
            purchaseId: orderData.purchaseId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (verifyRes.data.success) {
          if (onSuccess) {
            onSuccess(verifyRes.data.data.conversationId);
          }
        } else {
          throw new Error(verifyRes.data.message || 'Mock payment verification failed.');
        }
        return;
      }

      // 3. Configure Razorpay modal options
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
            // 4. Verify payment on server
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

  return (
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
  );
}
