import { describe, expect, it } from 'vitest';
import { getCloseoutReopenActionTarget } from '../closeoutReopenActionTarget';
import type { DocumentLifecycleActionTarget } from '../../document-lifecycle/documentLifecycleAction';
import type { CloseoutReopenRequestSummary } from '../closeoutReopenDetection';
import type { CloseoutLatestReopenDecisionSummary } from '../closeoutReopenDecisionDetection';

const baseTarget: DocumentLifecycleActionTarget = {
  label: 'Open scope',
  file_path: '/workspace/project/scope.md',
  reason: 'Default lifecycle action',
};

function reopen(overrides: Partial<CloseoutReopenRequestSummary>): CloseoutReopenRequestSummary {
  return {
    has_reopen_request: false,
    request_count: 0,
    request_paths: [],
    ...overrides,
  };
}

function decision(overrides: Partial<CloseoutLatestReopenDecisionSummary>): CloseoutLatestReopenDecisionSummary {
  return {
    has_reopen_request: false,
    has_decision: false,
    selected_count: 0,
    is_ambiguous: false,
    ...overrides,
  };
}

describe('closeoutReopenActionTarget', () => {
  it('returns base target when there is no reopen request', () => {
    const target = getCloseoutReopenActionTarget(baseTarget, reopen({}), decision({}));

    expect(target).toBe(baseTarget);
  });

  it('opens latest reopen request when decision is pending', () => {
    const target = getCloseoutReopenActionTarget(
      baseTarget,
      reopen({ has_reopen_request: true, request_count: 1, latest_request_path: '/workspace/project/changes/reopen-request.md' }),
      decision({ has_reopen_request: true })
    );

    expect(target.label).toBe('Review reopen request');
    expect(target.file_path).toBe('/workspace/project/changes/reopen-request.md');
    expect(target.reason).toContain('pending decision');
  });

  it('opens latest reopen request to fix ambiguous decision', () => {
    const target = getCloseoutReopenActionTarget(
      baseTarget,
      reopen({ has_reopen_request: true, request_count: 1, latest_request_path: '/workspace/project/changes/reopen-request.md' }),
      decision({ has_reopen_request: true, is_ambiguous: true, selected_count: 2 })
    );

    expect(target.label).toBe('Fix reopen decision');
    expect(target.reason).toContain('multiple selected options');
  });

  it('uses selected decision guidance for selected decision', () => {
    const target = getCloseoutReopenActionTarget(
      baseTarget,
      reopen({ has_reopen_request: true, request_count: 1, latest_request_path: '/workspace/project/changes/reopen-request.md' }),
      decision({ has_reopen_request: true, has_decision: true, selected_decision_id: 'quote_change_request', selected_decision_label: 'Quote as Change Request', selected_count: 1 })
    );

    expect(target.label).toBe('Prepare CR quotation / change scope');
    expect(target.reason).toContain('ราคา/เวลา');
  });
});
