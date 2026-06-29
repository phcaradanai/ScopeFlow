import { describe, expect, it } from 'vitest';
import { evaluateBriefReadiness } from '../briefReadiness';
import type { ScopeDigestOutput } from '../../scope-digest/scopeDigestSchema';

const digest = {
  understanding: ['ลูกค้าต้องการเว็บขายของสำหรับขายสินค้าออนไลน์'],
  confirmed_facts: ['มีระบบสินค้า ตะกร้า ชำระเงิน และหลังบ้าน admin'],
  assumptions: ['อาจต้องมีระบบสมาชิกและจัดการสต็อก'],
  unclear_points: ['ยังไม่ชัดเรื่องขนส่งและ payment gateway'],
  questions_to_ask: ['ต้องเชื่อม payment gateway เจ้าไหน?', 'ต้องการเปิดใช้เมื่อไหร่?'],
  likely_in_scope: ['สินค้า', 'ตะกร้า', 'checkout', 'หลังบ้านจัดการสินค้า'],
  likely_out_of_scope: ['mobile app ถ้าไม่ได้ยืนยัน'],
  scope_creep_risks: ['payment/shipping requirements unclear'],
  suggested_next_documents: ['Brief', 'Scope', 'Quotation'],
  detected_project_type: 'เว็บขายของ',
  confidence: 'medium',
  is_fallback: false,
} as unknown as ScopeDigestOutput;

describe('evaluateBriefReadiness', () => {
  it('marks vague requests as not ready and suggests high-value questions', () => {
    const result = evaluateBriefReadiness('อยากทำระบบให้ร้านหน่อย');

    expect(result.level).toBe('not_ready');
    expect(result.canCreateBriefDraft).toBe(false);
    expect(result.shouldCreateScopeDraft).toBe(false);
    expect(result.suggestedQuestions).toContain('ฟีเจอร์ที่จำเป็นต้องมีในรอบแรกมีอะไรบ้าง และอะไรยังไม่รวม?');
    expect(result.suggestedQuestions).toContain('ใครคือผู้ใช้งานหลัก และแต่ละบทบาทต้องทำอะไรได้บ้าง?');
  });

  it('uses raw request and digest evidence to determine draft readiness', () => {
    const result = evaluateBriefReadiness(
      'ต้องการเว็บขายของ มีสินค้า ตะกร้า ชำระเงิน พร้อมเพย์ หลังบ้าน admin รายงานยอดขาย ใช้งานบนเว็บ',
      digest
    );

    expect(result.level).toBe('draft_ready');
    expect(result.canCreateBriefDraft).toBe(true);
    expect(result.shouldCreateScopeDraft).toBe(true);
    expect(result.signals.find(signal => signal.id === 'features')?.present).toBe(true);
    expect(result.signals.find(signal => signal.id === 'integration')?.present).toBe(true);
  });

  it('does not recommend quotation when important commercial details are missing', () => {
    const result = evaluateBriefReadiness(
      'ต้องการ web app สำหรับ admin จัดการสินค้า สต็อก รายงาน และ export excel',
      digest
    );

    expect(result.canCreateBriefDraft).toBe(true);
    expect(result.shouldCreateQuotation).toBe(false);
    expect(result.suggestedQuestions).toContain('มีงบประมาณเป้าหมายหรือกรอบราคาไหม เพื่อช่วยจัด scope ให้เหมาะสม?');
  });
});
