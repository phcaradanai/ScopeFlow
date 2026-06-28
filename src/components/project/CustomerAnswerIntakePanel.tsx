import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, MessageSquareText, ShieldAlert, Check, X, FileText } from 'lucide-react';
import { classifyCustomerAnswer } from '../../lib/ai/customer-answer/customerAnswerIntake';
import { computeCustomerAnswerImpactPreview } from '../../lib/ai/customer-answer/customerAnswerImpactPreview';
import { getCustomerAnswerContextReferences } from '../../lib/ai/customer-answer/customerAnswerContextReferences';
import { type LifecycleScanFile, scanDocumentLifecycleFromFiles } from '../../lib/ai/document-lifecycle/documentLifecycleFileScan';
import { buildDocumentLifecycleSummary } from '../../lib/ai/document-lifecycle/documentLifecycle';

const intentLabels: Record<string, string> = {
  approval: 'Approval',
  rejection: 'Rejection',
  clarification: 'Clarification',
  scope_change: 'Scope Change',
  new_requirement: 'New Requirement',
  unknown: 'Unknown',
};

function getIntentIcon(intent: string) {
  if (intent === 'approval') return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (intent === 'scope_change' || intent === 'new_requirement') return <ShieldAlert className="w-4 h-4 text-error" />;
  if (intent === 'clarification') return <HelpCircle className="w-4 h-4 text-warning" />;
  return <AlertTriangle className="w-4 h-4 text-text-muted" />;
}

