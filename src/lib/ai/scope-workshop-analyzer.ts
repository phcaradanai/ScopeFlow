import { analyzeBriefScopeDelta } from './customer-change/briefScopeDeltaAnalyzer';

export interface ScopeWorkshopAnalysisResult {
  customerMessage: string;
  summaryOfChange: string;
  briefDelta: string;
  scopeDelta: string;
  quoteImpact: string;
  acceptanceImpact: string;
  missingQuestions: string[];
  recommendedAction: 'Update Brief' | 'Update Scope' | 'Create Follow-up' | 'Create Change Request' | 'Re-check Quote' | 'No document update needed';
}

export async function analyzeScopeLoopInput(
  workspacePath: string,
  customerMessage: string,
  latestBriefMarkdown: string,
  latestScopeMarkdown: string,
  openFollowUps: string[],
  openChangeRequests: string[],
  scopeStatus?: string,
  scopeLocked?: boolean
): Promise<ScopeWorkshopAnalysisResult> {
  // Delegate to existing analyzer
  const delta = await analyzeBriefScopeDelta(workspacePath, {
    customerMessage,
    latestBriefMarkdown,
    latestScopeMarkdown,
    openFollowUps,
    openChangeRequests,
    scopeStatus,
    scopeLocked,
  });

  let recommendedAction: ScopeWorkshopAnalysisResult['recommendedAction'] = 'No document update needed';
  const hasBriefImpact = delta.brief_delta && delta.brief_delta.toLowerCase() !== 'ไม่มีผลกระทบ';
  const hasScopeImpact = delta.scope_delta && delta.scope_delta.toLowerCase() !== 'ไม่มีผลกระทบ';

  if (delta.missing_questions && delta.missing_questions.length > 0) {
    recommendedAction = 'Create Follow-up';
  } else if (hasScopeImpact) {
    if (scopeLocked || ['approved', 'locked', 'signed_off'].includes((scopeStatus || '').toLowerCase())) {
      recommendedAction = 'Create Change Request';
    } else {
      recommendedAction = 'Update Scope';
    }
  } else if (hasBriefImpact) {
    recommendedAction = 'Update Brief';
  } else if (delta.quote_impact && delta.quote_impact.toLowerCase() !== 'ไม่มีผลกระทบ') {
    recommendedAction = 'Re-check Quote';
  }

  return {
    customerMessage,
    summaryOfChange: delta.summary_of_customer_change,
    briefDelta: delta.brief_delta,
    scopeDelta: delta.scope_delta,
    quoteImpact: delta.quote_impact,
    acceptanceImpact: delta.acceptance_impact,
    missingQuestions: delta.missing_questions || [],
    recommendedAction,
  };
}
