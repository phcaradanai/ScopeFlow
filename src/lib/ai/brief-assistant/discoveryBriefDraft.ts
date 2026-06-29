import { generateBriefDocument } from '../../brief-builder';
import type { DiscoverySession } from './discoverySession';
import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

function collectCustomerAnswers(session: DiscoverySession): string[] {
  return session.conversation.turns
    .filter(turn => turn.role === 'customer' || turn.role === 'user_note')
    .map(turn => turn.content.trim())
    .filter(Boolean);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

export function buildDiscoveryDigest(session: DiscoverySession): ScopeDigestOutput {
  const answers = collectCustomerAnswers(session);
  const readiness = session.conversation.readiness;
  const presentSignals = readiness.signals.filter(signal => signal.present);
  const missingSignals = readiness.missingSignals;

  return {
    detected_project_type: session.projectType,
    confidence: readiness.level === 'draft_ready' ? 'high' : readiness.level === 'needs_questions' ? 'medium' : 'low',
    understanding: unique([
      `ลูกค้าเริ่มจากคำขอ: ${session.rawRequest}`,
      `Discovery readiness: ${readiness.percent}% (${readiness.level})`,
    ]),
    confirmed_facts: unique([
      ...answers,
      ...presentSignals.flatMap(signal => signal.evidence.slice(0, 3).map(evidence => `${signal.label}: ${evidence}`)),
    ]),
    assumptions: unique([
      `เอกสารนี้สร้างจาก Discovery Session ${session.id}`,
      `Project type: ${session.projectType}`,
    ]),
    unclear_points: unique(missingSignals.map(signal => signal.label)),
    questions_to_ask: unique(readiness.suggestedQuestions),
    likely_in_scope: unique(presentSignals
      .filter(signal => ['features', 'platform', 'integration', 'data'].includes(signal.id))
      .flatMap(signal => signal.evidence.slice(0, 4))),
    likely_out_of_scope: unique([
      ...missingSignals.map(signal => `ยังไม่ล็อก ${signal.label} จนกว่าจะได้รับคำตอบจากลูกค้า`),
    ]),
    scope_creep_risks: unique([
      ...missingSignals.map(signal => `ข้อมูล ${signal.label} ยังไม่ชัด อาจทำให้ scope หรือ quotation คลาดเคลื่อน`),
      ...(!session.canGenerateQuotation ? ['ยังไม่ควรออก quotation จนกว่าจะมีข้อมูล budget/timeline/acceptance เพียงพอ'] : []),
    ]),
    suggested_next_documents: unique([
      'Brief',
      ...(session.canGenerateScope ? ['Scope'] : []),
      ...(session.canGenerateQuotation ? ['Quotation'] : []),
    ]),
    is_fallback: true,
  };
}

export function buildDiscoveryBriefMarkdown(session: DiscoverySession, clientId: string, projectId: string): string {
  const digest = buildDiscoveryDigest(session);
  return generateBriefDocument({
    raw_request: session.conversation.consolidatedRequest,
    project_type: session.projectType,
    project: projectId,
    client: clientId,
    projectName: projectId,
    ai_digest: digest,
  });
}
