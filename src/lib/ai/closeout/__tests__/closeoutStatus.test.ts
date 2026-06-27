import { describe, expect, it } from 'vitest';
import { getCloseoutStatusSummary } from '../closeoutStatus';

const projectPath = '/workspace/clients/client-1/projects/project-1';
const fullCloseoutFiles = [
  { path: `${projectPath}/closeout/closeout-summary.md`, markdown: '# Summary' },
  { path: `${projectPath}/closeout/delivery-evidence.md`, markdown: '# Evidence' },
  { path: `${projectPath}/closeout/acceptance-reference.md`, markdown: '# Acceptance' },
  { path: `${projectPath}/closeout/scope-and-change-baseline-index.md`, markdown: '# Baseline' },
];

describe('closeoutStatus', () => {
  it('returns not_started when no closeout files exist', () => {
    const status = getCloseoutStatusSummary([]);

    expect(status.status_label).toBe('not_started');
    expect(status.closeout_pack_created).toBe(false);
    expect(status.export_ready).toBe(false);
    expect(status.closeout_pack_missing_files).toContain('closeout-summary.md');
  });

  it('returns closeout_incomplete when some closeout files are missing', () => {
    const status = getCloseoutStatusSummary([
      { path: `${projectPath}/closeout/closeout-summary.md`, markdown: '# Summary' },
    ]);

    expect(status.status_label).toBe('closeout_incomplete');
    expect(status.closeout_pack_created).toBe(false);
    expect(status.closeout_pack_missing_files).toContain('delivery-evidence.md');
    expect(status.recommended_next_action).toContain('ยังไม่ครบไฟล์');
  });

  it('returns closeout_ready when closeout pack exists but export index is missing', () => {
    const status = getCloseoutStatusSummary(fullCloseoutFiles);

    expect(status.status_label).toBe('closeout_ready');
    expect(status.closeout_pack_created).toBe(true);
    expect(status.export_index_created).toBe(false);
    expect(status.export_ready).toBe(false);
  });

  it('returns export_ready when closeout pack and export index exist', () => {
    const status = getCloseoutStatusSummary([
      ...fullCloseoutFiles,
      { path: `${projectPath}/exports/closeout-package-index.md`, markdown: '# Export Index' },
    ]);

    expect(status.status_label).toBe('export_ready');
    expect(status.closeout_pack_created).toBe(true);
    expect(status.export_index_created).toBe(true);
    expect(status.export_ready).toBe(true);
    expect(status.recommended_next_action).toContain('พร้อมส่งต่อ');
  });
});
