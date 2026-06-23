# ScopeFlow Thai — MVP User Flows

## Overview

This document defines the core user flows for the ScopeFlow Thai MVP. Each flow describes a specific user action from start to finish. These flows cover everything a Thai freelancer needs to go from "new client" to "approved and paid."

---

## Flow 1: Create Client

**Goal:** Register a new client so projects can be created under them.

**Trigger:** User clicks "New Client" or navigates to Clients → Add New

### Steps

1. User opens ScopeFlow and navigates to the client list
2. User clicks **"+ สร้างลูกค้าใหม่"** (Create New Client)
3. App shows a form with fields:
   - ชื่อลูกค้า / บริษัท (required)
   - ชื่อผู้ติดต่อ (required)
   - อีเมล
   - เบอร์โทร
   - LINE ID
   - ที่อยู่
   - เลขผู้เสียภาษี
   - หมายเหตุ
4. User fills in the form and clicks **"บันทึก"** (Save)
5. App creates:
   - Folder: `clients/{client-id}/`
   - File: `clients/{client-id}/_client.yaml`
   - Folder: `clients/{client-id}/projects/`
6. Client appears in the sidebar under "ลูกค้า"

### Result
- `_client.yaml` created with all entered data
- Client folder structure ready for projects

---

## Flow 2: Create Project

**Goal:** Create a new project under an existing client.

**Trigger:** User selects a client and clicks "New Project"

### Steps

1. User selects a client from the sidebar
2. User clicks **"+ สร้างโครงการใหม่"** (Create New Project)
3. App shows a form with fields:
   - ชื่อโครงการ (required)
   - ประเภท: โครงการใหม่ / ดูแลระบบ (MA) / สัญญาซัพพอร์ต (required)
   - วันเริ่มต้น
   - วันที่คาดว่าจะเสร็จ
   - หมายเหตุ
4. User fills in and clicks **"บันทึก"**
5. App creates the full project folder structure:
   ```
   clients/{client-id}/projects/{project-id}/
   ├── _project.yaml
   ├── current-system/        # Only for maintenance/support projects
   ├── baseline/
   ├── change-requests/
   ├── support-requests/
   ├── approvals/
   ├── acceptance/
   ├── exports/
   └── attachments/
   ```
6. If project type is maintenance or support-contract, the app also creates:
   - `current-system/overview.md` (empty template)
   - `current-system/modules.yaml` (empty structure)
   - `current-system/pages.yaml` (empty structure)
   - `current-system/roles.yaml` (empty structure)
   - `current-system/integrations.yaml` (empty structure)
   - `current-system/known-limitations.md` (empty template)
6. Project appears in the sidebar under the client

### Result
- `_project.yaml` created with project metadata
- All subfolders created and ready for documents

---

## Flow 3: Create New Project Document (Scope + Quotation)

**Goal:** Create the baseline scope and quotation documents for a new project.

**Trigger:** User opens a project and clicks "Create Scope" or "Create Quotation"

### Steps

1. User navigates to a project in the sidebar
2. User clicks **"+ สร้างขอบเขตงาน"** (Create Scope)
3. App creates `baseline/scope-v1.0.md` from the scope template
   - Auto-populates: project name, client name, dates, author
   - Status set to `draft`
4. App opens the document in the editor
5. User fills in the scope sections:
   - ภาพรวมโครงการ
   - ขอบเขตงาน (In Scope / Out of Scope)
   - ข้อกำหนดทางเทคนิค
   - เงื่อนไขการส่งมอบ
   - ไทม์ไลน์
   - เงื่อนไขการยอมรับงาน
6. User saves the document (auto-save or manual)
7. User clicks **"+ สร้างใบเสนอราคา"** (Create Quotation)
8. App creates `baseline/quotation-v1.0.md` from the quotation template
   - Auto-populates: vendor info from `scopeflow.yaml`, client info from `_client.yaml`
   - `scope_ref` set to `scope-v1.0`
9. User fills in pricing, payment terms, and conditions
10. User saves

