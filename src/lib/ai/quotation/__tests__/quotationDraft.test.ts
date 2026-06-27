import { describe, expect, it } from 'vitest';
import { buildQuotationDraft } from '../quotationDraft';
import { buildQuotationDraftMarkdown } from '../quotationDraftMarkdown';
import type { QuoteReadinessBrief } from '../../quotation-readiness/quoteReadinessBridge';

const readiness: QuoteReadinessBrief = {
  status: 'ready',
  readiness_score: 91,
  recommended_pricing_model: 'fixed_price',
  module_estimates: [
    { module: 'Checkout', complexity: 'high', estimated_man_hours_min: 40, estimated_man_hours_max: 80, assumptions: ['ใช้ Omise API พร้อม'], risk_buffer_percent: 30 },
    { module: 'Backoffice', complexity: 'medium', estimated_man_hours_min: 24, estimated_man_hours_max: 48, assumptions: ['ใช้ admin role พื้นฐาน'], risk_buffer_percent: 20 },
  ],
  total_man_hours_min: 64,
  total_man_hours_max: 128,
  pricing_blockers: [],
  quote_assumptions: ['ใช้ Omise API พร้อม', 'ใช้ admin role พื้นฐาน'],
  quote_boundary_clauses: ['ไม่รวม mobile app', 'ไม่รวม custom report เพิ่มเติม'],
  change_request_triggers: ['Promotion/Coupon: เพิ่ม campaign rule ใหม่หลังอนุมัติ scope'],
  acceptance_items: ['Checkout ผ่าน test case ที่ตกลง'],
  recommended_next_action: 'สร้าง Quotation Draft',
};

describe('quotationDraft', () => {
  it('builds a ready quotation draft from quote readiness brief', () => {
    const draft = buildQuotationDraft('E-Commerce', readiness);

    expect(draft.status).toBe('draft_ready');
    expect(draft.title).toBe('Quotation Draft: E-Commerce');
    expect(draft.pricing_model).toBe('fixed_price');
    expect(draft.line_items).toHaveLength(2);
    expect(draft.total_man_hours_min).toBe(64);
    expect(draft.total_man_hours_max).toBe(128);
    expect(draft.exclusions).toContain('ไม่รวม mobile app');
    expect(draft.change_request_triggers[0]).toContain('Promotion/Coupon');
    expect(draft.customer_confirmations_required).toContain('ยืนยัน assumption: ใช้ Omise API พร้อม');
  });

  it('marks the draft as blocked when quote readiness is blocked', () => {
    const draft = buildQuotationDraft('E-Commerce', {
      ...readiness,
      status: 'blocked',
      pricing_blockers: ['ยังมีคำถามก่อนเสนอราคา 1 รายการ'],
    });

    expect(draft.status).toBe('draft_blocked');
    expect(draft.pricing_blockers).toContain('ยังมีคำถามก่อนเสนอราคา 1 รายการ');
    expect(draft.recommended_next_action).toContain('ยังไม่ควรสร้างใบเสนอราคาส่งลูกค้า');
    expect(draft.internal_notes).toContain('ยังไม่ควรส่งเป็นใบเสนอราคาจริงจนกว่า blocker จะถูกปิด');
  });

  it('renders quotation draft markdown without inventing final price', () => {
    const draft = buildQuotationDraft('E-Commerce', readiness);
    const markdown = buildQuotationDraftMarkdown(draft, 'project-1', 'client-1');

    expect(markdown).toContain('type: quotation');
    expect(markdown).toContain('# Quotation Draft: E-Commerce');
    expect(markdown).toContain('64–128 ชั่วโมง');
    expect(markdown).toContain('ยังไม่ใส่ราคาจริง');
    expect(markdown).toContain('ไม่รวม mobile app');
    expect(markdown).toContain('Promotion/Coupon: เพิ่ม campaign rule ใหม่หลังอนุมัติ scope');
    expect(markdown).not.toContain('รวมเป็นเงิน');
  });
});
