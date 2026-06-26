import { describe, expect, it } from 'vitest';
import { extractDocumentMetadata } from '../document-scanner';

describe('extractDocumentMetadata', () => {
  const projectPath = '/Users/test/workspace/client/project';

  it('extracts metadata from valid frontmatter', () => {
    const content = `---
title: System Scope
type: scope
status: approved
version: 1.2
locked: true
approved_by: John Doe
---
# Welcome
This is the excerpt text that should be extracted.`;

    const filePath = `${projectPath}/baseline/scope-v1.2.md`;
    const result = extractDocumentMetadata(filePath, content, projectPath);

    expect(result.file_name).toBe('scope-v1.2.md');
    expect(result.folder).toBe('baseline');
    expect(result.title).toBe('System Scope');
    expect(result.type).toBe('scope');
    expect(result.status).toBe('approved');
    expect(result.version).toBe('1.2');
    expect(result.locked).toBe(true);
    expect(result.approved_by).toBe('John Doe');
    expect(result.parse_status).toBe('success');
    expect(result.excerpt).toBe('Welcome This is the excerpt text that should be extracted.');
  });

  it('extracts approval metadata used by workflow checks', () => {
    const content = `---
type: approval-record
title: "บันทึกการอนุมัติ Scope"
approval_number: "APR-SCOPE-001"
status: recorded
approved_document: "scope-v1.0.md"
document_type: "scope"
approved_by: "คุณลูกค้า"
approval_method: "email"
evidence_files: ["email-confirmation.txt"]
created: "2026-06-30"
---
# Approval Record
ลูกค้ายืนยันอนุมัติ scope`;

    const metadata = extractDocumentMetadata(`${projectPath}/approvals/APR-SCOPE-001.md`, content, projectPath);

    expect(metadata.type).toBe('approval-record');
    expect(metadata.folder).toBe('approvals');
    expect(metadata.approval_number).toBe('APR-SCOPE-001');
    expect(metadata.document_type).toBe('scope');
    expect(metadata.approved_document).toBe('scope-v1.0.md');
    expect(metadata.evidence_files).toEqual(['email-confirmation.txt']);
    expect(metadata.parse_status).toBe('success');
  });

  it('falls back to H1 and default type if frontmatter is missing', () => {
    const content = `# Fallback Title
Some body text.`;

    const filePath = `${projectPath}/change-requests/cr-01.md`;
    const result = extractDocumentMetadata(filePath, content, projectPath);

    expect(result.title).toBe('Fallback Title');
    expect(result.type).toBe('change-requests');
    expect(result.status).toBe('draft');
    expect(result.parse_status).toBe('warning');
    expect(result.excerpt).toBe('Fallback Title Some body text.');
  });

  it('does not crash on invalid frontmatter and returns defaults', () => {
    const content = `---
invalid: yaml: [
---
# Invalid File`;

    const filePath = `${projectPath}/baseline/bad.md`;
    const result = extractDocumentMetadata(filePath, content, projectPath);

    expect(result.title).toBe('Invalid File');
    expect(result.type).toBe('baseline');
    expect(result.parse_status).toBe('warning');
    expect(result.excerpt).toBe('Invalid File');
  });

  it('labels export HTML files as successful export documents', () => {
    const result = extractDocumentMetadata(`${projectPath}/exports/pack.html`, '<html></html>', projectPath);

    expect(result.type).toBe('export');
    expect(result.status).toBe('exported');
    expect(result.parse_status).toBe('success');
  });

  it('handles deeply nested folder paths gracefully', () => {
    const result = extractDocumentMetadata(`${projectPath}/baseline/subfolder/deep.md`, '# Deep', projectPath);

    expect(result.folder).toBe('baseline');
    expect(result.file_name).toBe('deep.md');
  });

  it('sets scope content flags from Thai and English headings', () => {
    const content = `---
type: scope
title: "Scope"
status: draft
---
# Scope

## Goal / Overview
Build a customer portal with clear project boundaries.

## In-Scope
Customer request intake and document generation.

## Out-of-Scope
Native mobile apps and payment gateway settlement.

## Deliverables
Markdown scope pack and export package.

## Acceptance Criteria
The user can verify scope and approval state.

## Assumptions
The workspace folder is available locally.

## Questions
No open questions.`;

    const metadata = extractDocumentMetadata(`${projectPath}/baseline/scope-v1.0.md`, content, projectPath);

    expect(metadata.content_flags?.hasGoal).toBe(true);
    expect(metadata.content_flags?.hasInScope).toBe(true);
    expect(metadata.content_flags?.hasOutOfScope).toBe(true);
    expect(metadata.content_flags?.hasDeliverables).toBe(true);
    expect(metadata.content_flags?.hasAcceptance).toBe(true);
    expect(metadata.content_flags?.hasAssumptions).toBe(true);
    expect(metadata.content_flags?.hasQuestions).toBe(true);
  });
});
