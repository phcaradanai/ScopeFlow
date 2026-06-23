# ScopeFlow Thai — Product Scope

## Product Summary

ScopeFlow Thai is a local-first, offline desktop application that helps Thai freelancers and small agencies create, manage, and track project scope documents, quotations, change requests, and approval records.

The app works like Obsidian — all data lives as Markdown and YAML files in a local workspace folder. There is no cloud dependency, no login, and no internet requirement. Users own their files completely.

ScopeFlow Thai solves a specific problem: Thai freelance developers and small agencies lose money and trust because project scope, changes, and approvals are not properly documented. Clients say "I thought this was included," developers do extra work for free, and there is no evidence of what was agreed.

---

## Target Users

| User Type | Description |
|---|---|
| Thai freelance web developers | Solo devs building websites for clients |
| Thai app developers | Solo or small-team mobile/web app developers |
| Small software houses | Teams of 2–10 developers taking client projects |
| Small agencies | Design + dev agencies handling multiple clients |
| Maintenance developers | Developers maintaining existing systems (CR, DCR, MA, support) |

### Common Characteristics

- Work with Thai clients who communicate via LINE and email
- Handle 1–20 active clients at any time
- Mix new projects with ongoing maintenance work
- Need Thai-language document output
- Often work from laptops without stable internet
- Do not use enterprise project management tools

---

## Pain Points

### 1. Unclear Requirements
Clients cannot explain what they want. Requirements arrive as LINE messages, voice notes, and scattered emails. There is no structured intake process.

### 2. Scope Creep Without Evidence
Clients request changes verbally or via LINE. Without a formal change document, developers cannot prove what was in-scope vs. out-of-scope.

### 3. Inconsistent Quotations
Each quotation looks different. Pricing, terms, and scope items are not standardized. This looks unprofessional and causes misunderstandings.

### 4. Mixed Work Types
New project work, CR (Change Request), DCR (Development Change Request), support tickets, and MA (Maintenance Agreement) work are all mixed together. There is no clear separation.

### 5. "I Thought This Was Included"
The most expensive sentence in freelancing. Without a signed scope document and a formal change process, clients assume everything is included in the original price.

### 6. Free Extra Work
Developers do extra work because they cannot point to a document that says "this is out of scope" or "this change costs extra."

### 7. No Approval Evidence
When disputes arise, there is no proof that the client approved the scope, the quotation, or the change. Screenshots of LINE chats are unreliable.

### 8. Unclear Handover
Acceptance criteria are not documented. Clients delay payment because "it's not finished" without a clear checklist of what "finished" means.

---

## Product Principles

1. **Offline-first** — The app must work 100% without internet. No cloud dependency.
2. **File-first** — All project data is stored as Markdown/YAML files in a local folder, like Obsidian.
3. **Documents are the source of truth** — The .md and .yaml files ARE the data. If the app disappears, the files are still readable. SQLite can always be deleted and rebuilt from files.
4. **SQLite for index only** — SQLite is used for search, cache, and app state. It is never the source of truth. The app must never require SQLite to reconstruct project documents.
5. **No login required** — Users and their clients never need to create accounts or visit a web link.
6. **Export-first delivery** — Documents are exported as PDF or Markdown and sent via LINE, email, or print.
7. **Manual approval** — Approval is recorded by attaching signed PDFs, screenshots, photos, or typed notes.
8. **Support existing work** — The app handles not just new projects but also CR, DCR, support requests, and MA work for existing clients. Existing projects can document their current system baseline.
9. **No AI in MVP** — AI may be added later as an optional writing assistant. The app must be fully useful without it.
10. **No overbuild** — Ship only what solves real pain. Avoid feature bloat.

---

## Core Modules

### 1. Workspace Manager
- Create and open workspace folders
- Manage the folder structure
- Index files into SQLite for search and navigation

### 2. Client Registry
- Create and manage client profiles (YAML files)
- Store client name, company, contact info, notes
- Link clients to their projects

