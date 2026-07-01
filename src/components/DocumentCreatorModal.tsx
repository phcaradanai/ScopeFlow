import { useState, useEffect } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { listProjectDocuments, createDocument, pathExists } from '../lib/tauri-commands';
import { getNextDocumentNumber } from '../lib/document-utils';
import {
  generateScopeDocument,
  generateQuotationDocument,
  generateCRDocument,
  generateDCRDocument,
  generateSupportRequestDocument,
  generateAcceptanceChecklist,
  generateInvoiceDocument,
  generateRevisionReviewDocument,
  generateFollowUpDocument,
  buildCustomerAnswerContextMarkdown
} from '../lib/templates';
import { validateSlug, nameToSlug } from '../lib/validation';
import { X, Target, Receipt, GitPullRequest, Code, LifeBuoy, Wrench, CheckSquare, FileText, MessageCircle, FileWarning, ExternalLink, Wand2, Copy, AlertTriangle } from 'lucide-react';
import SelectField from './ui/SelectField';

const DOCUMENT_TYPES = [
  {
    value: 'scope',
    label: 'ขอบเขตงาน (Scope)',
    description: 'เอกสารระบุขอบเขตความต้องการเบื้องต้น',
    icon: Target,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    ringClass: 'ring-blue-500/50',
  },
  {
    value: 'quotation',
    label: 'ใบเสนอราคา (Quotation)',
    description: 'เอกสารเสนอราคาสำหรับโครงการ',
    icon: Receipt,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    ringClass: 'ring-emerald-500/50',
  },
  {
    value: 'invoice',
    label: 'ใบแจ้งหนี้ (Invoice)',
    description: 'เอกสารแจ้งยอดชำระเงิน',
    icon: FileText,
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
    ringClass: 'ring-indigo-500/50',
  },
  {
    value: 'cr',
    label: 'คำขอเปลี่ยนแปลง (CR)',
    description: 'คำขอเปลี่ยนแปลงขอบเขตงานหรือฟีเจอร์ใหม่',
    icon: GitPullRequest,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    ringClass: 'ring-amber-500/50',
  },
  {
    value: 'dcr',
    label: 'คำขอเปลี่ยนแปลงการพัฒนา (DCR)',
    description: 'คำขอเปลี่ยนแปลงเชิงเทคนิคหรือการออกแบบ',
    icon: Code,
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    ringClass: 'ring-purple-500/50',
  },
  {
    value: 'sup',
    label: 'แจ้งปัญหา (Support Request)',
    description: 'แจ้งปัญหาการใช้งานหรือบั๊กของระบบ',
    icon: LifeBuoy,
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    ringClass: 'ring-rose-500/50',
  },
  {
    value: 'ma',
    label: 'แจ้งซ่อมบำรุง (MA Request)',
    description: 'แจ้งซ่อมบำรุงตามรอบ MA',
    icon: Wrench,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    ringClass: 'ring-orange-500/50',
  },
  {
    value: 'acceptance',
    label: 'รายการตรวจรับ (Acceptance Checklist)',
    description: 'รายการตรวจสอบสำหรับส่งมอบงาน',
    icon: CheckSquare,
    colorClass: 'text-teal-500',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    ringClass: 'ring-teal-500/50',
  },
  {
    value: 'revision',
    label: 'ทบทวนการแก้ไข (Revision Review)',
    description: 'ทบทวนสาเหตุและแนวทางเมื่อลูกค้าปฏิเสธงาน',
    icon: FileWarning,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    ringClass: 'ring-red-500/50',
  },
  {
    value: 'followup',
    label: 'ขอความชัดเจน (Follow-up)',
    description: 'ติดตามผลและขอความชัดเจนจากลูกค้า',
    icon: MessageCircle,
    colorClass: 'text-sky-500',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/30',
    ringClass: 'ring-sky-500/50',
  },
];

export interface LifecycleActionContext {
  source: 'recommended_next_action' | 'customer_answer';
  initialType: string;
  reason: string;
  projectPath: string;
  recommendationWhy?: string;
  createdAt?: number;
  createdFilePath?: string;
  customerAnswerContext?: any;
}

interface DocumentCreatorModalProps {
  clientId: string;
  projectId: string;
  projectPath: string;
  onClose: () => void;
  initialType?: string;
  lifecycleContext?: LifecycleActionContext;
  onDocumentCreated?: (context: LifecycleActionContext) => void;
}

