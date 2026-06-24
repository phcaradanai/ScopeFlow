import { useState } from 'react';
import { X, Upload, File as FileIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-text">บันทึกการอนุมัติ</h2>
          <button
            onClick={onClose}
            className="btn btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-section">
          <div className="px-4 py-3 rounded-xl bg-surface-3/50 text-sm text-text-muted font-medium">
            เอกสาร: <span className="font-semibold text-text">{documentFilename}</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div>
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

          <div>
            <label className="form-label">
              วิธีการอนุมัติ <span className="text-error">*</span>
            </label>
            <select
              value={approvalMethod}
              onChange={(e) => setApprovalMethod(e.target.value)}
              className="form-select"
            >
              <option value="signed-pdf">เซ็นรับรอง (Signed PDF)</option>
              <option value="email">อีเมล (Email Confirmation)</option>
              <option value="line-chat">แชท LINE (LINE Chat)</option>
              <option value="verbal">วาจา (Verbal / Meeting)</option>
              <option value="screenshot">ภาพถ่ายหน้าจอ (Screenshot)</option>
              <option value="in-person">พบปะส่วนตัว (In-Person)</option>
              <option value="other">อื่นๆ (Other)</option>
            </select>
          </div>

          <div>
            <label className="form-label">
              ไฟล์หลักฐานอ้างอิง <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {evidenceFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
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
            <p className="text-xs text-text-dim mt-2.5 px-1">
              ไฟล์จะถูกคัดลอกไปเก็บไว้ในโฟลเดอร์ attachments ของโครงการนี้โดยอัตโนมัติ (ไฟล์ต้นฉบับจะไม่ถูกลบ)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              บันทึกการอนุมัติ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
