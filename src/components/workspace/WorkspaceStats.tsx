import { Users, Briefcase, FileText, ShieldCheck } from 'lucide-react';
import StatCard from '../ui/StatCard';

interface WorkspaceStatsProps {
  clientsCount: number;
  projectsCount: number;
  documentsCount: number;
  approvedCount: number;
  lockedCount: number;
  healthStatus: 'OK' | 'Warning' | 'Error';
}

export default function WorkspaceStats({
  clientsCount,
  projectsCount,
  documentsCount,
  approvedCount,
  lockedCount,
  healthStatus
}: WorkspaceStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        icon={Users}
        label="ลูกค้าทั้งหมด"
        value={`${clientsCount} ราย`}
        iconColorClass="text-accent"
        iconBgClass="bg-accent/10 border-accent/20"
      />
      <StatCard
        icon={Briefcase}
        label="โครงการทั้งหมด"
        value={`${projectsCount} โครงการ`}
        iconColorClass="text-primary-light"
        iconBgClass="bg-primary/10 border-primary/20"
      />
      <StatCard
        icon={FileText}
        label="เอกสารทั้งหมด"
        value={
          <span className="flex items-baseline gap-2">
            {documentsCount}
            <span className="text-xs font-normal text-text-dim">
              ({approvedCount} อนุมัติ / {lockedCount} ล็อก)
            </span>
          </span>
        }
        iconColorClass="text-success"
        iconBgClass="bg-success/10 border-success/20"
      />
      <StatCard
        icon={ShieldCheck}
        label="สุขภาพ Workspace"
        value={healthStatus}
        iconColorClass={healthStatus === 'OK' ? 'text-success' : healthStatus === 'Warning' ? 'text-warning' : 'text-error'}
        iconBgClass={healthStatus === 'OK' ? 'bg-success/10 border-success/20' : healthStatus === 'Warning' ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'}
        valueColorClass={healthStatus === 'OK' ? 'text-success' : healthStatus === 'Warning' ? 'text-warning' : 'text-error'}
      />
    </div>
  );
}
