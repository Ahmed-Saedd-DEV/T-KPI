import type { BranchKpiKey } from '../types';

export const KPI_TO_BACKEND: Record<BranchKpiKey, string> = {
  CR: 'opsCR',
  PREP: 'prepTime',
  ORDER: 'orderCount',
  ATVENDOR: 'atVendorTime',
  Adjust: 'adjustTime',
  Dispatch: 'dispatchTime',
};

export type AdminMetricErrorKind =
  | 'conflict'
  | 'unauthorized'
  | 'forbidden'
  | 'missing'
  | 'invalid'
  | 'unknown';

export interface ClassifiedAdminMetricError {
  kind: AdminMetricErrorKind;
  message: string;
  shouldOverwrite: boolean;
}

export function normalizeNumericMetricValue(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid metric value');
    }
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Invalid metric value');
  }

  const numericValue = Number(trimmed);
  if (!Number.isFinite(numericValue)) {
    throw new Error('Invalid metric value');
  }

  return numericValue;
}

export function buildCreateMetricPayload(
  metricDate: string,
  key: BranchKpiKey,
  value: string | number,
): Record<string, string | number> {
  return {
    metricDate,
    [KPI_TO_BACKEND[key]]: normalizeNumericMetricValue(value),
  };
}

export function buildPatchMetricPayload(
  metricDate: string,
  key: BranchKpiKey,
  value: string | number,
): Record<string, string | number> {
  return {
    [KPI_TO_BACKEND[key]]: normalizeNumericMetricValue(value),
    recordedAt: new Date(`${metricDate}T12:00:00.000Z`).toISOString(),
  };
}

export function getBackendMetricValue(
  record: Record<string, unknown> | null | undefined,
  key: BranchKpiKey,
): number | null {
  if (!record) return null;

  const value = record[KPI_TO_BACKEND[key]];
  if (value === null || value === undefined || value === '') return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export interface EditConfirmationSnapshot {
  date: string;
  key: BranchKpiKey;
  currentValue: string;
  proposedValue: string;
}

export function isLatestEditTargetRequest(
  requestId: number,
  latestRequestId: number,
  requestedDate: string,
  activeDate: string,
  requestedKey: BranchKpiKey,
  activeKey: BranchKpiKey,
): boolean {
  return requestId === latestRequestId
    && requestedDate === activeDate
    && requestedKey === activeKey;
}

export function createEditConfirmationSnapshot(
  date: string,
  key: BranchKpiKey,
  currentValue: string,
  proposedValue: string,
): EditConfirmationSnapshot | null {
  const trimmedValue = proposedValue.trim();

  if (!date || !key || !trimmedValue) {
    return null;
  }

  return {
    date,
    key,
    currentValue,
    proposedValue: trimmedValue,
  };
}

export function canReviewEditTarget(
  editTargetLoading: boolean,
  date: string,
  key: BranchKpiKey,
  proposedValue: string,
): boolean {
  return !editTargetLoading
    && Boolean(date)
    && Boolean(key)
    && Boolean(proposedValue.trim());
}

export function classifyAdminMetricError(error: unknown): ClassifiedAdminMetricError {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  const status = response?.status ?? 0;
  const message = response?.data?.message ?? 'Metric request failed.';

  if (status === 409 || /already have a value|Use PATCH to update/i.test(message)) {
    return {
      kind: 'conflict',
      message,
      shouldOverwrite: false,
    };
  }

  if (status === 401 || /unauthorized/i.test(message)) {
    return {
      kind: 'unauthorized',
      message: message || 'Unauthorized',
      shouldOverwrite: false,
    };
  }

  if (status === 403 || /forbidden/i.test(message)) {
    return {
      kind: 'forbidden',
      message: message || 'Forbidden',
      shouldOverwrite: false,
    };
  }

  if (status === 404 || /No metric record found|not found/i.test(message)) {
    return {
      kind: 'missing',
      message: message || 'No metric record found for this date',
      shouldOverwrite: false,
    };
  }

  if (
    status === 400 ||
    /invalid|required|expected YYYY-MM-DD|must be a valid/i.test(message)
  ) {
    return {
      kind: 'invalid',
      message: message || 'Invalid metric input.',
      shouldOverwrite: false,
    };
  }

  return {
    kind: 'unknown',
    message: message || 'Metric request failed.',
    shouldOverwrite: false,
  };
}

export function evaluateWriteRefreshOutcome(
  saveSucceeded: boolean,
  refreshSucceeded: boolean,
): {
  mode: 'confirmed' | 'stale' | 'failed';
  refreshStatus: 'success' | 'failed' | 'not-run';
  shouldPersist: boolean;
  shouldShowStaleState: boolean;
  message: string;
} {
  if (!saveSucceeded) {
    return {
      mode: 'failed',
      refreshStatus: 'not-run',
      shouldPersist: false,
      shouldShowStaleState: false,
      message: 'Save failed. No optimistic backend state was applied.',
    };
  }

  if (refreshSucceeded) {
    return {
      mode: 'confirmed',
      refreshStatus: 'success',
      shouldPersist: true,
      shouldShowStaleState: false,
      message: 'Save succeeded and the dashboard was refreshed from backend data.',
    };
  }

  return {
    mode: 'stale',
    refreshStatus: 'failed',
    shouldPersist: false,
    shouldShowStaleState: true,
    message: 'Save succeeded, refresh failed. Stale Data is being shown from the last confirmed backend snapshot.',
  };
}
