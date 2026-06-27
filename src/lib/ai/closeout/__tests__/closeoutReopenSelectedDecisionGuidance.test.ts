import { describe, expect, it } from 'vitest';
import { getCloseoutReopenSelectedDecisionGuidance } from '../closeoutReopenSelectedDecisionGuidance';
import type { CloseoutLatestReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

function decision(overrides: Partial<CloseoutLatestReopenDecisionSummary>): CloseoutLatestReopenDecisionSummary {
  return {
    has_reopen_request: true,
    has_decision: true,
    selected_count: 1,
    is_ambiguous: false,
    ...overrides,
  };
}

describe('closeoutReopenSelectedDecisionGuidance', () => {
  it('returns fallback when there is no selected decision', () => {
    const guidance = getCloseoutReopenSelectedDecisionGuidance(decision({ has_decision: false, selected_decision_id: undefined }));

    expect(guidance.has_guidance).toBe(false);
    expect(guidance.recommended_next_action).toContain('เลือก decision');
  });

  it('guides rejection decisions', () => {
    const guidance = getCloseoutReopenSelectedDecisionGuidance(decision({ selected_decision_id: 'reject_request' }));

    expect(guidance.has_guidance).toBe(true);
    expect(guidance.title).toBe('Prepare rejection response / out-of-scope note');
    expect(guidance.recommended_next_action).toContain('accepted baseline');
  });

  it('guides change request quotation decisions', () => {
    const guidance = getCloseoutReopenSelectedDecisionGuidance(decision({ selected_decision_id: 'quote_change_request' }));

    expect(guidance.has_guidance).toBe(true);
    expect(guidance.title).toBe('Prepare CR quotation / change scope');
    expect(guidance.recommended_next_action).toContain('ราคา/เวลา');
  });

  it('guides new scope decisions', () => {
    const guidance = getCloseoutReopenSelectedDecisionGuidance(decision({ selected_decision_id: 'create_new_scope' }));

    expect(guidance.has_guidance).toBe(true);
    expect(guidance.title).toBe('Create new brief/scope baseline');
    expect(guidance.recommended_next_action).toContain('baseline ใหม่');
  });

  it('guides need more information decisions', () => {
    const guidance = getCloseoutReopenSelectedDecisionGuidance(decision({ selected_decision_id: 'need_more_information' }));

    expect(guidance.has_guidance).toBe(true);
    expect(guidance.title).toBe('Prepare customer questions');
    expect(guidance.recommended_next_action).toContain('คำถาม');
  });
});
