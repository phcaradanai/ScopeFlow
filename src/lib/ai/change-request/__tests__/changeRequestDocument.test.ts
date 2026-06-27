import { describe, expect, it } from 'vitest';
import type { ScopeBaselineFromQuote } from '../../scope-baseline/scopeBaselineFromQuote';
import { detectChangeRequest } from '../changeRequestDetection';
import { buildChangeRequestDocument, buildChangeRequestDocumentMarkdown } from '../changeRequestDocument';

const baseline: ScopeBaselineFromQuote = {
  status: 'baseline_ready',
  source_quotation_path: 'baseline/quotation-draft-v1.0.md',
  source_scope_path: 'baseline/scope-v1.0.md',
  locked_total: 100000,
  locked_currency: 'THB',
  locked_payment_terms: '50% deposit / 50% before delivery',
  locked_pricing_model: 'fixed_price',
  locked_assumptions: ['ลูกค้ามี merchant account พร้อมใช้งาน'],
  locked_exclusions: ['ไม่รวม mobile app'],
  locked_acceptance_criteria: ['checkout สำเร็จด้วย payment gateway ที่ตกลงไว้'],
  change_request_triggers: ['เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR'],
  editable_after_approval: ['แก้ typo'],
  locked_after_approval: ['ราคา total และ payment terms', 'acceptance criteria'],
  approval_ref: 'signed quote',
  approved_at: '2026-06-27',
  approver_name: 'Client Owner',
  warnings: [],
  recommended_next_action: 'ใช้ baseline คุม scope',
};

describe('changeRequestDocument', () => {
  it('builds approval-required CR document for likely change request', () => {
    const newRequest = 'ลูกค้าขอเพิ่ม mobile app';
    const detection = detectChangeRequest({ new_request: newRequest, baseline });
    const document = buildChangeRequestDocument({
      request_id: 'CR-001',
      title: 'CR: เพิ่ม Mobile App',
      new_request: newRequest,
      baseline,
      detection,
      requested_by: 'Client Owner',
      requested_at: '2026-06-27',
    });

    expect(document.request_id).toBe('CR-001');
    expect(document.status).toBe('approval_required');
    expect(document.approval_required_before_work).toBe(true);
    expect(document.is_change_request).toBe(true);
    expect(document.source_quotation_path).toBe('baseline/quotation-draft-v1.0.md');
    expect(document.recommended_next_action).toContain('อนุมัติ CR/DCR');
  });

  it('builds not-required document for in-scope request', () => {
    const newRequest = 'แก้คำผิดในหน้า checkout';
    const detection = detectChangeRequest({ new_request: newRequest, baseline });
    const document = buildChangeRequestDocument({ new_request: newRequest, baseline, detection });

    expect(document.status).toBe('not_required');
    expect(document.approval_required_before_work).toBe(false);
    expect(document.is_change_request).toBe(false);
  });

  it('builds needs-review document when baseline is blocked', () => {
    const newRequest = 'ขอเพิ่ม payment gateway ใหม่';
    const detection = detectChangeRequest({ new_request: newRequest, baseline: { ...baseline, status: 'blocked' } });
    const document = buildChangeRequestDocument({ new_request: newRequest, baseline: { ...baseline, status: 'blocked' }, detection });

    expect(document.status).toBe('needs_review');
    expect(document.approval_required_before_work).toBe(false);
    expect(document.warnings).toContain('Scope Baseline ยังไม่พร้อมใช้ตรวจ change request');
  });

  it('renders markdown document', () => {
    const newRequest = 'ลูกค้าขอเพิ่ม mobile app';
    const detection = detectChangeRequest({ new_request: newRequest, baseline });
    const document = buildChangeRequestDocument({ request_id: 'CR-001', new_request: newRequest, baseline, detection });
    const markdown = buildChangeRequestDocumentMarkdown(document);

    expect(markdown).toContain('# Change Request / DCR Draft');
    expect(markdown).toContain('Request ID: **CR-001**');
    expect(markdown).toContain('Approval Required Before Work: **yes**');
    expect(markdown).toContain('ไม่รวม mobile app');
  });
});
