import { beforeEach, describe, it, expect, vi } from 'vitest';
import { checkWorkspaceHealth } from '../workspace-health';
import { scanProjectDocuments } from '../document-scanner';
import { FileEntry } from '../tauri-commands';

vi.mock('../tauri-commands', () => ({
  createDocument: vi.fn(),
  readFileContent: vi.fn(),
  writeFileContent: vi.fn(),
  copyEvidenceFiles: vi.fn(),
  backupWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
  pathExists: vi.fn()
}));

vi.mock('../document-scanner', () => ({
  scanProjectDocuments: vi.fn(),
}));

const mockedScanProjectDocuments = vi.mocked(scanProjectDocuments);
const MOCK_WORKSPACE_PATH = '/mock/workspace';

function createHealthyProjectTree(projectPath = '/mock/workspace/clients/client1/projects/proj1'): FileEntry {
  const clientPath = projectPath.split('/projects/')[0];
  const projectName = projectPath.split('/').pop() || 'proj1';
  return {
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
            name: clientPath.split('/').pop() || 'client1',
            path: clientPath,
            is_dir: true,
            children: [
              { name: '_client.yaml', path: `${clientPath}/_client.yaml`, is_dir: false },
              {
                name: 'projects',
                path: `${clientPath}/projects`,
                is_dir: true,
                children: [
                  {
                    name: projectName,
                    path: projectPath,
                    is_dir: true,
                    children: [
                      { name: '_project.yaml', path: `${projectPath}/_project.yaml`, is_dir: false },
                      { name: 'baseline', path: `${projectPath}/baseline`, is_dir: true },
                      { name: 'change-requests', path: `${projectPath}/change-requests`, is_dir: true },
                      { name: 'support-requests', path: `${projectPath}/support-requests`, is_dir: true },
                      { name: 'approvals', path: `${projectPath}/approvals`, is_dir: true },
                      { name: 'acceptance', path: `${projectPath}/acceptance`, is_dir: true },
                      { name: 'exports', path: `${projectPath}/exports`, is_dir: true },
                      { name: 'attachments', path: `${projectPath}/attachments`, is_dir: true },
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
}

describe('Workspace Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedScanProjectDocuments.mockResolvedValue([]);
  });

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

  it('should match approval records by approval_number even when the filename is generic', async () => {
    mockedScanProjectDocuments.mockResolvedValue([
      {
        file_path: '/mock/workspace/clients/client1/projects/proj1/baseline/brief-v1.0.md',
        file_name: 'brief-v1.0.md',
        folder: 'baseline',
        type: 'brief',
        title: 'Brief',
        status: 'approved',
        version: '1.0',
        locked: true,
        approval_ref: 'APR-BRIEF-001',
        excerpt: '',
        parse_status: 'success',
      },
      {
        file_path: '/mock/workspace/clients/client1/projects/proj1/approvals/approval-record.md',
        file_name: 'approval-record.md',
        folder: 'approvals',
        type: 'approval-record',
        title: 'Approval',
        status: 'recorded',
        version: '1.0',
        locked: false,
        approval_number: 'APR-BRIEF-001',
        approved_document: 'brief-v1.0.md',
        excerpt: '',
        parse_status: 'success',
      },
    ]);

    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, createHealthyProjectTree());

    expect(issues).toEqual([{ type: 'info', message: 'Workspace สมบูรณ์ ไม่มีข้อผิดพลาด' }]);
  });

  it('should dedupe repeated document scan results before reporting issues', async () => {
    const invoiceDoc = {
      file_path: '/mock/workspace/clients/client1/projects/proj1/baseline/invoice-v1.0.md',
      file_name: 'invoice-v1.0.md',
      folder: 'baseline',
      type: 'invoice',
      title: 'Invoice',
      status: 'paid',
      version: '1.0',
      locked: true,
      excerpt: '',
      parse_status: 'success' as const,
    };
    mockedScanProjectDocuments.mockResolvedValue([invoiceDoc, invoiceDoc]);

    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, createHealthyProjectTree());
    const invoiceWarnings = issues.filter(issue => issue.message.includes('invoice-v1.0.md'));

    expect(invoiceWarnings).toHaveLength(1);
  });

  it('should offer a safe demo audit repair action for legacy demo records', async () => {
    const projectPath = '/mock/workspace/clients/demo-flow-client-12345678/projects/complete-scope-flow-12345678';
    mockedScanProjectDocuments.mockResolvedValue([
      {
        file_path: `${projectPath}/baseline/invoice-v1.0.md`,
        file_name: 'invoice-v1.0.md',
        folder: 'baseline',
        type: 'invoice',
        title: 'Invoice',
        status: 'paid',
        version: '1.0',
        locked: true,
        document_number: 'INV-12345678',
        excerpt: '',
        parse_status: 'success',
      },
    ]);

    const issues = await checkWorkspaceHealth(MOCK_WORKSPACE_PATH, createHealthyProjectTree(projectPath));
    const invoiceWarning = issues.find(issue => issue.message.includes('invoice-v1.0.md'));

    expect(invoiceWarning?.fixAction).toBe('repair_demo_audit_records');
  });
});
