import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { generateCompletedDemoFlow } from '../demo-flow-generator';
import { generateDemoWorkspace } from '../demo-generator';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const mockedInvoke = vi.mocked(invoke);

describe('demo generators', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-26T08:30:45.000Z'));
    mockedInvoke.mockClear();
    mockedInvoke.mockResolvedValue(undefined);
  });

  it('standard demo creates unique ids and returns real artifact paths', async () => {
    const result = await generateDemoWorkspace('/workspace', 'ScopeFlow Demo');

    expect(result.clientId).toBe('demo-client-20260626083045');
    expect(result.projectIds).toEqual(['website-revamp-20260626083045', 'system-maintenance-20260626083045']);
    expect(result.primaryProjectPath).toBe('/workspace/clients/demo-client-20260626083045/projects/website-revamp-20260626083045');
    expect(result.artifactPaths.brief).toBe(`${result.primaryProjectPath}/baseline/brief-v1.0.md`);
    expect(result.artifactPaths.scopeApproval).toBe(`${result.primaryProjectPath}/approvals/APR-001-scope-v1.0-approved.md`);
  });

  it('standard demo is brief-first and writes a brief before scope artifacts', async () => {
    await generateDemoWorkspace('/workspace', 'ScopeFlow Demo');

    const createDocumentCalls = mockedInvoke.mock.calls.filter(([command]) => command === 'create_document');
    const firstDocumentPayload = createDocumentCalls[0][1] as { path: string; content: string };

    expect(firstDocumentPayload.path).toContain('/baseline/brief-v1.0.md');
    expect(firstDocumentPayload.content).toContain('type: brief');
    expect(firstDocumentPayload.content).toContain('Brief ปรับปรุงเว็บไซต์องค์กร');
  });

  it('standard demo writes maintenance current-system reference files without requiring YAML frontmatter', async () => {
    await generateDemoWorkspace('/workspace', 'ScopeFlow Demo');

    const maintenanceProjectCall = mockedInvoke.mock.calls.find(([command, payload]) => {
      const args = payload as { projectId?: string };
      return command === 'create_project' && args.projectId === 'system-maintenance-20260626083045';
    });

    expect(maintenanceProjectCall).toBeDefined();
    expect(maintenanceProjectCall?.[1]).toMatchObject({
      currentSystemFiles: [['architecture.md', '# Current ERP Architecture\n- Server: Ubuntu\n- DB: PostgreSQL']],
    });
  });

  it('complete demo returns explicit paths for every tutorial target', async () => {
    vi.setSystemTime(new Date('2026-06-26T09:00:00.000Z'));
    vi.spyOn(Date, 'now').mockReturnValue(98765432);

    const result = await generateCompletedDemoFlow('/workspace');

    expect(result.projectPath).toBe('/workspace/clients/demo-flow-client-98765432/projects/complete-scope-flow-98765432');
    expect(result.artifactPaths).toMatchObject({
      brief: `${result.projectPath}/baseline/brief-v1.0.md`,
      scope: `${result.projectPath}/baseline/scope-v1.0.md`,
      quotation: `${result.projectPath}/baseline/quotation-v1.0.md`,
      invoice: `${result.projectPath}/baseline/invoice-v1.0.md`,
      acceptance: `${result.projectPath}/acceptance/acceptance-v1.0.md`,
      scopeApproval: `${result.projectPath}/approvals/APR-SCOPE-98765432.md`,
      export: `${result.projectPath}/exports/scopeflow-complete-demo-98765432.html`,
    });
  });

  it('complete demo creates approval evidence for all approved artifacts', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345678);

    await generateCompletedDemoFlow('/workspace');

    const writeEvidenceCalls = mockedInvoke.mock.calls.filter(([command, payload]) => {
      const args = payload as { path?: string };
      return command === 'write_file_content' && args.path?.includes('/attachments/APR-');
    });

    expect(writeEvidenceCalls).toHaveLength(4);
    expect(writeEvidenceCalls.map(([, payload]) => (payload as { path: string }).path)).toEqual([
      '/workspace/clients/demo-flow-client-12345678/projects/complete-scope-flow-12345678/attachments/APR-BRIEF-12345678.txt',
      '/workspace/clients/demo-flow-client-12345678/projects/complete-scope-flow-12345678/attachments/APR-SCOPE-12345678.txt',
      '/workspace/clients/demo-flow-client-12345678/projects/complete-scope-flow-12345678/attachments/APR-QUOTE-12345678.txt',
      '/workspace/clients/demo-flow-client-12345678/projects/complete-scope-flow-12345678/attachments/APR-ACCEPT-12345678.txt',
    ]);
  });
});
