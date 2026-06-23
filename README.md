# ScopeFlow Thai

Offline-first document workspace for Thai freelancers and small agencies.

Manages project scope documents, quotations, change requests, and approval records — all as Markdown/YAML files on disk.

## Tech Stack

- **Desktop**: Tauri v2 (Rust backend)
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Data**: Markdown with YAML frontmatter (no database required)

## Prerequisites

- Node.js 18+
- Rust (via `brew install rust` on macOS)

## Development

```bash
# Install dependencies
npm install

# Run in development mode (opens desktop app)
npm run tauri dev

# Build for production
npm run tauri build
```

## Architecture

```
src/                    # React frontend
  components/           # UI components
  lib/                  # Utilities, types, Tauri command wrappers
src-tauri/              # Rust backend
  src/commands.rs       # File system commands
  src/lib.rs            # Tauri app entry point
docs/                   # Product planning documents
```

## How It Works

1. **Create a workspace** — picks a folder, creates `scopeflow.yaml` and subdirectories
2. **Create clients** — each client gets a folder + `_client.yaml`
3. **Create projects** — each project gets subfolders (baseline, change-requests, etc.) + `_project.yaml`
4. **Create documents** — scope documents are Markdown with YAML frontmatter
5. **Edit & save** — built-in Markdown editor with preview

All data lives as files. No database, no cloud, no internet required.

## Workspace Structure

```
my-workspace/
├── scopeflow.yaml              # Workspace config
├── clients/
│   └── {client-id}/
│       ├── _client.yaml
│       └── projects/
│           └── {project-id}/
│               ├── _project.yaml
│               ├── baseline/          # Scope + quotation docs
│               ├── change-requests/   # CR + DCR docs
│               ├── support-requests/  # Support + MA docs
│               ├── approvals/         # Approval records
│               ├── acceptance/        # Acceptance checklists
│               ├── exports/           # PDF/MD exports
│               └── attachments/       # Binary files
├── templates/                  # User-customizable templates
└── .scopeflow/                 # App state (safe to delete)
```

## Current Milestone: MVP-A (File Workspace Core)

- [x] Workspace create/open
- [x] Client creation
- [x] Project creation (with current-system baseline for maintenance projects)
- [x] Scope document creation from template
- [x] Markdown editor with preview
- [x] Sidebar navigation (clients → projects → documents)
- [x] Thai-first UI

## Not Built Yet

- PDF export (MVP-C)
- Search (MVP-D)
- Approval recording (MVP-B)
- CR/DCR/Support document creation
- AI, cloud sync, billing, client portal
