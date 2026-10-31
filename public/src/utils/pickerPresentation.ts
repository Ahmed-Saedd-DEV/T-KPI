import { PerformanceTier, Picker } from '../types';

export interface BackendEmployee {
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

export function getTier(score: number | null): PerformanceTier {
  if (score === null) return 'low';
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'very_good';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  if (score >= 50) return 'below_average';
  return 'low';
}

export function getTierLabel(tier: PerformanceTier): string {
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

export function getTierColor(tier: PerformanceTier): string {
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

function normalizeDurationInput(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return null;

  return Number(value.toFixed(12));
}

function compactNumericText(value: number): string {
  const tolerance = 1e-9;
  const roundedValue = Math.abs(value - Math.round(value)) < tolerance
    ? Math.round(value)
    : value;

  const normalized = Number(roundedValue.toFixed(12));
  return normalized
    .toString()
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}

export function formatMinuteDuration(value: number | null | undefined): string {
  const safeValue = normalizeDurationInput(value);
  if (safeValue === null) return '—';

  const totalSeconds = Number((safeValue * 60).toFixed(12));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds - minutes * 60;

  if (minutes === 0) {
    return `${compactNumericText(remainingSeconds)}s`;
  }

  return `${minutes}m ${compactNumericText(remainingSeconds)}s`;
}

export function formatAssignmentTimeMinutesToSeconds(
  value: number | null | undefined,
): string {
  return formatMinuteDuration(value);
}

export function formatRatioToPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (!Number.isFinite(value) || value < 0) return '—';

  const percentage = value * 100;
  const tolerance = 1e-9;
  const rounded = Math.abs(percentage - Math.round(percentage)) < tolerance
    ? Math.round(percentage)
    : percentage;

  const normalized = Number(rounded.toFixed(12));
  return normalized
    .toString()
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '') + '%';
}

export function resolveVelocityScore(score: number | null): {
  velocityScore: number | null;
  tier: PerformanceTier;
  tierLabel: string;
  subBadge: string;
} {
  if (score === null) {
    return {
      velocityScore: null,
      tier: 'low',
      tierLabel: 'No data',
      subBadge: 'No data',
    };
  }

  const tier = getTier(score);

  return {
    velocityScore: Math.round(score),
    tier,
    tierLabel: getTierLabel(tier),
    subBadge: `Score: ${score.toFixed(1)}`,
  };
}

export function mapEmployeeToPicker(emp: BackendEmployee): Picker {
  const score = emp.kpi?.overallScore ?? null;
  const resolved = resolveVelocityScore(score);
  const metrics = emp.metrics;

  return {
    id: emp.employeeCode,
    name: emp.name,
    velocityScore: resolved.velocityScore,
    tier: resolved.tier,
    tierLabel: resolved.tierLabel,
    tierColor: getTierColor(resolved.tier),
    orders: emp.orders ?? 0,
    zone: 'Warehouse Floor',
    subBadge: resolved.subBadge,
    telemetry: {
      orders: emp.orders ?? 0,
      pickingTime: metrics ? formatMinuteDuration(metrics.pickingTime) : '—',
      assignmentTime: metrics
        ? formatMinuteDuration(metrics.assignmentTime)
        : '—',
      prepTime: metrics ? formatMinuteDuration(metrics.prepTime) : '—',
      dispatchTime: metrics ? formatMinuteDuration(metrics.dispatchTime) : '—',
      opsCr: metrics ? formatRatioToPercent(metrics.opsCR) : '—',
      detailedZone: 'Warehouse Floor',
    },
  };
}
