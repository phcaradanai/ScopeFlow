import type { BriefReadinessResult } from '../../lib/ai/brief-assistant/briefReadiness';

interface BriefReadinessPanelProps {
  readiness: BriefReadinessResult;
}

function levelLabel(level: BriefReadinessResult['level']): string {
  if (level === 'draft_ready') return 'พร้อมสร้าง Brief Draft';
  if (level === 'needs_questions') return 'ควรถามเพิ่มก่อนล็อก Scope';
  return 'ยังคลุมเครือ';
}

function levelClassName(level: BriefReadinessResult['level']): string {
  if (level === 'draft_ready') return 'bg-success/10 text-success border-success/20';
  if (level === 'needs_questions') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-error/10 text-error border-error/20';
}

export default function BriefReadinessPanel({ readiness }: BriefReadinessPanelProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text">Brief Readiness</h3>
          <p className="text-xs text-text-muted leading-relaxed mt-1">{readiness.summary}</p>
        </div>
        <span className={`badge text-[10px] border shrink-0 ${levelClassName(readiness.level)}`}>
          {levelLabel(readiness.level)} · {readiness.percent}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden border border-border">
        <div className="h-full bg-primary" style={{ width: `${readiness.percent}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div className={`rounded-lg border p-2 ${readiness.canCreateBriefDraft ? 'border-success/20 bg-success/10 text-success' : 'border-error/20 bg-error/10 text-error'}`}>
          Brief: {readiness.canCreateBriefDraft ? 'สร้าง draft ได้' : 'ถามเพิ่มก่อน'}
        </div>
        <div className={`rounded-lg border p-2 ${readiness.shouldCreateScopeDraft ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}`}>
          Scope: {readiness.shouldCreateScopeDraft ? 'เริ่ม draft ได้' : 'ถามเพิ่มก่อน'}
        </div>
        <div className={`rounded-lg border p-2 ${readiness.shouldCreateQuotation ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}`}>
          Quotation: {readiness.shouldCreateQuotation ? 'เริ่มได้' : 'ยังไม่ควรเสนอ'}
        </div>
      </div>

      {readiness.suggestedQuestions.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/80 p-3">
          <p className="text-xs font-bold text-text mb-2">คำถามที่ควรถามลูกค้า</p>
          <ul className="space-y-1.5 text-xs text-text-muted leading-relaxed">
            {readiness.suggestedQuestions.map(question => (
              <li key={question}>- {question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
