import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BranchKpiKey } from '../types';

export const AdminInputView: React.FC = () => {
  const { branchKpis, updateBranchKpi, recentUploads, addUploadRecord, currentUser, logout } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'import' | 'kpi'>('import');
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [showSaveBanner, setShowSaveBanner] = useState(true);

  // Ingestion File State
  const [stagedFileName, setStagedFileName] = useState('Picker_Performance_Week42_2024.xlsx');
  const [stagedFileSize, setStagedFileSize] = useState('2.4 MB');
  const [uploadProgress, setUploadProgress] = useState(85);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared KPI Date
  const [sharedKpiDate, setSharedKpiDate] = useState('2024-10-18');

  // Input Values for the 6 KPIs
  const [formValues, setFormValues] = useState<Record<BranchKpiKey, string>>({
    CR: '3.25',
    PREP: '42.4',
    ORDER: '1420',
    ATVENDOR: '18.2',
    Adjust: '14',
    Dispatch: '8.65',
  });

  const [savedStatuses, setSavedStatuses] = useState<Record<BranchKpiKey, boolean>>({
    CR: true,
    PREP: false,
    ORDER: false,
    ATVENDOR: false,
    Adjust: false,
    Dispatch: false,
  });

  const handleKpiValueChange = (key: BranchKpiKey, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    setSavedStatuses((prev) => ({ ...prev, [key]: false }));
  };

  const handleSaveKpi = (key: BranchKpiKey) => {
    const val = formValues[key];
    updateBranchKpi(key, val, sharedKpiDate);
    setSavedStatuses((prev) => ({ ...prev, [key]: true }));
    setShowSaveBanner(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStagedFileName(file.name);
      setStagedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setStagedFileName(file.name);
      setStagedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setUploadProgress(0);
    }
  };

  const handleExecuteUpload = () => {
    if (!stagedFileName) return;
    setIsUploading(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setUploadProgress(Math.min(100, current));
      if (current >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        addUploadRecord(stagedFileName, stagedFileSize, 1280);
      }
    }, 200);
  };

  const handleExportAuditLog = () => {
    const logData = recentUploads.map((u) => `${u.timestamp} | ${u.fileName} | ${u.size} | ${u.status}`).join('\n');
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120]">
      {/* Desktop Top Header Bar */}
      <header className="h-16 bg-[#0E1626]/90 backdrop-blur border-b border-[#1E2D44] flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#64748B] text-sm font-medium">Warehouse Ops</span>
          <span className="text-[#283953] text-sm">/</span>
          <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>Admin / Input</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
              Active Node: ELMONTAZA_DS-68
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#151F32] border border-[#1E2D44] text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]"></span>
            </span>
            <span className="text-[#94A3B8] font-medium">
              Hub Live: <span className="text-[#F1F5F9] font-semibold">1,280 Shifts Parsed</span>
            </span>
          </div>

          <div className="h-5 w-px bg-[#1E2D44]"></div>

          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#151F32] border border-transparent hover:border-[#1E2D44] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#38BDF8] rounded-full ring-2 ring-[#0B1120]"></span>
          </button>

          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-[#1B2940] border border-[#283953] flex items-center justify-center font-bold text-xs text-[#38BDF8]">
              {currentUser ? currentUser.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {currentUser ? currentUser.displayName : 'Ops Admin'}
              </div>
              <div className="text-[10px] text-[#64748B]">{currentUser ? currentUser.role : 'Floor Supervisor'}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="ml-2 rounded-lg border border-[#1E2D44] bg-[#151F32] px-2.5 py-1.5 text-[10px] font-medium text-[#E2E8F0] transition hover:border-[#38BDF8]/30 hover:text-[#38BDF8]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scroll">
        <div className="max-w-[1600px] mx-auto space-y-6 pb-20 lg:pb-8">
          {/* Header Content Banner & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#1E2D44]">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">System Controls & Data Ingestion</h2>
              <p className="text-sm text-[#94A3B8] mt-1 max-w-3xl">
                Floor scanner ledger ingestion, roster performance metrics batch parser, and branch operational KPI manual overrides.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-[#151F32] px-3 py-1.5 rounded-lg border border-[#1E2D44] text-[#64748B]">
              <span className="material-symbols-outlined text-[16px] text-[#22C55E]">verified_user</span>
              <span>Role Authorized: Lead Station Controller</span>
            </div>
          </div>

          {/* Clean Tab Bar */}
          <div className="flex items-center justify-between border-b border-[#1E2D44]">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubTab('import')}
                className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-lg transition-all duration-150 cursor-pointer ${
                  activeSubTab === 'import'
                    ? 'border-b-2 border-[#38BDF8] text-[#38BDF8] bg-[#151F32]/40'
                    : 'border-b-2 border-transparent text-[#94A3B8] hover:text-white hover:bg-[#151F32]/20 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">upload_file</span>
                <span>Picker Performance Import</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#38BDF8]/15 text-[#38BDF8] font-mono">
                  Ready
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('kpi')}
                className={`flex items-center gap-2.5 px-5 py-3 text-sm font-medium rounded-t-lg transition-all duration-150 cursor-pointer ${
                  activeSubTab === 'kpi'
                    ? 'border-b-2 border-[#38BDF8] text-[#38BDF8] bg-[#151F32]/40 font-semibold'
                    : 'border-b-2 border-transparent text-[#94A3B8] hover:text-white hover:bg-[#151F32]/20'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">fact_check</span>
                <span>Branch KPI Input</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#1B2940] text-[#64748B] font-mono">
                  6 KPIs
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] pb-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span>Pipe Status: Ingestion Ready (Port 442)</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB A: PICKER PERFORMANCE IMPORT                               */}
          {/* ============================================================== */}
          {activeSubTab === 'import' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Success Banner */}
              {showSuccessBanner && (
                <div className="bg-[#151F32] border border-[#22C55E]/30 rounded-xl p-4 flex items-start justify-between relative overflow-hidden shadow-lg shadow-black/20">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22C55E]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0 border border-[#22C55E]/20">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white font-mono">
                          Picker_Performance_Week42_2024.xlsx
                        </h4>
                        <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wide">
                          Committed
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                        Ingested <span className="text-white font-medium">1,280 shift performance logs</span>. Telemetry parsed, deduplicated, and dispatched to real-time picker velocity leaderboards.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessBanner(false)}
                    aria-label="Dismiss banner"
                    className="text-[#64748B] hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {/* Layout: 7 Cols Upload / 5 Cols Recent */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Panel: Excel Upload Area */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-[#1E2D44]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                          <span className="material-symbols-outlined text-[18px]">table_view</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">Data Sheet Ingestion</h3>
                          <p className="text-xs text-[#94A3B8]">Import scanner shifts & terminal dumps</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#1B2940] text-[#38BDF8] border border-[#283953] font-mono">
                          Target: ELMONTAZA_DS-68
                        </span>
                      </div>
                    </div>

                    {/* Drag-and-drop & File Browser Upload Zone */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-5 border-2 border-dashed border-[#283953] hover:border-[#38BDF8]/70 rounded-xl p-7 transition-all duration-200 bg-[#0B1120]/50 flex flex-col items-center justify-center text-center cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#1B2940] border border-[#1E2D44] group-hover:border-[#38BDF8] group-hover:scale-105 flex items-center justify-center mb-3 transition-all text-[#38BDF8] shadow-inner">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        Drag & drop Excel file (.xlsx, .xls) or browse
                      </h4>
                      <p className="text-xs text-[#94A3B8] mb-4 max-w-sm">
                        Drop operational ledger from scanner base stations or terminal dumps.
                      </p>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-white border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        Browse Machine Files
                      </button>
                      <div className="mt-4 pt-3 border-t border-[#1E2D44]/70 w-full max-w-xs flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="material-symbols-outlined text-[15px] text-[#64748B]">info</span>
                        <span>Supported formats: .xlsx, .xls (Max: 25MB)</span>
                      </div>
                    </div>

                    {/* Selected File Details Card */}
                    {stagedFileName && (
                      <div className="mt-5 p-4 bg-[#1B2940] rounded-xl border border-[#1E2D44] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0">
                              <span className="material-symbols-outlined text-[22px]">description</span>
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-white truncate font-mono">{stagedFileName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                                <span className="font-medium">{stagedFileSize}</span>
                                <span className="text-[#283953]">•</span>
                                <span className="text-[#38BDF8] font-medium">Ready for parser execution</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStagedFileName('');
                              setUploadProgress(0);
                            }}
                            className="text-[#64748B] hover:text-[#F87171] p-2 rounded-lg hover:bg-[#151F32] transition-colors cursor-pointer"
                            title="Clear staged file"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[#38BDF8] font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
                              {uploadProgress}% Uploading...
                            </span>
                            <span className="tabular-nums font-mono text-[#94A3B8] text-xs">
                              {((uploadProgress / 100) * 2.4).toFixed(2)} MB / {stagedFileSize}
                            </span>
                          </div>
                          <div className="w-full bg-[#151F32] rounded-full h-2 overflow-hidden border border-[#1E2D44]">
                            <div
                              className="bg-[#38BDF8] h-2 rounded-full transition-all duration-300 shadow-sm shadow-[#38BDF8]/50"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="mt-6 pt-4 border-t border-[#1E2D44] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <span className="material-symbols-outlined text-[16px] text-[#22C55E]">lock</span>
                        <span>MD5 Hash check enabled before commit</span>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setStagedFileName('');
                            setUploadProgress(0);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#94A3B8] hover:text-white border border-[#283953] text-xs font-semibold transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          disabled={isUploading || !stagedFileName}
                          onClick={handleExecuteUpload}
                          className="px-6 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-[#0B1120] font-bold text-xs shadow-md shadow-[#38BDF8]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                          <span>{isUploading ? 'Ingesting...' : 'Upload'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline File Validation Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#151F32] border border-[#1E2D44] p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">rule</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Schema Matching</div>
                        <div className="text-[11px] text-[#64748B]">Columns A:H verified</div>
                      </div>
                    </div>
                    <div className="bg-[#151F32] border border-[#1E2D44] p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Deduplication</div>
                        <div className="text-[11px] text-[#64748B]">Picks indexed by UUID</div>
                      </div>
                    </div>
                    <div className="bg-[#151F32] border border-[#1E2D44] p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Auto Aggregation</div>
                        <div className="text-[11px] text-[#64748B]">Hourly PPH calculated</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Recent Successful Uploads Side Panel */}
                <div className="lg:col-span-5 bg-[#151F32] border border-[#1E2D44] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2D44]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#22C55E] text-[20px]">history</span>
                        <div>
                          <h3 className="text-sm font-bold text-white">Recent Successful Uploads</h3>
                          <p className="text-[11px] text-[#94A3B8]">Showing latest shift batch uploads</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B2940] text-[#64748B] border border-[#283953]">
                        Audit Log
                      </span>
                    </div>

                    <div className="divide-y divide-[#1E2D44] mt-1">
                      {recentUploads.map((upload) => (
                        <div key={upload.id} className="py-3 flex items-center justify-between gap-3 group">
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-medium text-white truncate group-hover:text-[#38BDF8] transition-colors">
                              {upload.fileName}
                            </p>
                            <p className="text-[11px] text-[#64748B] tabular-nums mt-0.5">
                              {upload.timestamp} • {upload.size}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                            Success
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-[#1B2940]/40 border border-[#1E2D44]/60 text-center">
                      <div className="flex items-center justify-center gap-2 text-[#64748B] text-xs">
                        <span className="material-symbols-outlined text-[16px]">folder_off</span>
                        <span>Archived batches older than 30 days stored in Cold Tier</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-[#1E2D44] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Showing {recentUploads.length} audit rows</span>
                    <button
                      onClick={handleExportAuditLog}
                      className="text-[#38BDF8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Export Audit Log</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB B: BRANCH KPI INPUT                                        */}
          {/* ============================================================== */}
          {activeSubTab === 'kpi' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Save Feedback Banner */}
              {showSaveBanner && (
                <div className="bg-[#151F32] border border-[#38BDF8]/40 rounded-xl p-4 flex items-start justify-between relative overflow-hidden shadow-lg shadow-black/20">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#38BDF8]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#38BDF8]/25">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        save
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          CR value saved successfully for {sharedKpiDate}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          Committed
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                        Atomic update committed. Other forms (PREP, ORDER, ATVENDOR, Adjust, Dispatch) and selected KPI Date were preserved in buffer state.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSaveBanner(false)}
                    aria-label="Dismiss banner"
                    className="text-[#64748B] hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {/* Global Header Bar: Fixed Branch & Shared Date Field */}
              <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#1B2940] border border-[#283953] flex items-center justify-center text-[#38BDF8]">
                    <span className="material-symbols-outlined text-2xl">warehouse</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase block">
                      Operational Target Facility
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base font-bold font-mono text-white">Branch: ELMONTAZA_DS-68</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-semibold uppercase">
                        Fixed Context
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#1B2940] p-2.5 rounded-xl border border-[#283953]">
                  <label htmlFor="shared-kpi-date-input" className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2 pl-2">
                    <span className="material-symbols-outlined text-[#38BDF8] text-[18px]">calendar_today</span>
                    <span>Select KPI Date:</span>
                  </label>
                  <div className="relative">
                    <input
                      id="shared-kpi-date-input"
                      type="date"
                      required
                      value={sharedKpiDate}
                      onChange={(e) => setSharedKpiDate(e.target.value)}
                      className="bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white text-xs font-mono font-semibold rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#38BDF8] font-medium pr-2">
                    <span className="text-[#F87171]">*</span>
                    <span>Mandatory for saves</span>
                  </div>
                </div>
              </div>

              {/* Six Independent KPI Forms in EXACT order */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. CR Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        01 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Customer Return Index</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">CR</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Customer Return rate ratio recorded for daily shift batches.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formValues.CR}
                          onChange={(e) => handleKpiValueChange('CR', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-9 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.CR ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved 18 Oct
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('CR')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save CR
                    </button>
                  </div>
                </div>

                {/* 2. PREP Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        02 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Minutes Average</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">PREP</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Preparation cycle time elapsed per fulfilled batch tote.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={formValues.PREP}
                          onChange={(e) => handleKpiValueChange('PREP', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-9 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">m</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.PREP ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved {sharedKpiDate}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('PREP')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save PREP
                    </button>
                  </div>
                </div>

                {/* 3. ORDER Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        03 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Count Volume</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">ORDER</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Total line order volume fulfilled through warehouse sort lines.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={formValues.ORDER}
                          onChange={(e) => handleKpiValueChange('ORDER', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-9 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">qty</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.ORDER ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved {sharedKpiDate}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('ORDER')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save ORDER
                    </button>
                  </div>
                </div>

                {/* 4. ATVENDOR Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        04 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Hours Window</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">ATVENDOR</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Dock turnaround elapsed window for direct vendor deliveries.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={formValues.ATVENDOR}
                          onChange={(e) => handleKpiValueChange('ATVENDOR', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-9 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">hrs</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.ATVENDOR ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved {sharedKpiDate}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('ATVENDOR')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save ATVENDOR
                    </button>
                  </div>
                </div>

                {/* 5. Adjust Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        05 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Inventory Skew</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">Adjust</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Physical cycle audit adjustment discrepancies logged per cycle count.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={formValues.Adjust}
                          onChange={(e) => handleKpiValueChange('Adjust', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-12 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">units</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.Adjust ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved {sharedKpiDate}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('Adjust')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save Adjust
                    </button>
                  </div>
                </div>

                {/* 6. Dispatch Form */}
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                        06 / KPI
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium">Throughput Speed</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">Dispatch</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                      Loading bay velocity index calculated from picker handoff to transport trailer.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Numeric Input Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formValues.Dispatch}
                          onChange={(e) => handleKpiValueChange('Dispatch', e.target.value)}
                          className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-9 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">idx</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                    {savedStatuses.Dispatch ? (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        Saved {sharedKpiDate}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B] font-medium">Unsaved buffer</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveKpi('Dispatch')}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Save Dispatch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
