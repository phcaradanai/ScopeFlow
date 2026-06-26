import { describe, expect, it } from 'vitest';
import {
  canApplyDraftReview,
  createDraftReviewSession,
  getDraftReviewWarnings,
  updateDraftReviewDocument,
} from '../draftReviewSession';
import type { BriefScopeDraftPack } from '../briefScopeDraftAssistant';

const pack: BriefScopeDraftPack = {
  briefMarkdown: '# Brief\ncontent',
  scopeMarkdown: '# Scope\ncontent',
  suggestedBriefPath: 'baseline/brief-v1.0.md',
  suggestedScopePath: 'baseline/scope-v1.0.md',
  missingInformation: ['ยังไม่รู้ใครเตรียมเนื้อหา'],
  scopeRisks: ['อาจแก้ดีไซน์หลายรอบ'],
  confidence: 'medium',
  usedFallback: false,
};

describe('draftReviewSession', () => {
  it('creates reviewable documents from a draft pack', () => {
    const session = createDraftReviewSession('/workspace/project', pack);

    expect(session.projectPath).toBe('/workspace/project');
    expect(session.documents).toHaveLength(2);
    expect(session.documents[0]).toMatchObject({
      id: 'brief',
      label: 'Brief Draft',
      path: '/workspace/project/baseline/brief-v1.0.md',
      markdown: '# Brief\ncontent',
      required: true,
    });
    expect(session.documents[1]).toMatchObject({
      id: 'scope',
      path: '/workspace/project/baseline/scope-v1.0.md',
    });
  });

  it('updates one review document without mutating the others', () => {
    const session = createDraftReviewSession('/workspace/project', pack);
    const updated = updateDraftReviewDocument(session, 'scope', '# Edited Scope');

    expect(updated.documents.find(doc => doc.id === 'scope')?.markdown).toBe('# Edited Scope');
    expect(updated.documents.find(doc => doc.id === 'brief')?.markdown).toBe('# Brief\ncontent');
    expect(session.documents.find(doc => doc.id === 'scope')?.markdown).toBe('# Scope\ncontent');
  });

  it('returns review warnings for missing info and scope risks', () => {
    const session = createDraftReviewSession('/workspace/project', pack);
    const warnings = getDraftReviewWarnings(session);

    expect(warnings).toContain('ยังมีข้อมูลไม่ชัด 1 รายการ');
    expect(warnings).toContain('พบความเสี่ยง scope creep 1 รายการ');
  });

  it('warns when fallback and low confidence are present', () => {
    const session = createDraftReviewSession('/workspace/project', {
      ...pack,
      confidence: 'low',
      usedFallback: true,
    });

    expect(getDraftReviewWarnings(session)).toEqual(expect.arrayContaining([
      'AI provider ไม่พร้อมหรือผลลัพธ์ไม่ผ่าน validation ระบบจึงใช้ rule-based fallback',
      'ความมั่นใจต่ำ ควรถามลูกค้าเพิ่มเติมก่อนนำ Scope ไปเสนอราคา',
    ]));
  });

  it('blocks apply when a required markdown body is empty', () => {
    const session = createDraftReviewSession('/workspace/project', pack);
    const updated = updateDraftReviewDocument(session, 'brief', '   ');

    expect(canApplyDraftReview(updated)).toBe(false);
    expect(getDraftReviewWarnings(updated)).toContain('เอกสารจำเป็นยังว่าง: Brief Draft');
  });
});
