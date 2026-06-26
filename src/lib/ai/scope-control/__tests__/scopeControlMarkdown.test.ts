import { describe, expect, it } from 'vitest';
import { buildScopeControlMarkdown, injectScopeControlMarkdown } from '../scopeControlMarkdown';
import type { ScopeControlOutput } from '../scopeControlSchema';

const control: ScopeControlOutput = {
  readiness_to_quote: 'risky',
  readiness_score: 52,
  confirmed_scope_items: [],
  assumed_scope_items: [],
  ambiguous_scope_items: [],
  must_ask_before_quote: ['ยืนยัน payment gateway', 'ยืนยันจำนวนสินค้า'],
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
    missing_acceptance_criteria: 'ยังไม่มี scenario ตรวจรับ',
    suggested_acceptance_criteria: 'สั่งซื้อและชำระเงินสำเร็จตาม scenario ที่ตกลง',
  }],
  tor_sections: {
    objective: [],
    deliverables: [],
    requirements: [],
    acceptance_criteria: [],
    exclusions: [],
  },
  estimation_factors: [{
    module: 'Checkout',
    complexity: 'high',
    estimated_man_hours_min: 40,
    estimated_man_hours_max: 80,
    assumptions: ['ใช้ payment gateway ที่มี API พร้อม'],
    risk_buffer_percent: 30,
  }],
  cost_reasoning: {
    pricing_blockers: ['ยังไม่รู้ payment gateway'],
    cost_drivers: ['integration ภายนอก', 'business rule'],
    suggested_pricing_model: 'phase_based',
    why: 'ยังมีความเสี่ยงและข้อมูลไม่ครบ',
  },
  recommendation: 'ควรถามข้อมูลก่อนเสนอราคา fixed price ทั้งก้อน',
};

describe('scopeControlMarkdown', () => {
  it('builds a scope control markdown section', () => {
    const markdown = buildScopeControlMarkdown(control);

    expect(markdown).toContain('<!-- scope-control-summary:start -->');
    expect(markdown).toContain('## Scope Control Summary');
    expect(markdown).toContain('เสนอได้แต่เสี่ยง');
    expect(markdown).toContain('ยืนยัน payment gateway');
    expect(markdown).toContain('ไม่รวม mobile app');
    expect(markdown).toContain('Promotion/Coupon');
    expect(markdown).toContain('40–80 ชั่วโมง');
    expect(markdown).toContain('phase_based');
    expect(markdown).toContain('<!-- scope-control-summary:end -->');
  });

  it('injects the scope control section at the end of a scope document', () => {
    const scope = '# Scope Draft\n\n## In Scope\n\n- Checkout\n';
    const result = injectScopeControlMarkdown(scope, control);

    expect(result).toContain('# Scope Draft');
    expect(result).toContain('## In Scope');
    expect(result).toContain('## Scope Control Summary');
    expect(result.endsWith('\n')).toBe(true);
  });

  it('replaces an existing generated section instead of duplicating it', () => {
    const first = injectScopeControlMarkdown('# Scope Draft', control);
    const second = injectScopeControlMarkdown(first, {
      ...control,
      readiness_to_quote: 'not_ready',
      readiness_score: 20,
      recommendation: 'ยังไม่ควรเสนอราคา',
    });

    expect(second.match(/## Scope Control Summary/g)?.length).toBe(1);
    expect(second).toContain('ยังไม่ควรเสนอราคา');
    expect(second).not.toContain('ควรถามข้อมูลก่อนเสนอราคา fixed price ทั้งก้อน');
  });
});
