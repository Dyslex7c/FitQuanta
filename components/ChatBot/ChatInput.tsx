'use client';

// ── components/ChatBot/ChatInput.tsx ───────────────────────────────────────
// Auto-growing textarea with send button. Sends on Enter (Shift+Enter = newline).
// ───────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  value:       string;
  onChange:    (val: string) => void;
  onSend:      () => void;
  disabled:    boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Ask me anything about fitness…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div
      style={{
        display:     'flex',
        alignItems:  'flex-end',
        gap:         '8px',
        padding:     '10px 12px',
        background:  '#0d0d14',
        borderTop:   '1px solid #22223a',
        borderRadius: '0 0 16px 16px',
      }}
    >
      <textarea
        ref={textareaRef}
        id="chatbot-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        style={{
          flex:        1,
          background:  '#13131e',
          border:      '1px solid #22223a',
          borderRadius:'10px',
          padding:     '9px 13px',
          color:       '#ffffff',
          fontSize:    '13px',
          lineHeight:  '1.5',
          resize:      'none',
          outline:     'none',
          fontFamily:  'var(--font-body), Inter, sans-serif',
          transition:  'border-color 0.15s ease',
          maxHeight:   '120px',
          overflowY:   'auto',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(240,112,40,0.55)'; }}
        onBlur={(e)  => { e.target.style.borderColor = '#22223a'; }}
      />

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        style={{
          width:          '38px',
          height:         '38px',
          borderRadius:   '10px',
          border:         'none',
          background:     disabled || !value.trim()
            ? 'rgba(240,112,40,0.2)'
            : 'linear-gradient(135deg, #f07028 0%, #c05018 100%)',
          color:          disabled || !value.trim() ? 'rgba(255,255,255,0.3)' : '#ffffff',
          cursor:         disabled || !value.trim() ? 'not-allowed' : 'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          transition:     'all 0.15s ease',
          boxShadow:      disabled || !value.trim() ? 'none' : '0 0 14px rgba(240,112,40,0.3)',
        }}
      >
        {/* Send arrow SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
