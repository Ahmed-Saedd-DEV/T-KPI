import React, { useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { BranchKpiKey } from "../types";
import { buildChartGeometry } from "../utils/chartGeometry";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const BranchKpisView: React.FC = () => {
  const {
    branchKpis,
    branchKpisStatus,
    branchKpisError,
    fetchMetrics,
    activeKpiKey,
    setActiveKpiKey,
  } = useApp();
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [chartTooltip, setChartTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const chartAreaRef = useRef<HTMLDivElement | null>(null);

  const currentCfg = branchKpis[activeKpiKey];
  const chartGeometry = useMemo(
    () => buildChartGeometry(currentCfg.historyData ?? [], currentCfg.unit),
    [currentCfg.historyData, currentCfg.unit],
  );
  const tooltipText = activeTooltip || currentCfg.latestTooltip;
  const hasLiveMeasurements =
    currentCfg.historyData !== undefined && currentCfg.historyData.length > 0;
  const latestMeasurementDate =
    currentCfg.historyData?.[currentCfg.historyData.length - 1]?.date ?? null;
  const shouldShowChartPlaceholder =
    branchKpisStatus === "idle" ||
    branchKpisStatus === "loading" ||
    branchKpisStatus === "empty" ||
    branchKpisStatus === "error" ||
    branchKpisStatus === "stale" ||
    !hasLiveMeasurements;

  const updateTooltipFromPointer = (
    clientX: number,
    clientY: number,
    label: string,
  ) => {
    const chartRect = chartAreaRef.current?.getBoundingClientRect();

    if (!chartRect) {
      setActiveTooltip(label);
      setChartTooltip({ text: label, x: 0, y: 0 });
      return;
    }

    const x = clamp(clientX - chartRect.left, 72, chartRect.width - 72);
    const y = clamp(clientY - chartRect.top, 24, chartRect.height - 24);

    setActiveTooltip(label);
    setChartTooltip({ text: label, x, y });
  };

  const clearChartTooltip = () => {
    setChartTooltip(null);
    setActiveTooltip(currentCfg.latestTooltip);
  };

  const handleSelectKpi = (key: BranchKpiKey) => {
    setActiveKpiKey(key);
    setActiveTooltip(branchKpis[key].latestTooltip);
    setChartTooltip(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Header Bar */}
      <header className="bg-[#0d1c2d] border-b border-[#1E293B] sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-[#F8FAFC] tracking-tight truncate">
              Branch KPIs — ELMONTAZA_DS-68
            </h1>
            <span className="hidden xl:inline text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/30 font-semibold uppercase">
              Station Feed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#94A3B8] bg-[#151F32] px-3 py-1.5 rounded-md border border-[#1E293B]">
            <span className="material-symbols-outlined text-sm text-[#38BDF8]">
              schedule
            </span>
            <span>
              Last Updated:{" "}
              {currentCfg.historyData && currentCfg.historyData.length > 0
                ? new Date(
                    currentCfg.historyData[currentCfg.historyData.length - 1]
                      .date,
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </header>

      {/* Content Workspace */}
      <main className="flex-1 px-4 md:px-8 py-6 w-full space-y-6 max-w-7xl mx-auto pb-20 lg:pb-8">
        {/* Error & Live Sync Notification Banner */}
        {(showErrorBanner ||
          branchKpisStatus === "error" ||
          branchKpisStatus === "stale") && (
          <div className="p-3.5 border rounded-lg flex items-center justify-between gap-4 animate-in fade-in bg-red-950/30 border-red-500/30">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-xl">
                warning
              </span>
              <span className="text-xs md:text-sm text-red-200 font-medium">
                {branchKpisError ??
                  "Failed to load real-time branch sync for external warehouse pods"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowErrorBanner(false);
                  void fetchMetrics();
                }}
                className="px-3 py-1 rounded bg-[#151F32] hover:bg-[#1E293B] text-xs font-semibold text-[#F8FAFC] border border-[#1E293B] transition-colors cursor-pointer"
              >
                {branchKpisStatus === "stale" ? "Retry" : "Try Again"}
              </button>
              <button
                onClick={() => setShowErrorBanner(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 cursor-pointer"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 6 KPI Cards in Exact Sequence: CR, PREP, ORDER, ATVENDOR, Adjust, Dispatch */}
        <section aria-label="Branch Key Performance Indicators">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(
              [
                "CR",
                "PREP",
                "ORDER",
                "ATVENDOR",
                "Adjust",
                "Dispatch",
              ] as BranchKpiKey[]
            ).map((kpiKey) => {
              const kpi = branchKpis[kpiKey];
              const isSelected = activeKpiKey === kpiKey;
              return (
                <button
                  key={kpiKey}
                  onClick={() => handleSelectKpi(kpiKey)}
                  className={`text-left p-4 rounded-lg bg-[#151F32] border transition-all duration-150 flex flex-col justify-between h-28 focus:outline-none cursor-pointer group ${
                    isSelected
                      ? "border-[#38BDF8] kpi-active-glow"
                      : "border-[#1E293B] hover:border-[#334155]"
                  }`}
                >
                  <div
                    className={`text-xs font-mono font-semibold tracking-wider uppercase transition-colors ${
                      isSelected
                        ? "text-[#38BDF8]"
                        : "text-[#94A3B8] group-hover:text-[#F8FAFC]"
                    }`}
                  >
                    {kpi.label}
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold font-mono text-[#F8FAFC]">
                    {kpi.currentValue}
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">
                    {kpi.historyData && kpi.historyData.length > 0
                      ? new Date(
                          kpi.historyData[kpi.historyData.length - 1].date,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Historical KPI Chart Section with Exact Chart Types */}
        <section className="bg-[#151F32] border border-[#1E293B] rounded-lg p-6 relative overflow-visible">
          {/* Controls Header */}
          <div className="flex flex-col gap-4 pb-5 border-b border-[#1E293B] mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
                  {currentCfg.title}
                </h2>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 shrink-0">
                  <span className="material-symbols-outlined text-sm">
                    {currentCfg.icon}
                  </span>
                  <span>{currentCfg.badge}</span>
                </span>

                {/* Live Hover/Tap Tooltip badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0d1c2d] border border-[#1E293B] text-xs font-mono text-[#38BDF8] shadow-inner max-w-full">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8] animate-ping shrink-0"></span>
                  <span className="truncate">{tooltipText}</span>
                </div>
              </div>
            </div>

            {/* Switcher Pills for all 6 KPIs */}
            <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
              {(
                [
                  "CR",
                  "PREP",
                  "ORDER",
                  "ATVENDOR",
                  "Adjust",
                  "Dispatch",
                ] as BranchKpiKey[]
              ).map((kpiKey) => {
                const kpi = branchKpis[kpiKey];
                const isSelected = activeKpiKey === kpiKey;
                const chartTypeLabel = kpi.type === "line" ? "Line" : "Bar";
                return (
                  <button
                    key={kpiKey}
                    onClick={() => handleSelectKpi(kpiKey)}
                    className={`inline-flex flex-1 min-w-[120px] max-w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#38BDF8] text-[#0B1120]"
                        : "bg-[#0d1c2d] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm shrink-0">
                      {kpi.icon}
                    </span>
                    <span className="truncate">
                      {kpi.label} ({chartTypeLabel})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Graphic Workspace */}
          <div
            ref={chartAreaRef}
            className="relative w-full h-80 lg:h-96 overflow-visible"
          >
            {shouldShowChartPlaceholder ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-dashed border-[#334155] bg-[#0d1c2d]/40 text-center px-4">
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC] mb-1">
                    {branchKpisStatus === "loading"
                      ? "Loading KPI data..."
                      : branchKpisStatus === "empty" ||
                          currentCfg.currentValue === "N/A"
                        ? "No data"
                        : branchKpisStatus === "error"
                          ? "Unable to load KPI data"
                          : branchKpisStatus === "stale"
                            ? "Stale Data"
                            : "No data"}
                  </div>
                  <div className="text-xs text-[#94A3B8]">
                    {branchKpisStatus === "loading"
                      ? "Fetching the latest branch measurements."
                      : branchKpisStatus === "stale"
                        ? "Showing the last confirmed backend snapshot."
                        : "Trend chart unavailable until live measurements are available."}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Y-Axis Labels */}
                <div className="absolute left-0 inset-y-0 w-14 flex flex-col justify-between text-[11px] font-mono text-[#64748B] pb-6 pt-2 select-none pointer-events-none text-right pr-2">
                  {currentCfg.yAxis.map((label, idx) => (
                    <span key={idx}>{label}</span>
                  ))}
                </div>

                {/* Dynamic SVG Chart Canvas */}
                <div className="ml-14 h-full flex flex-col justify-between">
                  <div className="relative flex-1 w-full overflow-visible">
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 700 240"
                    >
                      <defs>
                        <linearGradient
                          id="kpiChartGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#38BDF8"
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor="#38BDF8"
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                        <linearGradient
                          id="kpiBarGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#38BDF8"
                            stopOpacity="0.9"
                          />
                          <stop
                            offset="100%"
                            stopColor="#38BDF8"
                            stopOpacity="0.3"
                          />
                        </linearGradient>
                        <linearGradient
                          id="kpiBarActiveGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7dd3fc"
                            stopOpacity="1"
                          />
                          <stop
                            offset="100%"
                            stopColor="#38BDF8"
                            stopOpacity="0.6"
                          />
                        </linearGradient>
                        <linearGradient
                          id="kpiLineStroke"
                          x1="0"
                          x2="1"
                          y1="0"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#7DD3FC" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line
                        stroke="#1E293B"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        x1="0"
                        x2="700"
                        y1="10"
                        y2="10"
                      />
                      <line
                        stroke="#1E293B"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        x1="0"
                        x2="700"
                        y1="56"
                        y2="56"
                      />
                      <line
                        stroke="#1E293B"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        x1="0"
                        x2="700"
                        y1="102"
                        y2="102"
                      />
                      <line
                        stroke="#1E293B"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        x1="0"
                        x2="700"
                        y1="148"
                        y2="148"
                      />
                      <line
                        stroke="#1E293B"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        x1="0"
                        x2="700"
                        y1="194"
                        y2="194"
                      />
                      <line
                        stroke="#1E293B"
                        strokeWidth="1.5"
                        x1="0"
                        x2="700"
                        y1="239"
                        y2="239"
                      />

                      {/* Vertical Guide Lines */}
                      {[50, 150, 250, 350, 450, 550, 650].map((vx) => (
                        <line
                          key={vx}
                          stroke="#1E293B"
                          strokeOpacity="0.4"
                          strokeWidth="1"
                          x1={vx}
                          x2={vx}
                          y1="0"
                          y2="240"
                        />
                      ))}

                      {/* LINE CHART MODE */}
                      {currentCfg.type === "line" && (
                        <g>
                          {chartGeometry.fillPoints && (
                            <polygon
                              fill="url(#kpiChartGradient)"
                              points={chartGeometry.fillPoints}
                            />
                          )}
                          {chartGeometry.points && (
                            <polyline
                              fill="none"
                              points={chartGeometry.points}
                              stroke="url(#kpiLineStroke)"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                            />
                          )}
                          {chartGeometry.coords.map((pt, idx) => (
                            <circle
                              key={idx}
                              cx={pt.cx}
                              cy={pt.cy}
                              r={pt.active ? 6.5 : 5}
                              fill={pt.active ? "#38BDF8" : "#151F32"}
                              stroke={pt.active ? "#F8FAFC" : "#38BDF8"}
                              strokeWidth="2.5"
                              className="cursor-pointer"
                              tabIndex={0}
                              aria-label={pt.label}
                              onClick={(event) =>
                                updateTooltipFromPointer(
                                  event.clientX,
                                  event.clientY,
                                  pt.label,
                                )
                              }
                              onMouseEnter={(event) =>
                                updateTooltipFromPointer(
                                  event.clientX,
                                  event.clientY,
                                  pt.label,
                                )
                              }
                              onMouseLeave={clearChartTooltip}
                              onFocus={(event) => {
                                const rect =
                                  event.currentTarget.getBoundingClientRect();
                                updateTooltipFromPointer(
                                  rect.left + rect.width / 2,
                                  rect.top + rect.height / 2,
                                  pt.label,
                                );
                              }}
                              onBlur={clearChartTooltip}
                              onTouchStart={(event) => {
                                const touch =
                                  event.touches[0] ?? event.changedTouches[0];
                                if (touch) {
                                  updateTooltipFromPointer(
                                    touch.clientX,
                                    touch.clientY,
                                    pt.label,
                                  );
                                }
                              }}
                            />
                          ))}
                        </g>
                      )}

                      {/* BAR CHART MODE */}
                      {currentCfg.type === "bar" && (
                        <g>
                          {chartGeometry.bars.map((bar, idx) => (
                            <rect
                              key={idx}
                              x={bar.x}
                              y={bar.y}
                              width={bar.width}
                              height={bar.height}
                              rx="4"
                              ry="4"
                              fill={
                                bar.active
                                  ? "url(#kpiBarActiveGradient)"
                                  : "url(#kpiBarGradient)"
                              }
                              stroke={bar.active ? "#7dd3fc" : "#38BDF8"}
                              strokeWidth="1"
                              className="cursor-pointer"
                              tabIndex={0}
                              aria-label={bar.label}
                              onClick={(event) =>
                                updateTooltipFromPointer(
                                  event.clientX,
                                  event.clientY,
                                  bar.label,
                                )
                              }
                              onMouseEnter={(event) =>
                                updateTooltipFromPointer(
                                  event.clientX,
                                  event.clientY,
                                  bar.label,
                                )
                              }
                              onMouseLeave={clearChartTooltip}
                              onFocus={(event) => {
                                const rect =
                                  event.currentTarget.getBoundingClientRect();
                                updateTooltipFromPointer(
                                  rect.left + rect.width / 2,
                                  rect.top + rect.height / 2,
                                  bar.label,
                                );
                              }}
                              onBlur={clearChartTooltip}
                              onTouchStart={(event) => {
                                const touch =
                                  event.touches[0] ?? event.changedTouches[0];
                                if (touch) {
                                  updateTooltipFromPointer(
                                    touch.clientX,
                                    touch.clientY,
                                    bar.label,
                                  );
                                }
                              }}
                            />
                          ))}
                        </g>
                      )}
                    </svg>

                    {chartTooltip && (
                      <div
                        className="pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-[#38BDF8]/40 bg-[#0d1c2d]/95 px-2.5 py-1 text-[11px] font-mono text-[#F8FAFC] shadow-[0_12px_30px_rgba(15,23,42,0.8)]"
                        style={{
                          left: `${chartTooltip.x}px`,
                          top: `${chartTooltip.y}px`,
                          transform: "translate(-50%, -110%)",
                        }}
                      >
                        {chartTooltip.text}
                      </div>
                    )}
                  </div>

                  {/* X-Axis Labels — dynamic from historyData */}
                  <div className="flex justify-between text-[11px] font-mono text-[#64748B] pt-3 select-none border-t border-[#1E293B] px-4">
                    {(chartGeometry.xLabels.length > 0
                      ? chartGeometry.xLabels
                      : []
                    ).map((label, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <span
                          key={`${label}-${idx}`}
                          className={`text-center w-12 cursor-pointer hover:text-[#F8FAFC] ${isLast ? "font-bold text-[#38BDF8]" : ""}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Data Integrity Mandate Note */}
          <div className="mt-5 pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#64748B] font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#94A3B8]">
                info
              </span>
              <span>
                Demonstration data isolation note: No data fabricated; missing
                dates are preserved without artificial zeros.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              <span>Interval: 24h Aggregated Feed</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
