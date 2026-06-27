import { describe, expect, it } from 'vitest';
import { buildDocumentLifecycleSummary } from '../../document-lifecycle/documentLifecycle';
import { buildProjectCloseoutPack } from '../closeoutPack';

const projectPath = '/workspace/clients/client-1/projects/project-1';
const baseFiles = [
  { path: `${projectPath}/baseline/brief-v1.0.md`, markdown: '# Brief' },
  { path: `${projectPath}/baseline/scope-v1.0.md`, markdown: '# Scope' },
  {
    path: `${projectPath}/baseline/quotation-draft-v1.0.md`,
    markdown: `# Quotation
<!-- quotation-approval-lock:start -->
Status: **approved**
<!-- quotation-approval-lock:end -->
<!-- scope-baseline-from-approved-quote:start -->
Status: **baseline_ready**
<!-- scope-baseline-from-approved-quote:end -->`,
  },
  {
    path: `${projectPath}/acceptance/ACC-001.md`,
    markdown: `# Acceptance / Sign-off Artifact
<!-- acceptance-artifact:start -->
Status: **signed_off**
<!-- acceptance-artifact:end -->`,
  },
];

describe('closeoutPack', () => {
  it('builds four closeout files when lifecycle can close work', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceSignedOff: true,
    });

    const pack = buildProjectCloseoutPack({
      project_name: 'Project 1',
      project_path: projectPath,
      lifecycle_summary: summary,
      files: baseFiles,
      closeout_id: 'CLOSEOUT-001',
      closed_at: '2026-06-27',
    });

    expect(pack.can_generate).toBe(true);
    expect(pack.warnings).toHaveLength(0);
    expect(pack.files).toHaveLength(4);
    expect(pack.files.map(file => file.path)).toEqual([
      `${projectPath}/closeout/closeout-summary.md`,
      `${projectPath}/closeout/delivery-evidence.md`,
      `${projectPath}/closeout/acceptance-reference.md`,
      `${projectPath}/closeout/scope-and-change-baseline-index.md`,
    ]);
    expect(pack.files[0].markdown).toContain('Closeout ID: **CLOSEOUT-001**');
  });

  it('includes acceptance markdown snapshot in acceptance reference', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceSignedOff: true,
    });

    const pack = buildProjectCloseoutPack({
      project_name: 'Project 1',
      project_path: projectPath,
      lifecycle_summary: summary,
      files: baseFiles,
    });

    const acceptanceRef = pack.files.find(file => file.path.endsWith('acceptance-reference.md'));
    expect(acceptanceRef?.markdown).toContain('Status: **signed_off**');
    expect(acceptanceRef?.markdown).toContain('ACC-001.md');
  });

  it('blocks closeout generation when lifecycle cannot close work', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: false,
      acceptanceReadyForSignoff: true,
    });

    const pack = buildProjectCloseoutPack({
      project_name: 'Project 1',
      project_path: projectPath,
      lifecycle_summary: summary,
      files: baseFiles,
    });

    expect(pack.can_generate).toBe(false);
    expect(pack.warnings).toContain('Lifecycle ยังไม่เป็น Can Close Work จึงยังไม่ควรสร้าง closeout pack เป็นหลักฐานปิดงาน');
    expect(pack.recommended_next_action).toContain('ยังไม่ควรสร้าง');
  });

  it('warns when acceptance artifact is missing', () => {
    const summary = buildDocumentLifecycleSummary({
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceSignedOff: true,
    });

    const pack = buildProjectCloseoutPack({
      project_name: 'Project 1',
      project_path: projectPath,
      lifecycle_summary: summary,
      files: baseFiles.filter(file => !file.path.includes('/acceptance/')),
    });

    expect(pack.can_generate).toBe(false);
    expect(pack.warnings).toContain('ไม่พบ Acceptance / Sign-off Artifact สำหรับอ้างอิงการปิดงาน');
  });
});
