import type { DiscoverySession } from '../../lib/ai/brief-assistant/discoverySession';
import BriefReadinessPanel from './BriefReadinessPanel';

interface DiscoveryWorkspaceProps {
  session: DiscoverySession;
  answerDraft: string;
  onAnswerDraftChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onGenerateBrief: () => void;
  onGenerateScope: () => void;
  onGenerateQuotation: () => void;
}

function statusLabel(status: DiscoverySession['status']): string {
  if (status === 'ready_for_quotation') return 'Ready for Quotation';
  if (status === 'ready_for_scope') return 'Ready for Scope';
  if (status === 'ready_for_brief') return 'Ready for Brief';
  return 'Collecting Requirements';
}

export default function DiscoveryWorkspace({
  session,
  answerDraft,
  onAnswerDraftChange,
  onSubmitAnswer,
  onGenerateBrief,
  onGenerateScope,
  onGenerateQuotation,
}: DiscoveryWorkspaceProps) {
  const turns = session.conversation.turns;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-2/60 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text">Discovery Workspace</h3>
          <p className="text-xs text-text-muted leading-relaxed mt-1">ถาม-ตอบจน requirement พร้อมก่อนสร้าง Brief, Scope และ Quotation</p>
        </div>
        <span className="badge badge-muted text-[10px]">{statusLabel(session.status)}</span>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="space-y-4 min-w-0">
          <div className="rounded-xl border border-border bg-surface-2/60 p-3">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Customer Request</p>
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{session.rawRequest}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface-2/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Conversation Timeline</p>
              <span className="text-[11px] text-text-muted">{turns.length} answers</span>
            </div>
            {turns.length === 0 ? (
              <p className="text-xs text-text-muted leading-relaxed">ยังไม่มีคำตอบเพิ่มเติม เริ่มจากคำถามถัดไปด้านล่าง</p>
            ) : (
              <div className="space-y-2">
                {turns.map((turn, index) => (
                  <div key={`${turn.sourceQuestionId || 'turn'}-${index}`} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-[10px] font-semibold text-primary mb-1">{turn.role === 'customer' ? 'Customer Answer' : 'Note'}</p>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{turn.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {session.conversation.nextQuestion && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 space-y-3">
              <p className="text-[11px] font-bold text-warning uppercase tracking-wider">Next Best Question</p>
              <p className="text-sm font-semibold text-text leading-relaxed">{session.conversation.nextQuestion.question}</p>
              <textarea
                value={answerDraft}
                onChange={(event) => onAnswerDraftChange(event.target.value)}
                rows={4}
                className="form-textarea text-sm"
                placeholder="วางคำตอบลูกค้าหรือ note เพิ่มเติมที่นี่..."
              />
              <button
                type="button"
                onClick={onSubmitAnswer}
                disabled={!answerDraft.trim()}
                className="btn btn-primary text-xs"
              >
                บันทึกคำตอบและประเมินใหม่
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <BriefReadinessPanel readiness={session.conversation.readiness} />

          <div className="rounded-xl border border-border bg-surface-2/60 p-3 space-y-2">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Next Action</p>
            <p className="text-sm font-semibold text-text leading-relaxed">{session.nextActionLabel}</p>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button type="button" onClick={onGenerateBrief} disabled={!session.canGenerateBrief} className="btn btn-primary text-xs justify-center">Generate Brief</button>
              <button type="button" onClick={onGenerateScope} disabled={!session.canGenerateScope} className="btn btn-outline text-xs justify-center">Generate Scope</button>
              <button type="button" onClick={onGenerateQuotation} disabled={!session.canGenerateQuotation} className="btn btn-outline text-xs justify-center">Generate Quotation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
