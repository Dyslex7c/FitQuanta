'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCredentials, logout } from '@/redux/slices/authSlice';
import api from '@/lib/axiosInstance';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user, hydrated } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // Wait for Redux to hydrate from localStorage

    if (!token) {
      router.push('/login');
      return;
    }

    // Always run a background validation check on mount to ensure session validity and sync latest user data
    api
      .get('/profile')
      .then((res) => {
        if (res.data.success) {
          dispatch(setCredentials({ token, user: res.data.data }));
        } else {
          dispatch(logout());
          router.push('/login');
        }
      })
      .catch(() => {
        dispatch(logout());
        router.push('/login');
      });
  }, [hydrated, token, dispatch, router]);

  if (!mounted || !hydrated || !token || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f07028] shadow-[0_0_15px_rgba(240,112,40,0.4)]"></div>
      </div>
    );
  }


  return <>{children}</>;
}

