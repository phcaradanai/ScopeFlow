import type { QuoteReadinessBrief } from './quoteReadinessBridge';

const START_MARKER = '<!-- quotation-readiness-brief:start -->';
const END_MARKER = '<!-- quotation-readiness-brief:end -->';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildQuoteReadinessMarkdown(brief: QuoteReadinessBrief): string {
  const estimates = brief.module_estimates.length === 0
    ? '- ยังไม่มี module estimate'
    : brief.module_estimates.map(item => [
      `- **${item.module}**: ${item.estimated_man_hours_min}–${item.estimated_man_hours_max} ชั่วโมง`,
      `  - Complexity: ${item.complexity}`,
      `  - Risk buffer: ${item.risk_buffer_percent}%`,
      item.assumptions.length > 0 ? `  - Assumptions: ${item.assumptions.join('; ')}` : '',
    ].filter(Boolean).join('\n')).join('\n');

  return `${START_MARKER}
## Quotation Readiness Brief

> ส่วนนี้ใช้เป็นสะพานจาก Scope ที่ปิดแล้วไปสู่ Quotation Draft โดยยังไม่สร้างราคาสุดท้ายแทนมนุษย์

- สถานะ: **${brief.status}**
- Readiness Score: **${brief.readiness_score}/100**
- Pricing Model ที่แนะนำ: **${brief.recommended_pricing_model}**
- Man-hour รวมโดยประมาณ: **${brief.total_man_hours_min}–${brief.total_man_hours_max} ชั่วโมง**
- Next Action: ${brief.recommended_next_action}

### Module / Deliverable Estimates

${estimates}

### Pricing Blockers

${list(brief.pricing_blockers, 'ไม่มี pricing blocker หลัก')}

### Quote Assumptions

${list(brief.quote_assumptions, 'ยังไม่มี assumption สำหรับใบเสนอราคา')}

### Boundary Clauses To Attach To Quote

${list(brief.quote_boundary_clauses, 'ยังไม่มี boundary clause')}

### Change Request Triggers

${list(brief.change_request_triggers, 'ยังไม่มี CR trigger')}

### Acceptance Items

${list(brief.acceptance_items, 'ยังไม่มี acceptance item')}
${END_MARKER}`;
}

export function injectQuoteReadinessMarkdown(scopeMarkdown: string, brief: QuoteReadinessBrief): string {
  const section = buildQuoteReadinessMarkdown(brief);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(scopeMarkdown)) {
    return scopeMarkdown.replace(existingSectionPattern, section);
  }

  const answerLoopEnd = '<!-- customer-answer-apply-loop:end -->';
  if (scopeMarkdown.includes(answerLoopEnd)) {
    return scopeMarkdown.replace(answerLoopEnd, `${answerLoopEnd}\n\n${section}`);
  }

  const questionLoopEnd = '<!-- customer-question-close-loop:end -->';
  if (scopeMarkdown.includes(questionLoopEnd)) {
    return scopeMarkdown.replace(questionLoopEnd, `${questionLoopEnd}\n\n${section}`);
  }

  return `${scopeMarkdown.trimEnd()}\n\n${section}\n`;
}
