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
import BriefIntakeModal from './components/BriefIntakeModal';
import ClientOverview from './components/ClientOverview';
import DemoFlowGuideModal from './components/demo/DemoFlowGuideModal';
import { listProjectDocuments, DocumentInfo, backupWorkspace } from './lib/tauri-commands';
import { FolderOpen, Briefcase } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { findWorkspaceClient, findWorkspaceProject, getWorkspaceClients } from './lib/workspace-scanner';
import AppShell from './components/ui/AppShell';
import EmptyState from './components/ui/EmptyState';
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
  const [showBriefIntakeModal, setShowBriefIntakeModal] = useState(false);
  const [briefIntakeProps, setBriefIntakeProps] = useState({
    clientId: '',
    projectId: undefined as string | undefined,
    projectPath: undefined as string | undefined,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [demoGuideProjectPath, setDemoGuideProjectPath] = useState('');
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

  function handleStartBriefIntake(clientId: string, projectId?: string, projectPath?: string) {
    setBriefIntakeProps({ clientId, projectId, projectPath });
    setShowBriefIntakeModal(true);
  }

  function handleStartFromCustomerRequest(clientId: string) {
    handleStartBriefIntake(clientId);
  }

  async function handleExportProject(clientId: string, projectId: string, projectPath: string) {
    const client = findWorkspaceClient(tree, clientId);
    const project = findWorkspaceProject(tree, projectPath);
    const clientName = client?.clientName || clientId;
    const projectName = project?.projectName || projectId;

    if (!workspacePath) return;
    try {
      const docs = await listProjectDocuments(workspacePath, clientId, projectId);
      setExportModalProps({ projectPath, projectName, clientName, documents: docs });
      setShowExportModal(true);
    } catch (err) {
      console.error('Failed to load documents for export:', err);
    }
  }

  const allFiles: { name: string, path: string, is_dir: boolean }[] = [];
  function extractFiles(node: any) {
    if (!node) return;
    if (!node.is_dir) {
      allFiles.push({ name: node.name, path: node.path, is_dir: node.is_dir });
    }
    node.children?.forEach((c: any) => extractFiles(c));
  }
  if (tree) extractFiles(tree);

  const selectedProject = selectedFile ? findWorkspaceProject(tree, selectedFile) : undefined;

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

  const workspaceClients = getWorkspaceClients(tree);
  const hasNoClients = workspaceClients.length === 0;

  let mainContent;
  if ((selectedFile === '__workspace_overview__' || !selectedFile) && hasNoClients) {
    mainContent = (
      <EmptyState
        icon={FolderOpen}
        title="ยังไม่มีลูกค้า"
        description="สร้างลูกค้ารายแรก หรือใช้ Demo Workspace เพื่อทดลอง workflow"
        primaryAction={{ label: 'สร้างลูกค้าใหม่', onClick: () => setShowClientForm(true) }}
        secondaryAction={{ label: 'สร้าง Demo', onClick: handleCreateDemoDirectly }}
      />
    );
  } else if (clientEmptyStateId) {
    const client = findWorkspaceClient(tree, clientEmptyStateId);
    const clientName = client?.clientName || clientEmptyStateId;

    mainContent = client && client.projects.length > 0 ? (
      <ClientOverview
        clientNode={client.node}
        clientId={client.clientId}
        onCreateProject={handleCreateProject}
        onOpenProject={setSelectedFile}
        onStartBriefIntake={handleStartFromCustomerRequest}
      />
    ) : (
      <EmptyState
        icon={Briefcase}
        title={`ยังไม่มีงานของลูกค้ารายนี้ (${clientName})`}
        description="เริ่มจากวางคำขอลูกค้าเพื่อสร้าง Brief แรก หรือสร้างโปรเจกต์เปล่าถ้าต้องการจัดโครงงานเอง"
        iconColorClass="text-accent"
        iconBgClass="bg-accent/10 border-accent/20"
        primaryAction={{ label: 'เริ่มจากคำขอลูกค้า', onClick: () => handleStartFromCustomerRequest(clientEmptyStateId) }}
        secondaryAction={{ label: 'สร้างโปรเจกต์', onClick: () => handleCreateProject(clientEmptyStateId) }}
      />
    );
  } else if (selectedFile === '__workspace_overview__' || !selectedFile) {
    mainContent = (
      <WorkspaceOverview
        onCreateClient={() => setShowClientForm(true)}
        onRunHealthCheck={() => setShowHealthCheck(true)}
        onBackupWorkspace={handleBackupWorkspace}
        onCreateProject={handleCreateProject}
        onDemoFlowCreated={setDemoGuideProjectPath}
      />
    );
  } else {
    mainContent = selectedProject ? (
      <ProjectOverview
        projectPath={selectedProject.path}
        projectName={selectedProject.projectName}
        workspaceTree={tree as any}
        onOpenDocument={(path) => setSelectedFile(path)}
        onCreateDocument={handleCreateDocument}
        onStartBriefIntake={handleStartBriefIntake}
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
    <AppShell
      sidebar={
        <Sidebar
          onCreateClient={() => setShowClientForm(true)}
          onCreateProject={handleCreateProject}
          onCreateDocument={handleCreateDocument}
          onExportProject={handleExportProject}
          onOpenSettings={() => setShowCompanySettings(true)}
          onRunHealthCheck={() => setShowHealthCheck(true)}
          onBackupWorkspace={handleBackupWorkspace}
        />
      }
    >
      {mainContent}

      {showClientForm && <ClientForm onClose={() => setShowClientForm(false)} />}
      {showProjectForm && (
        <ProjectForm clientId={projectFormClientId} onClose={() => setShowProjectForm(false)} />
      )}
      {showDocumentCreator && (
        <DocumentCreatorModal {...documentCreatorProps} onClose={() => setShowDocumentCreator(false)} />
      )}
      {showBriefIntakeModal && (
        <BriefIntakeModal {...briefIntakeProps} onClose={() => setShowBriefIntakeModal(false)} />
      )}
      {showExportModal && (
        <ExportModal {...exportModalProps} onClose={() => setShowExportModal(false)} />
      )}
      {showCompanySettings && (
        <CompanySettingsModal workspacePath={workspacePath} onClose={() => setShowCompanySettings(false)} />
      )}
      {showHealthCheck && <HealthCheckModal onClose={() => setShowHealthCheck(false)} />}
      {demoGuideProjectPath && (
        <DemoFlowGuideModal
          projectPath={demoGuideProjectPath}
          onOpenProject={setSelectedFile}
          onClose={() => setDemoGuideProjectPath('')}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}
