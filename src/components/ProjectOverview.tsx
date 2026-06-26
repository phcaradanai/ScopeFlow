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
  onStartBriefIntake 
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
    uniqueStatuses
  } = useProjectDocuments(projectPath, workspaceTree);

  const clientId = projectPath.split('/').slice(-2, -1)[0] || '';
  const projectId = projectPath.split('/').pop() || '';

  const Header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-primary" />
          {projectName}
        </h1>
        <p className="text-base text-text-muted mt-2 font-medium">ภาพรวมโครงการและดัชนีเอกสาร</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onCreateDocument(clientId, projectId, projectPath)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> สร้างเอกสาร
        </button>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-base font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 shadow-sm min-h-[44px]"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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

      <div className="flex flex-col gap-5">
        <ScopeReadinessGrid 
          briefDocs={briefDocs}
          scopeDocs={scopeDocs}
          quotationDocs={quotationDocs}
          invoiceDocs={invoiceDocs}
          approvedDocs={approvedDocs}
          contentFlags={contentFlags}
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
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pl-12"
          />
        </div>
        <div className="relative sm:w-48">
          <SelectField
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'ทุกประเภท' },
              ...uniqueTypes.map(t => ({ value: t, label: t }))
            ]}
          />
        </div>
        <div className="relative sm:w-48">
          <SelectField
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'ทุกสถานะ' },
              ...uniqueStatuses.map(s => ({ value: s, label: s }))
            ]}
          />
        </div>
      </div>

      <div className="space-y-3 pb-8">
        <DocumentList 
          filteredDocs={filteredDocs}
          onOpenDocument={onOpenDocument}
          clientId={clientId}
          projectPath={projectPath}
          onCreateDocument={onCreateDocument}
          onStartBriefIntake={onStartBriefIntake}
        />
      </div>
    </PageShell>
  );
}
