import type { ScopeClosureGateResult } from './scopeClosureGate';

const START_MARKER = '<!-- scope-closure-gate:start -->';
const END_MARKER = '<!-- scope-closure-gate:end -->';

function statusLabel(status: ScopeClosureGateResult['scope_closure_status']): string {
  if (status === 'locked') return 'ล็อก Scope แล้ว';
  if (status === 'ready_for_quote') return 'พร้อมทำ Quotation';
  if (status === 'needs_customer_answers') return 'ต้องรอคำตอบลูกค้า';
  return 'ยังเปิดอยู่';
}

function checkbox(value: boolean, label: string): string {
  return `- [${value ? 'x' : ' '}] ${label}`;
}

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildScopeClosureMarkdown(result: ScopeClosureGateResult): string {
  return `${START_MARKER}
## Scope Closure Gate

> ส่วนนี้ใช้ตรวจว่า Scope จบพอสำหรับเสนอราคา/ล็อก baseline แล้วหรือยัง

- สถานะ: **${statusLabel(result.scope_closure_status)}** (${result.scope_closure_status})
- คะแนนความพร้อมปิด Scope: **${result.closure_score}/100**
- Next Action: ${result.recommended_next_action}
- Quote-ready Summary: ${result.quote_ready_summary}

### Closure Checklist

${checkbox(result.checklist.has_confirmed_scope, 'มี confirmed/assumed scope item สำหรับตั้งต้น')}
${checkbox(result.checklist.has_no_critical_questions, 'คำถามสำคัญก่อนเสนอราคาถูกตอบหรือ waive แล้ว')}
${checkbox(result.checklist.has_boundary_clauses, 'มี boundary / out-of-scope clause')}
${checkbox(result.checklist.has_acceptance_criteria, 'มี acceptance criteria หรือ acceptance risk ที่ใช้ตรวจรับได้')}
${checkbox(result.checklist.has_estimation_factors, 'มี estimation factor / man-hour reasoning')}
${checkbox(result.checklist.has_pricing_model, 'มี pricing model recommendation')}
${checkbox(result.checklist.has_customer_approval, 'มี customer approval สำหรับ lock baseline')}

### Blocking Items

${list(result.blocking_items, 'ไม่มี blocking item หลัก')}

### Customer Questions To Close Scope

${list(result.customer_questions, 'ไม่มีคำถามค้างก่อนปิด Scope')}
${END_MARKER}`;
}

export function injectScopeClosureMarkdown(scopeMarkdown: string, result: ScopeClosureGateResult): string {
  const section = buildScopeClosureMarkdown(result);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(scopeMarkdown)) {
    return scopeMarkdown.replace(existingSectionPattern, section);
  }

  const scopeControlEnd = '<!-- scope-control-summary:end -->';
  if (scopeMarkdown.includes(scopeControlEnd)) {
    return scopeMarkdown.replace(scopeControlEnd, `${scopeControlEnd}\n\n${section}`);
  }

  return `${scopeMarkdown.trimEnd()}\n\n${section}\n`;
}
