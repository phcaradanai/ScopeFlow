import { describe, it, expect } from 'vitest';
import { calculateQuotationTotals, generateQuotationMarkdown, parseQuotationFormData, QuotationFormData } from '../quotation-builder';

describe('quotation-builder', () => {
  const sampleData: QuotationFormData = {
    title: 'ใบเสนอราคา',
    scope_ref: 'Scope v1.0',
    valid_until: '31/12/2026',
    vat_percent: 7,
    discount_type: 'amount',
    discount_value: 500,
    notes: 'Test notes',
    payment_terms_preset: '50% up front',
    line_items: [
      { id: '1', description: 'Item 1', quantity: 2, unit: 'pcs', unit_price: 1000 }, // 2000
      { id: '2', description: 'Item 2', quantity: 1, unit: 'lot', unit_price: 3000 }, // 3000
    ]
  }; // Subtotal = 5000, Discount = 500, After Discount = 4500, VAT = 315, Grand Total = 4815

  describe('calculateQuotationTotals', () => {
    it('should correctly calculate totals with amount discount and VAT', () => {
      const totals = calculateQuotationTotals(sampleData);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(500);
      expect(totals.subtotalAfterDiscount).toBe(4500);
      expect(totals.vatAmount).toBe(315);
      expect(totals.grandTotal).toBe(4815);
    });

    it('should correctly calculate totals with percent discount', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'percent', discount_value: 10 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(500); // 10% of 5000
      expect(totals.subtotalAfterDiscount).toBe(4500);
      expect(totals.vatAmount).toBe(315);
      expect(totals.grandTotal).toBe(4815);
    });

    it('should clamp percent discount to 100%', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'percent', discount_value: 150 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(5000); // Clamped to 100%
      expect(totals.subtotalAfterDiscount).toBe(0);
      expect(totals.vatAmount).toBe(0);
      expect(totals.grandTotal).toBe(0);
    });

    it('should handle zero discount and zero VAT', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'none', discount_value: 500, vat_percent: 0 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(0);
      expect(totals.subtotalAfterDiscount).toBe(5000);
      expect(totals.vatAmount).toBe(0);
      expect(totals.grandTotal).toBe(5000);
    });

    it('should handle discount amount greater than subtotal', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'amount', discount_value: 10000, vat_percent: 7 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(5000); // Capped at subtotal
      expect(totals.subtotalAfterDiscount).toBe(0);
      expect(totals.vatAmount).toBe(0);
      expect(totals.grandTotal).toBe(0);
    });

    it('should reject negative discount values', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'amount', discount_value: -500 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(0); // Cannot be negative
      expect(totals.subtotalAfterDiscount).toBe(5000);
    });

    it('should support legacy discount migration', () => {
      const data: any = { ...sampleData, discount_type: undefined, discount_value: undefined, discount: 1000 };
      const totals = calculateQuotationTotals(data);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(1000);
      expect(totals.subtotalAfterDiscount).toBe(4000);
    });
  });

  describe('generateQuotationMarkdown', () => {
    it('should generate markdown string with normalized frontmatter and content', () => {
      const companyProfile = {
        provider_name: 'Super Company',
        tax_id: '1234567890123'
      };

      const markdown = generateQuotationMarkdown(sampleData, companyProfile, 'Client XYZ', 'Project Alpha', 'doc-123');
      
      expect(markdown).toContain('form_data:');
      expect(markdown).toContain('discount_type: amount');
      expect(markdown).toContain('discount_value: 500');
      
      expect(markdown).toContain('**หักส่วนลด (Discount)**');
      expect(markdown).toContain('500.00'); // Discount
      expect(markdown).toContain('4,815.00'); // Grand total
    });

    it('should label percent discount in markdown', () => {
      const data: QuotationFormData = { ...sampleData, discount_type: 'percent', discount_value: 15 };
      const markdown = generateQuotationMarkdown(data, null, 'Client XYZ', 'Project Alpha', 'doc-123');
      expect(markdown).toContain('**หักส่วนลด 15% (Discount)**');
    });
  });

  describe('parseQuotationFormData', () => {
    it('should parse form_data back from markdown', () => {
      const markdown = generateQuotationMarkdown(sampleData, null, 'C', 'P', '1');
      const parsedData = parseQuotationFormData(markdown);
      
      expect(parsedData).toBeDefined();
      expect(parsedData?.title).toBe(sampleData.title);
      expect(parsedData?.discount_type).toBe('amount');
      expect(parsedData?.discount_value).toBe(500);
      expect(parsedData?.discount).toBeUndefined();
    });

    it('should migrate legacy discount in frontmatter', () => {
      const legacyYaml = `---
title: ใบเสนอราคา
type: quotation
id: 1
form_data:
  title: ใบเสนอราคา
  discount: 1500
  line_items: []
---
`;
      const parsedData = parseQuotationFormData(legacyYaml);
      expect(parsedData).toBeDefined();
      expect(parsedData?.discount_type).toBe('amount');
      expect(parsedData?.discount_value).toBe(1500);
      expect(parsedData?.discount).toBeUndefined();
    });

    it('should return null if no valid frontmatter', () => {
      const markdown = `# Title\n\nContent only`;
      expect(parseQuotationFormData(markdown)).toBeNull();
    });
  });
});
