import type { DocumentLifecycleSummary } from '../document-lifecycle/documentLifecycle';

export interface CustomerAnswerImpactPreview {
  affected: string[];
  unaffected: string[];
}

export function computeCustomerAnswerImpactPreview(
  intent: string,
  hasAnswer: boolean,
  lifecycleSummary: DocumentLifecycleSummary
): CustomerAnswerImpactPreview {
  if (!hasAnswer) return { affected: [], unaffected: [] };
  const affected: string[] = [];
  const unaffected: string[] = [];
  
  if (intent === 'scope_change' || intent === 'new_requirement') {
    affected.push('Scope');
    affected.push('Quotation');
    if (lifecycleSummary.items.some(d => d.id === 'scope_baseline' && d.status === 'approved')) {
      affected.push('Scope Baseline');
    }
    unaffected.push('Acceptance Sign-off');
  } else if (intent === 'approval') {
    const nextDoc = lifecycleSummary.next_action;
    if (nextDoc) {
      affected.push(nextDoc);
    } else {
      affected.push('Current pending step');
    }
  } else if (intent === 'rejection') {
    const nextDoc = lifecycleSummary.next_action;
    if (nextDoc) {
      affected.push(nextDoc);
    } else {
      affected.push('Current pending step');
    }
  } else if (intent === 'clarification') {
    unaffected.push('Scope Baseline');
    unaffected.push('Quotation');
  }

  return { affected, unaffected };
}
