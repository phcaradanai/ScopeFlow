import { describe, expect, it } from 'vitest';
import { buildLifecycleExplanation } from '../lifecycleExplanation';
import { type DocumentLifecycleInput, buildDocumentLifecycleSummary } from '../documentLifecycle';

describe('buildLifecycleExplanation', () => {
  it('1. no brief', () => {
    const input: DocumentLifecycleInput = {};
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('เริ่มต้นการวิเคราะห์จากความต้องการของลูกค้า');
    expect(explanation.missingDocuments.map(d => d.label)).toContain('Brief (ยังไม่มีข้อสรุปขอบเขตงานเบื้องต้น)');
    expect(explanation.blockingReasons.length).toBeGreaterThan(0);
    expect(explanation.riskIfIgnored?.label).toContain('อาจทำงานไม่ตรง');
  });

  it('2. brief exists but no scope', () => {
    const input: DocumentLifecycleInput = { hasBrief: true };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('ต้องกำหนดขอบเขตงานอย่างละเอียดก่อนเสนอราคา');
    expect(explanation.evidence.map(d => d.label)).toContain('มี Brief แล้วพร้อมนำมาขยายผลเป็น Scope');
    expect(explanation.missingDocuments.map(d => d.label)).toContain('Scope (ขอบเขตงานโดยละเอียด)');
    expect(explanation.expectedNextState?.label).toContain('นำ Scope ไปเป็นฐาน');
  });

  it('3. quote approved but no baseline', () => {
    const input: DocumentLifecycleInput = { hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('สร้าง Baseline เพื่อตีกรอบขอบเขตงานที่จะยึดเป็นหลัก');
    expect(explanation.evidence.map(d => d.label)).toContain('ลูกค้าอนุมัติ Quotation แล้ว');
    expect(explanation.missingDocuments.map(d => d.label)).toContain('Scope Baseline (เส้นฐานขอบเขตงาน)');
  });

  it('4. CR approved but no change baseline', () => {
    const input: DocumentLifecycleInput = { 
      hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, 
      scopeBaselineReady: true, hasChangeRequest: true, changeRequestApproved: true 
    };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('บันทึกส่วนขยายของขอบเขตงานให้เป็นทางการ');
    expect(explanation.evidence.map(d => d.label)).toContain('ลูกค้าอนุมัติ Change Request แล้ว');
    expect(explanation.missingDocuments.map(d => d.label)).toContain('Change Baseline (เส้นฐานรวมสำหรับส่วนต่อขยาย)');
  });

  it('5. acceptance missing', () => {
    const input: DocumentLifecycleInput = { 
      hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, 
      scopeBaselineReady: true, hasChangeRequest: false 
    };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('เข้าสู่กระบวนการตรวจรับและส่งมอบงาน');
    expect(explanation.evidence.map(d => d.label)).toContain('มี Scope Baseline พร้อมอ้างอิง');
    expect(explanation.missingDocuments.map(d => d.label)).toContain('Acceptance (ใบตรวจรับที่เตรียมเสร็จสมบูรณ์)');
  });

  it('6. complete project', () => {
    const input: DocumentLifecycleInput = { 
      hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, 
      scopeBaselineReady: true, hasChangeRequest: false, 
      acceptanceReadyForSignoff: true, acceptanceSignedOff: true 
    };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('โปรเจกต์ส่งมอบครบถ้วนและสมบูรณ์');
    expect(explanation.evidence.map(d => d.label)).toContain('มี Acceptance ที่เซ็นรับงานแล้ว');
    expect(explanation.expectedNextState?.label).toBe('โปรเจกต์อยู่ในสถานะสมบูรณ์ (Completed)');
  });

  it('7. attaches sourcePath to evidence and missing items', () => {
    const input: DocumentLifecycleInput = { hasBrief: true, hasScope: true };
    const summary = buildDocumentLifecycleSummary(input);
    const files = [
      { path: '/projects/A/brief/brief.md', markdown: '' },
      { path: '/projects/A/scope/scope.md', markdown: '' }
    ];

    const explanation = buildLifecycleExplanation(input, summary, files);
    expect(explanation.headline).toBe('ต้องเสนอราคาและให้ลูกค้าอนุมัติเพื่อล็อกข้อตกลง');
    
    // evidence should have sourcePath
    const scopeEvidence = explanation.evidence.find(e => e.label.includes('Scope พร้อมใช้'));
    expect(scopeEvidence?.sourcePath).toBe('/projects/A/scope/scope.md');

    // missing should not have sourcePath for Quotation since it doesn't exist yet
    const quoteMissing = explanation.missingDocuments.find(e => e.label.includes('Quotation (ยังไม่มี'));
    expect(quoteMissing?.sourcePath).toBeUndefined();
  });
});
