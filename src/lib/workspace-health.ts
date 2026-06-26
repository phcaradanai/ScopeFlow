import { FileEntry, pathExists } from './tauri-commands';
import { scanProjectDocuments } from './document-scanner';

export interface HealthIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  fixAction?: 'create_project_folders' | 'create_scopeflow_yaml';
  payload?: any;
}

const REQUIRED_PROJECT_FOLDERS = [
  'baseline',
  'change-requests',
  'support-requests',
  'approvals',
  'acceptance',
  'exports',
  'attachments'
];

async function fileExistsFromTreeOrDisk(parentPath: string, children: FileEntry[] | undefined, name: string, isDir?: boolean) {
  const fromTree = children?.find(c => c.name === name && (isDir === undefined || c.is_dir === isDir));
  if (fromTree) return true;
  return pathExists(`${parentPath}/${name}`);
}

export async function checkWorkspaceHealth(_workspacePath: string, tree: FileEntry): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];

  const hasConfig = tree.children?.some(c => c.name === 'scopeflow.yaml') || (await pathExists(`${_workspacePath}/scopeflow.yaml`));
  if (!hasConfig) {
    issues.push({
      type: 'error',
      message: 'ไม่พบไฟล์ scopeflow.yaml (ไม่ใช่ ScopeFlow Workspace)',
      fixAction: 'create_scopeflow_yaml',
    });
    return issues;
  }

  const clientsFolder = tree.children?.find(c => c.name === 'clients' && c.is_dir);
  const hasClientsFolder = clientsFolder || (await pathExists(`${_workspacePath}/clients`));
  if (!hasClientsFolder) {
    issues.push({ type: 'error', message: 'ไม่พบโฟลเดอร์ clients/ (กรุณาสร้างลูกค้าใหม่)' });
    return issues;
  }

  const clients = clientsFolder ? (clientsFolder.children || []) : (tree.children || []);
  for (const client of clients) {
    if (!client.is_dir) continue;

    const clientPath = client.path;
    const hasClientYaml = await fileExistsFromTreeOrDisk(clientPath, client.children, '_client.yaml', false);
    if (!hasClientYaml) {
       issues.push({ type: 'warning', message: `ลูกค้า "${client.name}" ไม่มีไฟล์ _client.yaml` });
    }

    const projectsFolder = client.children?.find(c => c.name === 'projects' && c.is_dir);
    const projects = projectsFolder ? (projectsFolder.children || []) : (client.children || []);

    for (const project of projects) {
      if (!project.is_dir) continue;

      const projectPath = project.path;
      const hasProjectYaml = await fileExistsFromTreeOrDisk(projectPath, project.children, '_project.yaml', false);
      if (!hasProjectYaml) {
        issues.push({ type: 'warning', message: `โครงการ "${project.name}" ไม่มีไฟล์ _project.yaml` });
      }

      const missingFolders: string[] = [];
      for (const folder of REQUIRED_PROJECT_FOLDERS) {
        const exists = await fileExistsFromTreeOrDisk(projectPath, project.children, folder, true);
        if (!exists) missingFolders.push(folder);
      }

      if (missingFolders.length > 0) {
        issues.push({
          type: 'warning',
          message: `โครงการ "${project.name}" ขาดโฟลเดอร์: ${missingFolders.join(', ')}`,
          fixAction: 'create_project_folders',
          payload: { projectPath, missingFolders }
        });
      }

      const docs = await scanProjectDocuments(project.path, tree);
      const approvals = docs.filter(d => d.type === 'approval-record');

      for (const doc of docs) {
        if (doc.parse_status === 'warning' && doc.type !== 'export') {
          issues.push({ type: 'warning', message: `เอกสาร "${doc.file_name}" มี YAML Frontmatter ไม่สมบูรณ์` });
        }

        if (doc.locked && !doc.approval_ref && doc.type !== 'export' && doc.type !== 'approval-record') {
          issues.push({ type: 'warning', message: `เอกสาร "${doc.file_name}" ถูกล็อกแต่ไม่พบรหัสอนุมัติ (approval_ref)` });
        }

        if (doc.status === 'approved' && doc.type !== 'export' && doc.type !== 'approval-record') {
          if (!doc.approval_ref) {
             issues.push({ type: 'warning', message: `เอกสาร "${doc.file_name}" สถานะ approved แต่ไม่พบรหัสอนุมัติ` });
          } else {
             const record = approvals.find(a => a.file_name.includes(doc.approval_ref!) || a.document_number === doc.approval_ref);
             if (!record) {
                issues.push({ type: 'error', message: `เอกสาร "${doc.file_name}" อ้างถึงการอนุมัติ "${doc.approval_ref}" แต่ไม่พบบันทึก` });
             }
          }
        }

        if (doc.type === 'approval-record' && doc.approved_document) {
          const approvedDocExists = docs.find(d => d.file_name === doc.approved_document);
          if (!approvedDocExists) {
             issues.push({ type: 'error', message: `บันทึกอนุมัติ "${doc.file_name}" อ้างถึงเอกสาร "${doc.approved_document}" ที่ไม่มีอยู่จริง` });
          }
        }

        if (doc.evidence_files && doc.evidence_files.length > 0) {
           const attachmentsFolder = project.children?.find(c => c.name === 'attachments' && c.is_dir);
           for (const evidence of doc.evidence_files) {
             let exists = attachmentsFolder?.children?.some(c => c.name === evidence);
             if (!exists) {
                exists = await pathExists(`${project.path}/attachments/${evidence}`);
             }
             if (!exists) {
                issues.push({ type: 'error', message: `เอกสาร "${doc.file_name}" แนบไฟล์หลักฐาน "${evidence}" ที่ไม่พบในโฟลเดอร์ attachments/` });
             }
           }
        }
      }
    }
  }

  if (issues.length === 0) {
    issues.push({ type: 'info', message: 'Workspace สมบูรณ์ ไม่มีข้อผิดพลาด' });
  }

  return issues;
}
