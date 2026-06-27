import { describe, expect, it } from 'vitest';
import { createCloseoutExportApplyPlan } from '../closeoutExportApplyPlan';
import type { CloseoutExportResult } from '../closeoutExport';

const result: CloseoutExportResult = {
  can_export: true,
  warnings: [],
  path: '/project/exports/closeout-package-index.md',
  markdown: '# Closeout Package Index',
  recommended_next_action: 'สร้าง export index',
};

describe('closeoutExportApplyPlan', () => {
  it('allows apply when export is ready and index does not exist', () => {
    const plan = createCloseoutExportApplyPlan(result, false);

    expect(plan.can_apply).toBe(true);
    expect(plan.path).toBe('/project/exports/closeout-package-index.md');
    expect(plan.markdown).toContain('Closeout Package Index');
    expect(plan.warnings).toHaveLength(0);
  });

  it('blocks apply when export index already exists', () => {
    const plan = createCloseoutExportApplyPlan(result, true);

    expect(plan.can_apply).toBe(false);
    expect(plan.path).toBeUndefined();
    expect(plan.markdown).toBeUndefined();
    expect(plan.blocked_existing_path).toBe('/project/exports/closeout-package-index.md');
    expect(plan.warnings.join(' ')).toContain('ไม่เขียนทับ');
  });

  it('blocks apply when export cannot be generated', () => {
    const plan = createCloseoutExportApplyPlan({ ...result, can_export: false, warnings: ['Closeout Pack ยังไม่ครบไฟล์'] }, false);

    expect(plan.can_apply).toBe(false);
    expect(plan.path).toBeUndefined();
    expect(plan.warnings).toContain('Closeout Pack ยังไม่ครบไฟล์');
    expect(plan.warnings).toContain('Closeout export ยังไม่ผ่านเงื่อนไข can_export');
  });
});
