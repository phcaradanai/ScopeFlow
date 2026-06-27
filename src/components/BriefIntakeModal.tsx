import { useState, useEffect } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { createDocument, pathExists, createProject } from '../lib/tauri-commands';
import { generateBriefDocument, BriefFormData, projectPresets } from '../lib/brief-builder';
import { getAiSettings } from '../lib/settings';
import { X, AlertTriangle, FileText, CheckCircle2, ChevronRight, Lightbulb, Sparkles } from 'lucide-react';
import SelectField from './ui/SelectField';
import ScopeDigestPreview from './ScopeDigestPreview';
import ScopeControlPanel from './ScopeControlPanel';
import ScopeClosurePanel from './ScopeClosurePanel';
import CustomerQuestionPanel from './CustomerQuestionPanel';
import CustomerAnswerPanel from './CustomerAnswerPanel';
import QuoteReadinessPanel from './QuoteReadinessPanel';
import { processScopeDigest } from '../lib/ai/scope-digest/scopeDigestSkill';
import { ScopeDigestOutput } from '../lib/ai/scope-digest/scopeDigestSchema';
import { processScopeControl } from '../lib/ai/scope-control/scopeControlSkill';
import type { ScopeControlOutput } from '../lib/ai/scope-control/scopeControlSchema';
import { evaluateScopeClosureGate, type ScopeClosureGateResult } from '../lib/ai/scope-closure/scopeClosureGate';
import { buildCustomerQuestionPack, type CustomerQuestionPack } from '../lib/ai/scope-closure/customerQuestionLoop';
import { buildQuoteReadinessBrief, type QuoteReadinessBrief } from '../lib/ai/quotation-readiness/quoteReadinessBridge';
import { buildBriefScopeDraftPack } from '../lib/ai/draft-assistant/briefScopeDraftAssistant';
import { createDraftApplyPlan, summarizeDraftApplyPlan, validateDraftApplyPlan, type DraftApplyProjectTarget } from '../lib/ai/draft-assistant/draftApplyPlan';
import {
  canApplyDraftReview,
  createDraftReviewSession,
  getDraftReviewWarnings,
  updateDraftReviewDocument,
  type DraftReviewDocumentType,
  type DraftReviewSession,
} from '../lib/ai/draft-assistant/draftReviewSession';

const EXAMPLES = [
  {
    title: 'E-Commerce (เว็บขายของ)',
    content: 'ต้องการระบบร้านค้าออนไลน์ขายเสื้อผ้า มีระบบตะกร้าสินค้า ชำระเงินผ่านบัตรเครดิต/พร้อมเพย์ และระบบหลังบ้านสำหรับจัดการสต๊อกและดูรายงานยอดขาย',
    project_type: 'เว็บขายของ'
  },
  {
    title: 'Corporate Website (เว็บไซต์บริษัท)',
    content: 'อยากทำเว็บไซต์บริษัทใหม่ เน้นดีไซน์ทันสมัย (Modern Dark Theme) มีหน้า Home, About Us, Services, และฟอร์ม Contact Us ที่ส่งเข้าอีเมล',
    project_type: 'เว็บไซต์บริษัท'
  }
];

interface BriefIntakeModalProps {
  clientId: string;
  projectId?: string;
  projectPath?: string;
  onClose: () => void;
}

interface ProjectTarget {
  finalProjectId: string;
  finalProjectPath: string;
  projectName: string;
}

const defaultData: BriefFormData = {
  raw_request: '',
  project_type: 'อื่น ๆ',
};

