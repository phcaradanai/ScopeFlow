import { AlertTriangle, CheckCircle2, FileSpreadsheet, ListChecks, ShieldCheck, WalletCards } from 'lucide-react';
import type { QuotationDraft } from '../lib/ai/quotation/quotationDraft';
import QuotationApprovalPanel from './QuotationApprovalPanel';
import QuotationPriceInputPanel from './QuotationPriceInputPanel';

interface QuotationDraftPanelProps {
  draft: QuotationDraft;
  onApplyFinalQuoteSummary?: (markdown: string) => void;
  onApplyApprovalLock?: (markdown: string) => void;
  onApplyScopeBaseline?: (markdown: string) => void;
  onApplyChangeRequestDraft?: (requestId: string, markdown: string) => void;
}

function statusClass(status: QuotationDraft['status']) {
  if (status === 'draft_ready') return 'border-success/30 bg-success/10 text-success';
  if (status === 'draft_needs_review') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-error/30 bg-error/10 text-error';
}

function emptyAwareList(items: string[], empty: string) {
  if (items.length === 0) return <li className="text-text-muted">{empty}</li>;
  return items.map(item => <li key={item}>{item}</li>);
}

export default function QuotationDraftPanel({ draft, onApplyFinalQuoteSummary, onApplyApprovalLock, onApplyScopeBaseline, onApplyChangeRequestDraft }: QuotationDraftPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" /> Quotation Draft Review
          </h3>
          <p className="text-xs text-text-muted mt-1">Preview ใบเสนอราคา draft แบบอ่านง่าย ยังไม่ใส่ราคาจริงแทนมนุษย์</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${statusClass(draft.status)}`}>
          {draft.status}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Pricing Model</p>
          <p className="text-sm font-bold text-primary-light">{draft.pricing_model}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Man-hours</p>
          <p className="text-sm font-bold text-text">{draft.total_man_hours_min}–{draft.total_man_hours_max} ชม.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Line Items</p>
          <p className="text-xl font-bold text-text">{draft.line_items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Blockers</p>
          <p className={`text-xl font-bold ${draft.pricing_blockers.length > 0 ? 'text-warning' : 'text-success'}`}>{draft.pricing_blockers.length}</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className={`rounded-xl border p-3 text-xs leading-relaxed ${statusClass(draft.status)}`}>
          {draft.status === 'draft_ready' ? <CheckCircle2 className="w-4 h-4 inline-block mr-1" /> : <AlertTriangle className="w-4 h-4 inline-block mr-1" />}
          {draft.recommended_next_action}
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 xl:col-span-2">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><WalletCards className="w-4 h-4 text-primary" /> Line Items / Deliverables</h4>
          {draft.line_items.length === 0 ? (
            <p className="text-xs text-text-muted">ยังไม่มี line item</p>
          ) : (
            <div className="space-y-2">
              {draft.line_items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-muted leading-relaxed">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text">{index + 1}. {item.title}</p>
                      <p>{item.description}</p>
                    </div>
                    <span className="badge badge-muted w-fit">{item.man_hours_min}–{item.man_hours_max} ชม.</span>
                  </div>
                  <p className="mt-2 text-text-dim">{item.pricing_note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Assumptions & Exclusions</h4>
          <p className="text-[11px] font-bold text-text-muted mb-1">Assumptions</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4 mb-3">
            {emptyAwareList(draft.assumptions, 'ยังไม่มี assumption')}
          </ul>
          <p className="text-[11px] font-bold text-text-muted mb-1">Exclusions / Boundaries</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(draft.exclusions, 'ยังไม่มี exclusion/boundary')}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Pricing Blockers & Confirmations</h4>
          <p className="text-[11px] font-bold text-text-muted mb-1">Pricing Blockers</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4 mb-3">
            {emptyAwareList(draft.pricing_blockers, 'ไม่มี pricing blocker หลัก')}
          </ul>
          <p className="text-[11px] font-bold text-text-muted mb-1">Customer Confirmations Required</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(draft.customer_confirmations_required, 'ไม่มีรายการที่ต้องยืนยันเพิ่มก่อนส่ง quote')}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" /> CR Triggers</h4>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(draft.change_request_triggers, 'ยังไม่มี CR trigger')}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Acceptance Criteria</h4>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(draft.acceptance_criteria, 'ยังไม่มี acceptance criteria')}
          </ul>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        <QuotationPriceInputPanel draft={draft} onApplyFinalQuoteSummary={onApplyFinalQuoteSummary} onApplyScopeBaseline={onApplyScopeBaseline} onApplyChangeRequestDraft={onApplyChangeRequestDraft} />
        <QuotationApprovalPanel onApplyApprovalLock={onApplyApprovalLock} />
      </div>
    </div>
  );
}
