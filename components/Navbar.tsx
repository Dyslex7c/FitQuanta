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
    <nav className="bg-[#12121a] border-b border-[#1e1e2e] sticky top-0 z-50 px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          {/* Cyberpunk mechanical phoenix mini-SVG logo */}
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#ff6b35] p-[1.5px] shadow-[0_0_15px_rgba(0,212,255,0.3)] group-hover:shadow-[0_0_20px_rgba(255,107,53,0.5)] transition-all duration-300">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00d4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <span className="font-display text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35] drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]">
            FitQuanta
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          {isAuthenticated && user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-[#e2e8f0] hover:text-[#00d4ff] transition-colors duration-200">
                Dashboard
              </Link>
              <Link href="/plans" className="text-sm font-semibold text-[#e2e8f0] hover:text-[#00d4ff] transition-colors duration-200">
                My Plan
              </Link>
              <Link href="/progress" className="text-sm font-semibold text-[#e2e8f0] hover:text-[#00d4ff] transition-colors duration-200">
                Progress
              </Link>
              {user.onboardingComplete === false && (
                <Link href="/onboarding" className="text-sm font-semibold text-[#ff6b35] hover:text-[#ff6b35]/80 transition-colors duration-200">
                  Onboarding
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold border border-[#ff6b35] text-[#ff6b35] rounded-xl hover:bg-[#ff6b35]/10 shadow-[0_0_10px_rgba(255,107,53,0.1)] hover:shadow-[0_0_15px_rgba(255,107,53,0.3)] transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-[#e2e8f0] hover:text-[#00d4ff] transition-colors duration-200">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold bg-[#00d4ff] text-[#0a0a0f] rounded-xl hover:bg-[#0099bb] shadow-[0_0_10px_rgba(0,212,255,0.2)] hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
