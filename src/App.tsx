import { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './lib/workspace-context';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import ClientForm from './components/ClientForm';
import ProjectForm from './components/ProjectForm';
import MarkdownEditor from './components/MarkdownEditor';
import DocumentCreatorModal from './components/DocumentCreatorModal';
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
