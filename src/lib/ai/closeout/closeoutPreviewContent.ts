export interface CloseoutContentPreview {
  preview_markdown: string;
  line_count: number;
  hidden_line_count: number;
  truncated: boolean;
}

export function buildCloseoutContentPreview(markdown: string, maxLines = 12): CloseoutContentPreview {
  const lines = markdown.split(/\r?\n/);
  const previewLines = lines.slice(0, maxLines);
  const hiddenLineCount = Math.max(lines.length - previewLines.length, 0);

  return {
    preview_markdown: previewLines.join('\n'),
    line_count: lines.length,
    hidden_line_count: hiddenLineCount,
    truncated: hiddenLineCount > 0,
  };
}
