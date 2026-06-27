import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, FileArchive, FileClock, FileOutput, FolderOpen, LockKeyhole, OctagonAlert } from 'lucide-react';
import { getCloseoutActionAvailability, getCloseoutEvidenceSummary, getCloseoutStatusSummary } from '../../lib/ai/closeout/closeoutStatus';
import { getCloseoutOpenTarget } from '../../lib/ai/closeout/closeoutOpenTarget';
import type { DocumentLifecycleSummary, LifecycleItemStatus } from '../../lib/ai/document-lifecycle/documentLifecycle';
import type { DocumentLifecycleActionTarget } from '../../lib/ai/document-lifecycle/documentLifecycleAction';
import { formatProjectLifecycleActionLogTime, type ProjectLifecycleActionLogEntry, type ProjectLifecycleActionLogType } from '../../lib/ai/document-lifecycle/documentLifecycleActionLog';
import { getProjectLifecycleEmptyGuidance } from '../../lib/ai/document-lifecycle/documentLifecycleEmptyGuidance';
import type { ProjectLifecyclePriority, ProjectLifecyclePriorityCategory } from '../../lib/ai/document-lifecycle/documentLifecyclePriority';
import type { LifecycleScanFile } from '../../lib/ai/document-lifecycle/documentLifecycleFileScan';

export interface ProjectLifecycleRow {
  projectPath: string;
  projectName: string;
  clientName: string;
  summary: DocumentLifecycleSummary;
  actionTarget: DocumentLifecycleActionTarget;
  scanFiles: LifecycleScanFile[];
  priority: ProjectLifecyclePriority;
}

type LifecycleFilter = 'all' | ProjectLifecyclePriorityCategory;

interface ProjectLifecycleListProps {
  rows: ProjectLifecycleRow[];
  actionLogs: ProjectLifecycleActionLogEntry[];
  autofocusFilter?: LifecycleFilter;
  highlightedProjectPath?: string | null;
  onLifecycleAction: (row: ProjectLifecycleRow, type: ProjectLifecycleActionLogType) => void;
  onSelectProject: (path: string) => void;
  onSelectFile: (path: string) => void;
  onCreateCloseoutPack: (row: ProjectLifecycleRow) => void;
  onCreateCloseoutExport: (row: ProjectLifecycleRow) => void;
}

const FILTERS: { id: LifecycleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'needs_action', label: 'Needs Action' },
  { id: 'can_close', label: 'Can Close' },
  { id: 'closeout_ready', label: 'Closeout Ready' },
  { id: 'export_ready', label: 'Export Ready' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'missing_docs', label: 'Missing Docs' },
];

const SUMMARY_CARDS: { id: ProjectLifecyclePriorityCategory; label: string; description: string }[] = [
  { id: 'blocked', label: 'Blocked', description: 'ต้องแก้ blocker ก่อน' },
  { id: 'missing_docs', label: 'Missing Docs', description: 'ต้องเติมเอกสารหลัก' },
  { id: 'can_close', label: 'Can Close', description: 'พร้อมสร้าง closeout' },
  { id: 'closeout_ready', label: 'Closeout Ready', description: 'พร้อมสร้าง export index' },
  { id: 'export_ready', label: 'Export Ready', description: 'พร้อมส่งต่อ' },
];

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

function closeoutBadgeClass(statusLabel: string): string {
  if (statusLabel === 'export_ready') return 'bg-success/10 text-success border border-success/20';
  if (statusLabel === 'closeout_ready') return 'bg-primary/10 text-primary-light border border-primary/20';
  if (statusLabel === 'closeout_incomplete') return 'bg-warning/10 text-warning border border-warning/20';
  return 'bg-surface-2 text-text-muted border border-border';
}

function priorityBadgeClass(category: ProjectLifecyclePriority['category']): string {
  if (category === 'blocked') return 'bg-error/10 text-error border border-error/20';
  if (category === 'can_close' || category === 'closeout_ready') return 'bg-success/10 text-success border border-success/20';
  if (category === 'missing_docs') return 'bg-warning/10 text-warning border border-warning/20';
  if (category === 'export_ready') return 'bg-primary/10 text-primary-light border border-primary/20';
  return 'bg-surface-2 text-text-muted border border-border';
}

function summaryCardClass(category: ProjectLifecyclePriorityCategory): string {
  if (category === 'blocked') return 'border-error/20 bg-error/10 hover:border-error/40';
  if (category === 'missing_docs') return 'border-warning/20 bg-warning/10 hover:border-warning/40';
  if (category === 'can_close' || category === 'closeout_ready') return 'border-success/20 bg-success/10 hover:border-success/40';
  if (category === 'export_ready') return 'border-primary/20 bg-primary/10 hover:border-primary/40';
  return 'border-border bg-surface-2 hover:border-primary/30';
}

