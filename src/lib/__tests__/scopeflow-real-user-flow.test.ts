import { describe, expect, it } from 'vitest';
import type { ProjectDocument } from '../document-scanner';
import { analyzeBriefScopeQualityDeterministically } from '../ai/brief-scope-quality/briefScopeQualityAnalyzer';
import { decideFollowUpAnswerDeterministically } from '../ai/follow-up/followUpAnswerDecision';
import { mergeDocumentDeterministically } from '../ai/documentMergeAssistant';
import { getDocumentCreationIntentForType, getDocumentCreationTitleMissingMessage, requiresDocumentCreationTitle } from '../document-creation-guidance';
import { buildProjectReadinessGate } from '../project-readiness-gate';
import { t } from '../i18n/copy';

function doc(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    file_path: `/workspace/clients/acme/projects/booking/${overrides.file_name || 'doc.md'}`,
    file_name: overrides.file_name || 'doc.md',
    folder: overrides.folder || 'baseline',
    type: overrides.type || 'brief',
    title: overrides.title || overrides.file_name || 'Document',
    status: overrides.status || 'draft',
    version: overrides.version || '1.0',
    locked: overrides.locked || false,
    excerpt: overrides.excerpt || '',
    markdown: overrides.markdown || '',
    parse_status: 'success',
    ...overrides,
  };
}

const brief = doc({
  type: 'brief',
  file_name: 'brief.md',
  markdown: '# Brief\n\n## เป้าหมาย\nลูกค้าต้องการระบบจองคิวเพื่อลดงานรับโทรศัพท์และวัดผลจากจำนวนคิวที่จองผ่านระบบ\n\n## ข้อมูลลูกค้า\nผู้อนุมัติคือคุณเอ และต้องการใช้งานภายในสิ้นเดือนนี้',
});

const scope = doc({
  type: 'scope',
  file_name: 'scope-v1.0.md',
  markdown: '# Scope\n\n## สิ่งที่รวมอยู่ใน Scope\n- ระบบจองคิว\n- แจ้งเตือนลูกค้า\n\n## สิ่งที่ไม่รวมใน Scope\n- ระบบบัญชี\n\n## Deliverables\n- Web app พร้อมคู่มือ\n\n## Acceptance Criteria\n- ลูกค้าจองคิวและได้รับแจ้งเตือนได้\n- Admin เห็นรายการจองคิวได้',
});

const quote = doc({
  type: 'quotation',
  file_name: 'quotation-v1.0.md',
  status: 'draft',
  markdown: '# ใบเสนอราคา',
});

const quoteApproval = doc({
  type: 'approval-record',
  folder: 'approvals',
  file_name: 'APP-001-quotation.md',
  status: 'recorded',
  approval_number: 'APP-001',
  approved_document: 'quotation-v1.0.md',
  document_type: 'quotation',
  approved_by: 'Customer',
  approved_date: '2026-07-01',
  evidence_files: ['line-approval.png'],
});

const acceptance = doc({
  type: 'acceptance',
  folder: 'acceptance',
  file_name: 'acceptance-checklist-v1.0.md',
  status: 'draft',
  markdown: '# Acceptance\n\n## Checklist\n- [ ] จองคิวได้\n- [ ] Admin เห็นรายการจองได้',
});

