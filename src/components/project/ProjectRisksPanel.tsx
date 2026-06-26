import { AlertTriangle } from 'lucide-react';

interface ProjectRisksPanelProps {
  hasNoScope: boolean;
  hasNoQuote: boolean;
  openCRs: number;
  pendingApprovals: number;
}

export default function ProjectRisksPanel({
  hasNoScope,
  hasNoQuote,
  openCRs,
  pendingApprovals
}: ProjectRisksPanelProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
        <AlertTriangle className="w-4 h-4 text-warning" />
        ความเสี่ยง
      </h3>
      <div className="flex flex-col gap-2.5">
        {hasNoScope && (
          <p className="text-sm text-warning font-medium">ยังไม่มี Scope — ขาดข้อมูล cornerstone</p>
        )}
        {hasNoScope && hasNoQuote && (
          <p className="text-sm text-warning font-medium">ยังไม่มี Quote — ลูกค้าไม่รู้ราคา</p>
        )}
        {openCRs > 0 && (
          <p className="text-sm text-warning font-medium">{openCRs} รายการ CR ยังไม่ได้ปิด</p>
        )}
        {pendingApprovals > 0 && (
          <p className="text-sm text-warning font-medium">{pendingApprovals} รายการรอการอนุมัติ</p>
        )}
        {!hasNoScope && !hasNoQuote && openCRs === 0 && pendingApprovals === 0 && (
          <p className="text-sm text-success font-medium">ไม่มีความเสี่ยงเด่น — ทุกอย่างดูดี</p>
        )}
      </div>
    </div>
  );
}
