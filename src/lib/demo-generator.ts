import { invoke } from '@tauri-apps/api/core';

function demoSuffix() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

export async function generateDemoWorkspace(workspacePath: string, workspaceName: string) {
  const suffix = demoSuffix();

  // 1. Create Workspace
  const workspaceConfig = `workspace:
  name: "${workspaceName}"
  created: "${new Date().toISOString()}"
  version: "1.0"
settings:
  language: "th"
  currency: "THB"
  date_format: "DD/MM/YYYY"
  default_vat_percent: 7
  company_name: "Demo Company Co., Ltd."
  company_address: "123 Demo Street, Bangkok 10110"
  company_tax_id: "0123456789012"
  company_phone: "02-123-4567"
  company_email: "contact@demo-company.com"
  author_name: "Demo User"`;

  await invoke('create_workspace', {
    path: workspacePath,
    name: workspaceName,
    configContent: workspaceConfig
  });

  // 2. Create Client
  const clientId = `demo-client-${suffix}`;
  const clientYaml = `name: "บริษัท เดโม จำกัด ${suffix}"
contact_person: "คุณ สมชาย ใจดี"
email: "somchai@demo-client.com"
phone: "081-234-5678"
line_id: "@democlient"
address: "456 Client St, Bangkok"
tax_id: "0987654321098"
notes: "ลูกค้ารายใหญ่"`;

  await invoke('create_client', {
    workspacePath,
    clientId,
    clientYaml
  });

  // 3. Create Projects
  const proj1Id = `website-revamp-${suffix}`;
  const proj1Yaml = `name: "ปรับปรุงเว็บไซต์องค์กร"
client: "${clientId}"
type: "new-project"
status: "active"
start_date: "2026-07-01"
target_date: "2026-10-01"
notes: "ทำใหม่ทั้งหมดด้วย React"`;

  await invoke('create_project', {
    workspacePath,
    clientId,
    projectId: proj1Id,
    projectYaml: proj1Yaml,
    projectType: 'new-project',
    currentSystemFiles: null
  });

  const proj2Id = `system-maintenance-${suffix}`;
  const proj2Yaml = `name: "บำรุงรักษาระบบ ERP"
client: "${clientId}"
type: "maintenance"
status: "active"
start_date: "2026-01-01"
target_date: "2026-12-31"
notes: "สัญญาดูแลรายปี"`;

  await invoke('create_project', {
    workspacePath,
    clientId,
    projectId: proj2Id,
    projectYaml: proj2Yaml,
    projectType: 'maintenance',
    currentSystemFiles: [['architecture.md', '# Current ERP Architecture\n- Server: Ubuntu\n- DB: PostgreSQL']]
  });

  // 4. Create Documents for proj1 (website-revamp)
  const proj1Path = `${workspacePath}/clients/${clientId}/projects/${proj1Id}`;

  // Scope (Approved)
  const scopeFrontmatter = `---
type: scope
title: ขอบเขตระบบเว็บไซต์องค์กร
version: "1.0"
status: approved
locked: true
approved_by: "คุณ สมชาย ใจดี"
approval_ref: APR-001
document_number: DOC-001
created: "2026-06-01"
updated: "2026-06-05"
---
# ขอบเขตระบบ
- หน้าแรก (Home)
- เกี่ยวกับเรา (About)
- สินค้า (Products)
- ติดต่อเรา (Contact)`;

  await invoke('create_document', {
    path: `${proj1Path}/baseline/scope-v1.0.md`,
    content: scopeFrontmatter
  });

  // Quotation
  const quoteFrontmatter = `---
type: quotation
title: ใบเสนอราคาทำเว็บไซต์
version: "1.0"
status: pending
locked: false
document_number: QT-2026-001
created: "2026-06-10"
updated: "2026-06-10"
subtotal: 100000
discount_type: percent
discount_value: 10
discount_amount: 10000
net_amount: 90000
vat_percent: 7
vat_amount: 6300
grand_total: 96300
line_items:
  - description: "ออกแบบเว็บไซต์ (UI/UX)"
    quantity: 1
    unit_price: 30000
    amount: 30000
  - description: "พัฒนาระบบ (Frontend + Backend)"
    quantity: 1
    unit_price: 70000
    amount: 70000
---
# เงื่อนไขการชำระเงิน
- งวดที่ 1: 30% ณ วันเซ็นสัญญา
- งวดที่ 2: 70% เมื่อส่งมอบงาน`;

  await invoke('create_document', {
    path: `${proj1Path}/baseline/quotation-v1.0.md`,
    content: quoteFrontmatter
  });

  // CR
  const crFrontmatter = `---
type: cr
title: ขอเพิ่มหน้าสมัครงงาน
version: "1.0"
status: draft
locked: false
document_number: CR-001
created: "2026-06-20"
updated: "2026-06-20"
---
# รายละเอียดการเปลี่ยนแปลง
ลูกค้าต้องการให้เพิ่มเมนู "สมัครงาน" และฟอร์มกรอกข้อมูลพร้อมแนบ Resume`;

  await invoke('create_document', {
    path: `${proj1Path}/change-requests/CR-001-add-careers.md`,
    content: crFrontmatter
  });

  // Acceptance Checklist
  const acFrontmatter = `---
type: acceptance
title: รายการตรวจรับงานเว็บไซต์
version: "1.0"
status: draft
locked: false
document_number: AC-001
created: "2026-06-21"
---
# รายการตรวจสอบ
- [ ] ทดสอบการแสดงผลบนมือถือ
- [ ] ทดสอบแบบฟอร์มติดต่อ
- [ ] โหลดหน้าเว็บต่ำกว่า 3 วินาที`;

  await invoke('create_document', {
    path: `${proj1Path}/acceptance/acceptance-checklist-v1.0.md`,
    content: acFrontmatter
  });

  // Approval Record
  const aprFrontmatter = `---
type: approval-record
title: "บันทึกการอนุมัติ ขอบเขตระบบเว็บไซต์องค์กร"
approval_number: "APR-001"
status: "recorded"
approved_document: "scope-v1.0.md"
document_type: "scope"
approved_by: "คุณ สมชาย ใจดี"
approval_method: "email"
evidence_files: ["email-confirmation.txt"]
created: "2026-06-05"
---
# บันทึกการอนุมัติ: APR-001
ลูกค้ายืนยันทางอีเมลเมื่อวันที่ 5 มิถุนายน 2026`;

  await invoke('create_document', {
    path: `${proj1Path}/approvals/APR-001-scope-v1.0-approved.md`,
    content: aprFrontmatter
  });

  // Evidence file
  await invoke('write_file_content', {
    path: `${proj1Path}/attachments/email-confirmation.txt`,
    content: `From: somchai@demo-client.com\nTo: contact@demo-company.com\nSubject: ยืนยันสโคปงาน\n\nตกลงตามนี้ครับ ดำเนินการต่อได้เลย`
  });

  // Export file
  await invoke('write_file_content', {
    path: `${proj1Path}/exports/scope-pack-20260605.html`,
    content: `<html><body><h1>เอกสาร Scope ที่ถูกนำออกแล้ว</h1></body></html>`
  });

  // 5. Create Documents for proj2 (system-maintenance)
  const proj2Path = `${workspacePath}/clients/${clientId}/projects/${proj2Id}`;

  // Support Request
  const supFrontmatter = `---
type: sup
title: ไม่สามารถออกรายงานประจำเดือนได้
version: "1.0"
status: pending
locked: false
document_number: SUP-001
created: "2026-06-22"
---
# อาการ
เมื่อกดปุ่ม Export Excel ระบบแสดงหน้าขาวและไม่มีไฟล์ถูกดาวน์โหลด`;

  await invoke('create_document', {
    path: `${proj2Path}/support-requests/SUP-001-report-error.md`,
    content: supFrontmatter
  });

  // Maintenance Note
  const maFrontmatter = `---
type: ma
title: อัปเดตแพตช์ความปลอดภัย PostgreSQL
version: "1.0"
status: draft
locked: false
document_number: MA-001
created: "2026-06-23"
---
# แผนการทำงาน
- [ ] สำรองฐานข้อมูล (23:00)
- [ ] ติดตั้งแพตช์ (23:30)
- [ ] รีสตาร์ทเซอร์วิส (23:45)`;

  await invoke('create_document', {
    path: `${proj2Path}/support-requests/MA-001-db-patch.md`,
    content: maFrontmatter
  });
}
