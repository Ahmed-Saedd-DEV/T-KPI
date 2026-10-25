import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Picker, PerformanceTier } from '../types';

export const PickersView: React.FC = () => {
  const {
    pickers,
    pickersLoading,
    pickersError,
    fetchPickers,
    addPicker,
    removePicker,
    selectedTelemetryPicker,
    setSelectedTelemetryPicker,
    isAddPickerOpen,
    setIsAddPickerOpen,
    isRemovePickerOpen,
    setIsRemovePickerOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('P-10');
  const [tierFilter, setTierFilter] = useState<'all' | PerformanceTier>('all');
  const [sortBy, setSortBy] = useState<'perf_desc' | 'perf_asc' | 'alpha_asc' | 'orders_desc'>('perf_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Picker Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Remove Picker Form State
  const [removeSearch, setRemoveSearch] = useState('');
  const [selectedRemoveId, setSelectedRemoveId] = useState<string>('P-1033');
  const [isRemoving, setIsRemoving] = useState(false);

  // Filter & Sort Logic
  const filteredPickers = useMemo(() => {
    let result = [...pickers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'all') {
      result = result.filter((p) => p.tier === tierFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'perf_desc') return b.velocityScore - a.velocityScore;
      if (sortBy === 'perf_asc') return a.velocityScore - b.velocityScore;
      if (sortBy === 'alpha_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'orders_desc') return b.orders - a.orders;
      return 0;
    });

    return result;
  }, [pickers, searchQuery, tierFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPickers.length / itemsPerPage));
  const paginatedPickers = filteredPickers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRegisterPicker = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const res = addPicker(newId, newName);
    if (!res.success) {
      setAddError(res.error || 'Failed to add picker');
    } else {
      setNewId('');
      setNewName('');
      setIsAddPickerOpen(false);
    }
  };

  const handleExecuteRemoval = () => {
    if (!selectedRemoveId) return;
    setIsRemoving(true);
    setTimeout(() => {
      removePicker(selectedRemoveId);
      setIsRemoving(false);
      setIsRemovePickerOpen(false);
    }, 800);
  };

  // Candidates for removal modal
  const removalCandidates = pickers.filter((p) =>
    removeSearch
      ? p.name.toLowerCase().includes(removeSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(removeSearch.toLowerCase())
      : true
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Desktop Top Header Bar */}
      <header className="bg-[#0D1527] border-b border-[#1E293B] flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Picker Performance</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping"></span>
            REAL-TIME TELEMETRY
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span>
              Telemetry Stream: <strong className="text-[#F8FAFC]">Active</strong>
            </span>
            <span className="text-[#64748B]">· 2s ago</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151F32] border border-[#1E293B] text-xs font-semibold text-[#64748B]">
            <span className="material-symbols-outlined text-[16px] text-[#38BDF8]">warehouse</span>
            <span className="text-[#F8FAFC]">Zone 04-A</span>
          </div>

          <button
            aria-label="Notifications"
            className="p-2 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#151F32] transition-colors relative"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#38BDF8]"></span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[#1E293B]">
            <div className="w-8 h-8 rounded-full bg-[#1B2940] border border-[#38BDF8]/40 flex items-center justify-center text-xs font-bold text-[#38BDF8]">
              OP
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-semibold text-[#F8FAFC]">Ops Supervisor</div>
              <div className="text-[11px] text-[#64748B]">Terminal #12</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 w-full max-w-7xl mx-auto pb-20 lg:pb-8">
        {/* Overview Bar & Headline Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#94A3B8]">
              Real-time velocity tracking, task latency scoring, and individual dispatch accuracy across warehouse shifts.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#151F32] border border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs">
              <span className="text-[#64748B] uppercase tracking-wider">Active Pickers:</span>
              <span className="font-bold text-[#F8FAFC] text-sm tabular-nums">24</span>
            </div>
            <div className="flex items-center gap-2 bg-[#151F32] border border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs">
              <span className="text-[#64748B] uppercase tracking-wider">Avg Velocity:</span>
              <span className="font-bold text-[#38BDF8] text-sm tabular-nums">82.4%</span>
            </div>
            <div className="flex items-center gap-2 bg-[#151F32] border border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs">
              <span className="text-[#64748B] uppercase tracking-wider">Completed Orders:</span>
              <span className="font-bold text-[#22C55E] text-sm tabular-nums">2,840</span>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <section className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by picker name or ID: P-xxxx..."
                className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-10 pr-10 py-2.5 text-[#F8FAFC] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] p-1 rounded-md transition-colors"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter & Sort Dropdowns + Action Group */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              {/* Performance Level */}
              <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  aria-label="Performance Level"
                  className="w-full bg-[#0B1120] border border-[#334155] rounded-lg px-3.5 py-2.5 pr-8 text-[#F8FAFC] text-xs font-medium focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] appearance-none cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="excellent">Excellent (90-100%)</option>
                  <option value="very_good">Very Good (80-89%)</option>
                  <option value="good">Good (70-79%)</option>
                  <option value="average">Average (60-69%)</option>
                  <option value="below_average">Below Average (50-59%)</option>
                  <option value="low">Low Performance (&lt;50%)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none text-[18px]">
                  tune
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="relative min-w-[190px] flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort By"
                  className="w-full bg-[#0B1120] border border-[#334155] rounded-lg px-3.5 py-2.5 pr-8 text-[#F8FAFC] text-xs font-medium focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] appearance-none cursor-pointer"
                >
                  <option value="perf_desc">Highest Performance (default)</option>
                  <option value="perf_asc">Lowest Performance</option>
                  <option value="alpha_asc">Picker Name A–Z</option>
                  <option value="orders_desc">Most Orders</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none text-[18px]">
                  sort
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsRemovePickerOpen(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#F87171]/40 text-[#F87171] hover:bg-[#F87171]/10 hover:border-[#F87171] text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                  title="Decommission or remove existing picker"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                  <span>Remove Picker</span>
                </button>

                <button
                  onClick={() => setIsAddPickerOpen(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B1120] text-xs font-bold transition-all duration-150 shadow-md shadow-[#38BDF8]/20 whitespace-nowrap active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    add
                  </span>
                  <span>+ Add Picker</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Tag Strip */}
          <div className="mt-3 pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Active Filter:</span>
              {searchQuery && (
                <span className="bg-[#1B2940] text-[#38BDF8] px-2.5 py-0.5 rounded border border-[#334155] inline-flex items-center gap-1">
                  Query: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-[#F8FAFC] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              <span className="bg-[#1B2940] text-[#F8FAFC] px-2.5 py-0.5 rounded border border-[#334155]">
                Tier: {tierFilter === 'all' ? 'All Levels' : tierFilter.replace('_', ' ')}
              </span>
              <span className="bg-[#1B2940] text-[#F8FAFC] px-2.5 py-0.5 rounded border border-[#334155]">
                Sort: {sortBy === 'perf_desc' ? 'Highest Performance' : sortBy}
              </span>
            </div>

            <span className="tabular-nums font-medium text-[#94A3B8]">
              Showing {filteredPickers.length} of 24 operators
            </span>
          </div>
        </section>

        {pickersLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6].map((n) => (
              <div key={n} className="bg-[#151F32] border border-[#1E293B] rounded-xl p-5 h-48 animate-pulse">
                <div className="h-4 w-24 bg-[#1E293B] rounded mb-3"></div>
                <div className="h-6 w-36 bg-[#1E293B] rounded mb-5"></div>
                <div className="flex gap-4"><div className="w-16 h-16 rounded-full bg-[#1E293B]"></div><div className="flex-1 space-y-2"><div className="h-4 bg-[#1E293B] rounded"></div><div className="h-4 bg-[#1E293B] rounded w-3/4"></div></div></div>
              </div>
            ))}
          </div>
        )}

        {pickersError && !pickersLoading && (
          <div className="bg-[#151F32] border border-[#F87171]/30 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[#F87171] text-[32px]">sync_problem</span>
            <p className="text-sm font-bold text-white">Failed to load pickers</p>
            <p className="text-xs text-[#94A3B8]">{pickersError}</p>
            <button onClick={fetchPickers} className="px-4 py-2 bg-[#1B2940] border border-[#334155] rounded-lg text-xs font-semibold text-[#38BDF8] hover:bg-[#223554] transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Responsive Picker Card Grid */}
        {paginatedPickers.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {paginatedPickers.map((p) => {
              // Perimeter for r=26 is ~163.36
              const perimeter = 163.36;
              const offset = perimeter - (perimeter * (p.velocityScore / 100));

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedTelemetryPicker(p)}
                  className="bg-[#151F32] border border-[#1E293B] hover:border-[#38BDF8]/60 rounded-xl p-5 transition-all duration-200 cursor-pointer shadow-sm relative group hover:bg-[#18243A] hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono text-[#38BDF8] bg-[#0B1120] px-2 py-0.5 rounded border border-[#334155] inline-block font-semibold">
                          ID: {p.id}
                        </span>
                        <h2 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-1.5">
                          {p.name}
                        </h2>
                      </div>

                      <span
                        className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-[11px] uppercase font-bold"
                        style={{
                          backgroundColor: `${p.tierColor}20`,
                          color: p.tierColor,
                          border: `1px solid ${p.tierColor}40`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.tierColor }}></span>
                        {p.tierLabel}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        {/* Circular SVG Gauge */}
                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" fill="transparent" r="26" stroke="#1E293B" strokeWidth="5.5" />
                            <circle
                              cx="32"
                              cy="32"
                              fill="transparent"
                              r="26"
                              stroke={p.tierColor}
                              strokeDasharray={perimeter}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              strokeWidth="5.5"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#F8FAFC] tabular-nums">
                              {p.velocityScore}%
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold">
                            Velocity Score
                          </span>
                          <span className="text-xs font-bold" style={{ color: p.tierColor }}>
                            {p.velocityScore}% · {p.tierLabel}
                          </span>
                          <span className="text-[11px] text-[#64748B] mt-0.5">{p.subBadge}</span>
                        </div>
                      </div>

                      <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2 text-right min-w-[70px]">
                        <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">Orders</span>
                        <span className="text-xl font-bold text-[#F8FAFC] tabular-nums leading-tight">
                          {p.orders}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span> {p.zone}
                    </span>

                    {p.actionReq ? (
                      <span className="text-[#F87171] flex items-center gap-0.5 group-hover:underline font-semibold">
                        Action Req <span className="material-symbols-outlined text-[14px]">warning</span>
                      </span>
                    ) : (
                      <span className="text-[#38BDF8] flex items-center gap-0.5 group-hover:underline font-medium">
                        Telemetry <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3">
            <span className="material-symbols-outlined text-[#FB923C] text-[32px]">search_off</span>
            <div className="text-sm font-bold text-[#F8FAFC]">No pickers found</div>
            <p className="text-xs text-[#94A3B8] max-w-sm">
              No badge matches the current filter or query criteria "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTierFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#1B2940] border border-[#334155] text-xs font-semibold text-[#38BDF8] hover:bg-[#223554] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        <section className="bg-[#151F32] border border-[#1E293B] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-3 text-[#94A3B8]">
            <span>
              Showing <strong className="text-[#F8FAFC] tabular-nums">1–{paginatedPickers.length}</strong> of{' '}
              <strong className="text-[#F8FAFC] tabular-nums">{filteredPickers.length}</strong> pickers
            </span>
            <span className="text-[#64748B]">·</span>
            <span className="text-[#64748B]">
              Displaying <span className="text-[#F8FAFC] font-semibold">{itemsPerPage} per page</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border border-[#1E293B] flex items-center gap-1 transition-colors ${
                currentPage <= 1
                  ? 'text-[#64748B] bg-[#0B1120]/60 cursor-not-allowed opacity-50'
                  : 'bg-[#1B2940] hover:bg-[#223554] text-[#F8FAFC]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 bg-[#1B2940] text-[#38BDF8] border border-[#334155] rounded-lg font-semibold tabular-nums">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                currentPage >= totalPages
                  ? 'border-[#1E293B] text-[#64748B] bg-[#0B1120]/60 cursor-not-allowed opacity-50'
                  : 'border-[#334155] bg-[#1B2940] hover:bg-[#223554] text-[#F8FAFC]'
              }`}
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* 1. TELEMETRY MODAL (6 tiles) */}
      {/* ========================================================================= */}
      {selectedTelemetryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#F8FAFC]">{selectedTelemetryPicker.name}</h2>
                    <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#0B1120] px-2 py-0.5 rounded border border-[#334155]">
                      ID: {selectedTelemetryPicker.id}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Active Location: {selectedTelemetryPicker.telemetry.detailedZone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTelemetryPicker(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Gauge Banner */}
              <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" fill="transparent" r="40" stroke="#1E293B" strokeWidth="8" />
                    <circle
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke={selectedTelemetryPicker.tierColor}
                      strokeDasharray={251.32}
                      strokeDashoffset={251.32 - (251.32 * (selectedTelemetryPicker.velocityScore / 100))}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                      {selectedTelemetryPicker.velocityScore}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase"
                      style={{
                        backgroundColor: `${selectedTelemetryPicker.tierColor}20`,
                        color: selectedTelemetryPicker.tierColor,
                        border: `1px solid ${selectedTelemetryPicker.tierColor}40`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: selectedTelemetryPicker.tierColor }}
                      ></span>
                      {selectedTelemetryPicker.velocityScore}% · {selectedTelemetryPicker.tierLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Operator Shift Telemetry Overview</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Continuous barcode scan pacing, route adherence, and conveyor handoff metrics updated every 30
                    seconds from terminal RF scanners.
                  </p>
                </div>
              </div>

              {/* Exact 6 Tiles */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-[#64748B] tracking-wider mb-3">
                  Shift Operational Telemetry (6 Core Metrics)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {/* Tile 1: Orders */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Orders</span>
                    <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.orders}
                    </span>
                    <span className="text-[11px] text-[#22C55E] font-medium flex items-center gap-0.5 mt-1">
                      <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      {selectedTelemetryPicker.telemetry.ordersDelta || '+14 vs avg'}
                    </span>
                  </div>

                  {/* Tile 2: Picking Time */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Picking Time</span>
                    <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.pickingTime}
                    </span>
                    <span className="text-[11px] text-[#22C55E] font-medium flex items-center gap-0.5 mt-1">
                      <span className="material-symbols-outlined text-[13px]">speed</span>
                      {selectedTelemetryPicker.telemetry.pickingDelta || '-12s pace'}
                    </span>
                  </div>

                  {/* Tile 3: Assignment Time */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Assignment Time</span>
                    <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.assignmentTime}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-medium block mt-1">Queue &lt; 30s target</span>
                  </div>

                  {/* Tile 4: Prep Time */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Prep Time</span>
                    <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.prepTime}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-medium block mt-1">Tote initialization</span>
                  </div>

                  {/* Tile 5: Dispatch Time */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Dispatch Time</span>
                    <span className="text-2xl font-bold text-[#38BDF8] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.dispatchTime}
                    </span>
                    <span className="text-[11px] text-[#38BDF8] font-medium block mt-1">Top 5% Conveyor feed</span>
                  </div>

                  {/* Tile 6: Ops CR */}
                  <div className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5">
                    <span className="text-xs text-[#64748B] block">Ops CR</span>
                    <span className="text-2xl font-bold text-[#22C55E] tabular-nums block mt-1">
                      {selectedTelemetryPicker.telemetry.opsCr}
                    </span>
                    <span className="text-[11px] text-[#22C55E] font-medium block mt-1">Cancellation &lt; 3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#151F32] border-t border-[#334155] flex justify-between items-center text-xs">
              <span className="text-[#64748B]">Terminal RF: Honeywell CT40 · Battery: 88%</span>
              <button
                onClick={() => setSelectedTelemetryPicker(null)}
                className="bg-[#1B2940] hover:bg-[#223554] border border-[#334155] text-[#F8FAFC] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD PICKER MODAL */}
      {/* ========================================================================= */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">Add New Floor Picker</h2>
                  <p className="text-xs text-[#94A3B8]">Register employee terminal credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterPicker} className="p-5 space-y-4">
              {/* Duplicate ID validation notice */}
              <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg p-3 flex items-start gap-2.5 text-[#F87171]">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Validation Warning</strong>
                  Duplicate ID verification is active. Assigning an existing terminal badge number (e.g., P-1042) will
                  reject synchronization.
                </div>
              </div>

              {addError && (
                <div className="p-2.5 rounded bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                  {addError}
                </div>
              )}

              {/* Field 1: Picker ID */}
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Picker ID <span className="text-[#F87171]">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. P-1102"
                    className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
                  />
                </div>
                <span className="text-[11px] text-[#64748B] mt-1 block font-mono">
                  Format: Capital P followed by hyphen and 4 digits (P-XXXX).
                </span>
              </div>

              {/* Field 2: Picker Name */}
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Picker Name <span className="text-[#F87171]">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full employee legal name"
                    className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsAddPickerOpen(false)}
                  className="px-4 py-2 bg-[#0B1120] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#151F32] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#38BDF8] text-[#0B1120] font-bold rounded-lg hover:bg-[#7DD3FC] text-xs transition-colors shadow-md shadow-[#38BDF8]/20 cursor-pointer"
                >
                  Register Picker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REMOVE PICKER MODAL */}
      {/* ========================================================================= */}
      {isRemovePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">Remove Picker</h2>
                  <p className="text-xs text-[#94A3B8]">De-register floor operator from Hub 04 active fleet</p>
                </div>
              </div>
              <button
                onClick={() => setIsRemovePickerOpen(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Locate Picker to Remove
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={removeSearch}
                    onChange={(e) => setRemoveSearch(e.target.value)}
                    placeholder="Search by picker name or badge ID (e.g. P-1033)..."
                    className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#F87171] focus:ring-1 focus:ring-[#F87171]"
                  />
                </div>
              </div>

              {/* Picker Candidate List */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Select Candidate:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {removalCandidates.map((candidate) => {
                    const isSelected = selectedRemoveId === candidate.id;
                    return (
                      <label
                        key={candidate.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-2 border-[#F87171] bg-[#0B1120]'
                            : 'border border-[#334155] bg-[#0B1120]/60 hover:bg-[#0B1120]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="picker_to_remove"
                            value={candidate.id}
                            checked={isSelected}
                            onChange={() => setSelectedRemoveId(candidate.id)}
                            className="text-[#F87171] focus:ring-[#F87171] bg-[#151F32] border-[#334155]"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#F8FAFC]">{candidate.name}</div>
                            <div className="text-xs text-[#64748B]">
                              {candidate.zone} · {candidate.orders} orders
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                            isSelected
                              ? 'text-[#F87171] bg-[#F87171]/10 border-[#F87171]/30'
                              : 'text-[#64748B] bg-[#151F32] border-[#334155]'
                          }`}
                        >
                          ID: {candidate.id}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg p-3.5 flex items-start gap-3 text-[#F87171]">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
                <div className="text-xs space-y-1">
                  <span className="font-bold block uppercase tracking-wide">Destructive action notice</span>
                  <p className="leading-relaxed text-[#ffdad6]">
                    Removing this picker will unassign their active shifts, revoke terminal device credentials, and
                    archive all historical operational records.
                  </p>
                </div>
              </div>

              {/* API Contract Tag */}
              <div className="flex items-center justify-between p-2.5 rounded bg-[#0B1120] border border-[#334155] text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                  API CONTRACT: DELETE /v2/pickers/{selectedRemoveId}
                </span>
                <span className="text-[#38BDF8] font-semibold">Async Job Queue</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-[#151F32] border-t border-[#334155] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemovePickerOpen(false)}
                className="px-4 py-2 bg-[#0B1120] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#151F32] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleExecuteRemoval}
                className="px-4 py-2 bg-[#F87171] hover:bg-[#EF4444] text-[#0B1120] font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isRemoving ? 'Removing...' : 'Remove Picker'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
