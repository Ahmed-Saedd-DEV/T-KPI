import type { ChartBar, ChartCoord } from '../types';

export interface ChartHistoryDatum {
  date: string;
  value: number;
}

export interface GeneratedChartGeometry {
  points: string;
  fillPoints: string;
  coords: ChartCoord[];
  bars: ChartBar[];
  xLabels: string[];
  latestDate: string | null;
}

function formatDateLabel(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

function formatMetricValue(value: number, unit: string): string {
  const abs = Math.abs(value);
  const precision = abs >= 100 || abs < 0.01 ? 0 : 2;
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: precision > 0 ? precision : 0,
    maximumFractionDigits: precision,
  });

  if (unit === '%') return `${formatted}%`;
  if (unit === 's' || unit === 'm') return `${formatted}${unit}`;
  if (unit === 'orders' || unit === 'qty' || unit === 'units' || unit === 'idx') {
    return formatted;
  }

  return formatted;
}

export function sanitizeChartHistory(
  historyData: Array<ChartHistoryDatum> = [],
): ChartHistoryDatum[] {
  return [...historyData]
    .filter(
      (entry): entry is ChartHistoryDatum =>
        !!entry
        && typeof entry.date === 'string'
        && entry.date.length > 0
        && Number.isFinite(entry.value),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
}

export function buildChartGeometry(
  historyData: Array<ChartHistoryDatum> = [],
  unit: string = '',
): GeneratedChartGeometry {
  const chartData = sanitizeChartHistory(historyData);

  if (chartData.length === 0) {
    return {
      points: '',
      fillPoints: '',
      coords: [],
      bars: [],
      xLabels: [],
      latestDate: null,
    };
  }

  const width = 700;
  const height = 240;
  const leftPad = 20;
  const rightPad = 20;
  const topPad = 10;
  const bottomPad = 20;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  const values = chartData.map((entry) => entry.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const domainMin = minValue === maxValue ? minValue - 1 : minValue;
  const domainMax = minValue === maxValue ? maxValue + 1 : maxValue;
  const domainRange = domainMax - domainMin || 1;

  const xForIndex = (index: number) => {
    if (chartData.length === 1) {
      return leftPad + plotWidth / 2;
    }
    return leftPad + (index / (chartData.length - 1)) * plotWidth;
  };

  const yForValue = (value: number) => {
    const ratio = (domainMax - value) / domainRange;
    return topPad + ratio * plotHeight;
  };

  const coords: ChartCoord[] = chartData.map((entry, index) => {
    const cx = xForIndex(index);
    const cy = yForValue(entry.value);

    return {
      cx,
      cy,
      label: `${formatDateLabel(entry.date)} — ${formatMetricValue(entry.value, unit)}`,
      active: index === chartData.length - 1,
    };
  });

  const points = coords.map(({ cx, cy }) => `${cx},${cy}`).join(' ');
  const lastCoord = coords[coords.length - 1];
  const firstCoord = coords[0];
  const bottomY = height - bottomPad;
  const fillPoints = lastCoord && firstCoord
    ? `${points} ${lastCoord.cx},${bottomY} ${firstCoord.cx},${bottomY}`
    : '';

  const barWidth = Math.max(18, Math.min(48, (plotWidth / chartData.length) * 0.66));
  const bars: ChartBar[] = chartData.map((entry, index) => {
    const cx = xForIndex(index);
    const cy = yForValue(entry.value);
    const x = cx - barWidth / 2;
    const y = Math.min(cy, bottomY);
    const height = Math.max(8, Math.abs(bottomY - cy));

    return {
      x,
      y,
      width: barWidth,
      height,
      label: `${formatDateLabel(entry.date)} — ${formatMetricValue(entry.value, unit)}`,
      active: index === chartData.length - 1,
    };
  });

  return {
    points,
    fillPoints,
    coords,
    bars,
    xLabels: chartData.map((entry) => formatDateLabel(entry.date)),
    latestDate: chartData[chartData.length - 1]?.date ?? null,
  };
}
