import { generateJsonWithTrace } from '../providers/aiProviderRouter';

export type BriefScopeQualitySource = 'deterministic' | 'ai' | 'ai-fallback';
export type ScopeUpdateMode = 'direct_update_ok' | 'proposed_update_or_change_request';

export interface BriefScopeQualityInput {
  briefMarkdown?: string;
  scopeMarkdown?: string;
  scopeStatus?: string;
  scopeLocked?: boolean;
}

export interface BriefScopeQualityAnalysis {
  readiness_score: number;
  source: BriefScopeQualitySource;
  summary: string;
  missing_info: string[];
  unclear_requirements: string[];
  scope_risks: string[];
  suggested_customer_questions: string[];
  suggested_scope_improvements: string[];
  guardrails: {
    scope_update_mode: ScopeUpdateMode;
    reason: string;
  };
  provider?: string;
  model?: string;
  fallback_reason?: string;
}

function stripMarkdown(markdown = ''): string {
  return markdown
    .replace(/^---[\s\S]*?---\n+/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasListItem(markdown: string): boolean {
  return /^\s*(?:[-*]|\d+[.)]|- \[[ xX]\])/m.test(markdown);
}

function hasMeaningfulSection(markdown: string, labels: RegExp[]): boolean {
  return labels.some(label => {
    const match = markdown.match(new RegExp(`##+\\s*.*(?:${label.source}).*\\n([\\s\\S]*?)(?=\\n##+\\s|$)`, 'i'));
    if (!match) return false;
    const section = match[1] || '';
    const text = stripMarkdown(section);
    return text.length >= 12 || (text.length > 0 && hasListItem(section));
  });
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function analyzeBriefScopeQualityDeterministically(input: BriefScopeQualityInput): BriefScopeQualityAnalysis {
  const brief = input.briefMarkdown || '';
  const scope = input.scopeMarkdown || '';
  const combined = `${brief}\n\n${scope}`;
  const plain = stripMarkdown(combined).toLowerCase();
  const missing: string[] = [];
  const unclear: string[] = [];
  const risks: string[] = [];
  const questions: string[] = [];
  const improvements: string[] = [];

  const hasGoal = hasMeaningfulSection(combined, [/เป้าหมาย|goal|objective|overview|ความเป็นมา/]) || hasAny(plain, [/ต้องการ|เป้าหมาย|objective|goal/]);
  const hasInScope = hasMeaningfulSection(combined, [/scope|ขอบเขต|รวมอยู่|in.scope|สิ่งที่จะทำ/]);
  const hasOutOfScope = hasMeaningfulSection(combined, [/out.of.scope|ไม่รวม|อยู่นอกเหนือ|ไม่ทำ|นอกขอบเขต/]);
  const hasDeliverables = hasMeaningfulSection(combined, [/deliverable|ส่งมอบ|สิ่งที่จะได้|ผลลัพธ์/]);
  const hasAcceptance = hasMeaningfulSection(combined, [/acceptance|ตรวจรับ|เกณฑ์|criteria|ยอมรับ/]);
  const hasDeadline = hasAny(plain, [/deadline|timeline|due date|ภายใน|วันที่|กำหนดส่ง|ระยะเวลา|sprint|week|เดือน/]);
  const hasBudget = hasAny(plain, [/budget|ราคา|งบ|ใบเสนอราคา|quote|quotation|บาท|thb|cost/]);
  const hasOwner = hasAny(plain, [/owner|ผู้รับผิดชอบ|ผู้อนุมัติ|contact|pic|stakeholder|ลูกค้า|ทีม/]);
  const hasAssumptions = hasMeaningfulSection(combined, [/assumption|สมมติฐาน|ข้อตกลง|เงื่อนไข|dependency|ข้อจำกัด/]);

  if (!brief.trim()) missing.push('ยังไม่มี Brief หรือคำขอลูกค้าที่ใช้เป็นฐาน');
  if (!scope.trim()) missing.push('ยังไม่มี Scope ที่แปลงคำขอลูกค้าเป็นขอบเขตงาน');
  if (!hasGoal) missing.push('เป้าหมายของงานยังไม่ชัด');
  if (!hasInScope) missing.push('ยังไม่ระบุสิ่งที่รวมอยู่ในงาน');
  if (!hasOutOfScope) missing.push('ยังไม่ระบุสิ่งที่ไม่รวมอยู่ในงาน');
  if (!hasDeliverables) missing.push('ยังไม่ชัดว่าจะส่งมอบอะไรให้ลูกค้า');
  if (!hasAcceptance) missing.push('ยังไม่มีเกณฑ์ตรวจรับงาน');
  if (!hasDeadline) missing.push('deadline หรือกรอบเวลายังไม่ชัด');
  if (!hasBudget) missing.push('budget หรือเงื่อนไขราคา/การเสนอราคายังไม่ชัด');
  if (!hasOwner) missing.push('ผู้ตัดสินใจ/ผู้รับผิดชอบยังไม่ชัด');

  if (hasAny(plain, [/ประมาณ|คร่าว|น่าจะ|อาจจะ|maybe|roughly|asap|ด่วน|เร็ว ๆ|เร็วๆ|ง่าย ๆ|ง่ายๆ|สวย|ดีขึ้น|user friendly|รองรับทั้งหมด|ครบถ้วน/])) {
    unclear.push('มีคำกว้าง ๆ ที่ควรถามให้ชัดก่อนเสนอราคา เช่น “ด่วน”, “ดีขึ้น”, “รองรับทั้งหมด”, “ประมาณ”');
  }
  if (!hasDeliverables) unclear.push('deliverable ยังไม่พอให้ทีมรู้ว่าต้องส่งมอบอะไรจริง');
  if (!hasAcceptance) unclear.push('ยังไม่มีเงื่อนไขว่าลูกค้าจะตรวจรับงานผ่านจากอะไร');
  if (!hasOwner) unclear.push('ยังไม่รู้ว่าใครเป็นคนตอบ/อนุมัติเมื่องานติด decision');

  if (!hasOutOfScope) risks.push('ไม่มี out-of-scope ทำให้ลูกค้าอาจขอเพิ่มงานโดยคิดว่าอยู่ในราคาเดิม');
  if (!hasAcceptance) risks.push('ไม่มี acceptance criteria ทำให้จบงานยากและถกเถียงตอนส่งมอบ');
  if (!hasBudget) risks.push('ยังไม่ผูก Scope กับ budget/Quote ทำให้ประเมินผลกระทบของงานเพิ่มยาก');
  if (!hasAssumptions) risks.push('ยังไม่เขียน assumption/ข้อจำกัด ทำให้ความคาดหวังคลาดเคลื่อนได้');
  if (hasAny(plain, [/เพิ่มได้ภายหลัง|แล้วแต่|ตามที่ต้องการ|ทั้งหมด|ทุกอย่าง|ไม่จำกัด|unlimited|etc\.?/])) {
    risks.push('มีถ้อยคำเปิดกว้างที่อาจทำให้ scope บาน เช่น “ทั้งหมด”, “ตามที่ต้องการ”, “เพิ่มได้ภายหลัง”');
  }

  if (!hasGoal) questions.push('เป้าหมายหลักของงานนี้คืออะไร และจะวัดว่าสำเร็จจากอะไร?');
  if (!hasInScope) questions.push('รายการงานที่ต้องการให้ทำในรอบนี้มีอะไรบ้าง?');
  if (!hasOutOfScope) questions.push('มีอะไรที่ลูกค้ายืนยันว่าไม่รวมในรอบนี้หรือไม่?');
  if (!hasDeliverables) questions.push('เมื่องานเสร็จ ลูกค้าคาดหวังว่าจะได้รับ deliverables อะไรบ้าง?');
  if (!hasAcceptance) questions.push('ลูกค้าจะตรวจรับงานผ่านจากเงื่อนไขหรือ checklist อะไร?');
  if (!hasDeadline) questions.push('ต้องการใช้งานหรือส่งมอบภายในวันไหน และมี milestone สำคัญหรือไม่?');
  if (!hasBudget) questions.push('มีงบประมาณหรือกรอบราคาที่ต้องใช้ในการเสนอ Quote หรือไม่?');
  if (!hasOwner) questions.push('ใครเป็นผู้ให้คำตอบสุดท้ายและอนุมัติ Scope/Quote?');

  if (!hasInScope) improvements.push('เพิ่มหัวข้อ “สิ่งที่รวมอยู่ใน Scope” เป็นรายการงานที่ตกลงทำจริง');
  if (!hasOutOfScope) improvements.push('เพิ่มหัวข้อ “สิ่งที่ไม่รวมใน Scope” เพื่อกันงานเพิ่มที่อยู่นอกขอบเขต');
  if (!hasDeliverables) improvements.push('เพิ่มรายการ deliverables ที่ลูกค้าจะได้รับแบบตรวจนับได้');
  if (!hasAcceptance) improvements.push('เพิ่ม acceptance criteria / checklist ให้ลูกค้าตรวจรับได้ชัด');
  if (!hasAssumptions) improvements.push('เพิ่ม assumptions, dependencies และเงื่อนไขที่ใช้ประเมินราคา/เวลา');
  if (!hasDeadline) improvements.push('เพิ่ม timeline หรือ deadline ที่ใช้วางแผนส่งมอบ');

  const approvedOrLocked = input.scopeLocked || ['approved', 'signed_off', 'locked'].includes((input.scopeStatus || '').toLowerCase());
  const score = clampScore(100 - missing.length * 8 - unclear.length * 5 - risks.length * 6);

  return {
    readiness_score: score,
    source: 'deterministic',
    summary: score >= 80
      ? 'Brief/Scope พร้อมใช้ค่อนข้างดี เหลือเติมรายละเอียดบางจุดก่อนเสนอราคา'
      : score >= 55
        ? 'Brief/Scope ใช้ต่อได้ แต่ยังควรถามลูกค้าเพิ่มก่อนล็อก Scope หรือเสนอราคา'
        : 'ข้อมูลยังคลุมเครือ ควรถามลูกค้าเพิ่มก่อนทำ Scope/Quote จริง',
    missing_info: unique(missing),
    unclear_requirements: unique(unclear),
    scope_risks: unique(risks),
    suggested_customer_questions: unique(questions).slice(0, 8),
    suggested_scope_improvements: unique(improvements).slice(0, 8),
    guardrails: {
      scope_update_mode: approvedOrLocked ? 'proposed_update_or_change_request' : 'direct_update_ok',
      reason: approvedOrLocked
        ? 'Scope นี้ approved/locked แล้ว จึงควรทำเป็น proposed update หรือ Change Request ไม่ควรเขียนทับเงียบ ๆ'
        : 'Scope ยังไม่ locked สามารถเสนอ update ผ่าน conflict/merge flow ได้',
    },
  };
}

function sanitizeAiAnalysis(value: any, fallback: BriefScopeQualityAnalysis): BriefScopeQualityAnalysis {
  const list = (items: any, fallbackItems: string[]) => Array.isArray(items) ? unique(items.map(String)).slice(0, 8) : fallbackItems;
  const score = typeof value?.readiness_score === 'number' ? clampScore(value.readiness_score) : fallback.readiness_score;
  return {
    readiness_score: score,
    source: 'ai',
    summary: typeof value?.summary === 'string' && value.summary.trim() ? value.summary.trim() : fallback.summary,
    missing_info: list(value?.missing_info, fallback.missing_info),
    unclear_requirements: list(value?.unclear_requirements, fallback.unclear_requirements),
    scope_risks: list(value?.scope_risks, fallback.scope_risks),
    suggested_customer_questions: list(value?.suggested_customer_questions, fallback.suggested_customer_questions),
    suggested_scope_improvements: list(value?.suggested_scope_improvements, fallback.suggested_scope_improvements),
    guardrails: fallback.guardrails,
  };
}

export async function analyzeBriefScopeQuality(workspacePath: string | undefined, input: BriefScopeQualityInput): Promise<BriefScopeQualityAnalysis> {
  const fallback = analyzeBriefScopeQualityDeterministically(input);
  if (!workspacePath) return fallback;

  try {
    const prompt = `You are a ScopeFlow Brief/Scope Quality Analyzer. Analyze the customer Brief and Scope for readiness before quotation.\n\nRules:\n- Return ONLY valid JSON.\n- Do not invent approvals, evidence, customer confirmation, budget, deadline, or owner.\n- If scope is approved or locked, recommend proposed update or Change Request only.\n- Use practical Thai wording for freelancers/agencies.\n\nJSON shape:\n{\n  "readiness_score": number,\n  "summary": string,\n  "missing_info": string[],\n  "unclear_requirements": string[],\n  "scope_risks": string[],\n  "suggested_customer_questions": string[],\n  "suggested_scope_improvements": string[]\n}\n\nScope status: ${input.scopeStatus || 'unknown'}\nScope locked: ${input.scopeLocked ? 'yes' : 'no'}\n\nBrief:\n${input.briefMarkdown || '(none)'}\n\nScope:\n${input.scopeMarkdown || '(none)'}`;
    const routed = await generateJsonWithTrace(workspacePath, prompt);
    const parsed = typeof routed.result === 'string' ? JSON.parse(routed.result) : routed.result;
    return {
      ...sanitizeAiAnalysis(parsed, fallback),
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

export function buildScopeQualityImprovementDraft(analysis: BriefScopeQualityAnalysis): string {
  const improvements = analysis.suggested_scope_improvements.length > 0
    ? analysis.suggested_scope_improvements.map(item => `- ${item}`).join('\n')
    : '- เพิ่มรายละเอียด Scope ให้ชัดก่อนเสนอราคา';
  const risks = analysis.scope_risks.length > 0
    ? analysis.scope_risks.map(item => `- ${item}`).join('\n')
    : '- ยังไม่พบ risk สำคัญจาก analyzer';
  const questions = analysis.suggested_customer_questions.length > 0
    ? analysis.suggested_customer_questions.map(item => `- [ ] ${item}`).join('\n')
    : '- [ ] ยืนยันรายละเอียดกับลูกค้าก่อน update Scope';

  return `\n\n## Proposed Scope Quality Update\n\n> ข้อเสนอนี้มาจาก Brief/Scope Quality Analyzer และยังไม่ใช่ approval หรือ customer confirmation\n\n### สิ่งที่ควรเขียนให้ชัดก่อนเสนอราคา\n${improvements}\n\n### จุดที่อาจทำให้งานบาน\n${risks}\n\n### ข้อมูลที่ยังต้องถามลูกค้า\n${questions}\n`;
}
