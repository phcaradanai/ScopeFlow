import { CLOSEOUT_REOPEN_DECISION_OPTIONS } from './closeoutReopenDecision';

export interface CloseoutReopenDecisionSummary {
  has_decision: boolean;
  selected_decision_id?: string;
  selected_decision_label?: string;
  selected_count: number;
  is_ambiguous: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCloseoutReopenDecisionSummary(markdown: string): CloseoutReopenDecisionSummary {
  const selected = CLOSEOUT_REOPEN_DECISION_OPTIONS.filter(option => {
    const pattern = new RegExp(`^- \\[x\\] ${escapeRegExp(option.label)}$`, 'gim');
    return pattern.test(markdown);
  });

  return {
    has_decision: selected.length === 1,
    selected_decision_id: selected.length === 1 ? selected[0].id : undefined,
    selected_decision_label: selected.length === 1 ? selected[0].label : undefined,
    selected_count: selected.length,
    is_ambiguous: selected.length > 1,
  };
}
