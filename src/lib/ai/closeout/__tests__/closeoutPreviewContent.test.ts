import { describe, expect, it } from 'vitest';
import { buildCloseoutContentPreview } from '../closeoutPreviewContent';

describe('closeoutPreviewContent', () => {
  it('returns the full markdown when it is within the preview limit', () => {
    const preview = buildCloseoutContentPreview('# Title\nLine 2', 12);

    expect(preview.preview_markdown).toBe('# Title\nLine 2');
    expect(preview.line_count).toBe(2);
    expect(preview.hidden_line_count).toBe(0);
    expect(preview.truncated).toBe(false);
  });

  it('truncates markdown after the configured number of lines', () => {
    const markdown = Array.from({ length: 15 }, (_, index) => `Line ${index + 1}`).join('\n');
    const preview = buildCloseoutContentPreview(markdown, 12);

    expect(preview.preview_markdown).toContain('Line 1');
    expect(preview.preview_markdown).toContain('Line 12');
    expect(preview.preview_markdown).not.toContain('Line 13');
    expect(preview.line_count).toBe(15);
    expect(preview.hidden_line_count).toBe(3);
    expect(preview.truncated).toBe(true);
  });

  it('supports a smaller custom preview limit', () => {
    const preview = buildCloseoutContentPreview('A\nB\nC', 2);

    expect(preview.preview_markdown).toBe('A\nB');
    expect(preview.hidden_line_count).toBe(1);
    expect(preview.truncated).toBe(true);
  });
});
