import { describe, expect, it } from 'vitest';
import { getDocumentLifecycleActionTarget } from '../documentLifecycleAction';

describe('documentLifecycleAction', () => {
  it('opens acceptance artifact when work is signed off', () => {
    const target = getDocumentLifecycleActionTarget([
      { path: '/project/acceptance/ACC-001.md', markdown: '# Acceptance' },
      { path: '/project/baseline/quotation-draft-v1.0.md', markdown: '# Quote' },
    ], {
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceSignedOff: true,
    });

    expect(target.file_path).toContain('acceptance/ACC-001.md');
    expect(target.label).toBe('เปิด Acceptance Sign-off');
  });

  it('opens acceptance artifact when ready for signoff', () => {
    const target = getDocumentLifecycleActionTarget([
      { path: '/project/acceptance/ACC-001.md', markdown: '# Acceptance' },
    ], {
      acceptanceReadyForSignoff: true,
    });

    expect(target.file_path).toContain('acceptance/ACC-001.md');
    expect(target.label).toBe('เปิด Acceptance');
  });

  it('opens CR/DCR when CR is approved but change baseline is missing', () => {
    const target = getDocumentLifecycleActionTarget([
      { path: '/project/changes/CR-001-draft.md', markdown: '# CR' },
      { path: '/project/baseline/quotation-draft-v1.0.md', markdown: '# Quote' },
    ], {
      hasChangeRequest: true,
      changeRequestApproved: true,
      changeBaselineReady: false,
    });

    expect(target.file_path).toContain('changes/CR-001-draft.md');
    expect(target.reason).toContain('Change Baseline');
  });

  it('opens CR/DCR when scope baseline is ready and new CR draft is pending', () => {
    const target = getDocumentLifecycleActionTarget([
      { path: '/project/changes/CR-002-draft.md', markdown: '# CR' },
      { path: '/project/baseline/scope-baseline.md', markdown: '# Scope Baseline' },
    ], {
      scopeBaselineReady: true,
      hasChangeRequest: true,
      changeRequestApproved: false,
    });

    expect(target.file_path).toContain('changes/CR-002-draft.md');
    expect(target.reason).toContain('CR/DCR ยังรอ approval หรือยังไม่มีหลักฐานครบ');
    expect(target.label).toBe('เปิด CR/DCR');
  });

  it('opens quotation when quotation is approved but scope baseline is missing', () => {
    const target = getDocumentLifecycleActionTarget([
      { path: '/project/baseline/quotation-draft-v1.0.md', markdown: '# Quote' },
    ], {
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: false,
    });

    expect(target.file_path).toContain('quotation-draft-v1.0.md');
    expect(target.reason).toContain('Scope Baseline');
  });

  it('falls back to scope then brief then project', () => {
    const scope = getDocumentLifecycleActionTarget([
      { path: '/project/baseline/scope-v1.0.md', markdown: '# Scope' },
    ], { hasScope: true });
    expect(scope.file_path).toContain('scope-v1.0.md');

    const brief = getDocumentLifecycleActionTarget([
      { path: '/project/baseline/brief-v1.0.md', markdown: '# Brief' },
    ], { hasBrief: true });
    expect(brief.file_path).toContain('brief-v1.0.md');

    const project = getDocumentLifecycleActionTarget([], {});
    expect(project.file_path).toBeUndefined();
    expect(project.label).toBe('เปิด Project');
  });
});
