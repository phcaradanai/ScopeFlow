# ScopeFlow Thai — Implementation-Ready Specification

> This is the final, consolidated specification for ScopeFlow Thai. It supersedes any conflicting detail in the earlier planning docs. Use this document as the single reference for implementation.

---

## 1. Final Product Definition

### What It Is
ScopeFlow Thai is a local-first, offline desktop app that helps Thai freelancers and small agencies create, manage, and track project scope documents, quotations, change requests, and approval records.

### How It Works
- All data lives as **Markdown and YAML files** in a local workspace folder
- No internet, no cloud, no login, no AI
- Documents are created from templates, versioned, approved, and exported as PDF
- SQLite is only used for search index and app state — never as source of truth

### Who It's For
Thai freelance developers, app developers, small software houses, and small agencies who work with Thai clients and need to document scope, track changes, and prove approvals.

### Core Pain It Solves
> "ลูกค้าบอกว่า ฉันคิดว่ารวมอยู่แล้ว" — Clients say "I thought this was included."

ScopeFlow prevents this by making scope, changes, and approvals structured, versioned, and provable.

---

## 2. Source of Truth Rule

> **Markdown and YAML files are the ONLY source of truth.**

| Layer | Role | Deletable? |
|---|---|---|
| `.md` and `.yaml` files | Source of truth for all project data | ❌ Never auto-delete |
| `.scopeflow/index.db` (SQLite) | Derived search index + cache | ✅ Delete and rebuild anytime |
| `.scopeflow/state.json` | App UI state (last opened project, etc.) | ✅ Deletable, app uses defaults |

### Rules
1. The app must **never** require SQLite to reconstruct project documents
2. Deleting `.scopeflow/` must be non-destructive — the app rebuilds it on next open
3. All document metadata lives in YAML frontmatter, not in SQLite
4. SQLite is populated by scanning workspace files — it is a read-derived cache
5. If SQLite and files disagree, **files win**

---

## 3. MVP Stages

### MVP-A: File Workspace Core

**The foundation. Everything is files.**

| Item | Description |
|---|---|
| Workspace init | Create workspace folder + `scopeflow.yaml` |
| Client profiles | Create/edit/list `_client.yaml` files |
| Project creation | Create project folder structure + `_project.yaml` |
| Current system baseline | `current-system/` folder for maintenance/support projects |
| Document creation | All 6 document types from templates |
| Markdown editor | Edit documents with YAML frontmatter |
| Document versioning | Manual version bump (minor/major) |
| Revision creation | Create new version from existing document |
| Sidebar navigation | Clients → Projects → Documents tree |
| Thai language UI | All labels and messages in Thai |

### MVP-B: Approval + Lock

**Minimal approval recording to make documents trustworthy.**

| Item | Description |
|---|---|
| Lock/unlock | Set `locked: true` in frontmatter, block editing |
| Status transitions | `draft` → `review` → `sent` → `approved` → `locked` |
| Approval recording | Create approval record with evidence attachments |
| Attachment handling | Copy evidence files to `attachments/` |
| Status update | Update original document status on approval |

### MVP-C: PDF Export

**Make documents sendable to clients.**

| Item | Description |
|---|---|
| Single PDF export | Render one document as PDF |
| Markdown export | Copy document as clean Markdown |
| Approval pack | Bundle multiple documents into one PDF with cover page |
| Export location | Save to project-level `exports/` folder |

### MVP-D: SQLite Search

**Make the workspace navigable at scale.**

| Item | Description |
|---|---|
| Index builder | Scan workspace files → populate SQLite |
| Full-text search | Search across all document content |
| Filters | Filter by client, project, type, status |
| Auto-rebuild | Detect missing index → rebuild from files |

### First Coding Milestone

> **Implement MVP-A in full + minimal MVP-B (lock/unlock + status field).**

The goal: a user can create a workspace, add clients, add projects, create all document types, version documents, and lock approved versions — all as files on disk. No PDF export, no search index, no approval records yet.

---

## 4. Final Workspace Tree

