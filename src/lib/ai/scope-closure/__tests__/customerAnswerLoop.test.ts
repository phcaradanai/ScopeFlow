import { describe, expect, it } from 'vitest';
import { applyCustomerAnswers, reevaluateGateWithCustomerAnswers } from '../customerAnswerLoop';
import { buildCustomerAnswerApplyMarkdown, injectCustomerAnswerApplyMarkdown } from '../customerAnswerMarkdown';
import type { CustomerQuestionItem } from '../customerQuestionLoop';
import type { ScopeClosureGateResult } from '../scopeClosureGate';

const questions: CustomerQuestionItem[] = [
  { id: 'q1', question: 'ต้องการ payment gateway ใด', disposition: 'still_unclear' },
  { id: 'q2', question: 'ต้องการ coupon หรือไม่', disposition: 'still_unclear' },
  { id: 'q3', question: 'สินค้ามีกี่รายการ', disposition: 'still_unclear' },
];

const gate: ScopeClosureGateResult = {
  scope_closure_status: 'needs_customer_answers',
  closure_score: 62,
  blocking_items: ['ยังมีคำถามก่อนเสนอราคา 3 รายการที่ยังไม่ถูกตอบหรือ waive'],
  recommended_next_action: 'ส่งคำถามค้างให้ลูกค้าตอบ',
  customer_questions: questions.map(item => item.question),
  quote_ready_summary: 'Scope ยังไม่พร้อม quote: ยังมีคำถามก่อนเสนอราคา',
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

describe('customerAnswerLoop', () => {
  it('applies numbered customer answers and classifies dispositions', () => {
    const result = applyCustomerAnswers({
      questions,
      rawAnswerText: `1. ใช้ Omise\n2. ยังไม่ทำ coupon ในเฟสแรก ไป phase 2\n3. ประมาณ 200 รายการ`,
    });

    expect(result.updated_questions[0].disposition).toBe('confirmed');
    expect(result.updated_questions[0].answer).toContain('Omise');
    expect(result.updated_questions[1].disposition).toBe('waived');
    expect(result.updated_questions[2].disposition).toBe('confirmed');
    expect(result.summary.confirmed_count).toBe(2);
    expect(result.summary.waived_count).toBe(1);
    expect(result.summary.all_closed).toBe(true);
    expect(result.suggested_closure_input).toEqual({ answeredQuestionCount: 2, waivedQuestionCount: 1 });
  });

  it('keeps unanswered or uncertain items as still unclear', () => {
    const result = applyCustomerAnswers({
      questions,
      rawAnswerText: `1. ยังไม่แน่ใจเรื่อง payment\n2. ไม่เอา coupon`,
    });

    expect(result.updated_questions[0].disposition).toBe('still_unclear');
    expect(result.updated_questions[1].disposition).toBe('waived');
    expect(result.updated_questions[2].disposition).toBe('still_unclear');
    expect(result.summary.all_closed).toBe(false);
    expect(result.recommended_next_action).toContain('ยังมีคำถามที่ไม่ชัด');
  });

  it('reevaluates the closure gate when all customer questions are closed', () => {
    const result = applyCustomerAnswers({
      questions,
      rawAnswerText: `1. ใช้ Omise\n2. ไม่ทำ coupon ใน scope แรก\n3. 200 รายการ`,
    });
    const updatedGate = reevaluateGateWithCustomerAnswers(gate, result);

    expect(updatedGate.checklist.has_no_critical_questions).toBe(true);
    expect(updatedGate.blocking_items).toEqual([]);
    expect(updatedGate.scope_closure_status).toBe('ready_for_quote');
    expect(updatedGate.closure_score).toBeGreaterThan(gate.closure_score);
  });

  it('renders and injects customer answer markdown after question loop', () => {
    const result = applyCustomerAnswers({
      questions,
      rawAnswerText: `1. ใช้ Omise\n2. ไม่ทำ coupon\n3. 200 รายการ`,
    });
    const markdown = buildCustomerAnswerApplyMarkdown(result);
    const scope = '# Scope\n\n<!-- customer-question-close-loop:start -->\n## Customer Question Close Loop\n<!-- customer-question-close-loop:end -->\n';
    const injected = injectCustomerAnswerApplyMarkdown(scope, result);

    expect(markdown).toContain('## Customer Answer Apply Loop');
    expect(markdown).toContain('Confirmed: 2');
    expect(injected.indexOf('## Customer Question Close Loop')).toBeLessThan(injected.indexOf('## Customer Answer Apply Loop'));
    expect(injected.match(/## Customer Answer Apply Loop/g)?.length).toBe(1);
  });

  it('replaces an existing customer answer section instead of duplicating it', () => {
    const firstResult = applyCustomerAnswers({ questions, rawAnswerText: '1. ใช้ Omise' });
    const secondResult = applyCustomerAnswers({ questions, rawAnswerText: '1. ใช้ Omise\n2. ไม่ทำ coupon\n3. 200 รายการ' });
    const first = injectCustomerAnswerApplyMarkdown('# Scope', firstResult);
    const second = injectCustomerAnswerApplyMarkdown(first, secondResult);

    expect(second.match(/## Customer Answer Apply Loop/g)?.length).toBe(1);
    expect(second).toContain('Confirmed: 2');
    expect(second).not.toContain('Still unclear: 2');
  });
});
