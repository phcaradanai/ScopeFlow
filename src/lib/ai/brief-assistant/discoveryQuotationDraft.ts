import { generateQuotationMarkdown, type QuotationFormData, type LineItem } from '../../quotation-builder';
import type { DiscoverySession } from './discoverySession';

function collectAnswers(session: DiscoverySession): string[] {
  return session.conversation.turns
    .filter(turn => turn.role === 'customer' || turn.role === 'user_note')
    .map(turn => turn.content.trim())
    .filter(Boolean);
}

function extractBudget(text: string): number | null {
  const normalized = text.replace(/,/g, '');
  const explicitBudget = normalized.match(/(?:งบ|budget|ราคา|ประมาณ)\s*[:=]?\s*(\d{4,9})/i);
  if (explicitBudget) return Number(explicitBudget[1]);

  const baht = normalized.match(/(\d{4,9})\s*(?:บาท|thb)/i);
  if (baht) return Number(baht[1]);

  return null;
}

function buildNotes(session: DiscoverySession, answers: string[]): string {
  const missing = session.conversation.readiness.missingSignals.map(signal => signal.label);
  return [
    `สร้างจาก Discovery Session ${session.id}`,
    `Readiness: ${session.conversation.readiness.percent}% (${session.conversation.readiness.level})`,
    answers.length > 0 ? `ข้อมูลจากลูกค้า:\n${answers.map(answer => `- ${answer}`).join('\n')}` : '',
    missing.length > 0 ? `ข้อมูลที่ยังควรยืนยันก่อนออกใบเสนอราคาสุดท้าย:\n${missing.map(item => `- ${item}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
}

function buildLineItems(session: DiscoverySession, budget: number | null): LineItem[] {
  const readiness = session.conversation.readiness;
  const features = readiness.signals.find(signal => signal.id === 'features');
  const integrations = readiness.signals.find(signal => signal.id === 'integration');
  const data = readiness.signals.find(signal => signal.id === 'data');

  const fallbackPrice = budget && budget > 0 ? budget : 0;
  const implementationPrice = fallbackPrice > 0 ? Math.round(fallbackPrice * 0.7) : 0;
  const setupPrice = fallbackPrice > 0 ? Math.round(fallbackPrice * 0.2) : 0;
  const validationPrice = fallbackPrice > 0 ? Math.max(0, fallbackPrice - implementationPrice - setupPrice) : 0;

  return [
    {
      id: 'discovery-implementation',
      description: features?.evidence?.[0] ? `พัฒนาระบบตาม Discovery: ${features.evidence[0]}` : 'พัฒนาระบบตาม Discovery Session',
      quantity: 1,
      unit: 'งาน',
      unit_price: implementationPrice,
    },
    {
      id: 'discovery-setup',
      description: [
        data?.evidence?.[0] ? `จัดเตรียมข้อมูล: ${data.evidence[0]}` : 'จัดเตรียมข้อมูลและตั้งค่าระบบ',
        integrations?.evidence?.[0] ? `เชื่อมต่อ: ${integrations.evidence[0]}` : '',
      ].filter(Boolean).join(' / '),
      quantity: 1,
      unit: 'งาน',
      unit_price: setupPrice,
    },
    {
      id: 'discovery-validation',
      description: 'ทดสอบ ส่งมอบ และปรับแก้ก่อนตรวจรับตาม Discovery Session',
      quantity: 1,
      unit: 'งาน',
      unit_price: validationPrice,
    },
  ];
}

export function buildDiscoveryQuotationFormData(session: DiscoverySession, projectId: string): QuotationFormData {
  const answers = collectAnswers(session);
  const allText = [session.rawRequest, ...answers].join('\n');
  const budget = extractBudget(allText);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    title: `ใบเสนอราคาจาก Discovery: ${projectId}`,
    scope_ref: 'scope-from-discovery.md',
    valid_until: nextMonth.toISOString().slice(0, 10),
    vat_percent: 7,
    discount_type: 'none',
    discount_value: 0,
    notes: buildNotes(session, answers),
    payment_terms_preset: 'แบ่งชำระ 2 งวด: 50% เมื่อเริ่มงาน และ 50% เมื่อส่งมอบงานตามขอบเขตที่ตกลง',
    line_items: buildLineItems(session, budget),
  };
}

export function buildDiscoveryQuotationMarkdown(session: DiscoverySession, clientId: string, projectId: string): string {
  const formData = buildDiscoveryQuotationFormData(session, projectId);
  return generateQuotationMarkdown(
    formData,
    null,
    clientId,
    projectId,
    `quotation-discovery-${session.id}`
  );
}
