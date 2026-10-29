import type { BranchKpiConfig, BranchKpiKey } from '../types';

export interface BranchMetricRecord {
  metricDate?: string | Date | null;
  opsCR?: number | string | null;
  prepTime?: number | string | null;
  orderCount?: number | string | null;
  atVendorTime?: number | string | null;
  adjustTime?: number | string | null;
  dispatchTime?: number | string | null;
}

export interface BranchKpiHistoryEntry {
  date: string;
  value: number;
}

export interface BranchKpiTransformState {
  latestValue: number | null;
  latestDate: string | null;
  history: BranchKpiHistoryEntry[];
}

const KPI_FIELD_MAP: Record<BranchKpiKey, keyof BranchMetricRecord> = {
  CR: 'opsCR',
  PREP: 'prepTime',
  ORDER: 'orderCount',
  ATVENDOR: 'atVendorTime',
  Adjust: 'adjustTime',
  Dispatch: 'dispatchTime',
};

const EMPTY_KPI_STATE: BranchKpiTransformState = {
  latestValue: null,
  latestDate: null,
  history: [],
};

function normalizeDateKey(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function getHistoryForKpi(records: BranchMetricRecord[], key: BranchKpiKey): BranchKpiHistoryEntry[] {
  return records
    .map((record) => {
      const date = normalizeDateKey(record.metricDate);
      const value = parseNumericValue(record[KPI_FIELD_MAP[key]]);

      if (!date || value === null) {
        return null;
      }

      return { date, value };
    })
    .filter((entry): entry is BranchKpiHistoryEntry => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function extractBranchMetricRecords(
  payload: unknown,
): BranchMetricRecord[] | null {
  if (Array.isArray(payload)) {
    return payload.filter(
      (record): record is BranchMetricRecord =>
        record !== null && typeof record === 'object',
    );
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested.filter(
        (record): record is BranchMetricRecord =>
          record !== null && typeof record === 'object',
      );
    }
  }

  return null;
}

export function transformBranchKpiRecords(
  records: BranchMetricRecord[],
): Record<BranchKpiKey, BranchKpiTransformState> {
  const safeRecords = Array.isArray(records) ? [...records] : [];
  const orderedRecords = safeRecords
    .filter((record) => typeof record === 'object' && record !== null)
    .sort((a, b) => {
      const left = normalizeDateKey(a.metricDate);
      const right = normalizeDateKey(b.metricDate);

      if (!left && !right) {
        return 0;
      }
      if (!left) {
        return 1;
      }
      if (!right) {
        return -1;
      }

      return left.localeCompare(right);
    });

  const result = {
    CR: { ...EMPTY_KPI_STATE },
    PREP: { ...EMPTY_KPI_STATE },
    ORDER: { ...EMPTY_KPI_STATE },
    ATVENDOR: { ...EMPTY_KPI_STATE },
    Adjust: { ...EMPTY_KPI_STATE },
    Dispatch: { ...EMPTY_KPI_STATE },
  } satisfies Record<BranchKpiKey, BranchKpiTransformState>;

  for (const key of Object.keys(KPI_FIELD_MAP) as BranchKpiKey[]) {
    const history = getHistoryForKpi(orderedRecords, key);
    if (history.length === 0) {
      result[key] = { ...EMPTY_KPI_STATE };
      continue;
    }

    const latestEntry = history[history.length - 1];
    const recentHistory = history.slice(-7);

    result[key] = {
      latestValue: latestEntry.value,
      latestDate: latestEntry.date,
      history: recentHistory,
    };
  }

  return result;
}

const formatMetricDisplayValue = (value: number, unit: string): string => {
  const numericFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const wholeFormatter = new Intl.NumberFormat('en-US');
  const formatted = Number.isInteger(value)
    ? wholeFormatter.format(value)
    : numericFormatter.format(value);

  if (unit === '%') return `${formatted}%`;
  if (unit === 's') return `${formatted}s`;
  if (unit === 'm') return `${formatted}m`;
  return formatted;
};

export function buildNoDataBranchKpiSnapshot(
  baseConfigs: Record<BranchKpiKey, BranchKpiConfig>,
): Record<BranchKpiKey, BranchKpiConfig> {
  return (Object.keys(baseConfigs) as BranchKpiKey[]).reduce(
    (acc, key) => {
      const base = baseConfigs[key];
      acc[key] = {
        ...base,
        currentValue: 'N/A',
        latestTooltip: 'No data available',
        historyData: [],
      };
      return acc;
    },
    {} as Record<BranchKpiKey, BranchKpiConfig>,
  );
}

export function buildBranchKpiRuntimeSnapshot(
  baseConfigs: Record<BranchKpiKey, BranchKpiConfig>,
  transformed: Record<BranchKpiKey, BranchKpiTransformState>,
): Record<BranchKpiKey, BranchKpiConfig> {
  return (Object.keys(baseConfigs) as BranchKpiKey[]).reduce(
    (acc, key) => {
      const base = baseConfigs[key];
      const state = transformed[key];
      const hasLatestValue = state.latestValue !== null && state.latestDate;
      const currentValue = hasLatestValue
        ? formatMetricDisplayValue(state.latestValue ?? 0, base.unit)
        : 'N/A';
      const latestTooltip = hasLatestValue
        ? `${state.latestDate!.slice(8, 10)}/${state.latestDate!.slice(5, 7)} — ${key}: ${currentValue}`
        : `No data — ${key}`;

      acc[key] = {
        ...base,
        currentValue,
        latestTooltip,
        historyData: state.history.map(({ date, value }) => ({ date, value })),
      };
      return acc;
    },
    {} as Record<BranchKpiKey, BranchKpiConfig>,
  );
}
