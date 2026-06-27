import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutOpenTarget {
  closeout_summary_path?: string;
  export_index_path?: string;
  export_folder_path?: string;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function findPath(files: LifecycleScanFile[], suffix: string): string | undefined {
  return files.find(file => normalize(file.path).endsWith(suffix))?.path;
}

function parentFolder(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  if (lastSlash < 0) return undefined;
  return path.slice(0, lastSlash);
}

export function getCloseoutOpenTarget(files: LifecycleScanFile[]): CloseoutOpenTarget {
  const exportIndexPath = findPath(files, '/exports/closeout-package-index.md');
  return {
    closeout_summary_path: findPath(files, '/closeout/closeout-summary.md'),
    export_index_path: exportIndexPath,
    export_folder_path: parentFolder(exportIndexPath),
  };
}
