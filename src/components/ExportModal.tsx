import { useState, useEffect } from 'react';
import { X, Check, FileDown, FolderOpen, ExternalLink } from 'lucide-react';
import { DocumentInfo } from '../lib/tauri-commands';
import { exportApprovalPack } from '../lib/export';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';

interface ExportModalProps {
  projectPath: string;
  projectName: string;
  clientName: string;
  documents: DocumentInfo[];
  onClose: () => void;
}

export default function ExportModal({
  projectPath,
  projectName,
  clientName,
  documents,
  onClose,
}: ExportModalProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessPath, setExportSuccessPath] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Default selection: latest scope, quotation, acceptance checklist
  useEffect(() => {
    const defaults = new Set<string>();

    const getLatestDoc = (folder: string, prefix: string) => {
      const docsInFolder = documents.filter(d => d.folder === folder && d.filename.startsWith(prefix));
      if (docsInFolder.length > 0) {
        // Sort descending by filename to get latest (assuming versioning or numbering in filename)
        docsInFolder.sort((a, b) => b.filename.localeCompare(a.filename));
        return docsInFolder[0].path;
      }
      return null;
    };

    const latestScope = getLatestDoc('baseline', 'scope-');
    if (latestScope) defaults.add(latestScope);

    const latestQuotation = getLatestDoc('baseline', 'quotation-');
    if (latestQuotation) defaults.add(latestQuotation);

    const latestAcceptance = getLatestDoc('acceptance', 'acceptance-checklist-');
    if (latestAcceptance) defaults.add(latestAcceptance);

    setSelectedDocs(defaults);
  }, [documents]);

  const handleToggleDoc = (path: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedDocs.size === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 เอกสาร');
      return;
    }

    try {
      setIsExporting(true);
      setError('');

      // Filter documents based on selection, preserve order from documents array
      const docsToExport = documents.filter(d => selectedDocs.has(d.path));
      
      const finalPath = await exportApprovalPack(projectPath, projectName, clientName, docsToExport);
      setExportSuccessPath(finalPath);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกเอกสาร');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenFile = async () => {
    if (exportSuccessPath) {
      try {
        await openPath(exportSuccessPath);
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    }
  };

  const handleRevealInFolder = async () => {
    if (exportSuccessPath) {
      try {
        // Tauri 2 `opener` plugin doesn't have a direct "reveal" method yet,
        // but we can try to open the folder containing it.
        // As a fallback, we invoke a custom rust command if we had one, but we don't.
        // So we just extract the directory path and open it.
        const dirPath = exportSuccessPath.substring(0, exportSuccessPath.lastIndexOf('/'));
        try {
          await revealItemInDir(exportSuccessPath);
        } catch {
          await openPath(dirPath);
        }
      } catch (err) {
        console.error("Failed to reveal folder:", err);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-container-sm">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2.5">
              <FileDown className="w-5 h-5 text-primary" />
              ส่งออกชุดเอกสารขออนุมัติ
            </h2>
            <p className="modal-subtitle">ส่งออกเป็น HTML พร้อมสั่งพิมพ์เป็น PDF</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          {exportSuccessPath ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-5">
              <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">ส่งออกสำเร็จ!</h3>
                <p className="text-sm text-text-muted mt-2 break-all px-2">
                  บันทึกไฟล์ไปที่:<br/>
                  <span className="font-mono text-xs text-text">{exportSuccessPath}</span>
                </p>
              </div>
              
              <div className="flex flex-col w-full max-w-xs gap-3 pt-2">
                <button
                  onClick={handleOpenFile}
                  className="btn btn-primary w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดไฟล์ HTML
                </button>
                <button
                  onClick={handleRevealInFolder}
                  className="btn btn-ghost w-full"
                >
                  <FolderOpen className="w-4 h-4" />
                  เปิดโฟลเดอร์ Exports
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-muted">
                เลือกเอกสารที่ต้องการรวมไว้ในชุดเอกสารขออนุมัติ ระบบจะสร้างไฟล์ HTML ที่พร้อมสำหรับสั่งพิมพ์ (Print) เป็น PDF
              </p>
              
              <div className="space-y-2 border border-border rounded-xl overflow-hidden bg-surface">
                {documents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-dim">
                    ไม่มีเอกสารในโครงการนี้
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = selectedDocs.has(doc.path);
                    return (
                      <label
                        key={doc.path}
                        className={`flex items-start gap-3 p-4 hover:bg-surface-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleDoc(doc.path)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-surface bg-surface"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-text truncate" title={doc.filename}>
                            {doc.filename}
                          </div>
                          <div className="text-xs text-text-dim capitalize">
                            {doc.folder.replace('-', ' ')}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {!exportSuccessPath && (
          <div className="modal-footer">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="btn btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || documents.length === 0}
              className="btn btn-primary"
            >
              {isExporting ? 'กำลังส่งออก...' : 'ส่งออก HTML'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
