import { createDocument, FileEntry, pathExists, readFileContent, writeFileContent } from './tauri-commands';
import { scanProjectDocuments, type ProjectDocument } from './document-scanner';

export interface HealthIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  fixAction?: 'create_project_folders' | 'create_scopeflow_yaml' | 'repair_demo_audit_records';
  payload?: any;
}

export interface DemoAuditRepairResult {
  repaired: number;
  skipped: number;
  messages: string[];
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

function isReferenceOnlyDocument(folder: string) {
  return folder === 'current-system' || folder === 'attachments' || folder === 'exports';
}

function normalizeText(value?: string) {
  return String(value || '').trim();
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

function dedupeDocumentsByPath(docs: ProjectDocument[]) {
  const byPath = new Map<string, ProjectDocument>();
  for (const doc of docs) {
    byPath.set(normalizePath(doc.file_path), doc);
  }
  return Array.from(byPath.values());
}

function approvalRecordMatches(approval: ProjectDocument, approvalRef: string) {
  const ref = normalizeText(approvalRef);
  if (!ref) return false;
  return (
    approval.file_name.includes(ref) ||
    normalizeText(approval.document_number) === ref ||
    normalizeText(approval.approval_number) === ref
  );
}

function isDemoProjectPath(projectPath: string) {
  const normalized = normalizePath(projectPath);
  return (
    normalized.includes('/clients/demo-client-') ||
    normalized.includes('/clients/demo-flow-client-') ||
    normalized.includes('/projects/website-revamp-') ||
    normalized.includes('/projects/complete-scope-flow-')
  );
}

function requiresAuditRecord(doc: ProjectDocument) {
  if (doc.type === 'export' || doc.type === 'approval-record') return false;
  if (isReferenceOnlyDocument(doc.folder)) return false;
  return doc.status === 'approved' || doc.locked;
}

function inferApprovalPrefix(doc: ProjectDocument) {
  const type = normalizeText(doc.type).toLowerCase();
  if (type === 'brief') return 'APR-BRIEF';
  if (type === 'scope') return 'APR-SCOPE';
  if (type === 'quotation') return 'APR-QUOTE';
  if (type === 'invoice') return 'APR-INVOICE';
  if (type === 'acceptance') return 'APR-ACCEPT';
  return `APR-${type.toUpperCase() || 'DOC'}`;
}

function inferDemoApprovalRef(doc: ProjectDocument) {
  if (doc.approval_ref) return normalizeText(doc.approval_ref);
  const number = normalizeText(doc.document_number);
  const suffix = number.includes('-') ? number.split('-').pop() : number;
  return `${inferApprovalPrefix(doc)}-${suffix || Date.now()}`;
}

function insertApprovalRef(content: string, approvalRef: string) {
  if (/^approval_ref:/m.test(content)) return content;
  if (/^document_number:/m.test(content)) {
    return content.replace(/^(document_number:\s*.*)$/m, `$1\napproval_ref: ${approvalRef}`);
  }
  if (/^updated:/m.test(content)) {
    return content.replace(/^(updated:\s*.*)$/m, `$1\napproval_ref: ${approvalRef}`);
  }
  return content.replace(/^---\n/, `---\napproval_ref: ${approvalRef}\n`);
}

function approvalRecordMarkdown(doc: ProjectDocument, approvalRef: string) {
  const evidenceFile = `${approvalRef}.txt`;
  const title = doc.status === 'approved'
    ? `บันทึกการอนุมัติ ${doc.file_name}`
    : `บันทึก Audit ${doc.file_name}`;

  return `---
type: approval-record
title: "${title}"
approval_number: "${approvalRef}"
status: recorded
approved_document: "${doc.file_name}"
document_type: "${doc.type}"
approved_by: "Demo Repair"
approval_method: "demo-audit-repair"
evidence_files: ["${evidenceFile}"]
created: "${new Date().toISOString().split('T')[0]}"
---
# ${title}

ระบบสร้างบันทึกนี้เพื่อซ่อม demo workspace รุ่นเก่าที่เอกสารถูกล็อกหรืออ้างรหัสอนุมัติไว้แล้ว แต่ยังไม่มี approval/audit record ที่ Health Check ต้องใช้ตรวจสอบ.
`;
}

async function createMissingAuditRecord(projectPath: string, doc: ProjectDocument, approvalRef: string) {
  const safeDocBase = doc.file_name.replace(/\.md$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-');
  const recordPath = `${projectPath}/approvals/${approvalRef}-${safeDocBase}-approved.md`;
  if (!(await pathExists(recordPath))) {
    await createDocument(recordPath, approvalRecordMarkdown(doc, approvalRef));
  }

  const evidencePath = `${projectPath}/attachments/${approvalRef}.txt`;
  if (!(await pathExists(evidencePath))) {
    await writeFileContent(
      evidencePath,
      `Demo audit repair evidence\nDocument: ${doc.file_name}\nApproval ref: ${approvalRef}\nGenerated: ${new Date().toISOString()}\n`
    );
  }
}

async function repairDemoDocumentAudit(projectPath: string, doc: ProjectDocument, approvals: ProjectDocument[]): Promise<boolean> {
  if (!isDemoProjectPath(projectPath)) return false;
  if (!requiresAuditRecord(doc)) return false;

  const approvalRef = inferDemoApprovalRef(doc);
  const hasApprovalRecord = approvals.some(a => approvalRecordMatches(a, approvalRef));
  let repaired = false;

  if (!doc.approval_ref) {
    const content = await readFileContent(doc.file_path);
    await writeFileContent(doc.file_path, insertApprovalRef(content, approvalRef));
    repaired = true;
  }

  if (!hasApprovalRecord) {
    await createMissingAuditRecord(projectPath, doc, approvalRef);
    repaired = true;
  }

  return repaired;
}

export async function repairDemoAuditRecords(_workspacePath: string, tree: FileEntry): Promise<DemoAuditRepairResult> {
  const result: DemoAuditRepairResult = { repaired: 0, skipped: 0, messages: [] };
  const clientsFolder = tree.children?.find(c => c.name === 'clients' && c.is_dir);
  const clients = clientsFolder ? (clientsFolder.children || []) : (tree.children || []);

  for (const client of clients) {
    if (!client.is_dir) continue;
    const projectsFolder = client.children?.find(c => c.name === 'projects' && c.is_dir);
    const projects = projectsFolder ? (projectsFolder.children || []) : (client.children || []);

    for (const project of projects) {
      if (!project.is_dir) continue;
      if (!isDemoProjectPath(project.path)) continue;

      const docs = dedupeDocumentsByPath(await scanProjectDocuments(project.path, tree));
      const approvals = docs.filter(d => d.type === 'approval-record');

      for (const doc of docs) {
        if (doc.type === 'approval-record' || isReferenceOnlyDocument(doc.folder)) continue;
        try {
          const repaired = await repairDemoDocumentAudit(project.path, doc, approvals);
          if (repaired) {
            result.repaired += 1;
            result.messages.push(`ซ่อม audit record สำหรับ ${doc.file_name}`);
          }
        } catch (error) {
          result.skipped += 1;
          result.messages.push(`ข้าม ${doc.file_name}: ${error}`);
        }
      }
    }
  }

  return result;
}

export async function checkWorkspaceHealth(_workspacePath: string, tree: FileEntry): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];
  const issueKeys = new Set<string>();
  const pushIssue = (issue: HealthIssue) => {
    const key = `${issue.type}:${issue.message}`;
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    issues.push(issue);
  };

  const hasConfig = tree.children?.some(c => c.name === 'scopeflow.yaml') || (await pathExists(`${_workspacePath}/scopeflow.yaml`));
  if (!hasConfig) {
    pushIssue({
      type: 'error',
      message: 'ไม่พบไฟล์ scopeflow.yaml (ไม่ใช่ ScopeFlow Workspace)',
      fixAction: 'create_scopeflow_yaml',
    });
    return issues;
  }

  const clientsFolder = tree.children?.find(c => c.name === 'clients' && c.is_dir);
  const hasClientsFolder = clientsFolder || (await pathExists(`${_workspacePath}/clients`));
  if (!hasClientsFolder) {
    pushIssue({ type: 'error', message: 'ไม่พบโฟลเดอร์ clients/ (กรุณาสร้างลูกค้าใหม่)' });
    return issues;
  }

  const clients = clientsFolder ? (clientsFolder.children || []) : (tree.children || []);
  for (const client of clients) {
    if (!client.is_dir) continue;

    const clientPath = client.path;
    const hasClientYaml = await fileExistsFromTreeOrDisk(clientPath, client.children, '_client.yaml', false);
    if (!hasClientYaml) {
       pushIssue({ type: 'warning', message: `ลูกค้า "${client.name}" ไม่มีไฟล์ _client.yaml` });
    }

    const projectsFolder = client.children?.find(c => c.name === 'projects' && c.is_dir);
    const projects = projectsFolder ? (projectsFolder.children || []) : (client.children || []);

    for (const project of projects) {
      if (!project.is_dir) continue;

      const projectPath = project.path;
      const isDemoProject = isDemoProjectPath(projectPath);
      const demoRepairPayload = isDemoProject ? { projectPath } : undefined;
      const hasProjectYaml = await fileExistsFromTreeOrDisk(projectPath, project.children, '_project.yaml', false);
      if (!hasProjectYaml) {
        pushIssue({ type: 'warning', message: `โครงการ "${project.name}" ไม่มีไฟล์ _project.yaml` });
      }

      const missingFolders: string[] = [];
      for (const folder of REQUIRED_PROJECT_FOLDERS) {
        const exists = await fileExistsFromTreeOrDisk(projectPath, project.children, folder, true);
        if (!exists) missingFolders.push(folder);
      }

      if (missingFolders.length > 0) {
        pushIssue({
          type: 'warning',
          message: `โครงการ "${project.name}" ขาดโฟลเดอร์: ${missingFolders.join(', ')}`,
          fixAction: 'create_project_folders',
          payload: { projectPath, missingFolders }
        });
      }

      const docs = dedupeDocumentsByPath(await scanProjectDocuments(project.path, tree));
      const approvals = docs.filter(d => d.type === 'approval-record');

      for (const doc of docs) {
        if (doc.parse_status === 'warning' && doc.type !== 'export' && !isReferenceOnlyDocument(doc.folder)) {
          pushIssue({ type: 'warning', message: `เอกสาร "${doc.file_name}" มี YAML Frontmatter ไม่สมบูรณ์` });
        }

        if (isReferenceOnlyDocument(doc.folder)) {
          continue;
        }

        const needsDemoRepair = isDemoProject && requiresAuditRecord(doc);

        if (doc.locked && !doc.approval_ref && doc.type !== 'export' && doc.type !== 'approval-record') {
          pushIssue({
            type: 'warning',
            message: `เอกสาร "${doc.file_name}" ถูกล็อกแต่ไม่พบรหัสอนุมัติ (approval_ref)`,
            fixAction: needsDemoRepair ? 'repair_demo_audit_records' : undefined,
            payload: demoRepairPayload,
          });
        }

        if (doc.approval_ref && requiresAuditRecord(doc)) {
          const record = approvals.find(a => approvalRecordMatches(a, doc.approval_ref!));
          if (!record) {
            pushIssue({
              type: doc.status === 'approved' ? 'error' : 'warning',
              message: `เอกสาร "${doc.file_name}" อ้างถึงการอนุมัติ "${doc.approval_ref}" แต่ไม่พบบันทึก`,
              fixAction: needsDemoRepair ? 'repair_demo_audit_records' : undefined,
              payload: demoRepairPayload,
            });
          }
        }

        if (doc.status === 'approved' && doc.type !== 'export' && doc.type !== 'approval-record' && !doc.approval_ref) {
          pushIssue({
            type: 'warning',
            message: `เอกสาร "${doc.file_name}" สถานะ approved แต่ไม่พบรหัสอนุมัติ`,
            fixAction: needsDemoRepair ? 'repair_demo_audit_records' : undefined,
            payload: demoRepairPayload,
          });
        }

        if (doc.type === 'approval-record' && doc.approved_document) {
          const approvedDocExists = docs.find(d => d.file_name === doc.approved_document);
          if (!approvedDocExists) {
             pushIssue({ type: 'error', message: `บันทึกอนุมัติ "${doc.file_name}" อ้างถึงเอกสาร "${doc.approved_document}" ที่ไม่มีอยู่จริง` });
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
                pushIssue({ type: 'error', message: `เอกสาร "${doc.file_name}" แนบไฟล์หลักฐาน "${evidence}" ที่ไม่พบในโฟลเดอร์ attachments/` });
             }
           }
        }
      }
    }
  }

  if (issues.length === 0) {
    pushIssue({ type: 'info', message: 'Workspace สมบูรณ์ ไม่มีข้อผิดพลาด' });
  }

  return issues;
}
