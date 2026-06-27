import { describe, expect, it } from 'vitest';
import { evaluateQuotationApproval } from '../quotationApproval';
import { buildQuotationApprovalMarkdown, injectQuotationApprovalMarkdown } from '../quotationApprovalMarkdown';

describe('quotationApproval', () => {
  it('marks approved quotation as locked and warns when approval evidence is missing', () => {
    const result = evaluateQuotationApproval({ status: 'approved' });

    expect(result.locked).toBe(true);
    expect(result.can_send).toBe(false);
    expect(result.can_revise).toBe(false);
    expect(result.warnings).toContain('ยังไม่ได้ระบุวันที่ลูกค้าอนุมัติ');
    expect(result.warnings).toContain('ยังไม่ได้ระบุหลักฐานอ้างอิงการอนุมัติ');
    expect(result.warnings).toContain('ยังไม่ได้ระบุผู้อนุมัติ');
  });

  it('allows sending only from ready_to_send', () => {
    const result = evaluateQuotationApproval({ status: 'ready_to_send' });

    expect(result.locked).toBe(false);
    expect(result.can_send).toBe(true);
    expect(result.can_revise).toBe(true);
    expect(result.recommended_next_action).toContain('ส่ง quotation ให้ลูกค้า');
  });

  it('renders approval lock markdown', () => {
    const result = evaluateQuotationApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'email approval from client',
      approver_name: 'Client Owner',
    });
    const markdown = buildQuotationApprovalMarkdown(result);

    expect(markdown).toContain('## Quotation Approval Lock');
    expect(markdown).toContain('Status: **approved**');
    expect(markdown).toContain('Locked: **yes**');
    expect(markdown).toContain('email approval from client');
    expect(markdown).toContain('ไม่มี warning หลัก');
  });

  it('injects approval lock after final quote summary when available', () => {
    const result = evaluateQuotationApproval({ status: 'sent', sent_at: '2026-06-27' });
    const quotation = '# Quotation\n\n<!-- final-quote-summary:start -->\n## Final Quote Summary\n<!-- final-quote-summary:end -->\n\n## Quote Status';
    const injected = injectQuotationApprovalMarkdown(quotation, result);

    expect(injected.indexOf('## Final Quote Summary')).toBeLessThan(injected.indexOf('## Quotation Approval Lock'));
    expect(injected.indexOf('## Quotation Approval Lock')).toBeLessThan(injected.indexOf('## Quote Status'));
    expect(injected.match(/## Quotation Approval Lock/g)?.length).toBe(1);
  });

  it('replaces existing approval lock instead of duplicating it', () => {
    const first = injectQuotationApprovalMarkdown('# Quote', evaluateQuotationApproval({ status: 'draft' }));
    const second = injectQuotationApprovalMarkdown(first, evaluateQuotationApproval({ status: 'approved', approved_at: '2026-06-27', approval_ref: 'signed quote', approver_name: 'CEO' }));

    expect(second.match(/## Quotation Approval Lock/g)?.length).toBe(1);
    expect(second).toContain('Status: **approved**');
    expect(second).toContain('signed quote');
    expect(second).not.toContain('Status: **draft**');
  });
});
