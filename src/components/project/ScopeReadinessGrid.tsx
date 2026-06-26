import { CheckCircle, AlertTriangle, FileText, Target, List } from 'lucide-react';

interface ScopeReadinessGridProps {
  briefDocs: number;
  scopeDocs: number;
  quotationDocs: number;
  invoiceDocs: number;
  approvedDocs: number;
  contentFlags: {
    hasGoal: boolean;
    hasInScope: boolean;
    hasOutOfScope: boolean;
    hasDeliverables: boolean;
    hasAcceptance: boolean;
    hasAssumptions: boolean;
    hasQuestions: boolean;
  };
}

export default function ScopeReadinessGrid({
  briefDocs,
  scopeDocs,
  quotationDocs,
  invoiceDocs,
  approvedDocs,
  contentFlags
}: ScopeReadinessGridProps) {
  const requiredItems = [
    { label: "Brief / Scope", isReady: briefDocs > 0 || scopeDocs > 0 },
    { label: "Quotation", isReady: quotationDocs > 0 },
    { label: "Invoice", isReady: invoiceDocs > 0 },
    { label: "Goal / Overview", isReady: contentFlags.hasGoal },
    { label: "In-Scope", isReady: contentFlags.hasInScope },
    { label: "Deliverables", isReady: contentFlags.hasDeliverables },
    { label: "Acceptance Criteria", isReady: contentFlags.hasAcceptance },
  ];

  const optionalItems = [
    { label: "Out-of-Scope", isReady: contentFlags.hasOutOfScope },
    { label: "Assumptions", isReady: contentFlags.hasAssumptions },
    { label: "No Questions Pending", isReady: !contentFlags.hasQuestions },
    { label: "Approval (≥2)", isReady: approvedDocs >= 2 },
  ];

  const requiredReady = requiredItems.filter(i => i.isReady).length;
  const requiredTotal = requiredItems.length;
  const progressPct = Math.round((requiredReady / requiredTotal) * 100);

  let statusColor = 'text-error';
  let statusBg = 'bg-error/10';
  let statusBorder = 'border-error/20';
  let statusLabel = `${requiredReady}/${requiredTotal} — ต้องเพิ่ม`;
  if (progressPct >= 80) {
    statusColor = 'text-success';
    statusBg = 'bg-success/10';
    statusBorder = 'border-success/20';
    statusLabel = `${requiredReady}/${requiredTotal} — พร้อม`;
  } else if (progressPct >= 50) {
    statusColor = 'text-warning';
    statusBg = 'bg-warning/10';
    statusBorder = 'border-warning/20';
    statusLabel = `${requiredReady}/${requiredTotal} — กำลังดำเนินการ`;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2.5">
          <Target className="w-4 h-4 text-primary" />
          Scope Readiness
        </h3>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusBg} ${statusColor} ${statusBorder} border`}>
          {statusLabel}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-3 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: progressPct >= 80 ? '#22c55e' : progressPct >= 50 ? '#eab308' : '#ef4444'
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Required */}
        <div className="p-4 rounded-xl bg-surface-2/60 border border-border/50">
          <h4 className="text-xs font-bold text-text flex items-center gap-2 mb-3 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-primary" />
            Required
          </h4>
          <div className="space-y-2">
            {requiredItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                <span className="text-sm text-text-dim">{item.label}</span>
                {item.isReady ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-success">
                    <CheckCircle className="w-3.5 h-3.5" /> พร้อม
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                    <AlertTriangle className="w-3.5 h-3.5" /> ขาด
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optional */}
        <div className="p-4 rounded-xl bg-surface-2/30 border border-border/30">
          <h4 className="text-xs font-bold text-text-muted flex items-center gap-2 mb-3 uppercase tracking-wider">
            <List className="w-3.5 h-3.5 text-text-dim" />
            Additional
          </h4>
          <div className="space-y-2">
            {optionalItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                <span className="text-sm text-text-dim">{item.label}</span>
                {item.isReady ? (
                  <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-text-dim/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}