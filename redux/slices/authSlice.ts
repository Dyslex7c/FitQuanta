import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IUserProfile } from '@/types/user';

interface AuthState {
  token: string | null;
  user: IUserProfile | null;
  isAuthenticated: boolean;
  hydrated: boolean;
}

// Always start with empty state to avoid SSR/client mismatch
const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('fq_token');
      const userStr = localStorage.getItem('fq_user');
      let user: IUserProfile | null = null;
      if (userStr) {
        try { user = JSON.parse(userStr) as IUserProfile; } catch { /* ignore */ }
      }
      state.token = token;
      state.user = user;
      state.isAuthenticated = !!token;
      state.hydrated = true;
    },
    setCredentials(state, action: PayloadAction<{ token: string; user: IUserProfile }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fq_token', action.payload.token);
        localStorage.setItem('fq_user', JSON.stringify(action.payload.user));
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `fq_token=${action.payload.token}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fq_token');
        localStorage.removeItem('fq_user');
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `fq_token=; path=/; max-age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      }
    },
  },
});

export const { hydrateFromStorage, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
