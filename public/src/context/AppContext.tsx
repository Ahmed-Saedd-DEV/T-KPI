import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  NavTab,
  Picker,
  BranchKpiKey,
  BranchKpiConfig,
  RecentUpload,
  PerformanceTier,
} from '../types';
import { INITIAL_BRANCH_KPIS, INITIAL_UPLOADS } from '../data/initialData';
import apiClient from '../api/client';

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'error' | 'info';
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
  addPicker: (id: string, name: string) => { success: boolean; error?: string };
  removePicker: (id: string) => boolean;
  selectedTelemetryPicker: Picker | null;
  setSelectedTelemetryPicker: (picker: Picker | null) => void;
  isAddPickerOpen: boolean;
  setIsAddPickerOpen: (open: boolean) => void;
  isRemovePickerOpen: boolean;
  setIsRemovePickerOpen: (open: boolean) => void;
  branchKpis: Record<BranchKpiKey, BranchKpiConfig>;
  activeKpiKey: BranchKpiKey;
  setActiveKpiKey: (key: BranchKpiKey) => void;
  updateBranchKpi: (key: BranchKpiKey, value: string, date: string) => void;
  recentUploads: RecentUpload[];
  addUploadRecord: (fileName: string, size: string, shiftsCount: number) => void;
  toast: ToastMessage | null;
  showToast: (title: string, description: string, type?: 'success' | 'error' | 'info') => void;
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
const AUTH_SESSION_KEY = 'picker-performance-dashboard-session';

// ─── Tier helpers ────────────────────────────────────────────────────────────
function getTier(score: number | null): PerformanceTier {
  if (score === null) return 'low';
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'very_good';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  if (score >= 50) return 'below_average';
  return 'low';
}

function getTierLabel(tier: PerformanceTier): string {
  const labels: Record<PerformanceTier, string> = {
    excellent: 'Excellent',
    very_good: 'Very Good',
    good: 'Good',
    average: 'Average',
    below_average: 'Below Avg',
    low: 'Low',
  };
  return labels[tier];
}

function getTierColor(tier: PerformanceTier): string {
  const colors: Record<PerformanceTier, string> = {
    excellent: '#22C55E',
    very_good: '#52e87c',
    good: '#FDE047',
    average: '#FBBF24',
    below_average: '#FB923C',
    low: '#F87171',
  };
  return colors[tier];
}

// ─── Backend → Picker mapper ──────────────────────────────────────────────────
interface BackendEmployee {
  id: string;
  employeeCode: string;
  name: string;
  orders: number | null;
  metrics: {
    opsCR: number;
    dispatchTime: number;
    pickingTime: number;
    assignmentTime: number;
    prepTime: number;
  } | null;
  kpi: {
    overallScore: number | null;
    scores: Record<string, number | null>;
  } | null;
}

