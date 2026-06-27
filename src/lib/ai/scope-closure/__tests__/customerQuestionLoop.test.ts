import { describe, expect, it } from 'vitest';
import { buildCustomerQuestionPack, buildCloseLoopChecklistMarkdown, summarizeCustomerAnswers } from '../customerQuestionLoop';
import { buildCustomerQuestionLoopMarkdown, injectCustomerQuestionLoopMarkdown } from '../customerQuestionMarkdown';
import type { ScopeClosureGateResult } from '../scopeClosureGate';

const gate: ScopeClosureGateResult = {
  scope_closure_status: 'needs_customer_answers',
  closure_score: 62,
  blocking_items: ['ยังมีคำถามก่อนเสนอราคา 2 รายการที่ยังไม่ถูกตอบหรือ waive'],
  recommended_next_action: 'ส่งคำถามค้างให้ลูกค้าตอบ',
  customer_questions: ['ต้องการ payment gateway ใด', 'สินค้ามีกี่รายการ'],
  quote_ready_summary: 'Scope ยังไม่พร้อม quote',
  checklist: {
    has_confirmed_scope: true,
    has_no_critical_questions: false,
    has_boundary_clauses: true,
    has_acceptance_criteria: true,
    has_estimation_factors: true,
    has_pricing_model: true,
    has_customer_approval: false,
  },
};

describe('customerQuestionLoop', () => {
  it('builds a customer question pack from closure gate questions', () => {
    const pack = buildCustomerQuestionPack(gate, 'Online Shop');

    expect(pack.subject).toContain('Online Shop');
    expect(pack.message).toContain('ต้องการ payment gateway ใด');
    expect(pack.message).toContain('สินค้ามีกี่รายการ');
    expect(pack.questions).toHaveLength(2);
    expect(pack.questions[0].disposition).toBe('still_unclear');
    expect(pack.closeLoopChecklistMarkdown).toContain('(still unclear)');
  });

  it('builds a checklist that marks confirmed and waived answers as closed', () => {
    const checklist = buildCloseLoopChecklistMarkdown([
      { id: 'q1', question: 'ต้องการ payment gateway ใด', disposition: 'confirmed', answer: 'Omise' },
      { id: 'q2', question: 'ต้องการ coupon หรือไม่', disposition: 'waived', note: 'เลื่อนไป phase 2' },
      { id: 'q3', question: 'สินค้ามีกี่รายการ', disposition: 'still_unclear' },
    ]);

    expect(checklist).toContain('- [x] (confirmed)');
    expect(checklist).toContain('คำตอบ: Omise');
    expect(checklist).toContain('- [x] (waived)');
    expect(checklist).toContain('- [ ] (still unclear)');
  });

  it('summarizes customer answer dispositions', () => {
    const summary = summarizeCustomerAnswers([
      { id: 'q1', question: 'A', disposition: 'confirmed' },
      { id: 'q2', question: 'B', disposition: 'waived' },
      { id: 'q3', question: 'C', disposition: 'still_unclear' },
    ]);

    expect(summary.confirmed_count).toBe(1);
    expect(summary.waived_count).toBe(1);
    expect(summary.still_unclear_count).toBe(1);
    expect(summary.answered_or_waived_count).toBe(2);
    expect(summary.all_closed).toBe(false);
  });

  it('renders and injects customer question loop markdown after closure gate', () => {
    const pack = buildCustomerQuestionPack(gate, 'Online Shop');
    const markdown = buildCustomerQuestionLoopMarkdown(pack);
    const scope = '# Scope\n\n<!-- scope-closure-gate:start -->\n## Scope Closure Gate\n<!-- scope-closure-gate:end -->\n';
    const injected = injectCustomerQuestionLoopMarkdown(scope, pack);

    expect(markdown).toContain('## Customer Question Close Loop');
    expect(markdown).toContain('Message To Customer');
    expect(injected.indexOf('## Scope Closure Gate')).toBeLessThan(injected.indexOf('## Customer Question Close Loop'));
    expect(injected.match(/## Customer Question Close Loop/g)?.length).toBe(1);
  });

  it('replaces existing customer question loop markdown instead of duplicating it', () => {
    const first = injectCustomerQuestionLoopMarkdown('# Scope', buildCustomerQuestionPack(gate, 'Online Shop'));
    const second = injectCustomerQuestionLoopMarkdown(first, buildCustomerQuestionPack({ ...gate, customer_questions: ['คำถามใหม่'] }, 'Online Shop'));

    expect(second.match(/## Customer Question Close Loop/g)?.length).toBe(1);
    expect(second).toContain('คำถามใหม่');
    expect(second).not.toContain('สินค้ามีกี่รายการ');
  });
});
