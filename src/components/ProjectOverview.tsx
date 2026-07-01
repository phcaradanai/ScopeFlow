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
import MvpGuidedPath from './project/MvpGuidedPath';
import { useLifecycleActionDispatcher } from '../hooks/useLifecycleActionDispatcher';
import type { CustomerAnswerWorkflowContext } from '../lib/ai/customer-answer/customerAnswerWorkflowContext';
import MarkdownEditor from './MarkdownEditor';

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string, lifecycleContext?: any) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
  lifecycleFeedback?: any;
  onClearLifecycleFeedback?: () => void;
  activeDocumentPath?: string;
  allFiles?: { name: string, path: string, is_dir: boolean }[];
  workspacePath?: string;
  onDocumentChanged?: () => void;
  onCloseDocument?: () => void;
}

function getProjectPathIds(projectPath: string): { clientId: string; projectId: string } {
  const normalized = projectPath.split('\\').join('/');
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
  activeDocumentPath,
  allFiles,
  workspacePath,
  onDocumentChanged,
  onCloseDocument,
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

  const handleStartDiscovery = onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined;

  const handlePrimaryAction = () => {
    if (workflowState.targetDocumentType === 'brief' && briefDocs === 0 && handleStartDiscovery) {
      handleStartDiscovery();
    } else if (workflowState.targetDocumentType === 'export') {
      // Export action - handled by sidebar usually, but can dispatch an event or alert
      alert('พร้อมส่งออกเอกสาร กรุณาใช้ปุ่ม Export ที่เมนูด้านซ้าย');
    } else {
      onCreateDocument(clientId, projectId, projectPath, workflowState.targetDocumentType, {
        source: 'recommended_next_action',
        initialType: workflowState.targetDocumentType,
        reason: workflowState.nextActionLabel,
        projectPath,
        recommendationWhy: workflowState.nextActionDescription
      });
    }
  };

  const commandCenterPriority = {
    label: workflowState.missingRequiredItems.length > 0 ? 'Action Required' : 'Ready',
    category: workflowState.missingRequiredItems.length > 0 ? 'blocked' : 'can_close'
  };

  const commandCenterAction = {
    label: workflowState.nextActionLabel,
    guidance: workflowState.nextActionLabel,
    initial_type: workflowState.targetDocumentType,
    kind: 'create_document'
  };

  const commandCenterExplanation = {
    blockedItem: workflowState.missingRequiredItems.length > 0 ? {
      label: workflowState.missingRequiredItems[0],
      recommended_next_action: workflowState.nextActionDescription
    } : null,
    insights: []
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
        {handleStartDiscovery && (
          <button
            onClick={handleStartDiscovery}
            className="btn btn-primary"
          >
            <Search className="w-4 h-4" /> Start Discovery
          </button>
        )}
        <button
          onClick={() => onCreateDocument(clientId, projectId, projectPath)}
          className="btn btn-outline"
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
      <MvpGuidedPath
        hasBrief={briefDocs > 0}
        hasScope={scopeDocs > 0}
        hasQuotation={quotationDocs > 0}
        onStartDiscovery={handleStartDiscovery}
      />

      <ProjectLifecycleCommandCenter
        projectName={projectName}
        projectPath={projectPath}
        priority={commandCenterPriority}
        displayNextAction={workflowState.nextActionDescription}
        commandAction={commandCenterAction}
        explanation={commandCenterExplanation}
        onExecuteAction={handlePrimaryAction}
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

      <details className="mt-8 mb-4 border border-border rounded-xl bg-surface-2 group">
        <summary className="p-4 font-semibold text-text cursor-pointer select-none outline-none group-focus-within:ring-2 group-focus-within:ring-primary rounded-xl">
          📂 ไฟล์เอกสารทั้งหมด (File Explorer)
        </summary>
        <div className="p-4 pt-0 border-t border-border mt-2">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_168px_168px] gap-3 mb-4 mt-4">
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
        </div>
      </details>

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

      {/* Editor Detail Panel / Overlay */}
      {activeDocumentPath && workspacePath && allFiles && onDocumentChanged && onCloseDocument && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseDocument} />
          <div className="relative ml-auto w-full max-w-4xl h-full bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                filePath={activeDocumentPath}
                workspacePath={workspacePath}
                onDocumentChanged={onDocumentChanged}
                onOpenDocument={onOpenDocument}
                allFiles={allFiles}
              />
            </div>
            <div className="p-4 border-t border-border bg-surface-2 flex justify-end shrink-0">
              <button onClick={onCloseDocument} className="btn btn-primary">
                กลับสู่หน้าภาพรวมโครงการ
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