function mapEmployeeToPicker(emp: BackendEmployee): Picker {
  const score = emp.kpi?.overallScore ?? null;
  const tier = getTier(score);
  const metrics = emp.metrics;

  const fmtSec = (v: number | undefined) =>
    v !== undefined ? `${v.toFixed(2)}s` : '—';
  const fmtMin = (v: number | undefined) =>
    v !== undefined ? `${Math.floor(v / 60)}m ${Math.round(v % 60)}s` : '—';

  return {
    id: emp.employeeCode,
    name: emp.name,
    velocityScore: score !== null ? Math.round(score) : 0,
    tier,
    tierLabel: getTierLabel(tier),
    tierColor: getTierColor(tier),
    orders: emp.orders ?? 0,
    zone: 'Warehouse Floor',
    subBadge: score !== null ? `Score: ${score.toFixed(1)}` : 'No data',
    telemetry: {
      orders: emp.orders ?? 0,
      pickingTime: metrics ? fmtMin(metrics.pickingTime) : '—',
      assignmentTime: metrics ? fmtSec(metrics.assignmentTime) : '—',
      prepTime: metrics ? fmtSec(metrics.prepTime) : '—',
      dispatchTime: metrics ? fmtSec(metrics.dispatchTime) : '—',
      opsCr: metrics ? `${metrics.opsCR.toFixed(2)}%` : '—',
      detailedZone: 'Warehouse Floor',
    },
  };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const readStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
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
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [pickersLoading, setPickersLoading] = useState(false);
  const [pickersError, setPickersError] = useState<string | null>(null);
  const [selectedTelemetryPicker, setSelectedTelemetryPicker] = useState<Picker | null>(null);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [isRemovePickerOpen, setIsRemovePickerOpen] = useState(false);
  const [branchKpis, setBranchKpis] = useState<Record<BranchKpiKey, BranchKpiConfig>>(INITIAL_BRANCH_KPIS);
  const [activeKpiKey, setActiveKpiKey] = useState<BranchKpiKey>('CR');
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>(INITIAL_UPLOADS);
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
      const { data } = await apiClient.get<{ data: BackendEmployee[] }>('/employees', {
        params: { limit: 100 },
      });
      setPickers((data.data ?? []).map(mapEmployeeToPicker));
    } catch {
      setPickersError('Failed to load pickers. Retrying will restore data.');
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
    window.addEventListener('session-expired', handleExpired);
    return () => window.removeEventListener('session-expired', handleExpired);
  }, []);

  // ── Fetch pickers once authenticated ──
  useEffect(() => {
  fetchPickers();
}, []);

  // ── Toast ──
  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'success') => {
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
    setActiveTab('dashboard');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError('Email and password are required');
      setSessionExpired(false);
      return false;
    }

    try {
      const { data } = await apiClient.post('/auth/login', {
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

      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginError(null);
      setSessionExpired(false);
      setActiveTab('admin');
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Invalid credentials';
      setLoginError(message);
      setSessionExpired(false);
      return false;
    }
  };

  // ── Pickers (local operations) ──
  const addPicker = (id: string, name: string): { success: boolean; error?: string } => {
    const trimmedId = id.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedId || !trimmedName) return { success: false, error: 'Picker ID and Name are required.' };
    if (pickers.some((p) => p.id.toUpperCase() === trimmedId)) {
      return { success: false, error: `Duplicate ID: Terminal badge ${trimmedId} already registered.` };
    }

    const tier: PerformanceTier = 'very_good';
    const newPicker: Picker = {
      id: trimmedId,
      name: trimmedName,
      velocityScore: 88,
      tier,
      tierLabel: getTierLabel(tier),
      tierColor: getTierColor(tier),
      orders: 0,
      zone: 'Warehouse Floor',
      subBadge: 'New Registration',
      telemetry: {
        orders: 0,
        pickingTime: '—',
        assignmentTime: '—',
        prepTime: '—',
        dispatchTime: '—',
        opsCr: '—',
        detailedZone: 'Warehouse Floor',
      },
    };

    setPickers((prev) => [newPicker, ...prev]);
    showToast('Picker Registered', `${trimmedName} (${trimmedId}) added.`);
    return { success: true };
  };

  const removePicker = (id: string): boolean => {
    const candidate = pickers.find((p) => p.id === id);
    if (!candidate) return false;
    setPickers((prev) => prev.filter((p) => p.id !== id));
    showToast('Picker Removed', `Badge record ${candidate.id} (${candidate.name}) archived.`);
    return true;
  };

  // ── KPIs ──
  const updateBranchKpi = (key: BranchKpiKey, value: string, date: string) => {
    setBranchKpis((prev) => {
      const current = prev[key];
      const updatedValue =
        value.includes('%') || value.includes('s') || value.includes('m')
          ? value
          : `${value}${current.unit === '%' ? '%' : current.unit === 's' ? 's' : current.unit === 'm' ? 'm' : ''}`;

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
  };

  // ── Uploads ──
  const addUploadRecord = (fileName: string, size: string, shiftsCount: number) => {
    const newRecord: RecentUpload = {
      id: `up-${Date.now()}`,
      fileName,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      size,
      status: 'Success',
      shiftsCount,
    };

    setRecentUploads((prev) => [newRecord, ...prev]);
    showToast('Upload Successful', `Ingested ${shiftsCount.toLocaleString()} records from ${fileName}.`);

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
        addPicker,
        removePicker,
        selectedTelemetryPicker,
        setSelectedTelemetryPicker,
        isAddPickerOpen,
        setIsAddPickerOpen,
        isRemovePickerOpen,
        setIsRemovePickerOpen,
        branchKpis,
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
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};