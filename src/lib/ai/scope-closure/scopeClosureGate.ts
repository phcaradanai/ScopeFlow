import type { ScopeControlOutput } from '../scope-control/scopeControlSchema';

export type ScopeClosureStatus = 'open' | 'needs_customer_answers' | 'ready_for_quote' | 'locked';

export interface ScopeClosureGateInput {
  scopeControl: ScopeControlOutput;
  hasCustomerApproval?: boolean;
  answeredQuestionCount?: number;
  waivedQuestionCount?: number;
}

export interface ScopeClosureGateResult {
  scope_closure_status: ScopeClosureStatus;
  closure_score: number;
  blocking_items: string[];
  recommended_next_action: string;
  customer_questions: string[];
  quote_ready_summary: string;
  checklist: {
    has_confirmed_scope: boolean;
    has_no_critical_questions: boolean;
    has_boundary_clauses: boolean;
    has_acceptance_criteria: boolean;
    has_estimation_factors: boolean;
    has_pricing_model: boolean;
    has_customer_approval: boolean;
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function answeredRatio(totalQuestions: number, answeredQuestionCount = 0, waivedQuestionCount = 0): number {
  if (totalQuestions <= 0) return 1;
  return Math.min(1, Math.max(0, (answeredQuestionCount + waivedQuestionCount) / totalQuestions));
}

export function evaluateScopeClosureGate(input: ScopeClosureGateInput): ScopeClosureGateResult {
  const control = input.scopeControl;
  const mustAskCount = control.must_ask_before_quote.length;
  const questionRatio = answeredRatio(mustAskCount, input.answeredQuestionCount, input.waivedQuestionCount);

  const checklist = {
    has_confirmed_scope: control.confirmed_scope_items.length > 0 || control.assumed_scope_items.length > 0,
    has_no_critical_questions: mustAskCount === 0 || questionRatio >= 1,
    has_boundary_clauses: control.suggested_boundary_clauses.length > 0,
    has_acceptance_criteria: control.acceptance_risks.length > 0 || control.tor_sections.acceptance_criteria.length > 0,
    has_estimation_factors: control.estimation_factors.length > 0,
    has_pricing_model: Boolean(control.cost_reasoning.suggested_pricing_model),
    has_customer_approval: input.hasCustomerApproval === true,
  };

  const blockingItems: string[] = [];
  if (!checklist.has_confirmed_scope) blockingItems.push('ยังไม่มี confirmed/assumed scope item ที่พอใช้ตั้งต้น');
  if (!checklist.has_no_critical_questions) blockingItems.push(`ยังมีคำถามก่อนเสนอราคา ${mustAskCount - Math.floor(mustAskCount * questionRatio)} รายการที่ยังไม่ถูกตอบหรือ waive`);
  if (!checklist.has_boundary_clauses) blockingItems.push('ยังไม่มี boundary / out-of-scope clause เพื่อกันงานงอก');
  if (!checklist.has_acceptance_criteria) blockingItems.push('ยังไม่มี acceptance criteria หรือ acceptance risk ที่ตรวจรับได้');
  if (!checklist.has_estimation_factors) blockingItems.push('ยังไม่มี estimation factor / man-hour reasoning');
  if (!checklist.has_pricing_model) blockingItems.push('ยังไม่มี pricing model recommendation');

  const closureScore = clampScore(
    control.readiness_score * 0.45 +
    (checklist.has_confirmed_scope ? 12 : 0) +
    (checklist.has_no_critical_questions ? 16 : questionRatio * 16) +
    (checklist.has_boundary_clauses ? 10 : 0) +
    (checklist.has_acceptance_criteria ? 8 : 0) +
    (checklist.has_estimation_factors ? 6 : 0) +
    (checklist.has_pricing_model ? 3 : 0)
  );

  let status: ScopeClosureStatus = 'open';
  if (input.hasCustomerApproval && blockingItems.length === 0 && control.readiness_to_quote === 'ready') {
    status = 'locked';
  } else if (blockingItems.length === 0 && control.readiness_to_quote === 'ready') {
    status = 'ready_for_quote';
  } else if (mustAskCount > 0 && questionRatio < 1) {
    status = 'needs_customer_answers';
  }

  const recommendedNextAction = status === 'locked'
    ? 'Scope ถูกล็อกแล้ว ใช้เอกสารนี้เป็น baseline สำหรับ quotation, acceptance และ change request ได้'
    : status === 'ready_for_quote'
      ? 'ข้อมูลพร้อมพอสำหรับเตรียม quotation แต่ควรให้ลูกค้ายืนยัน scope/boundary เป็นลายลักษณ์อักษรก่อนเริ่มงาน'
      : status === 'needs_customer_answers'
        ? 'ส่งคำถามค้างให้ลูกค้าตอบ แล้วนำคำตอบมา mark เป็น confirmed หรือ waived ก่อนเสนอราคา'
        : 'เติมข้อมูล scope, boundary, acceptance criteria และ estimation ให้ครบก่อนเสนอราคา';

  const quoteReadySummary = status === 'ready_for_quote' || status === 'locked'
    ? `Scope พร้อมสำหรับ quotation เบื้องต้นด้วย pricing model: ${control.cost_reasoning.suggested_pricing_model}`
    : `Scope ยังไม่พร้อม quote: ${blockingItems.slice(0, 3).join('; ') || 'ต้องตรวจข้อมูลเพิ่มเติม'}`;

  return {
    scope_closure_status: status,
    closure_score: closureScore,
    blocking_items: blockingItems,
    recommended_next_action: recommendedNextAction,
    customer_questions: control.must_ask_before_quote,
    quote_ready_summary: quoteReadySummary,
    checklist,
  };
}
