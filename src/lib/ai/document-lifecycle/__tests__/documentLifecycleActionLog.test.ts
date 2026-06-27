import { describe, expect, it } from 'vitest';
import {
  addProjectLifecycleActionLogEntry,
  createProjectLifecycleActionLogEntry,
  formatProjectLifecycleActionLogTime,
  getProjectLifecycleActionLogStorageKey,
  parseProjectLifecycleActionLogs,
  serializeProjectLifecycleActionLogs,
} from '../documentLifecycleActionLog';

const projectPath = '/workspace/clients/client-1/projects/project-1';

describe('documentLifecycleActionLog', () => {
  it('creates a readable action log entry', () => {
    const entry = createProjectLifecycleActionLogEntry(projectPath, 'created_closeout_pack', '2026-06-27T12:00:00.000Z');

    expect(entry.project_path).toBe(projectPath);
    expect(entry.type).toBe('created_closeout_pack');
    expect(entry.label).toBe('Created Closeout Pack');
    expect(entry.id).toContain('created_closeout_pack');
  });

  it('creates a workspace scoped localStorage key', () => {
    expect(getProjectLifecycleActionLogStorageKey('/workspace/a')).toBe('scopeflow:lifecycle_action_log:/workspace/a');
  });

  it('serializes and parses action log entries', () => {
    const entry = createProjectLifecycleActionLogEntry(projectPath, 'opened_export', '2026-06-27T12:00:00.000Z');
    const raw = serializeProjectLifecycleActionLogs([entry]);
    const parsed = parseProjectLifecycleActionLogs(raw);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('opened_export');
  });

  it('returns an empty list for malformed stored data', () => {
    expect(parseProjectLifecycleActionLogs('not-json')).toEqual([]);
    expect(parseProjectLifecycleActionLogs('{"bad": true}')).toEqual([]);
  });

  it('filters malformed entries from stored data', () => {
    const entry = createProjectLifecycleActionLogEntry(projectPath, 'opened_export', '2026-06-27T12:00:00.000Z');
    const parsed = parseProjectLifecycleActionLogs(JSON.stringify([entry, { id: 'bad', type: 'unknown' }]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(entry.id);
  });

  it('deduplicates entries by id', () => {
    const entry = createProjectLifecycleActionLogEntry(projectPath, 'opened_export', '2026-06-27T12:00:00.000Z');
    const result = addProjectLifecycleActionLogEntry([entry], entry);

    expect(result).toHaveLength(1);
  });

  it('keeps newest entries first and respects max entries', () => {
    const oldEntry = createProjectLifecycleActionLogEntry(projectPath, 'opened_closeout', '2026-06-27T12:00:00.000Z');
    const newEntry = createProjectLifecycleActionLogEntry(projectPath, 'opened_export', '2026-06-27T12:01:00.000Z');
    const result = addProjectLifecycleActionLogEntry([oldEntry], newEntry, 1);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('opened_export');
  });

  it('formats invalid time as the original value', () => {
    expect(formatProjectLifecycleActionLogTime('not-a-date')).toBe('not-a-date');
  });
});
