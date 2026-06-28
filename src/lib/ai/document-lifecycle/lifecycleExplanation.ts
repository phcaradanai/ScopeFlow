import { type DocumentLifecycleInput, type DocumentLifecycleSummary } from './documentLifecycle';
import { type LifecycleScanFile } from './documentLifecycleFileScan';
import type { DocumentLifecycleActionTarget } from './documentLifecycleAction';

export interface LifecycleExplanationItem {
  label: string;
  kind: 'evidence' | 'missing' | 'blocker' | 'risk' | 'expected';
  sourcePath?: string;
  actionLabel?: string;
}

export interface LifecycleExplanation {
  headline: string;
  evidence: LifecycleExplanationItem[];
  missingDocuments: LifecycleExplanationItem[];
  blockingReasons: LifecycleExplanationItem[];
  riskIfIgnored?: LifecycleExplanationItem;
  expectedNextState?: LifecycleExplanationItem;
}

function normalize(path: string): string {
  return path.toLowerCase().replace(/\\/g, '/');
}

function findNewestFile(files: LifecycleScanFile[], predicate: (path: string) => boolean): string | undefined {
  const matches = files.filter(f => predicate(normalize(f.path)));
  if (matches.length === 0) return undefined;
  return matches.sort((a, b) => normalize(b.path).localeCompare(normalize(a.path)))[0].path;
}

