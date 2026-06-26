export interface ScopeDigestOutput {
  detected_project_type: string;
  confidence: "low" | "medium" | "high";
  understanding: string[];
  confirmed_facts: string[];
  assumptions: string[];
  unclear_points: string[];
  questions_to_ask: string[];
  likely_in_scope: string[];
  likely_out_of_scope: string[];
  scope_creep_risks: string[];
  suggested_next_documents: string[];
}
