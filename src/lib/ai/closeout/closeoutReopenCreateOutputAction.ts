import type { CloseoutLatestReopenDecisionSummary } from './closeoutReopenDecisionDetection';
import { buildCloseoutReopenOutputTemplate, type CloseoutReopenOutputTemplate } from './closeoutReopenOutputTemplate';

export interface CloseoutReopenCreateOutputActionInput {
  project_name: string;
  project_path: string;
  decision: CloseoutLatestReopenDecisionSummary;
  created_at?: string;
}

export interface CloseoutReopenCreateOutputAction {
  enabled: boolean;
  label: string;
  reason: string;
  output?: CloseoutReopenOutputTemplate;
}

export function getCloseoutReopenCreateOutputAction(input: CloseoutReopenCreateOutputActionInput): CloseoutReopenCreateOutputAction {
  const output = buildCloseoutReopenOutputTemplate(input);

  if (!output.can_create || !output.path || !output.markdown) {
    return {
      enabled: false,
      label: output.label,
      reason: output.reason,
      output,
    };
  }

  return {
    enabled: true,
    label: output.label,
    reason: output.reason,
    output,
  };
}