export function buildLifecycleExplanation(
  input: DocumentLifecycleInput,
  summary: DocumentLifecycleSummary,
  scanFiles: LifecycleScanFile[] = [],
  actionTarget?: DocumentLifecycleActionTarget
): LifecycleExplanation {
  const explanation: LifecycleExplanation = {
    headline: '',
    evidence: [],
    missingDocuments: [],
    blockingReasons: [],
  };

  const briefPath = findNewestFile(scanFiles, p => p.includes('brief'));
  const scopePath = findNewestFile(scanFiles, p => p.includes('scope'));
  const quotePath = findNewestFile(scanFiles, p => p.includes('quotation') || p.includes('quote'));
  const crPath = findNewestFile(scanFiles, p => p.includes('/changes/') || p.includes('change-request'));
  const acceptancePath = findNewestFile(scanFiles, p => p.includes('/acceptance/'));

  if (summary.can_close_work) {
    explanation.headline = 'โปรเจกต์ส่งมอบครบถ้วนและสมบูรณ์';
    explanation.evidence.push({ label: 'มี Acceptance ที่เซ็นรับงานแล้ว', kind: 'evidence', sourcePath: acceptancePath, actionLabel: 'เปิด Acceptance' });
    explanation.evidence.push({ label: 'เอกสารอื่นๆ ไม่ติด Blocker', kind: 'evidence' });
    explanation.riskIfIgnored = { label: 'ไม่มีความเสี่ยง สามารถเก็บเป็น Archive หรือส่งมอบ Source Code ต่อได้', kind: 'risk' };
    explanation.expectedNextState = { label: 'โปรเจกต์อยู่ในสถานะสมบูรณ์ (Completed)', kind: 'expected' };
    return explanation;
  }

  if (!input.hasBrief) {
    explanation.headline = 'เริ่มต้นการวิเคราะห์จากความต้องการของลูกค้า';
    explanation.missingDocuments.push({ label: 'Brief (ยังไม่มีข้อสรุปขอบเขตงานเบื้องต้น)', kind: 'missing' });
    explanation.blockingReasons.push({ label: 'ยังไม่มีจุดตั้งต้นในการประเมินราคาและขอบเขต', kind: 'blocker' });
    explanation.riskIfIgnored = { label: 'อาจทำงานไม่ตรงกับความต้องการของลูกค้า และไม่สามารถประเมิน Scope ต่อได้', kind: 'risk' };
    explanation.expectedNextState = { label: 'เมื่อมี Brief จะสามารถสร้าง Scope และประเมินราคาได้', kind: 'expected' };
  } else if (!input.hasScope) {
    explanation.headline = 'ต้องกำหนดขอบเขตงานอย่างละเอียดก่อนเสนอราคา';
    if (input.hasBrief) explanation.evidence.push({ label: 'มี Brief แล้วพร้อมนำมาขยายผลเป็น Scope', kind: 'evidence', sourcePath: briefPath, actionLabel: 'เปิด Brief' });
    explanation.missingDocuments.push({ label: 'Scope (ขอบเขตงานโดยละเอียด)', kind: 'missing' });
    explanation.blockingReasons.push({ label: 'ต้องรู้ In-scope และ Out-of-scope เพื่อกันการเกิดปัญหา Scope Creep', kind: 'blocker' });
    explanation.riskIfIgnored = { label: 'ถ้ารับงานโดยไม่มี Scope จะมีความเสี่ยงเรื่องงานบานปลายและการประเมินราคาที่ผิดพลาด', kind: 'risk' };
    explanation.expectedNextState = { label: 'นำ Scope ไปเป็นฐานในการทำ Quotation ได้อย่างมั่นใจ', kind: 'expected' };
  } else if (!input.hasQuotation || !input.quotationApproved) {
    explanation.headline = 'ต้องเสนอราคาและให้ลูกค้าอนุมัติเพื่อล็อกข้อตกลง';
    if (input.hasScope) explanation.evidence.push({ label: 'มี Scope พร้อมใช้ตั้งเป็นฐานราคา', kind: 'evidence', sourcePath: scopePath, actionLabel: 'เปิด Scope' });
    if (!input.hasQuotation) {
      explanation.missingDocuments.push({ label: 'Quotation (ยังไม่มีใบเสนอราคา)', kind: 'missing' });
      explanation.blockingReasons.push({ label: 'ยังไม่สามารถเริ่มงานได้หากลูกค้ายังไม่เห็นชอบในราคาและเงื่อนไข', kind: 'blocker' });
      explanation.expectedNextState = { label: 'ส่งใบเสนอราคาให้ลูกค้าพิจารณา', kind: 'expected' };
    } else {
      explanation.missingDocuments.push({ label: 'Quotation Approval (ยังไม่ได้รับการอนุมัติ)', kind: 'missing', sourcePath: actionTarget?.file_path || quotePath, actionLabel: 'เปิด Quotation' });
      explanation.blockingReasons.push({ label: 'ต้องมีหลักฐานว่าลูกค้ายอมรับ Quotation เพื่อสร้าง Scope Baseline', kind: 'blocker' });
      explanation.expectedNextState = { label: 'ลูกค้าอนุมัติเพื่อสามารถตั้ง Scope Baseline ล็อกขอบเขตงานได้', kind: 'expected' };
    }
    explanation.riskIfIgnored = { label: 'เริ่มงานโดยลูกค้ายังไม่เห็นด้วยกับราคา อาจทำให้ไม่ได้เงินตามตกลงหรือเกิดข้อพิพาท', kind: 'risk' };
  } else if (!input.scopeBaselineReady) {
    explanation.headline = 'สร้าง Baseline เพื่อตีกรอบขอบเขตงานที่จะยึดเป็นหลัก';
    if (input.quotationApproved) explanation.evidence.push({ label: 'ลูกค้าอนุมัติ Quotation แล้ว', kind: 'evidence', sourcePath: quotePath, actionLabel: 'เปิด Quotation' });
    explanation.missingDocuments.push({ label: 'Scope Baseline (เส้นฐานขอบเขตงาน)', kind: 'missing', sourcePath: actionTarget?.file_path, actionLabel: 'สร้าง Baseline' });
    explanation.blockingReasons.push({ label: 'ต้องนำ Quotation ที่อนุมัติมาแช่แข็ง (Freeze) เป็น Scope Baseline เพื่ออ้างอิงตอนจบงาน', kind: 'blocker' });
    explanation.riskIfIgnored = { label: 'ไม่มีหลักฐานแช่แข็งขอบเขต หากลูกค้าเปลี่ยนใจจะไม่มีเอกสารอ้างอิงสถานะที่ตกลงกันไว้', kind: 'risk' };
    explanation.expectedNextState = { label: 'สามารถเริ่มส่งมอบงาน หรือรับมือกับ Change Request (CR) ได้อย่างมีระบบ', kind: 'expected' };
  } else if (input.hasChangeRequest && !input.changeBaselineReady) {
    if (!input.changeRequestApproved) {
      explanation.headline = 'รอลูกค้าอนุมัติการขอเปลี่ยนขอบเขตงาน';
      explanation.evidence.push({ label: 'มีการยื่น Change Request', kind: 'evidence', sourcePath: crPath, actionLabel: 'เปิด CR' });
      explanation.missingDocuments.push({ label: 'CR Approval (ลูกค้ายืนยันอนุมัติให้เปลี่ยนขอบเขต)', kind: 'missing' });
      explanation.blockingReasons.push({ label: 'ต้องรอลูกค้าอนุมัติก่อนทำ Change Baseline', kind: 'blocker' });
      explanation.riskIfIgnored = { label: 'หากทำงานเกิน Scope Baseline โดยไม่มี CR จะกลายเป็น Scope Creep ฟรีโดยไม่ได้รับเงินหรือเวลาเพิ่ม', kind: 'risk' };
      explanation.expectedNextState = { label: 'เมื่อลูกค้าอนุมัติ จะสามารถสร้าง Change Baseline เพื่ออัปเดตกรอบเวลาหรือราคาใหม่ได้', kind: 'expected' };
    } else {
      explanation.headline = 'บันทึกส่วนขยายของขอบเขตงานให้เป็นทางการ';
      explanation.evidence.push({ label: 'ลูกค้าอนุมัติ Change Request แล้ว', kind: 'evidence', sourcePath: crPath, actionLabel: 'เปิด CR' });
      explanation.missingDocuments.push({ label: 'Change Baseline (เส้นฐานรวมสำหรับส่วนต่อขยาย)', kind: 'missing', sourcePath: actionTarget?.file_path, actionLabel: 'สร้าง Change Baseline' });
      explanation.blockingReasons.push({ label: 'ต้องล็อก Change Request ให้เป็น Baseline เพื่อใช้ตรวจสอบการรับมอบงานตอนท้าย', kind: 'blocker' });
      explanation.riskIfIgnored = { label: 'ถ้างบประมาณ/เวลาถูกขยายแต่ไม่มี Change Baseline ตอนตรวจรับงานจะเกิดความสับสนระหว่างงานเก่ากับงานใหม่', kind: 'risk' };
      explanation.expectedNextState = { label: 'นำ Change Baseline ไปใช้รวมกับการตรวจรับใน Acceptance ได้ครบถ้วน', kind: 'expected' };
    }
  } else if (!input.acceptanceSignedOff) {
    explanation.headline = 'เข้าสู่กระบวนการตรวจรับและส่งมอบงาน';
    if (input.scopeBaselineReady) explanation.evidence.push({ label: 'มี Scope Baseline พร้อมอ้างอิง', kind: 'evidence' });
    if (input.changeBaselineReady) explanation.evidence.push({ label: 'มี Change Baseline พร้อมอ้างอิงส่วนขยาย', kind: 'evidence' });
    if (!input.acceptanceReadyForSignoff) {
      explanation.missingDocuments.push({ label: 'Acceptance (ใบตรวจรับที่เตรียมเสร็จสมบูรณ์)', kind: 'missing' });
      explanation.blockingReasons.push({ label: 'ต้องสรุปรายการส่งมอบ (Deliverables) ให้ลูกค้าตรวจเช็คให้เรียบร้อย', kind: 'blocker' });
      explanation.expectedNextState = { label: 'ส่ง Acceptance ให้ลูกค้าตรวจและ Sign-off เพื่อปิดงาน', kind: 'expected' };
    } else {
      explanation.missingDocuments.push({ label: 'Acceptance Sign-off (ลายเซ็นรับงานจากลูกค้า)', kind: 'missing', sourcePath: actionTarget?.file_path || acceptancePath, actionLabel: 'เปิด Acceptance' });
      explanation.blockingReasons.push({ label: 'ต้องมีลายเซ็นรับมอบเพื่อยืนยันว่าโปรเจกต์สิ้นสุดแล้วตามขอบเขต', kind: 'blocker' });
      explanation.expectedNextState = { label: 'งานนี้จะถูกปิดอย่างสมบูรณ์', kind: 'expected' };
    }
    explanation.riskIfIgnored = { label: 'ถ้าไม่เซ็นรับงาน จะไม่มีหลักฐานยืนยันการสิ้นสุดภาระผูกพัน เสี่ยงต่อการถูกเรียกร้องให้แก้เรื่อยๆ', kind: 'risk' };
  } else {
    // Fallback if none match
    explanation.headline = summary.next_action || 'จัดการเอกสารรอบนี้ให้สมบูรณ์';
    explanation.riskIfIgnored = { label: 'ทำให้ระบบ Lifecycle ไม่สามารถช่วยตรวจสอบสถานะโปรเจกต์ต่อได้', kind: 'risk' };
    explanation.expectedNextState = { label: 'ปลดล็อกสถานะเพื่อทำงานสเตจถัดไป', kind: 'expected' };
  }

  return explanation;
}
