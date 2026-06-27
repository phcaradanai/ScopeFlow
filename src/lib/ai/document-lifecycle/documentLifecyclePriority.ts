import { getCloseoutStatusSummary } from '../closeout/closeoutStatus';
import type { DocumentLifecycleSummary } from './documentLifecycle';
import type { LifecycleScanFile } from './documentLifecycleFileScan';

export type ProjectLifecyclePriorityCategory =
  | 'blocked'
  | 'needs_action'
  | 'can_close'
  | 'closeout_ready'
  | 'export_ready'
  | 'missing_docs';

export interface ProjectLifecyclePriority {
  category: ProjectLifecyclePriorityCategory;
  score: number;
  label: string;
  reason: string;
}

export function getProjectLifecyclePriority(summary: DocumentLifecycleSummary, files: LifecycleScanFile[]): ProjectLifecyclePriority {
  const closeoutStatus = getCloseoutStatusSummary(files);

  if (closeoutStatus.export_ready) {
    return {
      category: 'export_ready',
      score: 10,
      label: 'Export Ready',
      reason: 'Closeout pack และ export index พร้อมแล้ว',
    };
  }

  if (closeoutStatus.closeout_pack_created) {
    return {
      category: 'closeout_ready',
      score: 20,
      label: 'Closeout Ready',
      reason: 'มี closeout pack แล้ว เหลือสร้าง export index',
    };
  }

  if (summary.can_close_work) {
    return {
      category: 'can_close',
      score: 30,
      label: 'Can Close',
      reason: 'Acceptance sign-off แล้ว พร้อมสร้าง closeout pack',
    };
  }

  if (summary.blocked_count > 0) {
    return {
      category: 'blocked',
      score: 40,
      label: 'Blocked',
      reason: 'มี lifecycle blocker ที่ต้องแก้ก่อนเดินงานต่อ',
    };
  }

  if (summary.missing_count > 0) {
    return {
      category: 'missing_docs',
      score: 50,
      label: 'Missing Docs',
      reason: 'ยังขาดเอกสารหลักใน lifecycle',
    };
  }

  return {
    category: 'needs_action',
    score: 60,
    label: 'Needs Action',
    reason: 'ยังมี next action ที่ต้องดำเนินการต่อ',
  };
}
