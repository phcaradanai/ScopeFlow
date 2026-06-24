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
} from '../lib/templates';
import { validateSlug, nameToSlug } from '../lib/validation';
import { X } from 'lucide-react';

interface DocumentCreatorModalProps {
  clientId: string;
  projectId: string;
  projectPath: string;
  onClose: () => void;
}

export default function DocumentCreatorModal({
  clientId,
  projectId,
  projectPath,
  onClose,
}: DocumentCreatorModalProps) {
  const { workspacePath, refreshTree, setSelectedFile } = useWorkspace();
  const [type, setType] = useState('scope');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [changeKind, setChangeKind] = useState('behavior');
  const [category, setCategory] = useState('bug');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (workspacePath) {
      listProjectDocuments(workspacePath, clientId, projectId)
        .then(setDocuments)
        .catch(console.error);
    }
  }, [workspacePath, clientId, projectId]);

  const requiresSlug = ['cr', 'dcr', 'sup', 'ma'].includes(type);

  // Suggest a slug when title changes, if possible
  useEffect(() => {
    if (title && requiresSlug) {
      const generated = nameToSlug(title);
      if (generated) {
        setSlug(generated);
      }
    }
  }, [title, requiresSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let finalPath = '';
    let finalContent = '';
    let filename = '';

    try {
      if (requiresSlug) {
        if (!title.trim()) {
          setError('กรุณากรอกชื่อเอกสาร / หัวข้อ');
          return;
        }
        const validation = validateSlug(slug);
        if (!validation.valid) {
          setError('Slug ใช้ได้เฉพาะตัวอักษรอังกฤษพิมพ์เล็ก a-z, ตัวเลข 0-9 และขีดกลาง (-) เช่น add-sales-report');
          return;
        }
      }

      if (type === 'scope') {
        filename = 'scope-v1.0.md';
        finalPath = `${projectPath}/baseline/${filename}`;
        finalContent = generateScopeDocument({
          project: projectId,
          client: clientId,
          author: '',
          projectName: projectId,
        });
      } else if (type === 'quotation') {
        filename = 'quotation-v1.0.md';
        finalPath = `${projectPath}/baseline/${filename}`;
        finalContent = generateQuotationDocument({
          project: projectId,
          client: clientId,
          author: '',
        });
      } else if (type === 'cr') {
        const crNumber = getNextDocumentNumber(documents, 'CR');
        filename = `CR-${crNumber}-${slug}.md`;
        finalPath = `${projectPath}/change-requests/${filename}`;
        finalContent = generateCRDocument({
          project: projectId,
          client: clientId,
          author: '',
          crNumber: `CR-${crNumber}`,
          title,
        });
      } else if (type === 'dcr') {
        const dcrNumber = getNextDocumentNumber(documents, 'DCR');
        filename = `DCR-${dcrNumber}-${slug}.md`;
        finalPath = `${projectPath}/change-requests/${filename}`;
        finalContent = generateDCRDocument({
          project: projectId,
          client: clientId,
          author: '',
          dcrNumber: `DCR-${dcrNumber}`,
          changeKind,
          title,
        });
      } else if (type === 'sup') {
        const supNumber = getNextDocumentNumber(documents, 'SUP');
        filename = `SUP-${supNumber}-${slug}.md`;
        finalPath = `${projectPath}/support-requests/${filename}`;
        finalContent = generateSupportRequestDocument({
          type: 'support-request',
          project: projectId,
          client: clientId,
          author: '',
          requestNumber: `SUP-${supNumber}`,
          category,
          title,
        });
      } else if (type === 'ma') {
        const maNumber = getNextDocumentNumber(documents, 'MA');
        filename = `MA-${maNumber}-${slug}.md`;
        finalPath = `${projectPath}/support-requests/${filename}`;
        finalContent = generateSupportRequestDocument({
          type: 'ma-request',
          project: projectId,
          client: clientId,
          author: '',
          requestNumber: `MA-${maNumber}`,
          category,
          title,
        });
      } else if (type === 'acceptance') {
        filename = 'acceptance-checklist-v1.0.md';
        finalPath = `${projectPath}/acceptance/${filename}`;
        finalContent = generateAcceptanceChecklist({
          project: projectId,
          client: clientId,
          author: '',
        });
      }

      setSaving(true);
      
      const exists = await pathExists(finalPath);
      if (exists) {
        setError(`ไฟล์ ${filename} มีอยู่แล้ว กรุณาตรวจสอบหรือใช้ชื่ออื่น`);
        setSaving(false);
        return;
      }

      await createDocument(finalPath, finalContent);
      await refreshTree();
      
      // Open the newly created document
      setSelectedFile(finalPath);
      
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-text">สร้างเอกสารใหม่</h2>
          <button
            onClick={onClose}
            className="btn btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-section">
          <div className="px-4 py-3 rounded-xl bg-surface-3/50 text-sm text-text-muted font-medium">
            โครงการ: <span className="font-semibold text-text">{projectId}</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">
              ประเภทเอกสาร <span className="text-error">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select"
            >
              <option value="scope">ขอบเขตงาน (Scope)</option>
              <option value="quotation">ใบเสนอราคา (Quotation)</option>
              <option value="cr">คำขอเปลี่ยนแปลง (CR)</option>
              <option value="dcr">คำขอเปลี่ยนแปลงการพัฒนา (DCR)</option>
              <option value="sup">แจ้งปัญหา (Support Request)</option>
              <option value="ma">แจ้งซ่อมบำรุง (MA Request)</option>
              <option value="acceptance">รายการตรวจรับ (Acceptance Checklist)</option>
            </select>
          </div>

          {requiresSlug && (
            <>
              <div>
                <label className="form-label">
                  ชื่อเอกสาร / หัวข้อ <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เพิ่มระบบรายงานยอดขาย"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div>
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
                  <p className="text-xs text-error mt-1.5 px-1">
                    กรุณากรอก slug ภาษาอังกฤษ เช่น add-sales-report
                  </p>
                )}
                {slug && (
                  <p className="text-xs text-text-dim mt-1.5 px-1 font-mono">
                    → ไฟล์ที่จะสร้าง: {type.toUpperCase()}-XXX-{slug}.md
                  </p>
                )}
              </div>
            </>
          )}

          {type === 'dcr' && (
            <div>
              <label className="form-label">
                ประเภทการเปลี่ยนแปลง <span className="text-error">*</span>
              </label>
              <select
                value={changeKind}
                onChange={(e) => setChangeKind(e.target.value)}
                className="form-select"
              >
                <option value="behavior">การทำงาน (Behavior / Logic)</option>
                <option value="ui">หน้าจอ (UI / UX)</option>
                <option value="database">ฐานข้อมูล (Database / Schema)</option>
                <option value="report">รายงาน (Report / Dashboard)</option>
                <option value="permission">สิทธิ์การใช้งาน (Permission / Role)</option>
                <option value="integration">ระบบเชื่อมต่อ (Integration / API)</option>
                <option value="technical-design">สถาปัตยกรรม (Technical Design)</option>
                <option value="other">อื่นๆ (Other)</option>
              </select>
            </div>
          )}

          {(type === 'sup' || type === 'ma') && (
            <div>
              <label className="form-label">
                หมวดหมู่ <span className="text-error">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="bug">บั๊ก (Bug)</option>
                <option value="feature-request">ขอเพิ่มฟีเจอร์ (Feature Request)</option>
                <option value="update">อัปเดตข้อมูล (Update)</option>
                <option value="maintenance">บำรุงรักษา (Maintenance)</option>
                <option value="security">ความปลอดภัย (Security)</option>
                <option value="other">อื่นๆ (Other)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'กำลังสร้าง...' : 'สร้างเอกสาร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
