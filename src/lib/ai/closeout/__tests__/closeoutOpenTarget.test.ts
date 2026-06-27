import { describe, expect, it } from 'vitest';
import { getCloseoutOpenTarget } from '../closeoutOpenTarget';

const projectPath = '/workspace/clients/client-1/projects/project-1';

describe('closeoutOpenTarget', () => {
  it('returns closeout summary and export index paths when both exist', () => {
    const target = getCloseoutOpenTarget([
      { path: `${projectPath}/closeout/closeout-summary.md`, markdown: '# Closeout' },
      { path: `${projectPath}/exports/closeout-package-index.md`, markdown: '# Export' },
    ]);

    expect(target.closeout_summary_path).toBe(`${projectPath}/closeout/closeout-summary.md`);
    expect(target.export_index_path).toBe(`${projectPath}/exports/closeout-package-index.md`);
  });

  it('normalizes windows paths', () => {
    const target = getCloseoutOpenTarget([
      { path: 'C:\\workspace\\project\\closeout\\closeout-summary.md', markdown: '# Closeout' },
      { path: 'C:\\workspace\\project\\exports\\closeout-package-index.md', markdown: '# Export' },
    ]);

    expect(target.closeout_summary_path).toContain('closeout-summary.md');
    expect(target.export_index_path).toContain('closeout-package-index.md');
  });

  it('returns undefined paths when files do not exist', () => {
    const target = getCloseoutOpenTarget([]);

    expect(target.closeout_summary_path).toBeUndefined();
    expect(target.export_index_path).toBeUndefined();
  });
});
