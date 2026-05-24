'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCredentials, logout } from '@/redux/slices/authSlice';
import axios from 'axios';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    if (!user) {
      axios
        .get('/api/profile')
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
    }
  }, [token, user, dispatch, router]);

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.4)]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
