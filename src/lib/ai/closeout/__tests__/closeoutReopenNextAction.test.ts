import { describe, expect, it } from 'vitest';
import { getCloseoutReopenNextAction } from '../closeoutReopenNextAction';
import type { CloseoutLatestReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

function decision(overrides: Partial<CloseoutLatestReopenDecisionSummary>): CloseoutLatestReopenDecisionSummary {
  return {
    has_reopen_request: false,
    has_decision: false,
    selected_count: 0,
    is_ambiguous: false,
    ...overrides,
  };
}

describe('closeoutReopenNextAction', () => {
  it('returns fallback when no reopen request exists', () => {
    expect(getCloseoutReopenNextAction(decision({ has_reopen_request: false }), 'Default next')).toBe('Default next');
  });

  it('asks user to choose decision when reopen request is pending', () => {
    expect(getCloseoutReopenNextAction(decision({ has_reopen_request: true, has_decision: false }), 'Default next')).toBe(
      'Review the latest reopen request and choose exactly one decision.'
    );
  });

  it('asks user to fix ambiguous decision', () => {
    expect(getCloseoutReopenNextAction(decision({ has_reopen_request: true, is_ambiguous: true, selected_count: 2 }), 'Default next')).toBe(
      'Fix reopen decision checkbox to exactly one option before starting any work after final close.'
    );
  });

  it('uses selected decision guidance for CR quotation', () => {
    expect(getCloseoutReopenNextAction(decision({
      has_reopen_request: true,
      has_decision: true,
      selected_count: 1,
      selected_decision_id: 'quote_change_request',
      selected_decision_label: 'Quote as Change Request',
    }), 'Default next')).toContain('ราคา/เวลา');
  });
});
