import { describe, expect, it } from 'vitest';
import { getRuleBasedScopeControl } from '../scopeControlFallback';
import { validateScopeControl } from '../scopeControlValidator';
import type { ScopeDigestOutput } from '../../scope-digest/scopeDigestSchema';

const ecommerceDigest: ScopeDigestOutput = {
  detected_project_type: 'เว็บขายของ',
  confidence: 'medium',
  understanding: ['ลูกค้าต้องการระบบร้านค้าออนไลน์'],
  confirmed_facts: ['ต้องมีตะกร้าสินค้า', 'ต้องมีระบบหลังบ้าน', 'ต้องมีรายงานยอดขาย'],
  assumptions: ['อาจต้องมีระบบสมาชิก', 'อาจต้องตัดสต็อกอัตโนมัติ'],
  unclear_points: ['ยังไม่ชัดว่าใช้ payment gateway ใด', 'ยังไม่ชัดว่ามีสินค้ากี่รายการ', 'ยังไม่ชัดว่าต้อง import สินค้าเดิมหรือไม่'],
  questions_to_ask: ['ต้องการชำระเงินช่องทางใด'],
  likely_in_scope: ['ระบบจัดการสินค้า', 'ตะกร้าสินค้า', 'ชำระเงิน', 'รายงานยอดขาย'],
  likely_out_of_scope: ['mobile app หากไม่ระบุ'],
  scope_creep_risks: ['promotion/coupon อาจบานปลาย', 'report อาจเพิ่มไม่จำกัด'],
  suggested_next_documents: ['Scope of Work', 'Quotation'],
};

describe('scopeControl', () => {
  it('marks ambiguous ecommerce requests as risky or not ready before quote', () => {
    const result = getRuleBasedScopeControl(
      'อยากทำเว็บขายของ มีตะกร้า จ่ายเงิน ดูรายงาน และจัดการสต็อก',
      ecommerceDigest
    );

    expect(['not_ready', 'risky']).toContain(result.readiness_to_quote);
    expect(result.must_ask_before_quote).toEqual(expect.arrayContaining([
      'ต้องการชำระเงินช่องทางใด',
      'มีสินค้าประมาณกี่รายการ และมี variant เช่น สี/ไซซ์หรือไม่',
    ]));
    expect(result.suggested_boundary_clauses).toContain('ไม่รวม mobile app หากไม่ระบุ');
    expect(result.suggested_boundary_clauses).toContain('ไม่รวมค่า payment gateway, merchant account, transaction fee และขั้นตอนสมัครบริการภายนอก');
    expect(result.cost_reasoning.pricing_blockers.length).toBeGreaterThan(0);
  });

  it('creates man-hour estimation factors with risk buffers', () => {
    const result = getRuleBasedScopeControl(
      'อยากทำเว็บขายของ มีตะกร้า จ่ายเงิน ดูรายงาน และจัดการสต็อก',
      ecommerceDigest
    );

    expect(result.estimation_factors.length).toBeGreaterThanOrEqual(3);
    expect(result.estimation_factors[0]).toMatchObject({
      module: 'Product / Catalog Management',
      complexity: 'medium',
    });
    expect(result.estimation_factors.every(factor => factor.estimated_man_hours_max >= factor.estimated_man_hours_min)).toBe(true);
    expect(result.estimation_factors.some(factor => factor.risk_buffer_percent >= 20)).toBe(true);
  });

  it('creates scope creep traps with change request triggers', () => {
    const result = getRuleBasedScopeControl('เว็บขายของ', ecommerceDigest);

    expect(result.scope_creep_traps.length).toBeGreaterThan(0);
    expect(result.scope_creep_traps[0].change_request_trigger).toContain('Change Request');
    expect(result.acceptance_risks[0].suggested_acceptance_criteria).toContain('scenario');
  });

  it('validates and normalizes AI JSON output', () => {
    const raw = JSON.stringify({
      readiness_to_quote: 'ready',
      readiness_score: 120,
      confirmed_scope_items: [{ item: 'ทำหน้า Home', confidence: 'confirmed', evidence: 'ลูกค้าระบุ', boundary_note: 'จำกัดตาม scope' }],
      assumed_scope_items: [],
      ambiguous_scope_items: [],
      must_ask_before_quote: [],
      optional_questions: ['มี reference หรือไม่'],
      suggested_boundary_clauses: ['ไม่รวม content writing'],
      scope_creep_traps: [{ item: 'แก้ดีไซน์', why_risky: 'ไม่จำกัดรอบ', how_to_limit: 'จำกัด 2 รอบ', change_request_trigger: 'เกิน 2 รอบเป็น CR' }],
      acceptance_risks: [{ scope_item: 'หน้า Home', missing_acceptance_criteria: 'ยังไม่ชัด', suggested_acceptance_criteria: 'แสดงผล responsive' }],
      tor_sections: { objective: ['ทำเว็บบริษัท'], deliverables: ['เว็บไซต์'], requirements: ['Home'], acceptance_criteria: ['เปิดได้'], exclusions: ['ไม่รวม hosting'] },
      estimation_factors: [{ module: 'Frontend', complexity: 'low', estimated_man_hours_min: 8, estimated_man_hours_max: 16, assumptions: ['static page'], risk_buffer_percent: 10 }],
      cost_reasoning: { pricing_blockers: [], cost_drivers: ['จำนวนหน้า'], suggested_pricing_model: 'fixed_price', why: 'ชัดเจนพอ' },
      recommendation: 'เสนอราคาได้',
    });

    const result = validateScopeControl(raw);
    expect(result.readiness_score).toBe(100);
    expect(result.confirmed_scope_items[0].item).toBe('ทำหน้า Home');
    expect(result.cost_reasoning.suggested_pricing_model).toBe('fixed_price');
  });

  it('rejects invalid estimation ranges', () => {
    const raw = JSON.stringify({
      readiness_to_quote: 'ready',
      readiness_score: 80,
      confirmed_scope_items: [],
      assumed_scope_items: [],
      ambiguous_scope_items: [],
      must_ask_before_quote: [],
      optional_questions: [],
      suggested_boundary_clauses: [],
      scope_creep_traps: [],
      acceptance_risks: [],
      tor_sections: {},
      estimation_factors: [{ module: 'Bad', complexity: 'medium', estimated_man_hours_min: 40, estimated_man_hours_max: 10 }],
      cost_reasoning: { pricing_blockers: [], cost_drivers: [], suggested_pricing_model: 'fixed_price', why: '' },
      recommendation: '',
    });

    expect(() => validateScopeControl(raw)).toThrow('Invalid estimation range');
  });
});
