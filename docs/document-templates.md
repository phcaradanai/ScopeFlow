# ScopeFlow Thai — Document Templates

## Overview

ScopeFlow ships with 6 built-in document templates. Each template defines the structure, required fields, and generated sections for a specific document type. Users create documents by selecting a template, filling in the fields, and editing the Markdown body.

All templates produce Markdown files with YAML frontmatter.

---

## 1. New Project Scope + Quotation

### Purpose
Define the complete scope of a new project and provide a quotation. This is the foundational document that establishes what is included, what is excluded, and how much it costs. This document is what prevents "I thought this was included."

### File Names
- Scope: `scope-v{version}.md`
- Quotation: `quotation-v{version}.md`

> Scope and quotation are separate files so they can be versioned independently. A scope may be approved while the quotation is still being negotiated.

---

### Scope Document

#### YAML Frontmatter (Required Fields)

```yaml
---
type: scope
version: "1.0"
project: "{project-id}"
client: "{client-id}"
status: draft                    # draft | review | approved | superseded
created: 2025-03-01
updated: 2025-03-05
author: "{author-name}"
approved_by: ""
approved_date: ""
---
```

#### Optional Frontmatter Fields

```yaml
tags: [web, redesign]
priority: normal                 # low | normal | high | urgent
target_start: 2025-04-01
target_end: 2025-06-30
related_documents: []
```

#### Document Body Sections

```markdown
# ขอบเขตงาน: {Project Name}

## ข้อมูลโครงการ (Project Information)
- ชื่อโครงการ:
- ลูกค้า:
- วันที่เริ่มต้น:
- วันที่คาดว่าจะเสร็จ:

## ภาพรวมโครงการ (Project Overview)
<!-- สรุปสิ่งที่โครงการนี้ต้องทำ -->

## ขอบเขตงาน (Scope of Work)
### ฟีเจอร์ที่รวมอยู่ในขอบเขต (In Scope)
| # | รายการ | รายละเอียด | ลำดับความสำคัญ |
|---|--------|------------|---------------|
| 1 |        |            |               |

### สิ่งที่ไม่รวมอยู่ในขอบเขต (Out of Scope)
| # | รายการ | หมายเหตุ |
|---|--------|---------|
| 1 |        |         |

## ข้อกำหนดทางเทคนิค (Technical Requirements)
- แพลตฟอร์ม:
- ภาษาโปรแกรม:
- ฐานข้อมูล:
- โฮสติ้ง:

## เงื่อนไขการส่งมอบ (Deliverables)
| # | สิ่งที่ส่งมอบ | รายละเอียด |
|---|--------------|------------|
| 1 |              |            |

## สมมติฐาน (Assumptions)
<!-- สิ่งที่ถือว่าเป็นจริงในการประเมินนี้ -->

## ข้อจำกัดและความเสี่ยง (Constraints & Risks)
| # | ความเสี่ยง | ผลกระทบ | แนวทางป้องกัน |
|---|-----------|---------|--------------|
| 1 |           |         |              |

## ไทม์ไลน์ (Timeline)
| เฟส | รายละเอียด | ระยะเวลา | วันเริ่ม | วันสิ้นสุด |
|-----|-----------|----------|---------|-----------|
| 1   |           |          |         |           |

## เงื่อนไขการยอมรับงาน (Acceptance Criteria)
<!-- เกณฑ์ที่ลูกค้าจะใช้ตรวจรับงาน -->
```

#### Approval Fields (Bottom of Document)

```markdown
---

## การอนุมัติ (Approval)
- สถานะ: รอการอนุมัติ
- อนุมัติโดย:
- วันที่อนุมัติ:
- หมายเหตุ:
- เอกสารแนบ: <!-- ลิงก์ไปยังไฟล์ใน attachments/ -->
```

---

### Quotation Document

#### YAML Frontmatter (Required Fields)

```yaml
---
type: quotation
version: "1.0"
project: "{project-id}"
client: "{client-id}"
scope_ref: "scope-v1.0"         # Reference to the scope version
status: draft                    # draft | sent | approved | rejected | superseded
created: 2025-03-01
updated: 2025-03-05
author: "{author-name}"
currency: THB
vat_percent: 7
valid_until: 2025-04-01          # Quotation expiry date
approved_by: ""
approved_date: ""
---
```

