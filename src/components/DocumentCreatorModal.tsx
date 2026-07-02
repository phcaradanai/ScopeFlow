import { useCallback, useEffect, useState } from 'react';
import { CheckSquare, Code, FileText, FileWarning, GitPullRequest, LifeBuoy, MessageCircle, Receipt, Target, Wrench, X } from 'lucide-react';
import { useWorkspace } from '../lib/workspace-context';
import { createDocument, listProjectDocuments, pathExists, readFileContent, updateFileContent } from '../lib/tauri-commands';
import { getNextDocumentNumber } from '../lib/document-utils';
import { buildCustomerAnswerContextMarkdown, generateAcceptanceChecklist, generateCRDocument, generateDCRDocument, generateFollowUpDocument, generateInvoiceDocument, generateQuotationDocument, generateRevisionReviewDocument, generateScopeDocument, generateSupportRequestDocument } from '../lib/templates';
import { nameToSlug, validateSlug } from '../lib/validation';
import { mergeDocumentDeterministically, mergeDocumentWithAi } from '../lib/ai/documentMergeAssistant';
import { getAiProviders } from '../lib/ai/providers/providerSettings';
import { DOCUMENT_CREATION_INTENTS, getDocumentCreationCta, getDocumentCreationIntentForType, getDocumentCreationRecommendationReason, getDocumentCreationResult, getDocumentCreationTitleMissingMessage, getDocumentCreationTitlePrompt, requiresDocumentCreationTitle } from '../lib/document-creation-guidance';
import { t } from '../lib/i18n/copy';
import FriendlyDocumentConflictModal, { type FriendlyConflictAction } from './project/FriendlyDocumentConflictModal';
import SelectField from './ui/SelectField';

const DOCS = [
  ['scope', 'ขอบเขตงาน (Scope)', 'Brief → Scope ที่ควบคุมขอบเขตได้', Target, 'text-blue-500', 'bg-blue-500/10', 'ring-blue-500/50'],
  ['quotation', 'ใบเสนอราคา', 'ใบเสนอราคาสำหรับส่งให้ลูกค้าอนุมัติ', Receipt, 'text-emerald-500', 'bg-emerald-500/10', 'ring-emerald-500/50'],
  ['invoice', 'ใบแจ้งหนี้', 'Invoice สำหรับเก็บเงิน', FileText, 'text-indigo-500', 'bg-indigo-500/10', 'ring-indigo-500/50'],
  ['cr', 'คำขอเปลี่ยนงาน', 'Change Request สำหรับขอบเขตใหม่', GitPullRequest, 'text-amber-500', 'bg-amber-500/10', 'ring-amber-500/50'],
  ['dcr', 'คำขอเปลี่ยนงานด้านพัฒนา', 'Change Request เชิงเทคนิค', Code, 'text-purple-500', 'bg-purple-500/10', 'ring-purple-500/50'],
  ['sup', 'แจ้งปัญหา / Support', 'Support Request', LifeBuoy, 'text-rose-500', 'bg-rose-500/10', 'ring-rose-500/50'],
  ['ma', 'แจ้งซ่อมบำรุง', 'Maintenance Request', Wrench, 'text-orange-500', 'bg-orange-500/10', 'ring-orange-500/50'],
  ['acceptance', 'รายการส่งมอบ/ตรวจรับ', 'Acceptance สำหรับส่งมอบ', CheckSquare, 'text-teal-500', 'bg-teal-500/10', 'ring-teal-500/50'],
  ['revision', 'ทบทวนการแก้ไข', 'ทบทวนเมื่อไม่ผ่าน Acceptance', FileWarning, 'text-red-500', 'bg-red-500/10', 'ring-red-500/50'],
  ['followup', 'ขอข้อมูลเพิ่ม', 'ถามข้อมูลที่ยังขาด', MessageCircle, 'text-sky-500', 'bg-sky-500/10', 'ring-sky-500/50'],
] as const;
const LABEL: Record<string, string> = { scope: 'Scope', quotation: 'ใบเสนอราคา', invoice: 'Invoice', cr: 'Change Request', dcr: 'Change Request', sup: 'Support Request', ma: 'Support Request', acceptance: 'Acceptance', revision: 'Acceptance Review', followup: 'Follow-up' };