describe('ScopeFlow real user flow regression', () => {
  it('walks the guided flow without skipping blockers or unsafe approval assumptions', () => {
    const emptyGate = buildProjectReadinessGate([]);
    expect(emptyGate.stage).toBe('ready_for_brief');
    expect(emptyGate.primaryAction.kind).toBe('start_discovery');

    const qualityFromVagueRequest = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: '# คำขอลูกค้า\n\nอยากได้ระบบจองคิวแบบเร็ว ๆ รองรับทั้งหมด',
      scopeMarkdown: '',
    });
    expect(qualityFromVagueRequest.suggested_customer_questions.length).toBeGreaterThan(0);
    expect(qualityFromVagueRequest.scope_risks.join(' ')).toContain('scope บาน');

    const scopeIntent = getDocumentCreationIntentForType('scope');
    expect(scopeIntent?.cta).toBe('สร้าง Scope');

    const qualityFromBriefAndScope = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: brief.markdown,
      scopeMarkdown: scope.markdown,
    });
    expect(qualityFromBriefAndScope.readiness_score).toBeGreaterThanOrEqual(70);

    const followUpIntent = getDocumentCreationIntentForType('followup');
    expect(followUpIntent?.title).toContain('ติดตามคำตอบ');
    expect(requiresDocumentCreationTitle('followup')).toBe(true);
    expect(getDocumentCreationTitleMissingMessage('followup')).toContain('Follow-up');

    const answerDecision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้าตอบว่าต้องรวม deploy และส่งมอบคู่มือการใช้งานด้วย',
      briefMarkdown: brief.markdown,
      scopeMarkdown: scope.markdown,
      scopeStatus: 'draft',
    });
    expect(answerDecision.recommended_action).toBe('update_scope');
    expect(answerDecision.guardrails.can_update_scope).toBe(true);

    const lockedScopeDecision = decideFollowUpAnswerDeterministically({
      answer: 'ลูกค้าขอเพิ่มรายงานยอดขายรายวันอีกหนึ่งหน้า',
      briefMarkdown: brief.markdown,
      scopeMarkdown: scope.markdown,
      scopeStatus: 'approved',
      scopeLocked: true,
    });
    expect(lockedScopeDecision.recommended_action).toBe('create_change_request');
    expect(lockedScopeDecision.guardrails.should_create_change_request).toBe(true);

    const merged = mergeDocumentDeterministically(
      '---\ntype: scope\nstatus: approved\nlocked: true\napproval_ref: APP-001\n---\n# Scope\n\n## Acceptance Criteria\n- Admin เห็นรายการจองได้',
      '## Proposed Update\n- เพิ่มรายงานยอดขายรายวัน',
      'Scope follow-up update'
    );
    expect(merged).toContain('approval_ref: APP-001');
    expect(merged).toContain('Review before treating this as approved customer scope');
    expect(merged).toContain('เพิ่มรายงานยอดขายรายวัน');

    const quoteGate = buildProjectReadinessGate([brief, scope]);
    expect(quoteGate.stage).toBe('ready_for_quote');
    expect(quoteGate.primaryAction.label).toBe('สร้างใบเสนอราคา');

    const openFollowUp = doc({ type: 'followup', folder: 'support-requests', file_name: 'FW-001-quality-question.md', status: 'draft' });
    const blockedByFollowUp = buildProjectReadinessGate([brief, scope, openFollowUp]);
    expect(blockedByFollowUp.stage).toBe('blocked');
    expect(blockedByFollowUp.readyLabel).toBe('ยังติดคำตอบลูกค้า');

    const answeredFollowUp = { ...openFollowUp, status: 'answered' };
    const approvalGate = buildProjectReadinessGate([brief, scope, quote, answeredFollowUp]);
    expect(approvalGate.stage).toBe('ready_for_approval');
    expect(approvalGate.canDeliver).toBe(false);

    const deliveryGate = buildProjectReadinessGate([brief, scope, quote, quoteApproval, answeredFollowUp]);
    expect(deliveryGate.stage).toBe('ready_for_delivery_acceptance');
    expect(deliveryGate.primaryAction.label).toBe('เตรียมตรวจรับ/ส่งมอบ');

    const openCr = doc({ type: 'cr', folder: 'change-requests', file_name: 'CR-001-extra-report.md', status: 'draft' });
    const blockedDelivery = buildProjectReadinessGate([brief, scope, quote, quoteApproval, acceptance, openCr]);
    expect(blockedDelivery.stage).toBe('blocked');
    expect(blockedDelivery.readyLabel).toBe('มี Change Request ที่ยังไม่ปิด');
  });

  it('keeps core Thai-first copy available for the stabilized flow', () => {
    expect(t('quality.readyForQuote')).toBe('พร้อมเสนอราคา');
    expect(t('quality.openFollowUp')).toBe('ยังติดคำตอบลูกค้า');
    expect(t('quality.createChangeRequestInstead')).toBe('สร้าง Change Request แทนการแก้ Scope เดิม');
    expect(t('conflict.actions.safeMergeTitle')).toBe('รวมข้อมูลอย่างปลอดภัย');
  });
});
