import { describe, expect, it } from 'vitest';
import { classifyCustomerAnswer } from '../customerAnswerIntake';
import { computeCustomerAnswerImpactPreview } from '../customerAnswerImpactPreview';
import { buildCustomerAnswerWorkflowContext } from '../customerAnswerWorkflowContext';
import type { DocumentLifecycleSummary } from '../../document-lifecycle/documentLifecycle';

const lifecycleSummary = {
  items: [],
  next_action: 'Create CR/DCR draft',
} as unknown as DocumentLifecycleSummary;

describe('buildCustomerAnswerWorkflowContext', () => {
  it('keeps the original answer and deterministic action metadata for scope changes', () => {
    const answer = 'ขอเปลี่ยนขอบเขตงานให้รวม export รายงานด้วย';
    const result = classifyCustomerAnswer(answer);
    const affectedDocs = computeCustomerAnswerImpactPreview(result.intent, true, lifecycleSummary);
    const contextReferences = [
      {
        id: 'recommended_cr_dcr' as const,
        label: 'Recommended CR/DCR',
        actionLabel: 'Prepare CR/DCR',
        status: 'recommended' as const,
      },
    ];

    const context = buildCustomerAnswerWorkflowContext(answer, result, affectedDocs, contextReferences);

    expect(context.intent).toBe('scope_change');
    expect(context.riskLevel).toBe('high');
    expect(context.originalAnswer).toBe(answer);
    expect(context.suggestedTitle).toContain('Customer scope change');
    expect(context.affectedDocs.affected).toContain('Scope');
    expect(context.contextReferences).toHaveLength(1);
  });

  it('suggests a follow-up title for clarification answers', () => {
    const answer = 'scope นี้หมายถึงรวม deploy ด้วยไหม?';
    const result = classifyCustomerAnswer(answer);
    const affectedDocs = computeCustomerAnswerImpactPreview(result.intent, true, lifecycleSummary);

    const context = buildCustomerAnswerWorkflowContext(answer, result, affectedDocs, []);

    expect(context.intent).toBe('clarification');
    expect(context.shouldAskFollowUp).toBe(true);
    expect(context.suggestedTitle).toContain('Customer clarification');
  });

  it('suggests a revision title for rejected answers', () => {
    const answer = 'ยังไม่ผ่าน ขอปรับ scope ก่อน';
    const result = classifyCustomerAnswer(answer);
    const affectedDocs = computeCustomerAnswerImpactPreview(result.intent, true, lifecycleSummary);

    const context = buildCustomerAnswerWorkflowContext(answer, result, affectedDocs, []);

    expect(context.intent).toBe('rejection');
    expect(context.suggestedTitle).toContain('Customer rejection');
  });
});
