import { describe, expect, it } from 'vitest';
import { getCloseoutReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

describe('closeoutReopenDecisionDetection', () => {
  it('returns undecided when no checkbox is selected', () => {
    const summary = getCloseoutReopenDecisionSummary([
      '## Decision',
      '',
      '- [ ] Reject request',
      '- [ ] Quote as Change Request',
      '- [ ] Create new scope',
      '- [ ] Need more information',
    ].join('\n'));

    expect(summary.has_decision).toBe(false);
    expect(summary.selected_decision_id).toBeUndefined();
    expect(summary.selected_count).toBe(0);
    expect(summary.is_ambiguous).toBe(false);
  });

  it('detects exactly one selected decision', () => {
    const summary = getCloseoutReopenDecisionSummary([
      '## Decision',
      '',
      '- [ ] Reject request',
      '- [x] Quote as Change Request',
      '- [ ] Create new scope',
      '- [ ] Need more information',
    ].join('\n'));

    expect(summary.has_decision).toBe(true);
    expect(summary.selected_decision_id).toBe('quote_change_request');
    expect(summary.selected_decision_label).toBe('Quote as Change Request');
    expect(summary.selected_count).toBe(1);
    expect(summary.is_ambiguous).toBe(false);
  });

  it('marks multiple selected decisions as ambiguous', () => {
    const summary = getCloseoutReopenDecisionSummary([
      '## Decision',
      '',
      '- [x] Reject request',
      '- [x] Quote as Change Request',
      '- [ ] Create new scope',
      '- [ ] Need more information',
    ].join('\n'));

    expect(summary.has_decision).toBe(false);
    expect(summary.selected_decision_id).toBeUndefined();
    expect(summary.selected_count).toBe(2);
    expect(summary.is_ambiguous).toBe(true);
  });

  it('is case-insensitive for checked marker', () => {
    const summary = getCloseoutReopenDecisionSummary('- [X] Need more information');

    expect(summary.has_decision).toBe(true);
    expect(summary.selected_decision_id).toBe('need_more_information');
  });
});