#### Optional Frontmatter Fields

```yaml
discount_percent: 0
payment_terms: "50/50"           # e.g., 50/50, 30/40/30, monthly
warranty_days: 30
```

#### Document Body Sections

```markdown
# ใบเสนอราคา: {Project Name}

## ข้อมูลผู้เสนอราคา (Vendor Information)
<!-- Auto-populated from scopeflow.yaml -->

## ข้อมูลลูกค้า (Client Information)
<!-- Auto-populated from _client.yaml -->

## รายการและราคา (Line Items)
| # | รายการ | รายละเอียด | จำนวน | หน่วย | ราคาต่อหน่วย | รวม |
|---|--------|-----------|-------|------|-------------|-----|
| 1 |        |           |       |      |             |     |

## สรุปราคา (Price Summary)
| รายการ | จำนวนเงิน |
|--------|----------|
| รวมก่อน VAT |        |
| VAT 7% |            |
| รวมทั้งสิ้น |        |

## เงื่อนไขการชำระเงิน (Payment Terms)
| งวดที่ | รายละเอียด | เปอร์เซ็นต์ | จำนวนเงิน | กำหนดชำระ |
|--------|-----------|-----------|----------|----------|
| 1      |           |           |          |          |

## เงื่อนไขทั่วไป (Terms & Conditions)
1. ใบเสนอราคานี้มีอายุ {valid_until_days} วัน
2. ราคาไม่รวมค่าโฮสติ้งและโดเมน (ถ้ามี)
3. การเปลี่ยนแปลงขอบเขตงานจะมีค่าใช้จ่ายเพิ่มเติม
4. ...

## การรับประกัน (Warranty)
- ระยะเวลารับประกัน: {warranty_days} วัน หลังส่งมอบงาน
- ขอบเขตการรับประกัน: แก้ไขบั๊กที่เกิดจากการพัฒนาเท่านั้น

---

## การอนุมัติ (Approval)
- สถานะ: รอการอนุมัติ
- อนุมัติโดย:
- วันที่อนุมัติ:
- หมายเหตุ:
- เอกสารแนบ:
```

---

## 2. Change Request (CR)

### Purpose
Document a client's request to change functionality, features, or requirements that were already defined in the approved scope. This establishes that the change is out of the original scope and may have cost and timeline implications.

### File Name
`CR-{number}-{short-description}.md`

Example: `CR-001-add-payment-gateway.md`

#### YAML Frontmatter (Required Fields)

```yaml
---
type: change-request
cr_number: "CR-001"
project: "{project-id}"
client: "{client-id}"
scope_ref: "scope-v1.0"         # The baseline scope this changes
status: draft                    # draft | submitted | approved | rejected | implemented
priority: normal                 # low | normal | high | urgent
created: 2025-04-10
updated: 2025-04-10
author: "{author-name}"
requested_by: ""                 # Who from the client side requested this
approved_by: ""
approved_date: ""
---
```

#### Optional Frontmatter Fields

```yaml
estimated_hours: 0
estimated_cost: 0
currency: THB
deadline: ""
related_cr: []                   # Other related CRs
```

#### Document Body Sections

```markdown
# Change Request: {CR Number} — {Title}

## สรุป (Summary)
<!-- อธิบายสิ่งที่ลูกค้าต้องการเปลี่ยนแปลง -->

## เหตุผล (Reason for Change)
<!-- ทำไมถึงต้องเปลี่ยน -->

## รายละเอียดการเปลี่ยนแปลง (Change Details)
### สิ่งที่ต้องเปลี่ยน
| # | รายการ | สถานะเดิม | สถานะใหม่ |
|---|--------|----------|----------|
| 1 |        |          |          |

### ผลกระทบ (Impact)
- ผลกระทบต่อขอบเขตงาน:
- ผลกระทบต่อไทม์ไลน์:
- ผลกระทบต่อค่าใช้จ่าย:

## ประเมินค่าใช้จ่ายเพิ่มเติม (Cost Estimate)
| # | รายการ | ชั่วโมง | ราคา |
|---|--------|--------|------|
| 1 |        |        |      |
| **รวม** | | | |

## ไทม์ไลน์เพิ่มเติม (Additional Timeline)
- เวลาเพิ่มเติมที่ต้องการ:
- วันส่งมอบใหม่ (ถ้ามี):

---

## การอนุมัติ (Approval)
- สถานะ: รอการอนุมัติ
- อนุมัติโดย:
- วันที่อนุมัติ:
- หมายเหตุ:
- เอกสารแนบ:
```

