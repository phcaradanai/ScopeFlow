import { CheckCircle2, CircleDashed, FileClock, LockKeyhole, OctagonAlert } from 'lucide-react';
import type { DocumentLifecycleSummary, LifecycleItemStatus } from '../../lib/ai/document-lifecycle/documentLifecycle';

export interface ProjectLifecycleRow {
  projectPath: string;
  projectName: string;
  clientName: string;
  summary: DocumentLifecycleSummary;
}

interface ProjectLifecycleListProps {
  rows: ProjectLifecycleRow[];
  onSelectProject: (path: string) => void;
}

function statusClass(status: LifecycleItemStatus): string {
  if (status === 'signed_off' || status === 'approved' || status === 'ready') return 'text-success';
  if (status === 'blocked') return 'text-error';
  if (status === 'draft') return 'text-warning';
  return 'text-text-dim';
}

function statusIcon(status: LifecycleItemStatus) {
  if (status === 'signed_off' || status === 'approved' || status === 'ready') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'blocked') return <OctagonAlert className="w-3.5 h-3.5" />;
  if (status === 'draft') return <FileClock className="w-3.5 h-3.5" />;
  return <CircleDashed className="w-3.5 h-3.5" />;
}

export default function ProjectLifecycleList({ rows, onSelectProject }: ProjectLifecycleListProps) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-base font-bold text-text flex items-center gap-2">
          <LockKeyhole className="w-4 h-4 text-primary" />
          Project Lifecycle จากไฟล์จริง
        </h3>
        <span className="badge badge-muted text-xs">{rows.length} projects</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-10 text-text-dim bg-surface-2/50 border border-border border-dashed rounded-xl">
          <CircleDashed className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">ยังไม่มี project ที่ scan lifecycle ได้</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {rows.map(row => (
            <button
              key={row.projectPath}
              type="button"
              onClick={() => onSelectProject(row.projectPath)}
              className="w-full text-left rounded-2xl border border-border bg-surface hover:bg-surface-2 hover:border-primary/40 transition-all p-4"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text truncate">{row.projectName}</p>
                  <p className="text-xs text-text-muted truncate">{row.clientName}</p>
                </div>
                <div className={`badge text-xs ${row.summary.can_close_work ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                  Can close: {row.summary.can_close_work ? 'yes' : 'no'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg border border-border bg-surface-2 p-2">
                  <p className="text-[10px] text-text-muted">Ready</p>
                  <p className="text-sm font-bold text-success">{row.summary.ready_count}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-2">
                  <p className="text-[10px] text-text-muted">Blocked</p>
                  <p className="text-sm font-bold text-error">{row.summary.blocked_count}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-2">
                  <p className="text-[10px] text-text-muted">Missing</p>
                  <p className="text-sm font-bold text-text-muted">{row.summary.missing_count}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {row.summary.items.map(item => (
                  <span key={item.id} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${statusClass(item.status)}`}>
                    {statusIcon(item.status)} {item.label}: {item.status}
                  </span>
                ))}
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-bold text-primary-light">Next:</span> {row.summary.next_action}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
