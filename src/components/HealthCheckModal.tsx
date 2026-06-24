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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text">ตรวจสอบ Workspace</h2>
          </div>
          <button onClick={onClose} className="btn btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-section-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              <p className="text-text-muted font-medium">กำลังสแกนไฟล์และดัชนี...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Errors */}
              {errors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-error flex items-center gap-2.5">
                    <XCircle className="w-5 h-5" /> ข้อผิดพลาดร้ายแรง ({errors.length})
                  </h3>
                  <div className="space-y-3">
                    {errors.map((err, i) => (
                      <div key={i} className="p-4 bg-error/10 border border-error/20 rounded-xl text-sm text-text font-medium">
                        {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-warning flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5" /> ข้อควรระวัง ({warnings.length})
                  </h3>
                  <div className="space-y-3">
                    {warnings.map((warn, i) => (
                      <div key={i} className="p-4 bg-warning/10 border border-warning/20 rounded-xl text-sm text-text flex items-center justify-between gap-4">
                        <span className="font-medium">{warn.message}</span>
                        {warn.fixAction === 'create_project_folders' && (
                          <button 
                            onClick={() => handleFixFolders(warn.payload)}
                            className="btn btn-sm text-warning bg-warning/20 border border-warning/30 hover:bg-warning hover:text-white shrink-0"
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
                  <div className="p-5 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3.5 text-success">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">Workspace สมบูรณ์ ไม่มีข้อผิดพลาดใดๆ</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-border bg-surface-3 shrink-0 flex justify-between items-center gap-4 flex-wrap">
          <p className="text-xs text-text-dim flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5" /> ไม่มีการแก้ไขอัตโนมัติในส่วนที่อาจทำให้ข้อมูลสูญหาย
          </p>
          <div className="flex gap-3">
            <button
              onClick={runCheck}
              disabled={loading}
              className="btn btn-ghost"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> ตรวจสอบอีกครั้ง
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
