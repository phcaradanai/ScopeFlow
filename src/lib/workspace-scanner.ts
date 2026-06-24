import { FileEntry } from './tauri-commands';
import { ProjectDocument } from './document-scanner';
import { HealthIssue } from './workspace-health';

export interface ProjectPathInfo {
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  path: string;
}

export function getProjectPaths(tree: FileEntry | null): ProjectPathInfo[] {
  if (!tree || !tree.children) return [];
  const projects: ProjectPathInfo[] = [];
  
  // Find clients folder or scan direct children if tree represents the clients folder itself
  let clients: FileEntry[];
  if (tree.name === 'clients' || tree.path.replace(/\\/g, '/').endsWith('/clients')) {
    clients = tree.children || [];
  } else {
    const clientsFolder = tree.children.find(
      c => c.name === 'clients' || c.path.replace(/\\/g, '/').endsWith('/clients')
    );
    clients = clientsFolder ? (clientsFolder.children || []) : tree.children;
  }

  clients.forEach(clientNode => {
    if (!clientNode.is_dir) return;
    const normalizedClientPath = clientNode.path.replace(/\\/g, '/');
    const clientId = normalizedClientPath.split('/').pop() || clientNode.name;
    const clientName = clientNode.name;
    
    const projectsFolder = clientNode.children?.find(
      c => c.name === 'projects' || c.path.replace(/\\/g, '/').endsWith('/projects')
    );
    if (projectsFolder && projectsFolder.children) {
      projectsFolder.children.forEach(projectNode => {
        if (!projectNode.is_dir) return;
        const projectId = projectNode.path.replace(/\\/g, '/').split('/').pop() || projectNode.name;
        projects.push({
          clientId,
          clientName,
          projectId,
          projectName: projectNode.name,
          path: projectNode.path
        });
      });
    }
  });
  return projects;
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
