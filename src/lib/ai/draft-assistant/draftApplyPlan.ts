import type { BriefScopeDraftPack } from './briefScopeDraftAssistant';

export interface DraftApplyProjectTarget {
  projectId: string;
  projectPath: string;
  projectName: string;
  shouldCreateProject: boolean;
  projectYaml?: string;
}

export interface DraftApplyPlan {
  target: DraftApplyProjectTarget;
  documents: {
    id: 'brief' | 'scope' | 'quotation';
    label: string;
    path: string;
    markdown: string;
  }[];
}

export function createDraftApplyPlan(target: DraftApplyProjectTarget, pack: BriefScopeDraftPack): DraftApplyPlan {
  return {
    target,
    documents: [
      {
        id: 'brief',
        label: 'Brief Draft',
        path: `${target.projectPath}/${pack.suggestedBriefPath}`,
        markdown: pack.briefMarkdown,
      },
      {
        id: 'scope',
        label: 'Scope Draft',
        path: `${target.projectPath}/${pack.suggestedScopePath}`,
        markdown: pack.scopeMarkdown,
      },
      {
        id: 'quotation',
        label: 'Quotation Draft',
        path: `${target.projectPath}/${pack.suggestedQuotationPath}`,
        markdown: pack.quotationMarkdown,
      },
    ],
  };
}

export function summarizeDraftApplyPlan(plan: DraftApplyPlan): string[] {
  const actions = [];
  if (plan.target.shouldCreateProject) {
    actions.push(`สร้าง Project ใหม่: ${plan.target.projectName}`);
  }
  actions.push(...plan.documents.map(doc => `สร้าง ${doc.label}: ${doc.path.split(/[/\\]/).pop() || doc.path}`));
  return actions;
}

export function validateDraftApplyPlan(plan: DraftApplyPlan): string[] {
  const errors: string[] = [];
  if (!plan.target.projectId.trim()) errors.push('ไม่มี projectId');
  if (!plan.target.projectPath.trim()) errors.push('ไม่มี projectPath');
  if (plan.target.shouldCreateProject && !plan.target.projectYaml?.trim()) errors.push('ไม่มี projectYaml สำหรับสร้าง Project ใหม่');
  for (const doc of plan.documents) {
    if (!doc.path.trim()) errors.push(`${doc.label} ไม่มี path`);
    if (!doc.markdown.trim()) errors.push(`${doc.label} ไม่มีเนื้อหา`);
  }
  return errors;
}
