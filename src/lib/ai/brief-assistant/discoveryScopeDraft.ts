import { generateScopeMarkdown, type ScopeFormData } from '../../scope-builder';
import type { DiscoverySession } from './discoverySession';

function list(items: string[]): string {
  const cleaned = Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
  return cleaned.length > 0 ? cleaned.map(item => `- ${item}`).join('\n') : '- ยังไม่มีข้อมูลเพียงพอ';
}

function collectAnswers(session: DiscoverySession): string[] {
  return session.conversation.turns
    .filter(turn => turn.role === 'customer' || turn.role === 'user_note')
    .map(turn => turn.content.trim())
    .filter(Boolean);
}

function signalEvidence(session: DiscoverySession, ids: string[]): string[] {
  return session.conversation.readiness.signals
    .filter(signal => signal.present && ids.includes(signal.id))
    .flatMap(signal => signal.evidence);
}

export function buildDiscoveryScopeFormData(session: DiscoverySession, projectId: string): ScopeFormData {
  const answers = collectAnswers(session);
  const featureEvidence = signalEvidence(session, ['features']);
  const platformEvidence = signalEvidence(session, ['platform']);
  const dataEvidence = signalEvidence(session, ['data']);
  const integrationEvidence = signalEvidence(session, ['integration']);
  const acceptanceEvidence = signalEvidence(session, ['acceptance']);
  const missing = session.conversation.readiness.missingSignals.map(signal => signal.label);

  return {
    title: `ขอบเขตงานจาก Discovery: ${projectId}`,
    project_overview: [
      session.rawRequest,
      `Discovery readiness: ${session.conversation.readiness.percent}% (${session.conversation.readiness.level})`,
      answers.length > 0 ? `ข้อมูลเพิ่มเติมจากลูกค้า:\n${list(answers)}` : '',
    ].filter(Boolean).join('\n\n'),
    included_items: list([
      ...featureEvidence,
      ...platformEvidence.map(item => `Platform: ${item}`),
      ...dataEvidence.map(item => `Data: ${item}`),
      ...integrationEvidence.map(item => `Integration: ${item}`),
    ]),
    excluded_items: list([
      ...missing.map(item => `ยังไม่รวม/ยังไม่ล็อก ${item} จนกว่าจะได้รับคำตอบจากลูกค้า`),
      ...(!session.canGenerateQuotation ? ['ยังไม่รวมการออก quotation ขั้นสุดท้ายจนกว่าข้อมูลเชิงพาณิชย์ครบ'] : []),
    ]),
    deliverables: list([
      'Brief จาก Discovery Session',
      'Scope Draft จาก Discovery Session',
      ...featureEvidence.map(item => `ส่งมอบส่วนงานที่รองรับ: ${item}`),
    ]),
    acceptance_criteria: list([
      ...acceptanceEvidence,
      ...(!acceptanceEvidence.length ? ['ต้องกำหนดเกณฑ์ตรวจรับร่วมกับลูกค้าก่อนอนุมัติ scope'] : []),
    ]),
    assumptions: list([
      `เอกสารนี้สร้างจาก Discovery Session ${session.id}`,
      `Project type: ${session.projectType}`,
      ...missing.map(item => `ข้อมูล ${item} ยังเป็นความเสี่ยงของ scope`),
    ]),
  };
}

export function buildDiscoveryScopeMarkdown(session: DiscoverySession, projectId: string): string {
  return generateScopeMarkdown(buildDiscoveryScopeFormData(session, projectId), `scope-discovery-${session.id}`);
}