export default function DocumentCreatorModal({
  clientId,
  projectId,
  projectPath,
  onClose,
  initialType,
  lifecycleContext,
  onDocumentCreated,
}: DocumentCreatorModalProps) {
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
  const [conflictInfo, setConflictInfo] = useState<{ path: string; name: string; content: string } | null>(null);

  useEffect(() => {
    if (workspacePath) {
      listProjectDocuments(workspacePath, clientId, projectId)
        .then(setDocuments)
        .catch(console.error);
    }
  }, [workspacePath, clientId, projectId]);

  const requiresSlug = ['cr', 'dcr', 'sup', 'ma', 'revision', 'followup'].includes(type);

  // Suggest a slug when title changes, if possible
  useEffect(() => {
    if (title && requiresSlug) {
      const generated = nameToSlug(title);
      if (generated) {
        setSlug(generated);
      }
    }
  }, [title, requiresSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (requiresSlug && !slug) {
      setError('กรุณาระบุ Slug สำหรับชื่อไฟล์');
      return;
    }

    if (requiresSlug && !validateSlug(slug)) {
      setError('Slug ไม่ถูกต้อง (ใช้ได้เฉพาะ a-z, 0-9, และ -)');
      return;
    }

    try {
      let filename = '';
      let finalPath = '';
      let finalContent = '';
      const finalProjectPath = projectPath;
      const finalProjectId = projectId;

      let useAi = false;
      try {
        if (workspacePath) {
          const { getAiSettings } = await import('../lib/settings');
          const aiSettings = await getAiSettings(workspacePath);
          useAi = aiSettings.enabled;
        }
      } catch (e) {
        console.warn('Could not load AI settings', e);
      }

      setSaving(true);
      if (useAi) {
        setSavingStatus('กำลังให้ AI วิเคราะห์ข้อมูล...');
        // Simulate AI generation delay if AI is enabled
        await new Promise(r => setTimeout(r, 1500));
        setSavingStatus('กำลังสร้างเอกสาร...');
      } else {
        setSavingStatus('กำลังสร้างเอกสารจากเทมเพลต...');
      }

      if (type === 'scope') {
        filename = 'scope-v1.0.md';
        finalPath = `${finalProjectPath}/baseline/${filename}`;
        
        let aiPrefix = '';
        const briefDoc = documents.find(d => d.type === 'brief');
        let briefContent = '';
        if (briefDoc) {
          const { readFileContent } = await import('../lib/tauri-commands');
          briefContent = await readFileContent(briefDoc.path);
        }

        if (useAi && briefContent) {
           aiPrefix = `---\nai_generated: true\n---\n> **AI Generated Document:** เอกสารนี้สร้างขึ้นโดย AI จากการวิเคราะห์ข้อมูลโครงการ (Brief)\n\n`;
           try {
             const { generateJsonWithTrace } = await import('../lib/ai/providers/aiProviderRouter');
             const prompt = `Extract ScopeFormData for ScopeFlow from the following Brief.
Return ONLY valid JSON matching this exact structure:
{
  "title": "string",
  "project_overview": "string",
  "included_items": "string",
  "excluded_items": "string",
  "deliverables": "string",
  "acceptance_criteria": "string",
  "assumptions": "string"
}

Brief Content:
${briefContent}`;
             const response = await generateJsonWithTrace(workspacePath!, prompt);
             const data = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
             const { generateScopeMarkdown } = await import('../lib/scope-builder');
             finalContent = aiPrefix + generateScopeMarkdown(data, filename.replace('.md', ''));
           } catch (err) {
             console.error("AI Scope generation failed", err);
             const { parseBriefToScope } = await import('../lib/brief-builder');
             const { generateScopeMarkdown } = await import('../lib/scope-builder');
             finalContent = generateScopeMarkdown({ title: '', acceptance_criteria: '', ...parseBriefToScope(briefContent) } as any, filename.replace('.md', ''));
           }
        } else if (briefContent) {
           const { parseBriefToScope } = await import('../lib/brief-builder');
           const { generateScopeMarkdown } = await import('../lib/scope-builder');
           finalContent = generateScopeMarkdown({ title: '', acceptance_criteria: '', ...parseBriefToScope(briefContent) } as any, filename.replace('.md', ''));
        } else {
           finalContent = generateScopeDocument({
             project: finalProjectId,
             client: clientId,
             author: '',
             projectName: finalProjectId,
           });
        }
      } else if (type === 'quotation') {
        filename = 'quotation-v1.0.md';
        finalPath = `${finalProjectPath}/baseline/${filename}`;
        finalContent = generateQuotationDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
        });
      } else if (type === 'invoice') {
        const invNumber = getNextDocumentNumber(documents, `invoice-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`);
        filename = `invoice-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${invNumber}.md`;
        finalPath = `${finalProjectPath}/invoices/${filename}`;
        finalContent = generateInvoiceDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
        });
      } else if (type === 'cr') {
        const crNumber = getNextDocumentNumber(documents, 'CR');
        filename = `CR-${crNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/change-requests/${filename}`;
        finalContent = generateCRDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
          crNumber: `CR-${crNumber}`,
          title,
        });
      } else if (type === 'dcr') {
        const dcrNumber = getNextDocumentNumber(documents, 'DCR');
        filename = `DCR-${dcrNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/change-requests/${filename}`;
        finalContent = generateDCRDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
          dcrNumber: `DCR-${dcrNumber}`,
          changeKind,
          title,
        });
      } else if (type === 'sup') {
        const supNumber = getNextDocumentNumber(documents, 'SUP');
        filename = `SUP-${supNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/support-requests/${filename}`;
        finalContent = generateSupportRequestDocument({
          type: 'support-request',
          project: finalProjectId,
          client: clientId,
          author: '',
          requestNumber: `SUP-${supNumber}`,
          category,
          title,
        });
      } else if (type === 'ma') {
        const maNumber = getNextDocumentNumber(documents, 'MA');
        filename = `MA-${maNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/support-requests/${filename}`;
        finalContent = generateSupportRequestDocument({
          type: 'ma-request',
          project: finalProjectId,
          client: clientId,
          author: '',
          requestNumber: `MA-${maNumber}`,
          category,
          title,
        });
      } else if (type === 'acceptance') {
        filename = 'acceptance-checklist-v1.0.md';
        finalPath = `${finalProjectPath}/acceptance/${filename}`;
        finalContent = generateAcceptanceChecklist({
          project: finalProjectId,
          client: clientId,
          author: '',
        });
      } else if (type === 'revision') {
        const revNumber = getNextDocumentNumber(documents, 'REV');
        filename = `REV-${revNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/reviews/${filename}`;
        finalContent = generateRevisionReviewDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
          reviewNumber: `REV-${revNumber}`,
          title,
        });
      } else if (type === 'followup') {
        const fwNumber = getNextDocumentNumber(documents, 'FW');
        filename = `FW-${fwNumber}-${slug}.md`;
        finalPath = `${finalProjectPath}/support-requests/${filename}`;
        finalContent = generateFollowUpDocument({
          project: finalProjectId,
          client: clientId,
          author: '',
          followUpNumber: `FW-${fwNumber}`,
          title,
        });
      }

      if (lifecycleContext && lifecycleContext.customerAnswerContext) {
        finalContent += buildCustomerAnswerContextMarkdown(lifecycleContext.customerAnswerContext);
      }

      setSaving(true);

      const exists = await pathExists(finalPath);
      if (exists) {
        setConflictInfo({ path: finalPath, name: filename, content: finalContent });
        setSaving(false);
        setSavingStatus('');
        return;
      }

      await createDocument(finalPath, finalContent);
      await refreshTree();

      // Open the newly created document
      setSelectedFile(finalPath);
      
      if (lifecycleContext && onDocumentCreated) {
        onDocumentCreated({
          ...lifecycleContext,
          createdAt: Date.now(),
          createdFilePath: finalPath,
        });
      }

      setSaving(false);
      setSavingStatus('');
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
      setSavingStatus('');
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">สร้างเอกสารใหม่</h2>
            <p className="modal-subtitle">สร้างเอกสารในโครงการ <span className="font-semibold text-text">{projectId}</span></p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {conflictInfo ? (
          <div className="modal-body overflow-y-auto">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm font-medium mb-4 flex items-start gap-3">
              <FileWarning className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base mb-1">พบไฟล์ {conflictInfo.name} อยู่แล้ว</p>
                <p className="text-warning/80 text-xs">กรุณาเลือกวิธีการดำเนินการกับไฟล์ที่ซ้ำกันนี้ เพื่อป้องกันข้อมูลสูญหาย</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(conflictInfo.path);
                  onClose();
                }}
                className="text-left p-4 rounded-xl border border-border bg-surface-2 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-semibold text-text">เปิดไฟล์เดิม (Open Existing)</div>
                  <div className="text-xs text-text-muted">เปิดเพื่อดูหรือแก้ไขไฟล์ที่มีอยู่แล้วด้วยตัวคุณเอง</div>
                </div>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  try {
                    setError('');
                    setSaving(true);
                    const { readFileContent, writeFileContent } = await import('../lib/tauri-commands');
                    const existingMarkdown = await readFileContent(conflictInfo.path);
                    const { mergeDocumentWithAi, mergeDocumentDeterministically } = await import('../lib/ai/documentMergeAssistant');
                    
                    let useAi = false;
                    try {
                      if (workspacePath) {
                        const { getAiSettings } = await import('../lib/settings');
                        const aiSettings = await getAiSettings(workspacePath);
                        useAi = aiSettings.enabled;
                      }
                    } catch { /* ignore */ }

                    let finalMergedContent = '';
                    if (useAi && workspacePath) {
                      const result = await mergeDocumentWithAi(workspacePath, {
                        existingMarkdown,
                        newDraftMarkdown: conflictInfo.content,
                        documentKind: conflictInfo.name
                      });
                      finalMergedContent = result.markdown;
                    } else {
                      finalMergedContent = mergeDocumentDeterministically(existingMarkdown, conflictInfo.content);
                    }
                    
                    await writeFileContent(conflictInfo.path, finalMergedContent);
                    await refreshTree();
                    setSelectedFile(conflictInfo.path);
                    onClose();
                  } catch (err) {
                    setError(`AI Merge ล้มเหลว: ${String(err)}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="text-left p-4 rounded-xl border border-border bg-surface-2 hover:border-accent hover:bg-accent/5 transition-all flex items-center gap-4 group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-semibold text-text">ใช้ AI ผสานข้อมูล (AI Update Existing)</div>
                  <div className="text-xs text-text-muted">นำเนื้อหาใหม่ไปอัปเดตหรือผนวกเข้ากับไฟล์เดิมอย่างชาญฉลาด</div>
                </div>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    const newPath = conflictInfo.path.replace(/\.md$/, `-${Date.now()}.md`);
                    await createDocument(newPath, conflictInfo.content);
                    await refreshTree();
                    setSelectedFile(newPath);
                    onClose();
                  } catch (err) {
                    setError(String(err));
                    setSaving(false);
                  }
                }}
                className="text-left p-4 rounded-xl border border-border bg-surface-2 hover:border-success hover:bg-success/5 transition-all flex items-center gap-4 group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-semibold text-text">สร้างเป็นไฟล์ใหม่ (Create New Version)</div>
                  <div className="text-xs text-text-muted">บันทึกเป็นไฟล์ใหม่โดยเติมรหัสอ้างอิง เพื่อเก็บไฟล์เก่าไว้</div>
                </div>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (window.confirm('คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการเขียนทับไฟล์เดิม? ข้อมูลเก่าทั้งหมดจะหายไปและไม่สามารถกู้คืนได้')) {
                    try {
                      setSaving(true);
                      const { writeFileContent } = await import('../lib/tauri-commands');
                      await writeFileContent(conflictInfo.path, conflictInfo.content);
                      await refreshTree();
                      setSelectedFile(conflictInfo.path);
                      onClose();
                    } catch (err) {
                      setError(String(err));
                      setSaving(false);
                    }
                  }
                }}
                className="text-left p-4 rounded-xl border border-border bg-surface-2 hover:border-error hover:bg-error/5 transition-all flex items-center gap-4 group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-error/10 text-error">
                  <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-semibold text-text">เขียนทับไฟล์เดิม (Replace Content)</div>
                  <div className="text-xs text-text-muted">ลบข้อมูลเก่าและแทนที่ด้วยเอกสารใหม่ทั้งหมด (อันตราย)</div>
                </div>
              </button>
            </div>
            <div className="mt-6 flex justify-end items-center gap-3">
              {error && <span className="text-error text-sm">{error}</span>}
              {saving && <span className="text-primary text-sm animate-pulse">กำลังประมวลผล...</span>}
              <button type="button" disabled={saving} onClick={() => setConflictInfo(null)} className="btn btn-ghost disabled:opacity-50">ย้อนกลับ</button>
            </div>
          </div>
        ) : (
        <form id="document-creator-form" onSubmit={handleSubmit} className="modal-body">
          <>
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
                {error}
              </div>
            )}
              <div className="form-section !bg-transparent !border-transparent !p-0">
                <label className="form-label mb-2 block">
                  ประเภทเอกสาร <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                  {DOCUMENT_TYPES.map((docType) => {
                    const Icon = docType.icon;
                    const isSelected = type === docType.value;
                    return (
                      <button
                        key={docType.value}
                        type="button"
                        onClick={() => setType(docType.value)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                          isSelected 
                            ? `${docType.bgClass} border-transparent ring-2 ring-offset-2 ring-offset-surface ${docType.ringClass}` 
                            : 'bg-surface-2 border-border hover:border-text-dim hover:bg-surface-3'
                        }`}
                      >
                        <div className={`p-2 rounded-lg w-fit transition-colors duration-200 ${
                          isSelected ? `${docType.colorClass} bg-surface` : `${docType.bgClass} ${docType.colorClass}`
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-200 ${isSelected ? 'text-text' : 'text-text'}`}>
                            {docType.label}
                          </div>
                          <div className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                            {docType.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {requiresSlug && (
                <div className="form-section">
                  <div className="form-field">
                    <label className="form-label">
                      ชื่อเอกสาร / หัวข้อ <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="เช่น เพิ่มระบบรายงานยอดขาย"
                      className="form-input"
                      autoFocus={!title}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      Slug (สำหรับตั้งชื่อไฟล์) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="เช่น add-sales-report"
                      className="form-input font-mono"
                    />
                    {!slug && title && (
                      <p className="form-helper text-error">
                        กรุณากรอก slug ภาษาอังกฤษ เช่น add-sales-report
                      </p>
                    )}
                    {slug && (
                      <p className="form-helper">
                        ไฟล์ที่จะสร้าง: <span className="font-mono text-text-muted">{type.toUpperCase()}-XXX-{slug}.md</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {type === 'dcr' && (
                <div className="form-section">
                  <div className="form-field">
                    <label className="form-label">
                      ประเภทการเปลี่ยนแปลง <span className="text-error">*</span>
                    </label>
                    <SelectField
                      value={changeKind}
                      onChange={setChangeKind}
                      options={[
                        { value: 'behavior', label: 'การทำงาน (Behavior / Logic)' },
                        { value: 'ui', label: 'หน้าจอ (UI / UX)' },
                        { value: 'database', label: 'ฐานข้อมูล (Database / Schema)' },
                        { value: 'report', label: 'รายงาน (Report / Dashboard)' },
                        { value: 'permission', label: 'สิทธิ์การใช้งาน (Permission / Role)' },
                        { value: 'integration', label: 'ระบบเชื่อมต่อ (Integration / API)' },
                        { value: 'technical-design', label: 'สถาปัตยกรรม (Technical Design)' },
                        { value: 'other', label: 'อื่นๆ (Other)' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {(type === 'sup' || type === 'ma') && (
                <div className="form-section">
                  <div className="form-field">
                    <label className="form-label">
                      หมวดหมู่ <span className="text-error">*</span>
                    </label>
                    <SelectField
                      value={category}
                      onChange={setCategory}
                      options={[
                        { value: 'bug', label: 'บั๊ก (Bug)' },
                        { value: 'feature-request', label: 'ขอเพิ่มฟีเจอร์ (Feature Request)' },
                        { value: 'update', label: 'อัปเดตข้อมูล (Update)' },
                        { value: 'maintenance', label: 'บำรุงรักษา (Maintenance)' },
                        { value: 'security', label: 'ความปลอดภัย (Security)' },
                        { value: 'other', label: 'อื่นๆ (Other)' },
                      ]}
                    />
                  </div>
                </div>
              )}
            </>
        </form>
        )}

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            ยกเลิก
          </button>
          {!conflictInfo && (
            <button type="submit" form="document-creator-form" disabled={saving} className="btn btn-primary">
              {saving ? savingStatus : 'สร้างเอกสาร'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
