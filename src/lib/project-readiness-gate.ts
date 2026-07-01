import type { ProjectDocument } from './document-scanner';
import type { GuidedPrimaryAction } from './guided-operating-mode';

export type ProjectReadinessStage =
  | 'ready_for_brief'
  | 'ready_for_scope'
  | 'ready_for_quote'
  | 'ready_for_approval'
  | 'ready_for_delivery_acceptance'
  | 'blocked';

export type ProjectReadinessBlockerKind =
  | 'missing_brief'
  | 'weak_brief'
  | 'missing_scope'
  | 'weak_scope'
  | 'missing_quote'
  | 'quote_not_approved'
  | 'open_follow_up'
  | 'open_change_request'
  | 'missing_acceptance'
  | 'missing_approval_evidence';

export interface ProjectReadinessBlocker {
  kind: ProjectReadinessBlockerKind;
  label: string;
  reason: string;
  severity: 'info' | 'warning' | 'blocking';
  documentPath?: string;
}

export interface ProjectReadinessGateResult {
  stage: ProjectReadinessStage;
  score: number;
  headline: string;
  summary: string;
  readyLabel: string;
  blockers: ProjectReadinessBlocker[];
  primaryAction: GuidedPrimaryAction;
  canQuote: boolean;
  canDeliver: boolean;
}

const CLOSED_STATUSES = ['approved', 'accepted', 'closed', 'resolved', 'rejected', 'cancelled', 'done'];
const APPROVED_STATUSES = ['approved', 'accepted', 'signed_off', 'recorded'];
const FOLLOW_UP_CLOSED = ['answered', 'closed', 'resolved', 'cancelled', 'done'];

function docsByType(documents: ProjectDocument[], type: string) {
  return documents.filter(doc => doc.type === type);
}

function isApproved(doc?: ProjectDocument) {
  return Boolean(doc && (APPROVED_STATUSES.includes((doc.status || '').toLowerCase()) || doc.locked || doc.approval_ref));
}

function bestDoc(documents: ProjectDocument[], type: string) {
  const docs = docsByType(documents, type);
  return docs.find(isApproved) || docs.find(doc => doc.status === 'draft') || docs[0];
}

