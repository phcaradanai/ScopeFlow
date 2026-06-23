import { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './lib/workspace-context';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import ClientForm from './components/ClientForm';
import ProjectForm from './components/ProjectForm';
import MarkdownEditor from './components/MarkdownEditor';
import DocumentCreatorModal from './components/DocumentCreatorModal';
import ExportModal from './components/ExportModal';
import CompanySettingsModal from './components/CompanySettingsModal';
import { listProjectDocuments, DocumentInfo } from './lib/tauri-commands';
import { FileText } from 'lucide-react';
import './index.css';

function AppContent() {
  const { workspacePath, selectedFile, refreshTree, setSelectedFile, tree } = useWorkspace();
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormClientId, setProjectFormClientId] = useState('');
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [documentCreatorProps, setDocumentCreatorProps] = useState({
    clientId: '',
    projectId: '',
    projectPath: '',
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [exportModalProps, setExportModalProps] = useState({
    projectPath: '',
    projectName: '',
    clientName: '',
    documents: [] as DocumentInfo[]
  });

  if (!workspacePath) {
    return <WelcomeScreen />;
  }

  function handleCreateDocument(clientId: string, projectId: string, projectPath: string) {
    setDocumentCreatorProps({ clientId, projectId, projectPath });
    setShowDocumentCreator(true);
  }

  function handleCreateProject(clientId: string) {
    setProjectFormClientId(clientId);
    setShowProjectForm(true);
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
  function extractFiles(node: any) {
    if (!node) return;
    if (!node.is_dir) {
      allFiles.push({ name: node.name, path: node.path, is_dir: node.is_dir });
    }
    if (node.children) {
      node.children.forEach(extractFiles);
    }
  }
  if (tree) {
    extractFiles(tree);
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        onCreateClient={() => setShowClientForm(true)}
        onCreateProject={handleCreateProject}
        onCreateDocument={handleCreateDocument}
        onExportProject={handleExportProject}
        onOpenSettings={() => setShowCompanySettings(true)}
      />

      <main className="flex-1 h-full overflow-hidden">
        {selectedFile ? (
          <MarkdownEditor
            filePath={selectedFile}
            workspacePath={workspacePath}
            onDocumentChanged={refreshTree}
            onOpenDocument={(path) => setSelectedFile(path)}
            allFiles={allFiles}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-text-dim mx-auto mb-3" />
              <p className="text-text-muted">เลือกเอกสารจากแถบด้านซ้าย</p>
              <p className="text-sm text-text-dim mt-1">
                หรือสร้างลูกค้า → โครงการ → สร้างเอกสารใหม่
              </p>
            </div>
          </div>
        )}
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
