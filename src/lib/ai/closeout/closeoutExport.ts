import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutExportInput {
  project_name: string;
  project_path: string;
  closeout_files: LifecycleScanFile[];
  export_id?: string;
  exported_at?: string;
}

export interface CloseoutExportResult {
  can_export: boolean;
  warnings: string[];
  path: string;
  markdown: string;
  recommended_next_action: string;
}

const REQUIRED_CLOSEOUT_FILES = [
  'closeout-summary.md',
  'delivery-evidence.md',
  'acceptance-reference.md',
  'scope-and-change-baseline-index.md',
];

function fallbackExportId(): string {
  return `CLOSEOUT-EXPORT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function fileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function excerpt(markdown: string, length = 180): string {
  const clean = markdown
    .replace(/^---[\s\S]*?---\n+/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

function findByName(files: LifecycleScanFile[], requiredName: string): LifecycleScanFile | undefined {
  return files.find(file => fileName(file.path).toLowerCase() === requiredName.toLowerCase());
}

export function buildCloseoutPackageExport(input: CloseoutExportInput): CloseoutExportResult {
  const exportId = input.export_id?.trim() || fallbackExportId();
  const exportedAt = input.exported_at?.trim() || new Date().toISOString().slice(0, 10);
  const closeoutFiles = input.closeout_files.filter(file => normalize(file.path).includes('/closeout/'));
  const missing = REQUIRED_CLOSEOUT_FILES.filter(name => !findByName(closeoutFiles, name));
  const warnings: string[] = [];

  if (closeoutFiles.length === 0) {
    warnings.push('ไม่พบไฟล์ใน closeout/ สำหรับสร้าง export index');
  }
  if (missing.length > 0) {
    warnings.push(`Closeout Pack ยังไม่ครบไฟล์: ${missing.join(', ')}`);
  }

  const canExport = warnings.length === 0;
  const basePath = `${input.project_path.replace(/[/\\]$/, '')}/exports`;
  const path = `${basePath}/closeout-package-index.md`;

  const requiredRows = REQUIRED_CLOSEOUT_FILES.map(name => {
    const found = findByName(closeoutFiles, name);
    return `| ${name} | ${found ? 'ready' : 'missing'} | ${found ? `\`${found.path}\`` : '-'} |`;
  }).join('\n');

  const fileSummaries = closeoutFiles.length === 0
    ? '- ยังไม่พบไฟล์ closeout'
    : closeoutFiles
      .sort((a, b) => fileName(a.path).localeCompare(fileName(b.path)))
      .map(file => `## ${fileName(file.path)}\n\n- Path: \`${file.path}\`\n- Excerpt: ${excerpt(file.markdown) || 'ไม่มีข้อความสรุป'}\n`)
      .join('\n');

  const markdown = `# Closeout Package Index

## Metadata

- Export ID: **${exportId}**
- Project: **${input.project_name}**
- Exported At: **${exportedAt}**
- Ready To Share: **${canExport ? 'yes' : 'no'}**

## Required Closeout Files

| File | Status | Path |
|---|---|---|
${requiredRows}

## Warnings

${warnings.length === 0 ? '- No warnings' : warnings.map(warning => `- ${warning}`).join('\n')}

## Package File Summaries

${fileSummaries}

## Recommended Use

${canExport ? 'ใช้ไฟล์นี้เป็น index สำหรับส่งต่อทีม/ลูกค้า พร้อมแนบไฟล์ใน closeout/ ทั้งชุด' : 'ยังไม่ควรส่งต่อจนกว่า closeout pack จะครบไฟล์'}
`;

  return {
    can_export: canExport,
    warnings,
    path,
    markdown,
    recommended_next_action: canExport
      ? 'สร้าง closeout package index ใน exports/ เพื่อใช้เป็นสารบัญส่งต่อลูกค้า/ทีม'
      : 'ยังไม่ควร export closeout package ให้เติมไฟล์ closeout ที่ขาดก่อน',
  };
}
