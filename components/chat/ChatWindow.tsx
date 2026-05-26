'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import type { IMessage, IConversation } from '@/types/chat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import PhoneConsentModal from './PhoneConsentModal';

interface ChatWindowProps {
  conversationId: string;
  token: string;
  currentUserId: string;
  role: 'client' | 'trainer' | 'admin';
  socket: Socket;
}

export default function ChatWindow({ conversationId, token, currentUserId, role, socket }: ChatWindowProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<{ userId: string; name: string } | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [clientUserId, setClientUserId] = useState<string>('');
  const [trainerUserId, setTrainerUserId] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on message sync
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  useEffect(() => {
    // 1. Fetch past message history
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/chat/messages/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('[FETCH MESSAGES ERROR]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 2. Fetch conversation details to know partner userId
    const fetchDetails = async () => {
      try {
        const res = await axios.get('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const matching = res.data.data.find((c: IConversation) => c._id === conversationId);
          if (matching) {
            setClientUserId(matching.clientId);
            setTrainerUserId(matching.trainerId);
          }
        }
      } catch (err) {
        console.error('[FETCH DETAIL ERROR]', err);
      }
    };
    fetchDetails();

    // 3. Establish Socket.IO listeners
    socket.emit('conversation:join', conversationId);

    const handleReceiveMessage = (msg: IMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark seen in socket
      if (msg.senderId !== currentUserId) {
        socket.emit('messages:seen', { conversationId, userId: currentUserId });
      }
    };

    const handleTypingStart = (data: { conversationId: string; userId: string; name: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUser({ userId: data.userId, name: data.name });
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUser(null);
      }
    };

    socket.on('message:receive', handleReceiveMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    // Mark current messages seen
    socket.emit('messages:seen', { conversationId, userId: currentUserId });

    return () => {
      socket.off('message:receive', handleReceiveMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [conversationId, token, socket, currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit typing animation to socket
    socket.emit('typing:start', { conversationId, userId: currentUserId, name: role === 'client' ? 'Client' : 'Trainer' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, userId: currentUserId });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', { conversationId, userId: currentUserId });

    try {
      // 1. Post to database
      const res = await axios.post(
        `/api/chat/messages/${conversationId}`,
        { content, type: 'text', senderRole: role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const createdMsg = res.data.data;
        // 2. Emit to socket
        socket.emit('message:send', {
          ...createdMsg,
          conversationId,
        });
        setMessages((prev) => [...prev, createdMsg]);
      }
    } catch (err) {
      console.error('[SEND MESSAGE ERROR]', err);
    }
  };

  // Mock attachments logic
  const handleSendAttachment = async (type: 'image' | 'file') => {
    const mockUrls = {
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400',
      file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    };

    const payload = {
      content: type === 'image' ? 'Shared an image attachment' : 'Shared a document report.pdf',
      type,
      fileUrl: mockUrls[type],
      fileName: type === 'file' ? 'report.pdf' : '',
      senderRole: role
    };

    try {
      const res = await axios.post(
        `/api/chat/messages/${conversationId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const createdMsg = res.data.data;
        socket.emit('message:send', {
          ...createdMsg,
          conversationId,
        });
        setMessages((prev) => [...prev, createdMsg]);
      }
    } catch (err) {
      console.error('[ATTACHMENT ERROR]', err);
    }
  };

  // Trainer triggers phone request
  const handleRequestPhone = async () => {
    try {
      const partnerId = clientUserId;
      if (!partnerId) return;

      const res = await axios.post(
        '/api/chat/phone-request',
        { conversationId, clientUserId: partnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const createdMsg = res.data.data;
        socket.emit('message:send', {
          ...createdMsg,
          conversationId,
        });
        setMessages((prev) => [...prev, createdMsg]);

        // Send push notification alert over socket
        socket.emit('phone:request', {
          toUserId: partnerId,
          fromUserId: currentUserId,
          fromName: 'Trainer'
        });
      }
    } catch (err) {
      console.error('[PHONE REQUEST ERROR]', err);
    }
  };

  // Client responds to trainer request
  const handlePhoneConsent = async (approved: boolean, phoneNumber?: string) => {
    try {
      const partnerId = trainerUserId;
      if (!partnerId) return;

      const res = await axios.post(
        '/api/chat/phone-request',
        {
          conversationId,
          approved,
          phoneNumber: approved ? phoneNumber : '',
          trainerUserId: partnerId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const createdMsg = res.data.data;
        socket.emit('message:send', {
          ...createdMsg,
          conversationId,
        });
        setMessages((prev) => [...prev, createdMsg]);

        // Emit response to socket
        socket.emit('phone:response', {
          toUserId: partnerId,
          approved,
          phoneNumber: approved ? phoneNumber : undefined,
          conversationId
        });
      }
    } catch (err) {
      console.error('[CONSENT RESPONSE ERROR]', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#06060a' }}>
      
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: '#0d0d14',
          borderBottom: '1px solid #22223a'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {role === 'client' ? 'Coaching Session Chat' : 'Client Consultation Chat'}
          </h3>
          <span style={{ fontSize: '10px', color: '#1ed696', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1ed696' }} />
            Active Room
          </span>
        </div>

        {/* Trainer controls */}
        {role === 'trainer' && (
          <button
            onClick={handleRequestPhone}
            className="btn btn-outline"
            style={{ fontSize: '11px', padding: '5px 12px', borderColor: 'rgba(240,112,40,0.4)', color: '#f07028' }}
          >
            📞 Request Mobile No.
          </button>
        )}
      </div>

      {/* Messages body */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#06060a' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <span className="spinner" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                currentUserId={currentUserId}
                onConsentResponse={(approved) => {
                  if (approved) {
                    setIsPhoneModalOpen(true);
                  } else {
                    handlePhoneConsent(false);
                  }
                }}
              />
            ))}
            {typingUser && <TypingIndicator name={typingUser.name} />}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Footer controls bar */}
      <div style={{ padding: '16px 20px', background: '#0d0d14', borderTop: '1px solid #22223a' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
          
          {/* Attachment buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleSendAttachment('image')}
              title="Send Image"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #22223a',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f07028'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#22223a'; }}
            >
              📷
            </button>
            <button
              type="button"
              onClick={() => handleSendAttachment('file')}
              title="Send Document File"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #22223a',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f07028'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#22223a'; }}
            >
              📁
            </button>
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message to your partner..."
            className="input"
            style={{ fontSize: '13px' }}
            disabled={loading}
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0 20px', fontSize: '12px', fontWeight: 600 }}
            disabled={loading || !inputText.trim()}
          >
            Send
          </button>
        </form>
      </div>

      {/* Consent input modal */}
      <PhoneConsentModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSubmit={(num) => handlePhoneConsent(true, num)}
      />
    </div>
  );
}
