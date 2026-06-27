import { describe, expect, it } from 'vitest';
import { buildQuoteReadinessBrief } from '../quoteReadinessBridge';
import { buildQuoteReadinessMarkdown, injectQuoteReadinessMarkdown } from '../quoteReadinessMarkdown';
import type { ScopeControlOutput } from '../../scope-control/scopeControlSchema';
import type { ScopeClosureGateResult } from '../../scope-closure/scopeClosureGate';

const control: ScopeControlOutput = {
  readiness_to_quote: 'ready',
  readiness_score: 88,
  confirmed_scope_items: [{ item: 'Checkout', confidence: 'confirmed', evidence: 'ลูกค้าตอบแล้ว', boundary_note: 'จำกัดตาม scope' }],
  assumed_scope_items: [],
  ambiguous_scope_items: [],
  must_ask_before_quote: [],
  optional_questions: [],
  suggested_boundary_clauses: ['ไม่รวม mobile app', 'ไม่รวม custom report เพิ่มเติม'],
  scope_creep_traps: [{
    item: 'Promotion/Coupon',
    why_risky: 'rule อาจเพิ่มไม่จำกัด',
    how_to_limit: 'จำกัดเฉพาะ discount พื้นฐาน',
    change_request_trigger: 'เพิ่ม campaign rule ใหม่หลังอนุมัติ scope',
  }],
  acceptance_risks: [{
    scope_item: 'Checkout',
    missing_acceptance_criteria: 'ยังไม่มี scenario ตรวจรับละเอียด',
    suggested_acceptance_criteria: 'สั่งซื้อและชำระเงินสำเร็จตาม scenario ที่ตกลง',
  }],
  tor_sections: {
    objective: [],
    deliverables: [],
    requirements: [],
    acceptance_criteria: ['ลูกค้าตรวจรับ checkout ตาม test case ที่ตกลง'],
    exclusions: [],
  },
  estimation_factors: [
    { module: 'Checkout', complexity: 'high', estimated_man_hours_min: 40, estimated_man_hours_max: 80, assumptions: ['ใช้ payment gateway ที่มี API พร้อม'], risk_buffer_percent: 30 },
    { module: 'Backoffice', complexity: 'medium', estimated_man_hours_min: 24, estimated_man_hours_max: 48, assumptions: ['ใช้ role admin แบบพื้นฐาน'], risk_buffer_percent: 20 },
  ],
  cost_reasoning: {
    pricing_blockers: [],
    cost_drivers: ['integration ภายนอก', 'จำนวน module'],
    suggested_pricing_model: 'fixed_price',
    why: 'scope ชัดพอ',
  },
  recommendation: 'เสนอราคาได้',
};

const readyGate: ScopeClosureGateResult = {
  scope_closure_status: 'ready_for_quote',
  closure_score: 90,
  blocking_items: [],
  recommended_next_action: 'พร้อม quote',
  customer_questions: [],
  quote_ready_summary: 'Scope พร้อมสำหรับ quotation เบื้องต้นด้วย pricing model: fixed_price',
  checklist: {
    has_confirmed_scope: true,
    has_no_critical_questions: true,
    has_boundary_clauses: true,
    has_acceptance_criteria: true,
    has_estimation_factors: true,
    has_pricing_model: true,
    has_customer_approval: false,
  },
};

describe('quoteReadinessBridge', () => {
  it('builds a ready quotation readiness brief from closed scope', () => {
    const brief = buildQuoteReadinessBrief(control, readyGate);

    expect(brief.status).toBe('ready');
    expect(brief.recommended_pricing_model).toBe('fixed_price');
    expect(brief.total_man_hours_min).toBe(64);
    expect(brief.total_man_hours_max).toBe(128);
    expect(brief.pricing_blockers).toEqual([]);
    expect(brief.quote_assumptions).toContain('ใช้ payment gateway ที่มี API พร้อม');
    expect(brief.change_request_triggers[0]).toContain('Promotion/Coupon');
    expect(brief.acceptance_items).toContain('ลูกค้าตรวจรับ checkout ตาม test case ที่ตกลง');
  });

  it('marks quote readiness as blocked when scope closure is not ready', () => {
    const brief = buildQuoteReadinessBrief(control, {
      ...readyGate,
      scope_closure_status: 'needs_customer_answers',
      blocking_items: ['ยังมีคำถามก่อนเสนอราคา 1 รายการ'],
    });

    expect(brief.status).toBe('blocked');
    expect(brief.pricing_blockers).toContain('ยังมีคำถามก่อนเสนอราคา 1 รายการ');
    expect(brief.recommended_next_action).toContain('ยังไม่ควรสร้างใบเสนอราคา');
  });

  it('renders and injects quote readiness markdown', () => {
    const brief = buildQuoteReadinessBrief(control, readyGate);
    const markdown = buildQuoteReadinessMarkdown(brief);
    const scope = '# Scope\n\n<!-- customer-question-close-loop:start -->\n## Customer Question Close Loop\n<!-- customer-question-close-loop:end -->\n';
    const injected = injectQuoteReadinessMarkdown(scope, brief);

    expect(markdown).toContain('## Quotation Readiness Brief');
    expect(markdown).toContain('64–128 ชั่วโมง');
    expect(markdown).toContain('fixed_price');
    expect(injected.indexOf('## Customer Question Close Loop')).toBeLessThan(injected.indexOf('## Quotation Readiness Brief'));
    expect(injected.match(/## Quotation Readiness Brief/g)?.length).toBe(1);
  });

  it('replaces existing quote readiness markdown instead of duplicating it', () => {
    const first = injectQuoteReadinessMarkdown('# Scope', buildQuoteReadinessBrief(control, readyGate));
    const second = injectQuoteReadinessMarkdown(first, buildQuoteReadinessBrief({
      ...control,
      cost_reasoning: {
        ...control.cost_reasoning,
        suggested_pricing_model: 'phase_based',
      },
    }, readyGate));

    expect(second.match(/## Quotation Readiness Brief/g)?.length).toBe(1);
    expect(second).toContain('phase_based');
    expect(second).not.toContain('Pricing Model ที่แนะนำ: **fixed_price**');
  });
});
