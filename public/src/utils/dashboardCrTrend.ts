export interface DashboardCrHistoryDatum {
  date: string;
  value: number;
}

export interface DashboardCrSummary {
  history: DashboardCrHistoryDatum[];
  latestDate: string | null;
  latestValue: number | null;
  earliestValue: number | null;
  averageValue: number | null;
  hasSufficientHistory: boolean;
  rangeLabel: string;
  trendLabel: string;
}

export function buildDashboardCrSummary(
  historyData: Array<DashboardCrHistoryDatum> = [],
): DashboardCrSummary {
  const safeHistory = [...historyData]
    .filter(
      (entry): entry is DashboardCrHistoryDatum =>
        !!entry
        && typeof entry.date === 'string'
        && entry.date.length > 0
        && Number.isFinite(entry.value),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  if (safeHistory.length === 0) {
    return {
      history: [],
      latestDate: null,
      latestValue: null,
      earliestValue: null,
      averageValue: null,
      hasSufficientHistory: false,
      rangeLabel: 'Not enough data to calculate a trend',
      trendLabel: 'Not enough data to calculate a trend',
    };
  }

  const latestEntry = safeHistory[safeHistory.length - 1];
  const earliestEntry = safeHistory[0];
  const averageValue = safeHistory.reduce((sum, entry) => sum + entry.value, 0) / safeHistory.length;
  const hasSufficientHistory = safeHistory.length > 1;

  const rangeLabel = hasSufficientHistory
    ? `${earliestEntry.value.toFixed(2)}% → ${latestEntry.value.toFixed(2)}%`
    : `${latestEntry.value.toFixed(2)}%`;

  const trendLabel = hasSufficientHistory
    ? `${latestEntry.value >= earliestEntry.value ? '+' : ''}${(latestEntry.value - earliestEntry.value).toFixed(2)} pts vs earliest point (${rangeLabel})`
    : 'Not enough data to calculate a trend';

  return {
    history: safeHistory,
    latestDate: latestEntry.date,
    latestValue: latestEntry.value,
    earliestValue: earliestEntry.value,
    averageValue,
    hasSufficientHistory,
    rangeLabel,
    trendLabel,
  };
}
