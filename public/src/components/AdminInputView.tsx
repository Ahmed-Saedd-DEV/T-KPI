import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { BranchKpiKey } from "../types";
import apiClient from "../api/client";
import SmartDatePicker from "./SmartDatePicker";
import {
  KPI_TO_BACKEND,
  buildCreateMetricPayload,
  buildPatchMetricPayload,
  canReviewEditTarget,
  classifyAdminMetricError,
  createEditConfirmationSnapshot,
  evaluateWriteRefreshOutcome,
  getBackendMetricValue,
  isLatestEditTargetRequest,
  type EditConfirmationSnapshot,
} from "../utils/adminMetricWrite";

const KPI_META = [
  {
    key: "CR" as const,
    num: "01",
    label: "Customer Return Index",
    desc: "Customer Return rate ratio recorded for daily shift batches.",
    unit: "%",
    step: "0.01",
  },
  {
    key: "PREP" as const,
    num: "02",
    label: "Minutes Average",
    desc: "Preparation cycle time elapsed per fulfilled batch tote.",
    unit: "m",
    step: "0.1",
  },
  {
    key: "ORDER" as const,
    num: "03",
    label: "Count Volume",
    desc: "Total line order volume fulfilled through warehouse sort lines.",
    unit: "qty",
    step: "1",
  },
  {
    key: "ATVENDOR" as const,
    num: "04",
    label: "Hours Window",
    desc: "Dock turnaround elapsed window for direct vendor deliveries.",
    unit: "hrs",
    step: "0.1",
  },
  {
    key: "Adjust" as const,
    num: "05",
    label: "Inventory Skew",
    desc: "Physical cycle audit adjustment discrepancies logged per cycle count.",
    unit: "units",
    step: "1",
  },
  {
    key: "Dispatch" as const,
    num: "06",
    label: "Throughput Speed",
    desc: "Loading bay velocity index calculated from picker handoff to transport trailer.",
    unit: "idx",
    step: "0.01",
  },
] as const;

type AdminInputMode = "create" | "edit";

