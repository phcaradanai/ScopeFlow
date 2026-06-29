import { evaluateBriefReadiness, type BriefReadinessResult, type BriefReadinessSignal } from './briefReadiness';
import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

export type BriefConversationRole = 'customer' | 'assistant' | 'user_note';
export type BriefConversationStatus = 'collecting' | 'brief_ready' | 'scope_ready' | 'quotation_ready';

export interface BriefConversationTurn {
  role: BriefConversationRole;
  content: string;
  createdAt?: string;
  sourceQuestionId?: string;
}

export interface BriefConversationQuestion {
  id: string;
  signalId: BriefReadinessSignal['id'];
  question: string;
  priority: number;
  answered: boolean;
}

export interface BriefConversationState {
  rawRequest: string;
  projectType: string;
  turns: BriefConversationTurn[];
  readiness: BriefReadinessResult;
  questions: BriefConversationQuestion[];
  nextQuestion: BriefConversationQuestion | null;
  status: BriefConversationStatus;
  consolidatedRequest: string;
}

export interface BriefConversationInput {
  rawRequest: string;
  projectType?: string;
  turns?: BriefConversationTurn[];
  digest?: ScopeDigestOutput;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function questionId(signalId: BriefReadinessSignal['id']): string {
  return `brief_q_${signalId}`;
}

function hasAnswerForSignal(signal: BriefReadinessSignal, turns: BriefConversationTurn[]): boolean {
  const directAnswer = turns.some(turn =>
    turn.role === 'customer' &&
    turn.sourceQuestionId === questionId(signal.id) &&
    turn.content.trim().length > 0
  );
  if (directAnswer) return true;

  const combinedCustomerText = normalize(turns.filter(turn => turn.role === 'customer').map(turn => turn.content).join(' '));
  return signal.evidence.some(evidence => combinedCustomerText.includes(normalize(evidence)));
}

function buildQuestions(readiness: BriefReadinessResult, turns: BriefConversationTurn[]): BriefConversationQuestion[] {
  return readiness.missingSignals.map(signal => {
    const id = questionId(signal.id);
    return {
      id,
      signalId: signal.id,
      question: signal.question,
      priority: signal.weight,
      answered: hasAnswerForSignal(signal, turns),
    };
  }).sort((a, b) => b.priority - a.priority);
}

function resolveStatus(readiness: BriefReadinessResult): BriefConversationStatus {
  if (readiness.shouldCreateQuotation) return 'quotation_ready';
  if (readiness.shouldCreateScopeDraft) return 'scope_ready';
  if (readiness.canCreateBriefDraft) return 'brief_ready';
  return 'collecting';
}

export function buildConsolidatedRequest(rawRequest: string, turns: BriefConversationTurn[] = []): string {
  const customerTurns = turns.filter(turn => turn.role === 'customer' || turn.role === 'user_note');
  if (customerTurns.length === 0) return rawRequest.trim();

  const additions = customerTurns
    .map(turn => `- ${turn.content.trim()}`)
    .filter(line => line.length > 2)
    .join('\n');

  return `${rawRequest.trim()}\n\nข้อมูลเพิ่มเติมจาก conversation:\n${additions}`.trim();
}

export function buildBriefConversationState(input: BriefConversationInput): BriefConversationState {
  const rawRequest = input.rawRequest.trim();
  const turns = input.turns || [];
  const consolidatedRequest = buildConsolidatedRequest(rawRequest, turns);
  const readiness = evaluateBriefReadiness(consolidatedRequest, input.digest);
  const questions = buildQuestions(readiness, turns);
  const nextQuestion = questions.find(question => !question.answered) || null;

  return {
    rawRequest,
    projectType: input.projectType || 'อื่น ๆ',
    turns,
    readiness,
    questions,
    nextQuestion,
    status: resolveStatus(readiness),
    consolidatedRequest,
  };
}

export function appendBriefConversationAnswer(
  state: BriefConversationState,
  answer: string,
  digest?: ScopeDigestOutput
): BriefConversationState {
  const turn: BriefConversationTurn = {
    role: 'customer',
    content: answer.trim(),
    sourceQuestionId: state.nextQuestion?.id,
  };

  return buildBriefConversationState({
    rawRequest: state.rawRequest,
    projectType: state.projectType,
    digest,
    turns: [...state.turns, turn],
  });
}
