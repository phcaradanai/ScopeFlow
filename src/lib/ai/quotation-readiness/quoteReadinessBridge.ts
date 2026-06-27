import type { ScopeClosureGateResult } from '../scope-closure/scopeClosureGate';
import type { ScopeControlOutput } from '../scope-control/scopeControlSchema';

export type QuoteReadinessStatus = 'blocked' | 'needs_review' | 'ready';

export interface QuoteReadinessBrief {
  status: QuoteReadinessStatus;
  readiness_score: number;
  recommended_pricing_model: ScopeControlOutput['cost_reasoning']['suggested_pricing_model'];
  module_estimates: ScopeControlOutput['estimation_factors'];
  total_man_hours_min: number;
  total_man_hours_max: number;
  pricing_blockers: string[];
  quote_assumptions: string[];
  quote_boundary_clauses: string[];
  change_request_triggers: string[];
  acceptance_items: string[];
  recommended_next_action: string;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

export function buildQuoteReadinessBrief(control: ScopeControlOutput, gate: ScopeClosureGateResult): QuoteReadinessBrief {
  const totalMin = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_min, 0);
  const totalMax = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_max, 0);

  const pricingBlockers = unique([
    ...control.cost_reasoning.pricing_blockers,
    ...gate.blocking_items,
  ]);

  const quoteAssumptions = unique(control.estimation_factors.flatMap(factor => factor.assumptions));
  const changeRequestTriggers = unique(control.scope_creep_traps.map(trap => `${trap.item}: ${trap.change_request_trigger}`));
  const acceptanceItems = unique([
    ...control.tor_sections.acceptance_criteria,
    ...control.acceptance_risks.map(risk => risk.suggested_acceptance_criteria),
  ]);

  const status: QuoteReadinessStatus = gate.scope_closure_status === 'ready_for_quote' || gate.scope_closure_status === 'locked'
    ? pricingBlockers.length === 0
      ? 'ready'
      : 'needs_review'
    : 'blocked';

  const readinessScore = Math.min(100, Math.round((control.readiness_score * 0.55) + (gate.closure_score * 0.45)));
  const recommendedNextAction = status === 'ready'
    ? 'สร้าง Quotation Draft โดยแนบ assumptions, boundary clauses, acceptance criteria และ CR triggers ไปกับใบเสนอราคา'
    : status === 'needs_review'
      ? 'ตรวจ pricing blockers และยืนยันกับลูกค้าก่อนออกใบเสนอราคาแบบ fixed price'
      : 'ยังไม่ควรสร้างใบเสนอราคา ให้ปิด Scope Closure Gate และคำถามลูกค้าก่อน';

  return {
    status,
    readiness_score: readinessScore,
    recommended_pricing_model: control.cost_reasoning.suggested_pricing_model,
    module_estimates: control.estimation_factors,
    total_man_hours_min: totalMin,
    total_man_hours_max: totalMax,
    pricing_blockers: pricingBlockers,
    quote_assumptions: quoteAssumptions,
    quote_boundary_clauses: control.suggested_boundary_clauses,
    change_request_triggers: changeRequestTriggers,
    acceptance_items: acceptanceItems,
    recommended_next_action: recommendedNextAction,
  };
}
