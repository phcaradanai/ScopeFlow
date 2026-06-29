import { buildBriefConversationState, appendBriefConversationAnswer, type BriefConversationState, type BriefConversationTurn } from './briefConversationLoop';
import { evaluateBriefReadiness } from './briefReadiness';
import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

export type DiscoverySessionStatus = 'collecting' | 'ready_for_brief' | 'ready_for_scope' | 'ready_for_quotation';

export interface DiscoverySession {
  id: string;
  clientId: string;
  projectId?: string;
  projectType: string;
  rawRequest: string;
  digest?: ScopeDigestOutput;
  conversation: BriefConversationState;
  status: DiscoverySessionStatus;
  nextActionLabel: string;
  canGenerateBrief: boolean;
  canGenerateScope: boolean;
  canGenerateQuotation: boolean;
  updatedAt: string;
}

export interface CreateDiscoverySessionInput {
  id?: string;
  clientId: string;
  projectId?: string;
  projectType?: string;
  rawRequest: string;
  digest?: ScopeDigestOutput;
  turns?: BriefConversationTurn[];
  now?: string;
}

function nowIso(now?: string): string {
  return now || new Date().toISOString();
}

function safeSessionId(clientId: string, projectId: string | undefined, rawRequest: string): string {
  const seed = `${clientId}-${projectId || 'new'}-${rawRequest}`.toLowerCase();
  const compact = seed.replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
  return compact || `discovery-${Date.now()}`;
}

function resolveStatus(conversation: BriefConversationState): DiscoverySessionStatus {
  if (conversation.readiness.shouldCreateQuotation) return 'ready_for_quotation';
  if (conversation.readiness.shouldCreateScopeDraft) return 'ready_for_scope';
  if (conversation.readiness.canCreateBriefDraft) return 'ready_for_brief';
  return 'collecting';
}

function nextActionLabel(sessionStatus: DiscoverySessionStatus, conversation: BriefConversationState): string {
  if (sessionStatus === 'ready_for_quotation') return 'Generate Brief, Scope, and Quotation';
  if (sessionStatus === 'ready_for_scope') return 'Generate Brief and Scope Draft';
  if (sessionStatus === 'ready_for_brief') return 'Generate Brief Draft and keep asking before Scope';
  if (conversation.nextQuestion) return conversation.nextQuestion.question;
  return 'Ask customer for more details before drafting';
}

export function createDiscoverySession(input: CreateDiscoverySessionInput): DiscoverySession {
  const conversation = buildBriefConversationState({
    rawRequest: input.rawRequest,
    projectType: input.projectType || 'อื่น ๆ',
    digest: input.digest,
    turns: input.turns || [],
  });
  const status = resolveStatus(conversation);

  return {
    id: input.id || safeSessionId(input.clientId, input.projectId, input.rawRequest),
    clientId: input.clientId,
    projectId: input.projectId,
    projectType: input.projectType || 'อื่น ๆ',
    rawRequest: input.rawRequest.trim(),
    digest: input.digest,
    conversation,
    status,
    nextActionLabel: nextActionLabel(status, conversation),
    canGenerateBrief: conversation.readiness.canCreateBriefDraft,
    canGenerateScope: conversation.readiness.shouldCreateScopeDraft,
    canGenerateQuotation: conversation.readiness.shouldCreateQuotation,
    updatedAt: nowIso(input.now),
  };
}

export function answerDiscoveryQuestion(
  session: DiscoverySession,
  answer: string,
  now?: string
): DiscoverySession {
  const nextConversation = appendBriefConversationAnswer(session.conversation, answer, session.digest);
  const status = resolveStatus(nextConversation);

  return {
    ...session,
    conversation: nextConversation,
    status,
    nextActionLabel: nextActionLabel(status, nextConversation),
    canGenerateBrief: nextConversation.readiness.canCreateBriefDraft,
    canGenerateScope: nextConversation.readiness.shouldCreateScopeDraft,
    canGenerateQuotation: nextConversation.readiness.shouldCreateQuotation,
    updatedAt: nowIso(now),
  };
}

export function refreshDiscoveryReadiness(session: DiscoverySession, digest?: ScopeDigestOutput, now?: string): DiscoverySession {
  const consolidated = session.conversation.consolidatedRequest;
  const readiness = evaluateBriefReadiness(consolidated, digest || session.digest);
  const conversation: BriefConversationState = {
    ...session.conversation,
    readiness,
    status: readiness.shouldCreateQuotation
      ? 'quotation_ready'
      : readiness.shouldCreateScopeDraft
        ? 'scope_ready'
        : readiness.canCreateBriefDraft
          ? 'brief_ready'
          : 'collecting',
  };
  const status = resolveStatus(conversation);

  return {
    ...session,
    digest: digest || session.digest,
    conversation,
    status,
    nextActionLabel: nextActionLabel(status, conversation),
    canGenerateBrief: readiness.canCreateBriefDraft,
    canGenerateScope: readiness.shouldCreateScopeDraft,
    canGenerateQuotation: readiness.shouldCreateQuotation,
    updatedAt: nowIso(now),
  };
}
