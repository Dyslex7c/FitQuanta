'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateFromStorage } from './slices/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
