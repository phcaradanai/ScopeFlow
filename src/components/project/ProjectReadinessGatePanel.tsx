import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, FileText, GitPullRequest, PackageCheck, ReceiptText, ShieldAlert } from 'lucide-react';
import type { ProjectReadinessGateResult, ProjectReadinessStage } from '../../lib/project-readiness-gate';
import { t } from '../../lib/i18n/copy';

interface ProjectReadinessGatePanelProps {
  gate: ProjectReadinessGateResult;
  onPrimaryAction: () => void;
  onOpenDocument?: (path: string) => void;
}

const stageOrder: { key: ProjectReadinessStage; labelKey: string; icon: typeof FileText }[] = [
  { key: 'ready_for_brief', labelKey: 'quality.readyForBrief', icon: FileText },
  { key: 'ready_for_scope', labelKey: 'quality.readyForScope', icon: ClipboardCheck },
  { key: 'ready_for_quote', labelKey: 'quality.readyForQuote', icon: ReceiptText },
  { key: 'ready_for_approval', labelKey: 'quality.readyForApproval', icon: ShieldAlert },
  { key: 'ready_for_delivery_acceptance', labelKey: 'quality.readyForDelivery', icon: PackageCheck },
];

function scoreTone(score: number) {
  if (score >= 85) return 'text-success bg-success/10 border-success/20';
  if (score >= 55) return 'text-warning bg-warning/10 border-warning/20';
  return 'text-error bg-error/10 border-error/20';
}

function stageLabel(stage: ProjectReadinessStage) {
  if (stage === 'ready_for_brief') return t('quality.readyForBrief');
  if (stage === 'ready_for_scope') return t('quality.readyForScope');
  if (stage === 'ready_for_quote') return t('quality.readyForQuote');
  if (stage === 'ready_for_approval') return t('quality.readyForApproval');
  if (stage === 'ready_for_delivery_acceptance') return t('quality.readyForDelivery');
  return t('quality.blockedByWork');
}

function blockerTone(severity: string) {
  if (severity === 'blocking') return 'border-error/20 bg-error/10 text-error';
  if (severity === 'warning') return 'border-warning/20 bg-warning/10 text-warning';
  return 'border-border bg-surface text-text-muted';
}

export default function ProjectReadinessGatePanel({ gate, onPrimaryAction, onOpenDocument }: ProjectReadinessGatePanelProps) {
  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge bg-primary/15 text-primary-light border border-primary/25 text-[10px]">{t('quality.readinessGateTitle')}</span>
            <span className={`badge text-[10px] ${gate.canQuote ? 'badge-success' : 'badge-muted'}`}>{gate.canQuote ? t('quality.readyForQuote') : t('quality.cannotQuote')}</span>
            <span className={`badge text-[10px] ${gate.canDeliver ? 'badge-success' : 'badge-muted'}`}>{gate.canDeliver ? t('quality.readyForDelivery') : t('quality.cannotDeliver')}</span>
          </div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" /> {gate.headline}
          </h2>
          <p className="mt-1 text-sm text-text-muted leading-relaxed">{gate.summary}</p>
          <p className="mt-1 text-xs text-text-dim leading-relaxed">{t('quality.readinessGateDescription')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`rounded-2xl border px-4 py-3 text-center ${scoreTone(gate.score)}`}>
            <p className="text-2xl font-black leading-none">{gate.score}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{gate.readyLabel}</p>
          </div>
          <button type="button" onClick={onPrimaryAction} className="btn btn-primary text-xs min-h-[48px]">
            {gate.primaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        {stageOrder.map(({ key, labelKey, icon: Icon }) => {
          const active = gate.stage === key;
          const reached = stageOrder.findIndex(stage => stage.key === key) <= stageOrder.findIndex(stage => stage.key === gate.stage) && gate.stage !== 'blocked';
          return (
            <div key={key} className={`rounded-2xl border p-3 ${active ? 'border-primary/30 bg-primary/10 text-primary-light' : reached ? 'border-success/20 bg-success/10 text-success' : 'border-border bg-surface-2 text-text-muted'}`}>
              <Icon className="w-4 h-4 mb-2" />
              <p className="text-[11px] font-bold leading-snug">{t(labelKey as any)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-3">
        <div className="rounded-2xl border border-border bg-surface-2/70 p-4">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> {t('quality.blockersTitle')}
          </h3>
          <div className="mt-3 space-y-2">
            {gate.blockers.length === 0 && <p className="text-xs text-text-muted leading-relaxed">{t('quality.noBlockers')}</p>}
            {gate.blockers.slice(0, 6).map((blocker, index) => (
              <button
                key={`${blocker.kind}-${index}`}
                type="button"
                disabled={!blocker.documentPath || !onOpenDocument}
                onClick={() => blocker.documentPath && onOpenDocument?.(blocker.documentPath)}
                className={`w-full text-left rounded-xl border p-3 ${blockerTone(blocker.severity)} ${blocker.documentPath ? 'hover:scale-[1.005] transition-transform cursor-pointer' : 'cursor-default'}`}
              >
                <p className="text-xs font-bold flex items-center gap-2">
                  {blocker.kind === 'open_change_request' ? <GitPullRequest className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {blocker.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{blocker.reason}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary-light mb-2">{t('quality.nextAction')}</p>
          <h3 className="text-base font-black text-text">{gate.primaryAction.label}</h3>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">{gate.primaryAction.description}</p>
          <button type="button" onClick={onPrimaryAction} className="btn btn-primary w-full justify-center text-xs mt-4">
            {gate.primaryAction.label}
          </button>
        </div>
      </div>
    </section>
  );
}
