'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import axios from 'axios';
import Link from 'next/link';

interface Notification {
  _id: string;
  type: 'chat' | 'purchase' | 'approval' | 'review' | 'phone_request' | 'system';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  chat: '💬',
  purchase: '💳',
  approval: '✅',
  review: '⭐',
  phone_request: '📱',
  system: '🔔',
};

const typeColors: Record<string, string> = {
  chat: '#3b82f6',
  purchase: '#1ed696',
  approval: '#f07028',
  review: '#eab308',
  phone_request: '#a855f7',
  system: '#6b7280',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { token, user, hydrated } = useSelector((s: RootState) => s.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error('[NOTIFICATIONS ERROR]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [hydrated, token, user, router]);

  const handleMarkAllRead = async () => {
    try {
      await axios.patch(
        '/api/notifications',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('[MARK ALL READ ERROR]', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await axios.patch(
        '/api/notifications',
        { ids: [id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('[MARK READ ERROR]', err);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!hydrated || !token || !user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-wrapper">
      <div className="page-inner animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <p className="section-title" style={{ marginBottom: '4px' }}>
              Notifications
            </p>
            <h1 style={{ fontSize: '22px' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', color: '#f07028' }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <span className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#545870',
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🔔</span>
            <p style={{ fontSize: '13px' }}>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notifications.map((notif) => {
              const icon = typeIcons[notif.type] || '🔔';
              const accentColor = typeColors[notif.type] || '#6b7280';

              const content = (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif._id);
                    if (notif.link) router.push(notif.link);
                  }}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: notif.read ? '#0d0d14' : 'rgba(240,112,40,0.04)',
                    border: `1px solid ${notif.read ? '#13131e' : 'rgba(240,112,40,0.15)'}`,
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.read
                      ? '#13131e'
                      : 'rgba(240,112,40,0.07)';
                    e.currentTarget.style.borderColor = notif.read
                      ? '#22223a'
                      : 'rgba(240,112,40,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read
                      ? '#0d0d14'
                      : 'rgba(240,112,40,0.04)';
                    e.currentTarget.style.borderColor = notif.read
                      ? '#13131e'
                      : 'rgba(240,112,40,0.15)';
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${accentColor}10`,
                      border: `1px solid ${accentColor}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '3px',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '13px',
                          fontWeight: notif.read ? 500 : 600,
                          color: notif.read ? '#9090a0' : '#ffffff',
                        }}
                      >
                        {notif.title}
                      </strong>
                      <span
                        style={{ fontSize: '10px', color: '#545870', flexShrink: 0, marginLeft: '8px' }}
                        suppressHydrationWarning
                      >
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: notif.read ? '#545870' : '#9090a0',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f07028',
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}
                    />
                  )}
                </div>
              );

              return content;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