---

## 3. Development Change Request (DCR)

### Purpose
Document a change to the development approach, system behavior, or technical implementation. DCRs cover a broad range of development changes — not just technical design, but also business logic, workflows, data structures, permissions, reports, and integrations. DCRs may be initiated by the developer or the client. They may or may not have cost implications, but they must be documented for transparency and traceability.

DCR covers:
- Business logic changes
- Workflow changes
- UI/UX changes
- Data field / database changes
- Permission / role changes
- Report changes
- Integration changes (API, payment, third-party)
- Technical design / architecture changes
- Any other development change not covered by a CR

### File Name
`DCR-{number}-{short-description}.md`

Example: `DCR-001-change-db-schema.md`

#### YAML Frontmatter (Required Fields)

```yaml
---
type: development-change-request
dcr_number: "DCR-001"
project: "{project-id}"
client: "{client-id}"
scope_ref: "scope-v1.0"
baseline_ref: ""                 # Reference to current-system/ if existing project
change_kind: technical-design    # behavior | ui | database | report | permission | integration | technical-design | other
status: draft                    # draft | review | sent | approved | rejected | implemented | cancelled
initiated_by: developer          # developer | client
created: 2025-04-15
updated: 2025-04-15
author: "{author-name}"
approved_by: ""
approved_date: ""
---
```

#### Optional Frontmatter Fields

```yaml
has_cost_impact: false
estimated_hours: 0
estimated_cost: 0
currency: THB
related_cr: []
related_dcr: []
```

#### Document Body Sections

```markdown
# Development Change Request: {DCR Number} — {Title}

## ประเภทการเปลี่ยนแปลง (Change Kind)
- ประเภท: {change_kind}

## สรุป (Summary)
<!-- อธิบายสิ่งที่ต้องเปลี่ยนแปลง -->

## เหตุผล (Reason for Change)
<!-- ทำไมถึงต้องเปลี่ยนแนวทางการพัฒนา -->

## ระบบ/พฤติกรรมเดิม (Current State)
<!-- อธิบายสถานะปัจจุบัน (อ้างอิง current-system/ ถ้ามี) -->

## ระบบ/พฤติกรรมใหม่ (Proposed Change)
<!-- อธิบายสิ่งที่จะเปลี่ยนแปลง -->

## เปรียบเทียบ (Comparison)
| หัวข้อ | แบบเดิม | แบบใหม่ |
|--------|---------|---------|
|        |         |         |

## ผลกระทบ (Impact)
- ผลกระทบต่อฟีเจอร์:
- ผลกระทบต่อประสิทธิภาพ:
- ผลกระทบต่อไทม์ไลน์:
- ผลกระทบต่อค่าใช้จ่าย:

## ค่าใช้จ่ายเพิ่มเติม (Additional Cost, if any)
| # | รายการ | ชั่วโมง | ราคา |
|---|--------|--------|------|
| 1 |        |        |      |

---

## การอนุมัติ (Approval)
- สถานะ: รอการอนุมัติ
- อนุมัติโดย:
- วันที่อนุมัติ:
- หมายเหตุ:
- เอกสารแนบ:
```

---

## 4. Support / MA Request

### Purpose
Document a support ticket or maintenance request from a client with an existing system. This covers bug reports, update requests, server maintenance tasks, and any work under a Maintenance Agreement (MA). Having this document prevents "I just asked for a small fix" turning into hours of free work.

### File Name
- Support: `SUP-{number}-{short-description}.md`
- Maintenance: `MA-{number}-{short-description}.md`

