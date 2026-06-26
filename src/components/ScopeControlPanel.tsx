import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, Timer, WalletCards } from 'lucide-react';
import type { ScopeControlOutput } from '../lib/ai/scope-control/scopeControlSchema';

interface ScopeControlPanelProps {
  control: ScopeControlOutput;
}

function readinessLabel(value: ScopeControlOutput['readiness_to_quote']) {
  if (value === 'ready') return 'พร้อมเสนอราคา';
  if (value === 'risky') return 'เสนอได้แต่เสี่ยง';
  return 'ยังไม่ควรเสนอราคา';
}

function readinessClass(value: ScopeControlOutput['readiness_to_quote']) {
  if (value === 'ready') return 'bg-success/10 text-success border-success/20';
  if (value === 'risky') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-error/10 text-error border-error/20';
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
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

export default function ScopeControlPanel({ control }: ScopeControlPanelProps) {
  const totalMinHours = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_min, 0);
  const totalMaxHours = control.estimation_factors.reduce((sum, factor) => sum + factor.estimated_man_hours_max, 0);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${readinessClass(control.readiness_to_quote)}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold opacity-80">Scope Readiness</p>
            <h3 className="text-lg font-bold">{readinessLabel(control.readiness_to_quote)}</h3>
            <p className="text-xs mt-1 opacity-80">Score: {control.readiness_score}/100</p>
          </div>
          <div className="text-xs leading-relaxed sm:text-right max-w-xl">
            {control.recommendation}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="ต้องถามก่อนเสนอราคา" icon={<HelpCircle className="w-4 h-4 text-warning" />}>
          <List items={control.must_ask_before_quote.slice(0, 10)} empty="ยังไม่มีคำถามบังคับก่อนเสนอราคา" />
        </Section>

        <Section title="Boundary / Out-of-Scope ที่ควรใส่" icon={<ShieldAlert className="w-4 h-4 text-primary" />}>
          <List items={control.suggested_boundary_clauses.slice(0, 10)} empty="ยังไม่มี boundary clause" />
        </Section>
      </div>

      <Section title="Scope Creep Traps / จุดที่ลูกค้าอาจขอเพิ่มเรื่อย ๆ" icon={<AlertTriangle className="w-4 h-4 text-warning" />}>
        {control.scope_creep_traps.length === 0 ? (
          <p className="text-xs text-text-muted">ยังไม่พบ scope creep trap</p>
        ) : (
          <div className="space-y-3">
            {control.scope_creep_traps.slice(0, 6).map((trap, index) => (
              <div key={`${trap.item}-${index}`} className="rounded-xl border border-border bg-surface p-3 text-xs text-text-muted leading-relaxed">
                <p className="font-semibold text-text mb-1">{trap.item}</p>
                <p><span className="font-semibold text-warning">เสี่ยงเพราะ:</span> {trap.why_risky}</p>
                <p><span className="font-semibold text-primary-light">จำกัดโดย:</span> {trap.how_to_limit}</p>
                <p><span className="font-semibold text-error">CR trigger:</span> {trap.change_request_trigger}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Man-hour / Estimation Factors" icon={<Timer className="w-4 h-4 text-info" />}>
          <div className="mb-3 rounded-xl bg-surface border border-border p-3 text-xs text-text-muted">
            รวมโดยประมาณ: <span className="font-bold text-text">{totalMinHours}–{totalMaxHours} ชั่วโมง</span>
          </div>
          <div className="space-y-2">
            {control.estimation_factors.slice(0, 6).map((factor, index) => (
              <div key={`${factor.module}-${index}`} className="rounded-xl bg-surface border border-border p-3 text-xs text-text-muted">
                <div className="flex justify-between gap-3 mb-1">
                  <span className="font-semibold text-text">{factor.module}</span>
                  <span className="font-mono">{factor.estimated_man_hours_min}–{factor.estimated_man_hours_max}h</span>
                </div>
                <p>Complexity: {factor.complexity} · Buffer: {factor.risk_buffer_percent}%</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Cost / Pricing Reasoning" icon={<WalletCards className="w-4 h-4 text-success" />}>
          <div className="rounded-xl bg-surface border border-border p-3 text-xs text-text-muted mb-3">
            Model ที่แนะนำ: <span className="font-bold text-text">{control.cost_reasoning.suggested_pricing_model}</span>
            <p className="mt-1 leading-relaxed">{control.cost_reasoning.why}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-text mb-1">ตัวขวางการเสนอราคา</p>
              <List items={control.cost_reasoning.pricing_blockers.slice(0, 6)} empty="ไม่มีตัวขวางหลัก" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text mb-1">ตัวขับต้นทุน</p>
              <List items={control.cost_reasoning.cost_drivers.slice(0, 6)} empty="ยังไม่มี cost driver" />
            </div>
          </div>
        </Section>
      </div>

      <Section title="Acceptance Risks / เกณฑ์ตรวจรับที่ต้องทำให้ชัด" icon={<CheckCircle2 className="w-4 h-4 text-success" />}>
        {control.acceptance_risks.length === 0 ? (
          <p className="text-xs text-text-muted">ยังไม่มี acceptance risk</p>
        ) : (
          <ul className="space-y-2 text-xs text-text-muted leading-relaxed">
            {control.acceptance_risks.slice(0, 8).map((risk, index) => (
              <li key={`${risk.scope_item}-${index}`} className="rounded-xl bg-surface border border-border p-3">
                <p className="font-semibold text-text">{risk.scope_item}</p>
                <p>ขาด: {risk.missing_acceptance_criteria}</p>
                <p>แนะนำ: {risk.suggested_acceptance_criteria}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
