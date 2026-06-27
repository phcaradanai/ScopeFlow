import { describe, expect, it } from 'vitest';
import { buildDocumentLifecycleSummary } from '../documentLifecycle';

describe('documentLifecycle', () => {
  it('shows missing brief as first next action when nothing exists', () => {
    const summary = buildDocumentLifecycleSummary({});

    expect(summary.can_close_work).toBe(false);
    expect(summary.items.find(item => item.id === 'brief')?.status).toBe('missing');
    expect(summary.next_action).toContain('สร้าง Brief Draft');
  });

  it('shows scope baseline blocked when quotation approved but baseline not ready', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
    });

    expect(summary.items.find(item => item.id === 'quotation')?.status).toBe('approved');
    expect(summary.items.find(item => item.id === 'scope_baseline')?.status).toBe('blocked');
    expect(summary.blocked_count).toBeGreaterThan(0);
    expect(summary.next_action).toContain('สร้าง Scope Baseline');
  });

  it('shows change baseline blocked when CR approved but change baseline missing', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      hasChangeRequest: true,
      changeRequestApproved: true,
    });

    expect(summary.items.find(item => item.id === 'change_request')?.status).toBe('approved');
    expect(summary.items.find(item => item.id === 'change_baseline')?.status).toBe('blocked');
    expect(summary.next_action).toContain('สร้าง Change Baseline');
  });

  it('allows close work only when acceptance is signed off and no blockers remain', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceSignedOff: true,
    });

    expect(summary.items.find(item => item.id === 'acceptance')?.status).toBe('signed_off');
    expect(summary.can_close_work).toBe(true);
    expect(summary.next_action).toContain('ปิดได้แล้ว');
  });

  it('does not require CR documents when no CR exists', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceReadyForSignoff: true,
    });

    expect(summary.items.find(item => item.id === 'change_request')?.status).toBe('missing');
    expect(summary.items.find(item => item.id === 'change_baseline')?.status).toBe('missing');
    expect(summary.next_action).toContain('ส่ง acceptance');
  });
});
