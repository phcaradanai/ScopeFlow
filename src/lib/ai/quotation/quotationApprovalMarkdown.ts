import type { QuotationApprovalResult } from './quotationApproval';

const START_MARKER = '<!-- quotation-approval-lock:start -->';
const END_MARKER = '<!-- quotation-approval-lock:end -->';

function line(label: string, value: string | undefined): string {
  return `- ${label}: **${value?.trim() || '-'}**`;
}

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildQuotationApprovalMarkdown(result: QuotationApprovalResult): string {
  return `${START_MARKER}
## Quotation Approval Lock

> ส่วนนี้ใช้ติดตามสถานะใบเสนอราคาและล็อก baseline เมื่อได้รับอนุมัติจากลูกค้า

${line('Status', result.status)}
${line('Locked', result.locked ? 'yes' : 'no')}
${line('Sent At', result.sent_at)}
${line('Approved At', result.approved_at)}
${line('Rejected At', result.rejected_at)}
${line('Approval Ref', result.approval_ref)}
${line('Approver', result.approver_name)}
${line('Note', result.note)}

### Recommended Next Action

${result.recommended_next_action}

### Approval Warnings

${list(result.warnings, 'ไม่มี warning หลัก')}
${END_MARKER}`;
}

export function injectQuotationApprovalMarkdown(markdown: string, result: QuotationApprovalResult): string {
  const section = buildQuotationApprovalMarkdown(result);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  const finalQuoteSummaryEnd = '<!-- final-quote-summary:end -->';
  if (markdown.includes(finalQuoteSummaryEnd)) {
    return markdown.replace(finalQuoteSummaryEnd, `${finalQuoteSummaryEnd}\n\n${section}`);
  }

  const quoteStatusHeading = '## Quote Status';
  if (markdown.includes(quoteStatusHeading)) {
    return markdown.replace(quoteStatusHeading, `${section}\n\n${quoteStatusHeading}`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
