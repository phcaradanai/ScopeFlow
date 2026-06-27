import type { ChangeRequestDetectionResult } from './changeRequestDetection';

const START_MARKER = '<!-- change-request-detection:start -->';
const END_MARKER = '<!-- change-request-detection:end -->';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildChangeRequestDetectionMarkdown(newRequest: string, result: ChangeRequestDetectionResult): string {
  const matches = result.matched.length === 0
    ? '- ไม่พบรายการ baseline ที่ match ชัดเจน'
    : result.matched.map(item => `- **${item.source}**: ${item.matched_text}\n  - เหตุผล: ${item.reason}`).join('\n');

  return `${START_MARKER}
## Change Request Detection

> ตรวจคำขอใหม่ของลูกค้าเทียบกับ Scope Baseline ที่อนุมัติแล้ว

### New Customer Request

${newRequest.trim() || '-'}

### Decision

- Decision: **${result.decision}**
- Is Change Request: **${result.is_change_request ? 'yes' : 'no'}**
- Impact: **${result.impact}**

### Matched Baseline Items

${matches}

### Possible In-Scope Reasons

${list(result.possible_in_scope_reasons, 'ยังไม่มีเหตุผลว่าอยู่ใน scope เดิมอย่างชัดเจน')}

### Impact Summary

- Pricing: ${result.pricing_impact}
- Timeline: ${result.timeline_impact}
- Acceptance: ${result.acceptance_impact}

### Warnings

${list(result.warnings, 'ไม่มี warning หลัก')}

### Recommended Next Action

${result.recommended_next_action}
${END_MARKER}`;
}

export function injectChangeRequestDetectionMarkdown(markdown: string, section: string): string {
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  const baselineEnd = '<!-- scope-baseline-from-approved-quote:end -->';
  if (markdown.includes(baselineEnd)) {
    return markdown.replace(baselineEnd, `${baselineEnd}\n\n${section}`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
