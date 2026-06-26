import { Plus, Play, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface MaintenanceActionsProps {
  onCreateClient: () => void;
  onRunHealthCheck: () => void;
  onBackupWorkspace: () => void;
  handleCreateDemo: () => void;
  handleOpenWorkspaceFolder: () => void;
}

export default function MaintenanceActions({ onCreateClient, onRunHealthCheck, onBackupWorkspace, handleCreateDemo, handleOpenWorkspaceFolder }: MaintenanceActionsProps) {
  return (
    <div className="card flex flex-col gap-4">
      <h3 className="text-base font-bold text-text border-b border-white/5 pb-3">
        การดูแล Workspace
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button onClick={onCreateClient} className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]">
          <Plus className="w-5 h-5 text-accent" />
          <span className="text-xs font-bold">สร้างลูกค้าใหม่</span>
        </button>
        <button onClick={handleCreateDemo} className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]">
          <Play className="w-5 h-5 text-primary-light" />
          <span className="text-xs font-bold">สร้าง Demo</span>
        </button>
        <button onClick={onRunHealthCheck} className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]">
          <ShieldCheck className="w-5 h-5 text-warning" />
          <span className="text-xs font-bold">ตรวจสอบ Workspace</span>
        </button>
        <button onClick={onBackupWorkspace} className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]">
          <Download className="w-5 h-5 text-success" />
          <span className="text-xs font-bold">สำรอง Workspace</span>
        </button>
        <button onClick={handleOpenWorkspaceFolder} className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]">
          <ExternalLink className="w-5 h-5 text-text-muted" />
          <span className="text-xs font-bold">เปิดโฟลเดอร์</span>
        </button>
      </div>
    </div>
  );
}
