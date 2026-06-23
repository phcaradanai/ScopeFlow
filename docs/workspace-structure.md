# ScopeFlow Thai — Workspace Structure

## Overview

A ScopeFlow workspace is a single folder on disk. Everything lives inside this folder — client data, project files, documents, exports, and attachments. The folder is portable: copy it to another machine and it works.

The structure is inspired by Obsidian: human-readable files organized in a predictable folder hierarchy.

---

## Top-Level Structure

```
my-workspace/
├── clients/                    # Client profiles and projects
├── templates/                  # User-customizable document templates
├── .scopeflow/                 # Local index, cache, app state (git-ignorable)
└── scopeflow.yaml              # Workspace config file
```

> **Note:** `exports/` lives at the project level, not at the workspace root. See project structure below.

---

## Folder Breakdown

### `clients/`

Each client gets a folder. Inside each client folder are the client profile and project folders.

```
clients/
├── acme-corp/
│   ├── _client.yaml              # Client profile
│   └── projects/
│       ├── website-redesign-2025/
│       │   ├── _project.yaml     # Project metadata
│       │   ├── baseline/         # Original scope and quotation
│       │   ├── change-requests/  # CR and DCR documents
│       │   ├── support-requests/ # Support and MA requests
│       │   ├── approvals/        # Approval records and evidence
│       │   ├── acceptance/       # Acceptance checklists
│       │   ├── exports/          # PDF and Markdown exports for this project
│       │   └── attachments/      # Photos, screenshots, signed PDFs
│       └── mobile-app-phase-2/
│           ├── _project.yaml
│           ├── baseline/
│           ├── change-requests/
│           ├── support-requests/
│           ├── approvals/
│           ├── acceptance/
│           ├── exports/
│           └── attachments/
├── somchai-shop/
│   ├── _client.yaml
│   └── projects/
│       └── ecommerce-ma-2025/   # Existing system project
│           ├── _project.yaml
│           ├── current-system/   # Baseline of the existing system
│           ├── baseline/
│           ├── change-requests/
│           ├── support-requests/
│           ├── approvals/
│           ├── acceptance/
│           ├── exports/
│           └── attachments/
```

### `baseline/`

The original project scope and quotation. These are the "agreed starting point" documents.

```
baseline/
├── scope-v1.0.md                # Project scope document
├── scope-v1.1.md                # Revised scope (if negotiated)
├── quotation-v1.0.md            # Quotation document
└── quotation-v1.1.md            # Revised quotation
```

### `current-system/` (for existing projects)

When the project type is `maintenance` or `support-contract`, this folder documents the current state of the existing system. CR and DCR documents should reference this baseline.

```
current-system/
├── overview.md                  # Free-form overview of the existing system
├── modules.yaml                 # List of system modules/features
├── pages.yaml                   # List of pages/screens
├── roles.yaml                   # User roles and permissions
├── integrations.yaml            # External integrations (API, payment, etc.)
└── known-limitations.md         # Known bugs, tech debt, limitations
```

> This folder is **optional** for new projects. It is **recommended** for maintenance and support projects so that CR/DCR documents can clearly reference what they are changing.

### `change-requests/`

All CR and DCR (Development Change Request) documents for the project.

```
change-requests/
├── CR-001-add-payment-gateway.md
├── CR-002-redesign-homepage.md
├── DCR-001-change-db-schema.md
└── DCR-002-update-permission-model.md
```

### `support-requests/`

Support tickets and MA work requests.

```
support-requests/
├── SUP-001-fix-login-bug.md
├── SUP-002-update-ssl-cert.md
└── MA-001-monthly-backup-check.md
```

### `approvals/`

Approval records linking to the document that was approved and the evidence.

```
approvals/
├── APR-001-scope-v1.0-approved.md
├── APR-002-quotation-v1.0-approved.md
├── APR-003-CR-001-approved.md
└── APR-004-acceptance-approved.md
```

### `acceptance/`

Acceptance checklists for project handover.

```
acceptance/
└── acceptance-checklist-v1.0.md
```

### `attachments/`

Binary files: signed PDFs, screenshots, photos of whiteboard sessions, LINE chat screenshots.

```
attachments/
├── signed-scope-v1.0.pdf
├── client-approval-screenshot.png
├── whiteboard-meeting-2025-03-15.jpg
└── line-chat-cr001-approval.png
```

### `exports/` (project-level)

Generated PDF and Markdown exports. Lives inside each project folder.

```
exports/
├── website-redesign-2025-scope-v1.0.pdf
├── website-redesign-2025-quotation-v1.0.pdf
├── website-redesign-2025-approval-pack-2025-03-20.pdf
└── CR-001-add-payment-gateway.pdf
```

### `templates/`

User-customizable document templates. The app ships with defaults; users can override them here.

