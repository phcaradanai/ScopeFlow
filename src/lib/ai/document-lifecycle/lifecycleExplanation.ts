import { type DocumentLifecycleInput, type DocumentLifecycleSummary } from './documentLifecycle';

export interface LifecycleExplanation {
  headline: string;
  evidence: string[];
  missingDocuments: string[];
  blockingReasons: string[];
  riskIfIgnored: string;
  expectedNextState: string;
}

export function buildLifecycleExplanation(
  input: DocumentLifecycleInput,
  summary: DocumentLifecycleSummary
): LifecycleExplanation {
  const explanation: LifecycleExplanation = {
    headline: '',
    evidence: [],
    missingDocuments: [],
    blockingReasons: [],
    riskIfIgnored: '',
    expectedNextState: '',
  };

  if (summary.can_close_work) {
    explanation.headline = 'โปรเจกต์ส่งมอบครบถ้วนและสมบูรณ์';
    explanation.evidence.push('มี Acceptance ที่เซ็นรับงานแล้ว');
    explanation.evidence.push('เอกสารอื่นๆ ไม่ติด Blocker');
    explanation.riskIfIgnored = 'ไม่มีความเสี่ยง สามารถเก็บเป็น Archive หรือส่งมอบ Source Code ต่อได้';
    explanation.expectedNextState = 'โปรเจกต์อยู่ในสถานะสมบูรณ์ (Completed)';
    return explanation;
  }

  if (!input.hasBrief) {
    explanation.headline = 'เริ่มต้นการวิเคราะห์จากความต้องการของลูกค้า';
    explanation.missingDocuments.push('Brief (ยังไม่มีข้อสรุปขอบเขตงานเบื้องต้น)');
    explanation.blockingReasons.push('ยังไม่มีจุดตั้งต้นในการประเมินราคาและขอบเขต');
    explanation.riskIfIgnored = 'อาจทำงานไม่ตรงกับความต้องการของลูกค้า และไม่สามารถประเมิน Scope ต่อได้';
    explanation.expectedNextState = 'เมื่อมี Brief จะสามารถสร้าง Scope และประเมินราคาได้';
  } else if (!input.hasScope) {
    explanation.headline = 'ต้องกำหนดขอบเขตงานอย่างละเอียดก่อนเสนอราคา';
    if (input.hasBrief) explanation.evidence.push('มี Brief แล้วพร้อมนำมาขยายผลเป็น Scope');
    explanation.missingDocuments.push('Scope (ขอบเขตงานโดยละเอียด)');
    explanation.blockingReasons.push('ต้องรู้ In-scope และ Out-of-scope เพื่อกันการเกิดปัญหา Scope Creep');
    explanation.riskIfIgnored = 'ถ้ารับงานโดยไม่มี Scope จะมีความเสี่ยงเรื่องงานบานปลายและการประเมินราคาที่ผิดพลาด';
    explanation.expectedNextState = 'นำ Scope ไปเป็นฐานในการทำ Quotation ได้อย่างมั่นใจ';
  } else if (!input.hasQuotation || !input.quotationApproved) {
    explanation.headline = 'ต้องเสนอราคาและให้ลูกค้าอนุมัติเพื่อล็อกข้อตกลง';
    if (input.hasScope) explanation.evidence.push('มี Scope พร้อมใช้ตั้งเป็นฐานราคา');
    if (!input.hasQuotation) {
      explanation.missingDocuments.push('Quotation (ยังไม่มีใบเสนอราคา)');
      explanation.blockingReasons.push('ยังไม่สามารถเริ่มงานได้หากลูกค้ายังไม่เห็นชอบในราคาและเงื่อนไข');
      explanation.expectedNextState = 'ส่งใบเสนอราคาให้ลูกค้าพิจารณา';
    } else {
      explanation.missingDocuments.push('Quotation Approval (ยังไม่ได้รับการอนุมัติ)');
      explanation.blockingReasons.push('ต้องมีหลักฐานว่าลูกค้ายอมรับ Quotation เพื่อสร้าง Scope Baseline');
      explanation.expectedNextState = 'ลูกค้าอนุมัติเพื่อสามารถตั้ง Scope Baseline ล็อกขอบเขตงานได้';
    }
    explanation.riskIfIgnored = 'เริ่มงานโดยลูกค้ายังไม่เห็นด้วยกับราคา อาจทำให้ไม่ได้เงินตามตกลงหรือเกิดข้อพิพาท';
  } else if (!input.scopeBaselineReady) {
    explanation.headline = 'สร้าง Baseline เพื่อตีกรอบขอบเขตงานที่จะยึดเป็นหลัก';
    if (input.quotationApproved) explanation.evidence.push('ลูกค้าอนุมัติ Quotation แล้ว');
    explanation.missingDocuments.push('Scope Baseline (เส้นฐานขอบเขตงาน)');
    explanation.blockingReasons.push('ต้องนำ Quotation ที่อนุมัติมาแช่แข็ง (Freeze) เป็น Scope Baseline เพื่ออ้างอิงตอนจบงาน');
    explanation.riskIfIgnored = 'ไม่มีหลักฐานแช่แข็งขอบเขต หากลูกค้าเปลี่ยนใจจะไม่มีเอกสารอ้างอิงสถานะที่ตกลงกันไว้';
    explanation.expectedNextState = 'สามารถเริ่มส่งมอบงาน หรือรับมือกับ Change Request (CR) ได้อย่างมีระบบ';
  } else if (input.hasChangeRequest && !input.changeBaselineReady) {
    if (!input.changeRequestApproved) {
      explanation.headline = 'รอลูกค้าอนุมัติการขอเปลี่ยนขอบเขตงาน';
      explanation.evidence.push('มีการยื่น Change Request');
      explanation.missingDocuments.push('CR Approval (ลูกค้ายืนยันอนุมัติให้เปลี่ยนขอบเขต)');
      explanation.blockingReasons.push('ต้องรอลูกค้าอนุมัติก่อนทำ Change Baseline');
      explanation.riskIfIgnored = 'หากทำงานเกิน Scope Baseline โดยไม่มี CR จะกลายเป็น Scope Creep ฟรีโดยไม่ได้รับเงินหรือเวลาเพิ่ม';
      explanation.expectedNextState = 'เมื่อลูกค้าอนุมัติ จะสามารถสร้าง Change Baseline เพื่ออัปเดตกรอบเวลาหรือราคาใหม่ได้';
    } else {
      explanation.headline = 'บันทึกส่วนขยายของขอบเขตงานให้เป็นทางการ';
      explanation.evidence.push('ลูกค้าอนุมัติ Change Request แล้ว');
      explanation.missingDocuments.push('Change Baseline (เส้นฐานรวมสำหรับส่วนต่อขยาย)');
      explanation.blockingReasons.push('ต้องล็อก Change Request ให้เป็น Baseline เพื่อใช้ตรวจสอบการรับมอบงานตอนท้าย');
      explanation.riskIfIgnored = 'ถ้างบประมาณ/เวลาถูกขยายแต่ไม่มี Change Baseline ตอนตรวจรับงานจะเกิดความสับสนระหว่างงานเก่ากับงานใหม่';
      explanation.expectedNextState = 'นำ Change Baseline ไปใช้รวมกับการตรวจรับใน Acceptance ได้ครบถ้วน';
    }
  } else if (!input.acceptanceSignedOff) {
    explanation.headline = 'เข้าสู่กระบวนการตรวจรับและส่งมอบงาน';
    if (input.scopeBaselineReady) explanation.evidence.push('มี Scope Baseline พร้อมอ้างอิง');
    if (input.changeBaselineReady) explanation.evidence.push('มี Change Baseline พร้อมอ้างอิงส่วนขยาย');
    if (!input.acceptanceReadyForSignoff) {
      explanation.missingDocuments.push('Acceptance (ใบตรวจรับที่เตรียมเสร็จสมบูรณ์)');
      explanation.blockingReasons.push('ต้องสรุปรายการส่งมอบ (Deliverables) ให้ลูกค้าตรวจเช็คให้เรียบร้อย');
      explanation.expectedNextState = 'ส่ง Acceptance ให้ลูกค้าตรวจและ Sign-off เพื่อปิดงาน';
    } else {
      explanation.missingDocuments.push('Acceptance Sign-off (ลายเซ็นรับงานจากลูกค้า)');
      explanation.blockingReasons.push('ต้องมีลายเซ็นรับมอบเพื่อยืนยันว่าโปรเจกต์สิ้นสุดแล้วตามขอบเขต');
      explanation.expectedNextState = 'งานนี้จะถูกปิดอย่างสมบูรณ์';
    }
    explanation.riskIfIgnored = 'ถ้าไม่เซ็นรับงาน จะไม่มีหลักฐานยืนยันการสิ้นสุดภาระผูกพัน เสี่ยงต่อการถูกเรียกร้องให้แก้เรื่อยๆ';
  } else {
    // Fallback if none match
    explanation.headline = summary.next_action || 'จัดการเอกสารรอบนี้ให้สมบูรณ์';
    explanation.riskIfIgnored = 'ทำให้ระบบ Lifecycle ไม่สามารถช่วยตรวจสอบสถานะโปรเจกต์ต่อได้';
    explanation.expectedNextState = 'ปลดล็อกสถานะเพื่อทำงานสเตจถัดไป';
  }

  return explanation;
}
