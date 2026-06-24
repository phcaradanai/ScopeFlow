import { open, ask } from '@tauri-apps/plugin-dialog';
import { useWorkspace } from '../lib/workspace-context';
import { createWorkspace, restoreWorkspace } from '../lib/tauri-commands';
import { generateWorkspaceConfig } from '../lib/templates';
import { generateDemoWorkspace } from '../lib/demo-generator';
import { FolderOpen, Plus, FileText, PackageOpen, Sparkles, CheckCircle } from 'lucide-react';

export default function WelcomeScreen() {
  const { setWorkspacePath } = useWorkspace();

  async function handleCreate() {
    const selected = await open({
      directory: true,
      title: 'เลือกตำแหน่งสร้าง Workspace ใหม่',
    });

    if (!selected) return;

    const path = typeof selected === 'string' ? selected : selected;
    const name = path.split('/').pop() || 'My Workspace';

    try {
      const config = generateWorkspaceConfig(name);
      await createWorkspace(path, name, config);
      setWorkspacePath(path);
    } catch (err) {
      alert(`สร้าง workspace ไม่สำเร็จ: ${err}`);
    }
  }

  async function handleOpen() {
    const selected = await open({
      directory: true,
      title: 'เปิด ScopeFlow Workspace',
    });

    if (!selected) return;

    const path = typeof selected === 'string' ? selected : selected;

    try {
      setWorkspacePath(path);
    } catch (err) {
      alert(`เปิด workspace ไม่สำเร็จ: ${err}`);
    }
  }

  async function handleCreateDemo() {
    const selected = await open({
      directory: true,
      title: 'เลือกตำแหน่งสร้าง Demo Workspace (จะสร้างในโฟลเดอร์ที่เลือก)',
    });

    if (!selected) return;
    const path = typeof selected === 'string' ? selected : selected;

    try {
      await generateDemoWorkspace(path, "Demo Workspace");
      setWorkspacePath(path);
    } catch (err) {
      alert(`สร้าง Demo ไม่สำเร็จ: ${err}`);
    }
  }

  async function handleRestoreBackup() {
    const selectedZip = await open({
      directory: false,
      multiple: false,
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }],
      title: 'เลือกไฟล์ Backup (.zip)',
    });

    if (!selectedZip) return;
    const zipPath = typeof selectedZip === 'string' ? selectedZip : selectedZip[0];

    const destDir = await open({
      directory: true,
      multiple: false,
      title: 'เลือกโฟลเดอร์สำหรับแตกไฟล์ Backup (ควรเป็นโฟลเดอร์ว่าง)',
    });

    if (!destDir) return;
    const destPath = typeof destDir === 'string' ? destDir : destDir[0];

    try {
      await restoreWorkspace(zipPath, destPath, false);
      setWorkspacePath(destPath);
      // Auto-trigger health check via event
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-health-check')), 500);
    } catch (err: any) {
      if (err === 'DIR_NOT_EMPTY' || (typeof err === 'string' && err.includes('DIR_NOT_EMPTY'))) {
        const confirm = await ask('โฟลเดอร์ปลายทางไม่ว่าง (มีไฟล์อยู่แล้ว) คุณต้องการเขียนทับไฟล์เดิมหรือไม่?', {
          title: 'ยืนยันการเขียนทับ',
          kind: 'warning'
        });
        if (confirm) {
          try {
            await restoreWorkspace(zipPath, destPath, true);
            setWorkspacePath(destPath);
            setTimeout(() => window.dispatchEvent(new CustomEvent('open-health-check')), 500);
          } catch (e2) {
            alert(`แตกไฟล์ Backup ไม่สำเร็จ: ${e2}`);
          }
        }
      } else {
        alert(`แตกไฟล์ Backup ไม่สำเร็จ: ${err}`);
      }
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-b from-[#121214] to-[#09090b] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-primary/30 via-accent/25 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse-slow opacity-80" />

      <div className="max-w-[560px] w-full px-8 text-center relative z-10">
        {/* Logo area */}
        <div className="mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-7 shadow-2xl shadow-primary/30 border border-white/10">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text mb-3 tracking-tight">ScopeFlow</h1>
          <p className="text-text-muted text-lg font-medium">
            เปลี่ยนคำขอลูกค้าให้เป็น Scope และใบเสนอราคา
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-primary text-white font-semibold transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-[0_8px_30px_-5px] hover:shadow-primary/40 hover:-translate-y-1 border border-primary-light/20 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            สร้าง Workspace ใหม่
          </button>

          <button
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-text font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm min-h-[48px]"
          >
            <FolderOpen className="w-5 h-5" />
            เปิด Workspace ที่มีอยู่
          </button>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={handleCreateDemo}
              disabled
              className="btn btn-ghost w-full opacity-40 cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              สร้าง Demo
            </button>
            <button
              onClick={handleRestoreBackup}
              disabled
              className="btn btn-ghost w-full opacity-40 cursor-not-allowed"
            >
              <PackageOpen className="w-4 h-4" />
              เปิดจาก Backup
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>บันทึกหลักฐานอนุมัติ</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>กันงานงอกด้วย CR/DCR</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>ข้อมูลอยู่ในเครื่องคุณ</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-sm text-text-dim/50 font-medium tracking-wide">
          <p>Offline-first • File-first</p>
        </div>
      </div>
    </div>
  );
}
