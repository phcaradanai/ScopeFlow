import { describe, it, expect } from 'vitest';
import { extractDocumentMetadata } from '../document-scanner';

describe('document-scanner', () => {
  const projectPath = '/Users/test/workspace/client/project';

  describe('extractDocumentMetadata', () => {
    it('should extract metadata from valid frontmatter', () => {
      const content = `---
title: System Scope
type: scope
status: approved
version: 1.2
locked: true
approved_by: John Doe
---
# Welcome
This is the excerpt text that should be extracted.`;

      const filePath = '/Users/test/workspace/client/project/baseline/scope-v1.2.md';
      const result = extractDocumentMetadata(filePath, content, projectPath);

      expect(result.file_name).toBe('scope-v1.2.md');
      expect(result.folder).toBe('baseline');
      expect(result.title).toBe('System Scope');
      expect(result.type).toBe('scope');
      expect(result.status).toBe('approved');
      expect(result.version).toBe('1.2');
      expect(result.locked).toBe(true);
      expect(result.approved_by).toBe('John Doe');
      expect(result.parse_status).toBe('success');
      expect(result.excerpt).toBe('Welcome This is the excerpt text that should be extracted.');
    });

    it('should fallback to H1 and default type if frontmatter is missing', () => {
      const content = `# Fallback Title
Some body text.`;

      const filePath = '/Users/test/workspace/client/project/change-requests/cr-01.md';
      const result = extractDocumentMetadata(filePath, content, projectPath);

      expect(result.title).toBe('Fallback Title');
      expect(result.type).toBe('change-requests');
      expect(result.status).toBe('draft');
      expect(result.parse_status).toBe('warning');
      expect(result.excerpt).toBe('Fallback Title Some body text.');
    });

    it('should not crash on invalid frontmatter and return defaults', () => {
      const content = `---
invalid: yaml: [
---
# Invalid File`;

      const filePath = '/Users/test/workspace/client/project/baseline/bad.md';
      const result = extractDocumentMetadata(filePath, content, projectPath);

      expect(result.title).toBe('Invalid File');
      expect(result.type).toBe('baseline');
      expect(result.parse_status).toBe('warning');
      expect(result.excerpt).toBe('Invalid File');
    });

    it('should properly label export HTML files', () => {
      const filePath = '/Users/test/workspace/client/project/exports/pack.html';
      const result = extractDocumentMetadata(filePath, '<html></html>', projectPath);

      expect(result.type).toBe('export');
      expect(result.status).toBe('exported');
      expect(result.parse_status).toBe('success');
    });

    it('should handle deeply nested folder paths gracefully', () => {
      const content = `# Deep`;
      const filePath = '/Users/test/workspace/client/project/baseline/subfolder/deep.md';
      const result = extractDocumentMetadata(filePath, content, projectPath);

      expect(result.folder).toBe('baseline');
      expect(result.file_name).toBe('deep.md');
    });
  });
});
