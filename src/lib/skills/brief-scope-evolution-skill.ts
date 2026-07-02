import { generateJsonWithTrace } from '../ai/providers/aiProviderRouter';
import { briefScopeEvolutionSchema, BriefScopeEvolutionOutput } from './brief-scope-evolution-schema';
import { buildBriefScopeEvolutionPrompt, BriefScopeEvolutionInput } from './brief-scope-evolution-prompt';

function deterministicFallback(input: BriefScopeEvolutionInput): BriefScopeEvolutionOutput {
  const msgLower = (input.customerMessage || '').toLowerCase();
  
  const isApprovedOrLocked = ['approved', 'locked'].includes((input.scopeStatus || '').toLowerCase()) || !!input.approvalEvidence;
  const isQuestion = msgLower.includes('?') || msgLower.includes('สงสัย') || msgLower.includes('คืออะไร');
  const isChange = msgLower.includes('เปลี่ยน') || msgLower.includes('เพิ่ม') || msgLower.includes('ลด') || msgLower.includes('เอาออก');
  
  let recommendedAction: BriefScopeEvolutionOutput['recommendedAction'];
  let guardrailNotes: string;
  
  let shouldCreateFollowUp = false;
  let shouldCreateChangeRequest = false;
  const shouldRecheckQuote = false;
  let shouldAcceptScope = false;
  let shouldDoNothing = false;
  
  if (isQuestion) {
    recommendedAction = 'Create Follow-up';
    shouldCreateFollowUp = true;
    guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): พบคำถามในข้อความลูกค้า แนะนำให้ตอบกลับหรือถามเพิ่ม';
  } else if (isChange) {
    if (isApprovedOrLocked) {
      recommendedAction = 'Create Change Request';
      shouldCreateChangeRequest = true;
      guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): Scope ถูกอนุมัติหรือล็อกแล้ว ต้องใช้ Change Request เพื่อเปลี่ยนขอบเขต';
    } else if (input.currentScopeSummary && input.currentScopeSummary !== 'None') {
      recommendedAction = 'Update Scope';
      guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): Scope ยังไม่อนุมัติ สามารถปรับปรุง Scope ได้เลย';
    } else {
      recommendedAction = 'Update Brief';
      guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): แนะนำให้อัปเดต Brief เป็นข้อมูลตั้งต้น';
    }
  } else if (msgLower.includes('ตกลง') || msgLower.includes('อนุมัติ') || msgLower.includes('approve') || msgLower.includes('ok')) {
    recommendedAction = 'Accept Scope';
    shouldAcceptScope = true;
    guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): ลูกค้ามีการตอบรับตกลง หรืออนุมัติ';
  } else {
    if (input.currentBriefSummary && input.currentBriefSummary !== 'None') {
      recommendedAction = 'Update Brief';
      guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): ข้อความอาจเป็นบริบทใหม่ แนะนำให้อัปเดตลง Brief';
    } else {
      recommendedAction = 'No document update needed';
      shouldDoNothing = true;
      guardrailNotes = 'วิเคราะห์ด้วยระบบพื้นฐาน (AI ไม่พร้อมใช้งาน): ไม่พบการเปลี่ยนแปลงที่ต้องอัปเดตเอกสาร';
    }
  }

  return {
    iterationTitle: isChange ? 'แก้ไขความต้องการ' : isQuestion ? 'ลูกค้าสอบถามเพิ่มเติม' : 'อัปเดตข้อมูล',
    customerMessageSummary: 'ลูกค้ายืนยันหรือแจ้งข้อมูลเพิ่มเติม (วิเคราะห์พื้นฐาน)',
    detectedChanges: isChange ? 'มีการขอเปลี่ยนแปลงขอบเขต' : 'อาจไม่มีผลกระทบโดยตรง',
    briefChanges: ['อาจมีข้อมูลบริบทเพิ่มเติม'],
    scopeChanges: isChange ? ['มีการเปลี่ยนแปลง scope'] : [],
    quoteImpact: isChange ? 'อาจกระทบราคาหรือระยะเวลา' : 'ไม่มีผลกระทบ',
    acceptanceImpact: 'ตรวจสอบรายการส่งมอบอีกครั้ง',
    missingQuestions: [],
    recommendedAction,
    confidence: 0.3,
    riskLevel: 'Low',
    guardrailNotes,
    proposedBriefUpdate: '',
    proposedScopeUpdate: '',
    shouldCreateFollowUp,
    shouldCreateChangeRequest,
    shouldRecheckQuote,
    shouldAcceptScope,
    shouldDoNothing
  };
}

export async function analyzeBriefScopeEvolution(
  workspacePath: string,
  input: BriefScopeEvolutionInput
): Promise<BriefScopeEvolutionOutput> {
  if (!input.customerMessage || !input.customerMessage.trim()) {
    return deterministicFallback(input);
  }

  try {
    const prompt = buildBriefScopeEvolutionPrompt(input);
    const response = await generateJsonWithTrace(workspacePath, prompt);
    const resultObj = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
    
    // Validate with Zod
    const parsed = briefScopeEvolutionSchema.parse(resultObj);

    // Apply Guardrails
    const isApprovedOrLocked = ['approved', 'locked'].includes((input.scopeStatus || '').toLowerCase()) || !!input.approvalEvidence;
    
    if (parsed.recommendedAction === 'Update Scope' && isApprovedOrLocked) {
      parsed.recommendedAction = 'Create Change Request';
      parsed.shouldCreateChangeRequest = true;
      parsed.guardrailNotes = (parsed.guardrailNotes || '') + ' [Guardrail] ป้องกันการเขียนทับ Scope: Scope ถูกอนุมัติหรือล็อกแล้ว ระบบเปลี่ยนคำแนะนำเป็นสร้าง Change Request';
    }

    // Ensure boolean flags match recommended action if they were hallucinated differently
    parsed.shouldCreateFollowUp = parsed.recommendedAction === 'Create Follow-up';
    parsed.shouldCreateChangeRequest = parsed.recommendedAction === 'Create Change Request';
    parsed.shouldRecheckQuote = parsed.recommendedAction === 'Re-check Quote';
    parsed.shouldAcceptScope = parsed.recommendedAction === 'Accept Scope';
    parsed.shouldDoNothing = parsed.recommendedAction === 'No document update needed';

    return parsed;
  } catch (error) {
    console.warn('BriefScopeEvolution AI failed, falling back to deterministic', error);
    return deterministicFallback(input);
  }
}
