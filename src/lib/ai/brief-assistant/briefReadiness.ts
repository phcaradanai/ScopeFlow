import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

export type BriefReadinessLevel = 'not_ready' | 'needs_questions' | 'draft_ready';

export interface BriefReadinessSignal {
  id:
    | 'goal'
    | 'users'
    | 'features'
    | 'platform'
    | 'data'
    | 'integration'
    | 'timeline'
    | 'budget'
    | 'acceptance';
  label: string;
  present: boolean;
  evidence: string[];
  question: string;
  weight: number;
}

export interface BriefReadinessResult {
  score: number;
  maxScore: number;
  percent: number;
  level: BriefReadinessLevel;
  summary: string;
  signals: BriefReadinessSignal[];
  missingSignals: BriefReadinessSignal[];
  suggestedQuestions: string[];
  canCreateBriefDraft: boolean;
  shouldCreateScopeDraft: boolean;
  shouldCreateQuotation: boolean;
}

const SIGNALS: Array<Omit<BriefReadinessSignal, 'present' | 'evidence'>> = [
  {
    id: 'goal',
    label: 'Goal / business outcome',
    question: 'เป้าหมายหลักของงานนี้คืออะไร และความสำเร็จวัดจากอะไร?',
    weight: 2,
  },
  {
    id: 'users',
    label: 'Target users / roles',
    question: 'ใครคือผู้ใช้งานหลัก และแต่ละบทบาทต้องทำอะไรได้บ้าง?',
    weight: 2,
  },
  {
    id: 'features',
    label: 'Core features',
    question: 'ฟีเจอร์ที่จำเป็นต้องมีในรอบแรกมีอะไรบ้าง และอะไรยังไม่รวม?',
    weight: 3,
  },
  {
    id: 'platform',
    label: 'Platform / channel',
    question: 'ต้องการใช้งานบน Web, Mobile, LINE OA, Desktop หรือหลายช่องทาง?',
    weight: 2,
  },
  {
    id: 'data',
    label: 'Data / migration / content owner',
    question: 'ข้อมูลเริ่มต้นมาจากไหน ใครเตรียมข้อมูล และต้องย้ายข้อมูลเดิมหรือไม่?',
    weight: 2,
  },
  {
    id: 'integration',
    label: 'Integration / external systems',
    question: 'ต้องเชื่อมต่อระบบภายนอกใดบ้าง เช่น payment, shipping, ERP, POS, LINE, email หรือ API?',
    weight: 2,
  },
  {
    id: 'timeline',
    label: 'Timeline / delivery date',
    question: 'ต้องการใช้งานเมื่อไหร่ มี deadline หรือ phase ส่งมอบอย่างไร?',
    weight: 1,
  },
  {
    id: 'budget',
    label: 'Budget / commercial constraint',
    question: 'มีงบประมาณเป้าหมายหรือกรอบราคาไหม เพื่อช่วยจัด scope ให้เหมาะสม?',
    weight: 1,
  },
  {
    id: 'acceptance',
    label: 'Acceptance criteria',
    question: 'ลูกค้าจะถือว่างานเสร็จ/ตรวจรับผ่านเมื่ออะไรทำงานได้บ้าง?',
    weight: 2,
  },
];

