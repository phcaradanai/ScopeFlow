import { Briefcase, Plus, User, ArrowRight } from 'lucide-react';
import type { FileEntry } from '../lib/tauri-commands';
import { getProjectNodesForClient } from '../lib/workspace-scanner';
import PageShell from './ui/PageShell';

interface ClientOverviewProps {
  clientNode: FileEntry;
  clientId: string;
  onCreateProject: (clientId: string) => void;
  onOpenProject: (path: string) => void;
  onStartBriefIntake: (clientId: string) => void;
}

export default function ClientOverview({
  clientNode,
  clientId,
  onCreateProject,
  onOpenProject,
  onStartBriefIntake,
}: ClientOverviewProps) {
  const projects = getProjectNodesForClient(clientNode);

  const Header = (
    <div className="page-header-inner page-container-wide">
      <div className="page-title-group">
        <h1 className="page-title">
          <User className="w-7 h-7 text-accent shrink-0" />
          <span className="page-title-text">{clientNode.name}</span>
        </h1>
        <p className="page-subtitle">ภาพรวมลูกค้าและรายการโครงการ</p>
      </div>
      <div className="page-actions">
        <button onClick={() => onStartBriefIntake(clientId)} className="btn btn-ghost">
          เริ่มจากคำขอลูกค้า
        </button>
        <button onClick={() => onCreateProject(clientId)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> สร้างโปรเจกต์
        </button>
      </div>
    </div>
  );

  return (
    <PageShell header={Header}>
      <section className="card">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-text">โครงการของลูกค้ารายนี้</h2>
            <p className="text-sm text-text-dim mt-1">เลือกโครงการเพื่อดู Brief, Scope, Quote และเอกสารที่เกี่ยวข้อง</p>
          </div>
          <span className="badge badge-muted">{projects.length} โครงการ</span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <Briefcase className="w-10 h-10 text-text-dim mx-auto mb-3" />
            <h3 className="font-bold text-text">ยังไม่มีโครงการ</h3>
            <p className="text-sm text-text-dim mt-2">เริ่มจากคำขอลูกค้าเพื่อสร้าง Brief หรือสร้างโปรเจกต์เปล่า</p>
            <div className="mt-5 flex justify-center gap-3 flex-wrap">
              <button onClick={() => onStartBriefIntake(clientId)} className="btn btn-ghost">เริ่มจากคำขอลูกค้า</button>
              <button onClick={() => onCreateProject(clientId)} className="btn btn-primary">สร้างโปรเจกต์</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(project => (
              <button
                key={project.path}
                onClick={() => onOpenProject(project.path)}
                className="card card-hover !p-5 text-left group min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                      <Briefcase className="w-5 h-5 text-primary-light" />
                    </div>
                    <h3 className="font-bold text-text group-hover:text-primary-light transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-text-dim mt-2 truncate">{project.path}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-primary-light shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
