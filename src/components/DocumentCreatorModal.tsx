import { useState, useEffect } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { listProjectDocuments, createDocument, pathExists } from '../lib/tauri-commands';
import { getNextDocumentNumber } from '../lib/document-utils';
import { generateBriefDocument } from '../lib/brief-builder';
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
import SelectField from './ui/SelectField';
import BriefHelperForm from './BriefHelperForm';

interface DocumentCreatorModalProps {
  clientId: string;
  projectId: string;
  projectPath: string;
  onClose: () => void;
  initialType?: string;
}

export default function DocumentCreatorModal({
  clientId,
  projectId,
  projectPath,
  onClose,
  initialType,
}: DocumentCreatorModalProps) {
  const { workspacePath, refreshTree, setSelectedFile } = useWorkspace();
  const [type, setType] = useState(initialType || 'scope');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [changeKind, setChangeKind] = useState('behavior');
  const [category, setCategory] = useState('bug');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  // State for brief intake
  const [briefData, setBriefData] = useState(null as any);

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

  const handleSubmit = async (e: React.FormEvent, manualBriefData?: any) => {
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

      if (type === 'brief') {
        const data = manualBriefData || briefData;
        filename = `brief-${nameToSlug(data.projectName || 'project')}-${Date.now()}.md`;
        finalPath = `${projectPath}/briefs/${filename}`;
        finalContent = generateBriefDocument(data);
      } else if (type === 'scope') {
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

        <form id="document-creator-form" onSubmit={handleSubmit} className="modal-body">
          {type === 'brief' ? (
            <BriefHelperForm
              onGenerate={(data) => {
                setBriefData(data);
                handleSubmit({ preventDefault: () => {} } as any, data);
              }}
            />
          ) : (
            <>
              {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="form-section">
                <div className="form-field">
                  <label className="form-label">
                    ประเภทเอกสาร <span className="text-error">*</span>
                  </label>
                  <SelectField
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'brief', label: 'ร่างความต้องการ (Brief)' },
                      { value: 'scope', label: 'ขอบเขตงาน (Scope)' },
                      { value: 'quotation', label: 'ใบเสนอราคา (Quotation)' },
                      { value: 'cr', label: 'คำขอเปลี่ยนแปลง (CR)' },
                      { value: 'dcr', label: 'คำขอเปลี่ยนแปลงการพัฒนา (DCR)' },
                      { value: 'sup', label: 'แจ้งปัญหา (Support Request)' },
                      { value: 'ma', label: 'แจ้งซ่อมบำรุง (MA Request)' },
                      { value: 'acceptance', label: 'รายการตรวจรับ (Acceptance Checklist)' },
                    ]}
                  />
                  <p className="form-helper">เลือกประเภทเอกสารที่ต้องการสร้าง</p>
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
          )}
        </form>

        {type !== 'brief' && (
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              ยกเลิก
            </button>
            <button type="submit" form="document-creator-form" disabled={saving} className="btn btn-primary">
              {saving ? 'กำลังสร้าง...' : 'สร้างเอกสาร'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