const KEYWORDS: Record<BriefReadinessSignal['id'], string[]> = {
  goal: ['ต้องการ', 'อยาก', 'เพื่อ', 'เป้าหมาย', 'ช่วย', 'ลด', 'เพิ่มยอด', 'ขาย', 'บริหาร', 'จัดการ', 'รายงาน', 'dashboard'],
  users: ['admin', 'แอดมิน', 'ลูกค้า', 'สมาชิก', 'ผู้ใช้', 'พนักงาน', 'เจ้าหน้าที่', 'owner', 'manager', 'role', 'permission', 'สิทธิ์'],
  features: ['ระบบ', 'ฟีเจอร์', 'หน้า', 'เมนู', 'ตะกร้า', 'ชำระ', 'จอง', 'login', 'สมัคร', 'สินค้า', 'สต็อก', 'รายงาน', 'export'],
  platform: ['web', 'website', 'เว็บ', 'mobile', 'app', 'android', 'ios', 'line', 'desktop', 'browser'],
  data: ['ข้อมูล', 'excel', 'import', 'ย้ายข้อมูล', 'migration', 'content', 'สินค้า', 'ฐานข้อมูล', 'csv', 'รูปภาพ'],
  integration: ['api', 'เชื่อม', 'payment', 'พร้อมเพย์', 'บัตรเครดิต', 'shipping', 'ขนส่ง', 'erp', 'pos', 'line oa', 'email', 'sms'],
  timeline: ['ภายใน', 'deadline', 'กำหนด', 'เดือน', 'สัปดาห์', 'วัน', 'phase', 'เฟส', 'mvp', 'เปิดใช้'],
  budget: ['งบ', 'budget', 'ราคา', 'ประมาณ', 'บาท', 'cost', 'ค่าใช้จ่าย'],
  acceptance: ['ตรวจรับ', 'ผ่าน', 'สำเร็จ', 'ใช้งานได้', 'ต้องทำงาน', 'ทดสอบ', 'acceptance', 'criteria'],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function collectDigestEvidence(signalId: BriefReadinessSignal['id'], digest?: ScopeDigestOutput): string[] {
  if (!digest) return [];
  const buckets: string[] = [];
  if (signalId === 'goal') buckets.push(...(digest.understanding || []), ...(digest.confirmed_facts || []));
  if (signalId === 'features') buckets.push(...(digest.likely_in_scope || []), ...(digest.confirmed_facts || []));
  if (signalId === 'platform' || signalId === 'data' || signalId === 'integration') buckets.push(...(digest.confirmed_facts || []), ...(digest.assumptions || []), ...(digest.unclear_points || []));
  if (signalId === 'acceptance') buckets.push(...(digest.suggested_next_documents || []), ...(digest.questions_to_ask || []));
  if (signalId === 'timeline' || signalId === 'budget' || signalId === 'users') buckets.push(...(digest.confirmed_facts || []), ...(digest.unclear_points || []), ...(digest.questions_to_ask || []));
  return buckets.map(item => item.trim()).filter(Boolean);
}

function hasKeywordEvidence(signalId: BriefReadinessSignal['id'], text: string, digest?: ScopeDigestOutput): string[] {
  const digestEvidence = collectDigestEvidence(signalId, digest);
  const combined = normalize([text, ...digestEvidence].join(' '));
  const hits = KEYWORDS[signalId].filter(keyword => combined.includes(keyword.toLowerCase()));
  return [...hits, ...digestEvidence.slice(0, 3)].filter(Boolean);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

export function evaluateBriefReadiness(rawRequest: string, digest?: ScopeDigestOutput): BriefReadinessResult {
  const text = normalize(rawRequest);
  const signals = SIGNALS.map(signal => {
    const evidence = hasKeywordEvidence(signal.id, text, digest);
    const present = evidence.length > 0;
    return { ...signal, present, evidence: unique(evidence) };
  });

  const score = signals.reduce((total, signal) => total + (signal.present ? signal.weight : 0), 0);
  const maxScore = signals.reduce((total, signal) => total + signal.weight, 0);
  const percent = Math.round((score / maxScore) * 100);
  const missingSignals = signals.filter(signal => !signal.present);
  const digestQuestions = digest?.questions_to_ask || [];
  const suggestedQuestions = unique([
    ...missingSignals.sort((a, b) => b.weight - a.weight).map(signal => signal.question),
    ...digestQuestions,
  ]).slice(0, 8);

  const level: BriefReadinessLevel = percent >= 70 && missingSignals.length <= 3
    ? 'draft_ready'
    : percent >= 40
      ? 'needs_questions'
      : 'not_ready';

  const summary = level === 'draft_ready'
    ? 'ข้อมูลพอสำหรับสร้าง Brief Draft ได้ แต่ยังควรเก็บคำถามค้างไว้ก่อนล็อก Scope/Quotation'
    : level === 'needs_questions'
      ? 'ข้อมูลเริ่มพอเห็นภาพ แต่ยังควรถามลูกค้าเพิ่มก่อนสร้าง Scope หรือเสนอราคา'
      : 'ข้อมูลยังคลุมเครือ ควรถามกลับก่อนสร้างเอกสารหลักเพื่อกัน scope ผิดทาง';

  return {
    score,
    maxScore,
    percent,
    level,
    summary,
    signals,
    missingSignals,
    suggestedQuestions,
    canCreateBriefDraft: percent >= 40,
    shouldCreateScopeDraft: percent >= 70,
    shouldCreateQuotation: percent >= 85 && missingSignals.length <= 1,
  };
}
