import type { ScopeControlOutput, QuoteReadiness, ComplexityLevel, PricingModel, ScopeItemConfidence } from './scopeControlSchema';

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function ensureString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function ensureNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function parseJson(raw: string): unknown {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export function validateScopeControl(raw: string): ScopeControlOutput {
  const obj = parseJson(raw) as any;

  const readiness = pick<QuoteReadiness>(obj.readiness_to_quote, ['not_ready', 'risky', 'ready'], 'not_ready');
  const complexityValues: readonly ComplexityLevel[] = ['low', 'medium', 'high'];
  const pricingValues: readonly PricingModel[] = ['fixed_price', 'time_and_material', 'phase_based', 'retainer'];
  const confidenceValues: readonly ScopeItemConfidence[] = ['confirmed', 'assumed', 'ambiguous'];

  const normalizeItem = (item: any, fallbackConfidence: ScopeItemConfidence) => ({
    item: ensureString(item?.item),
    confidence: pick<ScopeItemConfidence>(item?.confidence, confidenceValues, fallbackConfidence),
    evidence: ensureString(item?.evidence),
    boundary_note: ensureString(item?.boundary_note),
  });

  const result: ScopeControlOutput = {
    readiness_to_quote: readiness,
    readiness_score: Math.max(0, Math.min(100, ensureNumber(obj.readiness_score, 0))),
    confirmed_scope_items: ensureArray<any>(obj.confirmed_scope_items).map(item => normalizeItem(item, 'confirmed')).filter(item => item.item),
    assumed_scope_items: ensureArray<any>(obj.assumed_scope_items).map(item => normalizeItem(item, 'assumed')).filter(item => item.item),
    ambiguous_scope_items: ensureArray<any>(obj.ambiguous_scope_items).map(item => normalizeItem(item, 'ambiguous')).filter(item => item.item),
    must_ask_before_quote: ensureArray<unknown>(obj.must_ask_before_quote).map(ensureString).filter(Boolean),
    optional_questions: ensureArray<unknown>(obj.optional_questions).map(ensureString).filter(Boolean),
    suggested_boundary_clauses: ensureArray<unknown>(obj.suggested_boundary_clauses).map(ensureString).filter(Boolean),
    scope_creep_traps: ensureArray<any>(obj.scope_creep_traps).map(trap => ({
      item: ensureString(trap?.item),
      why_risky: ensureString(trap?.why_risky),
      how_to_limit: ensureString(trap?.how_to_limit),
      change_request_trigger: ensureString(trap?.change_request_trigger),
    })).filter(trap => trap.item),
    acceptance_risks: ensureArray<any>(obj.acceptance_risks).map(risk => ({
      scope_item: ensureString(risk?.scope_item),
      missing_acceptance_criteria: ensureString(risk?.missing_acceptance_criteria),
      suggested_acceptance_criteria: ensureString(risk?.suggested_acceptance_criteria),
    })).filter(risk => risk.scope_item),
    tor_sections: {
      objective: ensureArray<unknown>(obj.tor_sections?.objective).map(ensureString).filter(Boolean),
      deliverables: ensureArray<unknown>(obj.tor_sections?.deliverables).map(ensureString).filter(Boolean),
      requirements: ensureArray<unknown>(obj.tor_sections?.requirements).map(ensureString).filter(Boolean),
      acceptance_criteria: ensureArray<unknown>(obj.tor_sections?.acceptance_criteria).map(ensureString).filter(Boolean),
      exclusions: ensureArray<unknown>(obj.tor_sections?.exclusions).map(ensureString).filter(Boolean),
    },
    estimation_factors: ensureArray<any>(obj.estimation_factors).map(factor => ({
      module: ensureString(factor?.module),
      complexity: pick<ComplexityLevel>(factor?.complexity, complexityValues, 'medium'),
      estimated_man_hours_min: Math.max(0, ensureNumber(factor?.estimated_man_hours_min, 0)),
      estimated_man_hours_max: Math.max(0, ensureNumber(factor?.estimated_man_hours_max, 0)),
      assumptions: ensureArray<unknown>(factor?.assumptions).map(ensureString).filter(Boolean),
      risk_buffer_percent: Math.max(0, ensureNumber(factor?.risk_buffer_percent, 0)),
    })).filter(factor => factor.module),
    cost_reasoning: {
      pricing_blockers: ensureArray<unknown>(obj.cost_reasoning?.pricing_blockers).map(ensureString).filter(Boolean),
      cost_drivers: ensureArray<unknown>(obj.cost_reasoning?.cost_drivers).map(ensureString).filter(Boolean),
      suggested_pricing_model: pick<PricingModel>(obj.cost_reasoning?.suggested_pricing_model, pricingValues, 'phase_based'),
      why: ensureString(obj.cost_reasoning?.why),
    },
    recommendation: ensureString(obj.recommendation),
  };

  if (result.estimation_factors.some(factor => factor.estimated_man_hours_max < factor.estimated_man_hours_min)) {
    throw new Error('Invalid estimation range');
  }

  return result;
}