export default function BriefIntakeModal({ clientId, projectId, projectPath, onClose }: BriefIntakeModalProps) {
  const { workspacePath, refreshTree, setSelectedFile } = useWorkspace();
  const [formData, setFormData] = useState<BriefFormData>(defaultData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDigest, setAiDigest] = useState<ScopeDigestOutput | null>(null);
  const [scopeControl, setScopeControl] = useState<ScopeControlOutput | null>(null);
  const [scopeClosure, setScopeClosure] = useState<ScopeClosureGateResult | null>(null);
  const [customerQuestionPack, setCustomerQuestionPack] = useState<CustomerQuestionPack | null>(null);
  const [quoteReadiness, setQuoteReadiness] = useState<QuoteReadinessBrief | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReviewSession | null>(null);
  const [conflictPath, setConflictPath] = useState<string | null>(null);
  const [conflictProjectPath, setConflictProjectPath] = useState<string | null>(null);
  const [conflictProjectId, setConflictProjectId] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);

  useEffect(() => {
    if (workspacePath) {
      getAiSettings(workspacePath).then(setAiSettings).catch(console.error);
    }
  }, [workspacePath]);

  const projectTypes = Object.keys(projectPresets);

  const handleChange = (field: keyof BriefFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenExisting = () => {
    if (conflictPath) {
      setSelectedFile(conflictPath);
      onClose();
    }
  };

  const buildGeneratedProjectFields = async () => {
    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return null;
    }

    const timestamp = Date.now();
    const generatedProjId = `project-${timestamp}`;
    const projectName = `โครงการใหม่ (${formData.project_type || 'ร่างความต้องการ'})`;
    const { generateProjectYaml } = await import('../lib/templates');
    const projectYaml = generateProjectYaml({
      id: generatedProjId,
      name: projectName,
      client: clientId,
      type: 'new-project',
    });

    return {
      projectId: generatedProjId,
      projectName,
      projectPath: `${workspacePath}/clients/${clientId}/projects/${generatedProjId}`,
      projectYaml,
    };
  };

  const resolveProjectTarget = async (): Promise<ProjectTarget | null> => {
    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return null;
    }

    if (projectId && projectPath) {
      return {
        finalProjectId: projectId,
        finalProjectPath: projectPath,
        projectName: projectId,
      };
    }

    const generated = await buildGeneratedProjectFields();
    if (!generated) return null;

    await createProject(workspacePath, clientId, generated.projectId, generated.projectYaml, 'new-project');

    return {
      finalProjectId: generated.projectId,
      finalProjectPath: generated.projectPath,
      projectName: generated.projectName,
    };
  };

  const stageProjectTarget = async (): Promise<DraftApplyProjectTarget | null> => {
    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return null;
    }

    if (projectId && projectPath) {
      return {
        projectId,
        projectPath,
        projectName: projectId,
        shouldCreateProject: false,
      };
    }

    const generated = await buildGeneratedProjectFields();
    if (!generated) return null;

    return {
      projectId: generated.projectId,
      projectPath: generated.projectPath,
      projectName: generated.projectName,
      shouldCreateProject: true,
      projectYaml: generated.projectYaml,
    };
  };

  const handleGenerateAiDigest = async () => {
    if (!formData.raw_request.trim()) {
      setError('กรุณาใส่ข้อความ/คำพูดจากลูกค้าก่อนให้ AI ช่วยย่อย');
      return;
    }

    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return;
    }

    try {
      setIsGeneratingAi(true);
      setError('');
      const digest = await processScopeDigest(workspacePath, formData.raw_request, formData.project_type);
      setAiDigest(digest);
      if (digest.detected_project_type !== 'ทั่วไป' && digest.detected_project_type !== 'ไม่ทราบประเภท') {
        if (projectTypes.includes(digest.detected_project_type)) {
          setFormData(prev => ({ ...prev, project_type: digest.detected_project_type }));
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!conflictProjectPath || !conflictProjectId) return;

    try {
      setSaving(true);
      setError('');
      const briefDocData = {
        ...formData,
        project: conflictProjectId,
        client: clientId,
        projectName: `โครงการใหม่ (${formData.project_type || 'ร่างความต้องการ'})`,
        ai_digest: aiDigest || undefined
      };
      const finalContent = generateBriefDocument(briefDocData);
      const timestamp = Date.now();
      const filename = `brief-v1.1-${timestamp}.md`;
      const finalPath = `${conflictProjectPath}/baseline/${filename}`;

      await createDocument(finalPath, finalContent);
      await refreshTree();
      setSelectedFile(finalPath);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const prepareDraftReview = async () => {
    setError('');

    if (!formData.raw_request.trim()) {
      setError('กรุณาใส่ข้อความ/คำพูดจากลูกค้าก่อนสร้าง Draft Preview');
      return;
    }

    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return;
    }

    try {
      setSaving(true);
      let digest = aiDigest;
      if (!digest) {
        digest = await processScopeDigest(workspacePath, formData.raw_request, formData.project_type);
        setAiDigest(digest);
      }

      const target = await stageProjectTarget();
      if (!target) {
        setSaving(false);
        return;
      }

      if (target.shouldCreateProject && await pathExists(target.projectPath)) {
        setError('ไม่สามารถเตรียม Draft ได้ เพราะ project path นี้มีอยู่แล้ว กรุณาลองใหม่อีกครั้ง');
        setSaving(false);
        return;
      }

      const draftPack = buildBriefScopeDraftPack({
        rawRequest: formData.raw_request,
        projectType: formData.project_type,
        projectId: target.projectId,
        clientId,
        projectName: target.projectName,
        digest,
      });

      const applyPlan = createDraftApplyPlan(target, draftPack);
      const existingPaths = [];
      for (const doc of applyPlan.documents) {
        if (await pathExists(doc.path)) existingPaths.push(doc.path.split(/[/\\]/).pop() || doc.path);
      }

      if (existingPaths.length > 0) {
        setError(`ไม่สามารถสร้าง Draft ได้ เพราะมีไฟล์อยู่แล้ว: ${existingPaths.join(', ')} กรุณาเปิดไฟล์เดิมหรือสร้างเวอร์ชันใหม่`);
        setConflictPath(applyPlan.documents[0].path);
        setConflictProjectPath(target.projectPath);
        setConflictProjectId(target.projectId);
        setSaving(false);
        return;
      }

      const control = await processScopeControl(workspacePath, formData.raw_request, digest, draftPack.scopeMarkdown);
      const closure = evaluateScopeClosureGate({ scopeControl: control });
      const questionPack = buildCustomerQuestionPack(closure, target.projectName);
      const quoteBrief = buildQuoteReadinessBrief(control, closure);
      setScopeControl(control);
      setScopeClosure(closure);
      setCustomerQuestionPack(questionPack);
      setQuoteReadiness(quoteBrief);
      setDraftReview(createDraftReviewSession(target.projectPath, draftPack, applyPlan));
      setSaving(false);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const handleUpdateDraftReview = (documentId: DraftReviewDocumentType, markdown: string) => {
    if (!draftReview) return;
    setDraftReview(updateDraftReviewDocument(draftReview, documentId, markdown));
  };

  const handleApplyDraftReview = async () => {
    if (!draftReview || !canApplyDraftReview(draftReview)) return;
    const applyPlan = draftReview.applyPlan;
    if (!applyPlan) {
      setError('ไม่พบแผนการ Apply Draft กรุณากลับไปสร้าง Preview ใหม่');
      return;
    }

    const planErrors = validateDraftApplyPlan(applyPlan);
    if (planErrors.length > 0) {
      setError(`ไม่สามารถ Apply ได้: ${planErrors.join(', ')}`);
      return;
    }

    if (!workspacePath) {
      setError('ไม่พบ workspace path');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (applyPlan.target.shouldCreateProject && await pathExists(applyPlan.target.projectPath)) {
        setError('ไม่สามารถ Apply ได้ เพราะ Project นี้ถูกสร้างไว้แล้ว กรุณากลับไปสร้าง Preview ใหม่');
        setSaving(false);
        return;
      }

      const existingDocs = [];
      for (const doc of applyPlan.documents) {
        if (await pathExists(doc.path)) existingDocs.push(doc.path.split(/[/\\]/).pop() || doc.path);
      }
      if (existingDocs.length > 0) {
        setError(`ไม่สามารถ Apply ได้ เพราะมีไฟล์อยู่แล้ว: ${existingDocs.join(', ')}`);
        setSaving(false);
        return;
      }

      if (applyPlan.target.shouldCreateProject) {
        await createProject(workspacePath, clientId, applyPlan.target.projectId, applyPlan.target.projectYaml || '', 'new-project');
      }

      for (const doc of applyPlan.documents) {
        await createDocument(doc.path, doc.markdown);
      }

      await refreshTree();
      const scopeDoc = applyPlan.documents.find(doc => doc.id === 'scope');
      setSelectedFile(scopeDoc?.path || applyPlan.documents[0].path);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.raw_request.trim()) {
      setError('กรุณาใส่ข้อความ/คำพูดจากลูกค้า');
      return;
    }

    try {
      setSaving(true);
      const target = await resolveProjectTarget();
      if (!target) {
        setSaving(false);
        return;
      }

      const filename = 'brief-v1.0.md';
      const finalPath = `${target.finalProjectPath}/baseline/${filename}`;

      const exists = await pathExists(finalPath);
      if (exists) {
        setConflictPath(finalPath);
        setConflictProjectPath(target.finalProjectPath);
        setConflictProjectId(target.finalProjectId);
        setSaving(false);
        return;
      }

      const briefDocData = {
        ...formData,
        project: target.finalProjectId,
        client: clientId,
        projectName: target.projectName,
        ai_digest: aiDigest || undefined
      };

      const finalContent = generateBriefDocument(briefDocData);
      await createDocument(finalPath, finalContent);
      await refreshTree();
      setSelectedFile(finalPath);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  if (conflictPath) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-header-content">
              <h2 className="modal-title flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                พบไฟล์ Brief เดิมอยู่แล้ว
              </h2>
              <p className="modal-subtitle">เอกสาร <span className="font-mono text-text">brief-v1.0.md</span> ถูกสร้างไว้แล้วในโครงการนี้</p>
            </div>
            <button onClick={onClose} className="modal-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="modal-body">
            <div className="p-4 rounded-xl bg-surface-2 border border-border flex flex-col gap-4 items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-1">คุณต้องการทำอะไร?</h3>
                <p className="text-sm text-text-dim">คุณสามารถเปิดไฟล์เดิมขึ้นมาแก้ไข หรือสร้างเวอร์ชันใหม่ของ Brief ได้</p>
              </div>
              {error && <p className="text-xs text-error leading-relaxed">{error}</p>}
            </div>
          </div>

          <div className="modal-footer flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setConflictPath(null)} className="btn btn-ghost w-full sm:w-auto">
              ย้อนกลับ
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={handleCreateNewVersion} disabled={saving} className="btn btn-outline flex-1 sm:flex-none">
                {saving ? 'กำลังสร้าง...' : 'สร้าง Brief เวอร์ชันใหม่'}
              </button>
              <button type="button" onClick={handleOpenExisting} className="btn btn-primary flex-1 sm:flex-none">
                เปิด Brief เดิม
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (draftReview) {
    const warnings = getDraftReviewWarnings(draftReview);
    const plannedActions = draftReview.applyPlan ? summarizeDraftApplyPlan(draftReview.applyPlan) : [];

    return (
      <div className="modal-overlay">
        <div className="modal-container !max-w-6xl">
          <div className="modal-header">
            <div className="modal-header-content">
              <h2 className="modal-title flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                ตรวจ Draft ก่อนสร้างเอกสารจริง
              </h2>
              <p className="modal-subtitle">ตรวจ Scope Control, Scope Closure, คำถามลูกค้า, คำตอบลูกค้า และความพร้อมก่อนทำใบเสนอราคา</p>
            </div>
            <button onClick={onClose} className="modal-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="modal-body overflow-y-auto space-y-5">
            {error && <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">{error}</div>}
            {scopeControl && <ScopeControlPanel control={scopeControl} />}
            {scopeClosure && <ScopeClosurePanel gate={scopeClosure} />}
            {customerQuestionPack && <CustomerQuestionPanel pack={customerQuestionPack} />}
            {customerQuestionPack && scopeClosure && <CustomerAnswerPanel questionPack={customerQuestionPack} gate={scopeClosure} />}
            {quoteReadiness && <QuoteReadinessPanel brief={quoteReadiness} />}
            {plannedActions.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <h3 className="text-sm font-bold text-primary-light mb-2">สิ่งที่จะเกิดขึ้นเมื่อกด Apply</h3>
                <ul className="space-y-1 text-xs text-text-muted leading-relaxed">
                  {plannedActions.map(action => <li key={action}>- {action}</li>)}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
                <h3 className="text-sm font-bold text-warning mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ควรตรวจเป็นพิเศษ</h3>
                <ul className="space-y-1 text-xs text-text-muted leading-relaxed">
                  {warnings.map(warning => <li key={warning}>- {warning}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {draftReview.documents.map(doc => (
                <div key={doc.id} className="rounded-2xl border border-border bg-surface-2 overflow-hidden flex flex-col min-h-[520px]">
                  <div className="p-4 border-b border-border bg-surface-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-text">{doc.label}</h3>
                      <span className="badge badge-muted font-mono text-[11px] break-all">{doc.path.split(/[/\\]/).pop()}</span>
                    </div>
                    <p className="text-xs text-text-muted font-mono mt-2 break-all">{doc.path}</p>
                  </div>
                  <textarea
                    value={doc.markdown}
                    onChange={(e) => handleUpdateDraftReview(doc.id, e.target.value)}
                    className="flex-1 w-full min-h-[420px] bg-surface text-text font-mono text-xs leading-relaxed p-4 outline-none resize-y"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer flex-col sm:flex-row gap-3 justify-between">
            <button type="button" onClick={() => { setDraftReview(null); setScopeControl(null); setScopeClosure(null); setCustomerQuestionPack(null); setQuoteReadiness(null); }} className="btn btn-ghost">
              กลับไปแก้คำขอ
            </button>
            <div className="flex gap-3 flex-wrap justify-end">
              <button type="button" onClick={onClose} className="btn btn-ghost">ยกเลิก</button>
              <button type="button" onClick={handleApplyDraftReview} disabled={saving || !canApplyDraftReview(draftReview)} className="btn btn-primary px-8">
                {saving ? 'กำลังสร้างเอกสาร...' : 'Apply และสร้างเอกสารจริง'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container !max-w-5xl">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">เริ่มจากคำขอลูกค้า</h2>
            <p className="modal-subtitle">ใส่ข้อมูลที่มีมาก่อน เดี๋ยวระบบช่วยจัดกรอบงานและบอกว่าต้องถามอะไรต่อ <span className="font-semibold text-text">{clientId}</span></p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body !p-0 overflow-hidden flex flex-col">
          {error && <div className="m-6 mb-0 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] flex-1 overflow-hidden">
            <form id="brief-intake-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="form-section !bg-transparent !border-transparent !p-0">
                <label className="form-label mb-2 block">วางข้อความ/คำพูดจากลูกค้าที่นี่</label>
                <textarea
                  value={formData.raw_request}
                  onChange={(e) => handleChange('raw_request', e.target.value)}
                  placeholder="วางข้อความแชท อีเมล หรือโน้ตประชุมที่นี่..."
                  className="form-textarea shadow-inner focus:shadow-primary/10 transition-shadow"
                  style={{ minHeight: '280px' }}
                  autoFocus
                />
              </div>

              <div className="form-section !bg-transparent !border-transparent !p-0 mt-auto">
                <label className="form-label mb-2 block">ประเภทโครงการ (เลือกเพื่อให้ระบบแนะนำได้แม่นยำขึ้น)</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <SelectField value={formData.project_type} onChange={(val) => handleChange('project_type', val)} options={projectTypes.map((pt) => ({ value: pt, label: pt }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={handleGenerateAiDigest} disabled={isGeneratingAi || !formData.raw_request.trim()} className="btn btn-primary bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 whitespace-nowrap gap-2">
                      <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-pulse' : ''}`} />
                      {isGeneratingAi ? 'กำลังวิเคราะห์...' : 'ให้ AI ช่วยย่อยคำขอ'}
                    </button>
                    {aiSettings && (!aiSettings.enabled || aiSettings.mode === 'off') && (
                      <div className="text-[11px] text-text-muted flex items-center gap-1.5 bg-surface-3 p-1.5 rounded border border-border">
                        <AlertTriangle className="w-3 h-3 text-warning" />
                        AI ยังไม่ได้เปิด ใช้ preset พื้นฐานแทน
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="bg-surface-2/80 border-l border-border p-6 flex flex-col gap-6 overflow-y-auto">
              {aiDigest ? (
                <ScopeDigestPreview digest={aiDigest} onChange={setAiDigest} />
              ) : (
                <>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-text mb-4">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      คำแนะนำในการเขียน
                    </h3>
                    <ul className="space-y-3 text-sm text-text-muted">
                      <li className="flex gap-3 items-start"><CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> <span>ระบุเป้าหมายหลักของโครงการให้ชัดเจน</span></li>
                      <li className="flex gap-3 items-start"><CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> <span>ระบุกลุ่มผู้ใช้งานเป้าหมาย</span></li>
                      <li className="flex gap-3 items-start"><CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> <span>บอกฟีเจอร์สำคัญที่ต้องมี (Must-have)</span></li>
                    </ul>
                  </div>

                  <div className="mt-2">
                    <h3 className="font-semibold text-text mb-3">ตัวอย่างข้อความ</h3>
                    <div className="flex flex-col gap-3">
                      {EXAMPLES.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleChange('raw_request', ex.content);
                            if (ex.project_type && projectTypes.includes(ex.project_type)) handleChange('project_type', ex.project_type);
                          }}
                          className="text-left p-4 rounded-xl border border-border bg-surface hover:bg-surface-3 hover:border-text-dim transition-all group"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm text-primary-light">{ex.title}</span>
                            <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-text transition-colors" />
                          </div>
                          <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">"{ex.content}"</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex-1">
            {aiDigest && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text">ความพร้อมของข้อมูล:</span>
                {(() => {
                  let score = 0;
                  if (aiDigest.understanding && aiDigest.understanding.length > 0 && aiDigest.understanding[0] !== '') score++;
                  if (aiDigest.confirmed_facts && aiDigest.confirmed_facts.length > 0) score++;
                  if (aiDigest.assumptions && aiDigest.assumptions.length > 0) score++;
                  if (aiDigest.unclear_points && aiDigest.unclear_points.length > 0) score++;
                  if (aiDigest.questions_to_ask && aiDigest.questions_to_ask.length > 0) score++;
                  if (score >= 4) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">พร้อมสร้าง Draft</span>;
                  if (score >= 2) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">ยังควรถามเพิ่ม</span>;
                  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-error/10 text-error border border-error/20">ยังไม่ควรเสนอราคา</span>;
                })()}
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <button type="button" onClick={onClose} className="btn btn-ghost">ยกเลิก</button>
            <button type="button" onClick={prepareDraftReview} disabled={!formData.raw_request.trim() || saving || isGeneratingAi} className="btn btn-outline px-5" style={{ minHeight: '48px' }}>
              {saving ? 'กำลังเตรียม...' : 'Preview Brief + Scope'}
            </button>
            <button type="submit" form="brief-intake-form" disabled={!formData.raw_request.trim() || saving} className="btn btn-primary px-8" style={{ minHeight: '48px' }}>
              {saving ? 'กำลังสร้าง...' : 'สร้างร่าง Brief'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
