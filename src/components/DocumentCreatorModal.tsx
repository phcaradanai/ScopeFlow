import { useEffect, useState } from 'react';
import { CheckSquare, Code, FileText, FileWarning, GitPullRequest, LifeBuoy, MessageCircle, Receipt, Target, Wrench, X } from 'lucide-react';
import { useWorkspace } from '../lib/workspace-context';
import { createDocument, listProjectDocuments, pathExists, readFileContent, updateFileContent } from '../lib/tauri-commands';
import { getNextDocumentNumber } from '../lib/document-utils';
import { buildCustomerAnswerContextMarkdown, generateAcceptanceChecklist, generateCRDocument, generateDCRDocument, generateFollowUpDocument, generateInvoiceDocument, generateQuotationDocument, generateRevisionReviewDocument, generateScopeDocument, generateSupportRequestDocument } from '../lib/templates';
import { nameToSlug, validateSlug } from '../lib/validation';
import { mergeDocumentDeterministically, mergeDocumentWithAi } from '../lib/ai/documentMergeAssistant';
import { getAiProviders } from '../lib/ai/providers/providerSettings';
import FriendlyDocumentConflictModal, { type FriendlyConflictAction } from './project/FriendlyDocumentConflictModal';
import SelectField from './ui/SelectField';

const DOCS = [
  ['scope', 'ขอบเขตงาน (Scope)', 'Brief → Scope ที่ควบคุมขอบเขตได้', Target, 'text-blue-500', 'bg-blue-500/10', 'ring-blue-500/50'],
  ['quotation', 'ใบเสนอราคา (Quotation)', 'Quote สำหรับเสนอราคา', Receipt, 'text-emerald-500', 'bg-emerald-500/10', 'ring-emerald-500/50'],
  ['invoice', 'ใบแจ้งหนี้ (Invoice)', 'Invoice สำหรับเก็บเงิน', FileText, 'text-indigo-500', 'bg-indigo-500/10', 'ring-indigo-500/50'],
  ['cr', 'คำขอเปลี่ยนแปลง (CR)', 'Change Request สำหรับขอบเขตใหม่', GitPullRequest, 'text-amber-500', 'bg-amber-500/10', 'ring-amber-500/50'],
  ['dcr', 'คำขอเปลี่ยนแปลงการพัฒนา (DCR)', 'Change Request เชิงเทคนิค', Code, 'text-purple-500', 'bg-purple-500/10', 'ring-purple-500/50'],
  ['sup', 'แจ้งปัญหา (Support Request)', 'Support Request', LifeBuoy, 'text-rose-500', 'bg-rose-500/10', 'ring-rose-500/50'],
  ['ma', 'แจ้งซ่อมบำรุง (MA Request)', 'Maintenance Request', Wrench, 'text-orange-500', 'bg-orange-500/10', 'ring-orange-500/50'],
  ['acceptance', 'รายการตรวจรับ (Acceptance)', 'Acceptance สำหรับส่งมอบ', CheckSquare, 'text-teal-500', 'bg-teal-500/10', 'ring-teal-500/50'],
  ['revision', 'ทบทวนการแก้ไข (Revision)', 'ทบทวนเมื่อไม่ผ่าน Acceptance', FileWarning, 'text-red-500', 'bg-red-500/10', 'ring-red-500/50'],
  ['followup', 'ขอความชัดเจน (Follow-up)', 'ถามข้อมูลที่ยังขาด', MessageCircle, 'text-sky-500', 'bg-sky-500/10', 'ring-sky-500/50'],
] as const;
const LABEL: Record<string, string> = { scope: 'Scope', quotation: 'Quote', invoice: 'Invoice', cr: 'Change Request', dcr: 'Change Request', sup: 'Support Request', ma: 'Support Request', acceptance: 'Acceptance', revision: 'Acceptance Review', followup: 'Follow-up' };

export interface LifecycleActionContext { source: 'recommended_next_action' | 'customer_answer'; initialType: string; reason: string; projectPath: string; recommendationWhy?: string; createdAt?: number; createdFilePath?: string; customerAnswerContext?: any; }
interface DocumentCreatorModalProps { clientId: string; projectId: string; projectPath: string; onClose: () => void; initialType?: string; lifecycleContext?: LifecycleActionContext; onDocumentCreated?: (context: LifecycleActionContext) => void; }
interface ConflictInfo { path: string; name: string; content: string; documentType: string; }

