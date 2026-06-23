import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripFrontmatter, exportApprovalPack, generateApprovalPackHtml } from '../export';
import * as tauriCommands from '../tauri-commands';
import { DocumentInfo } from '../tauri-commands';

// Mock the tauri commands
vi.mock('../tauri-commands', () => ({
  readFileContent: vi.fn(),
  writeFileContent: vi.fn(),
  pathExists: vi.fn(),
}));

describe('export.ts', () => {
  describe('stripFrontmatter', () => {
    it('should strip YAML frontmatter', () => {
      const markdown = `---
title: Scope
version: 1.0
---
# Heading 1
This is content.`;
      const result = stripFrontmatter(markdown);
      expect(result).toBe('# Heading 1\nThis is content.');
    });

    it('should leave markdown without frontmatter unchanged', () => {
      const markdown = `# Heading 1\nThis is content.`;
      const result = stripFrontmatter(markdown);
      expect(result).toBe(markdown);
    });
  });

  describe('generateApprovalPackHtml', () => {
    it('should include cover page and approval section', async () => {
      const docs = [
        { title: 'scope-v1.0.md', content: '# Scope Content' },
      ];
      
      const html = await generateApprovalPackHtml('Project X', 'Client Y', docs);
      
      expect(html).toContain('Project X');
      expect(html).toContain('Client Y');
      expect(html).toContain('scope-v1.0.md'); // document list
      expect(html).toContain('<h1>Scope Content</h1>'); // marked heading
      expect(html).toContain('ส่วนการลงนามอนุมัติ (Approval Section)');
    });

    it('should sanitize HTML to prevent XSS', async () => {
      const docs = [
        { 
          title: 'xss-test.md', 
          content: `
# Safe Heading
<script>alert('xss');</script>
[Evil Link](javascript:alert('xss'))
<img src="x" onerror="alert(1)">
<iframe src="http://evil.com"></iframe>
          ` 
        },
      ];
      
      const html = await generateApprovalPackHtml('Project X', 'Client Y', docs);
      
      expect(html).toContain('<h1>Safe Heading</h1>');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert(');
      expect(html).not.toContain('javascript:alert');
      expect(html).not.toContain('onerror=');
      expect(html).not.toContain('<iframe');
    });

    it('should preserve safe markdown features', async () => {
      const docs = [
        { 
          title: 'safe.md', 
          content: `
| A | B |
|---|---|
| 1 | 2 |

[Safe Link](https://google.com)
![Safe Image](./attachments/img.png)
- [x] Checkbox
          ` 
        },
      ];
      
      const html = await generateApprovalPackHtml('Project X', 'Client Y', docs);
      
      expect(html).toContain('<table>');
      expect(html).toContain('href="https://google.com"');
      expect(html).toContain('src="./attachments/img.png"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
    });
  });

  describe('exportApprovalPack', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should orchestrate export and handle name collisions', async () => {
      const selectedDocs: DocumentInfo[] = [
        { path: '/proj/baseline/scope-v1.0.md', filename: 'scope-v1.0.md', folder: 'baseline' },
      ];

      vi.mocked(tauriCommands.readFileContent).mockResolvedValue('---\ntitle: test\n---\n# Scope Content');
      
      // Simulate file exists for the first try, doesn't exist for the second
      vi.mocked(tauriCommands.pathExists)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const finalPath = await exportApprovalPack('/proj', 'Project X', 'Client Y', selectedDocs);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const expectedPath = `/proj/exports/approval-pack-${dateStr}-1.html`;
      
      expect(finalPath).toBe(expectedPath);
      expect(tauriCommands.readFileContent).toHaveBeenCalledTimes(1);
      expect(tauriCommands.writeFileContent).toHaveBeenCalledTimes(1);
      
      // Verify HTML content written
      const writtenHtml = vi.mocked(tauriCommands.writeFileContent).mock.calls[0][1];
      expect(writtenHtml).toContain('<h1>Scope Content</h1>');
      expect(writtenHtml).not.toContain('title: test'); // frontmatter stripped
    });
  });
});
