export type NavTab = 'dashboard' | 'pickers' | 'branch-kpis' | 'admin';

export type PerformanceTier =
  | 'excellent'
  | 'very_good'
  | 'good'
  | 'average'
  | 'below_average'
  | 'low';

export interface PickerTelemetry {
  orders: number | string;
  ordersDelta?: string;
  pickingTime: string;
  pickingDelta?: string;
  assignmentTime: string;
  prepTime: string;
  dispatchTime: string;
  opsCr: string;
  detailedZone: string;
}

export interface Picker {
  id: string; // e.g. "P-1042"
  name: string;
  velocityScore: number; // e.g. 96
  tier: PerformanceTier;
  tierLabel: string;
  tierColor: string;
  orders: number;
  zone: string;
  subBadge: string;
  actionReq?: boolean;
  telemetry: PickerTelemetry;
}

export type BranchKpiKey = 'CR' | 'PREP' | 'ORDER' | 'ATVENDOR' | 'Adjust' | 'Dispatch';
export type BranchKpiStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error' | 'stale';

export interface ChartCoord {
  cx: number;
  cy: number;
  label: string;
  active?: boolean;
}

export interface ChartBar {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  active?: boolean;
}

export interface BranchKpiConfig {
  key: BranchKpiKey;
  label: string;
  currentValue: string;
  type: 'line' | 'bar';
  title: string;
  unit: string;
  badge: string;
  icon: string;
  latestTooltip: string;
  historyData?: Array<{ date: string; value: number }>;
  yAxis: string[];
  points?: string;
  fillPoints?: string;
  coords?: ChartCoord[];
  bars?: ChartBar[];
  description: string;
  inputUnit: string;
  step: string;
}

export interface RecentUpload {
  id: string;
  fileName: string;
  timestamp: string;
  size: string;
  status: 'Success' | 'Failed' | 'Processing';
  shiftsCount: number;
}
