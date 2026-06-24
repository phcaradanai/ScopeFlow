// Template generators for ScopeFlow Thai documents
// These generate Markdown with YAML frontmatter

import { todayISO } from './validation';

/**
 * Generate YAML frontmatter block from key-value pairs
 */
function toFrontmatter(data: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Quote strings that contain special chars or are empty
      if (value === '' || value.includes(':') || value.includes('#') || value.includes('"')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else {
      lines.push(`${key}: "${String(value)}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Generate scopeflow.yaml content for a new workspace
 */
export function generateWorkspaceConfig(name: string): string {
  const today = todayISO();
  return `workspace:
  name: "${name}"
  created: ${today}
  version: "1.0"

settings:
  language: th
  currency: THB
  date_format: YYYY-MM-DD
  default_vat_percent: 7
  company_name: ""
  company_address: ""
  company_tax_id: ""
  company_phone: ""
  company_email: ""
  author_name: ""
`;
}

/**
 * Generate _client.yaml content
 */
export function generateClientYaml(data: {
  id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  line_id?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
}): string {
  const today = todayISO();
  return `client:
  id: "${data.id}"
  name: "${data.name}"
  contact_person: "${data.contact_person}"
  email: "${data.email || ''}"
  phone: "${data.phone || ''}"
  line_id: "${data.line_id || ''}"
  address: "${data.address || ''}"
  tax_id: "${data.tax_id || ''}"
  notes: "${data.notes || ''}"
  created: ${today}
  updated: ${today}
`;
}

/**
 * Generate _project.yaml content
 */
export function generateProjectYaml(data: {
  id: string;
  name: string;
  client: string;
  type: string;
  start_date?: string;
  target_date?: string;
  notes?: string;
}): string {
  const today = todayISO();
  const hasCurrentSystem = data.type === 'maintenance' || data.type === 'support-contract';
  return `project:
  id: "${data.id}"
  name: "${data.name}"
  client: "${data.client}"
  type: "${data.type}"
  status: active
  has_current_system: ${hasCurrentSystem}
  start_date: ${data.start_date || '""'}
  target_date: ${data.target_date || '""'}
  notes: "${data.notes || ''}"
  created: ${today}
  updated: ${today}
`;
}

/**
 * Generate scope-v1.0.md content from template
 */
export function generateScopeDocument(data: {
  project: string;
  client: string;
  author: string;
  projectName: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: 'scope',
    version: '1.0',
    project: data.project,
    client: data.client,
    status: 'draft',
    created: today,
    updated: today,
    author: data.author,
    locked: false,
    locked_date: '',
    previous_version: '',
    approved_by: '',
    approved_date: '',
  });

  const body = `
# ขอบเขตงาน: ${data.projectName}

## ข้อมูลโครงการ (Project Information)

- ชื่อโครงการ: ${data.projectName}
- ลูกค้า: ${data.client}
- วันที่เริ่มต้น: 
- วันที่คาดว่าจะเสร็จ: 

## ภาพรวมโครงการ (Project Overview)

<!-- สรุปสิ่งที่โครงการนี้ต้องทำ -->



## ขอบเขตงาน (Scope of Work)

### สิ่งที่รวมอยู่ในขอบเขต (In Scope)

| # | รายการ | รายละเอียด | ลำดับความสำคัญ |
|---|--------|------------|---------------|
| 1 |        |            |               |

### สิ่งที่ไม่รวมอยู่ในขอบเขต (Out of Scope)

| # | รายการ | หมายเหตุ |
|---|--------|---------|
| 1 |        |         |

## สิ่งที่ส่งมอบ (Deliverables)

| # | สิ่งที่ส่งมอบ | รายละเอียด |
|---|--------------|------------|
| 1 |              |            |

## เงื่อนไขการตรวจรับ (Acceptance Criteria)

<!-- เกณฑ์ที่ลูกค้าจะใช้ตรวจรับงาน -->



## หมายเหตุ (Notes)

<!-- บันทึกเพิ่มเติม -->

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate current-system/overview.md
 */
export function generateCurrentSystemOverview(): string {
  return `---
type: current-system-overview
created: ${todayISO()}
updated: ${todayISO()}
---

# ภาพรวมระบบปัจจุบัน (Current System Overview)

<!-- อธิบายภาพรวมของระบบที่มีอยู่ -->

## เทคโนโลยีที่ใช้ (Technology Stack)

- ภาษา: 
- Framework: 
- ฐานข้อมูล: 
- โฮสติ้ง: 

## ประวัติระบบ (System History)

<!-- ระบบนี้พัฒนาเมื่อไหร่ ใครพัฒนา -->

`;
}

/**
 * Generate current-system/modules.yaml
 */
export function generateCurrentSystemModules(): string {
  return `# รายการโมดูล / ฟีเจอร์ของระบบปัจจุบัน
modules: []
#  - id: "example-module"
#    name: "ชื่อโมดูล"
#    description: "คำอธิบาย"
#    status: active    # active | deprecated | partial
#    notes: ""
`;
}

/**
 * Generate current-system/pages.yaml
 */
export function generateCurrentSystemPages(): string {
  return `# รายการหน้า / หน้าจอของระบบปัจจุบัน
pages: []
#  - id: "home"
#    name: "หน้าแรก"
#    url: "/"
#    module: "general"
#    notes: ""
`;
}

/**
 * Generate current-system/roles.yaml
 */
export function generateCurrentSystemRoles(): string {
  return `# บทบาทผู้ใช้และสิทธิ์การเข้าถึง
roles: []
#  - id: "admin"
#    name: "ผู้ดูแลระบบ"
#    permissions: ["all"]
#    notes: ""
`;
}

/**
 * Generate current-system/integrations.yaml
 */
export function generateCurrentSystemIntegrations(): string {
  return `# การเชื่อมต่อระบบภายนอก
integrations: []
#  - id: "payment-gateway"
#    name: "ระบบจ่ายเงิน"
#    provider: ""
#    type: api          # api | webhook | file | manual
#    status: active
#    notes: ""
`;
}

/**
 * Generate current-system/known-limitations.md
 */
export function generateCurrentSystemLimitations(): string {
  return `---
type: current-system-limitations
created: ${todayISO()}
updated: ${todayISO()}
---

# ข้อจำกัดที่ทราบ (Known Limitations)

<!-- บันทึกบั๊ก, ปัญหา, technical debt ที่รู้อยู่แล้ว -->

## บั๊กที่รู้ (Known Bugs)

| # | ปัญหา | ผลกระทบ | สถานะ |
|---|-------|---------|-------|
| 1 |       |         |       |

## Technical Debt

`;
}

/**
 * Generate quotation-v1.0.md content from template
 */
export function generateQuotationDocument(data: {
  project: string;
  client: string;
  author: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: 'quotation',
    version: '1.0',
    project: data.project,
    client: data.client,
    scope_ref: 'scope-v1.0',
    status: 'draft',
    created: today,
    updated: today,
    author: data.author,
    currency: 'THB',
    vat_percent: 7,
    valid_until: '',
    locked: false,
  });

  const body = `
# ใบเสนอราคา (Quotation)

## ข้อมูลผู้เสนอราคา (Vendor Information)

<!-- ข้อมูลผู้ออกใบเสนอราคา -->

## ข้อมูลลูกค้า (Client Information)

<!-- ข้อมูลลูกค้าที่อ้างอิงถึง -->

## รายการและราคา (Items & Pricing)

| # | รายการ | จำนวน | ราคา/หน่วย | รวม |
|---|--------|-------|------------|-----|
| 1 |        |       |            |     |

## สรุปราคา (Pricing Summary)

<!-- สรุปราคารวม ส่วนลด ภาษี -->

## เงื่อนไขการชำระเงิน (Payment Terms)

<!-- งวดการชำระเงิน และบัญชี -->

## เงื่อนไขทั่วไป (General Terms)

<!-- เงื่อนไขอื่นๆ เกี่ยวกับใบเสนอราคา -->

## หมายเหตุ (Notes)

<!-- บันทึกเพิ่มเติม -->

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate CR document
 */
export function generateCRDocument(data: {
  project: string;
  client: string;
  author: string;
  crNumber: string;
  title: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: 'change-request',
    cr_number: data.crNumber,
    project: data.project,
    client: data.client,
    scope_ref: 'scope-v1.0',
    status: 'draft',
    priority: 'normal',
    created: today,
    updated: today,
    author: data.author,
    requested_by: '',
    estimated_hours: 0,
    estimated_cost: 0,
    currency: 'THB',
    locked: false,
  });

  const body = `
# คำขอเปลี่ยนแปลงขอบเขตงาน: ${data.crNumber} — ${data.title}

## สรุปการเปลี่ยนแปลง (Summary of Change)



## เหตุผล (Reason)



## รายละเอียดการเปลี่ยนแปลง (Change Details)



## ผลกระทบต่อขอบเขตงาน (Scope Impact)



## ผลกระทบต่อเวลา (Schedule Impact)



## ผลกระทบต่อค่าใช้จ่าย (Cost Impact)



## เงื่อนไขการตรวจรับ (Acceptance Criteria)



## หมายเหตุ (Notes)

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate DCR document
 */
export function generateDCRDocument(data: {
  project: string;
  client: string;
  author: string;
  dcrNumber: string;
  changeKind: string;
  title: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: 'development-change-request',
    dcr_number: data.dcrNumber,
    project: data.project,
    client: data.client,
    baseline_ref: '',
    status: 'draft',
    initiated_by: 'developer',
    change_kind: data.changeKind,
    created: today,
    updated: today,
    author: data.author,
    has_cost_impact: false,
    estimated_hours: 0,
    estimated_cost: 0,
    currency: 'THB',
    locked: false,
  });

  const body = `
# คำขอเปลี่ยนแปลงการพัฒนา: ${data.dcrNumber} — ${data.title}

## สรุปคำขอเปลี่ยนแปลง (Summary)



## สถานะปัจจุบัน (Current State)



## สิ่งที่ต้องการเปลี่ยน (Desired State)



## เหตุผลของการเปลี่ยนแปลง (Reason for Change)



## ประเภทการเปลี่ยนแปลง (Change Kind)

${data.changeKind}

## ส่วนที่ได้รับผลกระทบ (Impacted Components)



## ผลกระทบต่อข้อมูลเดิม (Data Impact)



## ผลกระทบต่อเวลา (Schedule Impact)



## ผลกระทบต่อค่าใช้จ่าย (Cost Impact)



## แผนการทดสอบ (Test Plan)



## เงื่อนไขการตรวจรับ (Acceptance Criteria)



## หมายเหตุ (Notes)

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate Support / MA Request document
 */
export function generateSupportRequestDocument(data: {
  type: 'support-request' | 'ma-request';
  project: string;
  client: string;
  author: string;
  requestNumber: string;
  category: string;
  title: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: data.type,
    request_number: data.requestNumber,
    project: data.project,
    client: data.client,
    status: 'draft',
    priority: 'normal',
    category: data.category,
    reported_by: '',
    created: today,
    updated: today,
    author: data.author,
    is_billable: false,
    estimated_hours: 0,
    actual_hours: 0,
    estimated_cost: 0,
    actual_cost: 0,
    currency: 'THB',
    locked: false,
  });

  const body = `
# แจ้งปัญหา/แจ้งซ่อม: ${data.requestNumber} — ${data.title}

## สรุปปัญหา / คำขอ (Summary)



## ขั้นตอนการเกิดปัญหา (Steps to Reproduce)



## สิ่งที่คาดหวัง (Expected Behavior)



## สิ่งที่เกิดขึ้นจริง (Actual Behavior)



## สภาพแวดล้อม (Environment)



## การวิเคราะห์เบื้องต้น (Initial Analysis)



## การแก้ไข (Resolution)



## เวลาที่ใช้ (Time Spent)



## การเรียกเก็บเงิน (Billing Info)



## หมายเหตุ (Notes)

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate Acceptance Checklist
 */
export function generateAcceptanceChecklist(data: {
  project: string;
  client: string;
  author: string;
}): string {
  const today = todayISO();

  const frontmatter = toFrontmatter({
    type: 'acceptance-checklist',
    version: '1.0',
    project: data.project,
    client: data.client,
    scope_ref: 'scope-v1.0',
    status: 'draft',
    created: today,
    updated: today,
    author: data.author,
    accepted_by: '',
    accepted_date: '',
    locked: false,
  });

  const body = `
# รายการตรวจรับงาน (Acceptance Checklist)

## ข้อมูลการตรวจรับ (Acceptance Info)

<!-- ข้อมูลผู้อนุมัติ วันที่ และสถานที่ -->

## รายการตรวจรับด้านฟังก์ชัน (Functional Requirements)

| # | รายการ | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|---|--------|:---:|:-------:|---------|
| 1 |        | [ ] |   [ ]   |         |

## รายการตรวจรับด้าน UI/UX (UI/UX Requirements)

| # | รายการ | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|---|--------|:---:|:-------:|---------|
| 1 |        | [ ] |   [ ]   |         |

## รายการตรวจรับด้านข้อมูล (Data Requirements)

| # | รายการ | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|---|--------|:---:|:-------:|---------|
| 1 |        | [ ] |   [ ]   |         |

## รายการตรวจรับด้านสิ่งที่ส่งมอบ (Deliverables)

| # | รายการ | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|---|--------|:---:|:-------:|---------|
| 1 |        | [ ] |   [ ]   |         |

## สรุปผลการตรวจรับ (Acceptance Summary)

<!-- ผ่านการตรวจรับทั้งหมด / ต้องแก้ไข -->

## เงื่อนไขเพิ่มเติม (Additional Terms)

<!-- หากมี -->

## หมายเหตุ (Notes)

<!-- บันทึกเพิ่มเติม -->

`;

  return frontmatter + '\n' + body;
}

/**
 * Generate Approval Record
 */
export function generateApprovalRecord(data: {
  approvalNumber: string;
  project: string;
  client: string;
  approvedDocument: string;
  documentType: string;
  approvedBy: string;
  approvalMethod: string;
  evidenceFiles: string[];
}): string {
  const today = todayISO();
  
  const validMethods = ['signed-pdf', 'screenshot', 'email', 'verbal', 'line-chat', 'in-person', 'other'];
  if (!validMethods.includes(data.approvalMethod)) {
    throw new Error('Invalid approval method');
  }

  const frontmatter = toFrontmatter({
    type: 'approval-record',
    approval_number: data.approvalNumber,
    project: data.project,
    client: data.client,
    approved_document: data.approvedDocument,
    document_type: data.documentType,
    status: 'recorded',
    approved_by: data.approvedBy,
    approval_method: data.approvalMethod,
    approval_date: today,
    created: today,
    updated: today,
    author: '',
    evidence_files: data.evidenceFiles,
  });

  const body = `
# บันทึกการอนุมัติ: ${data.approvalNumber}

## รายละเอียดการอนุมัติ
- เอกสารที่อนุมัติ: ${data.approvedDocument}
- ผู้อนุมัติ: ${data.approvedBy}
- วันที่อนุมัติ: ${today}
- วิธีการอนุมัติ: ${data.approvalMethod}

## หลักฐานอ้างอิง
${data.evidenceFiles.length === 0 ? 'ยังไม่มีไฟล์หลักฐานแนบ' : data.evidenceFiles.map(f => `- [${f}](../../attachments/${f})`).join('\n')}

## หมายเหตุ
`;

  return frontmatter + '\n' + body;
}

/**
 * Utility to inject approval status into an existing document without destroying other frontmatter fields
 */
export function updateDocumentApprovalStatus(
  originalContent: string,
  approvedBy: string,
  approvedDate: string,
  approvalRef: string
): string {
  let inFrontmatter = false;
  const lines = originalContent.split('\n');
  const output: string[] = [];
  
  let hasStatus = false;
  let hasApprovedBy = false;
  let hasApprovedDate = false;
  let hasApprovalRef = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '---') {
      if (!inFrontmatter && i === 0) {
        inFrontmatter = true;
        output.push(line);
      } else if (inFrontmatter) {
        // End of frontmatter, inject fields if they were missing
        if (!hasStatus) output.push(`status: "approved"`);
        if (!hasApprovedBy) output.push(`approved_by: "${approvedBy}"`);
        if (!hasApprovedDate) output.push(`approved_date: "${approvedDate}"`);
        if (!hasApprovalRef) output.push(`approval_ref: "${approvalRef}"`);
        
        inFrontmatter = false;
        output.push(line);
      } else {
        output.push(line);
      }
      continue;
    }

    if (inFrontmatter) {
      if (line.startsWith('status:')) {
        output.push(`status: "approved"`);
        hasStatus = true;
      } else if (line.startsWith('approved_by:')) {
        output.push(`approved_by: "${approvedBy}"`);
        hasApprovedBy = true;
      } else if (line.startsWith('approved_date:')) {
        output.push(`approved_date: "${approvedDate}"`);
        hasApprovedDate = true;
      } else if (line.startsWith('approval_ref:')) {
        output.push(`approval_ref: "${approvalRef}"`);
        hasApprovalRef = true;
      } else {
        output.push(line);
      }
    } else {
      output.push(line);
    }
  }

  return output.join('\n');
}

/**
 * Utility to lock a document
 */
export function lockDocument(originalContent: string, lockedDate: string): string {
  let inFrontmatter = false;
  const lines = originalContent.split('\n');
  const output: string[] = [];
  
  let hasLocked = false;
  let hasLockedDate = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '---') {
      if (!inFrontmatter && i === 0) {
        inFrontmatter = true;
        output.push(line);
      } else if (inFrontmatter) {
        // End of frontmatter, inject fields if missing
        if (!hasLocked) output.push(`locked: true`);
        if (!hasLockedDate) output.push(`locked_date: "${lockedDate}"`);
        inFrontmatter = false;
        output.push(line);
      } else {
        output.push(line);
      }
      continue;
    }

    if (inFrontmatter) {
      if (line.startsWith('locked:')) {
        output.push(`locked: true`);
        hasLocked = true;
      } else if (line.startsWith('locked_date:')) {
        output.push(`locked_date: "${lockedDate}"`);
        hasLockedDate = true;
      } else {
        output.push(line);
      }
    } else {
      output.push(line);
    }
  }

  return output.join('\n');
}

