import { generateJsonWithTrace } from '../providers/aiProviderRouter';

export type RecommendedDeltaAction = 
  | 'update_brief'
  | 'update_scope'
  | 'create_change_request'
  | 'create_follow_up'
  | 'recheck_quote'
  | 'no_action';

export interface BriefScopeDeltaAnalysis {
  summary_of_customer_change: string;
  brief_delta: string;
  scope_delta: string;
  quote_impact: string;
  acceptance_impact: string;
  missing_questions: string[];
  recommended_action: RecommendedDeltaAction;
  confidence: 'high' | 'medium' | 'low';
  guardrail_notes: string;
}

export interface DeltaAnalyzerInputs {
  customerMessage: string;
  latestBriefMarkdown?: string;
  latestScopeMarkdown?: string;
  openFollowUps?: string[];
  openChangeRequests?: string[];
  scopeStatus?: string;
  scopeLocked?: boolean;
}

const DELTA_ANALYSIS_PROMPT = `
You are the ScopeFlow Brief/Scope Control Assistant. Your job is to analyze a new customer message and determine its impact on the current Brief, Scope, Quote, and Acceptance.

Inputs provided:
- Customer Message: the new information, request, or answer from the customer.
- Latest Brief: the current understanding of the customer's context and needs.
- Latest Scope: the current agreed or drafted boundaries of work.
- Open Follow-ups: active questions we are waiting for the customer to answer.
- Open Change Requests (CR/DCR): active changes currently being processed.

You must output ONLY valid JSON containing the following keys:
- summary_of_customer_change: A short summary in Thai of what the customer is asking or stating.
- brief_delta: Explain in Thai what changes or needs to be added to the Brief context (or "ไม่มีผลกระทบ" if none).
- scope_delta: Explain in Thai what changes or needs to be added to the Scope boundaries (or "ไม่มีผลกระทบ" if none).
- quote_impact: Explain in Thai if this change affects effort, timeline, or price.
- acceptance_impact: Explain in Thai if this changes how the final work will be accepted.
- missing_questions: A string array of questions in Thai if information is still missing.
- recommended_action: EXACTLY ONE of: "update_brief", "update_scope", "create_change_request", "create_follow_up", "recheck_quote", "no_action".
- confidence: "high", "medium", or "low".

Rules for recommended_action:
1. If the message is unclear or lacks enough detail to act, recommend "create_follow_up".
2. If the Scope is approved or locked and the message changes the work boundaries, recommend "create_change_request".
3. If the Scope is NOT approved/locked and the message changes work boundaries, recommend "update_scope".
4. If the message only adds business context without changing deliverables, recommend "update_brief".
5. If the change specifically affects pricing or effort but the scope is already clear, recommend "recheck_quote".
6. If it's just an acknowledgment or minor clarification with no impact, recommend "no_action".

DO NOT invent approval, evidence, or customer confirmation. 
Output ONLY JSON.
`;

