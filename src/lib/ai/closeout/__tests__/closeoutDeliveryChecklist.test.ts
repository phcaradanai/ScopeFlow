import { describe, expect, it } from 'vitest';
import { getCloseoutDeliveryChecklist } from '../closeoutDeliveryChecklist';
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

describe('closeoutDeliveryChecklist', () => {
  it('locks delivery checklist before export is ready', () => {
    const checklist = getCloseoutDeliveryChecklist(status({ export_ready: false }));

    expect(checklist.ready_for_delivery).toBe(false);
    expect(checklist.title).toBe('Delivery checklist locked');
    expect(checklist.description).toContain('Export Index');
    expect(checklist.items.every(item => item.done === false)).toBe(true);
  });

  it('marks package review steps done when export is ready', () => {
    const checklist = getCloseoutDeliveryChecklist(status({
      closeout_pack_created: true,
      export_index_created: true,
      export_ready: true,
      status_label: 'export_ready',
    }));

    expect(checklist.ready_for_delivery).toBe(true);
    expect(checklist.title).toBe('Export Ready checklist');
    expect(checklist.items.find(item => item.id === 'open_export_folder')?.done).toBe(true);
    expect(checklist.items.find(item => item.id === 'review_package_index')?.done).toBe(true);
    expect(checklist.items.find(item => item.id === 'attach_package_to_customer_message')?.done).toBe(false);
    expect(checklist.items.find(item => item.id === 'record_delivery_or_pending_acceptance')?.done).toBe(false);
  });
});
