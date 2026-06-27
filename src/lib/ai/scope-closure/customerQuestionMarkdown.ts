import type { CustomerQuestionPack } from './customerQuestionLoop';

const START_MARKER = '<!-- customer-question-close-loop:start -->';
const END_MARKER = '<!-- customer-question-close-loop:end -->';

export function buildCustomerQuestionLoopMarkdown(pack: CustomerQuestionPack): string {
  return `${START_MARKER}
## Customer Question Close Loop

> ส่วนนี้ใช้ติดตามคำถามที่ต้องส่งให้ลูกค้า และใช้คำตอบกลับมาเปลี่ยน Scope จาก still unclear → confirmed / waived เพื่อพาไปสู่ ready-for-quote

### Message To Customer

**Subject:** ${pack.subject}

${pack.message}

### Close Loop Checklist

${pack.closeLoopChecklistMarkdown}
${END_MARKER}`;
}

export function injectCustomerQuestionLoopMarkdown(scopeMarkdown: string, pack: CustomerQuestionPack): string {
  const section = buildCustomerQuestionLoopMarkdown(pack);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(scopeMarkdown)) {
    return scopeMarkdown.replace(existingSectionPattern, section);
  }

  const closureGateEnd = '<!-- scope-closure-gate:end -->';
  if (scopeMarkdown.includes(closureGateEnd)) {
    return scopeMarkdown.replace(closureGateEnd, `${closureGateEnd}\n\n${section}`);
  }

  return `${scopeMarkdown.trimEnd()}\n\n${section}\n`;
}
