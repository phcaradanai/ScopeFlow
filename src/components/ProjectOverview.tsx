import { FileEntry } from '../lib/tauri-commands';
import { useProjectDocuments } from '../hooks/useProjectDocuments';
import { RefreshCw, Briefcase, Plus, Search } from 'lucide-react';
import SelectField from './ui/SelectField';
import PageShell from './ui/PageShell';
import ProjectWorkflowStepper from './project/ProjectWorkflowStepper';
import ScopeReadinessGrid from './project/ScopeReadinessGrid';
import ProjectRisksPanel from './project/ProjectRisksPanel';
import ProjectWorkflowStats from './project/ProjectWorkflowStats';
import DocumentList from './project/DocumentList';
import ProjectLifecycleCommandCenter from './project/ProjectLifecycleCommandCenter';
import CustomerAnswerIntakePanel from './project/CustomerAnswerIntakePanel';

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string, lifecycleContext?: any) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
  lifecycleFeedback?: any;
  onClearLifecycleFeedback?: () => void;
}

function getProjectPathIds(projectPath: string): { clientId: string; projectId: string } {
  const normalized = projectPath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  const clientsIndex = parts.lastIndexOf('clients');
  const projectsIndex = parts.lastIndexOf('projects');
  const clientId = clientsIndex >= 0 && parts[clientsIndex + 1] ? parts[clientsIndex + 1] : '';
  const projectId = projectsIndex >= 0 && parts[projectsIndex + 1] ? parts[projectsIndex + 1] : parts[parts.length - 1] || '';
  return { clientId, projectId };
}

export default function ProjectOverview({
  projectPath,
  projectName,
  workspaceTree,
  onOpenDocument,
  onCreateDocument,
  onStartBriefIntake,
  lifecycleFeedback,
  onClearLifecycleFeedback,
}: ProjectOverviewProps) {
  const {
    documents,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    loadDocuments,
    briefDocs,
    draftDocs,
    approvedDocs,
    openCRs,
    openSUPs,
    pendingApprovals,
    scopeDocs,
    quotationDocs,
    invoiceDocs,
    contentFlags,
    hasNoScope,
    hasNoQuote,
    workflowState,
    filteredDocs,
    uniqueTypes,
    uniqueStatuses,
  } = useProjectDocuments(projectPath, workspaceTree);

  const scanFiles = documents.map(doc => ({
    path: doc.file_path,
    markdown: doc.markdown || '',
  }));

  const { clientId, projectId } = getProjectPathIds(projectPath);

  const Header = (
    <div className="page-header-inner page-container-wide">
      <div className="page-title-group">
        <h1 className="page-title">
          <Briefcase className="w-7 h-7 text-primary shrink-0" />
          <span className="page-title-text">{projectName}</span>
        </h1>
        <p className="page-subtitle">ภาพรวมโครงการและดัชนีเอกสาร</p>
      </div>
      <div className="page-actions">
        <button
          onClick={() => onCreateDocument(clientId, projectId, projectPath)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> สร้างเอกสาร
        </button>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="btn btn-ghost"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>
    </div>
  );

  return (
    <PageShell header={Header}>
      <ProjectLifecycleCommandCenter
        projectName={projectName}
        projectPath={projectPath}
        scanFiles={scanFiles}
        onOpenDocument={onOpenDocument}
        onOpenProject={() => onOpenDocument(projectPath)}
        onStartBriefIntake={onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined}
        onCreateDocument={(initialType, lifecycleContext) => onCreateDocument(clientId, projectId, projectPath, initialType, lifecycleContext)}
        lifecycleFeedback={lifecycleFeedback}
        onClearLifecycleFeedback={onClearLifecycleFeedback}
      />

      <div className="my-6">
        <CustomerAnswerIntakePanel 
          onStartBriefIntake={onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined}
          onCreateChangeRequest={() => onCreateDocument(clientId, projectId, projectPath, 'cr')}
          onCreateFollowUp={() => { /* TODO: hook up to message/followup generator */ }}
        />
      </div>

      <ProjectWorkflowStepper
        workflowState={workflowState}
        clientId={clientId}
        projectPath={projectPath}
        onCreateDocument={onCreateDocument}
        onStartBriefIntake={onStartBriefIntake}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProjectRisksPanel
          hasNoScope={hasNoScope}
          hasNoQuote={hasNoQuote}
          openCRs={openCRs}
          pendingApprovals={pendingApprovals}
        />
        <ProjectWorkflowStats
          draftDocs={draftDocs}
          approvedDocs={approvedDocs}
          openCRs={openCRs}
          openSUPs={openSUPs}
        />
      </div>

      <ScopeReadinessGrid
        briefDocs={briefDocs}
        scopeDocs={scopeDocs}
        quotationDocs={quotationDocs}
        invoiceDocs={invoiceDocs}
        approvedDocs={approvedDocs}
        contentFlags={contentFlags}
      />

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_168px_168px] gap-3">
        <div className="form-input-with-icon group">
          <Search className="form-input-leading-icon group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input form-input-has-leading-icon"
          />
        </div>
        <SelectField
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: 'all', label: 'ทุกประเภท' },
            ...uniqueTypes.map(t => ({ value: t, label: t }))
          ]}
        />
        <SelectField
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'ทุกสถานะ' },
            ...uniqueStatuses.map(s => ({ value: s, label: s }))
          ]}
        />
      </div>

      <DocumentList
        filteredDocs={filteredDocs}
        onOpenDocument={onOpenDocument}
        clientId={clientId}
        projectPath={projectPath}
        onCreateDocument={onCreateDocument}
        onStartBriefIntake={onStartBriefIntake}
      />
    </PageShell>
  );
}
