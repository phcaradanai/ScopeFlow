import { AlertTriangle, CheckCircle2, HelpCircle, RefreshCw, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import type { BriefScopeQualityAnalysis } from '../../lib/ai/brief-scope-quality/briefScopeQualityAnalyzer';
import { t } from '../../lib/i18n/copy';

interface BriefScopeQualityPanelProps {
  analysis: BriefScopeQualityAnalysis | null;
  loading: boolean;
  aiEnabled: boolean;
  onRefresh: () => void;
  onCreateFollowUp: (question: string) => void;
  onUpdateScope: (improvement: string) => void;
}

function scoreTone(score: number) {
  if (score >= 80) return 'text-success bg-success/10 border-success/20';
  if (score >= 55) return 'text-warning bg-warning/10 border-warning/20';
  return 'text-error bg-error/10 border-error/20';
}

function scoreLabel(score: number) {
  if (score >= 80) return t('quality.score.ready');
  if (score >= 55) return t('quality.score.askMore');
  return t('quality.score.unclear');
}

function EmptyList({ text }: { text: string }) {
  return <p className="text-xs text-text-muted leading-relaxed">{text}</p>;
}

function sourceLabel(analysis: BriefScopeQualityAnalysis) {
  if (analysis.source === 'ai') return t('quality.sourceAi');
  if (analysis.source === 'ai-fallback') return t('quality.sourceBasicAfterAiFail');
  return t('quality.sourceBasic');
}

export default function BriefScopeQualityPanel({ analysis, loading, aiEnabled, onRefresh, onCreateFollowUp, onUpdateScope }: BriefScopeQualityPanelProps) {
  const score = analysis?.readiness_score ?? 0;

  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface/80 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge bg-primary/15 text-primary-light border border-primary/25 text-[10px]">{t('quality.badge')}</span>
            <span className="badge badge-muted text-[10px]">{aiEnabled ? t('quality.aiReady') : t('quality.basicReady')}</span>
          </div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {t('quality.title')}
          </h2>
          <p className="mt-1 text-sm text-text-muted leading-relaxed">
            {t('quality.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`rounded-2xl border px-4 py-3 text-center ${scoreTone(score)}`}>
            <p className="text-2xl font-black leading-none">{loading ? '...' : score}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{loading ? t('quality.checking') : scoreLabel(score)}</p>
          </div>
          <button type="button" onClick={onRefresh} disabled={loading} className="btn btn-outline text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('quality.checkAgain')}
          </button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="mt-4 rounded-2xl border border-border bg-surface-2/70 p-4">
            <p className="text-sm font-bold text-text">{t('quality.summaryTitle')}</p>
            <p className="mt-1 text-sm text-text-muted leading-relaxed">{analysis.summary}</p>
            <p className="mt-2 text-[10px] text-text-dim">
              {sourceLabel(analysis)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2"><HelpCircle className="w-4 h-4 text-warning" /> {t('quality.customerQuestions')}</h3>
              <div className="mt-3 space-y-2">
                {analysis.suggested_customer_questions.length === 0 ? <EmptyList text={t('quality.noImportantQuestions')} /> : analysis.suggested_customer_questions.slice(0, 4).map(question => (
                  <div key={question} className="rounded-xl border border-border bg-surface/80 p-3">
                    <p className="text-xs text-text-muted leading-relaxed">{question}</p>
                    <button type="button" onClick={() => onCreateFollowUp(question)} className="btn btn-outline text-[11px] mt-2 w-full justify-center">
                      {t('quality.createFollowUp')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-error/20 bg-error/10 p-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-error" /> {t('quality.scopeRisks')}</h3>
              <div className="mt-3 space-y-2">
                {analysis.scope_risks.length === 0 ? <EmptyList text={t('quality.noScopeRisks')} /> : analysis.scope_risks.slice(0, 5).map(risk => (
                  <p key={risk} className="rounded-xl border border-border bg-surface/80 p-3 text-xs text-text-muted leading-relaxed">{risk}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" /> {t('quality.scopeImprovements')}</h3>
              <div className="mt-3 space-y-2">
                {analysis.suggested_scope_improvements.length === 0 ? <EmptyList text={t('quality.scopeClearEnough')} /> : analysis.suggested_scope_improvements.slice(0, 5).map(improvement => (
                  <div key={improvement} className="rounded-xl border border-border bg-surface/80 p-3">
                    <p className="text-xs text-text-muted leading-relaxed">{improvement}</p>
                    <button type="button" onClick={() => onUpdateScope(improvement)} className="btn btn-primary text-[11px] mt-2 w-full justify-center">
                      {t('quality.updateScope')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-4 rounded-2xl border p-3 ${analysis.guardrails.scope_update_mode === 'proposed_update_or_change_request' ? 'border-warning/20 bg-warning/10' : 'border-success/20 bg-success/10'}`}>
            <p className="text-xs font-bold text-text flex items-center gap-2">
              {analysis.guardrails.scope_update_mode === 'proposed_update_or_change_request' ? <AlertTriangle className="w-4 h-4 text-warning" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
              {t('quality.guardrail')}
            </p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{analysis.guardrails.reason}</p>
          </div>
        </>
      )}
    </section>
  );
}
