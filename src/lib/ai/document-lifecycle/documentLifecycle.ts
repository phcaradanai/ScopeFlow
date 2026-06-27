export type LifecycleItemStatus = 'missing' | 'draft' | 'ready' | 'approved' | 'blocked' | 'signed_off';

export interface DocumentLifecycleInput {
  hasBrief?: boolean;
  hasScope?: boolean;
  hasQuotation?: boolean;
  quotationApproved?: boolean;
  scopeBaselineReady?: boolean;
  hasChangeRequest?: boolean;
  changeRequestApproved?: boolean;
  changeBaselineReady?: boolean;
  acceptanceReadyForSignoff?: boolean;
  acceptanceSignedOff?: boolean;
}

export interface DocumentLifecycleItem {
  id: string;
  label: string;
  status: LifecycleItemStatus;
  recommended_next_action: string;
}

export interface DocumentLifecycleSummary {
  items: DocumentLifecycleItem[];
  can_close_work: boolean;
  blocked_count: number;
  ready_count: number;
  missing_count: number;
  next_action: string;
}

function item(id: string, label: string, status: LifecycleItemStatus, recommended_next_action: string): DocumentLifecycleItem {
  return { id, label, status, recommended_next_action };
}

export function buildDocumentLifecycleSummary(input: DocumentLifecycleInput): DocumentLifecycleSummary {
  const items: DocumentLifecycleItem[] = [
    item(
      'brief',
      'Brief Draft',
      input.hasBrief ? 'ready' : 'missing',
      input.hasBrief ? 'ใช้ brief เป็นฐานในการตรวจ scope/quote ต่อไป' : 'สร้าง Brief Draft จากคำขอลูกค้าก่อน'
    ),
    item(
      'scope',
      'Scope Draft',
      input.hasScope ? 'ready' : 'missing',
      input.hasScope ? 'ตรวจ scope control และ scope closure ก่อนเสนอราคา' : 'สร้าง Scope Draft เพื่อกำหนด in-scope/out-of-scope'
    ),
    item(
      'quotation',
      'Quotation Approval',
      input.quotationApproved ? 'approved' : input.hasQuotation ? 'draft' : 'missing',
      input.quotationApproved ? 'ใช้ quotation ที่ approved เป็นฐานล็อก scope/ราคา' : input.hasQuotation ? 'ส่ง quotation ให้ลูกค้าอนุมัติและบันทึก approval evidence' : 'สร้าง Quotation Draft หลัง scope พร้อม'
    ),
    item(
      'scope_baseline',
      'Scope Baseline',
      input.scopeBaselineReady ? 'ready' : input.quotationApproved ? 'blocked' : 'missing',
      input.scopeBaselineReady ? 'ใช้ Scope Baseline ตรวจ CR/DCR และ acceptance' : input.quotationApproved ? 'สร้าง Scope Baseline จาก quotation ที่ approved แล้ว' : 'ต้องมี quotation approved ก่อนสร้าง Scope Baseline'
    ),
    item(
      'change_request',
      'CR/DCR',
      input.changeRequestApproved ? 'approved' : input.hasChangeRequest ? 'draft' : 'missing',
      input.changeRequestApproved ? 'ใช้ CR/DCR ที่ approved สร้าง Change Baseline' : input.hasChangeRequest ? 'รอลูกค้าอนุมัติ CR/DCR ก่อนเริ่มงานเปลี่ยนแปลง' : 'ยังไม่มี CR/DCR หรือยังไม่จำเป็นต้องเปิด'
    ),
    item(
      'change_baseline',
      'Change Baseline',
      input.changeBaselineReady ? 'ready' : input.changeRequestApproved ? 'blocked' : 'missing',
      input.changeBaselineReady ? 'ใช้ Change Baseline เป็นหลักฐานงานที่เปลี่ยนแปลงแล้ว' : input.changeRequestApproved ? 'สร้าง Change Baseline จาก CR/DCR ที่ approved แล้ว' : 'ต้องมี CR/DCR approved ก่อนสร้าง Change Baseline'
    ),
    item(
      'acceptance',
      'Acceptance / Sign-off',
      input.acceptanceSignedOff ? 'signed_off' : input.acceptanceReadyForSignoff ? 'ready' : 'draft',
      input.acceptanceSignedOff ? 'ปิดรอบงานได้ ใช้เอกสาร acceptance เป็นหลักฐานส่งมอบ' : input.acceptanceReadyForSignoff ? 'ส่ง acceptance ให้ลูกค้า sign-off' : 'เตรียม delivered items และ acceptance criteria ให้ครบก่อนส่ง sign-off'
    ),
  ];

  const blockedCount = items.filter(doc => doc.status === 'blocked').length;
  const readyCount = items.filter(doc => doc.status === 'ready' || doc.status === 'approved' || doc.status === 'signed_off').length;
  const missingCount = items.filter(doc => doc.status === 'missing').length;
  const canCloseWork = Boolean(input.acceptanceSignedOff && blockedCount === 0);
  const firstBlocked = items.find(doc => doc.status === 'blocked');
  const firstMissingRequired = items.find(doc => doc.id !== 'change_request' && doc.id !== 'change_baseline' && doc.status === 'missing');
  const nextAction = canCloseWork
    ? 'งานรอบนี้ปิดได้แล้ว เพราะ Acceptance ถูก sign-off และไม่มี blocker หลัก'
    : firstBlocked?.recommended_next_action || firstMissingRequired?.recommended_next_action || items.find(doc => doc.status === 'draft')?.recommended_next_action || 'ตรวจเอกสารรอบนี้และอัปเดตสถานะให้ครบ';

  return {
    items,
    can_close_work: canCloseWork,
    blocked_count: blockedCount,
    ready_count: readyCount,
    missing_count: missingCount,
    next_action: nextAction,
  };
}
