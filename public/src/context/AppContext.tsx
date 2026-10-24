import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  NavTab,
  Picker,
  BranchKpiKey,
  BranchKpiConfig,
  RecentUpload,
  PerformanceTier,
} from '../types';
import {
  INITIAL_PICKERS,
  INITIAL_BRANCH_KPIS,
  INITIAL_UPLOADS,
} from '../data/initialData';
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

const readStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!rawSession) return null;
    const parsedSession: AuthSession = JSON.parse(rawSession);
    if (!parsedSession?.token || !parsedSession?.user || !parsedSession?.expiresAt) {
      return null;
    }
    return parsedSession;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [pickers, setPickers] = useState<Picker[]>(INITIAL_PICKERS);
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

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, title, description, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  const dismissToast = () => setToast(null);
  const clearLoginError = () => setLoginError(null);

  const logout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginError(null);
    setSessionExpired(false);
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

  const addPicker = (id: string, name: string): { success: boolean; error?: string } => {
    const trimmedId = id.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedId || !trimmedName) {
      return { success: false, error: 'Picker ID and Name are required.' };
    }

    if (pickers.some((p) => p.id.toUpperCase() === trimmedId)) {
      return {
        success: false,
        error: `Duplicate ID: Terminal badge ${trimmedId} already registered.`,
      };
    }

    const defaultVelocity = 88;
    const tier: PerformanceTier = 'very_good';

    const newPicker: Picker = {
      id: trimmedId,
      name: trimmedName,
      velocityScore: defaultVelocity,
      tier,
      tierLabel: 'Very Good',
      tierColor: '#52e87c',
      orders: 110,
      zone: 'Zone B · Shift B',
      subBadge: 'New Registration',
      telemetry: {
        orders: 110,
        ordersDelta: '+1 vs avg',
        pickingTime: '2m 05s',
        assignmentTime: '26s',
        prepTime: '50s',
        dispatchTime: '9.10s',
        opsCr: '2.4%',
        detailedZone: 'Zone B - Mezzanine Staging',
      },
    };

    setPickers((prev) => [newPicker, ...prev]);
    showToast(
      'Picker Registered Successfully',
      `${trimmedName} (${trimmedId}) assigned to Zone B · Shift B.`
    );
    return { success: true };
  };

  const removePicker = (id: string): boolean => {
    const candidate = pickers.find((p) => p.id === id);
    if (!candidate) return false;
    setPickers((prev) => prev.filter((p) => p.id !== id));
    showToast(
      'Picker Removed Successfully',
      `Badge record ${candidate.id} (${candidate.name}) archived and shifts synchronized.`
    );
    return true;
  };

  const updateBranchKpi = (key: BranchKpiKey, value: string, date: string) => {
    setBranchKpis((prev) => {
      const current = prev[key];
      const updatedValue =
        value.includes('%') || value.includes('s') || value.includes('m')
          ? value
          : `${value}${
              current.unit === '%' ? '%' :
              current.unit === 's' ? 's' :
              current.unit === 'm' ? 'm' : ''
            }`;

      return {
        ...prev,
        [key]: {
          ...current,
          currentValue: updatedValue,
          latestTooltip: `${date.slice(8, 10)}/${date.slice(5, 7)} — ${key}: ${updatedValue}`,
        },
      };
    });

    showToast(
      `${key} value saved successfully`,
      `Updated ${key} to ${value} for ${date}. Branch KPIs and Dashboard updated.`
    );
  };

  const addUploadRecord = (fileName: string, size: string, shiftsCount: number) => {
    const newRecord: RecentUpload = {
      id: `up-${Date.now()}`,
      fileName,
      timestamp:
        new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ' ' +
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      size,
      status: 'Success',
      shiftsCount,
    };

    setRecentUploads((prev) => [newRecord, ...prev]);
    showToast(
      'Shift Ledger Ingested',
      `Ingested ${shiftsCount.toLocaleString()} shift logs from ${fileName}.`
    );
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        pickers,
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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};