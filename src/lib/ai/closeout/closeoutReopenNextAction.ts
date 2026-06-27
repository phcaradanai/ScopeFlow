import type { CloseoutLatestReopenDecisionSummary } from './closeoutReopenDecisionDetection';
import { getCloseoutReopenSelectedDecisionGuidance } from './closeoutReopenSelectedDecisionGuidance';

export function getCloseoutReopenNextAction(decision: CloseoutLatestReopenDecisionSummary, fallbackNextAction: string): string {
  if (!decision.has_reopen_request) return fallbackNextAction;
  if (decision.is_ambiguous) return 'Fix reopen decision checkbox to exactly one option before starting any work after final close.';
  if (!decision.has_decision) return 'Review the latest reopen request and choose exactly one decision.';

  const guidance = getCloseoutReopenSelectedDecisionGuidance(decision);
  return guidance.has_guidance ? guidance.recommended_next_action : `Continue with selected reopen decision: ${decision.selected_decision_label}.`;
}
