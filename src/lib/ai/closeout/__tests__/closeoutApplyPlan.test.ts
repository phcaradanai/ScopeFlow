import { describe, expect, it } from 'vitest';
import { createCloseoutApplyPlan } from '../closeoutApplyPlan';
import type { CloseoutPack } from '../closeoutPack';

const pack: CloseoutPack = {
  closeout_id: 'CLOSEOUT-001',
  can_generate: true,
  warnings: [],
  recommended_next_action: 'สร้าง closeout pack',
  files: [
    { path: '/project/closeout/closeout-summary.md', markdown: '# Summary' },
    { path: '/project/closeout/delivery-evidence.md', markdown: '# Evidence' },
  ],
};

describe('closeoutApplyPlan', () => {
  it('allows apply when pack can generate and no files exist', () => {
    const plan = createCloseoutApplyPlan(pack, []);

    expect(plan.can_apply).toBe(true);
    expect(plan.files).toHaveLength(2);
    expect(plan.blocked_existing_paths).toHaveLength(0);
  });

  it('blocks apply when a closeout file already exists', () => {
    const plan = createCloseoutApplyPlan(pack, ['/project/closeout/closeout-summary.md']);

    expect(plan.can_apply).toBe(false);
    expect(plan.files).toHaveLength(0);
    expect(plan.blocked_existing_paths).toEqual(['/project/closeout/closeout-summary.md']);
    expect(plan.warnings.join(' ')).toContain('ไม่เขียนทับ');
  });

  it('blocks apply when pack cannot generate', () => {
    const plan = createCloseoutApplyPlan({ ...pack, can_generate: false, warnings: ['ยัง close ไม่ได้'] }, []);

    expect(plan.can_apply).toBe(false);
    expect(plan.files).toHaveLength(0);
    expect(plan.warnings).toContain('ยัง close ไม่ได้');
    expect(plan.warnings).toContain('Closeout Pack ยังไม่ผ่านเงื่อนไข can_generate');
  });
});
