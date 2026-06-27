import type { ScopeBaselineFromQuote } from '../scope-baseline/scopeBaselineFromQuote';
import type { ChangeRequestDetectionResult } from './changeRequestDetection';

export interface ChangeRequestDocumentInput {
  request_id?: string;
  title?: string;
  new_request: string;
  baseline: ScopeBaselineFromQuote;
  detection: ChangeRequestDetectionResult;
  requested_by?: string;
  requested_at?: string;
}

export interface ChangeRequestDocument {
  request_id: string;
  title: string;
  status: 'draft' | 'needs_review' | 'approval_required' | 'not_required';
  new_request: string;
  source_quotation_path: string;
  source_scope_path: string;
  approval_ref?: string;
  decision: ChangeRequestDetectionResult['decision'];
  impact: ChangeRequestDetectionResult['impact'];
  is_change_request: boolean;
  requested_by?: string;
  requested_at?: string;
  matched_items: ChangeRequestDetectionResult['matched'];
  pricing_impact: string;
  timeline_impact: string;
  acceptance_impact: string;
  approval_required_before_work: boolean;
  recommended_next_action: string;
  warnings: string[];
}

function fallbackRequestId(): string {
  return `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`;
}

export function buildChangeRequestDocument(input: ChangeRequestDocumentInput): ChangeRequestDocument {
  const approvalRequired = input.detection.is_change_request || input.detection.decision === 'likely_change_request';
  const status: ChangeRequestDocument['status'] = approvalRequired
    ? 'approval_required'
    : input.detection.decision === 'needs_review'
      ? 'needs_review'
      : 'not_required';

  return {
    request_id: input.request_id?.trim() || fallbackRequestId(),
    title: input.title?.trim() || 'Change Request / DCR Draft',
    status,
    new_request: input.new_request.trim(),
    source_quotation_path: input.baseline.source_quotation_path,
    source_scope_path: input.baseline.source_scope_path,
    approval_ref: input.baseline.approval_ref,
    decision: input.detection.decision,
    impact: input.detection.impact,
    is_change_request: input.detection.is_change_request,
    requested_by: input.requested_by?.trim() || undefined,
    requested_at: input.requested_at?.trim() || undefined,
    matched_items: input.detection.matched,
    pricing_impact: input.detection.pricing_impact,
    timeline_impact: input.detection.timeline_impact,
    acceptance_impact: input.detection.acceptance_impact,
    approval_required_before_work: approvalRequired,
    recommended_next_action: approvalRequired
      ? 'ต้องให้ลูกค้าอนุมัติ CR/DCR ก่อนเริ่มงานส่วนนี้ เพื่อไม่ให้ scope/ราคา/เวลาไหลจาก baseline เดิม'
      : input.detection.recommended_next_action,
    warnings: input.detection.warnings,
  };
}

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildChangeRequestDocumentMarkdown(document: ChangeRequestDocument): string {
  const matchedItems = document.matched_items.length === 0
    ? '- ไม่พบรายการ baseline ที่ match ชัดเจน'
    : document.matched_items
      .map(item => `- **${item.source}**: ${item.matched_text}\n  - เหตุผล: ${item.reason}`)
      .join('\n');

  return `# ${document.title}

## CR Metadata

- Request ID: **${document.request_id}**
- Status: **${document.status}**
- Requested By: **${document.requested_by || '-'}**
- Requested At: **${document.requested_at || '-'}**
- Approval Required Before Work: **${document.approval_required_before_work ? 'yes' : 'no'}**

## New Customer Request

${document.new_request || '-'}

## Baseline Reference

- Source Quotation: **${document.source_quotation_path}**
- Source Scope: **${document.source_scope_path}**
- Baseline Approval Ref: **${document.approval_ref || '-'}**

## Detection Summary

- Decision: **${document.decision}**
- Is Change Request: **${document.is_change_request ? 'yes' : 'no'}**
- Impact: **${document.impact}**

## Matched Baseline Items

${matchedItems}

## Impact Assessment

- Pricing Impact: ${document.pricing_impact}
- Timeline Impact: ${document.timeline_impact}
- Acceptance Impact: ${document.acceptance_impact}

## Approval Gate

${document.approval_required_before_work
  ? 'งานส่วนนี้ **ยังไม่ควรเริ่ม** จนกว่าลูกค้าจะอนุมัติ CR/DCR และราคา/เวลาที่ปรับแล้ว'
  : 'ยังไม่พบเหตุที่ต้องเปิด CR/DCR แต่ควรเก็บหลักฐานคำขอไว้ใน project history'}

## Warnings

${list(document.warnings, 'ไม่มี warning หลัก')}

## Recommended Next Action

${document.recommended_next_action}
`;
}
