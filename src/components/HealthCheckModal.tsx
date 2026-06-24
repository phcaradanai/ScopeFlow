import { useState, useEffect, useCallback } from 'react';
import { checkWorkspaceHealth, HealthIssue } from '../lib/workspace-health';
import { useWorkspace } from '../lib/workspace-context';
import { ShieldCheck, AlertTriangle, XCircle, Info, RefreshCw, X, FolderPlus, Plus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { generateWorkspaceConfig } from '../lib/templates';

interface HealthCheckModalProps {
  onClose: () => void;
}

export default function HealthCheckModal({ onClose }: HealthCheckModalProps) {
  const { workspacePath, tree, refreshTree } = useWorkspace();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const runCheck = useCallback(async () => {
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
  }, [workspacePath, tree]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const handleFixScopeflowYaml = async () => {
    try {
      if (!workspacePath) return;
      const folderName = workspacePath.split(/[/\\]/).pop() || 'ScopeFlow Workspace';
      const config = generateWorkspaceConfig(folderName);
      const yamlPath = `${workspacePath}/scopeflow.yaml`;
      await invoke('write_file_content', { path: yamlPath, content: config });
      await refreshTree();
      await runCheck();
    } catch (err) {
      alert(`สร้างไฟล์ไม่สำเร็จ: ${err}`);
    }
  };

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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-primary" />
              ตรวจสอบ Workspace
            </h2>
            <p className="modal-subtitle">สแกนและตรวจสอบโครงสร้างไฟล์ใน workspace</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
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
                      <div key={i} className="p-4 bg-error/10 border border-error/20 rounded-xl text-sm text-text flex items-center justify-between gap-4">
                        <span className="font-medium">{err.message}</span>
                        {err.fixAction === 'create_scopeflow_yaml' && (
                          <button
                            onClick={handleFixScopeflowYaml}
                            className="btn btn-sm text-error bg-error/20 border border-error/30 hover:bg-error hover:text-white shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> สร้างไฟล์สำหรับ Workspace
                          </button>
                        )}
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

        <div className="modal-footer flex-wrap">
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
