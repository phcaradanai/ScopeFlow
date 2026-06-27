import { describe, expect, it } from 'vitest';
import { evaluateScopeClosureGate } from '../scopeClosureGate';
import { buildScopeClosureMarkdown, injectScopeClosureMarkdown } from '../scopeClosureMarkdown';
import type { ScopeControlOutput } from '../../scope-control/scopeControlSchema';

function createControl(overrides: Partial<ScopeControlOutput> = {}): ScopeControlOutput {
  return {
    readiness_to_quote: 'risky',
    readiness_score: 55,
    confirmed_scope_items: [{ item: 'Checkout', confidence: 'confirmed', evidence: 'ลูกค้าระบุ', boundary_note: 'จำกัดตาม scenario' }],
    assumed_scope_items: [],
    ambiguous_scope_items: [],
    must_ask_before_quote: ['ยืนยัน payment gateway', 'ยืนยันจำนวนสินค้า'],
    optional_questions: [],
    suggested_boundary_clauses: ['ไม่รวม mobile app'],
    scope_creep_traps: [],
    acceptance_risks: [{ scope_item: 'Checkout', missing_acceptance_criteria: 'ยังไม่มี scenario', suggested_acceptance_criteria: 'สั่งซื้อสำเร็จ' }],
    tor_sections: {
      objective: [],
      deliverables: [],
      requirements: [],
      acceptance_criteria: [],
      exclusions: [],
    },
    estimation_factors: [{ module: 'Checkout', complexity: 'high', estimated_man_hours_min: 40, estimated_man_hours_max: 80, assumptions: [], risk_buffer_percent: 30 }],
    cost_reasoning: {
      pricing_blockers: ['ยังไม่รู้ payment gateway'],
      cost_drivers: ['integration'],
      suggested_pricing_model: 'phase_based',
      why: 'ยังมีข้อมูลไม่ครบ',
    },
    recommendation: 'ควรถามเพิ่มก่อน quote',
    ...overrides,
  };
}

describe('scopeClosureGate', () => {
  it('marks scope as needing customer answers when mandatory questions remain', () => {
    const result = evaluateScopeClosureGate({ scopeControl: createControl(), answeredQuestionCount: 0 });

    expect(result.scope_closure_status).toBe('needs_customer_answers');
    expect(result.blocking_items.some(item => item.includes('คำถามก่อนเสนอราคา'))).toBe(true);
    expect(result.customer_questions).toContain('ยืนยัน payment gateway');
    expect(result.checklist.has_no_critical_questions).toBe(false);
  });

  it('marks scope as ready for quote when ready and no blockers remain', () => {
    const result = evaluateScopeClosureGate({
      scopeControl: createControl({
        readiness_to_quote: 'ready',
        readiness_score: 88,
        must_ask_before_quote: [],
        cost_reasoning: {
          pricing_blockers: [],
          cost_drivers: ['จำนวน module'],
          suggested_pricing_model: 'fixed_price',
          why: 'ข้อมูลชัดพอ',
        },
        recommendation: 'เสนอราคาได้',
      }),
    });

    expect(result.scope_closure_status).toBe('ready_for_quote');
    expect(result.blocking_items).toEqual([]);
    expect(result.quote_ready_summary).toContain('fixed_price');
    expect(result.closure_score).toBeGreaterThanOrEqual(80);
  });

  it('marks scope as locked when customer approval exists and quote-ready blockers are clear', () => {
    const result = evaluateScopeClosureGate({
      hasCustomerApproval: true,
      scopeControl: createControl({
        readiness_to_quote: 'ready',
        readiness_score: 90,
        must_ask_before_quote: [],
        cost_reasoning: {
          pricing_blockers: [],
          cost_drivers: ['จำนวน module'],
          suggested_pricing_model: 'fixed_price',
          why: 'ข้อมูลชัดพอ',
        },
      }),
    });

    expect(result.scope_closure_status).toBe('locked');
    expect(result.checklist.has_customer_approval).toBe(true);
    expect(result.recommended_next_action).toContain('baseline');
  });

  it('renders and injects closure markdown after scope control summary', () => {
    const result = evaluateScopeClosureGate({ scopeControl: createControl(), answeredQuestionCount: 0 });
    const markdown = buildScopeClosureMarkdown(result);
    const scope = '# Scope\n\n<!-- scope-control-summary:start -->\n## Scope Control Summary\n<!-- scope-control-summary:end -->\n';
    const injected = injectScopeClosureMarkdown(scope, result);

    expect(markdown).toContain('## Scope Closure Gate');
    expect(markdown).toContain('ต้องรอคำตอบลูกค้า');
    expect(injected.indexOf('## Scope Control Summary')).toBeLessThan(injected.indexOf('## Scope Closure Gate'));
    expect(injected.match(/## Scope Closure Gate/g)?.length).toBe(1);
  });
});
