import { describe, expect, it } from 'vitest';
import {
  findWorkspaceClient,
  findWorkspaceProject,
  getClientsRoot,
  getProjectNodesForClient,
  getProjectPaths,
  getWorkspaceClients,
} from '../workspace-scanner';
import type { FileEntry } from '../tauri-commands';

function dir(name: string, path: string, children: FileEntry[] = []): FileEntry {
  return { name, path, is_dir: true, children };
}

function file(name: string, path: string): FileEntry {
  return { name, path, is_dir: false };
}

describe('workspace-scanner canonical selectors', () => {
  it('treats direct child directories under a client as projects for the Rust tree shape', () => {
    const tree = dir('workspace', '/workspace', [
      dir('บริษัท เดโม จำกัด', '/workspace/clients/demo-client', [
        dir('ปรับปรุงเว็บไซต์องค์กร', '/workspace/clients/demo-client/projects/website-revamp', [
          file('scope-v1.0.md', '/workspace/clients/demo-client/projects/website-revamp/baseline/scope-v1.0.md'),
        ]),
        dir('บำรุงรักษาระบบ ERP', '/workspace/clients/demo-client/projects/system-maintenance', [
          file('SUP-001.md', '/workspace/clients/demo-client/projects/system-maintenance/support-requests/SUP-001.md'),
        ]),
      ]),
    ]);

    const clients = getWorkspaceClients(tree);

    expect(clients).toHaveLength(1);
    expect(clients[0].clientId).toBe('demo-client');
    expect(clients[0].projects.map(p => p.projectId)).toEqual(['website-revamp', 'system-maintenance']);
    expect(getProjectPaths(tree)).toHaveLength(2);
  });

  it('supports the explicit clients/projects folder shape', () => {
    const tree = dir('workspace', '/workspace', [
      dir('clients', '/workspace/clients', [
        dir('Ask', '/workspace/clients/ask', [
          dir('projects', '/workspace/clients/ask/projects', [
            dir('Aaa', '/workspace/clients/ask/projects/aaa', []),
          ]),
        ]),
      ]),
    ]);

    const clientsRoot = getClientsRoot(tree);
    const client = getWorkspaceClients(tree)[0];

    expect(clientsRoot?.path).toBe('/workspace/clients');
    expect(client.clientId).toBe('ask');
    expect(client.projects[0].projectId).toBe('aaa');
  });

  it('excludes metadata and utility folders from clients and projects', () => {
    const tree = dir('workspace', '/workspace', [
      dir('.scopeflow', '/workspace/.scopeflow', []),
      dir('exports', '/workspace/exports', []),
      dir('client-a', '/workspace/clients/client-a', [
        dir('attachments', '/workspace/clients/client-a/attachments', []),
        dir('exports', '/workspace/clients/client-a/exports', []),
        dir('real-project', '/workspace/clients/client-a/projects/real-project', []),
      ]),
    ]);

    const clients = getWorkspaceClients(tree);
    const projects = getProjectNodesForClient(clients[0].node);

    expect(clients.map(c => c.clientId)).toEqual(['client-a']);
    expect(projects.map(p => p.name)).toEqual(['real-project']);
  });

  it('finds clients and projects consistently from the same source of truth', () => {
    const projectPath = '/workspace/clients/client-a/projects/project-a';
    const tree = dir('workspace', '/workspace', [
      dir('client-a', '/workspace/clients/client-a', [
        dir('project-a', projectPath, []),
      ]),
    ]);

    expect(findWorkspaceClient(tree, 'client-a')?.clientName).toBe('client-a');
    expect(findWorkspaceProject(tree, projectPath)?.projectName).toBe('project-a');
    expect(findWorkspaceProject(tree, '/workspace/missing')).toBeUndefined();
  });
});
