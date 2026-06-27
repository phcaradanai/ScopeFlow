import { describe, expect, it } from 'vitest';
import { buildCloseoutReopenDecisionMarkdown, CLOSEOUT_REOPEN_DECISION_OPTIONS } from '../closeoutReopenDecision';

describe('closeoutReopenDecision', () => {
  it('defines the required decision options', () => {
    expect(CLOSEOUT_REOPEN_DECISION_OPTIONS.map(option => option.id)).toEqual([
      'reject_request',
      'quote_change_request',
      'create_new_scope',
      'need_more_information',
    ]);
  });

  it('builds decision markdown with checkboxes', () => {
    const markdown = buildCloseoutReopenDecisionMarkdown();

    expect(markdown).toContain('## Decision');
    expect(markdown).toContain('- [ ] Reject request');
    expect(markdown).toContain('- [ ] Quote as Change Request');
    expect(markdown).toContain('- [ ] Create new scope');
    expect(markdown).toContain('- [ ] Need more information');
    expect(markdown).toContain('Choose exactly one decision');
  });
});
