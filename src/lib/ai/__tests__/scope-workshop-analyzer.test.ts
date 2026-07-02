import { describe, it, expect, vi } from 'vitest';
import { analyzeScopeLoopInput } from '../scope-workshop-analyzer';
import { analyzeBriefScopeDelta } from '../customer-change/briefScopeDeltaAnalyzer';

vi.mock('../customer-change/briefScopeDeltaAnalyzer', () => ({
  analyzeBriefScopeDelta: vi.fn(),
}));

describe('Scope Workshop Analyzer', () => {
  it('should recommend Update Brief if only brief is impacted', async () => {
    vi.mocked(analyzeBriefScopeDelta).mockResolvedValueOnce({
      summary_of_customer_change: 'Change summary',
      brief_delta: 'Update brief',
      scope_delta: 'ไม่มีผลกระทบ',
      quote_impact: 'ไม่มีผลกระทบ',
      acceptance_impact: 'ไม่มีผลกระทบ',
      missing_questions: [],
    });

    const result = await analyzeScopeLoopInput('', 'Customer message', '', '', [], []);
    expect(result.recommendedAction).toBe('Update Brief');
  });

  it('should recommend Update Scope if scope is impacted and not locked', async () => {
    vi.mocked(analyzeBriefScopeDelta).mockResolvedValueOnce({
      summary_of_customer_change: 'Change summary',
      brief_delta: 'ไม่มีผลกระทบ',
      scope_delta: 'Update scope',
      quote_impact: 'ไม่มีผลกระทบ',
      acceptance_impact: 'ไม่มีผลกระทบ',
      missing_questions: [],
    });

    const result = await analyzeScopeLoopInput('', 'Customer message', '', '', [], [], 'draft', false);
    expect(result.recommendedAction).toBe('Update Scope');
  });

  it('should recommend Create Change Request if scope is impacted and locked', async () => {
    vi.mocked(analyzeBriefScopeDelta).mockResolvedValueOnce({
      summary_of_customer_change: 'Change summary',
      brief_delta: 'ไม่มีผลกระทบ',
      scope_delta: 'Update scope',
      quote_impact: 'ไม่มีผลกระทบ',
      acceptance_impact: 'ไม่มีผลกระทบ',
      missing_questions: [],
    });

    const result = await analyzeScopeLoopInput('', 'Customer message', '', '', [], [], 'approved', true);
    expect(result.recommendedAction).toBe('Create Change Request');
  });

  it('should recommend Create Follow-up if there are missing questions', async () => {
    vi.mocked(analyzeBriefScopeDelta).mockResolvedValueOnce({
      summary_of_customer_change: 'Change summary',
      brief_delta: 'Update brief',
      scope_delta: 'Update scope',
      quote_impact: 'ไม่มีผลกระทบ',
      acceptance_impact: 'ไม่มีผลกระทบ',
      missing_questions: ['What is the deadline?'],
    });

    const result = await analyzeScopeLoopInput('', 'Customer message', '', '', [], []);
    expect(result.recommendedAction).toBe('Create Follow-up');
  });

  it('should recommend Re-check Quote if quote is impacted', async () => {
    vi.mocked(analyzeBriefScopeDelta).mockResolvedValueOnce({
      summary_of_customer_change: 'Change summary',
      brief_delta: 'ไม่มีผลกระทบ',
      scope_delta: 'ไม่มีผลกระทบ',
      quote_impact: 'Quote needs update',
      acceptance_impact: 'ไม่มีผลกระทบ',
      missing_questions: [],
    });

    const result = await analyzeScopeLoopInput('', 'Customer message', '', '', [], []);
    expect(result.recommendedAction).toBe('Re-check Quote');
  });
});
