import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDashboardCrSummary } from './dashboardCrTrend';

test('dashboard CR trend uses the authoritative backend history and latest seven actual measurements', () => {
  const history = [
    { date: '2026-09-01', value: 2.4 },
    { date: '2026-09-02', value: 2.6 },
    { date: '2026-09-03', value: 2.8 },
    { date: '2026-09-04', value: 3.1 },
    { date: '2026-09-05', value: 3.4 },
    { date: '2026-09-06', value: 3.0 },
    { date: '2026-09-07', value: 3.2 },
    { date: '2026-09-08', value: 3.5 },
    { date: '2026-09-09', value: 3.8 },
  ];

  const result = buildDashboardCrSummary(history);

  assert.equal(result.history.length, 7);
  assert.equal(result.latestDate, '2026-09-09');
  assert.equal(result.latestValue, 3.8);
  assert.equal(result.earliestValue, 2.8);
  assert.equal(result.history[0].date, '2026-09-03');
  assert.equal(result.history[6].date, '2026-09-09');
  assert.match(result.trendLabel, /\+1\.00 pts|\+1\.0 pts/i);
  assert.match(result.rangeLabel, /2\.80% → 3\.80%/);
});

test('dashboard CR summary keeps zero and decimal CR values valid and preserves real dates', () => {
  const result = buildDashboardCrSummary([
    { date: '2026-10-01', value: 0 },
    { date: '2026-10-02', value: 0.25 },
    { date: '2026-10-03', value: 0.5 },
  ]);

  assert.equal(result.latestValue, 0.5);
  assert.equal(result.latestDate, '2026-10-03');
  assert.equal(result.history.length, 3);
  assert.equal(result.averageValue, 0.25);
  assert.match(result.rangeLabel, /0\.00% → 0\.50%/);
});

test('dashboard CR summary handles empty and single-measurement states without fabricated trend text', () => {
  const emptyResult = buildDashboardCrSummary([]);
  const singleResult = buildDashboardCrSummary([
    { date: '2026-09-10', value: 4.2 },
  ]);

  assert.equal(emptyResult.history.length, 0);
  assert.equal(emptyResult.latestDate, null);
  assert.equal(emptyResult.trendLabel, 'Not enough data to calculate a trend');
  assert.equal(singleResult.hasSufficientHistory, false);
  assert.equal(singleResult.trendLabel, 'Not enough data to calculate a trend');
});

test('dashboard CR summary does not leak hardcoded October 18 demo narrative', () => {
  const result = buildDashboardCrSummary([
    { date: '2026-10-17', value: 3.2 },
    { date: '2026-10-18', value: 3.45 },
  ]);

  assert.ok(result.trendLabel.includes('3.20%') || result.trendLabel.includes('3.20'));
  assert.ok(!result.trendLabel.includes('Oct 18'));
  assert.ok(!result.rangeLabel.includes('Oct 18'));
});