### Result
- `baseline/scope-v1.0.md` created with full scope
- `baseline/quotation-v1.0.md` created with pricing
- Both documents in `draft` status, ready for review and export

---

## Flow 4: Create Change Request (CR)

**Goal:** Document a client's request to change something from the approved scope.

**Trigger:** Client asks for a change. Developer creates a CR to document it.

### Steps

1. User navigates to a project
2. User clicks **"+ สร้าง Change Request"**
3. App determines the next CR number (e.g., CR-002 if CR-001 exists)
4. App shows a form:
   - หัวข้อ / ชื่อย่อ (required) — used for the file name
   - ลำดับความสำคัญ
   - ผู้ร้องขอ (จากฝั่งลูกค้า)
5. User fills in and clicks **"สร้าง"**
6. App creates `change-requests/CR-002-{short-desc}.md` from the CR template
   - Auto-populates: CR number, project, client, scope reference, dates
   - Status set to `draft`
7. App opens the document in the editor
8. User fills in:
   - สรุปการเปลี่ยนแปลง
   - เหตุผล
   - รายละเอียดการเปลี่ยนแปลง
   - ผลกระทบ
   - ประเมินค่าใช้จ่ายเพิ่มเติม
   - ไทม์ไลน์เพิ่มเติม
9. User saves

### Result
- CR document created in `change-requests/`
- Document tracks what changed, why, impact, and cost
- Ready to send to client for review and approval

---

## Flow 5: Create Development Change Request (DCR)

**Goal:** Document a development change — business logic, workflow, database, permissions, reports, integrations, UI, or technical design.

**Trigger:** Developer or client identifies a need to change how the system works.

### Steps

1. User navigates to a project
2. User clicks **"+ สร้าง Development Change Request"**
3. App determines the next DCR number
4. App shows a form:
   - หัวข้อ / ชื่อย่อ (required)
   - ประเภทการเปลี่ยนแปลง: behavior / ui / database / report / permission / integration / technical-design / other (required)
   - เริ่มต้นโดย: Developer / Client
   - มีผลต่อค่าใช้จ่าย: ใช่ / ไม่ใช่
5. User fills in and clicks **"สร้าง"**
6. App creates `change-requests/DCR-{number}-{short-desc}.md` from the DCR template
   - If the project has `current-system/`, the `baseline_ref` field is auto-set
7. User fills in:
   - ระบบ/พฤติกรรมเดิม vs. ระบบ/พฤติกรรมใหม่
   - เปรียบเทียบ
   - ผลกระทบ
   - ค่าใช้จ่ายเพิ่มเติม (ถ้ามี)
8. User saves

### Result
- DCR document created in `change-requests/`
- Clear comparison of current state vs. proposed change
- Transparent record of development decisions
- References current-system baseline if available

---

## Flow 6: Create Support Request

**Goal:** Document a support ticket or maintenance request from a client.

**Trigger:** Client reports a bug, requests an update, or needs maintenance work.

### Steps

1. User navigates to a project
2. User clicks **"+ สร้าง Support Request"** or **"+ สร้าง MA Request"**
3. App determines the next request number (SUP-001 or MA-001)
4. App shows a form:
   - หัวข้อ / ชื่อย่อ (required)
   - ประเภท: Bug / Feature Request / Update / Maintenance / Security / Other
   - ลำดับความสำคัญ
   - แจ้งโดย (จากฝั่งลูกค้า)
   - คิดค่าใช้จ่าย: ใช่ / ไม่ใช่
5. User fills in and clicks **"สร้าง"**
6. App creates `support-requests/SUP-001-{short-desc}.md` from the support template
7. User fills in:
   - สรุปปัญหา
   - ขั้นตอนการเกิดปัญหา (ถ้าเป็น bug)
   - สิ่งที่คาดหวัง vs. สิ่งที่เกิดขึ้นจริง
   - สภาพแวดล้อม
8. After resolving, user updates:
   - การแก้ไข
   - เวลาที่ใช้
   - การเรียกเก็บเงิน