export interface LifecycleActionContext { source: 'recommended_next_action' | 'customer_answer'; initialType: string; reason: string; projectPath: string; recommendationWhy?: string; createdAt?: number; createdFilePath?: string; customerAnswerContext?: any; }
interface DocumentCreatorModalProps { clientId: string; projectId: string; projectPath: string; onClose: () => void; initialType?: string; lifecycleContext?: LifecycleActionContext; onDocumentCreated?: (context: LifecycleActionContext) => void; }
interface ConflictInfo { path: string; name: string; content: string; documentType: string; }

const friendlyError = 'ยังทำรายการนี้ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์การแก้ไขเอกสารหรือการตั้งค่า Workspace แล้วลองอีกครั้ง';
const docLabel = (documentType: string) => LABEL[documentType] || 'Document';
const canRun = (p: { enabled?: boolean; baseUrl?: string; model?: string }) => p.enabled !== false && Boolean(p.baseUrl?.trim()) && Boolean(p.model?.trim());
const versionStamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

async function nextVersionPath(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const dot = normalized.lastIndexOf('.');
  const base = dot > -1 ? normalized.slice(0, dot) : normalized;
  const ext = dot > -1 ? normalized.slice(dot) : '.md';
  for (let i = 2; i <= 20; i += 1) {
    const candidate = `${base}-v${i}${ext}`;
    if (!(await pathExists(candidate))) return candidate;
  }
  return `${base}-${versionStamp()}${ext}`;
}

