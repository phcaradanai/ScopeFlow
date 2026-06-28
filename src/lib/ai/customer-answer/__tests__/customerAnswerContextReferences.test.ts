import { describe, expect, it } from 'vitest';
import { getCustomerAnswerContextReferences } from '../customerAnswerContextReferences';
import type { LifecycleScanFile } from '../../document-lifecycle/documentLifecycleFileScan';

describe('getCustomerAnswerContextReferences', () => {
  it('links scope baseline and approved quotation when available', () => {
    const files: LifecycleScanFile[] = [
      { path: '/workspace/clients/acme/projects/shop/baseline/scope-baseline-v1.md', markdown: '# Scope Baseline' },
      { path: '/workspace/clients/acme/projects/shop/quotation/quote-v1-approved.md', markdown: '# Quotation\nApproved: yes' },
    ];

    const refs = getCustomerAnswerContextReferences(files);

    expect(refs.find(ref => ref.id === 'scope_baseline')?.sourcePath).toContain('scope-baseline-v1.md');
    expect(refs.find(ref => ref.id === 'approved_quotation')?.sourcePath).toContain('quote-v1-approved.md');
    expect(refs.find(ref => ref.id === 'recommended_cr_dcr')?.status).toBe('recommended');
  });

  it('marks missing references when source files are not found', () => {
    const refs = getCustomerAnswerContextReferences([]);

    expect(refs.find(ref => ref.id === 'scope_baseline')?.status).toBe('missing');
    expect(refs.find(ref => ref.id === 'approved_quotation')?.status).toBe('missing');
    expect(refs.find(ref => ref.id === 'scope_baseline')?.sourcePath).toBeUndefined();
    expect(refs.find(ref => ref.id === 'approved_quotation')?.sourcePath).toBeUndefined();
  });

  it('does not link unapproved quotations as approved quotation evidence', () => {
    const files: LifecycleScanFile[] = [
      { path: '/workspace/clients/acme/projects/shop/quotation/quote-draft.md', markdown: '# Quotation\nStatus: draft' },
    ];

    const refs = getCustomerAnswerContextReferences(files);

    expect(refs.find(ref => ref.id === 'approved_quotation')?.status).toBe('missing');
    expect(refs.find(ref => ref.id === 'approved_quotation')?.sourcePath).toBeUndefined();
  });
});
