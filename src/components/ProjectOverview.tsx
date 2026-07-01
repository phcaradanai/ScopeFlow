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
import FollowUpAnswerIntakePanel from './project/FollowUpAnswerIntakePanel';
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
import { buildFollowUpAnswerUpdateDraft, decideFollowUpAnswer, type FollowUpAnswerDecision } from '../lib/ai/follow-up/followUpAnswerDecision';
import { generateCRDocument, generateFollowUpDocument } from '../lib/templates';
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

function getDocumentFileName(doc: any) {
  return doc.file_name || doc.filename || getFileName(doc.file_path || doc.path || '');
}

function getNextNumberFromDocuments(documents: any[], prefix: string) {
  let maxNumber = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)-?`);
  documents.forEach(doc => {
    const match = getDocumentFileName(doc).match(pattern);
    if (!match?.[1]) return;
    const num = Number(match[1]);
    if (!Number.isNaN(num) && num > maxNumber) maxNumber = num;
  });
  return String(maxNumber + 1).padStart(3, '0');
}

async function getNextVersionPathFromExisting(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const dot = normalized.lastIndexOf('.');
  const base = dot > -1 ? normalized.slice(0, dot) : normalized;
  const ext = dot > -1 ? normalized.slice(dot) : '.md';
  for (let version = 2; version <= 20; version += 1) {
    const candidate = `${base}-v${version}${ext}`;
    if (!(await pathExists(candidate))) return candidate;
  }
  return `${base}-${Date.now()}${ext}`;
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

function referenceLine(label: string, doc?: any) {
  if (!doc) return `- ${label}: ยังไม่มี`;
  return `- ${label}: ${doc.title || getDocumentFileName(doc)}\n  - path: ${doc.file_path}`;
}

function buildQualityFollowUpMarkdown(args: {
  baseMarkdown: string;
  question: string;
  projectName: string;
  brief?: any;
  scope?: any;
}) {
  return `${args.baseMarkdown}

## ที่มา

- มาจาก: Brief/Scope quality analyzer
- โครงการ: ${args.projectName}

## คำถามที่ต้องถามลูกค้า

- [ ] ${args.question}

## Reference กลับไปยัง Brief/Scope

${referenceLine('Brief', args.brief)}
${referenceLine('Scope', args.scope)}

## วิธีนำคำตอบกลับมาใช้

เมื่อลูกค้าตอบกลับ ให้นำคำตอบมาวางในส่วน “ข้อมูลที่ลูกค้าตอบกลับ” ใน Project Command Center เพื่อให้ ScopeFlow วิเคราะห์ว่าควรอัปเดต Brief, Scope, เปิด Change Request, ถามต่อ หรือไม่ต้องทำอะไร
`;
}

function buildChangeRequestFromFollowUp(args: {
  baseMarkdown: string;
  decision: FollowUpAnswerDecision;
  brief?: any;
  scope?: any;
}) {
  const changed = args.decision.changed_items.length > 0
    ? args.decision.changed_items.map(item => `- ${item}`).join('\n')
    : '- ดูรายละเอียดจากคำตอบลูกค้า';
  return `${args.baseMarkdown}

## ที่มา

- มาจาก: คำตอบลูกค้าจาก Follow-up
- เหตุผลที่แนะนำ: ${args.decision.guardrails.reason}

## Reference กลับไปยัง Brief/Scope

${referenceLine('Brief', args.brief)}
${referenceLine('Scope', args.scope)}

## คำตอบนี้กระทบ Brief/Scope อย่างไร

${args.decision.impact_summary}

## สิ่งที่เปลี่ยนหรือได้คำตอบเพิ่ม

${changed}

## ข้อเสนอสำหรับ Change Request

