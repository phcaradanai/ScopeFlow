import type { ChangeRequestBaseline } from './changeRequestBaseline';

const START_MARKER = '<!-- change-request-baseline:start -->';
const END_MARKER = '<!-- change-request-baseline:end -->';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildChangeRequestBaselineMarkdown(baseline: ChangeRequestBaseline): string {
  const matchedItems = baseline.locked_matched_items.length === 0
    ? '- ไม่พบรายการ baseline ที่ match ชัดเจน'
    : baseline.locked_matched_items
      .map(item => `- **${item.source}**: ${item.matched_text}\n  - เหตุผล: ${item.reason}`)
      .join('\n');

  return `${START_MARKER}
## Change Baseline From Approved CR/DCR

> ส่วนนี้ใช้ล็อก scope ที่เปลี่ยนแปลง หลัง CR/DCR ได้รับอนุมัติแล้ว

- Status: **${baseline.status}**
- Request ID: **${baseline.request_id}**
- Source CR/DCR: **${baseline.source_change_request_path}**
- Source Quotation: **${baseline.source_quotation_path}**
- Source Scope: **${baseline.source_scope_path}**
- Approved At: **${baseline.approved_at || '-'}**
- Approval Ref: **${baseline.approval_ref || '-'}**
- Approver: **${baseline.approver_name || '-'}**

### Locked Change Request

${baseline.locked_new_request || '-'}

### Locked Decision

- Decision: **${baseline.locked_decision}**
- Impact: **${baseline.locked_impact}**

### Locked Impact

- Pricing Impact: ${baseline.locked_pricing_impact}
- Timeline Impact: ${baseline.locked_timeline_impact}
- Acceptance Impact: ${baseline.locked_acceptance_impact}

### Locked Matched Baseline Items

${matchedItems}

### Change Baseline Warnings

${list(baseline.warnings, 'ไม่มี warning หลัก')}

### Recommended Next Action

${baseline.recommended_next_action}
${END_MARKER}`;
}

export function injectChangeRequestBaselineMarkdown(markdown: string, baseline: ChangeRequestBaseline): string {
  const section = buildChangeRequestBaselineMarkdown(baseline);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  if (markdown.includes('<!-- change-request-approval-lock:end -->')) {
    return markdown.replace('<!-- change-request-approval-lock:end -->', `<!-- change-request-approval-lock:end -->\n\n${section}`);
  }

  if (markdown.includes('## Recommended Next Action')) {
    return markdown.replace('## Recommended Next Action', `${section}\n\n## Recommended Next Action`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
