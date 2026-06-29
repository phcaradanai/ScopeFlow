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
import DocumentCreationPreviewModal from './project/DocumentCreationPreviewModal';
import { useLifecycleActionDispatcher } from '../hooks/useLifecycleActionDispatcher';
import type { CustomerAnswerWorkflowContext } from '../lib/ai/customer-answer/customerAnswerWorkflowContext';

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

function buildCustomerAnswerDocumentContext(
  projectPath: string,
  initialType: string,
  reason: string,
  recommendationWhy: string,
  customerAnswerContext: CustomerAnswerWorkflowContext
) {
  return {
    source: 'customer_answer' as const,
    initialType,
    reason,
    projectPath,
    recommendationWhy,
    customerAnswerContext,
  };
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

  const {
    showPreviewModal,
    setShowPreviewModal,
    priority,
    displayNextAction,
    commandAction,
    explanation,
    executeAction,
    confirmCreateDocument,
  } = useLifecycleActionDispatcher({
    scanFiles,
    projectPath,
    onOpenDocument,
    onOpenProject: () => onOpenDocument(projectPath),
    onStartBriefIntake: onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined,
    onCreateDocument: (initialType?: string, lifecycleContext?: any) => onCreateDocument(clientId, projectId, projectPath, initialType, lifecycleContext),
  });

  const handleCreateCustomerAnswerDocument = (
    initialType: string,
    customerAnswerContext: CustomerAnswerWorkflowContext,
    reason: string,
    recommendationWhy: string
  ) => {
    onCreateDocument(
      clientId,
      projectId,
      projectPath,
      initialType,
      buildCustomerAnswerDocumentContext(projectPath, initialType, reason, recommendationWhy, customerAnswerContext)
    );
  };

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
        priority={priority}
        displayNextAction={displayNextAction}
        commandAction={commandAction}
        explanation={explanation}
        onExecuteAction={executeAction}
        lifecycleFeedback={lifecycleFeedback}
        onClearLifecycleFeedback={onClearLifecycleFeedback}
      />

      <div className="my-6">
        <CustomerAnswerIntakePanel
          scanFiles={scanFiles}
          onOpenDocument={onOpenDocument}
          onCreateChangeRequest={(customerAnswerContext: CustomerAnswerWorkflowContext) => handleCreateCustomerAnswerDocument(
            'cr',
            customerAnswerContext,
            'Customer answer indicates a possible scope change. Prepare CR/DCR instead of silently changing the current scope.',
            customerAnswerContext.recommendedAction
          )}
          onCreateFollowUp={(customerAnswerContext: CustomerAnswerWorkflowContext) => handleCreateCustomerAnswerDocument(
            'followup',
            customerAnswerContext,
            'Customer answer needs clarification before updating the project baseline or commercial documents.',
            customerAnswerContext.recommendedAction
          )}
          onContinueLifecycle={() => executeAction()}
          onStartRevisionReview={(customerAnswerContext: CustomerAnswerWorkflowContext) => handleCreateCustomerAnswerDocument(
            'revision',
            customerAnswerContext,
            'Customer rejected or did not accept the current artifact. Start revision review before changing scope/quotation.',
            customerAnswerContext.recommendedAction
          )}
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

      <DocumentCreationPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={confirmCreateDocument}
        documentType={commandAction.initial_type}
        projectName={projectName || 'Current Project'}
        reason={commandAction.guidance}
        lifecycleStage={priority.label}
        recommendationWhy={displayNextAction}
      />
    </PageShell>
  );
}
