import { useState } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import type { FileEntry } from '../lib/tauri-commands';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  User,
  Briefcase,
  Plus,
  Settings,
  ShieldCheck,
  Download
} from 'lucide-react';

interface SidebarProps {
  onCreateClient: () => void;
  onCreateProject: (clientId: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string) => void;
  onExportProject: (clientId: string, projectId: string, projectPath: string) => void;
  onOpenSettings: () => void;
  onRunHealthCheck: () => void;
  onBackupWorkspace: () => void;
}

export default function Sidebar({ onCreateClient, onCreateProject, onCreateDocument, onExportProject, onOpenSettings, onRunHealthCheck, onBackupWorkspace }: SidebarProps) {
  const { workspaceName, tree, selectedFile, setSelectedFile } = useWorkspace();

  return (
    <aside className="w-72 min-w-[360px] h-full bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col !p-4">
      {/* Workspace header */}
      <div className="px-4 py-4 flex items-center justify-between gap-4" style={{ minHeight: '52px' }}>
        <button
          onClick={() => setSelectedFile('__workspace_overview__')}
          className={`flex items-center gap-3 overflow-hidden text-left transition-all duration-200 flex-1 !px-2.5 !py-2.5 rounded-xl border border-transparent ${(selectedFile === '__workspace_overview__' || !selectedFile)
            ? 'bg-primary/10 text-primary-light font-bold border-primary/20 shadow-sm'
            : 'hover:bg-white/5 text-text hover:text-white'
            }`}
          title="ดูภาพรวม Workspace"
        >
          <FolderOpen className="w-5 h-5 text-primary-light shrink-0" />
          <h2 className="text-sm truncate flex-1">{workspaceName}</h2>
        </button>
        <div className="flex justify-center shrink-0 gap-2 p-2">
          <button
            onClick={onRunHealthCheck}
            className="sidebar-action-btn p-2"
            title="ตรวจสอบ Workspace"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button
            onClick={onBackupWorkspace}
            className="sidebar-action-btn p-2"
            title="สำรอง Workspace (.zip)"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="sidebar-action-btn p-2"
            title="ตั้งค่าบริษัท"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tree navigation */}
      <div className="flex-1 overflow-y-auto y-2! pl-4! space-y-4">
        {tree && tree.children && tree.children.length > 0 ? (
          <div className="flex flex-col space-y-3">
            {/* Clients header */}
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
                ลูกค้า
              </span>
              <button
                onClick={onCreateClient}
                className="sidebar-action-btn"
                title="สร้างลูกค้าใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tree.children.map((client) => (
              <ClientNode
                key={client.path}
                node={client}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
                onCreateProject={onCreateProject}
                onCreateDocument={onCreateDocument}
                onExportProject={onExportProject}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-8 h-8 text-text-dim mx-auto mb-2" />
            <p className="text-sm text-text-dim">ยังไม่มีลูกค้า</p>
            <button
              onClick={onCreateClient}
              className="mt-2 text-xs text-primary-light hover:text-primary transition-colors"
            >
              + สร้างลูกค้าใหม่
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function ClientNode({
  node,
  selectedFile,
  onSelect,
  onCreateProject,
  onCreateDocument,
  onExportProject,
}: {
  node: FileEntry;
  selectedFile: string | null;
  onSelect: (path: string | null) => void;
  onCreateProject: (clientId: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string) => void;
  onExportProject: (clientId: string, projectId: string, projectPath: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const normalizedPath = node.path.replace(/\\/g, '/');
  const clientId = normalizedPath.split('/').pop() || '';

  const projectsFolder = node.children?.find(
    c => c.name === 'projects' || c.path.replace(/\\/g, '/').endsWith('/projects')
  );
  const hasNoProjects = !projectsFolder || !projectsFolder.children || projectsFolder.children.length === 0;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setExpanded(!expanded);
          if (hasNoProjects) {
            onSelect(`__client__:${clientId}`);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
            if (hasNoProjects) {
              onSelect(`__client__:${clientId}`);
            }
          }
        }}
        className={`sidebar-row w-full group text-left ${selectedFile === `__client__:${clientId}` ? 'sidebar-row-selected' : ''
          }`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-dim" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-dim" />
        )}
        <User className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-text truncate flex-1">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateProject(clientId);
          }}
          className="sidebar-action-btn opacity-0 group-hover:opacity-100"
          title="สร้างโครงการใหม่"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {expanded && node.children && (
        <div className="ml-3 pl-3 border-l border-white/5 mt-1 mb-2 space-y-1">
          {node.children.length === 0 ? (
            <p className="text-xs text-text-dim px-3! py-2!">ยังไม่มีโครงการ</p>
          ) : (
            node.children.map((project) => (
              <ProjectNode
                key={project.path}
                node={project}
                clientId={clientId}
                selectedFile={selectedFile}
                onSelect={onSelect}
                onCreateDocument={onCreateDocument}
                onExportProject={onExportProject}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProjectNode({
  node,
  clientId,
  selectedFile,
  onSelect,
  onCreateDocument,
  onExportProject,
}: {
  node: FileEntry;
  clientId: string;
  selectedFile: string | null;
  onSelect: (path: string | null) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string) => void;
  onExportProject: (clientId: string, projectId: string, projectPath: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const projectId = node.path.split('/').pop() || '';

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setExpanded(!expanded);
          onSelect(node.path);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
            onSelect(node.path);
          }
        }}
        className={`sidebar-row w-full group text-left ${selectedFile === node.path
          ? 'sidebar-row-selected'
          : 'hover:bg-white/5 text-text-muted'
          }`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-dim" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-dim" />
        )}
        <Briefcase className="w-4 h-4 text-primary-light" />
        <span className="text-sm font-medium text-text truncate flex-1">{node.name}</span>
        <div className="sidebar-row-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportProject(clientId, projectId, node.path);
            }}
            className="sidebar-action-btn"
            title="ส่งออกชุดเอกสาร"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument(clientId, projectId, node.path);
            }}
            className="sidebar-action-btn"
            title="สร้างเอกสารใหม่"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && node.children && (
        <div className="ml-3 pl-3 border-l border-white/5 mt-1 mb-2 space-y-1">
          {node.children.length === 0 ? (
            <p className="text-xs text-text-dim px-3 py-2">ยังไม่มีเอกสาร</p>
          ) : (
            node.children.map((doc) => (
              <button
                key={doc.path}
                onClick={() => onSelect(doc.path)}
                className={`sidebar-row w-full text-left ${selectedFile === doc.path
                  ? 'sidebar-row-selected'
                  : 'text-text-muted'
                  }`}
              >
                <FileText className="sidebar-row-icon" />
                <span className="sidebar-row-label">{doc.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
