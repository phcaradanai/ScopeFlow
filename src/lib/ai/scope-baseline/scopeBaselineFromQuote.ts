import type { QuotationApprovalResult } from '../quotation/quotationApproval';
import type { QuotationDraft } from '../quotation/quotationDraft';
import type { QuotationPricingResult } from '../quotation/quotationPricing';

export interface ScopeBaselineFromQuoteInput {
  quotation_path: string;
  scope_path: string;
  quotation: QuotationDraft;
  pricing: QuotationPricingResult;
  approval: QuotationApprovalResult;
}

export interface ScopeBaselineFromQuote {
  status: 'blocked' | 'baseline_ready';
  source_quotation_path: string;
  source_scope_path: string;
  locked_total: number;
  locked_currency: string;
  locked_payment_terms: string;
  locked_pricing_model: QuotationDraft['pricing_model'];
  locked_assumptions: string[];
  locked_exclusions: string[];
  locked_acceptance_criteria: string[];
  change_request_triggers: string[];
  editable_after_approval: string[];
  locked_after_approval: string[];
  approval_ref?: string;
  approved_at?: string;
  approver_name?: string;
  warnings: string[];
  recommended_next_action: string;
}

export function buildScopeBaselineFromApprovedQuote(input: ScopeBaselineFromQuoteInput): ScopeBaselineFromQuote {
  const warnings = [...input.pricing.warnings, ...input.approval.warnings];
  const isApproved = input.approval.status === 'approved' && input.approval.locked;

  if (!isApproved) {
    warnings.push('Quotation ยังไม่ approved จึงยังไม่ควรล็อก Scope Baseline');
  }

  if (input.pricing.total <= 0) {
    warnings.push('ยังไม่มี total price ที่ใช้เป็น baseline');
  }

  const status: ScopeBaselineFromQuote['status'] = isApproved && warnings.length === 0 ? 'baseline_ready' : 'blocked';

  return {
    status,
    source_quotation_path: input.quotation_path,
    source_scope_path: input.scope_path,
    locked_total: input.pricing.total,
    locked_currency: input.pricing.currency,
    locked_payment_terms: input.pricing.payment_terms,
    locked_pricing_model: input.quotation.pricing_model,
    locked_assumptions: input.quotation.assumptions,
    locked_exclusions: input.quotation.exclusions,
    locked_acceptance_criteria: input.quotation.acceptance_criteria,
    change_request_triggers: input.quotation.change_request_triggers,
    editable_after_approval: [
      'แก้ typo หรือ formatting ที่ไม่กระทบ scope/ราคา/เงื่อนไข',
      'เพิ่ม internal note หรือ reference เพิ่มเติมโดยไม่เปลี่ยนข้อตกลง',
      'แนบหลักฐาน approval เพิ่มเติม',
    ],
    locked_after_approval: [
      'รายการ deliverables และ in-scope work',
      'exclusions / boundaries',
      'ราคา total และ payment terms',
      'acceptance criteria',
      'change request triggers',
    ],
    approval_ref: input.approval.approval_ref,
    approved_at: input.approval.approved_at,
    approver_name: input.approval.approver_name,
    warnings,
    recommended_next_action: status === 'baseline_ready'
      ? 'สร้าง Scope Baseline จาก quotation ที่ approved แล้ว และใช้เป็นหลักฐานควบคุม CR/DCR ต่อไป'
      : 'ยังไม่ควรสร้าง Scope Baseline ให้ปิด quotation approval/pricing warnings ก่อน',
  };
}
