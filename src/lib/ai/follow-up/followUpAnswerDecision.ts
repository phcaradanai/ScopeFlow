import { generateJsonWithTrace } from '../providers/aiProviderRouter';

export type FollowUpAnswerAction = 'update_brief' | 'update_scope' | 'create_change_request' | 'ask_more_questions' | 'no_action';
export type FollowUpAnswerSource = 'deterministic' | 'ai' | 'ai-fallback';

export interface FollowUpAnswerDecisionInput {
  answer: string;
  question?: string;
  briefMarkdown?: string;
  scopeMarkdown?: string;
  scopeStatus?: string;
  scopeLocked?: boolean;
}

export interface FollowUpAnswerDecision {
  recommended_action: FollowUpAnswerAction;
  confidence: 'low' | 'medium' | 'high';
  source: FollowUpAnswerSource;
  summary: string;
  impact_summary: string;
  changed_items: string[];
  suggested_update: string;
  follow_up_questions: string[];
  guardrails: {
    can_update_brief: boolean;
    can_update_scope: boolean;
    should_create_change_request: boolean;
    reason: string;
  };
  provider?: string;
  model?: string;
  fallback_reason?: string;
}

function normalize(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean))).slice(0, 8);
}

function isScopeApprovedOrLocked(input: FollowUpAnswerDecisionInput) {
  return Boolean(input.scopeLocked || ['approved', 'signed_off', 'locked'].includes(normalize(input.scopeStatus)));
}

function containsAny(text: string, patterns: RegExp[]) {
  return patterns.some(pattern => pattern.test(text));
}

function extractChangedItems(answer: string): string[] {
  const lines = answer
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(line => line.length > 0);
  if (lines.length > 1) return unique(lines);
  return unique([answer.trim()]);
}

