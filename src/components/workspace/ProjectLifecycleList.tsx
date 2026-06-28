import { useEffect, useMemo, useState, useCallback } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, FileArchive, FileClock, FileOutput, FolderOpen, LockKeyhole, OctagonAlert } from 'lucide-react';
import { getCloseoutDeliveryChecklist } from '../../lib/ai/closeout/closeoutDeliveryChecklist';
import {
  formatCloseoutDeliveryStatusLabel,
  getCloseoutDeliveryStatus,
  getCloseoutDeliveryStatusStorageKey,
  parseCloseoutDeliveryStatuses,
  serializeCloseoutDeliveryStatuses,
  setCloseoutDeliveryStatus,
  type CloseoutDeliveryStatusEntry,
  type CloseoutDeliveryStatusType,
} from '../../lib/ai/closeout/closeoutDeliveryStatus';
import { getCloseoutFinalizedGuard } from '../../lib/ai/closeout/closeoutFinalizedGuard';
import { getCloseoutFinalStatus, type CloseoutFinalStatus } from '../../lib/ai/closeout/closeoutFinalStatus';
import { getLatestCloseoutReopenDecisionSummary } from '../../lib/ai/closeout/closeoutReopenDecisionDetection';
import { getCloseoutReopenRequestSummary } from '../../lib/ai/closeout/closeoutReopenDetection';
import { getCloseoutReopenActionTarget } from '../../lib/ai/closeout/closeoutReopenActionTarget';
import { getCloseoutReopenNextAction } from '../../lib/ai/closeout/closeoutReopenNextAction';
import { buildCloseoutReopenRequest, canCreateCloseoutReopenRequest } from '../../lib/ai/closeout/closeoutReopenRequest';
import { getCloseoutActionAvailability, getCloseoutEvidenceSummary, getCloseoutStatusSummary } from '../../lib/ai/closeout/closeoutStatus';
import { getCloseoutOpenTarget } from '../../lib/ai/closeout/closeoutOpenTarget';
import { createDocument, pathExists } from '../../lib/tauri-commands';
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

type FinalStatusFilter = 'ready_to_deliver' | 'delivery_sent' | 'awaiting_customer_acceptance' | 'finalized';
type ReopenStatusFilter = 'reopen_cr' | 'reopen_pending_decision' | 'reopen_ambiguous_decision' | 'reopen_decided';
type LifecycleFilter = 'all' | ProjectLifecyclePriorityCategory | FinalStatusFilter | ReopenStatusFilter;

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
  { id: 'ready_to_deliver', label: 'Ready to Deliver' },
  { id: 'delivery_sent', label: 'Delivery Sent' },
  { id: 'awaiting_customer_acceptance', label: 'Awaiting Acceptance' },
  { id: 'finalized', label: 'Finalized / Closed' },
  { id: 'reopen_cr', label: 'Reopen / CR' },
  { id: 'reopen_pending_decision', label: 'Reopen Pending' },
  { id: 'reopen_ambiguous_decision', label: 'Reopen Ambiguous' },
  { id: 'reopen_decided', label: 'Reopen Decided' },
];

const SUMMARY_CARDS: { id: ProjectLifecyclePriorityCategory; label: string; description: string }[] = [
  { id: 'blocked', label: 'Blocked', description: 'ต้องแก้ blocker ก่อน' },
  { id: 'missing_docs', label: 'Missing Docs', description: 'ต้องเติมเอกสารหลัก' },
  { id: 'can_close', label: 'Can Close', description: 'พร้อมสร้าง closeout' },
  { id: 'closeout_ready', label: 'Closeout Ready', description: 'พร้อมสร้าง export index' },
  { id: 'export_ready', label: 'Export Ready', description: 'พร้อมส่งต่อ' },
];

const FINAL_STATUS_CARDS: { id: FinalStatusFilter; label: string; description: string }[] = [
  { id: 'ready_to_deliver', label: 'Ready to Deliver', description: 'package พร้อมส่ง' },
  { id: 'delivery_sent', label: 'Delivery Sent', description: 'ส่ง package แล้ว' },
  { id: 'awaiting_customer_acceptance', label: 'Awaiting Acceptance', description: 'รอลูกค้ารับรอง' },
  { id: 'finalized', label: 'Finalized / Closed', description: 'ปิดงานแล้ว' },
];