```
my-workspace/
├── scopeflow.yaml                            # Workspace config
├── templates/                                # User-overridable templates
│   ├── scope.md
│   ├── quotation.md
│   ├── change-request.md
│   ├── development-change-request.md
│   ├── support-request.md
│   ├── approval-record.md
│   └── acceptance-checklist.md
├── clients/
│   └── {client-id}/
│       ├── _client.yaml                      # Client profile
│       └── projects/
│           └── {project-id}/
│               ├── _project.yaml             # Project metadata
│               ├── current-system/           # Only for maintenance/support
│               │   ├── overview.md
│               │   ├── modules.yaml
│               │   ├── pages.yaml
│               │   ├── roles.yaml
│               │   ├── integrations.yaml
│               │   └── known-limitations.md
│               ├── baseline/                 # Scope + quotation
│               │   ├── scope-v1.0.md
│               │   └── quotation-v1.0.md
│               ├── change-requests/          # CR + DCR
│               │   ├── CR-001-xxx.md
│               │   └── DCR-001-xxx.md
│               ├── support-requests/         # SUP + MA
│               │   ├── SUP-001-xxx.md
│               │   └── MA-001-xxx.md
│               ├── approvals/                # Approval records
│               │   └── APR-001-xxx.md
│               ├── acceptance/               # Acceptance checklists
│               │   └── acceptance-checklist-v1.0.md
│               ├── exports/                  # PDF/MD exports
│               └── attachments/              # Binary evidence files
└── .scopeflow/                               # Git-ignorable, rebuildable
    ├── index.db
    ├── state.json
    └── thumbnails/
```

---

## 5. Final Document Type Definitions

### 5.1 Document Types

| Type ID | Full Name | File Pattern | Location |
|---|---|---|---|
| `scope` | Project Scope | `scope-v{ver}.md` | `baseline/` |
| `quotation` | Quotation | `quotation-v{ver}.md` | `baseline/` |
| `change-request` | Change Request (CR) | `CR-{n}-{desc}.md` | `change-requests/` |
| `development-change-request` | Development Change Request (DCR) | `DCR-{n}-{desc}.md` | `change-requests/` |
| `support-request` | Support Request | `SUP-{n}-{desc}.md` | `support-requests/` |
| `ma-request` | Maintenance Request | `MA-{n}-{desc}.md` | `support-requests/` |
| `approval-record` | Approval Record | `APR-{n}-{ref}.md` | `approvals/` |
| `acceptance-checklist` | Acceptance Checklist | `acceptance-checklist-v{ver}.md` | `acceptance/` |

### 5.2 DCR Change Kinds

DCR (Development Change Request) covers all development changes, not just technical design:

| `change_kind` value | Description | Example |
|---|---|---|
| `behavior` | Business logic / workflow change | "เปลี่ยนเงื่อนไขการอนุมัติจาก 1 คน เป็น 2 คน" |
| `ui` | UI/UX change | "ย้ายปุ่ม Submit ไปด้านบน" |
| `database` | Data field / schema change | "เพิ่มฟิลด์ phone2 ในตาราง users" |
| `report` | Report / dashboard change | "เพิ่มรายงานยอดขายรายเดือน" |
| `permission` | Role / permission change | "เพิ่ม role Editor ที่แก้ไขได้แต่ลบไม่ได้" |
| `integration` | API / third-party change | "เปลี่ยนจาก payment gateway A เป็น B" |
| `technical-design` | Architecture / tech stack change | "เปลี่ยน ORM จาก Sequelize เป็น Prisma" |
| `other` | Other development change | Catch-all |

### 5.3 Current System Baseline

For projects with type `maintenance` or `support-contract`, the `current-system/` folder documents the existing system state. CR and DCR documents should reference this baseline when available.

| File | Purpose | Required? |
|---|---|---|
| `overview.md` | Free-form system overview | Recommended |
| `modules.yaml` | List of modules/features | Optional |
| `pages.yaml` | List of pages/screens | Optional |
| `roles.yaml` | User roles and permissions | Optional |
| `integrations.yaml` | External integrations | Optional |
| `known-limitations.md` | Known bugs, tech debt | Optional |

