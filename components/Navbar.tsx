'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);


  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showAuthLinks = mounted && isAuthenticated && user;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const links = showAuthLinks ? [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Exercise Library', href: '/exercises' },
    { label: 'My Plan', href: '/plans' },
    { label: 'Progress', href: '/progress' },
    ...(user.onboardingComplete === false ? [{ label: 'Onboarding', href: '/onboarding', isWarning: true }] : [])
  ] : [];



  return (
    <nav
      className="sticky top-0 z-50"
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
        }}
      >
        {/* Logo — the ONE place Orbitron is used prominently */}
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

        {/* Nav links — Inter, understated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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


        {/* Auth CTA / Logout */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showAuthLinks ? (
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Log out
            </button>
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

      </div>
    </nav>
  );
}
