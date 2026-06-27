import { describe, expect, it } from 'vitest';
import { getCloseoutReopenRequestSummary } from '../closeoutReopenDetection';

describe('closeoutReopenDetection', () => {
  it('returns empty summary when no reopen requests exist', () => {
    const summary = getCloseoutReopenRequestSummary([
      { path: '/workspace/project/changes/other-change.md', markdown: '# Change' },
      { path: '/workspace/project/closeout/closeout-summary.md', markdown: '# Closeout' },
    ]);

    expect(summary.has_reopen_request).toBe(false);
    expect(summary.request_count).toBe(0);
    expect(summary.latest_request_path).toBeUndefined();
    expect(summary.request_paths).toEqual([]);
  });

  it('detects reopen request files under changes folder', () => {
    const summary = getCloseoutReopenRequestSummary([
      { path: '/workspace/project/changes/reopen-request-2026-01-01T00-00-00-000Z.md', markdown: '# Reopen' },
      { path: '/workspace/project/changes/reopen-request-2026-01-02T00-00-00-000Z.md', markdown: '# Reopen 2' },
    ]);

    expect(summary.has_reopen_request).toBe(true);
    expect(summary.request_count).toBe(2);
    expect(summary.latest_request_path).toBe('/workspace/project/changes/reopen-request-2026-01-02T00-00-00-000Z.md');
    expect(summary.request_paths).toHaveLength(2);
  });

  it('normalizes windows paths', () => {
    const summary = getCloseoutReopenRequestSummary([
      { path: 'C:\\workspace\\project\\changes\\reopen-request-2026-01-01T00-00-00-000Z.md', markdown: '# Reopen' },
    ]);

    expect(summary.has_reopen_request).toBe(true);
    expect(summary.latest_request_path).toContain('reopen-request-2026-01-01T00-00-00-000Z.md');
  });
});