export function decideFollowUpAnswerDeterministically(input: FollowUpAnswerDecisionInput): FollowUpAnswerDecision {
  const answer = input.answer.trim();
  const plain = normalize(answer);
  const approvedOrLocked = isScopeApprovedOrLocked(input);

  if (!answer) {
    return {
      recommended_action: 'no_action',
      confidence: 'high',
      source: 'deterministic',
      summary: 'ยังไม่มีคำตอบลูกค้าให้วิเคราะห์',
      impact_summary: 'ยังไม่กระทบ Brief หรือ Scope เพราะยังไม่มีข้อมูลใหม่',
      changed_items: [],
      suggested_update: '',
      follow_up_questions: [],
      guardrails: {
        can_update_brief: false,
        can_update_scope: false,
        should_create_change_request: false,
        reason: 'ต้องมีคำตอบลูกค้าก่อนจึงจะอัปเดตเอกสารได้',
      },
    };
  }

  const asksMore = containsAny(plain, [/ยังไม่แน่ใจ|ไม่แน่ใจ|ขอถาม|รอก่อน|ยังตอบไม่ได้|ไม่ชัด|clarify|not sure|later/]);
  const scopeChange = containsAny(plain, [/เพิ่ม|ขอเพิ่ม|เปลี่ยน|แก้จาก|นอก scope|นอกขอบเขต|อีกฟีเจอร์|new requirement|change request|เพิ่มรายงาน|เพิ่มหน้า|เพิ่มระบบ/]);
  const scopeDetail = containsAny(plain, [/ต้องทำ|ต้องการให้|รวม|ไม่รวม|ส่งมอบ|deliverable|ตรวจรับ|acceptance|ใช้งานได้|ต้องรองรับ/]);
  const briefDetail = containsAny(plain, [/deadline|กำหนดส่ง|ภายใน|วันที่|สิ้นเดือน|งบ|ราคา|budget|ผู้อนุมัติ|ผู้รับผิดชอบ|owner|contact|ช่องทาง|เป้าหมาย/]);

  if (asksMore && !scopeChange && !scopeDetail && !briefDetail) {
    return {
      recommended_action: 'ask_more_questions',
      confidence: 'medium',
      source: 'deterministic',
      summary: 'คำตอบลูกค้ายังไม่พอสำหรับอัปเดต Brief/Scope',
      impact_summary: 'ควรถามต่อก่อนเปลี่ยน Brief หรือ Scope เพื่อไม่ให้สรุปเกินกว่าที่ลูกค้ายืนยัน',
      changed_items: extractChangedItems(answer),
      suggested_update: '',
      follow_up_questions: ['ลูกค้าสามารถยืนยันรายละเอียดที่ยังไม่ชัดเจนเป็นข้อ ๆ ได้หรือไม่?'],
      guardrails: {
        can_update_brief: false,
        can_update_scope: false,
        should_create_change_request: false,
        reason: 'ยังไม่มีข้อมูลยืนยันเพียงพอ จึงควรสร้าง Follow-up ถามต่อ',
      },
    };
  }

  if (scopeChange && approvedOrLocked) {
    return {
      recommended_action: 'create_change_request',
      confidence: 'high',
      source: 'deterministic',
      summary: 'คำตอบนี้ดูเป็นการเปลี่ยนงานหลัง Scope ถูกล็อกหรืออนุมัติแล้ว',
      impact_summary: 'ควรสร้าง Change Request แทนการแก้ Scope เดิม เพื่อคุม version, ราคา และ approval',
      changed_items: extractChangedItems(answer),
      suggested_update: `นำคำตอบลูกค้านี้ไปเปิด Change Request:\n${answer}`,
      follow_up_questions: [],
      guardrails: {
        can_update_brief: true,
        can_update_scope: false,
        should_create_change_request: true,
        reason: 'Scope approved/locked แล้ว ห้ามเขียนทับเงียบ ๆ ต้องเสนอเป็น Change Request หรือเวอร์ชันใหม่',
      },
    };
  }

  if (scopeChange || scopeDetail) {
    return {
      recommended_action: 'update_scope',
      confidence: scopeChange ? 'high' : 'medium',
      source: 'deterministic',
      summary: 'คำตอบนี้มีรายละเอียดที่ควรนำไปอัปเดต Scope',
      impact_summary: approvedOrLocked
        ? 'Scope ถูกล็อกหรืออนุมัติแล้ว จึงควรทำเป็น proposed update หรือ Change Request'
        : 'สามารถเสนออัปเดต Scope ผ่าน flow รวมข้อมูลอย่างปลอดภัยได้',
      changed_items: extractChangedItems(answer),
      suggested_update: `เพิ่มข้อมูลจากคำตอบลูกค้าใน Scope:\n${answer}`,
      follow_up_questions: [],
      guardrails: {
        can_update_brief: true,
        can_update_scope: !approvedOrLocked,
        should_create_change_request: approvedOrLocked,
        reason: approvedOrLocked
          ? 'Scope approved/locked แล้ว จึงควรสร้าง Change Request แทนการแก้ Scope เดิม'
          : 'Scope ยังไม่ locked สามารถเสนอ update ผ่าน conflict/update flow ได้',
      },
    };
  }

  if (briefDetail) {
    return {
      recommended_action: 'update_brief',
      confidence: 'medium',
      source: 'deterministic',
      summary: 'คำตอบนี้เติมข้อมูลพื้นฐานที่ควรเก็บใน Brief',
      impact_summary: 'ควรอัปเดต Brief ก่อน แล้วค่อยพิจารณาว่าต้องปรับ Scope หรือ Quote ต่อหรือไม่',
      changed_items: extractChangedItems(answer),
      suggested_update: `เพิ่มข้อมูลจากคำตอบลูกค้าใน Brief:\n${answer}`,
      follow_up_questions: [],
      guardrails: {
        can_update_brief: true,
        can_update_scope: false,
        should_create_change_request: false,
        reason: 'ข้อมูลนี้เป็น context/ข้อจำกัดพื้นฐาน จึงควรเก็บใน Brief ก่อน',
      },
    };
  }

  return {
    recommended_action: 'no_action',
    confidence: 'low',
    source: 'deterministic',
    summary: 'คำตอบนี้ยังไม่ชัดว่าต้องเปลี่ยน Brief หรือ Scope',
    impact_summary: 'ยังไม่ควรอัปเดตเอกสารหลักจนกว่าจะมีข้อมูลที่ชัดกว่านี้',
    changed_items: extractChangedItems(answer),
    suggested_update: '',
    follow_up_questions: ['คำตอบนี้ต้องการให้เปลี่ยน Scope, เพิ่มเงื่อนไข, หรือเป็นเพียงข้อมูลประกอบ?'],
    guardrails: {
      can_update_brief: false,
      can_update_scope: false,
      should_create_change_request: false,
      reason: 'ยังไม่มี signal พอสำหรับ update เอกสารหลัก',
    },
  };
}

