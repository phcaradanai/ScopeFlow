import { describe, it, expect } from 'vitest';
import { generateApprovalRecord, updateDocumentApprovalStatus } from '../templates';
import { getNextDocumentNumber } from '../document-utils';

describe('Approvals (Test-First)', () => {
  const mockDocs = [
    { filename: 'APR-001-scope-v1.0-approved.md', path: '', isDir: false },
    { filename: 'CR-001-test.md', path: '', isDir: false }
  ];

  it('auto-increments APR numbers', () => {
    expect(getNextDocumentNumber(mockDocs, 'APR')).toBe('002');
  });

  describe('generateApprovalRecord', () => {
    it('generates correct frontmatter for approval record', () => {
      const data = {
        approvalNumber: 'APR-002',
        project: 'proj-1',
        client: 'cli-1',
        approvedDocument: 'scope-v1.0.md',
        documentType: 'scope',
        approvedBy: 'Client Name',
        approvalMethod: 'signed-pdf' as const,
        evidenceFiles: ['file1.jpg']
      };
      
      const doc = generateApprovalRecord(data);
      expect(doc).toContain('type: approval-record');
      expect(doc).toContain('approval_number: APR-002');
      expect(doc).toContain('status: recorded');
      expect(doc).toContain('approval_method: signed-pdf');
      expect(doc).toContain('evidence_files: ["file1.jpg"]');
      expect(doc).toContain('# บันทึกการอนุมัติ: APR-002');
    });

    it('rejects invalid approval methods', () => {
      expect(() => {
        generateApprovalRecord({
          approvalNumber: 'APR-003',
          project: 'proj-1',
          client: 'cli-1',
          approvedDocument: 'doc.md',
          documentType: 'scope',
          approvedBy: 'Name',
          // @ts-expect-error invalid method test
          approvalMethod: 'invalid-method',
          evidenceFiles: []
        });
      }).toThrow('Invalid approval method');
    });
  });

  describe('updateDocumentApprovalStatus', () => {
    it('injects approval fields without destroying other frontmatter', () => {
      const original = `---
type: "scope"
project: "proj-1"
status: "draft"
custom_field: "value"
---
# Content`;

      const updated = updateDocumentApprovalStatus(original, 'John Doe', '2026-06-24', 'APR-001');
      
      expect(updated).toContain('status: "approved"');
      expect(updated).toContain('approved_by: "John Doe"');
      expect(updated).toContain('approved_date: "2026-06-24"');
      expect(updated).toContain('approval_ref: "APR-001"');
      
      // Preserves original fields
      expect(updated).toContain('type: "scope"');
      expect(updated).toContain('project: "proj-1"');
      expect(updated).toContain('custom_field: "value"');
      expect(updated).toContain('# Content');
      
      // Original status is replaced, not duplicated
      expect(updated.match(/status:/g)?.length).toBe(1);
    });
  });
});
