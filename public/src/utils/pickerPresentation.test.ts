import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatAssignmentTimeMinutesToSeconds,
  formatMinuteDuration,
  formatRatioToPercent,
  mapEmployeeToPicker,
  resolveVelocityScore,
} from './pickerPresentation';

test('formats minute-based durations without losing fractional seconds', () => {
  assert.equal(formatMinuteDuration(1.75), '1m 45s');
  assert.equal(formatMinuteDuration(1.59), '1m 35.4s');
  assert.equal(formatMinuteDuration(0.16), '9.6s');
  assert.equal(formatMinuteDuration(5.75), '5m 45s');
  assert.equal(formatMinuteDuration(0.125), '7.5s');
  assert.equal(formatMinuteDuration(1.125), '1m 7.5s');
  assert.equal(formatMinuteDuration(1.01), '1m 0.6s');
  assert.equal(formatMinuteDuration(0), '0s');
});

test('handles missing or invalid minute values as missing data', () => {
  assert.equal(formatMinuteDuration(null), '—');
  assert.equal(formatMinuteDuration(undefined), '—');
  assert.equal(formatMinuteDuration(Number.NaN), '—');
});

test('stabilizes floating-point artifacts in minute-to-seconds formatting', () => {
  assert.equal(formatMinuteDuration(0.1666666666667), '10s');
  assert.equal(formatMinuteDuration(0.0833333333333), '5s');
});

test('keeps assignment time conversion aligned with the shared duration formatter', () => {
  assert.equal(formatAssignmentTimeMinutesToSeconds(0.3), '18s');
  assert.equal(formatAssignmentTimeMinutesToSeconds(0), '0s');
  assert.equal(formatAssignmentTimeMinutesToSeconds(null), '—');
  assert.equal(formatAssignmentTimeMinutesToSeconds(undefined), '—');
});

test('converts ratio-based CR values to percentage strings exactly once', () => {
  assert.equal(formatRatioToPercent(0.0175), '1.75%');
  assert.equal(formatRatioToPercent(0.02), '2%');
  assert.equal(formatRatioToPercent(0), '0%');
  assert.equal(formatRatioToPercent(null), '—');
  assert.equal(formatRatioToPercent(undefined), '—');
  assert.equal(formatRatioToPercent(0.000125), '0.0125%');
  assert.equal(formatRatioToPercent(0.3333333333333), '33.33333333333%');
});

test('uses the production CR formatter for the Picker modal value path without one-decimal rounding', () => {
  const picker = mapEmployeeToPicker({
    id: 'emp-cr-precision',
    employeeCode: 'CR-175',
    name: 'CR Precision',
    orders: 18,
    metrics: {
      opsCR: 0.0175,
      dispatchTime: 12,
      pickingTime: 8,
      assignmentTime: 5,
      prepTime: 4,
    },
    kpi: {
      overallScore: 86,
      scores: {
        opsCR: 0.0175,
        dispatchTime: null,
        pickingTime: null,
        assignmentTime: null,
        prepTime: null,
      },
    },
  });

  assert.equal(picker.telemetry.opsCr, '1.75%');
  assert.equal(picker.telemetry.dispatchTime, '12m 0s');
});

test('keeps missing overall score as a no-data UI state', () => {
  const result = resolveVelocityScore(null);

  assert.equal(result.velocityScore, null);
  assert.equal(result.tierLabel, 'No data');
  assert.equal(result.subBadge, 'No data');
});

test('preserves a legitimate zero overall score as zero', () => {
  const result = resolveVelocityScore(0);

  assert.equal(result.velocityScore, 0);
  assert.equal(result.tierLabel, 'Low');
  assert.equal(result.subBadge, 'Score: 0.0');
});

test('maps valid positive overall score without dropping the real value', () => {
  const result = resolveVelocityScore(71.25);

  assert.equal(result.velocityScore, 71);
  assert.equal(result.tierLabel, 'Good');
  assert.equal(result.subBadge, 'Score: 71.3');
});

test('maps backend employee data and keeps null-safe picker presentation', () => {
  const picker = mapEmployeeToPicker({
    id: 'emp-1',
    employeeCode: '101',
    name: 'Nora',
    orders: 42,
    metrics: {
      opsCR: 0.915,
      dispatchTime: 7.5,
      pickingTime: 1.1,
      assignmentTime: 0.25,
      prepTime: 2.1,
    },
    kpi: {
      overallScore: 82.1,
      scores: {
        opsCR: 100,
        dispatchTime: 93.33,
        pickingTime: 100,
        assignmentTime: 100,
        prepTime: 100,
      },
    },
  });

  assert.equal(picker.velocityScore, 82);
  assert.equal(picker.tierLabel, 'Very Good');
  assert.equal(picker.subBadge, 'Score: 82.1');
  assert.equal(picker.telemetry.assignmentTime, '15s');
  assert.equal(picker.telemetry.pickingTime, '1m 6s');
  assert.equal(picker.telemetry.prepTime, '2m 6s');
  assert.equal(picker.telemetry.dispatchTime, '7m 30s');
  assert.equal(picker.telemetry.opsCr, '91.5%');
});

test('handles a fully missing KPI payload without fabricating a zero score', () => {
  const picker = mapEmployeeToPicker({
    id: 'emp-2',
    employeeCode: '202',
    name: 'Mira',
    orders: 0,
    metrics: null,
    kpi: {
      overallScore: null,
      scores: {
        opsCR: null,
        dispatchTime: null,
        pickingTime: null,
        assignmentTime: null,
        prepTime: null,
      },
    },
  });

  assert.equal(picker.velocityScore, null);
  assert.equal(picker.tierLabel, 'No data');
  assert.equal(picker.subBadge, 'No data');
  assert.equal(picker.telemetry.assignmentTime, '—');
  assert.equal(picker.telemetry.opsCr, '—');
});
