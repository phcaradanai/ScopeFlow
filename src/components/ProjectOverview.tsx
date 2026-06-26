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

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function ProjectOverview({
  projectPath,
  projectName,
  workspaceTree,
  onOpenDocument,
  onCreateDocument,
  onStartBriefIntake,
}: ProjectOverviewProps) {
  const {
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
    hasNoBrief,
    hasNoScope,
    hasNoQuote,
    filteredDocs,
    uniqueTypes,
    uniqueStatuses,
  } = useProjectDocuments(projectPath, workspaceTree);

  const clientId = projectPath.split('/').slice(-2, -1)[0] || '';
  const projectId = projectPath.split('/').pop() || '';

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
      <ProjectWorkflowStepper
        hasNoBrief={hasNoBrief}
        hasNoScope={hasNoScope}
        hasNoQuote={hasNoQuote}
        approvedDocs={approvedDocs}
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
        <div className="relative group min-w-0">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pl-12"
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
