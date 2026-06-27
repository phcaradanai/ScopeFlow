import type { ChangeRequestApprovalResult } from './changeRequestApproval';

const START_MARKER = '<!-- change-request-approval-lock:start -->';
const END_MARKER = '<!-- change-request-approval-lock:end -->';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildChangeRequestApprovalMarkdown(result: ChangeRequestApprovalResult): string {
  return `${START_MARKER}
## Change Request Approval Lock

> ส่วนนี้ใช้ล็อก CR/DCR หลังลูกค้าอนุมัติแล้ว เพื่อป้องกันการเริ่มงานเปลี่ยนแปลงก่อนมีหลักฐานอนุมัติ

- Status: **${result.status}**
- Locked: **${result.locked ? 'yes' : 'no'}**
- Can Start Work: **${result.can_start_work ? 'yes' : 'no'}**
- Can Send: **${result.can_send ? 'yes' : 'no'}**
- Can Revise: **${result.can_revise ? 'yes' : 'no'}**
- Sent At: **${result.sent_at || '-'}**
- Approved At: **${result.approved_at || '-'}**
- Rejected At: **${result.rejected_at || '-'}**
- Approval Ref: **${result.approval_ref || '-'}**
- Approver: **${result.approver_name || '-'}**
- Note: ${result.note || '-'}

### Approval Warnings

${list(result.warnings, 'ไม่มี warning หลัก')}

### Recommended Next Action

${result.recommended_next_action}
${END_MARKER}`;
}

export function injectChangeRequestApprovalMarkdown(markdown: string, result: ChangeRequestApprovalResult): string {
  const section = buildChangeRequestApprovalMarkdown(result);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  if (markdown.includes('## Approval Gate')) {
    return markdown.replace('## Approval Gate', `${section}\n\n## Approval Gate`);
  }

  if (markdown.includes('## Recommended Next Action')) {
    return markdown.replace('## Recommended Next Action', `${section}\n\n## Recommended Next Action`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
