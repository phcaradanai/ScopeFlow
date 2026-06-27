import { AlertTriangle, Calculator, CheckCircle2, FileText, Flag, ShieldCheck } from 'lucide-react';
import type { QuoteReadinessBrief } from '../lib/ai/quotation-readiness/quoteReadinessBridge';

interface QuoteReadinessPanelProps {
  brief: QuoteReadinessBrief;
}

function statusClass(status: QuoteReadinessBrief['status']) {
  if (status === 'ready') return 'border-success/30 bg-success/10 text-success';
  if (status === 'needs_review') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-error/30 bg-error/10 text-error';
}

function emptyAwareList(items: string[], empty: string) {
  if (items.length === 0) return <li className="text-text-muted">{empty}</li>;
  return items.map(item => <li key={item}>{item}</li>);
}

export default function QuoteReadinessPanel({ brief }: QuoteReadinessPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Quotation Readiness Brief
          </h3>
          <p className="text-xs text-text-muted mt-1">สรุปว่าพร้อมทำใบเสนอราคาหรือยัง และต้องแนบ assumption / boundary / CR trigger อะไรไปกับ quote</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${statusClass(brief.status)}`}>
          {brief.status}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Readiness</p>
          <p className="text-xl font-bold text-text">{brief.readiness_score}/100</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Pricing Model</p>
          <p className="text-sm font-bold text-primary-light">{brief.recommended_pricing_model}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Man-hours</p>
          <p className="text-sm font-bold text-text">{brief.total_man_hours_min}–{brief.total_man_hours_max} ชม.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] text-text-muted">Blockers</p>
          <p className={`text-xl font-bold ${brief.pricing_blockers.length > 0 ? 'text-warning' : 'text-success'}`}>{brief.pricing_blockers.length}</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className={`rounded-xl border p-3 text-xs leading-relaxed ${statusClass(brief.status)}`}>
          {brief.status === 'ready' ? <CheckCircle2 className="w-4 h-4 inline-block mr-1" /> : <AlertTriangle className="w-4 h-4 inline-block mr-1" />}
          {brief.recommended_next_action}
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Module / Deliverable Estimates</h4>
          {brief.module_estimates.length === 0 ? (
            <p className="text-xs text-text-muted">ยังไม่มี module estimate</p>
          ) : (
            <ul className="space-y-2 text-xs text-text-muted leading-relaxed">
              {brief.module_estimates.map(item => (
                <li key={item.module} className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="font-semibold text-text">{item.module}: {item.estimated_man_hours_min}–{item.estimated_man_hours_max} ชม.</p>
                  <p>Complexity: {item.complexity} · Risk buffer: {item.risk_buffer_percent}%</p>
                  {item.assumptions.length > 0 && <p>Assumptions: {item.assumptions.join('; ')}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-warning" /> Pricing Blockers</h4>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(brief.pricing_blockers, 'ไม่มี pricing blocker หลัก')}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Quote Assumptions & Boundaries</h4>
          <p className="text-[11px] font-bold text-text-muted mb-1">Assumptions</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4 mb-3">
            {emptyAwareList(brief.quote_assumptions, 'ยังไม่มี assumption สำหรับ quote')}
          </ul>
          <p className="text-[11px] font-bold text-text-muted mb-1">Boundary Clauses</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(brief.quote_boundary_clauses, 'ยังไม่มี boundary clause')}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> CR Triggers & Acceptance</h4>
          <p className="text-[11px] font-bold text-text-muted mb-1">Change Request Triggers</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4 mb-3">
            {emptyAwareList(brief.change_request_triggers, 'ยังไม่มี CR trigger')}
          </ul>
          <p className="text-[11px] font-bold text-text-muted mb-1">Acceptance Items</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {emptyAwareList(brief.acceptance_items, 'ยังไม่มี acceptance item')}
          </ul>
        </div>
      </div>
    </div>
  );
}
