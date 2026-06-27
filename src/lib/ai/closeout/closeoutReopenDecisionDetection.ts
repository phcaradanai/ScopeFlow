import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';
import { CLOSEOUT_REOPEN_DECISION_OPTIONS } from './closeoutReopenDecision';
import { getCloseoutReopenRequestSummary } from './closeoutReopenDetection';

export interface CloseoutReopenDecisionSummary {
  has_decision: boolean;
  selected_decision_id?: string;
  selected_decision_label?: string;
  selected_count: number;
  is_ambiguous: boolean;
}

export interface CloseoutLatestReopenDecisionSummary extends CloseoutReopenDecisionSummary {
  has_reopen_request: boolean;
  source_path?: string;
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

export function getLatestCloseoutReopenDecisionSummary(files: LifecycleScanFile[]): CloseoutLatestReopenDecisionSummary {
  const reopenSummary = getCloseoutReopenRequestSummary(files);
  if (!reopenSummary.latest_request_path) {
    return {
      has_reopen_request: false,
      has_decision: false,
      selected_count: 0,
      is_ambiguous: false,
    };
  }

  const latestFile = files.find(file => file.path === reopenSummary.latest_request_path);
  const decision = getCloseoutReopenDecisionSummary(latestFile?.markdown || '');

  return {
    ...decision,
    has_reopen_request: true,
    source_path: reopenSummary.latest_request_path,
  };
}
