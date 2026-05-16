import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-brand-600',
    warning: 'bg-amber-500',
  };

  return (
    <div className={`fixed top-6 right-6 z-[9999] animate-slideInRight`}>
      <div className={`${bgColors[type]} text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] backdrop-blur-md bg-opacity-90 border border-white/20`}>
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </div>
    </div>
  );
}
