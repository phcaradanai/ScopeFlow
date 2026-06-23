import { useState, useEffect, useCallback } from 'react';
import { readFileContent, writeFileContent, copyEvidenceFiles, createDocument } from '../lib/tauri-commands';
import { updateDocumentApprovalStatus, generateApprovalRecord, lockDocument } from '../lib/templates';
import { getNextDocumentNumber } from '../lib/document-utils';
import { getNextRevisionFilename, generateRevisionDocument } from '../lib/revisions';
import QuotationForm from './QuotationForm';
import ScopeHelperForm from './ScopeHelperForm';
import { parseQuotationFormData, generateQuotationMarkdown } from '../lib/quotation-builder';
import { parseScopeFormData, generateScopeMarkdown } from '../lib/scope-builder';
import { getCompanyProfile } from '../lib/settings';
import ReactMarkdown from 'react-markdown';
import { Save, Eye, Edit3, FileText, CheckCircle, Lock, Copy } from 'lucide-react';
import ApprovalModal from './ApprovalModal';

interface MarkdownEditorProps {
  filePath: string;
  onDocumentChanged: () => void;
  onOpenDocument: (path: string) => void;
  allFiles: { name: string, path: string, is_dir: boolean }[];
  workspacePath: string;
}

export default function MarkdownEditor({ filePath, onDocumentChanged, onOpenDocument, allFiles, workspacePath }: MarkdownEditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview' | 'form'>('preview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const hasChanges = content !== originalContent;
  const filename = filePath.split('/').pop() || 'document';
  const folderPath = filePath.split('/').slice(0, -1).join('/');
  const projectPath = filePath.split('/projects/')[0] + '/projects/' + filePath.split('/projects/')[1]?.split('/')[0];

  useEffect(() => {
    loadFile();
  }, [filePath]);

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isLocked) handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, hasChanges]);

  const isLocked = content.includes('locked: true');
  const isApproved = content.includes('status: "approved"');
  const isApprovalRecord = content.includes('type: "approval-record"') || content.includes('type: approval-record');
  
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
    try {
      const attachmentsDir = projectPath + '/attachments';
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

      const aprPath = projectPath + '/approvals/' + aprNumber + '-' + filename.replace('.md', '') + '-approved.md';
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
      const newPath = folderPath + '/' + newFilename;

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between px-6 py-4.5 border-b border-border bg-surface-2 gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-primary-light" />
          <span className="text-sm font-semibold text-text">{filename}</span>
          {isLocked && <Lock className="w-4 h-4 text-warning ml-1.5" />}
          {hasChanges && !isLocked && (
            <span className="w-2.5 h-2.5 rounded-full bg-warning" title="มีการเปลี่ยนแปลง" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isLocked && !isApprovalRecord && !hasChanges && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-success/10 text-success hover:bg-success hover:text-white transition-all shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              บันทึกการอนุมัติ
            </button>
          )}

          {isLocked && !isApprovalRecord && (
            <button
              onClick={handleCreateRevision}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              สร้างเวอร์ชันใหม่
            </button>
          )}

          <div className="w-px h-5 bg-border mx-1"></div>

          <div className="flex rounded-xl border border-border overflow-hidden shadow-sm">
            {(docType === 'quotation' || docType === 'scope') && (
              <button
                onClick={() => setMode('form')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
                  mode === 'form' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                ฟอร์ม
              </button>
            )}
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
                mode === 'edit' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไข
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
                mode === 'preview' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              ดูตัวอย่าง
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || isLocked}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              saved
                ? 'bg-success/20 text-success'
                : (hasChanges && !isLocked)
                ? 'bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white hover:shadow-md'
                : 'bg-surface-3 text-text-dim cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
          </button>
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
        ) : mode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLocked}
            className={`editor-textarea w-full h-full p-8 bg-surface text-text border-none outline-none resize-none leading-relaxed text-sm ${isLocked ? 'opacity-70' : ''}`}
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto markdown-preview">
              <ReactMarkdown>{bodyForPreview}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-2.5 border-t border-border bg-surface-2 text-xs text-text-dim">
        <span>{filePath}</span>
        <div className="flex items-center gap-4">
          {isApproved && <span className="text-success flex items-center gap-1.5 font-semibold"><CheckCircle className="w-3.5 h-3.5"/> อนุมัติแล้ว</span>}
          <span className="font-medium">{content.split('\n').length} บรรทัด</span>
        </div>
      </div>

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
