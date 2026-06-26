import type { BriefScopeDraftPack } from './briefScopeDraftAssistant';

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
  documents: DraftReviewDocument[];
  missingInformation: string[];
  scopeRisks: string[];
  confidence: BriefScopeDraftPack['confidence'];
  usedFallback: boolean;
}

export function createDraftReviewSession(projectPath: string, pack: BriefScopeDraftPack): DraftReviewSession {
  return {
    projectPath,
    documents: [
      {
        id: 'brief',
        label: 'Brief Draft',
        path: `${projectPath}/${pack.suggestedBriefPath}`,
        markdown: pack.briefMarkdown,
        originalMarkdown: pack.briefMarkdown,
        required: true,
      },
      {
        id: 'scope',
        label: 'Scope Draft',
        path: `${projectPath}/${pack.suggestedScopePath}`,
        markdown: pack.scopeMarkdown,
        originalMarkdown: pack.scopeMarkdown,
        required: true,
      },
    ],
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
  return {
    ...session,
    documents: session.documents.map(doc => doc.id === documentId ? { ...doc, markdown } : doc),
  };
}

export function getDraftReviewWarnings(session: DraftReviewSession): string[] {
  const warnings: string[] = [];

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
