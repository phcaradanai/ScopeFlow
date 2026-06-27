import { useMemo, useState } from 'react';
import { Clipboard, FileInput, FileSignature, FileWarning, ShieldQuestion, TriangleAlert } from 'lucide-react';
import type { ScopeBaselineFromQuote } from '../lib/ai/scope-baseline/scopeBaselineFromQuote';
import { detectChangeRequest } from '../lib/ai/change-request/changeRequestDetection';
import { buildChangeRequestDetectionMarkdown } from '../lib/ai/change-request/changeRequestMarkdown';
import { buildChangeRequestDocument, buildChangeRequestDocumentMarkdown } from '../lib/ai/change-request/changeRequestDocument';
import { evaluateChangeRequestApproval, type ChangeRequestApprovalStatus } from '../lib/ai/change-request/changeRequestApproval';
import { injectChangeRequestApprovalMarkdown } from '../lib/ai/change-request/changeRequestApprovalMarkdown';

interface ChangeRequestDetectionPanelProps {
  baseline: ScopeBaselineFromQuote;
  onApplyChangeRequestDraft?: (requestId: string, markdown: string) => void;
}

function decisionClass(decision: string) {
  if (decision === 'likely_change_request') return 'border-error/30 bg-error/10 text-error';
  if (decision === 'needs_review') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-success/30 bg-success/10 text-success';
}

