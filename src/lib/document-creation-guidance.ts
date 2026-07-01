export type DocumentTypeId =
  | 'scope'
  | 'quotation'
  | 'invoice'
  | 'cr'
  | 'dcr'
  | 'sup'
  | 'ma'
  | 'acceptance'
  | 'revision'
  | 'followup';

export type DocumentCreationIntentId =
  | 'define_scope'
  | 'send_quote'
  | 'control_change'
  | 'handle_support'
  | 'prepare_acceptance'
  | 'request_clarity'
  | 'review_rejection';

export interface DocumentCreationIntent {
  id: DocumentCreationIntentId;
  documentType: DocumentTypeId;
  relatedTypes: DocumentTypeId[];
  title: string;
  description: string;
  result: string;
  cta: string;
  badge: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeId, string> = {
  scope: 'Scope',
  quotation: 'Quotation',
  invoice: 'Invoice',
  cr: 'Change Request',
  dcr: 'Development Change Request',
  sup: 'Support Request',
  ma: 'Maintenance Request',
  acceptance: 'Acceptance',
  revision: 'Revision Review',
  followup: 'Follow-up',
};

export const DOCUMENT_CREATION_INTENTS: DocumentCreationIntent[] = [
  {
    id: 'define_scope',
    documentType: 'scope',
    relatedTypes: ['scope'],
    title: 'กำหนดขอบเขตงานให้ชัด',
    description: 'ใช้เมื่อมี Brief แล้วต้องเปลี่ยนเป็นขอบเขตงานที่ตกลงร่วมกันได้',
    result: 'ได้ Scope ที่บอกสิ่งที่ทำ / ไม่ทำ / deliverables / acceptance criteria ชัดเจน',
    cta: 'สร้าง Scope',
    badge: 'Brief → Scope',
  },
  {
    id: 'send_quote',
    documentType: 'quotation',
    relatedTypes: ['quotation'],
    title: 'เสนอราคา',
    description: 'ใช้เมื่อขอบเขตงานเริ่มชัดและต้องส่งราคาให้ลูกค้าตัดสินใจ',
    result: 'ได้ Quotation สำหรับอ้างอิงราคา เงื่อนไข และขอบเขตที่เสนอ',
    cta: 'สร้าง Quotation',
    badge: 'Scope → Quote',
  },
  {
    id: 'control_change',
    documentType: 'cr',
    relatedTypes: ['cr', 'dcr'],
    title: 'ลูกค้าขอเปลี่ยน / เพิ่มงาน',
    description: 'ใช้เมื่อมีสิ่งใหม่ที่อยู่นอกขอบเขตเดิม หรือมีผลต่อเวลา ราคา หรือ technical design',
    result: 'ได้ Change Request เพื่อแยกงานใหม่ออกจาก scope เดิมและลด scope creep',
    cta: 'สร้าง Change Request',
    badge: 'Scope control',
  },
  {
    id: 'handle_support',
    documentType: 'sup',
    relatedTypes: ['sup', 'ma'],
    title: 'แจ้งปัญหาหรือ support',
    description: 'ใช้เมื่อมี bug, support request, maintenance หรือประเด็นหลังส่งมอบที่ต้องติดตาม',
    result: 'ได้ Support Request ที่บันทึกอาการ หมวดหมู่ และ next action ให้ตามงานต่อได้',
    cta: 'สร้าง Support Request',
    badge: 'Support / MA',
  },
  {
    id: 'prepare_acceptance',
    documentType: 'acceptance',
    relatedTypes: ['acceptance'],
    title: 'เตรียมส่งมอบ / ตรวจรับ',
    description: 'ใช้เมื่อใกล้ส่งงานและต้องมี checklist ให้ลูกค้าตรวจรับอย่างเป็นระบบ',
    result: 'ได้ Acceptance Checklist สำหรับยืนยันการส่งมอบและลดงานค้างคลุมเครือ',
    cta: 'สร้าง Acceptance',
    badge: 'Delivery',
  },
  {
    id: 'request_clarity',
    documentType: 'followup',
    relatedTypes: ['followup'],
    title: 'ติดตามคำตอบ / ขอข้อมูลเพิ่ม',
    description: 'ใช้เมื่องานยังติดคำตอบจากลูกค้า หรือ Brief ยังไม่พอสำหรับทำ Scope / Quote',
    result: 'ได้ Follow-up ที่ถามเฉพาะข้อมูลที่ยังขาดและช่วยให้ลูกค้าตอบง่ายขึ้น',
    cta: 'สร้าง Follow-up',
    badge: 'Clarify',
  },
  {
    id: 'review_rejection',
    documentType: 'revision',
    relatedTypes: ['revision'],
    title: 'ทบทวนงานที่ถูกปฏิเสธ',
    description: 'ใช้เมื่อ Acceptance ไม่ผ่านหรือลูกค้าขอแก้หลัง review แล้วต้องแยกประเด็นให้ชัด',
    result: 'ได้ Revision Review เพื่อแยกสิ่งที่ต้องแก้ สิ่งที่อยู่นอก scope และ decision ถัดไป',
    cta: 'สร้าง Revision Review',
    badge: 'Acceptance review',
  },
];

export function getDocumentCreationIntent(intentId?: string | null): DocumentCreationIntent | undefined {
  if (!intentId) return undefined;
  return DOCUMENT_CREATION_INTENTS.find(intent => intent.id === intentId);
}

export function getDocumentCreationIntentForType(documentType?: string | null): DocumentCreationIntent | undefined {
  if (!documentType) return undefined;
  return DOCUMENT_CREATION_INTENTS.find(intent => intent.relatedTypes.includes(documentType as DocumentTypeId));
}

export function getDocumentCreationCta(documentType?: string | null): string {
  const intent = getDocumentCreationIntentForType(documentType);
  if (intent) return intent.cta;
  const label = DOCUMENT_TYPE_LABELS[documentType as DocumentTypeId];
  return label ? `สร้าง ${label}` : 'สร้างเอกสาร';
}

export function getDocumentCreationResult(documentType?: string | null): string {
  const intent = getDocumentCreationIntentForType(documentType);
  if (intent) return intent.result;
  const label = DOCUMENT_TYPE_LABELS[documentType as DocumentTypeId] || 'เอกสาร';
  return `ได้ ${label} สำหรับใช้ควบคุมงานกับลูกค้าและเปิดผลลัพธ์ให้ตรวจทันที`;
}

export function getDocumentCreationRecommendationReason(documentType?: string | null, sourceReason?: string | null): string {
  if (sourceReason?.trim()) return sourceReason.trim();
  const intent = getDocumentCreationIntentForType(documentType);
  if (!intent) return 'ระบบเตรียมเอกสารนี้จาก action ถัดไปของโครงการ';
  return `ระบบแนะนำเพราะขั้นตอนนี้เหมาะกับการ${intent.title}`;
}
