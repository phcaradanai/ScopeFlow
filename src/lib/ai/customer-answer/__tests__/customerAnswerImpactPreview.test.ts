import { describe, expect, it } from 'vitest';
import { computeCustomerAnswerImpactPreview } from '../customerAnswerImpactPreview';
import type { DocumentLifecycleSummary } from '../../document-lifecycle/documentLifecycle';

describe('computeCustomerAnswerImpactPreview', () => {
  const mockSummary: DocumentLifecycleSummary = {
    items: [],
    next_action: 'brief',
    can_close_work: false,
    blocked_count: 0,
    ready_count: 0,
    missing_count: 0
  };

  it('returns empty for no answer', () => {
    const result = computeCustomerAnswerImpactPreview('approval', false, mockSummary);
    expect(result.affected).toHaveLength(0);
    expect(result.unaffected).toHaveLength(0);
  });

  it('shows impact for approval', () => {
    const result = computeCustomerAnswerImpactPreview('approval', true, mockSummary);
    expect(result.affected).toContain('brief');
  });

  it('shows impact for scope change', () => {
    const result = computeCustomerAnswerImpactPreview('scope_change', true, mockSummary);
    expect(result.affected).toContain('Scope');
    expect(result.affected).toContain('Quotation');
    expect(result.unaffected).toContain('Acceptance Sign-off');
  });

  it('shows impact for scope change with approved baseline', () => {
    const result = computeCustomerAnswerImpactPreview('scope_change', true, {
      ...mockSummary,
      items: [{ id: 'scope_baseline', label: 'Scope', status: 'approved', recommended_next_action: '' }]
    });
    expect(result.affected).toContain('Scope Baseline');
  });

  it('shows unaffected docs for clarification', () => {
    const result = computeCustomerAnswerImpactPreview('clarification', true, mockSummary);
    expect(result.affected).toHaveLength(0);
    expect(result.unaffected).toContain('Scope Baseline');
    expect(result.unaffected).toContain('Quotation');
  });
});
