export type AcceptanceArtifactStatus = 'draft' | 'ready_for_signoff' | 'signed_off' | 'blocked';

export interface AcceptanceCriteriaCheck {
  criteria: string;
  status: 'passed' | 'pending' | 'failed' | 'not_applicable';
  evidence?: string;
  note?: string;
}

export interface AcceptanceArtifactInput {
  artifact_id?: string;
  title?: string;
  source_scope_baseline_path: string;
  source_change_baseline_paths?: string[];
  delivered_items: string[];
  acceptance_criteria: AcceptanceCriteriaCheck[];
  pending_items?: string[];
  out_of_scope_items?: string[];
  change_request_required_items?: string[];
  signoff_by?: string;
  signoff_at?: string;
  signoff_ref?: string;
}

export interface AcceptanceArtifact {
  artifact_id: string;
  title: string;
  status: AcceptanceArtifactStatus;
  source_scope_baseline_path: string;
  source_change_baseline_paths: string[];
  delivered_items: string[];
  acceptance_criteria: AcceptanceCriteriaCheck[];
  pending_items: string[];
  out_of_scope_items: string[];
  change_request_required_items: string[];
  signoff_by?: string;
  signoff_at?: string;
  signoff_ref?: string;
  passed_count: number;
  pending_count: number;
  failed_count: number;
  signoff_required: boolean;
  can_close_work: boolean;
  warnings: string[];
  recommended_next_action: string;
}

function fallbackArtifactId(): string {
  return `ACC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`;
}

export function buildAcceptanceArtifact(input: AcceptanceArtifactInput): AcceptanceArtifact {
  const warnings: string[] = [];
  const passedCount = input.acceptance_criteria.filter(item => item.status === 'passed').length;
  const pendingCount = input.acceptance_criteria.filter(item => item.status === 'pending').length + (input.pending_items?.length || 0);
  const failedCount = input.acceptance_criteria.filter(item => item.status === 'failed').length;
  const crRequiredCount = input.change_request_required_items?.length || 0;
  const hasSignoff = Boolean(input.signoff_by?.trim() && input.signoff_at?.trim() && input.signoff_ref?.trim());

  if (!input.source_scope_baseline_path.trim()) {
    warnings.push('ยังไม่ได้ระบุ Scope Baseline ที่ใช้อ้างอิงการรับงาน');
  }

  if (input.delivered_items.length === 0) {
    warnings.push('ยังไม่ได้ระบุรายการส่งมอบ');
  }

  if (input.acceptance_criteria.length === 0) {
    warnings.push('ยังไม่ได้ระบุ acceptance criteria สำหรับตรวจรับ');
  }

  if (failedCount > 0) {
    warnings.push('มี acceptance criteria ที่ failed ต้องแก้ก่อน sign-off');
  }

  if (crRequiredCount > 0) {
    warnings.push('มีรายการที่ควรเปิด CR/DCR ก่อนรวมเป็นงานที่รับมอบ');
  }

  const signoffRequired = pendingCount === 0 && failedCount === 0 && crRequiredCount === 0 && input.delivered_items.length > 0 && input.acceptance_criteria.length > 0;
  const canCloseWork = signoffRequired && hasSignoff && warnings.length === 0;

  const status: AcceptanceArtifactStatus = canCloseWork
    ? 'signed_off'
    : warnings.length > 0 || failedCount > 0 || crRequiredCount > 0
      ? 'blocked'
      : signoffRequired
        ? 'ready_for_signoff'
        : 'draft';

  return {
    artifact_id: input.artifact_id?.trim() || fallbackArtifactId(),
    title: input.title?.trim() || 'Acceptance / Sign-off Artifact',
    status,
    source_scope_baseline_path: input.source_scope_baseline_path,
    source_change_baseline_paths: input.source_change_baseline_paths || [],
    delivered_items: input.delivered_items,
    acceptance_criteria: input.acceptance_criteria,
    pending_items: input.pending_items || [],
    out_of_scope_items: input.out_of_scope_items || [],
    change_request_required_items: input.change_request_required_items || [],
    signoff_by: input.signoff_by?.trim() || undefined,
    signoff_at: input.signoff_at?.trim() || undefined,
    signoff_ref: input.signoff_ref?.trim() || undefined,
    passed_count: passedCount,
    pending_count: pendingCount,
    failed_count: failedCount,
    signoff_required: signoffRequired,
    can_close_work: canCloseWork,
    warnings,
    recommended_next_action: canCloseWork
      ? 'งานรอบนี้ถูก sign-off แล้ว สามารถปิดรอบส่งมอบและใช้เอกสารนี้เป็นหลักฐาน acceptance ได้'
      : signoffRequired
        ? 'พร้อมส่งให้ลูกค้า sign-off ก่อนถือว่างานรอบนี้ปิดสมบูรณ์'
        : status === 'blocked'
          ? 'ยังไม่ควรส่ง sign-off ให้ปิด failed/pending/CR-required items ก่อน'
          : 'เติมรายการส่งมอบและ acceptance criteria ให้ครบก่อนส่ง sign-off',
  };
}
