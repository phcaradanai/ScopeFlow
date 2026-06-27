import { describe, expect, it } from 'vitest';
import { calculateQuotationPricing } from '../quotationPricing';
import type { QuotationDraft } from '../quotationDraft';

const draft: QuotationDraft = {
  status: 'draft_ready',
  title: 'Quotation Draft: E-Commerce',
  pricing_model: 'fixed_price',
  line_items: [],
  total_man_hours_min: 64,
  total_man_hours_max: 128,
  assumptions: [],
  exclusions: [],
  change_request_triggers: [],
  acceptance_criteria: [],
  pricing_blockers: [],
  customer_confirmations_required: [],
  internal_notes: [],
  recommended_next_action: 'ตรวจราคา',
};

describe('quotationPricing', () => {
  it('calculates price from average hours and user-provided hourly rate', () => {
    const result = calculateQuotationPricing(draft, {
      price_basis: 'average_hours',
      hourly_rate: 1000,
      discount_percent: 10,
      tax_percent: 7,
      payment_terms: '50% deposit / 50% before delivery',
      currency: 'THB',
    });

    expect(result.billable_hours).toBe(96);
    expect(result.subtotal).toBe(96000);
    expect(result.discount_amount).toBe(9600);
    expect(result.taxable_amount).toBe(86400);
    expect(result.tax_amount).toBe(6048);
    expect(result.total).toBe(92448);
    expect(result.warnings).toEqual([]);
  });

  it('uses manual fixed price when selected', () => {
    const result = calculateQuotationPricing(draft, {
      price_basis: 'manual_fixed',
      hourly_rate: 999999,
      manual_fixed_price: 120000,
      discount_percent: 0,
      tax_percent: 7,
      payment_terms: '100% before delivery',
      currency: 'THB',
    });

    expect(result.billable_hours).toBe(0);
    expect(result.subtotal).toBe(120000);
    expect(result.tax_amount).toBe(8400);
    expect(result.total).toBe(128400);
  });

  it('warns when hourly rate or payment terms are missing', () => {
    const result = calculateQuotationPricing(draft, {
      price_basis: 'max_hours',
      hourly_rate: 0,
      discount_percent: 0,
      tax_percent: 0,
      payment_terms: '',
      currency: '',
    });

    expect(result.currency).toBe('THB');
    expect(result.warnings).toContain('ยังไม่ได้กรอก hourly rate');
    expect(result.warnings).toContain('ยังไม่ได้ระบุ payment terms');
  });

  it('warns when quotation draft still has blockers', () => {
    const result = calculateQuotationPricing({
      ...draft,
      status: 'draft_needs_review',
      pricing_blockers: ['ยังไม่ยืนยัน payment gateway'],
    }, {
      price_basis: 'min_hours',
      hourly_rate: 1000,
      discount_percent: 0,
      tax_percent: 0,
      payment_terms: '50/50',
      currency: 'THB',
    });

    expect(result.warnings).toContain('Quotation draft ยังไม่ ready ควรปิด blockers ก่อนส่งลูกค้า');
    expect(result.warnings).toContain('ยังมี pricing blocker 1 รายการ');
  });
});