function deterministicFallback(inputs: DeltaAnalyzerInputs): BriefScopeDeltaAnalysis {
  const { customerMessage, latestBriefMarkdown, latestScopeMarkdown, scopeStatus, scopeLocked } = inputs;
  
  const msgLower = customerMessage.toLowerCase();
  const isApprovedOrLocked = scopeLocked || ['approved', 'signed_off', 'locked'].includes((scopeStatus || '').toLowerCase());
  
  const isQuestion = msgLower.includes('?') || msgLower.includes('สงสัย') || msgLower.includes('คืออะไร');
  const isChange = msgLower.includes('เปลี่ยน') || msgLower.includes('เพิ่ม') || msgLower.includes('ลด') || msgLower.includes('เอาออก');
  
  let recommended_action: RecommendedDeltaAction = 'no_action';
  let guardrail_notes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน)';
  
  if (isQuestion) {
    recommended_action = 'create_follow_up';
    guardrail_notes = 'พบคำถามในข้อความลูกค้า แนะนำให้ตอบกลับหรือถามเพิ่ม';
  } else if (isChange) {
    if (isApprovedOrLocked) {
      recommended_action = 'create_change_request';
      guardrail_notes = 'Scope ถูกอนุมัติหรือล็อกแล้ว ต้องใช้ Change Request เพื่อเปลี่ยนขอบเขต';
    } else if (latestScopeMarkdown) {
      recommended_action = 'update_scope';
      guardrail_notes = 'Scope ยังไม่อนุมัติ สามารถปรับปรุง Scope ได้เลย';
    } else if (latestBriefMarkdown) {
      recommended_action = 'update_brief';
      guardrail_notes = 'ยังไม่มี Scope แนะนำให้อัปเดต Brief เป็นข้อมูลตั้งต้น';
    } else {
      recommended_action = 'update_brief';
    }
  } else {
    if (latestBriefMarkdown) {
      recommended_action = 'update_brief';
      guardrail_notes = 'ข้อความอาจเป็นบริบทใหม่ แนะนำให้อัปเดตลง Brief';
    }
  }

  return {
    summary_of_customer_change: 'ลูกค้ายืนยันหรือแจ้งข้อมูลเพิ่มเติม (วิเคราะห์พื้นฐาน)',
    brief_delta: 'อาจมีข้อมูลบริบทเพิ่มเติม',
    scope_delta: isChange ? 'มีการขอเปลี่ยนแปลงขอบเขต' : 'อาจไม่มีผลกระทบโดยตรง',
    quote_impact: isChange ? 'อาจกระทบราคาหรือระยะเวลา' : 'ไม่มีผลกระทบ',
    acceptance_impact: 'ตรวจสอบรายการส่งมอบอีกครั้ง',
    missing_questions: [],
    recommended_action,
    confidence: 'low',
    guardrail_notes,
  };
}

export async function analyzeBriefScopeDelta(
  workspacePath: string,
  inputs: DeltaAnalyzerInputs
): Promise<BriefScopeDeltaAnalysis> {
  if (!inputs.customerMessage || !inputs.customerMessage.trim()) {
    return deterministicFallback(inputs);
  }

  try {
    const aiPrompt = `
Customer Message:
${inputs.customerMessage}

Latest Brief:
${inputs.latestBriefMarkdown || 'ไม่มี Brief'}

Latest Scope:
${inputs.latestScopeMarkdown || 'ไม่มี Scope'}
Scope is Approved/Locked: ${inputs.scopeLocked || ['approved', 'locked'].includes((inputs.scopeStatus || '').toLowerCase())}

Open Follow-ups:
${inputs.openFollowUps?.join('\n') || 'ไม่มี'}

Open Change Requests:
${inputs.openChangeRequests?.join('\n') || 'ไม่มี'}
`;

    const response = await generateJsonWithTrace(workspacePath, DELTA_ANALYSIS_PROMPT + "\n" + aiPrompt);
    const result = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;

    const analysis: BriefScopeDeltaAnalysis = {
      summary_of_customer_change: result.summary_of_customer_change || 'ไม่มีข้อมูล',
      brief_delta: result.brief_delta || 'ไม่มีผลกระทบ',
      scope_delta: result.scope_delta || 'ไม่มีผลกระทบ',
      quote_impact: result.quote_impact || 'ไม่มีผลกระทบ',
      acceptance_impact: result.acceptance_impact || 'ไม่มีผลกระทบ',
      missing_questions: Array.isArray(result.missing_questions) ? result.missing_questions : [],
      recommended_action: result.recommended_action || 'no_action',
      confidence: result.confidence || 'medium',
      guardrail_notes: '',
    };

    const isApprovedOrLocked = inputs.scopeLocked || ['approved', 'signed_off', 'locked'].includes((inputs.scopeStatus || '').toLowerCase());
    
    if (analysis.recommended_action === 'update_scope' && isApprovedOrLocked) {
      analysis.recommended_action = 'create_change_request';
      analysis.guardrail_notes = 'ป้องกันการเขียนทับ Scope: Scope ถูกอนุมัติหรือล็อกแล้ว ระบบเปลี่ยนคำแนะนำเป็นสร้าง Change Request';
    } else {
      analysis.guardrail_notes = `AI แนะนำ ${analysis.recommended_action} จากการวิเคราะห์ข้อมูล`;
    }

    return analysis;
  } catch (error) {
    console.warn('BriefScopeDeltaAnalyzer AI failed, falling back to deterministic', error);
    return deterministicFallback(inputs);
  }
}
