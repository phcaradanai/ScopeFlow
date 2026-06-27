import { describe, expect, it } from 'vitest';
import { buildAcceptanceArtifact } from '../acceptanceArtifact';
import { buildAcceptanceArtifactMarkdown, injectAcceptanceArtifactMarkdown } from '../acceptanceArtifactMarkdown';

describe('acceptanceArtifact', () => {
  it('builds ready-for-signoff artifact when all criteria passed and no blockers', () => {
    const artifact = buildAcceptanceArtifact({
      artifact_id: 'ACC-001',
      source_scope_baseline_path: 'baseline/quotation-draft-v1.0.md',
      delivered_items: ['Checkout payment flow', 'Admin order list'],
      acceptance_criteria: [
        { criteria: 'checkout สำเร็จด้วย payment gateway ที่ตกลงไว้', status: 'passed', evidence: 'UAT-001' },
      ],
    });

    expect(artifact.status).toBe('ready_for_signoff');
    expect(artifact.signoff_required).toBe(true);
    expect(artifact.can_close_work).toBe(false);
    expect(artifact.warnings).toHaveLength(0);
  });

  it('builds signed-off artifact when signoff evidence is complete', () => {
    const artifact = buildAcceptanceArtifact({
      artifact_id: 'ACC-001',
      source_scope_baseline_path: 'baseline/quotation-draft-v1.0.md',
      delivered_items: ['Checkout payment flow'],
      acceptance_criteria: [
        { criteria: 'checkout สำเร็จด้วย payment gateway ที่ตกลงไว้', status: 'passed', evidence: 'UAT-001' },
      ],
      signoff_by: 'Client Owner',
      signoff_at: '2026-06-27',
      signoff_ref: 'signed acceptance email',
    });

    expect(artifact.status).toBe('signed_off');
    expect(artifact.can_close_work).toBe(true);
    expect(artifact.recommended_next_action).toContain('sign-off แล้ว');
  });

  it('blocks artifact when criteria failed', () => {
    const artifact = buildAcceptanceArtifact({
      source_scope_baseline_path: 'baseline/scope-v1.0.md',
      delivered_items: ['Checkout payment flow'],
      acceptance_criteria: [
        { criteria: 'checkout สำเร็จ', status: 'failed', evidence: 'UAT-FAIL-001' },
      ],
    });

    expect(artifact.status).toBe('blocked');
    expect(artifact.signoff_required).toBe(false);
    expect(artifact.warnings).toContain('มี acceptance criteria ที่ failed ต้องแก้ก่อน sign-off');
  });

  it('blocks artifact when CR/DCR is required', () => {
    const artifact = buildAcceptanceArtifact({
      source_scope_baseline_path: 'baseline/scope-v1.0.md',
      delivered_items: ['Checkout payment flow'],
      acceptance_criteria: [
        { criteria: 'checkout สำเร็จ', status: 'passed' },
      ],
      change_request_required_items: ['เพิ่ม mobile app ต้องเปิด CR/DCR'],
    });

    expect(artifact.status).toBe('blocked');
    expect(artifact.warnings).toContain('มีรายการที่ควรเปิด CR/DCR ก่อนรวมเป็นงานที่รับมอบ');
  });

  it('renders markdown artifact', () => {
    const artifact = buildAcceptanceArtifact({
      artifact_id: 'ACC-001',
      source_scope_baseline_path: 'baseline/scope-v1.0.md',
      source_change_baseline_paths: ['changes/CR-001-draft.md'],
      delivered_items: ['Checkout payment flow'],
      acceptance_criteria: [
        { criteria: 'checkout สำเร็จ', status: 'passed', evidence: 'UAT-001' },
      ],
    });

    const markdown = buildAcceptanceArtifactMarkdown(artifact);

    expect(markdown).toContain('# Acceptance / Sign-off Artifact');
    expect(markdown).toContain('Artifact ID: **ACC-001**');
    expect(markdown).toContain('changes/CR-001-draft.md');
    expect(markdown).toContain('| checkout สำเร็จ | passed | UAT-001 | - |');
  });

  it('replaces existing acceptance artifact section instead of duplicating it', () => {
    const artifact = buildAcceptanceArtifact({
      artifact_id: 'ACC-001',
      source_scope_baseline_path: 'baseline/scope-v1.0.md',
      delivered_items: ['Checkout payment flow'],
      acceptance_criteria: [{ criteria: 'checkout สำเร็จ', status: 'passed' }],
    });

    const first = injectAcceptanceArtifactMarkdown('# Acceptance File', artifact);
    const second = injectAcceptanceArtifactMarkdown(first, artifact);

    expect(second.match(/# Acceptance \/ Sign-off Artifact/g)?.length).toBe(1);
  });
});
