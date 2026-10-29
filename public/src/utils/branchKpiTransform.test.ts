import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildNoDataBranchKpiSnapshot,
  extractBranchMetricRecords,
  transformBranchKpiRecords,
} from './branchKpiTransform';
import { buildChartGeometry } from './chartGeometry';
import { INITIAL_BRANCH_KPIS } from '../data/initialData';

test('returns empty KPI state for an empty dataset', () => {
  const result = transformBranchKpiRecords([]);

  assert.deepEqual(result.CR.latestValue, null);
  assert.deepEqual(result.CR.latestDate, null);
  assert.deepEqual(result.CR.history, []);
  assert.deepEqual(result.PREP.latestValue, null);
});

test('uses the latest non-null value per KPI and preserves the actual measurement date', () => {
  const records = [
    { metricDate: '2026-10-01', opsCR: 10, prepTime: 12.5 },
    { metricDate: '2026-10-02', opsCR: null, prepTime: 11.1 },
    { metricDate: '2026-10-03', opsCR: 8.5 },
    { metricDate: '2026-10-04', opsCR: 7.25, prepTime: '9.7' },
  ];

  const result = transformBranchKpiRecords(records);

  assert.equal(result.CR.latestValue, 7.25);
  assert.equal(result.CR.latestDate, '2026-10-04');
  assert.deepEqual(result.CR.history, [
    { date: '2026-10-01', value: 10 },
    { date: '2026-10-03', value: 8.5 },
    { date: '2026-10-04', value: 7.25 },
  ]);

  assert.equal(result.PREP.latestValue, 9.7);
  assert.equal(result.PREP.latestDate, '2026-10-04');
  assert.deepEqual(result.PREP.history, [
    { date: '2026-10-01', value: 12.5 },
    { date: '2026-10-02', value: 11.1 },
    { date: '2026-10-04', value: 9.7 },
  ]);
});

test('preserves zero values and selects the last seven actual non-null measurements only', () => {
  const records = [
    { metricDate: '2026-09-01', opsCR: 10 },
    { metricDate: '2026-09-02', opsCR: 0 },
    { metricDate: '2026-09-03', opsCR: 9 },
    { metricDate: '2026-09-04', opsCR: null },
    { metricDate: '2026-09-05', opsCR: 8 },
    { metricDate: '2026-09-06', opsCR: 0 },
    { metricDate: '2026-09-07', opsCR: 7 },
    { metricDate: '2026-09-08', opsCR: 6 },
    { metricDate: '2026-09-09', opsCR: 5 },
    { metricDate: '2026-09-10', opsCR: 4 },
  ];

  const result = transformBranchKpiRecords(records);

  assert.equal(result.CR.latestValue, 4);
  assert.equal(result.CR.latestDate, '2026-09-10');
  assert.deepEqual(result.CR.history, [
    { date: '2026-09-03', value: 9 },
    { date: '2026-09-05', value: 8 },
    { date: '2026-09-06', value: 0 },
    { date: '2026-09-07', value: 7 },
    { date: '2026-09-08', value: 6 },
    { date: '2026-09-09', value: 5 },
    { date: '2026-09-10', value: 4 },
  ]);
});

test('handles unsorted records, decimal strings, date-only strings, and never mutates the input', () => {
  const records = [
    { metricDate: '2026-10-10', orderCount: '2' },
    { metricDate: '2026-10-08', orderCount: null },
    { metricDate: '2026-10-09', orderCount: '3.5' },
    { metricDate: '2026-10-07', orderCount: '0' },
  ];

  const snapshot = JSON.parse(JSON.stringify(records));
  const result = transformBranchKpiRecords(records);

  assert.deepEqual(records, snapshot);
  assert.equal(result.ORDER.latestValue, 2);
  assert.equal(result.ORDER.latestDate, '2026-10-10');
  assert.deepEqual(result.ORDER.history, [
    { date: '2026-10-07', value: 0 },
    { date: '2026-10-09', value: 3.5 },
    { date: '2026-10-10', value: 2 },
  ]);
});

test('builds a no-data runtime snapshot without leaking demo values', () => {
  const result = buildNoDataBranchKpiSnapshot(INITIAL_BRANCH_KPIS);

  assert.equal(result.CR.currentValue, 'N/A');
  assert.equal(result.CR.latestTooltip, 'No data available');
  assert.deepEqual(result.CR.historyData, []);
  assert.equal(result.Dispatch.currentValue, 'N/A');
});

test('builds dynamic chart geometry from actual measurements and keeps only the latest seven in order', () => {
  const history = [
    { date: '2026-09-01', value: 12 },
    { date: '2026-09-02', value: 11 },
    { date: '2026-09-03', value: 9 },
    { date: '2026-09-04', value: 8 },
    { date: '2026-09-05', value: 7 },
    { date: '2026-09-06', value: 6 },
    { date: '2026-09-07', value: 5 },
    { date: '2026-09-08', value: 4 },
    { date: '2026-09-09', value: 3 },
  ];

  const chart = buildChartGeometry(history, '%');

  assert.equal(chart.latestDate, '2026-09-09');
  assert.equal(chart.coords.length, 7);
  assert.equal(chart.xLabels.length, 7);
  assert.deepEqual(chart.xLabels, ['03 Sept', '04 Sept', '05 Sept', '06 Sept', '07 Sept', '08 Sept', '09 Sept']);
  assert.ok(chart.points.includes('20,'));
  assert.ok(chart.fillPoints.includes('20,220'));
  assert.ok(chart.bars.length === 7);
});

