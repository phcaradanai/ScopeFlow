import type { DocumentLifecycleInput } from './documentLifecycle';
import type { DocumentLifecycleActionTarget } from './documentLifecycleAction';

export type LifecycleCommandActionKind = 'open_document' | 'start_brief_intake' | 'create_document' | 'open_project';

export interface LifecycleCommandAction {
  kind: LifecycleCommandActionKind;
  label: string;
  guidance: string;
  file_path?: string;
  initial_type?: string;
}

export function getLifecycleCommandAction(actionTarget: DocumentLifecycleActionTarget, input: DocumentLifecycleInput): LifecycleCommandAction {
  if (actionTarget.file_path) {
    return {
      kind: 'open_document',
      label: actionTarget.label,
      guidance: actionTarget.reason,
      file_path: actionTarget.file_path,
    };
  }

  if (!input.hasBrief) {
    return {
      kind: 'start_brief_intake',
      label: 'เริ่ม Brief Intake',
      guidance: 'ยังไม่มี Brief หลัก ให้เริ่มจากรับคำขอลูกค้าเพื่อสร้าง Brief/Scope/Quotation draft ชุดแรก',
      initial_type: 'brief',
    };
  }

  if (!input.hasScope) {
    return {
      kind: 'create_document',
      label: 'สร้าง Scope Draft',
      guidance: 'มี Brief แล้ว แต่ยังไม่มี Scope Draft ให้สร้าง scope เพื่อกำหนด in-scope/out-of-scope ก่อนเสนอราคา',
      initial_type: 'scope',
    };
  }

  if (!input.hasQuotation) {
    return {
      kind: 'create_document',
      label: 'สร้าง Quotation Draft',
      guidance: 'มี Scope แล้ว แต่ยังไม่มี Quotation Draft ให้สร้างใบเสนอราคาเพื่อเข้าสู่ approval flow',
      initial_type: 'quotation',
    };
  }

  if (input.quotationApproved && !input.scopeBaselineReady) {
    return {
      kind: 'open_project',
      label: 'ตรวจ Quotation ในโปรเจกต์',
      guidance: 'Quotation approved แล้วแต่ยังหาไฟล์ quotation target ไม่เจอ ให้ตรวจเอกสารในโปรเจกต์และสร้าง Scope Baseline จาก quotation ที่ approved',
    };
  }

  if (input.changeRequestApproved && !input.changeBaselineReady) {
    return {
      kind: 'open_project',
      label: 'ตรวจ CR/DCR ในโปรเจกต์',
      guidance: 'CR/DCR approved แล้วแต่ยังหาไฟล์ CR target ไม่เจอ ให้ตรวจเอกสาร changes/ และล็อก Change Baseline',
    };
  }

  if (!input.acceptanceReadyForSignoff && !input.acceptanceSignedOff) {
    return {
      kind: 'create_document',
      label: 'สร้าง Acceptance',
      guidance: 'เอกสารหลักพร้อมระดับหนึ่งแล้ว ให้เตรียม Acceptance / Sign-off artifact เพื่อปิดรอบส่งมอบ',
      initial_type: 'acceptance',
    };
  }

  return {
    kind: 'open_project',
    label: actionTarget.label || 'เปิด Project',
    guidance: actionTarget.reason || 'ไม่มีไฟล์ target โดยตรง ให้กลับไปที่ภาพรวมโปรเจกต์และตรวจสถานะเอกสาร',
  };
}