```
templates/
├── scope.md
├── quotation.md
├── change-request.md
├── development-change-request.md
├── support-request.md
├── approval-record.md
└── acceptance-checklist.md
```

### `.scopeflow/`

Internal app data. This folder is git-ignorable and can be regenerated from the source files.

```
.scopeflow/
├── index.db                     # SQLite database (search index, cache)
├── state.json                   # App UI state (last opened project, sidebar state)
└── thumbnails/                  # Cached thumbnails for attachments
```

### `scopeflow.yaml`

Workspace-level configuration.

```yaml
workspace:
  name: "My Freelance Workspace"
  created: 2025-03-01
  version: "1.0"

settings:
  language: "th"
  currency: "THB"
  date_format: "YYYY-MM-DD"
  default_vat_percent: 7
  company_name: "บริษัท ตัวอย่าง จำกัด"
  company_address: "123 ถ.สุขุมวิท กรุงเทพฯ 10110"
  company_tax_id: "0105500000000"
  company_phone: "02-000-0000"
  company_email: "contact@example.co.th"
```

---

## Naming Conventions

### Client Folder Names

| Rule | Example |
|---|---|
| Lowercase | `acme-corp` |
| Kebab-case | `somchai-shop` |
| Use company short name | `abc-solutions` |
| No spaces or special chars | ~~`Acme Corp (Thailand)`~~ → `acme-corp-thailand` |

### Project Folder Names

| Rule | Example |
|---|---|
| Lowercase kebab-case | `website-redesign-2025` |
| Include year if relevant | `mobile-app-phase-2` |
| Descriptive but short | `ecommerce-ma-2025` |

### Document File Names

| Document Type | Pattern | Example |
|---|---|---|
| Scope | `scope-v{version}.md` | `scope-v1.0.md` |
| Quotation | `quotation-v{version}.md` | `quotation-v1.1.md` |
| Change Request | `CR-{number}-{short-desc}.md` | `CR-001-add-payment-gateway.md` |
| Development Change Request | `DCR-{number}-{short-desc}.md` | `DCR-001-change-db-schema.md` |
| Support Request | `SUP-{number}-{short-desc}.md` | `SUP-001-fix-login-bug.md` |
| MA Request | `MA-{number}-{short-desc}.md` | `MA-001-monthly-backup-check.md` |
| Approval Record | `APR-{number}-{ref}-approved.md` | `APR-001-scope-v1.0-approved.md` |
| Acceptance Checklist | `acceptance-checklist-v{version}.md` | `acceptance-checklist-v1.0.md` |

### Version Numbering

- **Major version** (v1.0 → v2.0): Significant scope change, new approval needed
- **Minor version** (v1.0 → v1.1): Small revision before approval
- Versions are manually bumped by the user
- Approved versions are locked (read-only)

---

## File Format

All document files use **Markdown with YAML frontmatter**:

```markdown
---
type: scope
version: "1.0"
project: website-redesign-2025
client: acme-corp
status: draft
created: 2025-03-01
updated: 2025-03-05
author: "สมชาย Developer"
---

# ขอบเขตงาน: Website Redesign 2025

## รายละเอียดโครงการ
...
```

### Client Profile Format (`_client.yaml`)

```yaml
client:
  id: acme-corp
  name: "บริษัท Acme จำกัด"
  contact_person: "คุณสมหญิง"
  email: "somying@acme.co.th"
  phone: "081-000-0000"
  line_id: "somying_acme"
  address: "456 ถ.พหลโยธิน กรุงเทพฯ 10400"
  tax_id: "0105500000001"
  notes: "ติดต่อผ่าน LINE เป็นหลัก"
  created: 2025-03-01
```

### Project Metadata Format (`_project.yaml`)

```yaml
project:
  id: website-redesign-2025
  name: "Website Redesign 2025"
  client: acme-corp
  type: new-project           # new-project | maintenance | support-contract
  status: active              # draft | active | completed | archived
  start_date: 2025-03-01
  target_date: 2025-06-30
  notes: "ออกแบบใหม่ทั้งหมด รวม responsive"
  created: 2025-03-01
  updated: 2025-03-05
```

---

## Source of Truth Rule

> **Markdown and YAML files are the only source of truth.** SQLite (`.scopeflow/index.db`) is a derived cache that can always be deleted and rebuilt from files. The app must never require SQLite to reconstruct project documents.

---

## Portability

The entire workspace folder is portable:

- **Copy** the folder to another machine → works immediately
- **Git** the folder → version control for free
- **Backup** to USB / external drive → full backup
- **Delete** `.scopeflow/` → regenerated on next app open (index rebuilt from files)

The `.scopeflow/` folder is the only part that depends on the app. Everything else is plain text files that any editor can open.
