import { describe, expect, it } from 'vitest';
import { buildLifecycleExplanation } from '../lifecycleExplanation';
import { type DocumentLifecycleInput, buildDocumentLifecycleSummary } from '../documentLifecycle';

describe('buildLifecycleExplanation', () => {
  it('1. no brief', () => {
    const input: DocumentLifecycleInput = {};
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('เริ่มต้นการวิเคราะห์จากความต้องการของลูกค้า');
    expect(explanation.missingDocuments).toContain('Brief (ยังไม่มีข้อสรุปขอบเขตงานเบื้องต้น)');
    expect(explanation.blockingReasons.length).toBeGreaterThan(0);
    expect(explanation.riskIfIgnored).toContain('อาจทำงานไม่ตรง');
  });

  it('2. brief exists but no scope', () => {
    const input: DocumentLifecycleInput = { hasBrief: true };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('ต้องกำหนดขอบเขตงานอย่างละเอียดก่อนเสนอราคา');
    expect(explanation.evidence).toContain('มี Brief แล้วพร้อมนำมาขยายผลเป็น Scope');
    expect(explanation.missingDocuments).toContain('Scope (ขอบเขตงานโดยละเอียด)');
    expect(explanation.expectedNextState).toContain('นำ Scope ไปเป็นฐาน');
  });

  it('3. quote approved but no baseline', () => {
    const input: DocumentLifecycleInput = { hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('สร้าง Baseline เพื่อตีกรอบขอบเขตงานที่จะยึดเป็นหลัก');
    expect(explanation.evidence).toContain('ลูกค้าอนุมัติ Quotation แล้ว');
    expect(explanation.missingDocuments).toContain('Scope Baseline (เส้นฐานขอบเขตงาน)');
  });

  it('4. CR approved but no change baseline', () => {
    const input: DocumentLifecycleInput = { 
      hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, 
      scopeBaselineReady: true, hasChangeRequest: true, changeRequestApproved: true 
    };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('บันทึกส่วนขยายของขอบเขตงานให้เป็นทางการ');
    expect(explanation.evidence).toContain('ลูกค้าอนุมัติ Change Request แล้ว');
    expect(explanation.missingDocuments).toContain('Change Baseline (เส้นฐานรวมสำหรับส่วนต่อขยาย)');
  });

  it('5. acceptance missing', () => {
    const input: DocumentLifecycleInput = { 
      hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, 
      scopeBaselineReady: true, hasChangeRequest: false 
    };
    const summary = buildDocumentLifecycleSummary(input);

    const explanation = buildLifecycleExplanation(input, summary);
    expect(explanation.headline).toBe('เข้าสู่กระบวนการตรวจรับและส่งมอบงาน');
    expect(explanation.evidence).toContain('มี Scope Baseline พร้อมอ้างอิง');
    expect(explanation.missingDocuments).toContain('Acceptance (ใบตรวจรับที่เตรียมเสร็จสมบูรณ์)');
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
    expect(explanation.evidence).toContain('มี Acceptance ที่เซ็นรับงานแล้ว');
    expect(explanation.expectedNextState).toBe('โปรเจกต์อยู่ในสถานะสมบูรณ์ (Completed)');
  });
});
