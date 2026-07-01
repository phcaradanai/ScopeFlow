import type { ProjectDocument } from './document-scanner';

export type GuidedStageKey = 'request' | 'brief' | 'scope' | 'quotation' | 'approval' | 'change_control' | 'acceptance';
export type GuidedStageStatus = 'missing' | 'draft' | 'ready' | 'approved' | 'attention' | 'done';
export type GuidedPrimaryActionKind =
  | 'start_discovery'
  | 'open_document'
  | 'create_scope_from_brief'
  | 'create_document'
  | 'record_approval'
  | 'create_change_request'
  | 'export_project';

export interface GuidedStage {
  key: GuidedStageKey;
  label: string;
  shortLabel: string;
  description: string;
  status: GuidedStageStatus;
  document?: ProjectDocument;
  count: number;
}

export interface GuidedPrimaryAction {
  kind: GuidedPrimaryActionKind;
  label: string;
  description: string;
  documentType?: string;
  documentPath?: string;
  confidence: 'high' | 'medium' | 'needs_review';
}

export interface GuidedOperatingModeState {
  stages: GuidedStage[];
  primaryAction: GuidedPrimaryAction;
  readinessScore: number;
  headline: string;
  summary: string;
  blockers: string[];
  secondaryActions: GuidedPrimaryAction[];
}

function isApproved(doc?: ProjectDocument) {
  return Boolean(doc && (doc.status === 'approved' || doc.locked || doc.approval_ref));
}

function byType(documents: ProjectDocument[], type: string) {
  return documents.filter(doc => doc.type === type);
}

function bestDoc(documents: ProjectDocument[], type: string) {
  const docs = byType(documents, type);
  return docs.find(isApproved) || docs.find(doc => doc.status === 'draft') || docs[0];
}

function hasApprovalFor(documents: ProjectDocument[], type: string) {
  const approvals = documents.filter(doc => doc.type === 'approval-record' || doc.folder === 'approvals');
  return approvals.some(doc => {
    const haystack = [doc.document_type, doc.approved_document, doc.file_name, doc.markdown].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(type.toLowerCase());
  });
}

function hasOpenChange(documents: ProjectDocument[]) {
  return documents.some(doc => ['cr', 'dcr'].includes(doc.type) && !['approved', 'rejected', 'closed'].includes(doc.status));
}

function stageStatus(doc: ProjectDocument | undefined, missingStatus: GuidedStageStatus = 'missing'): GuidedStageStatus {
  if (!doc) return missingStatus;
  if (isApproved(doc)) return 'approved';
  if (doc.status === 'ready' || doc.status === 'ready_for_signoff' || doc.status === 'baseline_ready') return 'ready';
  if (doc.status === 'rejected' || doc.status === 'blocked') return 'attention';
  return 'draft';
}

function makeStage(
  key: GuidedStageKey,
  label: string,
  shortLabel: string,
  description: string,
  status: GuidedStageStatus,
  docs: ProjectDocument[],
  document?: ProjectDocument
): GuidedStage {
  return { key, label, shortLabel, description, status, count: docs.length, document };
}

