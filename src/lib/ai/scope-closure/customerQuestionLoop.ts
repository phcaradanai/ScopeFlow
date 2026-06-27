import type { ScopeClosureGateResult } from './scopeClosureGate';

export type CustomerAnswerDisposition = 'confirmed' | 'waived' | 'still_unclear';

export interface CustomerQuestionItem {
  id: string;
  question: string;
  disposition: CustomerAnswerDisposition;
  answer?: string;
  note?: string;
}

export interface CustomerQuestionPack {
  subject: string;
  message: string;
  questions: CustomerQuestionItem[];
  closeLoopChecklistMarkdown: string;
}

function slugifyQuestion(question: string, index: number): string {
  const normalized = question
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `q${index + 1}-${normalized || 'scope-question'}`;
}

export function createCustomerQuestionItems(questions: string[]): CustomerQuestionItem[] {
  return questions
    .map(question => question.trim())
    .filter(Boolean)
    .map((question, index) => ({
      id: slugifyQuestion(question, index),
      question,
      disposition: 'still_unclear' as const,
    }));
}

export function buildCustomerQuestionMessage(gate: ScopeClosureGateResult, projectName = 'โครงการนี้'): string {
  const questions = gate.customer_questions.map((question, index) => `${index + 1}. ${question}`).join('\n');

  if (!questions) {
    return `สวัสดีครับ/ค่ะ\n\nจากข้อมูลล่าสุดของ ${projectName} ตอนนี้ยังไม่มีคำถามค้างหลักก่อนปิด Scope แล้วครับ/ค่ะ\n\nขั้นถัดไปคือยืนยันเอกสาร Scope/Boundary/Acceptance Criteria เพื่อใช้เป็น baseline สำหรับใบเสนอราคาและการตรวจรับงานครับ/ค่ะ`;
  }

  return `สวัสดีครับ/ค่ะ\n\nเพื่อให้ Scope ของ ${projectName} ชัดเจนพอสำหรับการประเมินราคา ระยะเวลา และขอบเขตงาน ขอรบกวนช่วยยืนยันข้อมูลต่อไปนี้ครับ/ค่ะ\n\n${questions}\n\nหมายเหตุ: คำตอบส่วนนี้จะถูกนำไปใช้ล็อกขอบเขตงาน, ระบุสิ่งที่ไม่รวม, กำหนดเงื่อนไขตรวจรับ และแยกว่าส่วนใดหากเพิ่มภายหลังจะต้องเปิด Change Request ครับ/ค่ะ`;
}

export function buildCloseLoopChecklistMarkdown(items: CustomerQuestionItem[]): string {
  if (items.length === 0) {
    return '- [x] ไม่มีคำถามค้างก่อนปิด Scope';
  }

  return items.map(item => {
    const label = item.disposition === 'confirmed'
      ? 'confirmed'
      : item.disposition === 'waived'
        ? 'waived'
        : 'still unclear';
    const answer = item.answer?.trim() ? ` — คำตอบ: ${item.answer.trim()}` : '';
    const note = item.note?.trim() ? ` — หมายเหตุ: ${item.note.trim()}` : '';
    return `- [${item.disposition === 'still_unclear' ? ' ' : 'x'}] (${label}) ${item.question}${answer}${note}`;
  }).join('\n');
}

export function buildCustomerQuestionPack(gate: ScopeClosureGateResult, projectName = 'โครงการนี้'): CustomerQuestionPack {
  const questions = createCustomerQuestionItems(gate.customer_questions);
  return {
    subject: `ขอข้อมูลเพิ่มเติมเพื่อปิด Scope: ${projectName}`,
    message: buildCustomerQuestionMessage(gate, projectName),
    questions,
    closeLoopChecklistMarkdown: buildCloseLoopChecklistMarkdown(questions),
  };
}

export function summarizeCustomerAnswers(items: CustomerQuestionItem[]) {
  const confirmed = items.filter(item => item.disposition === 'confirmed');
  const waived = items.filter(item => item.disposition === 'waived');
  const stillUnclear = items.filter(item => item.disposition === 'still_unclear');

  return {
    confirmed_count: confirmed.length,
    waived_count: waived.length,
    still_unclear_count: stillUnclear.length,
    answered_or_waived_count: confirmed.length + waived.length,
    all_closed: stillUnclear.length === 0,
  };
}