---

## 6. Final File Schemas

### 6.1 `scopeflow.yaml` — Workspace Config

```yaml
workspace:
  name: "My Freelance Workspace"
  created: 2025-03-01
  version: "1.0"

settings:
  language: "th"                     # th | en
  currency: "THB"
  date_format: "YYYY-MM-DD"
  default_vat_percent: 7
  company_name: "บริษัท ตัวอย่าง จำกัด"
  company_address: "123 ถ.สุขุมวิท กรุงเทพฯ 10110"
  company_tax_id: "0105500000000"
  company_phone: "02-000-0000"
  company_email: "contact@example.co.th"
  author_name: "สมชาย Developer"     # Default author for new documents
```

### 6.2 `_client.yaml` — Client Profile

```yaml
client:
  id: "acme-corp"                    # Must match folder name
  name: "บริษัท Acme จำกัด"
  contact_person: "คุณสมหญิง"
  email: "somying@acme.co.th"
  phone: "081-000-0000"
  line_id: "somying_acme"
  address: "456 ถ.พหลโยธิน กรุงเทพฯ 10400"
  tax_id: "0105500000001"
  notes: "ติดต่อผ่าน LINE เป็นหลัก"
  created: 2025-03-01
  updated: 2025-03-01
```

### 6.3 `_project.yaml` — Project Metadata

```yaml
project:
  id: "website-redesign-2025"       # Must match folder name
  name: "Website Redesign 2025"
  client: "acme-corp"               # Must match client folder name
  type: "new-project"               # new-project | maintenance | support-contract
  status: "active"                  # draft | active | completed | archived
  has_current_system: false         # true if current-system/ is populated
  start_date: 2025-03-01
  target_date: 2025-06-30
  notes: "ออกแบบใหม่ทั้งหมด รวม responsive"
  created: 2025-03-01
  updated: 2025-03-05
```

### 6.4 `current-system/modules.yaml`

```yaml
modules:
  - id: "user-management"
    name: "ระบบจัดการผู้ใช้"
    description: "สมัครสมาชิก, เข้าสู่ระบบ, จัดการโปรไฟล์"
    status: "active"                # active | deprecated | partial
    notes: ""
  - id: "product-catalog"
    name: "ระบบสินค้า"
    description: "จัดการสินค้า, หมวดหมู่, ราคา"
    status: "active"
    notes: "ใช้ API เก่า ต้อง migrate"
```

### 6.5 `current-system/pages.yaml`

```yaml
pages:
  - id: "home"
    name: "หน้าแรก"
    url: "/"
    module: "general"
    notes: ""
  - id: "product-list"
    name: "รายการสินค้า"
    url: "/products"
    module: "product-catalog"
    notes: "มี pagination แต่ช้า"
```

### 6.6 `current-system/roles.yaml`

```yaml
roles:
  - id: "admin"
    name: "ผู้ดูแลระบบ"
    permissions: ["all"]
    notes: ""
  - id: "editor"
    name: "ผู้แก้ไขเนื้อหา"
    permissions: ["content.create", "content.edit", "content.view"]
    notes: "ไม่มีสิทธิ์ลบ"
  - id: "viewer"
    name: "ผู้ดูอย่างเดียว"
    permissions: ["content.view"]
    notes: ""
```

### 6.7 `current-system/integrations.yaml`

```yaml
integrations:
  - id: "payment-gateway"
    name: "ระบบจ่ายเงิน"
    provider: "2C2P"
    type: "api"                     # api | webhook | file | manual
    status: "active"
    notes: "ใช้ API v3 ต้อง upgrade เป็น v4"
  - id: "email-service"
    name: "ระบบส่งอีเมล"
    provider: "SendGrid"
    type: "api"
    status: "active"
    notes: ""
```

### 6.8 Scope Frontmatter

