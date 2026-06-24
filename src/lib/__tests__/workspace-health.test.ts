import { describe, it, expect, vi } from 'vitest';
import { checkWorkspaceHealth } from '../workspace-health';
import { FileEntry } from '../tauri-commands';

vi.mock('../tauri-commands', () => ({
  readFileContent: vi.fn(),
  copyEvidenceFiles: vi.fn(),
  backupWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
  pathExists: vi.fn()
}));

const MOCK_WORKSPACE_PATH = '/mock/workspace';

describe('Workspace Health Check', () => {
  it('should return error if scopeflow.yaml is missing', async () => {
    const tree: FileEntry = {
      name: 'workspace',
      path: MOCK_WORKSPACE_PATH,
      is_dir: true,
      children: []
    };
    
    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, tree);
    expect(issues.some(i => i.type === 'error' && i.message.includes('scopeflow.yaml'))).toBe(true);
  });

  it('should return error if clients folder is missing', async () => {
    const tree: FileEntry = {
      name: 'workspace',
      path: MOCK_WORKSPACE_PATH,
      is_dir: true,
      children: [
        { name: 'scopeflow.yaml', path: '/mock/workspace/scopeflow.yaml', is_dir: false }
      ]
    };
    
    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, tree);
    expect(issues.some(i => i.type === 'error' && i.message.includes('clients/'))).toBe(true);
  });

  it('should return info if workspace is perfect', async () => {
    const tree: FileEntry = {
      name: 'workspace',
      path: MOCK_WORKSPACE_PATH,
      is_dir: true,
      children: [
        { name: 'scopeflow.yaml', path: '/mock/workspace/scopeflow.yaml', is_dir: false },
        { 
          name: 'clients', 
          path: '/mock/workspace/clients', 
          is_dir: true,
          children: []
        }
      ]
    };
    
    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, tree);
    expect(issues.some(i => i.type === 'info' && i.message.includes('สมบูรณ์'))).toBe(true);
  });

  it('should detect missing project folders', async () => {
    const tree: FileEntry = {
      name: 'workspace',
      path: MOCK_WORKSPACE_PATH,
      is_dir: true,
      children: [
        { name: 'scopeflow.yaml', path: '/mock/workspace/scopeflow.yaml', is_dir: false },
        { 
          name: 'clients', 
          path: '/mock/workspace/clients', 
          is_dir: true,
          children: [
            {
              name: 'client1',
              path: '/mock/workspace/clients/client1',
              is_dir: true,
              children: [
                { name: '_client.yaml', path: '...', is_dir: false },
                {
                  name: 'projects',
                  path: '/mock/workspace/clients/client1/projects',
                  is_dir: true,
                  children: [
                    {
                      name: 'proj1',
                      path: '/mock/workspace/clients/client1/projects/proj1',
                      is_dir: true,
                      children: [
                        { name: '_project.yaml', path: '...', is_dir: false },
                        { name: 'baseline', path: '...', is_dir: true },
                        // missing approvals, acceptance, exports, attachments, etc
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, tree);
    const warning = issues.find(i => i.type === 'warning' && i.message.includes('ขาดโฟลเดอร์'));
    expect(warning).toBeDefined();
    expect(warning?.fixAction).toBe('create_project_folders');
  });
});
