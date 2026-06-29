import type { CustomerAnswerIntakeResult } from './customerAnswerIntake';
import type { CustomerAnswerImpactPreview } from './customerAnswerImpactPreview';
import type { CustomerAnswerContextReference } from './customerAnswerContextReferences';

export interface CustomerAnswerWorkflowContext {
  originalAnswer: string;
  intent: CustomerAnswerIntakeResult['intent'];
  confidence: CustomerAnswerIntakeResult['confidence'];
  summary: string;
  signals: string[];
  recommendedAction: string;
  shouldCreateChangeRequest: boolean;
  shouldAskFollowUp: boolean;
  riskLevel: CustomerAnswerIntakeResult['riskLevel'];
  affectedDocs: CustomerAnswerImpactPreview;
  contextReferences: CustomerAnswerContextReference[];
  suggestedTitle: string;
}

function normalizeSnippet(answer: string): string {
  const snippet = answer.trim().replace(/\s+/g, ' ').slice(0, 80);
  return snippet || 'Customer answer';
}

function getTitlePrefix(intent: CustomerAnswerIntakeResult['intent']): string {
  if (intent === 'scope_change' || intent === 'new_requirement') return 'Customer scope change';
  if (intent === 'clarification') return 'Customer clarification';
  if (intent === 'rejection') return 'Customer rejection';
  if (intent === 'approval') return 'Customer approval';
  return 'Customer answer review';
}

export function buildCustomerAnswerWorkflowContext(
  answer: string,
  result: CustomerAnswerIntakeResult,
  affectedDocs: CustomerAnswerImpactPreview,
  contextReferences: CustomerAnswerContextReference[]
): CustomerAnswerWorkflowContext {
  return {
    originalAnswer: answer.trim(),
    intent: result.intent,
    confidence: result.confidence,
    summary: result.summary,
    signals: [...result.signals],
    recommendedAction: result.recommendedAction,
    shouldCreateChangeRequest: result.shouldCreateChangeRequest,
    shouldAskFollowUp: result.shouldAskFollowUp,
    riskLevel: result.riskLevel,
    affectedDocs,
    contextReferences,
    suggestedTitle: `${getTitlePrefix(result.intent)}: ${normalizeSnippet(answer)}`,
  };
}
