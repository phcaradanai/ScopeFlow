import type { ScopeControlOutput } from './scopeControlSchema';

const SECTION_TITLE = '## Scope Control Summary';
const START_MARKER = '<!-- scope-control-summary:start -->';
const END_MARKER = '<!-- scope-control-summary:end -->';

function list(items: string[], empty = '- ยังไม่มีข้อมูล'): string {
  if (items.length === 0) return empty;
  return items.map(item => `- ${item}`).join('\n');
}

function readinessLabel(value: ScopeControlOutput['readiness_to_quote']): string {
  if (value === 'ready') return 'พร้อมเสนอราคา';
  if (value === 'risky') return 'เสนอได้แต่เสี่ยง';
  return 'ยังไม่ควรเสนอราคา';
}

export function buildScopeControlMarkdown(control: ScopeControlOutput): string {
  const totalMinHours = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_min, 0);
  const totalMaxHours = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_max, 0);

  const traps = control.scope_creep_traps.length === 0
    ? '- ยังไม่พบจุดเสี่ยงงานงอก'
    : control.scope_creep_traps.map(trap => [
      `- **${trap.item}**`,
      `  - เสี่ยงเพราะ: ${trap.why_risky}`,
      `  - วิธีจำกัด: ${trap.how_to_limit}`,
      `  - เปิด CR เมื่อ: ${trap.change_request_trigger}`,
    ].join('\n')).join('\n');

  const estimates = control.estimation_factors.length === 0
    ? '- ยังไม่มี estimation factor'
    : control.estimation_factors.map(factor => [
      `- **${factor.module}**: ${factor.estimated_man_hours_min}–${factor.estimated_man_hours_max} ชั่วโมง`,
      `  - Complexity: ${factor.complexity}`,
      `  - Risk buffer: ${factor.risk_buffer_percent}%`,
      factor.assumptions.length > 0 ? `  - Assumptions: ${factor.assumptions.join('; ')}` : '',
    ].filter(Boolean).join('\n')).join('\n');

  const acceptanceRisks = control.acceptance_risks.length === 0
    ? '- ยังไม่มี acceptance risk'
    : control.acceptance_risks.map(risk => [
      `- **${risk.scope_item}**`,
      `  - ขาด: ${risk.missing_acceptance_criteria}`,
      `  - เกณฑ์ที่แนะนำ: ${risk.suggested_acceptance_criteria}`,
    ].join('\n')).join('\n');

  return `${START_MARKER}
${SECTION_TITLE}

> ส่วนนี้สร้างจาก Scope Control Skill เพื่อช่วยล็อกขอบเขตงาน ป้องกันงานงอก และใช้ประกอบการคุย TOR/Quotation/Change Request

### Readiness to Quote

- สถานะ: **${readinessLabel(control.readiness_to_quote)}** (${control.readiness_to_quote})
- คะแนนความพร้อม: **${control.readiness_score}/100**
- คำแนะนำ: ${control.recommendation || 'ยังไม่มีคำแนะนำ'}

### Must Ask Before Quote

${list(control.must_ask_before_quote, '- ไม่มีคำถามบังคับก่อนเสนอราคา')}

### Boundary / Out-of-Scope Clauses

${list(control.suggested_boundary_clauses, '- ยังไม่มี boundary clause')}

### Scope Creep / Change Request Triggers

${traps}

### Estimation Factors / Man-hour Reasoning

- รวมโดยประมาณ: **${totalMinHours}–${totalMaxHours} ชั่วโมง**

${estimates}

### Pricing Recommendation

- Model ที่แนะนำ: **${control.cost_reasoning.suggested_pricing_model}**
- เหตุผล: ${control.cost_reasoning.why || 'ยังไม่มีเหตุผล'}

#### Pricing Blockers

${list(control.cost_reasoning.pricing_blockers, '- ไม่มีตัวขวางการเสนอราคาหลัก')}

#### Cost Drivers

${list(control.cost_reasoning.cost_drivers, '- ยังไม่มี cost driver')}

### Acceptance Risks

${acceptanceRisks}
${END_MARKER}`;
}

export function injectScopeControlMarkdown(scopeMarkdown: string, control: ScopeControlOutput): string {
  const section = buildScopeControlMarkdown(control);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(scopeMarkdown)) {
    return scopeMarkdown.replace(existingSectionPattern, section);
  }

  const trimmed = scopeMarkdown.trimEnd();
  return `${trimmed}\n\n${section}\n`;
}
