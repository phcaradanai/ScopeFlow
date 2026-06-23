import { describe, it, expect } from 'vitest';
import { validateSlug, nameToSlug } from '../validation';

describe('validation.ts', () => {
  describe('validateSlug', () => {
    it('fails on empty slug', () => {
      expect(validateSlug('').valid).toBe(false);
      expect(validateSlug('   ').valid).toBe(false);
    });

    it('fails on Thai characters', () => {
      expect(validateSlug('ทดสอบ').valid).toBe(false);
      expect(validateSlug('test-ทดสอบ').valid).toBe(false);
    });

    it('fails on spaces', () => {
      expect(validateSlug('add sales report').valid).toBe(false);
    });

    it('fails on underscores', () => {
      expect(validateSlug('add_sales_report').valid).toBe(false);
    });

    it('fails on symbols', () => {
      expect(validateSlug('add@report').valid).toBe(false);
      expect(validateSlug('!!!').valid).toBe(false);
    });

    it('passes on lowercase a-z, 0-9, and hyphen', () => {
      expect(validateSlug('add-sales-report').valid).toBe(true);
      expect(validateSlug('fix-login-bug-2').valid).toBe(true);
      expect(validateSlug('update-payment-flow').valid).toBe(true);
    });

    it('fails if starting or ending with hyphen', () => {
      expect(validateSlug('-add-report').valid).toBe(false);
      expect(validateSlug('add-report-').valid).toBe(false);
    });
  });

  describe('nameToSlug', () => {
    it('generates correct slug for English phrases', () => {
      expect(nameToSlug('Add Sales Report')).toBe('add-sales-report');
      expect(nameToSlug('Fix Login Bug 2')).toBe('fix-login-bug-2');
    });

    it('strips invalid characters', () => {
      expect(nameToSlug('Hello @ World!')).toBe('hello-world');
      expect(nameToSlug('some_variable_name')).toBe('some-variable-name');
    });

    it('returns empty string for Thai-only titles', () => {
      expect(nameToSlug('เพิ่มระบบรายงานยอดขาย')).toBe('');
      expect(nameToSlug('ทดสอบ')).toBe('');
    });

    it('generates partial slug for mixed Thai and English', () => {
      expect(nameToSlug('Fix บั๊ก Login')).toBe('fix-login');
    });

    it('never produces "unnamed"', () => {
      expect(nameToSlug('!!!')).toBe('');
      expect(nameToSlug('   ')).toBe('');
    });
  });
});
