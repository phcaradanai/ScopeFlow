import type { QuoteReadinessBrief } from '../quotation-readiness/quoteReadinessBridge';

export type QuotationDraftStatus = 'draft_blocked' | 'draft_needs_review' | 'draft_ready';

export interface QuotationDraftLineItem {
  title: string;
  description: string;
  man_hours_min: number;
  man_hours_max: number;
  pricing_note: string;
}

export interface QuotationDraft {
  status: QuotationDraftStatus;
  title: string;
  pricing_model: QuoteReadinessBrief['recommended_pricing_model'];
  line_items: QuotationDraftLineItem[];
  total_man_hours_min: number;
  total_man_hours_max: number;
  assumptions: string[];
  exclusions: string[];
  change_request_triggers: string[];
  acceptance_criteria: string[];
  pricing_blockers: string[];
  customer_confirmations_required: string[];
  internal_notes: string[];
  recommended_next_action: string;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function toDraftStatus(readiness: QuoteReadinessBrief): QuotationDraftStatus {
  if (readiness.status === 'ready') return 'draft_ready';
  if (readiness.status === 'needs_review') return 'draft_needs_review';
  return 'draft_blocked';
}

export function buildQuotationDraft(projectName: string, readiness: QuoteReadinessBrief): QuotationDraft {
  const lineItems = readiness.module_estimates.map(item => ({
    title: item.module,
    description: `ดำเนินงานส่วน ${item.module} ตาม scope, assumptions และ acceptance criteria ที่ตกลง`,
    man_hours_min: item.estimated_man_hours_min,
    man_hours_max: item.estimated_man_hours_max,
    pricing_note: `ยังไม่ใส่ราคาจริง — ใช้ ${item.estimated_man_hours_min}–${item.estimated_man_hours_max} ชั่วโมง และ risk buffer ${item.risk_buffer_percent}% เป็นฐานให้ผู้ใช้ตรวจ`,
  }));

  const status = toDraftStatus(readiness);
  const customerConfirmationsRequired = unique([
    ...readiness.pricing_blockers,
    ...readiness.quote_assumptions.map(item => `ยืนยัน assumption: ${item}`),
    ...readiness.quote_boundary_clauses.map(item => `ยอมรับ boundary: ${item}`),
  ]);

  const internalNotes = unique([
    `Readiness status: ${readiness.status}`,
    `Readiness score: ${readiness.readiness_score}/100`,
    `Pricing model: ${readiness.recommended_pricing_model}`,
    readiness.status !== 'ready' ? 'ยังไม่ควรส่งเป็นใบเสนอราคาจริงจนกว่า blocker จะถูกปิด' : '',
  ]);

  const recommendedNextAction = status === 'draft_ready'
    ? 'ตรวจราคา/ภาษี/เงื่อนไขชำระเงิน แล้วแปลงเป็นใบเสนอราคาสำหรับส่งลูกค้า'
    : status === 'draft_needs_review'
      ? 'ใช้ draft นี้เป็น internal quotation worksheet ก่อน ต้องปิด pricing blockers ก่อนส่งลูกค้า'
      : 'ยังไม่ควรสร้างใบเสนอราคาส่งลูกค้า ให้กลับไปปิด Scope/คำถาม/Blockers ก่อน';

  return {
    status,
    title: `Quotation Draft: ${projectName}`,
    pricing_model: readiness.recommended_pricing_model,
    line_items: lineItems,
    total_man_hours_min: readiness.total_man_hours_min,
    total_man_hours_max: readiness.total_man_hours_max,
    assumptions: readiness.quote_assumptions,
    exclusions: readiness.quote_boundary_clauses,
    change_request_triggers: readiness.change_request_triggers,
    acceptance_criteria: readiness.acceptance_items,
    pricing_blockers: readiness.pricing_blockers,
    customer_confirmations_required: customerConfirmationsRequired,
    internal_notes: internalNotes,
    recommended_next_action: recommendedNextAction,
  };
}
