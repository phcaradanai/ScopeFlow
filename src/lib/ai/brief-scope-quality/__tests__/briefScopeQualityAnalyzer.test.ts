import { describe, expect, it } from 'vitest';
import { analyzeBriefScopeQualityDeterministically, buildScopeQualityImprovementDraft } from '../briefScopeQualityAnalyzer';

describe('analyzeBriefScopeQualityDeterministically', () => {
  it('flags missing customer information and scope risks for vague requests', () => {
    const analysis = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: '# Brief\nลูกค้าอยากให้ระบบดีขึ้นและรองรับทั้งหมดแบบด่วน ๆ',
      scopeMarkdown: '',
    });

    expect(analysis.readiness_score).toBeLessThan(60);
    expect(analysis.missing_info).toContain('ยังไม่มี Scope ที่แปลงคำขอลูกค้าเป็นขอบเขตงาน');
    expect(analysis.missing_info).toContain('ยังไม่มีเกณฑ์ตรวจรับงาน');
    expect(analysis.unclear_requirements.join(' ')).toContain('คำกว้าง');
    expect(analysis.scope_risks.join(' ')).toContain('scope บาน');
    expect(analysis.suggested_customer_questions.length).toBeGreaterThan(0);
  });

  it('gives a higher score when brief and scope contain practical working details', () => {
    const analysis = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: `# Brief\n\n## เป้าหมาย\nลูกค้าต้องการระบบจองคิวเพื่อลดงานรับโทรศัพท์\n\n## ผู้รับผิดชอบ\nคุณเอเป็นผู้อนุมัติ Scope และ Quote\n\n## Timeline\nต้องการใช้งานภายใน 30 วัน\n\n## Budget\nมีงบประมาณเบื้องต้น 80,000 บาท`,
      scopeMarkdown: `# Scope\n\n## สิ่งที่รวมอยู่ใน Scope\n- หน้าจอจองคิว\n- ระบบแจ้งเตือน\n\n## สิ่งที่ไม่รวมใน Scope\n- ระบบชำระเงิน\n\n## Deliverables\n- Web app พร้อมคู่มือ\n\n## Acceptance Criteria\n- ลูกค้าจองคิวและได้รับแจ้งเตือนได้\n\n## Assumptions\n- ลูกค้าจัดเตรียมข้อความแจ้งเตือน`,
    });

    expect(analysis.readiness_score).toBeGreaterThanOrEqual(80);
    expect(analysis.summary).toContain('พร้อม');
    expect(analysis.missing_info).not.toContain('ยังไม่มีเกณฑ์ตรวจรับงาน');
  });

  it('uses proposed update guard rails when the scope is approved or locked', () => {
    const analysis = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: '# Brief\nลูกค้าต้องการเพิ่มรายงาน',
      scopeMarkdown: '# Scope\n\n## Acceptance Criteria\nผ่านเมื่อรายงานเปิดได้',
      scopeStatus: 'approved',
      scopeLocked: true,
    });

    expect(analysis.guardrails.scope_update_mode).toBe('proposed_update_or_change_request');
    expect(analysis.guardrails.reason).toContain('approved/locked');
  });

  it('builds a proposed update draft without pretending it is approved', () => {
    const analysis = analyzeBriefScopeQualityDeterministically({
      briefMarkdown: '# Brief\nลูกค้าต้องการระบบจองคิว',
      scopeMarkdown: '',
    });
    const draft = buildScopeQualityImprovementDraft(analysis);

    expect(draft).toContain('Proposed Scope Quality Update');
    expect(draft).toContain('ยังไม่ใช่ approval หรือ customer confirmation');
    expect(draft).toContain('ข้อมูลที่ยังต้องถามลูกค้า');
  });
});
