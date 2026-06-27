import { describe, expect, it } from 'vitest';
import { buildCloseoutReopenRequest, canCreateCloseoutReopenRequest } from '../closeoutReopenRequest';
import type { CloseoutFinalStatus } from '../closeoutFinalStatus';

function finalStatus(kind: CloseoutFinalStatus['kind']): CloseoutFinalStatus {
  return {
    kind,
    label: kind,
    description: kind,
    is_terminal_ready: kind !== 'not_ready',
  };
}

describe('closeoutReopenRequest', () => {
  it('only allows reopen request after finalized closeout', () => {
    expect(canCreateCloseoutReopenRequest(finalStatus('finalized'))).toBe(true);
    expect(canCreateCloseoutReopenRequest(finalStatus('awaiting_customer_acceptance'))).toBe(false);
    expect(canCreateCloseoutReopenRequest(finalStatus('ready_to_deliver'))).toBe(false);
  });

  it('builds a change request markdown file under changes folder', () => {
    const request = buildCloseoutReopenRequest({
      project_name: 'CRM Revamp',
      project_path: '/workspace/clients/acme/projects/crm-revamp',
      reason: 'Customer requested extra report after sign-off.',
      created_at: '2026-01-01T00:00:00.000Z',
    });

    expect(request.path).toBe('/workspace/clients/acme/projects/crm-revamp/changes/reopen-request-2026-01-01T00-00-00-000Z.md');
    expect(request.markdown).toContain('# Reopen / Change Request — CRM Revamp');
    expect(request.markdown).toContain('Source status: Finalized / Closed');
    expect(request.markdown).toContain('Customer requested extra report after sign-off.');
    expect(request.markdown).toContain('## Decision');
    expect(request.markdown).toContain('- [ ] Reject request');
    expect(request.markdown).toContain('- [ ] Quote as Change Request');
    expect(request.markdown).toContain('- [ ] Create new scope');
    expect(request.markdown).toContain('- [ ] Need more information');
    expect(request.markdown).toContain('## Recommended action plan');
    expect(request.markdown).toContain('Review reopen request');
    expect(request.markdown).toContain('Decide: reject / quote CR / create new scope');
    expect(request.markdown).toContain('Protect accepted baseline');
    expect(request.markdown).toContain('not a silent edit');
  });

  it('uses a fallback reason when reason is empty', () => {
    const request = buildCloseoutReopenRequest({
      project_name: 'CRM Revamp',
      project_path: '/workspace/project',
      reason: '   ',
      created_at: '2026-01-01T00:00:00.000Z',
    });

    expect(request.markdown).toContain('Reopen requested after finalized closeout.');
  });
});
