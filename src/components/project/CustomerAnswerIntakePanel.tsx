import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, MessageSquareText, ShieldAlert } from 'lucide-react';
import { classifyCustomerAnswer } from '../../lib/ai/customer-answer/customerAnswerIntake';

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
  onStartBriefIntake?: () => void;
  onCreateChangeRequest?: () => void;
  onCreateFollowUp?: () => void;
}

export default function CustomerAnswerIntakePanel({
  onCreateChangeRequest,
  onCreateFollowUp
}: CustomerAnswerIntakePanelProps) {
  const [answer, setAnswer] = useState('');
  const result = useMemo(() => classifyCustomerAnswer(answer), [answer]);
  const hasAnswer = answer.trim().length > 0;

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

          {hasAnswer && (
            <div className="mt-2 flex items-center justify-end border-t border-border/50 pt-3">
              {result.intent === 'approval' && (
                <button 
                  type="button" 
                  disabled
                  className="btn btn-primary text-xs py-1.5 opacity-50 cursor-not-allowed"
                >
                  Use lifecycle next action
                </button>
              )}
              {result.intent === 'clarification' && (
                <button 
                  type="button" 
                  onClick={onCreateFollowUp}
                  className="btn btn-primary text-xs py-1.5"
                >
                  Prepare follow-up
                </button>
              )}
              {result.intent === 'rejection' && (
                <button 
                  type="button" 
                  disabled
                  className="btn btn-primary text-xs py-1.5 opacity-50 cursor-not-allowed"
                >
                  Start revision review
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
