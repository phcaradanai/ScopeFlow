import { useState, useEffect } from 'react';
import { checkWorkspaceHealth, HealthIssue } from '../lib/workspace-health';
import { useWorkspace } from '../lib/workspace-context';
import { ShieldCheck, AlertTriangle, XCircle, Info, RefreshCw, X, FolderPlus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface HealthCheckModalProps {
  onClose: () => void;
}

export default function HealthCheckModal({ onClose }: HealthCheckModalProps) {
  const { workspacePath, tree, refreshTree } = useWorkspace();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    if (!workspacePath || !tree) return;
    setLoading(true);
    try {
      const results = await checkWorkspaceHealth(workspacePath, tree);
      setIssues(results);
    } catch (err) {
      setIssues([{ type: 'error', message: `เกิดข้อผิดพลาด: ${err}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, [workspacePath, tree]);

  const handleFixFolders = async (payload: any) => {
    try {
      // Just create an empty .keep file to force folder creation
      for (const folder of payload.missingFolders) {
         const keepPath = `${payload.projectPath}/${folder}/.keep`;
         await invoke('write_file_content', { path: keepPath, content: '' });
      }
      await refreshTree();
      await runCheck();
    } catch (err) {
      alert(`Fix failed: ${err}`);
    }
  };

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-2 w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text">ตรวจสอบ Workspace</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-3 text-text-dim hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-text-muted">กำลังสแกนไฟล์และดัชนี...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Errors */}
              {errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-error flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> ข้อผิดพลาดร้ายแรง (Errors) ({errors.length})
                  </h3>
                  <div className="space-y-2">
                    {errors.map((err, i) => (
                      <div key={i} className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-text">
                        {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> ข้อควรระวัง (Warnings) ({warnings.length})
                  </h3>
                  <div className="space-y-2">
                    {warnings.map((warn, i) => (
                      <div key={i} className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-text flex items-center justify-between">
                        <span>{warn.message}</span>
                        {warn.fixAction === 'create_project_folders' && (
                          <button 
                            onClick={() => handleFixFolders(warn.payload)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-warning text-warning-foreground rounded-md text-xs font-medium hover:bg-warning/90 transition-colors"
                          >
                            <FolderPlus className="w-3.5 h-3.5" /> ซ่อมแซมโฟลเดอร์
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos */}
              {infos.length > 0 && errors.length === 0 && warnings.length === 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3 text-success">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-medium">Workspace สมบูรณ์ ไม่มีข้อผิดพลาดใดๆ</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface-3 rounded-b-2xl flex justify-between items-center">
          <p className="text-xs text-text-dim flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> ไม่มีการแก้ไขอัตโนมัติในส่วนที่อาจทำให้ข้อมูลสูญหาย
          </p>
          <div className="flex gap-3">
            <button
              onClick={runCheck}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-text bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> ตรวจสอบอีกครั้ง
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              ปิด (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
