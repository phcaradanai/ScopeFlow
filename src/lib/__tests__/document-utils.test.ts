import { describe, it, expect } from 'vitest';
import { getNextDocumentNumber, getDocumentFilePath } from '../document-utils';

describe('document-utils.ts', () => {
  describe('getNextDocumentNumber', () => {
    const mockDocuments: any[] = [
      { filename: 'CR-001-some-slug.md', path: '', isDir: false },
      { filename: 'CR-002-another.md', path: '', isDir: false },
      { filename: 'DCR-001-feature.md', path: '', isDir: false },
      { filename: 'SUP-015-bug.md', path: '', isDir: false },
      { filename: 'MA-002-update.md', path: '', isDir: false },
      { filename: 'scope-v1.0.md', path: '', isDir: false },
      { filename: 'CR-invalid.md', path: '', isDir: false },
    ];

    it('finds next CR number', () => {
      expect(getNextDocumentNumber(mockDocuments, 'CR')).toBe('003');
    });

    it('finds next DCR number independently', () => {
      expect(getNextDocumentNumber(mockDocuments, 'DCR')).toBe('002');
    });

    it('finds next SUP number independently', () => {
      expect(getNextDocumentNumber(mockDocuments, 'SUP')).toBe('016');
    });

    it('finds next MA number independently', () => {
      expect(getNextDocumentNumber(mockDocuments, 'MA')).toBe('003');
    });

    it('starts at 001 if no matching documents exist', () => {
      expect(getNextDocumentNumber(mockDocuments, 'NEW')).toBe('001');
      expect(getNextDocumentNumber([], 'CR')).toBe('001');
    });
  });

  describe('getDocumentFilePath', () => {
    const projectPath = '/tmp/test/projects/p1';
    const slug = 'test-slug';
    const numberStr = '001';

    it('returns correct path for scope', () => {
      const res = getDocumentFilePath(projectPath, 'scope', slug, numberStr);
      expect(res.filename).toBe('scope-v1.0.md');
      expect(res.fullPath).toBe(`${projectPath}/baseline/scope-v1.0.md`);
    });

    it('returns correct path for quotation', () => {
      const res = getDocumentFilePath(projectPath, 'quotation', slug, numberStr);
      expect(res.filename).toBe('quotation-v1.0.md');
      expect(res.fullPath).toBe(`${projectPath}/baseline/quotation-v1.0.md`);
    });

    it('returns correct path for cr', () => {
      const res = getDocumentFilePath(projectPath, 'cr', slug, numberStr);
      expect(res.filename).toBe('CR-001-test-slug.md');
      expect(res.fullPath).toBe(`${projectPath}/change-requests/CR-001-test-slug.md`);
    });

    it('returns correct path for dcr', () => {
      const res = getDocumentFilePath(projectPath, 'dcr', slug, numberStr);
      expect(res.filename).toBe('DCR-001-test-slug.md');
      expect(res.fullPath).toBe(`${projectPath}/change-requests/DCR-001-test-slug.md`);
    });

    it('returns correct path for sup', () => {
      const res = getDocumentFilePath(projectPath, 'sup', slug, numberStr);
      expect(res.filename).toBe('SUP-001-test-slug.md');
      expect(res.fullPath).toBe(`${projectPath}/support-requests/SUP-001-test-slug.md`);
    });

    it('returns correct path for ma', () => {
      const res = getDocumentFilePath(projectPath, 'ma', slug, numberStr);
      expect(res.filename).toBe('MA-001-test-slug.md');
      expect(res.fullPath).toBe(`${projectPath}/support-requests/MA-001-test-slug.md`);
    });

    it('returns correct path for acceptance', () => {
      const res = getDocumentFilePath(projectPath, 'acceptance', slug, numberStr);
      expect(res.filename).toBe('acceptance-checklist-v1.0.md');
      expect(res.fullPath).toBe(`${projectPath}/acceptance/acceptance-checklist-v1.0.md`);
    });
  });
});
