import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Picker, PerformanceTier } from "../types";

export const PickersView: React.FC = () => {
  const {
    pickers,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | PerformanceTier>("all");
  const [sortBy, setSortBy] = useState<
    "perf_desc" | "perf_asc" | "alpha_asc" | "orders_desc"
  >("perf_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [removeSearch, setRemoveSearch] = useState("");
  const [selectedRemoveId, setSelectedRemoveId] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState(false);

  const filteredPickers = useMemo(() => {
    let result = [...pickers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      );
    }
    if (tierFilter !== "all") {
      result = result.filter((p) => p.tier === tierFilter);
    }
    result.sort((a, b) => {
      const aScore = a.velocityScore ?? Number.POSITIVE_INFINITY;
      const bScore = b.velocityScore ?? Number.POSITIVE_INFINITY;
      if (sortBy === "perf_desc")
        return (
          (b.velocityScore ?? Number.NEGATIVE_INFINITY) -
          (a.velocityScore ?? Number.NEGATIVE_INFINITY)
        );
      if (sortBy === "perf_asc") return aScore - bScore;
      if (sortBy === "alpha_asc") return a.name.localeCompare(b.name);
      if (sortBy === "orders_desc") return b.orders - a.orders;
      return 0;
    });
    return result;
  }, [pickers, searchQuery, tierFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPickers.length / itemsPerPage),
  );
  const paginatedPickers = filteredPickers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleRegisterPicker = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const res = addPicker(newId, newName);
    if (!res.success) {
      setAddError(res.error || "Failed to add picker");
    } else {
      setNewId("");
      setNewName("");
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

  const removalCandidates = pickers.filter((p) =>
    removeSearch
      ? p.name.toLowerCase().includes(removeSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(removeSearch.toLowerCase())
      : true,
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-[#0D1527] border-b border-[#1E293B] flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
          Picker Performance
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 w-full max-w-7xl mx-auto pb-20 lg:pb-8">
        {/* Error State */}
        {pickersError && (
          <div className="bg-[#151F32] border border-[#F87171]/30 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[#F87171] text-[32px]">
              sync_problem
            </span>
            <p className="text-sm font-bold text-white">
              Failed to load pickers
            </p>
            <p className="text-xs text-[#94A3B8]">{pickersError}</p>
            <button
              onClick={fetchPickers}
              className="px-4 py-2 bg-[#1B2940] border border-[#334155] rounded-lg text-xs font-semibold text-[#38BDF8] hover:bg-[#223554] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <section className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by picker name or ID..."
                className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-10 pr-10 py-2.5 text-[#F8FAFC] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] p-1 rounded-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#0B1120] border border-[#334155] rounded-lg px-3.5 py-2.5 pr-8 text-[#F8FAFC] text-xs font-medium focus:outline-none focus:border-[#38BDF8] appearance-none cursor-pointer"
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

              <div className="relative min-w-[190px] flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#0B1120] border border-[#334155] rounded-lg px-3.5 py-2.5 pr-8 text-[#F8FAFC] text-xs font-medium focus:outline-none focus:border-[#38BDF8] appearance-none cursor-pointer"
                >
                  <option value="perf_desc">Highest Performance</option>
                  <option value="perf_asc">Lowest Performance</option>
                  <option value="alpha_asc">Name A–Z</option>
                  <option value="orders_desc">Most Orders</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none text-[18px]">
                  sort
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsRemovePickerOpen(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#F87171]/40 text-[#F87171] hover:bg-[#F87171]/10 hover:border-[#F87171] text-xs font-semibold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete_outline
                  </span>
                  <span>Remove Picker</span>
                </button>
                <button
                  onClick={() => setIsAddPickerOpen(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B1120] text-xs font-bold transition-all shadow-md shadow-[#38BDF8]/20 cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    add
                  </span>
                  <span>+ Add Picker</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#64748B]">
            <span>{filteredPickers.length} pickers found</span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </section>

        {/* Picker Grid */}
        {paginatedPickers.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {paginatedPickers.map((p) => {
              const perimeter = 163.36;
              const scoreIsMissing = p.velocityScore === null;
              const displayScoreValue = scoreIsMissing
                ? "N/A"
                : `${p.velocityScore}%`;
              const displayTierLabel = scoreIsMissing ? "No data" : p.tierLabel;
              const offset =
                scoreIsMissing || p.velocityScore === null
                  ? perimeter
                  : perimeter - perimeter * (p.velocityScore / 100);
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
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: p.tierColor }}
                        ></span>
                        {p.tierLabel}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                          <svg
                            className="w-16 h-16 transform -rotate-90"
                            viewBox="0 0 64 64"
                          >
                            <circle
                              cx="32"
                              cy="32"
                              fill="transparent"
                              r="26"
                              stroke="#1E293B"
                              strokeWidth="5.5"
                            />
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
                              {displayScoreValue}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold">
                            Velocity Score
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: p.tierColor }}
                          >
                            {displayScoreValue} · {displayTierLabel}
                          </span>
                          <span className="text-[11px] text-[#64748B] mt-0.5">
                            {p.subBadge}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2 text-right min-w-[70px]">
                        <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">
                          Orders
                        </span>
                        <span className="text-xl font-bold text-[#F8FAFC] tabular-nums leading-tight">
                          {p.orders}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        pin_drop
                      </span>{" "}
                      {p.zone}
                    </span>
                    <span className="text-[#38BDF8] flex items-center gap-0.5 group-hover:underline font-medium">
                      Telemetry{" "}
                      <span className="material-symbols-outlined text-[14px]">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          !pickersError && (
            <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3">
              <span className="material-symbols-outlined text-[#FB923C] text-[32px]">
                search_off
              </span>
              <div className="text-sm font-bold text-[#F8FAFC]">
                No pickers found
              </div>
              <p className="text-xs text-[#94A3B8] max-w-sm">
                No badge matches the current filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTierFilter("all");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#1B2940] border border-[#334155] text-xs font-semibold text-[#38BDF8] hover:bg-[#223554] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <section className="bg-[#151F32] border border-[#1E293B] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
            <span className="text-[#94A3B8]">
              Showing{" "}
              <strong className="text-[#F8FAFC]">
                {paginatedPickers.length}
              </strong>{" "}
              of{" "}
              <strong className="text-[#F8FAFC]">
                {filteredPickers.length}
              </strong>{" "}
              pickers
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-lg border border-[#1E293B] flex items-center gap-1 transition-colors ${
                  currentPage <= 1
                    ? "text-[#64748B] bg-[#0B1120]/60 cursor-not-allowed opacity-50"
                    : "bg-[#1B2940] hover:bg-[#223554] text-[#F8FAFC]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>
                <span>Previous</span>
              </button>
              <span className="px-3 py-1.5 bg-[#1B2940] text-[#38BDF8] border border-[#334155] rounded-lg font-semibold tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                  currentPage >= totalPages
                    ? "border-[#1E293B] text-[#64748B] bg-[#0B1120]/60 cursor-not-allowed opacity-50"
                    : "border-[#334155] bg-[#1B2940] hover:bg-[#223554] text-[#F8FAFC]"
                }`}
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* TELEMETRY MODAL */}
      {selectedTelemetryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    badge
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#F8FAFC]">
                      {selectedTelemetryPicker.name}
                    </h2>
                    <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#0B1120] px-2 py-0.5 rounded border border-[#334155]">
                      ID: {selectedTelemetryPicker.id}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {selectedTelemetryPicker.telemetry.detailedZone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTelemetryPicker(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 transform -rotate-90"
                    viewBox="0 0 96 96"
                  >
                    <circle
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="#1E293B"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke={
                        selectedTelemetryPicker.velocityScore === null
                          ? "#64748B"
                          : selectedTelemetryPicker.tierColor
                      }
                      strokeDasharray={251.32}
                      strokeDashoffset={
                        selectedTelemetryPicker.velocityScore === null
                          ? 251.32
                          : 251.32 -
                            251.32 *
                              (selectedTelemetryPicker.velocityScore / 100)
                      }
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                      {selectedTelemetryPicker.velocityScore === null
                        ? "N/A"
                        : `${selectedTelemetryPicker.velocityScore}%`}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase"
                    style={{
                      backgroundColor: `${selectedTelemetryPicker.velocityScore === null ? "#64748B" : selectedTelemetryPicker.tierColor}20`,
                      color:
                        selectedTelemetryPicker.velocityScore === null
                          ? "#94A3B8"
                          : selectedTelemetryPicker.tierColor,
                      border: `1px solid ${selectedTelemetryPicker.velocityScore === null ? "#64748B" : selectedTelemetryPicker.tierColor}40`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          selectedTelemetryPicker.velocityScore === null
                            ? "#64748B"
                            : selectedTelemetryPicker.tierColor,
                      }}
                    ></span>
                    {selectedTelemetryPicker.velocityScore === null
                      ? "No data"
                      : `${selectedTelemetryPicker.velocityScore}% · ${selectedTelemetryPicker.tierLabel}`}
                  </span>
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    Operator Shift Telemetry
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  {
                    label: "Orders",
                    value: selectedTelemetryPicker.telemetry.orders,
                    color: "#F8FAFC",
                  },
                  {
                    label: "Picking Time",
                    value: selectedTelemetryPicker.telemetry.pickingTime,
                    color: "#F8FAFC",
                  },
                  {
                    label: "Assignment Time",
                    value: selectedTelemetryPicker.telemetry.assignmentTime,
                    color: "#F8FAFC",
                  },
                  {
                    label: "Prep Time",
                    value: selectedTelemetryPicker.telemetry.prepTime,
                    color: "#F8FAFC",
                  },
                  {
                    label: "Dispatch Time",
                    value: selectedTelemetryPicker.telemetry.dispatchTime,
                    color: "#38BDF8",
                  },
                  {
                    label: "Ops CR",
                    value: selectedTelemetryPicker.telemetry.opsCr,
                    color: "#22C55E",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="bg-[#0B1120] border border-[#334155] rounded-xl p-3.5"
                  >
                    <span className="text-xs text-[#64748B] block">
                      {label}
                    </span>
                    <span
                      className="text-2xl font-bold tabular-nums block mt-1"
                      style={{ color }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-[#151F32] border-t border-[#334155] flex justify-end">
              <button
                onClick={() => setSelectedTelemetryPicker(null)}
                className="bg-[#1B2940] hover:bg-[#223554] border border-[#334155] text-[#F8FAFC] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PICKER MODAL */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">
                    Add New Picker
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Register employee credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleRegisterPicker} className="p-5 space-y-4">
              {addError && (
                <div className="p-2.5 rounded bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                  {addError}
                </div>
              )}
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
              </div>
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
                    placeholder="Full employee name"
                    className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsAddPickerOpen(false)}
                  className="px-4 py-2 bg-[#0B1120] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#151F32] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#38BDF8] text-[#0B1120] font-bold rounded-lg hover:bg-[#7DD3FC] text-xs cursor-pointer"
                >
                  Register Picker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE PICKER MODAL */}
      {isRemovePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1B2940] border border-[#334155] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#151F32] border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    delete_outline
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">
                    Remove Picker
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    De-register floor operator
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRemovePickerOpen(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Search Picker
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={removeSearch}
                    onChange={(e) => setRemoveSearch(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#F87171]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Select Picker:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {removalCandidates.map((candidate) => {
                    const isSelected = selectedRemoveId === candidate.id;
                    return (
                      <label
                        key={candidate.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-2 border-[#F87171] bg-[#0B1120]"
                            : "border border-[#334155] bg-[#0B1120]/60 hover:bg-[#0B1120]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="picker_to_remove"
                            value={candidate.id}
                            checked={isSelected}
                            onChange={() => setSelectedRemoveId(candidate.id)}
                            className="text-[#F87171] focus:ring-[#F87171]"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#F8FAFC]">
                              {candidate.name}
                            </div>
                            <div className="text-xs text-[#64748B]">
                              {candidate.zone} · {candidate.orders} orders
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${isSelected ? "text-[#F87171] bg-[#F87171]/10 border-[#F87171]/30" : "text-[#64748B] bg-[#151F32] border-[#334155]"}`}
                        >
                          {candidate.id}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg p-3.5 flex items-start gap-3 text-[#F87171]">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  warning
                </span>
                <p className="text-xs leading-relaxed text-[#ffdad6]">
                  Removing this picker will archive all their historical
                  operational records.
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#151F32] border-t border-[#334155] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemovePickerOpen(false)}
                className="px-4 py-2 bg-[#0B1120] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#151F32] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving || !selectedRemoveId}
                onClick={handleExecuteRemoval}
                className="px-4 py-2 bg-[#F87171] hover:bg-[#EF4444] text-[#0B1120] font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  delete
                </span>
                <span>{isRemoving ? "Removing..." : "Remove Picker"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
