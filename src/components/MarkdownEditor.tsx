import { useState, useEffect, useCallback } from 'react';
import { readFileContent, writeFileContent, copyEvidenceFiles, createDocument, pathExists } from '../lib/tauri-commands';
import { updateDocumentApprovalStatus, generateApprovalRecord, lockDocument } from '../lib/templates';
import { getNextDocumentNumber } from '../lib/document-utils';
import { getNextRevisionFilename, generateRevisionDocument } from '../lib/revisions';
import QuotationForm from './QuotationForm';
import InvoiceForm from './InvoiceForm';
import ScopeHelperForm from './ScopeHelperForm';
import BriefHelperForm from './BriefHelperForm';
import { parseQuotationFormData, generateQuotationMarkdown } from '../lib/quotation-builder';
import { parseInvoiceFormData, generateInvoiceMarkdown } from '../lib/invoice-builder';
import { parseScopeFormData, generateScopeMarkdown } from '../lib/scope-builder';
import { generateBriefDocument, parseBriefToScope } from '../lib/brief-builder';
import { getCompanyProfile } from '../lib/settings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, Edit3, FileText, CheckCircle, Lock, Copy, ArrowRight, X } from 'lucide-react';
import ApprovalModal from './ApprovalModal';

interface MarkdownEditorProps {
  filePath: string;
  onDocumentChanged: () => void;
  onOpenDocument: (path: string) => void;
  allFiles: { name: string, path: string, is_dir: boolean }[];
  workspacePath: string;
  onCloseDocument?: () => void;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function getBasename(path: string): string {
  const normalized = normalizePath(path);
  return normalized.split('/').pop() || 'document';
}

function getDirname(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

function joinPath(...parts: string[]): string {
  return parts
    .map((part, index) => {
      const normalized = normalizePath(part);
      if (index === 0) return normalized.replace(/\/+$/g, '');
      return normalized.replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

function deriveProjectPath(filePath: string): string {
  const normalized = normalizePath(filePath);
  const marker = '/projects/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return '';

  const projectBase = normalized.slice(0, markerIndex + marker.length);
  const afterProjects = normalized.slice(markerIndex + marker.length);
  const projectId = afterProjects.split('/')[0];
  if (!projectId) return '';

  return `${projectBase}${projectId}`;
}

function pathEquals(a: string, b: string): boolean {
  return normalizePath(a).toLowerCase() === normalizePath(b).toLowerCase();
}

export default function MarkdownEditor({ filePath, onDocumentChanged, onOpenDocument, allFiles, workspacePath, onCloseDocument }: MarkdownEditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview' | 'form'>('preview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const normalizedFilePath = normalizePath(filePath);
  const hasChanges = content !== originalContent;
  const filename = getBasename(filePath);
  const folderPath = getDirname(filePath);
  const projectPath = deriveProjectPath(filePath);

  useEffect(() => {
    async function loadFile() {
      try {
        const text = await readFileContent(filePath);
        setContent(text);
        setOriginalContent(text);
        setError('');
        if (text.includes('locked: true')) {
          setMode('preview');
        } else {
          setMode('edit');
        }
      } catch (err) {
        setError(`โหลดไฟล์ไม่สำเร็จ: ${err}`);
      }
    }
    loadFile();
  }, [filePath]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await writeFileContent(filePath, content);
      setOriginalContent(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onDocumentChanged();
    } catch (err) {
      setError(`บันทึกไม่สำเร็จ: ${err}`);
    } finally {
      setSaving(false);
    }
  }, [filePath, content, onDocumentChanged]);

  const isLocked = content.includes('locked: true');
  const isApproved = content.includes('status: "approved"');
  const isApprovalRecord = content.includes('type: "approval-record"') || content.includes('type: approval-record');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isLocked) handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, hasChanges, isLocked]);

  const typeMatch = content.match(/type:\s*"?([^"\n]+)"?/);
  const docType = typeMatch ? typeMatch[1] : 'document';
  
