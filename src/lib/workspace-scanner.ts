import { FileEntry } from './tauri-commands';
import { ProjectDocument } from './document-scanner';
import { HealthIssue } from './workspace-health';

export interface ProjectPathInfo {
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  path: string;
  node?: FileEntry;
}

export interface ClientPathInfo {
  clientId: string;
  clientName: string;
  path: string;
  node: FileEntry;
  projects: ProjectPathInfo[];
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

function isMetadataOrSystemNode(node: FileEntry) {
  if (!node.is_dir) return true;
  return ['.scopeflow', 'exports', 'attachments'].includes(node.name);
}

export function getClientsRoot(tree: FileEntry | null): FileEntry | null {
  if (!tree) return null;
  if (tree.name === 'clients' || normalizePath(tree.path).endsWith('/clients')) return tree;
  return tree.children?.find(c => c.is_dir && (c.name === 'clients' || normalizePath(c.path).endsWith('/clients'))) || tree;
}

export function getProjectNodesForClient(clientNode: FileEntry): FileEntry[] {
  const projectsFolder = clientNode.children?.find(
    c => c.is_dir && (c.name === 'projects' || normalizePath(c.path).endsWith('/projects'))
  );

  if (projectsFolder) {
    return (projectsFolder.children || []).filter(child => child.is_dir);
  }

  return (clientNode.children || []).filter(child => {
    if (!child.is_dir) return false;
    if (['projects', 'attachments', 'exports'].includes(child.name)) return false;
    return !!child.children?.some(grandChild => grandChild.is_dir && ['baseline', 'change-requests', 'support-requests', 'approvals', 'acceptance', 'exports', 'attachments', 'current-system'].includes(grandChild.name));
  });
}

export function getWorkspaceClients(tree: FileEntry | null): ClientPathInfo[] {
  const clientsRoot = getClientsRoot(tree);
  if (!clientsRoot?.children) return [];

  return clientsRoot.children
    .filter(clientNode => clientNode.is_dir && !isMetadataOrSystemNode(clientNode))
    .map(clientNode => {
      const clientId = normalizePath(clientNode.path).split('/').pop() || clientNode.name;
      const projects = getProjectNodesForClient(clientNode).map(projectNode => {
        const projectId = normalizePath(projectNode.path).split('/').pop() || projectNode.name;
        return {
          clientId,
          clientName: clientNode.name,
          projectId,
          projectName: projectNode.name,
          path: projectNode.path,
          node: projectNode,
        };
      });

      return {
        clientId,
        clientName: clientNode.name,
        path: clientNode.path,
        node: clientNode,
        projects,
      };
    });
}

export function findWorkspaceClient(tree: FileEntry | null, clientId: string): ClientPathInfo | undefined {
  return getWorkspaceClients(tree).find(client => client.clientId === clientId || client.path.endsWith(clientId));
}

export function findWorkspaceProject(tree: FileEntry | null, projectPath: string): ProjectPathInfo | undefined {
  return getWorkspaceClients(tree).flatMap(client => client.projects).find(project => project.path === projectPath);
}

export function getProjectPaths(tree: FileEntry | null): ProjectPathInfo[] {
  return getWorkspaceClients(tree).flatMap(client => client.projects);
}

export function computeWorkspaceStats(
  clientsCount: number,
  projectsCount: number,
  documents: ProjectDocument[]
) {
  const documentsCount = documents.length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const lockedCount = documents.filter(d => d.locked).length;

  return {
    clientsCount,
    projectsCount,
    documentsCount,
    approvedCount,
    lockedCount
  };
}

export function determineCompanyProfileStatus(
  profileExists: boolean,
  parseError: boolean
): 'configured' | 'missing' | 'malformed' {
  if (!profileExists) return 'missing';
  if (parseError) return 'malformed';
  return 'configured';
}

export function determinePresetsStatus(
  presetsExist: boolean,
  parseError: boolean
): 'configured' | 'missing' | 'malformed' {
  if (!presetsExist) return 'missing';
  if (parseError) return 'malformed';
  return 'configured';
}

export function determineHealthStatusSummary(
  issues: HealthIssue[]
): 'OK' | 'Warning' | 'Error' {
  const hasError = issues.some(i => i.type === 'error');
  const hasWarning = issues.some(i => i.type === 'warning');
  if (hasError) return 'Error';
  if (hasWarning) return 'Warning';
  return 'OK';
}
