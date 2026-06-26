import { FileText } from 'lucide-react';

interface ProjectWorkflowStatsProps {
  draftDocs: number;
  approvedDocs: number;
  openCRs: number;
  openSUPs: number;
}

export default function ProjectWorkflowStats({
  draftDocs,
  approvedDocs,
  openCRs,
  openSUPs
}: ProjectWorkflowStatsProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
        <FileText className="w-4 h-4" />
        ขั้นตอนงาน
      </h3>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">Draft</span>
          <span className="badge badge-muted">{draftDocs} ฉบับร่าง</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">Approved</span>
          <span className="badge badge-success">{approvedDocs} อนุมัติแล้ว</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">CR/SUP</span>
          <span className="badge badge-warning">{(openCRs + openSUPs)} รายการ</span>
        </div>
      </div>
    </div>
  );
}
