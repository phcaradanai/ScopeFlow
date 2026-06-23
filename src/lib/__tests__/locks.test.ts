import { describe, it, expect } from 'vitest';
import { lockDocument } from '../templates';

describe('Locks (Test-First)', () => {
  describe('lockDocument', () => {
    it('injects locked true and locked_date without destroying frontmatter', () => {
      const original = `---
type: "scope"
project: "proj-1"
locked: false
custom_field: "value"
---
# Content`;

      const updated = lockDocument(original, '2026-06-24');
      
      expect(updated).toContain('locked: true');
      expect(updated).toContain('locked_date: "2026-06-24"');
      
      // Preserves original fields
      expect(updated).toContain('type: "scope"');
      expect(updated).toContain('project: "proj-1"');
      expect(updated).toContain('custom_field: "value"');
      expect(updated).toContain('# Content');
      
      // Original locked is replaced, not duplicated
      expect(updated.match(/locked:/g)?.length).toBe(1);
    });
  });
});
