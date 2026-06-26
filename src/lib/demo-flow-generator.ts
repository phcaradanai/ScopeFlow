import { invoke } from '@tauri-apps/api/core';

function timestampId() {
  return Date.now().toString().slice(-8);
}

export async function generateCompletedDemoFlow(workspacePath: string) {
  const suffix = timestampId();
  const clientId = `demo-flow-client-${suffix}`;
  const projectId = `complete-scope-flow-${suffix}`;

  const clientYaml = `name: "ลูกค้าตัวอย่าง Flow ครบระบบ"
contact_person: "คุณ Flow Demo"
email: "flow-demo@example.com"
phone: "080-000-0000"
line_id: "@scopeflow-demo"
address: "Demo Address"
tax_id: "0000000000000"
notes: "ลูกค้าสำหรับทดสอบ flow ตั้งแต่คำขอจนถึงตรวจรับ"`;

  await invoke('create_client', { workspacePath, clientId, clientYaml });

  const projectYaml = `name: "Demo: จบครบทั้ง Flow"
client: "${clientId}"
type: "new-project"
status: "completed"
start_date: "2026-06-01"
target_date: "2026-06-30"
notes: "ตัวอย่างครบ: Raw request → Brief → Scope → Quotation → Approval → Acceptance → Export"`;

  await invoke('create_project', {
    workspacePath,
    clientId,
    projectId,
    projectYaml,
    projectType: 'new-project',
    currentSystemFiles: null,
  });

  const projectPath = `${workspacePath}/clients/${clientId}/projects/${projectId}`;

  await invoke('create_document', {
    path: `${projectPath}/baseline/brief-v1.0.md`,
    content: `---
type: brief
title: "Brief: ระบบจองคิวและชำระเงินออนไลน์"
version: "1.0"
status: approved
locked: true
document_number: BR-${suffix}
approval_ref: APR-BRIEF-${suffix}
created: "2026-06-01"
updated: "2026-06-02"
---
# Brief
ลูกค้าต้องการระบบจองคิวออนไลน์พร้อมชำระเงินและแจ้งเตือน

## Goals
- ลดงานรับจองทางโทรศัพท์
- ให้ลูกค้าจ่ายเงินมัดจำออนไลน์

## Must-have
- จองวันเวลา
- ชำระเงิน
- แจ้งเตือนอีเมล/LINE

## Questions Resolved
- ใช้ PromptPay และบัตรเครดิต
- รองรับผู้ใช้มือถือเป็นหลัก`,
  });

  await invoke('create_document', {
    path: `${projectPath}/baseline/scope-v1.0.md`,
    content: `---
type: scope
title: "Scope: ระบบจองคิวและชำระเงินออนไลน์"
version: "1.0"
status: approved
locked: true
document_number: SC-${suffix}
approval_ref: APR-SCOPE-${suffix}
created: "2026-06-03"
updated: "2026-06-05"
---
# Scope

## Goal / Overview
พัฒนาระบบจองคิวออนไลน์สำหรับลูกค้าและแอดมิน

## In-Scope
- หน้าเลือกบริการและวันเวลา
- ฟอร์มข้อมูลลูกค้า
- ชำระเงินมัดจำ
- Dashboard แอดมิน
- แจ้งเตือนสถานะ

## Out-of-Scope
- ระบบบัญชีเต็มรูปแบบ
- Mobile app native

## Deliverables
- Web application
- Admin dashboard
- Deployment guide

## Acceptance Criteria
- จองคิวได้สำเร็จ
- ชำระเงินได้
- แอดมินเห็นรายการจอง

## Assumptions
- ลูกค้ามีบัญชี payment gateway พร้อมใช้งาน

## Questions
ไม่มีคำถามค้าง`,
  });

  await invoke('create_document', {
    path: `${projectPath}/baseline/quotation-v1.0.md`,
    content: `---
type: quotation
title: "Quotation: ระบบจองคิวและชำระเงินออนไลน์"
version: "1.0"
status: approved
locked: true
document_number: QT-${suffix}
approval_ref: APR-QUOTE-${suffix}
created: "2026-06-06"
updated: "2026-06-07"
subtotal: 180000
discount_type: amount
discount_value: 10000
discount_amount: 10000
net_amount: 170000
vat_percent: 7
vat_amount: 11900
grand_total: 181900
---
# ใบเสนอราคา
ยอดรวมสุทธิ 181,900 บาท รวม VAT`,
  });

  await invoke('create_document', {
    path: `${projectPath}/baseline/invoice-v1.0.md`,
    content: `---
type: invoice
title: "Invoice: งวดที่ 1 ระบบจองคิว"
version: "1.0"
status: paid
locked: true
document_number: INV-${suffix}
created: "2026-06-08"
updated: "2026-06-09"
grand_total: 54570
---
# ใบแจ้งหนี้
ชำระงวดแรก 30% แล้ว`,
  });

  await invoke('create_document', {
    path: `${projectPath}/acceptance/acceptance-v1.0.md`,
    content: `---
type: acceptance
title: "Acceptance: ตรวจรับระบบจองคิว"
version: "1.0"
status: approved
locked: true
document_number: AC-${suffix}
approval_ref: APR-ACCEPT-${suffix}
created: "2026-06-28"
updated: "2026-06-30"
---
# ตรวจรับงาน
- [x] จองคิวได้
- [x] ชำระเงินได้
- [x] แอดมินเห็นรายการ
- [x] ส่งออกเอกสารส่งมอบแล้ว`,
  });

  const approvals = [
    ['APR-BRIEF', 'brief-v1.0.md', 'brief'],
    ['APR-SCOPE', 'scope-v1.0.md', 'scope'],
    ['APR-QUOTE', 'quotation-v1.0.md', 'quotation'],
    ['APR-ACCEPT', 'acceptance-v1.0.md', 'acceptance'],
  ];

  for (const [prefix, approvedDocument, documentType] of approvals) {
    const approvalNumber = `${prefix}-${suffix}`;
    await invoke('create_document', {
      path: `${projectPath}/approvals/${approvalNumber}.md`,
      content: `---
type: approval-record
title: "บันทึกการอนุมัติ ${approvedDocument}"
approval_number: "${approvalNumber}"
status: recorded
approved_document: "${approvedDocument}"
document_type: "${documentType}"
approved_by: "คุณ Flow Demo"
approval_method: "email"
evidence_files: ["${approvalNumber}.txt"]
created: "2026-06-30"
---
# Approval Record
ลูกค้ายืนยันอนุมัติ ${approvedDocument}`,
    });

    await invoke('write_file_content', {
      path: `${projectPath}/attachments/${approvalNumber}.txt`,
      content: `Demo evidence for ${approvedDocument}`,
    });
  }

  await invoke('write_file_content', {
    path: `${projectPath}/exports/scopeflow-complete-demo-${suffix}.html`,
    content: `<html><body><h1>ScopeFlow Complete Demo</h1><p>Brief → Scope → Quote → Approval → Acceptance → Export completed.</p></body></html>`,
  });

  return { clientId, projectId, projectPath };
}
