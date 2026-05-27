'use client';

import React, { useState } from 'react';
import type { IMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: IMessage;
  currentUserId: string;
  onConsentResponse?: (approved: boolean) => void;
}

export default function MessageBubble({ message, currentUserId, onConsentResponse }: MessageBubbleProps) {
  const isSelf = message.senderId === currentUserId;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Render system alert logs
  if (message.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <span
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #22223a',
            borderRadius: '12px',
            padding: '4px 12px',
            fontSize: '11px',
            color: '#9090a0',
            textAlign: 'center'
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  // Render Trainer's Phone number sharing request bubble (only seen on client's side)
  if (message.type === 'phone_request') {
    return (
      <div style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
        <div
          className="card animate-slide-up"
          style={{
            maxWidth: '320px',
            background: isSelf ? '#13131e' : '#0d0d14',
            borderColor: isSelf ? '#22223a' : 'rgba(240,112,40,0.3)',
            padding: '14px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>📱</span>
            <strong style={{ fontSize: '12.5px', color: '#ffffff' }}>Contact Sharing Request</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#9090a0', margin: '0 0 12px 0', lineHeight: '1.5' }}>
            {message.content}
          </p>

          {!isSelf && onConsentResponse && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onConsentResponse(true)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '4px 10px', fontSize: '11px', height: 'auto', borderRadius: '6px' }}
              >
                Share Number
              </button>
              <button
                type="button"
                onClick={() => onConsentResponse(false)}
                className="btn btn-ghost"
                style={{ flex: 1, padding: '4px 10px', fontSize: '11px', height: 'auto', borderRadius: '6px', border: '1px solid #22223a' }}
              >
                Decline
              </button>
            </div>
          )}

          {isSelf && (
            <span style={{ fontSize: '11px', color: '#545870', fontStyle: 'italic' }}>
              Waiting for client consent...
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render Phone consent response bubble
  if (message.type === 'phone_response') {
    const isApproved = message.content.includes('shared');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
        <span
          style={{
            background: isApproved ? 'rgba(30,214,150,0.06)' : 'rgba(240,112,40,0.06)',
            border: `1px solid ${isApproved ? 'rgba(30,214,150,0.2)' : 'rgba(240,112,40,0.2)'}`,
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '11.5px',
            color: isApproved ? '#1ed696' : '#f07028',
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isSelf ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSelf ? 'flex-end' : 'flex-start',
          maxWidth: '65%'
        }}
      >
        <div
          style={{
            background: isSelf ? '#f07028' : '#0d0d14',
            border: `1px solid ${isSelf ? '#f07028' : '#22223a'}`,
            color: '#ffffff',
            borderRadius: isSelf ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
            padding: '10px 14px',
            fontSize: '13px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          {/* File attachments */}
          {message.type === 'image' && message.fileUrl && (
            <>
              <div
                onClick={() => setIsLightboxOpen(true)}
                style={{
                  marginBottom: '6px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <img
                  src={message.fileUrl}
                  alt="attachment"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }}
                />
              </div>

              {/* Lightbox modal */}
              {isLightboxOpen && (
                <div
                  onClick={() => setIsLightboxOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    background: 'rgba(6,6,10,0.92)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'zoom-out',
                  }}
                >
                  <style>{`
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                    @keyframes scaleUp {
                      from { transform: scale(0.92); opacity: 0; }
                      to { transform: scale(1); opacity: 1; }
                    }
                  `}</style>
                  {/* Close button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '24px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #22223a',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      color: '#ffffff',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f07028'; e.currentTarget.style.color = '#f07028'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#22223a'; e.currentTarget.style.color = '#ffffff'; }}
                  >
                    ✕
                  </button>

                  <img
                    src={message.fileUrl}
                    alt="Expanded attachment"
                    style={{
                      maxWidth: '90%',
                      maxHeight: '90%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                      animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
              )}
            </>
          )}

          {message.type === 'file' && message.fileUrl && (
            <div
              style={{
                marginBottom: '6px',
                background: 'rgba(255,255,255,0.06)',
                padding: '8px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>📄</span>
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '11px',
                  color: '#ffffff',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  wordBreak: 'break-all'
                }}
              >
                {message.fileName || 'View Attachment'}
              </a>
            </div>
          )}

          {/* Message Text */}
          {message.content && <span>{message.content}</span>}
        </div>

        {/* Bubble status & timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: '#545870' }}>
          <span suppressHydrationWarning>{formatTime(message.createdAt)}</span>
          {isSelf && (
            <span style={{ color: message.seen ? '#1ed696' : '#545870' }}>
              {message.seen ? '✓✓ Seen' : '✓ Sent'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