const friendlyError = 'ยังทำรายการนี้ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์การแก้ไขเอกสารหรือการตั้งค่า Workspace แล้วลองอีกครั้ง';
const requiresDocSlug = (t: string) => ['cr', 'dcr', 'sup', 'ma', 'revision', 'followup'].includes(t);
const docLabel = (t: string) => LABEL[t] || 'Document';
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
  const [type, setType] = useState(initialType || 'scope');
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
  const requiresSlug = requiresDocSlug(type);

  const refreshAiState = async () => {
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
  };

  useEffect(() => { if (workspacePath) listProjectDocuments(workspacePath, clientId, projectId).then(setDocuments).catch(console.error); }, [workspacePath, clientId, projectId]);
  useEffect(() => { refreshAiState(); }, [workspacePath]);
  useEffect(() => { if (title && requiresSlug) { const generated = nameToSlug(title); if (generated) setSlug(generated); } }, [title, requiresSlug]);

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
    let filename = '';
    let path = '';
    let content = '';
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
    if (requiresSlug && !slug) { setError('กรุณาระบุรหัสอ้างอิงภาษาอังกฤษสำหรับเอกสารนี้'); return; }
    if (requiresSlug && !validateSlug(slug)) { setError('รหัสอ้างอิงใช้ได้เฉพาะ a-z, 0-9 และ - เท่านั้น'); return; }
    try {
      const useAi = await refreshAiState();
      setSaving(true);
      setSavingStatus(useAi ? 'กำลังให้ AI วิเคราะห์ข้อมูล...' : 'กำลังสร้างเอกสารจากเทมเพลต...');
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

  if (conflictInfo) return <FriendlyDocumentConflictModal title={`พบ ${docLabel(conflictInfo.documentType)} เดิมอยู่แล้ว`} description="เลือกวิธีไปต่อโดย ScopeFlow จะจัดการให้และเปิดเอกสารผลลัพธ์ทันทีหลังทำงานเสร็จ" documentLabel={docLabel(conflictInfo.documentType)} existingPath={conflictInfo.path} aiEnabled={aiEnabled} busy={saving} error={error} onAction={handleConflictAction} onClose={() => { if (!saving) setConflictInfo(null); }} />;

  return (
    <div className="modal-overlay"><div className="modal-container">
      <div className="modal-header"><div className="modal-header-content"><h2 className="modal-title">สร้างเอกสารใหม่</h2><p className="modal-subtitle">สร้าง Brief, Scope, Quote, Approval, Change Request หรือ Acceptance ในโครงการ <span className="font-semibold text-text">{projectId}</span></p></div><button onClick={onClose} className="modal-close"><X className="w-5 h-5" /></button></div>
      <form id="document-creator-form" onSubmit={handleSubmit} className="modal-body">
        {error && <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">{error}</div>}
        <div className="form-section !bg-transparent !border-transparent !p-0"><label className="form-label mb-2 block">ประเภทเอกสาร <span className="text-error">*</span></label><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
          {DOCS.map(([value, label, description, Icon, color, bg, ring]) => {
            const selected = type === value;
            return <button key={value} type="button" onClick={() => setType(value)} className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${selected ? `${bg} border-transparent ring-2 ring-offset-2 ring-offset-surface ${ring}` : 'bg-surface-2 border-border hover:border-text-dim hover:bg-surface-3'}`}><div className={`p-2 rounded-lg w-fit transition-colors duration-200 ${selected ? `${color} bg-surface` : `${bg} ${color}`}`}><Icon className="w-5 h-5" /></div><div><div className="font-semibold text-sm mb-1 text-text">{label}</div><div className="text-xs text-text-muted line-clamp-2 leading-relaxed">{description}</div></div></button>;
          })}
        </div></div>
        {requiresSlug && <div className="form-section"><div className="form-field"><label className="form-label">ชื่อเอกสาร / หัวข้อ <span className="text-error">*</span></label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น เพิ่มระบบรายงานยอดขาย" className="form-input" autoFocus={!title} /></div><div className="form-field"><label className="form-label">รหัสอ้างอิงภาษาอังกฤษ <span className="text-error">*</span></label><input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="เช่น add-sales-report" className="form-input font-mono" />{!slug && title && <p className="form-helper text-error">กรุณากรอกรหัสภาษาอังกฤษ เช่น add-sales-report</p>}{slug && <p className="form-helper">รหัสเอกสาร: <span className="font-mono text-text-muted">{type.toUpperCase()}-XXX-{slug}</span></p>}</div></div>}
        {type === 'dcr' && <div className="form-section"><div className="form-field"><label className="form-label">ประเภทการเปลี่ยนแปลง <span className="text-error">*</span></label><SelectField value={changeKind} onChange={setChangeKind} options={[{ value: 'behavior', label: 'การทำงาน (Behavior / Logic)' }, { value: 'ui', label: 'หน้าจอ (UI / UX)' }, { value: 'database', label: 'ฐานข้อมูล (Database / Schema)' }, { value: 'report', label: 'รายงาน (Report / Dashboard)' }, { value: 'permission', label: 'สิทธิ์การใช้งาน (Permission / Role)' }, { value: 'integration', label: 'ระบบเชื่อมต่อ (Integration / API)' }, { value: 'technical-design', label: 'สถาปัตยกรรม (Technical Design)' }, { value: 'other', label: 'อื่นๆ (Other)' }]} /></div></div>}
        {(type === 'sup' || type === 'ma') && <div className="form-section"><div className="form-field"><label className="form-label">หมวดหมู่ <span className="text-error">*</span></label><SelectField value={category} onChange={setCategory} options={[{ value: 'bug', label: 'บั๊ก (Bug)' }, { value: 'feature-request', label: 'ขอเพิ่มฟีเจอร์ (Feature Request)' }, { value: 'update', label: 'อัปเดตข้อมูล (Update)' }, { value: 'maintenance', label: 'บำรุงรักษา (Maintenance)' }, { value: 'security', label: 'ความปลอดภัย (Security)' }, { value: 'other', label: 'อื่นๆ (Other)' }]} /></div></div>}
      </form>
      <div className="modal-footer"><button type="button" onClick={onClose} className="btn btn-ghost">ยกเลิก</button><button type="submit" form="document-creator-form" disabled={saving} className="btn btn-primary">{saving ? savingStatus : 'สร้างเอกสาร'}</button></div>
    </div></div>
  );
}
