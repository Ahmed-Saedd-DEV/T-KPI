import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { buildChartGeometry } from "../utils/chartGeometry";
import { buildDashboardCrSummary } from "../utils/dashboardCrTrend";

export const DashboardView: React.FC = () => {
  const {
    setActiveTab,
    setSelectedTelemetryPicker,
    pickers,
    branchKpis,
    branchKpisStatus,
    branchKpisError,
    currentUser,
    logout,
  } = useApp();
  const [leaderboardState, setLeaderboardState] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");
  const [utcTime, setUtcTime] = useState<string>("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeInEgypt = now.toLocaleTimeString("en-US", {
        timeZone: "Africa/Cairo",
        hour12: true,
      });
      setUtcTime(`${timeInEgypt} EGY`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const top3 = pickers.slice(0, 3);
  const crHistory = branchKpis.CR.historyData ?? [];
  const crSummary = useMemo(
    () => buildDashboardCrSummary(crHistory),
    [crHistory],
  );
  const crChart = useMemo(
    () => buildChartGeometry(crSummary.history, "%"),
    [crSummary.history],
  );
  const crAverageLabel =
    crSummary.averageValue === null
      ? "N/A"
      : `${crSummary.averageValue.toFixed(2)}%`;
  const showDashboardCrChart =
    branchKpisStatus === "loaded" && crSummary.history.length > 0;
  const dashboardCrStatusLabel =
    branchKpisStatus === "loading" || branchKpisStatus === "idle"
      ? "Loading CR data..."
      : branchKpisStatus === "empty" || crSummary.history.length === 0
        ? "No data"
        : branchKpisStatus === "error"
          ? "Unable to load CR data"
          : branchKpisStatus === "stale"
            ? "Stale Data"
            : "CR trend";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Header Bar */}
      <header className="h-16 w-full px-4 md:px-8 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold text-[#F1F5F9] tracking-tight">
            Dashboard
          </h1>
          <span className="text-[#334155]">/</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/20">
            Overview
          </span>
          <span className="hidden xl:inline text-xs text-[#64748B] ml-2 truncate">
            Real-time floor velocity and weekly branch conversion metrics
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Live Egypt Time Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F32] border border-[#1E293B] text-[#94A3B8]">
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">
              schedule
            </span>
            <span className="text-xs font-mono tabular-nums text-[#F1F5F9]">
              {utcTime || "14:32:08 EGY"}
            </span>
          </div>

          {/* Operational Shift Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F32] border border-[#1E293B]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            <span className="text-xs font-medium text-[#CBD5E1]">Shift 01</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1E293B] text-[#94A3B8]">
              Active
            </span>
          </div>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
            <div className="w-8 h-8 rounded-lg bg-[#1B2940] border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
              {currentUser
                ? currentUser.displayName.slice(0, 2).toUpperCase()
                : "OP"}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#F1F5F9] leading-tight">
                {currentUser ? currentUser.displayName : "Ops Supervisor"}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-[#1E293B] bg-[#151F32] px-2.5 py-1.5 text-[10px] font-medium text-[#E2E8F0] transition hover:border-[#38BDF8]/30 hover:text-[#38BDF8]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="w-full max-w-7xl px-4 md:px-8 py-6 flex-1 flex flex-col gap-6 mx-auto">
        {/* KPI Metric Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] font-medium block">
                Active Shift Pickers
              </span>
              <span className="text-xl font-bold text-[#F1F5F9] font-mono tabular-nums">
                28{" "}
                <span className="text-xs font-normal text-[#64748B]">
                  on floor
                </span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1B2940] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
              <span className="material-symbols-outlined text-[20px]">
                groups
              </span>
            </div>
          </div>

          <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] font-medium block">
                Total Shift Units
              </span>
              <span className="text-xl font-bold text-[#F1F5F9] font-mono tabular-nums">
                1,492{" "}
                <span className="text-xs font-medium text-[#34D399]">
                  +6.2%
                </span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1B2940] border border-[#1E293B] flex items-center justify-center text-[#34D399]">
              <span className="material-symbols-outlined text-[20px]">
                inventory_2
              </span>
            </div>
          </div>

          <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] font-medium block">
                Avg Pick Velocity
              </span>
              <span className="text-xl font-bold text-[#F1F5F9] font-mono tabular-nums">
                48.4{" "}
                <span className="text-xs font-normal text-[#64748B]">
                  sec/order
                </span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1B2940] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
              <span className="material-symbols-outlined text-[20px]">
                timer
              </span>
            </div>
          </div>

          <div className="bg-[#151F32] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] font-medium block">
                Daily Branch CR
              </span>
              <span className="text-xl font-bold text-[#38BDF8] font-mono tabular-nums">
                {branchKpis.CR.currentValue}{" "}
                <span className="text-xs font-normal text-[#94A3B8]">
                  Latest 7 avg {crAverageLabel}
                </span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1B2940] border border-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8]">
              <span className="material-symbols-outlined text-[20px]">
                query_stats
              </span>
            </div>
          </div>
        </div>

        {/* Side-By-Side Widescreen Layout: Leaderboard (Cols 1-5) + Daily Branch CR Chart (Cols 6-12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Top 3 Pickers Leaderboard */}
          <section className="lg:col-span-5 bg-[#151F32] border border-[#1E293B] rounded-xl flex flex-col justify-between overflow-hidden shadow-sm">
            <div>
              <div className="p-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 bg-[#1B2940]/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-4 bg-[#38BDF8] rounded-sm"></div>
                  <div>
                    <h2 className="text-sm font-bold text-[#F1F5F9]">
                      Top 3 Pickers Leaderboard
                    </h2>
                    <span className="text-[11px] text-[#64748B]">
                      Ranked by floor efficiency & accuracy
                    </span>
                  </div>
                </div>

                {/* State Toggle Tabs */}
                <div
                  className="flex items-center bg-[#0F172A] p-0.5 rounded-lg border border-[#1E293B]"
                  role="group"
                >
                  {(["normal", "loading", "empty", "error"] as const).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setLeaderboardState(st)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors capitalize ${
                          leaderboardState === st
                            ? "text-[#38BDF8] bg-[#1E293B]"
                            : "text-[#94A3B8] hover:text-[#F1F5F9]"
                        }`}
                      >
                        {st === "normal"
                          ? "Active"
                          : st === "loading"
                            ? "Skeleton"
                            : st}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* State: Active Leaderboard */}
              {leaderboardState === "normal" && (
                <div className="divide-y divide-[#1E293B]">
                  {top3.map((picker, idx) => {
                    const medalColor =
                      idx === 0
                        ? {
                            bg: "bg-[#FDE047]/10",
                            border: "border-[#FDE047]/30",
                            text: "text-[#FDE047]",
                          }
                        : idx === 1
                          ? {
                              bg: "bg-[#E2E8F0]/10",
                              border: "border-[#E2E8F0]/30",
                              text: "text-[#E2E8F0]",
                            }
                          : {
                              bg: "bg-[#FB923C]/10",
                              border: "border-[#FB923C]/30",
                              text: "text-[#FB923C]",
                            };

                    return (
                      <div
                        key={picker.id}
                        onClick={() => setSelectedTelemetryPicker(picker)}
                        className="p-4 hover:bg-[#1B2940]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`shrink-0 w-9 h-9 rounded-lg ${medalColor.bg} border ${medalColor.border} flex items-center justify-center ${medalColor.text}`}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              military_tech
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors truncate">
                                {picker.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${medalColor.bg} ${medalColor.text} border ${medalColor.border}`}
                              >
                                #{idx + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
                              <span className="font-mono text-[11px] text-[#64748B]">
                                ID: {picker.id}
                              </span>
                              <span className="text-[#334155]">•</span>
                              <span>{picker.zone.split("·")[0].trim()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="block text-[11px] text-[#64748B] font-medium">
                              Orders
                            </span>
                            <span className="text-sm font-semibold text-[#F1F5F9] tabular-nums">
                              {picker.orders}
                            </span>
                          </div>
                          <div className="text-right min-w-[62px]">
                            <span className="block text-[11px] text-[#64748B] font-medium">
                              Performance
                            </span>
                            <div className="flex items-center justify-end gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: picker.tierColor }}
                              ></span>
                              <span
                                className="text-base font-bold tabular-nums"
                                style={{ color: picker.tierColor }}
                              >
                                {picker.velocityScore === null
                                  ? "N/A"
                                  : `${picker.velocityScore}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* State: Skeleton */}
              {leaderboardState === "loading" && (
                <div className="divide-y divide-[#1E293B]">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="p-4 flex items-center justify-between animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1E293B]"></div>
                        <div className="space-y-1.5">
                          <div className="w-28 h-4 rounded bg-[#1E293B]"></div>
                          <div className="w-20 h-3 rounded bg-[#1E293B]/60"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-4 rounded bg-[#1E293B]"></div>
                        <div className="w-14 h-5 rounded bg-[#1E293B]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* State: Empty */}
              {leaderboardState === "empty" && (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#1B2940] flex items-center justify-center text-[#64748B] mx-auto mb-2">
                    <span className="material-symbols-outlined text-[20px]">
                      leaderboard
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#F1F5F9]">
                    No Pick Records Detected
                  </p>
                  <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mt-1">
                    Shift in progress. Telemetry data will aggregate
                    automatically once initial picks are recorded.
                  </p>
                </div>
              )}

              {/* State: Error */}
              {leaderboardState === "error" && (
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-2">
                    <span className="material-symbols-outlined text-[20px]">
                      sync_problem
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-red-300">
                    Feed Interruption
                  </p>
                  <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mt-1">
                    Unable to query warehouse floor stream. Please re-establish
                    telemetry connection.
                  </p>
                  <button
                    onClick={() => setLeaderboardState("normal")}
                    className="mt-3 px-3 py-1 bg-[#1E293B] hover:bg-[#334155] border border-[#1E293B] rounded text-xs font-medium text-[#F1F5F9] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      refresh
                    </span>
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-[#1B2940]/30 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#64748B]">
              <span>Floor Threshold: &gt;90% optimal</span>
              <button
                onClick={() => setActiveTab("pickers")}
                className="text-[#38BDF8] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                Full Roster
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </section>

          {/* Daily Branch CR Chart */}
          <section className="lg:col-span-7 bg-[#151F32] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between overflow-hidden shadow-sm">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1E293B] gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-4 bg-[#38BDF8] rounded-sm"></div>
                  <h2 className="text-sm font-bold text-[#F1F5F9]">
                    Daily Branch CR
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B]">
                    Conversion Rate:
                  </span>
                  <span className="text-xs font-semibold text-[#38BDF8] bg-[#1B2940] border border-[#38BDF8]/20 px-2.5 py-0.5 rounded tabular-nums">
                    {crSummary.hasSufficientHistory
                      ? `Earliest → Latest: ${crSummary.rangeLabel}`
                      : "Latest 7 avg: N/A"}
                  </span>
                </div>
              </div>

              {showDashboardCrChart ? (
                <div className="pt-6 pb-2 w-full">
                  <div className="relative h-60 w-full flex">
                    <div className="w-10 h-full flex flex-col justify-between items-end pr-2.5 text-[#64748B] text-[11px] font-mono tabular-nums select-none">
                      <span>5.0%</span>
                      <span>4.0%</span>
                      <span>3.0%</span>
                      <span>2.0%</span>
                      <span>1.0%</span>
                      <span>0.0%</span>
                    </div>

                    <div className="relative flex-1 h-full border-l border-b border-[#1E293B]">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="w-full border-t border-[#1E293B]/70"></div>
                        <div className="w-full border-t border-[#1E293B]/70"></div>
                        <div className="w-full border-t border-[#1E293B]/70"></div>
                        <div className="w-full border-t border-[#1E293B]/70"></div>
                        <div className="w-full border-t border-[#1E293B]/70"></div>
                        <div className="w-full"></div>
                      </div>

                      <div className="absolute inset-0 grid grid-cols-7 items-end px-2 sm:px-6 gap-2 sm:gap-6">
                        {crChart.bars.map((bar, idx) => {
                          const tooltipText = bar.label;
                          const isVisible = activeTooltip === tooltipText;

                          return (
                            <div
                              key={`${bar.label}-${idx}`}
                              onMouseEnter={() => setActiveTooltip(tooltipText)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              onFocus={() => setActiveTooltip(tooltipText)}
                              onBlur={() => setActiveTooltip(null)}
                              tabIndex={0}
                              className="group relative flex flex-col items-center h-full justify-end cursor-pointer outline-none"
                            >
                              {isVisible && (
                                <>
                                  <div className="absolute -top-10 z-20 whitespace-nowrap bg-[#0F172A] border border-[#38BDF8] px-2.5 py-1 rounded-md shadow-xl text-[11px] font-mono font-semibold text-[#38BDF8] flex items-center gap-1.5 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                                    <span>{tooltipText}</span>
                                  </div>
                                  <div className="absolute top-0 bottom-0 w-[1px] bg-[#38BDF8]/30 pointer-events-none"></div>
                                </>
                              )}

                              <div
                                className={`w-full max-w-[44px] rounded-t transition-all duration-150 ${
                                  bar.active
                                    ? "bg-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                                    : "bg-[#1E293B] hover:bg-[#38BDF8]/80"
                                }`}
                                style={{
                                  height: `${Math.max(8, (bar.height / 220) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex pl-10 pt-2.5">
                    <div className="flex-1 grid grid-cols-7 px-2 sm:px-6 gap-2 sm:gap-6 text-center text-xs font-mono text-[#64748B] select-none">
                      {crChart.xLabels.map((label, idx) => (
                        <span
                          key={`${label}-${idx}`}
                          className={
                            idx === crChart.xLabels.length - 1
                              ? "text-[#38BDF8] font-bold"
                              : ""
                          }
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-60 items-center justify-center border border-dashed border-[#334155] bg-[#0f172a]/40 rounded-lg text-center px-4">
                  <div>
                    <div className="text-sm font-semibold text-[#F1F5F9] mb-1">
                      {branchKpisStatus === "stale"
                        ? "Stale Data"
                        : branchKpisStatus === "loading" ||
                            branchKpisStatus === "idle"
                          ? "Loading CR data..."
                          : branchKpisStatus === "empty" ||
                              crSummary.history.length === 0
                            ? "No data"
                            : branchKpisStatus === "error"
                              ? "Unable to load CR data"
                              : "No data"}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      {branchKpisStatus === "stale"
                        ? "Showing the last confirmed backend snapshot."
                        : branchKpisStatus === "loading" ||
                            branchKpisStatus === "idle"
                          ? "Fetching the latest CR measurements."
                          : branchKpisStatus === "empty" ||
                              crSummary.history.length === 0
                            ? "No CR history yet for this branch."
                            : branchKpisStatus === "error"
                              ? (branchKpisError ??
                                "No live CR values available.")
                              : "No CR history yet for this branch."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F172A] border border-[#1E293B]">
                <span className="material-symbols-outlined text-[14px] text-[#38BDF8]">
                  info
                </span>
                <span>
                  {crSummary.hasSufficientHistory
                    ? crSummary.trendLabel
                    : "Not enough data to calculate a trend"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1E293B] inline-block"></span>
                  Historical Days
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8] inline-block"></span>
                  {crSummary.latestDate
                    ? `Latest ${new Date(crSummary.latestDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                    : "No recent measurement"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
