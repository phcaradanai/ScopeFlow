import { describe, expect, it } from 'vitest';
import { buildCloseoutPackageExport } from '../closeoutExport';

const projectPath = '/workspace/clients/client-1/projects/project-1';
const closeoutFiles = [
  { path: `${projectPath}/closeout/closeout-summary.md`, markdown: '# Closeout Summary\nงานปิดได้แล้ว' },
  { path: `${projectPath}/closeout/delivery-evidence.md`, markdown: '# Delivery Evidence\nส่งมอบครบ' },
  { path: `${projectPath}/closeout/acceptance-reference.md`, markdown: '# Acceptance Reference\nStatus: **signed_off**' },
  { path: `${projectPath}/closeout/scope-and-change-baseline-index.md`, markdown: '# Scope and Change Baseline Index\nBaseline พร้อม' },
];

describe('closeoutExport', () => {
  it('builds closeout package index when all required files exist', () => {
    const result = buildCloseoutPackageExport({
      project_name: 'Project 1',
      project_path: projectPath,
      closeout_files: closeoutFiles,
      export_id: 'CLOSEOUT-EXPORT-001',
      exported_at: '2026-06-27',
    });

    expect(result.can_export).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.path).toBe(`${projectPath}/exports/closeout-package-index.md`);
    expect(result.markdown).toContain('Export ID: **CLOSEOUT-EXPORT-001**');
    expect(result.markdown).toContain('Ready To Share: **yes**');
    expect(result.markdown).toContain('| closeout-summary.md | ready |');
    expect(result.markdown).toContain('Acceptance Reference');
  });

  it('warns when a required closeout file is missing', () => {
    const result = buildCloseoutPackageExport({
      project_name: 'Project 1',
      project_path: projectPath,
      closeout_files: closeoutFiles.filter(file => !file.path.endsWith('acceptance-reference.md')),
    });

    expect(result.can_export).toBe(false);
    expect(result.warnings.join(' ')).toContain('acceptance-reference.md');
    expect(result.markdown).toContain('| acceptance-reference.md | missing | - |');
    expect(result.recommended_next_action).toContain('ยังไม่ควร export');
  });

  it('warns when no closeout files exist', () => {
    const result = buildCloseoutPackageExport({
      project_name: 'Project 1',
      project_path: projectPath,
      closeout_files: [],
    });

    expect(result.can_export).toBe(false);
    expect(result.warnings.join(' ')).toContain('ไม่พบไฟล์ใน closeout/');
    expect(result.markdown).toContain('ยังไม่พบไฟล์ closeout');
  });
});
