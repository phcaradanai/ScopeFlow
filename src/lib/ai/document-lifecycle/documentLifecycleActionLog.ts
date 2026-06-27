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
