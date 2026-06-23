import { open } from '@tauri-apps/plugin-dialog';
import { useWorkspace } from '../lib/workspace-context';
import { createWorkspace } from '../lib/tauri-commands';
import { generateWorkspaceConfig } from '../lib/templates';
import { FolderOpen, Plus, FileText } from 'lucide-react';

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

  return (
    <div className="h-full flex items-center justify-center bg-surface">
      <div className="max-w-lg w-full px-6 text-center">
        {/* Logo area */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">ScopeFlow Thai</h1>
          <p className="text-text-muted">
            ระบบจัดการเอกสารขอบเขตงาน สำหรับฟรีแลนซ์และทีมพัฒนาซอฟต์แวร์
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            สร้าง Workspace ใหม่
          </button>

          <button
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-text font-medium transition-all"
          >
            <FolderOpen className="w-5 h-5" />
            เปิด Workspace ที่มีอยู่
          </button>
        </div>

        {/* Description */}
        <div className="mt-8 text-xs text-text-dim space-y-1">
          <p>Offline-first • File-first • ไม่ต้องใช้อินเทอร์เน็ต</p>
          <p>ข้อมูลทั้งหมดเก็บเป็นไฟล์ Markdown/YAML ในเครื่องของคุณ</p>
        </div>
      </div>
    </div>
  );
}