export const AdminInputView: React.FC = () => {
  const {
    branchKpis,
    recentUploads,
    addUploadRecord,
    currentUser,
    logout,
    fetchMetrics,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"import" | "kpi">("import");
  const [adminInputMode, setAdminInputMode] =
    useState<AdminInputMode>("create");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [lastSavedKpi, setLastSavedKpi] = useState<BranchKpiKey | null>(null);

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedFileName, setStagedFileName] = useState("");
  const [stagedFileSize, setStagedFileSize] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sharedKpiDate, setSharedKpiDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [formValues, setFormValues] = useState<Record<BranchKpiKey, string>>({
    CR: "",
    PREP: "",
    ORDER: "",
    ATVENDOR: "",
    Adjust: "",
    Dispatch: "",
  });

  const [savedStatuses, setSavedStatuses] = useState<
    Record<BranchKpiKey, boolean>
  >({
    CR: false,
    PREP: false,
    ORDER: false,
    ATVENDOR: false,
    Adjust: false,
    Dispatch: false,
  });

  const [savingKey, setSavingKey] = useState<BranchKpiKey | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  const [editDate, setEditDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [editAvailableDates, setEditAvailableDates] = useState<string[]>([]);
  const [editDatesLoading, setEditDatesLoading] = useState(false);
  const [editDatesError, setEditDatesError] = useState<string | null>(null);
  const [editDatesInfo, setEditDatesInfo] = useState<string | null>(null);
  const [editKpiKey, setEditKpiKey] = useState<BranchKpiKey>("CR");
  const [editCurrentValue, setEditCurrentValue] = useState<string>("—");
  const [editProposedValue, setEditProposedValue] = useState("");
  const [editStatusError, setEditStatusError] = useState<string | null>(null);
  const [editTargetLoading, setEditTargetLoading] = useState(false);
  const [editConfirmation, setEditConfirmation] =
    useState<EditConfirmationSnapshot | null>(null);
  const [editConfirmVisible, setEditConfirmVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const activeSubmitRef = useRef(0);
  const editTargetRequestRef = useRef(0);
  const editDatesRequestRef = useRef(0);

  const invalidateEditConfirmation = () => {
    setEditConfirmVisible(false);
    setEditConfirmation(null);
    setEditStatusError(null);
  };

  const fetchAvailableEditDates = async () => {
    const requestId = ++editDatesRequestRef.current;
    setEditDatesLoading(true);
    setEditDatesError(null);
    setEditDatesInfo(null);

    try {
      const { data } = await apiClient.get<{ status: string; data: string[] }>(
        "/admin/metrics/daily/available-dates",
      );

      if (requestId !== editDatesRequestRef.current) {
        return;
      }

      const nextDates = Array.isArray(data?.data)
        ? data.data.filter(
            (value): value is string => typeof value === "string",
          )
        : [];
      setEditAvailableDates(nextDates);

      if (
        adminInputMode === "edit" &&
        editDate &&
        !nextDates.includes(editDate)
      ) {
        setEditDate("");
        setEditCurrentValue("—");
        setEditProposedValue("");
        setEditConfirmVisible(false);
        setEditConfirmation(null);
        setEditStatusError(null);
        setEditDatesInfo(
          "Selected date is no longer available. Choose another saved KPI date.",
        );
      }
    } catch (err: unknown) {
      if (requestId !== editDatesRequestRef.current) {
        return;
      }

      const classified = classifyAdminMetricError(err);
      setEditDatesError(
        classified.message || "Could not load available KPI dates.",
      );
    } finally {
      if (requestId === editDatesRequestRef.current) {
        setEditDatesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeSubTab === "kpi") {
      void fetchAvailableEditDates();
    }
  }, [activeSubTab, adminInputMode]);

  const handleKpiValueChange = (key: BranchKpiKey, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    setSavedStatuses((prev) => ({ ...prev, [key]: false }));
    setSaveErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleLoadEditTarget = async (
    nextDate = editDate,
    nextKey = editKpiKey,
  ) => {
    const requestId = ++editTargetRequestRef.current;

    setEditTargetLoading(true);
    setEditStatusError(null);
    setEditConfirmVisible(false);
    setEditConfirmation(null);
    setEditCurrentValue("Loading...");
    setEditProposedValue("");

    try {
      const { data } = await apiClient.get(
        `/admin/metrics/daily/${encodeURIComponent(nextDate)}`,
      );

      if (
        !isLatestEditTargetRequest(
          requestId,
          editTargetRequestRef.current,
          nextDate,
          nextDate,
          nextKey,
          nextKey,
        )
      ) {
        return;
      }

      const currentValue = getBackendMetricValue(data, nextKey);

      setEditCurrentValue(
        currentValue === null ? "No value logged" : String(currentValue),
      );
      setEditProposedValue(currentValue === null ? "" : String(currentValue));
    } catch (err: unknown) {
      if (
        !isLatestEditTargetRequest(
          requestId,
          editTargetRequestRef.current,
          nextDate,
          nextDate,
          nextKey,
          nextKey,
        )
      ) {
        return;
      }

      const classified = classifyAdminMetricError(err);
      setEditCurrentValue("Missing");
      setEditProposedValue("");
      setEditStatusError(
        classified.kind === "missing"
          ? `No metric record exists for ${nextDate}. Switch to Create Mode to add it.`
          : classified.message,
      );
    } finally {
      if (requestId === editTargetRequestRef.current) {
        setEditTargetLoading(false);
      }
    }
  };

  const processWriteRefresh = async (
    saveSucceeded: boolean,
    refreshSucceeded: boolean,
  ) => {
    const outcome = evaluateWriteRefreshOutcome(
      saveSucceeded,
      refreshSucceeded,
    );

    if (outcome.mode === "confirmed") {
      setShowSaveBanner(true);
      setLastSavedKpi(editKpiKey);
      return true;
    }

    if (outcome.mode === "stale") {
      setEditStatusError(outcome.message);
      setSaveErrors((prev) => ({ ...prev, [editKpiKey]: outcome.message }));
      setShowSaveBanner(false);
      return false;
    }

    setShowSaveBanner(false);
    return false;
  };

  const handleSaveKpi = async (key: BranchKpiKey) => {
    if (!formValues[key] || !sharedKpiDate) return;
    if (savingKey === key) return;

    const requestId = ++activeSubmitRef.current;
    setSavingKey(key);
    setSaveErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      await apiClient.post(
        "/admin/metrics/daily",
        buildCreateMetricPayload(sharedKpiDate, key, formValues[key]),
      );

      if (requestId !== activeSubmitRef.current) {
        return;
      }

      const refreshResult = await fetchMetrics();
      const outcome = evaluateWriteRefreshOutcome(true, refreshResult.success);

      if (outcome.mode === "confirmed") {
        setSavedStatuses((prev) => ({ ...prev, [key]: true }));
        setLastSavedKpi(key);
        setShowSaveBanner(true);
        setSaveErrors((prev) => ({ ...prev, [key]: "" }));
        void fetchAvailableEditDates();
      } else {
        setSavedStatuses((prev) => ({ ...prev, [key]: false }));
        setSaveErrors((prev) => ({ ...prev, [key]: outcome.message }));
        setShowSaveBanner(false);
      }
    } catch (err: unknown) {
      const classified = classifyAdminMetricError(err);
      setSavedStatuses((prev) => ({ ...prev, [key]: false }));
      setSaveErrors((prev) => ({
        ...prev,
        [key]:
          classified.kind === "conflict"
            ? `This date already has a value for ${key}. Switch to Edit Mode to update it.`
            : classified.message,
      }));
      setShowSaveBanner(false);
    } finally {
      if (requestId === activeSubmitRef.current) {
        setSavingKey(null);
      }
    }
  };

  const handleConfirmEdit = async () => {
    const snapshot =
      editConfirmation ??
      createEditConfirmationSnapshot(
        editDate,
        editKpiKey,
        editCurrentValue,
        editProposedValue,
      );

    if (
      !snapshot ||
      !canReviewEditTarget(
        editTargetLoading,
        editDate,
        editKpiKey,
        editProposedValue,
      )
    ) {
      setEditStatusError(
        editTargetLoading
          ? "Please wait for the selected target to finish loading before confirming."
          : "Enter a new value before confirming the update.",
      );
      return;
    }

    if (editSaving) return;

    const requestId = ++activeSubmitRef.current;
    setEditSaving(true);
    setEditStatusError(null);

    try {
      await apiClient.patch(
        `/admin/metrics/daily/${encodeURIComponent(snapshot.date)}`,
        buildPatchMetricPayload(
          snapshot.date,
          snapshot.key,
          snapshot.proposedValue,
        ),
      );

      if (requestId !== activeSubmitRef.current) {
        return;
      }

      const refreshResult = await fetchMetrics();
      const outcome = evaluateWriteRefreshOutcome(true, refreshResult.success);

      if (outcome.mode === "confirmed") {
        setEditCurrentValue(String(snapshot.proposedValue));
        setEditConfirmVisible(false);
        setEditConfirmation(null);
        setShowSaveBanner(true);
        setLastSavedKpi(snapshot.key);
        void fetchAvailableEditDates();
      } else {
        setEditStatusError(outcome.message);
        setEditConfirmVisible(false);
        setEditConfirmation(null);
        setShowSaveBanner(false);
      }
    } catch (err: unknown) {
      const classified = classifyAdminMetricError(err);
      setEditStatusError(classified.message);
      setEditConfirmVisible(false);
      setEditConfirmation(null);
      setShowSaveBanner(false);
    } finally {
      if (requestId === activeSubmitRef.current) {
        setEditSaving(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStagedFile(file);
      setStagedFileName(file.name);
      setStagedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setUploadProgress(0);
      setUploadError(null);
      setShowSuccessBanner(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setStagedFile(file);
      setStagedFileName(file.name);
      setStagedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setUploadProgress(0);
      setUploadError(null);
      setShowSuccessBanner(false);
    }
  };

  const handleExecuteUpload = async () => {
    if (!stagedFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", stagedFile);
    try {
      setUploadProgress(40);
      const { data } = await apiClient.post(
        "/admin/import/employees",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total)
              setUploadProgress(Math.round((e.loaded / e.total) * 60) + 20);
          },
        },
      );
      setUploadProgress(100);
      const count: number = data.imported ?? data.count ?? data.total ?? 0;
      addUploadRecord(stagedFileName, stagedFileSize, count);
      setShowSuccessBanner(true);
      setStagedFile(null);
      setStagedFileName("");
      setStagedFileSize("");
      setUploadProgress(0);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Upload failed. Check the file and try again.";
      setUploadError(msg);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportAuditLog = () => {
    const logData = recentUploads
      .map((u) => `${u.timestamp} | ${u.fileName} | ${u.size} | ${u.status}`)
      .join("\n");
    const blob = new Blob([logData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Audit_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120]">
      {/* Header */}
      <header className="h-16 bg-[#0E1626]/90 backdrop-blur border-b border-[#1E2D44] flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#64748B] text-sm font-medium">
            Warehouse Ops
          </span>
          <span className="text-[#283953] text-sm">/</span>
          <h1 className="text-base font-bold text-white tracking-wide">
            Admin / Input
          </h1>
        </div>
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#1B2940] border border-[#283953] flex items-center justify-center font-bold text-xs text-[#38BDF8]">
            {currentUser
              ? currentUser.displayName.slice(0, 2).toUpperCase()
              : "AD"}
          </div>
          <div className="text-left hidden xl:block">
            <div className="text-xs font-semibold text-white leading-tight">
              {currentUser ? currentUser.displayName : "Ops Admin"}
            </div>
            <div className="text-[10px] text-[#64748B]">
              {currentUser ? currentUser.role : "ADMIN"}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="ml-2 rounded-lg border border-[#1E2D44] bg-[#151F32] px-2.5 py-1.5 text-[10px] font-medium text-[#E2E8F0] transition hover:border-[#38BDF8]/30 hover:text-[#38BDF8]"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scroll">
        <div className="max-w-[1600px] mx-auto space-y-6 pb-20 lg:pb-8">
          <div className="pb-2 border-b border-[#1E2D44]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              System Controls & Data Ingestion
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1 max-w-3xl">
              Floor scanner ledger ingestion, roster performance metrics batch
              parser, and branch operational KPI manual overrides.
            </p>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-[#1E2D44]">
            <button
              onClick={() => setActiveSubTab("import")}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-lg transition-all duration-150 cursor-pointer ${
                activeSubTab === "import"
                  ? "border-b-2 border-[#38BDF8] text-[#38BDF8] bg-[#151F32]/40"
                  : "border-b-2 border-transparent text-[#94A3B8] hover:text-white hover:bg-[#151F32]/20"
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                upload_file
              </span>
              <span>Picker Performance Import</span>
            </button>
            <button
              onClick={() => setActiveSubTab("kpi")}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-lg transition-all duration-150 cursor-pointer ${
                activeSubTab === "kpi"
                  ? "border-b-2 border-[#38BDF8] text-[#38BDF8] bg-[#151F32]/40"
                  : "border-b-2 border-transparent text-[#94A3B8] hover:text-white hover:bg-[#151F32]/20"
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                fact_check
              </span>
              <span>Branch KPI Input</span>
            </button>
          </div>

          {/* TAB A: IMPORT */}
          {activeSubTab === "import" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {showSuccessBanner && (
                <div className="bg-[#151F32] border border-[#22C55E]/30 rounded-xl p-4 flex items-start justify-between relative overflow-hidden shadow-lg shadow-black/20">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22C55E]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0 border border-[#22C55E]/20">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload Successful
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Employee data imported and synced to the dashboard.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessBanner(false)}
                    className="text-[#64748B] hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="bg-[#151F32] border border-[#F87171]/30 rounded-xl p-4 flex items-start justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F87171]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#F87171]/10 text-[#F87171] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        error
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload Failed
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {uploadError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadError(null)}
                    className="text-[#64748B] hover:text-white p-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E2D44]">
                      <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                        <span className="material-symbols-outlined text-[18px]">
                          table_view
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Data Sheet Ingestion
                        </h3>
                        <p className="text-xs text-[#94A3B8]">
                          Import scanner shifts & terminal dumps
                        </p>
                      </div>
                    </div>

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
                        <span className="material-symbols-outlined text-3xl">
                          upload_file
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        Drag & drop Excel file (.xlsx) or browse
                      </h4>
                      <p className="text-xs text-[#94A3B8] mb-4 max-w-sm">
                        Drop operational ledger from scanner base stations or
                        terminal dumps.
                      </p>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-white border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        Browse Files
                      </button>
                      <div className="mt-4 pt-3 border-t border-[#1E2D44]/70 w-full max-w-xs flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="material-symbols-outlined text-[15px]">
                          info
                        </span>
                        <span>Supported: .xlsx only (Max: 10MB)</span>
                      </div>
                    </div>

                    {stagedFileName && (
                      <div className="mt-5 p-4 bg-[#1B2940] rounded-xl border border-[#1E2D44] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0">
                              <span className="material-symbols-outlined text-[22px]">
                                description
                              </span>
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-white truncate font-mono">
                                {stagedFileName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                                <span className="font-medium">
                                  {stagedFileSize}
                                </span>
                                <span className="text-[#283953]">•</span>
                                <span className="text-[#38BDF8] font-medium">
                                  Ready for upload
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStagedFile(null);
                              setStagedFileName("");
                              setUploadProgress(0);
                            }}
                            className="text-[#64748B] hover:text-[#F87171] p-2 rounded-lg hover:bg-[#151F32] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                        {uploadProgress > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-[#38BDF8] font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
                                {uploadProgress}%{" "}
                                {isUploading ? "Uploading..." : "Done"}
                              </span>
                            </div>
                            <div className="w-full bg-[#151F32] rounded-full h-2 overflow-hidden border border-[#1E2D44]">
                              <div
                                className="bg-[#38BDF8] h-2 rounded-full transition-all duration-300 shadow-sm shadow-[#38BDF8]/50"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[#1E2D44] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <span className="material-symbols-outlined text-[16px] text-[#22C55E]">
                          lock
                        </span>
                        <span>Only .xlsx files accepted</span>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setStagedFile(null);
                            setStagedFileName("");
                            setUploadProgress(0);
                            setUploadError(null);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#94A3B8] hover:text-white border border-[#283953] text-xs font-semibold transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          disabled={isUploading || !stagedFile}
                          onClick={handleExecuteUpload}
                          className="px-6 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-[#0B1120] font-bold text-xs shadow-md shadow-[#38BDF8]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            cloud_upload
                          </span>
                          <span>{isUploading ? "Uploading..." : "Upload"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#151F32] border border-[#1E2D44] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2D44]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#22C55E] text-[20px]">
                          history
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Recent Uploads
                          </h3>
                          <p className="text-[11px] text-[#94A3B8]">
                            Showing latest shift batch uploads
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-[#1E2D44] mt-1">
                      {recentUploads.length === 0 ? (
                        <p className="text-xs text-[#64748B] py-6 text-center">
                          No uploads yet.
                        </p>
                      ) : (
                        recentUploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="py-3 flex items-center justify-between gap-3 group"
                          >
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
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-4 mt-6 border-t border-[#1E2D44] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>{recentUploads.length} uploads</span>
                    <button
                      onClick={handleExportAuditLog}
                      className="text-[#38BDF8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Export Log</span>
                      <span className="material-symbols-outlined text-[14px]">
                        open_in_new
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: KPI INPUT */}
          {activeSubTab === "kpi" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {showSaveBanner && lastSavedKpi && (
                <div className="bg-[#151F32] border border-[#38BDF8]/40 rounded-xl p-4 flex items-start justify-between relative overflow-hidden shadow-lg shadow-black/20">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#38BDF8]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#38BDF8]/25">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        save
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lastSavedKpi} saved for{" "}
                        {adminInputMode === "create" ? sharedKpiDate : editDate}
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Metric committed to backend and the dashboard refresh
                        confirmed its persisted value.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSaveBanner(false)}
                    className="text-[#64748B] hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              {editDatesError && (
                <div className="bg-[#151F32] border border-[#F87171]/35 rounded-xl p-4 flex items-start justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F87171]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#F87171]/10 text-[#F87171] flex items-center justify-center shrink-0 border border-[#F87171]/25">
                      <span className="material-symbols-outlined text-[20px]">
                        error
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Saved KPI dates unavailable
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {editDatesError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditDatesError(null)}
                    className="text-[#64748B] hover:text-white p-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              {editDatesInfo && (
                <div className="bg-[#151F32] border border-[#38BDF8]/35 rounded-xl p-4 flex items-start justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#38BDF8]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#38BDF8]/25">
                      <span className="material-symbols-outlined text-[20px]">
                        info
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Date selection updated
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {editDatesInfo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditDatesInfo(null)}
                    className="text-[#64748B] hover:text-white p-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              {editStatusError && (
                <div className="bg-[#151F32] border border-[#F87171]/35 rounded-xl p-4 flex items-start justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F87171]"></div>
                  <div className="flex items-start gap-3.5 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#F87171]/10 text-[#F87171] flex items-center justify-center shrink-0 border border-[#F87171]/25">
                      <span className="material-symbols-outlined text-[20px]">
                        error
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Save was not accepted
                      </h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {editStatusError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditStatusError(null)}
                    className="text-[#64748B] hover:text-white p-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              )}

              <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 bg-[#1B2940] p-2.5 rounded-xl border border-[#283953] w-fit">
                    <label
                      htmlFor="shared-kpi-date-input"
                      className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2 pl-2"
                    >
                      <span className="material-symbols-outlined text-[#38BDF8] text-[18px]">
                        calendar_today
                      </span>
                      <span>
                        {adminInputMode === "create"
                          ? "Create Date:"
                          : "Edit Date:"}
                      </span>
                    </label>
                    {adminInputMode === "create" ? (
                      <input
                        id="shared-kpi-date-input"
                        type="date"
                        required
                        value={sharedKpiDate}
                        onChange={(e) => setSharedKpiDate(e.target.value)}
                        className="bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white text-xs font-mono font-semibold rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer"
                      />
                    ) : (
                      <div className="min-w-[220px] max-w-[260px]">
                        <SmartDatePicker
                          availableDates={editAvailableDates}
                          selectedDate={editDate}
                          onChange={(nextDate) => {
                            setEditDatesInfo(null);
                            invalidateEditConfirmation();
                            setEditDate(nextDate);
                            void handleLoadEditTarget(nextDate, editKpiKey);
                          }}
                          disabled={editDatesLoading}
                          loading={editDatesLoading}
                          placeholder="Select saved KPI date"
                          emptyStateMessage="No saved KPI dates available"
                          ariaLabel="Select a saved KPI date"
                        />
                      </div>
                    )}
                  </div>

                  <div className="inline-flex rounded-lg border border-[#283953] bg-[#0B1120] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        editTargetRequestRef.current += 1;
                        setAdminInputMode("create");
                        invalidateEditConfirmation();
                        setEditTargetLoading(false);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${adminInputMode === "create" ? "bg-[#38BDF8] text-[#0B1120]" : "text-[#94A3B8] hover:text-white"}`}
                    >
                      Create Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        editTargetRequestRef.current += 1;
                        setAdminInputMode("edit");
                        invalidateEditConfirmation();
                        void handleLoadEditTarget(editDate, editKpiKey);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${adminInputMode === "edit" ? "bg-[#38BDF8] text-[#0B1120]" : "text-[#94A3B8] hover:text-white"}`}
                    >
                      Edit Mode
                    </button>
                  </div>
                </div>
              </div>

              {adminInputMode === "create" ? (
                <>
                  {KPI_META.map(({ key, num, label, desc, unit, step }) => (
                    <div
                      key={key}
                      className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 flex flex-col justify-between hover:border-[#283953] transition-all shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#1B2940] px-2.5 py-0.5 rounded border border-[#283953]">
                            {num} / KPI
                          </span>
                          <span className="text-[11px] text-[#64748B] font-medium">
                            {label}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white">{key}</h4>
                        <p className="text-xs text-[#94A3B8] mt-0.5 mb-4 leading-normal">
                          {desc}
                        </p>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                            Value
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step={step}
                              value={formValues[key]}
                              onChange={(e) =>
                                handleKpiValueChange(key, e.target.value)
                              }
                              placeholder="0"
                              className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-14 transition-all"
                            />
                            <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">
                              {unit}
                            </span>
                          </div>
                          {saveErrors[key] && (
                            <p className="text-xs text-[#F87171] mt-1">
                              {saveErrors[key]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 pt-3.5 border-t border-[#1E2D44] flex items-center justify-between">
                        {savedStatuses[key] ? (
                          <span className="text-xs text-[#22C55E] flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                            Saved {sharedKpiDate}
                          </span>
                        ) : (
                          <span className="text-xs text-[#64748B] font-medium">
                            Unsaved
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={
                            savingKey === key ||
                            !formValues[key] ||
                            !sharedKpiDate
                          }
                          onClick={() => handleSaveKpi(key)}
                          className="px-4 py-1.5 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {savingKey === key ? "Saving..." : `Save ${key}`}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-[#151F32] border border-[#1E2D44] rounded-xl p-5 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Select KPI
                      </label>
                      <select
                        value={editKpiKey}
                        onChange={(e) => {
                          const nextKey = e.target.value as BranchKpiKey;
                          setEditKpiKey(nextKey);
                          invalidateEditConfirmation();
                          void handleLoadEditTarget(editDate, nextKey);
                        }}
                        className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all"
                      >
                        {KPI_META.map(({ key, label }) => (
                          <option key={key} value={key}>
                            {key} — {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Current backend value
                      </label>
                      <div className="bg-[#0B1120] border border-[#283953] rounded-lg px-3 py-2 text-base font-bold font-mono text-white min-h-[44px] flex items-center">
                        {editTargetLoading ? "Loading..." : editCurrentValue}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                      Proposed new value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step={
                          KPI_META.find((meta) => meta.key === editKpiKey)
                            ?.step ?? "0.1"
                        }
                        value={editProposedValue}
                        onChange={(e) => {
                          setEditProposedValue(e.target.value);
                          setEditConfirmation(null);
                          setEditConfirmVisible(false);
                        }}
                        placeholder="Enter new value"
                        className="w-full bg-[#0B1120] border border-[#283953] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-white rounded-lg px-3 py-2 text-base font-bold font-mono tabular-nums outline-none pr-14 transition-all"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#64748B] font-mono">
                        {KPI_META.find((meta) => meta.key === editKpiKey)
                          ?.unit ?? ""}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#283953] bg-[#0B1120]/60 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                      Confirmation summary
                    </div>
                    <div className="space-y-2 text-sm text-[#E2E8F0]">
                      {(() => {
                        const summarySnapshot =
                          editConfirmation ??
                          createEditConfirmationSnapshot(
                            editDate,
                            editKpiKey,
                            editCurrentValue,
                            editProposedValue,
                          );

                        return (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#94A3B8]">Date</span>
                              <span className="font-mono font-semibold">
                                {summarySnapshot?.date ?? editDate}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#94A3B8]">KPI</span>
                              <span className="font-mono font-semibold">
                                {summarySnapshot?.key ?? editKpiKey}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#94A3B8]">
                                Current value
                              </span>
                              <span className="font-mono font-semibold">
                                {summarySnapshot?.currentValue ??
                                  editCurrentValue}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#94A3B8]">
                                Proposed value
                              </span>
                              <span className="font-mono font-semibold">
                                {summarySnapshot
                                  ? summarySnapshot.proposedValue || "—"
                                  : editProposedValue || "—"}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditConfirmVisible(false);
                        setEditConfirmation(null);
                        setEditStatusError(null);
                        setEditProposedValue(
                          editCurrentValue === "No value logged"
                            ? ""
                            : editCurrentValue,
                        );
                      }}
                      className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#94A3B8] hover:text-white border border-[#283953] text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    {!editConfirmVisible ? (
                      <button
                        type="button"
                        disabled={
                          editTargetLoading ||
                          !editDate ||
                          !editProposedValue ||
                          editSaving
                        }
                        onClick={() => {
                          if (editTargetLoading) {
                            setEditStatusError(
                              "Please wait for the selected target to finish loading before confirming.",
                            );
                            return;
                          }

                          const snapshot = createEditConfirmationSnapshot(
                            editDate,
                            editKpiKey,
                            editCurrentValue,
                            editProposedValue,
                          );

                          if (!snapshot) {
                            setEditStatusError(
                              "Enter a valid proposed value before reviewing the update.",
                            );
                            return;
                          }

                          setEditConfirmation(snapshot);
                          setEditConfirmVisible(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-[#1B2940] hover:bg-[#243552] text-[#38BDF8] border border-[#283953] hover:border-[#38BDF8]/50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Review update
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          editSaving || !editConfirmation || editTargetLoading
                        }
                        onClick={() => void handleConfirmEdit()}
                        className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-[#0B1120] font-bold text-xs shadow-md shadow-[#38BDF8]/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {editSaving ? "Updating..." : "Confirm update"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