const REOPEN_STATUS_CARDS: { id: ReopenStatusFilter; label: string; description: string }[] = [
  { id: 'reopen_cr', label: 'Reopen / CR', description: 'ปิดแล้วแต่กลับมาแก้' },
  { id: 'reopen_pending_decision', label: 'Pending Decision', description: 'รอตัดสินใจ CR' },
  { id: 'reopen_ambiguous_decision', label: 'Ambiguous Decision', description: 'เลือก decision หลายข้อ' },
  { id: 'reopen_decided', label: 'Decided', description: 'มี decision แล้ว' },
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

function finalStatusBadgeClass(isTerminalReady: boolean): string {
  return isTerminalReady
    ? 'bg-success/10 text-success border border-success/20'
    : 'bg-surface-2 text-text-muted border border-border';
}

function reopenDecisionBadgeClass(hasDecision: boolean, isAmbiguous: boolean): string {
  if (isAmbiguous) return 'bg-error/10 text-error border border-error/20';
  if (hasDecision) return 'bg-success/10 text-success border border-success/20';
  return 'bg-warning/10 text-warning border border-warning/20';
}

function priorityBadgeClass(category: ProjectLifecyclePriority['category']): string {
  if (category === 'blocked') return 'bg-error/10 text-error border border-error/20';
  if (category === 'can_close' || category === 'closeout_ready') return 'bg-success/10 text-success border border-success/20';
  if (category === 'missing_docs') return 'bg-warning/10 text-warning border border-warning/20';
  if (category === 'export_ready') return 'bg-primary/10 text-primary-light border border-primary/20';
  return 'bg-surface-2 text-text-muted border border-border';
}

function summaryCardClass(category: ProjectLifecyclePriorityCategory | FinalStatusFilter | ReopenStatusFilter): string {
  if (category === 'blocked' || category === 'reopen_ambiguous_decision') return 'border-error/20 bg-error/10 hover:border-error/40';
  if (category === 'missing_docs' || category === 'reopen_cr' || category === 'reopen_pending_decision') return 'border-warning/20 bg-warning/10 hover:border-warning/40';
  if (category === 'can_close' || category === 'closeout_ready' || category === 'delivery_sent' || category === 'awaiting_customer_acceptance' || category === 'finalized' || category === 'reopen_decided') return 'border-success/20 bg-success/10 hover:border-success/40';
  if (category === 'export_ready' || category === 'ready_to_deliver') return 'border-primary/20 bg-primary/10 hover:border-primary/40';
  return 'border-border bg-surface-2 hover:border-primary/30';
}

function getWorkspaceKeyPath(rows: ProjectLifecycleRow[]): string {
  const firstPath = rows[0]?.projectPath || 'unknown-workspace';
  const normalized = firstPath.replace(/\\/g, '/');
  const marker = '/clients/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex >= 0) return normalized.slice(0, markerIndex);
  return normalized.split('/projects/')[0] || normalized;
}

function isFinalStatusFilter(filter: LifecycleFilter): filter is FinalStatusFilter {
  return filter === 'ready_to_deliver' || filter === 'delivery_sent' || filter === 'awaiting_customer_acceptance' || filter === 'finalized';
}

function isReopenStatusFilter(filter: LifecycleFilter): filter is ReopenStatusFilter {
  return filter === 'reopen_cr' || filter === 'reopen_pending_decision' || filter === 'reopen_ambiguous_decision' || filter === 'reopen_decided';
}

function getLifecycleFilterEmptyGuidance(activeFilter: LifecycleFilter) {
  if (activeFilter === 'ready_to_deliver') {
    return {
      title: 'ยังไม่มี project ที่พร้อมส่งมอบ',
      description: 'ยังไม่มี project ที่สร้าง Closeout Pack และ Export Index ครบแต่ยังไม่ได้ mark delivery',
      recommended_next_action: 'ไปดู Closeout Ready หรือ Export Ready เพื่อสร้าง package ให้ครบก่อน',
    };
  }
  if (activeFilter === 'delivery_sent') {
    return {
      title: 'ยังไม่มี project ที่ mark ว่าส่ง package แล้ว',
      description: 'ยังไม่มี project ที่ถูกบันทึกเป็น Delivery Sent ใน workspace นี้',
      recommended_next_action: 'ไปดู Ready to Deliver แล้วกด Mark package sent หลังส่งงานจริง',
    };
  }
  if (activeFilter === 'awaiting_customer_acceptance') {
    return {
      title: 'ยังไม่มี project ที่รอ customer acceptance',
      description: 'ยังไม่มี project ที่ถูก mark เป็น Pending customer acceptance',
      recommended_next_action: 'หลังส่ง package แล้ว ให้กด Mark pending customer acceptance เพื่อคุมงานรอรับรอง',
    };
  }
  if (activeFilter === 'finalized') {
    return {
      title: 'ยังไม่มี project ที่ปิดงานแบบ finalized',
      description: 'ยังไม่มี project ที่ถูก mark ว่าได้รับ customer acceptance แล้ว',
      recommended_next_action: 'เมื่อได้รับ acceptance จากลูกค้าแล้ว ให้กด Mark acceptance received',
    };
  }
  if (activeFilter === 'reopen_cr') {
    return {
      title: 'ยังไม่มี project ที่มี Reopen / CR หลังปิดงาน',
      description: 'ยังไม่พบไฟล์ changes/reopen-request-*.md ใน workspace นี้',
      recommended_next_action: 'เมื่อ project ที่ Finalized / Closed ต้องกลับมาแก้ ให้กด Create reopen / CR เพื่อสร้างไฟล์ควบคุม scope',
    };
  }
  if (activeFilter === 'reopen_pending_decision') {
    return {
      title: 'ยังไม่มี Reopen / CR ที่รอ decision',
      description: 'ยังไม่พบ reopen request ที่มี Decision: Pending',
      recommended_next_action: 'ตรวจ Reopen / CR แล้วติ๊ก decision หนึ่งข้อในไฟล์ reopen-request ล่าสุด',
    };
  }
  if (activeFilter === 'reopen_ambiguous_decision') {
    return {
      title: 'ยังไม่มี Reopen / CR ที่ decision กำกวม',
      description: 'ยังไม่พบ reopen request ที่เลือก decision หลายข้อพร้อมกัน',
      recommended_next_action: 'หากพบเคสนี้ ให้แก้ checkbox ให้เหลือ decision เดียวก่อนเริ่มงานต่อ',
    };
  }
  if (activeFilter === 'reopen_decided') {
    return {
      title: 'ยังไม่มี Reopen / CR ที่ตัดสินใจแล้ว',
      description: 'ยังไม่พบ reopen request ที่เลือก decision ครบหนึ่งข้อ',
      recommended_next_action: 'เมื่อ review แล้ว ให้ติ๊ก decision ใน reopen-request ล่าสุด',
    };
  }
  return getProjectLifecycleEmptyGuidance(activeFilter);
}

function EmptyGuidanceCard({ activeFilter, onShowAll }: { activeFilter: LifecycleFilter; onShowAll: () => void }) {
  const guidance = getLifecycleFilterEmptyGuidance(activeFilter);
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
  const [deliveryStatuses, setDeliveryStatuses] = useState<CloseoutDeliveryStatusEntry[]>([]);
  const deliveryStatusStorageKey = useMemo(() => getCloseoutDeliveryStatusStorageKey(getWorkspaceKeyPath(rows)), [rows]);

  useEffect(() => {
    if (autofocusFilter) setActiveFilter(autofocusFilter);
  }, [autofocusFilter]);

  useEffect(() => {
    setDeliveryStatuses(parseCloseoutDeliveryStatuses(localStorage.getItem(deliveryStatusStorageKey)));
  }, [deliveryStatusStorageKey]);

  const recordDeliveryStatus = (row: ProjectLifecycleRow, status: CloseoutDeliveryStatusType) => {
    setDeliveryStatuses(current => {
      const next = setCloseoutDeliveryStatus(current, row.projectPath, status);
      localStorage.setItem(deliveryStatusStorageKey, serializeCloseoutDeliveryStatuses(next));
      return next;
    });
  };

  const createReopenRequest = async (row: ProjectLifecycleRow, finalStatus: CloseoutFinalStatus) => {
    if (!canCreateCloseoutReopenRequest(finalStatus)) {
      alert('สร้าง Reopen / Change Request ได้เฉพาะ project ที่เป็น Finalized / Closed แล้วเท่านั้น');
      return;
    }
    const reason = window.prompt('ระบุเหตุผลที่ต้อง reopen หลังปิดงานแล้ว เช่น ลูกค้าขอแก้หลัง sign-off');
    if (reason === null) return;
    const request = buildCloseoutReopenRequest({
      project_name: row.projectName,
      project_path: row.projectPath,
      reason,
    });
    if (await pathExists(request.path)) {
      alert(`มีไฟล์ reopen request นี้อยู่แล้ว:\n${request.path}`);
      onSelectFile(request.path);
      return;
    }
    await createDocument(request.path, request.markdown);
    onSelectFile(request.path);
    alert('สร้าง Reopen / Change Request แล้ว ระบบเปิดไฟล์ให้กรอกรายละเอียดต่อ');
  };

  const getFinalStatusKindForRow = useCallback((row: ProjectLifecycleRow) => {
    const closeoutStatus = getCloseoutStatusSummary(row.scanFiles);
    const savedDeliveryStatus = getCloseoutDeliveryStatus(deliveryStatuses, row.projectPath);
    return getCloseoutFinalStatus(closeoutStatus, savedDeliveryStatus).kind;
  }, [deliveryStatuses]);

  const matchesReopenFilter = (row: ProjectLifecycleRow, filter: ReopenStatusFilter) => {
    const decision = getLatestCloseoutReopenDecisionSummary(row.scanFiles);
    if (filter === 'reopen_cr') return decision.has_reopen_request;
    if (filter === 'reopen_pending_decision') return decision.has_reopen_request && !decision.has_decision && !decision.is_ambiguous;
    if (filter === 'reopen_ambiguous_decision') return decision.has_reopen_request && decision.is_ambiguous;
    return decision.has_reopen_request && decision.has_decision;
  };

  const filteredRows = useMemo(() => {
    if (activeFilter === 'all') return rows;
    if (isFinalStatusFilter(activeFilter)) {
      return rows.filter(row => getFinalStatusKindForRow(row) === activeFilter);
    }
    if (isReopenStatusFilter(activeFilter)) {
      return rows.filter(row => matchesReopenFilter(row, activeFilter));
    }
    return rows.filter(row => row.priority.category === activeFilter);
  }, [activeFilter, rows, deliveryStatuses, getFinalStatusKindForRow]);

  const filterCounts = useMemo(() => {
    const counts = new Map<LifecycleFilter, number>([['all', rows.length]]);
    for (const row of rows) {
      counts.set(row.priority.category, (counts.get(row.priority.category) || 0) + 1);
      const finalKind = getFinalStatusKindForRow(row);
      if (isFinalStatusFilter(finalKind as LifecycleFilter)) {
        counts.set(finalKind as FinalStatusFilter, (counts.get(finalKind as FinalStatusFilter) || 0) + 1);
      }
      const reopenDecision = getLatestCloseoutReopenDecisionSummary(row.scanFiles);
      if (reopenDecision.has_reopen_request) {
        counts.set('reopen_cr', (counts.get('reopen_cr') || 0) + 1);
        if (reopenDecision.is_ambiguous) {
          counts.set('reopen_ambiguous_decision', (counts.get('reopen_ambiguous_decision') || 0) + 1);
        } else if (reopenDecision.has_decision) {
          counts.set('reopen_decided', (counts.get('reopen_decided') || 0) + 1);
        } else {
          counts.set('reopen_pending_decision', (counts.get('reopen_pending_decision') || 0) + 1);
        }
      }
    }
    return counts;
  }, [rows, deliveryStatuses, getFinalStatusKindForRow]);

  const projectNameByPath = useMemo(() => new Map(rows.map(row => [row.projectPath, row.projectName])), [rows]);
  const totalNeedsAttention = (filterCounts.get('blocked') || 0) + (filterCounts.get('missing_docs') || 0) + (filterCounts.get('can_close') || 0) + (filterCounts.get('closeout_ready') || 0);
  const totalDeliveryFollowUp = (filterCounts.get('ready_to_deliver') || 0) + (filterCounts.get('delivery_sent') || 0) + (filterCounts.get('awaiting_customer_acceptance') || 0) + (filterCounts.get('finalized') || 0);
  const totalReopenRequests = filterCounts.get('reopen_cr') || 0;

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
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <p className="text-xs font-bold text-text">หลังส่งมอบ / Final close</p>
            <span className="badge badge-muted text-[10px]">{totalDeliveryFollowUp} projects</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {FINAL_STATUS_CARDS.map(card => {
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
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <p className="text-xs font-bold text-text">ปิดแล้วกลับมาแก้ / Reopen control</p>
            <span className="badge badge-muted text-[10px]">{totalReopenRequests} projects</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {REOPEN_STATUS_CARDS.map(card => {
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
            const deliveryChecklist = getCloseoutDeliveryChecklist(closeoutStatus);
            const savedDeliveryStatus = getCloseoutDeliveryStatus(deliveryStatuses, row.projectPath);
            const finalStatus = getCloseoutFinalStatus(closeoutStatus, savedDeliveryStatus);
            const finalizedGuard = getCloseoutFinalizedGuard(finalStatus);
            const reopenSummary = getCloseoutReopenRequestSummary(row.scanFiles);
            const reopenDecisionSummary = getLatestCloseoutReopenDecisionSummary(row.scanFiles);
            const displayNextAction = getCloseoutReopenNextAction(reopenDecisionSummary, row.summary.next_action);
            const displayActionTarget = getCloseoutReopenActionTarget(row.actionTarget, reopenSummary, reopenDecisionSummary);
            const packageSent = savedDeliveryStatus?.status === 'package_sent' || savedDeliveryStatus?.status === 'pending_customer_acceptance' || savedDeliveryStatus?.status === 'acceptance_received';
            const pendingAcceptance = savedDeliveryStatus?.status === 'pending_customer_acceptance' || savedDeliveryStatus?.status === 'acceptance_received';
            const deliveryItems = deliveryChecklist.items.map(item => {
              if (item.id === 'attach_package_to_customer_message') return { ...item, done: packageSent };
              if (item.id === 'record_delivery_or_pending_acceptance') return { ...item, done: pendingAcceptance };
              return item;
            });
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
                      <div className={`badge text-xs ${finalStatusBadgeClass(finalStatus.is_terminal_ready)}`}>
                        {finalStatus.label}
                      </div>
                      {reopenSummary.has_reopen_request && (
                        <div className="badge text-xs bg-warning/10 text-warning border border-warning/20">
                          Reopen / CR: {reopenSummary.request_count}
                        </div>
                      )}
                      {reopenSummary.has_reopen_request && (
                        <div className={`badge text-xs ${reopenDecisionBadgeClass(reopenDecisionSummary.has_decision, reopenDecisionSummary.is_ambiguous)}`}>
                          Decision: {reopenDecisionSummary.is_ambiguous ? 'Ambiguous' : reopenDecisionSummary.selected_decision_label || 'Pending'}
                        </div>
                      )}
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

                  <div className={`mb-3 rounded-xl border p-3 ${finalStatus.is_terminal_ready ? 'border-success/20 bg-success/10' : 'border-border bg-surface-2'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">Final close status</p>
                    <p className="text-xs font-bold text-text">{finalStatus.label}</p>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{finalStatus.description}</p>
                    {finalizedGuard.lock_reason && (
                      <p className="mt-2 rounded-lg border border-success/20 bg-success/10 px-2 py-1.5 text-[10px] text-success leading-relaxed">{finalizedGuard.lock_reason}</p>
                    )}
                  </div>

                  {reopenSummary.has_reopen_request && (
                    <div className="mb-3 rounded-xl border border-warning/20 bg-warning/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-warning mb-1">Reopen / Change Request detected</p>
                      <p className="text-xs font-bold text-text">{reopenSummary.request_count} request{reopenSummary.request_count > 1 ? 's' : ''} after final close</p>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">พบไฟล์ reopen-request ใน changes/ จากไฟล์จริงของ project นี้</p>
                      <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold border ${reopenDecisionBadgeClass(reopenDecisionSummary.has_decision, reopenDecisionSummary.is_ambiguous)}`}>
                        Decision: {reopenDecisionSummary.is_ambiguous ? 'Ambiguous — เลือกหลายข้อ ต้องแก้ให้เหลือข้อเดียว' : reopenDecisionSummary.selected_decision_label || 'Pending — ยังไม่ได้เลือก decision'}
                      </p>
                    </div>
                  )}

                </button>

                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent" />
                  <div className="p-4 pl-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <LockKeyhole className="w-3.5 h-3.5 text-primary shrink-0" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Recommended Next Action</h4>
                      </div>
                      <p className="text-sm font-bold text-text mb-1">{displayActionTarget.reason}</p>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        <span className="font-bold text-primary-light">Why:</span> {displayNextAction}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => displayActionTarget.file_path ? onSelectFile(displayActionTarget.file_path) : onSelectProject(row.projectPath)}
                        className="btn btn-primary shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all text-xs flex items-center justify-center gap-2 py-2 px-4 group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
                        {displayActionTarget.label}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-2/30 p-3">
                  <div className="flex flex-col gap-2">
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
                  <div className={`rounded-xl border p-3 ${deliveryChecklist.ready_for_delivery ? 'border-success/20 bg-success/10' : 'border-border bg-surface-2/60'}`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[11px] font-bold text-text">{deliveryChecklist.title}</p>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{deliveryChecklist.description}</p>
                        {savedDeliveryStatus && (
                          <p className="text-[10px] text-success mt-1 leading-relaxed">Delivery status: {formatCloseoutDeliveryStatusLabel(savedDeliveryStatus.status)}</p>
                        )}
                      </div>
                      <span className={`badge text-[10px] shrink-0 ${deliveryChecklist.ready_for_delivery ? 'bg-success/10 text-success border border-success/20' : 'badge-muted'}`}>
                        {deliveryChecklist.ready_for_delivery ? 'Ready' : 'Locked'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {deliveryItems.map(item => (
                        <div key={item.id} className="flex items-start gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
                          {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /> : <CircleDashed className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />}
                          <span className="text-[10px] text-text-muted leading-relaxed">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    {deliveryChecklist.ready_for_delivery && (
                      <div className="flex flex-col gap-2 mt-3 border-t border-success/10 pt-3">
                        {finalizedGuard.lock_reason && (
                          <p className="text-[10px] text-success leading-relaxed">{finalizedGuard.lock_reason}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => recordDeliveryStatus(row, 'package_sent')} disabled={finalizedGuard.delivery_actions_disabled} title={finalizedGuard.lock_reason || undefined} className="btn btn-outline text-xs gap-2 shrink-0 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark package sent
                          </button>
                          <button type="button" onClick={() => recordDeliveryStatus(row, 'pending_customer_acceptance')} disabled={finalizedGuard.delivery_actions_disabled} title={finalizedGuard.lock_reason || undefined} className="btn btn-outline text-xs gap-2 shrink-0 disabled:opacity-50">
                            <FileClock className="w-3.5 h-3.5" /> Mark pending customer acceptance
                          </button>
                          <button type="button" onClick={() => recordDeliveryStatus(row, 'acceptance_received')} disabled={finalizedGuard.delivery_actions_disabled} title={finalizedGuard.lock_reason || undefined} className="btn btn-primary text-xs gap-2 shrink-0 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark acceptance received
                          </button>
                          {finalizedGuard.is_finalized && (
                            <button type="button" onClick={() => createReopenRequest(row, finalStatus)} className="btn btn-outline text-xs gap-2 shrink-0">
                              <FileOutput className="w-3.5 h-3.5" /> Create reopen / CR
                            </button>
                          )}
                          {reopenSummary.latest_request_path && (
                            <button type="button" onClick={() => onSelectFile(reopenSummary.latest_request_path!)} className="btn btn-outline text-xs gap-2 shrink-0">
                              <ExternalLink className="w-3.5 h-3.5" /> เปิด Reopen / CR ล่าสุด
                            </button>
                          )}
                        </div>
                      </div>
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
