import { useMemo, useState } from 'react';
import { FileLock2, FileInput, ShieldCheck, TriangleAlert } from 'lucide-react';
import { buildQuotationApprovalMarkdown } from '../lib/ai/quotation/quotationApprovalMarkdown';
import { evaluateQuotationApproval, type QuotationApprovalStatus } from '../lib/ai/quotation/quotationApproval';

interface QuotationApprovalPanelProps {
  onApplyApprovalLock?: (markdown: string) => void;
}

function statusClass(status: QuotationApprovalStatus) {
  if (status === 'approved') return 'border-success/30 bg-success/10 text-success';
  if (status === 'rejected') return 'border-error/30 bg-error/10 text-error';
  if (status === 'revision_needed') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-primary/30 bg-primary/10 text-primary-light';
}

export default function QuotationApprovalPanel({ onApplyApprovalLock }: QuotationApprovalPanelProps) {
  const [status, setStatus] = useState<QuotationApprovalStatus>('draft');
  const [sentAt, setSentAt] = useState('');
  const [approvedAt, setApprovedAt] = useState('');
  const [rejectedAt, setRejectedAt] = useState('');
  const [approvalRef, setApprovalRef] = useState('');
  const [approverName, setApproverName] = useState('');
  const [note, setNote] = useState('');

  const result = useMemo(() => evaluateQuotationApproval({
    status,
    sent_at: sentAt,
    approved_at: approvedAt,
    rejected_at: rejectedAt,
    approval_ref: approvalRef,
    approver_name: approverName,
    note,
  }), [status, sentAt, approvedAt, rejectedAt, approvalRef, approverName, note]);

  const markdown = useMemo(() => buildQuotationApprovalMarkdown(result), [result]);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <FileLock2 className="w-4 h-4 text-primary" /> Quotation Approval Lock
          </h3>
          <p className="text-xs text-text-muted mt-1">ติดตามสถานะใบเสนอราคา และล็อก baseline เมื่อได้รับอนุมัติจากลูกค้า</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${statusClass(status)}`}>
          {status}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-text mb-1 block">Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value as QuotationApprovalStatus)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary">
              <option value="draft">Draft</option>
              <option value="ready_to_send">Ready to Send</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revision_needed">Revision Needed</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Sent At</label>
              <input value={sentAt} onChange={(event) => setSentAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Approved At</label>
              <input value={approvedAt} onChange={(event) => setApprovedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Rejected At</label>
              <input value={rejectedAt} onChange={(event) => setRejectedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Approval Ref</label>
              <input value={approvalRef} onChange={(event) => setApprovalRef(event.target.value)} placeholder="เช่น email / signed quote / PO no." className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Approver</label>
              <input value={approverName} onChange={(event) => setApproverName(event.target.value)} placeholder="ชื่อผู้อนุมัติ" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text mb-1 block">Note</label>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="w-full min-h-[80px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Locked</p>
              <p className={`text-lg font-bold ${result.locked ? 'text-success' : 'text-text'}`}>{result.locked ? 'yes' : 'no'}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Can Send</p>
              <p className="text-lg font-bold text-text">{result.can_send ? 'yes' : 'no'}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Can Revise</p>
              <p className="text-lg font-bold text-text">{result.can_revise ? 'yes' : 'no'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary inline-block mr-1" />
            {result.recommended_next_action}
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
              <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Approval Warnings</h4>
              <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
                {result.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
            <div className="p-3 border-b border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-primary-light">Approval Lock Markdown</h4>
                <p className="text-[11px] text-text-muted mt-1">apply ส่วนนี้เข้า quotation draft เพื่อบันทึกสถานะ</p>
              </div>
              {onApplyApprovalLock && (
                <button type="button" onClick={() => onApplyApprovalLock(markdown)} className="btn btn-primary text-xs gap-2 w-full md:w-auto">
                  <FileInput className="w-4 h-4" /> Apply Approval Lock
                </button>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono p-3 max-h-[220px] overflow-y-auto">{markdown}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
