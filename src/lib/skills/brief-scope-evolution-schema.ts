import { z } from 'zod';

export const briefScopeEvolutionSchema = z.object({
  iterationTitle: z.string(),
  customerMessageSummary: z.string(),
  detectedChanges: z.string(),
  briefChanges: z.array(z.string()),
  scopeChanges: z.array(z.string()),
  quoteImpact: z.string(),
  acceptanceImpact: z.string(),
  missingQuestions: z.array(z.string()),
  recommendedAction: z.enum([
    'Update Brief',
    'Update Scope',
    'Create Follow-up',
    'Create Change Request',
    'Re-check Quote',
    'No document update needed',
    'Accept Scope',
    'Close Scope Loop'
  ]),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  guardrailNotes: z.string().optional(),
  proposedBriefUpdate: z.string().optional(),
  proposedScopeUpdate: z.string().optional(),
  shouldCreateFollowUp: z.boolean(),
  shouldCreateChangeRequest: z.boolean(),
  shouldRecheckQuote: z.boolean(),
  shouldAcceptScope: z.boolean(),
  shouldDoNothing: z.boolean()
});

export type BriefScopeEvolutionOutput = z.infer<typeof briefScopeEvolutionSchema>;