  const clientMatch = content.match(/client:\s*"?([^"\n]+)"?/);
  const clientId = clientMatch ? clientMatch[1] : '';
  
  const projMatch = content.match(/project:\s*"?([^"\n]+)"?/);
  const projId = projMatch ? projMatch[1] : '';

  const bodyForPreview = (() => {
    if (content.startsWith('---')) {
      const endIdx = content.indexOf('---', 3);
      if (endIdx !== -1) {
        return content.substring(endIdx + 3).trim();
      }
    }
    return content;
  })();

  const handleApprove = async (data: { approvedBy: string; approvalMethod: string; evidenceFiles: string[] }) => {
    if (!projectPath) {
      setError('ไม่สามารถระบุโฟลเดอร์โครงการจาก path ของไฟล์นี้ได้');
      return;
    }

    try {
      const attachmentsDir = joinPath(projectPath, 'attachments');
      const copiedFiles = await copyEvidenceFiles(data.evidenceFiles, attachmentsDir);
      const docsForNumbering = allFiles.map(f => ({
        filename: f.name,
        folder: '',
        path: f.path,
        isDir: f.is_dir
      }));
      const aprNumber = 'APR-' + getNextDocumentNumber(docsForNumbering, 'APR');

      const approvalContent = generateApprovalRecord({
        approvalNumber: aprNumber,
        project: projId,
        client: clientId,
        approvedDocument: filename,
        documentType: docType,
        approvedBy: data.approvedBy,
        approvalMethod: data.approvalMethod,
        evidenceFiles: copiedFiles
      });

      const aprPath = joinPath(projectPath, 'approvals', `${aprNumber}-${filename.replace('.md', '')}-approved.md`);
      await createDocument(aprPath, approvalContent);

      let updatedContent = updateDocumentApprovalStatus(
        content,
        data.approvedBy,
        new Date().toISOString().split('T')[0],
        aprNumber
      );

      if (window.confirm('คุณต้องการล็อกเอกสารนี้ไม่ให้แก้ไขอีกหรือไม่? (แนะนำ)')) {
        updatedContent = lockDocument(updatedContent, new Date().toISOString().split('T')[0]);
      }

      await writeFileContent(filePath, updatedContent);
      setContent(updatedContent);
      setOriginalContent(updatedContent);
      setShowApprovalModal(false);
      onDocumentChanged();
      onOpenDocument(aprPath);
    } catch (err) {
      setError(`บันทึกการอนุมัติไม่สำเร็จ: ${err}`);
    }
  };

  const handleCreateRevision = async () => {
    try {
      const isMajor = window.confirm('นี่เป็นการแก้ไขครั้งใหญ่ (Major Revision) ใช่หรือไม่?\n- กด OK สำหรับ Major (เช่น v1.0 -> v2.0)\n- กด Cancel สำหรับ Minor (เช่น v1.0 -> v1.1)');
      const newFilename = getNextRevisionFilename(filename, isMajor);
      const newPath = joinPath(folderPath, newFilename);

      const revisedContent = generateRevisionDocument(
        originalContent,
        filename,
        new Date().toISOString().split('T')[0]
      );

      await createDocument(newPath, revisedContent);
      onDocumentChanged();
      onOpenDocument(newPath);
    } catch (err) {
      setError(`สร้างเวอร์ชันใหม่ไม่สำเร็จ: ${err}`);
    }
  };

  // State to manage scope creation options
  const [scopeOption, setScopeOption] = useState<null | 'choose'>(null);
  const [existingScopePath, setExistingScopePath] = useState<string>('');
  const [newScopePath, setNewScopePath] = useState<string>('');

  const getNextScopeVersionFilename = (files: { name: string; path: string }[]) => {
    const baselineDir = projectPath ? joinPath(projectPath, 'baseline') : '';
    const baselineFiles = files.filter(f => {
      const normalized = normalizePath(f.path);
      return normalized.includes('/baseline/') && (!baselineDir || normalized.startsWith(`${baselineDir}/`)) && f.name.match(/^scope-v\d+\.\d+\.md$/);
    });
    let maxMajor = 0;
    let maxMinor = 0;
    baselineFiles.forEach(f => {
      const match = f.name.match(/^scope-v(\d+)\.(\d+)\.md$/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
          maxMajor = major;
          maxMinor = minor;
        }
      }
    });
    // Increment minor version
    const nextMinor = maxMinor + 1;
    return `scope-v${maxMajor}.${nextMinor}.md`;
  };

  const handleCreateScopeFromBrief = async () => {
    try {
      if (!projectPath) {
        setError(`ไม่สามารถสร้าง Scope ได้ เพราะไม่พบ path โครงการจากไฟล์นี้: ${filePath}`);
        return;
      }

      const baselinePath = joinPath(projectPath, 'baseline');
      const baselineEntryIsFile = allFiles.some(f => !f.is_dir && pathEquals(f.path, baselinePath));
      if (baselineEntryIsFile) {
        setError(`ไม่สามารถสร้าง Scope ได้ เพราะมีไฟล์ชื่อ baseline อยู่ที่ ${baselinePath} กรุณาเปลี่ยนชื่อไฟล์นั้นก่อน`);
        return;
      }

      const scopeFilename = 'scope-v1.0.md';
      const scopePath = joinPath(baselinePath, scopeFilename);
      const prefillData = parseBriefToScope(content);
      const baseContent = generateScopeMarkdown({
        title: 'ขอบเขตงาน (Scope of Work)',
        ...prefillData,
        acceptance_criteria: '',
        deliverables: prefillData.deliverables || '',
      }, scopeFilename);

      const exists = await pathExists(scopePath);
      if (!exists) {
        // No existing scope, create directly
        await createDocument(scopePath, baseContent);
        onDocumentChanged();
        onOpenDocument(scopePath);
        return;
      }

      // Existing scope detected, decide action
      setExistingScopePath(scopePath);
      // Determine next version filename
      const nextVersionName = getNextScopeVersionFilename(allFiles);
      const nextPath = joinPath(baselinePath, nextVersionName);
      setNewScopePath(nextPath);
      setScopeOption('choose'); // trigger modal
    } catch (err) {
      setError(`สร้าง Scope จาก Brief ไม่สำเร็จ: ${err}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-surface-2 gap-3 shadow-sm">
        {/* Left: filename + status */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary-light" />
          <span className="text-base font-semibold text-text">{filename}</span>
          {isLocked && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              ถูกล็อก
            </span>
          )}
          {hasChanges && !isLocked && (
            <span className="w-2.5 h-2.5 rounded-full bg-warning" title="มีการเปลี่ยนแปลง" />
          )}
        </div>

        {/* Right: actions grouped */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Document actions */}
          <div className="flex items-center gap-2">
            {!isLocked && !isApprovalRecord && !hasChanges && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="btn btn-sm flex items-center gap-1.5 text-success bg-success/10 border border-success/20 hover:bg-success hover:text-white hover:border-success"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                บันทึกการอนุมัติ
              </button>
            )}

            {isLocked && !isApprovalRecord && (
              <button
                onClick={handleCreateRevision}
                className="btn btn-sm bg-primary/10 text-primary hover:bg-primary hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
                สร้างเวอร์ชันใหม่
              </button>
            )}

            {docType === 'brief' && mode !== 'form' && (
              <button
                onClick={handleCreateScopeFromBrief}
                className="btn btn-sm btn-primary flex items-center gap-1.5"
              >
                นำ Brief ไปสร้าง Scope
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-border mx-1"></div>

          {/* Mode switcher - segmented */}
          <div className="segmented-control">
            {(docType === 'quotation' || docType === 'scope' || docType === 'brief' || docType === 'invoice') && (
              <button
                onClick={() => setMode('form')}
                className={`segmented-btn ${mode === 'form' ? 'segmented-btn-active' : ''}`}
              >
                <FileText className="w-3.5 h-3.5" />
                ฟอร์ม
              </button>
            )}
            <button
              onClick={() => setMode('edit')}
              className={`segmented-btn ${mode === 'edit' ? 'segmented-btn-active' : ''}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไข
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`segmented-btn ${mode === 'preview' ? 'segmented-btn-active' : ''}`}
            >
              <Eye className="w-3.5 h-3.5" />
              ดูตัวอย่าง
            </button>
          </div>

          <div className="w-px h-5 bg-border mx-1"></div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || isLocked}
            className={`btn flex items-center gap-1.5 px-5 min-h-[44px] ${
              saved
                ? 'bg-success/20 text-success border border-success/30'
                : (hasChanges && !isLocked)
                ? 'btn-primary'
                : 'bg-surface-3 text-text-dim cursor-not-allowed border border-border'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
          </button>

          {onCloseDocument && (
            <>
              <div className="w-px h-5 bg-border mx-1"></div>
              <button
                onClick={onCloseDocument}
                className="btn btn-icon text-text-dim hover:text-text hover:bg-surface-3"
                title="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 py-3.5 bg-error/10 border-b border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {isLocked && mode === 'edit' && (
        <div className="px-6 py-3.5 bg-warning/10 border-b border-warning/30 text-warning text-sm flex items-center justify-center gap-2.5 font-medium">
          <Lock className="w-4 h-4 text-warning" />
          เอกสารนี้ถูกล็อกแล้ว กรุณาสร้างเวอร์ชันใหม่เพื่อแก้ไข
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {mode === 'form' && docType === 'quotation' ? (
          <QuotationForm
            workspacePath={workspacePath}
            initialData={parseQuotationFormData(content)}
            onGenerate={async (data) => {
              if (isLocked) {
                alert('เอกสารนี้ถูกล็อกแล้ว กรุณาสร้างเวอร์ชันใหม่เพื่อแก้ไข');
                return;
              }
              if (content.trim() && !window.confirm('การสร้างเอกสารใหม่จากฟอร์มอาจแทนที่เนื้อหาเดิม กรุณาตรวจสอบก่อนบันทึก')) {
                return;
              }
              let profile = null;
              try {
                profile = await getCompanyProfile(workspacePath);
              } catch (err: any) {
                if (err.message === 'MALFORMED_YAML') {
                  alert('คำเตือน: ไฟล์ตั้งค่าบริษัทเสียหาย จะไม่แสดงข้อมูลบริษัทในเอกสารนี้');
                } else {
                  console.error(err);
                }
              }
              const md = generateQuotationMarkdown(data, profile, clientId, projId, filename);
              setContent(md);
              setMode('preview');
            }}
          />
        ) : mode === 'form' && docType === 'invoice' ? (
          <InvoiceForm
            workspacePath={workspacePath}
            initialData={parseInvoiceFormData(content)}
            onGenerate={async (data) => {
              if (isLocked) {
                alert('เอกสารนี้ถูกล็อกแล้ว กรุณาสร้างเวอร์ชันใหม่เพื่อแก้ไข');
                return;
              }
              if (content.trim() && !window.confirm('การสร้างเอกสารใหม่จากฟอร์มอาจแทนที่เนื้อหาเดิม กรุณาตรวจสอบก่อนบันทึก')) {
                return;
              }
              let profile = null;
              try {
                profile = await getCompanyProfile(workspacePath);
              } catch (err: any) {
                if (err.message === 'MALFORMED_YAML') {
                  alert('คำเตือน: ไฟล์ตั้งค่าบริษัทเสียหาย จะไม่แสดงข้อมูลบริษัทในเอกสารนี้');
                } else {
                  console.error(err);
                }
              }
              const md = generateInvoiceMarkdown(data, profile, clientId, projId, filename);
              setContent(md);
              setMode('preview');
            }}
          />
        ) : mode === 'form' && docType === 'scope' ? (
          <ScopeHelperForm
            initialData={parseScopeFormData(content)}
            onGenerate={(data) => {
              if (isLocked) {
                alert('เอกสารนี้ถูกล็อกแล้ว กรุณาสร้างเวอร์ชันใหม่เพื่อแก้ไข');
                return;
              }
              if (content.trim() && !window.confirm('การสร้างเอกสารใหม่จากฟอร์มอาจแทนที่เนื้อหาเดิม กรุณาตรวจสอบก่อนบันทึก')) {
                return;
              }
              const md = generateScopeMarkdown(data, filename);
              setContent(md);
              setMode('preview');
            }}
          />
        ) : mode === 'form' && docType === 'brief' ? (
          <BriefHelperForm
            initialData={null}
            onGenerate={(data) => {
              if (isLocked) {
                alert('เอกสารนี้ถูกล็อกแล้ว');
                return;
              }
              if (content.trim() && !window.confirm('การสร้างร่าง Brief ใหม่จะแทนที่เนื้อหาเดิม กรุณายืนยัน')) {
                return;
              }
              const md = generateBriefDocument({
                raw_request: data.raw_request,
                project_type: data.project_type,
                project: projId,
                client: clientId,
                projectName: projId,
              });
              setContent(md);
              setMode('preview');
            }}
          />
        ) : mode === 'edit' ? (
          <div className="h-full overflow-y-auto w-full flex justify-center bg-surface-2/30 py-8 px-4 custom-scrollbar">
            <div className="w-full max-w-[850px] min-h-full bg-surface shadow-2xl border border-white/5 rounded-xl p-10 md:p-16 flex flex-col transition-all duration-300">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLocked}
                className={`editor-textarea w-full flex-1 bg-transparent text-text border-none outline-none resize-none leading-loose text-base ${isLocked ? 'opacity-70' : ''}`}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto w-full flex justify-center bg-surface-2/30 py-8 px-4 custom-scrollbar">
            <div className="w-full max-w-[850px] min-h-full bg-surface shadow-2xl border border-white/5 rounded-xl p-10 md:p-16 transition-all duration-300">
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyForPreview}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-2 border-t border-border bg-surface-2 text-xs text-text-dim shrink-0">
        <span className="truncate max-w-[200px] sm:max-w-md" title={normalizedFilePath}>
          {getBasename(normalizedFilePath)}
        </span>
        <div className="flex items-center gap-4 shrink-0">
          {isApproved && <span className="text-success flex items-center gap-1.5 font-semibold"><CheckCircle className="w-3.5 h-3.5"/> อนุมัติแล้ว</span>}
          <span className="font-medium">{content.split('\n').length} บรรทัด</span>
        </div>
      </div>

      {/* Scope creation options modal */}
      {scopeOption === 'choose' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">Scope already exists</h2>
            <p className="modal-subtitle">Select an action for the existing Scope file.</p>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  onOpenDocument(existingScopePath);
                  setScopeOption(null);
                }}
              >
                เปิด Scope เดิม
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const prefill = parseBriefToScope(content);
                  const newContent = `---\nstatus: draft\nlocked: false\nprevious_version: "${existingScopePath.replace(`${projectPath}/`, '')}"\n---\n` + generateScopeMarkdown({
                    title: 'ขอบเขตงาน (Scope of Work)',
                    ...prefill,
                    acceptance_criteria: '',
                    deliverables: prefill.deliverables || '',
                  }, getBasename(newScopePath));
                  await createDocument(newScopePath, newContent);
                  onDocumentChanged();
                  onOpenDocument(newScopePath);
                  setScopeOption(null);
                }}
              >
                สร้างเวอร์ชันใหม่
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setScopeOption(null)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <ApprovalModal
          documentPath={filePath}
          documentFilename={filename}
          documentType={docType}
          onClose={() => setShowApprovalModal(false)}
          onSubmit={handleApprove}
        />
      )}
    </div>
  );
}
