import { describe, expect, it } from 'vitest';
import { getCloseoutFinalStatus } from '../closeoutFinalStatus';
import type { CloseoutStatusSummary } from '../closeoutStatus';

function status(overrides: Partial<CloseoutStatusSummary>): CloseoutStatusSummary {
  return {
    closeout_pack_created: false,
    closeout_pack_missing_files: [],
    export_index_created: false,
    export_ready: false,
    status_label: 'not_started',
    recommended_next_action: 'Next',
    ...overrides,
  };
}

describe('closeoutFinalStatus', () => {
  it('returns not ready before export package is ready', () => {
    const finalStatus = getCloseoutFinalStatus(status({ export_ready: false }));

    expect(finalStatus.kind).toBe('not_ready');
    expect(finalStatus.label).toBe('Not Ready');
    expect(finalStatus.is_terminal_ready).toBe(false);
  });

  it('returns ready to deliver when export package is ready but not sent', () => {
    const finalStatus = getCloseoutFinalStatus(status({ export_ready: true, status_label: 'export_ready' }));

    expect(finalStatus.kind).toBe('ready_to_deliver');
    expect(finalStatus.label).toBe('Ready to Deliver');
    expect(finalStatus.is_terminal_ready).toBe(false);
  });

  it('returns delivery sent when package was marked sent', () => {
    const finalStatus = getCloseoutFinalStatus(status({ export_ready: true, status_label: 'export_ready' }), {
      project_path: '/workspace/project',
      status: 'package_sent',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(finalStatus.kind).toBe('delivery_sent');
    expect(finalStatus.label).toBe('Delivery Sent');
    expect(finalStatus.is_terminal_ready).toBe(true);
  });

  it('returns awaiting acceptance when package is pending customer acceptance', () => {
    const finalStatus = getCloseoutFinalStatus(status({ export_ready: true, status_label: 'export_ready' }), {
      project_path: '/workspace/project',
      status: 'pending_customer_acceptance',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(finalStatus.kind).toBe('awaiting_customer_acceptance');
    expect(finalStatus.label).toBe('Awaiting Acceptance');
    expect(finalStatus.is_terminal_ready).toBe(true);
  });

  it('returns finalized when customer acceptance was received', () => {
    const finalStatus = getCloseoutFinalStatus(status({ export_ready: true, status_label: 'export_ready' }), {
      project_path: '/workspace/project',
      status: 'acceptance_received',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(finalStatus.kind).toBe('finalized');
    expect(finalStatus.label).toBe('Finalized / Closed');
    expect(finalStatus.description).toContain('ปิดได้');
    expect(finalStatus.is_terminal_ready).toBe(true);
  });
});
