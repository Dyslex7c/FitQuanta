'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const animTimeout = setTimeout(() => setVisible(true), 50);
    
    const dismissTimeout = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => {
      clearTimeout(animTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg transition-all duration-300 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        type === 'success'
          ? 'bg-green-500/20 border-green-500/40 text-green-300'
          : 'bg-red-500/20 border-red-500/40 text-red-300'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span>{type === 'success' ? '✓' : '⚠️'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
