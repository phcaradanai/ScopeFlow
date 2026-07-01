import { describe, expect, it } from 'vitest';
import type { ProjectDocument } from '../document-scanner';
import { buildProjectReadinessGate } from '../project-readiness-gate';

function doc(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    file_path: `/project/${overrides.file_name || 'doc.md'}`,
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

const goodBrief = doc({
  type: 'brief',
  file_name: 'brief.md',
  markdown: '# Brief\n\n## เป้าหมาย\nลูกค้าต้องการระบบจองคิวเพื่อลดงานรับโทรศัพท์และวัดผลจากจำนวนคิวที่จองผ่านระบบ',
});

const goodScope = doc({
  type: 'scope',
  file_name: 'scope-v1.0.md',
  markdown: '# Scope\n\n## สิ่งที่รวมอยู่ใน Scope\n- ระบบจองคิว\n\n## Deliverables\n- Web app พร้อมคู่มือ\n\n## Acceptance Criteria\n- ลูกค้าจองคิวและได้รับแจ้งเตือนได้',
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
  evidence_files: ['quote-approved.png'],
});

describe('buildProjectReadinessGate', () => {
  it('starts at Ready for Brief when there is no Brief', () => {
    const gate = buildProjectReadinessGate([]);

    expect(gate.stage).toBe('ready_for_brief');
    expect(gate.primaryAction.kind).toBe('start_discovery');
    expect(gate.blockers.some(blocker => blocker.kind === 'missing_brief')).toBe(true);
  });

  it('blocks quotation when Scope lacks deliverables or acceptance criteria', () => {
    const weakScope = doc({
      type: 'scope',
      file_name: 'scope-v1.0.md',
      markdown: '# Scope\n\n## สิ่งที่รวมอยู่ใน Scope\n- ระบบจองคิว',
    });
    const gate = buildProjectReadinessGate([goodBrief, weakScope]);

    expect(gate.canQuote).toBe(false);
    expect(gate.stage).toBe('blocked');
    expect(gate.blockers.some(blocker => blocker.kind === 'weak_scope')).toBe(true);
    expect(gate.summary).toContain('ยังไม่ควรเสนอราคา');
  });

  it('is ready for Quote when Brief and Scope are good and there are no blockers', () => {
    const gate = buildProjectReadinessGate([goodBrief, goodScope]);

    expect(gate.stage).toBe('ready_for_quote');
    expect(gate.canQuote).toBe(true);
    expect(gate.primaryAction.documentType).toBe('quotation');
    expect(gate.primaryAction.label).toBe('สร้างใบเสนอราคา');
  });

  it('does not treat a Quote as approved without approval evidence', () => {
    const gate = buildProjectReadinessGate([goodBrief, goodScope, quote]);

    expect(gate.stage).toBe('ready_for_approval');
    expect(gate.blockers.some(blocker => blocker.kind === 'quote_not_approved')).toBe(true);
    expect(gate.canDeliver).toBe(false);
  });

  it('does not treat approved status or locked flag alone as approval evidence', () => {
    const approvedWithoutEvidence = doc({
      type: 'quotation',
      file_name: 'quotation-v1.0.md',
      status: 'approved',
      locked: true,
      markdown: '# ใบเสนอราคา',
    });
    const gate = buildProjectReadinessGate([goodBrief, goodScope, approvedWithoutEvidence]);

    expect(gate.stage).toBe('ready_for_approval');
    expect(gate.canDeliver).toBe(false);
    expect(gate.blockers.some(blocker => blocker.kind === 'quote_not_approved')).toBe(true);
  });

  it('blocks delivery when open follow-up or CR exists', () => {
    const followUp = doc({ type: 'followup', folder: 'support-requests', file_name: 'FW-001-question.md', status: 'draft' });
    const cr = doc({ type: 'change-request', folder: 'change-requests', file_name: 'CR-001-extra.md', status: 'draft' });
    const acceptance = doc({ type: 'acceptance', folder: 'acceptance', file_name: 'acceptance-checklist-v1.0.md', status: 'approved', locked: true, approved_by: 'Customer' });
    const gate = buildProjectReadinessGate([goodBrief, goodScope, quote, quoteApproval, acceptance, followUp, cr]);

    expect(gate.stage).toBe('blocked');
    expect(gate.canDeliver).toBe(false);
    expect(gate.blockers.some(blocker => blocker.kind === 'open_follow_up')).toBe(true);
    expect(gate.blockers.some(blocker => blocker.kind === 'open_change_request')).toBe(true);
  });

  it('is ready for delivery acceptance when quote is approved and no follow-up or CR is open', () => {
    const gate = buildProjectReadinessGate([goodBrief, goodScope, quote, quoteApproval]);

    expect(gate.stage).toBe('ready_for_delivery_acceptance');
    expect(gate.primaryAction.documentType).toBe('acceptance');
    expect(gate.primaryAction.label).toBe('เตรียมตรวจรับ/ส่งมอบ');
  });
});
