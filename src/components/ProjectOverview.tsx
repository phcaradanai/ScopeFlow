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
import CustomerAnswerIntakePanel from './project/CustomerAnswerIntakePanel';
import DocumentCreationPreviewModal from './project/DocumentCreationPreviewModal';
import GuidedOperatingModePanel from './project/GuidedOperatingModePanel';
import BriefScopeQualityPanel from './project/BriefScopeQualityPanel';
import FriendlyDocumentConflictModal, { type FriendlyConflictAction } from './project/FriendlyDocumentConflictModal';
import { useLifecycleActionDispatcher } from '../hooks/useLifecycleActionDispatcher';
import type { CustomerAnswerWorkflowContext } from '../lib/ai/customer-answer/customerAnswerWorkflowContext';
import type { GuidedPrimaryAction } from '../lib/guided-operating-mode';
import { buildGuidedOperatingModeState } from '../lib/guided-operating-mode';
import { parseBriefToScope } from '../lib/brief-builder';
import { generateScopeMarkdown } from '../lib/scope-builder';
import { mergeDocumentDeterministically, mergeDocumentWithAi } from '../lib/ai/documentMergeAssistant';
import { getAiProviders } from '../lib/ai/providers/providerSettings';
import { analyzeBriefScopeQuality, buildScopeQualityImprovementDraft, type BriefScopeQualityAnalysis } from '../lib/ai/brief-scope-quality/briefScopeQualityAnalyzer';
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

  const [aiEnabled, setAiEnabled] = useState(false);
  const [guidedConflict, setGuidedConflict] = useState<GuidedConflictState | null>(null);
  const [guidedBusy, setGuidedBusy] = useState(false);
  const [guidedNotice, setGuidedNotice] = useState('');
  const [qualityAnalysis, setQualityAnalysis] = useState<BriefScopeQualityAnalysis | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityRefreshKey, setQualityRefreshKey] = useState(0);

  const scanFiles = documents.map(doc => ({
    path: doc.file_path,
    markdown: doc.markdown || '',
  }));

  const { clientId, projectId } = getProjectPathIds(projectPath);
  const guidedState = useMemo(() => buildGuidedOperatingModeState(documents), [documents]);
  const isEmptyProject = documents.length === 0;
  const qualityBrief = useMemo(() => documents.find(doc => doc.type === 'brief' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'brief'), [documents]);
  const qualityScope = useMemo(() => documents.find(doc => doc.type === 'scope' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'scope'), [documents]);

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

  useEffect(() => {
    let mounted = true;
    async function runQualityAnalysis() {
      setQualityLoading(true);
      const analysis = await analyzeBriefScopeQuality(workspacePath, {
        briefMarkdown: qualityBrief?.markdown || '',
        scopeMarkdown: qualityScope?.markdown || '',
        scopeStatus: qualityScope?.status,
        scopeLocked: qualityScope?.locked,
      });
      if (mounted) {
        setQualityAnalysis(analysis);
        setQualityLoading(false);
      }
    }
    runQualityAnalysis().catch(err => {
      console.warn('Brief/Scope quality analysis failed', err);
      if (mounted) setQualityLoading(false);
    });
    return () => { mounted = false; };
  }, [workspacePath, qualityBrief?.file_path, qualityBrief?.markdown, qualityScope?.file_path, qualityScope?.markdown, qualityScope?.status, qualityScope?.locked, qualityRefreshKey]);

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

  const handleCreateQualityFollowUp = (question: string) => {
    onCreateDocument(clientId, projectId, projectPath, 'followup', {
      source: 'recommended_next_action',
      initialType: 'followup',
      reason: `ข้อมูลที่ยังต้องถามลูกค้า: ${question}`,
      projectPath,
      recommendationWhy: question,
      prefillTitle: question.slice(0, 90),
    });
  };

  const handleUpdateScopeFromQuality = async (improvement: string) => {
    if (!qualityAnalysis) return;
    if (!qualityScope) {
      onCreateDocument(clientId, projectId, projectPath, 'scope', {
        source: 'recommended_next_action',
        initialType: 'scope',
        reason: 'ยังไม่มี Scope ที่ใช้ควบคุมงาน',
        projectPath,
        recommendationWhy: improvement,
      });
      return;
    }

    try {
      setGuidedNotice('');
      const scopeMarkdown = qualityScope.markdown || await readFileContent(qualityScope.file_path);
      const scopePaths = documents.filter(doc => doc.type === 'scope').map(doc => doc.file_path);
      const newVersionName = getNextScopeVersionFilename(scopePaths);
      const focusedAnalysis: BriefScopeQualityAnalysis = {
        ...qualityAnalysis,
        suggested_scope_improvements: [improvement],
      };
      const protectedUpdate = qualityAnalysis.guardrails.scope_update_mode === 'proposed_update_or_change_request';
      setGuidedConflict({
        existingPath: qualityScope.file_path,
        newVersionPath: joinPath(projectPath, 'baseline', newVersionName),
        newContent: `${scopeMarkdown}${buildScopeQualityImprovementDraft(focusedAnalysis)}`,
        documentKind: protectedUpdate ? 'Scope proposed quality update' : 'Scope quality update',
        protectedUpdate,
      });
      if (protectedUpdate) {
        setGuidedNotice('Scope นี้ approved/locked แล้ว ระบบจะเสนอเป็น proposed update หรือ Change Request เท่านั้น ไม่เขียนทับ Scope เดิมเงียบ ๆ');
      }
    } catch (err) {
      setGuidedNotice(`เตรียมคำแนะนำสำหรับ Scope ไม่สำเร็จ: ${err}`);
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
      setGuidedNotice('Scope นี้ approved/locked แล้ว จึงไม่สามารถเขียนทับเดิมได้ กรุณาเลือก “สร้างเวอร์ชันใหม่” หรือเปิดเดิมเพื่อสร้าง Change Request');
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
          instruction: 'Update the existing Scope while preserving approved or locked decisions. Do not invent approval, evidence, or customer confirmation. Summarize in Thai.',
        });
        mergedMarkdown = merged.markdown;
        mergeSummary = `AI ช่วยอัปเดตสำเร็จด้วย ${merged.provider || 'provider'} ${merged.model || ''}`.trim();
      } catch (error) {
        mergedMarkdown = mergeDocumentDeterministically(existingMarkdown, guidedConflict.newContent, 'Scope quality update');
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
      <div className="page-title-group">
        <h1 className="page-title">
          <Briefcase className="w-7 h-7 text-primary shrink-0" />
          <span className="page-title-text">{projectName}</span>
        </h1>
        <p className="page-subtitle">ศูนย์คุม Brief, Scope, Quote, Approval และ Change Request</p>
      </div>
      <div className="page-actions">
        {handleStartDiscovery && (
          <button onClick={handleStartDiscovery} className="btn btn-primary">
            <Search className="w-4 h-4" /> เริ่มจากคำขอลูกค้า
          </button>
        )}
        <button onClick={() => onCreateDocument(clientId, projectId, projectPath)} className="btn btn-outline">
          <Plus className="w-4 h-4" /> สร้างเอกสาร
        </button>
        <button onClick={loadDocuments} disabled={loading} className="btn btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>
    </div>
  );

  return (
    <PageShell header={Header}>
      <GuidedOperatingModePanel
        state={guidedState}
        aiEnabled={aiEnabled}
        onPrimaryAction={() => executeGuidedAction(guidedState.primaryAction)}
        onSecondaryAction={executeGuidedAction}
        onOpenDocument={onOpenDocument}
      />

      <BriefScopeQualityPanel
        analysis={qualityAnalysis}
        loading={qualityLoading}
        aiEnabled={aiEnabled}
        onRefresh={() => setQualityRefreshKey(key => key + 1)}
        onCreateFollowUp={handleCreateQualityFollowUp}
        onUpdateScope={handleUpdateScopeFromQuality}
      />

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
              เริ่มจากคำขอลูกค้า
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
          รายละเอียดขั้นสูง / ตรวจสุขภาพเอกสาร
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
          เอกสารทั้งหมด / Detail View
        </summary>
        <div className="p-4 pt-0 border-t border-border mt-2">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_168px_168px] gap-3 mb-4 mt-4">
            <div className="form-input-with-icon group">
              <Search className="form-input-leading-icon group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="ค้นหา Brief, Scope, Quote, Approval, Change Request..."
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

      {guidedConflict && (
        <FriendlyDocumentConflictModal
          title="พบ Scope เดิมอยู่แล้ว"
          description={guidedConflict.protectedUpdate ? 'Scope นี้ approved/locked แล้ว ระบบจะเสนอเป็นเวอร์ชันใหม่หรือ Change Request ไม่เขียนทับ Scope เดิมเงียบ ๆ' : 'เลือกวิธีไปต่อโดยไม่ต้องจัดการเอกสารเองหรือเจอข้อความผิดพลาดที่อ่านยาก'}
          documentLabel="Scope"
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
