import { AlertTriangle, Copy, FileText, RefreshCw, Trash2, Wand2, X } from 'lucide-react';

export type FriendlyConflictAction = 'open' | 'ai-merge' | 'update' | 'version' | 'replace';

export interface FriendlyDocumentConflictModalProps {
  title: string;
  description: string;
  documentLabel: string;
  existingPath: string;
  aiEnabled?: boolean;
  busy?: boolean;
  error?: string;
  onAction: (action: FriendlyConflictAction) => void;
  onClose: () => void;
}

export default function FriendlyDocumentConflictModal({
  title,
  description,
  documentLabel,
  existingPath,
  aiEnabled,
  busy,
  error,
  onAction,
  onClose,
}: FriendlyDocumentConflictModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-container !max-w-3xl">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-warning" /> {title}
            </h2>
            <p className="modal-subtitle">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="modal-close" disabled={busy}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">มี {documentLabel} อยู่แล้ว</p>
              <p className="text-xs opacity-90 mt-1">เลือกวิธีไปต่อโดยระบบจะเปิดผลลัพธ์ให้ตรวจทันทีหลังทำงานเสร็จ</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">เอกสารเดิม</div>
            <div className="font-mono text-xs text-text break-all">{existingPath}</div>
          </div>

          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => onAction('open')} className="btn btn-outline justify-start min-h-[64px]">
              <FileText className="w-4 h-4" /> เปิดเอกสารเดิม
            </button>
            <button type="button" disabled={busy} onClick={() => onAction('ai-merge')} className="btn btn-primary justify-start min-h-[64px]">
              <Wand2 className="w-4 h-4" /> {aiEnabled ? 'ให้ AI ช่วยอัปเดต' : 'รวมข้อมูลแบบปลอดภัย'}
            </button>
            <button type="button" disabled={busy} onClick={() => onAction('update')} className="btn btn-outline justify-start min-h-[64px]">
              <RefreshCw className="w-4 h-4" /> อัปเดตทับเอกสารเดิม
            </button>
            <button type="button" disabled={busy} onClick={() => onAction('version')} className="btn btn-outline justify-start min-h-[64px]">
              <Copy className="w-4 h-4" /> สร้างเวอร์ชันใหม่
            </button>
            <button type="button" disabled={busy} onClick={() => onAction('replace')} className="btn btn-danger justify-start min-h-[64px] md:col-span-2">
              <Trash2 className="w-4 h-4" /> แทนที่เอกสารเดิมหลังยืนยัน
            </button>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-xs text-primary-light leading-relaxed">
            แนะนำ: ใช้ “ให้ AI ช่วยอัปเดต” เมื่อมีข้อมูลเก่าที่อาจมี decision, approval, locked, evidence หรือข้อตกลงกับลูกค้าอยู่แล้ว ถ้า AI ใช้ไม่ได้ ระบบจะรวมข้อมูลแบบ deterministic แทน
          </div>
        </div>
      </div>
    </div>
  );
}
