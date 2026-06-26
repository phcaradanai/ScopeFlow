import { invoke } from '@tauri-apps/api/core';

export interface DemoWorkspaceResult {
  clientId: string;
  projectIds: string[];
  primaryProjectPath: string;
  maintenanceProjectPath: string;
  artifactPaths: Record<string, string>;
}

function demoSuffix() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

export async function generateDemoWorkspace(workspacePath: string, workspaceName: string): Promise<DemoWorkspaceResult> {
  const suffix = demoSuffix();

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

  await invoke('create_workspace', { path: workspacePath, name: workspaceName, configContent: workspaceConfig });

  const clientId = `demo-client-${suffix}`;
  const clientYaml = `name: "บริษัท เดโม จำกัด ${suffix}"
contact_person: "คุณ สมชาย ใจดี"
email: "somchai@demo-client.com"
phone: "081-234-5678"
line_id: "@democlient"
address: "456 Client St, Bangkok"
tax_id: "0987654321098"
notes: "ลูกค้ารายใหญ่"`;

  await invoke('create_client', { workspacePath, clientId, clientYaml });

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

  const proj1Path = `${workspacePath}/clients/${clientId}/projects/${proj1Id}`;
  const proj2Path = `${workspacePath}/clients/${clientId}/projects/${proj2Id}`;
  const artifactPaths: Record<string, string> = {
    project: proj1Path,
    maintenanceProject: proj2Path,
    brief: `${proj1Path}/baseline/brief-v1.0.md`,
    scope: `${proj1Path}/baseline/scope-v1.0.md`,
    quotation: `${proj1Path}/baseline/quotation-v1.0.md`,
    scopeApproval: `${proj1Path}/approvals/APR-001-scope-v1.0-approved.md`,
    acceptance: `${proj1Path}/acceptance/acceptance-checklist-v1.0.md`,
    export: `${proj1Path}/exports/scope-pack-20260605.html`,
  };

  await invoke('create_document', {
    path: artifactPaths.brief,
    content: `---
type: brief
title: Brief ปรับปรุงเว็บไซต์องค์กร
version: "1.0"
status: approved
locked: true
approved_by: "คุณ สมชาย ใจดี"
approval_ref: APR-BRIEF-001
document_number: BR-001
created: "2026-05-28"
updated: "2026-06-01"
---
# Brief ปรับปรุงเว็บไซต์องค์กร

## เป้าหมายหลัก
ลูกค้าต้องการปรับปรุงเว็บไซต์องค์กรให้ดูน่าเชื่อถือ โหลดเร็ว และรองรับมือถือ

## สิ่งที่จำเป็น
- หน้าแรกใหม่
- หน้าเกี่ยวกับบริษัท
- หน้าสินค้า/บริการ
- ฟอร์มติดต่อ
- รองรับ SEO พื้นฐาน

## คำถามที่ปิดแล้ว
- ใช้เว็บองค์กร ไม่ใช่ e-commerce
- ยังไม่ทำระบบสมาชิกในรอบนี้`
  });

  await invoke('create_document', {
    path: artifactPaths.scope,
    content: `---
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

## In-Scope
- หน้าแรก (Home)
- เกี่ยวกับเรา (About)
- สินค้า (Products)
- ติดต่อเรา (Contact)

## Out-of-Scope
- ระบบสมาชิก
- ระบบชำระเงินออนไลน์

## Acceptance Criteria
- เว็บไซต์แสดงผลบนมือถือได้ดี
- ฟอร์มติดต่อส่งข้อมูลได้
- โหลดหน้าแรกต่ำกว่า 3 วินาทีในสภาพแวดล้อมปกติ`
  });

  await invoke('create_document', {
    path: artifactPaths.quotation,
    content: `---
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
- งวดที่ 2: 70% เมื่อส่งมอบงาน`
  });

  await invoke('create_document', {
    path: `${proj1Path}/change-requests/CR-001-add-careers.md`,
    content: `---
type: cr
title: ขอเพิ่มหน้าสมัครงาน
version: "1.0"
status: draft
locked: false
document_number: CR-001
created: "2026-06-20"
updated: "2026-06-20"
---
# รายละเอียดการเปลี่ยนแปลง
ลูกค้าต้องการให้เพิ่มเมนู "สมัครงาน" และฟอร์มกรอกข้อมูลพร้อมแนบ Resume`
  });

  await invoke('create_document', {
    path: artifactPaths.acceptance,
    content: `---
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
- [ ] โหลดหน้าเว็บต่ำกว่า 3 วินาที`
  });

  await invoke('create_document', {
    path: artifactPaths.scopeApproval,
    content: `---
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
ลูกค้ายืนยันทางอีเมลเมื่อวันที่ 5 มิถุนายน 2026`
  });

  await invoke('write_file_content', {
    path: `${proj1Path}/attachments/email-confirmation.txt`,
    content: `From: somchai@demo-client.com\nTo: contact@demo-company.com\nSubject: ยืนยันสโคปงาน\n\nตกลงตามนี้ครับ ดำเนินการต่อได้เลย`
  });

  await invoke('write_file_content', {
    path: artifactPaths.export,
    content: `<html><body><h1>เอกสาร Scope ที่ถูกนำออกแล้ว</h1></body></html>`
  });

  await invoke('create_document', {
    path: `${proj2Path}/support-requests/SUP-001-report-error.md`,
    content: `---
type: sup
title: ไม่สามารถออกรายงานประจำเดือนได้
version: "1.0"
status: pending
locked: false
document_number: SUP-001
created: "2026-06-22"
---
# อาการ
เมื่อกดปุ่ม Export Excel ระบบแสดงหน้าขาวและไม่มีไฟล์ถูกดาวน์โหลด`
  });

  await invoke('create_document', {
    path: `${proj2Path}/support-requests/MA-001-db-patch.md`,
    content: `---
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
- [ ] รีสตาร์ทเซอร์วิส (23:45)`
  });

  return {
    clientId,
    projectIds: [proj1Id, proj2Id],
    primaryProjectPath: proj1Path,
    maintenanceProjectPath: proj2Path,
    artifactPaths,
  };
}