```yaml
---
type: scope
version: "1.0"
project: "website-redesign-2025"
client: "acme-corp"
status: draft                       # See lifecycle table (Section 7)
created: 2025-03-01
updated: 2025-03-05
author: "สมชาย Developer"
locked: false
locked_date: ""
previous_version: ""                # Empty for first version
approved_by: ""
approved_date: ""
# Optional
tags: []
priority: normal                    # low | normal | high | urgent
target_start: ""
target_end: ""
related_documents: []
---
```

### 6.9 Quotation Frontmatter

```yaml
---
type: quotation
version: "1.0"
project: "website-redesign-2025"
client: "acme-corp"
scope_ref: "scope-v1.0"
status: draft                       # See lifecycle table (Section 7)
created: 2025-03-01
updated: 2025-03-05
author: "สมชาย Developer"
currency: THB
vat_percent: 7
valid_until: 2025-04-01
locked: false
locked_date: ""
previous_version: ""
approved_by: ""
approved_date: ""
# Optional
discount_percent: 0
payment_terms: "50/50"
warranty_days: 30
---
```

### 6.10 CR Frontmatter

```yaml
---
type: change-request
cr_number: "CR-001"
project: "website-redesign-2025"
client: "acme-corp"
scope_ref: "scope-v1.0"
baseline_ref: ""                    # Reference to current-system/ if existing project
status: draft                       # See lifecycle table (Section 7)
priority: normal                    # low | normal | high | urgent
created: 2025-04-10
updated: 2025-04-10
author: "สมชาย Developer"
requested_by: ""
locked: false
locked_date: ""
approved_by: ""
approved_date: ""
# Optional
estimated_hours: 0
estimated_cost: 0
currency: THB
deadline: ""
related_cr: []
---
```

### 6.11 DCR Frontmatter

```yaml
---
type: development-change-request
dcr_number: "DCR-001"
project: "website-redesign-2025"
client: "acme-corp"
scope_ref: "scope-v1.0"
baseline_ref: ""                    # Reference to current-system/ if existing project
change_kind: technical-design       # behavior | ui | database | report | permission | integration | technical-design | other
status: draft                       # See lifecycle table (Section 7)
initiated_by: developer             # developer | client
created: 2025-04-15
updated: 2025-04-15
author: "สมชาย Developer"
locked: false
locked_date: ""
approved_by: ""
approved_date: ""
# Optional
has_cost_impact: false
estimated_hours: 0
estimated_cost: 0
currency: THB
related_cr: []
related_dcr: []
---
```

### 6.12 Support/MA Request Frontmatter

```yaml
---
type: support-request               # support-request | ma-request
request_number: "SUP-001"
project: "ecommerce-ma-2025"
client: "somchai-shop"
status: draft                       # See lifecycle table (Section 7)
priority: normal                    # low | normal | high | urgent | critical
category: bug                      # bug | feature-request | update | maintenance | security | other
reported_by: ""
created: 2025-05-01
updated: 2025-05-01
author: "สมชาย Developer"
# Optional
is_billable: false
estimated_hours: 0
actual_hours: 0
estimated_cost: 0
actual_cost: 0
currency: THB
ma_contract_ref: ""
resolved_date: ""
resolution_notes: ""
---
```

### 6.13 Approval Record Frontmatter

```yaml
---
type: approval-record
approval_number: "APR-001"
project: "website-redesign-2025"
client: "acme-corp"
approved_document: "scope-v1.0"
document_type: scope                # scope | quotation | change-request | development-change-request | acceptance
status: recorded                    # recorded | disputed
approved_by: "คุณสมหญิง"
approval_method: signed-pdf         # signed-pdf | screenshot | email | verbal | line-chat | in-person | other
approval_date: 2025-03-15
created: 2025-03-15
author: "สมชาย Developer"
# Optional
notes: ""
witnesses: []
meeting_date: ""
evidence_files: []                  # Relative paths to attachments/
---
```

### 6.14 Acceptance Checklist Frontmatter

```yaml
---
type: acceptance-checklist
version: "1.0"
project: "website-redesign-2025"
client: "acme-corp"
scope_ref: "scope-v1.0"
status: draft                       # See lifecycle table (Section 7)
created: 2025-03-01
updated: 2025-06-15
author: "สมชาย Developer"
locked: false
locked_date: ""
previous_version: ""
accepted_by: ""
accepted_date: ""
# Optional
review_date: ""
review_attendees: []
notes: ""
---
```

