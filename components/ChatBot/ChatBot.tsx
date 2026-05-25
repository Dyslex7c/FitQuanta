'use client';

// ── components/ChatBot/ChatBot.tsx ─────────────────────────────────────────
// Main chatbot shell: floating button + sliding chat window.
// Self-contained — does NOT import or touch any existing FitQuanta code.
// ─────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage, { type Message } from './ChatMessage';
import ChatInput from './ChatInput';

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '14px' }}>
      <div
        aria-hidden
        style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f07028 0%, #e8a820 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0,
          boxShadow: '0 0 10px rgba(240,112,40,0.35)',
        }}
      >🤖</div>
      <div
        style={{
          padding: '10px 16px', borderRadius: '16px 16px 16px 4px',
          background: '#13131e', border: '1px solid #22223a',
          display: 'flex', gap: '5px', alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#f07028',
              animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quick-start suggestion chips ─────────────────────────────────────────
const SUGGESTIONS = [
  '💪 I missed my workout today — what should I do?',
  '🥗 What should I eat before a workout?',
  '🏠 Give me a quick home workout',
  '💧 How much water should I drink daily?',
  '🔥 Tips to stay consistent with fitness?',
];

// ── Welcome message ───────────────────────────────────────────────────────
const WELCOME: Message = {
  id:        'welcome',
  role:      'assistant',
  content:   "Hey! I'm **FitBot** 🤖 — your AI fitness assistant for FitQuanta.\n\nI can help you with:\n• Missed workout adjustments\n• Meal timing and nutrition basics\n• Home workout ideas\n• Hydration and sleep tips\n• Motivation and habit building\n\nWhat's on your mind today? 💪",
  timestamp: new Date(),
};

// ── Main Component ────────────────────────────────────────────────────────
export default function ChatBot() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([WELCOME]);
  const [inputValue,  setInputValue]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [unread,      setUnread]      = useState(0);
  const [mounted,     setMounted]     = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Track unread when closed
  useEffect(() => {
    if (!open && messages.length > 1) {
      setUnread((n) => n + 0); // don't increment on mount
    }
  }, [messages, open]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  // Build history for API (exclude welcome, last 20 exchanges)
  const buildHistory = useCallback((msgs: Message[]) =>
    msgs
      .filter((m) => m.id !== 'welcome')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content })),
    []
  );

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || loading) return;

    setError(null);
    setInputValue('');

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory([...messages, userMsg]);

      const res = await fetch('/api/chatbot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Something went wrong.');
      }

      const botMsg: Message = {
        id:        `a-${Date.now()}`,
        role:      'assistant',
        content:   data.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (!open) setUnread((n) => n + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, messages, open, buildHistory]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Floating toggle button ───────────────────────────────────── */}
      <button
        id="chatbot-toggle"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label={open ? 'Close FitBot' : 'Open FitBot AI assistant'}
        style={{
          position:       'fixed',
          bottom:         '24px',
          right:          '24px',
          zIndex:         9000,
          width:          '56px',
          height:         '56px',
          borderRadius:   '50%',
          border:         'none',
          background:     'linear-gradient(135deg, #f07028 0%, #c05018 100%)',
          color:          '#ffffff',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '24px',
          boxShadow:      '0 4px 20px rgba(240,112,40,0.45)',
          animation:      !open ? 'chatPulse 2.5s ease-in-out infinite' : 'none',
          transition:     'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {open ? (
          // X icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          // Chat bubble icon
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span
            aria-label={`${unread} unread messages`}
            style={{
              position:   'absolute',
              top:        '-4px',
              right:      '-4px',
              background: '#f04040',
              color:      '#fff',
              borderRadius: '50%',
              width:      '18px',
              height:     '18px',
              fontSize:   '10px',
              fontWeight: 700,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ─────────────────────────────────────────────── */}
      {open && (
        <div
          id="chatbot-window"
          role="dialog"
          aria-label="FitBot AI Assistant"
          style={{
            position:    'fixed',
            bottom:      '92px',
            right:       '24px',
            zIndex:      8999,
            width:       'min(380px, calc(100vw - 32px))',
            height:      'min(580px, calc(100vh - 110px))',
            background:  '#0d0d14',
            border:      '1px solid #22223a',
            borderRadius:'16px',
            display:     'flex',
            flexDirection:'column',
            overflow:    'hidden',
            boxShadow:   '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(240,112,40,0.08)',
            animation:   'chatSlideUp 0.25s ease-out',
          }}
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '10px',
              padding:        '14px 16px',
              background:     'linear-gradient(135deg, #13131e 0%, #1a1a28 100%)',
              borderBottom:   '1px solid #22223a',
              flexShrink:     0,
            }}
          >
            {/* Bot avatar */}
            <div
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f07028 0%, #e8a820 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
                boxShadow: '0 0 14px rgba(240,112,40,0.4)',
              }}
            >🤖</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display), Orbitron, sans-serif', letterSpacing: '0.05em' }}>
                FitBot
              </div>
              <div style={{ fontSize: '11px', color: loading ? '#f07028' : '#1ed696', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: loading ? '#f07028' : '#1ed696', display: 'inline-block' }} />
                {loading ? 'Thinking…' : 'AI Fitness Assistant'}
              </div>
            </div>

            {/* Clear chat */}
            <button
              onClick={() => { setMessages([WELCOME]); setError(null); }}
              title="Clear chat"
              aria-label="Clear chat history"
              style={{
                background: 'transparent', border: '1px solid #22223a', borderRadius: '6px',
                color: '#545870', cursor: 'pointer', padding: '5px 8px', fontSize: '11px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,112,40,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#f07028'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#22223a'; (e.currentTarget as HTMLButtonElement).style.color = '#545870'; }}
            >
              ↺ Clear
            </button>
          </div>

          {/* ── Messages ─────────────────────────────────────────── */}
          <div
            id="chatbot-messages"
            style={{
              flex:       1,
              overflowY:  'auto',
              padding:    '16px 14px 8px',
              display:    'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {/* Error banner */}
            {error && (
              <div
                style={{
                  background:  'rgba(240,64,64,0.08)',
                  border:      '1px solid rgba(240,64,64,0.25)',
                  borderRadius:'8px',
                  padding:     '10px 12px',
                  fontSize:    '12px',
                  color:       '#f04040',
                  marginBottom:'8px',
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '8px',
                }}
              >
                <span>⚠</span>
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError(null)}
                  style={{ background: 'none', border: 'none', color: '#f04040', cursor: 'pointer', padding: '0', fontSize: '14px' }}
                >×</button>
              </div>
            )}

            {/* Suggestion chips (only shown initially) */}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '11px', color: '#545870', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Quick questions
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      style={{
                        background:   'rgba(240,112,40,0.05)',
                        border:       '1px solid rgba(240,112,40,0.2)',
                        borderRadius: '8px',
                        padding:      '8px 12px',
                        color:        '#9090a0',
                        fontSize:     '12px',
                        cursor:       'pointer',
                        textAlign:    'left',
                        transition:   'all 0.15s ease',
                        fontFamily:   'var(--font-body), Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,112,40,0.5)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,112,40,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,112,40,0.2)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#9090a0';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,112,40,0.05)';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ────────────────────────────────────────────── */}
          <div ref={inputAreaRef}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={() => sendMessage()}
              disabled={loading}
            />
          </div>

          {/* ── Disclaimer footer ────────────────────────────────── */}
          <div
            style={{
              padding:    '6px 14px 10px',
              fontSize:   '10px',
              color:      '#363650',
              textAlign:  'center',
              background: '#0d0d14',
              lineHeight: 1.4,
            }}
          >
            FitBot provides general fitness guidance only — not medical advice.
          </div>
        </div>
      )}
    </>
  );
}