Example: `SUP-001-fix-login-bug.md`, `MA-001-monthly-backup-check.md`

#### YAML Frontmatter (Required Fields)

```yaml
---
type: support-request            # support-request | ma-request
request_number: "SUP-001"
project: "{project-id}"
client: "{client-id}"
status: draft                    # draft | received | in-progress | resolved | closed
priority: normal                 # low | normal | high | urgent | critical
category: bug                   # bug | feature-request | update | maintenance | security | other
reported_by: ""                  # Who from client reported this
created: 2025-05-01
updated: 2025-05-01
author: "{author-name}"
---
```

#### Optional Frontmatter Fields

```yaml
is_billable: false               # Whether this is charged to the client
estimated_hours: 0
actual_hours: 0
estimated_cost: 0
actual_cost: 0
currency: THB
ma_contract_ref: ""              # Reference to MA contract
resolved_date: ""
resolution_notes: ""
```

#### Document Body Sections

```markdown
# {Support/MA} Request: {Number} — {Title}

## สรุปปัญหา / คำขอ (Summary)
<!-- อธิบายปัญหาหรือสิ่งที่ต้องการ -->

## ขั้นตอนการเกิดปัญหา (Steps to Reproduce, if bug)
1.
2.
3.

## สิ่งที่คาดหวัง (Expected Behavior)
<!-- ระบบควรทำงานอย่างไร -->

## สิ่งที่เกิดขึ้นจริง (Actual Behavior)
<!-- ระบบทำงานอย่างไรตอนนี้ -->

## สภาพแวดล้อม (Environment)
- URL/ระบบ:
- Browser/OS:
- วันที่เกิดปัญหา:

## การแก้ไข (Resolution)
<!-- บันทึกสิ่งที่ทำเพื่อแก้ไข -->
- สาเหตุ:
- วิธีแก้ไข:
- วันที่แก้ไขเสร็จ:

## เวลาที่ใช้ (Time Spent)
| วันที่ | รายละเอียดงาน | ชั่วโมง |
|--------|--------------|--------|
|        |              |        |
| **รวม** |             |        |

## การเรียกเก็บเงิน (Billing, if applicable)
- อยู่ในสัญญา MA: ใช่/ไม่ใช่
- ค่าใช้จ่ายเพิ่มเติม:
```

---

## 5. Approval Record

### Purpose
Record evidence that a specific document was approved by the client. This is the "proof" document. It links to the approved document and stores evidence such as signed PDFs, screenshots, email confirmations, or typed notes.

### File Name
`APR-{number}-{document-ref}-approved.md`

Example: `APR-001-scope-v1.0-approved.md`

#### YAML Frontmatter (Required Fields)

```yaml
---
type: approval-record
approval_number: "APR-001"
project: "{project-id}"
client: "{client-id}"
approved_document: "scope-v1.0"  # Reference to the document being approved
document_type: scope             # scope | quotation | change-request | development-change-request | acceptance
status: recorded                 # recorded | disputed
approved_by: ""                  # Name of person who approved
approval_method: signed-pdf      # signed-pdf | screenshot | email | verbal | line-chat | in-person | other
approval_date: 2025-03-15
created: 2025-03-15
author: "{author-name}"
---
```

#### Optional Frontmatter Fields

```yaml
notes: ""
witnesses: []                    # Other people present
meeting_date: ""                 # If approved in a meeting
```

#### Document Body Sections

```markdown
# Approval Record: {APR Number}

## เอกสารที่อนุมัติ (Approved Document)
- ประเภทเอกสาร: {document_type}
- ชื่อเอกสาร: {approved_document}
- เวอร์ชัน: {version}
- ลิงก์: [เปิดเอกสาร](./{path-to-document})

## ผู้อนุมัติ (Approved By)
- ชื่อ: {approved_by}
- ตำแหน่ง:
- บริษัท:
- วันที่อนุมัติ: {approval_date}

## วิธีการอนุมัติ (Approval Method)
- วิธี: {approval_method}
<!-- อธิบายรายละเอียดเพิ่มเติม เช่น อนุมัติผ่าน LINE, ลงนามในเอกสาร, email ยืนยัน -->

## หลักฐานการอนุมัติ (Evidence)
<!-- แนบไฟล์หลักฐานจาก attachments/ -->
- [ ] [signed-scope-v1.0.pdf](../attachments/signed-scope-v1.0.pdf)
- [ ] [line-chat-approval.png](../attachments/line-chat-approval.png)

## หมายเหตุ (Notes)
<!-- บันทึกเพิ่มเติม เงื่อนไขพิเศษ ข้อตกลงปากเปล่า -->
```

