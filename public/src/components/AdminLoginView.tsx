import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AdminLoginView: React.FC = () => {
  const { login, loginError, sessionExpired, clearLoginError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearLoginError();
    setIsSubmitting(true);

    try {
      const ok = await login(email, password);
      if (!ok) {
        setIsSubmitting(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0B1120] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-8 shadow-2xl shadow-black/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] ring-1 ring-[#38BDF8]/30">
            <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Picker Performance Dashboard</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">Admin / Input access</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-[#E2E8F0]">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-[#283953] bg-[#0F172A] px-3 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20"
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-[#E2E8F0]">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#283953] bg-[#0F172A] px-3 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20"
              placeholder="Enter password"
              disabled={isSubmitting}
            />
          </div>

          {(loginError || sessionExpired) && (
            <div className="rounded-lg border border-[#F87171]/30 bg-[#7F1D1D]/20 px-3 py-2 text-sm text-[#FCA5A5]">
              {loginError || 'Session expired. Please log in again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-[#38BDF8] px-4 py-3 text-sm font-semibold text-[#08111F] transition hover:bg-[#7DD3FC] disabled:cursor-not-allowed disabled:bg-[#38BDF8]/60"
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};