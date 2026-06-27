import { CheckCircle2, Circle, FileLock2, HelpCircle, LockKeyhole, Quote, ShieldCheck } from 'lucide-react';
import type { ScopeClosureGateResult } from '../lib/ai/scope-closure/scopeClosureGate';

interface ScopeClosurePanelProps {
  gate: ScopeClosureGateResult;
}

function statusLabel(status: ScopeClosureGateResult['scope_closure_status']) {
  if (status === 'locked') return 'ล็อก Scope แล้ว';
  if (status === 'ready_for_quote') return 'พร้อมทำ Quotation';
  if (status === 'needs_customer_answers') return 'ต้องรอคำตอบลูกค้า';
  return 'ยังเปิดอยู่';
}

function statusClass(status: ScopeClosureGateResult['scope_closure_status']) {
  if (status === 'locked') return 'bg-success/10 text-success border-success/20';
  if (status === 'ready_for_quote') return 'bg-primary/10 text-primary-light border-primary/20';
  if (status === 'needs_customer_answers') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-error/10 text-error border-error/20';
}

function ChecklistRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
      {ok ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-text-dim flex-shrink-0 mt-0.5" />}
      <span>{label}</span>
    </li>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-xs text-text-muted">{empty}</p>;
  return (
    <ul className="space-y-1.5 text-xs text-text-muted leading-relaxed">
      {items.map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
    </ul>
  );
}

export default function ScopeClosurePanel({ gate }: ScopeClosurePanelProps) {
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${statusClass(gate.scope_closure_status)}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold opacity-80 flex items-center gap-2">
              <FileLock2 className="w-4 h-4" /> Scope Closure Gate
            </p>
            <h3 className="text-lg font-bold">{statusLabel(gate.scope_closure_status)}</h3>
            <p className="text-xs mt-1 opacity-80">Closure Score: {gate.closure_score}/100</p>
          </div>
          <p className="text-xs leading-relaxed lg:text-right max-w-2xl">
            {gate.recommended_next_action}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" /> Closure Checklist
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ChecklistRow ok={gate.checklist.has_confirmed_scope} label="มี confirmed/assumed scope item สำหรับตั้งต้น" />
            <ChecklistRow ok={gate.checklist.has_no_critical_questions} label="คำถามสำคัญก่อนเสนอราคาถูกตอบหรือ waive แล้ว" />
            <ChecklistRow ok={gate.checklist.has_boundary_clauses} label="มี boundary / out-of-scope clause" />
            <ChecklistRow ok={gate.checklist.has_acceptance_criteria} label="มี acceptance criteria หรือ acceptance risk" />
            <ChecklistRow ok={gate.checklist.has_estimation_factors} label="มี estimation factor / man-hour reasoning" />
            <ChecklistRow ok={gate.checklist.has_pricing_model} label="มี pricing model recommendation" />
            <ChecklistRow ok={gate.checklist.has_customer_approval} label="มี customer approval สำหรับ lock baseline" />
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <Quote className="w-4 h-4 text-primary" /> Quote-ready Summary
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">{gate.quote_ready_summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-error" /> สิ่งที่ยัง Block การปิด Scope
          </h3>
          <List items={gate.blocking_items.slice(0, 10)} empty="ไม่มี blocking item หลัก" />
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-warning" /> คำถามที่ต้องถามลูกค้าเพื่อปิด Scope
          </h3>
          <List items={gate.customer_questions.slice(0, 10)} empty="ไม่มีคำถามค้างก่อนปิด Scope" />
        </div>
      </div>
    </div>
  );
}
