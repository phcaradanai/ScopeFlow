import type { QuotationDraft } from './quotationDraft';

export type PriceBasis = 'min_hours' | 'max_hours' | 'average_hours' | 'manual_fixed';

export interface QuotationPricingInput {
  price_basis: PriceBasis;
  hourly_rate: number;
  manual_fixed_price?: number;
  discount_percent: number;
  tax_percent: number;
  payment_terms: string;
  currency: string;
}

export interface QuotationPricingResult {
  price_basis: PriceBasis;
  currency: string;
  billable_hours: number;
  hourly_rate: number;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  total: number;
  payment_terms: string;
  warnings: string[];
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function money(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function calculateQuotationPricing(draft: QuotationDraft, input: QuotationPricingInput): QuotationPricingResult {
  const warnings: string[] = [];
  const discountPercent = clampPercent(input.discount_percent);
  const taxPercent = clampPercent(input.tax_percent);
  const hourlyRate = Math.max(0, Number.isFinite(input.hourly_rate) ? input.hourly_rate : 0);

  let billableHours = 0;
  let subtotal = 0;

  if (input.price_basis === 'manual_fixed') {
    subtotal = Math.max(0, Number.isFinite(input.manual_fixed_price || 0) ? input.manual_fixed_price || 0 : 0);
    billableHours = 0;
    if (subtotal === 0) warnings.push('ยังไม่ได้กรอก fixed price');
  } else {
    if (input.price_basis === 'min_hours') billableHours = draft.total_man_hours_min;
    if (input.price_basis === 'max_hours') billableHours = draft.total_man_hours_max;
    if (input.price_basis === 'average_hours') billableHours = (draft.total_man_hours_min + draft.total_man_hours_max) / 2;
    subtotal = billableHours * hourlyRate;
    if (hourlyRate === 0) warnings.push('ยังไม่ได้กรอก hourly rate');
    if (billableHours === 0) warnings.push('ยังไม่มี man-hour สำหรับคำนวณราคา');
  }

  if (draft.status !== 'draft_ready') {
    warnings.push('Quotation draft ยังไม่ ready ควรปิด blockers ก่อนส่งลูกค้า');
  }

  if (draft.pricing_blockers.length > 0) {
    warnings.push(`ยังมี pricing blocker ${draft.pricing_blockers.length} รายการ`);
  }

  if (!input.payment_terms.trim()) {
    warnings.push('ยังไม่ได้ระบุ payment terms');
  }

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

  return {
    price_basis: input.price_basis,
    currency: input.currency.trim() || 'THB',
    billable_hours: money(billableHours),
    hourly_rate: money(hourlyRate),
    subtotal: money(subtotal),
    discount_amount: money(discountAmount),
    taxable_amount: money(taxableAmount),
    tax_amount: money(taxAmount),
    total: money(total),
    payment_terms: input.payment_terms.trim(),
    warnings,
  };
}
