import { describe, expect, it } from 'vitest';
import type { ScopeBaselineFromQuote } from '../../scope-baseline/scopeBaselineFromQuote';
import { evaluateChangeRequestApproval } from '../changeRequestApproval';
import { buildChangeRequestBaseline } from '../changeRequestBaseline';
import { buildChangeRequestBaselineMarkdown, injectChangeRequestBaselineMarkdown } from '../changeRequestBaselineMarkdown';
import { detectChangeRequest } from '../changeRequestDetection';
import { buildChangeRequestDocument } from '../changeRequestDocument';

const scopeBaseline: ScopeBaselineFromQuote = {
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

function buildApprovedCrDocument() {
  const newRequest = 'ลูกค้าขอเพิ่ม mobile app';
  const detection = detectChangeRequest({ new_request: newRequest, baseline: scopeBaseline });
  return buildChangeRequestDocument({
    request_id: 'CR-001',
    new_request: newRequest,
    baseline: scopeBaseline,
    detection,
  });
}

describe('changeRequestBaseline', () => {
  it('builds baseline-ready change baseline from approved CR/DCR', () => {
    const document = buildApprovedCrDocument();
    const approval = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });

    const baseline = buildChangeRequestBaseline({
      source_change_request_path: 'changes/CR-001-draft.md',
      document,
      approval,
    });

    expect(baseline.status).toBe('baseline_ready');
    expect(baseline.request_id).toBe('CR-001');
    expect(baseline.locked_new_request).toContain('mobile app');
    expect(baseline.approval_ref).toBe('signed CR-001');
    expect(baseline.warnings).toHaveLength(0);
  });

  it('blocks baseline when CR/DCR approval is incomplete', () => {
    const document = buildApprovedCrDocument();
    const approval = evaluateChangeRequestApproval({ status: 'approved' });

    const baseline = buildChangeRequestBaseline({
      source_change_request_path: 'changes/CR-001-draft.md',
      document,
      approval,
    });

    expect(baseline.status).toBe('blocked');
    expect(baseline.warnings).toContain('CR/DCR ยังไม่ approved พร้อมหลักฐานครบ จึงยังไม่ควรล็อก Change Baseline');
  });

  it('blocks baseline for non-change request documents', () => {
    const newRequest = 'แก้คำผิดในหน้า checkout';
    const detection = detectChangeRequest({ new_request: newRequest, baseline: scopeBaseline });
    const document = buildChangeRequestDocument({ request_id: 'CR-002', new_request: newRequest, baseline: scopeBaseline, detection });
    const approval = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-002',
      approver_name: 'Client Owner',
    });

    const baseline = buildChangeRequestBaseline({
      source_change_request_path: 'changes/CR-002-draft.md',
      document,
      approval,
    });

    expect(baseline.status).toBe('blocked');
    expect(baseline.warnings).toContain('เอกสารนี้ไม่ได้ถูกจัดว่าเป็น change request จึงอาจไม่ต้องสร้าง Change Baseline');
  });

  it('renders change baseline markdown', () => {
    const document = buildApprovedCrDocument();
    const approval = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });
    const baseline = buildChangeRequestBaseline({ source_change_request_path: 'changes/CR-001-draft.md', document, approval });
    const markdown = buildChangeRequestBaselineMarkdown(baseline);

    expect(markdown).toContain('## Change Baseline From Approved CR/DCR');
    expect(markdown).toContain('Request ID: **CR-001**');
    expect(markdown).toContain('Status: **baseline_ready**');
    expect(markdown).toContain('mobile app');
  });

  it('injects change baseline after approval lock marker', () => {
    const document = buildApprovedCrDocument();
    const approval = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });
    const baseline = buildChangeRequestBaseline({ source_change_request_path: 'changes/CR-001-draft.md', document, approval });
    const markdown = 'before\n<!-- change-request-approval-lock:end -->\nafter';
    const injected = injectChangeRequestBaselineMarkdown(markdown, baseline);

    expect(injected.indexOf('<!-- change-request-approval-lock:end -->')).toBeLessThan(injected.indexOf('## Change Baseline From Approved CR/DCR'));
  });

  it('replaces existing change baseline instead of duplicating it', () => {
    const document = buildApprovedCrDocument();
    const approval = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });
    const baseline = buildChangeRequestBaseline({ source_change_request_path: 'changes/CR-001-draft.md', document, approval });
    const first = injectChangeRequestBaselineMarkdown('# CR', baseline);
    const second = injectChangeRequestBaselineMarkdown(first, baseline);

    expect(second.match(/## Change Baseline From Approved CR\/DCR/g)?.length).toBe(1);
  });
});
