import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, GitPullRequest, HelpCircle, MessageSquareText, RefreshCw, Wand2 } from 'lucide-react';
import { t } from '../../lib/i18n/copy';
import type { FollowUpAnswerDecision } from '../../lib/ai/follow-up/followUpAnswerDecision';

interface FollowUpAnswerIntakePanelProps {
  decision: FollowUpAnswerDecision | null;
  loading: boolean;
  onAnalyze: (answer: string) => void;
  onUpdateBrief: (decision: FollowUpAnswerDecision) => void;
  onUpdateScope: (decision: FollowUpAnswerDecision) => void;
  onCreateChangeRequest: (decision: FollowUpAnswerDecision) => void;
  onAskMoreQuestions: (decision: FollowUpAnswerDecision) => void;
}

function actionTone(action?: string) {
  if (action === 'create_change_request') return 'border-error/20 bg-error/10 text-error';
  if (action === 'ask_more_questions') return 'border-warning/20 bg-warning/10 text-warning';
  if (action === 'no_action') return 'border-border bg-surface-2 text-text-muted';
  return 'border-success/20 bg-success/10 text-success';
}

function actionLabel(action?: string) {
  if (action === 'update_brief') return t('quality.updateBriefSafely');
  if (action === 'update_scope') return t('quality.updateScopeSafely');
  if (action === 'create_change_request') return t('quality.createChangeRequestInstead');
  if (action === 'ask_more_questions') return t('quality.askMoreQuestions');
  return t('quality.noActionNeeded');
}

function actionIcon(action?: string) {
  if (action === 'create_change_request') return <GitPullRequest className="w-4 h-4" />;
  if (action === 'ask_more_questions') return <HelpCircle className="w-4 h-4" />;
  if (action === 'no_action') return <CheckCircle2 className="w-4 h-4" />;
  return <Wand2 className="w-4 h-4" />;
}

export default function FollowUpAnswerIntakePanel({
  decision,
  loading,
  onAnalyze,
  onUpdateBrief,
  onUpdateScope,
  onCreateChangeRequest,
  onAskMoreQuestions,
}: FollowUpAnswerIntakePanelProps) {
  const [answer, setAnswer] = useState('');
  const hasAnswer = answer.trim().length > 0;

  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge bg-primary/15 text-primary-light border border-primary/25 text-[10px]">Follow-up loop</span>
            <span className="badge badge-muted text-[10px]">{t('quality.safeUpdate')}</span>
          </div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" /> {t('quality.answerIntakeTitle')}
          </h2>
          <p className="mt-1 text-sm text-text-muted leading-relaxed">{t('quality.answerIntakeDescription')}</p>
        </div>
        <button type="button" onClick={() => onAnalyze(answer)} disabled={!hasAnswer || loading} className="btn btn-primary shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('quality.analyzeAnswer')}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <textarea
          value={answer}
          onChange={event => setAnswer(event.target.value)}
          rows={7}
          className="form-input min-h-[160px] resize-y leading-relaxed"
          placeholder={t('quality.answerPlaceholder')}
        />

        <div className="rounded-2xl border border-border bg-surface-2/70 p-4 min-h-[160px]">
          {!decision && (
            <p className="text-sm text-text-muted leading-relaxed">
              {t('quality.answerImpactTitle')} จะปรากฏตรงนี้หลังวิเคราะห์คำตอบลูกค้า
            </p>
          )}

          {decision && (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 ${actionTone(decision.recommended_action)}`}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  {actionIcon(decision.recommended_action)}
                  {actionLabel(decision.recommended_action)}
                </div>
                <p className="mt-2 text-xs leading-relaxed opacity-90">{decision.summary}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-text mb-1">{t('quality.answerImpactTitle')}</p>
                <p className="text-xs text-text-muted leading-relaxed">{decision.impact_summary}</p>
              </div>

              {decision.changed_items.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-text mb-1">{t('quality.changedItems')}</p>
                  <ul className="space-y-1 text-xs text-text-muted list-disc pl-4">
                    {decision.changed_items.slice(0, 4).map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}

              {decision.follow_up_questions.length > 0 && (
                <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
                  <p className="text-[11px] font-bold text-warning mb-1">{t('quality.followUpQuestions')}</p>
                  <ul className="space-y-1 text-xs text-text-muted list-disc pl-4">
                    {decision.follow_up_questions.slice(0, 3).map(question => <li key={question}>{question}</li>)}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-border bg-surface p-3 flex gap-2 text-xs text-text-muted leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>{decision.guardrails.reason}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/50">
                {decision.recommended_action === 'update_brief' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onUpdateBrief(decision)}>
                    <FileText className="w-4 h-4" /> {t('quality.updateBriefSafely')}
                  </button>
                )}
                {decision.recommended_action === 'update_scope' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onUpdateScope(decision)}>
                    <Wand2 className="w-4 h-4" /> {decision.guardrails.should_create_change_request ? t('quality.createChangeRequestInstead') : t('quality.updateScopeSafely')}
                  </button>
                )}
                {decision.recommended_action === 'create_change_request' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onCreateChangeRequest(decision)}>
                    <GitPullRequest className="w-4 h-4" /> {t('quality.createChangeRequestInstead')}
                  </button>
                )}
                {decision.recommended_action === 'ask_more_questions' && (
                  <button type="button" className="btn btn-outline text-xs" onClick={() => onAskMoreQuestions(decision)}>
                    <HelpCircle className="w-4 h-4" /> {t('quality.askMoreQuestions')}
                  </button>
                )}
                {decision.recommended_action === 'no_action' && (
                  <p className="text-xs text-text-muted leading-relaxed text-center py-2">{t('quality.noActionNeeded')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
