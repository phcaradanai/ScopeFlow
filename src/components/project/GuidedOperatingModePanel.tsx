import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, FileText, GitPullRequest, MessageSquareText, PackageCheck, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import type { GuidedOperatingModeState, GuidedPrimaryAction, GuidedStage } from '../../lib/guided-operating-mode';
import { t } from '../../lib/i18n/copy';

interface GuidedOperatingModePanelProps {
  state: GuidedOperatingModeState;
  aiEnabled?: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction?: (action: GuidedPrimaryAction) => void;
  onOpenDocument?: (path: string) => void;
}

const stageIcons = {
  request: MessageSquareText,
  brief: FileText,
  scope: ClipboardCheck,
  quotation: ReceiptText,
  approval: ShieldCheck,
  change_control: GitPullRequest,
  acceptance: PackageCheck,
};

function getStageTone(stage: GuidedStage) {
  if (stage.status === 'approved' || stage.status === 'done') return 'border-success/30 bg-success/10 text-success';
  if (stage.status === 'ready') return 'border-primary/30 bg-primary/10 text-primary-light';
  if (stage.status === 'attention') return 'border-error/30 bg-error/10 text-error';
  if (stage.status === 'draft') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-border bg-surface-2 text-text-muted';
}

function getStageStatusLabel(status: GuidedStage['status']) {
  if (status === 'approved') return t('guided.stageStatus.approved');
  if (status === 'done') return t('guided.stageStatus.done');
  if (status === 'ready') return t('guided.stageStatus.ready');
  if (status === 'attention') return t('guided.stageStatus.attention');
  if (status === 'draft') return t('guided.stageStatus.draft');
  return t('guided.stageStatus.missing');
}

function getPrimaryBadge(action: GuidedPrimaryAction) {
  if (action.kind === 'start_discovery') return t('guided.primaryBadge.startDiscovery');
  if (action.kind === 'create_scope_from_brief') return t('guided.primaryBadge.scopeFromBrief');
  if (action.kind === 'create_document') return t('guided.primaryBadge.createDocument');
  if (action.kind === 'open_document') return t('guided.primaryBadge.openDocument');
  if (action.kind === 'create_change_request') return t('guided.primaryBadge.changeRequest');
  if (action.kind === 'export_project') return t('guided.primaryBadge.exportProject');
  return t('guided.primaryBadge.nextAction');
}

export default function GuidedOperatingModePanel({ state, aiEnabled, onPrimaryAction, onSecondaryAction, onOpenDocument }: GuidedOperatingModePanelProps) {
  return (
    <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-surface to-accent/10 p-5 md:p-6 shadow-xl shadow-black/10 overflow-hidden relative">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="badge badge-success gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {t('guided.badge')}
            </span>
            <span className="badge badge-muted">{t('guided.heroBadge')}</span>
            <span className={`badge ${aiEnabled ? 'badge-success' : 'badge-muted'}`}>
              {aiEnabled ? t('guided.aiReady') : t('guided.templateReady')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-text break-words">{t('guided.title')}</h2>
          <p className="text-sm md:text-base text-text-muted leading-relaxed mt-2 break-words">
            {t('guided.description')}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface/80 p-4 min-w-[260px] shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('common.readiness')}</span>
            <span className="text-xl font-black text-primary-light">{state.readinessScore}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-3 overflow-hidden border border-border">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, state.readinessScore))}%` }} />
          </div>
          {state.blockers.length > 0 && (
            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 p-3 text-xs text-warning leading-relaxed flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.blockers[0]}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {state.stages.map((stage, index) => {
          const Icon = stageIcons[stage.key];
          const tone = getStageTone(stage);
          const canOpen = Boolean(stage.document?.file_path && onOpenDocument);
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => stage.document?.file_path && onOpenDocument?.(stage.document.file_path)}
              disabled={!canOpen}
              className={`text-left rounded-2xl border p-4 min-h-[148px] transition-all ${tone} ${canOpen ? 'hover:scale-[1.01] hover:shadow-md cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface/70 border border-white/10 flex items-center justify-center shrink-0">
                  {stage.status === 'approved' || stage.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-75">{index + 1}</span>
              </div>
              <div className="mt-3 text-sm font-black text-text break-words">{stage.shortLabel}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-80 break-words">{getStageStatusLabel(stage.status)}</div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted line-clamp-3 break-words">{stage.description}</p>
              {stage.count > 0 && <div className="mt-3 text-[11px] font-semibold opacity-80">{stage.count} รายการ</div>}
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 rounded-3xl border border-primary/30 bg-surface/90 p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="badge badge-primary shrink-0 break-words">{getPrimaryBadge(state.primaryAction)}</span>
              <span className="badge badge-muted shrink-0 break-words">{t('guided.onePrimaryAction')}</span>
            </div>
            <h3 className="text-xl font-black text-text break-words">{state.primaryAction.label}</h3>
            <p className="text-sm text-text-muted leading-relaxed mt-1 break-words">{state.primaryAction.description}</p>
          </div>
          <button type="button" onClick={onPrimaryAction} className="btn btn-primary min-h-[48px] px-6 shrink-0 shadow-lg shadow-primary/10 whitespace-nowrap">
            {t('guided.primaryButton')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {state.secondaryActions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {state.secondaryActions.map((action) => (
              <button key={`${action.kind}-${action.label}`} type="button" onClick={() => onSecondaryAction?.(action)} className="btn btn-ghost btn-sm">
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
