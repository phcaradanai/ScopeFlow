import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, GitPullRequest, HelpCircle, MessageSquareText, RefreshCw, Wand2, Receipt } from 'lucide-react';
import { t } from '../../lib/i18n/copy';
import type { BriefScopeDeltaAnalysis, RecommendedDeltaAction } from '../../lib/ai/customer-change/briefScopeDeltaAnalyzer';

interface CustomerChangeIntakePanelProps {
  analysis: BriefScopeDeltaAnalysis | null;
  loading: boolean;
  onAnalyze: (message: string) => void;
  onUpdateBrief: (analysis: BriefScopeDeltaAnalysis) => void;
  onUpdateScope: (analysis: BriefScopeDeltaAnalysis) => void;
  onCreateChangeRequest: (analysis: BriefScopeDeltaAnalysis) => void;
  onCreateFollowUp: (analysis: BriefScopeDeltaAnalysis) => void;
  onRecheckQuote: (analysis: BriefScopeDeltaAnalysis) => void;
}

function getActionTone(action: RecommendedDeltaAction) {
  if (action === 'create_change_request') return 'border-error/20 bg-error/10 text-error';
  if (action === 'create_follow_up') return 'border-warning/20 bg-warning/10 text-warning';
  if (action === 'no_action') return 'border-border bg-surface-2 text-text-muted';
  return 'border-success/20 bg-success/10 text-success';
}

function getActionLabel(action: RecommendedDeltaAction) {
  if (action === 'update_brief') return t('delta.updateBrief');
  if (action === 'update_scope') return t('delta.updateScope');
  if (action === 'create_change_request') return t('delta.createChangeRequest');
  if (action === 'create_follow_up') return t('delta.createFollowUp');
  if (action === 'recheck_quote') return t('delta.recheckQuote');
  return t('delta.noUpdateNeeded');
}

function getActionIcon(action: RecommendedDeltaAction) {
  if (action === 'create_change_request') return <GitPullRequest className="w-4 h-4" />;
  if (action === 'create_follow_up') return <HelpCircle className="w-4 h-4" />;
  if (action === 'no_action') return <CheckCircle2 className="w-4 h-4" />;
  if (action === 'recheck_quote') return <Receipt className="w-4 h-4" />;
  if (action === 'update_brief') return <FileText className="w-4 h-4" />;
  return <Wand2 className="w-4 h-4" />;
}

export default function CustomerChangeIntakePanel({
  analysis,
  loading,
  onAnalyze,
  onUpdateBrief,
  onUpdateScope,
  onCreateChangeRequest,
  onCreateFollowUp,
  onRecheckQuote,
}: CustomerChangeIntakePanelProps) {
  const [message, setMessage] = useState('');
  const hasMessage = message.trim().length > 0;

  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 break-words">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge bg-primary/15 text-primary-light border border-primary/25 text-[10px]">Brief/Scope Control Loop</span>
          </div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary shrink-0" /> {t('delta.pasteMessage')}
          </h2>
          <p className="mt-1 text-sm text-text-muted leading-relaxed break-words">{t('quality.answerIntakeDescription')}</p>
        </div>
        <button type="button" onClick={() => onAnalyze(message)} disabled={!hasMessage || loading} className="btn btn-primary shrink-0 whitespace-nowrap">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('delta.analyzeImpact')}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <textarea
          value={message}
          onChange={event => setMessage(event.target.value)}
          rows={7}
          className="form-input min-h-[160px] resize-y leading-relaxed w-full"
          placeholder={t('quality.answerPlaceholder')}
        />

        <div className="rounded-2xl border border-border bg-surface-2/70 p-4 min-h-[160px] flex flex-col min-w-0 break-words">
          {!analysis && (
            <p className="text-sm text-text-muted leading-relaxed">
              {t('delta.deltaViewTitle')} จะปรากฏตรงนี้หลังวิเคราะห์ข้อความลูกค้า
            </p>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-3 ${getActionTone(analysis.recommended_action)}`}>
                <div className="flex items-center gap-2 text-sm font-bold break-words">
                  {getActionIcon(analysis.recommended_action)}
                  {getActionLabel(analysis.recommended_action)}
                </div>
                <p className="mt-2 text-xs leading-relaxed opacity-90 break-words">{analysis.summary_of_customer_change}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-[11px] font-bold text-text mb-1">{t('delta.whatChangedBrief')}</p>
                  <p className="text-xs text-text-muted leading-relaxed break-words">{analysis.brief_delta}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-text mb-1">{t('delta.whatAffectsScope')}</p>
                  <p className="text-xs text-text-muted leading-relaxed break-words">{analysis.scope_delta}</p>
                </div>
                {(analysis.quote_impact && analysis.quote_impact !== 'ไม่มีผลกระทบ') && (
                  <div>
                    <p className="text-[11px] font-bold text-text mb-1">ผลกระทบต่อ Quote/Acceptance</p>
                    <p className="text-xs text-text-muted leading-relaxed break-words">{analysis.quote_impact} / {analysis.acceptance_impact}</p>
                  </div>
                )}
              </div>

              {analysis.missing_questions && analysis.missing_questions.length > 0 && (
                <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
                  <p className="text-[11px] font-bold text-warning mb-1">{t('delta.missingQuestions')}</p>
                  <ul className="space-y-1 text-xs text-text-muted list-disc pl-4 break-words">
                    {analysis.missing_questions.slice(0, 3).map(question => <li key={question}>{question}</li>)}
                  </ul>
                </div>
              )}

              {analysis.guardrail_notes && (
                <div className="rounded-xl border border-border bg-surface p-3 flex gap-2 text-xs text-text-muted leading-relaxed break-words">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>{analysis.guardrail_notes}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/50">
                <p className="text-[11px] font-bold text-text mb-1">{t('delta.recommendation')}</p>
                
                {analysis.recommended_action === 'update_brief' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onUpdateBrief(analysis)}>
                    <FileText className="w-4 h-4" /> อัปเดต Brief เพราะเป็นข้อมูลบริบทเพิ่มเติม
                  </button>
                )}
                {analysis.recommended_action === 'update_scope' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onUpdateScope(analysis)}>
                    <Wand2 className="w-4 h-4" /> อัปเดต Scope เพราะขอบเขตเปลี่ยนและยังไม่อนุมัติ
                  </button>
                )}
                {analysis.recommended_action === 'create_change_request' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onCreateChangeRequest(analysis)}>
                    <GitPullRequest className="w-4 h-4" /> สร้าง Change Request เพราะ Scope/Quote อนุมัติแล้ว
                  </button>
                )}
                {analysis.recommended_action === 'create_follow_up' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onCreateFollowUp(analysis)}>
                    <HelpCircle className="w-4 h-4" /> สร้าง Follow-up เพราะข้อมูลยังไม่ครบถ้วน
                  </button>
                )}
                {analysis.recommended_action === 'recheck_quote' && (
                  <button type="button" className="btn btn-primary text-xs" onClick={() => onRecheckQuote(analysis)}>
                    <Receipt className="w-4 h-4" /> ตรวจสอบ Quote เพราะการเปลี่ยนแปลงนี้อาจกระทบราคา
                  </button>
                )}
                {analysis.recommended_action === 'no_action' && (
                  <button type="button" className="btn btn-outline text-xs cursor-default">
                    <CheckCircle2 className="w-4 h-4" /> {t('delta.noUpdateNeeded')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
