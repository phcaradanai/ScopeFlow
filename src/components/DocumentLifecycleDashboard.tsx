import { CheckCircle2, CircleDashed, FileClock, LockKeyhole, OctagonAlert } from 'lucide-react';
import type { DocumentLifecycleInput, DocumentLifecycleItem, LifecycleItemStatus } from '../lib/ai/document-lifecycle/documentLifecycle';
import { buildDocumentLifecycleSummary } from '../lib/ai/document-lifecycle/documentLifecycle';

interface DocumentLifecycleDashboardProps {
  input: DocumentLifecycleInput;
}

function statusClass(status: LifecycleItemStatus): string {
  if (status === 'signed_off' || status === 'approved' || status === 'ready') return 'border-success/30 bg-success/10 text-success';
  if (status === 'blocked') return 'border-error/30 bg-error/10 text-error';
  if (status === 'draft') return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-border bg-surface text-text-muted';
}

function statusIcon(status: LifecycleItemStatus) {
  if (status === 'signed_off' || status === 'approved' || status === 'ready') return <CheckCircle2 className="w-4 h-4" />;
  if (status === 'blocked') return <OctagonAlert className="w-4 h-4" />;
  if (status === 'draft') return <FileClock className="w-4 h-4" />;
  return <CircleDashed className="w-4 h-4" />;
}

function LifecycleItemCard({ item }: { item: DocumentLifecycleItem }) {
  return (
    <div className={`rounded-xl border p-3 ${statusClass(item.status)}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {statusIcon(item.status)}
          <p className="text-xs font-bold text-text">{item.label}</p>
        </div>
        <span className="text-[10px] font-bold uppercase">{item.status}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-text-muted">{item.recommended_next_action}</p>
    </div>
  );
}

export default function DocumentLifecycleDashboard({ input }: DocumentLifecycleDashboardProps) {
  const summary = buildDocumentLifecycleSummary(input);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-primary" /> Document Lifecycle Dashboard
          </h3>
          <p className="text-xs text-text-muted mt-1">สรุปสถานะเอกสารหลักและ action ถัดไปของงานรอบนี้</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase w-fit ${summary.can_close_work ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
          Can Close: {summary.can_close_work ? 'yes' : 'no'}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] text-text-muted">Ready</p>
            <p className="text-xl font-bold text-success">{summary.ready_count}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] text-text-muted">Blocked</p>
            <p className="text-xl font-bold text-error">{summary.blocked_count}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] text-text-muted">Missing</p>
            <p className="text-xl font-bold text-text-muted">{summary.missing_count}</p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
          <span className="font-bold text-primary-light">Next Action:</span> {summary.next_action}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {summary.items.map(item => <LifecycleItemCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}
