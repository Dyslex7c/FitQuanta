'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Cyberpunk mechanical phoenix mini-SVG logo */}
            <div className="relative w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br from-cyan to-orange p-[1.5px] shadow-[0_0_10px_rgba(0,212,255,0.25)] group-hover:shadow-[0_0_15px_rgba(255,107,53,0.4)] transition-all duration-300">
              <div className="w-full h-full bg-[#0a0a12] rounded-[5px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-widest uppercase text-cyan group-hover:text-white transition-colors duration-150">
              FitQuanta
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-text-muted px-3 py-2 rounded-md hover:text-text-primary hover:bg-raised transition-all duration-150"
                >
                  Dashboard
                </Link>
                <Link
                  href="/plans"
                  className="text-sm text-text-muted px-3 py-2 rounded-md hover:text-text-primary hover:bg-raised transition-all duration-150"
                >
                  My Plan
                </Link>
                <Link
                  href="/progress"
                  className="text-sm text-text-muted px-3 py-2 rounded-md hover:text-text-primary hover:bg-raised transition-all duration-150"
                >
                  Progress
                </Link>
                {user.onboardingComplete === false && (
                  <Link
                    href="/onboarding"
                    className="text-sm text-orange px-3 py-2 rounded-md hover:text-orange-dim hover:bg-raised transition-all duration-150"
                  >
                    Onboarding
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-sm py-1.5 px-4 ml-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-text-muted px-3 py-2 rounded-md hover:text-text-primary hover:bg-raised transition-all duration-150 mr-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm py-1.5 px-4"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
