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
  compactResult: string;
  cta: string;
  badge: string;
}

const TITLE_REQUIRED_TYPES: DocumentTypeId[] = ['cr', 'dcr', 'sup', 'ma', 'revision', 'followup'];

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeId, string> = {
  scope: 'Scope',
  quotation: 'Quote',
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
    title: 'ทำขอบเขตงานให้ชัด',
    description: 'เริ่มจากคำขอลูกค้าหรือ Brief แล้วสรุปว่าอะไรอยู่ในงาน อะไรไม่อยู่ในงาน',
    result: 'ได้ Scope ที่บอกสิ่งที่จะทำ / ไม่ทำ / deliverables / เกณฑ์ตรวจรับอย่างชัดเจน',
    compactResult: 'Scope ที่คุมขอบเขตได้',
    cta: 'สร้าง Scope',
    badge: 'Brief → Scope',
  },
  {
    id: 'send_quote',
    documentType: 'quotation',
    relatedTypes: ['quotation'],
    title: 'เสนอราคาให้ลูกค้า',
    description: 'ใช้เมื่อต้องส่งราคาและเงื่อนไขให้ลูกค้าตัดสินใจจาก Scope ที่ชัดขึ้นแล้ว',
    result: 'ได้ Quote สำหรับเสนอราคา เงื่อนไข และขอบเขตที่ลูกค้าใช้อนุมัติได้',
    compactResult: 'Quote สำหรับอนุมัติราคา',
    cta: 'สร้าง Quote',
    badge: 'Scope → Quote',
  },
  {
    id: 'control_change',
    documentType: 'cr',
    relatedTypes: ['cr', 'dcr'],
    title: 'ลูกค้าขอเปลี่ยน / เพิ่มงาน',
    description: 'ใช้เมื่อคำขอใหม่อาจเพิ่มเวลา เพิ่มราคา หรือกระทบขอบเขตเดิม',
    result: 'ได้ Change Request เพื่อแยกงานใหม่ออกจาก Scope เดิม ลด scope creep และให้ตัดสินใจต่อได้',
    compactResult: 'Change Request คุมงานเพิ่ม',
    cta: 'สร้าง Change Request',
    badge: 'Scope control',
  },
  {
    id: 'handle_support',
    documentType: 'sup',
    relatedTypes: ['sup', 'ma'],
    title: 'รับเรื่องปัญหา / support',
    description: 'ใช้เมื่อมีบั๊ก งานแก้ไข งานบำรุงรักษา หรือประเด็นหลังส่งมอบที่ต้องตามต่อ',
    result: 'ได้ Support Request ที่บอกอาการ หมวดหมู่ และ next action เพื่อไม่ให้เรื่องตกหล่น',
    compactResult: 'Support Request ตามปัญหา',
    cta: 'สร้าง Support Request',
    badge: 'Support / MA',
  },
  {
    id: 'prepare_acceptance',
    documentType: 'acceptance',
    relatedTypes: ['acceptance'],
    title: 'เตรียมส่งมอบ / ตรวจรับ',
    description: 'ใช้เมื่อใกล้ส่งงานและต้องมีรายการตรวจรับให้ลูกค้าเช็กอย่างเป็นระบบ',
    result: 'ได้ Acceptance Checklist สำหรับยืนยันการส่งมอบและปิดงานค้างที่ยังไม่ชัดเจน',
    compactResult: 'Acceptance Checklist ส่งมอบ',
    cta: 'สร้าง Acceptance',
    badge: 'ส่งมอบ / ตรวจรับ',
  },
  {
    id: 'request_clarity',
    documentType: 'followup',
    relatedTypes: ['followup'],
    title: 'ติดตามคำตอบ / ขอข้อมูลเพิ่ม',
    description: 'ใช้เมื่องานยังขาดคำตอบจากลูกค้า หรือ Brief ยังไม่พอทำ Scope / Quote',
    result: 'ได้ Follow-up ที่ถามเฉพาะข้อมูลที่ยังขาด เพื่อให้ลูกค้าตอบง่ายและเดินงานต่อได้',
    compactResult: 'Follow-up ถามข้อมูลที่ขาด',
    cta: 'สร้าง Follow-up',
    badge: 'ถามให้ชัด',
  },
  {
    id: 'review_rejection',
    documentType: 'revision',
    relatedTypes: ['revision'],
    title: 'ทบทวนงานที่ไม่ผ่านตรวจรับ',
    description: 'ใช้เมื่อ Acceptance ไม่ผ่าน หรือลูกค้าขอแก้หลัง review แล้วต้องแยกประเด็นให้ชัด',
    result: 'ได้ Revision Review เพื่อแยกสิ่งที่ต้องแก้ สิ่งที่อยู่นอก Scope และ decision ถัดไป',
    compactResult: 'Revision Review แยกงานแก้',
    cta: 'สร้าง Revision Review',
    badge: 'ตรวจรับไม่ผ่าน',
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

export function requiresDocumentCreationTitle(documentType?: string | null): boolean {
  if (!documentType) return false;
  return TITLE_REQUIRED_TYPES.includes(documentType as DocumentTypeId);
}

export function getDocumentCreationTitlePrompt(documentType?: string | null): string {
  const intent = getDocumentCreationIntentForType(documentType);
  if (intent?.id === 'control_change') return 'ใส่หัวข้อสั้น ๆ ว่าลูกค้าขอเปลี่ยนหรือเพิ่มอะไร เช่น “เพิ่มรายงานยอดขายรายวัน”';
  if (intent?.id === 'handle_support') return 'ใส่หัวข้อสั้น ๆ ว่าเกิดปัญหาอะไร หรืออยากให้ support เรื่องไหน เช่น “หน้า login เข้าไม่ได้”';
  if (intent?.id === 'request_clarity') return 'ใส่หัวข้อสั้น ๆ ว่าต้องถามข้อมูลเรื่องอะไร เช่น “ขอรูปแบบรายงานที่ต้องการ”';
  if (intent?.id === 'review_rejection') return 'ใส่หัวข้อสั้น ๆ ว่าตรวจรับไม่ผ่านเรื่องอะไร เช่น “แก้ flow สมัครสมาชิก”';
  return 'ใส่หัวข้อสั้น ๆ เพื่อให้เปิดดูและตามงานต่อได้ง่าย';
}

export function getDocumentCreationTitleMissingMessage(documentType?: string | null): string {
  const intent = getDocumentCreationIntentForType(documentType);
  if (intent?.id === 'control_change') return 'กรุณาใส่หัวข้อว่าลูกค้าขอเปลี่ยนหรือเพิ่มงานอะไร เพื่อให้ Change Request ตาม scope ได้ชัดเจน';
  if (intent?.id === 'handle_support') return 'กรุณาใส่หัวข้อของปัญหาหรือ support request เพื่อให้ทีมตามงานต่อได้ถูกเรื่อง';
  if (intent?.id === 'request_clarity') return 'กรุณาใส่หัวข้อของคำถามที่ต้องการถามลูกค้า เพื่อให้ Follow-up ชัดเจนและตอบง่าย';
  if (intent?.id === 'review_rejection') return 'กรุณาใส่หัวข้อของงานที่ไม่ผ่านตรวจรับ เพื่อให้ Revision Review แยกประเด็นแก้ได้';
  return 'กรุณาใส่หัวข้อสั้น ๆ ก่อนสร้างเอกสารนี้';
}
