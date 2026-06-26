import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { generateDemoWorkspace } from '../demo-generator';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined)
}));

const mockedInvoke = vi.mocked(invoke);

describe('Demo Generator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-26T08:30:45.000Z'));
    mockedInvoke.mockClear();
    mockedInvoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('invokes tauri commands to create workspace, client, projects, and documents', async () => {
    const result = await generateDemoWorkspace('/mock/demo', 'Demo Workspace');

    expect(result.clientId).toBe('demo-client-20260626083045');
    expect(result.projectIds).toEqual(['website-revamp-20260626083045', 'system-maintenance-20260626083045']);
    expect(result.primaryProjectPath).toBe('/mock/demo/clients/demo-client-20260626083045/projects/website-revamp-20260626083045');
    expect(result.artifactPaths.brief).toBe(`${result.primaryProjectPath}/baseline/brief-v1.0.md`);

    expect(mockedInvoke).toHaveBeenCalledWith('create_workspace', expect.objectContaining({
      path: '/mock/demo',
      name: 'Demo Workspace'
    }));

    expect(mockedInvoke).toHaveBeenCalledWith('create_client', expect.objectContaining({
      clientId: 'demo-client-20260626083045'
    }));

    expect(mockedInvoke).toHaveBeenCalledWith('create_project', expect.objectContaining({
      projectId: 'website-revamp-20260626083045'
    }));
    expect(mockedInvoke).toHaveBeenCalledWith('create_project', expect.objectContaining({
      projectId: 'system-maintenance-20260626083045'
    }));

    expect(mockedInvoke).toHaveBeenCalledWith('create_document', expect.objectContaining({
      path: expect.stringContaining('brief-v1.0.md'),
      content: expect.stringContaining('type: brief')
    }));
    expect(mockedInvoke).toHaveBeenCalledWith('create_document', expect.objectContaining({
      path: expect.stringContaining('scope-v1.0.md')
    }));

    expect(mockedInvoke).toHaveBeenCalledWith('write_file_content', expect.objectContaining({
      path: expect.stringContaining('email-confirmation.txt')
    }));
  });
});
