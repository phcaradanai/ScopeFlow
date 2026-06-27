import type { CloseoutPack, CloseoutPackFile } from './closeoutPack';

export interface CloseoutApplyPlan {
  can_apply: boolean;
  files: CloseoutPackFile[];
  warnings: string[];
  blocked_existing_paths: string[];
  recommended_next_action: string;
}

export function createCloseoutApplyPlan(pack: CloseoutPack, existingPaths: string[] = []): CloseoutApplyPlan {
  const normalizedExisting = new Set(existingPaths.map(path => path.replace(/\\/g, '/').toLowerCase()));
  const blockedExistingPaths = pack.files
    .map(file => file.path)
    .filter(path => normalizedExisting.has(path.replace(/\\/g, '/').toLowerCase()));

  const warnings = [...pack.warnings];
  if (!pack.can_generate) {
    warnings.push('Closeout Pack ยังไม่ผ่านเงื่อนไข can_generate');
  }
  if (blockedExistingPaths.length > 0) {
    warnings.push('พบไฟล์ closeout เดิมอยู่แล้ว ระบบจะไม่เขียนทับไฟล์เดิม');
  }

  const canApply = pack.can_generate && blockedExistingPaths.length === 0;

  return {
    can_apply: canApply,
    files: canApply ? pack.files : [],
    warnings,
    blocked_existing_paths: blockedExistingPaths,
    recommended_next_action: canApply
      ? 'พร้อมสร้าง closeout pack เป็นไฟล์จริงในโฟลเดอร์ closeout/'
      : 'ยังไม่สามารถสร้าง closeout pack ได้ ให้แก้ warning หรือจัดการไฟล์ที่มีอยู่ก่อน',
  };
}
