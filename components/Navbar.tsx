'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';
import axios from 'axios';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, user, hydrated, token } = useSelector((state: RootState) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Poll for unread notification count
  useEffect(() => {
    if (!hydrated || !isAuthenticated || !token) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const count = res.data.data.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [hydrated, isAuthenticated, token]);

  const showAuthLinks = hydrated && isAuthenticated && user;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  let links: { label: string; href: string; isWarning?: boolean }[] = [];
  if (showAuthLinks) {
    if (user.role === 'admin') {
      links = [
        { label: 'Admin Panel', href: '/admin' },
        { label: 'Approvals', href: '/admin/trainers' },
      ];
    } else if (user.role === 'trainer') {
      links = [
        { label: 'Trainer Dashboard', href: '/trainer/dashboard' },
        { label: 'My Plans', href: '/trainer/plans' },
        { label: 'Messages', href: '/chat' },
      ];
    } else {
      links = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Plan', href: '/plans' },
        { label: 'Progress', href: '/progress' },
        { label: 'Trainers', href: '/trainer' },
        { label: 'Messages', href: '/chat' },
        { label: 'Purchases', href: '/purchases' },
        { label: 'Badges', href: '/badges' },
        ...(user.onboardingComplete === false ? [{ label: 'Onboarding', href: '/onboarding', isWarning: true }] : [])
      ];
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(6,6,10,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #22223a',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '0 24px',
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="FitQuanta" style={{ height: '30px', width: '30px', objectFit: 'contain' }} />
          <span
            style={{
              fontFamily: 'var(--font-display), Orbitron, sans-serif',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            FitQuanta
          </span>
        </Link>

        {/* Desktop Nav links (hidden on mobile) */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2px' }}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={
                  isActive
                    ? {
                        color: '#f07028',
                        background: 'rgba(240,112,40,0.08)',
                        borderRadius: '7px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }
                    : {
                        color: link.isWarning ? '#f07028' : '#9090a0',
                        padding: '6px 12px',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.15s',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.color = '#ffffff';
                    el.style.background = '#13131e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.color = link.isWarning ? '#f07028' : '#9090a0';
                    el.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTAs (hidden on mobile) */}
        <div className="hidden md:flex" style={{ gap: '8px', alignItems: 'center' }}>
          {showAuthLinks ? (
            <>
              <Link
                href="/notifications"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: unreadCount > 0 ? 'rgba(240,112,40,0.08)' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
                  color: unreadCount > 0 ? '#f07028' : '#9090a0',
                  fontSize: '16px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#13131e';
                  e.currentTarget.style.borderColor = '#22223a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = unreadCount > 0 ? 'rgba(240,112,40,0.08)' : 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#f07028',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger Menu Toggle Button (visible on mobile only) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden"
          aria-label="Toggle navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          {isOpen ? (
            // Close icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Menu icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer (visible when open) */}
      {isOpen && (
        <div
          className="flex md:hidden animate-slide-up"
          style={{
            flexDirection: 'column',
            width: '100%',
            background: '#0d0d14',
            borderTop: '1px solid #22223a',
            borderBottom: '1px solid #22223a',
            padding: '16px 24px',
            gap: '12px',
          }}
        >
          {/* Navigation Links */}
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#f07028' : link.isWarning ? '#f07028' : '#9090a0',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: isActive ? 'rgba(240,112,40,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '8px',
              borderTop: '1px solid #22223a',
              paddingTop: '12px',
            }}
          >
            {showAuthLinks ? (
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
