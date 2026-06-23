import { describe, it, expect, vi } from 'vitest';
import { generateDemoWorkspace } from '../demo-generator';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined)
}));

describe('Demo Generator', () => {
  it('should invoke tauri commands to create workspace, client, projects, and documents', async () => {
    await generateDemoWorkspace('/mock/demo', 'Demo Workspace');
    
    // create_workspace
    expect(invoke).toHaveBeenCalledWith('create_workspace', expect.objectContaining({
      path: '/mock/demo',
      name: 'Demo Workspace'
    }));

    // create_client
    expect(invoke).toHaveBeenCalledWith('create_client', expect.objectContaining({
      clientId: 'demo-client'
    }));

    // create_project x 2
    expect(invoke).toHaveBeenCalledWith('create_project', expect.objectContaining({
      projectId: 'website-revamp'
    }));
    expect(invoke).toHaveBeenCalledWith('create_project', expect.objectContaining({
      projectId: 'system-maintenance'
    }));

    // create_document multiple times
    expect(invoke).toHaveBeenCalledWith('create_document', expect.objectContaining({
      path: expect.stringContaining('scope-v1.0.md')
    }));
    
    // write_file_content for evidence/export
    expect(invoke).toHaveBeenCalledWith('write_file_content', expect.objectContaining({
      path: expect.stringContaining('email-confirmation.txt')
    }));
  });
});
