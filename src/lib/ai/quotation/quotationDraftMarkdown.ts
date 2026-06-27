import YAML from 'yaml';
import { todayISO } from '../../validation';
import type { QuotationDraft } from './quotationDraft';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

function frontmatter(data: Record<string, unknown>) {
  return `---\n${YAML.stringify(data).trim()}\n---\n\n`;
}

export function buildQuotationDraftMarkdown(draft: QuotationDraft, projectId: string, clientId: string): string {
  const today = todayISO();
  const lineItems = draft.line_items.length === 0
    ? '| - | ยังไม่มีรายการงาน | - | - | ต้องปิด scope ก่อน |'
    : draft.line_items.map((item, index) => (
      `| ${index + 1} | ${item.title} | ${item.description} | ${item.man_hours_min}–${item.man_hours_max} | ${item.pricing_note} |`
    )).join('\n');

  return frontmatter({
    type: 'quotation',
    version: '1.0',
    status: draft.status,
    source: 'ai-quotation-draft-generator',
    project: projectId,
    client: clientId,
    pricing_model: draft.pricing_model,
    created: today,
    updated: today,
    locked: false,
    sent_to_customer: false,
  }) + `# ${draft.title}\n\n` +
`> เอกสารนี้เป็น Quotation Draft สำหรับตรวจภายใน ยังไม่ใช่ใบเสนอราคาสุดท้ายจนกว่าจะใส่ราคาจริง ภาษี เงื่อนไขชำระเงิน และได้รับการตรวจทาน\n\n` +
`## Quote Status\n\n` +
`- Status: **${draft.status}**\n` +
`- Pricing Model: **${draft.pricing_model}**\n` +
`- Man-hour Range: **${draft.total_man_hours_min}–${draft.total_man_hours_max} ชั่วโมง**\n` +
`- Recommended Next Action: ${draft.recommended_next_action}\n\n` +
`## Line Items / Deliverables\n\n` +
`| # | รายการ | รายละเอียด | Man-hours | Pricing Note |\n|---|--------|------------|-----------|--------------|\n` +
`${lineItems}\n\n` +
`## Assumptions\n\n${list(draft.assumptions, 'ยังไม่มี assumption สำหรับใบเสนอราคา')}\n\n` +
`## Exclusions / Boundaries\n\n${list(draft.exclusions, 'ยังไม่มี exclusion/boundary')}\n\n` +
`## Change Request Triggers\n\n${list(draft.change_request_triggers, 'ยังไม่มี CR trigger')}\n\n` +
`## Acceptance Criteria\n\n${list(draft.acceptance_criteria, 'ยังไม่มี acceptance criteria')}\n\n` +
`## Pricing Blockers\n\n${list(draft.pricing_blockers, 'ไม่มี pricing blocker หลัก')}\n\n` +
`## Customer Confirmations Required\n\n${list(draft.customer_confirmations_required, 'ไม่มีรายการที่ต้องยืนยันเพิ่มก่อนส่ง quote')}\n\n` +
`## Internal Notes\n\n${list(draft.internal_notes, 'ไม่มี note ภายใน')}\n`;
}
