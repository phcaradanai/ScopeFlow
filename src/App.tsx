import { useState, useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from './lib/workspace-context';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import ClientForm from './components/ClientForm';
import ProjectForm from './components/ProjectForm';
import MarkdownEditor from './components/MarkdownEditor';
import DocumentCreatorModal from './components/DocumentCreatorModal';
import ExportModal from './components/ExportModal';
import CompanySettingsModal from './components/CompanySettingsModal';
import HealthCheckModal from './components/HealthCheckModal';
import ProjectOverview from './components/ProjectOverview';
import WorkspaceOverview from './components/WorkspaceOverview';
import { listProjectDocuments, DocumentInfo, backupWorkspace } from './lib/tauri-commands';
import { FolderOpen, Briefcase } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import './index.css';

function AppContent() {
  const { workspaceName, workspacePath, selectedFile, refreshTree, setSelectedFile, tree } = useWorkspace();
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormClientId, setProjectFormClientId] = useState('');
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [documentCreatorProps, setDocumentCreatorProps] = useState({
    clientId: '',
    projectId: '',
    projectPath: '',
    initialType: undefined as string | undefined,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [exportModalProps, setExportModalProps] = useState({
    projectPath: '',
    projectName: '',
    clientName: '',
    documents: [] as DocumentInfo[]
  });

  useEffect(() => {
    const handleOpenHealthCheck = () => setShowHealthCheck(true);
    window.addEventListener('open-health-check', handleOpenHealthCheck);
    return () => window.removeEventListener('open-health-check', handleOpenHealthCheck);
  }, []);

  const handleBackupWorkspace = async () => {
    if (!workspacePath) return;
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const defaultName = `scopeflow-backup-${workspaceName.replace(/\s+/g, '-')}-${dateStr}.zip`;
      
      const savePath = await save({
        title: 'บันทึกไฟล์ Backup',
        defaultPath: defaultName,
        filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
      });

      if (!savePath) return;

      await backupWorkspace(workspacePath, savePath);
      alert('บันทึกข้อมูลสำรองสำเร็จ!');
    } catch (err) {
      alert(`เกิดข้อผิดพลาดในการสำรองข้อมูล: ${err}`);
    }
  };

  if (!workspacePath) {
    return <WelcomeScreen />;
  }

  function handleCreateDocument(clientId: string, projectId: string, projectPath: string, initialType?: string) {
    setDocumentCreatorProps({ clientId, projectId, projectPath, initialType });
    setShowDocumentCreator(true);
  }

  function handleCreateProject(clientId: string) {
    setProjectFormClientId(clientId);
    setShowProjectForm(true);
  }

  // New handler to start from customer request and create a Brief directly
  function handleStartFromCustomerRequest(clientId: string) {
    // Use clientId as projectPath for now; no specific projectId
    setDocumentCreatorProps({
      clientId,
      projectId: '',
      projectPath: clientId,
      initialType: 'brief',
    });
    setShowDocumentCreator(true);
  }

  async function handleExportProject(clientId: string, projectId: string, projectPath: string) {
    let clientName = clientId;
    let projectName = projectId;
    
    if (tree?.children) {
      const clientNode = tree.children.find((c: any) => c.path.endsWith(clientId));
      if (clientNode) {
        clientName = clientNode.name;
        if (clientNode.children) {
          const projectNode = clientNode.children.find((p: any) => p.path === projectPath);
          if (projectNode) {
            projectName = projectNode.name;
          }
        }
      }
    }

    if (!workspacePath) return;
    try {
      const docs = await listProjectDocuments(workspacePath, clientId, projectId);
      setExportModalProps({
        projectPath,
        projectName,
        clientName,
        documents: docs
      });
      setShowExportModal(true);
    } catch (err) {
      console.error("Failed to load documents for export:", err);
    }
  }

  // Flatten the tree to get all files
  const allFiles: { name: string, path: string, is_dir: boolean }[] = [];
  let isSelectedProject = false;
  let selectedProjectName = '';

  function extractFiles(node: any, depth = 0) {
    if (!node) return;
    
    // Depth 0: Workspace, Depth 1: Client, Depth 2: Project
    if (depth === 2 && node.is_dir) {
      if (node.path === selectedFile) {
        isSelectedProject = true;
        selectedProjectName = node.name;
      }
    }

    if (!node.is_dir) {
      allFiles.push({ 
        name: node.name, 
        path: node.path, 
        is_dir: node.is_dir
      });
    }
    if (node.children) {
      node.children.forEach((c: any) => extractFiles(c, depth + 1));
    }
  }
  if (tree) {
    extractFiles(tree);
  }
  const handleCreateDemoDirectly = async () => {
    if (!workspacePath) return;
    try {
      const { generateDemoWorkspace } = await import('./lib/demo-generator');
      await generateDemoWorkspace(workspacePath, workspaceName);
      await refreshTree();
      alert('สร้าง Demo Workspace สำเร็จ!');
    } catch (err) {
      alert(`สร้าง Demo ไม่สำเร็จ: ${err}`);
    }
  };

  const clientEmptyStateId = selectedFile?.startsWith('__client__:') 
    ? selectedFile.substring('__client__:'.length) 
    : '';

  const hasNoClients = !tree?.children || tree.children.length === 0;

  let mainContent;
  if ((selectedFile === '__workspace_overview__' || !selectedFile) && hasNoClients) {
    mainContent = (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-[#121214] to-[#09090b]">
        <div className="max-w-md w-full mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <FolderOpen className="w-8 h-8 text-primary-light" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">ยังไม่มีลูกค้า</h2>
          <p className="text-sm text-text-dim mb-8">
            สร้างลูกค้ารายแรก หรือใช้ Demo Workspace เพื่อทดลอง workflow
          </p>
          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={handleCreateDemoDirectly}
              className="btn btn-ghost"
            >
              สร้าง Demo
            </button>
            <button
              onClick={() => setShowClientForm(true)}
              className="btn btn-primary"
            >
              สร้างลูกค้าใหม่
            </button>
          </div>
        </div>
      </div>
    );
  } else if (clientEmptyStateId) {
    const clientNode = tree?.children?.find(c => c.path.endsWith(clientEmptyStateId) || c.path.split('/').pop() === clientEmptyStateId);
    const clientName = clientNode ? clientNode.name : clientEmptyStateId;
    mainContent = (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-[#121214] to-[#09090b]">
        <div className="max-w-md w-full mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
            <Briefcase className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">ยังไม่มีงานของลูกค้ารายนี้ ({clientName})</h2>
          <p className="text-sm text-text-dim mb-8">
            เริ่มจากสร้างโปรเจกต์ หรือวางคำขอลูกค้าเพื่อสร้าง Brief แรก
          </p>
          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={() => handleStartFromCustomerRequest(clientEmptyStateId)}
              className="btn btn-ghost"
            >
              เริ่มจากคำขอลูกค้า
            </button>
            <button
              onClick={() => handleCreateProject(clientEmptyStateId)}
              className="btn btn-primary"
            >
              สร้างโปรเจกต์
            </button>
          </div>
        </div>
      </div>
    );
  } else if (selectedFile === '__workspace_overview__' || !selectedFile) {
    mainContent = (
      <WorkspaceOverview
        onCreateClient={() => setShowClientForm(true)}
        onRunHealthCheck={() => setShowHealthCheck(true)}
        onBackupWorkspace={handleBackupWorkspace}
        onCreateProject={handleCreateProject}
      />
    );
  } else {
    mainContent = isSelectedProject ? (
      <ProjectOverview
        projectPath={selectedFile}
        projectName={selectedProjectName}
        workspaceTree={tree as any}
        onOpenDocument={(path) => setSelectedFile(path)}
        onCreateDocument={handleCreateDocument}
      />
    ) : (
      <MarkdownEditor
        filePath={selectedFile}
        workspacePath={workspacePath}
        onDocumentChanged={refreshTree}
        onOpenDocument={(path) => setSelectedFile(path)}
        allFiles={allFiles}
      />
    );
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        onCreateClient={() => setShowClientForm(true)}
        onCreateProject={handleCreateProject}
        onCreateDocument={handleCreateDocument}
        onExportProject={handleExportProject}
        onOpenSettings={() => setShowCompanySettings(true)}
        onRunHealthCheck={() => setShowHealthCheck(true)}
        onBackupWorkspace={handleBackupWorkspace}
      />

      <main className="flex-1 h-full overflow-hidden">
        {mainContent}
      </main>

      {showClientForm && <ClientForm onClose={() => setShowClientForm(false)} />}
      {showProjectForm && (
        <ProjectForm
          clientId={projectFormClientId}
          onClose={() => setShowProjectForm(false)}
        />
      )}
      {showDocumentCreator && (
        <DocumentCreatorModal
          {...documentCreatorProps}
          onClose={() => setShowDocumentCreator(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          {...exportModalProps}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showCompanySettings && (
        <CompanySettingsModal
          workspacePath={workspacePath}
          onClose={() => setShowCompanySettings(false)}
        />
      )}
      {showHealthCheck && (
        <HealthCheckModal onClose={() => setShowHealthCheck(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}
