import { describe, expect, it, vi } from 'vitest';
import { executeCloseoutReopenCreateOutputAction } from '../closeoutReopenCreateOutputExecutor';
import type { CloseoutReopenCreateOutputAction } from '../closeoutReopenCreateOutputAction';

const enabledAction: CloseoutReopenCreateOutputAction = {
  enabled: true,
  label: 'Create CR quotation',
  reason: 'Create output',
  output: {
    can_create: true,
    label: 'Create CR quotation',
    reason: 'Create output',
    path: '/workspace/project/changes/change-request-quote.md',
    markdown: '# Change Request Quote',
  },
};

describe('closeoutReopenCreateOutputExecutor', () => {
  it('does not create when action is disabled', async () => {
    const createDocument = vi.fn();
    const pathExists = vi.fn();
    const result = await executeCloseoutReopenCreateOutputAction(
      { enabled: false, label: 'Create reopen output', reason: 'เลือก decision ก่อน' },
      createDocument,
      pathExists
    );

    expect(result.created).toBe(false);
    expect(result.reason).toContain('เลือก decision');
    expect(createDocument).not.toHaveBeenCalled();
    expect(pathExists).not.toHaveBeenCalled();
  });

  it('does not overwrite existing output artifact', async () => {
    const createDocument = vi.fn();
    const pathExists = vi.fn().mockResolvedValue(true);
    const result = await executeCloseoutReopenCreateOutputAction(enabledAction, createDocument, pathExists);

    expect(result.created).toBe(false);
    expect(result.path).toBe('/workspace/project/changes/change-request-quote.md');
    expect(result.reason).toContain('already exists');
    expect(createDocument).not.toHaveBeenCalled();
  });

  it('creates output artifact and returns created path', async () => {
    const createDocument = vi.fn().mockResolvedValue(undefined);
    const pathExists = vi.fn().mockResolvedValue(false);
    const result = await executeCloseoutReopenCreateOutputAction(enabledAction, createDocument, pathExists);

    expect(result.created).toBe(true);
    expect(result.path).toBe('/workspace/project/changes/change-request-quote.md');
    expect(createDocument).toHaveBeenCalledWith('/workspace/project/changes/change-request-quote.md', '# Change Request Quote');
  });
});
