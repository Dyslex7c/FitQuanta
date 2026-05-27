'use client';

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import ConversationList from '@/components/chat/ConversationList';

export default function ChatDashboardPage() {
  const router = useRouter();
  const { token, user, hydrated } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace('/login');
    }
  }, [token, user, router, hydrated]);

  if (!hydrated || !token || !user) return null;

  return (
    <div className="page-wrapper" style={{ background: '#06060a', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden' }}>
        
        {/* Left Inbox Sidebar Column */}
        <aside
          style={{
            background: '#0d0d14',
            borderRight: '1px solid #22223a',
            height: '100%',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #22223a', background: 'rgba(255,255,255,0.01)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: '#ffffff' }}>
              Messages Inbox
            </h2>
          </div>
          <ConversationList
            token={token}
            role={user.role as any}
          />
        </aside>

        {/* Right Active Messaging Column Placeholder */}
        <main style={{ height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '320px', padding: '24px' }} className="animate-slide-up">
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px' }}>💬</span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: '8px' }}>
              Coaching Messenger
            </h3>
            <p style={{ fontSize: '12.5px', color: '#9090a0', lineHeight: '1.6', margin: 0 }}>
              {user.role === 'client'
                ? 'Select a conversation from the sidebar to chat, or visit the Trainer Marketplace to subscribe and connect with a trainer.'
                : 'Select an active client conversation from the sidebar to begin consulting and sharing workouts and diet structures.'}
            </p>
          </div>
        </main>

      </div>
    </div>
  );
}