test('keeps zero, decimal, negative, and extreme values valid for SVG chart generation', () => {
  const zeroChart = buildChartGeometry([
    { date: '2026-09-01', value: 0 },
    { date: '2026-09-02', value: 0 },
  ], '%');
  const decimalChart = buildChartGeometry([
    { date: '2026-09-01', value: 0.25 },
    { date: '2026-09-02', value: 0.75 },
  ], '%');
  const negativeChart = buildChartGeometry([
    { date: '2026-09-01', value: -12 },
    { date: '2026-09-02', value: -6 },
  ], '%');
  const extremeChart = buildChartGeometry([
    { date: '2026-09-01', value: 1000000 },
    { date: '2026-09-02', value: 1000002 },
  ], '%');

  assert.equal(zeroChart.coords.length, 2);
  assert.ok(zeroChart.points.includes(','));
  assert.equal(decimalChart.coords[0].cy > decimalChart.coords[1].cy, true);
  assert.ok(negativeChart.coords.every((coord) => Number.isFinite(coord.cx) && Number.isFinite(coord.cy)));
  assert.ok(extremeChart.bars.every((bar) => Number.isFinite(bar.x) && Number.isFinite(bar.y) && Number.isFinite(bar.height)));
});

test('renders a single-point chart and avoids division-by-zero when all values are equal', () => {
  const singlePoint = buildChartGeometry([
    { date: '2026-09-01', value: 42 },
  ], '%');
  const equalValues = buildChartGeometry([
    { date: '2026-09-01', value: 8 },
    { date: '2026-09-02', value: 8 },
    { date: '2026-09-03', value: 8 },
  ], '%');

  assert.equal(singlePoint.coords.length, 1);
  assert.equal(singlePoint.coords[0].active, true);
  assert.ok(equalValues.points.includes(','));
  assert.ok(equalValues.coords.every((coord) => Number.isFinite(coord.cx) && Number.isFinite(coord.cy)));
});

test('never reuses static demo chart strings as the live geometry', () => {
  const history = [
    { date: '2026-10-01', value: 22 },
    { date: '2026-10-02', value: 24 },
    { date: '2026-10-03', value: 18 },
    { date: '2026-10-04', value: 26 },
  ];

  const chart = buildChartGeometry(history, '%');
  assert.ok(chart.points.length > 0);
  assert.notEqual(chart.points, '50,115 150,95 250,130 350,88 450,78 550,105 650,90');
  assert.notEqual(chart.fillPoints, '50,115 150,95 250,130 350,88 450,78 550,105 650,90 650,240 50,240');
  assert.notEqual(chart.coords[0].label, '12/10 — CR: 2.70%');
});

test('accepts a valid raw-array metric payload and keeps the dates and values intact', () => {
  const payload = [
    { metricDate: '2026-10-05', opsCR: 12.5, orderCount: 240 },
    { metricDate: '2026-10-06', prepTime: 0, dispatchTime: 6.25 },
  ];

  const records = extractBranchMetricRecords(payload);
  assert.ok(Array.isArray(records));
  assert.equal(records?.length, 2);
  assert.equal(records?.[0].metricDate, '2026-10-05');
  assert.equal(records?.[1].dispatchTime, 6.25);

  const transformed = transformBranchKpiRecords(records!);
  assert.equal(transformed.CR.latestValue, 12.5);
  assert.equal(transformed.CR.latestDate, '2026-10-05');
  assert.equal(transformed.PREP.latestValue, 0);
  assert.equal(transformed.PREP.latestDate, '2026-10-06');
});

test('accepts a valid empty raw-array payload and maps it to the empty state', () => {
  const records = extractBranchMetricRecords([]);
  assert.deepEqual(records, []);
  const transformed = transformBranchKpiRecords(records!);
  assert.equal(transformed.CR.latestValue, null);
  assert.equal(transformed.Dispatch.latestValue, null);
});

test('rejects malformed object responses instead of silently treating them as empty', () => {
  assert.equal(extractBranchMetricRecords({ status: 'ok' }), null);
  assert.equal(extractBranchMetricRecords({ data: { bad: true } }), null);
});

test('rejects null and undefined payloads as malformed instead of empty datasets', () => {
  assert.equal(extractBranchMetricRecords(null), null);
  assert.equal(extractBranchMetricRecords(undefined), null);
});

test('preserves valid zero-valued KPI measurements through raw-array extraction', () => {
  const payload = [
    { metricDate: '2026-10-08', opsCR: 0, orderCount: 0, adjustTime: 0 },
    { metricDate: '2026-10-09', prepTime: 0, atVendorTime: 0 },
  ];

  const records = extractBranchMetricRecords(payload);
  assert.equal(records?.[0].opsCR, 0);
  assert.equal(records?.[0].orderCount, 0);
  assert.equal(records?.[1].prepTime, 0);
  assert.deepEqual(transformBranchKpiRecords(records!).CR.history, [
    { date: '2026-10-08', value: 0 },
  ]);
});

test('supports multiple KPI records across multiple dates without losing the record structure', () => {
  const payload = [
    { metricDate: '2026-10-01', opsCR: 3.5, prepTime: 4.1 },
    { metricDate: '2026-10-02', orderCount: 522, atVendorTime: 1.8 },
    { metricDate: '2026-10-03', adjustTime: 2, dispatchTime: 8.4 },
  ];

  const records = extractBranchMetricRecords(payload);
  assert.equal(records?.length, 3);
  const transformed = transformBranchKpiRecords(records!);
  assert.equal(transformed.CR.latestValue, 3.5);
  assert.equal(transformed.ORDER.latestValue, 522);
  assert.equal(transformed.Adjust.latestValue, 2);
  assert.equal(transformed.Dispatch.latestValue, 8.4);
});
