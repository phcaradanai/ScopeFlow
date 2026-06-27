import type { ScopeClosureGateResult } from './scopeClosureGate';
import type { CustomerAnswerDisposition, CustomerQuestionItem } from './customerQuestionLoop';
import { buildCloseLoopChecklistMarkdown, summarizeCustomerAnswers } from './customerQuestionLoop';

export interface CustomerAnswerApplyInput {
  questions: CustomerQuestionItem[];
  rawAnswerText: string;
}

export interface CustomerAnswerApplyResult {
  updated_questions: CustomerQuestionItem[];
  close_loop_checklist_markdown: string;
  summary: ReturnType<typeof summarizeCustomerAnswers>;
  suggested_closure_input: {
    answeredQuestionCount: number;
    waivedQuestionCount: number;
  };
  recommended_next_action: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseNumberedAnswers(rawAnswerText: string): Map<number, string> {
  const answers = new Map<number, string>();
  let currentIndex: number | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentIndex === null) return;
    const answer = currentLines.join('\n').trim();
    if (answer) answers.set(currentIndex, answer);
  };

  for (const line of rawAnswerText.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:(\d+)[.)]|ข้อ\s*(\d+))\s*(.*)$/i);
    if (match) {
      flush();
      currentIndex = Number(match[1] || match[2]) - 1;
      currentLines = [match[3] || ''];
    } else if (currentIndex !== null) {
      currentLines.push(line);
    }
  }

  flush();
  return answers;
}

function inferDisposition(answer: string | undefined): CustomerAnswerDisposition {
  if (!answer || !answer.trim()) return 'still_unclear';

  const text = normalize(answer);
  const waivedKeywords = [
    'ไม่เอา', 'ยังไม่ทำ', 'ไม่ทำ', 'ไม่รวม', 'ตัดออก', 'phase 2', 'เฟส 2', 'ภายหลัง', 'ทีหลัง', 'waive', 'skip', 'exclude', 'not include',
  ];
  const unclearKeywords = [
    'ยังไม่รู้', 'ยังไม่แน่ใจ', 'ไม่แน่ใจ', 'ขอดูก่อน', 'ค่อยตอบ', 'รอก่อน', 'tbd', 'not sure', 'later', 'pending',
  ];

  if (waivedKeywords.some(keyword => text.includes(keyword))) return 'waived';
  if (unclearKeywords.some(keyword => text.includes(keyword))) return 'still_unclear';
  return 'confirmed';
}

function findLooseAnswer(rawAnswerText: string, question: string): string | undefined {
  const text = normalize(rawAnswerText);
  const keywords = normalize(question)
    .split(' ')
    .filter(word => word.length >= 3)
    .slice(0, 4);

  if (keywords.length === 0) return undefined;
  const matched = keywords.filter(keyword => text.includes(keyword)).length;
  if (matched >= Math.min(2, keywords.length)) return rawAnswerText.trim();
  return undefined;
}

export function applyCustomerAnswers(input: CustomerAnswerApplyInput): CustomerAnswerApplyResult {
  const numberedAnswers = parseNumberedAnswers(input.rawAnswerText);
  const updatedQuestions = input.questions.map((item, index) => {
    const answer = numberedAnswers.get(index) || findLooseAnswer(input.rawAnswerText, item.question);
    const disposition = inferDisposition(answer);

    return {
      ...item,
      disposition,
      answer: answer || item.answer,
      note: disposition === 'waived' ? 'ลูกค้าตัดออก/เลื่อนไปภายหลังจากคำตอบล่าสุด' : item.note,
    };
  });

  const summary = summarizeCustomerAnswers(updatedQuestions);
  const recommendedNextAction = summary.all_closed
    ? 'คำถามค้างถูกปิดครบแล้ว ให้ประเมิน Scope Closure Gate ใหม่เพื่อดูว่าพร้อม quote หรือ lock baseline ได้หรือยัง'
    : `ยังมีคำถามที่ไม่ชัด ${summary.still_unclear_count} รายการ ควรถาม follow-up ก่อนเสนอราคา`;

  return {
    updated_questions: updatedQuestions,
    close_loop_checklist_markdown: buildCloseLoopChecklistMarkdown(updatedQuestions),
    summary,
    suggested_closure_input: {
      answeredQuestionCount: summary.confirmed_count,
      waivedQuestionCount: summary.waived_count,
    },
    recommended_next_action: recommendedNextAction,
  };
}

export function reevaluateGateWithCustomerAnswers(gate: ScopeClosureGateResult, answerResult: CustomerAnswerApplyResult): ScopeClosureGateResult {
  const allCriticalQuestionsClosed = answerResult.summary.all_closed;
  const blockingItems = gate.blocking_items.filter(item => !item.includes('คำถามก่อนเสนอราคา'));

  return {
    ...gate,
    scope_closure_status: allCriticalQuestionsClosed && blockingItems.length === 0 && gate.scope_closure_status !== 'locked'
      ? 'ready_for_quote'
      : allCriticalQuestionsClosed
        ? 'open'
        : 'needs_customer_answers',
    closure_score: Math.min(100, gate.closure_score + answerResult.summary.answered_or_waived_count * 8),
    blocking_items: allCriticalQuestionsClosed ? blockingItems : gate.blocking_items,
    recommended_next_action: allCriticalQuestionsClosed
      ? 'คำถามลูกค้าถูกปิดครบแล้ว ตรวจ Scope Control/Boundary/Acceptance อีกครั้งเพื่อเตรียม quotation'
      : answerResult.recommended_next_action,
    quote_ready_summary: allCriticalQuestionsClosed && blockingItems.length === 0
      ? gate.quote_ready_summary.replace('Scope ยังไม่พร้อม quote', 'Scope พร้อมตรวจ quote อีกครั้ง')
      : gate.quote_ready_summary,
    checklist: {
      ...gate.checklist,
      has_no_critical_questions: allCriticalQuestionsClosed,
    },
  };
}
