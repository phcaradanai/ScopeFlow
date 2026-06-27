import { describe, expect, it } from 'vitest';
import type { BriefScopeDraftPack } from '../briefScopeDraftAssistant';
import { createDraftApplyPlan } from '../draftApplyPlan';
import { createDraftReviewSession, upsertDraftReviewDocument } from '../draftReviewSession';

const pack: BriefScopeDraftPack = {
  briefMarkdown: '# Brief',
  scopeMarkdown: '# Scope',
  quotationMarkdown: '# Quote',
  suggestedBriefPath: 'baseline/brief-v1.0.md',
  suggestedScopePath: 'baseline/scope-v1.0.md',
  suggestedQuotationPath: 'baseline/quotation-draft-v1.0.md',
  missingInformation: [],
  scopeRisks: [],
  confidence: 'high',
  usedFallback: false,
};

const target = {
  projectId: 'project-1',
  projectPath: '/workspace/clients/client-1/projects/project-1',
  projectName: 'Project 1',
  shouldCreateProject: false,
};

describe('draft review acceptance documents', () => {
  it('adds acceptance document to review session and apply plan', () => {
    const applyPlan = createDraftApplyPlan(target, pack);
    const session = createDraftReviewSession(target.projectPath, pack, applyPlan);

    const updated = upsertDraftReviewDocument(session, {
      id: 'acceptance',
      label: 'Acceptance / Sign-off Artifact',
      path: `${target.projectPath}/acceptance/ACC-001.md`,
      markdown: '# Acceptance',
    });

    expect(updated.documents.some(doc => doc.id === 'acceptance')).toBe(true);
    expect(updated.applyPlan?.documents.some(doc => doc.id === 'acceptance')).toBe(true);
    expect(updated.applyPlan?.documents.find(doc => doc.id === 'acceptance')?.path).toContain('acceptance/ACC-001.md');
  });

  it('replaces existing acceptance document instead of duplicating it', () => {
    const applyPlan = createDraftApplyPlan(target, pack);
    const session = createDraftReviewSession(target.projectPath, pack, applyPlan);
    const first = upsertDraftReviewDocument(session, {
      id: 'acceptance',
      label: 'Acceptance / Sign-off Artifact',
      path: `${target.projectPath}/acceptance/ACC-001.md`,
      markdown: '# Acceptance 1',
    });

    const second = upsertDraftReviewDocument(first, {
      id: 'acceptance',
      label: 'Acceptance / Sign-off Artifact',
      path: `${target.projectPath}/acceptance/ACC-002.md`,
      markdown: '# Acceptance 2',
    });

    expect(second.documents.filter(doc => doc.id === 'acceptance')).toHaveLength(1);
    expect(second.applyPlan?.documents.filter(doc => doc.id === 'acceptance')).toHaveLength(1);
    expect(second.documents.find(doc => doc.id === 'acceptance')?.markdown).toBe('# Acceptance 2');
  });
});
