import type { CloseoutFinalStatus } from './closeoutFinalStatus';

export interface CloseoutFinalizedGuard {
  is_finalized: boolean;
  lock_reason: string | null;
  delivery_actions_disabled: boolean;
}

export function getCloseoutFinalizedGuard(finalStatus: CloseoutFinalStatus): CloseoutFinalizedGuard {
  const isFinalized = finalStatus.kind === 'finalized';
  return {
    is_finalized: isFinalized,
    lock_reason: isFinalized
      ? 'Project นี้ถูกปิดงานเป็น Finalized / Closed แล้ว หากต้องเปลี่ยนสถานะควรเปิด change/reopen flow แยกเพื่อไม่ให้ประวัติปิดงานสับสน'
      : null,
    delivery_actions_disabled: isFinalized,
  };
}
