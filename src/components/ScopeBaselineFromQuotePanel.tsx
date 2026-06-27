import { useMemo, useState } from 'react';
import { Clipboard, FileInput, GitBranchPlus, ShieldCheck, TriangleAlert } from 'lucide-react';
import { evaluateQuotationApproval } from '../lib/ai/quotation/quotationApproval';
import type { QuotationDraft } from '../lib/ai/quotation/quotationDraft';
import type { QuotationPricingResult } from '../lib/ai/quotation/quotationPricing';
import { buildScopeBaselineMarkdown } from '../lib/ai/scope-baseline/scopeBaselineMarkdown';
import { buildScopeBaselineFromApprovedQuote } from '../lib/ai/scope-baseline/scopeBaselineFromQuote';
import ChangeRequestDetectionPanel from './ChangeRequestDetectionPanel';

interface ScopeBaselineFromQuotePanelProps {
  quotation: QuotationDraft;
  pricing: QuotationPricingResult;
  onApplyScopeBaseline?: (markdown: string) => void;
  onApplyChangeRequestDraft?: (requestId: string, markdown: string) => void;
}

export default function ScopeBaselineFromQuotePanel({ quotation, pricing, onApplyScopeBaseline, onApplyChangeRequestDraft }: ScopeBaselineFromQuotePanelProps) {
  const [quotationPath, setQuotationPath] = useState('baseline/quotation-draft-v1.0.md');
  const [scopePath, setScopePath] = useState('baseline/scope-v1.0.md');
  const [approvedAt, setApprovedAt] = useState('');
  const [approvalRef, setApprovalRef] = useState('');
  const [approverName, setApproverName] = useState('');

  const approval = useMemo(() => evaluateQuotationApproval({
    status: 'approved',
    approved_at: approvedAt,
    approval_ref: approvalRef,
    approver_name: approverName,
  }), [approvedAt, approvalRef, approverName]);

  const baseline = useMemo(() => buildScopeBaselineFromApprovedQuote({
    quotation_path: quotationPath,
    scope_path: scopePath,
    quotation,
    pricing,
    approval,
  }), [quotationPath, scopePath, quotation, pricing, approval]);

  const markdown = useMemo(() => buildScopeBaselineMarkdown(baseline), [baseline]);

  const copyBaselineMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <GitBranchPlus className="w-4 h-4 text-primary" /> Scope Baseline From Approved Quote
            </h3>
            <p className="text-xs text-text-muted mt-1">ล็อก scope/ราคา/เงื่อนไขจาก quotation ที่ลูกค้าอนุมัติแล้ว</p>
          </div>
          <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${baseline.status === 'baseline_ready' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
            {baseline.status}
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Quotation Path</label>
                <input value={quotationPath} onChange={(event) => setQuotationPath(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Scope Path</label>
                <input value={scopePath} onChange={(event) => setScopePath(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approved At</label>
                <input value={approvedAt} onChange={(event) => setApprovedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approval Ref</label>
                <input value={approvalRef} onChange={(event) => setApprovalRef(event.target.value)} placeholder="email / signed quote / PO" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approver</label>
                <input value={approverName} onChange={(event) => setApproverName(event.target.value)} placeholder="ชื่อผู้อนุมัติ" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] text-text-muted">Locked Total</p>
                <p className="text-sm font-bold text-text">{baseline.locked_currency} {baseline.locked_total.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] text-text-muted">Exclusions</p>
                <p className="text-lg font-bold text-text">{baseline.locked_exclusions.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] text-text-muted">CR Triggers</p>
                <p className="text-lg font-bold text-text">{baseline.change_request_triggers.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] text-text-muted">Warnings</p>
                <p className={`text-lg font-bold ${baseline.warnings.length > 0 ? 'text-warning' : 'text-success'}`}>{baseline.warnings.length}</p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-primary inline-block mr-1" />
              {baseline.recommended_next_action}
            </div>

            {baseline.warnings.length > 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Baseline Warnings</h4>
                <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
                  {baseline.warnings.map(warning => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
              <div className="p-3 border-b border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-primary-light">Scope Baseline Markdown</h4>
                  <p className="text-[11px] text-text-muted mt-1">copy หรือ apply ส่วนนี้เข้า quotation draft เพื่อใช้คุม CR/DCR</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  {onApplyScopeBaseline && (
                    <button type="button" onClick={() => onApplyScopeBaseline(markdown)} className="btn btn-primary text-xs gap-2 w-full md:w-auto">
                      <FileInput className="w-4 h-4" /> Apply Baseline
                    </button>
                  )}
                  <button type="button" onClick={copyBaselineMarkdown} className="btn btn-outline text-xs gap-2 w-full md:w-auto">
                    <Clipboard className="w-4 h-4" /> Copy Baseline
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono p-3 max-h-[240px] overflow-y-auto">{markdown}</pre>
            </div>
          </div>
        </div>
      </div>

      <ChangeRequestDetectionPanel baseline={baseline} onApplyChangeRequestDraft={onApplyChangeRequestDraft} />
    </div>
  );
}
