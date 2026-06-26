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
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-5">
        <CheckCircle className="w-4 h-4" />
        ความพร้อมของขอบเขตงาน (Scope Readiness)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReadinessGroup 
          title="เอกสารและสถานะ" 
          icon={<FileText className="w-4 h-4 text-primary" />}
          items={[
            { label: "Brief / Scope", isReady: briefDocs > 0 || scopeDocs > 0 },
            { label: "Quotation", isReady: quotationDocs > 0 },
            { label: "Invoice", isReady: invoiceDocs > 0 },
            { label: `Approval (${approvedDocs})`, isReady: approvedDocs >= 2 }
          ]}
        />
        <ReadinessGroup 
          title="เนื้อหาหลัก" 
          icon={<Target className="w-4 h-4 text-accent" />}
          items={[
            { label: "Goal / Overview", isReady: contentFlags.hasGoal },
            { label: "In-Scope", isReady: contentFlags.hasInScope },
            { label: "Out-of-Scope", isReady: contentFlags.hasOutOfScope },
            { label: "Deliverables", isReady: contentFlags.hasDeliverables }
          ]}
        />
        <ReadinessGroup 
          title="เงื่อนไขและรายละเอียด" 
          icon={<List className="w-4 h-4 text-success" />}
          items={[
            { label: "Acceptance Criteria", isReady: contentFlags.hasAcceptance },
            { label: "Assumptions", isReady: contentFlags.hasAssumptions },
            { label: "ไม่มีคำถามค้าง (Cleared)", isReady: !contentFlags.hasQuestions }
          ]}
        />
      </div>
    </div>
  );
}

function ReadinessGroup({ title, icon, items }: { title: string; icon: React.ReactNode; items: { label: string; isReady: boolean }[] }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-2/50 border border-border">
      <h4 className="text-xs font-bold text-text flex items-center gap-2 mb-1">
        {icon}
        {title}
      </h4>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-text-dim">{item.label}</span>
            {item.isReady ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