9. User changes status to `resolved` or `closed`

### Result
- Support request documented with all details
- Time tracking and billing info recorded
- Clear evidence of work done

---

## Flow 7: Export Approval Pack

**Goal:** Bundle scope + quotation (or any document set) into a professional PDF package to send to the client for approval.

**Trigger:** User finishes drafting documents and is ready to send to client.

### Steps

1. User navigates to a project
2. User clicks **"ส่งออกชุดเอกสาร"** (Export Approval Pack)
3. App shows a dialog to select which documents to include:
   - ☑ Scope v1.0
   - ☑ Quotation v1.0
   - ☐ CR-001
   - ☐ Acceptance Checklist
4. User selects documents and clicks **"ส่งออก PDF"**
5. App generates a combined PDF with:
   - Cover page (project name, client, date)
   - Table of contents
   - Each selected document rendered as PDF pages
   - Approval signature area at the end
6. PDF is saved to the project-level `exports/` folder:
   - `clients/{client-id}/projects/{project-id}/exports/{project-id}-approval-pack-{date}.pdf`
7. App shows the saved file path and offers to open the folder

### Alternative: Export Single Document
- User can also right-click any document → **"ส่งออก PDF"** or **"ส่งออก Markdown"**
- Single document exported to the project's `exports/` folder

### Result
- Professional PDF ready to send via LINE, email, or print
- Client can review, sign, and return
- Developer has a clean document to reference

---

## Flow 8: Record Manual Approval

**Goal:** Record that a client has approved a specific document, with evidence.

**Trigger:** Client approves a document (via signed PDF, LINE message, email, verbal, or in-person).

### Steps

1. User navigates to the document that was approved (e.g., `scope-v1.0.md`)
2. User clicks **"บันทึกการอนุมัติ"** (Record Approval)
3. App shows a form:
   - เอกสารที่อนุมัติ: (auto-filled from current document)
   - ผู้อนุมัติ (ชื่อ) (required)
   - วิธีการอนุมัติ: PDF ลงนาม / ภาพหน้าจอ / อีเมล / LINE / ปากเปล่า / ในที่ประชุม / อื่นๆ (required)
   - วันที่อนุมัติ (required)
   - หมายเหตุ
   - แนบไฟล์: (file picker — PDF, image, etc.)
4. User fills in and attaches evidence files
5. User clicks **"บันทึก"**
6. App creates:
   - `approvals/APR-{number}-{doc-ref}-approved.md` — the approval record
   - Copies attached files to `attachments/`
   - Updates the original document's frontmatter:
     - `status: approved`
     - `approved_by: {name}`
     - `approved_date: {date}`
7. Approval record appears in the project's approval list

### Result
- Approval record created with evidence
- Original document marked as approved
- Evidence files stored in `attachments/`
- Clear audit trail

---

## Flow 9: Lock Approved Version

**Goal:** Make an approved document read-only so it cannot be accidentally edited.

**Trigger:** After approval is recorded, the document should be locked.

### Steps

1. After recording approval (Flow 8), the app prompts:
   > "ต้องการล็อกเอกสารเวอร์ชันนี้หรือไม่? เอกสารที่ล็อกจะไม่สามารถแก้ไขได้"
   > (Do you want to lock this version? Locked documents cannot be edited.)
2. User clicks **"ล็อก"** (Lock)
3. App updates the document frontmatter:
   ```yaml
   status: approved
   locked: true
   locked_date: 2025-03-15
   ```
4. The document becomes read-only in the editor
5. A lock icon (🔒) appears next to the document in the sidebar
6. If the user tries to edit a locked document, the app shows:
   > "เอกสารนี้ถูกล็อกแล้ว สร้างเวอร์ชันใหม่เพื่อแก้ไข"
   > (This document is locked. Create a new version to edit.)

### Unlock Override
- User can unlock via **"ปลดล็อก"** (Unlock) with a confirmation:
  > "คำเตือน: การปลดล็อกเอกสารที่อนุมัติแล้วอาจทำให้หลักฐานการอนุมัติไม่ตรงกัน"
  > (Warning: Unlocking an approved document may invalidate approval evidence.)
