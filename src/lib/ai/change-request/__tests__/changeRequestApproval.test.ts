import { describe, expect, it } from 'vitest';
import { evaluateChangeRequestApproval } from '../changeRequestApproval';
import { buildChangeRequestApprovalMarkdown, injectChangeRequestApprovalMarkdown } from '../changeRequestApprovalMarkdown';

describe('changeRequestApproval', () => {
  it('locks approved CR/DCR and allows work only when approval evidence is complete', () => {
    const result = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });

    expect(result.locked).toBe(true);
    expect(result.can_start_work).toBe(true);
    expect(result.can_send).toBe(false);
    expect(result.can_revise).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it('does not allow work when approved evidence is incomplete', () => {
    const result = evaluateChangeRequestApproval({ status: 'approved' });

    expect(result.locked).toBe(true);
    expect(result.can_start_work).toBe(false);
    expect(result.warnings).toContain('ยังไม่ได้ระบุวันที่ลูกค้าอนุมัติ CR/DCR');
    expect(result.warnings).toContain('ยังไม่ได้ระบุหลักฐานอ้างอิงการอนุมัติ CR/DCR');
    expect(result.warnings).toContain('ยังไม่ได้ระบุผู้อนุมัติ CR/DCR');
  });

  it('allows send only when ready to send', () => {
    const result = evaluateChangeRequestApproval({ status: 'ready_to_send' });

    expect(result.can_send).toBe(true);
    expect(result.can_revise).toBe(true);
    expect(result.can_start_work).toBe(false);
  });

  it('warns when sent without sent date', () => {
    const result = evaluateChangeRequestApproval({ status: 'sent' });

    expect(result.warnings).toContain('ยังไม่ได้ระบุวันที่ส่ง CR/DCR ให้ลูกค้า');
    expect(result.can_start_work).toBe(false);
  });

  it('renders approval lock markdown', () => {
    const result = evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    });
    const markdown = buildChangeRequestApprovalMarkdown(result);

    expect(markdown).toContain('## Change Request Approval Lock');
    expect(markdown).toContain('Can Start Work: **yes**');
    expect(markdown).toContain('Approval Ref: **signed CR-001**');
  });

  it('injects approval lock before approval gate', () => {
    const result = evaluateChangeRequestApproval({ status: 'ready_to_send' });
    const markdown = '# CR\n\n## Approval Gate\n\nPending approval';
    const injected = injectChangeRequestApprovalMarkdown(markdown, result);

    expect(injected.indexOf('## Change Request Approval Lock')).toBeLessThan(injected.indexOf('## Approval Gate'));
  });

  it('replaces existing approval lock instead of duplicating it', () => {
    const first = injectChangeRequestApprovalMarkdown('# CR', evaluateChangeRequestApproval({ status: 'ready_to_send' }));
    const second = injectChangeRequestApprovalMarkdown(first, evaluateChangeRequestApproval({
      status: 'approved',
      approved_at: '2026-06-27',
      approval_ref: 'signed CR-001',
      approver_name: 'Client Owner',
    }));

    expect(second.match(/## Change Request Approval Lock/g)?.length).toBe(1);
    expect(second).toContain('Status: **approved**');
    expect(second).toContain('Can Start Work: **yes**');
  });
});
