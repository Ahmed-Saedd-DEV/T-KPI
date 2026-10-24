import React from 'react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-3 bg-[#151F32] border rounded-lg px-4 py-3 shadow-2xl transition-all duration-300 max-w-md animate-in fade-in slide-in-from-bottom-2 ${
        isSuccess
          ? 'border-[#22C55E]/50'
          : isError
          ? 'border-red-500/50'
          : 'border-[#38BDF8]/50'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 ${
          isSuccess ? 'text-[#22C55E]' : isError ? 'text-red-400' : 'text-[#38BDF8]'
        }`}
      >
        {isSuccess ? 'check_circle' : isError ? 'error' : 'info'}
      </span>
      <div className="min-w-0 pr-2">
        <div className="text-sm font-semibold text-[#F8FAFC]">{toast.title}</div>
        <div className="text-xs text-[#94A3B8] leading-relaxed mt-0.5">{toast.description}</div>
      </div>
      <button
        onClick={dismissToast}
        className="ml-auto text-[#64748B] hover:text-[#F8FAFC] p-1 rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
