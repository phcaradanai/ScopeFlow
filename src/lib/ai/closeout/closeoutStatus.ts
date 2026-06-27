import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutStatusSummary {
  closeout_pack_created: boolean;
  closeout_pack_missing_files: string[];
  export_index_created: boolean;
  export_ready: boolean;
  status_label: 'not_started' | 'closeout_incomplete' | 'closeout_ready' | 'export_ready';
  recommended_next_action: string;
}

const REQUIRED_CLOSEOUT_FILES = [
  'closeout-summary.md',
  'delivery-evidence.md',
  'acceptance-reference.md',
  'scope-and-change-baseline-index.md',
];

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function fileName(path: string): string {
  return path.split(/[/\\]/).pop()?.toLowerCase() || path.toLowerCase();
}

export function getCloseoutStatusSummary(files: LifecycleScanFile[]): CloseoutStatusSummary {
  const closeoutFiles = files.filter(file => normalize(file.path).includes('/closeout/'));
  const closeoutFileNames = new Set(closeoutFiles.map(file => fileName(file.path)));
  const missing = REQUIRED_CLOSEOUT_FILES.filter(name => !closeoutFileNames.has(name));
  const closeoutPackCreated = closeoutFiles.length > 0 && missing.length === 0;
  const exportIndexCreated = files.some(file => normalize(file.path).endsWith('/exports/closeout-package-index.md'));
  const exportReady = closeoutPackCreated && exportIndexCreated;

  if (exportReady) {
    return {
      closeout_pack_created: true,
      closeout_pack_missing_files: [],
      export_index_created: true,
      export_ready: true,
      status_label: 'export_ready',
      recommended_next_action: 'Export พร้อมส่งต่อทีม/ลูกค้าแล้ว',
    };
  }

  if (closeoutPackCreated) {
    return {
      closeout_pack_created: true,
      closeout_pack_missing_files: [],
      export_index_created: exportIndexCreated,
      export_ready: false,
      status_label: 'closeout_ready',
      recommended_next_action: 'สร้าง Export Index เพื่อใช้เป็นสารบัญส่งต่อลูกค้า/ทีม',
    };
  }

  if (closeoutFiles.length > 0) {
    return {
      closeout_pack_created: false,
      closeout_pack_missing_files: missing,
      export_index_created: exportIndexCreated,
      export_ready: false,
      status_label: 'closeout_incomplete',
      recommended_next_action: `Closeout Pack ยังไม่ครบไฟล์: ${missing.join(', ')}`,
    };
  }

  return {
    closeout_pack_created: false,
    closeout_pack_missing_files: REQUIRED_CLOSEOUT_FILES,
    export_index_created: exportIndexCreated,
    export_ready: false,
    status_label: 'not_started',
    recommended_next_action: 'ยังไม่มี Closeout Pack ให้สร้าง Closeout Pack หลัง Can close เป็น yes',
  };
}
