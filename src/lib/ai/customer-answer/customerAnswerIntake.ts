export type CustomerAnswerIntent =
  | 'approval'
  | 'rejection'
  | 'clarification'
  | 'scope_change'
  | 'new_requirement'
  | 'unknown';

export interface CustomerAnswerIntakeResult {
  intent: CustomerAnswerIntent;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  signals: string[];
  recommendedAction: string;
  shouldCreateChangeRequest: boolean;
  shouldAskFollowUp: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

function classifyConfidence(signalCount: number, hasStrongSignal: boolean): CustomerAnswerIntakeResult['confidence'] {
  if (hasStrongSignal || signalCount >= 2) return 'high';
  if (signalCount === 1) return 'medium';
  return 'low';
}

export function classifyCustomerAnswer(answer: string): CustomerAnswerIntakeResult {
  const text = normalize(answer);
  const signals: string[] = [];

  const approvalSignals = ['approved', 'approve', 'ตกลง', 'อนุมัติ', 'โอเค', 'ok', 'confirm', 'ยืนยัน', 'เห็นชอบ', 'go ahead'];
  const rejectionSignals = ['reject', 'rejected', 'ไม่อนุมัติ', 'ไม่เอา', 'ยังไม่ผ่าน', 'ไม่ผ่าน', 'cancel', 'ยกเลิก'];
  const clarificationSignals = ['หมายถึง', 'ขอถาม', 'สงสัย', 'clarify', 'clarification', 'อธิบาย', 'คืออะไร', 'ยังไง', '?'];
  const scopeChangeSignals = ['เพิ่ม', 'เปลี่ยน', 'แก้', 'ขยาย', 'อีกนิด', 'เพิ่มอีก', 'change', 'modify', 'revise', 'extend', 'extra', 'เพิ่มเติม'];
  const newRequirementSignals = ['อยากได้', 'ต้องการเพิ่ม', 'feature ใหม่', 'new feature', 'เพิ่มระบบ', 'ทำเพิ่ม', 'module ใหม่', 'เมนูใหม่'];

  const approval = hasAny(text, approvalSignals);
  const rejection = hasAny(text, rejectionSignals);
  const clarification = hasAny(text, clarificationSignals);
  const scopeChange = hasAny(text, scopeChangeSignals);
  const newRequirement = hasAny(text, newRequirementSignals);

  if (approval) signals.push('approval_language');
  if (rejection) signals.push('rejection_language');
  if (clarification) signals.push('clarification_question');
  if (scopeChange) signals.push('scope_change_language');
  if (newRequirement) signals.push('new_requirement_language');

  if (!text) {
    return {
      intent: 'unknown',
      confidence: 'low',
      summary: 'ไม่มีข้อความคำตอบจากลูกค้า',
      signals: [],
      recommendedAction: 'ขอคำตอบหรือหลักฐานจากลูกค้าเพิ่มเติมก่อนอัปเดตเอกสาร',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
      riskLevel: 'medium',
    };
  }

  if (rejection) {
    return {
      intent: 'rejection',
      confidence: classifyConfidence(signals.length, rejection),
      summary: 'ลูกค้าปฏิเสธหรือยังไม่ยอมรับข้อเสนอ/เอกสาร',
      signals,
      recommendedAction: 'เก็บเหตุผลการปฏิเสธและปรับ Brief/Scope/Quotation ผ่านรอบ review ใหม่',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
      riskLevel: 'medium',
    };
  }

  if (clarification && !newRequirement) {
    return {
      intent: 'clarification',
      confidence: classifyConfidence(signals.length, clarification),
      summary: 'ลูกค้าถามเพื่อขอความชัดเจน ยังไม่ควรถือเป็น approval หรือ scope change',
      signals,
      recommendedAction: 'ตอบคำถามและเก็บ clarification เป็น evidence ก่อนอัปเดตเอกสารหลัก',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
      riskLevel: 'medium',
    };
  }

  if (newRequirement || (scopeChange && !approval)) {
    return {
      intent: newRequirement ? 'new_requirement' : 'scope_change',
      confidence: classifyConfidence(signals.length, newRequirement),
      summary: newRequirement ? 'ลูกค้าระบุความต้องการใหม่หรือฟีเจอร์ใหม่' : 'ลูกค้าขอเปลี่ยนหรือขยายขอบเขตจากที่คุยไว้',
      signals,
      recommendedAction: 'ตรวจเทียบกับ Scope Baseline และเตรียม CR/DCR แทนการแก้ Scope เดิมเงียบ ๆ',
      shouldCreateChangeRequest: true,
      shouldAskFollowUp: true,
      riskLevel: 'high',
    };
  }

  if (approval) {
    return {
      intent: 'approval',
      confidence: classifyConfidence(signals.length, approval),
      summary: 'ลูกค้ามีแนวโน้มอนุมัติหรือยืนยันให้เดินงานต่อ',
      signals,
      recommendedAction: 'บันทึก approval evidence และใช้ lifecycle action ถัดไป เช่นสร้าง baseline หรือส่ง sign-off',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: false,
      riskLevel: 'low',
    };
  }

  return {
    intent: 'unknown',
    confidence: 'low',
    summary: 'ยังแยกเจตนาของคำตอบลูกค้าไม่ได้ชัดเจน',
    signals,
    recommendedAction: 'ถาม follow-up เพื่อยืนยันว่าเป็น approval, clarification หรือ scope change',
    shouldCreateChangeRequest: false,
    shouldAskFollowUp: true,
    riskLevel: 'medium',
  };
}
