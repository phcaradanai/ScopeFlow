import type { DocumentLifecycleActionTarget } from '../document-lifecycle/documentLifecycleAction';
import type { CloseoutReopenRequestSummary } from './closeoutReopenDetection';
import type { CloseoutLatestReopenDecisionSummary } from './closeoutReopenDecisionDetection';

export function getCloseoutReopenActionTarget(
  baseTarget: DocumentLifecycleActionTarget,
  reopenSummary: CloseoutReopenRequestSummary,
  decisionSummary: CloseoutLatestReopenDecisionSummary
): DocumentLifecycleActionTarget {
  if (!reopenSummary.latest_request_path) return baseTarget;

  const decisionLabel = decisionSummary.is_ambiguous
    ? 'Fix reopen decision'
    : decisionSummary.has_decision
      ? `Continue: ${decisionSummary.selected_decision_label}`
      : 'Review reopen request';

  return {
    label: decisionLabel,
    file_path: reopenSummary.latest_request_path,
    reason: decisionSummary.is_ambiguous
      ? 'Reopen / CR decision has multiple selected options. Open the latest reopen request and fix it to exactly one decision.'
      : decisionSummary.has_decision
        ? 'Reopen / CR has a selected decision. Open the latest reopen request and continue from that decision.'
        : 'Reopen / CR is pending decision. Open the latest reopen request and choose exactly one decision.',
  };
}
