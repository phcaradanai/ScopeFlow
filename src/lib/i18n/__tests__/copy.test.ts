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

  it('falls back to English when a locale does not provide a key', () => {
    expect(t('guided.title', 'en')).toBe('Run the next project action from here');
    expect(t('quality.scopeRisks', 'en')).toBe('Scope growth risks');
  });

  it('interpolates lightweight parameters', () => {
    expect(t('conflict.existingTitle', 'th', { documentLabel: 'Scope' })).toBe('มี Scope อยู่แล้ว');
    expect(t('documentCreation.createAndOpen', 'en', { cta: 'Create Scope' })).toContain('Create Scope');
  });
});
