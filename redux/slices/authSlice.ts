import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IUserProfile } from '@/types/user';

interface AuthState {
  token: string | null;
  user: IUserProfile | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('fq_token') : null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: IUserProfile }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fq_token', action.payload.token);
        document.cookie = `fq_token=${action.payload.token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fq_token');
        document.cookie = 'fq_token=; path=/; max-age=0; SameSite=Lax; Secure';
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
