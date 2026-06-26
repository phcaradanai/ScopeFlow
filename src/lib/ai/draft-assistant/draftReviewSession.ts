import type { BriefScopeDraftPack } from './briefScopeDraftAssistant';
import type { DraftApplyPlan } from './draftApplyPlan';

export type DraftReviewDocumentType = 'brief' | 'scope';

export interface DraftReviewDocument {
  id: DraftReviewDocumentType;
  label: string;
  path: string;
  markdown: string;
  originalMarkdown: string;
  required: boolean;
}

export interface DraftReviewSession {
  projectPath: string;
  applyPlan?: DraftApplyPlan;
  documents: DraftReviewDocument[];
  missingInformation: string[];
  scopeRisks: string[];
  confidence: BriefScopeDraftPack['confidence'];
  usedFallback: boolean;
}

export function createDraftReviewSession(projectPath: string, pack: BriefScopeDraftPack, applyPlan?: DraftApplyPlan): DraftReviewSession {
  const documents = applyPlan ? applyPlan.documents : [
    {
      id: 'brief' as const,
      label: 'Brief Draft',
      path: `${projectPath}/${pack.suggestedBriefPath}`,
      markdown: pack.briefMarkdown,
    },
    {
      id: 'scope' as const,
      label: 'Scope Draft',
      path: `${projectPath}/${pack.suggestedScopePath}`,
      markdown: pack.scopeMarkdown,
    },
  ];

  return {
    projectPath,
    applyPlan,
    documents: documents.map(doc => ({
      id: doc.id,
      label: doc.label,
      path: doc.path,
      markdown: doc.markdown,
      originalMarkdown: doc.markdown,
      required: true,
    })),
    missingInformation: pack.missingInformation,
    scopeRisks: pack.scopeRisks,
    confidence: pack.confidence,
    usedFallback: pack.usedFallback,
  };
}

export function updateDraftReviewDocument(
  session: DraftReviewSession,
  documentId: DraftReviewDocumentType,
  markdown: string
): DraftReviewSession {
  const documents = session.documents.map(doc => doc.id === documentId ? { ...doc, markdown } : doc);

  return {
    ...session,
    documents,
    applyPlan: session.applyPlan ? {
      ...session.applyPlan,
      documents: session.applyPlan.documents.map(doc => doc.id === documentId ? { ...doc, markdown } : doc),
    } : undefined,
  };
}

export function getDraftReviewWarnings(session: DraftReviewSession): string[] {
  const warnings: string[] = [];

  if (session.applyPlan?.target.shouldCreateProject) {
    warnings.push('Project นี้ยังไม่ถูกสร้างจริง ระบบจะสร้าง Project ตอนกด Apply เท่านั้น');
  }

  if (session.usedFallback) {
    warnings.push('AI provider ไม่พร้อมหรือผลลัพธ์ไม่ผ่าน validation ระบบจึงใช้ rule-based fallback');
  }

  if (session.confidence === 'low') {
    warnings.push('ความมั่นใจต่ำ ควรถามลูกค้าเพิ่มเติมก่อนนำ Scope ไปเสนอราคา');
  }

  if (session.missingInformation.length > 0) {
    warnings.push(`ยังมีข้อมูลไม่ชัด ${session.missingInformation.length} รายการ`);
  }

  if (session.scopeRisks.length > 0) {
    warnings.push(`พบความเสี่ยง scope creep ${session.scopeRisks.length} รายการ`);
  }

  const emptyDocs = session.documents.filter(doc => doc.required && doc.markdown.trim().length === 0);
  if (emptyDocs.length > 0) {
    warnings.push(`เอกสารจำเป็นยังว่าง: ${emptyDocs.map(doc => doc.label).join(', ')}`);
  }

  return warnings;
}

export function canApplyDraftReview(session: DraftReviewSession): boolean {
  return session.documents.every(doc => !doc.required || doc.markdown.trim().length > 0);
}
