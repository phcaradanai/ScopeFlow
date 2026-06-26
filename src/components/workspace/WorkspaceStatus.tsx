import { ShieldCheck } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

interface WorkspaceStatusProps {
  companyProfileStatus: 'configured' | 'missing' | 'malformed';
  presetsStatus: 'configured' | 'missing' | 'malformed';
  lastBackup: string;
  latestExport: string;
}

export default function WorkspaceStatus({ companyProfileStatus, presetsStatus, lastBackup, latestExport }: WorkspaceStatusProps) {
  return (
    <div className="card flex flex-col gap-4">
      <h3 className="text-base font-bold text-text border-b border-white/5 pb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary-light" />
        สถานะข้อมูล
      </h3>

      <div className="space-y-4 text-sm flex-1">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">ข้อมูลบริษัท:</span>
          <StatusBadge variant={companyProfileStatus === 'configured' ? 'success' : companyProfileStatus === 'missing' ? 'warning' : 'error'}>
            {companyProfileStatus === 'configured' ? 'ตั้งค่าแล้ว' : companyProfileStatus === 'missing' ? 'ไม่มี' : 'ข้อมูลผิดพลาด'}
          </StatusBadge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-muted">เทมเพลตและพรีเซต:</span>
          <StatusBadge variant={presetsStatus === 'configured' ? 'success' : presetsStatus === 'missing' ? 'warning' : 'error'}>
            {presetsStatus === 'configured' ? 'ตั้งค่าแล้ว' : presetsStatus === 'missing' ? 'ไม่มี' : 'ข้อมูลผิดพลาด'}
          </StatusBadge>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">สำรองข้อมูลล่าสุด</p>
            <p className="text-xs font-semibold text-text-muted mt-1 font-mono truncate">{lastBackup}</p>
          </div>
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">ไฟล์ส่งออกล่าสุด</p>
            <p className="text-xs font-semibold text-text-muted mt-1 font-mono truncate">{latestExport}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
