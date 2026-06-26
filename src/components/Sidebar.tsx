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

function getProjectNodes(client: FileEntry): FileEntry[] {
  const projectsFolder = client.children?.find(
    c => c.is_dir && (c.name === 'projects' || c.path.replace(/\\/g, '/').endsWith('/projects'))
  );
  if (projectsFolder?.children) return projectsFolder.children.filter(p => p.is_dir);

  return (client.children || []).filter(child => child.is_dir && child.name !== 'projects');
}

export default function Sidebar({ onCreateClient, onCreateProject, onCreateDocument, onExportProject, onOpenSettings, onRunHealthCheck, onBackupWorkspace }: SidebarProps) {
  const { workspaceName, tree, selectedFile, setSelectedFile } = useWorkspace();

  return (
    <aside className="w-72 min-w-[288px] h-full bg-surface-2/80 backdrop-blur-xl flex flex-col justify-between p-3 z-20 shadow-2xl shadow-black/20">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-1 py-3 flex items-center justify-between gap-3 mb-2">
          <button
            onClick={() => setSelectedFile('__workspace_overview__')}
            className={`flex items-center gap-3 overflow-hidden text-left transition-all duration-200 flex-1 px-3 py-2.5 rounded-xl border ${
              (selectedFile === '__workspace_overview__' || !selectedFile)
                ? 'bg-primary/10 text-primary-light font-bold border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                : 'border-transparent hover:bg-surface-3 hover:border-border text-text hover:text-white'
            }`}
            title="ดูภาพรวม Workspace"
          >
            <FolderOpen className="w-5 h-5 text-primary-light shrink-0" />
            <h2 className="text-sm font-bold truncate flex-1">{workspaceName}</h2>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pl-1 pr-1 space-y-3 pb-4">
          {tree && tree.children && tree.children.length > 0 ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between px-2 pb-1 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                  ลูกค้า (Clients)
                </span>
                <button onClick={onCreateClient} className="sidebar-action-btn w-6 h-6" title="สร้างลูกค้าใหม่">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
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
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-8 h-8 text-text-dim/50 mx-auto mb-3" />
              <p className="text-xs text-text-dim">ยังไม่มีลูกค้า</p>
              <button onClick={onCreateClient} className="mt-2 text-xs font-semibold text-primary-light hover:text-primary transition-colors">
                + สร้างลูกค้าใหม่
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-white/5 space-y-1 bg-surface-2/90 sticky bottom-0 z-10">
        <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider px-2 mb-2">เครื่องมือ</h3>
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors text-xs font-medium group">
          <Settings className="w-4 h-4 text-text-dim group-hover:rotate-90 group-hover:text-white transition-all duration-300" />
          <span>ตั้งค่าบริษัท</span>
        </button>
        <button onClick={onRunHealthCheck} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-warning/10 text-text-muted hover:text-warning transition-colors text-xs font-medium group">
          <ShieldCheck className="w-4 h-4 text-text-dim group-hover:text-warning transition-colors" />
          <span>ตรวจสอบ Workspace</span>
        </button>
        <button onClick={onBackupWorkspace} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-success/10 text-text-muted hover:text-success transition-colors text-xs font-medium group">
          <Download className="w-4 h-4 text-text-dim group-hover:text-success transition-colors" />
          <span>สำรอง Workspace</span>
        </button>
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
  const projectNodes = getProjectNodes(node);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setExpanded(!expanded);
          onSelect(`__client__:${clientId}`);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
            onSelect(`__client__:${clientId}`);
          }
        }}
        className={`flex items-center gap-2.5 w-full group text-left px-2 py-2 rounded-lg transition-all duration-200 cursor-pointer border border-transparent ${
          selectedFile === `__client__:${clientId}`
            ? 'bg-accent/15 border-accent/20 text-accent-light'
            : 'hover:bg-white/5 hover:border-white/10 text-text hover:text-accent-light'
        }`}
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />}
        <User className={`w-4 h-4 shrink-0 ${selectedFile === `__client__:${clientId}` ? 'text-accent' : 'text-accent/60 group-hover:text-accent'}`} />
        <span className="text-xs font-bold truncate flex-1">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateProject(clientId);
          }}
          className="w-5 h-5 rounded-md flex items-center justify-center text-text-dim hover:bg-accent hover:text-white transition-all opacity-30 group-hover:opacity-100 focus:opacity-100"
          title="สร้างโครงการใหม่"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {expanded && (
        <div className="ml-3.5 pl-2.5 border-l-2 border-white/5 my-1 space-y-1">
          {projectNodes.length === 0 ? (
            <p className="text-[10px] text-text-dim px-2 py-1">ยังไม่มีโครงการ</p>
          ) : (
            projectNodes.map((project) => (
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
        className={`flex items-center gap-2 w-full group text-left px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
          selectedFile === node.path ? 'bg-primary/20 text-white shadow-sm ring-1 ring-primary/30' : 'hover:bg-white/5 text-text-muted hover:text-text'
        }`}
      >
        {expanded ? <ChevronDown className="w-3 h-3 opacity-50 shrink-0" /> : <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
        <Briefcase className={`w-3.5 h-3.5 shrink-0 ${selectedFile === node.path ? 'text-primary-light' : 'text-primary-light/60 group-hover:text-primary-light'}`} />
        <span className="text-[11px] font-semibold truncate flex-1 leading-tight">{node.name}</span>
        <div className="flex items-center gap-0.5 opacity-30 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportProject(clientId, projectId, node.path);
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-text-dim hover:bg-white/10 hover:text-white transition-colors"
            title="ส่งออกชุดเอกสาร"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument(clientId, projectId, node.path);
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-text-dim hover:bg-primary/20 hover:text-primary-light transition-colors"
            title="สร้างเอกสารใหม่"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && node.children && (
        <div className="ml-4 pl-3 border-l-2 border-white/5 my-1 space-y-0.5 relative">
          {node.children.length === 0 ? (
            <p className="text-[10px] text-text-dim px-2 py-1">ยังไม่มีเอกสาร</p>
          ) : (
            node.children
              .filter(doc => !doc.is_dir)
              .map((doc) => (
                <button
                  key={doc.path}
                  onClick={() => onSelect(doc.path)}
                  className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-md transition-colors ${
                    selectedFile === doc.path ? 'bg-white/10 text-white font-medium' : 'text-text-dim hover:bg-white/5 hover:text-text'
                  }`}
                >
                  <FileText className={`w-3 h-3 shrink-0 ${selectedFile === doc.path ? 'text-primary-light' : 'opacity-50'}`} />
                  <span className="text-[10px] truncate leading-tight">{doc.name}</span>
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
}
