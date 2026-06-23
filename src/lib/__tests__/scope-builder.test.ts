import { describe, it, expect } from 'vitest';
import { generateScopeMarkdown, parseScopeFormData, ScopeFormData } from '../scope-builder';

describe('scope-builder', () => {
  const sampleData: ScopeFormData = {
    title: 'Scope Document',
    project_overview: 'This is the overview.',
    included_items: '- Item 1\n- Item 2',
    excluded_items: 'Nothing excluded.',
    deliverables: '1. App\n2. Docs',
    acceptance_criteria: 'Must pass tests.',
    assumptions: 'Client provides server.'
  };

  describe('generateScopeMarkdown', () => {
    it('should generate markdown string with frontmatter and content', () => {
      const markdown = generateScopeMarkdown(sampleData, 'doc-123');
      
      // Check frontmatter
      expect(markdown).toContain('form_data:');
      expect(markdown).toContain('title: Scope Document');
      
      // Check content sections
      expect(markdown).toContain('# Scope Document');
      expect(markdown).toContain('## 1. ความเป็นมาและวัตถุประสงค์ (Project Overview)');
      expect(markdown).toContain('This is the overview.');
      expect(markdown).toContain('## 2. ขอบเขตที่รวมอยู่ในโครงการ (In-Scope)');
      expect(markdown).toContain('- Item 1');
      expect(markdown).toContain('## 3. สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)');
      expect(markdown).toContain('Nothing excluded.');
      expect(markdown).toContain('## 4. สิ่งที่ต้องส่งมอบ (Deliverables)');
      expect(markdown).toContain('1. App');
      expect(markdown).toContain('## 5. เกณฑ์การตรวจรับ (Acceptance Criteria)');
      expect(markdown).toContain('Must pass tests.');
      expect(markdown).toContain('## 6. ข้อตกลงและเงื่อนไขเพิ่มเติม (Assumptions & Conditions)');
      expect(markdown).toContain('Client provides server.');
    });

    it('should omit sections that are empty', () => {
      const data = { ...sampleData, excluded_items: '' };
      const markdown = generateScopeMarkdown(data, 'doc-123');
      expect(markdown).not.toContain('## 3. สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)');
    });
  });

  describe('parseScopeFormData', () => {
    it('should parse form_data back from markdown', () => {
      const markdown = generateScopeMarkdown(sampleData, '1');
      const parsedData = parseScopeFormData(markdown);
      
      expect(parsedData).toBeDefined();
      expect(parsedData?.title).toBe(sampleData.title);
      expect(parsedData?.project_overview).toBe(sampleData.project_overview);
    });

    it('should return null if no valid frontmatter', () => {
      const markdown = `# Title\n\nContent only`;
      expect(parseScopeFormData(markdown)).toBeNull();
    });
  });
});