- Unlocking changes `locked: false` and adds `unlock_note` to frontmatter

### Result
- Approved documents are protected from accidental edits
- Clear visual indication of locked status
- Override available with warning

---

## Flow 10: Create Revision

**Goal:** Create a new version of a document when changes are needed after the current version is approved or sent.

**Trigger:** Client requests changes to an approved scope, or developer needs to update a quotation.

### Steps

1. User opens a document (e.g., `scope-v1.0.md` which is locked/approved)
2. User clicks **"สร้างเวอร์ชันใหม่"** (Create New Version)
3. App shows a dialog:
   - เวอร์ชันปัจจุบัน: v1.0
   - เวอร์ชันใหม่: v1.1 (minor) or v2.0 (major)
   - User selects version type
4. User clicks **"สร้าง"**
5. App creates a copy of the document with the new version number:
   - Source: `scope-v1.0.md`
   - New file: `scope-v1.1.md`
6. New document has updated frontmatter:
   ```yaml
   version: "1.1"
   status: draft
   locked: false
   previous_version: "scope-v1.0"
   created: {today}
   updated: {today}
   approved_by: ""
   approved_date: ""
   ```
7. Previous version remains locked and unchanged
8. App opens the new version for editing
9. User makes changes and saves

### Version History
- The sidebar shows all versions of a document
- Each version links to its `previous_version`
- Approved versions are marked with 🔒
- Current/latest version is highlighted

### Result
- New editable version created from approved version
- Previous version preserved unchanged
- Clear version history and traceability

---

## Flow Summary

| # | Flow | Creates | Key Output |
|---|------|---------|-----------|
| 1 | Create Client | `_client.yaml` | Client profile + folder structure |
| 2 | Create Project | `_project.yaml` + folders | Project ready for documents |
| 3 | Create Scope + Quotation | `scope-v1.0.md`, `quotation-v1.0.md` | Baseline documents |
| 4 | Create CR | `CR-{n}-{desc}.md` | Change request with cost estimate |
| 5 | Create DCR | `DCR-{n}-{desc}.md` | Development change with comparison |
| 6 | Create Support Request | `SUP/MA-{n}-{desc}.md` | Support ticket with time tracking |
| 7 | Export Approval Pack | PDF in project `exports/` | Professional document package |
| 8 | Record Approval | `APR-{n}-{ref}.md` + attachments | Approval evidence |
| 9 | Lock Version | Updated frontmatter | Read-only protection |
| 10 | Create Revision | New versioned file | Editable copy, old preserved |

---

## Typical End-to-End Scenario

```
1. สร้างลูกค้า "บริษัท ABC"
2. สร้างโครงการ "ทำเว็บไซต์ใหม่"
3. สร้างขอบเขตงาน v1.0 → แก้ไข → ส่งออก PDF
4. ส่ง PDF ให้ลูกค้าทาง LINE
5. ลูกค้าพิมพ์เซ็น → ถ่ายรูปส่งกลับ
6. บันทึกการอนุมัติ → แนบรูปที่ลูกค้าเซ็น
7. ล็อกเวอร์ชัน scope-v1.0
8. สร้างใบเสนอราคา v1.0 → ส่งออก → ส่งลูกค้า
9. ลูกค้าอนุมัติทาง LINE → บันทึกการอนุมัติ → ล็อก
10. เริ่มทำงาน...
11. ลูกค้าขอเพิ่มระบบจ่ายเงิน → สร้าง CR-001
12. ประเมินราคา → ส่ง CR ให้ลูกค้า → ลูกค้าอนุมัติ
13. บันทึกการอนุมัติ CR-001
14. ทำงานเสร็จ → สร้าง Acceptance Checklist
15. ตรวจรับงานร่วมกับลูกค้า → บันทึกการยอมรับ
16. เสร็จสิ้น ✓
```