---

## 7. Document Lifecycle State Model

### 7.1 All Possible Statuses

| Status | Meaning |
|---|---|
| `draft` | Document is being written. Editable. |
| `review` | Document is ready for internal review. Editable. |
| `sent` | Document has been sent to client. Editable (until approved). |
| `approved` | Client has approved. Should be locked. |
| `locked` | Read-only. Protected from edits. (Stored as `locked: true` field.) |
| `superseded` | A newer version exists. This version is archived. |
| `implemented` | The change described has been implemented (CR/DCR). |
| `resolved` | The issue has been fixed (support request). |
| `closed` | Final state. No more action needed. |
| `rejected` | Client rejected the document. |
| `cancelled` | Document was cancelled before completion. |

### 7.2 Valid Statuses per Document Type

| Document Type | Valid Statuses |
|---|---|
| `scope` | draft, review, sent, approved, locked, superseded, rejected, cancelled |
| `quotation` | draft, review, sent, approved, locked, superseded, rejected, cancelled |
| `change-request` | draft, review, sent, approved, locked, rejected, implemented, cancelled |
| `development-change-request` | draft, review, sent, approved, locked, rejected, implemented, cancelled |
| `support-request` / `ma-request` | draft, received, in-progress, resolved, closed, cancelled |
| `approval-record` | recorded, disputed |
| `acceptance-checklist` | draft, review, sent, accepted, disputed, closed |

### 7.3 Typical Status Transitions

**Scope / Quotation:**
```
draft → review → sent → approved → locked
                    ↘ rejected
                    ↘ cancelled
approved → superseded (when new version is created)
```

**CR / DCR:**
```
draft → review → sent → approved → locked → implemented
                    ↘ rejected
                    ↘ cancelled
```

**Support Request:**
```
draft → received → in-progress → resolved → closed
                                    ↘ cancelled
```

**Approval Record:**
```
recorded → disputed (if evidence is challenged)
```

### 7.4 Lock vs. Status

`locked` is a **separate boolean field**, not a status. A document can be `approved` and `locked: true`. The `locked` field controls editability. The `status` field tracks the document lifecycle.

```yaml
status: approved
locked: true
locked_date: 2025-03-15
```

---

## 8. Billing Boundaries

### What ScopeFlow Stores (within documents)

| Field | Document Types | Purpose |
|---|---|---|
| Quotation amounts + line items | `quotation` | Define project price |
| `estimated_hours` | CR, DCR, support | Estimate effort |
| `estimated_cost` | CR, DCR, support | Estimate cost impact |
| `actual_hours` | support, MA | Track time spent |
| `actual_cost` | support, MA | Track actual cost |
| `is_billable` | support, MA | Flag whether work is charged |
| `vat_percent` | quotation | Basic VAT for price summary |

### What ScopeFlow Does NOT Do

| Feature | Status |
|---|---|
| Invoice generation | ❌ Never |
| Payment tracking | ❌ Never |
| Receipt management | ❌ Never |
| Accounting integration | ❌ Never |
| Tax calculation beyond VAT on quotation | ❌ Never |
| Legal advice | ❌ Never |

> ScopeFlow stores cost data **within documents** for scope tracking. It is not a billing system.

---

## 9. Implementation Guardrails

### Must

1. All project data stored as `.md` / `.yaml` files
2. SQLite index rebuildable from files at any time
3. App works 100% offline
4. No network requests of any kind
5. No user accounts or login
6. Documents readable by any text editor
7. Workspace folder is portable (copy to USB = full backup)

### Must Not

1. ❌ AI features of any kind
2. ❌ Cloud sync or remote storage
3. ❌ Client-facing portal or web UI
4. ❌ Online approval links
5. ❌ Invoice or payment system
6. ❌ E-signature integration
7. ❌ Task tracker or project board
8. ❌ Chat or messaging
9. ❌ CRM features
10. ❌ Legal or tax advice

### Should

