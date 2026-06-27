import type { CloseoutExportResult } from './closeoutExport';

export interface CloseoutExportApplyPlan {
  can_apply: boolean;
  path?: string;
  markdown?: string;
  warnings: string[];
  blocked_existing_path?: string;
  recommended_next_action: string;
}

export function createCloseoutExportApplyPlan(result: CloseoutExportResult, exportIndexExists: boolean): CloseoutExportApplyPlan {
  const warnings = [...result.warnings];

  if (!result.can_export) {
    warnings.push('Closeout export ยังไม่ผ่านเงื่อนไข can_export');
  }

  if (exportIndexExists) {
    warnings.push('พบ exports/closeout-package-index.md เดิมอยู่แล้ว ระบบจะไม่เขียนทับไฟล์เดิม');
  }

  const canApply = result.can_export && !exportIndexExists;

  return {
    can_apply: canApply,
    path: canApply ? result.path : undefined,
    markdown: canApply ? result.markdown : undefined,
    warnings,
    blocked_existing_path: exportIndexExists ? result.path : undefined,
    recommended_next_action: canApply
      ? 'พร้อมสร้าง exports/closeout-package-index.md สำหรับส่งต่อทีม/ลูกค้า'
      : 'ยังไม่สามารถสร้าง closeout export index ได้ ให้แก้ warning หรือจัดการไฟล์เดิมก่อน',
  };
}
