import type { DocumentLifecycleSummary } from '../document-lifecycle/documentLifecycle';
import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutPackFile {
  path: string;
  markdown: string;
}

export interface CloseoutPackInput {
  project_name: string;
  project_path: string;
  lifecycle_summary: DocumentLifecycleSummary;
  files: LifecycleScanFile[];
  closeout_id?: string;
  closed_at?: string;
}

export interface CloseoutPack {
  closeout_id: string;
  can_generate: boolean;
  warnings: string[];
  files: CloseoutPackFile[];
  recommended_next_action: string;
}

function fallbackCloseoutId(): string {
  return `CLOSEOUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function fileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function filesByKind(files: LifecycleScanFile[], matcher: (path: string, markdown: string) => boolean): LifecycleScanFile[] {
  return files.filter(file => matcher(normalize(file.path), file.markdown));
}

function newest(files: LifecycleScanFile[]): LifecycleScanFile | undefined {
  return [...files].sort((a, b) => normalize(b.path).localeCompare(normalize(a.path)))[0];
}

function listFiles(files: LifecycleScanFile[], empty: string): string {
  if (files.length === 0) return `- ${empty}`;
  return files.map(file => `- ${fileName(file.path)} — \`${file.path}\``).join('\n');
}

function statusTable(summary: DocumentLifecycleSummary): string {
  return [
    '| Document | Status | Next Action |',
    '|---|---|---|',
    ...summary.items.map(item => `| ${item.label} | ${item.status} | ${item.recommended_next_action} |`),
  ].join('\n');
}

export function buildProjectCloseoutPack(input: CloseoutPackInput): CloseoutPack {
  const closeoutId = input.closeout_id?.trim() || fallbackCloseoutId();
  const closedAt = input.closed_at?.trim() || new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];

  const briefFiles = filesByKind(input.files, path => path.includes('brief'));
  const scopeFiles = filesByKind(input.files, path => path.includes('scope'));
  const quotationFiles = filesByKind(input.files, path => path.includes('quotation') || path.includes('quote'));
  const changeFiles = filesByKind(input.files, path => path.includes('/changes/') || path.includes('/change-requests/'));
  const acceptanceFiles = filesByKind(input.files, path => path.includes('/acceptance/'));
  const acceptanceFile = newest(acceptanceFiles);

  if (!input.lifecycle_summary.can_close_work) {
    warnings.push('Lifecycle ยังไม่เป็น Can Close Work จึงยังไม่ควรสร้าง closeout pack เป็นหลักฐานปิดงาน');
  }
  if (!acceptanceFile) {
    warnings.push('ไม่พบ Acceptance / Sign-off Artifact สำหรับอ้างอิงการปิดงาน');
  }

  const canGenerate = warnings.length === 0;
  const basePath = `${input.project_path.replace(/[/\\]$/, '')}/closeout`;

  const closeoutSummary = `# Closeout Summary

## Metadata

- Closeout ID: **${closeoutId}**
- Project: **${input.project_name}**
- Closed At: **${closedAt}**
- Can Close Work: **${input.lifecycle_summary.can_close_work ? 'yes' : 'no'}**

## Lifecycle Status

${statusTable(input.lifecycle_summary)}

## Final Next Action

${input.lifecycle_summary.next_action}

## Closeout Decision

${canGenerate ? 'งานรอบนี้สามารถปิดได้ โดยอ้างอิง acceptance/sign-off และ baseline ที่เกี่ยวข้อง' : 'ยังไม่ควรปิดงานจนกว่าจะเคลียร์ warning ใน closeout pack'}
`;

  const deliveryEvidence = `# Delivery Evidence

## Delivered / Acceptance Evidence

${acceptanceFile ? `- Acceptance Artifact: ${fileName(acceptanceFile.path)} — \`${acceptanceFile.path}\`` : '- ยังไม่พบ acceptance artifact'}

## Supporting Documents

### Brief / Scope

${listFiles([...briefFiles, ...scopeFiles], 'ยังไม่พบ brief/scope file')}

### Quotation

${listFiles(quotationFiles, 'ยังไม่พบ quotation file')}

### Change Requests / DCR

${listFiles(changeFiles, 'ไม่มี CR/DCR หรือยังไม่พบไฟล์ changes')}
`;

  const acceptanceReference = `# Acceptance Reference

## Acceptance Source

${acceptanceFile ? `- File: ${fileName(acceptanceFile.path)}\n- Path: \`${acceptanceFile.path}\`` : '- ยังไม่พบ acceptance artifact'}

## Acceptance Snapshot

${acceptanceFile ? acceptanceFile.markdown : 'ยังไม่มี acceptance markdown ให้ snapshot'}
`;

  const baselineIndex = `# Scope and Change Baseline Index

## Scope / Baseline Documents

${listFiles(scopeFiles, 'ยังไม่พบ scope baseline หรือ scope draft')}

## Quotation Documents

${listFiles(quotationFiles, 'ยังไม่พบ quotation baseline')}

## Change Baseline / CR-DCR Documents

${listFiles(changeFiles, 'ไม่มี change baseline หรือ CR/DCR ที่เกี่ยวข้อง')}
`;

  return {
    closeout_id: closeoutId,
    can_generate: canGenerate,
    warnings,
    files: [
      { path: `${basePath}/closeout-summary.md`, markdown: closeoutSummary },
      { path: `${basePath}/delivery-evidence.md`, markdown: deliveryEvidence },
      { path: `${basePath}/acceptance-reference.md`, markdown: acceptanceReference },
      { path: `${basePath}/scope-and-change-baseline-index.md`, markdown: baselineIndex },
    ],
    recommended_next_action: canGenerate
      ? 'สร้าง closeout pack ในโฟลเดอร์ closeout/ และใช้เป็นหลักฐานปิดงานรอบนี้'
      : 'ยังไม่ควรสร้าง closeout pack ให้แก้ warning ก่อน',
  };
}
