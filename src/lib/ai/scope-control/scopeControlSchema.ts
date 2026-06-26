export type QuoteReadiness = 'not_ready' | 'risky' | 'ready';
export type ScopeItemConfidence = 'confirmed' | 'assumed' | 'ambiguous';
export type ComplexityLevel = 'low' | 'medium' | 'high';
export type PricingModel = 'fixed_price' | 'time_and_material' | 'phase_based' | 'retainer';

export interface ScopeControlItem {
  item: string;
  confidence: ScopeItemConfidence;
  evidence: string;
  boundary_note: string;
}

export interface ScopeCreepTrap {
  item: string;
  why_risky: string;
  how_to_limit: string;
  change_request_trigger: string;
}

export interface AcceptanceRisk {
  scope_item: string;
  missing_acceptance_criteria: string;
  suggested_acceptance_criteria: string;
}

export interface EstimationFactor {
  module: string;
  complexity: ComplexityLevel;
  estimated_man_hours_min: number;
  estimated_man_hours_max: number;
  assumptions: string[];
  risk_buffer_percent: number;
}

export interface TorSections {
  objective: string[];
  deliverables: string[];
  requirements: string[];
  acceptance_criteria: string[];
  exclusions: string[];
}

export interface CostReasoning {
  pricing_blockers: string[];
  cost_drivers: string[];
  suggested_pricing_model: PricingModel;
  why: string;
}

export interface ScopeControlOutput {
  readiness_to_quote: QuoteReadiness;
  readiness_score: number;
  confirmed_scope_items: ScopeControlItem[];
  assumed_scope_items: ScopeControlItem[];
  ambiguous_scope_items: ScopeControlItem[];
  must_ask_before_quote: string[];
  optional_questions: string[];
  suggested_boundary_clauses: string[];
  scope_creep_traps: ScopeCreepTrap[];
  acceptance_risks: AcceptanceRisk[];
  tor_sections: TorSections;
  estimation_factors: EstimationFactor[];
  cost_reasoning: CostReasoning;
  recommendation: string;
  is_fallback?: boolean;
}

export const EMPTY_TOR_SECTIONS: TorSections = {
  objective: [],
  deliverables: [],
  requirements: [],
  acceptance_criteria: [],
  exclusions: [],
};
