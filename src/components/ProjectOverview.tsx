import { useEffect, useMemo, useState } from 'react';
import { FileEntry, createDocument, pathExists, readFileContent, updateFileContent } from '../lib/tauri-commands';
import { useProjectDocuments } from '../hooks/useProjectDocuments';
import { RefreshCw, Briefcase, Plus, Search, Sparkles } from 'lucide-react';
import SelectField from './ui/SelectField';
import PageShell from './ui/PageShell';
import ProjectWorkflowStepper from './project/ProjectWorkflowStepper';
import ScopeReadinessGrid from './project/ScopeReadinessGrid';
import ProjectRisksPanel from './project/ProjectRisksPanel';
import ProjectWorkflowStats from './project/ProjectWorkflowStats';
import DocumentList from './project/DocumentList';
import ProjectLifecycleCommandCenter from './project/ProjectLifecycleCommandCenter';
import DocumentCreationPreviewModal from './project/DocumentCreationPreviewModal';
import GuidedOperatingModePanel from './project/GuidedOperatingModePanel';
import ProjectReadinessGatePanel from './project/ProjectReadinessGatePanel';
import FriendlyDocumentConflictModal, { type FriendlyConflictAction } from './project/FriendlyDocumentConflictModal';
import { useLifecycleActionDispatcher } from '../hooks/useLifecycleActionDispatcher';
import type { GuidedPrimaryAction } from '../lib/guided-operating-mode';
import { buildGuidedOperatingModeState } from '../lib/guided-operating-mode';
import { buildProjectReadinessGate } from '../lib/project-readiness-gate';
import { parseBriefToScope } from '../lib/brief-builder';
import { generateScopeMarkdown } from '../lib/scope-builder';
import { getAiProviders } from '../lib/ai/providers/providerSettings';
import { mergeDocumentDeterministically, mergeDocumentWithAi } from '../lib/ai/documentMergeAssistant';

import { t } from '../lib/i18n/copy';
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