export default function ChangeRequestDetectionPanel({ baseline, onApplyChangeRequestDraft }: ChangeRequestDetectionPanelProps) {
  const [newRequest, setNewRequest] = useState('');
  const [requestId, setRequestId] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [requestedAt, setRequestedAt] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ChangeRequestApprovalStatus>('draft');
  const [sentAt, setSentAt] = useState('');
  const [approvedAt, setApprovedAt] = useState('');
  const [rejectedAt, setRejectedAt] = useState('');
  const [approvalRef, setApprovalRef] = useState('');
  const [approverName, setApproverName] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  const result = useMemo(() => detectChangeRequest({ new_request: newRequest, baseline }), [newRequest, baseline]);
  const markdown = useMemo(() => buildChangeRequestDetectionMarkdown(newRequest, result), [newRequest, result]);
  const crDocument = useMemo(() => buildChangeRequestDocument({
    request_id: requestId,
    new_request: newRequest,
    baseline,
    detection: result,
    requested_by: requestedBy,
    requested_at: requestedAt,
  }), [requestId, newRequest, baseline, result, requestedBy, requestedAt]);
  const crDocumentMarkdown = useMemo(() => buildChangeRequestDocumentMarkdown(crDocument), [crDocument]);
  const approval = useMemo(() => evaluateChangeRequestApproval({
    status: approvalStatus,
    sent_at: sentAt,
    approved_at: approvedAt,
    rejected_at: rejectedAt,
    approval_ref: approvalRef,
    approver_name: approverName,
    note: approvalNote,
  }), [approvalStatus, sentAt, approvedAt, rejectedAt, approvalRef, approverName, approvalNote]);
  const crDocumentWithApprovalMarkdown = useMemo(
    () => injectChangeRequestApprovalMarkdown(crDocumentMarkdown, approval),
    [crDocumentMarkdown, approval]
  );

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  const copyCrDocumentMarkdown = async () => {
    await navigator.clipboard.writeText(crDocumentWithApprovalMarkdown);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <ShieldQuestion className="w-4 h-4 text-primary" /> Change Request Detection
          </h3>
          <p className="text-xs text-text-muted mt-1">ตรวจคำขอใหม่ของลูกค้าเทียบกับ scope baseline ที่ approved แล้ว</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${decisionClass(result.decision)}`}>
          {result.decision}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="text-xs font-bold text-text mb-1 block">New Customer Request</label>
            <textarea
              value={newRequest}
              onChange={(event) => setNewRequest(event.target.value)}
              placeholder="วางคำขอใหม่จากลูกค้า เช่น ขอเพิ่ม mobile app, ขอเพิ่ม payment gateway, ขอเพิ่ม dashboard..."
              className="w-full min-h-[180px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">CR/DCR ID</label>
              <input value={requestId} onChange={(event) => setRequestId(event.target.value)} placeholder="CR-001" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Requested By</label>
              <input value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} placeholder="ลูกค้า/ผู้ขอ" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Requested At</label>
              <input value={requestedAt} onChange={(event) => setRequestedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">CR Approval Status</label>
                <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as ChangeRequestApprovalStatus)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary">
                  <option value="draft">draft</option>
                  <option value="ready_to_send">ready_to_send</option>
                  <option value="sent">sent</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="revision_needed">revision_needed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Sent At</label>
                <input value={sentAt} onChange={(event) => setSentAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approved At</label>
                <input value={approvedAt} onChange={(event) => setApprovedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Rejected At</label>
                <input value={rejectedAt} onChange={(event) => setRejectedAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approval Ref</label>
                <input value={approvalRef} onChange={(event) => setApprovalRef(event.target.value)} placeholder="signed CR / email / PO" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Approver</label>
                <input value={approverName} onChange={(event) => setApproverName(event.target.value)} placeholder="ชื่อผู้อนุมัติ" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Approval Note</label>
              <textarea value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} placeholder="ช่องทาง/หมายเหตุการอนุมัติ" className="w-full min-h-[72px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Change Request</p>
              <p className={`text-lg font-bold ${result.is_change_request ? 'text-error' : 'text-success'}`}>{result.is_change_request ? 'yes' : 'no'}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Impact</p>
              <p className="text-lg font-bold text-text">{result.impact}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">CR Status</p>
              <p className={`text-sm font-bold ${crDocument.approval_required_before_work ? 'text-error' : 'text-success'}`}>{crDocument.status}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Can Start</p>
              <p className={`text-lg font-bold ${approval.can_start_work ? 'text-success' : 'text-warning'}`}>{approval.can_start_work ? 'yes' : 'no'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
            <FileWarning className="w-4 h-4 text-primary inline-block mr-1" />
            {approval.recommended_next_action}
          </div>

          {result.matched.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h4 className="text-xs font-bold text-text mb-2">Matched Baseline Items</h4>
              <ul className="space-y-2 text-xs text-text-muted leading-relaxed list-disc pl-4">
                {result.matched.map((match, index) => (
                  <li key={`${match.source}-${index}`}>
                    <span className="font-semibold text-text">{match.source}</span>: {match.matched_text}
                    <p className="text-text-dim">{match.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {approval.warnings.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
              <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Approval Warnings</h4>
              <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
                {approval.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
            <div className="p-3 border-b border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-primary-light">Change Request / DCR Draft + Approval Lock</h4>
                <p className="text-[11px] text-text-muted mt-1">copy หรือ apply เอกสารนี้เป็น CR/DCR draft พร้อม approval gate</p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                {onApplyChangeRequestDraft && (
                  <button type="button" onClick={() => onApplyChangeRequestDraft(crDocument.request_id, crDocumentWithApprovalMarkdown)} className="btn btn-primary text-xs gap-2 w-full md:w-auto">
                    <FileInput className="w-4 h-4" /> Apply CR/DCR Draft
                  </button>
                )}
                <button type="button" onClick={copyCrDocumentMarkdown} className="btn btn-outline text-xs gap-2 w-full md:w-auto">
                  <FileSignature className="w-4 h-4" /> Copy CR/DCR Draft
                </button>
                <button type="button" onClick={copyMarkdown} className="btn btn-outline text-xs gap-2 w-full md:w-auto">
                  <Clipboard className="w-4 h-4" /> Copy Detection
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono p-3 max-h-[240px] overflow-y-auto">{crDocumentWithApprovalMarkdown}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