function riskClassName(riskLevel: string) {
  if (riskLevel === 'high') return 'bg-error/10 text-error border-error/20';
  if (riskLevel === 'medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-success/10 text-success border-success/20';
}

interface CustomerAnswerIntakePanelProps {
  scanFiles: LifecycleScanFile[];
  onOpenDocument?: (path: string) => void;
  onCreateChangeRequest?: () => void;
  onCreateFollowUp?: () => void;
  onContinueLifecycle?: () => void;
  onStartRevisionReview?: () => void;
}

export default function CustomerAnswerIntakePanel({
  scanFiles,
  onOpenDocument,
  onCreateChangeRequest,
  onCreateFollowUp,
  onContinueLifecycle,
  onStartRevisionReview
}: CustomerAnswerIntakePanelProps) {
  const [answer, setAnswer] = useState('');
  const result = useMemo(() => classifyCustomerAnswer(answer), [answer]);
  const hasAnswer = answer.trim().length > 0;

  const { lifecycleSummary } = useMemo(() => {
    const lifecycleInput = scanDocumentLifecycleFromFiles(scanFiles);
    const summary = buildDocumentLifecycleSummary(lifecycleInput);
    
    return {
      lifecycleSummary: summary
    };
  }, [scanFiles]);

  const affectedDocs = useMemo(() => {
    return computeCustomerAnswerImpactPreview(result.intent, hasAnswer, lifecycleSummary);
  }, [hasAnswer, result.intent, lifecycleSummary]);

  const contextReferences = useMemo(() => getCustomerAnswerContextReferences(scanFiles), [scanFiles]);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-2/60 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <MessageSquareText className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text">Customer Answer Intake</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            วางคำตอบลูกค้าเพื่อแยกว่าเป็น approval, clarification, rejection หรือ scope change ก่อนอัปเดตเอกสาร
          </p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <textarea
          value={answer}
          onChange={event => setAnswer(event.target.value)}
          rows={6}
          className="form-input min-h-[140px] resize-y leading-relaxed"
          placeholder="เช่น: โอเค อนุมัติ quotation นี้ / ขอเพิ่มอีกนิดได้ไหม / scope นี้หมายถึงรวม deploy ด้วยไหม"
        />

        <div className="rounded-xl border border-border bg-surface-2/40 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {getIntentIcon(result.intent)}
              <span className="text-sm font-bold text-text truncate">{intentLabels[result.intent] || result.intent}</span>
            </div>
            <span className={`badge text-[10px] border ${riskClassName(result.riskLevel)}`}>{result.riskLevel.toUpperCase()} RISK</span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">{result.summary}</p>

          {hasAnswer && result.signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.signals.map(signal => (
                <span key={signal} className="px-2 py-0.5 rounded-full border border-border bg-surface text-[10px] text-text-muted">
                  {signal}
                </span>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-primary/15 bg-primary/5 p-2.5">
            <p className="text-[11px] font-bold text-primary mb-1">Recommended Action</p>
            <p className="text-xs text-text-muted leading-relaxed">{result.recommendedAction}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`rounded-lg border p-2 ${result.shouldCreateChangeRequest ? 'border-error/20 bg-error/10 text-error' : 'border-border bg-surface text-text-muted'}`}>
              CR/DCR: {result.shouldCreateChangeRequest ? 'ควรเปิด' : 'ยังไม่ต้องเปิด'}
            </div>
            <div className={`rounded-lg border p-2 ${result.shouldAskFollowUp ? 'border-warning/20 bg-warning/10 text-warning' : 'border-success/20 bg-success/10 text-success'}`}>
              Follow-up: {result.shouldAskFollowUp ? 'ควรถามต่อ' : 'ไม่จำเป็น'}
            </div>
          </div>

          {hasAnswer && (affectedDocs.affected.length > 0 || affectedDocs.unaffected.length > 0) && (
            <div className="mt-2 rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-[11px] font-bold text-text mb-2">Impact Preview</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-semibold">Affected Documents</p>
                  <ul className="space-y-1">
                    {affectedDocs.affected.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-text">
                        <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                    {affectedDocs.affected.length === 0 && <li className="text-text-muted italic">None</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-semibold">Documents NOT affected</p>
                  <ul className="space-y-1">
                    {affectedDocs.unaffected.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-text-muted">
                        <X className="w-3.5 h-3.5 text-text-dim shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                    {affectedDocs.unaffected.length === 0 && <li className="text-text-muted italic">None</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {hasAnswer && (result.intent === 'scope_change' || result.intent === 'new_requirement') && (
            <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[11px] font-bold text-primary mb-2">Context References</p>
              <ul className="space-y-1.5 text-xs text-text-muted">
                {contextReferences.map(ref => {
                  const statusClass = ref.status === 'recommended'
                    ? 'text-primary font-semibold'
                    : ref.status === 'missing'
                      ? 'text-warning'
                      : 'text-text-muted';

                  if (ref.sourcePath && onOpenDocument) {
                    return (
                      <li key={ref.id}>
                        <button
                          type="button"
                          onClick={() => onOpenDocument(ref.sourcePath!)}
                          className={`flex items-center gap-2 hover:text-primary transition-colors ${statusClass}`}
                          title={ref.actionLabel}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {ref.label}
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={ref.id} className={`flex items-center gap-2 ${statusClass}`} title={ref.actionLabel}>
                      <span className={`w-2 h-2 rounded-full ${ref.status === 'recommended' ? 'bg-primary' : ref.status === 'missing' ? 'bg-warning' : 'bg-primary/40'}`} />
                      {ref.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {hasAnswer && (
            <div className="mt-2 flex items-center justify-end border-t border-border/50 pt-3">
              {result.intent === 'approval' && (
                <button 
                  type="button" 
                  onClick={onContinueLifecycle}
                  className="btn btn-primary text-xs py-1.5"
                >
                  Continue Lifecycle
                </button>
              )}
              {result.intent === 'clarification' && (
                <button 
                  type="button" 
                  onClick={onCreateFollowUp}
                  className="btn btn-primary text-xs py-1.5"
                >
                  Prepare Follow-up
                </button>
              )}
              {result.intent === 'rejection' && (
                <button 
                  type="button" 
                  onClick={onStartRevisionReview}
                  className="btn btn-primary text-xs py-1.5"
                >
                  Start Revision Review
                </button>
              )}
              {(result.intent === 'scope_change' || result.intent === 'new_requirement') && (
                <button 
                  type="button" 
                  onClick={onCreateChangeRequest}
                  className="btn btn-primary text-xs py-1.5"
                >
                  Prepare CR/DCR
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
