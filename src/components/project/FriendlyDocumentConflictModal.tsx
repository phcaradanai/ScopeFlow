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

interface ConflictActionOption {
  action: FriendlyConflictAction;
  title: string;
  description: string;
  icon: typeof FileText;
  variant: 'primary' | 'outline' | 'danger';
}

function getActionOptions(aiEnabled?: boolean): ConflictActionOption[] {
  return [
    {
      action: 'open',
      title: 'เปิดเอกสารเดิม',
      description: 'เปิดของเดิมทันที เพื่อดู decision, approval หรือข้อมูลลูกค้าที่มีอยู่แล้ว',
      icon: FileText,
      variant: 'outline',
    },
    {
      action: 'ai-merge',
      title: aiEnabled ? 'ให้ AI ช่วยอัปเดต / merge' : 'รวมข้อมูลแบบปลอดภัย',
      description: aiEnabled
        ? 'ใช้ provider ที่ตั้งค่าไว้ช่วยรวมข้อมูลใหม่ โดยเก็บ approval, locked decision และ evidence เดิมไว้'
        : 'ยังไม่มี AI provider ที่พร้อมใช้ ระบบจะรวมข้อมูลใหม่ต่อท้ายแบบ deterministic เพื่อไม่ทับข้อมูลสำคัญ',
      icon: Wand2,
      variant: 'primary',
    },
    {
      action: 'update',
      title: 'อัปเดตทับเอกสารเดิม',
      description: 'ใช้เนื้อหาที่สร้างล่าสุดเป็นฉบับปัจจุบัน แล้วเปิดผลลัพธ์ให้ตรวจทันที',
      icon: RefreshCw,
      variant: 'outline',
    },
    {
      action: 'version',
      title: 'สร้างเวอร์ชันใหม่',
      description: 'เก็บเอกสารเดิมไว้ แล้วสร้างฉบับใหม่แยกออกมาเพื่อเทียบหรือตรวจต่อ',
      icon: Copy,
      variant: 'outline',
    },
    {
      action: 'replace',
      title: 'แทนที่หลังยืนยัน',
      description: 'แทนที่เอกสารเดิมด้วยฉบับใหม่หลังยืนยัน เหมาะเมื่อมั่นใจว่าไม่ต้องเก็บข้อมูลเดิม',
      icon: Trash2,
      variant: 'danger',
    },
  ];
}

function getButtonClass(variant: ConflictActionOption['variant']) {
  if (variant === 'primary') return 'btn btn-primary';
  if (variant === 'danger') return 'btn btn-danger';
  return 'btn btn-outline';
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
  const options = getActionOptions(aiEnabled);

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
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">ตำแหน่งเอกสารเดิม</div>
            <div className="font-mono text-xs text-text break-all">{existingPath}</div>
          </div>

          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {busy && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary-light animate-pulse">
              กำลังจัดการเอกสารและจะเปิดผลลัพธ์ให้ตรวจทันที...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.action}
                  type="button"
                  disabled={busy}
                  onClick={() => onAction(option.action)}
                  className={`${getButtonClass(option.variant)} h-auto min-h-[88px] justify-start items-start text-left gap-3 p-4 ${option.action === 'replace' ? 'md:col-span-2' : ''}`}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="flex flex-col gap-1">
                    <span className="font-bold">{option.title}</span>
                    <span className="text-xs font-normal leading-relaxed opacity-80">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-xs text-primary-light leading-relaxed">
            แนะนำ: ใช้ “ให้ AI ช่วยอัปเดต / merge” เมื่อเอกสารเดิมอาจมี decision, approval, locked scope, evidence หรือข้อตกลงกับลูกค้าอยู่แล้ว ถ้า AI ใช้ไม่ได้ ระบบจะรวมข้อมูลแบบ deterministic แทน
          </div>
        </div>
      </div>
    </div>
  );
}
