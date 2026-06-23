// TypeScript type definitions for ScopeFlow Thai

/** Workspace configuration (from scopeflow.yaml) */
export interface WorkspaceConfig {
  workspace: {
    name: string;
    created: string;
    version: string;
  };
  settings: {
    language: string;
    currency: string;
    date_format: string;
    default_vat_percent: number;
    company_name: string;
    company_address: string;
    company_tax_id: string;
    company_phone: string;
    company_email: string;
    author_name: string;
  };
}

/** Client profile (from _client.yaml) */
export interface ClientData {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  line_id: string;
  address: string;
  tax_id: string;
  notes: string;
  created: string;
  updated: string;
}

/** Project metadata (from _project.yaml) */
export interface ProjectData {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  status: ProjectStatus;
  has_current_system: boolean;
  start_date: string;
  target_date: string;
  notes: string;
  created: string;
  updated: string;
}

export type ProjectType = 'new-project' | 'maintenance' | 'support-contract';
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

/** Document frontmatter (from .md files) */
export interface DocumentFrontmatter {
  type: string;
  version?: string;
  project: string;
  client: string;
  status: string;
  created: string;
  updated: string;
  author: string;
  locked: boolean;
  locked_date?: string;
  previous_version?: string;
  approved_by?: string;
  approved_date?: string;
}

/** Full document = frontmatter + body */
export interface Document {
  path: string;
  frontmatter: DocumentFrontmatter;
  body: string;
}

/** Sidebar tree node */
export interface TreeNode {
  name: string;
  path: string;
  type: 'workspace' | 'client' | 'project' | 'folder' | 'file';
  children?: TreeNode[];
}

/** Client creation form data */
export interface ClientFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  line_id: string;
  address: string;
  tax_id: string;
  notes: string;
}

/** Project creation form data */
export interface ProjectFormData {
  name: string;
  type: ProjectType;
  start_date: string;
  target_date: string;
  notes: string;
}

/** App-level state */
export interface AppState {
  workspacePath: string | null;
  workspaceConfig: WorkspaceConfig | null;
  selectedClient: string | null;
  selectedProject: string | null;
  openDocument: Document | null;
  sidebarTree: TreeNode | null;
}
