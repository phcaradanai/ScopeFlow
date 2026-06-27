import { describe, expect, it } from 'vitest';
import { buildDocumentLifecycleSummary } from '../documentLifecycle';
import { scanDocumentLifecycleFromFiles } from '../documentLifecycleFileScan';

describe('documentLifecycleFileScan', () => {
  it('detects brief scope and quotation files from project documents', () => {
    const input = scanDocumentLifecycleFromFiles([
      { path: '/project/baseline/brief-v1.0.md', markdown: '# Brief\nCustomer request' },
      { path: '/project/baseline/scope-v1.0.md', markdown: '# Scope\nIn-scope work' },
      { path: '/project/baseline/quotation-draft-v1.0.md', markdown: '# Quotation\nDraft quote' },
    ]);

    expect(input.hasBrief).toBe(true);
    expect(input.hasScope).toBe(true);
    expect(input.hasQuotation).toBe(true);
    expect(input.quotationApproved).toBe(false);
  });

  it('detects approved quotation and ready scope baseline from markers', () => {
    const input = scanDocumentLifecycleFromFiles([
      {
        path: '/project/baseline/quotation-draft-v1.0.md',
        markdown: `# Quotation
<!-- quotation-approval-lock:start -->
Status: **approved**
<!-- quotation-approval-lock:end -->
<!-- scope-baseline-from-approved-quote:start -->
Status: **baseline_ready**
<!-- scope-baseline-from-approved-quote:end -->`,
      },
    ]);

    expect(input.hasQuotation).toBe(true);
    expect(input.quotationApproved).toBe(true);
    expect(input.scopeBaselineReady).toBe(true);
  });

  it('detects approved CR and change baseline from change files', () => {
    const input = scanDocumentLifecycleFromFiles([
      {
        path: '/project/changes/CR-001-draft.md',
        markdown: `# Change Request / DCR Draft
<!-- change-request-approval-lock:start -->
Status: **approved**
<!-- change-request-approval-lock:end -->
<!-- change-request-baseline:start -->
Status: **baseline_ready**
<!-- change-request-baseline:end -->`,
      },
    ]);

    expect(input.hasChangeRequest).toBe(true);
    expect(input.changeRequestApproved).toBe(true);
    expect(input.changeBaselineReady).toBe(true);
  });

  it('detects acceptance ready and signed off from acceptance files', () => {
    const ready = scanDocumentLifecycleFromFiles([
      {
        path: '/project/acceptance/ACC-001.md',
        markdown: `# Acceptance / Sign-off Artifact
<!-- acceptance-artifact:start -->
Status: **ready_for_signoff**
<!-- acceptance-artifact:end -->`,
      },
    ]);

    expect(ready.acceptanceReadyForSignoff).toBe(true);
    expect(ready.acceptanceSignedOff).toBe(false);

    const signed = scanDocumentLifecycleFromFiles([
      {
        path: '/project/acceptance/ACC-001.md',
        markdown: `# Acceptance / Sign-off Artifact
<!-- acceptance-artifact:start -->
Status: **signed_off**
<!-- acceptance-artifact:end -->`,
      },
    ]);

    expect(signed.acceptanceSignedOff).toBe(true);
  });

  it('feeds scanned files into lifecycle summary', () => {
    const input = scanDocumentLifecycleFromFiles([
      { path: '/project/baseline/brief-v1.0.md', markdown: '# Brief' },
      { path: '/project/baseline/scope-v1.0.md', markdown: '# Scope' },
      {
        path: '/project/baseline/quotation-draft-v1.0.md',
        markdown: `# Quotation
<!-- quotation-approval-lock:start -->
Status: **approved**
<!-- quotation-approval-lock:end -->
<!-- scope-baseline-from-approved-quote:start -->
Status: **baseline_ready**
<!-- scope-baseline-from-approved-quote:end -->`,
      },
      {
        path: '/project/acceptance/ACC-001.md',
        markdown: `# Acceptance / Sign-off Artifact
<!-- acceptance-artifact:start -->
Status: **signed_off**
<!-- acceptance-artifact:end -->`,
      },
    ]);

    const summary = buildDocumentLifecycleSummary(input);

    expect(summary.can_close_work).toBe(true);
    expect(summary.next_action).toContain('ปิดได้แล้ว');
  });
});
