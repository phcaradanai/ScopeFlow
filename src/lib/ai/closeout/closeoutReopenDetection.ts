import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CloseoutReopenRequestSummary {
  has_reopen_request: boolean;
  request_count: number;
  latest_request_path?: string;
  request_paths: string[];
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function isReopenRequestPath(path: string): boolean {
  const normalized = normalize(path);
  return /\/changes\/reopen-request-[^/]+\.md$/.test(normalized);
}

export function getCloseoutReopenRequestSummary(files: LifecycleScanFile[]): CloseoutReopenRequestSummary {
  const requestPaths = files
    .map(file => file.path)
    .filter(isReopenRequestPath)
    .sort((a, b) => b.localeCompare(a));

  return {
    has_reopen_request: requestPaths.length > 0,
    request_count: requestPaths.length,
    latest_request_path: requestPaths[0],
    request_paths: requestPaths,
  };
}