interface GuidedConflictState {
  existingPath: string;
  newVersionPath: string;
  newContent: string;
  documentKind: string;
  protectedUpdate?: boolean;
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

function joinPath(...parts: string[]) {
  return parts
    .map((part, index) => {
      const normalized = part.replace(/\\/g, '/');
      if (index === 0) return normalized.replace(/\/+$/g, '');
      return normalized.replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

function getFileName(path: string) {
  return path.replace(/\\/g, '/').split('/').pop() || '';
}




function buildScopeFromBriefMarkdown(briefMarkdown: string, filename: string) {
  const prefillData = parseBriefToScope(briefMarkdown);
  return generateScopeMarkdown({
    title: 'ขอบเขตงาน (Scope of Work)',
    ...prefillData,
    acceptance_criteria: '',
    deliverables: prefillData.deliverables || '',
  }, filename);
}

function getNextScopeVersionFilename(paths: string[]) {
  let maxMajor = 1;
  let maxMinor = 0;
  paths.forEach(path => {
    const match = getFileName(path).match(/^scope-v(\d+)\.(\d+)\.md$/);
    if (!match) return;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
      maxMajor = major;
      maxMinor = minor;
    }
  });
  return `scope-v${maxMajor}.${maxMinor + 1}.md`;
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

  const [aiEnabled, setAiEnabled] = useState(false);
  const [guidedConflict, setGuidedConflict] = useState<GuidedConflictState | null>(null);
  const [guidedBusy, setGuidedBusy] = useState(false);
  const [guidedNotice, setGuidedNotice] = useState('');


  const scanFiles = documents.map(doc => ({
    path: doc.file_path,
    markdown: doc.markdown || '',
  }));

  const { clientId, projectId } = getProjectPathIds(projectPath);
  const guidedState = useMemo(() => buildGuidedOperatingModeState(documents), [documents]);
  const readinessGate = useMemo(() => buildProjectReadinessGate(documents), [documents]);
  const gateGuidedState = useMemo(() => ({
    ...guidedState,
    primaryAction: readinessGate.primaryAction,
    readinessScore: readinessGate.score,
    headline: readinessGate.headline,
    summary: readinessGate.summary,
    blockers: readinessGate.blockers.map(blocker => blocker.reason),
  }), [guidedState, readinessGate]);
  const isEmptyProject = documents.length === 0;
  useEffect(() => {
    let mounted = true;
    async function loadAiProviderState() {
      if (!workspacePath) {
        setAiEnabled(false);
        return;
      }
      try {
        const providers = await getAiProviders(workspacePath);
        const usableProvider = providers.providers.some(provider => provider.enabled !== false && provider.baseUrl?.trim() && provider.model?.trim());
        if (mounted) setAiEnabled(Boolean(providers.enabled && usableProvider));
      } catch {
        if (mounted) setAiEnabled(false);
      }
    }
    loadAiProviderState();
    return () => { mounted = false; };
  }, [workspacePath]);



  const {
    showPreviewModal,
    setShowPreviewModal,
    priority,
    displayNextAction,
    commandAction,
    confirmCreateDocument,
  } = useLifecycleActionDispatcher({
    scanFiles,
    projectPath,
    onOpenDocument,
    onOpenProject: () => onOpenDocument(projectPath),
    onStartBriefIntake: onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined,
    onCreateDocument: (initialType?: string, lifecycleContext?: any) => onCreateDocument(clientId, projectId, projectPath, initialType, lifecycleContext),
  });


  const handleStartDiscovery = onStartBriefIntake ? () => onStartBriefIntake(clientId, projectId, projectPath) : undefined;

  const handlePrimaryAction = () => {
    if (workflowState.targetDocumentType === 'brief' && briefDocs === 0 && handleStartDiscovery) {
      handleStartDiscovery();
    } else if (workflowState.targetDocumentType === 'export') {
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

  const openAndRefresh = async (path: string) => {
    await loadDocuments();
    onDocumentChanged?.();
    onOpenDocument(path);
  };

  const handleCreateScopeFromBrief = async () => {
    const brief = documents.find(doc => doc.type === 'brief' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'brief');
    if (!brief) {
      handleStartDiscovery?.();
      return;
    }

    try {
      setGuidedBusy(true);
      setGuidedNotice('');
      const briefMarkdown = brief.markdown || await readFileContent(brief.file_path);
      const scopeFilename = 'scope-v1.0.md';
      const scopePath = joinPath(projectPath, 'baseline', scopeFilename);
      const scopeContent = buildScopeFromBriefMarkdown(briefMarkdown, scopeFilename);
      const exists = await pathExists(scopePath);

      if (!exists) {
        await createDocument(scopePath, scopeContent);
        await openAndRefresh(scopePath);
        return;
      }

      const scopePaths = documents.filter(doc => doc.type === 'scope').map(doc => doc.file_path);
      const newVersionName = getNextScopeVersionFilename(scopePaths);
      setGuidedConflict({
        existingPath: scopePath,
        newVersionPath: joinPath(projectPath, 'baseline', newVersionName),
        newContent: buildScopeFromBriefMarkdown(briefMarkdown, newVersionName),
        documentKind: 'scope',
      });
    } catch (err) {
      setGuidedNotice(`สร้าง Scope จาก Brief ไม่สำเร็จ: ${err}`);
    } finally {
      setGuidedBusy(false);
    }
  };





  const executeGuidedAction = (action: GuidedPrimaryAction) => {
    if (action.kind === 'start_discovery') {
      handleStartDiscovery?.();
      return;
    }
    if (action.kind === 'create_scope_from_brief') {
      handleCreateScopeFromBrief();
      return;
    }
    if (action.kind === 'open_document' && action.documentPath) {
      onOpenDocument(action.documentPath);
      return;
    }
    if (action.kind === 'create_change_request') {
      if (action.documentPath) onOpenDocument(action.documentPath);
      else onCreateDocument(clientId, projectId, projectPath, 'cr', {
        source: 'recommended_next_action',
        initialType: 'cr',
        reason: action.label,
        projectPath,
        recommendationWhy: action.description,
      });
      return;
    }
    if (action.kind === 'create_document' && action.documentType) {
      onCreateDocument(clientId, projectId, projectPath, action.documentType, {
        source: 'recommended_next_action',
        initialType: action.documentType,
        reason: action.label,
        projectPath,
        recommendationWhy: action.description,
      });
      return;
    }
    if (action.kind === 'export_project') {
      alert('พร้อมส่งออกเอกสาร กรุณาใช้ปุ่ม Export ที่เมนูด้านซ้าย');
      return;
    }
    handlePrimaryAction();
  };

  const runConflictAction = async (mode: FriendlyConflictAction) => {
    if (!guidedConflict) return;
    if (mode === 'open') {
      onOpenDocument(guidedConflict.existingPath);
      setGuidedConflict(null);
      return;
    }

    if (guidedConflict.protectedUpdate && mode !== 'version') {
      setGuidedNotice('เอกสารนี้ approved/locked แล้ว จึงไม่สามารถเขียนทับเดิมได้ กรุณาเลือก “สร้างเวอร์ชันใหม่” หรือสร้าง Change Request แทน');
      return;
    }

    try {
      setGuidedBusy(true);
      setGuidedNotice('');

      if (mode === 'version') {
        await createDocument(guidedConflict.newVersionPath, guidedConflict.newContent);
        setGuidedConflict(null);
        await openAndRefresh(guidedConflict.newVersionPath);
        return;
      }

      if (mode === 'replace') {
        if (!window.confirm('ยืนยันแทนที่เอกสารเดิม? ใช้เมื่อมั่นใจว่าไม่ต้องเก็บฉบับเดิมแล้ว')) return;
        await updateFileContent(guidedConflict.existingPath, guidedConflict.newContent);
        setGuidedConflict(null);
        await openAndRefresh(guidedConflict.existingPath);
        return;
      }

      if (mode === 'update') {
        await updateFileContent(guidedConflict.existingPath, guidedConflict.newContent);
        setGuidedConflict(null);
        await openAndRefresh(guidedConflict.existingPath);
        return;
      }

      const existingMarkdown = await readFileContent(guidedConflict.existingPath);
      let mergedMarkdown = '';
      let mergeSummary = '';
      try {
        if (!workspacePath) throw new Error('workspacePath is required for AI merge');
        const merged = await mergeDocumentWithAi(workspacePath, {
          existingMarkdown,
          newDraftMarkdown: guidedConflict.newContent,
          documentKind: guidedConflict.documentKind,
          instruction: `Update the existing ${guidedConflict.documentKind} while preserving approved or locked decisions. Do not invent approval, evidence, or customer confirmation. Summarize in Thai.`,
        });
        mergedMarkdown = merged.markdown;
        mergeSummary = `AI ช่วยอัปเดตสำเร็จด้วย ${merged.provider || 'provider'} ${merged.model || ''}`.trim();
      } catch (error) {
        mergedMarkdown = mergeDocumentDeterministically(existingMarkdown, guidedConflict.newContent, `${guidedConflict.documentKind} update`);
        mergeSummary = `AI ใช้ไม่ได้ จึงรวมข้อมูลแบบปลอดภัยแทน: ${error}`;
      }

      await updateFileContent(guidedConflict.existingPath, mergedMarkdown);
      setGuidedNotice(mergeSummary);
      setGuidedConflict(null);
      await openAndRefresh(guidedConflict.existingPath);
    } catch (err) {
      setGuidedNotice(`จัดการเอกสารเดิมไม่สำเร็จ: ${err}`);
    } finally {
      setGuidedBusy(false);
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
      <div className="page-title-group min-w-0 flex-1 break-words">
        <h1 className="page-title min-w-0 flex-1 break-words">
          <Briefcase className="w-7 h-7 text-primary shrink-0" />
          <span className="page-title-text truncate">{projectName}</span>
        </h1>
        <p className="page-subtitle break-words">{t('guided.description')}</p>
      </div>
      <div className="page-actions shrink-0">
        {handleStartDiscovery && (
          <button onClick={handleStartDiscovery} className="btn btn-primary">
            <Search className="w-4 h-4" /> {t('common.startFromCustomerRequest')}
          </button>
        )}
        <button onClick={() => onCreateDocument(clientId, projectId, projectPath)} className="btn btn-outline">
          <Plus className="w-4 h-4" /> {t('common.createDocument')}
        </button>
        <button onClick={loadDocuments} disabled={loading} className="btn btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>
    </div>
  );

  return (
    <PageShell header={Header}>
      <GuidedOperatingModePanel
        state={gateGuidedState}
        aiEnabled={aiEnabled}
        onPrimaryAction={() => executeGuidedAction(readinessGate.primaryAction)}
        onSecondaryAction={executeGuidedAction}
        onOpenDocument={onOpenDocument}
      />

      <ProjectReadinessGatePanel
        gate={readinessGate}
        onPrimaryAction={() => executeGuidedAction(readinessGate.primaryAction)}
        onOpenDocument={onOpenDocument}
      />

      {/* Replaced heavy intake panels with Scope Workshop Entry Card */}
      <section className="mt-5 rounded-3xl border border-primary/20 bg-surface-2/80 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary-light">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-text">ห้องทำ Scope (Scope Workshop)</h2>
            <p className="mt-1 text-sm text-text-muted">
              พื้นที่สำหรับจัดการและอนุมัติ Scope จากข้อความของลูกค้า
            </p>
          </div>
        </div>
        <button 
          type="button" 
          onClick={() => onOpenDocument(`__scope_workshop__:${projectPath}`)} 
          className="btn btn-primary"
        >
          เปิดห้องทำ Scope
        </button>
      </section>

      {isEmptyProject && (
        <section className="mt-5 rounded-3xl border border-primary/20 bg-surface/80 p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary-light">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-text">เริ่มจากข้อความลูกค้าเพียงอย่างเดียวก็พอ</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
            วางคำขอจากลูกค้า แล้ว ScopeFlow จะช่วยถามข้อมูลที่ขาด สร้าง Brief และพาไปต่อเป็น Scope โดยไม่ต้องจำว่าเอกสารต้องอยู่ตรงไหน
          </p>
          {handleStartDiscovery && (
            <button type="button" onClick={handleStartDiscovery} className="btn btn-primary mt-5">
              {t('common.startFromCustomerRequest')}
            </button>
          )}
        </section>
      )}

      {guidedNotice && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary-light flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{guidedNotice}</span>
        </div>
      )}

      <details className="mt-6 rounded-2xl border border-border bg-surface-2 group">
        <summary className="p-4 font-semibold text-text cursor-pointer select-none outline-none group-focus-within:ring-2 group-focus-within:ring-primary rounded-2xl">
          {t('common.advancedDetails')} / ตรวจสุขภาพเอกสาร
        </summary>
        <div className="p-4 pt-0 border-t border-border mt-2 space-y-5">
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
        </div>
      </details>

      <details className="mt-4 mb-4 border border-border rounded-xl bg-surface-2 group">
        <summary className="p-4 font-semibold text-text cursor-pointer select-none outline-none group-focus-within:ring-2 group-focus-within:ring-primary rounded-xl">
          {t('common.allDocumentsDetailView')}
        </summary>
        <div className="p-4 pt-0 border-t border-border mt-2">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_168px_168px] gap-3 mb-4 mt-4">
            <div className="form-input-with-icon group">
              <Search className="form-input-leading-icon group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="ค้นหา Brief, Scope, ใบเสนอราคา, Approval, Change Request..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="form-input form-input-has-leading-icon"
              />
            </div>
            <SelectField
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'ทุกประเภท' },
                ...uniqueTypes.map(type => ({ value: type, label: type }))
              ]}
            />
            <SelectField
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'ทุกสถานะ' },
                ...uniqueStatuses.map(status => ({ value: status, label: status }))
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

      {guidedConflict && (
        <FriendlyDocumentConflictModal
          title="พบเอกสารเดิมอยู่แล้ว"
          description={guidedConflict.protectedUpdate ? 'เอกสารนี้ approved/locked แล้ว ระบบจะเสนอเป็นเวอร์ชันใหม่หรือ Change Request ไม่เขียนทับเดิมเงียบ ๆ' : t('conflict.existingDescription')}
          documentLabel={guidedConflict.documentKind}
          existingPath={guidedConflict.existingPath}
          aiEnabled={aiEnabled}
          busy={guidedBusy}
          onAction={runConflictAction}
          onClose={() => setGuidedConflict(null)}
        />
      )}

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
