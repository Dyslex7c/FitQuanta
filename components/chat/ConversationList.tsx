'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { IConversation } from '@/types/chat';

interface ConversationListProps {
  currentConversationId?: string;
  token: string;
  role: 'client' | 'trainer' | 'admin';
}

export default function ConversationList({ currentConversationId, token, role }: ConversationListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setConversations(res.data.data);
        }
      } catch (err) {
        console.error('[FETCH CONVERSATIONS ERROR]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    // Poll conversations every 10 seconds to sync unread counts and last messages
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#13131e', animation: 'pulse 1.5s infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '12px', width: '60%', background: '#13131e', borderRadius: '4px', marginBottom: '6px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '8px', width: '90%', background: '#13131e', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#545870', fontSize: '12.5px' }}>
        No conversations yet. {role === 'client' && 'Find a trainer in the marketplace to get started.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {conversations.map((conv) => {
        const isActive = currentConversationId === conv._id;
        const name = role === 'client' ? (conv.trainerInfo?.name || 'Trainer') : (conv.clientName || 'Client');
        const photoUrl = role === 'client' ? conv.trainerInfo?.profilePhotoUrl : '';
        const unread = role === 'client' ? (conv.clientUnread ?? 0) : (conv.trainerUnread ?? 0);

        return (
          <div
            key={conv._id}
            onClick={() => router.push(`/chat/${conv._id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid #13131e',
              cursor: 'pointer',
              background: isActive ? '#13131e' : 'transparent',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#22223a',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f07028' }}>
                  {getInitials(name)}
                </span>
              )}
            </div>

            {/* Content info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13px', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {name}
                </strong>
                {conv.lastMessageAt && (
                  <span style={{ fontSize: '10px', color: '#545870' }} suppressHydrationWarning>
                    {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '11.5px',
                  color: unread > 0 ? '#ffffff' : '#9090a0',
                  margin: 0,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontWeight: unread > 0 ? 600 : 400
                }}
              >
                {conv.lastMessage || 'No messages yet'}
              </p>
            </div>

            {/* Notification Badging */}
            {unread > 0 && (
              <span
                style={{
                  background: '#f07028',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  flexShrink: 0
                }}
              >
                {unread}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
