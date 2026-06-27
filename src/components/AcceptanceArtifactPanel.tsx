import { useMemo, useState } from 'react';
import { Clipboard, FileCheck2, FileInput, TriangleAlert } from 'lucide-react';
import { buildAcceptanceArtifact, type AcceptanceCriteriaCheck } from '../lib/ai/acceptance/acceptanceArtifact';
import { buildAcceptanceArtifactMarkdown } from '../lib/ai/acceptance/acceptanceArtifactMarkdown';

interface AcceptanceArtifactPanelProps {
  onApplyAcceptanceArtifact?: (artifactId: string, markdown: string) => void;
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function buildCriteria(value: string): AcceptanceCriteriaCheck[] {
  return splitLines(value).map(line => ({ criteria: line, status: 'passed' as const }));
}

export default function AcceptanceArtifactPanel({ onApplyAcceptanceArtifact }: AcceptanceArtifactPanelProps) {
  const [artifactId, setArtifactId] = useState('ACC-001');
  const [scopeBaselinePath, setScopeBaselinePath] = useState('baseline/quotation-draft-v1.0.md');
  const [changeBaselinePaths, setChangeBaselinePaths] = useState('');
  const [deliveredItems, setDeliveredItems] = useState('');
  const [criteriaText, setCriteriaText] = useState('');
  const [pendingItems, setPendingItems] = useState('');
  const [outOfScopeItems, setOutOfScopeItems] = useState('');
  const [crRequiredItems, setCrRequiredItems] = useState('');
  const [signoffBy, setSignoffBy] = useState('');
  const [signoffAt, setSignoffAt] = useState('');
  const [signoffRef, setSignoffRef] = useState('');

  const artifact = useMemo(() => buildAcceptanceArtifact({
    artifact_id: artifactId,
    source_scope_baseline_path: scopeBaselinePath,
    source_change_baseline_paths: splitLines(changeBaselinePaths),
    delivered_items: splitLines(deliveredItems),
    acceptance_criteria: buildCriteria(criteriaText),
    pending_items: splitLines(pendingItems),
    out_of_scope_items: splitLines(outOfScopeItems),
    change_request_required_items: splitLines(crRequiredItems),
    signoff_by: signoffBy,
    signoff_at: signoffAt,
    signoff_ref: signoffRef,
  }), [artifactId, scopeBaselinePath, changeBaselinePaths, deliveredItems, criteriaText, pendingItems, outOfScopeItems, crRequiredItems, signoffBy, signoffAt, signoffRef]);

  const markdown = useMemo(() => buildAcceptanceArtifactMarkdown(artifact), [artifact]);

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-primary" /> Acceptance / Sign-off Artifact
          </h3>
          <p className="text-xs text-text-muted mt-1">สร้างเอกสารตรวจรับงานโดยอ้างอิง baseline และ criteria ที่ส่งมอบจริง</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${artifact.status === 'signed_off' ? 'border-success/30 bg-success/10 text-success' : artifact.status === 'blocked' ? 'border-error/30 bg-error/10 text-error' : 'border-warning/30 bg-warning/10 text-warning'}`}>
          {artifact.status}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Acceptance ID</label>
              <input value={artifactId} onChange={(event) => setArtifactId(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Scope Baseline Path</label>
              <input value={scopeBaselinePath} onChange={(event) => setScopeBaselinePath(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Change Baseline Paths</label>
              <textarea value={changeBaselinePaths} onChange={(event) => setChangeBaselinePaths(event.target.value)} placeholder="changes/CR-001-draft.md" className="w-full min-h-[72px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Delivered Items</label>
              <textarea value={deliveredItems} onChange={(event) => setDeliveredItems(event.target.value)} placeholder="ใส่ 1 รายการต่อ 1 บรรทัด" className="w-full min-h-[96px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Passed Acceptance Criteria</label>
              <textarea value={criteriaText} onChange={(event) => setCriteriaText(event.target.value)} placeholder="ใส่ criteria ที่ผ่านแล้ว 1 รายการต่อ 1 บรรทัด" className="w-full min-h-[96px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Pending Items</label>
              <textarea value={pendingItems} onChange={(event) => setPendingItems(event.target.value)} className="w-full min-h-[96px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Out of Scope</label>
              <textarea value={outOfScopeItems} onChange={(event) => setOutOfScopeItems(event.target.value)} className="w-full min-h-[96px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">CR Required</label>
              <textarea value={crRequiredItems} onChange={(event) => setCrRequiredItems(event.target.value)} className="w-full min-h-[96px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Sign-off By</label>
              <input value={signoffBy} onChange={(event) => setSignoffBy(event.target.value)} placeholder="ชื่อผู้ sign-off" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Sign-off At</label>
              <input value={signoffAt} onChange={(event) => setSignoffAt(event.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Sign-off Ref</label>
              <input value={signoffRef} onChange={(event) => setSignoffRef(event.target.value)} placeholder="signed email / UAT form" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Passed</p>
              <p className="text-lg font-bold text-success">{artifact.passed_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Pending</p>
              <p className="text-lg font-bold text-warning">{artifact.pending_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Failed</p>
              <p className="text-lg font-bold text-error">{artifact.failed_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Can Close</p>
              <p className={`text-lg font-bold ${artifact.can_close_work ? 'text-success' : 'text-warning'}`}>{artifact.can_close_work ? 'yes' : 'no'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
            <FileCheck2 className="w-4 h-4 text-primary inline-block mr-1" />
            {artifact.recommended_next_action}
          </div>

          {artifact.warnings.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
              <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Acceptance Warnings</h4>
              <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
                {artifact.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
            <div className="p-3 border-b border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-primary-light">Acceptance / Sign-off Markdown</h4>
                <p className="text-[11px] text-text-muted mt-1">copy หรือ apply เป็นเอกสาร acceptance/sign-off</p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                {onApplyAcceptanceArtifact && (
                  <button type="button" onClick={() => onApplyAcceptanceArtifact(artifact.artifact_id, markdown)} className="btn btn-primary text-xs gap-2 w-full md:w-auto">
                    <FileInput className="w-4 h-4" /> Apply Acceptance
                  </button>
                )}
                <button type="button" onClick={copyMarkdown} className="btn btn-outline text-xs gap-2 w-full md:w-auto">
                  <Clipboard className="w-4 h-4" /> Copy Acceptance
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono p-3 max-h-[240px] overflow-y-auto">{markdown}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
