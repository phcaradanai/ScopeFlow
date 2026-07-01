import { describe, expect, it } from 'vitest';
import { buildFollowUpAnswerUpdateDraft, decideFollowUpAnswerDeterministically } from '../followUpAnswerDecision';

describe('decideFollowUpAnswerDeterministically', () => {
  it('routes basic project context answers to Brief updates', () => {
    const decision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้ายืนยัน deadline เป็นสิ้นเดือนนี้ และผู้อนุมัติคือคุณเอ',
      question: 'deadline และผู้อนุมัติคือใคร?',
    });

    expect(decision.recommended_action).toBe('update_brief');
    expect(decision.guardrails.can_update_brief).toBe(true);
    expect(decision.impact_summary).toContain('Brief');
  });

  it('routes scope details to Scope updates when Scope is not locked', () => {
    const decision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้าตอบว่าต้องรวม deploy และส่งมอบคู่มือการใช้งานด้วย',
      scopeStatus: 'draft',
      scopeLocked: false,
    });

    expect(decision.recommended_action).toBe('update_scope');
    expect(decision.guardrails.can_update_scope).toBe(true);
    expect(decision.guardrails.should_create_change_request).toBe(false);
  });

  it('routes new scope changes after approval to Change Request', () => {
    const decision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้าขอเพิ่มรายงานยอดขายรายวันอีกหนึ่งหน้า',
      scopeStatus: 'approved',
      scopeLocked: true,
    });

    expect(decision.recommended_action).toBe('create_change_request');
    expect(decision.guardrails.can_update_scope).toBe(false);
    expect(decision.guardrails.should_create_change_request).toBe(true);
    expect(decision.guardrails.reason).toContain('ห้ามเขียนทับ');
  });

  it('asks more questions when the customer answer is still unclear', () => {
    const decision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้ายังไม่แน่ใจ ขอถามทีมก่อน',
    });

    expect(decision.recommended_action).toBe('ask_more_questions');
    expect(decision.follow_up_questions.length).toBeGreaterThan(0);
  });

  it('builds safe update drafts without pretending approval or evidence exists', () => {
    const decision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้ายืนยัน deadline เป็นสิ้นเดือนนี้',
    });
    const draft = buildFollowUpAnswerUpdateDraft(decision, 'Brief');

    expect(draft).toContain('Proposed Brief Update from Follow-up Answer');
    expect(draft).toContain('ยังไม่ใช่ approval/evidence ใหม่');
    expect(draft).toContain('คำตอบนี้กระทบ Brief/Scope อย่างไร');
  });
});
