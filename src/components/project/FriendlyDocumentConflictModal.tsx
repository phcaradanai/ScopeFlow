import { FileText, Wand2, RefreshCw, Copy, Trash2, X } from 'lucide-react';
import { t } from '../../lib/i18n/copy';

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
      title: t('conflict.actions.openTitle'),
      description: t('conflict.actions.openDescription'),
      icon: FileText,
      variant: 'outline',
    },
    {
      action: 'ai-merge',
      title: aiEnabled ? t('conflict.actions.aiMergeTitle') : t('conflict.actions.safeMergeTitle'),
      description: aiEnabled
        ? t('conflict.actions.aiMergeDescription')
        : t('conflict.actions.safeMergeDescription'),
      icon: Wand2,
      variant: 'primary',
    },
    {
      action: 'update',
      title: t('conflict.actions.updateTitle'),
      description: t('conflict.actions.updateDescription'),
      icon: RefreshCw,
      variant: 'outline',
    },
    {
      action: 'version',
      title: t('conflict.actions.versionTitle'),
      description: t('conflict.actions.versionDescription'),
      icon: Copy,
      variant: 'outline',
    },
    {
      action: 'replace',
      title: t('conflict.actions.replaceTitle'),
      description: t('conflict.actions.replaceDescription'),
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
        <div className="modal-header shrink-0">
          <div className="modal-header-content min-w-0">
            <h2 className="modal-title break-words">{t('conflict.title')}</h2>
            <p className="modal-subtitle break-words">{t('conflict.subtitle')}</p>
          </div>
          <button onClick={onClose} className="modal-close shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body pb-6 flex-1 overflow-y-auto min-w-0">
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 shadow-sm min-w-0 break-words">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge badge-warning break-words">{t('conflict.safeUpdateWarning')}</span>
              <span className="badge badge-muted text-[10px] break-words">{documentLabel}</span>
            </div>
            <h3 className="text-lg font-bold text-text leading-snug break-words">{title}</h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed break-words">{description}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('conflict.existingLocation')}</div>
            <div className="font-mono text-xs text-text break-all">{existingPath}</div>
          </div>

          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {busy && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary-light animate-pulse">
              {t('conflict.busy')}
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
            {t('conflict.recommendation')}
          </div>
        </div>
      </div>
    </div>
  );
}
