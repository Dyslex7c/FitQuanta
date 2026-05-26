'use client';

import React from 'react';
import type { IMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: IMessage;
  currentUserId: string;
  onConsentResponse?: (approved: boolean) => void;
}

export default function MessageBubble({ message, currentUserId, onConsentResponse }: MessageBubbleProps) {
  const isSelf = message.senderId === currentUserId;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <div style={{ marginBottom: '6px', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={message.fileUrl}
                alt="attachment"
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }}
              />
            </div>
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
          <span>{formatTime(message.createdAt)}</span>
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