export default function DocumentCreatorModal({ clientId, projectId, projectPath, onClose, initialType, lifecycleContext, onDocumentCreated }: DocumentCreatorModalProps) {
  const { workspacePath, refreshTree, setSelectedFile } = useWorkspace();
  const initialDocumentType = lifecycleContext?.initialType || initialType || 'scope';
  const [type, setType] = useState(initialDocumentType);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [changeKind, setChangeKind] = useState('behavior');
  const [category, setCategory] = useState('bug');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(() => Boolean(initialDocumentType && !getDocumentCreationIntentForType(initialDocumentType)));
  const requiresTitle = requiresDocumentCreationTitle(type);
  const selectedIntent = getDocumentCreationIntentForType(type);
  const selectedDoc = DOCS.find(([value]) => value === type);
  const ctaLabel = getDocumentCreationCta(type);
  const resultDescription = getDocumentCreationResult(type);
  const topicPrompt = getDocumentCreationTitlePrompt(type);
  const recommendationReason = getDocumentCreationRecommendationReason(type, lifecycleContext?.recommendationWhy || lifecycleContext?.reason);
  const hasSystemRecommendation = Boolean(lifecycleContext || initialType);
  const primaryTitle = selectedIntent?.title || selectedDoc?.[1] || docLabel(type);
  const primaryDescription = selectedIntent?.description || selectedDoc?.[2] || resultDescription;
  const primaryBadge = selectedIntent?.badge || t('advanced.manual');

  const refreshAiState = useCallback(async () => {
    if (!workspacePath) { setAiEnabled(false); return false; }
    try {
      const settings = await getAiProviders(workspacePath);
      const ok = Boolean(settings.enabled && settings.providers.some(canRun));
      setAiEnabled(ok);
      return ok;
    } catch (err) {
      console.warn('Could not load AI provider settings', err);
      setAiEnabled(false);
      return false;
    }
  }, [workspacePath]);

  useEffect(() => { if (workspacePath) listProjectDocuments(workspacePath, clientId, projectId).then(setDocuments).catch(console.error); }, [workspacePath, clientId, projectId]);
  useEffect(() => { refreshAiState(); }, [refreshAiState]);
  useEffect(() => { if (title && requiresTitle) { const generated = nameToSlug(title); if (generated) setSlug(generated); } }, [title, requiresTitle]);

  const complete = async (path: string) => {
    await refreshTree();
    setSelectedFile(path);
    if (lifecycleContext && onDocumentCreated) onDocumentCreated({ ...lifecycleContext, createdAt: Date.now(), createdFilePath: path });
    setConflictInfo(null);
    setSaving(false);
    setSavingStatus('');
    onClose();
  };

  const handleConflictAction = async (action: FriendlyConflictAction) => {
    if (!conflictInfo) return;
    setError('');
    if (action === 'open') { setSelectedFile(conflictInfo.path); setConflictInfo(null); onClose(); return; }
    if (action === 'replace' && !window.confirm('ยืนยันแทนที่เอกสารเดิม? ใช้เมื่อมั่นใจว่าไม่ต้องเก็บฉบับเดิมแล้ว')) return;
    try {
      setSaving(true);
      if (action === 'version') { setSavingStatus('กำลังสร้างเวอร์ชันใหม่...'); const path = await nextVersionPath(conflictInfo.path); await createDocument(path, conflictInfo.content); await complete(path); return; }
      if (action === 'update' || action === 'replace') { setSavingStatus(action === 'replace' ? 'กำลังแทนที่เอกสารเดิม...' : 'กำลังอัปเดตเอกสารเดิม...'); await updateFileContent(conflictInfo.path, conflictInfo.content); await complete(conflictInfo.path); return; }
      setSavingStatus(aiEnabled ? 'กำลังให้ AI ช่วยอัปเดตเอกสารเดิม...' : 'กำลังรวมข้อมูลแบบปลอดภัย...');
      const existingMarkdown = await readFileContent(conflictInfo.path);
      const label = docLabel(conflictInfo.documentType);
      let merged = '';
      try {
        if (!workspacePath) throw new Error('Workspace path is required for AI merge');
        const result = await mergeDocumentWithAi(workspacePath, { existingMarkdown, newDraftMarkdown: conflictInfo.content, documentKind: label, instruction: `Update the existing ${label} with the new draft. Preserve approvals, locked decisions, acceptance status, evidence, customer-confirmed items, and audit notes. Summarize in Thai.` });
        merged = result.markdown;
      } catch (mergeErr) {
        console.warn('AI merge unavailable, falling back to deterministic merge', mergeErr);
        merged = mergeDocumentDeterministically(existingMarkdown, conflictInfo.content, `${label} update from ScopeFlow`);
      }
      await updateFileContent(conflictInfo.path, merged);
      await complete(conflictInfo.path);
    } catch (err) {
      console.error('Document conflict action failed', err);
      setError(friendlyError);
    } finally { setSaving(false); setSavingStatus(''); }
  };

  const buildScope = async (filename: string, useAi: boolean) => {
    const briefDoc = documents.find(doc => doc.type === 'brief');
    const briefContent = briefDoc ? await readFileContent(briefDoc.path) : '';
    if (useAi && briefContent) {
      try {
        const { generateJsonWithTrace } = await import('../lib/ai/providers/aiProviderRouter');
        const response = await generateJsonWithTrace(workspacePath!, `Extract ScopeFormData for ScopeFlow from the following Brief. Return ONLY valid JSON with title, project_overview, included_items, excluded_items, deliverables, acceptance_criteria, assumptions.\n\nBrief Content:\n${briefContent}`);
        const data = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
        const { generateScopeMarkdown } = await import('../lib/scope-builder');
        return `---\nai_generated: true\n---\n> **AI Generated Document:** เอกสารนี้สร้างขึ้นโดย AI จากการวิเคราะห์ Brief\n\n${generateScopeMarkdown(data, filename.replace('.md', ''))}`;
      } catch (err) { console.warn('AI Scope generation unavailable, using deterministic Scope builder', err); }
    }
    if (briefContent) {
      const { parseBriefToScope } = await import('../lib/brief-builder');
      const { generateScopeMarkdown } = await import('../lib/scope-builder');
      return generateScopeMarkdown({ title: '', acceptance_criteria: '', ...parseBriefToScope(briefContent) } as any, filename.replace('.md', ''));
    }
    return generateScopeDocument({ project: projectId, client: clientId, author: '', projectName: projectId });
  };

  const buildDraft = async (useAi: boolean) => {
    const d = new Date().toISOString().split('T')[0].replace(/-/g, '');
    let filename: string;
    let path: string;
    let content: string;
    if (type === 'scope') { filename = 'scope-v1.0.md'; path = `${projectPath}/baseline/${filename}`; content = await buildScope(filename, useAi); }
    else if (type === 'quotation') { filename = 'quotation-v1.0.md'; path = `${projectPath}/baseline/${filename}`; content = generateQuotationDocument({ project: projectId, client: clientId, author: '' }); }
    else if (type === 'invoice') { filename = `invoice-${d}-${getNextDocumentNumber(documents, `invoice-${d}`)}.md`; path = `${projectPath}/invoices/${filename}`; content = generateInvoiceDocument({ project: projectId, client: clientId, author: '' }); }
    else if (type === 'cr') { const n = getNextDocumentNumber(documents, 'CR'); filename = `CR-${n}-${slug}.md`; path = `${projectPath}/change-requests/${filename}`; content = generateCRDocument({ project: projectId, client: clientId, author: '', crNumber: `CR-${n}`, title }); }
    else if (type === 'dcr') { const n = getNextDocumentNumber(documents, 'DCR'); filename = `DCR-${n}-${slug}.md`; path = `${projectPath}/change-requests/${filename}`; content = generateDCRDocument({ project: projectId, client: clientId, author: '', dcrNumber: `DCR-${n}`, changeKind, title }); }
    else if (type === 'sup' || type === 'ma') { const p = type === 'sup' ? 'SUP' : 'MA'; const n = getNextDocumentNumber(documents, p); filename = `${p}-${n}-${slug}.md`; path = `${projectPath}/support-requests/${filename}`; content = generateSupportRequestDocument({ type: type === 'sup' ? 'support-request' : 'ma-request', project: projectId, client: clientId, author: '', requestNumber: `${p}-${n}`, category, title }); }
    else if (type === 'acceptance') { filename = 'acceptance-checklist-v1.0.md'; path = `${projectPath}/acceptance/${filename}`; content = generateAcceptanceChecklist({ project: projectId, client: clientId, author: '' }); }
    else if (type === 'revision') { const n = getNextDocumentNumber(documents, 'REV'); filename = `REV-${n}-${slug}.md`; path = `${projectPath}/reviews/${filename}`; content = generateRevisionReviewDocument({ project: projectId, client: clientId, author: '', reviewNumber: `REV-${n}`, title }); }
    else { const n = getNextDocumentNumber(documents, 'FW'); filename = `FW-${n}-${slug}.md`; path = `${projectPath}/support-requests/${filename}`; content = generateFollowUpDocument({ project: projectId, client: clientId, author: '', followUpNumber: `FW-${n}`, title }); }
    if (lifecycleContext?.customerAnswerContext) content += buildCustomerAnswerContextMarkdown(lifecycleContext.customerAnswerContext);
    return { filename, path, content };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (requiresTitle && !title.trim()) { setError(getDocumentCreationTitleMissingMessage(type)); return; }
    if (requiresTitle && !slug.trim()) { setError('กรุณาใส่รหัสสั้นภาษาอังกฤษ เช่น add-sales-report เพื่อให้เปิดดูและตามงานนี้ต่อได้ง่าย'); return; }
    if (requiresTitle && !validateSlug(slug)) { setError('รหัสสั้นใช้ได้เฉพาะ a-z, 0-9 และ - เช่น add-sales-report'); return; }
    try {
      const useAi = await refreshAiState();
      setSaving(true);
      setSavingStatus(useAi ? 'กำลังให้ AI วิเคราะห์ข้อมูล...' : 'กำลังสร้างเอกสารจากแบบฟอร์มพื้นฐาน...');
      const draft = await buildDraft(useAi);
      if (await pathExists(draft.path)) { setConflictInfo({ path: draft.path, name: draft.filename, content: draft.content, documentType: type }); setSaving(false); setSavingStatus(''); return; }
      setSavingStatus('กำลังเปิดเอกสารผลลัพธ์...');
      await createDocument(draft.path, draft.content);
      await complete(draft.path);
    } catch (err) {
      console.error('Document creation failed', err);
      setError(friendlyError);
      setSaving(false);
      setSavingStatus('');
    }
  };

  if (conflictInfo) return <FriendlyDocumentConflictModal title={`พบ ${docLabel(conflictInfo.documentType)} เดิมอยู่แล้ว`} description={t('conflict.existingDescription')} documentLabel={docLabel(conflictInfo.documentType)} existingPath={conflictInfo.path} aiEnabled={aiEnabled} busy={saving} error={error} onAction={handleConflictAction} onClose={() => { if (!saving) setConflictInfo(null); }} />;

  return (
    <div className="modal-overlay"><div className="modal-container">
      <div className="modal-header shrink-0"><div className="modal-header-content min-w-0"><h2 className="modal-title break-words">{t('documentCreation.modalTitle')}</h2><p className="modal-subtitle break-words">{t('documentCreation.modalSubtitle')}</p></div><button onClick={onClose} className="modal-close shrink-0"><X className="w-5 h-5" /></button></div>
      <form id="document-creator-form" onSubmit={handleSubmit} className="modal-body pb-6 flex-1 overflow-y-auto min-w-0">
        {error && <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium break-words">{error}</div>}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 md:p-5 shadow-sm min-w-0 break-words">
          <div className="flex flex-wrap items-center gap-2 mb-3"><span className="badge bg-primary/15 text-primary-light border border-primary/25 text-[10px] break-words">{primaryBadge}</span>{hasSystemRecommendation && <span className="badge badge-muted text-[10px] break-words">{t('documentCreation.recommendedFromNextAction')}</span>}</div>
          <h3 className="text-lg font-bold text-text leading-snug break-words">{primaryTitle}</h3>
          <p className="mt-2 text-sm text-text-muted leading-relaxed break-words">{primaryDescription}</p>
          {hasSystemRecommendation && <div className="mt-4 rounded-xl border border-primary/20 bg-surface/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-primary-light break-words">{t('documentCreation.whyRecommended')}</p><p className="mt-1 text-xs text-text-muted leading-relaxed break-words">{recommendationReason}</p></div>}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"><div className="rounded-xl border border-border bg-surface/70 p-3 min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-success break-words">{t('documentCreation.outcome')}</p><p className="mt-1 text-xs text-text-muted leading-relaxed break-words">{resultDescription}</p></div><div className="rounded-xl border border-border bg-surface/70 p-3 min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-primary-light break-words">{t('documentCreation.nextStep')}</p><p className="mt-1 text-xs text-text-muted leading-relaxed break-words">{t('documentCreation.createAndOpen', undefined, { cta: ctaLabel })}</p></div></div>
        </div>
        <div className="form-section !bg-transparent !border-transparent !p-0">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2"><div><label className="form-label block">{t('documentCreation.chooseDifferentGoal')}</label><p className="text-xs text-text-muted mt-1">{t('documentCreation.shortcutsNotRequired')}</p></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DOCUMENT_CREATION_INTENTS.map(intent => {
              const selected = selectedIntent?.id === intent.id;
              return <button key={intent.id} type="button" onClick={() => { setType(intent.documentType); setError(''); }} className={`text-left rounded-xl border p-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface min-w-0 ${selected ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface-2 hover:border-primary/30 hover:bg-surface-3'}`}><div className="flex items-start justify-between gap-3 min-w-0"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-text break-words">{intent.title}</p><p className="mt-1 text-[11px] text-text-muted leading-relaxed break-words">{t('documentCreation.resultPrefix')}: {intent.compactResult}</p></div><span className={`badge text-[10px] shrink-0 break-words ${selected ? 'bg-primary/15 text-primary-light border border-primary/25' : 'badge-muted'}`}>{selected ? t('documentCreation.selected') : intent.badge}</span></div></button>;
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2/60 p-4 min-w-0"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="text-sm font-bold text-text break-words">{t('documentCreation.documentToCreate')}: {selectedDoc?.[1] || docLabel(type)}</p><p className="text-xs text-text-muted mt-1 leading-relaxed break-words">{t('documentCreation.manualHint')}</p></div><button type="button" onClick={() => setAdvancedOpen(open => !open)} className="btn btn-outline text-xs shrink-0 whitespace-nowrap">{advancedOpen ? t('documentCreation.hideManual') : t('documentCreation.showManual')}</button></div>{advancedOpen && <div className="mt-4 pt-4 border-t border-border"><p className="text-xs font-bold text-text mb-1 break-words">{t('advanced.manual')}</p><p className="text-xs text-text-muted mb-3 leading-relaxed break-words">{t('advanced.manualDescription')}</p><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {DOCS.map(([value, label, description, Icon, color, bg, ring]) => {
            const selected = type === value;
            return <button key={value} type="button" onClick={() => { setType(value); setError(''); }} className={`text-left p-3 rounded-xl border transition-all duration-200 flex gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface min-w-0 ${selected ? `${bg} border-transparent ring-2 ring-offset-2 ring-offset-surface ${ring}` : 'bg-surface border-border hover:border-text-dim hover:bg-surface-3'}`}><div className={`p-2 rounded-lg h-fit transition-colors duration-200 shrink-0 ${selected ? `${color} bg-surface` : `${bg} ${color}`}`}><Icon className="w-4 h-4" /></div><div className="min-w-0 flex-1"><div className="font-semibold text-xs mb-1 text-text break-words">{label}</div><div className="text-[10px] text-text-muted line-clamp-2 leading-relaxed break-words">{description}</div></div></button>;
          })}
        </div></div>}</div>
        {requiresTitle && <div className="form-section"><div className="rounded-xl border border-warning/20 bg-warning/10 p-3"><p className="text-xs font-bold text-warning">{t('documentCreation.topicRequired')}</p><p className="mt-1 text-xs text-text-muted leading-relaxed">{topicPrompt}</p></div><div className="form-field"><label className="form-label">{t('documentCreation.memorableTitle')} <span className="text-error">*</span></label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น เพิ่มระบบรายงานยอดขาย" className="form-input" autoFocus={!title} /></div><div className="form-field"><label className="form-label">{t('documentCreation.englishTrackingCode')} <span className="text-error">*</span></label><input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="เช่น add-sales-report" className="form-input font-mono" />{!slug && title && <p className="form-helper text-error">ชื่อหัวข้อนี้ยังสร้างรหัสภาษาอังกฤษไม่ได้ กรุณาใส่เอง เช่น add-sales-report</p>}{slug && <p className="form-helper">{t('documentCreation.trackingCodeHint')}: <span className="font-mono text-text-muted">{type.toUpperCase()}-XXX-{slug}</span></p>}</div></div>}
        {type === 'dcr' && <div className="form-section"><div className="form-field"><label className="form-label">ประเภทการเปลี่ยนแปลง <span className="text-error">*</span></label><SelectField value={changeKind} onChange={setChangeKind} options={[{ value: 'behavior', label: 'การทำงาน (Behavior / Logic)' }, { value: 'ui', label: 'หน้าจอ (UI / UX)' }, { value: 'database', label: 'ฐานข้อมูล (Database / Schema)' }, { value: 'report', label: 'รายงาน (Report / Dashboard)' }, { value: 'permission', label: 'สิทธิ์การใช้งาน (Permission / Role)' }, { value: 'integration', label: 'ระบบเชื่อมต่อ (Integration / API)' }, { value: 'technical-design', label: 'สถาปัตยกรรม (Technical Design)' }, { value: 'other', label: 'อื่นๆ (Other)' }]} /></div></div>}
        {(type === 'sup' || type === 'ma') && <div className="form-section"><div className="form-field"><label className="form-label">หมวดหมู่ <span className="text-error">*</span></label><SelectField value={category} onChange={setCategory} options={[{ value: 'bug', label: 'บั๊ก (Bug)' }, { value: 'feature-request', label: 'ขอเพิ่มฟีเจอร์ (Feature Request)' }, { value: 'update', label: 'อัปเดตข้อมูล (Update)' }, { value: 'maintenance', label: 'บำรุงรักษา (Maintenance)' }, { value: 'security', label: 'ความปลอดภัย (Security)' }, { value: 'other', label: 'อื่นๆ (Other)' }]} /></div></div>}
      </form>
      <div className="modal-footer shrink-0"><button type="button" onClick={onClose} className="btn btn-ghost whitespace-nowrap">{t('common.cancel')}</button><button type="submit" form="document-creator-form" disabled={saving} className="btn btn-primary whitespace-nowrap">{saving ? savingStatus : ctaLabel}</button></div>
    </div></div>
  );
}
