import { describe, expect, it } from 'vitest';
import type { ProjectDocument } from '../document-scanner';
import { buildGuidedOperatingModeState } from '../guided-operating-mode';

function doc(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    file_path: `/workspace/clients/acme/projects/app/${overrides.folder || 'baseline'}/${overrides.file_name || 'doc.md'}`,
    file_name: overrides.file_name || 'doc.md',
    folder: overrides.folder || 'baseline',
    type: overrides.type || 'brief',
    title: overrides.title || overrides.file_name || 'Document',
    status: overrides.status || 'draft',
    version: overrides.version || '1.0',
    locked: overrides.locked ?? false,
    excerpt: overrides.excerpt || '',
    markdown: overrides.markdown || '',
    parse_status: 'success',
    ...overrides,
  };
}

describe('buildGuidedOperatingModeState', () => {
  it('starts with customer discovery when no brief exists', () => {
    const state = buildGuidedOperatingModeState([]);

    expect(state.primaryAction.kind).toBe('start_discovery');
    expect(state.primaryAction.label).toContain('คำขอลูกค้า');
    expect(state.readinessScore).toBe(0);
    expect(state.blockers).toContain('ยังไม่มี Brief ที่ใช้เป็นฐานของงาน');
  });

  it('creates scope from brief when brief exists but scope is missing', () => {
    const state = buildGuidedOperatingModeState([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true }),
    ]);

    expect(state.primaryAction.kind).toBe('create_scope_from_brief');
    expect(state.primaryAction.documentType).toBe('scope');
    expect(state.primaryAction.documentPath).toContain('brief-v1.0.md');
  });

  it('asks for quotation after approved scope exists', () => {
    const state = buildGuidedOperatingModeState([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true }),
    ]);

    expect(state.primaryAction.kind).toBe('create_document');
    expect(state.primaryAction.documentType).toBe('quotation');
  });

  it('prioritizes open change requests before acceptance', () => {
    const state = buildGuidedOperatingModeState([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'quotation', file_name: 'quotation-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-SCOPE.md', document_type: 'scope', status: 'approved' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-QUOTE.md', document_type: 'quotation', status: 'approved' }),
      doc({ type: 'cr', folder: 'change-requests', file_name: 'CR-001.md', status: 'draft' }),
    ]);

    expect(state.primaryAction.kind).toBe('create_change_request');
    expect(state.primaryAction.label).toContain('Change Request');
  });
});
