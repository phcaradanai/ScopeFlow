import { CheckCircle, AlertTriangle } from 'lucide-react';

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
    <div className="card lg:col-span-3">
      <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
        <CheckCircle className="w-4 h-4" />
        ความพร้อมของขอบเขตงาน (Scope Readiness)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <ReadinessItem label="เอกสารตั้งต้น" isReady={briefDocs > 0 || scopeDocs > 0} text="Brief / Scope" />
        <ReadinessItem label="เป้าหมายงาน" isReady={contentFlags.hasGoal} text="Goal / Overview" />
        <ReadinessItem label="ขอบเขตงาน" isReady={contentFlags.hasInScope} text="In-Scope" />
        <ReadinessItem label="อยู่นอกขอบเขต" isReady={contentFlags.hasOutOfScope} text="Out-of-Scope" />
        <ReadinessItem label="สิ่งที่ส่งมอบ" isReady={contentFlags.hasDeliverables} text="Deliverables" />
        <ReadinessItem label="เกณฑ์ตรวจรับ" isReady={contentFlags.hasAcceptance} text="Acceptance Criteria" />
        <ReadinessItem label="เงื่อนไขเพิ่มเติม" isReady={contentFlags.hasAssumptions} text="Assumptions" />
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
          <span className="text-xs text-text-dim uppercase tracking-wider">สิ่งที่ยังไม่ชัดเจน</span>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasQuestions ? 'text-warning' : 'text-text-dim'}`}>
            {contentFlags.hasQuestions ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {contentFlags.hasQuestions ? 'มีคำถาม/สมมติฐาน' : 'เคลียร์แล้ว'}
          </span>
        </div>
        <ReadinessItem label="ใบเสนอราคา" isReady={quotationDocs > 0} text="Quotation" />
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
          <span className="text-xs text-text-dim uppercase tracking-wider">ใบแจ้งหนี้</span>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${invoiceDocs > 0 ? 'text-success' : 'text-text-dim'}`}>
            {invoiceDocs > 0 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            Invoice
          </span>
        </div>
        <ReadinessItem label="อนุมัติแล้ว" isReady={approvedDocs >= 2} text={`Approval (${approvedDocs})`} />
      </div>
    </div>
  );
}

function ReadinessItem({ label, isReady, text }: { label: string; isReady: boolean; text: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
      <span className="text-xs text-text-dim uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold flex items-center gap-1.5 ${isReady ? 'text-success' : 'text-warning'}`}>
        {isReady ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {text}
      </span>
    </div>
  );
}
