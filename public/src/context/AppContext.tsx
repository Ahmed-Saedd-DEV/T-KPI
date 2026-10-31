import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NavTab,
  Picker,
  BranchKpiKey,
  BranchKpiConfig,
  RecentUpload,
  PerformanceTier,
  BranchKpiStatus,
} from "../types";
import { INITIAL_BRANCH_KPIS, INITIAL_UPLOADS } from "../data/initialData";
import apiClient from "../api/client";
import {
  BranchMetricRecord,
  buildBranchKpiRuntimeSnapshot,
  buildNoDataBranchKpiSnapshot,
  extractBranchMetricRecords,
  transformBranchKpiRecords,
} from "../utils/branchKpiTransform";
import {
  getTier,
  getTierColor,
  getTierLabel,
  mapEmployeeToPicker,
  type BackendEmployee,
} from "../utils/pickerPresentation";

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: "success" | "error" | "info";
}

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthSession {
  token: string;
  expiresAt: number;
  user: AuthUser;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pickers: Picker[];
  pickersLoading: boolean;
  pickersError: string | null;
  fetchPickers: () => Promise<void>;
  fetchMetrics: () => Promise<{
    success: boolean;
    status: BranchKpiStatus;
    empty: boolean;
    stale: boolean;
    error?: string;
  }>;
  addPicker: (id: string, name: string) => { success: boolean; error?: string };
  removePicker: (id: string) => boolean;
  selectedTelemetryPicker: Picker | null;
  setSelectedTelemetryPicker: (picker: Picker | null) => void;
  isAddPickerOpen: boolean;
  setIsAddPickerOpen: (open: boolean) => void;
  isRemovePickerOpen: boolean;
  setIsRemovePickerOpen: (open: boolean) => void;
  branchKpis: Record<BranchKpiKey, BranchKpiConfig>;
  branchKpisStatus: BranchKpiStatus;
  branchKpisError: string | null;
  activeKpiKey: BranchKpiKey;
  setActiveKpiKey: (key: BranchKpiKey) => void;
  updateBranchKpi: (key: BranchKpiKey, value: string, date: string) => void;
  recentUploads: RecentUpload[];
  addUploadRecord: (
    fileName: string,
    size: string,
    shiftsCount: number,
  ) => void;
  toast: ToastMessage | null;
  showToast: (
    title: string,
    description: string,
    type?: "success" | "error" | "info",
  ) => void;
  dismissToast: () => void;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  authLoading: boolean;
  loginError: string | null;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearLoginError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const AUTH_SESSION_KEY = "picker-performance-dashboard-session";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const readStoredSession = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed: AuthSession = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [pickersLoading, setPickersLoading] = useState(false);
  const [pickersError, setPickersError] = useState<string | null>(null);
  const [selectedTelemetryPicker, setSelectedTelemetryPicker] =
    useState<Picker | null>(null);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [isRemovePickerOpen, setIsRemovePickerOpen] = useState(false);
  const [branchKpis, setBranchKpis] = useState<
    Record<BranchKpiKey, BranchKpiConfig>
  >(buildNoDataBranchKpiSnapshot(INITIAL_BRANCH_KPIS));
  const [branchKpisStatus, setBranchKpisStatus] =
    useState<BranchKpiStatus>("idle");
  const [branchKpisError, setBranchKpisError] = useState<string | null>(null);
  const [activeKpiKey, setActiveKpiKey] = useState<BranchKpiKey>("CR");
  const [recentUploads, setRecentUploads] =
    useState<RecentUpload[]>(INITIAL_UPLOADS);
  const latestBranchMetricRequestRef = useRef(0);
  const lastConfirmedBranchSnapshotRef = useRef<Record<
    BranchKpiKey,
    BranchKpiConfig
  > | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // ── Fetch pickers from backend ──
  const fetchPickers = async () => {
    setPickersLoading(true);
    setPickersError(null);
    try {
      const { data } = await apiClient.get<{ data: BackendEmployee[] }>(
        "/employees",
        {
          params: { limit: 100 },
        },
      );
      setPickers((data.data ?? []).map(mapEmployeeToPicker));
    } catch {
      setPickersError("Failed to load pickers. Retrying will restore data.");
    } finally {
      setPickersLoading(false);
    }
  };

  // ── Auth init ──
  useEffect(() => {
    const storedSession = readStoredSession();

    if (!storedSession) {
      setAuthLoading(false);
      return;
    }

    if (Date.now() >= storedSession.expiresAt) {
      clearStoredSession();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSessionExpired(true);
      setAuthLoading(false);
      return;
    }

    setCurrentUser(storedSession.user);
    setIsAuthenticated(true);
    setSessionExpired(false);
    setAuthLoading(false);

    const handleExpired = () => {
      clearStoredSession();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSessionExpired(true);
    };
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  // ── Fetch pickers once authenticated ──
  useEffect(() => {
    fetchPickers();
  }, []);

  // ── Fetch branch metrics from backend ──
  const fetchMetrics = async (): Promise<{
    success: boolean;
    status: BranchKpiStatus;
    empty: boolean;
    stale: boolean;
    error?: string;
  }> => {
    const requestId = ++latestBranchMetricRequestRef.current;
    setBranchKpisStatus("loading");
    setBranchKpisError(null);

    try {
      const { data } = await apiClient.get<unknown>("/admin/metrics/daily");

      const records = extractBranchMetricRecords(data);

      if (requestId !== latestBranchMetricRequestRef.current) {
        return {
          success: false,
          status: "stale",
          empty: false,
          stale: true,
          error: "Superseded by a newer branch KPI refresh.",
        };
      }

      if (records === null) {
        const message =
          "Malformed branch KPI response: expected a raw metric array.";
        if (lastConfirmedBranchSnapshotRef.current) {
          setBranchKpis(lastConfirmedBranchSnapshotRef.current);
          setBranchKpisStatus("stale");
          setBranchKpisError(
            "Stale data: showing the last confirmed backend snapshot.",
          );
          return {
            success: false,
            status: "stale",
            empty: false,
            stale: true,
            error: message,
          };
        }

        const noDataSnapshot =
          buildNoDataBranchKpiSnapshot(INITIAL_BRANCH_KPIS);
        setBranchKpis(noDataSnapshot);
        setBranchKpisStatus("error");
        setBranchKpisError(
          "Failed to load branch KPI data. Showing no live values.",
        );
        return {
          success: false,
          status: "error",
          empty: false,
          stale: false,
          error: message,
        };
      }

      const nextSnapshot = buildBranchKpiRuntimeSnapshot(
        INITIAL_BRANCH_KPIS,
        transformBranchKpiRecords(records),
      );

      if (records.length === 0) {
        const noDataSnapshot =
          buildNoDataBranchKpiSnapshot(INITIAL_BRANCH_KPIS);
        setBranchKpis(noDataSnapshot);
        setBranchKpisStatus("empty");
        setBranchKpisError(null);
        lastConfirmedBranchSnapshotRef.current = noDataSnapshot;
        return { success: true, status: "empty", empty: true, stale: false };
      }

      setBranchKpis(nextSnapshot);
      setBranchKpisStatus("loaded");
      setBranchKpisError(null);
      lastConfirmedBranchSnapshotRef.current = nextSnapshot;
      return { success: true, status: "loaded", empty: false, stale: false };
    } catch (error: unknown) {
      if (requestId !== latestBranchMetricRequestRef.current) {
        return {
          success: false,
          status: "stale",
          empty: false,
          stale: true,
          error: "Superseded by a newer branch KPI refresh.",
        };
      }

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to load branch KPI data.";

      if (lastConfirmedBranchSnapshotRef.current) {
        setBranchKpis(lastConfirmedBranchSnapshotRef.current);
        setBranchKpisStatus("stale");
        setBranchKpisError(
          "Stale data: showing the last confirmed backend snapshot.",
        );
        return {
          success: false,
          status: "stale",
          empty: false,
          stale: true,
          error: message,
        };
      }

      const noDataSnapshot = buildNoDataBranchKpiSnapshot(INITIAL_BRANCH_KPIS);
      setBranchKpis(noDataSnapshot);
      setBranchKpisStatus("error");
      setBranchKpisError(
        "Failed to load branch KPI data. Showing no live values.",
      );
      return {
        success: false,
        status: "error",
        empty: false,
        stale: false,
        error: message,
      };
    }
  };

  useEffect(() => {
    void fetchMetrics();
  }, []);

  // ── Toast ──
  const showToast = (
    title: string,
    description: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    const id = Date.now().toString();
    setToast({ id, title, description, type });
    setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), 4500);
  };

  const dismissToast = () => setToast(null);
  const clearLoginError = () => setLoginError(null);

  // ── Auth ──
  const logout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginError(null);
    setSessionExpired(false);
    setPickers([]);
    setActiveTab("dashboard");
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError("Email and password are required");
      setSessionExpired(false);
      return false;
    }

    try {
      const { data } = await apiClient.post("/auth/login", {
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const user: AuthUser = {
        id: data.user.id,
        username: data.user.email,
        displayName: data.user.email,
        role: data.user.role,
      };

      const nextSession: AuthSession = {
        token: data.token,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        user,
      };

      window.localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify(nextSession),
      );
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginError(null);
      setSessionExpired(false);
      setActiveTab("admin");
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid credentials";
      setLoginError(message);
      setSessionExpired(false);
      return false;
    }
  };

  // ── Pickers (local operations) ──
  const addPicker = (
    id: string,
    name: string,
  ): { success: boolean; error?: string } => {
    const trimmedId = id.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedId || !trimmedName)
      return { success: false, error: "Picker ID and Name are required." };
    if (pickers.some((p) => p.id.toUpperCase() === trimmedId)) {
      return {
        success: false,
        error: `Duplicate ID: Terminal badge ${trimmedId} already registered.`,
      };
    }

    const tier: PerformanceTier = "very_good";
    const newPicker: Picker = {
      id: trimmedId,
      name: trimmedName,
      velocityScore: 88,
      tier,
      tierLabel: getTierLabel(tier),
      tierColor: getTierColor(tier),
      orders: 0,
      zone: "Warehouse Floor",
      subBadge: "New Registration",
      telemetry: {
        orders: 0,
        pickingTime: "—",
        assignmentTime: "—",
        prepTime: "—",
        dispatchTime: "—",
        opsCr: "—",
        detailedZone: "Warehouse Floor",
      },
    };

    setPickers((prev) => [newPicker, ...prev]);
    showToast("Picker Registered", `${trimmedName} (${trimmedId}) added.`);
    return { success: true };
  };

  const removePicker = (id: string): boolean => {
    const candidate = pickers.find((p) => p.id === id);
    if (!candidate) return false;
    setPickers((prev) => prev.filter((p) => p.id !== id));
    showToast(
      "Picker Removed",
      `Badge record ${candidate.id} (${candidate.name}) archived.`,
    );
    return true;
  };

  // ── KPIs ──
  const updateBranchKpi = (key: BranchKpiKey, value: string, date: string) => {
    setBranchKpis((prev) => {
      const current = prev[key];
      const updatedValue =
        value.includes("%") || value.includes("s") || value.includes("m")
          ? value
          : `${value}${current.unit === "%" ? "%" : current.unit === "s" ? "s" : current.unit === "m" ? "m" : ""}`;

      return {
        ...prev,
        [key]: {
          ...current,
          currentValue: updatedValue,
          latestTooltip: `${date.slice(8, 10)}/${date.slice(5, 7)} — ${key}: ${updatedValue}`,
        },
      };
    });

    showToast(`${key} saved`, `Updated ${key} to ${value} for ${date}.`);

    setTimeout(() => fetchMetrics(), 500);
  };

  // ── Uploads ──
  const addUploadRecord = (
    fileName: string,
    size: string,
    shiftsCount: number,
  ) => {
    const newRecord: RecentUpload = {
      id: `up-${Date.now()}`,
      fileName,
      timestamp:
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " " +
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      size,
      status: "Success",
      shiftsCount,
    };

    setRecentUploads((prev) => [newRecord, ...prev]);
    showToast(
      "Upload Successful",
      `Ingested ${shiftsCount.toLocaleString()} records from ${fileName}.`,
    );

    // Refresh pickers after successful import
    fetchPickers();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        pickers,
        pickersLoading,
        pickersError,
        fetchPickers,
        fetchMetrics,
        addPicker,
        removePicker,
        selectedTelemetryPicker,
        setSelectedTelemetryPicker,
        isAddPickerOpen,
        setIsAddPickerOpen,
        isRemovePickerOpen,
        setIsRemovePickerOpen,
        branchKpis,
        branchKpisStatus,
        branchKpisError,
        activeKpiKey,
        setActiveKpiKey,
        updateBranchKpi,
        recentUploads,
        addUploadRecord,
        toast,
        showToast,
        dismissToast,
        isAuthenticated,
        currentUser,
        authLoading,
        loginError,
        sessionExpired,
        login,
        logout,
        clearLoginError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
