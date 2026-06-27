import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutOpenTarget {
  closeout_summary_path?: string;
  export_index_path?: string;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function findPath(files: LifecycleScanFile[], suffix: string): string | undefined {
  return files.find(file => normalize(file.path).endsWith(suffix))?.path;
}

export function getCloseoutOpenTarget(files: LifecycleScanFile[]): CloseoutOpenTarget {
  return {
    closeout_summary_path: findPath(files, '/closeout/closeout-summary.md'),
    export_index_path: findPath(files, '/exports/closeout-package-index.md'),
  };
}
