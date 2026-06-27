import { describe, expect, it } from 'vitest';
import { buildFinalQuoteSummaryMarkdown, injectFinalQuoteSummaryMarkdown } from '../quotationFinalMarkdown';
import type { QuotationPricingResult } from '../quotationPricing';

const result: QuotationPricingResult = {
  price_basis: 'average_hours',
  currency: 'THB',
  billable_hours: 96,
  hourly_rate: 1000,
  subtotal: 96000,
  discount_amount: 9600,
  taxable_amount: 86400,
  tax_amount: 6048,
  total: 92448,
  payment_terms: '50% deposit / 50% before delivery',
  warnings: [],
};

describe('quotationFinalMarkdown', () => {
  it('builds final quote summary markdown from user-entered pricing result', () => {
    const markdown = buildFinalQuoteSummaryMarkdown(result);

    expect(markdown).toContain('## Final Quote Summary');
    expect(markdown).toContain('Price Basis: **average_hours**');
    expect(markdown).toContain('THB 96,000.00');
    expect(markdown).toContain('THB 92,448.00');
    expect(markdown).toContain('50% deposit / 50% before delivery');
    expect(markdown).toContain('ไม่มี pricing warning หลัก');
  });

  it('injects final quote summary before quote status when available', () => {
    const quotation = '# Quotation Draft\n\n## Quote Status\n\n- Status: draft_ready\n';
    const injected = injectFinalQuoteSummaryMarkdown(quotation, result);

    expect(injected.indexOf('## Final Quote Summary')).toBeLessThan(injected.indexOf('## Quote Status'));
    expect(injected.match(/## Final Quote Summary/g)?.length).toBe(1);
  });

  it('replaces an existing final quote summary instead of duplicating it', () => {
    const first = injectFinalQuoteSummaryMarkdown('# Quote', result);
    const second = injectFinalQuoteSummaryMarkdown(first, {
      ...result,
      total: 100000,
      warnings: ['ต้องตรวจภาษีก่อนส่งลูกค้า'],
    });

    expect(second.match(/## Final Quote Summary/g)?.length).toBe(1);
    expect(second).toContain('THB 100,000.00');
    expect(second).toContain('ต้องตรวจภาษีก่อนส่งลูกค้า');
    expect(second).not.toContain('THB 92,448.00');
  });
});