function sectionHasRealContent(markdown: string | undefined, labels: RegExp[]) {
  if (!markdown) return false;
  return labels.some(label => {
    const match = markdown.match(new RegExp(`##+\\s*.*(?:${label.source}).*\\n([\\s\\S]*?)(?=\\n##+\\s|$)`, 'i'));
    if (!match) return false;
    const section = (match[1] || '')
      .replace(/<!--[^>]*-->/g, '')
      .replace(/\|\s*[-:]+\s*/g, '')
      .replace(/[|#>*_`~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return section.length >= 12;
  });
}

function hasBriefQuality(brief?: ProjectDocument) {
  if (!brief) return false;
  const flags = brief.content_flags;
  return Boolean(flags?.hasGoal || sectionHasRealContent(brief.markdown, [/เป้าหมาย|goal|objective|overview|ความเป็นมา|ปัญหา|background/]) || (brief.markdown || '').replace(/^---[\s\S]*?---\n+/, '').trim().length > 180);
}

function hasScopeDeliverables(scope?: ProjectDocument) {
  if (!scope) return false;
  return Boolean(scope.content_flags?.hasDeliverables || sectionHasRealContent(scope.markdown, [/deliverable|ส่งมอบ|สิ่งที่จะได้|ผลลัพธ์/])) ;
}

function hasScopeAcceptance(scope?: ProjectDocument) {
  if (!scope) return false;
  return Boolean(scope.content_flags?.hasAcceptance || sectionHasRealContent(scope.markdown, [/acceptance|ตรวจรับ|criteria|เกณฑ์|ยอมรับ/])) ;
}

function hasScopeQuality(scope?: ProjectDocument) {
  if (!scope) return false;
  return hasScopeDeliverables(scope) && hasScopeAcceptance(scope);
}

function approvalDocs(documents: ProjectDocument[]) {
  return documents.filter(doc => doc.type === 'approval-record' || doc.folder === 'approvals');
}

function approvalReferences(doc: ProjectDocument, needle: string) {
  const haystack = [doc.document_type, doc.approved_document, doc.file_name, doc.title, doc.markdown].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function hasApprovalEvidenceFor(documents: ProjectDocument[], type: string, doc?: ProjectDocument) {
  if (!doc) return false;
  if (doc.approval_ref || doc.approved_by || doc.approved_date) return true;
  return approvalDocs(documents).some(approval => {
    const hasEvidence = Boolean(approval.approval_number || approval.approved_by || approval.approved_date || (approval.evidence_files && approval.evidence_files.length > 0));
    return hasEvidence && approvalReferences(approval, type);
  });
}

function openFollowUps(documents: ProjectDocument[]) {
  return documents.filter(doc => {
    const type = (doc.type || '').toLowerCase();
    if (type !== 'followup' && !doc.file_name?.toLowerCase().startsWith('fw-')) return false;
    return !FOLLOW_UP_CLOSED.includes((doc.status || '').toLowerCase());
  });
}

function openChanges(documents: ProjectDocument[]) {
  return documents.filter(doc => {
    const type = (doc.type || '').toLowerCase();
    const isChange = ['cr', 'dcr', 'change-request', 'development-change-request'].includes(type) || doc.folder === 'change-requests';
    return isChange && !CLOSED_STATUSES.includes((doc.status || '').toLowerCase());
  });
}

function makeAction(kind: GuidedPrimaryAction['kind'], label: string, description: string, documentType?: string, documentPath?: string): GuidedPrimaryAction {
  return { kind, label, description, documentType, documentPath, confidence: 'high' };
}

function scoreFromBlockers(blockers: ProjectReadinessBlocker[], base: number) {
  const score = base - blockers.reduce((sum, blocker) => sum + (blocker.severity === 'blocking' ? 15 : blocker.severity === 'warning' ? 8 : 4), 0);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildProjectReadinessGate(documents: ProjectDocument[]): ProjectReadinessGateResult {
  const brief = bestDoc(documents, 'brief');
  const scope = bestDoc(documents, 'scope');
  const quote = bestDoc(documents, 'quotation');
  const acceptance = bestDoc(documents, 'acceptance') || documents.find(doc => doc.folder === 'acceptance');
  const followUps = openFollowUps(documents);
  const changes = openChanges(documents);
  const blockers: ProjectReadinessBlocker[] = [];

  const briefReady = hasBriefQuality(brief);
  const scopeReadyForQuote = hasScopeQuality(scope);
  const quoteHasEvidence = hasApprovalEvidenceFor(documents, 'quotation', quote);
  const acceptanceHasEvidence = hasApprovalEvidenceFor(documents, 'acceptance', acceptance);

  if (!brief) {
    blockers.push({ kind: 'missing_brief', label: 'ยังไม่มี Brief', reason: 'ควรเริ่มจากคำขอลูกค้าแล้วสรุปเป็น Brief ก่อนสร้าง Scope หรือเสนอราคา', severity: 'blocking' });
  } else if (!briefReady) {
    blockers.push({ kind: 'weak_brief', label: 'Brief ยังข้อมูลไม่พอ', reason: 'Brief ยังไม่พอให้ทีมเข้าใจเป้าหมายหรือข้อมูลตั้งต้นของงาน', severity: 'warning', documentPath: brief.file_path });
  }

  if (!scope) {
    blockers.push({ kind: 'missing_scope', label: 'ยังไม่มี Scope', reason: 'ยังไม่มี Scope สำหรับคุมขอบเขตและใช้เป็นฐานใบเสนอราคา', severity: brief ? 'blocking' : 'warning' });
  } else if (!scopeReadyForQuote) {
    const missing = [!hasScopeDeliverables(scope) ? 'deliverables' : '', !hasScopeAcceptance(scope) ? 'acceptance criteria' : ''].filter(Boolean).join(' และ ');
    blockers.push({ kind: 'weak_scope', label: 'Scope ยังไม่พร้อมเสนอราคา', reason: `ยังไม่ควรเสนอราคา เพราะ Scope ยังไม่มี ${missing} ที่ชัดเจน`, severity: 'blocking', documentPath: scope.file_path });
  }

  if (!quote) {
    blockers.push({ kind: 'missing_quote', label: 'ยังไม่มีใบเสนอราคา', reason: 'เมื่อ Scope ชัดแล้ว ควรสร้างใบเสนอราคาให้ลูกค้าอนุมัติ', severity: scopeReadyForQuote ? 'blocking' : 'info' });
  } else if (!quoteHasEvidence) {
    blockers.push({ kind: 'quote_not_approved', label: 'ใบเสนอราคายังไม่มีหลักฐานอนุมัติ', reason: 'ห้ามถือว่าอนุมัติแล้วถ้ายังไม่มีหลักฐาน approval หรือ customer confirmation', severity: 'blocking', documentPath: quote.file_path });
  }

  followUps.forEach(doc => blockers.push({ kind: 'open_follow_up', label: 'ยังติดคำตอบลูกค้า', reason: 'มี Follow-up ที่ยังไม่ปิดหรือยังไม่ได้คำตอบ ควรปิดก่อนเสนอราคา/ส่งมอบถ้ากระทบ Scope', severity: 'blocking', documentPath: doc.file_path }));
  changes.forEach(doc => blockers.push({ kind: 'open_change_request', label: 'มี Change Request ที่ยังไม่ปิด', reason: 'มี CR/DCR ที่ยังไม่ปิดและอาจกระทบ Scope/Quote จึงยังไม่ควรส่งมอบ', severity: 'blocking', documentPath: doc.file_path }));

  if (!acceptance) {
    blockers.push({ kind: 'missing_acceptance', label: 'ยังไม่มีรายการส่งมอบ/ตรวจรับ', reason: 'ก่อนส่งมอบควรมี Acceptance Checklist เพื่อยืนยันสิ่งที่ส่งมอบและเงื่อนไขตรวจรับ', severity: quoteHasEvidence ? 'blocking' : 'info' });
  } else if (!acceptanceHasEvidence) {
    blockers.push({ kind: 'missing_approval_evidence', label: 'ยังไม่มีหลักฐานตรวจรับ', reason: 'ห้ามบอกว่าพร้อมปิดงานถ้ายังไม่มีหลักฐานตรวจรับหรือ customer confirmation', severity: 'warning', documentPath: acceptance.file_path });
  }

  let stage: ProjectReadinessStage;
  let headline: string;
  let summary = 'ตรวจพบรายการที่ควรจัดการก่อนขยับไปขั้นถัดไป';
  let readyLabel: string;
  let primaryAction = makeAction('start_discovery', 'เริ่มจากคำขอลูกค้า', 'สร้าง Brief จากคำขอลูกค้าก่อน', 'brief');
  let baseScore: number;

  const firstBlocker = blockers.find(blocker => blocker.severity === 'blocking') || blockers[0];

  if (!brief) {
    stage = 'ready_for_brief';
    headline = 'พร้อมเริ่มทำ Brief';
    summary = 'เริ่มจากคำขอลูกค้าก่อน เพื่อให้ Scope และใบเสนอราคาไม่เดาเอง';
    readyLabel = 'พร้อมทำ Brief';
    primaryAction = makeAction('start_discovery', 'เริ่มจากคำขอลูกค้า', 'วางข้อความลูกค้าแล้วให้ ScopeFlow ช่วยทำ Brief', 'brief');
    baseScore = 5;
  } else if (!scope) {
    stage = 'ready_for_scope';
    headline = briefReady ? 'พร้อมทำ Scope' : 'ควรเติม Brief ก่อนทำ Scope';
    summary = briefReady ? 'มี Brief แล้ว ขั้นถัดไปคือทำ Scope ให้คุมขอบเขตงาน' : 'มี Brief แล้วแต่ข้อมูลยังไม่พอ ควรถามเพิ่มก่อนทำ Scope จริง';
    readyLabel = briefReady ? 'พร้อมทำ Scope' : 'ยังไม่พร้อมทำ Scope';
    primaryAction = briefReady
      ? makeAction('create_scope_from_brief', 'สร้าง Scope จาก Brief', 'ใช้ Brief ล่าสุดสร้าง Scope ที่คุมขอบเขตได้', 'scope', brief.file_path)
      : makeAction('open_document', 'เติม Brief ให้ชัดก่อน', 'เปิด Brief เพื่อเติมข้อมูลที่ยังขาด', 'brief', brief.file_path);
    baseScore = 25;
  } else if (scopeReadyForQuote && !followUps.length && !changes.length && !quote) {
    stage = 'ready_for_quote';
    headline = 'พร้อมเสนอราคา';
    summary = 'Scope มี deliverables และ acceptance criteria ชัดพอสำหรับสร้างใบเสนอราคาแล้ว';
    readyLabel = 'พร้อมเสนอราคา';
    primaryAction = makeAction('create_document', 'สร้างใบเสนอราคา', 'สร้างใบเสนอราคาจาก Scope ที่พร้อมแล้ว', 'quotation');
    baseScore = 60;
  } else if (quote && !quoteHasEvidence) {
    stage = 'ready_for_approval';
    headline = 'รออนุมัติใบเสนอราคา';
    summary = 'มีใบเสนอราคาแล้ว แต่ยังต้องเก็บ approval/customer confirmation ก่อนเดินงานต่อ';
    readyLabel = 'พร้อมขออนุมัติ';
    primaryAction = makeAction('open_document', 'ติดตามการอนุมัติใบเสนอราคา', 'เปิดใบเสนอราคาเพื่อบันทึกสถานะหรือหลักฐานอนุมัติ', 'quotation', quote.file_path);
    baseScore = 70;
  } else if (quoteHasEvidence && !followUps.length && !changes.length && !acceptance) {
    stage = 'ready_for_delivery_acceptance';
    headline = 'พร้อมส่งมอบ/ตรวจรับ';
    summary = 'ใบเสนอราคามีหลักฐานอนุมัติแล้ว ขั้นต่อไปคือเตรียมรายการส่งมอบ/ตรวจรับ';
    readyLabel = 'พร้อมส่งมอบ';
    primaryAction = makeAction('create_document', 'เตรียมตรวจรับ/ส่งมอบ', 'สร้าง Acceptance Checklist สำหรับส่งมอบและตรวจรับ', 'acceptance');
    baseScore = 88;
  } else if (quoteHasEvidence && acceptance && acceptanceHasEvidence && !followUps.length && !changes.length) {
    stage = 'ready_for_delivery_acceptance';
    headline = 'พร้อมปิดงาน';
    summary = 'เอกสารหลักครบและมีหลักฐานอนุมัติ/ตรวจรับแล้ว';
    readyLabel = 'พร้อมส่งมอบ';
    primaryAction = makeAction('export_project', 'พร้อมส่งออกชุดเอกสาร', 'ส่งออกชุดเอกสารหลักเพื่อปิดงาน', 'export');
    baseScore = 100;
  } else {
    stage = 'blocked';
    headline = firstBlocker?.label || 'ยังติดบางอย่างก่อนเดินต่อ';
    summary = firstBlocker?.reason || summary;
    readyLabel = blockers.some(blocker => blocker.kind === 'open_follow_up') ? 'ยังติดคำตอบลูกค้า' : blockers.some(blocker => blocker.kind === 'open_change_request') ? 'มี Change Request ที่ยังไม่ปิด' : 'ยังไม่พร้อม';
    if (firstBlocker?.documentPath) {
      primaryAction = makeAction('open_document', firstBlocker.label, firstBlocker.reason, undefined, firstBlocker.documentPath);
    } else if (firstBlocker?.kind === 'missing_quote') {
      primaryAction = makeAction('create_document', 'สร้างใบเสนอราคา', firstBlocker.reason, 'quotation');
    } else if (firstBlocker?.kind === 'missing_acceptance') {
      primaryAction = makeAction('create_document', 'เตรียมตรวจรับ/ส่งมอบ', firstBlocker.reason, 'acceptance');
    }
    baseScore = quoteHasEvidence ? 82 : scopeReadyForQuote ? 58 : scope ? 40 : brief ? 25 : 5;
  }

  const canQuote = Boolean(scopeReadyForQuote && !followUps.length && !changes.length);
  const canDeliver = Boolean(quoteHasEvidence && acceptance && acceptanceHasEvidence && !followUps.length && !changes.length);

  return {
    stage,
    score: scoreFromBlockers(blockers, baseScore),
    headline,
    summary,
    readyLabel,
    blockers,
    primaryAction,
    canQuote,
    canDeliver,
  };
}
