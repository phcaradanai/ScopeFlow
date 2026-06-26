import { ScopeDigestOutput } from './scopeDigestSchema';

export function validateScopeDigest(jsonString: string): ScopeDigestOutput {
  try {
    // Attempt to repair markdown JSON blocks if present
    const cleanedString = jsonString.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    
    const parsed = JSON.parse(cleanedString);
    
    // Basic validation
    const result: ScopeDigestOutput = {
      detected_project_type: typeof parsed.detected_project_type === 'string' ? parsed.detected_project_type : 'ไม่ทราบประเภท',
      confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low',
      understanding: Array.isArray(parsed.understanding) ? parsed.understanding : [],
      confirmed_facts: Array.isArray(parsed.confirmed_facts) ? parsed.confirmed_facts : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      unclear_points: Array.isArray(parsed.unclear_points) ? parsed.unclear_points : [],
      questions_to_ask: Array.isArray(parsed.questions_to_ask) ? parsed.questions_to_ask : [],
      likely_in_scope: Array.isArray(parsed.likely_in_scope) ? parsed.likely_in_scope : [],
      likely_out_of_scope: Array.isArray(parsed.likely_out_of_scope) ? parsed.likely_out_of_scope : [],
      scope_creep_risks: Array.isArray(parsed.scope_creep_risks) ? parsed.scope_creep_risks : [],
      suggested_next_documents: Array.isArray(parsed.suggested_next_documents) ? parsed.suggested_next_documents : [],
    };
    
    return result;
  } catch (error) {
    console.error("Failed to parse AI digest:", error);
    throw new Error("INVALID_JSON");
  }
}
