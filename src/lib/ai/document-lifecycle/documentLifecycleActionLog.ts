export type ProjectLifecycleActionLogType =
  | 'created_closeout_pack'
  | 'created_export_index'
  | 'opened_closeout'
  | 'opened_export';

export interface ProjectLifecycleActionLogEntry {
  id: string;
  project_path: string;
  type: ProjectLifecycleActionLogType;
  label: string;
  created_at: string;
}

const ACTION_LOG_PREFIX = 'scopeflow:lifecycle_action_log:';
const ACTION_LOG_TYPES: ProjectLifecycleActionLogType[] = [
  'created_closeout_pack',
  'created_export_index',
  'opened_closeout',
  'opened_export',
];

export function getProjectLifecycleActionLogStorageKey(workspacePath: string): string {
  return `${ACTION_LOG_PREFIX}${workspacePath}`;
}

export function createProjectLifecycleActionLogEntry(projectPath: string, type: ProjectLifecycleActionLogType, createdAt = new Date().toISOString()): ProjectLifecycleActionLogEntry {
  const labelByType: Record<ProjectLifecycleActionLogType, string> = {
    created_closeout_pack: 'Created Closeout Pack',
    created_export_index: 'Created Export Index',
    opened_closeout: 'Opened Closeout',
    opened_export: 'Opened Export',
  };

  return {
    id: `${type}:${projectPath}:${createdAt}`,
    project_path: projectPath,
    type,
    label: labelByType[type],
    created_at: createdAt,
  };
}

function isActionLogEntry(value: unknown): value is ProjectLifecycleActionLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ProjectLifecycleActionLogEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.project_path === 'string' &&
    typeof entry.created_at === 'string' &&
    typeof entry.label === 'string' &&
    typeof entry.type === 'string' &&
    ACTION_LOG_TYPES.includes(entry.type as ProjectLifecycleActionLogType)
  );
}

export function parseProjectLifecycleActionLogs(raw: string | null): ProjectLifecycleActionLogEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isActionLogEntry);
  } catch {
    return [];
  }
}

export function serializeProjectLifecycleActionLogs(entries: ProjectLifecycleActionLogEntry[]): string {
  return JSON.stringify(entries);
}

export function addProjectLifecycleActionLogEntry(entries: ProjectLifecycleActionLogEntry[], entry: ProjectLifecycleActionLogEntry, maxEntries = 20): ProjectLifecycleActionLogEntry[] {
  return [entry, ...entries]
    .filter((item, index, list) => list.findIndex(existing => existing.id === item.id) === index)
    .slice(0, maxEntries);
}

export function formatProjectLifecycleActionLogTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('th-TH');
}
