import type { ScopeBaselineFromQuote } from './scopeBaselineFromQuote';

const START_MARKER = '<!-- scope-baseline-from-approved-quote:start -->';
const END_MARKER = '<!-- scope-baseline-from-approved-quote:end -->';

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildScopeBaselineMarkdown(baseline: ScopeBaselineFromQuote): string {
  return `${START_MARKER}
## Scope Baseline From Approved Quote

> ส่วนนี้ใช้ล็อก scope/ราคา/เงื่อนไข หลัง quotation ได้รับอนุมัติจากลูกค้าแล้ว

- Status: **${baseline.status}**
- Source Quotation: **${baseline.source_quotation_path}**
- Source Scope: **${baseline.source_scope_path}**
- Locked Total: **${money(baseline.locked_total, baseline.locked_currency)}**
- Pricing Model: **${baseline.locked_pricing_model}**
- Payment Terms: ${baseline.locked_payment_terms || '-'}
- Approved At: **${baseline.approved_at || '-'}**
- Approval Ref: **${baseline.approval_ref || '-'}**
- Approver: **${baseline.approver_name || '-'}**

### Locked Assumptions

${list(baseline.locked_assumptions, 'ไม่มี assumption ที่ล็อกไว้')}

### Locked Exclusions / Boundaries

${list(baseline.locked_exclusions, 'ไม่มี exclusion/boundary ที่ล็อกไว้')}

### Locked Acceptance Criteria

${list(baseline.locked_acceptance_criteria, 'ไม่มี acceptance criteria ที่ล็อกไว้')}

### Change Request Triggers

${list(baseline.change_request_triggers, 'ไม่มี CR trigger ที่ล็อกไว้')}

### Editable After Approval

${list(baseline.editable_after_approval, 'ไม่มีรายการที่แก้ได้หลังอนุมัติ')}

### Locked After Approval

${list(baseline.locked_after_approval, 'ไม่มีรายการที่ล็อกหลังอนุมัติ')}

### Baseline Warnings

${list(baseline.warnings, 'ไม่มี warning หลัก')}

### Recommended Next Action

${baseline.recommended_next_action}
${END_MARKER}`;
}

export function injectScopeBaselineMarkdown(markdown: string, baseline: ScopeBaselineFromQuote): string {
  const section = buildScopeBaselineMarkdown(baseline);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  const approvalLockEnd = '<!-- quotation-approval-lock:end -->';
  if (markdown.includes(approvalLockEnd)) {
    return markdown.replace(approvalLockEnd, `${approvalLockEnd}\n\n${section}`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
