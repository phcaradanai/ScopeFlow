# ScopeFlow Thai — Non-Goals (MVP)

## Overview

This document explicitly lists what **must not** be built in the MVP. These are either out of scope for the product vision, or deferred to future versions. Listing them here prevents scope creep during development — the same problem ScopeFlow is designed to solve for its users.

---

## Non-Goals

### 1. AI Assistant
**Not in MVP.** No AI-powered writing, summarization, or suggestion features.

- No AI scope drafting
- No AI quotation generation
- No AI-powered search or recommendations
- No LLM integration of any kind

**Rationale:** The app must be fully useful without AI. AI may be added later as an *optional* writing assistant, but the core product must prove its value with structured templates and workflows alone.

---

### 2. Cloud Sync
**Not in MVP.** No syncing to any cloud service.

- No Google Drive sync
- No Dropbox sync
- No iCloud sync
- No proprietary cloud backend
- No real-time collaboration

**Rationale:** The product is offline-first and file-first. Users back up their workspace folder however they choose (USB, Git, manual copy). Cloud sync adds complexity, accounts, and internet dependency.

---

### 3. Client Portal
**Not in MVP.** No web portal where clients can log in to view documents.

- No hosted client view
- No shared links
- No client dashboard
- No client-facing UI

**Rationale:** Clients receive documents via PDF/Markdown sent through LINE, email, or print. They do not need to visit a website or create an account. This is how Thai freelancers already work.

---

### 4. Online Approval Link
**Not in MVP.** No web-based approval workflow.

- No "click to approve" links
- No digital approval forms
- No approval via web browser

**Rationale:** Approval is manual — signed PDFs, LINE screenshots, email confirmations, or in-person. This matches real Thai business practice. Most Thai SME clients will not adopt a new digital approval tool.

---

### 5. Billing & Invoicing
**Not in MVP.** No invoicing, payment tracking, or accounting features.

- No invoice generation
- No payment status tracking
- No receipt management
- No accounting integration
- No tax calculation beyond basic VAT on quotations

**What ScopeFlow DOES store (within documents, not as a billing system):**
- Quotation amounts and line items (in quotation documents)
- Estimated hours and estimated cost (in CR, DCR, support request documents)
- Actual hours (in support request documents)
- `is_billable: true/false` (in support request documents)

These are document fields for scope tracking, not a billing system. ScopeFlow never generates invoices, tracks payments, or provides accounting.

**Rationale:** ScopeFlow is a scope and approval tool, not an accounting tool. Users already have invoicing solutions (manual, Excel, or dedicated software). Mixing billing into scope management adds complexity without solving the core pain point.

---

### 6. E-Signature Integration
**Not in MVP.** No integration with digital signature services.

- No DocuSign integration
- No SignNow
- No Thai ETDA e-signature
- No built-in digital signature

**Rationale:** Thai freelancers and SME clients rarely use e-signature services. Manual signature (print + sign + photo) is the norm. E-signature may be considered post-MVP if demand exists.

---

### 7. Project Management Board
**Not in MVP.** No Kanban boards, Gantt charts, or project management views.

- No task boards
- No sprint planning
- No Gantt charts
- No project timeline visualization
- No resource allocation

**Rationale:** ScopeFlow manages *documents*, not *tasks*. Users who need project management already use Trello, Notion, Jira, or similar tools. Adding PM features would dilute the product focus.

---

### 8. Task Tracker
**Not in MVP.** No to-do lists or task assignment features.

- No task creation
- No task assignment
- No task status tracking
- No time tracking (except within support request documents)
- No team workload view

**Rationale:** Same as project management — ScopeFlow is not a task tracker. The acceptance checklist serves as the closest thing to a task list, and it's a *document*, not a task system.

---

### 9. Chat System
**Not in MVP.** No built-in messaging or communication features.

- No in-app chat
- No comments on documents
- No @mentions
- No notifications
- No LINE bot integration

**Rationale:** Thai freelancers communicate via LINE. Building a chat system would be redundant and unused. If needed, document-level notes can be added in frontmatter or as comments in Markdown.

---

### 10. CRM (Customer Relationship Management)
**Not in MVP.** No CRM features beyond basic client profiles.

- No sales pipeline
- No lead tracking
- No follow-up reminders
- No deal stages
- No revenue forecasting
- No client activity history

**Rationale:** The client registry in ScopeFlow stores contact info and links to projects. It is not a CRM. Users who need CRM functionality should use dedicated CRM tools.

---

### 11. Auto Legal / Tax Advice
**Not in MVP.** No automated legal or tax guidance.

- No contract clause suggestions
- No legal template validation
- No tax optimization advice
- No compliance checking
- No legal document generation

**Rationale:** Legal and tax matters require professional advice. ScopeFlow provides *structure* for documents, not legal content. Users are responsible for the content of their documents.

---

## Summary Table

| # | Feature | Status | May Revisit Post-MVP? |
|---|---------|--------|-----------------------|
| 1 | AI Assistant | ❌ Not in MVP | Yes — as optional add-on |
| 2 | Cloud Sync | ❌ Not in MVP | Maybe — optional backup |
| 3 | Client Portal | ❌ Not in MVP | Unlikely |
| 4 | Online Approval Link | ❌ Not in MVP | Maybe |
| 5 | Billing & Invoicing | ❌ Not in MVP | Unlikely |
| 6 | E-Signature Integration | ❌ Not in MVP | Maybe |
| 7 | Project Management Board | ❌ Not in MVP | No |
| 8 | Task Tracker | ❌ Not in MVP | No |
| 9 | Chat System | ❌ Not in MVP | No |
| 10 | CRM | ❌ Not in MVP | No |
| 11 | Auto Legal / Tax Advice | ❌ Not in MVP | No |

---

## The Guiding Principle

> **If it doesn't help a Thai freelancer document scope, track changes, or prove approval — it doesn't belong in the MVP.**

Every feature proposal should be tested against this statement. If the answer is "it's nice to have but doesn't solve the core pain," it goes on this list.
