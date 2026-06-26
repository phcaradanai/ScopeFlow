import { describe, expect, it } from 'vitest';
import { computeProjectWorkflow } from '../project-workflow';
import type { ProjectDocument } from '../document-scanner';

function doc(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    file_path: `/workspace/demo/${overrides.file_name || 'doc.md'}`,
    file_name: overrides.file_name || 'doc.md',
    folder: overrides.folder || 'baseline',
    type: overrides.type || 'brief',
    title: overrides.title || 'Document',
    status: overrides.status || 'draft',
    version: overrides.version || '1.0',
    locked: overrides.locked ?? false,
    excerpt: overrides.excerpt || '',
    parse_status: overrides.parse_status || 'success',
    ...overrides,
  };
}

describe('computeProjectWorkflow', () => {
  it('starts from customer request when there is no brief or scope', () => {
    const state = computeProjectWorkflow([]);

    expect(state.currentStep).toBe('brief');
    expect(state.targetDocumentType).toBe('brief');
    expect(state.readinessScore).toBe(0);
    expect(state.missingRequiredItems).toContain('Brief');
  });

  it('requires brief approval before creating scope', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'draft', locked: false }),
    ]);

    expect(state.currentStep).toBe('brief');
    expect(state.nextActionLabel).toContain('อนุมัติ Brief');
    expect(state.missingRequiredItems).toContain('Approved Brief');
  });

  it('asks for scope after approved brief', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true }),
    ]);

    expect(state.currentStep).toBe('scope');
    expect(state.targetDocumentType).toBe('scope');
    expect(state.missingRequiredItems).toContain('Scope');
  });

  it('asks to review scope when scope is still draft', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'draft', locked: false }),
    ]);

    expect(state.currentStep).toBe('scope');
    expect(state.nextActionLabel).toContain('ตรวจ Scope');
    expect(state.missingRequiredItems).toContain('Approved Scope');
  });

  it('asks for quotation after approved scope', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-SCOPE-1' }),
    ]);

    expect(state.currentStep).toBe('quotation');
    expect(state.targetDocumentType).toBe('quotation');
  });

  it('asks to follow up pending quotation before approval evidence', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-SCOPE-1' }),
      doc({ type: 'quotation', file_name: 'quotation-v1.0.md', status: 'pending', locked: false }),
    ]);

    expect(state.currentStep).toBe('quotation');
    expect(state.targetDocumentType).toBe('approval-record');
    expect(state.missingRequiredItems).toContain('Approved Quotation');
  });

  it('requires explicit approval evidence for scope and quotation', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true }),
      doc({ type: 'quotation', file_name: 'quotation-v1.0.md', status: 'approved', locked: true }),
    ]);

    expect(state.currentStep).toBe('approval');
    expect(state.missingRequiredItems).toContain('Scope Approval Evidence');
    expect(state.missingRequiredItems).toContain('Quotation Approval Evidence');
  });

  it('asks for acceptance after approved scope and quotation with evidence', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-SCOPE-1' }),
      doc({ type: 'quotation', file_name: 'quotation-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-QUOTE-1' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-SCOPE-1.md', document_type: 'scope' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-QUOTE-1.md', document_type: 'quotation' }),
    ]);

    expect(state.currentStep).toBe('acceptance');
    expect(state.targetDocumentType).toBe('acceptance');
  });

  it('is done only when acceptance is approved and has evidence', () => {
    const state = computeProjectWorkflow([
      doc({ type: 'brief', file_name: 'brief-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-BRIEF-1' }),
      doc({ type: 'scope', file_name: 'scope-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-SCOPE-1' }),
      doc({ type: 'quotation', file_name: 'quotation-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-QUOTE-1' }),
      doc({ type: 'acceptance', folder: 'acceptance', file_name: 'acceptance-v1.0.md', status: 'approved', locked: true, approval_ref: 'APR-ACCEPT-1' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-SCOPE-1.md', document_type: 'scope' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-QUOTE-1.md', document_type: 'quotation' }),
      doc({ type: 'approval-record', folder: 'approvals', file_name: 'APR-ACCEPT-1.md', document_type: 'acceptance' }),
    ]);

    expect(state.currentStep).toBe('done');
    expect(state.readinessScore).toBe(100);
    expect(state.missingRequiredItems).toEqual([]);
  });
});