function EmptyGuidanceCard({ activeFilter, onShowAll }: { activeFilter: LifecycleFilter; onShowAll: () => void }) {
  const guidance = getProjectLifecycleEmptyGuidance(activeFilter);
  return (
    <div className="text-center py-10 text-text-dim bg-surface-2/50 border border-border border-dashed rounded-xl px-6">
      <CircleDashed className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm font-bold text-text">{guidance.title}</p>
      <p className="text-xs text-text-muted mt-2 max-w-xl mx-auto leading-relaxed">{guidance.description}</p>
      <p className="text-xs text-primary-light mt-3 max-w-xl mx-auto leading-relaxed">{guidance.recommended_next_action}</p>
      {activeFilter !== 'all' && (
        <button type="button" onClick={onShowAll} className="btn btn-outline text-xs mt-4">
          ดู project ทั้งหมด
        </button>
      )}
    </div>
  );
}

export default function ProjectLifecycleList({ rows, actionLogs, autofocusFilter, highlightedProjectPath, onLifecycleAction, onSelectProject, onSelectFile, onCreateCloseoutPack, onCreateCloseoutExport }: ProjectLifecycleListProps) {
  const [activeFilter, setActiveFilter] = useState<LifecycleFilter>('all');

  useEffect(() => {
    if (autofocusFilter) setActiveFilter(autofocusFilter);
  }, [autofocusFilter]);

  const filteredRows = useMemo(() => (
    activeFilter === 'all' ? rows : rows.filter(row => row.priority.category === activeFilter)
  ), [activeFilter, rows]);

  const filterCounts = useMemo(() => {
    const counts = new Map<LifecycleFilter, number>([['all', rows.length]]);
    for (const row of rows) {
      counts.set(row.priority.category, (counts.get(row.priority.category) || 0) + 1);
    }
    return counts;
  }, [rows]);

  const projectNameByPath = useMemo(() => new Map(rows.map(row => [row.projectPath, row.projectName])), [rows]);
  const totalNeedsAttention = (filterCounts.get('blocked') || 0) + (filterCounts.get('missing_docs') || 0) + (filterCounts.get('can_close') || 0) + (filterCounts.get('closeout_ready') || 0);

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-base font-bold text-text flex items-center gap-2">
          <LockKeyhole className="w-4 h-4 text-primary" />
          Project Lifecycle จากไฟล์จริง
        </h3>
        <span className="badge badge-muted text-xs">{filteredRows.length}/{rows.length} projects</span>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2/60 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-text">วันนี้ควรทำอะไรต่อ</p>
            <p className="text-xs text-text-muted">{totalNeedsAttention} projects need attention จาก lifecycle จริง</p>
          </div>
          <button type="button" onClick={() => setActiveFilter('all')} className="btn btn-outline text-xs shrink-0">
            ดูทั้งหมด
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {SUMMARY_CARDS.map(card => {
            const count = filterCounts.get(card.id) || 0;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setActiveFilter(card.id)}
                className={`rounded-xl border p-3 text-left transition-all ${summaryCardClass(card.id)}`}
              >
                <p className="text-xl font-bold text-text">{count}</p>
                <p className="text-xs font-bold text-text">{card.label}</p>
                <p className="text-[10px] text-text-muted mt-1">{card.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2/40 p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-bold text-text">Recent lifecycle actions</p>
          <span className="badge badge-muted text-[10px]">{actionLogs.length} actions</span>
        </div>
        {actionLogs.length === 0 ? (
          <p className="text-xs text-text-muted">ยังไม่มี action log จากการสร้างหรือเปิด Closeout / Export ใน session นี้</p>
        ) : (
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {actionLogs.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 rounded-lg border border-border bg-surface px-2 py-1.5">
                <span className="text-xs font-semibold text-text">{entry.label}</span>
                <span className="text-[10px] text-text-muted truncate">{projectNameByPath.get(entry.project_path) || entry.project_path} · {formatProjectLifecycleActionLogTime(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(filter => {
          const count = filterCounts.get(filter.id) || 0;
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`badge text-xs border transition-all ${active ? 'bg-primary/15 text-primary-light border-primary/30' : 'bg-surface-2 text-text-muted border-border hover:border-primary/30'}`}
            >
              {filter.label} <span className="font-mono opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyGuidanceCard activeFilter="all" onShowAll={() => setActiveFilter('all')} />
      ) : filteredRows.length === 0 ? (
        <EmptyGuidanceCard activeFilter={activeFilter} onShowAll={() => setActiveFilter('all')} />
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {filteredRows.map(row => {
            const closeoutStatus = getCloseoutStatusSummary(row.scanFiles);
            const closeoutEvidence = getCloseoutEvidenceSummary(closeoutStatus);
            const actionAvailability = getCloseoutActionAvailability(row.summary.can_close_work, closeoutStatus);
            const openTarget = getCloseoutOpenTarget(row.scanFiles);
            const highlighted = highlightedProjectPath === row.projectPath;
            return (
              <div key={row.projectPath} className={`rounded-2xl border bg-surface hover:bg-surface-2 transition-all p-4 ${highlighted ? 'border-success/50 ring-2 ring-success/20' : 'border-border hover:border-primary/40'}`}>
                {highlighted && (
                  <div className="mb-3 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs font-bold text-success">
                    Focused next action — project นี้เพิ่งถูกอัปเดตจาก action ล่าสุด
                  </div>
                )}
                <button type="button" onClick={() => onSelectProject(row.projectPath)} className="w-full text-left">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text truncate">{row.projectName}</p>
                      <p className="text-xs text-text-muted truncate">{row.clientName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className={`badge text-xs ${priorityBadgeClass(row.priority.category)}`} title={row.priority.reason}>
                        {row.priority.label}
                      </div>
                      <div className={`badge text-xs ${row.summary.can_close_work ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                        Can close: {row.summary.can_close_work ? 'yes' : 'no'}
                      </div>
                      <div className={`badge text-xs ${closeoutBadgeClass(closeoutStatus.status_label)}`}>
                        {closeoutStatus.status_label.replace(/_/g, ' ')}
                      </div>
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

                  <div className="mb-3 rounded-xl border border-border bg-surface-2 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2">Closeout evidence from files</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-muted text-[10px]">{closeoutEvidence.closeout_evidence_label}</span>
                      <span className="badge badge-muted text-[10px]">{closeoutEvidence.export_evidence_label}</span>
                    </div>
                    {closeoutEvidence.missing_files.length > 0 && (
                      <p className="text-[10px] text-warning mt-2 leading-relaxed">Missing: {closeoutEvidence.missing_files.join(', ')}</p>
                    )}
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">
                    <span className="font-bold text-primary-light">Next:</span> {row.summary.next_action}
                  </p>
                </button>

                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      <span className="font-bold text-primary-light">Action file:</span> {row.actionTarget.reason}
                    </p>
                    <button
                      type="button"
                      onClick={() => row.actionTarget.file_path ? onSelectFile(row.actionTarget.file_path) : onSelectProject(row.projectPath)}
                      className="btn btn-primary text-xs gap-2 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> {row.actionTarget.label}
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-primary/10 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        <span className="font-bold text-success">Closeout:</span> {closeoutStatus.closeout_pack_created ? 'Closeout Pack Created' : closeoutStatus.recommended_next_action}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {openTarget.closeout_summary_path && (
                          <button type="button" onClick={() => { onLifecycleAction(row, 'opened_closeout'); onSelectFile(openTarget.closeout_summary_path!); }} className="btn btn-primary text-xs gap-2 shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" /> เปิด Closeout
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCreateCloseoutPack(row)}
                          disabled={!!actionAvailability.closeout_disabled_reason}
                          title={actionAvailability.closeout_disabled_reason || undefined}
                          className="btn btn-outline text-xs gap-2 shrink-0 disabled:opacity-50"
                        >
                          <FileArchive className="w-3.5 h-3.5" /> {closeoutStatus.closeout_pack_created ? 'Closeout Created' : 'สร้าง Closeout Pack'}
                        </button>
                      </div>
                    </div>
                    {actionAvailability.closeout_disabled_reason && (
                      <p className="text-[10px] text-text-muted leading-relaxed">ทำไมกดไม่ได้: {actionAvailability.closeout_disabled_reason}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 border-t border-primary/10 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        <span className="font-bold text-accent">Export:</span> {closeoutStatus.export_ready ? 'Export Ready' : closeoutStatus.recommended_next_action}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {openTarget.export_index_path && (
                          <button type="button" onClick={() => { onLifecycleAction(row, 'opened_export'); onSelectFile(openTarget.export_index_path!); }} className="btn btn-primary text-xs gap-2 shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" /> เปิด Export
                          </button>
                        )}
                        {openTarget.export_folder_path && (
                          <button type="button" onClick={() => onSelectFile(openTarget.export_folder_path!)} className="btn btn-outline text-xs gap-2 shrink-0">
                            <FolderOpen className="w-3.5 h-3.5" /> เปิด Export Folder
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCreateCloseoutExport(row)}
                          disabled={!!actionAvailability.export_disabled_reason}
                          title={actionAvailability.export_disabled_reason || undefined}
                          className="btn btn-outline text-xs gap-2 shrink-0 disabled:opacity-50"
                        >
                          <FileOutput className="w-3.5 h-3.5" /> {closeoutStatus.export_index_created ? 'Export Created' : 'สร้าง Export Index'}
                        </button>
                      </div>
                    </div>
                    {actionAvailability.export_disabled_reason && (
                      <p className="text-[10px] text-text-muted leading-relaxed">ทำไมกดไม่ได้: {actionAvailability.export_disabled_reason}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
