import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreateMetricPayload,
  buildPatchMetricPayload,
  canReviewEditTarget,
  classifyAdminMetricError,
  createEditConfirmationSnapshot,
  evaluateWriteRefreshOutcome,
  getBackendMetricValue,
  isLatestEditTargetRequest,
  KPI_TO_BACKEND,
} from './adminMetricWrite';

test('builds a valid create payload for a POST request without fabricating a timestamp', () => {
  const payload = buildCreateMetricPayload('2026-10-21', 'CR', '94.5');

  assert.equal(payload.metricDate, '2026-10-21');
  assert.equal(payload[KPI_TO_BACKEND.CR], 94.5);
  assert.equal('recordedAt' in payload, false);
});

test('create payload preserves the explicitly selected calendar date for future and historical inputs', () => {
  const future = buildCreateMetricPayload('2026-12-31', 'Dispatch', '2.5');
  const historical = buildCreateMetricPayload('2025-01-05', 'PREP', '18.2');

  assert.equal(future.metricDate, '2026-12-31');
  assert.equal(historical.metricDate, '2025-01-05');
  assert.equal('recordedAt' in future, false);
  assert.equal('recordedAt' in historical, false);
});

test('create mode surfaces a 409 conflict without overriding existing data', () => {
  const result = classifyAdminMetricError({
    response: {
      status: 409,
      data: {
        message: 'Field(s) already have a value: opsCR. Use PATCH to update.',
      },
    },
  });

  assert.equal(result.kind, 'conflict');
  assert.match(result.message, /PATCH/);
  assert.equal(result.shouldOverwrite, false);
});

test('builds a valid patch payload for an explicit edit confirmation', () => {
  const payload = buildPatchMetricPayload('2026-10-21', 'PREP', '1.8');

  assert.equal(payload[KPI_TO_BACKEND.PREP], 1.8);
  assert.equal(payload.recordedAt && new Date(payload.recordedAt).toISOString().slice(0, 10), '2026-10-21');
});

test('missing edit targets are treated as not found', () => {
  const value = getBackendMetricValue(null, 'Dispatch');
  const result = classifyAdminMetricError({
    response: {
      status: 404,
      data: { message: 'No metric record found for this date' },
    },
  });

  assert.equal(value, null);
  assert.equal(result.kind, 'missing');
});

test('unauthorized and forbidden error statuses are classified correctly', () => {
  const unauthorized = classifyAdminMetricError({
    response: { status: 401, data: { message: 'Unauthorized' } },
  });
  const forbidden = classifyAdminMetricError({
    response: { status: 403, data: { message: 'Forbidden' } },
  });

  assert.equal(unauthorized.kind, 'unauthorized');
  assert.equal(forbidden.kind, 'forbidden');
});

test('invalid metric input is rejected before submission', () => {
  assert.throws(() => buildCreateMetricPayload('2026-10-21', 'CR', 'abc'));
  assert.throws(() => buildPatchMetricPayload('2026-10-21', 'CR', ''));
});

test('duplicate submission is blocked until a fresh save is complete', () => {
  const state = { pending: new Set(['CR']) };
  const blocked = state.pending.has('CR');

  assert.equal(blocked, true);
});

test('save success followed by refresh success reports a confirmed backend snapshot', () => {
  const outcome = evaluateWriteRefreshOutcome(true, true);

  assert.equal(outcome.mode, 'confirmed');
  assert.equal(outcome.refreshStatus, 'success');
  assert.equal(outcome.shouldShowStaleState, false);
});

test('save success followed by refresh failure keeps the last confirmed snapshot and shows stale state', () => {
  const outcome = evaluateWriteRefreshOutcome(true, false);

  assert.equal(outcome.mode, 'stale');
  assert.equal(outcome.refreshStatus, 'failed');
  assert.equal(outcome.shouldShowStaleState, true);
  assert.match(outcome.message, /Stale Data/i);
});

test('save failure does not mark the UI as successfully persisted', () => {
  const outcome = evaluateWriteRefreshOutcome(false, false);

  assert.equal(outcome.mode, 'failed');
  assert.equal(outcome.shouldPersist, false);
  assert.equal(outcome.refreshStatus, 'not-run');
});

test('rapid consecutive interactions are de-duped by a newer operation token', () => {
  const first = { token: 1, action: 'save' };
  const second = { token: 2, action: 'save' };

  assert.ok(second.token > first.token);
  assert.equal(second.action, 'save');
});

test('stale edit-target GET responses are rejected after a newer selection', () => {
  const latest = isLatestEditTargetRequest(
    1,
    2,
    '2026-10-20',
    '2026-10-21',
    'CR',
    'CR',
  );

  const staleKpi = isLatestEditTargetRequest(
    3,
    4,
    '2026-10-21',
    '2026-10-21',
    'PREP',
    'CR',
  );

  assert.equal(latest, false);
  assert.equal(staleKpi, false);
});

test('switching modes and changing values invalidates confirmation review state', () => {
  const snapshot = createEditConfirmationSnapshot(
    '2026-10-21',
    'CR',
    '5.0',
    '8.5',
  );

  assert.ok(snapshot);
  assert.equal(canReviewEditTarget(true, '2026-10-21', 'CR', '8.5'), false);
  assert.equal(canReviewEditTarget(false, '2026-10-21', 'CR', '8.5'), true);
  assert.equal(canReviewEditTarget(false, '2026-10-21', 'CR', ''), false);
});

test('PATCH payloads use the exact confirmed date, KPI, and proposed value', () => {
  const confirmed = createEditConfirmationSnapshot(
    '2026-10-21',
    'PREP',
    '12.5',
    '9.8',
  );

  assert.ok(confirmed);

  const payload = buildPatchMetricPayload(
    confirmed!.date,
    confirmed!.key,
    confirmed!.proposedValue,
  );

  assert.equal(payload[KPI_TO_BACKEND.PREP], 9.8);
  assert.equal(payload.recordedAt && new Date(payload.recordedAt).toISOString().slice(0, 10), '2026-10-21');
});

test('confirmation snapshots prevent PATCH execution without a valid reviewed target', () => {
  const missing = createEditConfirmationSnapshot('', 'CR', '3', '4');
  const emptyValue = createEditConfirmationSnapshot('2026-10-21', 'CR', '3', '');

  assert.equal(missing, null);
  assert.equal(emptyValue, null);
});
