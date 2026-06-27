import { describe, expect, it } from 'vitest';
import { getCloseoutFinalizedGuard } from '../closeoutFinalizedGuard';
import type { CloseoutFinalStatus } from '../closeoutFinalStatus';

function finalStatus(overrides: Partial<CloseoutFinalStatus>): CloseoutFinalStatus {
  return {
    kind: 'ready_to_deliver',
    label: 'Ready to Deliver',
    description: 'Ready',
    is_terminal_ready: false,
    ...overrides,
  };
}

describe('closeoutFinalizedGuard', () => {
  it('does not lock delivery actions before finalized', () => {
    const guard = getCloseoutFinalizedGuard(finalStatus({ kind: 'awaiting_customer_acceptance', label: 'Awaiting Acceptance' }));

    expect(guard.is_finalized).toBe(false);
    expect(guard.delivery_actions_disabled).toBe(false);
    expect(guard.lock_reason).toBeNull();
  });

  it('locks delivery actions when finalized', () => {
    const guard = getCloseoutFinalizedGuard(finalStatus({ kind: 'finalized', label: 'Finalized / Closed', is_terminal_ready: true }));

    expect(guard.is_finalized).toBe(true);
    expect(guard.delivery_actions_disabled).toBe(true);
    expect(guard.lock_reason).toContain('Finalized / Closed');
  });
});
