import { X, FileText, Target, Receipt, GitPullRequest, Code, LifeBuoy, Wrench, CheckSquare } from 'lucide-react';
import { t } from '../../lib/i18n/copy';

interface DocumentCreationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentType?: string;
  projectName: string;
  reason: string;
  lifecycleStage: string;
  recommendationWhy: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, { label: string, icon: any }> = {
  scope: { label: 'ขอบเขตงาน (Scope)', icon: Target },
  quotation: { label: 'ใบเสนอราคา', icon: Receipt },
  invoice: { label: 'ใบแจ้งหนี้', icon: FileText },
  cr: { label: 'คำขอเปลี่ยนงาน', icon: GitPullRequest },
  dcr: { label: 'คำขอเปลี่ยนงานด้านพัฒนา', icon: Code },
  sup: { label: 'แจ้งปัญหา / Support', icon: LifeBuoy },
  ma: { label: 'แจ้งซ่อมบำรุง', icon: Wrench },
  acceptance: { label: 'รายการส่งมอบ/ตรวจรับ', icon: CheckSquare },
  brief: { label: 'Brief', icon: FileText },
};

export default function DocumentCreationPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  documentType,
  projectName,
  reason,
  lifecycleStage,
  recommendationWhy,
}: DocumentCreationPreviewModalProps) {
  if (!isOpen) return null;

  const docInfo = documentType && DOCUMENT_TYPE_LABELS[documentType]
    ? DOCUMENT_TYPE_LABELS[documentType]
    : { label: documentType || 'เอกสารใหม่', icon: FileText };

  const Icon = docInfo.icon;

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-lg">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {t('documentCreation.confirmCreateTitle')}
            </h2>
            <p className="modal-subtitle">
              {t('documentCreation.confirmCreateSubtitle')}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body p-6 space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">{t('documentCreation.targetProject')}</p>
              <p className="text-sm font-bold text-text">{projectName}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">{t('documentCreation.documentType')}</p>
              <div className="flex items-center gap-2">
                <span className="badge bg-primary/10 text-primary-light border border-primary/20">
                  {docInfo.label}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">{t('documentCreation.lifecycleStage')}</p>
              <p className="text-xs text-text">{lifecycleStage}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">{t('documentCreation.whyThisRecommended')}</p>
            <p className="text-sm font-bold text-text mb-2">{reason}</p>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-bold text-primary-light">{t('documentCreation.detail')}:</span> {recommendationWhy}
            </p>
          </div>
        </div>

        <div className="modal-footer flex justify-end gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="btn btn-ghost text-sm">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="btn btn-primary text-sm shadow-sm hover:shadow-md transition-all">
            {t('documentCreation.continueToCreate')}
          </button>
        </div>
      </div>
    </div>
  );
}
