import { ProjectDocument } from './document-scanner';

export type WorkflowStep = 'brief' | 'scope' | 'quotation' | 'approval' | 'acceptance' | 'done';

export interface WorkflowState {
  currentStep: WorkflowStep;
  nextActionLabel: string;
  nextActionDescription: string;
  targetDocumentType: string;
  missingRequiredItems: string[];
  readinessScore: number;
}

export function computeProjectWorkflow(documents: ProjectDocument[]): WorkflowState {
  const hasBrief = documents.some(d => d.type === 'brief');
  const hasScope = documents.some(d => d.type === 'scope');
  const hasQuote = documents.some(d => d.type === 'quotation');
  const hasApproval = documents.some(d => d.type === 'approval-record' || d.folder === 'approvals');
  const hasAcceptance = documents.some(d => d.folder === 'acceptance' || d.type === 'acceptance');

  let currentStep: WorkflowStep;
  let nextActionLabel: string;
  let nextActionDescription: string;
  let targetDocumentType: string;
  let missingRequiredItems: string[];
  let readinessScore: number;

  if (!hasBrief && !hasScope) {
    currentStep = 'brief';
    nextActionLabel = 'สร้างเอกสาร Brief';
    nextActionDescription = 'รวบรวมความต้องการของลูกค้าเพื่อเป็นตั้งต้นในการทำ Scope';
    targetDocumentType = 'brief';
    missingRequiredItems = ['Brief'];
    readinessScore = 0;
  } else if (!hasScope) {
    currentStep = 'scope';
    nextActionLabel = 'กำหนดขอบเขตงาน (Scope)';
    nextActionDescription = 'นำข้อมูลจาก Brief มาจัดทำเอกสารขอบเขตงาน';
    targetDocumentType = 'scope';
    missingRequiredItems = ['Scope'];
    readinessScore = 20;
  } else if (!hasQuote) {
    currentStep = 'quotation';
    nextActionLabel = 'ออกใบเสนอราคา';
    nextActionDescription = 'ประเมินราคาจากขอบเขตงานที่กำหนด';
    targetDocumentType = 'quotation';
    missingRequiredItems = ['Quotation'];
    readinessScore = 40;
  } else if (!hasApproval) {
    currentStep = 'approval';
    nextActionLabel = 'บันทึกการอนุมัติ';
    nextActionDescription = 'บันทึกหลักฐานการอนุมัติเอกสารจากลูกค้า';
    targetDocumentType = 'approval-record';
    missingRequiredItems = ['Approval Record'];
    readinessScore = 60;
  } else if (!hasAcceptance) {
    currentStep = 'acceptance';
    nextActionLabel = 'จัดทำใบส่งมอบ/ตรวจรับ';
    nextActionDescription = 'สร้างเอกสารตรวจรับงานเมื่อส่งมอบงานให้ลูกค้า';
    targetDocumentType = 'acceptance';
    missingRequiredItems = ['Acceptance'];
    readinessScore = 80;
  } else {
    currentStep = 'done';
    nextActionLabel = 'พร้อมดำเนินการ';
    nextActionDescription = 'เอกสารครบถ้วนและพร้อมใช้งาน หรือส่งออกได้ทันที';
    targetDocumentType = 'export';
    missingRequiredItems = [];
    readinessScore = 100;
  }

  return {
    currentStep,
    nextActionLabel,
    nextActionDescription,
    targetDocumentType,
    missingRequiredItems,
    readinessScore
  };
}
