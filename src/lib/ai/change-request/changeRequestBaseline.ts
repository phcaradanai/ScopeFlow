import type { ChangeRequestApprovalResult } from './changeRequestApproval';
import type { ChangeRequestDocument } from './changeRequestDocument';

export interface ChangeRequestBaselineInput {
  source_change_request_path: string;
  document: ChangeRequestDocument;
  approval: ChangeRequestApprovalResult;
}

export interface ChangeRequestBaseline {
  status: 'blocked' | 'baseline_ready';
  source_change_request_path: string;
  request_id: string;
  title: string;
  approved_at?: string;
  approval_ref?: string;
  approver_name?: string;
  locked_new_request: string;
  locked_decision: ChangeRequestDocument['decision'];
  locked_impact: ChangeRequestDocument['impact'];
  locked_pricing_impact: string;
  locked_timeline_impact: string;
  locked_acceptance_impact: string;
  locked_matched_items: ChangeRequestDocument['matched_items'];
  source_quotation_path: string;
  source_scope_path: string;
  warnings: string[];
  recommended_next_action: string;
}

export function buildChangeRequestBaseline(input: ChangeRequestBaselineInput): ChangeRequestBaseline {
  const warnings = [...input.document.warnings, ...input.approval.warnings];
  const isApproved = input.approval.status === 'approved' && input.approval.locked && input.approval.can_start_work;

  if (!isApproved) {
    warnings.push('CR/DCR ยังไม่ approved พร้อมหลักฐานครบ จึงยังไม่ควรล็อก Change Baseline');
  }

  if (!input.document.is_change_request) {
    warnings.push('เอกสารนี้ไม่ได้ถูกจัดว่าเป็น change request จึงอาจไม่ต้องสร้าง Change Baseline');
  }

  const status: ChangeRequestBaseline['status'] = isApproved && input.document.is_change_request && warnings.length === 0
    ? 'baseline_ready'
    : 'blocked';

  return {
    status,
    source_change_request_path: input.source_change_request_path,
    request_id: input.document.request_id,
    title: input.document.title,
    approved_at: input.approval.approved_at,
    approval_ref: input.approval.approval_ref,
    approver_name: input.approval.approver_name,
    locked_new_request: input.document.new_request,
    locked_decision: input.document.decision,
    locked_impact: input.document.impact,
    locked_pricing_impact: input.document.pricing_impact,
    locked_timeline_impact: input.document.timeline_impact,
    locked_acceptance_impact: input.document.acceptance_impact,
    locked_matched_items: input.document.matched_items,
    source_quotation_path: input.document.source_quotation_path,
    source_scope_path: input.document.source_scope_path,
    warnings,
    recommended_next_action: status === 'baseline_ready'
      ? 'ล็อก Change Baseline นี้เป็นหลักฐานว่า scope ที่เปลี่ยนแปลงได้รับอนุมัติแล้ว และใช้เทียบกับ CR/support/acceptance รอบถัดไป'
      : 'ยังไม่ควรล็อก Change Baseline ให้ปิด approval/document warnings ก่อน',
  };
}