---

## 6. Acceptance Checklist

### Purpose
Define the criteria for project handover and client acceptance. This checklist is what determines when the project is "done." Both developer and client should agree on this list before or during project kickoff.

### File Name
`acceptance-checklist-v{version}.md`

Example: `acceptance-checklist-v1.0.md`

#### YAML Frontmatter (Required Fields)

```yaml
---
type: acceptance-checklist
version: "1.0"
project: "{project-id}"
client: "{client-id}"
scope_ref: "scope-v1.0"         # The scope this checklist validates
status: draft                    # draft | in-review | accepted | disputed
created: 2025-03-01
updated: 2025-06-15
author: "{author-name}"
accepted_by: ""
accepted_date: ""
---
```

#### Optional Frontmatter Fields

```yaml
review_date: ""                  # Date of review meeting
review_attendees: []
notes: ""
```

#### Document Body Sections

```markdown
# Acceptance Checklist: {Project Name}

## ข้อมูลการตรวจรับ (Review Information)
- โครงการ: {project_name}
- ขอบเขตอ้างอิง: {scope_ref}
- วันที่ตรวจรับ:
- ผู้ตรวจรับ:

## รายการตรวจรับ (Checklist Items)

### ฟังก์ชันการทำงาน (Functionality)
| # | รายการ | เกณฑ์ | ผ่าน | หมายเหตุ |
|---|--------|------|------|---------|
| 1 |        |      | ☐    |         |
| 2 |        |      | ☐    |         |

### UI/UX
| # | รายการ | เกณฑ์ | ผ่าน | หมายเหตุ |
|---|--------|------|------|---------|
| 1 |        |      | ☐    |         |

### ประสิทธิภาพ (Performance)
| # | รายการ | เกณฑ์ | ผ่าน | หมายเหตุ |
|---|--------|------|------|---------|
| 1 |        |      | ☐    |         |

### ความปลอดภัย (Security)
| # | รายการ | เกณฑ์ | ผ่าน | หมายเหตุ |
|---|--------|------|------|---------|
| 1 |        |      | ☐    |         |

### สิ่งที่ส่งมอบ (Deliverables)
| # | รายการ | ส่งมอบแล้ว | หมายเหตุ |
|---|--------|-----------|---------|
| 1 | Source code |     ☐ |         |
| 2 | เอกสารประกอบ |  ☐ |         |
| 3 | ข้อมูลเข้าสู่ระบบ | ☐ |       |

## สรุปผลการตรวจรับ (Summary)
- รายการทั้งหมด: {total}
- ผ่าน: {passed}
- ไม่ผ่าน: {failed}
- ผลลัพธ์: ☐ ยอมรับ / ☐ ยอมรับแบบมีเงื่อนไข / ☐ ไม่ยอมรับ

## เงื่อนไขเพิ่มเติม (Conditions, if any)
<!-- ถ้ายอมรับแบบมีเงื่อนไข ระบุเงื่อนไขที่นี่ -->

---

## การยอมรับงาน (Acceptance)
- สถานะ: รอการยอมรับ
- ยอมรับโดย:
- วันที่ยอมรับ:
- หมายเหตุ:
- เอกสารแนบ:
```

---

## Generated Sections

The following sections are auto-populated by the app when creating a document from a template:

| Section | Source |
|---|---|
| Vendor Information (in quotation) | `scopeflow.yaml` workspace settings |
| Client Information | `_client.yaml` client profile |
| Project name and dates | `_project.yaml` project metadata |
| Document number (CR-001, etc.) | Auto-incremented per project |
| Version number | Default `1.0` for new documents |
| Created/Updated dates | System date |
| Author | From app settings |

Users can always override auto-populated values.
