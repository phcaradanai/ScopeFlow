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
  onCreateDocument: (clientId: string, projectId: string, projectPath: string) => void;
  onExportProject: (clientId: string, projectId: string, projectPath: string) => void;
  onOpenSettings: () => void;
  onRunHealthCheck: () => void;
  onBackupWorkspace: () => void;
}

export default function Sidebar({ onCreateClient, onCreateProject, onCreateDocument, onExportProject, onOpenSettings, onRunHealthCheck, onBackupWorkspace }: SidebarProps) {
  const { workspaceName, tree, selectedFile, setSelectedFile } = useWorkspace();

  return (
    <aside className="w-72 min-w-[280px] h-full bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
      {/* Workspace header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <FolderOpen className="w-4 h-4 text-primary-light shrink-0" />
          <h2 className="text-sm font-semibold text-text truncate">{workspaceName}</h2>
        </div>
        <div className="flex shrink-0">
          <button
            onClick={onRunHealthCheck}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-warning transition-all duration-200"
            title="ตรวจสอบ Workspace"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button
            onClick={onBackupWorkspace}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-success transition-all duration-200"
            title="สำรอง Workspace (.zip)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-primary-light transition-all duration-200"
            title="ตั้งค่าบริษัท"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tree navigation */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tree && tree.children && tree.children.length > 0 ? (
          <div className="space-y-2.5">
            {/* Clients header */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                ลูกค้า
              </span>
              <button
                onClick={onCreateClient}
                className="p-1 rounded-lg hover:bg-white/5 text-text-dim hover:text-primary-light transition-all duration-200"
                title="สร้างลูกค้าใหม่"
              >
                <Plus className="w-3.5 h-3.5" />
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
  const clientId = node.path.split('/').pop() || '';

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-all duration-300 group text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
        )}
        <User className="w-3.5 h-3.5 text-accent" />
        <span className="text-sm text-text truncate flex-1">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateProject(clientId);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-text-dim hover:text-primary-light transition-all duration-200"
          title="สร้างโครงการใหม่"
        >
          <Plus className="w-3 h-3" />
        </button>
      </button>

      {expanded && node.children && (
        <div className="ml-3 pl-3 border-l border-white/5 mt-1 space-y-1.5">
          {node.children.length === 0 ? (
            <p className="text-xs text-text-dim px-2 py-1">ยังไม่มีโครงการ</p>
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
  onCreateDocument: (clientId: string, projectId: string, projectPath: string) => void;
  onExportProject: (clientId: string, projectId: string, projectPath: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const projectId = node.path.split('/').pop() || '';

  return (
    <div>
      <button
        onClick={() => {
          setExpanded(!expanded);
          onSelect(node.path);
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 group text-left ${selectedFile === node.path ? 'bg-primary/10 text-primary-light font-medium shadow-sm' : 'hover:bg-white/5 text-text-muted'}`}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
        )}
        <Briefcase className="w-3.5 h-3.5 text-primary-light" />
        <span className="text-sm text-text truncate flex-1">{node.name}</span>
        <div className="flex opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportProject(clientId, projectId, node.path);
            }}
            className="p-1 rounded-md hover:bg-white/10 text-text-dim hover:text-primary-light transition-all duration-200"
            title="ส่งออกชุดเอกสาร"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument(clientId, projectId, node.path);
            }}
            className="p-1 rounded-md hover:bg-white/10 text-text-dim hover:text-primary-light transition-all duration-200"
            title="สร้างเอกสารใหม่"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </button>

      {expanded && node.children && (
        <div className="ml-3 pl-3 border-l border-white/5 mt-1 space-y-1.5">
          {node.children.length === 0 ? (
            <p className="text-xs text-text-dim px-2 py-1">ยังไม่มีเอกสาร</p>
          ) : (
            node.children.map((doc) => (
              <button
                key={doc.path}
                onClick={() => onSelect(doc.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 text-left ${
                  selectedFile === doc.path
                    ? 'bg-primary/10 text-primary-light font-medium shadow-sm'
                    : 'hover:bg-white/5 text-text-muted'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs truncate">{doc.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
