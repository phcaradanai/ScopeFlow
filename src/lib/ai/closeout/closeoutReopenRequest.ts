import type { CloseoutFinalStatus } from './closeoutFinalStatus';
import { getCloseoutReopenActionPlan } from './closeoutReopenActionPlan';
import { buildCloseoutReopenDecisionMarkdown } from './closeoutReopenDecision';

export interface CloseoutReopenRequestInput {
  project_name: string;
  project_path: string;
  reason: string;
  created_at?: string;
}

export interface CloseoutReopenRequest {
  path: string;
  markdown: string;
}

function safeTimestamp(value: string): string {
  return value.replace(/[:.]/g, '-');
}

export function canCreateCloseoutReopenRequest(finalStatus: CloseoutFinalStatus): boolean {
  return finalStatus.kind === 'finalized';
}

export function buildCloseoutReopenRequest(input: CloseoutReopenRequestInput): CloseoutReopenRequest {
  const createdAt = input.created_at || new Date().toISOString();
  const reason = input.reason.trim() || 'Reopen requested after finalized closeout.';
  const fileName = `reopen-request-${safeTimestamp(createdAt)}.md`;
  const path = `${input.project_path}/changes/${fileName}`;
  const actionPlan = getCloseoutReopenActionPlan({
    has_reopen_request: true,
    request_count: 1,
    latest_request_path: path,
    request_paths: [path],
  });
  const markdown = [
    `# Reopen / Change Request — ${input.project_name}`,
    '',
    `- Created at: ${createdAt}`,
    '- Source status: Finalized / Closed',
    '- Request type: Reopen after final close',
    '',
    '## Reason',
    '',
    reason,
    '',
    buildCloseoutReopenDecisionMarkdown().trimEnd(),
    '',
    '## Recommended action plan',
    '',
    actionPlan.summary,
    '',
    ...actionPlan.items.flatMap((item, index) => [
      `${index + 1}. **${item.label}**`,
      `   - ${item.description}`,
    ]),
    '',
    '## Scope control note',
    '',
    'This request was created after the project had already been finalized. Treat the next work as a new change request, not a silent edit to the accepted baseline.',
    '',
  ].join('\n');

  return { path, markdown };
}
