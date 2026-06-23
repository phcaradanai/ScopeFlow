import { FileEntry } from './tauri-commands';
import { scanProjectDocuments } from './document-scanner';

export interface HealthIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  fixAction?: 'create_project_folders';
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

export async function checkWorkspaceHealth(_workspacePath: string, tree: FileEntry): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];

  // 1. Check scopeflow.yaml
  const hasConfig = tree.children?.find(c => c.name === 'scopeflow.yaml');
  if (!hasConfig) {
    issues.push({ type: 'error', message: 'ไม่พบไฟล์ scopeflow.yaml (ไม่ใช่ ScopeFlow Workspace)' });
    return issues; // Critical error, abort
  }

  // 2. Check clients folder
  const clientsFolder = tree.children?.find(c => c.name === 'clients' && c.is_dir);
  if (!clientsFolder) {
    issues.push({ type: 'error', message: 'ไม่พบโฟลเดอร์ clients/ (กรุณาสร้างลูกค้าใหม่)' });
    return issues; 
  }

  // 3. Iterate clients
  const clients = clientsFolder.children || [];
  for (const client of clients) {
    if (!client.is_dir) continue;

    const hasClientYaml = client.children?.find(c => c.name === '_client.yaml');
    if (!hasClientYaml) {
       issues.push({ type: 'warning', message: `ลูกค้า "${client.name}" ไม่มีไฟล์ _client.yaml` });
    }

    const projectsFolder = client.children?.find(c => c.name === 'projects' && c.is_dir);
    if (!projectsFolder) continue;

    // Iterate projects
    for (const project of projectsFolder.children || []) {
      if (!project.is_dir) continue;

      const hasProjectYaml = project.children?.find(c => c.name === '_project.yaml');
      if (!hasProjectYaml) {
        issues.push({ type: 'warning', message: `โครงการ "${project.name}" ไม่มีไฟล์ _project.yaml` });
      }

      // Check required folders
      const missingFolders = REQUIRED_PROJECT_FOLDERS.filter(folder => 
        !project.children?.find(c => c.name === folder && c.is_dir)
      );

      if (missingFolders.length > 0) {
        issues.push({
          type: 'warning',
          message: `โครงการ "${project.name}" ขาดโฟลเดอร์: ${missingFolders.join(', ')}`,
          fixAction: 'create_project_folders',
          payload: { projectPath: project.path, missingFolders }
        });
      }

      // Read documents
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

        // Check if approval record points to missing document
        if (doc.type === 'approval-record' && doc.approved_document) {
          const approvedDocExists = docs.find(d => d.file_name === doc.approved_document);
          if (!approvedDocExists) {
             issues.push({ type: 'error', message: `บันทึกอนุมัติ "${doc.file_name}" อ้างถึงเอกสาร "${doc.approved_document}" ที่ไม่มีอยู่จริง` });
          }
        }

        // Check if evidence files exist
        if (doc.evidence_files && doc.evidence_files.length > 0) {
           const attachmentsFolder = project.children?.find(c => c.name === 'attachments' && c.is_dir);
           for (const evidence of doc.evidence_files) {
             const exists = attachmentsFolder?.children?.find(c => c.name === evidence);
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