1. Dark mode (defer to post-MVP-A if needed)
2. Keyboard shortcuts for common actions
3. Auto-save on edit

### Should Not (Yet)

1. Custom template builder (post-MVP)
2. Document diff view (post-MVP)
3. Dashboard / overview (post-MVP)
4. Plugin system (post-MVP)

---

## 10. Acceptance Criteria — First Coding Milestone

The first milestone is **MVP-A + minimal MVP-B**. It is complete when all of the following pass:

### Workspace

- [ ] User can create a new workspace in an empty folder
- [ ] `scopeflow.yaml` is created with default settings
- [ ] `.scopeflow/` directory is created
- [ ] Opening an existing workspace reads `scopeflow.yaml`

### Clients

- [ ] User can create a new client → `_client.yaml` written
- [ ] User can edit client profile → `_client.yaml` updated
- [ ] User can list all clients (by reading `clients/` folder)
- [ ] Client folder uses kebab-case naming

### Projects

- [ ] User can create a project under a client → folder structure + `_project.yaml` created
- [ ] Project type can be: `new-project`, `maintenance`, `support-contract`
- [ ] If type is `maintenance` or `support-contract`, `current-system/` folder is created with empty templates
- [ ] All subfolders created: `baseline/`, `change-requests/`, `support-requests/`, `approvals/`, `acceptance/`, `exports/`, `attachments/`

### Documents

- [ ] User can create a Scope document → `baseline/scope-v1.0.md` with correct frontmatter
- [ ] User can create a Quotation document → `baseline/quotation-v1.0.md`
- [ ] User can create a CR → `change-requests/CR-001-{desc}.md` with auto-incremented number
- [ ] User can create a DCR → `change-requests/DCR-001-{desc}.md` with `change_kind` field
- [ ] User can create a Support Request → `support-requests/SUP-001-{desc}.md`
- [ ] User can create a MA Request → `support-requests/MA-001-{desc}.md`
- [ ] User can create an Acceptance Checklist → `acceptance/acceptance-checklist-v1.0.md`
- [ ] All documents use correct YAML frontmatter as defined in Section 6
- [ ] User can edit document content in a Markdown editor
- [ ] Auto-populated fields (project, client, dates, author) are filled correctly

### Versioning

- [ ] User can create a new version from an existing document
- [ ] New version file has incremented version number
- [ ] New version has `previous_version` field pointing to source
- [ ] Previous version remains unchanged

### Lock (Minimal MVP-B)

- [ ] User can set `locked: true` on a document
- [ ] Locked documents are read-only in the editor
- [ ] Locked documents show a visual indicator (🔒)
- [ ] User can unlock with a warning confirmation
- [ ] User can set/change `status` field on any document

### Navigation

- [ ] Sidebar shows client → project → document tree
- [ ] User can navigate to any document by clicking in the sidebar
- [ ] Thai language labels in the UI

### File Integrity

- [ ] All operations write valid YAML frontmatter
- [ ] All operations write valid Markdown
- [ ] No data is stored only in SQLite
- [ ] Deleting `.scopeflow/` does not lose any project data
- [ ] Workspace folder can be copied to another location and opened

---

## Appendix: Non-Goals (Strict)

Refer to `docs/non-goals.md` for the full list with rationale. Summary:

| # | Feature | Status |
|---|---|---|
| 1 | AI Assistant | ❌ Not in any MVP stage |
| 2 | Cloud Sync | ❌ Not in any MVP stage |
| 3 | Client Portal | ❌ Not in any MVP stage |
| 4 | Online Approval Link | ❌ Not in any MVP stage |
| 5 | Invoice / Payment System | ❌ Not in any MVP stage |
| 6 | E-Signature Integration | ❌ Not in any MVP stage |
| 7 | Task Tracker | ❌ Not in any MVP stage |
| 8 | Chat System | ❌ Not in any MVP stage |
| 9 | CRM | ❌ Not in any MVP stage |
| 10 | Legal / Tax Advice | ❌ Not in any MVP stage |
| 11 | Project Management Board | ❌ Not in any MVP stage |
