import type { CloseoutFinalStatus } from './closeoutFinalStatus';

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
    '## Scope control note',
    '',
    'This request was created after the project had already been finalized. Treat the next work as a new change request, not a silent edit to the accepted baseline.',
    '',
  ].join('\n');

  return { path, markdown };
}
