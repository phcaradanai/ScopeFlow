import { describe, expect, it } from 'vitest';
import { getCloseoutReopenActionPlan } from '../closeoutReopenActionPlan';
import type { CloseoutReopenRequestSummary } from '../closeoutReopenDetection';

function summary(overrides: Partial<CloseoutReopenRequestSummary>): CloseoutReopenRequestSummary {
  return {
    has_reopen_request: false,
    request_count: 0,
    request_paths: [],
    ...overrides,
  };
}

describe('closeoutReopenActionPlan', () => {
  it('returns no action plan when no reopen request exists', () => {
    const plan = getCloseoutReopenActionPlan(summary({ has_reopen_request: false }));

    expect(plan.has_action_plan).toBe(false);
    expect(plan.items).toEqual([]);
    expect(plan.title).toBe('No reopen request');
  });

  it('returns action plan when reopen request exists', () => {
    const plan = getCloseoutReopenActionPlan(summary({
      has_reopen_request: true,
      request_count: 1,
      latest_request_path: '/workspace/project/changes/reopen-request-2026-01-01T00-00-00-000Z.md',
      request_paths: ['/workspace/project/changes/reopen-request-2026-01-01T00-00-00-000Z.md'],
    }));

    expect(plan.has_action_plan).toBe(true);
    expect(plan.title).toBe('Reopen / CR action plan');
    expect(plan.summary).toContain('ไม่แก้ baseline เดิม');
    expect(plan.items.map(item => item.id)).toEqual([
      'review_request',
      'decide_response',
      'protect_baseline',
    ]);
  });
});