export function buildGuidedOperatingModeState(documents: ProjectDocument[]): GuidedOperatingModeState {
  const briefDocs = byType(documents, 'brief');
  const scopeDocs = byType(documents, 'scope');
  const quotationDocs = byType(documents, 'quotation');
  const acceptanceDocs = byType(documents, 'acceptance').concat(documents.filter(doc => doc.folder === 'acceptance' && doc.type !== 'acceptance'));
  const approvalDocs = documents.filter(doc => doc.type === 'approval-record' || doc.folder === 'approvals');
  const changeDocs = documents.filter(doc => ['cr', 'dcr'].includes(doc.type) || doc.folder === 'change-requests');

  const brief = bestDoc(documents, 'brief');
  const scope = bestDoc(documents, 'scope');
  const quotation = bestDoc(documents, 'quotation');
  const acceptance = bestDoc(documents, 'acceptance') || acceptanceDocs[0];

  const hasBrief = Boolean(brief);
  const hasScope = Boolean(scope);
  const hasQuotation = Boolean(quotation);
  const hasAcceptance = Boolean(acceptance);
  const scopeApproved = isApproved(scope) || hasApprovalFor(documents, 'scope');
  const quotationApproved = isApproved(quotation) || hasApprovalFor(documents, 'quotation');
  const acceptanceApproved = isApproved(acceptance) || hasApprovalFor(documents, 'acceptance');
  const hasChangeAttention = hasOpenChange(documents);

  const stages: GuidedStage[] = [
    makeStage('request', 'Customer Request', 'Request', 'เริ่มจากข้อความจริงของลูกค้า ไม่ใช่เริ่มจากไฟล์เปล่า', hasBrief ? 'done' : 'missing', [], brief),
    makeStage('brief', 'Brief', 'Brief', 'สรุปความต้องการ เป้าหมาย และคำถามค้างให้ชัดก่อนคุม scope', stageStatus(brief), briefDocs, brief),
    makeStage('scope', 'Scope', 'Scope', 'กำหนด In/Out scope, deliverables และ acceptance criteria', stageStatus(scope), scopeDocs, scope),
    makeStage('quotation', 'Quotation', 'Quote', 'เสนอราคาโดยอิง scope ที่ชัด ไม่ประเมินจากคำขอคลุมเครือ', stageStatus(quotation), quotationDocs, quotation),
    makeStage('approval', 'Approval Evidence', 'Approval', 'เก็บหลักฐานอนุมัติไว้กัน scope creep และข้อโต้แย้ง', scopeApproved && quotationApproved ? 'approved' : approvalDocs.length > 0 ? 'ready' : 'missing', approvalDocs, approvalDocs[0]),
    makeStage('change_control', 'Change Control', 'Change', 'เมื่อมีงานเพิ่มหรือเปลี่ยน ให้เข้า CR/DCR แทนการแก้ scope เงียบ ๆ', hasChangeAttention ? 'attention' : changeDocs.length > 0 ? 'ready' : 'missing', changeDocs, changeDocs[0]),
    makeStage('acceptance', 'Acceptance', 'Accept', 'เตรียมตรวจรับและปิดงานอย่างเป็นทางการ', acceptanceApproved ? 'approved' : stageStatus(acceptance), acceptanceDocs, acceptance),
  ];

  let primaryAction: GuidedPrimaryAction;
  const secondaryActions: GuidedPrimaryAction[] = [];
  const blockers: string[] = [];
  let readinessScore = 0;

  if (!hasBrief) {
    primaryAction = {
      kind: 'start_discovery',
      label: 'เริ่มจากคำขอลูกค้า',
      description: 'วางข้อความลูกค้า แล้วให้ระบบช่วยถามต่อจนพร้อมสร้าง Brief',
      documentType: 'brief',
      confidence: 'high',
    };
    blockers.push('ยังไม่มี Brief ที่ใช้เป็นฐานของงาน');
  } else if (!hasScope) {
    primaryAction = {
      kind: 'create_scope_from_brief',
      label: 'สร้าง Scope จาก Brief',
      description: 'ใช้ Brief ล่าสุดสร้าง Scope โดยไม่ต้องไปเปิด markdown เอง',
      documentType: 'scope',
      documentPath: brief?.file_path,
      confidence: 'high',
    };
    readinessScore = 20;
    blockers.push('มี Brief แล้ว แต่ยังไม่มี Scope สำหรับคุมขอบเขต');
    secondaryActions.push({
      kind: 'open_document',
      label: 'เปิด Brief เพื่อตรวจ',
      description: 'ดูรายละเอียด Brief ก่อนสร้าง Scope',
      documentPath: brief?.file_path,
      confidence: 'medium',
    });
  } else if (!scopeApproved) {
    primaryAction = {
      kind: 'open_document',
      label: 'ตรวจ Scope ให้พร้อมอนุมัติ',
      description: 'เปิด Scope เพื่อตรวจ In/Out scope และบันทึก approval เมื่อพร้อม',
      documentType: 'scope',
      documentPath: scope?.file_path,
      confidence: 'medium',
    };
    readinessScore = 40;
    blockers.push('Scope ยังไม่ถูกอนุมัติหรือยังไม่มีหลักฐาน');
  } else if (!hasQuotation) {
    primaryAction = {
      kind: 'create_document',
      label: 'ออกใบเสนอราคา',
      description: 'สร้าง Quotation จาก Scope ที่พร้อมแล้ว',
      documentType: 'quotation',
      confidence: 'high',
    };
    readinessScore = 55;
    blockers.push('ยังไม่มี Quotation สำหรับเสนอราคา');
  } else if (!quotationApproved) {
    primaryAction = {
      kind: 'open_document',
      label: 'ติดตาม/ยืนยันใบเสนอราคา',
      description: 'เปิด Quotation เพื่อบันทึกสถานะหรือหลักฐานอนุมัติ',
      documentType: 'quotation',
      documentPath: quotation?.file_path,
      confidence: 'medium',
    };
    readinessScore = 70;
    blockers.push('Quotation ยังไม่อนุมัติหรือยังไม่มีหลักฐาน');
  } else if (hasChangeAttention) {
    primaryAction = {
      kind: 'create_change_request',
      label: 'จัดการ Change Request ที่ค้าง',
      description: 'มี CR/DCR ที่ยังไม่ปิด ควรจัดการก่อนตรวจรับหรือส่งมอบ',
      documentType: 'cr',
      documentPath: changeDocs.find(doc => !['approved', 'rejected', 'closed'].includes(doc.status))?.file_path,
      confidence: 'needs_review',
    };
    readinessScore = 75;
    blockers.push('มี Change Request หรือ DCR ที่ยังไม่ปิด');
  } else if (!hasAcceptance) {
    primaryAction = {
      kind: 'create_document',
      label: 'เตรียมตรวจรับงาน',
      description: 'สร้าง Acceptance Checklist เพื่อปิดงานตาม scope ที่อนุมัติแล้ว',
      documentType: 'acceptance',
      confidence: 'high',
    };
    readinessScore = 85;
    blockers.push('ยังไม่มีเอกสารตรวจรับ/ส่งมอบ');
  } else if (!acceptanceApproved) {
    primaryAction = {
      kind: 'open_document',
      label: 'ปิดงานด้วยการตรวจรับ',
      description: 'เปิด Acceptance เพื่อบันทึกผลตรวจรับและหลักฐาน',
      documentType: 'acceptance',
      documentPath: acceptance?.file_path,
      confidence: 'medium',
    };
    readinessScore = 92;
    blockers.push('Acceptance ยังไม่อนุมัติหรือยังไม่มีหลักฐาน');
  } else {
    primaryAction = {
      kind: 'export_project',
      label: 'พร้อมส่งออกชุดเอกสาร',
      description: 'เอกสารหลักครบและมีหลักฐานสำคัญแล้ว สามารถส่งมอบ/ปิดงานได้',
      documentType: 'export',
      confidence: 'high',
    };
    readinessScore = 100;
  }

  if (scope && !hasChangeAttention) {
    secondaryActions.push({
      kind: 'create_change_request',
      label: 'บันทึก Change Request',
      description: 'ใช้เมื่อมีคำขอใหม่ที่กระทบ scope หรือราคาเดิม',
      documentType: 'cr',
      confidence: 'medium',
    });
  }

  return {
    stages,
    primaryAction,
    readinessScore,
    headline: primaryAction.label,
    summary: primaryAction.description,
    blockers,
    secondaryActions,
  };
}
