import type { CustomerAnswerApplyResult } from './customerAnswerLoop';

const START_MARKER = '<!-- customer-answer-apply-loop:start -->';
const END_MARKER = '<!-- customer-answer-apply-loop:end -->';

export function buildCustomerAnswerApplyMarkdown(result: CustomerAnswerApplyResult): string {
  return `${START_MARKER}
## Customer Answer Apply Loop

> ส่วนนี้ใช้บันทึกผลการนำคำตอบลูกค้ากลับมาปิดคำถาม scope และประเมินว่าพร้อมไปสู่ quotation หรือยัง

### Answer Summary

- Confirmed: ${result.summary.confirmed_count}
- Waived: ${result.summary.waived_count}
- Still unclear: ${result.summary.still_unclear_count}
- All closed: ${result.summary.all_closed ? 'yes' : 'no'}

### Recommended Next Action

${result.recommended_next_action}

### Updated Close Loop Checklist

${result.close_loop_checklist_markdown}
${END_MARKER}`;
}

export function injectCustomerAnswerApplyMarkdown(scopeMarkdown: string, result: CustomerAnswerApplyResult): string {
  const section = buildCustomerAnswerApplyMarkdown(result);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(scopeMarkdown)) {
    return scopeMarkdown.replace(existingSectionPattern, section);
  }

  const questionLoopEnd = '<!-- customer-question-close-loop:end -->';
  if (scopeMarkdown.includes(questionLoopEnd)) {
    return scopeMarkdown.replace(questionLoopEnd, `${questionLoopEnd}\n\n${section}`);
  }

  return `${scopeMarkdown.trimEnd()}\n\n${section}\n`;
}
