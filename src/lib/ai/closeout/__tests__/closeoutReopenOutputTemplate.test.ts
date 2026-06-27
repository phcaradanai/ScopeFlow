import { describe, expect, it } from 'vitest';
import { buildCloseoutReopenOutputTemplate } from '../closeoutReopenOutputTemplate';
import type { CloseoutLatestReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

function decision(selected_decision_id?: string, selected_decision_label?: string): CloseoutLatestReopenDecisionSummary {
  return {
    has_reopen_request: true,
    has_decision: !!selected_decision_id,
    selected_decision_id,
    selected_decision_label,
    selected_count: selected_decision_id ? 1 : 0,
    is_ambiguous: false,
  };
}

const baseInput = {
  project_name: 'CRM Revamp',
  project_path: '/workspace/project',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('closeoutReopenOutputTemplate', () => {
  it('blocks output creation when no decision is selected', () => {
    const result = buildCloseoutReopenOutputTemplate({
      ...baseInput,
      decision: decision(),
    });

    expect(result.can_create).toBe(false);
    expect(result.reason).toContain('เลือก decision');
  });

  it('builds rejection response template', () => {
    const result = buildCloseoutReopenOutputTemplate({
      ...baseInput,
      decision: decision('reject_request', 'Reject request'),
    });

    expect(result.can_create).toBe(true);
    expect(result.label).toBe('Create rejection response');
    expect(result.path).toBe('/workspace/project/changes/rejection-response-2026-01-01T00-00-00-000Z.md');
    expect(result.markdown).toContain('Rejection Response / Out-of-Scope Note');
    expect(result.markdown).toContain('Accepted baseline reference');
  });

  it('builds change request quote template', () => {
    const result = buildCloseoutReopenOutputTemplate({
      ...baseInput,
      decision: decision('quote_change_request', 'Quote as Change Request'),
    });

    expect(result.can_create).toBe(true);
    expect(result.label).toBe('Create CR quotation');
    expect(result.path).toBe('/workspace/project/changes/change-request-quote-2026-01-01T00-00-00-000Z.md');
    expect(result.markdown).toContain('Change Request Quote Draft');
    expect(result.markdown).toContain('Price');
    expect(result.markdown).toContain('Work starts only after customer approval');
  });

  it('builds new scope brief template', () => {
    const result = buildCloseoutReopenOutputTemplate({
      ...baseInput,
      decision: decision('create_new_scope', 'Create new scope'),
    });

    expect(result.can_create).toBe(true);
    expect(result.label).toBe('Create new scope brief');
    expect(result.path).toBe('/workspace/project/scope/new-scope-brief-2026-01-01T00-00-00-000Z.md');
    expect(result.markdown).toContain('New Scope Brief');
    expect(result.markdown).toContain('New objective');
  });

  it('builds customer questions template', () => {
    const result = buildCloseoutReopenOutputTemplate({
      ...baseInput,
      decision: decision('need_more_information', 'Need more information'),
    });

    expect(result.can_create).toBe(true);
    expect(result.label).toBe('Create customer questions');
    expect(result.path).toBe('/workspace/project/changes/customer-questions-2026-01-01T00-00-00-000Z.md');
    expect(result.markdown).toContain('Customer Questions for Reopen Request');
    expect(result.markdown).toContain('Decision after answers');
  });
});
