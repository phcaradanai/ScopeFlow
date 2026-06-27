export type ChangeRequestApprovalStatus = 'draft' | 'ready_to_send' | 'sent' | 'approved' | 'rejected' | 'revision_needed';

export interface ChangeRequestApprovalInput {
  status: ChangeRequestApprovalStatus;
  sent_at?: string;
  approved_at?: string;
  rejected_at?: string;
  approval_ref?: string;
  approver_name?: string;
  note?: string;
}

export interface ChangeRequestApprovalResult extends ChangeRequestApprovalInput {
  locked: boolean;
  can_start_work: boolean;
  can_send: boolean;
  can_revise: boolean;
  recommended_next_action: string;
  warnings: string[];
}

export function evaluateChangeRequestApproval(input: ChangeRequestApprovalInput): ChangeRequestApprovalResult {
  const warnings: string[] = [];

  if (input.status === 'sent' && !input.sent_at?.trim()) {
    warnings.push('ยังไม่ได้ระบุวันที่ส่ง CR/DCR ให้ลูกค้า');
  }

  if (input.status === 'approved') {
    if (!input.approved_at?.trim()) warnings.push('ยังไม่ได้ระบุวันที่ลูกค้าอนุมัติ CR/DCR');
    if (!input.approval_ref?.trim()) warnings.push('ยังไม่ได้ระบุหลักฐานอ้างอิงการอนุมัติ CR/DCR');
    if (!input.approver_name?.trim()) warnings.push('ยังไม่ได้ระบุผู้อนุมัติ CR/DCR');
  }

  if (input.status === 'rejected' && !input.rejected_at?.trim()) {
    warnings.push('ยังไม่ได้ระบุวันที่ลูกค้าปฏิเสธ CR/DCR');
  }

  const locked = input.status === 'approved';
  const canStartWork = input.status === 'approved' && warnings.length === 0;
  const canSend = input.status === 'ready_to_send';
  const canRevise = input.status === 'draft' || input.status === 'ready_to_send' || input.status === 'revision_needed' || input.status === 'rejected';

  const recommended_next_action = input.status === 'draft'
    ? 'ตรวจผลกระทบราคา เวลา ขอบเขต และ approval gate ก่อนเปลี่ยนเป็น Ready to Send'
    : input.status === 'ready_to_send'
      ? 'ส่ง CR/DCR ให้ลูกค้าและบันทึกวันที่ส่ง/ช่องทางส่ง'
      : input.status === 'sent'
        ? 'รอลูกค้าอนุมัติ ปฏิเสธ หรือขอแก้ไข CR/DCR'
        : input.status === 'approved'
          ? 'ล็อก CR/DCR เป็น Change Baseline และเริ่มงานส่วนเปลี่ยนแปลงได้เฉพาะเมื่อข้อมูลอนุมัติครบ'
          : input.status === 'rejected'
            ? 'ห้ามเริ่มงานส่วนเปลี่ยนแปลง เก็บเหตุผลที่ไม่ผ่าน และพิจารณาว่าจะเปิด revision หรือปิด CR/DCR'
            : 'แก้ไข CR/DCR ตาม feedback แล้วตรวจซ้ำก่อนส่งใหม่';

  return {
    ...input,
    locked,
    can_start_work: canStartWork,
    can_send: canSend,
    can_revise: canRevise,
    recommended_next_action,
    warnings,
  };
}
