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

describe('draft review change request documents', () => {
  it('adds change request document to review session and apply plan', () => {
    const applyPlan = createDraftApplyPlan(target, pack);
    const session = createDraftReviewSession(target.projectPath, pack, applyPlan);

    const updated = upsertDraftReviewDocument(session, {
      id: 'change_request',
      label: 'Change Request / DCR Draft',
      path: `${target.projectPath}/changes/CR-001-draft.md`,
      markdown: '# CR-001',
    });

    expect(updated.documents.some(doc => doc.id === 'change_request')).toBe(true);
    expect(updated.applyPlan?.documents.some(doc => doc.id === 'change_request')).toBe(true);
    expect(updated.applyPlan?.documents.find(doc => doc.id === 'change_request')?.path).toContain('changes/CR-001-draft.md');
  });

  it('replaces existing change request document instead of duplicating it', () => {
    const applyPlan = createDraftApplyPlan(target, pack);
    const session = createDraftReviewSession(target.projectPath, pack, applyPlan);
    const first = upsertDraftReviewDocument(session, {
      id: 'change_request',
      label: 'Change Request / DCR Draft',
      path: `${target.projectPath}/changes/CR-001-draft.md`,
      markdown: '# CR-001',
    });

    const second = upsertDraftReviewDocument(first, {
      id: 'change_request',
      label: 'Change Request / DCR Draft',
      path: `${target.projectPath}/changes/CR-002-draft.md`,
      markdown: '# CR-002',
    });

    expect(second.documents.filter(doc => doc.id === 'change_request')).toHaveLength(1);
    expect(second.applyPlan?.documents.filter(doc => doc.id === 'change_request')).toHaveLength(1);
    expect(second.documents.find(doc => doc.id === 'change_request')?.markdown).toBe('# CR-002');
  });
});
