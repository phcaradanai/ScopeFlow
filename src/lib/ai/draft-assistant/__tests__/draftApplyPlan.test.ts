import { describe, expect, it } from 'vitest';
import { createDraftApplyPlan, summarizeDraftApplyPlan, validateDraftApplyPlan, type DraftApplyProjectTarget } from '../draftApplyPlan';
import type { BriefScopeDraftPack } from '../briefScopeDraftAssistant';

const pack: BriefScopeDraftPack = {
  briefMarkdown: '# Brief',
  scopeMarkdown: '# Scope',
  suggestedBriefPath: 'baseline/brief-v1.0.md',
  suggestedScopePath: 'baseline/scope-v1.0.md',
  missingInformation: [],
  scopeRisks: [],
  confidence: 'medium',
  usedFallback: false,
};

const existingTarget: DraftApplyProjectTarget = {
  projectId: 'existing-project',
  projectPath: '/workspace/clients/acme/projects/existing-project',
  projectName: 'Existing Project',
  shouldCreateProject: false,
};

describe('draftApplyPlan', () => {
  it('creates document paths without requiring project creation', () => {
    const plan = createDraftApplyPlan(existingTarget, pack);

    expect(plan.target.shouldCreateProject).toBe(false);
    expect(plan.documents.map(doc => doc.path)).toEqual([
      '/workspace/clients/acme/projects/existing-project/baseline/brief-v1.0.md',
      '/workspace/clients/acme/projects/existing-project/baseline/scope-v1.0.md',
    ]);
    expect(validateDraftApplyPlan(plan)).toEqual([]);
  });

  it('summarizes staged project creation and document writes', () => {
    const plan = createDraftApplyPlan({
      projectId: 'project-1',
      projectPath: '/workspace/clients/acme/projects/project-1',
      projectName: 'New Project',
      shouldCreateProject: true,
      projectYaml: 'project:\n  id: project-1',
    }, pack);

    expect(summarizeDraftApplyPlan(plan)).toEqual([
      'สร้าง Project ใหม่: New Project',
      'สร้าง Brief Draft: brief-v1.0.md',
      'สร้าง Scope Draft: scope-v1.0.md',
    ]);
  });

  it('requires projectYaml when a new project will be created on apply', () => {
    const plan = createDraftApplyPlan({
      projectId: 'project-1',
      projectPath: '/workspace/clients/acme/projects/project-1',
      projectName: 'New Project',
      shouldCreateProject: true,
    }, pack);

    expect(validateDraftApplyPlan(plan)).toContain('ไม่มี projectYaml สำหรับสร้าง Project ใหม่');
  });

  it('blocks empty markdown bodies', () => {
    const plan = createDraftApplyPlan(existingTarget, { ...pack, scopeMarkdown: ' ' });

    expect(validateDraftApplyPlan(plan)).toContain('Scope Draft ไม่มีเนื้อหา');
  });
});
