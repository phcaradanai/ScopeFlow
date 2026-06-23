import { describe, it, expect } from 'vitest';
import { getNextRevisionFilename, generateRevisionDocument } from '../revisions';

describe('Revisions (Test-First)', () => {
  describe('getNextRevisionFilename', () => {
    it('bumps minor versions for scope/quotation/acceptance', () => {
      expect(getNextRevisionFilename('scope-v1.0.md')).toBe('scope-v1.1.md');
      expect(getNextRevisionFilename('quotation-v1.0.md')).toBe('quotation-v1.1.md');
      expect(getNextRevisionFilename('acceptance-checklist-v2.1.md')).toBe('acceptance-checklist-v2.2.md');
    });

    it('bumps major versions if requested', () => {
      expect(getNextRevisionFilename('scope-v1.0.md', true)).toBe('scope-v2.0.md');
      expect(getNextRevisionFilename('scope-v2.4.md', true)).toBe('scope-v3.0.md');
    });

    it('appends or bumps rev for CR/DCR/SUP/MA', () => {
      expect(getNextRevisionFilename('CR-001-add-sales-report.md')).toBe('CR-001-add-sales-report-rev1.md');
      expect(getNextRevisionFilename('CR-001-add-sales-report-rev1.md')).toBe('CR-001-add-sales-report-rev2.md');
      expect(getNextRevisionFilename('DCR-002-test-rev5.md')).toBe('DCR-002-test-rev6.md');
    });
  });

  describe('generateRevisionDocument', () => {
    it('resets status to draft and clears approval fields', () => {
      const original = `---
type: "scope"
status: "approved"
locked: true
locked_date: "2026-06-24"
approved_by: "John Doe"
approved_date: "2026-06-24"
approval_ref: "APR-001"
created: "2026-06-01"
updated: "2026-06-24"
---
# Content`;

      const revised = generateRevisionDocument(original, 'scope-v1.0.md', '2026-06-25');
      
      expect(revised).toContain('status: "draft"');
      expect(revised).toContain('locked: false');
      expect(revised).toContain('previous_version: "scope-v1.0.md"');
      expect(revised).toContain('updated: "2026-06-25"');
      expect(revised).toContain('created: "2026-06-25"');
      
      // Fields should be cleared or set empty
      expect(revised).toContain('approved_by: ""');
      expect(revised).toContain('approved_date: ""');
      expect(revised).toContain('approval_ref: ""');
      
      // locked_date should be removed
      expect(revised).not.toContain('locked_date:');
    });
  });
});