${args.decision.suggested_update || args.decision.summary}
`;
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
  const [followUpDecision, setFollowUpDecision] = useState<FollowUpAnswerDecision | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

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

  const createQualityFollowUpDocument = async (question: string) => {
    const number = getNextNumberFromDocuments(documents, 'FW');
    const filename = `FW-${number}-quality-question.md`;
    const path = joinPath(projectPath, 'support-requests', filename);
    const baseMarkdown = generateFollowUpDocument({ project: projectId, client: clientId, author: '', followUpNumber: `FW-${number}`, title: question.slice(0, 90) });
    const content = buildQualityFollowUpMarkdown({ baseMarkdown, question, projectName, brief: qualityBrief, scope: qualityScope });
    if (await pathExists(path)) {
      const versionPath = await getNextVersionPathFromExisting(path);
      await createDocument(versionPath, content);
      await openAndRefresh(versionPath);
      return;
    }
    await createDocument(path, content);
    await openAndRefresh(path);
  };

  const handleCreateQualityFollowUp = async (question: string) => {
    try {
      setGuidedBusy(true);
      setGuidedNotice('');
      await createQualityFollowUpDocument(question);
    } catch (err) {
      setGuidedNotice(`สร้าง Follow-up จากคำถามนี้ไม่สำเร็จ: ${err}`);
    } finally {
      setGuidedBusy(false);
    }
  };

  const handleAnalyzeFollowUpAnswer = async (answer: string) => {
    try {
      setFollowUpLoading(true);
      const decision = await decideFollowUpAnswer(workspacePath, {
        answer,
        briefMarkdown: qualityBrief?.markdown || '',
        scopeMarkdown: qualityScope?.markdown || '',
        scopeStatus: qualityScope?.status,
        scopeLocked: qualityScope?.locked,
      });
      setFollowUpDecision(decision);
    } catch (err) {
      setGuidedNotice(`วิเคราะห์คำตอบลูกค้าไม่สำเร็จ: ${err}`);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleUpdateBriefFromFollowUp = async (decision: FollowUpAnswerDecision) => {
    if (!qualityBrief) {
      handleStartDiscovery?.();
      return;
    }
    try {
      const existing = qualityBrief.markdown || await readFileContent(qualityBrief.file_path);
      const protectedUpdate = Boolean(qualityBrief.locked || ['approved', 'locked', 'signed_off'].includes((qualityBrief.status || '').toLowerCase()));
      setGuidedConflict({
        existingPath: qualityBrief.file_path,
        newVersionPath: await getNextVersionPathFromExisting(qualityBrief.file_path),
        newContent: `${existing}${buildFollowUpAnswerUpdateDraft(decision, 'Brief')}`,
        documentKind: 'Brief follow-up update',
        protectedUpdate,
      });
      if (protectedUpdate) setGuidedNotice('Brief นี้ approved/locked แล้ว ระบบจะเสนอเป็นเวอร์ชันใหม่ ไม่เขียนทับเดิมเงียบ ๆ');
    } catch (err) {
      setGuidedNotice(`เตรียมอัปเดต Brief ไม่สำเร็จ: ${err}`);
    }
  };

  const handleCreateChangeRequestFromFollowUp = async (decision: FollowUpAnswerDecision) => {
    try {
      setGuidedBusy(true);
      const number = getNextNumberFromDocuments(documents, 'CR');
      const filename = `CR-${number}-follow-up-answer.md`;
      const path = joinPath(projectPath, 'change-requests', filename);
      const baseMarkdown = generateCRDocument({ project: projectId, client: clientId, author: '', crNumber: `CR-${number}`, title: decision.summary.slice(0, 90) });
      const content = buildChangeRequestFromFollowUp({ baseMarkdown, decision, brief: qualityBrief, scope: qualityScope });
      await createDocument(path, content);
      await openAndRefresh(path);
    } catch (err) {
      setGuidedNotice(`สร้าง Change Request ไม่สำเร็จ: ${err}`);
    } finally {
      setGuidedBusy(false);
    }
  };

  const handleUpdateScopeFromFollowUp = async (decision: FollowUpAnswerDecision) => {
    if (decision.guardrails.should_create_change_request) {
      await handleCreateChangeRequestFromFollowUp(decision);
      return;
    }
    if (!qualityScope) {
      onCreateDocument(clientId, projectId, projectPath, 'scope', {
        source: 'recommended_next_action',
        initialType: 'scope',
        reason: 'ยังไม่มี Scope ที่ใช้ควบคุมงาน',
        projectPath,
        recommendationWhy: decision.suggested_update || decision.summary,
      });
      return;
    }
    try {
      const existing = qualityScope.markdown || await readFileContent(qualityScope.file_path);
      const protectedUpdate = Boolean(qualityScope.locked || ['approved', 'locked', 'signed_off'].includes((qualityScope.status || '').toLowerCase()));
      setGuidedConflict({
        existingPath: qualityScope.file_path,
        newVersionPath: await getNextVersionPathFromExisting(qualityScope.file_path),
        newContent: `${existing}${buildFollowUpAnswerUpdateDraft(decision, 'Scope')}`,
        documentKind: protectedUpdate ? 'Scope proposed follow-up update' : 'Scope follow-up update',
        protectedUpdate,
      });
      if (protectedUpdate) setGuidedNotice('Scope นี้ approved/locked แล้ว ระบบจะเสนอเป็นเวอร์ชันใหม่หรือ Change Request ไม่เขียนทับ Scope เดิมเงียบ ๆ');
    } catch (err) {
      setGuidedNotice(`เตรียมอัปเดต Scope ไม่สำเร็จ: ${err}`);
    }
  };

  const handleAskMoreFromFollowUp = async (decision: FollowUpAnswerDecision) => {
    const question = decision.follow_up_questions[0] || decision.summary;
    await handleCreateQualityFollowUp(question);
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
      <div className="page-title-group">
        <h1 className="page-title">
          <Briefcase className="w-7 h-7 text-primary shrink-0" />
          <span className="page-title-text">{projectName}</span>
        </h1>
        <p className="page-subtitle">{t('guided.description')}</p>
      </div>
      <div className="page-actions">
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

      <FollowUpAnswerIntakePanel
        decision={followUpDecision}
        loading={followUpLoading}
        onAnalyze={handleAnalyzeFollowUpAnswer}
        onUpdateBrief={handleUpdateBriefFromFollowUp}
        onUpdateScope={handleUpdateScopeFromFollowUp}
        onCreateChangeRequest={handleCreateChangeRequestFromFollowUp}
        onAskMoreQuestions={handleAskMoreFromFollowUp}
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