### 3. Project Manager
- Create projects under clients
- Define project type: New Project, Maintenance, Support Contract
- Track project status: Draft, Active, Completed, Archived

### 4. Document Editor
- Create documents from templates
- Edit Markdown content with YAML frontmatter
- Support document types: Scope, Quotation, CR, DCR (Development Change Request), Support Request, Approval Record, Acceptance Checklist

### 5. Template Engine
- Provide built-in document templates
- Allow users to customize templates
- Auto-populate fields from client/project data

### 6. Version & Approval Tracker
- Track document versions (v1.0, v1.1, v2.0)
- Lock approved versions (read-only)
- Record approval with attachments and notes

### 7. Export Engine
- Export documents as PDF
- Export documents as Markdown
- Export approval packs (scope + quotation + approval evidence bundled)

### 8. Search & Navigation
- Full-text search across all documents
- Filter by client, project, document type, status
- Quick navigation sidebar

---

## MVP Scope (Staged)

The MVP is split into 4 implementation stages. Each stage is independently shippable.

### MVP-A: File Workspace Core

The foundation. Everything is files. The first coding milestone.

- [ ] Workspace folder creation and initialization (`scopeflow.yaml`)
- [ ] Client YAML profiles (create, edit, list)
- [ ] Project creation under clients (folder structure + `_project.yaml`)
- [ ] Current System Baseline for existing projects (`current-system/`)
- [ ] Document creation from templates (all 6 document types):
  - [ ] New Project Scope + Quotation
  - [ ] Change Request (CR)
  - [ ] Development Change Request (DCR)
  - [ ] Support / MA Request
  - [ ] Approval Record
  - [ ] Acceptance Checklist
- [ ] Markdown editor with YAML frontmatter
- [ ] Document versioning (manual version bump)
- [ ] Create revision from existing document
- [ ] Sidebar navigation (clients → projects → documents)
- [ ] Thai language UI

### MVP-B: Approval + Lock

Minimal approval recording to make documents trustworthy. **Partially required for the first coding milestone** (at minimum: lock/unlock and status transitions).

- [ ] Manual approval recording (text notes + file attachments)
- [ ] Lock approved documents (read-only with `locked: true`)
- [ ] Unlock with warning
- [ ] Document status transitions (draft → review → sent → approved → locked)
- [ ] Approval record creation with evidence attachments

### MVP-C: PDF Export

Make documents sendable to clients.

- [ ] PDF export (single document)
- [ ] Markdown export
- [ ] Approval pack export (bundled PDF with cover page)
- [ ] Export saved to project-level `exports/` folder

### MVP-D: SQLite Search

Make the workspace navigable at scale.

- [ ] SQLite index built from workspace files
- [ ] Full-text search across all documents
- [ ] Filter by client, project, document type, status
- [ ] Index rebuild from files (delete `.scopeflow/index.db` → auto-rebuild)

### First Coding Milestone

**MVP-A + minimal MVP-B (lock/unlock + status field).** The goal: a user can create a workspace, add clients, add projects, create all document types, version documents, and lock approved versions — all as files on disk.

### MVP Deliverable (Full)

A desktop app (Electron or Tauri) that a Thai freelancer can install, create a workspace folder, and immediately start creating scope documents and quotations for clients — all without internet.

---

## Future Scope (Post-MVP)

These features are **not** in MVP but may be considered later:

| Feature | Priority | Notes |
|---|---|---|
| AI writing assistant | Medium | Optional. Helps draft scope items and descriptions. |
| Custom template builder | Medium | GUI for creating custom document templates |
| Multi-workspace support | Low | Open multiple workspace folders |
| Document diff view | Medium | Compare versions side-by-side |
| Dashboard / overview | Medium | Summary of active projects, pending approvals |
| Bulk export | Low | Export all documents for a client at once |
| English language UI | Low | Localization support |
| Plugin system | Low | Extend functionality |
| Cloud backup (optional) | Low | Optional backup to Google Drive / OneDrive |
| LINE notification integration | Low | Optional. Send document links via LINE |
