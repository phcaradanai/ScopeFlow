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

function isApproved(doc: ProjectDocument) {
  return doc.status === 'approved' || doc.locked;
}

function hasApprovalEvidence(documents: ProjectDocument[], documentType?: string) {
  const approvals = documents.filter(d => d.type === 'approval-record' || d.folder === 'approvals');
  if (!documentType) return approvals.length > 0;
  return approvals.some(d => d.document_type === documentType || d.file_name.toLowerCase().includes(documentType));
}

function bestDoc(documents: ProjectDocument[], type: string) {
  const docs = documents.filter(d => d.type === type);
  return docs.find(isApproved) || docs[0];
}

export function computeProjectWorkflow(documents: ProjectDocument[]): WorkflowState {
  const brief = bestDoc(documents, 'brief');
  const scope = bestDoc(documents, 'scope');
  const quote = bestDoc(documents, 'quotation');
  const acceptance = bestDoc(documents, 'acceptance') || documents.find(d => d.folder === 'acceptance');

  const hasBrief = !!brief;
  const hasScope = !!scope;
  const hasQuote = !!quote;
  const hasAcceptance = !!acceptance;
  const hasAnyApproval = hasApprovalEvidence(documents);
  const hasScopeApproval = hasApprovalEvidence(documents, 'scope') || !!scope?.approval_ref;
  const hasQuoteApproval = hasApprovalEvidence(documents, 'quotation') || !!quote?.approval_ref;
  const hasAcceptanceApproval = hasApprovalEvidence(documents, 'acceptance') || !!acceptance?.approval_ref;

  if (!hasBrief && !hasScope) {
    return {
      currentStep: 'brief',
      nextActionLabel: 'เริ่มจากคำขอลูกค้า',
      nextActionDescription: 'วางคำขอลูกค้าเพื่อสร้าง Brief แรก แล้วใช้เป็นฐานในการทำ Scope',
      targetDocumentType: 'brief',
      missingRequiredItems: ['Brief'],
      readinessScore: 0,
    };
  }

  if (hasBrief && !isApproved(brief)) {
    return {
      currentStep: 'brief',
      nextActionLabel: 'ตรวจและอนุมัติ Brief',
      nextActionDescription: 'Brief ยังเป็นฉบับร่าง ควรตรวจความต้องการหลักและคำถามค้างก่อนใช้ทำ Scope',
      targetDocumentType: 'brief',
      missingRequiredItems: ['Approved Brief'],
      readinessScore: 15,
    };
  }

  if (!hasScope) {
    return {
      currentStep: 'scope',
      nextActionLabel: 'สร้าง Scope จาก Brief',
      nextActionDescription: 'นำ Brief ที่ชัดแล้วมาจัดทำขอบเขตงาน In-Scope, Out-of-Scope, Deliverables และ Acceptance Criteria',
      targetDocumentType: 'scope',
      missingRequiredItems: ['Scope'],
      readinessScore: 25,
    };
  }

  if (!isApproved(scope)) {
    return {
      currentStep: 'scope',
      nextActionLabel: 'ตรวจ Scope ให้พร้อมส่งลูกค้า',
      nextActionDescription: 'Scope ยังไม่อนุมัติ ควรตรวจขอบเขตงาน สิ่งที่ไม่รวม และเงื่อนไขตรวจรับให้ชัดเจน',
      targetDocumentType: 'scope',
      missingRequiredItems: ['Approved Scope'],
      readinessScore: 40,
    };
  }

  if (!hasQuote) {
    return {
      currentStep: 'quotation',
      nextActionLabel: 'ออกใบเสนอราคา',
      nextActionDescription: 'ใช้ Scope ที่อนุมัติแล้วเป็นฐานในการประเมินราคาและเงื่อนไขการชำระเงิน',
      targetDocumentType: 'quotation',
      missingRequiredItems: ['Quotation'],
      readinessScore: 55,
    };
  }

  if (!isApproved(quote)) {
    return {
      currentStep: 'quotation',
      nextActionLabel: 'ติดตาม/ยืนยันใบเสนอราคา',
      nextActionDescription: 'มีใบเสนอราคาแล้ว แต่ยังไม่อนุมัติหรือยังไม่ล็อก ควรติดตามการยืนยันจากลูกค้า',
      targetDocumentType: 'approval-record',
      missingRequiredItems: ['Approved Quotation'],
      readinessScore: 65,
    };
  }

  if (!hasAnyApproval || !hasScopeApproval || !hasQuoteApproval) {
    const missing = [];
    if (!hasScopeApproval) missing.push('Scope Approval Evidence');
    if (!hasQuoteApproval) missing.push('Quotation Approval Evidence');
    if (missing.length === 0) missing.push('Approval Record');

    return {
      currentStep: 'approval',
      nextActionLabel: 'บันทึกหลักฐานการอนุมัติ',
      nextActionDescription: 'เอกสารสำคัญควรมี Approval Record หรือ approval_ref เพื่อใช้ตรวจสอบย้อนหลังและกันข้อโต้แย้ง',
      targetDocumentType: 'approval-record',
      missingRequiredItems: missing,
      readinessScore: 75,
    };
  }

  if (!hasAcceptance) {
    return {
      currentStep: 'acceptance',
      nextActionLabel: 'จัดทำใบส่งมอบ/ตรวจรับ',
      nextActionDescription: 'เมื่อ Scope และ Quote ได้รับอนุมัติแล้ว ให้สร้างเอกสารตรวจรับเพื่อปิดงานอย่างเป็นทางการ',
      targetDocumentType: 'acceptance',
      missingRequiredItems: ['Acceptance'],
      readinessScore: 85,
    };
  }

  if (!isApproved(acceptance) || !hasAcceptanceApproval) {
    return {
      currentStep: 'acceptance',
      nextActionLabel: 'ปิดงานด้วยการตรวจรับ',
      nextActionDescription: 'Acceptance ยังไม่อนุมัติหรือยังไม่มีหลักฐาน ควรบันทึกผลตรวจรับและ evidence ก่อนส่งออกชุดเอกสาร',
      targetDocumentType: 'approval-record',
      missingRequiredItems: ['Approved Acceptance', 'Acceptance Evidence'],
      readinessScore: 92,
    };
  }

  return {
    currentStep: 'done',
    nextActionLabel: 'พร้อม Export / ส่งมอบ',
    nextActionDescription: 'เอกสารสำคัญครบ มีหลักฐานอนุมัติและตรวจรับแล้ว สามารถส่งออกชุดเอกสารเพื่อปิดงานได้',
    targetDocumentType: 'export',
    missingRequiredItems: [],
    readinessScore: 100,
  };
}
