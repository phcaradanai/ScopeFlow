export type QuotationApprovalStatus = 'draft' | 'ready_to_send' | 'sent' | 'approved' | 'rejected' | 'revision_needed';

export interface QuotationApprovalInput {
  status: QuotationApprovalStatus;
  sent_at?: string;
  approved_at?: string;
  rejected_at?: string;
  approval_ref?: string;
  approver_name?: string;
  note?: string;
}

export interface QuotationApprovalResult extends QuotationApprovalInput {
  locked: boolean;
  can_send: boolean;
  can_revise: boolean;
  recommended_next_action: string;
  warnings: string[];
}

export function evaluateQuotationApproval(input: QuotationApprovalInput): QuotationApprovalResult {
  const warnings: string[] = [];

  if (input.status === 'sent' && !input.sent_at?.trim()) {
    warnings.push('ยังไม่ได้ระบุวันที่ส่ง quotation ให้ลูกค้า');
  }

  if (input.status === 'approved') {
    if (!input.approved_at?.trim()) warnings.push('ยังไม่ได้ระบุวันที่ลูกค้าอนุมัติ');
    if (!input.approval_ref?.trim()) warnings.push('ยังไม่ได้ระบุหลักฐานอ้างอิงการอนุมัติ');
    if (!input.approver_name?.trim()) warnings.push('ยังไม่ได้ระบุผู้อนุมัติ');
  }

  if (input.status === 'rejected' && !input.rejected_at?.trim()) {
    warnings.push('ยังไม่ได้ระบุวันที่ลูกค้าปฏิเสธ quotation');
  }

  const locked = input.status === 'approved';
  const canSend = input.status === 'ready_to_send';
  const canRevise = input.status === 'draft' || input.status === 'ready_to_send' || input.status === 'revision_needed' || input.status === 'rejected';

  const recommended_next_action = input.status === 'draft'
    ? 'ตรวจราคา เงื่อนไข ขอบเขต และ Final Quote Summary ก่อนเปลี่ยนเป็น Ready to Send'
    : input.status === 'ready_to_send'
      ? 'ส่ง quotation ให้ลูกค้าและบันทึกวันที่ส่ง/ช่องทางส่ง'
      : input.status === 'sent'
        ? 'รอลูกค้าอนุมัติ ปฏิเสธ หรือขอแก้ไข quotation'
        : input.status === 'approved'
          ? 'ล็อก quotation เป็น baseline สำหรับ scope/ราคา และใช้เป็นหลักฐานก่อนเริ่มงาน'
          : input.status === 'rejected'
            ? 'เก็บเหตุผลที่ไม่ผ่านและพิจารณาว่าจะเปิด revision หรือปิดโอกาสขาย'
            : 'แก้ไข quotation ตาม feedback แล้วตรวจซ้ำก่อนส่งใหม่';

  return {
    ...input,
    locked,
    can_send: canSend,
    can_revise: canRevise,
    recommended_next_action,
    warnings,
  };
}
