import { describe, expect, it } from 'vitest';
import { buildDocumentLifecycleSummary } from '../documentLifecycle';
import { getProjectLifecyclePriority } from '../documentLifecyclePriority';

const projectPath = '/workspace/clients/client-1/projects/project-1';
const closeoutFiles = [
  { path: `${projectPath}/closeout/closeout-summary.md`, markdown: '# Summary' },
  { path: `${projectPath}/closeout/delivery-evidence.md`, markdown: '# Evidence' },
  { path: `${projectPath}/closeout/acceptance-reference.md`, markdown: '# Acceptance' },
  { path: `${projectPath}/closeout/scope-and-change-baseline-index.md`, markdown: '# Baseline' },
];

describe('documentLifecyclePriority', () => {
  it('prioritizes export ready projects lowest because no action is needed', () => {
    const summary = buildDocumentLifecycleSummary({ acceptanceSignedOff: true });
    const priority = getProjectLifecyclePriority(summary, [
      ...closeoutFiles,
      { path: `${projectPath}/exports/closeout-package-index.md`, markdown: '# Export' },
    ]);

    expect(priority.category).toBe('export_ready');
    expect(priority.label).toBe('Export Ready');
    expect(priority.score).toBe(10);
  });

  it('detects closeout ready projects before can close', () => {
    const summary = buildDocumentLifecycleSummary({ acceptanceSignedOff: true });
    const priority = getProjectLifecyclePriority(summary, closeoutFiles);

    expect(priority.category).toBe('closeout_ready');
    expect(priority.reason).toContain('export index');
  });

  it('detects can close projects when signed off but no closeout pack exists', () => {
    const summary = buildDocumentLifecycleSummary({ acceptanceSignedOff: true });
    const priority = getProjectLifecyclePriority(summary, []);

    expect(priority.category).toBe('can_close');
    expect(priority.label).toBe('Can Close');
  });

  it('detects blocked projects', () => {
    const summary = buildDocumentLifecycleSummary({ hasQuotation: true, quotationApproved: true, scopeBaselineReady: false });
    const priority = getProjectLifecyclePriority(summary, []);

    expect(priority.category).toBe('blocked');
    expect(priority.reason).toContain('blocker');
  });

  it('detects missing docs projects', () => {
    const summary = buildDocumentLifecycleSummary({});
    const priority = getProjectLifecyclePriority(summary, []);

    expect(priority.category).toBe('missing_docs');
    expect(priority.label).toBe('Missing Docs');
  });
});
