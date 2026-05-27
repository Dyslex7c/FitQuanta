'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface ChatRoomClientProps {
  conversationId: string;
}

export default function ChatRoomClient({ conversationId }: ChatRoomClientProps) {
  const router = useRouter();
  const { token, user, hydrated } = useSelector((s: RootState) => s.auth);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!hydrated) return;

    // 1. Force auth check
    if (!token || !user) {
      router.replace('/login');
      return;
    }

    // 2. Open socket connection
    const s = connectSocket(user._id, user.role);
    setSocket(s);

    return () => {
      disconnectSocket();
    };
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || !user) {
    return (
      <div className="page-wrapper" style={{ background: '#06060a', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ background: '#06060a', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Side-by-side Inbox Grid */}
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
            currentConversationId={conversationId}
            token={token}
            role={user.role as any}
          />
        </aside>

        {/* Right Active Messaging Column */}
        <main style={{ height: '100%', overflow: 'hidden' }}>
          {socket && conversationId ? (
            <ChatWindow
              conversationId={conversationId}
              token={token}
              currentUserId={user._id}
              role={user.role as any}
              socket={socket}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#545870' }}>
              <span style={{ fontSize: '32px', marginBottom: '16px' }}>💬</span>
              Select a conversation to start messaging.
            </div>
          )}
        </main>

      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 300px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          aside {
            display: ${conversationId ? 'none' : 'block'} !important;
          }
          main {
            display: ${conversationId ? 'block' : 'none'} !important;
          }
        }
      `}</style>
    </div>
  );
}