function sanitizeAiDecision(value: any, fallback: FollowUpAnswerDecision): FollowUpAnswerDecision {
  const allowed: FollowUpAnswerAction[] = ['update_brief', 'update_scope', 'create_change_request', 'ask_more_questions', 'no_action'];
  const action = allowed.includes(value?.recommended_action) ? value.recommended_action : fallback.recommended_action;
  const confidence = ['low', 'medium', 'high'].includes(value?.confidence) ? value.confidence : fallback.confidence;
  return {
    ...fallback,
    recommended_action: action,
    confidence,
    source: 'ai',
    summary: typeof value?.summary === 'string' && value.summary.trim() ? value.summary.trim() : fallback.summary,
    impact_summary: typeof value?.impact_summary === 'string' && value.impact_summary.trim() ? value.impact_summary.trim() : fallback.impact_summary,
    changed_items: Array.isArray(value?.changed_items) ? unique(value.changed_items.map(String)) : fallback.changed_items,
    suggested_update: typeof value?.suggested_update === 'string' ? value.suggested_update.trim() : fallback.suggested_update,
    follow_up_questions: Array.isArray(value?.follow_up_questions) ? unique(value.follow_up_questions.map(String)) : fallback.follow_up_questions,
    guardrails: fallback.guardrails,
  };
}

export async function decideFollowUpAnswer(workspacePath: string | undefined, input: FollowUpAnswerDecisionInput): Promise<FollowUpAnswerDecision> {
  const fallback = decideFollowUpAnswerDeterministically(input);
  if (!workspacePath || !input.answer.trim()) return fallback;

  try {
    const prompt = `You are ScopeFlow's Follow-up Answer Decision Engine. Analyze a customer answer returned from a Follow-up question.\n\nRules:\n- Return ONLY valid JSON.\n- Do not invent approval, evidence, customer confirmation, budget, deadline, or owner.\n- If the answer is a scope change and Scope is approved/locked, choose create_change_request.\n- Do not silently overwrite approved/locked Scope.\n- Use practical Thai wording.\n\nAllowed recommended_action values:\n- update_brief\n- update_scope\n- create_change_request\n- ask_more_questions\n- no_action\n\nJSON shape:\n{\n  "recommended_action": "update_brief" | "update_scope" | "create_change_request" | "ask_more_questions" | "no_action",\n  "confidence": "low" | "medium" | "high",\n  "summary": string,\n  "impact_summary": string,\n  "changed_items": string[],\n  "suggested_update": string,\n  "follow_up_questions": string[]\n}\n\nFollow-up question:\n${input.question || '(unknown)'}\n\nScope status: ${input.scopeStatus || 'unknown'}\nScope locked: ${input.scopeLocked ? 'yes' : 'no'}\n\nCustomer answer:\n${input.answer}\n\nBrief excerpt/source:\n${input.briefMarkdown || '(none)'}\n\nScope excerpt/source:\n${input.scopeMarkdown || '(none)'}`;
    const routed = await generateJsonWithTrace(workspacePath, prompt);
    const parsed = typeof routed.result === 'string' ? JSON.parse(routed.result) : routed.result;
    return {
      ...sanitizeAiDecision(parsed, fallback),
      provider: routed.providerName,
      model: routed.model,
    };
  } catch (err) {
    return {
      ...fallback,
      source: 'ai-fallback',
      fallback_reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export function buildFollowUpAnswerUpdateDraft(decision: FollowUpAnswerDecision, target: 'Brief' | 'Scope'): string {
  const changed = decision.changed_items.length > 0
    ? decision.changed_items.map(item => `- ${item}`).join('\n')
    : '- ยังไม่มีรายการที่เปลี่ยนชัดเจน';
  const questions = decision.follow_up_questions.length > 0
    ? `\n\n### คำถามที่ควรถามต่อ\n${decision.follow_up_questions.map(item => `- [ ] ${item}`).join('\n')}`
    : '';

  return `\n\n## Proposed ${target} Update from Follow-up Answer\n\n> ข้อเสนอนี้มาจากคำตอบลูกค้าใน Follow-up และยังไม่ใช่ approval/evidence ใหม่ เว้นแต่มีหลักฐานแนบชัดเจน\n\n### คำตอบนี้กระทบ Brief/Scope อย่างไร\n${decision.impact_summary}\n\n### สิ่งที่เปลี่ยนหรือได้คำตอบเพิ่ม\n${changed}\n\n### ข้อเสนอสำหรับอัปเดต\n${decision.suggested_update || decision.summary}${questions}\n`;
}
