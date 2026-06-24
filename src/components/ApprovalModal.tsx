import { useState } from 'react';
import { X, Upload, File as FileIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import SelectField from './ui/SelectField';

interface ApprovalModalProps {
  documentPath: string;
  documentFilename: string;
  documentType: string;
  onClose: () => void;
  onSubmit: (data: {
    approvedBy: string;
    approvalMethod: string;
    evidenceFiles: string[];
  }) => void;
}

export default function ApprovalModal({
  documentFilename,
  onClose,
  onSubmit,
}: ApprovalModalProps) {
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalMethod, setApprovalMethod] = useState('signed-pdf');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function handleSelectFiles() {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Evidence',
          extensions: ['pdf', 'jpg', 'jpeg', 'png']
        }]
      });
      
      if (Array.isArray(selected)) {
        setEvidenceFiles(prev => [...new Set([...prev, ...selected])]);
      } else if (selected) {
        setEvidenceFiles(prev => [...new Set([...prev, selected])]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleRemoveFile(path: string) {
    setEvidenceFiles(prev => prev.filter(p => p !== path));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!approvedBy.trim()) {
      setError('กรุณาระบุชื่อผู้อนุมัติ');
      return;
    }

    if (evidenceFiles.length === 0) {
      setError('กรุณาแนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์');
      return;
    }

    onSubmit({
      approvedBy,
      approvalMethod,
      evidenceFiles,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">บันทึกการอนุมัติ</h2>
            <p className="modal-subtitle">เอกสาร: <span className="font-semibold text-text">{documentFilename}</span></p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="approval-form" onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">
                ผู้อนุมัติ (ชื่อลูกค้า / ผู้ประสานงาน) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="เช่น คุณสมชาย ฝ่ายจัดซื้อ"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                วิธีการอนุมัติ <span className="text-error">*</span>
              </label>
              <SelectField
                value={approvalMethod}
                onChange={setApprovalMethod}
                options={[
                  { value: 'signed-pdf', label: 'เซ็นรับรอง (Signed PDF)' },
                  { value: 'email', label: 'อีเมล (Email Confirmation)' },
                  { value: 'line-chat', label: 'แชท LINE (LINE Chat)' },
                  { value: 'verbal', label: 'วาจา (Verbal / Meeting)' },
                  { value: 'screenshot', label: 'ภาพถ่ายหน้าจอ (Screenshot)' },
                  { value: 'in-person', label: 'พบปะส่วนตัว (In-Person)' },
                  { value: 'other', label: 'อื่นๆ (Other)' },
                ]}
              />
              <p className="form-helper">วิธีการที่ลูกค้าใช้ยืนยันการอนุมัติ</p>
            </div>
          </div>

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">
                ไฟล์หลักฐานอ้างอิง <span className="text-error">*</span>
              </label>
              <div className="space-y-3">
                {evidenceFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3 truncate text-sm">
                      <FileIcon className="w-4 h-4 text-text-dim shrink-0" />
                      <span className="truncate" title={f}>{f.split('/').pop() || f.split('\\').pop()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f)}
                      className="btn btn-icon text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSelectFiles}
                  className="w-full py-4 border-2 border-dashed border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>เลือกไฟล์หลักฐาน (PDF, รูปภาพ)</span>
                </button>
              </div>
              <p className="form-helper">
                ไฟล์จะถูกคัดลอกไปเก็บไว้ในโฟลเดอร์ attachments ของโครงการนี้โดยอัตโนมัติ
              </p>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            ยกเลิก
          </button>
          <button type="submit" form="approval-form" className="btn btn-primary">
            บันทึกการอนุมัติ
          </button>
        </div>
      </div>
    </div>
  );
}
