'use client';

// ── components/ChatBot/ChatMessage.tsx ──────────────────────────────────────
// Renders a single chat bubble. Completely self-contained.
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';

export interface Message {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

/** Convert **bold** and bullet lists to simple inline HTML */
function formatContent(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const parts = trimmed.split(/\*\*(.*?)\*\*/g).map((part, j) =>
      j % 2 === 1 ? <strong key={j} style={{ color: '#ffffff', fontWeight: 700 }}>{part}</strong> : part
    );
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
    return (
      <span
        key={i}
        style={{
          display: 'block',
          marginLeft: isBullet ? '4px' : '0',
          marginBottom: i < lines.length - 1 ? '3px' : '0',
        }}
      >
        {parts}
      </span>
    );
  });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems:    'flex-end',
        gap:           '8px',
        marginBottom:  '14px',
        animation:     'chatMsgIn 0.22s ease-out',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          aria-hidden
          style={{
            width:           '30px',
            height:          '30px',
            borderRadius:    '50%',
            background:      'linear-gradient(135deg, #f07028 0%, #e8a820 100%)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '14px',
            flexShrink:      0,
            boxShadow:       '0 0 10px rgba(240,112,40,0.35)',
          }}
        >
          🤖
        </div>
      )}

      {/* Bubble */}
      <div
        style={{
          maxWidth:     '78%',
          padding:      '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background:   isUser
            ? 'linear-gradient(135deg, #f07028 0%, #c05018 100%)'
            : '#13131e',
          border:       isUser ? 'none' : '1px solid #22223a',
          color:        '#ffffff',
          fontSize:     '13px',
          lineHeight:   '1.6',
          boxShadow:    isUser
            ? '0 2px 12px rgba(240,112,40,0.25)'
            : '0 1px 4px rgba(0,0,0,0.4)',
          wordBreak: 'break-word',
        }}
      >
        {formatContent(message.content)}
        <div
          style={{
            fontSize:  '10px',
            color:     isUser ? 'rgba(255,255,255,0.55)' : '#545870',
            marginTop: '5px',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
