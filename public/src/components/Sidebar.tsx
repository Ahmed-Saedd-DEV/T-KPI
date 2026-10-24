import React from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, pickers } = useApp();

  const navItems: { id: NavTab; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      id: 'pickers',
      label: 'Pickers',
      icon: 'speed',
      badge: `${pickers.length} LIVE`,
    },
    { id: 'branch-kpis', label: 'Branch KPIs', icon: 'analytics' },
    { id: 'admin', label: 'Admin / Input', icon: 'tune' },
  ];

  return (
    <>
      {/* Desktop Persistent Left Sidebar (w-64) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-[#0D1527] border-r border-[#1E293B] flex-col justify-between py-5 px-3 z-40 select-none">
        <div>
          {/* Brand Header */}
          <div className="px-3 py-2 mb-6 flex items-center justify-between border-b border-[#1E293B] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#0284C7] flex items-center justify-center text-[#0B1120] font-black shadow-md shadow-[#38BDF8]/20">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  speed
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F8FAFC] tracking-tight leading-tight">Picker Performance</h2>
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold font-mono">
                  Industrial Operations
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#151F32] text-[#38BDF8] font-bold border-l-4 border-[#38BDF8] shadow-sm'
                      : 'text-[#94A3B8] hover:bg-[#151F32] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8] font-semibold'
                          : 'bg-[#1E293B] text-[#64748B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational System Status Node in Footer */}
        <div className="p-3.5 bg-[#151F32] rounded-xl border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#64748B] uppercase">
              Node Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#52e87c] bg-[#52e87c]/10 border border-[#52e87c]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52e87c] animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#F8FAFC]">ELMONTAZA_DS-68</div>
            <div className="text-[10px] font-mono text-[#64748B] mt-0.5">LATENCY: 14ms (Direct Pipe 04)</div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#0D1527] border-t border-[#1E293B] px-2 shadow-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 flex-1 relative ${
                isActive ? 'text-[#38BDF8] font-bold' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              {isActive && (
                <span className="absolute top-1 right-1/4 w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
