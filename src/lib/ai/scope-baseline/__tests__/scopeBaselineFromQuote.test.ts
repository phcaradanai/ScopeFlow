import { describe, expect, it } from 'vitest';
import { evaluateQuotationApproval } from '../../quotation/quotationApproval';
import type { QuotationDraft } from '../../quotation/quotationDraft';
import type { QuotationPricingResult } from '../../quotation/quotationPricing';
import { buildScopeBaselineFromApprovedQuote } from '../scopeBaselineFromQuote';
import { buildScopeBaselineMarkdown, injectScopeBaselineMarkdown } from '../scopeBaselineMarkdown';

const quotation: QuotationDraft = {
  status: 'draft_ready',
  title: 'Quotation Draft: E-Commerce',
  pricing_model: 'fixed_price',
  line_items: [],
  total_man_hours_min: 64,
  total_man_hours_max: 128,
  assumptions: ['ลูกค้ามี merchant account แล้ว'],
  exclusions: ['ไม่รวม mobile app'],
  change_request_triggers: ['เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR'],
  acceptance_criteria: ['ลูกค้าทดสอบ checkout สำเร็จ'],
  pricing_blockers: [],
  customer_confirmations_required: [],
  internal_notes: [],
  recommended_next_action: 'ตรวจราคา',
};

const pricing: QuotationPricingResult = {
  price_basis: 'average_hours',
  currency: 'THB',
  billable_hours: 96,
  hourly_rate: 1000,
  subtotal: 96000,
  discount_amount: 0,
  taxable_amount: 96000,
  tax_amount: 6720,
  total: 102720,
  payment_terms: '50% deposit / 50% before delivery',
  warnings: [],
};

describe('scopeBaselineFromQuote', () => {
  it('builds baseline from approved quotation', () => {
    const approval = evaluateQuotationApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed quote',
      approver_name: 'Client Owner',
    });

    const baseline = buildScopeBaselineFromApprovedQuote({
      quotation_path: 'baseline/quotation-draft-v1.0.md',
      scope_path: 'baseline/scope-v1.0.md',
      quotation,
      pricing,
      approval,
    });

    expect(baseline.status).toBe('baseline_ready');
    expect(baseline.locked_total).toBe(102720);
    expect(baseline.locked_exclusions).toContain('ไม่รวม mobile app');
    expect(baseline.change_request_triggers).toContain('เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR');
    expect(baseline.warnings).toEqual([]);
  });

  it('blocks baseline when quotation is not approved', () => {
    const approval = evaluateQuotationApproval({ status: 'sent', sent_at: '2026-06-27' });
    const baseline = buildScopeBaselineFromApprovedQuote({
      quotation_path: 'baseline/quotation-draft-v1.0.md',
      scope_path: 'baseline/scope-v1.0.md',
      quotation,
      pricing,
      approval,
    });

    expect(baseline.status).toBe('blocked');
    expect(baseline.warnings).toContain('Quotation ยังไม่ approved จึงยังไม่ควรล็อก Scope Baseline');
  });

  it('renders baseline markdown', () => {
    const approval = evaluateQuotationApproval({ status: 'approved', approved_at: '2026-06-27', approval_ref: 'signed quote', approver_name: 'Client Owner' });
    const baseline = buildScopeBaselineFromApprovedQuote({ quotation_path: 'baseline/quotation-draft-v1.0.md', scope_path: 'baseline/scope-v1.0.md', quotation, pricing, approval });
    const markdown = buildScopeBaselineMarkdown(baseline);

    expect(markdown).toContain('## Scope Baseline From Approved Quote');
    expect(markdown).toContain('THB 102,720.00');
    expect(markdown).toContain('signed quote');
    expect(markdown).toContain('เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR');
  });

  it('injects baseline after quotation approval lock', () => {
    const approval = evaluateQuotationApproval({ status: 'approved', approved_at: '2026-06-27', approval_ref: 'signed quote', approver_name: 'Client Owner' });
    const baseline = buildScopeBaselineFromApprovedQuote({ quotation_path: 'baseline/quotation-draft-v1.0.md', scope_path: 'baseline/scope-v1.0.md', quotation, pricing, approval });
    const quotationMarkdown = '# Quote\n\n<!-- quotation-approval-lock:start -->\n## Quotation Approval Lock\n<!-- quotation-approval-lock:end -->\n';
    const injected = injectScopeBaselineMarkdown(quotationMarkdown, baseline);

    expect(injected.indexOf('## Quotation Approval Lock')).toBeLessThan(injected.indexOf('## Scope Baseline From Approved Quote'));
    expect(injected.match(/## Scope Baseline From Approved Quote/g)?.length).toBe(1);
  });

  it('replaces existing baseline instead of duplicating it', () => {
    const approval = evaluateQuotationApproval({ status: 'approved', approved_at: '2026-06-27', approval_ref: 'signed quote', approver_name: 'Client Owner' });
    const baseline = buildScopeBaselineFromApprovedQuote({ quotation_path: 'baseline/quotation-draft-v1.0.md', scope_path: 'baseline/scope-v1.0.md', quotation, pricing, approval });
    const first = injectScopeBaselineMarkdown('# Quote', baseline);
    const second = injectScopeBaselineMarkdown(first, { ...baseline, approval_ref: 'updated approval ref' });

    expect(second.match(/## Scope Baseline From Approved Quote/g)?.length).toBe(1);
    expect(second).toContain('updated approval ref');
    expect(second).not.toContain('signed quote');
  });
});
