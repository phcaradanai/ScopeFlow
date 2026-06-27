import { describe, expect, it } from 'vitest';
import { getCloseoutReopenCreateOutputAction } from '../closeoutReopenCreateOutputAction';
import type { CloseoutLatestReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

function decision(overrides: Partial<CloseoutLatestReopenDecisionSummary>): CloseoutLatestReopenDecisionSummary {
  return {
    has_reopen_request: true,
    has_decision: false,
    selected_count: 0,
    is_ambiguous: false,
    ...overrides,
  };
}

const baseInput = {
  project_name: 'CRM Revamp',
  project_path: '/workspace/project',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('closeoutReopenCreateOutputAction', () => {
  it('is disabled when no decision is selected', () => {
    const action = getCloseoutReopenCreateOutputAction({
      ...baseInput,
      decision: decision({ has_decision: false }),
    });

    expect(action.enabled).toBe(false);
    expect(action.label).toBe('Create reopen output');
    expect(action.reason).toContain('เลือก decision');
  });

  it('is enabled when selected decision has an output template', () => {
    const action = getCloseoutReopenCreateOutputAction({
      ...baseInput,
      decision: decision({
        has_decision: true,
        selected_count: 1,
        selected_decision_id: 'quote_change_request',
        selected_decision_label: 'Quote as Change Request',
      }),
    });

    expect(action.enabled).toBe(true);
    expect(action.label).toBe('Create CR quotation');
    expect(action.output?.path).toBe('/workspace/project/changes/change-request-quote-2026-01-01T00-00-00-000Z.md');
    expect(action.output?.markdown).toContain('Change Request Quote Draft');
  });
});
