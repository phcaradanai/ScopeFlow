import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, t } from '../copy';

describe('Thai-first i18n copy foundation', () => {
  it('uses Thai as the default locale and English as fallback locale', () => {
    expect(DEFAULT_LOCALE).toBe('th');
    expect(FALLBACK_LOCALE).toBe('en');
  });

  it('contains key flow copy in Thai by default', () => {
    expect(t('guided.title')).toContain('ไม่ต้องจำขั้นตอนเอง');
    expect(t('quality.customerQuestions')).toBe('ข้อมูลที่ยังต้องถามลูกค้า');
    expect(t('documentCreation.continueToCreate')).toBe('ไปสร้างเอกสาร');
    expect(t('conflict.actions.versionTitle')).toBe('สร้างเวอร์ชันใหม่');
  });

  it('contains follow-up loop copy in Thai by default', () => {
    expect(t('quality.answerIntakeTitle')).toBe('ข้อมูลที่ลูกค้าตอบกลับ');
    expect(t('quality.answerImpactTitle')).toBe('คำตอบนี้กระทบ Brief/Scope อย่างไร');
    expect(t('quality.safeUpdate')).toBe('อัปเดตเอกสารอย่างปลอดภัย');
    expect(t('quality.createChangeRequestInstead')).toBe('สร้าง Change Request แทนการแก้ Scope เดิม');
  });

  it('contains readiness gate copy in Thai by default', () => {
    expect(t('quality.readinessGateTitle')).toBe('Project Readiness Gate');
    expect(t('quality.readyForQuote')).toBe('พร้อมเสนอราคา');
    expect(t('quality.readyForDelivery')).toBe('พร้อมส่งมอบ');
    expect(t('quality.openFollowUp')).toBe('ยังติดคำตอบลูกค้า');
    expect(t('quality.openChangeRequest')).toBe('มี Change Request ที่ยังไม่ปิด');
  });

  it('falls back to English when a locale does not provide a key', () => {
    expect(t('guided.title', 'en')).toBe('Run the next project action from here');
    expect(t('quality.scopeRisks', 'en')).toBe('Scope growth risks');
    expect(t('quality.answerIntakeTitle', 'en')).toBe('Customer answer returned');
    expect(t('quality.readyForQuote', 'en')).toBe('Ready for Quote');
  });

  it('interpolates lightweight parameters', () => {
    expect(t('conflict.existingTitle', 'th', { documentLabel: 'Scope' })).toBe('มี Scope อยู่แล้ว');
    expect(t('documentCreation.createAndOpen', 'en', { cta: 'Create Scope' })).toContain('Create Scope');
  });
});
