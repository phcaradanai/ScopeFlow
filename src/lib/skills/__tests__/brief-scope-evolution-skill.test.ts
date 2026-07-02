import { describe, it, expect, vi } from 'vitest';
import { analyzeBriefScopeEvolution } from '../brief-scope-evolution-skill';
import * as aiRouter from '../../ai/providers/aiProviderRouter';

vi.mock('../../ai/providers/aiProviderRouter', () => ({
  generateJsonWithTrace: vi.fn()
}));

describe('BriefScopeEvolutionSkill', () => {
  const baseInput = {
    previousBriefSummary: 'Old brief',
    previousScopeSummary: 'Old scope',
    currentBriefSummary: 'Current brief',
    currentScopeSummary: 'Current scope',
    customerMessage: 'I want to add a login page',
    openFollowUps: [],
    openChangeRequests: [],
    quoteStatus: 'Draft',
    scopeStatus: 'Draft',
    acceptanceStatus: 'Pending',
    approvalEvidence: ''
  };

  it('should fall back to deterministic if message is empty', async () => {
    const result = await analyzeBriefScopeEvolution('/mock/path', {
      ...baseInput,
      customerMessage: '   '
    });
    
    expect(result.recommendedAction).toBe('Update Brief');
    expect(result.guardrailNotes).toContain('วิเคราะห์ด้วยระบบพื้นฐาน');
  });

  it('should recommend Change Request if scope is locked and change requested', async () => {
    const result = await analyzeBriefScopeEvolution('/mock/path', {
      ...baseInput,
      customerMessage: 'เปลี่ยนสีปุ่ม',
      scopeStatus: 'locked'
    });
    
    expect(result.recommendedAction).toBe('Create Change Request');
    expect(result.shouldCreateChangeRequest).toBe(true);
  });

  it('should parse AI output and validate with zod', async () => {
    const mockAiResponse = {
      iterationTitle: 'Add login page',
      customerMessageSummary: 'Customer wants a login page',
      detectedChanges: 'Added login page requirement',
      briefChanges: ['Added user authentication context'],
      scopeChanges: ['Add login page deliverable'],
      quoteImpact: 'Increase by 10 hours',
      acceptanceImpact: 'Need to test login',
      missingQuestions: ['Which auth provider?'],
      recommendedAction: 'Update Scope',
      confidence: 0.9,
      riskLevel: 'Medium',
      shouldCreateFollowUp: false,
      shouldCreateChangeRequest: false,
      shouldRecheckQuote: true,
      shouldAcceptScope: false,
      shouldDoNothing: false
    };

    vi.mocked(aiRouter.generateJsonWithTrace).mockResolvedValueOnce({
      result: JSON.stringify(mockAiResponse),
      traceId: 'mock-trace'
    });

    const result = await analyzeBriefScopeEvolution('/mock/path', baseInput);
    
    expect(result.recommendedAction).toBe('Update Scope');
    expect(result.missingQuestions).toContain('Which auth provider?');
    // Guardrail ensures boolean flags match
    expect(result.shouldRecheckQuote).toBe(false); 
    expect(result.shouldAcceptScope).toBe(false);
  });

  it('should apply guardrail if AI suggests Update Scope but scope is locked', async () => {
    const mockAiResponse = {
      iterationTitle: 'Add login page',
      customerMessageSummary: 'Customer wants a login page',
      detectedChanges: 'Added login page requirement',
      briefChanges: [],
      scopeChanges: ['Add login page deliverable'],
      quoteImpact: 'Increase by 10 hours',
      acceptanceImpact: 'Need to test login',
      missingQuestions: [],
      recommendedAction: 'Update Scope',
      confidence: 0.9,
      riskLevel: 'Medium',
      shouldCreateFollowUp: false,
      shouldCreateChangeRequest: false,
      shouldRecheckQuote: false,
      shouldAcceptScope: false,
      shouldDoNothing: false
    };

    vi.mocked(aiRouter.generateJsonWithTrace).mockResolvedValueOnce({
      result: JSON.stringify(mockAiResponse),
      traceId: 'mock-trace'
    });

    const result = await analyzeBriefScopeEvolution('/mock/path', {
      ...baseInput,
      scopeStatus: 'Approved'
    });
    
    expect(result.recommendedAction).toBe('Create Change Request');
    expect(result.shouldCreateChangeRequest).toBe(true);
    expect(result.guardrailNotes).toContain('ป้องกันการเขียนทับ Scope');
  });
});
